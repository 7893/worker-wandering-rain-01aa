// lib/db-utils.ts (最终版本，启用 HMAC，移除调试日志)

// Helper function to convert ArrayBuffer to Hex string
function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Env 接口 (包含 HMAC_SHARED_SECRET)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
    HMAC_SHARED_SECRET: string; // Secret
}

// ColorRecordData 接口
interface ColorRecordData {
    color: string;
    trace_id: string;
    source: string; // 'a', 'c', 'i', or 's'
}

/**
 * (HMAC Enabled Version) 通过 ORDS 端点将颜色记录插入 Oracle 数据库.
 * Calculates HMAC-SHA256 signature and includes it in the X-Signature header.
 * @param colorData 要插入的数据.
 * @param env Worker 环境 (必须包含 HMAC_SHARED_SECRET).
 */
export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // 1. 构建 URL
    // 添加检查避免 undefined.replace 报错，并在出错时给默认值或在后面抛错
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : '';
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : '';
    const apiPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\//, '') : '';

    // 使用字符串连接构造 URL
    const apiUrl = baseUrl + '/' + schemaPath + '/' + apiPath;

    // 增加一个对最终 URL 的基本检查
    if (!baseUrl || !schemaPath || !apiPath || !apiUrl.startsWith("https://")) {
        console.error("Failed to construct a valid ORDS API URL from environment variables.", { baseUrl, schemaPath, apiPath });
        throw new Error("Invalid ORDS API URL configuration.");
    }

    // 2. 准备 Body
    const requestBody = JSON.stringify(colorData, null, 0); // Body as string

    // 3. 计算 HMAC-SHA256 签名
    let signatureHeader = '';
    if (!env.HMAC_SHARED_SECRET) {
        console.error("HMAC_SHARED_SECRET is not configured in Worker environment!");
        throw new Error("HMAC Secret is missing in configuration.");
    }
    try {
        const secretKeyData = new TextEncoder().encode(env.HMAC_SHARED_SECRET);
        const bodyData = new TextEncoder().encode(requestBody);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            secretKeyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
        signatureHeader = bufferToHex(signatureBuffer);
    } catch (e: any) {
        console.error(`HMAC Signature generation failed for trace ${colorData.trace_id}: ${e.message}`, e);
        throw new Error(`HMAC Signature generation failed: ${e.message}`);
    }

    // 4. 准备 Basic Auth Header
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    // 保留一个基本的发送日志
    console.log(`Sending POST request to ORDS for trace_id: ${colorData.trace_id}`);

    // 5. 发送 fetch 请求
    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': signatureHeader // 发送 HMAC 签名
            },
            body: requestBody
        });
    } catch (fetchError: any) {
        // 捕获网络层面的 fetch 错误
        console.error(`Worker fetch request failed for trace ${colorData.trace_id}: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }

    // 6. 检查响应状态
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try {
            errorBody = await response.text();
        } catch (_) { /* ignore */ }

        // 区分 HMAC 验证失败和其他错误
        if (status === 401 || status === 403) {
            console.error(`HMAC verification likely failed at ORDS. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`HMAC verification failed or forbidden by ORDS: ${status} ${statusText}`);
        } else {
            console.error(`Failed to insert color record (HMAC enabled). Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`Failed to insert color record via ORDS (HMAC enabled): ${status} ${statusText}`);
        }
    } else {
        // 请求成功
        console.log(`Color record processed successfully by ORDS (HMAC enabled) for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}