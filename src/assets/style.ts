export const styleCss = `
:root {
  color-scheme: dark;
  --bg: #181b18;
  --ink: #e3e0cf;
  --muted: #a1a495;
  --accent: #d27b50;
  --paper: #d9d7bc;
  font-family: Arial, Helvetica, sans-serif;
  font-synthesis: none;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-width: 280px;
  background: var(--bg);
  color: var(--ink);
}
a {
  color: inherit;
  text-decoration: none;
}
button {
  font: inherit;
}
::selection {
  background: #b86740;
  color: #fff;
}
.workshop {
  max-width: 1600px;
  padding: 30px 5.5vw 27px;
  margin: auto;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e3e0cf22;
  padding-bottom: 23px;
  gap: 16px;
}
.brand,
.serial,
.eyebrow,
.small,
.machine-label,
.machine-footer,
.head-number,
.read-caption > span,
.date,
.day-offset,
.legend,
.footer-mark,
.feed-tag {
  font:
    10px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.1em;
}
.brand {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.13em;
}
.brand-mark {
  color: var(--accent);
  font-size: 22px;
  letter-spacing: -0.1em;
}
.serial {
  color: #8a8f80;
  font-size: 9px;
}
.introduction {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 42px 0 39px;
  gap: 25px;
}
.eyebrow {
  font-size: 9px;
  margin: 0 0 20px;
  color: #a4a796;
  display: flex;
  align-items: center;
  gap: 9px;
}
.status-dot {
  width: 5px;
  height: 5px;
  background: var(--accent);
  border-radius: 50%;
}
h1 {
  font:
    600 clamp(68px, 8.7vw, 126px)/0.84 Arial,
    Helvetica,
    sans-serif;
  letter-spacing: -0.075em;
  margin: 0;
}
h1 > span {
  color: var(--accent);
}
.principle {
  padding-bottom: 2px;
  min-width: 200px;
}
.offset {
  font:
    400 70px/0.9 ui-monospace,
    Consolas,
    monospace;
  letter-spacing: -0.09em;
  color: #d8d7c7;
}
.offset > span {
  font-size: 22px;
  margin-left: 9px;
  color: #999e8b;
}
.principle p {
  font:
    13px/1.7 Arial,
    sans-serif;
  color: #b1b4a6;
  margin: 17px 0 13px;
}
.small {
  font-size: 8px;
  color: #7f8673;
  letter-spacing: 0.12em;
}
.instrument {
  position: relative;
  border: 1px solid #515a423f;
  border-radius: 6px;
  background: #232820;
  box-shadow:
    0 28px 60px -24px #0008,
    inset 0 1px #e6e7ca13;
  overflow: hidden;
}
.machine-label {
  height: 43px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 23px;
  color: #949e87;
  font-size: 9px;
  letter-spacing: 0.12em;
  border-bottom: 1px solid #0005;
}
.machine-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 8px;
}
.machine-status i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #b4be98;
  box-shadow: 0 0 8px #d1dca45c;
}
.machine {
  position: relative;
  height: 410px;
  overflow: hidden;
  background: linear-gradient(#22261e, #30372a 50%, #21271e);
}
.paper {
  position: absolute;
  top: 58px;
  height: 240px;
  left: 0;
  right: 0;
  background: linear-gradient(#a6aa8e, #dfddc1 8%, #d7d5ba 80%, #b9bc9d 100%);
  box-shadow: 0 14px 20px #0005;
}
#material {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.rail {
  position: absolute;
  left: 0;
  right: 0;
  height: 7px;
  background: linear-gradient(#87907860, #191e16 35%, #171b16 80%, #707c615c);
  box-shadow: 0 3px 7px #0006;
  z-index: 4;
}
.rail-top {
  top: 54px;
}
.rail-bottom {
  top: 297px;
}
.hour-feed {
  position: absolute;
  top: 88px;
  left: 0;
  right: 0;
  height: 64px;
  overflow: hidden;
  color: #333d2b;
}
.hour-track,
.second-track {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.hour-mark {
  position: absolute;
  top: 10px;
  transform: translateX(-50%);
  font:
    18px/1 ui-monospace,
    Consolas,
    monospace;
  letter-spacing: -0.04em;
}
.hour-mark small {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: #a45637;
}
.hour-mark.midnight {
  color: #9b4e2b;
}
.hour-ticks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #4a543999 0 1px, transparent 1px);
}
.read-head {
  position: absolute;
  top: 0;
  width: 28%;
  height: 100%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 3;
  pointer-events: none;
}
.utc-head {
  left: 25%;
}
.hkt-head {
  left: 75%;
}
.head-number {
  position: absolute;
  top: 25px;
  left: 0;
  right: 0;
  font-size: 8px;
  color: #919b81;
}
.needle {
  position: absolute;
  top: 51px;
  left: 50%;
  width: 1px;
  height: 92px;
  background: #a24e2c;
  box-shadow: 1px 0 #fff4;
}
.needle:before {
  content: "";
  position: absolute;
  top: 0;
  left: -4px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid #d18555;
}
.window {
  position: absolute;
  left: 0;
  right: 0;
  top: 153px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(115deg, #f8f6d720, transparent 35%, #242d1808);
  box-shadow: inset 0 0 16px #f4f3d218;
}
.window:after {
  content: "";
  position: absolute;
  inset: -9px -10px;
  border-top: 1px solid #3c482523;
  border-bottom: 1px solid #3c482523;
  pointer-events: none;
}
.window-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: #56613e75;
  border-style: solid;
  border-width: 0;
}
.tl {
  top: 0;
  left: 0;
  border-top-width: 1px;
  border-left-width: 1px;
}
.tr {
  top: 0;
  right: 0;
  border-top-width: 1px;
  border-right-width: 1px;
}
.bl {
  bottom: 0;
  left: 0;
  border-bottom-width: 1px;
  border-left-width: 1px;
}
.br {
  bottom: 0;
  right: 0;
  border-bottom-width: 1px;
  border-right-width: 1px;
}
.window time {
  font:
    400 clamp(38px, 6vw, 88px)/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.075em;
  color: #303a27;
  white-space: nowrap;
  text-shadow: 0 1px #f6f3d070;
}
.seconds {
  align-self: flex-end;
  margin-bottom: 24px;
  font:
    11px/1 ui-monospace,
    Consolas,
    monospace;
  color: #697050;
  min-width: 2ch;
}
.read-caption {
  position: absolute;
  top: 325px;
  left: -15px;
  right: -15px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
}
h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.035em;
}
.read-caption > span {
  font-size: 8px;
  color: #8e9980;
  letter-spacing: 0.03em;
}
.date {
  position: absolute;
  top: 344px;
  left: -15px;
  right: -15px;
  color: #8e9980;
  font-size: 9px;
  letter-spacing: 0.025em;
}
.day-offset {
  position: absolute;
  top: 378px;
  left: 50%;
  transform: translateX(-50%);
  color: #d59266;
  font-size: 8px;
  white-space: nowrap;
}
.seconds-feed {
  position: absolute;
  top: 267px;
  left: 0;
  right: 0;
  height: 17px;
  overflow: hidden;
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 15%,
    #000 85%,
    transparent
  );
  color: #758061;
}
.second-mark {
  position: absolute;
  top: 2px;
  font:
    8px/1 ui-monospace,
    Consolas,
    monospace;
  transform: translateX(-50%);
}
.feed-tag {
  position: absolute;
  left: 19px;
  top: 0;
  font-size: 7px;
  z-index: 2;
  background: #c5c6a9;
  padding: 1px 6px;
  color: #737d5e;
}
.second-cursor {
  position: absolute;
  left: 50%;
  top: 0;
  height: 14px;
  width: 26px;
  transform: translateX(-50%);
  border-left: 1px solid #7f684860;
  border-right: 1px solid #7f684860;
  background: #be875214;
}
.roller {
  position: absolute;
  top: 54px;
  height: 251px;
  width: 18px;
  z-index: 5;
  background: linear-gradient(
    90deg,
    #0e140c,
    #626c5299 40%,
    #141b0e 83%,
    #030701
  );
  box-shadow: 7px 0 13px #131b0f55;
}
.roller-left {
  left: 0;
}
.roller-right {
  right: 0;
  transform: rotate(180deg);
}
.machine-footer {
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 23px;
  border-top: 1px solid #d3dec214;
  color: #829071;
  font-size: 8px;
  letter-spacing: 0.06em;
}
.calibration {
  display: flex;
  gap: 18px;
  align-items: center;
  color: #adb59b;
}
.calibration > span {
  font-size: 14px;
  color: #78846a;
}
button {
  border: 0;
  background: none;
  color: #bec5b0;
  cursor: pointer;
  font:
    9px ui-monospace,
    Consolas,
    monospace;
  padding: 10px 0 10px 8px;
}
button span {
  margin-left: 8px;
  color: #d39065;
}
button[hidden] {
  display: none;
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 5px;
}
.legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
  padding-top: 23px;
  color: #838b77;
  font-size: 8px;
  letter-spacing: 0.075em;
}
.legend > span:first-child {
  display: flex;
  gap: 8px;
  align-items: center;
}
.legend-line {
  height: 12px;
  width: 1px;
  background: #b1714b;
  display: inline-block;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #d3dec21a;
  margin-top: 60px;
  padding-top: 24px;
  font:
    12px Georgia,
    serif;
  color: #969c89;
}
.footer-mark {
  font-size: 8px;
  color: #727e65;
}
.footer-mark > span {
  margin: 0 12px;
}
.no-script {
  font-size: 12px;
  color: var(--muted);
}
@media (min-width: 1600px) {
  .workshop {
    padding-left: 88px;
    padding-right: 88px;
  }
}
@media (max-width: 800px) {
  .workshop {
    padding: 24px 4vw;
  }
  .principle {
    min-width: 155px;
  }
  .offset {
    font-size: 52px;
  }
  .principle p {
    font-size: 11px;
  }
  .machine {
    height: 388px;
  }
  .window {
    height: 105px;
  }
  .read-head {
    width: 35%;
  }
  .read-caption {
    flex-direction: column;
    align-items: center;
    gap: 5px;
    top: 317px;
  }
  .date {
    top: 351px;
    font-size: 8px;
  }
  .day-offset {
    top: 376px;
  }
  .head-number {
    font-size: 7px;
  }
  .window time {
    font-size: 6.8vw;
  }
  .seconds {
    font-size: 9px;
    margin-bottom: 26px;
  }
  .hour-mark {
    font-size: 14px;
  }
  .calibration {
    gap: 8px;
  }
  .machine-footer {
    padding: 0 14px;
  }
  .legend {
    font-size: 7px;
  }
  .legend > span:last-child {
    max-width: 130px;
    text-align: right;
  }
  footer {
    margin-top: 43px;
  }
}
@media (max-width: 500px) {
  .workshop {
    padding: 22px 16px;
  }
  .brand {
    font-size: 9px;
    gap: 9px;
  }
  .brand-mark {
    font-size: 19px;
  }
  .serial {
    font-size: 7px;
    letter-spacing: 0.035em;
    max-width: 104px;
    text-align: right;
  }
  header {
    padding-bottom: 20px;
  }
  .introduction {
    padding: 32px 0 29px;
    gap: 16px;
  }
  h1 {
    font-size: 70px;
  }
  .eyebrow {
    font-size: 7px;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
    gap: 6px;
  }
  .principle {
    min-width: 0;
    max-width: 118px;
  }
  .offset {
    font-size: 43px;
  }
  .offset > span {
    font-size: 17px;
  }
  .principle p {
    font-size: 10px;
    line-height: 1.65;
    margin-top: 13px;
  }
  .small {
    font-size: 6px;
    letter-spacing: 0.05em;
  }
  .machine-label {
    padding: 0 13px;
    font-size: 7px;
    height: 38px;
  }
  .machine-status {
    font-size: 6px;
  }
  .machine {
    height: 351px;
  }
  .paper {
    height: 210px;
  }
  .rail-bottom {
    top: 267px;
  }
  .roller {
    height: 221px;
    width: 9px;
  }
  .read-head {
    width: 41%;
  }
  .head-number {
    font-size: 6px;
  }
  .hour-mark {
    font-size: 10px;
  }
  .hour-mark small {
    font-size: 6px;
  }
  .window {
    top: 143px;
    height: 91px;
    gap: 3px;
  }
  .window time {
    font-size: clamp(29px, 9.8vw, 48px);
    letter-spacing: -0.09em;
  }
  .seconds {
    font-size: 8px;
    margin-bottom: 26px;
  }
  .read-caption {
    top: 283px;
    gap: 4px;
  }
  h2 {
    font-size: 12px;
  }
  .read-caption > span {
    font-size: 7px;
  }
  .date {
    top: 311px;
    font-size: 7px;
    letter-spacing: 0;
  }
  .day-offset {
    top: 333px;
    font-size: 6px;
  }
  .seconds-feed {
    top: 237px;
  }
  .machine-footer {
    height: 43px;
    padding: 0 10px;
    font-size: 6px;
    letter-spacing: 0;
  }
  .machine-footer > span:first-child {
    max-width: 66px;
  }
  .calibration {
    gap: 5px;
    font-size: 6px;
  }
  .calibration > span {
    font-size: 10px;
  }
  button {
    font-size: 7px;
    padding-left: 0;
  }
  button span {
    margin-left: 3px;
  }
  .legend {
    font-size: 6px;
    gap: 14px;
    line-height: 1.6;
  }
  .legend > span:last-child {
    max-width: 102px;
  }
  footer {
    font-size: 10px;
    gap: 15px;
  }
  .footer-mark {
    font-size: 6px;
  }
  .footer-mark > span {
    margin: 0 5px;
  }
}
@media (max-width: 350px) {
  h1 {
    font-size: 58px;
  }
  .principle {
    max-width: 95px;
  }
  .window time {
    font-size: 29px;
  }
  .seconds {
    font-size: 7px;
  }
  .calibration {
    display: none;
  }
}
`;
