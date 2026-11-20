(function () {
  'use strict';
  // ---------- English, grade 4 only (second year of English: letters review, letter patterns, Band I words, short sentences) ----------
  var INK = '#3b2a55', PINK = '#ff5fa2', FONT = 'font-family="Verdana,Arial,sans-serif" font-weight="700"';

  // ---------- drawing helpers ----------
  function em(e) { return '<span class="em">' + e + '</span>'; }
  // letter cards: parts in a row; '' is the missing part; hi = index (or indexes) drawn in colour
  function tiles(parts, hi) {
    var his = hi == null ? [] : [].concat(hi), x = 4, body = '', i, p, w, on, blank;
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; blank = p === ''; w = blank ? 46 : p.length * 25 + 18; on = his.indexOf(i) >= 0;
      body += '<rect x="' + x + '" y="4" width="' + w + '" height="56" rx="10" fill="' + (blank ? '#fff' : on ? '#ffe39a' : '#f3eefb') + '" stroke="' + (blank || on ? PINK : INK) + '" stroke-width="3"' + (blank ? ' stroke-dasharray="7 5"' : '') + '/>';
      body += '<text x="' + (x + w / 2) + '" y="45" text-anchor="middle" ' + FONT + ' font-size="36" fill="' + (blank || on ? PINK : INK) + '">' + (blank ? '?' : p) + '</text>';
      x += w + 6;
    }
    var W = x - 2, k = Math.min(1, 300 / W);
    return '<svg viewBox="0 0 ' + W + ' 64" width="' + Math.round(W * k) + '" height="' + Math.round(64 * k) + '">' + body + '</svg>';
  }
  // a word cut around a letter pattern: { p: parts, hi: index of the pattern }
  function cut(word, pat, blank) {
    var i = word.toLowerCase().indexOf(pat), a = [], hi;
    if (i > 0) a.push(word.slice(0, i));
    hi = a.length; a.push(blank ? '' : word.slice(i, i + pat.length));
    if (i + pat.length < word.length) a.push(word.slice(i + pat.length));
    return { p: a, hi: hi };
  }
  function dot(hex) {
    return function (w) { return '<svg viewBox="0 0 80 80" width="' + w + '" height="' + w + '"><circle cx="40" cy="40" r="32" fill="' + hex + '" stroke="' + INK + '" stroke-width="4"/></svg>'; };
  }
  function deskSvg(w) {
    return '<svg viewBox="0 0 100 80" width="' + w + '" height="' + Math.round(w * 0.8) + '"><rect x="8" y="22" width="84" height="10" rx="3" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/><rect x="14" y="32" width="8" height="40" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/><rect x="78" y="32" width="8" height="40" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/><rect x="52" y="32" width="26" height="20" fill="#e2b07a" stroke="' + INK + '" stroke-width="3"/><circle cx="65" cy="42" r="2.5" fill="' + INK + '"/></svg>';
  }
  function boardSvg(w) {
    return '<svg viewBox="0 0 100 80" width="' + w + '" height="' + Math.round(w * 0.8) + '"><rect x="6" y="8" width="88" height="54" rx="4" fill="#2f7d55" stroke="#c98a4b" stroke-width="6"/><text x="30" y="46" text-anchor="middle" ' + FONT + ' font-size="24" fill="#fff">A</text><text x="52" y="46" text-anchor="middle" ' + FONT + ' font-size="24" fill="#fff">B</text><text x="74" y="46" text-anchor="middle" ' + FONT + ' font-size="24" fill="#fff">C</text><rect x="38" y="66" width="24" height="6" rx="2" fill="#fff" stroke="' + INK + '" stroke-width="2"/></svg>';
  }
  function clockSvg(h, half, w) {
    var s = '<svg viewBox="0 0 100 100" width="' + w + '" height="' + w + '"><circle cx="50" cy="50" r="46" fill="#fff" stroke="' + INK + '" stroke-width="4"/>', i, a;
    for (i = 1; i <= 12; i++) {
      a = i * Math.PI / 6;
      s += '<text x="' + (50 + 35 * Math.sin(a)).toFixed(1) + '" y="' + (54.5 - 35 * Math.cos(a)).toFixed(1) + '" text-anchor="middle" ' + FONT + ' font-size="12" fill="' + INK + '">' + i + '</text>';
    }
    a = (h % 12 + (half ? 0.5 : 0)) * Math.PI / 6;
    s += '<line x1="50" y1="50" x2="50" y2="' + (half ? 78 : 22) + '" stroke="#3aa0ff" stroke-width="4" stroke-linecap="round"/>';
    s += '<line x1="50" y1="50" x2="' + (50 + 19 * Math.sin(a)).toFixed(1) + '" y2="' + (50 - 19 * Math.cos(a)).toFixed(1) + '" stroke="' + PINK + '" stroke-width="6" stroke-linecap="round"/>';
    return s + '<circle cx="50" cy="50" r="4" fill="' + INK + '"/></svg>';
  }
  var BALL = { red: '#e53935', blue: '#3aa0ff', green: '#3ec46d', yellow: '#ffd21f' };
  // a ball and a box / a table: in, on, under, next to, behind
  function scene(furn, prep, color, w) {
    var b = function (cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="' + BALL[color] + '" stroke="' + INK + '" stroke-width="3"/>'; };
    var s = '<svg viewBox="0 0 120 90" width="' + w + '" height="' + Math.round(w * 0.75) + '"><line x1="4" y1="81" x2="116" y2="81" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
    if (furn === 'box') {
      var box = '<rect x="38" y="39" width="42" height="41" rx="3" fill="#e9defa" stroke="' + INK + '" stroke-width="3"/>';
      if (prep === 'behind') s += b(82, 69) + box;
      else s += box + (prep === 'in' ? b(59, 67) : prep === 'on' ? b(59, 27) : b(102, 69));
    } else {
      s += '<rect x="26" y="36" width="68" height="9" rx="3" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/><rect x="31" y="45" width="6" height="35" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/><rect x="83" y="45" width="6" height="35" fill="#c98a4b" stroke="' + INK + '" stroke-width="3"/>';
      s += prep === 'on' ? b(60, 24) : prep === 'under' ? b(60, 69) : b(106, 69);
    }
    return s + '</svg>';
  }
  function an(w) { return /^[aeiou]/.test(w) ? 'an' : 'a'; }

  // ---------- fixed Hebrew lines ----------
  var T_PICWORD = 'אֵיזוֹ מִלָּה מַתְאִימָה לַתְּמוּנָה?', T_WORDPIC = 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּלָּה?', T_WORD = 'מָה הַמִּלָּה?', T_SPELL = 'אֵיךְ כּוֹתְבִים אֶת הַמִּלָּה?';
  var SHORT = 'קָצָר', LONG = 'אָרֹךְ';

  // =====================================================================================
  // World 1: letters and sounds
  // =====================================================================================
  var ABC = 'abcdefghijklmnopqrstuvwxyz';
  var SIM = { a: 'oed', b: 'dpq', c: 'oes', d: 'bpq', e: 'fca', f: 'etl', g: 'qyj', h: 'nbk', i: 'ljt', j: 'iyg', k: 'hxr', l: 'itj', m: 'nwu', n: 'mhu', o: 'cqa', p: 'qbd', q: 'pgd', r: 'nkp', s: 'zcx', t: 'lfi', u: 'vnw', v: 'uwy', w: 'vmu', x: 'kzs', y: 'gvj', z: 'sxn' };
  var KEYW = { a: 'apple 🍎', b: 'ball ⚽', c: 'cat 🐱', d: 'dog 🐶', e: 'egg 🥚', f: 'fish 🐟', g: 'girl 👧', h: 'hat 🎩', i: 'ice cream 🍦', j: 'juice 🧃', k: 'king 🤴', l: 'lion 🦁', m: 'milk 🥛', n: 'nose 👃', o: 'orange 🍊', p: 'pen 🖊️', q: 'queen 👸', r: 'rain 🌧️', s: 'sun ☀️', t: 'tree 🌳', u: 'umbrella ☂️', v: 'van 🚐', w: 'window 🪟', x: 'box 📦', y: 'yellow 🟡', z: 'zebra 🦓' };

  function bigSmall(r, K) {
    var l = ABC[K.ri(r, 0, 25)], U = l.toUpperCase(), up = r() < 0.5, cs = function (c) { return up ? c : c.toUpperCase(); };
    return K.q(r, {
      text: up ? 'אֵיזוֹ אוֹת קְטַנָּה מַתְאִימָה?' : 'אֵיזוֹ אוֹת גְּדוֹלָה מַתְאִימָה?',
      svg: tiles([up ? U : l]), answer: cs(l), options: [cs(l)].concat(SIM[l].split('').map(cs)), optLtr: true, key: 'bs' + (up ? U : l),
      tip: 'לְכָל אוֹת יֵשׁ צוּרָה גְּדוֹלָה וְצוּרָה קְטַנָּה',
      ex: [
        { say: 'זוֹ אוֹתָהּ אוֹת: פַּעַם גְּדוֹלָה וּפַעַם קְטַנָּה', svg: tiles([U, l]) },
        { say: l === 'x' ? 'הָאוֹת הַזֹּאת נִמְצֵאת בְּסוֹף הַמִּלָּה box' : 'הַמִּלָּה הַזֹּאת מַתְחִילָה בָּאוֹת ' + l, big: U + ' ' + l + ' · ' + KEYW[l], ltr: true }
      ]
    });
  }

  var FS = [['apple', '🍎'], ['ant', '🐜'], ['ball', '⚽'], ['banana', '🍌'], ['bus', '🚌'], ['bed', '🛏️'], ['cat', '🐱'], ['cow', '🐮'], ['cup', '🥤'], ['car', '🚗'], ['dog', '🐶'], ['door', '🚪'], ['duck', '🦆'], ['egg', '🥚'], ['elephant', '🐘'], ['fish', '🐟'], ['frog', '🐸'], ['fox', '🦊'], ['girl', '👧'], ['goat', '🐐'], ['hat', '🎩'], ['horse', '🐴'], ['hand', '✋'], ['juice', '🧃'], ['king', '🤴'], ['key', '🔑'], ['lion', '🦁'], ['leg', '🦵'], ['milk', '🥛'], ['monkey', '🐒'], ['moon', '🌙'], ['nose', '👃'], ['nut', '🥜'], ['orange', '🍊'], ['pen', '🖊️'], ['pig', '🐷'], ['pizza', '🍕'], ['queen', '👸'], ['rain', '🌧️'], ['rabbit', '🐰'], ['sun', '☀️'], ['sock', '🧦'], ['tree', '🌳'], ['tomato', '🍅'], ['umbrella', '☂️'], ['van', '🚐'], ['window', '🪟'], ['watch', '⌚'], ['yellow', '🟡'], ['zebra', '🦓']];
  var NOTWITH = { a: 'eu', e: 'ai', o: 'ua', c: 'kqs', k: 'cq', q: 'ck', s: 'cz', z: 's', g: 'j', j: 'g', y: 'u', u: 'yao' }; // letters that could also be heard as the first sound
  function firstSound(r, K) {
    var it = K.pick(r, FS), w = it[0], l = w[0], others = FS.filter(function (x) { return x[0][0] === l && x[0] !== w; }).map(function (x) { return x[0]; });
    var ex = [
      { say: 'אוֹמְרִים אֶת הַמִּלָּה וּמַקְשִׁיבִים לַצְּלִיל הָרִאשׁוֹן', big: w + ' ' + it[1], ltr: true },
      { say: 'הַמִּלָּה מַתְחִילָה בָּאוֹת ' + l, svg: tiles([l, w.slice(1)], 0) }
    ];
    if (others.length) ex.push({ say: 'עוֹד מִלִּים שֶׁמַּתְחִילוֹת בְּאוֹתָהּ אוֹת', big: others.join(' · '), ltr: true });
    if (r() < 0.6) {
      var pool = ABC.split('').filter(function (c) { return c !== l && c !== 'x' && (NOTWITH[l] || '').indexOf(c) < 0; });
      return K.q(r, { text: 'בְּאֵיזוֹ אוֹת הַמִּלָּה מַתְחִילָה?', pic: it[1], say: w, answer: l, options: K.opts(r, l, pool, 4), optLtr: true, key: 'fsA' + w, tip: 'אוֹמְרִים אֶת הַמִּלָּה לְאַט וּמַקְשִׁיבִים לַהַתְחָלָה', ex: ex });
    }
    var seen = {}, ws = [];
    seen[l] = 1;
    K.shuffle(r, FS).forEach(function (x) { if (ws.length < 2 && !seen[x[0][0]]) { seen[x[0][0]] = 1; ws.push(x[0]); } });
    return K.q(r, { text: 'אֵיזוֹ מִלָּה מַתְחִילָה בָּאוֹת הַזֹּאת?', svg: tiles([l]), answer: w, options: [w].concat(ws), optLtr: true, key: 'fsB' + w, tip: 'מִסְתַּכְּלִים עַל הָאוֹת הָרִאשׁוֹנָה שֶׁל כָּל מִלָּה', ex: ex });
  }

  // target, two words that differ in the vowel only, picture
  var CVC = [['cat', 'cut', 'cot', '🐱'], ['bag', 'big', 'bug', '🎒'], ['hat', 'hit', 'hot', '🎩'], ['pen', 'pin', 'pan', '🖊️'], ['bed', 'bad', 'bud', '🛏️'], ['dog', 'dig', 'dug', '🐶'], ['sit', 'sat', 'set'], ['ten', 'tin', 'tan', '10'], ['bus', 'bas', 'bis', '🚌'], ['cup', 'cap', 'cop', '🥤'], ['pet', 'pot', 'pit'], ['red', 'rod', 'rid', '🔴'], ['sun', 'sin', 'sen', '☀️'], ['map', 'mop', 'mip', '🗺️'], ['fan', 'fun', 'fin'], ['leg', 'log', 'lag', '🦵'], ['net', 'nut', 'not', '🥅'], ['pig', 'peg', 'pug', '🐷'], ['man', 'men', 'mun', '👨'], ['six', 'sax', 'sox', '6'], ['box', 'bix', 'bax', '📦'], ['run', 'ran', 'ron'], ['top', 'tap', 'tip'], ['big', 'bag', 'beg'], ['hot', 'hat', 'hut'], ['fox', 'fix', 'fax', '🦊'], ['hen', 'hin', 'hun', '🐔'], ['bat', 'bit', 'but', '🦇']];
  function shortWords(r, K) {
    var it = K.pick(r, CVC), w = it[0], o = {
      answer: w, options: [w, it[1], it[2]], optLtr: true,
      tip: 'קוֹרְאִים כָּל מִלָּה לְאַט, אוֹת אַחַר אוֹת',
      ex: [
        { say: 'קוֹרְאִים כָּל מִלָּה לְאַט, אוֹת אַחַר אוֹת', big: [w, it[1], it[2]].join(' · '), ltr: true },
        { say: 'רַק הָאוֹת בָּאֶמְצַע שׁוֹנָה. בַּמִּלָּה הַנְּכוֹנָה יֵשׁ ' + w[1], svg: tiles(w.split(''), 1) }
      ]
    };
    if (it[3] && r() < 0.45) { o.text = T_PICWORD; o.pic = it[3]; o.key = 'cvcP' + w; } else { o.text = T_WORD; o.say = w; o.key = 'cvcS' + w; }
    return K.q(r, o);
  }

  var BW = [['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['bus', '🚌'], ['bed', '🛏️'], ['sun', '☀️'], ['hat', '🎩'], ['bag', '🎒'], ['pen', '🖊️'], ['box', '📦'], ['cup', '🥤'], ['leg', '🦵'], ['net', '🥅'], ['ten', '10'], ['six', '6'], ['red', '🔴'], ['man', '👨'], ['fox', '🦊'], ['bat', '🦇'], ['bug', '🐛'], ['nut', '🥜'], ['map', '🗺️'], ['hen', '🐔'], ['van', '🚐'], ['rat', '🐀'], ['web', '🕸️'], ['pan', '🍳'], ['log', '🪵']];
  function buildWord(r, K) {
    var it = K.pick(r, BW), w = it[0], L = w.split('');
    var ex = [
      { say: 'אוֹמְרִים אֶת הַמִּלָּה', big: w + ' ' + it[1], ltr: true },
      { say: 'מְפָרְקִים לִצְלִילִים', big: L.join(' - '), ltr: true },
      { say: 'לְכָל צְלִיל אוֹת אַחַת, מִשְּׂמֹאל לְיָמִין', svg: tiles(L) },
      { say: 'קוֹרְאִים שׁוּב אֶת הַמִּלָּה', big: w, ltr: true }
    ];
    if (r() < 0.6) return K.q(r, { fmt: 'order', text: '', pic: it[1], say: w, parts: L, sep: '', answer: w, ltr: true, key: 'bwO' + w, tip: 'אוֹמְרִים אֶת הַמִּלָּה לְאַט: צְלִיל, צְלִיל, צְלִיל', ex: ex });
    return K.q(r, { text: 'אֵיזוֹ אוֹת חֲסֵרָה?', pic: it[1], say: w, svg: tiles([L[0], '', L[2]]), answer: L[1], options: K.opts(r, L[1], ['a', 'e', 'i', 'o', 'u'], 4), optLtr: true, key: 'bwM' + w, tip: 'מַקְשִׁיבִים לַצְּלִיל שֶׁבְּאֶמְצַע הַמִּלָּה', ex: ex });
  }

  // =====================================================================================
  // World 2: letter patterns
  // =====================================================================================
  var DG = {
    sh: [['she'], ['shop'], ['shoe', '👟'], ['shirt', '👕'], ['sheep', '🐑'], ['fish', '🐟'], ['ship', '🚢'], ['wash'], ['shell', '🐚'], ['dish']],
    ch: [['chair', '🪑'], ['chicken', '🐔'], ['cheese', '🧀'], ['lunch'], ['chocolate', '🍫'], ['teacher'], ['children'], ['chips', '🍟'], ['much']],
    th: [['three'], ['mother'], ['father'], ['brother'], ['mouth', '👄'], ['this'], ['bath', '🛁'], ['thanks'], ['tooth', '🦷'], ['think'], ['with']],
    ph: [['phone', '📱'], ['elephant', '🐘'], ['photo', '📷'], ['dolphin', '🐬'], ['alphabet', '🔤']]
  };
  var DGS = ['sh', 'ch', 'th', 'ph'], DGALL = [];
  DGS.forEach(function (d) { DG[d].forEach(function (x) { DGALL.push({ w: x[0], e: x[1], d: d }); }); });
  function digraphs(r, K) {
    var it = K.pick(r, DGALL), w = it.w, d = it.d, c = cut(w, d), fam = DG[d].map(function (x) { return x[0]; }).filter(function (x) { return x !== w; });
    var ex = [
      { say: 'שְׁתֵּי הָאוֹתִיּוֹת ' + d + ' יַחַד הֵן צְלִיל אֶחָד', svg: tiles(c.p, c.hi) },
      { say: 'עוֹד מִלִּים עִם אוֹתוֹ צֵרוּף', big: K.sample(r, fam, 3).join(' · '), ltr: true }
    ], tip = 'שְׁתֵּי אוֹתִיּוֹת יַחַד, צְלִיל אֶחָד';
    if (it.e && r() < 0.4) {
      var wrong = K.sample(r, DGS.filter(function (x) { return x !== d; }), 2).map(function (x) { var i = w.indexOf(d); return w.slice(0, i) + x + w.slice(i + 2); });
      return K.q(r, { text: T_PICWORD, pic: it.e, answer: w, options: [w].concat(wrong), optLtr: true, key: 'dgP' + w, tip: tip, ex: ex });
    }
    var o = { text: 'מָה חָסֵר בַּמִּלָּה?', say: w, svg: tiles(cut(w, d, true).p), answer: d, options: DGS, optLtr: true, key: 'dgM' + w, tip: tip, ex: ex };
    if (it.e) o.pic = it.e;
    return K.q(r, o);
  }

  var ME = [['kit', 'kite'], ['cap', 'cape'], ['not', 'note'], ['hop', 'hope'], ['cut', 'cute'], ['tub', 'tube'], ['mad', 'made'], ['plan', 'plane'], ['tap', 'tape'], ['fin', 'fine'], ['bit', 'bite'], ['hid', 'hide'], ['at', 'ate'], ['pin', 'pine'], ['hat', 'hate'], ['can', 'cane'], ['rid', 'ride']];
  var MEPIC = [['kite', 'kit', '🪁'], ['cap', 'cape', '🧢'], ['plane', 'plan', '✈️'], ['pin', 'pine', '📌'], ['hat', 'hate', '🎩'], ['can', 'cane', '🥫'], ['cake', 'cak', '🎂'], ['bike', 'bik', '🚲'], ['nose', 'nos', '👃'], ['home', 'hom', '🏠']];
  var MELONG = ['game', 'name', 'make', 'cake', 'lake', 'take', 'face', 'five', 'nine', 'white', 'nice', 'write', 'bike', 'time', 'home', 'nose', 'phone'].concat(ME.map(function (x) { return x[1]; }));
  var MESHORT = ['big', 'cat', 'sit', 'hot', 'bus', 'red', 'ten', 'six', 'dog', 'cup'].concat(ME.map(function (x) { return x[0]; }));
  function vowelAt(w) { for (var i = 0; i < w.length; i++) if ('aeiou'.indexOf(w[i]) >= 0) return i; return 0; }
  function magicEx(sh, lg) { // the teacher's two columns: kit | kite
    var v = vowelAt(lg), ex = [];
    if (sh) ex.push({ say: 'כּוֹתְבִים אֶת שְׁתֵּי הַמִּלִּים זוֹ לְיַד זוֹ', big: sh + ' · ' + lg, ltr: true });
    ex.push({ say: 'הָאוֹת e בַּסּוֹף שׁוֹתֶקֶת, וְהָאוֹת ' + lg[v] + ' אוֹמֶרֶת אֶת הַשֵּׁם שֶׁלָּהּ', svg: tiles(lg.split(''), [v, lg.length - 1]) });
    if (sh) ex.push({ say: 'בְּלִי e בַּסּוֹף הַצְּלִיל שֶׁל ' + lg[v] + ' קָצָר', svg: tiles(sh.split(''), vowelAt(sh)) });
    return ex;
  }
  function magicE(r, K) {
    var t = r(), p, w, tip = 'e בְּסוֹף הַמִּלָּה שׁוֹתֶקֶת, וְהַתְּנוּעָה שֶׁלְּפָנֶיהָ אֲרֻכָּה';
    if (t < 0.4) {
      p = K.pick(r, ME); w = p[r() < 0.5 ? 0 : 1];
      return K.q(r, { text: T_WORD, say: w, answer: w, options: [p[0], p[1]], keep: true, optLtr: true, key: 'meS' + w, tip: tip, ex: magicEx(p[0], p[1]) });
    }
    if (t < 0.55) {
      p = K.pick(r, MEPIC);
      var sh = p[0].length < p[1].length ? p[0] : p[1], lg = sh === p[0] ? p[1] : p[0];
      return K.q(r, { text: T_PICWORD, pic: p[2], answer: p[0], options: [sh, lg], keep: true, optLtr: true, key: 'meP' + p[0], tip: tip, ex: magicEx(sh, lg) });
    }
    var isLong = r() < 0.5; w = K.pick(r, isLong ? MELONG : MESHORT);
    return K.q(r, {
      text: 'צְלִיל קָצָר אוֹ צְלִיל אָרֹךְ?', say: w, sayShow: true, answer: isLong ? LONG : SHORT, options: [SHORT, LONG], keep: true, key: 'meG' + w, tip: tip,
      ex: isLong ? magicEx(null, w) : [{ say: 'בַּמִּלָּה הַזֹּאת אֵין e בַּסּוֹף, לָכֵן הַצְּלִיל שֶׁל ' + w[vowelAt(w)] + ' קָצָר', svg: tiles(w.split(''), vowelAt(w)) }]
    });
  }

  // words that do not follow the rules: word, two "by the rules" spellings, a sentence
  var SIGHT = [['the', 'thu', 'tha', 'The dog is big.'], ['you', 'yoo', 'yu', 'I see you.'], ['they', 'thay', 'thei', 'They are happy.'], ['was', 'woz', 'wos', 'It was hot.'], ['said', 'sed', 'sayd', 'She said hello.'], ['of', 'ov', 'uv', 'A cup of tea.'], ['have', 'hav', 'haf', 'I have a cat.'], ['are', 'ar', 'aer', 'We are friends.'], ['come', 'cum', 'kome', 'Come to my house.'], ['who', 'hoo', 'wo', 'Who is this?'], ['one', 'wun', 'oan', 'I have one sister.'], ['two', 'tu', 'tow', 'Two birds can fly.'], ['do', 'doo', 'du', 'Do you like milk?'], ['does', 'duz', 'dos', 'Does he swim?'], ['what', 'wot', 'wat', 'What is this?'], ['where', 'wer', 'whear', 'Where is my bag?'], ['there', 'ther', 'thair', 'There is a book.'], ['friend', 'frend', 'freind', 'Dan is my friend.'], ['your', 'yor', 'yur', 'Is this your pen?'], ['want', 'wunt', 'wahnt', 'I want an apple.'], ['some', 'som', 'sume', 'I want some water.'], ['people', 'peepl', 'pepole', 'Ten people are here.'], ['eye', 'ey', 'iye', 'My eye is brown.'], ['because', 'becoz', 'becuz', 'I am happy because it is sunny.'], ['warm', 'wurm', 'warme', 'It is warm today.'], ['to', 'tu', 'tou', 'I go to school.'], ['is', 'iz', 'izz', 'This is my hat.'], ['here', 'heer', 'hir', 'Come here, please.'], ['many', 'meny', 'menny', 'How many cats?'], ['water', 'woter', 'wotter', 'I drink water.']];
  function sightWords(r, K) {
    var it = K.pick(r, SIGHT), w = it[0], tip = 'יֵשׁ מִלִּים שֶׁלֹּא לְפִי הַכְּלָלִים. מְצַלְּמִים אוֹתָן בָּרֹאשׁ';
    var ex = [
      { say: 'הַמִּלָּה הַזֹּאת לֹא לְפִי הַכְּלָלִים. מְצַלְּמִים אוֹתָהּ בָּרֹאשׁ', svg: tiles([w], 0) },
      { say: 'קוֹרְאִים אוֹתָהּ בְּמִשְׁפָּט', big: it[3], ltr: true }
    ];
    if (r() < 0.55) return K.q(r, { text: T_SPELL, say: w, answer: w, options: [w, it[1], it[2]], optLtr: true, key: 'swC' + w, tip: tip, ex: ex });
    var shown = it[K.ri(r, 0, 2)];
    return K.tf(r, { text: 'כָּךְ כּוֹתְבִים אֶת הַמִּלָּה', say: w, svg: tiles([shown]), key: 'swT' + shown + w, tip: tip, ex: ex }, shown === w);
  }

  // patterns of long vowels; c = the sound class (two patterns of one class are never offered together)
  var PAT = [
    { p: 'ee', c: 'E', w: ['green', 'three', 'tree', 'meet', 'see', 'need', 'week', 'street', 'sleep'] },
    { p: 'ea', c: 'E', w: ['eat', 'sea', 'meat', 'clean', 'teacher'] },
    { p: 'ay', c: 'A', w: ['play', 'day', 'say', 'Sunday', 'Monday', 'okay'] },
    { p: 'ai', c: 'A', w: ['rain', 'train', 'snail', 'paint'] },
    { p: 'oa', c: 'O', w: ['boat', 'coat', 'road', 'soap'] },
    { p: 'oo', c: 'U', w: ['school', 'cool', 'pool', 'boots', 'food', 'zoo', 'noon', 'book', 'look', 'good', 'foot', 'wood'] },
    { p: 'ou', c: 'W', w: ['house', 'mouse', 'mouth', 'cloud', 'out', 'round'] },
    { p: 'ow', c: 'W', w: ['town', 'brown', 'now', 'how', 'cow', 'down'] },
    { p: 'ar', c: 'R', w: ['car', 'park', 'star', 'farm', 'arm', 'art', 'garden'] },
    { p: 'er', c: 'S', w: ['sister', 'brother', 'water', 'winter'] },
    { p: 'ir', c: 'S', w: ['bird', 'girl', 'shirt', 'dirty', 'birthday'] }
  ];
  var PATALL = [];
  PAT.forEach(function (x) { x.w.forEach(function (w) { PATALL.push({ w: w, x: x }); }); });
  var OOLONG = ['school', 'cool', 'pool', 'boots', 'food', 'too', 'zoo', 'noon'], OOSHORT = ['book', 'look', 'good', 'foot', 'wood'];
  var YE = ['sunny', 'funny', 'happy', 'family', 'hungry'], YI = ['fly', 'sky', 'my', 'try', 'why', 'by'];
  var CSOFT = ['face', 'nice', 'ice', 'city', 'pencil'], CHARD = ['cat', 'car', 'cup', 'cow', 'cake', 'cold', 'coat', 'clean', 'cloud', 'cool', 'computer'];
  var FAMSP = [['knife', 'nife', 'kife', 'kn'], ['know', 'kno', 'nowe', 'kn'], ['knee', 'nee', 'kee', 'kn'], ['apple', 'appel', 'appl', 'le'], ['table', 'tabel', 'tabl', 'le'], ['little', 'littel', 'littl', 'le'], ['turtle', 'turtel', 'turtl', 'le'], ['purple', 'purpel', 'purpl', 'le'], ['ball', 'bol', 'bal', 'all'], ['tall', 'tol', 'tal', 'all'], ['small', 'smol', 'smal', 'all'], ['wall', 'wol', 'wal', 'all']];
  var FAMSAY = { kn: 'בַּצֵּרוּף kn הָאוֹת k שׁוֹתֶקֶת', le: 'בְּסוֹף הַמִּלָּה כּוֹתְבִים le', all: 'זוֹ מִשְׁפַּחַת הַמִּלִּים שֶׁל all' };
  var YSAY_E = 'כְּמוֹ הַשֵּׁם שֶׁל e', YSAY_I = 'כְּמוֹ הַשֵּׁם שֶׁל i', CS = 'כְּמוֹ s', CK = 'כְּמוֹ k';
  function longVowels(r, K) {
    var t = r(), w, c, isL;
    if (t < 0.5) {
      var it = K.pick(r, PATALL), x = it.x, seen = {}, wrong = [];
      w = it.w; seen[x.c] = 1;
      K.shuffle(r, PAT).forEach(function (y) { if (wrong.length < 3 && !seen[y.c]) { seen[y.c] = 1; wrong.push(y.p); } });
      c = cut(w, x.p);
      return K.q(r, {
        text: 'מָה חָסֵר בַּמִּלָּה?', say: w, svg: tiles(cut(w, x.p, true).p), answer: x.p, options: [x.p].concat(wrong), optLtr: true, key: 'lvM' + w,
        tip: 'שְׁתֵּי אוֹתִיּוֹת יַחַד, צְלִיל אֶחָד',
        ex: [
          { say: 'שְׁתֵּי הָאוֹתִיּוֹת ' + x.p + ' יַחַד הֵן צְלִיל אֶחָד', svg: tiles(c.p, c.hi) },
          { say: 'עוֹד מִלִּים מֵאוֹתָהּ מִשְׁפָּחָה', big: K.sample(r, x.w.filter(function (y) { return y !== w; }), 3).join(' · '), ltr: true }
        ]
      });
    }
    if (t < 0.62) {
      isL = r() < 0.5; w = K.pick(r, isL ? OOLONG : OOSHORT); c = cut(w, 'oo');
      return K.q(r, {
        text: 'צְלִיל קָצָר אוֹ צְלִיל אָרֹךְ?', say: w, sayShow: true, answer: isL ? LONG : SHORT, options: [SHORT, LONG], keep: true, key: 'lvO' + w,
        tip: 'לַצֵּרוּף oo יֵשׁ שְׁנֵי צְלִילִים: קָצָר וְאָרֹךְ',
        ex: [
          { say: 'לַצֵּרוּף oo יֵשׁ שְׁנֵי צְלִילִים: קָצָר וְאָרֹךְ', big: 'book · zoo', ltr: true },
          { say: 'בַּמִּלָּה הַזֹּאת הַצְּלִיל ' + (isL ? LONG : SHORT), svg: tiles(c.p, c.hi) },
          { say: 'עוֹד מִלִּים כָּאֵלֶּה', big: (isL ? OOLONG : OOSHORT).filter(function (y) { return y !== w; }).slice(0, 3).join(' · '), ltr: true }
        ]
      });
    }
    if (t < 0.74) {
      isL = r() < 0.5; w = K.pick(r, isL ? YE : YI);
      return K.q(r, {
        text: 'אֵיךְ נִשְׁמַעַת הָאוֹת y בְּסוֹף הַמִּלָּה?', say: w, sayShow: true, answer: isL ? YSAY_E : YSAY_I, options: [YSAY_E, YSAY_I], keep: true, key: 'lvY' + w,
        tip: 'בְּמִלָּה קְצָרָה כְּמוֹ my הָאוֹת y נִשְׁמַעַת i. בְּמִלָּה אֲרֻכָּה כְּמוֹ happy הִיא נִשְׁמַעַת e',
        ex: [
          { say: 'הָאוֹת y בְּסוֹף מִלָּה קְצָרָה נִשְׁמַעַת כְּמוֹ הַשֵּׁם שֶׁל i', big: 'fly · sky · my', ltr: true },
          { say: 'הָאוֹת y בְּסוֹף מִלָּה אֲרֻכָּה נִשְׁמַעַת כְּמוֹ הַשֵּׁם שֶׁל e', big: 'sunny · happy · family', ltr: true },
          { say: 'זוֹ הַמִּלָּה שֶׁלָּנוּ', svg: tiles([w.slice(0, -1), 'y'], 1) }
        ]
      });
    }
    if (t < 0.87) {
      isL = r() < 0.4; w = K.pick(r, isL ? CSOFT : CHARD); c = cut(w, 'c');
      return K.q(r, {
        text: 'אֵיךְ נִשְׁמַעַת הָאוֹת c בַּמִּלָּה?', say: w, sayShow: true, answer: isL ? CS : CK, options: [CS, CK], keep: true, key: 'lvC' + w,
        tip: 'לִפְנֵי e, i אוֹ y הָאוֹת c רַכָּה',
        ex: [
          { say: 'לִפְנֵי e, i אוֹ y הָאוֹת c רַכָּה, נִשְׁמַעַת כְּמוֹ s', big: 'face · city · pencil', ltr: true },
          { say: 'בִּשְׁאָר הַמִּלִּים הִיא נִשְׁמַעַת כְּמוֹ k', big: 'cat · cup · cow', ltr: true },
          { say: 'זוֹ הַמִּלָּה שֶׁלָּנוּ', svg: tiles(c.p, c.hi) }
        ]
      });
    }
    var f = K.pick(r, FAMSP); c = cut(f[0], f[3]);
    return K.q(r, {
      text: T_SPELL, say: f[0], answer: f[0], options: [f[0], f[1], f[2]], optLtr: true, key: 'lvF' + f[0], tip: FAMSAY[f[3]],
      ex: [
        { say: FAMSAY[f[3]], svg: tiles(c.p, c.hi) },
        { say: 'עוֹד מִלִּים מֵאוֹתָהּ מִשְׁפָּחָה', big: FAMSP.filter(function (y) { return y[3] === f[3] && y !== f; }).map(function (y) { return y[0]; }).slice(0, 3).join(' · '), ltr: true }
      ]
    });
  }

  // =====================================================================================
  // World 3: vocabulary (flashcards: picture, word, sound)
  // =====================================================================================
  function sA(w) { return 'This is ' + an(w) + ' ' + w + '.'; }
  function sU(w) { return 'This is ' + w + '.'; }
  function sP(w) { return 'These are ' + w + '.'; }
  function sMy(w) { return 'This is my ' + w + '.'; }
  function sIt(w) { return 'It is ' + w + '.'; }
  function sCan(w) { return 'I can ' + w + '.'; }
  function sAm(w) { return 'I am ' + w + '.'; }
  function mk(cat, sent, list) {
    return list.map(function (x) { return { w: x[0], e: typeof x[1] === 'string' ? x[1] : null, s: typeof x[1] === 'function' ? x[1] : null, c: cat, t: (x[2] || sent)(x[0]) }; });
  }
  function pq(o, it) { if (it.s) o.svg = it.s(130); else o.pic = it.e; return o; }
  function card(it, withSentence) {
    var a = { say: 'מִסְתַּכְּלִים בַּתְּמוּנָה וְאוֹמְרִים אֶת הַמִּלָּה' }, ex;
    if (it.s) a.svg = it.s(150); else { a.big = it.e + ' ' + it.w; a.ltr = true; }
    ex = [a, { say: 'כָּךְ כּוֹתְבִים אֶת הַמִּלָּה', svg: tiles([it.w]) }];
    if (withSentence) ex.push({ say: 'זֶה הַמִּשְׁפָּט הַנָּכוֹן לַתְּמוּנָה', big: it.t, ltr: true });
    return ex;
  }
  // pictures that could honestly be read as both words: never offered against each other
  var CLASH = [['mother', 'sister'], ['father', 'brother'], ['baby', 'brother'], ['baby', 'sister'], ['face', 'eye'], ['face', 'nose'], ['face', 'mouth'], ['hand', 'arm'], ['leg', 'foot'], ['shoe', 'boots'], ['rainy', 'cloud'], ['eat', 'cook'], ['run', 'walk']];
  function clash(a, b) { return CLASH.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
  function vocab(r, K, bank) {
    var it = K.pick(r, bank), same = bank.filter(function (x) { return x.c === it.c && x !== it && !clash(x.w, it.w); }), t = r(), os;
    if (t < 0.38) {
      return K.q(r, pq({ text: T_PICWORD, answer: it.w, options: K.opts(r, it.w, same.map(function (x) { return x.w; }), 4), optLtr: true, key: 'vI' + it.w, tip: 'קוֹרְאִים כָּל מִלָּה לְאַט, מֵהָאוֹת הָרִאשׁוֹנָה', ex: card(it) }, it));
    }
    if (t < 0.72) {
      var oh = {};
      os = [it].concat(K.sample(r, same, 3));
      os.forEach(function (x) { oh[x.w] = x.s ? x.s(80) : em(x.e); });
      return K.q(r, { text: T_WORDPIC, say: it.w, answer: it.w, options: os.map(function (x) { return x.w; }), optHtml: oh, key: 'vJ' + it.w, tip: 'מַקְשִׁיבִים לַמִּלָּה וּמְחַפְּשִׂים אֶת הַתְּמוּנָה', ex: card(it) });
    }
    var truth = r() < 0.5, other = truth ? it : K.pick(r, same);
    return K.tf(r, pq({ text: '', say: other.t, sayShow: true, key: 'vM' + it.w + '|' + other.w, tip: 'קוֹרְאִים אֶת הַמִּשְׁפָּט וּבוֹדְקִים מוּל הַתְּמוּנָה', ex: card(it, true) }, it), truth);
  }

  var COLORS = mk('col', sIt, [['red', dot('#e53935')], ['blue', dot('#2f6fe0')], ['green', dot('#3ec46d')], ['yellow', dot('#ffd21f')], ['orange', dot('#ff8a1f')], ['brown', dot('#8a5a2b')], ['black', dot('#222222')], ['white', dot('#ffffff')], ['purple', dot('#8e3fd6')], ['pink', dot('#ff8fc0')], ['gray', dot('#9a9a9a')]]);
  var NW = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred' };
  var NS = Object.keys(NW).map(Number);
  function numWrong(r, K, n) { // typical mix-ups first: thirteen / thirty / three, twelve / twenty, neighbours
    var c = [], out = [];
    if (n >= 13 && n <= 19) c.push((n - 10) * 10, n - 10);
    if (n >= 30 && n <= 90) c.push(n / 10 + 10, n / 10);
    if (n === 12) c.push(20); if (n === 20) c.push(12);
    c.push(n + 1, n - 1, n + 10, n - 10, n + 2);
    c.concat(K.shuffle(r, NS)).forEach(function (x) { if (out.length < 3 && NW[x] && x !== n && out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  function colorsNumbers(r, K) {
    if (r() < 0.4) return vocab(r, K, COLORS);
    var n = K.pick(r, NS), wrong = numWrong(r, K, n);
    var ex = [{ say: 'זֶה הַמִּסְפָּר, וְכָךְ כּוֹתְבִים אוֹתוֹ בְּמִלִּים', big: n + ' · ' + NW[n], ltr: true }];
    if (n >= 13 && n !== 20 && n !== 100) ex.push({ say: 'בַּסּוֹף teen: מֵעַל עֶשֶׂר. בַּסּוֹף ty: עֲשָׂרוֹת', big: '13 thirteen · 30 thirty', ltr: true });
    if (r() < 0.5) return K.q(r, { text: 'אֵיזוֹ מִלָּה מַתְאִימָה לַמִּסְפָּר?', svg: tiles([String(n)]), answer: NW[n], options: [NW[n]].concat(wrong.map(function (x) { return NW[x]; })), optLtr: true, key: 'nW' + n, tip: 'סוֹפְרִים בְּאַנְגְּלִית עַד שֶׁמַּגִּיעִים לַמִּסְפָּר', ex: ex });
    return K.q(r, { text: 'אֵיזֶה מִסְפָּר זֶה?', say: NW[n], answer: n, options: [n].concat(wrong), key: 'nN' + n, tip: 'מַקְשִׁיבִים לְסוֹף הַמִּלָּה: teen אוֹ ty', ex: ex });
  }

  var SCHOOL = mk('sch', sA, [['book', '📖'], ['pencil', '✏️'], ['pen', '🖊️'], ['bag', '🎒'], ['chair', '🪑'], ['paper', '📄', sU], ['computer', '💻'], ['clock', '🕒'], ['door', '🚪'], ['window', '🪟'], ['school', '🏫'], ['desk', deskSvg], ['board', boardSvg], ['ruler', '📏'], ['scissors', '✂️', sP]])
    .concat(mk('fam', sMy, [['mother', '👩'], ['father', '👨'], ['sister', '👧'], ['brother', '👦'], ['baby', '👶', sA], ['grandmother', '👵'], ['grandfather', '👴'], ['family', '👪']]));
  var BODY = mk('body', sA, [['eye', '👁️'], ['ear', '👂'], ['nose', '👃'], ['mouth', '👄'], ['hand', '✋'], ['leg', '🦵'], ['foot', '🦶'], ['arm', '💪'], ['tooth', '🦷'], ['face', '🙂']])
    .concat(mk('clo', sA, [['shirt', '👕'], ['pants', '👖', sP], ['dress', '👗'], ['shoe', '👟'], ['socks', '🧦', sP], ['hat', '🎩'], ['coat', '🧥'], ['boots', '🥾', sP], ['swimsuit', '🩱'], ['scarf', '🧣'], ['gloves', '🧤', sP], ['glasses', '👓', sP]]));
  var FOOD = mk('food', sA, [['apple', '🍎'], ['banana', '🍌'], ['orange', '🍊'], ['bread', '🍞', sU], ['cheese', '🧀', sU], ['egg', '🥚'], ['milk', '🥛', sU], ['water', '💧', sU], ['cake', '🎂'], ['pizza', '🍕'], ['chicken', '🍗', sU], ['juice', '🧃', sU], ['tomato', '🍅'], ['potato', '🥔'], ['chocolate', '🍫', sU], ['ice cream', '🍦', sU]])
    .concat(mk('ani', sA, [['cat', '🐱'], ['dog', '🐶'], ['bird', '🐦'], ['fish', '🐟'], ['horse', '🐴'], ['cow', '🐮'], ['sheep', '🐑'], ['monkey', '🐒'], ['mouse', '🐭'], ['elephant', '🐘'], ['lion', '🦁'], ['turtle', '🐢'], ['bear', '🐻'], ['bee', '🐝'], ['penguin', '🐧']]));
  var WEATHER = mk('wea', sIt, [['sunny', '☀️'], ['rainy', '🌧️'], ['windy', '🌬️'], ['cloud', '☁️', sA], ['snow', '❄️', sU]])
    .concat(mk('sea', sIt, [['spring', '🌷'], ['summer', '🏖️'], ['autumn', '🍂'], ['winter', '⛄']]));
  var VERBS = mk('verb', sCan, [['run', '🏃'], ['swim', '🏊'], ['walk', '🚶'], ['read', '📖'], ['write', '✍️'], ['eat', '🍽️'], ['drink', '🥤'], ['sleep', '😴'], ['sing', '🎤'], ['dance', '💃'], ['draw', '🎨'], ['ride', '🚴'], ['climb', '🧗'], ['cook', '🍳'], ['fly', '✈️'], ['wash', '🧼'], ['play', '⚽']])
    .concat(mk('feel', sAm, [['happy', '😀'], ['sad', '😢'], ['angry', '😠'], ['scared', '😨'], ['sick', '🤒'], ['tired', '🥱']]));

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var HW = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  function timeOf(h, half) { return half ? 'half past ' + HW[h] : HW[h] + " o'clock"; }
  function daysWeatherClock(r, K) {
    var t = r(), i, d;
    if (t < 0.22) {
      i = K.ri(r, 0, 6); var after = r() < 0.5; d = DAYS[(i + (after ? 1 : 6)) % 7];
      return K.q(r, {
        text: (after ? 'אֵיזֶה יוֹם בָּא אַחֲרֵי ' : 'אֵיזֶה יוֹם בָּא לִפְנֵי ') + DAYS[i] + '?', answer: d, options: K.opts(r, d, DAYS.filter(function (x) { return x !== DAYS[i]; }), 4), optLtr: true, key: 'day' + i + after,
        tip: 'אוֹמְרִים אֶת יְמֵי הַשָּׁבוּעַ לְפִי הַסֵּדֶר, מִיּוֹם רִאשׁוֹן',
        ex: [
          { say: 'אוֹמְרִים אֶת יְמֵי הַשָּׁבוּעַ לְפִי הַסֵּדֶר', big: after ? DAYS[i] + ' → ' + d : d + ' → ' + DAYS[i], ltr: true },
          { say: after ? 'הַיּוֹם שֶׁבָּא אַחֲרֵי הוּא ' + d : 'הַיּוֹם שֶׁבָּא לִפְנֵי הוּא ' + d }
        ]
      });
    }
    if (t < 0.34) {
      var n = K.ri(r, 3, 4), ps; i = K.ri(r, 0, 7 - n); ps = DAYS.slice(i, i + n);
      return K.q(r, {
        fmt: 'order', text: 'מְסַדְּרִים אֶת הַיָּמִים לְפִי הַסֵּדֶר', parts: ps, sep: ' ', answer: ps.join(' '), ltr: true, key: 'dayO' + i + n,
        tip: 'אוֹמְרִים אֶת יְמֵי הַשָּׁבוּעַ לְפִי הַסֵּדֶר, מִיּוֹם רִאשׁוֹן',
        ex: [
          { say: 'הַשָּׁבוּעַ מַתְחִיל בְּיוֹם רִאשׁוֹן', big: 'Sunday → Monday → Tuesday', ltr: true },
          { say: 'אֵלֶּה הַיָּמִים שֶׁלָּנוּ לְפִי הַסֵּדֶר', big: ps.join(' → '), ltr: true }
        ]
      });
    }
    if (t < 0.56) return vocab(r, K, WEATHER);
    var h = K.ri(r, 1, 12), half = r() < 0.5, h2 = h % 12 + 1, me = h + '|' + half, sent = "It's " + timeOf(h, half) + '.';
    var all = [[h, half], [h, !half], [h2, half], [h2, !half]];
    var ex = [
      { say: 'הַמָּחוֹג הַקָּצָר מַרְאֶה אֶת הַשָּׁעָה', svg: clockSvg(h, half, 150) },
      { say: half ? 'הַמָּחוֹג הָאָרֹךְ עַל 6: זוֹ חֲצִי שָׁעָה, half past' : 'הַמָּחוֹג הָאָרֹךְ עַל 12: זוֹ שָׁעָה שְׁלֵמָה' },
      { say: 'אוֹמְרִים כָּךְ', big: sent, ltr: true }
    ], tip = 'מָחוֹג אָרֹךְ עַל 12: o\'clock. מָחוֹג אָרֹךְ עַל 6: half past';
    if (r() < 0.5) return K.q(r, { text: 'מָה הַשָּׁעָה?', svg: clockSvg(h, half, 130), answer: timeOf(h, half), options: all.map(function (x) { return timeOf(x[0], x[1]); }), optLtr: true, key: 'clkW' + me, tip: tip, ex: ex });
    var oh = {};
    all.forEach(function (x) { oh[x[0] + '|' + x[1]] = clockSvg(x[0], x[1], 80); });
    return K.q(r, { text: 'אֵיזֶה שָׁעוֹן מַתְאִים?', say: sent, sayShow: true, answer: me, options: all.map(function (x) { return x[0] + '|' + x[1]; }), optHtml: oh, key: 'clkP' + me, tip: tip, ex: ex });
  }

  var OPP = [['big', 'small'], ['hot', 'cold'], ['happy', 'sad'], ['new', 'old'], ['young', 'old'], ['fast', 'slow'], ['good', 'bad'], ['clean', 'dirty'], ['tall', 'short'], ['open', 'close']];
  var OPPQ = [];
  OPP.forEach(function (p) { OPPQ.push([p[0], p[1]]); if (p[1] !== 'old') OPPQ.push([p[1], p[0]]); });
  var OPPW = ['big', 'small', 'hot', 'cold', 'happy', 'sad', 'new', 'old', 'young', 'fast', 'slow', 'good', 'bad', 'clean', 'dirty', 'tall', 'short', 'open', 'close'];
  function verbsOpposites(r, K) {
    if (r() < 0.68) return vocab(r, K, VERBS);
    var p = K.pick(r, OPPQ);
    return K.q(r, {
      text: 'מָה הַהֶפֶךְ?', say: p[0], sayShow: true, answer: p[1], options: K.opts(r, p[1], OPPW.filter(function (x) { return x !== p[0] && x !== p[1]; }), 4), optLtr: true, key: 'opp' + p[0],
      tip: 'הֶפֶךְ: כְּמוֹ גָּדוֹל וְקָטָן, חַם וְקַר',
      ex: [{ say: 'שְׁתֵּי הַמִּלִּים הָאֵלֶּה הֵן הֲפָכִים', big: p[0] + ' ↔ ' + p[1], ltr: true }]
    });
  }

  // =====================================================================================
  // World 4: sentences and conversation
  // =====================================================================================
  // g = the group (answers of one group are never offered against each other), k: 'wh' | 'yn' | 'soc'
  var G_WHERE = 'הַמִּלָּה Where שׁוֹאֶלֶת: אֵיפֹה?', G_THIS = 'הַמִּלָּה What שׁוֹאֶלֶת: מָה? הַמִּלָּה Who שׁוֹאֶלֶת: מִי?', G_YN = 'עַל שְׁאֵלָה כָּזֹאת עוֹנִים Yes אוֹ No', G_SOC = 'אֵלֶּה מִלִּים שֶׁל נִימוּס. לוֹמְדִים אוֹתָן יַחַד', G_FEEL = 'שׁוֹאֲלִים עַל הַהַרְגָּשָׁה', G_FAV = 'הַמִּלָּה favorite: הֲכִי אָהוּב';
  var QA = [];
  function qa(k, g, tip, list) { list.forEach(function (x) { QA.push({ k: k, g: g, tip: tip, q: x[0], a: x[1] }); }); }
  qa('wh', 'name', 'הַמִּלָּה name: שֵׁם', [["What's your name?", 'My name is Dana.'], ["What's your name?", 'My name is Tom.'], ["What's your name?", 'My name is Noa.']]);
  qa('wh', 'age', 'הַמִּלִּים How old שׁוֹאֲלוֹת עַל הַגִּיל', [['How old are you?', "I'm nine years old."], ['How old are you?', "I'm ten years old."], ['How old are you?', "I'm eight years old."]]);
  qa('wh', 'live', G_WHERE, [['Where do you live?', 'I live in Haifa.'], ['Where do you live?', 'I live in Eilat.'], ['Where do you live?', 'I live in Tel Aviv.']]);
  qa('wh', 'feel', G_FEEL, [['How are you?', "I'm fine, thank you."], ['How do you feel?', 'I feel sick.'], ['How do you feel?', 'I feel happy.'], ['How do you feel?', 'I feel tired.']]);
  qa('wh', 'this', G_THIS, [["What's this?", "It's a pen."], ["What's this?", "It's a book."], ["What's this?", "It's an apple."], ['Who is this?', 'This is my sister.'], ['Who is this?', 'This is my brother.'], ['Who is this?', 'This is my mother.']]);
  qa('wh', 'color', 'הַמִּלִּים What color שׁוֹאֲלוֹת עַל הַצֶּבַע', [['What color is your bag?', 'My bag is blue.'], ['What color is your bag?', 'My bag is red.'], ['What color is your bag?', 'My bag is green.']]);
  qa('wh', 'weather', 'הַמִּלָּה weather: מֶזֶג אֲוִיר', [["What's the weather today?", 'Today is sunny.'], ["What's the weather today?", 'Today is rainy.'], ["What's the weather today?", 'Today is hot.']]);
  qa('wh', 'time', 'הַמִּלִּים What time שׁוֹאֲלוֹת עַל הַשָּׁעָה', [['What time is it?', "It's five o'clock."], ['What time is it?', "It's two o'clock."], ['What time is it?', "It's half past seven."]]);
  qa('wh', 'fav', G_FAV, [["What's your favorite color?", 'My favorite color is red.'], ["What's your favorite food?", 'My favorite food is pizza.'], ["What's your favorite animal?", 'My favorite animal is the horse.']]);
  qa('wh', 'many', 'הַמִּלִּים How many שׁוֹאֲלוֹת: כַּמָּה?', [['How many apples?', 'Three apples.'], ['How many cats?', 'Two cats.'], ['How many books?', 'Five books.']]);
  qa('wh', 'where', G_WHERE, [['Where is the cat?', "It's under the table."], ['Where is the dog?', "It's on the bed."], ['Where is the ball?', "It's in the box."]]);
  qa('wh', 'good', 'הַמִּלִּים good at: טוֹב בְּמַשֶּׁהוּ', [['What are you good at?', "I'm good at football."], ['What are you good at?', "I'm good at math."], ['What are you good at?', "I'm good at art."]]);
  qa('yn', 'yn', G_YN, [['Do you have a dog?', 'Yes, I do.'], ['Do you like pizza?', "No, I don't."], ['Can you swim?', 'Yes, I can.'], ['Can you ride a bike?', "No, I can't."], ['Are you ready?', "Yes, I'm ready."], ['Do you want an apple?', 'Yes, please.'], ['Are you hungry?', 'Yes, I am.']]);
  qa('soc', 'soc', G_SOC, [['Thank you!', "You're welcome."], ['Happy birthday!', 'Thank you!'], ["Let's play!", 'Good idea!'], ["I'm sorry.", 'No problem!'], ['See you later!', 'Bye!'], ['Nice to meet you.', 'Nice to meet you too.']]);
  var QAWH = QA.filter(function (x) { return x.k === 'wh'; }), QAYN = QA.filter(function (x) { return x.k === 'yn'; });
  function otherGroups(r, K, it, field, n, plusYn) { // n texts of other groups, one per group
    var seen = {}, out = [];
    seen[it.g] = 1;
    K.shuffle(r, plusYn ? QAWH.concat(K.sample(r, QAYN, 2)) : QAWH).forEach(function (x) { if (out.length < n && !seen[x.g] && out.indexOf(x[field]) < 0 && x[field] !== it[field]) { seen[x.g] = 1; out.push(x[field]); } });
    return out;
  }
  function questionAnswer(r, K) {
    var rev = r() < 0.35, it = K.pick(r, rev ? QAWH : QA);
    var ex = [
      { say: it.tip, big: it.q, ltr: true },
      { say: 'זוֹ הַתְּשׁוּבָה הַמַּתְאִימָה לַשְּׁאֵלָה', big: it.a, ltr: true }
    ];
    if (rev) return K.q(r, { text: 'מָה הַשְּׁאֵלָה לַתְּשׁוּבָה הַזֹּאת?', say: it.a, sayShow: true, answer: it.q, options: [it.q].concat(otherGroups(r, K, it, 'q', 2, false)), optLtr: true, key: 'qaR' + it.a, tip: it.tip, ex: ex });
    return K.q(r, { text: 'מָה הַתְּשׁוּבָה לַשְּׁאֵלָה?', say: it.q, sayShow: true, answer: it.a, options: [it.a].concat(otherGroups(r, K, it, 'a', 2, it.k === 'wh')), optLtr: true, key: 'qaF' + it.q + it.a, tip: it.tip, ex: ex });
  }

  var THINGS = [['dog', '🐶'], ['cat', '🐱'], ['bird', '🐦'], ['fish', '🐟'], ['horse', '🐴'], ['cow', '🐮'], ['apple', '🍎'], ['banana', '🍌'], ['egg', '🥚'], ['orange', '🍊'], ['book', '📖'], ['pen', '🖊️'], ['chair', '🪑'], ['door', '🚪'], ['hat', '🎩'], ['shoe', '👟'], ['car', '🚗'], ['bus', '🚌'], ['tree', '🌳'], ['ball', '⚽'], ['umbrella', '☂️'], ['elephant', '🐘']];
  var COUNT = [['apple', '🍎'], ['banana', '🍌'], ['cat', '🐱'], ['dog', '🐶'], ['bird', '🐦'], ['book', '📕'], ['ball', '⚽'], ['egg', '🥚'], ['star', '⭐'], ['flower', '🌸'], ['car', '🚗']];
  function rep(e, n) { var s = ''; while (n-- > 0) s += e; return s; }
  function thereIs(it, n) { return n === 1 ? 'There is one ' + it[0] + '.' : 'There are ' + NW[n] + ' ' + it[0] + 's.'; }
  var SENT = [
    ['It is rainy.', '🌧️', 'w'], ['It is sunny.', '☀️', 'w'], ['It is windy.', '🌬️', 'w'], ['It is winter.', '⛄', 'w'],
    ['She is happy.', '😀', 'f'], ['He is sad.', '😢', 'f'], ['He is angry.', '😠', 'f'], ['She is sick.', '🤒', 'f'], ['She is scared.', '😨', 'f'], ['He is tired.', '🥱', 'f'], ['She is hot.', '🥵', 'f'], ['He is cold.', '🥶', 'f'],
    ['She can swim.', '🏊', 'c'], ['He can ride a bike.', '🚴', 'c'], ['She can sing.', '🎤', 'c'], ['She can dance.', '💃', 'c'], ['He can cook.', '🍳', 'c'], ['She can draw.', '🎨', 'c'], ['He can run.', '🏃', 'c'], ['She can climb.', '🧗', 'c'],
    ['The elephant is big.', '🐘', 'a'], ['The mouse is small.', '🐭', 'a'], ['The bird can fly.', '🐦', 'a'], ['The fish can swim.', '🐟', 'a'], ['The monkey can climb.', '🐒', 'a'], ['The horse can run.', '🐴', 'a']
  ];
  var PREPS = { box: ['in', 'on', 'next to', 'behind'], table: ['on', 'under', 'next to'] };
  var PREPHE = { 'in': 'בְּתוֹךְ', 'on': 'עַל', 'under': 'מִתַּחַת', 'next to': 'לְיַד', 'behind': 'מֵאֲחוֹרֵי' };
  var COLHE = { red: 'אָדֹם', blue: 'כָּחֹל', green: 'יָרֹק', yellow: 'צָהֹב' };
  function prepSent(f, p, c) { return 'The ' + c + ' ball is ' + p + ' the ' + f + '.'; }
  function sentencePicture(r, K) {
    var t = r(), tipRead = 'קוֹרְאִים אֶת הַמִּשְׁפָּט לְאַט, מִלָּה אַחַר מִלָּה', oh = {}, it, truth, os;
    if (t < 0.18) {
      it = K.pick(r, THINGS); os = [it].concat(K.sample(r, THINGS.filter(function (x) { return x !== it; }), 2));
      os.forEach(function (x) { oh[x[0]] = em(x[1]); });
      return K.q(r, {
        text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּשְׁפָּט?', say: sA(it[0]), sayShow: true, answer: it[0], options: os.map(function (x) { return x[0]; }), optHtml: oh, key: 'spA' + it[0], tip: tipRead,
        ex: [{ say: 'קוֹרְאִים אֶת הַמִּשְׁפָּט לְאַט', big: sA(it[0]), ltr: true }, { say: 'הַמִּלָּה הַחֲשׁוּבָה בַּמִּשְׁפָּט', big: it[1] + ' ' + it[0], ltr: true }]
      });
    }
    if (t < 0.4) {
      it = K.pick(r, COUNT); var n = K.ri(r, 1, 5), m;
      var exC = [
        { say: 'סוֹפְרִים אֶת הַתְּמוּנוֹת', big: rep(it[1], n), ltr: true },
        { say: 'אֶחָד: There is. יוֹתֵר מֵאֶחָד: There are', big: thereIs(it, n), ltr: true }
      ], tipC = 'סוֹפְרִים, וּמְחַפְּשִׂים אֶת הַמִּסְפָּר בַּמִּשְׁפָּט';
      if (n <= 3 && r() < 0.5) {
        var other = K.pick(r, COUNT.filter(function (x) { return x !== it; })), n2 = n % 3 + 1;
        oh.a = em(rep(it[1], n)); oh.b = em(rep(it[1], n2)); oh.c = em(rep(other[1], n));
        return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּשְׁפָּט?', say: thereIs(it, n), sayShow: true, answer: 'a', options: ['a', 'b', 'c'], optHtml: oh, key: 'spN' + it[0] + n, tip: tipC, ex: exC });
      }
      truth = r() < 0.5; m = truth ? n : n === 1 ? 2 : n === 5 ? 4 : n + (r() < 0.5 ? 1 : -1);
      return K.tf(r, { text: '', pic: rep(it[1], n), say: thereIs(it, m), sayShow: true, key: 'spT' + it[0] + n + '|' + m, tip: tipC, ex: exC }, truth);
    }
    if (t < 0.7) {
      var f = r() < 0.55 ? 'box' : 'table', p = K.pick(r, PREPS[f]), c = K.pick(r, Object.keys(BALL));
      var p2 = K.pick(r, PREPS[f].filter(function (x) { return x !== p; })), c2 = K.pick(r, Object.keys(BALL).filter(function (x) { return x !== c; }));
      var exP = [
        { say: 'קוֹרְאִים אֶת הַמִּשְׁפָּט לְאַט', big: prepSent(f, p, c), ltr: true },
        { say: 'הַמִּלָּה ' + c + ': ' + COLHE[c] + '. הַמִּלָּה ' + p + ': ' + PREPHE[p], svg: scene(f, p, c, 200) }
      ], tipP = 'in: בְּתוֹךְ. on: עַל. under: מִתַּחַת. next to: לְיַד. behind: מֵאֲחוֹרֵי';
      if (r() < 0.6) {
        oh.a = scene(f, p, c, 96); oh.b = scene(f, p2, c, 96); oh.c = scene(f, p, c2, 96);
        return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּשְׁפָּט?', say: prepSent(f, p, c), sayShow: true, answer: 'a', options: ['a', 'b', 'c'], optHtml: oh, key: 'spP' + f + p + c + p2 + c2, tip: tipP, ex: exP });
      }
      truth = r() < 0.5; var wrongPrep = r() < 0.6, sp = truth ? prepSent(f, p, c) : wrongPrep ? prepSent(f, p2, c) : prepSent(f, p, c2);
      return K.tf(r, { text: '', svg: scene(f, p, c, 170), say: sp, sayShow: true, key: 'spQ' + f + p + c + '|' + sp, tip: tipP, ex: exP }, truth);
    }
    it = K.pick(r, SENT);
    var same = SENT.filter(function (x) { return x[2] === it[2] && x !== it; });
    var exS = [{ say: 'קוֹרְאִים אֶת הַמִּשְׁפָּט לְאַט', big: it[0], ltr: true }, { say: 'זוֹ הַתְּמוּנָה שֶׁמַּתְאִימָה לַמִּשְׁפָּט', big: it[1] + ' ' + it[0], ltr: true }];
    if (r() < 0.55) {
      os = [it].concat(K.sample(r, same, 2));
      os.forEach(function (x) { oh[x[0]] = em(x[1]); });
      return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּשְׁפָּט?', say: it[0], sayShow: true, answer: it[0], options: os.map(function (x) { return x[0]; }), optHtml: oh, key: 'spS' + it[0], tip: tipRead, ex: exS });
    }
    truth = r() < 0.5; var shown = truth ? it : K.pick(r, same);
    return K.tf(r, { text: '', pic: it[1], say: shown[0], sayShow: true, key: 'spU' + it[0] + '|' + shown[0], tip: 'קוֹרְאִים אֶת הַמִּשְׁפָּט וּבוֹדְקִים מוּל הַתְּמוּנָה', ex: exS }, truth);
  }

  // sentence frames: the tiles, the word lists of the slots, the rule shown after a mistake
  var R_ADJ = 'בְּאַנְגְּלִית שֵׁם הַתֹּאַר בָּא לִפְנֵי שֵׁם הָעֶצֶם', R_Q = 'בִּשְׁאֵלָה מִלַּת הַשְּׁאֵלָה בָּאָה רִאשׁוֹנָה, וּבַסּוֹף סִימַן שְׁאֵלָה', R_GEN = 'הַמִּשְׁפָּט נִגְמָר בַּמִּלָּה שֶׁיֵּשׁ אַחֲרֶיהָ נְקֻדָּה';
  var FRAMES = [
    [['My', 'name', 'is', '{0}.'], [['Dan', 'Noa', 'Tom', 'Maya']], R_GEN],
    [['I', 'am', '{0}', 'years', 'old.'], [['eight', 'nine', 'ten']], R_GEN],
    [['I', 'live', 'in', '{0}.'], [['Haifa', 'Eilat', 'Tel Aviv']], R_GEN],
    [['This', 'is', 'my', '{0}.'], [['sister', 'brother', 'mother', 'father', 'friend']], R_GEN],
    [['I', 'have', 'a', '{0}', '{1}.'], [['red', 'blue', 'green', 'big', 'new'], ['bag', 'pen', 'hat', 'bike']], R_ADJ],
    [['She', 'has', 'a', '{0}', '{1}.'], [['big', 'small', 'black', 'brown'], ['dog', 'cat', 'horse']], R_ADJ],
    [['The', '{0}', 'is', '{1}', 'the', '{2}.'], [['cat', 'dog', 'ball', 'book'], ['on', 'under'], ['bed', 'table', 'chair']], R_GEN],
    [['There', 'is', 'a {0}', 'on', 'the', '{1}.'], [['book', 'pen', 'cat', 'cup'], ['table', 'chair', 'bed']], R_GEN],
    [['There', 'are', '{0}', '{1}', 'in', 'the {2}.'], [['two', 'three', 'four'], ['birds', 'cats'], ['tree', 'garden']], R_GEN],
    [['I', 'can', 'ride', 'a', '{0}.'], [['bike', 'horse']], R_GEN],
    [['{0}', "can't", '{1}.'], [['He', 'She'], ['swim', 'sing', 'dance', 'cook']], R_GEN],
    [['Can', 'you', '{0}?'], [['sing', 'swim', 'dance', 'draw']], R_Q],
    [['Do', 'you', 'like', '{0}?'], [['pizza', 'apples', 'cake', 'milk']], R_Q],
    [['I', "don't", 'like', '{0}.'], [['milk', 'fish', 'bananas', 'rain']], R_GEN],
    [["Let's", 'go', 'to', 'the', '{0}.'], [['park', 'beach', 'zoo', 'pool']], R_GEN],
    [['What', 'is', 'your', '{0}?'], [['name']], R_Q],
    [['Where', 'is', 'my', '{0}?'], [['pencil', 'bag', 'book', 'hat']], R_Q],
    [['It', 'is', '{0}', 'today.'], [['hot', 'cold', 'sunny', 'rainy']], R_GEN],
    [['It', 'is', '{0}', "o'clock."], [['five', 'two', 'ten', 'seven']], R_GEN],
    [['We', 'play', '{0}', 'at', 'school.'], [['football', 'basketball']], R_GEN],
    [['Open', 'the', '{0},', 'please.'], [['door', 'window', 'book', 'bag']], R_GEN],
    [['My', 'favorite', 'color', 'is', '{0}.'], [['blue', 'red', 'green', 'pink']], R_GEN]
  ];
  function orderSentence(r, K) {
    var f = K.pick(r, FRAMES), vals = f[1].map(function (l) { return K.pick(r, l); });
    var parts = f[0].map(function (p) { return p.replace(/\{(\d)\}/, function (m, i) { return vals[+i]; }); }), ans = parts.join(' ');
    var ex = [{ say: 'מַתְחִילִים בַּמִּלָּה עִם הָאוֹת הַגְּדוֹלָה', big: parts[0], ltr: true }];
    if (f[2] === R_ADJ) ex.push({ say: R_ADJ, big: 'a ' + vals[0] + ' ' + vals[1], ltr: true }); else ex.push({ say: f[2] });
    ex.push({ say: 'זֶה הַמִּשְׁפָּט הַמְּסֻדָּר', big: ans, ltr: true });
    return K.q(r, { fmt: 'order', text: 'מְסַדְּרִים מִשְׁפָּט', parts: parts, sep: ' ', answer: ans, ltr: true, key: 'os' + ans, tip: 'אוֹת גְּדוֹלָה בַּהַתְחָלָה. נְקֻדָּה אוֹ סִימַן שְׁאֵלָה בַּסּוֹף', ex: ex });
  }

  // short texts: the sentences, then questions [question, index of the sentence with the answer, right, wrong, wrong]
  var STORIES = [
    [['This is Dan.', 'He is nine years old.', 'He has a brown dog.'], [['How old is Dan?', 1, 'nine', 'ten', 'six'], ['What color is the dog?', 2, 'brown', 'black', 'white']]],
    [['Tom has a cat.', 'The cat is black.', 'It is on the bed.'], [['Where is the cat?', 2, 'on the bed', 'in the bag', 'under the table'], ['What color is the cat?', 1, 'black', 'white', 'brown']]],
    [['Today is Sunday.', 'It is hot and sunny.', 'Maya is at the beach.'], [['What is the weather?', 1, 'hot and sunny', 'cold and rainy', 'windy'], ['Where is Maya?', 2, 'at the beach', 'at school', 'at home']]],
    [['I have a red bag.', 'There is a book in my bag.', 'There is a pencil too.'], [['What color is the bag?', 0, 'red', 'blue', 'green']]],
    [['Lily can swim.', "She can't ride a bike.", 'She can sing.'], [["What can't Lily do?", 1, 'ride a bike', 'swim', 'sing']]],
    [['My name is Noa.', 'I live in Haifa.', 'I have two sisters.'], [['Where does Noa live?', 1, 'in Haifa', 'in Eilat', 'at the zoo'], ['How many sisters does Noa have?', 2, 'two', 'one', 'three']]],
    [["It is seven o'clock.", 'Ben is hungry.', 'He eats bread and an egg.'], [['What does Ben eat?', 2, 'bread and an egg', 'cake', 'pizza and fish'], ['What time is it?', 0, "seven o'clock", "six o'clock", 'half past seven']]],
    [['There are three birds in the tree.', 'One bird is yellow.', 'Two birds are blue.'], [['How many birds are blue?', 2, 'two', 'one', 'three'], ['How many birds are yellow?', 1, 'one', 'two', 'three']]],
    [['Dana likes apples.', "She doesn't like bananas.", 'Her favorite color is green.'], [['What does Dana like?', 0, 'apples', 'bananas', 'fish'], ['What is her favorite color?', 2, 'green', 'red', 'blue']]],
    [['It is cold today.', 'Sam has a coat and a hat.', 'He is at the bus stop.'], [['Where is Sam?', 2, 'at the bus stop', 'at home', 'in the pool'], ['What is the weather?', 0, 'cold', 'hot', 'sunny']]],
    [['This is my family.', 'I have a mother, a father and a baby brother.', 'We have a big house.'], [['Who is the baby?', 1, 'my brother', 'my sister', 'my father']]],
    [['The dog is under the table.', 'The cat is on the chair.', 'The fish is in the water.'], [['Where is the dog?', 0, 'under the table', 'on the chair', 'in the water'], ['Where is the cat?', 1, 'on the chair', 'under the table', 'in the water']]],
    [['Ron is in grade four.', 'His teacher is Miss Green.', 'He likes English lessons.'], [['What grade is Ron in?', 0, 'four', 'five', 'two'], ['Who is his teacher?', 1, 'Miss Green', 'Miss Brown', 'Ron']]],
    [['Gil has a birthday today.', 'He is ten.', 'There is a big chocolate cake.'], [['How old is Gil today?', 1, 'ten', 'nine', 'two']]],
    [['Mom is in the kitchen.', 'She makes a salad.', 'Dad is in the garden.'], [['Who is in the garden?', 2, 'Dad', 'Mom', 'the dog'], ['Where is Mom?', 0, 'in the kitchen', 'in the garden', 'at school']]],
    [['I get up at seven.', 'I drink milk.', 'Then I go to school by bus.'], [['How do I go to school?', 2, 'by bus', 'by car', 'by train'], ['What do I drink?', 1, 'milk', 'water', 'juice']]],
    [['The elephant is big.', 'The mouse is small.', 'They are good friends.'], [['Which animal is small?', 1, 'the mouse', 'the elephant', 'the horse'], ['Which animal is big?', 0, 'the elephant', 'the mouse', 'the cat']]],
    [["Let's play football in the park!", "We can't.", 'It is rainy today.'], [["Why can't they play?", 2, 'It is rainy.', 'It is hot.', 'They are tired.']]],
    [['Sara is sad.', "She can't find her book.", 'It is under her bed!'], [['Where is the book?', 2, 'under the bed', 'in the bag', 'on the desk']]],
    [['It is winter.', 'Tal wears boots and a warm coat.', 'He drinks hot tea.'], [['What does Tal drink?', 2, 'hot tea', 'cold water', 'juice']]],
    [['Adi has a new bike.', 'The bike is blue.', 'She rides it in the park.'], [['What color is the bike?', 1, 'blue', 'red', 'black'], ['Where does Adi ride?', 2, 'in the park', 'at school', 'at home']]],
    [['Yoni is at the zoo.', 'He sees a lion and two monkeys.', 'The monkeys eat bananas.'], [['What do the monkeys eat?', 2, 'bananas', 'apples', 'bread'], ['Where is Yoni?', 0, 'at the zoo', 'at the beach', 'at school']]],
    [['It is night.', 'The moon is in the sky.', 'Rina is in bed.'], [['Where is Rina?', 2, 'in bed', 'in the park', 'at school'], ['Where is the moon?', 1, 'in the sky', 'in the sea', 'on the bed']]],
    [['Omer is thirsty.', 'He wants cold water.', 'There is water on the table.'], [['What does Omer want?', 1, 'cold water', 'hot tea', 'milk'], ['Where is the water?', 2, 'on the table', 'in the bag', 'under the bed']]],
    [['Shira has three pencils.', 'One is red and two are green.', 'They are in her bag.'], [['How many pencils are green?', 1, 'two', 'one', 'three'], ['Where are the pencils?', 2, 'in her bag', 'on the desk', 'under the chair']]],
    [['Grandmother makes a cake.', 'It is a chocolate cake.', 'The children are happy.'], [['Who makes the cake?', 0, 'Grandmother', 'the children', 'Dad']]]
  ];
  var STQ = [];
  STORIES.forEach(function (s) { s[1].forEach(function (q) { STQ.push({ s: s[0], q: q }); }); });
  var QWORD = [['What color', 'הַמִּלִּים What color שׁוֹאֲלוֹת עַל הַצֶּבַע'], ['What time', 'הַמִּלִּים What time שׁוֹאֲלוֹת עַל הַשָּׁעָה'], ['What grade', 'הַמִּלִּים What grade שׁוֹאֲלוֹת עַל הַכִּתָּה'], ['How old', 'הַמִּלִּים How old שׁוֹאֲלוֹת עַל הַגִּיל'], ['How many', 'הַמִּלִּים How many שׁוֹאֲלוֹת: כַּמָּה?'], ['How', 'הַמִּלָּה How שׁוֹאֶלֶת: אֵיךְ?'], ['Where', G_WHERE], ['Who', 'הַמִּלָּה Who שׁוֹאֶלֶת: מִי?'], ['Which', 'הַמִּלָּה Which שׁוֹאֶלֶת: אֵיזֶה?'], ['Why', 'הַמִּלָּה Why שׁוֹאֶלֶת: לָמָּה?'], ['What', 'הַמִּלָּה What שׁוֹאֶלֶת: מָה?']];
  function shortStory(r, K) {
    var it = K.pick(r, STQ), q = it.q, tip = '';
    QWORD.forEach(function (w) { if (!tip && q[0].indexOf(w[0]) === 0) tip = w[1]; });
    return K.q(r, {
      text: '', say: it.s.join(' ') + ' ' + q[0], sayShow: true, answer: q[2], options: [q[2], q[3], q[4]], optLtr: true, key: 'st' + it.s[0] + q[0], tip: tip,
      ex: [
        { say: tip, big: q[0], ltr: true },
        { say: 'קוֹרְאִים שׁוּב אֶת הַסִּפּוּר. הַתְּשׁוּבָה נִמְצֵאת בַּמִּשְׁפָּט הַזֶּה', big: it.s[q[1]], ltr: true }
      ]
    });
  }

  // =====================================================================================
  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'eng', grade: 4,
    tiles: [
      {
        id: 'eng4abc', world: 'מִגְדַּל הָאוֹתִיּוֹת', name: 'אוֹתִיּוֹת וּצְלִילִים', icon: '🔤', bld: 'tower', hero: 'אַלְפִי',
        levels: [
          { name: 'אוֹת גְּדוֹלָה וְאוֹת קְטַנָּה', f: bigSmall },
          { name: 'הַצְּלִיל הָרִאשׁוֹן', f: firstSound },
          { name: 'מִלִּים קְצָרוֹת', f: shortWords },
          { name: 'בּוֹנִים מִלָּה', f: buildWord }
        ]
      },
      {
        id: 'eng4read', world: 'צֵרוּפֵי אוֹתִיּוֹת', name: 'קוֹרְאִים מִלִּים', icon: '📖', bld: 'house1', hero: 'קְסוּמִי',
        levels: [
          { name: 'sh, ch, th, ph', f: digraphs },
          { name: 'e הַקְּסוּמָה', f: magicE },
          { name: 'מְצַלְּמִים מִלָּה', f: sightWords },
          { name: 'תְּנוּעוֹת אֲרֻכּוֹת וְצֵרוּפִים', f: longVowels }
        ]
      },
      {
        id: 'eng4words', world: 'אוֹצַר מִלִּים', name: 'מִלִּים וּתְמוּנוֹת', icon: '🧺', bld: 'houseAlt1', hero: 'מִלִּי',
        levels: [
          { name: 'צְבָעִים וּמִסְפָּרִים', f: colorsNumbers },
          { name: 'בֵּית סֵפֶר וּמִשְׁפָּחָה', f: function (r, K) { return vocab(r, K, SCHOOL); } },
          { name: 'גּוּף וּבְגָדִים', f: function (r, K) { return vocab(r, K, BODY); } },
          { name: 'אֹכֶל וְחַיּוֹת', f: function (r, K) { return vocab(r, K, FOOD); } },
          { name: 'יָמִים, מֶזֶג אֲוִיר וְשָׁעוֹן', f: daysWeatherClock },
          { name: 'פְּעָלִים וַהֲפָכִים', f: verbsOpposites }
        ]
      },
      {
        id: 'eng4talk', world: 'מִשְׁפָּטִים וְשִׂיחָה', name: 'קוֹרְאִים וּמְבִינִים', icon: '💬', bld: 'castleSmall', hero: 'סִפּוּרִי',
        levels: [
          { name: 'שְׁאֵלָה וּתְשׁוּבָה', f: questionAnswer },
          { name: 'מִשְׁפָּט וּתְמוּנָה', f: sentencePicture },
          { name: 'מְסַדְּרִים מִשְׁפָּט', f: orderSentence },
          { name: 'קוֹרְאִים סִפּוּר קָצָר', f: shortStory }
        ]
      }
    ]
  });
})();
