// src/index.ts (最终版 - 分区表 + 记录所有信息 + 无 HMAC + 修正 TS 类型错误)

// --- Imports ---
import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
// 导入分区表版本使用的接口和函数 (确保 lib/db-utils.ts 是无 HMAC 版本)
import { insertColorRecord, Env as DbEnv, ColorRecordData } from '../lib/db-utils';
import pageTemplate from './template.html';

// --- Environment Interface ---
type Env = DbEnv; // 从 db-utils 导入 (不含 HMAC_SHARED_SECRET)

// --- Globals / Initialization ---
const limiter = new RateLimiter(30); // 实例本地速率限制器

// --- Worker Definition ---
export default {
  /**
   * Handles incoming HTTP requests.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    const url = new URL(request.url);

    // --- 提前获取请求信息，供后续使用 ---
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const referer = request.headers.get('Referer') || null;
    const cf = request.cf; // Cloudflare 特定请求属性对象

    // --- Handle POST requests ---
    if (request.method === "POST" && url.pathname === '/') {
      const minimumTrustScore = 10; // 智能过滤阈值

      // --- CF 智能过滤 (使用严格类型检查) ---
      if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
        console.warn(
          `Blocking request: Low trust score (${cf.clientTrustScore}). ` +
          `IP: ${clientIp}, Country: ${cf.country || 'N/A'}, ASN: ${cf.asn || 'N/A'}`
        );
        return new Response('Forbidden', { status: 403 });
      }
      // --- CF 智能过滤 END ---

      try {
        // 1. Validate Content-Type
        if (request.headers.get("Content-Type") !== "application/json") {
          return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
        }

        // 2. Parse JSON (只解析前端发送的核心数据)
        interface IncomingCoreData { color: string; trace_id: string; source: string; }
        const coreData: IncomingCoreData = await request.json();

        // 3. Basic Validation
        if (!coreData || typeof coreData.color !== 'string' || !coreData.color.startsWith('#') ||
          typeof coreData.trace_id !== 'string' || typeof coreData.source !== 'string' ||
          !['a', 'c', 'i'].includes(coreData.source)) {
          console.error("Received invalid core data structure, color format, or source:", coreData);
          return new Response("Bad Request: Invalid core data payload", { status: 400 });
        }

        // 4. Apply Rate Limiting
        if (limiter.canProceed()) {
          // --- 构建包含所有信息的完整数据对象 (使用最严格类型检查) ---
          const fullDataToInsert: ColorRecordData = {
            color: coreData.color,
            trace_id: coreData.trace_id,
            source: coreData.source,
            ip_address: clientIp,
            user_agent: userAgent,
            referer: referer,
            cf_country: (cf && typeof cf.country === 'string') ? cf.country : null,
            cf_colo: (cf && typeof cf.colo === 'string') ? cf.colo : null,
            cf_asn: (cf && typeof cf.asn === 'number') ? cf.asn : null,
            cf_http_protocol: (cf && typeof cf.httpProtocol === 'string') ? cf.httpProtocol : null,
            cf_tls_cipher: (cf && typeof cf.tlsCipher === 'string') ? cf.tlsCipher : null,
            cf_tls_version: (cf && typeof cf.tlsVersion === 'string') ? cf.tlsVersion : null,
            cf_threat_score: (cf && typeof cf.threatScore === 'number') ? cf.threatScore : null,
            cf_trust_score: (cf && typeof cf.clientTrustScore === 'number') ? cf.clientTrustScore : null
          };
          // --- 数据对象构建结束 ---

          // 异步调用数据库插入 (调用无 HMAC 版本的 insertColorRecord)
          ctx.waitUntil(
            (async () => {
              try {
                await insertColorRecord(fullDataToInsert, env);
              } catch (dbError: any) {
                // 错误已在 insertColorRecord 内部记录
              }
            })()
          );
          // 立即返回 OK
          return new Response("OK", { status: 200 });

        } else {
          console.log(`Rate limit exceeded for trace ${coreData.trace_id}`);
          return new Response("Too Many Requests", { status: 429 });
        }

      } catch (e: any) {
        console.error("Error processing POST request in fetch handler:", e.message, e);
        return new Response("Bad Request", { status: 400 });
      }
    }

    // --- Handle GET requests (保持不变) ---
    if (request.method === "GET" && url.pathname === '/') {
      const traceId = generateTraceId();
      const colorHex = generateRandomColorHex();
      let htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__TRACE_ID__', traceId)
        .replaceAll('__INITIAL_COLOR_HEX__', colorHex);
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    }

    // --- Default response (保持不变) ---
    return new Response("Not Found", { status: 404 });
  },

  /**
   * Handles scheduled events (Cron Triggers) for database keep-alive.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // 记录 Cron 触发事件
    console.log(`[${new Date().toISOString()}] Cron Trigger Fired: ${event.cron} - Initiating keep-alive ping.`);

    // Cron 任务只发送核心数据 + 必要的标识符
    const keepAliveData: ColorRecordData = {
      color: '#KEEPALV',
      trace_id: `cron-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
      source: 's', // 's' 代表 scheduled/system
      // 其他字段让其在数据库中默认为 NULL 或由 PL/SQL 处理
      ip_address: 'cron_trigger',
      user_agent: 'cloudflare-cron'
      // referer: null, // 可省略，默认为 null
      // cf_country: null, // 可省略
      // cf_colo: null, // 可省略
      // cf_asn: null, // 可省略
      // cf_http_protocol: null, // 可省略
      // cf_tls_cipher: null, // 可省略
      // cf_tls_version: null, // 可省略
      // cf_threat_score: null, // 可省略
      // cf_trust_score: null // 可省略
    };

    console.log(`Keep-alive ping data (minimal required): ${JSON.stringify(keepAliveData)}`);

    // 异步执行数据库插入 (调用无 HMAC 版本的 insertColorRecord)
    ctx.waitUntil(
      (async () => {
        try {
          await insertColorRecord(keepAliveData, env);
        } catch (dbError: any) {
          console.error(`[CRON_ERROR] Keep-alive task failed for trace ${keepAliveData.trace_id}.`);
        }
      })()
    );
  }
};