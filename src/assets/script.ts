import { rendererJs } from "./renderer";

export const scriptJs = `
(() => {
  ${rendererJs}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  const canvases = [...document.querySelectorAll('.light')];
  const lights = canvases.map((canvas, index) => createLight(canvas, index));
  const button = document.getElementById('motion');
  const label = document.getElementById('motion-label');
  const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  let timer;
  const pad = value => String(value).padStart(2, '0');
  function update() {
    const now = new Date();
    for (const [index, id] of ['utc', 'hkt'].entries()) {
      const local = new Date(now.getTime() + index * 8 * 3600000);
      const hour = local.getUTCHours(), minute = local.getUTCMinutes(), second = local.getUTCSeconds();
      const time = document.getElementById(id + '-time');
      const text = pad(hour) + ':' + pad(minute);
      if (time.textContent !== text) {
        time.textContent = text;
        if (!reduced.matches) {
          time.classList.remove('changed');
          void time.offsetWidth;
          time.classList.add('changed');
        }
      }
      time.dateTime = now.toISOString();
      time.setAttribute('aria-label', (index ? 'Hong Kong ' : 'UTC ') + text);
      document.getElementById(id + '-seconds').textContent = pad(second);
      document.getElementById(id + '-date').textContent = dateFormat.format(local);
      document.getElementById(id + '-progress').style.left = ((hour * 3600 + minute * 60 + second) / 864) + '%';
      lights[index].setHour(hour + minute / 60);
    }
    const nextDay = Math.floor((now.getTime() + 8 * 3600000) / 86400000) > Math.floor(now.getTime() / 86400000);
    document.getElementById('day-offset').textContent = nextDay ? '+1 DAY' : '';
  }
  function schedule() {
    clearTimeout(timer);
    update();
    if (!document.hidden) timer = setTimeout(schedule, 1000 - Date.now() % 1000 + 8);
  }
  function syncMotion() {
    lights.forEach(light => light.setPaused(paused));
    button.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Resume light' : 'Pause light';
  }
  button.hidden = !lights.some(light => light.available);
  button.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); });
  document.addEventListener('visibilitychange', schedule);
  schedule();
  syncMotion();
})();
`;
