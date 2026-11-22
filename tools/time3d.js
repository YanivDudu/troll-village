// node tools/time3d.js [WxH] [extra hash]      (run through: sh tools/edge-slot.sh node tools/time3d.js 390x800)
// How long the 3D camp takes on THIS machine's real graphics chip (headless Edge, ANGLE on Direct3D 11; the renderer string is printed: it must not say SwiftShader).
// The game is served from a local web server (http, the files of this checkout), so the scripts are really fetched and the browser's caches work as on the web
// (there is no service worker on localhost). Three runs in ONE browser profile:
//   cold     a new profile: nothing fetched, nothing parsed, no compiled shaders
//   warm     the page loaded again in the same profile (the files, their compiled code and the shaders are in the browser's caches)
//   session  home -> a map -> home again in the same page (the built island and the actors are kept by the game)
// For each: the time from the home screen being built (its buttons work from then on) to the first 3D picture, split into its parts, the cover of the
// transition (how long it stayed), the longest task of the main thread, and the same for a map.  GL=soft: swiftshader (for comparison only).  SHOT=dir: frames of a transition are saved there.
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), { spawn, execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), size = process.argv[2] || '390x800', extra = process.argv[3] || '', [W, H] = size.split('x').map(Number);
const GL = process.env.GL === 'soft' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'];
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', woff2: 'font/woff2', mp3: 'audio/mpeg', json: 'application/json', webmanifest: 'application/manifest+json', css: 'text/css', txt: 'text/plain' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p); if (f.indexOf(ROOT) !== 0) { s.writeHead(403); s.end(); return; }
  fs.stat(f, (e, st) => { if (e || !st.isFile()) { s.writeHead(404); s.end(); return; }
    const tag = '"' + st.size + '-' + Math.round(st.mtimeMs) + '"';
    if (q.headers['if-none-match'] === tag) { s.writeHead(304, { ETag: tag, 'Cache-Control': 'max-age=3600' }); s.end(); return; }
    s.writeHead(200, { 'Content-Type': MIME[f.split('.').pop()] || 'application/octet-stream', 'Content-Length': st.size, ETag: tag, 'Cache-Control': 'max-age=3600' }); fs.createReadStream(f).pipe(s); });
});
function cdp(url) { return new Promise((res, rej) => { const ws = new WebSocket(url), waitFor = {}; let id = 0;
  ws.onopen = () => res({ send: (method, params) => new Promise((ok, no) => { waitFor[++id] = [ok, no]; ws.send(JSON.stringify({ id, method, params: params || {} })); }) });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waitFor[m.id]) { m.error ? waitFor[m.id][1](new Error(m.error.message)) : waitFor[m.id][0](m.result); delete waitFor[m.id]; } }; ws.onerror = rej; }); }
const READ = `(function(){var t=window.__tv||{},m=t.m3t||{},c=document.createElement('canvas'),g=c.getContext('webgl'),e=g&&g.getExtension('WEBGL_debug_renderer_info');
  var res=performance.getEntriesByType('resource').filter(function(r){return /map3d\\//.test(r.name)}).map(function(r){return [r.name.split('/').pop(),Math.round(r.startTime),Math.round(r.responseEnd-r.startTime),r.transferSize,r.decodedBodySize]});
  var i=window.TrollMap3D&&TrollMap3D.current&&TrollMap3D.current();
  return {renderer:g&&e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'none',m3t:m,res:res,veil:t.veil||[],long:window.__long||[],stats:i?i.stats():null,cls:(document.querySelector('.campv')||document.querySelector('.tmap.m3on')||{}).className||''};})()`;
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-t3-'));
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--mute-audio', '--no-first-run', ...GL, '--remote-debugging-port=0', '--user-data-dir=' + dir, '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore' });
  const quit = c => { try { execSync('taskkill /F /T /PID ' + edge.pid, { stdio: 'ignore' }); } catch (e) {} srv.close(); setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} process.exit(c); }, 500); };
  setTimeout(() => { console.log('TIMEOUT'); quit(2); }, 240000);
  try {
    let port = 0; for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) {} }
    const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(), pg = await cdp(list.find(t => t.type === 'page').webSocketDebuggerUrl);
    await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: +(process.env.DPR || 1), mobile: false });
    await pg.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__long=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){__long.push([Math.round(e.startTime),Math.round(e.duration)])})}).observe({entryTypes:["longtask"]})}catch(e){}' });
    const ev = async x => { const r = await pg.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.exceptionDetails ? 'EXC ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) : r.result.value; };
    const until = async (x, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(x)) return Date.now() - t; await sleep(40); } return -1; };
    const shot = async name => { if (process.env.SHOT) { fs.mkdirSync(process.env.SHOT, { recursive: true }); fs.writeFileSync(path.join(process.env.SHOT, name + '.png'), Buffer.from((await pg.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); } };
    const hash = '#demo&s=home&hour=10&wear=puppy.lion&veil=1&warm=1' + (extra ? '&' + extra : '');
    const out = {};
    for (const run of ['cold', 'warm']) {
      await pg.send('Page.navigate', { url: 'about:blank' }); await sleep(300);
      await pg.send('Page.navigate', { url: base + 'index.html' + hash });
      if (process.env.SHOT) { for (let k = 0; k < 14; k++) { await sleep(run === 'cold' ? 150 : 60); await shot(run + '_' + String(k).padStart(2, '0')); } }
      const w = await until('!!(window.__tv&&__tv.m3t&&__tv.m3t.camp)||!!document.querySelector(".campv:not(.c3w):not(.c3on)")&&performance.now()>6000', 20000);
      await sleep(900); out[run] = await ev(READ); out[run].waited = w;
    }
    // session: a map and back (the cover of the transition, the map, the camp from the cache)
    await ev('window.__long.length=0;document.querySelector(".cstrip").click()');
    if (process.env.SHOT) { for (let k = 0; k < 12; k++) { await sleep(60); await shot('map_' + String(k).padStart(2, '0')); } }
    await until('!!document.querySelector(".tmap.m3on:not(.m3w)")', 15000); await sleep(1500);
    out.map = await ev(READ);
    await ev('window.__long.length=0;__tv.m3t.campLast=0;[].slice.call(document.querySelectorAll(".top .icon")).filter(function(b){return /חֲזָרָה לַכְּפָר/.test(b.getAttribute("aria-label"))})[0].click()');
    if (process.env.SHOT) { for (let k = 0; k < 12; k++) { await sleep(60); await shot('home_' + String(k).padStart(2, '0')); } }
    await until('!!(__tv.m3t.campLast)', 15000); await sleep(1200);
    out.session = await ev(READ);
    console.log(JSON.stringify(out));
    quit(0);
  } catch (e) { console.log('ERR ' + (e.stack || e)); quit(1); }
})();
