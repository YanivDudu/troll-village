(function () {
  'use strict';
  // English, grade 5 (the challenge map of grade 4 players). Source: docs/research/new/english-grade-5.md only.

  // ---------- helpers ----------
  var INK = '#3b2a55';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function em(e) { return '<span class="em">' + e + '</span>'; }
  function emMap(list) { var m = {}; list.forEach(function (e) { m[e] = em(e); }); return m; }
  function fill(s, w) { return s.replace('___', w); }
  function big(say, text) { return { say: say, big: text, ltr: true }; }
  function svgOpen(w, h) { var W = Math.min(320, w); return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + W + '" height="' + Math.round(h * W / w) + '" style="direction:ltr">'; }
  function txt(x, y, s, size, color, bold) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" direction="ltr" font-family="Arial, sans-serif" font-size="' + size + '"' + (bold ? ' font-weight="700"' : '') + ' fill="' + color + '">' + s + '</text>';
  }
  // words one under the other, the letters in marks[i] = [from, to) are coloured
  function wordsSvg(words, marks) {
    var h = 46 * words.length + 14, out = svgOpen(300, h);
    words.forEach(function (w, i) {
      var m = marks[i] || [0, 0];
      out += txt(150, 42 + 46 * i, esc(w.slice(0, m[0])) + '<tspan fill="#ff5fa2">' + esc(w.slice(m[0], m[1])) + '</tspan>' + esc(w.slice(m[1])), 36, INK, true);
    });
    return out + '</svg>';
  }
  // where similar words differ: everything between the common beginning and the common ending
  function diffMarks(words) {
    var min = Math.min.apply(null, words.map(function (w) { return w.length; })), p = 0, s = 0;
    function same(f) { return words.every(function (w) { return f(w) === f(words[0]); }); }
    while (p < min && same(function (w) { return w[p]; })) p++;
    while (s < min - p && same(function (w) { return w[w.length - 1 - s]; })) s++;
    return words.map(function (w) { return [p, w.length - s]; });
  }
  function teamMark(w, team) { var i = w.lastIndexOf(team); return [i, i + team.length]; }
  // a small grammar table: rows of [who, form], one row highlighted
  function tableSvg(rows, hi) {
    var h = rows.length * 44 + 8, out = svgOpen(310, h);
    rows.forEach(function (rw, i) {
      var y = 4 + i * 44, on = i === hi;
      out += '<rect x="4" y="' + y + '" width="302" height="40" rx="8" fill="' + (on ? '#ffb300' : '#efe7ff') + '" stroke="' + INK + '" stroke-width="' + (on ? 3 : 1) + '"/>' +
        txt(100, y + 27, esc(rw[0]), 18, INK, false) + txt(245, y + 27, esc(rw[1]), 20, on ? INK : '#8e5cff', true);
    });
    return out + '</svg>';
  }
  // the words of a sentence as coloured tiles in the right order; tile hi is pink
  function chipsSvg(words, hi) {
    var x = 6, body = '';
    words.forEach(function (wd, i) {
      var w = wd.length * 13 + 22;
      body += '<rect x="' + x + '" y="8" width="' + w + '" height="44" rx="10" fill="' + (i === hi ? '#ff5fa2' : '#8e5cff') + '" stroke="' + INK + '" stroke-width="2"/>' + txt(x + w / 2, 38, esc(wd), 22, '#ffffff', true);
      x += w + 8;
    });
    return svgOpen(x - 2, 60) + body + '</svg>';
  }
  function tfQ(K, r, sentence, truth, tip, ex) { return K.tf(r, { text: sentence, ltr: true, tip: tip, ex: ex }, truth); }

  // ---------- A1: word and picture ----------
  var WORDS = [
    ['apple', '🍎', 'תַּפּוּחַ', 'food'], ['banana', '🍌', 'בָּנָנָה', 'food'], ['bread', '🍞', 'לֶחֶם', 'food'], ['cake', '🎂', 'עוּגָה', 'food'],
    ['cheese', '🧀', 'גְּבִינָה', 'food'], ['tomato', '🍅', 'עַגְבָנִיָּה', 'food'], ['ice cream', '🍦', 'גְּלִידָה', 'food'], ['cookie', '🍪', 'עוּגִיָּה', 'food'],
    ['chicken', '🐔', 'תַּרְנְגֹלֶת', 'animal'], ['cow', '🐄', 'פָּרָה', 'animal'], ['horse', '🐴', 'סוּס', 'animal'], ['sheep', '🐑', 'כֶּבֶשׂ', 'animal'],
    ['bird', '🐦', 'צִפּוֹר', 'animal'], ['fish', '🐟', 'דָּג', 'animal'], ['monkey', '🐒', 'קוֹף', 'animal'], ['elephant', '🐘', 'פִּיל', 'animal'],
    ['rabbit', '🐇', 'אַרְנָב', 'animal'], ['snake', '🐍', 'נָחָשׁ', 'animal'], ['mouse', '🐭', 'עַכְבָּר', 'animal'], ['pig', '🐷', 'חֲזִיר', 'animal'],
    ['car', '🚗', 'מְכוֹנִית', 'go'], ['train', '🚆', 'רַכֶּבֶת', 'go'], ['boat', '⛵', 'סִירָה', 'go'], ['airplane', '✈️', 'מָטוֹס', 'go'],
    ['bicycle', '🚲', 'אוֹפַנַּיִם', 'go'], ['helicopter', '🚁', 'מַסּוֹק', 'go'], ['taxi', '🚕', 'מוֹנִית', 'go'],
    ['flower', '🌸', 'פֶּרַח', 'nature'], ['tree', '🌳', 'עֵץ', 'nature'], ['mountain', '⛰️', 'הַר', 'nature'], ['cloud', '☁️', 'עָנָן', 'nature'],
    ['star', '⭐', 'כּוֹכָב', 'nature'], ['fire', '🔥', 'אֵשׁ', 'nature'],
    ['clock', '🕒', 'שָׁעוֹן', 'thing'], ['door', '🚪', 'דֶּלֶת', 'thing'], ['chair', '🪑', 'כִּסֵּא', 'thing'], ['book', '📖', 'סֵפֶר', 'thing'],
    ['guitar', '🎸', 'גִּיטָרָה', 'thing'], ['umbrella', '☂️', 'מִטְרִיָּה', 'thing'], ['key', '🔑', 'מַפְתֵּחַ', 'thing'], ['camera', '📷', 'מַצְלֵמָה', 'thing'],
    ['spoon', '🥄', 'כַּף', 'thing'], ['ring', '💍', 'טַבַּעַת', 'thing'], ['suitcase', '🧳', 'מִזְוָדָה', 'thing'], ['newspaper', '📰', 'עִתּוֹן', 'thing'],
    ['shoe', '👟', 'נַעַל', 'wear'], ['dress', '👗', 'שִׂמְלָה', 'wear'], ['coat', '🧥', 'מְעִיל', 'wear'], ['sock', '🧦', 'גֶּרֶב', 'wear'],
    ['shirt', '👕', 'חֻלְצָה', 'wear'], ['glasses', '👓', 'מִשְׁקָפַיִם', 'wear']
  ];
  function a1(r, K) {
    var w = K.pick(r, WORDS), twin = { bird: 'chicken', chicken: 'bird' }[w[0]], o; // a chicken is a bird too: never side by side
    var same = WORDS.filter(function (c) { return c[3] === w[3] && c !== w && c[0] !== twin; });
    var tip = 'בְּעִבְרִית: ' + w[2], ex = [big('הַמִּלָּה הִיא:', w[0] + ' ' + w[1]), { say: 'בְּעִבְרִית: ' + w[2] }];
    if (r() < 0.55) {
      o = K.opts(r, w[1], same.map(function (c) { return c[1]; }), 4);
      return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?', say: w[0], sayShow: true, answer: w[1], options: o, optHtml: emMap(o), tip: tip, ex: ex });
    }
    o = K.opts(r, w[0], same.map(function (c) { return c[0]; }), 3);
    return K.q(r, { text: 'אֵיזוֹ מִלָּה מַתְאִימָה?', pic: w[1], answer: w[0], options: o, optLtr: true, tip: tip, ex: ex });
  }

  // ---------- A2: word and meaning ----------
  var GLOSS = [
    ['always', 'תָּמִיד', 'adv', 'I always get up at seven.'], ['sometimes', 'לִפְעָמִים', 'adv', 'We sometimes eat pizza.'],
    ['usually', 'בְּדֶרֶךְ כְּלָל', 'adv', 'I usually walk to school.'], ['never', 'אַף פַּעַם', 'adv', 'He never eats fish.'],
    ['often', 'לְעִתִּים קְרוֹבוֹת', 'adv', 'We often play football.'], ['yesterday', 'אֶתְמוֹל', 'adv', 'Yesterday I was sick.'],
    ['tomorrow', 'מָחָר', 'adv', 'See you tomorrow!'], ['today', 'הַיּוֹם', 'adv', 'It is cold today.'],
    ['because', 'כִּי', 'adv', 'I am happy because it is my birthday.'], ['together', 'יַחַד', 'adv', 'We play together.'],
    ['different', 'שׁוֹנֶה', 'adj', 'The two bags are different.'], ['difficult', 'קָשֶׁה', 'adj', 'The test is difficult.'],
    ['easy', 'קַל', 'adj', 'This game is easy.'], ['favorite', 'הֲכִי אָהוּב', 'adj', 'Blue is my favorite color.'],
    ['hungry', 'רָעֵב', 'adj', 'I am hungry. I want a sandwich.'], ['thirsty', 'צָמֵא', 'adj', 'I am thirsty. I want water.'],
    ['tired', 'עָיֵף', 'adj', 'I am tired. I want to sleep.'], ['busy', 'עָסוּק', 'adj', 'My mother is busy today.'],
    ['cheap', 'זוֹל', 'adj', 'The book is cheap.'], ['important', 'חָשׁוּב', 'adj', 'This lesson is important.'],
    ['famous', 'מְפֻרְסָם', 'adj', 'She is a famous singer.'], ['early', 'מֻקְדָּם', 'adj', 'I get up early.'],
    ['late', 'מְאֻחָר', 'adj', 'It is late. Go to bed.'], ['ready', 'מוּכָן', 'adj', 'Dinner is ready.'],
    ['remember', 'לִזְכֹּר', 'verb', 'I remember your name.'], ['forget', 'לִשְׁכֹּחַ', 'verb', 'Don\'t forget your bag.'],
    ['choose', 'לִבְחֹר', 'verb', 'Choose a color.'], ['understand', 'לְהָבִין', 'verb', 'I don\'t understand.'],
    ['begin', 'לְהַתְחִיל', 'verb', 'The lessons begin at eight.'], ['finish', 'לְסַיֵּם', 'verb', 'We finish school at two.'],
    ['bring', 'לְהָבִיא', 'verb', 'Bring a book, please.'], ['build', 'לִבְנוֹת', 'verb', 'They build a house.'],
    ['between', 'בֵּין', 'prep', 'The cat is between the chairs.'], ['behind', 'מֵאֲחוֹרֵי', 'prep', 'The dog is behind the door.'],
    ['above', 'מֵעַל', 'prep', 'The bird is above the tree.'], ['below', 'מִתַּחַת', 'prep', 'The fish is below the boat.'],
    ['weekend', 'סוֹף שָׁבוּעַ', 'noun', 'We go to the beach on the weekend.'], ['neighbor', 'שָׁכֵן', 'noun', 'My neighbor has a dog.'],
    ['village', 'כְּפָר', 'noun', 'My aunt lives in a village.'], ['weather', 'מֶזֶג אֲוִיר', 'noun', 'The weather is nice today.']
  ];
  function a2(r, K) {
    var g = K.pick(r, GLOSS), same = GLOSS.filter(function (c) { return c[2] === g[2] && c !== g; });
    var tip = g[0] + ' = ' + g[1], ex = [big('הַמִּלָּה וְהַפֵּרוּשׁ שֶׁלָּהּ:', g[0] + ' = ' + g[1]), big('הַמִּלָּה בְּתוֹךְ מִשְׁפָּט:', g[3])];
    if (r() < 0.55) return K.q(r, { text: 'מָה הַפֵּרוּשׁ?', say: g[0], sayShow: true, answer: g[1], options: K.opts(r, g[1], same.map(function (c) { return c[1]; }), 4), tip: tip, ex: ex });
    return K.q(r, { text: 'אֵיךְ אוֹמְרִים בְּאַנְגְּלִית: ' + g[1] + '?', answer: g[0], options: K.opts(r, g[0], same.map(function (c) { return c[0]; }), 4), optLtr: true, tip: tip, ex: ex });
  }

  // ---------- A3: word families ----------
  var CATS = [
    ['food', 'אֹכֶל וּשְׁתִיָּה', 'apple banana bread butter cake chocolate rice salad sandwich sugar cheese soup tomato potato pizza juice tea coffee'],
    ['animals', 'חַיּוֹת', 'bird cow horse monkey sheep elephant rabbit snake mouse pig'],
    ['family', 'מִשְׁפָּחָה', 'mother father sister brother aunt uncle grandmother grandfather son daughter husband wife'],
    ['body', 'גּוּף', 'arm ear eye face finger foot hair head knee leg mouth neck nose shoulder tooth'],
    ['clothes', 'בְּגָדִים', 'blouse coat dress jacket shoe shirt skirt sock jeans raincoat'],
    ['places', 'מְקוֹמוֹת', 'bank beach cinema farm hospital hotel park restaurant zoo museum supermarket station'],
    ['home', 'בַּיִת', 'bathroom bedroom kitchen living_room door floor wall window roof stairs'],
    ['weather', 'מֶזֶג אֲוִיר וְעוֹנוֹת', 'autumn spring summer winter rain wind snow cloud storm'],
    ['jobs', 'מִקְצוֹעוֹת', 'doctor driver farmer singer teacher waiter nurse pilot artist cook'],
    ['days', 'יָמִים וְחֳדָשִׁים', 'Monday Tuesday Wednesday Thursday Friday Sunday January March June October']
  ].map(function (c) { return { id: c[0], heb: c[1], words: c[2].split(' ').map(function (w) { return w.replace('_', ' '); }) }; });
  var CLASH = { home: 'places', places: 'home', weather: 'days', days: 'weather', food: 'jobs', jobs: 'food' }; // groups too close to be told apart
  function a3(r, K) {
    var a = K.pick(r, CATS), b = K.pick(r, CATS.filter(function (c) { return c !== a && CLASH[a.id] !== c.id; })), t = r(), w, three;
    if (t < 0.4) { // odd one out
      three = K.sample(r, a.words, 3); w = K.pick(r, b.words);
      return K.q(r, { text: 'אֵיזוֹ מִלָּה לֹא שַׁיֶּכֶת?', answer: w, options: three.concat([w]), optLtr: true, tip: 'שָׁלוֹשׁ מִלִּים הֵן מֵאוֹתָהּ קְבוּצָה. מְחַפְּשִׂים אֶת הָרְבִיעִית.',
        ex: [big('שָׁלוֹשׁ מִלִּים הֵן מֵהַקְּבוּצָה: ' + a.heb, three.join(', ')), big('הַמִּלָּה הָרְבִיעִית שַׁיֶּכֶת לִקְבוּצָה אַחֶרֶת: ' + b.heb, w)] });
    }
    if (t < 0.7) { // which word belongs to the group
      w = K.pick(r, a.words); three = K.sample(r, b.words, 2).concat([K.pick(r, K.pick(r, CATS.filter(function (c) { return c !== a && c !== b && CLASH[a.id] !== c.id; })).words)]);
      return K.q(r, { text: 'אֵיזוֹ מִלָּה שַׁיֶּכֶת לַקְּבוּצָה: ' + a.heb + '?', answer: w, options: [w].concat(three), optLtr: true, tip: 'קוֹרְאִים כָּל מִלָּה וְשׁוֹאֲלִים: הַאִם הִיא מֵהַקְּבוּצָה הַזֹּאת?',
        ex: [big('הַמִּלָּה מֵהַקְּבוּצָה: ' + a.heb, w), big('עוֹד מִלִּים מֵאוֹתָהּ קְבוּצָה:', K.sample(r, a.words.filter(function (x) { return x !== w; }), 3).join(', '))] });
    }
    var truth = r() < 0.5; w = K.pick(r, (truth ? a : b).words);
    return K.tf(r, { text: 'זוֹ מִלָּה מֵהַקְּבוּצָה: ' + a.heb, say: w, sayShow: true, tip: 'חוֹשְׁבִים: מָה פֵּרוּשׁ הַמִּלָּה?',
      ex: [big('הַמִּלָּה שַׁיֶּכֶת לַקְּבוּצָה: ' + (truth ? a : b).heb, w), big('עוֹד מִלִּים מֵאוֹתָהּ קְבוּצָה:', K.sample(r, (truth ? a : b).words.filter(function (x) { return x !== w; }), 3).join(', '))] }, truth);
  }

  // ---------- A4: riddles ----------
  var RIDDLES = [ // riddle, answer, wrong answers, key word = gloss, picture, who?
    ['It is yellow and long. Monkeys like it.', 'a banana', ['an apple', 'a potato'], 'yellow = צָהֹב', '🍌'],
    ['You look at it to know the time.', 'a clock', ['a door', 'a key'], 'time = שָׁעָה', '🕒'],
    ['You wear them on your feet.', 'shoes', ['glasses', 'hats'], 'feet = רַגְלַיִם', '👟'],
    ['It is white and cold. It falls in winter.', 'snow', ['fire', 'wind'], 'cold = קַר', '❄️'],
    ['A teacher works there.', 'a school', ['a hospital', 'a farm'], 'teacher = מוֹרֶה', '🏫'],
    ['Sick people go there.', 'a hospital', ['a cinema', 'a hotel'], 'sick = חוֹלֶה', '🏥'],
    ['You open it to go into a room.', 'a door', ['a wall', 'a roof'], 'open = לִפְתֹּחַ', '🚪'],
    ['It is the meal we eat in the evening.', 'dinner', ['breakfast', 'lunch'], 'evening = עֶרֶב', ''],
    ['It has pages and you read it.', 'a book', ['a plate', 'a ball'], 'read = לִקְרֹא', '📖'],
    ['He is your mother\'s brother.', 'your uncle', ['your aunt', 'your son'], 'brother = אָח', '', 1],
    ['She is your father\'s mother.', 'your grandmother', ['your sister', 'your daughter'], 'mother = אִמָּא', '', 1],
    ['It is a big gray animal with a long nose.', 'an elephant', ['a mouse', 'a snake'], 'long nose = אַף אָרֹךְ', '🐘'],
    ['You use it to take photos.', 'a camera', ['a guitar', 'a spoon'], 'photos = תְּמוּנוֹת', '📷'],
    ['It is the day after Monday.', 'Tuesday', ['Sunday', 'Friday'], 'after = אַחֲרֵי', ''],
    ['It is the month after March.', 'April', ['May', 'February'], 'after = אַחֲרֵי', ''],
    ['You need it when it rains.', 'an umbrella', ['a suitcase', 'a ring'], 'rain = גֶּשֶׁם', '☂️'],
    ['You ride it. It has no engine.', 'a bicycle', ['a taxi', 'a train'], 'ride = לִרְכֹּב', '🚲'],
    ['It comes after winter. There are many flowers.', 'spring', ['autumn', 'summer'], 'flowers = פְּרָחִים', '🌸'],
    ['You buy food there.', 'a supermarket', ['a museum', 'a bank'], 'buy = לִקְנוֹת', ''],
    ['You put it in tea to make it sweet.', 'sugar', ['salt', 'butter'], 'sweet = מָתוֹק', ''],
    ['This person brings the food in a restaurant.', 'a waiter', ['a pilot', 'a farmer'], 'restaurant = מִסְעָדָה', '', 1],
    ['It is in the sky at night. It is round and white.', 'the moon', ['a star', 'a cloud'], 'night = לַיְלָה', '🌙'],
    ['It gives us milk. It lives on a farm.', 'a cow', ['a horse', 'a pig'], 'milk = חָלָב', '🐄'],
    ['You sleep in it at night.', 'a bed', ['a chair', 'a table'], 'sleep = לִישֹׁן', '🛏️'],
    ['It is the first meal of the day.', 'breakfast', ['dinner', 'lunch'], 'first = רִאשׁוֹן', ''],
    ['It is hot and yellow. It is in the sky in the day.', 'the sun', ['the moon', 'a cloud'], 'hot = חַם', '☀️'],
    ['You wear it on your head.', 'a hat', ['a shoe', 'a sock'], 'head = רֹאשׁ', '🎩'],
    ['It has four legs. You sit on it.', 'a chair', ['a door', 'a window'], 'sit = לָשֶׁבֶת', '🪑'],
    ['This person flies an airplane.', 'a pilot', ['a waiter', 'a driver'], 'airplane = מָטוֹס', '✈️', 1],
    ['She is your mother\'s daughter.', 'your sister', ['your aunt', 'your grandmother'], 'daughter = בַּת', '', 1]
  ];
  function a4(r, K) {
    var d = K.pick(r, RIDDLES);
    return K.q(r, { text: d[0], ltr: true, say: d[5] ? 'Who is it?' : 'What is it?', sayShow: true, answer: d[1], options: [d[1]].concat(d[2]), optLtr: true,
      tip: 'מִלַּת הַמַּפְתֵּחַ בַּחִידָה: ' + d[3],
      ex: [big('קוֹרְאִים אֶת הַחִידָה לְאַט:', d[0]), big('מִלַּת הַמַּפְתֵּחַ:', d[3]), big('הַתְּשׁוּבָה:', d[1] + (d[4] ? ' ' + d[4] : ''))] });
  }

  // ---------- A5: chunks inside a sentence ----------
  var CHUNKS = [ // sentence, chunk, wrong chunks, the chunk with its meaning, short gloss (for the meaning exercise)
    ['Let\'s ___. We need bread and milk.', 'go shopping', ['lie down', 'come in'], 'go shopping = לָלֶכֶת לִקְנִיּוֹת', 'לָלֶכֶת לִקְנִיּוֹת'],
    ['The lesson starts at ___ eight.', 'half past', ['next week', 'a lot'], 'half past eight = שְׁמוֹנֶה וָחֵצִי'],
    ['A: I\'m sorry I\'m late. B: ___', 'Don\'t worry.', ['See you later.', 'Excuse me.'], 'Don\'t worry. = אַל דְּאָגָה', 'אַל דְּאָגָה'],
    ['___ Where is the bank?', 'Excuse me.', ['Good night.', 'As usual.'], 'Excuse me. = סְלִיחָה', 'סְלִיחָה'],
    ['The bank is ___, near the park.', 'on the left', ['last night', 'at least'], 'on the left = מִצַּד שְׂמֹאל', 'מִצַּד שְׂמֹאל'],
    ['I\'m tired. I want to ___.', 'lie down', ['go shopping', 'come along'], 'lie down = לִשְׁכַּב', 'לִשְׁכַּב'],
    ['My grandmother ___ France.', 'comes from', ['gets up', 'goes into'], 'comes from France = בָּאָה מִצָּרְפַת'],
    ['I ___ at seven every morning.', 'get up', ['get off', 'hold on'], 'get up = לָקוּם', 'לָקוּם'],
    ['___ a pizza? Yes, please.', 'Would you like', ['Don\'t forget', 'See you'], 'Would you like a pizza? = רוֹצִים פִּיצָה?'],
    ['Bye! ___ tomorrow!', 'See you', ['Excuse me', 'All right'], 'See you! = לְהִתְרָאוֹת', 'לְהִתְרָאוֹת'],
    ['___ your homework!', 'Don\'t forget', ['Would you like', 'Good evening'], 'Don\'t forget = לֹא לִשְׁכֹּחַ', 'לֹא לִשְׁכֹּחַ'],
    ['We watched a movie ___.', 'last night', ['next week', 'tomorrow'], 'last night = אֶתְמוֹל בַּלַּיְלָה', 'אֶתְמוֹל בַּלַּיְלָה'],
    ['We are going to visit my aunt ___.', 'next week', ['last night', 'yesterday'], 'next week = בַּשָּׁבוּעַ הַבָּא', 'בַּשָּׁבוּעַ הַבָּא'],
    ['I have ___ friends at school.', 'a lot of', ['a bit', 'a while'], 'a lot of = הַרְבֵּה', 'הַרְבֵּה'],
    ['It\'s eight ___. Time for school!', 'o\'clock', ['past', 'quarter'], 'eight o\'clock = הַשָּׁעָה שְׁמוֹנֶה'],
    ['Please ___ the light. It\'s dark here.', 'turn on', ['turn off', 'take off'], 'turn on = לְהַדְלִיק', 'לְהַדְלִיק'],
    ['___ your coat. It\'s warm here.', 'Take off', ['Turn on', 'Wake up'], 'take off = לְהוֹרִיד', 'לְהוֹרִיד'],
    ['I like fruit, ___ apples and bananas.', 'for example', ['as usual', 'at least'], 'for example = לְמָשָׁל', 'לְמָשָׁל'],
    ['My sister can sing, and she can dance ___.', 'as well', ['as usual', 'at least'], 'as well = גַּם כֵּן', 'גַּם כֵּן'],
    ['___! I can\'t find my key.', 'Wait a minute', ['Good evening', 'Not bad'], 'Wait a minute = רַק רֶגַע', 'רַק רֶגַע'],
    ['The party was great. We ___.', 'had fun', ['got up', 'came in'], 'We had fun = נֶהֱנֵינוּ', 'נֶהֱנֵינוּ']
  ];
  var CHUNK_G = CHUNKS.filter(function (c) { return c[4]; });
  function a5(r, K) {
    var c, ex;
    if (r() < 0.6) {
      c = K.pick(r, CHUNKS); ex = [big('הַצֵּרוּף הוּא יְחִידָה אַחַת:', c[3]), big('הַמִּשְׁפָּט הַמָּלֵא:', fill(c[0], c[1]))];
      return K.q(r, { text: c[0], ltr: true, answer: c[1], options: [c[1]].concat(c[2]), optLtr: true, tip: 'צֵרוּף הוּא כַּמָּה מִלִּים שֶׁבָּאוֹת יַחַד. ' + c[3], ex: ex });
    }
    c = K.pick(r, CHUNK_G); ex = [big('הַצֵּרוּף הוּא יְחִידָה אַחַת:', c[3]), big('הַצֵּרוּף בְּתוֹךְ מִשְׁפָּט:', fill(c[0], c[1]))];
    return K.q(r, { text: 'מָה הַפֵּרוּשׁ?', say: c[1].replace(/\.$/, ''), sayShow: true, answer: c[4], options: K.opts(r, c[4], CHUNK_G.map(function (x) { return x[4]; }), 4), tip: 'לֹא מְתַרְגְּמִים מִלָּה מִלָּה. ' + c[3], ex: ex });
  }

  // ---------- B1: short vowels and digraphs ----------
  var B1 = [ // similar words; the first n may be the spoken word (familiar words)
    [['bag', 'big', 'bug'], 2], [['cat', 'cut', 'cot'], 2], [['pen', 'pin', 'pan'], 1], [['hat', 'hot', 'hit'], 2], [['bed', 'bad', 'bud'], 2],
    [['sit', 'sat', 'set'], 1], [['cup', 'cap', 'cop'], 2], [['ten', 'tin', 'tan'], 1], [['red', 'rid', 'rod'], 1], [['fun', 'fan', 'fin'], 1],
    [['leg', 'log', 'lag'], 1], [['pig', 'peg', 'pug'], 1], [['not', 'nut', 'net'], 2], [['sock', 'sick', 'sack'], 2], [['duck', 'dock', 'deck'], 1],
    [['ship', 'shop', 'chip'], 2], [['thin', 'chin', 'shin'], 2], [['fish', 'dish', 'wish'], 3], [['much', 'match', 'mush'], 2]
  ];
  var B1_BUILD = [
    [['b', 'a', 'g'], '👜'], [['c', 'a', 't'], '🐱'], [['p', 'e', 'n'], '🖊️'], [['h', 'a', 't'], '🎩'], [['b', 'e', 'd'], '🛏️'], [['p', 'i', 'g'], '🐷'],
    [['l', 'e', 'g'], '🦵'], [['s', 'o', 'ck'], '🧦'], [['d', 'u', 'ck'], '🦆'], [['sh', 'i', 'p'], '🚢'], [['f', 'i', 'sh'], '🐟'], [['b', 'u', 'g'], '🐛'],
    [['c', 'u', 'p'], ''], [['t', 'e', 'n'], ''], [['r', 'e', 'd'], ''], [['ch', 'i', 'n'], ''], [['th', 'i', 'n'], ''], [['d', 'i', 'sh'], ''],
    [['sh', 'o', 'p'], ''], [['n', 'u', 't'], '🥜'], [['f', 'u', 'n'], ''], [['m', 'u', 'ch'], '']
  ];
  function listenQ(K, r, words, w, tip, line) {
    return K.q(r, { text: 'אֵיזוֹ מִלָּה זוֹ?', say: w, answer: w, options: words.slice(), optLtr: true, tip: tip,
      ex: [{ say: line, svg: wordsSvg(words, diffMarks(words)) }, big('הַמִּלָּה הִיא:', w)] });
  }
  function buildQ(K, r, parts, pic) {
    var w = parts.join(''), o = { fmt: 'order', parts: w.split(''), sep: '', answer: w, text: '', ltr: true, say: w, tip: 'מַקְשִׁיבִים לַמִּלָּה וּבוֹנִים אוֹתָהּ צְלִיל אַחֲרֵי צְלִיל.',
      ex: [big('בּוֹנִים אֶת הַמִּלָּה צְלִיל אַחֲרֵי צְלִיל:', parts.join(' - ')), big('הַמִּלָּה הִיא:', w)] };
    if (pic) o.pic = pic;
    return K.q(r, o);
  }
  function b1(r, K) {
    if (r() < 0.65) { var t = K.pick(r, B1); return listenQ(K, r, t[0], t[0][K.ri(r, 0, t[1] - 1)], 'מַקְשִׁיבִים לַצְּלִיל שֶׁבְּאֶמְצַע הַמִּלָּה.', 'הַמִּלִּים דּוֹמוֹת. רַק הַחֵלֶק הַצָּבוּעַ שׁוֹנֶה.'); }
    var b = K.pick(r, B1_BUILD); return buildQ(K, r, b[0], b[1]);
  }

  // ---------- B2: the silent e ----------
  var B2_RULE = 'הָאוֹת e בְּסוֹף הַמִּלָּה שׁוֹתֶקֶת, וְהַתְּנוּעָה שֶׁלְּפָנֶיהָ אוֹמֶרֶת אֶת הַשֵּׁם שֶׁלָּהּ.';
  var B2 = [ // pair, which of the two may be spoken: 0 both, 1 only the first, 2 only the second
    ['cap', 'cape', 0], ['tap', 'tape', 0], ['mad', 'made', 0], ['hat', 'hate', 0], ['plan', 'plane', 0], ['kit', 'kite', 0], ['bit', 'bite', 0],
    ['rid', 'ride', 2], ['fin', 'fine', 2], ['pin', 'pine', 1], ['Tim', 'time', 2], ['hop', 'hope', 0], ['not', 'note', 0], ['cut', 'cute', 0],
    ['tub', 'tube', 2], ['cub', 'cube', 2], ['us', 'use', 0], ['at', 'ate', 0], ['can', 'cane', 1], ['hid', 'hide', 0]
  ];
  var B2_PIC = [['kite', '🪁'], ['cake', '🎂'], ['nose', '👃'], ['game', '🎮'], ['home', '🏠'], ['plane', '✈️'], ['cap', '🧢'], ['hat', '🎩'], ['pin', '📌'], ['can', '🥫'], ['cube', '🧊']];
  var B2_PAIRPIC = [['kit', 'kite', 1, '🪁'], ['cap', 'cape', 0, '🧢'], ['plan', 'plane', 1, '✈️'], ['can', 'cane', 0, '🥫'], ['pin', 'pine', 0, '📌'], ['cub', 'cube', 1, '🧊'], ['hat', 'hate', 0, '🎩'], ['tub', 'tube', 0, '🛁']];
  function b2(r, K) {
    var t = r(), p, w, o;
    if (t < 0.55) {
      p = K.pick(r, B2); w = p[2] === 1 ? p[0] : p[2] === 2 ? p[1] : p[K.ri(r, 0, 1)];
      return listenQ(K, r, [p[0], p[1]], w, B2_RULE, B2_RULE);
    }
    if (t < 0.8) {
      p = K.pick(r, B2_PIC); o = K.opts(r, p[1], B2_PIC.map(function (x) { return x[1]; }), 3);
      return K.q(r, { text: p[0], ltr: true, answer: p[1], options: o, optHtml: emMap(o), tip: B2_RULE,
        ex: [{ say: /e$/.test(p[0]) ? B2_RULE : 'אֵין e בְּסוֹף הַמִּלָּה, וְלָכֵן הַתְּנוּעָה קְצָרָה.', svg: wordsSvg([p[0]], [/e$/.test(p[0]) ? [p[0].length - 1, p[0].length] : [0, 0]]) }, big('הַמִּלָּה וְהַתְּמוּנָה:', p[0] + ' ' + p[1])] });
    }
    p = K.pick(r, B2_PAIRPIC); w = p[p[2]];
    return K.q(r, { text: 'אֵיזוֹ מִלָּה מַתְאִימָה?', pic: p[3], answer: w, options: [p[0], p[1]], optLtr: true, tip: B2_RULE,
      ex: [{ say: B2_RULE, svg: wordsSvg([p[0], p[1]], diffMarks([p[0], p[1]])) }, big('הַמִּלָּה וְהַתְּמוּנָה:', w + ' ' + p[3])] });
  }

  // ---------- B3: vowel teams ----------
  var TEAMS = [ // letters, sound group, words
    ['ee', 1, 'see tree green sleep week feet three street sheep need'], ['ea', 1, 'eat tea sea read clean teach meat speak cheap seat'],
    ['ai', 2, 'rain train wait'], ['ay', 2, 'day play stay say May today'],
    ['oa', 3, 'boat coat road soap'], ['ow', 3, 'snow yellow window grow low show'],
    ['oo', 4, 'food school moon soon zoo cool tooth'], ['oo', 5, 'book look good foot cook wood'],
    ['ou', 6, 'house mouth out cloud round'], ['ow', 6, 'brown cow down town now']
  ];
  var TW = [];
  TEAMS.forEach(function (t) { t[2].split(' ').forEach(function (w) { TW.push({ w: w, team: t[0], snd: t[1] }); }); });
  var B3_PIC = { tree: '🌳', sheep: '🐑', tea: '🍵', sea: '🌊', meat: '🥩', rain: '🌧️', train: '🚆', boat: '⛵', coat: '🧥', road: '🛣️', soap: '🧼', snow: '❄️', moon: '🌙', tooth: '🦷', book: '📖', house: '🏠', mouth: '👄', cloud: '☁️', cow: '🐄' };
  var TPIC = TW.filter(function (x) { return B3_PIC[x.w]; });
  var SAME_SND = { ee: ['ea'], ea: ['ee'], ai: ['ay'], ay: ['ai'], oa: ['ow'], ow: ['oa', 'ou'], ou: ['ow'], oo: [] };
  var B3_TIP = 'שְׁתֵּי אוֹתִיּוֹת יַחַד נִשְׁמָעוֹת כְּמוֹ צְלִיל אֶחָד.';
  function b3(r, K) {
    var t = r(), x, y, o;
    if (t < 0.45) { // which word has the same sound
      x = K.pick(r, TW); y = K.pick(r, TW.filter(function (c) { return c.snd === x.snd && c.w !== x.w; }));
      var bad = x.snd === 4 ? 5 : x.snd === 5 ? 4 : 0; // the two sounds of oo are never set against each other
      o = [y.w].concat(K.sample(r, [1, 2, 3, 4, 5, 6].filter(function (s) { return s !== x.snd && s !== bad; }), 2).map(function (s) { return K.pick(r, TW.filter(function (c) { return c.snd === s; })).w; }));
      return K.q(r, { text: 'לְאֵיזוֹ מִלָּה יֵשׁ אוֹתוֹ צְלִיל?', say: x.w, sayShow: true, answer: y.w, options: o, optLtr: true, tip: B3_TIP,
        ex: [{ say: B3_TIP, svg: wordsSvg([x.w, y.w], [teamMark(x.w, x.team), teamMark(y.w, y.team)]) }, { say: 'בִּשְׁתֵּי הַמִּלִּים הָאוֹתִיּוֹת הַצְּבוּעוֹת נִשְׁמָעוֹת אוֹתוֹ דָּבָר.' }] });
    }
    x = K.pick(r, TPIC);
    if (t < 0.75) { // the missing vowel team
      o = [x.team].concat(K.sample(r, ['ee', 'ai', 'oa', 'oo', 'ou'].filter(function (c) { return c !== x.team && SAME_SND[x.team].indexOf(c) < 0; }), 2));
      var m = teamMark(x.w, x.team);
      return K.q(r, { text: x.w.slice(0, m[0]) + '__' + x.w.slice(m[1]), ltr: true, pic: B3_PIC[x.w], say: x.w, answer: x.team, options: o, optLtr: true, tip: B3_TIP,
        ex: [{ say: B3_TIP, svg: wordsSvg([x.w], [m]) }, big('הַמִּלָּה וְהַתְּמוּנָה:', x.w + ' ' + B3_PIC[x.w])] });
    }
    o = K.opts(r, B3_PIC[x.w], TPIC.map(function (c) { return B3_PIC[c.w]; }), 3); // read the word, choose the picture
    return K.q(r, { text: x.w, ltr: true, answer: B3_PIC[x.w], options: o, optHtml: emMap(o), tip: B3_TIP,
      ex: [{ say: B3_TIP, svg: wordsSvg([x.w], [teamMark(x.w, x.team)]) }, big('הַמִּלָּה וְהַתְּמוּנָה:', x.w + ' ' + B3_PIC[x.w])] });
  }

  // ---------- B4: irregular (sight) words ----------
  var B4 = [
    [['where', 'were', 'here'], 2], [['there', 'three', 'tree'], 2], [['who', 'how', 'why'], 3], [['one', 'on', 'own'], 2], [['said', 'sad', 'say'], 3],
    [['does', 'goes', 'dose'], 2], [['walk', 'work', 'wake'], 2], [['buy', 'boy', 'bay'], 2], [['friend', 'find', 'front'], 2], [['four', 'far', 'fire'], 2],
    [['could', 'cold', 'cloud'], 3], [['eye', 'yes', 'ear'], 3], [['have', 'gave', 'hive'], 2], [['school', 'shoe', 'cool'], 3], [['some', 'same', 'so'], 3],
    [['they', 'then', 'the'], 2], [['your', 'you', 'year'], 3], [['laugh', 'light', 'left'], 3], [['again', 'ago', 'against'], 2]
  ];
  var B4_BUILD = 'friend said does they your who two one have some could laugh buy walk talk four money bread chair shoe'.split(' ');
  var B4_RULE = 'אֶת הַמִּלָּה הַזֹּאת לֹא קוֹרְאִים לְפִי הַכְּלָלִים. זוֹכְרִים אוֹתָהּ כְּמוֹ תְּמוּנָה.';
  function b4(r, K) {
    if (r() < 0.65) {
      var t = K.pick(r, B4), w = t[0][K.ri(r, 0, t[1] - 1)];
      return K.q(r, { text: 'אֵיזוֹ מִלָּה זוֹ?', say: w, answer: w, options: t[0].slice(), optLtr: true, tip: B4_RULE,
        ex: [big(B4_RULE, w), { say: 'הַמִּלִּים דּוֹמוֹת, אֲבָל כָּל אַחַת נִשְׁמַעַת אַחֶרֶת.', svg: wordsSvg(t[0], [[0, 0], [0, 0], [0, 0]]) }] });
    }
    var b = K.pick(r, B4_BUILD);
    return K.q(r, { fmt: 'order', parts: b.split(''), sep: '', answer: b, text: '', ltr: true, say: b, tip: B4_RULE, ex: [big(B4_RULE, b), big('אוֹת אַחֲרֵי אוֹת:', b.split('').join(' - '))] });
  }

  // ---------- B5: sounds that are hard for Hebrew speakers ----------
  var B5 = [
    ['th', 'בַּצְּלִיל th הַלָּשׁוֹן נוֹגַעַת בַּשִּׁנַּיִם.', 'thin/tin three/tree think/sink thank/tank bath/bat mouth/mouse they/day tenth/tent'],
    ['wv', 'בַּצְּלִיל w מְעַגְּלִים אֶת הַשְּׂפָתַיִם. בַּצְּלִיל v הַשִּׁנַּיִם נוֹגְעוֹת בַּשָּׂפָה.', 'west/vest wet/vet'],
    ['ie', 'הַצְּלִיל הָרִאשׁוֹן קָצָר, וְהַצְּלִיל הַשֵּׁנִי אָרֹךְ.', 'ship/sheep sit/seat it/eat fill/feel his/he\'s this/these chip/cheap hit/heat rich/reach slip/sleep'],
    ['aeu', 'מַקְשִׁיבִים לַתְּנוּעָה שֶׁבְּאֶמְצַע הַמִּלָּה.', 'bad/bed man/men cap/cup hat/hut pan/pen sad/said']
  ];
  var B5P = [];
  B5.forEach(function (g) { g[2].split(' ').forEach(function (p) { B5P.push({ pair: p.split('/'), line: g[1] }); }); });
  function b5(r, K) {
    var p = K.pick(r, B5P), w = p.pair[K.ri(r, 0, 1)];
    if (r() < 0.65) return listenQ(K, r, p.pair, w, p.line, p.line);
    var shown = p.pair[K.ri(r, 0, 1)];
    return K.tf(r, { text: 'הַמִּלָּה הִיא ' + shown, say: w, tip: p.line, ex: [{ say: p.line, svg: wordsSvg(p.pair, diffMarks(p.pair)) }, big('הַמִּלָּה הִיא:', w)] }, shown === w);
  }

  // ---------- C: grammar. An item: [sentence with ___, options (the first ones are the forms), answer, extra…] ----------
  var RIGHT = 'הַמִּשְׁפָּט הַנָּכוֹן:';
  // a fill-in exercise, or the whole sentence as true / false
  function gram(K, r, it, tip, ex, tfShare) {
    var full = fill(it[0], it[2]);
    ex = ex.concat([big(RIGHT, full)]);
    if (r() < tfShare) {
      var truth = r() < 0.5, w = truth ? it[2] : K.pick(r, it[1].filter(function (x) { return x !== it[2]; }));
      return tfQ(K, r, fill(it[0], w), truth, tip, ex);
    }
    return K.q(r, { text: it[0], ltr: true, answer: it[2], options: it[1], optLtr: true, tip: tip, ex: ex });
  }
  function orderQ(K, r, sentence, heb, tip, ex, say) {
    var o = { fmt: 'order', parts: sentence.split(' '), sep: ' ', answer: sentence, text: heb || '', ltr: true, tip: tip, ex: ex };
    if (say) o.say = say;
    return K.q(r, o);
  }

  // C1: am / is / are
  var BE = ['am', 'is', 'are'], BEN = ['isn\'t', 'aren\'t', 'am not'], BEQ = ['Am', 'Is', 'Are'];
  var C1 = [
    ['I ___ ten years old.', BE, 'am', 0], ['My brother ___ tall.', BE, 'is', 1], ['We ___ in the classroom.', BE, 'are', 2], ['The apples ___ red.', ['is', 'are'], 'are', 2],
    ['She ___ my best friend.', BE, 'is', 1], ['You ___ late!', BE, 'are', 2], ['It ___ cold today.', BE, 'is', 1], ['My parents ___ at work.', ['is', 'are'], 'are', 2],
    ['Dana and I ___ sisters.', BE, 'are', 2], ['The book ___ on the table.', ['is', 'are'], 'is', 1], ['I ___ not hungry.', BE, 'am', 0],
    ['He ___ a doctor. He\'s a teacher.', BEN, 'isn\'t', 1], ['They ___ at home. They are at the park.', BEN, 'aren\'t', 2], ['___ you tired?', BEQ, 'Are', 2],
    ['___ your mother a teacher?', BEQ, 'Is', 1], ['___ the children in the garden?', ['Is', 'Are'], 'Are', 2], ['A: Is he your uncle? B: Yes, he ___.', BE, 'is', 1],
    ['A: Are you happy? B: Yes, I ___.', BE, 'am', 0], ['A: Are they from Israel? B: No, they ___.', BEN, 'aren\'t', 2], ['Where ___ my shoes?', BE, 'are', 2],
    ['What ___ your name?', BE, 'is', 1], ['Who ___ that girl?', BE, 'is', 1]
  ];
  var C1_TIP = 'עִם I בּוֹחֲרִים am. עִם he, she, it בּוֹחֲרִים is. עִם we, you, they בּוֹחֲרִים are.';
  function c1(r, K) {
    var it = K.pick(r, C1);
    return gram(K, r, it, C1_TIP, [{ say: 'בְּאַנְגְּלִית חַיָּבִים פֹּעַל בְּכָל מִשְׁפָּט. בּוֹדְקִים עַל מִי מְדַבְּרִים.', svg: tableSvg([['I', 'am'], ['he / she / it', 'is'], ['we / you / they', 'are']], it[3]) }], 0.4);
  }

  // C2: There is / There are, adjective before the noun, a / an
  var C2 = [
    ['There ___ a cat under the chair.', ['is', 'are'], 'is', 't'], ['There ___ two windows in the room.', ['is', 'are'], 'are', 't'],
    ['There ___ many flowers in the garden.', ['is', 'are'], 'are', 't'], ['There ___ a big park near my house.', ['is', 'are'], 'is', 't'],
    ['There ___ any juice in the bottle.', ['isn\'t', 'aren\'t'], 'isn\'t', 't'], ['There ___ any children in the park.', ['isn\'t', 'aren\'t'], 'aren\'t', 't'],
    ['___ there a zoo in your city?', ['Is', 'Are'], 'Is', 't'], ['___ there any apples in the kitchen?', ['Is', 'Are'], 'Are', 't'],
    ['There is ___ apple on the plate.', ['a', 'an'], 'an', 'a'], ['There is ___ book on the table.', ['a', 'an'], 'a', 'a'],
    ['She has ___ orange dress.', ['a', 'an'], 'an', 'a'], ['It is ___ old house.', ['a', 'an'], 'an', 'a'],
    ['I have ___ umbrella.', ['a', 'an'], 'an', 'a'], ['He is eating ___ banana.', ['a', 'an'], 'a', 'a'], ['This is ___ egg.', ['a', 'an'], 'an', 'a'], ['We have ___ new teacher.', ['a', 'an'], 'a', 'a']
  ];
  var ADJ_THING = ['blue', 'big', 'small', 'new', 'old', 'red', 'green'], N_THING = ['car', 'house', 'book', 'ball', 'hat', 'bag', 'shirt', 'bicycle'];
  var ADJ_WHO = ['happy', 'young', 'clever', 'tall', 'old'], N_WHO = ['girl', 'boy', 'teacher', 'doctor'];
  var C2_ORDER = [ // sentence, Hebrew, index of the adjective
    ['I have a red ball.', 'יֵשׁ לִי כַּדּוּר אָדֹם', 3], ['She has long hair.', 'יֵשׁ לָהּ שֵׂעָר אָרֹךְ', 2], ['It is a small house.', 'זֶה בַּיִת קָטָן', 3],
    ['There is a new pupil.', 'יֵשׁ תַּלְמִיד חָדָשׁ', 3], ['He has a big dog.', 'יֵשׁ לוֹ כֶּלֶב גָּדוֹל', 3], ['We have a new teacher.', 'יֵשׁ לָנוּ מוֹרָה חֲדָשָׁה', 3],
    ['There are two red apples.', 'יֵשׁ שְׁנֵי תַּפּוּחִים אֲדֻמִּים', 3], ['This is an old book.', 'זֶה סֵפֶר יָשָׁן', 3], ['I have a blue bag.', 'יֵשׁ לִי תִּיק כָּחֹל', 3],
    ['She has green eyes.', 'יֵשׁ לָהּ עֵינַיִם יְרֻקּוֹת', 2]
  ];
  var ADJ_TIP = 'בְּאַנְגְּלִית הַתֹּאַר בָּא לִפְנֵי שֵׁם הָעֶצֶם.', AN_TIP = 'לִפְנֵי צְלִיל שֶׁל a, e, i, o, u כּוֹתְבִים an.', THERE_TIP = 'אֶחָד: There is. הַרְבֵּה: There are.';
  function c2(r, K) {
    var t = r(), it;
    if (t < 0.5) {
      it = K.pick(r, C2);
      return it[3] === 't' ? gram(K, r, it, THERE_TIP, [{ say: THERE_TIP, svg: tableSvg([['a cat', 'There is'], ['two cats', 'There are']], /^(is|Is|isn't)$/.test(it[2]) ? 0 : 1) }], 0.35)
        : gram(K, r, it, AN_TIP, [{ say: AN_TIP, svg: tableSvg([['book, cat, dog', 'a'], ['apple, egg, old', 'an']], it[2] === 'a' ? 0 : 1) }], 0.35);
    }
    if (t < 0.8) { // which phrase is right
      var who = r() < 0.3, adj = K.pick(r, who ? ADJ_WHO : ADJ_THING), n = K.pick(r, who ? N_WHO : N_THING), art = /^[aeiou]/.test(adj) ? 'an' : 'a', artN = /^[aeiou]/.test(n) ? 'an' : 'a';
      var ok = art + ' ' + adj + ' ' + n;
      return K.q(r, { text: 'מָה נָכוֹן בְּאַנְגְּלִית?', answer: ok, options: [ok, artN + ' ' + n + ' ' + adj, (art === 'a' ? 'an' : 'a') + ' ' + adj + ' ' + n], optLtr: true, tip: ADJ_TIP,
        ex: [{ say: ADJ_TIP, svg: chipsSvg([art, adj, n], 1) }, { say: AN_TIP }] });
    }
    it = K.pick(r, C2_ORDER);
    return orderQ(K, r, it[0], it[1], ADJ_TIP, [{ say: 'הַתֹּאַר, בְּוָרֹד, בָּא לִפְנֵי שֵׁם הָעֶצֶם.', svg: chipsSvg(it[0].split(' '), it[2]) }, big(RIGHT, it[0])]);
  }

  // C3: present simple
  var DN = ['don\'t', 'doesn\'t', 'isn\'t'], WHO2 = 'I / you / we / they', WHO3 = 'he / she / it';
  var C3 = [ // …, kind (s: verb, n: negative, q: question), row of the table (0: I you we they, 1: he she it)
    ['I ___ football every Friday.', ['play', 'plays', 'playing'], 'play', 's', 0], ['My sister ___ books every evening.', ['read', 'reads', 'reading'], 'reads', 's', 1],
    ['We ___ in Haifa.', ['live', 'lives', 'living'], 'live', 's', 0], ['Tom ___ to school at eight.', ['go', 'goes', 'going'], 'goes', 's', 1],
    ['My father ___ the car on Sundays.', ['wash', 'washes', 'washing'], 'washes', 's', 1], ['The children ___ breakfast at seven.', ['eat', 'eats', 'eating'], 'eat', 's', 0],
    ['She ___ English at school.', ['study', 'studies', 'studys'], 'studies', 's', 1], ['He ___ movies after school.', ['watch', 'watches', 'watchs'], 'watches', 's', 1],
    ['I ___ like fish.', DN, 'don\'t', 'n', 0], ['My brother ___ like salad.', DN, 'doesn\'t', 'n', 1], ['They ___ live in a village.', ['don\'t', 'doesn\'t', 'aren\'t'], 'don\'t', 'n', 0],
    ['Dana ___ play the guitar.', DN, 'doesn\'t', 'n', 1], ['___ you like pizza?', ['Do', 'Does', 'Are'], 'Do', 'q', 0], ['___ your mother drive a car?', ['Do', 'Does', 'Is'], 'Does', 'q', 1],
    ['___ they speak English?', ['Do', 'Does', 'Are'], 'Do', 'q', 0], ['A: Do you walk to school? B: Yes, I ___.', ['do', 'does', 'am'], 'do', 'q', 0],
    ['A: Does he play tennis? B: No, he ___.', DN, 'doesn\'t', 'n', 1], ['Where ___ you live?', ['do', 'does', 'are'], 'do', 'q', 0],
    ['What ___ she eat for lunch?', ['do', 'does', 'is'], 'does', 'q', 1], ['When ___ the lesson begin?', ['do', 'does', 'is'], 'does', 'q', 1],
    ['My grandmother always ___ cakes on Friday.', ['bake', 'bakes', 'baking'], 'bakes', 's', 1], ['Cows ___ grass.', ['eat', 'eats', 'eating'], 'eat', 's', 0]
  ];
  var C3_ORDER = [
    ['My sister reads books.', 'אֲחוֹתִי קוֹרֵאת סְפָרִים', 2], ['He doesn\'t like fish.', 'הוּא לֹא אוֹהֵב דָּגִים', 1], ['Do you like pizza?', 'הַאִם אַתֶּם אוֹהֲבִים פִּיצָה', 0],
    ['We live in Haifa.', 'אֲנַחְנוּ גָּרִים בְּחֵיפָה', 1], ['Does she play tennis?', 'הַאִם הִיא מְשַׂחֶקֶת טֶנִיס', 0], ['They don\'t eat meat.', 'הֵם לֹא אוֹכְלִים בָּשָׂר', 1],
    ['Tom goes to school.', 'תּוֹם הוֹלֵךְ לְבֵית הַסֵּפֶר', 1], ['I play football every Friday.', 'אֲנִי מְשַׂחֵק כַּדּוּרֶגֶל כָּל יוֹם שִׁשִּׁי', 1],
    ['She drinks tea every morning.', 'הִיא שׁוֹתָה תֵּה כָּל בֹּקֶר', 1], ['My father drives a taxi.', 'אַבָּא שֶׁלִּי נוֹהֵג בְּמוֹנִית', 2]
  ];
  var S_TIP = 'רַק עִם he, she, it מוֹסִיפִים s לַפֹּעַל.', DO_TIP = 'בִּשְׁלִילָה וּבִשְׁאֵלָה: עִם he, she, it בּוֹחֲרִים does אוֹ doesn\'t. עִם כָּל הַשְּׁאָר: do אוֹ don\'t.';
  function c3(r, K) {
    var it;
    if (r() < 0.75) {
      it = K.pick(r, C3);
      var rows = it[3] === 's' ? [[WHO2, it[1][0]], [WHO3, it[1][1]]] : it[3] === 'n' ? [[WHO2, 'don\'t'], [WHO3, 'doesn\'t']] : [[WHO2, 'do'], [WHO3, 'does']];
      return gram(K, r, it, it[3] === 's' ? S_TIP : DO_TIP, [{ say: it[3] === 's' ? S_TIP : DO_TIP, svg: tableSvg(rows, it[4]) }], 0.4);
    }
    it = K.pick(r, C3_ORDER);
    return orderQ(K, r, it[0], it[1], 'בְּאַנְגְּלִית: קֹדֶם מִי, אַחַר כָּךְ הַפֹּעַל.', [{ say: 'הַסֵּדֶר בַּמִּשְׁפָּט. הַפֹּעַל אוֹ מִלַּת הָעֵזֶר בְּוָרֹד.', svg: chipsSvg(it[0].split(' '), it[2]) }, big(RIGHT, it[0])]);
  }

  // C4: present progressive
  var C4 = [ // …, row of the table (-1: none)
    ['Look! The baby ___.', ['is sleeping', 'sleep', 'are sleeping'], 'is sleeping', 1], ['I ___ my homework now.', ['am doing', 'is doing', 'are doing'], 'am doing', 0],
    ['We ___ a movie now.', ['am watching', 'is watching', 'are watching'], 'are watching', 2], ['Listen! Dana ___.', ['is singing', 'are singing', 'sing'], 'is singing', 1],
    ['The boys ___ football now.', ['is playing', 'are playing', 'am playing'], 'are playing', 2], ['My mother ___ dinner now.', ['is cooking', 'are cooking', 'cook'], 'is cooking', 1],
    ['It ___ now. Take an umbrella.', ['is raining', 'are raining', 'rain'], 'is raining', 1], ['Look! They ___ in the sea.', ['is swimming', 'are swimming', 'am swimming'], 'are swimming', 2],
    ['I ___ watching a movie. I\'m reading.', ['am not', 'isn\'t', 'aren\'t'], 'am not', 0], ['He ___ sleeping. He is playing.', ['am not', 'isn\'t', 'aren\'t'], 'isn\'t', 1],
    ['The children ___ eating. They are drinking.', ['am not', 'isn\'t', 'aren\'t'], 'aren\'t', 2], ['___ you listening?', BEQ, 'Are', 2], ['___ she wearing a hat?', BEQ, 'Is', 1],
    ['What ___ you doing?', BE, 'are', 2], ['Where ___ he going?', BE, 'is', 1], ['A: Are you reading? B: Yes, I ___.', ['am', 'is', 'do'], 'am', 0],
    ['A: Is it raining? B: No, it ___.', ['isn\'t', 'doesn\'t', 'aren\'t'], 'isn\'t', 1], ['What are they ___?', ['do', 'does', 'doing'], 'doing', -1], ['Who ___ singing?', BE, 'is', 1]
  ];
  var ING_TIP = 'מַשֶּׁהוּ שֶׁקּוֹרֶה עַכְשָׁו: am, is אוֹ are, וְאַחֲרֵיהֶם פֹּעַל עִם ing.';
  function c4(r, K) {
    var it = K.pick(r, C4);
    return gram(K, r, it, ING_TIP, [{ say: ING_TIP, svg: tableSvg([['I', 'am playing'], ['he / she / it', 'is playing'], ['we / you / they', 'are playing']], it[3]) }], 0.4);
  }

  // C5: Wh questions
  var C5 = [ // question, answer, kind of answer, question word(s) = gloss, wrong question words, may be built from tiles
    ['What is your name?', 'My name is Tom.', 'person', 'What = מָה', ['Where', 'When'], 1], ['How old are you?', 'I\'m eleven.', 'num', 'How old = בֶּן כַּמָּה', ['What', 'Who'], 1],
    ['Where do you live?', 'In Haifa.', 'place', 'Where = אֵיפֹה', ['When', 'Who'], 1], ['When is your birthday?', 'In May.', 'time', 'When = מָתַי', ['Where', 'Who'], 1],
    ['Who is your teacher?', 'Mrs. Levi.', 'person', 'Who = מִי', ['Where', 'When'], 1], ['What is your favorite color?', 'Blue.', 'color', 'What = מָה', ['Who', 'Where'], 0],
    ['Where is the book?', 'It\'s on the table.', 'place', 'Where = אֵיפֹה', ['Who', 'When'], 1], ['What time is it?', 'It\'s half past two.', 'time', 'What time = מָה הַשָּׁעָה', ['When', 'Where'], 1],
    ['How many brothers do you have?', 'Two.', 'num', 'How many = כַּמָּה', ['What', 'Who'], 0], ['Why are you happy?', 'Because it\'s my birthday.', 'reason', 'Why = לָמָּה', ['Where', 'What'], 1],
    ['What are you doing?', 'I\'m reading a book.', 'act', 'What = מָה', ['Where', 'Who'], 1], ['Where are you going?', 'To the park.', 'place', 'Where = לְאָן', ['When', 'Who'], 1],
    ['What do you eat for breakfast?', 'Bread and cheese.', 'food', 'What = מָה', ['Where', 'When'], 0], ['When do you get up?', 'At seven o\'clock.', 'time', 'When = מָתַי', ['Where', 'What'], 1],
    ['Who is that boy?', 'He\'s my brother.', 'person', 'Who = מִי', ['Where', 'When'], 1], ['How do you go to school?', 'By car.', 'how', 'How = אֵיךְ', ['What', 'Who'], 0],
    ['What day is it today?', 'It\'s Monday.', 'time', 'What day = אֵיזֶה יוֹם', ['Who', 'Where'], 1], ['Why is he at home?', 'Because he is sick.', 'reason', 'Why = לָמָּה', ['Where', 'Who'], 1],
    ['Where does your aunt work?', 'In a hospital.', 'place', 'Where = אֵיפֹה', ['When', 'What'], 1], ['What can you play?', 'I can play the guitar.', 'act', 'What = מָה', ['Where', 'When'], 1],
    ['What is the weather like?', 'It\'s sunny.', 'weather', 'What = מָה', ['How', 'Who'], 0], ['How much is the cake?', 'Ten dollars.', 'num', 'How much = כַּמָּה עוֹלֶה', ['What', 'Who'], 1]
  ];
  var C5_BUILD = C5.filter(function (c) { return c[5]; });
  var WH_TIP = 'מִלַּת הַשְּׁאֵלָה קוֹבַעַת מָה עוֹנִים.';
  function c5(r, K) {
    var t = r(), c = K.pick(r, t < 0.75 ? C5 : C5_BUILD), ex = [big(WH_TIP, c[3]), big('הַשְּׁאֵלָה וְהַתְּשׁוּבָה:', c[0] + ' ' + c[1])], first = c[0].split(' ')[0];
    if (t < 0.4) return K.q(r, { text: 'מָה הַתְּשׁוּבָה?', say: c[0], sayShow: true, answer: c[1], options: K.opts(r, c[1], C5.filter(function (x) { return x[2] !== c[2]; }).map(function (x) { return x[1]; }), 3), optLtr: true, tip: WH_TIP + ' ' + c[3], ex: ex });
    if (t < 0.75) return K.q(r, { text: '___' + c[0].slice(first.length) + ' ' + c[1], ltr: true, answer: first, options: [first].concat(c[4]), optLtr: true, tip: WH_TIP + ' ' + c[3], ex: ex });
    return orderQ(K, r, c[0], '', 'שְׁאֵלָה מַתְחִילָה בְּמִלַּת הַשְּׁאֵלָה. ' + c[3], [{ say: 'מִלַּת הַשְּׁאֵלָה, בְּוָרֹד, בָּאָה רִאשׁוֹנָה.', svg: chipsSvg(c[0].split(' '), 0) }].concat(ex), c[0]);
  }

  // C6: past simple, affirmative
  var C6 = [ // …, kind (r: regular, i: irregular, w: was / were), row for was / were
    ['Yesterday I ___ football.', ['play', 'played', 'playing'], 'played', 'r'], ['We ___ a movie last night.', ['watch', 'watched', 'watches'], 'watched', 'r'],
    ['She ___ her grandmother yesterday.', ['visit', 'visited', 'visits'], 'visited', 'r'], ['He ___ to music last night.', ['listen', 'listened', 'listens'], 'listened', 'r'],
    ['They ___ to school yesterday.', ['walk', 'walked', 'walking'], 'walked', 'r'], ['I ___ my room yesterday.', ['clean', 'cleaned', 'cleans'], 'cleaned', 'r'],
    ['My mother ___ dinner last night.', ['cook', 'cooked', 'cooks'], 'cooked', 'r'], ['We ___ at home last weekend.', ['stay', 'stayed', 'staying'], 'stayed', 'r'],
    ['Dan ___ English yesterday.', ['study', 'studied', 'studyed'], 'studied', 'r'], ['The lesson ___ at eight yesterday.', ['start', 'started', 'starts'], 'started', 'r'],
    ['I ___ to the beach yesterday.', ['go', 'went', 'goed'], 'went', 'i'], ['She ___ a cake last Friday.', ['make', 'made', 'maked'], 'made', 'i'],
    ['We ___ pizza last night.', ['eat', 'ate', 'eated'], 'ate', 'i'], ['He ___ a bird in the garden yesterday.', ['see', 'saw', 'seed'], 'saw', 'i'],
    ['I ___ a sandwich for lunch yesterday.', ['have', 'had', 'haved'], 'had', 'i'], ['My father ___ me a present last week.', ['give', 'gave', 'gived'], 'gave', 'i'],
    ['I ___ a letter to my friend yesterday.', ['write', 'wrote', 'writed'], 'wrote', 'i'], ['She ___ a new dress yesterday.', ['buy', 'bought', 'buyed'], 'bought', 'i'],
    ['He ___ his key yesterday.', ['lose', 'lost', 'losed'], 'lost', 'i'], ['Yesterday the teacher ___ "Good morning".', ['say', 'said', 'sayed'], 'said', 'i'],
    ['I ___ my friends at the park yesterday.', ['meet', 'met', 'meeted'], 'met', 'i'], ['We ___ to London last summer.', ['fly', 'flew', 'flied'], 'flew', 'i'],
    ['Yesterday I ___ sick.', ['was', 'were', 'am'], 'was', 'w', 0], ['We ___ at the beach last Friday.', ['was', 'were', 'are'], 'were', 'w', 1], ['Where ___ you yesterday?', ['was', 'were', 'are'], 'were', 'w', 1]
  ];
  var ED_TIP = 'yesterday, last night: זֶה עָבָר. לְרֹב הַפְּעָלִים מוֹסִיפִים ed.', IRR_TIP = 'יֵשׁ פְּעָלִים שֶׁמִּשְׁתַּנִּים בֶּעָבָר. צָרִיךְ לִזְכֹּר אוֹתָם.', WAS_TIP = 'בֶּעָבָר: עִם I, he, she, it בּוֹחֲרִים was. עִם we, you, they בּוֹחֲרִים were.';
  function c6(r, K) {
    var it = K.pick(r, C6), k = it[3];
    var first = k === 'w' ? { say: WAS_TIP, svg: tableSvg([['I / he / she / it', 'was'], ['we / you / they', 'were']], it[4]) } : big(k === 'r' ? ED_TIP : IRR_TIP, it[1][0] + ' → ' + it[2]);
    return gram(K, r, it, k === 'w' ? WAS_TIP : k === 'r' ? ED_TIP : IRR_TIP, [first], 0.4);
  }

  // C7: now or always, and structures for recognition only
  var NOW_TIP = 'every day, always, usually: מַשֶּׁהוּ שֶׁקּוֹרֶה תָּמִיד. now, Look!, Listen!: מַשֶּׁהוּ שֶׁקּוֹרֶה עַכְשָׁו.';
  var C7 = [ // …, clue word(s), or a full Hebrew line for the recognition items
    ['I ___ to school every day.', ['walk', 'am walking'], 'walk', 'every day'], ['Look! Tom ___ to school now.', ['walks', 'is walking'], 'is walking', 'Look! … now'],
    ['My mother ___ coffee every morning.', ['drinks', 'is drinking'], 'drinks', 'every morning'], ['She ___ coffee now.', ['drinks', 'is drinking'], 'is drinking', 'now'],
    ['We usually ___ lunch at one.', ['eat', 'are eating'], 'eat', 'usually'], ['Be quiet! The baby ___.', ['sleeps', 'is sleeping'], 'is sleeping', 'Be quiet!'],
    ['He always ___ a hat.', ['wears', 'is wearing'], 'wears', 'always'], ['Today he ___ a blue shirt.', ['wears', 'is wearing'], 'is wearing', 'Today'],
    ['They ___ football on Fridays.', ['play', 'are playing'], 'play', 'on Fridays'], ['Listen! They ___ a song.', ['sing', 'are singing'], 'are singing', 'Listen!'],
    ['It often ___ in winter.', ['rains', 'is raining'], 'rains', 'often'], ['Take your coat. It ___ now.', ['rains', 'is raining'], 'is raining', 'now'],
    ['I sometimes ___ my grandmother.', ['visit', 'am visiting'], 'visit', 'sometimes'], ['Right now I ___ a book.', ['read', 'am reading'], 'am reading', 'Right now'],
    ['This is ___ bag.', ['Dana\'s', 'Dana', 'Danas'], 'Dana\'s', '', 'כְּשֶׁמַּשֶּׁהוּ שַׁיָּךְ לְמִישֶׁהוּ מוֹסִיפִים לַשֵּׁם \'s.'],
    ['That is ___ house.', ['they', 'their', 'them'], 'their', '', 'their = שֶׁלָּהֶם'], ['This is my brother. ___ name is Ron.', ['His', 'Her', 'He'], 'His', '', 'his = שֶׁלּוֹ. her = שֶׁלָּהּ.'],
    ['The dog is ___.', ['my', 'mine', 'me'], 'mine', '', 'mine = שֶׁלִּי, כְּשֶׁאֵין אַחֲרָיו שֵׁם עֶצֶם.'],
    ['Tomorrow I ___ visit my aunt.', ['am going to', 'went', 'go'], 'am going to', '', 'tomorrow: זֶה עָתִיד. going to אוֹמֵר מָה מִתְכַּוְּנִים לַעֲשׂוֹת.'],
    ['I ___ go to school yesterday.', ['didn\'t', 'don\'t', 'doesn\'t'], 'didn\'t', '', 'yesterday: זֶה עָבָר. בִּשְׁלִילָה בֶּעָבָר בּוֹחֲרִים didn\'t.'],
    ['___ you see the movie last night?', ['Did', 'Do', 'Does'], 'Did', '', 'last night: זֶה עָבָר. שְׁאֵלָה בֶּעָבָר מַתְחִילָה בְּ-Did.']
  ];
  var PAST = 'עָבָר', NOW = 'עַכְשָׁו', FUT = 'עָתִיד';
  var C7_WHEN = [
    ['We are going to play tennis.', FUT, 'going to'], ['I visited my aunt.', PAST, 'visited'], ['I am eating an apple.', NOW, 'am eating'], ['She watched a movie.', PAST, 'watched'],
    ['He is sleeping.', NOW, 'is sleeping'], ['They are going to visit London.', FUT, 'going to'], ['We played football.', PAST, 'played'], ['Dana is going to bake a cake.', FUT, 'going to'],
    ['The children are singing.', NOW, 'are singing'], ['I am going to read a book.', FUT, 'going to']
  ];
  function c7(r, K) {
    var it;
    if (r() < 0.25) {
      it = K.pick(r, C7_WHEN);
      return K.q(r, { text: 'מָתַי זֶה קוֹרֶה?', say: it[0], sayShow: true, answer: it[1], options: [PAST, NOW, FUT], keep: true, tip: 'ed בְּסוֹף הַפֹּעַל: עָבָר. ing: עַכְשָׁו. going to וְאַחֲרָיו פֹּעַל: עָתִיד.',
        ex: [big('מְחַפְּשִׂים אֶת הָרֶמֶז בַּמִּשְׁפָּט:', it[2]), { say: 'ed בְּסוֹף הַפֹּעַל: עָבָר. ing: עַכְשָׁו. going to וְאַחֲרָיו פֹּעַל: עָתִיד.' }, { say: 'הַתְּשׁוּבָה: ' + it[1] }] });
    }
    it = K.pick(r, C7);
    var tip = it[4] || NOW_TIP, ex = it[4] ? [{ say: it[4] }] : [big('מִלַּת הָרֶמֶז:', it[3]), { say: NOW_TIP }];
    return K.q(r, { text: it[0], ltr: true, answer: it[2], options: it[1], optLtr: true, tip: tip, ex: ex.concat([big(RIGHT, fill(it[0], it[2]))]) });
  }

  // ---------- D1: listen to a sentence, choose the picture ----------
  var D1 = [ // sentence, picture, wrong pictures, key word, its meaning
    ['The girl is eating an apple.', '🍎', ['🍌', '🍞'], 'apple', 'תַּפּוּחַ'], ['It is raining today.', '🌧️', ['☀️', '❄️'], 'raining', 'יוֹרֵד גֶּשֶׁם'],
    ['The boy has a guitar.', '🎸', ['📷', '⚽'], 'guitar', 'גִּיטָרָה'], ['There is a bird in the tree.', '🐦', ['🐟', '🐄'], 'bird', 'צִפּוֹר'],
    ['My father drives a taxi.', '🚕', ['🚆', '✈️'], 'taxi', 'מוֹנִית'], ['She is wearing glasses.', '👓', ['🧦', '👗'], 'glasses', 'מִשְׁקָפַיִם'],
    ['I go to school by bicycle.', '🚲', ['🚗', '⛵'], 'bicycle', 'אוֹפַנַּיִם'], ['He is reading a newspaper.', '📰', ['📖', '✉️'], 'newspaper', 'עִתּוֹן'],
    ['We saw an elephant at the zoo.', '🐘', ['🐒', '🐍'], 'elephant', 'פִּיל'], ['Don\'t forget your umbrella.', '☂️', ['🔑', '🧳'], 'umbrella', 'מִטְרִיָּה'],
    ['The moon is in the sky.', '🌙', ['⭐', '☁️'], 'moon', 'יָרֵחַ'], ['I\'d like ice cream, please.', '🍦', ['🍪', '🧀'], 'ice cream', 'גְּלִידָה'],
    ['She plays tennis every Monday.', '🎾', ['⚽', '🎸'], 'tennis', 'טֶנִיס'], ['It is snowing in the mountains.', '❄️', ['🌧️', '🔥'], 'snowing', 'יוֹרֵד שֶׁלֶג'],
    ['The key is in my pocket.', '🔑', ['💍', '🥄'], 'key', 'מַפְתֵּחַ'], ['They are flying to London.', '✈️', ['🚆', '⛵'], 'flying', 'טָסִים'],
    ['He lost his sock.', '🧦', ['👟', '👕'], 'sock', 'גֶּרֶב'], ['There are two cows on the farm.', '🐄', ['🐑', '🐴'], 'cows', 'פָּרוֹת'],
    ['We eat soup with a spoon.', '🥄', ['🍴', '🔪'], 'spoon', 'כַּף'], ['The cat is sleeping on the bed.', '🐱', ['🐶', '🐭'], 'cat', 'חָתוּל'],
    ['It is sunny today.', '☀️', ['🌧️', '❄️'], 'sunny', 'שִׁמְשִׁי'], ['My brother plays football.', '⚽', ['🎾', '🏀'], 'football', 'כַּדּוּרֶגֶל'],
    ['She is eating a banana.', '🍌', ['🍎', '🍞'], 'banana', 'בָּנָנָה'], ['There is a horse on the farm.', '🐴', ['🐑', '🐷'], 'horse', 'סוּס'],
    ['He is wearing a blue shirt.', '👕', ['👗', '🧥'], 'shirt', 'חֻלְצָה'], ['We go to school by bus.', '🚌', ['🚗', '🚲'], 'bus', 'אוֹטוֹבּוּס'],
    ['I can see a star in the sky.', '⭐', ['🌙', '☁️'], 'star', 'כּוֹכָב'], ['Please open the door.', '🚪', ['🪑', '🔑'], 'door', 'דֶּלֶת'],
    ['The boy is drinking milk.', '🥛', ['🍞', '🧀'], 'milk', 'חָלָב']
  ];
  function d1(r, K) {
    var d = K.pick(r, D1), o = [d[1]].concat(d[2]);
    return K.q(r, { text: 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?', say: d[0], answer: d[1], options: o, optHtml: emMap(o), tip: 'מַקְשִׁיבִים פַּעֲמַיִם: פַּעַם לְכָל הַמִּשְׁפָּט, וּפַעַם לְמִלָּה אַחַת חֲשׁוּבָה.',
      ex: [big('הַמִּשְׁפָּט:', d[0]), big('מִלַּת הַמַּפְתֵּחַ: ' + d[4], d[3] + ' ' + d[1])] });
  }

  // ---------- D2: read a sentence, true or false ----------
  var D2 = [ // sentence, key word = gloss, the corrected sentence when it is false
    ['Fish live in water.', 'water = מַיִם'], ['There are seven days in a week.', 'seven = שֶׁבַע'], ['We wear a coat when it is cold.', 'cold = קַר'],
    ['People sleep at night.', 'night = לַיְלָה'], ['Bananas are yellow.', 'yellow = צָהֹב'], ['A doctor works in a hospital.', 'hospital = בֵּית חוֹלִים'],
    ['Your mother\'s sister is your aunt.', 'aunt = דּוֹדָה'], ['A waiter works in a restaurant.', 'restaurant = מִסְעָדָה'], ['There are twelve months in a year.', 'twelve = שְׁתֵּים עֶשְׂרֵה'],
    ['Farmers work on a farm.', 'farm = חַוָּה'], ['We can see the moon at night.', 'moon = יָרֵחַ'], ['Birds can fly.', 'fly = לָעוּף'], ['Snow is cold.', 'cold = קַר'],
    ['A horse has four legs.', 'four = אַרְבַּע'], ['We drink water.', 'drink = לִשְׁתּוֹת'], ['Monday comes after Sunday.', 'after = אַחֲרֵי'], ['A cat is an animal.', 'animal = חַיָּה'],
    ['A cow can fly.', 'fly = לָעוּף', 'A cow can\'t fly.'], ['Sunday comes after Monday.', 'after = אַחֲרֵי', 'Tuesday comes after Monday.'],
    ['An elephant is a small animal.', 'small = קָטָן', 'An elephant is a big animal.'], ['A week has ten days.', 'ten = עֶשֶׂר', 'A week has seven days.'],
    ['Snow is hot.', 'hot = חַם', 'Snow is cold.'], ['We eat soup with a fork.', 'fork = מַזְלֵג', 'We eat soup with a spoon.'],
    ['Birds have four legs.', 'four = אַרְבַּע', 'Birds have two legs.'], ['We eat breakfast in the evening.', 'evening = עֶרֶב', 'We eat breakfast in the morning.'],
    ['A bicycle has an engine.', 'engine = מָנוֹעַ', 'A bicycle has no engine.'], ['Rabbits eat meat.', 'meat = בָּשָׂר', 'Rabbits don\'t eat meat.'],
    ['January comes after March.', 'after = אַחֲרֵי', 'April comes after March.'], ['Fish can walk.', 'walk = לָלֶכֶת', 'Fish can\'t walk.'],
    ['The sun is cold.', 'cold = קַר', 'The sun is hot.'], ['A mouse is a big animal.', 'big = גָּדוֹל', 'A mouse is a small animal.'],
    ['A dog has two legs.', 'two = שְׁתַּיִם', 'A dog has four legs.'], ['We sleep in the kitchen.', 'kitchen = מִטְבָּח', 'We sleep in the bedroom.'],
    ['Apples are blue.', 'blue = כָּחֹל', 'Apples are red or green.']
  ];
  function d2(r, K) {
    var d = K.pick(r, D2), ex = [big('קוֹרְאִים לְאַט. הַמִּלָּה שֶׁקּוֹבַעַת:', d[1])];
    ex.push(d[2] ? big('הַמִּשְׁפָּט לֹא נָכוֹן. כָּךְ נָכוֹן:', d[2]) : big('הַמִּשְׁפָּט נָכוֹן:', d[0]));
    return tfQ(K, r, d[0], !d[2], 'הַמִּלָּה שֶׁקּוֹבַעַת: ' + d[1], ex);
  }

  // ---------- D3: a short text and one question ----------
  var D3 = [ // text (up to 90 characters), questions: [question, answer, wrong answers, the sentence(s) with the answer, 1 = two sentences are joined]
    ['Hi Dan, I\'m at the park with Tom. We are playing football. Come and play! Roy', [['Where is Roy?', 'at the park', ['at school', 'at home'], 'I\'m at the park with Tom.'], ['What are the boys playing?', 'football', ['tennis', 'basketball'], 'We are playing football.']]],
    ['PARTY! Come to Mia\'s birthday party on Friday at four o\'clock. We have pizza and cake.', [['When is the party?', 'on Friday', ['on Monday', 'on Sunday'], 'on Friday at four o\'clock'], ['What food is there?', 'pizza and cake', ['soup and salad', 'bread and cheese'], 'We have pizza and cake.']]],
    ['My name is Lily. I have two brothers and a sister. My sister is a baby.', [['How many children are in Lily\'s family?', 'four', ['three', 'two'], 'Lily + two brothers + a sister', 1], ['Who is a baby?', 'Lily\'s sister', ['Lily\'s brother', 'Lily'], 'My sister is a baby.']]],
    ['The zoo is open from nine to five. It is closed on Sundays.', [['When can\'t you visit the zoo?', 'on Sunday', ['on Friday', 'at ten o\'clock'], 'It is closed on Sundays.']]],
    ['Tom gets up at seven. He eats breakfast and then he walks to school.', [['What does Tom do first?', 'He gets up.', ['He walks to school.', 'He eats lunch.'], 'Tom gets up at seven.'], ['How does Tom go to school?', 'He walks.', ['By bus.', 'By car.'], 'he walks to school']]],
    ['It is cold and rainy today. Dana is wearing a coat and she has an umbrella.', [['What is the weather like?', 'rainy', ['sunny', 'warm'], 'It is cold and rainy today.'], ['What is Dana wearing?', 'a coat', ['a dress', 'a hat'], 'Dana is wearing a coat']]],
    ['Ben is selling his blue bicycle. It is almost new. The price is only 50 dollars.', [['What is Ben selling?', 'a bicycle', ['a car', 'a camera'], 'Ben is selling his blue bicycle.'], ['What color is the bicycle?', 'blue', ['red', 'green'], 'his blue bicycle']]],
    ['Dear Grandma, Thank you for the book. I read it every evening. I love it! Noa', [['What did Grandma give Noa?', 'a book', ['a doll', 'a cake'], 'Thank you for the book.'], ['When does Noa read?', 'in the evening', ['in the morning', 'at school'], 'I read it every evening.']]],
    ['Sam is sick today. He is in bed. His mother is making soup for him.', [['Why is Sam in bed?', 'He is sick.', ['He is tired.', 'It is night.'], 'Sam is sick today.'], ['Who is making soup?', 'Sam\'s mother', ['Sam\'s father', 'Sam'], 'His mother is making soup for him.']]],
    ['FOOD AND PRICES. Pizza: 10 dollars. Salad: 6 dollars. Ice cream: 4 dollars.', [['How much is the salad?', '6 dollars', ['10 dollars', '4 dollars'], 'Salad: 6 dollars.'], ['How much is the pizza?', '10 dollars', ['6 dollars', '4 dollars'], 'Pizza: 10 dollars.']]],
    ['Yesterday we went to the beach. The water was warm and we swam all day.', [['Where did they go?', 'to the beach', ['to the park', 'to the zoo'], 'Yesterday we went to the beach.']]],
    ['My dog Max is brown and small. He likes to play with a ball. He doesn\'t like cats.', [['What doesn\'t Max like?', 'cats', ['balls', 'children'], 'He doesn\'t like cats.'], ['What color is Max?', 'brown', ['black', 'white'], 'My dog Max is brown and small.']]],
    ['Class 5B is going to visit the museum next Tuesday. Bring a sandwich and water.', [['What do the pupils need to bring?', 'food and water', ['a book', 'money'], 'Bring a sandwich and water.'], ['Where is the class going?', 'to the museum', ['to the zoo', 'to the beach'], 'going to visit the museum']]],
    ['Maya plays the guitar. She has a lesson every Wednesday. She wants to be a singer.', [['When is Maya\'s lesson?', 'on Wednesday', ['on Monday', 'every day'], 'She has a lesson every Wednesday.'], ['What does Maya play?', 'the guitar', ['the piano', 'football'], 'Maya plays the guitar.']]],
    ['Don\'t walk on the grass. Don\'t pick the flowers. Enjoy the garden!', [['Where can you see this sign?', 'in a garden', ['in a kitchen', 'in a classroom'], 'grass + flowers + garden', 1]]],
    ['Hi Mom, I\'m at Dana\'s house. We are doing homework. I\'m coming home at six.', [['What are the girls doing?', 'homework', ['shopping', 'cooking'], 'We are doing homework.'], ['When is she coming home?', 'at six', ['at five', 'at seven'], 'I\'m coming home at six.']]],
    ['There are four rooms in our flat: a kitchen, a living room and two bedrooms.', [['How many bedrooms are there?', 'two', ['four', 'one'], 'two bedrooms']]],
    ['Ben wants to buy a book for his father. He has ten dollars. The book is twelve dollars.', [['Can Ben buy the book?', 'No, he can\'t.', ['Yes, he can.'], 'He has 10 dollars. The book is 12 dollars.', 1]]],
    ['In summer I go to the swimming pool every day. In winter I stay at home and read.', [['What does the writer do in winter?', 'reads at home', ['goes to the pool', 'goes to the beach'], 'In winter I stay at home and read.']]],
    ['The train to Haifa leaves at half past eight. Don\'t be late!', [['When does the train leave?', '8:30', ['8:00', '9:30'], 'half past eight = 8:30'], ['Where does the train go?', 'to Haifa', ['to London', 'to the beach'], 'The train to Haifa']]],
    ['Rina is a nurse. She works at night in a big hospital. She sleeps in the morning.', [['When does Rina work?', 'at night', ['in the morning', 'in the afternoon'], 'She works at night'], ['Where does Rina work?', 'in a hospital', ['in a school', 'in a bank'], 'in a big hospital']]]
  ];
  var D3Q = [];
  D3.forEach(function (d) { d[1].forEach(function (q) { D3Q.push({ text: d[0], q: q }); }); });
  function d3(r, K) {
    var d = K.pick(r, D3Q), q = d.q;
    return K.q(r, { text: d.text, ltr: true, say: q[0], sayShow: true, answer: q[1], options: [q[1]].concat(q[2]), optLtr: true, tip: 'קוֹרְאִים קֹדֶם אֶת הַשְּׁאֵלָה, וְאָז מְחַפְּשִׂים אֶת הַתְּשׁוּבָה בַּטֶּקְסְט.',
      ex: [big('הַשְּׁאֵלָה:', q[0]), big(q[4] ? 'הַתְּשׁוּבָה לֹא כְּתוּבָה בְּמִלָּה אַחַת. מְחַבְּרִים כַּמָּה פְּרָטִים:' : 'הַתְּשׁוּבָה נִמְצֵאת כָּאן בַּטֶּקְסְט:', q[3]), big('הַתְּשׁוּבָה:', q[1])] });
  }

  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'eng', grade: 5,
    tiles: [
      { id: 'eng5words', world: 'מִגְדַּל הַמִּלִּים', name: 'אוֹצַר מִלִּים', icon: '📚', bld: 'tower', hero: 'מִלִּי', levels: [
        { name: 'מִלָּה וּתְמוּנָה', f: a1 }, { name: 'מִלָּה וּפֵרוּשׁ', f: a2 }, { name: 'מִשְׁפְּחוֹת מִלִּים', f: a3 }, { name: 'חִידוֹת', f: a4 }, { name: 'צֵרוּפִים בְּמִשְׁפָּט', f: a5 }] },
      { id: 'eng5sounds', world: 'בֵּית הַצְּלִילִים', name: 'צְלִילִים וּכְתִיב', icon: '🎵', bld: 'house2', hero: 'צְלִיל', levels: [
        { name: 'תְּנוּעוֹת קְצָרוֹת', f: b1 }, { name: 'הָאוֹת e הַשּׁוֹתֶקֶת', f: b2 }, { name: 'צִמְדֵּי תְּנוּעוֹת', f: b3 }, { name: 'מִלִּים שֶׁזּוֹכְרִים', f: b4 }, { name: 'צְלִילִים קָשִׁים', f: b5 }] },
      { id: 'eng5gram', world: 'טִירַת הַמִּשְׁפָּטִים', name: 'בּוֹנִים מִשְׁפָּטִים', icon: '🏰', bld: 'castleSmall', hero: 'מִשְׁפָּטוֹן', levels: [
        { name: 'am, is, are', f: c1 }, { name: 'There is, There are', f: c2 }, { name: 'כָּל יוֹם: Present simple', f: c3 }, { name: 'עַכְשָׁו: ing', f: c4 },
        { name: 'שְׁאֵלוֹת וּתְשׁוּבוֹת', f: c5 }, { name: 'אֶתְמוֹל: עָבָר', f: c6 }, { name: 'עַכְשָׁו אוֹ תָּמִיד?', f: c7 }] },
      { id: 'eng5read', world: 'סִפְרִיַּת הַיַּעַר', name: 'מַקְשִׁיבִים וְקוֹרְאִים', icon: '🌳', bld: 'houseAlt1', hero: 'סַפְרָן', levels: [
        { name: 'מַקְשִׁיבִים וּבוֹחֲרִים תְּמוּנָה', f: d1 }, { name: 'קוֹרְאִים: נָכוֹן אוֹ לֹא', f: d2 }, { name: 'טֶקְסְט קָצָר וּשְׁאֵלָה', f: d3 }] }
    ]
  });
})();
