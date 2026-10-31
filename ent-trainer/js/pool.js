// Сборка набора вопросов: банк + генераторы. Без DOM, проверяется в Node.
import { CONFIG } from './config.js';
import { SUBJECTS, TRACKS, REQUIRED, PROFILE_MIX, TYPE_POINTS } from './subjects.js';
import { GENERATORS } from './gen/index.js';
import { make } from './gen/engine.js';
import { mkRng } from './gen/util.js';

const banks = {};          // subject -> массив вопросов
export const VARIANTS = 3;  // число вариантов пробного ЕНТ без общих вопросов из банка
const partCache = {};
let serial = 0;
const R = mkRng();

export function setBank(subject, arr) {
  delete partCache[subject];
  banks[subject] = (arr || []).filter((q) => CONFIG.allowedStatus.includes(q.status || 'draft'));
}
export function bankSize(subject) { return (banks[subject] || []).length; }

// Разбиение банка на непересекающиеся варианты. Всегда одинаковое для одного и того же банка
// (фиксированное зерно), поэтому «Вариант 2» это всегда один и тот же набор вопросов.
// Типы заданий и тексты для чтения делятся поровну между вариантами.
function partition(subject) {
  if (partCache[subject]) return partCache[subject];
  const items = (banks[subject] || []).slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  const rng = mkRng(20261030 + subject.length * 97);
  const groups = {};
  for (const q of items) {
    const key = subject === 'reading' ? 'set:' + (q.set || q.id) : 'type:' + q.type;
    (groups[key] = groups[key] || []).push(q);
  }
  const map = new Map();
  for (const key of Object.keys(groups).sort()) {
    const g = key.startsWith('set:') ? [groups[key]] : groups[key].map((q) => [q]);   // чтение: текст целиком
    rng.shuffle(g).forEach((chunk, i) => chunk.forEach((q) => map.set(q.id, i % VARIANTS)));
  }
  // для чтения группы разных текстов делятся отдельным кругом
  if (subject === 'reading') {
    const sets = Object.keys(groups).sort();
    rng.shuffle(sets).forEach((k, i) => groups[k].forEach((q) => map.set(q.id, i % VARIANTS)));
  }
  return (partCache[subject] = map);
}
function bankOf(subject, variant) {
  const all = banks[subject] || [];
  if (variant == null) return all;
  const m = partition(subject);
  return all.filter((q) => m.get(q.id) === variant);
}

// Сколько вопросов можно набрать по теме (банк плюс генераторы)
export function available(subject, topic) {
  const b = (banks[subject] || []).filter((q) => !topic || q.topic === topic).length;
  const g = (GENERATORS[subject] || []).filter((t) => !topic || t.topic === topic).length * 5;
  return b + g;
}

// Загрузка банков через fetch (в браузере)
export async function loadBanks(fetchFn = fetch, base = './data/bank/') {
  const files = { history: 'history', reading: 'reading', physics: 'physics', chemistry: 'chemistry', biology: 'biology', math: 'math', mathlit: 'mathlit' };
  await Promise.all(Object.entries(files).map(async ([subj, f]) => {
    try {
      const res = await fetchFn(base + f + '.json');
      if (!res.ok) return;
      setBank(subj, await res.json());
    } catch (e) { /* офлайн или файла нет: работают генераторы и закешированное */ }
  }));
}

// Перемешать варианты в вопросе из банка (одинаково для обоих языков)
function shuffled(q) {
  const out = JSON.parse(JSON.stringify(q));
  out.id = q.id;
  if (q.type === 'match') {
    // правая колонка перемешивается, ответы пересчитываются
    const n = q.ru.options.length;
    const perm = R.shuffle([...Array(n).keys()]);          // perm[новая позиция] = старый индекс
    const inv = []; perm.forEach((old, nw) => { inv[old] = nw; });
    for (const l of ['ru', 'kk']) out[l].options = perm.map((old) => q[l].options[old]);
    out.answer = q.answer.map((old) => inv[old]);
    return out;
  }
  const n = q.ru.options.length;
  const perm = R.shuffle([...Array(n).keys()]);
  const inv = []; perm.forEach((old, nw) => { inv[old] = nw; });
  for (const l of ['ru', 'kk']) out[l].options = perm.map((old) => q[l].options[old]);
  out.answer = q.answer.map((old) => inv[old]).sort((a, b) => a - b);
  return out;
}

