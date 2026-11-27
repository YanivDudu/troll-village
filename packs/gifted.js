// Task "gifted": practice for stage A of the screening test of grade 2 (reading passage, exercises with a missing number,
// word problems, triangle exercises). Pure: no DOM, no storage, no network, no clock. Runs in the page (window.TROLL_GIFTED,
// read by the logic block of index.html) and in Node (tests/gifted.test.js). The reading passages are the bank of
// packs/giftread.js (window.TROLL_GIFT_READ). Every item here is original; nothing is copied from the official samples.
// r is always a random function (0..1): the same r gives the same item.
(function (root) {
  'use strict';
  var BANK = typeof module !== 'undefined' && module.exports ? (function () { try { return require('./giftread.js'); } catch (e) { return null; } })() : root.TROLL_GIFT_READ;
  var LET = ['א', 'ב', 'ג', 'ד'], TRI = '∆', BOX = '□';
  function ri(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function shuffle(r, a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ltr(s) { return '⁦' + s + '⁩'; } // an exercise inside a Hebrew sentence keeps its order

  // ---------- part 2: exercises with a missing number (open answer) ----------
  // forms: the gap at the end, in the middle, at the start. lv 1: + and − up to 50; lv 2: up to 100 and easy tables; lv 3: regrouping, tables up to 9
  function genMiss(r, lv, noMul) {
    var mul = lv === 1 || noMul ? false : r() < (lv === 2 ? 0.4 : 0.5), pos = r() < 0.3 ? 2 : r() < 0.5 ? 1 : 0, a, b, c, op, x, text, ex, wrong, k2;
    if (mul) {
      a = lv === 2 ? pick(r, [2, 3, 4, 5, 10]) : ri(r, 3, 9); b = lv === 2 ? ri(r, 2, 10) : ri(r, 3, 10);
      if (r() < 0.5) { c = a; a = b; b = c; }
      c = a * b; op = '×';
    } else if (r() < 0.5) {
      op = '+';
      if (lv === 1) { a = ri(r, 6, 34); b = ri(r, 4, 50 - a > 25 ? 25 : 50 - a); }
      else { k2 = 0; do { a = ri(r, 12, 68); b = ri(r, 11, 99 - a); } while (lv === 3 && (a % 10) + (b % 10) < 10 && ++k2 < 12); } // level 3: mostly sums that cross a ten
      c = a + b;
    } else {
      op = '−';
      if (lv === 1) { a = ri(r, 12, 50); b = ri(r, 3, Math.min(a - 2, 24)); }
      else { k2 = 0; do { a = ri(r, 31, 100); b = ri(r, 12, a - 5); } while (lv === 3 && a % 10 >= b % 10 && ++k2 < 12); } // level 3: mostly differences that need regrouping
      c = a - b;
    }
    x = pos === 0 ? c : pos === 1 ? b : a;
    text = (pos === 2 ? BOX : a) + ' ' + op + ' ' + (pos === 1 ? BOX : b) + ' = ' + (pos === 0 ? BOX : c);
    var full = a + ' ' + op + ' ' + b + ' = ' + c, Q = function (s) { return s.replace(BOX, '?'); };
    if (pos === 0) ex = [{ say: op === '+' ? 'מְחַבְּרִים אֶת שְׁנֵי הַמִּסְפָּרִים.' : op === '−' ? 'מְחַסְּרִים אֶת הַמִּסְפָּר הַשֵּׁנִי מֵהָרִאשׁוֹן.' : 'כּוֹפְלִים אֶת שְׁנֵי הַמִּסְפָּרִים.', big: Q(text) }, { say: 'כּוֹתְבִים אֶת הַתּוֹצָאָה.', big: full }];
    else if (op === '+') { var known = pos === 1 ? a : b;
      ex = [{ say: 'שׁוֹאֲלִים: ' + known + ' וְעוֹד כַּמָּה הֵם ' + c + '?', big: Q(text) }, { say: 'מְחַסְּרִים מֵהַסְּכוּם אֶת הַמִּסְפָּר שֶׁיּוֹדְעִים.', big: c + ' − ' + known + ' = ' + x }, { say: 'בּוֹדְקִים: עַכְשָׁו הַתַּרְגִּיל נָכוֹן.', big: full }]; }
    else if (op === '−' && pos === 1) ex = [{ say: 'שׁוֹאֲלִים: כַּמָּה מוֹרִידִים מִ-' + a + ' כְּדֵי שֶׁיִּשָּׁאֵר ' + c + '?', big: Q(text) }, { say: 'מְחַסְּרִים מֵהַמִּסְפָּר הַגָּדוֹל אֶת מַה שֶּׁנִּשְׁאַר.', big: a + ' − ' + c + ' = ' + x }, { say: 'בּוֹדְקִים: עַכְשָׁו הַתַּרְגִּיל נָכוֹן.', big: full }];
    else if (op === '−') ex = [{ say: 'הוֹרִידוּ ' + b + ' וְנִשְׁאַר ' + c + '. מֶה הָיָה בַּהַתְחָלָה?', big: Q(text) }, { say: 'מַחְזִירִים אֶת מַה שֶּׁהוֹרִידוּ: מְחַבְּרִים.', big: c + ' + ' + b + ' = ' + x }, { say: 'בּוֹדְקִים: עַכְשָׁו הַתַּרְגִּיל נָכוֹן.', big: full }];
    else { var k = pos === 1 ? a : b, hops = [], i; for (i = 1; i <= x && i <= 10; i++) hops.push(k * i);
      ex = [{ say: 'שׁוֹאֲלִים: ' + k + ' כָּפוּל כַּמָּה הֵם ' + c + '?', big: Q(text) }, { say: 'סוֹפְרִים בִּקְפִיצוֹת שֶׁל ' + k + ' עַד ' + c + '.', big: hops.join(', ') }, { say: 'סָפַרְנוּ ' + x + ' קְפִיצוֹת.', big: full }]; }
    // wrong answers of the typical mistakes (only for a screen that shows options; the tile itself asks for a typed number)
    wrong = pos === 0 ? [op === '+' ? a - b : op === '−' ? a + b : a + b, x + 1, x - 1, x + 10] : op === '+' ? [c + (pos === 1 ? a : b), x + 1, x - 1, x + 10] : op === '−' ? [pos === 1 ? a + c : c - b, x + 1, x - 1, x + 10] : [c - (pos === 1 ? a : b), x + 1, x - 1, c];
    return { part: 'miss', open: true, ltr: true, text: text, answer: x, options: optsNum(x, wrong, r, true), ex: ex, key: 'm|' + text, tip: 'הַמִּסְפָּר הֶחָסֵר לֹא תָּמִיד בַּסּוֹף.', full: full };
  }
  // four different whole numbers, none negative, the answer among them; sorted from small to large, as in the booklet
  function optsNum(ans, wrong, r, any) {
    var out = [ans], i, d = 1;
    wrong.forEach(function (w) { if (out.length < 4 && w === Math.floor(w) && w >= (any ? 0 : 1) && out.indexOf(w) < 0) out.push(w); });
    while (out.length < 4) { var c = ans + (out.length % 2 ? d : -d); if (c >= (any ? 0 : 1) && out.indexOf(c) < 0) out.push(c); else d++; if (d > 40) break; }
    return out.sort(function (a, b) { return a - b; });
  }

  // ---------- part 3: word problems. Written templates; the numbers, the answer and the wrong answers come from code.
  // Every template returns { text, ans, wrong: [the wrong operation, the answer of the first step, one off ...], ex } ----------
  var WORD = [
    // --- level 1: one step ---
    { lv: 1, f: function (r) { var a = ri(r, 12, 38), b = ri(r, 5, 19); return { text: 'בַּסַּל הָיוּ ' + a + ' תַּפּוּחִים. אִמָּא הוֹסִיפָה לַסַּל ' + b + ' תַּפּוּחִים. כַּמָּה תַּפּוּחִים יֵשׁ עַכְשָׁו בַּסַּל?', ans: a + b, wrong: [a - b, a + b + 1, a + b - 10, a + b + 10],
      ex: [{ say: 'הוֹסִיפוּ תַּפּוּחִים, אָז יֵשׁ יוֹתֵר: מְחַבְּרִים.', big: a + ' + ' + b + ' = ' + (a + b) }] }; } },
    { lv: 1, f: function (r) { var a = ri(r, 21, 48), b = ri(r, 4, 17); return { text: 'לְדָנִי הָיוּ ' + a + ' גֻּלּוֹת. הוּא נָתַן ' + b + ' גֻּלּוֹת לְחָבֵר. כַּמָּה גֻּלּוֹת נִשְׁאֲרוּ לְדָנִי?', ans: a - b, wrong: [a + b, a - b - 1, a - b + 10, a - b + 1],
      ex: [{ say: 'נָתַן גֻּלּוֹת, אָז נִשְׁאֲרוּ פָּחוֹת: מְחַסְּרִים.', big: a + ' − ' + b + ' = ' + (a - b) }] }; } },
    { lv: 1, f: function (r) { var a = ri(r, 3, 9), b = pick(r, [2, 4, 5]); return { text: 'בַּכִּתָּה ' + a + ' שֻׁלְחָנוֹת. לְיַד כָּל שֻׁלְחָן יוֹשְׁבִים ' + b + ' יְלָדִים. כַּמָּה יְלָדִים יוֹשְׁבִים בַּכִּתָּה?', ans: a * b, wrong: [a + b, a * b + b, a * b - a, a * b + 1],
      ex: [{ say: 'לְיַד כָּל שֻׁלְחָן אוֹתוֹ מִסְפָּר שֶׁל יְלָדִים: כּוֹפְלִים.', big: a + ' × ' + b + ' = ' + (a * b) }, { say: 'אִם מְחַבְּרִים ' + a + ' וְ-' + b + ' מְקַבְּלִים רַק ' + (a + b) + ', וְזֶה לֹא מִסְפַּר הַיְּלָדִים.' }] }; } },
    { lv: 1, f: function (r) { var k = pick(r, [2, 4, 5]), q = ri(r, 3, 8), n = k * q; return { text: 'סַבְתָּא אָפְתָה ' + n + ' עוּגִיּוֹת. הִיא חִלְּקָה אוֹתָן שָׁוֶה בְּשָׁוֶה בֵּין ' + k + ' נְכָדִים. כַּמָּה עוּגִיּוֹת קִבֵּל כָּל נֶכֶד?', ans: q, wrong: [n - k, q + 1, q - 1, n + k, k],
      ex: [{ say: 'מְחַלְּקִים שָׁוֶה בְּשָׁוֶה: כָּל נֶכֶד מְקַבֵּל אוֹתוֹ מִסְפָּר.', big: n + ' : ' + k + ' = ' + q }, { say: 'בּוֹדְקִים בְּכֶפֶל.', big: k + ' × ' + q + ' = ' + n }] }; } },
    { lv: 1, f: function (r) { var a = ri(r, 14, 37), b = ri(r, 6, 15); return { text: 'לְמַיָּה יֵשׁ ' + a + ' מַדְבֵּקוֹת. לְיוֹאָב יֵשׁ ' + b + ' מַדְבֵּקוֹת יוֹתֵר מֵאֲשֶׁר לְמַיָּה. כַּמָּה מַדְבֵּקוֹת יֵשׁ לְיוֹאָב?', ans: a + b, wrong: [a - b, b, a + b + 10, a + b - 1],
      ex: [{ say: 'לְיוֹאָב יֵשׁ יוֹתֵר מֵאֲשֶׁר לְמַיָּה: מְחַבְּרִים.', big: a + ' + ' + b + ' = ' + (a + b) }] }; } },
    { lv: 1, f: function (r) { var b = ri(r, 8, 19), d = ri(r, 4, 14), a = b + d; return { text: 'בַּגִּנָּה ' + a + ' עֲצֵי תַּפּוּז וְ-' + b + ' עֲצֵי לִימוֹן. כַּמָּה עֲצֵי תַּפּוּז יֵשׁ יוֹתֵר מֵעֲצֵי לִימוֹן?', ans: d, wrong: [a + b, d + 1, d + 10, a],
      ex: [{ say: 'שׁוֹאֲלִים כַּמָּה יוֹתֵר: מוֹצְאִים אֶת הַהֶפְרֵשׁ.', big: a + ' − ' + b + ' = ' + d }] }; } },
    // --- level 2: two steps ---
    { lv: 2, f: function (r) { var k = ri(r, 3, 6), m = pick(r, [2, 4, 5]), t = k * m, e = ri(r, 2, Math.min(6, t - 3)); return { text: 'לְנֹגַהּ ' + k + ' שַׂקִּיּוֹת, וּבְכָל שַׂקִּית ' + m + ' סֻכָּרִיּוֹת. הִיא אָכְלָה ' + e + ' סֻכָּרִיּוֹת. כַּמָּה סֻכָּרִיּוֹת נִשְׁאֲרוּ לָהּ?', ans: t - e, wrong: [t, k + m + e, t + e, k + m - e],
      ex: [{ say: 'קֹדֶם: כַּמָּה סֻכָּרִיּוֹת הָיוּ בְּכָל הַשַּׂקִּיּוֹת?', big: k + ' × ' + m + ' = ' + t }, { say: 'אַחַר כָּךְ מוֹרִידִים אֶת מַה שֶּׁנֶּאֱכַל.', big: t + ' − ' + e + ' = ' + (t - e) }, { say: 'הַמִּסְפָּר ' + t + ' הוּא רַק הַשָּׁלָב הָרִאשׁוֹן, לֹא הַתְּשׁוּבָה.' }] }; } },
    { lv: 2, f: function (r) { var a = ri(r, 8, 19), b = ri(r, 3, 9); return { text: 'בְּיוֹם רִאשׁוֹן קָרְאָה תָּמָר ' + a + ' עַמּוּדִים. בְּיוֹם שֵׁנִי הִיא קָרְאָה ' + b + ' עַמּוּדִים יוֹתֵר מֵאֲשֶׁר בְּיוֹם רִאשׁוֹן. כַּמָּה עַמּוּדִים קָרְאָה תָּמָר בִּשְׁנֵי הַיָּמִים יַחַד?', ans: 2 * a + b, wrong: [a + b, 2 * a, 2 * a + 2 * b, 2 * a + b + 1],
      ex: [{ say: 'קֹדֶם: כַּמָּה עַמּוּדִים קָרְאָה בְּיוֹם שֵׁנִי?', big: a + ' + ' + b + ' = ' + (a + b) }, { say: 'אַחַר כָּךְ מְחַבְּרִים אֶת שְׁנֵי הַיָּמִים.', big: a + ' + ' + (a + b) + ' = ' + (2 * a + b) }, { say: 'הַמִּסְפָּר ' + (a + b) + ' הוּא רַק יוֹם שֵׁנִי, לֹא שְׁנֵי הַיָּמִים יַחַד.' }] }; } },
    { lv: 2, f: function (r) { var k = ri(r, 2, 5), p = pick(r, [2, 4, 5]), a = k * p + ri(r, 3, 20); return { text: 'לְאוֹרִי הָיוּ ' + a + ' שְׁקָלִים. הוּא קָנָה ' + k + ' מַחְבָּרוֹת, וְכָל מַחְבֶּרֶת עוֹלָה ' + p + ' שְׁקָלִים. כַּמָּה שְׁקָלִים נִשְׁאֲרוּ לְאוֹרִי?', ans: a - k * p, wrong: [k * p, a - p, a - k - p, a + k * p],
      ex: [{ say: 'קֹדֶם: כַּמָּה עוֹלוֹת כָּל הַמַּחְבָּרוֹת יַחַד?', big: k + ' × ' + p + ' = ' + (k * p) }, { say: 'אַחַר כָּךְ מוֹרִידִים אֶת הַמְּחִיר מֵהַכֶּסֶף שֶׁהָיָה.', big: a + ' − ' + (k * p) + ' = ' + (a - k * p) }] }; } },
    { lv: 2, f: function (r) { var a = ri(r, 9, 18), b = ri(r, 8, 17), c = ri(r, 5, 12); return { text: 'בַּגַּן שִׂחֲקוּ ' + a + ' בָּנוֹת וְ-' + b + ' בָּנִים. אַחַר כָּךְ הָלְכוּ הַבַּיְתָה ' + c + ' יְלָדִים. כַּמָּה יְלָדִים נִשְׁאֲרוּ בַּגַּן?', ans: a + b - c, wrong: [a + b, a + b + c, a - c > 0 ? a - c : a + c, a + b - c + 1],
      ex: [{ say: 'קֹדֶם: כַּמָּה יְלָדִים שִׂחֲקוּ בַּגַּן?', big: a + ' + ' + b + ' = ' + (a + b) }, { say: 'אַחַר כָּךְ מוֹרִידִים אֶת מִי שֶׁהָלַךְ.', big: (a + b) + ' − ' + c + ' = ' + (a + b - c) }] }; } },
    { lv: 2, f: function (r) { var k = pick(r, [2, 4, 5]), q = ri(r, 4, 9), e = ri(r, 1, 3), n = k * q; return { text: 'בְּקֻפְסָה יֵשׁ ' + n + ' עֶפְרוֹנוֹת. חִלְּקוּ אוֹתָם שָׁוֶה בְּשָׁוֶה בֵּין ' + k + ' קְבוּצוֹת. קְבוּצָה אַחַת אִבְּדָה ' + e + ' עֶפְרוֹנוֹת. כַּמָּה עֶפְרוֹנוֹת נִשְׁאֲרוּ לַקְּבוּצָה הַזֹּאת?', ans: q - e, wrong: [q, n - e, q + e, n - k - e],
      ex: [{ say: 'קֹדֶם: כַּמָּה עֶפְרוֹנוֹת קִבְּלָה כָּל קְבוּצָה?', big: n + ' : ' + k + ' = ' + q }, { say: 'אַחַר כָּךְ מוֹרִידִים אֶת מַה שֶּׁאָבַד.', big: q + ' − ' + e + ' = ' + (q - e) }, { say: 'הַמִּסְפָּר ' + q + ' הוּא רַק הַשָּׁלָב הָרִאשׁוֹן, לֹא הַתְּשׁוּבָה.' }] }; } },
    { lv: 2, f: function (r) { var a = ri(r, 14, 30), b = ri(r, 3, 9), c = ri(r, 4, 12); if (c === b) c++; return { text: 'לְרוֹנִי הָיוּ ' + a + ' בָּלוֹנִים. בַּמְּסִבָּה הִתְפּוֹצְצוּ ' + b + ' בָּלוֹנִים, וְאַבָּא נִפֵּחַ עוֹד ' + c + ' בָּלוֹנִים. כַּמָּה בָּלוֹנִים יֵשׁ לְרוֹנִי עַכְשָׁו?', ans: a - b + c, wrong: [a - b, a - b - c, a + b + c, a + c],
      ex: [{ say: 'קֹדֶם מוֹרִידִים אֶת הַבָּלוֹנִים שֶׁהִתְפּוֹצְצוּ.', big: a + ' − ' + b + ' = ' + (a - b) }, { say: 'אַחַר כָּךְ מוֹסִיפִים אֶת הַבָּלוֹנִים הַחֲדָשִׁים.', big: (a - b) + ' + ' + c + ' = ' + (a - b + c) }] }; } },
    // --- level 3: harder ---
    { lv: 3, f: function (r) { // in how many vases: exactly one of four numbers in a row divides n
        var cand = [], n, lo, k, hits;
        for (n = 14; n <= 55; n++) for (lo = 2; lo <= 5; lo++) { hits = []; for (k = lo; k < lo + 4; k++) if (n % k === 0) hits.push(k); if (hits.length === 1) cand.push([n, lo, hits[0]]); }
        var c = pick(r, cand);
        return { text: 'לְמִיכַל יֵשׁ ' + c[0] + ' פְּרָחִים. הִיא רוֹצָה לָשִׂים בְּכָל אֲגַרְטָל אוֹתוֹ מִסְפָּר שֶׁל פְּרָחִים, בְּלִי שֶׁיִּשָּׁאֵר אַף פֶּרַח. בְּכַמָּה אֲגַרְטָלִים הִיא יְכוֹלָה לְהִשְׁתַּמֵּשׁ?', ans: c[2], fixed: [c[1], c[1] + 1, c[1] + 2, c[1] + 3],
          ex: [{ say: 'מְחַפְּשִׂים מִסְפָּר שֶׁ-' + c[0] + ' מִתְחַלֵּק בּוֹ בְּלִי שְׁאֵרִית. בּוֹדְקִים כָּל תְּשׁוּבָה.' }, { say: 'רַק ' + c[2] + ' מַתְאִים.', big: c[2] + ' × ' + (c[0] / c[2]) + ' = ' + c[0] }] }; } },
    { lv: 3, f: function (r) { var a = ri(r, 4, 9), d = ri(r, 2, 4), s = 3 * a + 3 * d; return { text: 'בְּיוֹם רִאשׁוֹן שָׂם עִדּוֹ בַּקֻּפָּה ' + a + ' מַטְבְּעוֹת. בְּכָל יוֹם אַחֲרָיו הוּא שָׂם ' + d + ' מַטְבְּעוֹת יוֹתֵר מֵאֲשֶׁר בַּיּוֹם שֶׁלִּפְנָיו. כַּמָּה מַטְבְּעוֹת שָׂם עִדּוֹ בַּקֻּפָּה בִּשְׁלוֹשָׁה יָמִים?', ans: s, wrong: [3 * a + d, a + 2 * d, 3 * a, s + d],
      ex: [{ say: 'מוֹצְאִים כַּמָּה שָׂם בְּכָל יוֹם.', big: a + ', ' + (a + d) + ', ' + (a + 2 * d) }, { say: 'מְחַבְּרִים אֶת שְׁלוֹשֶׁת הַיָּמִים.', big: a + ' + ' + (a + d) + ' + ' + (a + 2 * d) + ' = ' + s }, { say: 'הַמִּסְפָּר ' + (a + 2 * d) + ' הוּא רַק הַיּוֹם הַשְּׁלִישִׁי.' }] }; } },
    { lv: 3, f: function (r) { var a = ri(r, 6, 9), d = ri(r, 2, 5), y = ri(r, 3, 8); if (y === d) y++; return { text: 'שִׁירָה בַּת ' + a + '. אָחִיהָ גָּדוֹל מִמֶּנָּה בְּ-' + d + ' שָׁנִים. בֶּן כַּמָּה יִהְיֶה אָחִיהָ בְּעוֹד ' + y + ' שָׁנִים?', ans: a + d + y, wrong: [a + d, a + y, a + d - y, a + d + y + 1],
      ex: [{ say: 'קֹדֶם: בֶּן כַּמָּה אָחִיהָ הַיּוֹם?', big: a + ' + ' + d + ' = ' + (a + d) }, { say: 'אַחַר כָּךְ מוֹסִיפִים אֶת הַשָּׁנִים שֶׁיַּעַבְרוּ.', big: (a + d) + ' + ' + y + ' = ' + (a + d + y) }] }; } },
    { lv: 3, f: function (r) { var c = ri(r, 3, 8), k = ri(r, 2, 5), s = 2 * c + 4 * k; return { text: 'בֶּחָצֵר מְטַיְּלִים ' + c + ' תַּרְנְגוֹלוֹת וְ-' + k + ' כְּלָבִים. כַּמָּה רַגְלַיִם יֵשׁ לְכֻלָּם יַחַד?', ans: s, wrong: [c + k, 2 * (c + k), 4 * (c + k), 4 * c + 2 * k],
      ex: [{ say: 'לְתַרְנְגֹלֶת 2 רַגְלַיִם.', big: c + ' × 2 = ' + (2 * c) }, { say: 'לְכֶלֶב 4 רַגְלַיִם.', big: k + ' × 4 = ' + (4 * k) }, { say: 'מְחַבְּרִים אֶת כָּל הָרַגְלַיִם.', big: (2 * c) + ' + ' + (4 * k) + ' = ' + s }] }; } },
    { lv: 3, f: function (r) { var m = pick(r, [4, 5, 10]), q = ri(r, 3, 9), n = m * q; return { text: 'בְּכָל תַּבְנִית יֵשׁ מָקוֹם לְ-' + m + ' בֵּיצִים. לְסַבָּא יֵשׁ ' + n + ' בֵּיצִים. כַּמָּה תַּבְנִיּוֹת מְלֵאוֹת הוּא יָכוֹל לְמַלֵּא?', ans: q, wrong: [n - m, q + 1, q - 1, n + m],
      ex: [{ say: 'שׁוֹאֲלִים: כַּמָּה פְּעָמִים ' + m + ' נִכְנָס בְּ-' + n + '?', big: n + ' : ' + m + ' = ' + q }, { say: 'בּוֹדְקִים בְּכֶפֶל.', big: q + ' × ' + m + ' = ' + n }] }; } },
    { lv: 3, f: function (r) { var hf = ri(r, 6, 15), b = ri(r, 3, 9), a = 2 * hf; if (b === hf) b++; return { text: 'לְאֵיתָן הָיוּ ' + a + ' קְלָפִים. הוּא נָתַן חֲצִי מֵהֶם לַאֲחוֹתוֹ, וְאַחַר כָּךְ קִבֵּל ' + b + ' קְלָפִים חֲדָשִׁים. כַּמָּה קְלָפִים יֵשׁ לְאֵיתָן עַכְשָׁו?', ans: hf + b, wrong: [hf, a + b, a - b, hf - b > 0 ? hf - b : hf + b + 2],
      ex: [{ say: 'קֹדֶם: חֲצִי מִ-' + a + ' הוּא ' + hf + '. זֶה מַה שֶּׁנִּשְׁאַר לוֹ.', big: a + ' : 2 = ' + hf }, { say: 'אַחַר כָּךְ מוֹסִיפִים אֶת הַקְּלָפִים הַחֲדָשִׁים.', big: hf + ' + ' + b + ' = ' + (hf + b) }] }; } }
  ];
  function genWord(r, lv, at) {
    var list = WORD.filter(function (t) { return t.lv === lv; }), t = at != null ? WORD[at] : pick(r, list), w = t.f(r);
    var opts = w.fixed ? w.fixed.slice() : optsNum(w.ans, w.wrong, r);
    return { part: 'word', text: w.text, answer: w.ans, options: opts, ex: w.ex, key: 'w|' + WORD.indexOf(t) + '|' + w.ans + '|' + opts.join(','), tip: 'קוֹרְאִים עַד הַסּוֹף: לִפְעָמִים צָרִיךְ שְׁנֵי שְׁלַבִּים.' };
  }

  // ---------- part 4: triangle exercises. A true exercise is drawn first, then every place of ONE digit becomes a triangle.
  // triSolve tries all ten digits: the exercise is kept only when exactly one digit makes it true ----------
  function triEval(text, d) {
    var s = text.split(TRI).join(String(d)), m = /^(\d+) ([+−×]) (\d+) = (\d+)$/.exec(s), k;
    if (!m) return false;
    for (k = 1; k <= 4; k += k === 1 ? 2 : 1) if (m[k].length > 1 && m[k].charAt(0) === '0') return false; // a number does not begin with 0
    var a = +m[1], b = +m[3], c = +m[4];
    return (m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b) === c;
  }
  function triLevel(text) { var n = (text.match(/∆/g) || []).length; return n < 2 ? 1 : /×|= [0-9]*∆/.test(text) ? 3 : 2; } // the house an exercise belongs to: one triangle; two; in the result or a multiplication
  function triSolve(text) { var out = [], d; for (d = 0; d <= 9; d++) if (triEval(text, d)) out.push(d); return out; }
  function genTri(r, lv) {
    for (var tries = 0; tries < 4000; tries++) {
      var d = ri(r, lv === 1 ? 1 : 0, 9), op = lv === 3 && r() < 0.3 ? '×' : r() < 0.55 ? '+' : '−', a, b, c, one = function () { return ri(r, 0, 9); }, two = function (tens) { return 10 * (tens ? d || 1 : ri(r, 1, 9)) + (tens ? one() : d); };
      if (op === '×') { a = r() < 0.5 ? d : two(r() < 0.5); b = r() < 0.6 ? d : ri(r, 2, 9); if (a < 2 || b < 2) continue; c = a * b; if (c > 99) continue; }
      else {
        a = two(r() < 0.35); b = lv === 1 ? (r() < 0.5 ? ri(r, 2, 9) : ri(r, 11, 49)) : r() < 0.25 ? d : two(r() < 0.35);
        if (op === '−' && a < b) { c = a; a = b; b = c; }
        c = op === '+' ? a + b : a - b;
        if (c > 99 || c < 1 || b < 1) continue;
      }
      // the places where the digit d stands: [number index, position]
      var nums = [String(a), String(b), String(c)], spots = [], i, j;
      for (i = 0; i < 3; i++) for (j = 0; j < nums[i].length; j++) if (+nums[i].charAt(j) === d) spots.push([i, j]);
      var inRes = spots.filter(function (s) { return s[0] === 2; }), inEx = spots.filter(function (s) { return s[0] < 2; }), use;
      if (lv === 1) { if (inEx.length < 1) continue; use = [pick(r, inEx)]; }                              // one triangle, in the exercise
      else if (lv === 2) { if (inEx.length < 2) continue; use = shuffle(r, inEx).slice(0, 2); }            // two triangles, the same digit
      else { if (spots.length < 2 || (op !== '×' && !inRes.length)) continue; use = op === '×' ? spots.slice(0, 3) : shuffle(r, inEx).slice(0, 2).concat([inRes[0]]); if (use.length < 2) continue; } // also in the result, or a multiplication
      var out = nums.map(function (n, ni) { return n.split('').map(function (ch, pi) { return use.some(function (s) { return s[0] === ni && s[1] === pi; }) ? TRI : ch; }).join(''); });
      var text = out[0] + ' ' + op + ' ' + out[1] + ' = ' + out[2], sol = triSolve(text);
      if (sol.length !== 1 || sol[0] !== d) continue;
      if (lv === 1 && out[0].indexOf(TRI) < 0 && out[1].indexOf(TRI) < 0) continue;
      var lo = Math.max(0, Math.min(6, d - ri(r, 0, 3))), opts = [lo, lo + 1, lo + 2, lo + 3], sub = function (x) { return text.split(TRI).join(String(x)); };
      // the explanation tries the answers, as the booklet does: one that does not fit, then the one that fits
      var bad = pick(r, opts.filter(function (x) { return x !== d && !(x === 0 && /(^|\s)∆\d/.test(text)); })), ex = [{ say: use.length > 1 ? 'בְּכָל הַמְּשֻׁלָּשִׁים מִסְתַּתֶּרֶת אוֹתָהּ סִפְרָה. מְנַסִּים אֶת הַתְּשׁוּבוֹת.' : 'כּוֹתְבִים סִפְרָה בִּמְקוֹם הַמְּשֻׁלָּשׁ וּבוֹדְקִים. מְנַסִּים אֶת הַתְּשׁוּבוֹת.', big: text }];
      if (bad != null) { var m = /^(\d+) ([+−×]) (\d+) = (\d+)$/.exec(sub(bad)), real = m ? (m[2] === '+' ? +m[1] + +m[3] : m[2] === '−' ? +m[1] - +m[3] : +m[1] * +m[3]) : null;
        ex.push({ say: 'מְנַסִּים ' + ltr(TRI + ' = ' + bad) + ': ' + (m && real >= 0 ? ltr(m[1] + ' ' + m[2] + ' ' + m[3] + ' = ' + real) + ', וְלֹא ' + m[4] + '.' : '') + ' לֹא מַתְאִים.', big: sub(bad).replace('=', '≠') }); }
      ex.push({ say: 'מְנַסִּים ' + ltr(TRI + ' = ' + d) + ': הַתַּרְגִּיל נָכוֹן. מַתְאִים!', big: sub(d) });
      return { part: 'tri', ltr: true, text: text, answer: d, options: opts, ex: ex, key: 't|' + text, tip: 'בְּכָל הַמְּשֻׁלָּשִׁים שֶׁל אוֹתוֹ תַּרְגִּיל אוֹתָהּ סִפְרָה.', full: sub(d) };
    }
    return genTri(r, Math.max(1, lv - 1));
  }

  // ---------- part 1: reading. One item for every question of a passage ----------
  var MINI = { id: 'mini', lv: 1, title: 'הַקִּפּוֹד', pic: '🦔', lines: ['הַקִּפּוֹד יוֹצֵא לְחַפֵּשׂ אֹכֶל רַק בַּלַּיְלָה.', 'בַּיּוֹם הוּא יָשֵׁן בֵּין הֶעָלִים.', 'כְּשֶׁהוּא נִבְהָל, הוּא מִתְכַּדֵּר,', 'וְהַקּוֹצִים שֶׁלּוֹ שׁוֹמְרִים עָלָיו.'],
    qs: [{ type: 'trap', q: 'מַדּוּעַ הַקִּפּוֹד מִתְכַּדֵּר?', line: 3, opts: ['כִּי קַר לוֹ', 'כְּדֵי לְהָגֵן עַל עַצְמוֹ', 'כִּי הוּא יוֹצֵא רַק בַּלַּיְלָה', 'כְּדֵי לִישֹׁן'], a: 1, trap: 2,
      ex: ['בְּשׁוּרוֹת 3 וְ-4 כָּתוּב: כְּשֶׁהוּא נִבְהָל הוּא מִתְכַּדֵּר, וְהַקּוֹצִים שׁוֹמְרִים עָלָיו.', 'כְּלוֹמַר, הוּא מִתְכַּדֵּר כְּדֵי לְהָגֵן עַל עַצְמוֹ.', 'נָכוֹן שֶׁהוּא יוֹצֵא רַק בַּלַּיְלָה, אֲבָל זֶה לֹא עוֹנֶה עַל הַשְּׁאֵלָה.'] }] };
  var READ = BANK && BANK.length ? BANK : [MINI];
  function readItem(p, qi) {
    var q = p.qs[qi];
    return { part: 'read', lv: p.lv, text: q.q, answer: q.opts[q.a], options: q.opts.slice(), keep: true, passage: p, qi: qi, line: q.line, type: q.type, trap: q.trap,
      ex: q.ex.map(function (s, i) { return i === 0 ? { say: s, line: q.line } : { say: s }; }), key: 'r|' + p.id + '|' + qi, tip: 'מֻתָּר לַחֲזֹר וְלִקְרֹא בַּקֶּטַע.' };
  }
  function passagesFor(lv) { var l = READ.filter(function (p) { return p.lv === lv; }); return l.length ? l : READ; }
  // the passages of a round: n passages of the level, those whose questions were not shown lately first
  function readPick(r, lv, n, avoid) {
    var seen = {}; (avoid || []).forEach(function (k) { var m = /^r\|([^|]+)\|/.exec(k); if (m) seen[m[1]] = true; });
    var l = shuffle(r, passagesFor(lv)), fresh = l.filter(function (p) { return !seen[p.id]; }), old = l.filter(function (p) { return seen[p.id]; });
    return fresh.concat(old).slice(0, n);
  }

  // ---------- the tiles (for the logic block of index.html) ----------
  var PARTS = ['giftread', 'giftmiss', 'giftword', 'gifttri'], KIND = { giftread: 'read', giftmiss: 'miss', giftword: 'word', gifttri: 'tri' };
  function item(tile, lv, r, noMul) {
    lv = Math.max(1, Math.min(3, lv | 0 || 1));
    var it = tile === 'giftmiss' ? genMiss(r, lv, noMul) : tile === 'giftword' ? genWord(r, lv) : tile === 'gifttri' ? genTri(r, lv) : null;
    if (it) { it.lv = it.part === 'tri' ? triLevel(it.text) : lv; return it; } // (a triangle exercise that fell back to an easier form says so)
    var p = pick(r, passagesFor(lv)); return readItem(p, ri(r, 0, p.qs.length - 1));
  }
  // one practice round of a part: eight items (reading: two passages with all their questions), none of them from `avoid` when there is a choice
  function round(tile, lv, r, avoid, n) {
    var out = [], seen = {}, tries = 0, it; n = n || 8; (avoid || []).forEach(function (k) { seen[k] = true; });
    lv = Math.max(1, Math.min(3, lv | 0 || 1));
    if (tile === 'giftread') { readPick(r, lv, 2, avoid).forEach(function (p) { p.qs.forEach(function (q, i) { out.push(readItem(p, i)); }); }); return out; }
    while (out.length < n && tries++ < 400) {
      // mostly the level itself; the first two a step easier, and one from the level above near the end
      var at = out.length, l = at < 2 && lv > 1 ? lv - 1 : at === n - 2 && lv < 3 ? lv + 1 : lv;
      it = item(tile, l, r, tile === 'giftmiss' && lv === 1); // the level named "addition and subtraction" never shows multiplication, also in its harder item
      if (seen[it.key] && tries < 300) continue;
      if (tile === 'giftword' && tries < 200) { var tk = it.key.split('|')[1], same = out.filter(function (o) { return o.key.split('|')[1] === tk; }).length; if (same > 1 || (same && (out.length < 5 || out[out.length - 1].key.split('|')[1] === tk))) continue; } // a story comes back at most once, late in the round and never right after itself
      seen[it.key] = true; out.push(it);
    }
    return out;
  }
  // the trial test: the four parts in the order of the booklet
  function trial(r, avoid) {
    var a = readPick(r, 1 + (r() < 0.5 ? 1 : 0), 1, avoid)[0], b = readPick(r, 3, 2, avoid).filter(function (p) { return p !== a; })[0] || a, read = [], miss = [], word = [], tri = [], seen = {}, used = {};
    [a, b].forEach(function (p, k) { if (k && p === a) return; p.qs.forEach(function (q, i) { read.push(readItem(p, i)); }); });
    function fill(list, tile, lvs) { lvs.forEach(function (lv) { var it, t = 0; do { it = item(tile, lv, r); } while ((seen[it.key] || (tile === 'giftword' && used[it.key.split('|')[1]])) && ++t < 60); seen[it.key] = true; if (tile === 'giftword') used[it.key.split('|')[1]] = true; list.push(it); }); }
    fill(miss, 'giftmiss', [1, 1, 2, 2, 3, 3]); fill(word, 'giftword', [1, 2, 2, 3]); fill(tri, 'gifttri', [1, 2, 2, 3]);
    return [{ id: 'giftread', items: read }, { id: 'giftmiss', items: miss }, { id: 'giftword', items: word }, { id: 'gifttri', items: tri }];
  }

  // ---------- the instructions before every part, in the way of the examiner, and ONE example that is solved together ----------
  // steps of an example: say (one sentence), and what the page shows at that step: hi (lines of the passage), big (a line of working),
  // off (an answer that is ruled out), mark (the answer that is circled) or fill (the number that is written)
  var GUESS = 'אִם לֹא יוֹדְעִים — מְנַחֲשִׁים, זֶה מֻתָּר.';
  var HOWMARK = 'כָּךְ מְסַמְּנִים: מַקִּיפִים בְּעִגּוּל אֶת הָאוֹת שֶׁל הַתְּשׁוּבָה.';
  var INTRO = {
    giftread: { name: 'קֶטַע קְרִיאָה', lines: ['קִרְאוּ אֶת הַקֶּטַע שֶׁלִּפְנֵיכֶם וַעֲנוּ עַל הַשְּׁאֵלוֹת שֶׁאַחֲרָיו.', 'לְכָל שְׁאֵלָה אַרְבַּע תְּשׁוּבוֹת: א, ב, ג, ד. רַק אַחַת מֵהֶן נְכוֹנָה.', 'הַקִּיפוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.', 'מֻתָּר לַחֲזֹר וְלִקְרֹא בַּקֶּטַע כַּמָּה פְּעָמִים שֶׁרוֹצִים.'],
      ex: readItem(MINI, 0), steps: [
        { say: 'קוֹרְאִים אֶת הַקֶּטַע, וְאָז אֶת הַשְּׁאֵלָה: מַדּוּעַ הַקִּפּוֹד מִתְכַּדֵּר?' },
        { say: 'מְחַפְּשִׂים בַּקֶּטַע אֶת הַמִּלָּה מִתְכַּדֵּר. הִיא בְּשׁוּרָה 3.', hi: [3] },
        { say: 'כָּתוּב שֶׁהַקּוֹצִים שׁוֹמְרִים עָלָיו. כְּלוֹמַר, הוּא מֵגֵן עַל עַצְמוֹ.', hi: [3, 4] },
        { say: 'תְּשׁוּבָה ג נְכוֹנָה לְפִי הַקֶּטַע, אֲבָל הִיא לֹא עוֹנָה עַל הַשְּׁאֵלָה.', hi: [1], off: 2 },
        { say: 'מַקִּיפִים אֶת ב.', hi: [3, 4], off: 2, mark: 1 }] },
    giftmiss: { name: 'תַּרְגִּילִים', lines: ['בְּכָל תַּרְגִּיל חָסֵר מִסְפָּר.', 'הַשְׁלִימוּ אֶת הַמִּסְפָּר הַמַּתְאִים, כָּךְ שֶׁהַתַּרְגִּיל יִהְיֶה נָכוֹן.', 'כָּאן אֵין תְּשׁוּבוֹת לִבְחֹר מֵהֶן: כּוֹתְבִים אֶת הַמִּסְפָּר.', 'שִׂימוּ לֵב: הַמִּסְפָּר הֶחָסֵר לֹא תָּמִיד בַּסּוֹף.'],
      ex: { part: 'miss', open: true, ltr: true, text: '15 + ' + BOX + ' = 40', answer: 25, options: [15, 25, 35, 55], key: 'm|intro', ex: [] }, steps: [
        { say: 'הַמִּסְפָּר הֶחָסֵר בָּאֶמְצַע. שׁוֹאֲלִים: 15 וְעוֹד כַּמָּה הֵם 40?' },
        { say: 'מְחַסְּרִים מֵהַסְּכוּם אֶת הַמִּסְפָּר שֶׁיּוֹדְעִים.', big: '40 − 15 = 25' },
        { say: 'בּוֹדְקִים: 15 וְעוֹד 25 הֵם 40. נָכוֹן!', big: '15 + 25 = 40' },
        { say: 'כּוֹתְבִים 25 בַּמָּקוֹם הֶחָסֵר.', big: '15 + 25 = 40', fill: 25 }] },
    giftword: { name: 'בְּעָיוֹת מִלּוּלִיּוֹת', lines: ['קִרְאוּ כָּל בְּעָיָה עַד הַסּוֹף.', 'חַשְּׁבוּ, וְהַקִּיפוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.', 'לִפְעָמִים צָרִיךְ שְׁנֵי שְׁלַבִּים כְּדֵי לְהַגִּיעַ לַתְּשׁוּבָה.'],
      ex: { part: 'word', text: 'בַּמַּדָּף 3 קֻפְסָאוֹת, וּבְכָל קֻפְסָה 5 צְבָעִים. יוֹנָתָן הוֹצִיא 4 צְבָעִים. כַּמָּה צְבָעִים נִשְׁאֲרוּ בַּקֻּפְסָאוֹת?', answer: 11, options: [4, 11, 15, 19], key: 'w|intro', ex: [] }, steps: [
        { say: 'מָה שׁוֹאֲלִים? כַּמָּה צְבָעִים נִשְׁאֲרוּ.' },
        { say: 'קֹדֶם: כַּמָּה צְבָעִים הָיוּ? 3 קֻפְסָאוֹת, 5 בְּכָל אַחַת.', big: '3 × 5 = 15' },
        { say: 'אַחַר כָּךְ מוֹרִידִים אֶת מַה שֶּׁיּוֹנָתָן הוֹצִיא.', big: '15 − 4 = 11' },
        { say: 'הַמִּסְפָּר 15 מוֹפִיעַ בַּתְּשׁוּבוֹת, אֲבָל הוּא רַק הַשָּׁלָב הָרִאשׁוֹן.', big: '15 − 4 = 11', off: 2 },
        { say: 'מַקִּיפִים אֶת ב.', big: '15 − 4 = 11', off: 2, mark: 1 }] },
    gifttri: { name: 'תַּרְגִּילֵי מְשֻׁלָּשִׁים', lines: ['בְּכָל תַּרְגִּיל יֵשׁ מְשֻׁלָּשׁ בִּמְקוֹם סִפְרָה חֲסֵרָה.', 'בַּחֲרוּ אֵיזוֹ סִפְרָה צְרִיכָה לִהְיוֹת בִּמְקוֹם הַמְּשֻׁלָּשׁ, כָּךְ שֶׁהַתַּרְגִּיל יִהְיֶה נָכוֹן.', 'שִׂימוּ לֵב: בְּכָל הַמְּשֻׁלָּשִׁים שֶׁל אוֹתוֹ תַּרְגִּיל מִסְתַּתֶּרֶת אוֹתָהּ סִפְרָה.'],
      ex: { part: 'tri', ltr: true, text: '2' + TRI + ' + 2' + TRI + ' = 46', answer: 3, options: [2, 3, 4, 5], key: 't|intro', ex: [] }, steps: [
        { say: 'בִּשְׁנֵי הַמְּשֻׁלָּשִׁים מִסְתַּתֶּרֶת אוֹתָהּ סִפְרָה. מְנַסִּים אֶת הַתְּשׁוּבוֹת.' },
        { say: 'מְנַסִּים 2 בִּמְקוֹם כָּל מְשֻׁלָּשׁ. יוֹצֵא 44, וְלֹא 46.', big: '22 + 22 = 44', off: 0 },
        { say: 'מְנַסִּים 3 בִּמְקוֹם כָּל מְשֻׁלָּשׁ. יוֹצֵא 46. מַתְאִים!', big: '23 + 23 = 46', off: 0 },
        { say: 'מַקִּיפִים אֶת ב.', big: '23 + 23 = 46', off: 0, mark: 1 }] }
  };
  var TILES = [
    { id: 'giftread', world: 'קֶטַע קְרִיאָה', name: 'קוֹרְאִים וְעוֹנִים עַל שְׁאֵלוֹת', icon: '📖', bld: 'house1', hero: 'קָרְאָנִי', levels: ['קְטָעִים קַלִּים', 'קְטָעִים בֵּינוֹנִיִּים', 'קְטָעִים מְאַתְגְּרִים'] },
    { id: 'giftmiss', world: 'תַּרְגִּילִים', name: 'מַשְׁלִימִים מִסְפָּר חָסֵר', icon: '✏️', bld: 'house2', hero: 'חַסְרוֹנִי', levels: ['חִבּוּר וְחִסּוּר', 'גַּם כֶּפֶל', 'מִסְפָּרִים גְּדוֹלִים'] },
    { id: 'giftword', world: 'בְּעָיוֹת מִלּוּלִיּוֹת', name: 'קוֹרְאִים, חוֹשְׁבִים וּפוֹתְרִים', icon: '💭', bld: 'houseAlt1', hero: 'בְּעָיוֹנִי', levels: ['שָׁלָב אֶחָד', 'שְׁנֵי שְׁלַבִּים', 'בְּעָיוֹת מְאַתְגְּרוֹת'] },
    { id: 'gifttri', world: 'תַּרְגִּילֵי מְשֻׁלָּשִׁים', name: 'אֵיזוֹ סִפְרָה מִסְתַּתֶּרֶת?', icon: '🔺', bld: 'towerSmall', hero: 'מְשֻׁלָּשִׁי', levels: ['מְשֻׁלָּשׁ אֶחָד', 'שְׁנֵי מְשֻׁלָּשִׁים', 'מְשֻׁלָּשִׁים בְּכָל מָקוֹם'] }
  ];
  var api = { tiles: TILES, PARTS: PARTS, KIND: KIND, LET: LET, TRI: TRI, BOX: BOX, INTRO: INTRO, GUESS: GUESS, HOWMARK: HOWMARK, WORD: WORD, READ: READ, MINI: MINI,
    item: item, round: round, trial: trial, genMiss: genMiss, genWord: genWord, genTri: genTri, triSolve: triSolve, triEval: triEval, triLevel: triLevel, readItem: readItem, readPick: readPick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TROLL_GIFTED = api;
})(this);
