// node tests/sw.test.js  ->  SW OK
// The decisions of the service worker (sw.js): which requests it answers and how, the byte ranges of a sound, the manifest,
// and the conditions under which index.html registers the worker.
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const { route, byteRange } = require(path.join(root, 'sw.js'));
const FB = 'https://troll-math.web.app/', GH = 'https://yanivdudu.github.io/troll-village/';
const r = (url, scope, o) => route((o && o.method) || 'GET', url, scope, !!(o && o.nav));

for (const S of [FB, GH]) {
  // the page and every script: always the network first
  assert.strictEqual(r(S, S, { nav: true }), 'fresh');
  assert.strictEqual(r(S + '?x=1', S, { nav: true }), 'fresh');
  assert.strictEqual(r(S + 'index.html', S, { nav: true }), 'fresh');
  assert.strictEqual(r(S + 'index.html', S), 'fresh');
  assert.strictEqual(r(S + 'speed.html', S, { nav: true }), 'fresh');
  for (const p of fs.readdirSync(path.join(root, 'packs')).filter(f => /\.js$/.test(f))) assert.strictEqual(r(S + 'packs/' + p, S), 'fresh', p);
  assert.strictEqual(r(S + 'sw.js', S), 'fresh');
  assert.strictEqual(r(S + 'manifest.webmanifest', S), 'fresh');
  // pictures, fonts and sounds: the saved copy
  for (const p of ['assets/forest.jpg', 'assets/ico/1f512.png', 'assets/toy/bridge.png', 'assets/font/rubik-hebrew.woff2', 'assets/snd/carefree.mp3', 'assets/app/icon-192.png'])
    assert.strictEqual(r(S + p, S), 'asset', p);
  // never touched
  assert.strictEqual(r(S, S, { method: 'POST' }), 'pass');
  assert.strictEqual(r(S + 'index.html', S, { method: 'HEAD' }), 'pass');
  assert.strictEqual(r(S + 'assets/CREDITS.txt', S), 'pass');
  assert.strictEqual(r(S + '__/auth/handler', S, { nav: true }), 'pass');
  assert.strictEqual(r(S + '__/auth/handler.js', S), 'pass');
}
// the copy on GitHub Pages answers only inside its own folder
assert.strictEqual(r('https://yanivdudu.github.io/other/index.html', GH, { nav: true }), 'pass');
assert.strictEqual(r('https://yanivdudu.github.io/', GH, { nav: true }), 'pass');
// other origins: the cloud, the sign-in, Google's scripts
for (const u of ['https://firestore.googleapis.com/v1/projects/troll-math/databases/(default)/documents/families/x?key=k',
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=k', 'https://securetoken.googleapis.com/v1/token?key=k',
  'https://troll-math-default-rtdb.europe-west1.firebasedatabase.app/races/x.json', 'https://troll-math-default-rtdb.firebaseio.com/a.json',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://troll-math.firebaseapp.com/__/auth/handler',
  'https://fonts.gstatic.com/s/rubik/v1/a.woff2', 'http://troll-math.web.app/index.html', 'chrome-extension://abc/x.js', 'data:text/plain,x', 'not a url'])
  for (const m of ['GET', 'POST', 'PATCH']) assert.strictEqual(route(m, u, FB, false), 'pass', u);
// every address the game itself names outside its own files is on another origin, so it is passed
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const outside = [...new Set(html.match(/https:\/\/[a-z0-9.-]+/g) || [])];
assert(outside.length >= 3, 'addresses of the cloud were expected in index.html');
for (const u of outside) assert.strictEqual(route('GET', u + '/x.js', FB, false), 'pass', u);

// byte ranges of a sound
assert.deepStrictEqual(byteRange('bytes=0-', 1000), [0, 999]);
assert.deepStrictEqual(byteRange('bytes=0-1', 1000), [0, 1]);
assert.deepStrictEqual(byteRange('bytes=500-', 1000), [500, 999]);
assert.deepStrictEqual(byteRange('bytes=500-5000', 1000), [500, 999]);
assert.deepStrictEqual(byteRange('bytes=-100', 1000), [900, 999]);
assert.deepStrictEqual(byteRange('bytes=-5000', 1000), [0, 999]);
assert.strictEqual(byteRange('bytes=1000-', 1000), null);
assert.strictEqual(byteRange('bytes=5-2', 1000), null);
assert.strictEqual(byteRange('bytes=-0', 1000), null);
assert.strictEqual(byteRange('bytes=-', 1000), null);
assert.strictEqual(byteRange('lines=1-2', 1000), null);
assert.strictEqual(byteRange('bytes=0-', 0), null);

