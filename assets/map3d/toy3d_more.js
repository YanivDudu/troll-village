// More "toy island" landmarks, built in code with the helpers of toy3d.js. Include AFTER toy3d.js:  <script src="toy3d_more.js"></script>
// It only ADDS to the registry of toy3d.js: Toy.BUILD[kind](acc, pal) -> height, Toy.MODEL[picture] = kind, Toy.ART[kind] = picture.
// Toy.MORE lists every model of this file: { kind: { pic: <Fluent picture>, ship: true|false } }. Only ship:true is put into Toy.MODEL; the others stay flat pictures.
// Two overrides: crane and slide (the old builders are kept in Toy.BUILD_OLD for the gallery).
(function (T) {
  'use strict';
  if (!T || typeof THREE === 'undefined') return;
  var TR = T.TR, rbox = T.rbox, sph = T.sph, lathe = T.lathe, rcyl = T.rcyl, rod = T.rod, prism = T.prism, tri = T.tri, smooth = T.smooth, C = T.C, B = T.BUILD, PI = Math.PI, V3 = THREE.Vector3;
  var FLAT = { noAO: 1, g: 0.25 }, NA = { noAO: 1 }, LINE = { noAO: 1, g: 0 };

  // ---------- helpers (all return a geometry, or add to the accumulator through its own add) ----------
  function at(m, l) { return m ? (l ? m.clone().multiply(l) : m) : l; }                 // l first, then m
  var U3 = null;
  function rb(w, h, d, r) {                                // a rounded box, one facet per edge: 108 triangles (rbox of toy3d.js: 192)
    r = Math.min(r == null ? 0.06 : r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    var u = U3 || (U3 = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3)), U = u.attributes.position.array, UN = u.attributes.normal.array, n = U.length / 3, P = new Float32Array(U.length), N = new Float32Array(U.length), hv = [w / 2, h / 2, d / 2], v = [0, 0, 0], inn = [0, 0, 0], i, j;
    for (i = 0; i < n; i++) {
      for (j = 0; j < 3; j++) { var c = U[i * 3 + j], sg = c < 0 ? -1 : 1; v[j] = Math.abs(c) > 0.4 ? sg * hv[j] : sg * (hv[j] - r); inn[j] = Math.max(-(hv[j] - r), Math.min(hv[j] - r, v[j])); }
      var dx = v[0] - inn[0], dy = v[1] - inn[1], dz = v[2] - inn[2], L = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (L > 1e-6) { P[i * 3] = inn[0] + dx / L * r; P[i * 3 + 1] = inn[1] + dy / L * r; P[i * 3 + 2] = inn[2] + dz / L * r; N[i * 3] = dx / L; N[i * 3 + 1] = dy / L; N[i * 3 + 2] = dz / L; }
      else { P[i * 3] = v[0]; P[i * 3 + 1] = v[1]; P[i * 3 + 2] = v[2]; N[i * 3] = UN[i * 3]; N[i * 3 + 1] = UN[i * 3 + 1]; N[i * 3 + 2] = UN[i * 3 + 2]; } }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setIndex(u.index); return g; }
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }                       // 12 triangles, for tiny details
  function cyl(rt, rbm, h, seg, open) { var g = new THREE.CylinderGeometry(rt, rbm, h, seg || 10, 1, !!open); g.translate(0, h / 2, 0); return g; }      // plain, standing on y = 0
  var RX = TR(0, 0, 0, 0, 1, 1, 1, PI / 2);
  function disc(r, th, seg, b) { return rcyl(r, th, b == null ? 0.03 : b, seg || 16).applyMatrix4(RX); }      // a coin facing +z: z from 0 to th
  function coin(r, th, seg) { return cyl(r, r, th, seg || 16).applyMatrix4(RX); }                                          // the same, plain (sharp rim), far fewer triangles
  function torus(R, t, rs, ts, ang) { return new THREE.TorusGeometry(R, t, rs || 6, ts || 16, ang || PI * 2); }      // in the xy plane
  function tube(pts, r, seg, rs, closed) { var c = new THREE.CatmullRomCurve3(pts.map(function (p) { return new V3(p[0], p[1], p[2] || 0); }), !!closed, 'catmullrom', 0.5); return new THREE.TubeGeometry(c, seg || 12, r, rs || 6, !!closed); }
  function wedge(pts, seg, p0, pl) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(Math.max(0.0001, p[0]), p[1]); }), seg || 2, p0, pl); }
  function slab(shape, depth, bev, crease, cs) {           // a 2D outline in the xy plane with thickness, rounded edges, centred on z = 0
    if (Array.isArray(shape)) { var s = new THREE.Shape(); shape.forEach(function (p, i) { i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }); s.closePath(); shape = s; }
    bev = bev == null ? 0.04 : bev; var dd = Math.max(0.01, depth - bev * 2);
    var g = new THREE.ExtrudeGeometry(shape, { depth: dd, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: cs || 8 }); g.translate(0, 0, -dd / 2); return smooth(g, crease || 50); }
  function stroke(a, pts, r, col, m, rs, o) {             // a round line through points of the xy plane (letters, digits, legs): a thin cylinder per piece, a small ball per joint
    rs = rs || 5; o = o || LINE; for (var i = 0; i < pts.length; i++) { var x0 = pts[i][0], y0 = pts[i][1]; a.add(new THREE.SphereGeometry(r * 1.03, rs, 3), at(m, TR(x0, y0, 0)), col, o);
      if (i < pts.length - 1) { var dx = pts[i + 1][0] - x0, dy = pts[i + 1][1] - y0; a.add(new THREE.CylinderGeometry(r, r, Math.sqrt(dx * dx + dy * dy), rs, 1, true), at(m, TR(x0 + dx / 2, y0 + dy / 2, 0, 0, 1, 1, 1, 0, Math.atan2(-dx, dy))), col, o); } } }
  function mix(c0, c1) { var A = new THREE.Color(c0), Bc = new THREE.Color(c1), o = new THREE.Color(); return function (t) { return o.copy(A).lerp(Bc, Math.max(0, Math.min(1, t))); }; }
  function warp(g, fn) { var P = g.attributes.position, v = new V3(), i; for (i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); fn(v); P.setXYZ(i, v.x, v.y, v.z); } return smooth(g, 55); }
  function arcPts(cx, cy, R, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(t) * R, cy + Math.sin(t) * R]); } return o; }
  var INK = '#4a3560', GREY = '#d3cfe0', GREY2 = '#b3aec6', BLUE = '#3d8bff', GLASS = '#57c1ff';

  var M = {};      // kind -> { pic, f }

  // ---------- 1f5fc: the red and white lattice tower ----------
  M.tokyo = { pic: '1f5fc', f: function (a) { var R = '#ff4b2e', W = '#ffffff', i;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { a.add(tube([[s[0] * 0.88, 0, s[1] * 0.88], [s[0] * 0.55, 0.7, s[1] * 0.55], [s[0] * 0.3, 1.4, s[1] * 0.3], [s[0] * 0.15, 2.05, s[1] * 0.15]], 0.085, 6, 5), null, R); });
    for (i = 0; i < 4; i++) { var m = TR(0, 0, 0, i * PI / 2), mf = at(m, TR(0, 0, 0.52, 0, 1, 1, 1, -0.36, 0));
      a.add(torus(0.36, 0.055, 4, 8, PI), at(m, TR(0, 0.2, 0.7, 0, 1, 1.25, 1, -0.38)), R, NA);                                   // the arch between two legs
      stroke(a, [[-0.5, 0.82], [0.28, 1.36]], 0.04, R, mf, 4); stroke(a, [[0.5, 0.82], [-0.28, 1.36]], 0.04, R, mf, 4); }
    a.add(rb(1.22, 0.1, 1.22, 0.04), TR(0, 0.74, 0), R, NA);
    a.add(rb(0.84, 0.3, 0.84, 0.06), TR(0, 1.5, 0), '#e9e6f2', NA); a.add(rb(0.94, 0.09, 0.94, 0.04), TR(0, 1.69, 0), R, NA); a.add(box(0.62, 0.12, 0.62), TR(0, 1.33, 0), '#c9c5d6', NA);
    var y = 1.95, seg = [[0.2, 0.17, 0.3, R], [0.17, 0.15, 0.2, W], [0.15, 0.12, 0.3, R], [0.12, 0.1, 0.18, W], [0.1, 0.03, 0.42, R]];
    seg.forEach(function (s) { a.add(cyl(s[1], s[0], s[2], 8), TR(0, y, 0), s[3], NA); y += s[2]; });
    a.add(sph(0.045, 6, 4), TR(0, y, 0), R, NA); return 3.3; } };

  // ---------- 1f3e4: the post office (grey, orange roofs, a gold horn, a letter box) ----------
  M.post = { pic: '1f3e4', f: function (a) { var G = '#cfcbdc', O = '#ff7a3d', i, j;
    a.add(rb(2.5, 1.2, 1.05, 0.08), TR(0, 0.6, -0.12), G); a.add(rb(2.64, 0.15, 1.2, 0.06), TR(0, 1.25, -0.12), O, NA);
    a.add(rb(1.25, 2.1, 1.15, 0.08), TR(0, 1.05, 0.05), '#dedaea'); a.add(rb(1.4, 0.17, 1.3, 0.07), TR(0, 2.16, 0.05), O, NA);
    a.add(torus(0.21, 0.06, 6, 16), TR(-0.05, 1.7, 0.66), C.gold, FLAT); a.add(lathe([[0.03, 0], [0.05, 0.12], [0.16, 0.3], [0.2, 0.32]], 10), TR(0.14, 1.78, 0.66, 0, 1, 1, 1, 0, -0.9), C.gold, FLAT);
    for (i = -1; i <= 1; i += 2) { for (j = 0; j < 2; j++) a.add(box(0.3, 0.26, 0.06), TR(i * 0.3, 0.86 + j * 0.36, 0.63), GLASS, NA);
      a.add(box(0.26, 0.56, 0.06), TR(i * 0.95, 0.68, 0.41), GLASS, NA); }
    a.add(rb(0.4, 0.6, 0.08, 0.06), TR(0, 0.3, 0.635), INK);
    a.add(rb(0.3, 0.55, 0.28, 0.12), TR(-0.85, 0.275, 0.78), O); a.add(box(0.18, 0.04, 0.02), TR(-0.85, 0.42, 0.925), INK, NA); return 2.3; } };

  // ---------- 1f6a2: the ship (a red and white hull, white decks, on its own bit of water like the bridge) ----------
  M.ship = { pic: '1f6a2', f: function (a, pal) { var i;
    a.add(cyl(1, 1, 0.08, 24), TR(0, 0, 0.05, 0, 1.95, 1, 0.8), pal ? pal.w0 : '#27b4ea', { noAO: 1, g: 0.2 });
    var hull = function (v) { var t = Math.max(0, Math.min(1, (-0.35 - v.x) / 1.15)), e = t * t * (3 - 2 * t); v.z *= 1 - 0.9 * e; v.x -= e * Math.max(0, v.y - 0.1) * 0.45; if (v.x > 1.0) v.z *= 0.86; };
    a.add(warp(rbox(2.8, 0.42, 0.9, 0.14).applyMatrix4(TR(0, 0.27, 0)), hull), null, '#f0434b', NA);
    a.add(warp(rbox(3.0, 0.42, 1.0, 0.1).applyMatrix4(TR(0, 0.66, 0)), hull), null, '#ffffff', NA);
    a.add(rb(1.7, 0.4, 0.68, 0.1), TR(0.4, 1.03, 0), '#f4f2fa', NA); a.add(rb(1.0, 0.34, 0.56, 0.1), TR(0.62, 1.38, 0), '#ffffff', NA);
    a.add(box(0.62, 0.15, 0.6), TR(0.42, 1.4, 0), GLASS, NA); a.add(box(0.7, 0.15, 0.7), TR(-0.05, 1.05, 0), GLASS, NA);
    for (i = 0; i < 4; i++) a.add(coin(0.075, 0.05, 8), TR(0.0 + i * 0.36, 0.7, 0.47), GLASS, NA);
    a.add(cyl(0.15, 0.17, 0.42, 10), TR(0.85, 1.5, 0, 0, 1, 1, 1, 0, 0.2), '#ffffff', NA); a.add(cyl(0.16, 0.16, 0.14, 10), TR(0.77, 1.88, 0, 0, 1, 1, 1, 0, 0.2), INK, NA); return 2.0; } };

  // ---------- 1f3ef: the castle with the pink roofs ----------
  var ROOF = [[0, -0.03], [0.95, -0.03], [1.1, 0.04], [1.08, 0.13], [1.0, 0.07], [0.78, 0.08], [0.45, 0.2], [0.2, 0.3], [0, 0.3]];
  function roof4(a, w, d, h, y, col) { a.add(smooth(lathe(ROOF.map(function (p) { return [p[0] * 1.4142, p[1]]; }), 4).applyMatrix4(TR(0, 0, 0, PI / 4)), 40), TR(0, y, 0, 0, w / 2, h, d / 2), col, NA); }
  M.pagoda = { pic: '1f3ef', f: function (a) { var S = '#cfcbdc', P = '#ff4f8b', i;
    a.add(rb(1.8, 0.95, 1.25, 0.08), TR(0, 0.475, 0), S); roof4(a, 2.4, 1.75, 1.25, 0.95, P);
    a.add(rb(1.25, 0.66, 0.92, 0.07), TR(0, 1.55, 0), '#dedaea', NA); roof4(a, 1.8, 1.36, 1.15, 1.86, P);
    a.add(rb(0.82, 0.52, 0.66, 0.06), TR(0, 2.36, 0), '#e9e6f2', NA); roof4(a, 1.3, 1.06, 1.3, 2.6, P);
    a.add(prism(0.6, 0.36, 1.0, 0.04), TR(0, 2.86, 0), '#e62e72', NA); a.add(sph(0.08, 6, 4), TR(0, 3.24, 0), C.gold, NA);
    a.add(rb(0.42, 0.62, 0.08, 0.06), TR(0, 0.31, 0.6), INK); [-1, 1].forEach(function (s) { a.add(box(0.3, 0.26, 0.06), TR(s * 0.58, 0.52, 0.615), INK, NA); a.add(box(0.2, 0.22, 0.06), TR(s * 0.2, 2.34, 0.32), INK, NA); });
    for (i = -1; i <= 1; i++) a.add(box(0.2, 0.24, 0.06), TR(i * 0.38, 1.53, 0.45), INK, NA); return 3.25; } };

  // ---------- 1fa81: the kite (four colours, a tail with three bows) ----------
  M.kite = { pic: '1fa81', f: function (a) { var m = TR(-0.3, 1.85, 0, 0, 1, 1, 1, -0.22, 0.3), c = [0, 0.2];
    a.add(tri([[0, 1.05], [-0.72, 0.2], c], 0.1), m, '#ff4b4b', NA); a.add(tri([[0, 1.05], c, [0.72, 0.2]], 0.1), m, '#3ecf62', NA);
    a.add(tri([c, [0, -1.15], [0.72, 0.2]], 0.1), m, '#4fd4ff', NA); a.add(tri([[-0.72, 0.2], [0, -1.15], c], 0.1), m, '#ffd23f', NA);
    var tail = [[0.04, 0.72, 0.25], [0.5, 0.42, 0.3], [0.86, 0.72, 0.3], [1.12, 1.12, 0.3], [1.3, 0.7, 0.3], [1.12, 0.06, 0.3]];
    a.add(tube(tail, 0.035, 20, 5), null, '#ffffff', NA);
    [[0.86, 0.72, '#ffd23f'], [1.25, 0.86, '#4aa8ff'], [1.22, 0.4, '#ff4fa3']].forEach(function (b, k) { [-1, 1].forEach(function (s) { a.add(lathe([[0, 0], [0.1, 0.16], [0.08, 0.2], [0, 0.19]], 6), TR(b[0], b[1], 0.3, 0, 1, 1, 0.6, 0, s * PI / 2 + k * 0.5), b[2], NA); }); a.add(sph(0.05, 6, 4), TR(b[0], b[1], 0.3), b[2], NA); });
    return 2.95; } };

  // ---------- 1f4da: three books ----------
  function bookUp(a, x, z, w, h, d, col, ry) { var m = TR(x, 0, z, ry || 0);
    a.add(rb(w, h, 0.07, 0.03), at(m, TR(0, h / 2, d / 2 - 0.035)), col); a.add(rb(w, h, 0.07, 0.03), at(m, TR(0, h / 2, -d / 2 + 0.035)), col); a.add(rb(0.08, h, d, 0.03), at(m, TR(-w / 2 + 0.04, h / 2, 0)), col);
    a.add(box(w - 0.1, h - 0.1, d - 0.12), at(m, TR(0.02, h / 2, 0)), '#fff8ea'); a.add(box(w * 0.5, 0.1, 0.02), at(m, TR(0.05, h * 0.72, d / 2 + 0.005)), '#ffffff', NA); }
  M.books = { pic: '1f4da', f: function (a) { bookUp(a, -0.62, -0.42, 1.25, 2.1, 0.42, '#3ecf62', 0.12); bookUp(a, 0.1, 0.02, 1.2, 1.8, 0.42, '#f0368a', -0.05); bookUp(a, 0.7, 0.48, 1.15, 1.5, 0.42, '#2f9bff', -0.2); return 2.15; } };

  // ---------- 1f4dc: the scroll ----------
  M.scroll = { pic: '1f4dc', f: function (a) { var m = TR(0, 0.05, 0, 0, 1, 1, 1, -0.16), P = '#ffdda6', P2 = '#f3b071', i;
    a.add(rb(1.6, 2.15, 0.1, 0.04), at(m, TR(0, 1.25, 0)), P, NA);
    a.add(rod(0.17, 1.55, 8), at(m, TR(-0.12, 2.32, 0.05, 0, 1, 1, 1, 0, PI / 2)), P, NA); a.add(sph(0.12, 8, 6), at(m, TR(-1.02, 2.32, 0.05, 0, 0.5, 1, 1)), P2, NA);
    a.add(rod(0.17, 1.55, 8), at(m, TR(0.12, 0.2, 0.1, 0, 1, 1, 1, 0, PI / 2)), P2, NA); a.add(sph(0.12, 8, 6), at(m, TR(1.02, 0.2, 0.1, 0, 0.5, 1, 1)), P, NA);
    for (i = 0; i < 4; i++) a.add(rb(i === 3 ? 0.62 : 1.05, 0.085, 0.05, 0.03), at(m, TR(i === 3 ? -0.21 : 0, 1.82 - i * 0.3, 0.06)), '#f08a3d', NA); return 2.5; } };

  // ---------- 1f331: the sprout ----------
  M.sprout = { pic: '1f331', f: function (a) { var G = '#9be83a';
    a.add(lathe([[0, 0.55], [0.35, 0.52], [0.7, 0.4], [0.95, 0.2], [1.02, 0.06], [0.98, 0], [0, 0]].reverse(), 18), null, '#8f5b4b');
    a.add(tube([[0, 0.45, 0], [0.06, 1.0, 0], [0.02, 1.6, 0], [-0.04, 2.0, 0]], 0.11, 8, 8), null, G, NA);
    a.add(sph(1, 14, 8), TR(-0.66, 2.2, 0.05, 0.1, 0.78, 0.15, 0.46, 0, -0.32), G, NA); a.add(sph(1, 14, 8), TR(0.62, 1.82, 0.05, -0.1, 0.72, 0.14, 0.42, 0, 0.28), '#8ade35', NA);
    a.add(sph(0.12, 8, 6), TR(-0.03, 2.0, 0), G, NA); return 2.5; } };

  // ---------- 1f570: the mantel clock ----------
  M.clock = { pic: '1f570', f: function (a) { var Bn = '#8a4f3d', i;
    a.add(rb(2.5, 0.16, 0.9, 0.06), TR(0, 0.08, 0), C.gold); a.add(rb(2.4, 0.22, 0.84, 0.08), TR(0, 0.26, 0), '#6e3b30', NA);
    a.add(slab([[-1.1, 0.36], [1.1, 0.36], [0.86, 0.75], [0.8, 1.4], [-0.8, 1.4], [-0.86, 0.75]], 0.66, 0.05), null, Bn, NA);
    a.add(disc(1.0, 0.66, 18, 0.06), TR(0, 1.42, -0.33), Bn, NA); a.add(coin(0.78, 0.08, 20), TR(0, 1.42, 0.3), '#fff8ea', FLAT);
    for (i = 0; i < 12; i++) { var an = i * PI / 6; a.add(box(0.06, i % 3 ? 0.1 : 0.17, 0.03), TR(Math.sin(an) * 0.62, 1.42 + Math.cos(an) * 0.62, 0.385, 0, 1, 1, 1, 0, -an), C.gold2, FLAT); }
    stroke(a, [[0, 1.42], [0, 1.88]], 0.035, INK, TR(0, 0, 0.4), 5); stroke(a, [[0, 1.42], [0.34, 1.42]], 0.045, INK, TR(0, 0, 0.4), 5); a.add(sph(0.08, 8, 6), TR(0, 1.42, 0.42), C.gold, NA); return 2.45; } };

  // ---------- 270f and 1f58d: the pencil and the crayon (leaning, the tip on the ground) ----------
  M.pencil = { pic: '270f', f: function (a) { var m = TR(-0.98, 0.04, 0, 0, 1, 1, 1, 0, -0.72);
    a.add(cyl(0.1, 0.01, 0.2, 6), m, INK, NA); a.add(cyl(0.27, 0.1, 0.42, 6), at(m, TR(0, 0.2, 0)), '#ffd9a8', NA);
    a.add(smooth(cyl(0.27, 0.27, 1.65, 6), 25), at(m, TR(0, 0.62, 0)), '#ff7a2e', NA); a.add(cyl(0.285, 0.285, 0.24, 10), at(m, TR(0, 2.27, 0)), '#e3d6ff', NA);
    a.add(rcyl(0.27, 0.42, 0.1, 10), at(m, TR(0, 2.51, 0)), '#ff4b3e', NA); return 2.35; } };
  M.crayon = { pic: '1f58d', f: function (a) { var m = TR(-0.98, 0.04, 0, 0, 1, 1, 1, 0, -0.72), Y = '#cdea35', D = '#4a3560';
    a.add(lathe([[0, 0], [0.05, 0.02], [0.17, 0.36], [0.2, 0.4], [0.24, 0.42], [0.24, 0.5]], 10), m, '#2fb85a', NA);
    a.add(cyl(0.27, 0.27, 2.2, 12), at(m, TR(0, 0.5, 0)), Y, NA); a.add(cyl(0.278, 0.278, 0.08, 12), at(m, TR(0, 0.72, 0)), D, NA); a.add(cyl(0.278, 0.278, 0.08, 12), at(m, TR(0, 2.36, 0)), D, NA);
    a.add(sph(1, 10, 6), at(m, TR(0, 1.56, 0.25, 0, 0.15, 0.42, 0.05)), D, NA); a.add(rcyl(0.24, 0.16, 0.06, 12), at(m, TR(0, 2.7, 0)), '#2fb85a', NA); return 2.35; } };

  // ---------- 1f4ac: the speech bubble ----------
  M.bubble = { pic: '1f4ac', f: function (a) { var f = mix('#cbb9f5', '#ffffff');
    a.add(sph(1, 20, 12), TR(0.05, 1.6, 0, 0, 1.3, 0.98, 0.62), function (k) { return f(k * 1.5); }, { noAO: 1, g: 0.3 });
    a.add(lathe([[0, 0], [0.1, 0.25], [0.34, 0.85], [0, 0.85]], 10), TR(-1.02, 0.12, 0.05, 0, 1, 1, 0.6, 0, -0.62), '#cbb9f5', NA);
    [-0.5, 0, 0.5].forEach(function (x) { a.add(sph(0.14, 10, 6), TR(0.05 + x, 1.6, 0.56, 0, 1, 1, 0.6), '#a58bff', NA); }); return 2.6; } };

  // ---------- 1f4d6: the open book ----------
  M.book = { pic: '1f4d6', f: function (a) { var m = TR(0, 0.04, -0.2, 0, 1, 1, 1, -0.5), i;
    a.add(rb(2.75, 1.9, 0.14, 0.06), at(m, TR(0, 0.95, 0)), '#2f9bff', NA);
    [-1, 1].forEach(function (s) { var pm = at(m, TR(s * 0.62, 0.99, 0.17, s * 0.13));
      a.add(rb(1.2, 1.56, 0.22, 0.07), pm, '#ffffff', NA); for (i = 0; i < 4; i++) a.add(box(0.8, 0.045, 0.02), at(pm, TR(0, 0.42 - i * 0.26, 0.115)), '#cfc8e6', FLAT); });
    a.add(rb(0.2, 0.3, 0.1, 0.05), at(m, TR(0, 0.02, 0.1)), '#1f7fe0', NA); return 1.8; } };

  // ---------- 1faa7: the sign on a post ----------
  M.sign = { pic: '1faa7', f: function (a) {
    a.add(rcyl(0.15, 2.5, 0.12, 10), null, '#f2b27c'); a.add(rb(2.0, 1.2, 0.18, 0.1), TR(0, 1.42, 0.14), '#e4e0ee', NA);
    [[1.0, 1.7], [0.6, 1.42], [0.8, 1.14]].forEach(function (l) { a.add(rb(l[0], 0.09, 0.06, 0.03), TR(0, l[1], 0.23), '#9c96ad', NA); }); return 2.5; } };

  // ---------- 1f4cf and 1f4d0: the ruler and the set square ----------
  M.ruler = { pic: '1f4cf', f: function (a) { var m = TR(0, 1.22, 0, 0, 1, 1, 1, -0.1, 0.82), i;
    a.add(rb(0.66, 3.0, 0.16, 0.06), m, GREY, NA); for (i = 0; i < 10; i++) a.add(box(i % 2 ? 0.16 : 0.26, 0.055, 0.03), at(m, TR(0.33 - (i % 2 ? 0.1 : 0.15), -1.2 + i * 0.267, 0.085)), '#8b5cf6', FLAT); return 2.45; } };
  M.square = { pic: '1f4d0', f: function (a) { var m = TR(-0.1, 0.06, 0, 0, 1, 1, 1, -0.1), s = new THREE.Shape(), h = new THREE.Path(), i;
    s.moveTo(-1.05, 0); s.lineTo(1.25, 0); s.lineTo(-1.05, 2.35); s.closePath(); h.moveTo(-0.62, 0.4); h.lineTo(-0.62, 1.3); h.lineTo(0.26, 0.4); h.closePath(); s.holes.push(h);
    a.add(slab(s, 0.16, 0.035), m, GREY, NA);
    var an = Math.atan2(-2.35, 2.3); for (i = 0; i < 8; i++) { var t = 0.12 + i * 0.105, x = -1.05 + 2.3 * t, y = 2.35 - 2.35 * t, L = i % 2 ? 0.12 : 0.2; a.add(box(0.05, L, 0.03), at(m, TR(x - Math.sin(-an) * (L / 2 + 0.03), y - Math.cos(an) * (L / 2 + 0.03), 0.085, 0, 1, 1, 1, 0, an)), '#8b5cf6', FLAT); }
    return 2.4; } };

  // ---------- 1f3a7: the headphones ----------
  M.phones = { pic: '1f3a7', f: function (a) {
    a.add(torus(0.98, 0.085, 6, 20, PI), TR(0, 1.02, 0, 0, 1, 1.12, 1.6), '#e4e0ee', NA); a.add(torus(0.98, 0.05, 5, 12, PI * 0.5), TR(0, 1.0, 0, 0, 0.93, 1.05, 2.4, 0, PI / 4), '#b3aec6', NA);
    [-1, 1].forEach(function (s) { var m = TR(s * 0.95, 0.68, 0.05, s * -0.5, 1, 1.3, 1, 0, s * -PI / 2);      // the axis of the cup points out and a little to the front
      a.add(rcyl(0.44, 0.3, 0.12, 10), m, '#f4f2fa'); a.add(rcyl(0.47, 0.17, 0.08, 10), at(m, TR(0, -0.15, 0)), '#aaa5bd'); a.add(cyl(0.2, 0.2, 0.05, 10), at(m, TR(0, 0.29, 0)), '#cfcbdc', NA); }); return 2.15; } };

  // ---------- 1f3aa: the circus tent ----------
  M.circus = { pic: '1f3aa', f: function (a) { var i, n = 12, st = PI * 2 / n, P = '#ff4f8b', P2 = '#e62e72', W = '#fff5f8';
    for (i = 0; i < n; i++) { a.add(wedge([[1.0, 0], [1.0, 0.85]], 2, i * st - st / 2, st), null, i % 2 ? W : P);
      a.add(wedge([[1.14, 0.8], [1.1, 0.9], [0.72, 1.22], [0.36, 1.62], [0.1, 1.98], [0, 2.0]], 2, i * st - st / 2, st), null, i % 2 ? P2 : W, NA);
      a.add(sph(0.15, 6, 4), TR(Math.sin(i * st) * 1.07, 0.8, Math.cos(i * st) * 1.07, 0, 1, 1.1, 1), i % 2 ? P : P2, NA); }
    a.add(rb(0.84, 0.95, 0.2, 0.4), TR(0, 0.44, 0.9), P2); a.add(rb(0.6, 0.78, 0.2, 0.29), TR(0, 0.36, 0.95), '#3a2a4d');
    a.add(cyl(0.03, 0.03, 0.6, 5), TR(0, 1.98, 0), C.gold, NA); a.add(tri([[0, 2.36], [0.42, 2.47], [0, 2.58]]), null, '#ff4b3e', NA); return 2.5; } };

  // ---------- 1f5fb: the snow mountain ----------
  M.fuji = { pic: '1f5fb', f: function (a) { var p = [], i, R = 1.75, r0 = 0.34, H = 2.0, cs = new THREE.Color('#ffffff'), cb = new THREE.Color('#6a5a86'), cd = new THREE.Color('#453a5e'), out = new THREE.Color();
    for (i = 0; i <= 12; i++) { var t = 1 - i / 12; t = t * t * 0.4 + t * 0.6; p.push([r0 + (R - r0) * t, H * Math.pow(1 - t, 1.7)]); } p.push([r0 * 0.7, H + 0.02], [0, H - 0.06]);
    a.add(lathe(p, 24), TR(0, -0.03, 0, 0.3, 1, 1, 0.72), function (k, x, y, z) { var w = 0.05 * Math.sin(Math.atan2(z, x) * 6); return out.copy(k > 0.6 + w ? cs : k < 0.14 ? cd : cb); }, { g: 0.6 }); return 2.0; } };

  // ---------- 1f9f1: the brick wall ----------
  M.bricks = { pic: '1f9f1', f: function (a) { var r, k, W = 2.3, rows = 4, hh = 0.5;
    a.add(box(W - 0.08, rows * hh - 0.14, 0.5), TR(0, rows * hh / 2 - 0.05, 0), '#f6dcc0');
    for (r = 0; r < rows; r++) { var odd = r % 2, ws = odd ? [0.56, 1.1, 0.56] : [1.11, 1.11], x = -W / 2;
      for (k = 0; k < ws.length; k++) { var w = ws[k]; a.add(rb(w - 0.07, hh - 0.08, 0.6, 0.06), TR(x + w / 2 + (k ? 0.04 * k : 0), r * hh + hh / 2, 0), (r + k) % 2 ? '#ff7a2e' : '#f4582c', r ? NA : null); x += w; } }
    return 2.0; } };

  // ---------- 1f4e6: the parcel ----------
  M.parcel = { pic: '1f4e6', f: function (a) { var m = TR(0, 0, 0, 0.62), K = '#dba56c', Tp = '#9c6a48';
    a.add(rb(1.7, 1.5, 1.7, 0.07), at(m, TR(0, 0.75, 0)), K); a.add(rb(0.36, 0.05, 1.72, 0.02), at(m, TR(0, 1.5, 0)), Tp, NA); a.add(rb(0.36, 0.5, 0.05, 0.02), at(m, TR(0, 1.27, 0.85)), Tp, NA); a.add(rb(0.36, 0.5, 0.05, 0.02), at(m, TR(0, 1.27, -0.85)), Tp, NA);
    a.add(box(0.02, 0.03, 1.66), at(m, TR(0, 1.53, 0)), '#7d5238', NA); a.add(rb(0.46, 0.3, 0.04, 0.02), at(m, TR(-0.42, 0.34, 0.86)), '#fff8ea', NA); a.add(box(0.3, 0.04, 0.02), at(m, TR(-0.42, 0.36, 0.885)), '#c9bfe6', NA); return 1.6; } };

  // ---------- 1f9e9: the puzzle piece ----------
  M.puzzle = { pic: '1f9e9', f: function (a) { var s = new THREE.Shape(), A = 0.72, r = 0.3, c = 0.18, n = Math.sqrt(r * r - c * c), a1 = Math.atan2(c, n), f = mix('#6fe487', '#dcee5a');
    s.moveTo(-A, -A); s.lineTo(-n, -A); s.absarc(0, -A + c, r, PI + a1, -a1, true); s.lineTo(A, -A);
    s.lineTo(A, -n); s.absarc(A + c, 0, r, -(PI / 2 + a1), PI / 2 + a1, false); s.lineTo(A, A);
    s.lineTo(n, A); s.absarc(0, A + c, r, -a1, PI + a1, false); s.lineTo(-A, A);
    s.lineTo(-A, n); s.absarc(-A + c, 0, r, PI / 2 + a1, -(PI / 2 + a1), true); s.closePath();
    a.add(slab(s, 0.4, 0.06, 50, 7), TR(-0.12, 1.2, 0, 0, 1.12, 1.12, 1, -0.08, 0.3), function (k, x, y) { return f((x + y - 0.2) / 2.2); }, NA); return 2.45; } };

  // ---------- 1f3b6: the notes ----------
  M.notes = { pic: '1f3b6', f: function (a) { var D = '#42305c', o = { noAO: 1, g: 0.5 };
    function head(x, y, s) { a.add(sph(0.33 * s, 12, 8), TR(x, y, 0, 0, 1.2, 0.86, 0.8, 0, 0.4), D, o); }
    head(-0.78, 0.34, 1); head(0.2, 0.62, 1); a.add(rb(0.11, 1.6, 0.14, 0.04), TR(-0.46, 1.2, 0), D, o); a.add(rb(0.11, 1.6, 0.14, 0.04), TR(0.52, 1.48, 0), D, o);
    a.add(slab([[-0.5, 1.72], [0.56, 2.0], [0.56, 2.3], [-0.5, 2.02]], 0.16, 0.03), null, D, o);
    head(1.0, 0.3, 0.78); a.add(rb(0.09, 1.25, 0.12, 0.04), TR(1.25, 0.98, 0), D, o); a.add(tube([[1.25, 1.58, 0], [1.42, 1.4, 0], [1.62, 1.25, 0], [1.6, 0.95, 0]], 0.06, 8, 5), null, D, o); return 2.3; } };

  // ---------- 1f524 and 1f522: the letters tile and the numbers tile ----------
  function tile(a, m) { a.add(rbox(2.3, 2.3, 0.5, 0.22, 6), at(m, TR(0, 1.15, 0)), BLUE); }
  M.abc = { pic: '1f524', f: function (a) { var m = TR(0, 0.02, 0, 0, 1, 1, 1, -0.12), W = '#ffffff', z = 0.27, R = 0.215, t = 0.075, y = 1.05;
    tile(a, m);
    a.add(torus(R, t, 6, 14), at(m, TR(-0.7, y, z)), W, FLAT); stroke(a, [[-0.46, y + 0.24], [-0.46, y - 0.24]], t, W, at(m, TR(0, 0, z)));
    stroke(a, [[-0.22, y + 0.62], [-0.22, y - 0.24]], t, W, at(m, TR(0, 0, z))); a.add(torus(R, t, 6, 14), at(m, TR(0.02, y, z)), W, FLAT);
    a.add(torus(R, t, 6, 12, PI * 1.5), at(m, TR(0.68, y, z, 0, 1, 1, 1, 0, PI / 4)), W, FLAT); [1, -1].forEach(function (s) { a.add(sph(t, 6, 4), at(m, TR(0.68 + R * 0.707, y + s * R * 0.707, z)), W, FLAT); }); return 2.3; } };
  var DIG = { 1: [[[-0.12, 0.2], [0.04, 0.32], [0.04, -0.32]]], 2: [arcPts(0, 0.14, 0.18, PI, -0.5, 5).concat([[-0.19, -0.32], [0.2, -0.32]])], 3: [arcPts(-0.01, 0.16, 0.16, 2.5, -1.5, 5), arcPts(-0.01, -0.15, 0.17, 1.5, -2.5, 5)], 4: [[[0.1, -0.32], [0.1, 0.32], [-0.2, -0.12], [0.24, -0.12]]],
    H: [[[-0.16, 0.32], [-0.16, -0.32]], [[0.16, 0.32], [0.16, -0.32]], [[-0.16, 0], [0.16, 0]]] };
  function digit(a, ch, x, y, s, r, col, m, rs) { DIG[ch].forEach(function (p) { stroke(a, p.map(function (q) { return [x + q[0] * s, y + q[1] * s]; }), r, col, m, rs || 5); }); }
  M.digits = { pic: '1f522', f: function (a) { var m = TR(0, 0.02, 0, 0, 1, 1, 1, -0.12), mz = at(m, TR(0, 0, 0.27)), W = '#ffffff';
    tile(a, m); digit(a, 1, -0.48, 1.66, 1.05, 0.07, W, mz); digit(a, 2, 0.48, 1.66, 1.05, 0.07, W, mz); digit(a, 3, -0.48, 0.66, 1.05, 0.07, W, mz); digit(a, 4, 0.46, 0.66, 1.05, 0.07, W, mz); return 2.3; } };

  // ---------- 1f355: the pizza slice ----------
  M.pizza = { pic: '1f355', f: function (a) { var m = TR(-1.0, 0.16, 0, 0, 1, 1, 1, -0.2, -0.96);
    a.add(slab([[0, 0], [0.84, 1.86], [-0.84, 1.86]], 0.2, 0.05), m, '#ffc83d', NA);
    a.add(tube([[-0.9, 1.84, 0], [-0.45, 1.98, 0], [0, 2.03, 0], [0.45, 1.98, 0], [0.9, 1.84, 0]], 0.19, 8, 8), m, '#f6b77a', NA); [-1, 1].forEach(function (s) { a.add(sph(0.19, 8, 6), at(m, TR(s * 0.9, 1.84, 0)), '#f6b77a', NA); });
    [[-0.3, 1.45, 0.2], [0.3, 1.25, 0.17], [-0.05, 0.85, 0.15]].forEach(function (p) { a.add(disc(p[2], 0.07, 12, 0.03), at(m, TR(p[0], p[1], 0.08)), '#f03a5f', NA); a.add(sph(p[2] * 0.3, 6, 4), at(m, TR(p[0] - p[2] * 0.3, p[1] + p[2] * 0.3, 0.15, 0, 1, 1, 0.4)), '#ff8fa3', NA); });
    a.add(sph(0.1, 6, 4), at(m, TR(0.38, 1.62, 0.09, 0, 1, 1, 0.3)), '#ffe58a', NA); a.add(sph(0.08, 6, 4), at(m, TR(-0.08, 1.2, 0.09, 0, 1, 1, 0.3)), '#ffe58a', NA); return 2.1; } };

  // ---------- 1f9fa: the basket ----------
  M.basket = { pic: '1f9fa', f: function (a) { var p = [[0, 0], [0.62, 0], [0.68, 0.04]], i, c1 = new THREE.Color('#f9dca8'), c2 = new THREE.Color('#b06a34'), Bn = '#b9743c';
    for (i = 1; i <= 8; i++) p.push([0.68 + 0.3 * i / 8, 0.04 + 1.04 * i / 8]);
    a.add(lathe(p, 20), TR(0, 0, 0, 0, 1, 1, 0.8), function (k, x, y, z) { var s = Math.round(Math.atan2(z / 0.8, x) / (PI / 10)), r = Math.round((y - 0.04) / 0.13); return ((s + r) & 1) ? c1 : c2; }, { g: 0.3 });
    a.add(cyl(0.95, 0.95, 0.06, 20), TR(0, 0.98, 0, 0, 1, 1, 0.8), '#8a5a3c', NA);
    a.add(new THREE.TorusGeometry(0.98, 0.08, 6, 20).applyMatrix4(RX), TR(0, 1.08, 0, 0, 1, 1, 0.8), Bn, NA);
    a.add(torus(0.6, 0.065, 6, 16, PI), TR(0, 1.08, 0, 0, 1, 1.85, 1), Bn, NA); return 2.25; } };

  // ---------- 1f3b2: the die ----------
  M.die = { pic: '1f3b2', f: function (a) { var m = TR(0, 0, 0, PI / 4), D = '#3a2a7e', S = 1.6, h = S / 2;
    a.add(rbox(S, S, S, 0.3, 6), at(m, TR(0, h, 0)), '#f4f1fb');
    [[-0.4, 0.4], [0, 0], [0.4, -0.4]].forEach(function (p) { a.add(sph(0.16, 10, 6), at(m, TR(p[0], h + p[1], h, 0, 1, 1, 0.3)), D, NA); });
    [[-0.36, 0.36], [0.36, -0.36]].forEach(function (p) { a.add(sph(0.16, 10, 6), at(m, TR(-h, h + p[1], p[0], 0, 0.3, 1, 1)), D, NA); });
    a.add(sph(0.24, 10, 6), at(m, TR(0, S, 0, 0, 1, 0.3, 1)), '#ff3b4e', NA); return 1.7; } };

  // ---------- 1f3a0: the carousel horse ----------
  M.horse = { pic: '1f3a0', f: function (a) { var H = '#cf8750', D = '#7a4a3a', G = C.gold, o = { noAO: 1, g: 0.6 };
    a.add(lathe([[1.14, 0], [1.2, 0.06], [1.2, 0.13], [1.14, 0.19], [0, 0.19]], 20), null, '#ff5a4f'); a.add(cyl(1.0, 1.0, 0.03, 20), TR(0, 0.18, 0), '#ffe9c4', NA);
    a.add(cyl(0.05, 0.05, 2.95, 6), TR(0.05, 0.15, 0), G, NA); a.add(sph(0.11, 6, 4), TR(0.05, 3.12, 0), G, NA);
    a.add(sph(1, 12, 8), TR(0.05, 1.5, 0, 0, 0.74, 0.42, 0.38), H, o);
    a.add(rod(0.2, 0.56, 6), TR(-0.66, 1.84, 0, 0, 1, 1, 1, 0, 0.6), H, o); a.add(sph(1, 10, 6), TR(-1.0, 2.1, 0, 0, 0.38, 0.21, 0.2, 0, 0.55), H, o);
    [-1, 1].forEach(function (s) { a.add(cyl(0.01, 0.07, 0.2, 4), TR(-0.76, 2.26, s * 0.1), H, NA); });
    a.add(sph(1, 6, 4), TR(-0.5, 2.06, 0, 0, 0.13, 0.46, 0.13, 0, 0.6), D, NA); a.add(sph(0.045, 5, 3), TR(-0.98, 2.2, 0.17), '#2e2350', NA);
    a.add(sph(1, 6, 4), TR(0.86, 1.3, 0, 0, 0.15, 0.44, 0.15, 0, 0.45), D, NA);
    a.add(rb(0.5, 0.44, 0.84, 0.12), TR(0.05, 1.72, 0), '#f0434b', NA); a.add(box(0.56, 0.07, 0.86), TR(0.05, 1.56, 0), G, NA);
    [[[-0.42, 1.36], [-0.82, 1.14], [-0.74, 0.74]], [[-0.36, 1.34], [-0.52, 0.94], [-0.8, 0.72]], [[0.52, 1.36], [0.82, 1.02], [0.62, 0.66]], [[0.46, 1.34], [0.52, 0.92], [0.84, 0.74]]].forEach(function (L, k) { var mz = TR(0, 0, k % 2 ? -0.18 : 0.18);
      stroke(a, L, 0.085, H, mz, 5); a.add(sph(0.1, 5, 3), at(mz, TR(L[2][0], L[2][1] - 0.04, 0)), D, NA); });
    return 3.1; } };

  // ---------- 1f5fa: the folded map ----------
  M.worldmap = { pic: '1f5fa', f: function (a) { var m = TR(0, 0.04, 0, 0, 1, 1, 1, -0.22), G = '#3ecf62', lands = [[[-0.1, 0.4, 0.2, 0.26], [0.12, -0.25, 0.13, 0.3]], [[0, 0.3, 0.26, 0.2], [-0.1, -0.2, 0.15, 0.22], [0.2, -0.05, 0.1, 0.14]], [[0.02, 0.2, 0.22, 0.3], [0.1, -0.42, 0.16, 0.1]]];
    [-1, 0, 1].forEach(function (k, i) { var pm = at(m, TR(k * 0.8, 0.92, i === 1 ? 0.0 : 0.0, k ? 0.42 : -0.42));
      a.add(rb(0.92, 1.75, 0.08, 0.03), pm, '#f4f2fa', NA); a.add(rb(0.8, 1.6, 0.1, 0.03), pm, '#2f9bff', NA);
      lands[i].forEach(function (l) { a.add(sph(1, 8, 6), at(pm, TR(l[0], l[1], 0.045, 0, l[2], l[3], 0.03)), G, FLAT); }); }); return 1.85; } };

  // ---------- 1f514: the bell ----------
  M.bell = { pic: '1f514', f: function (a) {
    a.add(sph(0.22, 10, 6), TR(0, 0.2, 0), '#f08a3d', NA);
    a.add(lathe([[0, 0.34], [0.9, 0.3], [1.04, 0.3], [1.08, 0.38], [1.0, 0.48], [0.78, 0.72], [0.64, 1.1], [0.58, 1.5], [0.46, 1.84], [0.26, 2.02], [0, 2.06]], 22), null, C.gold, NA);
    a.add(sph(0.15, 8, 6), TR(0, 2.14, 0), C.gold2, NA); return 2.3; } };

  // ---------- 1f9ca: the ice cube ----------
  M.ice = { pic: '1f9ca', f: function (a) { var m = TR(0, 0, 0, PI / 4), W = '#e8f8ff', S = 1.65, h = 0.8, drop = [[0, 0], [0.7, 0.25], [1, 0.75], [0.7, 1.3], [0, 2.2]], c0 = new THREE.Color('#3fa4ff'), c1 = new THREE.Color('#8fdcff'), cw = new THREE.Color('#e8f8ff'), out = new THREE.Color();
    a.add(rbox(S, 1.6, S, 0.26, 6), at(m, TR(0, h, 0)), function (k, x, y, z) { var lx = Math.abs(x - z) * 0.7071, lz = Math.abs(x + z) * 0.7071, ly = Math.abs(y - h), e = (lx > S / 2 - 0.2 ? 1 : 0) + (lz > S / 2 - 0.2 ? 1 : 0) + (ly > 0.8 - 0.2 ? 1 : 0);
      return out.copy(c0).lerp(c1, k).lerp(cw, e >= 2 ? 0.7 : 0); }, { g: 0.4 });      // the edges of the cube are pale, like the rim of a block of ice
    [[-0.3, 0.85, 0.16], [0.38, 0.4, 0.11]].forEach(function (p) { a.add(lathe(drop, 8), at(m, TR(p[0], p[1], S / 2 - 0.01, 0, p[2], p[2], p[2] * 0.4)), W, NA); });
    a.add(lathe(drop, 8), at(m, TR(-S / 2 + 0.01, 0.7, 0.1, 0, 0.05, 0.14, 0.14)), W, NA); a.add(sph(0.09, 6, 4), at(m, TR(-S / 2, 0.4, -0.4, 0, 0.3, 1, 1)), W, NA); a.add(sph(0.08, 6, 4), at(m, TR(0.45, 1.2, S / 2, 0, 1, 1, 0.3)), W, NA); return 1.7; } };

  // ---------- 1f9f8: the teddy bear ----------
  M.teddy = { pic: '1f9f8', f: function (a) { var Bc = '#e88f42', L = '#ffc98a', D = '#5a3526', o = { noAO: 1, g: 0.7 };
    a.add(sph(0.66, 14, 10), TR(0, 0.74, 0, 0, 1, 1.05, 0.9), Bc, { g: 0.7 }); a.add(sph(0.4, 10, 6), TR(0, 0.72, 0.36, 0, 1, 1.05, 0.72), L, o);
    a.add(sph(0.56, 14, 10), TR(0, 1.72, 0.05), Bc, o); a.add(sph(0.23, 10, 6), TR(0, 1.58, 0.52, 0, 1.15, 0.85, 0.7), L, o); a.add(sph(0.075, 6, 4), TR(0, 1.65, 0.69), D, NA);
    [-1, 1].forEach(function (s) { a.add(sph(0.055, 6, 4), TR(s * 0.2, 1.84, 0.55), D, NA); a.add(sph(0.22, 8, 6), TR(s * 0.45, 2.15, 0), Bc, o); a.add(sph(0.13, 6, 4), TR(s * 0.45, 2.15, 0.13, 0, 1, 1, 0.5), L, NA);
      a.add(sph(0.22, 8, 6), TR(s * 0.7, 1.0, 0.18, 0, 1, 1.7, 1, 0, s * 0.75), Bc, o);
      a.add(sph(0.29, 8, 6), TR(s * 0.48, 0.3, 0.55, s * 0.3, 1, 1, 1.5), Bc); a.add(sph(0.17, 6, 4), TR(s * 0.6, 0.32, 0.95, s * 0.3, 1, 1, 0.3), L, NA); }); return 2.35; } };

  // ---------- 1f3e6: the bank (columns, a pediment, a coin with $) ----------
  M.bank = { pic: '1f3e6', f: function (a) { var i, S = '#e4e0f0', mz = TR(0, 0, 0.7), V = '#8b4fcf';
    a.add(rb(2.4, 0.16, 1.4, 0.05), TR(0, 0.08, 0), '#cfcbe0'); a.add(rb(2.15, 0.14, 1.2, 0.05), TR(0, 0.23, 0), S, NA); a.add(box(1.8, 1.05, 0.7), TR(0, 0.82, -0.15), '#b6b0cf', NA);
    for (i = 0; i < 4; i++) a.add(cyl(0.12, 0.13, 1.05, 10), TR(-0.84 + i * 0.56, 0.3, 0.4), '#f1eef7', NA);
    a.add(box(0.4, 0.66, 0.06), TR(0, 0.63, 0.21), INK, NA);
    a.add(rb(2.2, 0.17, 1.25, 0.05), TR(0, 1.43, 0), S, NA); a.add(prism(2.35, 0.75, 1.3, 0.06), TR(0, 1.48, 0), '#d8d4e8', NA);
    a.add(coin(0.25, 0.1, 14), TR(0, 1.8, 0.6), '#f4f2fa', FLAT);
    stroke(a, arcPts(0, 1.86, 0.065, 0.3, 4.2, 4).concat(arcPts(0, 1.74, 0.065, 1.2, -2.6, 4)), 0.028, V, mz, 4); stroke(a, [[0, 1.98], [0, 1.62]], 0.02, V, mz, 4); return 2.2; } };

  // ---------- 1f5ff: the stone head ----------
  M.moai = { pic: '1f5ff', f: function (a) { var m = TR(0, 0, 0, -0.5, 1, 1, 1, -0.16), S = '#bdb9c9', S2 = '#a9a4b9', D = '#5d5670', RY = TR(0, 0, 0, -PI / 2);
    a.add(warp(rbox(1.25, 2.4, 1.1, 0.3, 6).applyMatrix4(TR(0, 1.2, 0)), function (v) { var t = v.y / 2.4; v.x *= 1.08 - 0.22 * t; v.z *= 1.05 - 0.15 * t; }), m, S);
    a.add(rb(1.16, 0.34, 0.5, 0.13), at(m, TR(0, 1.86, 0.4)), S, NA); a.add(box(0.96, 0.2, 0.1), at(m, TR(0, 1.6, 0.52)), D, NA);                      // the brow and the shadow under it
    a.add(slab([[0, 0], [0.5, 0], [0.5, 0.16], [0.14, 1.08], [0, 1.08]], 0.34, 0.05).applyMatrix4(RY), at(m, TR(0, 0.78, 0.5)), S, NA);                 // the long nose
    [-1, 1].forEach(function (s) { a.add(rb(0.16, 1.0, 0.4, 0.07), at(m, TR(s * 0.66, 1.2, -0.05)), S2, NA); });
    a.add(rb(0.78, 0.15, 0.34, 0.06), at(m, TR(0, 0.58, 0.5)), S2, NA); a.add(box(0.62, 0.07, 0.1), at(m, TR(0, 0.47, 0.6)), D, NA); a.add(rb(0.84, 0.3, 0.4, 0.1), at(m, TR(0, 0.26, 0.46)), S); return 2.4; } };

  // ---------- 1fa9e: the mirror ----------
  M.mirror = { pic: '1fa9e', f: function (a) { var m = TR(0, 0.1, 0, 0, 1, 1, 1, -0.1), i, G = C.gold, f = mix('#bfeeff', '#ffffff');
    a.add(rcyl(0.5, 0.14, 0.05, 10), null, C.gold2); a.add(cyl(0.1, 0.14, 0.3, 8), TR(0, 0.12, 0), G);
    for (i = 0; i < 8; i++) { var an = i * PI / 4 + PI / 8; a.add(sph(0.4, 8, 5), at(m, TR(Math.cos(an) * 0.56, 1.45 + Math.sin(an) * 0.84, 0, 0, 1, 1, 0.34)), G, NA); }
    a.add(coin(1, 0.2, 18), at(m, TR(0, 1.45, -0.1, 0, 0.66, 0.96, 1)), G, NA);
    a.add(coin(1, 0.06, 18), at(m, TR(0, 1.45, 0.1, 0, 0.6, 0.9, 1)), function (k) { return f(k); }, { noAO: 1, g: 0.2 });
    a.add(box(0.07, 0.6, 0.02), at(m, TR(-0.12, 1.6, 0.165, 0, 1, 1, 1, 0, -0.6)), '#ffffff', FLAT); a.add(box(0.05, 0.3, 0.02), at(m, TR(0.08, 1.42, 0.165, 0, 1, 1, 1, 0, -0.6)), '#ffffff', FLAT); return 2.7; } };

  // ---------- 1f3ea: the shop that is open 24 hours ----------
  M.shop = { pic: '1f3ea', f: function (a) { var S = '#dedaea', mz = TR(0, 0, 0.36);
    a.add(rb(2.4, 1.25, 1.2, 0.08), TR(0, 0.625, 0), S); a.add(rb(2.56, 0.28, 1.36, 0.1), TR(0, 1.33, 0), '#ff4b5c', NA);
    a.add(rb(1.55, 0.62, 0.3, 0.07), TR(-0.3, 1.76, 0.2), GREY2, NA);
    digit(a, 2, -0.78, 1.77, 0.62, 0.045, INK, mz, 4); digit(a, 4, -0.4, 1.77, 0.62, 0.045, INK, mz, 4); digit(a, 'H', 0.12, 1.77, 0.62, 0.045, INK, mz, 4);
    a.add(rb(0.74, 0.86, 0.08, 0.05), TR(-0.6, 0.45, 0.6), INK); [-1, 1].forEach(function (s) { a.add(box(0.28, 0.7, 0.08), TR(-0.6 + s * 0.17, 0.43, 0.61), '#27c4ff', NA); });
    a.add(rb(0.9, 0.42, 0.08, 0.05), TR(0.55, 0.62, 0.6), '#5fd4ff', NA); return 2.1; } };

  // ---------- 1f3ed: the factory ----------
  M.factory = { pic: '1f3ed', f: function (a) { var i, j, k, R = '#ff4b5c', W = '#ffffff';
    a.add(rb(1.55, 0.85, 1.1, 0.07), TR(-0.5, 0.425, 0), '#cfcbdc'); [-1, 1].forEach(function (s) { a.add(slab([[-0.38, 0], [0.38, 0], [-0.38, 0.5]], 1.1, 0.04), TR(-0.5 + s * 0.39, 0.8, 0), GREY2, NA); });
    a.add(rb(1.0, 1.75, 1.05, 0.07), TR(0.78, 0.875, 0.02), '#dedaea');
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) a.add(box(0.2, 0.2, 0.05), TR(0.5 + i * 0.28, 1.5 - j * 0.28, 0.54), GLASS, NA);
    [-0.95, -0.42].forEach(function (x) { for (k = 0; k < 5; k++) a.add(cyl(0.13, 0.135, 0.34, 8, k < 4), TR(x, 1.0 + k * 0.34, -0.3), k % 2 ? R : W, NA); a.add(cyl(0.15, 0.15, 0.08, 8), TR(x, 2.68, -0.3), '#9c96ad', NA); });
    [-0.95, -0.4].forEach(function (x) { a.add(box(0.34, 0.34, 0.05), TR(x, 0.17, 0.54), INK); }); a.add(rb(0.38, 0.5, 0.06, 0.04), TR(0.78, 0.25, 0.54), INK); return 2.75; } };

  // ---------- 1f6cd: the shopping bags ----------
  M.bags = { pic: '1f6cd', f: function (a) { var i, Bl = '#3d9bff';
    a.add(rb(1.15, 1.25, 0.5, 0.05), TR(0.6, 0.625, -0.28), '#ffb02e'); a.add(torus(0.26, 0.045, 5, 12, PI), TR(0.72, 1.0, -0.02, 0, 1, 1.4, 1, 0, PI), '#f0552a', NA);
    a.add(rb(1.35, 1.5, 0.62, 0.05), TR(-0.3, 0.75, 0.25), Bl); for (i = 0; i < 3; i++) a.add(box(1.355, 0.13, 0.625), TR(-0.3, 0.3 + i * 0.3, 0.25), '#2f86f0', LINE);
    [-1, 1].forEach(function (s) { a.add(torus(0.26, 0.04, 5, 12, PI), TR(-0.3, 1.48, 0.25 + s * 0.2, 0, 1, 1.35, 1, s * -0.12), '#6fb8ff', NA); }); return 2.0; } };

  // ---------- overrides: the crane and the slide, closer to the game's pictures ----------
  M.crane = { pic: '1f3d7', over: 1, f: function (a) { var Y = C.gold, D = C.gold2, Rd = '#f0434b', x0 = -0.72, hw = 0.25, zz = [], i;
    a.add(rb(2.4, 0.2, 0.95, 0.08), TR(0.05, 0.1, 0), Rd); a.add(box(0.8, 0.12, 0.8), TR(x0, 0.26, 0), '#d92f3f', NA);
    [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { a.add(cyl(0.055, 0.055, 2.4, 6, true), TR(x0 + sx * hw, 0.3, sz * hw), sz > 0 ? Y : D, NA); }); });
    for (i = 0; i <= 6; i++) zz.push([x0 + (i % 2 ? hw : -hw), 0.36 + i * 0.385]);
    stroke(a, zz, 0.04, Y, TR(0, 0, hw), 5); stroke(a, zz, 0.035, D, TR(0, 0, -hw), 4);
    for (i = 0; i < 4; i++) { a.add(box(0.06, 0.06, hw * 2), TR(x0 - hw, 0.75 + i * 0.6, 0), D, NA); a.add(box(0.06, 0.06, hw * 2), TR(x0 + hw, 0.75 + i * 0.6, 0), D, NA); }
    a.add(box(0.7, 0.1, 0.7), TR(x0, 2.72, 0), D, NA);
    a.add(rb(2.75, 0.13, 0.26, 0.05), TR(0.1, 2.84, 0), Y, NA);                                                                     // the jib
    stroke(a, [[x0, 2.9], [x0, 3.3]], 0.05, Y, null, 5); stroke(a, [[x0, 3.3], [1.4, 2.92]], 0.025, INK, null, 4); stroke(a, [[x0, 3.3], [-1.22, 2.92]], 0.025, INK, null, 4);
    a.add(rb(0.34, 0.3, 0.4, 0.07), TR(-1.08, 2.66, 0), '#8a8a99', NA);                                                             // the counterweight
    a.add(rb(0.46, 0.4, 0.44, 0.1), TR(x0 + 0.5, 2.56, 0.04), '#ffe08a', NA); a.add(box(0.3, 0.2, 0.06), TR(x0 + 0.5, 2.58, 0.24), GLASS, NA);      // the cabin
    a.add(box(0.22, 0.1, 0.3), TR(0.8, 2.75, 0), INK, NA); stroke(a, [[0.8, 2.72], [0.8, 2.0]], 0.022, INK, null, 4);
    a.add(torus(0.09, 0.035, 5, 8, PI * 1.4), TR(0.8, 1.9, 0, 0, 1, 1, 1, 0, PI), '#8a8a99', NA);
    stroke(a, [[0.42, 1.38], [0.8, 1.84], [1.18, 1.38]], 0.025, INK, null, 4);
    a.add(rb(1.0, 0.34, 0.5, 0.07), TR(0.8, 1.2, 0), Rd, NA); a.add(box(1.03, 0.08, 0.53), TR(0.8, 1.33, 0), '#c22a38', NA); return 3.3; } };
  M.slide = { pic: '1f6dd', over: 1, f: function (a) { var m = TR(0.1, 0, 0, 0.42), Rd = '#ef3e5b', R2 = '#d92f4c', Wt = '#e9ecf4', i, n = 12, top = [], c = new THREE.CatmullRomCurve3([new V3(-0.55, 1.6, 0), new V3(-0.1, 1.5, 0), new V3(0.45, 0.95, 0), new V3(1.0, 0.42, 0), new V3(1.5, 0.3, 0), new V3(1.95, 0.3, 0)]), s = new THREE.Shape();
    for (i = 0; i <= n; i++) top.push(c.getPoint(i / n));      // the chute: a curved band between two red rails; the whole slide is turned a little so that the ladder shows
    top.forEach(function (p, k) { k ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y); }); for (i = n; i >= 0; i--) s.lineTo(top[i].x, top[i].y - 0.08); s.closePath();
    a.add(slab(s, 0.64, 0.02, 40), m, Wt, NA);
    [-1, 1].forEach(function (sd) { a.add(tube(top.map(function (p) { return [p.x, p.y + 0.07, sd * 0.34]; }), 0.085, 12, 6), m, Rd, NA); a.add(sph(0.085, 6, 4), at(m, TR(1.95, 0.37, sd * 0.34)), Rd, NA); a.add(sph(0.085, 6, 4), at(m, TR(-0.55, 1.67, sd * 0.34)), Rd, NA);
      a.add(cyl(0.06, 0.06, 1.74, 6), at(m, TR(-1.33, 0, sd * 0.32, 0, 1, 1, 1, 0, -0.14)), Rd); a.add(cyl(0.055, 0.055, 1.56, 6), at(m, TR(-0.5, 0, sd * 0.32)), R2);
      a.add(torus(0.27, 0.055, 5, 10, PI), at(m, TR(-0.8, 1.62, sd * 0.32, 0, 1, 1.25, 1)), '#33b5ff', NA); a.add(cyl(0.05, 0.05, 0.28, 6), at(m, TR(1.75, 0, sd * 0.3)), R2); });
    a.add(rb(0.68, 0.1, 0.74, 0.04), at(m, TR(-0.8, 1.58, 0)), Wt, NA);
    for (i = 0; i < 4; i++) a.add(cyl(0.045, 0.045, 0.64, 6).applyMatrix4(RX), at(m, TR(-1.3 + i * 0.045, 0.3 + i * 0.34, -0.32)), Rd, NA); return 2.05; } };

  // ---------- the registry ----------
  // ship: false = "keep flat": the model exists (the gallery shows it) but the game keeps its own picture for that stop
  var KEEP_FLAT = {};
  T.BUILD_OLD = T.BUILD_OLD || { crane: B.crane, slide: B.slide };
  T.MORE = {};
  Object.keys(M).forEach(function (k) { var e = M[k], ship = !KEEP_FLAT[k]; T.MORE[k] = { pic: e.pic, ship: ship, over: !!e.over, f: e.f };
    if (e.over) { if (ship) B[k] = e.f; else B[k + '2'] = e.f; return; }
    B[k] = e.f; T.ART[k] = e.pic; if (ship) T.MODEL[e.pic] = k; });
})(typeof Toy !== 'undefined' ? Toy : null);
