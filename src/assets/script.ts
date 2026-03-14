export const scriptJs = `
(function () {
  const initialServerColor = window.INITIAL_COLOR || '#000000';
  let currentHex = initialServerColor;

  // ── WebGL ──────────────────────────────────────────────
  const canvas = document.getElementById('gl-canvas');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' })
           || canvas.getContext('webgl',  { alpha: false, antialias: false, powerPreference: 'high-performance' });

  let program = null, uOldColor = null, uNewColor = null, uProgress = null;
  const currentColor = [0, 0, 0], targetColor = [0, 0, 0];
  let progress = 1.0, animFrame = 0, isRendering = false;

  function hex2rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0,2),16)/255, parseInt(h.substr(2,2),16)/255, parseInt(h.substr(4,2),16)/255];
  }

  function initGL() {
    if (!gl) return false;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision mediump float;uniform vec3 uOld;uniform vec3 uNew;uniform float uProg;void main(){gl_FragColor=vec4(mix(uOld,uNew,uProg),1.);}');
    gl.compileShader(fs);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error('GL link failed'); return false; }
    gl.useProgram(program);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    uOldColor = gl.getUniformLocation(program, 'uOld');
    uNewColor = gl.getUniformLocation(program, 'uNew');
    uProgress = gl.getUniformLocation(program, 'uProg');
    return true;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  let transitionSpeed = 0.018;

  function render() {
    if (!gl || !program) return;
    if (progress < 1.0) progress = Math.min(progress + transitionSpeed, 1.0);
    const e = progress < 0.5 ? 2*progress*progress : -1+(4-2*progress)*progress;
    gl.uniform3fv(uOldColor, currentColor);
    gl.uniform3fv(uNewColor, targetColor);
    gl.uniform1f(uProgress, e);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    animFrame = requestAnimationFrame(render);
  }

  function startRendering() { if (!isRendering) { isRendering = true; render(); } }
  function stopRendering()  { if (isRendering)  { isRendering = false; cancelAnimationFrame(animFrame); } }

  document.addEventListener('visibilitychange', () => document.hidden ? stopRendering() : startRendering());

  // ── Color ──────────────────────────────────────────────
  function setColor(hex, immediate) {
    const rgb = hex2rgb(hex);
    if (immediate) {
      currentColor[0] = targetColor[0] = rgb[0];
      currentColor[1] = targetColor[1] = rgb[1];
      currentColor[2] = targetColor[2] = rgb[2];
      progress = 1.0;
    } else {
      currentColor[0] = targetColor[0]; currentColor[1] = targetColor[1]; currentColor[2] = targetColor[2];
      targetColor[0] = rgb[0]; targetColor[1] = rgb[1]; targetColor[2] = rgb[2];
      progress = 0.0;
    }
    document.title = hex;
    const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    const textColor = lum > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
    document.documentElement.style.setProperty('--text', textColor);
    document.querySelectorAll('.time-display, .fc-label').forEach(el => {
      el.style.transition = 'color 0.8s ease';
      el.style.color = textColor;
    });
    const svg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' + hex.replace('#','%23') + '"/></svg>';
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.setAttribute('href', svg);
  }

  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1-l) / 100;
    const f = n => { const k=(n+h/30)%12, c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
    return '#' + f(0) + f(8) + f(4);
  }

  let lastHue = -1;
  let hueDirection = 1; // 1=顺时针, -1=逆时针

  function randomHSL() {
    let step = 0;
    if (lastHue < 0) {
      lastHue = Math.floor(Math.random() * 360);
    } else {
      if (Math.random() < 0.2) hueDirection *= -1;
      step = 15 + Math.floor(Math.random() * 45);
      lastHue = (lastHue + hueDirection * step + 360) % 360;
    }
    const h = lastHue;
    const lastL = randomHSL._lastL || 50;
    const l = Math.min(62, Math.max(38, lastL + (Math.random() * 16 - 8)));
    randomHSL._lastL = l;
    const s = Math.max(60, Math.floor(75 - (l - 40) * 0.5 + Math.random() * 10));
    return { h, s, l: Math.floor(l), step };
  }

  async function sendColor(hex, src) {
    try {
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: hex, trace_id: crypto.randomUUID(), source: src }) });
    } catch (e) { console.error('Send failed:', e); }
  }

  // ── Flip display ───────────────────────────────────────
  function buildRow(el, chars, suffix) {
    el.innerHTML = '';
    chars.forEach(c => {
      if (c === ' ') {
        const sp = document.createElement('span');
        sp.className = 'fc-space';
        el.appendChild(sp);
      } else {
        const span = document.createElement('span');
        span.className = 'fc';
        span.textContent = c;
        el.appendChild(span);
      }
    });
    if (suffix) {
      const lbl = document.createElement('span');
      lbl.className = 'fc-label';
      lbl.textContent = suffix;
      el.appendChild(lbl);
    }
  }

  function updateRow(el, chars) {
    let fi = 0;
    const fcs = el.querySelectorAll('.fc');
    chars.forEach(c => {
      if (c === ' ') return;
      const span = fcs[fi++];
      if (!span || span.textContent === c) return;
      span.style.animation = 'none';
      span.offsetHeight;
      span.textContent = c;
      span.style.animation = 'flip-char 0.15s ease-out';
    });
  }

  function renderTime(elId, str, suffix) {
    const el = document.getElementById(elId);
    const chars = str.toUpperCase().split('');
    const nonSpace = chars.filter(c => c !== ' ').length;
    el.querySelectorAll('.fc').length !== nonSpace ? buildRow(el, chars, suffix) : updateRow(el, chars);
  }

  function updateTime() {
    const now = new Date();
    const utc  = now.toISOString().substring(0,19).replace('T','  ');
    const utc8 = new Date(now.getTime() + 8*3600000).toISOString().substring(0,19).replace('T','  ');
    renderTime('time-utc',  utc,  'UTC');
    renderTime('time-utc8', utc8, 'HKT');
  }

  function changeColor(src) {
    const { h, s, l, step } = randomHSL();
    const hex = hslToHex(h, s, l);
    transitionSpeed = step > 40 ? 0.012 : step > 20 ? 0.018 : 0.025;
    currentHex = hex;
    setColor(hex, false);
    renderTime('time-hex', hex.toUpperCase(), '');
    sendColor(hex, src);
  }

  // ── Init ───────────────────────────────────────────────
  setColor(initialServerColor, true);
  renderTime('time-hex', initialServerColor.toUpperCase(), '');

  if (initGL()) {
    resize();
    window.addEventListener('resize', resize);
    startRendering();
  } else {
    canvas.style.display = 'none';
  }

  updateTime();
  setInterval(updateTime, 1000);

  let lastClickChange = 0;
  const CLICK_COOLDOWN = 100;

  function scheduleAutoChange() {
    const delay = 3000 + Math.random() * 5000; // 3~8秒随机
    setTimeout(() => {
      if (!document.hidden) changeColor('a');
      scheduleAutoChange();
    }, delay);
  }
  scheduleAutoChange();

  function onTap() {
    const now = Date.now();
    if (now - lastClickChange > CLICK_COOLDOWN) { lastClickChange = now; changeColor('c'); }
  }

  document.body.addEventListener('click', onTap);
  document.body.addEventListener('touchend', (e) => { e.preventDefault(); onTap(); }, { passive: false });
  document.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); changeColor('k'); } });

  setTimeout(() => sendColor(initialServerColor, 'i'), 100);
})();
`;
