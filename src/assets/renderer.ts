export const rendererJs = `
function createColorRenderer(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  const currentColor = [0, 0, 0], targetColor = [0, 0, 0];
  let program, buffer, uOld, uNew, uProgress;
  let progress = 1, duration = 1000 / (60 * .018), previous = 0, frame = 0, lost = false;

  function dispose() {
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    program = buffer = null;
  }
  function initialize() {
    if (!gl) return false;
    const shaders = [];
    try {
      program = gl.createProgram();
      for (const [type, source] of [
        [gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'],
        [gl.FRAGMENT_SHADER, 'precision mediump float;uniform vec3 uOld;uniform vec3 uNew;uniform float uProg;void main(){gl_FragColor=vec4(mix(uOld,uNew,uProg),1.);}']
      ]) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Color shader unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uOld = gl.getUniformLocation(program, 'uOld');
      uNew = gl.getUniformLocation(program, 'uNew');
      uProgress = gl.getUniformLocation(program, 'uProg');
      // A uniform color needs only one pixel; CSS fills the viewport exactly.
      canvas.width = canvas.height = 1;
      gl.viewport(0, 0, 1, 1);
      canvas.style.display = '';
      return true;
    } catch {
      dispose();
      return false;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }
  function render(now) {
    frame = 0;
    if (!program || lost || document.hidden) return;
    if (previous) progress = Math.min(1, progress + (now - previous) / duration);
    previous = now;
    const eased = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    gl.uniform3fv(uOld, currentColor);
    gl.uniform3fv(uNew, targetColor);
    gl.uniform1f(uProgress, eased);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (progress < 1) frame = requestAnimationFrame(render);
  }
  function start() {
    if (!frame && program && !lost && !document.hidden) {
      previous = 0;
      frame = requestAnimationFrame(render);
    }
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    stop();
    canvas.style.display = 'none';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    if (initialize()) start();
    else canvas.style.display = 'none';
  });
  if (!initialize()) canvas.style.display = 'none';
  return {
    setColor(hex, immediate, speed) {
      const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
      for (let i = 0; i < 3; i++) {
        currentColor[i] = immediate ? rgb[i] : targetColor[i];
        targetColor[i] = rgb[i];
      }
      duration = 1000 / (60 * speed);
      progress = immediate ? 1 : 0;
      previous = 0;
      start();
    }
  };
}
`;
