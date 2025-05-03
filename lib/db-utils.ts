// lib/db-utils.ts

// Helper function to convert ArrayBuffer to Hex string
// (Ensure this function exists or is imported)
function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// --- 更新 Env 接口，添加 HMAC_SHARED_SECRET ---
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
    HMAC_SHARED_SECRET: string; // Secret <-- 添加 HMAC Secret
}

// Interface for ColorRecordData (定义或确保存在)
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
    const baseUrl = env.ORDS_BASE_URL.replace(/\/$/, '');
    const schemaPath = env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '');
    const apiPath = env.ORDS_API_PATH.replace(/^\//, '');
    const apiUrl = `${baseUrl}/${schemaPath}/${apiPath}`;

    // 2. 准备 Body (使用紧凑 JSON 格式)
    const requestBody = JSON.stringify(colorData, null, 0); // Body as string

    // --- HMAC 计算 START ---
    // 3. 计算 HMAC-SHA256 签名
    let signatureHeader = ''; // Initialize as empty string
    if (!env.HMAC_SHARED_SECRET) {
        // 在实际部署前，确保 HMAC_SHARED_SECRET 已经在 Cloudflare Secrets 中配置好
        console.error("HMAC_SHARED_SECRET is not configured in Worker environment!");
        throw new Error("HMAC Secret is missing in configuration.");
    }
    try {
        // 使用 TextEncoder 将密钥字符串和请求体字符串转换为 UTF-8 字节
        const secretKeyData = new TextEncoder().encode(env.HMAC_SHARED_SECRET);
        const bodyData = new TextEncoder().encode(requestBody);

        // 导入密钥以供 Web Crypto API 使用
        const cryptoKey = await crypto.subtle.importKey(
            'raw', // 密钥格式为原始字节
            secretKeyData,
            { name: 'HMAC', hash: 'SHA-256' }, // 指定 HMAC 算法和 SHA-256 哈希
            false, // 密钥是否可导出 (设为 false 更安全)
            ['sign'] // 密钥用途是签名
        );

        // 计算签名 (结果是 ArrayBuffer)
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);

        // 将签名 (ArrayBuffer) 转换为十六进制 (Hex) 字符串，以便放入 Header
        signatureHeader = bufferToHex(signatureBuffer);

    } catch (e: any) {
        console.error("HMAC Signature generation failed:", e.message, e);
        // 抛出错误，阻止继续发送请求
        throw new Error(`HMAC Signature generation failed: ${e.message}`);
    }
    // --- HMAC 计算 END ---

    // 4. 准备 Basic Auth Header
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST request to: ${apiUrl} with HMAC Signature (len: ${signatureHeader.length})`);

    // 5. 发送 fetch 请求 (包含 X-Signature Header)
    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': signatureHeader // <-- 添加计算出的签名 Header
            },
            body: requestBody // 发送字符串形式的 Body
        });
    } catch (fetchError: any) {
        console.error(`Worker fetch request failed: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }

    // 6. 检查响应状态
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try {
            // 尝试读取错误响应体以获取更多信息
            errorBody = await response.text();
        } catch (_) { /* 忽略读取错误 */ }

        // 特别处理 401/403，因为这很可能是 HMAC 验证失败
        if (status === 401 || status === 403) {
            console.error(`HMAC verification likely failed at ORDS. Status: ${status} ${statusText}. Check secrets match and PL/SQL validation logic. Request Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            // 抛出特定错误信息
            throw new Error(`HMAC verification failed or forbidden by ORDS: ${status} ${statusText}`);
        } else {
            // 其他类型的错误
            console.error(`Failed to insert color record (with HMAC). Status: ${status} ${statusText}. Request Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
            throw new Error(`Failed to insert color record via ORDS (with HMAC): ${status} ${statusText}`);
        }
    } else {
        // 请求成功 (后端可能返回 200 OK 或 201 Created)
        console.log(`Color record processed successfully by ORDS (with HMAC) for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
}

