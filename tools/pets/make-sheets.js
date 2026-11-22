// node tools/pets/make-sheets.js <out dir> [kind[:variant] ...] : the contact sheet of every animal (every angle, the walk, the poses) into <out dir>/<kind>-sheet.png,
// and the numbers (triangles, draw calls) on the console. For looking at a model after a change of assets/map3d/pets3d.js.
const path = require('path'), E = require('./edge.js'), S = path.resolve(process.argv[2] || '.'), kinds = process.argv.slice(3);
E.run({ page: 'sheet.html', size: [800, 600] }, async ({ ev, save }) => {
  const all = await ev('Pets.KINDS'), st = await ev('petStats()'); console.log(JSON.stringify(st));
  for (const k of (kinds.length ? kinds : all)) { const [kind, v] = k.split(':'); save(path.join(S, kind + (v ? '-' + v : '') + '-sheet.png'), await ev('sheetURL("' + kind + '",' + (+v || 0) + ')')); console.log('saved', k); }
});
