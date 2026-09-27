import { rendererJs } from "./renderer";

export const scriptJs = `
(() => {
  ${rendererJs}
  const machine = document.getElementById('machine');
  const material = createPressMaterial(document.getElementById('material'));
  const hourTrack = document.getElementById('hour-track');
  const secondTrack = document.getElementById('second-track');
  const ticks = document.getElementById('hour-ticks');
  const button = document.getElementById('motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const boundaryFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short' });
  const pad = value => String(value).padStart(2, '0');
  let paused = reduced.matches, frame = 0, previous = 0, timer;
  let hourKey = '', secondKey = '';

  function paint(stamp, moveSeconds = true) {
    const width = machine.clientWidth;
    // The readers are half a viewport apart: exactly eight hourly intervals.
    const spacing = width / 16, anchor = width / 4;
    const hours = stamp / 3600000;
    const wholeHour = Math.floor(hours), fraction = hours - wholeHour;
    const key = wholeHour + ':' + width;
    if (key !== hourKey) {
      hourKey = key;
      const fragment = document.createDocumentFragment();
      for (let i = -5; i <= 13; i++) {
        const date = new Date((wholeHour + i) * 3600000);
        const mark = document.createElement('span');
        mark.className = 'hour-mark' + (date.getUTCHours() === 0 ? ' midnight' : '');
        mark.style.left = (anchor + i * spacing) + 'px';
        mark.textContent = pad(date.getUTCHours());
        if (date.getUTCHours() === 0) {
          const boundary = document.createElement('small');
          boundary.textContent = boundaryFormat.format(date).toUpperCase();
          mark.appendChild(boundary);
        }
        fragment.appendChild(mark);
      }
      hourTrack.replaceChildren(fragment);
    }
    hourTrack.style.transform = 'translate3d(' + (-fraction * spacing) + 'px,0,0)';
    ticks.style.backgroundSize = (spacing / 4) + 'px 6px';
    ticks.style.backgroundPositionX = (anchor - fraction * spacing) + 'px';
    material.setFeed((hours * spacing) % 22);
    if (moveSeconds) {
      const seconds = stamp / 1000, wholeSecond = Math.floor(seconds);
      const step = width < 500 ? 25 : 34;
      const key = wholeSecond + ':' + width;
      if (key !== secondKey) {
        secondKey = key;
        const fragment = document.createDocumentFragment();
        const count = Math.ceil(width / step / 2) + 1;
        for (let i = -count; i <= count; i++) {
          const mark = document.createElement('span');
          mark.className = 'second-mark';
          mark.style.left = (width / 2 + i * step) + 'px';
          mark.textContent = pad(((wholeSecond + i) % 60 + 60) % 60);
          fragment.appendChild(mark);
        }
        secondTrack.replaceChildren(fragment);
      }
      secondTrack.style.transform = 'translate3d(' + (-(seconds - wholeSecond) * step) + 'px,0,0)';
    }
  }

  function updateClock() {
    const now = new Date();
    for (const [index, id] of ['utc', 'hkt'].entries()) {
      const local = new Date(now.getTime() + index * 8 * 3600000);
      const text = pad(local.getUTCHours()) + ':' + pad(local.getUTCMinutes());
      const time = document.getElementById(id + '-time');
      if (time.textContent !== text) time.textContent = text;
      time.dateTime = now.toISOString();
      time.setAttribute('aria-label', (index ? 'Hong Kong ' : 'UTC ') + text);
      document.getElementById(id + '-seconds').textContent = pad(local.getUTCSeconds());
      document.getElementById(id + '-date').textContent = dateFormat.format(local);
    }
    const nextDay = Math.floor((now.getTime() + 8 * 3600000) / 86400000) > Math.floor(now.getTime() / 86400000);
    document.getElementById('day-offset').textContent = nextDay ? '+1 DAY' : '';
    if (paused) paint(now.getTime(), false);
  }
  function schedule() {
    clearTimeout(timer);
    updateClock();
    if (!document.hidden) timer = setTimeout(schedule, 1000 - Date.now() % 1000 + 8);
  }
  function tick(now) {
    frame = 0;
    if (paused || document.hidden) return;
    if (!previous || now - previous >= 32) {
      previous = now;
      paint(Date.now());
    }
    frame = requestAnimationFrame(tick);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    button.setAttribute('aria-pressed', String(paused));
    button.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  button.hidden = false;
  button.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); });
  document.addEventListener('visibilitychange', () => { schedule(); syncMotion(); });
  new ResizeObserver(() => paint(Date.now(), !paused || !secondKey)).observe(machine);
  paint(Date.now()); schedule(); syncMotion();
})();
`;
