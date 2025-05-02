// lib/db-utils.ts (HMAC Enabled - Final Version for Monthly Tables)

// 定义 Worker 运行所需的环境变量和 Secrets 接口
export interface Env {
    ORDS_BASE_URL: string;      // 例如: "https://W9CIGS..."
    ORDS_SCHEMA_PATH: string;   // 例如: "ords/admin"
    ORDS_API_PATH: string;      // 例如: "api/v1/colors"
    DB_USER: string;            // 例如: "ADMIN"
    DB_PASSWORD: string;        // 数据库密码 (Secret)
    HMAC_SHARED_SECRET: string; // HMAC 共享密钥 (Secret)

    // Db2 相关变量 (稍后添加)
    // DB2_API_URL?: string;
    // DB2_API_AUTH?: string;
}

/**
 * 将字符串编码为 UTF-8 的 Uint8Array.
 * @param data 要编码的字符串.
 * @returns UTF-8 编码的 Uint8Array.
 */
function encodeText(data: string): Uint8Array {
    return new TextEncoder().encode(data);
}

/**
 * 将十六进制字符串转换为 Uint8Array.
 * @param hex 十六进制字符串.
 * @returns 对应的 Uint8Array.
 */
function hexToUint8Array(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
        throw new Error("Invalid hex string length.");
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        const byteValue = parseInt(hex.substring(i, i + 2), 16);
        if (isNaN(byteValue)) {
            throw new Error(`Invalid hex character at position ${i}`);
        }
        bytes[i / 2] = byteValue;
    }
    return bytes;
}

/**
 * 计算 HMAC-SHA256 签名.
 * @param secret 密钥 (十六进制字符串或 UTF-8 字符串).
 * @param body 要签名的消息体 (字符串).
 * @returns 签名的十六进制表示形式.
 */
async function calculateHMACSignature(secret: string, body: string): Promise<string> {
    let keyBytes: Uint8Array;
    // 检查密钥是否是十六进制格式
    if (/^[a-f0-9]+$/i.test(secret) && secret.length % 2 === 0) {
        try { keyBytes = hexToUint8Array(secret); }
        catch (e: any) {
            console.error("Failed to parse secret as hex, treating as UTF-8:", e.message);
            keyBytes = encodeText(secret);
        }
    } else {
        keyBytes = encodeText(secret);
    }

    const key = await crypto.subtle.importKey(
        'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC', key, encodeText(body)
    );
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return signatureHex;
}

/**
 * 定义颜色记录的数据结构.
 */
interface ColorRecordData {
    color: string;
    trace_id: string;
    source: string;
}

/**
 * (HMAC 启用版) 通过 ORDS 端点将颜色记录插入 Oracle 数据库.
 * @param colorData 要插入的数据.
 * @param env Worker 环境.
 */
export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // 1. 构建 URL
    const baseUrl = env.ORDS_BASE_URL.replace(/\/$/, '');
    const schemaPath = env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '');
    const apiPath = env.ORDS_API_PATH.replace(/^\//, '');
    const apiUrl = `${baseUrl}/${schemaPath}/${apiPath}`;

    // 2. 准备 Body (使用紧凑 JSON 格式)
    const requestBody = JSON.stringify(colorData, null, 0);

    // 3. 计算 HMAC 签名 (恢复!)
    let signature: string;
    try {
        signature = await calculateHMACSignature(env.HMAC_SHARED_SECRET, requestBody);
    } catch (e: any) {
        console.error("HMAC Signature Calculation Failed:", e);
        throw new Error(`HMAC calculation failed: ${e.message}`);
    }

    // 4. 准备 Basic Auth Header
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;

    console.log(`Sending POST request to: ${apiUrl} (HMAC Enabled)`); // 日志标明 HMAC 已启用

    // 5. 发送 fetch 请求 (包含 X-Signature Header)
    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': `sha256=${signature}` // <-- 恢复 HMAC Header!
            },
            body: requestBody
        });
    } catch (fetchError: any) {
        console.error(`Workspace request failed: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }

    // 6. 检查响应状态
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        const errorBody = await response.text().catch(() => '[Could not retrieve error body]');
        console.error(`Failed to insert color record (HMAC Enabled). Status: ${status} ${statusText}`, { apiUrl, errorBody });
        throw new Error(`Failed to insert color record via ORDS (HMAC Enabled): ${status} ${statusText}`);
    } else if (response.status !== 201) {
        console.warn(`Insert color record (HMAC Enabled) returned status ${response.status}, expected 201.`);
    } else {
        console.log(`Color record inserted successfully (HMAC Enabled) for trace_id: ${colorData.trace_id}`);
    }
}

// ========================================
// === 旧的 ORDS 管理函数已被移除 ===
// ========================================

