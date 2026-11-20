// Checks the subject packs (packs/*.js): shape, answers, variety, niqqud. Usage: node tests/packs.test.js [packs/geo2.js ...]
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(root, 'packs')).filter(f => /^(geo|heb|eng)[1-5]\.js$/.test(f)).sort().map(f => 'packs/' + f);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const logic = /<script id="logic">([\s\S]*?)<\/script>/.exec(html)[1];
const BLD = 'castleSmall castleSmallAlt house1 house2 houseAlt1 houseAlt2 pyramid pyramidMayan tower towerAlt towerSmall'.split(' ');
const errs = [], seenIds = {};
let houses = 0;
function err(m) { if (errs.length < 60) errs.push(m); }
const HEB = /[א-ת]/, WORD = /[א-ת][א-ת֑-ׇ"'׳״]*/g, NIQ = /[ְ-ׇּׁׂ]/;
function niqqud(where, text) {
  String(text == null ? '' : text).replace(/<[^>]*>/g, ' ').replace(WORD, w => {
    const letters = w.replace(/[^א-ת]/g, '');
    if (letters.length >= 2 && !NIQ.test(w) && !/["״]/.test(w)) err(where + ': Hebrew word without niqqud: ' + w);
    return w;
  });
}
function svgOk(where, s) {
  if (typeof s !== 'string' || !/^<svg[\s>]/.test(s.trim()) || !/<\/svg>\s*$/.test(s) || !/viewBox=/.test(s)) err(where + ': not an <svg viewBox=…>…</svg> string');
  else if (/<script|onload=|onclick=|href=|<foreignObject/i.test(s)) err(where + ': forbidden content in svg');
  else if (/NaN|undefined|Infinity/.test(s)) err(where + ': NaN / undefined inside the svg');
}
for (const file of files) {
  const ctx = {}; vm.createContext(ctx); ctx.window = ctx;
  const before = Object.keys(ctx).length;
  try { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file }); } catch (e) { err(file + ': does not load: ' + e.message); continue; }
  const extra = Object.keys(ctx).filter(k => k !== 'window' && k !== 'TROLL_PACKS');
  if (extra.length) err(file + ': leaks globals: ' + extra.join(', '));
  const m = /(geo|heb|eng)([1-5])\.js$/.exec(file), packs = ctx.TROLL_PACKS || [];
  if (packs.length !== 1) { err(file + ': must push exactly one pack'); continue; }
  const pk = packs[0];
  if (m && (pk.sub !== m[1] || pk.grade !== +m[2])) err(file + ': sub / grade do not match the file name');
  vm.runInContext(logic + ';this.L=TrollLogic;', ctx);
  const L = ctx.L;
  if (!pk.tiles || !pk.tiles.length) err(file + ': no tiles');
  (pk.tiles || []).forEach(d => {
    const W = file + ' ' + d.id;
    if (!new RegExp('^' + pk.sub + pk.grade + '[a-z0-9]{1,8}$').test(d.id || '')) err(W + ': id must be ' + pk.sub + pk.grade + '<name>, at most 12 chars');
    if (seenIds[d.id]) err(W + ': id used twice'); seenIds[d.id] = true;
    if (BLD.indexOf(d.bld) < 0) err(W + ': unknown bld ' + d.bld);
    ['world', 'name', 'hero'].forEach(k => { if (!d[k] || typeof d[k] !== 'string') err(W + ': missing ' + k); else if (pk.sub !== 'eng' || HEB.test(d[k])) niqqud(W + ' ' + k, d[k]); });
    if (!d.icon) err(W + ': missing icon');
    const t = L.TOPICS.find(x => x.id === d.id);
    if (!t) { err(W + ': the game did not accept the tile'); return; }
    if (t.levels.length < 2 || t.levels.length > 8) err(W + ': a tile has 2-8 houses, this one has ' + t.levels.length);
    t.levels.forEach((lv, i) => {
      const H = W + ' house ' + (i + 1) + ' (' + lv.name + ')'; houses++;
      niqqud(H + ' name', lv.name);
      const keys = new Set(), fmts = {};
      for (let k = 1; k <= 400; k++) {
        let q;
        try { q = L.makeQuestion(d.id, i + 1, L.seeded(k * 7919 + i)); } catch (e) { err(H + ': throws: ' + e.message); break; }
        keys.add(q.key); fmts[q.fmt] = 1;
        if (['choice', 'tf', 'order'].indexOf(q.fmt) < 0) { err(H + ': unknown fmt ' + q.fmt); break; }
        if (!q.text && !q.svg && !q.say && !q.pic) err(H + ': an exercise with no text, drawing or spoken word');
        if (q.text.length > 90) err(H + ': question text longer than 90 chars: ' + q.text);
        if (q.rtl) niqqud(H + ' text', q.text);
        niqqud(H + ' tip', q.hint.tip);
        if (!q.ex.steps.length || q.ex.steps.some(s => !s.say)) err(H + ': an explanation step without words (give tip or ex)');
        q.ex.steps.forEach(s => { niqqud(H + ' explanation', s.say); if (s.m && s.m.t === 'html') svgOk(H + ' explanation svg', s.m.html); if (s.m && s.m.t === 'big' && !s.m.ltr) niqqud(H + ' explanation big', s.m.text); });
        if (q.svg) svgOk(H + ' svg', q.svg);
        if (q.say && (!/^[\x20-\x7E’]+$/.test(q.say.text) || q.say.text.length > 120)) err(H + ': say must be plain English, up to 120 chars: ' + q.say.text);
        if (q.fmt === 'order') {
          if (!q.parts || q.parts.length < 2 || q.parts.length > 6) { err(H + ': order needs 2-6 parts'); continue; }
          if (new Set(q.parts).size !== q.parts.length) err(H + ': order parts repeat: ' + q.parts.join('|'));
          if (q.parts.slice().sort().join('\u0001') !== String(q.answer).split(q.sep === '' ? '' : q.sep).sort().join('\u0001')) err(H + ': order parts do not make the answer: ' + q.answer);
          if (q.parts.join(q.sep) === q.answer) err(H + ': order is given already solved');
          if (q.rtl) q.parts.forEach(p => niqqud(H + ' part', p));
          continue;
        }
        const o = q.options;
        if (!Array.isArray(o) || o.length < 2 || o.length > 4) { err(H + ': needs 2-4 options, got ' + (o && o.length) + ' for ' + q.text); continue; }
        if (new Set(o.map(String)).size !== o.length) err(H + ': options repeat: ' + o.join(' | ') + ' for ' + q.text);
        if (o.filter(x => x === q.answer).length !== 1) err(H + ': the answer is not exactly one of the options: ' + q.answer + ' in ' + o.join(' | '));
        if (q.fmt === 'tf' && o.slice().sort().join() !== 'no,yes') err(H + ': tf options must be yes / no');
        o.forEach(x => {
          if (q.optHtml) { const hh = q.optHtml[x]; if (typeof hh !== 'string' || !hh) err(H + ': optHtml missing for option ' + x); else if (/^<svg/.test(hh)) svgOk(H + ' option svg', hh); else niqqud(H + ' option', hh); }
          else if (typeof x === 'string' && q.fmt !== 'tf') { if (x.length > 34) err(H + ': option longer than 34 chars: ' + x); if (!q.optLtr) niqqud(H + ' option', x); }
        });
      }
      if (keys.size < 24) err(H + ': only ' + keys.size + ' different exercises in 400 tries (need 24)');
      // a whole stage can be built without repeats
      try { const r = L.createRound(d.id, { [d.id]: i + 1 }, L.seeded(5), 7, [], null, 2, pk.grade, [d.id]); if (new Set(r.qs.map(q => q.key)).size < 7) err(H + ': a stage of 7 repeats an exercise'); } catch (e) { err(H + ': createRound throws: ' + e.message); }
    });
  });
}
if (errs.length) { console.log('PACKS FAIL (' + errs.length + (errs.length >= 60 ? '+' : '') + ')\n' + [...new Set(errs)].join('\n')); process.exit(1); }
console.log('PACKS OK ' + files.length + ' files, ' + houses + ' houses');
