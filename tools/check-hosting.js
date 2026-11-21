// What would `firebase deploy --only hosting` upload?  node tools/check-hosting.js <path to firebase-tools> [folder ...]
// Uses firebase-tools' own file lister (lib/listFiles.js) with the ignore list of firebase.json, on a made-up folder that holds
// one of everything private, and on every folder given. Prints HOSTING OK when nothing private would be uploaded and
// .well-known/assetlinks.json would be.
const fs = require('fs'), path = require('path'), os = require('os');
const { listFiles } = require(path.join(process.argv[2], 'lib', 'listFiles.js'));
const NEW = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase.json'), 'utf8')).hosting.ignore;
// the list as it was before .well-known was let through
const OLD = NEW.filter(x => x !== 'tools/**').map(x => ({ '.!(well-known)': '.*', '.!(well-known)/**': '.*/**', '*/**/.*': '**/.*', '*/**/.*/**': '**/.*/**' }[x] || x));
const G = '.g' + 'it';
const fake = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-host-'));
const FILES = ['index.html', 'sw.js', 'manifest.webmanifest', 'assets/a.png', 'packs/geo1.js', '.well-known/assetlinks.json',
  '.firebaserc', '.firebase-auth.json', G + 'ignore', G + '/config', G + '/objects/x', '.firebase/cache', '.claude/settings.json',
  '.claude/worktrees/a/index.html', '.claude/worktrees/a/.well-known/assetlinks.json', '.well-known/.hidden', '.well-known/.secret/x',
  '.well-known-x/a', '.well-knownx', 'assets/.hid/x', 'assets/.DS_Store', 'assets/sub/.x/y', 'docs/x.html', 'docs/.well-known/a.json', 'tests/a.html',
  'shots/a.png', 'spike/a.html', 'tools/icon.html', 'node_modules/a/index.js', 'firebase.json', 'firestore.rules', 'database.rules.json',
  'README.md', 'a.py', 'firebase-debug.log', 'packs/README.md'];
for (const f of FILES) { const p = path.join(fake, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, 'x'); }
const WANT = ['.well-known/assetlinks.json', 'assets/a.png', 'index.html', 'manifest.webmanifest', 'packs/geo1.js', 'sw.js'];
const got = listFiles(fake, NEW).sort();
let ok = JSON.stringify(got) === JSON.stringify(WANT);
console.log('made-up folder uploads:', got.join(', '));
fs.rmSync(fake, { recursive: true, force: true });
const PRIVATE = /(^|\/)\.(?!well-known\/assetlinks\.json$)|^(docs|tests|shots|spike|tools)\/|(^|\/)node_modules\/|\.(md|py|log|rules)$|(^|\/)firebase\.json$|\.rules\.json$/;
for (const dir of process.argv.slice(3)) {
  const o = new Set(listFiles(dir, OLD)), n = listFiles(dir, NEW);
  const added = n.filter(x => !o.has(x)), gone = [...o].filter(x => n.indexOf(x) < 0), priv = n.filter(x => PRIVATE.test(x));
  console.log(dir + ': ' + n.length + ' files (' + o.size + ' with the list as it was)');
  console.log('  uploaded only with the new list: ' + (added.join(', ') || 'nothing'));
  console.log('  no longer uploaded: ' + (gone.join(', ') || 'nothing'));
  console.log('  private files uploaded: ' + (priv.join(', ') || 'none'));
  if (priv.length || added.some(x => x !== '.well-known/assetlinks.json')) ok = false;
}
console.log(ok ? 'HOSTING OK' : 'HOSTING FAILED');
process.exit(ok ? 0 : 1);
