// Главный файл: экраны, навигация, тесты, результаты.
import { CONFIG } from './config.js';
import { SUBJECTS, TRACKS, REQUIRED, TOPICS, topicName, subjectName, EXAM_MINUTES } from './subjects.js';
import { STR } from './i18n.js';
import { tg, inTelegram } from './tg.js';
import { store } from './store.js';
import * as pool from './pool.js';
import { rt, typeset, loadKatex, escHtml as esc } from './render.js';
import { track } from './track.js';

const app = document.getElementById('app');
const tabsEl = document.getElementById('tabs');
const TABS = ['home', 'practice', 'progress', 'settings'];
const TAB_ICON = {
  home: 'M4 11l8-7 8 7v9H4z',
  practice: 'M5 7h14M5 12h14M5 17h9',
  progress: 'M5 20v-9M12 20V4M19 20v-6',
  settings: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6',
};
const LET = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const MLET = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж'];

let lang = 'ru';
let ads = { banner: [], partner: [] };
let ses = null;            // активная сессия
let cur = { name: 'home', params: {} };
let nav = [];
let ui = { back: null, main: null };
let tick = null;
let lastKey = '';
let lastResult = null;
let persistTimer = null;
let topicCount = 10;

const S = () => STR[lang];
// все предметы, любой можно проходить отдельно; предметы выбранной связки идут первыми
const subjList = () => { const mine = pool.allSubjects(store.settings.track); return [...mine, ...Object.keys(SUBJECTS).filter((s) => !mine.includes(s))]; };

// ---------------------------------------------------------------- вспомогательное
const toastEl = document.getElementById('toast');
let toastT = null;
function toast(msg, ms = 2400) {
  toastEl.textContent = msg; toastEl.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, ms);
}
const fmtTime = (sec) => {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
const keyOf = (mode, subject, topic) =>
  mode === 'practice' ? `prac:${subject || 'mix'}:${topic || 'all'}` : mode === 'subject' ? `subj:${subject}` : mode;
const examKey = (variant) => (variant == null ? 'exam' : `exam:v${variant + 1}`);
const modeTitle = (s) => {
  const base = S().modes[s.mode];
  if (s.mode === 'practice' && s.subject) return `${base}: ${subjectName(s.subject, lang)}${s.topic ? ', ' + topicName(s.subject, s.topic, lang) : ''}`;
  if (s.mode === 'subject') return `${base}: ${subjectName(s.subject, lang)}`;
  if (s.mode === 'exam' && s.variant != null) return `${base}: ${S().variantN(s.variant + 1)}`;
  return base;
};
// Ближайший будущий ЕНТ: { days, date } или null, если все даты прошли
const nextExam = () => {
  const now = new Date();
  const all = [CONFIG.examDate, ...(CONFIG.examDates || [])].filter(Boolean)
    .map((x) => new Date(x + 'T09:00:00')).filter((x) => x > now).sort((a, b) => a - b);
  if (!all.length) return null;
  return { days: Math.ceil((all[0] - now) / 86400000), date: all[0] };
};
function persist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => { if (ses) store.saveSession(ses); }, 250);
}
function persistNow() { clearTimeout(persistTimer); if (ses) store.saveSession(ses); }

function adHtml(kind) {
  const list = (ads[kind] || []).filter((a) => a.active);
  if (!list.length) return '';
  const a = list[Math.floor(Math.random() * list.length)];
  const btn = a.button ? `<span class="go2">${esc(a.button[lang])} →</span>` : '';
  return `<div class="ad" role="link" tabindex="0" data-act="openAd" data-url="${esc(a.url)}" data-id="${esc(a.id)}">
    <div class="tag">${S().ad}</div><b>${esc(a.title[lang])}</b><span class="t">${esc(a.text[lang])}</span>${btn}</div>`;
}

// ---------------------------------------------------------------- навигация
function show(name, params = {}, { replace = false } = {}) {
  if (!replace && cur) nav.push(cur);
  cur = { name, params };
  render();
}
function goHome() { nav = []; cur = { name: 'home', params: {} }; render(); }
function goBack() {
  if (cur.name === 'question') { persistNow(); goHome(); return; }
  if (cur.name === 'results') { goHome(); return; }
  cur = nav.pop() || { name: 'home', params: {} };
  render();
}

function render() {
  clearInterval(tick); tick = null;
  ui = { back: TABS.includes(cur.name) ? null : goBack, main: null };
  const screen = SCREENS[cur.name](cur.params);
  const key = cur.name + ':' + (ses && cur.name === 'question' ? ses.idx + ses.view : '');
  const fresh = key !== lastKey;
  lastKey = key;
  document.documentElement.lang = lang;
  app.innerHTML = `<div class="${fresh ? 'screen' : ''}">${screen}</div>`;
  typeset(app);
  if (fresh) window.scrollTo(0, 0);
  // кнопки Telegram
  tg.back(ui.back);
  document.body.classList.toggle('nb-back', !inTelegram && !!ui.back);
  if (ui.main) tg.main(ui.main.text, ui.main.fn, { disabled: ui.main.disabled }); else tg.mainHide();
  document.body.classList.toggle('has-mb', !!ui.main);
  renderTabs();
  if (cur.name === 'question' && ses) startTimer();
}

