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
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      /* 使用系统等宽字体栈 */
      font-family: Menlo, Monaco, Consolas, 'Courier New', 'Roboto Mono', 'DejaVu Sans Mono', 'Liberation Mono', 'Noto Mono', monospace;
      background-color: var(--initial-bg, #000);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      /* 背景色过渡：0.8 秒，ease-out 效果 */
      transition: background-color 0.8s ease-out;
      /* 页面加载淡入：保持 1 秒 */
      animation: fadein 1s ease-out;
      text-align: center;
      gap: 0.8em; /* 上下两行时间的间距 */
      overflow: hidden;
    }

    /* 恢复为只有一种时间显示样式 */
    .time-display {
      font-size: 2.2vw;
      font-weight: 400; /* 常规粗细 */
      color: white;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
    }

    @media (prefers-color-scheme: light) {
      .time-display {
        color: #111;
        text-shadow: none;
      }
    }

    /* 响应式字体大小调整 */
    @media (max-width: 768px) {
      .time-display { font-size: 4.5vw; }
    }
    @media (max-width: 480px) {
      .time-display { font-size: 6vw; }
    }

    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
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
        r=hue2rgb(p,q,h1+1/3);
        g=hue2rgb(p,q,h1);
        b=hue2rgb(p,q,h1-1/3);
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

  <script>
    // --- Time Update Logic (恢复为合并日期和时间) ---
    function updateTimes() {
        const now = new Date();
        // 定义日期和时间的格式化选项
        const optDateTime = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        };

        // 获取 UTC 日期和时间字符串
        const utcString = new Intl.DateTimeFormat('en-GB', { ...optDateTime, timeZone: 'UTC' }).format(now) + ' (UTC+0)';

        // 获取 UTC+8 日期和时间字符串
        const utc8String = new Intl.DateTimeFormat('en-GB', { ...optDateTime, timeZone: 'Asia/Shanghai' }).format(now) + ' (UTC+8)';

        // 更新对应的 HTML 元素
        const timeUTCElement = document.getElementById('time-utc');
        if (timeUTCElement && timeUTCElement.textContent !== utcString) {
            timeUTCElement.textContent = utcString;
        }

        const timeUTC8Element = document.getElementById('time-utc8');
        if (timeUTC8Element && timeUTC8Element.textContent !== utc8String) {
            timeUTC8Element.textContent = utc8String;
        }
    }


    // --- Random Color Generation ---
    function randomColor(){
      const h=Math.floor(Math.random()*360), s=Math.floor(Math.random()*20+70), l=Math.floor(Math.random()*20+40);
      const h1=h/360, s1=s/100, l1=l/100;
      let r,g,b;
      if(s1===0) r=g=b=l1; else {
        const hue2rgb=(p,q,t)=>{if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p;};
        const q=l1<0.5?l1*(1+s1):l1+s1-l1*s1;
        const p=2*l1-q;
        r=hue2rgb(p,q,h1+1/3);
        g=hue2rgb(p,q,h1);
        b=hue2rgb(p,q,h1-1/3);
      }
      const toHex=x=>{const h=Math.round(x*255).toString(16);return h.length===1?"0"+h:h;};
      return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
    }

    // --- Apply Color to Background and Favicon ---
    function setColor(hex){
      document.body.style.backgroundColor=hex;
      document.title=hex;
      const c=document.createElement('canvas'); c.width=c.height=16;
      const ctx=c.getContext('2d'); ctx.fillStyle=hex; ctx.fillRect(0,0,16,16);
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = c.toDataURL('image/x-icon');

      // TODO: 在这里可以根据 hex 亮度调整 time-display 的颜色
    }

    // --- Scheduling Updates ---
    function scheduleTick(){
      updateTimes();
      const now=new Date();
      const delay=1000-now.getMilliseconds();
      setTimeout(()=>{
        if(new Date().getSeconds()%5===0) setColor(randomColor());
        scheduleTick();
      },delay);
    }

    // --- Initial Setup and Event Listener ---
    (() => {
      updateTimes();
      setColor(randomColor());
      scheduleTick();
      document.body.addEventListener('click',()=>setColor(randomColor()));
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