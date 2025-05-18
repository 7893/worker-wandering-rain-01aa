# Worker Wandering Rain

一个 Cloudflare Worker 项目，展示随机变色网页并将颜色事件记录到 Oracle 数据库，同时通过计划任务保持数据库活跃。

## 核心功能

* **动态颜色页面**: 访问 Worker URL 显示随机颜色和 UTC+0/UTC+8 时间。
* **颜色数据记录**:
    * `source: 'i'`: 页面加载时的初始颜色。
    * `source: 'c'`: 用户点击触发的颜色。
    * `source: 'a'`: 前端定时自动更新的颜色。
* **数据库保活 (`source: 's'`)**:
    * 通过 Cron 触发器，Worker 定期模拟用户访问（随机颜色，预设元数据）写入 Oracle 数据库的 `COLOR_EVENTS` 分区表，使用 ORDS AutoREST。

## 技术栈

* Cloudflare Workers (TypeScript)
* Oracle Database (分区表, ORDS AutoREST)
* HTML/CSS/JavaScript
* pnpm

## 快速开始

1.  **数据库设置**:
    * 执行 `database/tables/color_events.sql` 创建表。
    * 修改并执行 `database/ords/enable_autorest_color_events.sql` 启用 AutoREST (确保 Schema 和别名正确)。

2.  **Worker 配置 (`wrangler.toml`)**:
    * 填入正确的 `ORDS_BASE_URL`, `ORDS_SCHEMA_PATH` (e.g., "admin"), `ORDS_API_PATH` (e.g., "colorevents"), `DB_USER`。
    * 设置 `[triggers].crons` (测试用 `"* * * * *"`, 生产调低频率)。

3.  **设置 Secret**:
    * 通过 `npx wrangler secret put DB_PASSWORD` (或 Cloudflare Dashboard) 设置数据库密码。

4.  **安装与部署**:
    ```bash
    pnpm install
    npx wrangler deploy # 或通过 Git push 触发 GitHub Actions
    ```

## 使用

访问部署后的 Worker URL。数据将记录到 Oracle 的 `COLOR_EVENTS` 表。