// Task "gifted": checks packs/gifted.js (the generators of the stage-A practice) and its place in the game's logic.
// Usage: node tests/gifted.test.js   -> GIFTED OK ...
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const G = require('../packs/gifted.js');
const NIQ = /[ְ-ׇ]/, bare = s => String(s).replace(/[֑-ׇ⁦⁩]/g, '');
function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function niqqud(s, where) { // every Hebrew word of two letters or more carries a mark; the letters of the answers (א ב ג ד) stand alone
  String(s).split(/[^֐-׿]+/).forEach(w => { if (bare(w).length >= 2) assert(NIQ.test(w), 'a word without niqqud: "' + w + '" in ' + where + ': ' + s); });
  assert(!/[A-Za-z]/.test(s), 'Latin letters in ' + where + ': ' + s);
}
function calc(a, op, b) { return op === '+' ? a + b : op === '−' ? a - b : a * b; }
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const count = { miss: 0, word: 0, tri: 0 };

t('missing number: the answer makes the exercise true, the gap is at the start, in the middle and at the end, numbers 0-100', () => {
  const pos = { 0: 0, 1: 0, 2: 0 }, ops = {}, keys = [new Set(), new Set(), new Set()];
  for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 4000; i++) {
    const q = G.genMiss(seeded(lv * 100000 + i), lv), m = /^(\d+|□) ([+−×]) (\d+|□) = (\d+|□)$/.exec(q.text);
    assert(m, q.text); assert.strictEqual((q.text.match(/□/g) || []).length, 1, q.text);
    const v = [m[1], m[3], m[4]].map(x => x === '□' ? q.answer : +x);
    assert.strictEqual(calc(v[0], m[2], v[1]), v[2], q.text + ' with ' + q.answer);
    assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 100, q.text + ' -> ' + q.answer);
    v.forEach(x => assert(x >= 0 && x <= 100, 'out of range: ' + q.text));
    if (lv === 1) { assert(m[2] !== '×', 'no multiplication at level 1'); assert(Math.max(...v) <= 50, q.text); }
    if (m[2] === '×') assert(v[0] <= 10 && v[1] <= 10 && v[0] >= 2 && v[1] >= 2, q.text);
    pos[m[1] === '□' ? 2 : m[3] === '□' ? 1 : 0]++; ops[m[2]] = 1; keys[lv - 1].add(q.key);
    assert.strictEqual(new Set(q.options).size, 4); assert(q.options.includes(q.answer)); q.options.forEach(o => assert(o >= 0 && Number.isInteger(o)));
    assert(q.ex.length >= 2 && q.ex.length <= 4); q.ex.forEach(s => niqqud(s.say, 'miss ex'));
    assert.strictEqual(q.full.replace(/\s/g, ''), q.text.replace('□', q.answer).replace(/\s/g, ''));
    count.miss++;
  }
  assert(pos[0] > 2000 && pos[1] > 2000 && pos[2] > 2000, 'gap places: ' + JSON.stringify(pos));
  assert.deepStrictEqual(Object.keys(ops).sort(), ['+', '×', '−'].sort());
  keys.forEach((k, i) => assert(k.size >= 100, 'variety at level ' + (i + 1) + ': ' + k.size));
});

t('word problems: four different positive options in rising order, one right answer, vocalised, every template at every seed', () => {
  G.WORD.forEach((tp, at) => {
    const answers = new Set();
    for (let i = 0; i < 1500; i++) {
      const q = G.genWord(seeded(at * 7919 + i), tp.lv, at);
      assert.strictEqual(q.options.length, 4, q.text); assert.strictEqual(new Set(q.options).size, 4, q.text + ' ' + q.options);
      assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, q.text);
      q.options.forEach((o, k) => { assert(Number.isInteger(o) && o >= 1 && o <= 200, q.text + ' option ' + o); if (k) assert(o > q.options[k - 1], 'rising order'); });
      niqqud(q.text, 'word ' + at); q.ex.forEach(s => niqqud(s.say, 'word ex ' + at));
      assert(q.ex.length >= 1 && q.ex.length <= 3, 'steps');
      const sent = bare(q.text).split(/[.?]/).filter(s => s.trim()).length; assert(sent >= 2 && sent <= 4, 'sentences: ' + q.text);
      assert(/\?$/.test(q.text)); assert(bare(q.text).length <= 190, 'too long: ' + bare(q.text).length);
      // the working shown in the explanation is right, and its last line ends with the answer
      const bigs = q.ex.filter(s => s.big && /=/.test(s.big)).map(s => s.big);
      bigs.forEach(b => { const m = /^(.+) = (\d+)$/.exec(b); assert(m, b); const parts = m[1].split(' '); let v = +parts[0];
        if (parts[1] === ':' ) v = +parts[0] / +parts[2]; else for (let k = 1; k < parts.length; k += 2) v = calc(v, parts[k], +parts[k + 1]);
        assert.strictEqual(v, +m[2], 'working: ' + b + ' in ' + q.text); });
      if (bigs.length) assert(new RegExp('(^|[^\\d])' + q.answer + '([^\\d]|$)').test(bigs[bigs.length - 1]), 'the last line of the working shows the answer: ' + bigs + ' / ' + q.answer);
      answers.add(q.text); count.word++;
    }
    assert(answers.size >= 12, 'variety of template ' + at + ': ' + answers.size);
  });
  [1, 2, 3].forEach(lv => assert(G.WORD.filter(x => x.lv === lv).length >= 5, 'templates at level ' + lv));
});

