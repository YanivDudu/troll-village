// Geometry and measurement, grade 1: polygons, length, the clock (whole hours), near / far and paths on a grid.
// Source: docs/research/new/geometry-grade-1.md. Almost every exercise can be answered from the drawing alone.
(function () {
  'use strict';

  // ---------- small drawing helpers ----------
  var INK = '#3b2a55', RED = '#e02424', PALE = '#f3ecff', PI = Math.PI;
  var COL = ['#8e5cff', '#ff5fa2', '#3aa0ff', '#ffb300', '#3ec46d'];
  function n1(v) { return Math.round(v * 10) / 10; }
  function S(w, h, b) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + b + '</svg>'; }
  function P(pts) { return pts.map(function (p) { return n1(p[0]) + ',' + n1(p[1]); }).join(' '); }
  function pg(pts, fill, sw, more) { return '<polygon points="' + P(pts) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (sw == null ? 3 : sw) + '" stroke-linejoin="round"' + (more || '') + '/>'; }
  function ln(x1, y1, x2, y2, c, w, dash) { return '<line x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '" stroke="' + (c || INK) + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function tx(x, y, s, size, fill) { return '<text x="' + n1(x) + '" y="' + n1(y) + '" text-anchor="middle" direction="ltr" font-size="' + size + '" font-weight="700" font-family="Arial,sans-serif" fill="' + (fill || INK) + '">' + s + '</text>'; }
  function ci(x, y, rad, fill, stroke, sw) { return '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(rad) + '" fill="' + fill + '" stroke="' + (stroke || INK) + '" stroke-width="' + (sw == null ? 2 : sw) + '"/>'; }
  function rc(x, y, w, h, fill, rx, sw) { return '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + (rx || 0) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (sw == null ? 2 : sw) + '"/>'; }
  function rot(pts, ang) { // turn around the middle of the 10 x 10 grid
    var a = (ang || 0) * PI / 180, c = Math.cos(a), s = Math.sin(a);
    return pts.map(function (p) { return [5 + (p[0] - 5) * c - (p[1] - 5) * s, 5 + (p[0] - 5) * s + (p[1] - 5) * c]; });
  }
  function fitMany(list, x, y, w, h) { // several point lists, scaled together into a box
    var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    list.forEach(function (pts) { pts.forEach(function (p) { a = Math.min(a, p[0]); c = Math.max(c, p[0]); b = Math.min(b, p[1]); d = Math.max(d, p[1]); }); });
    var k = Math.min(w / Math.max(c - a, 0.01), h / Math.max(d - b, 0.01)), ox = x + w / 2 - (a + c) / 2 * k, oy = y + h / 2 - (b + d) / 2 * k;
    return list.map(function (pts) { return pts.map(function (p) { return [ox + p[0] * k, oy + p[1] * k]; }); });
  }
  function fit(pts, x, y, w, h, ang) { return fitMany([rot(pts, ang)], x, y, w, h)[0]; }
  function inPoly(pts, x, y) {
    var c = false, i, j, n = pts.length;
    for (i = 0, j = n - 1; i < n; j = i++) { var a = pts[i], b = pts[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
    return c;
  }
  function sideCol(i, n) { return COL[i === n - 1 && n % 5 === 1 ? 2 : i % 5]; }
  function sidesOn(pts, num, cols) { // every side in a colour of its own, with its number
    var n = pts.length, out = pg(pts, PALE, 1), lab = '';
    pts.forEach(function (a, i) {
      var b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[1] - a[1], dy = a[0] - b[0], d = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= d; dy /= d;
      if (inPoly(pts, mx + dx * 2, my + dy * 2)) { dx = -dx; dy = -dy; }
      out += ln(a[0], a[1], b[0], b[1], cols ? cols[i] : sideCol(i, n), 5);
      if (num) lab += tx(mx + dx * 12, my + dy * 12 + 5, i + 1, 14);
    });
    return out + lab;
  }
  function vertsOn(pts, num, fill) { // a dot on every vertex, with its number
    var n = pts.length, cx = 0, cy = 0, out = pg(pts, fill || PALE, 3);
    pts.forEach(function (p) { cx += p[0] / n; cy += p[1] / n; });
    pts.forEach(function (p, i) {
      var dx = p[0] - cx, dy = p[1] - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
      out += ci(p[0], p[1], 5, '#ffb300', INK, 2);
      if (num) out += tx(p[0] + dx / d * 14, p[1] + dy / d * 14 + 5, i + 1, 14);
    });
    return out;
  }

  // ---------- the catalogue of shapes (10 x 10 grid) ----------
  function reg(n, r0, turn) { var o = [], i; for (i = 0; i < n; i++) { var a = -PI / 2 + (turn || 0) + i * 2 * PI / n; o.push([5 + (r0 || 4.5) * Math.cos(a), 5 + (r0 || 4.5) * Math.sin(a)]); } return o; }
  function star(n, R, r0) { var o = [], i; for (i = 0; i < n * 2; i++) { var a = -PI / 2 + i * PI / n, q = i % 2 ? r0 : R; o.push([5 + q * Math.cos(a), 5 + q * Math.sin(a)]); } return o; }
  function mk(id, p) { return { id: id, n: p.length, p: p }; }
  var TRI = [mk('T1', [[5, 1], [9, 9], [1, 9]]), mk('T2', [[1, 2], [9, 2], [5, 9]]), mk('T3', [[1, 1], [1, 9], [8, 9]]), mk('T4', [[0, 9], [10, 5], [10, 6.5]]), mk('T5', [[1, 3], [6, 2], [9, 9]]), mk('T6', [[1, 5], [9, 1], [9, 9]])];
  var SQS = [mk('Q1', [[2, 2], [8, 2], [8, 8], [2, 8]])];
  var RECTS = [mk('Q3', [[1, 3], [9, 3], [9, 7], [1, 7]]), mk('R13', [[0.5, 3.5], [9.5, 3.5], [9.5, 6.5], [0.5, 6.5]]), mk('R23', [[0.5, 2], [9.5, 2], [9.5, 8], [0.5, 8]]), mk('Q5', [[4, 0], [6, 0], [6, 10], [4, 10]])];
  var RHOMBI = [mk('Q6', [[5, 0], [8, 5], [5, 10], [2, 5]]), mk('M5', [[5, 0], [7.5, 5], [5, 10], [2.5, 5]]), mk('M4', [[5, 0], [7, 5], [5, 10], [3, 5]]), mk('Q7', [[1, 6], [5, 3], [10, 3], [6, 6]])];
  var OTHERQ = [mk('Q8', [[3, 2], [7, 2], [9, 8], [1, 8]]), mk('Q9', [[1, 7], [3, 3], [10, 3], [8, 7]]), mk('Q10', [[5, 1], [7.5, 3], [5, 9], [2.5, 3]]), mk('Q11', [[5, 1], [9, 9], [5, 6], [1, 9]]), mk('Q12', [[1, 2], [9, 1], [7, 8], [4, 6]])];
  var QUAD = SQS.concat([mk('Q2', [[5, 1], [9, 5], [5, 9], [1, 5]])], RECTS.slice(0, 1), [mk('Q4', [[2, 3], [4, 1], [9, 6], [7, 8]])], RECTS.slice(3), RHOMBI.slice(0, 1), RHOMBI.slice(3), OTHERQ);
  var PENT = [mk('F1', [[5, 1], [9, 4], [7.5, 9], [2.5, 9], [1, 4]]), mk('F2', [[2, 4], [5, 1], [8, 4], [8, 9], [2, 9]]), mk('F3', [[1, 3], [6, 1], [9, 5], [6, 9], [2, 8]]), mk('F4', [[1, 2], [9, 2], [9, 8], [5, 5], [1, 8]]), mk('F5', [[1, 2], [7, 2], [9, 4], [9, 8], [1, 8]])];
  var HEX = [mk('H1', [[3, 1], [7, 1], [9.5, 5], [7, 9], [3, 9], [0.5, 5]]), mk('H2', [[1, 1], [5, 1], [5, 5], [9, 5], [9, 9], [1, 9]]), mk('H3', [[2, 1], [7, 2], [9, 5], [8, 9], [3, 9], [1, 5]])];
  var HEPT = [mk('S1', reg(7)), mk('S2', [[5, 0.5], [8.5, 2], [9.5, 6], [7, 9.5], [3, 9.5], [0.5, 6], [1.5, 2]])];
  var OCT = [mk('O1', [[3, 0.5], [7, 0.5], [9.5, 3], [9.5, 7], [7, 9.5], [3, 9.5], [0.5, 7], [0.5, 3]]), mk('O2', [[5, 0], [6.5, 3.5], [10, 5], [6.5, 6.5], [5, 10], [3.5, 6.5], [0, 5], [3.5, 3.5]])];
  var NON = [mk('N1', reg(9))];
  var DEC = [mk('D1', reg(10)), mk('D2', star(5, 5, 2)), mk('D3', [[1, 1], [4, 1], [4, 4], [6, 4], [6, 1], [9, 1], [9, 9], [6, 9], [6, 6], [1, 6]])];
  var BYN = { 3: TRI, 4: QUAD, 5: PENT, 6: HEX, 7: HEPT, 8: OCT, 9: NON, 10: DEC };
  var ALLP = TRI.concat(QUAD, PENT, HEX, HEPT, OCT, NON, DEC);
  // shapes that are not polygons: el = the drawing, mk = the part that is pointed at, why = curve | round | open
  function nonp(id, why, el, mark, open) { return { id: id, n: 0, el: el, mk: mark || el, why: why, open: !!open }; }
  function pth(d) { return '<path d="' + d + '"/>'; }
  function ring(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="1.3"/>'; }
  var NONP = [
    nonp('X1', 'curve', '<circle cx="5" cy="5" r="4"/>'),
    nonp('X2', 'curve', '<ellipse cx="5" cy="5" rx="4.6" ry="2.8"/>'),
    nonp('X3', 'curve', pth('M5,9 C1,6 0.5,3.5 2,2.2 C3.3,1.1 4.6,1.8 5,3 C5.4,1.8 6.7,1.1 8,2.2 C9.5,3.5 9,6 5,9 Z')),
    nonp('X4', 'curve', pth('M7,1.2 A4.2,4.2 0 1 0 7,8.8 A5.5,5.5 0 0 1 7,1.2 Z')),
    nonp('X5', 'curve', pth('M5,1 C5,1 8.5,5 8.5,6.5 A3.5,3.5 0 0 1 1.5,6.5 C1.5,5 5,1 5,1 Z')),
    nonp('X6', 'curve', pth('M5,1 C7.5,1 8.5,4.5 8.5,6 A3.5,3.2 0 0 1 1.5,6 C1.5,4.5 2.5,1 5,1 Z')),
    nonp('X7', 'curve', pth('M2.5,7.5 A2,2 0 0 1 2.5,3.8 A2.6,2.6 0 0 1 7,3.2 A2.2,2.2 0 0 1 7.8,7.5 Z')),
    nonp('X8', 'curve', pth('M5,5 C5,4 6.5,4 6.5,5.2 C6.5,7 3.5,7 3.5,5 C3.5,2.5 8,2.5 8,5.5 C8,9 2,9 2,5'), null, true),
    nonp('X9', 'curve', pth('M1,6.5 A4,4 0 0 1 9,6.5 Z'), pth('M1,6.5 A4,4 0 0 1 9,6.5')),
    nonp('X10', 'curve', pth('M5,9 L1.5,3 A7,7 0 0 1 8.5,3 Z'), pth('M1.5,3 A7,7 0 0 1 8.5,3')),
    nonp('X11', 'curve', pth('M5,1 L9,8 Q5,10.8 1,8 Z'), pth('M9,8 Q5,10.8 1,8')),
    nonp('X12', 'curve', pth('M5,1 Q5.5,6 9,9 Q5,7 1,9 Q4.5,6 5,1 Z')),
    nonp('X13', 'curve', pth('M2,2.5 Q3.5,0.3 5,2.5 Q6.5,4.7 8,2.5 L8,8 L2,8 Z'), pth('M2,2.5 Q3.5,0.3 5,2.5 Q6.5,4.7 8,2.5')),
    nonp('X14', 'round', '<rect x="1" y="2.5" width="8" height="5" rx="1.7"/>', ring(1.6, 3.1) + ring(8.4, 3.1) + ring(8.4, 6.9) + ring(1.6, 6.9)),
    nonp('X15', 'round', pth('M4.2,2.6 Q5,1 5.8,2.6 L8.5,7.6 Q9.3,9.2 7.5,9.2 L2.5,9.2 Q0.7,9.2 1.5,7.6 Z'), ring(5, 2.2) + ring(8.3, 8.6) + ring(1.7, 8.6)),
    nonp('X16', 'open', pth('M5.8,1 L9,9 L1,9 L3.6,3.2'), pth('M3.6,3.2 L5.8,1'), true),
    nonp('X17', 'open', pth('M2,2 L2,8 L8,8 L8,2'), pth('M2,2 L8,2'), true),
    nonp('X18', 'open', pth('M3.9,9 L2.5,9 L1,4 L5,1 L9,4 L7.5,9 L6.1,9'), pth('M3.9,9 L6.1,9'), true),
    nonp('X19', 'open', pth('M1,7 L3,3 L5,7 L7,3 L9,7'), pth('M1,7 L9,7'), true),
    nonp('X20', 'open', pth('M8,2.6 A4,4 0 1 0 8,7.4'), pth('M8,2.6 L8,7.4'), true)
  ];
  var NEAR = NONP.slice(9, 18); // the ones that look almost like a polygon
  var LOOK = { 3: [NONP[9], NONP[10], NONP[11], NONP[14], NONP[15]], 4: [NONP[12], NONP[13], NONP[16]], 5: [NONP[17], NONP[13]] };
  function drawShape(sh, x, y, w, h, ang, fill, sw, mark) {
    if (sh.p) return pg(fit(sh.p, x, y, w, h, ang), fill, sw);
    var k = n1(Math.min(w, h) / 10), t = ' transform="translate(' + n1(x + w / 2) + ',' + n1(y + h / 2) + ') rotate(' + ang + ') scale(' + k + ') translate(-5,-5)"';
    var out = '<g' + t + ' fill="' + (sh.open ? 'none' : fill) + '" stroke="' + INK + '" stroke-width="' + (sw / k).toFixed(2) + '" stroke-linejoin="round" stroke-linecap="round">' + sh.el + '</g>';
    if (mark) out += '<g' + t + ' fill="none" stroke="' + RED + '" stroke-width="' + ((sw + 1.5) / k).toFixed(2) + '" stroke-linecap="round"' + (sh.why === 'open' && sh.id !== 'X8' ? ' stroke-dasharray="0.5 0.7"' : '') + '>' + sh.mk + '</g>';
    return out;
  }
  function optPic(sh, ang, fill) { return S(90, 70, drawShape(sh, 13, 5, 64, 60, ang, fill, 2.5)); }
  function okPoly(pts) { // every side long enough to count, every corner a clear corner
    var n = pts.length, i;
    for (i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n], ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1], lu = Math.sqrt(ux * ux + uy * uy), lv = Math.sqrt(vx * vx + vy * vy);
      if (lu < 1.5 || Math.abs(ux * vy - uy * vx) / (lu * lv) < 0.42) return false;
    }
    return true;
  }
  function irr(r, n) { // an irregular polygon with n sides, no crossing
    var t, i;
    for (t = 0; t < 40; t++) {
      var j = n >= 9 ? 0.16 : n >= 7 ? 0.24 : 0.32, pts = [];
      for (i = 0; i < n; i++) { var a = (i + (r() * 2 - 1) * j) * 2 * PI / n, q = n >= 9 ? 4 + r() : 3 + r() * 2; pts.push([5 + q * Math.cos(a), 5 + q * Math.sin(a)]); }
      if (okPoly(pts)) return pts;
    }
    return reg(n);
  }

  // ---------- words ----------
  var NAME = { 3: 'מְשֻׁלָּשׁ', 4: 'מְרֻבָּע', 5: 'מְחֻמָּשׁ', 6: 'מְשֻׁשֶּׁה', 7: 'מְשֻׁבָּע', 8: 'מְתֻמָּן', 9: 'מְתֻשָּׁע', 10: 'מְעֻשָּׂר' };
  var DEFN = { 3: 'הַמְּשֻׁלָּשׁ', 4: 'הַמְּרֻבָּע', 5: 'הַמְּחֻמָּשׁ', 6: 'הַמְּשֻׁשֶּׁה', 7: 'הַמְּשֻׁבָּע', 8: 'הַמְּתֻמָּן', 9: 'הַמְּתֻשָּׁע', 10: 'הַמְּעֻשָּׂר' };
  var TO = { 3: 'לַמְּשֻׁלָּשׁ', 4: 'לַמְּרֻבָּע', 5: 'לַמְּחֻמָּשׁ', 6: 'לַמְּשֻׁשֶּׁה', 7: 'לַמְּשֻׁבָּע', 8: 'לַמְּתֻמָּן', 9: 'לַמְּתֻשָּׁע', 10: 'לַמְּעֻשָּׂר' };
  var PLUR = { 3: 'מְשֻׁלָּשִׁים', 4: 'מְרֻבָּעִים', 5: 'מְחֻמָּשִׁים', 6: 'מְשֻׁשִּׁים' };
  var WHY = { curve: 'כָּאן הַקַּו עָקֹם.', round: 'כָּאן הַפִּנָּה עֲגֻלָּה.', open: 'כָּאן הַצּוּרָה פְּתוּחָה.' };
  var TIP_POLY = 'מְצֻלָּע: רַק קַוִּים יְשָׁרִים, וְהַצּוּרָה סְגוּרָה.';
  function seq(n) { var o = [], i; for (i = 1; i <= n; i++) o.push(i); return o.join(', '); }
  function cntSides(n) { return 'סוֹפְרִים אֶת הַצְּלָעוֹת: ' + seq(n) + '.'; }
  function cntVerts(n) { return 'סוֹפְרִים אֶת הַקָּדְקוֹדִים: ' + seq(n) + '.'; }
  function hasSides(n) { return TO[n] + ' יֵשׁ ' + n + ' צְלָעוֹת.'; }
  function same(n) { return n + ' צְלָעוֹת וְ-' + n + ' קָדְקוֹדִים. תָּמִיד אוֹתוֹ מִסְפָּר.'; }
  function near3(n, lo, hi) { var a = n <= lo ? lo : n >= hi ? hi - 2 : n - 1; return [a, a + 1, a + 2]; }
  function bigSides(pts0, ang, num) { return S(300, 170, sidesOn(fit(pts0, 92, 26, 116, 118, ang), num)); }
  function bigVerts(pts0, ang) { return S(300, 170, vertsOn(fit(pts0, 92, 26, 116, 118, ang), true)); }
  function bigShape(sh, ang, fill, mark) { return S(300, 170, drawShape(sh, 80, 15, 140, 140, ang, fill, 4, mark)); }
  function whyStep(sh, ang, fill) {
    if (sh.p) return { say: 'רַק קַוִּים יְשָׁרִים, וְהַצּוּרָה סְגוּרָה. זֶה מְצֻלָּע.', svg: bigSides(sh.p, ang, false) };
    return { say: WHY[sh.why] + ' זֶה לֹא מְצֻלָּע.', svg: bigShape(sh, ang, fill, true) };
  }
  function ang15(r, K) { return K.ri(r, 0, 23) * 15; }
  var ABC = ['a', 'b', 'c', 'd'];
  function picOpts(items, draw) { var o = {}; items.forEach(function (it, i) { o[ABC[i]] = draw(it); }); return o; }

  // ---------- 1.1 polygon or not ----------
  function polyOrNot(r, K) {
    var white = r() < 0.35, fl = function () { return white ? '#fff' : K.pick(r, COL); }, t = r();
    if (t < 0.5) {
      var isP = r() < 0.5, sh = isP ? K.pick(r, ALLP) : K.pick(r, NONP), ang = ang15(r, K), fill = fl();
      return K.tf(r, { text: 'זֶה מְצֻלָּע?', svg: bigShape(sh, ang, fill), tip: TIP_POLY, ex: [whyStep(sh, ang, fill)], key: 'pn' + sh.id + '.' + ang + fill }, isP);
    }
    var findP = t < 0.78, ps = K.sample(r, ALLP, findP ? 1 : 2), first = K.pick(r, NEAR);
    var ns = findP ? [first, K.pick(r, NONP.filter(function (x) { return x !== first; }))] : [K.pick(r, NONP)];
    var items = K.shuffle(r, ps.concat(ns)).map(function (s) { return { s: s, a: ang15(r, K), f: fl() }; }), ans, steps = [];
    items.forEach(function (it, i) { if (findP ? !!it.s.p : !it.s.p) ans = ABC[i]; });
    items.filter(function (it) { return !it.s.p; }).forEach(function (it) { steps.push(whyStep(it.s, it.a, it.f)); });
    if (findP) items.filter(function (it) { return !!it.s.p; }).forEach(function (it) { steps.push(whyStep(it.s, it.a, it.f)); });
    return K.q(r, {
      text: findP ? 'אֵיפֹה הַמְּצֻלָּע?' : 'מָה לֹא מְצֻלָּע?', answer: ans, options: ABC.slice(0, 3), keep: true,
      optHtml: picOpts(items, function (it) { return optPic(it.s, it.a, it.f); }), tip: TIP_POLY, ex: steps,
      key: 'pp' + findP + items.map(function (it) { return it.s.id + '.' + it.a; }).join('')
    });
  }

  // ---------- 1.2 triangle, quadrilateral, pentagon ----------
  var SCENES = [ // drawings made of shapes: ['p', points, isTriangle] | ['c', cx, cy, r]
    { id: 'house', n: 1, parts: [['p', [[105, 75], [195, 75], [195, 155], [105, 155]]], ['p', [[95, 75], [150, 25], [205, 75]], 1], ['p', [[140, 110], [160, 110], [160, 155], [140, 155]]]] },
    { id: 'boat', n: 2, parts: [['p', [[80, 115], [220, 115], [195, 150], [105, 150]]], ['p', [[147, 30], [153, 30], [153, 115], [147, 115]]], ['p', [[153, 35], [153, 105], [205, 105]], 1], ['p', [[147, 50], [147, 105], [105, 105]], 1]] },
    { id: 'rocket', n: 3, parts: [['p', [[130, 55], [170, 55], [170, 135], [130, 135]]], ['p', [[130, 55], [150, 15], [170, 55]], 1], ['p', [[130, 105], [130, 135], [105, 135]], 1], ['p', [[170, 105], [170, 135], [195, 135]], 1], ['c', 150, 85, 10]] },
    { id: 'fish', n: 1, parts: [['p', [[80, 85], [140, 50], [200, 85], [140, 120]]], ['p', [[200, 85], [235, 60], [235, 110]], 1], ['c', 115, 82, 5]] },
    { id: 'fir3', n: 3, parts: [['p', [[150, 10], [125, 50], [175, 50]], 1], ['p', [[150, 50], [115, 95], [185, 95]], 1], ['p', [[150, 95], [105, 140], [195, 140]], 1], ['p', [[140, 140], [160, 140], [160, 165], [140, 165]]]] },
    { id: 'fir2', n: 2, parts: [['p', [[150, 20], [118, 75], [182, 75]], 1], ['p', [[150, 75], [105, 135], [195, 135]], 1], ['p', [[140, 135], [160, 135], [160, 162], [140, 162]]]] },
    { id: 'wheel', n: 4, parts: [['p', [[147, 85], [153, 85], [153, 165], [147, 165]]], ['p', [[150, 85], [150, 30], [190, 58]], 1], ['p', [[150, 85], [205, 85], [177, 125]], 1], ['p', [[150, 85], [150, 140], [110, 112]], 1], ['p', [[150, 85], [95, 85], [123, 45]], 1]] },
    { id: 'truck', n: 0, parts: [['p', [[70, 60], [170, 60], [170, 125], [70, 125]]], ['p', [[170, 85], [220, 85], [220, 125], [170, 125]]], ['c', 100, 133, 14], ['c', 195, 133, 14]] },
    { id: 'crown', n: 3, parts: [['p', [[95, 110], [205, 110], [205, 140], [95, 140]]], ['p', [[95, 110], [113, 55], [131, 110]], 1], ['p', [[132, 110], [150, 55], [168, 110]], 1], ['p', [[169, 110], [187, 55], [205, 110]], 1]] },
    { id: 'cone', n: 1, parts: [['c', 150, 55, 30], ['p', [[122, 75], [178, 75], [150, 160]], 1]] },
    { id: 'train', n: 0, parts: [['p', [[60, 70], [140, 70], [140, 125], [60, 125]]], ['p', [[150, 50], [230, 50], [230, 125], [150, 125]]], ['p', [[172, 62], [208, 62], [208, 92], [172, 92]]], ['c', 85, 135, 13], ['c', 120, 135, 13], ['c', 190, 135, 13]] },
    { id: 'two', n: 2, parts: [['p', [[40, 90], [120, 90], [120, 150], [40, 150]]], ['p', [[32, 90], [80, 45], [128, 90]], 1], ['p', [[180, 90], [260, 90], [260, 150], [180, 150]]], ['p', [[172, 90], [220, 45], [268, 90]], 1]] }
  ];
  function scenePic(sc, shift, count) {
    var k = 0, lab = '', out = sc.parts.map(function (p, i) {
      var fill = count ? (p[2] ? '#ffb300' : '#e6e1ee') : COL[(i + shift) % 5];
      if (p[0] === 'c') return ci(p[1], p[2], p[3], fill, INK, 3);
      if (count && p[2]) { k++; lab += tx((p[1][0][0] + p[1][1][0] + p[1][2][0]) / 3, (p[1][0][1] + p[1][1][1] + p[1][2][1]) / 3 + 6, k, 16); }
      return pg(p[1], fill, 3);
    }).join('');
    return S(300, 170, out + lab);
  }
  function triQuadPent(r, K) {
    var t = r(), n = K.ri(r, 3, 5), sh, ang, fill, items, ans;
    if (t < 0.34) { // where is the ...?
      var others = n === 3 ? [4, 5] : n === 4 ? [3, 5] : [4, 6];
      items = K.shuffle(r, [K.pick(r, BYN[n]), K.pick(r, BYN[others[0]]), K.pick(r, BYN[others[1]]), K.pick(r, LOOK[n])]).map(function (s) { return { s: s, a: ang15(r, K), f: K.pick(r, COL) }; });
      items.forEach(function (it, i) { if (it.s.n === n) { ans = ABC[i]; sh = it; } });
      return K.q(r, {
        text: 'אֵיפֹה ' + DEFN[n] + '?', answer: ans, options: ABC.slice(0, 4), keep: true, optHtml: picOpts(items, function (it) { return optPic(it.s, it.a, it.f); }),
        tip: hasSides(n), ex: [{ say: cntSides(n), svg: bigSides(sh.s.p, sh.a, true) }, { say: hasSides(n) }],
        key: 'tw' + n + items.map(function (it) { return it.s.id + '.' + it.a; }).join('')
      });
    }
    if (t < 0.56) { // what is it called?
      sh = K.pick(r, BYN[n]); ang = ang15(r, K); fill = K.pick(r, COL);
      return K.q(r, {
        text: 'אֵיךְ קוֹרְאִים לַמְּצֻלָּע?', svg: S(300, 170, pg(fit(sh.p, 85, 18, 130, 134, ang), fill, 4)), answer: NAME[n], options: [NAME[3], NAME[4], NAME[5]], keep: true,
        tip: hasSides(n), ex: [{ say: cntSides(n), svg: bigSides(sh.p, ang, true) }, { say: n + ' צְלָעוֹת: זֶה ' + NAME[n] + '.' }], key: 'tn' + sh.id + '.' + ang + fill
      });
    }
    if (t < 0.82) { // the odd one out
      var m = K.pick(r, [3, 4, 5].filter(function (x) { return x !== n; }));
      items = K.shuffle(r, K.sample(r, BYN[n], 3).concat([K.pick(r, BYN[m])])).map(function (s) { return { s: s, a: ang15(r, K), f: K.pick(r, COL) }; });
      items.forEach(function (it, i) { if (it.s.n === m) ans = ABC[i]; });
      var row = items.map(function (it, i) { return pg(fit(it.s.p, 8 + i * 73, 30, 62, 80, it.a), it.f, 3) + tx(39 + i * 73, 145, it.s.n, 22, it.s.n === m ? RED : INK); }).join('');
      return K.q(r, {
        text: 'מִי יוֹצֵא דֹּפֶן?', answer: ans, options: ABC.slice(0, 4), keep: true, optHtml: picOpts(items, function (it) { return optPic(it.s, it.a, it.f); }),
        tip: 'סוֹפְרִים צְלָעוֹת בְּכָל צוּרָה.',
        ex: [{ say: 'סוֹפְרִים צְלָעוֹת בְּכָל צוּרָה.', svg: S(300, 170, row) }, { say: 'שְׁלוֹשָׁה ' + PLUR[n] + '. לְצוּרָה אַחַת יֵשׁ ' + m + ' צְלָעוֹת: הִיא יוֹצֵאת דֹּפֶן.' }],
        key: 'to' + items.map(function (it) { return it.s.id + '.' + it.a; }).join('')
      });
    }
    var sc = K.pick(r, SCENES), shift = K.ri(r, 0, 4); // triangles inside a drawing
    return K.q(r, {
      text: 'כַּמָּה מְשֻׁלָּשִׁים בַּצִּיּוּר?', svg: scenePic(sc, shift), answer: sc.n, options: sc.n === 0 ? [0, 1, 2] : [sc.n - 1, sc.n, sc.n + 1], keep: true,
      tip: 'לַמְּשֻׁלָּשׁ יֵשׁ 3 צְלָעוֹת.',
      ex: [{ say: 'מְחַפְּשִׂים רַק צוּרוֹת עִם 3 צְלָעוֹת.', svg: scenePic(sc, shift, true) }, { say: sc.n === 0 ? 'אֵין כָּאן מְשֻׁלָּשִׁים.' : sc.n === 1 ? 'יֵשׁ כָּאן מְשֻׁלָּשׁ אֶחָד.' : 'יֵשׁ כָּאן ' + sc.n + ' מְשֻׁלָּשִׁים.' }],
      key: 'ts' + sc.id + shift
    });
  }

  // ---------- 1.3 sides and vertices ----------
  function sidesVerts(r, K) {
    var t = r(), n = K.ri(r, 3, 6), sh = K.pick(r, BYN[n]), ang = ang15(r, K), fill = K.pick(r, COL), side = r() < 0.5;
    if (t < 0.72) {
      return K.q(r, {
        text: side ? 'כַּמָּה צְלָעוֹת?' : 'כַּמָּה קָדְקוֹדִים?', svg: S(300, 170, pg(fit(sh.p, 85, 18, 130, 134, ang), fill, 4)), answer: n, options: near3(n, 3, 7), keep: true,
        tip: side ? 'צֶלַע הִיא קַו יָשָׁר. סוֹפְרִים אַחַת אַחַת.' : 'קָדְקוֹד הוּא פִּנָּה. סוֹפְרִים אֶחָד אֶחָד.',
        ex: side ? [{ say: cntSides(n), svg: bigSides(sh.p, ang, true) }, { say: same(n), svg: bigVerts(sh.p, ang) }] : [{ say: cntVerts(n), svg: bigVerts(sh.p, ang) }, { say: same(n), svg: bigSides(sh.p, ang, true) }],
        key: 'sv' + side + sh.id + '.' + ang + fill
      });
    }
    var ns = K.sample(r, [3, 4, 5, 6], 3), ans, items = ns.map(function (m) { return { s: K.pick(r, BYN[m]), a: ang15(r, K), f: K.pick(r, COL) }; });
    n = ns[0]; items = K.shuffle(r, items);
    items.forEach(function (it, i) { if (it.s.n === n) { ans = ABC[i]; sh = it; } });
    return K.q(r, {
      text: 'לְמִי יֵשׁ ' + n + (side ? ' צְלָעוֹת?' : ' קָדְקוֹדִים?'), answer: ans, options: ABC.slice(0, 3), keep: true, optHtml: picOpts(items, function (it) { return optPic(it.s, it.a, it.f); }),
      tip: 'סוֹפְרִים בְּכָל צוּרָה, אַחַת אַחַת.',
      ex: [side ? { say: cntSides(n), svg: bigSides(sh.s.p, sh.a, true) } : { say: cntVerts(n), svg: bigVerts(sh.s.p, sh.a) }, { say: same(n) }],
      key: 'sw' + side + items.map(function (it) { return it.s.id + '.' + it.a; }).join('')
    });
  }

  // ---------- 1.4 the names of the polygons ----------
  function polyNames(r, K) {
    var t = r(), n = K.ri(r, 6, 10), pts = r() < 0.5 ? K.pick(r, BYN[n]).p : irr(r, n), ang = ang15(r, K), fill = K.pick(r, COL);
    var id = n + '.' + P(pts).slice(0, 36) + '.' + ang + fill, pic = S(300, 170, pg(fit(pts, 72, 8, 156, 154, ang), fill, 4));
    var big = S(300, 170, sidesOn(fit(pts, 80, 22, 140, 126, ang), true));
    if (t < 0.4) {
      return K.q(r, { text: 'כַּמָּה צְלָעוֹת?', svg: pic, answer: n, options: near3(n, 5, 11), keep: true, tip: 'סוֹפְרִים צֶלַע אַחַר צֶלַע, לְאַט.', ex: [{ say: cntSides(n), svg: big }, { say: n + ' צְלָעוֹת: זֶה ' + NAME[n] + '.' }], key: 'nc' + id });
    }
    if (t < 0.8) {
      return K.q(r, {
        text: 'אֵיךְ קוֹרְאִים לַמְּצֻלָּע?', svg: pic, answer: NAME[n], options: near3(n, 5, 10).map(function (m) { return NAME[m]; }), keep: true,
        tip: 'מִסְפַּר הַצְּלָעוֹת קוֹבֵעַ אֶת הַשֵּׁם.', ex: [{ say: cntSides(n), svg: big }, { say: n + ' צְלָעוֹת: זֶה ' + NAME[n] + '.' }], key: 'nn' + id
      });
    }
    n = K.ri(r, 3, 10); pts = reg(n);
    var os = K.sample(r, [3, 4, 5, 6, 7, 8, 9, 10].filter(function (m) { return m !== n && Math.abs(m - n) <= 2; }), 2).concat([n]).sort(function (a, b) { return a - b; });
    return K.q(r, {
      text: 'לְאֵיזֶה מְצֻלָּע יֵשׁ ' + n + ' צְלָעוֹת?', answer: NAME[n], options: os.map(function (m) { return NAME[m]; }), keep: true,
      tip: 'מִסְפַּר הַצְּלָעוֹת קוֹבֵעַ אֶת הַשֵּׁם.', ex: [{ say: cntSides(n), svg: bigSides(pts, 0, true) }, { say: hasSides(n) }], key: 'nq' + n + os.join('')
    });
  }

  // ---------- 1.5 square, rectangle, rhombus ----------
  var FAM = [{ k: 'sq', nm: 'רִבּוּעַ', def: 'הָרִבּוּעַ', list: SQS }, { k: 'rc', nm: 'מַלְבֵּן', def: 'הַמַּלְבֵּן', list: RECTS }, { k: 'rh', nm: 'מְעֻיָּן', def: 'הַמְּעֻיָּן', list: RHOMBI }, { k: 'ot', nm: 'מְרֻבָּע אַחֵר', list: OTHERQ }];
  function lenCols(p) { // sides of equal length get the same colour
    var ls = p.map(function (a, i) { var b = p[(i + 1) % p.length]; return Math.round(Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)) * 10); }), seen = [];
    return ls.map(function (l) { if (seen.indexOf(l) < 0) seen.push(l); return COL[seen.indexOf(l)]; });
  }
  function quadEx(fam, sh, ang) {
    var cols = lenCols(sh.p), turned = S(300, 170, sidesOn(fit(sh.p, 92, 26, 116, 118, ang), false, cols)), up = S(300, 170, sidesOn(fit(sh.p, 92, 26, 116, 118, 0), false, cols));
    if (fam.k === 'sq') return [{ say: 'כָּל הַצְּלָעוֹת שָׁווֹת.', svg: turned }, { say: 'מְסוֹבְבִים אֶת הַצּוּרָה: זֶה רִבּוּעַ.', svg: up }];
    if (fam.k === 'rc') return [{ say: 'שְׁתֵּי צְלָעוֹת אֲרֻכּוֹת וּשְׁתֵּי צְלָעוֹת קְצָרוֹת.', svg: turned }, { say: 'מְסוֹבְבִים אֶת הַצּוּרָה: זֶה מַלְבֵּן.', svg: up }];
    if (fam.k === 'rh') {
      var pair = fitMany([[[0, 0], [6, 0], [6, 6], [0, 6]], [[9, 6], [15, 6], [18.6, 1.2], [12.6, 1.2]]], 40, 35, 220, 100);
      return [{ say: 'כָּל הַצְּלָעוֹת שָׁווֹת.', svg: turned }, { say: 'רִבּוּעַ שֶׁדָּחֲפוּ אוֹתוֹ הַצִּדָּה נִהְיָה מְעֻיָּן.', svg: S(300, 170, pg(pair[0], '#fff', 3, ' stroke-dasharray="6 5"') + pg(pair[1], COL[0], 3)) }, { say: 'זֶה מְעֻיָּן.', svg: up }];
    }
    return [{ say: 'זֶה לֹא רִבּוּעַ, לֹא מַלְבֵּן וְלֹא מְעֻיָּן.', svg: turned }, { say: 'זֶה מְרֻבָּע אַחֵר.' }];
  }
  function specialQuads(r, K) {
    var fam = K.pick(r, FAM), sh = K.pick(r, fam.list), ang = ang15(r, K), fill = K.pick(r, COL);
    if (r() < 0.55) {
      return K.q(r, {
        text: 'אֵיזֶה מְרֻבָּע זֶה?', svg: S(300, 170, pg(fit(sh.p, 85, 18, 130, 134, ang), fill, 4)), answer: fam.nm, options: FAM.map(function (f) { return f.nm; }), keep: true,
        tip: 'בְּרִבּוּעַ וּבִמְעֻיָּן כָּל הַצְּלָעוֹת שָׁווֹת.', ex: quadEx(fam, sh, ang), key: 'qn' + sh.id + '.' + ang + fill
      });
    }
    fam = K.pick(r, FAM.slice(0, 3)); sh = K.pick(r, fam.list);
    var rest = fam.k === 'sq' ? [K.pick(r, RECTS), K.pick(r, RHOMBI), K.pick(r, OTHERQ)] : [K.pick(r, fam.k === 'rc' ? RHOMBI : RECTS)].concat(K.sample(r, OTHERQ, 2)), ans;
    var items = K.shuffle(r, [sh].concat(rest)).map(function (s) { return { s: s, a: ang15(r, K), f: K.pick(r, COL) }; }), me;
    items.forEach(function (it, i) { if (it.s === sh) { ans = ABC[i]; me = it; } });
    return K.q(r, {
      text: 'אֵיפֹה ' + fam.def + '?', answer: ans, options: ABC.slice(0, 4), keep: true, optHtml: picOpts(items, function (it) { return optPic(it.s, it.a, it.f); }),
      tip: 'מְסוֹבְבִים אֶת הַצּוּרָה בָּרֹאשׁ. הִיא נִשְׁאֶרֶת אוֹתָהּ צוּרָה.', ex: quadEx(fam, sh, me.a), key: 'qw' + items.map(function (it) { return it.s.id + '.' + it.a; }).join('')
    });
  }

  // ---------- 1.6 cutting, building, folding ----------
  function bpt(p, pos) { var a = p[pos[0]], b = p[(pos[0] + 1) % p.length]; return [a[0] + (b[0] - a[0]) * pos[1], a[1] + (b[1] - a[1]) * pos[1]]; }
  function dedupe(pts) {
    var o = [];
    pts.forEach(function (p) { var l = o[o.length - 1]; if (!l || Math.abs(l[0] - p[0]) + Math.abs(l[1] - p[1]) > 0.001) o.push(p); });
    if (o.length > 1 && Math.abs(o[0][0] - o[o.length - 1][0]) + Math.abs(o[0][1] - o[o.length - 1][1]) < 0.001) o.pop();
    return o;
  }
  function cut(p, A, B) { // the two pieces of polygon p cut from boundary place A to boundary place B (A comes first)
    var one = [bpt(p, A)], two = [bpt(p, B)], i;
    for (i = A[0] + 1; i <= B[0]; i++) one.push(p[i]);
    one.push(bpt(p, B));
    for (i = B[0] + 1; i <= p.length + A[0]; i++) two.push(p[i % p.length]);
    two.push(bpt(p, A));
    return [dedupe(one), dedupe(two)];
  }
  function apart(parts, A, B, gap) { // push the pieces away from the cutting line
    var nx = B[1] - A[1], ny = A[0] - B[0], d = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= d; ny /= d;
    return parts.map(function (pp) {
      var cx = 0, cy = 0; pp.forEach(function (q) { cx += q[0] / pp.length; cy += q[1] / pp.length; });
      var s = (cx - A[0]) * nx + (cy - A[1]) * ny > 0 ? 1 : -1;
      return pp.map(function (q) { return [q[0] + nx * gap * s, q[1] + ny * gap * s]; });
    });
  }
  function mirror(pts, A, B) { // fold over the line A-B
    var dx = B[0] - A[0], dy = B[1] - A[1], d2 = dx * dx + dy * dy;
    return pts.map(function (q) { var t = ((q[0] - A[0]) * dx + (q[1] - A[1]) * dy) / d2, fx = A[0] + t * dx, fy = A[1] + t * dy; return [2 * fx - q[0], 2 * fy - q[1]]; });
  }
  var HX6 = reg(6, 4.5, PI / 6);
  var D_DIAG = [[0, 0], [2, 0]], D_MID = [[0, 0.5], [2, 0.5]], D_CLIP = [[0, 0.5], [1, 0.5]], D_VM = [[0, 0], [1, 0.5]];
  var BASES = [
    { id: 'sq', nm: 'רִבּוּעַ', p: [[2, 2], [8, 2], [8, 8], [2, 8]], c: [D_DIAG, D_MID, D_CLIP, D_VM] },
    { id: 'rc', nm: 'מַלְבֵּן', p: [[1, 3], [9, 3], [9, 7], [1, 7]], c: [D_DIAG, D_MID, D_CLIP, D_VM] },
    { id: 'rh', nm: 'מְעֻיָּן', p: [[5, 0.5], [8, 5], [5, 9.5], [2, 5]], c: [D_DIAG, D_MID, D_CLIP] },
    { id: 'hx', nm: 'מְשֻׁשֶּׁה', p: HX6, c: [[[0, 0], [3, 0]], [[0, 0], [2, 0]], [[0, 0.5], [3, 0.5]], [[0, 0], [2, 0.5]]] },
    { id: 'hs', nm: 'מְחֻמָּשׁ', p: [[2, 4], [5, 1], [8, 4], [8, 9], [2, 9]], c: [D_DIAG, [[1, 0], [3, 0.5]], [[2, 0.5], [3, 0.5]]] },
    { id: 'tr', nm: 'מְשֻׁלָּשׁ', p: [[5, 1], [9, 9], [1, 9]], c: [D_VM, D_MID] }
  ];
  function sig(b, c) { var q = cut(b.p, c[0], c[1]); return [q[0].length, q[1].length].sort().join(''); }
  function sigName(s) { var a = +s[0], b = +s[1]; return a === b ? 'שְׁנֵי ' + PLUR[a] : NAME[a] + ' וּ' + NAME[b]; }
  function cutGeo(b, c, ang) { var p = rot(b.p, ang); return { p: p, A: bpt(p, c[0]), B: bpt(p, c[1]), parts: cut(p, c[0], c[1]) }; }
  function piecesPic(g, gap, fills, w, h, pad, nums) {
    var f = fitMany(apart(g.parts, g.A, g.B, gap), pad, pad, w - 2 * pad, h - 2 * pad), out = '';
    f.forEach(function (pp, i) {
      var cx = 0, cy = 0; pp.forEach(function (q) { cx += q[0] / pp.length; cy += q[1] / pp.length; });
      out += pg(pp, fills[i], w > 100 ? 3 : 2.5) + (nums ? tx(cx, cy + 7, pp.length, 20, '#fff') : '');
    });
    return S(w, h, out);
  }
  function seamPic(g, fill, w, h, pad) {
    var f = fitMany([g.p, [g.A, g.B]], pad, pad, w - 2 * pad, h - 2 * pad);
    return S(w, h, pg(f[0], fill, w > 100 ? 4 : 2.5) + ln(f[1][0][0], f[1][0][1], f[1][1][0], f[1][1][1], w > 100 ? RED : INK, w > 100 ? 3.5 : 2.5, w > 100 ? '9 7' : '5 4'));
  }
  var FOLDS = [
    { id: 'sq', p: BASES[0].p, c: D_MID, yes: 1 }, { id: 'sq', p: BASES[0].p, c: D_DIAG, yes: 1 }, { id: 'sq', p: BASES[0].p, c: [[0, 0.3], [2, 0.7]], yes: 0 },
    { id: 'rc', p: BASES[1].p, c: D_MID, yes: 1 }, { id: 'rc', p: BASES[1].p, c: [[1, 0.5], [3, 0.5]], yes: 1 }, { id: 'rc', p: BASES[1].p, c: D_DIAG, yes: 0 }, { id: 'rc', p: BASES[1].p, c: [[0, 0.25], [2, 0.75]], yes: 0 },
    { id: 'rh', p: BASES[2].p, c: D_DIAG, yes: 1 }, { id: 'rh', p: BASES[2].p, c: [[1, 0], [3, 0]], yes: 1 }, { id: 'rh', p: BASES[2].p, c: D_MID, yes: 0 },
    { id: 'pa', p: [[1, 7], [3, 3], [10, 3], [8, 7]], c: D_DIAG, yes: 0 }, { id: 'pa', p: [[1, 7], [3, 3], [10, 3], [8, 7]], c: [[1, 0], [3, 0]], yes: 0 },
    { id: 'ti', p: [[5, 0.5], [8, 9.5], [2, 9.5]], c: D_VM, yes: 1 }, { id: 'ti', p: [[5, 0.5], [8, 9.5], [2, 9.5]], c: [[1, 0], [2, 0.5]], yes: 0 },
    { id: 'tt', p: [[2, 1], [2, 9], [7, 9]], c: [[1, 0], [2, 0.5]], yes: 0 },
    { id: 'hs', p: BASES[4].p, c: [[1, 0], [3, 0.5]], yes: 1 }, { id: 'hs', p: BASES[4].p, c: D_DIAG, yes: 0 },
    { id: 'hx', p: HX6, c: [[0, 0], [3, 0]], yes: 1 }, { id: 'hx', p: HX6, c: [[0, 0.5], [3, 0.5]], yes: 1 }, { id: 'hx', p: HX6, c: [[0, 0], [2, 0]], yes: 0 },
    { id: 'ki', p: [[5, 1], [8, 4], [5, 9], [2, 4]], c: D_DIAG, yes: 1 }, { id: 'ki', p: [[5, 1], [8, 4], [5, 9], [2, 4]], c: [[1, 0], [3, 0]], yes: 0 },
    { id: 'tz', p: [[3, 2], [7, 2], [9, 8], [1, 8]], c: D_MID, yes: 1 }, { id: 'tz', p: [[3, 2], [7, 2], [9, 8], [1, 8]], c: [[1, 0.5], [3, 0.5]], yes: 0 }
  ];
  function cutBuildFold(r, K) {
    var t = r(), ang = K.ri(r, 0, 7) * 45, cs = K.sample(r, COL, 2), b, ci0, g, items, ans;
    if (t < 0.36) { // cutting
      b = K.pick(r, BASES.slice(0, 5)); ci0 = K.ri(r, 0, b.c.length - 1); g = cutGeo(b, b.c[ci0], ang);
      var idx = [ci0].concat(K.sample(r, b.c.map(function (c, i) { return i; }).filter(function (i) { return i !== ci0; }), 2));
      items = K.shuffle(r, idx);
      items.forEach(function (i, k) { if (i === ci0) ans = ABC[k]; });
      return K.q(r, {
        text: 'גּוֹזְרִים עַל הַקַּו. מָה מְקַבְּלִים?', svg: seamPic(g, cs[0], 300, 170, 14), answer: ans, options: ABC.slice(0, 3), keep: true,
        optHtml: picOpts(items, function (i) { return piecesPic(cutGeo(b, b.c[i], ang), 1.1, [cs[0], cs[0]], 100, 76, 6); }),
        tip: 'גּוֹזְרִים, וְסוֹפְרִים צְלָעוֹת בְּכָל חֵלֶק.',
        ex: [{ say: 'מַרְחִיקִים אֶת הַחֲלָקִים וְסוֹפְרִים צְלָעוֹת בְּכָל חֵלֶק.', svg: piecesPic(g, 1.3, cs, 300, 170, 14, true) }, { say: 'מְקַבְּלִים ' + sigName(sig(b, b.c[ci0])) + '.' }],
        key: 'cc' + b.id + ci0 + '.' + ang + cs[0] + items.join('')
      });
    }
    if (t < 0.64) { // building
      b = K.pick(r, BASES); ci0 = K.ri(r, 0, b.c.length - 1); g = cutGeo(b, b.c[ci0], ang);
      var s0 = sig(b, b.c[ci0]), pool = [];
      BASES.forEach(function (o) { if (o !== b) o.c.forEach(function (c, i) { if (sig(o, c) !== s0) pool.push({ b: o, i: i }); }); });
      var d1 = K.pick(r, pool), d2 = K.pick(r, pool.filter(function (x) { return x.b !== d1.b; }));
      items = K.shuffle(r, [{ b: b, i: ci0 }, d1, d2]);
      items.forEach(function (it, k) { if (it.b === b) ans = ABC[k]; });
      return K.q(r, {
        text: 'מָה אֶפְשָׁר לִבְנוֹת מֵהֶם?', svg: piecesPic(g, 1.8, cs, 300, 170, 16), answer: ans, options: ABC.slice(0, 3), keep: true,
        optHtml: picOpts(items, function (it) { return seamPic(cutGeo(it.b, it.b.c[it.i], it.b === b ? ang : K.ri(r, 0, 3) * 90), '#fff', 100, 76, 7); }),
        tip: 'מְקָרְבִים אֶת הַחֲלָקִים זֶה לָזֶה, בְּלִי לְסוֹבֵב.',
        ex: [{ say: 'מְקָרְבִים אֶת הַחֲלָקִים זֶה לָזֶה.', svg: piecesPic(g, 0.4, cs, 300, 170, 16) }, { say: 'מְקַבְּלִים ' + b.nm + '.', svg: seamPic(g, cs[0], 300, 170, 14) }],
        key: 'cb' + b.id + ci0 + '.' + ang + cs.join('') + items.map(function (it) { return it.b.id + it.i; }).join('')
      });
    }
    var f = K.pick(r, FOLDS), fi = FOLDS.indexOf(f); // folding
    g = cutGeo({ p: f.p }, f.c, ang);
    var both = fitMany([g.parts[0], g.parts[1], [g.A, g.B], mirror(g.parts[0], g.A, g.B), g.p], 20, 14, 260, 142);
    function foldLine(col) { return ln(both[2][0][0], both[2][0][1], both[2][1][0], both[2][1][1], col, 3.5, '9 7'); }
    return K.tf(r, {
      text: 'מְקַפְּלִים עַל הַקַּו. הַחֲלָקִים מְכַסִּים זֶה אֶת זֶה?', svg: S(300, 170, pg(both[4], cs[0], 4) + foldLine(RED)),
      tip: 'מְקַפְּלִים בָּרֹאשׁ: חֵלֶק אֶחָד עוֹלֶה עַל הַחֵלֶק הַשֵּׁנִי.',
      ex: [{ say: 'מְקַפְּלִים חֵלֶק אֶחָד עַל הַחֵלֶק הַשֵּׁנִי.', svg: S(300, 170, pg(both[0], cs[0], 3) + pg(both[1], cs[1], 3) + foldLine(RED)) },
        { say: f.yes ? 'הַחֲלָקִים מְכַסִּים בְּדִיּוּק.' : 'חֵלֶק אֶחָד בּוֹלֵט הַחוּצָה. הֵם לֹא מְכַסִּים.', svg: S(300, 170, pg(both[1], cs[1], 3) + pg(both[3], cs[0], 3, ' fill-opacity="0.6"') + foldLine(RED)) }],
      key: 'cf' + fi + '.' + ang + cs.join('')
    }, !!f.yes);
  }

  // ---------- length: drawing helpers ----------
  function pencil(x, y, len, th, col) { // lying down, from x to x + len
    var tip = Math.min(th * 1.1, len * 0.4);
    return rc(x, y, len - tip, th, col, 2, 2) + pg([[x + len - tip, y], [x + len, y + th / 2], [x + len - tip, y + th]], '#ffe2b8', 2);
  }
  function pencilUp(x, y, len, th, col) { return '<g transform="translate(' + x + ',' + y + ') rotate(-90)">' + pencil(0, -th / 2, len, th, col) + '</g>'; }
  function thing(kind, x, y, len, th, col) { return kind ? rc(x, y, len, th, col, 3, 2) : pencil(x, y, len, th, col); }
  function chipBar(col) { return S(90, 70, pencil(14, 24, 62, 22, col)); }
  function chipLine(col) { return S(90, 70, ln(16, 35, 74, 35, col, 12)); }
  function startLine(x, y1, y2) { return ln(x, y1, x, y2, RED, 2.5, '6 5'); }
  function ruler(x0, y, u, max, m) {
    var o = rc(x0 - (m || 10), y, max * u + 2 * (m || 10), 30, '#ffe9a6', 3, 2), i, fs = u >= 24 ? 12 : 10;
    for (i = 0; i <= max; i++) o += ln(x0 + i * u, y, x0 + i * u, y + 8, INK, 1.5) + tx(x0 + i * u, y + 11 + fs, i, fs);
    return o;
  }
  function hops(x0, y, u, a, b) {
    var o = '', i;
    for (i = a; i < b; i++) o += '<path d="M' + n1(x0 + i * u) + ',' + y + ' Q' + n1(x0 + (i + 0.5) * u) + ',' + (y - 22) + ' ' + n1(x0 + (i + 1) * u) + ',' + y + '" fill="none" stroke="' + RED + '" stroke-width="2"/>' + tx(x0 + (i + 0.5) * u, y - 15, i - a + 1, 10, RED);
    return o;
  }
  function cm(n) { return n + ' ס״מ'; }
  function cubes(x, y, u, k, col, step, num, wobble) {
    var o = '', i;
    for (i = 0; i < k; i++) o += rc(x + i * (step || u), y + (wobble && i % 2 ? 5 : 0), u, u, col, 3, 2) + (num ? tx(x + i * (step || u) + u / 2, y + u / 2 + 5, i + 1, 13, '#fff') : '');
    return o;
  }

  // ---------- 2.1 long and short ----------
  var DIM = {
    tall: ['גָּבוֹהַּ', 'נָמוּךְ', 'גָּבוֹהַּ: מַגִּיעַ הֲכִי לְמַעְלָה.', 'נָמוּךְ: קָרוֹב לָרִצְפָּה.'],
    long: ['אָרֹךְ', 'קָצָר', 'אָרֹךְ: מִקָּצֶה לְקָצֶה יֵשׁ הַרְבֵּה.', 'קָצָר: מִקָּצֶה לְקָצֶה יֵשׁ מְעַט.'],
    heavy: ['כָּבֵד', 'קַל', 'כָּבֵד: קָשֶׁה לְהָרִים אוֹתוֹ.', 'קַל: קַל לְהָרִים אוֹתוֹ.'],
    fast: ['מָהִיר', 'אִטִּי', 'מָהִיר: מַגִּיעַ רִאשׁוֹן.', 'אִטִּי: מַגִּיעַ אַחֲרוֹן.'],
    big: ['גָּדוֹל', 'קָטָן', 'גָּדוֹל: תּוֹפֵס הַרְבֵּה מָקוֹם.', 'קָטָן: תּוֹפֵס מְעַט מָקוֹם.'],
    thick: ['עָבֶה', 'דַּק', 'עָבֶה: יֵשׁ בּוֹ הַרְבֵּה דַּפִּים.', 'דַּק: רַק דַּף אֶחָד.']
  };
  var WP = [ // [the greater one, the other one, in what, who / what]
    ['🦒', '🐶', 'tall', 'מִי'], ['🐘', '🐹', 'tall', 'מִי'], ['🌳', '🌸', 'tall', 'מָה'], ['🏠', '🌻', 'tall', 'מָה'], ['🦒', '🐢', 'tall', 'מִי'],
    ['🚂', '🚗', 'long', 'מָה'], ['🐍', '🐛', 'long', 'מִי'], ['🧹', '✏️', 'long', 'מָה'], ['🥒', '🍓', 'long', 'מָה'], ['🚌', '🛴', 'long', 'מָה'],
    ['🐘', '🐱', 'heavy', 'מִי'], ['🍉', '🍒', 'heavy', 'מָה'], ['🐘', '🐜', 'heavy', 'מִי'], ['🐳', '🐱', 'heavy', 'מִי'], ['🚗', '🎈', 'heavy', 'מָה'],
    ['🐰', '🐢', 'fast', 'מִי'], ['🐎', '🐌', 'fast', 'מִי'], ['✈️', '🚲', 'fast', 'מָה'], ['🚗', '🐌', 'fast', 'מִי'], ['🚀', '🚲', 'fast', 'מָה'],
    ['🐳', '🐠', 'big', 'מִי'], ['🐄', '🐜', 'big', 'מִי'], ['🦁', '🐞', 'big', 'מִי'], ['🐘', '🐞', 'big', 'מִי'], ['📕', '📄', 'thick', 'מָה']
  ];
  function em(e) { return '<span class="em">' + e + '</span>'; }
  function wordPair(r, K) {
    var w = K.pick(r, WP), hi = r() < 0.5, d = DIM[w[2]], ans = hi ? w[0] : w[1], oh = {};
    oh[w[0]] = em(w[0]); oh[w[1]] = em(w[1]);
    return K.q(r, { text: w[3] + ' ' + d[hi ? 0 : 1] + ' יוֹתֵר?', answer: ans, options: [w[0], w[1]], optHtml: oh, tip: d[hi ? 2 : 3], ex: [{ say: d[hi ? 2 : 3], big: ans }] });
  }
  function longShort(r, K) {
    if (r() < 0.4) return wordPair(r, K);
    var mode = K.ri(r, 0, 2), u = mode === 2 ? 15 : 24, lo0 = mode === 2 ? 4 : 3, a, b, cs = K.sample(r, COL, 2), askLong = r() < 0.5, top = r() < 0.5, body;
    do { a = K.ri(r, lo0, 10); b = K.ri(r, lo0, 10); } while (Math.abs(a - b) < (mode === 2 ? 2 : 1));
    if (mode === 2) body = pencil(20, 118, a * u, 18, cs[0]) + pencilUp(250, 165, b * u, 18, cs[1]);
    else {
      var sh = mode === 1 ? Math.abs(a - b) * u + K.ri(r, 12, 22) : 0;
      body = pencil(20 + (a < b ? sh : 0), top ? 45 : 105, a * u, 18, cs[0]) + pencil(20 + (b < a ? sh : 0), top ? 105 : 45, b * u, 18, cs[1]);
    }
    var lined = S(300, 170, startLine(20, 25, 145) + pencil(20, top ? 45 : 105, a * 24, 18, cs[0]) + pencil(20, top ? 105 : 45, b * 24, 18, cs[1]));
    return K.q(r, {
      text: askLong ? 'מָה אָרֹךְ יוֹתֵר?' : 'מָה קָצָר יוֹתֵר?', svg: S(300, 170, body), answer: (a > b) === askLong ? 'a' : 'b', options: ['a', 'b'], keep: true,
      optHtml: { a: chipBar(cs[0]), b: chipBar(cs[1]) }, tip: 'מַתְחִילִים מֵאוֹתוֹ קַו.',
      ex: [{ say: 'מַתְחִילִים מֵאוֹתוֹ קַו.', svg: lined }, { say: (mode ? 'הָעִפָּרוֹן זָז, וְהָאֹרֶךְ לֹא הִשְׁתַּנָּה. ' : '') + 'זֶה שֶׁבּוֹלֵט אָרֹךְ יוֹתֵר.' }],
      key: 'ls' + mode + '.' + a + '.' + b + top + askLong + cs.join('')
    });
  }

  // ---------- 2.2 putting in order, comparing with a strip ----------
  var SETS = [[3, 5, 8], [2, 6, 9], [4, 5, 7], [1, 4, 10], [6, 7, 9], [2, 3, 5], [5, 8, 10], [3, 4, 9], [2, 4, 6, 8], [1, 3, 5, 7], [4, 6, 7, 10], [2, 5, 6, 9], [3, 6, 8, 9], [1, 2, 4, 8], [3, 4, 5, 6], [2, 4, 5, 7, 9], [1, 3, 6, 8, 10], [4, 5, 6, 7, 8], [2, 3, 7, 9, 10], [1, 5, 6, 7, 9]];
  function stripsPic(lens, labels, cols, offs, line) {
    var n = lens.length, rh = Math.min(30, 150 / n), o = line ? startLine(34, 6, 164) : '';
    lens.forEach(function (l, i) { var y = 10 + i * rh + (150 - n * rh) / 2; o += tx(14, y + rh / 2 + 3, labels[i], 16) + rc(34 + (offs ? offs[i] : 0), y, l * 25, rh - 9, cols[i], 4, 2); });
    return S(300, 170, o);
  }
  function orderStrips(r, K) {
    var t = r();
    if (t < 0.3) return strip(r, K);
    var lens = K.shuffle(r, K.pick(r, SETS)), n = lens.length, cols = lens.map(function (l, i) { return COL[(i + lens[0]) % 5]; }), messy = r() < 0.5, asc = r() < 0.5;
    var offs = lens.map(function (l) { return messy ? K.ri(r, 0, Math.floor((10 - l) * 25 / 2)) * 2 : 0; }), labels = lens.map(function (l, i) { return i + 1; });
    var sorted = labels.slice().sort(function (x, y) { return lens[x - 1] - lens[y - 1]; }), ex1 = { say: 'מַתְחִילִים מֵאוֹתוֹ קַו וְרוֹאִים מַדְרֵגוֹת.', svg: stripsPic(sorted.map(function (l) { return lens[l - 1]; }), sorted, sorted.map(function (l) { return cols[l - 1]; }), null, true) };
    var id = lens.join('.') + '|' + offs.join('.') + asc;
    if (t < 0.55) {
      return K.q(r, {
        text: asc ? 'מָה הֲכִי קָצָר?' : 'מָה הֲכִי אָרֹךְ?', svg: stripsPic(lens, labels, cols, offs), answer: asc ? sorted[0] : sorted[n - 1], options: n > 4 ? labels.filter(function (l) { return l !== sorted[2]; }) : labels, keep: true,
        tip: 'מַתְחִילִים מֵאוֹתוֹ קַו.', ex: [ex1, { say: asc ? 'הָרִאשׁוֹן בַּמַּדְרֵגוֹת הוּא הֲכִי קָצָר.' : 'הָאַחֲרוֹן בַּמַּדְרֵגוֹת הוּא הֲכִי אָרֹךְ.' }], key: 'oc' + id
      });
    }
    var ord = asc ? sorted : sorted.slice().reverse();
    return K.q(r, {
      fmt: 'order', text: asc ? 'מֵהַקָּצָר לָאָרֹךְ' : 'מֵהָאָרֹךְ לַקָּצָר', svg: stripsPic(lens, labels, cols, offs), parts: labels.map(String), sep: ' ', answer: ord.join(' '),
      tip: 'מַתְחִילִים מֵאוֹתוֹ קַו.', ex: [ex1, { say: asc ? 'עוֹלִים בַּמַּדְרֵגוֹת: מֵהַקָּצָר לָאָרֹךְ.' : 'יוֹרְדִים בַּמַּדְרֵגוֹת: מֵהָאָרֹךְ לַקָּצָר.' }], key: 'oo' + id
    });
  }
  function strip(r, K) { // two things that cannot be put side by side, and one strip
    var m = K.ri(r, 4, 7), both = r() < 0.3, hi = m + (both ? 3 : K.ri(r, 1, 3)), lo = both ? m + 1 : m - K.ri(r, 1, 3), aLong = r() < 0.5, a = aLong ? hi : lo, b = aLong ? lo : hi, u = 13;
    var cs = K.sample(r, [COL[0], COL[1], COL[2], COL[4]], 2), askLong = r() < 0.5;
    function st(x, y, len, up) { return up ? rc(x, y - len, 10, len, '#ffb300', 2, 2) : rc(x, y, len, 10, '#ffb300', 2, 2); }
    var pic = rc(45, 160 - a * u, 20, a * u, cs[0], 3, 2) + st(72, 160, m * u, true) + rc(130, 50, b * u, 20, cs[1], 3, 2) + st(130, 78, m * u);
    var lined = startLine(30, 20, 150) + rc(30, 30, a * 20, 20, cs[0], 3, 2) + st(30, 75, m * 20) + rc(30, 110, b * 20, 20, cs[1], 3, 2);
    return K.q(r, {
      text: askLong ? 'מָה אָרֹךְ יוֹתֵר?' : 'מָה קָצָר יוֹתֵר?', svg: S(300, 170, pic), answer: (a > b) === askLong ? 'a' : 'b', options: ['a', 'b'], keep: true,
      optHtml: { a: S(90, 70, rc(14, 22, 62, 26, cs[0], 3, 2)), b: S(90, 70, rc(14, 22, 62, 26, cs[1], 3, 2)) },
      tip: 'הָרְצוּעָה הַצְּהֻבָּה עוֹזֶרֶת לְהַשְׁווֹת.',
      ex: [{ say: 'שָׂמִים אֶת הָרְצוּעָה לְיַד כָּל אֶחָד.', svg: S(300, 170, pic) }, { say: both ? 'שְׁנֵיהֶם אֲרֻכִּים מֵהָרְצוּעָה, אֲבָל אֶחָד בּוֹלֵט יוֹתֵר.' : 'אֶחָד אָרֹךְ מֵהָרְצוּעָה, וְאֶחָד קָצָר מֵהָרְצוּעָה.', svg: S(300, 170, lined) }],
      key: 'st' + m + '.' + a + '.' + b + askLong + cs.join('')
    });
  }

  // ---------- 2.3 measuring with cubes ----------
  function cubesHouse(r, K) {
    var t = r(), cs = K.sample(r, COL, 2), n, u = 24, x0 = 20;
    if (t < 0.4) {
      n = K.ri(r, 2, 10);
      var kind = K.ri(r, 0, 1);
      return K.q(r, {
        text: 'כַּמָּה קֻבִּיּוֹת?', svg: S(300, 120, thing(kind, x0, 30, n * u, 18, cs[0]) + cubes(x0, 62, u, n, cs[1])), answer: n, options: near3(n, 2, 11), keep: true,
        tip: 'סוֹפְרִים קֻבִּיָּה אַחַר קֻבִּיָּה.', ex: [{ say: 'סוֹפְרִים קֻבִּיָּה אַחַר קֻבִּיָּה.', svg: S(300, 120, thing(kind, x0, 30, n * u, 18, cs[0]) + cubes(x0, 62, u, n, cs[1], 0, true)) }, { say: 'הָאֹרֶךְ: ' + n + ' קֻבִּיּוֹת.' }],
        key: 'cu' + n + kind + cs.join('')
      });
    }
    if (t < 0.75) {
      n = K.ri(r, 4, 9);
      var st = r() < 0.5 ? 0 : K.ri(r, 1, 3), row, why;
      if (st === 0) row = cubes(x0, 62, u, n, cs[1]);
      else if (st === 1) { row = cubes(x0, 62, u, n - 1, cs[1], u + u / (n - 2)); why = 'יֵשׁ רְוָחִים בֵּין הַקֻּבִּיּוֹת.'; }
      else if (st === 2) { row = cubes(x0, 62, u, n + 2, cs[1], (n - 1) * u / (n + 1), false, true); why = 'הַקֻּבִּיּוֹת עוֹלוֹת זוֹ עַל זוֹ.'; }
      else { row = cubes(x0 + u * 0.6, 62, u, n - 1, cs[1]); why = 'הַקֻּבִּיּוֹת לֹא מַתְחִילוֹת בַּקָּצֶה.'; }
      var good = { say: (st ? 'הַיְּחִידוֹת צְמוּדוֹת, בְּלִי רְוָחִים: ' : 'צְמוּדוֹת, מִקָּצֶה לְקָצֶה: ') + n + ' קֻבִּיּוֹת.', svg: S(300, 120, pencil(x0, 30, n * u, 18, cs[0]) + cubes(x0, 62, u, n, cs[1], 0, true)) };
      return K.tf(r, {
        text: 'מָדְדוּ נָכוֹן?', svg: S(300, 120, pencil(x0, 30, n * u, 18, cs[0]) + row), tip: 'הַיְּחִידוֹת צְמוּדוֹת, בְּלִי רְוָחִים, מִקָּצֶה לְקָצֶה.',
        ex: st ? [{ say: why, svg: S(300, 120, pencil(x0, 30, n * u, 18, cs[0]) + row) }, good] : [good], key: 'cm' + n + st + cs.join('')
      }, st === 0);
    }
    var big = K.ri(r, 2, 3), k = K.ri(r, 2, big === 2 ? 7 : 5), L = k * big, more = r() < 0.5, su = 16; // the same pencil, two units
    var pic = S(300, 150, pencil(x0, 12, L * su, 16, COL[3]) + cubes(x0, 40, big * su, k, cs[0]) + cubes(x0, 100, su, L, cs[1]));
    return K.q(r, {
      text: more ? 'מֵאֵיזוֹ קֻבִּיָּה צָרִיךְ יוֹתֵר?' : 'מֵאֵיזוֹ קֻבִּיָּה צָרִיךְ פָּחוֹת?', svg: pic, answer: more ? 'b' : 'a', options: ['a', 'b'], keep: true,
      optHtml: { a: S(90, 70, rc(21, 11, 48, 48, cs[0], 4, 2.5)), b: S(90, 70, rc(35, 25, 20, 20, cs[1], 3, 2.5)) },
      tip: 'סוֹפְרִים בְּכָל שׁוּרָה.',
      ex: [{ say: k + ' קֻבִּיּוֹת גְּדוֹלוֹת אוֹ ' + L + ' קֻבִּיּוֹת קְטַנּוֹת.', svg: pic }, { say: more ? 'הַקֻּבִּיָּה קְטַנָּה יוֹתֵר, אָז צָרִיךְ יוֹתֵר.' : 'הַקֻּבִּיָּה גְּדוֹלָה יוֹתֵר, אָז צָרִיךְ פָּחוֹת.' }],
      key: 'cw' + big + '.' + k + more + cs.join('')
    });
  }

  // ---------- 2.4 the ruler and the centimetre ----------
  function rulerPic(u, max, kind, a, b, col, extra) { return S(300, 150, (extra || '') + thing(kind, 15 + a * u, 72, (b - a) * u, 18, col) + ruler(15, 95, u, max)); }
  function rulerHouse(r, K) {
    var kind = K.ri(r, 0, 1), col = K.pick(r, COL), n;
    if (r() < 0.62) {
      var max = r() < 0.5 ? 10 : 15, u = max === 10 ? 27 : 18;
      n = K.ri(r, 1, max);
      return K.q(r, {
        text: 'מָה הָאֹרֶךְ?', svg: rulerPic(u, max, kind, 0, n, col), answer: cm(n), options: near3(n, 1, max + 1).map(cm), keep: true,
        tip: 'מַתְחִילִים בְּ-0 וְקוֹרְאִים אֶת הַמִּסְפָּר בַּקָּצֶה.',
        ex: [{ say: 'סוֹפְרִים אֶת הַקְּפִיצוֹת, לֹא אֶת הַקַּוִּים.', svg: rulerPic(u, max, kind, 0, n, col, hops(15, 68, u, 0, n)) }, { say: n === 1 ? 'קְפִיצָה אַחַת: 1 ס״מ.' : n + ' קְפִיצוֹת: ' + n + ' ס״מ.' }],
        key: 'ru' + max + '.' + n + kind + col
      });
    }
    n = K.ri(r, 3, 6);
    var rows = K.shuffle(r, [0, 1, -0.4]), pic = '', ans;
    rows.forEach(function (s, i) {
      var y = 8 + i * 56;
      if (s === 0) ans = i + 1;
      pic += tx(9, y + 30, i + 1, 16) + thing(kind, 36 + s * 30, y, n * 30, 13, col) + ruler(36, y + 15, 30, 8, 15);
    });
    return K.q(r, {
      text: 'אֵיפֹה מָדְדוּ נָכוֹן?', svg: S(300, 170, pic), answer: ans, options: [1, 2, 3], keep: true, tip: 'מוֹדְדִים מֵהָאֶפֶס.',
      ex: [{ say: 'מוֹדְדִים מֵהָאֶפֶס, קָצֶה לְקָצֶה.', svg: S(300, 150, thing(kind, 36, 72, n * 30, 18, col) + ruler(36, 95, 30, 8, 15) + ci(36, 114, 10, 'none', RED, 3)) }, { say: 'הָאֹרֶךְ: ' + n + ' ס״מ.' }],
      key: 'rw' + n + kind + col + rows.join('')
    });
  }

  // ---------- 2.5 clever measuring ----------
  var SPANS = [[1, 4], [1, 7], [2, 5], [2, 8], [2, 10], [3, 6], [3, 9], [3, 10], [4, 7], [4, 9], [4, 10], [5, 8], [5, 10], [6, 9], [6, 10], [1, 10], [2, 6], [3, 8], [5, 9], [7, 10]];
  function gridPic(pts, marks, labels) {
    var o = '', i, c = 20, x0 = 30, y0 = 15, q = pts.map(function (p) { return [x0 + p[0] * c, y0 + p[1] * c]; });
    o += pg(q, PALE, 0);
    for (i = 0; i <= 12; i++) o += ln(x0 + i * c, y0, x0 + i * c, y0 + 7 * c, '#c9bfe0', 1);
    for (i = 0; i <= 7; i++) o += ln(x0, y0 + i * c, x0 + 12 * c, y0 + i * c, '#c9bfe0', 1);
    o += pg(q, 'none', 3);
    (marks || []).forEach(function (m) { var a = q[m[0]], b = q[(m[0] + 1) % q.length]; o += ln(a[0], a[1], b[0], b[1], m[1], 7); });
    (labels || []).forEach(function (m) { var a = q[m[0]], b = q[(m[0] + 1) % q.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[1] - a[1], dy = a[0] - b[0], d = Math.sqrt(dx * dx + dy * dy); if (inPoly(q, mx + dx / d * 3, my + dy / d * 3)) { dx = -dx; dy = -dy; } o += tx(mx + dx / d * 11, my + dy / d * 11 + 5, m[1], 14); });
    return S(300, 170, o);
  }
  function about(v) { return 'בְּעֵרֶךְ ' + v + ' ס״מ'; }
  function smartHouse(r, K) {
    var t = r(), kind = K.ri(r, 0, 1), col = K.pick(r, COL), n, u = 27;
    if (t < 0.34) { // the thing does not start at 0
      var sp = K.pick(r, SPANS), a = sp[0], b = sp[1], os = [b - a];
      n = b - a;
      [b, a, n + 1, n - 1].forEach(function (v) { if (os.length < 4 && v > 0 && os.indexOf(v) < 0) os.push(v); });
      return K.q(r, {
        text: 'מָה הָאֹרֶךְ?', svg: rulerPic(u, 10, kind, a, b, col), answer: cm(n), options: os.sort(function (x, y) { return x - y; }).map(cm), keep: true,
        tip: 'סוֹפְרִים קְפִיצוֹת מִקָּצֶה לְקָצֶה.',
        ex: [{ say: 'סוֹפְרִים קְפִיצוֹת מֵהַקָּצֶה עַד הַקָּצֶה: ' + n + '.', svg: rulerPic(u, 10, kind, a, b, col, hops(15, 68, u, a, b)) }, { say: 'מְזִיזִים לָאֶפֶס: שׁוּב ' + n + ' ס״מ.', svg: rulerPic(u, 10, kind, 0, n, col, hops(15, 68, u, 0, n)) }],
        key: 'sn' + a + '.' + b + kind + col
      });
    }
    if (t < 0.56) { // about
      n = K.ri(r, 3, 9);
      var over = r() < 0.5, end = n + (over ? 0.22 : -0.22);
      return K.q(r, {
        text: 'מָה הָאֹרֶךְ בְּעֵרֶךְ?', svg: rulerPic(u, 10, kind, 0, end, col), answer: about(n), options: [about(n - 1), about(n), about(n + 1)], keep: true,
        tip: 'מְחַפְּשִׂים אֶת הַמִּסְפָּר הֲכִי קָרוֹב לַקָּצֶה.',
        ex: [{ say: over ? 'הַקָּצֶה קְצָת אַחֲרֵי ' + n + ': קְצָת יוֹתֵר מִ-' + n + '.' : 'הַקָּצֶה קְצָת לִפְנֵי ' + n + ': קְצָת פָּחוֹת מִ-' + n + '.', svg: S(300, 150, thing(kind, 15, 72, end * u, 18, col) + ruler(15, 95, u, 10) + ci(15 + n * u, 114, 10, 'none', RED, 3)) }, { say: 'אָז הָאֹרֶךְ בְּעֵרֶךְ ' + n + ' ס״מ.' }],
        key: 'sa' + n + over + kind + col
      });
    }
    if (t < 0.8) { // sides of a polygon on squared paper
      var w = K.ri(r, 2, 9), h = K.ri(r, 2, 6), x = K.ri(r, 1, 11 - w), y = K.ri(r, 0, 7 - h), cs = K.sample(r, [COL[1], COL[2], COL[4], COL[3]], 2);
      if (r() < 0.4) {
        var sq = r() < 0.5, s = K.ri(r, 2, 6);
        if (sq) { w = s; h = s; x = K.ri(r, 1, 11 - w); y = K.ri(r, 0, 7 - h); } else if (w === h) w = w + 1;
        var rp = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        return K.tf(r, {
          text: 'כָּל הַצְּלָעוֹת שָׁווֹת?', svg: gridPic(rp), tip: 'סוֹפְרִים מִשְׁבָּצוֹת לְאֹרֶךְ כָּל צֶלַע.',
          ex: [{ say: 'סוֹפְרִים מִשְׁבָּצוֹת לְאֹרֶךְ כָּל צֶלַע.', svg: gridPic(rp, null, [[0, w], [1, h], [2, w], [3, h]]) }, { say: sq ? 'בְּכָל צֶלַע ' + w + ' מִשְׁבָּצוֹת. הַצְּלָעוֹת שָׁווֹת.' : w + ' מִשְׁבָּצוֹת וְ-' + h + ' מִשְׁבָּצוֹת. הַצְּלָעוֹת לֹא שָׁווֹת.' }],
          key: 'sq' + w + '.' + h + '.' + x + '.' + y
        }, sq);
      }
      if (w === h) w = w === 9 ? 8 : w + 1;
      x = Math.min(x, 11 - w);
      var w1 = K.ri(r, 1, w - 1), h1 = K.ri(r, 1, h - 1), ell = r() < 0.5 && w > 2 && h > 2;
      var pts = ell ? [[x, y], [x + w, y], [x + w, y + h1], [x + w1, y + h1], [x + w1, y + h], [x, y + h]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      var lens = pts.map(function (p, i) { var q = pts[(i + 1) % pts.length]; return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]); }), i1, i2, guard = 0;
      do { i1 = K.ri(r, 0, pts.length - 1); i2 = K.ri(r, 0, pts.length - 1); guard++; } while (lens[i1] === lens[i2] && guard < 60);
      if (lens[i1] === lens[i2]) { i1 = 0; i2 = pts.length - 1; }
      var askLong = r() < 0.5;
      return K.q(r, {
        text: askLong ? 'אֵיזוֹ צֶלַע אֲרֻכָּה יוֹתֵר?' : 'אֵיזוֹ צֶלַע קְצָרָה יוֹתֵר?', svg: gridPic(pts, [[i1, cs[0]], [i2, cs[1]]]), answer: (lens[i1] > lens[i2]) === askLong ? 'a' : 'b', options: ['a', 'b'], keep: true,
        optHtml: { a: chipLine(cs[0]), b: chipLine(cs[1]) }, tip: 'סוֹפְרִים מִשְׁבָּצוֹת לְאֹרֶךְ כָּל צֶלַע.',
        ex: [{ say: 'סוֹפְרִים מִשְׁבָּצוֹת לְאֹרֶךְ כָּל צֶלַע.', svg: gridPic(pts, [[i1, cs[0]], [i2, cs[1]]], [[i1, lens[i1]], [i2, lens[i2]]]) }, { say: lens[i1] + ' מִשְׁבָּצוֹת וְ-' + lens[i2] + ' מִשְׁבָּצוֹת.' }],
        key: 'sg' + P(pts) + i1 + i2 + askLong
      });
    }
    var base = K.pick(r, [5, 10, 15]), len = base + K.ri(r, -1, 1), eu = 17; // estimating next to a ruler of 10
    var ref = rc(15, 20, 10 * eu, 24, '#ffe9a6', 3, 2) + tx(15 + 5 * eu, 38, 10, 15);
    return K.q(r, {
      text: 'מָה הָאֹרֶךְ בְּעֵרֶךְ?', svg: S(300, 110, ref + thing(kind, 15, 62, len * eu, 20, col)), answer: cm(base), options: [cm(5), cm(10), cm(15)], keep: true,
      tip: 'הַסַּרְגֵּל הַצָּהֹב: 10 ס״מ.',
      ex: [{ say: 'שָׂמִים לְיַד סַרְגֵּל עִם מִסְפָּרִים.', svg: S(300, 150, thing(kind, 15, 72, len * eu, 18, col) + ruler(15, 95, eu, 16)) }, { say: 'הָאֹרֶךְ בְּעֵרֶךְ ' + base + ' ס״מ.' }],
      key: 'se' + len + kind + col
    });
  }

  // ---------- the clock ----------
  function hand(cx, cy, len, hour, col, w) { var a = (hour % 12) * PI / 6 - PI / 2; return ln(cx, cy, cx + len * Math.cos(a), cy + len * Math.sin(a), col, w); }
  function clock(cx, cy, R, h, o) {
    o = o || {};
    var out = ci(cx, cy, R, '#fff', INK, Math.max(2, R * 0.07)), i, fs = Math.max(7, Math.round(R * 0.26));
    for (i = 1; i <= 12; i++) { var a = i * PI / 6 - PI / 2; out += tx(cx + R * 0.78 * Math.cos(a), cy + R * 0.78 * Math.sin(a) + fs * 0.36, i, fs); }
    if (o.ring) { var b = o.ring * PI / 6 - PI / 2; out += ci(cx + R * 0.78 * Math.cos(b), cy + R * 0.78 * Math.sin(b), R * 0.19, 'none', RED, Math.max(2, R * 0.05)); }
    if (o.empty) return out + tx(cx, cy + R * 0.22, '?', Math.round(R * 0.7), COL[1]);
    out += hand(cx, cy, R * 0.62, o.swap ? h : 12, INK, Math.max(1.5, R * 0.05));
    out += hand(cx, cy, R * 0.38, o.swap ? 12 : h, o.col || COL[1], Math.max(3, R * 0.11));
    return out + ci(cx, cy, Math.max(2, R * 0.06), INK, INK, 0);
  }
  function sun(x, y, q) { var o = '', i; for (i = 0; i < 8; i++) { var a = i * PI / 4; o += ln(x + q * 1.25 * Math.cos(a), y + q * 1.25 * Math.sin(a), x + q * 1.75 * Math.cos(a), y + q * 1.75 * Math.sin(a), '#ffb300', 3); } return o + ci(x, y, q, '#ffb300', INK, 2); }
  function moon(x, y, q) { return '<path d="M' + n1(x + q * 0.4) + ',' + n1(y - q) + ' A' + q + ',' + q + ' 0 1 0 ' + n1(x + q * 0.4) + ',' + n1(y + q) + ' A' + n1(q * 1.3) + ',' + n1(q * 1.3) + ' 0 0 1 ' + n1(x + q * 0.4) + ',' + n1(y - q) + ' Z" fill="#8e5cff" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>'; }
  function sky(h24, x, y, q) { return h24 >= 18 || h24 < 6 ? moon(x, y, q) : sun(x, y, q); }
  function clockOpt(h, o) { return S(80, 80, clock(40, 40, 37, h, o)); }
  function h12(h) { return (h + 11) % 12 + 1; }
  function arrowR(x1, y, x2, col) { return ln(x1, y, x2 - 3, y, col || INK, 3) + pg([[x2 - 9, y - 6], [x2, y], [x2 - 9, y + 6]], col || INK, 0); }
  function arrowL(x1, y, x2, col) { return ln(x1, y, x2 + 3, y, col || INK, 3) + pg([[x2 + 9, y - 6], [x2, y], [x2 + 9, y + 6]], col || INK, 0); }
  function clockRow(hours, back, plain) { // small clocks in a row, with numbered jumps (back: counted from the right)
    var n = hours.length, gap = n > 3 ? 73 : 90, x0 = 150 - (n - 1) * gap / 2, o = '';
    hours.forEach(function (h, i) {
      var mx = x0 + i * gap + gap / 2;
      o += clock(x0 + i * gap, 85, 29, h, { ring: !plain && i === (back ? 0 : n - 1) ? h : 0 });
      if (i < n - 1) o += (back ? arrowL(mx + 12, 40, mx - 12, RED) : arrowR(mx - 12, 40, mx + 12, RED)) + (plain ? '' : tx(mx, 30, back ? n - 1 - i : i + 1, 15, RED));
    });
    return S(300, 150, o);
  }

  // ---------- 3.1 what time is it? ----------
  function whatTime(r, K) {
    var h = K.ri(r, 1, 12), col = K.pick(r, [COL[0], COL[1], COL[2], COL[4]]);
    var ex = [{ say: 'הַמָּחוֹג הַקָּצָר מַרְאֶה אֶת הַשָּׁעָה.', svg: S(300, 170, clock(150, 85, 78, h, { col: col, ring: h })) }, { say: 'הַמָּחוֹג הָאָרֹךְ עַל 12. הַשָּׁעָה ' + h + '.' }];
    if (r() < 0.5) {
      var os = h === 12 ? [11, 12, 1] : r() < 0.5 ? [h, 12, h12(h + 1) === 12 ? h - 1 : h + 1] : [h12(h - 1), h, h12(h + 1)];
      return K.q(r, { text: 'מָה הַשָּׁעָה?', svg: S(300, 170, clock(150, 85, 78, h, { col: col })), answer: h, options: os, tip: 'מִסְתַּכְּלִים עַל הַמָּחוֹג הַקָּצָר.', ex: ex, key: 'wt' + h + col + os.join('.') });
    }
    var swap = h !== 12 && r() < 0.5, items = K.shuffle(r, [{ h: h }, swap ? { h: h, swap: true } : { h: h12(h - 1) }, { h: h12(h + 1) }]), ans;
    items.forEach(function (it, i) { if (it.h === h && !it.swap) ans = ABC[i]; });
    return K.q(r, {
      text: 'אֵיפֹה הַשָּׁעָה ' + h + '?', answer: ans, options: ABC.slice(0, 3), keep: true, optHtml: picOpts(items, function (it) { return clockOpt(it.h, { col: col, swap: it.swap }); }),
      tip: 'הַמָּחוֹג הַקָּצָר מַרְאֶה אֶת הַשָּׁעָה.', ex: ex, key: 'ww' + h + col + items.map(function (it) { return it.h + (it.swap ? 's' : ''); }).join('.')
    });
  }

  // ---------- 3.2 early and late ----------
  var EV = [ // [picture, words, the hour (0-23), hours that do not fit]
    ['⏰', 'קָמִים', 7, [13, 20]], ['🎒', 'הוֹלְכִים לְבֵית הַסֵּפֶר', 8, [14, 19]], ['🥪', 'אֲרוּחַת עֶשֶׂר', 10, [16, 20]], ['🍝', 'אֲרוּחַת צָהֳרַיִם', 13, [9, 20]],
    ['🥣', 'אֲרוּחַת בֹּקֶר', 7, [13, 19]], ['🍳', 'אֲרוּחַת עֶרֶב', 19, [9, 13]], ['🛁', 'מִקְלַחַת לִפְנֵי הַשֵּׁנָה', 19, [10, 13]], ['🛌', 'הוֹלְכִים לִישֹׁן', 20, [10, 14]],
    ['🌅', 'הַשֶּׁמֶשׁ זוֹרַחַת', 6, [13, 20]], ['🌙', 'חֹשֶׁךְ בַּחוּץ', 21, [10, 13]], ['📖', 'הַשִּׁעוּר הָרִאשׁוֹן', 8, [15, 20]], ['🔔', 'סוֹף הַלִּמּוּדִים', 13, [7, 20]],
    ['📚', 'סִפּוּר לִפְנֵי הַשֵּׁנָה', 20, [9, 13]], ['🍎', 'אֲרוּחַת אַרְבַּע', 16, [8, 21]], ['🚲', 'רוֹכְבִים עַל אוֹפַנַּיִם', 17, [21, 22]]
  ];
  function dayPart(h) { return h < 12 ? 'בַּבֹּקֶר' : h < 15 ? 'בַּצָּהֳרַיִם' : h < 18 ? 'אַחַר הַצָּהֳרַיִם' : 'בָּעֶרֶב'; }
  function evClock(h24) { return S(300, 170, clock(130, 85, 76, h12(h24)) + sky(h24, 255, 45, 17)); }
  function earlyLate(r, K) {
    var t = r(), e, i;
    if (t < 0.42) { // does it fit?
      e = K.pick(r, EV);
      var ok = r() < 0.45, h = ok ? e[2] : K.pick(r, e[3]), fitSay = e[1] + ': בְּעֵרֶךְ בְּשָׁעָה ' + h12(e[2]) + ' ' + dayPart(e[2]) + '.';
      return K.tf(r, {
        text: e[1] + ' בְּשָׁעָה ' + h12(h) + ' ' + dayPart(h) + '?', pic: e[0], svg: evClock(h), tip: 'שֶׁמֶשׁ: יוֹם. יָרֵחַ: עֶרֶב.',
        ex: ok ? [{ say: 'כֵּן, זֶה מַתְאִים. ' + fitSay, svg: evClock(h) }] : [{ say: 'זֶה לֹא מַתְאִים.', svg: evClock(h) }, { say: fitSay, svg: evClock(e[2]) }], key: 'ef' + e[0] + h
      }, ok);
    }
    if (t < 0.72) { // the earliest / the latest of three
      var first = r() < 0.5, pool = EV.filter(function (x) { return first ? x[2] < 12 || x[2] >= 18 : x[2] >= 12; }), trio = [], guard = 0;
      while (trio.length < 3 && guard++ < 200) { e = K.pick(r, pool); if (!trio.some(function (x) { return x[2] === e[2] || x[0] === e[0]; })) trio.push(e); }
      var early = r() < 0.5, sorted = trio.slice().sort(function (a, b) { return a[2] - b[2]; }), ans = early ? sorted[0] : sorted[2], oh = {}, row = '';
      trio.forEach(function (x) { oh[x[0]] = em(x[0]) + S(70, 70, clock(30, 38, 28, h12(x[2])) + sky(x[2], 58, 12, 7)); });
      sorted.forEach(function (x, k) { row += clock(55 + k * 95, 95, 34, h12(x[2])) + sky(x[2], 55 + k * 95, 30, 10) + (k < 2 ? arrowR(96 + k * 95, 95, 110 + k * 95, RED) : ''); });
      return K.q(r, {
        text: early ? 'מָה הֲכִי מֻקְדָּם?' : 'מָה הֲכִי מְאֻחָר?', answer: ans[0], options: trio.map(function (x) { return x[0]; }), optHtml: oh,
        tip: 'קֹדֶם הַשֶּׁמֶשׁ, אַחַר כָּךְ הַיָּרֵחַ.',
        ex: [{ say: 'קֹדֶם הַשֶּׁמֶשׁ, אַחַר כָּךְ הַיָּרֵחַ. מְסַדְּרִים לְפִי הַשָּׁעוֹת.', svg: S(300, 150, row) }, { say: early ? 'זֶה הֲכִי מֻקְדָּם: ' + ans[1] + '.' : 'זֶה הֲכִי מְאֻחָר: ' + ans[1] + '.', big: ans[0] }],
        key: 'ee' + early + sorted.map(function (x) { return x[0]; }).join('')
      });
    }
    var n = K.ri(r, 3, 4), hs = K.sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], n), srt = hs.slice().sort(function (a, b) { return a - b; }), gap = n === 3 ? 95 : 73, pic = ''; // clocks in order
    for (i = 0; i < n; i++) pic += clock(150 - (n - 1) * gap / 2 + i * gap, 75, n === 3 ? 40 : 33, hs[i]);
    return K.q(r, {
      fmt: 'order', text: 'מֵהַמֻּקְדָּם לַמְּאֻחָר', svg: S(300, 150, pic), parts: hs.map(String), sep: ' ', answer: srt.join(' '),
      tip: 'קוֹרְאִים כָּל שָׁעוֹן, וּמְסַדְּרִים מֵהַמִּסְפָּר הַקָּטָן לַגָּדוֹל.',
      ex: [{ say: 'קוֹרְאִים אֶת הַשָּׁעָה בְּכָל שָׁעוֹן.', svg: S(300, 150, pic) }, { say: 'מְסַדְּרִים מֵהַמֻּקְדָּם לַמְּאֻחָר.', svg: clockRow(srt, false, true) }], key: 'eo' + hs.join('.')
    });
  }

  // ---------- 3.3 how much time has passed? ----------
  var ACT = [['הַחוּג', 0], ['הַסֶּרֶט', 0], ['הַטִּיּוּל', 0], ['הַמִּשְׂחָק', 0], ['הַשִּׁעוּר', 0], ['הָאִמּוּן', 0], ['הַהַצָּגָה', 1], ['הַמְּסִבָּה', 1], ['הַנְּסִיעָה', 1]];
  var VB = [['הִתְחִיל', 'נִמְשַׁךְ', 'נִגְמַר'], ['הִתְחִילָה', 'נִמְשְׁכָה', 'נִגְמְרָה']];
  function hoursWord(d) { return d === 1 ? 'שָׁעָה אַחַת' : d === 2 ? 'שְׁעָתַיִם' : d + ' שָׁעוֹת'; }
  function jumps(d) { return d === 1 ? 'קְפִיצָה אַחַת' : d + ' קְפִיצוֹת'; }
  function run(s, d) { var o = [], i; for (i = 0; i <= d; i++) o.push(h12(s + i)); return o; }
  function howLong(r, K) {
    var t = r(), act = K.pick(r, ACT), v = VB[act[1]], cross = r() < 0.16, s, d, e, items, ans, col = COL[1];
    if (cross) { s = K.ri(r, 10, 12); d = s === 10 ? 3 : K.ri(r, 2, 3); } else { d = K.ri(r, 1, 3); s = K.ri(r, 1, 12 - d); }
    e = h12(s + d);
    var rowEx = { say: 'בְּכָל שָׁעָה הַמָּחוֹג הַקָּצָר זָז מִסְפָּר אֶחָד.', svg: clockRow(run(s, d)) };
    if (t < 0.4) { // when does it end?
      items = K.shuffle(r, [e, cross ? 12 : s, h12(e + 1) === s || e === 12 ? e - 1 : e + 1]);
      ans = ABC[items.indexOf(e)];
      return K.q(r, {
        text: act[0] + ' ' + v[0] + ' בְּשָׁעָה ' + s + ' וְ' + v[1] + ' ' + hoursWord(d) + '. מָתַי ' + v[2] + '?',
        svg: S(300, 130, clock(65, 65, 55, s, { col: col }) + tx(150, 80, '+' + d, 40, RED) + clock(235, 65, 55, 0, { empty: true })),
        answer: ans, options: ABC.slice(0, 3), keep: true, optHtml: picOpts(items, function (h) { return clockOpt(h, { col: col }); }),
        tip: 'בְּכָל שָׁעָה הַמָּחוֹג הַקָּצָר זָז מִסְפָּר אֶחָד.', ex: [rowEx, { say: jumps(d) + ' מִ-' + s + ': הַשָּׁעָה ' + e + '.' }], key: 'he' + act[0] + s + '.' + d + items.join('.')
      });
    }
    if (t < 0.72) { // how long?
      return K.q(r, {
        text: act[0] + ' ' + v[0] + ' בְּ-' + s + ' וְ' + v[2] + ' בְּ-' + e + '. כַּמָּה שָׁעוֹת?',
        svg: S(300, 130, clock(65, 65, 55, s, { col: col }) + arrowR(128, 65, 172, RED) + tx(150, 50, '?', 30, RED) + clock(235, 65, 55, e, { col: col })),
        answer: d, options: near3(d, 1, 5), keep: true, tip: 'סוֹפְרִים קְפִיצוֹת שֶׁל הַמָּחוֹג הַקָּצָר.',
        ex: [{ say: 'סוֹפְרִים קְפִיצוֹת מִ-' + s + ' עַד ' + e + '.', svg: clockRow(run(s, d)) }, { say: jumps(d) + ': ' + hoursWord(d) + '.' }], key: 'hd' + act[0] + s + '.' + d
      });
    }
    if (d === 3 && !cross) d = 2; // when did it start?
    e = h12(s + d);
    var wrong = [e, h12(e + d), h12(s - 1), h12(s + 1)].filter(function (x, i2, arr) { return x !== s && arr.indexOf(x) === i2; }).slice(0, 2);
    items = K.shuffle(r, [s].concat(wrong));
    ans = ABC[items.indexOf(s)];
    return K.q(r, {
      text: act[0] + ' ' + v[2] + ' בְּשָׁעָה ' + e + ' וְ' + v[1] + ' ' + hoursWord(d) + '. מָתַי ' + v[0] + '?',
      svg: S(300, 130, clock(65, 65, 55, 0, { empty: true }) + tx(150, 80, '+' + d, 40, RED) + clock(235, 65, 55, e, { col: col })),
      answer: ans, options: ABC.slice(0, 3), keep: true, optHtml: picOpts(items, function (h) { return clockOpt(h, { col: col }); }),
      tip: 'הוֹלְכִים אֲחוֹרָה: הַמָּחוֹג הַקָּצָר חוֹזֵר מִסְפָּר אֶחָד בְּכָל שָׁעָה.',
      ex: [{ say: 'הַמָּחוֹג הַקָּצָר זָז אֲחוֹרָה.', svg: clockRow(run(s, d), true) }, { say: jumps(d) + ' אֲחוֹרָה מִ-' + e + ': הַשָּׁעָה ' + s + '.' }], key: 'hs' + act[0] + s + '.' + d + items.join('.')
    });
  }

  // ---------- the map: icons ----------
  function icon(kind, x, y, k) {
    var g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') scale(' + (k || 1) + ')" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round">', o;
    if (kind === 'tree') o = '<rect x="-3" y="2" width="6" height="12" fill="#a0622d"/><circle cx="0" cy="-4" r="11" fill="#3ec46d"/>';
    else if (kind === 'house') o = '<rect x="-10" y="-2" width="20" height="15" fill="#ff5fa2"/><polygon points="-13,-2 0,-14 13,-2" fill="#8e5cff"/><rect x="-3" y="5" width="6" height="8" fill="#fff"/>';
    else if (kind === 'pond') o = '<ellipse cx="0" cy="2" rx="15" ry="10" fill="#3aa0ff"/><path d="M-7,2 q3,-3 6,0 q3,3 6,0" fill="none" stroke="#fff"/>';
    else if (kind === 'flower') o = '<line x1="0" y1="2" x2="0" y2="14" stroke="#3ec46d" stroke-width="3"/><circle cx="0" cy="-10" r="5" fill="#ff5fa2"/><circle cx="7" cy="-4" r="5" fill="#ff5fa2"/><circle cx="-7" cy="-4" r="5" fill="#ff5fa2"/><circle cx="4" cy="3" r="5" fill="#ff5fa2"/><circle cx="-4" cy="3" r="5" fill="#ff5fa2"/><circle cx="0" cy="-3" r="4" fill="#ffb300"/>';
    else if (kind === 'tent') o = '<polygon points="-14,12 0,-13 14,12" fill="#ffb300"/><polygon points="-4,12 0,1 4,12" fill="#3b2a55"/>';
    else if (kind === 'star') o = '<polygon points="' + P(star(5, 13, 5.5).map(function (p) { return [p[0] - 5, p[1] - 5]; })) + '" fill="#ffb300"/>';
    else o = '<polygon points="-6,-9 0,-18 6,-9" fill="#3ec46d"/><circle cx="-11" cy="-1" r="4" fill="#8e5cff"/><circle cx="11" cy="-1" r="4" fill="#8e5cff"/><circle cx="0" cy="0" r="11" fill="#8e5cff"/><circle cx="-4" cy="-2" r="2.4" fill="#fff"/><circle cx="4" cy="-2" r="2.4" fill="#fff"/><path d="M-4,5 q4,3 8,0" fill="none" stroke-width="1.8"/>'; // the troll
    return g + o + '</g>';
  }
  var PLACES = [['tree', 'לָעֵץ', 'מֵהָעֵץ'], ['house', 'לַבַּיִת', 'מֵהַבַּיִת'], ['pond', 'לָאֲגַם', 'מֵהָאֲגַם'], ['flower', 'לַפֶּרַח', 'מֵהַפֶּרַח'], ['tent', 'לָאֹהֶל', 'מֵהָאֹהֶל']];
  function iconOpt(kind) { return S(70, 70, icon(kind, 35, 37, 2)); }
  function land(b) { return rc(2, 2, 296, 166, '#eaf7df', 12, 2) + b; }
  function scatter(r, n) { // a middle point and n places, each clearly farther than the one before
    var t, i, j;
    for (t = 0; t < 400; t++) {
      var cx = 45 + r() * 210, cy = 35 + r() * 100, d = 46 + r() * 12, pts = [], ok = true;
      for (i = 0; i < n; i++) {
        var a = r() * 2 * PI, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (x < 24 || x > 276 || y < 26 || y > 146) ok = false;
        pts.push([x, y, d]); d *= 1.45 + r() * 0.3;
      }
      for (i = 0; i < n; i++) for (j = 0; j < i; j++) if (Math.abs(pts[i][0] - pts[j][0]) + Math.abs(pts[i][1] - pts[j][1]) < 52) ok = false;
      if (ok) return { c: [cx, cy], p: pts };
    }
    return { c: [50, 85], p: [[98, 85, 48], [115, 40, 79], [240, 110, 192]].slice(0, n) };
  }
  function rays(sc) { return sc.p.map(function (p) { return ln(sc.c[0], sc.c[1], p[0], p[1], RED, 2.5, '6 5'); }).join(''); }
  function barsPic(sc, draw) { // the distances laid side by side from one starting line
    var n = sc.p.length, k = Math.min(1, 215 / sc.p[n - 1][2]), o = startLine(40, 10, 160);
    sc.p.forEach(function (p, i) { var y = 85 + (i - (n - 1) / 2) * 50; o += ln(40, y, 40 + p[2] * k, y, RED, 4) + draw(i, 40 + p[2] * k + 16, y); });
    return S(300, 170, o);
  }

  // ---------- 4.1 near and far ----------
  function nearFar(r, K) {
    var n = r() < 0.5 ? 2 : 3, sc = scatter(r, n), near = r() < 0.5, order = K.shuffle(r, sc.p.map(function (p, i) { return i; })), id = n1(sc.c[0]) + '.' + n1(sc.c[1]) + '.' + sc.p.map(function (p) { return Math.round(p[0]); }).join('.') + near;
    if (r() < 0.6) { // what is nearer to the troll?
      var kinds = K.sample(r, PLACES, n).map(function (p) { return p[0]; }), oh = {};
      kinds.forEach(function (k) { oh[k] = iconOpt(k); });
      var body = sc.p.map(function (p, i) { return icon(kinds[i], p[0], p[1], 1.25); }).join('') + icon('troll', sc.c[0], sc.c[1], 1.25);
      return K.q(r, {
        text: n === 2 ? (near ? 'מָה קָרוֹב יוֹתֵר לַטְּרוֹל?' : 'מָה רָחוֹק יוֹתֵר מֵהַטְּרוֹל?') : (near ? 'מָה הֲכִי קָרוֹב לַטְּרוֹל?' : 'מָה הֲכִי רָחוֹק מֵהַטְּרוֹל?'),
        svg: S(300, 170, land(body)), answer: kinds[near ? 0 : n - 1], options: order.map(function (i) { return kinds[i]; }), keep: true, optHtml: oh,
        tip: 'דֶּרֶךְ קְצָרָה: קָרוֹב. דֶּרֶךְ אֲרֻכָּה: רָחוֹק.',
        ex: [{ say: 'מוֹתְחִים קַו מֵהַטְּרוֹל לְכָל מָקוֹם.', svg: S(300, 170, land(rays(sc) + body)) }, { say: near ? 'הַקַּו הֲכִי קָצָר: זֶה הֲכִי קָרוֹב.' : 'הַקַּו הֲכִי אָרֹךְ: זֶה הֲכִי רָחוֹק.', svg: barsPic(sc, function (i, x, y) { return icon(kinds[i], x, y, 1); }) }],
        key: 'nf' + kinds.join('') + id
      });
    }
    n = 3; sc = scatter(r, 3); order = K.shuffle(r, [0, 1, 2]); // where is the treasure?
    var pl = K.pick(r, PLACES), spot = function (i, x, y) { return ci(x, y, 12, '#ffb300', INK, 2) + tx(x, y + 5, order[i] + 1, 15); };
    var map = sc.p.map(function (p, i) { return spot(i, p[0], p[1]); }).join('') + icon(pl[0], sc.c[0], sc.c[1], 1.25);
    return K.q(r, {
      text: 'הַמַּטְמוֹן ' + (near ? 'הֲכִי קָרוֹב ' + pl[1] : 'הֲכִי רָחוֹק ' + pl[2]) + '. אֵיפֹה הוּא?', svg: S(300, 170, land(map)), answer: order[near ? 0 : 2] + 1, options: [1, 2, 3], keep: true,
      tip: 'דֶּרֶךְ קְצָרָה: קָרוֹב. דֶּרֶךְ אֲרֻכָּה: רָחוֹק.',
      ex: [{ say: 'מוֹתְחִים קַו לְכָל מִסְפָּר.', svg: S(300, 170, land(rays(sc) + map)) }, { say: near ? 'הַקַּו הֲכִי קָצָר: זֶה הֲכִי קָרוֹב.' : 'הַקַּו הֲכִי אָרֹךְ: זֶה הֲכִי רָחוֹק.', svg: barsPic(sc, spot) }],
      key: 'nt' + pl[0] + order.join('') + n1(sc.c[0]) + '.' + sc.p.map(function (p) { return Math.round(p[0]); }).join('.') + near
    });
  }

  // ---------- 4.2 a path on the map ----------
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function cc(c) { return [25 + c[0] * 30, 25 + c[1] * 30]; }
  function gridMap(b) {
    var o = rc(10, 10, 150, 150, '#eaf7df', 4, 2), i;
    for (i = 1; i < 5; i++) o += ln(10 + i * 30, 10, 10 + i * 30, 160, '#9fc48b', 1.5) + ln(10, 10 + i * 30, 160, 10 + i * 30, '#9fc48b', 1.5);
    return o + b;
  }
  function arrow(x, y, d, s, col) {
    var base = [[-s, -s * 0.3], [0, -s * 0.3], [0, -s * 0.75], [s, 0], [0, s * 0.75], [0, s * 0.3], [-s, s * 0.3]], c = [1, 0, -1, 0][d], sn = [0, 1, 0, -1][d];
    return pg(base.map(function (p) { return [x + p[0] * c - p[1] * sn, y + p[0] * sn + p[1] * c]; }), col, 1.5);
  }
  function follow(start, ds) { var c = start.slice(), out = [c.slice()], i; for (i = 0; i < ds.length; i++) { c[0] += DIRS[ds[i]][0]; c[1] += DIRS[ds[i]][1]; if (c[0] < 0 || c[0] > 4 || c[1] < 0 || c[1] > 4) return null; out.push(c.slice()); } return out; }
  function walk(r, K, len) { // a path that never steps on the same square twice
    var t, i;
    for (t = 0; t < 300; t++) {
      var start = [K.ri(r, 0, 4), K.ri(r, 0, 4)], ds = [], seen = {}, c = start.slice(), ok = true;
      seen[c.join()] = 1;
      for (i = 0; i < len && ok; i++) {
        var d = K.ri(r, 0, 3), x = c[0] + DIRS[d][0], y = c[1] + DIRS[d][1];
        if (x < 0 || x > 4 || y < 0 || y > 4 || seen[x + ',' + y]) ok = false; else { c = [x, y]; seen[c.join()] = 1; ds.push(d); }
      }
      if (ok) return { start: start, ds: ds, end: c };
    }
    return { start: [0, 4], ds: [0, 0, 3].slice(0, len), end: [2, 3] };
  }
  function trail(cells, col) { return '<polyline points="' + P(cells.map(cc)) + '" fill="none" stroke="' + col + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function arrowsRow(ds, x, y, s, col, nums) { return ds.map(function (d, i) { return arrow(x + i * s * 2.7, y, d, s, col) + (nums ? tx(x + i * s * 2.7, y + s + 13, i + 1, 10) : ''); }).join(''); }
  function pathHouse(r, K) {
    var t = r(), w, i, ans;
    if (t < 0.38) { // where does the troll get to?
      w = walk(r, K, K.ri(r, 3, 6));
      var cand = [], key = function (c) { return c.join(); };
      w.ds.forEach(function (d, k) {
        var drop = follow(w.start, w.ds.filter(function (x, j) { return j !== k; })), a;
        if (drop) cand.push(drop[drop.length - 1]);
        for (a = 0; a < 4; a++) if (a !== d) { var alt = follow(w.start, w.ds.map(function (x, j) { return j === k ? a : x; })); if (alt) cand.push(alt[alt.length - 1]); }
      });
      var seen = {}, wrong = [];
      seen[key(w.end)] = 1; seen[key(w.start)] = 1;
      K.shuffle(r, cand).forEach(function (c) { if (!seen[key(c)] && wrong.length < 2) { seen[key(c)] = 1; wrong.push(c); } });
      for (i = 0; wrong.length < 2 && i < 25; i++) { var c2 = [i % 5, Math.floor(i / 5)]; if (!seen[key(c2)]) { seen[key(c2)] = 1; wrong.push(c2); } }
      var spots = K.shuffle(r, [w.end].concat(wrong)), marks = '';
      spots.forEach(function (c, k) { var p = cc(c); if (c === w.end) ans = k + 1; marks += ci(p[0], p[1], 11, '#ffb300', INK, 2) + tx(p[0], p[1] + 5, k + 1, 14); });
      var st = cc(w.start), panel = arrowsRow(w.ds.slice(0, 3), 192, 55, 13, COL[2], false) + arrowsRow(w.ds.slice(3), 192, 105, 13, COL[2], false);
      return K.q(r, {
        text: 'לְאָן מַגִּיעַ הַטְּרוֹל?', svg: S(300, 170, gridMap(marks + icon('troll', st[0], st[1] + 2, 0.95)) + panel), answer: ans, options: [1, 2, 3], keep: true,
        tip: 'כָּל חֵץ הוּא צַעַד אֶחָד, מִשְׁבֶּצֶת אַחַת.',
        ex: [{ say: 'הוֹלְכִים חֵץ אַחַר חֵץ, מִשְׁבֶּצֶת אַחַת בְּכָל צַעַד.', svg: S(300, 170, gridMap(trail(follow(w.start, w.ds), RED) + marks + icon('troll', st[0], st[1] + 2, 0.95)) + panel) }, { say: 'הַטְּרוֹל מַגִּיעַ לְמִסְפָּר ' + ans + '.' }],
        key: 'pw' + w.start.join('') + w.ds.join('') + spots.map(key).join('|')
      });
    }
    if (t < 0.7) { // which path gets to the treasure?
      w = walk(r, K, K.ri(r, 3, 4));
      var alts = [], used = {};
      used[w.ds.join('')] = 1;
      for (i = 0; i < 80 && alts.length < 2; i++) {
        var k2 = K.ri(r, 0, w.ds.length - 1), nd = K.ri(r, 0, 3), ds2 = w.ds.map(function (x, j) { return j === k2 ? nd : x; });
        if (!used[ds2.join('')] && follow(w.start, ds2)) { used[ds2.join('')] = 1; alts.push(ds2); }
      }
      if (alts.length < 2) return pathHouse(r, K);
      var rows = K.shuffle(r, [w.ds].concat(alts)), s0 = cc(w.start), e0 = cc(w.end), pn = '';
      rows.forEach(function (ds, k) { if (ds === w.ds) ans = k + 1; pn += tx(176, 40 + k * 50, k + 1, 16) + arrowsRow(ds, 200, 34 + k * 50, 9.5, COL[2], false); });
      var base = icon('star', e0[0], e0[1] + 1, 0.95) + icon('troll', s0[0], s0[1] + 2, 0.95);
      return K.q(r, {
        text: 'אֵיזֶה מַסְלוּל מַגִּיעַ לַמַּטְמוֹן?', svg: S(300, 170, gridMap(base) + pn), answer: ans, options: [1, 2, 3], keep: true,
        tip: 'כָּל חֵץ הוּא צַעַד אֶחָד, מִשְׁבֶּצֶת אַחַת.',
        ex: [{ say: 'בּוֹדְקִים כָּל מַסְלוּל, חֵץ אַחַר חֵץ.', svg: S(300, 170, gridMap(trail(follow(w.start, w.ds), RED) + base) + pn) }, { say: 'מַסְלוּל ' + ans + ' מַגִּיעַ לַמַּטְמוֹן.' }],
        key: 'pr' + w.start.join('') + rows.map(function (d) { return d.join(''); }).join('|')
      });
    }
    var r0 = K.ri(r, 0, 4), r1 = K.ri(r, 0, 4), c1 = K.ri(r, 3, 4), away = r1 > r0 ? -1 : r1 < r0 ? 1 : r0 === 0 ? 1 : r0 === 4 ? -1 : (r() < 0.5 ? 1 : -1); // the shorter of two paths
    if (r0 + away < 0) r0 = 1;
    if (r0 + away > 4) r0 = 3;
    var A = [[0, r0]], B = [[0, r0]], rr, x2, cs = K.sample(r, [COL[0], COL[1], COL[2]], 2), askShort = r() < 0.6;
    for (rr = r0; rr !== r1;) { rr += r1 > r0 ? 1 : -1; A.push([0, rr]); }
    for (x2 = 1; x2 <= c1; x2++) A.push([x2, r1]);
    B.push([0, r0 + away]);
    for (x2 = 1; x2 <= c1; x2++) B.push([x2, r0 + away]);
    for (rr = r0 + away; rr !== r1;) { rr += r1 > rr ? 1 : -1; B.push([c1, rr]); }
    var la = A.length - 1, lb = B.length - 1, aFirst = r() < 0.5, hs = cc([0, r0]), he = cc([c1, r1]);
    var pic = gridMap(trail(A, cs[aFirst ? 0 : 1]) + trail(B, cs[aFirst ? 1 : 0]) + icon('house', hs[0], hs[1], 0.8) + icon('star', he[0], he[1] + 1, 0.85));
    function dots(cells) { return cells.slice(1).map(function (c, k) { var p = cc(c); return ci(p[0], p[1], 7, '#fff', INK, 1.5) + tx(p[0], p[1] + 3.5, k + 1, 9); }).join(''); }
    var counted = gridMap(trail(A, cs[aFirst ? 0 : 1]) + trail(B, cs[aFirst ? 1 : 0]) + dots(A) + dots(B)) + ln(190, 60, 235, 60, cs[aFirst ? 0 : 1], 10) + tx(262, 68, la, 24) + ln(190, 110, 235, 110, cs[aFirst ? 1 : 0], 10) + tx(262, 118, lb, 24);
    return K.q(r, {
      text: askShort ? 'אֵיזֶה מַסְלוּל קָצָר יוֹתֵר?' : 'אֵיזֶה מַסְלוּל אָרֹךְ יוֹתֵר?', svg: S(300, 170, pic), answer: askShort === aFirst ? 'a' : 'b', options: ['a', 'b'], keep: true,
      optHtml: { a: chipLine(cs[0]), b: chipLine(cs[1]) }, tip: 'סוֹפְרִים צְעָדִים בְּכָל מַסְלוּל.',
      ex: [{ say: 'סוֹפְרִים צְעָדִים בְּכָל מַסְלוּל.', svg: S(300, 170, counted) }, { say: la + ' צְעָדִים וְ-' + lb + ' צְעָדִים.' }],
      key: 'ps' + r0 + r1 + c1 + away + aFirst + askShort + cs.join('')
    });
  }

  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'geo',
    grade: 1,
    tiles: [{
      id: 'geo1poly', world: 'יַעַר הַמְּצֻלָּעִים', name: 'מְצֻלָּעִים, צְלָעוֹת וְקָדְקוֹדִים', icon: '🔷', bld: 'house1', hero: 'צַלְעִי',
      levels: [
        { name: 'מְצֻלָּע אוֹ לֹא מְצֻלָּע', f: polyOrNot },
        { name: 'מְשֻׁלָּשׁ, מְרֻבָּע, מְחֻמָּשׁ', f: triQuadPent },
        { name: 'צְלָעוֹת וְקָדְקוֹדִים', f: sidesVerts },
        { name: 'שְׁמוֹת הַמְּצֻלָּעִים', f: polyNames },
        { name: 'רִבּוּעַ, מַלְבֵּן וּמְעֻיָּן', f: specialQuads },
        { name: 'גּוֹזְרִים, מַרְכִּיבִים וּמְקַפְּלִים', f: cutBuildFold }
      ]
    }, {
      id: 'geo1len', world: 'שְׁבִיל הַמְּדִידוֹת', name: 'אָרֹךְ, קָצָר וְסַרְגֵּל', icon: '📏', bld: 'houseAlt1', hero: 'סַנְטִי',
      levels: [
        { name: 'אָרֹךְ וְקָצָר', f: longShort },
        { name: 'מְסַדְּרִים וּמַשְׁוִים', f: orderStrips },
        { name: 'מוֹדְדִים בְּקֻבִּיּוֹת', f: cubesHouse },
        { name: 'הַסַּרְגֵּל וְהַסֶּנְטִימֶטֶר', f: rulerHouse },
        { name: 'מְדִידָה חֲכָמָה', f: smartHouse }
      ]
    }, {
      id: 'geo1clock', world: 'מִגְדַּל הַשָּׁעוֹן', name: 'שָׁעוֹן מְחוֹגִים בְּשָׁעוֹת שְׁלֵמוֹת', icon: '🕒', bld: 'tower', hero: 'תִּקְתּוּק',
      levels: [
        { name: 'מָה הַשָּׁעָה?', f: whatTime },
        { name: 'מֻקְדָּם וּמְאֻחָר', f: earlyLate },
        { name: 'כַּמָּה זְמַן עָבַר?', f: howLong }
      ]
    }, {
      id: 'geo1map', world: 'מַפַּת הַמַּטְמוֹן', name: 'קָרוֹב, רָחוֹק וּמַסְלוּל', icon: '🗺️', bld: 'pyramid', hero: 'חִצִּי',
      levels: [
        { name: 'קָרוֹב וְרָחוֹק', f: nearFar },
        { name: 'מַסְלוּל עַל הַמַּפָּה', f: pathHouse }
      ]
    }]
  });
})();
