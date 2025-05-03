// lib/db-utils.ts (最终无 HMAC 版本)

// Env 接口 (无 HMAC_SHARED_SECRET)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
}

// ColorRecordData 接口
interface ColorRecordData {
    color: string;
    trace_id: string;
    source: string; // 'a', 'c', 'i', or 's'
}

/**
 * (无 HMAC 版) 通过 ORDS 端点将颜色记录插入 Oracle 数据库.
 * @param colorData 要插入的数据.
 * @param env Worker 环境.
 */
export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // 1. 构建 URL
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : '';
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : '';
    const apiPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\//, '') : '';
    const apiUrl = baseUrl + '/' + schemaPath + '/' + apiPath; // 使用字符串连接

    // 检查 URL
    if (!baseUrl || !schemaPath || !apiPath || !apiUrl.startsWith("https://")) {
        console.error("Failed to construct a valid ORDS API URL.", { baseUrl, schemaPath, apiPath });
        throw new Error("Invalid ORDS API URL configuration.");
    }

    // 2. 准备 Body
    const requestBody = JSON.stringify(colorData, null, 0);

    // 3. 准备 Basic Auth Header
    const credentials = `<span class="math-inline">\{env\.DB\_USER\}\:</span>{env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST request to ORDS for trace_id: ${colorData.trace_id} (HMAC Disabled)`);

    // 4. 发送 fetch 请求
    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader
                // 没有 X-Signature Header
            },
            body: requestBody
        });
    } catch (fetchError: any) {
        console.error(`Worker fetch request failed for trace ${colorData.trace_id}: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }

    // 5. 检查响应状态
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try { errorBody = await response.text(); } catch (_) { /* ignore */ }
        console.error(`Failed to insert color record. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
        throw new Error(`Failed to insert color record via ORDS: ${status} ${statusText}`);
    } else {
        console.log(`Color record processed successfully by ORDS for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}

