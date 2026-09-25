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

The current router serves the color/clock page and its assets. It does not call
the Oracle adapter, so this UI needs no Oracle database, ORDS credentials, or
maintainer account. Fonts are fetched from Google Fonts; font loading needs an
Internet connection and is separate from a database dependency.

## Optional Oracle reference material

`lib/db-utils.ts` and `database/` contain an AutoREST helper and schema scripts.
They are reference material, not an active persistence feature in the current
page routes. Supplying environment variables alone does not wire them into the UI.

If you intentionally integrate this helper in your own extension, configure:

| Variable | Meaning |
| --- | --- |
| `ORDS_BASE_URL` | Your HTTPS ORDS base URL, ending at `/ords` |
| `ORDS_SCHEMA_PATH` | Your schema alias; the reference SQL uses `wwr` |
| `ORDS_API_PATH` | Your table alias; the reference SQL uses `colorevents` |
| `DB_USER` | Your ORDS Basic authentication username |
| `DB_PASSWORD` | Its password, supplied only as a secret |

The helper composes `<base>/<schema>/<table>/`. Copy `.dev.vars.example` to the
ignored `.dev.vars` only for that extension. For deployed Workers, set sensitive
values through `wrangler secret put`, not committed config.

On a new database you control, review `database/tables/color_events.sql` first,
then adapt `database/ords/enable_autorest_color_events.sql` to your schema and
aliases. The supplied schema name `WWR_APP` is a reference name. Applying these
scripts changes a database and is not part of `pnpm dev`. Review the helper's
event metadata fields before connecting it to public requests.

## Checks and deployment

```sh
pnpm typecheck
pnpm exec wrangler deploy --dry-run
```

Public CI runs these checks without cloud secrets. To deploy, choose your own
Worker `name` in `wrangler.toml`, authenticate to your own Cloudflare account and
run `pnpm deploy`. The original GitHub deployment workflow runs on pushes to `main`; it requires
your `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Ordinary pushes do not deploy.

Last updated: September 26, 2026.
