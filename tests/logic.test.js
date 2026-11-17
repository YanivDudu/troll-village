const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = /<script id="logic">([\s\S]*?)<\/script>/.exec(html);
const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1] + ';this.L=TrollLogic;', ctx);
const L = ctx.L;
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const strip = s => s.replace(/[\u2066\u2069\u0591-\u05C7]/g, ''); // drop direction marks and niqqud
const ev = s => Function('return (' + s.replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();

t('every topic and level: 4 distinct non-negative options, one correct, maths is right', () => {
  let checked = 0;
  for (const tp of L.TOPICS) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 1500; i++) {
    const q = L.makeQuestion(tp.id, lv, Math.random), s = JSON.stringify(q);
    assert.strictEqual(q.options.length, 4, s);
    assert.strictEqual(new Set(q.options).size, 4, s);
    assert(q.options.every(o => Number.isInteger(o) && o >= 0), s);
    assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, s);
    assert(q.answer >= 0 && q.answer <= 10000, s);
    assert.strictEqual(q.g, tp.levels[lv - 1].g, s);
    if (q.g === 2) assert(q.answer <= 1000, s);
    assert(q.hint && typeof q.hint.tip === 'string' && q.hint.tip.length > 0, s);
    const text = strip(q.text);
    if (q.rtl) {
      let mm;
      if ((mm = /שארית בתרגיל (\d+) : (\d+)/.exec(text))) { assert.strictEqual(mm[1] % mm[2], q.answer, s); checked++; }
      else if ((mm = /פעמים שלמות נכנס (\d+) בתוך (\d+)/.exec(text))) { assert.strictEqual(Math.floor(mm[2] / mm[1]), q.answer, s); checked++; }
      else if (/הכי גדול/.test(text)) { assert.strictEqual(Math.max(...q.options), q.answer, s); checked++; }
      else if (/הכי קטן/.test(text)) { assert.strictEqual(Math.min(...q.options), q.answer, s); checked++; }
      else if (/אי-זוגי/.test(text)) { assert(q.answer % 2 === 1 && q.options.filter(o => o % 2 === 1).length === 1, s); checked++; }
      else if (/זוגי/.test(text)) { assert(q.answer % 2 === 0 && q.options.filter(o => o % 2 === 0).length === 1, s); checked++; }
      else if ((mm = /חצי של (\d+)/.exec(text))) { assert.strictEqual(mm[1] / 2, q.answer, s); checked++; }
      else if ((mm = /רבע של (\d+)/.exec(text)) && !/שלושה/.test(text)) { assert.strictEqual(mm[1] / 4, q.answer, s); checked++; }
      else if ((mm = /פעמיים (\d+)/.exec(text))) { assert.strictEqual(mm[1] * 2, q.answer, s); checked++; }
      else if ((mm = /עשרות שלמות יש במספר (\d+)/.exec(text))) { assert.strictEqual(Math.floor(mm[1] / 10), q.answer, s); checked++; }
      else if ((mm = /עגלי את ([\d,]+) ל(עשרת|מאה)/.exec(text))) {
        const v = +mm[1].replace(/,/g, ''), u = mm[2] === 'עשרת' ? 10 : 100;
        assert.strictEqual(Math.round(v / u) * u, q.answer, s); checked++;
      } else if ((mm = /ספרת (\S+) במספר ([\d,]+)/.exec(text))) {
        const d = mm[2].replace(/,/g, ''), p = ['האחדות', 'העשרות', 'המאות', 'האלפים'].indexOf(mm[1]);
        assert.strictEqual(+d[d.length - 1 - p], q.answer, s); checked++;
      }
    } else if (text.includes('→')) {
      const seq = text.split(' → ').map(x => x === '?' ? q.answer : +x.replace(/,/g, ''));
      const d = seq[1] - seq[0];
      assert(d !== 0 && seq.every((x, k) => k === 0 || x - seq[k - 1] === d) && seq.every(x => x >= 0), s); checked++;
    } else if (text.includes('□')) {
      const [l, r] = text.replace('□', q.answer).split('=');
      assert.strictEqual(ev(l), ev(r), s); checked++;
    } else {
      assert(/ = \?$/.test(text), s);
      assert.strictEqual(ev(text.replace(' = ?', '')), q.answer, s); checked++;
    }
  }
  assert(checked > 55000, 'most questions verified arithmetically: ' + checked);
});
t('grade 3 levels come after grade 2 levels, and every topic has both', () => {
  for (const tp of L.TOPICS) {
    const gs = tp.levels.map(l => l.g);
    assert.deepStrictEqual(gs, gs.slice().sort(), tp.id);
    assert(gs.includes(2) && gs.includes(3), tp.id);
  }
});
t('level is clamped per topic', () => {
  assert.strictEqual(L.makeQuestion('frac', 99, Math.random).level, 4);
  assert.strictEqual(L.makeQuestion('add', -3, Math.random).level, 1);
  assert.strictEqual(L.makeQuestion('nope', 1, Math.random).topic, 'add');
});
t('nextLevel', () => {
  assert.strictEqual(L.nextLevel(3, [1, 1, 1, 1, 0], 7), 4);
  assert.strictEqual(L.nextLevel(3, [0, 0, 0, 1, 1], 7), 2);
  assert.strictEqual(L.nextLevel(3, [1, 1, 0, 0, 1], 7), 3);
  assert.strictEqual(L.nextLevel(7, [1, 1, 1, 1, 1], 7), 7);
  assert.strictEqual(L.nextLevel(4, [1, 1, 1, 1, 1], 4), 4);
  assert.strictEqual(L.nextLevel(1, [0, 0, 0, 0, 0], 7), 1);
  assert.strictEqual(L.nextLevel(3, [1, 1, 1, 1], 7), 3);
});
t('double tap counts once', () => {
  const r = L.createRound('sub', { sub: 2 }, Math.random), q = r.current();
  const wrong = q.options.find(o => o !== q.answer);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.answer(wrong))), { correct: false, firstTry: false });
  assert.strictEqual(r.answer(wrong), null);
  assert.strictEqual(r.answer(q.answer).correct, true);
  assert.strictEqual(r.answer(q.answer), null);
  assert.strictEqual(r.results.length, 1); assert.strictEqual(r.results[0], false);
  assert(r.next()); assert.strictEqual(r.i, 1);
  const q2 = r.current(); r.answer(q2.answer); r.answer(q2.answer);
  assert.deepStrictEqual(Array.from(r.results), [false, true]);
  assert.strictEqual(r.next() && r.next(), false);
});
t('round of 10 completes; mix uses each topic at its own level', () => {
  const r = L.createRound('mul', { mul: 5 }, Math.random);
  assert(r.qs.every(q => q.topic === 'mul' && q.level === 5));
  while (!r.done()) { r.answer(r.current().answer); r.next(); }
  assert.strictEqual(r.stars(), 10);
  const lv = { add: 3, sub: 2, mul: 6, div: 1, num: 4, frac: 2, ord: 3, miss: 5 }, seen = new Set();
  for (let i = 0; i < 30; i++) L.createRound('mix', lv, Math.random).qs.forEach(q => { seen.add(q.topic); assert.strictEqual(q.level, lv[q.topic]); });
  assert.strictEqual(seen.size, L.TOPICS.length);
});
t('streak', () => {
  let s = L.updateStreak(L.newState(), '2026-11-17'); assert.strictEqual(s.streak, 1);
  s = L.updateStreak(s, '2026-11-17'); assert.strictEqual(s.streak, 1);
  s = L.updateStreak(s, '2026-11-18'); assert.strictEqual(s.streak, 2);
  s = L.updateStreak(s, '2026-11-16'); assert.strictEqual(s.streak, 2); assert.strictEqual(s.lastDay, '2026-11-18');
  s = L.updateStreak(s, '2026-11-20'); assert.strictEqual(s.streak, 1);
  assert.strictEqual(L.updateStreak({ streak: 5, lastDay: '2026-02-28' }, '2026-03-01').streak, 6);
  assert.strictEqual(L.updateStreak({ streak: 5, lastDay: '2026-02-27' }, '2026-03-01').streak, 1);
  assert.strictEqual(L.updateStreak({ streak: 5, lastDay: '2026-12-31' }, '2027-01-01').streak, 6);
  assert.strictEqual(L.updateStreak({ streak: 5, lastDay: '2026-03-28' }, '2026-03-29').streak, 6);
});
t('loadState tolerates garbage and old saves', () => {
  for (const g of [null, undefined, '', '{', 'null', '[]', '5', '{"levels":"x","owned":"no","dress":5,"hists":[1]}', '{"level":99,"hist":[1,0],"owned":[1,1,-3,"a"],"lastDay":"junk"}', 12, {}]) {
    const s = L.loadState(g);
    assert(Array.isArray(s.owned) && typeof s.dress === 'object');
    for (const tp of L.TOPICS) assert(s.levels[tp.id] >= 1 && s.levels[tp.id] <= tp.levels.length && Array.isArray(s.hists[tp.id]));
  }
  const s = L.loadState('{"levels":{"add":99,"frac":3,"mul":"zz"},"hists":{"add":[1,0,1,1,1,1,1]},"owned":[1,1,-3,"a",4],"lastDay":"junk"}');
  assert.strictEqual(s.levels.add, 7); assert.strictEqual(s.levels.frac, 3); assert.strictEqual(s.levels.mul, 3);
  assert.strictEqual(s.hists.add.length, 5);
  assert.deepStrictEqual(Array.from(s.owned), [1, 4]); assert.strictEqual(s.lastDay, '');
});
t('trolls', () => {
  assert.deepStrictEqual(JSON.stringify(L.trollFromId(7)), JSON.stringify(L.trollFromId(7)));
  const own = []; for (let i = 0; i < 300; i++) { const tr = L.rollTroll(own, Math.random); assert(!own.includes(tr.id)); own.push(tr.id); }
});
console.log(n + ' test groups passed');
t('prize accessories: one new item each time until all are collected', () => {
  const s = L.newState(); let k = 0;
  for (;;) { const it = L.rollItem(s.items, Math.random); if (!it) break; assert(!s.items.includes(it)); s.items.push(it); k++; }
  assert.strictEqual(s.items.length, L.ITEMS.length); assert(k >= 10);
  const ld = L.loadState('{"items":["wand","wand","bogus",5]}');
  assert.deepStrictEqual(Array.from(ld.items), ['none', 'bow', 'wand']);
  for (let i = 0; i < 200; i++) assert(L.ACCESSORIES.indexOf(L.trollFromId(i).acc) < 6);
});
console.log('all ' + n + ' passed');
t('exercises do not repeat: inside a round, or versus the previous round of the same level', () => {
  let worst = 0;
  for (const tp of L.TOPICS) for (let lv = 1; lv <= tp.levels.length; lv++) for (let rep = 0; rep < 30; rep++) {
    const lvls = { [tp.id]: lv };
    const r1 = L.createRound(tp.id, lvls, Math.random), k1 = r1.qs.map(q => q.key);
    assert.strictEqual(new Set(k1).size, 10, tp.id + ' L' + lv + ' repeats inside a round');
    const r2 = L.createRound(tp.id, lvls, Math.random, 10, k1), k2 = r2.qs.map(q => q.key);
    assert.strictEqual(new Set(k2).size, 10, tp.id + ' L' + lv);
    const shared = k2.filter(k => k1.includes(k)).length; worst = Math.max(worst, shared);
    assert.strictEqual(shared, 0, tp.id + ' L' + lv + ' repeats the previous round: ' + shared);
  }
  const a = L.createRound('add', { add: 3 }, Math.random).qs.map(q => q.text).join(), b = L.createRound('add', { add: 3 }, Math.random).qs.map(q => q.text).join();
  assert.notStrictEqual(a, b);
});
console.log('all ' + n + ' passed (final)');
t('shop: catalogue, buying, chest rewards', () => {
  assert(L.ITEMS.length >= 60);
  assert.strictEqual(new Set(L.ITEMS.map(i => i.id)).size, L.ITEMS.length);
  for (const it of L.ITEMS) assert(['acc', 'hat', 'face', 'hand', 'pet'].includes(it.slot) && it.price >= 0 && it.name && (it.slot === 'acc') === (it.e === ''), it.id);
  for (const a of L.ACCESSORIES) assert(L.ITEM[a] && L.ITEM[a].slot === 'acc', a);
  let s = L.newState(); s.coins = 12;
  assert.strictEqual(L.buy(s, 'unicorn').ok, false);           // too expensive
  assert.strictEqual(L.buy(s, 'bow').ok, false);               // already owned
  assert.strictEqual(L.buy(s, 'nope').ok, false);
  const r = L.buy(s, 'ball'); assert(r.ok && r.state.coins === 2 && r.state.items.includes('ball') && s.coins === 12 && !s.items.includes('ball'));
  assert.strictEqual(L.buy(r.state, 'ball').ok, false);        // cannot buy twice
  let prev = 0;
  for (let st = 0; st <= 10; st++) { const w = L.roundReward(st); assert(w.coins >= prev && w.coins >= 10); prev = w.coins; }
  assert.strictEqual(L.roundReward(10).tier, 'gold'); assert.strictEqual(L.roundReward(6).tier, 'silver'); assert.strictEqual(L.roundReward(0).tier, 'bronze');
  assert(L.roundReward(0).coins >= Math.min(...L.ITEMS.filter(i => i.price > 0).map(i => i.price)), 'even the weakest round can buy something');
  const ld = L.loadState('{"coins":"x","items":["dragon","zzz"],"owned":[4],"buddy":4,"dress":{"4":{"pet":"dragon","hat":"dragon","hand":"lolly","face":7}}}');
  assert.strictEqual(ld.coins, 0); assert(ld.items.includes('dragon') && !ld.items.includes('zzz')); assert.strictEqual(ld.buddy, 4);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ld.dress[4])), { pet: 'dragon', hand: 'lolly' });
  assert.strictEqual(L.loadState('{"owned":[4],"buddy":9}').buddy, null);
});
t('profiles: tolerant loading, add, remove', () => {
  for (const g of [null, '', '{', '[]', '{"list":5}', 7]) assert.deepStrictEqual(JSON.parse(JSON.stringify(L.loadProfiles(g))), { cur: null, list: [] });
  let p = L.loadProfiles('{"cur":"p9","list":[{"id":"p1","name":"  נועה  "},{"id":"p1","name":"dup"},{"id":"bad"},{"id":"p3","name":"<b>x</b>"},null]}');
  assert.strictEqual(p.cur, null); assert.deepStrictEqual(Array.from(p.list.map(x => x.id)), ['p1', 'p3']);
  assert.strictEqual(p.list[0].name, 'נועה'); assert(!/[<>]/.test(p.list[1].name));
  p = L.addProfile(p, ''); assert.strictEqual(p.cur, 'p4'); assert.strictEqual(strip(p.list[2].name), 'שחקן 3');
  p = L.addProfile(p, 'אבגדהוזחטיכלמנסעפצ'); assert.strictEqual(p.list[3].name.length, 14);
  p = L.removeProfile(p, 'p5'); assert.strictEqual(p.cur, null); assert.strictEqual(p.list.length, 3);
  p = L.removeProfile(L.loadProfiles(JSON.stringify({ cur: 'p1', list: p.list })), 'p3'); assert.strictEqual(p.cur, 'p1');
  let many = { cur: null, list: [] }; for (let i = 0; i < 12; i++) many = L.addProfile(many, 'x' + i);
  assert.strictEqual(L.loadProfiles(JSON.stringify(many)).list.length, 8);
});
console.log('all ' + n + ' passed (shop+profiles)');
t('question wording is vocalised (niqqud) for young readers', () => {
  let seen = 0;
  for (const tp of L.TOPICS) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 300; i++) {
    const q = L.makeQuestion(tp.id, lv, Math.random);
    if (!q.rtl) continue;
    seen++;
    for (const w of q.text.split(/[\s?.,:]+/)) {
      if (!/[\u05D0-\u05EA]/.test(w) || w.replace(/[^\u05D0-\u05EA]/g, '').length < 2) continue;
      assert(/[\u05B0-\u05BC\u05C1\u05C2]/.test(w), 'word without niqqud: ' + w + ' in ' + q.text);
    }
  }
  assert(seen > 500);
});
console.log('all ' + n + ' passed (niqqud)');
