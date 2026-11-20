(function () {
  'use strict';
  // English, grade 1: listening-only enrichment. The word is spoken (say) and the child taps a picture.
  // No English letters are taught and none are written in texts, hints or explanations.

  var INK = '#3b2a55';
  function em(e) { return '<span class="em">' + e + '</span>'; }
  function svg(w, h, vw, vh, inner) { return '<svg viewBox="0 0 ' + vw + ' ' + vh + '" width="' + w + '" height="' + h + '">' + inner + '</svg>'; }

  // ---- drawings ----
  var HEX = { red: '#e53935', blue: '#1e6fe0', yellow: '#ffd400', green: '#3ec46d', orange: '#ff8a00', purple: '#8e5cff', pink: '#ff7ac0', brown: '#8b5a2b', black: '#1c1c1c', white: '#ffffff' };
  function blobIn(c) { return '<circle cx="45" cy="35" r="28" fill="' + HEX[c] + '" stroke="' + INK + '" stroke-width="3"/>'; }
  function numIn(n) {
    var s = '<text x="45" y="38" text-anchor="middle" font-size="38" font-weight="bold" font-family="Arial, sans-serif" fill="' + INK + '">' + n + '</text>', k, row, col, perRow, cnt;
    for (k = 0; k < n; k++) {
      row = n > 5 && k >= 5 ? 1 : 0; col = row ? k - 5 : k; perRow = n > 5 ? 5 : n; cnt = row ? n - 5 : perRow;
      s += '<circle cx="' + (45 - (cnt - 1) * 6 + col * 12) + '" cy="' + (n > 5 ? 50 + row * 12 : 56) + '" r="4.5" fill="#8e5cff"/>';
    }
    return s;
  }
  var DOTS = { 1: [[45, 35]], 2: [[28, 35], [62, 35]], 3: [[45, 18], [26, 52], [64, 52]], 4: [[28, 19], [62, 19], [28, 51], [62, 51]], 5: [[22, 17], [68, 17], [45, 35], [22, 53], [68, 53]] };
  function dotsIn(n, c) {
    return DOTS[n].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="' + HEX[c] + '" stroke="' + INK + '" stroke-width="2.5"/>'; }).join('');
  }
  // a simple child figure; one body part is painted pink
  function bodyIn(part) {
    var B = '#e6dcff', P = '#ff5fa2', st = ' stroke="' + INK + '" stroke-width="2.5"';
    function c(x, y, r, on) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (on ? r + 2.5 : r) + '" fill="' + (on ? P : B) + '"' + st + '/>'; }
    var s = '';
    s += '<line x1="30" y1="36" x2="14" y2="58"' + st + ' stroke-linecap="round"/><line x1="50" y1="36" x2="66" y2="58"' + st + ' stroke-linecap="round"/>';
    s += '<line x1="34" y1="54" x2="25" y2="92"' + st + ' stroke-linecap="round"/><line x1="46" y1="54" x2="55" y2="92"' + st + ' stroke-linecap="round"/>';
    s += '<rect x="29" y="31" width="22" height="26" rx="6" fill="' + B + '"' + st + '/>';
    s += c(40, 17, 12, part === 'head');
    s += c(14, 58, 4, part === 'hands') + c(66, 58, 4, part === 'hands');
    if (part === 'shoulders') s += c(29, 35, 4, true) + c(51, 35, 4, true);
    if (part === 'knees') s += c(29, 75, 3.5, true) + c(51, 75, 3.5, true);
    var f = part === 'feet';
    s += '<ellipse cx="22" cy="94" rx="' + (f ? 9 : 6) + '" ry="' + (f ? 5 : 3.5) + '" fill="' + (f ? P : B) + '"' + st + '/><ellipse cx="58" cy="94" rx="' + (f ? 9 : 6) + '" ry="' + (f ? 5 : 3.5) + '" fill="' + (f ? P : B) + '"' + st + '/>';
    return s;
  }

  // ---- item banks. w: the spoken word, he: the Hebrew word, e: emoji, d: [viewBox w, h, inner] drawing, g: group, c: core word ----
  function col(w, he) { return { w: w, he: he, d: [90, 70, blobIn(w)], g: 'col', c: 1 }; }
  function num(w, he, n) { return { w: w, he: he, d: [90, 70, numIn(n)], g: 'num', c: 1, n: n }; }
  function it(w, he, e, c, g) { return { w: w, he: he, e: e, c: c, g: g || 'a' }; }
  function body(w, he) { return { w: w, he: he, d: [80, 102, bodyIn(w)], g: 'body', c: 1 }; }

  var COLORS = [col('red', 'אָדֹם'), col('blue', 'כָּחֹל'), col('yellow', 'צָהֹב'), col('green', 'יָרֹק'), col('orange', 'כָּתֹם'),
    col('purple', 'סָגֹל'), col('pink', 'וָרֹד'), col('brown', 'חוּם'), col('black', 'שָׁחֹר'), col('white', 'לָבָן')];
  var NUMS = [num('one', 'אַחַת', 1), num('two', 'שְׁתַּיִם', 2), num('three', 'שָׁלוֹשׁ', 3), num('four', 'אַרְבַּע', 4), num('five', 'חָמֵשׁ', 5),
    num('six', 'שֵׁשׁ', 6), num('seven', 'שֶׁבַע', 7), num('eight', 'שְׁמוֹנֶה', 8), num('nine', 'תֵּשַׁע', 9), num('ten', 'עֶשֶׂר', 10)];
  var H1 = COLORS.concat(NUMS);

  var H2 = [it('cat', 'חָתוּל', '🐱', 1), it('dog', 'כֶּלֶב', '🐶', 1), it('cow', 'פָּרָה', '🐮', 1), it('lion', 'אַרְיֵה', '🦁', 1), it('fish', 'דָּג', '🐟', 1),
    it('bird', 'צִפּוֹר', '🐦', 1), it('elephant', 'פִּיל', '🐘', 1), it('monkey', 'קוֹף', '🐵', 1), it('rabbit', 'אַרְנָב', '🐰', 1), it('horse', 'סוּס', '🐴', 1),
    it('bear', 'דֹּב', '🐻', 0), it('butterfly', 'פַּרְפַּר', '🦋', 0), it('caterpillar', 'זַחַל', '🐛', 0), it('duck', 'בַּרְוָז', '🦆', 0), it('shark', 'כָּרִישׁ', '🦈', 0),
    it('pig', 'חֲזִיר', '🐷', 0), it('sheep', 'כִּבְשָׂה', '🐑', 0), it('frog', 'צְפַרְדֵּעַ', '🐸', 0), it('mouse', 'עַכְבָּר', '🐭', 0), it('chicken', 'תַּרְנְגֹלֶת', '🐔', 0)];

  var H3 = [it('apple', 'תַּפּוּחַ', '🍎', 1), it('banana', 'בָּנָנָה', '🍌', 1), it('bread', 'לֶחֶם', '🍞', 1), it('milk', 'חָלָב', '🥛', 1), it('water', 'מַיִם', '💧', 1),
    it('cheese', 'גְּבִינָה', '🧀', 1), it('egg', 'בֵּיצָה', '🥚', 1), it('rice', 'אֹרֶז', '🍚', 1), it('cake', 'עוּגָה', '🍰', 1),
    it('pizza', 'פִּיצָה', '🍕', 0), it('tomato', 'עַגְבָנִיָּה', '🍅', 0), it('ice cream', 'גְּלִידָה', '🍦', 0), it('salad', 'סָלָט', '🥗', 0), it('cookie', 'עוּגִיָּה', '🍪', 0),
    it('carrot', 'גֶּזֶר', '🥕', 0), it('juice', 'מִיץ', '🧃', 0), it('grapes', 'עֲנָבִים', '🍇', 0), it('strawberry', 'תּוּת שָׂדֶה', '🍓', 0), it('corn', 'תִּירָס', '🌽', 0)];

  var H4 = [it('eyes', 'עֵינַיִם', '👀', 1, 'face'), it('ears', 'אָזְנַיִם', '👂', 1, 'face'), it('mouth', 'פֶּה', '👄', 1, 'face'), it('nose', 'אַף', '👃', 1, 'face'),
    body('head', 'רֹאשׁ'), body('shoulders', 'כְּתֵפַיִם'), body('hands', 'יָדַיִם'), body('knees', 'בִּרְכַּיִם'), body('feet', 'רַגְלַיִם'),
    it('happy', 'שָׂמֵחַ', '😀', 1, 'feel'), it('sad', 'עָצוּב', '😢', 1, 'feel'), it('angry', 'כּוֹעֵס', '😠', 1, 'feel'), it('scared', 'מְפַחֵד', '😨', 1, 'feel'), it('sleepy', 'מְנֻמְנָם', '😴', 1, 'feel')];

  var H5 = [it('clap', 'לִמְחֹא כַּפַּיִם', '👏', 1), it('wave', 'לְנוֹפֵף', '👋', 1), it('sing', 'לָשִׁיר', '🎤', 1), it('hug', 'לְחַבֵּק', '🫂', 1),
    it('Listen!', 'לְהַקְשִׁיב', '👂', 1), it('Look!', 'לְהִסְתַּכֵּל', '👀', 1), it('Stop!', 'לַעֲצֹר', '🛑', 1), it('open', 'לִפְתֹּחַ', '📖', 1), it('close', 'לִסְגֹּר', '📕', 1),
    it('Sit down', 'לָשֶׁבֶת', '🪑', 1), it('Stand up', 'לָקוּם', '🧍', 1)];

  // words that sound alike (the challenge distractor) and pictures that must not meet (too alike to tell apart)
  var NEAR = { four: 'five', five: 'four', six: 'seven', seven: 'six', sheep: 'shark', shark: 'sheep', eyes: 'ears', ears: 'eyes', head: 'hands', hands: 'head' };
  var CLASH = { bird: ['duck', 'chicken'], duck: ['bird'], chicken: ['bird'], apple: ['tomato'], tomato: ['apple'] };
  function clash(a, b) { return (CLASH[a.w] || []).indexOf(b.w) >= 0; }

  // ---- pictures in their three sizes ----
  function optPic(x) { return x.e ? em(x.e) : svg(x.d[0], x.d[1], x.d[0], x.d[1], x.d[2]); }
  function bigPic(x) { return svg(x.d[0] * 1.6, x.d[1] * 1.6, x.d[0], x.d[1], x.d[2]); }
  function step(say, x) { var s = { say: say }; if (x) { if (x.e) s.big = x.e; else s.svg = bigPic(x); } return s; }
  function heard(x) { return 'הַמִּלָּה שֶׁשּׁוֹמְעִים, בְּעִבְרִית: ' + x.he + '.'; }
  var AGAIN = 'מַקְשִׁיבִים שׁוּב וְאוֹמְרִים אֶת הַמִּלָּה בְּקוֹל.';

  function pickWord(r, K, bank) {
    var core = bank.filter(function (x) { return x.c; }), rest = bank.filter(function (x) { return !x.c; });
    return K.pick(r, rest.length && r() < 0.35 ? rest : core);
  }
  function others(bank, x) { return bank.filter(function (y) { return y !== x && y.g === x.g && !clash(x, y); }); }

  // listen and choose a picture
  function choose(r, K, bank, x) {
    var n = r() < 0.5 ? 3 : 4, pool = others(bank, x), near = NEAR[x.w], out = [x], html = {}, ex;
    if (near && n === 4) pool.forEach(function (y) { if (y.w === near) out.push(y); });
    K.shuffle(r, pool).forEach(function (y) {
      if (out.length < n && out.indexOf(y) < 0 && !out.some(function (z) { return clash(z, y); })) out.push(y);
    });
    out.forEach(function (y) { html[y.w] = optPic(y); });
    ex = [step(heard(x), x), step(AGAIN)];
    out.forEach(function (y) { if (y.w === near) ex.push(step('יֵשׁ מִלָּה שֶׁנִּשְׁמַעַת דּוֹמֶה: ' + y.he + '. מַקְשִׁיבִים הֵיטֵב!')); });
    ex.push(step('עַכְשָׁו בּוֹחֲרִים אֶת הַתְּמוּנָה הַמַּתְאִימָה.'));
    return K.q(r, { text: '', say: x.w, answer: x.w, options: out.map(function (y) { return y.w; }), optHtml: html, tip: heard(x), ex: ex });
  }
  // one picture and a word: is it the word of this picture?
  function yesNo(r, K, bank, x) {
    var truth = r() < 0.5, p = truth ? x : K.pick(r, others(bank, x));
    var o = { text: 'זֹאת הַמִּלָּה שֶׁל הַתְּמוּנָה?', say: x.w, tip: heard(x), key: 'tf|' + x.w + '|' + p.w,
      ex: [step('בַּתְּמוּנָה: ' + p.he + '.', p), step(heard(x), x), step('זֹאת אוֹתָהּ מִלָּה, אוֹ מִלָּה אַחֶרֶת?')] };
    if (p.e) o.pic = p.e; else o.svg = bigPic(p);
    return K.tf(r, o, truth);
  }
  function house(bank, tfShare) {
    return function (r, K) { var x = pickWord(r, K, bank); return r() < tfShare ? yesNo(r, K, bank, x) : choose(r, K, bank, x); };
  }
  // a number and a colour together: "three red"
  function combo(r, K) {
    var ns = K.sample(r, NUMS.slice(0, 5), 2), cs = K.sample(r, COLORS, 2), html = {}, opts = [];
    [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (p) {
      var id = ns[p[0]].w + ' ' + cs[p[1]].w; opts.push(id);
      html[id] = svg(90, 70, 90, 70, dotsIn(ns[p[0]].n, cs[p[1]].w));
    });
    return K.q(r, { text: '', say: opts[0], answer: opts[0], options: opts, optHtml: html,
      tip: 'שׁוֹמְעִים שְׁתֵּי מִלִּים: מִסְפָּר וְצֶבַע.',
      ex: [step('הַמִּלָּה הָרִאשׁוֹנָה הִיא מִסְפָּר: ' + ns[0].he + '.', ns[0]),
        step('הַמִּלָּה הַשְּׁנִיָּה הִיא צֶבַע: ' + cs[0].he + '.', cs[0]),
        step('מְחַפְּשִׂים תְּמוּנָה שֶׁיֵּשׁ בָּהּ גַּם ' + ns[0].he + ' וְגַם ' + cs[0].he + '.')] });
  }
  var h1 = house(H1, 0.3);

  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'eng',
    grade: 1,
    tiles: [{
      id: 'eng1listen',
      world: 'בֵּית הָאַנְגְּלִית',
      name: 'הַעֲשָׁרָה: מַקְשִׁיבִים וּבוֹחֲרִים',
      icon: '🎧',
      bld: 'houseAlt1',
      hero: 'שִׁירִי',
      levels: [
        { name: 'צְבָעִים וּמִסְפָּרִים', f: function (r, K) { return r() < 0.25 ? combo(r, K) : h1(r, K); } },
        { name: 'בַּעֲלֵי חַיִּים', f: house(H2, 0.3) },
        { name: 'אֹכֶל', f: house(H3, 0.3) },
        { name: 'הַגּוּף וְהָרְגָשׁוֹת', f: house(H4, 0.3) },
        { name: 'פְּעֻלּוֹת וְהוֹרָאוֹת', f: house(H5, 0.35) }
      ]
    }]
  });
})();