const MAX_PER_TEMPLATE = 5;   // чтобы одна и та же задача не шла в одном тесте больше 5 раз с разными числами

function fromGenerators(subject, topic, n, usedTexts) {
  let tpls = GENERATORS[subject] || [];
  if (topic) tpls = tpls.filter((t) => t.topic === topic);
  if (!tpls.length || n <= 0) return [];
  const out = [], cnt = {};
  n = Math.min(n, tpls.length * MAX_PER_TEMPLATE);
  let order = R.shuffle(tpls), i = 0, guard = 0;
  while (out.length < n && guard++ < n * 20) {
    if (i >= order.length) { order = R.shuffle(tpls); i = 0; }   // по кругу, чтобы шаблоны шли ровно
    const tpl = order[i++];
    if ((cnt[tpl.id] || 0) >= MAX_PER_TEMPLATE) continue;
    cnt[tpl.id] = (cnt[tpl.id] || 0) + 1;
    let q;
    try { q = make(tpl, R, ++serial); } catch (e) { continue; }      // шаблон редко не собирается: берём другой
    if (usedTexts.has(q.ru.text)) continue;
    usedTexts.add(q.ru.text);
    out.push(q);
  }
  return out;
}

function fromBank(subject, topic, n, usedIds, preferTypes, variant) {
  let pool = bankOf(subject, variant).filter((q) => (!topic || q.topic === topic) && !usedIds.has(q.id));
  if (!pool.length || n <= 0) return [];
  if (subject === 'reading') {
    // берём тексты целиком, пока не наберём n вопросов
    const sets = {};
    for (const q of pool) (sets[q.set || q.id] = sets[q.set || q.id] || []).push(q);
    const out = [];
    for (const key of R.shuffle(Object.keys(sets))) {
      for (const q of sets[key]) if (out.length < n) { out.push(shuffled(q)); usedIds.add(q.id); }
      if (out.length >= n) break;
    }
    return out;
  }
  pool = R.shuffle(pool);
  if (preferTypes) {
    // сначала нужные типы по квотам
    const picked = [];
    for (const [type, cnt] of Object.entries(preferTypes)) {
      for (const q of pool.filter((x) => x.type === type).slice(0, cnt)) { picked.push(q); usedIds.add(q.id); }
    }
    // остальное добираем в первую очередь заданиями с одним ответом, чтобы квоты multiple и match не превышались
    const rest = pool.filter((q) => !usedIds.has(q.id)).sort((a, b) => (a.type === 'single' ? 0 : 1) - (b.type === 'single' ? 0 : 1));
    for (const q of rest) if (picked.length < n) { picked.push(q); usedIds.add(q.id); }
    return picked.slice(0, n).map(shuffled);
  }
  const take = pool.slice(0, n);
  take.forEach((q) => usedIds.add(q.id));
  return take.map(shuffled);
}

// Основная функция: n вопросов по предмету (и теме)
export function buildQuestions({ subject, topic = null, n, variant = null }) {
  const used = new Set(), usedTexts = new Set();
  const share = CONFIG.genShare[subject] ?? 0;
  const hasGen = (GENERATORS[subject] || []).some((t) => !topic || t.topic === topic);
  const bankAvail = bankOf(subject, variant).filter((q) => !topic || q.topic === topic).length;

  let genN = hasGen ? Math.round(n * share) : 0;
  let bankN = n - genN;
  if (bankN > bankAvail) { genN = hasGen ? n - bankAvail : 0; bankN = n - genN; }     // банка мало: добираем генераторами
  if (!hasGen) { bankN = n; genN = 0; }
  if (genN > 0 && bankAvail === 0) { genN = n; bankN = 0; }

  const out = [];
  const profileSubject = SUBJECTS[subject] && SUBJECTS[subject].profile;
  const prefer = profileSubject && !topic && n === SUBJECTS[subject].n ? { multiple: PROFILE_MIX.multiple, match: PROFILE_MIX.match } : null;
  out.push(...fromBank(subject, topic, bankN, used, prefer, variant));
  out.push(...fromGenerators(subject, topic, genN, usedTexts));
  // если генераторы дали меньше (повторы условий), добираем из банка
  if (out.length < n) out.push(...fromBank(subject, topic, n - out.length, used, null, variant));

  // Если вопросов не хватает (банк ещё маленький), тест получается короче, повторов не делаем.
  return R.shuffle(out).slice(0, n);
}

