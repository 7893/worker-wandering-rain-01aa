export const styleCss = `
:root {
  --bg-color: #000000;
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  transition: background-color 0.8s;
  font-family: sans-serif;
  cursor: pointer;
  text-align: center;
  gap: 0.5em;
  overflow: hidden;
}

canvas#gl-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

.overlay {
  position: relative;
  z-index: 1;
  pointer-events: none; /* 允许点击穿透到 body */
}

.time-display {
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  margin: 0;
  padding: 0.1em 0;
  line-height: 1.2;
}
`;