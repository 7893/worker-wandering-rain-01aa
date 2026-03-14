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
  background-color: var(--fallback-bg, #1a1a1a);
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
  animation: fadein 0.6s ease forwards;
}

.hex-wrapper {
  position: relative;
  display: inline-block;
}

.time-divider {
  width: 100%;
  height: 1px;
  background: var(--text);
  opacity: 0.3;
  transition: background 0.8s ease;
  margin: 0.1em 0 0.2em;
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
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

.color-count {
  position: absolute;
  top: -0.8em;
  left: 100%;
  margin-left: 0.3em;
  font-family: 'Orbitron', monospace;
  font-size: 0.45em;
  font-weight: 400;
  color: var(--text);
  opacity: 0.45;
  letter-spacing: 0.1em;
  line-height: 1;
  white-space: nowrap;
}

@keyframes flip-char {
  0%   { transform: scaleY(0.1); opacity: 0.3; }
  100% { transform: scaleY(1);   opacity: 1; }
}
`;
