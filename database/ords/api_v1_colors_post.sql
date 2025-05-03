-- database/ords/api_v1_colors_post.sql

-- 确保 Schema 已启用 (根据需要替换 YOUR_SCHEMA_NAME)
BEGIN
    ORDS.ENABLE_SCHEMA(
        p_enabled             => TRUE,
        p_schema              => 'ADMIN', -- <-- 替换为您的 Schema
        p_url_mapping_type    => 'BASE_PATH',
        p_url_mapping_pattern => 'admin', -- <-- 替换为您的 Schema 映射路径
        p_auto_rest_auth      => FALSE
    );
EXCEPTION WHEN OTHERS THEN -- 如果已启用，忽略 ORA-20049 错误
    IF SQLCODE = -20049 THEN NULL; ELSE RAISE; END IF;
END;
/


-- 定义或更新服务
BEGIN

    -- 1. 定义模块
    ORDS.DEFINE_MODULE(
        p_module_name    => 'api.v1',
        p_base_path      => '/api/v1/',
        p_items_per_page => 25,
        p_status         => 'PUBLISHED',
        p_comments       => 'API for Color Logging v1 (Partitioned Table)'
    );

    -- 2. 定义模板
    ORDS.DEFINE_TEMPLATE(
        p_module_name    => 'api.v1',
        p_pattern        => 'colors',
        p_priority       => 0,
        p_etag_type      => 'NONE',
        p_etag_query     => NULL,
        p_comments       => 'Endpoint for handling color data (inserts into colors_log)'
    );

    -- 3. 定义 POST Handler (调用简化后的 handle_post_colors)
    ORDS.DEFINE_HANDLER(
        p_module_name    => 'api.v1',
        p_pattern        => 'colors',
        p_method         => 'POST',
        p_source_type    => ORDS.source_type_plsql,
        p_items_per_page => 0,
        p_mimes_allowed  => 'application/json',
        p_comments       => 'Handles POST requests to log color data to partitioned table (HMAC Disabled).',
        p_source         => q'[
            DECLARE
              l_proc_status_code NUMBER;
            BEGIN
              -- 直接调用已简化的过程 (无签名参数)
              handle_post_colors(
                  p_body        => :body,
                  p_status_code => :status_code -- 尝试让 ORDS 自动映射 OUT 参数
              );
              -- 如果上面的 :status_code 不能自动映射, 可能需要改回显式设置:
              -- handle_post_colors(p_body => :body, p_status_code => l_proc_status_code);
              -- ords.response.set_status(l_proc_status_code); -- 或者 owa_util.status_line(...)

            END;
        ]'
    );

    -- 提交更改
    COMMIT;

END;
/



