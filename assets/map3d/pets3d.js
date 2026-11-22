// pets3d.js: the troll's companions as living toy animals (dog, cat, lion, crocodile, monkey, bird, elephant).
// Needs three.js r147 (classic build, global THREE) and toy3d.js (global Toy: the accumulator and the rounded shapes). toy3d.js is not changed; the animals register as Toy.PETS.
// Every animal is ONE skinned mesh (one draw call) built in code from rounded shapes with baked vertex colours, bound to a small skeleton (body, head, jaw, ears, pupils, lids, legs, tail ...).
// All motion is procedural and a pure function of the state (time, gait phase, posture weights, action progress), so any frame can be frozen: pet.pose({...}).
// Front faces +z, y is up, the animal stands on y = 0. Signs of a rotation about x: plus = nose down / tail up / foot back.
var Pets = (function () {
  'use strict';
  var TR = Toy.TR, PI = Math.PI, V3 = THREE.Vector3, NA = { noAO: 1 }, INK = '#3b2a55', MOUTH = '#8a2b4a', TONGUE = '#ff7aa8', BLUSH = '#ff9db4';
  var US = {};
  function us(ws, hs) { var k = ws + '_' + hs; return US[k] || (US[k] = new THREE.SphereGeometry(1, ws, hs)); }
  var UZ = {};
  function uz(ws, hs) { var k = ws + '_' + hs; return UZ[k] || (UZ[k] = new THREE.SphereGeometry(1, ws, hs).rotateX(PI / 2)); }
  function C(c) { return new THREE.Color(c); }
  function mix(a, b, t) { return '#' + C(a).lerp(C(b), t).getHexString(); }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ss(a, b, x) { x = cl((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function win(u, a, b, e) { return ss(a, a + e, u) * (1 - ss(b - e, b, u)); }
  function wrap(a) { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; }

  // ---------- shapes ----------
  // a tube along a smooth curve through pts [x, y, z, radius, (radius2)], with rounded ends (c0, c1: 0 = open, 1 = half ball). userData.t = 0..1 along it, per vertex.
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
    g.userData.t = tt; g.userData.curve = cv; return g; }
  function cap(r, ws, ang) { return new THREE.SphereGeometry(r, ws, 2, 0, 2 * PI, 0, ang).rotateX(PI / 2); }       // a round cap that faces +z
  function dome(r, ws) { return new THREE.SphereGeometry(r, ws, 3, 0, 2 * PI, 0, PI / 2); }                        // the upper half of a ball
  var qq = new THREE.Quaternion(), up = new V3(0, 1, 0), dd = new V3();
  function stick(p0, p1, r) { dd.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]); var len = dd.length(); qq.setFromUnitVectors(up, dd.normalize());
    return new THREE.CylinderGeometry(r * 0.5, r, len, 3, 1, true).applyMatrix4(new THREE.Matrix4().compose(new V3((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2), qq, new V3(1, 1, 1))); }
  function surf(Cc, Rr, yaw, pitch) { var cx = Math.sin(yaw) * Math.cos(pitch), cy = Math.sin(pitch), cz = Math.cos(yaw) * Math.cos(pitch), nx = cx / Rr[0], ny = cy / Rr[1], nz = cz / Rr[2], l = Math.sqrt(nx * nx + ny * ny + nz * nz); nx /= l; ny /= l; nz /= l;
    return { x: Cc[0] + Rr[0] * cx, y: Cc[1] + Rr[1] * cy, z: Cc[2] + Rr[2] * cz, nx: nx, ny: ny, nz: nz, yaw: Math.atan2(nx, nz), pit: Math.asin(ny) }; }

  // ---------- the rig builder: Toy.Acc + one bone (or a chain of bones) per shape ----------
  function Rig() { this.a = new Toy.Acc(); this.si = []; this.sw = []; this.bones = []; this.idx = {}; this.piv = {}; }
  Rig.prototype.bone = function (name, parent, x, y, z, order, restY) { var b = new THREE.Bone(), pp = parent ? this.piv[parent] : [0, 0, 0]; b.name = name; b.position.set(x - pp[0], y - pp[1], z - pp[2]); if (order) b.rotation.order = order; if (restY) b.rotation.y = restY;
    b.userData.rest = b.position.clone(); b.userData.ry = restY || 0; this.piv[name] = [x, y, z]; this.idx[name] = this.bones.length; this.bones.push(b); if (parent) this.bones[this.idx[parent]].add(b); return b; };
  Rig.prototype.put = function (bone, geom, mat, color, o) { var n0 = this.a.p.length / 3; this.a.add(geom, mat, color, o); var n1 = this.a.p.length / 3, i, ch = bone instanceof Array ? bone : null, b = ch ? 0 : this.idx[bone], tt = geom.userData.t;
    if (!ch && b == null) throw new Error('no bone ' + bone);
    for (i = n0; i < n1; i++) { if (ch) { var nb = ch.length, f = tt[i - n0] * nb - 0.5; if (f <= 0) { this.si.push(this.idx[ch[0]], 0, 0, 0); this.sw.push(1, 0, 0, 0); } else if (f >= nb - 1) { this.si.push(this.idx[ch[nb - 1]], 0, 0, 0); this.sw.push(1, 0, 0, 0); }
        else { var i0 = Math.floor(f), w = f - i0; w = w * w * (3 - 2 * w); this.si.push(this.idx[ch[i0]], this.idx[ch[i0 + 1]], 0, 0); this.sw.push(1 - w, w, 0, 0); } }
      else { this.si.push(b, 0, 0, 0); this.sw.push(1, 0, 0, 0); } } return this; };
  Rig.prototype.E = function (bone, x, y, z, rx, ry, rz, color, ws, hs, o, yaw, pit, roll) { return this.put(bone, us(ws || 10, hs || 7), TR(x, y, z, yaw || 0, rx, ry, rz, pit || 0, roll || 0), color, o); };
  // a flat lens that lies on an ellipsoid (centre Cc, radii Rr) in the direction yaw / pitch: patches, cheeks, a face mask
  Rig.prototype.patch = function (bone, Cc, Rr, yaw, pitch, rad, radY, thick, color, ws, hs, o) { var p = surf(Cc, Rr, yaw, pitch), d = thick * 0.72; return this.put(bone, uz(ws || 10, hs || 4), TR(p.x - p.nx * d, p.y - p.ny * d, p.z - p.nz * d, p.yaw, rad, radY, thick, -p.pit), color, o || NA); };
  Rig.prototype.D = function (bone, x, y, z, rx, ry, rz, color, ws, hs, o, yaw, pit, roll) { return this.put(bone, uz(ws || 12, hs || 4), TR(x, y, z, yaw || 0, rx, ry, rz, pit || 0, roll || 0), color, o); };
  Rig.prototype.chain = function (prefix, parent, pts, nb) { var cv = new THREE.CatmullRomCurve3(pts.map(function (p) { return new V3(p[0], p[1], p[2]); })), names = [], i, P = new V3(); for (i = 0; i < nb; i++) { cv.getPoint(i / nb, P); this.bone(prefix + i, i ? prefix + (i - 1) : parent, P.x, P.y, P.z, 'YXZ'); names.push(prefix + i); } return names; };
  Rig.prototype.limb = function (bone, pts, seg, sub, c0, c1, color, o) { var g = limb(pts, seg, sub, c0, c1); if (typeof color === 'function') { var k = 0, tt = g.userData.t, fn = color, cc = new THREE.Color(); color = function () { return cc.set(fn(tt[k++])); }; } return this.put(bone, g, null, color, o); };
  // the eyes of the family: a white ball, a big dark pupil with a shine on the upper left, and a lid (half a ball in the skin colour) that turns down over it
  Rig.prototype.eyes = function (Cc, Rr, yaw, pitch, r, sink, lidCol, face) { var R = this, dark = C(lidCol).multiplyScalar(0.72), lc = C(lidCol), fn = function (k) { return k < 0.2 ? dark : lc; };
    [1, -1].forEach(function (s) { var p = surf(Cc, Rr, s * yaw, pitch), ex = p.x - p.nx * sink * r, ey = p.y - p.ny * sink * r, ez = p.z - p.nz * sink * r, fy = s * (face == null ? yaw * 0.55 : face), fp = pitch * 0.4, L = s > 0 ? 'L' : 'R';
      R.bone('eye' + L, 'head', ex, ey, ez, 'YXZ'); R.bone('lid' + L, 'head', ex, ey, ez, 'YXZ', fy);
      R.put('head', us(8, 5), TR(ex, ey, ez, 0, r), '#ffffff', { noAO: 1, g: 0.5 });
      R.put('eye' + L, cap(r * 1.04, 8, 0.7), TR(ex, ey, ez, fy, 1, 1, 1, -fp), INK, { noAO: 1, g: 0.6 });
      R.put('eye' + L, cap(r * 1.08, 6, 0.2), TR(ex, ey, ez, fy - 0.3, 1, 1, 1, -fp - 0.34), '#ffffff', { noAO: 1, g: 0 });
      R.put('lid' + L, dome(r * 1.15, 8), TR(ex, ey, ez), fn, { noAO: 1, g: 0.4 }); }); };
  Rig.prototype.cheeks = function (Cc, Rr, yaw, pitch, rad, fur) { var R = this, col = mix(fur, BLUSH, 0.8); [1, -1].forEach(function (s) { R.patch('head', Cc, Rr, s * yaw, pitch, rad, rad * 0.8, rad * 0.3, col, 9, 3); }); };
  Rig.prototype.smile = function (bone, x, y, z, r, tube) { var g = new THREE.TorusGeometry(r, tube || 0.022, 4, 6, PI); this.put(bone, g, TR(x, y, z, 0, 1, 1, 1, 0, PI), INK, { noAO: 1, g: 0 }); if (x) this.put(bone, g, TR(-x, y, z, 0, 1, 1, 1, 0, PI), INK, { noAO: 1, g: 0 }); };
  Rig.prototype.legs4 = function (x, yF, yB, zF, zB, r, color, sock, sockT, xo, paw) { var R = this, n = 0;
    [['legFL', 1, zF, yF], ['legFR', -1, zF, yF], ['legBL', 1, zB, yB], ['legBR', -1, zB, yB]].forEach(function (l) { var X = l[1] * x, y = l[3], X2 = l[1] * (x + (xo || 0)); R.bone(l[0], 'body', X, y, l[2], 'YXZ');
      R.limb(l[0], [[X, y + 0.1, l[2], r], [X2, y * 0.5, l[2] + 0.01, r * 0.95], [X2, r * 0.98, l[2] + 0.04, r * 1.08]], 7, 1, 1, 0.9, sock ? function (t) { return t > sockT ? sock : color; } : color, { g: 0.45 });
      if (paw !== 0) R.E(l[0], X2, r * 0.6, l[2] + r * 0.62, r * 1.18, r * 0.6, r * 1.4, sock || color, 6, 4); n++; }); };
  Rig.prototype.build = function (look, misc) { var g = this.a.geom(false); g.deleteAttribute('aSway'); g.userData = {};
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    var grp = new THREE.Group(); grp.add(this.bones[0]); grp.updateMatrixWorld(true);
    var sk = new THREE.Skeleton(this.bones), m = new THREE.SkinnedMesh(g, look.mat); grp.add(m); m.bind(sk, new THREE.Matrix4()); m.frustumCulled = false; m.castShadow = true;
    return { group: grp, mesh: m, skeleton: sk, tris: g.index.count / 3, verts: g.attributes.position.count }; };

  // ---------- the seven animals. Each builder returns the numbers the motion needs ----------
  var VAR = {
    dog: [{ fur: '#f7dfb6', patch: '#a9683f', saddle: '#de9650', belly: '#fff7ea', collar: '#ff5a4f' }, { fur: '#eaa560', patch: '#8a5234', saddle: '#c9803f', belly: '#fff0d2', collar: '#4aa8ff' }, { fur: '#9aa3ba', patch: '#565c78', saddle: '#7b849d', belly: '#f4f5fb', collar: '#ffc83d' }],
    cat: [{ fur: '#ff9a3c', stripe: '#d9661a', belly: '#fff0d2', ear: '#ff8fb1', collar: '#a58bff' }, { fur: '#a9b0c6', stripe: '#6d7592', belly: '#f6f6fc', ear: '#ff9db4', collar: '#ff5a4f' }, { fur: '#5f5670', stripe: '#463e57', belly: '#f1ecf7', ear: '#ff8fb1', collar: '#ffc83d' }],
    lion: [{ fur: '#ffc440', mane: '#c95f1d', mane2: '#e8842b', belly: '#fff0c8', nose: '#8a4a2c' }, { fur: '#f6dfa6', mane: '#a8693c', mane2: '#c98a55', belly: '#fff8e6', nose: '#8a5a4a' }, { fur: '#ffb14a', mane: '#6e3f2b', mane2: '#8f5638', belly: '#ffe9c4', nose: '#5e3524' }],
    croc: [{ fur: '#4fc45c', back: '#2e9f4b', belly: '#fff3a6' }, { fur: '#37c3b0', back: '#1f9a90', belly: '#fdf3c0' }, { fur: '#9ccc3c', back: '#6fa82a', belly: '#fff6c9' }],
    monkey: [{ fur: '#a8694b', face: '#ffd9a8', ear: '#ffb38a' }, { fur: '#6f6577', face: '#ffe1c2', ear: '#ffb3a0' }, { fur: '#e58a3c', face: '#fff0d2', ear: '#ffc09a' }],
    bird: [{ fur: '#3fa9ff', wing: '#2b7fe4', belly: '#fff6e0', beak: '#ff9f1c', crest: '#ffd23f' }, { fur: '#ff6b6b', wing: '#e0453f', belly: '#fff0d2', beak: '#ffc83d', crest: '#ff9f1c' }, { fur: '#ffd23f', wing: '#f0a400', belly: '#fffbe6', beak: '#ff7a3d', crest: '#ff5a4f' }],
    elephant: [{ fur: '#93b3ee', ear: '#ffaac4', nail: '#fff3dc', dark: '#6c8cd4' }, { fur: '#c3b0e6', ear: '#ffc2d6', nail: '#fff6e6', dark: '#9c86c9' }, { fur: '#b9c0c9', ear: '#ffb9b0', nail: '#fff3dc', dark: '#8f98a6' }] };
  function mouth(R, x, y, z, w, h, d, jawCol, py, pz) {      // a lower jaw that swings open over a dark mouth with a tongue
    R.bone('jaw', 'head', 0, py, pz); R.E('head', 0, y + h * 0.5, z - d * 0.1, w * 0.86, h * 0.9, d * 0.8, MOUTH, 8, 4, { noAO: 1, g: 0.3 });
    R.E('jaw', 0, y, z, w, h, d, jawCol, 8, 5, NA); R.E('jaw', 0, y + h * 0.62, z + d * 0.1, w * 0.6, h * 0.42, d * 0.66, TONGUE, 6, 4, { noAO: 1, g: 0.4 }); }
  function core(R, cy, cz, hy, hz, ny, nz) { R.bone('root', null, 0, 0, 0, 'YXZ'); R.bone('core', 'root', 0, cy, cz, 'YXZ'); R.bone('body', 'core', 0, hy, hz, 'YXZ'); R.bone('head', 'body', 0, ny, nz, 'YXZ'); }

  var BUILD = {
    dog: function (R, v) { var HC = [0, 1.62, 0.42], HR = [0.64, 0.58, 0.58];
      core(R, 0.85, -0.1, 0.62, -0.5, 1.12, 0.3);
      R.E('body', 0, 0.8, -0.12, 0.5, 0.48, 0.7, v.fur, 14, 10); R.patch('body', [0, 0.8, -0.12], [0.5, 0.48, 0.7], 0, -0.25, 0.3, 0.32, 0.09, v.belly, 14, 3, {}); R.patch('body', [0, 0.8, -0.12], [0.5, 0.48, 0.7], PI, 1.0, 0.36, 0.34, 0.14, v.saddle, 14, 3);
      R.legs4(0.28, 0.62, 0.62, 0.3, -0.5, 0.17, v.fur, v.belly, 0.55);
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 16, 10, NA);
      R.patch('head', HC, HR, 0.47, 0.2, 0.27, 0.29, 0.1, v.patch, 12, 3);
      R.E('head', 0, 1.47, 0.92, 0.31, 0.23, 0.28, v.belly, 10, 7, NA); R.E('head', 0, 1.58, 1.17, 0.12, 0.09, 0.08, INK, 8, 5, { noAO: 1, g: 0.5 });
      R.smile('head', 0.09, 1.45, 1.165, 0.09); mouth(R, 0, 1.29, 0.9, 0.19, 0.1, 0.2, v.belly, 1.38, 0.72);
      R.eyes(HC, HR, 0.47, 0.2, 0.155, 0.45, v.fur); R.cheeks(HC, HR, 0.86, -0.22, 0.13, v.fur);
      [1, -1].forEach(function (s) { R.bone(s > 0 ? 'earL' : 'earR', 'head', s * 0.47, 2.0, 0.36, 'YXZ'); R.E(s > 0 ? 'earL' : 'earR', s * 0.63, 1.66, 0.36, 0.13, 0.38, 0.23, v.patch, 8, 6, NA, 0, 0, s * 0.2); });
      var tp = [[0, 0.98, -0.72, 0.13], [0, 1.26, -0.98, 0.115], [0, 1.58, -1.02, 0.1], [0, 1.82, -0.9, 0.075]], tb = R.chain('tail', 'body', tp, 3); R.limb(tb, tp, 7, 2, 0, 1, function (t) { return t > 0.7 ? v.belly : v.fur; }, NA);
      R.put('body', new THREE.TorusGeometry(0.4, 0.065, 4, 12), TR(0, 1.15, 0.36, 0, 1, 1, 1, PI / 2 - 0.12), v.collar, NA); R.E('body', 0, 1.05, 0.75, 0.08, 0.08, 0.06, '#ffc83d', 6, 4, NA);
      return { type: 'quad', ear: 'flop', size: 0.95, H: 2.25, hipY: 0.62, hipZ: -0.5, shY: 0.62, shZ: 0.3, clear: 0.32, sitHip: 0.27, sitTh: 0.6, sitPhi: 0.12, sitTail: [0, 0], lieTail: [-0.4, 0.3], headDrop: 0.28, wA: 0.42, rA: 0.62, wV: 1.0, rV: 2.5, sig: 'wagspin', sigDur: 3.0, tailIdle: 0.2 }; },

    cat: function (R, v) { var HC = [0, 1.54, 0.42], HR = [0.68, 0.56, 0.56], st = C(v.stripe), fu = C(v.fur);
      core(R, 0.8, -0.1, 0.6, -0.46, 1.05, 0.28);
      R.put('body', new THREE.SphereGeometry(1, 12, 12).rotateX(PI / 2), TR(0, 0.76, -0.12, 0, 0.44, 0.44, 0.66), function (k, x, y, z) { var i = Math.round(Math.acos(cl((z + 0.12) / 0.66, -1, 1)) / PI * 12); return (i === 3 || i === 5 || i === 7 || i === 9) && y > 0.9 ? st : fu; });
      R.patch('body', [0, 0.76, -0.12], [0.44, 0.44, 0.66], 0, -0.25, 0.26, 0.3, 0.09, v.belly, 14, 3, {});
      R.legs4(0.25, 0.6, 0.6, 0.28, -0.46, 0.14, v.fur, v.belly, 0.6);
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 16, 10, NA);
      [[0, 1.02, 0.05, 0.16], [0.42, 0.95, 0.045, 0.13], [-0.42, 0.95, 0.045, 0.13]].forEach(function (s) { R.patch('head', HC, HR, s[0], s[1], s[2], s[3], 0.06, v.stripe, 6, 4); });
      [1, -1].forEach(function (s) { var n = s > 0 ? 'earL' : 'earR'; R.bone(n, 'head', s * 0.4, 1.9, 0.4, 'YXZ');
        R.put(n, Toy.lathe([[0.3, 0], [0.25, 0.14], [0.1, 0.38], [0.03, 0.45], [0, 0.46]], 8), TR(s * 0.4, 1.84, 0.38, 0, 1, 1, 0.68, 0, -s * 0.4), v.fur, NA);
        R.put(n, Toy.lathe([[0.18, 0], [0.14, 0.1], [0.05, 0.27], [0, 0.31]], 6), TR(s * 0.42, 1.9, 0.52, 0, 1, 1, 0.3, 0, -s * 0.4), v.ear, NA);
        R.E('head', s * 0.12, 1.4, 0.92, 0.18, 0.14, 0.13, v.belly, 8, 5, NA);
        for (var i = -1; i <= 1; i++) R.put('head', stick([s * 0.2, 1.4 + i * 0.02, 0.98], [s * 0.66, 1.4 + i * 0.13, 0.86], 0.016), null, '#ffffff', { noAO: 1, g: 0 }); });
      R.E('head', 0, 1.49, 1.01, 0.07, 0.05, 0.05, v.ear, 6, 4, NA); R.smile('head', 0.07, 1.42, 1.045, 0.065, 0.018); mouth(R, 0, 1.3, 0.9, 0.12, 0.07, 0.12, v.belly, 1.36, 0.76);
      R.eyes(HC, HR, 0.45, 0.16, 0.16, 0.45, v.fur); R.cheeks(HC, HR, 0.9, -0.2, 0.12, v.fur);
      var tp = [[0, 0.92, -0.7, 0.1], [0, 1.1, -1.05, 0.1], [0, 1.55, -1.2, 0.1], [0, 1.95, -1.05, 0.095], [0, 2.06, -0.8, 0.085]], tb = R.chain('tail', 'body', tp, 4);
      R.limb(tb, tp, 7, 2, 0, 1, function (t) { return t > 0.86 ? v.stripe : (t > 0.2 && t < 0.3) || (t > 0.45 && t < 0.55) || (t > 0.68 && t < 0.76) ? v.stripe : v.fur; }, NA);
      R.put('body', new THREE.TorusGeometry(0.36, 0.055, 4, 12), TR(0, 1.1, 0.36, 0, 1, 1, 1, PI / 2 - 0.1), v.collar, NA); R.E('body', 0, 1.0, 0.7, 0.085, 0.085, 0.075, '#ffc83d', 6, 4, NA);
      return { type: 'quad', ear: 'up', size: 0.9, H: 2.4, hipY: 0.6, hipZ: -0.46, shY: 0.6, shZ: 0.28, clear: 0.32, sitHip: 0.24, sitTh: 0.66, sitPhi: 0.1, sitTail: [-1.5, 0.5], lieTail: [-1.1, 0.5], headDrop: 0.26, wA: 0.42, rA: 0.62, wV: 0.95, rV: 2.5, sig: 'groom', sigDur: 3.8, tailIdle: 0.16 }; },

    lion: function (R, v) { var HC = [0, 1.68, 0.5], HR = [0.6, 0.56, 0.54];
      core(R, 0.9, -0.12, 0.66, -0.55, 1.2, 0.25);
      R.E('body', 0, 0.86, -0.15, 0.54, 0.52, 0.74, v.fur, 12, 9); R.patch('body', [0, 0.86, -0.15], [0.54, 0.52, 0.74], 0, -0.3, 0.33, 0.34, 0.09, v.belly, 14, 3, {});
      R.legs4(0.3, 0.66, 0.66, 0.28, -0.55, 0.19, v.fur, mix(v.fur, '#ffffff', 0.45), 0.62);
      R.bone('mane', 'head', 0, 1.6, 0.2, 'YXZ');
      var mg = new THREE.SphereGeometry(1, 27, 5).rotateX(PI / 2), P = mg.attributes.position, i; for (i = 0; i < P.count; i++) { var a = Math.atan2(P.getY(i), P.getX(i)), k = 0.9 + 0.2 * Math.pow(Math.abs(Math.sin(a * 4.5 + 0.3)), 0.7); P.setXYZ(i, P.getX(i) * 0.96 * k, P.getY(i) * 0.94 * k, P.getZ(i) * 0.42); }
      R.put('mane', Toy.smooth(mg, 80), TR(0, 1.68, 0.3), v.mane2, NA); R.E('mane', 0, 1.5, -0.02, 0.8, 0.8, 0.52, v.mane, 10, 7, NA);
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 14, 9, NA);
      [1, -1].forEach(function (s) { var n = s > 0 ? 'earL' : 'earR'; R.bone(n, 'head', s * 0.42, 2.08, 0.5, 'YXZ'); R.D(n, s * 0.46, 2.2, 0.52, 0.19, 0.19, 0.12, v.fur, 10, 4, NA); R.D(n, s * 0.46, 2.19, 0.6, 0.1, 0.1, 0.05, v.mane, 8, 3, NA); });
      R.E('head', 0, 1.52, 0.96, 0.34, 0.24, 0.24, v.belly, 8, 6, NA); R.E('head', 0, 1.64, 1.18, 0.14, 0.09, 0.07, v.nose, 8, 5, { noAO: 1, g: 0.5 });
      R.smile('head', 0.1, 1.5, 1.175, 0.1); mouth(R, 0, 1.32, 0.92, 0.21, 0.1, 0.19, v.belly, 1.4, 0.74);
      [1, -1].forEach(function (s) { R.put('head', new THREE.ConeGeometry(0.035, 0.1, 4), TR(s * 0.1, 1.33, 1.06, 0, 1, 1, 1, PI), '#ffffff', { noAO: 1, g: 0 }); });
      R.eyes(HC, HR, 0.45, 0.2, 0.15, 0.45, v.fur); R.cheeks(HC, HR, 0.85, -0.18, 0.12, v.fur);
      var tp = [[0, 1.0, -0.85, 0.08], [0, 0.95, -1.25, 0.07], [0, 1.25, -1.55, 0.065], [0, 1.62, -1.5, 0.06]], tb = R.chain('tail', 'body', tp, 4); R.limb(tb, tp, 6, 2, 0, 1, v.fur, NA); R.E('tail3', 0, 1.74, -1.46, 0.16, 0.21, 0.16, v.mane, 8, 6, NA, 0, 0.3);
      return { type: 'quad', ear: 'up', size: 0.95, H: 2.7, hipY: 0.66, hipZ: -0.55, shY: 0.66, shZ: 0.28, clear: 0.34, sitHip: 0.3, sitTh: 0.55, sitPhi: 0.1, sitTail: [-0.7, 0.4], lieTail: [-0.5, 0.45], headDrop: 0.3, wA: 0.4, rA: 0.58, wV: 0.95, rV: 2.4, sig: 'roar', sigDur: 3.4, tailIdle: 0.18, jawK: 1.0 }; },

    croc: function (R, v) { var HC = [0, 0.64, 0.82], HR = [0.52, 0.36, 0.44], fu = C(v.fur), be = C(v.belly), i;
      function two(lim) { return function (k, x, y) { return y < lim ? be : fu; }; }
      core(R, 0.5, -0.2, 0.42, -0.7, 0.5, 0.5);
      R.put('body', us(14, 10), TR(0, 0.5, -0.15, 0, 0.6, 0.42, 0.92), two(0.34));
      [['legFL', 1, 0.32], ['legFR', -1, 0.32], ['legBL', 1, -0.62], ['legBR', -1, -0.62]].forEach(function (l) { var s = l[1], z = l[2]; R.bone(l[0], 'body', s * 0.42, 0.4, z, 'YXZ');
        R.limb(l[0], [[s * 0.36, 0.44, z, 0.17], [s * 0.7, 0.32, z + 0.03, 0.15], [s * 0.82, 0.13, z + 0.1, 0.15]], 7, 1, 0, 0.9, v.fur); R.E(l[0], s * 0.86, 0.09, z + 0.2, 0.17, 0.085, 0.2, v.fur, 6, 4); });
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 14, 8, NA);
      R.limb('head', [[0, 0.62, 0.9, 0.44, 0.22], [0, 0.6, 1.3, 0.36, 0.17], [0, 0.59, 1.66, 0.31, 0.15]], 10, 2, 0, 0.9, v.fur, NA);
      [1, -1].forEach(function (s) { R.E('head', s * 0.14, 0.72, 1.74, 0.08, 0.07, 0.08, v.fur, 6, 4, NA); R.E('head', s * 0.14, 0.75, 1.8, 0.03, 0.025, 0.02, INK, 4, 3, { noAO: 1, g: 0 }); R.E('head', s * 0.29, 0.93, 0.74, 0.22, 0.22, 0.24, v.fur, 8, 6, NA); });
      R.E('head', 0, 0.46, 1.25, 0.26, 0.05, 0.46, TONGUE, 8, 4, { noAO: 1, g: 0.3 });
      for (i = 0; i < 4; i++) [1, -1].forEach(function (s) { R.put('head', new THREE.ConeGeometry(0.055, 0.15, 5), TR(s * (0.36 - i * 0.03), 0.42, 1.0 + i * 0.22, 0, 1, 1, 1, PI), '#ffffff', { noAO: 1, g: 0 }); });
      R.bone('jaw', 'head', 0, 0.46, 0.72);
      R.limb('jaw', [[0, 0.42, 0.86, 0.36, 0.14], [0, 0.4, 1.3, 0.28, 0.11], [0, 0.4, 1.6, 0.23, 0.1]], 10, 2, 0, 0.9, mix(v.belly, v.fur, 0.25), NA); R.E('jaw', 0, 0.5, 1.2, 0.2, 0.04, 0.4, MOUTH, 8, 4, { noAO: 1, g: 0.3 });
      R.eyes([0, 0.93, 0.76], [0.5, 0.24, 0.26], 0.62, 0.25, 0.155, 0.75, v.fur, 0.3); R.cheeks(HC, HR, 1.05, -0.05, 0.11, v.fur);
      var tp = [[0, 0.5, -0.85, 0.4, 0.33], [0, 0.4, -1.3, 0.27, 0.23], [0, 0.3, -1.72, 0.15, 0.13], [0, 0.25, -2.05, 0.06, 0.06]], tb = R.chain('tail', 'body', tp, 4); R.limb(tb, tp, 9, 2, 0, 1, function () { return v.fur; });
      var sc = Toy.lathe([[0.13, 0], [0.1, 0.09], [0.035, 0.2], [0, 0.23]], 5);
      [[0.2, 0.85, 0.35], [-0.2, 0.85, 0.35], [0.22, 0.9, 0.02], [-0.22, 0.9, 0.02], [0.22, 0.88, -0.32], [-0.22, 0.88, -0.32], [0.18, 0.82, -0.64], [-0.18, 0.82, -0.64]].forEach(function (s) { R.put('body', sc, TR(s[0], s[1] - 0.06, s[2], 0, 1, 1, 1, 0, -s[0] * 1.2), v.back, NA); });
      [[0.78, -1.0, 1, 0], [0.63, -1.32, 0.85, 1], [0.48, -1.6, 0.7, 2], [0.36, -1.86, 0.5, 3]].forEach(function (s) { R.put('tail' + s[3], sc, TR(0, s[0] - 0.05, s[1], 0, s[2], s[2], s[2] * 1.2), v.back, NA); });
      return { type: 'croc', ear: null, size: 0.95, H: 1.2, len: 2.0, hipY: 0.4, clear: 0.07, wA: 0.5, rA: 0.65, wV: 0.7, rV: 1.7, sig: 'snap', sigDur: 3.2, tailIdle: 0.1, jawK: 1.0, frame: [2.15, 0.45] }; },

    monkey: function (R, v) { var HC = [0, 1.85, 0.48], HR = [0.58, 0.55, 0.54];
      core(R, 1.0, -0.08, 0.78, -0.42, 1.4, 0.3);
      R.E('body', 0, 0.98, -0.08, 0.42, 0.42, 0.56, v.fur, 14, 10, null, 0, -0.25); R.put('body', uz(14, 3), TR(0, 0.73, 0.225, 0, 0.27, 0.36, 0.1, 0.96), v.face, {});
      [['legBL', 1], ['legBR', -1]].forEach(function (l) { var x = l[1] * 0.27; R.bone(l[0], 'body', x, 0.78, -0.42, 'YXZ'); R.limb(l[0], [[x, 0.9, -0.42, 0.15], [x, 0.42, -0.4, 0.13], [x * 1.05, 0.15, -0.36, 0.14]], 7, 1, 0, 0.9, v.fur, { g: 0.5 }); R.E(l[0], x * 1.05, 0.1, -0.24, 0.17, 0.1, 0.25, v.face, 6, 4); });
      [['legFL', 1], ['legFR', -1]].forEach(function (l) { var x = l[1] * 0.34; R.bone(l[0], 'body', x, 1.12, 0.28, 'YXZ'); R.limb(l[0], [[x * 0.9, 1.2, 0.26, 0.13], [x * 1.12, 0.62, 0.42, 0.115], [x * 1.12, 0.2, 0.5, 0.12]], 7, 2, 0, 0.9, v.fur, { g: 0.5 }); R.E(l[0], x * 1.12, 0.13, 0.53, 0.16, 0.13, 0.19, v.face, 6, 4); });
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 16, 10, NA);
      R.patch('head', HC, HR, 0.33, 0.14, 0.27, 0.28, 0.1, v.face, 12, 3); R.patch('head', HC, HR, -0.33, 0.14, 0.27, 0.28, 0.1, v.face, 12, 3);
      R.E('head', 0, 1.66, 0.94, 0.35, 0.25, 0.22, v.face, 10, 7, NA);
      [1, -1].forEach(function (s) { var n = s > 0 ? 'earL' : 'earR'; R.bone(n, 'head', s * 0.5, 1.9, 0.42, 'YXZ'); R.D(n, s * 0.7, 1.92, 0.4, 0.31, 0.31, 0.1, v.fur, 14, 4, NA, s * 0.45); R.D(n, s * 0.735, 1.92, 0.46, 0.2, 0.2, 0.065, v.ear, 12, 3, NA, s * 0.45); R.E('head', s * 0.06, 1.74, 1.14, 0.025, 0.03, 0.02, INK, 4, 3, { noAO: 1, g: 0 }); });
      R.smile('head', 0, 1.67, 1.1, 0.17, 0.024); mouth(R, 0, 1.5, 0.9, 0.21, 0.09, 0.17, v.face, 1.56, 0.76);
      R.put('head', Toy.lathe([[0.13, 0], [0.1, 0.1], [0.03, 0.24], [0, 0.27]], 6), TR(0, 2.34, 0.42, 0, 1, 1, 1, -0.3), v.fur, NA);
      R.eyes(HC, HR, 0.33, 0.16, 0.15, 0.3, v.face); R.cheeks(HC, HR, 0.8, -0.2, 0.11, v.face);
      var tp = [[0, 0.95, -0.6, 0.08], [0, 1.0, -1.0, 0.075], [0, 1.35, -1.32, 0.07], [0, 1.8, -1.28, 0.065], [0, 1.98, -1.0, 0.06], [0, 1.78, -0.82, 0.058], [0, 1.6, -0.98, 0.052]], tb = R.chain('tail', 'body', tp, 5); R.limb(tb, tp, 6, 2, 0, 1, v.fur, NA);
      return { type: 'quad', ear: 'disc', size: 0.9, H: 2.5, hipY: 0.78, hipZ: -0.42, shY: 1.12, shZ: 0.28, clear: 0.5, sitHip: 0.26, sitTh: 0.95, sitPhi: 0.5, sitTail: [-1.0, 0.3], lieTail: [-0.2, 0.4], lieRx: 0.25, lieBack: 1, headDrop: 0, sleepRx: 0.02, wA: 0.4, rA: 0.6, wV: 1.0, rV: 2.5, sig: 'flip', sigDur: 3.8, tailIdle: 0.12, upright: 1, HU: 3.0 }; },

    bird: function (R, v) { var HC = [0, 1.68, 0.2], HR = [0.52, 0.5, 0.5];
      core(R, 0.95, 0, 0.55, 0, 1.3, 0.1);
      R.E('body', 0, 0.92, -0.05, 0.56, 0.6, 0.64, v.fur, 14, 10); R.patch('body', [0, 0.92, -0.05], [0.56, 0.6, 0.64], 0, -0.3, 0.4, 0.42, 0.07, v.belly, 16, 3, {});
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 16, 10, NA);
      R.put('head', Toy.lathe([[0.18, 0], [0.16, 0.1], [0.07, 0.32], [0, 0.4]], 8).rotateX(PI / 2), TR(0, 1.64, 0.62, 0, 1, 0.62, 1), v.beak, NA);
      R.bone('jaw', 'head', 0, 1.58, 0.6); R.put('jaw', Toy.lathe([[0.15, 0], [0.13, 0.08], [0.05, 0.25], [0, 0.31]], 8).rotateX(PI / 2), TR(0, 1.57, 0.62, 0, 1, 0.45, 1), mix(v.beak, '#c0392b', 0.25), NA);
      R.eyes(HC, HR, 0.62, 0.12, 0.15, 0.4, v.fur, 0.25); R.cheeks(HC, HR, 1.0, -0.28, 0.12, v.fur);
      R.bone('crest', 'head', 0, 2.12, 0.15, 'YXZ'); [[0, 0.07, 0.36, 0], [0.13, 0.06, 0.26, -0.5], [-0.13, 0.06, 0.26, 0.5]].forEach(function (c) { R.limb('crest', [[c[0], 2.08, 0.2, c[1]], [c[0] * 1.5, 2.08 + c[2], 0.1, c[1] * 0.9], [c[0] * 1.9, 2.1 + c[2] * 1.3, -0.14, c[1] * 0.45]], 5, 1, 0, 1, v.crest, NA); });
      [1, -1].forEach(function (s) { var n = s > 0 ? 'wingL' : 'wingR'; R.bone(n, 'body', s * 0.5, 1.22, 0.05, 'YXZ'); R.E(n, s * 0.6, 0.86, -0.12, 0.1, 0.44, 0.34, v.wing, 8, 6, NA, 0, 0.35, s * 0.1);
        R.E(n, s * 0.64, 0.56, -0.38, 0.07, 0.2, 0.13, mix(v.wing, '#ffffff', 0.4), 6, 4, NA, 0, 0.5); R.E(n, s * 0.65, 0.68, -0.48, 0.06, 0.17, 0.1, mix(v.wing, '#ffffff', 0.65), 6, 4, NA, 0, 0.8);
        var l = s > 0 ? 'legBL' : 'legBR'; R.bone(l, 'body', s * 0.22, 0.42, 0.02, 'YXZ'); R.limb(l, [[s * 0.22, 0.5, 0.02, 0.06], [s * 0.22, 0.08, 0.02, 0.055]], 5, 1, 0, 0, v.beak); R.E(l, s * 0.23, 0.05, 0.12, 0.17, 0.05, 0.21, v.beak, 8, 4); });
      R.bone('tail0', 'body', 0, 0.85, -0.58, 'YXZ'); [[0, 1], [0.5, 0.86], [-0.5, 0.86]].forEach(function (f) { R.E('tail0', Math.sin(f[0]) * -0.36, 1.26 - Math.abs(f[0]) * 0.12, -0.84, 0.2, 0.06, 0.5 * f[1], f[0] ? v.wing : mix(v.wing, '#ffffff', 0.45), 7, 4, NA, -f[0], 1.0); });
      return { type: 'bird', ear: null, size: 0.72, H: 2.5, hipY: 0.42, clear: 0.3, wA: 0.5, rA: 0.6, wV: 0.9, rV: 2.2, sig: 'fly', sigDur: 4.2, tailIdle: 0.1, jawK: 0.7, tailN: 1 }; },

    elephant: function (R, v) { var HC = [0, 1.78, 0.6], HR = [0.66, 0.62, 0.6], i;
      core(R, 1.0, -0.2, 0.75, -0.62, 1.35, 0.3);
      R.E('body', 0, 1.0, -0.2, 0.72, 0.68, 0.86, v.fur, 14, 9);
      [['legFL', 1, 0.28], ['legFR', -1, 0.28], ['legBL', 1, -0.62], ['legBR', -1, -0.62]].forEach(function (l) { var x = l[1] * 0.4, z = l[2]; R.bone(l[0], 'body', x, 0.75, z, 'YXZ');
        R.limb(l[0], [[x, 0.86, z, 0.25], [x, 0.4, z, 0.24], [x, 0.14, z + 0.02, 0.265]], 8, 1, 1, 0.5, v.fur, { g: 0.4 }); for (i = -1; i <= 1; i += (z > 0 ? 1 : 2)) R.E(l[0], x + i * 0.13, 0.08, z + 0.25 - Math.abs(i) * 0.04, 0.07, 0.07, 0.05, v.nail, 5, 3); });
      R.E('head', 0, HC[1], HC[2], HR[0], HR[1], HR[2], v.fur, 14, 10, NA);
      [1, -1].forEach(function (s) { var n = s > 0 ? 'earL' : 'earR'; R.bone(n, 'head', s * 0.5, 1.88, 0.42, 'YXZ'); R.D(n, s * 1.0, 1.76, 0.3, 0.54, 0.6, 0.1, v.fur, 20, 4, NA, s * 0.32); R.D(n, s * 1.02, 1.74, 0.36, 0.4, 0.46, 0.07, v.ear, 18, 3, NA, s * 0.32);
        R.limb('head', [[s * 0.3, 1.44, 1.0, 0.075], [s * 0.37, 1.24, 1.26, 0.065], [s * 0.4, 1.24, 1.46, 0.03]], 5, 1, 0, 1, '#ffffff', { noAO: 1, g: 0.5 }); });
      var kp = [[0, 1.62, 1.08, 0.26], [0, 1.3, 1.42, 0.215], [0, 0.9, 1.52, 0.175], [0, 0.55, 1.5, 0.145], [0, 0.38, 1.66, 0.125]], kb = R.chain('trunk', 'head', kp, 5); R.limb(kb, kp, 8, 2, 0, 0.7, function (t) { return t > 0.97 ? v.ear : v.fur; }, NA);
      mouth(R, 0, 1.3, 0.98, 0.2, 0.1, 0.16, v.fur, 1.38, 0.8);
      R.eyes(HC, HR, 0.6, 0.14, 0.135, 0.4, v.fur, 0.3); R.cheeks(HC, HR, 0.82, -0.3, 0.12, v.fur);
      var tp = [[0, 1.2, -1.0, 0.06], [0, 0.95, -1.17, 0.05], [0, 0.7, -1.15, 0.045]], tb = R.chain('tail', 'body', tp, 2); R.limb(tb, tp, 5, 2, 0, 1, v.fur, NA); R.E('tail1', 0, 0.62, -1.14, 0.08, 0.13, 0.08, v.dark, 6, 4, NA);
      for (i = 0; i < 3; i++) { R.bone('drop' + i, 'trunk4', 0, 0.42, 1.62); R.E('drop' + i, 0.03 * (i - 1), 0.42, 1.62, 0.08, 0.1, 0.08, '#5fc8ff', 5, 3, { noAO: 1, g: 0.3 }); R.E('drop' + i, -0.03 * (i - 1), 0.47, 1.6, 0.055, 0.07, 0.055, '#a6e2ff', 5, 3, { noAO: 1, g: 0.3 }); }
      return { type: 'quad', ear: 'fan', size: 1.05, H: 2.45, hipY: 0.75, hipZ: -0.62, shY: 0.75, shZ: 0.28, clear: 0.32, sitHip: 0.36, sitTh: 0.45, sitPhi: 0.08, sitTail: [0, 0], lieTail: [0, 0.3], headDrop: 0.2, wA: 0.32, rA: 0.45, wV: 0.8, rV: 1.8, sig: 'spray', sigDur: 3.8, tailIdle: 0.25, slow: 1, frame: [1.6, 1.2] }; }
  };
  var KINDS = ['dog', 'cat', 'lion', 'croc', 'monkey', 'bird', 'elephant'];

  // ---------- the look: the toy material (glossy plastic + rim light) with skinning, and the outline for small sizes ----------
  function Look() { var uRim = { value: new THREE.Color('#39382e') }, uOut = { value: 0.035 };
    var mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 46, specular: 0x1d1d1d });
    mat.onBeforeCompile = function (sh) { sh.uniforms.uRim = uRim; sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <envmap_fragment>', 'float rimK = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);\n outgoingLight += uRim * rimK * (0.35 + diffuseColor.rgb);\n#include <envmap_fragment>'); };
    var out = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, color: 0x67596e });
    out.onBeforeCompile = function (sh) { sh.uniforms.uOut = uOut; sh.vertexShader = 'uniform float uOut;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ) + normalize( normal ) * uOut;'); };
    return { mat: mat, out: out, uRim: uRim, uOut: uOut, set: function (P) { mat.color.set(P.tint).lerp(WHITE, 0.5); mat.specular.set(P.spec); uRim.value.set(P.rim); out.color.set(P.tint).multiplyScalar(0.42); } }; }
  var WHITE = new THREE.Color('#ffffff'), LOOK = null; function look0() { return LOOK || (LOOK = Look()); }
  var blobTex = null;
  function blobMesh() { if (typeof document === 'undefined') return null;
    if (!blobTex) { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.55, 'rgba(255,255,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(cv); }
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, color: 0x145a2d, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.renderOrder = 1; return m; }

  // ---------- motion: channels. Everything below adds to the channels; write() puts them on the bones ----------
  function chans() { return { rootX: 0, rootY: 0, rootZ: 0, rootRx: 0, rootRy: 0, rootRz: 0, sq: 0, coreRx: 0, bodyY: 0, bodyZ: 0, bodyRx: 0, bodyRy: 0, bodyRz: 0, bodyS: 0, headY: 0, headZ: 0, headRx: 0, headRy: 0, headRz: 0, jaw: 0, lid: 0, eyeX: 0, eyeY: 0,
    earLift: 0, earSw: 0, earTwL: 0, earTwR: 0, earFlap: 0, tailSide: 0, tailCurl: 0, trunkUp: 0, wingL: 0, wingR: 0, wingF: 0, mane: 0, maneRz: 0, crest: 0, drop: 0,
    lRx: new Float32Array(4), lRy: new Float32Array(4), lRz: new Float32Array(4), lY: new Float32Array(4), tRx: new Float32Array(6), tRy: new Float32Array(6), kRx: new Float32Array(6), kRy: new Float32Array(6) }; }
  function zero(c) { for (var k in c) { var v = c[k]; if (typeof v === 'number') c[k] = 0; else v.fill(0); } }
  function wave(arr, n, A, ph, lag) { for (var i = 0; i < n; i++) arr[i] += A * Math.sin(ph - lag * i) * (0.55 + 0.45 * i / Math.max(1, n - 1)); }
  function key(u, K) { var n = K.length, i; if (u <= K[0]) return K[1]; for (i = 2; i < n; i += 2) if (u < K[i]) return lerp(K[i - 1], K[i + 1], ss(K[i - 2], K[i], u)); return K[n - 1]; }
  var LS = 0, LL = 0;
  function legCyc(p, duty) { p -= Math.floor(p); if (p < duty) { LS = 1 - 2 * p / duty; LL = 0; } else { var q = (p - duty) / (1 - duty); LS = -Math.cos(q * PI); LL = Math.sin(q * PI); } }
  var OW = [0.25, 0.75, 0, 0.5], OT = [0, 0.5, 0.5, 0], WD = 0.62, RD = 0.45;        // leg order: front left, front right, back left, back right. Walk: back left, front left, back right, front right. Trot: diagonal pairs

  function gait(c, d, g, r, p, stride) { var i, tp = 2 * PI * p, A = lerp(d.wA, d.rA, r) * stride, s, l;
    if (d.type === 'bird') {                             // hops: both feet together, a small flutter in the air
      var q = p - Math.floor(p), H = lerp(0.3, 0.55, r) * stride;
      if (q < 0.34) { var k = Math.sin(PI * q / 0.34); c.sq -= g * 0.1 * k; c.headRx += g * 0.08 * k; c.tRx[0] += g * 0.25 * k; }
      else { var a = (q - 0.34) / 0.66, sa = Math.sin(PI * a); c.rootY += g * H * sa; c.sq += g * 0.06 * (1 - sa) * (a < 0.5 ? 1 : 0.4); c.lRx[2] += g * 0.55 * sa; c.lRx[3] += g * 0.55 * sa;
        var fl = g * (0.35 + 0.5 * r) * sa * (0.7 + 0.5 * Math.sin(a * PI * (4 + 4 * r))); c.wingL += fl; c.wingR += fl; c.rootRx += g * 0.1 * Math.cos(PI * a); c.tRx[0] -= g * 0.2 * sa; c.crest += g * 0.5 * Math.cos(PI * a); }
      return; }
    if (d.type === 'croc') {                             // low waddle: diagonal pairs, the legs sweep sideways, the body and the tail wave
      for (i = 0; i < 4; i++) { legCyc(p + OT[i], 0.55); var sd = i % 2 ? -1 : 1; c.lRy[i] += g * -sd * A * LS; c.lRz[i] += g * sd * 0.3 * LL; c.lRx[i] += g * -0.25 * A * LS; }
      c.bodyRy += g * 0.11 * Math.sin(tp + 0.6) * stride; c.headRy -= g * 0.13 * Math.sin(tp + 0.2) * stride; c.rootRz += g * 0.03 * Math.sin(tp); wave(c.tRy, 4, g * (0.3 + 0.1 * r) * (0.4 + 0.6 * stride), tp - 0.6, 0.85); c.bodyY += g * 0.03 * (1 + r); return; }
    for (i = 0; i < 4; i++) { legCyc(p + OW[i], WD); s = LS; l = LL; if (r > 0) { legCyc(p + OT[i], RD); s = lerp(s, LS, r); l = lerp(l, LL, r); } c.lRx[i] += g * -A * s; c.lY[i] += g * l * lerp(0.09, 0.15, r) * (0.5 + 0.5 * stride); }
    var sl = d.slow ? 1.6 : 1;
    c.bodyY += g * lerp(0.02, 0.06, r) * Math.cos(2 * tp) * stride; c.rootRx += g * r * 0.05 * Math.sin(2 * tp); c.bodyRz += g * 0.035 * sl * Math.sin(tp) * (1 - r * 0.5); c.bodyRy += g * 0.05 * Math.sin(tp + 0.5) * stride;
    c.headRx += g * 0.05 * Math.sin(2 * tp + 1.0); c.headRz -= g * 0.03 * sl * Math.sin(tp);
    wave(c.tRy, d.tailN, g * (0.2 + 0.1 * r), tp, 0.8); c.tRx[0] += g * 0.08 * Math.sin(2 * tp - 1); c.earSw += g * (0.1 + 0.22 * r) * Math.sin(2 * tp - 1.3); c.earLift += g * r * 0.3;
    if (d.trunkN) { wave(c.kRy, 5, g * 0.09, tp, 0.6); for (i = 0; i < 5; i++) c.kRx[i] += g * 0.045 * Math.sin(2 * tp - 0.5 * i); c.earFlap += g * 0.16 * Math.sin(tp); } }

  function sitPose(c, d, w) { if (w <= 0) return;
    if (d.type === 'croc') { c.bodyY -= w * d.clear; c.headRx -= w * 0.3; c.tailSide += w * 0.42; c.lRy[0] -= w * 0.3; c.lRy[1] += w * 0.3; c.jaw += w * 0.12; return; }
    if (d.type === 'bird') { c.bodyY -= w * 0.34; c.lY[2] += w * 0.34; c.lY[3] += w * 0.34; c.bodyS += w * 0.05; c.tRx[0] += w * 0.2; return; }
    var q = d.sit; c.bodyRx -= w * q.th; c.bodyY -= w * q.drop; c.headRx += w * q.th * 0.9;
    c.lRx[2] += w * (q.th - 1.4); c.lRx[3] += w * (q.th - 1.4); c.lRz[2] += w * 0.3; c.lRz[3] -= w * 0.3;
    c.lRx[0] += w * (q.th - q.phi); c.lRx[1] += w * (q.th - q.phi); c.lY[0] -= w * q.slide; c.lY[1] -= w * q.slide;
    c.tRx[0] += w * (q.th + d.sitTail[0]); c.tailSide += w * d.sitTail[1]; }
  function liePose(c, d, w, sl) { if (w <= 0) return;
    if (d.type === 'croc') { c.bodyY -= w * d.clear; c.headRx += sl * 0.05 - (w - sl) * 0.12; c.tailSide += w * 0.38 + sl * 0.2; c.lRy[0] -= w * 0.4; c.lRy[1] += w * 0.4; c.lRy[2] += w * 0.4; c.lRy[3] -= w * 0.4; }
    else if (d.type === 'bird') { c.bodyY -= w * 0.36; c.lY[2] += w * 0.36; c.lY[3] += w * 0.36; c.bodyS += w * 0.07; c.headRy += sl * 1.25; c.headRx += sl * 0.3; c.headY -= sl * 0.08; c.tRx[0] += w * 0.2; c.crest -= sl * 0.6; }
    else { var dr = d.clear + 0.1; c.bodyY -= w * dr; c.bodyRx += w * (d.lieRx || 0);
      c.lRx[0] -= w * 1.32; c.lRx[1] -= w * 1.32; c.lRz[0] += w * 0.12; c.lRz[1] -= w * 0.12; if (d.lieBack) { c.lRx[2] += w * 1.25; c.lRx[3] += w * 1.25; c.lY[0] += w * 0.3; c.lY[1] += w * 0.3; } else { c.lRx[2] -= w * 1.3; c.lRx[3] -= w * 1.3; }
      c.lRz[2] += w * 0.34; c.lRz[3] -= w * 0.34; c.headRx += (w - sl) * 0.06 + sl * (d.sleepRx || 0.3) - w * (d.lieRx || 0); c.headY -= sl * d.headDrop; c.headZ += sl * 0.06; c.headRz += sl * 0.2; c.headRy += sl * 0.22;
      c.tRx[0] += w * d.lieTail[0]; c.tailSide += w * d.lieTail[1]; if (d.trunkN) { c.kRx[1] -= w * 0.5; c.kRx[2] -= w * 0.5; c.kRx[3] -= w * 0.3; c.kRy[2] += sl * 0.5; } }
    c.lid += sl * 1.2; c.earLift -= sl * 0.5; c.earFlap -= sl * 0.3; c.jaw -= sl; }
  function upPose(c, d, w) { if (w <= 0) return; c.bodyRx -= w * 1.0; c.lRx[2] += w * 1.0; c.lRx[3] += w * 1.0; c.lRx[0] += w * 0.85; c.lRx[1] += w * 0.85; c.lRz[0] += w * 0.1; c.lRz[1] -= w * 0.1; c.headRx += w * 0.95; c.tRx[0] += w * 0.75; }

  // one-shot actions: u = 0..1 progress, at = seconds since the start, w = how much of the animal stands (1 - sit - lie)
  function jumpA(c, d, u, at, w, H) { var cr = win(u, 0, 0.3, 0.13), q = cl((u - 0.25) / 0.45, 0, 1), air = q > 0 && q < 1 ? 1 : 0, ld = win(u, 0.68, 0.95, 0.1), b = Math.sin(PI * q), qe = cl((u - 0.31) / 0.45, 0, 1), be = Math.sin(PI * qe);
    c.sq += -0.15 * cr - 0.13 * ld + air * 0.09 * (1 - b); c.rootY += H * 4 * q * (1 - q) * w;
    if (d.type === 'bird') { c.wingL += 1.1 * b; c.wingR += 1.1 * b; c.lRx[2] += 0.5 * b; c.lRx[3] += 0.5 * b; c.crest += be; }
    else if (d.type === 'croc') { c.lRz[0] += 0.4 * b; c.lRz[1] -= 0.4 * b; c.lRz[2] += 0.4 * b; c.lRz[3] -= 0.4 * b; c.tRx[0] += 0.35 * be; c.tRx[1] += 0.2 * be; c.headRx -= 0.2 * b; }
    else { c.lRx[0] -= 0.55 * b * w; c.lRx[1] -= 0.55 * b * w; c.lRx[2] += 0.5 * b * w; c.lRx[3] += 0.5 * b * w; c.tRx[0] += 0.3 * be; c.headRx -= 0.15 * b; if (d.trunkN) c.trunkUp += 0.5 * be; }
    c.earLift += 1.1 * be - 0.5 * ld; c.earSw -= 0.3 * (b - be); c.jaw += 0.45 * win(u, 0.2, 0.9, 0.15); c.lid -= 0.2 * b; c.earFlap += 0.5 * be; }
  var CROC_JAW = [0, 0, 0.3, 1, 0.34, 0, 0.42, 0, 0.52, 0.75, 0.555, 0, 0.66, 0];
  var ACT = {
    jump: function (c, d, u, at, w) { jumpA(c, d, u, at, w, d.type === 'croc' ? 0.45 : d.slow ? 0.5 : 0.85); },
    happy: function (c, d, u, at, w) { var e = win(u, 0, 1, 0.15), hop = Math.abs(Math.sin(u * PI * 3)); c.rootY += 0.2 * hop * e * w * (d.slow ? 0.6 : 1); c.sq += 0.05 * (hop - 0.5) * e; wave(c.tRy, d.tailN, 0.55 * e, at * 20, 0.6); c.jaw += 0.4 * e; c.earLift += 0.6 * e; c.headRz += 0.13 * Math.sin(at * 7) * e; c.lid += 0.08 * e; c.wingL += 0.5 * hop * e; c.wingR += 0.5 * hop * e; c.earFlap += 0.4 * Math.sin(at * 9) * e; c.crest += 0.6 * e; c.trunkUp += 0.35 * e; },
    surprised: function (c, d, u, at, w) { var e = win(u, 0, 1, 0.1), pop = Math.sin(PI * cl(u / 0.3, 0, 1)); c.rootY += 0.2 * pop * w; c.sq += 0.1 * e; c.bodyRx -= 0.1 * e * w; c.lRx[0] += 0.1 * e * w; c.lRx[1] += 0.1 * e * w; c.headRx -= 0.14 * e; c.lid -= 0.4 * e; c.earLift += 1.0 * e; c.jaw += 0.4 * e; c.tRx[0] += 0.35 * e; c.wingL += 0.6 * e; c.wingR += 0.6 * e; c.crest += 1.2 * e; c.earFlap += 0.7 * e; c.mane += 0.5 * e; },
    sleepy: function (c, d, u, at) { var y = win(u, 0.04, 0.62, 0.16), dz = win(u, 0.58, 1, 0.16); c.jaw += 0.85 * y; c.headRx += -0.3 * y + 0.26 * dz; c.lid += 0.95 * y + 0.6 * dz; c.earLift -= 0.6 * (y + dz); c.headRz += 0.1 * dz; c.sq += 0.03 * y; c.trunkUp += 0.3 * y; c.crest -= 0.5 * dz; },
    shy: function (c, d, u, at, w) { var e = win(u, 0, 1, 0.18); c.headRy -= 0.55 * e; c.headRx += 0.28 * e; c.headRz += 0.14 * e; c.eyeX += 0.9 * e; c.lid += 0.32 * e; c.earLift -= 0.8 * e; c.bodyRy += 0.1 * e; c.lRx[1] -= (0.25 + 0.08 * Math.sin(at * 8)) * e * w; c.lY[1] += 0.05 * e * w; c.tRx[0] -= 0.4 * e; c.tailSide += 0.25 * e; c.wingR += 0.5 * e; c.crest -= 0.6 * e; c.earFlap -= 0.4 * e; },
    spin: function (c, d, u, at) { var e = win(u, 0, 1, 0.15); c.rootRy += 2 * PI * ss(0.05, 0.95, u); gait(c, d, e, 0.4, u * 5, 0.5); c.rootRz -= 0.1 * e; c.earLift += 0.5 * e; },
    wagspin: function (c, d, u, at) { var e = win(u, 0, 1, 0.1), e1 = win(u, 0, 0.42, 0.1), e2 = win(u, 0.38, 0.95, 0.1); wave(c.tRy, 3, 0.85 * e, at * 24, 0.5); c.bodyRy += 0.07 * Math.sin(at * 24) * e1; c.jaw += 0.45 * e; c.earLift += 0.3 * e1 + 0.9 * e2; c.lid += 0.25 * e;
      c.bodyRx += 0.32 * e1; c.lRx[0] -= 1.0 * e1; c.lRx[1] -= 1.0 * e1; c.lRx[2] -= 0.32 * e1; c.lRx[3] -= 0.32 * e1; c.headRx -= 0.4 * e1; c.lY[0] += 0.1 * e1; c.lY[1] += 0.1 * e1; c.tRx[0] += 0.3 * e1;      // the play bow
      c.rootRy += 2 * PI * ss(0.42, 0.92, u); gait(c, d, e2, 0.6, u * 7, 0.55); c.rootRz -= 0.12 * e2; c.rootY += 0.08 * Math.abs(Math.sin(u * 14 * PI)) * e2; },
    groom: function (c, d, u, at) { var e1 = win(u, 0, 0.44, 0.12), e2 = win(u, 0.46, 1, 0.12);
      c.bodyRx += 0.3 * e1; c.lRx[0] -= 0.95 * e1; c.lRx[1] -= 0.95 * e1; c.lY[0] += 0.1 * e1; c.lY[1] += 0.1 * e1; c.lRx[2] -= 0.3 * e1; c.lRx[3] -= 0.3 * e1; c.headRx -= 0.42 * e1; c.tRx[0] += 0.3 * e1; c.tailCurl += 0.12 * e1; c.lid += 0.8 * e1; c.earLift -= 0.3 * e1; c.jaw += 0.5 * win(u, 0.1, 0.36, 0.1);
      sitPose(c, d, e2); c.lRx[0] -= 1.25 * e2; c.lRz[0] -= 0.42 * e2; c.lY[0] += 0.12 * e2; c.headRx += (0.42 + 0.1 * Math.sin(at * 9)) * e2; c.headRy += 0.3 * e2; c.headRz -= 0.12 * e2; c.lid += 0.85 * e2; c.jaw += 0.25 * e2; },
    roar: function (c, d, u, at) { var e1 = win(u, 0, 0.42, 0.08), e2 = win(u, 0.45, 0.97, 0.1), sh = Math.sin(at * 19);
      c.headRz += 0.34 * sh * e1; c.headRy += 0.2 * Math.cos(at * 19) * e1; c.maneRz += 0.3 * Math.sin(at * 19 - 0.9) * e1; c.mane += 0.3 * e1 + e2 * (1 + 0.12 * Math.sin(at * 40)); c.bodyRy -= 0.05 * sh * e1; c.lid += 0.85 * e1 + 0.8 * e2; c.earSw += 0.3 * sh * e1;
      c.bodyRx -= 0.13 * e2; c.lRx[0] += 0.13 * e2; c.lRx[1] += 0.13 * e2; c.lRx[2] += 0.13 * e2; c.lRx[3] += 0.13 * e2; c.headRx -= 0.6 * e2; c.jaw += 1.1 * e2; c.earLift -= 0.6 * e2; c.headRz += 0.03 * Math.sin(at * 38) * e2; c.tRx[0] += 0.3 * e2; wave(c.tRy, 4, 0.25 * e2, at * 9, 0.7); c.sq += 0.04 * e2; },
    snap: function (c, d, u, at) { var j = key(u, CROC_JAW), e = win(u, 0.64, 1, 0.1), hit = win(u, 0.33, 0.42, 0.03) + win(u, 0.55, 0.64, 0.03);
      c.jaw += 0.55 * j + 0.22 * e; c.headRx -= 0.42 * j + 0.1 * e; c.sq -= 0.05 * hit; c.headRz += 0.22 * e; c.headRy += 0.3 * e; c.lid += 0.4 * e - 0.25 * j; wave(c.tRy, 4, 0.4 * e, at * 6, 0.8); c.bodyRy -= 0.08 * e; c.tRx[0] += 0.2 * j; },
    flip: function (c, d, u, at) { var e1 = win(u, 0, 0.55, 0.12), up = win(u, 0, 1, 0.1), cr = win(u, 0.52, 0.66, 0.06), q = cl((u - 0.62) / 0.28, 0, 1), air = q > 0 && q < 1 ? 1 : 0, b = Math.sin(PI * q), ld = win(u, 0.88, 1, 0.05);
      upPose(c, d, up - d._up * up); c.lRx[1] -= 2.45 * e1 + 0.16 * Math.sin(at * 14) * e1; c.lRz[1] -= 0.35 * e1; c.headRz -= 0.16 * e1; c.headRy -= 0.12 * e1; c.lid += 0.45 * e1; c.jaw += 0.3 * e1; c.lRz[0] += 0.25 * e1;
      c.sq += -0.16 * cr - 0.14 * ld + air * 0.06; c.rootY += 1.15 * 4 * q * (1 - q); c.coreRx -= 2 * PI * ss(0.05, 0.95, q); c.lRx[2] -= 1.0 * b; c.lRx[3] -= 1.0 * b; c.lRx[0] -= 0.9 * b; c.lRx[1] -= 0.9 * b; c.tailCurl -= 0.15 * b; c.earLift += b; },
    fly: function (c, d, u, at) { var e = win(u, 0.06, 0.94, 0.14), a = 2 * PI * ss(0.1, 0.88, u), Rc = 1.15, cr = win(u, 0, 0.14, 0.06), ld = win(u, 0.9, 1, 0.04), fl = Math.sin(at * 13);
      c.rootX += Rc * (1 - Math.cos(a)); c.rootZ += Rc * Math.sin(a); c.rootRy += a; c.rootY += 1.25 * e + 0.05 * e * Math.sin(at * 13 - 1.5); c.sq += -0.12 * cr - 0.12 * ld;
      c.wingL += (0.95 + 0.75 * fl) * e + 0.5 * cr; c.wingR += (0.95 + 0.75 * fl) * e + 0.5 * cr; c.wingF += e; c.rootRx += 0.28 * e; c.rootRz -= 0.24 * win(u, 0.14, 0.86, 0.12); c.lRx[2] += 1.0 * e; c.lRx[3] += 1.0 * e; c.tRx[0] -= 0.3 * e; c.headRx -= 0.2 * e; c.crest -= 0.5 * e; c.jaw += 0.5 * win(u, 0.3, 0.6, 0.1); },
    spray: function (c, d, u, at) { var e = win(u, 0, 1, 0.16), sp = cl((u - 0.42) / 0.42, 0, 1); c.trunkUp += e; c.headRx -= 0.22 * e; c.jaw += 0.6 * e; c.earFlap += (0.45 + 0.4 * Math.sin(at * 7)) * e; c.lid += 0.35 * e; c.sq += 0.03 * Math.sin(at * 7) * e; c.drop = sp > 0 && sp < 1 ? sp : 0; c.tRx[0] += 0.5 * e; wave(c.tRy, 2, 0.4 * e, at * 8, 0.5); c.bodyRx -= 0.05 * e; }
  };
  var DUR = { jump: 1.0, happy: 1.5, surprised: 1.3, sleepy: 2.4, shy: 2.0, spin: 1.8 };
  var MOODS = ['calm', 'happy', 'sleepy', 'shy', 'surprised'], TRUNK_UP = [-0.9, -0.9, -0.7, -0.3, 0.4];
  function mood(c, d, m, t) { var w = m[1]; if (w > 0) { wave(c.tRy, d.tailN, 0.4 * w, t * (d.slow ? 6 : 13), 0.6); c.jaw += 0.32 * w; c.earLift += 0.4 * w; c.sq += 0.012 * Math.sin(t * 5) * w; c.crest += 0.4 * w; c.earFlap += 0.2 * Math.sin(t * 3) * w; }
    w = m[2]; if (w > 0) { c.lid += 0.58 * w; c.headRx += (0.2 + 0.05 * Math.sin(t * 0.9)) * w; c.earLift -= 0.6 * w; c.tRx[0] -= 0.25 * w; c.headRz += 0.08 * w; c.crest -= 0.6 * w; c.earFlap -= 0.2 * w; }
    w = m[3]; if (w > 0) { c.headRy -= 0.45 * w; c.headRx += 0.24 * w; c.headRz += 0.1 * w; c.eyeX += 0.85 * w; c.lid += 0.25 * w; c.earLift -= 0.7 * w; c.tRx[0] -= 0.3 * w; c.bodyRy += 0.08 * w; c.crest -= 0.5 * w; }
    w = m[4]; if (w > 0) { c.lid -= 0.35 * w; c.earLift += 0.9 * w; c.jaw += 0.3 * w; c.headRx -= 0.1 * w; c.sq += 0.05 * w; c.crest += 1.0 * w; c.earFlap += 0.5 * w; c.tRx[0] += 0.25 * w; } }

  function apply(pet) { var S = pet.S, d = pet.def, c = pet.c, b = pet.b, t = S.t, sd = pet.seed, i, n;
    zero(c);
    var awake = 1 - S.sleepW, still = 1 - S.gaitW, stand = cl(1 - S.sitW - S.lieW, 0, 1);
    var br = Math.sin(t * (2.1 - 1.0 * S.sleepW) + sd); c.bodyS += 0.016 * br * (1 + S.sleepW); c.headY += 0.008 * br;
    if (!S.look) { c.headRy += awake * still * 0.3 * Math.sin(t * 0.43 + sd) * Math.sin(t * 0.19 + sd * 2); c.headRx += awake * still * 0.05 * Math.sin(t * 0.31 + 1 + sd); c.eyeX += awake * 0.5 * Math.sin(t * 0.43 + sd + 0.4) * Math.sin(t * 0.19 + sd * 2); }
    wave(c.tRy, d.tailN, d.tailIdle * awake * still, t * 1.7 + sd, 0.7);
    if (d.trunkN) { wave(c.kRy, 5, 0.07 * awake * still, t * 1.1 + sd, 0.7); for (i = 0; i < 5; i++) c.kRx[i] += 0.03 * Math.sin(t * 0.8 - 0.6 * i); c.earFlap += 0.1 * awake * Math.sin(t * 1.3 + sd); }
    var bt = (t + sd * 3) % 3.9; if (bt < 0.16 && awake > 0.5) c.lid += Math.sin(PI * bt / 0.16) * 1.1;
    var et = (t + sd * 5) % 5.7; if (et < 0.3) { if (Math.floor((t + sd * 5) / 5.7) % 2) c.earTwL += Math.sin(PI * et / 0.3) * awake; else c.earTwR += Math.sin(PI * et / 0.3) * awake; }
    if (S.gaitW > 0.001) gait(c, d, S.gaitW, S.runW, S.phase, S.stride);
    sitPose(c, d, S.sitW); liePose(c, d, S.lieW, S.sleepW); if (d.upright) upPose(c, d, S.upW);
    d._up = S.upW; if (S.act && ACT[S.act]) ACT[S.act](c, d, S.u, S.u * S.dur, stand);
    mood(c, d, S.mood, t);
    c.headRy += S.lookYaw * 0.6 * awake; c.headRx -= S.lookPitch * 0.7 * awake; c.eyeX += S.lookYaw * 0.9 * awake; c.eyeY += S.lookPitch * 1.2 * awake;
    c.headRy += S.lead; c.rootRz -= S.lean; for (i = 0; i < d.tailN; i++) c.tRy[i] += S.spYaw * 0.5;
    // ---- write ----
    var o = b.root; o.position.set(c.rootX, c.rootY, c.rootZ); o.rotation.set(c.rootRx, c.rootRy, c.rootRz); var sy = 1 + c.sq, sx = 1 / Math.sqrt(sy); o.scale.set(sx, sy, sx);
    b.core.rotation.x = c.coreRx;
    o = b.body; o.position.set(o.userData.rest.x, o.userData.rest.y + c.bodyY, o.userData.rest.z + c.bodyZ); o.rotation.set(c.bodyRx, c.bodyRy, c.bodyRz); o.scale.set(1 + c.bodyS, 1 + c.bodyS, 1);
    o = b.head; o.position.set(o.userData.rest.x, o.userData.rest.y + c.headY, o.userData.rest.z + c.headZ); o.rotation.set(cl(c.headRx, -0.9, 0.9), cl(c.headRy, -1.35, 1.35), c.headRz);
    if (b.jaw) b.jaw.rotation.x = cl(c.jaw, 0, 1.2) * d.jawK;
    var la = lerp(-1.15, 0.85, cl(c.lid, -0.3, 1)); b.lidL.rotation.x = la; b.lidR.rotation.x = la;
    var ex = cl(c.eyeX, -1, 1) * 0.5, ey = -cl(c.eyeY, -1, 1) * 0.4; b.eyeL.rotation.set(ey, ex, 0); b.eyeR.rotation.set(ey, ex, 0);
    for (i = 0; i < 4; i++) { o = pet.legs[i]; if (o) { o.rotation.set(c.lRx[i], c.lRy[i], c.lRz[i]); o.position.y = o.userData.rest.y + c.lY[i]; } }
    if (b.earL) { var L = b.earL, Rr = b.earR, lf = c.earLift, up = lf > 0 ? lf : 0, dn = lf < 0 ? lf : 0;
      if (d.ear === 'flop') { L.rotation.set(c.earSw + 0.25 * dn, 0, 0.6 * up + 0.3 * c.earTwL); Rr.rotation.set(c.earSw + 0.25 * dn, 0, -0.6 * up - 0.3 * c.earTwR); }
      else if (d.ear === 'up') { L.rotation.set(0.35 * dn + 0.4 * c.earSw, 0, 0.55 * dn + 0.1 * up - 0.3 * c.earTwL); Rr.rotation.set(0.35 * dn + 0.4 * c.earSw, 0, -0.55 * dn - 0.1 * up + 0.3 * c.earTwR); }
      else if (d.ear === 'fan') { L.rotation.set(0, -0.6 * c.earFlap - 0.2 * dn + 0.15 * c.earTwL, 0.1 * dn); Rr.rotation.set(0, 0.6 * c.earFlap + 0.2 * dn - 0.15 * c.earTwR, -0.1 * dn); }
      else { L.rotation.set(0, 0.25 * c.earTwL - 0.15 * dn, 0.1 * lf); Rr.rotation.set(0, -0.25 * c.earTwR + 0.15 * dn, -0.1 * lf); } }
    n = d.tailN; for (i = 0; i < n; i++) pet.tail[i].rotation.set(c.tRx[i] + c.tailCurl, c.tRy[i] + c.tailSide, 0);
    if (d.trunkN) for (i = 0; i < 5; i++) pet.trunk[i].rotation.set(c.kRx[i] + TRUNK_UP[i] * cl(c.trunkUp, 0, 1.1), c.kRy[i], 0);
    if (b.wingL) { b.wingL.rotation.set(-0.5 * c.wingF, 0, cl(c.wingL, -0.1, 1.9)); b.wingR.rotation.set(-0.5 * c.wingF, 0, -cl(c.wingR, -0.1, 1.9)); }
    if (b.mane) { var ms = 1 + 0.14 * c.mane; b.mane.scale.set(ms, ms, ms); b.mane.rotation.z = c.maneRz; }
    if (b.crest) b.crest.rotation.x = -0.35 * cl(c.crest, -1.2, 1.4);
    if (b.drop0) for (i = 0; i < 3; i++) { o = b['drop' + i]; var q = c.drop, r0 = o.userData.rest; if (q <= 0) { o.scale.setScalar(0.01); o.position.copy(r0); } else { var tq = cl(q * 1.25 - i * 0.1, 0, 1), al = 1.7 * tq - 1.9 * tq * tq, sdx = (i - 1) * 0.7 + 0.15, sdz = (i === 1 ? 0.55 : -0.25);
        o.position.set(r0.x + sdx * tq, r0.y - 0.73 * al - 0.69 * sdz * tq, r0.z + 0.69 * al - 0.73 * sdz * tq); o.scale.setScalar(tq > 0 && tq < 1 ? 1 + 1.5 * Math.sin(PI * tq) : 0.01); } }
    if (pet.blob) { var bs = d.blob * (1 - 0.35 * cl(c.rootY / 1.2, 0, 1)); pet.blob.scale.set(bs * (d.type === 'croc' ? 0.75 : 1), 1, bs * (d.type === 'croc' ? 1.9 : 1.15)); pet.blob.position.set(c.rootX + 0.1, 0.03, c.rootZ + 0.08 - (d.type === 'croc' ? 0.1 : 0.05)); pet.blob.rotation.y = c.rootRy; }
  }

  // ---------- a pet: the rig + its state + the small controller ----------
  var defs = {};
  function Pet(kind, o) { o = o || {}; if (!BUILD[kind]) throw new Error('no animal ' + kind);
    var R = new Rig(), v = typeof o.variant === 'object' ? o.variant : VAR[kind][(o.variant || 0) % VAR[kind].length], d = BUILD[kind](R, v), lk = o.look || look0(), m = R.build(lk), i;
    d.kind = kind; d.jawK = d.jawK || 0.75; d.tailN = d.tailN || R.bones.filter(function (b) { return /^tail/.test(b.name); }).length; d.trunkN = R.idx.trunk0 != null ? 5 : 0; d.blob = d.type === 'croc' ? 1.9 : (d.kind === 'elephant' ? 2.5 : 1.9);
    if (d.type === 'quad') { var th = d.sitTh, shy = d.sitHip + (d.shY - d.hipY) * Math.cos(th) + (d.shZ - d.hipZ) * Math.sin(th); d.sit = { th: th, phi: d.sitPhi, drop: d.hipY - d.sitHip, slide: (shy - d.shY * Math.cos(d.sitPhi)) / Math.cos(th) }; }
    defs[kind] = d; this.kind = kind; this.def = d; this.look = lk; this.tris = m.tris; this.verts = m.verts; this.mesh = m.mesh; this.skeleton = m.skeleton; this.root = m.group; this.b = {}; for (i = 0; i < R.bones.length; i++) this.b[R.bones[i].name] = R.bones[i];
    this.legs = [this.b.legFL, this.b.legFR, this.b.legBL, this.b.legBR]; this.tail = []; for (i = 0; i < d.tailN; i++) this.tail.push(this.b['tail' + i]); this.trunk = []; for (i = 0; i < d.trunkN; i++) this.trunk.push(this.b['trunk' + i]);
    this.c = chans(); this.seed = o.seed == null ? KINDS.indexOf(kind) * 1.7 : o.seed; this.scale = (o.scale || 1) * d.size; this.root.scale.setScalar(this.scale);
    this.S = { t: 0, gaitW: 0, runW: 0, phase: 0, stride: 1, sitW: 0, lieW: 0, sleepW: 0, upW: 0, act: null, u: 0, dur: 1, mood: new Float32Array(5), lookYaw: 0, lookPitch: 0, look: false, lead: 0, lean: 0, spYaw: 0, h: 0, v: 0, w: 0 };
    this.post = d.upright ? 'up' : 'stand'; this.moodName = 'calm'; this.mode = 'idle'; this.goal = { x: 0, z: 0, run: false, pass: false }; this.target = null; this.lookPt = null; this.pathPts = null; this.pathI = 0; this.pathLoop = false; this.faceTo = null; this.onDone = null; this.autoSat = false; this.still = 0; this.moving = false; this.sleeping = false; this.tLast = { x: 0, z: 0, v: 0, hx: 0, hz: 1, ok: false }; this.sideX = 1; this.sideZ = 0; this.frontX = 0; this.frontZ = 1;
    if (o.shadow !== false) { this.blob = blobMesh(); if (this.blob) this.root.add(this.blob); }
    this.outline = null; this.avoid = o.avoid || null; apply(this); }
  var P = Pet.prototype;
  Object.defineProperty(P, 'x', { get: function () { return this.root.position.x; }, set: function (v) { this.root.position.x = v; } });
  Object.defineProperty(P, 'z', { get: function () { return this.root.position.z; }, set: function (v) { this.root.position.z = v; } });
  Object.defineProperty(P, 'heading', { get: function () { return this.S.h; }, set: function (v) { this.S.h = v; this.root.rotation.y = v; } });
  P.place = function (x, z, heading) { this.root.position.set(x, this.root.position.y, z); if (heading != null) this.heading = heading; return this; };
  // a frozen frame: { t, gait: 0..1, run: 0..1, phase, sit, lie, sleep, up, act, u, mood, look: [yaw, pitch], heading }
  P.pose = function (q) { var S = this.S, i; q = q || {}; S.t = q.t || 0; S.gaitW = q.gait || 0; S.runW = q.run || 0; S.phase = q.phase || 0; S.stride = q.stride == null ? 1 : q.stride; S.sitW = q.sit || 0; S.lieW = Math.max(q.lie || 0, q.sleep || 0); S.sleepW = q.sleep || 0; S.upW = q.up == null ? (this.def.upright && !q.gait && !q.sit && !q.lie && !q.sleep ? 1 : 0) : q.up;
    S.act = q.act === 'signature' ? this.def.sig : q.act || null; S.u = q.u || 0; S.dur = S.act ? (S.act === this.def.sig ? this.def.sigDur : DUR[S.act] || 1.5) : 1; for (i = 0; i < 5; i++) S.mood[i] = MOODS[i] === q.mood ? 1 : 0; S.lookYaw = q.look ? q.look[0] : 0; S.lookPitch = q.look ? q.look[1] : 0; S.look = !!q.look; S.lead = S.lean = S.spYaw = 0;
    if (q.heading != null) this.heading = q.heading; apply(this); return this; };
  P.goTo = function (x, z, o) { o = o || {}; this.mode = 'goto'; this.goal.x = x; this.goal.z = z; this.goal.run = !!o.run; this.goal.pass = false; this.faceTo = o.face == null ? null : o.face; this.onDone = o.done || null; this.target = null; this.pathPts = null; this.wake(); return this; };
  P.path = function (pts, loop, run) { this.mode = 'path'; this.pathPts = pts; this.pathI = 0; this.pathLoop = !!loop; this.goal.run = !!run; this.target = null; this.wake(); return this; };
  P.follow = function (target) { this.mode = target ? 'follow' : 'idle'; this.target = target || null; this.tLast.ok = false; this.pathPts = null; if (target) this.wake(); return this; };
  P.blocked = function (x, z) { var a = this.avoid, i; if (a) for (i = 0; i < a.length; i++) { var ax = x - a[i][0], az = z - a[i][1]; if (ax * ax + az * az < a[i][2] * a[i][2]) return true; } return false; };
  P.stop = function () { this.mode = 'idle'; this.target = null; this.pathPts = null; return this; };
  P.turnTo = function (heading) { this.mode = 'turn'; this.faceTo = heading; this.wake(); return this; };
  P.lookAt = function (x, y, z) { if (x == null) this.lookPt = null; else if (typeof x === 'object') this.lookPt = x; else this.lookPt = { x: x, y: y, z: z }; return this; };
  P.play = function (name, done) { if (name === 'signature') name = this.def.sig; if (!ACT[name]) return this; var S = this.S; if (name !== 'jump' && name !== 'happy' && name !== 'surprised') { if (this.mode !== 'follow') this.mode = 'idle'; this.hold = true; }
    if (name === this.def.sig || name === 'spin' || name === 'jump') this.wake(); S.act = name; S.u = 0; S.dur = name === this.def.sig ? this.def.sigDur : DUR[name] || 1.5; this.onAct = done || null; return this; };
  P.setMood = function (name) { this.moodName = MOODS.indexOf(name) < 0 ? 'calm' : name; return this; };
  P.wake = function () { if (this.post !== 'stand' && this.post !== 'up') this.post = this.def.upright ? 'up' : 'stand'; this.autoSat = false; return this; };
  P.sit = function () { this.post = 'sit'; if (this.mode !== 'follow') this.mode = 'idle'; return this; };
  P.lie = function () { this.post = 'lie'; if (this.mode !== 'follow') this.mode = 'idle'; return this; };
  P.sleep = function () { this.post = 'sleep'; if (this.mode !== 'follow') this.mode = 'idle'; return this; };
  P.stand = function () { this.post = this.def.upright ? 'up' : 'stand'; return this; };
  P.setOutline = function (w) { if (w && !this.outline) { this.outline = new THREE.SkinnedMesh(this.mesh.geometry, this.look.out); this.outline.bind(this.skeleton, this.mesh.bindMatrix); this.outline.frustumCulled = false; this.root.add(this.outline); } if (this.outline) this.outline.visible = !!w; if (w) this.look.uOut.value = w; return this; };
  var hv = new V3();
  P.headPoint = function (out) { this.b.head.updateWorldMatrix(true, false); return (out || hv).setFromMatrixPosition(this.b.head.matrixWorld); };
  P.dispose = function () { this.mesh.geometry.dispose(); if (this.skeleton.boneTexture) this.skeleton.boneTexture.dispose(); if (this.blob) { this.blob.geometry.dispose(); this.blob.material.dispose(); } if (this.root.parent) this.root.parent.remove(this.root); };
  function ease(cur, to, k) { return cur + (to - cur) * k; }
  P.update = function (dt) { var S = this.S, d = this.def, sc = this.scale, i; if (dt > 0.1) dt = 0.1; if (dt <= 0) { apply(this); return; } S.t += dt;
    var gx = 0, gz = 0, want = false, run = false, pass = false, face = null, tg = this.target;
    if (this.mode === 'follow' && tg) { var L = this.tLast, gap = (d.gap || 1.55) * sc * (d.type === 'croc' ? 1.3 : 1) + (tg.r || 0);
      if (L.ok) { var vx = (tg.x - L.x) / dt, vz = (tg.z - L.z) / dt, sp = Math.sqrt(vx * vx + vz * vz); L.v = ease(L.v, sp, Math.min(1, dt * 6)); if (sp > 0.05) { L.hx = ease(L.hx, vx / sp, Math.min(1, dt * 5)); L.hz = ease(L.hz, vz / sp, Math.min(1, dt * 5)); } } L.x = tg.x; L.z = tg.z; L.ok = true;
      var dx = tg.x - this.x, dz = tg.z - this.z, dist = Math.sqrt(dx * dx + dz * dz) || 1e-6;
      if (L.v > 0.08) { var hl = Math.sqrt(L.hx * L.hx + L.hz * L.hz) || 1, hx = L.hx / hl, hz = L.hz / hl, ahead = -(dx * hx + dz * hz), side = (-dx * hz + dz * hx) < 0 ? -1 : 1;      // behind the target and a little to one side; when the target walks towards the pet, the pet steps aside and lets it pass
        if (ahead > -gap * 0.3) { gx = tg.x + hz * side * gap; gz = tg.z - hx * side * gap; if (ahead > gap * 1.5) want = false; else want = true; } else { gx = tg.x - hx * gap * 0.9 + hz * side * gap * 0.45; gz = tg.z - hz * gap * 0.9 - hx * side * gap * 0.45; want = true; }
        pass = true; run = dist > gap * 2.6; this.followGo = true; if (!want) face = Math.atan2(dx, dz); }
      else { var sd = (-dx * this.sideX - dz * this.sideZ) < 0 ? -1 : 1, rx = tg.x + sd * gap * 0.92 * this.sideX + gap * 0.28 * this.frontX, rz = tg.z + sd * gap * 0.92 * this.sideZ + gap * 0.28 * this.frontZ, rd; if (this.blocked(rx, rz)) { sd = -sd; rx = tg.x + sd * gap * 0.92 * this.sideX + gap * 0.28 * this.frontX; rz = tg.z + sd * gap * 0.92 * this.sideZ + gap * 0.28 * this.frontZ; if (this.blocked(rx, rz)) { rx = this.x; rz = this.z; } } rd = Math.sqrt((rx - this.x) * (rx - this.x) + (rz - this.z) * (rz - this.z));
        if (rd > gap * 0.4) this.followGo = true; else if (rd < 0.14 * sc) this.followGo = false; if (this.followGo) { gx = rx; gz = rz; want = true; run = dist > gap * 2.6; } else face = Math.atan2(this.frontX, this.frontZ) - sd * 0.55; }
      if (!this.lookPt) { S.look = true; this._lx = tg.x; this._ly = tg.y == null ? 1.5 * sc : tg.y; this._lz = tg.z; }
      if (tg.sitting && !want && this.still > 0.5 && (this.post === 'stand' || this.post === 'up')) { this.post = 'sit'; this.autoSat = true; }
      if (this.autoSat && (!tg.sitting || want)) { this.post = d.upright ? 'up' : 'stand'; this.autoSat = false; } }
    else if (this.mode === 'goto') { gx = this.goal.x; gz = this.goal.z; want = true; run = this.goal.run; }
    else if (this.mode === 'path' && this.pathPts) { var pt = this.pathPts[this.pathI]; gx = pt[0]; gz = pt[1]; want = true; run = this.goal.run; pass = this.pathLoop || this.pathI < this.pathPts.length - 1; }
    else if (this.mode === 'turn') face = this.faceTo;
    if (this.hold && S.act) { want = false; face = null; }
    // posture weights
    var k = Math.min(1, dt * 3.2), ps = this.post; if (want && ps !== 'stand' && ps !== 'up') { this.wake(); ps = this.post; }
    S.sitW = ease(S.sitW, ps === 'sit' ? 1 : 0, k); S.lieW = ease(S.lieW, ps === 'lie' || ps === 'sleep' ? 1 : 0, k); S.sleepW = ease(S.sleepW, ps === 'sleep' ? 1 : 0, k * 0.6); if (S.sleepW > S.lieW) S.sleepW = S.lieW; this.sleeping = S.sleepW > 0.6;
    var up = S.sitW + S.lieW < 0.2;
    // steering: turn towards the goal, walk when it is ahead, slow down on arrival
    var vT = 0, wT = 0, wMax = d.slow ? 1.6 : 2.6, arrive = 0.12 * sc;
    if (want && up) { var ddx = gx - this.x, ddz = gz - this.z, dd2 = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dd2 < (pass ? 0.5 * sc : arrive)) { if (this.mode === 'goto') { this.mode = this.faceTo == null ? 'idle' : 'turn'; if (this.onDone) { var f = this.onDone; this.onDone = null; f(this); } } else if (this.mode === 'path') { this.pathI++; if (this.pathI >= this.pathPts.length) { if (this.pathLoop) this.pathI = 0; else { this.mode = 'idle'; this.pathPts = null; } } } }
      else { var err = wrap(Math.atan2(ddx, ddz) - S.h), ae = Math.abs(err), vm = (run ? d.rV : d.wV) * sc; wT = cl(err * 4, -wMax, wMax); vT = ae > 1.25 ? 0 : vm * Math.pow(Math.cos(ae), 1.5); if (!pass) vT = Math.min(vT, dd2 * 2.4 + 0.12 * sc); } }
    else if (face != null && up) { var e2 = wrap(face - S.h); if (Math.abs(e2) > (this.turning ? 0.04 : 0.5)) { wT = cl(e2 * 4, -wMax, wMax); this.turning = true; } else { this.turning = false; if (this.mode === 'turn') this.mode = 'idle'; } }
    S.v = ease(S.v, vT, Math.min(1, dt * (vT > S.v ? 3 : 5))); S.w = ease(S.w, wT, Math.min(1, dt * 7)); if (Math.abs(S.w) < 0.002) S.w = 0; if (S.v < 0.002 * sc) S.v = 0;
    S.h = wrap(S.h + S.w * dt); this.root.position.x += Math.sin(S.h) * S.v * dt; this.root.position.z += Math.cos(S.h) * S.v * dt; this.root.rotation.y = S.h;
    var av = this.avoid; if (av && S.v > 0) for (i = 0; i < av.length; i++) { var ox = this.x - av[i][0], oz = this.z - av[i][1], od = Math.sqrt(ox * ox + oz * oz), orr = av[i][2] * 0.85; if (od < orr && od > 1e-4) { this.root.position.x = av[i][0] + ox / od * orr; this.root.position.z = av[i][1] + oz / od * orr; } }      // slides around the obstacles (circles x, z, r)
    var vt = S.v / sc, moving = vt > 0.03 || Math.abs(S.w) > 0.12; this.moving = moving; this.still = moving ? 0 : this.still + dt;
    var runT = cl((vt - d.wV * 1.1) / (d.rV - d.wV * 1.1), 0, 1); S.runW = ease(S.runW, runT, Math.min(1, dt * 4)); S.gaitW = ease(S.gaitW, moving ? 1 : 0, Math.min(1, dt * (moving ? 8 : 5)));
    S.stride = ease(S.stride, cl(vt / d.wV, 0.3, 1), Math.min(1, dt * 6));
    var A = lerp(d.wA, d.rA, S.runW), len = 2 * A * d.hipY * 1.15, duty = lerp(WD, RD, S.runW); if (d.type === 'bird') { len = lerp(0.75, 1.4, S.runW); duty = 1; } if (d.type === 'croc') { len = 2 * A * 0.5; duty = 0.55; }
    if (moving) S.phase += vt * dt * duty / (len * Math.max(0.3, S.stride)) + Math.abs(S.w) * dt * 0.3 * (1 - cl(vt / d.wV, 0, 1)); else if (S.gaitW < 0.02) S.phase = 0;
    if (d.upright) S.upW = ease(S.upW, this.post === 'up' && !moving && !want ? 1 : 0, Math.min(1, dt * (moving ? 7 : 2.5)));
    S.lead = ease(S.lead, cl(S.w * 0.16, -0.4, 0.4), Math.min(1, dt * 5)); S.lean = ease(S.lean, cl(S.w * vt * 0.05, -0.2, 0.2), Math.min(1, dt * 4)); S.spYaw = ease(S.spYaw, cl(-S.w * 0.22, -0.6, 0.6), Math.min(1, dt * 3));
    // the action that plays, the mood, the look
    if (S.act) { S.u += dt / S.dur; if (S.u >= 1) { S.act = null; S.u = 0; this.hold = false; if (this.onAct) { var fa = this.onAct; this.onAct = null; fa(this); } } }
    for (i = 0; i < 5; i++) S.mood[i] = ease(S.mood[i], MOODS[i] === this.moodName ? 1 : 0, Math.min(1, dt * 3));
    var ly = 0, lp = 0, lpt = this.lookPt; if (lpt) { S.look = true; this._lx = lpt.x; this._ly = lpt.y || 0; this._lz = lpt.z; } else if (!(this.mode === 'follow' && tg)) S.look = false;
    if (S.look) { var hy = d.H * 0.72 * sc, lx = this._lx - this.x, lz = this._lz - this.z, ld = Math.sqrt(lx * lx + lz * lz); ly = cl(wrap(Math.atan2(lx, lz) - S.h), -1.1, 1.1); lp = cl(Math.atan2(this._ly - hy, ld + 0.001), -0.5, 0.6); if (ld < 0.2 * sc) ly = 0; }
    S.lookYaw = ease(S.lookYaw, ly, Math.min(1, dt * 5)); S.lookPitch = ease(S.lookPitch, lp, Math.min(1, dt * 5));
    apply(this); };

  // ---------- flat uses: any animal, pose and angle as a transparent picture ----------
  var snap = null, DAY = { hemiS: '#ffffff', hemiG: '#a6d48c', hemi: 0.58, sun: '#fff3d0', sunI: 0.6, tint: '#ffffff', rim: '#39382e', spec: '#1d1d1d', blob: '#145a2d' }, NIGHT = { hemiS: '#b4c0ff', hemiG: '#56789a', hemi: 0.78, sun: '#c9d4ff', sunI: 0.46, tint: '#aebcf0', rim: '#1c2a55', spec: '#14182a', blob: '#0a282d' };
  function supported() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function snapInit() { if (snap) return snap; var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setClearColor(0, 0);
    var sc = new THREE.Scene(), hemi = new THREE.HemisphereLight(), sun = new THREE.DirectionalLight(); sun.position.set(-11, 17, 9); sc.add(hemi); sc.add(sun);
    snap = { r: r, scene: sc, hemi: hemi, sun: sun, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100), look: Look(), pets: {}, pal: null }; return snap; }
  // o: { kind, variant, size (px), angle (0 front, PI/2 its left side towards us, PI back), pitch (camera, rad), pose: {...}, night, outline (auto under 73 px), shadow, dpr, zoom }
  function render(o) { var s = snapInit(), k = o.kind + '_' + (o.variant || 0), pet = s.pets[k] || (s.pets[k] = new Pet(o.kind, { variant: o.variant || 0, look: s.look })), d = pet.def, P = o.night ? NIGHT : DAY, px = Math.round((o.size || 96) * (o.dpr || 1)), key;
    if (s.pal !== P) { s.pal = P; s.hemi.color.set(P.hemiS); s.hemi.groundColor.set(P.hemiG); s.hemi.intensity = P.hemi; s.sun.color.set(P.sun); s.sun.intensity = P.sunI; s.look.set(P); }
    for (key in s.pets) s.pets[key].root.visible = false; if (!pet.root.parent) s.scene.add(pet.root); pet.root.visible = true; if (pet.blob) { pet.blob.visible = o.shadow !== false; pet.blob.material.color.set(P.blob); }
    var q = o.pose || {}; pet.root.position.set(0, 0, 0); pet.pose(q); pet.heading = o.angle || 0;
    var fr = d.frame || [d.H * 0.6, d.H * 0.47], he = fr[0] * pet.scale / (o.zoom || 1), cy = fr[1] * pet.scale + (o.lift || 0), pit = o.pitch == null ? 0.3 : o.pitch, cam = s.cam;
    if (d.upright && q.up !== 0 && !q.gait && !q.sit && !q.lie && !q.sleep || (q.act === 'signature' && (d.kind === 'monkey' || d.kind === 'bird' || d.kind === 'elephant'))) { he *= 1.25; cy *= 1.3; }
    cam.left = -he; cam.right = he; cam.top = he; cam.bottom = -he; cam.updateProjectionMatrix(); cam.position.set(0, cy + 30 * Math.sin(pit), 30 * Math.cos(pit)); cam.lookAt(0, cy, 0);
    var ol = o.outline == null ? (o.size || 96) <= 72 : o.outline; pet.setOutline(ol ? (typeof ol === 'number' ? ol : 2.2 * he / (o.size || 96) / pet.scale * 1.6) : 0);
    s.r.setPixelRatio(1); s.r.setSize(px, px, false); s.r.render(s.scene, cam); return s.r.domElement; }
  function draw(ctx, x, y, o) { var cv = render(o), sz = o.size || 96; ctx.drawImage(cv, x, y, sz, sz); }
  function snapshot(o) { var cv = render(o), c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; c2.getContext('2d').drawImage(cv, 0, 0); return c2.toDataURL(o.type || 'image/png', o.quality); }
  // the fallback without WebGL: sprites made by tools/make-sprites.js (8 directions x the poses of SPR.rows)
  var SPR = { dir: 'sprites/', cell: 80, cols: 8, rows: ['stand', 'walk0', 'walk1', 'walk2', 'walk3', 'sit', 'sleep', 'happy'], ext: '.webp' };
  var SPR_POSE = { stand: { t: 0.5 }, walk0: { gait: 1, phase: 0.0 }, walk1: { gait: 1, phase: 0.25 }, walk2: { gait: 1, phase: 0.5 }, walk3: { gait: 1, phase: 0.75 }, sit: { sit: 1, t: 0.5 }, sleep: { sleep: 1, t: 0.5 }, happy: { act: 'jump', u: 0.47, mood: 'happy' } };
  function sprite(el, kind, pose, dir8, size) { var r = Math.max(0, SPR.rows.indexOf(pose)), c = ((Math.round(dir8) % 8) + 8) % 8, st = el.style; size = size || SPR.cell; st.width = st.height = size + 'px'; st.backgroundImage = 'url(' + SPR.dir + kind + SPR.ext + ')'; st.backgroundSize = SPR.cols * size + 'px ' + SPR.rows.length * size + 'px'; st.backgroundPosition = -c * size + 'px ' + -r * size + 'px'; st.backgroundRepeat = 'no-repeat'; return el; }

  var api = { KINDS: KINDS, VARIANTS: VAR, MOODS: MOODS, ACTIONS: Object.keys(ACT), create: function (kind, o) { return new Pet(kind, o); }, Look: Look, look: look0, DAY: DAY, NIGHT: NIGHT, supported: supported, render: render, draw: draw, snapshot: snapshot, sprite: sprite, SPR: SPR, SPR_POSE: SPR_POSE, defs: defs, _limb: limb, info: function () { return snap ? snap.r.info.render : null; } };
  Toy.PETS = api; return api;
})();
