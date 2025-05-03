// src/index.ts

// --- Imports ---
import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
import { insertColorRecord, Env as DbEnv } from '../lib/db-utils';
import pageTemplate from './template.html';

// --- Environment Interface ---
// Make sure Env includes potential secrets needed by scheduled handler if different
type Env = DbEnv; // If scheduled needs other secrets, extend this type

// --- Globals / Initialization ---
const limiter = new RateLimiter(30);

// --- Worker Definition ---
export default {
  /**
   * Handles incoming HTTP requests.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    const url = new URL(request.url);

    // --- Handle POST requests for logging color changes ---
    if (request.method === "POST" && url.pathname === '/') {

        // --- ADD CF Filtering START ---
        const cf = request.cf;
        // 设置一个信任评分阈值，低于此分数的请求将被拒绝
        // 0-10 通常是非常可疑的，11-20 可疑。您可以根据需要调整这个值。
        const minimumTrustScore = 10;

        if (cf?.clientTrustScore !== undefined && cf.clientTrustScore < minimumTrustScore) {
            // 记录被阻止的请求信息，有助于分析和调整阈值
            console.warn(
              `Blocking request: Low trust score (${cf.clientTrustScore}). ` +
              `IP: ${request.headers.get('cf-connecting-ip')}, Country: ${cf.country}, ASN: ${cf.asn}, ` +
              `JA3: ${cf.ja3Fingerprint}` // JA3 指纹有助于识别特定客户端/机器人
            );
            // 返回 403 Forbidden
            return new Response('Forbidden', { status: 403 });
        }
        // --- ADD CF Filtering END ---

        // --- Existing POST logic START ---
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

            // 3. Basic Validation (Keep this defense-in-depth)
            if (!data || typeof data.color !== 'string' || !data.color.startsWith('#') ||
                typeof data.trace_id !== 'string' || typeof data.source !== 'string' ||
                !['a', 'c', 'i'].includes(data.source) ) { // 确保来源是我们预期的几种
                console.error("Received invalid data structure, color format, or source:", data);
                return new Response("Bad Request: Invalid data payload, color format, or source", { status: 400 });
            }

            // 4. Apply Rate Limiting (Keep this instance-local limit)
            if (limiter.canProceed()) {
                // Prepare data object for insertColorRecord
                const colorDataToInsert = {
                    color: data.color,
                    trace_id: data.trace_id,
                    source: data.source
                };

                // Use ctx.waitUntil for async DB operation
                ctx.waitUntil(
                    (async () => {
                        try {
                            await insertColorRecord(colorDataToInsert, env);
                        } catch (dbError) {
                            console.error(`Database operation failed for trace ${data.trace_id}:`, dbError);
                        }
                    })()
                );

                // Return OK immediately
                return new Response("OK", { status: 200 });

            } else {
                console.log(`Rate limit exceeded for trace ${data.trace_id}`);
                return new Response("Too Many Requests", { status: 429 });
            }

        } catch (e: any) {
            // Log JSON parsing errors etc.
            console.error("Error processing POST request:", e.message, e);
            return new Response("Bad Request", { status: 400 });
        }
        // --- Existing POST logic END ---
    }

    // --- Handle GET requests to serve the HTML page ---
    if (request.method === "GET" && url.pathname === '/') {
      const traceId = generateTraceId();
      const colorHex = generateRandomColorHex();

      let htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__TRACE_ID__', traceId)
        // Ensure this placeholder replacement still exists if you kept the corresponding JS code
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

    // --- Default response for other methods/paths ---
    return new Response("Not Found", { status: 404 });
  },

  // --- ADD scheduled handler for Keep-Alive START ---
  /**
   * Handles scheduled events (Cron Triggers) for database keep-alive.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[${new Date().toISOString()}] Cron Trigger Fired: ${event.cron} - Initiating keep-alive ping.`);

    // Prepare minimal data for the keep-alive record
    const keepAliveData = {
      color: '#KEEPALV', // Special identifiable color (7 chars)
      trace_id: `cron-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`, // Unique trace for cron
      source: 's' // 's' for scheduled/system
    };

    console.log(`Keep-alive ping data: ${JSON.stringify(keepAliveData)}`);

    // Use waitUntil to allow the operation to complete after the handler returns
    ctx.waitUntil(
      (async () => {
        try {
          // Reuse the existing insertColorRecord function
          // Ensure the backend PL/SQL procedure `handle_post_colors`
          // accepts 's' as a valid source in its CHECK constraint.
          await insertColorRecord(keepAliveData, env);
          console.log(`[${new Date().toISOString()}] Keep-alive ping sent successfully for trace_id: ${keepAliveData.trace_id}`);
        } catch (dbError: any) {
          // Log errors prominently for scheduled tasks
          console.error(`[${new Date().toISOString()}] Keep-alive database operation failed for trace ${keepAliveData.trace_id}:`, dbError.message, dbError.cause || dbError);
          // Consider adding external alerting here if keep-alive failures are critical
        }
      })()
    );
  }
  // --- ADD scheduled handler for Keep-Alive END ---
};


