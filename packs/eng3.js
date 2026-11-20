(function () {
  'use strict';
  // English, grade 3 (Pre-A1): listening first, then sounds by ear, then the letters, and reading of short words last.
  var INK = '#3b2a55', RED = '#e53935', FONT = 'font-family="Arial, Helvetica, sans-serif" font-weight="700"';
  var ABC = 'abcdefghijklmnopqrstuvwxyz';

  // ---------- pictures ----------
  var EMO = {
    boy: '👦', girl: '👧', baby: '👶', mom: '👩', dad: '👨', dog: '🐶', cat: '🐱',
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', orange: '🟠', black: '⚫', white: '⚪', brown: '🟤',
    zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12',
    house: '🏠', door: '🚪', bed: '🛏️', sofa: '🛋️', window: '🪟', chair: '🪑', bag: '🎒', book: '📕', pencil: '✏️', pen: '🖊️',
    notebook: '📓', computer: '💻', box: '📦', school: '🏫', teacher: '👩‍🏫', picture: '🖼️', gift: '🎁', hat: '🎩', ball: '⚽',
    umbrella: '☂️', car: '🚗', bus: '🚌', hand: '✋', nose: '👃', mouth: '👄', eyes: '👀', ear: '👂', leg: '🦵', foot: '🦶',
    duck: '🦆', hen: '🐔', rabbit: '🐰', horse: '🐴', elephant: '🐘', mouse: '🐭', sheep: '🐑', cow: '🐮', fish: '🐟', monkey: '🐵',
    bird: '🐦', snake: '🐍', apple: '🍎', egg: '🥚', carrot: '🥕', milk: '🥛', cookie: '🍪', chicken: '🍗', juice: '🧃',
    'ice cream': '🍦', candy: '🍬', cake: '🎂', bread: '🍞', cheese: '🧀', chocolate: '🍫', sun: '☀️', tree: '🌳', king: '🤴', queen: '👸',
    happy: '😀', sad: '😢', hot: '🥵', cold: '🥶', run: '🏃', swim: '🏊', sing: '🎤', sleep: '😴', eat: '🍽️',
    lemon: '🍋', violin: '🎻', water: '💧', net: '🥅', van: '🚐', bat: '🦇', rat: '🐀', pan: '🍳', map: '🗺️', cap: '🧢',
    frog: '🐸', fox: '🦊', bug: '🐛', mug: '☕', ring: '💍', star: '⭐', bee: '🐝', moon: '🌙', spoon: '🥄', sock: '🧦', clock: '🕒',
    truck: '🚚', bell: '🔔', shell: '🐚', banana: '🍌', tomato: '🍅', potato: '🥔', kangaroo: '🦘', hamburger: '🍔', butterfly: '🦋',
    dinosaur: '🦕', pig: '🐷', cup: '🥤', web: '🕸️', ant: '🐜', key: '🔑', kite: '🪁', lion: '🦁', octopus: '🐙', tiger: '🐯',
    up: '⬆️', watch: '⌚', zebra: '🦓', 'yo-yo': '🪀', jet: '✈️', can: '🥫', ham: '🍖', mad: '😠', cab: '🚕', man: '👨',
    lip: '👄', kid: '🧒', bin: '🗑️', pot: '🍲', log: '🪵', nut: '🥜', hug: '🤗', cut: '✂️', doll: '🪆',
    ship: '🚢', shop: '🏪', dish: '🍽️', cash: '💵', chip: '🍟', chick: '🐥', chat: '💬', lunch: '🥪', bath: '🛁'
  };
  function em(x) { return '<span class="em">' + x + '</span>'; }
  function pics(ws) { var o = {}; ws.forEach(function (w) { o[w] = em(EMO[w]); }); return o; }
  function isVowel(c) { return 'aeiou'.indexOf(c) >= 0; }

  // ---------- drawings ----------
  // a written word: the vowel in red and the consonants dark (the flip chart of the class); mode: number = red from that letter on, [from, to] = red in that range, 'none' = all dark
  function letters(w, mode) {
    var s = '', i, c, red;
    for (i = 0; i < w.length; i++) {
      c = w.charAt(i);
      red = mode === 'none' ? false : typeof mode === 'number' ? i >= mode : Array.isArray(mode) ? i >= mode[0] && i < mode[1] : isVowel(c) || c === '_';
      s += '<tspan fill="' + (red ? RED : INK) + '">' + c + '</tspan>';
    }
    return s;
  }
  function wordSvg(w, mode) {
    var fs = w.length <= 4 ? 84 : w.length <= 6 ? 64 : 48;
    return '<svg viewBox="0 0 300 110" width="300" height="110"><text x="150" y="82" text-anchor="middle" ' + FONT + ' font-size="' + fs + '">' + letters(w, mode) + '</text></svg>';
  }
  function wordsSvg(ws, modes) {
    var n = ws.length, fs = n === 2 ? 56 : 42, s = '<svg viewBox="0 0 320 110" width="320" height="110">', i;
    for (i = 0; i < n; i++) s += '<text x="' + Math.round(320 * (i + 0.5) / n) + '" y="74" text-anchor="middle" ' + FONT + ' font-size="' + fs + '">' + letters(ws[i], modes ? modes[i] : undefined) + '</text>';
    return s + '</svg>';
  }
  // writing lines as a house: roof (pink), house (yellow), basement (blue)
  function linesSvg(chars) {
    var w = 40 + chars.length * 80, s = '<svg viewBox="0 0 ' + w + ' 150" width="' + w + '" height="150">', i;
    s += '<rect x="0" y="22" width="' + w + '" height="22" fill="#ffe1ee"/><rect x="0" y="44" width="' + w + '" height="58" fill="#fff3c4"/><rect x="0" y="102" width="' + w + '" height="26" fill="#dcefff"/>';
    [22, 44, 102, 128].forEach(function (y) { s += '<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y + '" stroke="' + INK + '" stroke-width="' + (y === 102 ? 3 : 1.5) + '"/>'; });
    for (i = 0; i < chars.length; i++) s += '<text x="' + (60 + i * 80) + '" y="102" text-anchor="middle" ' + FONT + ' font-size="112" fill="' + INK + '">' + chars[i] + '</text>';
    return s + '</svg>';
  }
  // three letter tiles in a row with arrows; '?' is the missing one
  function seqSvg(items) {
    var s = '<svg viewBox="0 0 270 84" width="270" height="84">', i, x;
    for (i = 0; i < items.length; i++) {
      x = 9 + i * 94;
      s += '<rect x="' + x + '" y="10" width="64" height="64" rx="12" fill="' + (items[i] === '?' ? '#ffb300' : '#ffffff') + '" stroke="' + INK + '" stroke-width="3"/>';
      s += '<text x="' + (x + 32) + '" y="58" text-anchor="middle" ' + FONT + ' font-size="44" fill="' + INK + '">' + items[i] + '</text>';
      if (i < items.length - 1) s += '<path d="M' + (x + 70) + ' 42 H' + (x + 86) + ' M' + (x + 80) + ' 35 L' + (x + 88) + ' 42 L' + (x + 80) + ' 49" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    return s + '</svg>';
  }
  // the alphabet chart of the classroom wall, one letter marked
  function abcSvg(idx, upper) {
    var s = '<svg viewBox="0 0 320 78" width="320" height="78">', i, x, y, c;
    for (i = 0; i < 26; i++) {
      x = 4 + (i % 13) * 24; y = 4 + Math.floor(i / 13) * 36; c = upper ? ABC.charAt(i).toUpperCase() : ABC.charAt(i);
      s += '<rect x="' + x + '" y="' + y + '" width="22" height="32" rx="4" fill="' + (i === idx ? '#ffb300' : '#ffffff') + '" stroke="' + INK + '" stroke-width="1.5"/>';
      s += '<text x="' + (x + 11) + '" y="' + (y + 23) + '" text-anchor="middle" ' + FONT + ' font-size="19" fill="' + INK + '">' + c + '</text>';
    }
    return s + '</svg>';
  }
  // a board of 8 letters; mark = the letter to paint (in the explanation)
  function boardSvg(cells, mark) {
    var s = '<svg viewBox="0 0 264 136" width="264" height="136">', i, x, y;
    for (i = 0; i < cells.length; i++) {
      x = 6 + (i % 4) * 64; y = 6 + Math.floor(i / 4) * 64;
      s += '<rect x="' + x + '" y="' + y + '" width="58" height="58" rx="10" fill="' + (cells[i] === mark ? '#ffb300' : '#ffffff') + '" stroke="' + INK + '" stroke-width="2.5"/>';
      s += '<text x="' + (x + 29) + '" y="' + (y + 43) + '" text-anchor="middle" ' + FONT + ' font-size="40" fill="' + INK + '">' + cells[i] + '</text>';
    }
    return s + '</svg>';
  }
  // small scenes made of pictures
  function E(e, x, y, fs) { return '<text x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="middle" dominant-baseline="central">' + e + '</text>'; }
  function wrap(inner, big) { return '<svg viewBox="0 0 120 90" width="' + (big ? 220 : 120) + '" height="' + (big ? 165 : 90) + '">' + inner + '</svg>'; }
  function sceneInner(sc) {
    var s = '', i, rows, per, fs, gap, row, n, k;
    if (sc.t === 'count') {
      n = sc.n; rows = n <= 3 ? 1 : 2; per = Math.ceil(n / rows); gap = Math.min(38, 112 / per); fs = Math.min(32, Math.round(gap * 0.82));
      for (i = 0; i < n; i++) {
        row = Math.floor(i / per); k = row === rows - 1 ? n - per * (rows - 1) : per;
        s += E(sc.e, Math.round(60 + ((i % per) - (k - 1) / 2) * gap), rows === 1 ? 45 : 26 + row * 38, fs);
      }
    } else if (sc.t === 'size') {
      s = E(sc.e, 60, 46, sc.big ? 66 : 20);
    } else if (sc.t === 'box') {
      if (sc.prep === 'on') {
        s = '<rect x="34" y="50" width="52" height="34" fill="#ffb300" stroke="' + INK + '" stroke-width="2.5"/><line x1="34" y1="60" x2="86" y2="60" stroke="' + INK + '" stroke-width="2"/>' + E(sc.e, 60, 33, 30);
      } else {
        s = '<rect x="32" y="40" width="56" height="12" fill="#c98a00" stroke="' + INK + '" stroke-width="2"/>' + E(sc.e, 60, 40, 30) +
          '<rect x="32" y="46" width="56" height="38" fill="#ffb300" stroke="' + INK + '" stroke-width="2.5"/>' +
          '<path d="M32 46 L20 34 M88 46 L100 34" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>';
      }
    } else if (sc.t === 'top') {
      s = E(sc.b, 60, 58, 50) + E(sc.e, 60, 18, 26);
    } else if (sc.t === 'pair') {
      s = E(sc.e, 34, 46, 38) + E(sc.b, 86, 46, 38);
    }
    return s;
  }
  function scene(sc, big) { return wrap(sceneInner(sc), big); }
  function sceneId(sc) { return [sc.t, sc.e, sc.b || '', sc.n || '', sc.prep || '', sc.big ? 'B' : ''].join('|'); }

  // ---------- small helpers ----------
  function others(r, K, pool, n, not) { return K.shuffle(r, pool.filter(function (x) { return not.indexOf(x) < 0; })).slice(0, n); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  var TIP_HEAR = 'אֶפְשָׁר לְהַקִּישׁ עַל הָרַמְקוֹל וְלִשְׁמֹעַ שׁוּב.';

  // =====================================================================================================
  // World 1: listening
  // =====================================================================================================
  function mkBank(groups) {
    var out = [];
    groups.forEach(function (g, gi) { g.split(' ').forEach(function (w) { out.push({ w: w.replace(/_/g, ' '), c: gi }); }); });
    return out;
  }
  var CLASH = [['mom', 'girl'], ['dad', 'boy'], ['book', 'notebook'], ['house', 'school'], ['hen', 'chicken'], ['duck', 'bird'], ['king', 'queen'], ['hot', 'mad']];
  function clash(a, b) { return CLASH.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
  var BANK11 = mkBank(['boy girl baby mom dad dog cat', 'red blue green yellow orange black white brown', 'zero one two three four five six seven eight nine ten eleven twelve']);
  var BANK12 = mkBank(['house door bed sofa window chair picture gift umbrella car bus', 'bag book pencil pen notebook computer box school teacher hat ball', 'hand nose mouth eyes ear leg foot']);
  var BANK13 = mkBank(['duck hen rabbit horse elephant mouse sheep cow fish monkey bird snake', 'apple egg carrot milk cookie chicken juice ice_cream candy cake bread cheese chocolate', 'sun tree king queen happy sad hot cold run swim sing sleep eat']);

  function listenQ(r, K, bank) {
    var it = K.pick(r, bank), w = it.w;
    var same = bank.filter(function (x) { return x.c === it.c && x.w !== w && !clash(w, x.w); }).map(function (x) { return x.w; });
    var ex = [
      { say: 'שָׁמַעְנוּ אֶת הַמִּלָּה ' + w + '. זֹאת הַתְּמוּנָה שֶׁלָּהּ.', big: EMO[w] + '  ' + w, ltr: true },
      { say: 'אוֹמְרִים אוֹתָהּ בְּקוֹל, כְּמוֹ בַּכִּתָּה: ' + w + ', ' + w + '.' }
    ];
    if (r() < 0.3) {
      var truth = r() < 0.5, shown = truth ? w : K.pick(r, same);
      if (!truth) ex.splice(1, 0, { say: 'בַּתְּמוּנָה שֶׁרָאִינוּ: ' + shown + '.', big: EMO[shown] + '  ' + shown, ltr: true });
      return K.tf(r, { text: 'זֹאת הַתְּמוּנָה שֶׁל הַמִּלָּה.', pic: EMO[shown], say: w, tip: TIP_HEAR, ex: ex, key: 'tf|' + w + '|' + shown }, truth);
    }
    var start = same.filter(function (x) { return x.charAt(0) === w.charAt(0); }), opts = [w];
    if (start.length && r() < 0.6) opts.push(K.pick(r, start));
    opts = opts.concat(others(r, K, same, 3 - opts.length, opts));
    opts = opts.filter(function (x, i) { return !opts.slice(0, i).some(function (y) { return clash(x, y); }); });
    return K.q(r, { text: 'בַּחֲרִי אֶת הַתְּמוּנָה שֶׁל הַמִּלָּה.', say: w, answer: w, options: opts, optHtml: pics(opts), tip: TIP_HEAR, ex: ex });
  }

  // --- 1.4 everyday phrases: [English, meaning, a phrase that is easy to confuse with it, the usual reply] ---
  var PH = [
    ['Hello', 'שָׁלוֹם', 'Goodbye', 'Hello!'],
    ['Good morning', 'בֹּקֶר טוֹב', 'Have a good day!', 'Good morning!'],
    ['Goodbye', 'לְהִתְרָאוֹת', 'Hello', 'Goodbye!'],
    ['Thank you', 'תּוֹדָה', 'You\'re welcome', 'You\'re welcome.'],
    ['You\'re welcome', 'עַל לֹא דָּבָר', 'Thank you', ''],
    ['I\'m sorry', 'סְלִיחָה', 'Thank you', ''],
    ['Yes, please', 'כֵּן, בְּבַקָּשָׁה', 'No, thank you', ''],
    ['No, thank you', 'לֹא, תּוֹדָה', 'Yes, please', ''],
    ['What\'s your name?', 'אֵיךְ קוֹרְאִים לָכֶם?', 'How are you?', 'My name is Dan.'],
    ['My name is Dan', 'קוֹרְאִים לִי דָּן', 'What\'s your name?', ''],
    ['How are you?', 'מָה שְׁלוֹמְכֶם?', 'How old are you?', 'I\'m fine, thank you.'],
    ['I\'m fine', 'שְׁלוֹמִי טוֹב', 'How are you?', ''],
    ['How old are you?', 'בְּנֵי כַּמָּה אַתֶּם?', 'How are you?', 'I\'m eight.'],
    ['What is it?', 'מָה זֶה?', 'Who is this?', 'It\'s a dog.'],
    ['Who is this?', 'מִי זֶה?', 'What is it?', 'This is my dad.'],
    ['Where is the dog?', 'אֵיפֹה הַכֶּלֶב?', 'I have a dog', 'It\'s in the box.'],
    ['I have a dog', 'יֵשׁ לִי כֶּלֶב', 'Where is the dog?', ''],
    ['Happy birthday!', 'יוֹם הֻלֶּדֶת שָׂמֵחַ!', 'Have a good day!', 'Thank you!'],
    ['Let\'s play', 'בּוֹאוּ נְשַׂחֵק', 'Let\'s go', ''],
    ['Let\'s go', 'בּוֹאוּ נֵלֵךְ', 'Let\'s play', ''],
    ['Sit down', 'שְׁבוּ', 'Stand up', ''],
    ['Stand up', 'קוּמוּ', 'Sit down', ''],
    ['Stop!', 'עִצְרוּ!', 'Look!', ''],
    ['Look!', 'תִּסְתַּכְּלוּ!', 'Stop!', ''],
    ['Good luck!', 'בְּהַצְלָחָה!', 'Well done!', 'Thank you!'],
    ['Well done!', 'כָּל הַכָּבוֹד!', 'Good luck!', 'Thank you!'],
    ['It\'s hot', 'חַם', 'It\'s cold', ''],
    ['It\'s cold', 'קַר', 'It\'s hot', ''],
    ['How many?', 'כַּמָּה?', 'How old are you?', ''],
    ['No problem!', 'אֵין בְּעָיָה!', 'I\'m sorry', ''],
    ['Open the door', 'פִּתְחוּ אֶת הַדֶּלֶת', 'Close the door', ''],
    ['Close the door', 'סִגְרוּ אֶת הַדֶּלֶת', 'Open the door', ''],
    ['Have a good day!', 'שֶׁיִּהְיֶה יוֹם טוֹב!', 'Good morning', 'Thank you!']
  ];
  function phraseQ(r, K) {
    var p = K.pick(r, PH), near = PH.filter(function (x) { return x[0] === p[2]; })[0];
    var ex = [{ say: 'כָּךְ אוֹמְרִים בְּאַנְגְּלִית: ' + p[1], big: p[0], ltr: true }];
    if (p[3]) ex.push({ say: 'וְכָךְ עוֹנִים:', big: p[3], ltr: true });
    else ex.push({ say: 'אוֹמְרִים אֶת זֶה בְּקוֹל, כְּמוֹ בַּכִּתָּה.' });
    if (r() < 0.3) {
      var truth = r() < 0.5, shown = truth ? p : (r() < 0.6 ? near : K.pick(r, PH.filter(function (x) { return x !== p; })));
      return K.tf(r, { text: 'הַפֵּרוּשׁ: ' + shown[1], say: p[0], tip: TIP_HEAR, ex: ex, key: 'tf|' + p[0] + '|' + shown[0] }, truth);
    }
    var opts = [p[1]];
    if (r() < 0.7) opts.push(near[1]);
    opts = opts.concat(others(r, K, PH.map(function (x) { return x[1]; }), 3 - opts.length, opts));
    return K.q(r, { text: 'מָה זֶה אוֹמֵר?', say: p[0], answer: p[1], options: opts, tip: TIP_HEAR, ex: ex });
  }

  // --- 1.5 short sentences, built by code ---
  var NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var COUNTN = ['dog', 'cat', 'hat', 'egg', 'apple', 'ball', 'car', 'book', 'duck', 'bird', 'hen', 'cake', 'cookie', 'carrot'];
  var BOXN = ['cat', 'dog', 'hen', 'ball', 'egg', 'hat', 'duck', 'apple', 'rabbit', 'mouse', 'bird', 'cookie'];
  function countSent(n, w) { return 'I see ' + NUMW[n] + ' ' + w + (n === 1 ? '' : 's') + '.'; }
  function sentenceHear(r, K) {
    var t = r(), w, w2, sc, wrong, say, ex, opts, html = {};
    if (t < 0.45) {
      var n = K.ri(r, 1, 6), n2 = n === 1 ? 2 : n === 6 ? 5 : n + (r() < 0.5 ? 1 : -1);
      w = K.pick(r, COUNTN); w2 = K.pick(r, COUNTN.filter(function (x) { return x !== w; }));
      sc = { t: 'count', e: EMO[w], n: n }; say = countSent(n, w);
      wrong = [{ t: 'count', e: EMO[w], n: n2 }, { t: 'count', e: EMO[w2], n: n }];
      ex = [{ say: 'שָׁמַעְנוּ: ' + say, svg: scene(sc, true) },
        { say: 'סוֹפְרִים בְּאַנְגְּלִית: ' + NUMW.slice(1, n + 1).join(', ') + '.' },
        { say: 'וְהַמִּלָּה ' + w + ' הִיא הַתְּמוּנָה הַזֹּאת.', big: EMO[w] + '  ' + w, ltr: true }];
      if (r() < 0.3) {
        var tr = r() < 0.5, shown = tr ? sc : K.pick(r, wrong);
        return K.tf(r, { text: 'הַמִּשְׁפָּט מַתְאִים לַתְּמוּנָה.', say: say, svg: scene(shown, true), tip: TIP_HEAR, ex: ex, key: 'tf|' + say + '|' + sceneId(shown) }, tr);
      }
    } else if (t < 0.7) {
      var big = r() < 0.5;
      w = K.pick(r, COUNTN); w2 = K.pick(r, COUNTN.filter(function (x) { return x !== w; }));
      sc = { t: 'size', e: EMO[w], big: big }; say = 'It\'s a ' + (big ? 'big' : 'small') + ' ' + w + '.';
      wrong = [{ t: 'size', e: EMO[w], big: !big }, { t: 'size', e: EMO[w2], big: big }];
      ex = [{ say: 'שָׁמַעְנוּ: ' + say, svg: scene(sc, true) }, { say: 'big זֶה גָּדוֹל, small זֶה קָטָן.', big: 'big  /  small', ltr: true }];
    } else {
      var prep = r() < 0.5 ? 'in' : 'on';
      w = K.pick(r, BOXN); w2 = K.pick(r, BOXN.filter(function (x) { return x !== w; }));
      sc = { t: 'box', e: EMO[w], prep: prep }; say = 'The ' + w + ' is ' + prep + ' the box.';
      wrong = [{ t: 'box', e: EMO[w], prep: prep === 'in' ? 'on' : 'in' }, { t: 'box', e: EMO[w2], prep: prep }];
      ex = [{ say: 'שָׁמַעְנוּ: ' + say, svg: scene(sc, true) }, { say: 'in זֶה בְּתוֹךְ, on זֶה עַל.', big: 'in  /  on', ltr: true }];
      if (r() < 0.3) {
        var tr2 = r() < 0.5, shown2 = tr2 ? sc : K.pick(r, wrong);
        return K.tf(r, { text: 'הַמִּשְׁפָּט מַתְאִים לַתְּמוּנָה.', say: say, svg: scene(shown2, true), tip: TIP_HEAR, ex: ex, key: 'tf|' + say + '|' + sceneId(shown2) }, tr2);
      }
    }
    opts = [sc].concat(wrong).map(function (x) { html[sceneId(x)] = scene(x); return sceneId(x); });
    return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּשְׁפָּט?', say: say, answer: opts[0], options: opts, optHtml: html, tip: TIP_HEAR, ex: ex });
  }

  // =====================================================================================================
  // World 2: sounds, all by ear (whole spoken words only)
  // =====================================================================================================
  var SND = [
    'bag ball bed bus book box bird baby', 'cat car cow king cake cookie key kite carrot cup', 'dog duck door doll dinosaur',
    'hat hen hand horse house hamburger', 'man milk mouse monkey moon map mug', 'pen pencil pig pan pot potato',
    'sun sofa sock star spoon snake', 'tree tiger tomato truck', 'fish foot fox frog', 'red rabbit ring rat',
    'leg lemon lion log', 'nose net notebook nut', 'van violin', 'window water watch web'
  ].map(function (s) { return s.split(' '); });
  function stutter(w) { var c = w.charAt(0); return c + '-' + c + '-' + w; }
  function firstSound(r, K) {
    var gi = K.ri(r, 0, SND.length - 1), g = SND[gi], two = K.sample(r, g, 2), a = two[0], b = two[1];
    var og = K.sample(r, SND.filter(function (x, i) { return i !== gi; }), 2), c = K.pick(r, og[0]), d = K.pick(r, og[1]);
    var t = r(), tip = 'מַקְשִׁיבִים רַק לַהַתְחָלָה שֶׁל הַמִּלָּה.';
    var exSame = [
      { say: 'אוֹמְרִים לְאַט וּמַקְשִׁיבִים לַהַתְחָלָה שֶׁל כָּל מִלָּה.', big: EMO[a] + ' ' + a + '   ' + EMO[b] + ' ' + b, ltr: true },
      { say: 'שְׁתֵּיהֶן מַתְחִילוֹת בְּאוֹתוֹ צְלִיל.', big: stutter(a) + '   ' + stutter(b), ltr: true }
    ];
    if (t < 0.3) {
      var truth = r() < 0.5, o = truth ? b : c;
      return K.tf(r, {
        text: 'שְׁתֵּי הַמִּלִּים מַתְחִילוֹת בְּאוֹתוֹ צְלִיל.', pic: EMO[a] + ' ' + EMO[o], say: a + ', ' + o, tip: tip,
        ex: truth ? exSame : [{ say: 'אוֹמְרִים לְאַט וּמַקְשִׁיבִים לַהַתְחָלָה שֶׁל כָּל מִלָּה.', big: stutter(a) + '   ' + stutter(o), ltr: true }, { say: 'הַהַתְחָלוֹת נִשְׁמָעוֹת שׁוֹנֶה. זֶה לֹא אוֹתוֹ צְלִיל.' }]
      }, truth);
    }
    if (t < 0.7) {
      var opts = [b, c, d];
      return K.q(r, {
        text: 'אֵיזוֹ מִלָּה מַתְחִילָה בְּאוֹתוֹ צְלִיל?', pic: EMO[a], say: a + '. ' + opts.slice().sort().join(', '), answer: b, options: opts, optHtml: pics(opts), tip: tip,
        ex: exSame.concat([{ say: 'הַמִּלִּים ' + c + ', ' + d + ' מַתְחִילוֹת בִּצְלִיל אַחֵר.', big: EMO[c] + ' ' + c + '   ' + EMO[d] + ' ' + d, ltr: true }])
      });
    }
    var three = [a, b, c];
    return K.q(r, {
      text: 'אֵיזוֹ מִלָּה מַתְחִילָה בִּצְלִיל אַחֵר?', say: three.slice().sort().join(', '), answer: c, options: three, optHtml: pics(three), tip: tip,
      ex: exSame.concat([{ say: 'הַמִּלָּה ' + c + ' מַתְחִילָה בִּצְלִיל אַחֵר.', big: EMO[c] + '  ' + stutter(c), ltr: true }])
    });
  }

  var FAM = ['cat hat bat rat', 'man van pan can', 'map cap', 'bed red', 'pen ten hen', 'leg egg', 'dog frog log', 'box fox', 'sun run', 'bug mug hug',
    'king ring', 'cake snake', 'car star', 'bee tree', 'mouse house', 'moon spoon', 'sock clock', 'duck truck', 'bell shell'].map(function (s) { return s.split(' '); });
  function rimeAt(w) { var i = 0; while (i < w.length && !isVowel(w.charAt(i))) i++; return i; }
  function tail(w) { return w.slice(rimeAt(w)).replace(/[aeiou]/g, ''); }
  function rhyme(r, K) {
    var gi = K.ri(r, 0, FAM.length - 1), g = FAM[gi], two = K.sample(r, g, 2), a = two[0], b = two[1];
    var rest = [];
    // a wrong option never ends in the same consonants (pan / pen sound too close to a Hebrew ear)
    FAM.forEach(function (x, i) { if (i !== gi && tail(x[0]) !== tail(a)) rest = rest.concat(x); });
    var start = rest.filter(function (x) { return x.charAt(0) === a.charAt(0); });
    var c = start.length && r() < 0.6 ? K.pick(r, start) : K.pick(r, rest), d = K.pick(r, rest.filter(function (x) { return x !== c; }));
    var t = r(), tip = 'מִלִּים מִתְחָרְזוֹת נִשְׁמָעוֹת אוֹתוֹ דָּבָר בַּסּוֹף.';
    var exSame = [
      { say: 'אוֹמְרִים אֶת שְׁתֵּי הַמִּלִּים זוֹ אַחֲרֵי זוֹ: ' + a + ', ' + b + '.', big: EMO[a] + ' ' + a + '   ' + EMO[b] + ' ' + b, ltr: true },
      { say: 'הַסּוֹף שֶׁלָּהֶן נִשְׁמָע אוֹתוֹ דָּבָר. הֵן מִתְחָרְזוֹת.', svg: wordsSvg([a, b], [rimeAt(a), rimeAt(b)]) }
    ];
    function exDiff(x, y) {
      return [{ say: 'אוֹמְרִים אֶת שְׁתֵּי הַמִּלִּים זוֹ אַחֲרֵי זוֹ: ' + x + ', ' + y + '.', big: EMO[x] + ' ' + x + '   ' + EMO[y] + ' ' + y, ltr: true },
        { say: 'הַסּוֹף שֶׁלָּהֶן נִשְׁמָע שׁוֹנֶה. הֵן לֹא מִתְחָרְזוֹת.', svg: wordsSvg([x, y], [rimeAt(x), rimeAt(y)]) }];
    }
    if (t < 0.3) {
      var truth = r() < 0.5, o = truth ? b : c;
      return K.tf(r, { text: 'שְׁתֵּי הַמִּלִּים מִתְחָרְזוֹת.', pic: EMO[a] + ' ' + EMO[o], say: a + ', ' + o, tip: tip, ex: truth ? exSame : exDiff(a, o) }, truth);
    }
    if (t < 0.7) {
      var opts = [b, c, d];
      return K.q(r, { text: 'אֵיזוֹ מִלָּה מִתְחָרֶזֶת?', pic: EMO[a], say: a + '. ' + opts.slice().sort().join(', '), answer: b, options: opts, optHtml: pics(opts), tip: tip, ex: exSame });
    }
    var three = [a, b, c];
    return K.q(r, {
      text: 'אֵיזוֹ מִלָּה לֹא מִתְחָרֶזֶת?', say: three.slice().sort().join(', '), answer: c, options: three, optHtml: pics(three), tip: tip,
      ex: exSame.concat([{ say: 'הַמִּלָּה ' + c + ' נִגְמֶרֶת בִּצְלִיל אַחֵר.', big: EMO[c] + '  ' + c, ltr: true }])
    });
  }

  var SYL = ['cat', 'dog', 'book', 'bed', 'sun', 'fish', 'milk', 'hat', 'bus', 'egg',
    'ap·ple', 'pen·cil', 'rab·bit', 'mon·key', 'win·dow', 'teach·er', 'ba·by', 'car·rot', 'cook·ie', 'yel·low',
    'el·e·phant', 'com·pu·ter', 'um·brel·la', 'ba·na·na', 'to·ma·to', 'po·ta·to', 'kan·ga·roo', 'ham·bur·ger', 'but·ter·fly', 'di·no·saur'];
  var CLAPS = { 1: '👏', 2: '👏👏', 3: '👏👏👏' }, SYLHE = { 1: 'הֲבָרָה אַחַת', 2: 'שְׁתֵּי הֲבָרוֹת', 3: 'שָׁלֹשׁ הֲבָרוֹת' };
  function syllables(r, K) {
    var s = K.pick(r, SYL), parts = s.split('·'), w = parts.join(''), n = parts.length;
    var ex = [
      { say: 'אוֹמְרִים אֶת הַמִּלָּה לְאַט וּמוֹחֲאִים כַּף עַל כָּל הֲבָרָה.', big: parts.join(' · '), ltr: true },
      { say: 'מָחָאנוּ ' + (n === 1 ? 'כַּף פַּעַם אַחַת' : n === 2 ? 'כַּף פַּעֲמַיִם' : 'כַּף שָׁלֹשׁ פְּעָמִים') + '. בַּמִּלָּה ' + w + ' יֵשׁ ' + SYLHE[n] + '.', big: CLAPS[n], ltr: true }
    ];
    var tip = 'מוֹחֲאִים כַּף עַל כָּל הֲבָרָה וְסוֹפְרִים.';
    if (r() < 0.4) {
      var truth = r() < 0.5, m = truth ? n : K.pick(r, [1, 2, 3].filter(function (x) { return x !== n; }));
      return K.tf(r, { text: 'בַּמִּלָּה הַזֹּאת יֵשׁ ' + SYLHE[m] + '.', pic: EMO[w], say: w, tip: tip, ex: ex }, truth);
    }
    return K.q(r, { text: 'כַּמָּה הֲבָרוֹת יֵשׁ בַּמִּלָּה?', pic: EMO[w], say: w, answer: '' + n, options: ['1', '2', '3'], keep: true, optHtml: { 1: em(CLAPS[1]), 2: em(CLAPS[2]), 3: em(CLAPS[3]) }, tip: tip, ex: ex });
  }

  // =====================================================================================================
  // World 3: the letters
  // =====================================================================================================
  var LOW_SIM = { a: 'eo', b: 'dpq', c: 'eo', d: 'bpq', e: 'ca', f: 'tk', g: 'qjy', h: 'nb', i: 'jt', j: 'ig', k: 'xh', l: 'tf', m: 'nw', n: 'muh', o: 'ac', p: 'qbd', q: 'pgd', r: 'nt', s: 'zc', t: 'fl', u: 'nv', v: 'wuy', w: 'vm', x: 'kz', y: 'vg', z: 'sx' };
  var UP_SIM = { A: 'HV', B: 'DPR', C: 'GO', D: 'BO', E: 'FL', F: 'ET', G: 'CQ', H: 'NK', I: 'LTJ', J: 'IL', K: 'HX', L: 'IT', M: 'WN', N: 'MH', O: 'QC', P: 'RB', Q: 'OG', R: 'PB', S: 'ZC', T: 'IL', U: 'VN', V: 'WU', W: 'MV', X: 'KY', Y: 'VX', Z: 'SN' };
  function simOpts(r, K, ans, sim, all, n) {
    var o = [ans].concat(K.shuffle(r, sim.split('')));
    o = o.concat(others(r, K, all.split(''), 4, o)).slice(0, n);
    return o;
  }
  function zoneSay(l) {
    return 'gjpqy'.indexOf(l) >= 0 ? 'הָאוֹת הַקְּטַנָּה ' + l + ' יוֹרֶדֶת לַמַּרְתֵּף.' : 'bdfhklt'.indexOf(l) >= 0 ? 'הָאוֹת הַקְּטַנָּה ' + l + ' עוֹלָה גַּם לַגַּג.' : 'הָאוֹת הַקְּטַנָּה ' + l + ' נִשְׁאֶרֶת בַּבַּיִת.';
  }
  function bigSmall(r, K) {
    var l = ABC.charAt(K.ri(r, 0, 25)), U = l.toUpperCase(), t = r();
    var tip = 'לְכָל אוֹת יֵשׁ צוּרָה גְּדוֹלָה וְצוּרָה קְטַנָּה.';
    var ex = [
      { say: 'הָאוֹת הַגְּדוֹלָה ' + U + ' וְהָאוֹת הַקְּטַנָּה ' + l + ' הֵן אוֹתָהּ אוֹת.', svg: linesSvg([U, l]) },
      { say: 'אוֹת גְּדוֹלָה תָּמִיד גָּרָה בַּבַּיִת וּבַגַּג.' },
      { say: zoneSay(l) }
    ];
    if (t < 0.4) return K.q(r, { text: 'מָה הָאוֹת הַקְּטַנָּה שֶׁל הָאוֹת הַזֹּאת?', svg: linesSvg([U]), say: U, answer: l, options: simOpts(r, K, l, LOW_SIM[l], ABC.replace(l === 'i' ? 'l' : '~', ''), 4), optLtr: true, tip: tip, ex: ex });
    if (t < 0.8) return K.q(r, { text: 'מָה הָאוֹת הַגְּדוֹלָה שֶׁל הָאוֹת הַזֹּאת?', svg: linesSvg([l]), answer: U, options: simOpts(r, K, U, UP_SIM[U], ABC.toUpperCase(), 4), optLtr: true, tip: tip, ex: ex });
    var truth = r() < 0.5, x = truth ? l : K.pick(r, LOW_SIM[l].split(''));
    return K.tf(r, { text: 'זֹאת אוֹתָהּ אוֹת: גְּדוֹלָה וּקְטַנָּה.', svg: linesSvg([U, x]), tip: tip, ex: ex, key: 'tf|' + U + x }, truth);
  }

  var LW = { a: 'apple ant', b: 'bag bed ball', c: 'cat car cow', d: 'dog duck door', e: 'egg elephant', f: 'fish foot frog', g: 'gift girl', h: 'hat hen hand',
    j: 'juice jet', k: 'king key kite', l: 'leg lemon lion', m: 'man milk mouse', n: 'nose net notebook', o: 'octopus orange', p: 'pen pencil pig', q: 'queen',
    r: 'rabbit red ring', s: 'sun sofa snake', t: 'tree tiger tomato', u: 'umbrella up', v: 'van violin', w: 'window water watch', y: 'yellow yo-yo', z: 'zebra' };
  var LWK = Object.keys(LW), LWALL = [];
  LWK.forEach(function (k) { LW[k] = LW[k].split(' '); LW[k].forEach(function (w) { LWALL.push(w); }); });
  var SAMESND = { c: 'kq', k: 'cq', q: 'ck' };
  function letterSound(r, K) {
    var tip = 'אוֹמְרִים אֶת הַמִּלָּה וּמַקְשִׁיבִים לַצְּלִיל הָרִאשׁוֹן שֶׁלָּהּ.';
    if (r() < 0.6) {
      var w = K.pick(r, LWALL), l = w.charAt(0), bad = (SAMESND[l] || '') + 'x';
      var two = LW[l].filter(function (x) { return x !== w; });
      var o = [l].concat(K.shuffle(r, LOW_SIM[l].split('').filter(function (x) { return bad.indexOf(x) < 0; })).slice(0, 2));
      o = o.concat(others(r, K, ABC.split('').filter(function (x) { return bad.indexOf(x) < 0; }), 4, o)).slice(0, r() < 0.5 ? 3 : 4);
      var ex = [{ say: 'הַמִּלָּה ' + w + ' מַתְחִילָה בָּאוֹת ' + l + '.', svg: wordSvg(w, [0, 1]) }, { say: 'כָּךְ נִרְאֵית הָאוֹת, גְּדוֹלָה וּקְטַנָּה.', svg: linesSvg([l.toUpperCase(), l]) }];
      if (two.length) ex.push({ say: 'גַּם הַמִּלָּה ' + two[0] + ' מַתְחִילָה בָּאוֹת ' + l + '.', big: EMO[two[0]] + '  ' + two[0], ltr: true });
      return K.q(r, { text: 'בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּלָּה?', pic: EMO[w], say: w, answer: l, options: o, optLtr: true, tip: tip, ex: ex });
    }
    var L = K.pick(r, LWK), ans = K.pick(r, LW[L]), badL = L + (SAMESND[L] || '');
    var ks = K.sample(r, LWK.filter(function (k) { return badL.indexOf(k) < 0; }), 2), opts = [ans, K.pick(r, LW[ks[0]]), K.pick(r, LW[ks[1]])];
    return K.q(r, {
      text: 'אֵיזוֹ מִלָּה מַתְחִילָה בָּאוֹת הַזֹּאת?', svg: linesSvg([L.toUpperCase(), L]), say: opts.slice().sort().join(', '), answer: ans, options: opts, optHtml: pics(opts), tip: tip,
      ex: [{ say: 'אוֹמְרִים כָּל מִלָּה וּמַקְשִׁיבִים לַהַתְחָלָה.', big: opts.map(function (x) { return EMO[x] + ' ' + x; }).join('   '), ltr: true },
        { say: 'הַמִּלָּה ' + ans + ' מַתְחִילָה בָּאוֹת ' + L + '.', svg: wordSvg(ans, [0, 1]) }]
    });
  }
  var LOOK = [
    { g: 'bdpq', w: { b: 'bag bed ball book bus box bird', d: 'dog duck door', p: 'pen pencil pig picture', q: 'queen' } },
    { g: 'mnh', w: { m: 'man milk mouse monkey', n: 'nose net notebook', h: 'hat hen hand' } },
    { g: 'ftl', w: { f: 'fish foot', t: 'tree tiger', l: 'leg lemon lion' } }
  ];
  var LOOKW = [];
  LOOK.forEach(function (G) { Object.keys(G.w).forEach(function (l) { G.w[l].split(' ').forEach(function (w) { LOOKW.push({ w: w, l: l, g: G.g }); }); }); });
  var SHAPE = {
    b: 'b: קֹדֶם קַו, אַחַר כָּךְ בֶּטֶן.', d: 'd: קֹדֶם בֶּטֶן, אַחַר כָּךְ קַו.',
    p: 'p: הַקַּו יוֹרֵד לַמַּרְתֵּף, וְהַבֶּטֶן מִיָּמִין.', q: 'q: הַקַּו יוֹרֵד לַמַּרְתֵּף, וְהַבֶּטֶן מִשְּׂמֹאל.',
    m: 'לָאוֹת m יֵשׁ שְׁתֵּי גְּבָעוֹת, לָאוֹת n רַק גִּבְעָה אַחַת.', n: 'לָאוֹת n יֵשׁ גִּבְעָה אַחַת, לָאוֹת m שְׁתֵּי גְּבָעוֹת.',
    h: 'לָאוֹת h יֵשׁ קַו גָּבוֹהַּ שֶׁעוֹלֶה לַגַּג.', f: 'לָאוֹת f יֵשׁ רֹאשׁ מְעֻגָּל לְמַעְלָה.', t: 'לָאוֹת t יֵשׁ קַו קָטָן שֶׁחוֹצֶה אוֹתָהּ.', l: 'הָאוֹת l הִיא קַו אֶחָד גָּבוֹהַּ.'
  };
  var BOARDS = ['bdpq', 'mnuh', 'iltf', 'vwuy', 'ceoa', 'MWNV', 'EFLT'];
  function lookAlike(r, K) {
    var tip = 'מִסְתַּכְּלִים טוֹב עַל הַצּוּרָה שֶׁל כָּל אוֹת.';
    if (r() < 0.55) {
      var it = K.pick(r, LOOKW);
      return K.q(r, {
        text: 'בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּלָּה?', pic: EMO[it.w], say: it.w, answer: it.l, options: it.g.split(''), optLtr: true, tip: tip,
        ex: [{ say: 'הַמִּלָּה ' + it.w + ' מַתְחִילָה בָּאוֹת ' + it.l + '.', svg: wordSvg(it.w, [0, 1]) }, { say: SHAPE[it.l], svg: linesSvg(it.g.split('')) }]
      });
    }
    var g = K.pick(r, BOARDS).split(''), tg = K.pick(r, g), c = K.ri(r, 2, 4), cells = [], i;
    var rest = g.filter(function (x) { return x !== tg; });
    for (i = 0; i < c; i++) cells.push(tg);
    while (cells.length < 8) cells.push(K.pick(r, rest));
    cells = K.shuffle(r, cells);
    var lo = Math.max(1, c - K.ri(r, 0, 2));
    return K.q(r, {
      text: 'כַּמָּה פְּעָמִים מוֹפִיעָה הָאוֹת ' + tg + '?', svg: boardSvg(cells), answer: c, options: [lo, lo + 1, lo + 2], keep: true, tip: tip, key: 'board|' + tg + '|' + cells.join(''),
      ex: [{ say: 'עוֹבְרִים אוֹת אַחֲרֵי אוֹת, מִשְּׂמֹאל לְיָמִין, וְצוֹבְעִים רַק אֶת הָאוֹת ' + tg + '.', svg: boardSvg(cells, tg) }, { say: 'סוֹפְרִים אֶת הַצְּבוּעוֹת: ' + c + '.' }]
    });
  }

  function abcOrder(r, K) {
    var upper = r() < 0.4, A = upper ? ABC.toUpperCase() : ABC, sim = upper ? UP_SIM : LOW_SIM, t = r(), i = K.ri(r, 0, 23), items, ai, text;
    if (t < 0.4) { items = [A.charAt(i), A.charAt(i + 1), '?']; ai = i + 2; text = 'מָה הָאוֹת הַבָּאָה?'; }
    else if (t < 0.7) { items = ['?', A.charAt(i + 1), A.charAt(i + 2)]; ai = i; text = 'אֵיזוֹ אוֹת בָּאָה לִפְנֵי?'; }
    else { items = [A.charAt(i), '?', A.charAt(i + 2)]; ai = i + 1; text = 'אֵיזוֹ אוֹת חֲסֵרָה בָּאֶמְצַע?'; }
    var ans = A.charAt(ai), cand = [];
    [ai + 1, ai - 1, ai + 2, ai - 2].forEach(function (k) { if (k >= 0 && k < 26) cand.push(A.charAt(k)); });
    cand = cand.concat(sim[ans].split('')).filter(function (x) { return x !== ans && items.indexOf(x) < 0; });
    cand = uniq(cand);
    var opts = [ans].concat(K.shuffle(r, cand).slice(0, 3));
    var done = items.map(function (x) { return x === '?' ? ans : x; });
    return K.q(r, {
      text: text, svg: seqSvg(items), answer: ans, options: opts, optLtr: true, tip: 'אוֹמְרִים אֶת הָאוֹתִיּוֹת לְפִי הַסֵּדֶר: A, B, C...',
      ex: [{ say: 'מְחַפְּשִׂים אֶת הַמָּקוֹם בְּלוּחַ הָאוֹתִיּוֹת שֶׁל הַכִּתָּה.', svg: abcSvg(ai, upper) },
        { say: 'אוֹמְרִים אֶת הָאוֹתִיּוֹת לְפִי הַסֵּדֶר עַד שֶׁמַּגִּיעִים לַמָּקוֹם.', big: A.slice(Math.max(0, ai - 3), ai + 1).split('').join('  '), ltr: true },
        { say: 'הָאוֹת הַחֲסֵרָה הִיא ' + ans + '.', svg: seqSvg(done) }]
    });
  }

  // =====================================================================================================
  // World 4: reading short words
  // =====================================================================================================
  // [word, written wrong options, 1 = has a picture]
  function mkRead(list) { return list.map(function (s) { var p = s.split(':'); return { w: p[0], alt: p[1].split(' '), pic: !!EMO[p[0]] && p[2] !== '-' }; }); }
  var READ_A = mkRead(['cat:hat cap can', 'hat:cat ham had', 'bat:bag rat bad', 'rat:bat ran rag', 'bag:bat rag bad', 'man:van map mad', 'van:man fan vat', 'pan:fan pat pad',
    'can:cat cap pan', 'map:cap man mat', 'cap:map cat can', 'ham:hat jam had', 'sad:mad dad sat', 'mad:sad man map', 'cab:cap cat can', 'ant:and an at', 'hand:hat ham and',
    'mat:map man hat:-', 'fan:fat van man:-', 'jam:ham jab jar:-', 'bad:bag bat dad:-', 'tap:tan cap top:-']);
  var READ_B = mkRead(['bed:bad bud bid', 'pen:pin pan pun', 'hen:han hin hem', 'red:rod rid rad', 'leg:log lag lug', 'net:nut not nit', 'web:wab wib wet', 'jet:jot jut jat',
    'pig:peg pug pag', 'lip:lap lop lep', 'kid:kad kod kit', 'bin:ban bun ben', 'milk:malk mulk melk',
    'dog:dig dug dag', 'box:bax bix bux', 'fox:fax fix fex', 'hot:hat hit hut', 'pot:pat pit pet', 'log:leg lag lug', 'sock:sack sick seck',
    'bus:bas bis bos', 'sun:san sen sin', 'cup:cap cop cub', 'bug:bag big beg', 'nut:net not nit', 'run:ran ren rin', 'mug:mag meg mig', 'hug:hog hig heg', 'cut:cat cot cup', 'up:ap ip op']);
  function soundOut(w) { return w.split('').join(' - '); }
  function readQ(r, K, bank, vowelHouse) {
    var withPic = bank.filter(function (x) { return x.pic; }), t = r(), it, w;
    var tip = 'אוֹמְרִים כָּל אוֹת בְּתוֹרָהּ, מִשְּׂמֹאל לְיָמִין, וּמְחַבְּרִים לְמִלָּה.';
    function exFor(w0) {
      var fam = bank.map(function (x) { return x.w; }).filter(function (x) { return x !== w0 && x.length === w0.length && x.slice(1) === w0.slice(1); }).slice(0, 2);
      var ex = [{ say: 'הָאוֹת הָאֲדֻמָּה הִיא הַתְּנוּעָה. אוֹמְרִים כָּל אוֹת בְּתוֹרָהּ.', svg: wordSvg(w0) },
        { say: 'מְחַבְּרִים אֶת הַצְּלִילִים לְמִלָּה אַחַת: ' + w0 + '.', big: soundOut(w0) + '  →  ' + w0 + (EMO[w0] ? '  ' + EMO[w0] : ''), ltr: true }];
      if (fam.length) ex.push({ say: 'מַחְלִיפִים רַק אֶת הָאוֹת הָרִאשׁוֹנָה וּמְקַבְּלִים מִלָּה חֲדָשָׁה.', svg: wordsSvg([w0].concat(fam), [1].concat(fam.map(function () { return 1; }))) });
      return ex;
    }
    if (t < 0.36) { // read the word, choose the picture
      it = K.pick(r, withPic); w = it.w;
      var pool = withPic.map(function (x) { return x.w; }).filter(function (x) { return x !== w; });
      var end = pool.filter(function (x) { return x.slice(-2) === w.slice(-2); }), st = pool.filter(function (x) { return x.charAt(0) === w.charAt(0); }), o = [w];
      if (end.length) o.push(K.pick(r, end));
      if (st.length) { var s1 = K.pick(r, st); if (o.indexOf(s1) < 0) o.push(s1); }
      o = o.concat(others(r, K, pool, 3, o)).slice(0, 3);
      return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּלָּה?', svg: wordSvg(w), answer: w, options: o, optHtml: pics(o), tip: tip, ex: exFor(w) });
    }
    if (t < 0.7) { // see the picture, choose the written word
      it = K.pick(r, withPic); w = it.w;
      var o2 = [w].concat(K.sample(r, it.alt, 2));
      return K.q(r, {
        text: 'אֵיזוֹ מִלָּה מַתְאִימָה לַתְּמוּנָה?', pic: EMO[w], answer: w, options: o2, optLtr: true, tip: vowelHouse ? 'מִסְתַּכְּלִים טוֹב עַל הָאוֹת שֶׁבָּאֶמְצַע.' : tip, ex: exFor(w)
      });
    }
    // build the word from letter tiles
    var can = bank.filter(function (x) { return uniq(x.w.split('')).length === x.w.length; });
    it = K.pick(r, can); w = it.w;
    return K.q(r, {
      fmt: 'order', parts: w.split(''), sep: '', answer: w, ltr: true, text: '', pic: it.pic ? EMO[w] : undefined, say: w, tip: 'בְּנִי אֶת הַמִּלָּה: צְלִיל רִאשׁוֹן, צְלִיל אֶמְצָעִי, צְלִיל אַחֲרוֹן.',
      ex: [{ say: 'אוֹמְרִים אֶת הַמִּלָּה לְאַט: ' + w + '. מָה שׁוֹמְעִים בַּהַתְחָלָה, בָּאֶמְצַע וּבַסּוֹף?', big: soundOut(w), ltr: true },
        { say: 'שָׂמִים אֶת הָאוֹתִיּוֹת לְפִי הַסֵּדֶר, מִשְּׂמֹאל לְיָמִין. הַתְּנוּעָה בְּאָדֹם.', svg: wordSvg(w) }]
    });
  }

  // --- 4.3 sh, ch, th: [word, its parts (the pair is one tile), written wrong options] ---
  var DIG = ['ship:sh i p:chip sip thip', 'shop:sh o p:chop sop thop', 'shell:sh e ll:sell chell thell', 'shed:sh e d:ched thed sed', 'fish:f i sh:fich fith fis', 'dish:d i sh:dich dith dis',
    'wish:w i sh:wich with wis', 'cash:c a sh:cach cath cas', 'chin:ch i n:shin thin kin', 'chip:ch i p:ship thip hip', 'chick:ch i ck:shick thick kick', 'chop:ch o p:shop thop cop',
    'chat:ch a t:that cat hat', 'lunch:l u n ch:lunsh lunth lunk', 'bench:b e n ch:bensh benth benk', 'much:m u ch:mush muth muck', 'this:th i s:chis shis his', 'that:th a t:chat hat tat',
    'then:th e n:chen ten hen', 'them:th e m:chem hem tem', 'thin:th i n:shin chin tin', 'bath:b a th:bash bach bat', 'math:m a th:mash mach mat', 'with:w i th:wish wich wit']
    .map(function (s) { var p = s.split(':'), parts = p[1].split(' '), d = parts.filter(function (x) { return x === 'sh' || x === 'ch' || x === 'th'; })[0]; return { w: p[0], parts: parts, alt: p[2].split(' '), d: d, pic: !!EMO[p[0]] }; });
  function digraphs(r, K) {
    var t = r(), it = K.pick(r, DIG), w = it.w, at = w.indexOf(it.d);
    var tip = 'sh, ch, th: שְׁתֵּי אוֹתִיּוֹת שֶׁנִּשְׁמָעוֹת כְּמוֹ צְלִיל אֶחָד.';
    var ex = [{ say: 'שְׁתֵּי הָאוֹתִיּוֹת ' + it.d + ' הֵן צְלִיל אֶחָד.', svg: wordSvg(w, [at, at + 2]) },
      { say: 'מְחַבְּרִים אֶת הַחֲלָקִים לְמִלָּה: ' + w + '.', big: it.parts.join(' - ') + '  →  ' + w + (it.pic ? '  ' + EMO[w] : ''), ltr: true }];
    if (t < 0.3) return K.q(r, { text: 'אֵיזוֹ מִלָּה שׁוֹמְעִים?', say: w, answer: w, options: [w].concat(K.sample(r, it.alt, 2)), optLtr: true, tip: tip, ex: ex });
    if (t < 0.6) {
      return K.q(r, {
        text: 'אֵיזֶה צֶמֶד אוֹתִיּוֹת חָסֵר?', pic: it.pic ? EMO[w] : undefined, say: w, svg: wordSvg(w.slice(0, at) + '__' + w.slice(at + 2)), answer: it.d, options: ['sh', 'ch', 'th'], keep: true, optLtr: true, tip: tip, ex: ex
      });
    }
    if (t < 0.8) {
      var pw = DIG.filter(function (x) { return x.pic; }), a = K.pick(r, pw), o = [a.w].concat(others(r, K, pw.map(function (x) { return x.w; }), 2, [a.w, a.w === 'dish' ? 'chip' : '']));
      return K.q(r, {
        text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה לַמִּלָּה?', svg: wordSvg(a.w), answer: a.w, options: o, optHtml: pics(o), tip: tip,
        ex: [{ say: 'שְׁתֵּי הָאוֹתִיּוֹת ' + a.d + ' הֵן צְלִיל אֶחָד.', svg: wordSvg(a.w, [a.w.indexOf(a.d), a.w.indexOf(a.d) + 2]) },
          { say: 'מְחַבְּרִים אֶת הַחֲלָקִים לְמִלָּה: ' + a.w + '.', big: a.parts.join(' - ') + '  →  ' + a.w + '  ' + EMO[a.w], ltr: true }]
      });
    }
    return K.q(r, { fmt: 'order', parts: it.parts, sep: '·', answer: it.parts.join('·'), ltr: true, text: '', pic: it.pic ? EMO[w] : undefined, say: w, tip: 'בְּנִי אֶת הַמִּלָּה. הַצֶּמֶד ' + it.d + ' הוּא אָרִיחַ אֶחָד.', ex: ex });
  }

  // --- 4.4 sight words: [word, look-alikes, a short sentence with the word] ---
  var SIGHT = ['look:like yes you:Look! A dog.', 'I:me my am:I am happy.', 'am:and are my:I am a girl.', 'yes:you she they:Yes, please.', 'no:on go do:No, thank you.',
    'and:am are an:A cat and a dog.', 'have:like her the:I have a bag.', 'the:he she they:The sun is hot.', 'like:look have the:I like cats.', 'he:the she her:He is my dad.',
    'she:he the her:She is my mom.', 'me:my he am:Look at me!', 'my:me am you:This is my bag.', 'want:and have are:I want a cake.', 'are:and am her:How are you?',
    'boy:box bag my:I am a boy.', 'girl:like look go:She is a girl.', 'you:yes they my:Thank you.', 'they:the he you:They are happy.', 'to:do go of:Let\'s go to school.',
    'do:to go no:Do you like milk?', 'go:no do to:Let\'s go!', 'of:on to do:A cup of milk.', 'her:he she are:This is her hat.']
    .map(function (s) { var p = s.split(':'); return { w: p[0], alt: p[1].split(' '), sent: p[2] }; });
  function sight(r, K) {
    var it = K.pick(r, SIGHT), w = it.w, tip = 'אֶת הַמִּלִּים הָאֵלֶּה מַכִּירִים בְּמַבָּט, בְּלִי לְפָרֵק לְאוֹתִיּוֹת.';
    var ex = [{ say: 'זֹאת הַמִּלָּה ' + w + '. מַכִּירִים אוֹתָהּ בְּמַבָּט, בְּלִי לְפָרֵק לְאוֹתִיּוֹת.', svg: wordSvg(w, 'none') },
      { say: 'הִנֵּה הִיא בְּתוֹךְ מִשְׁפָּט:', big: it.sent, ltr: true }];
    if (r() < 0.35) {
      var truth = r() < 0.5, shown = truth ? w : K.pick(r, it.alt);
      return K.tf(r, { text: 'זֹאת הַמִּלָּה שֶׁשּׁוֹמְעִים.', say: w, svg: wordSvg(shown, 'none'), tip: tip, ex: ex, key: 'tf|' + w + '|' + shown }, truth);
    }
    return K.q(r, { text: 'אֵיזוֹ מִלָּה שׁוֹמְעִים?', say: w, answer: w, options: [w].concat(K.sample(r, it.alt, r() < 0.5 ? 2 : 3)), optLtr: true, tip: tip, ex: ex });
  }

  // --- 4.5 a written sentence and a picture (no voice: the child reads) ---
  var RX = ['cat', 'dog', 'hen', 'pig', 'bug', 'fox', 'rat', 'pen', 'hat', 'egg', 'nut', 'sock', 'duck'];
  var RANIMAL = ['cat', 'dog', 'hen', 'pig', 'bug', 'fox', 'rat', 'duck'], RBASE = ['bed', 'bus', 'van', 'log'];
  var RMANY = ['pen', 'hat', 'egg', 'cup', 'nut', 'bug', 'cat', 'dog', 'hen', 'pig', 'sock', 'duck'];
  function sentenceRead(r, K) {
    var t = r(), w, w2, sc, wrong, text, ex2, html = {}, opts, canTf = true;
    var tip = 'קוֹרְאִים מִשְּׂמֹאל לְיָמִין, מִלָּה אַחֲרֵי מִלָּה.';
    if (t < 0.3) {
      var prep = r() < 0.5 ? 'in' : 'on';
      w = K.pick(r, RX); w2 = K.pick(r, RX.filter(function (x) { return x !== w; }));
      sc = { t: 'box', e: EMO[w], prep: prep }; text = 'The ' + w + ' is ' + prep + ' the box.';
      wrong = [{ t: 'box', e: EMO[w], prep: prep === 'in' ? 'on' : 'in' }, { t: 'box', e: EMO[w2], prep: prep }];
      ex2 = { say: 'in זֶה בְּתוֹךְ, on זֶה עַל.', svg: scene(sc, true) };
    } else if (t < 0.5) {
      var b = K.pick(r, RBASE), b2 = K.pick(r, RBASE.filter(function (x) { return x !== b; }));
      w = K.pick(r, RANIMAL); w2 = K.pick(r, RANIMAL.filter(function (x) { return x !== w; }));
      sc = { t: 'top', e: EMO[w], b: EMO[b] }; text = 'The ' + w + ' is on the ' + b + '.';
      wrong = [{ t: 'top', e: EMO[w2], b: EMO[b] }, { t: 'top', e: EMO[w], b: EMO[b2] }];
      ex2 = { say: 'קוֹרְאִים שׁוּב אֶת שְׁתֵּי הַמִּלִּים הַחֲשׁוּבוֹת: ' + w + ', ' + b + '.', svg: scene(sc, true) };
    } else if (t < 0.68) {
      var pr = K.sample(r, RANIMAL, 3);
      w = pr[0];
      sc = { t: 'pair', e: EMO[pr[0]], b: EMO[pr[1]] }; text = 'A ' + pr[0] + ' and a ' + pr[1] + '.';
      wrong = [{ t: 'pair', e: EMO[pr[0]], b: EMO[pr[2]] }, { t: 'pair', e: EMO[pr[2]], b: EMO[pr[1]] }];
      ex2 = { say: 'הַמִּלָּה and מְחַבֶּרֶת שְׁנֵי דְּבָרִים: ' + pr[0] + ', ' + pr[1] + '.', svg: scene(sc, true) };
    } else if (t < 0.84) {
      w = K.pick(r, RX); w2 = K.pick(r, RX.filter(function (x) { return x !== w; }));
      sc = { t: 'size', e: EMO[w], big: true }; text = 'I see a big ' + w + '.'; canTf = false;
      wrong = [{ t: 'size', e: EMO[w], big: false }, { t: 'size', e: EMO[w2], big: true }];
      ex2 = { say: 'הַמִּלָּה big אוֹמֶרֶת: גָּדוֹל.', svg: scene(sc, true) };
    } else {
      var n = K.pick(r, [1, 6, 10]), n2 = K.pick(r, [1, 6, 10].filter(function (x) { return x !== n; }));
      w = K.pick(r, RMANY); w2 = K.pick(r, RMANY.filter(function (x) { return x !== w; }));
      sc = { t: 'count', e: EMO[w], n: n }; text = 'I see ' + (n === 1 ? 'a ' + w : (n === 6 ? 'six ' : 'ten ') + w + 's') + '.';
      wrong = [{ t: 'count', e: EMO[w], n: n2 }, { t: 'count', e: EMO[w2], n: n }];
      ex2 = { say: n === 1 ? 'הַמִּלָּה a אוֹמֶרֶת שֶׁיֵּשׁ רַק אֶחָד.' : 'סוֹפְרִים אֶת הַתְּמוּנוֹת: ' + n + '.', svg: scene(sc, true) };
    }
    var ex = [{ say: 'קוֹרְאִים מִשְּׂמֹאל לְיָמִין, מִלָּה אַחֲרֵי מִלָּה.', big: text, ltr: true }, ex2];
    if (canTf && r() < 0.35) {
      var truth = r() < 0.5, shown = truth ? sc : K.pick(r, wrong);
      return K.tf(r, { text: text, ltr: true, svg: scene(shown, true), tip: tip, ex: ex, key: 'tf|' + text + '|' + sceneId(shown) }, truth);
    }
    opts = [sc].concat(wrong).map(function (x) { html[sceneId(x)] = scene(x); return sceneId(x); });
    return K.q(r, { text: text, ltr: true, answer: opts[0], options: opts, optHtml: html, tip: tip, ex: ex });
  }

  // =====================================================================================================
  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'eng',
    grade: 3,
    tiles: [{
      id: 'eng3listen', world: 'מַקְשִׁיבִים וּמְבִינִים', name: 'מִלִּים וּמִשְׁפָּטִים בִּשְׁמִיעָה', icon: '👂', bld: 'house1', hero: 'שִׁמְעִי',
      levels: [
        { name: 'מִלִּים רִאשׁוֹנוֹת', f: function (r, K) { return listenQ(r, K, BANK11); } },
        { name: 'בַּבַּיִת וּבַכִּתָּה', f: function (r, K) { return listenQ(r, K, BANK12); } },
        { name: 'חַיּוֹת, אֹכֶל וּמִשְׂחָק', f: function (r, K) { return listenQ(r, K, BANK13); } },
        { name: 'שְׁאֵלוֹת וּתְשׁוּבוֹת', f: phraseQ },
        { name: 'מִשְׁפָּטִים קְצָרִים', f: sentenceHear }
      ]
    }, {
      id: 'eng3sound', world: 'צְלִילִים', name: 'צְלִיל רִאשׁוֹן, חֲרוּזִים וַהֲבָרוֹת', icon: '🎵', bld: 'towerSmall', hero: 'צְלִילִי',
      levels: [
        { name: 'הַצְּלִיל הָרִאשׁוֹן', f: firstSound },
        { name: 'חֲרוּזִים', f: rhyme },
        { name: 'הֲבָרוֹת', f: syllables }
      ]
    }, {
      id: 'eng3abc', world: 'אוֹתִיּוֹת', name: 'הָאוֹתִיּוֹת וְהַצְּלִילִים שֶׁלָּהֶן', icon: '🔤', bld: 'house2', hero: 'אַלְפִי',
      levels: [
        { name: 'גְּדוֹלָה וּקְטַנָּה', f: bigSmall },
        { name: 'אוֹת וּצְלִיל', f: letterSound },
        { name: 'אוֹתִיּוֹת דּוֹמוֹת', f: lookAlike },
        { name: 'סֵדֶר הָאוֹתִיּוֹת', f: abcOrder }
      ]
    }, {
      id: 'eng3read', world: 'קוֹרְאִים מִלִּים', name: 'רֵאשִׁית קְרִיאָה', icon: '📖', bld: 'castleSmall', hero: 'קוֹרִי',
      levels: [
        { name: 'מִלִּים קְצָרוֹת עִם a', f: function (r, K) { return readQ(r, K, READ_A, false); } },
        { name: 'מִלִּים קְצָרוֹת עִם e, i, o, u', f: function (r, K) { return readQ(r, K, READ_B, true); } },
        { name: 'sh, ch, th', f: digraphs },
        { name: 'מִלִּים שֶׁמַּכִּירִים בְּמַבָּט', f: sight },
        { name: 'מִשְׁפָּט וּתְמוּנָה', f: sentenceRead }
      ]
    }]
  });
})();
