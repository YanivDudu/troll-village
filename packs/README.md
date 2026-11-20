# Subject packs

Arithmetic lives in `index.html`. Every other subject is a file here, one per subject and grade: `geo1.js` … `geo5.js` (geometry),
`heb1.js` … `heb5.js` (Hebrew), `eng1.js` … `eng5.js` (English). A grade never borrows material from another grade's file.
Grade 5 files are the challenge map of grade 4 players.

Check a file with `node tests/packs.test.js packs/geo2.js` (all files: no argument). It must print `PACKS OK`.

## Shape of a file

```js
(function () {
  'use strict';
  // helpers and item banks of this file only
  (window.TROLL_PACKS = window.TROLL_PACKS || []).push({
    sub: 'geo',            // 'geo' | 'heb' | 'eng'
    grade: 2,              // 1..5
    tiles: [{
      id: 'geo2poly',      // sub + grade + short name, lower-case letters and digits, 3-12 chars, unique in the game
      world: 'כְּפַר הַמְּצֻלָּעִים', // the name on the map (vocalised)
      name: 'מְצֻלָּעִים וְזָוִיּוֹת',  // one line under it
      icon: '🔷',
      bld: 'house1',       // one of: castleSmall castleSmallAlt house1 house2 houseAlt1 houseAlt2 pyramid pyramidMayan tower towerAlt towerSmall
      hero: 'מְצֻלִּי',       // name of the troll rescued in this tile's bridge mission (vocalised, one word)
      levels: [            // the houses, easiest first; each gives 3 stages x 3 stars
        { name: 'שְׁמוֹת הַמְּצֻלָּעִים', f: function (r, K) { return K.q(r, { ... }); } }
      ]
    }]
  });
})();
```

`f(r, K)` returns ONE exercise. `r` is a random function (0..1): use only `r` (never `Math.random`), so exercises are reproducible.
A house must be able to produce at least 24 different exercises (the game avoids repeating the last ones; a stage has 7).

## K (the kit)

- `K.q(r, o)` builds the exercise. Fields of `o`:
  - `text`: the question, vocalised Hebrew (may be `''` when a drawing or a spoken word is the whole question). Keep it short: it must fit a phone.
  - `answer`, `options`: the right answer and 2-4 options that include it (strings or numbers, all different). Shuffled unless `keep: true`.
  - `fmt`: `'choice'` (default), `'tf'` (use `K.tf`), `'order'` (see below).
  - `svg`: an `<svg ...>` string drawn inside the question card. Give it a `viewBox`, width up to about 300, height up to about 170.
  - `pic`: an emoji shown next to the text.
  - `optHtml`: `{ option: html }` when the answer buttons are pictures: small SVG strings (viewBox, about 90 x 70) or `'<span class="em">🐱</span>'`.
  - `optLtr: true`: the options are English.
  - `ltr: true`: the question text itself is English.
  - `say`, `sayShow`: English text that the device reads aloud when the exercise opens (and again on the speaker button).
    Without an English voice the text is shown instead, so an exercise must still make sense when `say` is visible. `sayShow: true` shows it always.
  - `tip`: one vocalised sentence, the hint shown in the discovery stage and the default explanation.
  - `ex`: the explanation after a mistake, in the way it is shown in class for THIS grade: 2-4 steps
    `[{ say: 'vocalised sentence', svg: '<svg…>' } | { say, big: 'text', ltr: true }]`. A step without a picture keeps the previous one.
    Explanation drawings: viewBox up to about 320 x 180.
  - `key`: only if two different exercises could have the same text, answer and drawing.
- `K.tf(r, o, truth)`: a true / false exercise (`o.text` is the statement; options and answer are filled in).
- Ordering by taps: `K.q(r, { fmt: 'order', parts: ['הַיֶּלֶד', 'אָכַל', 'תַּפּוּחַ'], sep: ' ', answer: 'הַיֶּלֶד אָכַל תַּפּוּחַ', text: '…', ltr: false })`.
  `parts` joined by `sep` in the right order must equal `answer`. Use `sep: ''` for letters of a word, `ltr: true` for English. 2-6 parts, no two equal.
- `K.ri(r, lo, hi)` integer in a range, `K.pick(r, arr)`, `K.sample(r, arr, n)`, `K.shuffle(r, arr)` (returns a copy),
  `K.opts(r, answer, pool, n)` → the answer plus other items of the pool, `n` in total (default 4).

## Rules

- Every Hebrew word shown to the child carries niqqud (the test rejects a Hebrew word of two letters or more without any).
  No unvocalised Hebrew anywhere in strings that reach the screen.
- The child only taps. No typing, no free text.
- Wrong options must be plausible, built from the typical mistakes of this grade.
- No text copied from textbooks or from official tests; write items of your own.
- Texts speak to a girl (`בַּחֲרִי`, `הַקִּישִׁי`); the game rewrites them for boys from a fixed table, so use only these address forms:
  `בַּחֲרִי`, `הַקִּישִׁי`, `בּוֹאִי`, `תִּסְתַּכְּלִי`, `הַתְאִימִי`, `שִׂימִי`, `בְּנִי`. Prefer neutral wording (`אֵיזוֹ מִלָּה…?`, `מָה…?`).
- The file touches nothing but `window.TROLL_PACKS`. No network, no storage, no DOM.
