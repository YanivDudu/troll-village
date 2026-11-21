// Runs every check once, in parallel. Usage: node tests/all.js [quick]
//   quick: logic, packs, two layout sizes and three self-play rounds (for small changes)
//   full (default): all eight layout sizes, self-play in every grade, the race and the cloud sync against the real database
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.join(__dirname, '..'), EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const quick = process.argv[2] === 'quick', MAX = +process.env.MAX || Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2))); // MAX=1 node tests/all.js quick: one browser at a time (a machine short of memory)
const page = 'file:///' + root.replace(/\\/g, '/').replace(/ /g, '%20');
function run(cmd, args, ms) {
  return new Promise(res => {
    let out = ''; const p = spawn(cmd, args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
    const t = setTimeout(() => { try { spawn('taskkill', ['/F', '/T', '/PID', String(p.pid)]); } catch (e) {} res('TIMEOUT'); }, ms);
    p.stdout.on('data', d => out += d);
    p.on('close', () => { clearTimeout(t); res(out); }); p.on('error', e => { clearTimeout(t); res('ERROR ' + e.message); });
  });
}
function edge(url, budget) { // every browser gets a profile of its own, so several can run side by side
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-all-'));
  return run(EDGE, ['--headless', '--disable-gpu', '--allow-file-access-from-files', '--no-first-run', '--user-data-dir=' + dir, '--window-size=2000,1400', '--virtual-time-budget=' + budget, '--dump-dom', url], 900000)
    .then(out => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} return (/<title>([^<]*)/.exec(out) || [0, out.slice(0, 80)])[1].replace(/&amp;/g, '&'); });
}
const jobs = [];
const job = (name, ok, fn) => jobs.push({ name, ok, fn });
job('logic', /^all \d+ passed/m, () => run('node', ['tests/logic.test.js'], 120000).then(o => o.trim().split('\n').pop()));
job('packs', /^PACKS OK/, () => run('node', ['tests/packs.test.js'], 300000).then(o => o.trim().split('\n').slice(0, 6).join(' | ')));
(quick ? ['360x640', '800x380'] : ['360x640', '390x800', '800x380', '768x1024', '1024x768', '1280x620', '1366x650', '1920x950'])
  .forEach(sz => job('fit ' + sz, /^FIT OK/, () => edge(page + '/tests/fit.html#' + sz, 40000)));
// every screen again at dusk and at night: a sky layer once covered every button of the end screens, and the daytime run did not see it
(quick ? ['360x640&sky=21'] : ['360x640&sky=18', '360x640&sky=21', '1366x650&sky=18', '1366x650&sky=21'])
  .forEach(sz => job('fit ' + sz, /^FIT OK/, () => edge(page + '/tests/fit.html#' + sz, 40000)));
// tap=1: ONE tap on the big button of the home screen must put an exercise on the screen (a new player of that grade), then the stage is played
(quick ? ['auto&g=2&t=mix', 'auto&g=2&t=geo2clock&l=2&st=1', 'auto&g=2&t=mix&race=1', 'auto&g=1&tap=1', 'auto&g=4&tap=1']
  : ['auto&g=1&t=mix', 'auto&g=2&t=mix', 'auto&g=3&t=mix', 'auto&g=4&t=mix', 'auto&g=2&t=mix&race=1', 'auto&g=3&t=g3mul&boss=3', 'auto&g=2&t=mix&boy=1', 'auto&g=1&tap=1', 'auto&g=2&tap=1', 'auto&g=3&tap=1', 'auto&g=4&tap=1', 'auto&g=2&tap=1&home=mid', 'auto&g=3&tap=1&home=bridge',
    'auto&g=1&t=geo1poly&l=3&st=1', 'auto&g=1&t=heb1nik&l=4&st=2', 'auto&g=1&t=eng1listen&l=2&st=1', 'auto&g=2&t=geo2ruler&l=5&st=2', 'auto&g=2&t=heb2sent&l=1&st=1', 'auto&g=2&t=eng2talk&l=1&st=1',
    'auto&g=3&t=geo3area&l=4&st=2', 'auto&g=3&t=heb3read&l=2&st=1', 'auto&g=3&t=eng3read&l=3&st=1', 'auto&g=4&t=geo4box&l=3&st=2', 'auto&g=4&t=heb4root&l=4&st=1', 'auto&g=4&t=eng4talk&l=3&st=1',
    'auto&g=4&t=geo5area&l=5&st=2', 'auto&g=4&t=heb5verbs&l=4&st=1', 'auto&g=4&t=eng5gram&l=6&st=1'])
  .forEach(h => job('play ' + h.replace('auto&', ''), /^DONE/, () => edge(page + '/index.html#' + h, 150000).then(t => t.slice(0, 40))));
// the reward moment of the end screens: blocked for the first 0.9 s, one tap skips to the final state, the buttons work, the egg hatches
job('reward', /^REWARD OK/, () => edge(page + '/tests/reward.html', 60000));
if (!quick) {
  job('race (real database)', /^RACE OK/, () => run('node', ['tests/run-page.js', 'tests/race.html', '290'], 320000).then(o => o.split('\n')[0]));
  job('sync (real database)', /^SYNC OK/, () => run('node', ['tests/run-page.js', 'tests/sync.html', '240'], 270000).then(o => o.split('\n')[0]));
}
(async () => {
  const t0 = Date.now(), bad = [], again = []; let next = 0, done = 0;
  // the two node checks first, on their own: they are quick when nothing else loads the machine
  for (const j of jobs.splice(0, 2)) { const r = await j.fn(), ok = j.ok.test(r); if (!ok) bad.push(j.name + ' :: ' + r); console.log((ok ? 'ok   ' : 'FAIL ') + j.name + (ok ? '' : ' :: ' + r)); }
  await Promise.all(Array.from({ length: MAX }, async () => {
    while (next < jobs.length) {
      const j = jobs[next++], r = await j.fn(), ok = j.ok.test(r);
      if (!ok) again.push(j);
      console.log((ok ? 'ok   ' : 'again ') + j.name + (ok ? '' : ' :: ' + r.slice(0, 120)) + '  (' + (++done) + '/' + jobs.length + ')');
    }
  }));
  // a busy machine can spoil a measurement: whatever failed runs once more, alone
  for (const j of again) { const r = await j.fn(), ok = j.ok.test(r); if (!ok) bad.push(j.name + ' :: ' + r); console.log((ok ? 'ok   ' : 'FAIL ') + j.name + ' (alone)' + (ok ? '' : ' :: ' + r)); }
  console.log((bad.length ? 'ALL FAIL ' + bad.length : 'ALL OK ' + jobs.length + ' checks') + ' in ' + Math.round((Date.now() - t0) / 1000) + ' s');
  process.exit(bad.length ? 1 : 0);
})();
