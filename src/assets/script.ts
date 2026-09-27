import { rendererJs } from './renderer';

export const scriptJs = `
/* v2 */
(function () {
  const initialServerColor = window.INITIAL_COLOR || '#000000';

  ${rendererJs}
  const background = createColorRenderer(document.getElementById('gl-canvas'));
  let transitionSpeed = 0.018;

  // ── Color ──────────────────────────────────────────────
  function setColor(hex, immediate) {
    background.setColor(hex, immediate, transitionSpeed);
    document.title = hex;
    document.documentElement.style.setProperty('--fallback-bg', hex);
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

  // ── Audio ──────────────────────────────────────────────
  let audioCtx = null;
  function playTone(hex) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
      const freq = 220 + lum * 440; // 220~660Hz，亮色高音
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
  }

  // ── Color count ────────────────────────────────────────
  let colorCount = 0;

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
    colorCount++;
    setColor(hex, false);
    renderTime('time-hex', hex.toUpperCase(), '');
    const cc = document.getElementById('color-count');
    if (cc) cc.textContent = '#' + String(colorCount).padStart(4, '0');
    if (src !== 'i') playTone(hex);
  }

  // ── Init ───────────────────────────────────────────────
  setColor(initialServerColor, true);
  renderTime('time-hex', initialServerColor.toUpperCase(), '');

  updateTime();
  setInterval(updateTime, 1000);

  let lastClickChange = 0;
  const CLICK_COOLDOWN = 800;

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
  document.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); onTap(); } });

})();
`;
