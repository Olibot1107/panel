#!/usr/bin/env node

// Dev entrypoint: `node server.js`
// - builds frontend assets once (yarn build) so the panel loads
// - starts Laravel's dev server (php artisan serve)
// - starts a tiny reverse proxy in front that prints richer HTTP request logs
// - optional: `--watch` to run `yarn watch` in parallel
//
// Not intended for production.

const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { PassThrough } = require('node:stream');

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
    // eslint-disable-next-line no-console
    console.log(`Usage:
  node server.js [--watch] [--no-build] [--no-proxy] [--log-body] [--tail] [--full] [--compact]
                [--install] [--no-install] [--setup]

Env:
  PANEL_HOST=127.0.0.1
  PANEL_PORT=8000
  PANEL_UPSTREAM_HOST=127.0.0.1
  PANEL_UPSTREAM_PORT=18000
  PANEL_PROXY=1
  PANEL_LOG_BODY=0
  PANEL_TAIL=0
  PANEL_LOG_FORMAT=compact
  PANEL_INSTALL=1
`);
    process.exit(0);
}

const host = process.env.PANEL_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PANEL_PORT || '8000', 10);
const upstreamHost = process.env.PANEL_UPSTREAM_HOST || '127.0.0.1';
const upstreamPort = Number.parseInt(process.env.PANEL_UPSTREAM_PORT || '18000', 10);
const watch = argv.includes('--watch') || process.env.PANEL_WATCH === '1';
const doBuild = !argv.includes('--no-build') && process.env.PANEL_BUILD !== '0';
const doProxy = !argv.includes('--no-proxy') && process.env.PANEL_PROXY !== '0';
const logBody = argv.includes('--log-body') || process.env.PANEL_LOG_BODY === '1';
const tailLaravelLog = argv.includes('--tail') || process.env.PANEL_TAIL === '1';
const doInstall =
    argv.includes('--setup') ||
    argv.includes('--install') ||
    (!argv.includes('--no-install') && process.env.PANEL_INSTALL !== '0');
const logFormat = argv.includes('--full')
    ? 'full'
    : argv.includes('--compact')
      ? 'compact'
      : (process.env.PANEL_LOG_FORMAT || 'compact');

const root = __dirname;
const manifestPath = path.join(root, 'public', 'assets', 'manifest.json');
const laravelLogPath = path.join(root, 'storage', 'logs', 'laravel.log');
const nodeModulesPath = path.join(root, 'node_modules');
const vendorPath = path.join(root, 'vendor');

function exists(p) {
    try {
        fs.accessSync(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function spawnInherit(cmd, args, opts = {}) {
    return spawn(cmd, args, { stdio: 'inherit', ...opts });
}

function spawnAndWait(cmd, args, opts = {}) {
    return new Promise((resolve) => {
        const child = spawnInherit(cmd, args, opts);
        child.on('exit', (code) => resolve(code ?? 0));
    });
}

function spawnQuietAndWait(cmd, args, opts = {}) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, { stdio: 'ignore', ...opts });
        child.on('exit', (code) => resolve(code ?? 0));
        child.on('error', () => resolve(127));
    });
}

async function commandWorks(cmd, args = ['--version']) {
    const code = await spawnQuietAndWait(cmd, args, { cwd: root });
    return code === 0;
}

function nowIso() {
    return new Date().toISOString();
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function nowLocalStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
        d.getHours()
    )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function compactLogLine({ ts, url, ms }) {
    const left = `${ts} ${url}`;
    const targetWidth = 86;
    const dots = left.length >= targetWidth ? ' ' : ' ' + '.'.repeat(targetWidth - left.length);
    return `${left}${dots} ~ ${ms.toFixed(2)}ms`;
}

async function ensureYarn() {
    if (await commandWorks('yarn')) return true;

    // Node >=16 ships Corepack. Pin to Yarn classic (v1) because this repo has a v1 `yarn.lock`.
    const hasCorepack = await commandWorks('corepack', ['--version']);
    if (!hasCorepack) return false;

    let code = await spawnAndWait('corepack', ['enable'], { cwd: root });
    if (code !== 0) return false;

    // Yarn v1 last release is 1.22.22; using stable could activate Yarn 3/4 and break installs.
    code = await spawnAndWait('corepack', ['prepare', 'yarn@1.22.22', '--activate'], { cwd: root });
    if (code !== 0) return false;

    return await commandWorks('yarn');
}