function renderTabs() {
  const on = TABS.includes(cur.name);
  tabsEl.hidden = !on;
  document.body.classList.toggle('has-tabs', on);
  if (!on) return;
  const names = { home: S().tabHome, practice: S().tabPractice, progress: S().tabProgress, settings: S().tabProfile };
  tabsEl.innerHTML = TABS.map((t) => `<button class="tab ${t === cur.name ? 'on' : ''}" data-tab="${t}" ${t === cur.name ? 'aria-current="page"' : ''}>
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="${TAB_ICON[t]}"/></svg><span>${names[t]}</span></button>`).join('');
}

function goTab(name) {
  if (ses && cur.name === 'question') persistNow();
  nav = []; cur = { name, params: {} }; render();
}

// ---------------------------------------------------------------- экраны
const SCREENS = {
  lang() {
    ui.back = null;
    return `<h1>Тіл / Язык</h1><p class="hint">${S().pickLang}</p>
      <button class="btn big-choice" data-act="setLang" data-v="kk">Қазақша</button>
      <button class="btn big-choice" data-act="setLang" data-v="ru">Русский</button>`;
  },

  track(p) {
    ui.back = p && p.fromSettings ? goBack : null;
    return `<h1>${S().pickTrack}</h1>
      ${Object.entries(TRACKS).map(([id, t]) => `<button class="btn big-choice" data-act="setTrack" data-v="${id}">${t[lang]}</button>`).join('')}`;
  },

  home() {
    const f = store.forecast();
    const goal = CONFIG.dailyGoal;
    const ex = nextExam();
    const resume = ses && ses.q && ses.q.length && !ses.finished ? ses : null;
    const wk = store.weekCounts();
    const mx = Math.max(goal, ...wk);
    const bars = wk.map((n, k) => `<i class="${k === 6 ? 'now' : ''}" style="height:${Math.max(4, Math.round((n / mx) * 44))}px"></i>`).join('');
    const subs = [...pool.trackSubjects(store.settings.track), 'history', 'mathlit'];
    const tiles = subs.map((sj) => {
      const a = store.subjectAcc(sj);
      const low = a && a.pct < 50;
      return `<button class="tile" data-act="subjectTopics" data-s="${sj}"><span class="n">${subjectName(sj, lang)}</span>
        <span><span class="v ${low ? 'low' : ''}">${a ? a.pct + '%' : '-'}</span>${a ? `<span class="m"><i class="${low ? 'low' : ''}" style="width:${a.pct}%"></i></span>` : ''}</span></button>`;
    }).join('');
    const play = '<span class="pl"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';
    const main = resume
      ? `<button class="go" data-act="resume"><span class="t"><b>${S().resume}</b><small>${esc(modeTitle(resume))}, ${S().resumeSub(resume.idx + 1, resume.q.length)}</small><span class="pb"><i style="width:${Math.round((resume.idx / resume.q.length) * 100)}%"></i></span></span>${play}</button>`
      : `<button class="go" data-act="startMini"><span class="t"><b>${S().mini}</b><small>${S().miniSub}</small></span>${play}</button>`;
    return `
      <div class="topbar"><h1>${S().app}</h1></div>
      ${ex ? `<div class="exam"><span>${S().examNext}</span><b>${S().daysN(ex.days)}</b><small>${ex.date.getDate()} ${S().months[ex.date.getMonth()]}</small></div>` : ''}
      <div class="hero">
        <div><div class="lbl">${S().forecast}</div>
          <div class="num"><b>${f ? f.pts : '-'}</b><span>${S().outOf140}</span></div>
          <div class="sm">${f ? S().forecastBased(f.n) : S().forecastEmpty}</div></div>
        <div><div class="wk">${bars}</div><div class="wkl">${S().weekLbl}</div></div>
      </div>
      ${main}
      ${adHtml('banner')}
      <div class="sec">${S().subjectsLbl}</div>
      <div class="tiles">${tiles}</div>
      <div class="note"><p>${S().nonprofit}</p>${CONFIG.donateCard ? `<button class="outline" data-act="support">${S().support}</button>` : ''}</div>`;
  },

  practice() {
    return `<h1>${S().tabPractice}</h1><p class="hint">${S().practiceSub}</p>
      <button class="btn" data-act="goTopics"><span class="grow"><b>${S().byTopic}</b><small>${S().byTopicSub}</small></span></button>
      <button class="btn" data-act="startMini"><span class="grow"><b>${S().mini}</b><small>${S().miniSub}</small></span></button>
      <button class="btn" data-act="goSubjects"><span class="grow"><b>${S().subjTest}</b><small>${S().subjTestSub}</small></span></button>
      <button class="btn" data-act="goExams"><span class="grow"><b>${S().fullExam}</b><small>${S().fullExamSub}</small></span></button>`;
  },

  topics(p) {
    const subs = subjList();
    const subject = p.subject && subs.includes(p.subject) ? p.subject : subs[0];
    const stats = store.topicStats(subject);
    const rows = Object.keys(TOPICS[subject]).map((tk) => {
      const av = pool.available(subject, tk);
      const x = stats[tk];
      const pct = x && x[1] ? Math.round((x[0] / x[1]) * 100) : null;
      const cls = pct == null ? '' : pct >= 75 ? '' : pct >= 50 ? 'mid' : 'low';
      return `<button class="btn" data-act="startTopic" data-s="${subject}" data-t="${tk}" ${av ? '' : 'style="opacity:.5"'}>
        <span class="grow"><b>${esc(topicName(subject, tk, lang))}</b><small>${pct == null ? S().noData : pct + '%'}</small></span>
        ${pct == null ? '' : `<span class="acc"><span class="meter"><i class="${cls}" style="width:${pct}%"></i></span></span>`}</button>`;
    }).join('');
    return `<h1>${S().byTopic}</h1>
      <div class="chips">${subs.map((s) => `<button class="chip ${s === subject ? 'on' : ''}" data-act="topicSubject" data-s="${s}">${subjectName(s, lang)}</button>`).join('')}</div>
      <div class="chips">${[10, 20].map((n) => `<button class="chip ${n === topicCount ? 'on' : ''}" data-act="topicCount" data-n="${n}" data-s="${subject}">${S().questionsN(n)}</button>`).join('')}</div>
      <button class="btn" data-act="startTopic" data-s="${subject}" data-t=""><span class="ic">🔀</span><span><b>${S().allTopics}</b></span></button>
      ${rows}`;
  },

  subjects() {
    const subs = subjList();
    return `<h1>${S().subjTest}</h1>
      ${subs.map((s) => {
        const info = SUBJECTS[s];
        return `<button class="btn" data-act="startSubject" data-s="${s}"><span class="ic">${info.icon}</span><span><b>${subjectName(s, lang)}</b><small>${info.n} · ${info.minutes} min</small></span></button>`;
      }).join('')}`;
  },

  exams() {
    const tr = TRACKS[store.settings.track];
    return `<h1>${S().fullExam}</h1><p class="hint">${tr ? tr[lang] : ''}</p>
      ${Array.from({ length: pool.VARIANTS }, (_, i) => `<button class="btn" data-act="startVariant" data-v="${i}"><span class="ic">${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i]}</span><span><b>${S().variantN(i + 1)}</b><small>${S().variantSub}</small></span></button>`).join('')}
      <button class="btn" data-act="startExam"><span class="ic">🔀</span><span><b>${S().variantRandom}</b><small>${S().variantRandomSub}</small></span></button>`;
  },

  question() {
    if (!ses) { return ''; }
    return ses.view === 'grid' ? gridScreen() : questionScreen();
  },

  results() { return resultsScreen(); },
  progress() { return progressScreen(); },

  settings() {
    const st = store.settings;
    return `<h1>${S().settings}</h1>
      <h2>${S().language}</h2>
      <div class="chips"><button class="chip ${lang === 'kk' ? 'on' : ''}" data-act="setLang" data-v="kk" data-from="settings">Қазақша</button>
      <button class="chip ${lang === 'ru' ? 'on' : ''}" data-act="setLang" data-v="ru" data-from="settings">Русский</button></div>
      <h2>${S().track}</h2>
      <div class="chips">${Object.entries(TRACKS).map(([id, t]) => `<button class="chip ${st.track === id ? 'on' : ''}" data-act="setTrack" data-v="${id}" data-from="settings">${t[lang]}</button>`).join('')}</div>
      <h2>${S().about}</h2>
      <p class="hint">${S().app} · ${CONFIG.version}</p>
      <button class="btn" data-act="openOwner"><span class="grow"><b>${S().contact}</b></span></button>
      ${CONFIG.donateCard ? `<button class="btn" data-act="support"><span class="grow"><b>${S().supportTitle}</b><small>${S().nonprofit}</small></span></button>` : ''}`;
  },
};

