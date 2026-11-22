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
  const WON = Array(8).fill(true), LOST = Array(8).fill(false);
  const finishHouse = (s, id, lv) => { s = L.finishHouse(s, id, lv, WON).state; s.last = { t: id, l: lv }; return s; };
  const check = (s, st) => { // whatever is offered is open and belongs to the player's grade
    if (!st || st.challenge) return;
    const tl = L.TOPICS.find(x => x.id === st.topic);
    assert.strictEqual(tl.g, s.grade, 'own grade: ' + JSON.stringify(st)); assert.strictEqual(tl.sub || 'math', st.sub);
    assert(L.topicsFor(s, st.sub).includes(st.topic));
    if (st.boss) assert(L.bossReady(s, st.topic, st.boss) && st.boss === s.grade, JSON.stringify(st));
    else { assert(L.houseOpen(s, st.topic, st.level), 'open: ' + JSON.stringify(st)); assert.strictEqual(st.stage, undefined, 'a house has no stages any more'); }
  };
  // a brand-new player of every grade starts where the game starts them: the start-level house of the first tile
  for (const g of [1, 2, 3, 4]) {
    const s = L.newState(g), id = L.topicsFor(s)[0], st = j(L.nextStep(s));
    assert.deepStrictEqual(st, { sub: 'math', topic: id, level: L.startLevel(L.TOPICS.find(x => x.id === id), g) }, 'grade ' + g); check(s, st);
    assert.strictEqual(st.level, s.levels[id]);
  }
  assert.deepStrictEqual(j(L.nextStep(L.newState(2))), { sub: 'math', topic: 'g2add', level: 3 });
  // a save without the optional field (every save made before this change) loads and gets a step
  assert.strictEqual(L.loadState(JSON.stringify(L.newState(2))).last, undefined);
  assert.strictEqual(L.newState(2).last, undefined); assert.strictEqual(L.newState(2).v, 4);
  assert.deepStrictEqual(j(L.loadState({ v: 4, grade: 2, last: { t: 'g2sub', l: 2 } }).last), { t: 'g2sub', l: 2 });
  assert.strictEqual(L.loadState({ v: 4, grade: 2, last: { t: 'nope', l: 2 } }).last, undefined);
  assert.strictEqual(L.loadState({ v: 4, grade: 2, last: 'x' }).last, undefined);
  assert.deepStrictEqual(j(L.loadState({ v: 4, grade: 2, last: { t: 'g2sub', l: 99 } }).last), { t: 'g2sub', l: 4 });
  // continue the house the child played last (also an earlier house the child chose in the map), until it is won
  let s = L.newState(2); s.last = { t: 'g2sub', l: 2 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 2 });
  // an earlier house that was played (also without success) counts for the bridge, as in every save from before the rounds: the step moves on
  s = L.finishHouse(s, 'g2sub', 2, LOST).state; s.last = { t: 'g2sub', l: 2 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 3 });
  // the newest house: a round that was not won keeps the step there, nothing is closed and nothing opens
  s = L.newState(2); s = L.finishHouse(s, 'g2add', 3, LOST).state; s.last = { t: 'g2add', l: 3 };
  assert.strictEqual(s.levels.g2add, 3); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 }); check(s, L.nextStep(s));
  // after the newest house is won the step is the house that has just opened
  s = finishHouse(L.newState(2), 'g2add', 3);
  assert.strictEqual(s.levels.g2add, 4); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 4 }); check(s, L.nextStep(s));
  // the last house of a tile is won, houses 1-2 were never played: the bridge waits for them, so they come now (marked), then the bridge, then the next tile
  s = finishHouse(s, 'g2add', 4);
  assert(!L.bossReady(s, 'g2add', 2)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 1, bridge: true }); check(s, L.nextStep(s));
  s = finishHouse(s, 'g2add', 1); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 2, bridge: true });
  s = finishHouse(s, 'g2add', 2); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', boss: 2 });
  s = j(s); s.boss.g2add[2] = true; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2sub', level: 3 });
  // an earlier house the child chose in the map while the newest house is not won is not marked as bridge work
  s = L.newState(2); s.last = { t: 'g2add', l: 1 }; assert.strictEqual(L.nextStep(s).bridge, undefined);
  // a house that is still closed is never offered, even when it was written as the last one
  s = L.newState(2); s.last = { t: 'g2add', l: 4 };
  assert(!L.houseOpen(s, 'g2add', 4)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 });
  // a tile of another grade is never offered, also when the child played there last (the challenge map)
  s = L.newState(2); s.last = { t: 'g3mul', l: 1 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 });
  s = L.setGrade(Object.assign(L.newState(2), { last: { t: 'g2add', l: 1 } }), 3);
  assert.strictEqual(L.nextStep(s).topic, 'g3add');
  // a bridge mission that is ready comes when the tile has no next house, before another tile
  s = L.newState(2); s.levels.g2mul = 1; for (let lv = 1; lv <= 4; lv++) s = finishHouse(s, 'g2mul', lv);
  assert(L.bossReady(s, 'g2mul', 2)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2mul', boss: 2 }); check(s, L.nextStep(s));
  s.last = { t: 'g2add', l: 3 }; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 }); // but the open house is finished first
  s.last = { t: 'g2mul', l: 4 }; s.boss.g2mul[2] = true; assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2div', level: 3 }); // then the tile after it
  // a parent closed a house that was open: the newest open house (already won) is offered, and a won round opens the next one again
  s = L.newState(2); for (const lv of [1, 2, 3]) s = finishHouse(s, 'g2add', lv); s.levels.g2add = 3; s.last = { t: 'g2add', l: 3 };
  assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 }); assert.strictEqual(L.finishHouse(s, 'g2add', 3, WON).opened, 4);
  // the subject that was used last; arithmetic when nothing was played
  s = L.newState(2); const geo = L.topicsFor(s, 'geo');
  if (geo.length) { s = finishHouse(s, geo[0], s.levels[geo[0]]); const st = L.nextStep(s); assert.strictEqual(st.sub, 'geo'); check(s, st); }
  // playing on by the recommended step alone never dead-ends: every house and every bridge of the grade, each house won once,
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
        for (let lv = L.startLevel(tl, g); lv <= tl.levels.length; lv++) assert(L.houseWon(p, st.topic, lv)); }
      else assert(!st.bridge);
      p = L.finishHouse(p, st.topic, st.level, WON).state; p.last = { t: st.topic, l: st.level };
    }
    for (const sub of L.SUBS) for (const id of L.topicsFor(p, sub)) { const tl = L.TOPICS.find(x => x.id === id); houses += tl.levels.length;
      assert(L.bossDone(p, id, g), id); tl.levels.forEach((d, i) => assert(L.houseWon(p, id, i + 1), id + ' ' + (i + 1))); }
    assert.strictEqual(steps, houses + bosses, 'every house exactly once, grade ' + g);
    assert(L.challengeOpen(p, L.nextStep(p).sub));
    for (const sub of L.SUBS) for (const id of L.challengeFor(p, sub)) p.prog[id] = L.TOPICS.find(x => x.id === id).levels.map(() => [1, 1, 1]);
    assert.strictEqual(L.nextStep(p), null, 'the grade and its challenge are finished, grade ' + g);
  }
  // a save from before the rounds: three finished stages are a won house, two are not (in the newest house), and the step is that house
  s = L.newState(2); for (const k of [0, 1]) s = L.finishStage(s, 'g2add', 3, k, [true]).state;
  assert(!L.houseWon(s, 'g2add', 3)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 3 });
  s = L.finishStage(s, 'g2add', 3, 2, [true]).state; assert(L.houseWon(s, 'g2add', 3)); assert.deepStrictEqual(j(L.nextStep(s)), { sub: 'math', topic: 'g2add', level: 4 });
  s = L.newState(2);
  const before = JSON.stringify(s); L.nextStep(s); assert.strictEqual(JSON.stringify(s), before, 'pure');
});
// ---------- task "village": the levels of the trolls (the optional field state.grow) ----------
t('village: a troll grows by finished rounds as the companion; state.grow is optional, cleaned, only grows, and touches nothing else', () => {
  const JV = x => JSON.parse(JSON.stringify(x));
  // 1. the ladder: 3, 4, 5, 6 more points; 18 rounds to level 5; nothing above it
  assert.deepStrictEqual(Array.from(L.GROW_STEP), [3, 4, 5, 6]); assert.strictEqual(L.GROW_MAX, 18);
  const lv = p => L.growLevel(p).level;
  assert.deepStrictEqual([0, 1, 2, 3, 6, 7, 11, 12, 17, 18, 19, 1e9].map(lv), [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5]);
  assert.deepStrictEqual(JV(L.growLevel(0)), { level: 1, points: 0, done: 0, need: 3 });
  assert.deepStrictEqual(JV(L.growLevel(8)), { level: 3, points: 8, done: 1, need: 5 });
  assert.deepStrictEqual(JV(L.growLevel(18)), { level: 5, points: 18, done: 0, need: 0 });
  for (const junk of [null, undefined, 'x', NaN, -4, {}, [], Infinity, -Infinity, true]) assert(lv(junk) >= 1 && lv(junk) <= 5, String(junk));
  assert.strictEqual(lv(2.9), 1); assert.strictEqual(lv('7'), 1, 'only numbers count');
  // 2. missing: stays missing, everybody is at level 1, the version does not change
  assert.strictEqual(L.newState(2).grow, undefined); assert.strictEqual(L.newState(2).v, 4);
  const plain = L.loadState(JSON.stringify(L.newState(2)));
  assert(!('grow' in JV(plain))); assert.strictEqual(L.growOf(plain, 5), 0); assert.strictEqual(L.growOf(null, 5), 0); assert.strictEqual(L.growOf({ grow: 'x' }, 5), 0);
  // 3. loading: kept for owned trolls, clamped, everything else dropped
  let o = JV(L.newState(2)); o.owned = [5, 42, 79, 1000]; o.buddy = 42;
  o.grow = { 5: 4, 42: 999, 79: 2.7, 1000: '6', 116: 9, x: 3, constructor: 5, '-1': 2 };
  let s = L.loadState(JSON.stringify(o));
  assert.deepStrictEqual(JV(s.grow), { 5: 4, 42: 18, 79: 2 });
  o.grow = { 5: 0, 42: -3, 79: 'a', 1000: null }; assert.strictEqual(L.loadState(JSON.stringify(o)).grow, undefined, 'nothing valid: the field stays missing');
  for (const junk of [null, 5, 'x', true, [], [1, 2], { 5: {} }, { 5: [3] }, { 5: NaN }]) { o.grow = junk; const g = L.loadState(JSON.stringify(o)); assert.strictEqual(g.grow, undefined, JSON.stringify(junk)); assert.strictEqual(g.v, 4); }
  o.grow = { 5: 4 }; o.owned = []; assert.strictEqual(L.loadState(JSON.stringify(o)).grow, undefined, 'a troll that is not owned has no points');
  // 4. a round trip (save, load, load) and a sync leave it as it is; an older page drops it and nothing breaks
  o = JV(L.newState(2)); o.owned = [5, 42]; o.buddy = 5; o.grow = { 5: 7, 42: 1 };
  const one = L.loadState(JSON.stringify(o)), two = L.loadState(JSON.stringify(one));
  assert.deepStrictEqual(JV(two), JV(one)); assert.deepStrictEqual(JV(two.grow), { 5: 7, 42: 1 });
  const A = { list: [{ id: 'p111111111', name: 'a' }], gone: [], n: { p111111111: 9 }, t: { p111111111: 9 }, has: { p111111111: true } }, B = { list: A.list, gone: [], n: { p111111111: 4 }, t: { p111111111: 4 }, has: { p111111111: true } };
  const cloud = { list: A.list, gone: [], n: { p111111111: 9 }, t: { p111111111: 9 }, st: { p111111111: '9:9|9' }, has: { p111111111: true }, s: { p111111111: JSON.stringify(one) } };
  const down = L.mergeCloud(B, cloud); assert.deepStrictEqual(Array.from(down.pull), ['p111111111']);
  assert.deepStrictEqual(JV(L.loadState(cloud.s[down.pull[0]])), JV(one));
  const dropped = JV(one); delete dropped.grow; const back = L.loadState(JSON.stringify(dropped));
  assert.strictEqual(back.grow, undefined); assert.strictEqual(L.growLevel(L.growOf(back, 5)).level, 1);
  const noGrow = JV(one); delete noGrow.grow; assert.deepStrictEqual(JV(back), noGrow, 'without the field the rest of the state is the same');
  // 5. growAdd: the one writer. Pure, one point for the troll it names, only for an owned troll, never down, never above the top
  let st = L.loadState(JSON.stringify(o)); const frozen = JSON.stringify(st);
  let r = L.growAdd(st, 42); assert.strictEqual(JSON.stringify(st), frozen, 'pure');
  assert.deepStrictEqual(JV(r.state.grow), { 5: 7, 42: 2 }); assert.strictEqual(r.up, false); assert.strictEqual(r.level, 1);
  r = L.growAdd(r.state, 42); assert.strictEqual(r.up, true); assert.strictEqual(r.was, 1); assert.strictEqual(r.level, 2); assert.strictEqual(r.state.grow[5], 7, 'the other troll is not touched');
  r = L.growAdd(st, 999); assert.strictEqual(r.state, st, 'not owned: nothing happens'); assert.strictEqual(r.up, false);
  r = L.growAdd(st, null); assert.strictEqual(r.state, st); r = L.growAdd(null, 5); assert.strictEqual(r.up, false);
  let cur = L.newState(2), ups = []; cur.owned = [5]; cur.buddy = 5;
  for (let i = 1; i <= 30; i++) { const before = L.growOf(cur, 5); r = L.growAdd(cur, 5); cur = r.state; assert(L.growOf(cur, 5) >= before, 'never down'); if (r.up) ups.push(i); }
  assert.deepStrictEqual(ups, [3, 7, 12, 18], 'the level rises after 3, 7, 12 and 18 rounds'); assert.strictEqual(L.growOf(cur, 5), 18); assert.strictEqual(lv(L.growOf(cur, 5)), 5);
  const dirty = JV(L.newState(2)); dirty.owned = [5]; dirty.grow = { 5: 3, 77: 9, junk: 'x' }; // not normalised by loadState
  assert.deepStrictEqual(JV(L.growAdd(dirty, 5).state.grow), { 5: 4 }, 'what is written is clean');
  // 6. the points change nothing but themselves: the same state with and without them gives the same game
  const a = L.loadState(JSON.stringify(o)), b = JV(a); delete b.grow; const bb = L.loadState(JSON.stringify(b)), same = x => { const c = JV(x); delete c.grow; return c; };
  assert.deepStrictEqual(same(L.growAdd(a, 5).state), same(a), 'growAdd touches only state.grow');
  assert.deepStrictEqual(JV(L.nextStep(a)), JV(L.nextStep(bb))); assert.deepStrictEqual(JV(L.friend(a)), JV(L.friend(bb)));
  assert.deepStrictEqual(JV(L.finishStage(a, 'g2add', 1, 0, [true, true]).state.prog), JV(L.finishStage(bb, 'g2add', 1, 0, [true, true]).state.prog));
  assert.deepStrictEqual(JV(L.stageReward(3)), JV(L.stageReward(3))); assert.strictEqual(L.finishStage(a, 'g2add', 1, 0, [true]).state.grow[5], 7, 'the points are carried through a finished stage');
  assert.strictEqual(L.setGrade(a, 3).grow[5], 7); assert.strictEqual(L.memAdd(a, 'p', 'g2add', 1, '2026-11-22').grow[5], 7);
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
  s.prog.g2add = [[0, 0, 0], [0, 0, 0], [3, 1, 0], [3, 3, 3]]; const two = L.journey(s).houses; s.prog.g2add = [[0, 0, 0], [0, 0, 0], [3, 1, 1], [3, 3, 3]]; assert.strictEqual(L.journey(s).houses, two + 1, 'the newest open house counts once it was won (a star in its third slot); a closed house never');
  s.prog.g2add = [[0, 0, 0], [1, 0, 0], [0, 0, 0]]; assert.strictEqual(L.journey(s).houses, two, 'a house below the newest one counts once it was played: the house after it is already open');
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
  const undone = J6(dl); undone.prog.g2add[2] = [0, 0, 0]; assert(keysOf(undone).indexOf('doneLast') < 0, 'only what is still true in the save');
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
  // 11. the first exercise of a round: a house that was played and never earned three stars; five right in a row in the tile
  s = played(2); s.prog.g2add = [[0, 0, 0], [3, 0, 0], [2, 1, 0], [0, 0, 0]];
  assert.strictEqual(L.stageMemo(s, 'g2add', 3), 'again');
  assert.strictEqual(L.stageMemo(s, 'g2add', 2), null, 'three stars: nothing to say'); assert.strictEqual(L.stageMemo(s, 'g2add', 4), null, 'never played');
  s.hists.g2add = [true, true, true, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4), 'run5'); assert.strictEqual(L.stageMemo(s, 'g2add', 3), 'again', 'again comes first');
  s.hists.g2add = [true, true, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4), null); s.hists.g2add = [true, true, false, true, true]; assert.strictEqual(L.stageMemo(s, 'g2add', 4), null);
  // 12. the journal
  let j = L.journal(L.newState(2));
  assert.strictEqual(j.pages.length, 1); assert.deepStrictEqual(J6(j.pages[0].stamps), []); assert.deepStrictEqual(J6(j.pages[0].cards), []); assert(j.pages[0].next && j.pages[0].next.level === 3 && j.pages[0].next.stage === undefined); assert.deepStrictEqual(J6(j.recent), []);
  s = houseOf(L, played(2), 'g2add', 3); s = L.finishStage(s, 'g2add', 4, 0, [true]).state; s = L.finishStage(s, 'g2add', 4, 1, [true]).state; s.last = { t: 'g2add', l: 4 };
  j = L.journal(s); let pg = Array.from(j.pages).find(x => x.t === 'g2add');
  assert.deepStrictEqual(J6(pg.stamps), [{ l: 3, stars: 9, d: '', n: 3, tier: 3, won: true }, { l: 4, stars: 6, d: '', n: 2, tier: 2, won: false }], 'every house that was played has its badge and its count; no date without an event'); assert.deepStrictEqual(J6(pg.next), { level: 4 });
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

