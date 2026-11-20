(function () {
  'use strict';
  // ---------- drawing helpers ----------
  var INK = '#3b2a55', COL = ['#8e5cff', '#ff5fa2', '#3aa0ff', '#ffb300', '#3ec46d'], RED = '#e11d48', GREY = '#d9d3e6';
  function f1(x) { return Math.round(x * 10) / 10; }
  function S(w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + body + '</svg>'; }
  function P(pts) { return pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' '); }
  function poly(pts, fill, stroke, sw, extra) { return '<polygon points="' + P(pts) + '" fill="' + (fill || 'none') + '" stroke="' + (stroke || INK) + '" stroke-width="' + (sw || 3) + '" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function seg(a, b, col, w, dash) { return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + (col || INK) + '" stroke-width="' + (w || 3) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function dot(p, col, rad) { return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (rad || 6) + '" fill="' + (col || RED) + '" stroke="' + INK + '" stroke-width="1.5"/>'; }
  function txt(x, y, s, size, col) { return '<text x="' + f1(x) + '" y="' + f1(y) + '" font-size="' + (size || 16) + '" font-weight="700" font-family="sans-serif" text-anchor="middle" dominant-baseline="central" fill="' + (col || INK) + '">' + s + '</text>'; }
  function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function keyOf(o) { return hash(o.text + '|' + (o.svg || '') + '|' + (o.optHtml ? JSON.stringify(o.optHtml) : '') + '|' + (o.answer == null ? '' : o.answer)); }
  function Q(r, K, o) { if (o.key == null) o.key = keyOf(o); return K.q(r, o); }
  function TF(r, K, o, truth) { if (o.key == null) o.key = keyOf(o); return K.tf(r, o, truth); }
  function M(s) { return '⁦' + s + '⁩'; } // an arithmetic expression kept left-to-right inside Hebrew
  // the answer and three wrong numbers: the typical mistakes first, neighbours as a fallback
  function nums(ans, cands, min) {
    var out = [ans];
    cands.concat([ans + 1, ans - 1, ans + 2, ans + 3, ans + 4]).forEach(function (c) { if (out.length < 4 && c != null && c === Math.round(c) && c >= (min == null ? 1 : min) && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  function ring(r, n, R1, R2, cx, cy) { // a convex polygon with n clear vertices
    var a0 = r() * 6.283, st = 6.283 / n, pts = [], i, a;
    for (i = 0; i < n; i++) { a = a0 + i * st + (r() - 0.5) * st * 0.3; pts.push([cx + R1 * Math.cos(a), cy + R2 * Math.sin(a)]); }
    return pts;
  }
  function rotPts(pts, cx, cy, ang) { var c = Math.cos(ang), s = Math.sin(ang); return pts.map(function (p) { var x = p[0] - cx, y = p[1] - cy; return [cx + x * c - y * s, cy + x * s + y * c]; }); }
  function place(unit, cx, cy, s, deg) { return rotPts(unit.map(function (p) { return [cx + p[0] * s, cy + p[1] * s]; }), cx, cy, (deg || 0) * Math.PI / 180); }
  function fit(pts, x0, y0, w, h) {
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.min.apply(null, ys), d = Math.max.apply(null, ys);
    var s = Math.min(w / (b - a), h / (d - c));
    return pts.map(function (p) { return [x0 + w / 2 + (p[0] - (a + b) / 2) * s, y0 + h / 2 + (p[1] - (c + d) / 2) * s]; });
  }
  function rightMark(p, q1, q2, z) {
    function u(q) { var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.sqrt(dx * dx + dy * dy); return [dx / l * z, dy / l * z]; }
    var a = u(q1), b = u(q2);
    return '<polyline points="' + P([[p[0] + a[0], p[1] + a[1]], [p[0] + a[0] + b[0], p[1] + a[1] + b[1]], [p[0] + b[0], p[1] + b[1]]]) + '" fill="none" stroke="' + INK + '" stroke-width="2"/>';
  }
  function tick(a, b, z) { var m = mid(a, b), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), n = [-dy / l * z, dx / l * z]; return seg([m[0] - n[0], m[1] - n[1]], [m[0] + n[0], m[1] + n[1]], INK, 2.5); }
  function allRight(pts, z) { var n = pts.length; return pts.map(function (p, i) { return rightMark(p, pts[(i + 1) % n], pts[(i + n - 1) % n], z); }).join(''); }

  // ---------- world 1: polygons and diagonals ----------
  var PNAME = { 3: 'מְשֻׁלָּשׁ', 4: 'מְרֻבָּע', 5: 'מְחֻמָּשׁ', 6: 'מְשֻׁשֶּׁה', 7: 'מְשֻׁבָּע', 8: 'מְתֻמָּן' };
  var DART = [[0, -1], [0.8, 0.8], [0, 0.2], [-0.8, 0.8]];
  var CONC = [DART,
    [[-0.9, -0.7], [0.9, -0.7], [0.9, 0.7], [0, 0], [-0.9, 0.7]],
    [[-0.9, -1], [-0.2, -1], [-0.2, 0.3], [0.7, 0.3], [0.7, 1], [-0.9, 1]],
    [[0, -1], [1, 0], [0.4, 0], [0.4, 1], [-0.4, 1], [-0.4, 0], [-1, 0]],
    [[-1, -0.9], [1, -0.9], [1, -0.2], [0.35, -0.2], [0.35, 0.9], [-0.35, 0.9], [-0.35, -0.2], [-1, -0.2]]];
  function h11(r, K) {
    var t = K.ri(r, 0, 2), col = K.pick(r, COL), pts, n;
    if (r() < 0.3) pts = place(K.pick(r, CONC), 150, 82, 70, K.ri(r, 0, 3) * 90); else pts = ring(r, K.ri(r, 3, 8), 100, 72, 150, 82);
    n = pts.length;
    var svg = S(300, 164, poly(pts, col));
    var exs = S(300, 164, poly(pts, col) + pts.map(function (p, i) { return dot(p, RED, 9) + txt(p[0], p[1], i + 1, 11, '#fff'); }).join(''));
    var ex = [{ say: 'סוֹפְרִים אֶת הַקָּדְקוֹדִים אֶחָד אֶחָד.', svg: exs }, { say: 'יֵשׁ ' + n + ' קָדְקוֹדִים, וְלָכֵן יֵשׁ גַּם ' + n + ' צְלָעוֹת.' }];
    if (t === 2) {
      ex.push({ say: 'מְצֻלָּע שֶׁיֵּשׁ לוֹ ' + n + ' צְלָעוֹת נִקְרָא ' + PNAME[n] + '.' });
      return Q(r, K, { text: 'אֵיזֶה מְצֻלָּע זֶה?', svg: svg, answer: PNAME[n], options: K.opts(r, PNAME[n], [PNAME[n - 1] || PNAME[5], PNAME[n + 1] || PNAME[6], PNAME[n + 2] || PNAME[n - 2], PNAME[3], PNAME[8]], 4), tip: 'סוֹפְרִים אֶת הַצְּלָעוֹת.', ex: ex });
    }
    return Q(r, K, { text: t === 0 ? 'כַּמָּה צְלָעוֹת יֵשׁ לַמְּצֻלָּע?' : 'כַּמָּה קָדְקוֹדִים יֵשׁ לַמְּצֻלָּע?', svg: svg, answer: n, options: nums(n, [n - 1, n + 1, n + 2], 2), tip: 'בְּכָל מְצֻלָּע מִסְפַּר הַצְּלָעוֹת שָׁוֶה לְמִסְפַּר הַקָּדְקוֹדִים.', ex: ex });
  }
  function h12(r, K) {
    var col = K.pick(r, [COL[0], COL[2], COL[3], COL[4]]), t = K.ri(r, 0, 9), n = K.ri(r, 4, 7), pts, i, j, a, b, truth, why, red, ends = '';
    var DEF = 'אֲלַכְסוֹן מְחַבֵּר שְׁנֵי קָדְקוֹדִים שֶׁאֵינָם עַל אוֹתָהּ צֶלַע.';
    if (t === 0) { // a diagonal outside a concave polygon
      pts = place(DART, 150, 84, 72, K.ri(r, 0, 3) * 90); a = pts[1]; b = pts[3]; truth = true;
      why = 'הַקֶּטַע מְחַבֵּר שְׁנֵי קָדְקוֹדִים שֶׁאֵינָם עַל אוֹתָהּ צֶלַע. אֲלַכְסוֹן יָכוֹל לַעֲבֹר גַּם מִחוּץ לַמְּצֻלָּע.';
    } else {
      pts = ring(r, n, 72, 72, 150, 84); i = K.ri(r, 0, n - 1); j = (i + 2 + K.ri(r, 0, n - 4)) % n;
      if (t <= 4) {
        if (t <= 2) pts = rotPts(pts, 150, 84, -Math.atan2(pts[j][1] - pts[i][1], pts[j][0] - pts[i][0]) + (t === 2 ? Math.PI / 2 : 0)); // also a diagonal that lies flat or stands up
        a = pts[i]; b = pts[j]; truth = true; why = 'הַקֶּטַע מְחַבֵּר שְׁנֵי קָדְקוֹדִים שֶׁאֵינָם שְׁכֵנִים, לָכֵן הוּא אֲלַכְסוֹן.';
      } else if (t === 5) { a = pts[i]; b = pts[(i + 1) % n]; truth = false; why = 'שְׁנֵי הַקָּדְקוֹדִים שְׁכֵנִים. זוֹ צֶלַע שֶׁל הַמְּצֻלָּע, לֹא אֲלַכְסוֹן.'; }
      else if (t <= 7) { j = (i + 1 + K.ri(r, 0, n - 3)) % n; a = pts[i]; b = mid(pts[j], pts[(j + 1) % n]); truth = false; why = 'קָצֶה אֶחָד נִמְצָא בְּאֶמְצַע צֶלַע וְלֹא בְּקָדְקוֹד, לָכֵן זֶה לֹא אֲלַכְסוֹן.'; }
      else if (t === 8) { a = mid(pts[i], pts[(i + 1) % n]); b = mid(pts[j], pts[(j + 1) % n]); truth = false; why = 'שְׁנֵי הַקְּצָווֹת נִמְצָאִים עַל צְלָעוֹת וְלֹא בְּקָדְקוֹדִים, לָכֵן זֶה לֹא אֲלַכְסוֹן.'; }
      else { a = pts[i]; b = pts[j]; truth = false; why = 'זֶה קַו עָקֹם. אֲלַכְסוֹן הוּא קֶטַע יָשָׁר.'; }
    }
    if (t === 9) { var m = mid(a, b), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy); red = '<path d="M' + f1(a[0]) + ',' + f1(a[1]) + ' Q' + f1(m[0] - dy / l * 55) + ',' + f1(m[1] + dx / l * 55) + ' ' + f1(b[0]) + ',' + f1(b[1]) + '" fill="none" stroke="' + RED + '" stroke-width="4" stroke-linecap="round"/>'; }
    else red = seg(a, b, RED, 4);
    ends = dot(a, '#ffb300', 6) + dot(b, '#ffb300', 6);
    return TF(r, K, { text: 'הַאִם הַקֶּטַע הָאָדֹם הוּא אֲלַכְסוֹן?', svg: S(300, 168, poly(pts, col) + red), tip: DEF,
      ex: [{ say: DEF, svg: S(300, 168, poly(pts, col) + red) }, { say: 'בּוֹדְקִים אֶת שְׁנֵי הַקְּצָווֹת שֶׁל הַקַּו הָאָדֹם.', svg: S(300, 168, poly(pts, col) + red + ends) }, { say: why }] }, truth);
  }
  function h13(r, K) {
    var col = K.pick(r, COL), total = r() < 0.3, n = total ? K.ri(r, 4, 6) : K.ri(r, 4, 8), pts = ring(r, n, 96, 74, 150, 84), i = K.ri(r, 0, n - 1), k, j, d = '', all = '';
    for (k = 2; k <= n - 2; k++) d += seg(pts[i], pts[(i + k) % n], RED, 3);
    for (k = 0; k < n; k++) for (j = k + 2; j < n; j++) if (!(k === 0 && j === n - 1)) all += seg(pts[k], pts[j], RED, 2.5);
    if (total) {
      var D = n * (n - 3) / 2;
      return Q(r, K, { text: 'כַּמָּה אֲלַכְסוֹנִים יֵשׁ לַמְּצֻלָּע בְּסַךְ הַכֹּל?', svg: S(300, 168, poly(pts, col)), answer: D, options: nums(D, [n, n - 3, n * (n - 3), D + 1]), tip: 'מְצַיְּרִים אֶת כָּל הָאֲלַכְסוֹנִים וְסוֹפְרִים.',
        ex: [{ say: 'מְחַבְּרִים כָּל שְׁנֵי קָדְקוֹדִים שֶׁאֵינָם שְׁכֵנִים.', svg: S(300, 168, poly(pts, col) + all) }, { say: 'סוֹפְרִים אֶת הַקַּוִּים הָאֲדֻמִּים: יֵשׁ ' + D + ' אֲלַכְסוֹנִים.' }] });
    }
    var mark = dot(pts[i], RED, 8), nb = dot(pts[(i + 1) % n], '#fff', 7) + dot(pts[(i + n - 1) % n], '#fff', 7);
    return Q(r, K, { text: 'כַּמָּה אֲלַכְסוֹנִים יוֹצְאִים מֵהַקָּדְקוֹד הַמְּסֻמָּן?', svg: S(300, 168, poly(pts, col) + mark), answer: n - 3, options: nums(n - 3, [n, n - 1, n - 2]), tip: 'אֲלַכְסוֹן לֹא יוֹצֵא אֶל קָדְקוֹד שָׁכֵן.',
      ex: [{ say: 'מֵהַקָּדְקוֹד הָאָדֹם לֹא מְחַבְּרִים אֶל עַצְמוֹ וְלֹא אֶל שְׁנֵי הַשְּׁכֵנִים שֶׁלּוֹ (הַלְּבָנִים).', svg: S(300, 168, poly(pts, col) + nb + mark) },
        { say: 'לַמְּצֻלָּע ' + n + ' קָדְקוֹדִים. מוֹרִידִים 3: ' + M(n + ' − 3 = ' + (n - 3)) + '.', svg: S(300, 168, poly(pts, col) + d + nb + mark) },
        { say: (n - 3 === 1 ? 'יוֹצֵא אֲלַכְסוֹן אֶחָד.' : 'יוֹצְאִים ' + (n - 3) + ' אֲלַכְסוֹנִים.') }] });
  }
  // quadrilaterals (unit coordinates); R = it is a rectangle
  var QUAD = {
    rect: { p: [[-1.2, -0.65], [1.2, -0.65], [1.2, 0.65], [-1.2, 0.65]], R: 1 },
    sq: { p: [[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]], R: 1 },
    sqT: { p: [[0, -1.1], [1.1, 0], [0, 1.1], [-1.1, 0]], R: 1 },
    rectT: { p: [[-0.72, -1.0], [1.18, 0.1], [0.72, 1.0], [-1.18, -0.1]], R: 1 },
    para: { p: [[-1.2, 0.6], [0.6, 0.6], [1.2, -0.6], [-0.6, -0.6]], R: 0 },
    rhomb: { p: [[-1.25, 0], [0, -0.65], [1.25, 0], [0, 0.65]], R: 0 },
    kite: { p: [[0, -0.9], [0.7, -0.2], [0, 1.1], [-0.7, -0.2]], R: 0 },
    trap: { p: [[-1.2, 0.6], [1.2, 0.6], [0.6, -0.6], [-0.6, -0.6]], R: 0 },
    gen: { p: [[-1, 0.7], [1.1, 0.5], [0.5, -0.8], [-0.6, -0.4]], R: 0 }
  };
  var QR = ['rect', 'sq', 'sqT', 'rectT'], QN = ['para', 'rhomb', 'kite', 'trap', 'gen'];
  var RSQ = S(300, 150, (function () { var a = [[30, 35], [170, 35], [170, 115], [30, 115]], b = [[195, 35], [275, 35], [275, 115], [195, 115]]; return poly(a, COL[2]) + allRight(a, 11) + poly(b, COL[3]) + allRight(b, 11); })());
  var RECT_TF = [
    ['לְכָל מַלְבֵּן יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת.', 1, 'בְּמַלְבֵּן כָּל הַזָּוִיּוֹת יְשָׁרוֹת, וְיֵשׁ 4 כָּאֵלֶּה.'],
    ['כָּל רִבּוּעַ הוּא מַלְבֵּן.', 1, 'לְרִבּוּעַ יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת, לָכֵן הוּא מַלְבֵּן מְיֻחָד.'],
    ['כָּל מַלְבֵּן הוּא רִבּוּעַ.', 0, 'יֵשׁ מַלְבְּנִים שֶׁלֹּא כָּל הַצְּלָעוֹת שֶׁלָּהֶם שָׁווֹת. הֵם לֹא רִבּוּעִים.'],
    ['בְּרִבּוּעַ כָּל הַצְּלָעוֹת שָׁווֹת.', 1, 'בְּרִבּוּעַ יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת וְ-4 צְלָעוֹת שָׁווֹת.'],
    ['בְּכָל מַלְבֵּן כָּל הַצְּלָעוֹת שָׁווֹת.', 0, 'בְּמַלְבֵּן הַצְּלָעוֹת הַנֶּגְדִּיּוֹת שָׁווֹת. רַק בְּרִבּוּעַ כֻּלָּן שָׁווֹת.'],
    ['בְּמַלְבֵּן הַצְּלָעוֹת הַנֶּגְדִּיּוֹת שָׁווֹת.', 1, 'בְּמַלְבֵּן כָּל שְׁתֵּי צְלָעוֹת שֶׁזּוֹ מוּל זוֹ שָׁווֹת בָּאֹרֶךְ.'],
    ['בְּמַלְבֵּן הַצְּלָעוֹת הַנֶּגְדִּיּוֹת מַקְבִּילוֹת.', 1, 'צְלָעוֹת שֶׁזּוֹ מוּל זוֹ בְּמַלְבֵּן לְעוֹלָם לֹא נִפְגָּשׁוֹת: הֵן מַקְבִּילוֹת.'],
    ['בְּמַלְבֵּן צְלָעוֹת סְמוּכוֹת מְאֻנָּכוֹת זוֹ לָזוֹ.', 1, 'בֵּין שְׁתֵּי צְלָעוֹת סְמוּכוֹת בְּמַלְבֵּן יֵשׁ זָוִית יְשָׁרָה.'],
    ['לְמַלְבֵּן יֵשׁ 2 אֲלַכְסוֹנִים.', 1, 'בְּכָל מְרֻבָּע יֵשׁ 2 אֲלַכְסוֹנִים.'],
    ['לְרִבּוּעַ יֵשׁ 4 אֲלַכְסוֹנִים.', 0, 'בְּכָל מְרֻבָּע, וְגַם בְּרִבּוּעַ, יֵשׁ רַק 2 אֲלַכְסוֹנִים.'],
    ['מְרֻבָּע שֶׁיֵּשׁ לוֹ 4 זָוִיּוֹת יְשָׁרוֹת הוּא מַלְבֵּן.', 1, 'כָּךְ מַגְדִּירִים מַלְבֵּן: מְרֻבָּע שֶׁכָּל הַזָּוִיּוֹת שֶׁלּוֹ יְשָׁרוֹת.'],
    ['מְרֻבָּע שֶׁכָּל צַלְעוֹתָיו שָׁווֹת הוּא תָּמִיד רִבּוּעַ.', 0, 'גַּם בִּמְעֻיָּן כָּל הַצְּלָעוֹת שָׁווֹת, אֲבָל הַזָּוִיּוֹת שֶׁלּוֹ לֹא תָּמִיד יְשָׁרוֹת.'],
    ['לְרִבּוּעַ יֵשׁ 4 קָדְקוֹדִים.', 1, 'רִבּוּעַ הוּא מְרֻבָּע: 4 צְלָעוֹת וְ-4 קָדְקוֹדִים.'],
    ['רִבּוּעַ הוּא מַלְבֵּן שֶׁכָּל צַלְעוֹתָיו שָׁווֹת.', 1, 'לְרִבּוּעַ יֵשׁ 4 זָוִיּוֹת יְשָׁרוֹת כְּמוֹ לְכָל מַלְבֵּן, וְגַם 4 צְלָעוֹת שָׁווֹת.'],
    ['יֵשׁ מַלְבֵּן שֶׁיֵּשׁ לוֹ זָוִית חַדָּה.', 0, 'בְּמַלְבֵּן כָּל הַזָּוִיּוֹת יְשָׁרוֹת. אֵין בּוֹ זָוִית חַדָּה.'],
    ['מַלְבֵּן שֶׁמְּסוֹבְבִים אוֹתוֹ נִשְׁאָר מַלְבֵּן.', 1, 'כְּשֶׁמְּסוֹבְבִים צוּרָה, הַזָּוִיּוֹת וְהַצְּלָעוֹת שֶׁלָּהּ לֹא מִשְׁתַּנּוֹת.'],
    ['רִבּוּעַ שֶׁעוֹמֵד עַל קָדְקוֹד הוּא עֲדַיִן רִבּוּעַ.', 1, 'כְּשֶׁמְּסוֹבְבִים צוּרָה, הַזָּוִיּוֹת וְהַצְּלָעוֹת שֶׁלָּהּ לֹא מִשְׁתַּנּוֹת.'],
    ['אֶפְשָׁר לְצַיֵּר מְרֻבָּע שֶׁיֵּשׁ לוֹ בְּדִיּוּק 3 זָוִיּוֹת יְשָׁרוֹת.', 0, 'אִם 3 זָוִיּוֹת יְשָׁרוֹת, גַּם הָרְבִיעִית יוֹצֵאת יְשָׁרָה.'],
    ['בְּרִבּוּעַ הַצְּלָעוֹת הַנֶּגְדִּיּוֹת מַקְבִּילוֹת.', 1, 'רִבּוּעַ הוּא מַלְבֵּן, וּבְמַלְבֵּן הַצְּלָעוֹת הַנֶּגְדִּיּוֹת מַקְבִּילוֹת.'],
    ['לְכָל מְרֻבָּע יֵשׁ 4 צְלָעוֹת וְ-4 קָדְקוֹדִים.', 1, 'מְרֻבָּע הוּא מְצֻלָּע שֶׁיֵּשׁ לוֹ 4 צְלָעוֹת וְ-4 קָדְקוֹדִים.']
  ];
  var RDEF = 'מַלְבֵּן הוּא מְרֻבָּע שֶׁכָּל הַזָּוִיּוֹת שֶׁלּוֹ יְשָׁרוֹת.';
  function h14(r, K) {
    var t = r(), ids, c, body, exb, i, q, o = {}, keys = ['a', 'b', 'c', 'd'], ans;
    if (t < 0.34) {
      q = K.pick(r, RECT_TF);
      return TF(r, K, { text: q[0], tip: RDEF, ex: [{ say: 'בַּצִּיּוּר: מַלְבֵּן וְרִבּוּעַ. בִּשְׁנֵיהֶם כָּל הַזָּוִיּוֹת יְשָׁרוֹת.', svg: RSQ }, { say: q[2] }] }, !!q[1]);
    }
    if (t < 0.7) { // how many rectangles (the square counts)
      ids = K.shuffle(r, K.sample(r, QR, K.ri(r, 0, 3)).concat(K.sample(r, QN, 4))).slice(0, 4); ids = K.shuffle(r, ids);
      c = ids.filter(function (id) { return QUAD[id].R; }).length; body = ''; exb = '';
      for (i = 0; i < 4; i++) { var pp = place(QUAD[ids[i]].p, 40 + i * 73, 62, 27, 0); body += poly(pp, COL[(i + 1) % 5]); exb += poly(pp, QUAD[ids[i]].R ? COL[4] : GREY) + (QUAD[ids[i]].R ? allRight(pp, 7) : ''); }
      return Q(r, K, { text: 'כַּמָּה מַלְבְּנִים יֵשׁ בַּצִּיּוּר?', svg: S(300, 124, body), answer: c, options: nums(c, [c - 1, c + 1, c - 2, c + 2].filter(function (x) { return x <= 4; }), 0).filter(function (x) { return x <= 4; }), tip: RDEF,
        ex: [{ say: RDEF + ' בּוֹדְקִים אֶת הַזָּוִיּוֹת שֶׁל כָּל צוּרָה.', svg: S(300, 124, body) }, { say: 'גַּם רִבּוּעַ הוּא מַלְבֵּן, כִּי יֵשׁ לוֹ 4 זָוִיּוֹת יְשָׁרוֹת. גַּם כְּשֶׁהוּא מְסוֹבָב.', svg: S(300, 124, exb) }, { say: c ? 'הַמַּלְבְּנִים צְבוּעִים בְּיָרֹק: ' + c + '.' : 'בְּכָל הַצּוּרוֹת כָּאן יֵשׁ זָוִיּוֹת שֶׁאֵינָן יְשָׁרוֹת, לָכֵן אֵין כָּאן מַלְבְּנִים.' }] });
    }
    var isR = r() < 0.5; // which one is / is not a rectangle
    ids = isR ? [K.pick(r, QR)].concat(K.sample(r, QN, 3)) : [K.pick(r, QN)].concat(K.sample(r, QR, 3));
    ans = keys[K.ri(r, 0, 3)]; c = 1;
    keys.forEach(function (k) { var id = k === ans ? ids[0] : ids[c++]; o[k] = S(96, 72, poly(place(QUAD[id].p, 48, 36, 27, 0), COL[keys.indexOf(k)])); });
    var pa = place(QUAD[ids[0]].p, 150, 75, 52, 0);
    return Q(r, K, { text: isR ? 'אֵיזוֹ צוּרָה הִיא מַלְבֵּן?' : 'אֵיזוֹ צוּרָה אֵינָהּ מַלְבֵּן?', answer: ans, options: keys, keep: true, optHtml: o, tip: RDEF,
      ex: [{ say: RDEF, svg: RSQ }, { say: isR ? 'בַּצּוּרָה הַזֹּאת כָּל הַזָּוִיּוֹת יְשָׁרוֹת, לָכֵן הִיא מַלְבֵּן. גַּם רִבּוּעַ הוּא מַלְבֵּן.' : 'בַּצּוּרָה הַזֹּאת הַזָּוִיּוֹת אֵינָן יְשָׁרוֹת, לָכֵן הִיא לֹא מַלְבֵּן.', svg: S(300, 150, poly(pa, COL[4]) + (isR ? allRight(pa, 11) : '')) }] });
  }
  // the seven kinds of triangles: s = by sides (0 equilateral, 1 isosceles, 2 scalene), a = by angles (0 acute, 1 right, 2 obtuse)
  var TRI = [
    { id: 'eq', p: [[0, 0], [100, 0], [50, -86.6]], eq: [0, 1, 2], rt: -1, s: 0, a: 0 },
    { id: 'ia', p: [[0, 0], [70, 0], [35, -100]], eq: [1, 2], rt: -1, s: 1, a: 0 },
    { id: 'ir', p: [[0, 0], [90, 0], [0, -90]], eq: [0, 2], rt: 0, s: 1, a: 1 },
    { id: 'io', p: [[0, 0], [140, 0], [70, -35]], eq: [1, 2], rt: -1, s: 1, a: 2 },
    { id: 'sa', p: [[0, 0], [90, 0], [36.7, -59.6]], eq: [], rt: -1, s: 2, a: 0 },
    { id: 'sr', p: [[0, 0], [120, 0], [0, -70]], eq: [], rt: 0, s: 2, a: 1 },
    { id: 'so', p: [[0, 0], [80, 0], [130, -60]], eq: [], rt: -1, s: 2, a: 2 }
  ];
  var SN = ['שְׁוֵה־צְלָעוֹת', 'שְׁוֵה־שׁוֹקַיִם', 'שׁוֹנֵה־צְלָעוֹת'], AN = ['חַד־זָוִיּוֹת', 'יְשַׁר־זָוִית', 'קְהֵה־זָוִית'];
  var SSAY = ['שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת', 'יֵשׁ שְׁתֵּי צְלָעוֹת שָׁווֹת', 'אֵין צְלָעוֹת שָׁווֹת'], ASAY = ['כָּל הַזָּוִיּוֹת חַדּוֹת', 'יֵשׁ זָוִית יְשָׁרָה', 'יֵשׁ זָוִית קֵהָה, גְּדוֹלָה מִזָּוִית יְשָׁרָה'];
  var TTIP = 'צְלָעוֹת שָׁווֹת מְסֻמָּנוֹת בְּקַו קָטָן, וְזָוִית יְשָׁרָה בְּרִבּוּעַ קָטָן.';
  function triBody(t, v, x0, y0, w, h, col, z) {
    var p = t.p.map(function (q) { var x = q[0], y = q[1], k, tx; for (k = 0; k < v % 4; k++) { tx = -y; y = x; x = tx; } return [v >= 4 ? -x : x, y]; });
    p = fit(p, x0 + 8, y0 + 8, w - 16, h - 16);
    return poly(p, col) + t.eq.map(function (i) { return tick(p[i], p[(i + 1) % 3], z || 6); }).join('') + (t.rt >= 0 ? rightMark(p[t.rt], p[(t.rt + 1) % 3], p[(t.rt + 2) % 3], (z || 6) * 1.8) : '');
  }
  function triById(id) { return TRI.filter(function (t) { return t.id === id; })[0]; }
  var TRI_TF = [
    ['בִּמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת.', 1, 'שְׁוֵה־צְלָעוֹת: כָּל שָׁלוֹשׁ הַצְּלָעוֹת שָׁווֹת.', 'eq'],
    ['בִּמְשֻׁלָּשׁ שְׁוֵה־שׁוֹקַיִם יֵשׁ לְפָחוֹת שְׁתֵּי צְלָעוֹת שָׁווֹת.', 1, 'שְׁתֵּי הַצְּלָעוֹת הַשָּׁווֹת נִקְרָאוֹת שׁוֹקַיִם.', 'ia'],
    ['בִּמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת אֵין צְלָעוֹת שָׁווֹת.', 1, 'שׁוֹנֵה־צְלָעוֹת: כָּל צֶלַע בְּאֹרֶךְ אַחֵר.', 'sa'],
    ['בִּמְשֻׁלָּשׁ יְשַׁר־זָוִית יֵשׁ זָוִית יְשָׁרָה אַחַת.', 1, 'זָוִית יְשָׁרָה אַחַת, וּשְׁתֵּי הָאֲחֵרוֹת חַדּוֹת.', 'sr'],
    ['בִּמְשֻׁלָּשׁ יְשַׁר־זָוִית יֵשׁ שְׁתֵּי זָוִיּוֹת יְשָׁרוֹת.', 0, 'בִּמְשֻׁלָּשׁ יְכוֹלָה לִהְיוֹת רַק זָוִית יְשָׁרָה אַחַת. עִם שְׁתַּיִם הַמְּשֻׁלָּשׁ לֹא נִסְגָּר.', 'sr'],
    ['בִּמְשֻׁלָּשׁ קְהֵה־זָוִית יֵשׁ זָוִית קֵהָה אַחַת.', 1, 'זָוִית קֵהָה אַחַת, וּשְׁתֵּי הָאֲחֵרוֹת חַדּוֹת.', 'so'],
    ['בִּמְשֻׁלָּשׁ חַד־זָוִיּוֹת כָּל הַזָּוִיּוֹת חַדּוֹת.', 1, 'חַד־זָוִיּוֹת: שָׁלוֹשׁ זָוִיּוֹת חַדּוֹת.', 'sa'],
    ['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת יְשַׁר־זָוִית וְגַם שְׁוֵה־שׁוֹקַיִם.', 1, 'כֵּן: חוֹתְכִים רִבּוּעַ לְאֹרֶךְ הָאֲלַכְסוֹן וּמְקַבְּלִים מְשֻׁלָּשׁ כָּזֶה.', 'ir'],
    ['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת קְהֵה־זָוִית וְגַם שְׁוֵה־שׁוֹקַיִם.', 1, 'כֵּן: שְׁתֵּי שׁוֹקַיִם שָׁווֹת וּבֵינֵיהֶן זָוִית קֵהָה.', 'io'],
    ['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת יְשַׁר־זָוִית וְגַם שְׁוֵה־צְלָעוֹת.', 0, 'בִּמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת כָּל הַזָּוִיּוֹת שָׁווֹת וְחַדּוֹת.', 'eq'],
    ['מְשֻׁלָּשׁ יָכוֹל לִהְיוֹת קְהֵה־זָוִית וְגַם שְׁוֵה־צְלָעוֹת.', 0, 'בִּמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת כָּל הַזָּוִיּוֹת שָׁווֹת וְחַדּוֹת.', 'eq'],
    ['מְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת הוּא תָּמִיד חַד־זָוִיּוֹת.', 1, 'בִּמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת כָּל הַזָּוִיּוֹת שָׁווֹת וְחַדּוֹת.', 'eq'],
    ['לְכָל מְשֻׁלָּשׁ יֵשׁ 3 קָדְקוֹדִים.', 1, 'מְשֻׁלָּשׁ: 3 צְלָעוֹת וְ-3 קָדְקוֹדִים.', 'sa'],
    ['לִמְשֻׁלָּשׁ אֵין אֲלַכְסוֹנִים.', 1, 'בִּמְשֻׁלָּשׁ כָּל שְׁנֵי קָדְקוֹדִים נִמְצָאִים עַל אוֹתָהּ צֶלַע.', 'sa'],
    ['בִּמְשֻׁלָּשׁ יְכוֹלוֹת לִהְיוֹת שְׁתֵּי זָוִיּוֹת קֵהוֹת.', 0, 'עִם שְׁתֵּי זָוִיּוֹת קֵהוֹת הַמְּשֻׁלָּשׁ לֹא נִסְגָּר.', 'so'],
    ['מְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת הוּא גַּם שְׁוֵה־שׁוֹקַיִם.', 1, 'יֵשׁ בּוֹ שְׁתֵּי צְלָעוֹת שָׁווֹת (וַאֲפִלּוּ שָׁלוֹשׁ), לָכֵן הוּא גַּם שְׁוֵה־שׁוֹקַיִם.', 'eq'],
    ['בִּמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת יְכוֹלָה לִהְיוֹת זָוִית יְשָׁרָה.', 1, 'כֵּן: בַּצִּיּוּר מְשֻׁלָּשׁ יְשַׁר־זָוִית שֶׁכָּל הַצְּלָעוֹת שֶׁלּוֹ שׁוֹנוֹת.', 'sr'],
    ['לִמְשֻׁלָּשׁ שְׁוֵה־שׁוֹקַיִם יֵשׁ קַו סִימֶטְרְיָה.', 1, 'מְקַפְּלִים אוֹתוֹ בָּאֶמְצַע, וְשׁוֹק אַחַת מְכַסָּה אֶת הַשְּׁנִיָּה.', 'ia']
  ];
  function h15(r, K) {
    var u = r(), col = K.pick(r, COL), v = K.ri(r, 0, 7), t, q, svg;
    if (u < 0.2) {
      if (r() < 0.4) { // can three lengths close a triangle?
        var a = K.ri(r, 2, 6), b = K.ri(r, a, 8), ok = r() < 0.5, c = ok ? K.ri(r, b, a + b - 1) : K.ri(r, a + b + 1, a + b + 4);
        return TF(r, K, { text: 'מִשָּׁלוֹשׁ צְלָעוֹת בְּאֹרֶךְ ' + a + ', ' + b + ' וְ-' + c + ' אֶפְשָׁר לִבְנוֹת מְשֻׁלָּשׁ.', tip: 'שְׁתֵּי הַצְּלָעוֹת הַקְּצָרוֹת יַחַד צְרִיכוֹת לִהְיוֹת אֲרֻכּוֹת מֵהַצֶּלַע הָאֲרֻכָּה.',
          ex: [{ say: 'מְחַבְּרִים אֶת שְׁתֵּי הַצְּלָעוֹת הַקְּצָרוֹת.', big: a + ' + ' + b + ' = ' + (a + b), ltr: true }, { say: ok ? (a + b) + ' גָּדוֹל מִ-' + c + ', לָכֵן הַמְּשֻׁלָּשׁ נִסְגָּר.' : (a + b) + ' קָטָן מִ-' + c + '. שְׁתֵּי הַצְּלָעוֹת הַקְּצָרוֹת לֹא נִפְגָּשׁוֹת, וְאֵין מְשֻׁלָּשׁ.' }] }, ok);
      }
      q = K.pick(r, TRI_TF);
      return TF(r, K, { text: q[0], ex: [{ say: q[2], svg: S(300, 150, triBody(triById(q[3]), 0, 60, 5, 180, 140, col, 7)) }] }, !!q[1]);
    }
    if (u < 0.45) { // by sides (an equilateral triangle is also isosceles, so it is not asked here)
      t = K.pick(r, TRI.slice(1)); svg = S(300, 160, triBody(t, v, 50, 4, 200, 152, col, 7));
      return Q(r, K, { text: 'אֵיזֶה מְשֻׁלָּשׁ זֶה לְפִי הַצְּלָעוֹת?', svg: svg, answer: SN[t.s], options: SN, keep: true, tip: TTIP,
        ex: [{ say: TTIP, svg: svg }, { say: 'בַּמְּשֻׁלָּשׁ הַזֶּה ' + SSAY[t.s] + ', לָכֵן הוּא ' + SN[t.s] + '.' }] });
    }
    if (u < 0.7) { // by angles
      t = K.pick(r, TRI); svg = S(300, 160, triBody(t, v, 50, 4, 200, 152, col, 7));
      return Q(r, K, { text: 'אֵיזֶה מְשֻׁלָּשׁ זֶה לְפִי הַזָּוִיּוֹת?', svg: svg, answer: AN[t.a], options: AN, keep: true, tip: 'בּוֹדְקִים אֶת הַזָּוִית הַגְּדוֹלָה בְּיוֹתֵר בַּמְּשֻׁלָּשׁ.',
        ex: [{ say: 'בּוֹדְקִים אֶת הַזָּוִית הַגְּדוֹלָה בְּיוֹתֵר בַּמְּשֻׁלָּשׁ.', svg: svg }, { say: 'בַּמְּשֻׁלָּשׁ הַזֶּה ' + ASAY[t.a] + ', לָכֵן הוּא ' + AN[t.a] + '.' }] });
    }
    // the double sort: sides and angles together
    t = K.pick(r, TRI);
    var others = K.sample(r, TRI.filter(function (x) { return x !== t && !(t.id === 'ia' && x.id === 'eq'); }), 3), keys = ['a', 'b', 'c', 'd'], ans = keys[K.ri(r, 0, 3)], o = {}, c2 = 0;
    keys.forEach(function (k, i) { o[k] = S(96, 72, triBody(k === ans ? t : others[c2++], ((v + i) % 4) * 2, 4, 2, 88, 68, COL[i], 4)); });
    return Q(r, K, { text: t.id === 'eq' ? 'אֵיזֶה מְשֻׁלָּשׁ הוּא שְׁוֵה־צְלָעוֹת?' : 'אֵיזֶה מְשֻׁלָּשׁ הוּא ' + AN[t.a] + ' וְגַם ' + SN[t.s] + '?', answer: ans, options: keys, keep: true, optHtml: o, tip: TTIP,
      ex: [{ say: TTIP, svg: S(300, 160, triBody(t, v, 50, 4, 200, 152, col, 7)) }, { say: 'בַּמְּשֻׁלָּשׁ הַזֶּה ' + SSAY[t.s] + ' וְגַם ' + ASAY[t.a] + '.' }, { say: 'לָכֵן הוּא ' + AN[t.a] + ' וְגַם ' + SN[t.s] + '.' }] });
  }
  var TILES = [{
    id: 'geo4poly', world: 'כְּפַר הָאֲלַכְסוֹנִים', name: 'מְצֻלָּעִים וַאֲלַכְסוֹנִים', icon: '🔷', bld: 'house1', hero: 'אֲלַכְסוֹנִי',
    levels: [
      { name: 'צְלָעוֹת וְקָדְקוֹדִים', f: h11 },
      { name: 'מָה הוּא אֲלַכְסוֹן?', f: h12 },
      { name: 'סוֹפְרִים אֲלַכְסוֹנִים', f: h13 },
      { name: 'מַלְבֵּן וְרִבּוּעַ', f: h14 },
      { name: 'מְשֻׁלָּשִׁים: צְלָעוֹת וְזָוִיּוֹת', f: h15 }
    ]
  }];

  // ---------- world 2: area and perimeter ----------
  function gridRect(x0, y0, a, b, u, fill, lines) {
    var s = '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(a * u) + '" height="' + f1(b * u) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="3"/>', i;
    if (lines) { for (i = 1; i < a; i++) s += seg([x0 + i * u, y0], [x0 + i * u, y0 + b * u], INK, 1); for (i = 1; i < b; i++) s += seg([x0, y0 + i * u], [x0 + a * u, y0 + i * u], INK, 1); }
    return s;
  }
  // a rectangle a (across) by b (down): mode 'none' | 'grid' | 'frame' (paint was spilled: only the first row and column show squares)
  function rectPic(a, b, col, mode, la, lb) {
    var u = Math.min(210 / a, 112 / b, 30), w = a * u, h = b * u, x0 = (300 - w) / 2 - 6, y0 = 6 + (118 - h) / 2, s = gridRect(x0, y0, a, b, u, col, mode === 'grid'), i;
    if (mode === 'frame') {
      for (i = 1; i <= a; i++) s += seg([x0 + i * u, y0], [x0 + i * u, y0 + u], INK, 1);
      for (i = 1; i <= b; i++) s += seg([x0, y0 + i * u], [x0 + u, y0 + i * u], INK, 1);
      s += seg([x0, y0 + u], [x0 + w, y0 + u], INK, 1) + seg([x0 + u, y0], [x0 + u, y0 + h], INK, 1);
      s += '<ellipse cx="' + f1(x0 + u + (w - u) / 2) + '" cy="' + f1(y0 + u + (h - u) / 2) + '" rx="' + f1((w - u) * 0.44) + '" ry="' + f1((h - u) * 0.42) + '" fill="' + (col === '#ff5fa2' ? '#ffb300' : '#ff5fa2') + '" stroke="' + INK + '" stroke-width="1.5"/>';
    }
    if (la != null) s += txt(x0 + w / 2, y0 + h + 14, la, 17);
    if (lb != null) s += txt(x0 + w + 16, y0 + h / 2, lb, 17);
    return S(300, 160, s);
  }
  function rowsPic(rows, colFn) { // squares in left-aligned rows
    var W = Math.max.apply(null, rows), H = rows.length, u = Math.min(26, 260 / W, 140 / H), x0 = (300 - W * u) / 2, y0 = (160 - H * u) / 2, s = '', i, k;
    for (k = 0; k < H; k++) for (i = 0; i < rows[k]; i++) s += '<rect x="' + f1(x0 + i * u) + '" y="' + f1(y0 + k * u) + '" width="' + f1(u) + '" height="' + f1(u) + '" fill="' + colFn(k) + '" stroke="' + INK + '" stroke-width="1.5"/>';
    return S(300, 160, s);
  }
  function h21(r, K) {
    var t = K.ri(r, 0, 3), col = K.pick(r, COL), a, b, p;
    if (t === 3) {
      a = K.ri(r, 2, 12); p = 4 * a;
      return Q(r, K, { text: 'מָה הַהֶקֵּף שֶׁל הָרִבּוּעַ? הַמִּדָּה בְּס"מ.', svg: rectPic(a, a, col, 'none', a, null), answer: p, options: nums(p, [a * a, 2 * a, 3 * a]), tip: 'בְּרִבּוּעַ כָּל 4 הַצְּלָעוֹת שָׁווֹת.',
        ex: [{ say: 'הוֹלְכִים סְבִיב הָרִבּוּעַ וּמְחַבְּרִים אֶת 4 הַצְּלָעוֹת: ' + M(a + ' + ' + a + ' + ' + a + ' + ' + a + ' = ' + p) + '.', svg: rectPic(a, a, col, 'none', a, a) }, { say: 'אֶפְשָׁר גַּם לִכְפֹּל: ' + M('4 × ' + a + ' = ' + p) + '.' }] });
    }
    a = K.ri(r, 3, 20); b = K.ri(r, 2, a - 1); p = 2 * (a + b);
    return Q(r, K, { text: t === 2 ? 'כַּמָּה מֶטְרִים שֶׁל גָּדֵר צָרִיךְ סְבִיב הַגִּנָּה?' : 'מָה הַהֶקֵּף שֶׁל הַמַּלְבֵּן? הַמִּדּוֹת בְּס"מ.', svg: rectPic(a, b, t === 2 ? COL[4] : col, 'none', a, b), answer: p, options: nums(p, [a * b, a + b, 2 * a + b]),
      tip: t === 2 ? 'הַמִּדּוֹת בְּמֶטְרִים. גָּדֵר הוֹלֶכֶת מִסָּבִיב: זֶה הֶקֵּף.' : 'הֶקֵּף הוּא הָאֹרֶךְ שֶׁל כָּל הַדֶּרֶךְ מִסָּבִיב לַצּוּרָה.',
      ex: [{ say: 'הוֹלְכִים סְבִיב הַמַּלְבֵּן וּמְחַבְּרִים אֶת 4 הַצְּלָעוֹת.', svg: rectPic(a, b, col, 'none', a, b) }, { say: M(a + ' + ' + b + ' + ' + a + ' + ' + b + ' = ' + p) }, { say: 'אֶפְשָׁר גַּם כָּךְ: ' + M('2 × (' + a + ' + ' + b + ') = ' + p) + '.' }] });
  }
  function h22(r, K) {
    var H = K.ri(r, 2, 5), W = K.ri(r, 3, 8), rows = [], i, area = 0, col = K.pick(r, COL), stairs = r() < 0.6;
    for (i = 0; i < H; i++) rows.push(stairs ? K.ri(r, 1, W) : W);
    rows.sort(function (x, y) { return y - x; }); if (r() < 0.5) rows.reverse();
    rows.forEach(function (x) { area += x; });
    var per = 2 * (Math.max.apply(null, rows) + H);
    return Q(r, K, { text: 'כָּל מִשְׁבֶּצֶת הִיא 1 סמ"ר. מָה הַשֶּׁטַח שֶׁל הַצּוּרָה?', svg: rowsPic(rows, function () { return col; }), answer: area, options: nums(area, [per, area + rows[0], area - rows[0], area + 1]), tip: 'שֶׁטַח הוּא מִסְפַּר הַמִּשְׁבְּצוֹת שֶׁמְּכַסּוֹת אֶת הַצּוּרָה.',
      ex: [{ say: 'סוֹפְרִים אֶת הַמִּשְׁבְּצוֹת שׁוּרָה אַחֲרֵי שׁוּרָה.', svg: rowsPic(rows, function (k) { return k % 2 ? '#ffb300' : '#3aa0ff'; }) }, { say: M(rows.join(' + ') + ' = ' + area) }, { say: 'הַשֶּׁטַח הוּא ' + area + ' סמ"ר.' }] });
  }
  function h23(r, K) {
    var t = K.ri(r, 0, 3), a = K.ri(r, t === 1 ? 3 : 2, t === 2 ? 12 : 9), b = K.ri(r, t === 1 ? 3 : 2, t === 2 ? 12 : 7), s = a * b, col = K.pick(r, COL);
    var ex = [{ say: 'יֵשׁ ' + b + ' שׁוּרוֹת, וּבְכָל שׁוּרָה ' + a + ' מִשְׁבְּצוֹת.', svg: rectPic(a, b, col, 'grid', a, b) }, { say: 'כּוֹפְלִים אֶת מִסְפַּר הַשּׁוּרוֹת בְּמִסְפַּר הַמִּשְׁבְּצוֹת בְּשׁוּרָה.', big: b + ' × ' + a + ' = ' + s, ltr: true }];
    if (t === 3) {
      var ans = a + ' × ' + b, opts = [ans];
      [[a + 1, b], [a, b + 1], [a - 1, b + 1], [a + 1, b - 1], [a + 1, b + 1], [a + 2, b]].forEach(function (p) { var z = p[0] + ' × ' + p[1]; if (opts.length < 4 && p[0] > 1 && p[1] > 1 && p[0] * p[1] !== s && opts.indexOf(z) < 0) opts.push(z); });
      return Q(r, K, { text: 'לְאֵיזֶה מַלְבֵּן יֵשׁ שֶׁטַח שֶׁל ' + s + ' סמ"ר? הַמִּדּוֹת בְּס"מ.', answer: ans, options: opts, optLtr: true, tip: 'שֶׁטַח שֶׁל מַלְבֵּן: מִסְפַּר הַשּׁוּרוֹת כָּפוּל מִסְפַּר הַמִּשְׁבְּצוֹת בְּשׁוּרָה.', ex: ex });
    }
    return Q(r, K, { text: t === 0 ? 'כַּמָּה מִשְׁבְּצוֹת מְכַסּוֹת אֶת הַמַּלְבֵּן?' : t === 1 ? 'נִשְׁפַּךְ צֶבַע עַל הַמַּלְבֵּן. כַּמָּה מִשְׁבְּצוֹת יֵשׁ בּוֹ?' : 'מָה הַשֶּׁטַח שֶׁל הַמַּלְבֵּן בְּסמ"ר? הַמִּדּוֹת בְּס"מ.',
      svg: rectPic(a, b, col, t === 0 ? 'grid' : t === 1 ? 'frame' : 'none', t === 2 ? a : null, t === 2 ? b : null), answer: s, options: nums(s, [2 * (a + b), a + b, (a + 1) * b, (a - 1) * b]), tip: 'כַּמָּה שׁוּרוֹת יֵשׁ, וְכַמָּה מִשְׁבְּצוֹת בְּכָל שׁוּרָה?', ex: ex });
  }
  var AP = [ // [situation, 1 = perimeter / 0 = area]
    ['גָּדֵר סְבִיב הַגִּנָּה', 1], ['דֶּשֶׁא שֶׁמְּכַסֶּה אֶת הַגִּנָּה', 0], ['מִסְגֶּרֶת לִתְמוּנָה', 1], ['שָׁטִיחַ לַחֶדֶר', 0], ['צֶבַע לַקִּיר', 0],
    ['סֶרֶט סְבִיב הַלּוּחַ', 1], ['מַרְצָפוֹת לָרִצְפָּה', 0], ['רִיצָה סְבִיב הַמִּגְרָשׁ', 1], ['טַפֶּט לַקִּיר', 0], ['חֶבֶל סְבִיב הָאֹהֶל', 1],
    ['נְיָר לַעֲטֹף אֶת הַמַּחְבֶּרֶת', 0], ['שׁוּרַת פְּרָחִים סְבִיב הַבְּרֵכָה', 1], ['מַפָּה שֶׁמְּכַסָּה אֶת הַשֻּׁלְחָן', 0], ['אוֹרוֹת סְבִיב הַחַלּוֹן', 1],
    ['זְכוּכִית לַחַלּוֹן', 0], ['שְׁבִיל סְבִיב הָאֲגַם', 1], ['חוֹל שֶׁמְּכַסֶּה אֶת אַרְגַּז הַחוֹל', 0], ['תַּחְרָה סְבִיב הַמַּפָּה', 1],
    ['מִסְפַּר הַמִּשְׁבְּצוֹת בְּלוּחַ הַמִּשְׂחָק', 0], ['מִסְפַּר הַצְּעָדִים סְבִיב לוּחַ הַמִּשְׂחָק', 1]
  ];
  var AP_SVG = [S(300, 130, '<rect x="70" y="20" width="160" height="90" fill="#3ec46d" stroke="' + INK + '" stroke-width="3"/>'), S(300, 130, '<rect x="70" y="20" width="160" height="90" fill="#fff" stroke="' + RED + '" stroke-width="7"/>')];
  function h24(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), a, b, s, p, q;
    if (t <= 2) {
      q = K.pick(r, AP);
      return Q(r, K, { text: q[0] + ': מָה מְחַשְּׁבִים, שֶׁטַח אוֹ הֶקֵּף?', answer: q[1] ? 'הֶקֵּף' : 'שֶׁטַח', options: ['שֶׁטַח', 'הֶקֵּף'], keep: true, tip: 'מַה שֶּׁמְּכַסֶּה הוּא שֶׁטַח. מַה שֶּׁהוֹלֵךְ מִסָּבִיב הוּא הֶקֵּף.',
        ex: [{ say: q[1] ? 'כָּאן הוֹלְכִים מִסָּבִיב לַצּוּרָה, כְּמוֹ הַקַּו הָאָדֹם.' : 'כָּאן מְכַסִּים אֶת כָּל הַצּוּרָה, כְּמוֹ הַצֶּבַע הַיָּרֹק.', svg: AP_SVG[q[1]] }, { say: q[1] ? 'הָאֹרֶךְ שֶׁל הַדֶּרֶךְ מִסָּבִיב הוּא הֶקֵּף.' : 'מַה שֶּׁמְּכַסֶּה אֶת הַצּוּרָה הוּא שֶׁטַח.' }] });
    }
    if (t <= 4) { // area and one side
      a = K.ri(r, 2, 9); b = K.ri(r, 2, 9); s = a * b;
      return Q(r, K, { text: 'שֶׁטַח הַמַּלְבֵּן ' + s + ' סמ"ר. צֶלַע אַחַת ' + a + ' ס"מ. מָה אֹרֶךְ הַצֶּלַע הָאַחֶרֶת?', svg: rectPic(a, b, col, 'none', a, '?'), answer: b, options: nums(b, [s - a, s + a, b + a]), tip: 'שֶׁטַח שֶׁל מַלְבֵּן הוּא צֶלַע כָּפוּל צֶלַע.',
        ex: [{ say: 'אֵיזֶה מִסְפָּר כָּפוּל ' + a + ' נוֹתֵן ' + s + '?', svg: rectPic(a, b, col, 'grid', a, '?') }, { say: 'הַצֶּלַע הָאַחֶרֶת הִיא ' + b + ' ס"מ.', big: a + ' × ' + b + ' = ' + s, ltr: true }] });
    }
    if (t <= 6) { // perimeter and one side
      a = K.ri(r, 2, 12); b = K.ri(r, 2, 12); p = 2 * (a + b);
      return Q(r, K, { text: 'הֶקֵּף הַמַּלְבֵּן ' + p + ' ס"מ. צֶלַע אַחַת ' + a + ' ס"מ. מָה אֹרֶךְ הַצֶּלַע הַסְּמוּכָה?', svg: rectPic(a, b, col, 'none', a, '?'), answer: b, options: nums(b, [p - a, p / 2, p - 2 * a]), tip: 'חֲצִי הַהֶקֵּף הוּא שְׁתֵּי צְלָעוֹת סְמוּכוֹת יַחַד.',
        ex: [{ say: 'חֲצִי הַהֶקֵּף הוּא שְׁתֵּי צְלָעוֹת סְמוּכוֹת יַחַד.', big: p + ' : 2 = ' + (a + b), ltr: true }, { say: 'מוֹרִידִים אֶת הַצֶּלַע שֶׁיּוֹדְעִים.', big: (a + b) + ' − ' + a + ' = ' + b, ltr: true }, { say: 'הַצֶּלַע הַסְּמוּכָה הִיא ' + b + ' ס"מ.', svg: rectPic(a, b, col, 'none', a, b) }] });
    }
    a = K.ri(r, 2, 12);
    if (t <= 7) return Q(r, K, { text: 'הֶקֵּף הָרִבּוּעַ ' + (4 * a) + ' ס"מ. מָה אֹרֶךְ הַצֶּלַע?', svg: rectPic(a, a, col, 'none', '?', null), answer: a, options: nums(a, [2 * a, 4 * a - 4, a + 4]), tip: 'בְּרִבּוּעַ 4 צְלָעוֹת שָׁווֹת.',
      ex: [{ say: 'בְּרִבּוּעַ 4 צְלָעוֹת שָׁווֹת, לָכֵן מְחַלְּקִים אֶת הַהֶקֵּף בְּ-4.', big: (4 * a) + ' : 4 = ' + a, ltr: true }] });
    a = K.ri(r, 2, 10);
    return Q(r, K, { text: 'שֶׁטַח הָרִבּוּעַ ' + (a * a) + ' סמ"ר. מָה הַהֶקֵּף שֶׁלּוֹ בְּס"מ?', svg: rectPic(a, a, col, 'none', '?', null), answer: 4 * a, options: nums(4 * a, [a, a * a, 2 * a, a * a * 4]), tip: 'קֹדֶם מוֹצְאִים אֶת אֹרֶךְ הַצֶּלַע.',
      ex: [{ say: 'אֵיזֶה מִסְפָּר כָּפוּל עַצְמוֹ נוֹתֵן ' + (a * a) + '? זֶה אֹרֶךְ הַצֶּלַע.', big: a + ' × ' + a + ' = ' + (a * a), ltr: true }, { say: 'הַהֶקֵּף הוּא 4 צְלָעוֹת.', big: '4 × ' + a + ' = ' + (4 * a), ltr: true }] });
  }
  var SAME_S = [[[1, 12], [2, 6], [3, 4]], [[2, 8], [4, 4]], [[2, 9], [3, 6]], [[2, 12], [3, 8], [4, 6]], [[2, 10], [4, 5]]];
  var SAME_P = [[[1, 5], [2, 4], [3, 3]], [[1, 7], [2, 6], [3, 5], [4, 4]], [[2, 8], [3, 7], [4, 6], [5, 5]]];
  function twoRects(A, B, c1, c2) {
    var u = Math.min(270 / (A[1] + B[1] + 2), 100 / Math.max(A[0], B[0]), 22), x0 = (300 - (A[1] + B[1] + 2) * u) / 2, yb = 150, xb = x0 + (A[1] + 2) * u;
    return S(300, 160, gridRect(x0, yb - A[0] * u, A[1], A[0], u, c1, true) + gridRect(xb, yb - B[0] * u, B[1], B[0], u, c2, true) + txt(x0 + A[1] * u / 2, yb - A[0] * u - 14, 'א', 18) + txt(xb + B[1] * u / 2, yb - B[0] * u - 14, 'ב', 18));
  }
  function smallRect(R, col) { var u = Math.min(90 / R[1], 56 / R[0], 13); return S(96, 64, gridRect((96 - R[1] * u) / 2, (64 - R[0] * u) / 2, R[1], R[0], u, col, true)); }
  function h25(r, K) {
    var t = K.ri(r, 0, 9), col = K.pick(r, COL), i;
    if (t <= 3) { // a shape made of two rectangles
      var W = K.ri(r, 4, 8), H = K.ri(r, 4, 6), cw = K.ri(r, 2, W - 2), ch = K.ri(r, 2, H - 2), u = Math.min(200 / W, 105 / H, 24), x0 = (300 - W * u) / 2, y0 = 22 + (112 - H * u) / 2;
      var pts = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]].map(function (p) { return [x0 + p[0] * u, y0 + p[1] * u]; });
      var labels = txt(x0 + (W - cw) * u / 2, y0 - 11, W - cw, 15) + txt(x0 + (W - cw) * u - 10, y0 + ch * u / 2, ch, 15) + txt(x0 + (W - cw / 2) * u, y0 + ch * u - 11, cw, 15) + txt(x0 + W * u + 12, y0 + (ch + H) * u / 2, H - ch, 15) + txt(x0 + W * u / 2, y0 + H * u + 12, W, 15) + txt(x0 - 12, y0 + H * u / 2, H, 15);
      var s1 = (W - cw) * H, s2 = cw * (H - ch), area = s1 + s2;
      var split = '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1((W - cw) * u) + '" height="' + f1(H * u) + '" fill="#3aa0ff"/><rect x="' + f1(x0 + (W - cw) * u) + '" y="' + f1(y0 + ch * u) + '" width="' + f1(cw * u) + '" height="' + f1((H - ch) * u) + '" fill="#ffb300"/>' + poly(pts, 'none') + seg([x0 + (W - cw) * u, y0 + ch * u], [x0 + (W - cw) * u, y0 + H * u], INK, 2.5, '6 5');
      return Q(r, K, { text: 'מָה הַשֶּׁטַח שֶׁל הַצּוּרָה בְּסמ"ר? הַמִּדּוֹת בְּס"מ.', svg: S(300, 160, poly(pts, col) + labels), answer: area, options: nums(area, [W * H, 2 * (W + H), s1, s2]), tip: 'מְפָרְקִים אֶת הַצּוּרָה לִשְׁנֵי מַלְבְּנִים.',
        ex: [{ say: 'מְפָרְקִים אֶת הַצּוּרָה לִשְׁנֵי מַלְבְּנִים: כָּחֹל וְצָהֹב.', svg: S(300, 160, split + labels) }, { say: 'הַכָּחֹל: ' + M((W - cw) + ' × ' + H + ' = ' + s1) + '. הַצָּהֹב: ' + M(cw + ' × ' + (H - ch) + ' = ' + s2) + '.' }, { say: 'מְחַבְּרִים אֶת שְׁנֵי הַשְּׁטָחִים: ' + M(s1 + ' + ' + s2 + ' = ' + area) + '.' }] });
    }
    if (t <= 6) { // two rectangles: equal area but another perimeter, or the other way round
      var byS = r() < 0.5, pair = K.sample(r, K.pick(r, byS ? SAME_S : SAME_P), 2), askS = r() < 0.5, A = pair[0], B = pair[1];
      function ar(R) { return R[0] * R[1]; } function pe(R) { return 2 * (R[0] + R[1]); }
      var va = askS ? ar(A) : pe(A), vb = askS ? ar(B) : pe(B), word = askS ? 'שֶׁטַח' : 'הֶקֵּף', O = ['לְמַלְבֵּן א', 'לְמַלְבֵּן ב', 'הוּא שָׁוֶה בִּשְׁנֵיהֶם'];
      return Q(r, K, { text: 'לְאֵיזֶה מַלְבֵּן יֵשׁ ' + word + ' גָּדוֹל יוֹתֵר?', svg: twoRects(A, B, COL[2], COL[3]), answer: va > vb ? O[0] : vb > va ? O[1] : O[2], options: O, keep: true, key: 'cmp' + A + B + askS, tip: 'שֶׁטַח: סוֹפְרִים מִשְׁבְּצוֹת. הֶקֵּף: הוֹלְכִים מִסָּבִיב.',
        ex: [{ say: 'מַלְבֵּן א: שֶׁטַח ' + ar(A) + ', הֶקֵּף ' + pe(A) + '.', svg: twoRects(A, B, COL[2], COL[3]) }, { say: 'מַלְבֵּן ב: שֶׁטַח ' + ar(B) + ', הֶקֵּף ' + pe(B) + '.' }, { say: byS ? 'אוֹתוֹ שֶׁטַח, אֲבָל הֶקֵּף אַחֵר!' : 'אוֹתוֹ הֶקֵּף, אֲבָל שֶׁטַח אַחֵר!' }] });
    }
    // the same perimeter (or area) for all: who has the biggest area (perimeter)?
    var same = t <= 8 ? 'p' : 's', set = K.pick(r, (same === 'p' ? SAME_P : SAME_S).filter(function (x) { return x.length >= 3; })), three = K.sample(r, set, 3), big = r() < 0.6, keys = ['a', 'b', 'c'], o = {}, best = 0;
    function val(R) { return same === 'p' ? R[0] * R[1] : 2 * (R[0] + R[1]); }
    for (i = 1; i < 3; i++) if (big ? val(three[i]) > val(three[best]) : val(three[i]) < val(three[best])) best = i;
    keys.forEach(function (k, j) { o[k] = smallRect(three[j], COL[j + 1]); });
    var P0 = 2 * (three[0][0] + three[0][1]), S0 = three[0][0] * three[0][1];
    return Q(r, K, { text: same === 'p' ? 'לְכָל הַמַּלְבְּנִים הֶקֵּף ' + P0 + '. לְמִי הַשֶּׁטַח הַ' + (big ? 'גָּדוֹל' : 'קָּטָן') + ' בְּיוֹתֵר?' : 'לְכָל הַמַּלְבְּנִים שֶׁטַח ' + S0 + '. לְמִי הַהֶקֵּף הַ' + (big ? 'גָּדוֹל' : 'קָּטָן') + ' בְּיוֹתֵר?',
      answer: keys[best], options: keys, keep: true, optHtml: o, tip: same === 'p' ? 'סוֹפְרִים אֶת הַמִּשְׁבְּצוֹת בְּכָל מַלְבֵּן.' : 'הוֹלְכִים מִסָּבִיב לְכָל מַלְבֵּן וְסוֹפְרִים.',
      ex: [{ say: (same === 'p' ? 'הַשְּׁטָחִים: ' : 'הַהֶקֵּפִים: ') + three.map(function (R) { return M(R[0] + ' × ' + R[1]) + ' ← ' + val(R); }).join(', ') + '.', svg: smallRect(three[best], COL[4]).replace('width="96" height="64"', 'width="240" height="160"') },
        { say: same === 'p' ? (big ? 'כְּשֶׁהַהֶקֵּף שָׁוֶה, הַמַּלְבֵּן שֶׁהֲכִי דּוֹמֶה לְרִבּוּעַ הוּא בַּעַל הַשֶּׁטַח הַגָּדוֹל בְּיוֹתֵר.' : 'כְּשֶׁהַהֶקֵּף שָׁוֶה, הַמַּלְבֵּן הָאָרֹךְ וְהַצַּר הוּא בַּעַל הַשֶּׁטַח הַקָּטָן בְּיוֹתֵר.') : (big ? 'כְּשֶׁהַשֶּׁטַח שָׁוֶה, לַמַּלְבֵּן הָאָרֹךְ וְהַצַּר יֵשׁ הַהֶקֵּף הַגָּדוֹל בְּיוֹתֵר.' : 'כְּשֶׁהַשֶּׁטַח שָׁוֶה, לַמַּלְבֵּן שֶׁהֲכִי דּוֹמֶה לְרִבּוּעַ יֵשׁ הַהֶקֵּף הַקָּטָן בְּיוֹתֵר.') }] });
  }
  TILES.push({
    id: 'geo4area', world: 'שְׂדֵה הַמִּשְׁבְּצוֹת', name: 'שֶׁטַח וְהֶקֵּף', icon: '📐', bld: 'house2', hero: 'מִשְׁבְּצוֹן',
    levels: [
      { name: 'הֶקֵּף שֶׁל מַלְבֵּן', f: h21 },
      { name: 'שֶׁטַח: סוֹפְרִים מִשְׁבְּצוֹת', f: h22 },
      { name: 'שֶׁטַח שֶׁל מַלְבֵּן בְּכֶפֶל', f: h23 },
      { name: 'שֶׁטַח אוֹ הֶקֵּף? צֶלַע חֲסֵרָה', f: h24 },
      { name: 'צוּרוֹת מֻרְכָּבוֹת וְהַשְׁוָאוֹת', f: h25 }
    ]
  });
  // ---------- world 3: boxes ----------
  // a box a (across) x b (deep) x c (high), drawn slanted; pr gives the place of a point on the screen
  function prj(u, ox, oy) { return function (x, y, z) { return [ox + x * u + y * u * 0.5, oy - z * u - y * u * 0.35]; }; }
  function boxU(a, b, c, maxW, maxH, maxU) { return Math.min(maxU, maxW / (a + 0.5 * b), maxH / (c + 0.35 * b)); }
  function boxAt(a, b, c, x0, y0, w, h, maxU) { var u = boxU(a, b, c, w, h, maxU); return { u: u, pr: prj(u, x0 + (w - (a + 0.5 * b) * u) / 2, y0 + (h - (c + 0.35 * b) * u) / 2 + (c + 0.35 * b) * u) }; }
  function cubeBox(a, b, c, B, hi) { // built of unit cubes; hi = the layer painted yellow (1 = bottom), 0 = none
    var pr = B.pr, s = '', i, j, k;
    for (i = 0; i < a; i++) for (j = 0; j < b; j++) s += poly([pr(i, j, c), pr(i + 1, j, c), pr(i + 1, j + 1, c), pr(i, j + 1, c)], hi === c ? '#ffd766' : '#c4a8ff', INK, 1.5);
    for (i = 0; i < a; i++) for (k = 0; k < c; k++) s += poly([pr(i, 0, k), pr(i + 1, 0, k), pr(i + 1, 0, k + 1), pr(i, 0, k + 1)], hi === k + 1 ? '#ffb300' : '#8e5cff', INK, 1.5);
    for (j = 0; j < b; j++) for (k = 0; k < c; k++) s += poly([pr(a, j, k), pr(a, j + 1, k), pr(a, j + 1, k + 1), pr(a, j, k + 1)], hi === k + 1 ? '#d99600' : '#6b3fd4', INK, 1.5);
    return s;
  }
  function plainBox(a, b, c, B, col, lab) {
    var pr = B.pr, top = [pr(0, 0, c), pr(a, 0, c), pr(a, b, c), pr(0, b, c)], right = [pr(a, 0, 0), pr(a, b, 0), pr(a, b, c), pr(a, 0, c)];
    var s = poly([pr(0, 0, 0), pr(a, 0, 0), pr(a, 0, c), pr(0, 0, c)], col) + poly(top, col) + poly(top, '#fff', INK, 3, ' fill-opacity="0.45"') + poly(right, col) + poly(right, INK, INK, 3, ' fill-opacity="0.25"'), p;
    if (lab) { p = pr(a / 2, 0, 0); s += txt(p[0], p[1] + 14, lab[0], 16); p = pr(a, b / 2, 0); s += txt(p[0] + 15, p[1] + 7, lab[1], 16); p = pr(0, 0, c / 2); s += txt(p[0] - 13, p[1], lab[2], 16); }
    return s;
  }
  function wireBox(a, b, c, B, col, extra) { // see-through; vertex i has bits x, y, z
    var pr = B.pr, V = [], i, j, s, x;
    for (i = 0; i < 8; i++) V.push(pr((i & 1) * a, ((i >> 1) & 1) * b, ((i >> 2) & 1) * c));
    s = poly([V[0], V[1], V[5], V[4]], col, 'none', 0, ' fill-opacity="0.3"') + poly([V[4], V[5], V[7], V[6]], col, 'none', 0, ' fill-opacity="0.18"') + poly([V[1], V[3], V[7], V[5]], col, 'none', 0, ' fill-opacity="0.45"');
    s += extra ? extra(V, 'under') : '';
    for (i = 0; i < 8; i++) for (j = i + 1; j < 8; j++) { x = i ^ j; if (x === 1 || x === 2 || x === 4) s += seg(V[i], V[j], INK, i === 2 || j === 2 ? 1.5 : 3, i === 2 || j === 2 ? '5 5' : null); }
    return s + (extra ? extra(V, 'over') : '');
  }
  var BOX_TF = [
    ['לְתֵבָה יֵשׁ 6 פֵּאוֹת.', 1, 'שְׁתַּיִם לְמַעְלָה וּלְמַטָּה, שְׁתַּיִם מִלְּפָנִים וּמֵאָחוֹר, שְׁתַּיִם בַּצְּדָדִים: 6 פֵּאוֹת.'],
    ['לְתֵבָה יֵשׁ 8 קָדְקוֹדִים.', 1, '4 קָדְקוֹדִים לְמַעְלָה וְ-4 לְמַטָּה: 8 קָדְקוֹדִים.'],
    ['לְתֵבָה יֵשׁ 12 מִקְצוֹעוֹת.', 1, '4 מִקְצוֹעוֹת לְמַעְלָה, 4 לְמַטָּה וְ-4 עוֹמְדִים: 12 מִקְצוֹעוֹת.'],
    ['לְתֵבָה יֵשׁ 8 פֵּאוֹת.', 0, 'שְׁתַּיִם לְמַעְלָה וּלְמַטָּה, שְׁתַּיִם מִלְּפָנִים וּמֵאָחוֹר, שְׁתַּיִם בַּצְּדָדִים: 6 פֵּאוֹת.'],
    ['לְקֻבִּיָּה יֵשׁ 6 קָדְקוֹדִים.', 0, 'קֻבִּיָּה הִיא תֵּבָה, וְיֵשׁ לָהּ 8 קָדְקוֹדִים: 4 לְמַעְלָה וְ-4 לְמַטָּה.'],
    ['כָּל הַפֵּאוֹת שֶׁל תֵּבָה הֵן מַלְבְּנִים.', 1, 'כָּל פֵּאָה שֶׁל תֵּבָה הִיא מַלְבֵּן. גַּם רִבּוּעַ הוּא מַלְבֵּן.'],
    ['כָּל הַפֵּאוֹת שֶׁל קֻבִּיָּה הֵן רִבּוּעִים.', 1, 'בְּקֻבִּיָּה כָּל 6 הַפֵּאוֹת הֵן רִבּוּעִים שָׁוִים.'],
    ['קֻבִּיָּה הִיא תֵּבָה.', 1, 'קֻבִּיָּה הִיא תֵּבָה מְיֻחֶדֶת: כָּל הַפֵּאוֹת שֶׁלָּהּ רִבּוּעִים.'],
    ['כָּל תֵּבָה הִיא קֻבִּיָּה.', 0, 'יֵשׁ תֵּבוֹת שֶׁהַפֵּאוֹת שֶׁלָּהֶן מַלְבְּנִים שֶׁאֵינָם רִבּוּעִים. הֵן לֹא קֻבִּיּוֹת.'],
    ['בְּתֵבָה, פֵּאוֹת שֶׁנִּמְצָאוֹת זוֹ מוּל זוֹ שָׁווֹת.', 1, 'בְּתֵבָה יֵשׁ 3 זוּגוֹת שֶׁל פֵּאוֹת שָׁווֹת, זוֹ מוּל זוֹ.'],
    ['בְּכָל קָדְקוֹד שֶׁל תֵּבָה נִפְגָּשִׁים 3 מִקְצוֹעוֹת.', 1, 'בְּכָל קָדְקוֹד נִפְגָּשִׁים 3 מִקְצוֹעוֹת וְגַם 3 פֵּאוֹת.'],
    ['בְּכָל קָדְקוֹד שֶׁל תֵּבָה נִפְגָּשׁוֹת 4 פֵּאוֹת.', 0, 'בְּכָל קָדְקוֹד נִפְגָּשִׁים 3 מִקְצוֹעוֹת וְגַם 3 פֵּאוֹת.'],
    ['לְכָל פֵּאָה שֶׁל תֵּבָה יֵשׁ 4 קָדְקוֹדִים.', 1, 'כָּל פֵּאָה הִיא מַלְבֵּן, וּלְמַלְבֵּן יֵשׁ 4 קָדְקוֹדִים.'],
    ['אֲלַכְסוֹן הַתֵּבָה עוֹבֵר בְּתוֹךְ הַתֵּבָה.', 1, 'הוּא מְחַבֵּר שְׁנֵי קָדְקוֹדִים שֶׁאֵינָם עַל אוֹתָהּ פֵּאָה, וְלָכֵן עוֹבֵר בְּתוֹךְ הַתֵּבָה.'],
    ['אֲלַכְסוֹן שֶׁל פֵּאָה אָרֹךְ יוֹתֵר מֵאֲלַכְסוֹן הַתֵּבָה.', 0, 'אֲלַכְסוֹן הַתֵּבָה אָרֹךְ יוֹתֵר מִכָּל אֲלַכְסוֹן שֶׁל פֵּאָה.'],
    ['בִּפְרִיסָה שֶׁל תֵּבָה יֵשׁ 6 מַלְבְּנִים.', 1, 'בַּפְּרִיסָה רוֹאִים אֶת כָּל 6 הַפֵּאוֹת, וְכָל פֵּאָה הִיא מַלְבֵּן.'],
    ['לְמִקְצוֹעַ קוֹרְאִים גַּם צֶלַע שֶׁל הַגּוּף.', 1, 'מִקְצוֹעַ הוּא צֶלַע שֶׁל הַגּוּף: הַקַּו שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת.'],
    ['נֶפַח שֶׁל תֵּבָה מוֹדְדִים בְּסמ"ק.', 1, 'נֶפַח מוֹדְדִים בְּקֻבִּיּוֹת, לְמָשָׁל קֻבִּיּוֹת שֶׁל 1 סמ"ק.'],
    ['שֶׁטַח הַפָּנִים שֶׁל תֵּבָה הוּא סְכוּם הַשְּׁטָחִים שֶׁל 6 הַפֵּאוֹת.', 1, 'שֶׁטַח הַפָּנִים הוּא הַשֶּׁטַח שֶׁל כָּל הַפֵּאוֹת יַחַד.'],
    ['לִיטֶר אֶחָד שָׁוֶה לְ-1,000 סמ"ק.', 1, 'קֻבִּיָּה שֶׁכָּל מִקְצוֹעַ שֶׁלָּהּ 10 ס"מ מְכִילָה 1,000 סמ"ק, וְזֶה לִיטֶר אֶחָד.']
  ];
  var PARTS = [
    { q: 'כַּמָּה פֵּאוֹת יֵשׁ לַתֵּבָה?', n: 6, why: BOX_TF[0][2], tip: 'פֵּאָה הִיא מַלְבֵּן שֶׁסּוֹגֵר אֶת הַתֵּבָה. אַחַת מֵהֶן צְבוּעָה.' },
    { q: 'כַּמָּה מִקְצוֹעוֹת יֵשׁ לַתֵּבָה?', n: 12, why: BOX_TF[2][2], tip: 'מִקְצוֹעַ הוּא קַו שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת. אֶחָד מֵהֶם אָדֹם.' },
    { q: 'כַּמָּה קָדְקוֹדִים יֵשׁ לַתֵּבָה?', n: 8, why: BOX_TF[1][2], tip: 'קָדְקוֹד הוּא פִּנָּה שֶׁל הַתֵּבָה. אֶחָד מֵהֶם אָדֹם.' }
  ];
  var KINDS = ['מִקְצוֹעַ', 'אֲלַכְסוֹן שֶׁל פֵּאָה', 'אֲלַכְסוֹן הַתֵּבָה'];
  var KWHY = ['הַקֶּטַע הוּא קַו שֶׁבּוֹ נִפְגָּשׁוֹת שְׁתֵּי פֵּאוֹת: זֶה מִקְצוֹעַ.', 'שְׁנֵי הַקְּצָווֹת עַל אוֹתָהּ פֵּאָה, וְהֵם לֹא שְׁכֵנִים: זֶה אֲלַכְסוֹן שֶׁל פֵּאָה.', 'שְׁנֵי הַקְּצָווֹת אֵינָם עַל אוֹתָהּ פֵּאָה, וְהַקֶּטַע עוֹבֵר בְּתוֹךְ הַתֵּבָה: זֶה אֲלַכְסוֹן הַתֵּבָה.'];
  function h31(r, K) {
    var u = r(), a = K.ri(r, 2, 5), b = K.ri(r, 2, 4), c = K.ri(r, 2, 4), col = K.pick(r, COL), B = boxAt(a, b, c, 30, 12, 240, 140, 30), q, svg;
    if (u < 0.3) {
      q = K.pick(r, BOX_TF);
      return TF(r, K, { text: q[0], ex: [{ say: q[2], svg: S(300, 164, wireBox(4, 3, 3, boxAt(4, 3, 3, 30, 12, 240, 140, 30), COL[2])) }] }, !!q[1]);
    }
    if (u < 0.62) {
      var k = K.ri(r, 0, 2), P = PARTS[k], e = K.pick(r, [[0, 1], [4, 5], [1, 5], [0, 4], [5, 7], [1, 3], [4, 6], [6, 7], [3, 7]]), v = K.pick(r, [0, 1, 3, 4, 5, 6, 7]), fc = K.pick(r, [[0, 1, 5, 4], [4, 5, 7, 6], [1, 3, 7, 5]]);
      svg = S(300, 164, wireBox(a, b, c, B, col, function (V, w) { return w === 'under' ? (k === 0 ? poly(fc.map(function (i) { return V[i]; }), '#ff5fa2', 'none', 0) : '') : k === 1 ? seg(V[e[0]], V[e[1]], RED, 6) : k === 2 ? dot(V[v], RED, 7) : ''; }));
      return Q(r, K, { text: P.q, svg: svg, answer: P.n, options: [6, 8, 12, 4], tip: P.tip, ex: [{ say: 'סוֹפְרִים לְפִי הַסֵּדֶר, גַּם אֶת מַה שֶּׁמֵּאָחוֹר (הַקַּוִּים הַמְּקֻוְקָוִים).', svg: svg }, { say: P.why }] });
    }
    var i = K.ri(r, 0, 7), j = (i + K.ri(r, 1, 7)) % 8, x = i ^ j, kind = (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) - 1;
    svg = S(300, 164, wireBox(a, b, c, B, col, function (V, w) { return w === 'over' ? seg(V[i], V[j], RED, 5) + dot(V[i], '#ffb300', 6) + dot(V[j], '#ffb300', 6) : ''; }));
    return Q(r, K, { text: 'מָה הוּא הַקֶּטַע הָאָדֹם בַּתֵּבָה?', svg: svg, answer: KINDS[kind], options: KINDS, keep: true, key: 'seg' + a + b + c + Math.min(i, j) + Math.max(i, j), tip: 'בּוֹדְקִים: הַאִם שְׁנֵי הַקְּצָווֹת נִמְצָאִים עַל אוֹתָהּ פֵּאָה?',
      ex: [{ say: 'בּוֹדְקִים אֶת שְׁנֵי הַקְּצָווֹת שֶׁל הַקֶּטַע הָאָדֹם.', svg: svg }, { say: KWHY[kind] }] });
  }
  function h32(r, K) {
    var a = K.ri(r, 2, 5), b = K.ri(r, 2, 5), c = K.ri(r, 2, 4), v = a * b * c, layer = r() < 0.2, B = boxAt(a, b, c, 20, 6, 260, 150, 28);
    var ex = [{ say: 'בַּשִּׁכְבָה הַצְּהֻבָּה יֵשׁ ' + b + ' שׁוּרוֹת שֶׁל ' + a + ' קֻבִּיּוֹת: ' + M(a + ' × ' + b + ' = ' + (a * b)) + '.', svg: S(300, 162, cubeBox(a, b, 1, boxAt(a, b, 1, 20, 6, 260, 150, 28), 1)) },
      { say: 'בַּתֵּבָה יֵשׁ ' + c + ' שְׁכָבוֹת כָּאֵלֶּה, זוֹ עַל זוֹ.', svg: S(300, 162, cubeBox(a, b, c, B, 1)) }, { say: 'כּוֹפְלִים בְּמִסְפַּר הַשְּׁכָבוֹת: ' + M((a * b) + ' × ' + c + ' = ' + v) + '.' }];
    if (layer) return Q(r, K, { text: 'כַּמָּה קֻבִּיּוֹת יֵשׁ בַּשִּׁכְבָה הַצְּהֻבָּה?', svg: S(300, 162, cubeBox(a, b, c, B, 1)), answer: a * b, options: nums(a * b, [a + b, v, a, a * c]), tip: 'בַּשִּׁכְבָה יֵשׁ גַּם קֻבִּיּוֹת שֶׁלֹּא רוֹאִים, מֵאָחוֹר.', ex: [ex[0]] });
    return Q(r, K, { text: 'הַתֵּבָה בְּנוּיָה מִקֻּבִּיּוֹת. כַּמָּה קֻבִּיּוֹת יֵשׁ בָּהּ?', svg: S(300, 162, cubeBox(a, b, c, B, 1)), answer: v, options: nums(v, [a * b + b * c + a * c - a - b - c + 1, a * b, a + b + c]), tip: 'סוֹפְרִים קֹדֶם שִׁכְבָה אַחַת, גַּם אֶת הַקֻּבִּיּוֹת שֶׁלֹּא רוֹאִים.', ex: ex });
  }
  // nets of a cube: the 11 real ones and 9 shapes of six squares that do not close
  var NET_OK = ['X.../XXXX/X...', 'X.../XXXX/.X..', 'X.../XXXX/..X.', 'X.../XXXX/...X', '.X./XXX/.X./.X.', 'X../XXX/.X./.X.', 'X../XX./.XX/.X.', 'X../XX./.X./.XX', 'X../XX./.XX/..X', '.X./XX./.XX/.X.', 'X./X./XX/.X/.X'];
  var NET_NO = ['X/X/X/X/X/X', 'XX/XX/XX', 'XX/XX/X./X.', 'XXX/X../X../X..', 'X./XX/XX/X.', 'XX./XX./.XX', 'X.X/XXX/X..', 'XX/X./X./X./X.', 'X../X../XXX/.X.'];
  function parseNet(s, v) { // v = 0..7: turned and mirrored
    var cells = [], mx = 99, my = 99;
    s.split('/').forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row.charAt(x) === 'X') cells.push([x, y]); });
    cells = cells.map(function (p) { var x = p[0], y = p[1], k, t; for (k = 0; k < v % 4; k++) { t = -y; y = x; x = t; } x = v >= 4 ? -x : x; mx = Math.min(mx, x); my = Math.min(my, y); return [x, y]; });
    return cells.map(function (p) { return [p[0] - mx, p[1] - my]; });
  }
  // rolls a cube over the squares: for every square, the face of the cube it becomes
  function fold(cells) {
    var map = {}, st = [], queue = [0], i;
    function neg(v) { return [-v[0], -v[1], -v[2]]; }
    cells.forEach(function (p, k) { map[p[0] + ',' + p[1]] = k; });
    st[0] = { d: [0, 0, -1], n: [0, 1, 0], e: [1, 0, 0] };
    while (queue.length) {
      i = queue.shift();
      [[1, 0], [-1, 0], [0, -1], [0, 1]].forEach(function (dir, di) {
        var s = st[i], j = map[(cells[i][0] + dir[0]) + ',' + (cells[i][1] + dir[1])];
        if (j == null || st[j]) return;
        st[j] = di === 0 ? { d: s.e, n: s.n, e: neg(s.d) } : di === 1 ? { d: neg(s.e), n: s.n, e: s.d } : di === 2 ? { d: s.n, n: neg(s.d), e: s.e } : { d: neg(s.n), n: s.d, e: s.e };
        queue.push(j);
      });
    }
    return st.map(function (s) { return s.d; });
  }
  function netPic(cells, fills) {
    var W = 0, H = 0, u, x0, y0;
    cells.forEach(function (p) { W = Math.max(W, p[0] + 1); H = Math.max(H, p[1] + 1); });
    u = Math.min(32, 280 / W, 150 / H); x0 = (300 - W * u) / 2; y0 = (160 - H * u) / 2;
    return S(300, 160, cells.map(function (p, i) { return '<rect x="' + f1(x0 + p[0] * u) + '" y="' + f1(y0 + p[1] * u) + '" width="' + f1(u) + '" height="' + f1(u) + '" fill="' + fills[i] + '" stroke="' + INK + '" stroke-width="2.5"/>'; }).join(''));
  }
  // a net of the box a x b x c. kind 0, 1: real; 2: one flap of a wrong size; 3: one side of a wrong size; 4: both flaps fold to the same side
  function boxNet(a, b, c, kind, x0, y0, w, h, mode) {
    var rowY = kind === 2 ? Math.max(b, c) : b, f1h = kind === 2 ? c : b, second = kind === 1 || kind === 4 ? a + b : 0;
    var R = [{ x: 0, y: rowY, w: a, h: c, g: 0 }, { x: a, y: rowY, w: b, h: c, g: 1 }, { x: a + b, y: rowY, w: a, h: c, g: 0 }, { x: 2 * a + b, y: rowY, w: kind === 3 ? a : b, h: c, g: 1 },
      { x: 0, y: rowY - f1h, w: a, h: f1h, g: 2 }, { x: second, y: kind === 4 ? rowY - b : rowY + c, w: a, h: b, g: 2 }];
    var bad = kind === 2 ? [4] : kind === 3 ? [3] : kind === 4 ? [4, 5] : [], W = 0, H = 0, u, PC = [COL[2], COL[3], COL[1]];
    R.forEach(function (q) { W = Math.max(W, q.x + q.w); H = Math.max(H, q.y + q.h); });
    u = Math.min(24, w / W, h / H); x0 += (w - W * u) / 2; y0 += (h - H * u) / 2;
    return R.map(function (q, i) { return gridRect(x0 + q.x * u, y0 + q.y * u, q.w, q.h, u, mode === 'plain' ? COL[0] : mode === 'pairs' ? PC[q.g] : bad.indexOf(i) >= 0 ? RED : GREY, true); }).join('');
  }
  function h33(r, K) {
    var col = K.pick(r, COL), v = K.ri(r, 0, 7), cells, faces, seen = {}, dup = {}, ok = true;
    if (r() < 0.62) { // is it a net of a cube?
      cells = parseNet(K.pick(r, r() < 0.5 ? NET_OK : NET_NO), v); faces = fold(cells).map(function (d) { return d.join(','); });
      faces.forEach(function (f) { if (seen[f]) { dup[f] = 1; ok = false; } seen[f] = 1; });
      var q = netPic(cells, cells.map(function () { return col; })), PC = [COL[2], COL[3], COL[1]];
      return TF(r, K, { text: 'הַאִם זוֹ פְּרִיסָה שֶׁל קֻבִּיָּה?', svg: q, tip: 'מְקַפְּלִים בַּדִּמְיוֹן: כָּל רִבּוּעַ צָרִיךְ לְהַגִּיעַ לְפֵאָה אַחֶרֶת שֶׁל הַקֻּבִּיָּה.',
        ex: ok ? [{ say: 'לְקֻבִּיָּה יֵשׁ 6 פֵּאוֹת. מְקַפְּלִים בַּדִּמְיוֹן, וְכָל רִבּוּעַ מַגִּיעַ לְפֵאָה אַחֶרֶת.', svg: q }, { say: 'רִבּוּעִים בְּאוֹתוֹ צֶבַע הֵם פֵּאוֹת שֶׁזּוֹ מוּל זוֹ. יֵשׁ 3 זוּגוֹת, לָכֵן זוֹ פְּרִיסָה שֶׁל קֻבִּיָּה.', svg: netPic(cells, faces.map(function (f) { var p = f.split(','); return PC[p[0] !== '0' ? 0 : p[1] !== '0' ? 1 : 2]; })) }]
          : [{ say: 'לְקֻבִּיָּה יֵשׁ 6 פֵּאוֹת. כְּשֶׁמְּקַפְּלִים, כָּל רִבּוּעַ צָרִיךְ לְהַגִּיעַ לְפֵאָה אַחֶרֶת.', svg: q }, { say: 'כָּאן הָרִבּוּעִים הָאֲדֻמִּים מַגִּיעִים לְאוֹתָהּ פֵּאָה, וּפֵאָה אַחֶרֶת נִשְׁאֶרֶת פְּתוּחָה. זוֹ לֹא פְּרִיסָה.', svg: netPic(cells, faces.map(function (f) { return dup[f] ? RED : GREY; })) }] }, ok);
    }
    var d = K.shuffle(r, K.pick(r, [[1, 2, 3], [2, 3, 4], [1, 2, 4], [1, 3, 4]])), a = d[0], b = d[1], c = d[2], kind = K.pick(r, [0, 1, 0, 1, 2, 3, 4, 4]);
    var box = cubeBox(a, b, c, boxAt(a, b, c, 4, 20, 100, 120, 20), 0);
    var B0 = 'בַּתֵּבָה יֵשׁ 3 זוּגוֹת שֶׁל פֵּאוֹת שָׁווֹת, זוֹ מוּל זוֹ.';
    return TF(r, K, { text: 'הַאִם הַפְּרִיסָה מַתְאִימָה לַתֵּבָה?', svg: S(300, 160, box + boxNet(a, b, c, kind, 112, 6, 184, 148, 'plain')), tip: B0 + ' סוֹפְרִים מִשְׁבְּצוֹת בְּכָל מַלְבֵּן.',
      ex: kind < 2 ? [{ say: B0 + ' בַּפְּרִיסָה כָּל זוּג צָבוּעַ בְּאוֹתוֹ צֶבַע.', svg: S(300, 160, box + boxNet(a, b, c, kind, 112, 6, 184, 148, 'pairs')) }, { say: 'הַמִּדּוֹת שֶׁל כָּל מַלְבֵּן מַתְאִימוֹת לַתֵּבָה, וּכְשֶׁמְּקַפְּלִים כָּל פֵּאָה מַגִּיעָה לִמְקוֹמָהּ.' }]
        : [{ say: B0, svg: S(300, 160, box + boxNet(a, b, c, kind, 112, 6, 184, 148, 'bad')) }, { say: kind === 4 ? 'שְׁנֵי הַמַּלְבְּנִים הָאֲדֻמִּים מִתְקַפְּלִים אֶל אוֹתוֹ צַד, וְהַצַּד שֶׁמּוּלוֹ נִשְׁאָר פָּתוּחַ.' : 'לַמַּלְבֵּן הָאָדֹם אֵין מִדּוֹת מַתְאִימוֹת, לָכֵן הַפְּרִיסָה לֹא נִסְגֶּרֶת לַתֵּבָה הַזֹּאת.' }] }, kind < 2);
  }
  var UNITS = [['קֻפְסַת שׁוֹקוֹ קְטַנָּה', 0], ['חֲדַר הַכִּתָּה', 2], ['אַקְוַרְיוּם', 1], ['בְּרֵכַת שְׂחִיָּה', 2], ['קֻבִּיַּת מִשְׂחָק', 0], ['דְּלִי', 1], ['מַשָּׂאִית שֶׁל חוֹל', 2], ['כַּפִּית', 0], ['בַּקְבּוּק גָּדוֹל שֶׁל מַיִם', 1], ['מַחְסָן', 2], ['קֻפְסַת גַּפְרוּרִים', 0], ['סִיר מָרָק', 1]];
  var UN = ['סמ"ק', 'לִיטֶר', 'מ"ק'];
  function h34(r, K) {
    var t = K.ri(r, 0, 9), n, q;
    if (t <= 1) {
      q = K.pick(r, UNITS);
      return Q(r, K, { text: 'בְּמָה מוֹדְדִים אֶת הַנֶּפַח שֶׁל ' + q[0] + '?', answer: UN[q[1]], options: UN, keep: true, tip: 'סמ"ק לִדְבָרִים קְטַנִּים, לִיטֶר לְכֵלִים, מ"ק לִדְבָרִים גְּדוֹלִים מְאוֹד.',
        ex: [{ say: 'סמ"ק הוּא קֻבִּיָּה קְטַנָּה מְאוֹד, שֶׁכָּל מִקְצוֹעַ שֶׁלָּהּ 1 ס"מ.' }, { say: 'לִיטֶר הוּא 1,000 סמ"ק, כְּמוֹ קַרְטוֹן שֶׁל חָלָב.' }, { say: 'מ"ק הוּא קֻבִּיָּה עֲנָקִית, שֶׁכָּל מִקְצוֹעַ שֶׁלָּהּ מֶטֶר.' }, { say: 'לָכֵן כָּאן מַתְאִים לִמְדֹּד בְּ' + (q[1] === 1 ? 'לִיטֶר' : UN[q[1]]) + '.' }] });
    }
    if (t <= 3) {
      n = K.ri(r, 1, 9);
      var toCc = r() < 0.5, L1 = 'לִיטֶר אֶחָד הוּא 1,000 סמ"ק.';
      return Q(r, K, { text: toCc ? 'כַּמָּה סמ"ק יֵשׁ בְּ-' + n + ' לִיטֶר?' : (n * 1000) + ' סמ"ק הֵם כַּמָּה לִיטֶר?', answer: toCc ? n * 1000 : n, options: toCc ? [n * 1000, n * 100, n * 10, n * 10000] : [n, n * 10, n * 100, n * 1000], tip: L1,
        ex: [{ say: L1 }, { say: toCc ? 'כּוֹפְלִים בְּ-1,000.' : 'מְחַלְּקִים בְּ-1,000.', big: toCc ? n + ' × 1000 = ' + (n * 1000) : (n * 1000) + ' : 1000 = ' + n, ltr: true }] });
    }
    var a = K.ri(r, 2, 10), b = K.ri(r, 2, 6), c = K.ri(r, 2, 10), v = a * b * c, svg = S(300, 160, plainBox(a, b, c, boxAt(a, b, c, 45, 8, 200, 124, 22), K.pick(r, COL), [a, b, c]));
    return Q(r, K, { text: 'מָה הַנֶּפַח שֶׁל הַתֵּבָה בְּסמ"ק? הַמִּדּוֹת בְּס"מ.', svg: svg, answer: v, options: nums(v, [a + b + c, a * b, 2 * (a * b + b * c + a * c)]), tip: 'כַּמָּה קֻבִּיּוֹת שֶׁל 1 סמ"ק יֵשׁ בְּשִׁכְבָה אַחַת, וְכַמָּה שְׁכָבוֹת יֵשׁ?',
      ex: [{ say: 'מְמַלְּאִים אֶת הַתֵּבָה בְּקֻבִּיּוֹת שֶׁל 1 סמ"ק. בְּשִׁכְבָה אַחַת: ' + M(a + ' × ' + b + ' = ' + (a * b)) + '.', svg: svg }, { say: 'הַגֹּבַהּ הוּא ' + c + ', לָכֵן יֵשׁ ' + c + ' שְׁכָבוֹת.', big: (a * b) + ' × ' + c + ' = ' + v, ltr: true }, { say: 'הַנֶּפַח הוּא ' + v + ' סמ"ק.', svg: svg }] });
  }
  function h35(r, K) {
    var a = K.ri(r, 2, 5), b = K.ri(r, 1, 4), c = K.ri(r, 1, 5), x = a * c, y = b * c, z = a * b, sa = 2 * (x + y + z);
    var svg = S(300, 160, plainBox(a, b, c, boxAt(a, b, c, 45, 8, 200, 124, 26), K.pick(r, COL), [a, b, c]));
    return Q(r, K, { text: 'מָה שֶׁטַח הַפָּנִים שֶׁל הַתֵּבָה בְּסמ"ר? הַמִּדּוֹת בְּס"מ.', svg: svg, answer: sa, options: nums(sa, [sa / 2, a * b * c, 6 * x, a + b + c]), tip: 'שֶׁטַח הַפָּנִים הוּא הַשֶּׁטַח שֶׁל כָּל 6 הַפֵּאוֹת יַחַד.',
      ex: [{ say: 'פּוֹרְסִים אֶת הַתֵּבָה. יֵשׁ 3 זוּגוֹת שֶׁל פֵּאוֹת שָׁווֹת, כָּל זוּג בְּצֶבַע אַחֵר.', svg: S(300, 160, boxNet(a, b, c, 0, 10, 6, 280, 148, 'pairs')) },
        { say: 'הַשֶּׁטַח שֶׁל פֵּאָה אַחַת מִכָּל זוּג: ' + M(a + ' × ' + c + ' = ' + x) + ', ' + M(b + ' × ' + c + ' = ' + y) + ', ' + M(a + ' × ' + b + ' = ' + z) + '.' },
        { say: 'מְחַבְּרִים, וְכוֹפְלִים בְּ-2 כִּי מִכָּל פֵּאָה יֵשׁ שְׁתַּיִם: ' + M('(' + x + ' + ' + y + ' + ' + z + ') × 2 = ' + sa) + '.' }] });
  }
  TILES.push({
    id: 'geo4box', world: 'מִגְדַּל הַתֵּבוֹת', name: 'תֵּבוֹת, נֶפַח וּפְרִיסוֹת', icon: '📦', bld: 'tower', hero: 'קֻבִּי',
    levels: [
      { name: 'פֵּאוֹת, מִקְצוֹעוֹת וְקָדְקוֹדִים', f: h31 },
      { name: 'כַּמָּה קֻבִּיּוֹת בַּתֵּבָה?', f: h32 },
      { name: 'פְּרִיסוֹת', f: h33 },
      { name: 'נֶפַח שֶׁל תֵּבָה', f: h34 },
      { name: 'שֶׁטַח הַפָּנִים', f: h35 }
    ]
  });
  // ---------- world 4: symmetry ----------
  function reg(n, a0, R) { var p = [], i, t; for (i = 0; i < n; i++) { t = (a0 + i * 360 / n) * Math.PI / 180; p.push([(R || 1) * Math.cos(t), (R || 1) * Math.sin(t)]); } return p; }
  function every(step) { var a = [], x; for (x = 0; x < 179.9; x += step) a.push(x); return a; }
  // P = polygons around the centre (0,0); L = angles of the lines of symmetry (all pass through the centre);
  // k = how many times the shape covers itself in a full turn; bad = lines through the centre that are NOT lines of symmetry
  var SH = {
    sq: { P: [QUAD.sq.p], L: [0, 45, 90, 135], k: 4, bad: [22] },
    rect: { P: [QUAD.rect.p], L: [0, 90], k: 2, bad: [28.4, 151.6] },
    rhomb: { P: [QUAD.rhomb.p], L: [0, 90], k: 2, bad: [27.5, 60] },
    para: { P: [QUAD.para.p], L: [], k: 2, bad: [0, 90, 153.4, 45] },
    kite: { P: [QUAD.kite.p], L: [90], k: 1, bad: [0] },
    dart: { P: [DART], L: [90], k: 1, bad: [0] },
    trap: { P: [QUAD.trap.p], L: [90], k: 1, bad: [0] },
    gen: { P: [QUAD.gen.p], L: [], k: 1, bad: [0, 90] },
    triEq: { P: [reg(3, -90)], L: [90, 30, 150], k: 3, bad: [0] },
    triIso: { P: [[[0, -1.1], [0.6, 0.8], [-0.6, 0.8]]], L: [90], k: 1, bad: [0] },
    triIsoR: { P: [[[-0.9, 0.9], [0.9, 0.9], [-0.9, -0.9]]], L: [135], k: 1, bad: [45, 90] },
    triS: { P: [[[-1.2, 0.5], [0.5, 0.5], [1.2, -0.6]]], L: [], k: 1, bad: [90, 0] },
    pent: { P: [reg(5, -90)], L: [90, 162, 54, 126, 18], k: 5, bad: [0] },
    hex: { P: [reg(6, 0)], L: every(30), k: 6, bad: [] },
    oct: { P: [reg(8, 22.5)], L: every(22.5), k: 8, bad: [] },
    notch: { P: [CONC[1]], L: [90], k: 1, bad: [0] },
    ell: { P: [CONC[2]], L: [], k: 1, bad: [0, 90, 45] },
    plus: { P: [[[-0.33, -1], [0.33, -1], [0.33, -0.33], [1, -0.33], [1, 0.33], [0.33, 0.33], [0.33, 1], [-0.33, 1], [-0.33, 0.33], [-1, 0.33], [-1, -0.33], [-0.33, -0.33]]], L: [0, 45, 90, 135], k: 4, bad: [22] },
    star: { P: [(function () { var a = reg(6, -90), b = reg(6, -60, 0.577), p = [], i; for (i = 0; i < 6; i++) p.push(a[i], b[i]); return p; })()], L: every(30), k: 6, bad: [] },
    pin: { P: [0, 90, 180, 270].map(function (d) { return rotPts([[0, 0], [1, 0], [1, -0.6]], 0, 0, d * Math.PI / 180); }), L: [], k: 4, bad: [0, 45, 90] },
    heart: { h: 1, P: [[[0, 0.9]]], L: [90], k: 1, bad: [0] }
  };
  var IDS = Object.keys(SH), SYM = IDS.filter(function (id) { return SH[id].L.length; }), NOSYM = IDS.filter(function (id) { return !SH[id].L.length; });
  var TQ = ['triEq', 'triIso', 'triIsoR', 'triS', 'sq', 'rect', 'rhomb', 'para', 'kite', 'dart', 'trap', 'gen'];
  function shBody(sh, s, fill, stroke, dash) {
    var st = ' fill="' + fill + '" stroke="' + (stroke || INK) + '" stroke-width="3" stroke-linejoin="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '');
    if (sh.h) return '<path d="M0,' + f1(0.9 * s) + ' C' + f1(-1.4 * s) + ',' + f1(-0.1 * s) + ' ' + f1(-0.6 * s) + ',' + f1(-1.1 * s) + ' 0,' + f1(-0.4 * s) + ' C' + f1(0.6 * s) + ',' + f1(-1.1 * s) + ' ' + f1(1.4 * s) + ',' + f1(-0.1 * s) + ' 0,' + f1(0.9 * s) + 'Z"' + st + '/>';
    return sh.P.map(function (pg) { return '<polygon points="' + P(pg.map(function (p) { return [p[0] * s, p[1] * s]; })) + '"' + st + '/>'; }).join('');
  }
  function grp(cx, cy, rot, inner) { return '<g transform="translate(' + cx + ',' + cy + ') rotate(' + rot + ')">' + inner + '</g>'; }
  function symLine(ang, s, shift) { var t = ang * Math.PI / 180, d = [Math.cos(t), Math.sin(t)], p = [-d[1] * shift * s, d[0] * shift * s], l = 1.42 * s; return seg([p[0] - d[0] * l, p[1] - d[1] * l], [p[0] + d[0] * l, p[1] + d[1] * l], RED, 3.5, '8 6'); }
  function mirrorG(ang, s, shift, inner) { // the mirror picture across the line
    var t = ang * Math.PI / 180, c2 = Math.cos(2 * t), s2 = Math.sin(2 * t), px = -Math.sin(t) * shift * s, py = Math.cos(t) * shift * s;
    return '<g transform="matrix(' + [c2, s2, s2, -c2, px - (c2 * px + s2 * py), py - (s2 * px - c2 * py)].map(function (x) { return Math.round(x * 1000) / 1000; }).join(',') + ')">' + inner + '</g>';
  }
  function allLines(sh, s) { return sh.L.map(function (a) { return symLine(a, s, 0); }).join(''); }
  function optShapes(r, K, ansId, otherIds) { // four small pictures, one of them the answer
    var keys = ['a', 'b', 'c', 'd'], ans = keys[K.ri(r, 0, 3)], o = {}, c = 0;
    keys.forEach(function (k, i) { o[k] = S(96, 72, grp(48, 36, K.ri(r, 0, 3) * 90, shBody(SH[k === ans ? ansId : otherIds[c++]], 24, COL[i]))); });
    return { ans: ans, keys: keys, o: o };
  }
  function linesSay(sh) { var n = sh.L.length; return n === 0 ? 'לַצּוּרָה הַזֹּאת אֵין קַו סִימֶטְרְיָה: בְּכָל קִפּוּל הַצְּדָדִים לֹא מְכַסִּים זֶה אֶת זֶה.' : n === 1 ? 'לַצּוּרָה הַזֹּאת יֵשׁ קַו סִימֶטְרְיָה אֶחָד.' : 'לַצּוּרָה הַזֹּאת יֵשׁ ' + n + ' קַוֵּי סִימֶטְרְיָה.'; }
  function rotSay(sh) { return sh.k > 1 ? 'יֵשׁ לָהּ סִימֶטְרְיָה סִבּוּבִית: בְּסִבּוּב שָׁלֵם הִיא מְכַסָּה אֶת עַצְמָהּ ' + sh.k + ' פְּעָמִים.' : 'אֵין לָהּ סִימֶטְרְיָה סִבּוּבִית: רַק אַחֲרֵי סִבּוּב שָׁלֵם הִיא מְכַסָּה שׁוּב אֶת עַצְמָהּ.'; }
  function fullPic(sh, col, rot) { return S(300, 164, grp(150, 82, rot, shBody(sh, 56, col) + allLines(sh, 56) + dot([0, 0], INK, 4))); }
  var FOLD = 'מְקַפְּלִים לְאֹרֶךְ הַקַּו: הַאִם צַד אֶחָד מְכַסֶּה בְּדִיּוּק אֶת הַצַּד הַשֵּׁנִי?';
  function h41(r, K) {
    var col = K.pick(r, COL.filter(function (c) { return c !== '#ff5fa2'; })), rot = K.ri(r, 0, 3) * 90, id, sh, ang, shift = 0, truth, s = 56;
    if (r() < 0.3) { // which shape has a line of symmetry
      id = K.pick(r, SYM); var os = optShapes(r, K, id, K.sample(r, NOSYM, 3));
      return Q(r, K, { text: 'לְאֵיזוֹ צוּרָה יֵשׁ קַו סִימֶטְרְיָה?', answer: os.ans, options: os.keys, keep: true, optHtml: os.o, tip: FOLD,
        ex: [{ say: 'מְחַפְּשִׂים קַו שֶׁאֶפְשָׁר לְקַפֵּל לְאָרְכּוֹ, כָּךְ שֶׁצַּד אֶחָד מְכַסֶּה בְּדִיּוּק אֶת הַצַּד הַשֵּׁנִי.', svg: fullPic(SH[id], COL[4], 0) }, { say: linesSay(SH[id]) + ' בַּצּוּרוֹת הָאֲחֵרוֹת אֵין קַו כָּזֶה.' }] });
    }
    truth = r() < 0.5;
    if (truth) { id = K.pick(r, SYM); sh = SH[id]; ang = K.pick(r, sh.L); }
    else {
      id = K.pick(r, IDS); sh = SH[id];
      if (sh.L.length && (!sh.bad.length || r() < 0.4)) { ang = K.pick(r, sh.L); shift = r() < 0.5 ? 0.36 : -0.36; } else ang = K.pick(r, sh.bad);
    }
    var base = shBody(sh, s, col), line = symLine(ang, s, shift), svg = S(300, 164, grp(150, 82, rot, base + line));
    return TF(r, K, { text: 'הַאִם הַקַּו הוּא קַו סִימֶטְרְיָה שֶׁל הַצּוּרָה?', svg: svg, tip: FOLD,
      ex: [{ say: FOLD, svg: svg }, { say: 'הוֹפְכִים אֶת הַצּוּרָה אֶל הַצַּד הַשֵּׁנִי שֶׁל הַקַּו. זֶה הַצִּיּוּר הָאָדֹם הַמְּקֻוְקָו.', svg: S(300, 164, grp(150, 82, rot, base + mirrorG(ang, s, shift, shBody(sh, s, 'none', RED, '6 5')) + line)) },
        { say: truth ? 'הוּא נוֹפֵל בְּדִיּוּק עַל הַצּוּרָה, לָכֵן זֶה קַו סִימֶטְרְיָה.' : 'הוּא לֹא נוֹפֵל עַל הַצּוּרָה, לָכֵן זֶה לֹא קַו סִימֶטְרְיָה.' }] }, truth);
  }
  var NP = [[1, 0, 0], [0, 0, 1], [1, 1, 0], [0, 1, 1]], PAL = [[0, 1, 0], [1, 1, 1], [1, 0, 1]];
  function halfPic(cells, u, w, h, col) { // 6 x 4 squares, the line in the middle
    var x0 = (w - 6 * u) / 2, y0 = (h - 4 * u) / 2, s = '', c, k;
    for (k = 0; k < 4; k++) for (c = 0; c < 6; c++) s += '<rect x="' + f1(x0 + c * u) + '" y="' + f1(y0 + k * u) + '" width="' + u + '" height="' + u + '" fill="' + (cells[c + ',' + k] ? col : '#fff') + '" stroke="' + (cells[c + ',' + k] ? INK : GREY) + '" stroke-width="1.5"/>';
    return S(w, h, s + seg([w / 2, y0 - 5], [w / 2, y0 + 4 * u + 5], RED, 3, '6 4'));
  }
  function h42(r, K) {
    var col = K.pick(r, COL), rot = K.ri(r, 0, 3) * 90, id, sh, n;
    if (r() < 0.4) { // complete the other half
      var np = K.ri(r, 2, 4), rows = [], i, c, left = {}, good = {}, slide = {}, part = {}, sw;
      for (i = 0; i < 4; i++) rows.push(K.pick(r, i < np ? NP : PAL));
      rows = K.shuffle(r, rows); sw = K.pick(r, [0, 1, 2, 3].filter(function (k) { return NP.indexOf(rows[k]) >= 0; }));
      for (i = 0; i < 4; i++) for (c = 0; c < 3; c++) if (rows[i][c]) {
        left[c + ',' + i] = good[c + ',' + i] = slide[c + ',' + i] = part[c + ',' + i] = 1;
        good[(5 - c) + ',' + i] = 1; slide[(c + 3) + ',' + i] = 1; part[(i === sw ? c + 3 : 5 - c) + ',' + i] = 1;
      }
      var keys = K.shuffle(r, ['a', 'b', 'c']), o = {}; o[keys[0]] = halfPic(good, 14, 96, 66, col); o[keys[1]] = halfPic(slide, 14, 96, 66, col); o[keys[2]] = halfPic(part, 14, 96, 66, col);
      return Q(r, K, { text: 'מָה מַשְׁלִים אֶת הַצּוּרָה כָּךְ שֶׁהַקַּו יִהְיֶה קַו סִימֶטְרְיָה?', svg: halfPic(left, 26, 300, 124, col), answer: keys[0], options: ['a', 'b', 'c'], keep: true, optHtml: o, tip: 'כָּל מִשְׁבֶּצֶת וּבַת הַזּוּג שֶׁלָּהּ נִמְצָאוֹת בְּאוֹתוֹ מֶרְחָק מֵהַקַּו.',
        ex: [{ say: 'כָּל מִשְׁבֶּצֶת קוֹפֶצֶת אֶל הַצַּד הַשֵּׁנִי שֶׁל הַקַּו, בְּאוֹתָהּ שׁוּרָה וּבְאוֹתוֹ מֶרְחָק מֵהַקַּו.', svg: halfPic(good, 26, 300, 124, col) }, { say: 'מִשְׁבֶּצֶת שֶׁנּוֹגַעַת בַּקַּו נִשְׁאֶרֶת לְיַד הַקַּו. מִשְׁבֶּצֶת רְחוֹקָה נִשְׁאֶרֶת רְחוֹקָה.' }] });
    }
    id = K.pick(r, IDS); sh = SH[id]; n = sh.L.length;
    return Q(r, K, { text: 'כַּמָּה קַוֵּי סִימֶטְרְיָה יֵשׁ לַצּוּרָה?', svg: S(300, 164, grp(150, 82, rot, shBody(sh, 60, col))), answer: n, options: nums(n, [sh.k > 1 && sh.k !== n ? sh.k : null, n * 2, n / 2, 0, 1, 2, 4], 0), tip: FOLD,
      ex: [{ say: 'מְנַסִּים לְקַפֵּל בְּכָל כִּוּוּן, וּמְצַיְּרִים רַק קַוִּים שֶׁבָּהֶם צַד אֶחָד מְכַסֶּה בְּדִיּוּק אֶת הַצַּד הַשֵּׁנִי.', svg: fullPic(sh, col, rot) }, { say: linesSay(sh) + (id === 'rect' ? ' הָאֲלַכְסוֹנִים שֶׁל הַמַּלְבֵּן אֵינָם קַוֵּי סִימֶטְרְיָה.' : '') }] });
  }
  function h43(r, K) {
    var col = K.pick(r, COL), rot = K.ri(r, 0, 3) * 90, id = K.pick(r, IDS), sh = SH[id], s = 56, mk = sh.P[0][1] || sh.P[0][0], turn = sh.k > 1 ? 360 / sh.k : 100;
    var svg = S(300, 164, grp(150, 82, rot, shBody(sh, s, col) + dot([0, 0], INK, 4)));
    var ex = [{ say: 'נוֹעֲצִים סִכָּה בַּמֶּרְכָּז וּמְסוֹבְבִים אֶת הַצּוּרָה מֵעַל הֶעְתֵּק שֶׁלָּהּ.', svg: S(300, 164, grp(150, 82, rot, shBody(sh, s, col) + dot([mk[0] * s, mk[1] * s], '#fff', 6) + dot([0, 0], INK, 4))) },
      { say: sh.k > 1 ? 'כְּבָר אַחֲרֵי חֵלֶק מֵהַסִּבּוּב הַצּוּרָה (הַקַּו הָאָדֹם) מְכַסָּה בְּדִיּוּק אֶת הַהֶעְתֵּק.' : 'אַחֲרֵי חֵלֶק מֵהַסִּבּוּב הַצּוּרָה (הַקַּו הָאָדֹם) לֹא מְכַסָּה אֶת הַהֶעְתֵּק.', svg: S(300, 164, grp(150, 82, rot, shBody(sh, s, GREY) + grp(0, 0, turn, shBody(sh, s, 'none', RED, '6 5') + dot([mk[0] * s, mk[1] * s], '#fff', 6)) + dot([0, 0], INK, 4))) },
      { say: rotSay(sh).replace('יֵשׁ לָהּ', 'יֵשׁ לַצּוּרָה').replace('אֵין לָהּ', 'אֵין לַצּוּרָה') }];
    if (r() < 0.5) return TF(r, K, { text: 'הַאִם יֵשׁ לַצּוּרָה סִימֶטְרְיָה סִבּוּבִית?', svg: svg, tip: 'מְסוֹבְבִים פָּחוֹת מִסִּבּוּב שָׁלֵם: הַאִם הַצּוּרָה מְכַסָּה אֶת עַצְמָהּ?', ex: ex }, sh.k > 1);
    return Q(r, K, { text: 'כַּמָּה פְּעָמִים הַצּוּרָה מְכַסָּה אֶת עַצְמָהּ בְּסִבּוּב שָׁלֵם?', svg: svg, answer: sh.k, options: nums(sh.k, [sh.L.length !== sh.k ? sh.L.length : null, sh.k * 2, 2, 1, 4]), tip: 'בְּסוֹף סִבּוּב שָׁלֵם כָּל צוּרָה מְכַסָּה אֶת עַצְמָהּ: זוֹ פַּעַם אַחַת.', ex: ex });
  }
  var DESC = [
    ['לְאֵיזוֹ צוּרָה יֵשׁ בְּדִיּוּק קַו סִימֶטְרְיָה אֶחָד?', function (s) { return s.L.length === 1; }],
    ['לְאֵיזוֹ צוּרָה יֵשׁ בְּדִיּוּק 2 קַוֵּי סִימֶטְרְיָה?', function (s) { return s.L.length === 2; }],
    ['לְאֵיזוֹ צוּרָה יֵשׁ 3 קַוֵּי סִימֶטְרְיָה?', function (s) { return s.L.length === 3; }],
    ['לְאֵיזוֹ צוּרָה יֵשׁ 4 קַוֵּי סִימֶטְרְיָה?', function (s) { return s.L.length === 4; }],
    ['לְמִי אֵין קַו סִימֶטְרְיָה, אֲבָל יֵשׁ סִימֶטְרְיָה סִבּוּבִית?', function (s) { return !s.L.length && s.k > 1; }],
    ['לְמִי אֵין קַו סִימֶטְרְיָה וְגַם אֵין סִימֶטְרְיָה סִבּוּבִית?', function (s) { return !s.L.length && s.k === 1; }],
    ['לְאֵיזוֹ צוּרָה אֵין סִימֶטְרְיָה סִבּוּבִית?', function (s) { return s.k === 1; }]
  ];
  var SYM_TF = [
    ['לְרִבּוּעַ יֵשׁ 4 קַוֵּי סִימֶטְרְיָה.', 1, 'sq'], ['לְרִבּוּעַ יֵשׁ רַק 2 קַוֵּי סִימֶטְרְיָה.', 0, 'sq'], ['הָאֲלַכְסוֹן שֶׁל רִבּוּעַ הוּא קַו סִימֶטְרְיָה.', 1, 'sq'], ['לְרִבּוּעַ יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 1, 'sq'],
    ['לַמַּלְבֵּן שֶׁבַּצִּיּוּר יֵשׁ 4 קַוֵּי סִימֶטְרְיָה.', 0, 'rect'], ['לַמַּלְבֵּן שֶׁבַּצִּיּוּר יֵשׁ 2 קַוֵּי סִימֶטְרְיָה.', 1, 'rect'], ['הָאֲלַכְסוֹן שֶׁל הַמַּלְבֵּן שֶׁבַּצִּיּוּר הוּא קַו סִימֶטְרְיָה.', 0, 'rect'], ['לַמַּלְבֵּן שֶׁבַּצִּיּוּר יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 1, 'rect'],
    ['לַמַּקְבִּילִית שֶׁבַּצִּיּוּר יֵשׁ קַו סִימֶטְרְיָה.', 0, 'para'], ['לַמַּקְבִּילִית שֶׁבַּצִּיּוּר יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 1, 'para'],
    ['לַמְּעֻיָּן שֶׁבַּצִּיּוּר יֵשׁ 2 קַוֵּי סִימֶטְרְיָה.', 1, 'rhomb'], ['לַדַּלְתּוֹן שֶׁבַּצִּיּוּר יֵשׁ קַו סִימֶטְרְיָה אֶחָד.', 1, 'kite'], ['לַדַּלְתּוֹן שֶׁבַּצִּיּוּר יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 0, 'kite'],
    ['לִמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת יֵשׁ 3 קַוֵּי סִימֶטְרְיָה.', 1, 'triEq'], ['לִמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 1, 'triEq'], ['לִמְשֻׁלָּשׁ שְׁוֵה־צְלָעוֹת יֵשׁ רַק קַו סִימֶטְרְיָה אֶחָד.', 0, 'triEq'],
    ['לַמְּשֻׁלָּשׁ שְׁוֵה־הַשּׁוֹקַיִם שֶׁבַּצִּיּוּר יֵשׁ קַו סִימֶטְרְיָה אֶחָד.', 1, 'triIso'], ['לַמְּשֻׁלָּשׁ שְׁוֵה־הַשּׁוֹקַיִם שֶׁבַּצִּיּוּר יֵשׁ סִימֶטְרְיָה סִבּוּבִית.', 0, 'triIso'],
    ['לִמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת יֵשׁ קַו סִימֶטְרְיָה.', 0, 'triS'], ['לִמְשֻׁלָּשׁ שׁוֹנֵה־צְלָעוֹת אֵין קַו סִימֶטְרְיָה.', 1, 'triS']
  ];
  var LOPT = ['אֵין קַו סִימֶטְרְיָה', 'קַו סִימֶטְרְיָה אֶחָד', '2 קַוֵּי סִימֶטְרְיָה', '3 קַוֵּי סִימֶטְרְיָה', '4 קַוֵּי סִימֶטְרְיָה'];
  function h44(r, K) {
    var u = r(), col = K.pick(r, COL), rot = K.ri(r, 0, 3) * 90, id, sh, q;
    if (u < 0.3) {
      q = K.pick(r, SYM_TF); sh = SH[q[2]];
      return TF(r, K, { text: q[0], svg: S(300, 150, grp(150, 75, 0, shBody(sh, 52, col))), tip: FOLD, ex: [{ say: linesSay(sh), svg: fullPic(sh, col, 0) }, { say: rotSay(sh) }] }, !!q[1]);
    }
    if (u < 0.55) {
      id = K.pick(r, TQ); sh = SH[id];
      return Q(r, K, { text: 'מָה נָכוֹן עַל הַצּוּרָה?', svg: S(300, 164, grp(150, 82, rot, shBody(sh, 58, col))), answer: LOPT[sh.L.length], options: K.opts(r, LOPT[sh.L.length], LOPT, 4), tip: FOLD, ex: [{ say: linesSay(sh), svg: fullPic(sh, col, rot) }, { say: rotSay(sh) }] });
    }
    q = K.pick(r, DESC); id = K.pick(r, TQ.filter(function (x) { return q[1](SH[x]); })); sh = SH[id];
    var os = optShapes(r, K, id, K.sample(r, TQ.filter(function (x) { return !q[1](SH[x]); }), 3));
    return Q(r, K, { text: q[0], answer: os.ans, options: os.keys, keep: true, optHtml: os.o, tip: 'בּוֹדְקִים כָּל צוּרָה: מְקַפְּלִים, וּמְסוֹבְבִים סְבִיב הַמֶּרְכָּז.', ex: [{ say: linesSay(sh), svg: fullPic(sh, COL[4], 0) }, { say: rotSay(sh) }] });
  }
  TILES.push({
    id: 'geo4sym', world: 'אֲגַם הַמַּרְאוֹת', name: 'סִימֶטְרְיָה', icon: '🦋', bld: 'castleSmall', hero: 'סִימֶטְרוֹן',
    levels: [
      { name: 'קַו סִימֶטְרְיָה', f: h41 },
      { name: 'כַּמָּה קַוֵּי סִימֶטְרְיָה?', f: h42 },
      { name: 'סִימֶטְרְיָה סִבּוּבִית', f: h43 },
      { name: 'מְשֻׁלָּשִׁים וּמְרֻבָּעִים', f: h44 }
    ]
  });
  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({ sub: 'geo', grade: 4, tiles: TILES });
})();