// Структура сессий
export function trackSubjects(track) { return TRACKS[track].subjects; }
export function allSubjects(track) { return [...REQUIRED, ...trackSubjects(track)]; }

export function buildMini(track) {
  const subs = allSubjects(track);                 // 5 предметов, 20 вопросов: по 4
  const out = [];
  for (const s of subs) out.push(...buildQuestions({ subject: s, n: 4 }));
  return R.shuffle(out);
}

export function buildSubjectTest(subject) {
  return buildQuestions({ subject, n: SUBJECTS[subject].n });
}

// variant: 0..VARIANTS-1 (вопросы из банка в разных вариантах не повторяются) или null (случайный набор)
export function buildFullExam(track, variant = null) {
  const order = [...REQUIRED, ...trackSubjects(track)];
  const out = [];
  for (const s of order) out.push(...buildQuestions({ subject: s, n: SUBJECTS[s].n, variant }));
  return out;      // порядок блоков сохраняется
}

// ---------- Оценка ----------
export function maxPoints(q) { return TYPE_POINTS[q.type] || 1; }

// a: single -> число; multiple -> массив индексов; match -> массив (по левым пунктам), -1 = не выбрано
export function isAnswered(q, a) {
  if (a === null || a === undefined) return false;
  if (q.type === 'single') return typeof a === 'number' && a >= 0;
  if (q.type === 'multiple') return Array.isArray(a) && a.length > 0;
  if (q.type === 'match') return Array.isArray(a) && a.some((x) => x >= 0);
  return false;
}

export function scoreQ(q, a) {
  const max = maxPoints(q);
  if (!isAnswered(q, a)) return { pts: 0, max, full: false };
  if (q.type === 'single') {
    const ok = a === q.answer[0];
    return { pts: ok ? 1 : 0, max, full: ok };
  }
  if (q.type === 'multiple') {
    // 2 балла без ошибок, 1 балл при одной ошибке (пропущен или лишний вариант). Правило уточнить по НЦТ.
    const right = new Set(q.answer);
    const chosen = new Set(a);
    const missed = [...right].filter((x) => !chosen.has(x)).length;
    const extra = [...chosen].filter((x) => !right.has(x)).length;
    const errs = missed + extra;
    if (errs === 0) return { pts: 2, max, full: true };
    if (errs === 1) return { pts: 1, max, full: false };
    return { pts: 0, max, full: false };
  }
  // match
  let hit = 0;
  q.answer.forEach((v, i) => { if (a[i] === v) hit++; });
  if (hit === q.answer.length) return { pts: 2, max, full: true };
  if (hit === q.answer.length - 1) return { pts: 1, max, full: false };
  return { pts: 0, max, full: false };
}

// Баллы ЕНТ: пересчёт на номинальный максимум (если в банке пока меньше вопросов, чем нужно)
export function entPoints(session) {
  let raw = 0, rawMax = 0;
  const per = {};
  session.q.forEach((q, i) => {
    const s = scoreQ(q, session.a[i]);
    raw += s.pts; rawMax += s.max;
    const p = per[q.subject] || (per[q.subject] = { raw: 0, max: 0 });
    p.raw += s.pts; p.max += s.max;
  });
  let total = 0, nominal = 0;
  for (const [subj, p] of Object.entries(per)) {
    const nom = SUBJECTS[subj].pts;
    nominal += nom;
    total += p.max ? (p.raw / p.max) * nom : 0;
  }
  return { raw, rawMax, total: Math.round(total), nominal, per };
}
