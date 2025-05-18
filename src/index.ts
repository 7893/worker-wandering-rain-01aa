// src/index.ts (AutoREST 适配版，scheduled 函数模拟用户访问)

import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
// 导入更新后的接口和函数 (来自 AutoREST 版本的 lib/db-utils.ts)
import { insertColorRecord, Env as DbEnv, ColorRecordForAutoRest } from '../lib/db-utils';
import pageTemplate from './template.html';

// Environment Interface (从 db-utils 导入，并确保包含所有 Worker 需要的绑定)
// 您在 wrangler.toml 中定义的 [vars] 和 secrets 会注入到 env 对象中
export interface Env extends DbEnv {
    // 如果有其他绑定 (KV, R2, D1等)，也在这里声明
    // 例如: MY_KV_NAMESPACE: KVNamespace;
}

const limiter = new RateLimiter(30); // 实例本地速率限制器, 每秒30次

export default {
    /**
     * 处理传入的 HTTP 请求 (GET 用于展示页面, POST 用于记录颜色变化)
     */
    async fetch(
        request: Request, // 这个 Request 类型应由 @cloudflare/workers-types 提供，并包含 cf 对象
        env: Env,
        ctx: ExecutionContext // ExecutionContext 应由 @cloudflare/workers-types 提供
    ): Promise<Response> {
        const url = new URL(request.url);

        // 提前获取请求信息，供后续使用
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        const referer = request.headers.get('Referer') || null;
        const cf = request.cf; // Cloudflare 特定请求属性对象

        // --- Handle POST requests (记录颜色变化) ---
        if (request.method === "POST" && url.pathname === '/') {
            const minimumTrustScore = 10; // 智能过滤阈值

            // --- CF 智能过滤 ---
            if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
                console.warn(
                    `Blocking POST request: Low trust score (${cf.clientTrustScore}). ` +
                    `IP: ${clientIp}, Country: ${cf.country || 'N/A'}, ASN: ${cf.asn || 'N/A'}`
                );
                return new Response('Forbidden by trust score', { status: 403 });
            }

            try {
                // 1. Validate Content-Type
                if (request.headers.get("Content-Type") !== "application/json") {
                    console.warn(`Bad POST Content-Type from ${clientIp}: ${request.headers.get("Content-Type")}`);
                    return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
                }

                // 2. Parse JSON (只解析前端发送的核心数据)
                interface IncomingCoreData { color: string; trace_id: string; source: string; }
                const coreData: IncomingCoreData = await request.json();

                // 3. Basic Validation for core data from client
                if (!coreData || typeof coreData.color !== 'string' || !coreData.color.startsWith('#') ||
                    coreData.color.length > 7 || // 额外校验颜色长度
                    typeof coreData.trace_id !== 'string' || coreData.trace_id.length === 0 ||
                    typeof coreData.source !== 'string' ||
                    !['a', 'c', 'i'].includes(coreData.source)) { // 'm' 和 's' source 由 Worker 内部生成
                    console.error("Received invalid core data structure, color format, or source from client:", coreData);
                    return new Response("Bad Request: Invalid core data payload from client", { status: 400 });
                }

                // 4. Apply Rate Limiting
                if (limiter.canProceed()) {
                    // 构建符合 ColorRecordForAutoRest 接口的数据对象
                    // 这些键名需要与数据库表 COLOR_EVENTS 的列名（小写）匹配
                    const fullDataToInsert: ColorRecordForAutoRest = {
                        color: coreData.color,
                        trace_id: coreData.trace_id,
                        source: coreData.source,
                        // event_at: new Date().toISOString(), // 可选：若要 Worker 控制时间。
                        // 若不提供，则依赖数据库的 DEFAULT CURRENT_TIMESTAMP。
                        // 为了与 scheduled 行为一致，可以考虑在此处也显式发送。
                        client_ip: clientIp, // 使用 client_ip 键名
                        user_agent: userAgent,
                        referer: referer,
                        cf_country: (cf && typeof cf.country === 'string') ? cf.country : null,
                        cf_colo: (cf && typeof cf.colo === 'string') ? cf.colo : null,
                        cf_asn: (cf && typeof cf.asn === 'number') ? cf.asn : null,
                        cf_http_protocol: (cf && typeof cf.httpProtocol === 'string') ? cf.httpProtocol : null,
                        cf_tls_cipher: (cf && typeof cf.tlsCipher === 'string') ? cf.tlsCipher : null,
                        cf_tls_version: (cf && typeof cf.tlsVersion === 'string') ? cf.tlsVersion : null,
                        cf_threat_score: (cf && typeof cf.threatScore === 'number') ? cf.threatScore : null,
                        cf_trust_score: (cf && typeof cf.clientTrustScore === 'number') ? cf.clientTrustScore : null,
                        extra: null // 如果要发送 CLOB 数据，可以在这里填充，否则为 null
                    };

                    // 异步调用数据库插入
                    ctx.waitUntil(
                        (async () => {
                            try {
                                await insertColorRecord(fullDataToInsert, env);
                            } catch (dbError: any) {
                                console.error(`Error in waitUntil for insertColorRecord (trace: ${fullDataToInsert.trace_id}) from fetch:`, dbError.message, dbError.stack);
                            }
                        })()
                    );
                    // 立即返回 OK 或 Accepted，表示请求已被接受处理
                    return new Response("OK", { status: 200 }); // 或 202 Accepted

                } else {
                    console.log(`Rate limit exceeded for trace ${coreData.trace_id} from IP ${clientIp}`);
                    return new Response("Too Many Requests", { status: 429 });
                }

            } catch (e: any) {
                // 捕获 JSON 解析错误或其他意外错误
                console.error("Error processing POST request in fetch handler:", e.message, e.stack, e);
                return new Response("Bad Request or Internal Error processing POST", { status: 400 });
            }
        }

        // --- Handle GET requests (提供 HTML 页面) ---
        if (request.method === "GET" && url.pathname === '/') {
            const traceId = generateTraceId(); // 为本次页面加载生成追踪ID
            const colorHex = generateRandomColorHex(); // 为本次页面加载生成初始随机颜色

            // 替换模板中的占位符
            const htmlContent = pageTemplate
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

        // --- Default response (未匹配到路由) ---
        return new Response("Not Found", { status: 404 });
    },

    /**
     * Handles scheduled events (Cron Triggers) - 模拟一次用户访问行为.
     */
    async scheduled(
        event: ScheduledEvent, // ScheduledEvent 类型应由 @cloudflare/workers-types 提供
        env: Env,
        ctx: ExecutionContext // ExecutionContext 类型应由 @cloudflare/workers-types 提供
    ): Promise<void> {
        console.log(`[${new Date().toISOString()}] Cron Trigger (Simulated User Visit) Fired: ${event.cron}`);

        const simulatedColor = generateRandomColorHex(); // 生成随机颜色
        const simulatedTraceId = `cron-sim-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

        // 构建模拟的用户访问数据
        // 这些键名需要与数据库表 COLOR_EVENTS 的列名（小写）匹配
        const simulatedUserData: ColorRecordForAutoRest = {
            color: simulatedColor,
            trace_id: simulatedTraceId,
            source: 'm', // 'm' for "mocked" or "simulated" user visit via cron
            event_at: new Date().toISOString(), // 显式发送事件时间 (ISO 8601 UTC)

            // 模拟/预设其他字段
            client_ip: "CRON_SIMULATED_IP", // 服务器发起的占位符IP
            user_agent: "WanderingRain-Cron-Simulator/1.0 (Scheduled Task)",
            referer: "urn:cloudflare:worker:scheduled", // 表明来源是计划任务

            // Cloudflare 特定字段 (cf_*) - 在 scheduled 上下文中无法获取真实值
            // 设置为 null 或有意义的占位符/默认值
            cf_country: "XX",       // "XX" for Unknown/Unspecified (或您服务器所在地区)
            cf_colo: "SYSTEM",      // "SYSTEM" or null
            cf_asn: 0,              // 0 or null
            cf_http_protocol: "SYSTEM", // "SYSTEM" or null
            cf_tls_cipher: null,    // 对于系统内部调用，这些通常不适用
            cf_tls_version: null,
            cf_threat_score: 0,     // 假设系统触发的威胁分为0 (低威胁)
            cf_trust_score: 99,    // 假设系统触发的信任分为高 (接近100表示更可信)
            extra: null             // 如果需要填充 CLOB 字段
        };

        console.log(`Simulated user visit data for AutoREST: ${JSON.stringify(simulatedUserData)}`);

        ctx.waitUntil(
            (async () => {
                try {
                    // 使用 Partial<ColorRecordForAutoRest> 是因为 insertColorRecord 的参数类型
                    // 但我们这里提供了所有必要的字段
                    await insertColorRecord(simulatedUserData, env);
                    console.log(`Successfully logged simulated user visit (trace: ${simulatedTraceId}) via cron.`);
                } catch (dbError: any) {
                    console.error(`[CRON_SIM_ERROR] Simulated user visit task failed for trace ${simulatedUserData.trace_id}. Error:`, dbError.message, dbError.stack);
                }
            })()
        );
    }
};