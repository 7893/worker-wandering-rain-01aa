// src/index.ts (最终版 - 分区表 + 记录所有信息 + 再次修正 TS 类型错误)

// --- Imports ---
import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
// 导入更新后的接口和函数
import { insertColorRecord, Env as DbEnv, ColorRecordData } from '../lib/db-utils';
import pageTemplate from './template.html';

// --- Environment Interface ---
type Env = DbEnv;

// --- Globals / Initialization ---
const limiter = new RateLimiter(30);

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
    const referer = request.headers.get('Referer') || null; // Referer 可能不存在
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
          // --- *** 构建包含所有信息的完整数据对象 (使用最严格类型检查) *** ---
          const fullDataToInsert: ColorRecordData = {
            // 来自前端的核心数据
            color: coreData.color,
            trace_id: coreData.trace_id,
            source: coreData.source,
            // 从请求中提取的附加数据
            ip_address: clientIp,
            user_agent: userAgent,
            referer: referer,
            // --- 最严格地检查从 request.cf 中提取数据的赋值方式 ---
            cf_country: (cf && typeof cf.country === 'string') ? cf.country : null,
            cf_colo: (cf && typeof cf.colo === 'string') ? cf.colo : null,
            cf_asn: (cf && typeof cf.asn === 'number') ? cf.asn : null,
            cf_http_protocol: (cf && typeof cf.httpProtocol === 'string') ? cf.httpProtocol : null,
            cf_tls_cipher: (cf && typeof cf.tlsCipher === 'string') ? cf.tlsCipher : null,
            cf_tls_version: (cf && typeof cf.tlsVersion === 'string') ? cf.tlsVersion : null,
            cf_threat_score: (cf && typeof cf.threatScore === 'number') ? cf.threatScore : null,
            cf_trust_score: (cf && typeof cf.clientTrustScore === 'number') ? cf.clientTrustScore : null
          };
          // --- *** 数据对象构建结束 *** ---

          // 异步调用数据库插入
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

    // Cron 任务没有真实的请求上下文，填充特定值或 NULL
    const keepAliveData: ColorRecordData = {
      color: '#KEEPALV',
      trace_id: `cron-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
      source: 's',
      ip_address: 'cron_trigger', // 特殊标记
      user_agent: 'cloudflare-cron', // 标记来源
      referer: null,
      cf_country: null,
      cf_colo: null,
      cf_asn: null,
      cf_http_protocol: null,
      cf_tls_cipher: null,
      cf_tls_version: null,
      cf_threat_score: null,
      cf_trust_score: null
    };

    console.log(`Keep-alive ping data: ${JSON.stringify(keepAliveData)}`);

    // 异步执行数据库插入
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