t('triangles: exactly ONE digit of 0-9 makes the exercise true (brute force), four different options, the triangle as tens and as units', () => {
  const place = { tens: 0, units: 0, res: 0, mul: 0 }, keys = [new Set(), new Set(), new Set()];
  for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 3000; i++) {
    const q = G.genTri(seeded(lv * 31337 + i), lv), sol = [];
    for (let d = 0; d <= 9; d++) { // an independent check: put the digit in, read the numbers, do the arithmetic
      const s = q.text.split('∆').join(String(d)), m = /^(\d+) ([+−×]) (\d+) = (\d+)$/.exec(s); assert(m, q.text);
      if ([m[1], m[3], m[4]].some(x => x.length > 1 && x[0] === '0')) continue;
      if (calc(+m[1], m[2], +m[3]) === +m[4]) sol.push(d);
    }
    assert.deepStrictEqual(sol, [q.answer], q.text + ' has the solutions ' + sol);
    assert.deepStrictEqual(Array.from(G.triSolve(q.text)), [q.answer]);
    assert.strictEqual(q.options.length, 4); assert.strictEqual(new Set(q.options).size, 4);
    q.options.forEach((o, k) => { assert(Number.isInteger(o) && o >= 0 && o <= 9); if (k) assert.strictEqual(o, q.options[k - 1] + 1, 'digits in a row'); });
    assert(q.options.includes(q.answer), q.text);
    const m = /^(\S+) ([+−×]) (\S+) = (\S+)$/.exec(q.text), nt = (q.text.match(/∆/g) || []).length;
    [m[1], m[3], m[4]].forEach(x => { const v = +x.split('∆').join(String(q.answer)); assert(v >= 0 && v <= 99, 'range: ' + q.text); });
    if (lv === 1) assert.strictEqual(nt, 1, q.text); else assert(nt >= 2 && nt <= 4, q.text);
    if (lv < 3) { assert(m[4].indexOf('∆') < 0, 'no triangle in the result before level 3: ' + q.text); assert(m[2] !== '×'); }
    if (/∆\d/.test(q.text) || /∆∆/.test(q.text)) place.tens++; if (/\d∆/.test(q.text) || /(^| )∆( |$)/.test(q.text)) place.units++; if (m[4].indexOf('∆') >= 0) place.res++; if (m[2] === '×') place.mul++;
    q.ex.forEach(s => niqqud(s.say, 'tri ex')); assert(q.ex.length >= 2 && q.ex.length <= 3);
    assert(q.ex[q.ex.length - 1].big === q.full && G.triEval(q.full, 0), 'the last step shows the solved exercise');
    keys[lv - 1].add(q.key); count.tri++;
  }
  assert(place.tens > 500 && place.units > 500 && place.res > 300 && place.mul > 100, JSON.stringify(place));
  keys.forEach((k, i) => assert(k.size >= 60, 'variety at level ' + (i + 1) + ': ' + k.size));
});

t('reading: every question of the bank becomes an item with one right answer; a round is two passages of the level', () => {
  assert(G.READ.length >= 12, 'passages: ' + G.READ.length);
  G.READ.forEach(p => p.qs.forEach((q, i) => { const it = G.readItem(p, i);
    assert.strictEqual(it.options.length, 4); assert.strictEqual(new Set(it.options).size, 4, p.id); assert.strictEqual(it.options.filter(o => o === it.answer).length, 1);
    assert.strictEqual(it.options[q.a], it.answer); niqqud(it.text, p.id); it.options.forEach(o => niqqud(o, p.id)); it.ex.forEach(s => niqqud(s.say, p.id)); p.lines.forEach(l => niqqud(l, p.id)); niqqud(p.title, p.id); }));
  for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 50; i++) {
    const r = G.round('giftread', lv, seeded(i + lv * 977), []), ids = Array.from(new Set(r.map(x => x.passage.id)));
    assert.strictEqual(ids.length, 2); assert(r.length >= 6 && r.length <= 8); r.forEach(x => assert.strictEqual(x.passage.lv, lv));
    assert.strictEqual(new Set(r.map(x => x.key)).size, r.length);
    const again = G.round('giftread', lv, seeded(i + 5), r.map(x => x.key)); // the passages that were just read come last
    if (G.READ.filter(p => p.lv === lv).length >= 4) again.forEach(x => assert(ids.indexOf(x.passage.id) < 0, 'a passage of the round before came back at once'));
  }
});

