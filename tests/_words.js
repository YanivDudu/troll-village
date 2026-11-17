// Lists Hebrew words inside JS string literals of index.html that have no niqqud yet.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
function literals(src) { // returns [{start, end}] of string literal contents
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      out.push({ start: i + 1, end: j }); i = j + 1; continue;
    }
    i++;
  }
  return out;
}
module.exports = { literals };
if (require.main === module) {
  const words = new Map();
  for (const id of ['logic', 'ui']) {
    const a = html.indexOf('<script id="' + id + '">'), b = html.indexOf('</script>', a), src = html.slice(a, b);
    for (const l of literals(src)) {
      const s = src.slice(l.start, l.end);
      for (const m of s.matchAll(/[ְ-ׇא-ת]+/g)) {
        if (/[ְ-ׇ]/.test(m[0])) continue;
        if (!words.has(m[0])) words.set(m[0], s.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12));
      }
    }
  }
  console.log(words.size + ' words');
  console.log([...words.keys()].join(' '));
}
