// Appends words to the niqqud dictionary in tests/_nikud.js.  Usage: node tests/_adddict.js "word vocalised|word vocalised|..."
const fs = require('fs');
let k = fs.readFileSync('tests/_nikud.js', 'utf8');
const add = process.argv[2] || fs.readFileSync('tests/_newwords.txt', 'utf8').trim();
const end = k.indexOf('`;\nconst dict');
if (end < 0) throw new Error('dictionary end not found');
k = k.slice(0, end) + '|' + add.replace(/\s*\n\s*/g, '|') + k.slice(end);
fs.writeFileSync('tests/_nikud.js', k);
console.log('added ' + add.split(/\||\n/).length + ' entries');
