# Worker Wandering Rain 01aa

一个基于 Cloudflare Worker + Oracle Autonomous Database 的高质量项目，  
实时生成随机背景色，记录到数据库，同时保持极致轻量、极致模块化的现代工程范式。

---

## 项目概览

- **自动建表**（按月动态创建 Oracle 表）
- **自动注册 REST API**（通过 ORDS 自动开放接口）
- **高精度时间戳**（Oracle SYSTIMESTAMP）
- **支持每秒30条并发写入**（防止暴力插入）
- **事件追踪（trace_id）**（便于日志关联）
- **简洁优雅的网页展示**（全响应式，无卡顿）
- **极低维护成本**（纯Serverless，0人工干预）
- **日志推送已开启**（方便后期接入 Axiom、Sentry 等）

---

## 目录结构

```plaintext
.
├── lib
│   ├── color-utils.ts    # 随机颜色生成工具
│   ├── db-utils.ts       # 动态建表、插入数据
│   ├── rate-limit.ts     # 每秒30条限流控制
│   ├── time-utils.ts     # 获取当前月份表名
│   └── trace-utils.ts    # 生成全局唯一trace_id
├── src
│   └── index.ts          # Worker 主入口逻辑
├── package.json
└── wrangler.toml         # Worker 配置文件

