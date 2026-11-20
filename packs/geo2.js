(function () {
  'use strict';
  // ================= geometry and measurement, grade 2 =================
  // Source: docs/research/new/geometry-grade-2.md (4 worlds, 20 houses). Drawings are SVG strings built here.
  var INK = '#3b2a55', PINK = '#ff5fa2', ORANGE = '#ff8a00', PAPER = '#fff3c4', GRID = '#cfc6e3';
  var COL = ['#8e5cff', '#3aa0ff', '#ffb300', '#3ec46d', '#ff5fa2'];
  var CM = ' ס"מ', MT = ' מֶטֶר', RAD = Math.PI / 180;
  var NAME = { 3: 'מְשֻׁלָּשׁ', 4: 'מְרֻבָּע', 5: 'מְחֻמָּשׁ', 6: 'מְשֻׁשֶּׁה' };
  var NAME_L = { 3: 'לִמְשֻׁלָּשׁ', 4: 'לִמְרֻבָּע', 5: 'לִמְחֻמָּשׁ', 6: 'לִמְשֻׁשֶּׁה' };
  var PLUR = { 3: 'מְשֻׁלָּשִׁים', 4: 'מְרֻבָּעִים', 5: 'מְחֻמָּשִׁים' };
  var LET = ['א', 'ב', 'ג', 'ד'];

  // ---------- small helpers ----------
  function n1(x) { return Math.round(x * 10) / 10; }
  function svg(w, h, body, dw) { dw = dw || w; return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + dw + '" height="' + Math.round(h * dw / w) + '">' + body + '</svg>'; }
  function pstr(pts) { return pts.map(function (p) { return n1(p[0]) + ',' + n1(p[1]); }).join(' '); }
  function poly(pts, fill, sw, extra) { return '<polygon points="' + pstr(pts) + '" fill="' + (fill || 'none') + '" stroke="' + INK + '" stroke-width="' + (sw == null ? 3 : sw) + '" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function ln(a, b, col, sw, dash) { return '<line x1="' + n1(a[0]) + '" y1="' + n1(a[1]) + '" x2="' + n1(b[0]) + '" y2="' + n1(b[1]) + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 3) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function tx(x, y, s, size, fill) { return '<text x="' + n1(x) + '" y="' + n1(y) + '" font-size="' + (size || 14) + '" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" fill="' + (fill || INK) + '">' + s + '</text>'; }
  function dot(p, rr, fill) { return '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="' + (rr || 4) + '" fill="' + (fill || PINK) + '" stroke="' + INK + '" stroke-width="1"/>'; }
  function rect(x, y, w, h, fill, sw, rx, stroke) { return '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" fill="' + (fill || 'none') + '" stroke="' + (stroke || INK) + '" stroke-width="' + (sw == null ? 2 : sw) + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>'; }
  function path(d, fill, stroke, sw, dash, op) { return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw || 2) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + (op != null ? ' fill-opacity="' + op + '"' : '') + ' stroke-linecap="round" stroke-linejoin="round"/>'; }
  function rotP(pts, deg) { var c = Math.cos(deg * RAD), s = Math.sin(deg * RAD); return pts.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }); }
  function cen(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function away(p, c, d) { var L = dist(p, c) || 1; return [p[0] + (p[0] - c[0]) / L * d, p[1] + (p[1] - c[1]) / L * d]; }
  // a function that maps the given points into a box, keeping proportions, centred
  function fitter(pts, x, y, w, h) {
    var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    pts.forEach(function (p) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); });
    var s = Math.min(w / ((c - a) || 1), h / ((d - b) || 1)), ox = x + (w - (c - a) * s) / 2, oy = y + (h - (d - b) * s) / 2;
    var f = function (p) { return [ox + (p[0] - a) * s, oy + (p[1] - b) * s]; };
    f.s = s; return f;
  }
  function hash(s) { var h = 7, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000000007; return h + ':' + s.length; }
  function keyOf(o) { var s = (o.text || '') + '|' + o.answer + '|' + (o.svg || ''), k; if (o.optHtml) for (k in o.optHtml) s += k + o.optHtml[k]; if (o.parts) s += o.parts.join(','); return hash(s); }
  function Q(r, K, o) { if (o.key == null) o.key = keyOf(o); return K.q(r, o); }
  function TF(r, K, o, truth) { o.fmt = 'tf'; if (o.key == null) o.key = keyOf(o); return K.tf(r, o, truth); }
  function uniq(arr, n, ok) { var out = []; arr.forEach(function (x) { if (out.length < (n || 4) && out.indexOf(x) < 0 && (!ok || ok(x))) out.push(x); }); return out; }
  function pos(x) { return x > 0; }
  function cm(n) { return n + CM; }
  function mt(n) { return n + MT; }
  function bankTF(r, K, bank) { var b = K.pick(r, bank); return TF(r, K, { text: b[0], tip: b[2], ex: [{ say: b[2] }] }, !!b[1]); }
  // the small square that marks a right angle at p, between the directions to a and to b
  function raMark(p, a, b, s, col) {
    var la = dist(p, a) || 1, lb = dist(p, b) || 1, u = [(a[0] - p[0]) / la * s, (a[1] - p[1]) / la * s], v = [(b[0] - p[0]) / lb * s, (b[1] - p[1]) / lb * s];
    return '<polyline points="' + pstr([[p[0] + u[0], p[1] + u[1]], [p[0] + u[0] + v[0], p[1] + u[1] + v[1]], [p[0] + v[0], p[1] + v[1]]]) + '" fill="none" stroke="' + (col || PINK) + '" stroke-width="2.5"/>';
  }
  function isRight(a, p, b) { return Math.abs((a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1])) < 1e-6; }
  function raCount(n) { return n === 0 ? 'אֵין כָּאן אַף זָוִית יְשָׁרָה.' : n === 1 ? 'יֵשׁ כָּאן זָוִית יְשָׁרָה אַחַת.' : 'יֵשׁ כָּאן ' + n + ' זָוִיּוֹת יְשָׁרוֹת.'; }
  // a random convex polygon (points on a stretched circle), not regular
  function rpoly(r, n) {
    var st = 360 / n, j = n > 6 ? 0.16 : 0.22, off = r() * 360, sx = 1 + r() * 0.25, pts = [], i, a;
    for (i = 0; i < n; i++) { a = (off + i * st + (r() * 2 - 1) * st * j) * RAD; pts.push([Math.cos(a) * sx, Math.sin(a)]); }
    return pts;
  }
  function regular(n, rot) { var pts = [], i; for (i = 0; i < n; i++) pts.push([Math.cos((rot + i * 360 / n) * RAD), Math.sin((rot + i * 360 / n) * RAD)]); return pts; }
  function numberedVerts(pts) { var c = cen(pts), s = ''; pts.forEach(function (p, i) { var q = away(p, c, 15); s += dot(p, 5) + tx(q[0], q[1], i + 1, 14, INK); }); return s; }
  function colouredSides(pts) { var c = cen(pts), s = ''; pts.forEach(function (p, i) { var b = pts[(i + 1) % pts.length], m = away(mid(p, b), c, 13); s += ln(p, b, COL[i % 5], 5) + tx(m[0], m[1], i + 1, 14, INK); }); return s; }
  function triPts(a, b, c) { var x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x)); return [[0, 0], [c, 0], [x, -y]]; } // sides: opposite order -> [c, a, b] along the edges 0-1, 1-2, 2-0
  function sideLabels(pts, labs, d, size) { var c = cen(pts), s = ''; pts.forEach(function (p, i) { if (labs[i] == null) return; var m = away(mid(p, pts[(i + 1) % pts.length]), c, d || 14); s += tx(m[0], m[1], labs[i], size || 15, INK); }); return s; }
  function ticks(pts) { var s = ''; pts.forEach(function (p, i) { var b = pts[(i + 1) % pts.length], m = mid(p, b), L = dist(p, b) || 1, nx = -(b[1] - p[1]) / L * 5, ny = (b[0] - p[0]) / L * 5; s += ln([m[0] - nx, m[1] - ny], [m[0] + nx, m[1] + ny], INK, 2.5); }); return s; }

  // =====================================================================
  // WORLD 1: polygons and triangles
  // =====================================================================
  var CONCAVE = [[[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], [[0, 0], [3, 0], [3, 1], [2, 1], [2, 3], [1, 3], [1, 1], [0, 1]], [[0, 0], [2.2, 1], [0, 2], [0.8, 1]]];
  function shapePic(kind, r, col) { // small pictures for "is it a polygon?"
    var b;
    if (kind === 'poly') { var p = rpoly(r, 3 + Math.floor(r() * 4)), f = fitter(p, 8, 8, 74, 54); b = poly(p.map(f), col); }
    else if (kind === 'circle') b = '<circle cx="45" cy="35" r="27" fill="' + col + '" stroke="' + INK + '" stroke-width="3"/>';
    else if (kind === 'oval') b = '<ellipse cx="45" cy="35" rx="36" ry="22" fill="' + col + '" stroke="' + INK + '" stroke-width="3"/>';
    else if (kind === 'open') b = '<polyline points="' + pstr(r() < 0.5 ? [[14, 58], [14, 12], [72, 12], [72, 58], [44, 58]] : [[12, 56], [40, 10], [78, 30], [66, 60]]) + '" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
    else b = path(r() < 0.5 ? 'M12 58 L12 14 L60 14 Q92 36 60 58 Z' : 'M10 58 Q45 -14 80 58 Z', col, INK, 3);
    return svg(90, 70, b);
  }
  var NONPOLY = { circle: 'לָעִגּוּל אֵין צְלָעוֹת יְשָׁרוֹת, אָז הוּא לֹא מְצֻלָּע.', oval: 'בַּצּוּרָה הַזֹּאת אֵין צְלָעוֹת יְשָׁרוֹת, אָז הִיא לֹא מְצֻלָּע.', open: 'הַצּוּרָה הַזֹּאת פְּתוּחָה. מְצֻלָּע הוּא צוּרָה סְגוּרָה.', curve: 'בַּצּוּרָה הַזֹּאת יֵשׁ קַו מְעֻגָּל. בִּמְצֻלָּע כָּל הַצְּלָעוֹת יְשָׁרוֹת.' };
  var POLY_RULE = 'מְצֻלָּע הוּא צוּרָה סְגוּרָה שֶׁכָּל הַצְּלָעוֹת שֶׁלָּהּ יְשָׁרוֹת.';
  var TF_POLY = [
    ['בִּמְצֻלָּע, מִסְפַּר הַצְּלָעוֹת שָׁוֶה לְמִסְפַּר הַקָּדְקוֹדִים.', 1, 'בֵּין כָּל שְׁתֵּי צְלָעוֹת יֵשׁ קָדְקוֹד אֶחָד, אָז הַמִּסְפָּר שָׁוֶה.'],
    ['עִגּוּל הוּא מְצֻלָּע.', 0, NONPOLY.circle],
    ['כָּל הַצְּלָעוֹת שֶׁל מְצֻלָּע הֵן קַוִּים יְשָׁרִים.', 1, POLY_RULE],
    ['מְשֻׁלָּשׁ הָפוּךְ הוּא עֲדַיִן מְשֻׁלָּשׁ.', 1, 'גַּם מְשֻׁלָּשׁ הָפוּךְ הוּא מְשֻׁלָּשׁ: יֵשׁ לוֹ 3 צְלָעוֹת.'],
    ['מְצֻלָּע הוּא צוּרָה סְגוּרָה.', 1, POLY_RULE]
  ];
  function h_poly(r, K) {
    var t = K.ri(r, 0, 9), n, pts, f, P, col = K.pick(r, COL), i;
    if (t <= 2) { // name of the polygon
      n = K.ri(r, 3, 6); pts = rpoly(r, n); f = fitter(pts, 40, 22, 220, 126); P = pts.map(f);
      return Q(r, K, { text: 'אֵיזֶה מְצֻלָּע זֶה?', svg: svg(300, 170, poly(P, col)), answer: NAME[n], options: [NAME[3], NAME[4], NAME[5], NAME[6]], keep: true,
        tip: 'סוֹפְרִים אֶת הַקָּדְקוֹדִים אוֹ אֶת הַצְּלָעוֹת.',
        ex: [{ say: 'סוֹפְרִים קָדְקוֹדִים, וּמְסַמְּנִים כָּל קָדְקוֹד שֶׁסָּפַרְנוּ.', svg: svg(300, 170, poly(P, col) + numberedVerts(P)) }, { say: n + ' קָדְקוֹדִים: זֶה ' + NAME[n] + '.' }] });
    }
    if (t <= 5) { // how many sides / vertices
      if (r() < 0.3) { pts = rotP(K.pick(r, CONCAVE), K.ri(r, 0, 3) * 90 + K.ri(r, -12, 12)); n = pts.length; }
      else { n = K.ri(r, 3, 8); pts = rpoly(r, n); }
      f = fitter(pts, 40, 22, 220, 126); P = pts.map(f);
      var sides = r() < 0.5;
      return Q(r, K, { text: sides ? 'כַּמָּה צְלָעוֹת יֵשׁ לַמְּצֻלָּע?' : 'כַּמָּה קָדְקוֹדִים יֵשׁ לַמְּצֻלָּע?', svg: svg(300, 170, poly(P, col)), answer: n, options: K.opts(r, n, [n - 2, n - 1, n + 1, n + 2].filter(function (x) { return x >= 2; }), 4),
        tip: 'מְסַמְּנִים כָּל מָה שֶׁסָּפַרְנוּ, כְּדֵי לֹא לִסְפֹּר פַּעֲמַיִם.',
        ex: [{ say: sides ? 'צוֹבְעִים כָּל צֶלַע שֶׁסָּפַרְנוּ, כְּדֵי לֹא לִסְפֹּר פַּעֲמַיִם.' : 'מְסַמְּנִים כָּל קָדְקוֹד שֶׁסָּפַרְנוּ, כְּדֵי לֹא לִסְפֹּר פַּעֲמַיִם.', svg: svg(300, 170, sides ? poly(P, '#f3eefc', 1) + colouredSides(P) : poly(P, col) + numberedVerts(P)) }, { say: sides ? 'יֵשׁ ' + n + ' צְלָעוֹת.' : 'יֵשׁ ' + n + ' קָדְקוֹדִים.' }] });
    }
    if (t <= 7) { // which shape is (not) a polygon
      var isQ = r() < 0.5, kinds = isQ ? ['poly'].concat(K.sample(r, ['circle', 'oval', 'open', 'curve'], 3)) : [K.pick(r, ['circle', 'oval', 'open', 'curve']), 'poly', 'poly', 'poly'], oh = {}, cols = K.shuffle(r, COL);
      for (i = 0; i < 4; i++) oh[LET[i]] = shapePic(kinds[i], r, cols[i]);
      return Q(r, K, { text: isQ ? 'אֵיזוֹ צוּרָה הִיא מְצֻלָּע?' : 'אֵיזוֹ צוּרָה אֵינָהּ מְצֻלָּע?', answer: LET[0], options: LET.slice(), optHtml: oh, tip: POLY_RULE,
        ex: [{ say: POLY_RULE, svg: oh[LET[0]].replace('width="90" height="70"', 'width="180" height="140"') }, { say: isQ ? 'רַק הַצּוּרָה הַזֹּאת סְגוּרָה וְכָל הַצְּלָעוֹת שֶׁלָּהּ יְשָׁרוֹת.' : NONPOLY[kinds[0]] }] });
    }
    if (r() < 0.3) return bankTF(r, K, TF_POLY);
    n = K.ri(r, 3, 6); var k = n + K.ri(r, -1, 1), w = r() < 0.5 ? 'צְלָעוֹת' : 'קָדְקוֹדִים', fact = NAME_L[n] + ' ' + n + ' צְלָעוֹת וְ-' + n + ' קָדְקוֹדִים.';
    return TF(r, K, { text: NAME_L[n] + ' יֵשׁ ' + k + ' ' + w + '.', tip: fact, ex: [{ say: fact, svg: svg(300, 170, poly(regular(n, -90 + (n === 4 ? 45 : 0)).map(fitter(regular(n, -90 + (n === 4 ? 45 : 0)), 90, 26, 120, 118)), col) + numberedVerts(regular(n, -90 + (n === 4 ? 45 : 0)).map(fitter(regular(n, -90 + (n === 4 ? 45 : 0)), 90, 26, 120, 118)))) }] }, k === n);
  }

  // ---- right angle: yes or no ----
  function angleSvg(deg, rot, paper, w, h) {
    var a = rot * RAD, b = (rot + deg) * RAD, L = 62, V = [0, 0], A = [Math.cos(a) * L, Math.sin(a) * L], B = [Math.cos(b) * L, Math.sin(b) * L];
    var s = 44, P = [[0, 0], [Math.cos(a) * s, Math.sin(a) * s], [Math.cos(a) * s + Math.cos(a + Math.PI / 2) * s, Math.sin(a) * s + Math.sin(a + Math.PI / 2) * s], [Math.cos(a + Math.PI / 2) * s, Math.sin(a + Math.PI / 2) * s]];
    var f = fitter([V, A, B].concat(P), 20, 12, (w || 300) - 40, (h || 170) - 24), body = '';
    if (paper) body += '<polygon points="' + pstr(P.map(f)) + '" fill="' + PAPER + '" stroke="#c9a227" stroke-width="2"/>';
    body += ln(f(V), f(A), INK, 5) + ln(f(V), f(B), INK, 5) + dot(f(V), 4, INK);
    return svg(w || 300, h || 170, body);
  }
  var FIGS = [ // line figures: segments, and the right angles in them [corner, toward, toward]
    { seg: [[[0, 0], [0, 2]], [[0, 2], [1.4, 2]]], ra: [[[0, 2], [0, 0], [1.4, 2]]] },
    { seg: [[[0, 2], [0, 0]], [[0, 0], [1.6, 0]], [[1.6, 0], [1.6, 2]]], ra: [[[0, 0], [0, 2], [1.6, 0]], [[1.6, 0], [0, 0], [1.6, 2]]] },
    { seg: [[[-1, 0], [1, 0]], [[0, -1], [0, 1]]], ra: [[[0, 0], [1, 0], [0, 1]], [[0, 0], [-1, 0], [0, 1]], [[0, 0], [1, 0], [0, -1]], [[0, 0], [-1, 0], [0, -1]]] },
    { seg: [[[-1, 0], [1, 0]], [[0, 0], [0, 2]]], ra: [[[0, 0], [1, 0], [0, 2]], [[0, 0], [-1, 0], [0, 2]]] },
    { seg: [[[-0.8, 0], [0, 2]], [[0, 2], [0.8, 0]]], ra: [] },
    { seg: [[[0, 0], [1.5, 0]], [[1.5, 0], [0, 2]], [[0, 2], [1.5, 2]]], ra: [] },
    { seg: [[[-1, -0.5], [1, 0.5]], [[-1, 0.5], [1, -0.5]]], ra: [] },
    { seg: [[[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [2, 1]]], ra: [[[1, 0], [0, 0], [1, 1]], [[1, 1], [1, 0], [2, 1]]] },
    { seg: [[[0, 0], [1.4, 0]], [[1.4, 0], [1.4, 1.2]], [[1.4, 1.2], [0.4, 2.2]]], ra: [[[1.4, 0], [0, 0], [1.4, 1.2]]] },
    { seg: [[[0, 0], [0, 1.6]], [[0, 1.6], [1.6, 1.6]], [[1.6, 1.6], [1.6, 0]], [[1.6, 0], [0.8, -0.7]]], ra: [[[0, 1.6], [0, 0], [1.6, 1.6]], [[1.6, 1.6], [0, 1.6], [1.6, 0]]] },
    { seg: [[[0, 0], [1.2, 1.6]], [[1.2, 1.6], [2.4, 0]], [[2.4, 0], [3.6, 1.6]]], ra: [] }
  ];
  function figSvg(fg, rot, col, marks) {
    var all = [], body = '';
    fg.seg.forEach(function (s) { all = all.concat(rotP(s, rot)); });
    var f = fitter(all, 60, 22, 180, 126);
    fg.seg.forEach(function (s) { var q = rotP(s, rot).map(f); body += ln(q[0], q[1], col, 7); });
    if (marks) fg.ra.forEach(function (m) { var q = rotP(m, rot).map(f); body += raMark(q[0], q[1], q[2], 14, INK); });
    return svg(300, 170, body);
  }
  function h_right(r, K) {
    var t = K.ri(r, 0, 9), rot, deg;
    if (t <= 3) { // is it a right angle?
      deg = r() < 0.5 ? 90 : K.pick(r, [50, 65, 115, 130]); rot = K.ri(r, 0, 359);
      return TF(r, K, { text: 'זוֹ זָוִית יְשָׁרָה.', svg: angleSvg(deg, rot), tip: 'בּוֹדְקִים עִם פִּנָּה שֶׁל דַּף: בַּפִּנָּה שֶׁל דַּף יֵשׁ זָוִית יְשָׁרָה.',
        ex: [{ say: 'שָׂמִים פִּנָּה שֶׁל דַּף עַל הַפִּנָּה, וְצַד אֶחָד שֶׁל הַדַּף עַל קַו אֶחָד.', svg: angleSvg(deg, rot, true, 320, 180) },
          { say: deg === 90 ? 'גַּם הַקַּו הַשֵּׁנִי בְּדִיּוּק עַל צַד הַדַּף: זוֹ זָוִית יְשָׁרָה.' : 'הַקַּו הַשֵּׁנִי לֹא עַל צַד הַדַּף: זוֹ לֹא זָוִית יְשָׁרָה.' }] }, deg === 90);
    }
    if (t <= 6) { // which dashed line makes a right angle with the orange one
      var k = K.ri(r, 0, 3), j = K.ri(r, 20, 70), b = k * 90 + j, alt = r() < 0.5, angs = [b + 90, alt ? (k + 1) * 90 : (k + 2) * 90, alt ? b + 120 : b + 60];
      var order = K.shuffle(r, [0, 1, 2]), V = [150, 85], L = 62, body = '', ans = 0, pp = [], i, e, q;
      function end(a, len) { return [V[0] + Math.cos(a * RAD) * len, V[1] + Math.sin(a * RAD) * len]; }
      for (i = 0; i < 3; i++) { e = end(angs[order[i]], L); q = end(angs[order[i]], L + 13); body += ln(V, e, INK, 3.5, '7 6') + tx(q[0], q[1], i + 1, 16, INK); if (order[i] === 0) ans = i + 1; }
      body += ln(V, end(b, L), ORANGE, 6) + dot(V, 4, INK);
      pp = [V, end(b, 46), [end(b, 46)[0] + Math.cos((b + 90) * RAD) * 46, end(b, 46)[1] + Math.sin((b + 90) * RAD) * 46], end(b + 90, 46)];
      return Q(r, K, { text: 'אֵיזֶה קַו יוֹצֵר זָוִית יְשָׁרָה עִם הַקַּו הַכָּתֹם?', svg: svg(300, 170, body), answer: ans, options: [1, 2, 3], keep: true,
        tip: 'מְסוֹבְבִים פִּנָּה שֶׁל דַּף יַחַד עִם הַקַּו הַכָּתֹם.',
        ex: [{ say: 'שָׂמִים פִּנָּה שֶׁל דַּף עַל הַפִּנָּה, וְצַד אֶחָד שֶׁל הַדַּף עַל הַקַּו הַכָּתֹם.', svg: svg(300, 170, '<polygon points="' + pstr(pp) + '" fill="' + PAPER + '" stroke="#c9a227" stroke-width="2"/>' + body) },
          { say: 'קַו ' + ans + ' בְּדִיּוּק עַל הַצַּד הַשֵּׁנִי שֶׁל הַדַּף: שָׁם הַזָּוִית הַיְשָׁרָה.' }, { say: 'הַדַּף מִסְתּוֹבֵב עִם הַקַּו. לֹא בּוֹדְקִים לְפִי שׁוּלֵי הַמָּסָךְ.' }] });
    }
    if (t <= 8 || r() < 0.5) { // how many right angles in the drawing
      var fg = K.pick(r, FIGS), col = K.pick(r, COL), n = fg.ra.length; rot = K.ri(r, 0, 23) * 15;
      return Q(r, K, { text: 'כַּמָּה זָוִיּוֹת יְשָׁרוֹת יֵשׁ בַּצִּיּוּר?', svg: figSvg(fg, rot, col), answer: n, options: K.opts(r, n, [0, 1, 2, 3, 4], 4).sort(), keep: true,
        tip: 'זָוִית יְשָׁרָה נִרְאֵית כְּמוֹ פִּנָּה שֶׁל דַּף.',
        ex: [{ say: 'בּוֹדְקִים כָּל פִּנָּה עִם פִּנָּה שֶׁל דַּף, וּמְסַמְּנִים זָוִית יְשָׁרָה בְּרִבּוּעַ קָטָן.', svg: figSvg(fg, rot, col, true) }, { say: raCount(n) }] });
    }
    return bankTF(r, K, [['בַּפִּנָּה שֶׁל דַּף יֵשׁ זָוִית יְשָׁרָה.', 1, 'בְּכָל פִּנָּה שֶׁל דַּף יֵשׁ זָוִית יְשָׁרָה. לָכֵן בּוֹדְקִים בְּעֶזְרַת דַּף.'], ['בְּסִימַן הַחִבּוּר (+) יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת.', 1, 'שְׁנֵי הַקַּוִּים שֶׁל סִימַן הַחִבּוּר יוֹצְרִים 4 זָוִיּוֹת יְשָׁרוֹת.']]);
  }

  // ---- right angles in polygons ----
  var GRIDSHAPES = [
    [[0, 0], [4, 0], [4, 2], [0, 2]], [[0, 0], [3, 0], [3, 3], [0, 3]], [[1, 0], [3, 0], [3, 4], [1, 4]], [[2, 0], [4, 2], [2, 4], [0, 2]], [[1, 0], [4, 3], [3, 4], [0, 1]],
    [[0, 0], [2, 0], [4, 3], [0, 3]], [[1, 0], [4, 0], [3, 3], [0, 3]], [[2, 0], [4, 0], [2, 3], [0, 3]], [[1, 0], [3, 0], [4, 3], [0, 3]], [[0, 0], [4, 0], [1, 4], [0, 2]],
    [[0, 0], [4, 0], [0, 3]], [[0, 0], [3, 0], [0, 4]], [[0, 2], [2, 0], [4, 2]], [[0, 4], [4, 4], [2, 0]], [[0, 3], [4, 3], [1, 2]],
    [[0, 4], [0, 2], [2, 0], [4, 2], [4, 4]], [[0, 4], [0, 2], [2, 1], [4, 2], [4, 4]], [[0, 0], [4, 0], [4, 2], [2, 4], [0, 4]], [[2, 0], [3, 2], [2, 4], [1, 2]]
  ];
  function gridSvg(P, col, marks) {
    var g = function (p) { return [82 + p[0] * 34, 17 + p[1] * 34]; }, body = '', i, j, S = P.map(g), n = P.length;
    body += poly(S, col, 3, ' fill-opacity="0.75"');
    for (i = 0; i < 5; i++) for (j = 0; j < 5; j++) body += '<circle cx="' + (82 + i * 34) + '" cy="' + (17 + j * 34) + '" r="2.2" fill="' + INK + '"/>';
    if (marks) S.forEach(function (p, k) { var a = S[(k + n - 1) % n], b = S[(k + 1) % n]; body += isRight(P[(k + n - 1) % n], P[k], P[(k + 1) % n]) ? raMark(p, a, b, 11, INK) : '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="7" fill="none" stroke="' + PINK + '" stroke-width="2.5"/>'; });
    return svg(300, 170, body);
  }
  function quadPic(kind, r, col, marks) {
    var p, rot = 0;
    if (kind === 'rect') { p = [[0, 0], [3, 0], [3, 1.8], [0, 1.8]]; rot = K0.pick(r, [0, 90, 25, -30, 60]); }
    else if (kind === 'square') { p = [[0, 0], [2, 0], [2, 2], [0, 2]]; rot = K0.pick(r, [0, 45, 20, -25]); }
    else if (kind === 'para') { p = [[1, 0], [4, 0], [3, 2], [0, 2]]; rot = K0.pick(r, [0, 180, 90]); }
    else if (kind === 'para2') { p = [[0.6, 0], [3.6, 0], [3, 2], [0, 2]]; rot = K0.pick(r, [0, 180]); }
    else if (kind === 'trap') { p = [[1, 0], [3, 0], [4, 2], [0, 2]]; rot = K0.pick(r, [0, 180, 90]); }
    else { p = [[1, 0], [2, 1.9], [1, 3.8], [0, 1.9]]; rot = K0.pick(r, [0, 90]); }
    var q = rotP(p, rot), f = fitter(q, 9, 8, 72, 54), S = q.map(f), body = poly(S, col);
    if (marks) S.forEach(function (pt, k) { body += raMark(pt, S[(k + 3) % 4], S[(k + 1) % 4], 7, INK); });
    return body;
  }
  var K0 = { pick: function (r, a) { return a[Math.floor(r() * a.length)]; } };
  var TF_QUAD = [
    ['לְמַלְבֵּן יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת.', 1, 'בְּמַלְבֵּן כָּל 4 הַזָּוִיּוֹת יְשָׁרוֹת.'],
    ['לְרִבּוּעַ יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת.', 1, 'בְּרִבּוּעַ כָּל 4 הַזָּוִיּוֹת יְשָׁרוֹת.'],
    ['לְכָל מְשֻׁלָּשׁ יֵשׁ זָוִית יְשָׁרָה.', 0, 'יֵשׁ מְשֻׁלָּשִׁים בְּלִי אַף זָוִית יְשָׁרָה.'],
    ['בְּרִבּוּעַ כָּל הַצְּלָעוֹת שָׁווֹת.', 1, 'בְּרִבּוּעַ 4 צְלָעוֹת שָׁווֹת וְ-4 זָוִיּוֹת יְשָׁרוֹת.'],
    ['לְכָל מְרֻבָּע יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת.', 0, 'רַק בְּמַלְבֵּן וּבְרִבּוּעַ כָּל 4 הַזָּוִיּוֹת יְשָׁרוֹת.'],
    ['יֵשׁ מְשֻׁלָּשׁ עִם 2 זָוִיּוֹת יְשָׁרוֹת.', 0, 'עִם 2 זָוִיּוֹת יְשָׁרוֹת הַצְּלָעוֹת לֹא נִפְגָּשׁוֹת, וְהַמְּשֻׁלָּשׁ לֹא נִסְגָּר.']
  ];
  function h_rightPoly(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), i;
    if (t <= 5) {
      var P = K.pick(r, GRIDSHAPES), tr = K.ri(r, 0, 7), n = P.length, cnt = 0;
      P = P.map(function (p) { var x = p[0], y = p[1], k, z; if (tr >= 4) x = 4 - x; for (k = 0; k < tr % 4; k++) { z = x; x = 4 - y; y = z; } return [x, y]; });
      for (i = 0; i < n; i++) if (isRight(P[(i + n - 1) % n], P[i], P[(i + 1) % n])) cnt++;
      var o = uniq([cnt, n <= 4 ? n : cnt + 1, cnt + 1, cnt - 1, cnt + 2, cnt - 2, 0, 4], 4, function (x) { return x >= 0 && x <= 5; }).sort();
      return Q(r, K, { text: 'כַּמָּה זָוִיּוֹת יְשָׁרוֹת יֵשׁ בַּמְּצֻלָּע?', svg: gridSvg(P, col), answer: cnt, options: o, keep: true,
        tip: 'בּוֹדְקִים כָּל קָדְקוֹד עִם פִּנָּה שֶׁל דַּף.',
        ex: [{ say: 'בּוֹדְקִים קָדְקוֹד אַחֲרֵי קָדְקוֹד עִם פִּנָּה שֶׁל דַּף. רִבּוּעַ קָטָן: זָוִית יְשָׁרָה. עִגּוּל: לֹא.', svg: gridSvg(P, col, true) }, { say: raCount(cnt) }] });
    }
    if (t <= 8) {
      var good = K.pick(r, ['rect', 'square']), kinds = [good].concat(K.sample(r, ['para', 'para2', 'trap', 'rhomb'], 3)), cols = K.shuffle(r, COL), oh = {}, r2;
      var seedv = r(), mk = function (kind, c, marks) { var s = seedv, rr = function () { s = (s * 9301 + 0.2113) % 1; return s; }; return quadPic(kind, rr, c, marks); };
      for (i = 0; i < 4; i++) oh[LET[i]] = svg(90, 70, i === 0 ? mk(good, cols[0], false) : quadPic(kinds[i], r, cols[i], false));
      r2 = svg(90, 70, mk(good, cols[0], true), 190);
      return Q(r, K, { text: 'בְּאֵיזֶה מְרֻבָּע כָּל הַזָּוִיּוֹת יְשָׁרוֹת?', answer: LET[0], options: LET.slice(), optHtml: oh, tip: 'בּוֹדְקִים אֶת 4 הַפִּנּוֹת שֶׁל כָּל מְרֻבָּע.',
        ex: [{ say: 'בּוֹדְקִים אֶת 4 הַפִּנּוֹת עִם פִּנָּה שֶׁל דַּף. כָּאן כֻּלָּן זָוִיּוֹת יְשָׁרוֹת.', svg: r2 }, { say: good === 'rect' ? 'זֶה מַלְבֵּן. גַּם כְּשֶׁהוּא מְסוֹבָב, הַזָּוִיּוֹת שֶׁלּוֹ יְשָׁרוֹת.' : 'זֶה רִבּוּעַ. גַּם כְּשֶׁהוּא מְסוֹבָב, הַזָּוִיּוֹת שֶׁלּוֹ יְשָׁרוֹת.' }] });
    }
    return bankTF(r, K, TF_QUAD);
  }

  // ---- kinds of triangles, by the sides ----
  var TRI = ['שְׁוֵה צְלָעוֹת', 'שְׁוֵה שׁוֹקַיִם', 'שׁוֹנֵה צְלָעוֹת'];
  function triple(r, K, kind) { // 0 equilateral, 1 isosceles, 2 scalene
    var a, b, c;
    if (kind === 0) { a = K.ri(r, 3, 12); return [a, a, a]; }
    if (kind === 1) { do { a = K.ri(r, 4, 11); b = K.ri(r, 2, 12); } while (b === a || b > 1.6 * a || b < 0.45 * a); return [a, a, b]; }
    do { a = K.ri(r, 3, 9); b = a + K.ri(r, 1, 3); c = b + K.ri(r, 1, 3); } while (c >= a + b - 1 || c > 12);
    return [a, b, c];
  }
  function triSvg(s, rot, col, colourSides) { // s = lengths of the edges 0-1, 1-2, 2-0
    var p = rotP(triPts(s[1], s[2], s[0]), rot), f = fitter(p, 46, 30, 208, 110), P = p.map(f), body = poly(P, col, 3, ' fill-opacity="0.8"'), i, cc;
    if (colourSides) for (i = 0; i < 3; i++) { cc = s[0] === s[1] && s[1] === s[2] ? PINK : s.filter(function (x) { return x === s[i]; }).length === 2 ? PINK : s[0] !== s[1] && s[1] !== s[2] && s[0] !== s[2] ? ['#3aa0ff', '#ffb300', '#3ec46d'][i] : '#3aa0ff'; body += ln(P[i], P[(i + 1) % 3], cc, 6); }
    return svg(300, 170, body + sideLabels(P, s, 16, 17));
  }
  function triEx(s, kind) {
    return kind === 0 ? ['שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת: ' + s[0] + ', ' + s[0] + ', ' + s[0] + '.', 'זֶה מְשֻׁלָּשׁ שְׁוֵה צְלָעוֹת.']
      : kind === 1 ? ['רַק שְׁתֵּי צְלָעוֹת שָׁווֹת: ' + Math.max(s[0] === s[1] ? s[0] : 0, s[1] === s[2] ? s[1] : 0, s[0] === s[2] ? s[0] : 0) + ' וְ-' + Math.max(s[0] === s[1] ? s[0] : 0, s[1] === s[2] ? s[1] : 0, s[0] === s[2] ? s[0] : 0) + '.', 'זֶה מְשֻׁלָּשׁ שְׁוֵה שׁוֹקַיִם.']
        : ['כָּל הַצְּלָעוֹת שׁוֹנוֹת בְּאָרְכָּן.', 'זֶה מְשֻׁלָּשׁ שׁוֹנֵה צְלָעוֹת.'];
  }
  var TRI_TIP = 'מַשְׁוִים אֶת אֹרֶךְ הַצְּלָעוֹת. לֹא סוֹמְכִים עַל הָעֵינַיִם.';
  function h_tri(r, K) {
    var t = K.ri(r, 0, 9), kind = K.ri(r, 0, 2), s, e;
    if (t <= 5) {
      s = K.shuffle(r, triple(r, K, kind)); var rot = K.ri(r, 0, 23) * 15, col = K.pick(r, COL); e = triEx(s, kind);
      return Q(r, K, { text: 'הָאֹרֶךְ בְּס"מ. אֵיזֶה מְשֻׁלָּשׁ זֶה?', svg: triSvg(s, rot, col), answer: TRI[kind], options: TRI.slice(), keep: true, tip: TRI_TIP,
        ex: [{ say: e[0], svg: triSvg(s, rot, '#f3eefc', true) }, { say: e[1] }] });
    }
    if (t <= 8) {
      var others = kind === 1 ? [2, 2, 2] : kind === 0 ? [1, 2, 1] : [1, 0, 1], opts = [], guard = 0, str = function (x) { return x.join(', '); };
      s = K.shuffle(r, triple(r, K, kind)); opts.push(str(s));
      while (opts.length < 4 && guard++ < 60) { var o = str(K.shuffle(r, triple(r, K, others[opts.length - 1]))); if (opts.indexOf(o) < 0) opts.push(o); }
      e = triEx(s, kind);
      return Q(r, K, { text: 'אֵיזֶה מְשֻׁלָּשׁ הוּא ' + TRI[kind] + '? (הָאֹרֶךְ בְּס"מ)', answer: str(s), options: opts, optLtr: true, tip: TRI_TIP,
        ex: [{ say: e[0], big: str(s), ltr: true }, { say: e[1] }] });
    }
    return bankTF(r, K, [
      ['בִּמְשֻׁלָּשׁ שְׁוֵה צְלָעוֹת יֵשׁ 3 צְלָעוֹת שָׁווֹת.', 1, 'שְׁוֵה צְלָעוֹת: שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת.'],
      ['בִּמְשֻׁלָּשׁ שׁוֹנֵה צְלָעוֹת יֵשׁ 2 צְלָעוֹת שָׁווֹת.', 0, 'שׁוֹנֵה צְלָעוֹת: כָּל הַצְּלָעוֹת שׁוֹנוֹת בְּאָרְכָּן.'],
      ['בִּמְשֻׁלָּשׁ שְׁוֵה שׁוֹקַיִם יֵשׁ 2 צְלָעוֹת שָׁווֹת.', 1, 'שְׁוֵה שׁוֹקַיִם: שְׁתֵּי צְלָעוֹת שָׁווֹת.'],
      ['בִּמְשֻׁלָּשׁ שׁוֹנֵה צְלָעוֹת כָּל הַצְּלָעוֹת שׁוֹנוֹת.', 1, 'שׁוֹנֵה צְלָעוֹת: כָּל הַצְּלָעוֹת שׁוֹנוֹת בְּאָרְכָּן.'],
      ['בִּמְשֻׁלָּשׁ שְׁוֵה צְלָעוֹת יֵשׁ צֶלַע אַחַת אֲרֻכָּה יוֹתֵר.', 0, 'שְׁוֵה צְלָעוֹת: שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת.']
    ]);
  }

  // ---- taking apart and putting together ----
  var CUTBASE = [[[0, 0], [4, 0], [4, 2.4], [0, 2.4]], [[0, 0], [3, 0], [3, 3], [0, 3]], [[1, 0], [3, 0], [4, 2.4], [0, 2.4]], regular(6, 0), [[0, 3.6], [0, 1.6], [2, 0], [4, 1.6], [4, 3.6]], [[2, 0], [4, 3], [0, 3]]];
  function makeCut(r, K) {
    var g, base, n, a, b, between, pa, pb, i, A, B, tries = 0;
    function at(pos) { var i2 = Math.floor(pos / 2); return pos % 2 === 0 ? base[i2] : mid(base[i2], base[(i2 + 1) % n]); }
    while (tries++ < 80) {
      base = K.pick(r, CUTBASE); n = base.length; a = K.ri(r, 0, 2 * n - 1); b = K.ri(r, 0, 2 * n - 1); if (a === b) continue; if (a > b) { g = a; a = b; b = g; }
      A = [at(a)]; B = [at(b)];
      for (i = a + 1; i < b; i++) if (i % 2 === 0) A.push(base[i / 2]);
      for (i = b + 1; i < a + 2 * n; i++) if (i % 2 === 0) B.push(base[(i / 2) % n]);
      if (A.length < 2 || B.length < 2) continue;
      A.push(at(b)); B.push(at(a));
      if (A.length > 5 || B.length > 5) continue;
      between = [A.length, B.length].sort(); if (between[0] === 5) continue;
      return { base: base, A: A, B: B, pa: at(a), pb: at(b) };
    }
    base = CUTBASE[0]; return { base: base, A: [base[0], base[1], base[2]], B: [base[2], base[3], base[0]], pa: base[0], pb: base[2] };
  }
  function pieceLabel(a, b) { var lo = Math.min(a, b), hi = Math.max(a, b); return lo === hi ? '2 ' + PLUR[lo] : NAME[lo] + ' וּ' + NAME[hi]; }
  var COMPOSE = [
    { p: [[[0, 0], [4, 0], [0, 3]], [[4, 0], [4, 3], [0, 3]]], o: [[0, 0], [4, 0], [4, 3], [0, 3]] },
    { p: [[[0, 4], [3, 4], [3, 0]], [[3, 0], [3, 4], [6, 4]]], o: [[0, 4], [6, 4], [3, 0]] },
    { p: [[[0, 3], [4, 3], [4, 0]], [[4, 3], [4, 0], [8, 0]]], o: [[0, 3], [4, 3], [8, 0], [4, 0]] },
    { p: [[[0, 0], [4, 0], [2, 3.46]], [[4, 0], [6, 3.46], [2, 3.46]]], o: [[0, 0], [4, 0], [6, 3.46], [2, 3.46]] },
    { p: [[[2, 0], [5, 0], [5, 3], [2, 3]], [[0, 3], [2, 0], [2, 3]], [[5, 0], [7, 3], [5, 3]]], o: [[2, 0], [5, 0], [7, 3], [0, 3]] },
    { p: [[[0, 2], [3, 2], [3, 5], [0, 5]], [[0, 2], [1.5, 0], [3, 2]]], o: [[0, 2], [1.5, 0], [3, 2], [3, 5], [0, 5]] },
    { p: [[[0, 3.46], [4, 3.46], [2, 0]], [[2, 0], [6, 0], [4, 3.46]], [[4, 3.46], [8, 3.46], [6, 0]]], o: [[0, 3.46], [8, 3.46], [6, 0], [2, 0]] },
    { p: [0, 1, 2, 3, 4, 5].map(function (i) { var h = regular(6, 0); return [[0, 0], h[i], h[(i + 1) % 6]]; }), o: regular(6, 0) },
    { p: [[[2, 0], [6, 0], [6, 3], [2, 3]], [[2, 0], [2, 3], [0, 1.5]], [[6, 0], [8, 1.5], [6, 3]]], o: [[2, 0], [6, 0], [8, 1.5], [6, 3], [2, 3], [0, 1.5]] },
    { p: [[[0, 0], [3, 0], [3, 3], [0, 3]], [[3, 0], [6, 0], [6, 3], [3, 3]]], o: [[0, 0], [6, 0], [6, 3], [0, 3]] },
    { p: [[[0, 0], [4, 0], [4, 3], [0, 3]], [[4, 0], [6, 3], [4, 3]]], o: [[0, 0], [4, 0], [6, 3], [0, 3]] },
    { p: [[[0, 0], [4, 0], [2, 2]], [[4, 0], [4, 4], [2, 2]], [[4, 4], [0, 4], [2, 2]], [[0, 4], [0, 0], [2, 2]]], o: [[0, 0], [4, 0], [4, 4], [0, 4]] },
    { p: [[[2, 0], [4, 2], [0, 2]], [[0, 2], [4, 2], [2, 6]]], o: [[2, 0], [4, 2], [2, 6], [0, 2]] },
    { p: [[[0, 4], [6, 4], [4.5, 2], [1.5, 2]], [[1.5, 2], [4.5, 2], [3, 0]]], o: [[0, 4], [6, 4], [3, 0]] },
    { p: [[[0, 0], [3, 0], [3, 3], [0, 3]], [[3, 0], [5, 1.5], [3, 3]]], o: [[0, 0], [3, 0], [5, 1.5], [3, 3], [0, 3]] }
  ];
  function h_cut(r, K) {
    var t = K.ri(r, 0, 9), rot, f, body, col = K.pick(r, COL);
    if (t <= 5) {
      var c = makeCut(r, K); rot = K.ri(r, 0, 3) * 90 + K.ri(r, -10, 10);
      var base = rotP(c.base, rot), A = rotP(c.A, rot), B = rotP(c.B, rot), pa = rotP([c.pa], rot)[0], pb = rotP([c.pb], rot)[0], n = base.length, na = A.length, nb = B.length;
      f = fitter(base, 50, 22, 200, 126);
      body = svg(300, 170, poly(base.map(f), col) + ln(f(pa), f(pb), '#ffffff', 5) + ln(f(pa), f(pb), INK, 3.5, '8 6'));
      var L = dist(pa, pb) || 1, nx = -(pb[1] - pa[1]) / L, ny = (pb[0] - pa[0]) / L, cA = cen(A), sgn = ((cA[0] - pa[0]) * nx + (cA[1] - pa[1]) * ny) > 0 ? 1 : -1;
      var f2 = fitter(base, 62, 34, 176, 102), mv = function (P, d) { return P.map(f2).map(function (p) { return [p[0] + nx * d, p[1] + ny * d]; }); }, SA = mv(A, 13 * sgn), SB = mv(B, -13 * sgn);
      var apart = svg(300, 170, poly(SA, COL[0]) + poly(SB, COL[2]) + SA.map(function (p) { return dot(p, 4.5); }).join('') + SB.map(function (p) { return dot(p, 4.5, '#3ec46d'); }).join(''));
      if (t <= 3) return Q(r, K, { text: 'חוֹתְכִים לְאֹרֶךְ הַקַּו. מָה מְקַבְּלִים?', svg: body, answer: pieceLabel(na, nb), options: K.opts(r, pieceLabel(na, nb), [pieceLabel(3, 3), pieceLabel(3, 4), pieceLabel(4, 4), pieceLabel(3, 5), pieceLabel(4, 5)], 4),
        tip: 'סוֹפְרִים קָדְקוֹדִים בְּכָל חֵלֶק.',
        ex: [{ say: 'מַפְרִידִים אֶת שְׁנֵי הַחֲלָקִים וְסוֹפְרִים קָדְקוֹדִים בְּכָל חֵלֶק.', svg: apart }, { say: 'לְחֵלֶק אֶחָד ' + na + ' קָדְקוֹדִים, וְלַחֵלֶק הַשֵּׁנִי ' + nb + ' קָדְקוֹדִים.' }, { say: 'קִבַּלְנוּ: ' + pieceLabel(na, nb) + '.' }] });
      return Q(r, K, { text: 'חוֹתְכִים לְאֹרֶךְ הַקַּו. כַּמָּה קָדְקוֹדִים לִשְׁנֵי הַחֲלָקִים יַחַד?', svg: body, answer: na + nb, options: uniq([na + nb, n, na + nb - 1, na + nb + 1, na + nb - 2, na + nb + 2], 4),
        tip: 'אַחֲרֵי חִתּוּךְ מִסְפַּר הַקָּדְקוֹדִים מִשְׁתַּנֶּה.',
        ex: [{ say: 'לִפְנֵי הַחִתּוּךְ הָיוּ לַמְּצֻלָּע ' + n + ' קָדְקוֹדִים.', svg: body }, { say: 'אַחֲרֵי הַחִתּוּךְ סוֹפְרִים בְּכָל חֵלֶק: ' + na + ' וְ-' + nb + '.', svg: apart }, { say: 'מִסְפַּר הַקָּדְקוֹדִים הִשְׁתַּנָּה.', big: na + ' + ' + nb + ' = ' + (na + nb), ltr: true }] });
    }
    if (t <= 8) {
      var cp = K.pick(r, COMPOSE), cols = K.shuffle(r, COL), all = []; rot = K.ri(r, 0, 23) * 15;
      var O = rotP(cp.o, rot), nO = O.length; f = fitter(O, 56, 24, 188, 122);
      body = ''; cp.p.forEach(function (pc, i) { body += poly(rotP(pc, rot).map(f), cols[i % 5], 2); });
      var OS = O.map(f);
      return Q(r, K, { text: 'הִרְכַּבְנוּ צוּרָה מֵהַחֲלָקִים. אֵיזֶה מְצֻלָּע קִבַּלְנוּ?', svg: svg(300, 170, body + poly(OS, 'none', 4)), answer: NAME[nO], options: [NAME[3], NAME[4], NAME[5], NAME[6]], keep: true,
        tip: 'סוֹפְרִים אֶת הַקָּדְקוֹדִים שֶׁל הַצּוּרָה כֻּלָּהּ.',
        ex: [{ say: 'סוֹפְרִים רַק אֶת הַקָּדְקוֹדִים שֶׁל הַצּוּרָה הַגְּדוֹלָה, מִסָּבִיב.', svg: svg(300, 170, poly(OS, '#f3eefc', 4) + numberedVerts(OS)) }, { say: nO + ' קָדְקוֹדִים: קִבַּלְנוּ ' + NAME[nO] + '.' }] });
    }
    return bankTF(r, K, [
      ['חוֹתְכִים מַלְבֵּן מִפִּנָּה לְפִנָּה וּמְקַבְּלִים 2 מְשֻׁלָּשִׁים.', 1, 'חִתּוּךְ מִפִּנָּה לְפִנָּה נוֹתֵן 2 חֲלָקִים, וּלְכָל אֶחָד 3 קָדְקוֹדִים.'],
      ['חוֹתְכִים רִבּוּעַ לִשְׁנַיִם. תָּמִיד מְקַבְּלִים 2 רִבּוּעִים.', 0, 'זֶה תָּלוּי בַּחִתּוּךְ: אֶפְשָׁר לְקַבֵּל 2 מְשֻׁלָּשִׁים אוֹ 2 מַלְבְּנִים.'],
      ['מִשְּׁנֵי מְשֻׁלָּשִׁים אֶפְשָׁר לְהַרְכִּיב מְרֻבָּע.', 1, 'מַצְמִידִים שְׁנֵי מְשֻׁלָּשִׁים צֶלַע אֶל צֶלַע, וּמְקַבְּלִים מְרֻבָּע.'],
      ['אַחֲרֵי חִתּוּךְ, מִסְפַּר הַקָּדְקוֹדִים תָּמִיד נִשְׁאָר שָׁוֶה.', 0, 'אַחֲרֵי חִתּוּךְ יֵשׁ יוֹתֵר קָדְקוֹדִים: סוֹפְרִים בְּכָל חֵלֶק.']
    ]);
  }

  // =====================================================================
  // WORLD 2: the ruler, length and perimeter
  // =====================================================================
  function ruler(x0, y, from, to, u, broken) {
    var w = (to - from) * u, L = x0 - (broken ? 5 : 12), R = x0 + w + 12, s, i, x;
    s = broken ? '<polygon points="' + pstr([[L, y], [R, y], [R, y + 30], [L, y + 30], [L + 5, y + 23], [L - 2, y + 15], [L + 5, y + 8]]) + '" fill="#ffe9a8" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' : rect(L, y, R - L, 30, '#ffe9a8', 2, 3);
    for (i = from; i <= to; i++) { x = x0 + (i - from) * u; s += ln([x, y], [x, y + 9], INK, 1.5) + tx(x, y + 20, i, u < 20 ? 10 : 12, INK); }
    return s;
  }
  function bar(x0, y, a, b, u, from, col, pencil) {
    var x1 = x0 + (a - from) * u, x2 = x0 + (b - from) * u;
    if (!pencil) return rect(x1, y - 15, x2 - x1, 11, col, 2);
    var tip = Math.min(14, (x2 - x1) * 0.3);
    return rect(x1, y - 15, x2 - x1 - tip, 11, col, 2) + poly([[x2 - tip, y - 15], [x2, y - 9.5], [x2 - tip, y - 4]], '#f6d7a8', 2) + poly([[x2 - tip * 0.35, y - 11.7], [x2, y - 9.5], [x2 - tip * 0.35, y - 7.3]], INK, 1);
  }
  function arcs(x0, y, a, b, u, from, nums) {
    var s = '', i, x;
    for (i = a; i < b; i++) { x = x0 + (i - from) * u; s += path('M' + n1(x) + ' ' + (y - 18) + ' Q' + n1(x + u / 2) + ' ' + (y - 34) + ' ' + n1(x + u) + ' ' + (y - 18), 'none', PINK, 2.2); if (nums) s += tx(x + u / 2, y - 37, i - a + 1, 10, PINK); }
    return s;
  }
  function rows(x0, y, u, from, segs) { var s = ''; segs.forEach(function (g, i) { var yy = y - 16 - i * 17, x1 = x0 + (g.a - from) * u, x2 = x0 + (g.b - from) * u; s += rect(x1, yy, x2 - x1, 10, g.col, 2) + tx(x2 + 11, yy + 5, g.lab, 14, INK); }); return s; }
  function rowsSvg(segs, withGuides) {
    var y = 22 + segs.length * 17, s = '';
    if (withGuides) segs.forEach(function (g, i) { [g.a, g.b].forEach(function (v) { s += ln([15 + v * 18, y - 6 - i * 17], [15 + v * 18, y], g.col, 1.5, '3 3'); }); });
    return svg(300, y + 36, s + ruler(15, y, 0, 15, 18) + rows(15, y, 18, 0, segs));
  }
  function measureList(segs) { return 'מוֹדְדִים כָּל קֶטַע: ' + segs.map(function (g) { return g.lab + ' ' + (g.b - g.a); }).join(', ') + '.'; }
  function orderQ(r, K, aligned) {
    var n = K.ri(r, 3, 4), lens = K.sample(r, [2, 3, 4, 5, 6, 7, 8, 9, 10], n), cols = K.shuffle(r, COL), segs = lens.map(function (L, i) { var a = aligned ? 0 : K.ri(r, 0, Math.min(4, 13 - L)); return { a: a, b: a + L, col: cols[i], lab: LET[i] }; });
    var sorted = segs.slice().sort(function (p, q) { return (p.b - p.a) - (q.b - q.a); }).map(function (g) { return g.lab; });
    return Q(r, K, { fmt: 'order', text: 'הַקִּישִׁי לְפִי הַסֵּדֶר: מֵהַקָּצָר לָאָרֹךְ.', svg: rowsSvg(segs), parts: segs.map(function (g) { return g.lab; }), sep: ' ', answer: sorted.join(' '),
      tip: aligned ? 'כָּל הַקְּטָעִים מַתְחִילִים בְּ-0. קוֹרְאִים אֶת הַמִּסְפָּר בַּסּוֹף.' : 'סוֹפְרִים מִרְוָחִים בְּכָל קֶטַע.',
      ex: [{ say: measureList(segs), svg: rowsSvg(segs, true) }, { say: 'מֵהַקָּצָר לָאָרֹךְ: ' + sorted.join(', ') + '.' }] });
  }
  function h_ruler(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), n;
    if (t <= 4) {
      n = K.ri(r, 2, 14); var pencil = r() < 0.5, base = ruler(15, 52, 0, 15, 18) + bar(15, 52, 0, n, 18, 0, col, pencil);
      return Q(r, K, { text: pencil ? 'מָה הָאֹרֶךְ שֶׁל הָעִפָּרוֹן?' : 'מָה הָאֹרֶךְ שֶׁל הַקֶּטַע?', svg: svg(300, 90, base), answer: cm(n), options: uniq([n, n + 1, n - 1, n + 2, n - 2], 4, pos).map(cm),
        tip: 'מַתְחִילִים בְּ-0 וְסוֹפְרִים מִרְוָחִים. כָּל מִרְוָח הוּא סֶנְטִימֶטֶר אֶחָד.',
        ex: [{ say: 'מַתְחִילִים בְּ-0 וְסוֹפְרִים מִרְוָחִים. כָּל מִרְוָח הוּא סֶנְטִימֶטֶר אֶחָד.', svg: svg(300, 90, base + arcs(15, 52, 0, n, 18, 0, true)) }, { say: 'יֵשׁ ' + n + ' מִרְוָחִים: הָאֹרֶךְ ' + n + ' ס"מ.' }] });
    }
    if (t <= 7) {
      var lens = K.sample(r, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3), cols = K.shuffle(r, COL), segs = lens.map(function (L, i) { return { a: 0, b: L, col: cols[i], lab: LET[i] }; }), w = K.ri(r, 0, 2);
      return Q(r, K, { text: 'אֵיזֶה קֶטַע הוּא בְּאֹרֶךְ ' + lens[w] + ' ס"מ?', svg: rowsSvg(segs), answer: LET[w], options: LET.slice(0, 3), keep: true,
        tip: 'כָּל הַקְּטָעִים מַתְחִילִים בְּ-0. קוֹרְאִים אֶת הַמִּסְפָּר בַּסּוֹף.',
        ex: [{ say: measureList(segs), svg: rowsSvg(segs, true) }, { say: 'קֶטַע ' + LET[w] + ' מַתְחִיל בְּ-0 וְנִגְמָר בְּ-' + lens[w] + ': הָאֹרֶךְ ' + lens[w] + ' ס"מ.' }] });
    }
    return orderQ(r, K, true);
  }

  // ---- centimetre or metre, and estimating ----
  var MEASURE = [ // [name, emoji, unit (0 cm, 1 m), about]
    ['עִפָּרוֹן', '✏️', 0, 15], ['מַחַק', '', 0, 4], ['מַחְבֶּרֶת', '📓', 0, 25], ['אֶצְבַּע', '☝️', 0, 6], ['כַּף יָד', '✋', 0, 14], ['מַפְתֵּחַ', '🔑', 0, 6], ['מַזְלֵג', '🍴', 0, 18], ['סֵפֶר', '📕', 0, 22], ['טֶלֶפוֹן', '📱', 0, 15], ['נַעַל', '👟', 0, 20],
    ['כִּתָּה', '🏫', 1, 8], ['מִגְרַשׁ כַּדּוּרֶגֶל', '⚽', 1, 100], ['אוֹטוֹבּוּס', '🚌', 1, 12], ['עֵץ גָּבוֹהַּ', '🌳', 1, 10], ['בִּנְיָן', '🏢', 1, 20], ['מִסְדְּרוֹן', '', 1, 15], ['חֲצַר בֵּית הַסֵּפֶר', '', 1, 40], ['בְּרֵכַת שְׂחִיָּה', '🏊', 1, 25], ['רַכֶּבֶת', '🚆', 1, 100], ['גֶּשֶׁר', '🌉', 1, 50]
  ];
  function h_units(r, K) {
    var t = K.ri(r, 0, 9), it, n, col = K.pick(r, COL);
    if (t <= 2) {
      it = K.pick(r, MEASURE);
      return Q(r, K, { text: it[0] + '. בְּמָה מוֹדְדִים אֶת הָאֹרֶךְ?', pic: it[1] || undefined, answer: it[2] ? 'בְּמֶטְרִים' : 'בְּסֶנְטִימֶטְרִים', options: ['בְּסֶנְטִימֶטְרִים', 'בְּמֶטְרִים'], keep: true,
        tip: 'מֶטֶר אֶחָד הוּא 100 סֶנְטִימֶטְרִים, בְּעֵרֶךְ רֹחַב שֶׁל דֶּלֶת.',
        ex: [{ say: 'מֶטֶר אֶחָד הוּא 100 סֶנְטִימֶטְרִים, בְּעֵרֶךְ רֹחַב שֶׁל דֶּלֶת.' }, { say: it[2] ? 'דָּבָר אָרֹךְ אוֹ גָּבוֹהַּ מוֹדְדִים בְּמֶטְרִים.' : 'דָּבָר קָטָן, שֶׁנִּכְנָס בַּיָּד אוֹ בַּתִּיק, מוֹדְדִים בְּסֶנְטִימֶטְרִים.' }] });
    }
    if (t <= 5) {
      it = K.pick(r, MEASURE); var v = it[3], opts = it[2] ? [mt(v), cm(v), mt(1), cm(1)] : [cm(v), mt(v), mt(2), v >= 14 ? cm(1) : cm(50) + ' '];
      opts = opts.map(function (s) { return s.trim(); });
      return Q(r, K, { text: it[0] + '. מָה הָאֹרֶךְ, בְּעֵרֶךְ?', pic: it[1] || undefined, answer: opts[0], options: opts,
        tip: 'סֶנְטִימֶטֶר הוּא בְּעֵרֶךְ רֹחַב שֶׁל אֶצְבַּע. מֶטֶר הוּא בְּעֵרֶךְ רֹחַב שֶׁל דֶּלֶת.',
        ex: [{ say: 'סֶנְטִימֶטֶר הוּא בְּעֵרֶךְ רֹחַב שֶׁל אֶצְבַּע. מֶטֶר הוּא בְּעֵרֶךְ רֹחַב שֶׁל דֶּלֶת.' }, { say: 'הָאֹרֶךְ הַמַּתְאִים, בְּעֵרֶךְ: ' + opts[0] + '.' }] });
    }
    n = K.ri(r, 2, 8); var kind = K.ri(r, 0, 3), end, ans, o;
    if (kind <= 1) { end = n + K.pick(r, [0.4, 0.5, 0.6]); ans = 'בֵּין ' + n + ' לְ-' + (n + 1) + CM; o = [ans, 'בְּדִיּוּק ' + n + CM, 'בְּדִיּוּק ' + (n + 1) + CM, 'בֵּין ' + (n + 1) + ' לְ-' + (n + 2) + CM]; }
    else if (kind === 2) { end = n + 0.2; ans = 'קְצָת יוֹתֵר מִ-' + n + CM; o = [ans, 'קְצָת פָּחוֹת מִ-' + n + CM, 'בְּדִיּוּק ' + n + CM, 'קְצָת יוֹתֵר מִ-' + (n + 1) + CM]; }
    else { end = n - 0.2; ans = 'קְצָת פָּחוֹת מִ-' + n + CM; o = [ans, 'קְצָת יוֹתֵר מִ-' + n + CM, 'בְּדִיּוּק ' + n + CM, 'קְצָת פָּחוֹת מִ-' + (n - 1) + CM]; }
    var base = ruler(15, 52, 0, 10, 27) + bar(15, 52, 0, end, 27, 0, col, false), xe = 15 + end * 27;
    return Q(r, K, { text: 'מָה הָאֹרֶךְ שֶׁל הַקֶּטַע?', svg: svg(300, 90, base), answer: ans, options: o,
      tip: 'מִסְתַּכְּלִים אֵיפֹה הַקָּצֶה שֶׁל הַקֶּטַע עַל הַסַּרְגֵּל.',
      ex: [{ say: 'מִסְתַּכְּלִים אֵיפֹה הַקָּצֶה שֶׁל הַקֶּטַע עַל הַסַּרְגֵּל.', svg: svg(300, 90, base + ln([xe, 28], [xe, 66], PINK, 2.5, '4 3')) },
        { say: kind <= 1 ? 'הַקָּצֶה בֵּין ' + n + ' לְ-' + (n + 1) + '. הָאֹרֶךְ בֵּין ' + n + ' לְ-' + (n + 1) + ' ס"מ.' : kind === 2 ? 'הַקָּצֶה קְצָת אַחֲרֵי ' + n + '. הָאֹרֶךְ קְצָת יוֹתֵר מִ-' + n + ' ס"מ.' : 'הַקָּצֶה קְצָת לִפְנֵי ' + n + '. הָאֹרֶךְ קְצָת פָּחוֹת מִ-' + n + ' ס"מ.' }] });
  }

  // ---- measuring that does not start at 0 ----
  function h_broken(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), a, len, b, base;
    if (t <= 5) {
      var broken = t >= 3, from = 0, u = 18, to = 15;
      if (broken) { from = K.ri(r, 3, 6); to = from + 10; u = 27; a = from + K.ri(r, 0, 2); len = K.ri(r, 3, 7); }
      else { a = K.ri(r, 1, 5); len = K.ri(r, 3, 9); }
      b = a + len; base = ruler(15, 52, from, to, u, broken) + bar(15, 52, a, b, u, from, col, r() < 0.5);
      return Q(r, K, { text: broken ? 'הַסַּרְגֵּל שָׁבוּר. מָה הָאֹרֶךְ שֶׁל הַקֶּטַע?' : 'מָה הָאֹרֶךְ שֶׁל הַקֶּטַע?', svg: svg(300, 90, base), answer: cm(len), options: uniq([len, b, len + 1, len - 1, len + 2], 4, pos).map(cm),
        tip: 'סוֹפְרִים מִרְוָחִים מֵהַהַתְחָלָה שֶׁל הַקֶּטַע עַד הַסּוֹף שֶׁלּוֹ.',
        ex: [{ say: 'הַקֶּטַע מַתְחִיל בְּ-' + a + ' וְנִגְמָר בְּ-' + b + '. סוֹפְרִים מִרְוָחִים: יֵשׁ ' + len + '.', svg: svg(300, 90, base + arcs(15, 52, a, b, u, from, true)) },
          { say: 'אֶפְשָׁר גַּם לְחַשֵּׁב: ' + b + ' פָּחוֹת ' + a + '.', big: b + ' − ' + a + ' = ' + len, ltr: true }, { say: 'הָאֹרֶךְ ' + len + ' ס"מ, וְלֹא ' + b + '. חָשׁוּב מִסְפַּר הַמִּרְוָחִים.' }] });
    }
    if (t <= 7) {
      var T = K.ri(r, 4, 8), a1 = K.ri(r, 1, 5), a2 = K.ri(r, 1, 2), d = r() < 0.5 ? 1 : -1, cols = K.shuffle(r, COL);
      var raw = K.shuffle(r, [{ a: a1, b: a1 + T, ok: 1 }, { a: a2, b: T }, { a: 0, b: T + d }]), ans = 0;
      var segs = raw.map(function (g, i) { if (g.ok) ans = i; return { a: g.a, b: g.b, col: cols[i], lab: LET[i] }; });
      return Q(r, K, { text: 'אֵיזֶה קֶטַע הוּא בְּאֹרֶךְ ' + T + ' ס"מ?', svg: rowsSvg(segs), answer: LET[ans], options: LET.slice(0, 3), keep: true,
        tip: 'חָשׁוּב מִסְפַּר הַמִּרְוָחִים, לֹא הַמִּסְפָּר שֶׁבַּקָּצֶה.',
        ex: [{ say: 'סוֹפְרִים מִרְוָחִים בְּכָל קֶטַע: ' + segs.map(function (g) { return g.lab + ' ' + (g.b - g.a); }).join(', ') + '.', svg: rowsSvg(segs, true) },
          { say: 'קֶטַע ' + LET[ans] + ': מִ-' + segs[ans].a + ' עַד ' + segs[ans].b + ' יֵשׁ ' + T + ' מִרְוָחִים.', big: segs[ans].b + ' − ' + segs[ans].a + ' = ' + T, ltr: true }, { say: 'חָשׁוּב מִסְפַּר הַמִּרְוָחִים, לֹא הַמִּסְפָּר שֶׁבַּקָּצֶה.' }] });
    }
    return orderQ(r, K, false);
  }

  // ---- broken line ----
  function zigzag(lens, turnsRight) {
    var pts = [[0, 0]], ang = -30, i, dirs = turnsRight ? null : [-32, 38, -48, 30, -40];
    for (i = 0; i < lens.length; i++) {
      if (turnsRight) ang = i === 0 ? 0 : ang + turnsRight[i - 1]; else ang = dirs[i];
      pts.push([pts[i][0] + Math.cos(ang * RAD) * (lens[i] + 2), pts[i][1] + Math.sin(ang * RAD) * (lens[i] + 2)]);
    }
    return pts;
  }
  function lineSvg(pts, labs, o) {
    o = o || {}; var f = fitter(pts, 34, 30, 232, 110), P = pts.map(f), c = cen(P), body = '', i, m, L, nx, ny, side;
    for (i = 0; i < P.length - 1; i++) body += ln(P[i], P[i + 1], COL[i % 5], 6);
    for (i = 0; i < P.length - 1; i++) {
      m = mid(P[i], P[i + 1]); L = dist(P[i], P[i + 1]) || 1; nx = -(P[i + 1][1] - P[i][1]) / L; ny = (P[i + 1][0] - P[i][0]) / L;
      side = ((m[0] - c[0]) * nx + (m[1] - c[1]) * ny) >= 0 ? 1 : -1; if (o.flip) side = -side;
      body += tx(m[0] + nx * 15 * side, m[1] + ny * 15 * side, labs[i], 16, INK);
    }
    if (o.ra) for (i = 1; i < P.length - 1; i++) body += raMark(P[i], P[i - 1], P[i + 1], 10, INK);
    for (i = 0; i < P.length; i++) body += dot(P[i], 4, i === 0 && o.troll ? '#3ec46d' : '#ffffff');
    if (o.troll) body += tx(P[P.length - 1][0], P[P.length - 1][1] - 14, '🚩', 16);
    return svg(300, 170, body);
  }
  function chain(a) { return a.join(' + ') + ' = ' + a.reduce(function (x, y) { return x + y; }, 0); }
  function h_line(r, K) {
    var t = K.ri(r, 0, 9), k, lens, sum, pts, i;
    if (t <= 4) {
      do { k = K.ri(r, 2, 4); lens = []; for (i = 0; i < k; i++) lens.push(K.ri(r, 2, 9)); sum = lens.reduce(function (x, y) { return x + y; }, 0); } while (sum > 30);
      pts = zigzag(lens);
      return Q(r, K, { text: 'הָאֹרֶךְ בְּס"מ. מָה אֹרֶךְ הַקַּו הַשָּׁבוּר?', svg: lineSvg(pts, lens), answer: cm(sum), options: uniq([sum, sum - lens[k - 1], sum + 1, sum - 1, sum + 10], 4, pos).map(cm),
        tip: 'מְחַבְּרִים אֶת הָאֹרֶךְ שֶׁל כָּל הַקְּטָעִים.',
        ex: [{ say: 'קַו שָׁבוּר בָּנוּי מִכַּמָּה קְטָעִים. מְחַבְּרִים אֶת כֻּלָּם, אֶחָד אַחֲרֵי הַשֵּׁנִי.', svg: lineSvg(pts, lens) }, { say: 'אֹרֶךְ הַקַּו הַשָּׁבוּר: ' + sum + ' ס"מ.', big: chain(lens), ltr: true }] });
    }
    if (t <= 6) {
      k = K.ri(r, 3, 5); var m = K.pick(r, [2, 4, 5, 10]); lens = []; for (i = 0; i < k; i++) lens.push(m); pts = zigzag(lens);
      return Q(r, K, { text: 'בַּמַּסְלוּל ' + k + ' קְטָעִים שָׁוִים, כָּל אֶחָד ' + m + ' מֶטֶר. מָה אֹרֶךְ הַמַּסְלוּל?', svg: lineSvg(pts, lens), answer: mt(k * m), options: uniq([k * m, (k - 1) * m, (k + 1) * m, k + m, k * m + 1], 4).map(mt),
        tip: 'מְחַבְּרִים אֶת אוֹתוֹ מִסְפָּר שׁוּב וָשׁוּב.',
        ex: [{ say: 'מְחַבְּרִים אֶת כָּל הַקְּטָעִים.', big: chain(lens), ltr: true }, { say: 'אֶפְשָׁר גַּם בְּכֶפֶל: ' + k + ' פְּעָמִים ' + m + '.', big: k + ' × ' + m + ' = ' + (k * m), ltr: true }] });
    }
    k = K.ri(r, 2, 3); lens = []; for (i = 0; i < k; i++) lens.push(K.ri(r, 2, 9));
    if (k === 2 && lens[0] === lens[1]) lens[1] = lens[0] + 1;
    sum = lens.reduce(function (x, y) { return x + y; }, 0); var first = r() < 0.5 ? 90 : -90; pts = zigzag(lens, [first, r() < 0.5 ? first : -first]);
    return Q(r, K, { text: 'הַטְּרוֹל הוֹלֵךְ בַּמַּסְלוּל עַד הַדֶּגֶל. כַּמָּה מֶטֶר הוּא הוֹלֵךְ?', svg: lineSvg(pts, lens, { ra: 1, troll: 1 }), answer: mt(sum), options: uniq([sum, k === 2 ? Math.abs(lens[0] - lens[1]) : sum - lens[2], lens[0], sum + 1, sum - 1, sum + 2], 4, pos).map(mt),
      tip: 'מְחַבְּרִים אֶת כָּל הַקְּטָעִים שֶׁל הַמַּסְלוּל.',
      ex: [{ say: 'הַטְּרוֹל הוֹלֵךְ, פּוֹנֶה בְּזָוִית יְשָׁרָה, וּמַמְשִׁיךְ לָלֶכֶת.', svg: lineSvg(pts, lens, { ra: 1, troll: 1 }) }, { say: 'מְחַבְּרִים אֶת כָּל הַקְּטָעִים: ' + sum + ' מֶטֶר.', big: chain(lens), ltr: true }] });
  }

  // ---- perimeter ----
  function labelledPoly(r, K) { // a polygon and the lengths of its sides (edge i = P[i] -> P[i+1])
    var t = K.ri(r, 0, 3), s, pts, a, b, c;
    if (t === 0) { s = K.shuffle(r, triple(r, K, K.ri(r, 1, 2))); pts = rotP(triPts(s[1], s[2], s[0]), K.ri(r, 0, 11) * 30); return { pts: pts, s: s }; }
    if (t === 1) { do { a = K.ri(r, 2, 12); b = K.ri(r, 2, 9); } while (a === b || a > 3 * b || b > 3 * a); return { pts: rotP([[0, 0], [a, 0], [a, b], [0, b]], K.pick(r, [0, 0, 20, -20])), s: [a, b, a, b] }; }
    if (t === 2) { a = K.ri(r, 4, 8); b = K.ri(r, 2, 5); c = Math.ceil(a / 2) + K.ri(r, 1, 2); var hgt = Math.sqrt(c * c - a * a / 4); return { pts: [[0, 0], [a / 2, -hgt], [a, 0], [a, b], [0, b]], s: [c, c, b, a, b] }; }
    pts = rpoly(r, 4); var d = [0, 1, 2, 3].map(function (i) { return dist(pts[i], pts[(i + 1) % 4]); }), nums = K.sample(r, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4).sort(function (x, y) { return x - y; });
    var rank = [0, 1, 2, 3].sort(function (i, j) { return d[i] - d[j]; }); s = []; rank.forEach(function (idx, pos2) { s[idx] = nums[pos2]; });
    return { pts: pts, s: s };
  }
  function polySvg(pts, labs, col, o) { o = o || {}; var f = fitter(pts, 50, 30, 200, 110), P = pts.map(f); return svg(300, 170, poly(P, col, 3, ' fill-opacity="0.8"') + (o.ticks ? ticks(P) : '') + sideLabels(P, labs, o.ticks ? 18 : 15, 16)); }
  function pomino(r, K, k, W, H) {
    var cells = [[0, 0]], set = { '0,0': 1 }, tries = 0, c, d, x, y, xs, ys;
    while (cells.length < k && tries++ < 400) {
      c = K.pick(r, cells); d = K.pick(r, [[1, 0], [-1, 0], [0, 1], [0, -1]]); x = c[0] + d[0]; y = c[1] + d[1]; if (set[x + ',' + y]) continue;
      xs = cells.map(function (q) { return q[0]; }).concat([x]); ys = cells.map(function (q) { return q[1]; }).concat([y]);
      if (Math.max.apply(null, xs) - Math.min.apply(null, xs) >= W || Math.max.apply(null, ys) - Math.min.apply(null, ys) >= H) continue;
      set[x + ',' + y] = 1; cells.push([x, y]);
    }
    var mx = Math.min.apply(null, cells.map(function (q) { return q[0]; })), my = Math.min.apply(null, cells.map(function (q) { return q[1]; }));
    return cells.map(function (q) { return [q[0] - mx, q[1] - my]; });
  }
  function pomEdges(cells) {
    var set = {}, e = []; cells.forEach(function (c) { set[c[0] + ',' + c[1]] = 1; });
    cells.forEach(function (c) {
      var x = c[0], y = c[1];
      if (!set[x + ',' + (y - 1)]) e.push([[x, y], [x + 1, y], [0, -1]]); if (!set[x + ',' + (y + 1)]) e.push([[x, y + 1], [x + 1, y + 1], [0, 1]]);
      if (!set[(x - 1) + ',' + y]) e.push([[x, y], [x, y + 1], [-1, 0]]); if (!set[(x + 1) + ',' + y]) e.push([[x + 1, y], [x + 1, y + 1], [1, 0]]);
    });
    return e;
  }
  function gridBg(ox, oy, cols, rws, u) { var s = '', i; for (i = 0; i <= cols; i++) s += ln([ox + i * u, oy], [ox + i * u, oy + rws * u], GRID, 1); for (i = 0; i <= rws; i++) s += ln([ox, oy + i * u], [ox + cols * u, oy + i * u], GRID, 1); return s; }
  function pomDraw(cells, ox, oy, u, col, dots) {
    var s = '';
    cells.forEach(function (c) { s += rect(ox + c[0] * u, oy + c[1] * u, u, u, col, 1, 0, '#ffffff'); });
    pomEdges(cells).forEach(function (e) { s += ln([ox + e[0][0] * u, oy + e[0][1] * u], [ox + e[1][0] * u, oy + e[1][1] * u], INK, 3); if (dots) s += dot([ox + (e[0][0] + e[1][0]) / 2 * u + e[2][0] * 6, oy + (e[0][1] + e[1][1]) / 2 * u + e[2][1] * 6], 3.2); });
    return s;
  }
  function pomSize(cells) { return [Math.max.apply(null, cells.map(function (q) { return q[0]; })) + 1, Math.max.apply(null, cells.map(function (q) { return q[1]; })) + 1]; }
  function onePom(cells, col, dots) { var u = 28, sz = pomSize(cells), ox = 150 - (sz[0] + 2) * u / 2, oy = 85 - (sz[1] + 2) * u / 2; return svg(300, 170, gridBg(ox, oy, sz[0] + 2, sz[1] + 2, u) + pomDraw(cells, ox + u, oy + u, u, col, dots)); }
  function twoPom(A, B, cA, cB, dots) {
    var u = 24, s = '', sa = pomSize(A), sb = pomSize(B);
    s += gridBg(6, 26, 6, 6, u) + gridBg(156, 26, 6, 6, u);
    s += pomDraw(B, 6 + Math.floor((6 - sb[0]) / 2) * u, 26 + Math.floor((6 - sb[1]) / 2) * u, u, cB, dots) + pomDraw(A, 156 + Math.floor((6 - sa[0]) / 2) * u, 26 + Math.floor((6 - sa[1]) / 2) * u, u, cA, dots);
    return svg(306, 176, s + tx(228, 13, 'א', 17, INK) + tx(78, 13, 'ב', 17, INK));
  }
  function h_perim(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), P, sum, n, s, pts, cells, per;
    if (t <= 3) {
      do { P = labelledPoly(r, K); sum = P.s.reduce(function (x, y) { return x + y; }, 0); } while (sum > 40);
      return Q(r, K, { text: 'הָאֹרֶךְ בְּס"מ. מָה הֶקֵּף הַמְּצֻלָּע?', svg: polySvg(P.pts, P.s, col), answer: cm(sum), options: uniq([sum, sum - P.s[0], sum + 1, sum - 1, sum + 2, sum - 2], 4, pos).map(cm),
        tip: 'הֶקֵּף: הוֹלְכִים מִסָּבִיב לַמְּצֻלָּע וּמְחַבְּרִים אֶת כָּל הַצְּלָעוֹת.',
        ex: [{ say: 'הֶקֵּף הוּא הַדֶּרֶךְ מִסָּבִיב לַמְּצֻלָּע. לְיַד כָּל צֶלַע כָּתוּב הָאֹרֶךְ שֶׁלָּהּ.', svg: polySvg(P.pts, P.s, col) }, { say: 'מְחַבְּרִים אֶת כָּל הַצְּלָעוֹת, וְלֹא שׁוֹכְחִים אַף אַחַת.', big: chain(P.s), ltr: true }, { say: 'הַהֶקֵּף ' + sum + ' ס"מ.' }] });
    }
    if (t <= 5) {
      do { if (r() < 0.5) { n = K.ri(r, 3, 6); s = K.pick(r, [2, 4, 5, 10]); } else { n = K.ri(r, 4, 5); s = K.ri(r, 2, 9); } } while (n * s > 50);
      pts = regular(n, -90 + (n === 4 ? 45 : 0)); var labs = []; labs[n - 1] = s; var all = []; while (all.length < n) all.push(s);
      return Q(r, K, { text: 'כָּל הַצְּלָעוֹת שָׁווֹת. הָאֹרֶךְ בְּס"מ. מָה הַהֶקֵּף?', svg: polySvg(pts, labs, col, { ticks: 1 }), answer: cm(n * s), options: uniq([n * s, s, (n - 1) * s, (n + 1) * s, n + s], 4).map(cm),
        tip: 'כָּל הַצְּלָעוֹת שָׁווֹת, אָז מְחַבְּרִים אֶת אוֹתוֹ מִסְפָּר לְכָל צֶלַע.',
        ex: [{ say: 'כָּל הַצְּלָעוֹת שָׁווֹת, אָז כּוֹתְבִים ' + s + ' לְיַד כָּל צֶלַע.', svg: polySvg(pts, all, col, { ticks: 1 }) }, { say: 'מְחַבְּרִים אֶת כָּל הַצְּלָעוֹת.', big: chain(all), ltr: true }, { say: 'אֶפְשָׁר גַּם בְּכֶפֶל: ' + n + ' פְּעָמִים ' + s + '.', big: n + ' × ' + s + ' = ' + (n * s), ltr: true }] });
    }
    if (t <= 7) {
      n = K.ri(r, 3, 6); cells = pomino(r, K, n, 4, 3); per = pomEdges(cells).length;
      return Q(r, K, { text: 'כָּל צַד שֶׁל מִשְׁבֶּצֶת הוּא 1 ס"מ. מָה הֶקֵּף הַצּוּרָה?', svg: onePom(cells, col), answer: cm(per), options: uniq([per, n, per + 2, per - 2, per + 1], 4, pos).map(cm),
        tip: 'סוֹפְרִים אֶת הַקַּוִּים מִסָּבִיב, לֹא אֶת הַמִּשְׁבְּצוֹת.',
        ex: [{ say: 'סוֹפְרִים אֶת הַקַּוִּים מִסָּבִיב, לֹא אֶת הַמִּשְׁבְּצוֹת. כָּל נְקֻדָּה הִיא קַו אֶחָד.', svg: onePom(cells, col, true) }, { say: 'יֵשׁ ' + per + ' קַוִּים מִסָּבִיב: הַהֶקֵּף ' + per + ' ס"מ.' }] });
    }
    var A, B, pa, pb, tries = 0;
    do { A = pomino(r, K, K.ri(r, 3, 6), 4, 4); B = pomino(r, K, K.ri(r, 3, 6), 4, 4); pa = pomEdges(A).length; pb = pomEdges(B).length; }
    while (tries++ < 30 && !((A.length < B.length && pa >= pb) || (B.length < A.length && pb >= pa)));
    var cs = K.sample(r, COL, 2), ans = pa > pb ? 'א' : pb > pa ? 'ב' : 'הַהֶקֵּף שָׁוֶה';
    return Q(r, K, { text: 'לְאֵיזוֹ צוּרָה יֵשׁ הֶקֵּף גָּדוֹל יוֹתֵר?', svg: twoPom(A, B, cs[0], cs[1]), answer: ans, options: ['א', 'ב', 'הַהֶקֵּף שָׁוֶה'], keep: true,
      tip: 'סוֹפְרִים אֶת הַקַּוִּים מִסָּבִיב בְּכָל צוּרָה.',
      ex: [{ say: 'סוֹפְרִים אֶת הַקַּוִּים מִסָּבִיב בְּכָל צוּרָה: א ' + pa + ', ב ' + pb + '.', svg: twoPom(A, B, cs[0], cs[1], true) },
        { say: pa === pb ? 'הַהֶקֵּף שָׁוֶה, גַּם אִם צוּרָה אַחַת נִרְאֵית גְּדוֹלָה יוֹתֵר.' : 'לְצוּרָה ' + ans + ' יֵשׁ הֶקֵּף גָּדוֹל יוֹתֵר. צוּרָה שֶׁנִּרְאֵית גְּדוֹלָה הִיא לֹא תָּמִיד עִם הֶקֵּף גָּדוֹל.' }] });
  }

  // ---- a missing side ----
  function lShape(W, H, w, h, hide, col, count) {
    var u = 24, ox = 150 - (W + 2) * u / 2, oy = 86 - (H + 2) * u / 2, g = function (p) { return [ox + u + p[0] * u, oy + u + p[1] * u]; };
    var V = [[0, 0], [W - w, 0], [W - w, h], [W, h], [W, H], [0, H]], labs = [W - w, h, w, H - h, W, H], S = V.map(g), c = [ox + u + W * u / 2, oy + u + H * u / 2], body = gridBg(ox, oy, W + 2, H + 2, u) + poly(S, col, 3, ' fill-opacity="0.8"'), i, m, q;
    for (i = 0; i < 6; i++) {
      m = mid(S[i], S[(i + 1) % 6]);
      q = i === 1 ? [m[0] - 11, m[1]] : i === 2 ? [m[0], m[1] + 12] : away(m, [i === 0 || i === 4 ? m[0] : c[0], i === 0 || i === 4 ? c[1] : m[1]], 12);
      body += tx(q[0], q[1], i === hide ? '?' : labs[i], 15, i === hide ? PINK : INK);
    }
    if (count) body += ln(S[hide], S[(hide + 1) % 6], PINK, 6);
    return svg(300, 172, body);
  }
  function h_missing(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), P, sum, n, s, i;
    if (t <= 3) {
      do { P = labelledPoly(r, K); sum = P.s.reduce(function (x, y) { return x + y; }, 0); } while (sum > 40 || P.s.length > 4);
      i = K.ri(r, 0, P.s.length - 1); var miss = P.s[i], known = P.s.filter(function (x, k) { return k !== i; }), ks = sum - miss, labs = P.s.map(function (x, k) { return k === i ? '?' : x; });
      return Q(r, K, { text: 'הַהֶקֵּף ' + sum + ' ס"מ. מָה אֹרֶךְ הַצֶּלַע הַחֲסֵרָה?', svg: polySvg(P.pts, labs, col), answer: cm(miss), options: uniq([miss, ks, miss + 1, miss - 1, sum, miss + 2], 4, pos).map(cm),
        tip: 'מְחַבְּרִים אֶת הַצְּלָעוֹת שֶׁיּוֹדְעִים, וּבוֹדְקִים כַּמָּה חָסֵר עַד הַהֶקֵּף.',
        ex: [{ say: 'מְחַבְּרִים אֶת הַצְּלָעוֹת שֶׁיּוֹדְעִים.', big: chain(known), ltr: true }, { say: 'כַּמָּה חָסֵר מִ-' + ks + ' עַד הַהֶקֵּף ' + sum + '?', big: ks + ' + ? = ' + sum, ltr: true }, { say: 'הַצֶּלַע הַחֲסֵרָה: ' + miss + ' ס"מ.', big: sum + ' − ' + ks + ' = ' + miss, ltr: true }] });
    }
    if (t <= 6) {
      do { if (r() < 0.5) { n = K.ri(r, 3, 6); s = K.pick(r, [2, 4, 5, 10]); } else { n = K.ri(r, 4, 5); s = K.ri(r, 2, 9); } } while (n * s > 50);
      var pts = regular(n, -90 + (n === 4 ? 45 : 0)), lb = [], all = []; lb[n - 1] = '?'; while (all.length < n) all.push(s);
      return Q(r, K, { text: 'כָּל הַצְּלָעוֹת שָׁווֹת. הַהֶקֵּף ' + (n * s) + ' ס"מ. מָה אֹרֶךְ כָּל צֶלַע?', svg: polySvg(pts, lb, col, { ticks: 1 }), answer: cm(s), options: uniq([s, n * s - n, s + 1, s - 1, n * s, s + 2], 4, pos).map(cm),
        tip: 'מְחַפְּשִׂים מִסְפָּר שֶׁמְּחַבְּרִים אוֹתוֹ לְכָל צֶלַע וּמַגִּיעִים לַהֶקֵּף.',
        ex: [{ say: 'יֵשׁ ' + n + ' צְלָעוֹת שָׁווֹת. מְחַפְּשִׂים מִסְפָּר שֶׁמְּחַבְּרִים אוֹתוֹ ' + n + ' פְּעָמִים וּמְקַבְּלִים ' + (n * s) + '.', svg: polySvg(pts, lb, col, { ticks: 1 }) }, { say: 'בּוֹדְקִים: ' + s + ' מַתְאִים.', big: chain(all), ltr: true }, { say: 'אֹרֶךְ כָּל צֶלַע: ' + s + ' ס"מ.' }] });
    }
    var W = K.ri(r, 4, 7), H = K.ri(r, 3, 5), w = K.ri(r, 1, W - 2), h = K.ri(r, 1, H - 2), hide = K.ri(r, 0, 3), vals = [W - w, h, w, H - h], big = hide % 2 === 0 ? W : H, other = [w, H - h, W - w, h][hide], ans = vals[hide];
    return Q(r, K, { text: 'כָּל מִשְׁבֶּצֶת 1 ס"מ. מָה אֹרֶךְ הַצֶּלַע עִם סִימַן הַשְּׁאֵלָה?', svg: lShape(W, H, w, h, hide, col), answer: cm(ans), options: uniq([ans, big, big + other, ans + 1, ans - 1, other, ans + 2], 4, pos).map(cm),
      tip: 'סוֹפְרִים מִשְׁבְּצוֹת לְאֹרֶךְ הַצֶּלַע.',
      ex: [{ say: 'סוֹפְרִים מִשְׁבְּצוֹת לְאֹרֶךְ הַצֶּלַע הַוְּרֻדָּה: ' + ans + '.', svg: lShape(W, H, w, h, hide, col, true) }, { say: 'אֶפְשָׁר גַּם לְחַשֵּׁב: הַצֶּלַע הָאֲרֻכָּה שֶׁמּוּלָהּ ' + big + ', וְהַחֵלֶק הַשֵּׁנִי ' + other + '.', big: big + ' − ' + other + ' = ' + ans, ltr: true }, { say: 'אֹרֶךְ הַצֶּלַע: ' + ans + ' ס"מ.' }] });
  }

  // =====================================================================
  // WORLD 3: solids and volume
  // =====================================================================
  var SOLNAME = { cube: 'קֻבִּיָּה', box: 'תֵּבָה', prism: 'מִנְסָרָה', pyr: 'פִּירָמִידָה', tpyr: 'פִּירָמִידָה', hprism: 'מִנְסָרָה', cyl: 'גָּלִיל', cone: 'חָרוּט', ball: 'כַּדּוּר' };
  var SOLFACT = {
    cube: 'קֻבִּיָּה: יֵשׁ לָהּ 6 פֵּאוֹת, וְכֻלָּן רִבּוּעִים.', box: 'תֵּבָה: יֵשׁ לָהּ 6 פֵּאוֹת, וְהֵן מַלְבְּנִים.', prism: 'מִנְסָרָה: יֵשׁ לָהּ 2 בְּסִיסִים שָׁוִים, כָּאן הֵם מְשֻׁלָּשִׁים.',
    pyr: 'פִּירָמִידָה: יֵשׁ לָהּ בָּסִיס אֶחָד, וּפֵאוֹת שֶׁהֵן מְשֻׁלָּשִׁים וְנִפְגָּשׁוֹת בְּקָדְקוֹד.', cyl: 'גָּלִיל: יֵשׁ לוֹ 2 עִגּוּלִים שָׁוִים, וְהוּא מִתְגַּלְגֵּל.', cone: 'חָרוּט: יֵשׁ לוֹ עִגּוּל אֶחָד וְחֹד אֶחָד.', ball: 'כַּדּוּר: הוּא עָגֹל מִכָּל הַצְּדָדִים.'
  };
  var POSES = { cube: 1, box: 3, prism: 2, pyr: 2, tpyr: 1, hprism: 1, cyl: 2, cone: 3, ball: 1 };
  var TABLE = { cube: { F: 6, V: 8, E: 12, k: 4, py: 0 }, box: { F: 6, V: 8, E: 12, k: 4, py: 0 }, prism: { F: 5, V: 6, E: 9, k: 3, py: 0 }, hprism: { F: 8, V: 12, E: 18, k: 6, py: 0 }, pyr: { F: 5, V: 5, E: 8, k: 4, py: 1 }, tpyr: { F: 4, V: 4, E: 6, k: 3, py: 1 } };
  function polyh(kind, pose) {
    var v, f, vis, hid;
    if (kind === 'cube' || kind === 'box') {
      var P = kind === 'cube' ? [42, 42, 18, -15] : [[30, 54, 16, -12], [60, 26, 18, -14], [46, 18, 30, -24]][pose % 3], w = P[0], h = P[1], dx = P[2], dy = P[3], x0 = (100 - w - dx) / 2, y1 = (90 + h - dy) / 2;
      v = [[x0, y1 - h], [x0 + w, y1 - h], [x0 + w, y1], [x0, y1]]; v = v.concat(v.map(function (p) { return [p[0] + dx, p[1] + dy]; }));
      f = [[[0, 1, 2, 3], 0.85], [[0, 4, 5, 1], 0.4], [[1, 5, 6, 2], 0.62]]; vis = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 5], [5, 1], [5, 6], [6, 2]]; hid = [[3, 7], [7, 4], [7, 6]];
    } else if (kind === 'prism' && pose % 2 === 1) { // lying, like a tent
      v = [[14, 78], [54, 78], [34, 40], [44, 60], [84, 60], [64, 22]]; f = [[[0, 1, 2], 0.85], [[1, 4, 5, 2], 0.6]]; vis = [[0, 1], [1, 2], [2, 0], [1, 4], [2, 5], [4, 5]]; hid = [[0, 3], [3, 4], [3, 5]];
    } else if (kind === 'prism') { // standing on a triangle
      v = [[20, 76], [70, 80], [52, 62], [20, 32], [70, 36], [52, 18]]; f = [[[0, 1, 4, 3], 0.85], [[3, 4, 5], 0.4]]; vis = [[0, 1], [0, 3], [1, 4], [3, 4], [4, 5], [5, 3]]; hid = [[0, 2], [1, 2], [2, 5]];
    } else if (kind === 'pyr') {
      v = [[14, 74], [60, 74], [84, 56], [38, 56], pose % 2 ? [30, 14] : [49, 14]]; f = [[[0, 1, 4], 0.85], [[1, 2, 4], 0.6]]; vis = [[0, 1], [1, 2], [0, 4], [1, 4], [2, 4]]; hid = [[0, 3], [3, 2], [3, 4]];
    } else if (kind === 'tpyr') {
      v = [[14, 62], [50, 80], [86, 60], [50, 12]]; f = [[[0, 1, 3], 0.85], [[1, 2, 3], 0.6]]; vis = [[0, 1], [1, 2], [0, 3], [1, 3], [2, 3]]; hid = [[0, 2]];
    } else { // hexagonal prism
      v = [[84, 68], [67, 78], [33, 78], [16, 68], [33, 58], [67, 58]]; v = v.concat(v.map(function (p) { return [p[0], p[1] - 42]; }));
      f = [[[3, 2, 8, 9], 0.7], [[2, 1, 7, 8], 0.85], [[1, 0, 6, 7], 0.6], [[6, 7, 8, 9, 10, 11], 0.4]]; vis = [[3, 2], [2, 1], [1, 0], [3, 9], [2, 8], [1, 7], [0, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6]]; hid = [[0, 5], [5, 4], [4, 3], [4, 10], [5, 11]];
    }
    return { v: v, f: f, vis: vis, hid: hid };
  }
  // the inside of a 100 x 90 drawing of a solid. hl: { t: 'v' | 'e' | 'f' | 'allv', i }
  function solidBody(kind, pose, col, hl) {
    var s = '', D = '4 3';
    if (TABLE[kind]) {
      var g = polyh(kind, pose);
      g.f.forEach(function (fc, i) { var on = hl && hl.t === 'f' && hl.i % g.f.length === i; s += '<polygon points="' + pstr(fc[0].map(function (k) { return g.v[k]; })) + '" fill="' + (on ? PINK : col) + '" fill-opacity="' + (on ? 1 : fc[1]) + '"/>'; });
      g.hid.forEach(function (e) { s += ln(g.v[e[0]], g.v[e[1]], INK, 1.4, D); });
      g.vis.forEach(function (e) { s += ln(g.v[e[0]], g.v[e[1]], INK, 2.2); });
      if (hl && hl.t === 'e') { var e2 = g.vis[hl.i % g.vis.length]; s += ln(g.v[e2[0]], g.v[e2[1]], PINK, 6); }
      if (hl && hl.t === 'v') { var vv = g.vis[hl.i % g.vis.length][0]; s += dot(g.v[vv], 6); }
      if (hl && hl.t === 'allv') g.v.forEach(function (p) { s += dot(p, 4.5); });
      return s;
    }
    if (kind === 'cyl' && pose % 2 === 0) return path('M24 22 L24 70 A26 9 0 0 0 76 70 L76 22 Z', col, 'none', 0, null, 0.8) + path('M24 70 A26 9 0 0 1 76 70', 'none', INK, 1.4, D) + path('M24 22 L24 70 A26 9 0 0 0 76 70 L76 22', 'none', INK, 2.2) + '<ellipse cx="50" cy="22" rx="26" ry="9" fill="#ffffff"/><ellipse cx="50" cy="22" rx="26" ry="9" fill="' + col + '" fill-opacity="0.4" stroke="' + INK + '" stroke-width="2.2"/>';
    if (kind === 'cyl') return path('M22 24 L78 24 L78 72 L22 72 A9 24 0 0 1 22 24 Z', col, 'none', 0, null, 0.8) + path('M22 24 A9 24 0 0 1 22 72', 'none', INK, 1.4, D) + path('M78 24 L22 24 A9 24 0 0 0 22 72 L78 72', 'none', INK, 2.2) + '<ellipse cx="78" cy="48" rx="9" ry="24" fill="#ffffff"/><ellipse cx="78" cy="48" rx="9" ry="24" fill="' + col + '" fill-opacity="0.4" stroke="' + INK + '" stroke-width="2.2"/>';
    if (kind === 'cone' && pose % 3 === 0) return path('M50 12 L22 70 A28 9 0 0 0 78 70 Z', col, 'none', 0, null, 0.8) + path('M22 70 A28 9 0 0 1 78 70', 'none', INK, 1.4, D) + path('M50 12 L22 70 A28 9 0 0 0 78 70 Z', 'none', INK, 2.2);
    if (kind === 'cone' && pose % 3 === 1) return path('M22 22 L50 82 L78 22 Z', col, INK, 2.2, null, 0.8) + '<ellipse cx="50" cy="22" rx="28" ry="9" fill="#ffffff"/><ellipse cx="50" cy="22" rx="28" ry="9" fill="' + col + '" fill-opacity="0.4" stroke="' + INK + '" stroke-width="2.2"/>';
    if (kind === 'cone') return path('M10 48 L76 22 L76 74 Z', col, INK, 2.2, null, 0.8) + '<ellipse cx="76" cy="48" rx="9" ry="26" fill="#ffffff"/><ellipse cx="76" cy="48" rx="9" ry="26" fill="' + col + '" fill-opacity="0.4" stroke="' + INK + '" stroke-width="2.2"/>';
    return '<circle cx="50" cy="46" r="32" fill="' + col + '" fill-opacity="0.8" stroke="' + INK + '" stroke-width="2.2"/>' + path('M18 46 A32 9 0 0 1 82 46', 'none', INK, 1.4, D) + path('M18 46 A32 9 0 0 0 82 46', 'none', INK, 1.6) + '<ellipse cx="38" cy="30" rx="9" ry="5" fill="#ffffff" fill-opacity="0.6"/>';
  }
  function solidPic(kind, pose, col, hl) { return svg(100, 90, solidBody(kind, pose, col, hl), 90); }
  function solidBig(kind, pose, col, hl) { return svg(300, 170, '<g transform="translate(60,4) scale(1.8)">' + solidBody(kind, pose, col, hl) + '</g>'); }
  var SEVEN = ['cube', 'box', 'prism', 'pyr', 'cyl', 'cone', 'ball'], CONF = { cube: ['box'], box: ['cube'], prism: ['pyr'], pyr: ['cone', 'prism'], cyl: ['cone'], cone: ['pyr', 'cyl'], ball: ['cyl'] };
  var SOLCOL = ['#8e5cff', '#3aa0ff', '#ffb300', '#3ec46d'];
  function h_solidNames(r, K) {
    var kind = K.pick(r, SEVEN), pose = K.ri(r, 0, POSES[kind] - 1), col = K.pick(r, SOLCOL), others = uniq(CONF[kind].concat(K.shuffle(r, SEVEN)), 3, function (x) { return x !== kind; });
    if (r() < 0.55) return Q(r, K, { text: 'אֵיזֶה גּוּף זֶה?', svg: solidBig(kind, pose, col), answer: SOLNAME[kind], options: [SOLNAME[kind]].concat(others.map(function (k) { return SOLNAME[k]; })),
      tip: SOLFACT[kind], ex: [{ say: 'מִסְתַּכְּלִים עַל הַפֵּאוֹת שֶׁל הַגּוּף: אֵיזוֹ צוּרָה יֵשׁ לָהֶן?', svg: solidBig(kind, pose, col) }, { say: SOLFACT[kind] }] });
    var oh = {}, cols = K.shuffle(r, SOLCOL), kinds = [kind].concat(others), i;
    for (i = 0; i < 4; i++) oh[LET[i]] = solidPic(kinds[i], i === 0 ? pose : K.ri(r, 0, POSES[kinds[i]] - 1), cols[i]);
    return Q(r, K, { text: 'אֵיזֶה גּוּף הוּא ' + SOLNAME[kind] + '?', answer: LET[0], options: LET.slice(), optHtml: oh, tip: SOLFACT[kind], ex: [{ say: SOLFACT[kind], svg: solidBig(kind, pose, cols[0]) }] });
  }

  var AROUND = [
    ['כַּדּוּרֶגֶל', '⚽', 'ball'], ['כַּדּוּרְסַל', '🏀', 'ball'], ['כַּדּוּר טֶנִיס', '🎾', 'ball'], ['תַּפּוּז', '🍊', 'ball'], ['כַּדּוּר הָאָרֶץ', '🌍', 'ball'], ['בּוּעַת סַבּוֹן', '🫧', 'ball'],
    ['קֻבִּיַּת מִשְׂחָק', '🎲', 'cube'], ['קֻבִּיַּת קֶרַח', '🧊', 'cube'],
    ['אַרְגָּז', '📦', 'box'], ['לְבֵנָה', '🧱', 'box'], ['סֵפֶר', '📕', 'box'], ['סַבּוֹן', '🧼', 'box'], ['דֶּלֶת', '🚪', 'box'], ['מְקָרֵר', '', 'box'], ['קֻפְסַת נַעֲלַיִם', '', 'box'], ['קֻפְסַת גַּפְרוּרִים', '', 'box'],
    ['קֻפְסַת שִׁמּוּרִים', '🥫', 'cyl'], ['תֹּף', '🥁', 'cyl'], ['נֵר', '🕯️', 'cyl'], ['גְּלִיל נְיָר', '🧻', 'cyl'], ['סוֹלְלָה', '🔋', 'cyl'], ['בּוּל עֵץ', '🪵', 'cyl'],
    ['גְּבִיעַ גְּלִידָה', '🍦', 'cone'], ['כּוֹבַע מְסִבָּה', '🥳', 'cone'], ['פִּירָמִידָה בְּמִצְרַיִם', '', 'pyr']
  ];
  var SORTQ = [
    { t: 'לְאֵיזֶה גּוּף יֵשׁ קָדְקוֹדִים?', a: ['cube', 'box', 'prism', 'pyr'], w: [['cyl', 0], ['cyl', 1], ['ball', 0]], e: 'קָדְקוֹד הוּא פִּנָּה שֶׁל הַגּוּף. לַגָּלִיל וְלַכַּדּוּר אֵין קָדְקוֹדִים.' },
    { t: 'לְאֵיזֶה גּוּף אֵין קָדְקוֹדִים?', a: ['cyl', 'ball'], w: [['cube', 0], ['box', 1], ['prism', 0], ['pyr', 0], ['prism', 1]], e: 'קָדְקוֹד הוּא פִּנָּה שֶׁל הַגּוּף. לַגָּלִיל וְלַכַּדּוּר אֵין קָדְקוֹדִים.' },
    { t: 'אֵיזֶה גּוּף יָכוֹל לְהִתְגַּלְגֵּל?', a: ['cyl', 'ball', 'cone'], w: [['cube', 0], ['box', 0], ['box', 1], ['pyr', 0], ['prism', 0]], e: 'גּוּף שֶׁיֵּשׁ לוֹ צַד עָגֹל יָכוֹל לְהִתְגַּלְגֵּל.' },
    { t: 'לְאֵיזֶה גּוּף יֵשׁ פֵּאָה בְּצוּרַת מְשֻׁלָּשׁ?', a: ['prism', 'pyr'], w: [['cube', 0], ['box', 0], ['box', 1], ['cyl', 0], ['ball', 0]], e: 'מִסְתַּכְּלִים עַל הַפֵּאוֹת: לַמִּנְסָרָה הַזֹּאת וְלַפִּירָמִידָה יֵשׁ פֵּאוֹת שֶׁהֵן מְשֻׁלָּשִׁים.' },
    { t: 'לְאֵיזֶה גּוּף כָּל הַפֵּאוֹת הֵן רִבּוּעִים?', a: ['cube'], w: [['box', 0], ['box', 1], ['pyr', 0], ['prism', 0], ['cyl', 0]], e: 'רַק בְּקֻבִּיָּה כָּל 6 הַפֵּאוֹת הֵן רִבּוּעִים.' }
  ];
  function h_around(r, K) {
    if (r() < 0.55) {
      var it = K.pick(r, AROUND), kind = it[2], others = uniq(CONF[kind].concat(K.shuffle(r, SEVEN)), 3, function (x) { return x !== kind; });
      return Q(r, K, { text: it[0] + '. לְאֵיזֶה גּוּף זֶה דּוֹמֶה?', pic: it[1] || undefined, answer: SOLNAME[kind], options: [SOLNAME[kind]].concat(others.map(function (k) { return SOLNAME[k]; })),
        tip: SOLFACT[kind], ex: [{ say: 'הַגּוּף הַדּוֹמֶה: ' + SOLNAME[kind] + '.', svg: solidBig(kind, 0, K.pick(r, SOLCOL)) }, { say: SOLFACT[kind] }], key: it[0] + '|' + others.join() });
    }
    var q = K.pick(r, SORTQ), a = K.pick(r, q.a), pose = K.ri(r, 0, POSES[a] - 1), ws = K.sample(r, q.w, 3), cols = K.shuffle(r, SOLCOL), oh = {}, i;
    oh[LET[0]] = solidPic(a, pose, cols[0]); for (i = 0; i < 3; i++) oh[LET[i + 1]] = solidPic(ws[i][0], ws[i][1], cols[i + 1]);
    return Q(r, K, { text: q.t, answer: LET[0], options: LET.slice(), optHtml: oh, tip: q.e, ex: [{ say: q.e, svg: solidBig(a, pose, cols[0]) }, { say: 'הַגּוּף הַמַּתְאִים: ' + SOLNAME[a] + '.' }] });
  }

  // ---- comparing volumes ----
  function vessels(list) { // [{ w, h, n, lab }]
    var s = '', gap = 300 / list.length;
    list.forEach(function (v, i) {
      var cx = 300 - gap * (i + 0.5), x = cx - v.w / 2, k, row, colI;
      s += tx(cx, 12, v.lab, 16, INK) + rect(x + 2, 100 - v.h + 6, v.w - 4, v.h - 8, '#3aa0ff', 0, 0, 'none').replace('stroke-width="0"', 'stroke-width="0" fill-opacity="0.45"') + path('M' + x + ' ' + (100 - v.h) + ' L' + x + ' 100 L' + (x + v.w) + ' 100 L' + (x + v.w) + ' ' + (100 - v.h), 'none', INK, 3);
      for (k = 0; k < v.n; k++) { row = Math.floor(k / 5); colI = k % 5; var bx = cx - Math.min(v.n - row * 5, 5) * 7 + colI * 14 + 2, by = 112 + row * 20; s += poly([[bx, by], [bx + 10, by], [bx + 8, by + 14], [bx + 2, by + 14]], '#bfe3ff', 1.5); }
      s += tx(cx, 162, v.n, 15, INK);
    });
    return svg(300, 172, s);
  }
  var VSHAPE = [[30, 78], [84, 38], [52, 58], [40, 46], [66, 70]];
  var TF_VOL = [
    ['לָשִׁים כַּדּוּר פְּלַסְטֵלִינָה לְנָחָשׁ אָרֹךְ. הַנֶּפַח גָּדֵל.', 0, 'לֹא הוֹסַפְנוּ וְלֹא הוֹרַדְנוּ חֹמֶר, אָז הַנֶּפַח לֹא הִשְׁתַּנָּה.'],
    ['חוֹצִים גּוּשׁ פְּלַסְטֵלִינָה לִשְׁנַיִם. הַנֶּפַח שֶׁל הַכֹּל נִשְׁאָר שָׁוֶה.', 1, 'לֹא הוֹסַפְנוּ וְלֹא הוֹרַדְנוּ חֹמֶר, אָז הַנֶּפַח לֹא הִשְׁתַּנָּה.'],
    ['בִּכְלִי גָּבוֹהַּ תָּמִיד יֵשׁ נֶפַח גָּדוֹל יוֹתֵר.', 0, 'כְּלִי גָּבוֹהַּ יָכוֹל לִהְיוֹת צַר. מוֹדְדִים בְּכוֹסוֹת, לֹא לְפִי הַגֹּבַהּ.'],
    ['לִדְלִי יֵשׁ נֶפַח גָּדוֹל יוֹתֵר מֵאֲשֶׁר לְכוֹס.', 1, 'בִּדְלִי נִכְנָסִים הַרְבֵּה יוֹתֵר מַיִם מֵאֲשֶׁר בְּכוֹס.'],
    ['לְכַפִּית יֵשׁ נֶפַח גָּדוֹל יוֹתֵר מֵאֲשֶׁר לְסִיר.', 0, 'בְּסִיר נִכְנָסִים הַרְבֵּה יוֹתֵר מַיִם מֵאֲשֶׁר בְּכַפִּית.'],
    ['שׁוֹפְכִים מַיִם מִכּוֹס לְסִיר. כַּמּוּת הַמַּיִם לֹא מִשְׁתַּנָּה.', 1, 'לֹא הוֹסַפְנוּ וְלֹא הוֹרַדְנוּ מַיִם, אָז הַכַּמּוּת לֹא הִשְׁתַּנְּתָה.'],
    ['קֻפְסָה קְטַנָּה נִכְנֶסֶת בְּתוֹךְ קֻפְסָה גְּדוֹלָה. לַגְּדוֹלָה נֶפַח גָּדוֹל יוֹתֵר.', 1, 'הַקֻּפְסָה הַגְּדוֹלָה תּוֹפֶסֶת יוֹתֵר מָקוֹם, וְנִכְנָס בָּהּ יוֹתֵר.']
  ];
  function h_volume(r, K) {
    var t = K.ri(r, 0, 9), sh, list, a, b;
    if (t <= 5) {
      sh = K.sample(r, VSHAPE, 2); a = K.ri(r, 2, 9); b = r() < 0.15 ? a : K.ri(r, 2, 9);
      if (a !== b && r() < 0.6 && (sh[0][1] > sh[1][1]) === (a > b)) { var z = sh[0]; sh[0] = sh[1]; sh[1] = z; } // often the taller one holds less
      list = [{ w: sh[0][0], h: sh[0][1], n: a, lab: 'א' }, { w: sh[1][0], h: sh[1][1], n: b, lab: 'ב' }];
      var bigQ = r() < 0.6, ans = a === b ? 'הַנֶּפַח שָׁוֶה' : (a > b) === bigQ ? 'א' : 'ב';
      return Q(r, K, { text: 'מִלְּאוּ אֶת הַכֵּלִים בְּכוֹסוֹת. לְאֵיזֶה כְּלִי נֶפַח ' + (bigQ ? 'גָּדוֹל' : 'קָטָן') + ' יוֹתֵר?', svg: vessels(list), answer: ans, options: ['א', 'ב', 'הַנֶּפַח שָׁוֶה'], keep: true,
        tip: 'מוֹדְדִים בְּאוֹתָהּ כּוֹס וְסוֹפְרִים כּוֹסוֹת. לֹא מַחְלִיטִים לְפִי הַגֹּבַהּ.',
        ex: [{ say: 'סוֹפְרִים כַּמָּה כּוֹסוֹת נִכְנְסוּ: בִּכְלִי א ' + a + ', בִּכְלִי ב ' + b + '.', svg: vessels(list) },
          { say: a === b ? 'אוֹתוֹ מִסְפַּר כּוֹסוֹת: הַנֶּפַח שָׁוֶה, גַּם אִם כְּלִי אֶחָד גָּבוֹהַּ יוֹתֵר.' : 'בִּכְלִי ' + (a > b ? 'א' : 'ב') + ' נִכְנְסוּ יוֹתֵר כּוֹסוֹת, אָז הַנֶּפַח שֶׁלּוֹ גָּדוֹל יוֹתֵר.' }, { say: 'מוֹדְדִים בְּאוֹתָהּ כּוֹס. לֹא מַחְלִיטִים לְפִי הַגֹּבַהּ שֶׁל הַכְּלִי.' }] });
    }
    if (t <= 7) {
      sh = K.sample(r, VSHAPE, 3); var ns = K.sample(r, [2, 3, 4, 5, 6, 7, 8, 9], 3);
      list = ns.map(function (n, i) { return { w: Math.min(sh[i][0], 70), h: sh[i][1], n: n, lab: LET[i] }; });
      var sorted = list.slice().sort(function (p, q) { return p.n - q.n; }).map(function (v) { return v.lab; });
      return Q(r, K, { fmt: 'order', text: 'הַקִּישִׁי לְפִי הַסֵּדֶר: מֵהַנֶּפַח הַקָּטָן לַגָּדוֹל.', svg: vessels(list), parts: list.map(function (v) { return v.lab; }), sep: ' ', answer: sorted.join(' '),
        tip: 'סוֹפְרִים כַּמָּה כּוֹסוֹת נִכְנְסוּ בְּכָל כְּלִי.',
        ex: [{ say: 'סוֹפְרִים כּוֹסוֹת: ' + list.map(function (v) { return v.lab + ' ' + v.n; }).join(', ') + '.', svg: vessels(list) }, { say: 'מֵהַנֶּפַח הַקָּטָן לַגָּדוֹל: ' + sorted.join(', ') + '.' }] });
    }
    return bankTF(r, K, TF_VOL);
  }

  // ---- faces, edges, vertices ----
  var COUNTABLE = [['cube', 0], ['box', 0], ['box', 1], ['box', 2], ['prism', 0], ['hprism', 0], ['pyr', 0], ['pyr', 1], ['tpyr', 0]];
  var PROP = { F: 'פֵּאוֹת', V: 'קָדְקוֹדִים', E: 'מִקְצוֹעוֹת' };
  function countEx(kind, p) {
    var T = TABLE[kind], k = T.k;
    if (!T.py) return p === 'F' ? ['לְמַעְלָה וּלְמַטָּה: 2 פֵּאוֹת. מִסָּבִיב: ' + k + ' פֵּאוֹת.', '2 + ' + k + ' = ' + T.F] : p === 'V' ? ['לְמַעְלָה ' + k + ' קָדְקוֹדִים, וּלְמַטָּה ' + k + ' קָדְקוֹדִים.', k + ' + ' + k + ' = ' + T.V] : ['לְמַעְלָה ' + k + ' מִקְצוֹעוֹת, לְמַטָּה ' + k + ', וְעוֹד ' + k + ' עוֹמְדִים.', k + ' + ' + k + ' + ' + k + ' = ' + T.E];
    return p === 'F' ? ['לְמַטָּה בָּסִיס אֶחָד. מִסָּבִיב: ' + k + ' פֵּאוֹת שֶׁהֵן מְשֻׁלָּשִׁים.', '1 + ' + k + ' = ' + T.F] : p === 'V' ? ['בַּבָּסִיס ' + k + ' קָדְקוֹדִים, וְעוֹד אֶחָד לְמַעְלָה.', k + ' + 1 = ' + T.V] : ['בַּבָּסִיס ' + k + ' מִקְצוֹעוֹת, וְעוֹד ' + k + ' שֶׁעוֹלִים לַקָּדְקוֹד.', k + ' + ' + k + ' = ' + T.E];
  }
  var RIDDLE = [
    ['יֵשׁ לִי 6 פֵּאוֹת, וְכֻלָּן רִבּוּעִים.', ['cube']], ['יֵשׁ לִי 5 פֵּאוֹת וְ-5 קָדְקוֹדִים.', ['pyr']], ['יֵשׁ לִי 5 פֵּאוֹת וְ-6 קָדְקוֹדִים.', ['prism']], ['יֵשׁ לִי 4 פֵּאוֹת, וְכֻלָּן מְשֻׁלָּשִׁים.', ['tpyr']],
    ['יֵשׁ לִי 8 פֵּאוֹת וְ-12 קָדְקוֹדִים.', ['hprism']], ['יֵשׁ לִי 9 מִקְצוֹעוֹת.', ['prism']], ['יֵשׁ לִי 8 מִקְצוֹעוֹת וְ-5 פֵּאוֹת.', ['pyr']], ['יֵשׁ לִי 8 קָדְקוֹדִים וְ-12 מִקְצוֹעוֹת.', ['cube', 'box']],
    ['יֵשׁ לִי 4 קָדְקוֹדִים.', ['tpyr']], ['יֵשׁ לִי 18 מִקְצוֹעוֹת.', ['hprism']], ['יֵשׁ לִי 6 קָדְקוֹדִים וְ-9 מִקְצוֹעוֹת.', ['prism']], ['יֵשׁ לִי 6 פֵּאוֹת וְ-8 קָדְקוֹדִים.', ['cube', 'box']],
    ['יֵשׁ לִי 5 קָדְקוֹדִים.', ['pyr']], ['יֵשׁ לִי 6 מִקְצוֹעוֹת.', ['tpyr']], ['יֵשׁ לִי 12 קָדְקוֹדִים.', ['hprism']]
  ];
  var SIX = ['cube', 'box', 'prism', 'pyr', 'tpyr', 'hprism'];
  function h_faces(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, SOLCOL), c, kind, pose, T, i, oh, cols;
    if (t <= 3) {
      c = K.pick(r, COUNTABLE); kind = c[0]; pose = c[1]; T = TABLE[kind]; var p = K.pick(r, ['F', 'V', 'E']), e = countEx(kind, p);
      return Q(r, K, { text: 'כַּמָּה ' + PROP[p] + ' יֵשׁ לַגּוּף?', svg: solidBig(kind, pose, col), answer: T[p], options: uniq([T[p], T.F, T.V, T.E, T[p] + 1, T[p] - 1, T[p] + 2], 4),
        tip: 'סוֹפְרִים גַּם אֶת מָה שֶׁמֵּאָחוֹר. הַקַּוִּים הַמְּקֻוְקָוִים מַרְאִים אוֹתוֹ.',
        ex: [{ say: 'פֵּאָה הִיא צַד שָׁטוּחַ, מִקְצוֹעַ הוּא קַו בֵּין שְׁתֵּי פֵּאוֹת, קָדְקוֹד הוּא פִּנָּה.', svg: solidBig(kind, pose, col, p === 'V' ? { t: 'allv' } : null) }, { say: e[0], big: e[1], ltr: true }, { say: 'סוֹפְרִים גַּם אֶת מָה שֶׁמֵּאָחוֹר: יֵשׁ ' + T[p] + ' ' + PROP[p] + '.' }] });
    }
    if (t <= 5) { // what is marked in pink
      c = K.pick(r, COUNTABLE); kind = c[0]; pose = c[1]; var what = K.pick(r, ['v', 'e', 'f']), idx = K.ri(r, 0, 11), names = { v: 'קָדְקוֹד', e: 'מִקְצוֹעַ', f: 'פֵּאָה' };
      return Q(r, K, { text: 'מָה מְסֻמָּן בְּוָרֹד?', svg: solidBig(kind, pose, col, { t: what, i: idx }), answer: names[what], options: ['קָדְקוֹד', 'מִקְצוֹעַ', 'פֵּאָה'], keep: true,
        tip: 'פֵּאָה הִיא צַד שָׁטוּחַ, מִקְצוֹעַ הוּא קַו, קָדְקוֹד הוּא פִּנָּה.',
        ex: [{ say: 'פֵּאָה הִיא צַד שָׁטוּחַ שֶׁל הַגּוּף. מִקְצוֹעַ הוּא קַו שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת. קָדְקוֹד הוּא פִּנָּה.', svg: solidBig(kind, pose, col, { t: what, i: idx }) }, { say: what === 'v' ? 'מְסֻמֶּנֶת פִּנָּה: זֶה קָדְקוֹד.' : what === 'e' ? 'מְסֻמָּן קַו: זֶה מִקְצוֹעַ.' : 'מְסֻמָּן צַד שָׁטוּחַ: זוֹ פֵּאָה.' }] });
    }
    if (t <= 6) { // the shape of a face
      if (r() < 0.4) return Q(r, K, { text: 'אֵיזוֹ צוּרָה הִיא כָּל פֵּאָה שֶׁל הַקֻּבִּיָּה?', svg: solidBig('cube', 0, col), answer: 'רִבּוּעַ', options: ['רִבּוּעַ', 'מְשֻׁלָּשׁ', 'עִגּוּל', 'מְחֻמָּשׁ'], tip: SOLFACT.cube, ex: [{ say: SOLFACT.cube, svg: solidBig('cube', 0, col, { t: 'f', i: 0 }) }], key: 'cubeface' + col });
      var tri = K.pick(r, [['prism', 0], ['prism', 1], ['pyr', 0], ['pyr', 1], ['tpyr', 0]]), wr = K.sample(r, [['cube', 0], ['box', 0], ['box', 1], ['box', 2], ['hprism', 0]], 3); cols = K.shuffle(r, SOLCOL); oh = {};
      oh[LET[0]] = solidPic(tri[0], tri[1], cols[0]); for (i = 0; i < 3; i++) oh[LET[i + 1]] = solidPic(wr[i][0], wr[i][1], cols[i + 1]);
      return Q(r, K, { text: 'לְאֵיזֶה גּוּף יֵשׁ פֵּאָה שֶׁהִיא מְשֻׁלָּשׁ?', answer: LET[0], options: LET.slice(), optHtml: oh, tip: 'מִסְתַּכְּלִים עַל הַצּוּרָה שֶׁל כָּל פֵּאָה.',
        ex: [{ say: 'מִסְתַּכְּלִים עַל הַצּוּרָה שֶׁל כָּל פֵּאָה. כָּאן יֵשׁ פֵּאָה שֶׁהִיא מְשֻׁלָּשׁ.', svg: solidBig(tri[0], tri[1], cols[0], { t: 'f', i: tri[0] === 'prism' && tri[1] === 0 ? 1 : 0 }) }] });
    }
    var rd = K.pick(r, RIDDLE), a = K.pick(r, rd[1]), wrong = K.sample(r, SIX.filter(function (k) { return rd[1].indexOf(k) < 0; }), 3), kinds = [a].concat(wrong), poses = kinds.map(function (k) { return k === 'box' ? K.ri(r, 0, 2) : 0; });
    cols = K.shuffle(r, SOLCOL); oh = {}; for (i = 0; i < 4; i++) oh[LET[i]] = solidPic(kinds[i], poses[i], cols[i]);
    T = TABLE[a];
    return Q(r, K, { text: rd[0] + ' מִי אֲנִי?', answer: LET[0], options: LET.slice(), optHtml: oh, tip: 'בּוֹדְקִים כָּל גּוּף מוּל הָרְמָזִים.',
      ex: [{ say: 'בּוֹדְקִים כָּל גּוּף מוּל הָרְמָזִים, וְסוֹפְרִים גַּם אֶת מָה שֶׁמֵּאָחוֹר.', svg: solidBig(a, poses[0], cols[0]) }, { say: 'לַגּוּף הַזֶּה ' + T.F + ' פֵּאוֹת, ' + T.V + ' קָדְקוֹדִים וְ-' + T.E + ' מִקְצוֹעוֹת.' }] });
  }

  // ---- buildings of cubes ----
  function isoCubes(hm, col, o) { // hm[i][j] = height of the column; i goes right-front, j goes left-front
    o = o || {}; var A = hm.length, B = hm[0].length, H = 0, i, j, k, gi = o.gapCol ? 1.45 : 1, gk = o.gapK ? 1.5 : 1;
    for (i = 0; i < A; i++) for (j = 0; j < B; j++) H = Math.max(H, hm[i][j]);
    var wU = ((A - 1) * gi + (B - 1) * gi + 2) * 0.87, hU = ((A - 1) * gi + (B - 1) * gi + 2) * 0.5 + (H - 1) * gk + 1, s = Math.min(26, 280 / wU, 160 / hU), a = s * 0.87, b = s * 0.5;
    var ox = 150 + ((B - 1) * gi - (A - 1) * gi) * a / 2, oy = 85 - hU * s / 2 + ((H - 1) * gk) * s, body = '', d, O;
    for (d = 0; d <= A + B - 2; d++) for (i = 0; i < A; i++) {
      j = d - i; if (j < 0 || j >= B) continue;
      for (k = 0; k < hm[i][j]; k++) {
        O = [ox + (i - j) * gi * a, oy + (i + j) * gi * b - k * gk * s];
        body += poly([[O[0] - a, O[1] + b], [O[0], O[1] + 2 * b], [O[0], O[1] + 2 * b + s], [O[0] - a, O[1] + b + s]], col, 1.5, ' fill-opacity="0.75"')
          + poly([[O[0] + a, O[1] + b], [O[0], O[1] + 2 * b], [O[0], O[1] + 2 * b + s], [O[0] + a, O[1] + b + s]], col, 1.5, ' fill-opacity="1"')
          + poly([O, [O[0] + a, O[1] + b], [O[0], O[1] + 2 * b], [O[0] - a, O[1] + b]], '#ffffff', 1.5) + poly([O, [O[0] + a, O[1] + b], [O[0], O[1] + 2 * b], [O[0] - a, O[1] + b]], col, 1.5, ' fill-opacity="0.4"');
      }
    }
    return svg(300, 170, body);
  }
  function flat(A, B, h) { var m = [], i, j; for (i = 0; i < A; i++) { m.push([]); for (j = 0; j < B; j++) m[i].push(h); } return m; }
  function seenCount(hm) {
    var A = hm.length, B = hm[0].length, n = 0, i, j, k;
    for (i = 0; i < A; i++) for (j = 0; j < B; j++) for (k = 0; k < hm[i][j]; k++) if (k === hm[i][j] - 1 || (i + 1 < A ? hm[i + 1][j] : 0) <= k || (j + 1 < B ? hm[i][j + 1] : 0) <= k) n++;
    return n;
  }
  function stairs(r, K) {
    var A, B, m, i, j, tot, tries = 0, full;
    do {
      A = K.ri(r, 2, 3); B = K.ri(r, 1, 3); m = []; tot = 0; full = true;
      for (i = 0; i < A; i++) { m.push([]); for (j = 0; j < B; j++) { m[i].push(i === 0 && j === 0 ? K.ri(r, 2, 3) : Math.max(0, Math.min(i > 0 ? m[i - 1][j] : 9, j > 0 ? m[i][j - 1] : 9) - K.ri(r, 0, 1))); tot += m[i][j]; if (m[i][j] !== m[0][0]) full = false; } }
    } while (tries++ < 60 && (tot < 4 || tot > 14 || full || m[A - 1][0] === 0 || m[0][B - 1] === 0));
    return { m: m, tot: tot };
  }
  function wall(rowsN, col) { // front view: rows of cubes, the bottom row first
    var u = Math.min(24, 280 / rowsN[0], 150 / rowsN.length), s = '', i, k, y0 = 85 + rowsN.length * u / 2;
    for (i = 0; i < rowsN.length; i++) for (k = 0; k < rowsN[i]; k++) s += rect(150 - rowsN[i] * u / 2 + k * u, y0 - (i + 1) * u, u, u, col, 2);
    return svg(300, 170, s);
  }
  function h_cubes(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, SOLCOL), a, b, h, n, m;
    if (t <= 1) {
      do { a = K.ri(r, 1, 5); b = K.ri(r, 1, 4); } while (a * b < 3 || a < b); n = a * b; m = flat(a, b, 1); var row = []; while (row.length < b) row.push(a);
      return Q(r, K, { text: 'כַּמָּה קֻבִּיּוֹת יֵשׁ כָּאן?', svg: isoCubes(m, col), answer: n, options: uniq([n, n + 1, n - 1, a + b, n + 2], 4, pos),
        tip: 'סוֹפְרִים שׁוּרָה אַחֲרֵי שׁוּרָה.',
        ex: b === 1 ? [{ say: 'סוֹפְרִים אֶת הַקֻּבִּיּוֹת בַּשּׁוּרָה, אַחַת אַחַת: ' + n + '.', svg: isoCubes(m, col) }] : [{ say: 'יֵשׁ ' + b + ' שׁוּרוֹת, וּבְכָל שׁוּרָה ' + a + ' קֻבִּיּוֹת.', svg: isoCubes(m, col) }, { say: 'מְחַבְּרִים שׁוּרָה אַחֲרֵי שׁוּרָה.', big: chain(row), ltr: true }] });
    }
    if (t <= 5) {
      do { a = K.ri(r, 2, 4); b = K.ri(r, 2, 3); h = K.ri(r, 2, 3); } while (a * b * h > 36); n = a * b * h; m = flat(a, b, h); var L = a * b, lay = []; while (lay.length < h) lay.push(L);
      return Q(r, K, { text: 'כַּמָּה קֻבִּיּוֹת יֵשׁ בַּתֵּבָה?', svg: isoCubes(m, col), answer: n, options: uniq([n, n - (a - 1) * (b - 1) * (h - 1), L, n + L, n - L, n + 2], 4, pos),
        tip: 'סוֹפְרִים גַּם אֶת הַקֻּבִּיּוֹת שֶׁלֹּא רוֹאִים. סוֹפְרִים שִׁכְבָה אַחֲרֵי שִׁכְבָה.',
        ex: [{ say: 'מַפְרִידִים אֶת הַשְּׁכָבוֹת. בְּכָל שִׁכְבָה ' + L + ' קֻבִּיּוֹת, וְיֵשׁ ' + h + ' שְׁכָבוֹת.', svg: isoCubes(m, col, { gapK: 1 }) }, { say: 'מְחַבְּרִים שִׁכְבָה אַחֲרֵי שִׁכְבָה. סוֹפְרִים גַּם אֶת הַקֻּבִּיּוֹת שֶׁלֹּא רוֹאִים.', big: chain(lay), ltr: true }, { say: 'אֶפְשָׁר גַּם בְּכֶפֶל: ' + h + ' פְּעָמִים ' + L + '.', big: h + ' × ' + L + ' = ' + n, ltr: true }] });
    }
    if (t <= 7) {
      var st = stairs(r, K), seen = seenCount(st.m), cols2 = []; n = st.tot;
      st.m.forEach(function (rw) { rw.forEach(function (x) { if (x > 0) cols2.push(x); }); });
      return Q(r, K, { text: 'כַּמָּה קֻבִּיּוֹת יֵשׁ בַּמִּבְנֶה?', svg: isoCubes(st.m, col), answer: n, options: uniq([n, seen, n - 1, n + 1, n + 2, n - 2], 4, pos),
        tip: 'סוֹפְרִים עַמּוּד אַחֲרֵי עַמּוּד, גַּם אֶת הַקֻּבִּיּוֹת שֶׁמִּתַּחַת.',
        ex: [{ say: 'מַפְרִידִים אֶת הַמִּבְנֶה לְעַמּוּדִים, וְסוֹפְרִים כַּמָּה קֻבִּיּוֹת בְּכָל עַמּוּד.', svg: isoCubes(st.m, col, { gapCol: 1 }) }, { say: 'סוֹפְרִים גַּם אֶת הַקֻּבִּיּוֹת שֶׁתּוֹמְכוֹת מִלְּמַטָּה וְלֹא רוֹאִים אוֹתָן.', big: chain(cols2), ltr: true }] });
    }
    var n0, d, k, rw2, top; do { n0 = K.ri(r, 5, 10); d = K.ri(r, 1, 2); k = K.ri(r, 3, 4); top = n0 - d * (k - 1); } while (top < 1);
    rw2 = []; for (a = 0; a < k; a++) rw2.push(n0 - d * a); n = rw2.reduce(function (x, y) { return x + y; }, 0);
    return Q(r, K, { text: 'בְּכָל שִׁכְבָה יֵשׁ פָּחוֹת קֻבִּיּוֹת. כַּמָּה קֻבִּיּוֹת יֵשׁ בַּמִּבְנֶה?', svg: wall(rw2, col), answer: n, options: uniq([n, n - top, n - n0, n + d, n - d, top], 4, pos),
      tip: 'סוֹפְרִים כַּמָּה קֻבִּיּוֹת בְּכָל שִׁכְבָה, וּמְחַבְּרִים.',
      ex: [{ say: 'לְמַטָּה ' + n0 + ' קֻבִּיּוֹת, וּבְכָל שִׁכְבָה ' + (d === 1 ? 'קֻבִּיָּה אַחַת פָּחוֹת.' : '2 קֻבִּיּוֹת פָּחוֹת.'), svg: wall(rw2, col) }, { say: 'מְחַבְּרִים שִׁכְבָה אַחֲרֵי שִׁכְבָה.', big: chain(rw2), ltr: true }] });
  }

  // =====================================================================
  // WORLD 4: the clock
  // =====================================================================
  function clockB(cx, cy, R, h, m, o) {
    o = o || {}; var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#fffdf5" stroke="' + INK + '" stroke-width="' + (R > 60 ? 4 : 3) + '"/>', i, a;
    if (o.shade) s += path('M' + cx + ' ' + (cy - R + 3) + ' A' + (R - 3) + ' ' + (R - 3) + ' 0 0 1 ' + cx + ' ' + (cy + R - 3) + ' Z', '#ffb300', 'none', 0, null, 0.35);
    for (i = 1; i <= 12; i++) { a = i * 30 * RAD; if (!o.few || i % 3 === 0) s += tx(cx + Math.sin(a) * R * 0.78, cy - Math.cos(a) * R * 0.78, i, o.few ? R * 0.32 : R * 0.21, INK); else s += '<circle cx="' + n1(cx + Math.sin(a) * R * 0.82) + '" cy="' + n1(cy - Math.cos(a) * R * 0.82) + '" r="' + n1(R * 0.045) + '" fill="' + INK + '"/>'; }
    var ha = ((h % 12) + (o.exact ? 0 : m / 60)) * 30 * RAD, ma = m * 6 * RAD;
    s += ln([cx, cy], [cx + Math.sin(ma) * R * 0.7, cy - Math.cos(ma) * R * 0.7], '#8e5cff', Math.max(2.5, R * 0.055));
    s += ln([cx, cy], [cx + Math.sin(ha) * R * 0.44, cy - Math.cos(ha) * R * 0.44], INK, Math.max(4, R * 0.095));
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(R * 0.07) + '" fill="' + PINK + '"/>';
  }
  function clockBig(h, m, o) { return svg(300, 170, clockB(150, 85, 80, h, m, o)); }
  function clockPic(h, m, o) { o = o || {}; o.few = 1; return svg(100, 100, clockB(50, 50, 46, h, m, o), 86); }
  function digi(x, y, s, w) { return rect(x, y, w, w * 0.42, '#2b2140', 3, 8) + tx(x + w / 2, y + w * 0.22, s, w * 0.27, '#7cffb2').replace('Arial, sans-serif', 'Courier New, monospace'); }
  function digiBig(s) { return svg(300, 110, digi(60, 17, s, 180)); }
  function wrap12(h) { return ((h + 11) % 12) + 1; }
  function T12(t) { return wrap12(Math.floor(t / 2)) + ':' + (t % 2 ? '30' : '00'); } // t = half-hours
  function T24(t) { return Math.floor(t / 2) + ':' + (t % 2 ? '30' : '00'); }
  function lab(t) { return wrap12(Math.floor(t / 2)) + (t % 2 ? ' וָחֵצִי' : ''); }
  function dur(n) { return n === 1 ? 'חֲצִי שָׁעָה' : n === 2 ? 'שָׁעָה אַחַת' : n === 3 ? 'שָׁעָה וָחֵצִי' : n === 4 ? 'שְׁעָתַיִם' : n === 5 ? 'שְׁעָתַיִם וָחֵצִי' : n % 2 === 0 ? (n / 2) + ' שָׁעוֹת' : ((n - 1) / 2) + ' שָׁעוֹת וָחֵצִי'; }
  function tline(labels, split) {
    var n = labels.length, x0 = 28, w = 264, st = w / (n - 1), s = ln([x0 - 12, 62], [x0 + w + 12, 62], INK, 2.5), i, x;
    for (i = 0; i < n; i++) { x = x0 + i * st; s += ln([x, 55], [x, 69], INK, 2) + tx(x, 84, labels[i], n > 7 ? 10 : 13, INK); if (i < n - 1) s += path('M' + n1(x) + ' 52 Q' + n1(x + st / 2) + ' ' + n1(52 - Math.min(36, st * 0.8)) + ' ' + n1(x + st) + ' 52', 'none', split != null && i >= split ? '#3aa0ff' : PINK, 2.5); }
    return svg(320, 100, s);
  }
  function h_hours(r, K) {
    var t = K.ri(r, 0, 9), h = K.ri(r, 1, 12), i;
    if (t <= 2) return Q(r, K, { text: 'מָה הַשָּׁעָה?', svg: clockBig(h, 0), answer: h, options: uniq([h, wrap12(h + 1), wrap12(h - 1), 12, 6, 3], 4),
      tip: 'הַמָּחוֹג הַגָּדוֹל עַל 12: שָׁעָה שְׁלֵמָה. הַמָּחוֹג הַקָּטָן מַרְאֶה אֶת הַשָּׁעָה.',
      ex: [{ say: 'הַמָּחוֹג הַגָּדוֹל עַל 12: זוֹ שָׁעָה שְׁלֵמָה.', svg: clockBig(h, 0) }, { say: 'הַמָּחוֹג הַקָּטָן מַרְאֶה אֶת הַשָּׁעָה: ' + h + '.' }] });
    if (t <= 5) {
      var oh = {}, pics = [clockPic(h, 0), h === 12 ? clockPic(2, 0) : clockPic(12, h * 5, { exact: 1 }), clockPic(wrap12(h + 1), 0), clockPic(wrap12(h - 1), 0)];
      for (i = 0; i < 4; i++) oh[LET[i]] = pics[i];
      return Q(r, K, { text: 'אֵיזֶה שָׁעוֹן מַרְאֶה אֶת הַשָּׁעָה ' + h + '?', answer: LET[0], options: LET.slice(), optHtml: oh,
        tip: 'בְּשָׁעָה שְׁלֵמָה הַמָּחוֹג הַגָּדוֹל עַל 12, וְהַמָּחוֹג הַקָּטָן עַל הַשָּׁעָה.',
        ex: [{ say: 'בְּשָׁעָה שְׁלֵמָה הַמָּחוֹג הַגָּדוֹל עַל 12.', svg: clockBig(h, 0) }, { say: 'הַמָּחוֹג הַקָּטָן, הַקָּצָר, מַצְבִּיעַ עַל ' + h + '.' }] });
    }
    var d = K.pick(r, [1, -1, 2, -2]), ans = wrap12(h + d), txt = d === 1 ? 'מָה תִּהְיֶה הַשָּׁעָה בְּעוֹד שָׁעָה?' : d === 2 ? 'מָה תִּהְיֶה הַשָּׁעָה בְּעוֹד שְׁעָתַיִם?' : d === -1 ? 'מָה הָיְתָה הַשָּׁעָה לִפְנֵי שָׁעָה?' : 'מָה הָיְתָה הַשָּׁעָה לִפְנֵי שְׁעָתַיִם?';
    return Q(r, K, { text: txt, svg: clockBig(h, 0), answer: ans, options: uniq([ans, h, wrap12(h - d), wrap12(h + 2 * d), wrap12(h + 3)], 4),
      tip: d > 0 ? 'בְּעוֹד שָׁעָה הַמָּחוֹג הַקָּטָן עוֹבֵר לַמִּסְפָּר הַבָּא.' : 'לִפְנֵי שָׁעָה הַמָּחוֹג הַקָּטָן הָיָה עַל הַמִּסְפָּר הַקּוֹדֵם.',
      ex: [{ say: 'עַכְשָׁו הַשָּׁעָה ' + h + '.', svg: clockBig(h, 0) }, { say: (d > 0 ? 'הַמָּחוֹג הַקָּטָן מִתְקַדֵּם ' : 'הַמָּחוֹג הַקָּטָן חוֹזֵר ') + (Math.abs(d) === 1 ? 'מִסְפָּר אֶחָד' : '2 מִסְפָּרִים') + ', אֶל ' + ans + '.', svg: clockBig(ans, 0) }, { say: d > 0 ? 'הַשָּׁעָה תִּהְיֶה ' + ans + '.' : 'הַשָּׁעָה הָיְתָה ' + ans + '.' }] });
  }
  function halfEx(h) {
    return [{ say: 'הַמָּחוֹג הַגָּדוֹל עָבַר חֲצִי סִבּוּב, מִ-12 עַד 6. זוֹ חֲצִי שָׁעָה.', svg: clockBig(h, 30, { shade: 1 }) }, { say: 'הַמָּחוֹג הַקָּטָן בְּאֶמְצַע הַדֶּרֶךְ בֵּין ' + h + ' לְ-' + wrap12(h + 1) + '.' }, { say: 'הַשָּׁעָה ' + h + ' וָחֵצִי.' }];
  }
  function h_half(r, K) {
    var t = K.ri(r, 0, 9), h = K.ri(r, 1, 12), i, hf = function (x) { return wrap12(x) + ' וָחֵצִי'; };
    if (t <= 2) return Q(r, K, { text: 'מָה הַשָּׁעָה?', svg: clockBig(h, 30), answer: hf(h), options: [hf(h), hf(h + 1), hf(h - 1), '6'],
      tip: 'הַמָּחוֹג הַגָּדוֹל עַל 6: עָבְרָה חֲצִי שָׁעָה. הַמָּחוֹג הַקָּטָן בֵּין שְׁנֵי מִסְפָּרִים.', ex: halfEx(h) });
    if (t <= 5) {
      var oh = {}, pics = [clockPic(h, 30), clockPic(h, 30, { exact: 1 }), clockPic(wrap12(h + 1), 30), clockPic(h, 0)];
      for (i = 0; i < 4; i++) oh[LET[i]] = pics[i];
      return Q(r, K, { text: 'אֵיזֶה שָׁעוֹן מַרְאֶה ' + h + ' וָחֵצִי?', answer: LET[0], options: LET.slice(), optHtml: oh,
        tip: 'בְּ"וָחֵצִי" הַמָּחוֹג הַגָּדוֹל עַל 6, וְהַמָּחוֹג הַקָּטָן בְּאֶמְצַע הַדֶּרֶךְ לַמִּסְפָּר הַבָּא.', ex: halfEx(h) });
    }
    var cur = h * 2 + K.ri(r, 0, 1), fwd = r() < 0.5, nx = cur + (fwd ? 1 : -1), H = Math.floor(cur / 2), M = cur % 2 ? 30 : 0;
    return Q(r, K, { text: fwd ? 'מָה תִּהְיֶה הַשָּׁעָה בְּעוֹד חֲצִי שָׁעָה?' : 'מָה הָיְתָה הַשָּׁעָה לִפְנֵי חֲצִי שָׁעָה?', svg: clockBig(H, M), answer: lab(nx), options: uniq([lab(nx), lab(cur), lab(cur + (fwd ? -1 : 1)), lab(cur + (fwd ? 2 : -2)), lab(cur + 3)], 4),
      tip: 'בַּחֲצִי שָׁעָה הַמָּחוֹג הַגָּדוֹל עוֹשֶׂה חֲצִי סִבּוּב.',
      ex: [{ say: 'עַכְשָׁו הַשָּׁעָה ' + lab(cur) + '.', svg: clockBig(H, M) }, { say: fwd ? 'בַּחֲצִי שָׁעָה הַמָּחוֹג הַגָּדוֹל מִתְקַדֵּם חֲצִי סִבּוּב.' : 'לִפְנֵי חֲצִי שָׁעָה הַמָּחוֹג הַגָּדוֹל הָיָה חֲצִי סִבּוּב אָחוֹרָה.', svg: clockBig(Math.floor(nx / 2), nx % 2 ? 30 : 0) }, { say: fwd ? 'הַשָּׁעָה תִּהְיֶה ' + lab(nx) + '.' : 'הַשָּׁעָה הָיְתָה ' + lab(nx) + '.' }] });
  }
  var DIGI_EX = 'מִשְּׂמֹאל לַנְּקֻדָּתַיִם: הַשָּׁעוֹת. מִיָּמִין: הַדַּקּוֹת.';
  function digiSay(h, m) { return m ? '30 דַּקּוֹת הֵן חֲצִי שָׁעָה, כִּי 30 + 30 = 60. הַשָּׁעָה ' + h + ' וָחֵצִי.' : '00 דַּקּוֹת: שָׁעָה שְׁלֵמָה. הַשָּׁעָה ' + h + '.'; }
  function h_digital(r, K) {
    var t = K.ri(r, 0, 9), h = K.ri(r, 1, 12), m = r() < 0.5 ? 0 : 30, s = h + ':' + (m ? '30' : '00'), i;
    if (t <= 1) {
      var oh = {}, pics = [clockPic(h, m), m ? (h === 6 ? clockPic(5, 30) : clockPic(6, (h * 5) % 60, { exact: 1 })) : (h === 12 ? clockPic(11, 0) : clockPic(12, h * 5, { exact: 1 })), clockPic(wrap12(h + 1), m), clockPic(h, m ? 0 : 30)];
      for (i = 0; i < 4; i++) oh[LET[i]] = pics[i];
      return Q(r, K, { text: 'אֵיזֶה שְׁעוֹן מְחוֹגִים מַרְאֶה אוֹתָהּ שָׁעָה?', svg: digiBig(s), answer: LET[0], options: LET.slice(), optHtml: oh, tip: DIGI_EX,
        ex: [{ say: DIGI_EX, svg: digiBig(s) }, { say: digiSay(h, m), svg: clockBig(h, m) }] });
    }
    if (t <= 3) {
      var sw = m ? '6:' + (h * 5 % 60 < 10 ? '0' : '') + (h * 5 % 60) : '12:' + (h * 5 < 10 ? '0' : '') + (h * 5 % 60 === 0 ? '00' : h * 5);
      return Q(r, K, { text: 'אֵיזֶה שָׁעוֹן דִּיגִיטָלִי מַרְאֶה אוֹתָהּ שָׁעָה?', svg: clockBig(h, m), answer: s, options: uniq([s, sw, wrap12(h + 1) + ':' + (m ? '30' : '00'), h + ':' + (m ? '00' : '30'), wrap12(h - 1) + ':' + (m ? '30' : '00')], 4), optLtr: true, tip: DIGI_EX,
        ex: [{ say: 'הַמָּחוֹג הַקָּטָן מַרְאֶה אֶת הַשָּׁעוֹת: ' + h + '. הַמָּחוֹג הַגָּדוֹל מַרְאֶה אֶת הַדַּקּוֹת.', svg: clockBig(h, m) }, { say: DIGI_EX, svg: digiBig(s) }, { say: digiSay(h, m) }] });
    }
    if (t <= 4) {
      h = K.ri(r, 1, 9); s = h + ':' + (m ? '30' : '00'); var same = r() < 0.5, left = '0' + h + ':' + (m ? '30' : '00'), right = same ? s : r() < 0.5 ? h + ':' + (m ? '00' : '30') : (h + 1) + ':' + (m ? '30' : '00');
      return TF(r, K, { text: 'שְׁנֵי הַשְּׁעוֹנִים מַרְאִים אוֹתָהּ שָׁעָה.', svg: svg(300, 80, digi(8, 12, left, 136) + digi(156, 12, right, 136)), tip: 'הָאֶפֶס בַּהַתְחָלָה לֹא מְשַׁנֶּה אֶת הַשָּׁעָה.',
        ex: [{ say: 'הָאֶפֶס בַּהַתְחָלָה לֹא מְשַׁנֶּה אֶת הַשָּׁעָה: ' + left + ' הִיא ' + s + '.' }, { say: same ? 'שְׁנֵי הַשְּׁעוֹנִים מַרְאִים אוֹתָהּ שָׁעָה.' : 'בַּשָּׁעוֹן הַשֵּׁנִי כָּתוּב ' + right + ', וְזוֹ שָׁעָה אַחֶרֶת.' }] }, same);
    }
    if (t <= 7) {
      var H = K.ri(r, 13, 23), part = H <= 18 ? 'אַחַר הַצָּהֳרַיִם' : H <= 21 ? 'בָּעֶרֶב' : 'בַּלַּיְלָה', mm = m ? '30' : '00', a12 = H - 12;
      return Q(r, K, { text: H + ':' + mm + ' הִיא אֵיזוֹ שָׁעָה ' + part + '?', svg: digiBig(H + ':' + mm), answer: a12 + ':' + mm, options: uniq([a12, wrap12(H - 10), wrap12(a12 + 1), wrap12(a12 - 1), wrap12(a12 + 2)], 4).map(function (x) { return x + ':' + mm; }), optLtr: true,
        tip: 'אַחֲרֵי 12:00 בַּצָּהֳרַיִם מוֹרִידִים 12 מֵהַשָּׁעוֹת.',
        ex: [{ say: 'אַחֲרֵי 12:00 בַּצָּהֳרַיִם מַמְשִׁיכִים לִסְפֹּר: 13, 14, 15 וְכֵן הָלְאָה.', svg: tline(['12', '13', '14', '15', '16', '17', '18']) }, { say: 'מוֹרִידִים 12 מֵהַשָּׁעוֹת.', big: H + ' − 12 = ' + a12, ltr: true }, { say: H + ':' + mm + ' הִיא ' + a12 + ':' + mm + ' ' + part + '.' }] });
    }
    var n = K.ri(r, 3, 4), pool = [], k; for (k = 12; k <= 45; k++) pool.push(k);
    var ts = K.sample(r, pool, n), sorted = ts.slice().sort(function (x, y) { return x - y; }).map(T24);
    return Q(r, K, { fmt: 'order', text: 'הַקִּישִׁי לְפִי הַסֵּדֶר: מֵהַמֻּקְדָּם לַמְּאֻחָר.', parts: ts.map(T24), sep: ' ', answer: sorted.join(' '),
      tip: 'מַתְחִילִים בַּבֹּקֶר וּמִתְקַדְּמִים עַד הָעֶרֶב. 13:00 הִיא אַחֲרֵי 12:00.',
      ex: [{ say: 'מְסַדְּרִים מֵהַבֹּקֶר עַד הָעֶרֶב. קֹדֶם מִסְתַּכְּלִים עַל הַשָּׁעוֹת, שֶׁמִּשְּׂמֹאל לַנְּקֻדָּתַיִם.', big: sorted.join('  →  '), ltr: true }, { say: 'שָׁעוֹת כְּמוֹ 13:00 וְ-20:00 הֵן אַחֲרֵי הַצָּהֳרַיִם, אָז הֵן מְאֻחָרוֹת יוֹתֵר.' }] });
  }
  function twoClocks(a, b) { // a = start (on the right), b = end; half-hours
    return svg(300, 150, clockB(228, 75, 62, Math.floor(a / 2), a % 2 ? 30 : 0) + clockB(72, 75, 62, Math.floor(b / 2), b % 2 ? 30 : 0) + ln([165, 75], [137, 75], PINK, 4) + poly([[131, 75], [141, 68], [141, 82]], PINK, 1));
  }
  function h_duration(r, K) {
    var t = K.ri(r, 0, 9), a, d, b, i, labs;
    if (t <= 3) { // how long
      do { a = K.ri(r, 2, 21); d = K.ri(r, 2, 8); b = a + d; } while (b > 24 || (a % 2 && r() < 0.5));
      labs = []; for (i = a; i <= b; i++) labs.push(T12(i));
      return Q(r, K, { text: 'הַתְחָלָה: ' + T12(a) + '. סוֹף: ' + T12(b) + '. כַּמָּה זְמַן עָבַר?', svg: twoClocks(a, b), answer: dur(d), options: uniq([d, d + 1, d - 1, d + 2, d - 2], 4, pos).map(dur),
        tip: 'קוֹפְצִים מֵהַהַתְחָלָה עַד הַסּוֹף וְסוֹפְרִים אֶת הַקְּפִיצוֹת.',
        ex: [{ say: 'קוֹפְצִים מֵהַהַתְחָלָה עַד הַסּוֹף. כָּל קְפִיצָה הִיא חֲצִי שָׁעָה.', svg: tline(labs) }, { say: 'יֵשׁ ' + d + ' קְפִיצוֹת שֶׁל חֲצִי שָׁעָה. 2 חֲצָאֵי שָׁעוֹת הֵם שָׁעָה אַחַת.' }, { say: 'עָבְרוּ: ' + dur(d) + '.' }] });
    }
    if (t <= 6) { // when does it end
      do { a = K.ri(r, 2, 21); d = K.ri(r, 1, 6); b = a + d; } while (b > 24);
      var hops = [T12(a)], cur = a; while (cur + 2 <= b) { cur += 2; hops.push(T12(cur)); } if (cur < b) hops.push(T12(b));
      return Q(r, K, { text: 'מַתְחִילִים בְּ-' + T12(a) + '. אַחֲרֵי ' + dur(d) + ' מְסַיְּמִים. מָה הַשָּׁעָה?', svg: clockBig(Math.floor(a / 2), a % 2 ? 30 : 0), answer: T12(b), options: uniq([b, b + 1, b - 1, b + 2, a + 1], 4).map(T12), optLtr: true,
        tip: 'קֹדֶם מִתְקַדְּמִים בְּשָׁעוֹת שְׁלֵמוֹת, אַחַר כָּךְ בַּחֵצִי.',
        ex: [{ say: 'קֹדֶם מִתְקַדְּמִים בְּשָׁעוֹת שְׁלֵמוֹת, וְאַחַר כָּךְ מוֹסִיפִים אֶת חֲצִי הַשָּׁעָה, אִם יֵשׁ.', big: hops.join(' → '), ltr: true }, { say: 'מְסַיְּמִים בְּ-' + T12(b) + '.', svg: clockBig(Math.floor(b / 2), b % 2 ? 30 : 0) }] });
    }
    if (t <= 8) { // through 12:00
      do { a = K.ri(r, 8, 11); b = K.ri(r, 1, 5); } while (a - b === 6);
      var ans = 12 - a + b; labs = []; for (i = a; i <= 12; i++) labs.push(i); for (i = 1; i <= b; i++) labs.push(i);
      var hrs = function (n) { return n === 1 ? 'שָׁעָה אַחַת' : n === 2 ? 'שְׁעָתַיִם' : n + ' שָׁעוֹת'; };
      return Q(r, K, { text: 'מִ-' + a + ' בַּבֹּקֶר עַד ' + b + ' אַחַר הַצָּהֳרַיִם. כַּמָּה שָׁעוֹת עָבְרוּ?', answer: ans, options: uniq([ans, a - b, ans + 1, ans - 1, ans + 2], 4, pos),
        tip: 'קוֹפְצִים קֹדֶם עַד 12, וְאַחַר כָּךְ מִ-12 וָהָלְאָה.',
        ex: [{ say: 'מִ-' + a + ' עַד 12: ' + hrs(12 - a) + '.', svg: tline(labs, 12 - a) }, { say: 'מִ-12 עַד ' + b + ': ' + hrs(b) + '.' }, { say: 'מְחַבְּרִים אֶת שְׁתֵּי הַקְּפִיצוֹת: עָבְרוּ ' + ans + ' שָׁעוֹת.', big: (12 - a) + ' + ' + b + ' = ' + ans, ltr: true }] });
    }
    a = K.ri(r, 7, 11); b = K.ri(r, 13, 18); labs = []; for (i = a; i <= b; i++) labs.push(i);
    return Q(r, K, { text: 'מִ-' + a + ':00 עַד ' + b + ':00. כַּמָּה שָׁעוֹת עָבְרוּ?', svg: svg(300, 80, digi(156, 12, a + ':00', 136) + digi(8, 12, b + ':00', 136)), answer: b - a, options: uniq([b - a, Math.abs(a - (b - 12)), b - a + 1, b - a - 1, b - a + 2], 4, pos),
      tip: 'בְּשָׁעוֹן שֶׁל 24 שָׁעוֹת סוֹפְרִים שָׁעָה אַחֲרֵי שָׁעָה.',
      ex: [{ say: 'סוֹפְרִים שָׁעָה אַחֲרֵי שָׁעָה, מִ-' + a + ' עַד ' + b + '.', svg: tline(labs) }, { say: 'אֶפְשָׁר גַּם לְחַשֵּׁב: ' + b + ' פָּחוֹת ' + a + '.', big: b + ' − ' + a + ' = ' + (b - a), ltr: true }] });
  }

  // =====================================================================
  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'geo', grade: 2,
    tiles: [
      { id: 'geo2poly', world: 'כְּפַר הַמְּצֻלָּעִים', name: 'מְצֻלָּעִים וּמְשֻׁלָּשִׁים', icon: '🔷', bld: 'house1', hero: 'מְצֻלִּי', levels: [
        { name: 'מְצֻלָּעִים: צְלָעוֹת וְקָדְקוֹדִים', f: h_poly },
        { name: 'זָוִית יְשָׁרָה: כֵּן אוֹ לֹא', f: h_right },
        { name: 'זָוִיּוֹת יְשָׁרוֹת בִּמְצֻלָּעִים', f: h_rightPoly },
        { name: 'סוּגֵי מְשֻׁלָּשִׁים', f: h_tri },
        { name: 'פֵּרוּק וְהַרְכָּבָה', f: h_cut }
      ] },
      { id: 'geo2ruler', world: 'שְׁבִיל הַסַּרְגֵּל', name: 'מְדִידַת אֹרֶךְ וְהֶקֵּף', icon: '📏', bld: 'houseAlt1', hero: 'סַרְגֵּלִי', levels: [
        { name: 'מְדִידָה בְּסַרְגֵּל', f: h_ruler },
        { name: 'סֶנְטִימֶטֶר אוֹ מֶטֶר', f: h_units },
        { name: 'מְדִידָה שֶׁלֹּא מַתְחִילָה בְּ-0', f: h_broken },
        { name: 'קַו שָׁבוּר', f: h_line },
        { name: 'הֶקֵּף מְצֻלָּע', f: h_perim },
        { name: 'צֶלַע חֲסֵרָה', f: h_missing }
      ] },
      { id: 'geo2solid', world: 'מְעָרַת הַגּוּפִים', name: 'גּוּפִים וְנֶפַח', icon: '🧊', bld: 'pyramid', hero: 'קֻבִּי', levels: [
        { name: 'שְׁמוֹת הַגּוּפִים', f: h_solidNames },
        { name: 'גּוּפִים בַּסְּבִיבָה', f: h_around },
        { name: 'הַשְׁוָאַת נְפָחִים', f: h_volume },
        { name: 'פֵּאוֹת, מִקְצוֹעוֹת, קָדְקוֹדִים', f: h_faces },
        { name: 'מִבְנִים מִקֻּבִּיּוֹת', f: h_cubes }
      ] },
      { id: 'geo2clock', world: 'מִגְדַּל הַשָּׁעוֹן', name: 'שָׁעוֹן וּזְמַן', icon: '🕒', bld: 'tower', hero: 'תִּיקְתַּק', levels: [
        { name: 'שָׁעוֹת שְׁלֵמוֹת', f: h_hours },
        { name: 'חֲצָאֵי שָׁעוֹת', f: h_half },
        { name: 'שָׁעוֹן דִּיגִיטָלִי', f: h_digital },
        { name: 'כַּמָּה זְמַן עָבַר', f: h_duration }
      ] }
    ]
  });
})();
