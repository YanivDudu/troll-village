// Renders the app icons from tools/icon.html with headless Edge:  node tools/make-icons.js
// Writes assets/app/icon-192.png, icon-512.png, maskable-192.png, maskable-512.png, apple-180.png.
// Headless Edge cannot open a window narrower than about 500 px, so every picture is taken at 1024 px and reduced with
// Python's Pillow (python -m pip install pillow) to the size it needs.
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const root = path.resolve(__dirname, '..'), out = path.join(root, 'assets', 'app');
const page = 'file:///' + path.join(__dirname, 'icon.html').replace(/\\/g, '/').replace(/ /g, '%20');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'troll-icon-'));
fs.mkdirSync(out, { recursive: true });
const JOBS = [['icon-192', '', 192], ['icon-512', '', 512], ['apple-180', '', 180], ['maskable-192', '#m', 192], ['maskable-512', '#m', 512]];
const big = {};
for (const hash of ['', '#m']) {
  const png = path.join(tmp, 'big' + (hash ? 'm' : '') + '.png');
  execFileSync(EDGE, ['--headless', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--user-data-dir=' + path.join(tmp, 'profile'), '--window-size=1024,1024', '--virtual-time-budget=3000', '--screenshot=' + png, page + hash], { stdio: 'ignore' });
  big[hash] = png;
}
for (const [name, hash, size] of JOBS) {
  const to = path.join(out, name + '.png');
  execFileSync('python', ['-P', '-c',
    'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");assert im.size==(1024,1024),im.size;' +
    'im.resize((int(sys.argv[3]),)*2,Image.LANCZOS).save(sys.argv[2],optimize=True)', big[hash], to, String(size)]);
  console.log(name + '.png', fs.statSync(to).size + ' bytes');
}
fs.rmSync(tmp, { recursive: true, force: true });
