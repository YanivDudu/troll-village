// node tools/pets/make-compare.js <out dir> [tag] [kind ...] : the seven animals side by side, for judging them against each other (the dog is the benchmark):
//   <tag>-seven.png    one row per animal: front, three quarters, side, back (large), then the sizes of the game (112 camp, 72 cart, 56 map with outline, 40 small)
//   <tag>-<kind>4.png  one animal large from four angles (for every kind named after the tag; the lion when none is named)
const path = require('path'), E = require('./edge.js'), S = path.resolve(process.argv[2] || '.'), tag = process.argv[3] || 'now', big = process.argv.slice(4);
const PAGE = `window.cmpAll = function () { var K = Pets.KINDS, T = 200, W = T * 4 + 420, H = K.length * (T + 6) + 6, cv = document.createElement('canvas'), x, PI = Math.PI; cv.width = W; cv.height = H; x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  K.forEach(function (k, r) { var Y = 6 + r * (T + 6), v = k === 'bird' ? 2 : 0; [0, 0.7, PI / 2, PI].forEach(function (a, i) { x.fillStyle = '#eef2fb'; x.beginPath(); x.roundRect(i * T + 3, Y, T - 6, T, 12); x.fill(); Pets.draw(x, i * T, Y, { kind: k, variant: v, size: T, angle: a, pose: { t: 0.5 } }); });
    x.fillStyle = '#7fd45a'; x.beginPath(); x.roundRect(4 * T + 3, Y, 414, T, 12); x.fill(); var X = 4 * T + 10;
    [[112, 0.7], [72, 0.7], [72, -0.7], [56, 0.7], [56, PI / 2], [40, 0.7], [40, 0]].forEach(function (s) { Pets.draw(x, X, Y + T - s[0] - 10, { kind: k, variant: v, size: s[0], angle: s[1], pose: { t: 0.5 }, outline: s[0] <= 72 ? 0.04 : false }); X += s[0] + 4; });
    x.fillStyle = '#2e2350'; x.font = 'bold 13px Segoe UI, Arial'; x.fillText(k, 10, Y + 16); });
  return cv.toDataURL('image/png'); };
window.cmpOne = function (k) { var T = 400, cv = document.createElement('canvas'), x, PI = Math.PI, v = k === 'bird' ? 2 : 0; cv.width = T * 4; cv.height = T; x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, T * 4, T);
  [0, 0.7, PI / 2, PI].forEach(function (a, i) { x.fillStyle = '#eef2fb'; x.beginPath(); x.roundRect(i * T + 3, 3, T - 6, T - 6, 14); x.fill(); Pets.draw(x, i * T, 0, { kind: k, variant: v, size: T, angle: a, pose: { t: 0.5 } }); }); return cv.toDataURL('image/png'); }; 1`;
E.run({ page: 'sheet.html', size: [800, 600] }, async ({ ev, save }) => {
  await ev(PAGE); console.log(JSON.stringify(await ev('petStats()')));
  save(path.join(S, tag + '-seven.png'), await ev('cmpAll()'));
  for (const k of (big.length ? big : ['lion'])) save(path.join(S, tag + '-' + k + '4.png'), await ev('cmpOne("' + k + '")'));
});
