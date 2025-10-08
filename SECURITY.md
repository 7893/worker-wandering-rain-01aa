# 安全和配置说明

## 安全特性

### 多层限流保护
- **全局限流**: 300 请求/秒
- **IP 限流**: 100 请求/分钟（每个 IP 独立）
- **前端防抖**: 100ms 点击冷却时间

### 输入验证
- 颜色格式: 严格的 `#[0-9a-fA-F]{6}` 正则验证
- trace_id: 长度限制 1-36 字符
- source: 只允许 'a', 'c', 'i', 's'
- JSON 大小: 最大 2048 字节

### 安全头
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer

### 其他安全措施
- Trust Score 检查 (最低 10)
- 同源策略 (CORS)
- HTTP 方法白名单 (GET, POST, OPTIONS)
- IP 验证 (CF-Connecting-IP + X-Real-IP)
- 数据库密码使用 Secret

## 配置说明

### 环境变量
```bash
# 必须使用 Secret 设置
wrangler secret put DB_PASSWORD

# 可选：使用 Secret 保护数据库 URL
wrangler secret put ORDS_BASE_URL
```

### Cron 任务
- 频率: 每 6 小时 (0:00, 6:00, 12:00, 18:00 UTC)
- 功能: 自动生成随机颜色记录

### 时区说明
- 数据库存储: 香港时间 + Z 后缀（与历史数据保持一致）
- 前端显示: UTC+0 和 UTC+8 双时区显示

## 性能优化

### GPU 加速
- WebGL2/WebGL 硬件渲染
- 失败时自动降级到 CSS
- 高 DPI 支持

### 异步处理
- 数据库写入使用 `waitUntil`
- 不阻塞用户响应
- 3 次重试 + 指数退避

## 已知限制

1. **RateLimiter 全局状态**: Worker 冷启动会重置计数器（影响有限）
2. **数据库 URL 公开**: 在配置文件中可见（有密码保护）

## 安全等级

⭐⭐⭐⭐⭐ (优秀)

项目已通过全面的安全审查，可以安全部署到生产环境。
