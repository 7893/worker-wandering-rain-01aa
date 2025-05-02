// lib/db-utils.ts

// 定义 Worker 运行所需的环境变量和 Secrets 接口
// (如果你有单独的 bindings.d.ts 文件，也可以放在那里)
export interface Env {
    ORDS_BASE_URL: string;      // 例如: "https://<adb_host>"
    ORDS_SCHEMA_PATH: string;   // 例如: "ords/admin"
    ORDS_API_PATH: string;      // 例如: "api/v1/colors"
    DB_USER: string;            // 例如: "ADMIN"
    DB_PASSWORD: string;        // 数据库密码 (应设为 Secret)
    HMAC_SHARED_SECRET: string; // HMAC 共享密钥 (应设为 Secret)

    // 未来可能添加的 Db2 相关变量 (设为 Secret)
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
        console.warn("Warning: Hex string length is odd. Assuming leading zero was omitted if applicable.");
        // Handle potentially odd length if necessary, e.g., prepend '0'
        // hex = '0' + hex; // Or throw error based on expected format
        // For now, throw error for robustness if odd length is truly invalid
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
    // 检查密钥是否可能是十六进制格式 (只包含 0-9, a-f, 且长度为偶数)
    // 你的密钥 '64de...' 符合这个格式
    if (/^[a-f0-9]+$/i.test(secret) && secret.length % 2 === 0) {
        try {
            keyBytes = hexToUint8Array(secret);
        } catch (e: any) {
            console.error("Failed to parse secret as hex, treating as UTF-8 string:", e.message);
            keyBytes = encodeText(secret); // Fallback to text if hex parsing fails unexpectedly
        }
    } else {
        // 否则视为 UTF-8 字符串
        keyBytes = encodeText(secret);
    }

    // 导入密钥
    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false, // 不可提取
        ['sign'] // 用途为签名
    );

    // 计算签名
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encodeText(body) // 对 UTF-8 编码的消息体进行签名
    );

    // 将签名的 ArrayBuffer 转换为十六进制字符串
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signatureHex;
}

/**
 * 定义期望的颜色记录数据结构接口.
 */
interface ColorRecordData {
    color: string;
    trace_id: string;
    source: string;
    // 如果 Worker 会发送 'extra' 字段，在这里也添加定义
    // extra?: any;
}

/**
 * 通过已定义的 ORDS 端点将颜色记录插入到 Oracle 数据库.
 * @param colorData 要插入的颜色数据对象.
 * @param env Worker 的环境变量和 Secrets.
 */
export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
    // 1. 构建完整的 API 端点 URL
    const baseUrl = env.ORDS_BASE_URL.replace(/\/$/, ''); // 移除末尾斜杠
    const schemaPath = env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, ''); // 移除首尾斜杠
    const apiPath = env.ORDS_API_PATH.replace(/^\//, ''); // 移除开头斜杠
    const apiUrl = `${baseUrl}/${schemaPath}/${apiPath}`;

    // 2. 准备请求体: 转换为标准化的 JSON 字符串 (无多余空格)
    const requestBody = JSON.stringify(colorData); // 标准 JSON 字符串化
    // 注意: 对于极其严格的 HMAC 验证，有时需要更规范的格式，例如无空格:
    // const requestBody = JSON.stringify(colorData, null, 0);
    // 或者 const requestBody = JSON.stringify(colorData, Object.keys(colorData).sort()); // 如果顺序也重要

    // 3. 计算 HMAC 签名
    let signature: string;
    try {
        signature = await calculateHMACSignature(env.HMAC_SHARED_SECRET, requestBody);
    } catch (e: any) {
        console.error("HMAC Signature Calculation Failed:", e);
        throw new Error(`HMAC calculation failed: ${e.message}`);
    }


    // 4. 准备 Basic Authentication 请求头
    const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`; // 使用 Worker 环境提供的 btoa

    // 5. 发送 fetch 请求
    console.log(`Sending POST request to: ${apiUrl}`); // (可选) 打印目标 URL 用于调试

    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': basicAuthHeader,
                'X-Signature': `sha256=${signature}` // 添加 HMAC 签名头
            },
            body: requestBody // 发送 JSON 字符串
        });
    } catch (fetchError: any) {
        console.error(`Workspace request failed: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }


    // 6. 检查响应状态
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        // 尝试读取错误响应体用于调试，但要注意可能没有响应体或读取失败
        const errorBody = await response.text().catch(() => '[Could not retrieve error body]');
        console.error(`Failed to insert color record. Status: ${status} ${statusText}`, { apiUrl, requestBody: '...', errorBody }); // 不记录完整的请求体以防敏感数据

        // 抛出错误，让调用者知道操作失败
        throw new Error(`Failed to insert color record via ORDS: ${status} ${statusText}`);
    } else if (response.status !== 201) {
        // 状态码是 2xx 但不是 201 Created，可能也表示某种非预期情况
        console.warn(`Insert color record returned status ${response.status}, expected 201.`);
        // 可以选择性地记录响应体
        // const responseBody = await response.text();
        // console.log(`Response body for status ${response.status}:`, responseBody);
    } else {
        // 成功 (201 Created)
        // console.log(`Color record inserted successfully via ORDS for trace_id: ${colorData.trace_id}`); // (可选) 成功日志
    }
}

// ========================================
// === 旧函数已被移除 ===
// - tableExists(...)
// - createTable(...)
// - registerRestApi(...)
// - ensureMonthlyTableAndRestApi(...)
// ========================================