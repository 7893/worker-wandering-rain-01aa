// src/index.ts (最终版本 - 修正了 clientTrustScore 类型检查)

// --- Imports ---
import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
import { insertColorRecord, Env as DbEnv } from '../lib/db-utils'; // 使用更新后的 db-utils
import pageTemplate from './template.html';

// --- Environment Interface ---
// 确保 Env 类型从 db-utils 导入，它现在包含了 HMAC_SHARED_SECRET (即使我们暂时不用HMAC，类型里有也没关系)
type Env = DbEnv;

// --- Globals / Initialization ---
const limiter = new RateLimiter(30); // 实例本地速率限制器

// --- Worker Definition ---
export default {
  /**
   * Handles incoming HTTP requests.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    const url = new URL(request.url);

    // --- Handle POST requests for logging color changes ---
    if (request.method === "POST" && url.pathname === '/') {

      // --- 添加 CF 智能过滤 START ---
      const cf = request.cf;
      const minimumTrustScore = 10; // 可调阈值

      // --- *** 修改后的 if 条件 *** ---
      // 使用更严格的类型检查来避免 TypeScript 错误
      if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
        // --- *** 修改结束 *** ---
        console.warn(
          `Blocking request: Low trust score (${cf.clientTrustScore}). ` +
          `IP: ${request.headers.get('cf-connecting-ip')}, Country: ${cf?.country || 'N/A'}, ASN: ${cf?.asn || 'N/A'}` // 加上可选链或默认值
        );
        return new Response('Forbidden', { status: 403 });
      }
      // --- 添加 CF 智能过滤 END ---

      // --- POST 处理逻辑 START ---
      try {
        // 1. Validate Content-Type
        if (request.headers.get("Content-Type") !== "application/json") {
          return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
        }

        // 2. Parse JSON
        interface IncomingColorData {
          color: string;
          trace_id: string;
          source: string;
        }
        const data: IncomingColorData = await request.json();

        // 3. Basic Validation (检查字段和来源)
        // 注意：不再检查 's'，因为 's' 来源由 scheduled handler 发起，不经过 fetch handler
        if (!data || typeof data.color !== 'string' || !data.color.startsWith('#') ||
          typeof data.trace_id !== 'string' || typeof data.source !== 'string' ||
          !['a', 'c', 'i'].includes(data.source)) { // 只允许 'a', 'c', 'i' 通过此路径
          console.error("Received invalid data structure, color format, or source for fetch handler:", data);
          return new Response("Bad Request: Invalid data payload, color format, or source", { status: 400 });
        }

        // 4. Apply Rate Limiting
        if (limiter.canProceed()) {
          const colorDataToInsert = data;

          // 使用 ctx.waitUntil 异步调用 insertColorRecord
          ctx.waitUntil(
            (async () => {
              try {
                await insertColorRecord(colorDataToInsert, env);
              } catch (dbError: any) {
                // 错误已在 insertColorRecord 内部记录
              }
            })()
          );

          // 立即返回 OK 给客户端
          return new Response("OK", { status: 200 });

        } else {
          console.log(`Rate limit exceeded for trace ${data.trace_id}`);
          return new Response("Too Many Requests", { status: 429 });
        }

      } catch (e: any) {
        // 捕获 JSON 解析错误等
        console.error("Error processing POST request in fetch handler:", e.message, e);
        return new Response("Bad Request", { status: 400 });
      }
      // --- POST 处理逻辑 END ---
    }

    // --- Handle GET requests to serve the HTML page ---
    if (request.method === "GET" && url.pathname === '/') {
      const traceId = generateTraceId();
      const colorHex = generateRandomColorHex();

      // 替换 HTML 模板中的占位符
      let htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__TRACE_ID__', traceId)
        .replaceAll('__INITIAL_COLOR_HEX__', colorHex); // 用于 JS 获取初始颜色

      // 返回 HTML 页面
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
    }

    // --- Default response for other methods/paths ---
    return new Response("Not Found", { status: 404 });
  },

  /**
   * Handles scheduled events (Cron Triggers) for database keep-alive.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // 记录 Cron 触发事件
    console.log(`[${new Date().toISOString()}] Cron Trigger Fired: ${event.cron} - Initiating keep-alive ping.`);

    // 准备用于保活的特殊数据
    const keepAliveData = {
      color: '#KEEPALV', // 固定颜色值，7 字符
      trace_id: `cron-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`, // 生成唯一追踪 ID
      source: 's' // 's' 代表 scheduled/system
    };

    console.log(`Keep-alive ping data: ${JSON.stringify(keepAliveData)}`);

    // 异步执行数据库插入操作，不阻塞 Cron 返回
    ctx.waitUntil(
      (async () => {
        try {
          // 调用启用了 HMAC 的 insertColorRecord 函数
          // 后端 PL/SQL 的 CHECK 约束需要允许 's'
          await insertColorRecord(keepAliveData, env);
          // 成功日志已在 insertColorRecord 内部记录
        } catch (dbError: any) {
          // 失败日志也已在 insertColorRecord 内部记录
          console.error(`[CRON_ERROR] Keep-alive task failed for trace ${keepAliveData.trace_id}. Error captured in insertColorRecord.`);
        }
      })()
    );
  }
};