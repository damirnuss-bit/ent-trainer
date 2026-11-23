// Прогресс пользователя. Основное место: localStorage (быстро, работает офлайн).
// Копия в CloudStorage Telegram, чтобы прогресс не терялся при смене телефона.
// Лимиты CloudStorage: значение до 4096 символов, поэтому данные разбиты на несколько ключей.
import { tg } from './tg.js';

const LS = 'ent_state_v1';
const LS_SES = 'ent_session_v1';

const empty = () => ({
  ts: 0,
  set: { lang: null, track: null, onboarded: false },
  att: [],          // последние попытки: {t, m, s, n, c, p, e}
  tp: {},           // темы: { предмет: { тема: [верно, всего] } }
  rec: '',          // последние 100 ответов, строка из 0 и 1
  day: { d: '', n: 0 },
  streak: { n: 0, last: '' },
  best: {},         // лучший процент по режиму
  hist: {},         // ответов по дням: { '2026-10-31': 12 }, хранятся последние 14 дней
  xp: { total: 0, days: {}, week: '', wk: 0 }, // опыт: всего, по дням (14 дней), за текущую неделю
  adb: { d: '', n: 0 }, // сколько раз сегодня смотрел рекламу за награду
  freeze: 0,        // заморозки серии (как в Duolingo): спасают серию за один пропущенный день
  prem: 0,          // премиум до (мс), подтверждается сервером
});

let S = empty();
let dirty = new Set();
let timer = null;

const today = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// неделя лиги: понедельник по местному времени
const weekKey = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); };

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) S = Object.assign(empty(), JSON.parse(raw));
  } catch (e) { S = empty(); }
}

function saveLocal() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* переполнение: игнор */ }
}

const TP_SUBJECTS = ['history', 'reading', 'mathlit', 'math', 'physics', 'chemistry', 'biology', 'geography', 'worldhist', 'informatics', 'law', 'english', 'kazlang', 'kazlit', 'ruslang', 'ruslit'];
function cloudKeys() {
  return ['set', 'att', 'rec', 'xp', ...TP_SUBJECTS.map((s) => 'tp_' + s)];
}

function cloudPayload(key) {
  if (key === 'set') return JSON.stringify({ ts: S.ts, set: S.set, day: S.day, streak: S.streak, best: S.best, hist: S.hist, prem: S.prem });
  if (key === 'att') return JSON.stringify(S.att.slice(-22));
  if (key === 'rec') return S.rec;
  if (key === 'xp') return JSON.stringify({ xp: S.xp, freeze: S.freeze });
  if (key.startsWith('tp_')) return JSON.stringify(S.tp[key.slice(3)] || {});
  return '';
}

function markDirty(...keys) {
  keys.forEach((k) => dirty.add(k));
  S.ts = Date.now();
  saveLocal();
  clearTimeout(timer);
  timer = setTimeout(flush, 1500);
}

async function flush() {
  if (!tg.cloud.available()) { dirty.clear(); return; }
  const keys = [...dirty]; dirty.clear();
  if (!keys.includes('set')) keys.push('set');      // в 'set' лежит метка времени
  for (const k of keys) await tg.cloud.set(k, cloudPayload(k));
}

