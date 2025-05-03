// lib/db-utils.ts (修正版 - 在 Worker 端解码 Base64 Secret)

// Helper function to convert ArrayBuffer to Hex string (保持不变)
function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// --- 添加 Base64 解码辅助函数 ---
function base64ToUint8Array(base64: string): Uint8Array {
    try {
        // atob 在 Worker 环境中可用，用于解码 Base64
        const binary_string = atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    } catch (e: any) {
        console.error("Failed to decode Base64 secret:", e.message);
        // 抛出错误或返回空数组，让后续逻辑处理
        throw new Error("Invalid Base64 secret format");
    }
}
// --- Base64 解码辅助函数结束 ---


// Env 接口 (保持不变)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
    HMAC_SHARED_SECRET: string; // Secret (预期是 Base64 编码的字符串)
}

// ColorRecordData 接口 (保持不变)
interface ColorRecordData {
    color: string;
    trace_id: string;
    source: string; // 'a', 'c', 'i', or 's'
}

export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // 1. 构建 URL (保持不变)
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : '';
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : '';
    const apiPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\//, '') : '';
    const apiUrl = baseUrl + '/' + schemaPath + '/' + apiPath;

    if (!baseUrl || !schemaPath || !apiPath || !apiUrl.startsWith("https://")) {
        console.error("Failed to construct a valid ORDS API URL.", { baseUrl, schemaPath, apiPath });
        throw new Error("Invalid ORDS API URL configuration.");
    }

    // 2. 准备 Body (保持不变)
    const requestBody = JSON.stringify(colorData, null, 0);

    // 3. 计算 HMAC-SHA256 签名
    let signatureHeader = '';
    if (!env.HMAC_SHARED_SECRET) {
        console.error("HMAC_SHARED_SECRET is not configured!");
        throw new Error("HMAC Secret is missing.");
    }
    try {
        // --- *** 修改：先 Base64 解码 Secret *** ---
        const base64Secret = env.HMAC_SHARED_SECRET;
        const secretKeyData = base64ToUint8Array(base64Secret); // <-- 使用解码后的原始字节
        // --- *** 修改结束 *** ---

        const bodyData = new TextEncoder().encode(requestBody); // 请求体仍然是 UTF-8 编码

        // 导入解码后的原始密钥字节
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            secretKeyData, // <-- 使用解码后的字节
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // 计算签名
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
        signatureHeader = bufferToHex(signatureBuffer);

    } catch (e: any) {
        console.error(`HMAC Signature generation/decoding failed for trace ${colorData.trace_id}: ${e.message}`, e);
        throw new Error(`HMAC processing failed: ${e.message}`);
    }

    // 4. 准备 Basic Auth Header (保持不变)
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST request to ORDS for trace_id: ${colorData.trace_id}`);

    // 5. 发送 fetch 请求 (保持不变)
    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': signatureHeader
            },
            body: requestBody
        });
    } catch (fetchError: any) {
        console.error(`Worker fetch request failed for trace ${colorData.trace_id}: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }

    // 6. 检查响应状态 (保持不变)
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try { errorBody = await response.text(); } catch (_) { /* ignore */ }
        if (status === 401 || status === 403) {
            console.error(`HMAC verification likely failed at ORDS. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`HMAC verification failed or forbidden by ORDS: ${status} ${statusText}`);
        } else {
            console.error(`Failed to insert color record (HMAC enabled). Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`Failed to insert color record via ORDS (HMAC enabled): ${status} ${statusText}`);
        }
    } else {
        console.log(`Color record processed successfully by ORDS (HMAC enabled) for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}

