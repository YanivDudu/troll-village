// Runs every check once, ONE browser at a time. Usage: node tests/all.js [quick]
//   quick: logic, packs, three layout sizes (phone, low landscape, laptop), the phone at night, five self-play rounds, the reward and the cart
//   full (default): all eight layout sizes, dusk and night, self-play in every grade, the race and the cloud sync against the real database
// One browser at a time is the default: two headless browsers stall each other for minutes and spoil the measurements.
// MAX=3 node tests/all.js runs three side by side on a strong, idle machine; only then is a failed check run once more, alone.
// A check that fails with one browser at a time is a failure: it is not run again. A browser that returns no title is a failure too.
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.join(__dirname, '..'), EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const quick = process.argv[2] === 'quick', MAX = Math.max(1, Math.floor(+process.env.MAX) || 1);
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
  return run(EDGE, ['--headless', '--mute-audio', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--no-first-run', '--user-data-dir=' + dir, '--window-size=2000,1400', '--virtual-time-budget=' + budget, '--dump-dom', url], 900000)
    .then(out => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} const m = /<title>([^<]*)/.exec(out); return m ? m[1].replace(/&amp;/g, '&') : 'NO TITLE: the browser returned ' + (out === 'TIMEOUT' ? 'nothing in 15 minutes and was stopped' : out ? 'no page (' + out.slice(0, 80).replace(/\s+/g, ' ') + ')' : 'nothing') + '. This is a failure, not a pass'; });
}
const jobs = [];
const job = (name, ok, fn) => jobs.push({ name, ok, fn });
job('logic', /^all \d+ passed/m, () => run('node', ['tests/logic.test.js'], 120000).then(o => o.trim().split('\n').pop()));
job('packs', /^PACKS OK/, () => run('node', ['tests/packs.test.js'], 300000).then(o => o.trim().split('\n').slice(0, 6).join(' | ')));
(quick ? ['360x640', '800x380', '1366x650'] : ['360x640', '390x800', '800x380', '768x1024', '1024x768', '1280x620', '1366x650', '1920x950'])
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
// the cart through its real buttons: every item reachable by the arrows, try, buy at the fixed price, wear, take off, the savings goal, 30 trolls
job('cart', /^CART OK/, () => edge(page + '/tests/cart.html', 90000));
if (!quick) {
  job('race (real database)', /^RACE OK/, () => run('node', ['tests/run-page.js', 'tests/race.html', '290'], 320000).then(o => o.split('\n')[0]));
  job('sync (real database)', /^SYNC OK/, () => run('node', ['tests/run-page.js', 'tests/sync.html', '240'], 270000).then(o => o.split('\n')[0]));
}
job('pad', /^PAD OK/, () => edge(page + '/tests/pad.html', 90000)); // task "pad": the calculation sheet through its real cells and keys, every way of writing
// the speaker button: total silence at once (music, effects in flight, scheduled notes, reading aloud), nothing starts while it is off, sound comes back after
job('mute', /^MUTE OK/, () => edge(page + '/tests/mute.html', 60000));
// task "autolink": a device linked to nothing saves its players in the cloud by itself. NOT part of the default run, because every run leaves village
// documents that nobody can delete: only `node tests/all.js cloud` (the full run plus this check), or by hand: node tests/run-page.js tests/autolink.html 300
if (process.argv[2] === 'cloud') job('autolink (real database)', /^AUTOLINK OK/, () => run('node', ['tests/run-page.js', 'tests/autolink.html', '300'], 330000).then(o => o.split('\n')[0]));
job('village', /^VILLAGE OK/, () => edge(page + '/tests/village.html', 120000)); // task "village": the village of the trolls through its real buttons, the levels on the end screens
job('map3d', /^MAP3D OK/, () => edge(page + '/tests/map3d.html' + (quick ? '#360x640' : ''), 600000)); // task "map3d": the 3D picture of every trail map puts nothing over a label, a badge, the companion or a button (the geometry only, no WebGL)
job('walk', /^WALK OK/, () => edge(page + '/tests/walk.html', 120000)); // task "mapwalk": the companion walks on the maps: a tap, the walk, then the round; the second tap; a closed house; leaving in the middle; a race and reduced motion at once
job('life', /^LIFE OK/, () => edge(page + '/tests/life.html', 200000)); // task "camp life": the companion that lives on the island of the camp (its activities, taps, night, the walk before a screen opens)
job('pets', /^all \d+ passed/m, () => run('node', ['tests/pets.test.js'], 60000).then(o => o.trim().split('\n').pop())); // task "pets": the living pets as items, two pets per troll, loading old data
job('onboard', /^ONBOARD OK/, () => process.argv[2] === 'cloud' ? run('node', ['tests/run-page.js', 'tests/onboard.html', '240'], 270000).then(o => o.split('\n')[0]) : edge(page + '/tests/onboard.html?local', 150000)); // task "onboard": the invitation to the family account. Default: when it appears, "not now", the reminders (nothing is made in the cloud); `cloud`: also sign-up and sign-in against the real database (one throw-away account, deleted)
job('life3d', /^LIFE OK/, () => edge(page + '/tests/life.html#3d', 240000)); // task "camp3d": the same life of the camp on the 3D ground (the camera and the DOM of the 3D camp, without WebGL)
job('veil', /^VEIL OK/, () => edge(page + '/tests/veil.html', 60000)); // task "world3d": a device without 3D gets the flat camp and the flat map at once, with no cover and no mist (the 3D side of the transition needs WebGL: tests/veil.html#gl through tools/shoot3d.js)
job('gifted', /^GIFTED OK/, () => run('node', ['tests/gifted.test.js'], 120000).then(o => o.trim().split('\n').pop())); job('giftread', /^GIFTREAD OK/, () => run('node', ['tests/giftread.test.js'], 60000).then(o => o.trim().split('\n').pop())); ['auto&g=2&gtrial=1', 'auto&g=2&t=giftread&l=1', 'auto&g=2&t=gifttri&l=2'].forEach(h => job('play ' + h.replace('auto&', ''), /^DONE/, () => edge(page + '/index.html#' + h, 150000).then(t => t.slice(0, 60)))); // task "gifted": the generators and the passages of the stage-A practice, a whole trial test and two practice rounds through the real buttons
(async () => {
  const t0 = Date.now(), bad = [], again = []; let next = 0, done = 0;
  // the two node checks first, on their own: they are quick when nothing else loads the machine
  for (const j of jobs.splice(0, 2)) { const r = await j.fn(), ok = j.ok.test(r); if (!ok) bad.push(j.name + ' :: ' + r); console.log((ok ? 'ok   ' : 'FAIL ') + j.name + (ok ? '' : ' :: ' + r)); }
  await Promise.all(Array.from({ length: MAX }, async () => {
    while (next < jobs.length) {
      const j = jobs[next++], r = await j.fn(), ok = j.ok.test(r);
      if (!ok) { if (MAX > 1) again.push(j); else bad.push(j.name + ' :: ' + r); }
      console.log((ok ? 'ok   ' : MAX > 1 ? 'again ' : 'FAIL ') + j.name + (ok ? '' : ' :: ' + r.slice(0, 120)) + '  (' + (++done) + '/' + jobs.length + ')');
    }
  }));
  // several browsers side by side can spoil a measurement: whatever failed then runs once more, alone
  for (const j of again) { const r = await j.fn(), ok = j.ok.test(r); if (!ok) bad.push(j.name + ' :: ' + r); console.log((ok ? 'ok   ' : 'FAIL ') + j.name + ' (alone)' + (ok ? '' : ' :: ' + r)); }
  console.log((bad.length ? 'ALL FAIL ' + bad.length : 'ALL OK ' + jobs.length + ' checks') + ' in ' + Math.round((Date.now() - t0) / 1000) + ' s');
  process.exit(bad.length ? 1 : 0);
})();
