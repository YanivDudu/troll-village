// troll3d.js: THE troll of the game as a living toy character that can turn around. In the game it is the companion on the 3D camp (camp3d.js) and on the 3D
// maps (map3d.js); every other screen, and every device without 3D, shows the drawn troll (TrollArt.trollSVG) made from the same spec.
// Needs three.js r147 (classic build, global THREE) and toy3d.js (global Toy: the accumulator and the rounded shapes). Optional: items-data.js (the pictures of the shop items as data URLs).
//   var t = Troll3D.create(spec, { scale })      spec is THE SAME object TrollArt.trollSVG takes: { id, body, hairColor, hair 0-5, acc, eyes 0-2, hatE, faceE, handE }
//   scene.add(t.root);  t.cam = camera;  every frame: t.update(dt)
//   t.goTo(x, z, {run, face, done})  t.path(pts, loop, run)  t.follow(target)  t.turnTo(heading)  t.lookAt(x, y, z)  t.play(name, done)  t.setMood(name)
//   t.sit({warm})  t.lie()  t.sleep()  t.stand()  t.carry('book' | 'stick' | 'pebbles' | null)  t.pose({...}) = one frozen frame
//   Troll3D.snapshot({ spec, size, mood, angle, pose })  Troll3D.draw(ctx, x, y, {...})  Troll3D.spriteSheet(spec)  = flat uses
// The troll is ONE skinned mesh (one draw call) built from rounded shapes with baked vertex colours + one small mesh for the picture items (billboards from one atlas) + a soft blob shadow.
// Drawn in the units of the SVG: 1 unit = 75 px of the 200 x 262 viewBox, the feet stand on y = 0 (the SVG's y = 256), the front faces +z.
// Sides are named as in the SVG: L = the left of the PICTURE (x < 0), R = the right of the picture (x > 0; the hand that waves and holds).
// All motion is procedural and a pure function of the state (time, gait phase, posture weights, action progress, face values), so any frame can be frozen with pose().
var Troll3D = (function () {
  'use strict';
  var TR = Toy.TR, PI = Math.PI, V3 = THREE.Vector3, NA = { noAO: 1 }, FL = { noAO: 1, g: 0 }, EX = { noAO: 1, g: 0, exact: 1 };
  var INK = '#3b2a55', MOUTH = '#6b2140', TONGUE = '#ff7aa8', BLUSH = '#ff5f93';
  var U = 1 / 75, ZS = 0.88, HZ = -0.2, ZH = 0.66;      // ZS: depth of the body against its width; HZ, ZH: the hair sits a little behind the axis and is flatter than wide, so that the forehead stays free as in the drawing
  function X(x) { return (x - 100) * U; }
  function Y(y) { return (256 - y) * U; }
  function C(c) { return new THREE.Color(c); }
  function mix(a, b, t) { return '#' + C(a).lerp(C(b), t).getHexString(); }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ss(a, b, x) { x = cl((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function win(u, a, b, e) { return ss(a, a + e, u) * (1 - ss(b - e, b, u)); }
  function wrap(a) { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; }
  function key(u, K) { var n = K.length, i; if (u <= K[0]) return K[1]; for (i = 2; i < n; i += 2) if (u < K[i]) return lerp(K[i - 1], K[i + 1], ss(K[i - 2], K[i], u)); return K[n - 1]; }

  // ---------- colour: the helpers of the SVG troll (TrollArt), so that every derived colour is the same ----------
  function hx(hex) { var h = String(hex).replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function shade(hex, f) { var c = hx(hex); return '#' + c.map(function (x) { return ('0' + cl(Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f), 0, 255).toString(16)).slice(-2); }).join(''); }
  function tone(hex, k) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return hex;
    var c = hx(hex), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, h = 0, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    var y = ((h - 60 + 540) % 360) - 180, a;
    if (k < 0) { a = Math.min(-k * 30, 180 - Math.abs(y)); y += y > 0 ? a : -a; l *= 1 + k; s *= 1 + k * .6; }
    else { a = Math.min(k * 30, Math.abs(y)); y -= y > 0 ? a : -a; l += (1 - l) * k; }
    h = (y + 60 + 360) % 360;
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function ch(t) { t = (t + 360) % 360; var v = t < 60 ? p + (q - p) * t / 60 : t < 180 ? q : t < 240 ? p + (q - p) * (240 - t) / 60 : p; return ('0' + Math.round(v * 255).toString(16)).slice(-2); }
    return '#' + ch(h + 120) + ch(h) + ch(h - 120);
  }
  function soft(hex, k) { var a = hx(tone(hex, k)), b = hx(hex); return '#' + a.map(function (x, i) { return ('0' + Math.round((x + b[i] * (1 + k)) / 2).toString(16)).slice(-2); }).join(''); }

  // ---------- the egg: the body path of the SVG turned around its axis ----------
  function bez(a, b, c, d, t) { var m = 1 - t; return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d; }
  var EGG = [], EY = [], ER = [];
  (function () { var i, t, N = 40;
    for (i = 0; i <= 6; i++) { t = i / 6; EGG.push([(bez(100, 140, 166, 166, t) - 100) * U, Y(bez(246, 246, 226, 186, t))]); }
    for (i = 1; i <= 8; i++) { t = i / 8; EGG.push([(bez(166, 166, 150, 100, t) - 100) * U, Y(bez(186, 140, 96, 96, t))]); }
    for (i = 0; i <= N; i++) { t = i / N; EY.push(Y(bez(246, 246, 226, 186, t))); ER.push((bez(100, 140, 166, 166, t) - 100) * U); }
    for (i = 1; i <= N; i++) { t = i / N; EY.push(Y(bez(186, 140, 96, 96, t))); ER.push((bez(166, 166, 150, 100, t) - 100) * U); } })();
  function eggR(y) { var n = EY.length, i; if (y <= EY[0] || y >= EY[n - 1]) return 0; for (i = 1; i < n; i++) if (y <= EY[i]) return lerp(ER[i - 1], ER[i], (y - EY[i - 1]) / (EY[i] - EY[i - 1] || 1)); return 0; }
  // the point of the front of the body that is drawn at x, y of the picture, and its normal
  function surf(x, y) { var r = eggR(y), dr = (eggR(y + 0.01) - eggR(y - 0.01)) / 0.02, zz = Math.sqrt(Math.max(0.0009, r * r - x * x)), nx = x, ny = -r * dr, nz = zz / ZS, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
    return { x: x, y: y, z: zz * ZS, nx: nx, ny: ny, nz: nz, yaw: Math.atan2(nx, nz), pit: Math.asin(cl(ny, -1, 1)) }; }
  function sz(x, y) { var r = eggR(y); return ZS * Math.sqrt(Math.max(0.0009, r * r - x * x)); }

  // ---------- shapes ----------
  var US = {};
  function us(ws, hs) { var k = ws + '_' + hs; return US[k] || (US[k] = new THREE.SphereGeometry(1, ws, hs)); }
  // a tube along a smooth curve through pts [x, y, z, radius, (radius2)], with rounded ends (the same builder as the animals)
  function limb(pts, seg, sub, c0, c1) {
    var n = pts.length, cv = new THREE.CatmullRomCurve3(pts.map(function (p) { return new V3(p[0], p[1], p[2]); })), Rn = (n - 1) * sub + 1, pos = [], tt = [], idx = [], rings = [], i, j;
    var T = new V3(), N = new V3(1, 0, 0), B = new V3(), P = new V3();
    function ring(Pc, rx, ry, t) { var b0 = pos.length / 3; for (j = 0; j < seg; j++) { var a = 2 * PI * j / seg, ca = Math.cos(a) * rx, sa = Math.sin(a) * ry; pos.push(Pc.x + N.x * ca + B.x * sa, Pc.y + N.y * ca + B.y * sa, Pc.z + N.z * ca + B.z * sa); tt.push(t); } rings.push(b0); }
    function pole(Pc, t) { pos.push(Pc.x, Pc.y, Pc.z); tt.push(t); return pos.length / 3 - 1; }
    var p0 = -1, p1 = -1, Q = new V3();
    for (i = 0; i < Rn; i++) { var t = i / (Rn - 1), f = t * (n - 1), i0 = Math.min(n - 2, Math.floor(f)), fr = f - i0, sm = fr * fr * (3 - 2 * fr), A = pts[i0], Bp = pts[i0 + 1];
      var rx = lerp(A[3], Bp[3], sm), ry = lerp(A[4] == null ? A[3] : A[4], Bp[4] == null ? Bp[3] : Bp[4], sm);
      cv.getPoint(t, P); cv.getTangent(t, T).normalize();
      if (i === 0 && Math.abs(T.x) > 0.9) N.set(0, 0, 1);
      N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
      if (i === 0 && c0 > 0) { var r0 = (rx + ry) / 2 * c0; p0 = pole(Q.copy(P).addScaledVector(T, -r0), 0); ring(Q.copy(P).addScaledVector(T, -r0 * 0.62), rx * 0.74, ry * 0.74, 0); }
      ring(P, rx, ry, t);
      if (i === Rn - 1 && c1 > 0) { var r1 = (rx + ry) / 2 * c1; ring(Q.copy(P).addScaledVector(T, r1 * 0.62), rx * 0.74, ry * 0.74, 1); p1 = pole(Q.copy(P).addScaledVector(T, r1), 1); } }
    for (i = 0; i < rings.length - 1; i++) for (j = 0; j < seg; j++) { var a0 = rings[i] + j, a1 = rings[i] + (j + 1) % seg, b0 = rings[i + 1] + j, b1 = rings[i + 1] + (j + 1) % seg; idx.push(a0, b0, a1, a1, b0, b1); }
    for (j = 0; j < seg; j++) { if (p0 >= 0) idx.push(p0, rings[0] + j, rings[0] + (j + 1) % seg); if (p1 >= 0) { var L = rings[rings.length - 1]; idx.push(p1, L + (j + 1) % seg, L + j); } }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    var r0i = rings[Math.min(1, rings.length - 1)], cx = 0, cy = 0, cz = 0; for (j = 0; j < seg; j++) { cx += pos[(r0i + j) * 3] / seg; cy += pos[(r0i + j) * 3 + 1] / seg; cz += pos[(r0i + j) * 3 + 2] / seg; }
    var Nn = g.attributes.normal; if ((pos[r0i * 3] - cx) * Nn.getX(r0i) + (pos[r0i * 3 + 1] - cy) * Nn.getY(r0i) + (pos[r0i * 3 + 2] - cz) * Nn.getZ(r0i) < 0) { for (i = 0; i < idx.length; i += 3) { var sw = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = sw; } g.setIndex(idx); g.computeVertexNormals(); }
    g.userData.t = tt; return g; }
  // a part of a ball that faces +z: the ball has its centre at the origin, radius R; ang = the half angle of the cap
  function cap(R, ws, hs, ang) { return new THREE.SphereGeometry(R, ws, hs, 0, 2 * PI, 0, ang).rotateX(PI / 2); }
  // a flat disc (or a part of one) in the picture plane, as rings: laid on the body by decal()
  function disc(rx, ry, seg, rings, a0, a1) { var pos = [0, 0, 0], idx = [], i, j, full = a0 == null, n = full ? seg : seg + 1; a0 = a0 || 0; a1 = a1 == null ? 2 * PI : a1;
    for (j = 1; j <= rings; j++) for (i = 0; i < n; i++) { var a = a0 + (a1 - a0) * i / seg, f = j / rings; pos.push(Math.cos(a) * rx * f, Math.sin(a) * ry * f, 0); }
    for (i = 0; i < (full ? seg : seg); i++) { var i1 = full ? (i + 1) % seg : i + 1; if (!full && i1 >= n) break; idx.push(0, 1 + i, 1 + i1); for (j = 1; j < rings; j++) { var A = 1 + (j - 1) * n + i, B = 1 + (j - 1) * n + i1, Cc = 1 + j * n + i, D = 1 + j * n + i1; idx.push(A, Cc, B, B, Cc, D); } }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; }
  // lays a flat shape (drawn around 0, 0) on the front of the body at the picture point cx, cy: x and y stay exactly where the SVG draws them
  function decal(g, cx, cy, lift) { var P = g.attributes.position, N = new Float32Array(P.count * 3), i; for (i = 0; i < P.count; i++) { var s = surf(cx + P.getX(i), cy + P.getY(i)); P.setXYZ(i, s.x, s.y, s.z + lift); N[i * 3] = s.nx; N[i * 3 + 1] = s.ny; N[i * 3 + 2] = s.nz; } g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); return g; }
  function welded(g) { g.computeVertexNormals(); return g; }
  // a lathe whose radius is changed around the axis (strands of hair), with smooth normals over the seam
  function ripple(pts, seg, fn) { var g = Toy.lathe(pts, seg), P = g.attributes.position, n = pts.length, i, j, y0 = pts[0][1], y1 = pts[n - 1][1];
    for (i = 0; i < P.count; i++) { var x = P.getX(i), z = P.getZ(i), y = P.getY(i), k = (y - y0) / (y1 - y0), a = Math.atan2(z, x), o = fn(a, k, x, y, z); P.setXYZ(i, x * o[0] + (o[2] || 0), y, z * o[0] * o[1] + (o[3] || 0)); }
    g.computeVertexNormals(); var Nn = g.attributes.normal; for (j = 0; j < n; j++) { var a0 = j, a1 = seg * n + j, nx = Nn.getX(a0) + Nn.getX(a1), ny = Nn.getY(a0) + Nn.getY(a1), nz = Nn.getZ(a0) + Nn.getZ(a1), l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; Nn.setXYZ(a0, nx / l, ny / l, nz / l); Nn.setXYZ(a1, nx / l, ny / l, nz / l); } return g; }
  function ext(pts, depth, bev) { var s = new THREE.Shape(); pts.forEach(function (p, i) { i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); }); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 1, curveSegments: 1 }); g.translate(0, 0, -depth / 2); return Toy.smooth(g, 50); }
  function star(R, r, depth) { var p = [], i; for (i = 0; i < 10; i++) { var a = PI / 2 + i * PI / 5, q = i % 2 ? r : R; p.push([Math.cos(a) * q, Math.sin(a) * q]); } return ext(p, depth, 0.02); }
  // the band of a crown: a ring whose upper edge rises to n points; open inside
  function crownG(r0, r1, yb, ym, yt, n, sg, th) { var S = n * sg, pos = [], idx = [], j, w;
    for (w = 0; w < 2; w++) for (j = 0; j < S; j++) { var a = 2 * PI * (j - sg / 2) / S, u = (j % sg) / sg, pk = 1 - Math.abs(2 * u - 1), ra = r0 - w * th, rt = lerp(r0 * 1.04, r1, pk) - w * th, sn = Math.sin(a), cs = Math.cos(a);
      pos.push(ra * sn, yb, ra * cs, ra * 1.03 * sn, ym, ra * 1.03 * cs, rt * sn, lerp(ym, yt, pk), rt * cs); }
    for (w = 0; w < 2; w++) for (j = 0; j < S; j++) { var A = (w * S + j) * 3, B = (w * S + (j + 1) % S) * 3, r; for (r = 0; r < 2; r++) { if (w === 0) idx.push(A + r, B + r, A + r + 1, B + r, B + r + 1, A + r + 1); else idx.push(A + r, A + r + 1, B + r, B + r, A + r + 1, B + r + 1); } }
    for (j = 0; j < S; j++) { var o = j * 3 + 2, o2 = ((j + 1) % S) * 3 + 2, q = (S + j) * 3 + 2, q2 = (S + (j + 1) % S) * 3 + 2; idx.push(o, o2, q, o2, q2, q); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  var qq = new THREE.Quaternion(), UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0), dd = new V3();
  function stick(p0, p1, r, r1, seg) { dd.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); var len = dd.length(); qq.setFromUnitVectors(UP, dd.normalize());
    return new THREE.CylinderGeometry(r1 == null ? r : r1, r, len, seg || 5, 1, false).applyMatrix4(new THREE.Matrix4().compose(new V3((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2), qq, new V3(1, 1, 1))); }

  // ---------- the rig builder: Toy.Acc + one bone (or a chain of bones) per shape ----------
  function Rig() { this.a = new Toy.Acc(); this.si = []; this.sw = []; this.bones = []; this.idx = {}; this.piv = {}; this.parts = {}; this.part = 'body'; }
  Rig.prototype.bone = function (name, parent, x, y, z, order, restY) { var b = new THREE.Bone(), pp = parent ? this.piv[parent] : [0, 0, 0]; b.name = name; b.position.set(x - pp[0], y - pp[1], z - pp[2]); b.rotation.order = order || 'YXZ'; if (restY) b.rotation.y = restY;
    b.userData.rest = b.position.clone(); b.userData.ry = restY || 0; b.userData.pp = pp; this.piv[name] = [x, y, z]; this.idx[name] = this.bones.length; this.bones.push(b); if (parent) this.bones[this.idx[parent]].add(b); return b; };
  // bone: a name | a list of names (a chain along the shape's t) | { h: [bone0, bone1, y0, y1] } (two bones by height)
  Rig.prototype.put = function (bone, geom, mat, color, o) { var n0 = this.a.p.length / 3, i0 = this.a.i.length; o = o || {}; this.a.add(geom, mat, o.exact ? '#ffffff' : color, o); var n1 = this.a.p.length / 3, i, ch = bone instanceof Array ? bone : null, hh = bone && bone.h, b = ch || hh ? 0 : this.idx[bone], tt = geom.userData.t, P = this.a.p, Cc = this.a.c;
    if (!ch && !hh && b == null) throw new Error('no bone ' + bone);
    this.parts[this.part] = (this.parts[this.part] || 0) + (this.a.i.length - i0) / 3;
    for (i = n0; i < n1; i++) {
      if (o.exact) { var cc = color(0, P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); Cc[i * 3] = cc.r; Cc[i * 3 + 1] = cc.g; Cc[i * 3 + 2] = cc.b; }
      if (ch) { var nb = ch.length, f = tt[i - n0] * nb - 0.5; if (f <= 0) { this.si.push(this.idx[ch[0]], 0, 0, 0); this.sw.push(1, 0, 0, 0); } else if (f >= nb - 1) { this.si.push(this.idx[ch[nb - 1]], 0, 0, 0); this.sw.push(1, 0, 0, 0); }
        else { var j0 = Math.floor(f), w = f - j0; w = w * w * (3 - 2 * w); this.si.push(this.idx[ch[j0]], this.idx[ch[j0 + 1]], 0, 0); this.sw.push(1 - w, w, 0, 0); } }
      else if (hh) { var w2 = ss(hh[2], hh[3], P[i * 3 + 1]); this.si.push(this.idx[hh[0]], this.idx[hh[1]], 0, 0); this.sw.push(1 - w2, w2, 0, 0); }
      else { this.si.push(b, 0, 0, 0); this.sw.push(1, 0, 0, 0); } } return this; };
  Rig.prototype.E = function (bone, x, y, z, rx, ry, rz, color, ws, hs, o, yaw, pit, roll) { return this.put(bone, us(ws || 10, hs || 7), TR(x, y, z, yaw || 0, rx, ry, rz, pit || 0, roll || 0), color, o); };
  Rig.prototype.limb = function (bone, pts, seg, sub, c0, c1, color, o) { var g = limb(pts, seg, sub, c0, c1); if (typeof color === 'function') { var k = 0, tt = g.userData.t, fn = color, cc = new THREE.Color(); color = function () { return cc.set(fn(tt[k++])); }; } return this.put(bone, g, null, color, o); };
  Rig.prototype.build = function (look) { var g = this.a.geom(false); g.deleteAttribute('aSway'); g.userData = {};
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    var grp = new THREE.Group(); grp.add(this.bones[0]); grp.updateMatrixWorld(true);
    var sk = new THREE.Skeleton(this.bones), m = new THREE.SkinnedMesh(g, look.mat); grp.add(m); m.bind(sk, new THREE.Matrix4()); m.frustumCulled = false; m.castShadow = true;
    return { group: grp, mesh: m, skeleton: sk, tris: g.index.count / 3, verts: g.attributes.position.count }; };

  // ---------- the face of the SVG: every mood is the same row of parameters (copied from TrollArt.MOODS) ----------
  var MOODS = {
    happy:     { mouth: 'smile', arms: ['down', 'down'] },
    think:     { look: [.5, -.8], mouth: 'o', arms: ['down', 'chin'], brow: [0, 4, -5, 4] },
    cheer:     { eye: 'joy', mouth: 'grin', arms: ['up', 'up'] },
    sad:       { look: [0, .85], mouth: 'frown', arms: ['down', 'down'], brow: [5, 20, 5, 20], tear: 1 },
    curious:   { look: [-.75, .35], mouth: 'osmall', arms: ['down', 'chin'], brow: [1, 2, -7, 6], tilt: -6 },
    surprised: { eye: 'wide', mouth: 'bigO', arms: ['out', 'out'], brow: [-7, 6, -7, 6] },
    proud:     { look: [.15, -.3], lidB: .24, mouth: 'wide', arms: ['hips', 'hips'], brow: [-3, 5, -3, 5] },
    focused:   { look: [-.7, .75], mouth: 'tongue', arms: ['down', 'down'], brow: [5, -7, 5, -7] },
    sleepy:    { look: [0, .7], lid: .58, mouth: 'yawn', arms: ['down', 'down'], brow: [1, 10, 1, 10], zz: 1 },
    wave:      { mouth: 'open', arms: ['down', 'wave'], brow: [-3, 5, -3, 5] },
    oops:      { look: [.55, -.45], mouth: 'wobble', arms: ['down', 'head'], brow: [0, 13, -2, 13], blush: 1 },
    // the faces of the camp life and of the motions
    sit:       { look: [-.62, .72], lidB: .2, mouth: 'smile', arms: ['warm', 'warm'], brow: [-2, 4, -2, 4] },
    sitn:      { look: [-.62, .72], lid: .42, mouth: 'small', arms: ['warm', 'warm'], brow: [1, 8, 1, 8] },
    stretch:   { eye: 'joy', mouth: 'bigO', arms: ['up', 'up'], brow: [-6, 8, -6, 8] },
    yawn:      { look: [0, .5], lid: .62, mouth: 'bigO', arms: ['down', 'chin'], brow: [-2, 12, -2, 12] },
    sky:       { look: [-.3, -1], mouth: 'osmall', arms: ['down', 'down'], brow: [-6, 5, -6, 5] },
    dance:     { eye: 'joy', mouth: 'grin', arms: ['up', 'hips'] },
    asleep:    { look: [0, .7], lid: 1, mouth: 'small', arms: ['out', 'out'], brow: [1, 8, 1, 8], zz: 1 },
    carry:     { look: [0, .5], mouth: 'smile', arms: ['carry', 'carry'] }
  };
  var MOOD11 = ['happy', 'think', 'cheer', 'sad', 'curious', 'surprised', 'proud', 'focused', 'sleepy', 'wave', 'oops'], ALIAS = { waving: 'wave' };
  // an arm of the picture's left side, as in the SVG (start x, y, control dx, dy, end dx, dy), plus what the flat drawing has not: the depth z of shoulder, elbow, hand ({ s: d } = d in front of the body)
  var ARMS = {
    down:  { p: [44, 188, -18, 16, -10, 40], z: [0, 0.04, 0.1] },
    up:    { p: [50, 180, -28, -16, -24, -56], z: [0, 0, 0.06] },
    chin:  { p: [37, 200, -8, 30, 30, 10], z: [0.1, { s: 0.1 }, { s: 0.13 }] },
    wave:  { p: [48, 186, -32, -8, -31, -54], z: [0, 0.03, 0.1] },
    hips:  { p: [46, 184, -32, 10, -7, 38], z: [0, -0.1, { s: 0.09 }] },
    head:  { p: [48, 186, -38, -8, -19, -58], z: [0, 0.03, 0.14] },
    out:   { p: [44, 196, -18, 4, -31, -12], z: [0, 0.12, 0.3] },
    warm:  { p: [40, 198, -12, 14, 13, 23], z: [0.1, { s: 0.16 }, { s: 0.34 }] },
    carry: { p: [40, 200, -10, 18, 31, 14], z: [0.1, { s: 0.12 }, { s: 0.2 }] },
    tuck:  { p: [42, 196, -6, 22, 12, 26], z: [0.1, { s: 0.08 }, { s: 0.1 }] }
  };
  function zOf(z, x, y) { return typeof z === 'number' ? z : sz(x, y) + z.s; }
  // 9 numbers of an arm: shoulder, elbow, hand (x, y, z) in the units of the model; right = the mirror
  function armPts(name, right) { var a = ARMS[name] || ARMS.down, p = a.p, k = right ? -1 : 1, sx = X(p[0]), sy = Y(p[1]), mx = sx + (2 * p[2] + p[4]) / 4 * U, my = sy - (2 * p[3] + p[5]) / 4 * U, wx = sx + p[4] * U, wy = sy - p[5] * U;
    return [k * sx, sy, zOf(a.z[0], sx, sy), k * mx, my, zOf(a.z[1], mx, my), k * wx, wy, zOf(a.z[2], wx, wy)]; }
  var ARMP = {}; (function () { for (var k in ARMS) ARMP[k] = [armPts(k, false), armPts(k, true)]; })();
  // mouths: a line through 5 bones (x from, to, the heights), an oval O, a half disc D (open, grin), a tongue T: all in the px of the SVG
  function qv(y0, yc) { return [0.1, 0.3, 0.5, 0.7, 0.9].map(function (t) { return y0 + 2 * t * (1 - t) * (yc - y0); }); }
  var MOUTHS = {
    smile: { x: [82, 118], y: qv(196, 216) }, wide: { x: [78, 122], y: qv(194, 222) }, small: { x: [91, 109], y: qv(201, 207) }, frown: { x: [84, 116], y: qv(208, 193) },
    wobble: { x: [84, 114], y: [201.5, 199.6, 206.2, 199.6, 201.5] }, tongue: { x: [88, 106], y: [200.9, 202.6, 203.2, 202.9, 201.6], T: [109, 204, 6, 6] },
    o: { O: [104, 202, 6, 7] }, osmall: { O: [98, 202, 5, 5.5] }, yawn: { O: [100, 203, 6, 4.5] }, bigO: { O: [100, 206, 10, 12], T: [100, 212, 6, 4] },
    grin: { D: [100, 193, 22, 19], T: [100, 209, 10, 7] }, open: { D: [100, 195, 18, 14], T: [100, 207, 7, 5] }
  };
  var FKEYS = ['lx', 'ly', 'lk', 'lid', 'lidB', 'wide', 'joy', 'brow', 'b0', 'b1', 'b2', 'b3', 'tilt', 'blush', 'tear', 'zz', 'mx0', 'mx1', 'my0', 'my1', 'my2', 'my3', 'my4', 'mon', 'ox', 'oy', 'orx', 'ory', 'dy', 'dw', 'dh', 'tx', 'ty', 'tw', 'th'];
  function faceOf(name) { var m = MOODS[name] || MOODS.happy, M = MOUTHS[m.mouth] || MOUTHS.smile, L = M.x ? M : MOUTHS.smile, b = m.brow || [0, 0, 0, 0];
    return { lx: m.look ? m.look[0] : 0, ly: m.look ? m.look[1] : 0, lk: m.look ? 1 : 0, lid: m.lid || 0, lidB: m.lidB || 0, wide: m.eye === 'wide' ? 1 : 0, joy: m.eye === 'joy' ? 1 : 0, brow: m.brow ? 1 : 0, b0: b[0], b1: b[1], b2: b[2], b3: b[3], tilt: m.tilt || 0, blush: m.blush || 0, tear: m.tear || 0, zz: m.zz || 0,
      mx0: L.x[0], mx1: L.x[1], my0: L.y[0], my1: L.y[1], my2: L.y[2], my3: L.y[3], my4: L.y[4], mon: M.x ? 1 : 0,
      ox: M.O ? M.O[0] : 100, oy: M.O ? M.O[1] : 203, orx: M.O ? M.O[2] : 0, ory: M.O ? M.O[3] : 0, dy: M.D ? M.D[1] : 194, dw: M.D ? M.D[2] : 0, dh: M.D ? M.D[3] : 0,
      tx: M.T ? M.T[0] : 100, ty: M.T ? M.T[1] : 208, tw: M.T ? M.T[2] : 0, th: M.T ? M.T[3] : 0 }; }
  var FACE = {}; (function () { for (var k in MOODS) FACE[k] = faceOf(k); })();

  // ---------- hair: the six silhouettes of the game as volumes (the front is the SVG's outline; the side and the back are designed here) ----------
  function hq(p0, c, p1, t) { return [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]]; }
  function hairBuild(R, hs, col) { var lt = C(tone(col, 0.3)), dk = C(tone(col, -0.22)), base = C(col), tmp = new THREE.Color(), H = { h: ['hair0', 'hair1', Y(104), Y(40)] }, i;
    function strands(n, tw) { return function (k, x, y, z) { var a = Math.atan2((z - HZ) / ZH, x), s = Math.sin(n * a + tw * y + 0.6); return tmp.copy(base).lerp(s > 0 ? lt : dk, Math.abs(s) * 0.42); }; }
    function spine(pts, zs) { return pts.map(function (p) { return [X(p[0]), Y(p[1]), HZ + (p[3] || 0), p[2] * U, p[2] * U * (zs || 0.74)]; }); }
    R.bone('hair0', 'body', 0, Y(112), HZ); R.bone('hair1', 'hair0', 0, Y(62), HZ);
    R.part = 'hair';
    if (hs === 0) {                                   // the tall tuft: a flame of strands that turns as it rises, the tip leans back
      var pts = [[0.004, Y(128)], [0.5, Y(127)]]; for (i = 0; i <= 9; i++) { var q = hq([56, 120], [36, 44], [100, 4], i / 9); pts.push([Math.max(0.004, (100 - q[0]) * U), Y(q[1])]); }
      R.put(H, ripple(pts, 21, function (a, k) { return [1 + 0.05 * Math.sin(7 * a + 5 * k) * ss(0, 0.2, k), ZH, 0, HZ - 0.22 * k * k]; }), null, strands(7, 2.4), { noAO: 1, g: 0.5 });
    } else if (hs === 1) {                            // the three spikes of the picture + one that points back; a low cap joins them
      var cone = function (len, r) { return Toy.lathe([[r, 0], [r * 0.97, len * 0.12], [r * 0.52, len * 0.55], [r * 0.2, len * 0.88], [r * 0.09, len * 0.97], [0.004, len]], 9); };
      R.put(H, Toy.lathe([[0.004, Y(128)], [0.5, Y(126)], [0.6, Y(112)], [0.66, Y(94)], [0.6, Y(84)], [0.4, Y(79)], [0.004, Y(78)]], 14), TR(0, 0, HZ, 0, 1, 1, ZH), col, { noAO: 1, g: 0.6 });
      R.put(H, cone(1.12, 0.38), TR(0, Y(91), HZ + 0.02, 0, 1, 1, ZH + 0.1), tone(col, 0.08), { noAO: 1, g: 0.4 });
      [-1, 1].forEach(function (s) { R.put(H, cone(0.84, 0.34), TR(s * 0.42, Y(96), HZ, 0, 1, 1, ZH + 0.1, 0, -s * 0.4), col, { noAO: 1, g: 0.4 }); R.put(H, cone(0.74, 0.3), TR(s * 0.2, Y(92), HZ - 0.16, 0, 1, 1, 1, -0.62, -s * 0.22), tone(col, -0.1), { noAO: 1, g: 0.4 }); });
    } else if (hs === 2) {                            // the cloud of balls: the four of the picture + two behind
      [[100, 96, 36, 0], [64, 82, 32, 0.02], [136, 82, 32, 0.02], [100, 52, 40, 0], [84, 74, 30, -0.36], [118, 70, 30, -0.36]].forEach(function (b) { R.E(H, X(b[0]), Y(b[1]), HZ + b[3], b[2] * U, b[2] * U, b[2] * U * (b[3] ? 0.8 : 0.78), col, 9, 6, { noAO: 1, g: 0.55 }); });
    } else if (hs === 3) {                            // the wave: a thick lock that rises to the right and curls back at the top
      R.limb(H, spine([[97, 118, 44], [99, 88, 53], [110, 62, 49], [128, 40, 33], [140, 23, 18], [133, 10, 9], [122, 5, 2.5]]), 12, 2, 0.6, 1, function (t) { return mix(col, tone(col, 0.32), 0.5 * win(t, 0.15, 0.9, 0.3)); }, { noAO: 1, g: 0.5 });
      R.limb(H, spine([[82, 110, 26, -0.28], [86, 80, 27, -0.34], [100, 58, 20, -0.3], [112, 46, 8, -0.2]], 0.8), 8, 2, 0.6, 1, tone(col, -0.12), { noAO: 1, g: 0.5 });
    } else if (hs === 4) {                            // two pigtails with their beads, each on its own two bones, and a cap of hair between them
      R.E('hair0', 0, Y(100), HZ + 0.04, 28 * U, 28 * U, 28 * U * 0.8, col, 10, 6, { noAO: 1, g: 0.5 });
      [-1, 1].forEach(function (s) { var n = s < 0 ? 'L' : 'R', mk = function (x) { return s < 0 ? x : 200 - x; };
        R.bone('pig' + n + '0', 'hair0', X(mk(84)), Y(106), HZ); R.bone('pig' + n + '1', 'pig' + n + '0', X(mk(46)), Y(64), HZ);
        R.limb(['pig' + n + '0', 'pig' + n + '1'], [[88, 109, 13], [66, 88, 20], [45, 64, 21.5], [28, 38, 13.5], [18.5, 19, 2.5]].map(function (p) { return [X(mk(p[0])), Y(p[1]), HZ + 0.02, p[2] * U, p[2] * U * 0.62]; }), 8, 2, 0.5, 1, function (t) { return mix(col, tone(col, t > 0.55 ? 0.25 : -0.12), 0.45); }, { noAO: 1, g: 0.4 });
        R.E('pig' + n + '0', X(mk(53)), Y(84), HZ + 0.2, 8.5 * U, 8.5 * U, 7 * U, tone(col, 0.5), 6, 4, NA); });
    } else {                                          // the flame with three points that leans to the right, and a lock behind
      R.limb(H, spine([[90, 122, 31], [83, 84, 30], [89, 50, 21], [101, 24, 10.5], [113.5, 7, 2.5]]), 9, 2, 0.6, 1, function (t) { return mix(col, tone(col, 0.3), 0.55 * win(t, 0.1, 0.9, 0.3)); }, { noAO: 1, g: 0.5 });
      R.limb(H, spine([[114, 120, 29, 0.03], [121, 74, 24, 0.03], [131, 42, 12.5, 0.03], [141.5, 23, 2.5, 0.03]]), 8, 2, 0.6, 1, col, { noAO: 1, g: 0.5 });
      R.limb(H, spine([[126, 118, 21, 0.06], [139, 86, 16.5, 0.06], [150, 69, 9, 0.06], [159.5, 60.5, 2.5, 0.06]]), 7, 2, 0.6, 1, tone(col, -0.1), { noAO: 1, g: 0.5 });
      R.limb(H, spine([[100, 116, 30, -0.26], [104, 78, 24, -0.36], [112, 50, 12, -0.4], [120, 34, 3, -0.4]], 0.9), 6, 2, 0.6, 1, tone(col, -0.14), { noAO: 1, g: 0.5 });
    }
    R.part = 'body'; }

  // ---------- the code-drawn accessories of the shop as parts of the model ----------
  var ACC = {
    glasses: function (R, o) { o = o || {}; var col = o.col || INK, z = sz(X(76), Y(160)) + 0.11, yy = Y(160), r = (o.r || 21) * U;
      [-1, 1].forEach(function (s) { R.put('face', new THREE.TorusGeometry(r, 0.032, 4, 14), TR(s * 24 * U, yy, z), col, FL); if (o.glass) R.put('face', cap(r * 2.2, 10, 2, 0.46), TR(s * 24 * U, yy, z - r * 2.2 * 0.9 + 0.01), o.glass, { noAO: 1, g: 0.3 });
        R.put('face', stick([s * (24 * U + r), yy + 0.02, z], [s * 0.86, yy + 0.06, 0.1], 0.026, 0.026, 4), null, col, FL); });
      R.put('face', stick([-3.5 * U, yy + 0.03, z], [3.5 * U, yy + 0.03, z], 0.028, 0.028, 4), null, col, FL); },
    sunglasses: function (R, o) { o = o || {}; var col = o.col || INK, z = sz(X(74), Y(162)) + 0.1, pts = [[-20, 10], [20, 10], [20, 0], [17, -9], [10, -15], [0, -17.5], [-10, -15], [-17, -9], [-20, 0]].map(function (p) { return [p[0] * U, p[1] * U]; });
      [-1, 1].forEach(function (s) { R.put('face', ext(pts, 0.05, 0.015), TR(s * 26 * U, Y(160), z, s * 0.16), col, { noAO: 1, g: 0.5 });
        R.put('face', stick([s * 34 * U, Y(155), z + 0.05], [s * 25 * U, Y(155), z + 0.056], 0.016, 0.016, 3), null, '#a79bc0', FL);
        R.put('face', stick([s * 46 * U, Y(154), z - 0.02], [s * 0.87, Y(156), 0.1], 0.026, 0.026, 4), null, col, FL); });
      R.put('face', stick([-8 * U, Y(154), z + 0.01], [8 * U, Y(154), z + 0.01], 0.034, 0.034, 4), null, col, FL); },
    bowtie: function (R) { var p = surf(0, Y(228)), g = Toy.lathe([[0.15, 0], [0.13, 0.05], [0.03, 0.25], [0.004, 0.27]], 8);
      [-1, 1].forEach(function (s) { R.put('body', g, TR(p.x + s * 0.27, p.y, p.z + 0.03, 0, 1, 1, 0.5, 0, s * PI / 2), '#3aa0ff', NA); });
      R.E('body', 0, p.y, p.z + 0.05, 0.085, 0.085, 0.07, '#1f6fc9', 8, 5, NA); },
    scarf: function (R) { var n = 18, pos = [], idx = [], i, j, m = 5, col = C('#ff6a3d');
      for (i = 0; i < n; i++) { var a = 2 * PI * i / n, cy = Y(234) + 14 * U * (1 - Math.cos(a)), rr = eggR(cy) + 0.035, cx = Math.sin(a) * rr, cz = Math.cos(a) * rr * ZS; for (j = 0; j < m; j++) { var b = 2 * PI * j / m, ro = Math.cos(b) * 0.05, up = Math.sin(b) * 0.115; pos.push(cx + Math.sin(a) * ro, cy + up, cz + Math.cos(a) * ro); } }
      for (i = 0; i < n; i++) for (j = 0; j < m; j++) { var A = i * m + j, B = i * m + (j + 1) % m, Cc = ((i + 1) % n) * m + j, D = ((i + 1) % n) * m + (j + 1) % m; idx.push(A, Cc, B, B, Cc, D); }
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); R.put('body', g, null, '#ff6a3d', { noAO: 1, g: 0.7 });
      var t0 = surf(X(134), Y(238)); R.bone('scarfT', 'body', t0.x, t0.y + 0.02, t0.z + 0.04);
      R.E('scarfT', t0.x + 0.04, t0.y - 0.13, t0.z + 0.07, 0.14, 0.2, 0.05, '#ff6a3d', 7, 5, { noAO: 1, g: 0.8 }, 0.4, 0.12, 0.2);
      R.put('scarfT', new THREE.BoxGeometry(0.25, 0.045, 0.1), TR(t0.x + 0.06, t0.y - 0.2, t0.z + 0.08, 0.4, 1, 1, 1, 0.12, 0.2), '#ffd23f', FL);
      [60, 84, 110].forEach(function (x) { var s = surf(X(x + 2), Y(x === 60 ? 231 : x === 84 ? 238 : 239)); R.put('body', new THREE.BoxGeometry(0.045, 0.17, 0.03), TR(s.x, s.y, s.z + 0.075, s.yaw, 1, 1, 1, -s.pit), '#ffd23f', FL); }); },
    headphones: function (R) { var pts = [], i, tilt = 0.26;
      for (i = 0; i <= 8; i++) { var a = PI * i / 8, x = -Math.cos(a) * 65 * U, h = Math.sin(a) * 68 * U; pts.push([x, Y(158) + h * Math.cos(tilt), 0.02 + h * Math.sin(tilt), 0.055]); }
      R.limb('body', pts, 5, 1, 0, 0, INK, { noAO: 1, g: 0.3 });
      [-1, 1].forEach(function (s) { R.E('body', s * 67 * U, Y(164), 0.03, 0.15, 0.27, 0.17, '#ff4f9a', 8, 6, { noAO: 1, g: 0.6 }); R.E('body', s * 77 * U, Y(164), 0.03, 0.05, 0.16, 0.12, '#e0367f', 6, 4, NA); }); },
    star: function (R) { R.put('body', star(17 * U, 7.5 * U, 0.07), TR(X(140), Y(108), 0.22, 0.3, 1, 1, 1, -0.2), '#ffd23f', { noAO: 1, g: 0.5 }); },
    butterfly: function (R) { var x = X(60), y = Y(100), z = 0.2; R.bone('fly', 'body', x, y, z);
      [-1, 1].forEach(function (s) { R.E('fly', x + s * 0.13, y + 0.08, z, 0.15, 0.12, 0.035, '#a57bff', 7, 4, NA, s * 0.5, 0, 0.26); R.E('fly', x + s * 0.1, y - 0.09, z, 0.11, 0.095, 0.03, '#ff6fae', 7, 4, NA, s * 0.5, 0, 0.26); });
      R.E('fly', x, y, z + 0.02, 0.03, 0.16, 0.03, INK, 5, 4, FL, 0, 0, 0.26); },
    balloon: function (R) { R.bone('bal0', 'body', X(166), Y(226), 0.1); R.bone('bal1', 'bal0', X(180), Y(150), 0.1);
      R.limb(['bal0', 'bal1'], [[X(166), Y(226), 0.1, 0.012], [X(175), Y(186), 0.1, 0.012], [X(180), Y(148), 0.1, 0.012]], 3, 2, 0, 0, INK, FL);
      R.E('bal1', X(180), Y(122), 0.1, 19 * U, 25 * U, 19 * U, '#ff4f6a', 10, 7, { noAO: 1, g: 0.6 }); R.put('bal1', new THREE.ConeGeometry(0.06, 0.09, 5), TR(X(180), Y(148), 0.1), '#ff4f6a', NA); },
    wand: function (R) { var x = -56 * U, y = Y(188) - L1 - L2; R.put('handL', new THREE.CylinderGeometry(0.04, 0.04, 0.78, 6), TR(x - 0.11, y + 0.343, 0.1, 0, 1, 1, 1, 0, 0.31), '#8e5cff', { noAO: 1, g: 0.5 });
      R.put('handL', star(16 * U, 7 * U, 0.07), TR(x - 0.256, y + 0.8, 0.1, 0, 1, 1, 1, 0, 0.31), '#ffd23f', { noAO: 1, g: 0.5 }); },
    necklace: function (R) { [[70, 222], [80, 229], [92, 233], [108, 233], [120, 229], [130, 222]].forEach(function (b) { var s = surf(X(b[0]), Y(b[1])); R.E('body', s.x, s.y, s.z + 0.02, 5 * U, 5 * U, 5 * U, '#ffd23f', 5, 3, NA); });
      var p = surf(0, Y(241)); R.put('body', new THREE.OctahedronGeometry(1), TR(p.x, p.y, p.z + 0.04, 0, 7 * U, 9 * U, 4 * U), '#ff4f9a', NA); },
    bow: function (R, o) { o = o || {}; var k = o.k || 1, x = o.x == null ? X(142) : o.x, y = o.y == null ? Y(112) : o.y, z = o.z == null ? 0.2 : o.z, rz = o.rz == null ? -0.31 : o.rz, g = Toy.lathe([[0.19, 0], [0.17, 0.06], [0.04, 0.27], [0.004, 0.29]], 8);
      [-1, 1].forEach(function (s) { R.put('body', g, TR(x + s * 0.29 * k * Math.cos(rz), y + s * 0.29 * k * Math.sin(rz), z, 0, k, k, 0.55 * k, 0, s * PI / 2 + rz), o.col || '#ff4f9a', { noAO: 1, g: 0.5 }); });
      R.E('body', x, y, z + 0.03 * k, 0.095 * k, 0.095 * k, 0.085 * k, o.knot || '#ffc1dc', 8, 5, NA); },
    crown: function (R) { var z = 0.2, y = Y(113);
      R.put('body', crownG(0.37, 0.47, y, y + 16 * U, y + 43 * U, 6, 4, 0.035), TR(0, 0, z), function (k) { return C('#f2a100').lerp(C('#ffe27a'), k); }, FL);
      [[0, 14, '#ff4f9a', 5], [-0.95, 11, '#5bb8ff', 3.8], [0.95, 11, '#5bb8ff', 3.8]].forEach(function (g) { R.E('body', Math.sin(g[0]) * 0.385, y + g[1] * U * 0.8, z + Math.cos(g[0]) * 0.385 + 0.01, g[3] * U, g[3] * U, g[3] * U * 0.8, g[2], 6, 4, NA); }); },
    flower: function (R) { var x = X(60), y = Y(112), z = 0.24, i; for (i = 0; i < 5; i++) { var a = PI / 2 + i * 2 * PI / 5; R.E('body', x + Math.cos(a) * 0.14, y + Math.sin(a) * 0.14, z, 0.115, 0.115, 0.05, '#ffffff', 8, 4, { noAO: 1, g: 0.3 }, -0.45, -0.25); }
      R.E('body', x - 0.02, y + 0.01, z + 0.045, 0.09, 0.09, 0.06, '#ffd23f', 8, 5, NA, -0.45, -0.25); },
    hat: function (R) { var x = X(128), y = Y(112), w = C('#ffffff'), b = C('#5bd1ff');
      R.put('body', Toy.lathe([[0.3, 0], [0.3, 0.03], [0.02, 0.72], [0.004, 0.74]], 14), TR(x, y, 0.08, 0, 1, 1, 1, 0.12, -0.28), function (k) { return (k > 0.2 && k < 0.29) || (k > 0.47 && k < 0.56) || k < 0.05 ? w : b; }, FL);
      R.E('body', x + 0.205, y + 0.705, 0.165, 0.105, 0.105, 0.105, '#ffd23f', 8, 6, NA); }
  };
  var BACK = {
    wings: function (R) { var pts = [], i; for (i = 0; i <= 7; i++) pts.push(hq([52, 186], [-14, 120], [4, 196], i / 7)); for (i = 1; i <= 7; i++) pts.push(hq([4, 196], [-6, 236], [54, 216], i / 7));
      [-1, 1].forEach(function (s) { var n = s < 0 ? 'wingL' : 'wingR', g = ext(pts.map(function (p) { return [s < 0 ? X(p[0]) : -X(p[0]), Y(p[1])]; }), 0.05, 0.03); R.bone(n, 'body', s * 0.5, Y(196), -0.4);
        R.put(n, g, TR(s * 0.06, 0, -0.42, s * 0.22), function (k, x, y) { return C(Math.abs(x) > 1.12 ? '#cfeaff' : '#ffffff'); }, { noAO: 1, g: 0.25 }); }); }
  };
  // the picture items of the shop that got a model: hats by the code of their emoji (the others are billboards)
  var HAT3 = {
    '1f9e2': function (R) { var y = Y(104), z = 0.12; R.put('body', new THREE.SphereGeometry(0.41, 10, 4, 0, 2 * PI, 0, PI / 2), TR(0, y, z, 0, 1, 0.82, 1, 0.14), '#4f8ef7', { noAO: 1, g: 0.6 });
      R.E('body', -0.06, y + 0.02, z + 0.43, 0.33, 0.045, 0.3, '#3a6fe0', 10, 4, NA, -0.2, 0.2); R.E('body', 0, y + 0.345, z - 0.045, 0.05, 0.035, 0.05, '#3a6fe0', 6, 4, NA); },
    '1f3a9': function (R) { var y = Y(102), z = 0.1, m = TR(0, y, z, 0, 1, 1, 1, 0.1, -0.1); R.put('body', Toy.lathe([[0.004, 0], [0.39, 0], [0.41, 0.025], [0.39, 0.055], [0.004, 0.06]], 12), m, '#4a3d63', { noAO: 1, g: 0.4 });
      R.put('body', Toy.lathe([[0.26, 0], [0.275, 0.3], [0.29, 0.46], [0.26, 0.5], [0.004, 0.505]], 11), m, function (k) { return C(k > 0.1 && k < 0.3 ? '#e2504c' : '#4a3d63'); }, { noAO: 1, g: 0.3 }); },
    '1f393': function (R) { var y = Y(101), z = 0.1, m = TR(0, y, z, 0.6, 1, 1, 1, 0.12); R.put('body', Toy.lathe([[0.3, 0], [0.31, 0.06], [0.28, 0.2], [0.004, 0.21]], 10), m, '#3f3357', { noAO: 1, g: 0.4 });
      R.put('body', new THREE.BoxGeometry(0.66, 0.055, 0.66), TR(0, y + 0.23, z + 0.03, 0.6, 1, 1, 1, 0.12), '#544670', { noAO: 1, g: 0.3 }); R.E('body', 0, y + 0.27, z + 0.03, 0.05, 0.03, 0.05, '#ff9f1c', 6, 3, NA);
      R.limb('body', [[0, y + 0.27, z + 0.04, 0.018], [0.3, y + 0.25, z + 0.36, 0.018], [0.36, y + 0.02, z + 0.4, 0.018]], 4, 2, 0, 0, '#ff9f1c', FL); R.E('body', 0.36, y - 0.04, z + 0.4, 0.04, 0.085, 0.04, '#ff9f1c', 5, 4, NA); },
    '1f452': function (R) { var y = Y(102), z = 0.08, m = TR(0, y, z, 0, 1, 1, 1, 0.14, 0.06); R.put('body', Toy.lathe([[0.5, 0.02], [0.52, 0.045], [0.47, 0.08], [0.3, 0.11], [0.29, 0.26], [0.22, 0.36], [0.08, 0.41], [0.004, 0.42]], 12), m, function (k) { return C(k > 0.26 && k < 0.5 ? '#ff4f6a' : '#f7b879'); }, { noAO: 1, g: 0.3 });
      ACC.bow(R, { x: 0.02, y: y + 0.16, z: z + 0.34, rz: 0.06, k: 0.5, col: '#ff4f6a', knot: '#e0365a' }); },
    '26d1': function (R) { var y = Y(105), z = 0.1; R.put('body', new THREE.SphereGeometry(0.43, 12, 5, 0, 2 * PI, 0, PI / 2), TR(0, y, z, 0, 1, 0.86, 1, 0.12), '#f0403c', { noAO: 1, g: 0.6 }); R.put('body', new THREE.TorusGeometry(0.44, 0.045, 4, 12), TR(0, y, z, 0, 1, 1, 1, PI / 2 + 0.12), '#d02f38', NA);
      R.E('body', 0, y + 0.19, z + 0.36, 0.13, 0.13, 0.05, '#ffffff', 8, 4, NA, 0, -0.5); R.put('body', new THREE.BoxGeometry(0.16, 0.05, 0.03), TR(0, y + 0.2, z + 0.395, 0, 1, 1, 1, -0.5), '#f0403c', FL); R.put('body', new THREE.BoxGeometry(0.05, 0.16, 0.03), TR(0, y + 0.2, z + 0.395, 0, 1, 1, 1, -0.5), '#f0403c', FL); },
    '1f344': function (R) { var y = Y(100), z = 0.08, i; R.put('body', Toy.lathe([[0.17, 0], [0.16, 0.3]], 8), TR(0, y, z), '#fff0d2', { noAO: 1, g: 0.5 }); R.put('body', new THREE.SphereGeometry(0.43, 12, 5, 0, 2 * PI, 0, PI / 2), TR(0, y + 0.24, z, 0, 1, 0.8, 1, 0.1), '#f0403c', { noAO: 1, g: 0.5 });
      [[0, 0.3], [0.9, 0.9], [-1.0, 0.8], [2.4, 1.0], [-2.3, 0.95], [0.2, 1.25], [3.3, 0.5]].forEach(function (d) { var a = d[0], e = d[1], r = 0.43; R.E('body', Math.sin(a) * Math.sin(e) * r, y + 0.26 + Math.cos(e) * r * 0.8, z + Math.cos(a) * Math.sin(e) * r, 0.075, 0.075, 0.03, '#ffffff', 6, 3, NA, a, -(PI / 2 - e)); }); },
    '1f380': function (R) { ACC.bow(R, { x: 0, y: Y(92), z: 0.16, rz: 0, k: 1.25, col: '#e8384f', knot: '#c2263f' }); }
  };
  var FACE3 = {
    '1f453': function (R) { ACC.glasses(R, { col: '#2f7de0', r: 19.5 }); },
    '1f576': function (R) { ACC.sunglasses(R, { col: '#33293f' }); },
    '1f97d': function (R) { var z = sz(X(76), Y(160)) + 0.1, y = Y(160), pts = [[-48, 14], [48, 14], [50, 0], [44, -15], [0, -11], [-44, -15], [-50, 0]].map(function (p) { return [p[0] * U, p[1] * U]; }), g = ext(pts, 0.1, 0.03), P = g.attributes.position, i;
      for (i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) - 0.5 * P.getX(i) * P.getX(i)); g.computeVertexNormals(); R.put('face', Toy.smooth(g, 60), TR(0, y, z + 0.04), '#49b9f0', { noAO: 1, g: 0.4 });
      [-1, 1].forEach(function (s) { R.put('face', stick([s * 0.6, y, z - 0.12], [s * 0.88, y + 0.02, 0.05], 0.05, 0.05, 4), null, '#6a59b8', FL); }); }
  };
  // what is carried in two hands (camp life): a separate little mesh that hangs on the bone between the hands, only while it is carried
  var PROPS = {
    pebbles: function (a) { [[-0.13, 0.05, 0, 0.15, '#c9c3d6'], [0.12, 0.04, 0.04, 0.13, '#e3deec'], [0, 0.17, -0.02, 0.12, '#b3acc4'], [0.02, 0.05, 0.15, 0.1, '#d8d2e4']].forEach(function (p) { a.add(us(8, 6), TR(p[0], p[1], p[2], p[0] * 9, p[3], p[3] * 0.72, p[3] * 0.9), p[4], NA); }); },
    stick: function (a) { a.add(Toy.rod(0.055, 1.25, 6), TR(0, 0.04, 0.02, 0, 1, 1, 1, 0, PI / 2 - 0.08), '#a8694b', NA); a.add(Toy.rod(0.035, 0.26, 5), TR(0.3, 0.13, 0.02, 0, 1, 1, 1, 0, -0.7), '#a8694b', NA); a.add(us(6, 4), TR(0.4, 0.24, 0.02, 0, 0.09, 0.06, 0.03), '#5fcb49', NA); },
    book: function (a) { a.add(Toy.rbox(0.56, 0.12, 0.42, 0.03, 4), TR(0, 0.05, 0.04, 0, 1, 1, 1, -0.5), '#3aa0ff', NA); a.add(Toy.rbox(0.5, 0.08, 0.4, 0.02, 4), TR(0.015, 0.05, 0.05, 0, 1, 1, 1, -0.5), '#fff7ea', NA); a.add(Toy.rbox(0.2, 0.02, 0.1, 0.008, 4), TR(0, 0.14, 0.13, 0, 1, 1, 1, -0.5), '#ffd23f', NA); }
  };

  // ---------- the troll itself ----------
  var Rc0 = 0, AL0 = 0, EA = 16 * U, EH = 0.085; Rc0 = (EA * EA + EH * EH) / (2 * EH); AL0 = Math.asin(EA / Rc0);
  var L1 = 0.28, L2 = 0.28, MB = [-14.4, -7.2, 0, 7.2, 14.4];
  function cpOf(ch) { return ch ? Array.from(ch).map(function (c) { return c.codePointAt(0).toString(16); }).filter(function (c) { return c !== 'fe0f'; }).join('-') : ''; }
  function buildTroll(R, s, o) { var body = s.body || '#ff8fb1', hairC = s.hairColor || '#8e5cff', hs = s.hair >= 0 && s.hair <= 5 ? s.hair | 0 : 0, i;
    var cBody = C(body), cLo = C(tone(body, -0.13)), cHi = C(tone(body, 0.1)), cLt = C(shade(body, 0.45)), deep = tone(body, -0.48), limbC = soft(body, -0.15), tmp = new THREE.Color(), bl = C(BLUSH);
    function bodyCol(k, x, y, z) { tmp.copy(cLo).lerp(cBody, ss(0.1, 1.1, y)).lerp(cHi, ss(1.1, 2.2, y)); if (z > 0) { var dx = x / (36 * U), dy = (y - Y(218)) / (22 * U), w = 1 - dx * dx - dy * dy; if (w > 0) tmp.lerp(cLt, 0.5 * Math.min(1, w * 1.6)); } return tmp; }
    R.bone('root', null, 0, 0, 0); R.bone('core', 'root', 0, 0, 0); R.bone('body', 'core', 0, 0.5, 0); R.bone('face', 'body', 0, Y(180), 0.6);
    // the egg
    R.put('body', Toy.lathe(EGG, 20), TR(0, 0, 0, 0, 1, 1, ZS), bodyCol, EX);
    // ears: half hidden by the body, a little turned to the front
    R.part = 'ears';
    [-1, 1].forEach(function (sg) { R.E('body', sg * 64.5 * U, Y(166), 0, 14 * U, 18 * U, 0.09, tone(body, 0.04), 8, 5, { noAO: 1, g: 0.3 }, sg * 0.42); R.E('body', sg * 65.5 * U, Y(166), 0.066, 6 * U, 9 * U, 0.035, mix(body, tone(body, -0.22), 0.45), 6, 3, FL, sg * 0.42); });
    // feet (each on its own bone, under the body) with the soles of the sitting troll
    R.part = 'feet';
    [-1, 1].forEach(function (sg) { var n = sg < 0 ? 'legL' : 'legR', x = sg * 26 * U, pad = tone(body, 0.34); R.bone(n, 'core', x, 0.45, 0, 'XYZ');
      R.E(n, x, 10 * U, 0.1, 22 * U, 10 * U, 0.33, limbC, 10, 6, { noAO: 1, g: 0.55 }); R.E(n, x, 0.022, 0.07, 12 * U, 0.03, 0.17, pad, 6, 3, NA);
      [-1, 0, 1].forEach(function (t) { R.E(n, x + t * 0.115, 0.03, 0.31 - Math.abs(t) * 0.035, 0.045, 0.03, 0.045, pad, 4, 2, NA); }); });
    // the face: cheeks, eyes, brows, nose, mouth
    R.part = 'face';
    [-1, 1].forEach(function (sg) { var n = sg < 0 ? 'L' : 'R', cx = sg * 45 * U, cy = Y(189), p = surf(cx, cy); R.bone('cheek' + n, 'face', p.x, p.y, p.z);
      R.put('cheek' + n, decal(disc(13.5 * U, 13.5 * U, 8, 2), cx, cy, 0.012), null, function (k, x, y, z) { var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (13.5 * U), c2 = bodyCol(0, x, y, z); return c2.lerp(bl, 0.74 * cl(1 - d * d, 0, 1)); }, EX); });
    var pr = [7.5, 9.5, 7.5][s.eyes] || 7.5, eyeD = [];
    [-1, 1].forEach(function (sg) { var n = sg < 0 ? 'L' : 'R', p = surf(sg * 24 * U, Y(160)), fy = p.yaw * 0.45, fp = p.pit * 0.45, nf = [Math.sin(fy) * Math.cos(fp), Math.sin(fp), Math.cos(fy) * Math.cos(fp)], back = Rc0 * Math.cos(AL0) - 0.012;
      var cx = p.x - nf[0] * back, cy = p.y - nf[1] * back, cz = p.z - nf[2] * back, bet = Math.asin(pr * U / Rc0), lc = C(tone(body, -0.1)), ld = C(deep).lerp(C(body), 0.25), lb = C(body);
      eyeD.push({ nf: nf, pr: pr });
      R.bone('eye' + n, 'face', cx, cy, cz); R.bone('pup' + n, 'eye' + n, cx, cy, cz); R.bone('lid' + n, 'eye' + n, cx, cy, cz, 'YXZ', fy); R.bone('lib' + n, 'eye' + n, cx, cy, cz, 'YXZ', fy);
      R.put('eye' + n, cap(Rc0 - 0.006, 10, 2, AL0 + 0.085), TR(cx, cy, cz, fy, 1, 1, 1, -fp), mix(body, deep, 0.42), FL);
      R.put('eye' + n, cap(Rc0, 10, 3, AL0), TR(cx, cy, cz, fy, 1, 1, 1, -fp), '#ffffff', { noAO: 1, g: 0.2 });
      R.put('pup' + n, cap(Rc0 + 0.012, 9, 2, bet), TR(cx, cy, cz), INK, { noAO: 1, g: 0.5 });
      R.put('pup' + n, cap(Rc0 + 0.02, 6, 1, Math.asin(3.5 * U / Rc0)), TR(cx, cy, cz, -Math.asin(0.36 * pr * U / Rc0), 1, 1, 1, -Math.asin(0.42 * pr * U / Rc0)), '#ffffff', FL);
      R.put('pup' + n, cap(Rc0 + 0.02, 4, 1, Math.asin(1.6 * U / Rc0)), TR(cx, cy, cz, Math.asin(0.42 * pr * U / Rc0), 1, 1, 1, Math.asin(0.42 * pr * U / Rc0)), '#ffffff', FL);
      R.put('lid' + n, new THREE.SphereGeometry(Rc0 + 0.05, 10, 3, 0, 2 * PI, 0, PI / 2), TR(cx, cy, cz), function (k) { return k < 0.14 ? ld : lc; }, { noAO: 1, g: 0.3 });
      R.put('lib' + n, new THREE.SphereGeometry(Rc0 + 0.046, 8, 2, 0, 2 * PI, PI / 2, PI / 2), TR(cx, cy, cz), function (k) { return k > 0.86 ? ld : lb; }, { noAO: 1, g: 0.2 });
      if (s.eyes === 2) [[61, 150, -7, -5], [66, 145, -4, -8]].forEach(function (l) { var x0 = sg * (100 - l[0]) * -U * -1, a0 = surf(sg < 0 ? X(l[0]) : -X(l[0]), Y(l[1])), a1 = surf(sg < 0 ? X(l[0] + l[2]) : -X(l[0] + l[2]), Y(l[1] + l[3])); R.put('eye' + n, stick([a0.x, a0.y, a0.z + 0.01], [a1.x, a1.y, a1.z + 0.02], 0.026, 0.02, 4), null, INK, FL); });
      // the closed, laughing eye
      R.bone('joy' + n, 'face', p.x, Y(159), p.z);
      R.limb('joy' + n, [[62, 164], [76, 154.6], [90, 164]].map(function (q) { var a = surf(sg < 0 ? X(q[0]) : -X(q[0]), Y(q[1])); return [a.x, a.y, a.z + 0.03, 3 * U]; }), 4, 3, 1, 1, INK, FL);
      // the brow
      var bx = sg * 25 * U, bp = surf(bx, Y(135)); R.bone('brow' + n, 'face', bp.x, bp.y, bp.z);
      R.limb('brow' + n, [-14, 0, 14].map(function (d) { var a = surf(bx + d * U, Y(135) + (1 - d * d / 196) * 2.4 * U); return [a.x, a.y, a.z + 0.024, 2.6 * U]; }), 4, 2, 1, 1, INK, FL); });
    var np = surf(0, Y(180)); R.E('face', 0, np.y, np.z - 0.015, 8 * U, 6 * U, 0.075, soft(body, -0.27), 8, 5, { noAO: 1, g: 0.3 }); R.E('face', -2.6 * U, np.y + 2.2 * U, np.z + 0.045, 3 * U, 1.8 * U, 0.016, mix(soft(body, -0.27), '#ffffff', 0.5), 4, 3, FL, -0.3, -0.3);
    // the mouth: a line on five bones, an oval, a half disc, a tongue
    for (i = 0; i < 5; i++) { var mp = surf(MB[i] * U, Y(202)); R.bone('m' + i, 'face', mp.x, mp.y, mp.z); }
    R.limb(['m0', 'm1', 'm2', 'm3', 'm4'], [-18, -9, 0, 9, 18].map(function (d) { var a = surf(d * U, Y(202)); return [a.x, a.y, a.z + 0.022, 3.2 * U, 2.6 * U]; }), 4, 3, 1, 1, MOUTH, FL);
    var op = surf(0, Y(204)); R.bone('mO', 'face', 0, op.y, op.z); R.put('mO', decal(disc(10 * U, 10 * U, 10, 2), 0, Y(204), 0.02), null, MOUTH, FL);
    var dp = surf(0, Y(194)); R.bone('mD', 'face', 0, dp.y, dp.z); R.put('mD', decal(disc(22 * U, 19 * U, 8, 2, PI, 2 * PI), 0, Y(194), 0.022), null, MOUTH, FL);
    var tp = surf(0, Y(208)); R.bone('mT', 'face', 0, tp.y, tp.z); R.put('mT', decal(disc(10 * U, 10 * U, 8, 1), 0, Y(208), 0.03), null, TONGUE, FL);
    var rp = surf(X(138), Y(188)); R.bone('tear', 'face', rp.x, rp.y, rp.z); R.put('tear', Toy.lathe([[0.004, -0.1], [0.05, -0.07], [0.055, -0.03], [0.03, 0.04], [0.004, 0.1]], 5), TR(rp.x, rp.y, rp.z + 0.02, 0, 1, 1, 0.6), '#7fd4ff', FL);
    // arms: three bones each (shoulder, elbow, hand) that are aimed at the points of the pose
    R.part = 'arms';
    [-1, 1].forEach(function (sg) { var n = sg < 0 ? 'L' : 'R', sx = sg * 56 * U, sy = Y(188);
      R.bone('arm' + n, 'body', sx, sy, 0); R.bone('fore' + n, 'body', sx, sy - L1, 0); R.bone('hand' + n, 'body', sx, sy - L1 - L2, 0);
      R.limb(['arm' + n, 'fore' + n], [[sx, sy, 0, 7.5 * U], [sx, sy - L1, 0, 7.5 * U], [sx, sy - L1 - L2, 0, 7.5 * U]], 6, 3, 1, 0, limbC, { noAO: 1, g: 0.3 });
      R.E('hand' + n, sx, sy - L1 - L2, 0, 9.5 * U, 9.5 * U, 9.5 * U, limbC, 7, 5, { noAO: 1, g: 0.4 }); });
    R.bone('prop', 'body', 0, Y(214), 0.9);
    hairBuild(R, hs, hairC);
    // the back, which the flat drawing never had: a small tuft of the hair's colour low on the back (it cannot be seen from the front)
    var tz = -sz(0, Y(214)); R.part = 'hair'; R.bone('tuft', 'body', 0, Y(214), tz + 0.04);
    R.E('tuft', 0, Y(214), tz - 0.07, 0.15, 0.15, 0.14, hairC, 7, 5, { noAO: 1, g: 0.5 }); R.E('tuft', 0.02, Y(204), tz - 0.17, 0.1, 0.11, 0.1, tone(hairC, 0.15), 5, 3, { noAO: 1, g: 0.5 }, 0, 0.5); R.part = 'body';
    R.part = 'acc';
    var hat = cpOf(s.hatE), fc = cpOf(s.faceE), flat = o.flatItems, used = { hat: false, face: false };
    if (BACK[s.acc]) BACK[s.acc](R); if (ACC[s.acc]) ACC[s.acc](R);
    if (hat && HAT3[hat] && !flat) { HAT3[hat](R); used.hat = true; }
    if (fc && FACE3[fc] && !flat) { FACE3[fc](R); used.face = true; }
    R.part = 'body';
    return { eyes: eyeD, pr: pr, used: used, hs: hs }; }

  // ---------- the look: the toy material of the animals (glossy plastic + rim light) with skinning, the outline for small sizes, the material of the pictures ----------
  var WHITE = new THREE.Color('#ffffff'), LOOK = null;
  var KD = 0.5, KF = 1.16;
  function Look() { var uRim = { value: new THREE.Color('#39382e') }, uOut = { value: 0.035 }, uFill = { value: KF };
    function rim(sh) { sh.uniforms.uRim = uRim; sh.uniforms.uFill = uFill; sh.fragmentShader = 'uniform vec3 uRim;\nuniform float uFill;\n' + sh.fragmentShader.replace('#include <envmap_fragment>', 'float rimK = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);\n outgoingLight += uRim * rimK * (0.35 + diffuseColor.rgb) + diffuseColor.rgb * uFill;\n#include <envmap_fragment>'); }
    var mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 46, specular: 0x1d1d1d }); mat.onBeforeCompile = rim;
    var still = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 46, specular: 0x1d1d1d }); still.onBeforeCompile = rim;
    var out = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, color: 0x67596e });
    out.onBeforeCompile = function (sh) { sh.uniforms.uOut = uOut; sh.vertexShader = 'uniform float uOut;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ) + normalize( normal ) * uOut;'); };
    // set(P, n): the palette of the scene. n = how much the lights of the scene decide (0 by day: the troll keeps the colours of its drawing, lit mostly by its own fill;
    // 1 at night: little fill, the whole tint of the night, and the lights of the scene, a campfire among them, do the rest: dark far from the fire, warm beside it)
    var L = { mat: mat, still: still, out: out, uRim: uRim, uOut: uOut, tint: new THREE.Color('#ffffff'), uFill: uFill, set: function (P, n) { n = n || 0; mat.color.set(P.tint).lerp(WHITE, 0.5 * (1 - n)).multiplyScalar(KD + 0.22 * n); still.color.copy(mat.color); mat.specular.set(P.spec); still.specular.set(P.spec); uRim.value.set(P.rim); uFill.value = KF * (1 - 0.6 * n); out.color.set(P.tint).multiplyScalar(0.55); L.tint.set(P.tint).lerp(WHITE, 0.35 * (1 - n)).multiplyScalar(1 - 0.3 * n); L.blob = P.blob; } }; L.set(DAY); return L; }
  function look0() { return LOOK || (LOOK = Look()); }
  var blobTex = null;
  function blobMesh() { if (typeof document === 'undefined') return null;
    if (!blobTex) { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.55, 'rgba(255,255,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(cv); }
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: 0x145a2d, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.renderOrder = 1; return m; }

  // ---------- the picture items: billboards from one small atlas per troll (hat, face, hand, the "zz" of sleep) ----------
  var IMG = {}, api = { assetRoot: '' };
  function iconURL(cp) { var D = typeof Troll3DItems !== 'undefined' ? Troll3DItems.icon : null; return D && D[cp] ? D[cp] : api.assetRoot + 'assets/ico/' + cp + '.png'; }
  function loadIcon(cp, done) { var e = IMG[cp]; if (e && e.ok) { done(e.img); return; } if (!e) { e = IMG[cp] = { img: new Image(), ok: false, q: [] }; e.img.onload = function () { e.ok = true; e.q.forEach(function (f) { f(e.img); }); e.q = []; }; e.img.src = iconURL(cp); } e.q.push(done); }
  function preload(list, done) { var n = 0, all = (list || []).filter(Boolean); if (!all.length) { done && done(); return; } all.forEach(function (cp) { loadIcon(cp, function () { if (++n === all.length && done) done(); }); }); }
  function specIcons(s) { return [cpOf(s.hatE), cpOf(s.faceE), cpOf(s.handE)].filter(Boolean); }
  var CELL = 128;
  function Cards(T, s, used) { var list = [], me = this; this.T = T; this.list = list;
    if (s.hatE && !used.hat) list.push({ kind: 'hat', cp: cpOf(s.hatE), size: 62 * U });
    if (s.faceE && !used.face) list.push({ kind: 'face', cp: cpOf(s.faceE), size: 72 * U });
    if (s.handE) list.push({ kind: 'hand', cp: cpOf(s.handE), size: 46 * U });
    list.push({ kind: 'zz', size: 50 * U });
    var n = list.length, cv = document.createElement('canvas'); cv.width = CELL * 4; cv.height = CELL; var x = cv.getContext('2d'); this.cv = cv;
    var tex = new THREE.CanvasTexture(cv); tex.premultiplyAlpha = true; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; this.tex = tex;
    list.forEach(function (c, i) { c.cell = i; if (c.kind === 'zz') { x.save(); x.translate(i * CELL, 0); x.scale(CELL / 50, CELL / 50); x.lineCap = x.lineJoin = 'round'; [['#ffffff', 8], ['#6c5a8e', 4]].forEach(function (p) { x.strokeStyle = p[0]; x.lineWidth = p[1]; x.beginPath(); x.moveTo(8, 30); x.lineTo(21, 30); x.lineTo(8, 45); x.lineTo(21, 45); x.moveTo(26, 6); x.lineTo(35, 6); x.lineTo(26, 17); x.lineTo(35, 17); x.stroke(); }); x.restore(); }
      else loadIcon(c.cp, function (img) { try { var t = document.createElement('canvas'), tx; t.width = t.height = CELL; tx = t.getContext('2d'); tx.drawImage(img, 4, 4, CELL - 8, CELL - 8); tx.getImageData(0, 0, 1, 1); x.clearRect(i * CELL, 0, CELL, CELL); x.drawImage(t, i * CELL, 0); tex.needsUpdate = true; T.dirty = true; if (T.onDirty) T.onDirty(); } catch (e) {} }); }); // (a picture that may not be read back, as from file://, is left out: it would poison the atlas and the upload to WebGL would throw)
    var pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [], i;
    for (i = 0; i < n; i++) { var u0 = i / 4, u1 = (i + 1) / 4; uv.set([u0, 0, u1, 0, u1, 1, u0, 1], i * 8); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, premultipliedAlpha: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 3; this.pos = pos; me.count = n; }
  var cW = new V3(), cD = new V3(), cU = new V3(), cR = new V3(), cF = new V3(), cX = new V3(), cT = new V3(), inv = new THREE.Matrix4(), WUP = new V3(0, 1, 0);
  Cards.prototype.update = function (F) { var T = this.T, b = T.b, cam = T.cam, pos = this.pos, list = this.list, i, k;
    T.root.updateMatrixWorld(true); inv.copy(T.root.matrixWorld).invert(); var sc = T.root.matrixWorld.getMaxScaleOnAxis();
    if (T.look.tint) this.mat.color.copy(T.look.tint);
    for (i = 0; i < list.length; i++) { var c = list[i], size = c.size * sc, push = 0, show = 1, bone = b.body;
      if (c.kind === 'hat') { cW.set(0, Y(89.2) - 0.5, 0); push = 0.34; }
      else if (c.kind === 'face') { cW.set(0, Y(157.2) - 0.5, 0); }
      else if (c.kind === 'zz') { cW.set(X(182) + 0.0, Y(108) - 0.5 + 0.1 * Math.sin(T.S.t * 1.6), 0); push = 0.5; show = cl(F.zz, 0, 1); size *= 0.6 + 0.4 * show; }
      else { bone = b.handR; cW.set(6 * U, 6.4 * U, 0); push = 0.24; }
      cW.applyMatrix4(bone.matrixWorld);
      if (cam && cam.isOrthographicCamera) { cam.getWorldDirection(cD).negate(); } else if (cam) cD.copy(cam.position).sub(cW).normalize(); else cD.set(0, 0, 1);
      cU.set(0, 1, 0); if (c.kind === 'hat' || c.kind === 'face') cU.transformDirection(b.body.matrixWorld);
      if (c.kind === 'face') {                           // stays on the face: turns with the head, leans a little towards the viewer, and is not shown from behind
        cF.set(0, 0, 1).transformDirection(b.body.matrixWorld); cX.crossVectors(cU, cF).normalize(); var ang = Math.atan2(cD.dot(cX), cD.dot(cF)), yw = cl(ang * 0.7, -0.75, 0.75); if (Math.abs(ang) > 1.75) show = 0;
        cT.copy(cF).multiplyScalar(Math.cos(yw)).addScaledVector(cX, Math.sin(yw)); cR.copy(cX).multiplyScalar(Math.cos(yw)).addScaledVector(cF, -Math.sin(yw)); cW.addScaledVector(cT, 0.84 * sc); }
      else { cR.crossVectors(cU, cD); if (cR.lengthSq() < 0.01) cR.set(1, 0, 0); cR.normalize(); cW.addScaledVector(cD, push * sc); }
      var h = size / 2 * (show > 0.02 ? 1 : 0);
      for (k = 0; k < 4; k++) { var sx = k === 0 || k === 3 ? -1 : 1, sy = k < 2 ? -1 : 1; cT.copy(cW).addScaledVector(cR, sx * h).addScaledVector(cU, sy * h).applyMatrix4(inv); pos[i * 12 + k * 3] = cT.x; pos[i * 12 + k * 3 + 1] = cT.y; pos[i * 12 + k * 3 + 2] = cT.z; } }
    this.mesh.geometry.attributes.position.needsUpdate = true; };

  // ---------- motion: channels. Everything adds to the channels; write() puts them on the bones ----------
  function chans() { return { rootX: 0, rootY: 0, rootZ: 0, rootRy: 0, sq: 0, sqX: 0, coreRx: 0, coreRz: 0, bodyY: 0, bodyZ: 0, bodyRx: 0, bodyRy: 0, bodyRz: 0, faceY: 0, lid: 0, eyeS: 0, eyeX: 0, eyeY: 0, hairRx: 0, hairRz: 0, hairS: 0, pig: 0, waveR: 0, bal: 0, wing: 0, tail: 0,
    aL: null, aLw: 0, aR: null, aRw: 0, handZ: new Float32Array(2), handY: new Float32Array(2), handX: new Float32Array(2), mood: null, moodW: 0,
    legX: new Float32Array(2), legY: new Float32Array(2), legZ: new Float32Array(2), legRx: new Float32Array(2), legRy: new Float32Array(2), legRz: new Float32Array(2) }; }
  function zero(c) { for (var k in c) { var v = c[k]; if (typeof v === 'number') c[k] = 0; else if (v && v.fill) v.fill(0); else c[k] = null; } }
  var LS = 0, LL = 0;
  function legCyc(p, duty) { p -= Math.floor(p); if (p < duty) { LS = 1 - 2 * p / duty; LL = 0; } else { var q = (p - duty) / (1 - duty); LS = -Math.cos(q * PI); LL = Math.sin(q * PI); } }
  var WV = 1.2, RV = 2.4, WA = 0.36, RA = 0.46, WD = 0.62, RD = 0.45;
  // the walk of a round toy on two short feet: a waddle. g = how much of it, r = 0 walk .. 1 trot, p = phase (one turn = two steps)
  function gait(c, g, r, p, stride) { var i, tp = 2 * PI * p, A = lerp(WA, RA, r) * stride;
    for (i = 0; i < 2; i++) { legCyc(p + i * 0.5, WD); var s = LS, l = LL; if (r > 0) { legCyc(p + i * 0.5, RD); s = lerp(s, LS, r); l = lerp(l, LL, r); }
      c.legZ[i] += g * A * s; c.legY[i] += g * l * lerp(0.11, 0.17, r) * (0.5 + 0.5 * stride); c.legRx[i] += g * -0.55 * l * s; }
    c.bodyY += g * lerp(0.035, 0.07, r) * Math.cos(2 * tp + 0.5) * stride; c.rootY += g * r * 0.07 * Math.abs(Math.sin(tp + 0.4)) * stride;
    c.coreRz += g * lerp(0.075, 0.05, r) * Math.sin(tp + 0.35) * stride; c.bodyRy += g * 0.09 * Math.sin(tp + 0.9) * stride; c.coreRx += g * lerp(0.035, 0.11, r);
    c.sq += g * lerp(0.012, 0.03, r) * Math.cos(2 * tp - 0.4);
    var sw = lerp(0.2, 0.32, r) * stride * g; c.handZ[0] += -sw * Math.sin(tp + 0.2); c.handZ[1] += sw * Math.sin(tp + 0.2); c.handY[0] += 0.04 * g * Math.cos(2 * tp); c.handY[1] += 0.04 * g * Math.cos(2 * tp);
    c.hairRx += g * (lerp(0.05, 0.1, r) * Math.sin(2 * tp - 1.3) - lerp(0.05, 0.16, r)); c.hairRz -= g * 0.1 * Math.sin(tp - 0.75) * stride; c.hairS += g * 0.03 * Math.cos(2 * tp - 1.5); c.pig += g * 0.16 * Math.sin(2 * tp - 1.5); c.bal -= g * lerp(0.18, 0.4, r); c.wing += g * 0.2 * Math.sin(2 * tp - 1); c.tail += g * 0.25 * Math.sin(tp - 1); }
  function sitPose(c, w, warm) { if (w <= 0) return; c.bodyY -= w * 0.15; c.sq -= w * 0.045; c.coreRx -= w * 0.05; var i; for (i = 0; i < 2; i++) { var s = i ? 1 : -1; c.legZ[i] += w * 0.5; c.legY[i] -= w * 0.12; c.legRx[i] -= w * 1.3; c.legRy[i] += w * s * 0.3; c.legX[i] += w * s * 0.16; }
    c.hairRx += w * 0.04; if (warm > 0) { c.aL = c.aR = 'warm'; c.aLw = c.aRw = warm * w; } }
  function liePose(c, w, sl, t) { if (w <= 0) return; c.coreRx -= w * 1.32; c.rootY += w * 0.52; c.rootZ += w * 0.78; var i; for (i = 0; i < 2; i++) { var s = i ? 1 : -1; c.legRx[i] -= w * 0.35; c.legRz[i] += w * s * 0.22; c.legX[i] += w * s * 0.05; }
    c.aL = c.aR = 'out'; c.aLw = c.aRw = w; c.handZ[0] -= w * 0.12; c.handZ[1] -= w * 0.12; c.hairRx -= w * 0.36; c.pig -= w * 0.2; c.bal += w * 1.0; c.lid += sl * 1.2; c.bodyRz += sl * 0.05;
    if (sl > 0) { c.mood = 'asleep'; c.moodW = sl; } }

  // one-shot actions: u = 0..1 progress, at = seconds since the start, w = how much of the troll stands. The numbers of jump, oops, surprised, proud, wave, doze, nod and hop are the keyframes of the SVG troll's CSS.
  var ACT = {
    jump: function (c, u, at, w) { c.sq += key(u, [0, 0, .14, -.12, .42, .09, .56, 0, .8, .05, .9, -.09, 1, 0]); c.rootY += key(u, [0, 0, .14, 0, .42, 34 * U, .56, 36 * U, .8, 4 * U, .9, 0, 1, 0]) * 1.5 * w; c.hairS += key(u, [0, 0, .2, -.07, .5, .12, .94, -.1, 1, 0]); c.hairRx += key(u, [0, 0, .25, .1, .6, -.16, .95, .12, 1, 0]);
      var b = win(u, .14, .9, .2); c.legY[0] += 0.1 * b * w; c.legY[1] += 0.1 * b * w; c.legRx[0] += 0.3 * b * w; c.legRx[1] += 0.3 * b * w; c.pig += key(u, [0, 0, .25, .25, .6, -.4, .95, .3, 1, 0]); c.bal += -0.5 * b; c.wing += 0.9 * b * Math.sin(at * 30); c.handY[0] += 0.08 * b; c.handY[1] += 0.08 * b; },
    hop: function (c, u, at, w) { var h = (u * 2) % 1; c.sq += key(h, [0, 0, .18, -.08, .55, .05, .86, -.06, 1, 0]); c.rootY += key(h, [0, 0, .18, 0, .55, 13 * U, .86, 0, 1, 0]) * 1.4 * w; c.coreRz += key(h, [0, 0, .55, .052, 1, 0]) * (u < 0.5 ? 1 : -1); c.hairS += key(h, [0, 0, .25, -.05, .62, .08, .95, -.06, 1, 0]);
      var i = u < 0.5 ? 0 : 1; c.legY[i] += 0.12 * Math.sin(PI * h) * w; c.legRx[i] += 0.17 * Math.sin(PI * h) * w; c.pig += 0.2 * Math.sin(2 * PI * h - 1); },
    wave: function (c, u, at) { var e = win(u, 0, 1, 0.12); c.aR = 'wave'; c.aRw = e; c.waveR += key(u, [0, 0, .2, -16, .45, 14, .7, -16, .9, 12, 1, 0]) * PI / 180; c.bodyRz -= 0.03 * e; c.hairRz += 0.04 * Math.sin(at * 7 - 1) * e; c.mood = 'wave'; c.moodW = e; },
    proud: function (c, u, at) { c.sq += key(u, [0, 0, .22, -.06, .55, .08, .78, .02, 1, 0]); c.rootY += key(u, [0, 0, .22, 0, .55, 5 * U, .78, U, 1, 0]); c.coreRz += key(u, [0, 0, .55, .035, 1, 0]); c.coreRx -= 0.07 * win(u, .2, 1, .25); c.hairRx -= key(u, [0, 0, .3, -.06, .65, .1, 1, 0]); c.mood = 'proud'; c.moodW = win(u, 0, 1, 0.15); },
    oops: function (c, u, at) { c.coreRz += key(u, [0, 0, .14, .105, .36, -.087, .58, .061, .8, -.026, 1, 0]); c.rootY -= key(u, [0, 0, .14, 2 * U, .36, 0, 1, 0]); c.sq += key(u, [0, 0, .14, -.05, .36, 0, 1, 0]); c.hairRz += key(u, [0, 0, .16, -.14, .4, .122, .62, -.07, .84, .035, 1, 0]); c.pig += key(u, [0, 0, .2, -.3, .44, .25, .66, -.14, .88, .07, 1, 0]); c.bal += key(u, [0, 0, .2, -.4, .5, .3, .8, -.1, 1, 0]); c.mood = 'oops'; c.moodW = win(u, 0, 1, 0.12); },
    surprised: function (c, u, at, w) { c.sq += key(u, [0, 0, .16, -.1, .44, .13, .72, -.05, 1, 0]); c.rootY += key(u, [0, 0, .16, 0, .44, 16 * U, .72, 0, 1, 0]) * 1.3 * w; c.eyeS += key(u, [0, -.4, .3, .18, .6, 0, 1, 0]); c.hairS += key(u, [0, 0, .22, -.06, .52, .14, .8, -.05, 1, 0]); c.pig += key(u, [0, 0, .3, .4, .6, -.2, 1, 0]); c.mood = 'surprised'; c.moodW = win(u, 0, 1, 0.1); },
    nod: function (c, u, at) { var k = key(u, [0, 0, .25, 1, .5, -.1, .75, .8, 1, 0]); c.faceY -= k * 6 * U; c.bodyRx += k * 0.13; c.sq -= k * 0.022; c.hairRx += key(u, [0, 0, .3, -.1, .55, .12, .8, -.08, 1, 0]); c.hairS -= k * 0.05; },
    doze: function (c, u, at) { var k = key(u, [0, 0, .55, 1, 1, 0]); c.rootY -= k * 3 * U; c.coreRz -= k * 0.087; c.sq -= k * 0.025; c.bodyRx += k * 0.1; c.lid += k * 0.35; c.hairRz += key(u, [0, 0, .65, .1, 1, 0]); c.mood = 'sleepy'; c.moodW = win(u, 0, 1, 0.12); },
    dance: function (c, u, at) { var e = win(u, 0, 1, 0.1), a = 2 * PI * u * 2, i; c.coreRz += 0.085 * Math.sin(a) * e; c.rootX += 0.12 * Math.sin(a) * e; c.bodyRy += 0.26 * Math.sin(a - 0.4) * e; c.sq += 0.03 * Math.sin(2 * a) * e; c.rootY += 0.04 * (0.5 - 0.5 * Math.cos(2 * a)) * e;
      for (i = 0; i < 2; i++) { var l = Math.max(0, Math.sin(a + (i ? PI : 0) + 0.6)); c.legY[i] += 0.1 * l * e; c.legRx[i] += 0.2 * l * e; c.legX[i] += (i ? 1 : -1) * 0.05 * l * e; }
      var sw = ss(0.42, 0.58, u); c.aL = sw > 0.5 ? 'up' : 'hips'; c.aR = sw > 0.5 ? 'hips' : 'up'; c.aLw = c.aRw = e * Math.abs(2 * sw - 1); c.handX[0] += 0.07 * Math.sin(2 * a) * e; c.handX[1] += 0.07 * Math.sin(2 * a) * e;
      c.hairRz -= 0.15 * Math.sin(a - 0.9) * e; c.hairS += 0.04 * Math.sin(2 * a - 1.2) * e; c.pig += 0.3 * Math.sin(2 * a - 1.2) * e; c.bal += 0.25 * Math.sin(a - 1) * e; c.wing += 0.4 * Math.sin(2 * a) * e; c.tail += 0.5 * Math.sin(a - 1) * e; c.mood = 'dance'; c.moodW = win(u, 0.03, 0.97, 0.08); },
    yawn: function (c, u, at) { var s1 = win(u, 0, 0.52, 0.14), s2 = win(u, 0.5, 1, 0.14); c.sq += 0.06 * s1 - 0.02 * s2; c.coreRx -= 0.09 * s1; c.rootY += 0.03 * s1; c.hairRx -= 0.1 * s1; c.hairS += 0.05 * s1; c.handX[0] -= 0.05 * s1; c.handX[1] += 0.05 * s1; c.bodyRx += 0.06 * s2; c.coreRz -= 0.04 * s2;
      if (u < 0.51) { c.mood = 'stretch'; c.moodW = s1; } else { c.mood = 'yawn'; c.moodW = s2; } },
    // through a doorway: makes itself narrow and low, the hair bends back under the lintel, the hands come in
    door: function (c, u, at) { var e = win(u, 0, 1, 0.22); c.sqX -= 0.13 * e; c.bodyY -= 0.07 * e; c.coreRx += 0.12 * e; c.hairRx -= 0.55 * e; c.hairS -= 0.12 * e; c.pig -= 0.5 * e; c.aL = c.aR = 'tuck'; c.aLw = c.aRw = e; c.bal -= 0.6 * e; c.lid += 0.15 * e; },
    // bends down and comes up with something in both hands
    pickup: function (c, u, at) { var d = win(u, 0.05, 0.75, 0.25); c.coreRx += 0.5 * d; c.bodyY -= 0.1 * d; c.sq -= 0.05 * d; c.rootZ -= 0.12 * d; c.hairRx += key(u, [0, 0, .3, -.15, .6, .1, 1, 0]); c.handY[0] -= 0.3 * d; c.handY[1] -= 0.3 * d; c.handZ[0] += 0.12 * d; c.handZ[1] += 0.12 * d; c.aL = c.aR = 'carry'; c.aLw = c.aRw = win(u, 0, 1.3, 0.2); },
    cheer: function (c, u, at, w) { ACT.jump(c, u, at, w); c.mood = 'cheer'; c.moodW = win(u, 0, 1, 0.1); }
  };
  var DUR = { jump: 0.7, hop: 0.8, wave: 1.2, proud: 1.0, oops: 0.85, surprised: 0.65, nod: 0.8, doze: 1.3, dance: 4.2, yawn: 2.8, door: 1.9, pickup: 1.5, cheer: 0.7 };
  var MOODACT = { cheer: 'jump', wave: 'wave', proud: 'proud', oops: 'oops', surprised: 'surprised', sleepy: 'doze' };

  var fF = {}, A1 = new Float32Array(9), A2 = new Float32Array(9), v0 = new V3(), v1 = new V3(), v2 = new V3();
  function apply(T) { var S = T.S, c = T.c, b = T.b, t = S.t, sd = T.seed, i, k;
    zero(c);
    var awake = 1 - S.sleepW, still = 1 - S.gaitW, stand = cl(1 - S.sitW - S.lieW, 0, 1);
    // idle life: breathing, hair, a glance (the SVG's idle: 3.8 s breath, hair +-1.4 deg over 5.4 s, blink every 4.6 s, a glance over 9 s)
    var br = Math.sin(t * (2 * PI / (3.8 + 1.6 * S.sleepW)) + sd); c.sq += (0.011 + 0.008 * S.sleepW) * br; c.hairRz += 0.024 * Math.sin(t * 2 * PI / 5.4 + sd * 2) * still; c.hairRx += 0.012 * Math.sin(t * 2 * PI / 4.1 + sd); c.pig += 0.03 * Math.sin(t * 1.3 + sd); c.bal += 0.05 * Math.sin(t * 0.9 + sd); c.wing += 0.05 * Math.sin(t * 1.7 + sd); c.tail += 0.06 * Math.sin(t * 1.1 + sd);
    var bt = (t + sd * 3) % 4.6; if (bt < 0.17 && awake > 0.5) c.lid += Math.sin(PI * bt / 0.17) * 1.2;
    if (S.gaitW > 0.001) gait(c, S.gaitW, S.runW, S.phase, S.stride);
    sitPose(c, S.sitW, S.warmW); liePose(c, S.lieW, S.sleepW, t);
    if (S.carryW > 0 && !(c.aLw > 0.5)) { c.aL = c.aR = 'carry'; c.aLw = c.aRw = Math.max(c.aLw, S.carryW); }
    if (S.act && ACT[S.act]) ACT[S.act](c, S.u, S.u * S.dur, stand);
    // the face of this frame: the mood, or on the way to the face of the action
    var F = S.F; if (c.mood && c.moodW > 0.001) { var G = FACE[c.mood], w = cl(c.moodW, 0, 1); for (k = 0; k < FKEYS.length; k++) fF[FKEYS[k]] = lerp(F[FKEYS[k]], G[FKEYS[k]], w); F = fF; if (!c.aL && !S.carryW) { c.aL = MOODS[c.mood].arms[0]; c.aLw = w; } if (!c.aR && !S.carryW) { c.aR = MOODS[c.mood].arms[1]; c.aRw = w; } }
    T.Fnow = F;
    // gaze: the eyes first, then the whole round body turns a little (the head IS the body); the feet stay
    var gx = S.lookYaw, gy = S.lookPitch; c.bodyRy += gx * 0.55 * awake; c.bodyRx -= gy * 0.3 * awake; c.bodyRy += S.lead; c.coreRz -= S.lean; c.hairRz += S.sway * 0.5; c.hairRx -= S.surge; c.pig += S.surge * 1.5; c.bal -= S.surge * 2; c.tail += S.sway;
    c.coreRz -= F.tilt * PI / 180;
    // ---- write ----
    var o = b.root; o.position.set(c.rootX, c.rootY, c.rootZ); o.rotation.y = c.rootRy; var sy = 1 + c.sq, sx = 1 / Math.sqrt(sy); o.scale.set(sx * (1 + c.sqX), sy * (1 - c.sqX * 0.4), sx);
    b.core.rotation.set(c.coreRx, 0, c.coreRz);
    o = b.body; o.position.set(0, o.userData.rest.y + c.bodyY, c.bodyZ); o.rotation.set(c.bodyRx, cl(c.bodyRy, -1.0, 1.0), c.bodyRz);
    b.face.position.y = b.face.userData.rest.y + c.faceY;
    b.hair0.rotation.set(c.hairRx * 0.6, 0, c.hairRz * 0.6); b.hair1.rotation.set(c.hairRx, 0, c.hairRz); b.hair1.scale.set(1 - c.hairS * 0.4, 1 + c.hairS, 1 - c.hairS * 0.4);
    if (b.pigL0) { b.pigL0.rotation.set(c.hairRx * 0.5, 0, c.pig * 0.5 + c.hairRz * 0.4); b.pigL1.rotation.set(0, 0, c.pig); b.pigR0.rotation.set(c.hairRx * 0.5, 0, -c.pig * 0.5 + c.hairRz * 0.4); b.pigR1.rotation.set(0, 0, -c.pig); }
    for (i = 0; i < 2; i++) { o = T.legs[i]; var r0 = o.userData.rest; o.position.set(r0.x + c.legX[i], r0.y + c.legY[i], r0.z + c.legZ[i]); o.rotation.set(c.legRx[i], c.legRy[i], c.legRz[i]); }
    // eyes
    var small = S.small ? 1 : 0, wide = cl(F.wide, 0, 1), joy = cl(F.joy, 0, 1), open = 1 - joy, es = Math.max(0.001, (1 + 0.125 * wide + c.eyeS) * open), Rpx = 16, pr = T.info.pr * (1 - 0.2 * wide) + small * 1.5, reach = Math.max(1, Rpx * (1 + 0.125 * wide) - pr - 1.5);
    var gl = (1 - cl(F.lk, 0, 1)) * awake * (S.look ? 0 : 1), gt = (t + sd * 7) % 9, gpx = 0, gpy = 0; if (gl > 0) { gpx = key(gt, [0, 0, 2.2, 0, 2.6, -4, 3.9, -4, 4.3, 4, 5.6, 4, 6.0, 0, 6.4, -3 * 0, 9, 0]); gpy = key(gt, [0, 0, 2.2, 0, 2.6, 1, 3.9, 1, 4.3, -1, 5.6, -1, 6.0, -3, 7.2, -3, 7.6, 0, 9, 0]); }
    var lkx = lerp(2, F.lx * reach, cl(F.lk, 0, 1)) + gpx * gl + cl(gx * 1.6 + c.eyeX, -1, 1) * reach, lky = lerp(1, F.ly * reach, cl(F.lk, 0, 1)) + gpy * gl - cl(gy * 2 + c.eyeY, -1, 1) * reach, ll = Math.sqrt(lkx * lkx + lky * lky); if (ll > reach) { lkx *= reach / ll; lky *= reach / ll; }
    var lidT = cl(F.lid + c.lid, 0, 1), lidA = lidT <= 0.01 ? -1.0 : -Math.asin(cl(EA * (1 - 2 * lidT) / Rc0, -0.7, 0.7)) + (lidT > 0.97 ? 0.08 : 0), libT = cl(F.lidB, 0, 0.6), libA = libT <= 0.01 ? 1.0 : Math.asin(cl(EA * (1 - 2 * libT) / Rc0, -0.7, 0.7));
    var ca = Math.cos(AL0), psc = pr / T.info.pr / (1 + 0.125 * wide);
    for (i = 0; i < 2; i++) { var n = i ? 'R' : 'L', e = T.info.eyes[i], dx = ca * e.nf[0] + lkx * U / Rc0, dy = ca * e.nf[1] - lky * U / Rc0, dz = Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy));
      b['eye' + n].scale.setScalar(es); o = b['pup' + n]; o.rotation.set(-Math.asin(cl(dy, -1, 1)), Math.atan2(dx, dz), 0); o.scale.set(psc, psc, 1);
      b['lid' + n].rotation.x = lidA; b['lid' + n].scale.setScalar(lidT <= 0.01 ? 0.001 : 1); b['lib' + n].rotation.x = libA; b['lib' + n].scale.setScalar(libT <= 0.01 ? 0.001 : 1); b['joy' + n].scale.setScalar(Math.max(0.001, joy));
      o = b['brow' + n]; var bw = cl(F.brow, 0, 1), bh = i ? F.b2 : F.b0, bs = i ? F.b3 : F.b1; o.scale.set(Math.max(0.001, bw), Math.max(0.001, bw) * (1 + 0.35 * small), Math.max(0.001, bw)); o.position.y = o.userData.rest.y - bh * U; o.rotation.z = (i ? -1 : 1) * bs * PI / 180;
      b['cheek' + n].scale.setScalar(1 + 0.22 * cl(F.blush, 0, 1)); }
    // mouth
    var mon = cl(F.mon, 0, 1), mth = Math.max(0.001, mon) * (1 + 0.25 * small), x0 = F.mx0 + 3.6, x1 = F.mx1 - 3.6, ys = [F.my0, F.my1, F.my2, F.my3, F.my4];
    for (i = 0; i < 5; i++) { o = b['m' + i]; var px = X(lerp(x0, x1, i / 4)), py = Y(ys[i]), sl = Math.atan2(-((ys[Math.min(4, i + 1)] - ys[Math.max(0, i - 1)])), (x1 - x0) / 4 * (i === 0 || i === 4 ? 1 : 2)), pp = o.userData.pp; o.position.set(px - pp[0], py - pp[1], sz(px, py) - pp[2]); o.rotation.z = sl; o.scale.set(mon < 0.02 ? 0.001 : 1, mth, mth); }
    o = b.mO; var pp2 = o.userData.pp, ox = X(F.ox), oy = Y(F.oy); o.position.set(ox - pp2[0], oy - pp2[1], sz(ox, oy) - pp2[2]); o.scale.set(Math.max(0.001, F.orx / 10), Math.max(0.001, F.ory / 10), F.orx > 0.2 ? 1 : 0.001);
    o = b.mD; oy = Y(F.dy); o.position.set(-pp2[0], oy - pp2[1], sz(0, oy) - pp2[2]); o.scale.set(Math.max(0.001, F.dw / 22), Math.max(0.001, F.dh / 19), F.dw > 0.4 ? 1 : 0.001);
    o = b.mT; ox = X(F.tx); oy = Y(F.ty); o.position.set(ox - pp2[0], oy - pp2[1], sz(ox, oy) - pp2[2] + (F.mon > 0.5 ? 0.02 : 0)); o.scale.set(Math.max(0.001, F.tw / 10), Math.max(0.001, F.th / 10), F.tw > 0.2 ? 1 : 0.001);
    b.tear.scale.setScalar(Math.max(0.001, cl(F.tear, 0, 1) * (T.noTear ? 0 : 1)));
    // arms: shoulder, elbow, hand of the mood's pose, moved towards the pose an action asks for
    for (i = 0; i < 2; i++) { var cur = i ? S.aR : S.aL, nm = i ? c.aR : c.aL, wv = i ? c.aRw : c.aLw, A = A1, sgn = i ? 1 : -1; for (k = 0; k < 9; k++) A[k] = cur[k]; if (nm && wv > 0.001) { var Gp = ARMP[nm][i]; wv = cl(wv, 0, 1); for (k = 0; k < 9; k++) A[k] = lerp(A[k], Gp[k], wv); }
      A[6] += c.handX[i]; A[7] += c.handY[i]; A[8] += c.handZ[i]; A[3] += c.handX[i] * 0.4; A[4] += c.handY[i] * 0.4; A[5] += c.handZ[i] * 0.45;
      if (i === 1 && c.waveR) { var cw = Math.cos(-c.waveR), sw2 = Math.sin(-c.waveR), q; for (q = 3; q < 9; q += 3) { var rx = A[q] - A[0], ry = A[q + 1] - A[1]; A[q] = A[0] + rx * cw - ry * sw2; A[q + 1] = A[1] + rx * sw2 + ry * cw; } }
      var n2 = i ? 'R' : 'L', ar = b['arm' + n2], fo = b['fore' + n2], ha = b['hand' + n2], by = 0.5;
      v0.set(A[3] - A[0], A[4] - A[1], A[5] - A[2]); var l1 = v0.length() || 0.01; ar.position.set(A[0], A[1] - by, A[2]); ar.quaternion.setFromUnitVectors(DOWN, v0.multiplyScalar(1 / l1)); ar.scale.set(1, l1 / L1, 1);
      v1.set(A[6] - A[3], A[7] - A[4], A[8] - A[5]); var l2 = v1.length() || 0.01; fo.position.set(A[3], A[4] - by, A[5]); fo.quaternion.setFromUnitVectors(DOWN, v1.multiplyScalar(1 / l2)); fo.scale.set(1, l2 / L2, 1);
      ha.position.set(A[6], A[7] - by, A[8]); T.hand[i].set(A[6], A[7], A[8]); }
    if (b.prop) b.prop.position.set((T.hand[0].x + T.hand[1].x) / 2, (T.hand[0].y + T.hand[1].y) / 2 - 0.5 + 0.02, Math.max(T.hand[0].z, T.hand[1].z) + 0.04);
    if (T.prop) T.prop.visible = S.carryW > 0.3;
    // the accessories that live: the balloon is held by the hand of the picture's right and lags, the wings beat, the end of the scarf and the butterfly sway
    if (b.bal0) { b.bal0.position.set(T.hand[1].x, T.hand[1].y - 0.5, T.hand[1].z); b.bal0.rotation.set(cl(c.bal, -1.2, 1.4) * 0.5, 0, 0.04 * Math.sin(t * 1.3 + sd) - c.hairRz * 0.6); b.bal1.rotation.set(cl(c.bal, -1.2, 1.4) * 0.5, 0, 0.06 * Math.sin(t * 1.3 + sd - 0.8) - c.hairRz); }
    if (b.wingL) { b.wingL.rotation.y = 0.25 * c.wing + 0.1; b.wingR.rotation.y = -0.25 * c.wing - 0.1; }
    if (b.scarfT) b.scarfT.rotation.set(-0.1 * c.tail - c.coreRx * 0.6, 0, 0.3 * c.tail + c.coreRz);
    if (b.tuft) b.tuft.rotation.set(-0.25 * c.hairRx * 3 - 0.3 * S.surge, 0.5 * c.tail, 0);
    if (b.fly) b.fly.rotation.y = 0.35 * Math.sin(t * 2.3 + sd);
    if (T.blob) { var bs = 2.25 * (1 - 0.35 * cl(c.rootY / 1.2, 0, 1)) * (1 + 0.1 * S.sitW); T.blob.scale.set(bs, 1, bs * (0.9 + 0.5 * S.lieW)); T.blob.position.set(c.rootX + 0.1, 0.03, c.rootZ + 0.06 - 0.6 * S.lieW); }
    if (T.cards) T.cards.update(F);
  }

  // ---------- a troll: the rig + its state + the small controller (the same names as the animals) ----------
  function Troll(spec, o) { o = o || {}; spec = spec || {}; var R = new Rig(), info = buildTroll(R, spec, o), lk = o.look || look0(), m = R.build(lk), i;
    this.spec = spec; this.info = info; this.look = lk; this.parts = R.parts; this.tris = m.tris; this.verts = m.verts; this.mesh = m.mesh; this.skeleton = m.skeleton; this.root = m.group; this.b = {}; for (i = 0; i < R.bones.length; i++) this.b[R.bones[i].name] = R.bones[i];
    this.legs = [this.b.legL, this.b.legR]; this.hand = [new V3(), new V3()]; this.c = chans(); this.seed = o.seed == null ? ((spec.id || 0) % 17) / 5 : o.seed; this.scale = o.scale || 1; this.root.scale.setScalar(this.scale); this.H = 3.36; this.r = 0.9 * this.scale;
    this.S = { t: 0, gaitW: 0, runW: 0, phase: 0, stride: 1, sitW: 0, warmW: 0, lieW: 0, sleepW: 0, carryW: 0, act: null, u: 0, dur: 1, lookYaw: 0, lookPitch: 0, look: false, lead: 0, lean: 0, sway: 0, surge: 0, h: 0, v: 0, w: 0, small: false, F: {}, aL: new Float32Array(9), aR: new Float32Array(9) };
    this.moodName = 'happy'; this.setFace('happy'); this.post = 'stand'; this.warm = false; this.mode = 'idle'; this.goal = { x: 0, z: 0, run: false }; this.target = null; this.lookPt = null; this.pathPts = null; this.pathI = 0; this.pathLoop = false; this.faceTo = null; this.onDone = null; this.still = 0; this.moving = false; this.sleeping = false; this.tLast = { x: 0, z: 0, v: 0, hx: 0, hz: 1, ok: false }; this.avoid = o.avoid || null; this.cam = o.cam || null; this.carried = null; this.prop = null; this.dirty = true;
    if (o.shadow !== false) { this.blob = blobMesh(); if (this.blob) this.root.add(this.blob); }
    if (typeof document !== 'undefined' && o.cards !== false) { this.cards = new Cards(this, spec, info.used); this.root.add(this.cards.mesh); }
    this.outline = null; this.noTear = o.tear === false; apply(this); }
  var P = Troll.prototype;
  Object.defineProperty(P, 'x', { get: function () { return this.root.position.x; }, set: function (v) { this.root.position.x = v; } });
  Object.defineProperty(P, 'z', { get: function () { return this.root.position.z; }, set: function (v) { this.root.position.z = v; } });
  Object.defineProperty(P, 'y', { get: function () { return 1.6 * this.scale; } });
  Object.defineProperty(P, 'sitting', { get: function () { return this.post === 'sit' || this.post === 'lie' || this.post === 'sleep'; } });
  Object.defineProperty(P, 'heading', { get: function () { return this.S.h; }, set: function (v) { this.S.h = v; this.root.rotation.y = v; } });
  P.place = function (x, z, heading) { this.root.position.set(x, this.root.position.y, z); if (heading != null) this.heading = heading; return this; };
  P.setFace = function (name) { var F = FACE[name] || FACE.happy, S = this.S, k, m = MOODS[name] || MOODS.happy; for (k = 0; k < FKEYS.length; k++) S.F[FKEYS[k]] = F[FKEYS[k]]; S.aL.set(ARMP[m.arms[0]][0]); S.aR.set(ARMP[m.arms[1]][1]); };
  // a frozen frame: { mood, t, gait, run, phase, stride, sit, warm, lie, sleep, carry, act, u, look: [yaw, pitch], heading, small }
  P.pose = function (q) { var S = this.S; q = q || {}; this.moodName = MOODS[ALIAS[q.mood] || q.mood] ? (ALIAS[q.mood] || q.mood) : 'happy'; this.setFace(this.moodName);
    S.t = q.t || 0; S.gaitW = q.gait || 0; S.runW = q.run || 0; S.phase = q.phase || 0; S.stride = q.stride == null ? 1 : q.stride; S.sitW = q.sit || 0; S.warmW = q.warm || 0; S.lieW = Math.max(q.lie || 0, q.sleep || 0); S.sleepW = q.sleep || 0; S.carryW = q.carry ? 1 : 0; if (q.carry && typeof q.carry === 'string') this.carry(q.carry); else if (!q.carry && this.prop) this.prop.visible = false;
    S.act = q.act && ACT[q.act] ? q.act : null; S.u = q.u || 0; S.dur = S.act ? DUR[S.act] || 1 : 1; S.lookYaw = q.look ? q.look[0] : 0; S.lookPitch = q.look ? q.look[1] : 0; S.look = !!q.look; S.lead = S.lean = 0; S.sway = q.sway || 0; S.surge = q.surge || 0; S.small = !!q.small;
    if (q.heading != null) this.heading = q.heading; apply(this); return this; };
  P.goTo = function (x, z, o) { o = o || {}; this.mode = 'goto'; this.goal.x = x; this.goal.z = z; this.goal.run = !!o.run; this.faceTo = o.face == null ? null : o.face; this.onDone = o.done || null; this.target = null; this.pathPts = null; this.wake(); return this; };
  P.path = function (pts, loop, run, done) { this.mode = 'path'; this.pathPts = pts; this.pathI = 0; this.pathLoop = !!loop; this.goal.run = !!run; this.onDone = done || null; this.target = null; this.wake(); return this; };
  P.follow = function (target) { this.mode = target ? 'follow' : 'idle'; this.target = target || null; this.pathPts = null; if (target) this.wake(); return this; };
  P.stop = function () { this.mode = 'idle'; this.target = null; this.pathPts = null; return this; };
  // driven from outside (the game): every frame the caller says where the feet are; the troll turns to where it goes, walks or trots at the speed it is moved with, and
  // turns to `face` (a heading; null = stays as it is) when it stands. A jump of the point (the caller put it elsewhere) is not walked.
  P.drive = function (x, z, face) { var E = this.ext || (this.ext = { x: x, z: z, face: null, sp: 0 }); if (this.mode !== 'ext') { this.mode = 'ext'; this.target = null; this.pathPts = null; this.root.position.x = x; this.root.position.z = z; E.sp = 0; } E.x = x; E.z = z; E.face = face == null ? null : face; return this; };
  P.setScale = function (s) { this.scale = s; this.root.scale.setScalar(s); this.r = 0.9 * s; return this; };
  P.turnTo = function (heading, done) { this.mode = 'turn'; this.faceTo = heading; this.onDone = done || null; this.wake(); return this; };
  P.lookAt = function (x, y, z) { if (x == null) this.lookPt = null; else if (typeof x === 'object') this.lookPt = x; else this.lookPt = { x: x, y: y, z: z }; return this; };
  P.play = function (name, done) { if (!ACT[name]) return this; var S = this.S; if (name !== 'jump' && name !== 'hop' && name !== 'door' && name !== 'nod' && name !== 'wave') this.hold = true; if (name !== 'doze' && name !== 'nod' && name !== 'wave' && name !== 'yawn') this.wake(); S.act = name; S.u = 0; S.dur = DUR[name] || 1; this.onAct = done || null; return this; };
  P.setMood = function (name, o) { name = ALIAS[name] || name; if (!MOODS[name]) name = 'happy'; var ch = name !== this.moodName; this.moodName = name; if (ch && MOODACT[name] && !(o && o.still)) this.play(MOODACT[name]); return this; };
  P.wake = function () { if (this.post !== 'stand') this.post = 'stand'; return this; };
  P.sit = function (o) { this.post = 'sit'; this.warm = !!(o && o.warm); if (this.mode !== 'follow') this.mode = 'idle'; return this; };
  P.lie = function () { this.post = 'lie'; this.mode = 'idle'; return this; };
  P.sleep = function () { this.post = 'sleep'; this.mode = 'idle'; return this; };
  P.stand = function () { this.post = 'stand'; return this; };
  P.carry = function (kind) { if (this.prop) { this.b.prop.remove(this.prop); this.prop.geometry.dispose(); this.prop = null; } this.carried = PROPS[kind] ? kind : null;
    if (this.carried) { var a = new Toy.Acc(); a.y0 = -9; PROPS[kind](a); var g = a.geom(false); g.deleteAttribute('aSway'); this.prop = new THREE.Mesh(g, this.look.still); this.prop.castShadow = true; this.b.prop.add(this.prop); } return this; };
  P.setOutline = function (w) { if (w && !this.outline) { this.outline = new THREE.SkinnedMesh(this.mesh.geometry, this.look.out); this.outline.bind(this.skeleton, this.mesh.bindMatrix); this.outline.frustumCulled = false; this.root.add(this.outline); } if (this.outline) this.outline.visible = !!w; if (w) this.look.uOut.value = w; return this; };
  var hv = new V3();
  P.headPoint = function (out) { this.b.body.updateWorldMatrix(true, false); return (out || hv).set(0, 1.3, 0).applyMatrix4(this.b.body.matrixWorld); };
  P.calls = function () { return 1 + (this.blob && this.blob.visible ? 1 : 0) + (this.cards && this.cards.count ? 1 : 0) + (this.outline && this.outline.visible ? 1 : 0) + (this.prop && this.prop.visible ? 1 : 0); };
  P.dispose = function () { this.mesh.geometry.dispose(); if (this.skeleton.boneTexture) this.skeleton.boneTexture.dispose(); if (this.blob) { this.blob.geometry.dispose(); this.blob.material.dispose(); } if (this.cards) { this.cards.mesh.geometry.dispose(); this.cards.mat.dispose(); this.cards.tex.dispose(); } if (this.prop) this.prop.geometry.dispose(); if (this.root.parent) this.root.parent.remove(this.root); };
  function ease(cur, to, k) { return cur + (to - cur) * k; }
  P.update = function (dt) { var S = this.S, sc = this.scale, i, k; if (dt > 0.1) dt = 0.1; if (dt <= 0) { apply(this); return; } S.t += dt;
    var gx = 0, gz = 0, want = false, run = false, pass = false, face = null, tg = this.target;
    if (this.mode === 'follow' && tg) { var gap = 1.9 * sc + (tg.r || 0), dx = tg.x - this.x, dz = tg.z - this.z, dist = Math.sqrt(dx * dx + dz * dz) || 1e-6; if (dist > gap * 1.25) this.followGo = true; else if (dist < gap) this.followGo = false;
      if (this.followGo) { gx = tg.x - dx / dist * gap * 0.9; gz = tg.z - dz / dist * gap * 0.9; want = true; pass = true; run = dist > gap * 2.6; } else face = Math.atan2(dx, dz); }
    else if (this.mode === 'goto') { gx = this.goal.x; gz = this.goal.z; want = true; run = this.goal.run; }
    else if (this.mode === 'path' && this.pathPts) { var pt = this.pathPts[this.pathI]; gx = pt[0]; gz = pt[1]; want = true; run = this.goal.run; pass = this.pathLoop || this.pathI < this.pathPts.length - 1; }
    else if (this.mode === 'turn') face = this.faceTo;
    if (this.hold && S.act) { want = false; face = null; }
    // posture weights
    var kk = Math.min(1, dt * 3.0), ps = this.post; if (want && ps !== 'stand') { this.wake(); ps = this.post; }
    S.sitW = ease(S.sitW, ps === 'sit' ? 1 : 0, kk); S.warmW = ease(S.warmW, ps === 'sit' && this.warm ? 1 : 0, kk); S.lieW = ease(S.lieW, ps === 'lie' || ps === 'sleep' ? 1 : 0, kk * 0.8); S.sleepW = ease(S.sleepW, ps === 'sleep' ? 1 : 0, kk * 0.6); if (S.sleepW > S.lieW) S.sleepW = S.lieW; this.sleeping = S.sleepW > 0.6; S.carryW = ease(S.carryW, this.carried ? 1 : 0, kk);
    var up = S.sitW + S.lieW < 0.2;
    // steering: turn towards the goal, walk when it is ahead, slow down on arrival
    var vT = 0, wT = 0, wMax = 2.4, arrive = 0.12 * sc, v0p = S.v, w0 = S.w;
    if (want && up) { var ddx = gx - this.x, ddz = gz - this.z, dd2 = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dd2 < (pass ? 0.5 * sc : arrive)) { if (this.mode === 'goto') { this.mode = this.faceTo == null ? 'idle' : 'turn'; if (this.faceTo == null && this.onDone) { var f = this.onDone; this.onDone = null; f(this); } } else if (this.mode === 'path') { this.pathI++; if (this.pathI >= this.pathPts.length) { if (this.pathLoop) this.pathI = 0; else { this.mode = 'idle'; this.pathPts = null; if (this.onDone) { var f3 = this.onDone; this.onDone = null; f3(this); } } } } }
      else { var err = wrap(Math.atan2(ddx, ddz) - S.h), ae = Math.abs(err), vm = (run ? RV : WV) * sc; wT = cl(err * 4, -wMax, wMax); vT = ae > 1.25 ? 0 : vm * Math.pow(Math.cos(ae), 1.5); if (!pass) vT = Math.min(vT, dd2 * 2.4 + 0.12 * sc); } }
    else if (face != null && up) { var e2 = wrap(face - S.h); if (Math.abs(e2) > (this.turning || this.mode === 'turn' ? 0.04 : 0.5)) { wT = cl(e2 * 4, -wMax, wMax); this.turning = true; } else { this.turning = false; if (this.mode === 'turn') { this.mode = 'idle'; if (this.onDone) { var f2 = this.onDone; this.onDone = null; f2(this); } } } }
    if (this.mode === 'ext') { var E = this.ext, ex = E.x - this.x, ez = E.z - this.z, ed = Math.sqrt(ex * ex + ez * ez), sp = ed > 1.5 * sc ? 0 : ed / dt, go = sp > 0.3 * sc, hd = go ? Math.atan2(ex, ez) : E.face;
      E.sp = ease(E.sp, Math.min(sp, 2.8 * sc), Math.min(1, dt * (sp > E.sp ? 12 : 7))); if (E.sp < 0.02 * sc) E.sp = 0;
      if (hd != null) { var eh = wrap(hd - S.h); wT = Math.abs(eh) < 0.01 ? 0 : cl(eh * (go ? 9 : 5), -9, 9); }
      S.w = ease(S.w, wT, Math.min(1, dt * 12)); if (Math.abs(S.w) < 0.002) S.w = 0; S.h = wrap(S.h + S.w * dt); S.v = E.sp;
      this.root.position.x = E.x; this.root.position.z = E.z; this.root.rotation.y = S.h; }
    else {
    S.v = ease(S.v, vT, Math.min(1, dt * (vT > S.v ? 3 : 5))); S.w = ease(S.w, wT, Math.min(1, dt * 7)); if (Math.abs(S.w) < 0.002) S.w = 0; if (S.v < 0.002 * sc) S.v = 0;
    S.h = wrap(S.h + S.w * dt); this.root.position.x += Math.sin(S.h) * S.v * dt; this.root.position.z += Math.cos(S.h) * S.v * dt; this.root.rotation.y = S.h; }
    var av = this.avoid; if (av && S.v > 0) for (i = 0; i < av.length; i++) { var ox = this.x - av[i][0], oz = this.z - av[i][1], od = Math.sqrt(ox * ox + oz * oz), orr = av[i][2] * 0.85; if (od < orr && od > 1e-4) { this.root.position.x = av[i][0] + ox / od * orr; this.root.position.z = av[i][1] + oz / od * orr; } }
    var vt = S.v / sc, moving = vt > 0.03 || Math.abs(S.w) > 0.12; this.moving = moving; this.still = moving ? 0 : this.still + dt;
    var runT = cl((vt - WV * 1.1) / (RV - WV * 1.1), 0, 1); S.runW = ease(S.runW, runT, Math.min(1, dt * 4)); S.gaitW = ease(S.gaitW, moving ? 1 : 0, Math.min(1, dt * (moving ? 8 : 5)));
    S.stride = ease(S.stride, cl(vt / WV, 0.3, 1), Math.min(1, dt * 6));
    var A = lerp(WA, RA, S.runW), duty = lerp(WD, RD, S.runW);
    if (moving) S.phase += vt * dt * duty / (2 * A * Math.max(0.3, S.stride)) + Math.abs(S.w) * dt * 0.28 * (1 - cl(vt / WV, 0, 1)); else if (S.gaitW < 0.02) S.phase = 0;
    S.lead = ease(S.lead, cl(S.w * 0.14, -0.35, 0.35), Math.min(1, dt * 5)); S.lean = ease(S.lean, cl(S.w * vt * 0.045, -0.16, 0.16), Math.min(1, dt * 4));
    // follow-through: the hair, the pigtails and the balloon answer late to turning and to starting and stopping
    S.sway = ease(S.sway, cl(S.w * 0.16, -0.4, 0.4), Math.min(1, dt * 2.6)); S.surge = ease(S.surge, cl((S.v - v0p) / dt / sc * 0.05, -0.25, 0.25), Math.min(1, dt * 4));
    // the action that plays, the mood (its face and its arms come softly), the look
    if (S.act) { S.u += dt / S.dur; if (S.u >= 1) { S.act = null; S.u = 0; this.hold = false; if (this.onAct) { var fa = this.onAct; this.onAct = null; fa(this); } } }
    var G = FACE[this.moodName], km = Math.min(1, dt * 9), m = MOODS[this.moodName], gl = ARMP[m.arms[0]][0], gr = ARMP[m.arms[1]][1], ka = Math.min(1, dt * 7); for (k = 0; k < FKEYS.length; k++) S.F[FKEYS[k]] = ease(S.F[FKEYS[k]], G[FKEYS[k]], km); for (k = 0; k < 9; k++) { S.aL[k] = ease(S.aL[k], gl[k], ka); S.aR[k] = ease(S.aR[k], gr[k], ka); }
    var ly = 0, lp = 0, lpt = this.lookPt; S.look = !!lpt;
    if (lpt) { var hy = 1.6 * sc, lx = lpt.x - this.x, lz = lpt.z - this.z, ld = Math.sqrt(lx * lx + lz * lz); ly = cl(wrap(Math.atan2(lx, lz) - S.h), -1.1, 1.1); lp = cl(Math.atan2((lpt.y || 0) - hy, ld + 0.001), -0.5, 0.6); if (ld < 0.2 * sc) ly = 0; }
    S.lookYaw = ease(S.lookYaw, ly, Math.min(1, dt * 5)); S.lookPitch = ease(S.lookPitch, lp, Math.min(1, dt * 5));
    apply(this); };

  // ---------- flat uses: any troll, mood, pose and angle as a transparent picture; sprite sheets of 8 directions ----------
  var snap = null, DAY = { hemiS: '#ffffff', hemiG: '#a6d48c', hemi: 0.58, sun: '#fff3d0', sunI: 0.6, tint: '#ffffff', rim: '#39382e', spec: '#1d1d1d', blob: '#145a2d' }, NIGHT = { hemiS: '#b4c0ff', hemiG: '#56789a', hemi: 0.78, sun: '#c9d4ff', sunI: 0.46, tint: '#aebcf0', rim: '#1c2a55', spec: '#14182a', blob: '#0a282d' };
  function supported() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function snapInit() { if (snap) return snap; var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setClearColor(0, 0);
    var sc = new THREE.Scene(), hemi = new THREE.HemisphereLight(), sun = new THREE.DirectionalLight(); sun.position.set(-11, 17, 9); sc.add(hemi); sc.add(sun);
    snap = { r: r, scene: sc, hemi: hemi, sun: sun, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100), look: Look(), trolls: {}, order: [], pal: null }; return snap; }
  function specKey(s, o) { return [s.body, s.hairColor, s.hair, s.acc, s.eyes, s.hatE, s.faceE, s.handE, o.flatItems ? 1 : 0].join('|'); }
  // o: { spec, size (the height in px, as TrollArt's opts.size), mood, angle (0 front, PI/2 its right side towards us, PI back), pitch (camera, rad), pose: {...}, night, outline (auto up to 72 px), frame: 'svg' (the 200 x 262 box of the SVG, default) | 'wide' (a square with room for jumps and lying), flatItems, dpr, zoom, lift }
  function render(o) { var s = snapInit(), spec = o.spec || {}, k = specKey(spec, o), T = s.trolls[k], P = o.night ? NIGHT : DAY, size = o.size || 200, dpr = o.dpr || 1, wide = o.frame === 'wide', W = Math.round((wide ? size : size * 200 / 262) * dpr), Hh = Math.round(size * dpr), key2;
    if (!T) { T = s.trolls[k] = new Troll(spec, { look: s.look, flatItems: o.flatItems, shadow: true }); s.order.push(k); if (s.order.length > 14) { var old = s.order.shift(); s.trolls[old].dispose(); delete s.trolls[old]; } }
    if (s.pal !== P) { s.pal = P; s.hemi.color.set(P.hemiS); s.hemi.groundColor.set(P.hemiG); s.hemi.intensity = P.hemi; s.sun.color.set(P.sun); s.sun.intensity = P.sunI; s.look.set(P); }
    for (key2 in s.trolls) s.trolls[key2].root.visible = false; if (!T.root.parent) s.scene.add(T.root); T.root.visible = true;
    var pit = o.pitch == null ? 0 : o.pitch, cam = s.cam, q = {}, kq; for (kq in (o.pose || {})) q[kq] = o.pose[kq]; if (o.mood) q.mood = o.mood; if (q.t == null) q.t = 0.4; var small = size <= 72; if (q.small == null) q.small = small;
    if (T.blob) { T.blob.visible = o.shadow !== false && pit > 0.12; T.blob.material.color.set(P.blob); }
    T.cam = cam; T.noTear = o.tear === false; T.root.position.set(0, 0, 0); T.heading = o.angle || 0;
    var zm = o.zoom || 1;
    if (wide) { var he = 2.25 / zm, cy = 1.72 + (o.lift || 0); cam.left = -he; cam.right = he; cam.top = he; cam.bottom = -he; cam.position.set(0, cy + 30 * Math.sin(pit), 30 * Math.cos(pit)); cam.lookAt(0, cy, 0); }
    else { var hw = 100 * U / zm, hh = 131 * U / zm, cy2 = Y(131); cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.position.set(0, cy2 + 30 * Math.sin(pit), 30 * Math.cos(pit)); cam.lookAt(0, cy2, 0); }
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    var ol = o.outline == null ? small : o.outline; T.setOutline(ol ? (typeof ol === 'number' ? ol : 0.05) : 0);
    T.pose(q);
    s.r.setPixelRatio(1); s.r.setSize(W, Hh, false); s.r.render(s.scene, cam); s.last = T; return s.r.domElement; }
  // the contact shadow of the SVG, painted under a front view (a camera at eye height sees the ground edge-on)
  function flatShadow(ctx, x, y, w, h, o) { if (o.shadow === false || (o.pitch || 0) > 0.12 || o.frame === 'wide') return; var kx = w / 200, ky = h / 262, g; ctx.save(); ctx.translate(x + 108 * kx, y + 252 * ky); ctx.scale(72 * kx, 10 * ky); g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(42,33,72,.5)'); g.addColorStop(0.5, 'rgba(42,33,72,.2)'); g.addColorStop(1, 'rgba(42,33,72,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 2 * PI); ctx.fill(); ctx.restore(); }
  function draw(ctx, x, y, o) { var cv = render(o), size = o.size || 200, w = o.frame === 'wide' ? size : size * 200 / 262; flatShadow(ctx, x, y, w, size, o); ctx.drawImage(cv, x, y, w, size); }
  function canvas(o) { var dpr = o.dpr || 1, size = o.size || 200, c2 = document.createElement('canvas'), w = o.frame === 'wide' ? size : size * 200 / 262; c2.width = Math.round(w * dpr); c2.height = Math.round(size * dpr); var x = c2.getContext('2d'); x.scale(dpr, dpr); draw(x, 0, 0, o); return c2; }
  function snapshot(o) { return canvas(o).toDataURL(o.type || 'image/png', o.quality); }
  // sprites for places without a live WebGL scene: 8 columns = 8 directions (0 = towards the viewer, then turning by 45 degrees), rows = SPR.rows
  var SPR = { cell: 96, cols: 8, rows: ['stand', 'walk0', 'walk1', 'walk2', 'walk3', 'sit', 'sleep', 'cheer'] };
  var SPR_POSE = { stand: { t: 0.5 }, walk0: { gait: 1, phase: 0.0 }, walk1: { gait: 1, phase: 0.25 }, walk2: { gait: 1, phase: 0.5 }, walk3: { gait: 1, phase: 0.75 }, sit: { sit: 1, warm: 1, mood: 'sit', t: 0.5 }, sleep: { sleep: 1, t: 0.5 }, cheer: { act: 'cheer', u: 0.5 } };
  function spriteSheet(spec, o) { o = o || {}; var cell = o.cell || SPR.cell, c = document.createElement('canvas'), x, r, d; c.width = SPR.cols * cell; c.height = SPR.rows.length * cell; x = c.getContext('2d');
    for (r = 0; r < SPR.rows.length; r++) for (d = 0; d < SPR.cols; d++) draw(x, d * cell, r * cell, { spec: spec, size: cell, frame: 'wide', angle: d * PI / 4, pitch: o.pitch == null ? 0.3 : o.pitch, pose: SPR_POSE[SPR.rows[r]], outline: 0.05, shadow: false, lift: SPR.rows[r] === 'cheer' ? 0.3 : 0, night: o.night });
    return c; }
  function sprite(el, url, pose, dir8, size) { var r = Math.max(0, SPR.rows.indexOf(pose)), c = ((Math.round(dir8) % 8) + 8) % 8, st = el.style; size = size || SPR.cell; st.width = st.height = size + 'px'; st.backgroundImage = 'url(' + url + ')'; st.backgroundSize = SPR.cols * size + 'px ' + SPR.rows.length * size + 'px'; st.backgroundPosition = -c * size + 'px ' + -r * size + 'px'; st.backgroundRepeat = 'no-repeat'; return el; }

  api.MOODS = MOOD11; api.FACES = Object.keys(MOODS); api.ACTIONS = Object.keys(ACT); api.DUR = DUR; api.PROPS = Object.keys(PROPS); api.HAT3 = Object.keys(HAT3); api.FACE3 = Object.keys(FACE3); api.ACC = Object.keys(ACC).concat(Object.keys(BACK));
  api.create = function (spec, o) { return new Troll(spec, o); };
  // the companion of the game: ONE troll for the session, taken by the camp and by every map in turn (made again only when its spec changes)
  var one = null;
  api.one = function (spec, o) { var k = JSON.stringify(spec); api.oneFresh = !one || one.k !== k; if (api.oneFresh) { if (one) { try { one.T.dispose(); } catch (e) {} } one = { k: k, T: new Troll(spec, o) }; } return one.T; };
  api.oneDrop = function () { if (one) { try { one.T.dispose(); } catch (e) {} one = null; } }; api.Look = Look; api.look = look0; api.DAY = DAY; api.NIGHT = NIGHT; api.supported = supported; api.preload = preload; api.specIcons = specIcons; api.cpOf = cpOf;
  api.render = render; api.draw = draw; api.canvas = canvas; api.snapshot = snapshot; api.spriteSheet = spriteSheet; api.sprite = sprite; api.SPR = SPR; api.SPR_POSE = SPR_POSE; api.info = function () { return snap ? snap.r.info.render : null; }; api.tone = tone; api.U = U;
  return api;
})();
