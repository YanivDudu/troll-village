// Runs a test page that keeps live connections open (headless Edge never finishes --dump-dom on those).
// Usage: node tests/run-page.js tests/race.html [seconds]   The page POSTs its title and log to /__report when it is done.
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { spawn, execSync } = require('child_process');
const page = process.argv[2], limit = (+process.argv[3] || 300) * 1000, root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.json': 'application/json', '.svg': 'image/svg+xml' };
let edge = null, timer = null;
function done(text, code) {
  clearTimeout(timer); console.log(text);
  try { if (edge) execSync('taskkill /F /T /PID ' + edge.pid, { stdio: 'ignore' }); } catch (e) {}
  server.close(); setTimeout(() => process.exit(code), 300);
}
const server = http.createServer((req, res) => {
  if (req.url === '/__report') { let b = ''; req.on('data', d => b += d); req.on('end', () => { res.end('ok'); done(b, / OK/.test(b.split('\n')[0]) ? 0 : 1); }); return; }
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
});
server.listen(0, 'localhost', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-test-'));
  edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1000,900', '--remote-debugging-port=0', '--user-data-dir=' + dir, 'http://localhost:' + server.address().port + '/' + page], { stdio: 'ignore' });
  timer = setTimeout(() => done('TIMEOUT after ' + limit / 1000 + ' s', 2), limit);
});
