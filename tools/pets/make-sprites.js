// node tools/pets/make-sprites.js [kind ...] : the pictures of the living pets, made from the 3D models of assets/map3d/pets3d.js (headless Edge with software WebGL).
// For every animal two files in assets/pets:
//   <kind>.webp    the sheet: 8 columns = 8 directions (0 = towards the viewer, then turning by 45 degrees: 1 = three quarters to the right of the screen,
//                  2 = to the right, 4 = away, 6 = to the left), 8 rows = stand, 4 walk frames, sit, sleep, happy (the top of a jump). CELL px a cell, no shadow.
//   <kind>_s.webp  the stills: 4 cells of STILL px = standing three quarters to the right, to the left, sitting to the right, to the left; with the soft shadow.
// In every cell the ground under the animal is at the same height (GROUND of the cell from its top), and an animal has ONE scale in all its poses (the
// largest at which no pose touches the edge of its cell), so a picture can change its pose in place and the game draws one shadow for all of them
// (.pt3 .psh in index.html).
// The colour of every animal is VARIANT below (the game's table PET3 in index.html says the same; change both together).
// CELL=112 QUALITY=0.7 by default. Writes assets/pets/sprites.json (sizes, scales and bytes).
const path = require('path'), fs = require('fs'), E = require('./edge.js'), OUT = path.resolve(__dirname, '..', '..', 'assets', 'pets');
const CELL = +(process.env.CELL || 112), STILL = +(process.env.STILL || 144), Q = +(process.env.QUALITY || 0.7), VARIANT = { bird: 2 }, GROUND = 0.86, only = process.argv.slice(2), DIR = process.env.OUT ? path.resolve(process.env.OUT) : OUT;
// in the page. frameOf: the options of Pets.draw that put the ground at G of the cell and keep the scale of an upright animal the same when it is not upright.
// drawAll: every [angle, pose] of the list into one picture of cols columns; touch = how many cells have something on their top, left or right edge (a tail that lies towards the viewer may leave a cell at the bottom).
const PAGE = `window.frameOf = function (kind, pose, zoom, G) { Pets.render({ kind: kind, size: 8 }); var d = Pets.defs[kind], fr = d.frame || [d.H * 0.6, d.H * 0.47];
  var up = !!(d.upright && pose.up !== 0 && !pose.gait && !pose.sit && !pose.lie && !pose.sleep), z = d.upright && !up ? zoom / 1.25 : zoom, he = fr[0] * d.size / z * (up ? 1.25 : 1);
  return { zoom: z, lift: (2 * G - 1) * he / Math.cos(0.3) / (up ? 1.3 : 1) - fr[1] * d.size }; };
window.drawAll = function (kind, variant, zoom, G, n, cols, list, opt, q) { var c = document.createElement('canvas'), x, touch = 0; c.width = cols * n; c.height = Math.ceil(list.length / cols) * n; x = c.getContext('2d', { willReadFrequently: true });
  list.forEach(function (p, i) { var X = i % cols * n, Y = Math.floor(i / cols) * n, f = frameOf(kind, p[1], zoom, G), o = { kind: kind, variant: variant, size: n, angle: p[0], pose: p[1], lift: f.lift, zoom: f.zoom }, k, a, j; for (k in opt) o[k] = opt[k];
    Pets.draw(x, X, Y, o); a = x.getImageData(X, Y, n, n).data;
    for (j = 0; j < n; j++) if (a[j * 4 + 3] > 40 || a[j * n * 4 + 3] > 40 || a[(j * n + n - 1) * 4 + 3] > 40) { touch++; break; } });
  return JSON.stringify({ touch: touch, url: c.toDataURL('image/webp', q) }); };
window.SHEET = (function () { var S = Pets.SPR, l = []; S.rows.forEach(function (row) { for (var d = 0; d < S.cols; d++) l.push([d * Math.PI / 4, Pets.SPR_POSE[row]]); }); return l; })();
window.STILLS = [[Math.PI / 4, { t: 0.5 }], [-Math.PI / 4, { t: 0.5 }], [Math.PI / 4, { sit: 1, t: 0.5 }], [-Math.PI / 4, { sit: 1, t: 0.5 }]]; 1`;
E.run({ page: 'sheet.html', size: [800, 600] }, async ({ ev, save }) => {
  await ev(PAGE);
  const M = JSON.parse(await ev('JSON.stringify({ cols: Pets.SPR.cols, rows: Pets.SPR.rows, kinds: Pets.KINDS })')); let total = 0;
  let old = {}; try { old = JSON.parse(fs.readFileSync(path.join(OUT, 'sprites.json'), 'utf8')); } catch (e) {}
  M.cell = CELL; M.still = STILL; M.ground = GROUND; M.stills = ['stand right', 'stand left', 'sit right', 'sit left']; M.variant = {}; M.zoom = Object.assign({}, old.zoom); M.bytes = Object.assign({}, old.bytes); M.stillBytes = Object.assign({}, old.stillBytes);
  for (const k of M.kinds) { const v = VARIANT[k] || 0; M.variant[k] = v; if (only.length && only.indexOf(k) < 0) continue;
    const draw = async (zoom, n, cols, list, opt, q) => JSON.parse(await ev(`drawAll('${k}', ${v}, ${zoom}, ${GROUND}, ${n}, ${cols}, ${list}, ${opt}, ${q})`));
    let z = 0.9, r; do { z = +(z - 0.04).toFixed(2); r = await draw(z, CELL, 8, 'SHEET', '{ outline: 0.04, shadow: false }', Q); } while (r.touch && z > 0.7);
    const f = path.join(DIR, k + '.webp'); save(f, r.url); M.bytes[k] = fs.statSync(f).size;
    let z2 = 1.1, r2; do { z2 = +(z2 - 0.04).toFixed(2); r2 = await draw(z2, STILL, 4, 'STILLS', '{ outline: 0.03, shadow: true }', Math.min(0.9, Q + 0.06)); } while (r2.touch && z2 > 0.86);
    const f2 = path.join(DIR, k + '_s.webp'); save(f2, r2.url); M.stillBytes[k] = fs.statSync(f2).size; M.zoom[k] = [z, z2]; total += M.bytes[k] + M.stillBytes[k];
    console.log(k, 'sheet', M.bytes[k], 'zoom', z, r.touch ? 'TOUCHES ' + r.touch : '', '| stills', M.stillBytes[k], 'zoom', z2, r2.touch ? 'TOUCHES ' + r2.touch : ''); }
  if (DIR === OUT) fs.writeFileSync(path.join(OUT, 'sprites.json'), JSON.stringify(M, null, 1)); console.log('total', total, 'cell', CELL);
});