t('the label of an exercise is the house it comes from: the number of triangles matches the name', () => {
  for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 2000; i++) { const q = G.item('gifttri', lv, seeded(i * 3 + lv)), n = (q.text.match(/∆/g) || []).length, res = /= [0-9]*∆/.test(q.text) || /×/.test(q.text);
    assert(q.lv >= 1 && q.lv <= lv, q.text); if (q.lv === 1) assert.strictEqual(n, 1, q.text); if (q.lv === 2) { assert.strictEqual(n, 2, q.text); assert(!res, q.text); } if (q.lv === 3) assert(n >= 2 && res, q.text); }
  assert.strictEqual(G.tiles[3].levels[0], 'מְשֻׁלָּשׁ אֶחָד'); assert.strictEqual(G.tiles[3].levels[1], 'שְׁנֵי מְשֻׁלָּשִׁים');
  ['giftmiss', 'giftword', 'giftread'].forEach(id => { for (let lv = 1; lv <= 3; lv++) G.round(id, lv, seeded(lv), []).forEach(q => assert(q.lv >= 1 && q.lv <= 3 && Math.abs(q.lv - lv) <= 1, id)); });
});

t('rounds and the trial test: eight different items a round; the trial has the four parts in the order of the booklet', () => {
  ['giftmiss', 'giftword', 'gifttri'].forEach(id => { for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 60; i++) {
    const r = G.round(id, lv, seeded(i * 13 + lv), []); assert.strictEqual(r.length, 8, id); assert.strictEqual(new Set(r.map(x => x.key)).size, 8, id + ' repeats');
    if (id === 'giftword') { const st = r.map(x => x.key.split('|')[1]); assert(new Set(st).size >= 5, 'stories in a round: ' + st); st.forEach((x, k) => { if (k) assert.notStrictEqual(x, st[k - 1], 'the same story twice in a row'); }); } } });
  for (let i = 0; i < 200; i++) {
    const tr = G.trial(seeded(i + 1), []);
    assert.deepStrictEqual(tr.map(p => p.id), ['giftread', 'giftmiss', 'giftword', 'gifttri']);
    assert.deepStrictEqual(tr.map(p => p.items.length), [G.READ.length > 1 ? 8 : tr[0].items.length, 6, 4, 4]);
    assert.strictEqual(new Set(tr[0].items.map(x => x.passage.id)).size, G.READ.length > 1 ? 2 : 1);
    const keys = [].concat(...tr.map(p => p.items.map(x => x.key))); assert.strictEqual(new Set(keys).size, keys.length, 'an item twice in one test');
  }
});

t('instructions: vocalised, one worked example per part whose last step marks the right answer', () => {
  niqqud(G.GUESS, 'guess'); niqqud(G.HOWMARK, 'mark'); assert(/מְנַחֲשִׁים/.test(G.GUESS));
  G.PARTS.forEach(id => { const I = G.INTRO[id]; niqqud(I.name, id); assert(I.lines.length >= 3 && I.lines.length <= 4); I.lines.forEach(l => niqqud(l, id));
    assert(I.steps.length >= 4 && I.steps.length <= 5); I.steps.forEach(s => niqqud(s.say, id)); niqqud(I.ex.text, id);
    const last = I.steps[I.steps.length - 1]; if (I.ex.open) assert.strictEqual(last.fill, I.ex.answer); else assert.strictEqual(I.ex.options[last.mark], I.ex.answer, id);
    assert.strictEqual(new Set(I.ex.options).size, 4); });
  assert.deepStrictEqual(Array.from(G.triSolve(G.INTRO.gifttri.ex.text)), [3]);
  G.tiles.forEach(tl => { niqqud(tl.world, tl.id); niqqud(tl.name, tl.id); niqqud(tl.hero, tl.id); assert.strictEqual(tl.levels.length, 3); tl.levels.forEach(l => niqqud(l, tl.id)); });
});

