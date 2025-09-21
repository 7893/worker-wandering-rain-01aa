var v=Object.defineProperty;var g=(t,o)=>v(t,"name",{value:o,configurable:!0});function S(){let t=Math.floor(Math.random()*360),o=Math.floor(Math.random()*20+70),f=Math.floor(Math.random()*20+40),i=t/360,p=o/100,u=f/100,m,a,h;if(p===0)m=a=h=u;else{let d=g((n,s,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<.16666666666666666?n+(s-n)*6*r:r<.5?s:r<.6666666666666666?n+(s-n)*(.6666666666666666-r)*6:n),"hue2rgb"),e=u<.5?u*(1+p):u+p-u*p,c=2*u-e;m=d(c,e,i+1/3),a=d(c,e,i),h=d(c,e,i-1/3)}let _=g(d=>{let e=Math.round(d*255).toString(16);return e.length===1?"0"+e:e},"toHex");return`#${_(m)}${_(a)}${_(h)}`}g(S,"generateRandomColorHex");function O(){let t=Date.now(),o=Math.random().toString(36).substring(2,6);return`trace-${t}-${o}`}g(O,"generateTraceId");var T=class{static{g(this,"RateLimiter")}limit;counter;lastTimestamp;constructor(o){this.limit=o,this.counter=0,this.lastTimestamp=Date.now()}canProceed(){let o=Date.now();return o-this.lastTimestamp>1e3&&(this.counter=0,this.lastTimestamp=o),this.counter<this.limit?(this.counter++,!0):!1}};async function C(t,o){let f=o.ORDS_BASE_URL?o.ORDS_BASE_URL.replace(/\/$/,""):"",i=o.ORDS_SCHEMA_PATH?o.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g,""):"",p=o.ORDS_API_PATH?o.ORDS_API_PATH.replace(/^\/|\/$/g,""):"",u=`${f}/${i}/${p}/`;if(!f||!i||!p||!u.startsWith("https://"))throw console.error("Failed to construct a valid ORDS AutoREST API URL from environment variables.",{baseUrl:f,schemaPath:i,tableAliasPath:p,constructedUrl:u}),new Error("Invalid ORDS AutoREST API URL configuration.");let m=JSON.stringify(t),a=`${o.DB_USER}:${o.DB_PASSWORD}`,h=`Basic ${btoa(a)}`;console.log(`Sending POST to AutoREST: ${u} for trace_id: ${t.trace_id}`);let _=3,d=0,e=null,c=null,n=8e3;for(;d<_;){d++;try{let s=new AbortController,r=setTimeout(()=>{try{s.abort()}catch{}},Math.min(n*d,2e4));if(e=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json",Authorization:h},body:m,signal:s.signal}),clearTimeout(r),e.ok||e.status>=400&&e.status<500)break}catch(s){c=s,console.error(`AutoREST network error (attempt ${d}/${_}) trace=${t.trace_id}: ${s?.message}`)}if(d<_){let s=Math.min(1e3*2**(d-1),4e3)+Math.floor(Math.random()*200);await new Promise(r=>setTimeout(r,s))}}if(!e||!e.ok){let s=e?e.status:0,r=e?e.statusText:"no response",l="[Could not retrieve error body text]";try{l=e?await e.text():String(c||"no response")}catch(y){console.warn(`Could not get text from error response body for trace ${t.trace_id}`,y)}throw console.error(`Failed to insert via AutoREST. Status: ${s} ${r}. Trace: ${t.trace_id}, URL: ${u}`,{requestBodySent:m,responseBodyText:l}),new Error(`Failed to insert via AutoREST: ${s} ${r}. Response: ${l}`)}else console.log(`AutoREST POST success for trace_id: ${t.trace_id}. Status: ${e.status}`)}g(C,"insertColorRecord");var D=`<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__COLOR_HEX__</title>
  <style>
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      /* \u4E3B\u8F74\uFF08\u5782\u76F4\uFF09\u5C45\u4E2D */
      align-items: center;
      /* \u4EA4\u53C9\u8F74\uFF08\u6C34\u5E73\uFF09\u5C45\u4E2D */
      min-height: 100vh;
      /* \u786E\u4FDD body \u81F3\u5C11\u5360\u6EE1\u6574\u4E2A\u89C6\u53E3\u9AD8\u5EA6 */
      background-color: __COLOR_HEX__;
      transition: background-color 0.8s;
      font-family: sans-serif;
      cursor: pointer;
      text-align: center;
      /* \u8BA9\u5185\u90E8\u6587\u672C\u4E5F\u9ED8\u8BA4\u5C45\u4E2D */
      /* --- ADD CSS START --- */
      gap: 0.5em;
      /* \u66FF\u4EE3 time-display \u7684 margin\uFF0C\u63D0\u4F9B\u95F4\u9699 */
      /* --- ADD CSS END --- */
    }

    .time-display {
      font-size: clamp(1.5rem, 4vw, 2rem);
      /* \u54CD\u5E94\u5F0F\u5B57\u4F53\u5927\u5C0F */
      color: white;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      /* --- MODIFY CSS START --- */
      margin: 0;
      /* \u79FB\u9664\u4E0A\u4E0B margin */
      padding: 0.1em 0;
      /* \u53EF\u4EE5\u52A0\u4E00\u70B9\u5FAE\u5C0F\u7684\u4E0A\u4E0B padding \u6539\u5584\u89C2\u611F */
      /* width: auto; */
      /* \u5BBD\u5EA6\u81EA\u52A8\uFF0C\u7531 flex \u5BB9\u5668\u5904\u7406\u5C45\u4E2D */
      line-height: 1.2;
      /* \u53EF\u4EE5\u5FAE\u8C03\u884C\u9AD8 */
      /* --- MODIFY CSS END --- */
    }

    /* Favicon link stays the same (square) */
  </style>
  <link id="favicon" rel="icon"
    href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22__COLOR_HEX_URL_ENCODED__%22/></svg>">
</head>

<body>
  <div id="time-utc" class="time-display">Loading UTC+0\u2026</div>
  <div id="time-utc8" class="time-display">Loading UTC+8\u2026</div>

  <script nonce="__CSP_NONCE__">
    // JavaScript \u90E8\u5206\u4FDD\u6301\u4E0D\u53D8...
    // const initialTraceId = "__TRACE_ID__"; // Currently unused on client side
    const initialServerColor = "__INITIAL_COLOR_HEX__";

    function hslToHex(h, s, l) { l /= 100; const a = s * Math.min(l, 1 - l) / 100; const f = n => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); }

    async function sendColorChange(hexColor, sourceType) { const eventTraceId = crypto.randomUUID(); try { const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color: hexColor, trace_id: eventTraceId, source: sourceType }) }); if (!response.ok) { console.error('Failed to send color change:', response.status, await response.text()); } } catch (e) { console.error('Error sending color change:', e); } }

    function updateTimeDisplays() { const now = new Date(); const utcTimeStr = now.toISOString().substring(0, 19).replace('T', ' '); const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000); const utc8TimeStr = utc8Time.toISOString().substring(0, 19).replace('T', ' '); document.getElementById('time-utc').textContent = utcTimeStr + ' UTC+0'; document.getElementById('time-utc8').textContent = utc8TimeStr + ' UTC+8'; }

    function generateRandomHslComponents() { const h = Math.floor(Math.random() * 360); const s = Math.floor(Math.random() * 20 + 70); const l = Math.floor(Math.random() * 20 + 40); return { h, s, l }; }

    function applyColor(hexColor) { document.body.style.backgroundColor = hexColor; const svgFavicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' + hexColor.replace('#', '%23') + '"/></svg>'; document.getElementById('favicon').setAttribute('href', svgFavicon); }

    updateTimeDisplays(); setInterval(updateTimeDisplays, 1000);

    function changeColor(sourceType) { const { h, s, l } = generateRandomHslComponents(); const newHexColor = hslToHex(h, s, l); applyColor(newHexColor); sendColorChange(newHexColor, sourceType); }

    setInterval(() => { if (new Date().getSeconds() % 5 === 0) { changeColor('a'); } }, 1000);

    document.body.addEventListener('click', () => { changeColor('c'); });

    setTimeout(() => { sendColorChange(initialServerColor, 'i'); document.title = initialServerColor; }, 100);
  <\/script>
</body>

</html>`,x=D;function P(t){return{...{"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY","Cross-Origin-Resource-Policy":"same-origin","Cross-Origin-Opener-Policy":"same-origin","X-Robots-Tag":"noindex, nofollow","Permissions-Policy":"geolocation=(), microphone=(), camera=()"},...t||{}}}g(P,"securityHeaders");var $=new T(30),K={async fetch(t,o,f){let i=new URL(t.url),p=!/\.workers\.dev$/i.test(i.hostname),u=i.protocol==="https:",m={};p&&u&&(m["Strict-Transport-Security"]="max-age=15552000; includeSubDomains"),m["Content-Security-Policy"]=["default-src 'self'","img-src 'self' data:","style-src 'self' 'unsafe-inline'","script-src 'self' 'unsafe-inline'","connect-src 'self'","base-uri 'none'","form-action 'self'","frame-ancestors 'none'"].join("; ");let a=g(c=>P({...m,...c||{}}),"sh"),h=t.headers.get("CF-Connecting-IP")||"unknown",_=t.headers.get("User-Agent")||"unknown",d=t.headers.get("Referer")||null,e=t.cf;if(t.method==="GET"&&i.pathname==="/health"){let c=JSON.stringify({status:"ok",time:new Date().toISOString()});return new Response(c,{status:200,headers:a({"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",Pragma:"no-cache",Expires:"0"})})}if(t.method==="OPTIONS"){let c=t.headers.get("Origin")||"",n=c&&c===i.origin?c:"";return n?new Response(null,{status:204,headers:a({"Access-Control-Allow-Origin":n,"Access-Control-Allow-Methods":"POST, GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600"})}):new Response(null,{status:204,headers:a()})}if(t.method==="POST"&&i.pathname==="/"){if(e&&typeof e.clientTrustScore=="number"&&e.clientTrustScore<10)return console.warn(`Blocking POST request: Low trust score (${e.clientTrustScore}). IP: ${h}, Country: ${e.country||"N/A"}, ASN: ${e.asn||"N/A"}`),new Response(JSON.stringify({error:"forbidden",reason:"low_trust_score"}),{status:403,headers:a({"Content-Type":"application/json; charset=UTF-8"})});try{let n=t.headers.get("Content-Type")||"";if(!n.toLowerCase().startsWith("application/json"))return console.warn(`Bad POST Content-Type from ${h}: ${n}`),new Response(JSON.stringify({error:"bad_request",reason:"expected_application_json"}),{status:400,headers:a({"Content-Type":"application/json; charset=UTF-8"})});let s=t.headers.get("Origin");if(s&&s!==i.origin)return console.warn(`Cross-origin POST blocked. Origin=${s}, Expect=${i.origin}, IP=${h}`),new Response(JSON.stringify({error:"forbidden",reason:"cross_origin"}),{status:403,headers:a({"Content-Type":"application/json; charset=UTF-8"})});let r=t.headers.get("Content-Length");if(r&&Number(r)>2048)return new Response(JSON.stringify({error:"payload_too_large"}),{status:413,headers:a({"Content-Type":"application/json; charset=UTF-8"})});let l=await t.json(),y=typeof l?.color=="string"&&/^#[0-9a-fA-F]{6}$/.test(l.color),E=typeof l?.trace_id=="string"&&l.trace_id.length>0&&l.trace_id.length<=36;if(!l||!y||!E||typeof l.source!="string"||!["a","c","i"].includes(l.source))return console.error("Received invalid core data structure, color format, or source from client:",l),new Response(JSON.stringify({error:"bad_request",reason:"invalid_payload"}),{status:400,headers:a({"Content-Type":"application/json; charset=UTF-8"})});if($.canProceed()){let b=(_||"unknown").slice(0,1e3),A=d?d.slice(0,2e3):null,R={color:l.color,trace_id:l.trace_id,source:l.source,event_at:new Date().toISOString(),client_ip:h,user_agent:b,referer:A,cf_country:e&&typeof e.country=="string"?e.country:null,cf_colo:e&&typeof e.colo=="string"?e.colo:null,cf_asn:e&&typeof e.asn=="number"?e.asn:null,cf_http_protocol:e&&typeof e.httpProtocol=="string"?e.httpProtocol:null,cf_tls_cipher:e&&typeof e.tlsCipher=="string"?e.tlsCipher:null,cf_tls_version:e&&typeof e.tlsVersion=="string"?e.tlsVersion:null,cf_threat_score:e&&typeof e.threatScore=="number"?e.threatScore:null,cf_trust_score:e&&typeof e.clientTrustScore=="number"?e.clientTrustScore:null,extra:null};return f.waitUntil((async()=>{try{await C(R,o)}catch(w){console.error(`Error in waitUntil for insertColorRecord (trace: ${R.trace_id}) from fetch:`,w.message,w.stack)}})()),new Response(JSON.stringify({status:"ok"}),{status:200,headers:a({"Content-Type":"application/json; charset=UTF-8"})})}else return console.log(`Rate limit exceeded for trace ${l.trace_id} from IP ${h}`),new Response(JSON.stringify({error:"too_many_requests"}),{status:429,headers:a({"Content-Type":"application/json; charset=UTF-8"})})}catch(n){return console.error("Error processing POST request in fetch handler:",n?.message,n?.stack,n),new Response(JSON.stringify({error:"bad_request",reason:"invalid_json_or_internal"}),{status:400,headers:a({"Content-Type":"application/json; charset=UTF-8"})})}}if(t.method==="GET"&&i.pathname==="/"){let c=O(),n=S(),s=new Uint8Array(16);crypto.getRandomValues(s);let r=btoa(String.fromCharCode(...s)).replace(/=+/g,"").replace(/\+/g,"-").replace(/\//g,"_"),l=x.replaceAll("__COLOR_HEX__",n).replaceAll("__COLOR_HEX_URL_ENCODED__",n.replace("#","%23")).replaceAll("__TRACE_ID__",c).replaceAll("__INITIAL_COLOR_HEX__",n).replaceAll("__CSP_NONCE__",r),y=["default-src 'self'","img-src 'self' data:","style-src 'self' 'unsafe-inline'",`script-src 'self' 'nonce-${r}'`,"connect-src 'self'","base-uri 'none'","form-action 'self'","frame-ancestors 'none'"].join("; ");return new Response(l,{headers:a({"Content-Type":"text/html; charset=UTF-8","Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",Pragma:"no-cache",Expires:"0","Content-Security-Policy":y})})}if(t.method==="GET"&&i.pathname==="/robots.txt"){let c=`User-agent: *
Disallow: /
`;return new Response(c,{headers:a({"Content-Type":"text/plain; charset=UTF-8","Cache-Control":"no-store"})})}return new Response("Not Found",{status:404,headers:a({"Content-Type":"text/plain; charset=UTF-8"})})},async scheduled(t,o,f){console.log(`[${new Date().toISOString()}] Cron Trigger (Simulated User Visit) Fired: ${t.cron}`);let i=S(),p=`cron-sim-${Date.now()}-${crypto.randomUUID().substring(0,8)}`,u={color:i,trace_id:p,source:"s",event_at:new Date().toISOString(),client_ip:"CRON_SIMULATED_IP",user_agent:"WanderingRain-Cron-Simulator/1.0 (Scheduled Task)",referer:"urn:cloudflare:worker:scheduled",cf_country:"XX",cf_colo:"SYSTEM",cf_asn:0,cf_http_protocol:"SYSTEM",cf_tls_cipher:null,cf_tls_version:null,cf_threat_score:0,cf_trust_score:99,extra:null};console.log(`Simulated user visit data for AutoREST (cron): ${JSON.stringify(u)}`),f.waitUntil((async()=>{try{await C(u,o),console.log(`Successfully logged simulated user visit (trace: ${p}) via cron.`)}catch(m){console.error(`[CRON_SIM_ERROR] Simulated user visit task failed for trace ${u.trace_id}. Error:`,m.message,m.stack)}})())}};export{K as default};
//# sourceMappingURL=index.js.map
