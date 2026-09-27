import { vertexShader, fragmentShader } from "./shaders";

export const rendererJs = `
function createLight(canvas, warm) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  let program = null, buffer = null, uniforms;
  let frame = 0, paused = true, lost = false, previous = 0, elapsed = 0, hour = 12;
  let width = 1, height = 1;
  function release() {
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    program = buffer = null;
  }
  function initialize() {
    if (!gl) return false;
    const shaders = [];
    try {
      program = gl.createProgram();
      const high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision > 0;
      for (const [kind, source] of [[gl.VERTEX_SHADER, ${JSON.stringify(vertexShader)}], [gl.FRAGMENT_SHADER, ${JSON.stringify(fragmentShader)}.replace('precision highp float;', high ? 'precision highp float;' : 'precision mediump float;')]]) {
        const shader = gl.createShader(kind);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Light rendering unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(['u_size','u_time','u_hour','u_warm'].map(name => [name, gl.getUniformLocation(program, name)]));
      canvas.hidden = false;
      canvas.dataset.renderer = 'webgl';
      return true;
    } catch (error) {
      release();
      canvas.hidden = true;
      canvas.dataset.renderer = 'css';
      return false;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }
  function draw() {
    if (!program || lost) return;
    gl.uniform2f(uniforms.u_size, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time, elapsed);
    gl.uniform1f(uniforms.u_hour, hour);
    gl.uniform1f(uniforms.u_warm, warm);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function resize() {
    if (!program || lost) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.75, Math.sqrt(900000 / Math.max(1, width * height)));
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function tick(now) {
    frame = 0;
    if (paused || lost || !program || document.hidden) return;
    if (!previous || now - previous >= 32) {
      if (previous) elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0; previous = 0;
    if (!paused && !lost && program && !document.hidden) frame = requestAnimationFrame(tick);
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; canvas.hidden = true; canvas.dataset.renderer = 'lost'; sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    if (initialize()) { resize(); sync(); }
  });
  document.addEventListener('visibilitychange', sync);
  const available = initialize();
  if (available) {
    resize();
    new ResizeObserver(resize).observe(canvas.parentElement);
  } else {
    canvas.hidden = true; canvas.dataset.renderer = 'css';
  }
  return {
    available,
    setHour(value) { hour = value; if (paused) draw(); },
    setPaused(value) { paused = value; sync(); draw(); },
  };
}
`;
