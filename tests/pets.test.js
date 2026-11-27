// node tests/pets.test.js : task "pets". The seven living pets as items of the cart (old ids and prices kept), the rule of two pets per troll
// (dress[troll].pet + the optional dress[troll].pet2), what loading does with old data, with data that an older page saved and with unowned ids,
// and the files of the pictures. Pure: the logic block of index.html in Node.
const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path'), root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ctx = {}; vm.createContext(ctx); vm.runInContext(/<script id="logic">([\s\S]*?)<\/script>/.exec(html)[1] + ';this.L=TrollLogic;', ctx);
const L = ctx.L; let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };
const plain = x => JSON.parse(JSON.stringify(x));
// every pet of the cart before this task, with its price in coins: none may disappear or change its price
const OLD = { ladybug: 20, bee: 20, chick: 30, frog: 30, turtle: 36, hamster: 40, bunny: 44, puppy: 50, kitty: 50, penguin: 56, fox: 60, owl: 60, octopus: 64, panda: 70, dino: 80, unicorn: 90, dragon: 100,
  snail: 20, fish: 28, hen: 32, duck: 32, piggy: 40, cow: 44, squirrel: 44, hedgehog: 48, monkey: 52, koala: 56, parrot: 60, tiger: 68, dolphin: 72, zebra: 72, lion: 76, giraffe: 80, elephant: 84, whale: 88 };
const LIVING = { puppy: 'dog', kitty: 'cat', chick: 'bird', monkey: 'monkey', lion: 'lion', croc: 'croc', elephant: 'elephant' };

t('items: the seven living pets; every old pet is still there at its old price; the crocodile is the one new item', () => {
  const pets = L.ITEMS.filter(it => it.slot === 'pet');
  for (const id in OLD) { assert(L.ITEM[id] && L.ITEM[id].slot === 'pet', id); assert.strictEqual(L.priceOf(L.newState(2), id), OLD[id], id); }
  assert.deepStrictEqual(plain(pets.map(it => it.id).filter(id => !(id in OLD))), ['croc']);
  assert.strictEqual(L.ITEM.croc.price, 64); assert(L.ITEM.croc.price > L.ITEM.monkey.price && L.ITEM.croc.price < L.ITEM.lion.price);
  assert.deepStrictEqual(plain(Object.fromEntries(pets.filter(it => it.pet3).map(it => [it.id, it.pet3]))), Object.fromEntries(Object.keys(LIVING).sort((a, b) => L.ITEM[a].price - L.ITEM[b].price || pets.indexOf(L.ITEM[a]) - pets.indexOf(L.ITEM[b])).map(id => [id, LIVING[id]])));
  assert.strictEqual(new Set(Object.values(LIVING)).size, 7);
  for (const id in LIVING) { const it = L.ITEM[id]; assert(Number.isInteger(it.pv) && it.pv >= 0 && it.pv < 3, id); assert(it.name && it.e, id); }
  assert.strictEqual(L.ITEM.chick.pv, 2, 'the chick is the yellow bird'); assert.strictEqual(L.ITEM.fox.pet3, undefined);
  assert.strictEqual(L.PET_MAX, 2);
  assert(L.ITEMS.every(it => it.slot !== 'pet2') && L.EMOJI_SLOTS.indexOf('pet2') < 0, 'pet2 is a key of the dress, not a category');
});

