// READ-ONLY check of the "rounds" change against real saved states (docs/prompts/rounds-spec.md, section 4).
//   node tools/rounds-migration-check.js <folder of a backup> [git revision of the code before the change]
// The folder holds families__*.json and villages__*.json (Firestore REST format; the string fields s3_<player> are saved states).
// Every state is loaded by the logic of the old revision and by the logic of this checkout, and compared: no open house closes, no
// bridge that was ready or done changes, the stars stay, the next step is something that is open. Nothing is written anywhere and
// no database is contacted. Players are shown by a short hash, never by name.
const fs = require('fs'), vm = require('vm'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const dir = process.argv[2], rev = process.argv[3] || 'a6675b4', root = path.join(__dirname, '..');
if (!dir || !fs.existsSync(dir)) { console.error('usage: node tools/rounds-migration-check.js <backup folder> [old revision]'); process.exit(2); }
function logicOf(html) {
  const m = /<script id="logic">([\s\S]*?)<\/script>/.exec(html), ctx = {}; vm.createContext(ctx); ctx.window = ctx;
  for (const f of fs.readdirSync(path.join(root, 'packs')).filter(f => /^(geo|heb|eng)[1-5]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(root, 'packs', f), 'utf8'), ctx);
  vm.runInContext(m[1] + ';this.L=TrollLogic;', ctx); return ctx.L;
}
const OLD = logicOf(cp.execSync('git show ' + rev + ':index.html', { cwd: root, maxBuffer: 1 << 26 }).toString('utf8'));
const NEW = logicOf(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
const J = x => JSON.parse(JSON.stringify(x));
let players = 0, bad = 0; const rows = [], seen = {};
const fail = (who, msg) => { bad++; console.log('  FAIL ' + who + ': ' + msg); };
const stepText = st => !st ? 'none' : st.challenge ? 'challenge map' : st.topic + (st.boss ? ' bridge' : ' h' + st.level + (st.stage != null ? ' s' + (st.stage + 1) : '') + (st.bridge ? ' (for bridge)' : ''));
for (const file of fs.readdirSync(dir).filter(f => /^(families|villages)__.*\.json$/.test(f)).sort()) {
  let doc; try { doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); } catch (e) { continue; }
  const fields = (doc && doc.fields) || {};
  for (const k of Object.keys(fields)) {
    if (!/^s3_/.test(k) || typeof fields[k].stringValue !== 'string') continue;
    const raw = fields[k].stringValue, who = crypto.createHash('sha1').update(k).digest('hex').slice(0, 5), sig = crypto.createHash('sha1').update(raw).digest('hex');
    if (seen[k + sig]) continue; seen[k + sig] = true; // the same player in a village and in a family document: once
    const o = OLD.loadState(raw), n = NEW.loadState(raw); players++;
    // 1. everything that was saved is read the same way
    for (const f of ['grade', 'stars', 'coins', 'xp', 'rounds', 'streak', 'buddy']) if (o[f] !== n[f]) fail(who, f + ' ' + o[f] + ' -> ' + n[f]);
    for (const f of ['levels', 'prog', 'boss', 'owned', 'items', 'dress', 'last', 'mem', 'fx']) if (JSON.stringify(o[f]) !== JSON.stringify(n[f])) fail(who, f + ' is read differently');
    let stars = 0, open = 0, oDone = 0, nWon = 0, oReady = 0, nReady = 0, done = 0, rounds = 0, played = 0;
    for (const t of NEW.TOPICS) {
      // 2. no house that was open is closed
      for (let lv = 1; lv <= t.levels.length; lv++) {
        const was = OLD.stageOpen(o, t.id, lv, 0), is = NEW.houseOpen(n, t.id, lv);
        if (was) open++; if (was && !is) fail(who, t.id + ' house ' + lv + ' was open and is closed');
        const pr = NEW.progOf(n, t.id, lv); pr.forEach(x => { stars += x; });
        const c = NEW.houseCount(n, t.id, lv); rounds += c; if (c) played++;
        if (c !== pr.filter(x => x >= 1).length) fail(who, t.id + ' house ' + lv + ' counter ' + c + ' is not the number of slots with a star');
        if (OLD.houseDone(o, t.id, lv)) { oDone++; if (!NEW.houseWon(n, t.id, lv)) fail(who, t.id + ' house ' + lv + ' was complete and does not count as won'); }
        if (NEW.houseWon(n, t.id, lv)) nWon++;
        // a house that is open and not won must be offered a round, and one won round must open the next house (never close anything)
        if (is && lv === n.levels[t.id]) { const r = NEW.finishHouse(n, t.id, lv, Array(8).fill(true)); if (r.state.levels[t.id] < n.levels[t.id] || r.state.stars < n.stars) fail(who, t.id + ' a won round took something away'); }
      }
      // 3. no bridge that was ready or done changes
      for (let g = 1; g <= 4; g++) {
        const od = OLD.bossDone(o, t.id, g), or = OLD.bossReady(o, t.id, g), nd = NEW.bossDone(n, t.id, g), nr = NEW.bossReady(n, t.id, g);
        if (od) done++; if (or) oReady++; if (nr) nReady++;
        if (od !== nd) fail(who, t.id + ' bridge done ' + od + ' -> ' + nd);
        if (or && !nr) fail(who, t.id + ' bridge was ready and is not');
      }
    }
    // 4. the next step is something that is open
    const os = OLD.nextStep(o), ns = NEW.nextStep(n);
    if (ns && !ns.challenge) {
      if (ns.boss ? !NEW.bossReady(n, ns.topic, ns.boss) : !NEW.houseOpen(n, ns.topic, ns.level)) fail(who, 'the next step is not open: ' + stepText(ns));
      if (!ns.boss) { const r = NEW.createHouseRound(n, ns.topic, ns.level, NEW.seeded(7), []); if (r.qs.length !== NEW.ROUND_SIZE) fail(who, 'no round for the next step'); }
    }
    if (os && !ns) fail(who, 'there was a next step and now there is none');
    const of = OLD.friend(o).level, nf = NEW.friend(n).level; if (nf < of) fail(who, 'friendship went down');
    const ab = Object.keys(n.prog).filter(id => NEW.topicStars(n, id) > 0).map(id => NEW.abilityOf(n, id));
    rows.push([who, n.grade, n.stars + (stars !== OLD.TOPICS.reduce((a, t) => a + OLD.topicStars(o, t.id), 0) ? '!' : ''), open, oDone + ' -> ' + nWon, played + ' / ' + rounds, oReady + ' -> ' + nReady, done, of + ' -> ' + nf,
      ab.length ? Math.min(...ab).toFixed(1) + '..' + Math.max(...ab).toFixed(1) : '-', stepText(os) + '  ->  ' + stepText(ns), raw.length]);
  }
}
const head = ['player', 'gr', 'stars', 'open', 'complete -> won', 'played / rounds', 'ready br.', 'done br.', 'friend', 'ability', 'next step: before -> after', 'bytes'];
const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
const line = r => r.map((x, i) => String(x).padEnd(w[i])).join(' | ');
console.log(line(head)); rows.sort((a, b) => parseInt(b[2]) - parseInt(a[2])).forEach(r => console.log(line(r)));
console.log(players + ' saved states, ' + bad + ' failures' + (bad ? '' : ': MIGRATION OK'));
process.exit(bad ? 1 : 0);
