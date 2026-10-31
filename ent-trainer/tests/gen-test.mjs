// Автотест генераторов: 1000 прогонов каждого шаблона без ошибок.
// Запуск: node tests/gen-test.mjs
import { ALL_TEMPLATES } from '../js/gen/index.js';
import { make } from '../js/gen/engine.js';
import { mkRng } from '../js/gen/util.js';
import { TOPICS } from '../js/subjects.js';

const RUNS = 1000;
let bad = 0;
const fail = (id, msg, q) => { bad++; if (bad < 30) console.log('FAIL', id, msg, q ? JSON.stringify(q).slice(0, 300) : ''); };

const ids = new Set();
const mism = {}, mismEx = {};
for (const tpl of ALL_TEMPLATES) {
  if (ids.has(tpl.id)) fail(tpl.id, 'повторяющийся id шаблона');
  ids.add(tpl.id);
  if (!TOPICS[tpl.subject] || !TOPICS[tpl.subject][tpl.topic]) fail(tpl.id, `нет темы ${tpl.subject}/${tpl.topic} в subjects.js`);
  const r = mkRng(12345);
  let texts = new Set();
  for (let i = 0; i < RUNS; i++) {
    let q;
    try { q = make(tpl, r, i); } catch (e) { fail(tpl.id, 'исключение: ' + e.message); break; }
    for (const lang of ['ru', 'kk']) {
      const L = q[lang];
      if (!L.text || !L.explanation) fail(tpl.id, lang + ': пустой текст или разбор', q);
      if (/undefined|NaN|Infinity|\[object/.test(L.text + L.explanation + L.options.join('|'))) fail(tpl.id, lang + ': undefined/NaN в тексте', q);
      if (/[—–]/.test(L.text + L.explanation)) fail(tpl.id, lang + ': длинное тире в тексте', q);
      if (L.options.length !== 4) fail(tpl.id, 'не 4 варианта', q);
      if (new Set(L.options).size !== 4) fail(tpl.id, 'варианты совпадают', q);
    }
    // правильный вариант должен встречаться в разборе (разбор считается отдельно от ответа)
    const right = q.ru.options[q.answer[0]].replace(/\u00A0/g, ' ');
    const expl = q.ru.explanation.replace(/\u00A0/g, ' ');
    if (!expl.includes(right)) { mism[tpl.id] = (mism[tpl.id] || 0) + 1; if (!mismEx[tpl.id]) mismEx[tpl.id] = { right, expl }; }
    if (q.answer.length !== 1 || q.answer[0] < 0 || q.answer[0] > 3) fail(tpl.id, 'плохой индекс ответа', q);
    texts.add(q.ru.text);
  }
  const variety = texts.size;
  console.log(`${tpl.id.padEnd(14)} ${tpl.subject.padEnd(10)} разных условий из ${RUNS}: ${variety}`);
  if (variety < 15) fail(tpl.id, 'слишком мало разных вариантов условия: ' + variety);
}

for (const id of Object.keys(mism)) { bad++; console.log('НЕСОГЛАСОВАНО', id, mism[id], 'раз из', RUNS, JSON.stringify(mismEx[id])); }
console.log(`\nШаблонов: ${ALL_TEMPLATES.length}, прогонов на шаблон: ${RUNS}, ошибок: ${bad}`);
process.exit(bad ? 1 : 0);