// the manifest: relative addresses (the copy on GitHub Pages lives in a folder), icons that exist with the size they declare
const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
assert.strictEqual(man.name, 'עולם הטרולים'); assert.strictEqual(man.lang, 'he'); assert.strictEqual(man.dir, 'rtl');
assert.strictEqual(man.display, 'standalone'); assert.strictEqual(man.orientation, 'any');
assert.strictEqual(man.start_url, './'); assert.strictEqual(man.scope, './');
for (const k of ['theme_color', 'background_color']) assert(/^#[0-9a-f]{6}$/.test(man[k]), k);
const seen = {};
for (const i of man.icons) {
  assert(!/^(\/|https?:)/.test(i.src), i.src + ' must be relative');
  const png = fs.readFileSync(path.join(root, i.src));
  assert.strictEqual(png.toString('latin1', 1, 4), 'PNG', i.src);
  assert.strictEqual(png.readUInt32BE(16) + 'x' + png.readUInt32BE(20), i.sizes, i.src);
  seen[i.purpose + i.sizes] = 1;
}
for (const k of ['any192x192', 'any512x512', 'maskable192x192', 'maskable512x512']) assert(seen[k], 'icon ' + k);
const apple = fs.readFileSync(path.join(root, /<link rel="apple-touch-icon"[^>]*href="([^"]+)"/.exec(html)[1]));
assert.strictEqual(apple.readUInt32BE(16) + 'x' + apple.readUInt32BE(20), '180x180');
assert(/<link rel="manifest" href="manifest\.webmanifest">/.test(html));
assert(!/viewport-fit/.test(/<meta name="viewport"[^>]*>/.exec(html)[0]), 'viewport-fit=cover needs safe-area padding first');

// the registration in index.html: only on the real site, never where the tests run
const pwa = /<script id="pwa">([\s\S]*?)<\/script>/.exec(html)[1];
function registers(href) {
  const u = new URL(href); let reg = 0;
  const nav = { serviceWorker: { register() { reg++; return { then() { return { then() { return { catch() {} }; } }; } }; }, ready: null } };
  const win = { addEventListener(ev, f) { if (ev === 'load') f(); } };
  new Function('navigator', 'location', 'window', 'performance', 'setTimeout', pwa)(nav, { protocol: u.protocol, hostname: u.hostname, hash: u.hash }, win, {}, () => {});
  return reg;
}
assert.strictEqual(registers('https://troll-math.web.app/'), 1);
assert.strictEqual(registers('https://yanivdudu.github.io/troll-village/'), 1);
assert.strictEqual(registers('https://troll-math.web.app/#g=2'), 1);
for (const u of ['file:///C:/Users/x/troll-math/index.html', 'http://localhost:8080/', 'https://localhost/', 'http://127.0.0.1:5000/', 'https://127.0.0.1/', 'http://[::1]:5000/',
  'http://troll-math.web.app/', 'https://troll-math.web.app/#demo&s=home', 'https://troll-math.web.app/#auto&g=2&t=mix', 'https://troll-math.web.app/#fit'])
  assert.strictEqual(registers(u), 0, u);

// task "map3d": the scripts of the 3D map are loaded by the page only when a map is shown, so the worker names them itself: each exists, is a script
// (network first), is asked for by index.html from exactly that address, and index.html does not load it with a <script src> of its own
{
  const { OPTIONAL } = require(path.join(root, 'sw.js'));
  assert(Array.isArray(OPTIONAL) && OPTIONAL.length === 6);
  const files = /FILES = \[([^\]]+)\]/.exec(html)[1].split(',').map(x => 'assets/map3d/' + x.trim().replace(/'/g, ''));
  assert.deepStrictEqual(files, OPTIONAL);
  for (const p of OPTIONAL) {
    assert(fs.statSync(path.join(root, p)).size > 1000, p);
    for (const S of [FB, GH]) assert.strictEqual(r(S + p, S), 'fresh', p);
    assert(html.indexOf('<script src="' + p) < 0, p + ' must be loaded lazily');
  }
}

// the Android package is tied to the site by this file
const links = JSON.parse(fs.readFileSync(path.join(root, '.well-known', 'assetlinks.json'), 'utf8'));
assert(Array.isArray(links));
for (const l of links) {
  assert.deepStrictEqual(l.relation, ['delegate_permission/common.handle_all_urls']);
  assert.strictEqual(l.target.namespace, 'android_app'); assert(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(l.target.package_name));
  for (const f of l.target.sha256_cert_fingerprints) assert(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f), f);
}
console.log('SW OK');
