export const styleCss = `
:root {
  --text: rgba(255, 255, 255, 0.85);
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: transparent;
  cursor: pointer;
  overflow: hidden;
  padding: 2em;
  box-sizing: border-box;
  touch-action: manipulation;
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
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5em;
}

#time-hex {
  padding-bottom: 0.5em;
  border-bottom: 1px solid var(--text);
  opacity: 0.3;
  width: 100%;
}

#time-hex:not(:empty) {
  opacity: 1;
}

.time-display {
  display: flex;
  align-items: baseline;
  gap: 0;
}

.fc {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: var(--text);
  text-shadow: 0 0 12px currentColor;
  display: inline-block;
  width: 1ch;
  text-align: center;
  opacity: 0.5;
}

#time-hex .fc {
  font-size: clamp(1.1rem, 1.8vw, 2.2rem);
  text-shadow: 0 0 24px currentColor, 0 0 48px currentColor;
}

#time-utc .fc, #time-utc8 .fc {
  font-size: clamp(1.1rem, 1.8vw, 2.2rem);
  font-weight: 400;
  opacity: 0.5;
}

.fc-space { width: 0.4em; }

.fc-label {
  font-family: 'Orbitron', monospace;
  font-size: 0.45em;
  font-weight: 400;
  color: var(--text);
  opacity: 0.4;
  letter-spacing: 0.15em;
  margin-left: 0.5em;
  align-self: center;
}

@keyframes flip-char {
  0%   { transform: scaleY(0.1); opacity: 0.3; }
  100% { transform: scaleY(1);   opacity: 1; }
}
`;
