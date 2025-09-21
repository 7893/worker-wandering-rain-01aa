# Worker Wandering Rain

Cloudflare Worker that serves a color-changing page and logs events to Oracle Database (ORDS AutoREST). Includes a scheduled cron to simulate a periodic visit.

## What’s new

- Security headers centralized; robots.txt added.
- Strict same-origin POST enforcement and OPTIONS preflight support.
- Conditional HSTS (custom domains over HTTPS).
- Updated `compatibility_date` to latest.
- Fixed bundling by inlining HTML template via `src/template.ts` (no custom loader needed).
- GitHub Actions deploy now also configures Cron Triggers via API (keeps Free-plan friendly pipeline while ensuring schedules work).
- Hardened CSP: inline script now protected by nonce (no `unsafe-inline` for scripts on `GET /`).

## Deploy (Free plan friendly)

1) Login and configure

```
npm i -g pnpm
pnpm i
npx wrangler login
```

2) Secrets

```
npx wrangler secret put DB_PASSWORD
```

3) Deploy

```
pnpm deploy
```

The Worker will be available at your `*.workers.dev` URL. To use a custom domain on the Free plan, add a Route in Workers and ensure your zone’s DNS is proxied through Cloudflare.

Notes:
- If you use the included GitHub Actions workflow, it uploads the bundle via the Cloudflare API and separately ensures the cron schedule is set. This avoids extra script-settings calls while still enabling the `scheduled` event.

## Cloudflare 免费套餐使用指南（2025-09 已核对官方文档）

- 访问方式
  - 默认通过 `*.workers.dev` 域名访问（免费）。
  - 绑定自定义域名（免费）：
    1) 在 Cloudflare 添加你的站点并将域名 NS 切换到 Cloudflare；
    2) 在 DNS 中为你的域名创建橙云代理的记录（Proxied = ON）；
    3) 在 Workers & Pages → 你的 Worker → Triggers/Routes 添加路由，或在 `wrangler.toml` 中配置：
       - `route = { pattern = "example.com/*", zone_name = "example.com" }`
       - 或 `routes = [{ pattern = "www.example.com/*", zone_name = "example.com" }]`
    4) 部署后通过自定义域名访问。可选：启用 HTTPS（默认 Universal SSL）。

- 免费套餐关键限制（Workers 相关）
  - 每分钟突发（Burst）：1,000 requests/min（超限会出现 1015）。
  - 每日请求：100,000 requests/day（UTC 0 点重置）。
  - Cron Triggers：每个账户最多 5 个。
  - 请求体大小（依账号套餐，与 Workers 套餐无关）：Free/Pro 100 MB，Business 200 MB，Enterprise 500 MB（默认）。
  - CPU 时间：Free 10ms（等待网络不计 CPU，密集计算计入）。
  - 参考：
    - https://developers.cloudflare.com/workers/platform/limits/
    - https://developers.cloudflare.com/workers/configuration/cron-triggers/

- 观测/日志
  - 本项目 `wrangler.toml` 中 `[observability] enabled = false`，避免在免费环境下产生不必要的观测/上报配置。
  - 开发/排查建议使用 `wrangler tail` 或 Dashboard 的实时日志查看。
  - 使用 GitHub Actions 部署时，工作流会通过 API 设置 cron 计划（`0 0 * * *`）。若你手动部署（`wrangler deploy`），也会根据 `wrangler.toml` 自动配置。

- 安全与防护（免费可用）
  - 已设置严格的安全响应头、同源 POST 限制与 OPTIONS 预检处理；HSTS 仅在自定义域且 HTTPS 时开启。
  - 若需进一步防护，建议：
    - 开启 Cloudflare Firewall Rules / Bot Fight Mode；
    - 使用 Turnstile（免费）在前端增加人机校验；
    - 注意：`request.cf.clientTrustScore` 等高级 Bot Management 字段在免费不可用，代码已做可选降级处理。

## 自定义域名配置示例（wrangler.toml 注释）

`wrangler.toml` 中已附带注释示例：

```
# workers_dev = true
# route = { pattern = "example.com/*", zone_name = "example.com" }
# routes = [
#   { pattern = "www.example.com/*", zone_name = "example.com" },
#   { pattern = "api.example.com/*",  zone_name = "example.com" }
# ]
```

实际使用时请把 `example.com` 替换成你的域名，并确保该域名已经托管在 Cloudflare 且 DNS 记录为橙云代理状态。

## ORDS config

- Set these vars in `wrangler.toml` or dashboard Vars:
  - `ORDS_BASE_URL`, `ORDS_SCHEMA_PATH`, `ORDS_API_PATH`, `DB_USER`
- Create table and enable AutoREST using the scripts under `database/`.

## Endpoints

- `GET /` page
- `POST /` JSON body `{ color: "#RRGGBB", trace_id: string, source: 'a'|'c'|'i' }`
  - Note: `'s'` is reserved for cron-simulated events inserted server-side.
- `GET /health` health probe
- `GET /robots.txt` disallow crawl

## Notes on Free plan limits (checked 2025-09)

- Workers Free requests: 100,000 requests/day and 1,000 requests/min.
- Cron Triggers: up to 5 per account.
- Request body size limits by Cloudflare plan: Free 100 MB, Pro 100 MB, Business 200 MB, Enterprise 500 MB (default).

Sources:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/

If you need stronger bot/abuse protection on Free, consider Cloudflare Firewall Rules and/or Turnstile. Bot Management scores (`request.cf.botManagement`) require paid plans.

Security notes:
- CSP uses a per-response nonce for the inline script on the HTML page. See `src/index.ts` and `src/template.ts`.
