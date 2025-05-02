// lib/db-utils.ts (HMAC Temporarily Disabled)

// 定义 Worker 运行所需的环境变量和 Secrets 接口
export interface Env {
    ORDS_BASE_URL: string;      // 例如: "https://W9CIGS..."
    ORDS_SCHEMA_PATH: string;   // 例如: "ords/admin"
    ORDS_API_PATH: string;      // 例如: "api/v1/colors"
    DB_USER: string;            // 例如: "ADMIN"
    DB_PASSWORD: string;        // 数据库密码 (应设为 Secret)
    HMAC_SHARED_SECRET: string; // HMAC 共享密钥 (应设为 Secret) - 暂时不用但保留定义
  
    // 未来可能添加的 Db2 相关变量
    // DB2_API_URL?: string;
    // DB2_API_AUTH?: string;
  }
  
  /**
   * 定义期望的颜色记录数据结构接口.
   */
  interface ColorRecordData {
      color: string;
      trace_id: string;
      source: string;
  }
  
  /**
   * (HMAC 禁用版) 通过已定义的 ORDS 端点将颜色记录插入到 Oracle 数据库.
   * @param colorData 要插入的颜色数据对象.
   * @param env Worker 的环境变量和 Secrets.
   */
  export async function insertColorRecord(colorData: ColorRecordData, env: Env): Promise<void> {
      // 1. 构建完整的 API 端点 URL
      const baseUrl = env.ORDS_BASE_URL.replace(/\/$/, '');
      const schemaPath = env.ORDS_SCHEMA_PATH.replace(/^\/|\/$/g, '');
      const apiPath = env.ORDS_API_PATH.replace(/^\//, '');
      const apiUrl = `${baseUrl}/${schemaPath}/${apiPath}`;
  
      // 2. 准备请求体: 转换为标准化的 JSON 字符串
      const requestBody = JSON.stringify(colorData, null, 0); // 使用无多余空格格式
  
      // 3. 计算 HMAC 签名 (已禁用!)
      // const signature = await calculateHMACSignature(env.HMAC_SHARED_SECRET, requestBody);
  
      // 4. 准备 Basic Authentication 请求头
      const credentials = `${env.DB_USER}:${env.DB_PASSWORD}`;
      const basicAuthHeader = `Basic ${btoa(credentials)}`;
  
      console.log(`Sending POST request to: ${apiUrl} (HMAC DISABLED)`); // 日志标明 HMAC 已禁用
  
      // 5. 发送 fetch 请求 (不包含 X-Signature Header)
      let response: Response;
      try {
          response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': basicAuthHeader
                  // 'X-Signature': `sha256=${signature}` // <-- HMAC Header 已移除!
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
          console.error(`Failed to insert color record (HMAC Disabled). Status: ${status} ${statusText}`, { apiUrl, errorBody });
          throw new Error(`Failed to insert color record via ORDS (HMAC Disabled): ${status} ${statusText}`);
      } else if (response.status !== 201) {
          console.warn(`Insert color record (HMAC Disabled) returned status ${response.status}, expected 201.`);
      } else {
           console.log(`Color record inserted successfully (HMAC Disabled) for trace_id: ${colorData.trace_id}`); // 明确记录成功（HMAC已禁用）
      }
  }
  
  // ===========================================================
  // === HMAC 相关函数暂时移除或注释掉，因为不再需要 ===
  // ===========================================================
  /*
  function encodeText(data: string): Uint8Array { ... }
  function hexToUint8Array(hex: string): Uint8Array { ... }
  async function calculateHMACSignature(secret: string, body: string): Promise<string> { ... }
  */
  
  // ========================================
  // === 旧的 ORDS 管理函数已被移除 ===
  // ========================================