// ---------------------------------------------------------------- экран вопроса
function questionScreen() {
  const i = ses.idx, n = ses.q.length;
  const q = ses.q[i], L = q[lang];
  const practice = ses.mode === 'practice';
  const checked = ses.checked[i];
  const a = ses.a[i];
  const last = i === n - 1;

  const timerTxt = ses.total != null ? fmtTime(ses.left) : fmtTime(ses.spent);
  const low = ses.total != null && ses.left < 60;
  const flagOn = ses.flag[i];

  let body = '';
  if (q.type === 'single') body = singleHtml(q, L, a, checked, practice);
  else if (q.type === 'multiple') body = multiHtml(q, L, a, checked);
  else body = matchHtml(q, L, a, checked);

  let fb = '';
  if (checked) {
    const sc = pool.scoreQ(q, a);
    const cls = sc.full ? 'ok' : sc.pts > 0 ? 'part' : 'bad';
    const word = sc.full ? S().correct : sc.pts > 0 ? S().partial : S().wrong;
    fb = `<div class="fb ${cls}" id="fb"><b class="v">${word}</b>
      ${sc.full ? '' : `<div>${S().rightAnswer}: ${esc(answerText(q, q.answer, true))}</div>`}
      <div class="ex">${rt(L.explanation)}</div></div>`;
  }

  const passage = L.passage ? `<details class="passage" open><summary>📖 ${subjectName(q.subject, lang)}</summary>${rt(L.passage)}</details>` : '';
  const topicLbl = esc(topicName(q.subject, q.topic, lang));

  // главная кнопка
  if (practice) {
    if (checked) ui.main = { text: last ? S().finish : S().next, fn: () => (last ? finishFlow() : goto(i + 1)) };
    else if (q.type !== 'single') ui.main = { text: S().check, fn: () => check(), disabled: !pool.isAnswered(q, a) };
  } else {
    ui.main = { text: last ? S().finish : S().next, fn: () => (last ? finishFlow() : goto(i + 1)) };
  }

  return `
    <div class="qtop">
      <div class="bar"><i style="width:${((i + (checked ? 1 : 0)) / n) * 100}%"></i></div>
      <div class="qmeta">
        <span>${i + 1} / ${n} · ${topicLbl}</span>
        <span class="timer ${low ? 'low' : ''}" id="tm">${timerTxt}</span>
        <span>
          <button class="icon-btn ${flagOn ? 'on' : ''}" data-act="flag" aria-label="${S().flag}">⚑</button>
          ${practice ? '' : `<button class="icon-btn" data-act="grid" aria-label="${S().overview}">☰</button>`}
          <button class="icon-btn" data-act="quit" aria-label="${S().finish}">✕</button>
        </span>
      </div>
    </div>
    ${passage}
    <div class="qtext">${rt(L.text)}</div>
    ${body}
    ${fb}
    <div class="qlinks">
      <button class="link" data-act="prev" ${i === 0 ? 'disabled' : ''}>← ${S().prev}</button>
      ${!last && !checked ? `<button class="link" data-act="skip">${S().skip} →</button>` : '<span></span>'}
      <button class="link" data-act="report">⚠️ ${S().reportError}</button>
    </div>`;
}