// ---- the calculation sheet: when it is offered (task "pad", docs/prompts/pad-spec.md) ----
{
  // every house of every arithmetic tile, as the game makes it, in every format it can take: which sheet (- = none)
  const PAD = {
    add2: 'choice:add', add4: 'choice:add use:add',
    add5: 'choice:-|add tf:-|add cmp:-|add word:-|free lefteq:-|free', add6: 'choice:add tf:add cmp:add word:free lefteq:free', add7: 'choice:add tf:add cmp:add word:free lefteq:free use:add', add8: 'choice:add tf:add cmp:add',
    sub6: 'choice:sub tf:sub cmp:sub word:free', sub7: 'choice:sub tf:sub cmp:sub word:free use:sub', sub8: 'choice:free tf:free cmp:free',
    mul1: 'choice:-|mul', mul2: 'choice:-|mul', num4: 'choice:-|add tf:add cmp:add word:free lefteq:free', num6: 'choice:-|add|sub tf:add|sub cmp:add|sub', miss5: 'choice:free',
    add9: 'choice:add tf:add cmp:add', add10: 'choice:add tf:add cmp:add', add11: 'choice:add tf:add cmp:add', sub9: 'choice:sub tf:sub cmp:sub', sub10: 'choice:sub tf:sub cmp:sub', sub11: 'choice:sub tf:sub cmp:sub',
    mul4: 'choice:-|mul', mul5: 'choice:-|mul', mul6: 'choice:mul tf:mul cmp:mul', mul7: 'choice:mul tf:mul cmp:mul', mul8: 'choice:mul tf:mul cmp:mul',
    div7: 'choice:free|split tf:free|split cmp:free|split', div8: 'choice:split tf:split cmp:split', num7: 'choice:-|add|sub tf:add|sub cmp:add|sub',
    ord1: 'choice:free tf:free cmp:free', ord2: 'choice:free tf:free cmp:free', ord3: 'choice:free tf:free cmp:free', ord4: 'choice:free tf:free cmp:free', miss7: 'choice:free', miss8: 'choice:free',
    num9: 'choice:-|add|sub tf:add|sub cmp:add|sub', add12: 'choice:add tf:add cmp:add', add13: 'choice:add tf:add cmp:add', sub12: 'choice:sub tf:sub cmp:sub', add14: 'choice:add tf:add cmp:add', sub13: 'cmp:free',
    mul9: 'choice:mul tf:mul cmp:mul', mul10: 'choice:mul tf:mul cmp:mul', mul11: 'choice:mul tf:mul cmp:mul', div9: 'choice:div+rem', div10: 'choice:div tf:div cmp:div', div11: 'choice:div tf:div cmp:div',
    num10: 'choice:free', num11: 'choice:-|free', num12: 'choice:free tf:free cmp:free', ord5: 'choice:free tf:free cmp:free', ord6: 'choice:free tf:free cmp:free', miss9: 'choice:free',
    add15: 'choice:dec', add16: 'choice:dec', sub14: 'choice:dec', miss11: 'choice:free', frac10: 'cmp:free', frac11: 'choice:free', mul12: 'use:mul', div12: 'choice:div tf:div cmp:div', ord7: 'choice:free tf:free cmp:free'
  };
  const HANDS = ['line', 'build', 'array', 'pairs'], kindStr = k => k ? k.kind + (k.rem ? '+rem' : '') : '-';
  const tiles = L.TOPICS.filter(tp => !tp.sub), seen = {}, samples = [];
  let kinds = 0, sheets = 0, houses = 0; const byG = {}, housesWith = new Set();
  t('the sheet: every house in every format gets exactly the sheet of the spec (154 kinds of 306)', () => {
    for (const tp of tiles) tp.src.forEach((s, i) => {
      const house = s[0] + s[1], per = {}; houses++;
      const note = (f, q) => { const k = L.padKind(q); (per[f] = per[f] || new Set()).add(kindStr(k)); if (samples.length < 90000 && Math.random() < 0.25) samples.push(q); return k; };
      for (let j = 0; j < 1500; j++) {
        const q = L.makeQuestion(tp.id, i + 1, Math.random);
        note(q.fmt, q);
        if (q.fmt !== 'choice') continue; // an exercise that is born in a format is never turned into another one
        for (const f of new Set(L.formatsFor(q, 0, true).concat(L.formatsFor(q, 1, true)))) {
          const c = L.toFmt(q, f, Math.random, () => L.makeQuestion(tp.id, i + 1, Math.random));
          if (c) note(f, c);
        }
      }
      const want = {}; (PAD[house] || '').split(' ').filter(Boolean).forEach(x => { const p = x.split(':'); want[p[0]] = p[1]; });
      for (const f of Object.keys(per)) {
        const got = [...per[f]].sort().join('|'); kinds++;
        assert.strictEqual(got, want[f] || '-', house + ' (grade ' + tp.g + ') as ' + f);
        if (HANDS.includes(f)) assert.strictEqual(got, '-', house + ' ' + f);
        if (got !== '-') { sheets++; byG[tp.g] = (byG[tp.g] || 0) + 1; housesWith.add(house); }
      }
      for (const f of Object.keys(want)) assert(per[f], house + ': the format ' + f + ' never came');
      seen[house] = 1;
    });
    console.log('   sheet kinds: ' + sheets + ' of ' + kinds + ', houses ' + housesWith.size + ' of ' + houses + ', by grade ' + JSON.stringify(byG));
    assert.strictEqual(kinds, 306); assert.strictEqual(sheets, 154); assert.strictEqual(houses, 98); assert.strictEqual(housesWith.size, 61);
    assert.deepStrictEqual(byG, { 1: 3, 2: 42, 3: 52, 4: 44, 5: 13 });
    Object.keys(PAD).forEach(hs => assert(seen[hs], 'no such house: ' + hs));
  });
  t('the sheet: nothing that had it loses it, grade 1 and the hands-on formats get nothing new, and the answer is never read', () => {
    let old = 0;
    for (const q of samples) {
      const s = JSON.stringify(q), v = L.vertOf(q), k = L.padKind(q);
      if (v) { old++; assert(k && (k.kind === 'add' || k.kind === 'mul') && k.key === v.key, s); assert.deepStrictEqual(Array.from(k.nums), [v.a, v.b], s); }
      if (q.g === 1) assert.strictEqual(!!k, !!v, s);
      if (HANDS.includes(q.fmt)) assert.strictEqual(k, null, s);
      const c = Object.assign({}, q, { answer: q.answer === 'yes' ? 'no' : 987654, options: ['a', 'b', 'c', 'd'] });
      assert.deepStrictEqual(JSON.parse(JSON.stringify(L.padKind(c))), JSON.parse(JSON.stringify(k)), s);
    }
    assert(old > 1000);
    // the source lists (debug links make their exercises): the same holds there
    for (const tp of L.SRC) for (let lv = 1; lv <= tp.levels.length; lv++) for (let i = 0; i < 200; i++) {
      const q = L.makeQuestion(tp.id, lv, Math.random), v = L.vertOf(q), k = L.padKind(q);
      if (v) assert(k && /^(add|mul)$/.test(k.kind), JSON.stringify(q));
      if (q.g === 1) assert.strictEqual(!!k, !!v, JSON.stringify(q));
    }
  });
  t('the sheet: the numbers it is laid out from are the numbers of the exercise', () => {
    const OPS = { add: '+', sub: '−', mul: '×', div: ':', split: ':' };
    let checked = 0;
    for (const q of samples) {
      const k = L.padKind(q); if (!k) continue;
      if (k.kind === 'free') { assert.strictEqual(k.nums.length, 0); continue; }
      const f = q.fmt, base = strip(f !== 'choice' && q.key.indexOf(f + '|') === 0 ? q.key.slice(f.length + 1) : q.text).replace(/,/g, '');
      if (k.rem) { const m1 = /(\d+) : (\d+)\?$/.exec(base), m2 = /נכנס (\d+) בתוך (\d+)\?$/.exec(base); assert.deepStrictEqual(Array.from(k.nums), m1 ? [+m1[1], +m1[2]] : [+m2[2], +m2[1]], base); checked++; continue; }
      const op = OPS[k.kind] || k.op; assert.strictEqual(k.op, op, base);
      const mine = ev(Array.from(k.nums).join(' ' + op + ' ')), theirs = ev(base.replace(' = ?', ''));
      assert(near(mine, theirs), base + ' / ' + JSON.stringify(k));
      if (k.kind === 'dec') assert(Array.from(k.nums).every(x => typeof x === 'string')); else assert(Array.from(k.nums).every(x => typeof x === 'number'));
      checked++;
    }
    assert(checked > 5000);
  });
  t('the sheet: the examples of the spec', () => {
    const k = (text, g, fmt, key, rtl) => kindStr(L.padKind({ text, g, fmt: fmt || 'choice', key: key || text, rtl: !!rtl, answer: 1, options: [1, 2, 3, 4] }));
    const rows = [
      ['43 − 5 = ?', 2, 'sub'], ['11 − 7 = ?', 2, '-'], ['17 + 15 + 12 = ?', 2, 'add'], ['7 + 2 = ?', 2, '-'], ['5 + 6 = ?', 2, '-'],
      ['39 × 36 = ?', 4, 'mul'], ['269 × 9 = ?', 4, 'mul'], ['6 × 7 = ?', 3, '-'], ['784 : 7 = ?', 4, 'div'], ['840 : 70 = ?', 4, 'div'], ['80 : 8 = ?', 3, '-'], ['70 : 10 = ?', 2, '-'],
      ['42 : 3 = ?', 3, 'split'], ['2,700 : 3 = ?', 3, 'free'], ['8.29 − 1.4 = ?', 5, 'dec'], ['3 − 0.4 = ?', 5, 'dec'], ['6/10 − 2/10 = ?', 4, '-'], ['1/3 + 1/2 = ?', 5, 'free'],
      ['(4 + 8) × 6 − 14 = ?', 3, 'free'], ['62 − 16 − 31 = ?', 2, 'free'], ['500 → 1,000 → ? → 2,000', 3, '-'],
      ['□ + 38 = 83', 2, 'free'], ['□ − 19 = 15', 2, 'free'], ['5 × □ + 10 = 25', 3, 'free'], ['4 + □ = 11', 2, '-'], ['□ × 5 = 35', 2, '-'], ['100 : □ = 10', 2, '-'], ['□ : 10 = 6', 2, '-'],
      ['2,263 + 215 ◯ 2,264 + 214', 4, 'free', 'cmp'], ['3/7 ◯ 1/3', 5, 'free', 'cmp'], ['2⁵ = ?', 4, 'free'], ['42 = 2 × 3 × □', 4, 'free'], ['0.84 + □ = 1', 5, 'free'],
      ['16 − 9 = ?', 1, '-'], ['100 − 50 = ?', 1, '-'], ['17 + 1 = ?', 1, 'add'], ['10 × 7 = ?', 2, 'mul'], ['999,999 + 1 = ?', 4, 'add']
    ];
    rows.forEach(r => assert.strictEqual(k(r[0], r[1], r[3]), r[2], r[0] + ' (grade ' + r[1] + ')'));
    assert.strictEqual(k('מָה הַשְּׁאֵרִית בַּתַּרְגִּיל 83 : 6?', 4, 'choice', null, true), 'div+rem');
    assert.strictEqual(k('כַּמָּה פְּעָמִים שְׁלֵמוֹת נִכְנָס 4 בְּתוֹךְ 50?', 4, 'choice', null, true), 'div+rem');
    assert.deepStrictEqual(Array.from(L.padKind({ text: 'כַּמָּה פְּעָמִים שְׁלֵמוֹת נִכְנָס 4 בְּתוֹךְ 50?', g: 4, fmt: 'choice', key: 'x', rtl: true }).nums), [50, 4]);
    assert.strictEqual(k('מָה הַשְּׁאֵרִית בַּתַּרְגִּיל 53 : 9?', 3, 'choice', null, true), '-');
    assert.strictEqual(k('אֵיזֶה מִסְפָּר מִתְחַלֵּק בְּ-9?', 4, 'choice', null, true), 'free');
    assert.strictEqual(k('אֵיזֶה מִסְפָּר הֲכִי גָּדוֹל?', 4, 'choice', null, true), '-');
    // clones: a story and an equals sign on the left never show the operation; true or false and a comparison keep the columns
    assert.strictEqual(k('story', 2, 'word', 'word|31 + 19 = ?', true), 'free'); assert.strictEqual(k('story', 2, 'word', 'word|5 + 6 = ?', true), '-'); assert.strictEqual(k('story', 2, 'word', 'word|6 × 7 = ?', true), '-');
    assert.strictEqual(k('50 = □ + 19', 2, 'lefteq', 'lefteq|31 + 19 = ?'), 'free');
    assert.strictEqual(k('31 + 19 = 50', 2, 'tf', 'tf|31 + 19 = ?'), 'add'); assert.strictEqual(k('31 + 19 ◯ 51', 2, 'cmp', 'cmp|31 + 19 = ?'), 'add'); assert.strictEqual(k('10 × 7 = 77', 2, 'tf', 'tf|10 × 7 = ?'), '-');
    HANDS.forEach(f => assert.strictEqual(k('31 + 19 = ?', 2, f, f + '|31 + 19 = ?'), '-'));
    assert.strictEqual(L.padKind(null), null);
    assert.strictEqual(L.padKind({ text: '43 − 5 = ?', g: 2, fmt: 'choice', key: 'k', pack: true }), null); // a subject pack gets nothing new
    assert.deepStrictEqual(Array.from(L.padKind({ text: '36 × 139 = 5,004', g: 4, fmt: 'tf', key: 'tf|36 × 139 = ?' }).nums), [139, 36]); // the longer number on top
  });
}
console.log('all ' + n + ' passed (pad)');
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
    ['0:500', '00:500', '0:900'].forEach(r => assert.strictEqual(L.cloudNum(r, '500', st(40, 7)), 48, 'a number below 1 is no number: ' + r));
    assert.strictEqual(L.cloudNum('0:500', '500', L.newState(2)), 1, 'so the copy never counts as 0, below every device');
    assert.strictEqual(act(L.mergeCloud(dev(30, 9e15, '', true), { list: card, gone: [], n: { [id]: L.cloudNum('0:500', '500', st(40, 7)) }, t: { [id]: 500 }, st: { [id]: '0:500|500' }, has: { [id]: true } })), 'pull', 'and a device with less progress does not push over it');
    // the document a device is linked to: two family accounts are two documents although both have the code acct
    assert.notStrictEqual(L.linkKey('acct', 'uidA'), L.linkKey('acct', 'uidB')); assert.strictEqual(L.linkKey('acct', 'uidA'), L.linkKey('acct', 'uidA'));
    assert.notStrictEqual(L.linkKey('acct', 'uidA'), L.linkKey('acct', null), 'signed out'); assert.notStrictEqual(L.linkKey('acct', ''), L.linkKey('', ''));
    assert.notStrictEqual(L.linkKey('ABCDEFGH', 'uidA'), L.linkKey('ABCDEFGJ', 'uidA')); assert.strictEqual(L.linkKey('ABCDEFGH', 'uidA'), L.linkKey('ABCDEFGH', null), 'a village code does not depend on an account');
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

