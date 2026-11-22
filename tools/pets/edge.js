// edge.js: one headless Edge with software WebGL, for the tools of this folder. Takes a browser slot (shots/edge.lock.N of the main checkout) and frees it; kills only the Edge it started.
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, execSync } = require('child_process');
const ROOT = __dirname, LOCKS = 'C:/Users/Yaniv Dudu/troll-math/shots';   // the browser slots are shared by every worktree (docs/prompts/redesign-agent-rules.md)
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function slot() { for (;;) { for (const n of [1, 2]) { const f = path.join(LOCKS, 'edge.lock.' + n); try { fs.writeFileSync(f, 'pets ' + process.pid, { flag: 'wx' }); return f; } catch (e) {} }
    for (const n of [1, 2]) { const f = path.join(LOCKS, 'edge.lock.' + n); try { if (Date.now() - fs.statSync(f).mtimeMs > 10 * 60 * 1000) fs.unlinkSync(f); } catch (e) {} }      // a lock older than ten minutes is a leftover
    await sleep(15000); } }
function cdp(url) { return new Promise((res, rej) => { const ws = new WebSocket(url), waitFor = {}; let id = 0;
  ws.onopen = () => res({ send: (method, params) => new Promise((ok, no) => { waitFor[++id] = [ok, no]; ws.send(JSON.stringify({ id, method, params: params || {} })); }) });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waitFor[m.id]) { m.error ? waitFor[m.id][1](new Error(m.error.message)) : waitFor[m.id][0](m.result); delete waitFor[m.id]; } }; ws.onerror = rej; }); }
// run({ page: 'sheet.html', query: '', size: [W, H], dpr, gl: true }, async ({ ev, shot, save, pg, sleep }) => {...})
exports.run = async function (o, fn) { const lock = await slot(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-pets-')), [W, H] = o.size || [1200, 900];
  const GL = o.gl === false ? ['--disable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--mute-audio', '--no-first-run', '--allow-file-access-from-files', ...GL, '--remote-debugging-port=0', '--user-data-dir=' + dir, '--window-size=' + W + ',' + H, 'about:blank'], { stdio: 'ignore' });
  let code = 0; const timer = setTimeout(() => { console.log('TIMEOUT'); done(2); }, o.limit || 240000);
  function done(c) { clearTimeout(timer); try { execSync('taskkill /F /T /PID ' + edge.pid, { stdio: 'ignore' }); } catch (e) {} try { fs.unlinkSync(lock); } catch (e) {} setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} process.exit(c); }, 400); }
  process.on('SIGINT', () => done(3));
  try { let port = 0; for (let i = 0; i < 150 && !port; i++) { await sleep(100); try { port = +fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) {} }
    const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(), pg = await cdp(list.find(t => t.type === 'page').webSocketDebuggerUrl);
    await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: o.dpr || 1, mobile: false });
    await pg.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__err=[];window.addEventListener("error",function(e){__err.push(String(e.message)+" @"+(e.filename||"").split("/").pop()+":"+e.lineno)});' });
    await pg.send('Page.navigate', { url: 'file:///' + ROOT.split(path.sep).join('/').replace(/ /g, '%20') + '/' + o.page + (o.query || '') });
    const ev = async x => { const r = await pg.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text)); return r.result.value; };
    for (let i = 0; i < 300; i++) { await sleep(100); if (await ev('!!window.__ready || (window.__err && __err.length > 0)')) break; }
    const shot = async file => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from((await pg.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
    const save = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };
    await fn({ ev, shot, save, pg, sleep }); console.log('errors', await ev('JSON.stringify(window.__err||[])'));
  } catch (e) { console.log('ERR ' + (e.stack || e)); code = 1; }
  done(code); };
