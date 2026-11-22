// task "camp3d": the camp of the home screen as a real 3D place: an island in the sea with a tent that can be entered, a campfire that lights what is near it,
// a log to sit on, trees, bushes, flowers, rocks, a patch of sand, a pebble yard, a path to a signpost and a boat (the way to the maps). three.js r147 +
// toy3d.js + map3d.js (the SAME canvas, renderer, lights and materials as the maps: TrollMap3D.shared) + pets3d.js when it is there (the animals).
// Loaded lazily by the block "ui" of index.html (M3.camp) after the flat camp is on the screen and can be used.
//
// Who decides what: index.html owns the LAYOUT of the island (CAMP3: where the tent, the fire, every spot and every piece of scenery stand, in world units) and
// the CAMERA (campView: a fixed perspective camera, tilted, fitted to the room the camp has on this screen). This file only draws. The camera is a pinhole whose
// principal point is the home spot, so "a point of the ground -> a point of the screen" (V.p) and back (V.g) are four lines of arithmetic that the page and
// this file share: what the DOM shows and what the canvas shows always agree, with and without WebGL.
//
// THE ACTOR INTERFACE. Everything that lives on the island is an actor that reports where it is ON THE GROUND:
//     state()  ->  { x, z,            the ground point under its feet (world units)
//                    s,               its size against the size it has on the home spot (the camera makes far things smaller)
//                    hidden,          true while it is inside the tent
//                    sitting, moving, pose, heading }
// and is driven by three calls of the life engine (campLife in index.html):  moveTo(spot, ms, ease) · pose(mood, look, act) · hide(yes).
// Today the troll is the game's SVG drawing in the DOM (the adapter is in campLife: it moves by CSS, and state() reads the ground point under the drawing), so
// this file gives it a contact shadow, the light of the fire, and hides it behind what stands in front of it (the occlusion canvas below). The animals are
// real 3D actors (Pets.create: goTo / follow / sit / sleep / play) that follow state(). A 3D troll takes the place of the DOM one by offering the same four
// functions (o.troll = its state) and by setting o.dom = false: then no shadow blob, no occlusion canvas and no tint are made for it.
//
//   TrollCamp3D.attach(view, { V, L, q, auto, rm, soft, t0, troll, pets, skip, onReady, onFlat, onPet })  ->  instance | null (then the flat camp simply stays)
// Quality steps, the measuring of the first second and the saved step ('troll-m3q') are those of the maps. Drawing: every frame while something walks; the
// flicker of the fire alone is drawn 24 times a second, 10 times after a minute without a touch; nothing in a hidden tab, one still picture on step 4.
var TrollCamp3D = (function () {
  'use strict';
  var V3 = THREE.Vector3, TR = Toy.TR, PI = Math.PI, FIRE_I = { day: 0.55, dusk: 1.35, night: 2.1 }, GLOW = { day: 0.3, dusk: 0.55, night: 0.8 };
  var mats = null;
  function at(m, l) { return m.clone().multiply(l); }
  function shared2(sh) {                                  // made once for the session: the flames, the glow, the sparks, the soft shadow under the troll
    if (mats) return mats;
    var glow = sh.canvasTex(128, function (c, s) { var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,214,120,1)'); g.addColorStop(0.4, 'rgba(255,170,60,.6)'); g.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
    var dot = sh.canvasTex(32, function (c, s) { var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
    var blob = sh.canvasTex(64, function (c, s) { var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,.62)'); g.addColorStop(0.55, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
    mats = { glow: new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.4 }),
      fl: ['#ff5a2a', '#ffa21f', '#ffe45c'].map(function (c) { return new THREE.MeshBasicMaterial({ color: c }); }),
      spark: new THREE.PointsMaterial({ map: dot, color: '#ffd76a', size: 6, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      drop: new THREE.MeshBasicMaterial({ color: '#7fd4ff' }),
      blob: new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      flame: Toy.lathe([[0, 0], [0.3, 0.07], [0.37, 0.28], [0.26, 0.6], [0.11, 0.88], [0, 1.05]], 10), plane: new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2) };
    return mats;
  }

  // ---------- the models of the camp (rounded shapes into the accumulator, as every model of the maps) ----------
  function tent(a, m) {                                   // door towards +z; 3.0 wide, 2.8 high, 2.3 deep. Two slopes, a back wall, a floor, and a front wall that is only a frame: the door is a real opening
    var G = '#3ecf62', DK = '#167a36', LT = '#8ff0a4', w = 1.5, h = 2.8, d = 2.3, len = Math.hypot(w, h) + 0.1, ph = Math.atan2(h, w), NA = { noAO: 1 };
    [-1, 1].forEach(function (s) {
      a.add(Toy.rbox(len, 0.12, d, 0.05), at(m, TR(s * w / 2, h / 2, 0, 0, 1, 1, 1, 0, -s * ph)), G);
      a.add(new THREE.BoxGeometry(len - 0.2, 0.03, d - 0.12), at(m, TR(s * (w / 2 - 0.07), h / 2 - 0.05, 0, 0, 1, 1, 1, 0, -s * ph)), '#0f5a28', { noAO: 1, g: 0.3 });     // the lining: the inside of the tent is dark
      a.add(Toy.rbox(0.2, 0.05, d + 0.04, 0.02), at(m, TR(s * (w * 0.56 + 0.05), h * 0.44 + 0.04, 0, 0, 1, 1, 1, 0, -s * ph)), LT, NA);                                   // a light stripe on each slope
    });
    a.add(Toy.tri([[-1.42, 0], [-0.96, 0], [0, 2.14], [0.96, 0], [1.42, 0], [0, 2.7]], 0.1), at(m, TR(0, 0, d / 2 - 0.05)), '#31bd57');                                   // the frame of the door
    a.add(Toy.tri([[-1.4, 0], [1.4, 0], [0, 2.66]], 0.06), at(m, TR(0, 0, -d / 2 + 0.03)), DK, { g: 0.4 });
    a.add(new THREE.BoxGeometry(2.7, 0.05, d - 0.1), at(m, TR(0, 0.03, 0)), '#1f6b3a', { noAO: 1, g: 0.2 });
    a.add(Toy.rod(0.07, d + 0.25, 6), at(m, TR(0, h + 0.02, 0, 0, 1, 1, 1, PI / 2)), LT, NA);
    a.add(Toy.rod(0.03, 0.5, 5), at(m, TR(0, h + 0.3, d / 2 + 0.05)), '#c98a5a', NA); a.add(Toy.tri([[0, 0], [0.42, 0.13], [0, 0.26]], 0.03), at(m, TR(0.02, h + 0.3, d / 2 + 0.05)), '#ffd23f', NA);
  }
  function fireBase(a, x, z) {                            // a ring of stones and three logs that lean on each other
    var i; for (i = 0; i < 7; i++) { var an = i * 2 * PI / 7 + 0.3; a.add(Toy.smooth(new THREE.DodecahedronGeometry(0.17, 0), 20), TR(x + Math.cos(an) * 0.52, 0.09, z + Math.sin(an) * 0.44, an, 1, 0.8, 1), i % 2 ? '#b9bfd4' : '#cfd4e4'); }
    for (i = 0; i < 3; i++) a.add(Toy.rcyl(0.085, 0.72, 0.03, 8), TR(x + Math.sin(i * 2.094 + 0.5) * 0.3, 0.02, z + Math.cos(i * 2.094 + 0.5) * 0.26, i * 2.094 + 0.5, 1, 1, 1, -0.95), i ? '#8a5a3c' : '#a8694b');
  }
  function logSeat(a, x, z, ry) { var h = 2.0, c = Math.cos(ry), s = Math.sin(ry);
    a.add(Toy.rcyl(0.3, h, 0.07, 12), TR(x + h / 2 * c, 0.3, z - h / 2 * s, ry, 1, 1, 1, 0, PI / 2), '#b9805c');
    a.add(Toy.rcyl(0.21, h + 0.05, 0.03, 10), TR(x + (h + 0.05) / 2 * c, 0.3, z - (h + 0.05) / 2 * s, ry, 1, 1, 1, 0, PI / 2), '#f2cf9a', { noAO: 1 });
    a.add(Toy.rod(0.06, 0.26, 5), TR(x + 0.45 * c, 0.6, z - 0.45 * s, 0, 1, 1, 1, 0, 0.5), '#b9805c', { noAO: 1 }); }
  function geomOf(f) { var a = new Toy.Acc(); f(a); return a.geom(); }

  function attach(view, o) {
    o = o || {};
    var sh = TrollMap3D.shared(false, o.q != null || !!o.soft); if (!sh) return null;
    var R = sh.R, canvas = sh.canvas, scene = sh.scene, PAL = sh.PAL, SKY = sh.SKY, L = o.L, V = o.V, M = shared2(sh), A = L.A, B = L.B, E = L.E;
    var RM = !!o.rm, dead = false, shown = false, world = null, raf = 0, running = false, dirty = true, lastT = 0, lastDraw = 0, lastInput = performance.now(), busyT = performance.now() + 1200, time = 0, curPR = 0, verts = 0;
    var sv = sh.savedQ(), TIER = o.q != null ? Math.min(4, +o.q) : sv ? Math.max(0, Math.min(4, Date.now() - sv.t > 2592e5 ? sv.q - 1 : sv.q)) : 0;
    var AUTO = !!o.auto && o.q == null && !RM, probe = null, probeLog = [], st = { t0: o.t0 || performance.now(), buildMs: 0, readyMs: 0, frames: 0, occ: 0, cpu: 0, cpuN: 0 };
    var cam = new THREE.PerspectiveCamera(), fireL = null, glow = null, flames = [], sparks = null, SP = [], blob = null, flower = null, boat = null, terrain = null, occ = null, octx = null, occOn = false, hemi0 = sh.hemi.intensity;
    var clipP = new THREE.Plane(new V3(0, 0, 1), 0), clipOn = [clipP], clipOff = [], props = [], pgeo = {}, fxs = [], pets = [], hits = {}, ts = null, tg = { x: L.home[0], z: L.home[1], r: 0.8, y: 1.3, sitting: false }, perk = 0, flare = 0, petIdle = 0;
    var skip = o.skip || {}, rndm = sh.rnd(17);

    function isleR(x, z) { return Math.pow(Math.pow(Math.abs(x / A), E) + Math.pow(Math.abs(z / B), E), 1 / E); }
    function hgt(x, z) { var r = isleR(x, z), t = (r - 0.8) / 0.25; return t > 0 ? -0.85 * t * t : 0; }                    // a flat top to walk on, a rounded shore that dives under the water
    function ringPts(f, steps) { var a = []; for (var i = 0; i < steps; i++) { var t = i / steps * PI * 2, c = Math.cos(t), s = Math.sin(t), rho = f / Math.pow(Math.pow(Math.abs(c), E) + Math.pow(Math.abs(s), E), 1 / E); a.push([A * rho * c, B * rho * s]); } return a; }
    function tl(lx, lz) { var c = Math.cos(L.tent[2]) * L.tent[3], s = Math.sin(L.tent[2]) * L.tent[3]; return [L.tent[0] + lx * c + lz * s, L.tent[1] - lx * s + lz * c]; }

    // -- the camera: exactly the pinhole of campView (index.html) --
    function setCam() {
      var th = L.PITCH, n = 1, f = 90; cam.position.set(L.home[0], L.D * Math.sin(th), L.home[1] + L.D * Math.cos(th)); cam.rotation.set(-th, 0, 0); cam.updateMatrixWorld();
      cam.projectionMatrix.makePerspective(-V.hx * n / V.F, (V.W - V.hx) * n / V.F, V.hy * n / V.F, -(V.H - V.hy) * n / V.F, n, f); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      curPR = 0; dirty = true;
    }
    // -- the ground: grass, sand, the path, the yards of the spots, the soft shadows, the warm light under the fire: one canvas laid over the terrain --
    function paintGround() {
      var gCan = sh.gCan, c = sh.gCtx, GX = A * 1.25, GZ = B * 1.25, big = V.ppu0 > 62, gw = big ? 2048 : 1024, gh = big ? 1024 : 512, i, g, R1 = sh.rnd(3);
      if (gCan.width !== gw || gCan.height !== gh) { gCan.width = gw; gCan.height = gh; sh.gTex(true); }
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = PAL.sand; c.fillRect(0, 0, gw, gh); c.setTransform(gw / (2 * GX), 0, 0, gh / (2 * GZ), gw / 2, gh / 2);
      function ring(f) { c.beginPath(); ringPts(f, 120).forEach(function (p, k) { k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); }
      function soft(x, z, rx, rz, rgb, al, mid) { c.save(); c.translate(x, z); c.scale(rx, rz); var gg = c.createRadialGradient(0, 0, 0, 0, 0, 1); gg.addColorStop(0, 'rgba(' + rgb + ',' + al + ')'); gg.addColorStop(mid || 0.55, 'rgba(' + rgb + ',' + (al * 0.55).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, 1, 0, 7); c.fill(); c.restore(); }
      ring(1.03); c.fillStyle = PAL.sand2; c.fill(); ring(0.975); c.fillStyle = PAL.sand; c.fill();
      g = c.createLinearGradient(-GX * 0.7, -GZ * 0.8, GX * 0.5, GZ * 0.8); g.addColorStop(0, PAL.g0); g.addColorStop(0.4, PAL.g1); g.addColorStop(1, PAL.g2);
      ring(0.9); c.fillStyle = g; c.fill(); c.lineWidth = 0.12; c.strokeStyle = 'rgba(255,255,200,.38)'; ring(0.875); c.stroke();
      c.save(); ring(0.9); c.clip();
      for (i = 0; i < 46; i++) { var x = (R1() * 2 - 1) * GX, z = (R1() * 2 - 1) * GZ, rad = 0.4 + R1() * 0.8; g = c.createRadialGradient(x, z, 0, x, z, rad); g.addColorStop(0, i % 2 ? 'rgba(255,255,160,.16)' : 'rgba(20,130,60,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, z, rad, 0, 7); c.fill(); }
      // the path from the middle of the camp to the far shore, where the signpost and the boat are: the way to the maps
      var P = L.path, len = 0, k, d; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(P[0][0], P[0][1]);
      for (k = 1; k < P.length - 1; k++) c.quadraticCurveTo(P[k][0], P[k][1], (P[k][0] + P[k + 1][0]) / 2, (P[k][1] + P[k + 1][1]) / 2); c.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
      c.strokeStyle = PAL.bed; c.lineWidth = 0.56; c.stroke(); c.strokeStyle = PAL.path; c.lineWidth = 0.43; c.stroke();
      c.fillStyle = '#ffffff'; for (k = 1; k < P.length; k++) { len = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); for (d = 0.2; d < len; d += 0.42) { c.beginPath(); c.arc(P[k - 1][0] + (P[k][0] - P[k - 1][0]) * d / len, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * d / len, 0.075, 0, 7); c.fill(); } }
      // the patch of sand for drawing, the yard of the pebbles, the trodden ground before the tent and round the fire
      function yard(q, rx, rz, fill) { c.beginPath(); c.ellipse(q[0], q[1], rx, rz, 0, 0, 7); c.fillStyle = fill; c.fill(); c.lineWidth = 0.07; c.strokeStyle = PAL.bed; c.stroke(); }
      yard(L.sandAt, 1.0, 0.5, PAL.sand); yard(L.pebAt, 0.95, 0.45, PAL.pad); yard(tl(0, 1.7), 0.75, 0.45, PAL.pad); yard(L.fire, 1.0, 0.8, PAL.pad);
      soft(L.fire[0], L.fire[1], 0.75, 0.6, '70,40,20', 0.5);
      soft(L.fire[0], L.fire[1], 3.3, 2.7, '255,170,70', SKY === 'night' ? 0.5 : SKY === 'dusk' ? 0.34 : 0.14, 0.4);
      // the soft shadows
      var tc = tl(0, 0); soft(tc[0] + 0.2, tc[1] + 0.2, 2.1 * L.tent[3], 1.6 * L.tent[3], PAL.blob, 0.42);
      soft(L.log[0] + 0.1, L.log[1] + 0.12, 1.25, 0.5, PAL.blob, 0.36);
      L.scn.forEach(function (s, n) { if (skip[n]) return; var r = { tree: 0.85, pine: 0.75, palm: 0.6, bush: 0.5, rock: 0.5, sign: 0.4, tulip: 0.24, flower: 0 }[s[0]] * (s[3] || 1); if (r) soft(s[1] + 0.13, s[2] + 0.13, r, r * 0.7, PAL.blob, 0.36); });
      soft(L.flower[0] + 0.05, L.flower[1] + 0.05, 0.26, 0.19, PAL.blob, 0.3);
      c.restore(); sh.gTex().needsUpdate = true; dirty = true;
    }
    function build() {
      var t0 = performance.now(), i, j;
      world = new THREE.Group(); scene.add(world);
      // the terrain
      var RINGS = 20, SEG = 84, FMAX = 1.12, P = [0, 0, 0], idx = [];
      for (j = 1; j <= RINGS; j++) { var f = FMAX * (1 - Math.pow(1 - j / RINGS, 1.6)); ringPts(f, SEG).forEach(function (p) { P.push(p[0], hgt(p[0], p[1]), p[1]); }); }
      for (i = 0; i < SEG; i++) idx.push(0, 1 + i, 1 + (i + 1) % SEG);
      for (j = 0; j < RINGS - 1; j++) for (i = 0; i < SEG; i++) { var a0 = 1 + j * SEG + i, b0 = 1 + j * SEG + (i + 1) % SEG, c0 = a0 + SEG, d0 = b0 + SEG; idx.push(a0, c0, b0, b0, c0, d0); }
      var tg0 = new THREE.BufferGeometry(); tg0.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); tg0.setIndex(idx); tg0.computeVertexNormals();
      if (tg0.attributes.normal.array[1] < 0) { tg0.index.array.reverse(); tg0.computeVertexNormals(); }
      var GX = A * 1.25, GZ = B * 1.25, uv = []; for (i = 0; i < P.length; i += 3) uv.push((P[i] + GX) / (2 * GX), 1 - (P[i + 2] + GZ) / (2 * GZ)); tg0.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      terrain = new THREE.Mesh(tg0, sh.groundMat); terrain.receiveShadow = true; world.add(terrain);
      // everything that stands: one mesh that casts shadows (the tent, the fire place, the log, trees, bushes, rocks, the signpost), one of small things that do not
      var sa = new Toy.Acc(), sb = new Toy.Acc(), R2 = sh.rnd(5);
      tent(sa, TR(L.tent[0], 0, L.tent[1], L.tent[2], L.tent[3])); fireBase(sa, L.fire[0], L.fire[1]); logSeat(sa, L.log[0], L.log[1], L.log[2]);
      L.scn.forEach(function (s, n) { if (skip[n]) return; var k = s[0], x = s[1], z = s[2], sc = s[3] || 1;
        if (k === 'tree') Toy.tree(sa, x, -0.03, z, sc, R2() * 6); else if (k === 'pine') Toy.pine(sa, x, -0.03, z, sc, R2() * 6); else if (k === 'palm') Toy.palm(sa, x, -0.03, z, sc, 0.4);
        else if (k === 'bush') Toy.bush(sa, x, z, sc, -0.03); else if (k === 'rock') Toy.rock(sa, x, -0.04, z, sc, R2() * 6);
        else if (k === 'tulip') Toy.tulip(sb, x, -0.02, z, sc); else if (k === 'flower') Toy.flower(sb, x, -0.02, z, 1.05 * sc, ['#ffffff', '#ffd23f', '#ff7ab8', '#b99cff'][n % 4]);
        else if (k === 'sign') { var sg = new Toy.Acc(); Toy.BUILD.sign(sg, PAL); var sm = new THREE.Mesh(sg.geom(), sh.toyMat); sm.position.set(x, 0, z); sm.scale.setScalar(sc); sm.rotation.y = 0.25; sm.castShadow = true; world.add(sm); } });
      var m1 = new THREE.Mesh(sa.geom(), sh.toyMat); m1.castShadow = m1.receiveShadow = true; world.add(m1);
      var m2 = new THREE.Mesh(sb.geom(), sh.toyMat); m2.receiveShadow = true; world.add(m2);
      // the flower that the troll waters: it droops until then
      flower = new THREE.Mesh(geomOf(function (a) { Toy.tulip(a, 0, 0, 0, 1.25); }), sh.toyMat); flower.position.set(L.flower[0], -0.02, L.flower[1]); world.add(flower);
      // the boat at the end of the path
      if (L.boat && !skip.boat) { boat = new THREE.Mesh(geomOf(function (a) { Toy.boat(a); }), sh.toyMat); boat.scale.setScalar(0.62); boat.rotation.y = 0.5; boat.position.set(L.boat[0], sh.WATER, L.boat[1]); world.add(boat); }
      // the fire: three flames, a glow, sparks, and a warm light that falls on everything near it
      M.fl.forEach(function (mt, k) { var fm = new THREE.Mesh(M.flame, mt); fm.position.set(L.fire[0], 0.12 + k * 0.03, L.fire[1]); fm.userData.s = [1, 0.7, 0.42][k]; fm.userData.ph = k * 2.1; world.add(fm); flames.push(fm); });
      glow = new THREE.Sprite(M.glow); glow.position.set(L.fire[0], 0.7, L.fire[1] + 0.2); glow.renderOrder = 5; world.add(glow);
      fireL = new THREE.PointLight('#ffa448', FIRE_I[SKY], 11, 1.5); fireL.position.set(L.fire[0], 0.95, L.fire[1] + 0.1); scene.add(fireL);
      if (SKY === 'night') sh.hemi.intensity = hemi0 * 0.7;
      var sp = new Float32Array(24 * 3), sgm = new THREE.BufferGeometry(); sgm.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sparks = new THREE.Points(sgm, M.spark); sparks.frustumCulled = false; sparks.renderOrder = 6; world.add(sparks);
      for (i = 0; i < 24; i++) { SP.push({ life: 0, x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0 }); sp[i * 3 + 1] = -9; }
      // the shadow under the DOM troll
      if (o.dom !== false) { blob = new THREE.Mesh(M.plane, M.blob); M.blob.color.set('rgb(' + PAL.blob + ')'); blob.renderOrder = 1; blob.position.y = 0.02; world.add(blob); }
      // the sea round the island, the sun and its one shadow map
      sh.water.scale.set(A * 1.5 + 6, 1, B * 1.5 + 6); sh.water.material.uniforms.uIsle.value.set(A, B); sh.water.material.uniforms.uE.value = E; sh.water.material.uniforms.uFade.value = L.fade || 1.1;
      var ext = Math.max(A, B) + 2.5, sc2 = sh.sun.shadow.camera; sh.sun.target.position.set(0, 0, 0); sh.sun.position.set(-11, 17, 9); sc2.left = -ext; sc2.right = ext; sc2.top = ext; sc2.bottom = -ext; sc2.near = 1; sc2.far = 60; sc2.updateProjectionMatrix(); sh.sun.target.updateMatrixWorld();
      world.traverse(function (x) { if (x.geometry && x.geometry.attributes.position) verts += x.geometry.attributes.position.count; });
      paintGround(); applyTier(); petsMake();
      st.buildMs = Math.round(performance.now() - t0);
    }

    // -- the things an activity lays on the ground (pebbles, the book, the flag, the lines in the sand, the watering can): each a small mesh that pops in --
    function pg(kind) {
      if (pgeo[kind]) return pgeo[kind];
      var f = { pebble: function (a) { a.add(Toy.smooth(new THREE.DodecahedronGeometry(0.17, 0), 20), TR(0, 0.1, 0, 0, 1, 0.75, 0.9), '#cfd4e4'); },
        book: function (a) { Toy.BUILD.book(a, PAL); },
        flag: function (a) { a.add(Toy.rcyl(0.05, 1.7, 0.03, 8), null, '#f2b27c'); a.add(Toy.sph(0.08, 8, 6), TR(0, 1.74, 0), '#ffd23f', { noAO: 1 }); a.add(Toy.tri([[0, 0], [0.8, 0.26], [0, 0.52]], 0.04), TR(0.04, 1.12, 0), '#f5423c', { noAO: 1 }); },
        line: function (a) { a.add(new THREE.BoxGeometry(1, 0.035, 0.085), TR(0.5, 0.02, 0), '#a9792f', { noAO: 1, g: 0 }); },
        can: function (a) { a.add(Toy.rcyl(0.24, 0.4, 0.06, 12), null, '#4aa8ff', { noAO: 1 }); a.add(Toy.rod(0.05, 0.42, 6), TR(0.36, 0.3, 0, 0, 1, 1, 1, 0, -0.9), '#2f8fe6', { noAO: 1 }); a.add(Toy.sph(0.09, 8, 6), TR(0.56, 0.44, 0, 0, 1, 0.6, 1), '#2f8fe6', { noAO: 1 });
          a.add(new THREE.TorusGeometry(0.17, 0.035, 6, 12, PI), TR(-0.22, 0.22, 0, 0, 1, 1, 1, 0, PI / 2), '#2f8fe6', { noAO: 1 }); },
        drops: function (a) { for (var i = 0; i < 3; i++) a.add(Toy.sph(0.045, 6, 5), TR(0.02 * i, -0.2 * i, 0.03 * (i - 1), 0, 1, 1.4, 1), '#7fd4ff', { noAO: 1, g: 0 }); } }[kind];
      return pgeo[kind] = geomOf(f);
    }
    function prop(kind, x, z, opt) {
      if (dead || !world) return null; opt = opt || {};
      var m, h;
      if (kind === 'shape') { m = new THREE.Group(); var pts = opt.pts || [[-0.55, 0.3], [0, -0.3], [0.55, 0.3]]; pts.forEach(function (p, i) { var q = pts[(i + 1) % pts.length], ln = new THREE.Mesh(pg('line'), sh.toyMat); ln.position.set(p[0], 0, p[1]); ln.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]); ln.userData.len = Math.hypot(q[0] - p[0], q[1] - p[1]); ln.scale.set(0.001, 1, 1); ln.visible = false; m.add(ln); }); }
      else if (kind === 'can') { m = new THREE.Group(); var cn = new THREE.Mesh(pg('can'), sh.toyMat), dr = new THREE.Mesh(pg('drops'), M.drop); cn.position.y = 0.75; dr.position.set(0.62, 1.0, 0); m.add(cn); m.add(dr); m.userData.can = cn; m.userData.dr = dr; }
      else { m = new THREE.Mesh(pg(kind), sh.toyMat); if (kind === 'pebble') { m.rotation.y = rndm() * 6; opt.s = (opt.s || 1) * (0.85 + rndm() * 0.35); } }
      m.position.set(x, 0, z); if (opt.ry) m.rotation.y = opt.ry; h = { m: m, kind: kind, t0: performance.now(), s: opt.s || 1, out: 0, seg: function (i) { var ln = m.children[i]; if (ln) { ln.visible = true; ln.userData.t0 = performance.now(); busy(1400); } } };
      if (kind === 'book') h.s *= 0.36;
      m.scale.setScalar(0.001); world.add(m); props.push(h); busy(600); return h;
    }
    function clearProps(now) { props.forEach(function (h) { if (now) world.remove(h.m); else h.out = performance.now(); }); if (now) props = []; busy(500); }
    // -- one-shot effects: sparks from the fire (the troll pokes it), the flower perks up --
    function emit(x, y, z, n, up, spread) { var k = 0; SP.forEach(function (p) { if (k >= n || p.life > 0) return; k++; p.life = 0.7 + rndm() * 0.9; p.x = x + (rndm() - 0.5) * 0.3; p.y = y; p.z = z + (rndm() - 0.5) * 0.3; p.vx = (rndm() - 0.5) * spread; p.vz = (rndm() - 0.5) * spread; p.vy = up * (0.6 + rndm() * 0.7); }); }
    function fx(name) { if (dead || !world) return;
      if (name === 'sparks') { emit(L.fire[0], 0.7, L.fire[1], 12, 2.2, 1.6); flare = 1; }
      else if (name === 'perk') { perk = Math.max(perk, 0.001); fxs.push({ k: 'perk', t0: performance.now() }); }
      else if (name === 'petplay') pets.forEach(function (p, i) { p.wake(); p.play(i ? 'spin' : 'signature'); });
      busy(2600); }

    // -- the animals: real actors that follow the troll, sit when it sits, wait before the tent when it is inside, sleep there at night, and answer a tap --
    function petsMake() {
      pets.forEach(function (p) { p.dispose(); }); pets = []; Object.keys(hits).forEach(function (k) { if (/^pet/.test(k)) { hits[k].remove(); delete hits[k]; } });
      if (!window.Pets || TIER >= 4 || RM || !o.pets || !o.pets.length || !world) return;
      try { var lk = Pets.look(); lk.set(PAL); var av = [[L.fire[0], L.fire[1], 1.0], [L.tent[0], L.tent[1], 1.7 * L.tent[3]]]; L.scn.forEach(function (s, n) { if (!skip[n] && /tree|pine|palm|sign/.test(s[0])) av.push([s[1], s[2], 0.5]); });
        o.pets.slice(0, 2).forEach(function (d, i) { var p = Pets.create(d.kind, { variant: d.variant || 0, scale: 0.5, look: lk, avoid: av }), at0 = L.pets[i];
          if (p.blob) p.blob.material.color.set('rgb(' + PAL.blob + ')'); p.place(at0[0], at0[1], i ? 0.5 : -0.4); p.follow(tg); p.userData = { i: i, mode: 'follow', next: 6 + i * 4 }; world.add(p.root); pets.push(p);
          var hEl = document.createElement('span'); hEl.className = 'c3hit c3ph'; hEl.setAttribute('aria-hidden', 'true'); hEl.addEventListener('click', function () { petTap(i); }); view.appendChild(hEl); hits['pet' + i] = hEl; });
      } catch (e) { pets.forEach(function (p) { try { p.dispose(); } catch (e2) {} }); pets = []; }
    }
    function petTap(i) { var p = pets[i]; if (!p) return; wake(); if (p.sleeping) { p.wake(); p.userData.mode = ''; } p.play(p.S.act ? 'jump' : ['happy', 'jump', 'spin'][(p.userData.n = (p.userData.n || 0) + 1) % 3]); busy(2400); if (o.onPet) o.onPet(i); }
    function petsStep(dt, now) {
      if (!pets.length) return false; var mov = false, night = SKY === 'night';
      pets.forEach(function (p, i) { var u = p.userData, want = ts && ts.hidden ? (night ? 'sleep' : 'wait') : 'follow';
        if (want !== u.mode) { u.mode = want; var q = want === 'sleep' ? L.petSleep[i] : L.petWait[i];
          if (want === 'follow') p.follow(tg); else p.goTo(q[0], q[1], { face: 0.3 - i * 0.7, done: function () { if (u.mode === 'sleep') p.sleep(); else if (u.mode === 'wait') p.sit(); } }); }
        if (want === 'follow' && !p.moving && !p.S.act && !tg.sitting && !(ts && ts.moving)) { u.next -= dt; if (u.next < 0) { u.next = 9 + rndm() * 9; p.play(['signature', 'happy', 'sleepy'][Math.floor(rndm() * 3)]); } }
        p.update(dt); if (p.moving || p.S.act) mov = true;
        var hEl = hits['pet' + i], q2 = V.p(p.x, 0.55, p.z), sz = Math.max(48, Math.round(1.5 * q2[2])); if (hEl && (mov || !hEl.style.width)) hEl.style.cssText = 'left:' + Math.round(V.left + q2[0] - sz / 2) + 'px;top:' + Math.round(V.top + q2[1] - sz / 2) + 'px;width:' + sz + 'px;height:' + sz + 'px'; });
      return mov;
    }

    // -- quality (the steps and the measuring of the maps) --
    function restPR() { var dpr = Math.min(window.devicePixelRatio || 1, 2), cap = Math.min(dpr, TIER >= 1 ? 1.5 : 2), pr = TIER === 3 ? Math.max(0.6, cap * 0.66) : cap; return Math.max(0.5, Math.round(Math.min(pr, Math.sqrt(3.2e6 / (V.W * V.H))) * 100) / 100); }
    function applyTier() { var s = TIER < 2; if (sh.sun.castShadow !== s) sh.sun.castShadow = s; R.shadowMap.needsUpdate = true; dirty = true; }
    function setTier(t) { TIER = t; if (t >= 5) { sh.saveQ(5); fail('slow'); return; } applyTier(); if (t >= 4 && pets.length) { petsMake(); if (o.onReady) o.onReady(self); } }   // (a still picture has no animals: the page is told, and shows the flat picture of the pet again)
    function startProbe() { probe = { d: [], sum: 0, skip: 3 }; kick(); }
    function endProbe(ms) { var prev = probeLog[probeLog.length - 1]; probeLog.push({ q: TIER, ms: +ms.toFixed(1) }); probe = null;
      if (TIER <= 3) { if (ms <= 28) { sh.saveQ(TIER); return; }
        if (TIER > 0 && prev && prev.q === TIER - 1 && ms > prev.ms * 0.9 && ms < 45) { setTier(TIER - 1); sh.saveQ(TIER); return; }
        setTier(ms > 110 ? 4 : TIER === 0 && (window.devicePixelRatio || 1) <= 1.5 ? 2 : TIER + 1); startProbe(); return; }
      if (TIER === 4 && ms > 125) { setTier(5); return; }
      sh.saveQ(TIER); }

    // -- the troll behind things. The troll is DOM and lies over the canvas, so the scene cannot hide it. When something stands between it and the camera, only what
    // is nearer than the troll is drawn once more, just in the troll's rectangle, and copied to a small canvas that lies OVER the troll (the technique of the map lab).
    // That is also how it goes into the tent: the frame of the door and the slopes are nearer than a troll that stands inside. Most frames draw nothing here.
    function occlude() {
      if (!ts || ts.hidden || o.dom === false || !occ) { if (occOn) { occ.style.display = 'none'; occOn = false; } return; }
      var q = V.p(ts.x, 0, ts.z), ppu = q[2], hw = L.TH * 0.44 * ppu, x0 = q[0] - hw, x1 = q[0] + hw, y1 = q[1] + 5, y0 = q[1] - L.TH * 1.12 * ppu, need = false, zc = ts.z + 0.3, i, b;
      for (i = 0; i < obst.length && !need; i++) { b = obst[i]; if (b[1] + b[2] * 0.6 < zc) continue; var p = V.p(b[0], 0, b[1]), rr = b[2] * p[2]; if (p[0] + rr > x0 && p[0] - rr < x1 && p[1] - b[3] * p[2] < y1 && p[1] + rr * 0.5 > y0) need = true; }
      for (i = 0; i < pets.length && !need; i++) { b = pets[i]; if (b.z < zc) continue; var pp = V.p(b.x, 0, b.z); if (pp[0] + 0.8 * pp[2] > x0 && pp[0] - 0.8 * pp[2] < x1 && pp[1] - 1.4 * pp[2] < y1 && pp[1] > y0) need = true; }
      for (i = 0; i < props.length && !need; i++) { b = props[i].m.position; if (b.z < zc) continue; var pq = V.p(b.x, 0, b.z); if (pq[0] + 0.6 * pq[2] > x0 && pq[0] - 0.6 * pq[2] < x1 && pq[1] - 1.8 * pq[2] < y1 && pq[1] > y0) need = true; }
      if (!need) { if (occOn) { occ.style.display = 'none'; occOn = false; } return; }
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(V.W, Math.ceil(x1)); y1 = Math.min(V.H, Math.ceil(y1)); var w = x1 - x0, h = y1 - y0; if (w < 4 || h < 4) return;
      var hid = [terrain, sh.water, blob, glow, sparks].filter(function (m) { return m && m.visible; }); hid.forEach(function (m) { m.visible = false; });
      clipP.constant = -zc; R.clippingPlanes = clipOn; R.setScissor(x0, V.H - y1, w, h); R.setScissorTest(true); R.render(scene, cam);
      var pr = curPR, pw = Math.round(w * pr), ph = Math.round(h * pr); if (occ.width !== pw || occ.height !== ph) { occ.width = pw; occ.height = ph; } else octx.clearRect(0, 0, pw, ph);
      octx.drawImage(canvas, Math.round(x0 * pr), Math.round(y0 * pr), pw, ph, 0, 0, pw, ph);
      occ.style.cssText = 'display:block;left:' + (V.left + x0) + 'px;top:' + (V.top + y0) + 'px;width:' + w + 'px;height:' + h + 'px'; occOn = true; st.occ++;
      R.setScissorTest(false); R.clippingPlanes = clipOff; hid.forEach(function (m) { m.visible = true; });
    }
    var obst = [];                                        // what can stand in front of the troll: [x, z, radius, height]
    function obstMake() { var t = tl(0, 0); obst = [[t[0], t[1], 1.9 * L.tent[3], 2.9 * L.tent[3]], [L.fire[0], L.fire[1], 0.6, 1.2], [L.log[0], L.log[1], 1.1, 0.6], [L.flower[0], L.flower[1], 0.25, 0.9]];
      L.scn.forEach(function (s, n) { if (skip[n] || s[0] === 'flower') return; var d = { tree: [0.95, 2.6], pine: [0.8, 2.3], palm: [0.9, 2.1], bush: [0.55, 0.6], rock: [0.5, 0.5], sign: [0.7, 1.6], tulip: [0.2, 0.75] }[s[0]]; obst.push([s[1], s[2], d[0] * (s[3] || 1), d[1] * (s[3] || 1)]); }); }

    // -- drawing --
    function busy(ms) { busyT = Math.max(busyT, performance.now() + (ms || 800)); dirty = true; kick(); }
    function kick() { if (!running && !document.hidden && !dead && world && !sh.lost()) { running = true; lastT = 0; raf = requestAnimationFrame(tick); } }
    function wake() { lastInput = performance.now(); kick(); }
    function step(dt, now) {
      var still = RM || TIER >= 4, i, moving = false;
      sh.uTime.value = time;
      ts = o.troll ? o.troll() : null;
      if (ts) { tg.x = ts.x; tg.z = ts.z; tg.sitting = !!ts.sitting; if (ts.moving) moving = true;
        if (blob) { blob.visible = !ts.hidden; var bs = L.TH * 0.66 * (ts.sitting ? 1.15 : 1); blob.position.set(ts.x + 0.06, 0.02, ts.z + 0.05); blob.scale.set(bs, 1, bs * 0.5); } }
      // the fire: the flames breathe, the light flickers, a few sparks rise (more at night, a burst when it is poked)
      var fk = still ? 0.5 : 0.5 + 0.28 * Math.sin(time * 9.1) + 0.16 * Math.sin(time * 23.7 + 1.3) + 0.1 * Math.sin(time * 4.3 + 0.5); flare = Math.max(0, flare - dt * 0.9);
      flames.forEach(function (f) { var u = f.userData, w = still ? 0 : Math.sin(time * 7.3 + u.ph), hh = 1 + (still ? 0 : 0.16 * Math.sin(time * 11.7 + u.ph * 1.7)) + flare * 0.45; f.scale.set(u.s * (1 - 0.06 * w), u.s * hh, u.s * (1 + 0.06 * w)); f.rotation.y = time * 1.3 + u.ph; f.rotation.z = still ? 0 : 0.07 * w; });
      fireL.intensity = FIRE_I[SKY] * (0.86 + 0.28 * fk + flare * 0.7); M.glow.opacity = GLOW[SKY] * (0.8 + 0.4 * fk) + flare * 0.25; var gs = 2.5 + 0.35 * fk + flare; glow.scale.set(gs, gs, 1);
      if (!still && rndm() < dt * (SKY === 'day' ? 1.6 : 3.2)) emit(L.fire[0], 0.75, L.fire[1], 1, 0.9, 0.5);
      var sa = sparks.geometry.attributes.position.array; for (i = 0; i < SP.length; i++) { var p = SP[i]; if (p.life > 0) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= dt * 0.5; if (p.life <= 0) p.y = -9; moving = moving || p.vy > 1.2; } sa[i * 3] = p.x; sa[i * 3 + 1] = p.y; sa[i * 3 + 2] = p.z; } sparks.geometry.attributes.position.needsUpdate = true;
      if (boat) { boat.position.y = sh.WATER - 0.02 + (still ? 0 : Math.sin(time * 1.1) * 0.05); boat.rotation.z = still ? 0 : Math.sin(time * 0.9) * 0.05; }
      // the flower: droops (perk 0), stands up and grows when it is watered (perk 1)
      for (i = fxs.length - 1; i >= 0; i--) { var e = fxs[i], k = (now - e.t0) / 1300; if (e.k === 'perk') { perk = Math.max(perk, Math.min(1, k)); if (k > 0.5 && !e.done) { e.done = 1; emit(L.flower[0], 0.9, L.flower[1], 6, 1.0, 0.9); } } if (k >= 1) fxs.splice(i, 1); else moving = true; }
      var pe = perk * perk * (3 - 2 * perk); flower.rotation.z = -0.62 * (1 - pe); flower.scale.setScalar(0.72 + 0.4 * pe + (pe > 0 && pe < 1 ? 0.1 * Math.sin(pe * PI) : 0));
      // the things on the ground pop in and out
      for (i = props.length - 1; i >= 0; i--) { var h = props[i], a = Math.min(1, (now - h.t0) / 300), s = h.s * (a < 1 ? 1 + 0.7 * (a - 1) * (a - 1) * (a - 1) + 0.3 * Math.sin(a * PI) * 0.4 : 1);
        if (h.out) { var b = (now - h.out) / 260; if (b >= 1) { world.remove(h.m); props.splice(i, 1); continue; } s *= 1 - b; moving = true; } else if (a < 1) moving = true;
        h.m.scale.setScalar(Math.max(0.001, s));
        if (h.kind === 'shape') h.m.children.forEach(function (ln) { if (!ln.visible) return; var g = Math.min(1, (now - ln.userData.t0) / 1100); ln.scale.set(Math.max(0.001, ln.userData.len * g), 1, 1); if (g < 1) moving = true; });
        if (h.kind === 'can') { var tt = (now - h.t0) / 1000, tip = a >= 1 ? 0.55 + 0.12 * Math.sin(tt * 3) : 0; h.m.userData.can.rotation.z = -tip; h.m.userData.dr.visible = a >= 1; h.m.userData.dr.position.y = 0.95 - ((tt * 1.3) % 1) * 0.5; moving = true; } }
      if (petsStep(dt, now)) moving = true;
      if (moving) busyT = Math.max(busyT, now + 700);
    }
    function draw(now) {
      var pr = restPR(), t1 = performance.now(); if (pr !== curPR) { curPR = pr; R.setPixelRatio(pr); R.setSize(V.W, V.H, false); canvas.style.cssText = 'left:' + V.left + 'px;top:' + V.top + 'px;width:' + V.W + 'px;height:' + V.H + 'px'; M.spark.size = Math.max(3, 0.11 * V.ppu0) * pr; }
      occlude(); R.render(scene, cam); dirty = false; st.frames++; st.calls = R.info.render.calls; st.tris = R.info.render.triangles;
      st.cpu += performance.now() - t1; st.cpuN++;
      if (!shown) show();
    }
    function tick(now) {
      if (document.hidden || dead || sh.lost() || !world) { running = false; return; }
      var still = RM || TIER >= 4;
      if (still && !dirty && !probe) { running = false; return; }                             // a still picture: drawn only on change
      raf = requestAnimationFrame(tick);
      var raw = lastT ? now - lastT : 16.7, act = dirty || probe || now < busyT, gap = act ? 0 : now - lastInput > 60000 ? 100 : 41;   // the fire alone: 24 pictures a second, 10 after a minute without a touch
      if (!act && now - lastDraw < gap - 3) { lastT = now; return; }
      var dt = lastDraw ? Math.min(0.12, (now - lastDraw) / 1000) : 0.016; lastT = now; lastDraw = now; if (!still) time += dt;
      step(still ? 0 : dt, now); draw(now);
      if (probe) { if (probe.skip > 0) probe.skip--; else if (raw < 1000) { probe.d.push(raw); probe.sum += raw; if ((probe.sum >= 1000 && probe.d.length >= 3) || probe.d.length >= 60) { probe.d.sort(function (x, y) { return x - y; }); endProbe(probe.d[probe.d.length >> 1]); } } }
    }
    function show() { shown = true; st.readyMs = Math.round(performance.now() - st.t0); if (o.onReady) o.onReady(self); if (AUTO && !probeLog.length && !probe) startProbe(); }
    function hide() { shown = false; if (occ) occ.style.display = 'none'; if (o.onHide) o.onHide(); }
    function fail(why) { if (dead) return; hide(); dispose(); if (o.onFlat) o.onFlat(why); }
    function onVis() { if (!document.hidden) wake(); }
    function onTouch() { wake(); }
    function layout(v) { if (dead) return; V = v; if (!world) return; setCam(); Object.keys(hits).forEach(function (k) { if (hits[k].style) hits[k].style.width = ''; }); step(0, performance.now()); draw(); kick(); }
    function dispose(keep) {
      if (dead) return; dead = true; cancelAnimationFrame(raf); running = false; sh.free(self);
      document.removeEventListener('visibilitychange', onVis); document.removeEventListener('pointerdown', onTouch);
      if (occ && occ.parentNode) occ.parentNode.removeChild(occ);
      Object.keys(hits).forEach(function (k) { hits[k].remove(); }); hits = {};
      // the screen that is left fades out for a third of a second: it keeps a copy of the last picture (a plain 2D canvas), and the graphics memory is given back at once
      if (keep && shown && !sh.lost() && canvas.parentNode === view) { try { R.render(scene, cam); var c = document.createElement('canvas'); c.className = 'm3c'; c.width = canvas.width; c.height = canvas.height; c.style.cssText = canvas.style.cssText; c.getContext('2d').drawImage(canvas, 0, 0); view.replaceChild(c, canvas); } catch (e) { hide(); } }
      else { hide(); if (canvas.parentNode === view) view.removeChild(canvas); }
      pets.forEach(function (p) { try { p.dispose(); } catch (e) {} }); pets = [];
      if (world) { scene.remove(world); world.traverse(function (x) { if (x.isMesh && x.geometry !== M.flame && x.geometry !== M.plane || x.isPoints) x.geometry.dispose(); }); world = null; }
      Object.keys(pgeo).forEach(function (k) { pgeo[k].dispose(); }); pgeo = {}; props = [];
      if (fireL) { scene.remove(fireL); fireL.dispose(); } sh.hemi.intensity = hemi0; R.clippingPlanes = clipOff; R.setScissorTest(false);
      if (sh.sun.shadow.map) { sh.sun.shadow.map.dispose(); sh.sun.shadow.map = null; } R.renderLists.dispose(); R.setSize(1, 1, false);
    }
    var self = { view: view, box: view, layout: layout, dispose: dispose, hide: hide, fail: fail, prop: prop, clearProps: clearProps, fx: fx, wake: wake, busy: busy, petTap: petTap,
      restored: function () { curPR = 0; sh.gTex().needsUpdate = true; if (world) { R.shadowMap.needsUpdate = true; draw(); kick(); if (!shown) show(); else if (o.onReady) o.onReady(self); } },
      setPets: function (list) { o.pets = list; if (world) petsMake(); },
      pets: function () { return pets; },
      stats: function () { var m = R.info.memory; return { camp: 1, q: TIER, pr: curPR, calls: st.calls || 0, tris: st.tris || 0, verts: verts, geometries: m.geometries || 0, textures: m.textures || 0, programs: R.info.programs ? R.info.programs.length : 0, buildMs: st.buildMs, readyMs: st.readyMs, frames: st.frames, occ: st.occ, occOn: occOn, cpuMs: st.cpuN ? +(st.cpu / st.cpuN).toFixed(2) : 0, pets: pets.length, petTris: pets.reduce(function (n, p) { return n + p.tris; }, 0), props: props.length, shadow: !!sh.sun.castShadow, running: running, shown: shown, probe: probeLog, sky: SKY, w: V.W, h: V.H, K: V.K, lost: sh.counts()[0], restored: sh.counts()[1] }; } };
    Object.defineProperty(self, 'dead', { get: function () { return dead; } });
    sh.own(self);
    try {
      setCam(); obstMake(); build();
      if (o.dom !== false) { occ = document.createElement('canvas'); occ.className = 'c3occ'; occ.setAttribute('aria-hidden', 'true'); octx = occ.getContext('2d'); view.appendChild(occ); }
      canvas.className = 'm3c'; if (canvas.parentNode !== view) view.insertBefore(canvas, view.firstChild);
      document.addEventListener('visibilitychange', onVis); document.addEventListener('pointerdown', onTouch, { passive: true });
      // the first picture, with the shaders of the occlusion pass made ready too (so the first walk behind the tent does not stop for them)
      step(0, performance.now()); var pr0 = restPR(); curPR = pr0; R.setPixelRatio(pr0); R.setSize(V.W, V.H, false); canvas.style.cssText = 'left:' + V.left + 'px;top:' + V.top + 'px;width:' + V.W + 'px;height:' + V.H + 'px'; M.spark.size = Math.max(3, 0.11 * V.ppu0) * pr0;
      R.clippingPlanes = clipOn; clipP.constant = 99; R.setScissor(0, 0, 2, 2); R.setScissorTest(true); R.render(scene, cam); R.setScissorTest(false); R.clippingPlanes = clipOff;
      draw(); kick();
    } catch (e) { try { dispose(); } catch (e2) {} if (window.console) console.warn('camp3d', e); return null; }
    return self;
  }
  return { attach: attach };
})();
