/// <reference types="@cloudflare/workers-types" />
import { insertColorRecord, Env as DbEnv, ColorRecordForAutoRest, AE_ACCOUNT_ID, AE_DATASET } from '../lib/db-utils';
import { generateRandomColorHex } from '../lib/color-utils';
import { pageTemplate } from './template';
import { styleCss } from './assets/style';
import { scriptJs } from './assets/script';

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

function getCurrentUTCTime(): string { return new Date().toISOString(); }
const sh = (extras?: Record<string, string>) => securityHeaders(extras);

function writeAE(env: DbEnv, event_type: string, color: string, source: string, country: string, colo: string, threat: number, trust: number, trace_id: string) {
    env.AE.writeDataPoint({
        blobs: [color, source, country, colo, event_type],
        doubles: [threat, trust],
        indexes: [trace_id],
    });
}

export async function handleGetIndex(request: Request, env: DbEnv): Promise<Response> {
    const colorHex = generateRandomColorHex();
    const cf = request.cf;
    const country = (cf && typeof cf.country === 'string') ? cf.country : '';
    const colo = (cf && typeof cf.colo === 'string') ? cf.colo : '';
    writeAE(env, 'pageview', colorHex, 'p', country, colo, 0, 0, crypto.randomUUID());

    const styleHash = btoa(styleCss.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const scriptHash = btoa(scriptJs.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const htmlContent = pageTemplate
        .replaceAll('__COLOR_HEX__', colorHex)
        .replaceAll('__COLOR_HEX_URL_ENCODED__', colorHex.replace('#', '%23'))
        .replaceAll('__STYLE_URL__', `/assets/style.${styleHash}.css`)
        .replaceAll('__SCRIPT_URL__', `/assets/script.${scriptHash}.js`);
    return new Response(htmlContent, {
        headers: sh({
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache", "Expires": "0"
        })
    });
}

export async function handleGetStats(env: DbEnv): Promise<Response> {
    const sql = `SELECT blob5 as event_type, blob3 as country, count() as cnt FROM '${AE_DATASET}' WHERE toDate(timestamp) = toDate(now()) GROUP BY blob5, blob3 ORDER BY cnt DESC LIMIT 50`;
    try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${AE_ACCOUNT_ID}/analytics_engine/sql`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'text/plain' },
            body: sql,
        });
        const data = await res.json() as any;
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'stats_unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
export async function handleStaticAsset(pathname: string): Promise<Response> {
    // 用内容 hash 做版本，防止部署后用户缓存旧文件
    const styleHash = btoa(styleCss.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);
    const scriptHash = btoa(scriptJs.slice(0, 32)).replace(/[^a-z0-9]/gi, '').slice(0, 8);

    const headers = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
    };

    if (pathname === `/assets/style.${styleHash}.css` || pathname === '/assets/style.css') {
        return new Response(styleCss, {
            headers: { ...headers, 'Content-Type': 'text/css; charset=UTF-8' }
        });
    }
    if (pathname === `/assets/script.${scriptHash}.js` || pathname === '/assets/script.js') {
        return new Response(scriptJs, {
            headers: { ...headers, 'Content-Type': 'application/javascript; charset=UTF-8' }
        });
    }
    return new Response('Not Found', { status: 404 });
}

export async function handlePostColor(request: Request, env: DbEnv, ctx: ExecutionContext): Promise<Response> {
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || 'unknown';
    const cf = request.cf;

    // 1. 信任分检查
    const minimumTrustScore = 10;
    if (cf && typeof cf.clientTrustScore === 'number' && cf.clientTrustScore < minimumTrustScore) {
        console.warn(`Blocking POST: Low trust score (${cf.clientTrustScore}) from ${clientIp}`);
        writeAE(env, 'abuse', '', 'blocked', (cf as any).country ?? '', (cf as any).colo ?? '', (cf as any).threatScore ?? 0, cf.clientTrustScore, crypto.randomUUID());
        return new Response(JSON.stringify({ error: 'forbidden', reason: 'low_trust_score' }), {
            status: 403, headers: sh({ 'Content-Type': 'application/json' })
        });
    }

    // 2. Content-Type 检查
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
        return new Response(JSON.stringify({ error: 'bad_request', reason: 'expected_application_json' }), {
            status: 400, headers: sh({ 'Content-Type': 'application/json' })
        });
    }

    // 3. Payload 大小检查
    const bodyText = await request.text();
    if (bodyText.length > 2048) {
        return new Response(JSON.stringify({ error: 'payload_too_large' }), {
            status: 413, headers: sh({ 'Content-Type': 'application/json' })
        });
    }

    // 4. 解析和验证数据
    let coreData: { color: string; trace_id: string; source: string };
    try {
        coreData = JSON.parse(bodyText);
    } catch {
        return new Response(JSON.stringify({ error: 'bad_request', reason: 'invalid_json' }), {
            status: 400, headers: sh({ 'Content-Type': 'application/json' })
        });
    }

    const colorOk = typeof coreData?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(coreData.color);
    const traceOk = typeof coreData?.trace_id === 'string' && coreData.trace_id.length > 0 && coreData.trace_id.length <= 36;
    if (!coreData || !colorOk || !traceOk || !['a', 'c', 'i', 's'].includes(coreData.source)) {
        return new Response(JSON.stringify({ error: 'bad_request', reason: 'invalid_payload' }), {
            status: 400, headers: sh({ 'Content-Type': 'application/json' })
        });
    }

    // 5. 数据准备与异步写入
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const referer = request.headers.get('Referer') || null;

    const fullData: ColorRecordForAutoRest = {
        color: coreData.color,
        trace_id: coreData.trace_id,
        source: coreData.source,
        event_at: getCurrentUTCTime(),
        client_ip: clientIp,
        user_agent: userAgent.slice(0, 1000),
        referer: referer ? referer.slice(0, 2000) : null,
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

    // 发送即忘记 (Fire and Forget) - 立即响应客户端
    ctx.waitUntil(Promise.all([
        insertColorRecord(fullData, env).catch(err => {
            console.error(`Async insert failed for trace ${coreData.trace_id}:`, err);
        }),
        Promise.resolve(writeAE(env, 'color', coreData.color, coreData.source, fullData.cf_country ?? '', fullData.cf_colo ?? '', fullData.cf_threat_score ?? 0, fullData.cf_trust_score ?? 0, coreData.trace_id)),
    ]));

    return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200, headers: sh({ 'Content-Type': 'application/json' })
    });
}

// Cron 任务处理
export async function handleScheduled(event: ScheduledEvent, env: DbEnv, ctx: ExecutionContext): Promise<void> {
    const HEALTHCHECK_URL = 'https://hc-ping.com/2850399e-4203-4e81-81f1-30515002282c';
    
    ctx.waitUntil(
        (async () => {
            // 1. 第一时间 ping Healthchecks,证明 Worker 被唤醒
            await fetch(HEALTHCHECK_URL).catch(() => {});
            
            // 2. 执行业务逻辑
            try {
                const simulatedColor = generateRandomColorHex();
                const simulatedTraceId = `cron-sim-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
                
                console.log(`Cron triggered: ${event.cron}, trace: ${simulatedTraceId}`);

                const data: ColorRecordForAutoRest = {
                    color: simulatedColor,
                    trace_id: simulatedTraceId,
                    source: 's',
                    event_at: getCurrentUTCTime(),
                    client_ip: "CRON_SIMULATED_IP",
                    user_agent: "WanderingRain-Cron-Simulator/1.0",
                    referer: "urn:cloudflare:worker:scheduled",
                    cf_country: "XX",
                    cf_colo: "SYSTEM",
                    cf_asn: 0,
                    cf_http_protocol: "SYSTEM",
                    cf_threat_score: 0,
                    cf_trust_score: 99
                };

                await insertColorRecord(data, env);
                writeAE(env, 'cron', simulatedColor, 's', 'XX', 'SYSTEM', 0, 99, simulatedTraceId);
                console.log(`Cron success: ${simulatedTraceId}`);
            } catch (err) {
                console.error('Cron execution failed:', err);
                // 通知 Healthchecks 失败
                await fetch(`${HEALTHCHECK_URL}/fail`).catch(() => {});
            }
        })()
    );
}
