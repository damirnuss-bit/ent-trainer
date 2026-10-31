// Проверка текстов интерфейса: ключи ru и kk совпадают, нет смеси латиницы и кириллицы в слове,
// нет длинных тире в проекте. Запуск: node tests/text-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STR } from '../js/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

const flat = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, pre + k + '.') : [[pre + k, v]]));
const ru = flat(STR.ru), kk = flat(STR.kk);
const kRu = ru.map((x) => x[0]).sort().join(), kKk = kk.map((x) => x[0]).sort().join();
if (kRu !== kKk) {
  const a = new Set(ru.map((x) => x[0])), b = new Set(kk.map((x) => x[0]));
  fail('ключи не совпадают: нет в kk: ' + [...a].filter((x) => !b.has(x)).join(',') + '; нет в ru: ' + [...b].filter((x) => !a.has(x)).join(','));
}

const mixed = /[^\s]*(?:[Ѐ-ӿ][A-Za-z]|[A-Za-z][Ѐ-ӿ])[^\s]*/g;
const text = (v) => (typeof v === 'function' ? v(7, 20, 3) : String(v));
for (const [lang, rows] of [['ru', ru], ['kk', kk]]) {
  for (const [k, v] of rows) {
    const s = text(v);
    const m = s.match(mixed);
    if (m) fail(`${lang}.${k}: смесь алфавитов в слове: ${m.join(' | ')}`);
    if (/[—–]/.test(s)) fail(`${lang}.${k}: длинное тире`);
    if (/undefined|NaN/.test(s)) fail(`${lang}.${k}: undefined/NaN`);
  }
}

// длинные тире во всех текстовых файлах проекта (кроме самого теста)
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
for (const f of walk(root)) {
  if (!/\.(js|mjs|json|html|css|md|py|gs|webmanifest)$/.test(f) || f.includes('tests/')) continue;
  const s = fs.readFileSync(f, 'utf8');
  const lines = s.split('\n');
  lines.forEach((l, i) => { if (/[—–]/.test(l)) fail(`${path.relative(root, f)}:${i + 1}: длинное тире`); });
}

console.log('Ошибок:', bad);
process.exit(bad ? 1 : 0);
