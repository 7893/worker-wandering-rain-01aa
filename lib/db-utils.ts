// lib/db-utils.ts (硬编码简单密钥的调试版本)

// Helper function to convert ArrayBuffer to Hex string (保持不变)
function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Env 接口 (不再需要 HMAC_SHARED_SECRET)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
    // HMAC_SHARED_SECRET: string; // 不再从 env 获取
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

    // --- *** 修改：HMAC 计算使用硬编码简单密钥 *** ---
    let signatureHeader = '';
    const hardcodedSecret = "ThisIsMySuperSimpleTestKey123!"; // <-- 硬编码密钥

    try {
        // 直接将简单密钥字符串编码为 UTF-8 字节
        const secretKeyData = new TextEncoder().encode(hardcodedSecret);
        const bodyData = new TextEncoder().encode(requestBody);

        // 导入密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw', secretKeyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        // 计算签名
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
        signatureHeader = bufferToHex(signatureBuffer);

    } catch (e: any) {
        console.error(`HMAC Signature generation failed (hardcoded key) for trace ${colorData.trace_id}: ${e.message}`, e);
        throw new Error(`HMAC Signature generation failed: ${e.message}`);
    }
    // --- *** 修改结束 *** ---

    // 4. 准备 Basic Auth (保持不变)
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST request to ORDS for trace_id: ${colorData.trace_id} (Using Hardcoded Key)`);

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
            console.error(`HMAC verification likely failed at ORDS (hardcoded key). Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`HMAC verification failed or forbidden by ORDS: ${status} ${statusText}`);
        } else {
            console.error(`Failed to insert color record (HMAC hardcoded). Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`Failed to insert color record via ORDS (HMAC hardcoded): ${status} ${statusText}`);
        }
    } else {
        console.log(`Color record processed successfully by ORDS (HMAC hardcoded) for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}

