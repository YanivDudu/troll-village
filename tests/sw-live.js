// node tests/sw-live.js  ->  SW LIVE OK   (about 30 seconds; takes one headless Edge: use a browser slot)
// The service worker in a real browser. A small server on 127.0.0.1 serves the repo; tests/sw-live.html registers sw.js itself
// (index.html never registers it on this computer) and then asks the server to change a file, to be slow, and to go down.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const root = path.join(__dirname, '..');
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', mp3: 'audio/mpeg', woff2: 'font/woff2', webmanifest: 'application/manifest+json', json: 'application/json', txt: 'text/plain' };
let mode = 'up', edge, done = false;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-sw-'));
function finish(ok, text) {
  if (done) return; done = true;
  console.log(text); console.log(ok ? 'SW LIVE OK' : 'SW LIVE FAILED');
  try { edge.kill(); } catch (e) {}
  server.close(); if (server.closeAllConnections) server.closeAllConnections();
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} process.exit(ok ? 0 : 1); }, 1500);
}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__mode') { mode = u.searchParams.get('m'); res.writeHead(200, { 'Cache-Control': 'no-store' }); return res.end(mode); }
  if (u.pathname === '/__result') { let b = ''; req.on('data', d => b += d); req.on('end', () => { res.end('ok'); const j = JSON.parse(b); finish(j.ok, j.log.join('\n')); }); return; }
  if (mode === 'down') return req.socket.destroy();
  const send = () => {
    let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (file.indexOf(root) !== 0 || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('no'); }
    let body = fs.readFileSync(file);
    if (mode === 'v2' && /geo1\.js$/.test(p)) body = Buffer.concat([body, Buffer.from('\n// SECOND-DEPLOY')]);
    const h = { 'Content-Type': TYPES[path.extname(file).slice(1)] || 'application/octet-stream', 'Cache-Control': /\.(html|js)$/.test(p) ? 'no-cache' : 'max-age=3600', 'Accept-Ranges': 'bytes' };
    const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (m) { const a = +m[1], b = m[2] ? Math.min(+m[2], body.length - 1) : body.length - 1; h['Content-Range'] = 'bytes ' + a + '-' + b + '/' + body.length; res.writeHead(206, h); return res.end(body.subarray(a, b + 1)); }
    res.writeHead(200, h); res.end(body);
  };
  if (mode === 'slow') setTimeout(send, 7000); else send();
});
server.listen(0, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + server.address().port + '/tests/sw-live.html';
  edge = spawn(EDGE, ['--headless', '--disable-gpu', '--no-first-run', '--user-data-dir=' + profile, '--window-size=400,800', '--remote-debugging-port=0', url], { stdio: 'ignore' });
  setTimeout(() => finish(false, 'no answer from the page after 120 seconds'), 120000);
});
