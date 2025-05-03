// lib/db-utils.ts (带调试日志的 HMAC 版本)

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

export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // --- 添加调试日志 START ---
    console.log("--- DEBUG START ---");
    console.log("env.ORDS_BASE_URL:", env.ORDS_BASE_URL);
    console.log("env.ORDS_SCHEMA_PATH:", env.ORDS_SCHEMA_PATH);
    console.log("env.ORDS_API_PATH:", env.ORDS_API_PATH);
    console.log("env.DB_USER:", env.DB_USER);
    // 检查 Secrets 是否看起来存在 (不打印实际值)
    console.log("env.DB_PASSWORD exists?", typeof env.DB_PASSWORD === 'string' && env.DB_PASSWORD.length > 0);
    console.log("env.HMAC_SHARED_SECRET exists?", typeof env.HMAC_SHARED_SECRET === 'string' && env.HMAC_SHARED_SECRET.length > 0);
    // --- 添加调试日志 END ---

    // 1. 构建 URL (添加检查避免 undefined.replace 报错)
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : 'ERROR_BASE_URL_IS_MISSING_OR_UNDEFINED';
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : 'ERROR_SCHEMA_PATH_IS_MISSING_OR_UNDEFINED';
    const apiPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\//, '') : 'ERROR_API_PATH_IS_MISSING_OR_UNDEFINED';
    const apiUrl = `<span class="math-inline">\{baseUrl\}/</span>{schemaPath}/${apiPath}`;

    // --- 添加调试日志 START ---
    console.log("Constructed apiUrl:", apiUrl);
    console.log("--- DEBUG END ---");
    // --- 添加调试日志 END ---

    // 2. 准备 Body (不变)
    const requestBody = JSON.stringify(colorData, null, 0);

    // 3. 计算 HMAC (保持不变)
    let signatureHeader = '';
    if (!env.HMAC_SHARED_SECRET) {
        console.error("HMAC_SHARED_SECRET is not configured!");
        throw new Error("HMAC Secret is missing.");
    }
    try {
        const secretKeyData = new TextEncoder().encode(env.HMAC_SHARED_SECRET);
        const bodyData = new TextEncoder().encode(requestBody);
        const cryptoKey = await crypto.subtle.importKey('raw', secretKeyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
        signatureHeader = bufferToHex(signatureBuffer);
    } catch (e: any) {
        console.error("HMAC Signature generation failed:", e.message, e);
        throw new Error(`HMAC Signature generation failed: ${e.message}`);
    }

    // 4. 准备 Basic Auth (不变)
    const credentials = `<span class="math-inline">\{env\.DB\_USER\}\:</span>{env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    // 5. 发送 fetch 请求
    let response: Response;
    try {
        console.log(`Attempting fetch to: ${apiUrl}`); // 添加 fetch 前的日志
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': signatureHeader
            },
            body: requestBody
        });
        console.log(`Workspace call completed. Status: ${response.status}`); // 添加 fetch 后的日志
    } catch (fetchError: any) {
        // 捕获网络层面的 fetch 错误
        console.error(`Worker fetch request itself failed: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`); // 重新抛出，会被上层捕获
    }

    // 6. 检查响应状态 (不变)
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try {
            errorBody = await response.text();
        } catch (_) { /* ignore */ }
        if (status === 401 || status === 403) {
            console.error(`HMAC verification likely failed at ORDS. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`HMAC verification failed or forbidden by ORDS: ${status} ${statusText}`);
        } else {
            console.error(`Failed to insert color record (with HMAC). Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`Failed to insert color record via ORDS (with HMAC): ${status} ${statusText}`);
        }
    } else {
        console.log(`Color record processed successfully by ORDS for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}