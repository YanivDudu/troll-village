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
  for (const it of L.ITEMS) assert(['acc', 'hat', 'face', 'hand', 'pet', 'move', 'party'].includes(it.slot) && it.price >= 0 && it.name && (it.slot === 'acc') === (it.e === ''), it.id);
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
  // fixed prices: an item costs its own price, however many items the player already has (it used to rise 5% with every purchase)
  let p = L.newState(), before = L.priceOf(p, 'dragon'); p.coins = 100000;
  assert.strictEqual(L.priceOf(p, 'bow'), 0); assert.strictEqual(L.priceOf(p, 'nope'), 0); assert.strictEqual(before, 100);
  const base = { apple: 10, ball: 20, flower: 16, crown: 50, tophat: 40, unicorn: 90, whale: 88, cup: 60 }; // the base prices before the change: nothing got dearer
  for (const k in base) assert.strictEqual(L.priceOf(p, k), base[k], k);
  let spent = 0;
  for (const it of L.ITEMS.filter(i => i.price > 0 && i.id !== 'dragon')) { const c = L.priceOf(p, it.id); assert.strictEqual(c, it.price, it.id); const b = L.buy(p, it.id); assert(b.ok && b.state.coins === p.coins - c); p = b.state; spent += c; }
  assert.strictEqual(L.priceOf(p, 'dragon'), before, 'the last item costs what it cost at the start');
  assert.strictEqual(spent, L.ITEMS.filter(i => i.id !== 'dragon').reduce((a, i) => a + i.price, 0));
  // items that do something: victory moves and celebrations. None of them is a hat, and none touches coins, stars or exercises
  const acts = L.ITEMS.filter(i => i.slot === 'move' || i.slot === 'party');
  assert(acts.length >= 8 && acts.length <= 12, 'action items: ' + acts.length);
  for (const it of acts) { assert(it.price >= 40 && it.e && !L.EMOJI_SLOTS.includes(it.slot), it.id); assert.strictEqual(Object.keys(it).sort().join(), 'e,id,name,price,slot'); }
  // state.fx is optional: a save without it behaves as before; equipping needs ownership; the field survives a reload and junk in it is dropped
  let f = L.newState(); assert.strictEqual(f.fx, undefined); assert.strictEqual(L.fxOf(f, 'move'), ''); assert.strictEqual(L.goalOf(f), null);
  assert.strictEqual(L.loadState(JSON.stringify(f)).fx, undefined, 'an old save gets no new field');
  assert.strictEqual(L.fxOf(L.setFx(f, 'move', 'spin'), 'move'), '', 'a move that is not owned cannot be equipped');
  f.coins = 500; f = L.buy(f, 'spin').state; f = L.buy(f, 'pfire').state;
  const coinsThen = f.coins;
  f = L.setFx(f, 'move', 'spin'); f = L.setFx(f, 'party', 'pfire');
  assert.strictEqual(L.fxOf(f, 'move'), 'spin'); assert.strictEqual(L.fxOf(f, 'party'), 'pfire'); assert.strictEqual(f.coins, coinsThen, 'equipping is free');
  assert.strictEqual(L.fxOf(L.setFx(f, 'move', 'pfire'), 'move'), '', 'a celebration is not a move');
  assert.strictEqual(L.fxOf(L.setFx(f, 'move', ''), 'move'), '');
  let back = L.loadState(JSON.stringify(f)); assert.strictEqual(JSON.stringify(back.fx), JSON.stringify({ move: 'spin', party: 'pfire' })); assert(back.items.includes('spin') && back.items.includes('pfire'));
  assert.strictEqual(JSON.stringify(L.loadState(JSON.stringify(Object.assign({}, f, { fx: { move: 'crown', party: 7, goal: 'zzz', told: 'zzz', x: 1 } }))).fx), '{}');
  assert.deepStrictEqual(L.loadState(JSON.stringify(Object.assign({}, f, { fx: 'x' }))).fx, undefined);
  // the savings goal: one item that is not owned; the meter is coins / price; nothing expires; buying it ends the goal
  let g = L.newState(); g.coins = 30; g = L.setGoal(g, 'dragon');
  assert.deepStrictEqual([L.goalOf(g).id, L.goalOf(g).price, L.goalOf(g).have, L.goalOf(g).ready], ['dragon', 100, 30, false]); assert.strictEqual(L.goalOf(g).part, 0.3);
  g = L.setGoal(g, 'unicorn'); assert.strictEqual(L.goalOf(g).id, 'unicorn', 'one goal at a time');
  assert.strictEqual(L.goalOf(L.setGoal(g, 'bow')), null, 'something owned or free is not a goal'); assert.strictEqual(L.goalOf(L.setGoal(g, '')), null);
  g = L.setGoal(g, 'dragon'); g.fx.told = 'dragon'; g.coins = 130;
  assert(L.goalOf(g).ready && L.goalOf(g).part === 1); assert.strictEqual(L.loadState(JSON.stringify(g)).fx.told, 'dragon');
  assert.strictEqual(L.setGoal(g, 'unicorn').fx.told, undefined, 'a new goal is offered anew');
  const bought = L.buy(g, 'dragon').state; assert.strictEqual(L.goalOf(bought), null); assert.strictEqual(bought.coins, 30);
  assert.strictEqual(g.coins, 130, 'setGoal, setFx and buy return new states');
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
  const A = { list: [{ id: 'p111111111', name: 'a' }, { id: 'p222222222', name: 'b' }], gone: [], n: { p111111111: 5, p222222222: 9 }, t: { p111111111: 5, p222222222: 9 }, has: { p111111111: true, p222222222: true } };
  let m = j(L.mergeCloud(A, null)); // first upload
  assert(m.meta); assert.deepStrictEqual(m.push, ['p111111111', 'p222222222']); assert.deepStrictEqual(m.pull, []); assert.deepStrictEqual(m.n, { p111111111: 5, p222222222: 9 });
  const all3 = { p111111111: true, p222222222: true, p333333333: true };
  const R = { list: A.list.concat([{ id: 'p333333333', name: 'c' }]), gone: [], n: { p111111111: 7, p222222222: 9, p333333333: 2 }, t: { p111111111: 7, p222222222: 9, p333333333: 2 }, st: { p111111111: '7:7|7', p222222222: '9:9|9', p333333333: '2:2|2' }, has: all3 };
  m = j(L.mergeCloud(A, R));
  assert.deepStrictEqual(m.pull, ['p111111111', 'p222222222', 'p333333333'], 'no base yet: the cloud wins the full tie of the second player too'); assert.deepStrictEqual(m.push, []); assert(!m.meta);
  assert.strictEqual(m.list.length, 3);
  m = j(L.mergeCloud(Object.assign({}, A, { b: { p222222222: '9:9|9' } }), R));
  assert.deepStrictEqual(m.pull, ['p111111111', 'p333333333'], 'the copy this device already holds is not pulled again');
  m = j(L.mergeCloud({ list: A.list, gone: ['p222222222'], n: { p111111111: 8 }, t: { p111111111: 8 }, has: { p111111111: true } }, R)); // deleted here
  assert(m.meta); assert(!m.list.some(p => p.id === 'p222222222')); assert.deepStrictEqual(m.push, ['p111111111']); assert.strictEqual(m.n.p111111111, 8);
  m = j(L.mergeCloud(A, { list: [A.list[0]], gone: ['p222222222'], n: { p111111111: 5 }, t: { p111111111: 5 }, st: { p111111111: '5:5|5' }, has: { p111111111: true } })); // deleted elsewhere
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
  const m = j(L.mergeCloud({ list: P.list, gone: [] }, { list: [], gone: [] }));
  assert.deepStrictEqual(m.list, j(P.list)); assert(m.meta, 'the list with the new fields is pushed'); assert.deepStrictEqual(m.push.concat(m.pull), [], 'a card without progress is neither pushed nor pulled');
  assert(!j(L.mergeCloud({ list: P.list, gone: [] }, { list: P.list, gone: [] })).meta);
  assert.strictEqual(L.newState(2).xp, 0);
  assert.strictEqual(L.loadState({ v: 4, grade: 2, stars: 10 }).xp, 30); // an estimate for players from before the points
  assert.strictEqual(L.loadState({ v: 4, grade: 2, stars: 10, xp: 7 }).xp, 7);
});
t('next step: always forward, from the newest open house; a ready bridge; never locked, never another grade, never an earlier house', () => {
  const j = x => JSON.parse(JSON.stringify(x));
  const finishHouse = (s, id, lv) => { for (let k = 0; k < 3; k++) s = L.finishStage(s, id, lv, k, [true]).state; s.last = { t: id, l: lv }; return s; };
  const check = (s, st) => { // whatever is offered is open by the existing rules and belongs to the player's grade
    if (!st || st.challenge) return;
    const tl = L.TOPICS.find(x => x.id === st.topic);
    assert.strictEqual(tl.g, s.grade, 'own grade: ' + JSON.stringify(st)); assert.strictEqual(tl.sub || 'math', st.sub);
    assert(L.topicsFor(s, st.sub).includes(st.topic));
    if (st.boss) assert(L.bossReady(s, st.topic, st.boss) && st.boss === s.grade, JSON.stringify(st));
    else { assert(L.stageOpen(s, st.topic, st.level, st.stage), 'open: ' + JSON.stringify(st)); assert.strictEqual(L.progOf(s, st.topic, st.level)[st.stage], 0, 'a stage without a star'); }
  };
  // a brand-new player of every grade starts where the game starts them: the start-level house of the first tile, first stage
  for (const g of [1, 2, 3, 4]) {
    const s = L.newState(g), id = L.topicsFor(s)[0], st = j(L.nextStep(s));
    assert.deepStrictEqual(st, { sub: 'math', topic: id, level: L.startLevel(L.TOPICS.find(x => x.id === id), g), stage: 0 }, 'grade ' + g); check(s, st);
    assert.strictEqual(st.level, s.levels[id]);
  }
  assert.deepStrictEqual(j(L.nextStep(L.newState(2))), { sub: 'math', topic: 'g2add', level: 3, stage: 0 });
  // a save without the optional field (every save made before this change) loads and gets a step
  assert.strictEqual(L.loadState(JSON.stringify(L.newState(2))).last, undefined);
  assert.strictEqual(L.newState(2).last, undefined); assert.strictEqual(L.newState(2).v, 4);
  assert.deepStrictEqual(j(L.loadState({ v: 4, grade: 2, last: { t: 'g2sub', l: 2 } }).last), { t: 'g2sub', l: 2 });
  assert.strictEqual(L.loadState({ v: 4, grade: 2, last: { t: 'nope', l: 2 } }).last, undefined);
  assert.strictEqual(L.loadState({ v: 4, grade: 2, last: 'x' }).last, undefined);
  assert.deepStrictEqual(j(L.loadState({ v: 4, grade: 2, last: { t: 'g2sub', l: 99 } }).last), { t: 'g2sub', l: 4 });
  // continue the house the child played last (also an earlier house the child chose in the map), while it has a stage without a star
  let s = L.newState(2); s.last = { t: 'g2sub', l: 2 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 2, stage: 0 });
  s = L.finishStage(s, 'g2sub', 2, 0, [true]).state;
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 2, stage: 1 });
  // that house is finished: the newest open house of the same tile, not house 1
  s = finishHouse(s, 'g2sub', 2);
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 3, stage: 0 });
  // after the newest house is finished the step is the house that has just opened
  s = finishHouse(L.newState(2), 'g2add', 3);
  assert.strictEqual(s.levels.g2add, 4); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 4, stage: 0 }); check(s, L.nextStep(s));
  // the last house of a tile is finished, houses 1-2 were never played: the bridge waits for them, so they come now (marked), then the bridge, then the next tile
  s = finishHouse(s, 'g2add', 4);
  assert(!L.bossReady(s, 'g2add', 2)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 1, stage: 0, bridge: true }); check(s, L.nextStep(s));
  s = L.finishStage(s, 'g2add', 1, 0, [true]).state; s.last = { t: 'g2add', l: 1 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 1, stage: 1, bridge: true });
  s = finishHouse(s, 'g2add', 1); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 2, stage: 0, bridge: true });
  s = finishHouse(s, 'g2add', 2); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', boss: 2 });
  s = j(s); s.boss.g2add[2] = true; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 3, stage: 0 });
  // an earlier house the child chose in the map while the newest house is not finished is not marked as bridge work
  s = L.newState(2); s.last = { t: 'g2add', l: 1 }; assert.strictEqual(L.nextStep(s).bridge, undefined);
  // the newest house: a stage opens only after the one before it
  s = L.newState(2); s.last = { t: 'g2add', l: 3 }; s = L.finishStage(s, 'g2add', 3, 0, [true]).state;
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3, stage: 1 }); check(s, L.nextStep(s));
  // a house that is still closed is never offered, even when it was written as the last one
  s = L.newState(2); s.last = { t: 'g2add', l: 4 };
  assert(!L.stageOpen(s, 'g2add', 4, 0)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3, stage: 0 });
  // a tile of another grade is never offered, also when the child played there last (the challenge map)
  s = L.newState(2); s.last = { t: 'g3mul', l: 1 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3, stage: 0 });
  s = L.setGrade(Object.assign(L.newState(2), { last: { t: 'g2add', l: 1 } }), 3);
  assert.strictEqual(L.nextStep(s).topic, 'g3add');
  // a bridge mission that is ready comes when the tile has no next house, before another tile
  s = L.newState(2); s.levels.g2mul = 1; for (let lv = 1; lv <= 4; lv++) s = finishHouse(s, 'g2mul', lv);
  assert(L.bossReady(s, 'g2mul', 2)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2mul', boss: 2 }); check(s, L.nextStep(s));
  s.last = { t: 'g2add', l: 3 }; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3, stage: 0 }); // but the open house is finished first
  s.last = { t: 'g2mul', l: 4 }; s.boss.g2mul[2] = true; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2div', level: 3, stage: 0 }); // then the tile after it
  // the subject that was used last; arithmetic when nothing was played
  s = L.newState(2); const geo = L.topicsFor(s, 'geo');
  if (geo.length) { s = finishHouse(s, geo[0], s.levels[geo[0]]); const st = L.nextStep(s); assert.strictEqual(st.sub, 'geo'); check(s, st); }
  // playing on by the recommended step alone never dead-ends: every house and every bridge of the grade, each stage once,
  // an earlier house only as bridge work after the end of its tile, then the challenge map, and null only when that is finished too
  for (const g of [1, 2, 3, 4]) {
    let p = L.newState(g), steps = 0, bosses = 0, houses = 0;
    for (;;) {
      const st = L.nextStep(p); assert(st, 'grade ' + g + ' never dead-ends'); check(p, st);
      if (st.challenge) break;
      assert(++steps < 5000, 'no endless loop');
      if (st.boss) { p = j(p); p.boss[st.topic][st.boss] = true; bosses++; continue; }
      const tl = L.TOPICS.find(x => x.id === st.topic);
      if (st.level < p.levels[st.topic]) { assert(st.bridge, 'an earlier house only toward the bridge: ' + JSON.stringify(st)); assert.strictEqual(p.levels[st.topic], tl.levels.length);
        for (let lv = L.startLevel(tl, g); lv <= tl.levels.length; lv++) assert(L.progOf(p, st.topic, lv).every(x => x >= 1)); }
      else assert(!st.bridge);
      p = L.finishStage(p, st.topic, st.level, st.stage, [true]).state; p.last = { t: st.topic, l: st.level };
    }
    for (const sub of L.SUBS) for (const id of L.topicsFor(p, sub)) { const tl = L.TOPICS.find(x => x.id === id); houses += tl.levels.length;
      assert(L.bossDone(p, id, g), id); tl.levels.forEach((d, i) => assert(L.progOf(p, id, i + 1).every(x => x >= 1), id + ' ' + (i + 1))); }
    assert.strictEqual(steps, houses * 3 + bosses, 'every stage exactly once, grade ' + g);
    assert(L.challengeOpen(p, L.nextStep(p).sub));
    for (const sub of L.SUBS) for (const id of L.challengeFor(p, sub)) p.prog[id] = L.TOPICS.find(x => x.id === id).levels.map(() => [1, 1, 1]);
    assert.strictEqual(L.nextStep(p), null, 'the grade and its challenge are finished, grade ' + g);
  }
  // the unlock rules themselves did not move
  s = L.newState(2);
  assert(L.stageOpen(s, 'g2add', 1, 2) && L.stageOpen(s, 'g2add', 3, 0) && !L.stageOpen(s, 'g2add', 3, 1) && !L.stageOpen(s, 'g2add', 4, 0));
  const before = JSON.stringify(s); L.nextStep(s); assert.strictEqual(JSON.stringify(s), before, 'pure');
});
// ---------- stage 6: what the companion remembers (state.mem), the friendship level, the travel journal ----------
// a second copy of the logic with the subject packs loaded (geometry, Hebrew, English), for the counts of whole grades
const ctxP = {}; vm.createContext(ctxP); ctxP.window = ctxP;
for (const f of fs.readdirSync(path.join(__dirname, '..', 'packs')).filter(f => /^(geo|heb|eng)[1-5]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'packs', f), 'utf8'), ctxP);
vm.runInContext(m[1] + ';this.L=TrollLogic;', ctxP);
const LP = ctxP.L, TODAY = '2026-11-21', J6 = x => JSON.parse(JSON.stringify(x));
const dago = k => new Date(Date.UTC(2026, 10, 21 - k)).toISOString().slice(0, 10); // the day k days before TODAY
const houseOf = (Lx, s, id, lv) => { [0, 1, 2].forEach(k => { s = Lx.finishStage(s, id, lv, k, [true]).state; }); return s; };
const tileDone = (Lx, s, id) => { Lx.TOPICS.find(x => x.id === id).levels.forEach((d, i) => { s = houseOf(Lx, s, id, i + 1); }); return s; };
const keysOf = (s, day) => Array.from(L.memTriggers(s, day || TODAY)).map(x => x.key);
const played = g => { const s = L.newState(g || 2); s.rounds = 4; s.stars = 2; return s; }; // not a new player, nothing finished
t('memory: the optional field state.mem loads, is cleaned, survives a round trip and a sync, and never throws', () => {
  // 1. missing: stays missing
  assert.strictEqual(L.newState(2).mem, undefined); assert.strictEqual(L.newState(2).v, 4);
  const plain = L.loadState(JSON.stringify(L.newState(2)));
  assert.strictEqual(plain.mem, undefined); assert.strictEqual(plain.v, 4); assert(!('mem' in J6(plain)));
  assert.deepStrictEqual(Array.from(L.memEv(plain)), []);
  // 2. valid events are kept, everything else is dropped, extra keys are stripped, only the newest 12 stay
  const good = [{ k: 'p', t: 'g2add', l: 3, d: dago(2) }, { k: 'h', t: 'g2add', l: 3, d: dago(2) }, { k: 'm', t: '', l: 0, d: dago(1) }, { k: 'b', t: 'g2add', l: 2, d: dago(1) }];
  const bad = [null, 7, 'p', [], {}, { k: 'x', t: 'g2add', l: 1, d: TODAY }, { k: 'pp', t: 'g2add', l: 1, d: TODAY }, { k: 'p', t: 'g2add', l: 1, d: '21.11.2026' }, { k: 'p', t: 'g2add', l: 1 },
    { k: 'p', t: 'nope', l: 1, d: TODAY }, { k: 'p', t: 'constructor', l: 1, d: TODAY }, { k: 'p', t: 'add', l: 1, d: TODAY }, { k: 'p', t: 'g2add', l: 0, d: TODAY }, { k: 'p', t: 'g2add', l: 99, d: TODAY },
    { k: 'p', t: 'g2add', l: 1.5, d: TODAY }, { k: 'p', t: 'g2add', l: '1', d: TODAY }, { k: 'h', t: 'g2add', l: 99, d: TODAY }, { k: 'b', t: 'g2add', l: 5, d: TODAY }, { k: 'b', t: 'nope', l: 2, d: TODAY }, { k: 7, t: 'g2add', l: 1, d: TODAY }];
  let o = J6(L.newState(2)); o.mem = { ev: bad.concat(good.map(e => Object.assign({ junk: 1, f: () => 1 }, e)), bad), more: 5 };
  let s = L.loadState(JSON.stringify(o));
  assert.deepStrictEqual(J6(s.mem), { ev: good });
  o.mem = { ev: [{ k: 'm', t: 'nope', l: 9, d: TODAY, x: 1 }] }; assert.deepStrictEqual(J6(L.loadState(o).mem), { ev: [{ k: 'm', t: '', l: 0, d: TODAY }] }, 'm keeps only a real tile');
  const many = []; for (let i = 0; i < 30; i++) many.push({ k: 'h', t: 'g2add', l: 1 + i % 3, d: dago(40 - i) });
  o.mem = { ev: many }; s = L.loadState(JSON.stringify(o));
  assert.strictEqual(L.MEM_MAX, 12); assert.strictEqual(s.mem.ev.length, 12); assert.deepStrictEqual(J6(s.mem.ev), many.slice(-12));
  // garbage in the field (an old page, a broken save): nothing throws, nothing is said that needs a date
  for (const junk of [null, 5, 'x', true, [], [1, 2], { ev: 'x' }, { ev: null }, { ev: {} }, { ev: [null, [], 'a', {}, { k: 'p' }] }]) {
    o = J6(L.newState(2)); o.mem = junk; o.rounds = 3; o.stars = 2;
    const g = L.loadState(JSON.stringify(o));
    assert(g.mem === undefined || g.mem.ev.length === 0, JSON.stringify(junk));
    const raw = L.newState(2); raw.rounds = 3; raw.stars = 2; raw.mem = junk; // not even normalised by loadState
    assert.deepStrictEqual(Array.from(L.memEv(raw)), [], JSON.stringify(junk));
    assert.deepStrictEqual(keysOf(raw), ['generic']);
    assert.strictEqual(L.memFacts(raw, TODAY).gap, null); L.journal(raw); L.friend(raw); L.stageMemo(raw, 'g2add', 3, 1);
    const a = L.memAdd(raw, 'p', 'g2add', 3, TODAY); assert.deepStrictEqual(J6(a.mem), { ev: [{ k: 'p', t: 'g2add', l: 3, d: TODAY }] });
  }
  assert.deepStrictEqual(Array.from(L.memEv(null)), []); assert.deepStrictEqual(Array.from(L.memEv(undefined)), []);
  // 3. a state with mem, saved and loaded twice, is unchanged
  o = J6(L.newState(2)); o.mem = { ev: good }; o.last = { t: 'g2add', l: 3 }; o.fx = { goal: L.ITEMS.find(x => x.price).id };
  const one = L.loadState(JSON.stringify(o)), two = L.loadState(JSON.stringify(one));
  assert.deepStrictEqual(J6(two), J6(one)); assert.deepStrictEqual(J6(two.mem), { ev: good });
  // ... and through a sync: device A pushes its player (the saved text goes through loadState), device B has older progress and pulls it
  const A = { list: [{ id: 'p111111111', name: 'a' }], gone: [], n: { p111111111: 9 }, t: { p111111111: 9 }, has: { p111111111: true } }, B = { list: A.list, gone: [], n: { p111111111: 4 }, t: { p111111111: 4 }, has: { p111111111: true } };
  const up = L.mergeCloud(A, { list: A.list, gone: [], n: { p111111111: 4 }, t: { p111111111: 4 }, st: { p111111111: '4:4|4' }, has: { p111111111: true } }); assert.deepStrictEqual(Array.from(up.push), ['p111111111']);
  const cloud = { list: A.list, gone: [], n: { p111111111: 9 }, t: { p111111111: 9 }, st: { p111111111: '9:9|9' }, has: { p111111111: true }, s: { p111111111: JSON.stringify(L.loadState(JSON.stringify(one))) } };
  const down = L.mergeCloud(B, cloud); assert.deepStrictEqual(Array.from(down.pull), ['p111111111']);
  const onB = L.loadState(cloud.s[down.pull[0]]);
  assert.deepStrictEqual(J6(onB.mem), { ev: good }); assert.deepStrictEqual(J6(onB), J6(one));
  // an older page drops the field (it copies only what it knows): the newer page then simply has no dates
  const dropped = J6(one); delete dropped.mem; const back = L.loadState(JSON.stringify(dropped));
  assert.strictEqual(back.mem, undefined); assert.strictEqual(L.memFacts(back, TODAY).gap, null); assert(keysOf(back).indexOf('lastTime') >= 0);
  // 4. memAdd: the one writer. Pure; p and m are not repeated on the same day; h and b always add; at most 12
  let a = played(2); const frozen = JSON.stringify(a);
  let b = L.memAdd(a, 'p', 'g2add', 3, TODAY); assert.strictEqual(JSON.stringify(a), frozen, 'pure'); assert.strictEqual(a.mem, undefined);
  assert.deepStrictEqual(J6(b.mem.ev), [{ k: 'p', t: 'g2add', l: 3, d: TODAY }]);
  const c = L.memAdd(b, 'p', 'g2add', 3, TODAY); assert.strictEqual(c.mem.ev.length, 1, 'same house, same day'); assert.strictEqual(b.mem.ev.length, 1);
  assert.strictEqual(L.memAdd(b, 'p', 'g2add', 4, TODAY).mem.ev.length, 2, 'another house'); assert.strictEqual(L.memAdd(b, 'p', 'g2sub', 3, TODAY).mem.ev.length, 2, 'another tile');
  assert.strictEqual(L.memAdd(b, 'p', 'g2add', 3, '2026-11-22').mem.ev.length, 2, 'a new day adds');
  let d = L.memAdd(b, 'm', 'mix', 0, TODAY); assert.deepStrictEqual(J6(d.mem.ev[1]), { k: 'm', t: '', l: 0, d: TODAY });
  assert.strictEqual(L.memAdd(d, 'm', 'mix', 0, TODAY).mem.ev.length, 2); assert.strictEqual(L.memAdd(d, 'p', 'g2add', 3, TODAY).mem.ev.length, 2, 'the newest p is still that house');
  d = L.memAdd(L.memAdd(d, 'h', 'g2add', 3, TODAY), 'h', 'g2add', 3, TODAY); assert.strictEqual(d.mem.ev.length, 4, 'h always adds');
  d = L.memAdd(L.memAdd(d, 'b', 'g2add', 2, TODAY), 'b', 'g2add', 2, TODAY); assert.strictEqual(d.mem.ev.length, 6, 'b always adds');
  for (const junk of [['x', 'g2add', 1, TODAY], ['p', 'nope', 1, TODAY], ['p', 'g2add', 99, TODAY], ['p', 'g2add', 1, 'soon'], ['p', 'g2add', undefined, TODAY], ['b', 'g2add', 7, TODAY]])
    assert.strictEqual(L.memAdd(d, junk[0], junk[1], junk[2], junk[3]).mem.ev.length, 6, 'an invalid event is not written: ' + junk);
  for (let i = 0; i < 20; i++) d = L.memAdd(d, 'h', 'g2add', 1 + i % 4, dago(-i));
  assert.strictEqual(d.mem.ev.length, 12); assert.strictEqual(d.mem.ev[11].d, dago(-19)); assert.strictEqual(d.mem.ev[0].d, dago(-8), 'the oldest are dropped');
  assert.deepStrictEqual(Object.keys(d.mem), ['ev']); d.mem.ev.forEach(e => assert.deepStrictEqual(Object.keys(e), ['k', 't', 'l', 'd']));
});
t('friendship: only houses and bridges count, it never goes down, and level 6 is within reach of every grade', () => {
  // 5. thresholds
  const F = Array.from(L.FRIEND); assert.strictEqual(F.length, 6); assert.strictEqual(F[0], 0);
  let s = L.newState(2);
  assert.deepStrictEqual(J6(L.journey(s)), { houses: 0, bridges: 0, points: 0 }); assert.deepStrictEqual(J6(L.friend(s)), { level: 1, points: 0, next: F[1], need: F[1] });
  const slots = []; L.TOPICS.forEach(tp => tp.levels.forEach((d, i) => slots.push([tp.id, i + 1])));
  const withHouses = k => { let x = L.newState(2); slots.slice(0, k).forEach(h => { x.prog[h[0]] = x.prog[h[0]].length ? x.prog[h[0]] : L.TOPICS.find(q => q.id === h[0]).levels.map(() => [0, 0, 0]); x.prog[h[0]][h[1] - 1] = [1, 2, 3]; }); return x; };
  for (let lv = 2; lv <= 6; lv++) {
    assert(F[lv - 1] > F[lv - 2]);
    assert.strictEqual(L.friend(withHouses(F[lv - 1] - 1)).level, lv - 1, 'one point below level ' + lv);
    const f = L.friend(withHouses(F[lv - 1])); assert.strictEqual(f.level, lv); assert.strictEqual(f.points, F[lv - 1]);
    assert.strictEqual(f.next, lv < 6 ? F[lv] : null); assert.strictEqual(f.need, lv < 6 ? F[lv] - F[lv - 1] : 0);
  }
  assert.strictEqual(L.friend(withHouses(F[5] + 20)).level, 6);
  s = withHouses(3); assert.strictEqual(L.friend(s).points, 3);
  s.prog.g2add = [[1, 1, 0], [0, 3, 3], [3, 0, 3]]; const two = L.journey(s).houses; s.prog.g2add = [[1, 1, 1], [0, 3, 3]]; assert.strictEqual(L.journey(s).houses, two + 1, 'a house counts only with a star in all three stages');
  s = withHouses(3); s.boss.g2add[2] = true; assert.deepStrictEqual(J6(L.journey(s)), { houses: 3, bridges: 1, points: 5 }, 'a bridge is worth two houses');
  const base = JSON.stringify(L.friend(s));
  const other = J6(s); Object.assign(other, { coins: 99999, xp: 5000, streak: 400, rounds: 900, stars: 3, lastDay: TODAY, lastGift: TODAY, owned: [1, 2, 3, 4, 5, 6, 7, 8, 9], items: L.ITEMS.map(x => x.id), buddy: 3 });
  L.TOPICS.forEach(tp => { other.levels[tp.id] = tp.levels.length; });
  assert.strictEqual(JSON.stringify(L.friend(other)), base, 'coins, experience, days, rounds, trolls, purchases and open houses do not count');
  // 6. it never goes down: random stages and bridges; a change of grade leaves it as it is
  const rnd = L.seeded(7); let p = L.newState(2), lastP = 0, lastL = 1;
  for (let i = 0; i < 300; i++) {
    const tp = L.TOPICS[Math.floor(rnd() * L.TOPICS.length)], lv = 1 + Math.floor(rnd() * tp.levels.length), res = [0, 1, 2, 3, 4, 5, 6].map(() => rnd() < 0.7);
    if (rnd() < 0.06) p.boss[tp.id][tp.g <= 4 ? tp.g : 4] = true; else p = L.finishStage(p, tp.id, lv, Math.floor(rnd() * 3), res).state;
    if (rnd() < 0.05) p = L.setGrade(p, 1 + Math.floor(rnd() * 4));
    if (rnd() < 0.05) p = L.loadState(JSON.stringify(p));
    const f = L.friend(p); assert(f.points >= lastP && f.level >= lastL, 'step ' + i); lastP = f.points; lastL = f.level;
  }
  assert(lastP > 10);
  for (let g = 1; g <= 4; g++) assert.strictEqual(L.friend(L.setGrade(p, g)).points, lastP, 'grade ' + g);
  // 7. a veteran: a save from before version 4 gets its level from what it holds, with no ceremony
  const old = { v: 2, levels: { add: 3, mul: 5 }, prog: { add: [[3, 3, 3], [2, 2, 1], [1, 0, 0]], frac: [[2, 1, 0]] }, boss: { add: { 2: true } }, stars: 16, owned: [7] };
  const vet = L.loadState(JSON.stringify(old)); let hs = 0, bs = 0;
  L.TOPICS.forEach(tp => { (vet.prog[tp.id] || []).forEach(r => { if (r.every(x => x >= 1)) hs++; }); [1, 2, 3, 4].forEach(g => { if (vet.boss[tp.id][g] === true) bs++; }); });
  assert.deepStrictEqual(J6(L.journey(vet)), { houses: 2, bridges: 1, points: 4 }); assert.strictEqual(hs + 2 * bs, 4); assert.strictEqual(L.friend(vet).level, 2);
  assert.strictEqual(vet.mem, undefined); assert.deepStrictEqual(keysOf(vet).filter(k => /yesterday|sameDay|away|doneLast|hero/.test(k)), [], 'nothing dated is said to a veteran');
  // 8. calibration against the real content: a change of the content forces a look at FRIEND
  const want = { 1: [54, 13], 2: [61, 16], 3: [77, 21], 4: [78, 19] };
  for (let g = 1; g <= 4; g++) {
    let st = LP.newState(g), maths = LP.newState(g), least = 1e9;
    for (const sub of LP.SUBS) {
      let alone = LP.newState(g);
      for (const id of LP.topicsFor(st, sub)) { st = tileDone(LP, st, id); st.boss[id][g] = true; alone = tileDone(LP, alone, id); alone.boss[id][g] = true; if (sub === 'math') { maths = tileDone(LP, maths, id); maths.boss[id][g] = true; } }
      if (sub !== 'math') least = Math.min(least, LP.journey(alone).points);
    }
    const j = LP.journey(st); assert.deepStrictEqual([j.houses, j.bridges], want[g], 'houses and bridges of grade ' + g + ': ' + j.houses + ', ' + j.bridges);
    assert.strictEqual(LP.friend(st).level, 6);
    const mp = LP.journey(maths).points;
    assert(mp + least >= F[5], 'grade ' + g + ': the maths of the grade plus its smallest other subject (' + mp + ' + ' + least + ') reaches level 6');
    if (g === 1) { assert.strictEqual(mp, 22); assert.strictEqual(LP.friend(maths).level, 5, 'grade 1 maths alone is level 5'); assert.strictEqual(mp + least, 29); }
  }
});
t('memory: what the companion may say in the camp (triggers, order, the first exercise, the journal)', () => {
  const hi = L.TOPICS.find(x => x.id === 'g2add').levels.length, heroA = L.heroId('g2add', 2), item = L.ITEMS.find(x => x.price);
  const ev = (s, list) => { list.forEach(e => { s = L.memAdd(s, e[0], e[1], e[2], dago(e[3])); }); return s; };
  // 9. first: a new player hears the opening line and nothing else
  assert.deepStrictEqual(keysOf(L.newState(2)), ['first']); assert.deepStrictEqual(keysOf(ev(L.newState(2), [['m', '', 0, 1]])), ['first']);
  // hero: the newest event is a crossed bridge whose troll is in the camp
  let s = tileDone(L, played(2), 'g2add'); s.boss.g2add[2] = true; s.owned = [5, heroA]; s.last = { t: 'g2add', l: hi };
  let h1 = ev(s, [['p', 'g2add', hi, 0], ['b', 'g2add', 2, 0]]);
  assert.strictEqual(keysOf(h1)[0], 'hero'); assert.strictEqual(L.memTriggers(h1, TODAY)[0].hero, heroA);
  assert(keysOf(ev(h1, [['p', 'g2sub', 3, 0]])).indexOf('hero') < 0, 'not after something else was played');
  const noHero = J6(h1); noHero.owned = [5]; assert(keysOf(noHero).indexOf('hero') < 0); const noFlag = J6(h1); noFlag.boss.g2add = {}; assert(keysOf(noFlag).indexOf('hero') < 0);
  // bridgeReady, bridgeNear
  s = tileDone(L, played(2), 'g2add'); s.last = { t: 'g2add', l: hi };
  assert(L.nextStep(s).boss === 2); assert.strictEqual(keysOf(s)[0], 'bridgeReady');
  const need = Array.from(L.bossLevels('g2add', 2)); assert(need.length >= 3);
  let near = played(2); need.slice(0, -1).forEach(l => { near = houseOf(L, near, 'g2add', l); }); near.last = { t: 'g2add', l: need[need.length - 1] };
  assert.strictEqual(L.nextStep(near).level, need[need.length - 1]); assert.strictEqual(keysOf(near)[0], 'bridgeNear'); assert.deepStrictEqual(J6(L.memTriggers(near, TODAY)[0].place), { t: 'g2add', l: need[need.length - 1] });
  let far = played(2); need.slice(0, -2).forEach(l => { far = houseOf(L, far, 'g2add', l); }); far.last = { t: 'g2add', l: need[need.length - 2] };
  assert(keysOf(far).indexOf('bridgeNear') < 0, 'two houses left');
  // doneLast: a house was finished on the last day of play, and that day is not today
  s = houseOf(L, played(2), 'g2add', 3); s.last = { t: 'g2add', l: 4 };
  let dl = ev(s, [['p', 'g2add', 3, 1], ['h', 'g2add', 3, 1]]);
  let tg = Array.from(L.memTriggers(dl, TODAY)).find(x => x.key === 'doneLast'); assert(tg && tg.yest === true && tg.place.l === 3);
  tg = Array.from(L.memTriggers(dl, dago(-1))).find(x => x.key === 'doneLast'); assert(tg && tg.yest === false, 'two days ago: "last time"');
  assert(keysOf(dl, dago(1)).indexOf('doneLast') < 0, 'the flag is from today');
  assert(keysOf(ev(dl, [['p', 'g2add', 4, 0]])).indexOf('doneLast') < 0, 'played again since');
  const undone = J6(dl); undone.prog.g2add[2] = [3, 3, 0]; assert(keysOf(undone).indexOf('doneLast') < 0, 'only what is still true in the save');
  // goal: the coins are enough for the savings goal
  s = ev(played(2), [['p', 'g2add', 3, 1]]); s.last = { t: 'g2add', l: 3 };
  let g1 = L.setGoal(s, item.id); g1.coins = item.price;
  tg = Array.from(L.memTriggers(g1, TODAY)).find(x => x.key === 'goal'); assert(tg && tg.item.id === item.id && tg.id === item.id);
  g1.coins = item.price - 1; assert(keysOf(g1).indexOf('goal') < 0, 'short of coins');
  const noFx = J6(s); noFx.coins = 99999; delete noFx.fx; assert(keysOf(noFx).indexOf('goal') < 0, 'no state.fx');
  // the day lines: exactly one of them
  const dayKey = (st, day) => keysOf(st, day).filter(k => /^(yesterday|sameDay|away|lastTime)$/.test(k)).join();
  assert.strictEqual(dayKey(s, TODAY), 'yesterday'); assert.strictEqual(dayKey(s, dago(1)), 'sameDay'); assert.strictEqual(dayKey(s, dago(-1)), 'lastTime', 'two days');
  assert.strictEqual(dayKey(s, dago(-2)), 'away', 'three days'); assert.strictEqual(dayKey(s, dago(-29)), 'away', 'thirty days');
  assert.strictEqual(dayKey(ev(s, [['m', '', 0, 0]]), TODAY), 'lastTime', 'today only a mixed round: the house is from the time before');
  const noMem = played(2); noMem.last = { t: 'g2add', l: 3 }; assert.deepStrictEqual(keysOf(noMem), ['lastTime', 'generic'], 'a veteran without mem');
  assert.deepStrictEqual(keysOf(played(2)), ['generic'], 'no mem and no last');
  const tomorrow = ev(s, [['h', 'g2add', 3, -1]]); tomorrow.prog.g2add = [[0, 0, 0], [0, 0, 0], [1, 1, 1]];
  assert.deepStrictEqual(keysOf(tomorrow).filter(k => k !== 'generic' && k !== 'bridgeNear'), ['lastTime'], 'the clock moved back: nothing dated'); assert.strictEqual(L.memFacts(tomorrow, TODAY).gap, null);
  assert.deepStrictEqual(keysOf(s, 'garbage').filter(k => /yesterday|sameDay|away|doneLast/.test(k)), []);
  const all = keysOf(s); assert.strictEqual(all[all.length - 1], 'generic');
  // 10. the order when several things are true: hero, bridgeReady, goal, the day line, the greetings
  let o = tileDone(L, tileDone(L, played(2), 'g2add'), 'g2sub'); o.boss.g2add[2] = true; o.owned = [5, heroA]; o.last = { t: 'g2sub', l: L.TOPICS.find(x => x.id === 'g2sub').levels.length };
  o = L.setGoal(o, item.id); o.coins = item.price + 5; o = ev(o, [['p', 'g2sub', o.last.l, 1], ['b', 'g2add', 2, 1]]);
  assert.deepStrictEqual(keysOf(o), ['hero', 'bridgeReady', 'goal', 'yesterday', 'generic']);
  // 11. the first exercise of a stage
  s = played(2); s.prog.g2add = [[0, 0, 0], [0, 0, 0], [3, 1, 2], [3, 0, 0]];
  assert.strictEqual(L.stageMemo(s, 'g2add', 3, 1), 'again'); assert.strictEqual(L.stageMemo(s, 'g2add', 3, 2), 'again');
  assert.strictEqual(L.stageMemo(s, 'g2add', 3, 0), null, 'three stars: nothing to say'); assert.strictEqual(L.stageMemo(s, 'g2add', 4, 1), null, 'never played');
  s.hists.g2add = [true, true, true, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4, 1), 'run5'); assert.strictEqual(L.stageMemo(s, 'g2add', 3, 1), 'again', 'again comes first');
  s.hists.g2add = [true, true, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4, 1), null); s.hists.g2add = [true, true, false, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4, 1), null);
  // 12. the journal
  let j = L.journal(L.newState(2));
  assert.strictEqual(j.pages.length, 1); assert.deepStrictEqual(J6(j.pages[0].stamps), []); assert.deepStrictEqual(J6(j.pages[0].cards), []); assert(j.pages[0].next && j.pages[0].next.stage === 0); assert.deepStrictEqual(J6(j.recent), []);
  s = houseOf(L, played(2), 'g2add', 3); s = L.finishStage(s, 'g2add', 4, 0, [true]).state; s = L.finishStage(s, 'g2add', 4, 1, [true]).state; s.last = { t: 'g2add', l: 4 };
  j = L.journal(s); let pg = Array.from(j.pages).find(x => x.t === 'g2add');
  assert.deepStrictEqual(J6(pg.stamps), [{ l: 3, stars: 9, d: '' }], 'one stamp; a house with two stages is not a stamp; no date without an event'); assert.deepStrictEqual(J6(pg.next), { level: 4, stage: 2 });
  s.prog.g2add[2] = [1, 2, 3]; assert.strictEqual(Array.from(L.journal(s).pages).find(x => x.t === 'g2add').stamps[0].stars, 6);
  s = ev(s, [['h', 'g2add', 3, 4], ['p', 'g2add', 4, 4]]);
  assert.strictEqual(Array.from(L.journal(s).pages).find(x => x.t === 'g2add').stamps[0].d, dago(4)); assert.deepStrictEqual(J6(L.journal(s).recent), [{ k: 'h', t: 'g2add', l: 3, d: dago(4) }]);
  s.boss.g2add[2] = true; s = ev(s, [['b', 'g2add', 2, 2]]); s.prog.g3mul = [[1, 1, 1]]; // a bridge, and a house in a tile of another grade
  j = L.journal(s); pg = Array.from(j.pages).find(x => x.t === 'g2add');
  assert.deepStrictEqual(J6(pg.cards), [{ g: 2, hero: heroA, d: dago(2) }]); assert.strictEqual(J6(j.recent)[0].k, 'b'); assert.strictEqual(j.recent[0].hero, heroA); assert.strictEqual(j.recent.length, 2);
  assert(Array.from(j.pages).some(x => x.t === 'g3mul' && x.stamps.length === 1), 'a tile of another grade with progress has its page');
  assert.strictEqual(Array.from(j.pages).filter(x => x.next).length, 1, 'only one open slot in the whole journal');
  const ids = Array.from(j.pages).map(x => x.t); assert.strictEqual(new Set(ids).size, ids.length); assert(ids.indexOf('g2add') < ids.indexOf('g3mul'), 'the tiles of the grade come first');
  assert.strictEqual(j.friend.level, L.friend(s).level); assert.deepStrictEqual(J6(j.journey), J6(L.journey(s)));
  const fin = JSON.stringify(s); L.journal(s); L.memTriggers(s, TODAY); L.memFacts(s, TODAY); L.friend(s); assert.strictEqual(JSON.stringify(s), fin, 'pure');
});
t('memory: every line is vocalised, has no feminine form left for a boy, and says nothing about being away', () => {
  const lines = [], M = L.MEMO, HEBW = /[א-ת][֑-ׇא-ת]*/g, bare = x => x.replace(/[֑-ׇ]/g, '');
  Object.keys(M).forEach(k => { if (k === 'unlock') Object.keys(M.unlock).forEach(n => lines.push(M.unlock[n])); else { assert.strictEqual(M[k].length, 2, k + ': two voices'); Array.from(M[k]).forEach(v => { assert(v.length >= 1); Array.from(v).forEach(x => lines.push(x)); }); } });
  assert(lines.length >= 120, 'lines: ' + lines.length);
  const word = f => new RegExp('(^|[^֐-׿])' + f + '(?![֐-׿])');
  lines.forEach(x => {
    (x.replace(/\{[A-Z]\}/g, ' ').match(HEBW) || []).forEach(w => assert(/[֑-ׇ]/.test(w), 'no niqqud: ' + w + ' in ' + x));
    const boy = L.forBoy(x);
    Array.from(L.MALE).forEach(p => assert(!word(p[0]).test(boy), 'feminine form left for a boy: ' + p[0] + ' in ' + x));
    if (/בּוֹאִי|שֶׁלָּךְ/.test(x)) assert.notStrictEqual(boy, x, x);
    assert(!word('לָךְ').test(x) && !/הִתְגַּעְגַּעְ|חִכִּיתִי|אֵיפֹה הָיִי|סוֹף סוֹף/.test(x), x);
    assert(!/התגעגע|חיכיתי|חכיתי|איפה היי|סוף סוף|מזמן|הרבה זמן|נעלמת|שכחת(?!י)|חזרת(?!י)|סוף־סוף/.test(bare(x)), 'about being away: ' + x);
    assert(!/טָעֻיּוֹת|הֻשַּׂג|נִעְנוּעַ/.test(x), 'a word whose niqqud is not certain: ' + x);
    assert(!/\{[^HPTIWNM]\}|\{[A-Z][^}]/.test(x), x);
  });
  // a child who comes back after days: warm, about the camp and the map, never about the days or the child
  [0, 1].forEach(v => Array.from(M.away[v]).concat(Array.from(M.lastTime[v])).forEach(x => { assert(!/\d|יָמִים|יוֹם|זְמַן|מְחַכֶּה|חִכָּ/.test(x), 'away: ' + x); assert(!/{[WTINM]}/.test(x), x); }));
  // slots: every line of a trigger comes out whole
  const s = L.newState(2); s.rounds = 5; s.stars = 4; s.last = { t: 'g2add', l: 3 };
  const item = L.ITEMS.find(x => x.price), heroA = L.heroId('g2add', 2), house = L.TOPICS.find(x => x.id === 'g2add').levels[2].name;
  const trig = { yesterday: { place: s.last }, sameDay: { place: s.last, salt: 0 }, lastTime: { place: s.last }, away: { place: s.last }, doneLast: { place: s.last, yest: true }, hero: { hero: heroA }, bridgeReady: {}, bridgeNear: { place: s.last }, goal: { item: item } };
  [2, 4].forEach(g => { s.grade = g; Object.keys(trig).forEach(k => {
    const tg = Object.assign({ key: k }, trig[k]), day = /^(yesterday|sameDay|lastTime|away)$/.test(k);
    const seen = new Set(); for (let d0 = 0; d0 < 14; d0++) Array.from(L.memLines(s, tg, dago(d0))).forEach(x => seen.add(x));
    assert.strictEqual(seen.size, M[k][g >= 3 ? 1 : 0].length, k + ' grade ' + g + ': every variant is reachable');
    assert.strictEqual(L.memLines(s, tg, TODAY).length, day ? 1 : M[k][0].length);
    seen.forEach(x => assert(!/[{}]|undefined|null/.test(x), x));
  }); });
  s.grade = 2;
  assert(Array.from(L.memLines(s, { key: 'hero', hero: heroA }, TODAY)).every(x => x.indexOf(L.trollFromId(heroA).name) >= 0));
  assert(Array.from(L.memLines(s, { key: 'goal', item: item }, TODAY)).some(x => x.indexOf(item.name) >= 0));
  assert(Array.from(L.memLines(s, { key: 'doneLast', place: s.last, yest: false }, TODAY)).some(x => x.indexOf('בַּפַּעַם הַקּוֹדֶמֶת') === 0));
  assert.deepStrictEqual(Array.from(L.memLines(s, { key: 'generic' }, TODAY)), []); assert.deepStrictEqual(Array.from(L.memLines(s, { key: 'first' }, TODAY)), []); assert.deepStrictEqual(Array.from(L.memLines(s, { key: 'unlock' }, TODAY)), []);
  // a line that needs a house it does not have is skipped (away without a place: one of the lines without a house)
  for (let d0 = 0; d0 < 7; d0++) { const x = L.memLines(s, { key: 'away' }, dago(d0)); assert.strictEqual(x.length, 1); assert(!/undefined|[{}]/.test(x[0])); }
  assert.deepStrictEqual(Array.from(L.memLines(s, { key: 'yesterday' }, TODAY)), [], 'no place: nothing to say');
  // the place phrase: the house by its name; a name of more than 24 letters gives way to the region
  const long = []; L.TOPICS.forEach(tp => tp.levels.forEach((d, i) => { if (bare(d.name).length > 24) long.push([tp, i + 1]); }));
  assert(long.length >= 1);
  const y0 = Array.from(M.yesterday[0]).findIndex(x => x === 'אֶתְמוֹל עָצַרְנוּ {P}. מַמְשִׁיכִים בַּדֶּרֶךְ!'); assert(y0 >= 0);
  const dayFor = i => { for (let d0 = 0; d0 < 7; d0++) if ((L.dayNum(dago(d0)) % 7) === i) return dago(d0); };
  assert.strictEqual(L.memLines(s, { key: 'yesterday', place: s.last }, dayFor(y0))[0], 'אֶתְמוֹל עָצַרְנוּ בַּבַּיִת "' + house + '". מַמְשִׁיכִים בַּדֶּרֶךְ!');
  assert.strictEqual(L.memLines(s, { key: 'yesterday', place: { t: long[0][0].id, l: long[0][1] } }, dayFor(y0))[0], 'אֶתְמוֹל עָצַרְנוּ בָּאֵזוֹר "' + long[0][0].world + '". מַמְשִׁיכִים בַּדֶּרֶךְ!');
  // 14. daily play: seven days in a row, seven different "yesterday" lines, in both voices; the same day gives the same line
  [2, 4].forEach(g => { s.grade = g; const week = []; for (let d0 = 0; d0 < 7; d0++) week.push(L.memLines(s, { key: 'yesterday', place: s.last }, dago(d0))[0]);
    assert.strictEqual(new Set(week).size, 7, 'grade ' + g); assert.strictEqual(L.memLines(s, { key: 'yesterday', place: s.last }, dago(3))[0], week[3]); });
  s.grade = 2;
  // the same day: the line moves on as the day goes on (salt = number of events), and the flag line needs a flag from today
  const flagLine = M.sameDayFlag[0][0], sd = new Set(), sdf = new Set();
  for (let k = 0; k < 14; k++) { sd.add(L.memLines(s, { key: 'sameDay', place: s.last, salt: k }, TODAY)[0]); sdf.add(L.memLines(s, { key: 'sameDay', place: s.last, salt: k, flag: true }, TODAY)[0]); }
  assert.strictEqual(sd.size, 6); assert(!sd.has(flagLine)); assert.strictEqual(sdf.size, 7); assert(sdf.has(flagLine));
  // the greetings of the camp grow with the friendship: jokes from level 3, the team from 5, the look back from 6
  const withPts = (h, b) => { const x = L.newState(2); let n = 0; L.TOPICS.forEach(tp => { x.prog[tp.id] = tp.levels.map(() => (n++ < h ? [1, 1, 1] : [0, 0, 0])); }); let q = 0; L.TOPICS.forEach(tp => { if (q++ < b) x.boss[tp.id][2] = true; }); return x; };
  const F = L.FRIEND;
  assert.deepStrictEqual(Array.from(L.friendLines(withPts(F[2] - 1, 0))), []); assert.strictEqual(L.friendLines(withPts(F[2], 0)).length, 3); const g4 = withPts(F[2], 0); g4.grade = 4; assert.strictEqual(L.friendLines(g4).length, 4);
  assert.strictEqual(L.friendLines(withPts(F[4], 0)).length, 5); assert(Array.from(L.friendLines(withPts(F[4], 0))).some(x => x.indexOf(String(F[4]) + ' דְּגָלִים') >= 0));
  assert.strictEqual(L.friendLines(withPts(F[5], 0)).length, 6, 'without two bridges the line that counts them is not said');
  const fl = Array.from(L.friendLines(withPts(F[5] - 4, 2))); assert.strictEqual(fl.length, 7); assert(fl.some(x => x.indexOf((F[5] - 4) + ' בָּתִּים וְ-2 גְּשָׁרִים') === 0)); fl.forEach(x => assert(!/[{}]|undefined/.test(x)));
  assert.deepStrictEqual(Object.keys(M.unlock), ['2', '3', '4', '5', '6']);
});
t('cloud: a save that lands while the cloud is being fetched cannot beat newer progress in the cloud', () => {
  // syncNow decides with the live number after the request: the save raised it by one, the cloud is five ahead
  const id = 'p111111111', list = [{ id: id, name: 'a' }], cloud = { list: list, gone: [], n: { [id]: 25 }, t: { [id]: 700 }, st: { [id]: '25:700|700' }, has: { [id]: true } };
  const dev = (n, t, d) => ({ list: list, gone: [], n: { [id]: n }, t: { [id]: t }, b: { [id]: '20:500|500' }, d: d ? { [id]: 1 } : {}, has: { [id]: true } });
  let m = L.mergeCloud(dev(21, 900, true), cloud); // the child tapped "continue" during the fetch: save() -> touch(); the later time decides nothing
  assert.deepStrictEqual(Array.from(m.pull), [id]); assert.deepStrictEqual(Array.from(m.push), []); assert.strictEqual(m.n[id], 25);
  // progress that outranks the cloud (more saves since the base) is still pushed, above the number of the cloud
  m = L.mergeCloud(dev(27, 100, true), cloud); assert.deepStrictEqual(Array.from(m.push), [id]); assert.strictEqual(m.n[id], 27);
  // and when the cloud copy is the one this device last saw, the save is simply pushed
  m = L.mergeCloud(dev(21, 900, true), Object.assign({}, cloud, { n: { [id]: 20 }, t: { [id]: 500 }, st: { [id]: '20:500|500' } }));
  assert.deepStrictEqual(Array.from(m.push), [id]); assert.strictEqual(m.n[id], 21);
});
t('cloud: boy or girl changed on a player card travels (the newer card wins), progress is still decided by its own times', () => {
  const j = x => JSON.parse(JSON.stringify(x)), id = 'p111111111', id2 = 'p222222222';
  // prof keeps a change time only when it is a real, positive number
  assert.strictEqual(L.loadProfiles({ list: [{ id: id, name: 'a', sex: 'm', mt: 50 }] }).list[0].mt, 50);
  ['x', -1, 0, NaN, null, '50', Infinity].forEach(v => assert(!('mt' in L.loadProfiles({ list: [{ id: id, name: 'a', mt: v }] }).list[0]), 'mt ' + v));
  assert.deepStrictEqual(j(L.loadProfiles(JSON.stringify({ cur: id, list: [{ id: id, name: 'a', sex: 'f' }] }))), { cur: id, list: [{ id: id, name: 'a', sex: 'f' }] }, 'a saved list without the field loads as before');
  // this device changed the card: the cloud gets it, and the progress times decide nothing here
  const both = { [id]: true, [id2]: true }, st7 = { [id]: '7:7|7', [id2]: '7:7|7' };
  const cloud = { list: [{ id: id, name: 'a', sex: 'f' }, { id: id2, name: 'b', sex: 'f' }], gone: [], n: { [id]: 7, [id2]: 7 }, t: { [id]: 7, [id2]: 7 }, st: st7, has: both };
  const mine = { list: [{ id: id, name: 'a', sex: 'm', mt: 50 }, { id: id2, name: 'b', sex: 'f' }], gone: [], n: { [id]: 3, [id2]: 7 }, t: { [id]: 3, [id2]: 7 }, b: { [id]: '3:3|3', [id2]: '7:7|7' }, has: both };
  let m = j(L.mergeCloud(mine, cloud));
  assert.deepStrictEqual(m.list, [{ id: id, name: 'a', sex: 'm', mt: 50 }, { id: id2, name: 'b', sex: 'f' }]);
  assert(m.meta, 'the list is written to the cloud'); assert.deepStrictEqual(m.pull, [id], 'the progress of the cloud is newer and is still pulled'); assert.deepStrictEqual(m.push, []);
  // the other device (old card, no time) pulls it and writes nothing
  const cloud2 = Object.assign({}, cloud, { list: m.list });
  m = j(L.mergeCloud({ list: cloud.list, gone: [], n: cloud.n, t: cloud.t, b: st7, has: both }, cloud2));
  assert.strictEqual(m.list[0].sex, 'm'); assert.strictEqual(m.list[0].mt, 50); assert(!m.meta); assert.deepStrictEqual(m.pull.concat(m.push), []);
  // an older change here loses to a newer one in the cloud; equal times: the cloud wins, as it always did
  m = j(L.mergeCloud({ list: [{ id: id, name: 'a', sex: 'f', mt: 40 }], gone: [], t: {} }, { list: [{ id: id, name: 'a', sex: 'm', mt: 50 }], gone: [], t: {} }));
  assert.strictEqual(m.list[0].sex, 'm'); assert(!m.meta);
  m = j(L.mergeCloud({ list: [{ id: id, name: 'a', sex: 'f', mt: 50 }], gone: [], t: {} }, { list: [{ id: id, name: 'a', sex: 'm', mt: 50 }], gone: [], t: {} }));
  assert.strictEqual(m.list[0].sex, 'm'); assert(!m.meta);
  // old data on both sides (no time anywhere): the cloud wins and nothing is written
  m = j(L.mergeCloud({ list: [{ id: id, name: 'a', sex: 'm' }], gone: [], n: { [id]: 9 }, t: { [id]: 9 }, b: { [id]: '9:9|9' }, has: { [id]: true } }, { list: [{ id: id, name: 'a', sex: 'f' }], gone: [], n: { [id]: 9 }, t: { [id]: 9 }, st: { [id]: '9:9|9' }, has: { [id]: true } }));
  assert.deepStrictEqual(m.list, [{ id: id, name: 'a', sex: 'f' }]); assert(!m.meta);
  // an older page rewrote the list without the time: the device that made the change wins again and puts it back
  m = j(L.mergeCloud(mine, Object.assign({}, cloud, { list: [{ id: id, name: 'a', sex: 'm' }, { id: id2, name: 'b', sex: 'f' }] })));
  assert.strictEqual(m.list[0].mt, 50); assert(m.meta);
  // a deleted player stays deleted, whatever time the card carries, on either side
  m = j(L.mergeCloud({ list: [{ id: id, name: 'a', sex: 'm', mt: Date.now(), mn: 99 }], gone: [], n: { [id]: 1e6 }, t: { [id]: Date.now() }, d: { [id]: 1 }, has: { [id]: true } }, { list: [{ id: id2, name: 'b' }], gone: [id], t: {} }));
  assert.deepStrictEqual(m.list.map(p => p.id), [id2]); assert.deepStrictEqual(m.gone, [id]); assert.deepStrictEqual(m.push.concat(m.pull), []);
  m = j(L.mergeCloud({ list: [{ id: id, name: 'a', sex: 'm', mt: 50 }], gone: [id], t: {} }, { list: [{ id: id, name: 'a', sex: 'f', mt: 90 }], gone: [], n: { [id]: 5 }, t: { [id]: 5 }, st: { [id]: '5:5|5' }, has: { [id]: true } }));
  assert.deepStrictEqual(m.list, []); assert(m.meta); assert.deepStrictEqual(m.push.concat(m.pull), []);
  // the order of the players stays the cloud's, a player that only this device has is added after them, at most 8
  m = j(L.mergeCloud({ list: [{ id: 'p333333333', name: 'c' }, { id: id2, name: 'b', sex: 'm', mt: 9 }], gone: [], t: {} }, cloud));
  assert.deepStrictEqual(m.list.map(p => p.id), [id, id2, 'p333333333']); assert.strictEqual(m.list[1].sex, 'm');
});
console.log('all ' + n + ' passed (players)');

