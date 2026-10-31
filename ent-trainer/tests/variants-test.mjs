// Проверка вариантов пробного ЕНТ: в каждом варианте 120 заданий, вопросы из банка в разных вариантах не повторяются,
// в каждом варианте нужное число заданий на несколько ответов и на соответствие. Запуск: node tests/variants-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRACKS, SUBJECTS } from '../js/subjects.js';
import { setBank, buildFullExam, VARIANTS } from '../js/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/bank');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) setBank(f.replace('.json', ''), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
for (const track of Object.keys(TRACKS)) {
  const seenBy = {};
  for (let v = 0; v < VARIANTS; v++) {
    for (let rep = 0; rep < 20; rep++) {
      const ex = buildFullExam(track, v);
      if (ex.length !== 120) fail(`${track} вариант ${v + 1}: ${ex.length} заданий вместо 120`);
      const ids = new Set();
      for (const q of ex) {
        if (ids.has(q.id)) fail(`${track} вариант ${v + 1}: повтор ${q.id}`); ids.add(q.id);
        if (!q.gen) { const o = seenBy[q.id]; if (o !== undefined && o !== v) fail(`${track}: вопрос ${q.id} есть в вариантах ${o + 1} и ${v + 1}`); seenBy[q.id] = v; }
      }
      const per = {};
      for (const q of ex) { const k = q.subject; (per[k] = per[k] || { single: 0, multiple: 0, match: 0 })[q.type]++; }
      for (const [s, c] of Object.entries(per)) {
        if (SUBJECTS[s].profile && (c.multiple !== 5 || c.match !== 5)) fail(`${track} вариант ${v + 1} ${s}: multiple ${c.multiple}, match ${c.match} (нужно 5 и 5)`);
        const n = c.single + c.multiple + c.match;
        if (n !== SUBJECTS[s].n) fail(`${track} вариант ${v + 1} ${s}: ${n} заданий вместо ${SUBJECTS[s].n}`);
      }
    }
  }
  console.log(`${track}: вариантов ${VARIANTS}, вопросов из банка без пересечений: ${Object.keys(seenBy).length}`);
}
console.log('Ошибок:', bad);
process.exit(bad ? 1 : 0);
