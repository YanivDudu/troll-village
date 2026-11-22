// Service worker of "עולם הטרולים": lets the installed app start without a network. Registered by the block "pwa" of index.html.
//
// THE RULE: the game is deployed several times a day and its sync code assumes that the page is the newest one, so the
// page and its scripts are ALWAYS asked from the network first. A saved copy is used only when the network does not answer.
//   pages and scripts (.html, .js, the manifest)  network first, revalidated (cache: 'no-cache'); the saved copy is served when
//                                                  the request fails, or when the network is silent for TIMEOUT ms
//   pictures, fonts, sounds                        saved copy first, and refreshed from the network in the background, so a
//                                                  picture replaced under the same name arrives by itself one visit later
//   everything else                                not touched: other origins (Firestore, the Realtime Database, sign-in, Google),
//                                                  every request that is not a GET, Firebase's own /__/ addresses
// Changing VERSION throws away every saved copy on the next visit. To switch the worker off for everybody, deploy a sw.js
// whose activate handler calls self.registration.unregister().
var VERSION = 'v1';
var FRESH = 'troll-fresh-' + VERSION, ASSETS = 'troll-assets-' + VERSION;
var TIMEOUT = 4000;
// OPTIONAL: scripts the page asks for only later, so its text does not name them (task "map3d": the 3D picture of the maps is loaded the first time
// a map is shown). They are saved at install when they arrive; when one does not, the worker is installed all the same and the game shows its flat map.
// They follow the rule of every script: the network first, the saved copy when there is no network.
// Task "pets": assets/map3d/pets3d.js (the 3D models of the living pets) is asked for the first time a pet is tried on in the cart.
var OPTIONAL = ['assets/map3d/three.min.js', 'assets/map3d/toy3d.js', 'assets/map3d/toy3d_more.js', 'assets/map3d/map3d.js', 'assets/map3d/pets3d.js'];
var FRESH_EXT = /\.(html?|js|mjs|json|webmanifest)$/i, ASSET_EXT = /\.(png|jpe?g|gif|webp|svg|ico|woff2?|mp3|ogg|wav)$/i;

// Pure: what to do with a request. 'pass' = the worker does not answer, the browser does what it always did.
function route(method, url, scope, isNav) {
  var u, s;
  try { u = new URL(url); s = new URL(scope); } catch (e) { return 'pass'; }
  if (method !== 'GET') return 'pass';
  if (u.origin !== s.origin || u.protocol !== 'https:' && u.protocol !== 'http:') return 'pass';
  if (u.pathname.indexOf(s.pathname) !== 0) return 'pass';
  if (u.pathname.indexOf('/__/') >= 0) return 'pass';
  if (ASSET_EXT.test(u.pathname)) return 'asset';
  if (isNav || FRESH_EXT.test(u.pathname) || u.pathname === s.pathname) return 'fresh';
  return 'pass';
}
// Pure: the bytes a Range header asks for, out of size bytes: [first, last], or null when it cannot be satisfied.
function byteRange(header, size) {
  var m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/.exec(header || '');
  if (!m || m[1] === '' && m[2] === '' || !(size > 0)) return null;
  var a, b;
  if (m[1] === '') { a = Math.max(0, size - +m[2]); b = size - 1; if (+m[2] === 0) return null; }
  else { a = +m[1]; b = m[2] === '' ? size - 1 : Math.min(+m[2], size - 1); }
  return a > b || a >= size ? null : [a, b];
}

