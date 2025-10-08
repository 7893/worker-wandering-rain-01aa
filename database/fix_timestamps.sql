-- 修复错误的时间戳
-- 问题：之前的代码使用香港时间 + 'Z' 后缀，导致时间被当作 UTC
-- 修复：将所有 2025-05 月份的记录时间加上正确的偏移量

-- 方案1: 如果确定所有 5 月的记录都应该是 10 月的（偏移约 133 天）
-- 这需要知道确切的偏移量

-- 方案2: 根据 ID 和实际创建时间推算
-- 由于我们不知道记录的真实创建时间，这个方案不可行

-- 方案3: 删除所有错误的历史数据（推荐）
-- 因为这些主要是 cron 模拟数据，没有实际价值

-- 查看需要修复的记录数量
SELECT COUNT(*) as error_count 
FROM color_events 
WHERE event_at < TIMESTAMP '2025-10-01 00:00:00';

-- 如果确认要删除这些错误数据，取消下面的注释：
-- DELETE FROM color_events 
-- WHERE event_at < TIMESTAMP '2025-10-01 00:00:00';

-- 或者，如果要保留但标记为错误数据：
-- UPDATE color_events 
-- SET extra = '{"note": "timestamp_error_before_fix"}'
-- WHERE event_at < TIMESTAMP '2025-10-01 00:00:00' 
--   AND (extra IS NULL OR extra NOT LIKE '%timestamp_error%');

COMMIT;