t('pictures: the sheet and the stills of every animal exist, are WebP and have the size the code expects; the 3D models are there', () => {
  const meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/pets/sprites.json'), 'utf8'));
  const size = f => { const b = fs.readFileSync(f); assert.strictEqual(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', f); const i = b.indexOf('VP8X'); assert(i > 0, f + ': a picture with transparency'); return [1 + b.readUIntLE(i + 12, 3), 1 + b.readUIntLE(i + 15, 3)]; };
  for (const k of Object.values(LIVING)) {
    assert.deepStrictEqual(size(path.join(root, 'assets/pets', k + '.webp')), [8 * meta.cell, 8 * meta.cell], k);
    assert.deepStrictEqual(size(path.join(root, 'assets/pets', k + '_s.webp')), [4 * meta.still, meta.still], k);
    assert(fs.statSync(path.join(root, 'assets/pets', k + '.webp')).size < 130000, k + ': a sheet stays under 130 KB');
    assert(fs.statSync(path.join(root, 'assets/pets', k + '_s.webp')).size < 25000, k + ': the stills stay under 25 KB');
    assert.strictEqual(meta.variant[k], L.ITEM[Object.keys(LIVING).find(id => LIVING[id] === k)].pv, k + ': the pictures were made in the colour the game names');
  }
  const js = fs.readFileSync(path.join(root, 'assets/map3d/pets3d.js'), 'utf8');
  for (const k of Object.values(LIVING)) assert(new RegExp('\\b' + k + ': function \\(R, v\\)').test(js), k);
  assert(/assets\/map3d\/pets3d\.js/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')), 'the worker saves the 3D models for a start without a network');
  assert(/function petActors\(trollId\)/.test(html) && /function petKind\(itemId\)/.test(html), 'the two names the 3D camp and maps are coded against');
});

t('two pets at most: the third takes the place of the older one', () => {
  assert.deepStrictEqual(plain(L.petsAdd([], 'puppy')), ['puppy']);
  assert.deepStrictEqual(plain(L.petsAdd(['puppy'], 'lion')), ['puppy', 'lion']);
  assert.deepStrictEqual(plain(L.petsAdd(['puppy', 'lion'], 'croc')), ['lion', 'croc']);
  assert.deepStrictEqual(plain(L.petsAdd(['lion', 'croc'], 'lion')), ['lion', 'croc'], 'one that is already there changes nothing');
  assert.deepStrictEqual(plain(L.petsAdd(['lion'], 'tophat')), ['lion'], 'not a pet');
  assert.deepStrictEqual(plain(L.petsAdd(['lion'], 'nothing')), ['lion']);
  assert.deepStrictEqual(plain(L.petsAdd(null, '')), []);
  assert.deepStrictEqual(plain(L.petsOf({ pet: 'fox' })), ['fox']);
  assert.deepStrictEqual(plain(L.petsOf({ pet: 'fox', pet2: 'croc' })), ['fox', 'croc']);
  assert.deepStrictEqual(plain(L.petsOf({ pet: 'fox', pet2: 'fox' })), ['fox']);
  assert.deepStrictEqual(plain(L.petsOf({ pet: '', pet2: 'croc' })), ['croc']);
  assert.deepStrictEqual(plain(L.petsOf({ pet: 'fox', pet2: 'tophat' })), ['fox']);
  assert.deepStrictEqual(plain(L.petsOf({ pet: 'fox', pet2: 'croc' }, ['fox'])), ['fox'], 'with the list of owned items an unowned second pet does not count');
  assert.deepStrictEqual(plain(L.petsOf(undefined)), []);
});

t('choosing and sending away: only owned animals, a new state every time, an animal may go with several trolls', () => {
  let s = L.newState(2); s.owned = [5, 42]; s.buddy = 5; s.items = s.items.concat(['puppy', 'lion', 'fox']); s.dress = { 5: { hat: 'tophat', pet: 'fox' } };
  const before = JSON.stringify(s);
  const a = L.petPut(s, 5, 'lion');
  assert.strictEqual(JSON.stringify(s), before, 'never mutates'); assert.notStrictEqual(a, s); assert.notStrictEqual(a.dress, s.dress);
  assert.deepStrictEqual(plain(a.dress[5]), { hat: 'tophat', pet: 'fox', pet2: 'lion' }); assert.strictEqual(a.v, s.v);
  const b = L.petPut(a, 5, 'puppy'); assert.deepStrictEqual(plain(b.dress[5]), { hat: 'tophat', pet: 'lion', pet2: 'puppy' }, 'the older one (the fox) made room');
  assert.deepStrictEqual(plain(b.items), plain(s.items), 'the fox is still owned'); assert.strictEqual(b.coins, s.coins);
  assert.strictEqual(L.petPut(b, 5, 'croc'), b, 'not owned: nothing happens'); assert.strictEqual(L.petPut(b, 5, 'tophat'), b);
  const c = L.petPut(b, 42, 'puppy'); assert.deepStrictEqual(plain(c.dress[42]), { pet: 'puppy' }); assert.deepStrictEqual(plain(c.dress[5]), plain(b.dress[5]), 'the same dog goes with two trolls');
  const d = L.petDrop(c, 5, 'lion'); assert.deepStrictEqual(plain(d.dress[5]), { hat: 'tophat', pet: 'puppy' }, 'the one that stays is the pet');
  const e = L.petDrop(c, 5, 'puppy'); assert.deepStrictEqual(plain(e.dress[5]), { hat: 'tophat', pet: 'lion' });
  const f = L.petDrop(c, 5, ''); assert.deepStrictEqual(plain(f.dress[5]), { hat: 'tophat', pet: '' }, 'without: both leave');
  assert.deepStrictEqual(plain(L.petsOf(L.loadState(JSON.stringify(f)).dress[5])), []);
  assert.deepStrictEqual(plain(L.petDrop(c, 5, 'whale').dress[5]), plain(c.dress[5]), 'one that is not there');
  assert.deepStrictEqual(plain(L.petPut(L.petPut(s, 7, 'lion'), 7, 'lion').dress[7]), { pet: 'lion' }, 'a troll without a dress yet; twice the same');
});

t('loading: old data is untouched; the second pet survives only when it is an owned pet; nothing owned is ever dropped', () => {
  let s = L.newState(2); s.owned = [5, 42, 79]; s.buddy = 5; s.coins = 77; s.items = s.items.concat(['kitty', 'tophat', 'puppy', 'lion', 'croc', 'fox']);
  s.dress = { 5: { pet: 'kitty', hat: 'tophat', hand: '' }, 42: { pet: 'fox', pet2: 'croc' }, 79: { hair: 2 } };
  const r = L.loadState(JSON.stringify(s));
  assert.deepStrictEqual(plain(r.dress[5]), { hat: 'tophat', pet: 'kitty' }, 'a save from before the task: exactly as it loaded before');
  assert.deepStrictEqual(plain(r.dress[42]), { pet: 'fox', pet2: 'croc' }); assert.deepStrictEqual(plain(r.dress[79]), { hair: 2 });
  assert.strictEqual(r.v, 4); assert.strictEqual(L.newState(2).v, 4, 'the version of the save did not change');
  assert.strictEqual(JSON.stringify(L.loadState(JSON.stringify(r))), JSON.stringify(r), 'loading twice changes nothing');
  assert(!('pet2' in L.newState(2)) && !JSON.stringify(L.newState(2)).includes('pet2'));
  const bad = (d, want, why) => { const x = plain(s); x.dress[42] = d; assert.deepStrictEqual(plain(L.loadState(JSON.stringify(x)).dress[42]), want, why); };
  bad({ pet: 'fox', pet2: 'whale' }, { pet: 'fox' }, 'a second pet that is not owned');
  bad({ pet: 'fox', pet2: 'fox' }, { pet: 'fox' }, 'the same animal twice');
  bad({ pet: 'fox', pet2: 'tophat' }, { pet: 'fox' }, 'not a pet');
  bad({ pet: 'fox', pet2: 7 }, { pet: 'fox' }, 'not a string'); bad({ pet: 'fox', pet2: { a: 1 } }, { pet: 'fox' }, 'an object'); bad({ pet: 'fox', pet2: '__proto__' }, { pet: 'fox' }, 'a strange name');
  bad({ pet2: 'croc' }, { pet: 'croc' }, 'a second pet alone is simply the pet'); bad({ pet: '', pet2: 'lion' }, { pet: 'lion' }, 'the first was taken off by an older page');
  bad({ pet: 'nothing', pet2: 'lion' }, { pet: 'lion' }, 'an unknown first pet');
  bad({ pet: 'whale', pet2: 'croc' }, { pet: 'whale', pet2: 'croc' }, 'the old field is read as it always was (no ownership check there)');
  // an older page: it does not know dress.pet2, so it loads the state without it and saves that. Nothing that is owned is lost by it.
  const older = plain(r); Object.keys(older.dress).forEach(k => { delete older.dress[k].pet2; });
  const back = L.loadState(JSON.stringify(older));
  assert.deepStrictEqual(plain(back.dress[42]), { pet: 'fox' }, 'only the second choice is gone');
  assert.deepStrictEqual(plain(back.items), plain(r.items)); assert.strictEqual(back.coins, 77); assert.deepStrictEqual(plain(back.owned), [5, 42, 79]);
  assert.deepStrictEqual(plain(L.petPut(back, 42, 'croc').dress[42]), { pet: 'fox', pet2: 'croc' }, 'and it is chosen again with one tap');
});

t('the public record of a player (the dress of the companion as text, at most 200 characters) still fits with a second pet', () => {
  const longest = slot => L.ITEMS.filter(it => it.slot === slot).map(it => it.id).sort((a, b) => b.length - a.length)[0];
  const d = { hair: 5, hairColor: '#ff4f9a', body: '#8fd3ff', acc: 'sunglasses', hat: longest('hat'), face: longest('face'), hand: longest('hand'), pet: longest('pet'), pet2: 'elephant' };
  assert(JSON.stringify(d).length <= 200, JSON.stringify(d).length + ' characters');
});

t('the gift of the day can bring the crocodile like any other item; buying it costs its price once', () => {
  let s = L.newState(2); s.coins = 64; const r = L.buy(s, 'croc'); assert(r.ok && r.state.coins === 0 && r.state.items.includes('croc'));
  assert(!L.buy(r.state, 'croc').ok); s.coins = 63; assert(!L.buy(s, 'croc').ok);
});

// task "animals": the flat pets are no longer for sale, and nothing a child owns changes
t('the 29 flat pets are no longer for sale: still in the catalogue at their price, never a gift; an owned one loads, is worn and is chosen as before', () => {
  const flat = L.ITEMS.filter(it => it.slot === 'pet' && !it.pet3).map(it => it.id);
  assert.strictEqual(flat.length, 29); assert.deepStrictEqual(plain(flat.slice().sort()), Object.keys(OLD).filter(id => !(id in LIVING)).sort());
  assert.deepStrictEqual(plain(L.ITEMS.filter(it => it.off).map(it => it.id)), plain(flat), 'only they are off');
  for (const id of flat) { assert(!L.forSale(id), id); assert.strictEqual(L.ITEM[id].slot, 'pet'); assert.strictEqual(L.priceOf(L.newState(2), id), OLD[id]); }
  for (const id in LIVING) assert(L.forSale(id), id);
  assert(L.forSale('shades') && L.forSale('tophat') && !L.forSale('nothing'));
  const got = new Set(), have = L.newState(2).items.slice(); for (;;) { const id = L.rollItem(have, Math.random); if (!id) break; got.add(id); have.push(id); }
  assert(flat.every(id => !got.has(id)), 'the surprise item of the gift is never a flat pet'); assert.strictEqual(got.size, L.ITEMS.filter(it => !it.off && it.price).length);
  assert.strictEqual(L.rollItem(L.ITEMS.filter(it => !it.off).map(it => it.id), Math.random), null, 'everything that is for sale is owned: no item');
  // a child who owns flat pets, wears two of them and saves for a third
  let s = L.newState(2); s.owned = [5, 42]; s.buddy = 5; s.coins = 30; s.items = s.items.concat(['fox', 'dragon', 'owl', 'puppy']); s.dress = { 5: { pet: 'fox', pet2: 'dragon', hat: 'tophat' }, 42: { pet: 'owl' } }; s.items.push('tophat'); s.fx = { goal: 'unicorn' };
  const r = L.loadState(JSON.stringify(s));
  assert.deepStrictEqual(plain(r.items), plain(s.items), 'every owned item is still owned'); assert.deepStrictEqual(plain(r.dress[5]), { hat: 'tophat', pet: 'fox', pet2: 'dragon' }); assert.deepStrictEqual(plain(r.dress[42]), { pet: 'owl' });
  assert.strictEqual(r.v, 4); assert.strictEqual(r.coins, 30); assert.strictEqual(L.goalOf(r).id, 'unicorn', 'the goal a child set is still the goal');
  assert.deepStrictEqual(plain(L.petsOf(r.dress[5], r.items)), ['fox', 'dragon']);
  assert.deepStrictEqual(plain(L.petPut(r, 42, 'dragon').dress[42]), { pet: 'owl', pet2: 'dragon' }, 'an owned flat pet joins another troll');
  assert.deepStrictEqual(plain(L.petPut(L.petDrop(r, 5, 'fox'), 5, 'fox').dress[5]), { hat: 'tophat', pet: 'dragon', pet2: 'fox' }, 'sent away and chosen again');
  assert.strictEqual(JSON.stringify(L.loadState(JSON.stringify(r))), JSON.stringify(r));
});
t('the glasses have no category of their own, and nothing about the items changed: same ids, slot and prices', () => {
  const FACE = { specs: 16, goggles: 24, shades: 28, diving: 32, mask: 40 };
  assert.deepStrictEqual(plain(L.ITEMS.filter(it => it.slot === 'face').map(it => it.id)), Object.keys(FACE));
  for (const id in FACE) { assert.strictEqual(L.priceOf(L.newState(2), id), FACE[id], id); assert(L.forSale(id)); }
  assert(L.EMOJI_SLOTS.indexOf('face') >= 0, 'still its own slot on the troll');
  let s = L.newState(2); s.owned = [5]; s.items = s.items.concat(['shades', 'sunglasses']); s.dress = { 5: { face: 'shades', acc: 'sunglasses' } };
  assert.deepStrictEqual(plain(L.loadState(JSON.stringify(s)).dress[5]), { acc: 'sunglasses', face: 'shades' }, 'worn as before, together with an accessory');
  assert(/var TABS = \[(?:(?!\]\];)[\s\S])*\]\];/.test(html) && !/\['face', '[^']*', 'glasses'\]/.test(html), 'no tab of the cart is the slot face');
});
console.log('all ' + n + ' passed (pets)');