export const store = {
  async init() {
    loadLocal();
    // Подтягиваем облако в фоне: если оно новее, берём его
    const vals = await tg.cloud.getMany(cloudKeys());
    if (vals && vals.set) {
      try {
        const cs = JSON.parse(vals.set);
        if ((cs.ts || 0) > (S.ts || 0)) {
          S.ts = cs.ts; S.set = Object.assign(S.set, cs.set); S.day = cs.day || S.day; S.streak = cs.streak || S.streak; S.best = cs.best || {}; S.hist = cs.hist || S.hist || {}; S.prem = Math.max(S.prem || 0, cs.prem || 0);
          if (vals.att) S.att = JSON.parse(vals.att);
          if (vals.rec != null) S.rec = vals.rec;
          if (vals.xp) { const x = JSON.parse(vals.xp); S.xp = x.xp || S.xp; S.freeze = x.freeze || 0; }
          for (const k of cloudKeys()) if (k.startsWith('tp_') && vals[k]) S.tp[k.slice(3)] = JSON.parse(vals[k]);
          saveLocal();
          return 'cloud';
        }
      } catch (e) { /* битое облако: остаёмся на локальном */ }
    }
    return 'local';
  },

  get settings() { return S.set; },
  setSettings(patch) { Object.assign(S.set, patch); markDirty('set'); },

  // Записать один ответ (для прогноза баллов и тем)
  recordAnswer(subject, topic, correct) {
    const t = S.tp[subject] || (S.tp[subject] = {});
    const x = t[topic] || (t[topic] = [0, 0]);
    x[1] += 1; if (correct) x[0] += 1;
    S.rec = (S.rec + (correct ? '1' : '0')).slice(-100);
    const td = today();
    if (S.day.d !== td) {
      if (S.streak.last) {
        const diff = dayDiff(S.streak.last, td);
        const missed = diff - 1;
        if (diff === 1) S.streak.n += 1;
        else if (diff > 1 && missed <= S.freeze) { S.freeze -= missed; S.streak.n += 1; S.streak.saved = missed; }
        else if (diff !== 0) S.streak.n = 1;
        // каждые 7 дней серии дают заморозку, максимум 2
        if (diff >= 1 && S.streak.n % 7 === 0 && S.freeze < 2) S.freeze += 1;
      } else S.streak.n = 1;
      S.streak.last = td;
      S.day = { d: td, n: 0 };
    }
    S.day.n += 1;
    S.hist[td] = (S.hist[td] || 0) + 1;
    const hk = Object.keys(S.hist).sort();
    while (hk.length > 14) delete S.hist[hk.shift()];
    markDirty('rec', 'set', 'tp_' + subject);
  },

  addAttempt(a) {
    S.att.push(a);
    if (S.att.length > 60) S.att = S.att.slice(-60);
    markDirty('att');
  },

  lastAttempt(key) {
    for (let i = S.att.length - 1; i >= 0; i--) if (S.att[i].k === key) return S.att[i];
    return null;
  },
  attemptsFor(key) { return S.att.filter((a) => a.k === key); },
  allAttempts() { return S.att.slice(); },

  best(key) { return S.best[key] || 0; },
  setBest(key, pct) { S.best[key] = pct; markDirty('set'); },

  topicStats(subject) { return S.tp[subject] || {}; },

  // Точность по предмету в процентах или null, если ответов ещё нет
  subjectAcc(subject) {
    let ok = 0, n = 0;
    Object.values(S.tp[subject] || {}).forEach((x) => { ok += x[0]; n += x[1]; });
    return n ? { pct: Math.round((ok / n) * 100), n } : null;
  },

  // Слабые темы по всем предметам: минимум 3 ответа и меньше 60% верных
  weakTopics(limit = 3) {
    const out = [];
    Object.entries(S.tp).forEach(([s, ts]) => Object.entries(ts).forEach(([t, x]) => {
      if (x[1] >= 3 && x[0] / x[1] < 0.6) out.push({ s, t, ok: x[0], n: x[1], pct: Math.round((x[0] / x[1]) * 100) });
    }));
    return out.sort((a, b) => a.pct - b.pct || b.n - a.n).slice(0, limit);
  },

  // Ответов за последние 7 дней, последний элемент это сегодня
  weekCounts() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.push(S.hist[k] || 0);
    }
    return out;
  },

  todayCount() { return S.day.d === today() ? S.day.n : 0; },
  streak() {
    const diff = S.streak.last ? dayDiff(S.streak.last, today()) : 99;
    return diff <= 1 || diff - 1 <= S.freeze ? S.streak.n : 0;
  },
  streakToday() { return S.streak.last === today(); },
  freezes() { return S.freeze; },
  // сообщить один раз, что заморозка спасла серию
  takeSavedNote() { const n = S.streak.saved || 0; if (n) { delete S.streak.saved; markDirty('set'); } return n; },

  // ---- опыт (XP), как в Duolingo
  addXp(n) {
    const td = today(), wk = weekKey();
    S.xp.total += n;
    S.xp.days[td] = (S.xp.days[td] || 0) + n;
    const dk = Object.keys(S.xp.days).sort();
    while (dk.length > 14) delete S.xp.days[dk.shift()];
    if (S.xp.week !== wk) { S.xp.week = wk; S.xp.wk = 0; }
    S.xp.wk += n;
    markDirty('xp');
  },
  xpToday() { return S.xp.days[today()] || 0; },
  xpWeek() { return S.xp.week === weekKey() ? S.xp.wk : 0; },
  xpTotal() { return S.xp.total; },
  xpWeekDays() {
    const out = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(S.xp.days[ymd(d)] || 0); }
    return out;
  },

  // ---- реклама за награду: +вопросы на сегодня
  adRewardsToday() { return S.adb && S.adb.d === today() ? S.adb.n : 0; },
  addAdReward() { const td = today(); if (!S.adb || S.adb.d !== td) S.adb = { d: td, n: 0 }; S.adb.n += 1; markDirty('set'); },

  // ---- премиум: срок хранится локально, но выставляется только по ответу сервера
  isPremium() { return (S.prem || 0) > Date.now(); },
  premiumUntil() { return S.prem || 0; },
  setPremium(until) { S.prem = until || 0; markDirty('set'); },

  // Прогноз баллов из 140 по последним ответам (нужно минимум 20)
  forecast() {
    const n = S.rec.length;
    if (n < 20) return null;
    const ok = [...S.rec].filter((c) => c === '1').length;
    return { pts: Math.round((ok / n) * 140), n };
  },

  // ---- сессия (в процессе теста), только локально
  saveSession(ses) {
    try { localStorage.setItem(LS_SES, JSON.stringify(ses)); } catch (e) { /* квота */ }
  },
  loadSession() {
    try { const r = localStorage.getItem(LS_SES); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  },
  clearSession() { try { localStorage.removeItem(LS_SES); } catch (e) { /* */ } },
  flushNow: flush,
};
