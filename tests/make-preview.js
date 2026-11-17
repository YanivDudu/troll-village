// Builds preview.html: a sample sheet of generated trolls (for eyeballing the art).
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = id => new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>').exec(html)[1];
const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(grab('logic') + grab('troll') + ';this.L=TrollLogic;this.A=TrollArt;', ctx);
const { L, A } = ctx;
let cells = '';
for (let i = 0; i < 18; i++) {
  const s = L.trollFromId(i * 37 + 5);
  const mood = i % 6 === 4 ? 'cheer' : i % 6 === 5 ? 'think' : 'happy';
  cells += '<div class="c">' + A.trollSVG(s, { mood }) + '<b>' + s.name + '</b></div>';
}
for (let k = 0; k < 6; k++) {
  const s = Object.assign(L.trollFromId(3), { hair: k, acc: L.ACCESSORIES[k] });
  cells += '<div class="c">' + A.trollSVG(s) + '<b>תסרוקת ' + (k + 1) + '</b></div>';
}
fs.writeFileSync(path.join(root, 'preview.html'),
  '<!DOCTYPE html><html lang="he" dir="rtl"><meta charset="utf-8"><title>טרולים - דוגמה</title><style>' + style +
  'html,body{overflow:auto;height:auto}.sheet{display:grid;grid-template-columns:repeat(6,1fr);gap:18px;padding:24px;max-width:1200px;margin:auto}' +
  '.c{text-align:center}.c b{display:block;background:#fff;border-radius:99px;padding:2px 8px;font-size:17px}</style>' +
  '<div class="sheet">' + cells + '</div></html>');
console.log('preview.html written');
