// English, grade 2. English is not formally taught in grade 2, so this is listening-first practice: a word or a phrase is
// spoken (say) and the child taps a picture or a vocalised Hebrew meaning. No English reading is required.
(function () {
  'use strict';
  var INK = '#3b2a55', PINK = '#ff2d87';

  // ---------- small helpers ----------
  function EM(e, style) { return '<span class="em"' + (style ? ' style="' + style + '"' : '') + '>' + e + '</span>'; }
  // a white card with a drawing inside: every picture answer sits on its own card, so it shows on any button colour
  function wrap(inner, vw, vh, w, bg) {
    return '<svg viewBox="0 0 ' + vw + ' ' + vh + '" width="' + w + '" height="' + Math.round(w * vh / vw) + '">' +
      '<rect x="1.5" y="1.5" width="' + (vw - 3) + '" height="' + (vh - 3) + '" rx="12" fill="' + (bg || '#ffffff') + '" stroke="' + INK + '" stroke-width="2"/>' + inner + '</svg>';
  }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function rep(s, n) { var out = '', i; for (i = 0; i < n; i++) out += s; return out; }
  function W(en, he, em, extra) { var o = { en: en, he: he, em: em || null }, k; for (k in (extra || {})) o[k] = extra[k]; return o; }

  // ---------- drawings: colours, digits, dots ----------
  var HEX = { red: '#e53935', blue: '#1e88e5', yellow: '#ffd600', green: '#2e9e4f', orange: '#ff8a00', purple: '#8e3fd1', pink: '#ff7eb6', brown: '#7a4a21', black: '#1c1c1c', white: '#ffffff' };
  function dotIn(c) { return '<circle cx="45" cy="35" r="24" fill="' + c + '" stroke="' + INK + '" stroke-width="2.5"/>'; }
  function colorSvg(name) { return function (w) { return wrap(dotIn(HEX[name]), 90, 70, w, '#e9e2f5'); }; }
  function digitSvg(n) { return function (w) { return wrap('<text x="45" y="52" font-size="46" font-weight="700" font-family="Arial, sans-serif" text-anchor="middle" fill="' + INK + '">' + n + '</text>', 90, 70, w); }; }
  function dotsSvg(n) { // like a ten-frame: five in a row
    return function (w) {
      var s = '', i;
      for (i = 0; i < n; i++) s += '<circle cx="' + (13 + (i % 5) * 16) + '" cy="' + (n > 5 ? 25 + Math.floor(i / 5) * 20 : 35) + '" r="6.5" fill="#8e5cff" stroke="' + INK + '" stroke-width="1.5"/>';
      return wrap(s, 90, 70, w);
    };
  }
  // ---------- drawings: window and table (no clear emoji on older phones) ----------
  function windowSvg(w) {
    return wrap('<rect x="23" y="11" width="44" height="48" rx="3" fill="#bfe6ff" stroke="' + INK + '" stroke-width="3"/><line x1="45" y1="11" x2="45" y2="59" stroke="' + INK + '" stroke-width="3"/><line x1="23" y1="35" x2="67" y2="35" stroke="' + INK + '" stroke-width="3"/><rect x="19" y="57" width="52" height="6" rx="2" fill="#b98352" stroke="' + INK + '" stroke-width="2"/>', 90, 70, w);
  }
  function tableSvg(w) {
    return wrap('<rect x="24" y="30" width="7" height="30" fill="#b98352" stroke="' + INK + '" stroke-width="2"/><rect x="59" y="30" width="7" height="30" fill="#b98352" stroke="' + INK + '" stroke-width="2"/><rect x="12" y="20" width="66" height="11" rx="3" fill="#d79b63" stroke="' + INK + '" stroke-width="2.5"/>', 90, 70, w);
  }
  // ---------- drawings: a child and a face, with one part marked by a pink ring ----------
  function ring(cx, cy, rx, ry) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (ry || rx) + '" fill="rgba(255,45,135,.22)" stroke="' + PINK + '" stroke-width="4" stroke-dasharray="7 4"/>'; }
  var BODY_MARK = {
    head: ring(100, 30, 28), shoulders: ring(79, 60, 11) + ring(121, 60, 11), hands: ring(54, 96, 13) + ring(146, 96, 13),
    knees: ring(89, 124, 10) + ring(111, 124, 10), legs: ring(89, 124, 11, 27) + ring(111, 124, 11, 27), feet: ring(81, 153, 17, 11) + ring(119, 153, 17, 11)
  };
  function bodyFig(part) {
    return function (w) {
      var SK = '#ffd2a8', s = '';
      s += '<line x1="90" y1="98" x2="89" y2="148" stroke="' + INK + '" stroke-width="14" stroke-linecap="round"/><line x1="110" y1="98" x2="111" y2="148" stroke="' + INK + '" stroke-width="14" stroke-linecap="round"/>';
      s += '<line x1="90" y1="98" x2="89" y2="148" stroke="' + SK + '" stroke-width="10" stroke-linecap="round"/><line x1="110" y1="98" x2="111" y2="148" stroke="' + SK + '" stroke-width="10" stroke-linecap="round"/>';
      s += '<ellipse cx="82" cy="153" rx="12" ry="6" fill="#ff5fa2" stroke="' + INK + '" stroke-width="2"/><ellipse cx="118" cy="153" rx="12" ry="6" fill="#ff5fa2" stroke="' + INK + '" stroke-width="2"/>';
      s += '<line x1="82" y1="62" x2="56" y2="93" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/><line x1="118" y1="62" x2="144" y2="93" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/>';
      s += '<line x1="82" y1="62" x2="56" y2="93" stroke="' + SK + '" stroke-width="9" stroke-linecap="round"/><line x1="118" y1="62" x2="144" y2="93" stroke="' + SK + '" stroke-width="9" stroke-linecap="round"/>';
      s += '<circle cx="54" cy="96" r="7" fill="' + SK + '" stroke="' + INK + '" stroke-width="2"/><circle cx="146" cy="96" r="7" fill="' + SK + '" stroke="' + INK + '" stroke-width="2"/>';
      s += '<rect x="79" y="52" width="42" height="52" rx="9" fill="#3aa0ff" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<circle cx="100" cy="31" r="20" fill="' + SK + '" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<path d="M80 30 Q80 9 100 9 Q120 9 120 30 Q110 19 100 19 Q90 19 80 30 Z" fill="#7a4a21" stroke="' + INK + '" stroke-width="2"/>';
      s += '<circle cx="93" cy="31" r="2.2" fill="' + INK + '"/><circle cx="107" cy="31" r="2.2" fill="' + INK + '"/><path d="M93 39 Q100 45 107 39" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>';
      return wrap(s + (BODY_MARK[part] || ''), 200, 170, w);
    };
  }
  var FACE_MARK = {
    hair: ring(100, 36, 58, 24), eyes: ring(80, 86, 14) + ring(120, 86, 14), ears: ring(45, 96, 13, 19) + ring(155, 96, 13, 19),
    nose: ring(100, 104, 12), mouth: ring(100, 130, 25, 12), cheek: ring(133, 114, 13)
  };
  function faceFig(part) {
    return function (w) {
      var SK = '#ffd2a8', s = '';
      s += '<ellipse cx="46" cy="96" rx="8" ry="13" fill="' + SK + '" stroke="' + INK + '" stroke-width="2.5"/><ellipse cx="154" cy="96" rx="8" ry="13" fill="' + SK + '" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<ellipse cx="100" cy="92" rx="52" ry="62" fill="' + SK + '" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<path d="M48 84 Q42 18 100 18 Q158 18 152 84 Q142 50 100 48 Q58 50 48 84 Z" fill="#7a4a21" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<circle cx="80" cy="86" r="7.5" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/><circle cx="120" cy="86" r="7.5" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/><circle cx="80" cy="86" r="3.2" fill="' + INK + '"/><circle cx="120" cy="86" r="3.2" fill="' + INK + '"/>';
      s += '<path d="M100 94 L94 108 Q100 113 106 108 Z" fill="#f2b98a" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
      s += '<path d="M83 126 Q100 140 117 126" fill="none" stroke="#c2185b" stroke-width="4.5" stroke-linecap="round"/>';
      return wrap(s + (FACE_MARK[part] || ''), 200, 170, w);
    };
  }

  // ---------- drawings for the phrases house: a ball, a car and a flower in any colour ----------
  var SHAPE = {
    ball: function (c) { return '<circle cx="45" cy="35" r="23" fill="' + c + '" stroke="' + INK + '" stroke-width="2.5"/><path d="M27 26 Q45 38 63 26" fill="none" stroke="#ffffff" stroke-width="3" opacity=".75"/><path d="M27 45 Q45 33 63 45" fill="none" stroke="#ffffff" stroke-width="3" opacity=".75"/>'; },
    car: function (c) { return '<path d="M26 34 L34 19 H58 L66 34 Z" fill="' + c + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M33 32 L38 23 H44 V32 Z M48 32 V23 H55 L60 32 Z" fill="#d8f0ff" stroke="' + INK + '" stroke-width="1.5"/><rect x="10" y="33" width="70" height="17" rx="6" fill="' + c + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="28" cy="52" r="8" fill="#4a4a4a" stroke="' + INK + '" stroke-width="2"/><circle cx="62" cy="52" r="8" fill="#4a4a4a" stroke="' + INK + '" stroke-width="2"/><circle cx="28" cy="52" r="3" fill="#ffffff"/><circle cx="62" cy="52" r="3" fill="#ffffff"/>'; },
    flower: function (c) {
      var s = '<line x1="45" y1="38" x2="45" y2="66" stroke="#2e9e4f" stroke-width="4" stroke-linecap="round"/><path d="M45 56 Q56 46 60 54 Q54 60 45 56 Z" fill="#3ec46d" stroke="' + INK + '" stroke-width="1.5"/>', i, a;
      for (i = 0; i < 5; i++) { a = (i * 72 - 90) * Math.PI / 180; s += '<circle cx="' + (45 + 12 * Math.cos(a)).toFixed(1) + '" cy="' + (28 + 12 * Math.sin(a)).toFixed(1) + '" r="9" fill="' + c + '" stroke="' + INK + '" stroke-width="2"/>'; }
      return s + '<circle cx="45" cy="28" r="6.5" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/>';
    }
  };
  function oneSvg(obj, color, small, w) {
    var inner = SHAPE[obj](color);
    return wrap(small ? '<g transform="translate(26.1 20.3) scale(.42)">' + inner + '</g>' : inner, 90, 70, w);
  }
  function rowSvg(obj, color, n, w) {
    var s = '', i, x0 = (170 - n * 40.5) / 2;
    for (i = 0; i < n; i++) s += '<g transform="translate(' + (x0 + i * 40.5).toFixed(1) + ' 19.2) scale(.45)">' + SHAPE[obj](color) + '</g>';
    return wrap(s, 170, 70, w);
  }

  // ---------- one word: listen and tap ----------
  var LISTEN = 'אֶפְשָׁר לְהַקִּישׁ עַל 🔊 וְלִשְׁמֹעַ שׁוּב.';
  function hasPic(it) { return !!(it.em || it.svg || it.svgs); }
  function clash(a, b) { return a.en === b.en || a.he === b.he || (a.x && a.x.indexOf(b.en) >= 0) || (b.x && b.x.indexOf(a.en) >= 0); }
  // wrong answers: words of the same house that cannot be confused with the right picture; often one that sounds alike
  function others(r, K, a, pool, n) {
    var cand = K.shuffle(r, pool.filter(function (x) { return !clash(a, x) && (!a.cat || x.cat === a.cat); })), i;
    if (r() < 0.6) for (i = 1; i < cand.length; i++) if (cand[i].en.charAt(0) === a.en.charAt(0) || (a.near && a.near.indexOf(cand[i].en) >= 0)) { cand.unshift(cand.splice(i, 1)[0]); break; }
    return cand.slice(0, n);
  }
  function pix(it, m) { return it.svgs ? it.svgs[m % it.svgs.length](90) : it.svg ? it.svg(90) : EM(it.em); }
  function show(it) { return it.fig ? { svg: it.fig(200) } : it.svgs ? { svg: it.svgs[0](220) } : it.svg ? { svg: it.svg(220) } : { big: (it.em ? it.em + ' ' : '') + it.en, ltr: true }; }
  // the explanation, the way a word is taught in class: hear it, see it, compare with another word, say it together
  function wordSteps(a, other) {
    var st = [merge({ say: 'שׁוֹמְעִים: ' + a.en + '. בְּעִבְרִית: ' + a.he + '.' }, show(a))];
    if (other) st.push(merge({ say: 'וְזֶה? זֶה ' + other.en + ', בְּעִבְרִית: ' + other.he + '. לֹא מַתְאִים.' }, show(other)));
    st.push(merge({ say: 'אוֹמְרִים יַחַד בְּקוֹל: ' + a.en + '!' }, show(a)));
    return st;
  }
  function picQ(r, K, bank, a) {
    var m = a.svgs ? K.ri(r, 0, a.svgs.length - 1) : 0, ds = others(r, K, a, bank.filter(hasPic), 3), html = {};
    [a].concat(ds).forEach(function (x) { html[x.he] = pix(x, m); });
    return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?', say: a.en, answer: a.he, options: [a].concat(ds).map(function (x) { return x.he; }), optHtml: html,
      tip: 'בְּעִבְרִית: ' + a.he + '.', ex: wordSteps(a, ds[0]), key: 'p' + m + '|' + a.en });
  }
  function hebQ(r, K, bank, a) {
    var ds = others(r, K, a, bank, 3);
    return K.q(r, { text: 'מָה פֵּרוּשׁ הַמִּלָּה?', say: a.en, answer: a.he, options: [a].concat(ds).map(function (x) { return x.he; }),
      tip: a.hint || a.em ? 'רֶמֶז: ' + (a.hint || a.em) : LISTEN, ex: wordSteps(a, ds[0]), key: 'h|' + a.en });
  }
  // a picture and a spoken question: "Is it a cat?"
  function tfQ(r, K, bank, a) {
    var truth = r() < 0.5, b = truth ? a : others(r, K, a, bank.filter(hasPic), 1)[0];
    var o = { fmt: 'tf', text: 'מָה שֶׁנִּשְׁמַע מַתְאִים לַתְּמוּנָה?', say: 'Is it ' + (b.art ? b.art + ' ' : '') + b.en + '?', tip: 'הַמִּלָּה שֶׁנִּשְׁמְעָה, בְּעִבְרִית: ' + b.he + '.', key: 't|' + a.en + '|' + b.en };
    if (a.em) o.pic = a.em; else o.svg = a.svg(150);
    o.ex = [merge({ say: 'בַּתְּמוּנָה: ' + a.en + '. בְּעִבְרִית: ' + a.he + '.' }, show(a))];
    if (truth) o.ex.push({ say: 'שָׁאֲלוּ עַל ' + b.en + '. זֶה מַתְאִים לַתְּמוּנָה, לָכֵן הַתְּשׁוּבָה: נָכוֹן.' });
    else {
      o.ex.push(merge({ say: 'שָׁאֲלוּ עַל ' + b.en + '. בְּעִבְרִית: ' + b.he + '.' }, show(b)));
      o.ex.push(merge({ say: 'זֶה לֹא מָה שֶׁבַּתְּמוּנָה, לָכֵן הַתְּשׁוּבָה: לֹא נָכוֹן.' }, show(a)));
    }
    return K.tf(r, o, truth);
  }
  // two or three words in a row: tap the meanings in the order they were heard
  function ordQ(r, K, bank, a) {
    var short = bank.filter(function (x) { return x.he.length <= 14; }), list = [a], n = r() < 0.5 ? 2 : 3, cand = others(r, K, a, short, 12), i;
    for (i = 0; i < cand.length && list.length < n; i++) if (!list.some(function (y) { return clash(y, cand[i]); })) list.push(cand[i]);
    var ex = list.map(function (x) { return merge({ say: x.en + ' בְּעִבְרִית: ' + x.he + '.' }, show(x)); });
    ex.push({ say: 'מַקִּישִׁים לְפִי הַסֵּדֶר שֶׁנִּשְׁמַע.', big: list.map(function (x) { return x.en; }).join(', '), ltr: true });
    return K.q(r, { fmt: 'order', text: 'בְּאֵיזֶה סֵדֶר נִשְׁמְעוּ הַמִּלִּים?', say: list.map(function (x) { return x.en; }).join(', '), sep: ', ',
      parts: list.map(function (x) { return x.he; }), answer: list.map(function (x) { return x.he; }).join(', '),
      tip: 'מַקְשִׁיבִים, וּמַקִּישִׁים לְפִי הַסֵּדֶר שֶׁנִּשְׁמַע.', ex: ex, key: 'o|' + list.map(function (x) { return x.en; }).join('|') });
  }
  // a marked part of a drawing and one spoken word: does the word fit the marked part?
  function figQ(r, K, bank, a) {
    var figs = bank.filter(function (x) { return x.fig; }), truth = r() < 0.5, b = truth ? a : others(r, K, a, figs, 1)[0];
    var ex = [merge({ say: 'הַחֵלֶק הַמְּסֻמָּן: ' + a.en + '. בְּעִבְרִית: ' + a.he + '.' }, show(a))];
    if (truth) ex.push({ say: 'שׁוֹמְעִים: ' + b.en + '. זֶה מַתְאִים, לָכֵן הַתְּשׁוּבָה: נָכוֹן.' });
    else {
      ex.push(merge({ say: 'שׁוֹמְעִים: ' + b.en + '. בְּעִבְרִית: ' + b.he + '. הִנֵּה, זֶה כָּאן.' }, show(b)));
      ex.push(merge({ say: 'זֶה לֹא הַחֵלֶק הַמְּסֻמָּן, לָכֵן הַתְּשׁוּבָה: לֹא נָכוֹן.' }, show(a)));
    }
    return K.tf(r, { fmt: 'tf', text: 'הַמִּלָּה מַתְאִימָה לַחֵלֶק הַמְּסֻמָּן בְּוָרֹד?', say: b.en, svg: a.fig(200), tip: 'הַמִּלָּה שֶׁנִּשְׁמְעָה, בְּעִבְרִית: ' + b.he + '.', ex: ex, key: 'f|' + a.en + '|' + b.en }, truth);
  }
  // a house of single words: w = the share of each exercise type (picture, Hebrew meaning, true/false, order, marked drawing)
  function house(bank, w) {
    var pics = bank.filter(hasPic), figs = bank.filter(function (x) { return x.fig; }), asks = bank.filter(function (x) { return hasPic(x) && x.art != null; });
    var shorts = bank.filter(function (x) { return x.he.length <= 14; });
    return function (r, K) {
      var x = r();
      if ((x -= w.pic) < 0) return picQ(r, K, bank, K.pick(r, pics));
      if ((x -= w.heb) < 0) return hebQ(r, K, bank, K.pick(r, bank));
      if ((x -= (w.tf || 0)) < 0) return tfQ(r, K, asks, K.pick(r, asks));
      if ((x -= (w.fig || 0)) < 0) return figQ(r, K, bank, K.pick(r, figs));
      return ordQ(r, K, bank, K.pick(r, shorts));
    };
  }

  // ---------- house 1: colours and numbers ----------
  function C(en, he, hint) { return W(en, he, null, { cat: 'c', svg: colorSvg(en), hint: hint }); }
  function N(en, he, n) { return W(en, he, null, { cat: 'n', n: n, svgs: [digitSvg(n), dotsSvg(n)], hint: String(n) }); }
  var H1 = [
    C('red', 'אָדֹם', '🔴'), C('blue', 'כָּחֹל', '🔵'), C('yellow', 'צָהֹב', '🟡'), C('green', 'יָרֹק', '🟢'), C('orange', 'כָּתֹם', '🟠'),
    C('purple', 'סָגֹל', '🟣'), C('pink', 'וָרֹד', null), C('brown', 'חוּם', '🟤'), C('black', 'שָׁחֹר', '⚫'), C('white', 'לָבָן', '⚪'),
    N('one', 'אַחַת', 1), N('two', 'שְׁתַּיִם', 2), N('three', 'שָׁלוֹשׁ', 3), N('four', 'אַרְבַּע', 4), N('five', 'חָמֵשׁ', 5),
    N('six', 'שֵׁשׁ', 6), N('seven', 'שֶׁבַע', 7), N('eight', 'שְׁמוֹנֶה', 8), N('nine', 'תֵּשַׁע', 9), N('ten', 'עֶשֶׂר', 10)
  ];
  // ---------- house 2: animals ----------
  var H2 = [
    W('cat', 'חָתוּל', '🐱', { art: 'a' }), W('dog', 'כֶּלֶב', '🐶', { art: 'a' }), W('cow', 'פָּרָה', '🐮', { art: 'a' }),
    W('chicken', 'תַּרְנְגֹלֶת', '🐔', { art: 'a', x: ['bird'] }), W('lion', 'אַרְיֵה', '🦁', { art: 'a' }), W('giraffe', 'גִּ\'ירָפָה', '🦒', { art: 'a' }),
    W('zebra', 'זֶבְּרָה', '🦓', { art: 'a' }), W('gorilla', 'גּוֹרִילָה', '🦍', { art: 'a', x: ['monkey'] }), W('fish', 'דָּג', '🐟', { art: 'a' }),
    W('bird', 'צִפּוֹר', '🐦', { art: 'a', x: ['chicken', 'duck'] }), W('monkey', 'קוֹף', '🐵', { art: 'a' }), W('rabbit', 'אַרְנָב', '🐰', { art: 'a' }),
    W('horse', 'סוּס', '🐴', { art: 'a' }), W('bear', 'דֹּב', '🐻', { art: 'a' }), W('butterfly', 'פַּרְפַּר', '🦋', { art: 'a' }),
    W('caterpillar', 'זַחַל', '🐛', { art: 'a' }), W('duck', 'בַּרְוָז', '🦆', { art: 'a' }), W('sheep', 'כִּבְשָׂה', '🐑', { art: 'a' }),
    W('frog', 'צְפַרְדֵּעַ', '🐸', { art: 'a' }), W('elephant', 'פִּיל', '🐘', { art: 'an' })
  ];
  // ---------- house 3: food (soup has no clear picture: Hebrew meaning only) ----------
  var H3 = [
    W('apple', 'תַּפּוּחַ', '🍎', { art: 'an', x: ['tomato'] }), W('banana', 'בָּנָנָה', '🍌', { art: 'a' }), W('orange', 'תַּפּוּז', '🍊', { art: 'an' }),
    W('melon', 'מֶלוֹן', '🍈', { art: 'a' }), W('bread', 'לֶחֶם', '🍞', { art: '' }), W('milk', 'חָלָב', '🥛', { art: '', x: ['water'] }),
    W('water', 'מַיִם', '💧', { art: '' }), W('cheese', 'גְּבִינָה', '🧀', { art: '' }), W('egg', 'בֵּיצָה', '🥚', { art: 'an' }),
    W('rice', 'אֹרֶז', '🍚', { art: '', x: ['soup'] }), W('soup', 'מָרָק', null), W('cake', 'עוּגָה', '🍰', { art: 'a' }),
    W('pasta', 'פַּסְטָה', '🍝', { art: '' }), W('salad', 'סָלָט', '🥗', { art: 'a' }), W('potato', 'תַּפּוּחַ אֲדָמָה', '🥔', { art: 'a', near: ['tomato'] }),
    W('chocolate', 'שׁוֹקוֹלָד', '🍫', { art: '' }), W('tomato', 'עַגְבָנִיָּה', '🍅', { art: 'a', near: ['potato'] }), W('onion', 'בָּצָל', '🧅', { art: 'an' }),
    W('carrot', 'גֶּזֶר', '🥕', { art: 'a' }), W('pepper', 'פִּלְפֵּל', '🌶️', { art: 'a' }), W('pizza', 'פִּיצָה', '🍕', { art: '' }),
    W('ice cream', 'גְּלִידָה', '🍦', { art: '' })
  ];
  // ---------- house 4: body, face and clothes (parts with no clear emoji are shown on a drawing) ----------
  var FACE_PARTS = ['hair', 'face', 'eyes', 'ears', 'mouth', 'nose', 'cheek'];
  var H4 = [
    W('head', 'רֹאשׁ', null, { fig: bodyFig('head'), x: FACE_PARTS, near: ['hair', 'hands'] }), W('shoulders', 'כְּתֵפַיִם', null, { fig: bodyFig('shoulders') }),
    W('knees', 'בִּרְכַּיִם', null, { fig: bodyFig('knees'), x: ['legs', 'toes', 'feet'] }), W('toes', 'אֶצְבְּעוֹת הָרַגְלַיִם', null, { x: ['feet', 'legs'] }),
    W('eyes', 'עֵינַיִם', '👀', { fig: faceFig('eyes') }), W('ears', 'אָזְנַיִם', '👂', { fig: faceFig('ears') }),
    W('mouth', 'פֶּה', '👄', { fig: faceFig('mouth') }), W('nose', 'אַף', '👃', { fig: faceFig('nose') }),
    W('hands', 'יָדַיִם', '👐', { fig: bodyFig('hands') }), W('feet', 'כַּפּוֹת רַגְלַיִם', '🦶', { fig: bodyFig('feet'), x: ['legs'] }),
    W('face', 'פָּנִים', null, { x: FACE_PARTS }), W('hair', 'שֵׂעָר', null, { fig: faceFig('hair') }),
    W('legs', 'רַגְלַיִם', '🦵', { fig: bodyFig('legs') }), W('cheek', 'לֶחִי', null, { fig: faceFig('cheek') }),
    W('shirt', 'חֻלְצָה', '👕'), W('hat', 'כּוֹבַע', '🎩'), W('shoe', 'נַעַל', '👟'), W('pants', 'מִכְנָסַיִם', '👖'),
    W('big', 'גָּדוֹל', null), W('small', 'קָטָן', null)
  ];
  // ---------- house 5: home, family, school and things (mother, father, teacher: no clear picture, Hebrew meaning only) ----------
  var KIN = ['mother', 'father', 'grandma', 'grandpa', 'boy', 'girl'];
  var H5 = [
    W('house', 'בַּיִת', '🏠', { art: 'a' }), W('door', 'דֶּלֶת', '🚪', { art: 'a' }), W('window', 'חַלּוֹן', null, { art: 'a', svg: windowSvg }),
    W('chair', 'כִּסֵּא', '🪑', { art: 'a' }), W('table', 'שֻׁלְחָן', null, { art: 'a', svg: tableSvg }), W('school', 'בֵּית סֵפֶר', '🏫', { art: 'a' }),
    W('teacher', 'מוֹרָה', null), W('family', 'מִשְׁפָּחָה', '👪', { art: 'a', x: KIN }), W('mother', 'אִמָּא', null, { near: ['father'] }),
    W('father', 'אַבָּא', null, { near: ['mother'] }), W('grandma', 'סָבְתָא', '👵', { art: '' }), W('grandpa', 'סָבָא', '👴', { art: '' }),
    W('boy', 'יֶלֶד', '👦', { art: 'a' }), W('girl', 'יַלְדָּה', '👧', { art: 'a' }), W('bus', 'אוֹטוֹבּוּס', '🚌', { art: 'a' }),
    W('car', 'מְכוֹנִית', '🚗', { art: 'a' }), W('train', 'רַכֶּבֶת', '🚂', { art: 'a' }), W('boat', 'סִירָה', '⛵', { art: 'a' }),
    W('tree', 'עֵץ', '🌳', { art: 'a' }), W('flower', 'פֶּרַח', '🌷', { art: 'a' }), W('sun', 'שֶׁמֶשׁ', '☀️', { art: 'the' }), W('ball', 'כַּדּוּר', '⚽', { art: 'a' })
  ];
  // ---------- house 6: feelings and actions (base form, as in "Jump!") ----------
  var H6 = [
    W('happy', 'שָׂמֵחַ', '😀', { x: ['excited'], near: ['hungry'] }), W('sad', 'עָצוּב', '😢'), W('angry', 'כּוֹעֵס', '😠', { near: ['hungry'] }),
    W('scared', 'מְפַחֵד', '😱'), W('tired', 'עָיֵף', null, { x: ['sleepy', 'sleep'] }), W('hungry', 'רָעֵב', null, { near: ['angry'] }),
    W('sleepy', 'יַשְׁנוּנִי', null, { x: ['sleep'] }), W('excited', 'נִרְגָּשׁ', null), W('jump', 'לִקְפֹּץ', null, { x: ['hop'] }),
    W('clap', 'לִמְחֹא כַּפַּיִם', '👏'), W('run', 'לָרוּץ', '🏃', { x: ['walk'] }), W('walk', 'לָלֶכֶת', '🚶'),
    W('sit', 'לָשֶׁבֶת', null), W('sleep', 'לִישֹׁן', '😴'), W('dance', 'לִרְקֹד', '💃'), W('sing', 'לָשִׁיר', null),
    W('hop', 'לְקַפֵּץ עַל רֶגֶל אַחַת', null), W('stomp', 'לִרְקֹעַ', null), W('turn around', 'לְהִסְתּוֹבֵב', null),
    W('wave', 'לְנַפְנֵף', '👋'), W('hug', 'חִבּוּק', null), W('open', 'לִפְתֹּחַ', null, { near: ['close'] }),
    W('close', 'לִסְגֹּר', null, { near: ['open'] }), W('stop', 'עֲצֹר', '🛑')
  ];

  // ---------- house 7: phrases, built in code: number / colour / big-small + noun ----------
  var NUM = [null, ['one', 'אַחַת'], ['two', 'שְׁתַּיִם'], ['three', 'שָׁלוֹשׁ'], ['four', 'אַרְבַּע'], ['five', 'חָמֵשׁ'], ['six', 'שֵׁשׁ'], ['seven', 'שֶׁבַע'], ['eight', 'שְׁמוֹנֶה'], ['nine', 'תֵּשַׁע'], ['ten', 'עֶשֶׂר']];
  // nouns with a regular plural only (no fish, sheep, feet)
  var NOUN = [
    ['cat', 'חָתוּל', '🐱'], ['dog', 'כֶּלֶב', '🐶'], ['cow', 'פָּרָה', '🐮'], ['lion', 'אַרְיֵה', '🦁'], ['frog', 'צְפַרְדֵּעַ', '🐸'], ['rabbit', 'אַרְנָב', '🐰'],
    ['duck', 'בַּרְוָז', '🦆'], ['apple', 'תַּפּוּחַ', '🍎'], ['banana', 'בָּנָנָה', '🍌'], ['egg', 'בֵּיצָה', '🥚'], ['carrot', 'גֶּזֶר', '🥕'], ['cake', 'עוּגָה', '🍰'],
    ['car', 'מְכוֹנִית', '🚗'], ['tree', 'עֵץ', '🌳'], ['flower', 'פֶּרַח', '🌷'], ['ball', 'כַּדּוּר', '⚽'], ['hat', 'כּוֹבַע', '🎩'], ['house', 'בַּיִת', '🏠']
  ];
  var COL = [['red', 'אָדֹם'], ['blue', 'כָּחֹל'], ['yellow', 'צָהֹב'], ['green', 'יָרֹק'], ['orange', 'כָּתֹם'], ['purple', 'סָגֹל'], ['pink', 'וָרֹד'], ['black', 'שָׁחֹר']];
  var OBJ = [['ball', 'כַּדּוּר', COL], ['car', 'מְכוֹנִית', COL], ['flower', 'פֶּרַח', COL.filter(function (c) { return c[0] !== 'green' && c[0] !== 'black'; })]];
  var SIZE = { big: ['big', 'גָּדוֹל', 'הַגְּדוֹלָה'], small: ['small', 'קָטָן', 'הַקְּטַנָּה'] };
  var EM_BIG = 'font-size:clamp(40px,11vmin,80px);line-height:1.05', EM_SMALL = 'font-size:clamp(19px,4.8vmin,34px);line-height:1.05';
  function emGroup(e, n, many) { // n pictures, five in a row
    return EM(rep(e, Math.min(n, 5)) + (n > 5 ? '<br>' + rep(e, n - 5) : ''), 'white-space:nowrap;line-height:1.3;font-size:' + (many ? 'clamp(17px,4.6vmin,34px)' : 'clamp(24px,6.5vmin,48px)'));
  }
  function art(word) { return /^[aeio]/.test(word) ? 'an' : 'a'; }
  function colorStep(c) { return { say: c[0] + ' בְּעִבְרִית: ' + c[1] + '.', svg: wrap(dotIn(HEX[c[0]]), 90, 70, 220, '#e9e2f5') }; }
  function objStep(o) { return { say: o[0] + ' בְּעִבְרִית: ' + o[1] + '.', svg: oneSvg(o[0], '#c9c2d6', false, 220) }; }
  function otherObj(r, K, o, c) { return K.pick(r, OBJ.filter(function (x) { return x !== o && x[2].indexOf(c) >= 0; })); }
  function phraseQ(r, K, say, opts, html, ex, tip) {
    return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?', say: say, answer: opts[0], options: opts, optHtml: html, tip: 'בְּעִבְרִית: ' + tip + '.', ex: ex, key: say });
  }
  function countQ(r, K) { // "three cats"
    var n = K.ri(r, 1, 10), a = K.pick(r, NOUN), b = K.pick(r, NOUN.filter(function (x) { return x !== a; }));
    var ns = K.sample(r, [n - 2, n - 1, n + 1, n + 2].filter(function (v) { return v >= 1 && v <= 10; }), 2);
    var list = [[n, a], [ns[0], a], [ns[1], a], [n, b]], many = Math.max(n, ns[0], ns[1]) > 3, html = {}, say = NUM[n][0] + ' ' + a[0] + (n > 1 ? 's' : '');
    var opts = list.map(function (p) { var v = p[0] + ' ' + p[1][0]; html[v] = emGroup(p[1][2], p[0], many); return v; });
    return phraseQ(r, K, say, opts, html, [
      { say: 'שׁוֹמְעִים שְׁתֵּי מִלִּים: ' + say + '.', big: say, ltr: true },
      { say: NUM[n][0] + ' בְּעִבְרִית: ' + NUM[n][1] + '.', big: String(n), ltr: true },
      { say: a[0] + ' בְּעִבְרִית: ' + a[1] + '.', big: a[2] + ' ' + a[0], ltr: true },
      { say: 'סוֹפְרִים בַּתְּמוּנוֹת: ' + say + '.', big: rep(a[2], n), ltr: true }
    ], NUM[n][1] + ', ' + a[1]);
  }
  function sizeQ(r, K) { // "a big dog"
    var z = r() < 0.5 ? 'big' : 'small', zz = z === 'big' ? 'small' : 'big', a = K.pick(r, NOUN), b = K.pick(r, NOUN.filter(function (x) { return x !== a; }));
    var html = {}, say = 'a ' + z + ' ' + a[0];
    var opts = [[z, a], [zz, a], [z, b], [zz, b]].map(function (p) { var v = p[0] + ' ' + p[1][0]; html[v] = EM(p[1][2], p[0] === 'big' ? EM_BIG : EM_SMALL); return v; });
    return phraseQ(r, K, say, opts, html, [
      { say: 'שׁוֹמְעִים: ' + say + '.', big: say, ltr: true },
      { say: z + ' בְּעִבְרִית: ' + SIZE[z][1] + '.', big: z, ltr: true },
      { say: a[0] + ' בְּעִבְרִית: ' + a[1] + '.', big: a[2] + ' ' + a[0], ltr: true },
      { say: 'מְחַפְּשִׂים אֶת הַתְּמוּנָה ' + SIZE[z][2] + ' שֶׁל ' + a[0] + '.' }
    ], SIZE[z][1] + ', ' + a[1]);
  }
  function colorQ(r, K) { // "a red car"
    var o = K.pick(r, OBJ), c = K.pick(r, o[2]), cs = K.sample(r, o[2].filter(function (x) { return x !== c; }), 2), o2 = otherObj(r, K, o, c);
    var html = {}, say = art(c[0]) + ' ' + c[0] + ' ' + o[0];
    var opts = [[c, o], [cs[0], o], [cs[1], o], [c, o2]].map(function (p) { var v = p[0][0] + ' ' + p[1][0]; html[v] = oneSvg(p[1][0], HEX[p[0][0]], false, 90); return v; });
    return phraseQ(r, K, say, opts, html, [colorStep(c), objStep(o), { say: 'בְּיַחַד: ' + say + '.', svg: oneSvg(o[0], HEX[c[0]], false, 220) }], c[1] + ', ' + o[1]);
  }
  function countColorQ(r, K) { // "three red balls"
    var n = K.ri(r, 2, 4), o = K.pick(r, OBJ), c = K.pick(r, o[2]), c2 = K.pick(r, o[2].filter(function (x) { return x !== c; })), o2 = otherObj(r, K, o, c);
    var n2 = K.pick(r, [n - 1, n + 1].filter(function (v) { return v >= 1 && v <= 4; })), html = {}, say = NUM[n][0] + ' ' + c[0] + ' ' + o[0] + 's';
    var opts = [[n, c, o], [n2, c, o], [n, c2, o], [n, c, o2]].map(function (p) { var v = p[0] + ' ' + p[1][0] + ' ' + p[2][0]; html[v] = rowSvg(p[2][0], HEX[p[1][0]], p[0], 150); return v; });
    return phraseQ(r, K, say, opts, html, [
      { say: NUM[n][0] + ' בְּעִבְרִית: ' + NUM[n][1] + '.', big: String(n), ltr: true }, colorStep(c), objStep(o),
      { say: 'בְּיַחַד: ' + say + '.', svg: rowSvg(o[0], HEX[c[0]], n, 300) }
    ], NUM[n][1] + ', ' + c[1] + ', ' + o[1]);
  }
  function sizeColorQ(r, K) { // "a big red ball"
    var z = r() < 0.5 ? 'big' : 'small', zz = z === 'big' ? 'small' : 'big', o = K.pick(r, OBJ), c = K.pick(r, o[2]), c2 = K.pick(r, o[2].filter(function (x) { return x !== c; })), o2 = otherObj(r, K, o, c);
    var html = {}, say = 'a ' + z + ' ' + c[0] + ' ' + o[0];
    var opts = [[z, c, o], [zz, c, o], [z, c2, o], [z, c, o2]].map(function (p) { var v = p[0] + ' ' + p[1][0] + ' ' + p[2][0]; html[v] = oneSvg(p[2][0], HEX[p[1][0]], p[0] === 'small', 90); return v; });
    return phraseQ(r, K, say, opts, html, [
      { say: z + ' בְּעִבְרִית: ' + SIZE[z][1] + '.', big: z, ltr: true }, colorStep(c), objStep(o),
      { say: 'בְּיַחַד: ' + say + '.', svg: oneSvg(o[0], HEX[c[0]], z === 'small', 220) }
    ], SIZE[z][1] + ', ' + c[1] + ', ' + o[1]);
  }
  function phrases(r, K) {
    var x = r();
    return x < 0.34 ? countQ(r, K) : x < 0.56 ? sizeQ(r, K) : x < 0.76 ? colorQ(r, K) : x < 0.9 ? countColorQ(r, K) : sizeColorQ(r, K);
  }

  // ---------- house 8: greetings, instructions and classroom sentences ----------
  var H8 = [
    W('Hello!', 'שָׁלוֹם!', '👋', { x: ['Goodbye!'] }), W('Good morning!', 'בֹּקֶר טוֹב!', null), W('Goodbye!', 'לְהִתְרָאוֹת!', null),
    W('How are you?', 'מַה שְּׁלוֹמְכֶם?', null), W('I\'m fine.', 'אֲנִי בְּסֵדֶר.', null), W('Thank you!', 'תּוֹדָה!', null),
    W('What\'s your name?', 'אֵיךְ קוֹרְאִים לָכֶם?', null), W('My name is Dana.', 'קוֹרְאִים לִי דָּנָה.', null),
    W('Stand up, please.', 'קוּמוּ, בְּבַקָּשָׁה.', null), W('Sit down, please.', 'שְׁבוּ, בְּבַקָּשָׁה.', null),
    W('Listen!', 'הַקְשִׁיבוּ!', '👂'), W('Look!', 'הִסְתַּכְּלוּ!', '👀'), W('Stop!', 'עִצְרוּ!', '🛑'), W('Quiet, please.', 'שֶׁקֶט, בְּבַקָּשָׁה.', '🤫'),
    W('Wash your hands.', 'שִׁטְפוּ יָדַיִם.', null), W('One more time!', 'עוֹד פַּעַם!', null), W('Let\'s sing!', 'בּוֹאוּ נָשִׁיר!', null),
    W('Let\'s play!', 'בּוֹאוּ נְשַׂחֵק!', null), W('Are you ready?', 'אַתֶּם מוּכָנִים?', null), W('Well done!', 'כָּל הַכָּבוֹד!', '👍'),
    W('How many?', 'כַּמָּה?', null), W('Let\'s be friends.', 'בּוֹאוּ נִהְיֶה חֲבֵרִים.', null)
  ];
  var H8PIC = H8.filter(function (x) { return x.em; });
  function sentSteps(a) {
    return [
      { say: 'שׁוֹמְעִים: ' + a.en, big: a.en, ltr: true },
      a.em ? { say: 'בְּעִבְרִית: ' + a.he, big: a.em, ltr: true } : { say: 'בְּעִבְרִית: ' + a.he, big: a.he },
      { say: 'אוֹמְרִים יַחַד בְּקוֹל: ' + a.en, big: a.en, ltr: true }
    ];
  }
  function sentences(r, K) {
    var x = r(), a, b, ds, html = {}, truth;
    if (x < 0.2) { // a picture of the situation
      a = K.pick(r, H8PIC); ds = others(r, K, a, H8PIC, 2);
      [a].concat(ds).forEach(function (s) { html[s.he] = EM(s.em); });
      return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?', say: a.en, answer: a.he, options: [a].concat(ds).map(function (s) { return s.he; }), optHtml: html,
        tip: 'בְּעִבְרִית: ' + a.he, ex: sentSteps(a), key: 'p|' + a.en });
    }
    a = K.pick(r, H8);
    if (x < 0.65) { // the Hebrew meaning
      ds = others(r, K, a, H8, 2);
      return K.q(r, { text: 'מָה פֵּרוּשׁ הַמִּשְׁפָּט?', say: a.en, answer: a.he, options: [a].concat(ds).map(function (s) { return s.he; }),
        tip: a.em ? 'רֶמֶז: ' + a.em : LISTEN, ex: sentSteps(a), key: 'h|' + a.en });
    }
    truth = r() < 0.5; b = truth ? a : others(r, K, a, H8, 1)[0]; // a is heard, the meaning of b is on the screen
    return K.tf(r, { fmt: 'tf', text: 'הַפֵּרוּשׁ: ' + b.he, say: a.en, tip: LISTEN, key: 't|' + a.en + '|' + b.en,
      ex: [
        { say: 'שׁוֹמְעִים: ' + a.en, big: a.en, ltr: true },
        { say: 'בְּעִבְרִית: ' + a.he, big: a.he },
        truth ? { say: 'זֶה הַפֵּרוּשׁ שֶׁעַל הַמָּסָךְ, לָכֵן הַתְּשׁוּבָה: נָכוֹן.' }
          : { say: 'הַפֵּרוּשׁ שֶׁעַל הַמָּסָךְ שַׁיָּךְ לְמִשְׁפָּט אַחֵר, לָכֵן הַתְּשׁוּבָה: לֹא נָכוֹן.', big: b.en, ltr: true }
      ] }, truth);
  }

  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'eng',
    grade: 2,
    tiles: [{
      id: 'eng2words',
      world: 'מִלִּים רִאשׁוֹנוֹת',
      name: 'שׁוֹמְעִים מִלָּה וּמוֹצְאִים תְּמוּנָה',
      icon: '🐶',
      bld: 'house2',
      hero: 'טוֹפִי',
      levels: [
        { name: 'צְבָעִים וּמִסְפָּרִים', f: house(H1, { pic: 0.5, heb: 0.38 }) },
        { name: 'בַּעֲלֵי חַיִּים', f: house(H2, { pic: 0.42, heb: 0.26, tf: 0.22 }) },
        { name: 'אֹכֶל', f: house(H3, { pic: 0.45, heb: 0.3, tf: 0.25 }) },
        { name: 'גּוּף, פָּנִים וּבְגָדִים', f: house(H4, { pic: 0.3, heb: 0.4, fig: 0.3 }) },
        { name: 'בַּיִת, מִשְׁפָּחָה וּבֵית סֵפֶר', f: house(H5, { pic: 0.42, heb: 0.33, tf: 0.25 }) },
        { name: 'רְגָשׁוֹת וּפְעֻלּוֹת', f: house(H6, { pic: 0.34, heb: 0.54 }) }
      ]
    }, {
      id: 'eng2talk',
      world: 'מְדַבְּרִים אַנְגְּלִית',
      name: 'צֵרוּפִים וּמִשְׁפָּטִים קְצָרִים',
      icon: '👋',
      bld: 'towerSmall',
      hero: 'בּוֹבּוֹ',
      levels: [
        { name: 'צֵרוּפֵי מִלִּים', f: phrases },
        { name: 'בְּרָכוֹת וְהוֹרָאוֹת', f: sentences }
      ]
    }]
  });
})();
