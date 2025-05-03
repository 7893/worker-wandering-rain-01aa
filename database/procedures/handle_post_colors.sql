-- database/procedures/handle_post_colors.sql

CREATE OR REPLACE PROCEDURE handle_post_colors (
    -- (无 p_signature 参数)
    p_body        IN  BLOB,
    p_status_code OUT NUMBER
)
AS
    -- 核心数据变量
    l_color           VARCHAR2(7);
    l_trace_id        VARCHAR2(36);
    l_source          CHAR(1);
    l_client_ip       VARCHAR2(45); -- IP 地址变量

    -- 工具变量
    l_body_clob       CLOB;
    l_dest_offset     INTEGER := 1;
    l_src_offset      INTEGER := 1;
    l_lang_context    INTEGER := DBMS_LOB.DEFAULT_LANG_CTX;
    l_warning         INTEGER;

BEGIN
    p_status_code := 201; -- Default success (Created or Accepted)

    -- 转换 Body 为 CLOB
    DBMS_LOB.CREATETEMPORARY(lob_loc => l_body_clob, cache => TRUE);
    DBMS_LOB.CONVERTTOCLOB(dest_lob=>l_body_clob, src_blob=>p_body, amount=>DBMS_LOB.LOBMAXSIZE, dest_offset=>l_dest_offset, src_offset=>l_src_offset, blob_csid=>NLS_CHARSET_ID('AL32UTF8'), lang_context=>l_lang_context, warning=>l_warning);

    -- 解析 JSON (包括 ip_address)
    BEGIN
        l_color     := JSON_VALUE(l_body_clob, '$.color'     RETURNING VARCHAR2(7)  ERROR ON ERROR);
        l_trace_id  := JSON_VALUE(l_body_clob, '$.trace_id'  RETURNING VARCHAR2(36) ERROR ON ERROR);
        l_source    := JSON_VALUE(l_body_clob, '$.source'    RETURNING CHAR(1)      ERROR ON ERROR);
        l_client_ip := JSON_VALUE(l_body_clob, '$.ip_address' RETURNING VARCHAR2(45) ERROR ON ERROR NULL ON EMPTY); -- 解析 IP
    EXCEPTION WHEN OTHERS THEN
        p_status_code := 400; -- Bad Request: JSON parsing error
        IF DBMS_LOB.ISTEMPORARY(l_body_clob) = 1 THEN DBMS_LOB.FREETEMPORARY(l_body_clob); END IF;
        RETURN;
    END;

    -- 数据校验 (依赖表约束，也可加初步校验)
    IF l_color IS NULL OR l_trace_id IS NULL OR l_source IS NULL OR
       l_source NOT IN ('a', 'c', 'i', 's') THEN
       p_status_code := 400; -- Bad Request: Invalid data
       IF DBMS_LOB.ISTEMPORARY(l_body_clob) = 1 THEN DBMS_LOB.FREETEMPORARY(l_body_clob); END IF;
       RETURN;
    END IF;

    -- 直接向固定的分区表 colors_log 插入数据
    BEGIN
        INSERT INTO colors_log (color, trace_id, source, client_ip) -- 使用固定表名
        VALUES (l_color, l_trace_id, l_source, l_client_ip);       -- 插入包括 IP 在内的数据
    EXCEPTION
        WHEN OTHERS THEN -- 捕获可能的插入错误 (例如违反约束)
            p_status_code := 500; -- Internal Server Error
            -- 可以在这里记录错误到日志表（如果需要）
            IF DBMS_LOB.ISTEMPORARY(l_body_clob) = 1 THEN DBMS_LOB.FREETEMPORARY(l_body_clob); END IF;
            RETURN; -- 返回错误状态
    END;

    -- 清理 LOB
    DBMS_LOB.FREETEMPORARY(lob_loc => l_body_clob);

EXCEPTION
    WHEN OTHERS THEN
        p_status_code := 500;
        IF DBMS_LOB.ISTEMPORARY(l_body_clob) = 1 THEN
             DBMS_LOB.FREETEMPORARY(lob_loc => l_body_clob);
        END IF;
        -- 可以在此记录外部异常
END handle_post_colors;
/



