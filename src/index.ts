// src/index.ts (AutoREST 适配版，scheduled 函数模拟用户访问，修正 source 和 event_at)

import { generateRandomColorHex } from '../lib/color-utils';
import { generateTraceId } from '../lib/trace-utils';
import { RateLimiter } from '../lib/rate-limit';
import { insertColorRecord, Env as DbEnv, ColorRecordForAutoRest } from '../lib/db-utils';
import pageTemplate from './template';

function securityHeaders(extra?: Record<string, string>): HeadersInit {
    const base: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Robots-Tag': 'noindex, nofollow',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
    return { ...(base as any), ...(extra || {}) };
}

function getHongKongTime(): string {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Hong_Kong' }).replace(' ', 'T');
}

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
        const isCustomDomain = !/\.workers\.dev$/i.test(url.hostname);
        const isHttps = url.protocol === 'https:';
        const baseExtra: Record<string, string> = {};
        if (isCustomDomain && isHttps) {
            baseExtra['Strict-Transport-Security'] = 'max-age=15552000; includeSubDomains';
        }
        // Default Content Security Policy. For the HTML page, we override with a nonce-based CSP.
        baseExtra['Content-Security-Policy'] = [
            "default-src 'self'",
            "img-src 'self' data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self' 'unsafe-inline'",
            "connect-src 'self'",
            "base-uri 'none'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        ].join('; ');

        const sh = (extras?: Record<string, string>) => securityHeaders({ ...(baseExtra as any), ...(extras || {}) });

        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        const referer = request.headers.get('Referer') || null;
        const cf = request.cf;

        // Basic health check endpoint for observability
        if (request.method === 'GET' && url.pathname === '/health') {
            const body = JSON.stringify({ status: 'ok', time: getHongKongTime() });
            return new Response(body, {
                status: 200,
                headers: sh({
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                })
            });
        }

        // CORS preflight handling (restrict to same-origin by default)
        if (request.method === 'OPTIONS') {
            const origin = request.headers.get('Origin') || '';
            const allowOrigin = origin && origin === url.origin ? origin : '';
            if (!allowOrigin) {
                return new Response(null, { status: 204, headers: sh() });
            }
            return new Response(null, {
                status: 204,
                headers: sh({
                    'Access-Control-Allow-Origin': allowOrigin,
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '600'
                })
            });
        }

        if (request.method === "POST" && url.pathname === '/') {
            const minimumTrustScore = 10;

            if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
                console.warn(
                    `Blocking POST request: Low trust score (${cf.clientTrustScore}). ` +
                    `IP: ${clientIp}, Country: ${cf.country || 'N/A'}, ASN: ${cf.asn || 'N/A'}`
                );
                return new Response(JSON.stringify({ error: 'forbidden', reason: 'low_trust_score' }), {
                    status: 403,
                    headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' })
                });
            }

            try {
                const contentType = request.headers.get('Content-Type') || '';
                if (!contentType.toLowerCase().startsWith('application/json')) {
                    console.warn(`Bad POST Content-Type from ${clientIp}: ${contentType}`);
                    return new Response(
                        JSON.stringify({ error: 'bad_request', reason: 'expected_application_json' }),
                        { status: 400, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                    );
                }

                // Enforce same-origin POST when Origin header is present (browsers)
                const origin = request.headers.get('Origin');
                if (origin && origin !== url.origin) {
                    console.warn(`Cross-origin POST blocked. Origin=${origin}, Expect=${url.origin}, IP=${clientIp}`);
                    return new Response(
                        JSON.stringify({ error: 'forbidden', reason: 'cross_origin' }),
                        { status: 403, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                    );
                }

                // Very small payload; reject abnormally large bodies early on Free plan
                const cl = request.headers.get('Content-Length');
                if (cl && Number(cl) > 2048) {
                    return new Response(
                        JSON.stringify({ error: 'payload_too_large' }),
                        { status: 413, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                    );
                }

                interface IncomingCoreData { color: string; trace_id: string; source: string; }
                const coreData: IncomingCoreData = await request.json();

                const colorOk = typeof coreData?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(coreData.color);
                const traceOk = typeof coreData?.trace_id === 'string' && coreData.trace_id.length > 0 && coreData.trace_id.length <= 36; // align DB limit
                if (!coreData || !colorOk || !traceOk ||
                    typeof coreData.source !== 'string' ||
                    !['a', 'c', 'i'].includes(coreData.source)) {
                    console.error("Received invalid core data structure, color format, or source from client:", coreData);
                    return new Response(
                        JSON.stringify({ error: 'bad_request', reason: 'invalid_payload' }),
                        { status: 400, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                    );
                }

                if (limiter.canProceed()) {
                    // Sanitize header-derived fields to DB column sizes
                    const userAgentSafe = (userAgent || 'unknown').slice(0, 1000);
                    const refererSafe = referer ? referer.slice(0, 2000) : null;
                    const fullDataToInsert: ColorRecordForAutoRest = {
                        color: coreData.color,
                        trace_id: coreData.trace_id,
                        source: coreData.source,
                        event_at: getHongKongTime(), // 使用香港时区
                        client_ip: clientIp,
                        user_agent: userAgentSafe,
                        referer: refererSafe,
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
                    return new Response(JSON.stringify({ status: 'ok' }), {
                        status: 200,
                        headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' })
                    });

                } else {
                    console.log(`Rate limit exceeded for trace ${coreData.trace_id} from IP ${clientIp}`);
                    return new Response(
                        JSON.stringify({ error: 'too_many_requests' }),
                        { status: 429, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                    );
                }

            } catch (e: any) {
                console.error("Error processing POST request in fetch handler:", e?.message, e?.stack, e);
                return new Response(
                    JSON.stringify({ error: 'bad_request', reason: 'invalid_json_or_internal' }),
                    { status: 400, headers: sh({ 'Content-Type': 'application/json; charset=UTF-8' }) }
                );
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
                headers: sh({
                    "Content-Type": "text/html; charset=UTF-8",
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0"
                })
            });
        }

        // Basic robots.txt to avoid indexing demo pages
        if (request.method === 'GET' && url.pathname === '/robots.txt') {
            const txt = 'User-agent: *\nDisallow: /\n';
            return new Response(txt, { headers: sh({ 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }) });
        }

        return new Response("Not Found", { status: 404, headers: sh({ 'Content-Type': 'text/plain; charset=UTF-8' }) });
    },

    async scheduled(
        event: ScheduledEvent,
        env: Env,
        ctx: ExecutionContext
    ): Promise<void> {
        console.log(`[${getHongKongTime()}] Cron Trigger (Simulated User Visit) Fired: ${event.cron}`);

        const simulatedColor = generateRandomColorHex();
        const simulatedTraceId = `cron-sim-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

        const simulatedUserData: ColorRecordForAutoRest = {
            color: simulatedColor, // 使用随机生成的颜色
            trace_id: simulatedTraceId,
            source: 's', // 修改为 's' 以符合数据库 CHECK_COLOR_EVENTS_SRC 约束
            event_at: getHongKongTime(), // 使用香港时区
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
