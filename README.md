# Worker Wandering Rain (worker-wandering-rain-01aa)

Cloudflare Worker + Oracle DB 项目：展示随机背景色，并按月自动创建表记录颜色变化。

## 功能

* 访问 Worker URL 显示随机颜色。
* 颜色自动/点击刷新。
* 颜色数据通过 ORDS 存入 Oracle DB (表 `cw_YYYYMM_colors` 会自动按月创建)。

## 技术

* Cloudflare Workers (TypeScript)
* Oracle Autonomous DB + ORDS (PL/SQL)
* pnpm
* GitHub Actions (自动部署)

## 运行与部署

1.  **环境:** Node.js (v22+), pnpm (v10+)
2.  **安装依赖 (用于编辑器):** `pnpm install`
3.  **配置:**
    * `wrangler.toml` (Cloudflare account_id, ORDS vars)
    * Cloudflare Secrets (e.g., `DB_PASSWORD`)
    * GitHub Secrets (e.g., `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
4.  **部署:** 推送代码到 `main` 分支即可通过 GitHub Actions 自动部署。