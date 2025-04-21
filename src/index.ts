export default {
  async fetch(): Promise<Response> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#000000" />
  <title>Color Clock</title>
  <link id="favicon" rel="shortcut icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGw4BhWIQBAE5OEAELnjVHAAAAAElFTkSuQmCC" type="image/x-icon">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; height: 100%; width: 100%;
      font-family: Menlo, Monaco, Consolas, 'Courier New', 'Roboto Mono', 'DejaVu Sans Mono', 'Liberation Mono', 'Noto Mono', monospace;
      background-color: var(--initial-bg, #000);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      transition: background-color 0.8s ease-out;
      animation: fadein 1s ease-out;
      text-align: center; gap: 0.8em; overflow: hidden;
    }
    .time-display {
      font-size: 2.2vw; font-weight: 400; color: white;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
    }
    .timestamp-display {
      position: fixed; bottom: 1em; right: 1.5em;
      font-size: 1.1vw; font-weight: 400; color: #888; /* Fallback color */
      letter-spacing: 0.05em;
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
    @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  </style>
  <script>
    // --- HSL to RGB and initial color setup ---
    (function(){
      function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
      const h=randInt(0,359), s=randInt(70,90), l=randInt(50,70);
      const h1=h/360, s1=s/100, l1=l/100;
      let r,g,b;
      if(s1===0){r=g=b=l1;} else {
        const hue2rgb=(p,q,t)=>{if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p;};
        const q=l1<0.5?l1*(1+s1):l1+s1-l1*s1;
        const p=2*l1-q;
        r=hue2rgb(p,q,h1+1/3); g=hue2rgb(p,q,h1); b=hue2rgb(p,q,h1-1/3);
      }
      const toHex=x=>{const h=Math.round(x*255).toString(16);return h.length===1?"0"+h:h;};
      const hex=\`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
      document.documentElement.style.setProperty('--initial-bg', hex);
      document.title = hex;
      const c=document.createElement('canvas'); c.width=c.height=16;
      const ctx=c.getContext('2d'); ctx.fillStyle=hex; ctx.fillRect(0,0,16,16);
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = c.toDataURL('image/x-icon');
    })();
  </script>
</head>
<body>
  <div id="time-utc" class="time-display">Loading UTC…</div>
  <div id="time-utc8" class="time-display">Loading UTC+8…</div>
  <div id="linux-timestamp" class="timestamp-display">Loading Timestamp…</div>

  <script>
    // --- Helper Functions for Color Calculation ---
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    }
    function calculateLuminance(r, g, b) {
      const a = [r, g, b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // --- Time Update Logic ---
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
        const timeUTCElement = document.getElementById('time-utc');
        if (timeUTCElement && timeUTCElement.textContent !== utcString) { timeUTCElement.textContent = utcString; }
        const timeUTC8Element = document.getElementById('time-utc8');
        if (timeUTC8Element && timeUTC8Element.textContent !== utc8String) { timeUTC8Element.textContent = utc8String; }
        const timestampElement = document.getElementById('linux-timestamp');
        if (timestampElement) { timestampElement.textContent = linuxTimestamp; }
    }

    // --- Random Color Generation ---
    function randomColor(){
      const h=Math.floor(Math.random()*360), s=Math.floor(Math.random()*20+70), l=Math.floor(Math.random()*20+40);
      const h1=h/360, s1=s/100, l1=l/100;
      let r,g,b;
      if(s1===0) r=g=b=l1; else {
        const hue2rgb=(p,q,t)=>{if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p;};
        const q=l1<0.5?l1*(1+s1):l1+s1-l1*s1; const p=2*l1-q;
        r=hue2rgb(p,q,h1+1/3); g=hue2rgb(p,q,h1); b=hue2rgb(p,q,h1-1/3);
      }
      const toHex=x=>{const h=Math.round(x*255).toString(16);return h.length===1?"0"+h:h;};
      return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
    }

    // --- Apply Color to Background, Favicon ---
    // *** Temporarily simplified setColor: removed timestamp color logic ***
    function setColor(hex){
      document.body.style.backgroundColor = hex;
      document.title = hex;

      const c=document.createElement('canvas'); c.width=c.height=16;
      const ctx=c.getContext('2d'); ctx.fillStyle=hex; ctx.fillRect(0,0,16,16);
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = c.toDataURL('image/x-icon');

      // --- Temporarily Commented Out ---
      // const timestampElement = document.getElementById('linux-timestamp');
      // if (timestampElement) {
      //     const rgb = hexToRgb(hex);
      //     if (rgb) {
      //         const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
      //         if (luminance < 0.5) {
      //             timestampElement.style.color = '#AAAAAA'; // 暗背景配浅灰色
      //         } else {
      //             timestampElement.style.color = '#444444'; // 亮背景配深灰色
      //         }
      //     }
      // }
      // --- End Temp Comment ---
    }

    // --- Scheduling Updates ---
    function scheduleTick(){
      updateTimes();
      const now=new Date();
      const delay=1000-now.getMilliseconds();
      setTimeout(()=>{
        const currentSeconds = new Date().getSeconds();
        if(currentSeconds % 5 === 0) { setColor(randomColor()); }
        scheduleTick();
      },delay);
    }

    // --- Initial Setup and Event Listener ---
    (() => {
      updateTimes();
      setColor(randomColor()); // Call the (now simplified) setColor
      scheduleTick();
      document.body.addEventListener('click',()=>{ setColor(randomColor()); });
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