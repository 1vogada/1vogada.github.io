'use strict';
// A tiny static server for the tests: serves a directory (the repo root by default) on a free port of 127.0.0.1.
// /projects.json and /site.json come from tests/helpers/fixtures, so the bot that rewrites projects.json every 6 hours
// (and edits through the site editor) can never change what a test sees. /__blank is an empty page on the same origin,
// used to preset localStorage / sessionStorage before the real page loads.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.map': 'application/json',
};
const FIXTURES = path.join(__dirname, 'fixtures');
const REPO = path.resolve(__dirname, '..', '..');

function start({ root = REPO, fixtures = true } = {}) {
  root = path.resolve(root);
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); res.end(); return; }
    if (p === '/__blank') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end('<!doctype html><title>blank</title>'); return; }
    let file;
    if (fixtures && (p === '/projects.json' || p === '/site.json')) file = path.join(FIXTURES, p.slice(1));
    else {
      file = path.join(root, p);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch (e) { /* 404 below */ }
    }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    resolve({ url: `http://127.0.0.1:${port}`, port, close: () => new Promise((r) => server.close(() => r())) });
  }));
}

module.exports = { start, REPO };

if (require.main === module) {   // node tests/helpers/server.js [root]: serve by hand for poking around
  start({ root: process.argv[2] || REPO }).then((s) => console.log('serving on ' + s.url));
}
