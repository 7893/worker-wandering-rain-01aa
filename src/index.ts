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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
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
      font-family: 'Inter', system-ui, sans-serif;
      background-color: var(--initial-bg, #000);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      /* 背景色过渡：1秒时长，ease-out 效果 */
      transition: background-color 1s ease-out;
      /* 页面加载淡入：0.5秒时长 */
      animation: fadein 0.5s ease-out;
      text-align: center;
      gap: 1em;
      overflow: hidden;
    }

    .time-display {
      font-size: 2.2vw;
      font-weight: 600;
      color: white;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
      /* 添加透明度过渡，用于时间更新动画 */
      transition: opacity 0.15s ease-out;
    }

    @media (prefers-color-scheme: light) {
      .time-display {
        color: #111;
        text-shadow: none;
      }
    }

    @media (max-width: 768px) {
      .time-display { font-size: 4.5vw; }
    }
    @media (max-width: 480px) {
      .time-display { font-size: 6vw; }
    }

    /* 页面加载淡入动画 */
    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* 点击时的背景脉冲动画 */
    body.pulsing {
      animation: backgroundPulse 0.4s ease-out;
    }
    @keyframes backgroundPulse {
      0% { filter: brightness(1); }
      50% { filter: brightness(1.3); } /* 短暂变亮 */
      100% { filter: brightness(1); }
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
      document.getElementById('favicon').href=c.toDataURL('image/x-icon');
    })();
  </script>
</head>
<body>
  <div id="time-utc" class="time-display">Loading UTC…</div>
  <div id="time-utc8" class="time-display">Loading UTC+8…</div>

  <script>
    // --- Helper for updating time elements with fade effect ---
    function updateTimeElement(elementId, newText) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== newText) {
            element.style.opacity = '0'; // 开始淡出
            setTimeout(() => {
                element.textContent = newText;
                element.style.opacity = '1'; // 开始淡入
            }, 150); // 延迟时间应匹配 CSS 中的 opacity transition duration
        }
    }

    // --- Time Update Logic ---
    function updateTimes() {
      const now = new Date();
      const optDate={year:'numeric',month:'2-digit',day:'2-digit'};
      const optTime={hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'};

      // Format UTC time
      const uD=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...optDate}).format(now);
      const uT=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...optTime}).format(now);
      const utcString = \`\${uD} \${uT} (UTC+0)\`;

      // Format UTC+8 time
      const cD=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',...optDate}).format(now);
      const cT=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',...optTime}).format(now);
      const utc8String = \`\${cD} \${cT} (UTC+8)\`;

      // Update elements using helper function
      updateTimeElement('time-utc', utcString);
      updateTimeElement('time-utc8', utc8String);
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
    }

    // --- Scheduling Updates ---
    function scheduleTick(){
      updateTimes(); // Update time immediately
      const now = new Date();
      const delay = 1000 - now.getMilliseconds(); // Align updates to the start of the second

      setTimeout(() => {
        // Change color every 5 seconds (on the 0th, 5th, 10th... second)
        if (new Date().getSeconds() % 5 === 0) {
          // Avoid pulsing animation when color changes automatically
          const newHex = randomColor();
          setColor(newHex);
        }
        scheduleTick(); // Schedule next tick
      }, delay);
    }

    // --- Initial Setup and Event Listener ---
    (() => {
      updateTimes(); // Initial time display
      setColor(randomColor()); // Set initial random color
      scheduleTick(); // Start the update loop

      // Click listener for changing color AND triggering pulse animation
      document.body.addEventListener('click', () => {
          setColor(randomColor()); // Change color
          document.body.classList.remove('pulsing'); // Remove class first if animation was interrupted
          // Use void to trigger reflow before adding class again, ensures animation restarts
          void document.body.offsetWidth;
          document.body.classList.add('pulsing'); // Add class to trigger animation

          // Remove the class after the animation completes
          setTimeout(() => {
              document.body.classList.remove('pulsing');
          }, 400); // Must match CSS animation duration
      });
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