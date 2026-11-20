(function () {
  'use strict';
  // ---------- geometry and measurement, grade 3 (new curriculum): angles, triangles, area, boxes, time ----------
  var INK = '#3b2a55', PU = '#8e5cff', PK = '#ff5fa2', BL = '#3aa0ff', OR = '#ffb300', GR = '#3ec46d', RED = '#ff3b3b';
  var LILAC = '#e4d8ff', CELL = '#c9b6ff', GRIDC = '#d5cdea', PAPER = '#fff0b3';
  var RAD = Math.PI / 180;
  var LET = ['א', 'ב', 'ג', 'ד'];

  // ---------- small svg helpers ----------
  function n1(x) { return Math.round(x * 10) / 10; }
  function S(w, h, body) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + body + '</svg>'; }
  function ln(a, b, col, sw, dash) {
    return '<line x1="' + n1(a[0]) + '" y1="' + n1(a[1]) + '" x2="' + n1(b[0]) + '" y2="' + n1(b[1]) + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 3) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  }
  function pstr(pts) { return pts.map(function (p) { return n1(p[0]) + ',' + n1(p[1]); }).join(' '); }
  function pg(pts, fill, col, sw, op) {
    return '<polygon points="' + pstr(pts) + '" fill="' + (fill || 'none') + '" stroke="' + (col || 'none') + '" stroke-width="' + (sw || 0) + '" stroke-linejoin="round"' + (op ? ' fill-opacity="' + op + '"' : '') + '/>';
  }
  function dot(p, rr, col) { return '<circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="' + rr + '" fill="' + (col || INK) + '"/>'; }
  function tx(p, s, size, col) {
    return '<text x="' + n1(p[0]) + '" y="' + n1(p[1]) + '" font-size="' + (size || 14) + '" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle" dominant-baseline="central" fill="' + (col || INK) + '">' + s + '</text>';
  }
  function rc(x, y, w, h, fill, col, sw, rx) {
    return '<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '" fill="' + (fill || 'none') + '" stroke="' + (col || 'none') + '" stroke-width="' + (sw || 0) + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
  }
  function pth(d, col, sw, fill) { return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function unit(a, p) { var d = dist(a, p) || 1; return [(a[0] - p[0]) / d, (a[1] - p[1]) / d]; }
  function rotPts(pts, deg, mir) {
    var c = Math.cos(deg * RAD), s = Math.sin(deg * RAD);
    return pts.map(function (p) { var x = mir ? -p[0] : p[0]; return [x * c - p[1] * s, x * s + p[1] * c]; });
  }
  function fit(pts, w, h, m, maxS) { // one scale for all the points, centred in the box
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var s = Math.min((w - 2 * m) / Math.max(x1 - x0, 1e-6), (h - 2 * m) / Math.max(y1 - y0, 1e-6));
    if (maxS) s = Math.min(s, maxS);
    return pts.map(function (p) { return [(p[0] - (x0 + x1) / 2) * s + w / 2, (p[1] - (y0 + y1) / 2) * s + h / 2]; });
  }
  // the mark of an angle at P between PA and PB: an arc, or a filled sector
  function arc(P, A, B, rr, col, fill) {
    var ua = unit(A, P), ub = unit(B, P), cr = ua[0] * ub[1] - ua[1] * ub[0];
    var p1 = n1(P[0] + ua[0] * rr) + ' ' + n1(P[1] + ua[1] * rr), p2 = n1(P[0] + ub[0] * rr) + ' ' + n1(P[1] + ub[1] * rr);
    var a = 'A' + rr + ' ' + rr + ' 0 0 ' + (cr > 0 ? 1 : 0) + ' ' + p2;
    return fill ? '<path d="M' + n1(P[0]) + ' ' + n1(P[1]) + ' L' + p1 + ' ' + a + ' Z" fill="' + col + '" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>'
      : '<path d="M' + p1 + ' ' + a + '" fill="none" stroke="' + col + '" stroke-width="2.5"/>';
  }
  function sqPts(P, A, B, s) { // a square with a corner on P, one side along PA, on the side of B
    var u = unit(A, P), n = [-u[1], u[0]];
    if (n[0] * (B[0] - P[0]) + n[1] * (B[1] - P[1]) < 0) n = [u[1], -u[0]];
    return [P, [P[0] + u[0] * s, P[1] + u[1] * s], [P[0] + (u[0] + n[0]) * s, P[1] + (u[1] + n[1]) * s], [P[0] + n[0] * s, P[1] + n[1] * s]];
  }
  function TF(r, K, o, truth) { o.fmt = 'tf'; return K.tf(r, o, truth); }
  function nums(ans, cands, min) { // the answer and three wrong numbers, sorted
    var out = [ans], lo = min == null ? 1 : min, d = 1;
    cands.forEach(function (c) { if (out.length < 4 && c === Math.round(c) && c >= lo && out.indexOf(c) < 0) out.push(c); });
    while (out.length < 4) { if (out.indexOf(ans + d) < 0) out.push(ans + d); if (out.length < 4 && ans - d >= lo && out.indexOf(ans - d) < 0) out.push(ans - d); d++; }
    return out.sort(function (a, b) { return a - b; });
  }
  function stmt(r, K, list, pre) { // a true / false sentence: [sentence, truth, the rule]
    var s = K.pick(r, list);
    return TF(r, K, { text: s[0], tip: s[2], key: pre + s[0] }, s[1]);
  }

  // ---------- angles ----------
  var ACUTE = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70], OBT = [110, 115, 120, 125, 130, 135, 140, 145, 150]; // up to 150, so that obtuse never looks flat
  var ANG3 = ACUTE.concat([90, 90, 90, 90]).concat(OBT);
  function rndRot(r, K) { return K.ri(r, 0, 23) * 15; }
  function leg(r, K) { return K.ri(r, 5, 10) / 10; }
  function angBody(V, A, B, o) {
    var rr = Math.max(8, Math.min(o.arcR || 17, 0.45 * Math.min(dist(V, A), dist(V, B))));
    return (o.noArc ? '' : arc(V, A, B, rr, o.arcCol || PU, o.arcFill)) + ln(V, A, o.colA || o.col || INK, o.sw || 4) + ln(V, B, o.colB || o.col || INK, o.sw || 4) + dot(V, o.vr || 4.5, o.vcol || INK);
  }
  // an angle of `deg` degrees, turned by `rt`, legs l1 and l2 (0..1). o.corner puts the corner of a sheet of paper on the vertex
  function angle(w, h, deg, rt, l1, l2, o) {
    o = o || {};
    var a = rt * RAD, b = (rt + deg) * RAD, u = [Math.cos(a), -Math.sin(a)], n = [Math.cos(a + Math.PI / 2), -Math.sin(a + Math.PI / 2)];
    var pts = [[0, 0], [100 * l1 * u[0], 100 * l1 * u[1]], [100 * l2 * Math.cos(b), -100 * l2 * Math.sin(b)]];
    if (o.corner) pts.push([52 * u[0], 52 * u[1]], [52 * (u[0] + n[0]), 52 * (u[1] + n[1])], [52 * n[0], 52 * n[1]]);
    var top = o.letter ? 12 : 0, P = fit(pts, w, h - top, o.m || 14, o.maxS || 1.1).map(function (p) { return [p[0], p[1] + top]; }), out = '';
    if (o.corner) out += pg([P[0], P[3], P[4], P[5]], PAPER, OR, 2);
    out += angBody(P[0], P[1], P[2], o);
    if (o.letter) out += tx([w - 12, 13], o.letter, o.letSize || 14);
    return o.body ? out : S(w, h, out);
  }
  // drawings that are NOT an angle, around (0,0)
  var NON = [
    [['M-40 10 C-20 -30 0 20 20 -15 S45 -35 50 -30', 'M-40 10 C-20 45 5 5 25 35 S45 45 52 30'], ['M-40 10 Q0 -55 50 -25', 'M-40 10 Q5 60 50 25']],
    [['M-40 15 L50 -25', 'M-40 15 Q10 60 50 20'], ['M-40 15 L50 -25', 'M-40 15 C-15 50 0 0 25 35 S45 40 52 25']],
    [['M-45 -18 L45 -18', 'M-45 18 L45 18'], ['M-45 -30 L40 -12', 'M-20 14 L45 34']],
    [['M-50 15 C-25 -45 10 45 50 -15'], ['M-48 20 Q0 -60 48 20']],
    [['M-42 0 C-42 -36 42 -36 42 0 C42 36 -42 36 -42 0 Z'], ['M-35 0 C-35 -35 10 -40 30 -20 S45 25 15 30 S-35 30 -35 0 Z']]
  ];
  var NONSAY = [
    'שְׁנֵי הַקַּוִּים הַוְּרֻדִּים לֹא יְשָׁרִים, לָכֵן זֹאת לֹא זָוִית.',
    'הַקַּו הַוָּרֹד לֹא יָשָׁר, לָכֵן זֹאת לֹא זָוִית.',
    'הַקַּוִּים לֹא נִפְגָּשִׁים בִּנְקֻדָּה אַחַת. אֵין קָדְקוֹד, לָכֵן זֹאת לֹא זָוִית.',
    'זֶה קַו עָקֹם אֶחָד. אֵין כָּאן שְׁתֵּי שׁוֹקַיִם יְשָׁרוֹת, לָכֵן זֹאת לֹא זָוִית.',
    'זֹאת צוּרָה סְגוּרָה וַעֲגֻלָּה. אֵין בָּהּ קַוִּים יְשָׁרִים, לָכֵן זֹאת לֹא זָוִית.'
  ];
  function nonBody(kind, v, rt, cx, cy, sc, hl) {
    var ps = NON[kind][v], out = '';
    ps.forEach(function (d, i) { out += pth(d, hl && (kind === 0 || (kind === 1 && i === 1)) ? PK : INK, 4 / sc); });
    if (kind < 2) out += dot([-40, kind === 0 ? 10 : 15], 4.5 / sc);
    return '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rt + ') scale(' + sc + ')">' + out + '</g>';
  }
  var ANG_TIP = 'לְזָוִית יֵשׁ קָדְקוֹד אֶחָד וּשְׁתֵּי שׁוֹקַיִם יְשָׁרוֹת.';
  function angEx(deg, rt, l1, l2) {
    return [
      { say: 'בַּזָּוִית יֵשׁ נְקֻדָּה אַחַת מְשֻׁתֶּפֶת: הַקָּדְקוֹד.', svg: angle(300, 150, deg, rt, l1, l2, { vcol: PK, vr: 8 }) },
      { say: 'מֵהַקָּדְקוֹד יוֹצְאִים שְׁנֵי קַוִּים יְשָׁרִים: הַשּׁוֹקַיִם. לָכֵן זֹאת זָוִית.', svg: angle(300, 150, deg, rt, l1, l2, { col: PK, sw: 5 }) }
    ];
  }
  var A1S = [
    ['לְכָל זָוִית יֵשׁ קָדְקוֹד אֶחָד.', true, ANG_TIP],
    ['לְכָל זָוִית יֵשׁ שְׁתֵּי שׁוֹקַיִם.', true, ANG_TIP],
    ['הַשּׁוֹקַיִם שֶׁל זָוִית הֵן קַוִּים יְשָׁרִים.', true, ANG_TIP],
    ['לְזָוִית יֵשׁ שְׁנֵי קָדְקוֹדִים.', false, ANG_TIP],
    ['שְׁנֵי קַוִּים עֲקֻמִּים שֶׁנִּפְגָּשִׁים יוֹצְרִים זָוִית.', false, 'הַשּׁוֹקַיִם שֶׁל זָוִית הֵן תָּמִיד קַוִּים יְשָׁרִים.'],
    ['הַשּׁוֹקַיִם שֶׁל זָוִית יוֹצְאוֹת מֵהַקָּדְקוֹד.', true, ANG_TIP]
  ];
  function A1(r, K) {
    var t = r(), deg = K.pick(r, ANG3), rt = rndRot(r, K), l1 = leg(r, K), l2 = leg(r, K), kind, v, nrt;
    if (t < 0.4) {
      if (r() < 0.5) return TF(r, K, { text: 'הַאִם זֹאת זָוִית?', svg: angle(300, 150, deg, rt, l1, l2), tip: ANG_TIP, ex: angEx(deg, rt, l1, l2), key: 'a1y' + [deg, rt, l1, l2] }, true);
      kind = K.ri(r, 0, 4); v = K.ri(r, 0, 1); nrt = rndRot(r, K);
      return TF(r, K, { text: 'הַאִם זֹאת זָוִית?', svg: S(300, 150, nonBody(kind, v, nrt, 150, 75, 1, false)), tip: ANG_TIP,
        ex: [{ say: 'בְּזָוִית יֵשׁ קָדְקוֹד אֶחָד וּשְׁתֵּי שׁוֹקַיִם יְשָׁרוֹת.', svg: S(300, 150, nonBody(kind, v, nrt, 150, 75, 1, true)) }, { say: NONSAY[kind] }], key: 'a1n' + [kind, v, nrt] }, false);
    }
    if (t < 0.65) {
      var kinds = K.sample(r, [0, 1, 2, 3, 4], 3), pos = K.ri(r, 0, 3), oh = {}, k = 0, i;
      for (i = 0; i < 4; i++) {
        if (i === pos) oh[LET[i]] = angle(100, 80, deg, rt, l1, l2, { maxS: 0.5, letter: LET[i], m: 12 });
        else { oh[LET[i]] = S(100, 80, nonBody(kinds[k], K.ri(r, 0, 1), rndRot(r, K), 50, 42, 0.52, false) + tx([88, 13], LET[i], 14)); k++; }
      }
      return K.q(r, { text: 'אֵיזֶה צִיּוּר הוּא זָוִית?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: ANG_TIP, ex: angEx(deg, rt, l1, l2), key: 'a1c' + [deg, rt, pos, kinds] });
    }
    if (t < 0.9) {
      var part = K.ri(r, 0, 2), o = part === 0 ? { vcol: PK, vr: 9 } : part === 1 ? (r() < 0.5 ? { colA: PK, sw: 5 } : { colB: PK, sw: 5 }) : { arcFill: true, arcCol: PK, arcR: 30 };
      var names = ['קָדְקוֹד', 'שׁוֹק', 'מִפְתָּח'];
      l1 = Math.max(l1, 0.8); l2 = Math.max(l2, 0.8);
      return K.q(r, { text: 'מָה צָבוּעַ בְּוָרֹד?', svg: angle(300, 150, deg, rt, l1, l2, o), answer: names[part], options: names, keep: true, tip: ANG_TIP,
        ex: [{ say: ['הַקָּדְקוֹד הוּא הַנְּקֻדָּה שֶׁמִּמֶּנָּה יוֹצְאוֹת שְׁתֵּי הַשּׁוֹקַיִם.', 'שׁוֹק הִיא קַו יָשָׁר שֶׁיּוֹצֵא מֵהַקָּדְקוֹד. לְכָל זָוִית יֵשׁ שְׁתֵּי שׁוֹקַיִם.', 'הַמִּפְתָּח הוּא הַפְּתִיחָה שֶׁבֵּין שְׁתֵּי הַשּׁוֹקַיִם.'][part], svg: angle(300, 150, deg, rt, l1, l2, o) }],
        key: 'a1p' + [part, deg, rt, o.colA ? 1 : 0] });
    }
    return stmt(r, K, A1S, 'a1s');
  }

  var KEY_TIP = 'הָאֹרֶךְ שֶׁל הַשּׁוֹקַיִם לֹא מְשַׁנֶּה. מִסְתַּכְּלִים עַל הַמִּפְתָּח.';
  var A2S = [
    ['כְּשֶׁמַּאֲרִיכִים אֶת הַשּׁוֹקַיִם, הַזָּוִית גְּדֵלָה.', false, KEY_TIP],
    ['לְזָוִית עִם שׁוֹקַיִם קְצָרוֹת יָכוֹל לִהְיוֹת מִפְתָּח גָּדוֹל.', true, KEY_TIP],
    ['זָוִית עִם שׁוֹקַיִם אֲרֻכּוֹת הִיא תָּמִיד זָוִית גְּדוֹלָה.', false, KEY_TIP],
    ['גֹּדֶל הַזָּוִית נִקְבָּע לְפִי הַמִּפְתָּח שֶׁבֵּין הַשּׁוֹקַיִם.', true, KEY_TIP]
  ];
  // several angles laid on each other: the same vertex, the same first leg
  function overlay(list) { // [{deg, l, col, letter}]
    var pts = [[0, 0], [100, 0]], out = '', P;
    list.forEach(function (a) { pts.push([100 * a.l * Math.cos(a.deg * RAD), -100 * a.l * Math.sin(a.deg * RAD)]); pts.push([(100 * a.l + 16) * Math.cos(a.deg * RAD), -(100 * a.l + 16) * Math.sin(a.deg * RAD)]); });
    P = fit(pts, 300, 160, 14, 1.3);
    list.slice().sort(function (x, y) { return y.deg - x.deg; }).forEach(function (a) { var i = 2 + 2 * list.indexOf(a); out += arc(P[0], P[1], P[i], 22 + 9 * list.indexOf(a), a.col, false); });
    out += ln(P[0], P[1], INK, 4);
    list.forEach(function (a, i) { out += ln(P[0], P[2 + 2 * i], a.col, 4) + tx(P[3 + 2 * i], a.letter, 15, a.col); });
    return S(300, 160, out + dot(P[0], 5));
  }
  function A2(r, K) {
    var t = r(), all = [20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 135, 150, 160];
    if (t < 0.12) return stmt(r, K, A2S, 'a2s');
    if (t < 0.4) { // three angles in order
      var ds = K.shuffle(r, K.sample(r, [20, 45, 70, 100, 130, 160], 3)), mx = Math.max.apply(null, ds), mn = Math.min.apply(null, ds), body = '', ls = [], i, cols = [PK, BL, GR];
      for (i = 0; i < 3; i++) {
        ls.push(ds[i] === mn ? 1 : ds[i] === mx ? 0.5 : K.pick(r, [0.6, 0.8]));
        body += '<g transform="translate(' + (200 - 100 * i) + ' 0)">' + angle(100, 130, ds[i], rndRot(r, K), ls[i], ls[i], { body: true, maxS: 0.5, m: 10, letter: LET[i], arcR: 12 }) + '</g>';
      }
      var ord = [0, 1, 2].sort(function (x, y) { return ds[x] - ds[y]; }).map(function (j) { return LET[j]; });
      return K.q(r, { fmt: 'order', text: 'הַקִּישִׁי לְפִי הַסֵּדֶר: מֵהַזָּוִית הַקְּטַנָּה לַגְּדוֹלָה.', svg: S(300, 130, body), parts: LET.slice(0, 3), sep: ' ', answer: ord.join(' '), tip: KEY_TIP,
        ex: [{ say: 'מַנִּיחִים אֶת הַזָּוִיּוֹת זוֹ עַל זוֹ: קָדְקוֹד עַל קָדְקוֹד וְשׁוֹק עַל שׁוֹק.', svg: overlay(ds.map(function (d, j) { return { deg: d, l: ls[j], col: cols[j], letter: LET[j] }; })) },
          { say: 'הַסֵּדֶר מֵהַקְּטַנָּה לַגְּדוֹלָה: ' + ord.join(', ') + '.' }, { say: KEY_TIP }], key: 'a2o' + ds });
    }
    var a, b, eq = r() < 0.2, la, lb;
    a = K.pick(r, all);
    if (eq) b = a; else do { b = K.pick(r, all); } while (Math.abs(a - b) < 25);
    if (eq) { la = r() < 0.5 ? 1 : 0.45; lb = la === 1 ? 0.45 : 1; }
    else if (r() < 0.6) { la = a < b ? 1 : 0.45; lb = a < b ? 0.45 : 1; }
    else { la = K.pick(r, [0.5, 0.75, 1]); lb = K.pick(r, [0.5, 0.75, 1]); }
    var svg = S(300, 140, '<g transform="translate(150 0)">' + angle(150, 140, a, rndRot(r, K), la, la, { body: true, maxS: 0.62, letter: 'א' }) + '</g>' + angle(150, 140, b, rndRot(r, K), lb, lb, { body: true, maxS: 0.62, letter: 'ב' }));
    var ans = eq ? 'שָׁווֹת' : a > b ? 'א' : 'ב', sm = a < b ? 'א' : 'ב', bg = a < b ? 'ב' : 'א';
    return K.q(r, { text: 'אֵיזוֹ זָוִית גְּדוֹלָה יוֹתֵר?', svg: svg, answer: ans, options: ['א', 'ב', 'שָׁווֹת'], keep: true, tip: KEY_TIP,
      ex: [{ say: 'מַנִּיחִים אֶת זָוִית א עַל זָוִית ב: קָדְקוֹד עַל קָדְקוֹד וְשׁוֹק עַל שׁוֹק.', svg: overlay([{ deg: a, l: la, col: PK, letter: 'א' }, { deg: b, l: lb, col: BL, letter: 'ב' }]) },
        { say: eq ? 'הַשּׁוֹק הַשְּׁנִיָּה שֶׁל א נִמְצֵאת בְּדִיּוּק עַל הַשּׁוֹק שֶׁל ב. הַזָּוִיּוֹת שָׁווֹת.' : 'הַשּׁוֹק הַשְּׁנִיָּה שֶׁל ' + sm + ' נִמְצֵאת בְּתוֹךְ זָוִית ' + bg + ', לָכֵן ' + bg + ' גְּדוֹלָה יוֹתֵר.' },
        { say: KEY_TIP }], key: 'a2c' + [a, b, la, lb] });
  }

  var RIGHT_TIP = 'זָוִית יְשָׁרָה מַתְאִימָה בְּדִיּוּק לְפִנָּה שֶׁל דַּף.';
  function cornerEx(deg, rt, l1, l2) { // the grade 3 way: compare with the corner of a sheet, never measure
    var s2 = deg === 90 ? 'שְׁתֵּי הַשּׁוֹקַיִם עַל שְׂפַת הַדַּף: זֹאת זָוִית יְשָׁרָה.'
      : deg === 180 ? 'שְׁתֵּי הַשּׁוֹקַיִם יוֹצְרוֹת קַו יָשָׁר: זֹאת זָוִית שְׁטוּחָה.'
        : deg < 90 ? 'הַשּׁוֹק הַשְּׁנִיָּה בְּתוֹךְ הַדַּף: קְטַנָּה מִזָּוִית יְשָׁרָה. זֹאת זָוִית חַדָּה.'
          : 'הַשּׁוֹק הַשְּׁנִיָּה מִחוּץ לַדַּף: גְּדוֹלָה מִזָּוִית יְשָׁרָה. זֹאת זָוִית קֵהָה.';
    return [{ say: 'מַנִּיחִים פִּנָּה שֶׁל דַּף עַל הַקָּדְקוֹד, לְאֹרֶךְ שׁוֹק אַחַת.', svg: angle(300, 160, deg, rt, l1, l2, { corner: true, colB: PK, sw: 5 }) }, { say: s2 }];
  }
  var A3S = [
    ['פִּנָּה שֶׁל דַּף הִיא זָוִית יְשָׁרָה.', true, RIGHT_TIP],
    ['זָוִית יְשָׁרָה נִשְׁאֶרֶת יְשָׁרָה גַּם כְּשֶׁמְּסוֹבְבִים אֶת הַדַּף.', true, RIGHT_TIP],
    ['זָוִית יְשָׁרָה הִיא רַק זָוִית שֶׁעוֹמֶדֶת זְקוּפָה.', false, 'זָוִית יְשָׁרָה נִשְׁאֶרֶת יְשָׁרָה בְּכָל מַצָּב, גַּם כְּשֶׁהִיא מְסוֹבֶבֶת.'],
    ['בְּפִנָּה שֶׁל חַלּוֹן מַלְבֵּנִי יֵשׁ זָוִית יְשָׁרָה.', true, RIGHT_TIP]
  ];
  function A3(r, K) {
    var t = r(), rt = rndRot(r, K), l1 = leg(r, K), l2 = leg(r, K), i, oh = {}, pos = K.ri(r, 0, 3);
    if (t < 0.1) return stmt(r, K, A3S, 'a3s');
    if (t < 0.5) {
      var ds = K.shuffle(r, [K.pick(r, [55, 60, 65, 70]), K.pick(r, [110, 115, 120, 125]), K.pick(r, [180, 30, 150, 40, 140])]), k = 0;
      for (i = 0; i < 4; i++) oh[LET[i]] = angle(100, 80, i === pos ? 90 : ds[k++], i === pos ? rt : rndRot(r, K), i === pos ? l1 : leg(r, K), i === pos ? l2 : leg(r, K), { maxS: 0.5, letter: LET[i], m: 12, arcR: 11 });
      return K.q(r, { text: 'אֵיזוֹ זָוִית יְשָׁרָה?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: RIGHT_TIP, ex: cornerEx(90, rt, l1, l2), key: 'a3c' + [rt, pos, ds] });
    }
    if (t < 0.8) {
      var isR = r() < 0.5, d = isR ? 90 : K.pick(r, [50, 55, 60, 65, 70, 110, 115, 120, 125, 130]);
      return TF(r, K, { text: 'הַאִם זֹאת זָוִית יְשָׁרָה?', svg: angle(300, 150, d, rt, l1, l2), tip: RIGHT_TIP, ex: cornerEx(d, rt, l1, l2), key: 'a3t' + [d, rt, l1, l2] }, isR);
    }
    var hr = K.pick(r, [3, 9]), wrong = K.sample(r, [1, 2, 4, 5, 6, 7, 8, 10, 11], 3), w = 0, hrs = [];
    for (i = 0; i < 4; i++) { hrs.push(i === pos ? hr : wrong[w++]); oh[LET[i]] = S(100, 80, clock(50, 41, 35, hrs[i], 0, { small: true }) + tx([90, 12], LET[i], 14)); }
    return K.q(r, { text: 'בְּאֵיזֶה שָׁעוֹן יֵשׁ זָוִית יְשָׁרָה בֵּין הַמְּחוֹגִים?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: RIGHT_TIP,
      ex: [{ say: 'בְּשָׁעָה ' + hr + ':00 הַמָּחוֹג הָאָרֹךְ עַל 12 וְהַמָּחוֹג הַקָּצָר עַל ' + hr + '.', svg: S(300, 170, clock(150, 85, 78, hr, 0, { hcol: PK, mcol: PK })) }, { say: 'בֵּין הַמְּחוֹגִים יֵשׁ זָוִית יְשָׁרָה, כְּמוֹ פִּנָּה שֶׁל דַּף.' }], key: 'a3k' + hrs });
  }

  var TYPES = ['זָוִית חַדָּה', 'זָוִית יְשָׁרָה', 'זָוִית קֵהָה', 'זָוִית שְׁטוּחָה'];
  var TYPE_TIP = 'מַשְׁוִים לְזָוִית יְשָׁרָה: חַדָּה קְטַנָּה מִמֶּנָּה, קֵהָה גְּדוֹלָה מִמֶּנָּה.';
  function degOf(ty, r, K) { return ty === 0 ? K.pick(r, ACUTE) : ty === 1 ? 90 : ty === 2 ? K.pick(r, OBT) : 180; }
  var A4S = [
    ['זָוִית חַדָּה קְטַנָּה מִזָּוִית יְשָׁרָה.', true, TYPE_TIP],
    ['זָוִית קֵהָה קְטַנָּה מִזָּוִית יְשָׁרָה.', false, TYPE_TIP],
    ['זָוִית קֵהָה גְּדוֹלָה מִזָּוִית יְשָׁרָה וּקְטַנָּה מִזָּוִית שְׁטוּחָה.', true, TYPE_TIP],
    ['הַשּׁוֹקַיִם שֶׁל זָוִית שְׁטוּחָה יוֹצְרוֹת קַו יָשָׁר.', true, 'בְּזָוִית שְׁטוּחָה שְׁתֵּי הַשּׁוֹקַיִם יוֹצְרוֹת יַחַד קַו יָשָׁר.'],
    ['זָוִית חַדָּה גְּדוֹלָה מִזָּוִית קֵהָה.', false, TYPE_TIP],
    ['זָוִית שְׁטוּחָה קְטַנָּה מִזָּוִית יְשָׁרָה.', false, 'זָוִית שְׁטוּחָה גְּדוֹלָה מִזָּוִית יְשָׁרָה וְגַם מִזָּוִית קֵהָה.']
  ];
  function A4(r, K) {
    var t = r(), ty = K.ri(r, 0, 3), deg = degOf(ty, r, K), rt = rndRot(r, K), l1 = leg(r, K), l2 = leg(r, K);
    if (t < 0.12) return stmt(r, K, A4S, 'a4s');
    if (t < 0.65) return K.q(r, { text: 'מָה סוּג הַזָּוִית?', svg: angle(300, 150, deg, rt, l1, l2), answer: TYPES[ty], options: TYPES.slice(), keep: true, tip: TYPE_TIP, ex: cornerEx(deg, rt, l1, l2), key: 'a4n' + [deg, rt, l1, l2] });
    var order = K.shuffle(r, [0, 1, 2, 3]), oh = {}, pos = order.indexOf(ty), i;
    for (i = 0; i < 4; i++) oh[LET[i]] = i === pos ? angle(100, 80, deg, rt, l1, l2, { maxS: 0.5, letter: LET[i], m: 12, arcR: 11 }) : angle(100, 80, degOf(order[i], r, K), rndRot(r, K), leg(r, K), leg(r, K), { maxS: 0.5, letter: LET[i], m: 12, arcR: 11 });
    return K.q(r, { text: 'אֵיזוֹ זָוִית הִיא ' + TYPES[ty] + '?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: TYPE_TIP, ex: cornerEx(deg, rt, l1, l2), key: 'a4c' + [deg, rt, order] });
  }

  // ---------- polygons ----------
  function regPts(n) { var p = [], i; for (i = 0; i < n; i++) p.push([Math.cos((i * 360 / n - 90) * RAD), Math.sin((i * 360 / n - 90) * RAD)]); return p; }
  var POLYS = [
    [[0, 0], [6, 0], [6, 4], [0, 4]], [[0, 0], [4, 0], [4, 4], [0, 4]], [[0, 0], [6, 0], [0, 4]], [[0, 0], [6, 0], [3, 5]], [[0, 0], [6, 0], [-2.5, 2.5]],
    [[0, 0], [6, 0], [3.5, 4], [0, 4]], [[0, 0], [6, 0], [8, 4], [2, 4]], [[0, 0], [5, 0], [9, 3.5], [4, 3.5]], [[0, 4], [7, 4], [5, 0], [2, 0]],
    [[0, 0], [6, 0], [3.6, 3.4], [0, 5]], [[0, 0], [6.4, 3.2], [8, 0], [6.4, -3.2]], regPts(6), regPts(8),
    [[0, 0], [4, 0], [4, -4], [2, -7.5], [0, -4]], [[0, 0], [4, 0], [4, -4], [2, -6], [0, -4]], [[0, 0], [6, 0], [6, 2], [4, 4], [0, 4]],
    [[0, 0], [7, 0], [5, 1.8]], [[0, 0], [4, 0], [0, 4]], [[0, 0], [5, 0], [8, 4], [3, 4]]
  ];
  function polyTypes(pts) { // r = right, a = acute, o = obtuse, for every vertex
    var n = pts.length;
    return pts.map(function (P, i) {
      var u = unit(pts[(i + n - 1) % n], P), v = unit(pts[(i + 1) % n], P), a = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) / RAD;
      if (Math.abs(a - 90) < 0.6) return 'r';
      if (a <= 70.5) return 'a';
      if (a >= 109.5) return 'o';
      throw new Error('polygon with an angle that the eye cannot judge');
    });
  }
  // o: fill, labels (per side), ticks (per side), marks (per vertex: 'sq' | 'ac' | 'ob'), arcAt, corner, colSides, letter
  function polySvg(w, h, pts0, rt, mir, o) {
    o = o || {};
    var top = o.letter ? 12 : 0, P = fit(rotPts(pts0, rt, mir), w, h - top, o.m || 18, o.maxS).map(function (p) { return [p[0], p[1] + top]; }), n = P.length, out = pg(P, o.fill || LILAC), G = [0, 0], i;
    P.forEach(function (p) { G[0] += p[0] / n; G[1] += p[1] / n; });
    function nb(i, d) { return P[(i + n + d) % n]; }
    if (o.corner != null) out += pg(sqPts(P[o.corner], nb(o.corner, 1), nb(o.corner, -1), 30), PAPER, OR, 2, 0.9);
    if (o.arcAt != null) out += arc(P[o.arcAt], nb(o.arcAt, 1), nb(o.arcAt, -1), o.arcR || 18, o.arcCol || PK, true);
    if (o.marks) o.marks.forEach(function (m, i) {
      if (m === 'sq') out += pg(sqPts(P[i], nb(i, 1), nb(i, -1), 12), BL, INK, 1.5);
      else if (m) out += arc(P[i], nb(i, 1), nb(i, -1), 15, m === 'ac' ? PK : OR, true);
    });
    out += pg(P, 'none', INK, 3.5);
    for (i = 0; i < n; i++) {
      var A = P[i], B = nb(i, 1), M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], d = unit(M, G), u = unit(B, A);
      if (o.colSides && o.colSides[i]) out += ln(A, B, o.colSides[i], 5.5);
      if (o.ticks && o.ticks[i]) out += ln([M[0] - u[1] * 6, M[1] + u[0] * 6], [M[0] + u[1] * 6, M[1] - u[0] * 6], o.tickCol || INK, 2.5);
      if (o.labels && o.labels[i] != null) out += tx([M[0] + d[0] * 14, M[1] + d[1] * 14], o.labels[i], o.font || 15);
    }
    if (o.letter) out += tx([w - 11, 12], o.letter, 14);
    return S(w, h, out);
  }
  var KIND = { r: 'יְשָׁרוֹת', a: 'חַדּוֹת', o: 'קֵהוֹת' }, KIND1 = { r: 'זָוִית יְשָׁרָה', a: 'זָוִית חַדָּה', o: 'זָוִית קֵהָה' };
  var POLY_TIP = 'בּוֹדְקִים כָּל זָוִית בַּמְּצֻלָּע עִם פִּנָּה שֶׁל דַּף.';
  function A5(r, K) {
    var t = r(), pi = K.ri(r, 0, POLYS.length - 1), pts = POLYS[pi], rt = rndRot(r, K), mir = r() < 0.5, ty = polyTypes(pts), cnt = { r: 0, a: 0, o: 0 }, n = pts.length;
    if (t < 0.07) return stmt(r, K, [['בְּמַלְבֵּן יֵשׁ אַרְבַּע זָוִיּוֹת יְשָׁרוֹת.', true, POLY_TIP], ['בְּרִבּוּעַ יֵשׁ אַרְבַּע זָוִיּוֹת חַדּוֹת.', false, 'בְּרִבּוּעַ כָּל אַרְבַּע הַזָּוִיּוֹת יְשָׁרוֹת.'], ['בְּכָל מְשֻׁלָּשׁ יֵשׁ זָוִית יְשָׁרָה.', false, 'רַק בְּחֵלֶק מֵהַמְּשֻׁלָּשִׁים יֵשׁ זָוִית יְשָׁרָה.']], 'a5s');
    ty.forEach(function (x) { cnt[x]++; });
    var marks = ty.map(function (x) { return x === 'r' ? 'sq' : x === 'a' ? 'ac' : 'ob'; });
    var ex = [{ say: POLY_TIP, svg: polySvg(300, 160, pts, rt, mir, { marks: marks }) }, { say: 'יְשָׁרוֹת (רִבּוּעַ כָּחֹל): ' + cnt.r + '. חַדּוֹת (וָרֹד): ' + cnt.a + '. קֵהוֹת (כָּתֹם): ' + cnt.o + '.' }];
    if (t < 0.7) {
      var k = K.pick(r, ['r', 'a', 'o']), pool = [], i;
      for (i = 0; i <= Math.max(n, 3); i++) pool.push(i);
      return K.q(r, { text: 'כַּמָּה זָוִיּוֹת ' + KIND[k] + ' יֵשׁ בַּמְּצֻלָּע?', svg: polySvg(300, 160, pts, rt, mir), answer: cnt[k], options: K.opts(r, cnt[k], pool, 4).sort(function (a, b) { return a - b; }), keep: true, tip: POLY_TIP, ex: ex, key: 'a5n' + [pi, k, rt, mir] });
    }
    var v = K.ri(r, 0, n - 1);
    return K.q(r, { text: 'מָה סוּג הַזָּוִית הַצְּבוּעָה?', svg: polySvg(300, 160, pts, rt, mir, { arcAt: v }), answer: KIND1[ty[v]], options: [KIND1.a, KIND1.r, KIND1.o], keep: true, tip: POLY_TIP,
      ex: [{ say: 'מַנִּיחִים פִּנָּה שֶׁל דַּף עַל הַקָּדְקוֹד שֶׁל הַזָּוִית.', svg: polySvg(300, 160, pts, rt, mir, { corner: v }) },
        { say: ty[v] === 'r' ? 'הַזָּוִית מַתְאִימָה בְּדִיּוּק לְפִנַּת הַדַּף: זָוִית יְשָׁרָה.' : ty[v] === 'a' ? 'הַזָּוִית קְטַנָּה מִפִּנַּת הַדַּף: זָוִית חַדָּה.' : 'הַזָּוִית גְּדוֹלָה מִפִּנַּת הַדַּף: זָוִית קֵהָה.' }], key: 'a5m' + [pi, v, rt, mir] });
  }

  // ---------- triangles ----------
  var BY_S = ['שְׁוֵה־צְלָעוֹת', 'שְׁוֵה־שׁוֹקַיִם', 'שׁוֹנֵה־צְלָעוֹת'], BY_A = ['חַד־זָוִיּוֹת', 'יְשַׁר־זָוִית', 'קְהֵה־זָוִית'], AND_A = ['וְחַד־זָוִיּוֹת', 'וִישַׁר־זָוִית', 'וּקְהֵה־זָוִית'];
  function triPts(a, b, c) { // sides: [0]-[1] = c, [1]-[2] = a, [2]-[0] = b
    var cosA = (b * b + c * c - a * a) / (2 * b * c), sinA = Math.sqrt(1 - cosA * cosA);
    return [[0, 0], [c, 0], [b * cosA, -b * sinA]];
  }
  function triAng(al, be) { var ac = Math.sin(be * RAD) / Math.sin((al + be) * RAD); return [[0, 0], [1, 0], [ac * Math.cos(al * RAD), -ac * Math.sin(al * RAD)]]; }
  // every triple of whole numbers that draws well; by sides (0 equal, 1 two equal, 2 all different) and by angles (0 acute, 1 right, 2 obtuse, -1 hard to see)
  var TRIS = [], TRI2 = {};
  (function () {
    var a, b, c, s, g, big;
    for (a = 3; a <= 14; a++) for (b = a; b <= 14; b++) for (c = b; c <= 14; c++) {
      if (c > 0.95 * (a + b)) continue;
      s = a === c ? 0 : (a === b || b === c) ? 1 : 2;
      big = Math.acos((a * a + b * b - c * c) / (2 * a * b)) / RAD;
      g = c * c === a * a + b * b ? 1 : big <= 70 ? 0 : (big >= 110 && big <= 150) ? 2 : -1;
      if (c <= 12 && c <= 0.85 * (a + b)) TRIS.push([a, b, c, s]);
      if (g >= 0) (TRI2[s + '' + g] = TRI2[s + '' + g] || []).push([a, b, c]);
    }
  })();
  var SIDE_TIP = 'מַשְׁוִים אֶת אָרְכֵי הַצְּלָעוֹת: כַּמָּה מֵהֶן שָׁווֹת?';
  function sideEx(t3, s, rt, mir, pts, labels) {
    var a = t3[0], b = t3[1], c = t3[2], eqv = a === b ? a : b;
    var col = labels.map(function (l) { return s === 0 ? PK : s === 1 && l === eqv ? PK : null; });
    return [{ say: 'מַשְׁוִים אֶת אָרְכֵי הַצְּלָעוֹת: ' + a + ', ' + b + ', ' + c + '.', svg: polySvg(300, 160, pts, rt, mir, { labels: labels, m: 28, colSides: col, ticks: col }) },
      { say: s === 0 ? 'כָּל שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת: מְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת.' : s === 1 ? 'שְׁתֵּי צְלָעוֹת שָׁווֹת וְהַשְּׁלִישִׁית שׁוֹנָה: מְשֻׁלָּשׁ שְׁוֵה־שׁוֹקַיִם.' : 'כָּל הַצְּלָעוֹת שׁוֹנוֹת בְּאָרְכָּן: מְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת.' }];
  }
  var T1S = [
    ['בִּמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת כָּל הַצְּלָעוֹת שָׁווֹת.', true, SIDE_TIP],
    ['בִּמְשֻׁלָּשׁ שְׁוֵה־שׁוֹקַיִם יֵשׁ שְׁתֵּי צְלָעוֹת שָׁווֹת.', true, SIDE_TIP],
    ['בִּמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת יֵשׁ שְׁתֵּי צְלָעוֹת שָׁווֹת.', false, 'בִּמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת כָּל הַצְּלָעוֹת שׁוֹנוֹת בְּאָרְכָּן.'],
    ['מְשֻׁלָּשׁ שֶׁצְּלָעוֹתָיו 5, 5, 8 הוּא שְׁוֵה־צְלָעוֹת.', false, 'רַק שְׁתֵּי צְלָעוֹת שָׁווֹת, לָכֵן הוּא שְׁוֵה־שׁוֹקַיִם.']
  ];
  function T1(r, K) {
    if (r() < 0.1) return stmt(r, K, T1S, 't1s');
    var s = K.ri(r, 0, 2), t3 = K.pick(r, TRIS.filter(function (x) { return x[3] === s; })), rt = rndRot(r, K), mir = r() < 0.5;
    var pts = triPts(t3[0], t3[1], t3[2]), labels = [t3[2], t3[0], t3[1]];
    return K.q(r, { text: 'אֵיזֶה מְשֻׁלָּשׁ זֶה לְפִי הַצְּלָעוֹת? (הָאֹרֶךְ בְּס״מ)', svg: polySvg(300, 160, pts, rt, mir, { labels: labels, m: 28 }), answer: BY_S[s], options: BY_S.slice(), keep: true, tip: SIDE_TIP,
      ex: sideEx(t3, s, rt, mir, pts, labels), key: 't1' + [t3, rt, mir] });
  }

  var ANG_TRI_TIP = 'מְחַפְּשִׂים אֶת הַזָּוִית הַמְּיֻחֶדֶת: יְשָׁרָה אוֹ קֵהָה.';
  var ACU = [[60, 60], [50, 60], [45, 65], [55, 55], [40, 70], [50, 65], [55, 60], [45, 70], [70, 70], [65, 65]];
  function angTri(g, r, K) { // points with the special angle on [0]
    if (g === 1) return triAng(90, K.pick(r, [30, 35, 40, 45, 50, 55, 60]));
    if (g === 2) { var al = K.pick(r, [110, 115, 120, 125, 130, 135, 140, 145, 150]); return triAng(al, K.pick(r, [15, (180 - al) / 2, 180 - al - 15])); }
    var p = K.pick(r, ACU); return triAng(p[0], p[1]);
  }
  function angTriEx(g, pts, rt, mir) {
    return [{ say: ANG_TRI_TIP + ' בּוֹדְקִים עִם פִּנָּה שֶׁל דַּף.', svg: polySvg(300, 160, pts, rt, mir, g === 0 ? { marks: ['ac', 'ac', 'ac'], m: 22 } : { corner: 0, m: 22 }) },
      { say: g === 1 ? 'יֵשׁ זָוִית יְשָׁרָה אַחַת: מְשֻׁלָּשׁ יְשַׁר־זָוִית.' : g === 2 ? 'יֵשׁ זָוִית אַחַת גְּדוֹלָה מִפִּנַּת הַדַּף, זָוִית קֵהָה: מְשֻׁלָּשׁ קְהֵה־זָוִית.' : 'אֵין זָוִית מְיֻחֶדֶת. כָּל הַזָּוִיּוֹת חַדּוֹת: מְשֻׁלָּשׁ חַד־זָוִיּוֹת.' }];
  }
  var T2S = [
    ['לְכָל מְשֻׁלָּשׁ יֵשׁ שָׁלוֹשׁ זָוִיּוֹת.', true, 'לִמְשֻׁלָּשׁ שָׁלוֹשׁ צְלָעוֹת, שְׁלוֹשָׁה קָדְקוֹדִים וְשָׁלוֹשׁ זָוִיּוֹת.'],
    ['בִּמְשֻׁלָּשׁ יְשַׁר־זָוִית יֵשׁ זָוִית יְשָׁרָה אַחַת.', true, ANG_TRI_TIP],
    ['בִּמְשֻׁלָּשׁ חַד־זָוִיּוֹת כָּל הַזָּוִיּוֹת חַדּוֹת.', true, ANG_TRI_TIP],
    ['בִּמְשֻׁלָּשׁ קְהֵה־זָוִית כָּל הַזָּוִיּוֹת קֵהוֹת.', false, 'בִּמְשֻׁלָּשׁ קְהֵה־זָוִית רַק זָוִית אַחַת קֵהָה. הָאֲחֵרוֹת חַדּוֹת.'],
    ['בִּמְשֻׁלָּשׁ קְהֵה־זָוִית יֵשׁ זָוִית קֵהָה אַחַת.', true, ANG_TRI_TIP]
  ];
  function T2(r, K) {
    var t = r(), g = K.ri(r, 0, 2), pts = angTri(g, r, K), rt = rndRot(r, K), mir = r() < 0.5;
    if (t < 0.1) return stmt(r, K, T2S, 't2s');
    if (t < 0.7) return K.q(r, { text: 'אֵיזֶה מְשֻׁלָּשׁ זֶה לְפִי הַזָּוִיּוֹת?', svg: polySvg(300, 160, pts, rt, mir, { m: 16 }), answer: BY_A[g], options: BY_A.slice(), keep: true, tip: ANG_TRI_TIP, ex: angTriEx(g, pts, rt, mir), key: 't2n' + [g, n1(pts[2][0] * 100), n1(pts[2][1] * 100), rt, mir] });
    var order = K.shuffle(r, [0, 1, 2]), pos = order.indexOf(g), oh = {}, i, sig = [];
    for (i = 0; i < 3; i++) { var p = i === pos ? pts : angTri(order[i], r, K), q = i === pos ? rt : rndRot(r, K); sig.push(n1(p[2][0] * 100), q); oh[LET[i]] = polySvg(100, 80, p, q, i === pos ? mir : r() < 0.5, { m: 12, letter: LET[i] }); }
    return K.q(r, { text: 'אֵיזֶה מְשֻׁלָּשׁ הוּא ' + BY_A[g] + '?', answer: LET[pos], options: LET.slice(0, 3), keep: true, optHtml: oh, tip: ANG_TRI_TIP, ex: angTriEx(g, pts, rt, mir), key: 't2c' + [order, sig] });
  }

  var PER_TIP = 'הֶקֵּף: הוֹלְכִים מִסָּבִיב לַצּוּרָה וּמְחַבְּרִים אֶת אָרְכֵי כָּל הַצְּלָעוֹת.';
  function rep(x, n, sep) { var a = [], i; for (i = 0; i < n; i++) a.push(x); return a.join(sep); }
  function T3(r, K) {
    var t = r(), rt = rndRot(r, K), n, s, P, lab, tk, i, svg;
    if (t < 0.6) { // all the sides are equal
      n = K.pick(r, [3, 4, 5, 6, 8]); s = K.ri(r, 2, n > 5 ? 8 : 10); P = n * s; lab = []; tk = [];
      for (i = 0; i < n; i++) { lab.push(null); tk.push(1); }
      if (n === 4) rt = K.pick(r, [45, 45, 60, 30, 15]);
      var inv = t < 0.25, head = n === 3 ? 'מְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת. ' : 'כָּל הַצְּלָעוֹת שָׁווֹת. ';
      if (!inv) lab[K.ri(r, 0, n - 1)] = s;
      svg = polySvg(300, 160, regPts(n), rt, false, { labels: lab, ticks: tk, m: 28 });
      if (inv) return K.q(r, { text: head + 'הַהֶקֵּף ' + P + ' ס״מ. מָה אֹרֶךְ הַצֶּלַע בְּס״מ?', svg: svg, answer: s, options: nums(s, [P - n, s + 1, s - 1, P / (n - 1), P / (n + 1)], 1), keep: true, tip: PER_TIP,
        ex: [{ say: 'הַהֶקֵּף הוּא ' + n + ' צְלָעוֹת שָׁווֹת.', big: n + ' × ? = ' + P, ltr: true }, { say: 'מְחַלְּקִים אֶת הַהֶקֵּף בְּמִסְפַּר הַצְּלָעוֹת.', big: P + ' : ' + n + ' = ' + s, ltr: true }], key: 't3i' + [n, s] });
      return K.q(r, { text: head + 'מָה הַהֶקֵּף בְּס״מ?', svg: svg, answer: P, options: nums(P, [s * (n - 1), s * (n + 1), s + n, s * 2], 1), keep: true, tip: PER_TIP,
        ex: [{ say: 'הוֹלְכִים מִסָּבִיב לַצּוּרָה וּמְחַבְּרִים אֶת כָּל הַצְּלָעוֹת.', big: rep(s, n, ' + ') + ' = ' + P, ltr: true }, { say: n + ' צְלָעוֹת שָׁווֹת: אֶפְשָׁר לִכְפֹּל.', big: n + ' × ' + s + ' = ' + P, ltr: true }], key: 't3r' + [n, s] });
    }
    var t3 = K.pick(r, TRIS.filter(function (x) { return x[3] === (t < 0.85 ? 1 : 2); })), a = t3[0], b = t3[1], c = t3[2], sum = a + b + c, mir = r() < 0.5;
    return K.q(r, { text: 'מָה הֶקֵּף הַמְּשֻׁלָּשׁ בְּס״מ?', svg: polySvg(300, 160, triPts(a, b, c), rt, mir, { labels: [c, a, b], m: 28 }), answer: sum, options: nums(sum, [a + b, b + c, sum + (a === b ? c : a), sum - 1], 1), keep: true, tip: PER_TIP,
      ex: [{ say: 'הוֹלְכִים מִסָּבִיב לַמְּשֻׁלָּשׁ וּמְחַבְּרִים אֶת שָׁלוֹשׁ הַצְּלָעוֹת.', svg: polySvg(300, 160, triPts(a, b, c), rt, mir, { labels: [c, a, b], m: 28, colSides: [PK, BL, GR] }) }, { say: 'מְחַבְּרִים אֶת כָּל הַצְּלָעוֹת, לֹא רַק שְׁתַּיִם.', big: c + ' + ' + a + ' + ' + b + ' = ' + sum, ltr: true }], key: 't3t' + [a, b, c] });
  }

  var DBL_TIP = 'מְמַיְּנִים פַּעֲמַיִם: קֹדֶם לְפִי הַצְּלָעוֹת, אַחַר כָּךְ לְפִי הַזָּוִיּוֹת.';
  var CATS = ['00', '10', '11', '12', '20', '21', '22'];
  function dblName(s, g) { return BY_S[s] + ' ' + AND_A[g]; }
  function T4(r, K) {
    if (r() < 0.06) return stmt(r, K, [['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת גַּם יְשַׁר־זָוִית וְגַם שְׁוֵה־שׁוֹקַיִם.', true, DBL_TIP], ['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת גַּם קְהֵה־זָוִית וְגַם שְׁוֵה־שׁוֹקַיִם.', true, DBL_TIP], ['כָּל מְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת הוּא יְשַׁר־זָוִית.', false, 'מְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת יָכוֹל לִהְיוֹת חַד־זָוִיּוֹת, יְשַׁר־זָוִית אוֹ קְהֵה־זָוִית.']], 't4s');
    var cat = K.pick(r, CATS), s = +cat[0], g = +cat[1], rt = rndRot(r, K), mir = r() < 0.5, pts, labels, t3, sp = 2, k;
    if (cat === '11') { k = K.ri(r, 3, 9); pts = triAng(90, 45); labels = [k, null, k]; t3 = [k, k]; sp = 0; }
    else { t3 = K.pick(r, TRI2[cat]); pts = triPts(t3[0], t3[1], t3[2]); labels = [t3[2], t3[0], t3[1]]; }
    var eqv = t3[0] === t3[1] ? t3[0] : t3[1], col = labels.map(function (l) { return s === 0 ? PK : s === 1 && l === eqv ? PK : null; });
    var mk = [null, null, null]; mk[sp] = g === 1 ? 'sq' : g === 2 ? 'ob' : 'ac'; if (g === 0) mk = ['ac', 'ac', 'ac'];
    var ex = [{ say: 'לְפִי הַצְּלָעוֹת: ' + (s === 0 ? 'כָּל הַצְּלָעוֹת שָׁווֹת, ' : s === 1 ? 'שְׁתֵּי צְלָעוֹת שָׁווֹת, ' : 'כָּל הַצְּלָעוֹת שׁוֹנוֹת, ') + BY_S[s] + '.', svg: polySvg(300, 160, pts, rt, mir, { labels: labels, m: 28, colSides: col, ticks: col }) },
      { say: 'לְפִי הַזָּוִיּוֹת: ' + (g === 1 ? 'יֵשׁ זָוִית יְשָׁרָה, ' : g === 2 ? 'יֵשׁ זָוִית קֵהָה, ' : 'כָּל הַזָּוִיּוֹת חַדּוֹת, ') + BY_A[g] + '.', svg: polySvg(300, 160, pts, rt, mir, { labels: labels, m: 28, marks: mk }) },
      { say: 'זֶה מְשֻׁלָּשׁ ' + dblName(s, g) + '.' }];
    var svg = polySvg(300, 160, pts, rt, mir, { labels: labels, m: 28, ticks: cat === '11' ? [1, 0, 1] : null });
    if (r() < 0.45) {
      var truth = r() < 0.5, s2 = s, g2 = g;
      if (!truth) { if (r() < 0.5) s2 = (s + K.ri(r, 1, 2)) % 3; else g2 = (g + K.ri(r, 1, 2)) % 3; }
      return TF(r, K, { text: 'זֶה מְשֻׁלָּשׁ ' + dblName(s2, g2) + '.', svg: svg, tip: DBL_TIP, ex: ex, key: 't4t' + [t3, s2, g2, rt] }, truth);
    }
    var sw = (s + K.ri(r, 1, 2)) % 3, gw = (g + K.ri(r, 1, 2)) % 3;
    return K.q(r, { text: 'אֵיזֶה מְשֻׁלָּשׁ זֶה? (הָאֹרֶךְ בְּס״מ)', svg: svg, answer: dblName(s, g), options: [dblName(s, g), dblName(sw, g), dblName(s, gw), dblName(sw, gw)], tip: DBL_TIP, ex: ex, key: 't4c' + [t3, rt, mir] });
  }

  // ---------- area: shapes of whole squares ----------
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function norm(cells) {
    var x0 = 1e9, y0 = 1e9;
    cells.forEach(function (c) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); });
    return cells.map(function (c) { return [c[0] - x0, c[1] - y0]; }).sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
  }
  function setOf(cells) { var s = {}; cells.forEach(function (c) { s[c[0] + ',' + c[1]] = 1; }); return s; }
  function box(cells) { var w = 0, h = 0; cells.forEach(function (c) { w = Math.max(w, c[0] + 1); h = Math.max(h, c[1] + 1); }); return [w, h]; }
  function perim(cells) { var s = setOf(cells), p = 0; cells.forEach(function (c) { DIRS.forEach(function (d) { if (!s[(c[0] + d[0]) + ',' + (c[1] + d[1])]) p++; }); }); return p; }
  function hasHole(cells) {
    var b = box(cells), s = setOf(cells), seen = {}, q = [[-1, -1]], c, n = 0;
    seen['-1,-1'] = 1;
    while (q.length) {
      c = q.pop(); n++;
      DIRS.forEach(function (d) { var x = c[0] + d[0], y = c[1] + d[1], k = x + ',' + y; if (x < -1 || y < -1 || x > b[0] || y > b[1] || s[k] || seen[k]) return; seen[k] = 1; q.push([x, y]); });
    }
    return n !== (b[0] + 2) * (b[1] + 2) - cells.length;
  }
  function rectCells(w, h) { var c = [], x, y; for (y = 0; y < h; y++) for (x = 0; x < w; x++) c.push([x, y]); return c; }
  function grow(r, K, n, W, H, seed) { // a random shape of n squares inside W x H, with no hole
    var t, cells, s, c, d, x, y, guard;
    for (t = 0; t < 30; t++) {
      cells = seed ? seed.slice() : [[K.ri(r, 0, W - 1), K.ri(r, 0, H - 1)]]; s = setOf(cells); guard = 0;
      while (cells.length < n && guard++ < 600) {
        c = K.pick(r, cells); d = K.pick(r, DIRS); x = c[0] + d[0]; y = c[1] + d[1];
        if (x < 0 || y < 0 || x >= W || y >= H || s[x + ',' + y]) continue;
        s[x + ',' + y] = 1; cells.push([x, y]);
      }
      if (cells.length === n && !hasHole(cells)) return norm(cells);
    }
    return rectCells(W, H).slice(0, n);
  }
  function gridBg(x0, y0, cols, rows, s) {
    var out = '', i;
    for (i = 0; i <= cols; i++) out += ln([x0 + i * s, y0], [x0 + i * s, y0 + rows * s], GRIDC, 1);
    for (i = 0; i <= rows; i++) out += ln([x0, y0 + i * s], [x0 + cols * s, y0 + i * s], GRIDC, 1);
    return out;
  }
  function drawCells(cells, x0, y0, s, fill, o) { // o.num: a number in every square; o.outline: the border in pink; o.half: a diagonal in every square
    o = o || {};
    var out = '', set = setOf(cells);
    cells.forEach(function (c, i) {
      var x = x0 + c[0] * s, y = y0 + c[1] * s;
      out += rc(x, y, s, s, fill, INK, 1.5);
      if (o.half) out += ln([x, y + s], [x + s, y], INK, 1.5);
      if (o.num) out += tx([x + s / 2, y + s / 2 + 0.5], i + 1, Math.round(s * 0.55));
    });
    if (o.outline) cells.forEach(function (c) {
      var x = x0 + c[0] * s, y = y0 + c[1] * s;
      if (!set[(c[0] + 1) + ',' + c[1]]) out += ln([x + s, y], [x + s, y + s], PK, 4.5);
      if (!set[(c[0] - 1) + ',' + c[1]]) out += ln([x, y], [x, y + s], PK, 4.5);
      if (!set[c[0] + ',' + (c[1] + 1)]) out += ln([x, y + s], [x + s, y + s], PK, 4.5);
      if (!set[c[0] + ',' + (c[1] - 1)]) out += ln([x, y], [x + s, y], PK, 4.5);
    });
    return out;
  }
  function oneShape(cells, s, fill, o) {
    var b = box(cells), cols = b[0] + 2, rows = b[1] + 2, w = 300, h = rows * s + 8, x0 = (w - cols * s) / 2;
    return S(w, h, gridBg(x0, 4, cols, rows, s) + drawCells(cells, x0 + s, 4 + s, s, fill, o));
  }
  function twoShapes(A, B, o) { // shape א on the right, shape ב on the left, on squared paper
    o = o || {};
    var s = 14, bA = box(A), bB = box(B), rows = Math.max(bA[1], bB[1]) + 1, h = 26 + rows * s + 6, out = '';
    [[A, bA, 164, 'א', PU], [B, bB, 10, 'ב', BL]].forEach(function (z) {
      var ox = z[2] + Math.floor((9 - z[1][0]) / 2) * s;
      out += gridBg(z[2], 24, 9, rows, s) + drawCells(z[0], ox, 24 + s * Math.floor((rows - z[1][1]) / 2), s, z[4], o) + tx([z[2] + 63, 11], z[3], 16);
    });
    return S(300, h, out);
  }
  var AREA_TIP = 'שֶׁטַח: סוֹפְרִים כַּמָּה מִשְׁבְּצוֹת מְכַסּוֹת אֶת הַצּוּרָה.';
  var R1S = [
    ['לִשְׁתֵּי צוּרוֹת שׁוֹנוֹת יָכוֹל לִהְיוֹת אוֹתוֹ שֶׁטַח.', true, 'צוּרוֹת שֶׁבְּנוּיוֹת מֵאוֹתוֹ מִסְפַּר מִשְׁבְּצוֹת הֵן שָׁווֹת בְּשִׁטְחָן.'],
    ['לְצוּרָה אֲרֻכָּה יֵשׁ תָּמִיד שֶׁטַח גָּדוֹל יוֹתֵר.', false, 'צוּרָה אֲרֻכָּה וְצָרָה יְכוֹלָה לִהְיוֹת קְטַנָּה בְּשִׁטְחָהּ. סוֹפְרִים מִשְׁבְּצוֹת.'],
    ['כְּשֶׁמְּסַדְּרִים אֶת אוֹתָן מִשְׁבְּצוֹת בְּצוּרָה אַחֶרֶת, הַשֶּׁטַח לֹא מִשְׁתַּנֶּה.', true, 'צוּרוֹת שֶׁבְּנוּיוֹת מֵאוֹתָם חֲלָקִים הֵן שָׁווֹת בְּשִׁטְחָן.']
  ];
  function thin(r, K) { var n = K.ri(r, 5, 8), c = rectCells(n, K.ri(r, 1, 2)); return r() < 0.3 ? c.map(function (p) { return [p[1], p[0]]; }) : c; }
  function R1(r, K) {
    var t = r(), A, B, n, tmp;
    if (t < 0.08) return stmt(r, K, R1S, 'r1s');
    if (t < 0.3) { n = K.ri(r, 5, 10); A = grow(r, K, n, 5, 5); B = grow(r, K, n + K.ri(r, 1, 4), 6, 6, A); }
    else if (t < 0.52) { n = K.ri(r, 6, 12); A = grow(r, K, n, 5, 5); B = grow(r, K, n, 6, 4); }
    else if (t < 0.85) { A = thin(r, K); B = rectCells(K.ri(r, 2, 4), K.ri(r, 2, 4)); }
    else { n = K.ri(r, 6, 12); A = grow(r, K, n, 5, 5); B = grow(r, K, n + K.ri(r, 1, 3), 5, 5); }
    if (r() < 0.5) { tmp = A; A = B; B = tmp; }
    var a = A.length, b = B.length, opts = ['א', 'ב', 'הַשְּׁטָחִים שָׁוִים'], ans = a === b ? opts[2] : a > b ? 'א' : 'ב';
    return K.q(r, { text: 'לְאֵיזוֹ צוּרָה שֶׁטַח גָּדוֹל יוֹתֵר?', svg: twoShapes(A, B), answer: ans, options: opts, keep: true, tip: AREA_TIP,
      ex: [{ say: 'סוֹפְרִים אֶת הַמִּשְׁבְּצוֹת בְּכָל צוּרָה.', svg: twoShapes(A, B, { num: true }) },
        { say: a === b ? 'בִּשְׁתֵּי הַצּוּרוֹת יֵשׁ ' + a + ' מִשְׁבְּצוֹת. הַשְּׁטָחִים שָׁוִים, גַּם כְּשֶׁהַצּוּרוֹת שׁוֹנוֹת.' : 'בְּצוּרָה א יֵשׁ ' + a + ' מִשְׁבְּצוֹת, בְּצוּרָה ב יֵשׁ ' + b + '. לְצוּרָה ' + ans + ' שֶׁטַח גָּדוֹל יוֹתֵר.' }],
      key: 'r1' + A.join(';') + '|' + B.join(';') });
  }

  // a grid of triangles: row y, place i; the triangle points up when i + y is even
  function triCell(c, x0, y0, s) {
    var hh = s * 0.866, x = x0 + c[0] * s / 2, top = y0 + c[1] * hh, bot = top + hh;
    return (c[0] + c[1]) % 2 === 0 ? [[x, bot], [x + s, bot], [x + s / 2, top]] : [[x, top], [x + s, top], [x + s / 2, bot]];
  }
  function growTri(r, K, n) {
    var cells = [[K.ri(r, 2, 6), K.ri(r, 0, 2)]], s = setOf(cells), guard = 0, c, nb, p;
    while (cells.length < n && guard++ < 600) {
      c = K.pick(r, cells); nb = [[c[0] - 1, c[1]], [c[0] + 1, c[1]], [c[0], c[1] + ((c[0] + c[1]) % 2 === 0 ? 1 : -1)]]; p = K.pick(r, nb);
      if (p[0] < 0 || p[0] > 8 || p[1] < 0 || p[1] > 2 || s[p[0] + ',' + p[1]]) continue;
      s[p[0] + ',' + p[1]] = 1; cells.push(p);
    }
    return cells.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
  }
  function triSvg(cells, num) {
    var s = 50, x0 = 25, y0 = 10, out = '', x, y;
    for (y = 0; y < 3; y++) for (x = 0; x < 9; x++) out += pg(triCell([x, y], x0, y0, s), 'none', GRIDC, 1);
    cells.forEach(function (c, i) {
      var P = triCell(c, x0, y0, s);
      out += pg(P, OR, INK, 1.5);
      if (num) out += tx([(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3], i + 1, 13);
    });
    return S(300, 150, out);
  }
  function R2(r, K) {
    var t = r(), n, cells, b, p;
    if (t < 0.5) {
      n = K.ri(r, 5, 16); cells = grow(r, K, n, 7, 4); b = box(cells); p = perim(cells);
      return K.q(r, { text: 'כַּמָּה מִשְׁבְּצוֹת מְכַסּוֹת אֶת הַצּוּרָה?', svg: oneShape(cells, 22, PU), answer: n, options: nums(n, [p, b[0] * b[1], n + 1, n - 1], 1), keep: true, tip: AREA_TIP,
        ex: [{ say: 'סוֹפְרִים אֶת הַמִּשְׁבְּצוֹת אַחַת אַחַת.', svg: oneShape(cells, 22, CELL, { num: true }) }, { say: 'שֶׁטַח הַצּוּרָה: ' + n + ' מִשְׁבְּצוֹת.' }], key: 'r2q' + cells.join(';') });
    }
    if (t < 0.78) {
      n = K.ri(r, 4, 12); cells = growTri(r, K, n);
      return K.q(r, { text: 'כַּמָּה מְשֻׁלָּשִׁים מְכַסִּים אֶת הַצּוּרָה?', svg: triSvg(cells, false), answer: n, options: nums(n, [n + 1, n - 1, n + 2, n - 2], 1), keep: true, tip: 'אֶפְשָׁר לִמְדֹּד שֶׁטַח גַּם בִּמְשֻׁלָּשִׁים: סוֹפְרִים כַּמָּה מְכַסִּים אֶת הַצּוּרָה.',
        ex: [{ say: 'סוֹפְרִים אֶת הַמְּשֻׁלָּשִׁים אֶחָד אֶחָד.', svg: triSvg(cells, true) }, { say: 'שֶׁטַח הַצּוּרָה: ' + n + ' מְשֻׁלָּשִׁים.' }], key: 'r2t' + cells.join(';') });
    }
    n = K.ri(r, 3, 9); cells = grow(r, K, n, 5, 3);
    return K.q(r, { text: 'יְחִידַת הַשֶּׁטַח הִיא חֲצִי מִשְׁבֶּצֶת. כַּמָּה יְחִידוֹת מְכַסּוֹת אֶת הַצּוּרָה?', svg: oneShape(cells, 28, GR, { half: true }), answer: 2 * n, options: nums(2 * n, [n, 2 * n + 1, 2 * n - 2, n + 2], 1), keep: true, tip: 'אוֹתוֹ שֶׁטַח אֶפְשָׁר לִמְדֹּד בִּיחִידוֹת שׁוֹנוֹת, וְאָז הַמִּסְפָּר שׁוֹנֶה.',
      ex: [{ say: 'בַּצּוּרָה יֵשׁ ' + n + ' מִשְׁבְּצוֹת. בְּכָל מִשְׁבֶּצֶת יֵשׁ 2 חֲצָאִים.', svg: oneShape(cells, 28, GR, { half: true }) }, { say: 'כְּשֶׁהַיְּחִידָה קְטַנָּה יוֹתֵר, צָרִיךְ יוֹתֵר יְחִידוֹת.', big: n + ' × 2 = ' + (2 * n), ltr: true }], key: 'r2h' + cells.join(';') });
  }

  // a rectangle of squares: full grid, part of the grid, or a grid with spilled paint
  function rectSvg(rows, cols, mode) {
    var s = Math.min(24, Math.floor(150 / rows), Math.floor(280 / cols)), W = cols * s, H = rows * s, x0 = (300 - W) / 2, y0 = 5, out = '', x, y;
    if (mode === 'part') {
      out += rc(x0, y0, W, H, '#fff', INK, 0);
      for (x = 0; x < cols; x++) out += rc(x0 + x * s, y0, s, s, CELL, INK, 1.5);
      for (y = 1; y < rows; y++) out += rc(x0, y0 + y * s, s, s, CELL, INK, 1.5);
    } else for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) out += rc(x0 + x * s, y0 + y * s, s, s, mode === 'rows' ? (y % 2 ? '#bfe3ff' : CELL) : CELL, INK, 1.5);
    if (mode === 'spill') {
      var cx = x0 + W * 0.6, cy = y0 + H * 0.6, rx = W * 0.3, ry = H * 0.28;
      out += '<ellipse cx="' + n1(cx) + '" cy="' + n1(cy) + '" rx="' + n1(rx) + '" ry="' + n1(ry) + '" fill="' + PK + '"/>' + '<circle cx="' + n1(cx - rx * 0.6) + '" cy="' + n1(cy + ry * 0.55) + '" r="' + n1(Math.min(rx, ry) * 0.55) + '" fill="' + PK + '"/>' + '<circle cx="' + n1(cx + rx * 0.55) + '" cy="' + n1(cy - ry * 0.5) + '" r="' + n1(Math.min(rx, ry) * 0.6) + '" fill="' + PK + '"/>';
    }
    return S(300, H + 10, out + rc(x0, y0, W, H, 'none', INK, 3));
  }
  var RECT_TIP = 'סוֹפְרִים שׁוּרוֹת, וְכַמָּה מִשְׁבְּצוֹת בְּכָל שׁוּרָה. אָז כּוֹפְלִים.';
  function rectEx(a, b) {
    return [{ say: 'סוֹפְרִים שׁוּרוֹת, וְכַמָּה מִשְׁבְּצוֹת בְּכָל שׁוּרָה.', svg: rectSvg(a, b, 'rows') }, { say: a + ' שׁוּרוֹת, בְּכָל שׁוּרָה ' + b + ' מִשְׁבְּצוֹת.', big: a + ' × ' + b + ' = ' + (a * b), ltr: true }];
  }
  function R3(r, K) {
    var t = r(), a, b, mode, text;
    if (t < 0.05) return stmt(r, K, [['אֶת שֶׁטַח הַמַּלְבֵּן אֶפְשָׁר לִמְצֹא בְּכֶפֶל.', true, RECT_TIP], ['שֶׁטַח הַמַּלְבֵּן הוּא מִסְפַּר הַשּׁוּרוֹת וְעוֹד מִסְפַּר הַמִּשְׁבְּצוֹת בְּשׁוּרָה.', false, RECT_TIP]], 'r3s');
    mode = t < 0.4 ? 'full' : t < 0.7 ? 'part' : 'spill';
    a = K.ri(r, mode === 'spill' ? 3 : 2, mode === 'full' ? 7 : 10); b = K.ri(r, mode === 'spill' ? 3 : 2, 10);
    text = mode === 'full' ? 'מָה שֶׁטַח הַמַּלְבֵּן בְּמִשְׁבְּצוֹת?' : mode === 'part' ? 'רַק חֵלֶק מֵהַמִּשְׁבְּצוֹת מְצֻיָּר. מָה שֶׁטַח הַמַּלְבֵּן בְּמִשְׁבְּצוֹת?' : 'עַל דַּף מִשְׁבְּצוֹת נִשְׁפַּךְ צֶבַע. כַּמָּה מִשְׁבְּצוֹת יֵשׁ בַּדַּף כֻּלּוֹ?';
    return K.q(r, { text: text, svg: rectSvg(a, b, mode), answer: a * b, options: nums(a * b, [a + b, 2 * a + 2 * b, a * b - a, a * b + b, a + b - 1], 1), keep: true, tip: RECT_TIP, ex: rectEx(a, b), key: 'r3' + [mode, a, b] });
  }

  var THINGS = [['בּוּל', 0, '✉️'], ['מַדְבֵּקָה', 0, '⭐'], ['קְלָף מִשְׂחָק', 0, '🃏'], ['פֶּתֶק', 0, '📝'], ['כַּרְטִיס אוֹטוֹבּוּס', 0, '🎫'], ['מָסָךְ שֶׁל טֶלֶפוֹן', 0, '📱'], ['דַּף מַחְבֶּרֶת', 0, '📄'], ['כְּרִיכַת סֵפֶר', 0, '📕'], ['מַפִּית', 0, '🍽️'], ['תְּמוּנָה קְטַנָּה', 0, '🖼️'],
    ['רִצְפַּת הַכִּתָּה', 1, '🏫'], ['מִגְרַשׁ כַּדּוּרֶגֶל', 1, '⚽'], ['חֲדַר שֵׁנָה', 1, '🛏️'], ['שָׁטִיחַ גָּדוֹל', 1, '🏠'], ['קִיר', 1, '🧱'], ['חֲצַר בֵּית הַסֵּפֶר', 1, '🏫'], ['גִּנָּה', 1, '🌳'], ['חֲנָיָה', 1, '🚗'], ['בְּרֵכַת שְׂחִיָּה', 1, '🏊'], ['מִגְרַשׁ כַּדּוּרְסַל', 1, '🏀']];
  var UNITS = ['סֶנְטִימֶטֶר מְרֻבָּע (סמ״ר)', 'מֶטֶר מְרֻבָּע (מ״ר)'];
  function dimRect(a, b, grid) { // a rectangle with the lengths of its sides
    var s = Math.min(26, Math.floor(120 / a), Math.floor(210 / b)), W = b * s, H = a * s, x0 = (300 - W) / 2 + 8, y0 = 6, out = rc(x0, y0, W, H, LILAC, INK, 3), i;
    if (grid) { for (i = 1; i < b; i++) out += ln([x0 + i * s, y0], [x0 + i * s, y0 + H], INK, 1.2); for (i = 1; i < a; i++) out += ln([x0, y0 + i * s], [x0 + W, y0 + i * s], INK, 1.2); }
    return S(300, H + 30, out + tx([x0 + W / 2, y0 + H + 13], b, 15) + tx([x0 - 14, y0 + H / 2], a, 15));
  }
  function R4(r, K) {
    if (r() < 0.4) {
      var th = K.pick(r, THINGS);
      return K.q(r, { text: 'בְּמָה כְּדַאי לִמְדֹּד אֶת הַשֶּׁטַח שֶׁל ' + th[0] + '?', pic: th[2], answer: UNITS[th[1]], options: UNITS.slice(), keep: true,
        tip: 'שֶׁטַח קָטָן מוֹדְדִים בְּסמ״ר. שֶׁטַח גָּדוֹל מוֹדְדִים בְּמ״ר.',
        ex: [{ say: 'סֶנְטִימֶטֶר מְרֻבָּע הוּא רִבּוּעַ קָטָן, כְּמוֹ צִפֹּרֶן. מֶטֶר מְרֻבָּע הוּא רִבּוּעַ גָּדוֹל, כְּמוֹ שֻׁלְחָן גָּדוֹל.' }, { say: th[1] ? 'זֶה שֶׁטַח גָּדוֹל, לָכֵן מוֹדְדִים בְּמֶטֶר מְרֻבָּע (מ״ר).' : 'זֶה שֶׁטַח קָטָן, לָכֵן מוֹדְדִים בְּסֶנְטִימֶטֶר מְרֻבָּע (סמ״ר).' }] });
    }
    var a, b, m = r() < 0.4, sq = m ? ' מ״ר' : ' סמ״ר', lin = m ? ' מ׳' : ' ס״מ';
    do { a = K.ri(r, 2, 6); b = K.ri(r, 2, 9); } while (a === 2 && b === 2);
    return K.q(r, { text: 'אֹרֶךְ הַצְּלָעוֹת ' + (m ? 'בְּמֶטְרִים' : 'בְּס״מ') + '. מָה שֶׁטַח הַמַּלְבֵּן?', svg: dimRect(a, b, false), answer: a * b + sq, options: [a * b + sq, a * b + lin, (a + b) + sq, (2 * a + 2 * b === a * b ? a + b : 2 * a + 2 * b) + lin],
      tip: 'שֶׁטַח מוֹדְדִים בִּיחִידוֹת מְרֻבָּעוֹת: סמ״ר אוֹ מ״ר.',
      ex: [{ say: 'מְחַלְּקִים אֶת הַמַּלְבֵּן לְרִבּוּעִים. כָּל רִבּוּעַ הוּא ' + (m ? 'מֶטֶר מְרֻבָּע' : 'סֶנְטִימֶטֶר מְרֻבָּע') + ' אֶחָד.', svg: dimRect(a, b, true) },
        { say: a + ' שׁוּרוֹת שֶׁל ' + b + ' רִבּוּעִים.', big: a + ' × ' + b + ' = ' + (a * b), ltr: true },
        { say: 'שֶׁטַח מוֹדְדִים בְּ' + (m ? 'מ״ר' : 'סמ״ר') + '. אֹרֶךְ מוֹדְדִים בְּ' + (m ? 'מֶטְרִים' : 'ס״מ') + '.' }], key: 'r4' + [a, b, m] });
  }

  var AP_TIP = 'שֶׁטַח: הַמִּשְׁבְּצוֹת שֶׁבִּפְנִים. הֶקֵּף: הַדֶּרֶךְ מִסָּבִיב.';
  var PAIRS = [[2, 6, 3, 4], [2, 8, 4, 4], [2, 9, 3, 6], [3, 8, 4, 6], [4, 9, 6, 6], [1, 8, 2, 4], [1, 6, 2, 3], [1, 9, 3, 3], [2, 6, 4, 4], [3, 5, 4, 4], [2, 7, 3, 6], [1, 7, 4, 4], [2, 5, 3, 4], [1, 5, 3, 3], [3, 7, 5, 5], [2, 8, 5, 5]];
  var R5S = [
    ['לְצוּרוֹת עִם אוֹתוֹ שֶׁטַח יֵשׁ תָּמִיד אוֹתוֹ הֶקֵּף.', false, 'צוּרוֹת שָׁווֹת בְּשִׁטְחָן יְכוֹלוֹת לִהְיוֹת שׁוֹנוֹת בְּהֶקֵּפָן.'],
    ['הֶקֵּף הוּא מִסְפַּר הַמִּשְׁבְּצוֹת שֶׁבְּתוֹךְ הַצּוּרָה.', false, AP_TIP],
    ['לִשְׁנֵי מַלְבְּנִים שׁוֹנִים יָכוֹל לִהְיוֹת אוֹתוֹ שֶׁטַח.', true, 'לְמָשָׁל: מַלְבֵּן שֶׁל 2 עַל 6 וּמַלְבֵּן שֶׁל 3 עַל 4. לִשְׁנֵיהֶם שֶׁטַח 12.']
  ];
  function smallRect(w, h, letter) {
    var s = Math.min(60 / w, 40 / h, 9), W = w * s, H = h * s, x0 = 50 - W / 2 + 4, y0 = 36 - H / 2;
    return S(100, 80, rc(x0, y0, W, H, LILAC, INK, 2.5) + tx([x0 + W / 2, y0 + H + 10], w, 12) + tx([x0 - 9, y0 + H / 2], h, 12) + tx([90, 10], letter, 13));
  }
  function R5(r, K) {
    var t = r(), a, b, S0, i;
    if (t < 0.07) return stmt(r, K, R5S, 'r5s');
    if (t < 0.4) { // two rectangles: the same area or the same perimeter
      var p = K.pick(r, PAIRS), A = rectCells(p[1], p[0]), B = rectCells(p[3], p[2]), tmp, askP = r() < 0.6;
      if (r() < 0.5) { tmp = A; A = B; B = tmp; }
      var aA = A.length, aB = B.length, pA = perim(A), pB = perim(B), eqw = askP ? 'הַהֶקֵּפִים שָׁוִים' : 'הַשְּׁטָחִים שָׁוִים', va = askP ? pA : aA, vb = askP ? pB : aB;
      return K.q(r, { text: askP ? 'לְאֵיזֶה מַלְבֵּן הֶקֵּף גָּדוֹל יוֹתֵר?' : 'לְאֵיזֶה מַלְבֵּן שֶׁטַח גָּדוֹל יוֹתֵר?', svg: twoShapes(A, B), answer: va === vb ? eqw : va > vb ? 'א' : 'ב', options: ['א', 'ב', eqw], keep: true, tip: AP_TIP,
        ex: [{ say: 'שֶׁטַח: סוֹפְרִים אֶת הַמִּשְׁבְּצוֹת שֶׁבִּפְנִים. א: ' + aA + ', ב: ' + aB + '.', svg: twoShapes(A, B) },
          { say: 'הֶקֵּף: הוֹלְכִים מִסָּבִיב וְסוֹפְרִים צְעָדִים. א: ' + pA + ', ב: ' + pB + '.', svg: twoShapes(A, B, { outline: true }) }], key: 'r5p' + [box(A), box(B), askP] });
    }
    if (t < 0.6) { // the missing side
      a = K.ri(r, 2, 9); b = K.ri(r, 2, 9); S0 = a * b;
      return K.q(r, { text: 'שֶׁטַח הַמַּלְבֵּן ' + S0 + ' מִשְׁבְּצוֹת. צֶלַע אַחַת ' + a + '. מָה אֹרֶךְ הַצֶּלַע הַשְּׁנִיָּה?', answer: b, options: nums(b, [S0 - a, (S0 - 2 * a) / 2, b + 1, b - 1, S0 / 2 - a], 1), keep: true, tip: 'שֶׁטַח הַמַּלְבֵּן הוּא צֶלַע כָּפוּל צֶלַע.',
        ex: [{ say: 'שֶׁטַח הַמַּלְבֵּן: ' + a + ' שׁוּרוֹת, וּבְכָל שׁוּרָה אוֹתוֹ מִסְפַּר מִשְׁבְּצוֹת.', big: a + ' × ? = ' + S0, ltr: true }, { say: 'מְחַלְּקִים אֶת הַשֶּׁטַח בַּצֶּלַע הַיְּדוּעָה.', big: S0 + ' : ' + a + ' = ' + b, ltr: true }, { say: 'בּוֹדְקִים: ' + a + ' שׁוּרוֹת שֶׁל ' + b + ' מִשְׁבְּצוֹת.', svg: rectSvg(a, b, 'rows') }], key: 'r5m' + [a, b] });
    }
    if (t < 0.8) { // which rectangle has this area
      S0 = K.pick(r, [12, 16, 18, 20, 24, 30, 36, 40, 48]);
      var good = [], bad = [], seen = {}, x, y;
      for (x = 2; x <= 12; x++) if (S0 % x === 0 && S0 / x >= 2 && S0 / x <= 12) good.push([x, S0 / x]);
      var g = K.pick(r, good), cand = [[g[0], g[1] + 1], [g[0] + 1, g[1]], [g[0], g[1] - 1], [g[0] - 1, g[1]]];
      for (x = 2; x < S0 / 2 - 1; x++) cand.push([x, S0 / 2 - x]);
      K.shuffle(r, cand).forEach(function (c) { var k = Math.min(c[0], c[1]) + 'x' + Math.max(c[0], c[1]); if (bad.length < 3 && c[0] >= 2 && c[1] >= 2 && c[0] <= 12 && c[1] <= 12 && c[0] * c[1] !== S0 && !seen[k]) { seen[k] = 1; bad.push(c); } });
      var pos = K.ri(r, 0, 3), oh = {}, k2 = 0, sig = [];
      for (i = 0; i < 4; i++) { var d = i === pos ? g : bad[k2++]; sig.push(d); oh[LET[i]] = smallRect(Math.max(d[0], d[1]), Math.min(d[0], d[1]), LET[i]); }
      return K.q(r, { text: 'אֵיזֶה מַלְבֵּן שִׁטְחוֹ ' + S0 + '?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: 'שֶׁטַח הַמַּלְבֵּן הוּא צֶלַע כָּפוּל צֶלַע.',
        ex: [{ say: 'בְּכָל מַלְבֵּן כּוֹפְלִים צֶלַע בְּצֶלַע.', big: Math.max(g[0], g[1]) + ' × ' + Math.min(g[0], g[1]) + ' = ' + S0, ltr: true }, { say: 'בַּמַּלְבְּנִים הָאֲחֵרִים הַמַּכְפֵּלָה אֵינָהּ ' + S0 + '. חִבּוּר הַצְּלָעוֹת נוֹתֵן הֶקֵּף, לֹא שֶׁטַח.' }], key: 'r5w' + [S0, pos, sig] });
    }
    var n = K.ri(r, 4, 9), cells = grow(r, K, n, 5, 3), pm = perim(cells);
    return K.q(r, { text: 'כָּל צֶלַע שֶׁל מִשְׁבֶּצֶת הִיא 1 ס״מ. מָה הֶקֵּף הַצּוּרָה בְּס״מ?', svg: oneShape(cells, 26, PU), answer: pm, options: nums(pm, [n, pm - 2, pm + 2, 4 * n], 1), keep: true, tip: AP_TIP,
      ex: [{ say: 'הוֹלְכִים מִסָּבִיב לַצּוּרָה וְסוֹפְרִים אֶת הַקַּוִּים הַוְּרֻדִּים: ' + pm + '.', svg: oneShape(cells, 26, CELL, { outline: true }) }, { say: 'הַשֶּׁטַח הוּא ' + n + ' מִשְׁבְּצוֹת, אֲבָל הַהֶקֵּף הוּא ' + pm + ' ס״מ.' }], key: 'r5o' + cells.join(';') });
  }

  // ---------- boxes and cubes ----------
  function boxGeo(L, W, H, w, h, m, maxU) {
    var kx = 0.5, ky = 0.36, tw = L + W * kx, th = H + W * ky, u = Math.min((w - 2 * m) / tw, (h - 2 * m) / th, maxU || 40);
    var x0 = (w - tw * u) / 2, y0 = (h - th * u) / 2 + W * ky * u, d = [W * kx * u, -W * ky * u];
    var F = [[x0, y0 + H * u], [x0 + L * u, y0 + H * u], [x0 + L * u, y0], [x0, y0]];
    return { u: u, d: d, F: F, B: F.map(function (p) { return [p[0] + d[0], p[1] + d[1]]; }), L: L, W: W, H: H };
  }
  function boxBody(g, o) { // o.cubes: lines of unit cubes; o.hidden: dashed back edges; o.hl: ['v', i] | ['e', i] | ['f', i]
    o = o || {};
    var F = g.F, B = g.B, u = g.u, d = g.d, out = '', i, hl = o.hl || [];
    var faces = [[F[0], F[1], F[2], F[3]], [F[3], F[2], B[2], B[3]], [F[1], B[1], B[2], F[2]]], fills = ['#b9a1ff', '#dccfff', '#8e5cff'];
    faces.forEach(function (f, k) { out += pg(f, hl[0] === 'f' && hl[1] === k ? PK : fills[k], INK, 2.5); });
    if (o.cubes) {
      for (i = 1; i < g.L; i++) out += ln([F[3][0] + i * u, F[3][1]], [F[0][0] + i * u, F[0][1]], INK, 1.5) + ln([F[3][0] + i * u, F[3][1]], [B[3][0] + i * u, B[3][1]], INK, 1.5);
      for (i = 1; i < g.H; i++) out += ln([F[3][0], F[3][1] + i * u], [F[2][0], F[2][1] + i * u], INK, 1.5) + ln([F[2][0], F[2][1] + i * u], [B[2][0], B[2][1] + i * u], INK, 1.5);
      for (i = 1; i < g.W; i++) { var k = i / g.W, q = [d[0] * k, d[1] * k]; out += ln([F[3][0] + q[0], F[3][1] + q[1]], [F[2][0] + q[0], F[2][1] + q[1]], INK, 1.5) + ln([F[2][0] + q[0], F[2][1] + q[1]], [F[1][0] + q[0], F[1][1] + q[1]], INK, 1.5); }
    }
    if (o.hidden) out += ln(B[0], B[1], INK, 1.8, '5 4') + ln(B[0], B[3], INK, 1.8, '5 4') + ln(F[0], B[0], INK, 1.8, '5 4');
    var E = [[F[0], F[1]], [F[1], F[2]], [F[2], F[3]], [F[3], F[0]], [F[1], B[1]], [F[2], B[2]], [F[3], B[3]], [B[1], B[2]], [B[2], B[3]], [B[0], B[1]], [B[0], B[3]], [F[0], B[0]]];
    var V = [F[0], F[1], F[2], F[3], B[1], B[2], B[3], B[0]];
    if (hl[0] === 'e') out += ln(E[hl[1]][0], E[hl[1]][1], PK, 7);
    if (hl[0] === 'v') out += dot(V[hl[1]], 8, PK);
    if (o.numV) V.forEach(function (p, k) { out += dot(p, 9, PK) + tx([p[0], p[1] + 0.5], k + 1, 11, '#fff'); });
    if (o.numE) E.forEach(function (e, k) { var M = [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2]; out += dot(M, 9, OR) + tx([M[0], M[1] + 0.5], k + 1, 10, INK); });
    if (o.numF) faces.forEach(function (f, k) { out += tx([(f[0][0] + f[2][0]) / 2, (f[0][1] + f[2][1]) / 2], k + 1, 18, INK); });
    if (o.dims) out += tx([(F[0][0] + F[1][0]) / 2, F[0][1] + 13], g.L, 15) + tx([F[0][0] - 12, (F[0][1] + F[3][1]) / 2], g.H, 15) + tx([(F[1][0] + B[1][0]) / 2 + 11, (F[1][1] + B[1][1]) / 2 + 9], g.W, 15);
    return out;
  }
  var PARTS = ['קָדְקוֹד', 'מִקְצוֹעַ', 'פֵּאָה'];
  var PART_SAY = ['קָדְקוֹד הוּא פִּנָּה שֶׁל הַתֵּבָה: נְקֻדָּה שֶׁבָּהּ נִפְגָּשִׁים מִקְצוֹעוֹת.', 'מִקְצוֹעַ הוּא קַו יָשָׁר שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת.', 'פֵּאָה הִיא צַד שָׁטוּחַ שֶׁל הַתֵּבָה.'];
  var BOX_TIP = 'לְתֵבָה יֵשׁ 6 פֵּאוֹת, 12 מִקְצוֹעוֹת וּ־8 קָדְקוֹדִים.';
  var B1S = [
    ['לְתֵבָה יֵשׁ 6 פֵּאוֹת.', true, BOX_TIP], ['לְקֻבִּיָּה יֵשׁ 8 קָדְקוֹדִים.', true, BOX_TIP], ['לְתֵבָה יֵשׁ 10 מִקְצוֹעוֹת.', false, BOX_TIP],
    ['כָּל הַפֵּאוֹת שֶׁל קֻבִּיָּה הֵן רִבּוּעִים.', true, 'בְּקֻבִּיָּה כָּל הַמִּקְצוֹעוֹת שָׁוִים, לָכֵן כָּל פֵּאָה הִיא רִבּוּעַ.'],
    ['לְקֻבִּיָּה יֵשׁ 12 מִקְצוֹעוֹת.', true, BOX_TIP], ['לְתֵבָה יֵשׁ 4 פֵּאוֹת.', false, BOX_TIP], ['לְקֻבִּיָּה יֵשׁ 6 קָדְקוֹדִים.', false, BOX_TIP],
    ['בְּקֻבִּיָּה כָּל הַמִּקְצוֹעוֹת שָׁוִים בְּאָרְכָּם.', true, 'קֻבִּיָּה הִיא תֵּבָה שֶׁכָּל הַמִּקְצוֹעוֹת שֶׁלָּהּ שָׁוִים.']
  ];
  function B1(r, K) {
    var t = r(), L = K.ri(r, 2, 5), W = K.ri(r, 2, 4), H = K.ri(r, 2, 4), g = boxGeo(L, W, H, 300, 160, 20, 30), cube;
    if (t < 0.12) return stmt(r, K, B1S, 'b1s');
    if (t < 0.4) {
      cube = r() < 0.3; if (cube) g = boxGeo(3, 3, 3, 300, 160, 20, 30);
      var k = K.ri(r, 0, 2), ans = [8, 12, 6][k], what = ['קָדְקוֹדִים', 'מִקְצוֹעוֹת', 'פֵּאוֹת'][k], body = cube ? 'לַקֻּבִּיָּה' : 'לַתֵּבָה';
      return K.q(r, { text: 'כַּמָּה ' + what + ' יֵשׁ ' + body + '?', svg: S(300, 160, boxBody(g, { hidden: true })), answer: ans, options: [4, 6, 8, 12], keep: true, tip: BOX_TIP,
        ex: [{ say: PART_SAY[k], svg: S(300, 160, boxBody(g, { hidden: true, numV: k === 0, numE: k === 1, numF: k === 2 })) },
          { say: k === 0 ? 'סוֹפְרִים: 4 קָדְקוֹדִים לְמַטָּה וְעוֹד 4 לְמַעְלָה. בְּיַחַד 8 קָדְקוֹדִים.' : k === 1 ? 'סוֹפְרִים גַּם אֶת הַמִּקְצוֹעוֹת שֶׁמֵּאָחוֹר: בְּיַחַד 12 מִקְצוֹעוֹת.' : 'רוֹאִים 3 פֵּאוֹת, וְעוֹד 3 פֵּאוֹת מֵאָחוֹר וּמִלְּמַטָּה. בְּיַחַד 6 פֵּאוֹת.' }], key: 'b1n' + [k, cube, L, W, H] });
    }
    if (t < 0.72) {
      var p = K.ri(r, 0, 2), idx = p === 0 ? K.ri(r, 0, 6) : p === 1 ? K.ri(r, 0, 8) : K.ri(r, 0, 2), o = { hidden: true, hl: [['v', 'e', 'f'][p], idx] };
      return K.q(r, { text: 'מָה צָבוּעַ בְּוָרֹד?', svg: S(300, 160, boxBody(g, o)), answer: PARTS[p], options: PARTS.slice(), keep: true, tip: 'פֵּאָה הִיא צַד שָׁטוּחַ, מִקְצוֹעַ הוּא קַו, קָדְקוֹד הוּא פִּנָּה.',
        ex: [{ say: PART_SAY[p], svg: S(300, 160, boxBody(g, o)) }], key: 'b1p' + [p, idx, L, W, H] });
    }
    cube = r() < 0.4; var a = K.ri(r, 2, 6), dm = cube ? [a, a, a] : K.shuffle(r, [a, a, a + K.pick(r, [-1, 1, 2])]);
    if (!cube && r() < 0.4) dm = K.shuffle(r, [2, 3, 4, 5, 6]).slice(0, 3);
    g = boxGeo(dm[0], dm[1], dm[2], 300, 160, 26, 26);
    var kinds = ['קֻבִּיָּה', 'תֵּבָה שֶׁאֵינָהּ קֻבִּיָּה'];
    return K.q(r, { text: 'הַמִּסְפָּרִים הֵם אָרְכֵי הַמִּקְצוֹעוֹת. מָה הַגּוּף הַזֶּה?', svg: S(300, 160, boxBody(g, { dims: true })), answer: kinds[cube ? 0 : 1], options: kinds, keep: true, tip: 'בְּקֻבִּיָּה כָּל הַמִּקְצוֹעוֹת שָׁוִים בְּאָרְכָּם.',
      ex: [{ say: 'בְּקֻבִּיָּה כָּל הַמִּקְצוֹעוֹת שָׁוִים בְּאָרְכָּם, וְכָל הַפֵּאוֹת הֵן רִבּוּעִים.', svg: S(300, 160, boxBody(g, { dims: true })) },
        { say: cube ? 'כָּאן כָּל הָאֳרָכִים שָׁוִים: ' + dm.join(', ') + '. זֹאת קֻבִּיָּה.' : 'כָּאן הָאֳרָכִים ' + dm.join(', ') + ' אֵינָם שָׁוִים. זֹאת תֵּבָה שֶׁאֵינָהּ קֻבִּיָּה.' }], key: 'b1c' + dm });
  }

  function layers(L, W, H) { // the box taken apart into its layers
    var ky = 0.36, kx = 0.5, gap = W * ky + 0.35, u = Math.min(150 / (H * (1 + gap)), 250 / (L + W * kx), 26), out = '', i;
    var x0 = (300 - (L + W * kx) * u) / 2, top = (176 - H * (1 + gap) * u) / 2 + gap * u;
    for (i = 0; i < H; i++) {
      var y0 = top + i * (1 + gap) * u, d = [W * kx * u, -W * ky * u], F = [[x0, y0 + u], [x0 + L * u, y0 + u], [x0 + L * u, y0], [x0, y0]];
      out += boxBody({ u: u, d: d, F: F, B: F.map(function (p) { return [p[0] + d[0], p[1] + d[1]]; }), L: L, W: W, H: 1 }, { cubes: true });
    }
    return S(300, 176, out);
  }
  function B2(r, K) {
    var L, W, H;
    do { L = K.ri(r, 2, 5); W = K.ri(r, 2, 5); H = K.ri(r, 2, 4); } while (L * W * H > 60);
    var n = L * W * H, lay = L * W;
    return K.q(r, { text: 'כַּמָּה קֻבִּיּוֹת יֵשׁ בַּתֵּבָה?', svg: S(300, 170, boxBody(boxGeo(L, W, H, 300, 170, 10, 30), { cubes: true })), answer: n,
      options: nums(n, [n - (L - 1) * (W - 1) * (H - 1), L * H + L * W + W * H, lay, L + W + H, n + lay], 1), keep: true,
      tip: 'סוֹפְרִים כַּמָּה קֻבִּיּוֹת בְּשִׁכְבָה אַחַת, וְכַמָּה שְׁכָבוֹת יֵשׁ.',
      ex: [{ say: 'מְפָרְקִים אֶת הַתֵּבָה לִשְׁכָבוֹת. בְּשִׁכְבָה אַחַת יֵשׁ ' + W + ' שׁוּרוֹת שֶׁל ' + L + ' קֻבִּיּוֹת.', svg: layers(L, W, H) },
        { say: 'בְּשִׁכְבָה אַחַת יֵשׁ ' + lay + ' קֻבִּיּוֹת.', big: W + ' × ' + L + ' = ' + lay, ltr: true },
        { say: 'יֵשׁ ' + H + ' שְׁכָבוֹת. סוֹפְרִים גַּם אֶת הַקֻּבִּיּוֹת שֶׁלֹּא רוֹאִים.', big: H + ' × ' + lay + ' = ' + n, ltr: true }], key: 'b2' + [L, W, H] });
  }

  // the 11 shapes of six squares that fold into a cube, and the 24 that do not
  var NET_OK = ['#.../####/#...', '#.../####/.#..', '#.../####/..#.', '#.../####/...#', '.#../####/.#..', '.#../####/..#.', '##../.###/.#..', '##../.###/..#.', '##../.###/...#', '##../.##./..##', '###../..###'];
  var NET_NO = ['######', '#####/#....', '#####/.#...', '#####/..#..', '####./...##', '####/##..', '####/#.#.', '####/#..#', '####/#.../#...', '####/.##.', '####/.#../.#..', '###./#.##', '###./.###', '###./..##/..#.', '###./..##/...#', '###./..#./..##', '###/###', '###/##./#..', '###/##./.#.', '###/#.#/#..', '###/.#./##.', '##./###/.#.', '##./###/..#', '##./.##/##.'];
  function netCells(str, turn, mir) {
    var cells = [], i;
    str.split('/').forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row.charAt(x) === '#') cells.push([x, y]); });
    if (mir) cells = cells.map(function (c) { return [-c[0], c[1]]; });
    for (i = 0; i < turn; i++) cells = cells.map(function (c) { return [-c[1], c[0]]; });
    return norm(cells);
  }
  function fold(cells) { // which face of the cube every square lands on (0 bottom, 1 top, 2-5 the walls)
    var idx = {}, face = [], st = [], base = 0, best = -1, q, k, c, s;
    cells.forEach(function (c, i) { idx[c[0] + ',' + c[1]] = i; });
    cells.forEach(function (c, i) { var n = 0; DIRS.forEach(function (d) { if (idx[(c[0] + d[0]) + ',' + (c[1] + d[1])] != null) n++; }); if (n > best) { best = n; base = i; } });
    st[base] = [0, 1, 2, 3, 4, 5]; face[base] = 0; q = [base];
    function go(dx, dy, ns) { var j = idx[(c[0] + dx) + ',' + (c[1] + dy)]; if (j != null && !st[j]) { st[j] = ns; face[j] = ns[0]; q.push(j); } }
    while (q.length) {
      k = q.shift(); c = cells[k]; s = st[k];
      go(1, 0, [s[4], s[5], s[2], s[3], s[1], s[0]]); go(-1, 0, [s[5], s[4], s[2], s[3], s[0], s[1]]);
      go(0, 1, [s[3], s[2], s[0], s[1], s[4], s[5]]); go(0, -1, [s[2], s[3], s[1], s[0], s[4], s[5]]);
    }
    return face;
  }
  function netSvg(cells, w, h, o) { // o.roles: colour the squares by what they become when folded
    o = o || {};
    var b = box(cells), s = Math.min((w - 2 * (o.m || 10)) / b[0], (h - 2 * (o.m || 10)) / b[1], o.cap || 30), x0 = (w - b[0] * s) / 2, y0 = (h - b[1] * s) / 2, out = '', face, cnt = {};
    if (o.roles) { face = fold(cells); face.forEach(function (f) { cnt[f] = (cnt[f] || 0) + 1; }); }
    cells.forEach(function (c, i) {
      var fill = CELL;
      if (o.roles) fill = cnt[face[i]] > 1 ? RED : o.roles === 'ok' ? (face[i] === 0 ? PU : face[i] === 1 ? PK : BL) : CELL;
      out += rc(x0 + c[0] * s, y0 + c[1] * s, s, s, fill, INK, 2);
    });
    if (o.letter) out += tx([w - 10, 11], o.letter, 13);
    return S(w, h, out);
  }
  function isNet(cells) { var f = fold(cells), s = {}; f.forEach(function (x) { s[x] = 1; }); return Object.keys(s).length === 6; }
  var NET_TIP = 'בְּקֻבִּיָּה יֵשׁ 6 פֵּאוֹת. בְּקִפּוּל, אָסוּר שֶׁשְּׁנֵי רִבּוּעִים יִפְּלוּ זֶה עַל זֶה.';
  function netEx(cells, ok) {
    return ok ? [{ say: 'מְקַפְּלִים: הָרִבּוּעַ הַסָּגֹל לְמַטָּה, הַכְּחֻלִּים הֵם 4 הַקִּירוֹת, וְהַוָּרֹד הוּא הַמִּכְסֶה.', svg: netSvg(cells, 300, 170, { roles: 'ok' }) }, { say: 'כָּל רִבּוּעַ הוּא פֵּאָה אַחֶרֶת, לָכֵן מִתְקַבֶּלֶת קֻבִּיָּה.' }]
      : [{ say: 'כְּשֶׁמְּקַפְּלִים, הָרִבּוּעִים הָאֲדֻמִּים נוֹפְלִים זֶה עַל זֶה.', svg: netSvg(cells, 300, 170, { roles: 'no' }) }, { say: 'פֵּאָה אַחַת נִשְׁאֶרֶת פְּתוּחָה, לָכֵן לֹא מִתְקַבֶּלֶת קֻבִּיָּה.' }];
  }
  // the net of a box as a cross: middle a x b, flaps of depth c, a lid on the far side. `bad` spoils one rectangle
  function boxNet(a, b, c, bad, dv, colour) {
    var cl = c, cr = c, ct = c, cb = c, al = a, lid = true, rects, cols, rows, s, x0, y0, out = '', i, j;
    if (bad === 1) cl = c + dv; else if (bad === 2) al = a + dv; else if (bad === 3) ct = c + dv; else if (bad === 4) lid = false;
    rects = [[cl, ct, a, b, PU], [cl, 0, a, ct, bad === 3 ? RED : BL], [cl, ct + b, a, cb, BL], [0, ct, cl, b, bad === 1 ? RED : OR], [cl + a, ct, cr, b, OR]];
    if (lid) rects.push([cl + a + cr, ct, al, b, bad === 2 ? RED : PU]);
    cols = cl + a + cr + (lid ? al : 0); rows = ct + b + cb; s = Math.min(280 / cols, 156 / rows, 22); x0 = (300 - cols * s) / 2; y0 = (170 - rows * s) / 2;
    rects.forEach(function (q) {
      out += rc(x0 + q[0] * s, y0 + q[1] * s, q[2] * s, q[3] * s, colour ? q[4] : CELL);
      for (i = 1; i < q[2]; i++) out += ln([x0 + (q[0] + i) * s, y0 + q[1] * s], [x0 + (q[0] + i) * s, y0 + (q[1] + q[3]) * s], '#fff', 1.2);
      for (j = 1; j < q[3]; j++) out += ln([x0 + q[0] * s, y0 + (q[1] + j) * s], [x0 + (q[0] + q[2]) * s, y0 + (q[1] + j) * s], '#fff', 1.2);
    });
    rects.forEach(function (q) { out += rc(x0 + q[0] * s, y0 + q[1] * s, q[2] * s, q[3] * s, 'none', INK, 2.5); });
    return S(300, 170, out);
  }
  function B3(r, K) {
    var t = r(), turn = K.ri(r, 0, 3), mir = r() < 0.5, i;
    if (t < 0.35) {
      var good = K.ri(r, 0, NET_OK.length - 1), bads = K.sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], 3), pos = K.ri(r, 0, 3), oh = {}, k = 0, gc = netCells(NET_OK[good], turn, mir);
      for (i = 0; i < 4; i++) oh[LET[i]] = netSvg(i === pos ? gc : netCells(NET_NO[bads[k++]], K.ri(r, 0, 3), r() < 0.5), 100, 80, { cap: 17, m: 6, letter: LET[i] });
      return K.q(r, { text: 'אֵיזוֹ פְּרִיסָה אֶפְשָׁר לְקַפֵּל לְקֻבִּיָּה?', answer: LET[pos], options: LET.slice(), keep: true, optHtml: oh, tip: NET_TIP, ex: netEx(gc, true), key: 'b3c' + [good, turn, mir, pos, bads] });
    }
    if (t < 0.7) {
      var ok = r() < 0.5, id = ok ? K.ri(r, 0, NET_OK.length - 1) : K.ri(r, 0, NET_NO.length - 1), cells = netCells((ok ? NET_OK : NET_NO)[id], turn, mir);
      return TF(r, K, { text: 'הַאִם אֶפְשָׁר לְקַפֵּל אֶת הַצּוּרָה לְקֻבִּיָּה?', svg: netSvg(cells, 300, 160, { cap: 34 }), tip: NET_TIP, ex: netEx(cells, ok), key: 'b3t' + [ok, id, turn, mir] }, isNet(cells));
    }
    var a = K.ri(r, 2, 3), b = K.ri(r, 2, 3), c = K.ri(r, 1, 3), bad = r() < 0.45 ? 0 : K.ri(r, 1, 4), dv = (bad === 1 || bad === 3) && c > 1 && r() < 0.5 ? -1 : 1;
    return TF(r, K, { text: 'הַאִם אֶפְשָׁר לְקַפֵּל אֶת הַצּוּרָה לְתֵבָה?', svg: boxNet(a, b, c, bad, dv, false), tip: 'בְּתֵבָה יֵשׁ 6 פֵּאוֹת: 3 זוּגוֹת שֶׁל מַלְבְּנִים שָׁוִים.',
      ex: [{ say: 'בְּתֵבָה יֵשׁ 6 פֵּאוֹת, וּלְכָל פֵּאָה יֵשׁ פֵּאָה שָׁוָה מוּלָהּ: 3 זוּגוֹת.', svg: boxNet(a, b, c, bad, dv, true) },
        { say: bad === 0 ? 'כָּאן יֵשׁ 3 זוּגוֹת שֶׁל מַלְבְּנִים שָׁוִים, וְהֵם מַתְאִימִים זֶה לָזֶה. אֶפְשָׁר לְקַפֵּל לְתֵבָה.' : bad === 4 ? 'כָּאן יֵשׁ רַק 5 מַלְבְּנִים. חֲסֵרָה פֵּאָה אַחַת, לָכֵן אִי אֶפְשָׁר לִסְגֹּר תֵּבָה.' : 'הַמַּלְבֵּן הָאָדֹם שׁוֹנֶה מִבֶּן הַזּוּג שֶׁלּוֹ, לָכֵן אִי אֶפְשָׁר לִסְגֹּר תֵּבָה.' }], key: 'b3b' + [a, b, c, bad, dv] }, bad === 0);
  }

  // ---------- time ----------
  function clock(cx, cy, R, h, m, o) {
    o = o || {};
    var out = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#fff" stroke="' + INK + '" stroke-width="' + (o.small ? 2.5 : 3.5) + '"/>', i, a, p1, p2;
    for (i = 0; i < 60; i++) {
      if (o.small && i % 5) continue;
      a = i * 6 * RAD; p1 = [cx + Math.sin(a) * R * 0.97, cy - Math.cos(a) * R * 0.97]; p2 = [cx + Math.sin(a) * R * (i % 5 ? 0.92 : 0.88), cy - Math.cos(a) * R * (i % 5 ? 0.92 : 0.88)];
      out += ln(p1, p2, INK, i % 5 ? 1 : 2);
    }
    for (i = 1; i <= 12; i++) { if (o.small && i % 3) continue; a = i * 30 * RAD; out += tx([cx + Math.sin(a) * R * 0.73, cy - Math.cos(a) * R * 0.73 + 0.5], i, Math.round(R * (o.small ? 0.3 : 0.2))); }
    a = ((h % 12) + m / 60) * 30 * RAD; out += ln([cx, cy], [cx + Math.sin(a) * R * 0.48, cy - Math.cos(a) * R * 0.48], o.hcol || INK, o.small ? 4 : 6);
    a = m * 6 * RAD; out += ln([cx, cy], [cx + Math.sin(a) * R * 0.8, cy - Math.cos(a) * R * 0.8], o.mcol || INK, o.small ? 2.5 : 3.5);
    return out + dot([cx, cy], o.small ? 3 : 5);
  }
  function fmtT(h, m) { return h + ':' + (m < 10 ? '0' : '') + m; }
  function fmt24(h, m) { return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function digital(str) { return S(300, 90, rc(75, 10, 150, 70, INK, '#1d1430', 3, 12) + tx([150, 46], str, 44, '#7dffb0')); }
  function wrongTimes(h, m) { // the typical misreadings of a clock with hands
    var out = [];
    out.push([Math.round(m / 5) % 12 || 12, ((h % 12) * 5) % 60]);      // the two hands swapped
    if (m % 5 === 0) out.push([h, m / 5 || 12]);                       // the number that the long hand points to
    out.push([h % 12 + 1, m], [(h + 10) % 12 + 1, m], [h, (m + 30) % 60], [h, (m + 15) % 60]);
    return out;
  }
  function timeOpts(h, m, f) {
    var out = [f(h, m)];
    wrongTimes(h, m).forEach(function (w) { var s = f(w[0], w[1]); if (out.length < 4 && out.indexOf(s) < 0) out.push(s); });
    return out;
  }
  function fives(m) { var a = [], i; for (i = 5; i <= m; i += 5) a.push(i); return a.join(', '); }
  function readEx(h, m) {
    var f5 = Math.floor(m / 5) * 5, rest = m - f5, s2;
    if (m === 0) s2 = 'הַמָּחוֹג הָאָרֹךְ עַל 12: שָׁעָה שְׁלֵמָה, 0 דַּקּוֹת.';
    else if (f5 === 0) s2 = 'הַמָּחוֹג הָאָרֹךְ עָבַר ' + rest + ' קַוִּים קְטַנִּים אַחֲרֵי 12: ' + m + ' דַּקּוֹת.';
    else s2 = 'הַמָּחוֹג הָאָרֹךְ מַרְאֶה דַּקּוֹת. סוֹפְרִים בַּחֲמִשִּׁיּוֹת מֵ־12: ' + fives(m) + (rest ? ', וְעוֹד ' + rest + ' קַוִּים קְטַנִּים: ' + m + ' דַּקּוֹת.' : '.');
    return [{ say: 'הַמָּחוֹג הַקָּצָר מַרְאֶה אֶת הַשָּׁעָה: הוּא ' + (m ? 'עָבַר אֶת ' + h + ' וְעוֹד לֹא הִגִּיעַ לְ־' + (h % 12 + 1) : 'בְּדִיּוּק עַל ' + h) + '.', svg: S(300, 170, clock(150, 85, 78, h, m, { hcol: PU, mcol: '#c9c2d8' })) },
      { say: s2, svg: S(300, 170, clock(150, 85, 78, h, m, { hcol: '#c9c2d8', mcol: PK })) }, { say: 'הַשָּׁעָה הִיא ' + fmtT(h, m) + '.', big: fmtT(h, m), ltr: true }];
  }
  var CLOCK_TIP = 'הַמָּחוֹג הַקָּצָר מַרְאֶה שָׁעוֹת. הַמָּחוֹג הָאָרֹךְ מַרְאֶה דַּקּוֹת.';
  function M1(r, K) {
    var h = K.ri(r, 1, 12), m = r() < 0.6 ? K.ri(r, 0, 11) * 5 : K.ri(r, 1, 59);
    return K.q(r, { text: 'מָה הַשָּׁעָה?', svg: S(300, 170, clock(150, 85, 78, h, m)), answer: fmtT(h, m), options: timeOpts(h, m, fmtT), optLtr: true, tip: CLOCK_TIP, ex: readEx(h, m), key: 'm1' + [h, m] });
  }

  function period(h) { return h < 12 ? 'בַּבֹּקֶר' : h < 18 ? 'אַחֲרֵי הַצָּהֳרַיִם' : h < 22 ? 'בָּעֶרֶב' : 'בַּלַּיְלָה'; }
  var D24_TIP = 'אַחֲרֵי 12 בַּצָּהֳרַיִם מַמְשִׁיכִים לִסְפֹּר: 13, 14, 15. מוֹסִיפִים 12 לַשָּׁעָה.';
  function M2(r, K) {
    var t = r(), h = K.ri(r, 13, 23), m = K.ri(r, 0, 11) * 5, h12 = h - 12, p = period(h), opts, i;
    if (t < 0.3) { // 24 hours -> the hour in words
      opts = [fmtT(h12, m) + ' ' + p, fmtT(h12, m) + ' בַּבֹּקֶר'];
      if (h - 10 <= 12) opts.push(fmtT(h - 10, m) + ' ' + p);
      opts.push(fmtT(h12 > 1 ? h12 - 1 : h12 + 1, m) + ' ' + p);
      return K.q(r, { text: 'מָה הַשָּׁעָה בְּשָׁעוֹן שֶׁל 12 שָׁעוֹת?', svg: digital(fmt24(h, m)), answer: opts[0], options: opts, tip: 'בְּשָׁעוֹן שֶׁל 24 שָׁעוֹת, אַחֲרֵי הַצָּהֳרַיִם מַחְסִירִים 12 מֵהַשָּׁעָה.',
        ex: [{ say: 'אַחֲרֵי 12 בַּצָּהֳרַיִם הַשָּׁעוֹן מַמְשִׁיךְ לִסְפֹּר: 13, 14, 15 וְעַד 23.' }, { say: 'מַחְסִירִים 12 מֵהַשָּׁעָה. הַדַּקּוֹת לֹא מִשְׁתַּנּוֹת.', big: h + ' − 12 = ' + h12, ltr: true }, { say: 'הַשָּׁעָה הִיא ' + fmtT(h12, m) + ' ' + p + '.' }], key: 'm2a' + [h, m] });
    }
    opts = [fmt24(h, m), fmt24(h12, m), fmt24(h - 2, m), fmt24(h + 2 <= 23 ? h + 2 : h - 1, m)];
    var ex = [{ say: 'אַחֲרֵי 12 בַּצָּהֳרַיִם שָׁעוֹן שֶׁל 24 שָׁעוֹת מַמְשִׁיךְ לִסְפֹּר: 13, 14, 15 וְעַד 23.' }, { say: 'מוֹסִיפִים 12 לַשָּׁעָה. הַדַּקּוֹת לֹא מִשְׁתַּנּוֹת.', big: h12 + ' + 12 = ' + h, ltr: true }, { say: 'הַשָּׁעוֹן יַרְאֶה ' + fmt24(h, m) + '.', big: fmt24(h, m), ltr: true }];
    if (t < 0.55) return K.q(r, { text: 'הַשָּׁעָה ' + fmtT(h12, m) + ' ' + p + '. מָה יַרְאֶה שָׁעוֹן דִּיגִיטָלִי שֶׁל 24 שָׁעוֹת?', answer: opts[0], options: opts, optLtr: true, tip: D24_TIP, ex: ex, key: 'm2b' + [h, m] });
    if (t < 0.8) return K.q(r, { text: 'הַשָּׁעוֹן מַרְאֶה שָׁעָה ' + p + '. מָה יַרְאֶה שָׁעוֹן שֶׁל 24 שָׁעוֹת?', svg: S(300, 170, clock(150, 85, 78, h12, m)), answer: opts[0], options: opts, optLtr: true, tip: D24_TIP,
      ex: [{ say: 'קוֹרְאִים אֶת שְׁעוֹן הַמְּחוֹגִים: ' + fmtT(h12, m) + '.', svg: S(300, 170, clock(150, 85, 78, h12, m, { hcol: PU, mcol: PK })) }].concat(ex.slice(1)), key: 'm2c' + [h, m] });
    // a digital clock in the morning -> the clock with hands that shows the same time
    h = K.ri(r, 1, 11); m = K.pick(r, [0, 10, 15, 20, 30, 40, 45, 50]);
    var cand = [[h, m]], pos, oh = {}, sig = [];
    [[Math.round(m / 5) % 12 || 12, (h * 5) % 60], [(h + 2) % 12 + 1, m], [h, (m + 30) % 60], [(h + 5) % 12 + 1, m]].forEach(function (w) { if (cand.length < 4 && !cand.some(function (c) { return c[0] === w[0] && c[1] === w[1]; })) cand.push(w); });
    var good = cand[0]; cand = K.shuffle(r, cand); pos = cand.indexOf(good);
    for (i = 0; i < cand.length; i++) { sig.push(cand[i]); oh[LET[i]] = S(100, 80, clock(50, 41, 36, cand[i][0], cand[i][1], { small: true }) + tx([91, 11], LET[i], 13)); }
    return K.q(r, { text: 'אֵיזֶה שְׁעוֹן מְחוֹגִים מַרְאֶה אוֹתָהּ שָׁעָה?', svg: digital(fmt24(h, m)), answer: LET[pos], options: LET.slice(0, cand.length), keep: true, optHtml: oh, tip: CLOCK_TIP, ex: readEx(h, m), key: 'm2d' + [h, m, sig] });
  }

  function hoursWord(n) { return n === 1 ? 'שָׁעָה אַחַת' : n === 2 ? 'שְׁעָתַיִם' : n + ' שָׁעוֹת'; }
  function timeline(pts, jumps) { // times on a line, with the jumps between them
    var out = ln([20, 62], [280, 62], INK, 3), xs = pts.length === 2 ? [50, 250] : [40, 150, 260], i;
    for (i = 0; i < pts.length; i++) out += ln([xs[i], 54], [xs[i], 70], INK, 3) + tx([xs[i], 84], pts[i], 14);
    for (i = 0; i < jumps.length; i++) out += pth('M' + xs[i] + ' 52 Q' + (xs[i] + xs[i + 1]) / 2 + ' 4 ' + xs[i + 1] + ' 52', PK, 3) + tx([(xs[i] + xs[i + 1]) / 2, 16], jumps[i], 16, PK);
    return S(300, 96, out);
  }
  var EVENTS = ['הַשִּׁעוּר', 'הַסֶּרֶט', 'הַמִּשְׂחָק', 'הַטִּיּוּל', 'הַחוּג'];
  var EL_TIP = 'סוֹפְרִים קָדִימָה מִשְּׁעַת הַהַתְחָלָה עַד שְׁעַת הַסִּיּוּם.';
  function M3(r, K) {
    var t = r(), ev = K.pick(r, EVENTS), h1, h2, m1, m2, d, ans, opts, ex, f = r() < 0.3 ? function (h, m) { return fmtT(h + 12 > 23 ? h : h + 12, m); } : fmtT;
    function mins(n) { return n + ' דַּקּוֹת'; }
    if (t < 0.3) { // whole hours
      h1 = K.ri(r, 1, 8); d = K.ri(r, 1, 4); h2 = h1 + d; m1 = m2 = 0; if (h2 > 11) f = fmtT;
      ans = hoursWord(d); opts = nums(d, [d + 1, d - 1, d + 2], 1).map(hoursWord);
      ex = [{ say: 'סוֹפְרִים שָׁעוֹת שְׁלֵמוֹת מִ־' + f(h1, 0) + ' עַד ' + f(h2, 0) + '.', svg: timeline([f(h1, 0), f(h2, 0)], [d]) }, { say: 'עָבְרוּ ' + ans + '.', big: f(h2, 0).split(':')[0] + ' − ' + f(h1, 0).split(':')[0] + ' = ' + d, ltr: true }];
    } else if (t < 0.6) { // minutes inside one hour
      h1 = h2 = K.ri(r, 1, 11); m1 = K.ri(r, 0, 8) * 5; d = K.ri(r, 2, (55 - m1) / 5) * 5; m2 = m1 + d;
      ans = mins(d); opts = nums(d, [d + 10, d - 10, d + 5, d - 5, d + 15], 5).map(mins);
      ex = [{ say: 'שְׁתֵּי הַשָּׁעוֹת בְּאוֹתָהּ שָׁעָה. סוֹפְרִים רַק דַּקּוֹת, מִ־' + m1 + ' עַד ' + m2 + '.', svg: timeline([f(h1, m1), f(h2, m2)], [d]) }, { say: 'עָבְרוּ ' + ans + '.', big: m2 + ' − ' + m1 + ' = ' + d, ltr: true }];
    } else { // over the whole hour
      h1 = K.ri(r, 1, 10); h2 = h1 + 1; m1 = K.ri(r, 7, 11) * 5; m2 = K.ri(r, 1, Math.min(6, (m1 - 5) / 5)) * 5; d = 60 - m1 + m2;
      ans = mins(d); opts = nums(d, [m1 - m2, d + 10, d - 10, d + 5, d - 5], 5).map(mins);
      ex = [{ say: 'מִ־' + f(h1, m1) + ' עַד הַשָּׁעָה הַשְּׁלֵמָה ' + f(h2, 0) + ' עוֹבְרוֹת ' + (60 - m1) + ' דַּקּוֹת.', svg: timeline([f(h1, m1), f(h2, 0), f(h2, m2)], [60 - m1, m2]) },
        { say: 'מִ־' + f(h2, 0) + ' עַד ' + f(h2, m2) + ' עוֹבְרוֹת עוֹד ' + m2 + ' דַּקּוֹת.', big: (60 - m1) + ' + ' + m2 + ' = ' + d, ltr: true }, { say: 'עָבְרוּ ' + ans + '.' }];
    }
    return K.q(r, { text: ev + ' הִתְחִיל בְּ־' + f(h1, m1) + ' וְנִגְמַר בְּ־' + f(h2, m2) + '. כַּמָּה זְמַן עָבַר?', answer: ans, options: opts, keep: true, tip: EL_TIP, ex: ex });
  }

  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'geo',
    grade: 3,
    tiles: [
      { id: 'geo3angle', world: 'מִגְדַּל הַזָּוִיּוֹת', name: 'זָוִיּוֹת', icon: '📐', bld: 'tower', hero: 'חַדִּי', levels: [
        { name: 'מַהִי זָוִית?', f: A1 }, { name: 'אֵיזוֹ זָוִית גְּדוֹלָה יוֹתֵר?', f: A2 }, { name: 'זָוִית יְשָׁרָה', f: A3 }, { name: 'חַדָּה, יְשָׁרָה, קֵהָה, שְׁטוּחָה', f: A4 }, { name: 'זָוִיּוֹת בִּמְצֻלָּעִים', f: A5 }] },
      { id: 'geo3tri', world: 'אֲחֻזַּת הַמְּשֻׁלָּשִׁים', name: 'מְשֻׁלָּשִׁים', icon: '🔺', bld: 'castleSmall', hero: 'מְשֻׁלִּי', levels: [
        { name: 'מִיּוּן לְפִי צְלָעוֹת', f: T1 }, { name: 'מִיּוּן לְפִי זָוִיּוֹת', f: T2 }, { name: 'הֶקֵּף', f: T3 }, { name: 'מִיּוּן כָּפוּל', f: T4 }] },
      { id: 'geo3area', world: 'שְׂדֵה הַמִּשְׁבְּצוֹת', name: 'מְדִידַת שֶׁטַח', icon: '🟪', bld: 'house1', hero: 'שִׁטְחִי', levels: [
        { name: 'אֵיזֶה שֶׁטַח גָּדוֹל יוֹתֵר?', f: R1 }, { name: 'יְחִידוֹת שֶׁטַח', f: R2 }, { name: 'שֶׁטַח מַלְבֵּן', f: R3 }, { name: 'סמ״ר וּמ״ר', f: R4 }, { name: 'שֶׁטַח מוּל הֶקֵּף', f: R5 }] },
      { id: 'geo3box', world: 'בֵּית הַתֵּבוֹת', name: 'תֵּבוֹת וְקֻבִּיּוֹת', icon: '📦', bld: 'house2', hero: 'קֻבִּי', levels: [
        { name: 'קָדְקוֹד, מִקְצוֹעַ, פֵּאָה', f: B1 }, { name: 'כַּמָּה קֻבִּיּוֹת בַּתֵּבָה?', f: B2 }, { name: 'פְּרִיסוֹת', f: B3 }] },
      { id: 'geo3time', world: 'מִגְדַּל הַשָּׁעוֹן', name: 'מְדִידַת זְמַן', icon: '🕒', bld: 'towerAlt', hero: 'תִּקְתּוּק', levels: [
        { name: 'שְׁעוֹן מְחוֹגִים', f: M1 }, { name: 'שָׁעוֹן דִּיגִיטָלִי', f: M2 }, { name: 'כַּמָּה זְמַן עָבַר?', f: M3 }] }
    ]
  });
})();