async function ensureNodeModules() {
    if (exists(nodeModulesPath)) return 0;
    const ok = await ensureYarn();
    if (!ok) return 127;

    // Prefer deterministic installs; fall back if the project isn't compatible.
    let code = await spawnAndWait('yarn', ['install', '--frozen-lockfile'], { cwd: root });
    if (code !== 0) code = await spawnAndWait('yarn', ['install'], { cwd: root });
    return code;
}

async function ensureComposerDeps() {
    if (exists(vendorPath)) return 0;
    const hasComposer = await commandWorks('composer');
    if (!hasComposer) return 127;
    return await spawnAndWait('composer', ['install', '--no-interaction'], { cwd: root });
}

function safeParseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function redactSecrets(value) {
    const REDACT = '[REDACTED]';
    const secretKey = /pass(word)?|token|secret|api[_-]?key|authorization|cookie/i;

    const walk = (v) => {
        if (Array.isArray(v)) return v.map(walk);
        if (!v || typeof v !== 'object') return v;
        const out = {};
        for (const [k, child] of Object.entries(v)) {
            out[k] = secretKey.test(k) ? REDACT : walk(child);
        }
        return out;
    };

    return walk(value);
}

function formatBytes(n) {
    if (!Number.isFinite(n) || n <= 0) return '0B';
    if (n < 1024) return `${n}B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
    return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

function startLaravelLogTail() {
    if (!exists(laravelLogPath)) return null;

    let lastSize = 0;
    try {
        lastSize = fs.statSync(laravelLogPath).size;
    } catch {
        lastSize = 0;
    }

    const onChange = () => {
        fs.stat(laravelLogPath, (err, st) => {
            if (err || !st) return;
            if (st.size < lastSize) lastSize = 0; // rotated/truncated
            if (st.size === lastSize) return;

            const stream = fs.createReadStream(laravelLogPath, { start: lastSize, end: st.size });
            lastSize = st.size;
            stream.on('data', (buf) => {
                const text = buf.toString('utf8');
                for (const line of text.split('\n')) {
                    if (!line.trim()) continue;
                    // eslint-disable-next-line no-console
                    console.log(`[laravel] ${line}`);
                }
            });
        });
    };

    const watcher = fs.watch(laravelLogPath, { persistent: false }, () => onChange());
    onChange();
    return watcher;
}

function startProxyServer({ listenHost, listenPort, upstreamHost, upstreamPort, logBody, logFormat }) {
    const server = http.createServer((req, res) => {
        const start = process.hrtime.bigint();
        const id = Math.random().toString(16).slice(2, 10);

        const method = req.method || 'GET';
        const url = req.url || '/';
        const ip =
            req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
            req.socket.remoteAddress ||
            '-';
        const ua = req.headers['user-agent']?.toString() || '-';
        const referer = req.headers.referer?.toString() || req.headers.referrer?.toString() || '-';

        // Tee the request body so we can optionally log a small JSON snippet without breaking streaming.
        const reqTee = new PassThrough();
        let reqBytes = 0;
        let bodyPreview = '';
        const maxPreview = 16 * 1024; // 16KB

        req.on('data', (chunk) => {
            reqBytes += chunk.length;
            if (logBody && bodyPreview.length < maxPreview) {
                bodyPreview += chunk.toString('utf8').slice(0, maxPreview - bodyPreview.length);
            }
        });
        req.on('error', () => {
            // ignore; upstream will likely fail too
        });
        req.pipe(reqTee);

        const upstreamReq = http.request(
            {
                host: upstreamHost,
                port: upstreamPort,
                method,
                path: url,
                headers: {
                    ...req.headers,
                    host: `${upstreamHost}:${upstreamPort}`,
                    'x-forwarded-host': req.headers.host,
                    'x-forwarded-proto': 'http',
                    'x-forwarded-for': req.headers['x-forwarded-for']
                        ? req.headers['x-forwarded-for']
                        : ip,
                },
            },
            (upstreamRes) => {
                res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);

                let resBytes = 0;
                upstreamRes.on('data', (chunk) => {
                    resBytes += chunk.length;
                });
                upstreamRes.on('end', () => {
                    const end = process.hrtime.bigint();
                    const ms = Number(end - start) / 1e6;
                    const status = upstreamRes.statusCode || 0;

                    if (logFormat !== 'full') {
                        // eslint-disable-next-line no-console
                        console.log(compactLogLine({ ts: nowLocalStamp(), url, ms }));
                        return;
                    }

                    let extra = '';
                    if (logBody && bodyPreview && /^(POST|PUT|PATCH)$/i.test(method)) {
                        const contentType = req.headers['content-type']?.toString() || '';
                        if (contentType.includes('application/json')) {
                            const parsed = safeParseJson(bodyPreview);
                            if (parsed) extra = ` body=${JSON.stringify(redactSecrets(parsed))}`;
                        } else {
                            extra = ` body="${bodyPreview.replace(/\s+/g, ' ').slice(0, 200)}"`;
                        }
                    }

                    // eslint-disable-next-line no-console
                    console.log(
                        `[${nowIso()}] ${id} ${method} ${status} ${url} ${ms.toFixed(
                            1
                        )}ms req=${formatBytes(reqBytes)} res=${formatBytes(resBytes)} ip=${ip} ref="${referer}" ua="${ua}"${extra}`
                    );
                });

                upstreamRes.pipe(res);
            }
        );

        upstreamReq.on('error', (err) => {
            const end = process.hrtime.bigint();
            const ms = Number(end - start) / 1e6;

            if (logFormat !== 'full') {
                // eslint-disable-next-line no-console
                console.log(compactLogLine({ ts: nowLocalStamp(), url, ms }));
            } else {
            // eslint-disable-next-line no-console
            console.log(
                `[${nowIso()}] ${id} ${method} 502 ${url} ${ms.toFixed(
                    1
                )}ms req=${formatBytes(reqBytes)} res=0B ip=${ip} upstream_error="${String(
                    err?.message || err
                )}"`
            );
            }
            res.statusCode = 502;
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end('Upstream dev server is not available.\n');
        });

        reqTee.pipe(upstreamReq);
    });

    // WebSocket/upgrade support (best-effort) for things like socket.io in dev.
    server.on('upgrade', (req, socket, head) => {
        const upstream = net.connect(upstreamPort, upstreamHost, () => {
            upstream.write(
                `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
                    Object.entries(req.headers)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\r\n') +
                    `\r\n\r\n`
            );
            if (head && head.length) upstream.write(head);
            socket.pipe(upstream).pipe(socket);
        });

        upstream.on('error', () => {
            try {
                socket.destroy();
            } catch {
                // ignore
            }
        });
    });

    return new Promise((resolve) => {
        server.listen(listenPort, listenHost, () => resolve(server));
    });
}

async function main() {
    if (doInstall) {
        const ok = await ensureYarn();
        if (!ok) {
            // eslint-disable-next-line no-console
            console.warn('Missing `yarn`. Install Node >= 16 (Corepack) or install Yarn, then re-run.');
        }

        const nm = await ensureNodeModules();
        if (nm !== 0 && nm !== 127) process.exit(nm);
        if (nm === 127) {
            // eslint-disable-next-line no-console
            console.warn('Skipping `yarn install` (yarn not available).');
        }

        const comp = await ensureComposerDeps();
        if (comp !== 0 && comp !== 127) process.exit(comp);
        if (comp === 127) {
            // eslint-disable-next-line no-console
            console.warn('Skipping `composer install` (composer not available).');
        }

        if (argv.includes('--setup')) process.exit(0);
    }

    if (doBuild) {
        // Always build once, so the bundle/manifest exists and matches your code.
        // This avoids "why didn't my changes show up?" confusion.
        const code = await spawnAndWait('yarn', ['run', 'build'], { cwd: root });
        if (code !== 0) process.exit(code);
    } else if (!exists(manifestPath)) {
        // eslint-disable-next-line no-console
        console.warn('Missing public/assets/manifest.json; run: yarn run build');
    }

    const children = [];
    if (watch) {
        children.push(spawnInherit('yarn', ['run', 'watch'], { cwd: root }));
    }

    let proxyServer = null;
    let logWatcher = null;

    // Start Laravel on an internal port, and use the Node proxy (if enabled) for the public port.
    const laravelHost = doProxy ? upstreamHost : host;
    const laravelPort = doProxy ? String(upstreamPort) : String(port);
    children.push(
        spawnInherit('php', ['artisan', 'serve', '--host', laravelHost, '--port', laravelPort], { cwd: root })
    );

    if (tailLaravelLog) {
        logWatcher = startLaravelLogTail();
    }

    if (doProxy) {
        proxyServer = await startProxyServer({
            listenHost: host,
            listenPort: port,
            upstreamHost,
            upstreamPort,
            logBody,
            logFormat,
        });

        // eslint-disable-next-line no-console
        console.log(`[${nowLocalStamp()}] proxy http://${host}:${port} -> http://${upstreamHost}:${upstreamPort}`);
    }

    const shutdown = (signal) => {
        if (logWatcher) {
            try {
                logWatcher.close();
            } catch {
                // ignore
            }
        }

        if (proxyServer) {
            try {
                proxyServer.close();
            } catch {
                // ignore
            }
        }

        for (const c of children) {
            try {
                c.kill(signal);
            } catch {
                // ignore
            }
        }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
