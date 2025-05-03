// lib/db-utils.ts (无 HMAC 版本)

// Env 接口 (移除 HMAC_SHARED_SECRET)
export interface Env {
    ORDS_BASE_URL: string;
    ORDS_SCHEMA_PATH: string;
    ORDS_API_PATH: string;
    DB_USER: string;
    DB_PASSWORD: string; // Secret
    // HMAC_SHARED_SECRET 不再需要
  }
  
  // ColorRecordData 接口 (保持不变)
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
    // 1. 构建 URL (不变)
    const baseUrl = env.ORDS_BASE_URL.replace(/\/$/, '');
    const schemaPath = env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '');
    const apiPath = env.ORDS_API_PATH.replace(/^\//, '');
    const apiUrl = `<span class="math-inline">\{baseUrl\}/</span>{schemaPath}/${apiPath}`;
  
    // 2. 准备 Body (不变)
    const requestBody = JSON.stringify(colorData, null, 0);
  
    // 3. HMAC 计算被移除
  
    // 4. 准备 Basic Auth Header (不变)
    const credentials = `<span class="math-inline">\{env\.DB\_USER\}\:</span>{env.DB_PASSWORD}`;
    const basicAuthHeader = `Basic ${btoa(credentials)}`;
  
    console.log(`Sending POST request to: ${apiUrl} (HMAC Disabled)`);
  
    // 5. 发送 fetch 请求 (不包含 X-Signature Header)
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
        console.error(`Worker fetch request failed: ${fetchError.message}`, fetchError);
        throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
    }
  
    // 6. 检查响应状态 (可以简化错误消息)
    if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        let errorBody = '[Could not retrieve error body]';
        try {
            errorBody = await response.text();
        } catch (_) { /* ignore */ }
        console.error(`Failed to insert color record. Status: ${status} ${statusText}. Request Trace: ${colorData.trace_id}`, { apiUrl, responseBody: errorBody });
        throw new Error(`Failed to insert color record via ORDS: ${status} ${statusText}`);
    } else {
         console.log(`Color record processed successfully by ORDS for trace_id: ${colorData.trace_id}. Status: ${response.status}`);
    }
  }