// Проверка банков вопросов и сборки сессий. Запуск: node tests/bank-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS, SUBJECTS, TRACKS } from '../js/subjects.js';
import { setBank, buildQuestions, buildMini, buildSubjectTest, buildFullExam, bankSize, scoreQ, entPoints, isAnswered } from '../js/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/bank');
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

const ids = new Set();
const mixed = /(?=[^\s]*[Ѐ-ӿԀ-ԯӨө])(?=[^\s]*[A-Za-z])[^\s]*/g;   // слово с латиницей и кириллицей

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const subj = f.replace('.json', '');
  const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  setBank(subj, arr);
  for (const q of arr) {
    const tag = `${f}:${q.id}`;
    if (ids.has(q.id)) fail(tag + ' повторяющийся id'); ids.add(q.id);
    if (q.subject !== subj) fail(tag + ' предмет не совпадает с файлом');
    if (!TOPICS[q.subject] || !TOPICS[q.subject][q.topic]) fail(tag + ' неизвестная тема ' + q.topic);
    if (!['single', 'multiple', 'match'].includes(q.type)) fail(tag + ' неизвестный тип');
    if (!['draft', 'checked', 'live'].includes(q.status)) fail(tag + ' неизвестный статус');
    for (const l of ['ru', 'kk']) {
      const L = q[l];
      if (!L || !L.text || !L.explanation || !Array.isArray(L.options)) { fail(tag + ' нет ' + l); continue; }
      if (/[—–]/.test(JSON.stringify(L))) fail(tag + ' длинное тире в ' + l);
      const m = (L.text + ' ' + L.options.join(' ') + ' ' + L.explanation + ' ' + (L.passage || '')).match(mixed);
      if (m && m.some((w) => !/[A-Za-z]+[₀-₉ₙₓ]|^[A-Za-z]+\(/.test(w) && /[Ѐ-ӿ]/.test(w) && /[A-Za-z]/.test(w) && !/^[A-Za-z0-9()₂₃₄₊₋ₙ]+[-а-яА-Я]*$/.test(w))) fail(tag + ' смесь латиницы и кириллицы в слове: ' + m.join(' | '));
      if (new Set(L.options).size !== L.options.length) fail(tag + ' одинаковые варианты ' + l);
    }
    if (q.ru && q.kk && q.ru.options.length !== q.kk.options.length) fail(tag + ' разное число вариантов ru/kk');
    const n = q.ru.options.length;
    if (!q.answer.every((x) => Number.isInteger(x) && x >= 0 && x < n)) fail(tag + ' ответ вне диапазона');
    if (q.type === 'single' && q.answer.length !== 1) fail(tag + ' single: ответ не один');
    if (q.type === 'multiple' && q.answer.length < 2) fail(tag + ' multiple: меньше двух ответов');
    if (q.type === 'match') {
      if (!q.ru.left || q.ru.left.length !== q.answer.length || !q.kk.left || q.kk.left.length !== q.answer.length) fail(tag + ' match: левая колонка не совпадает с ответами');
    }
    if (q.subject === 'reading' && (!q.set || !q.ru.passage || !q.kk.passage)) fail(tag + ' reading: нет set/passage');
  }
  console.log(f.padEnd(16), arr.length, 'вопросов');
}

