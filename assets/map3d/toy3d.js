// task "map3d": the objects of the toy island (houses, landmarks, trees, rocks, flowers, the boat), built in code from rounded shapes with smooth normals. No model files. Own work.
// Toy.Acc bakes many shapes into one mesh with vertex colours: a top-to-bottom gradient, a darker foot (contact occlusion) and a second "misty" colour set for sleeping houses.
var Toy = (function () {
  'use strict';
  var V3 = THREE.Vector3, q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new V3(), p4 = new V3();
  function TR(x, y, z, ry, sx, sy, sz, rx, rz) { e4.set(rx || 0, ry || 0, rz || 0, 'YXZ'); q4.setFromEuler(e4); return new THREE.Matrix4().compose(p4.set(x, y, z), q4, s4.set(sx || 1, sy || sx || 1, sz || sx || 1)); }

  // ---------- the accumulator ----------
  function Acc() { this.p = []; this.n = []; this.c = []; this.c2 = []; this.s = []; this.i = []; this.y0 = 0; }
  var MIST = new THREE.Color('#d6defb'), lo = new THREE.Color(), hi = new THREE.Color(), cc = new THREE.Color(), t2 = new THREE.Color(), hsl = {};
  function ends(col, gs) { col.getHSL(hsl); lo.setHSL(hsl.h, Math.min(1, hsl.s * 1.12), hsl.l * (1 - 0.2 * gs)); hi.setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.05 * gs)); }      // the two ends of the top-to-bottom gradient of a colour
  Acc.prototype.add = function (geom, mat, color, o) {    // the shape keeps its own shared vertices (no un-indexing): that is what keeps the build fast and the vertex count low
    o = o || {};
    var g = mat ? geom.clone().applyMatrix4(mat) : geom; if (!g.attributes.normal) g.computeVertexNormals();
    var P = g.attributes.position.array, Nn = g.attributes.normal.array, i, n = P.length / 3, base = this.p.length / 3, ymin = 1e9, ymax = -1e9, fn = typeof color === 'function' ? color : null, col = fn ? null : new THREE.Color(color);
    for (i = 0; i < n; i++) { var y = P[i * 3 + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
    var span = (ymax - ymin) || 1, gs = o.g == null ? 1 : o.g; if (!fn) ends(col, gs);
    for (i = 0; i < n; i++) { var x = P[i * 3], yy = P[i * 3 + 1], z = P[i * 3 + 2], k = (yy - ymin) / span;
      if (fn) ends(fn(k, x, yy, z), gs);
      cc.copy(lo).lerp(hi, k);
      if (!o.noAO) { var a = Math.max(0, Math.min(1, (yy - this.y0) / 0.4)); cc.multiplyScalar(0.7 + 0.3 * a); }
      var l = cc.r * 0.3 + cc.g * 0.59 + cc.b * 0.11; t2.setRGB(l, l, l).lerp(MIST, 0.72).lerp(cc, 0.22);
      this.p.push(x, yy, z); this.n.push(Nn[i * 3], Nn[i * 3 + 1], Nn[i * 3 + 2]); this.c.push(cc.r, cc.g, cc.b); this.c2.push(t2.r, t2.g, t2.b);
      if (o.sway) { var sk = Math.max(0, Math.min(1, (yy - o.sway.y0) / o.sway.h)); this.s.push(o.sway.amp * sk * sk, o.sway.ph); } else this.s.push(0, 0); }
    if (g.index) { var I = g.index.array; for (i = 0; i < I.length; i++) this.i.push(base + I[i]); } else for (i = 0; i < n; i++) this.i.push(base + i);
    if (g !== geom) g.dispose(); return this;
  };
  Acc.prototype.geom = function (misty) { var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setIndex(this.i);
    g.setAttribute('color', new THREE.Float32BufferAttribute(misty ? this.c2 : this.c, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 2));
    g.userData.c = new THREE.Float32BufferAttribute(this.c, 3); g.userData.c2 = new THREE.Float32BufferAttribute(this.c2, 3); return g; };

  // ---------- rounded shapes ----------
  var UNIT = {};
  function rbox(w, h, d, r, s) {                          // a box with rounded edges; s = 4 (one facet per edge, smooth normals) or 6 (two facets)
    s = s || 4; r = Math.min(r == null ? 0.08 : r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    var u = UNIT[s] || (UNIT[s] = new THREE.BoxGeometry(1, 1, 1, s, s, s)), U = u.attributes.position.array, n = U.length / 3, P = new Float32Array(U.length), Nn = new Float32Array(U.length), hv = [w / 2, h / 2, d / 2], v = [0, 0, 0], inn = [0, 0, 0], i, j, e = s === 6 ? 2 : 1;
    for (i = 0; i < n; i++) {
      for (j = 0; j < 3; j++) { var c = U[i * 3 + j], a = Math.abs(c), sg = c < 0 ? -1 : 1, f = Math.round(a * s), m;     // f: grid line index from the centre, 0..s/2
        if (f >= s / 2) m = hv[j]; else if (s === 6 && f === 2) m = hv[j] - r * 0.5; else if (f === s / 2 - e) m = hv[j] - r; else m = (hv[j] - r) * f / Math.max(1, s / 2 - e);
        v[j] = sg * m; inn[j] = Math.max(-(hv[j] - r), Math.min(hv[j] - r, v[j])); }
      var dx = v[0] - inn[0], dy = v[1] - inn[1], dz = v[2] - inn[2], L = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (L > 1e-6) { P[i * 3] = inn[0] + dx / L * r; P[i * 3 + 1] = inn[1] + dy / L * r; P[i * 3 + 2] = inn[2] + dz / L * r; Nn[i * 3] = dx / L; Nn[i * 3 + 1] = dy / L; Nn[i * 3 + 2] = dz / L; }
      else { P[i * 3] = v[0]; P[i * 3 + 1] = v[1]; P[i * 3 + 2] = v[2]; Nn[i * 3] = u.attributes.normal.array[i * 3]; Nn[i * 3 + 1] = u.attributes.normal.array[i * 3 + 1]; Nn[i * 3 + 2] = u.attributes.normal.array[i * 3 + 2]; } }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setIndex(u.index); return g; }
  function sph(r, ws, hs) { return new THREE.SphereGeometry(r, ws || 12, hs || 8); }
  function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(Math.max(0.0001, p[0]), p[1]); }), seg || 16); }
  function rcyl(r, h, b, seg, rTop) {                     // a cylinder with rounded rims, standing on y = 0
    b = Math.min(b == null ? 0.05 : b, h / 2, r); var rt = rTop == null ? r : rTop, pts = [[0, 0], [r - b, 0]], i;
    for (i = 1; i <= 3; i++) { var a = i / 3 * Math.PI / 2; pts.push([r - b + Math.sin(a) * b, b - Math.cos(a) * b]); }
    for (i = 0; i <= 3; i++) { a = i / 3 * Math.PI / 2; pts.push([rt - b + Math.cos(a) * b, h - b + Math.sin(a) * b]); }
    pts.push([0, h]); return lathe(pts, seg || 14); }
  function rod(r, len, seg) { return new THREE.CapsuleGeometry(r, len, 3, seg || 8); }            // along y, centred
  function key(P, i) { return Math.round(P[i] * 500) + '_' + Math.round(P[i + 1] * 500) + '_' + Math.round(P[i + 2] * 500); }
  function smooth(geom, crease) {                         // smooth normals across faces that meet at less than the crease angle
    var g = geom.index ? geom.toNonIndexed() : geom, P = g.attributes.position.array, n = P.length / 9, fn = [], map = {}, i, j, a = new V3(), b = new V3(), c = new V3(), cos = Math.cos((crease || 60) * Math.PI / 180);
    for (i = 0; i < n; i++) { a.fromArray(P, i * 9); b.fromArray(P, i * 9 + 3); c.fromArray(P, i * 9 + 6); b.sub(a); c.sub(a); b.cross(c); fn.push(b.x, b.y, b.z);
      for (j = 0; j < 3; j++) { var k = key(P, i * 9 + j * 3); (map[k] || (map[k] = [])).push(i); } }
    var N = new Float32Array(P.length), u = new V3(), f = new V3(), s = new V3();
    for (i = 0; i < n; i++) { f.fromArray(fn, i * 3); var fl = f.length();
      for (j = 0; j < 3; j++) { var list = map[key(P, i * 9 + j * 3)]; s.set(0, 0, 0);
        for (var q = 0; q < list.length; q++) { u.fromArray(fn, list[q] * 3); var ul = u.length(); if (ul > 0 && fl > 0 && u.dot(f) / (ul * fl) >= cos) s.add(u); }
        if (s.lengthSq() === 0) s.set(0, 1, 0); s.normalize(); s.toArray(N, i * 9 + j * 3); } }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); return g; }
  function prism(w, h, d, bev) {                          // a gable: the triangle faces +z, the ridge runs along z; rounded edges; base on y = 0, centred
    bev = bev == null ? 0.07 : bev; var s = new THREE.Shape(); s.moveTo(-w / 2 + bev, bev); s.lineTo(w / 2 - bev, bev); s.lineTo(0, h - bev * 1.3); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, d - bev * 2), bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 3, curveSegments: 1 }); g.translate(0, 0, -(d - bev * 2) / 2); return smooth(g, 62); }
  function tri(pts, th) {                                 // a thin flat shape in the xy plane (a sail, a flag)
    var s = new THREE.Shape(); pts.forEach(function (p, i) { i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: th || 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); g.translate(0, 0, -(th || 0.04) / 2); return smooth(g, 62); }
  function arc(R, tube, ang, seg) { return new THREE.TorusGeometry(R, tube, 8, seg || 24, ang || Math.PI); }       // in the xy plane, from angle 0

  // ---------- colours sampled from the game's Fluent pictures ----------
  var C = { wall: '#f6c48f', wall2: '#e8a56c', roof: '#f5423c', door: '#a05a3c', glass: '#57c1ff', white: '#ffffff', cream: '#fff0d2', trunk: '#a8694b', leaf: '#44c767', leaf2: '#2fae5a', leaf3: '#6fdc7c',
    pine: '#33b665', palm: '#6cc24a', rock: '#eeeaf6', pink: '#ff4fa3', gold: '#ffc83d', gold2: '#f0a400', purple: '#a58bff', ink: '#4a3560', stone: '#e4e0f0', stone2: '#c5bfdb', red: '#ff5a4f', blue: '#4aa8ff', sand: '#f6d27a' };

  // ---------- props ----------
  function bush(a, x, z, s, y) { s = s || 1; y = y || 0;
    a.add(sph(0.36 * s, 12, 8), TR(x, y + 0.26 * s, z, 0, 1, 0.86, 1), C.leaf2); a.add(sph(0.27 * s, 10, 8), TR(x + 0.3 * s, y + 0.2 * s, z + 0.08 * s, 0, 1, 0.86, 1), C.leaf); a.add(sph(0.22 * s, 10, 8), TR(x - 0.28 * s, y + 0.17 * s, z + 0.1 * s), C.leaf3); }
  function tree(a, x, y, z, s, ph) { var sw = { y0: y + 0.5 * s, h: 1.9 * s, amp: 0.05 * s, ph: ph || 0 };
    a.add(rcyl(0.15 * s, 1.0 * s, 0.04, 10, 0.11 * s), TR(x, y, z), C.trunk);
    a.add(sph(0.52 * s), TR(x - 0.42 * s, y + 1.12 * s, z + 0.08 * s, 0, 1, 0.9, 1), C.leaf2, { sway: sw, noAO: 1 }); a.add(sph(0.54 * s), TR(x + 0.42 * s, y + 1.2 * s, z, 0, 1, 0.9, 1), C.leaf2, { sway: sw, noAO: 1 });
    a.add(sph(0.7 * s, 16, 12), TR(x, y + 1.55 * s, z, 0, 1, 0.94, 1), C.leaf, { sway: sw, noAO: 1 }); a.add(sph(0.46 * s), TR(x + 0.05 * s, y + 2.1 * s, z, 0, 1, 0.9, 1), C.leaf3, { sway: sw, noAO: 1 }); }
  var CONE = [[0, 0], [0.93, 0], [1, 0.04], [0.92, 0.12], [0.62, 0.36], [0.24, 0.84], [0.1, 0.97], [0, 1]];
  function pine(a, x, y, z, s, ph) { var sw = { y0: y + 0.4 * s, h: 2.2 * s, amp: 0.035 * s, ph: ph || 0 };
    a.add(rcyl(0.14 * s, 0.6 * s, 0.04, 10), TR(x, y, z), C.trunk);
    [[0.78, 0.95, 0.38, C.leaf2], [0.62, 0.85, 0.95, C.pine], [0.44, 0.8, 1.5, C.leaf]].forEach(function (t) { a.add(lathe(CONE.map(function (p) { return [p[0] * t[0] * s, p[1] * t[1] * s]; }), 14), TR(x, y + t[2] * s, z), t[3], { sway: sw, noAO: 1 }); }); }
  function palm(a, x, y, z, s, ry) { var i, sw = { y0: y + 0.3 * s, h: 2.0 * s, amp: 0.04 * s, ph: x };
    for (i = 0; i < 5; i++) a.add(rcyl((0.15 - i * 0.012) * s, 0.42 * s, 0.05, 8), TR(x + i * i * 0.012 * s, y + i * 0.36 * s, z, 0, 1, 1, 1, 0, -i * 0.04), '#b9805c', { sway: sw });
    var tx = x + 0.2 * s, ty = y + 1.85 * s;
    for (i = 0; i < 6; i++) { var an = i * Math.PI / 3 + (ry || 0); a.add(sph(0.5 * s, 8, 5), TR(tx + Math.cos(an) * 0.42 * s, ty - 0.07 * s, z + Math.sin(an) * 0.42 * s, -an, 1, 0.16, 0.42, 0, -0.42), i % 2 ? C.palm : '#52b043', { sway: sw, noAO: 1, g: 0.5 }); }
    a.add(sph(0.11 * s, 8, 6), TR(tx - 0.1 * s, ty - 0.14 * s, z + 0.1 * s), '#8a5a3c', { noAO: 1 }); a.add(sph(0.11 * s, 8, 6), TR(tx + 0.08 * s, ty - 0.16 * s, z + 0.12 * s), '#8a5a3c', { noAO: 1 }); }
  function tulip(a, x, y, z, s) { a.add(rod(0.035 * s, 0.4 * s, 6), TR(x, y + 0.24 * s, z), '#3fae55'); a.add(sph(0.16 * s, 10, 8), TR(x, y + 0.56 * s, z, 0, 1, 1.35, 1), C.pink, { noAO: 1 });
    a.add(sph(0.11 * s, 8, 6), TR(x - 0.09 * s, y + 0.64 * s, z, 0, 0.8, 1.4, 0.8, 0, 0.3), '#ff77bd', { noAO: 1 }); a.add(sph(0.11 * s, 8, 6), TR(x + 0.09 * s, y + 0.64 * s, z, 0, 0.8, 1.4, 0.8, 0, -0.3), '#ff77bd', { noAO: 1 });
    a.add(sph(0.14 * s, 8, 6), TR(x - 0.13 * s, y + 0.14 * s, z, 0, 1, 0.5, 0.45, 0, 0.6), C.leaf); a.add(sph(0.14 * s, 8, 6), TR(x + 0.13 * s, y + 0.14 * s, z, 0, 1, 0.5, 0.45, 0, -0.6), C.leaf); }
  function flower(a, x, y, z, s, col) { a.add(rod(0.02 * s, 0.2 * s, 5), TR(x, y + 0.12 * s, z), '#3fae55'); for (var i = 0; i < 5; i++) { var an = i * 1.2566; a.add(sph(0.075 * s, 7, 5), TR(x + Math.cos(an) * 0.085 * s, y + 0.28 * s, z + Math.sin(an) * 0.085 * s, 0, 1, 0.6, 1), col, { noAO: 1 }); } a.add(sph(0.06 * s, 7, 5), TR(x, y + 0.3 * s, z), C.gold, { noAO: 1 }); }
  function rock(a, x, y, z, s, ry) { a.add(smooth(new THREE.DodecahedronGeometry(0.5 * s, 0), 20), TR(x, y + 0.3 * s, z, ry || 0, 1, 0.78, 0.9), C.rock); a.add(smooth(new THREE.DodecahedronGeometry(0.28 * s, 0), 20), TR(x + 0.42 * s, y + 0.16 * s, z + 0.14 * s, 1 + (ry || 0), 1, 0.8, 1), '#dcd7ea'); }
  function mountain(a, x, y, z, s) {
    var prof = function (R, H) { var p = [], i; for (i = 0; i <= 14; i++) { var r = R * (1 - i / 14); p.push([r, H * (1 - Math.pow(r / R, 1.7))]); } return p; };
    var paint = function (snow, c0) { var cs = new THREE.Color('#ffffff'), cb = new THREE.Color(c0), cg = new THREE.Color('#45c466'), out = new THREE.Color();
      return function (k, vx, vy, vz) { var w = 0.035 * Math.sin(Math.atan2(vz - z, vx - x) * 5); return out.copy(k > snow + w ? cs : k < 0.2 + w ? cg : cb); }; };
    a.add(lathe(prof(1.5 * s, 2.3 * s), 26), TR(x, y - 0.05, z, 0.3, 1, 1, 0.8), paint(0.7, '#a8785e'), { g: 0.7 });
    a.add(lathe(prof(1.05 * s, 1.45 * s), 22), TR(x + 1.15 * s, y - 0.05, z + 0.25 * s, 0, 1, 1, 0.8), paint(0.78, '#96684f'), { g: 0.7 }); }
  function cloud(a, x, y, z, s) { [[0, 0, 0, 0.8], [-0.85, -0.1, 0.1, 0.58], [0.9, -0.08, 0, 0.62], [0.35, 0.3, -0.1, 0.55], [-0.4, 0.25, 0, 0.5]].forEach(function (c) { a.add(sph(c[3] * s, 14, 10), TR(x + c[0] * s, y + c[1] * s, z + c[2] * s, 0, 1, 0.72, 1), '#ffffff', { noAO: 1, g: 0.5 }); }); }
  function boat(a) { a.add(rbox(1.7, 0.42, 0.62, 0.2, 6), TR(0, 0.12, 0), '#f25c54', { noAO: 1 }); a.add(rbox(1.5, 0.1, 0.5, 0.05), TR(0, 0.36, 0), '#ffd9a8', { noAO: 1 }); a.add(rod(0.035, 1.7, 6), TR(0.05, 1.25, 0), '#c98a5a', { noAO: 1 });
    a.add(tri([[0.12, 0.5], [0.95, 0.5], [0.12, 2.0]]), null, '#ffd23f', { noAO: 1 }); a.add(tri([[-0.02, 0.5], [-0.7, 0.5], [-0.02, 1.6]]), null, '#ff9f1c', { noAO: 1 }); }

  // ---------- landmarks: each returns its height. Front faces +z. Built to look like the game's pictures ----------
  function house(a, x, z, w, d, hw, roof, o) { o = o || {}; var ov = 0.2, rw = w + ov * 2, rh = o.rh || rw * 0.42, wall = o.wall || C.wall, fz = z + d / 2;
    a.add(rbox(w, hw, d, 0.1), TR(x, hw / 2, z), wall);
    a.add(prism(rw, rh, d + 0.3, 0.08), TR(x, hw - 0.1, z), roof);
    a.add(prism(rw * 0.74, rh * 0.74, 0.1, 0.03), TR(x, hw - 0.06, fz + 0.13), wall, { noAO: 1 });
    if (o.chim) { a.add(rbox(0.26, 0.7, 0.26, 0.05), TR(x + o.chim * w, hw + rh * 0.62, z - d * 0.12), C.wall2, { noAO: 1 }); a.add(rbox(0.34, 0.12, 0.34, 0.05), TR(x + o.chim * w, hw + rh * 0.62 + 0.38, z - d * 0.12), '#c98a5a', { noAO: 1 }); }
    var dx = x + (o.door || 0) * w; a.add(rbox(0.4, 0.68, 0.1, 0.05), TR(dx, 0.34, fz + 0.01), C.door); a.add(sph(0.04, 6, 5), TR(dx + 0.11, 0.34, fz + 0.07), C.gold, { noAO: 1 });
    (o.win || []).forEach(function (wx) { a.add(rbox(0.46, 0.46, 0.08, 0.07), TR(x + wx * w, hw * 0.56, fz), C.white, { noAO: 1 }); a.add(rbox(0.34, 0.34, 0.1, 0.05), TR(x + wx * w, hw * 0.56, fz + 0.01), C.glass, { noAO: 1 }); });
    return hw + rh; }
  var RB = ['#ff5a5f', '#ff9f1c', '#ffd23f', '#4cd964', '#4aa8ff'];
  var BUILD = {
    tent: function (a) { var m = TR(0, 0, 0, -0.62);
      a.add(prism(2.1, 1.5, 1.9, 0.09).applyMatrix4(m), null, '#3ecf62'); a.add(prism(1.05, 1.15, 0.1, 0.02).applyMatrix4(TR(0, 0.02, 0.95)).applyMatrix4(m), null, '#167a36', { noAO: 1, g: 0.3 });
      a.add(rbox(0.07, 0.36, 0.5, 0.03).applyMatrix4(TR(0.57, 0.78, 0, 0, 1, 1, 1, 0, 0.61)).applyMatrix4(m), null, '#8ff0a4', { noAO: 1 });
      a.add(rod(0.07, 0.6, 6), TR(1.45, 0.09, 0.85, 0.5, 1, 1, 1, 0, Math.PI / 2), '#8a5a3c'); a.add(rod(0.07, 0.6, 6), TR(1.45, 0.11, 0.85, -0.7, 1, 1, 1, 0, Math.PI / 2), '#a8694b');
      a.add(lathe([[0, 0], [0.14, 0.02], [0.22, 0.12], [0.2, 0.24], [0.08, 0.5], [0, 0.62]], 10), TR(1.45, 0.12, 0.85), '#ff8a1f', { noAO: 1, g: 0.3 }); a.add(lathe([[0, 0], [0.08, 0.02], [0.11, 0.13], [0.05, 0.28], [0, 0.36]], 8), TR(1.45, 0.14, 0.93), '#ffd23f', { noAO: 1, g: 0.2 });
      return 1.55; },
    house: function (a) { var h = house(a, 0, 0, 1.75, 1.45, 1.05, C.roof, { win: [0.24], door: -0.2, chim: -0.28 }); bush(a, -1.15, 0.55, 0.95); bush(a, 1.2, 0.45, 0.8); return h; },
    house2: function (a) { var h = house(a, 0, 0, 1.75, 1.45, 1.05, '#3d8bff', { win: [0.24], door: -0.2, chim: 0.28 }); bush(a, 1.2, 0.5, 0.9); return h; },
    house3: function (a) { var h = house(a, 0, 0, 1.9, 1.45, 1.0, '#ff9f1c', { win: [-0.27, 0.27], door: 0 }); bush(a, -1.25, 0.5, 0.9); return h; },
    double: function (a) { house(a, -0.62, -0.5, 1.0, 0.95, 0.78, C.roof, { win: [0.0] }); house(a, 0.62, -0.5, 1.0, 0.95, 0.78, C.roof, { win: [0.0] });
      var h = house(a, 0, 0.3, 1.25, 1.05, 0.85, C.roof, { win: [0.22], door: -0.2 }); bush(a, -0.95, 0.6, 0.8); bush(a, 0.98, 0.58, 0.85); return h + 0.05; },
    hut: function (a) {                                    // a round hut with a straw roof
      a.add(rcyl(0.82, 0.95, 0.08, 16), null, '#e9b98a'); a.add(lathe([[0, 0], [1.15, 0], [1.2, 0.08], [1.05, 0.2], [0.5, 0.82], [0.14, 1.12], [0, 1.16]], 18), TR(0, 0.85, 0), '#e0a03c', { noAO: 1 });
      a.add(sph(0.14, 8, 6), TR(0, 2.02, 0), '#c98328', { noAO: 1 }); a.add(rbox(0.42, 0.66, 0.12, 0.08), TR(0, 0.33, 0.8), C.door); a.add(rbox(0.3, 0.3, 0.1, 0.07), TR(0.52, 0.56, 0.62, 0.7), C.glass, { noAO: 1 }); bush(a, -1.05, 0.45, 0.8); return 2.05; },
    garden: function (a) { var h = house(a, 0.3, 0, 1.6, 1.4, 1.02, C.roof, { win: [0.24], door: -0.2, chim: 0.28 }); tree(a, -1.0, 0, -0.1, 0.72, 2); bush(a, 1.35, 0.5, 0.85); bush(a, -0.75, 0.62, 0.7); return h; },
    castle: function (a) { var S = '#eceaf4', B = '#4f8dff', i;
      a.add(rbox(1.7, 1.25, 1.0, 0.08), TR(0, 0.625, 0), S); for (i = -2; i <= 2; i++) a.add(rbox(0.24, 0.22, 0.24, 0.04), TR(i * 0.36, 1.33, 0.38), '#dcd8ea', { noAO: 1 });
      a.add(rbox(0.8, 1.9, 0.8, 0.08), TR(0, 0.95, -0.15), '#f4f2fa'); a.add(lathe([[0, 0], [0.62, 0], [0.64, 0.06], [0.3, 0.6], [0.06, 0.95], [0, 0.98]], 14), TR(0, 1.86, -0.15), B, { noAO: 1 });
      [-1, 1].forEach(function (sd) { a.add(rcyl(0.36, 1.6, 0.05, 14), TR(sd * 1.0, 0, 0.2), S); a.add(lathe([[0, 0], [0.48, 0], [0.5, 0.06], [0.24, 0.5], [0.05, 0.8], [0, 0.82]], 14), TR(sd * 1.0, 1.56, 0.2), B, { noAO: 1 }); a.add(rbox(0.14, 0.26, 0.06, 0.04), TR(sd * 1.0, 1.05, 0.55), C.ink, { noAO: 1 }); });
      a.add(rbox(0.5, 0.74, 0.1, 0.2), TR(0, 0.37, 0.5), '#8a5a3c'); a.add(rbox(0.2, 0.3, 0.06, 0.08), TR(0, 1.5, 0.26), C.glass, { noAO: 1 });
      a.add(rod(0.02, 0.4, 5), TR(0, 3.0, -0.15), '#8a8a99', { noAO: 1 }); a.add(tri([[0, 3.02], [0.34, 3.11], [0, 3.2]]), TR(0, 0, -0.15), C.pink, { noAO: 1 }); return 2.85; },
    manor: function (a) { var h = house(a, 0, 0, 2.2, 1.4, 1.05, '#b061ff', { win: [-0.3, 0.3], door: 0, chim: 0.3 }); bush(a, -1.4, 0.5, 0.9); return h; },
    school: function (a) { var W = 2.7, i, j;
      a.add(rbox(W, 1.15, 1.2, 0.1), TR(0, 0.575, 0), C.wall); a.add(rbox(W + 0.24, 0.26, 1.42, 0.1), TR(0, 1.22, 0), '#9b6a5a', { noAO: 1 });
      a.add(rbox(0.95, 2.0, 1.1, 0.1), TR(0, 1.0, 0.16), '#f9cfa0'); a.add(prism(1.25, 0.6, 1.36, 0.08), TR(0, 1.92, 0.16), '#9b6a5a', { noAO: 1 });
      a.add(rcyl(0.27, 0.07, 0.03, 16), TR(0, 1.5, 0.7, 0, 1, 1, 1, Math.PI / 2), C.white, { noAO: 1, g: 0.3 }); a.add(rbox(0.04, 0.2, 0.03, 0.01), TR(0, 1.58, 0.79), C.ink, { noAO: 1 }); a.add(rbox(0.15, 0.04, 0.03, 0.01), TR(0.06, 1.5, 0.79), C.ink, { noAO: 1 });
      a.add(rbox(0.44, 0.66, 0.1, 0.05), TR(0, 0.33, 0.68), '#5b4a6e');
      for (i = -1; i <= 1; i += 2) for (j = 0; j < 2; j++) { a.add(rbox(0.3, 0.3, 0.08, 0.05), TR(i * (0.72 + j * 0.42), 0.74, 0.58), C.glass, { noAO: 1 }); a.add(rbox(0.3, 0.26, 0.08, 0.05), TR(i * (0.72 + j * 0.42), 0.32, 0.58), C.glass, { noAO: 1 }); }
      a.add(rod(0.025, 0.6, 5), TR(0, 2.8, 0.16), '#8a8a99', { noAO: 1 }); a.add(tri([[0, 2.86], [0.42, 2.98], [0, 3.1]]), TR(0, 0, 0.16), '#3ecf62', { noAO: 1 }); return 2.6; },
    bridge: function (a, pal) {
      a.add(rcyl(1.0, 0.08, 0.04, 28), TR(0, 0.0, 0.05, 0, 1.95, 1, 0.78), pal ? pal.w0 : '#27b4ea', { noAO: 1, g: 0.2 });
      RB.forEach(function (c, i) { a.add(arc(1.46 - i * 0.17, 0.1, Math.PI, 26), TR(0, 0.1, 0, 0, 1, 1, 1.5), c, { noAO: 1, g: 0.35 }); });
      [-1, 1].forEach(function (sd) { a.add(sph(0.62, 14, 8), TR(sd * 1.5, 0.02, 0.25, 0, 1, 0.3, 0.8), C.sand, { noAO: 1 }); palm(a, sd * 1.55, 0.1, 0.3, 0.5, sd); }); return 1.7; },
    crane: function (a) { var i, Y = C.gold, D = C.gold2;      // a lattice tower and jib, a cabin, a hook with a load
      a.add(rbox(2.1, 0.2, 0.9, 0.08), TR(0.1, 0.1, 0), '#f0544f');
      [-1, 1].forEach(function (sd) { a.add(rbox(0.09, 2.3, 0.09, 0.03), TR(-0.6 + sd * 0.2, 1.3, 0.2), Y); a.add(rbox(0.09, 2.3, 0.09, 0.03), TR(-0.6 + sd * 0.2, 1.3, -0.2), D); });
      for (i = 0; i < 6; i++) { a.add(rbox(0.5, 0.07, 0.07, 0.02), TR(-0.6, 0.3 + i * 0.4, 0.2), Y, { noAO: 1 }); if (i < 5) a.add(rbox(0.56, 0.06, 0.06, 0.02), TR(-0.6, 0.5 + i * 0.4, 0.21, 0, 1, 1, 1, 0, i % 2 ? 0.75 : -0.75), D, { noAO: 1 }); }
      a.add(rbox(2.3, 0.09, 0.3, 0.03), TR(0.15, 2.5, 0), Y, { noAO: 1 }); a.add(rbox(1.7, 0.07, 0.07, 0.02), TR(0.45, 2.74, 0, 0, 1, 1, 1, 0, -0.14), D, { noAO: 1 });
      for (i = 0; i < 4; i++) a.add(rbox(0.06, 0.24 - i * 0.04, 0.06, 0.02), TR(-0.15 + i * 0.4, 2.62 - i * 0.025, 0.12), D, { noAO: 1 });
      a.add(rbox(0.52, 0.42, 0.46, 0.1), TR(-0.6, 2.28, 0.06), '#ffe08a', { noAO: 1 }); a.add(rbox(0.3, 0.2, 0.08, 0.04), TR(-0.6, 2.3, 0.28), C.glass, { noAO: 1 });
      a.add(rod(0.022, 0.75, 5), TR(0.85, 2.06, 0), C.ink, { noAO: 1 }); a.add(arc(0.1, 0.035, Math.PI * 1.4, 10), TR(0.85, 1.6, 0, 0, 1, 1, 1, 0, Math.PI), '#8a8a99', { noAO: 1 });
      a.add(rbox(0.8, 0.5, 0.5, 0.08), TR(0.85, 1.22, 0), '#e2483f', { noAO: 1 }); a.add(rbox(0.86, 0.08, 0.56, 0.03), TR(0.85, 1.22, 0), '#b9302a', { noAO: 1 }); return 2.85; },
    slide: function (a) { var i;                           // a ladder, a platform with blue hoops, a chute between two red walls that ends flat
      a.add(rbox(2.0, 0.09, 0.66, 0.04).applyMatrix4(TR(0.3, 0.92, 0, 0, 1, 1, 1, 0, -0.66)), null, '#e6e9f0'); a.add(rbox(0.8, 0.09, 0.66, 0.04), TR(1.42, 0.27, 0), '#e6e9f0');
      a.add(rbox(0.6, 0.1, 0.7, 0.04), TR(-0.72, 1.56, 0), '#e6e9f0', { noAO: 1 });
      [-1, 1].forEach(function (sd) { a.add(rbox(2.0, 0.26, 0.09, 0.04).applyMatrix4(TR(0.3, 1.02, sd * 0.36, 0, 1, 1, 1, 0, -0.66)), null, '#ef3e5b', { noAO: 1 }); a.add(rbox(0.8, 0.22, 0.09, 0.04), TR(1.42, 0.36, sd * 0.36), '#ef3e5b', { noAO: 1 });
        a.add(rbox(0.1, 1.56, 0.1, 0.04), TR(-0.98, 0.78, sd * 0.3), '#ef3e5b'); a.add(rbox(0.1, 1.56, 0.1, 0.04), TR(-0.46, 0.78, sd * 0.3), '#d92f4c'); a.add(arc(0.26, 0.055, Math.PI, 12), TR(-0.72, 1.6, sd * 0.3), '#33b5ff', { noAO: 1 }); a.add(rbox(0.1, 0.3, 0.1, 0.03), TR(1.7, 0.14, sd * 0.3), '#d92f4c'); });
      for (i = 0; i < 4; i++) a.add(rbox(0.1, 0.07, 0.62, 0.03), TR(-0.98, 0.3 + i * 0.34, 0), '#ef3e5b', { noAO: 1 }); return 2.0; },
    wheel: function (a) { var cy = 1.35, i;
      a.add(rbox(1.9, 0.12, 0.6, 0.05), TR(0, 0.06, 0), '#e6e3f0'); [-1, 1].forEach(function (sd) { a.add(rod(0.05, 1.45, 6), TR(sd * 0.36, 0.7, 0.14, 0, 1, 1, 1, 0, sd * 0.5), '#f1eef7'); });
      a.add(new THREE.TorusGeometry(1.0, 0.065, 8, 36), TR(0, cy, 0), '#9b6bff', { noAO: 1, g: 0.3 }); a.add(new THREE.TorusGeometry(0.58, 0.04, 6, 28), TR(0, cy, 0), C.gold, { noAO: 1, g: 0.3 });
      for (i = 0; i < 4; i++) a.add(rod(0.028, 1.95, 5), TR(0, cy, 0, 0, 1, 1, 1, 0, i * Math.PI / 4), C.gold2, { noAO: 1, g: 0.2 });
      for (i = 0; i < 8; i++) { var an = i * Math.PI / 4; a.add(rbox(0.3, 0.26, 0.26, 0.08), TR(Math.cos(an) * 1.0, cy + Math.sin(an) * 1.0 - 0.06, 0.06), i % 2 ? '#b9a3ff' : '#8a63f0', { noAO: 1 }); }
      a.add(sph(0.17, 12, 8), TR(0, cy, 0.08), C.gold, { noAO: 1 }); return 2.45; },
    fountain: function (a) {
      a.add(lathe([[0, 0], [0.5, 0], [0.56, 0.05], [0.5, 0.12], [0.2, 0.2], [0.15, 0.5], [0.3, 0.62], [0.8, 0.8], [1.02, 0.98], [1.04, 1.06], [0.96, 1.08], [0.9, 1.0], [0, 0.94]], 22), null, '#f4f1fa');
      a.add(rcyl(0.9, 0.06, 0.02, 20), TR(0, 0.99, 0), '#7fd4ff', { noAO: 1, g: 0.2 });
      [[0, 1.5, 0.24], [-0.34, 1.36, 0.2], [0.34, 1.36, 0.2], [-0.58, 1.14, 0.15], [0.58, 1.14, 0.15], [0, 1.2, 0.2], [-0.8, 1.5, 0.07], [0.82, 1.62, 0.06]].forEach(function (b) { a.add(sph(b[2], 10, 8), TR(b[0], b[1], 0), '#8fdcff', { noAO: 1, g: 0.4 }); }); return 1.75; },
    abacus: function (a) { var rows = ['#ff5a5f', '#4aa8ff', '#ffc83d', '#4cd964'], xs = [-0.58, -0.36, -0.14, 0.36, 0.58], F = '#ff6a3d';
      a.add(rbox(2.0, 0.2, 0.34, 0.09), TR(0, 0.1, 0), F); a.add(rbox(2.0, 0.2, 0.34, 0.09), TR(0, 1.72, 0), F, { noAO: 1 }); [-1, 1].forEach(function (sd) { a.add(rbox(0.2, 1.8, 0.34, 0.09), TR(sd * 0.9, 0.91, 0), F); });
      rows.forEach(function (c, r) { var y = 1.42 - r * 0.34; a.add(rod(0.025, 1.6, 5), TR(0, y, 0, 0, 1, 1, 1, 0, Math.PI / 2), '#8a8a99', { noAO: 1 }); xs.forEach(function (bx, k) { a.add(sph(0.145, 10, 8), TR((r % 2 ? -bx : bx), y, 0, 0, 0.72, 1, 1), c, { noAO: 1, g: 0.6 }); }); }); return 1.85; },
    magnifier: function (a) {
      a.add(rod(0.13, 0.75, 8), TR(0.62, 0.52, 0, 0, 1, 1, 1, 0, Math.PI / 4), '#8b4fcf', { noAO: 1 }); a.add(rod(0.09, 0.2, 8), TR(0.3, 0.84, 0, 0, 1, 1, 1, 0, Math.PI / 4), '#5b4a6e', { noAO: 1 });
      a.add(new THREE.TorusGeometry(0.66, 0.13, 10, 32), TR(-0.2, 1.36, 0), '#5257e0', { noAO: 1, g: 0.5 }); a.add(rcyl(0.62, 0.08, 0.03, 26), TR(-0.2, 1.36, -0.04, 0, 1, 1, 1, Math.PI / 2), '#8fdcff', { noAO: 1, g: 0.3 });
      a.add(sph(0.16, 10, 6), TR(-0.42, 1.6, 0.06, 0, 1.2, 0.7, 0.2, 0, 0.6), '#ffffff', { noAO: 1, g: 0 }); return 2.15; },
    temple: function (a) { var i;
      a.add(rbox(2.3, 0.16, 1.4, 0.05), TR(0, 0.08, 0), '#cfcbe0'); a.add(rbox(2.05, 0.14, 1.2, 0.05), TR(0, 0.23, 0), C.stone); a.add(rbox(1.7, 1.05, 0.7, 0.05), TR(0, 0.82, -0.15), '#b6b0cf', { noAO: 1 });
      for (i = 0; i < 4; i++) a.add(rcyl(0.13, 1.05, 0.03, 10), TR(-0.75 + i * 0.5, 0.3, 0.4), '#f1eef7', { noAO: 1 });
      a.add(rbox(2.1, 0.16, 1.25, 0.05), TR(0, 1.43, 0), C.stone, { noAO: 1 }); a.add(prism(2.25, 0.58, 1.3, 0.06), TR(0, 1.48, 0), '#d8d4e8', { noAO: 1 }); return 2.05; },
    torii: function (a) {
      [-1, 1].forEach(function (sd) { a.add(rcyl(0.17, 0.22, 0.04, 10), TR(sd * 0.75, 0, 0), C.ink); a.add(rcyl(0.12, 1.85, 0.04, 10), TR(sd * 0.75, 0.1, 0), '#ff5a3d'); });
      a.add(rbox(1.95, 0.15, 0.2, 0.05), TR(0, 1.38, 0), '#ff5a3d', { noAO: 1 }); a.add(rbox(2.25, 0.15, 0.26, 0.05), TR(0, 1.82, 0), '#ff7a3d', { noAO: 1 }); a.add(rbox(2.6, 0.2, 0.34, 0.08), TR(0, 2.0, 0), C.ink, { noAO: 1 }); return 2.1; }
  };
  BUILD.tower = BUILD.manor; BUILD.pyramid = BUILD.house3; BUILD.gate = BUILD.torii;
  // the game's own picture of every landmark (for ?art=emoji and for the flat fallback)
  var ART = { tent: '26fa', house: '1f3e0', house2: '1f3e1', house3: '1f3e0', manor: '1f3e1', double: '1f3d8', school: '1f3eb', bridge: 'bridge', crane: '1f3d7', slide: '1f6dd', wheel: '1f3a1', fountain: '26f2', abacus: '1f9ee', magnifier: '1f50d', temple: '1f3db', torii: '26e9', tower: '1f3e1', pyramid: '1f3e0', gate: '26e9' };
  // which picture of the game has a model. Every other picture stands in the world as itself
  var MODEL = { '26fa': 'tent', '1f6d6': 'hut', '1f3e0': 'house', '1f3e1': 'garden', '1f3d8': 'double', '1f3eb': 'school', '1f3f0': 'castle', bridge: 'bridge', '26e9': 'torii', '1f3db': 'temple', '1f3d7': 'crane', '1f6dd': 'slide', '1f3a1': 'wheel', '26f2': 'fountain', '1f9ee': 'abacus', '1f50d': 'magnifier' };
  return { MODEL: MODEL, Acc: Acc, TR: TR, rbox: rbox, sph: sph, lathe: lathe, rcyl: rcyl, rod: rod, prism: prism, tri: tri, smooth: smooth, C: C, BUILD: BUILD, ART: ART,
    bush: bush, tree: tree, pine: pine, palm: palm, tulip: tulip, flower: flower, rock: rock, mountain: mountain, cloud: cloud, boat: boat };
})();
