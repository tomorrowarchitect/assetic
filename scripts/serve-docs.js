#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const ROOT = path.resolve(__dirname, '..', 'docs');

const mime = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function safeJoin(base, p) {
  const resolved = path.resolve(base, '.' + p);
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
    // Map root URL to /index.html inside docs
    let filePath = urlPath === '/' ? '/index.html' : urlPath;

    // If user requests '/docs' or '/docs/' or '/docs/index.html', serve from that subpath
    if (filePath === '/docs' || filePath === '/docs/') filePath = '/docs/index.html';

    // If the path begins with /docs, strip it so files under docs/ are served
    if (filePath.startsWith('/docs/')) filePath = filePath.replace(/^\/docs/, '');

    const absolute = safeJoin(ROOT, filePath);
    if (!absolute) {
      res.writeHead(400); res.end('Invalid path');
      return;
    }

    let stat;
    try { stat = fs.statSync(absolute); } catch (err) { stat = null; }

    if (!stat) {
      // If requesting a directory, try index.html inside it
      const alt = safeJoin(ROOT, path.join(filePath, 'index.html'));
      if (alt && fs.existsSync(alt)) {
        const data = fs.readFileSync(alt);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
        return;
      }
      res.writeHead(404); res.end('Not found');
      return;
    }

    if (stat.isDirectory()) {
      const index = path.join(absolute, 'index.html');
      if (fs.existsSync(index)) {
        const data = fs.readFileSync(index);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
        return;
      }
      res.writeHead(403); res.end('Forbidden');
      return;
    }

    const ext = path.extname(absolute).toLowerCase();
    const ct = mime[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(absolute);
    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache' });
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving ./docs at http://localhost:${PORT}/docs/ and http://localhost:${PORT}/`);
});

// graceful shutdown
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
