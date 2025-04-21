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
      width: 100%; /* 确保 html 和 body 占满整个视口宽度 */
      font-family: 'Inter', system-ui, sans-serif;
      background-color: var(--initial-bg, #000); /* 背景色应用在此 */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transition: background-color 1.5s ease-in-out;
      animation: fadein 1s ease-out;
      text-align: center;
      gap: 1em;
      overflow: hidden; /* 防止可能出现的滚动条 */
    }

    .time-display {
      font-size: 2.2vw;
      font-weight: 600;
      color: white;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
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
      document.documentElement.style.setProperty('--initial-bg', hex); // Sets the CSS variable used by body background
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
    // --- Time Update Logic ---
    function updateTimes() {
      const now = new Date();
      const optDate={year:'numeric',month:'2-digit',day:'2-digit'};
      const optTime={hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'};
      const uD=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...optDate}).format(now);
      const uT=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...optTime}).format(now);
      document.getElementById('time-utc').textContent=\`\${uD} \${uT} (UTC+0)\`;
      const cD=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',...optDate}).format(now);
      const cT=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',...optTime}).format(now);
      document.getElementById('time-utc8').textContent=\`\${cD} \${cT} (UTC+8)\`;
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
      // Note: We are setting the background color directly on the body.
      // The CSS rule `background-color: var(--initial - bg, #000); ` handles the initial load color.
      // Subsequent calls to setColor directly modify body's background.
      document.body.style.backgroundColor=hex;
      document.title=hex;
      const c=document.createElement('canvas'); c.width=c.height=16;
      const ctx=c.getContext('2d'); ctx.fillStyle=hex; ctx.fillRect(0,0,16,16);
      document.getElementById('favicon').href=c.toDataURL('image/x-icon');
    }

    // --- Scheduling Updates ---
    function scheduleTick(){
      updateTimes();
      const now=new Date();
      const delay=1000-now.getMilliseconds();
      setTimeout(()=>{
        if(new Date().getSeconds()%5===0) setColor(randomColor()); // Change color every 5 seconds
        scheduleTick(); // Schedule next tick
      },delay);
    }

    // --- Initial Setup and Event Listener ---
    (() => {
      updateTimes(); // Initial time update
      // Initial color is set via CSS variable '--initial-bg' which is set in the first script block.
      // We call setColor here again to immediately apply a random color using the JS function,
      // otherwise it would wait up to 5 seconds for the first change.
      setColor(randomColor());
      scheduleTick(); // Start the update loop
      document.body.addEventListener('click',()=>setColor(randomColor())); // Click to change color
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