// ---- сборка сессий
for (const track of Object.keys(TRACKS)) {
  const exam = buildFullExam(track);
  const mini = buildMini(track);
  console.log(`\nтрек ${track}: пробный ЕНТ ${exam.length} заданий, мини-тест ${mini.length}`);
  console.log('  (пока банки маленькие, блоки короче 120: это ожидаемо, повторов быть не должно)');
  if (mini.length !== 20) fail(`${track}: в мини-тесте ${mini.length} вместо 20`);
  const seen = new Set();
  for (const q of exam) { if (seen.has(q.id)) fail(`${track}: повтор вопроса ${q.id} в пробном ЕНТ`); seen.add(q.id); }
  const per = {};
  exam.forEach((q) => { per[q.subject] = (per[q.subject] || 0) + 1; });
  console.log('  по блокам:', JSON.stringify(per));
  for (const [sj, cnt] of Object.entries(per)) {
    if (cnt > SUBJECTS[sj].n) fail(`${track}/${sj}: в блоке ${cnt} заданий, больше нормы`);
    if (['math', 'mathlit'].includes(sj) && cnt !== SUBJECTS[sj].n) fail(`${track}/${sj}: в блоке ${cnt} заданий вместо ${SUBJECTS[sj].n}`);
  }

  // идеальные ответы дают 100%, пустые ноль
  const perfect = { q: exam, a: exam.map((q) => (q.type === 'single' ? q.answer[0] : q.type === 'multiple' ? q.answer.slice() : q.answer.slice())) };
  const e1 = entPoints(perfect);
  const e0 = entPoints({ q: exam, a: exam.map(() => null) });
  console.log(`  идеально: ${e1.total} из ${e1.nominal}, пусто: ${e0.total}`);
  if (e1.total !== e1.nominal) fail(`${track}: идеальный результат ${e1.total} из ${e1.nominal}`);
  if (e0.total !== 0) fail(`${track}: пустой результат не ноль`);
}

for (const s of Object.keys(SUBJECTS)) {
  const t = buildSubjectTest(s);
  if (t.length > SUBJECTS[s].n) fail(`${s}: тест по предмету длиннее нормы`);
  for (const topic of Object.keys(TOPICS[s])) {
    const p = buildQuestions({ subject: s, topic, n: 10 });
    if (!p.length) console.log(`  (пусто) ${s}/${topic}: вопросов по теме пока нет`);
    p.forEach((q) => { if (q.topic !== topic) fail(`${s}/${topic}: вопрос чужой темы ${q.id}`); });
  }
}

// ---- оценка заданий разных типов
const sq = { type: 'single', answer: [2] };
if (scoreQ(sq, 2).pts !== 1 || scoreQ(sq, 1).pts !== 0 || scoreQ(sq, null).pts !== 0) fail('оценка single');
const mq = { type: 'multiple', answer: [0, 1, 2] };
if (scoreQ(mq, [0, 1, 2]).pts !== 2) fail('multiple: полный ответ');
if (scoreQ(mq, [0, 1]).pts !== 1) fail('multiple: одна ошибка (пропуск)');
if (scoreQ(mq, [0, 1, 2, 3]).pts !== 1) fail('multiple: одна ошибка (лишний)');
if (scoreQ(mq, [0, 3]).pts !== 0) fail('multiple: много ошибок');
const tq = { type: 'match', answer: [0, 1, 2, 3] };
if (scoreQ(tq, [0, 1, 2, 3]).pts !== 2 || scoreQ(tq, [0, 1, 2, 0]).pts !== 1 || scoreQ(tq, [3, 2, 1, 0]).pts !== 0) fail('оценка match');
if (isAnswered(tq, [-1, -1, -1, -1]) || !isAnswered(tq, [-1, 2, -1, -1])) fail('isAnswered match');

// ---- перемешивание вариантов сохраняет верный ответ
for (let i = 0; i < 300; i++) {
  for (const q of buildQuestions({ subject: 'chemistry', topic: 'general', n: 4 })) {
    if (q.gen) continue;
    const orig = JSON.parse(fs.readFileSync(path.join(dir, 'chemistry.json'), 'utf8')).find((x) => x.id === q.id);
    if (!orig) continue;
    const rightTexts = orig.answer.map((k) => orig.ru.options[k]).sort().join('|');
    const nowTexts = q.answer.map((k) => q.ru.options[k]).sort().join('|');
    if (rightTexts !== nowTexts) fail('после перемешивания сломался ответ у ' + q.id);
    const rightKk = orig.answer.map((k) => orig.kk.options[k]).sort().join('|');
    const nowKk = q.answer.map((k) => q.kk.options[k]).sort().join('|');
    if (rightKk !== nowKk) fail('после перемешивания ru и kk разошлись у ' + q.id);
  }
}

console.log(`\nОшибок: ${bad}`);
process.exit(bad ? 1 : 0);
