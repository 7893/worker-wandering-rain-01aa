export const scriptJs = `
(function () {
  // 从全局变量获取初始颜色，如果未定义则默认为黑色
  const initialServerColor = window.INITIAL_COLOR || '#000000';
  
  const canvas = document.getElementById('gl-canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  }) || canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });

  let program = null;
  let uColor = null;
  const currentColor = [0, 0, 0];
  const targetColor = [0, 0, 0];
  let animFrame = 0;
  let isRendering = false;

  function hex2rgb(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substr(0, 2), 16) / 255,
      parseInt(h.substr(2, 2), 16) / 255,
      parseInt(h.substr(4, 2), 16) / 255
    ];
  }

  function initGL() {
    if (!gl) return false;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision mediump float;uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}');
    gl.compileShader(fs);
    
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('GL link failed');
      return false;
    }
    
    gl.useProgram(program);
    
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    
    const pos = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    
    uColor = gl.getUniformLocation(program, 'c');
    return true;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setColor(hex, immediate) {
    const rgb = hex2rgb(hex);
    targetColor[0] = rgb[0];
    targetColor[1] = rgb[1];
    targetColor[2] = rgb[2];
    if (immediate) {
      currentColor[0] = rgb[0];
      currentColor[1] = rgb[1];
      currentColor[2] = rgb[2];
    }
    // 更新 CSS 变量以改变背景色
    document.documentElement.style.setProperty('--bg-color', hex);
    document.title = hex;
    const svg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' + hex.replace('#', '%23') + '"/></svg>';
    const favicon = document.getElementById('favicon');
    if (favicon) favicon.setAttribute('href', svg);
  }

  function render() {
    if (!gl || !program) return;
    
    const speed = 0.1;
    currentColor[0] += (targetColor[0] - currentColor[0]) * speed;
    currentColor[1] += (targetColor[1] - currentColor[1]) * speed;
    currentColor[2] += (targetColor[2] - currentColor[2]) * speed;
    
    gl.clearColor(currentColor[0], currentColor[1], currentColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(uColor, currentColor);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    animFrame = requestAnimationFrame(render);
  }

  function startRendering() {
    if (!isRendering) {
        isRendering = true;
        render();
    }
  }

  function stopRendering() {
    if (isRendering) {
        isRendering = false;
        cancelAnimationFrame(animFrame);
    }
  }

  // Page Visibility API: 页面不可见时停止渲染
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopRendering();
    } else {
        startRendering();
    }
  });

  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  function randomHSL() {
    return {
      h: Math.floor(Math.random() * 360),
      s: Math.floor(Math.random() * 20 + 70),
      l: Math.floor(Math.random() * 20 + 40)
    };
  }

  async function sendColor(hex, src) {
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: hex, trace_id: crypto.randomUUID(), source: src })
      });
    } catch (e) {
      console.error('Send failed:', e);
    }
  }

  function updateTime() {
    const now = new Date();
    const utc = now.toISOString().substring(0, 19).replace('T', ' ');
    const utc8 = new Date(now.getTime() + 8 * 3600000).toISOString().substring(0, 19).replace('T', ' ');
    document.getElementById('time-utc').textContent = utc + ' UTC+0';
    document.getElementById('time-utc8').textContent = utc8 + ' UTC+8';
  }

  function changeColor(src) {
    const { h, s, l } = randomHSL();
    const hex = hslToHex(h, s, l);
    setColor(hex, false);
    sendColor(hex, src);
  }

  // Init
  setColor(initialServerColor, true);
  
  if (initGL()) {
    resize();
    window.addEventListener('resize', resize);
    startRendering();
  } else {
    canvas.style.display = 'none';
  }

  updateTime();
  setInterval(updateTime, 1000);

  let lastAutoChange = 0;
  let lastClickChange = 0;
  const CLICK_COOLDOWN = 100; 

  setInterval(() => {
    const now = Date.now();
    if (new Date().getSeconds() % 5 === 0 && now - lastAutoChange > 4000) {
      lastAutoChange = now;
      changeColor('a');
    }
  }, 1000);

  document.body.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClickChange > CLICK_COOLDOWN) {
      lastClickChange = now;
      changeColor('c');
    }
  });

  setTimeout(() => sendColor(initialServerColor, 'i'), 100);
})();
`;