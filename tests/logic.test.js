const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = /<script id="logic">([\s\S]*?)<\/script>/.exec(html);
const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1] + ';this.L=TrollLogic;', ctx);
const L = ctx.L;
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const strip = s => s.replace(/[\u2066\u2069\u0591-\u05C7]/g, ''); // drop direction marks and niqqud
const ev = s => Function('return (' + s.replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const evx = s => ev(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => '**' + SUPS.indexOf(c)));
const near = (a, b) => Math.abs(a - b) < 1e-9;
const isPrime = x => { if (x < 2) return false; for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };
t('every topic and level: distinct options, one correct, maths is right', () => {
  let checked = 0;
  for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 1500; i++) {
    const q = L.makeQuestion(tp.id, lv, Math.random), s = JSON.stringify(q), text = strip(q.text), frac = typeof q.answer === 'string';
    assert.strictEqual(q.g, tp.levels[lv - 1].g, s);
    assert(q.hint && typeof q.hint.tip === 'string' && q.hint.tip.length > 0, s);
    assert(q.ex && q.ex.steps.length >= 1 && q.ex.steps.every(st => typeof st.say === 'string' && st.say.length > 3), s);
    assert.strictEqual(new Set(q.options).size, q.options.length, s);
    assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, s);
    if (q.fmt === 'cmp') { // an exercise that is born as a comparison
      assert.deepStrictEqual(Array.from(q.options), ['<', '=', '>'], s);
      const [l, r] = text.split(' ◯ '), a = evx(l), b = evx(r);
      assert.strictEqual(a < b ? '<' : a > b ? '>' : '=', q.answer, s); checked++;
      continue;
    }
    assert.strictEqual(q.options.length, 4, s);
    if (frac) assert(q.g >= 4 && q.options.every(o => /^\d+(\/[1-9]\d*|\.\d+)?$/.test(o)), s);
    else {
      assert(q.options.every(o => Number.isInteger(o) && o >= 0), s);
      assert(q.answer >= 0 && q.answer <= (q.g >= 4 ? 1000000 : 10000), s);
      if (q.g === 2) assert(q.answer <= 1000, s);
      if (q.g === 1) assert(q.answer <= 100, s);
    }
    if (q.g === 1) assert(!/[×:<>]/.test(text), 'grade 1 has no multiplication, division or < > signs: ' + s);
    if (q.rtl) {
      let mm;
      const val = o => evx(String(o));
      if ((mm = /שארית בתרגיל (\d+) : (\d+)/.exec(text))) { assert.strictEqual(mm[1] % mm[2], q.answer, s); checked++; }
      else if ((mm = /פעמים שלמות נכנס (\d+) בתוך (\d+)/.exec(text))) { assert.strictEqual(Math.floor(mm[2] / mm[1]), q.answer, s); checked++; }
      else if (/הכי גדול/.test(text)) { assert(near(Math.max(...q.options.map(val)), val(q.answer)), s); checked++; }
      else if (/הכי קטן/.test(text)) { assert(near(Math.min(...q.options.map(val)), val(q.answer)), s); checked++; }
      else if (/אי-זוגי/.test(text)) { assert(q.answer % 2 === 1 && q.options.filter(o => o % 2 === 1).length === 1, s); checked++; }
      else if (/זוגי/.test(text)) { assert(q.answer % 2 === 0 && q.options.filter(o => o % 2 === 0).length === 1, s); checked++; }
      else if ((mm = /חצי של (\d+)/.exec(text))) { assert.strictEqual(mm[1] / 2, q.answer, s); checked++; }
      else if ((mm = /רבע של (\d+)/.exec(text)) && !/שלושה/.test(text)) { assert.strictEqual(mm[1] / 4, q.answer, s); checked++; }
      else if ((mm = /פעמיים (\d+)/.exec(text))) { assert.strictEqual(mm[1] * 2, q.answer, s); checked++; }
      else if ((mm = /עשרות שלמות יש במספר (\d+)/.exec(text))) { assert.strictEqual(Math.floor(mm[1] / 10), q.answer, s); checked++; }
      else if ((mm = /עגלי את ([\d,]+) ל(עשרת|מאה)/.exec(text))) {
        const v = +mm[1].replace(/,/g, ''), u = mm[2] === 'עשרת' ? 10 : 100;
        assert.strictEqual(Math.round(v / u) * u, q.answer, s); checked++;
      } else if ((mm = /ספרת (.+) במספר (\d)\.(\d)(\d)/.exec(text))) {
        const p = ['היחידות', 'העשיריות', 'המאיות'].indexOf(mm[1]); assert(p >= 0, s); assert.strictEqual(+mm[2 + p], q.answer, s); checked++;
      } else if ((mm = /כמה מאיות יש ב-(0\.\d\d)/.exec(text))) { assert.strictEqual(Math.round(mm[1] * 100), q.answer, s); checked++;
      } else if ((mm = /ספרת (.+) במספר ([\d,]+)/.exec(text))) {
        const d = mm[2].replace(/,/g, ''), p = ['היחידות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים', 'מאות האלפים'].indexOf(mm[1]);
        assert(p >= 0, s); assert.strictEqual(+d[d.length - 1 - p], q.answer, s); checked++;
      }
      else if ((mm = /בא אחרי (\d+)/.exec(text))) { assert.strictEqual(+mm[1] + 1, q.answer, s); checked++; }
      else if ((mm = /בא לפני (\d+)/.exec(text))) { assert.strictEqual(+mm[1] - 1, q.answer, s); checked++; }
      else if ((mm = /בין (\d+) ל-(\d+)/.exec(text))) { assert(q.answer === +mm[1] + 1 && q.answer === +mm[2] - 1, s); checked++; }
      else if ((mm = /מתחלק ב-(\d)/.exec(text))) { assert(q.answer % mm[1] === 0 && q.options.filter(o => o % mm[1] === 0).length === 1, s); checked++; }
      else if (/ראשוני/.test(text)) { assert(isPrime(q.answer) && q.options.filter(isPrime).length === 1, s); checked++; }
      else if (/פריק/.test(text)) { assert(!isPrime(q.answer) && q.options.filter(isPrime).length === 3, s); checked++; }
      else if ((mm = /יש ב-(\d) שלמים/.exec(text))) { assert(q.answer % mm[1] === 0 && q.answer / mm[1] >= 2 && q.answer / mm[1] <= 8, s); checked++; }
      else if ((mm = /בשבר (\d+)\/(\d+) יש שלם אחד/.exec(text))) { assert.strictEqual(mm[1] - mm[2], q.answer, s); checked++; }
      else if (/שוה ל-1/.test(text)) { assert(near(val(q.answer), 1) && q.options.filter(o => near(val(o), 1)).length === 1, s); checked++; }
      else if (/גדול מ-1/.test(text)) { assert(val(q.answer) > 1 && q.options.filter(o => val(o) > 1).length === 1, s); checked++; }
      else if (/קטן מ-1/.test(text)) { assert(val(q.answer) < 1 && q.options.filter(o => val(o) < 1).length === 1, s); checked++; }
      else if (q.g === 1 || q.g >= 4) assert.fail('unverified new exercise: ' + s);
    } else if (text.includes('→')) {
      const seq = text.split(' → ').map(x => x === '?' ? q.answer : +x.replace(/,/g, ''));
      const d = seq[1] - seq[0];
      assert(d !== 0 && seq.every((x, k) => k === 0 || x - seq[k - 1] === d) && seq.every(x => x >= 0), s); checked++;
    } else if (text.includes('□')) {
      const [l, r] = text.replace('□', '(' + q.answer + ')').split('=');
      assert(near(evx(l), evx(r)), s); checked++;
    } else {
      assert(/ = \?$/.test(text), s);
      assert(near(evx(text.replace(' = ?', '')), evx(String(q.answer))), s); checked++;
      if (frac) assert(q.options.filter(o => near(evx(o), evx(q.answer))).length === 1, 'two options with the same value: ' + s);
    }
  }
  assert(checked > 100000, 'most questions verified arithmetically: ' + checked);
});
t('levels are ordered by grade; grade 1 and grade 4 exist; every topic knows how many houses were added in front', () => {
  for (const tp of L.SRC) {
    const gs = tp.levels.map(l => l.g);
    assert.deepStrictEqual(gs, gs.slice().sort(), tp.id);
    assert.strictEqual(tp.shift, gs.filter(g => g === 1).length, tp.id);
    assert(gs.includes(4), tp.id);
  }
  for (const id of ['mul', 'div', 'frac', 'ord']) assert(!L.SRC.find(t => t.id === id).levels.some(l => l.g === 1), 'no ' + id + ' in grade 1');
});
t('tiles: every grade has its own tiles, every house sits in exactly one; the challenge gate; old saves keep their progress', () => {
  const add = L.SRC.find(t => t.id === 'add'), T = L.TOPICS, seen = {}, heroes = {};
  for (const tl of T) {
    assert(tl.levels.length === tl.src.length && tl.levels.length >= 2, tl.id);
    assert(/[ְ-ׂ]/.test(tl.name) && /[ְ-ׂ]/.test(tl.world), tl.id + ' is vocalised');
    tl.src.forEach(([sid, n], i) => {
      const src = L.SRC.find(x => x.id === sid).levels[n - 1];
      assert(!seen[sid + n], sid + n + ' twice'); seen[sid + n] = 1;
      assert(src.g === tl.g || src.enr, sid + n + ' of grade ' + src.g + ' in ' + tl.id);
      assert.strictEqual(tl.levels[i].name, src.name); assert.strictEqual(tl.levels[i].g, tl.g);
      assert.strictEqual(JSON.stringify(L.tileOf(sid, n)), JSON.stringify({ id: tl.id, level: i + 1 }));
    });
    if (tl.g <= 4) { assert(!heroes[tl.hero], 'hero of ' + tl.id); heroes[tl.hero] = 1; assert(L.bossLevels(tl.id, tl.g).length === tl.levels.length); }
  }
  assert.strictEqual(Object.keys(seen).length, L.SRC.reduce((n, t) => n + t.levels.length, 0), 'every house is in a tile');
  assert.deepStrictEqual(Array.from(L.topicsFor(L.newState(1))), ['g1n', 'g1a', 'g1b', 'g1c']);
  assert.deepStrictEqual(Array.from(L.topicsFor(L.newState(2))), ['g2add', 'g2sub', 'g2mul', 'g2div', 'g2num', 'g2miss']);
  assert.strictEqual(L.topicsFor(L.newState(3)).length, 7); assert.strictEqual(L.topicsFor(L.newState(4)).length, 6);
  assert.deepStrictEqual(Array.from(L.challengeFor(L.newState(4))), ['g5dec', 'g5frac', 'g5ops']);
  for (const grade of [1, 2, 3, 4]) {
    const s0 = L.newState(grade), mine = L.topicsFor(s0), ch = L.challengeFor(s0);
    assert.strictEqual(s0.v, 4); assert(ch.length >= 3 && !L.challengeOpen(s0), 'the gate starts closed');
    for (const id of mine) { const tl = T.find(x => x.id === id), sp = L.span(tl, grade);
      assert.strictEqual(tl.g, grade); assert.deepStrictEqual([sp.lo, sp.hi], [1, tl.levels.length]); assert.strictEqual(s0.levels[id], Math.min(3, tl.levels.length)); }
    for (const id of ch) assert.strictEqual(s0.levels[id], 1);
    for (let i = 0; i < 40; i++) for (const tid of ['mix', mine[0]]) L.createRound(tid, s0.levels, Math.random, 10, [], s0.levels, 2, grade, mine).qs.forEach(q => {
      assert(mine.includes(q.topic), 'grade ' + grade + ' got topic ' + q.topic); assert.strictEqual(q.g, grade); assert(q.level <= s0.levels[q.topic]); });
    const won = L.newState(grade); won.boss[mine[0]][grade] = true; assert(L.challengeOpen(won), 'a bridge mission opens the gate');
    const had = L.newState(grade); had.prog[ch[0]] = [[1, 0, 0]]; assert(L.challengeOpen(had), 'stars behind the gate keep it open');
  }
  // a save from before grades (version 2): houses 1..3 of addition done, house 3 the newest; half-and-double played
  const old = { v: 2, levels: { add: 3, mul: 5 }, prog: { add: [[3, 3, 3], [2, 2, 1], [1, 0, 0]], frac: [[2, 1, 0]] }, boss: { add: { 2: true } }, stars: 16, owned: [7] };
  const s = L.loadState(JSON.stringify(old));
  assert.strictEqual(s.grade, 2); assert.strictEqual(s.v, 4); assert.strictEqual(s.stars, 16); assert.deepStrictEqual(Array.from(s.owned), [7]);
  assert.strictEqual(s.levels.g2add, 3);
  assert.deepStrictEqual(Array.from(s.prog.g2add[0]), [3, 3, 3]); assert.deepStrictEqual(Array.from(s.prog.g2add[2]), [1, 0, 0]); assert.deepStrictEqual(Array.from(s.prog.g2add[3]), [0, 0, 0]);
  assert.strictEqual(s.levels.g2mul, 3); assert.strictEqual(s.levels.g3mul, 2); assert.deepStrictEqual(Array.from(s.prog.g2mul[3]), [2, 1, 0]);
  assert(s.boss.g2add[2]); assert(!s.boss.g2sub[2]); assert.strictEqual(L.heroId('g2add', 2), L.HERO_BASE); assert.strictEqual(L.heroId('g3add', 3), L.HERO_BASE + 1);
  assert(L.challengeOpen(s), 'grade 3 houses that were already open stay reachable');
  const again = L.loadState(JSON.stringify(s)); // a version 4 save is read as it is
  assert.deepStrictEqual(JSON.parse(JSON.stringify(again)), JSON.parse(JSON.stringify(s)));
  // a version 3 save of a grade 1 player
  const v3 = L.loadState(JSON.stringify({ v: 3, grade: 1, levels: { add: 2, sub: 1, miss: 3, num: 3 }, prog: { add: [[3, 3, 3], [1, 0, 0]], miss: [[2, 2, 2]] }, boss: { num: { 1: true } } }));
  assert.strictEqual(v3.levels.g1a, 5); assert.deepStrictEqual(Array.from(v3.prog.g1a[0]), [3, 3, 3]); assert.deepStrictEqual(Array.from(v3.prog.g1a[2]), [2, 2, 2]);
  assert.strictEqual(v3.levels.g1b, 1); assert.deepStrictEqual(Array.from(v3.prog.g1b[0]), [1, 0, 0]); assert(v3.boss.g1n[1]);
  const up = L.setGrade(s, 4);
  assert.strictEqual(up.grade, 4); assert.strictEqual(up.levels.g4big, 3); assert.deepStrictEqual(Array.from(up.prog.g2add[0]), [3, 3, 3]);
  const down = L.setGrade(up, 1); assert.strictEqual(down.grade, 1); assert(down.levels.g1a >= 3);
  // grade 1 never gets the < > activity or comparison stories
  for (let i = 0; i < 300; i++) L.createRound('add', { add: 1 + i % add.shift }, Math.random, 7, [], null, 1 + i % 2, 1).qs.forEach(q => {
    assert(q.fmt !== 'cmp', 'cmp in grade 1'); assert(!/יותר\?/.test(strip(q.text)), 'comparison story in grade 1: ' + q.text);
  });
});
t('grade 2 is locked: its tiles, houses, exercises and explanations do not change when other grades are edited', () => {
  // Grade 2 is the grade that matters most to the family. If this fails, a change meant for another grade touched grade 2:
  // undo it, or (only when grade 2 was changed on purpose) print the new fingerprint and update it here.
  const crypto = require('crypto'), h = crypto.createHash('sha1');
  for (const id of L.topicsFor(L.newState(2))) { const tl = L.TOPICS.find(x => x.id === id);
    h.update(id + tl.name + tl.world);
    tl.levels.forEach((d, i) => { h.update(d.name); for (let k = 1; k <= 60; k++) { const q = L.makeQuestion(id, i + 1, L.seeded(k)); h.update(JSON.stringify([q.text, q.answer, q.options, q.hint, q.ex, q.fmt])); } }); }
  assert.strictEqual(h.digest('hex'), 'c62723b547e0327539024e0103bb50e2b2dad5a9');
});
t('level is clamped per topic', () => {
  assert.strictEqual(L.makeQuestion('frac', 99, Math.random).level, L.maxLevel('frac'));
  assert.strictEqual(L.makeQuestion('add', -3, Math.random).level, 1);
  assert.strictEqual(L.makeQuestion('nope', 1, Math.random).topic, 'g1n');
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
  const lv = {}, seen = new Set(); L.TOPICS.forEach((tl, i) => { lv[tl.id] = 1 + i % tl.levels.length; });
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
    for (const tp of L.TOPICS) assert(s.levels[tp.id] >= 1 && s.levels[tp.id] <= tp.levels.length && Array.isArray(s.hists[tp.id]) && Array.isArray(s.prog[tp.id]));
  }
  const s = L.loadState('{"levels":{"add":99,"frac":3,"mul":"zz"},"hists":{"add":[1,0,1,1,1,1,1]},"owned":[1,1,-3,"a",4],"lastDay":"junk"}');
  assert.strictEqual(s.levels.g2add, 4); assert.strictEqual(s.levels.g2mul, 3);
  const s4 = L.loadState('{"v":4,"levels":{"g2add":99,"g2div":"zz"},"hists":{"g2add":[1,0,1,1,1,1,1]}}');
  assert.strictEqual(s4.levels.g2add, 4); assert.strictEqual(s4.levels.g2div, 3); assert.strictEqual(s4.hists.g2add.length, 5);
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
  for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (let rep = 0; rep < 30; rep++) {
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
  let s = L.newState(); s.coins = 25;
  assert.strictEqual(L.buy(s, 'unicorn').ok, false);           // too expensive
  assert.strictEqual(L.buy(s, 'bow').ok, false);               // already owned
  assert.strictEqual(L.buy(s, 'nope').ok, false);
  const r = L.buy(s, 'ball'); assert(r.ok && r.state.coins === 5 && r.state.items.includes('ball') && s.coins === 25 && !s.items.includes('ball'));
  assert.strictEqual(L.buy(r.state, 'ball').ok, false);        // cannot buy twice
  let prev = 0;
  for (let st = 0; st <= 10; st++) { const w = L.roundReward(st); assert(w.coins >= prev && w.coins >= 10); prev = w.coins; }
  assert.strictEqual(L.roundReward(10).tier, 'gold'); assert.strictEqual(L.roundReward(6).tier, 'silver'); assert.strictEqual(L.roundReward(0).tier, 'bronze');
  assert(L.roundReward(0).coins >= Math.min(...L.ITEMS.filter(i => i.price > 0).map(i => L.priceOf(L.newState(), i.id))), 'the very first item is within reach of the weakest round');
  // progressive prices: every purchase makes the rest dearer, and prices are whole fives
  let p = L.newState(), before = L.priceOf(p, 'dragon'); p.coins = 100000;
  assert.strictEqual(L.priceOf(p, 'bow'), 0); assert.strictEqual(L.priceOf(p, 'nope'), 0); assert.strictEqual(before, 100);
  let spent = 0, lastCheap = L.priceOf(p, 'apple');
  for (const it of L.ITEMS.filter(i => i.price > 0 && i.id !== 'dragon' && i.id !== 'apple')) { const c = L.priceOf(p, it.id); assert(c % 5 === 0 && c >= it.price, it.id); const b = L.buy(p, it.id); assert(b.ok && b.state.coins === p.coins - c); p = b.state; spent += c;
    const now = L.priceOf(p, 'apple'); assert(now >= lastCheap); lastCheap = now; }
  assert(L.priceOf(p, 'dragon') > before * 5, 'the last items cost much more: ' + L.priceOf(p, 'dragon'));
  assert(spent > 15000, 'collecting everything takes a long time: ' + spent);
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
  for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 300; i++) {
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
  for (const id of ['mul', 'div', 'miss']) for (const [lv, d] of L.SRC.find(x => x.id === id).levels.entries()) {
    if (d.g !== 2) continue;
    for (let i = 0; i < 400; i++) {
      const q = L.makeQuestion(id, lv + 1, Math.random), s = strip(q.text);
      if (!/[×:]/.test(s)) continue;
      const nums = s.replace('□', q.answer).match(/\d+/g).map(Number);
      assert(nums.some(x => [2, 4, 5, 10].includes(x)), 'grade 2 fact outside 2,4,5,10: ' + s);
    }
  }
  assert(L.SRC.find(x => x.id === 'ord').levels.every(d => d.g >= 3));
  assert(L.SRC.find(x => x.id === 'frac').levels.filter(d => d.g === 3).every(d => d.enr));
  for (const id of L.topicsFor(L.newState())) { const tl = L.TOPICS.find(x => x.id === id); assert(tl.g === 2 && L.newState().levels[id] === Math.min(3, tl.levels.length), id); }
});
t('every exercise has a class-style explanation whose numbers are right', () => {
  const kinds = {};
  for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 400; i++) {
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
      if (m.t === 'frame') assert(m.a >= 0 && m.a <= 20 && (m.op === '+' ? m.a + m.b <= 20 : m.op === '−' ? m.b <= m.a : m.a <= m.b), s);
      if (m.t === 'coins') assert(m.a % 10 === 0 && m.b % 10 === 0 && (m.op === '+' ? m.a + m.b <= 100 : m.b < m.a), s);
      if (m.t === 'fb') assert(m.bars.length >= 1 && m.bars.length <= 4 && m.bars.every(b => b.den >= 2 && b.den <= 16 && b.num + (b.num2 || 0) <= b.den), s);
      if (m.t === 'grid') assert.strictEqual((m.a[0] + m.a[1]) * (m.b[0] + m.b[1]), q.answer, s);
      if (m.t === 'rline') assert(m.lo < m.n && m.n < m.hi, s);
      if (m.t === 'vert') assert.strictEqual(+m.res.slice().reverse().join(''), m.op === '+' ? m.a + m.b : m.a - m.b, s);
    }
    const first = q.ex.steps.find(x => x.m), last = q.ex.steps[q.ex.steps.length - 1].m, text = strip(q.text);
    if (q.ex.kind === 'line' || q.ex.kind === 'chain') assert.strictEqual(last.pts[last.pts.length - 1], q.answer, s);
    if (q.ex.kind === 'board') assert.strictEqual(last.cells[last.cells.length - 1], q.answer, s);
    if (q.ex.kind === 'missline') assert.strictEqual(last.pts[last.pts.length - 1] - last.pts[0], text.includes('□ −') ? last.pts[last.pts.length - 1] - last.pts[0] : q.answer, s);
    if (q.ex.kind === 'seq') assert.strictEqual(last.pts[last.q], q.answer, s);
    if (q.ex.kind === 'pv') assert.strictEqual(last.op === '+' ? last.a + last.b : last.a - last.b, q.answer, s);
    if (q.ex.kind === 'vert' && /= \?$/.test(text)) assert(near(+last.res.slice().reverse().join('') / (last.dp ? 100 : 1), evx(String(q.answer))), s);
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
  for (const k of ['line', 'board', 'pv', 'vert', 'blocks', 'arr', 'split', 'double', 'area', 'shift', 'zeros', 'share', 'skip', 'splitdiv', 'rem', 'missline', 'expr', 'bar', 'stack', 'parity', 'ptab', 'round', 'seq', 'chain', 'twostep', 'frame', 'coins', 'near', 'fb', 'grid', 'remsplit', 'chunks', 'tens', 'digits', 'prime', 'factor', 'power', 'compare', 'balance', 'bysteps', 'dstack', 'todec', 'reduce', 'common', 'usefact'])
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
  assert.strictEqual(s.levels.g2add, 3);
  assert(L.stageOpen(s, 'g2add', 1, 2) && L.stageOpen(s, 'g2add', 2, 0), 'clearings below the newest are fully open');
  assert(L.stageOpen(s, 'g2add', 3, 0) && !L.stageOpen(s, 'g2add', 3, 1) && !L.stageOpen(s, 'g2add', 4, 0));
  let r = L.finishStage(s, 'g2add', 3, 0, R(2, 5));
  assert.strictEqual(r.stars, 1); assert.strictEqual(r.gained, 1); assert.strictEqual(r.opened, 0); assert.strictEqual(r.clearingDone, false);
  assert.strictEqual(s.stars, 0, 'the input state is not mutated'); assert.strictEqual(L.progOf(s, 'g2add', 3)[0], 0);
  s = r.state; assert(L.stageOpen(s, 'g2add', 3, 1) && !L.stageOpen(s, 'g2add', 3, 2));
  r = L.finishStage(s, 'g2add', 3, 0, R(5, 5)); assert.strictEqual(r.gained, 2); s = r.state; assert.strictEqual(s.stars, 3);
  r = L.finishStage(s, 'g2add', 3, 0, R(0, 5)); assert.strictEqual(r.gained, 0); assert.strictEqual(L.progOf(r.state, 'g2add', 3)[0], 3, 'a weaker replay keeps the stars');
  s = L.finishStage(s, 'g2add', 3, 1, R(7, 7)).state;
  r = L.finishStage(s, 'g2add', 3, 2, R(5, 7));
  assert.strictEqual(r.opened, 4); assert.strictEqual(r.clearingDone, true); s = r.state;
  assert.strictEqual(s.levels.g2add, 4); assert(L.stageOpen(s, 'g2add', 4, 0));
  r = L.finishStage(s, 'g2add', 3, 2, R(7, 7)); assert.strictEqual(r.clearingDone, false); assert.strictEqual(r.opened, 0);
  assert.strictEqual(L.topicStars(r.state, 'g2add'), 9);
  const last = L.maxLevel('g2add'); let f = L.newState(); f.levels.g2add = last;
  assert.strictEqual(L.finishStage(f, 'g2add', last, 2, R(7, 7)).opened, 0, 'nothing opens after the last clearing');
  const ld = L.loadState(JSON.stringify({ v: 4, prog: { g2mul: [[3, 9, -1], 'x', [1]], g2add: 5 }, boss: { g2add: { 2: true, 3: 'yes' } }, intro: { g2add: true, zz: true } }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ld.prog.g2mul.slice(0, 3))), [[3, 3, 0], [0, 0, 0], [1, 0, 0]]);
  assert.strictEqual(ld.prog.g2mul.length, L.maxLevel('g2mul')); assert.deepStrictEqual(Array.from(ld.prog.g2add), []);
  assert(L.bossDone(ld, 'g2add', 2) && !L.bossDone(ld, 'g2add', 3) && ld.intro.g2add === true && ld.intro.zz === undefined);
});
t('world: milestone missions and rescued heroes', () => {
  const R = n => Array.from({ length: n }, () => true);
  for (const tp of L.TOPICS.filter(x => x.g <= 4)) for (const g of [1, 2, 3, 4]) {
    const lv = L.bossLevels(tp.id, g);
    assert.strictEqual(lv.length > 0, g === tp.g);
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
  const ids = new Set(); for (const tp of L.TOPICS.filter(x => x.g <= 4)) ids.add(L.heroId(tp.id, tp.g));
  assert.strictEqual(ids.size, 23);
  for (let i = 0; i < 500; i++) assert(L.rollTroll([], Math.random).id < L.HERO_BASE);
});
t('challenge stage mixes in at most two review questions from open levels', () => {
  const open = {}; L.TOPICS.forEach((tl, i) => { open[tl.id] = 1 + i % 2; }); open.g2add = 3; let withReview = 0;
  for (let i = 0; i < 300; i++) {
    const r = L.createRound('g2add', { g2add: 3 }, Math.random, 7, [], open), rev = r.qs.filter(q => q.review);
    assert.strictEqual(r.qs.length, 7); assert(rev.length <= 2); assert(!r.qs[0].review);
    for (const q of rev) assert(q.level <= open[q.topic] && !q.enr, JSON.stringify([q.topic, q.level]));
    for (const q of r.qs.filter(x => !x.review)) assert(q.topic === 'g2add' && q.level === 3);
    if (rev.length) withReview++;
  }
  assert(withReview > 100);
  assert(L.createRound('g2add', { g2add: 3 }, Math.random, 7).qs.every(q => !q.review));
});
console.log('all ' + n + ' passed (world)');
t('activity formats: every variant is consistent with its exercise', () => {
  const seen = {};
  const check = (q, s) => {
    seen[q.fmt] = (seen[q.fmt] || 0) + 1;
    const text = strip(q.text);
    assert(q.ex && q.ex.steps.length >= 2, s);
    assert.strictEqual(q.options.filter(o => o === q.answer).length, 1, s);
    if (q.fmt === 'tf') { const [l, r] = text.split(' = '); assert.strictEqual(evx(l) === evx(r), q.answer === 'yes', s); }
    else if (q.fmt === 'cmp') { const [l, r] = text.split(' ◯ '), a = evx(l), b = evx(r); assert.strictEqual(a < b ? '<' : a > b ? '>' : '=', q.answer, s); }
    else if (q.fmt === 'line') { assert(q.lo <= q.answer && q.answer <= q.hi && q.hi - q.lo === 10 && q.lo >= 0, s); assert(q.start === q.lo || q.start === q.hi || q.start < 10, 'the line starts at the first number: ' + s); assert(q.lo <= q.start && q.start <= q.hi, s); assert.strictEqual(evx(text.replace(' = ?', '')), q.answer, s); }
    else if (q.fmt === 'use') { const [l, r] = q.pre.split(' = '); assert.strictEqual(evx(l), +r.replace(/,/g, ''), s); assert.strictEqual(evx(text.replace(' = ?', '')), q.answer, s); if (q.ex.kind !== 'usefact') assert.strictEqual(Math.abs(+r - q.answer), 1, s); }
    else if (q.fmt === 'lefteq') { const [l, r] = text.replace('□', q.answer).split('='); assert.strictEqual(evx(l), evx(r), s); assert.strictEqual(q.options.length, 4, s); }
    else if (q.fmt === 'word') { assert(q.rtl && q.pic && Number.isInteger(q.answer) && q.options.length === 4, s); const nums = text.match(/\d+/g).map(Number); assert.strictEqual(nums.length, 2, s);
      assert([nums[0] + nums[1], nums[0] - nums[1], nums[0] * nums[1], nums[0] / nums[1]].includes(q.answer), s); }
    else if (q.fmt === 'build') assert(q.answer >= 11 && q.answer <= 9999, s);
    else if (q.fmt === 'array') assert(q.a >= 2 && q.b >= 2 && q.a <= 10 && q.b <= 10 && q.answer === 'ok', s);
    else if (q.fmt === 'pairs') { assert.strictEqual(q.pairs.length, 4, s); assert.strictEqual(new Set(q.pairs.map(p => p.r)).size, 4, s);
      for (const p of q.pairs) assert.strictEqual(evx(strip(p.l)), p.r, s); assert.deepStrictEqual(Array.from(q.rights).sort((a, b) => a - b), Array.from(q.pairs, p => p.r).sort((a, b) => a - b), s); }
    else assert.strictEqual(q.fmt, 'choice', s);
  };
  for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (const stage of [0, 1, 2]) for (let i = 0; i < 40; i++) {
    const r = L.createRound(tp.id, { [tp.id]: lv }, Math.random, L.STAGE_SIZE[stage], [], null, stage);
    assert.strictEqual(r.qs.length, L.STAGE_SIZE[stage]);
    assert(r.qs.filter(q => q.fmt === 'pairs').length <= 1, 'at most one matching game per stage');
    for (const q of r.qs) check(q, tp.id + ' L' + lv + ' S' + stage + ' ' + JSON.stringify([q.fmt, q.text, q.answer, q.pre, q.lo]));
    if (stage === 0) assert(r.qs.every(q => ['choice', 'array', 'build', 'line'].includes(q.fmt) || (q.fmt === 'cmp' && q.ex.kind === 'compare') || (q.fmt === 'use' && q.ex.kind === 'usefact')), 'discovery is hands-on');
  }
  for (const tp of L.SRC) for (const g of [1, 2, 3, 4]) if (L.bossLevels(tp.id, g).length) for (let i = 0; i < 20; i++) L.createBoss(tp.id, g, Math.random).qs.forEach(q => check(q, 'boss ' + tp.id));
  for (const k of ['choice', 'tf', 'cmp', 'line', 'use', 'lefteq', 'word', 'build', 'array', 'pairs']) assert(seen[k] > 20, 'format never produced: ' + k + ' ' + JSON.stringify(seen));
  assert(L.createRound('add', { add: 3 }, Math.random, 10).qs.every(q => q.fmt === 'choice'), 'without a stage, questions stay plain');
  const r = L.createRound('add', { add: 1 }, Math.random); r.miss(); r.miss();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.answer(r.current().answer))), { correct: true, firstTry: false });
});
console.log('all ' + n + ' passed (formats)');
t('cloud: newer progress wins per player, deleted players stay deleted, ids never clash', () => {
  const j = x => JSON.parse(JSON.stringify(x));
  assert(L.CODE_RE.test(L.newCode(Math.random)));
  const A = { list: [{ id: 'p111111111', name: 'a' }, { id: 'p222222222', name: 'b' }], gone: [], t: { p111111111: 5, p222222222: 9 } };
  let m = j(L.mergeCloud(A, null)); // first upload
  assert(m.meta); assert.deepStrictEqual(m.push, ['p111111111', 'p222222222']); assert.deepStrictEqual(m.pull, []);
  const R = { list: A.list.concat([{ id: 'p333333333', name: 'c' }]), gone: [], t: { p111111111: 7, p222222222: 9, p333333333: 2 } };
  m = j(L.mergeCloud(A, R));
  assert.deepStrictEqual(m.pull, ['p111111111', 'p333333333']); assert.deepStrictEqual(m.push, []); assert(!m.meta);
  assert.strictEqual(m.list.length, 3);
  m = j(L.mergeCloud({ list: A.list, gone: ['p222222222'], t: { p111111111: 8 } }, R)); // deleted here
  assert(m.meta); assert(!m.list.some(p => p.id === 'p222222222')); assert.deepStrictEqual(m.push, ['p111111111']);
  m = j(L.mergeCloud(A, { list: [A.list[0]], gone: ['p222222222'], t: { p111111111: 5 } })); // deleted elsewhere
  assert(!m.meta); assert.deepStrictEqual(m.list.map(p => p.id), ['p111111111']); assert.deepStrictEqual(m.gone, ['p222222222']);
  const P = L.addProfile({ cur: null, list: [{ id: 'p1', name: 'x' }] }, 'y', 'p987654321');
  assert.strictEqual(P.cur, 'p987654321');
  assert.strictEqual(L.addProfile(P, 'z', 'p987654321').cur, 'p987654322');
});
t('race: points follow the own frontier of the child, ranking and finish', () => {
  const R = L.RACE;
  assert.strictEqual(R.GOAL, 300); assert.strictEqual(R.MAX_MS, 600000); assert.strictEqual(R.INVITE_MS, 15000); assert.strictEqual(R.MAXP, 4);
  const s2 = L.newState(2), s4 = L.newState(4), ft = { firstTry: true };
  s2.levels.g2add = 3;
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 3 }, { firstTry: false }), 0);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 3 }, ft), 20);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 2 }, ft), 15);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 1 }, ft), 10);
  assert.strictEqual(L.racePoints(s2, { topic: 'g3add', level: 1 }, ft), 20); // challenge map
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 1 }, { firstTry: true, boss: true }), 20);
  // a brand new player of any grade earns the full value on the first open house
  [1, 2, 3, 4].forEach(g => { const s = L.newState(g), t = L.topicsFor(s)[0]; assert.strictEqual(L.racePoints(s, { topic: t, level: s.levels[t] }, ft), 20, 'grade ' + g); });
  assert.strictEqual(L.racePoints(s4, { topic: L.topicsFor(s4)[0], level: s4.levels[L.topicsFor(s4)[0]] }, ft), L.racePoints(s2, { topic: 'g2add', level: 3 }, ft));
  // a yes / no question can be guessed, and the discovery stage shows the hint: half each
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 3, fmt: 'tf' }, ft), 10);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 2, fmt: 'tf' }, ft), 8);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 1, fmt: 'tf' }, ft), 5);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 3 }, { firstTry: true, stage: 0 }), 10);
  assert.strictEqual(L.racePoints(s2, { topic: 'g2add', level: 3, fmt: 'tf' }, { firstTry: true, stage: 0 }), 5);
  assert.strictEqual(L.racePoints(s2, { topic: 'nope', level: 1 }, ft), 10); // unknown house: the lowest value, never a crash
  const j = x => JSON.parse(JSON.stringify(x));
  let r = j(L.raceRank({ p1: { n: 'a', pts: 120 }, p2: { n: 'b', pts: 300, fin: 9 }, p3: { n: 'c', pts: 300, fin: 5 }, p4: { n: 'd', pts: 120, out: true } }));
  assert.deepStrictEqual(r.map(x => x.id), ['p3', 'p2', 'p1', 'p4']);
  assert.deepStrictEqual(r.map(x => x.place), [1, 2, 3, 3]);
  assert.strictEqual(r[3].out, true);
  r = j(L.raceRank({ p1: { n: 'a', pts: 200 }, p2: { n: 'b', pts: 200 }, p3: { n: 'c', pts: 10 } }));
  assert.deepStrictEqual(r.map(x => x.place), [1, 1, 3]);
  r = j(L.raceRank({ p1: { n: 'a', pts: 300 }, p2: { n: 'b', pts: 300, fin: 7 } })); // a missing finish time ranks last among equals
  assert.deepStrictEqual(r.map(x => x.id), ['p2', 'p1']);
  r = j(L.raceRank({ p1: { n: 'a', pts: 5 }, bad: null, p2: { pts: 9 }, p3: { n: 'x'.repeat(40), pts: 'many' }, p4: { n: '<b>z</b>', pts: 9999, g: 77, b: 'x', d: 5 } }));
  assert.deepStrictEqual(r.map(x => x.id), ['p4', 'p1']);
  assert.strictEqual(r[0].pts, 400); assert.strictEqual(r[0].n, '<b>z</b>'); assert.strictEqual(r[0].g, 4); assert.strictEqual(r[0].b, 0); assert.strictEqual(r[0].d, '');
  assert.deepStrictEqual(j(L.raceRank(null)), []);
  // the first across the line wins, even when a slower player collects more points before the race stops
  r = j(L.raceRank({ p1: { n: 'a', pts: 300, fin: 5 }, p2: { n: 'b', pts: 315, fin: 8 }, p3: { n: 'c', pts: 320 }, p4: { n: 'd', pts: 320 } }));
  assert.deepStrictEqual(r.map(x => x.id), ['p1', 'p2', 'p3', 'p4']);
  assert.deepStrictEqual(r.map(x => x.place), [1, 2, 3, 3]);
  r = j(L.raceRank({ p1: { n: 'a', pts: 300, fin: 5 }, p2: { n: 'b', pts: 320, fin: 5 } }));
  assert.deepStrictEqual(r.map(x => x.place), [1, 1]);
  assert.strictEqual(L.raceDone({ a: { n: 'a', pts: 299 } }, 599999), false);
  assert.strictEqual(L.raceDone({ a: { n: 'a', pts: 300 } }, 10), true);
  assert.strictEqual(L.raceDone({ a: { n: 'a', pts: 0 } }, 600000), true);
  assert.strictEqual(L.raceDone(null, 0), false);
  assert.strictEqual(L.loadState({ v: 4, grade: 2, lastRace: 'r123456789' }).lastRace, 'r123456789');
  assert.strictEqual(L.loadState({ v: 4, grade: 2, lastRace: { x: 1 } }).lastRace, '');
});
t('players: boy or girl wording, public or local, experience points', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  L.MALE.forEach(([f, m]) => { assert(html.split(f).length > 2, 'feminine form is used in the game: ' + f); assert.notStrictEqual(f, m); assert.strictEqual(L.forBoy(f), m); assert.strictEqual(L.forBoy(m), m, 'already masculine: ' + m); });
  const fem = L.MALE.map(x => x[0])[3], mas = L.MALE.map(x => x[1])[3];
  assert.strictEqual(L.forBoy('▶ ' + fem + ' 3 + 4!'), '▶ ' + mas + ' 3 + 4!');
  assert.strictEqual(L.forBoy('x' + fem + 'א'), 'x' + fem + 'א'); // only whole words
  assert.strictEqual(L.forBoy(null), null);
  let P = L.addProfile({ cur: null, list: [] }, 'a', 'p111111111', { sex: 'm', loc: true });
  P = L.addProfile(P, 'b', 'p222222222', { sex: 'f' });
  P = L.addProfile(P, 'c', 'p333333333');
  const j = x => JSON.parse(JSON.stringify(x));
  assert.deepStrictEqual(j(P.list), [{ id: 'p111111111', name: 'a', sex: 'm', loc: true }, { id: 'p222222222', name: 'b', sex: 'f' }, { id: 'p333333333', name: 'c' }]);
  assert.deepStrictEqual(j(L.loadProfiles(JSON.stringify(P)).list), j(P.list));
  assert.deepStrictEqual(j(L.loadProfiles({ list: [{ id: 'p1', name: 'x', sex: 'zz', loc: 'yes' }] }).list), [{ id: 'p1', name: 'x' }]);
  const m = j(L.mergeCloud({ list: P.list, gone: [], t: {} }, { list: [], gone: [], t: {} }));
  assert.deepStrictEqual(m.list, j(P.list)); assert(m.meta, 'the list with the new fields is pushed');
  assert(!j(L.mergeCloud({ list: P.list, gone: [], t: {} }, { list: P.list, gone: [], t: {} })).meta);
  assert.strictEqual(L.newState(2).xp, 0);
  assert.strictEqual(L.loadState({ v: 4, grade: 2, stars: 10 }).xp, 30); // an estimate for players from before the points
  assert.strictEqual(L.loadState({ v: 4, grade: 2, stars: 10, xp: 7 }).xp, 7);
});
console.log('all ' + n + ' passed (players)');
