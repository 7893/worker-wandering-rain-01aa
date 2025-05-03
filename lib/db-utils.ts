// lib/db-utils.ts (最终版 - 分区表 + 记录所有信息)

// Env 接口 (无 HMAC)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
}

// *** 更新 ColorRecordData 接口，包含所有要记录的字段 ***
export interface ColorRecordData { // 导出接口以便 src/index.ts 可以引用（或在共享类型文件中定义）
    color: string;
    trace_id: string;
    source: string; // 'a', 'c', 'i', or 's'
    ip_address?: string;       // Client IP (可选)
    user_agent?: string;       // User Agent (可选)
    referer?: string | null;     // Referer (可选, 可能为 null)
    cf_country?: string | null;  // Cloudflare Country (可选)
    cf_colo?: string | null;     // Cloudflare Colo (可选)
    cf_asn?: number | null;      // Cloudflare ASN (可选)
    cf_http_protocol?: string | null; // Cloudflare HTTP Protocol (可选)
    cf_tls_cipher?: string | null;    // Cloudflare TLS Cipher (可选)
    cf_tls_version?: string | null;   // Cloudflare TLS Version (可选)
    cf_threat_score?: number | null;  // Cloudflare Threat Score (可选)
    cf_trust_score?: number | null;   // Cloudflare Client Trust Score (可选)
}


/**
 * (无 HMAC 版) 通过 ORDS 端点将颜色记录插入 Oracle 数据库 (分区表版本).
 * @param colorData 要插入的数据对象，应符合 ColorRecordData 接口.
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
        console.error("Failed to construct a valid ORDS API URL from environment variables.", { baseUrl, schemaPath, apiPath });
        throw new Error("Invalid ORDS API URL configuration.");
    }

    // 2. 准备 Body (将传入的整个 colorData 对象序列化)
    const requestBody = JSON.stringify(colorData, null, 0);

    // 3. 准备 Basic Auth Header
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    // 基本的操作日志
    console.log(`Sending POST request to ORDS for trace_id: ${colorData.trace_id} (Extended Data, HMAC Disabled)`);

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