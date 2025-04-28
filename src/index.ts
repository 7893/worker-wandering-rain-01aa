import { generateRandomColorHex, generateTraceId } from '../lib/color-utils';
import { ensureMonthlyTableAndRestApi, insertColorRecord } from '../lib/db-utils';
import { RateLimiter } from '../lib/rate-limit';
import { getCurrentTableName } from '../lib/time-utils';

// 每秒允许最多30条写入
const limiter = new RateLimiter(30);

export default {
  async fetch(): Promise<Response> {
    const traceId = generateTraceId();
    const colorHex = generateRandomColorHex();
    const now = new Date();
    const eventAt = now.toISOString(); // 用浏览器本地时间生成的 ISO 时间戳
    const source = "o"; // 页面首次打开，source标记为 o (open)

    const tableName = getCurrentTableName(); // 比如 cw_202504_colors

    // 尝试限流
    if (limiter.canProceed()) {
      await ensureMonthlyTableAndRestApi(tableName);
      await insertColorRecord(tableName, colorHex, traceId, source);
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="${colorHex}" />
  <title>${colorHex}</title>
  <link id="favicon" rel="shortcut icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGw4BhWIQBAE5OEAELnjVHAAAAAElFTkSuQmCC" type="image/x-icon">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; height: 100%; width: 100%;
      font-family: Menlo, Monaco, Consolas, 'Courier New', 'Roboto Mono', 'DejaVu Sans Mono', 'Liberation Mono', 'Noto Mono', monospace;
      background-color: ${colorHex};
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      transition: background-color 0.8s ease-out;
      text-align: center; gap: 0.8em; overflow: hidden;
    }
    .time-display {
      font-size: 2.2vw; font-weight: 400; color: white;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
    }
    .timestamp-display {
      position: fixed; bottom: 1em; right: 1.5em;
      font-size: 1.1vw; font-weight: 400; color: #888;
    }
    @media (prefers-color-scheme: light) {
      .time-display { color: #111; text-shadow: none; }
    }
    @media (max-width: 768px) {
      .time-display { font-size: 4.5vw; }
      .timestamp-display { font-size: 2.2vw; }
    }
    @media (max-width: 480px) {
      .time-display { font-size: 6vw; }
      .timestamp-display { font-size: 3vw; }
    }
  </style>
  <script>
    async function sendColorChange(color, sourceType) {
      const traceId = "${traceId}";
      const now = new Date();
      const eventAt = now.toISOString();
      try {
        await fetch('/api/color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            color,
            trace_id: traceId,
            source: sourceType,
            event_at: eventAt
          })
        });
      } catch (e) {
        console.error('Failed to report color:', e);
      }
    }

    function randomColorHex() {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(Math.random() * 20 + 70);
      const l = Math.floor(Math.random() * 20 + 40);
      const h1 = h / 360, s1 = s / 100, l1 = l / 100;
      let r, g, b;
      if (s1 === 0) {
        r = g = b = l1;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l1 < 0.5 ? l1 * (1 + s1) : l1 + s1 - l1 * s1;
        const p = 2 * l1 - q;
        r = hue2rgb(p, q, h1 + 1/3);
        g = hue2rgb(p, q, h1);
        b = hue2rgb(p, q, h1 - 1/3);
      }
      const toHex = x => {
        const h = Math.round(x * 255).toString(16);
        return h.length === 1 ? "0" + h : h;
      };
      return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
    }

    function updateTimeDisplays() {
      const now = new Date();
      document.getElementById('time-utc').textContent =
        new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }).format(now) + ' (UTC)';
      document.getElementById('time-utc8').textContent =
        new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Shanghai' }).format(now) + ' (UTC+8)';
      document.getElementById('linux-timestamp').textContent =
        Math.floor(now.getTime() / 1000);
    }

    function applyColor(hex) {
      document.body.style.backgroundColor = hex;
      document.title = hex;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 16, 16);
      document.getElementById('favicon').href = canvas.toDataURL('image/x-icon');
    }

    (() => {
      updateTimeDisplays();
      setInterval(updateTimeDisplays, 1000);

      document.body.addEventListener('click', () => {
        const newColor = randomColorHex();
        applyColor(newColor);
        sendColorChange(newColor, 'c'); // 点击 source 用 'c'
      });

      setInterval(() => {
        const now = new Date();
        if (now.getSeconds() % 5 === 0) {
          const newColor = randomColorHex();
          applyColor(newColor);
          sendColorChange(newColor, 'a'); // 自动变化 source 用 'a'
        }
      }, 1000);
    })();
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