function singleHtml(q, L, a, checked, practice) {
  return `<div class="opts">${L.options.map((o, k) => {
    let cls = '';
    if (checked) cls = q.answer.includes(k) ? 'ok' : a === k ? 'bad' : '';
    else if (a === k) cls = 'sel';
    return `<button class="opt ${cls}" data-act="pick" data-k="${k}" ${checked ? 'disabled' : ''}><span class="l">${LET[k]}</span><span>${rt(o)}</span></button>`;
  }).join('')}</div>`;
}

function multiHtml(q, L, a, checked) {
  const sel = Array.isArray(a) ? a : [];
  return `<div class="hint">${S().chooseMany}</div><div class="opts mt">${L.options.map((o, k) => {
    let cls = 'multi';
    if (checked) cls += q.answer.includes(k) ? ' ok' : sel.includes(k) ? ' bad' : '';
    else if (sel.includes(k)) cls += ' sel';
    return `<button class="opt ${cls}" data-act="toggle" data-k="${k}" ${checked ? 'disabled' : ''}><span class="l">${sel.includes(k) || (checked && q.answer.includes(k)) ? '✓' : LET[k]}</span><span>${rt(o)}</span></button>`;
  }).join('')}</div>`;
}

function matchHtml(q, L, a, checked) {
  const sel = Array.isArray(a) ? a : q.answer.map(() => -1);
  return `<div class="hint">${S().matchHint}</div><div class="match mt">
    <div class="legend">${L.options.map((o, k) => `<div><b>${MLET[k]}</b> ${rt(o)}</div>`).join('')}</div>
    ${L.left.map((l, r) => `<div class="mrow"><div class="mt">${r + 1}. ${rt(l)}</div><div class="mc">${L.options.map((o, k) => {
      let cls = '';
      if (checked) cls = q.answer[r] === k ? 'ok' : sel[r] === k ? 'bad' : '';
      else if (sel[r] === k) cls = 'sel';
      return `<button class="${cls}" data-act="mpick" data-r="${r}" data-k="${k}" ${checked ? 'disabled' : ''}>${MLET[k]}</button>`;
    }).join('')}</div></div>`).join('')}</div>`;
}

function answerText(q, a, isRight = false) {
  const L = q[lang];
  if (a == null || (Array.isArray(a) && !a.length)) return S().noAnswer;
  if (q.type === 'single') {
    const k = Array.isArray(a) ? a[0] : a;
    return k >= 0 ? `${LET[k]}) ${L.options[k]}` : S().noAnswer;
  }
  if (q.type === 'multiple') return a.slice().sort((x, y) => x - y).map((k) => `${LET[k]}) ${L.options[k]}`).join('; ');
  return a.map((k, r) => `${r + 1}-${k >= 0 ? MLET[k] : '?'}`).join(', ');
}

function gridScreen() {
  const n = ses.q.length;
  ui.main = { text: S().finish, fn: () => finishFlow() };
  ui.back = () => { ses.view = 'q'; render(); };
  const cells = ses.q.map((q, i) => `<button class="cell ${pool.isAnswered(q, ses.a[i]) ? 'done' : ''} ${i === ses.idx ? 'cur' : ''} ${ses.flag[i] ? 'flag' : ''}" data-act="jump" data-i="${i}">${i + 1}</button>`).join('');
  const answered = ses.q.filter((q, i) => pool.isAnswered(q, ses.a[i])).length;
  return `<h1>${S().overview}</h1><div class="hint">${answered} / ${n}</div><div class="grid">${cells}</div>`;
}

function startTimer() {
  const tm = () => document.getElementById('tm');
  tick = setInterval(() => {
    if (!ses || cur.name !== 'question') return;
    ses.spent++;
    if (ses.total != null) {
      ses.left--;
      if (ses.left <= 0) { clearInterval(tick); toast(S().timeUp); finish(); return; }
    }
    const el = tm();
    if (el) {
      el.textContent = fmtTime(ses.total != null ? ses.left : ses.spent);
      el.classList.toggle('low', ses.total != null && ses.left < 60);
    }
    if (ses.spent % 10 === 0) persistNow();
  }, 1000);
}

// ---------------------------------------------------------------- ход теста
function goto(i) {
  if (!ses) return;
  ses.idx = Math.max(0, Math.min(ses.q.length - 1, i));
  ses.view = 'q';
  persist(); render();
}