if (typeof module !== 'undefined' && module.exports) module.exports = { route: route, byteRange: byteRange, VERSION: VERSION, OPTIONAL: OPTIONAL };
else (function () {
  var scope = self.registration.scope, refreshed = {};
  function noop() {}
  function good(r) { return r && r.status === 200 && r.type === 'basic'; }

  self.addEventListener('install', function (e) {
    self.skipWaiting();
    // the page and the scripts it names, so that the very first visit is already enough to start without a network
    e.waitUntil(caches.open(FRESH).then(function (c) {
      return fetch(scope, { cache: 'no-cache' }).then(function (r) {
        if (!good(r) || r.redirected) throw new Error('page');
        return r.clone().text().then(function (html) {
          var list = [], re = /<script src="([^"]+)"/g, m;
          while ((m = re.exec(html))) if (route('GET', new URL(m[1], scope).href, scope, false) === 'fresh') list.push(new URL(m[1], scope).href);
          OPTIONAL.forEach(function (p) { list.push(new URL(p, scope).href); });
          return Promise.all([c.put(scope, r)].concat(list.map(function (u) {
            return fetch(u, { cache: 'no-cache' }).then(function (x) { return good(x) ? c.put(u, x) : null; }).catch(noop);
          })));
        });
      });
    }));
  });

  self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k.indexOf('troll-') === 0 && k !== FRESH && k !== ASSETS ? caches.delete(k) : null; }));
    }).then(function () { return self.clients.claim(); }));
  });

  function saved(c, req, isNav) {
    return c.match(req).then(function (hit) { return hit || (isNav ? c.match(req, { ignoreSearch: true }) : hit); })
      .then(function (hit) { return hit || (isNav && /\/(index\.html)?$/.test(new URL(req.url).pathname) ? c.match(scope) : hit); });
  }
  function fresh(e, isNav) {
    var req = e.request;
    return caches.open(FRESH).then(function (c) {
      var net = fetch(req, { cache: 'no-cache' }).then(function (r) {
        if (good(r) && !r.redirected) e.waitUntil(c.put(new URL(req.url).pathname === new URL(scope).pathname ? scope : req, r.clone()).catch(noop));
        return r;
      });
      var offline = net.catch(function () { return saved(c, req, isNav).then(function (hit) { if (hit) return hit; throw new Error('offline'); }); });
      var slow = new Promise(function (ok) {
        setTimeout(function () { saved(c, req, isNav).then(function (hit) { if (hit) ok(hit); }, noop); }, TIMEOUT);
      });
      e.waitUntil(net.catch(noop)); // a late answer still renews the saved copy
      return Promise.race([offline, slow]);
    });
  }
  function ranged(r, header) { // an <audio> asks for bytes; Safari refuses a whole file as the answer
    return r.blob().then(function (blob) {
      var p = byteRange(header, blob.size), type = r.headers.get('Content-Type') || 'application/octet-stream';
      if (!p) return new Response('', { status: 416, statusText: 'Range Not Satisfiable', headers: { 'Content-Range': 'bytes */' + blob.size } });
      return new Response(blob.slice(p[0], p[1] + 1, type), { status: 206, statusText: 'Partial Content',
        headers: { 'Content-Type': type, 'Content-Range': 'bytes ' + p[0] + '-' + p[1] + '/' + blob.size, 'Content-Length': String(p[1] - p[0] + 1), 'Accept-Ranges': 'bytes' } });
    });
  }
  function store(c, url) { return fetch(url).then(function (r) { return good(r) ? c.put(url, r.clone()).then(function () { return r; }) : r; }); }
  function asset(e) {
    var req = e.request, url = req.url, range = req.headers.get('range');
    return caches.open(ASSETS).then(function (c) {
      return c.match(url).then(function (hit) {
        if (hit) {
          if (!refreshed[url]) { refreshed[url] = 1; e.waitUntil(store(c, url).catch(noop)); }
          return range ? ranged(hit, range) : hit;
        }
        if (range) { e.waitUntil(store(c, url).catch(noop)); return fetch(req); } // first time: the sound streams as always, the whole file is saved beside it
        return store(c, url);
      });
    });
  }

  self.addEventListener('fetch', function (e) {
    var req = e.request, isNav = req.mode === 'navigate', what = route(req.method, req.url, scope, isNav);
    if (what === 'fresh') e.respondWith(fresh(e, isNav));
    else if (what === 'asset') e.respondWith(asset(e));
  });

  // The first visit loads its pictures before the worker is in charge: the page sends the addresses it has loaded and
  // the worker saves the ones it lacks (they come out of the browser's own cache).
  self.addEventListener('message', function (e) {
    var list = e.data && e.data.seen;
    if (!Array.isArray(list)) return;
    e.waitUntil(caches.open(ASSETS).then(function (c) {
      return Promise.all(list.slice(0, 400).map(function (u) {
        if (typeof u !== 'string' || route('GET', u, scope, false) !== 'asset') return null;
        return c.match(u).then(function (hit) { return hit ? null : store(c, u).catch(noop); });
      }));
    }));
  });
})();
