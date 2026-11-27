// node tools/shoot3d.js <out.png> <WxH> "<hash, e.g. demo&s=region&t=add>" [wait ms] [js to evaluate, its value is printed]
// (run through: sh tools/edge-slot.sh node tools/shoot3d.js ...)
// Opens index.html from file:// in headless Edge WITH software WebGL (swiftshader), so the 3D map is really drawn, and saves a screenshot.
// SERIES=0,400,800: also pictures at those ms after the wait (a motion as several frames).  GL=0: no WebGL at all (--disable-gpu), the way the layout tests run.  GL=hw: the real graphics chip (ANGLE on Direct3D 11) instead of swiftshader.  DPR=2: device pixel ratio.  RM=1: prefers-reduced-motion.  PAGE=tests/x.html
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, execSync } = require('child_process');
const [out, size, hash, wait, js] = process.argv.slice(2), [W, H] = size.split('x').map(Number), ROOT = path.resolve(__dirname, '..');
const GL = process.env.GL === '0' ? ['--disable-gpu'] : process.env.GL === 'hw' ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(url) { return new Promise((res, rej) => { const ws = new WebSocket(url), waitFor = {}; let id = 0;
  ws.onopen = () => res({ send: (method, params) => new Promise((ok, no) => { waitFor[++id] = [ok, no]; ws.send(JSON.stringify({ id, method, params: params || {} })); }) });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waitFor[m.id]) { m.error ? waitFor[m.id][1](new Error(m.error.message)) : waitFor[m.id][0](m.result); delete waitFor[m.id]; } }; ws.onerror = rej; }); }
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-m3-'));
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--mute-audio', '--no-first-run', '--allow-file-access-from-files', ...GL, '--remote-debugging-port=0', '--user-data-dir=' + dir, '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore' });
  const quit = c => { try { execSync('taskkill /F /T /PID ' + edge.pid, { stdio: 'ignore' }); } catch (e) {} setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} process.exit(c); }, 400); };
  setTimeout(() => { console.log('TIMEOUT'); quit(2); }, +(process.env.LIMIT || 150000));
  try {
    let port = 0; for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) {} }
    const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(), pg = await cdp(list.find(t => t.type === 'page').webSocketDebuggerUrl);
    await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: +(process.env.DPR || 1), mobile: false });
    if (process.env.RM) await pg.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await pg.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__err=[];window.addEventListener("error",function(e){__err.push(String(e.message)+" @"+e.lineno)});' });
    await pg.send('Page.navigate', { url: (process.env.BASE || 'file:///' + ROOT.split(path.sep).join('/').replace(/ /g, '%20') + '/') + (process.env.PAGE || 'index.html') + (hash ? '#' + hash : '') });
    const ev = async x => { const r = await pg.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.exceptionDetails ? 'EXC ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) : r.result.value; };
    await sleep(+(wait || 2500));
    if (process.env.SERIES && out && out !== '-') { let was = 0; for (const ms of process.env.SERIES.split(',').map(Number)) { await sleep(Math.max(0, ms - was)); was = ms; fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out.replace(/\.png$/, '_' + ms + '.png'), Buffer.from((await pg.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); } }   // SERIES=0,400,800: more pictures, that many ms after the wait (out_0.png, out_400.png ...)
    if (js) console.log('js', JSON.stringify(await ev(js[0] === '@' ? fs.readFileSync(js.slice(1), 'utf8') : js)));   // @file: the script is read from a file
    if (process.env.AFTER) await sleep(+process.env.AFTER);
    if (out && out !== '-') { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, Buffer.from((await pg.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); console.log('saved', out); }
    console.log('title', await ev('document.title'), '| errors', await ev('JSON.stringify(window.__err||[])'), '| m3', await ev('window.TrollMap3D&&TrollMap3D.current()?JSON.stringify(TrollMap3D.current().stats()):"-"'));
    quit(0);
  } catch (e) { console.log('ERR ' + (e.stack || e)); quit(1); }
})();
