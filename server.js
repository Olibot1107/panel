#!/usr/bin/env node

// Minimal dev entrypoint: `node server.js`
// Uses Laravel's built-in dev server (not for production).

const { spawn } = require('node:child_process');

const host = process.env.PANEL_HOST || '127.0.0.1';
const port = process.env.PANEL_PORT || '8000';

spawn('php', ['artisan', 'serve', '--host', host, '--port', port], {
    stdio: 'inherit',
}).on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
});