t('in the game: the four tiles are topics of grade 2 outside the four subjects; grade 2 itself and the next step are untouched; the gold troll', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), src = /<script id="logic">([\s\S]*?)<\/script>/.exec(html)[1];
  const mk = withGift => { const ctx = {}; vm.createContext(ctx); if (withGift) { ctx.TROLL_GIFTED = G; } vm.runInContext(src + ';this.L=TrollLogic;', ctx); return ctx.L; };
  const L = mk(true), L0 = mk(false);
  assert.deepStrictEqual(Array.from(L.GIFT_IDS), G.PARTS); assert.deepStrictEqual(Array.from(L0.GIFT_IDS), []);
  assert.deepStrictEqual(Array.from(L.topicsFor(L.newState(2))), Array.from(L0.topicsFor(L0.newState(2))), 'the maths tiles of grade 2');
  assert(L.SUBS.indexOf('gift') < 0);
  const s = L.newState(2);
  G.PARTS.forEach(id => { const tp = L.TOPICS.find(x => x.id === id); assert(tp && tp.sub === 'gift' && tp.g === 2 && tp.levels.length === 3); assert.strictEqual(s.levels[id], 1, 'a new player starts at the first step'); assert.strictEqual(L.bossLevels(id, 2).length, 0); });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(L.nextStep(s))), JSON.parse(JSON.stringify(L0.nextStep(L0.newState(2)))), 'the next step of a new player');
  assert.strictEqual(L.giftOn(L.newState(2)), true); assert.strictEqual(L.giftOn(L.newState(1)), false); assert.strictEqual(L.giftOn(L.newState(3)), false, 'grade 3 is switched off'); assert.strictEqual(L.giftOn(L.newState(4)), false);
  assert.strictEqual(L0.giftOn(L0.newState(2)), false);
  // an item as an exercise of the game: makeQuestion of every tile and level
  G.PARTS.forEach(id => { for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 300; i++) { const q = L.makeQuestion(id, lv, L.seeded(i + 1));
    assert(q.pack && q.gift && q.topic === id && q.level === lv && q.key && q.ex.steps.length >= 1); assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, q.text); assert.strictEqual(new Set(q.options).size, q.options.length); } });
  // a finished round is saved in the usual fields and survives saving and loading; an old page (without the tiles) keeps everything else
  let r = L.finishHouse(s, 'gifttri', 1, [true, true, true, true, true, true, true, true], null);
  assert.strictEqual(r.won, true); assert.strictEqual(r.opened, 2); assert.strictEqual(r.state.levels.gifttri, 2);
  const st = r.state; st.owned = [3, L.GOLD_ID]; st.buddy = L.GOLD_ID; st.dress = {}; st.dress[L.GOLD_ID] = { acc: 'bow', hair: 2 };
  const back = L.loadState(JSON.stringify(st));
  assert.deepStrictEqual(Array.from(back.prog.gifttri[0]), Array.from(st.prog.gifttri[0])); assert.strictEqual(back.levels.gifttri, 2); assert.deepStrictEqual(Array.from(back.owned), [3, L.GOLD_ID]); assert.strictEqual(back.buddy, L.GOLD_ID);
  const old = L0.loadState(JSON.stringify(st)); assert.deepStrictEqual(Array.from(old.owned), [3, L.GOLD_ID], 'an older page keeps the gold troll in the collection'); assert.strictEqual(old.stars, st.stars); assert.strictEqual(old.v, 4); assert.strictEqual(st.v, 4);
  const gold = L.trollFromId(L.GOLD_ID); assert.strictEqual(gold.gold, true); niqqud(gold.name, 'gold'); assert.strictEqual(L.trollFromId(L.GOLD_ID - 1).gold, undefined);
  for (let i = 0; i < 3000; i++) assert.notStrictEqual(L.rollTroll([], L.seeded(i)).id, L.GOLD_ID, 'the gold troll never comes out of an egg');
  assert.strictEqual(L.hasGold(st), true); assert.strictEqual(L.hasGold(s), false);
  const g1 = L.giveGold(s), g2 = L.giveGold(g1); assert.deepStrictEqual(Array.from(g1.owned), [L.GOLD_ID]); assert.deepStrictEqual(Array.from(g2.owned), [L.GOLD_ID], 'given once'); assert.strictEqual(g1.buddy, L.GOLD_ID, 'a player without trolls gets it as the companion'); assert.deepStrictEqual(Array.from(s.owned), [], 'pure');
});

console.log('GIFTED OK ' + n + ' groups; checked ' + count.miss + ' missing-number exercises, ' + count.word + ' word problems, ' + count.tri + ' triangle exercises, ' + G.READ.length + ' passages');
