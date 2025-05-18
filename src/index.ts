// src/index.ts (AutoREST 适配版，scheduled 函数模拟用户访问，修正 source 和 event_at)

import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
import { insertColorRecord, Env as DbEnv, ColorRecordForAutoRest } from '../lib/db-utils';
import pageTemplate from './template.html';

export interface Env extends DbEnv {
    // MY_KV_NAMESPACE: KVNamespace;
}

const limiter = new RateLimiter(30);

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const url = new URL(request.url);

        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        const referer = request.headers.get('Referer') || null;
        const cf = request.cf;

        if (request.method === "POST" && url.pathname === '/') {
            const minimumTrustScore = 10;

            if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
                console.warn(
                    `Blocking POST request: Low trust score (${cf.clientTrustScore}). ` +
                    `IP: ${clientIp}, Country: ${cf.country || 'N/A'}, ASN: ${cf.asn || 'N/A'}`
                );
                return new Response('Forbidden by trust score', { status: 403 });
            }

            try {
                if (request.headers.get("Content-Type") !== "application/json") {
                    console.warn(`Bad POST Content-Type from ${clientIp}: ${request.headers.get("Content-Type")}`);
                    return new Response("Bad Request: Expected Content-Type application/json", { status: 400 });
                }

                interface IncomingCoreData { color: string; trace_id: string; source: string; }
                const coreData: IncomingCoreData = await request.json();

                if (!coreData || typeof coreData.color !== 'string' || !coreData.color.startsWith('#') ||
                    coreData.color.length > 7 ||
                    typeof coreData.trace_id !== 'string' || coreData.trace_id.length === 0 ||
                    typeof coreData.source !== 'string' ||
                    !['a', 'c', 'i'].includes(coreData.source)) {
                    console.error("Received invalid core data structure, color format, or source from client:", coreData);
                    return new Response("Bad Request: Invalid core data payload from client", { status: 400 });
                }

                if (limiter.canProceed()) {
                    const fullDataToInsert: ColorRecordForAutoRest = {
                        color: coreData.color,
                        trace_id: coreData.trace_id,
                        source: coreData.source,
                        event_at: new Date().toISOString(), // 显式发送 event_at
                        client_ip: clientIp,
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
                        extra: null
                    };

                    ctx.waitUntil(
                        (async () => {
                            try {
                                await insertColorRecord(fullDataToInsert, env);
                            } catch (dbError: any) {
                                console.error(`Error in waitUntil for insertColorRecord (trace: ${fullDataToInsert.trace_id}) from fetch:`, dbError.message, dbError.stack);
                            }
                        })()
                    );
                    return new Response("OK", { status: 200 });

                } else {
                    console.log(`Rate limit exceeded for trace ${coreData.trace_id} from IP ${clientIp}`);
                    return new Response("Too Many Requests", { status: 429 });
                }

            } catch (e: any) {
                console.error("Error processing POST request in fetch handler:", e.message, e.stack, e);
                return new Response("Bad Request or Internal Error processing POST", { status: 400 });
            }
        }

        if (request.method === "GET" && url.pathname === '/') {
            const traceId = generateTraceId();
            const colorHex = generateRandomColorHex();
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

        return new Response("Not Found", { status: 404 });
    },

    async scheduled(
        event: ScheduledEvent,
        env: Env,
        ctx: ExecutionContext
    ): Promise<void> {
        console.log(`[${new Date().toISOString()}] Cron Trigger (Simulated User Visit) Fired: ${event.cron}`);

        const simulatedColor = generateRandomColorHex();
        const simulatedTraceId = `cron-sim-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

        const simulatedUserData: ColorRecordForAutoRest = {
            color: simulatedColor, // 使用随机生成的颜色
            trace_id: simulatedTraceId,
            source: 's', // 修改为 's' 以符合数据库 CHECK_COLOR_EVENTS_SRC 约束
            event_at: new Date().toISOString(), // 显式发送事件时间
            client_ip: "CRON_SIMULATED_IP",
            user_agent: "WanderingRain-Cron-Simulator/1.0 (Scheduled Task)",
            referer: "urn:cloudflare:worker:scheduled",
            cf_country: "XX",
            cf_colo: "SYSTEM",
            cf_asn: 0,
            cf_http_protocol: "SYSTEM",
            cf_tls_cipher: null,
            cf_tls_version: null,
            cf_threat_score: 0,
            cf_trust_score: 99,
            extra: null
        };

        console.log(`Simulated user visit data for AutoREST (cron): ${JSON.stringify(simulatedUserData)}`);

        ctx.waitUntil(
            (async () => {
                try {
                    await insertColorRecord(simulatedUserData, env);
                    console.log(`Successfully logged simulated user visit (trace: ${simulatedTraceId}) via cron.`);
                } catch (dbError: any) {
                    console.error(`[CRON_SIM_ERROR] Simulated user visit task failed for trace ${simulatedUserData.trace_id}. Error:`, dbError.message, dbError.stack);
                }
            })()
        );
    }
};