# worker-wandering-rain-01aa

An ambient full-screen color display and clock designed for relaxation and visual comfort.

It smoothly cycles through generative color transitions either automatically or on demand, accompanied by gentle audio tones and a retro flip clock showing the current color hex code, UTC, and HKT time.

## Controls

- Click anywhere, tap the screen, or press the Spacebar to switch colors instantly.

## License

MIT

## Local development

Use Node.js 26.10.0 and pnpm 12.6.0, as declared in `package.json`:

```sh
git clone https://github.com/7893/worker-wandering-rain-01aa.git
cd worker-wandering-rain-01aa
pnpm install --frozen-lockfile
pnpm dev
# Open the local URL printed by Wrangler.
```

The Worker serves the color/clock page and its assets. All interaction stays in
the browser; no database, event collection, or statistics endpoint is used.
Fonts are fetched from Google Fonts.

## Checks and deployment

```sh
pnpm typecheck
pnpm exec wrangler deploy --dry-run
```

Public CI runs these checks without cloud secrets. To deploy, choose your own
Worker `name` in `wrangler.toml`, authenticate to your own Cloudflare account and
run `pnpm deploy`. The original GitHub deployment workflow runs on pushes to `main`; it requires
your `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Last updated: September 26, 2026.