function pick(k) {
  const q = ses.q[ses.idx];
  if (ses.checked[ses.idx]) return;
  ses.a[ses.idx] = k;
  tg.haptic('select');
  if (ses.mode === 'practice') { check(); return; }
  persist(); render();
}
function toggle(k) {
  const i = ses.idx;
  if (ses.checked[i]) return;
  const cur2 = Array.isArray(ses.a[i]) ? ses.a[i].slice() : [];
  const at = cur2.indexOf(k);
  if (at >= 0) cur2.splice(at, 1); else cur2.push(k);
  ses.a[i] = cur2.length ? cur2.sort((x, y) => x - y) : null;
  tg.haptic('select');
  persist(); render();
}
function mpick(r, k) {
  const i = ses.idx, q = ses.q[i];
  if (ses.checked[i]) return;
  const a = Array.isArray(ses.a[i]) ? ses.a[i].slice() : q.answer.map(() => -1);
  a[r] = a[r] === k ? -1 : k;
  ses.a[i] = a;
  tg.haptic('select');
  persist(); render();
}
function check() {
  const i = ses.idx, q = ses.q[i], a = ses.a[i];
  if (ses.checked[i] || !pool.isAnswered(q, a)) return;
  ses.checked[i] = true;
  const sc = pool.scoreQ(q, a);
  if (!ses.rec[i]) { store.recordAnswer(q.subject, q.topic, sc.full); ses.rec[i] = true; }
  tg.haptic(sc.full ? 'success' : 'error');
  persist(); render();
  const fb = document.getElementById('fb');
  if (fb) setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

async function finishFlow() {
  if (!ses) return;
  const un = ses.q.filter((q, i) => !pool.isAnswered(q, ses.a[i])).length;
  if (un > 0) { if (!(await tg.confirm(S().unanswered(un)))) return; }
  finish();
}

async function quit() {
  if (await tg.confirm(S().finishConfirm)) finish();
}

function finish() {
  if (!ses) return;
  clearInterval(tick);
  const s = ses;
  const rows = s.q.map((q, i) => ({ q, a: s.a[i], sc: pool.scoreQ(q, s.a[i]), answered: pool.isAnswered(q, s.a[i]) }));
  rows.forEach((r, i) => { if (r.answered && !s.rec[i]) store.recordAnswer(r.q.subject, r.q.topic, r.sc.full); });
  const total = rows.length;
  const full = rows.filter((r) => r.sc.full).length;
  const pct = total ? Math.round((full / total) * 100) : 0;
  const ent = s.mode === 'exam' || s.mode === 'subject' ? pool.entPoints(s) : null;
  const prev = store.lastAttempt(s.key);
  const best = store.best(s.key);
  const record = !!prev && pct > best && pct > prev.p;
  if (pct > best) store.setBest(s.key, pct);
  store.addAttempt({ t: Date.now(), k: s.key, m: s.mode, s: s.subject || '', n: total, c: full, p: pct, e: ent ? ent.total : null });
  const series = store.attemptsFor(s.key).slice(-8).map((a) => a.p);
  lastResult = { rows, total, full, pct, ent, prev, record, series, cfg: { mode: s.mode, subject: s.subject, topic: s.topic }, title: modeTitle(s) };
  ses = null;
  store.clearSession();
  toastEl.hidden = true;
  track('finish', { mode: s.mode, subject: s.subject || '', pct });
  store.flushNow();
  nav = [];
  cur = { name: 'results', params: {} };
  render();
  if (record) setTimeout(confetti, 300);
}

// ---------------------------------------------------------------- старт сессий
async function begin(cfg) {
  if (ses && ses.a.some((x) => x !== null)) {
    const ok = await tg.confirm(lang === 'kk' ? 'Аяқталмаған тест жойылады. Жаңасын бастаймыз ба?' : 'Незавершённый тест будет потерян. Начать новый?');
    if (!ok) return;
  }
  const q = cfg.q;
  if (!q.length) { toast(S().noQuestions, 3500); return; }
  let minutes = cfg.minutes || null;
  ses = {
    id: Date.now(), cfg: { mode: cfg.mode, subject: cfg.subject || null, topic: cfg.topic || null, count: cfg.count || null, variant: cfg.variant == null ? null : cfg.variant },
    variant: cfg.variant == null ? null : cfg.variant,
    mode: cfg.mode, subject: cfg.subject || null, topic: cfg.topic || null,
    key: cfg.mode === 'exam' ? examKey(cfg.variant) : keyOf(cfg.mode, cfg.subject, cfg.topic),
    q, a: q.map(() => null), flag: q.map(() => false), checked: q.map(() => false), rec: q.map(() => false),
    idx: 0, spent: 0, total: minutes ? minutes * 60 : null, left: minutes ? minutes * 60 : null, view: 'q',
  };
  if (cfg.need && q.length < cfg.need) toast(S().shortTest(q.length, cfg.need), 3200);
  persistNow();
  nav = []; cur = { name: 'question', params: {} }; lastKey = '';
  render();
  track('start', { mode: cfg.mode, subject: cfg.subject || '' });
}

function startPractice(subject, topic, n) {
  return begin({ mode: 'practice', subject, topic: topic || null, count: n, q: pool.buildQuestions({ subject, topic: topic || null, n }) });
}
function startMini() {
  return begin({ mode: 'mini', q: pool.buildMini(store.settings.track), minutes: 20, need: 20 });
}
function startSubject(subject) {
  const q = pool.buildSubjectTest(subject), info = SUBJECTS[subject];
  const minutes = Math.max(5, Math.round(info.minutes * (q.length / info.n)));
  return begin({ mode: 'subject', subject, q, minutes, need: info.n });
}
function startExam(variant = null) {
  const q = pool.buildFullExam(store.settings.track, variant);
  const minutes = Math.max(20, Math.round(EXAM_MINUTES * (q.length / 120)));
  return begin({ mode: 'exam', variant, q, minutes, need: 120 });
}
function restart(cfg) {
  if (cfg.mode === 'practice') return startPractice(cfg.subject, cfg.topic, cfg.count || 10);
  if (cfg.mode === 'mini') return startMini();
  if (cfg.mode === 'subject') return startSubject(cfg.subject);
  return startExam(cfg.variant == null ? null : cfg.variant);
}

// ---------------------------------------------------------------- результаты
function resultsScreen() {
  const r = lastResult;
  if (!r) return '';
  ui.main = { text: S().home, fn: goHome };
  const d = r.prev ? r.pct - r.prev.p : null;
  const big = r.ent ? `${r.ent.total}` : `${r.pct}%`;
  const sub = r.ent ? S().entPoints(r.ent.total, r.ent.nominal) : S().correctOf(r.full, r.total);

  // слабые темы
  const agg = {};
  r.rows.filter((x) => x.answered).forEach((x) => {
    const k = x.q.subject + '|' + x.q.topic;
    const a = agg[k] || (agg[k] = { s: x.q.subject, t: x.q.topic, ok: 0, n: 0 });
    a.n++; if (x.sc.full) a.ok++;
  });
  const weak = Object.values(agg).filter((a) => a.ok / a.n < 0.6).sort((a, b) => a.ok / a.n - b.ok / b.n).slice(0, 5);

  const order = r.rows.map((x, i) => ({ ...x, i })).sort((a, b) => (a.sc.full === b.sc.full ? a.i - b.i : a.sc.full ? 1 : -1));
  const review = order.map((x) => {
    const mark = !x.answered ? '○' : x.sc.full ? '✓' : x.sc.pts > 0 ? '≈' : '✗';
    const cls = !x.answered ? 'no' : x.sc.full ? 'ok' : 'bad';
    const L = x.q[lang];
    return `<details class="rv"><summary><span class="m ${cls}">${mark}</span><span>${x.i + 1}. ${rt(L.text.length > 120 ? L.text.slice(0, 117) + '...' : L.text)}</span></summary>
      <div class="body"><div>${S().yourAnswer}: ${esc(answerText(x.q, x.a))}</div>
      <div>${S().rightAnswer}: ${esc(answerText(x.q, x.q.answer, true))}</div>
      <div class="mt hint">${S().explanation}</div><div>${rt(L.explanation)}</div></div></details>`;
  }).join('');

  return `
    <div class="hint">${esc(r.title)}</div>
    <div class="score"><div class="big">${big}</div><div class="sub">${sub}</div>
      ${r.ent ? `<div class="sub">${S().correctOf(r.full, r.total)}</div>` : ''}
      ${d == null ? `<div class="delta">${S().firstTry}</div>` : `<div class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${S().vsPrev(d)}</div>`}
      ${r.record ? `<div class="record">🏆 ${S().newRecord}</div>` : ''}
    </div>
    <h2>${S().dynamics}</h2>${chartSvg(r.series)}
    <h2>${S().weakTopics}</h2>
    ${!Object.keys(agg).length ? `<div class="hint">${S().noData}</div>` : weak.length ? weak.map((w) => `<div class="weak"><div class="nm"><b>${esc(topicName(w.s, w.t, lang))}</b><div class="hint">${subjectName(w.s, lang)}</div></div>
      <div class="row"><span class="pc">${Math.round((w.ok / w.n) * 100)}%</span><button class="sbtn" data-act="startTopic" data-s="${w.s}" data-t="${w.t}">${S().practiceTopic}</button></div></div>`).join('') : `<div class="hint">${S().noWeak}</div>`}
    ${adHtml('partner')}
    <button class="btn center" data-act="share"><b>📤 ${S().share}</b></button>
    <button class="btn center" data-act="again"><b>🔁 ${S().again}</b></button>
    <h2>${S().review}</h2>${review}`;
}

function chartSvg(series) {
  if (!series || series.length < 2) return `<div class="hint">${S().firstTry}</div>`;
  const W = 320, H = 110, P = 14;
  const x = (i) => P + (i * (W - 2 * P)) / (series.length - 1);
  const y = (v) => H - P - (v / 100) * (H - 2 * P);
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    <line x1="${P}" y1="${y(0)}" x2="${W - P}" y2="${y(0)}" stroke="currentColor" opacity=".15"/>
    <line x1="${P}" y1="${y(50)}" x2="${W - P}" y2="${y(50)}" stroke="currentColor" opacity=".1" stroke-dasharray="3 4"/>
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${series.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="var(--accent)"/><text x="${x(i).toFixed(1)}" y="${(y(v) - 8).toFixed(1)}" text-anchor="middle">${v}</text>`).join('')}
  </svg>`;
}

function spark(series) {
  if (!series || series.length < 2) return '';
  const W = 150, H = 56, P = 6;
  const x = (k) => P + (k * (W - 2 * P)) / (series.length - 1);
  const y = (v) => H - P - (v / 100) * (H - 2 * P);
  const pts = series.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const lx = x(series.length - 1).toFixed(1), ly = y(series[series.length - 1]).toFixed(1);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lx}" cy="${ly}" r="3.5" fill="var(--accent)"/></svg>`;
}

function progressScreen() {
  const atts = store.allAttempts();
  const subs = subjList();
  const f = store.forecast();
  const series = atts.slice(-12).map((a) => a.p);
  const rows = subs.map((sj) => ({ sj, a: store.subjectAcc(sj) })).filter((x) => x.a);
  const subjRows = rows.map(({ sj, a }) => {
    const low = a.pct < 50;
    return `<div class="sr"><div class="h"><span>${subjectName(sj, lang)}</span><span class="v ${low ? 'low' : ''}">${a.pct}%</span></div><div class="m"><i class="${low ? 'low' : ''}" style="width:${a.pct}%"></i></div></div>`;
  }).join('');
  const weak = store.weakTopics(3);
  const weakRows = weak.map((w) => `<button class="wt" data-act="startTopic" data-s="${w.s}" data-t="${w.t}"><span class="t"><b>${esc(topicName(w.s, w.t, lang))}</b><small>${subjectName(w.s, lang)}</small></span><span class="p">${w.pct}%</span></button>`).join('');
  const accRows = subs.map((sj) => {
    const st = store.topicStats(sj);
    const r = Object.keys(TOPICS[sj]).map((tk) => {
      const x = st[tk];
      if (!x || !x[1]) return '';
      const pct = Math.round((x[0] / x[1]) * 100);
      const cls = pct >= 75 ? '' : pct >= 50 ? 'mid' : 'low';
      return `<div class="acc"><span class="nm">${esc(topicName(sj, tk, lang))}</span><span class="meter"><i class="${cls}" style="width:${pct}%"></i></span><span class="pc">${pct}%</span></div>`;
    }).join('');
    return r ? `<h2>${subjectName(sj, lang)}</h2>${r}` : '';
  }).join('');
  const hist = atts.slice(-20).reverse().map((a) => {
    const d = new Date(a.t);
    const nm = a.m === 'practice' ? S().modes.practice : a.m === 'subject' ? `${S().modes.subject}: ${subjectName(a.s, lang)}` : S().modes[a.m];
    return `<div class="hist"><span>${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} · ${esc(nm)}</span><b>${a.e != null ? a.e + ' · ' : ''}${a.p}%</b></div>`;
  }).join('');
  return `<h1>${S().progress}</h1>
    <div class="hero">
      <div><div class="num"><b>${f ? f.pts : '-'}</b><span>${S().outOf140}</span></div>
        <div class="sm">${f ? S().forecastBased(f.n) : S().forecastEmpty}</div></div>
      ${spark(series)}
    </div>
    ${rows.length ? `<div class="sec">${S().bySubject}<span>${S().accShort}</span></div>${subjRows}` : `<div class="empty">${S().progressEmpty}</div>`}
    ${weak.length ? `<div class="sec">${S().weakTopics}<span>${S().weakHint}</span></div>${weakRows}<button class="cta" data-act="startTopic" data-s="${weak[0].s}" data-t="${weak[0].t}">${S().trainWeak}</button>` : ''}
    ${accRows ? `<h2>${S().topicsAccuracy}</h2>${accRows}` : ''}
    ${hist ? `<h2>${S().historyTitle}</h2>${hist}` : ''}`;
}

// ---------------------------------------------------------------- карточка результата
function shareCard() {
  const r = lastResult;
  if (!r) return;
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, '#2f80ed'); grad.addColorStop(1, '#6a3df0');
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.beginPath(); g.arc(900, 260, 320, 0, 7); g.fill();
  g.beginPath(); g.arc(120, 1180, 260, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '700 64px system-ui, sans-serif'; g.fillText(S().app, 540, 190);
  g.font = '500 44px system-ui, sans-serif'; g.globalAlpha = .9; g.fillText(r.title.slice(0, 40), 540, 270); g.globalAlpha = 1;
  g.font = '800 340px system-ui, sans-serif';
  const big = r.ent ? String(r.ent.total) : r.pct + '%';
  g.fillText(big, 540, 760);
  g.font = '600 56px system-ui, sans-serif';
  g.fillText(r.ent ? S().entPoints(r.ent.total, r.ent.nominal) : S().correctOf(r.full, r.total), 540, 860);
  g.font = '500 44px system-ui, sans-serif'; g.globalAlpha = .9;
  g.fillText(`@${CONFIG.botUsername}`, 540, 1180);
  g.globalAlpha = 1;
  const url = c.toDataURL('image/png');
  const link = `https://t.me/${CONFIG.botUsername}`;
  const text = S().shareText(r.ent ? `${r.ent.total}/${r.ent.nominal}` : `${r.pct}%`);
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="box"><b>${S().shareTitle}</b><div class="hint">${S().shareHint}</div><img src="${url}" alt="">
    <button class="btn primary center" data-act="shareSend"><b>${S().shareSend}</b></button>
    <button class="btn center" data-act="closeModal"><b>${S().close}</b></button></div>`;
  m.dataset.link = link; m.dataset.text = text;
  document.body.appendChild(m);
}

function supportSheet() {
  const m = document.createElement('div');
  m.className = 'modal sheet';
  m.innerHTML = `<div class="box" role="dialog" aria-label="${S().supportTitle}"><div class="grab"></div>
    <h3>${S().supportTitle}</h3><div class="body">${S().supportBody}</div>
    <div class="cl">${S().cardLbl}</div><div class="cn">${esc(CONFIG.donateCard)}</div>
    <button class="cta" data-act="copyCard">${S().copyCard}</button>
    <div class="foot">${S().supportFoot}</div></div>`;
  m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
}

function confetti() {
  const cv = document.getElementById('confetti');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#2f80ed', '#e8a317', '#2e9e5b', '#e5484d', '#8e5cf7'];
  const ps = Array.from({ length: 110 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.4, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 7, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }));
  let t = 0;
  tg.haptic('success');
  (function frame() {
    g.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.r += .12; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); g.restore(); });
    if (++t < 130) requestAnimationFrame(frame); else g.clearRect(0, 0, cv.width, cv.height);
  })();
}

// ---------------------------------------------------------------- события
const ACT = {
  async setLang(d) {
    lang = d.v; store.setSettings({ lang });
    if (!store.settings.track) { show('track', {}, { replace: true }); return; }
    if (d.from === 'settings') { render(); return; }
    goHome();
  },
  async setTrack(d) {
    const first = !store.settings.onboarded;
    store.setSettings({ track: d.v, onboarded: true });
    track('track', { track: d.v, lang });
    if (first) { toast(S().firstQ, 1600); await startPractice(pool.trackSubjects(d.v)[0], null, 10); return; }
    if (d.from === 'settings') { render(); return; }
    goHome();
  },
  settings() { show('settings'); },
  subjectTopics(d) { show('topics', { subject: d.s }); },
  support() { supportSheet(); },
  async copyCard() {
    const num = CONFIG.donateCard;
    try { await navigator.clipboard.writeText(num); }
    catch (e) {
      const t = document.createElement('textarea'); t.value = num; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e2) { /* */ } t.remove();
    }
    tg.haptic('success'); toast(S().copied, 1800);
  },
  goTopics() { show('topics', { subject: subjList()[0] }); },
  topicSubject(d) { cur = { name: 'topics', params: { subject: d.s } }; render(); },
  topicCount(d) { topicCount = +d.n; cur = { name: 'topics', params: { subject: d.s } }; render(); },
  startTopic(d) { startPractice(d.s, d.t || null, topicCount); },
  startMini() { startMini(); },
  goSubjects() { show('subjects'); },
  startSubject(d) { startSubject(d.s); },
  goExams() { show('exams'); },
  startExam() { startExam(); },
  startVariant(d) { startExam(Number(d.v)); },
  goProgress() { show('progress'); },
  resume() { nav = []; cur = { name: 'question', params: {} }; lastKey = ''; render(); },
  pick(d) { pick(+d.k); },
  toggle(d) { toggle(+d.k); },
  mpick(d) { mpick(+d.r, +d.k); },
  flag() { ses.flag[ses.idx] = !ses.flag[ses.idx]; persist(); render(); },
  grid() { ses.view = 'grid'; render(); },
  jump(d) { goto(+d.i); },
  prev() { goto(ses.idx - 1); },
  skip() { goto(ses.idx + 1); },
  quit() { quit(); },
  report() {
    const q = ses.q[ses.idx];
    const url = `https://t.me/${CONFIG.ownerUsername}?text=${encodeURIComponent(S().reportMsg(q.id))}`;
    track('report', { id: q.id });
    tg.openTg(url);
  },
  openAd(d) { track('ad', { id: d.id }); tg.openLink(d.url); },
  openOwner() { tg.openTg(`https://t.me/${CONFIG.ownerUsername}`); },
  share() { shareCard(); },
  shareSend(d, el) {
    const m = el.closest('.modal');
    tg.openTg(`https://t.me/share/url?url=${encodeURIComponent(m.dataset.link)}&text=${encodeURIComponent(m.dataset.text)}`);
  },
  closeModal(d, el) { el.closest('.modal').remove(); },
  again() { if (lastResult) restart(lastResult.cfg); },
};

tabsEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tab]');
  if (el && el.dataset.tab !== cur.name) goTab(el.dataset.tab);
});
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset, el);
});
document.body.addEventListener('click', (e) => {
  const el = e.target.closest('.modal [data-act]');
  if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset, el);
});
app.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=link]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { persistNow(); store.flushNow(); } });
window.addEventListener('pagehide', persistNow);

// ---------------------------------------------------------------- запуск
async function boot() {
  tg.init();
  tg.onTheme(() => render());
  await store.init();
  const tgLang = tg.user() && tg.user().language_code;
  lang = store.settings.lang || (tgLang === 'kk' ? 'kk' : 'ru');
  const saved = store.loadSession();
  if (saved && saved.q && saved.q.length) ses = saved;

  if (!store.settings.lang) cur = { name: 'lang', params: {} };
  else if (!store.settings.track) cur = { name: 'track', params: {} };
  else cur = { name: 'home', params: {} };
  render();

  // подгружаем остальное в фоне, не задерживая первый экран
  pool.loadBanks().then(() => { if (cur.name === 'topics' || cur.name === 'home') render(); });
  fetch('./data/ads.json').then((r) => r.json()).then((j) => { ads = j; if (cur.name === 'home') render(); }).catch(() => {});
  loadKatex();
  track('open', { lang });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
boot();
