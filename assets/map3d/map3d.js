// task "map3d": the picture of a trail map (the map of a topic, the map of a subject) as a real-time 3D toy island. three.js r147 (classic script) + toy3d.js.
// Loaded lazily by the block "ui" of index.html (M3) the first time a map screen is shown. This file draws ONLY the picture: the island, the trail, the houses
// and landmarks, trees and flowers, the shore. Everything a child reads or taps stays DOM and is laid out by the game exactly as before (trailLayout): the 3D
// layer READS where the game put every stop (its picture, its card, the companion, the trail points) and builds the island under them, so both always agree.
// The camera is orthographic and tilted: a point of the screen is a point of the ground by plain arithmetic, the same for a short map and for a tall one that scrolls
// (the canvas is a child of the map and scrolls with it; nothing is drawn while it scrolls).
//   TrollMap3D.attach(box, { q, auto, rm, plan })  ->  { layout(items), dispose(keepPicture), stats(), check() }   or null (then the flat map simply stays)
//   q: forced quality step 0..4 | null.  auto: measure the first second and step down.  rm: reduced motion (one still frame).  plan: no WebGL, only the geometry (the overlap test).
// Quality steps: 0 full (pixel ratio up to 2, shadow map) | 1 pixel ratio up to 1.5 | 2 no shadow map | 3 two thirds of the resolution | 4 still picture (drawn only on change) | 5 the flat map.
// The step a device ended on is kept in localStorage 'troll-m3q' ("step|time"); it is not part of the saved game.
var TrollMap3D = (function () {
  'use strict';
  var V3 = THREE.Vector3, KEY = 'troll-m3q', WATER = -0.5;
  var PALS = {
    day: { g0: '#c9f27a', g1: '#8fe05a', g2: '#5fcb49', sand: '#f6d27a', sand2: '#dba94a', bed: '#d8a955', path: '#fff1c4', pad: '#ffe7a8', w0: '#27b4ea', w1: '#0b78c6', sh: '#7fe3f2', hemiS: '#ffffff', hemiG: '#a6d48c', hemi: 0.58, sun: '#fff3d0', sunI: 0.6, tint: '#ffffff', rim: '#39382e', spec: '#1d1d1d', blob: '20,90,45', foam: 1 },
    dusk: { g0: '#d6e874', g1: '#9fd456', g2: '#6dbd49', sand: '#f3c573', sand2: '#d29a46', bed: '#cf9a50', path: '#ffe9bf', pad: '#ffdc9c', w0: '#5f86c8', w1: '#2f5aa8', sh: '#9bb7e6', hemiS: '#ffd9b8', hemiG: '#b9c9a0', hemi: 0.54, sun: '#ffb070', sunI: 0.58, tint: '#fff0e0', rim: '#4a3020', spec: '#1d1712', blob: '40,80,40', foam: 0.9 },
    night: { g0: '#6fbf86', g1: '#4aa373', g2: '#368a63', sand: '#b9a77e', sand2: '#8f7c5a', bed: '#7a8f72', path: '#cfd3c0', pad: '#c6c9ae', w0: '#1d3f8f', w1: '#0c2260', sh: '#3f6fc0', hemiS: '#b4c0ff', hemiG: '#56789a', hemi: 0.78, sun: '#c9d4ff', sunI: 0.46, tint: '#aebcf0', rim: '#1c2a55', spec: '#14182a', blob: '10,40,45', foam: 0.45 }
  };
  var bodyC = document.body.classList, SKY = bodyC.contains('night') ? 'night' : bodyC.contains('dusk') ? 'dusk' : 'day', PAL = PALS[SKY];

  // ---------- shared for the whole session: ONE canvas, ONE renderer, the materials. A map builds its own geometry and gives it back when the child leaves ----------
  var R = null, canvas = null, scene, cam, hemi, sun, fireL, toyMat, groundMat, gCan, gCtx, gTex, water, halo, sparks, puffTex, glTried = false, lost = false, lostT = 0, ctxLost = 0, ctxBack = 0;
  var uTime = { value: 0 }, uRim = { value: new THREE.Color(PAL.rim) }, v3 = new V3();
  var I = null;                                           // the map that is attached now (one at a time)
  function canvasTex(size, draw) { var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return new THREE.CanvasTexture(c); }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807 + 11) % 2147483647; return (s & 0xffffff) / 0x1000000; }; }
  function pow2(n, max) { var p = 256; while (p < n && p < max) p *= 2; return p; }
  // the toy material: smooth glossy plastic. A soft highlight from the sun, a rim light on the silhouette, vertex colours, a sway for the tree tops
  function makeToyMat() { var m = new THREE.MeshPhongMaterial({ vertexColors: true, color: PAL.tint, shininess: 46, specular: PAL.spec });
    m.onBeforeCompile = function (sh) { sh.uniforms.uTime = uTime; sh.uniforms.uRim = uRim;
      sh.vertexShader = 'attribute vec2 aSway;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        'vec3 transformed = vec3( position );\n transformed.x += sin(uTime * 1.7 + aSway.y) * aSway.x;\n transformed.z += cos(uTime * 1.3 + aSway.y * 1.7) * aSway.x * 0.6;');
      sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <envmap_fragment>',
        'float rimK = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);\n outgoingLight += uRim * rimK * (0.35 + diffuseColor.rgb);\n#include <envmap_fragment>'); };
    return m; }
  function initShared(plan, forced) {
    if (scene) return !!R || plan;
    if (!plan) {
      if (glTried && !R) return false; glTried = true;
      canvas = document.createElement('canvas'); canvas.className = 'm3c'; canvas.setAttribute('aria-hidden', 'true');
      // a browser that would draw WebGL in software (no graphics chip, a blocked driver) says no here, and the flat map stays. A forced step (&q=) takes any WebGL: the headless checks draw in software
      try { R = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: !forced }); } catch (e) { R = null; }
      if (!R) return false;
      R.setClearColor(0x000000, 0); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.shadowMap.autoUpdate = false;
      // the browser may take the graphics context away (a phone that needs the memory, a tab long in the background): the flat map is back at once;
      // the 3D picture returns when the context does. If it does not return in 3 seconds the flat map stays for this visit
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; ctxLost++; if (I) I.hide(); clearTimeout(lostT); lostT = setTimeout(function () { if (lost && I) I.fail('lost'); }, 3000); });
      canvas.addEventListener('webglcontextrestored', function () { lost = false; ctxBack++; clearTimeout(lostT); if (I && !I.dead) I.restored(); });
    }
    scene = new THREE.Scene();
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 900);
    hemi = new THREE.HemisphereLight(PAL.hemiS, PAL.hemiG, PAL.hemi); scene.add(hemi);
    sun = new THREE.DirectionalLight(PAL.sun, PAL.sunI); sun.castShadow = true; var big = window.innerWidth >= 1000 && window.innerHeight >= 600; sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024); sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun); scene.add(sun.target);
    fireL = new THREE.PointLight('#ffa448', 0, 11, 1.5); scene.add(fireL);   // task "world3d": the campfire of the camp. It is in the scene from the start, dark on the maps, so that the camp and the maps use the same shader programs (the number of lights is part of a program)
    toyMat = makeToyMat();
    gCan = document.createElement('canvas'); gCtx = gCan.getContext('2d'); gTex = new THREE.CanvasTexture(gCan); if (R) gTex.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    groundMat = new THREE.MeshLambertMaterial({ map: gTex });
    // the shore: shallow water and two lines of foam round the island, fading out into the sea of the page (the sea itself is the DOM background, as on the flat map)
    water = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { uTime: uTime, uW0: { value: new THREE.Color(PAL.w0) }, uSh: { value: new THREE.Color(PAL.sh) }, uIsle: { value: new THREE.Vector2(5, 12) }, uE: { value: 4 }, uFade: { value: 1 }, uFoam: { value: PAL.foam } },
      vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'varying vec3 vP; uniform float uTime, uE, uFoam, uFade; uniform vec3 uW0, uSh; uniform vec2 uIsle;\n' +
        'void main(){ vec2 p = vP.xz; vec2 q = abs(p) / uIsle; float f = pow(q.x, uE) + pow(q.y, uE); float edge = length(p) * (1.0 - 1.0 / max(pow(f, 1.0 / uE), 0.01));\n' +
        ' vec3 c = mix(uSh, uW0, smoothstep(-0.2, uFade, edge) * 0.8);\n' +
        ' float a = sin(p.x * 0.9 + sin(p.y * 0.6 + uTime * 0.5) * 1.6 + uTime * 0.7) * sin(p.y * 1.5 + sin(p.x * 0.45 - uTime * 0.35) * 1.4 - uTime * 0.25); c += vec3(0.5, 0.62, 0.66) * smoothstep(0.86, 0.98, a) * 0.3 * uFoam;\n' +
        ' float fo = smoothstep(0.14, 0.0, abs(edge - 0.2 - 0.1 * sin(uTime * 0.9 + p.x * 0.7 + p.y * 0.5))) * 0.85 + smoothstep(0.1, 0.0, abs(edge - 0.62 * uFade - 0.08 * sin(uTime * 0.6 + p.y * 0.4 - p.x * 0.3))) * 0.4;\n' +
        ' c = mix(c, vec3(1.0), clamp(fo, 0.0, 1.0) * uFoam);\n' +
        ' gl_FragColor = vec4(c, (1.0 - smoothstep(0.5 * uFade, uFade, edge)) * 0.92); }' }));
    water.position.y = WATER; water.renderOrder = -1; scene.add(water);
    var glowTex = canvasTex(128, function (c, s) { var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,236,120,1)'); g.addColorStop(0.45, 'rgba(255,214,60,.75)'); g.addColorStop(0.72, 'rgba(255,200,40,.28)'); g.addColorStop(1, 'rgba(255,200,40,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
    halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5, color: '#ffd76a' }));
    var sp = [], sr = rnd(11); for (var i = 0; i < 10; i++) sp.push((sr() - 0.5) * 3.2, sr() * 3, (sr() - 0.5) * 2.4);
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.userData.base = sp.slice();
    var starTex = canvasTex(64, function (c, s) { c.fillStyle = '#fff'; c.translate(s / 2, s / 2); c.beginPath(); for (var j = 0; j < 8; j++) { var r = j % 2 ? s * 0.13 : s * 0.48, a = j * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); });
    sparks = new THREE.Points(sg, new THREE.PointsMaterial({ map: starTex, color: '#fff6b0', size: 12, sizeAttenuation: false, transparent: true, depthWrite: false, opacity: 0.95 }));
    puffTex = canvasTex(256, function (c, s) { [[0.24, 0.6, 0.24], [0.5, 0.66, 0.3], [0.77, 0.6, 0.23], [0.38, 0.5, 0.18], [0.63, 0.5, 0.18]].forEach(function (b) { var g = c.createRadialGradient(b[0] * s, b[1] * s, 0, b[0] * s, b[1] * s, b[2] * s); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); }); });
    return true;
  }
  function savedQ() { try { var m = /^(\d)\|(\d+)$/.exec(localStorage.getItem(KEY) || ''); return m ? { q: +m[1], t: +m[2] } : null; } catch (e) { return null; } }
  function saveQ(q) { try { localStorage.setItem(KEY, q + '|' + Date.now()); } catch (e) {} }
  function cross(a, b, pad) { pad = pad || 0; return Math.min(a[2], b[2] + pad) - Math.max(a[0], b[0] - pad) > 0 && Math.min(a[3], b[3] + pad) - Math.max(a[1], b[1] - pad) > 0; }

  // ---------- one map ----------
  function attach(box, o) {
    o = o || {};
    if (I) I.dispose();
    if (!initShared(!!o.plan, o.q != null || !!o.soft)) return null;
    var RM = !!o.rm, plan = !!o.plan, dead = false, shown = false, sig = '', items = null, raf = 0, layT = 0;
    var W = 0, H = 0, CW = 0, CH = 0, MX = 8, MT = 24, MB = 6, LAND = false, PITCH = 0.66, SP = 0.6, CP = 0.8, PPU = 24, INS = 0, INST = 0, FADE = 1, IX0 = 0, IX1 = 0, ICX = 0, ICY = 0, A = 5, B = 8, E = 4, S = 1, G = 1;
    var hills = [], stops = [], avoid = [], trailPx = [], dots = [], spots = [], props = [], world = null, fx = null, terrain = null, fogs = [], ship = null, recStop = null, verts = 0;
    var sv = savedQ(), TIER = o.q != null ? Math.min(4, +o.q) : sv ? Math.max(0, Math.min(4, Date.now() - sv.t > 2592e5 ? sv.q - 1 : sv.q)) : 0;   // a saved step is tried one step better again after three days
    var AUTO = !!o.auto && o.q == null && !RM && !plan, probe = null, probeLog = [], curPR = 0, dirty = true, running = false, last = 0, frameNo = 0, lastInput = performance.now(), time = 0, AMB_MS = 20000;
    var st = { t0: o.t0 || performance.now(), buildMs: 0, readyMs: 0, frames: 0 };
    // task "camp3d": the animals of the companion as 3D actors on the map (pets3d.js; at most two, only on the quality steps 0..2). They follow a target on the
    // ground: the point under the feet of the DOM companion (where it stands in its stop, or where it walks along the trail). pets(list) / walker(px, py).
    var petList = [], pets = [], ptg = { x: 0, z: 0, r: 0.55, y: 1.2, sitting: false }, petT = 0, pv = new V3();
    function petsOk() { return !plan && !RM && TIER <= 2 && !!window.Pets && !!world; }
    function petsDrop() { pets.forEach(function (p) { try { p.dispose(); } catch (e) {} }); pets = []; box.classList.remove('m3pets'); }
    function petsMake() { petsDrop(); if (!petsOk() || !petList.length) return;
      var bs = null; stops.forEach(function (s) { if (s.bud) bs = s; }); if (!bs) return;
      toWorld((bs.bud[0] + bs.bud[2]) / 2, bs.bud[3] - 2, pv); ptg.x = pv.x; ptg.z = pv.z;
      try { var lk = Pets.look(); lk.set(PAL); petList.slice(0, 2).forEach(function (d, i) { var p = Pets.create(d.kind, { variant: d.variant || 0, scale: Math.max(0.3, Math.min(0.6, (bs.bud[3] - bs.bud[1]) / PPU / 2.3 * 0.5)), look: lk });
          if (p.blob) p.blob.material.color.set('rgb(' + PAL.blob + ')'); p.place(ptg.x + (i ? -1 : 1) * 2.2 * p.scale, ptg.z + 0.25 + i * 0.3, 0); p.root.position.y = hgt(p.x, p.z); p.follow(ptg); world.add(p.root); pets.push(p); });
        box.classList.add('m3pets'); petT = performance.now(); dirty = true; } catch (e) { petsDrop(); } }
    function petsStep(dt, now) { var mov = false; pets.forEach(function (p) { p.update(dt); p.root.position.y = hgt(p.x, p.z); if (p.moving || p.S.act) mov = true; }); if (mov) petT = now; }
    // task "world3d": the companion itself as a 3D actor (troll3d.js, with o.spec; the quality steps 0..3). It stands where the drawn companion stands in its stop and
    // goes where the walker of the page goes (walker(px, py): the point under its feet): it turns to where it walks, and to the child when it stands. The page still
    // owns the walk (the way, the times, the rules); the drawn companion and its walker rest meanwhile (.m3troll).
    var troll = null, ttg = { x: 0, z: 0, on: false }, tHome = new V3(), trollT = 0, tv3 = new V3();
    function trollOk() { return !plan && !RM && TIER <= 3 && !!window.Troll3D && !!o.spec && !!world; }
    function trollDrop() { if (troll) { if (troll.root.parent) troll.root.parent.remove(troll.root); troll.onDirty = null; troll = null; } box.classList.remove('m3troll'); }
    function trollMake() { var keep = troll && ttg.on ? [ttg.x, ttg.z] : null; trollDrop(); if (!trollOk()) return;
      var bs = null; stops.forEach(function (s) { if (s.bud) bs = s; }); if (!bs) return;
      var bh = bs.bud[3] - bs.bud[1]; toWorld((bs.bud[0] + bs.bud[2]) / 2, bs.bud[3] - bh * 0.03, tHome);
      try { var lk = Troll3D.look(); lk.set(PAL, SKY === 'night' ? 0.7 : SKY === 'dusk' ? 0.3 : 0);
        troll = Troll3D.one(o.spec, { look: lk }); troll.setScale(bh / (PPU * CP * 3.493)); troll.cam = cam; troll.avoid = null; troll.onDirty = function () { dirty = true; kick(); }; if (troll.blob) troll.blob.material.color.set('rgb(' + PAL.blob + ')');
        troll.carry(null); troll.stand(); troll.S.act = null; troll.hold = false; troll.setMood('happy', { still: 1 }); troll.heading = 0; troll.mode = 'idle'; troll.root.visible = true;
        if (keep) { ttg.x = keep[0]; ttg.z = keep[1]; } else { ttg.x = tHome.x; ttg.z = tHome.z; ttg.on = false; }
        troll.drive(ttg.x, ttg.z, 0); troll.root.position.y = hgt(ttg.x, ttg.z); world.add(troll.root); troll.update(0.016); box.classList.add('m3troll'); trollT = performance.now(); dirty = true;
      } catch (e) { trollDrop(); try { Troll3D.oneDrop(); } catch (e2) {} if (window.console) console.warn('troll3d', e); } }
    function trollStep(dt, now) { var T = troll; T.drive(ttg.x, ttg.z, 0); T.lookAt(T.x, 4, T.z + 6); T.update(dt); T.root.position.y = hgt(T.x, T.z); if (T.moving || T.S.act || T.S.gaitW > 0.03 || Math.abs(T.S.w) > 0.01) trollT = now; }
    var TACT = { wave: 'wave', proud: 'proud', oops: 'oops', surprised: 'surprised', cheer: 'jump' };
    function trollPose(m) { if (!troll || dead || lost) return; if (Troll3D.FACES.indexOf(m) < 0) m = 'happy'; troll.setMood(m, { still: 1 }); if (TACT[m]) troll.play(TACT[m]); trollT = performance.now(); kick(); }

    // -- the frame: where the island lies in the box, and the ground under a point of the screen --
    function isleR(x, z) { return Math.pow(Math.pow(Math.abs(x / A), E) + Math.pow(Math.abs(z / B), E), 1 / E); }
    function hgt(x, z) {                                  // a low dome, soft hills under the mountains, a rounded shore that dives under the water
      var r = isleR(x, z), y = 0.3 * (1 - Math.min(1, r * r)), t = (r - 0.78) / 0.22, i;
      if (t > 0) y -= 0.5 * t * t;
      for (i = 0; i < hills.length; i++) { var h = hills[i], d2 = (x - h.x) * (x - h.x) + (z - h.z) * (z - h.z); if (d2 < h.s * h.s * 9) y += h.a * Math.exp(-d2 / (2 * h.s * h.s)); }
      return y; }
    function toWorld(px, py, out) { out = out || new V3(); var x = (px - ICX) / PPU, z0 = (py - ICY) / (PPU * SP), z = z0, y = 0, i; for (i = 0; i < 4; i++) { y = hgt(x, z); z = z0 + y * CP / SP; } return out.set(x, y, z); }
    function scrX(p) { return ICX + p.x * PPU; }
    function scrY(p) { return ICY + (p.z * SP - p.y * CP) * PPU; }
    function ringPts(f, steps) { var a = []; for (var i = 0; i < steps; i++) { var t = i / steps * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), rho = f / Math.pow(Math.pow(Math.abs(c), E) + Math.pow(Math.abs(s), E), 1 / E); a.push(new V3(A * rho * c, 0, B * rho * s)); } return a; }

    // -- read the DOM: everything is measured in the layout (offset*), relative to the box, so an entrance animation of the screen does not fool it --
    function rectOf(el, n) { var x = el.offsetLeft, y = el.offsetTop, p = el.offsetParent; while (p && p !== box && box.contains(p)) { x += p.offsetLeft; y += p.offsetTop; p = p.offsetParent; } return [x, y, x + el.offsetWidth, y + el.offsetHeight]; }
    function read() {
      W = box.clientWidth; H = box.clientHeight; S = parseFloat(box.style.getPropertyValue('--s')) || 1; stops = []; avoid = [];
      var bs = getComputedStyle(box, '::before'), il = parseFloat(bs.left), it = parseFloat(bs.top), ir = parseFloat(bs.right), ib = parseFloat(bs.bottom), big = window.innerWidth > 640 && window.innerHeight > 520;
      if (!(il === il && it === it && ir === ir && ib === ib)) { il = ir = big ? -8 : -4; it = big ? -10 : -6; ib = big ? 30 : 16; }   // the island of the flat map: the box, a little wider, with room for the shore at the bottom
      var scr = box.closest('.screen'), wr = box.closest('.mwrap'); MX = 8;
      if (scr && !(wr && wr.classList.contains('scrl'))) { var ra = box.getBoundingClientRect(), rb = scr.getBoundingClientRect(); MX = Math.max(8, Math.min(48, Math.floor(Math.min(ra.left - rb.left, rb.right - ra.right)) - 1)); }   // the canvas may reach the edge of the screen, never beyond it (a map that scrolls is cut by its window anyway)
      var scrl = !!(wr && wr.classList.contains('scrl')), mT; MT = big && !scrl ? 40 : 24; mT = scrl ? 12 : MT; INST = Math.max(0, 20 - (mT + it));   // a map that scrolls is cut 12 px above its top
      INS = Math.max(0, 22 - (MX + il));                 // the island keeps room for its shore inside the canvas: on a phone it is a little narrower than the flat one
      LAND = big; PITCH = (LAND ? 42 : 38) * Math.PI / 180; SP = Math.sin(PITCH); CP = Math.cos(PITCH);
      var hs = [], k = [W, H, S, il, it, ir, ib, MX, MT, INST];
      items.forEach(function (itm, i) { var n = itm.el, mic = n && n.querySelector('.mic'), img = mic && mic.firstElementChild; if (!img) return;
        var r = rectOf(img), m = /matrix\(([-\d.e]+)/.exec(getComputedStyle(img).transform || ''), sc = m ? +m[1] || 1 : 1, w = (r[2] - r[0]) * sc, h = (r[3] - r[1]) * sc, cx = (r[0] + r[2]) / 2, by = r[3];
        var card = n.querySelector('.mcard'), bud = n.querySelector('.mbud'), hero = n.querySelector('.mhero'), bdg = n.querySelector('.hbadge');
        var s = { i: i, el: n, cx: cx, by: by, w: w, h: h, pic: (/([^\/]+)\.png/.exec(img.getAttribute('src') || '') || [])[1] || '', lock: n.classList.contains('far'), rec: n.classList.contains('rec'), reached: !!itm.reached,
          pic0: [cx - w / 2, by - h, cx + w / 2, by], card: card ? rectOf(card) : null, bud: bud ? rectOf(bud) : null, hero: hero ? rectOf(hero) : null, bdg: bdg ? rectOf(bdg) : null };
        s.kind = Toy.MODEL[s.pic] || null; stops.push(s); hs.push(h); k.push(Math.round(cx), Math.round(by), Math.round(w), s.pic, +s.lock, +s.rec, +s.reached, s.card ? s.card.join(',') : '');
        [s.pic0, s.card, s.bud, s.hero, s.bdg].forEach(function (q) { if (q) avoid.push({ r: q, s: s }); }); });
      var pb = box.__pb || box.querySelector('.parb'); if (pb && pb.offsetWidth) { var pr = rectOf(pb); if (pb.offsetParent !== box && !box.contains(pb)) { var a = pb.getBoundingClientRect(), b = box.getBoundingClientRect(); pr = [a.left - b.left, a.top - b.top, a.right - b.left, a.bottom - b.top]; } avoid.push({ r: pr, s: null }); k.push(pr.map(Math.round).join(',')); }
      hs.sort(function (a, b) { return a - b; }); var hm = hs[hs.length >> 1] || 60;
      PPU = Math.max(10, hm / 3.05);
      var x0 = il + INS, y0 = it + INST, x1 = W - ir - INS, y1 = H - ib; IX0 = x0; IX1 = x1; ICX = (x0 + x1) / 2; ICY = (y0 + y1) / 2 - 0.1 * CP * PPU; A = (x1 - x0) / 2 / PPU; B = (y1 - y0) / 2 / (PPU * SP);
      FADE = Math.max(0.4, Math.min((MX + il + INS) / PPU, (mT + it + INST) / (PPU * SP), (ib + MB) / (PPU * SP)) - 0.08);   // how far from the shore the water of the picture fades into the sea of the page
      CW = W + 2 * MX; CH = H + MT + MB;
      var pts = box.__pts || []; trailPx = []; dots = [];
      if (pts.length > 1) { var j, q, lastI = 0, len = 0, walkedLen = 0, prev = null; stops.forEach(function (s) { if (s.reached) lastI = s.i; });
        for (j = 1; j < pts.length; j++) { var a2 = pts[j - 1], b2 = pts[j], f = j % 2 ? 0.1 : -0.1, mx = (a2[0] + b2[0]) / 2 - (b2[1] - a2[1]) * f, my = (a2[1] + b2[1]) / 2 + (b2[0] - a2[0]) * f;     // the same gentle bends as the dashed path of the flat map
          for (q = j === 1 ? 0 : 1; q <= 14; q++) { var t = q / 14, u = 1 - t, p = [u * u * a2[0] + 2 * u * t * mx + t * t * b2[0], u * u * a2[1] + 2 * u * t * my + t * t * b2[1]]; if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); p[2] = len; trailPx.push(p); prev = p; }
          if (j === lastI) walkedLen = len; }
        var stepD = 15 * S, d = stepD / 2, ti = 1; for (; d < len; d += stepD) { while (ti < trailPx.length - 1 && trailPx[ti][2] < d) ti++; var p0 = trailPx[ti - 1], p1 = trailPx[ti], tt = (d - p0[2]) / Math.max(1e-6, p1[2] - p0[2]); dots.push([p0[0] + (p1[0] - p0[0]) * tt, p0[1] + (p1[1] - p0[1]) * tt, d <= walkedLen + 0.5]); }
        k.push(pts.map(function (p) { return Math.round(p[0]) + ':' + Math.round(p[1]); }).join(','), lastI); }
      return k.join('|');
    }

    // -- the plan of the island: mountains, houses, trees. Pure geometry (no WebGL): the overlap test runs exactly this --
    function freePx(r, pad, self) { if (r[0] < -MX + 2 || r[2] > W + MX - 2) return false; for (var i = 0; i < avoid.length; i++) if (avoid[i].s !== self && cross(r, avoid[i].r, pad)) return false; return true; }
    function nearTrail(r, pad) { for (var i = 0; i < trailPx.length; i++) { var p = trailPx[i]; if (p[0] > r[0] - pad && p[0] < r[2] + pad && p[1] > r[1] - pad && p[1] < r[3] + pad) return true; } return false; }
    function propRect(p, rad, tall) { var sx = scrX(p), sy = scrY(p); return [sx - rad * PPU, sy - (tall * CP + rad * SP) * PPU, sx + rad * PPU, sy + rad * SP * PPU]; }
    function pbox(g) { if (g.userData.pb && g.userData.pp === PITCH) return g.userData.pb; var P = g.attributes.position.array, b = [1e9, 1e9, -1e9, -1e9], i; for (i = 0; i < P.length; i += 3) { var x = P[i], y = P[i + 2] * SP - P[i + 1] * CP; if (x < b[0]) b[0] = x; if (x > b[2]) b[2] = x; if (y < b[1]) b[1] = y; if (y > b[3]) b[3] = y; } g.userData.pp = PITCH; return g.userData.pb = b; }
    var geoms = {};
    function houseGeom(kind, lock) { var key = kind + (lock ? '~' : ''); if (!geoms[key]) { var acc = new Toy.Acc(); Toy.BUILD[kind](acc, PAL); geoms[key] = acc.geom(lock); } return geoms[key]; }
    function modelRect(s, g) { var b = pbox(s.geom), th = s.h * g, tw = s.w * 1.45 * g, sc = Math.min(th / ((b[3] - b[1]) * PPU), tw / ((b[2] - b[0]) * PPU)), by = s.by - s.h * 0.05, hw = (b[2] - b[0]) * sc * PPU / 2;
      s.sc = sc; s.ox = s.cx - (b[0] + b[2]) / 2 * sc * PPU; s.oy = by - b[3] * sc * PPU; return [s.cx - hw, by - (b[3] - b[1]) * sc * PPU, s.cx + hw, by]; }
    function planAll() {
      hills = []; spots = []; props = []; recStop = null; var i, R0 = rnd(7 + stops.length * 13 + Math.round(W)), tries;
      // the island is a rounded box; its corners are made squarer until every stop stands on the flat part
      for (E = 4; E < 10; E += 1) { var ok = true; stops.forEach(function (s) { var p = toWorld(s.cx, s.by - s.h * 0.1); if (isleR(p.x, p.z) > 0.82) ok = false; }); if (ok) break; }
      stops.forEach(function (s) { if (s.kind) s.geom = houseGeom(s.kind, s.lock); if (s.rec) recStop = s; });
      // the houses may be bigger than the flat pictures where the map has the room: one size for all of them, the biggest that touches no card, no other stop and no button
      var gs = [1.5, 1.4, 1.3, 1.2, 1.1, 1]; G = 1;
      function fitsAt(s, g) { var r = modelRect(s, g); return !(r[1] < -6 || r[0] < IX0 + 5 || r[2] > IX1 - 5 || !freePx(r, 2, s)); }
      stops.forEach(function (s) { s.tight = !!s.kind && !fitsAt(s, 1); });               // on a crowded phone map the flat picture itself reaches a few px into the card above it: that house is made a little smaller instead
      for (i = 0; i < gs.length; i++) { var fits = true; stops.forEach(function (s) { if (s.kind && !s.tight && fits && !fitsAt(s, gs[i])) fits = false; }); if (fits || gs[i] === 1) { G = gs[i]; break; } }
      // a stop with more room round it may be up to 30% bigger than that (the pictures of the flat map grow along the trail too)
      stops.forEach(function (s) { if (!s.kind) { s.rect = s.pic0; return; } var g = G, j; if (s.tight) g = fitsAt(s, 0.92) ? 0.92 : fitsAt(s, 0.85) ? 0.85 : 0.76; else for (j = 0; j < gs.length; j++) if (gs[j] > G && gs[j] <= G * 1.3 + 0.001 && fitsAt(s, gs[j])) { g = gs[j]; break; } s.g = g; s.rect = modelRect(s, g); avoid.push({ r: s.rect, s: s, model: 1 }); });
      // mountains: far from the child (the top edge of the island), one on a phone, two on a wide screen
      var ms = LAND ? 0.9 : 0.7, want = LAND ? 2 : 1, at = [[50, 13], [28, 13], [72, 13], [14, 15], [86, 15], [40, 22], [60, 22], [20, 30], [80, 30], [50, 34], [35, 45], [65, 45]];
      at.forEach(function (c) { if (want <= 0) return; var px = c[0] / 100 * W, py = Math.max(c[1] / 100 * Math.min(H, W * 1.6), 2.3 * ms * CP * PPU - 4), p = toWorld(px, py); if (isleR(p.x, p.z) > 0.8) return;
        var r = [px - 1.6 * ms * PPU, py - 2.3 * ms * CP * PPU, px + 2.3 * ms * PPU, py + 0.8 * ms * SP * PPU]; if (!freePx(r, 4) || nearTrail(r, 8 * S)) return;
        want--; hills.push({ x: p.x + 0.4 * ms, z: p.z, a: 0.4, s: 1.3 * ms / 0.9 }); props.push({ k: 'mountain', px: px, py: py, s: ms, r: r }); avoid.push({ r: r, s: null, prop: 1 }); });
      // the hills moved the ground a little: every point is placed again on the ground it stands on
      stops.forEach(function (s) { if (s.kind) { s.pos = toWorld(s.ox, s.oy); s.foot = toWorld(s.cx, s.by - s.h * 0.12); spots.push({ p: s.foot, rx: (s.rect[2] - s.rect[0]) * 0.62 / PPU, rz: (s.rect[2] - s.rect[0]) * 0.42 / PPU, a: 0.42 }); } else s.foot = toWorld(s.cx, s.by - s.h * 0.1); });
      props.forEach(function (m) { m.p = toWorld(m.px, m.py); m.p.y -= 0.1; spots.push({ p: new V3(m.p.x + 0.5 * m.s, 0, m.p.z + 0.25), rx: 2.2 * m.s, rz: 1.6 * m.s, a: 0.4 }); });
      // trees, bushes, rocks and flowers: only where nothing of the DOM stands and the trail does not pass. Fewer on a small island
      var area = 4 * A * B, placed = [];
      function scatter(count, rad, tall, kind, edge) { var made = 0; tries = 0; while (made < count && tries++ < 400) { var x = (R0() * 2 - 1) * A, z = (R0() * 2 - 1) * B; if (isleR(x, z) > edge) continue; var p = new V3(x, hgt(x, z), z), r = propRect(p, rad, tall), j, bad = false;
          if (!freePx(r, tall > 1 ? 6 : 3) || nearTrail(r, 13 * S + 3)) continue;
          for (j = 0; j < placed.length && !bad; j++) if (Math.hypot(placed[j].x - x, (placed[j].z - z) * SP) < placed[j].r + rad) bad = true; if (bad) continue;
          placed.push({ x: x, z: z, r: rad }); props.push({ k: kind, p: p, s: 0, r: r, n: made++ }); } }
      scatter(Math.max(2, Math.min(12, Math.round(area / 55))), 0.85, 2.4, 'tree', 0.82);
      scatter(Math.max(2, Math.min(12, Math.round(area / 50))), 0.5, 0.6, 'bush', 0.86);
      scatter(Math.max(1, Math.min(8, Math.round(area / 80))), 0.5, 0.5, 'rock', 0.86);
      scatter(Math.max(2, Math.min(14, Math.round(area / 40))), 0.3, 0.7, 'tulip', 0.86);
      scatter(Math.max(4, Math.min(20, Math.round(area / 20))), 0.2, 0.25, 'flower', 0.87);
      // the boat: in the corner of the sea beside the far end of the island, when that corner is sea
      ship = null; [[0.06, 0.03], [0.94, 0.03], [0.05, 0.1], [0.95, 0.1]].some(function (c) { var px = c[0] * W, py = c[1] * H + 14, x = (px - ICX) / PPU, z = ((py - ICY) / PPU + WATER * CP) / SP, r = [px - 26, py - 40, px + 26, py + 8]; if (isleR(x, z) < 1.1 || !freePx(r, 2)) return false; ship = { p: new V3(x, WATER, z), r: r }; return true; });
    }
    // what overlaps what (the overlap test): a house or a landmark against the card, the picture, the badge, the companion of ANOTHER stop and the parents' button; scenery against all of them
    function check() { var out = [], names = ['pic', 'card', 'troll', 'hero', 'badge'];
      function ov(a, b) { var x = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), y = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return x > 3 && y > 3 ? Math.round(x) + 'x' + Math.round(y) : ''; }
      stops.forEach(function (s) { if (s.rect[0] < -MX - 1 || s.rect[2] > W + MX + 1 || s.rect[1] < -MT) out.push('stop' + s.i + ' out of the picture');
        stops.forEach(function (t) { if (t === s || !s.kind) return; /* a stop without a model is its flat picture, in the DOM, where the flat map has it */ [t.rect, t.card, t.bud, t.hero, t.bdg].forEach(function (q, n) { var v = q && ov(s.rect, q); if (v) out.push('stop' + s.i + ' x ' + names[n] + t.i + ' ' + v); }); });
        if (s.card && s.bdg && s.kind) { var d = s.card[1] - s.rect[3]; if (d < -12) out.push('stop' + s.i + ' under its own card ' + Math.round(-d)); } });
      avoid.forEach(function (a) { if (a.s || a.prop) return; stops.forEach(function (s) { var v = ov(s.rect, a.r); if (v) out.push('stop' + s.i + ' x parents ' + v); }); });
      props.forEach(function (p, n) { if (p.k === 'flower') return; avoid.forEach(function (a) { if (a.prop || a.model && !a.s.kind) return; var v = ov(p.r, a.r); if (v) out.push(p.k + n + ' x ' + (a.s ? 'stop' + a.s.i : 'parents') + ' ' + v); }); });
      if (ship) avoid.forEach(function (a) { var v = ov(ship.r, a.r); if (v) out.push('boat x ' + (a.s ? 'stop' + a.s.i : 'other') + ' ' + v); });
      return out; }

    // -- the ground: grass, sand, the soft shadows under things, the trail with its dots: one canvas laid over the terrain --
    function paintGround() {
      var c = gCtx, Wc = gCan.width, Hc = gCan.height, i, R1 = rnd(3), g, GX = A * 1.2, GZ = B * 1.2;
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = PAL.sand; c.fillRect(0, 0, Wc, Hc);
      c.setTransform(Wc / (2 * GX), 0, 0, Hc / (2 * GZ), Wc / 2, Hc / 2);                                    // from here on: world units (x to the right, z towards the child)
      function ring(f) { c.beginPath(); ringPts(f, 140).forEach(function (p, k) { k ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z); }); c.closePath(); }
      ring(1.03); c.fillStyle = PAL.sand2; c.fill(); ring(0.975); c.fillStyle = PAL.sand; c.fill();
      g = c.createLinearGradient(-GX * 0.7, -GZ * 0.8, GX * 0.5, GZ * 0.8); g.addColorStop(0, PAL.g0); g.addColorStop(0.4, PAL.g1); g.addColorStop(1, PAL.g2);
      ring(0.9); c.fillStyle = g; c.fill(); c.lineWidth = 0.16; c.strokeStyle = 'rgba(255,255,200,.38)'; ring(0.875); c.stroke();
      c.save(); ring(0.9); c.clip();
      var np = Math.min(160, Math.round(A * B * 0.9)); for (i = 0; i < np; i++) { var x = (R1() * 2 - 1) * GX, z = (R1() * 2 - 1) * GZ, rad = 0.5 + R1() * 1.1; g = c.createRadialGradient(x, z, 0, x, z, rad); g.addColorStop(0, i % 2 ? 'rgba(255,255,160,.16)' : 'rgba(20,130,60,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, z, rad, 0, 7); c.fill(); }
      function soft(x, z, rx, rz, rgb, a, mid) { c.save(); c.translate(x, z); c.scale(rx, rz); var gg = c.createRadialGradient(0, 0, 0, 0, 0, 1); gg.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gg.addColorStop(mid || 0.55, 'rgba(' + rgb + ',' + (a * 0.55).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
      c.restore();
      // the trail (a point of the screen is a point of the ground, so the painted trail lies under the same points as the dashed path of the flat map)
      var tw = trailPx.map(function (p) { return toWorld(p[0], p[1]); });
      if (tw.length > 1) { c.lineCap = c.lineJoin = 'round'; c.beginPath(); tw.forEach(function (p, k) { k ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z); });
        c.strokeStyle = PAL.bed; c.lineWidth = 22 * S / PPU; c.stroke(); c.strokeStyle = PAL.path; c.lineWidth = 17 * S / PPU; c.stroke(); }
      c.save(); ring(0.9); c.clip();
      stops.forEach(function (s) { var rr = (s.rect[2] - s.rect[0]) * 0.56 / PPU; c.beginPath(); c.ellipse(s.foot.x, s.foot.z, rr, rr * 0.82, 0, 0, 7); c.fillStyle = PAL.pad; c.fill(); c.lineWidth = 0.13; c.strokeStyle = PAL.bed; c.stroke(); });   // the yard of every stop
      if (recStop) soft(recStop.foot.x, recStop.foot.z, (recStop.rect[2] - recStop.rect[0]) * 1.15 / PPU, (recStop.rect[2] - recStop.rect[0]) * 0.9 / PPU, '255,226,90', 0.95, 0.5);   // the glow of the recommended stop
      spots.forEach(function (s) { soft(s.p.x + 0.15, s.p.z + 0.15, s.rx, s.rz, PAL.blob, s.a); });
      c.restore();
      dots.forEach(function (d) { var q = toWorld(d[0], d[1]); c.beginPath(); c.arc(q.x, q.z, 3.75 * S / PPU, 0, 7); c.fillStyle = d[2] ? '#ff8a3d' : '#ffffff'; c.fill(); });
      gTex.needsUpdate = true; dirty = true;
    }
    function disposeWorld(keepGeoms) { petsDrop(); trollDrop(); if (world) { scene.remove(world); world.traverse(function (x) { if (x.isMesh) x.geometry.dispose(); if (x.isSprite && x !== halo) x.material.dispose(); }); world = null; fogs = []; }
      if (!keepGeoms) { Object.keys(geoms).forEach(function (k) { geoms[k].dispose(); }); geoms = {}; } }
    function buildWorld() {
      var t0 = performance.now(), i, j; disposeWorld(true);
      world = new THREE.Group(); fx = new THREE.Group(); scene.add(world); world.add(fx); verts = 0;
      // the terrain: rings from the middle out to under the water, smooth normals
      var RINGS = 30, SEG = 120, FMAX = 1 + Math.min(0.17, 0.5 * FADE / Math.max(A, B)), P = [0, hgt(0, 0), 0], idx = [];
      for (j = 1; j <= RINGS; j++) { var f = FMAX * (1 - Math.pow(1 - j / RINGS, 1.5)); ringPts(f, SEG).forEach(function (p) { P.push(p.x, hgt(p.x, p.z), p.z); }); }
      for (i = 0; i < SEG; i++) idx.push(0, 1 + i, 1 + (i + 1) % SEG);
      for (j = 0; j < RINGS - 1; j++) for (i = 0; i < SEG; i++) { var a = 1 + j * SEG + i, b = 1 + j * SEG + (i + 1) % SEG, c2 = a + SEG, d = b + SEG; idx.push(a, c2, b, b, c2, d); }
      var tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); tg.setIndex(idx); tg.computeVertexNormals();
      if (tg.attributes.normal.array[1] < 0) { tg.index.array.reverse(); tg.computeVertexNormals(); }
      var GX = A * 1.2, GZ = B * 1.2, uv = []; for (i = 0; i < P.length; i += 3) uv.push((P[i] + GX) / (2 * GX), 1 - (P[i + 2] + GZ) / (2 * GZ)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      var gw = pow2(2 * GX * PPU * 1.5, LAND ? 2048 : 1024), gh = pow2(2 * GZ * PPU * SP * 1.6, 2048); if (gCan.width !== gw || gCan.height !== gh) { gCan.width = gw; gCan.height = gh; gTex.dispose(); }
      terrain = new THREE.Mesh(tg, groundMat); terrain.receiveShadow = true; world.add(terrain);
      // the houses and landmarks that have a model; a stop whose picture has no model keeps its picture in the DOM, standing on the same ground
      stops.forEach(function (s) { s.m = null; if (!s.kind) return;
        var m = new THREE.Mesh(s.geom, toyMat); m.scale.setScalar(s.sc); m.position.copy(s.pos); m.castShadow = m.receiveShadow = true; m.userData.sc = s.sc; world.add(m); s.m = m; });
      stops.forEach(function (s) { if (!s.lock || !s.kind) return; var wd = (s.rect[2] - s.rect[0]) / PPU;                                              // a sleeping stop: pale, with mist round its feet
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, depthWrite: false, opacity: 0.8, color: SKY === 'night' ? '#aab6ee' : '#ffffff' })); sp.position.set(s.foot.x, s.foot.y + 0.25, s.foot.z + 0.5); sp.scale.set(wd * 1.5, wd * 0.46, 1); sp.userData.x = sp.position.x; sp.userData.ph = s.i; sp.renderOrder = 6; fx.add(sp); fogs.push(sp); });
      // scenery: all of it baked into one mesh
      var sa = new Toy.Acc(), sb = new Toy.Acc(), R2 = rnd(5);                                                // sb: the small things (tulips, flowers) do not go into the shadow map
      props.forEach(function (p) { var q = p.p, s; sa.y0 = sb.y0 = q.y;
        if (p.k === 'mountain') Toy.mountain(sa, q.x, q.y, q.z, p.s);
        else if (p.k === 'tree') { s = 0.74 + R2() * 0.22; [Toy.tree, Toy.pine, Toy.tree, Toy.palm][p.n % 4](sa, q.x, q.y - 0.03, q.z, s, R2() * 6); spots.push({ p: q, rx: 0.85 * s, rz: 0.6 * s, a: 0.36 }); }
        else if (p.k === 'bush') { Toy.bush(sa, q.x, q.z, 0.8 + R2() * 0.3, q.y - 0.03); spots.push({ p: q, rx: 0.5, rz: 0.36, a: 0.3 }); }
        else if (p.k === 'rock') { Toy.rock(sa, q.x, q.y - 0.04, q.z, 0.6 + R2() * 0.25, R2() * 6); spots.push({ p: q, rx: 0.55, rz: 0.4, a: 0.32 }); }
        else if (p.k === 'tulip') { Toy.tulip(sb, q.x, q.y - 0.02, q.z, 0.95 + R2() * 0.3); spots.push({ p: q, rx: 0.26, rz: 0.19, a: 0.3 }); }
        else Toy.flower(sb, q.x, q.y - 0.02, q.z, 0.9 + R2() * 0.4, ['#ffffff', '#ffd23f', '#ff7ab8', '#b99cff'][p.n % 4]); });
      if (sa.p.length) { var pm = new THREE.Mesh(sa.geom(), toyMat); pm.castShadow = pm.receiveShadow = true; world.add(pm); }
      if (sb.p.length) { var pm2 = new THREE.Mesh(sb.geom(), toyMat); pm2.receiveShadow = true; world.add(pm2); }
      if (ship) { var ba = new Toy.Acc(); Toy.boat(ba); var sm = new THREE.Mesh(ba.geom(), toyMat); sm.scale.setScalar(LAND ? 0.9 : 0.62); sm.rotation.y = 0.3; sm.userData.p = ship.p; sm.position.copy(ship.p); fx.add(sm); ship.m = sm; }
      // the halo and the sparkles of the recommended stop
      if (recStop && recStop.kind) { var hw = (recStop.rect[2] - recStop.rect[0]) / PPU; halo.position.set(recStop.foot.x, recStop.foot.y + hw * 0.5, recStop.foot.z - 0.4); halo.scale.set(hw * 2.2, hw * 1.9, 1); fx.add(halo); sparks.position.copy(recStop.foot); sparks.scale.setScalar(hw / 2.6); fx.add(sparks); }
      // the camera looks at the middle of the canvas; the sun and its shadow map cover the island (one map, drawn once: nothing that casts a shadow moves)
      var ccx = W / 2, ccy = (H + MB - MT) / 2, tx = (ccx - ICX) / PPU, tz = (ccy - ICY) / (PPU * SP), D = 300;
      cam.left = -CW / 2 / PPU; cam.right = CW / 2 / PPU; cam.top = CH / 2 / PPU; cam.bottom = -CH / 2 / PPU; cam.near = 1; cam.far = 2 * D;
      cam.position.set(tx, D * SP, tz + D * CP); cam.lookAt(tx, 0, tz); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      var ext = Math.max(A, B) + 3, sc2 = sun.shadow.camera; sun.target.position.set(0, 0, 0); sun.position.set(-11, 17, 9).multiplyScalar(Math.max(1, ext / 14)); sc2.left = -ext; sc2.right = ext; sc2.top = ext; sc2.bottom = -ext; sc2.near = 1; sc2.far = 60 * Math.max(1, ext / 14); sc2.updateProjectionMatrix(); sun.target.updateMatrixWorld();
      water.scale.set(A * 1.5 + 6, 1, B * 1.5 + 6); water.material.uniforms.uIsle.value.set(A, B); water.material.uniforms.uE.value = E; water.material.uniforms.uFade.value = FADE;
      world.traverse(function (x) { if (x.geometry && x.geometry.attributes.position) verts += x.geometry.attributes.position.count; });
      paintGround(); applyTier(); petsMake(); trollMake();
      st.buildMs = Math.round(performance.now() - t0);
    }

    // -- quality --
    function restPR() { var dpr = Math.min(window.devicePixelRatio || 1, 2), cap = Math.min(dpr, TIER >= 1 ? 1.5 : 2), pr = TIER === 3 ? Math.max(0.6, cap * 0.66) : cap;
      pr = Math.min(pr, Math.sqrt(3.2e6 / (CW * CH)), 4096 / Math.max(CW, CH)); return Math.max(0.5, Math.round(pr * 100) / 100); }                    // a tall map that scrolls: never more than about three million pixels
    function applyTier() { if (!R) return; var sh = TIER < 2 && Math.max(A, B) < 34; if (sun.castShadow !== sh) sun.castShadow = sh; R.shadowMap.needsUpdate = true; dirty = true; }
    function setTier(t) { TIER = t; if (t >= 5) { saveQ(5); fail('slow'); return; } applyTier(); if (pets.length && !petsOk()) petsDrop(); if (troll && !trollOk()) trollDrop(); }
    function startProbe() { probe = { d: [], sum: 0, skip: 3 }; kick(); }                  // the first frames compile shaders and fill textures: they are not counted, and the middle value is taken, not the mean
    function endProbe(ms) { var prev = probeLog[probeLog.length - 1]; probeLog.push({ q: TIER, ms: +ms.toFixed(1) }); probe = null;
      if (TIER <= 3) { if (ms <= 28) { saveQ(TIER); return; }                                                                                              // keeps up: stay
        if (TIER > 0 && prev && prev.q === TIER - 1 && ms > prev.ms * 0.9 && ms < 45) { setTier(TIER - 1); saveQ(TIER); return; }                           // the step down bought nothing: the display itself is slow (a 30 Hz mode): go back
        setTier(ms > 110 ? 4 : TIER === 0 && (window.devicePixelRatio || 1) <= 1.5 ? 2 : TIER + 1); startProbe(); return; }
      if (TIER === 4 && ms > 125) { setTier(5); return; }                                                                                                    // even one frame takes too long: the flat map
      saveQ(TIER); }

    // -- drawing: only when something changed; the idle motion (water, tree tops, the glow) runs for a while after the last touch, at half rate --
    var rx = null;
    function kick() { if (!running && !document.hidden && !dead && R && world && !lost) { running = true; last = 0; raf = requestAnimationFrame(tick); } }
    function wake() { lastInput = performance.now(); kick(); }
    function ambient(now) { return !RM && TIER < 4 && now - lastInput < AMB_MS; }
    function draw() {
      var pr = restPR(); if (pr !== curPR) { curPR = pr; R.setPixelRatio(pr); R.setSize(CW, CH, false); canvas.style.cssText = 'left:' + -MX + 'px;top:' + -MT + 'px;width:' + CW + 'px;height:' + CH + 'px'; sparks.material.size = Math.max(5, 0.32 * PPU); }
      uTime.value = time; var still = RM || TIER >= 4, pu = still ? 0.5 : 0.5 + 0.5 * Math.sin(time * 2.6), i; halo.material.opacity = (SKY === 'night' ? 0.7 : 0.34) + pu * 0.18;
      var sb = sparks.geometry.userData.base, sa = sparks.geometry.attributes.position; for (i = 0; i < sa.count; i++) sa.array[i * 3 + 1] = 0.4 + ((sb[i * 3 + 1] + time * 0.45) % 2.2); sa.needsUpdate = true;
      for (i = 0; i < fogs.length; i++) fogs[i].position.x = fogs[i].userData.x + Math.sin(time * 0.35 + fogs[i].userData.ph) * 0.14;
      if (ship && ship.m) { ship.m.position.copy(ship.p); ship.m.position.y = WATER - 0.02 + Math.sin(time * 1.1) * 0.05; ship.m.rotation.z = Math.sin(time * 0.9) * 0.05; }
      if (recStop && recStop.kind) { var hm = recStop.m, b2 = still ? 1 : 1 + Math.sin(time * 2.6) * 0.012; if (hm) hm.scale.set(hm.userData.sc / b2, hm.userData.sc * b2, hm.userData.sc / b2); }
      if (rx) { var rk = (performance.now() - rx.t) / rx.d, rm = rx.s.m, rs = rm && rm.userData.sc, rb;                                  // task "mapwalk": the stop the companion has reached bounces once (squash, stretch, settle)
        if (!rm || rk >= 1) { if (rm && rx.s !== recStop) rm.scale.setScalar(rs); rx = null; } else { rb = 1 - Math.sin(rk * Math.PI * 2.5) * 0.11 * (1 - rk); rm.scale.set(rs * (1 + (1 - rb) * 0.6), rs * rb, rs * (1 + (1 - rb) * 0.6)); } }
      R.render(scene, cam); dirty = !!rx; st.frames++; st.calls = R.info.render.calls; st.tris = R.info.render.triangles;
      if (!shown) show();
    }
    function tick(now) {
      if (document.hidden || dead || lost || !world) { running = false; return; }             // a hidden tab draws nothing
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016, raw = last ? now - last : 16.7; last = now; frameNo++;
      var amb = ambient(now), pm = (pets.length > 0 && now - petT < 1500) || (!!troll && now - trollT < 1500);   // (the animals and the troll walk: every frame, and a second and a half after they stood still)
      if (!amb && !probe && !dirty && !pm) { running = false; return; }                      // nothing moves: nothing is drawn and the loop stops
      raf = requestAnimationFrame(tick);
      if (!probe && !dirty && !pm && (frameNo % 2)) return;                                    // only idle motion: every second frame is enough
      if (amb || probe) time += dt;
      if (pets.length && (amb || pm)) petsStep(pm ? dt : dt * 2, now);
      if (troll && (amb || pm)) trollStep(pm ? dt : dt * 2, now);
      draw();
      if (probe) { if (probe.skip > 0) probe.skip--; else if (raw < 1000) { probe.d.push(raw); probe.sum += raw; if ((probe.sum >= 1000 && probe.d.length >= 3) || probe.d.length >= 60) { probe.d.sort(function (x, y) { return x - y; }); endProbe(probe.d[probe.d.length >> 1]); } } }
    }
    // the swap: the first 3D frame is in the canvas; in the same task the flat pictures are hidden, so the browser shows the change as one frame
    function show() { shown = true; box.classList.add('m3on'); if (troll) box.classList.add('m3troll'); stops.forEach(function (s) { s.el.classList.toggle('m3k', !!s.kind); }); st.readyMs = Math.round(performance.now() - st.t0);
      if (o.q == null && !o.soft && st.buildMs > 4000) saveQ(5);   // a build this slow is not for this device: the next visits get the flat map (and one more try after three days)
      if (o.onReady) o.onReady(); if (AUTO && !probeLog.length && !probe) startProbe(); }
    function hide() { shown = false; box.classList.remove('m3on', 'm3troll'); }
    function fail(why) { if (dead) return; hide(); dispose(); if (o.onFlat) o.onFlat(why); }

    function rebuild() {
      if (dead) return; var k = read(); if (!stops.length || W < 60 || H < 60) return;
      if (k === sig && world) return; sig = k;
      planAll(); if (plan) { if (!shown) { shown = true; if (o.onReady) o.onReady(); } return; }
      if (lost) return;
      buildWorld(); curPR = 0;
      if (canvas.parentNode !== box) box.insertBefore(canvas, box.firstChild);
      draw(); kick();
    }
    function layout(its) { items = its; if (dead) return; if (!world && !layT) { rebuild(); return; } clearTimeout(layT); layT = setTimeout(function () { layT = 0; rebuild(); }, 60); }   // the game lays a map out several times in a row (fonts, a new size): one rebuild after the last of them
    function onVis() { if (!document.hidden) wake(); }
    function onTouch() { wake(); }
    function dispose(keep) {
      if (dead) return; dead = true; clearTimeout(layT); cancelAnimationFrame(raf); running = false; if (I === self) I = null;
      document.removeEventListener('visibilitychange', onVis); box.removeEventListener('pointerdown', onTouch); if (box.parentNode) box.parentNode.removeEventListener('scroll', onTouch);
      if (plan) return;
      // the screen that is left fades out for a third of a second: it keeps a copy of the last picture (a plain 2D canvas), and the graphics memory is given back at once
      if (keep && shown && R && !lost && canvas.parentNode === box) { try { R.render(scene, cam); var c = document.createElement('canvas'); c.className = 'm3c'; c.width = canvas.width; c.height = canvas.height; c.style.cssText = canvas.style.cssText; c.getContext('2d').drawImage(canvas, 0, 0); box.replaceChild(c, canvas); } catch (e) { hide(); } }
      else { hide(); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); }
      disposeWorld(); if (R) { if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } R.renderLists.dispose(); R.setSize(1, 1, false); curPR = 0; }
    }
    var self = { layout: layout, dispose: dispose, hide: hide, fail: fail, check: check, box: box,
      pets: function (list) { petList = list || []; if (world) petsMake(); },
      walker: function (px, py, sitting) { if ((!pets.length && !troll) || dead || lost) return;   // (px == null: the walk is over, the companion stands in its stop again)
        if (px == null) { ttg.x = tHome.x; ttg.z = tHome.z; ttg.on = false; } else { toWorld(px, py, pv); ttg.x = pv.x; ttg.z = pv.z; ttg.on = true; }
        ptg.x = ttg.x; ptg.z = ttg.z; ptg.sitting = !!sitting; petT = trollT = performance.now(); kick(); },
      trollPose: trollPose, troll: function () { return troll; },
      react: function (el, ms) { if (dead || !world || lost) return; stops.forEach(function (s) { if (s.el === el && s.m) { rx = { s: s, t: performance.now(), d: ms || 420 }; dirty = true; kick(); } }); },
      restored: function () { curPR = 0; gTex.needsUpdate = true; if (world) { R.shadowMap.needsUpdate = true; draw(); kick(); } else { sig = ''; rebuild(); } },
      stats: function () { var m = R ? R.info.memory : {}; return { q: TIER, pr: curPR, calls: st.calls || 0, tris: st.tris || 0, verts: verts, geometries: m.geometries || 0, textures: m.textures || 0, programs: R && R.info.programs ? R.info.programs.length : 0, buildMs: st.buildMs, readyMs: st.readyMs, frames: st.frames, stops: stops.length, models: stops.filter(function (s) { return s.kind; }).length, props: props.length, grow: G, shadow: !!(R && sun.castShadow), running: running, shown: shown, pets: pets.length, petTris: pets.reduce(function (n, p) { return n + p.tris; }, 0), troll: troll ? troll.tris : 0, probe: probeLog, lost: ctxLost, restored: ctxBack, sky: SKY, w: CW, h: CH }; } };
    Object.defineProperty(self, 'dead', { get: function () { return dead; } });
    I = self;
    document.addEventListener('visibilitychange', onVis); box.addEventListener('pointerdown', onTouch, { passive: true }); if (box.parentNode) box.parentNode.addEventListener('scroll', onTouch, { passive: true });
    return self;
  }
  // task "camp3d": the camp of the home screen is drawn by camp3d.js with the SAME canvas, renderer, lights and materials. It takes them here, and is the attached picture (I) while it is shown
  function shared(plan, forced) { if (!initShared(plan, forced)) return null;
    return { R: R, canvas: canvas, scene: scene, hemi: hemi, sun: sun, fireL: fireL, toyMat: toyMat, groundMat: groundMat, gCan: gCan, gCtx: gCtx, gTex: function (fresh) { if (fresh) gTex.dispose(); return gTex; }, water: water, uTime: uTime, uRim: uRim, PAL: PAL, SKY: SKY, WATER: WATER, savedQ: savedQ, saveQ: saveQ, rnd: rnd, canvasTex: canvasTex,
      own: function (inst) { if (I && I !== inst) I.dispose(); I = inst; }, free: function (inst) { if (I === inst) I = null; }, lost: function () { return lost; }, counts: function () { return [ctxLost, ctxBack]; } }; }
  return { attach: attach, shared: shared, current: function () { return I; }, models: function () { return Object.keys(Toy.MODEL); },
    lose: function () { var e = R && R.getContext().getExtension('WEBGL_lose_context'); if (e) e.loseContext(); return e; }, memory: function () { return R ? { geometries: R.info.memory.geometries, textures: R.info.memory.textures, programs: R.info.programs.length } : null; } };
})();
