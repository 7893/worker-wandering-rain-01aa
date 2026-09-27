export const styleCss = `
:root {
  color-scheme: light;
  --paper: #eeeae3;
  --ink: #343930;
  --muted: #64685d;
  --line: #36413025;
  font-family: Arial, Helvetica, sans-serif;
  font-synthesis: none;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  min-width: 280px;
}
a {
  color: inherit;
  text-decoration: none;
}
button {
  font: inherit;
}
::selection {
  background: #b9bd9f80;
}
.gallery {
  max-width: 1600px;
  margin: auto;
  padding: 38px 5.5vw 26px;
}
.masthead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--line);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  letter-spacing: -0.03em;
}
.mark {
  width: 18px;
  height: 22px;
  border: 1px solid #757965;
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  position: relative;
}
.mark:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: -4px;
  right: -4px;
  border-top: 1px solid #757965;
}
.edition,
.eyebrow,
.zone,
.index,
.place,
.gallery-caption,
.scale-labels {
  font:
    10px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.13em;
}
.edition {
  color: var(--muted);
}
.edition-number {
  margin-left: 22px;
}
.introduction {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 46px 0 40px;
  gap: 30px;
}
h1 {
  font:
    400 clamp(45px, 5.4vw, 78px)/0.98 Georgia,
    "Times New Roman",
    serif;
  letter-spacing: -0.055em;
  margin: 0;
}
h1 em {
  font-weight: 400;
  color: #797e68;
}
.curator {
  padding: 0 1px 4px 0;
}
.eyebrow {
  font-size: 9px;
  color: #737868;
}
.curator p {
  font:
    14px/1.7 Georgia,
    "Times New Roman",
    serif;
  margin: 14px 0 0;
  color: #606557;
}
.exhibits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.exhibit {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 440px;
  height: clamp(400px, 39vw, 530px);
  border: 1px solid #4d5d3617;
  border-radius: 2px;
  background: radial-gradient(ellipse at 50% 20%, #e1e5cd, #d0d6c5 70%);
  box-shadow: 0 12px 30px -25px #29332630;
}
.exhibit.hkt {
  background: radial-gradient(ellipse at 50% 20%, #f6e2c4, #e1c7af 70%);
}
.light {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
.exhibit-heading {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 26px 28px;
  color: #454c3a;
}
.index {
  font-size: 9px;
  opacity: 0.65;
}
h2 {
  font:
    400 16px Georgia,
    "Times New Roman",
    serif;
  letter-spacing: -0.02em;
  margin: 0;
}
.zone {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: 0.05em;
  opacity: 0.8;
}
.clock {
  position: absolute;
  inset: auto 20px 95px;
  text-align: center;
}
.place {
  font-size: 9px;
  color: #545c48;
  margin: 0 0 19px;
  letter-spacing: 0.15em;
  min-height: 14px;
}
#day-offset {
  letter-spacing: 0.03em;
  font-size: 8px;
  display: inline-block;
  margin-left: 5px;
}
.time-row {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  padding-right: 22px;
  padding-left: 22px;
}
.digits {
  font:
    400 clamp(74px, 8.7vw, 130px)/0.85 Georgia,
    "Times New Roman",
    serif;
  font-variant-numeric: lining-nums tabular-nums;
  letter-spacing: -0.068em;
  color: #343d2e;
  text-shadow: 0 1px 1px #ffffff30;
  white-space: nowrap;
}
.hkt .digits {
  color: #503c2e;
}
.seconds {
  font:
    10px/1 ui-monospace,
    Consolas,
    monospace;
  position: absolute;
  right: -3px;
  bottom: 5px;
  color: #565b4a;
  min-width: 2ch;
  letter-spacing: 0.02em;
}
.date {
  font:
    11px/1.5 ui-monospace,
    Consolas,
    monospace;
  margin: 22px 0 0;
  letter-spacing: 0.015em;
  color: #555d4b;
}
.hkt .place,
.hkt .seconds,
.hkt .date {
  color: #705646;
}
.day-scale {
  position: absolute;
  bottom: 28px;
  left: 32px;
  right: 32px;
}
.scale-track {
  height: 7px;
  border-top: 1px solid #35432b30;
  background: repeating-linear-gradient(
    90deg,
    #35432b30 0 1px,
    transparent 1px calc(100% / 48)
  );
  background-size: 100% 3px;
  background-repeat: no-repeat;
}
.scale-position {
  position: absolute;
  top: -3px;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4b5940;
  box-shadow: 0 0 0 4px #e9eddd70;
  transform: translateX(-50%);
}
.hkt .scale-position {
  background: #806045;
  box-shadow: 0 0 0 4px #f6e6d970;
}
.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #616950;
  font-size: 8px;
  letter-spacing: 0;
}
.hkt .scale-labels {
  color: #866c55;
}
.gallery-caption {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 19px 0;
  color: #727565;
  font-size: 8px;
  letter-spacing: 0.12em;
}
.caption-rule {
  height: 1px;
  flex: 1;
  background: var(--line);
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  gap: 18px;
}
.signature {
  font:
    13px Georgia,
    "Times New Roman",
    serif;
  color: #696c5c;
}
.signature em {
  color: #3f4936;
}
button {
  border: 0;
  background: transparent;
  color: #565e4b;
  font-size: 11px;
  cursor: pointer;
  padding: 8px 0 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
button[hidden] {
  display: none;
}
.motion-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7c8969;
}
button[aria-pressed="true"] .motion-dot {
  background: transparent;
  border: 1px solid #7c8969;
}
a:focus-visible,
button:focus-visible {
  outline: 2px solid #586f49;
  outline-offset: 7px;
}
.no-script {
  font-size: 12px;
  color: var(--muted);
}
.changed {
  animation: minute-arrival 0.65s ease-out;
}
@keyframes minute-arrival {
  from {
    opacity: 0.65;
    filter: blur(1px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
@media (min-width: 1600px) {
  .gallery {
    padding-left: 88px;
    padding-right: 88px;
  }
}
@media (max-width: 850px) {
  .gallery {
    padding: 24px 5vw;
  }
  .introduction {
    padding: 34px 0;
  }
  .exhibits {
    gap: 14px;
  }
  .exhibit-heading {
    padding: 20px 18px;
    gap: 8px;
  }
  .exhibit {
    min-height: 370px;
    height: 390px;
  }
  .digits {
    font-size: 9vw;
  }
  .zone {
    font-size: 8px;
  }
  h2 {
    font-size: 14px;
  }
  .clock {
    left: 10px;
    right: 10px;
  }
  .place {
    font-size: 8px;
    letter-spacing: 0.07em;
  }
  .day-scale {
    left: 24px;
    right: 24px;
  }
  .curator p {
    font-size: 13px;
  }
}
@media (max-width: 620px) {
  .gallery {
    padding: 23px 22px;
  }
  .brand {
    font-size: 13px;
  }
  .edition {
    font-size: 8px;
    letter-spacing: 0.06em;
  }
  .edition-number {
    display: none;
  }
  .masthead {
    padding-bottom: 20px;
  }
  .introduction {
    padding: 32px 0 28px;
    align-items: center;
    gap: 14px;
  }
  h1 {
    font-size: 46px;
  }
  .curator {
    max-width: 100px;
  }
  .eyebrow {
    font-size: 7px;
    letter-spacing: 0.07em;
  }
  .curator p {
    font-size: 11px;
    line-height: 1.6;
    margin-top: 8px;
  }
  .exhibits {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .exhibit {
    height: 354px;
    min-height: 0;
  }
  .exhibit-heading {
    padding: 21px 22px;
  }
  h2 {
    font-size: 16px;
  }
  .zone {
    font-size: 9px;
  }
  .digits {
    font-size: clamp(80px, 21vw, 120px);
  }
  .clock {
    bottom: 88px;
  }
  .place {
    font-size: 8px;
    margin-bottom: 17px;
  }
  .date {
    font-size: 10px;
    margin-top: 20px;
  }
  .day-scale {
    bottom: 25px;
  }
  .gallery-caption {
    font-size: 7px;
    gap: 10px;
    letter-spacing: 0.04em;
  }
  .gallery-caption span:last-child {
    max-width: 80px;
    text-align: right;
  }
  footer {
    margin-top: 17px;
  }
  .signature {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .changed {
    animation: none;
  }
}
`;
