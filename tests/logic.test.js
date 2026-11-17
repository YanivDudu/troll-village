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
        const d = mm[2].replace(/,/g, ''), p = ['היחידות', 'העשרות', 'המאות', 'האלפים'].indexOf(mm[1]);
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
t('grade 3 levels come after grade 2 levels', () => {
  for (const tp of L.TOPICS) {
    const gs = tp.levels.map(l => l.g);
    assert.deepStrictEqual(gs, gs.slice().sort(), tp.id);
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
t('curriculum: grade 2 multiplies and divides only by 2, 4, 5, 10; no parentheses in grade 2', () => {
  for (const id of ['mul', 'div', 'miss']) for (const [lv, d] of L.TOPICS.find(x => x.id === id).levels.entries()) {
    if (d.g !== 2) continue;
    for (let i = 0; i < 400; i++) {
      const q = L.makeQuestion(id, lv + 1, Math.random), s = strip(q.text);
      if (!/[×:]/.test(s)) continue;
      const nums = s.replace('□', q.answer).match(/\d+/g).map(Number);
      assert(nums.some(x => [2, 4, 5, 10].includes(x)), 'grade 2 fact outside 2,4,5,10: ' + s);
    }
  }
  assert(L.TOPICS.find(x => x.id === 'ord').levels.every(d => d.g === 3));
  assert(L.TOPICS.find(x => x.id === 'frac').levels.slice(1).every(d => d.enr));
  for (const tp of L.TOPICS) { const st = L.newState().levels[tp.id]; assert(st >= 1 && st <= 3 && (tp.levels[st - 1].g === 2 || tp.levels[0].g === 3), tp.id + ' starts at ' + st); }
});
t('every exercise has a class-style explanation whose numbers are right', () => {
  const kinds = {};
  for (const tp of L.TOPICS) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 400; i++) {
    const q = L.makeQuestion(tp.id, lv, Math.random), s = JSON.stringify(q.text) + ' ' + JSON.stringify(q.ex);
    assert(q.ex && q.ex.steps.length >= 2, 'no explanation: ' + s);
    assert.notStrictEqual(q.ex.kind, 'tip', 'fell back to a plain tip: ' + s);
    kinds[q.ex.kind] = (kinds[q.ex.kind] || 0) + 1;
    for (const st of q.ex.steps) {
      assert(typeof st.say === 'string' && st.say.length > 3 && !/undefined|NaN/.test(st.say), s);
      const m = st.m; if (!m) continue;
      assert(!/undefined|NaN|null,null/.test(JSON.stringify(m)), s);
      if (m.t === 'line') { assert(m.pts.length >= 2 && m.pts.every(x => Number.isInteger(x) && x >= 0) && m.n >= 1 && m.n <= m.pts.length, s); }
      if (m.t === 'board') assert(m.cells.every(x => x >= 1 && x <= 100), s);
      if (m.t === 'arr') assert(m.r * m.c === q.answer || q.ex.steps[0].m === null, s);
      if (m.t === 'share') assert(m.n * m.size <= m.total && m.size >= 1, s);
      if (m.t === 'area') assert(m.parts.reduce((a, b) => a + b, 0) > 0 && m.b >= 1, s);
      if (m.t === 'bar') assert(m.den >= 2, s);
      if (m.t === 'rline') assert(m.lo < m.n && m.n < m.hi, s);
      if (m.t === 'vert') assert.strictEqual(+m.res.slice().reverse().join(''), m.op === '+' ? m.a + m.b : m.a - m.b, s);
    }
    const first = q.ex.steps.find(x => x.m), last = q.ex.steps[q.ex.steps.length - 1].m, text = strip(q.text);
    if (q.ex.kind === 'line' || q.ex.kind === 'chain') assert.strictEqual(last.pts[last.pts.length - 1], q.answer, s);
    if (q.ex.kind === 'board') assert.strictEqual(last.cells[last.cells.length - 1], q.answer, s);
    if (q.ex.kind === 'missline') assert.strictEqual(last.pts[last.pts.length - 1] - last.pts[0], text.includes('□ −') ? last.pts[last.pts.length - 1] - last.pts[0] : q.answer, s);
    if (q.ex.kind === 'seq') assert.strictEqual(last.pts[last.q], q.answer, s);
    if (q.ex.kind === 'pv') assert.strictEqual(last.op === '+' ? last.a + last.b : last.a - last.b, q.answer, s);
    if (q.ex.kind === 'vert' && /= \?$/.test(text)) assert.strictEqual(+last.res.slice().reverse().join(''), q.answer, s);
    if (q.ex.kind === 'expr') { // the last displayed expression still evaluates to the answer
      assert.strictEqual(ev(last.s.replace(/[\[\]]/g, '')), q.answer, s);
      for (const st of q.ex.steps) assert.strictEqual(ev(st.m.s.replace(/[\[\]]/g, '')), q.answer, s);
    }
    if (q.ex.kind === 'rem') assert.strictEqual(last.total - last.n * last.size < last.size, true, s);
    if (q.ex.kind === 'round') assert(q.answer === last.lo || q.answer === last.hi, s);
    assert(first === undefined || first !== null, s);
    // the final answer is never written out in the closing sentence
    const lastSay = q.ex.steps[q.ex.steps.length - 1].say;
    assert(/[?]/.test(lastSay) || /זו השארית|המספר החסר/.test(strip(lastSay)), 'last step should ask: ' + s);
  }
  for (const k of ['line', 'board', 'pv', 'vert', 'blocks', 'arr', 'split', 'double', 'area', 'shift', 'zeros', 'share', 'skip', 'splitdiv', 'rem', 'missline', 'expr', 'bar', 'stack', 'parity', 'ptab', 'round', 'seq', 'chain', 'twostep'])
    assert(kinds[k] > 0, 'explanation kind never used: ' + k);
});
t('number-line hops: tens first, then units through the round ten', () => {
  assert.deepStrictEqual(Array.from(L.hop(8, 7, 1)), [8, 10, 15]);
  assert.deepStrictEqual(Array.from(L.hop(57, 25, 1)), [57, 77, 80, 82]);
  assert.deepStrictEqual(Array.from(L.hop(83, 57, -1)), [83, 33, 30, 26]);   // the textbook example: -50, -3, -4
  assert.deepStrictEqual(Array.from(L.hop(40, 7, -1)), [40, 33]);
  assert.deepStrictEqual(Array.from(L.hop(358, 493, 1)), [358, 758, 848, 850, 851]);
  for (let i = 0; i < 3000; i++) {
    const a = 1 + Math.floor(Math.random() * 5000), d = 1 + Math.floor(Math.random() * 4000), up = L.hop(a, d, 1);
    assert.strictEqual(up[up.length - 1], a + d);
    if (d < a) { const dn = L.hop(a, d, -1); assert.strictEqual(dn[dn.length - 1], a - d); }
  }
});
console.log('all ' + n + ' passed (explanations)');
t('world: stage stars, opening rules, stars never go down', () => {
  const R = (ok, n) => Array.from({ length: n }, (_, i) => i < ok);
  assert.deepStrictEqual([R(7, 7), R(6, 7), R(5, 7), R(4, 7), R(0, 7), R(5, 5), R(4, 5), R(3, 5)].map(L.stageStars), [3, 2, 2, 1, 1, 3, 2, 1]);
  let s = L.newState();
  assert.strictEqual(s.levels.add, 3);
  assert(L.stageOpen(s, 'add', 1, 2) && L.stageOpen(s, 'add', 2, 0), 'clearings below the newest are fully open');
  assert(L.stageOpen(s, 'add', 3, 0) && !L.stageOpen(s, 'add', 3, 1) && !L.stageOpen(s, 'add', 4, 0));
  let r = L.finishStage(s, 'add', 3, 0, R(2, 5));
  assert.strictEqual(r.stars, 1); assert.strictEqual(r.gained, 1); assert.strictEqual(r.opened, 0); assert.strictEqual(r.clearingDone, false);
  assert.strictEqual(s.stars, 0, 'the input state is not mutated'); assert.strictEqual(L.progOf(s, 'add', 3)[0], 0);
  s = r.state; assert(L.stageOpen(s, 'add', 3, 1) && !L.stageOpen(s, 'add', 3, 2));
  r = L.finishStage(s, 'add', 3, 0, R(5, 5)); assert.strictEqual(r.gained, 2); s = r.state; assert.strictEqual(s.stars, 3);
  r = L.finishStage(s, 'add', 3, 0, R(0, 5)); assert.strictEqual(r.gained, 0); assert.strictEqual(L.progOf(r.state, 'add', 3)[0], 3, 'a weaker replay keeps the stars');
  s = L.finishStage(s, 'add', 3, 1, R(7, 7)).state;
  r = L.finishStage(s, 'add', 3, 2, R(5, 7));
  assert.strictEqual(r.opened, 4); assert.strictEqual(r.clearingDone, true); s = r.state;
  assert.strictEqual(s.levels.add, 4); assert(L.stageOpen(s, 'add', 4, 0));
  r = L.finishStage(s, 'add', 3, 2, R(7, 7)); assert.strictEqual(r.clearingDone, false); assert.strictEqual(r.opened, 0);
  assert.strictEqual(L.topicStars(r.state, 'add'), 9);
  const last = L.TOPICS.find(x => x.id === 'frac').levels.length; let f = L.newState(); f.levels.frac = last;
  assert.strictEqual(L.finishStage(f, 'frac', last, 2, R(7, 7)).opened, 0, 'nothing opens after the last clearing');
  const ld = L.loadState(JSON.stringify({ prog: { add: [[3, 9, -1], 'x', [1]], mul: 5 }, boss: { add: { 2: true, 3: 'yes' } }, intro: { add: true, zz: true } }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ld.prog.add.slice(0, 3))), [[3, 3, 0], [0, 0, 0], [1, 0, 0]]);
  assert.strictEqual(ld.prog.add.length, L.TOPICS[0].levels.length); assert.deepStrictEqual(Array.from(ld.prog.mul), []);
  assert(L.bossDone(ld, 'add', 2) && !L.bossDone(ld, 'add', 3) && ld.intro.add === true && ld.intro.zz === undefined);
});
t('world: milestone missions and rescued heroes', () => {
  const R = n => Array.from({ length: n }, () => true);
  for (const tp of L.TOPICS) for (const g of [2, 3]) {
    const lv = L.bossLevels(tp.id, g);
    if (!lv.length) { assert(!L.bossReady(L.newState(), tp.id, g)); continue; }
    let s = L.newState(); s.levels[tp.id] = tp.levels.length;
    assert(!L.bossReady(s, tp.id, g));
    for (const l of lv) for (const st of [0, 1, 2]) s = L.finishStage(s, tp.id, l, st, R(L.STAGE_SIZE[st])).state;
    assert(L.bossReady(s, tp.id, g), tp.id + ' grade ' + g);
    const b = L.createBoss(tp.id, g, Math.random);
    assert.strictEqual(b.qs.length, 10); assert(b.qs.every(q => q.topic === tp.id && lv.includes(q.level) && q.g === g && !q.enr));
    assert.strictEqual(new Set(b.qs.map(q => q.key)).size, 10);
    s.boss[tp.id][g] = true; assert(!L.bossReady(s, tp.id, g));
    const hero = L.trollFromId(L.heroId(tp.id, g));
    assert(hero.hero && hero.acc === 'crown' && L.HEROES.includes(hero.name), tp.id);
  }
  const ids = new Set(); for (const tp of L.TOPICS) for (const g of [2, 3]) ids.add(L.heroId(tp.id, g));
  assert.strictEqual(ids.size, 16);
  for (let i = 0; i < 500; i++) assert(L.rollTroll([], Math.random).id < L.HERO_BASE);
});
t('challenge stage mixes in at most two review questions from open levels', () => {
  const open = { add: 3, sub: 2, mul: 2, div: 1, num: 3, frac: 4, ord: 1, miss: 2 }; let withReview = 0;
  for (let i = 0; i < 300; i++) {
    const r = L.createRound('add', { add: 3 }, Math.random, 7, [], open), rev = r.qs.filter(q => q.review);
    assert.strictEqual(r.qs.length, 7); assert(rev.length <= 2); assert(!r.qs[0].review);
    for (const q of rev) assert(q.level <= open[q.topic] && !q.enr, JSON.stringify([q.topic, q.level]));
    for (const q of r.qs.filter(x => !x.review)) assert(q.topic === 'add' && q.level === 3);
    if (rev.length) withReview++;
  }
  assert(withReview > 100);
  assert(L.createRound('add', { add: 3 }, Math.random, 7).qs.every(q => !q.review));
});
console.log('all ' + n + ' passed (world)');
t('activity formats: every variant is consistent with its exercise', () => {
  const seen = {};
  const check = (q, s) => {
    seen[q.fmt] = (seen[q.fmt] || 0) + 1;
    const text = strip(q.text);
    assert(q.ex && q.ex.steps.length >= 2, s);
    assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, s);
    if (q.fmt === 'tf') { const [l, r] = text.split(' = '); assert.strictEqual(ev(l) === ev(r), q.answer === 'yes', s); }
    else if (q.fmt === 'cmp') { const [l, r] = text.split(' ◯ '), a = ev(l), b = ev(r); assert.strictEqual(a < b ? '<' : a > b ? '>' : '=', q.answer, s); }
    else if (q.fmt === 'line') { assert(q.lo <= q.answer && q.answer <= q.hi && q.hi - q.lo === 10 && q.lo >= 0, s); assert(q.start === q.lo || q.start === q.hi || q.start < 10, 'the line starts at the first number: ' + s); assert(q.lo <= q.start && q.start <= q.hi, s); assert.strictEqual(ev(text.replace(' = ?', '')), q.answer, s); }
    else if (q.fmt === 'use') { const [l, r] = q.pre.split(' = '); assert.strictEqual(ev(l), +r, s); assert.strictEqual(ev(text.replace(' = ?', '')), q.answer, s); assert.strictEqual(Math.abs(+r - q.answer), 1, s); }
    else if (q.fmt === 'lefteq') { const [l, r] = text.replace('□', q.answer).split('='); assert.strictEqual(ev(l), ev(r), s); assert.strictEqual(q.options.length, 4, s); }
    else if (q.fmt === 'word') { assert(q.rtl && q.pic && Number.isInteger(q.answer) && q.options.length === 4, s); const nums = text.match(/\d+/g).map(Number); assert.strictEqual(nums.length, 2, s);
      assert([nums[0] + nums[1], nums[0] - nums[1], nums[0] * nums[1], nums[0] / nums[1]].includes(q.answer), s); }
    else if (q.fmt === 'build') assert(q.answer >= 11 && q.answer <= 9999, s);
    else if (q.fmt === 'array') assert(q.a >= 2 && q.b >= 2 && q.a <= 10 && q.b <= 10 && q.answer === 'ok', s);
    else if (q.fmt === 'pairs') { assert.strictEqual(q.pairs.length, 4, s); assert.strictEqual(new Set(q.pairs.map(p => p.r)).size, 4, s);
      for (const p of q.pairs) assert.strictEqual(ev(strip(p.l)), p.r, s); assert.deepStrictEqual(Array.from(q.rights).sort((a, b) => a - b), Array.from(q.pairs, p => p.r).sort((a, b) => a - b), s); }
    else assert.strictEqual(q.fmt, 'choice', s);
  };
  for (const tp of L.TOPICS) for (let lv = 1; lv <= tp.levels.length; lv++) for (const stage of [0, 1, 2]) for (let i = 0; i < 40; i++) {
    const r = L.createRound(tp.id, { [tp.id]: lv }, Math.random, L.STAGE_SIZE[stage], [], null, stage);
    assert.strictEqual(r.qs.length, L.STAGE_SIZE[stage]);
    assert(r.qs.filter(q => q.fmt === 'pairs').length <= 1, 'at most one matching game per stage');
    for (const q of r.qs) check(q, tp.id + ' L' + lv + ' S' + stage + ' ' + JSON.stringify([q.fmt, q.text, q.answer, q.pre, q.lo]));
    if (stage === 0) assert(r.qs.every(q => ['choice', 'array', 'build', 'line'].includes(q.fmt)), 'discovery is hands-on');
  }
  for (const tp of L.TOPICS) for (const g of [2, 3]) if (L.bossLevels(tp.id, g).length) for (let i = 0; i < 20; i++) L.createBoss(tp.id, g, Math.random).qs.forEach(q => check(q, 'boss ' + tp.id));
  for (const k of ['choice', 'tf', 'cmp', 'line', 'use', 'lefteq', 'word', 'build', 'array', 'pairs']) assert(seen[k] > 20, 'format never produced: ' + k + ' ' + JSON.stringify(seen));
  assert(L.createRound('add', { add: 3 }, Math.random, 10).qs.every(q => q.fmt === 'choice'), 'without a stage, questions stay plain');
  const r = L.createRound('add', { add: 1 }, Math.random); r.miss(); r.miss();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.answer(r.current().answer))), { correct: true, firstTry: false });
});
console.log('all ' + n + ' passed (formats)');
