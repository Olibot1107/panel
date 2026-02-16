# Panel Local Runner

`server.js` is the official and fully supported way to run this repo locally.

## Quick start

```bash
yarn run setup
```

```bash
yarn start
```

Then open `http://localhost:800`.

## Commands

- `yarn start`: run `server.js` (build assets, run Laravel, run proxy)
- `yarn dev`: same as start + frontend watch mode
- `yarn run setup`: install Node + Composer dependencies and exit

## Why use `server.js`

- Bootstraps dependencies (`yarn install` and `composer install`) when needed.
- Builds frontend assets before start so `public/assets/manifest.json` exists.
- Runs `php artisan serve` on an internal upstream port.
- Exposes a proxy on the public port with request logging.
- Forwards `X-Forwarded-*` headers (including proto) so Laravel can correctly detect secure requests.

## Configuration

Use environment variables when needed:

- `PANEL_HOST` (default `0.0.0.0`)
- `PANEL_PORT` (default `800`)
- `PANEL_UPSTREAM_HOST` (default `127.0.0.1`)
- `PANEL_UPSTREAM_PORT` (default `80`)
- `PANEL_PROXY` (`1` or `0`, default `1`)
- `PANEL_HTTPS` (`1` or `0`, default `0`)
- `PANEL_FORWARDED_PROTO` (`http` or `https`, overrides `PANEL_HTTPS`)
- `PANEL_INSTALL` (`1` or `0`, default `1`)
- `PANEL_BUILD` (`1` or `0`, default `1`)
- `PANEL_WATCH` (`1` or `0`, default `0`)
- `PANEL_LOG_FORMAT` (`compact` or `full`, default `compact`)
- `PANEL_LOG_BODY` (`1` or `0`, default `0`)
- `PANEL_TAIL` (`1` or `0`, default `0`)

## Common flags

```bash
node server.js --help
```

- `--setup`
- `--watch`
- `--no-build`
- `--proxy` / `--no-proxy`
- `--full` / `--compact`
- `--log-body`
- `--tail`
- `--install` / `--no-install`

## Production

`server.js` is for local/dev execution. Use your production process manager and web server for deployment.