// ---- sync by a running number per player (docs/prompts/sync-rev-spec.md) ----
{
  const j = x => JSON.parse(JSON.stringify(x)), id = 'p111111111', id2 = 'p222222222', card = [{ id: id, name: 'a' }];
  // one player on both sides: dev(number, time, base stamp, dirty), cl(number, time) is a numbered cloud copy
  const dev = (nn, tt, b, d, o) => Object.assign({ list: card, gone: [], n: { [id]: nn }, t: { [id]: tt }, b: b ? { [id]: b } : {}, d: d ? { [id]: 1 } : {}, has: { [id]: true } }, o || {});
  const cl = (nn, tt, o) => Object.assign({ list: card, gone: [], n: { [id]: nn }, t: { [id]: tt }, st: { [id]: L.stampOf(nn + ':' + tt, tt) }, has: { [id]: true } }, o || {});
  const act = m => m.pull.indexOf(id) >= 0 ? 'pull' : m.push.indexOf(id) >= 0 ? 'push' : 'none';
  const st = (xp, rounds, coins) => { const s = j(L.newState(2)); s.xp = xp; s.rounds = rounds; s.coins = coins || 0; return L.loadState(JSON.stringify(s)); };
  t('sync number: the first number comes from the progress, the number of a cloud copy, its stamp', () => {
    assert.strictEqual(L.revSeed(L.newState(2)), 1); assert.strictEqual(L.revSeed(st(40, 7)), 48);
    assert.strictEqual(L.revSeed(null), 1); assert.strictEqual(L.revSeed({ xp: 'x', rounds: -3 }), 1);
    assert.strictEqual(L.revSeed(L.loadState({ v: 4, grade: 2, stars: 10 })), 31, 'a player from before the points: the estimate of loadState');
    assert.strictEqual(L.cloudNum('12:500', '500', st(40, 7)), 12, 'numbered: the number, whatever the progress says');
    assert.strictEqual(L.cloudNum('12:500', 500, st(40, 7)), 12);
    assert.strictEqual(L.cloudNum('12:500', '900', st(2, 0)), 13, 'an older page wrote over it: one more than the number it left behind');
    assert.strictEqual(L.cloudNum('12:500', '900', st(40, 7)), 48, '... or the seed of the new progress when that is higher');
    assert.strictEqual(L.cloudNum('', '900', st(40, 7)), 48, 'only a time: the seed');
    [undefined, null, 'x', '12', '12:', ':5', '-1:500', '1.5:500', '12:500:1', 12].forEach(r => assert.strictEqual(L.cloudNum(r, '500', st(40, 7)), 48, 'garbage ' + r));
    assert.strictEqual(L.stampOf('12:500', '500'), '12:500|500'); assert.strictEqual(L.stampOf('', 500), '|500'); assert.strictEqual(L.stampOf(undefined, 500), '|500');
    assert.notStrictEqual(L.stampOf('12:500', '500'), L.stampOf('12:500', '900'), 'a write by an older page changes the stamp');
  });
  t('sync number: the decision table, one row at a time', () => {
    let m;
    // 1. deleted in the cloud: the deletion wins even over a dirty device far ahead
    m = j(L.mergeCloud(dev(999, 9e15, '5:5|5', true), { list: [], gone: [id] }));
    assert.deepStrictEqual([m.list, m.gone, m.pull, m.push, m.meta], [[], [id], [], [], false], 'row 1');
    // 2. deleted on this device: gone and list are written, the player is neither pulled nor pushed
    m = j(L.mergeCloud(dev(3, 3, '', false, { gone: [id] }), cl(50, 50)));
    assert.deepStrictEqual([m.list, m.gone, m.pull, m.push, m.meta], [[], [id], [], [], true], 'row 2');
    // 3. removed from this device only: nothing, and nothing is written
    m = j(L.mergeCloud({ list: [], gone: [], hide: [id] }, cl(50, 50)));
    assert.deepStrictEqual([m.list.map(p => p.id), m.pull, m.push, m.meta], [[id], [], [], false], 'row 3');
    // 4. a card without progress anywhere
    m = j(L.mergeCloud({ list: card, gone: [] }, { list: card, gone: [] })); assert.strictEqual(act(m), 'none', 'row 4'); assert(!m.meta);
    // 5. the cloud has progress, the device has none (new device, storage cleared): pull, never push
    m = j(L.mergeCloud({ list: [], gone: [] }, cl(7, 70))); assert.strictEqual(act(m), 'pull', 'row 5'); assert.strictEqual(m.n[id], 7); assert(!m.meta);
    m = j(L.mergeCloud({ list: card, gone: [], n: { [id]: 999 }, t: { [id]: 9e15 }, d: { [id]: 1 }, b: { [id]: '7:70|70' } }, cl(7, 70)));
    assert.strictEqual(act(m), 'pull', 'row 5: a card and a number without progress still only pull'); assert.deepStrictEqual(m.push, []);
    // 6. the device has progress, the cloud has none (also: no document)
    m = j(L.mergeCloud(dev(4, 40), { list: card, gone: [] })); assert.strictEqual(act(m), 'push', 'row 6'); assert.strictEqual(m.n[id], 4);
    m = j(L.mergeCloud(dev(4, 40), null)); assert.strictEqual(act(m), 'push', 'row 6, no document'); assert(m.meta);
    // 7. the cloud copy is the one this device last saw, nothing saved since
    m = j(L.mergeCloud(dev(7, 70, '7:70|70'), cl(7, 70))); assert.strictEqual(act(m), 'none', 'row 7'); assert(!m.meta); assert.deepStrictEqual(m.n, {});
    // 8. ... and something was saved: push, with a number above the cloud's
    m = j(L.mergeCloud(dev(8, 80, '7:70|70', true), cl(7, 70))); assert.strictEqual(act(m), 'push', 'row 8'); assert.strictEqual(m.n[id], 8);
    m = j(L.mergeCloud(dev(7, 80, '7:70|70', true), cl(7, 70))); assert.strictEqual(m.n[id], 8, 'row 8: the pushed number is max(own, cloud + 1)');
    m = j(L.mergeCloud(dev(12, 80, '7:70|70', true), cl(7, 70))); assert.strictEqual(m.n[id], 12);
    // 9. another copy in the cloud, ranked higher or a full tie: pull, clean or dirty
    m = j(L.mergeCloud(dev(7, 70, '7:70|70'), cl(9, 90))); assert.strictEqual(act(m), 'pull', 'row 9 clean'); assert.strictEqual(m.n[id], 9);
    m = j(L.mergeCloud(dev(8, 80, '7:70|70', true), cl(9, 60))); assert.strictEqual(act(m), 'pull', 'row 9 dirty: the play since the base is lost, fewer saves');
    m = j(L.mergeCloud(dev(9, 80, '7:70|70', true), cl(9, 90))); assert.strictEqual(act(m), 'pull', 'row 9: equal numbers, the later time is the cloud');
    m = j(L.mergeCloud(dev(9, 90, '7:70|70', true), cl(9, 90))); assert.strictEqual(act(m), 'pull', 'row 9: a full tie with another stamp goes to the cloud');
    m = j(L.mergeCloud(dev(9, 90), cl(9, 90))); assert.strictEqual(act(m), 'pull', 'row 9: no base at all, a full tie');
    // 10. another copy in the cloud, the device ranks higher: push, clean or dirty
    m = j(L.mergeCloud(dev(11, 10, '7:70|70', true), cl(9, 90))); assert.strictEqual(act(m), 'push', 'row 10 dirty'); assert.strictEqual(m.n[id], 11);
    m = j(L.mergeCloud(dev(11, 10, '7:70|70'), cl(9, 90))); assert.strictEqual(act(m), 'push', 'row 10 clean: a lower number in the cloud is never a reason to pull');
    m = j(L.mergeCloud(dev(9, 91, '7:70|70', true), cl(9, 90))); assert.strictEqual(act(m), 'push', 'row 10: equal numbers, the later time is the device'); assert.strictEqual(m.n[id], 10, 'and the pushed number goes above the cloud');
    // rows 5-10 run only for players of the merged list (cloud first, then the device, at most 8)
    const many = []; for (let i = 0; i < 8; i++) many.push({ id: 'p90000000' + i, name: 'x' });
    m = j(L.mergeCloud(dev(5, 5), { list: many, gone: [] })); assert.deepStrictEqual(m.push, [], 'a ninth player is not written');
    // two players are decided separately
    m = j(L.mergeCloud({ list: card.concat([{ id: id2, name: 'b' }]), gone: [], n: { [id]: 3, [id2]: 30 }, t: {}, has: { [id]: true, [id2]: true } },
      { list: card.concat([{ id: id2, name: 'b' }]), gone: [], n: { [id]: 5, [id2]: 20 }, t: { [id]: 1, [id2]: 1 }, st: { [id]: '5:1|1', [id2]: '20:1|1' }, has: { [id]: true, [id2]: true } }));
    assert.deepStrictEqual([m.pull, m.push, m.n], [[id], [id2], { [id]: 5, [id2]: 30 }]);
  });
  t('sync number: a device clock that is years wrong decides nothing when the numbers differ', () => {
    const YEAR = 365 * 864e5, now = 1795000000000;
    [1, now - 10 * YEAR, now, now + 10 * YEAR].forEach(dt => [1, now - 10 * YEAR, now, now + 10 * YEAR].forEach(ct => [false, true].forEach(dirty => {
      const what = ' device clock ' + dt + ' cloud clock ' + ct + (dirty ? ' dirty' : '');
      assert.strictEqual(act(L.mergeCloud(dev(8, dt, '7:70|70', dirty), cl(9, ct))), 'pull', 'lower number pulls,' + what);
      assert.strictEqual(act(L.mergeCloud(dev(10, dt, '7:70|70', dirty), cl(9, ct))), 'push', 'higher number pushes,' + what);
      assert.strictEqual(act(L.mergeCloud(dev(10, dt, '', dirty), cl(9, ct))), 'push', 'no base,' + what);
      assert.strictEqual(act(L.mergeCloud({ list: card, gone: [], t: { [id]: dt } }, cl(9, ct))), 'pull', 'no local progress,' + what);
      assert.strictEqual(act(L.mergeCloud(dev(1, dt, '', dirty), { list: card, gone: [] })), 'push', 'nothing in the cloud,' + what);
      if (dirty) assert.strictEqual(act(L.mergeCloud(dev(10, dt, L.stampOf('9:' + ct, ct), true), cl(9, ct))), 'push', 'same base,' + what);
    })));
  });
  t('sync number: the first sync after the update (no numbers stored anywhere) keeps the more advanced copy', () => {
    // both sides are seeded from their progress: the device from its saved state, the cloud copy (only s3 and t3) by cloudNum
    const first = (ds, dt, cs, ct, r3) => L.mergeCloud(dev(L.revSeed(ds), dt), { list: card, gone: [], n: { [id]: L.cloudNum(r3 || '', ct, cs) }, t: { [id]: ct }, st: { [id]: L.stampOf(r3 || '', ct) }, has: { [id]: true } });
    let m = first(st(40, 7), 500, st(40, 7), 500); // device and cloud agree: a full tie, the client sees equal states and only sets the base
    assert.strictEqual(act(m), 'pull'); assert.strictEqual(m.n[id], 48); assert(!m.meta);
    m = first(st(40, 7), 500, st(46, 8), 900); assert.strictEqual(act(m), 'pull', 'the cloud is newer and more advanced');
    m = first(st(40, 7, 10), 500, st(40, 7, 90), 900); assert.strictEqual(act(m), 'pull', 'the cloud is newer, same points (coins were spent): the later time');
    m = first(st(46, 8), 900, st(40, 7), 500); assert.strictEqual(act(m), 'push', 'the device is newer and more advanced'); assert.strictEqual(m.n[id], 55);
    m = first(st(40, 7, 90), 900, st(40, 7, 10), 500); assert.strictEqual(act(m), 'push', 'the device is newer, same points'); assert.strictEqual(m.n[id], 49, 'written above the seed of the cloud');
    m = first(st(80, 12), 500, st(44, 8), 900); assert.strictEqual(act(m), 'push', 'both played: more solved exercises win against a later clock');
    m = first(st(44, 8), 900, st(80, 12), 500); assert.strictEqual(act(m), 'pull', 'both played: the device with the later clock and less progress is overwritten');
    // an older cached page wrote s3/t3 over a numbered copy (r3 still says 60:500, t3 is now 900)
    const oldPage = (nn, b, d, cs) => L.mergeCloud(dev(nn, 600, b, d), { list: card, gone: [], n: { [id]: L.cloudNum('60:500', 900, cs) }, t: { [id]: 900 }, st: { [id]: L.stampOf('60:500', 900) }, has: { [id]: true } });
    m = oldPage(60, '60:500|500', false, st(50, 9)); assert.strictEqual(act(m), 'pull', 'a clean device takes what the older page wrote'); assert.strictEqual(m.n[id], 61);
    m = oldPage(61, '60:500|500', true, st(50, 9)); assert.strictEqual(act(m), 'pull', 'one save against the write of the older page: equal numbers, the later time');
    m = oldPage(64, '60:500|500', true, st(50, 9)); assert.strictEqual(act(m), 'push', 'a device with more saves since the base outranks it'); assert.strictEqual(m.n[id], 64);
    m = oldPage(64, '60:500|500', true, st(90, 9)); assert.strictEqual(act(m), 'pull', 'unless the older page carried much more progress (its seed)'); assert.strictEqual(m.n[id], 100);
  });
  t('sync number: the card of a player has its own number (then the time, then the cloud)', () => {
    const c = (sex, mn, mt) => { const o = { id: id, name: 'a', sex: sex }; if (mt) o.mt = mt; if (mn) o.mn = mn; return o; };
    const pick = (mine, cloud) => j(L.mergeCloud({ list: [mine], gone: [] }, { list: [cloud], gone: [] }));
    let m = pick(c('m', 2, 10), c('f', 1, 99)); assert.strictEqual(m.list[0].sex, 'm', 'the higher number wins against a later time'); assert(m.meta);
    m = pick(c('m', 1, 99), c('f', 2, 10)); assert.strictEqual(m.list[0].sex, 'f'); assert(!m.meta);
    m = pick(c('m', 2, 50), c('f', 2, 40)); assert.strictEqual(m.list[0].sex, 'm', 'equal numbers: the later time'); assert(m.meta);
    m = pick(c('m', 2, 50), c('f', 2, 50)); assert.strictEqual(m.list[0].sex, 'f', 'a full tie: the cloud'); assert(!m.meta);
    m = pick(c('m', 1, 5), c('f', 0, 99)); assert.strictEqual(m.list[0].sex, 'm', 'a card that an older page rewrote without the number loses to the device that changed it'); assert(m.meta);
    m = pick(c('m', 0, 50), c('f', 0, 40)); assert.strictEqual(m.list[0].sex, 'm', 'cards from before the number: the time decides, as it did');
    assert.strictEqual(L.loadProfiles({ list: [c('m', 3, 50)] }).list[0].mn, 3);
    ['x', -1, 0, 0.5, 2.5, NaN, null, '3', Infinity].forEach(v => assert(!('mn' in L.loadProfiles({ list: [{ id: id, name: 'a', mn: v }] }).list[0]), 'mn ' + v));
    const P = { cur: id, list: [c('f', 4, 77)] };
    assert.deepStrictEqual(j(L.loadProfiles(JSON.stringify(P))), P, 'saved and loaded');
    assert.deepStrictEqual(j(L.loadProfiles(JSON.stringify(L.loadProfiles(JSON.stringify(P))))), P);
  });
  t('sync number: devices that take turns lose nothing; nobody writes over a copy it has not read; a cleared device only pulls', () => {
    // A small model of the client around mergeCloud: the cloud holds { n, t, state } of one player, a device its copy, number, base and dirty mark.
    let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let run = 0; run < 300; run++) {
      let cloud = null, clock = 1000, serial = 0; const turns = run % 2 === 0; // even runs: one device plays at a time and syncs before and after
      const devs = [0, 1, 2].map(i => ({ state: null, n: 0, t: 0, b: '', d: false, skew: (i - 1) * 9e11 })); // clocks 28 years apart
      const side = c => c && { list: card, gone: [], n: { [id]: c.n }, t: { [id]: c.t }, st: { [id]: L.stampOf(c.n + ':' + c.t, c.t) }, has: { [id]: true } };
      const wipe = d => { d.state = null; d.n = 0; d.t = 0; d.b = ''; d.d = false; };
      const sync = d => {
        const before = cloud && JSON.stringify(cloud);
        const m = L.mergeCloud({ list: d.state !== null ? card : [], gone: [], n: { [id]: d.n }, t: { [id]: d.t }, b: { [id]: d.b }, d: d.d ? { [id]: 1 } : {}, has: d.state !== null ? { [id]: true } : {} }, side(cloud));
        assert(!(m.pull.length && m.push.length));
        if (m.pull.length) { assert(cloud); d.state = cloud.state; d.n = m.n[id]; d.t = cloud.t; d.b = L.stampOf(cloud.n + ':' + cloud.t, cloud.t); d.d = false; assert.strictEqual(JSON.stringify(cloud), before, 'a pull writes nothing'); }
        if (m.push.length) {
          assert(d.state !== null, 'a device without progress never pushes');
          if (cloud) assert(m.n[id] > cloud.n, 'the number in the cloud only grows');
          if (cloud && turns) assert(d.state.indexOf(cloud.state) === 0, 'taking turns: the pushed progress contains everything the cloud had');
          const tt = Math.max(clock + d.skew, cloud ? cloud.t + 1 : 0, d.t); if (cloud) assert(tt > cloud.t, 'the time of the write grows too (older pages compare it)');
          cloud = { n: m.n[id], t: tt, state: d.state }; d.n = m.n[id]; d.t = tt; d.b = L.stampOf(d.n + ':' + tt, tt); d.d = false;
        }
        if (cloud) assert.strictEqual(d.state, cloud.state, 'after a sync the device holds the copy of the cloud');
      };
      const save = d => { if (d.state === null) d.state = ''; d.state += '.' + (++serial); d.n = (d.n || 1) + 1; d.t = Math.max(clock + d.skew, d.t + 1); d.d = true; };
      for (let step = 0; step < 40; step++) {
        clock += 1000; const d = devs[Math.floor(rnd() * 3)], r = rnd();
        if (turns) { sync(d); if (d.state === null || r < 0.8) { for (let k = 1 + Math.floor(rnd() * 3); k > 0; k--) save(d); } sync(d); if (r > 0.9) wipe(d); }
        else if (r < 0.5) save(d);
        else if (r < 0.9) sync(d);
        else { // the storage of the device is cleared: it must pull, and the cloud must not change
          wipe(d);
          const before = cloud && JSON.stringify(cloud); sync(d);
          if (cloud) { assert.strictEqual(JSON.stringify(cloud), before, 'a cleared device changes nothing in the cloud'); assert.strictEqual(d.state, cloud.state); }
        }
      }
      if (turns && cloud) assert.strictEqual(cloud.state.split('.').length - 1, serial, 'taking turns: every save of every device is in the cloud');
    }
  });
}
console.log('all ' + n + ' passed (sync number)');
