// lib/db-utils.ts (HMAC Completely Removed - For Monthly Tables)

// Env 接口定义 (移除了不再需要的 HMAC_SHARED_SECRET)
export interface Env {
    ORDS_BASE_URL: string;      // 例如: "https://W9CIGS..."
    ORDS_SCHEMA_PATH: string;   // 例如: "ords/admin"
    ORDS_API_PATH: string;      // 例如: "api/v1/colors"
    DB_USER: string;            // 例如: "ADMIN"
    DB_PASSWORD: string;        // 数据库密码 (Secret)
    // HMAC_SHARED_SECRET: string; // 不再需要
  
    // Db2 相关变量 (未来添加)
    // DB2_API_URL?: string;
    // DB2_API_AUTH?: string;
  }
  
  /**
   * 定义颜色记录的数据结构接口.
   */
  interface ColorRecordData {
      color: string;
      trace_id: string;
      source: string;
  }
  
  /**
   * (无 HMAC 版) 通过 ORDS 端点将颜色记录插入 Oracle 数据库 (后端处理月度表).
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
  
      // 3. 计算 HMAC 签名 (已彻底移除!)
  
      // 4. 准备 Basic Auth Header
      const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
      const basicAuthHeader = `Basic ${btoa(credentials)}`;
  
      console.log(`Sending POST request to: ${apiUrl} (HMAC Removed)`); // 日志标明 HMAC 已移除
  
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
          console.error(`Workspace request failed: ${fetchError.message}`, fetchError);
          throw new Error(`Network error calling ORDS endpoint: ${fetchError.message}`);
      }
  
      // 6. 检查响应状态
      if (!response.ok) {
          const status = response.status;
          const statusText = response.statusText;
          const errorBody = await response.text().catch(() => '[Could not retrieve error body]');
          console.error(`Failed to insert color record (HMAC Removed). Status: ${status} ${statusText}`, { apiUrl, errorBody });
          throw new Error(`Failed to insert color record via ORDS (HMAC Removed): ${status} ${statusText}`);
      } else if (response.status !== 201) {
          console.warn(`Insert color record (HMAC Removed) returned status ${response.status}, expected 201.`);
      } else {
           console.log(`Color record inserted successfully (HMAC Removed) for trace_id: ${colorData.trace_id}`);
      }
  }
  
  // ===========================================================
  // === HMAC 相关函数已彻底移除 ===
  // ===========================================================
  
  // ========================================
  // === 旧的 ORDS 管理函数已被移除 ===
  // ========================================

  