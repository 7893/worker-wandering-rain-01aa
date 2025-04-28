// src/index.ts

import { generateTraceId } from '../lib/trace-utils';
import { canInsertNow } from '../lib/rate-limit';
import { ensureTableExists, insertColorRecord } from '../lib/db-utils';
import { getCurrentTableName } from '../lib/time-utils';

// 页面HTML模板（这里是精简版，实际上可以粘贴你完整的HTML结构）
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#000000" />
  <title>Color Clock</title>
  <link id="favicon" rel="shortcut icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGw4BhWIQBAE5OEAELnjVHAAAAAElFTkSuQmCC" type="image/x-icon">
  <style>
    /* 你的CSS代码（保持原样） */
  </style>
  <script>
    (function(){
      function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
      function randomColor(){
        const h=Math.floor(Math.random()*360), s=Math.floor(Math.random()*20+70), l=Math.floor(Math.random()*20+40);
        const h1=h/360, s1=s/100, l1=l/100;
        let r,g,b;
        if(s1===0) r=g=b=l1; else {
          const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
          const q=l1<0.5?l1*(1+s1):l1+s1-l1*s1; const p=2*l1-q;
          r=hue2rgb(p,q,h1+1/3); g=hue2rgb(p,q,h1); b=hue2rgb(p,q,h1-1/3);
        }
        const toHex=x=>{const h=Math.round(x*255).toString(16);return h.length===1?"0"+h:h;};
        return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
      }
      function sendColor(hex, source) {
        fetch('/api/color', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color: hex, source: source || null })
        }).catch((err) => {
          console.error('Failed to send color:', err);
        });
      }
      function setColor(hex, source) {
        document.body.style.backgroundColor = hex;
        document.title = hex;
        const c=document.createElement('canvas');
        c.width=c.height=16;
        const ctx=c.getContext('2d');
        ctx.fillStyle=hex;
        ctx.fillRect(0,0,16,16);
        const favicon=document.getElementById('favicon');
        if(favicon) favicon.href=c.toDataURL('image/x-icon');
        sendColor(hex, source);
      }
      function updateTimes() {
        const now = new Date();
        const optDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const optTime = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const uD = new Intl.DateTimeFormat('en-US', { ...optDate, timeZone: 'UTC' }).format(now);
        const uT = new Intl.DateTimeFormat('en-GB', { ...optTime, timeZone: 'UTC' }).format(now);
        const utcString = uD + ' ' + uT + ' (UTC+0)';
        const cD = new Intl.DateTimeFormat('en-US', { ...optDate, timeZone: 'Asia/Shanghai' }).format(now);
        const cT = new Intl.DateTimeFormat('en-GB', { ...optTime, timeZone: 'Asia/Shanghai' }).format(now);
        const utc8String = cD + ' ' + cT + ' (UTC+8)';
        const linuxTimestamp = Math.floor(now.getTime() / 1000);
        document.getElementById('time-utc')?.textContent = utcString;
        document.getElementById('time-utc8')?.textContent = utc8String;
        document.getElementById('linux-timestamp')?.textContent = linuxTimestamp;
      }
      function scheduleTick() {
        updateTimes();
        const now = new Date();
        const delay = 1000 - now.getMilliseconds();
        setTimeout(() => {
          const currentSeconds = new Date().getSeconds();
          if (currentSeconds % 5 === 0) { setColor(randomColor(), null); }
          scheduleTick();
        }, delay);
      }
      (() => {
        updateTimes();
        const navType = performance.getEntriesByType("navigation")[0]?.type || 'navigate';
        const source = navType === 'reload' ? 'r' : 'o';
        setColor(randomColor(), source);
        scheduleTick();
        document.body.addEventListener('click', () => { setColor(randomColor(), 'c'); });
      })();
    })();
  </script>
</head>
<body>
  <div id="time-utc" class="time-display">Loading UTC…</div>
  <div id="time-utc8" class="time-display">Loading UTC+8…</div>
  <div id="linux-timestamp" class="timestamp-display">Loading Timestamp…</div>
</body>
</html>
`.trim();

export default {
  async fetch(request: Request): Promise<Response> {
    const { method, url } = request;
    const { pathname } = new URL(url);

    if (method === 'GET' && pathname === '/') {
      return new Response(htmlTemplate, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (method === 'POST' && pathname === '/api/color') {
      try {
        const data = await request.json();
        const color = data.color;
        const source = data.source || null;

        if (!color || typeof color !== 'string') {
          return new Response('Invalid color', { status: 400 });
        }

        if (!canInsertNow()) {
          return new Response('Rate limit exceeded', { status: 429 });
        }

        const traceId = generateTraceId();
        const tableName = getCurrentTableName();

        await ensureTableExists(tableName);
        await insertColorRecord(color, source, traceId);

        return new Response('OK', { status: 200 });
      } catch (error) {
        console.error('Error processing POST /api/color:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