// ---------- rounds: one repeatable round per house, the counter and its badge, the adaptive difficulty (docs/prompts/rounds-spec.md) ----------
const RR = (ok, n) => Array.from({ length: n || 8 }, (_, i) => i < ok);
const fakeQ = (text, fmt, topic, level) => ({ text, fmt: fmt || 'choice', key: (fmt && fmt !== 'choice' ? fmt + '|' : '') + text, topic: topic || 'g1a', level: level || 1 });
t('rounds: stars, the counter, what a won round opens, nothing ever goes down; old saves are read as before', () => {
  assert.strictEqual(L.ROUND_SIZE, 8);
  assert.deepStrictEqual([8, 7, 6, 5, 0].map(k => L.roundStars(RR(k))), [3, 3, 2, 1, 1], 'three stars tolerate one miss; two stars = a won round');
  assert.deepStrictEqual([8, 7, 6, 5, 0].map(k => L.roundWon(RR(k))), [true, true, true, false, false], '70% at the first try');
  assert.deepStrictEqual([RR(10, 10), RR(9, 10), RR(8, 10), RR(7, 10), RR(6, 10)].map(L.roundStars), [3, 3, 2, 2, 1]);
  let s = L.newState(2); const s0 = JSON.stringify(s);
  assert.strictEqual(L.houseCount(s, 'g2add', 3), 0); assert(L.houseOpen(s, 'g2add', 3) && L.houseOpen(s, 'g2add', 1) && !L.houseOpen(s, 'g2add', 4)); assert(!L.houseWon(s, 'g2add', 3));
  // a round that was not won: it counts, it earns its star, it opens nothing and closes nothing
  let r = L.finishHouse(s, 'g2add', 3, RR(3));
  assert.strictEqual(JSON.stringify(s), s0, 'pure');
  assert.deepStrictEqual([r.stars, r.gained, r.won, r.opened, r.firstWin, r.count, r.tier, r.tierUp], [1, 1, false, 0, false, 1, 1, true]);
  s = r.state; assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [1, 0, 0]); assert.strictEqual(s.levels.g2add, 3); assert.strictEqual(L.houseCount(s, 'g2add', 3), 1); assert.strictEqual(s.stars, 1);
  s = L.finishHouse(s, 'g2add', 3, RR(5)).state; assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [1, 1, 0]);
  r = L.finishHouse(s, 'g2add', 3, RR(0)); s = r.state;
  assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [1, 1, 0], 'the third slot is kept for a won round'); assert.strictEqual(r.gained, 0); assert.strictEqual(L.houseCount(s, 'g2add', 3), 3); assert(!L.houseWon(s, 'g2add', 3)); assert(!L.houseOpen(s, 'g2add', 4));
  // a won round opens the next house; later rounds only add
  r = L.finishHouse(s, 'g2add', 3, RR(6)); s = r.state;
  assert.deepStrictEqual([r.stars, r.gained, r.won, r.opened, r.firstWin, r.count, r.tier, r.tierUp], [2, 2, true, 4, true, 4, 4, true]);
  assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [1, 1, 2]); assert(L.houseWon(s, 'g2add', 3) && L.houseOpen(s, 'g2add', 4)); assert.strictEqual(s.stars, 4);
  r = L.finishHouse(s, 'g2add', 3, RR(8)); s = r.state; assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [1, 3, 2], 'the lowest slot, the last one first'); assert.strictEqual(r.opened, 0); assert.strictEqual(r.firstWin, false);
  r = L.finishHouse(s, 'g2add', 3, RR(2)); assert.strictEqual(r.gained, 0); assert.deepStrictEqual(Array.from(L.progOf(r.state, 'g2add', 3)), [1, 3, 2], 'a weaker round takes nothing'); assert.strictEqual(r.state.levels.g2add, 4); s = r.state;
  for (let i = 0; i < 30; i++) { const b = s; s = L.finishHouse(s, 'g2add', 3, RR(i % 9)).state; assert(s.stars >= b.stars && L.houseCount(s, 'g2add', 3) === L.houseCount(b, 'g2add', 3) + 1 && s.levels.g2add >= b.levels.g2add); }
  assert.deepStrictEqual(Array.from(L.progOf(s, 'g2add', 3)), [3, 3, 3]); assert.strictEqual(L.topicStars(s, 'g2add'), 9, 'a house holds at most nine stars'); assert.strictEqual(s.stars, 9); assert.strictEqual(L.houseCount(s, 'g2add', 3), 36);
  assert.deepStrictEqual(Array.from(L.progOf(L.finishHouse(L.newState(2), 'g2add', 3, RR(8)).state, 'g2add', 3)), [0, 0, 3], 'a first round that is won writes the slot that means "won"');
  const last = L.maxLevel('g2add'); let f = L.newState(2); f.levels.g2add = last; assert.strictEqual(L.finishHouse(f, 'g2add', last, RR(8)).opened, 0, 'nothing opens after the last house');
  // the badge: a look for each of the counts 1-10, then one for each round number up to 100
  assert.deepStrictEqual([0, 1, 2, 9, 10, 11, 19, 20, 29, 30, 99, 100, 101, 5000].map(L.badgeTier), [0, 1, 2, 9, 10, 10, 10, 11, 11, 12, 18, 19, 19, 19]); assert.strictEqual(L.BADGE_TIERS, 19);
  for (let c = 1, was = 0; c < 300; c++) { const tr = L.badgeTier(c); assert(tr >= was && tr <= L.BADGE_TIERS); was = tr; }
  // ---- saves from before the rounds: the counter is the number of slots with a star, a house is won as it was complete or passed
  let o = L.loadState({ v: 4, grade: 2, levels: { g2add: 3 }, prog: { g2add: [[3, 0, 0], [0, 0, 0], [2, 3, 1], [0, 0, 0]], g2sub: [[1, 1, 1], [1, 1, 1], [1, 1, 0]] }, stars: 15 });
  assert.strictEqual(o.cnt, undefined); assert.strictEqual(o.ab, undefined); assert.strictEqual(o.it, undefined); assert.strictEqual(o.v, 4);
  assert.deepStrictEqual([1, 2, 3, 4].map(l => L.houseCount(o, 'g2add', l)), [1, 0, 3, 0]);
  assert.deepStrictEqual([1, 2, 3, 4].map(l => L.houseWon(o, 'g2add', l)), [true, false, true, false], 'below the newest house: played; the newest house: its third slot');
  assert.deepStrictEqual([1, 2, 3].map(l => L.houseWon(o, 'g2sub', l)), [true, true, false]);
  // the bridge: every house of the grade won once; a bridge that was ready before (three stages in every house) is ready
  let b = L.newState(2); b.levels.g2div = 3; b.prog.g2div = [[1, 1, 1], [2, 1, 1], [1, 1, 3]]; assert(L.bossReady(b, 'g2div', 2));
  b.prog.g2div = [[1, 0, 0], [0, 2, 0], [0, 0, 2]]; assert(L.bossReady(b, 'g2div', 2)); b.prog.g2div[2] = [3, 3, 0]; assert(!L.bossReady(b, 'g2div', 2)); b.prog.g2div = [[0, 0, 0], [1, 1, 1], [1, 1, 1]]; assert(!L.bossReady(b, 'g2div', 2));
  // ---- the three optional fields: kept when sound, cleaned when not, never needed
  s = L.finishHouse(L.newState(2), 'g2mul', 3, RR(8), L.createHouseRound(L.newState(2), 'g2mul', 3, L.seeded(3), []).qs).state;
  assert.deepStrictEqual(Array.from(s.cnt.g2mul), [0, 0, 1, 0]); assert.strictEqual(s.ab.g2mul, 0.25); assert(typeof s.it.g2mul === 'string' && s.it.g2mul.length % 6 === 0 && s.it.g2mul.length > 0);
  const back = L.loadState(JSON.stringify(s));
  assert.deepStrictEqual(JSON.parse(JSON.stringify([back.cnt, back.ab, back.it])), JSON.parse(JSON.stringify([s.cnt, s.ab, s.it])), 'a round trip keeps them');
  const older = JSON.parse(JSON.stringify(s)); delete older.cnt; delete older.ab; delete older.it; const lo = L.loadState(older); // an older page saved the state without them
  assert.strictEqual(lo.cnt, undefined); assert.strictEqual(L.houseCount(lo, 'g2mul', 3), 1, 'derived again from the stars'); assert.strictEqual(L.abilityOf(lo, 'g2mul'), 2); assert.strictEqual(L.itemStat(lo, fakeQ('5 × 4 = ?', 'choice', 'g2mul', 3)).shift, 0);
  const junk = L.loadState({ v: 4, grade: 2, prog: { g2add: [[1, 1, 1]] }, cnt: { g2add: [0, 'x', -4, 2.9, 1e12], nope: [5], g2sub: 'a' }, ab: { g2add: 99, g2sub: 'x', g2mul: -3, nope: 1 }, it: { g2add: 'abcd12zz', g2sub: 'abcd53', g2mul: 5, nope: 'abcd11' } });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(junk.cnt)), { g2add: [0, 0, 0, 2] }); assert.deepStrictEqual(JSON.parse(JSON.stringify(junk.ab)), { g2add: 3, g2mul: 0 }); assert.deepStrictEqual(JSON.parse(JSON.stringify(junk.it)), { g2sub: 'abcd53' });
  assert.strictEqual(L.houseCount(junk, 'g2add', 1), 3, 'a counter smaller than what the stars prove is not trusted'); assert.strictEqual(L.houseCount(junk, 'g2add', 4), 2);
  for (const bad of [null, 7, 'x', [], { g2add: null }]) { const q = L.loadState({ v: 4, grade: 2, cnt: bad, ab: bad, it: bad }); assert.strictEqual(L.houseCount(q, 'g2add', 1), 0); assert.strictEqual(L.abilityOf(q, 'g2add'), 0); L.createHouseRound(q, 'g2add', 3, L.seeded(1), []); L.finishHouse(q, 'g2add', 3, RR(8)); }
  // ---- the ability: 0 for a new player; from the stars of a tile; a little under the other tiles of the subject in a new tile; small steps
  assert.strictEqual(L.abilityOf(L.newState(2), 'g2add'), 0);
  let a = L.newState(2); a.prog.g2add = [[3, 3, 3], [3, 2, 0]]; assert.strictEqual(L.abilityOf(a, 'g2add'), 1.8); assert.strictEqual(L.abilityOf(a, 'g2sub'), 1.35); a.ab = { g2add: 0.5 }; assert.strictEqual(L.abilityOf(a, 'g2add'), 0.5);
  assert.deepStrictEqual([8, 7, 6, 5, 0].map(k => L.abilityAfter(1, RR(k))), [1.25, 1, 0.65, 0.6, 0.6]);
  assert.strictEqual(L.abilityAfter(0.1, RR(0)), 0); assert.strictEqual(L.abilityAfter(2.9, RR(8)), L.AB_MAX); assert.strictEqual(L.abilityAfter(1, [true]), 1, 'too short to tell');
});
t('difficulty: the score of an exercise is read from what is in it, and orders the exercises inside every house', () => {
  const pt = (text, fmt) => L.featOf(fakeQ(text, fmt)).fact;
  const inc = (list, msg) => { for (let i = 1; i < list.length; i++) assert(pt(list[i - 1]) < pt(list[i]), (msg || '') + ': ' + list[i - 1] + ' (' + pt(list[i - 1]) + ') before ' + list[i] + ' (' + pt(list[i]) + ')'); };
  // the owner: "adding 1 is easier than adding 2; 3 + 2 is much harder than 1 + 1 or 4 + 1"
  inc(['1 + 1 = ?', '4 + 1 = ?', '1 + 4 = ?'], 'plus one'); inc(['4 + 1 = ?', '3 + 2 = ?', '2 + 3 = ?', '3 + 6 = ?', '4 + 5 = ?'], 'the smaller addend'); assert(pt('3 + 2 = ?') - pt('1 + 1 = ?') >= 2);
  assert(pt('3 + 3 = ?') < pt('3 + 4 = ?') && pt('6 + 0 = ?') < pt('6 + 3 = ?') && pt('6 + 4 = ?') < pt('6 + 3 = ?'), 'doubles, plus nothing, pairs that make ten');
  inc(['12 + 3 = ?', '8 + 5 = ?'], 'crossing ten'); inc(['6 + 6 = ?', '9 + 4 = ?', '5 + 8 = ?']);
  // taking away: -0, -1 and all of it, a difference of one, then the rest
  for (const e of ['6 − 0 = ?', '6 − 6 = ?', '9 − 1 = ?']) assert(pt(e) < pt('9 − 8 = ?') + 1 && pt(e) < pt('8 − 2 = ?'), e);
  inc(['9 − 8 = ?', '8 − 2 = ?', '9 − 4 = ?']); inc(['14 − 4 = ?', '17 − 2 = ?', '13 − 6 = ?']); inc(['14 − 7 = ?', '11 − 3 = ?', '13 − 6 = ?']);
  // the tables: x10, x2, x5, squares, 3-4, 6-9; a quotient is a little harder than its product
  inc(['10 × 4 = ?', '5 × 4 = ?', '4 × 3 = ?', '4 × 7 = ?', '7 × 8 = ?']); assert(pt('6 × 6 = ?') < pt('6 × 7 = ?') && pt('2 × 3 = ?') < pt('2 × 8 = ?') + 1 && pt('1 × 7 = ?') === 0);
  assert(pt('24 : 6 = ?') > pt('6 × 4 = ?') && pt('20 : 10 = ?') < pt('36 : 4 = ?') && pt('30 : 5 = ?') < pt('56 : 7 = ?'));
  // several digits: carries and borrows, whole tens, a zero to borrow through
  inc(['30 + 25 = ?', '23 + 45 = ?', '38 + 47 = ?']); inc(['47 + 3 = ?', '59 + 4 = ?', '36 + 8 = ?']); assert.strictEqual(pt('2,300 + 1,400 = ?'), pt('23 + 14 = ?'));
  inc(['75 − 30 = ?', '68 − 25 = ?', '83 − 57 = ?']); assert(pt('304 − 58 = ?') > pt('563 − 27 = ?')); inc(['12 × 3 = ?', '47 × 6 = ?']);
  inc(['20 + 10 + 5 = ?', '24 + 13 + 6 = ?', '27 + 38 + 19 = ?']);
  // where the unknown stands; number sequences
  const form = text => L.featOf(fakeQ(text)).form;
  assert.deepStrictEqual(['3 + □ = 7', '7 − □ = 3', '□ + 4 = 7', '□ − 3 = 4'].map(form), [0, 1, 2, 3]); assert(form('□ × 4 = 28') > form('4 × □ = 28'));
  inc(['10 → 20 → ? → 40 → 50', '15 → 20 → 25 → ? → 35', '6 → 9 → 12 → ? → 18', '35 → 31 → 27 → ? → 19']); inc(['3 → 4 → ?', '11 → ? → 13', '? → 10 → 11']);
  // the exercise an activity format was made from is what counts; a question in words has no table and gets the two general features
  assert.strictEqual(pt('7 × 8 = ?', 'tf'), pt('7 × 8 = ?')); assert.strictEqual(pt('7 × 8 = ?', 'word'), 6);
  assert.strictEqual(L.featOf(fakeQ('7 × 8 = ?')).known, true); const wq = L.makeQuestion('g4frac', 3, L.seeded(1)); assert.strictEqual(L.featOf(wq).known, false); assert(L.featOf(wq).mag > 0);
  assert.strictEqual(JSON.stringify(L.featOf({ pack: true, text: 'x', key: 'k' })), JSON.stringify(L.featOf(null)));
  // inside a house the scores are spread around 2 (a typical exercise with four answers), also in the narrowest house of grade 1
  let flat = [];
  for (const tp of L.TOPICS) tp.levels.forEach((d, i) => {
    const rnd = L.seeded(11 + i), ds = []; for (let k = 0; k < 150; k++) ds.push(L.scoreOf(L.makeQuestion(tp.id, i + 1, rnd)));
    const mean = ds.reduce((x, y) => x + y, 0) / ds.length, spread = Math.max(...ds) - Math.min(...ds);
    assert(Math.abs(mean - 2) < 0.5, tp.id + ' ' + (i + 1) + ' mean ' + mean); assert(Math.max(...ds) <= 2 + L.DIFF.cap + 1e-9 && Math.min(...ds) >= 2 - L.DIFF.cap - 1e-9);
    if (spread < 0.3) flat.push(tp.id + '.' + (i + 1));
  });
  for (const id of ['g1a', 'g1b', 'g1c', 'g2add', 'g2sub', 'g2mul', 'g2div', 'g2miss']) assert(!flat.some(x => x.indexOf(id + '.') === 0), 'every house of ' + id + ' has easier and harder exercises: ' + flat.join(' '));
  assert(flat.length <= 14, 'houses of arithmetic whose exercises all score alike: ' + flat.length + ' (' + flat.join(' ') + ')');
  const q1 = L.scoreOf(fakeQ('1 + 1 = ?')), q2 = L.scoreOf(fakeQ('4 + 1 = ?')), q3 = L.scoreOf(fakeQ('3 + 2 = ?')), q4 = L.scoreOf(fakeQ('4 + 5 = ?'));
  assert(q1 < q2 && q2 < q3 && q3 < q4 && q4 - q1 >= 1, 'addition to 10: ' + [q1, q2, q3, q4].join(' '));
  // the format moves the score: hands-on and "right or not?" under four answers, a story and the equals sign on the left over it
  const F = L.DIFF.fmt; assert(F.line < F.tf && F.tf < F.choice && F.choice < F.cmp && F.cmp <= F.pairs && F.pairs < F.word && F.word <= F.lefteq && F.array === F.line && F.build === F.line);
  assert(L.DIFF.src.prev < 0 && L.DIFF.src.next > 0);
});
t('a round of a house: 40% easy, 40% medium, one or two hard in the second half, at most two of each neighbour house', () => {
  const houses = [['g1a', 1], ['g1a', 3], ['g2add', 2], ['g2add', 4], ['g2mul', 2], ['g2num', 2], ['g4frac', 3], ['g4big', 1], ['g3ord', 2]];
  for (const [id, lv] of houses) for (const ab of [0, 1, 2, 3]) for (const cnt of [0, 1, 5]) for (let seed = 1; seed <= 6; seed++) {
    const s = L.newState(L.TOPICS.find(x => x.id === id).g); s.ab = { [id]: ab }; s.cnt = { [id]: L.TOPICS.find(x => x.id === id).levels.map((d, i) => i === lv - 1 ? cnt : 0) };
    const r = L.createHouseRound(s, id, lv, L.seeded(seed * 31 + ab * 7 + cnt), []), qs = Array.from(r.qs), tag = id + ' ' + lv + ' ability ' + ab + ' count ' + cnt + ' seed ' + seed;
    assert.strictEqual(qs.length, 8, tag); assert.strictEqual(new Set(qs.map(q => q.key)).size, 8, 'no exercise twice: ' + tag);
    const hard = qs.filter(q => q.slot === 'h').length; assert(hard === 1 || hard === 2, tag); assert.strictEqual(qs.filter(q => q.slot === 'e').length, 3, tag); assert.strictEqual(qs.filter(q => q.slot === 'm').length, 5 - hard, tag);
    qs.forEach((q, i) => { if (q.slot === 'h') assert(i >= 4, 'a hard exercise in the first half: ' + tag); assert(typeof q.d === 'number' && isFinite(q.d), tag); assert.strictEqual(q.topic, id);
      assert.strictEqual(q.level, q.review ? lv - 1 : q.ahead ? lv + 1 : lv, tag); if (q.ahead) assert(q.slot === 'h' && cnt > 0, 'the next house only as a hard exercise, never in the first round: ' + tag); if (q.review) assert(q.slot !== 'h', tag);
      assert.strictEqual(q.options.filter(x => x === q.answer).length, 1, tag); });
    assert(qs.filter(q => q.review).length <= 2 && qs.filter(q => q.ahead).length <= 2 && qs.filter(q => q.fmt === 'pairs').length <= 1, tag);
    const firstM = qs.findIndex(q => q.slot === 'm'), lastE = qs.map(q => q.slot).lastIndexOf('e'); assert(lastE < firstM, 'easy before medium: ' + tag);
    assert(Math.abs(r.plan.base - Math.max(0, ab - (cnt === 0 ? 1 : cnt === 1 ? 0.5 : 0))) <= L.JITTER + 1e-9, 'the whole round moves by a little: ' + tag);
    if (id.indexOf('g1') === 0) assert(qs.every(q => q.fmt !== 'cmp'), 'no < > signs in grade 1');
  }
  // the three kinds really differ, in a wide house and in the narrowest one; a higher ability gets a harder round
  for (const [id, lv] of [['g2add', 2], ['g1a', 1]]) {
    const mean = ab => { const m = { e: [0, 0], m: [0, 0], h: [0, 0], all: [0, 0] }; for (let seed = 1; seed <= 40; seed++) { const s = L.newState(L.TOPICS.find(x => x.id === id).g); s.ab = { [id]: ab }; s.cnt = { [id]: [9, 9, 9, 9, 9] };
      for (const q of L.createHouseRound(s, id, lv, L.seeded(seed), []).qs) { m[q.slot][0] += q.d; m[q.slot][1]++; m.all[0] += q.d; m.all[1]++; } } return { e: m.e[0] / m.e[1], m: m.m[0] / m.m[1], h: m.h[0] / m.h[1], all: m.all[0] / m.all[1] }; };
    const lo = mean(0.5), mid = mean(1.5), hi = mean(2.5);
    for (const x of [mid, hi]) assert(x.m - x.e >= 0.3 && x.h - x.m >= 0.3, id + ': easy ' + x.e.toFixed(2) + ', medium ' + x.m.toFixed(2) + ', hard ' + x.h.toFixed(2));
    assert(lo.e <= lo.m && lo.m < lo.h && lo.all < mid.all && mid.all < hi.all, id + ': ' + [lo.all, mid.all, hi.all].map(x => x.toFixed(2)).join(' < '));
  }
  // the first round of a house: the easiest content of that house; a tile of a subject pack gets a round too
  const first = L.createHouseRound(L.newState(1), 'g1a', 1, L.seeded(4), []); assert(first.qs.every(q => q.level === 1 && q.d <= 2.4), 'first round: ' + first.qs.map(q => q.d).join(' '));
  for (const tp of LP.TOPICS.filter(x => x.sub)) for (const lv of [1, tp.levels.length]) { const s = LP.newState(Math.min(4, tp.g)); s.ab = { [tp.id]: 2 }; s.cnt = { [tp.id]: tp.levels.map(() => 3) };
    const r = LP.createHouseRound(s, tp.id, lv, LP.seeded(lv + tp.id.length), []); assert.strictEqual(r.qs.length, 8, tp.id); assert(r.qs.every(q => q.pack && q.topic === tp.id), tp.id); }
});
t('simulation: children of different true abilities settle at the same first-try success, with three stars in most rounds', () => {
  // A simulated child answers an exercise right at the first try with a probability that falls with its score on the scale; p2 is the
  // child's success on a typical plain exercise of the house (score 2), and one step of the scale changes the odds by e^0.9.
  const logit = p => Math.log(p / (1 - p)), sig = x => 1 / (1 + Math.exp(-x)), BETA = 0.9, table = [];
  function child(id, lv, p2, seed) {
    const rng = L.seeded(seed); let s = L.newState(L.TOPICS.find(x => x.id === id).g); s.levels[id] = lv; const out = [];
    for (let n = 0; n < 30; n++) {
      const r = L.createHouseRound(s, id, lv, rng, []), res = Array.from(r.qs).map(q => rng() < sig(logit(p2) + BETA * (2 - (q.d - q.sh))));
      const f = L.finishHouse(s, id, lv, res, r.qs); s = f.state;
      out.push({ ab: s.ab[id], ok: res.filter(Boolean).length / 8, stars: f.stars, hard: Array.from(r.qs).filter(q => q.slot === 'h').length, md: Array.from(r.qs).reduce((a, q) => a + q.d - q.sh, 0) / 8 });
    }
    return out;
  }
  function settle(id, lv, p2) {
    let ok = 0, s3 = 0, n = 0, ab1 = 0, ab2 = 0, hard = 0, swing = 0, sw = 0, nsw = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const o = child(id, lv, p2, seed * 17 + Math.round(p2 * 1000));
      o.forEach((x, i) => { assert(x.hard === 1 || x.hard === 2); if (i && i < 30) assert(Math.abs(x.ab - o[i - 1].ab) <= 0.4 + 1e-9, 'the ability moves in small steps'); });
      o.slice(12).forEach((x, i) => { ok += x.ok; s3 += x.stars === 3 ? 1 : 0; n++; hard += x.hard; if (i < 9) ab1 += x.ab / 9; else ab2 += x.ab / 9; });
      for (let i = 13; i < 30; i++) { const d = Math.abs(o[i].md - o[i - 1].md); swing = Math.max(swing, d); sw += d; nsw++; }
    }
    const row = { house: id + '.' + lv, p2, ability: ab2 / 6, drift: Math.abs(ab2 - ab1) / 6, first: ok / n, three: s3 / n, hard: hard / n, swing: sw / nsw, swingMax: swing };
    table.push(row); return row;
  }
  for (const [id, lv, from] of [['g2add', 2, 0.65], ['g1a', 1, 0.75]]) { // a wide house; the narrowest house of grade 1 (addition to 10)
    let was = -1;
    for (const p2 of [0.55, 0.65, 0.75, 0.85, 0.92, 0.97]) {
      const x = settle(id, lv, p2), tag = id + ' p2 ' + p2 + ': ' + JSON.stringify(x);
      assert(x.ability >= was - 0.15, 'a stronger child settles higher: ' + tag); was = x.ability;
      assert(x.drift < 0.45, 'the ability has settled: ' + tag);
      assert(x.hard > 1.3 && x.hard < 1.7, tag); assert(x.swing < 0.45 && x.swingMax < 1.3, 'consecutive rounds do not swing: ' + tag);
      if (p2 >= from && p2 <= 0.92) { assert(x.first >= 0.82 && x.first <= 0.93, 'first-try success in the band: ' + tag); assert(x.three >= 0.58 && x.three <= 0.9, 'three stars in most rounds: ' + tag); }
      if (p2 > 0.92) { assert(x.first >= 0.9 && x.ability > 2.5, 'the top of the scale: ' + tag); }
      if (p2 < from) { assert(x.ability < 0.5 && x.first >= 0.6, 'the bottom of the scale: the easiest content the house has: ' + tag); }
    }
  }
  console.log('   house    true  ability  first-try  3 stars  hard/round  swing'); table.forEach(x => console.log('   ' + x.house.padEnd(8) + ' ' + x.p2.toFixed(2) + '  ' + x.ability.toFixed(2) + '     ' + (100 * x.first).toFixed(0) + '%        ' + (100 * x.three).toFixed(0) + '%      ' + x.hard.toFixed(2) + '        ' + x.swing.toFixed(2)));
});
t('items: what a player did with a single item makes it easier or harder for that player; missed items come back; the memory stays small', () => {
  // stable keys: every item of a pack, and the basic facts of arithmetic (the same key in every activity format); nothing else
  const k = L.itemKey(fakeQ('7 × 8 = ?')); assert(/^[0-9a-zA-Z_-]{4}$/.test(k)); assert.strictEqual(L.itemKey(fakeQ('7 × 8 = ?', 'tf')), k); assert.strictEqual(L.itemKey(fakeQ('7 × 8 = ?', 'word')), k);
  assert.notStrictEqual(L.itemKey(fakeQ('8 × 7 = ?')), k); assert(L.itemKey(fakeQ('12 − 5 = ?')) && L.itemKey(fakeQ('□ + 4 = 10')) && L.itemKey(fakeQ('56 : 7 = ?')));
  for (const big of ['38 + 47 = ?', '47 × 6 = ?', '10 → 20 → ? → 40', '24 + 13 + 6 = ?']) assert.strictEqual(L.itemKey(fakeQ(big)), null, big);
  // the shift: nothing without evidence; a miss makes an item hard at once, right answers make it easy step by step; bounded
  assert.strictEqual(L.itemShift(0, 0, 0), 0); assert(L.itemShift(1, 0, 0) >= 1 && L.itemShift(2, 0, 0) > L.itemShift(1, 0, 0)); assert(L.itemShift(1, 1, 0) < 0 && L.itemShift(5, 5, 0) <= -0.5 && L.itemShift(5, 5, 0) < L.itemShift(2, 2, 0));
  assert(L.itemShift(4, 2, 0) > 0.5 && L.itemShift(9, 0, 0) <= 2 && L.itemShift(9, 9, 0) >= -1.2); assert(L.itemShift(2, 1, 1) < L.itemShift(2, 1, -1), 'an item that is hard for everyone counts less against the player');
  // a child who knows half of the English words of a house
  const tile = LP.TOPICS.find(x => x.id === 'eng2words'), lv = 1; assert(tile, 'the pack of English words');
  const bank = {}; { const r = LP.seeded(1); for (let i = 0; i < 3000; i++) { const q = LP.makeQuestion(tile.id, lv, r); bank[LP.itemKey(q)] = true; } }
  const keys = Object.keys(bank), knows = {}; keys.forEach((x, i) => { knows[x] = i % 2 === 0; }); assert(keys.length >= 8, 'items in the house: ' + keys.length);
  let s = LP.newState(2), rng = LP.seeded(5), backs = 0, backRounds = 0, shown = {};
  for (let n = 0; n < 16; n++) {
    const r = LP.createHouseRound(s, tile.id, lv, rng, []), qs = Array.from(r.qs), nb = qs.filter(q => q.back).length;
    assert(nb <= 2 && qs.filter(q => q.back).every(q => q.slot === 'h' && shown[LP.itemKey(q)] < 0), 'what was missed comes back only in the hard places');
    backs += nb; if (nb) backRounds++;
    const res = qs.map(q => { const ik = LP.itemKey(q), ok = rng() < (knows[ik] === false ? 0.1 : 1); if (!ok) shown[ik] = -1; return ok; }); // shown: -1 once an item was missed
    s = LP.finishHouse(s, tile.id, lv, res, qs).state;
  }
  let easy = 0, hard = 0, nk = 0, nu = 0;
  const one = {}; { const r = LP.seeded(9); for (let i = 0; i < 3000; i++) { const q = LP.makeQuestion(tile.id, lv, r), ik = LP.itemKey(q); if (!one[ik]) one[ik] = q; } }
  keys.forEach(ik => { const st = LP.itemStat(s, one[ik]); if (st.n < 2) return; if (knows[ik]) { nk++; if (st.shift < 0) easy++; } else { nu++; if (st.shift >= 1) hard++; } });
  assert(nk >= 3 && nu >= 3, 'items seen twice or more: ' + nk + ' known, ' + nu + ' unknown');
  assert(easy / nk >= 0.9, 'the known half is easy: ' + easy + ' of ' + nk); assert(hard / nu >= 0.9, 'the unknown half is hard: ' + hard + ' of ' + nu);
  assert(backRounds >= 10 && backs >= 12, 'missed items are shown again: ' + backs + ' times in ' + backRounds + ' rounds of 16');
  assert(/^([0-9a-zA-Z_-]{4}[0-9]{2})+$/.test(s.it[tile.id])); assert.deepStrictEqual(Object.keys(s.it), [tile.id]);
  // without the field (an older page dropped it): the items are simply unknown again, and a round is built as for a new player
  const lost = JSON.parse(JSON.stringify(s)); delete lost.it; assert.strictEqual(LP.itemStat(LP.loadState(lost), one[keys[0]]).n, 0); assert.strictEqual(LP.createHouseRound(LP.loadState(lost), tile.id, lv, LP.seeded(2), []).qs.filter(q => q.back).length, 0);
  // counters stay one digit (old answers fade), and the memory is capped: a tile, and the whole
  let c = L.newState(2); const q78 = Object.assign(fakeQ('7 × 8 = ?', 'choice', 'g3mul', 3));
  for (let i = 0; i < 40; i++) c = L.itemsAfter(c, [q78], [true]); assert.strictEqual(c.it.g3mul.length, 6); assert(L.itemStat(c, q78).n <= 9 && L.itemStat(c, q78).r <= L.itemStat(c, q78).n);
  for (let i = 0; i < 6; i++) c = L.itemsAfter(c, [q78], [false]); assert(L.itemStat(c, q78).shift > 0, 'new misses outweigh old successes');
  let big = LP.newState(4), nItems = 0, worst = 0;
  for (const tp of LP.TOPICS) { const qs = []; for (let i = 0; i < L.IT_TILE + 30; i++) qs.push({ pack: true, key: tp.id + ' item ' + i, topic: tp.id, level: 1, fmt: 'choice', text: '' }); big = LP.itemsAfter(big, qs, qs.map((q, i) => i % 3 > 0)); }
  for (const id in big.it) { assert(big.it[id].length <= L.IT_TILE * 6, id); nItems += big.it[id].length / 6; }
  assert(nItems <= L.IT_ALL, 'items remembered: ' + nItems); worst = JSON.stringify(big.it).length;
  assert(worst < 12000, 'the item memory of a player who met everything: ' + worst + ' bytes');
  const whole = JSON.stringify(Object.assign(LP.loadState(JSON.stringify(big)), { cnt: Object.fromEntries(LP.TOPICS.map(tp => [tp.id, tp.levels.map(() => 100)])), ab: Object.fromEntries(LP.TOPICS.map(tp => [tp.id, 2.25])) })).length;
  assert(whole * 8 < 400000, 'eight such players: ' + whole * 8 + ' bytes of 1,048,576');
  console.log('   item memory at its cap: ' + worst + ' bytes; a whole saved state with it: ' + whole + ' bytes; eight players: ' + whole * 8 + ' bytes (the limit of a document is 1,048,576)');
  assert(JSON.stringify(LP.loadState(JSON.stringify(big)).it) === JSON.stringify(big.it), 'the capped memory survives loading');
});
console.log('all ' + n + ' passed (rounds)');
