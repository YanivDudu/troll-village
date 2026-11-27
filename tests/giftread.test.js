// Checks the reading passages of the gifted stage-A tile (packs/giftread.js): shape, one right answer, the trap, niqqud, lengths.
// Usage: node tests/giftread.test.js   (LEN=1 prints the bare length of every line)
const fs = require('fs'), path = require('path');
const P = require('../packs/giftread.js');
const bad = [], err = (where, msg) => bad.push(where + ': ' + msg);
const bare = s => String(s).replace(/[֑-ׇ]/g, '');
const letters = s => bare(s).replace(/[^א-ת]/g, '');
const NIQ = /[ְ-ׇ]/, TYPES = ['detail', 'trap', 'word', 'why', 'infer'];
function text(where, s) {
  if (typeof s !== 'string' || !s.trim()) return err(where, 'empty string');
  if (/[A-Za-z]/.test(s)) err(where, 'Latin letters: ' + s);
  (s.match(/[א-ת][֑-ׇא-ת]*/g) || []).forEach(w => { if (bare(w).length >= 2 && !NIQ.test(w)) err(where, 'word without niqqud: ' + w); });
}
function cp(e) { return Array.from(e).map(c => c.codePointAt(0).toString(16)).filter(x => x !== 'fe0f').join('-'); }
const ids = {}, perLv = { 1: 0, 2: 0, 3: 0 }, pos = [0, 0, 0, 0], kinds = {}; let nq = 0;
if (!Array.isArray(P) || P.length < 12) err('bank', 'needs at least 12 passages, has ' + (P && P.length));
(P || []).forEach((p, pi) => {
  const W = 'passage ' + (p.id || pi);
  if (!/^[a-z]{3,10}$/.test(p.id || '')) err(W, 'bad id');
  if (ids[p.id]) err(W, 'id used twice'); ids[p.id] = 1;
  if ([1, 2, 3].indexOf(p.lv) < 0) err(W, 'lv must be 1..3'); else perLv[p.lv]++;
  text(W + ' title', p.title);
  if (typeof p.pic !== 'string' || !fs.existsSync(path.join(__dirname, '..', 'assets', 'ico', cp(p.pic) + '.png'))) err(W, 'pic has no file in assets/ico: ' + p.pic);
  if (!Array.isArray(p.lines) || p.lines.length !== 9) err(W, 'needs exactly 9 lines');
  (p.lines || []).forEach((l, i) => {
    text(W + ' line ' + (i + 1), l);
    const n = bare(l).length; if (process.env.LEN) console.log(p.id, i + 1, n);
    if (n < 38 || n > 50) err(W + ' line ' + (i + 1), 'length ' + n + ' (38-50): ' + bare(l));
  });
  if (!Array.isArray(p.qs) || p.qs.length !== 4) err(W, 'needs exactly 4 questions');
  let trap = 0, ww = 0;
  (p.qs || []).forEach((q, qi) => {
    const Q = W + ' q' + (qi + 1); nq++;
    if (TYPES.indexOf(q.type) < 0) err(Q, 'bad type ' + q.type); kinds[q.type] = (kinds[q.type] || 0) + 1;
    text(Q + ' q', q.q);
    if (!(q.line >= 1 && q.line <= 9 && Math.floor(q.line) === q.line)) err(Q, 'line must be 1..9');
    if (!Array.isArray(q.opts) || q.opts.length !== 4) err(Q, 'needs exactly 4 options');
    else {
      if (new Set(q.opts.map(bare)).size !== 4) err(Q, 'options are not all different');
      q.opts.forEach((o, k) => { text(Q + ' option ' + k, o); if (bare(o).length > 34) err(Q, 'option longer than 34: ' + bare(o) + ' (' + bare(o).length + ')'); if (/\.$/.test(o)) err(Q, 'option ends with a full stop'); });
    }
    if ([0, 1, 2, 3].indexOf(q.a) < 0) err(Q, 'a must be 0..3'); else pos[q.a]++;
    if (q.type === 'trap') { trap++; if ([0, 1, 2, 3].indexOf(q.trap) < 0 || q.trap === q.a) err(Q, 'trap index must be 0..3 and not the answer'); }
    else if (q.trap != null) err(Q, 'trap index on a question that is not a trap');
    if (!Array.isArray(q.ex) || q.ex.length < 2 || q.ex.length > 3) err(Q, 'ex needs 2-3 sentences'); else q.ex.forEach((s, k) => text(Q + ' ex ' + k, s));
    if (q.type === 'word' || q.type === 'why') {
      ww++;
      const m = /"([^"]+)"/.exec(q.q), L = p.lines || [], li = q.line - 1;
      if (!new RegExp('שׁוּרָה ' + q.line + '(?!\\d)').test(q.q)) err(Q, 'the question does not name line ' + q.line);
      if (!m) err(Q, 'no quoted ' + (q.type === 'word' ? 'word' : 'phrase') + ' in the question');
      else if (q.type === 'word') { if (letters(L[li] || '').indexOf(letters(m[1])) < 0) err(Q, 'the word ' + m[1] + ' is not in line ' + q.line); if (/\s/.test(m[1])) err(Q, 'a word question quotes one word'); }
      else if (letters((L[li - 1] || '') + (L[li] || '')).indexOf(letters(m[1])) < 0 && letters((L[li] || '') + (L[li + 1] || '')).indexOf(letters(m[1])) < 0) err(Q, 'the phrase ' + m[1] + ' is not in line ' + q.line + ' or beside it');
    }
  });
  if (trap < 1) err(W, 'no trap question');
  if (ww < 1) err(W, 'no word or why question');
});
[1, 2, 3].forEach(l => { if (perLv[l] < 4) err('bank', 'level ' + l + ' has ' + perLv[l] + ' passages (4 needed)'); });
if ((kinds.word || 0) < 6) err('bank', 'only ' + (kinds.word || 0) + ' word questions (6 needed)');
if ((kinds.why || 0) < 6) err('bank', 'only ' + (kinds.why || 0) + ' why questions (6 needed)');
pos.forEach((n, i) => { const r = n / Math.max(1, nq); if (r < 0.15 || r > 0.35) err('bank', 'answer position ' + i + ' is right in ' + Math.round(r * 100) + '% of the questions (15-35%)'); });
if (bad.length) { console.log(bad.join('\n')); console.log('GIFTREAD FAIL ' + bad.length); process.exit(1); }
console.log('GIFTREAD OK ' + P.length + ' passages, ' + nq + ' questions (answers at ' + pos.join('/') + '; ' + Object.keys(kinds).map(k => k + ' ' + kinds[k]).join(', ') + ')');
