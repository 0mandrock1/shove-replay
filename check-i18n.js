'use strict';
// i18n coverage check — asserts every {en,ua} leaf in i18n.js has BOTH halves,
// both non-empty strings. Run: node check-i18n.js  (exit 1 on any gap).
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/i18n.js', 'utf8');
const fn = new Function('localStorage', code + '\nreturn I18N;');
const I18N = fn({ getItem: () => null, setItem: () => {} });

const bad = [];
const isLeaf = (o) => o && typeof o === 'object' && ('en' in o || 'ua' in o);
function checkLeaf(path, o){
  ['en', 'ua'].forEach(k => {
    if (typeof o[k] !== 'string' || o[k].length === 0) bad.push(`${path}: missing/empty '${k}'`);
  });
}

// flat string dict
Object.entries(I18N.str).forEach(([k, v]) => {
  if (!isLeaf(v)) { bad.push(`str.${k}: not a {en,ua} leaf`); return; }
  checkLeaf(`str.${k}`, v);
});

// arrays whose entries carry {en,ua} description leaves
const arrays = {
  legend:      { arr: I18N.legend,       leafIdx: [2] },
  glossMech:   { arr: I18N.glossMech,    leafIdx: [1, 2] },
  glossTactics:{ arr: I18N.glossTactics, leafIdx: [1, 2] },
};
Object.entries(arrays).forEach(([name, { arr, leafIdx }]) => {
  arr.forEach((row, i) => leafIdx.forEach(j => {
    if (!isLeaf(row[j])) { bad.push(`${name}[${i}][${j}]: not a {en,ua} leaf`); return; }
    checkLeaf(`${name}[${i}][${j}]`, row[j]);
  }));
});

const counts = `str=${Object.keys(I18N.str).length} legend=${I18N.legend.length} ` +
  `glossMech=${I18N.glossMech.length} glossTactics=${I18N.glossTactics.length}`;
if (bad.length){
  console.error('i18n FAIL (' + counts + '):\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('i18n OK — ' + counts + '; every leaf has en+ua.');
