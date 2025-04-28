import { generateRandomColorHex, generateTraceId } from '../lib/color-utils';
import { ensureMonthlyTableAndRestApi, insertColorRecord } from '../lib/db-utils';
import { RateLimiter } from '../lib/rate-limit';
import { getCurrentTableName } from '../lib/time-utils';

const limiter = new RateLimiter(30);

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "POST") {
      try {
        const data = await request.json();
        const tableName = getCurrentTableName();
        if (limiter.canProceed()) {
          await ensureMonthlyTableAndRestApi(tableName);
          await insertColorRecord(tableName, data.color, data.trace_id, data.source);
        }
        return new Response("OK", { status: 200 });
      } catch (e) {
        console.error(e);
        return new Response("Bad Request", { status: 400 });
      }
    }

    // 正常 GET 请求，返回 HTML
    const traceId = generateTraceId();
    const colorHex = generateRandomColorHex();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${colorHex}</title>
<style>
body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: ${colorHex}; transition: background-color 0.8s; }
.time-display { font-size: 2rem; color: white; }
.timestamp-display { position: fixed; bottom: 1rem; right: 1.5rem; font-size: 1rem; color: #aaa; }
</style>
<link id="favicon" rel="icon" href="">
</head>
<body>
<div id="time-utc" class="time-display">Loading UTC…</div>
<div id="time-utc8" class="time-display">Loading UTC+8…</div>
<div id="linux-timestamp" class="timestamp-display">Loading Timestamp…</div>
<script>
async function sendColorChange(hex, sourceType) {
  try {
    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: hex, trace_id: "${traceId}", source: sourceType })
    });
  } catch (e) { console.error(e); }
}

function updateTimeDisplays() {
  const now = new Date();
  document.getElementById('time-utc').textContent = now.toISOString().split('.')[0] + ' UTC';
  const cn = new Date(now.getTime() + 8 * 3600 * 1000);
  document.getElementById('time-utc8').textContent = cn.toISOString().split('.')[0] + ' UTC+8';
  document.getElementById('linux-timestamp').textContent = Math.floor(now.getTime() / 1000);
}

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 20 + 70);
  const l = Math.floor(Math.random() * 20 + 40);
  return "hsl(" + h + "," + s + "%," + l + "%)";
}

function applyColor(hex) {
  document.body.style.backgroundColor = hex;
}

updateTimeDisplays();
setInterval(updateTimeDisplays, 1000);

setInterval(() => {
  if (new Date().getSeconds() % 5 === 0) {
    const hex = randomColor();
    applyColor(hex);
    sendColorChange(hex, 'a');
  }
}, 1000);

document.body.addEventListener('click', () => {
  const hex = randomColor();
  applyColor(hex);
  sendColorChange(hex, 'c');
});
</script>
</body>
</html>
    `.trim();

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  }
};
