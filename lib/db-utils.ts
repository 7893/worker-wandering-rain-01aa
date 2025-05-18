// lib/db-utils.ts (AutoREST 版本)

// Env 接口定义 Worker 的环境变量绑定
export interface Env {
    ORDS_BASE_URL: string;    // 例如: "https://<hash>-<dbname>.adb.<region>.oraclecloudapps.com/ords"
    ORDS_SCHEMA_PATH: string; // 例如: "admin" (您 ORDS Schema 的 URL 映射路径)
    ORDS_API_PATH: string;    // 表/对象别名，例如: "colorevents"
    DB_USER: string;          // 例如: "ADMIN"
    DB_PASSWORD: string;      // 从 Cloudflare Secrets 获取
}

// 数据接口，键名与数据库表 COLOR_EVENTS 的列名（小写）一致
export interface ColorRecordForAutoRest {
    color: string;
    trace_id: string;
    source: string;
    event_at?: string;          // 可选，若不提供，依赖数据库 DEFAULT CURRENT_TIMESTAMP
    // 若提供，格式应为 'YYYY-MM-DDTHH:MI:SSZ' (ISO 8601 UTC)
    client_ip?: string;         // 对应数据库的 client_ip 列
    user_agent?: string;
    referer?: string | null;
    cf_country?: string | null;
    cf_colo?: string | null;
    cf_asn?: number | null;
    cf_http_protocol?: string | null;
    cf_tls_cipher?: string | null;
    cf_tls_version?: string | null;
    cf_threat_score?: number | null;
    cf_trust_score?: number | null;
    extra?: string | null;      // 对应数据库的 extra CLOB 列，作为字符串发送
}


/**
 * (AutoREST 版) 通过 ORDS AutoREST 端点将颜色记录插入 Oracle 数据库.
 * @param colorData 要插入的数据对象，部分或全部符合 ColorRecordForAutoRest 接口.
 * @param env Worker 环境.
 */
export async function insertColorRecord(colorData: Partial<ColorRecordForAutoRest>, env: Env): Promise<void> {
    // 1. 构建 URL
    const baseUrl = env.ORDS_BASE_URL ? env.ORDS_BASE_URL.replace(/\/$/, '') : ''; // 移除末尾斜杠以防重复
    const schemaPath = env.ORDS_SCHEMA_PATH ? env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '') : ''; // 移除前后斜杠
    const tableAliasPath = env.ORDS_API_PATH ? env.ORDS_API_PATH.replace(/^\/|\/$/g, '') : ''; // 移除前后斜杠

    // AutoREST 表端点通常以斜杠结尾
    const apiUrl = `${baseUrl}/${schemaPath}/${tableAliasPath}/`;

    // 检查 URL
    if (!baseUrl || !schemaPath || !tableAliasPath || !apiUrl.startsWith("https://")) {
        console.error(
            "Failed to construct a valid ORDS AutoREST API URL from environment variables.",
            { baseUrl, schemaPath, tableAliasPath, constructedUrl: apiUrl }
        );
        throw new Error("Invalid ORDS AutoREST API URL configuration.");
    }

    // 2. 准备 Body
    const requestBody = JSON.stringify(colorData); // 移除了 null, 0，因为 Partial 对象直接 stringify 即可

    // 3. 准备 Basic Auth Header
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`; // btoa 在 Workers 环境中可用

    console.log(`Sending POST to AutoREST: ${apiUrl} for trace_id: ${colorData.trace_id}`);

    // 4. 发送 fetch 请求
    let response: Response; // Response 类型应由 @cloudflare/workers-types 或 lib: ["WebWorker"] 提供
    try {
        response = await fetch(apiUrl, { // fetch 在 Workers 环境中可用
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader
            },
            body: requestBody
        });
    } catch (fetchError: any) {
        console.error(`Worker fetch to AutoREST failed. Trace: ${colorData.trace_id}, URL: ${apiUrl}, Error: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS AutoREST: ${fetchError.message}`);
    }

    // 5. 检查响应状态
    if (!response.ok) { // AutoREST POST 成功通常是 201 Created
        const status = response.status;
        const statusText = response.statusText;
        let errorBodyText = '[Could not retrieve error body text]';
        try {
            errorBodyText = await response.text();
        } catch (e) {
            console.warn(`Could not get text from error response body for trace ${colorData.trace_id}`, e);
        }
        console.error(
            `Failed to insert via AutoREST. Status: ${status} ${statusText}. Trace: ${colorData.trace_id}, URL: ${apiUrl}`,
            { requestBodySent: requestBody, responseBodyText: errorBodyText }
        );
        throw new Error(`Failed to insert via AutoREST: ${status} ${statusText}. Response: ${errorBodyText}`);
    } else {
        console.log(`AutoREST POST success for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
        // 可选：解析响应体，例如获取新创建记录的 ID
        // const responseData = await response.json();
        // console.log("AutoREST response data:", responseData);
    }
}