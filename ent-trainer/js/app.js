// Главный файл: экраны, навигация, тесты, результаты.
import { CONFIG } from './config.js';
import { SUBJECTS, TRACKS, REQUIRED, TOPICS, topicName, subjectName, EXAM_MINUTES } from './subjects.js';
import { STR } from './i18n.js';
import { tg, inTelegram } from './tg.js';
import { store } from './store.js';
import * as pool from './pool.js';
import { rt, typeset, loadKatex, escHtml as esc } from './render.js';
import { track, pingSeen } from './track.js';

const app = document.getElementById('app');
const tabsEl = document.getElementById('tabs');
const TABS = ['home', 'practice', 'league', 'progress', 'settings'];
// Иконки: контурные, 24×24, в духе SF Symbols
const ICON = {
  home: 'M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z',
  practice: 'M4 19.5V6a2 2 0 0 1 2-2h12v13H6a2 2 0 0 0-2 2.5Zm0 0A1.5 1.5 0 0 0 5.5 21H18M8 8h6',
  progress: 'M5 20v-8M12 20V4M19 20v-5',
  settings: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6',
  math: 'M4 7h6M7 4v6M14 7h6M5 15l4 4M9 15l-4 4M14 16h6M14 19.5h6',
  bolt: 'M13 2.5 5 13.5h6l-1 8 8-11h-6z',
  flask: 'M9 3h6M10 3v6l-5.2 9.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9V3M7.5 15h9',
  leaf: 'M5 20c0-9 5-15 15-15 0 10-6 15-14 15M5 20l7-7',
  landmark: 'M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18',
  chart: 'M5 19v-6M10 19V6M15 19v-9M20 19V9',
  book: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5V20',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4.5l2.5 2M9.5 2.5h5',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4',
  cap: 'M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11v5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-5',
  shuffle: 'M3 7h3.5c2 0 3 1 4.5 3.5l2 3.5c1.5 2.5 2.5 3.5 4.5 3.5H21M3 17h3.5c1.3 0 2.2-.5 3-1.5M14 8.5c.8-1 1.7-1.5 3-1.5H21M18 4l3 3-3 3M18 14l3 3-3 3',
  share: 'M12 3.5v11M7.5 8 12 3.5 16.5 8M6 12v7.5h12V12',
  retry: 'M4.5 12a7.5 7.5 0 1 0 2.5-5.6M4.5 3.5v4h4',
  flag: 'M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  warn: 'M12 9v4M12 16.8v.2M10.3 3.9 2.4 17.7A2 2 0 0 0 4.1 20.7h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  chev: 'M9 5.5l6.5 6.5L9 18.5',
  left: 'M15 5.5 8.5 12l6.5 6.5',
  right: 'M9 5.5l6.5 6.5L9 18.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M7 7l10 10M17 7 7 17',
  minus: 'M6 12h12',
  heart: 'M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z',
  chat: 'M4 5.5h16v11H9l-5 4z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9s-1.1 6.5-3.5 9c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
  play: 'M8 5v14l11-7z',
  flame: 'M12 21c-3.9 0-6.5-2.6-6.5-6.3 0-3.2 2.2-5.2 3.6-8 .5 1.6 1.4 2.8 2.6 3.5.3-3 1.4-5.4 3.3-6.7.3 3.6 4 6 4 10.4 0 4.2-2.8 7.1-7 7.1Z',
  league: 'M7 4h10v4.5a5 5 0 0 1-10 0zM7 6H4.5v1.5A3 3 0 0 0 7.5 10.5M17 6h2.5v1.5a3 3 0 0 1-3 3M12 13.5V17M8.5 20.5h7M10 17h4v3.5h-4z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13zM12 15v2',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5',
  scale: 'M12 3.5v17M7 20.5h10M4.5 7.5h15M7 7.5 4 14a3 3 0 0 0 6 0zM17 7.5 14 14a3 3 0 0 0 6 0z',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  code: 'M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15',
};
const ico = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;
const tile = (name, color) => `<span class="tl" style="--c:var(--t-${color})">${ico(name)}</span>`;
const SUBJ_ICON = { math: ['math', 'indigo'], physics: ['bolt', 'orange'], chemistry: ['flask', 'green'], biology: ['leaf', 'teal'], history: ['landmark', 'brown'], mathlit: ['chart', 'blue'], reading: ['book', 'pink'], geography: ['globe', 'yellow'], worldhist: ['landmark', 'red'], informatics: ['code', 'gray'], law: ['scale', 'brown'], english: ['chat', 'blue'], kazlang: ['pen', 'teal'], kazlit: ['book', 'teal'], ruslang: ['pen', 'red'], ruslit: ['book', 'red'] };
const subjTile = (s) => tile(...(SUBJ_ICON[s] || ['doc', 'gray']));
const chev = ico('chev', 'chev');
const LET = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const MLET = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж'];
// строка списка: <button class="btn"> с плиткой, текстом, значением справа и шевроном
const trackTiles = (id) => `<span class="tl2">${TRACKS[id].subjects.map(subjTile).join('')}</span>`;
const rowBtn = ({ act, data = '', icon = '', title, sub = '', val = '', valCls = '', right = '', arrow = true, cls = '' }) =>
  `<button class="btn ${cls}" data-act="${act}" ${data}>${icon}<span class="tx"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${val !== '' ? `<span class="val ${valCls}">${val}</span>` : ''}${right}${arrow ? chev : ''}</button>`;

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
  const on = TABS.includes(cur.name) && !!store.settings.track;
  tabsEl.hidden = !on;
  document.body.classList.toggle('has-tabs', on);
  if (!on) return;
  const names = { home: S().tabHome, practice: S().tabPractice, league: S().tabLeague, progress: S().tabProgress, settings: S().tabProfile };
  tabsEl.innerHTML = TABS.map((t) => `<button class="tab ${t === cur.name ? 'on' : ''}" data-tab="${t}" ${t === cur.name ? 'aria-current="page"' : ''}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[t]}"/></svg><span>${names[t]}</span></button>`).join('');
}

function goTab(name) {
  if (ses && cur.name === 'question') persistNow();
  if (name === 'league') syncLeague();
  nav = []; cur = { name, params: {} }; render();
}

// ---------------------------------------------------------------- экраны
const SCREENS = {
  lang() {
    ui.back = null;
    return `<h1>Тіл / Язык</h1><p class="lead">${S().pickLang}</p>
      <div class="list">${rowBtn({ act: 'setLang', data: 'data-v="kk"', title: 'Қазақша' })}${rowBtn({ act: 'setLang', data: 'data-v="ru"', title: 'Русский' })}</div>`;
  },

  track(p) {
    ui.back = p && p.fromSettings ? goBack : null;
    return `<h1>${S().pickTrack}</h1>
      <div class="list ic tr">${Object.entries(TRACKS).map(([id, t]) => rowBtn({ act: 'setTrack', data: `data-v="${id}"`, icon: trackTiles(id), title: t[lang] })).join('')}</div>`;
  },

  home() {
    if (!store.settings.track) return welcomeScreen();
    const f = store.forecast();
    const goal = CONFIG.dailyGoal;
    const ex = nextExam();
    const resume = ses && ses.q && ses.q.length && !ses.finished ? ses : null;
    const xg = xpGoal();
    const wk = store.xpWeekDays();
    const mx = Math.max(xg, ...wk);
    const bars = wk.map((n, k) => `<i class="${k === 6 ? 'now' : ''} ${n >= xg ? 'hit' : ''}" style="height:${Math.max(4, Math.round((n / mx) * 48))}px"></i>`).join('');
    const xt = store.xpToday(), st = store.streak(), done = xt >= xg;
    const goalCard = `<div class="card goal">
        <div class="gtop"><span class="fl ${store.streakToday() ? 'on' : ''}">${ico('flame')}<b>${st}</b></span>
          <span class="gt"><b>${st ? S().streakN(st) : S().streakZero}</b><small>${store.streakToday() || !st ? (done ? S().goalDone : S().goalLeft(xg - xt)) : S().streakAsk}</small></span>
          ${store.freezes() ? `<span class="fz" title="${esc(S().freezeHint)}">${ico('snow', 'sm')}${store.freezes()}</span>` : ''}</div>
        <div class="gbar"><i style="width:${Math.min(100, Math.round((xt / xg) * 100))}%"></i><span>${xt} / ${xg} XP</span></div>
      </div>`;
    const prem = CONFIG.premium && CONFIG.premium.enabled && !store.isPremium();
    const freeLeft = prem ? Math.max(0, freeLimit() - store.todayCount()) : null;
    const subs = [...pool.trackSubjects(store.settings.track), 'history', 'mathlit'];
    const rows = subs.map((sj) => {
      const a = store.subjectAcc(sj);
      return rowBtn({ act: 'subjectTopics', data: `data-s="${sj}"`, icon: subjTile(sj), title: subjectName(sj, lang), val: a ? a.pct + '%' : '', valCls: a && a.pct < 50 ? 'low' : '' });
    }).join('');
    const play = `<span class="pl"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON.play}"/></svg></span>`;
    const main = resume
      ? `<button class="go" data-act="resume"><span class="t"><b>${S().resume}</b><small>${esc(modeTitle(resume))}, ${S().resumeSub(resume.idx + 1, resume.q.length)}</small><span class="pb"><i style="width:${Math.round((resume.idx / resume.q.length) * 100)}%"></i></span></span>${play}</button>`
      : `<button class="go" data-act="startMini"><span class="t"><b>${S().mini}</b><small>${S().miniSub}</small></span>${play}</button>`;
    return `
      <h1>${S().app}</h1>
      ${goalCard}
      ${main}
      ${prem ? `<button class="freeline" data-act="premium">${S().freeLeft(freeLeft)}<span>${S().premiumTitle} ${ico('chev', 'sm')}</span></button>` : ''}
      <div class="card sum" style="margin-top:12px">
        <div class="top">
          <div><div class="lbl">${S().forecast}</div>
            <div class="num"><b class="${f ? '' : 'none'}">${f ? f.pts : '-'}</b><span>${S().outOf140}</span></div>
            <div class="sm">${f ? S().forecastBased(f.n) : S().forecastEmpty}</div></div>
          <div><div class="wk">${bars}</div><div class="wkl">${S().weekLbl}, XP</div></div>
        </div>
        ${ex ? `<div class="exam"><span>${S().examNext}, ${ex.date.getDate()} ${S().months[ex.date.getMonth()]}</span><b>${S().daysN(ex.days)}</b></div>` : ''}
      </div>
      ${adHtml('banner')}
      <h2>${S().subjectsLbl}</h2>
      <div class="list ic">${rows}</div>
      ${CONFIG.donateCard ? `<div class="list ic" style="margin-top:28px">${rowBtn({ act: 'support', icon: tile('heart', 'pink'), title: S().supportTitle })}</div>` : ''}
      <p class="foot">${S().nonprofit}</p>`;
  },

  practice() {
    return `<h1>${S().tabPractice}</h1><p class="lead">${S().practiceSub}</p>
      <div class="list ic">
        ${rowBtn({ act: 'goTopics', icon: tile('target', 'blue'), title: S().byTopic, sub: S().byTopicSub })}
        ${rowBtn({ act: 'startMini', icon: tile('timer', 'orange'), title: S().mini, sub: S().miniSub })}
        ${rowBtn({ act: 'goSubjects', icon: tile('doc', 'green'), title: S().subjTest, sub: S().subjTestSub })}
        ${rowBtn({ act: 'goExams', icon: tile('cap', 'indigo'), title: S().fullExam, sub: S().fullExamSub })}
      </div>`;
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
      return rowBtn({ act: 'startTopic', data: `data-s="${subject}" data-t="${tk}"`, cls: av ? '' : 'dim', title: esc(topicName(subject, tk, lang)),
        val: pct == null ? '' : pct + '%', valCls: pct != null && pct < 50 ? 'low' : '', right: pct == null ? '' : `<span class="meter"><i class="${cls}" style="width:${pct}%"></i></span>` });
    }).join('');
    return `<h1>${S().byTopic}</h1>
      <div class="chips">${subs.map((s) => `<button class="chip ${s === subject ? 'on' : ''}" data-act="topicSubject" data-s="${s}">${subjectName(s, lang)}</button>`).join('')}</div>
      <div class="seg wide">${[10, 20].map((n) => `<button class="chip ${n === topicCount ? 'on' : ''}" data-act="topicCount" data-n="${n}" data-s="${subject}">${S().questionsN(n)}</button>`).join('')}</div>
      <div class="list ic" style="margin-top:16px">${rowBtn({ act: 'startTopic', data: `data-s="${subject}" data-t=""`, icon: subjTile(subject), title: S().allTopics })}</div>
      <div class="list" style="margin-top:12px">${rows}</div>`;
  },

  subjects() {
    const subs = subjList();
    return `<h1>${S().subjTest}</h1><p class="lead">${S().subjTestSub}</p>
      <div class="list ic">${subs.map((s) => {
        const info = SUBJECTS[s];
        return rowBtn({ act: 'startSubject', data: `data-s="${s}"`, icon: subjTile(s), title: subjectName(s, lang), sub: `${S().questionsN(info.n)} · ${info.minutes} ${lang === 'kk' ? 'мин' : 'мин'}` });
      }).join('')}</div>`;
  },

  exams() {
    const tr = TRACKS[store.settings.track];
    const num = (n) => `<span class="tl" style="--c:var(--t-indigo)">${n}</span>`;
    return `<h1>${S().fullExam}</h1><p class="lead">${tr ? tr[lang] + ' · ' : ''}${S().fullExamSub}</p>
      <div class="list ic">${Array.from({ length: pool.VARIANTS }, (_, i) => rowBtn({ act: 'startVariant', data: `data-v="${i}"`, icon: num(i + 1), title: S().variantN(i + 1), sub: S().variantSub, right: locked() && i >= CONFIG.premium.freeVariants ? ico('lock', 'lk') : '' })).join('')}</div>
      <div class="list ic">${rowBtn({ act: 'startExam', icon: tile('shuffle', 'gray'), title: S().variantRandom, sub: S().variantRandomSub, right: locked() ? ico('lock', 'lk') : '' })}</div>`;
  },

  question() {
    if (!ses) { return ''; }
    return ses.view === 'grid' ? gridScreen() : questionScreen();
  },

  results() { return resultsScreen(); },
  league() { return leagueScreen(); },
  admin() { return adminScreen(); },
  progress() { return progressScreen(); },

  settings() {
    const st = store.settings;
    const ck = ico('check', 'ck');
    return `<h1>${S().tabProfile}</h1>
      <h2>${S().language}</h2>
      <div class="list">
        ${rowBtn({ act: 'setLang', data: 'data-v="kk" data-from="settings"', title: 'Қазақша', right: lang === 'kk' ? ck : '', arrow: false })}
        ${rowBtn({ act: 'setLang', data: 'data-v="ru" data-from="settings"', title: 'Русский', right: lang === 'ru' ? ck : '', arrow: false })}
      </div>
      <h2>${S().track}</h2>
      <div class="list ic tr">${Object.entries(TRACKS).map(([id, t]) => rowBtn({ act: 'setTrack', data: `data-v="${id}" data-from="settings"`, icon: trackTiles(id), title: t[lang], right: st.track === id ? ck : '', arrow: false })).join('')}</div>
      <h2>${S().goalTitle}</h2>
      <div class="list ic">${CONFIG.xpGoals.map((g, k) => rowBtn({ act: 'setGoal', data: `data-v="${g}"`, icon: tile('flame', ['yellow', 'orange', 'red', 'pink'][k] || 'orange'), title: S().goalNames[k] || g, sub: `${g} XP`, right: xpGoal() === g ? ck : '', arrow: false })).join('')}</div>
      ${CONFIG.premium && CONFIG.premium.enabled ? `<h2>${S().premiumTitle}</h2><div class="list ic">${store.isPremium()
        ? `<div class="lrow">${tile('star', 'yellow')}<span class="nm">${S().premiumActive}<br><span class="hint">${S().premiumUntil(fmtDate(store.premiumUntil()))}</span></span></div>`
        : rowBtn({ act: 'premium', icon: tile('star', 'yellow'), title: S().premiumTitle, sub: S().premiumSub })}</div>` : ''}
      ${isOwner ? `<h2>Владелец</h2><div class="list ic">${rowBtn({ act: 'openAdmin', icon: tile('chart', 'indigo'), title: 'Пульт управления', sub: 'пользователи, активность, оплаты' })}</div>` : ''}
      <h2>${S().about}</h2>
      <div class="list ic">
        ${rowBtn({ act: 'openOwner', icon: tile('chat', 'blue'), title: S().contact })}
        ${CONFIG.donateCard ? rowBtn({ act: 'support', icon: tile('heart', 'pink'), title: S().supportTitle }) : ''}
      </div>
      <p class="foot">${S().app} · ${CONFIG.version}<br>${S().nonprofit}</p>`;
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
    fb = `<div class="fb ${cls}" id="fb"><b class="v">${ico(sc.full ? 'check' : sc.pts > 0 ? 'minus' : 'x')}${word}${sc.full && ses.combo >= 3 ? `<span class="combo">${ico('flame', 'sm')}${S().combo(ses.combo)}</span>` : ''}</b>
      ${sc.full ? '' : `<div class="ra"><span class="hint">${S().rightAnswer}:</span> ${esc(answerText(q, q.answer, true))}</div>`}
      <div class="ex">${rt(L.explanation)}</div></div>`;
  }

  const passage = L.passage ? `<details class="passage" open><summary>${ico('book', 'sm')}${subjectName(q.subject, lang)}</summary>${rt(L.passage)}</details>` : '';
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
      <div class="qhead">
        <div class="side"><button class="icon-btn" data-act="quit" aria-label="${S().finish}">${ico('close')}</button>
          <span class="timer ${low ? 'low' : ''}" id="tm">${timerTxt}</span></div>
        <div class="mid"><b>${i + 1} / ${n}</b><small>${topicLbl}</small></div>
        <div class="side r">
          <button class="icon-btn ${flagOn ? 'on' : ''}" data-act="flag" aria-label="${S().flag}" aria-pressed="${flagOn}">${ico('flag')}</button>
          ${practice ? '' : `<button class="icon-btn" data-act="grid" aria-label="${S().overview}">${ico('grid')}</button>`}
        </div>
      </div>
      <div class="bar"><i style="width:${((i + (checked ? 1 : 0)) / n) * 100}%"></i></div>
    </div>
    ${passage}
    <div class="qtext">${rt(L.text)}</div>
    ${body}
    ${fb}
    <div class="qlinks">
      <button class="link" data-act="prev" ${i === 0 ? 'disabled' : ''}>${ico('left', 'sm')}${S().prev}</button>
      ${!last && !checked ? `<button class="link" data-act="skip">${S().skip}${ico('right', 'sm')}</button>` : '<span></span>'}
      <button class="link gray" data-act="report">${ico('warn', 'sm')}${S().reportError}</button>
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
  return `<div class="sub-hint">${S().chooseMany}</div><div class="opts">${L.options.map((o, k) => {
    let cls = 'multi';
    if (checked) cls += q.answer.includes(k) ? ' ok' : sel.includes(k) ? ' bad' : '';
    else if (sel.includes(k)) cls += ' sel';
    return `<button class="opt ${cls}" data-act="toggle" data-k="${k}" ${checked ? 'disabled' : ''}><span class="l">${sel.includes(k) || (checked && q.answer.includes(k)) ? ico('check', 'sm') : LET[k]}</span><span>${rt(o)}</span></button>`;
  }).join('')}</div>`;
}

function matchHtml(q, L, a, checked) {
  const sel = Array.isArray(a) ? a : q.answer.map(() => -1);
  return `<div class="sub-hint">${S().matchHint}</div><div class="match">
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
  return `<h1>${S().overview}</h1><p class="lead">${answered} / ${n}</p><div class="grid">${cells}</div>`;
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
  ses.combo = sc.full ? (ses.combo || 0) + 1 : 0;
  if (sc.full && ses.combo % 5 === 0) ses.bonus = (ses.bonus || 0) + 5;   // +5 XP за каждые 5 подряд
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
  // опыт: 10 за верный, бонус за серии подряд, за завершение и за идеальный тест
  const answered = rows.filter((r) => r.answered).length;
  const goalBefore = store.xpToday() >= xpGoal();
  const xp = answered ? full * 10 + (s.bonus || 0) + 10 + (pct === 100 && total >= 5 ? 20 : 0) : 0;
  if (xp) store.addXp(xp);
  const goalHit = !goalBefore && store.xpToday() >= xpGoal();
  lastResult = { rows, total, full, pct, ent, prev, record, series, cfg: { mode: s.mode, subject: s.subject, topic: s.topic }, title: modeTitle(s),
    xp, spent: s.spent, streak: store.streak(), goalHit };
  if (xp) syncLeague();
  ses = null;
  store.clearSession();
  toastEl.hidden = true;
  track('finish', { mode: s.mode, subject: s.subject || '', pct });
  store.flushNow();
  nav = [];
  cur = { name: 'results', params: {} };
  render();
  if (record || goalHit) setTimeout(confetti, 300);
  else maybeInterstitial();
}

// ---------------------------------------------------------------- старт сессий
async function begin(cfg) {
  if (ses && ses.a.some((x) => x !== null)) {
    const ok = await tg.confirm(lang === 'kk' ? 'Аяқталмаған тест жойылады. Жаңасын бастаймыз ба?' : 'Незавершённый тест будет потерян. Начать новый?');
    if (!ok) return;
  }
  if (locked() && store.todayCount() >= freeLimit()) { premiumSheet(S().premiumLimit(freeLimit())); return; }
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
  if (locked() && (variant == null || variant >= CONFIG.premium.freeVariants)) { premiumSheet(S().premiumLocked); return; }
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
    const mark = !x.answered ? 'minus' : x.sc.full ? 'check' : x.sc.pts > 0 ? 'minus' : 'x';
    const cls = !x.answered ? 'no' : x.sc.full ? 'ok' : x.sc.pts > 0 ? 'part' : 'bad';
    const L = x.q[lang];
    return `<details class="rv"><summary><span class="m ${cls}">${ico(mark)}</span><span>${x.i + 1}. ${(() => { const t = L.text.split('\n')[0]; return rt(t.length > 120 ? t.slice(0, 117) + '...' : t); })()}</span></summary>
      <div class="body"><div><span class="k">${S().yourAnswer}:</span> ${esc(answerText(x.q, x.a))}</div>
      <div><span class="k">${S().rightAnswer}:</span> ${esc(answerText(x.q, x.q.answer, true))}</div>
      <div class="mt k">${S().explanation}</div><div>${rt(L.explanation)}</div></div></details>`;
  }).join('');

  const stats = r.xp != null ? `<div class="done-h">${S().lessonDone}</div>
    <div class="stats">
      <div class="stat s-xp"><small>${S().xpEarned}</small><b>${ico('bolt', 'sm')}+${r.xp}</b></div>
      <div class="stat s-acc"><small>${S().accuracy}</small><b>${ico('target', 'sm')}${r.pct}%</b></div>
      <div class="stat s-tm"><small>${S().timeLbl}</small><b>${ico('timer', 'sm')}${fmtTime(r.spent || 0)}</b></div>
    </div>
    ${r.streak ? `<div class="streakline">${ico('flame')}<b>${S().streakN(r.streak)}</b>${r.goalHit ? `<span>${S().goalDone}</span>` : ''}</div>` : ''}` : '';
  return `
    ${stats}
    <div class="res-title">${esc(r.title)}</div>
    <div class="card score"><div class="big">${big}</div><div class="sub">${sub}</div>
      ${r.ent ? `<div class="sub">${S().correctOf(r.full, r.total)}</div>` : ''}
      ${d == null ? `<div class="delta">${S().firstTry}</div>` : `<div class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${S().vsPrev(d)}</div>`}
      ${r.record ? `<div><span class="record">${ico('star', 'sm')}${S().newRecord}</span></div>` : ''}
    </div>
    <div class="acts">
      <button class="btn plain" data-act="share">${ico('share', 'sm')}<b>${S().shareShort}</b></button>
      <button class="btn plain" data-act="again">${ico('retry', 'sm')}<b>${S().again}</b></button>
    </div>
    <h2>${S().weakTopics}</h2>
    ${!Object.keys(agg).length ? `<div class="empty">${S().noData}</div>` : weak.length ? `<div class="list">${weak.map((w) => `<div class="lrow"><span class="nm">${esc(topicName(w.s, w.t, lang))}<br><span class="hint">${subjectName(w.s, lang)} · <span class="pc low">${Math.round((w.ok / w.n) * 100)}%</span></span></span>
      <button class="sbtn" data-act="startTopic" data-s="${w.s}" data-t="${w.t}">${S().practiceTopic}</button></div>`).join('')}</div>` : `<div class="empty">${S().noWeak}</div>`}
    ${adHtml('partner')}
    ${r.series && r.series.length > 1 ? `<h2>${S().dynamics}</h2><div class="card">${chartSvg(r.series)}</div>` : ''}
    <h2>${S().review}</h2><div class="list">${review}</div>`;
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
  const meter = (pct) => `<span class="meter"><i class="${pct >= 75 ? '' : pct >= 50 ? 'mid' : 'low'}" style="width:${pct}%"></i></span>`;
  const subjRows = rows.map(({ sj, a }) => rowBtn({ act: 'subjectTopics', data: `data-s="${sj}"`, icon: subjTile(sj), title: subjectName(sj, lang),
    val: a.pct + '%', valCls: a.pct < 50 ? 'low' : '', right: meter(a.pct) })).join('');
  const weak = store.weakTopics(3);
  const weakRows = weak.map((w) => rowBtn({ act: 'startTopic', data: `data-s="${w.s}" data-t="${w.t}"`, icon: subjTile(w.s), title: esc(topicName(w.s, w.t, lang)),
    sub: subjectName(w.s, lang), val: w.pct + '%', valCls: 'low' })).join('');
  const accRows = subs.map((sj) => {
    const st = store.topicStats(sj);
    const r = Object.keys(TOPICS[sj]).map((tk) => {
      const x = st[tk];
      if (!x || !x[1]) return '';
      const pct = Math.round((x[0] / x[1]) * 100);
      return `<div class="lrow acc"><span class="nm">${esc(topicName(sj, tk, lang))}</span>${meter(pct)}<span class="pc ${pct < 50 ? 'low' : ''}">${pct}%</span></div>`;
    }).join('');
    return r ? `<div class="subh">${subjectName(sj, lang)}</div><div class="list">${r}</div>` : '';
  }).join('');
  const hist = atts.slice(-20).reverse().map((a) => {
    const d = new Date(a.t);
    const nm = a.m === 'practice' ? S().modes.practice : a.m === 'subject' ? `${S().modes.subject}: ${subjectName(a.s, lang)}` : S().modes[a.m];
    return `<div class="lrow hist"><span class="nm"><span class="d">${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}</span>${esc(nm)}</span><b>${a.e != null ? a.e + ' · ' : ''}${a.p}%</b></div>`;
  }).join('');
  return `<h1>${S().progress}</h1>
    <div class="card sum"><div class="top">
      <div><div class="lbl">${S().forecast}</div><div class="num"><b class="${f ? '' : 'none'}">${f ? f.pts : '-'}</b><span>${S().outOf140}</span></div>
        <div class="sm">${f ? S().forecastBased(f.n) : S().forecastEmpty}</div></div>
      ${spark(series)}
    </div></div>
    ${rows.length ? `<h2>${S().bySubject}<span>${S().accShort}</span></h2><div class="list ic">${subjRows}</div>` : `<div class="empty" style="margin-top:12px">${S().progressEmpty}</div>`}
    ${weak.length ? `<h2>${S().weakTopics}<span>${S().weakHint}</span></h2><div class="list ic">${weakRows}</div><button class="cta" data-act="startTopic" data-s="${weak[0].s}" data-t="${weak[0].t}">${S().trainWeak}</button>` : ''}
    ${accRows ? `<h2>${S().topicsAccuracy}</h2>${accRows}` : ''}
    ${hist ? `<h2>${S().historyTitle}</h2><div class="list">${hist}</div>` : ''}`;
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
  m.innerHTML = `<div class="box" role="dialog"><div class="grab"></div><b>${S().shareTitle}</b><div class="hint">${S().shareHint}</div><img src="${url}" alt="">
    <button class="btn primary center" data-act="shareSend"><b>${S().shareSend}</b></button>
    <button class="btn plain center" data-act="closeModal"><b>${S().close}</b></button></div>`;
  m.dataset.link = link; m.dataset.text = text;
  m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
}

function supportSheet() {
  const m = document.createElement('div');
  m.className = 'modal sheet';
  m.innerHTML = `<div class="box" role="dialog" aria-label="${S().supportTitle}"><div class="grab"></div>
    <h3>${S().supportTitle}</h3><div class="body">${S().supportBody}</div>
    <div class="card cardnum"><div class="cl">${S().cardLbl}</div><div class="cn">${esc(CONFIG.donateCard)}</div></div>
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

// ---------------------------------------------------------------- опыт, лига, полный доступ
const needBanks = () => [...REQUIRED, ...(store.settings.track ? pool.trackSubjects(store.settings.track) : [])];
const xpGoal = () => store.settings.xpGoal || CONFIG.xpGoalDefault;
const locked = () => !!(CONFIG.premium && CONFIG.premium.enabled) && !store.isPremium();
const fmtDate = (ms) => { const d = new Date(ms); return `${d.getDate()} ${S().months[d.getMonth()]} ${d.getFullYear()}`; };

// запрос к серверу бота с подписанным initData; вне Telegram null
async function api(path, extra = {}) {
  if (!inTelegram || !CONFIG.apiUrl) return null;
  try {
    const r = await fetch(CONFIG.apiUrl + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ initData: tg.W.initData, ...extra }) });
    return await r.json();
  } catch (e) { return null; }
}

let isOwner = false;
async function refreshPremium() {
  const r = await api('/me');
  if (r && r.ok) {
    if (r.owner && !isOwner) { isOwner = true; if (cur.name === 'settings') render(); }
    const was = store.isPremium();
    store.setPremium(r.premium || 0);
    if (was !== store.isPremium() && TABS.includes(cur.name)) render();
  }
  return r;
}

let league = { state: 'idle', data: null };
async function syncLeague() {
  if (!inTelegram) { league = { state: 'offline', data: null }; return; }
  if (league.state !== 'ok') league.state = 'loading';
  const r = await api('/league', { xp: store.xpWeek() });
  league = r && r.ok ? { state: 'ok', data: r } : { state: league.data ? 'ok' : 'error', data: league.data };
  if (cur.name === 'league') render();
}

function leagueScreen() {
  if (league.state === 'idle') setTimeout(syncLeague, 0);
  const d = league.data;
  let body;
  if (league.state === 'offline' || !inTelegram) body = `<div class="empty">${S().leagueOffline}</div>`;
  else if (!d && league.state === 'error') body = `<div class="empty">${S().leagueErr}</div>`;
  else if (!d) body = `<div class="empty">...</div>`;
  else if (!d.top.length) body = `<div class="empty">${S().leagueNone}</div>`;
  else body = `<div class="list lg">${d.top.map((u, k) => `<div class="lrow ${u.me ? 'me' : ''}"><span class="rk r${k + 1}">${k + 1}</span><span class="nm">${esc(u.name)}${u.me ? ` <span class="hint">(${S().you})</span>` : ''}</span><b>${u.xp} XP</b></div>`).join('')}</div>`;
  const me = d && d.rank ? `<div class="card lme"><span class="fl on">${ico('league')}</span><span class="gt"><b>${S().leagueYou(d.rank, d.total)}</b><small>${store.xpWeek()} XP</small></span></div>`
    : d ? `<div class="card lme"><span class="fl">${ico('league')}</span><span class="gt"><b>${S().leagueNone}</b></span></div>` : '';
  return `<h1>${S().leagueTitle}</h1><p class="lead">${S().leagueSub}</p>${me}<div style="margin-top:12px">${body}</div>`;
}

function premiumSheet(reason) {
  if (document.querySelector('.modal.sheet')) return;
  const m = document.createElement('div');
  m.className = 'modal sheet';
  const icons = [['bolt', 'orange'], ['cap', 'indigo'], ['doc', 'green'], ['heart', 'pink']];
  m.innerHTML = `<div class="box" role="dialog" aria-label="${S().premiumTitle}"><div class="grab"></div>
    <div class="phead">${tile('star', 'yellow')}<div><h3>${S().premiumTitle}</h3><div class="hint">${S().premiumSub}</div></div></div>
    ${reason ? `<div class="preason">${esc(reason)}</div>` : ''}
    <div class="list ic" style="margin-top:14px">${S().premiumPoints.map((x, k) => `<div class="lrow">${tile(...icons[k % icons.length])}<span class="nm">${x}</span></div>`).join('')}</div>
    <button class="cta" data-act="buy">${S().premiumBuy(CONFIG.premium.stars)}</button>
    ${reason && canReward() ? `<button class="btn plain center" style="margin-top:10px" data-act="watchAd">${ico('play', 'sm')}<b>${S().adWatch(adCfg().rewardQuestions || 10)}</b></button>` : ''}
    <div class="foot" style="text-align:center">${S().premiumFoot}</div></div>`;
  m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
  document.body.appendChild(m);
}

async function buy(el) {
  if (!inTelegram || !tg.W.openInvoice) { toast(S().premiumOutside); tg.openTg(`https://t.me/${CONFIG.botUsername}?start=premium`); return; }
  if (el) el.disabled = true;
  const r = await api('/invoice');
  if (el) el.disabled = false;
  if (!r || !r.ok || !r.link) { toast(S().premiumErr, 3000); return; }
  tg.W.openInvoice(r.link, async (status) => {
    if (status !== 'paid') return;
    // оплата прошла: ждём, пока бот запишет её, и проверяем доступ на сервере
    for (let k = 0; k < 6; k++) {
      await new Promise((res) => setTimeout(res, 1200));
      const me = await refreshPremium();
      if (me && me.ok && me.premium > Date.now()) break;
    }
    document.querySelectorAll('.modal.sheet').forEach((x) => x.remove());
    tg.haptic('success'); toast(S().premiumThanks, 2600); confetti(); render();
  });
}

// ---------------------------------------------------------------- реклама для бесплатных (AdsGram)
const adCfg = () => CONFIG.ads || {};
const adsOn = () => locked() && (adCfg().rewardBlockId || adCfg().interstitialBlockId);
let adSdk = null, adLast = 0, adFinishes = 0;
function loadAdSdk() {
  if (adSdk) return adSdk;
  adSdk = new Promise((res) => {
    if (window.Adsgram) return res(window.Adsgram);
    const sc = document.createElement('script');
    sc.src = 'https://sad.adsgram.ai/js/sad.min.js'; sc.async = true;
    sc.onload = () => res(window.Adsgram || null);
    sc.onerror = () => { adSdk = null; res(null); };
    document.head.appendChild(sc);
  });
  return adSdk;
}
async function showAd(blockId) {
  if (!blockId) return false;
  const A = await loadAdSdk();
  if (!A) return false;
  try { const r = await A.init({ blockId: String(blockId) }).show(); return !!(r && r.done); } catch (e) { return false; }
}
// межстраничная после теста: не после каждого и не чаще раза в N секунд
function maybeInterstitial() {
  const c = adCfg();
  if (!adsOn() || !c.interstitialBlockId) return;
  adFinishes += 1;
  if (adFinishes % (c.interstitialEvery || 2) !== 0 || Date.now() - adLast < (c.interstitialGapSec || 180) * 1000) return;
  adLast = Date.now();
  setTimeout(() => showAd(c.interstitialBlockId), 900);
}
const canReward = () => adsOn() && !!adCfg().rewardBlockId && store.adRewardsToday() < (adCfg().rewardPerDay || 3);
const freeLimit = () => CONFIG.premium.freeDaily + store.adRewardsToday() * (adCfg().rewardQuestions || 10);
async function watchReward(el) {
  if (el) el.disabled = true;
  const ok = await showAd(adCfg().rewardBlockId);
  if (el) el.disabled = false;
  if (!ok) { toast(S().adFail, 2600); return; }
  store.addAdReward();
  document.querySelectorAll('.modal.sheet').forEach((x) => x.remove());
  tg.haptic('success'); toast(S().adThanks(adCfg().rewardQuestions || 10), 2400);
  render();
}

// ---------------------------------------------------------------- пульт владельца (только по проверке на сервере)
let admin = { state: 'idle', data: null };
async function loadAdmin() {
  admin.state = 'loading';
  const r = await api('/admin');
  admin = r && r.ok ? { state: 'ok', data: r } : { state: 'error', data: null, err: r && r.error };
  if (cur.name === 'admin') render();
}
function barsSvg(vals, color, labels) {
  const W = 320, H = 110, n = vals.length, mx = Math.max(1, ...vals), bw = W / n;
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 14}" role="img">${vals.map((v, k) => {
    const h = Math.round((v / mx) * (H - 14));
    return `<rect x="${(k * bw + 1).toFixed(1)}" y="${H - h}" width="${(bw - 2).toFixed(1)}" height="${Math.max(h, 1)}" rx="2" fill="${color}" opacity="${k === n - 1 ? 1 : 0.75}"/>${v && (k === n - 1 || v === mx) ? `<text x="${(k * bw + bw / 2).toFixed(1)}" y="${H - h - 3}" text-anchor="middle">${v}</text>` : ''}`;
  }).join('')}${labels.map(([k, t]) => `<text x="${(k * bw + bw / 2).toFixed(1)}" y="${H + 12}" text-anchor="middle">${t}</text>`).join('')}</svg>`;
}
function adminScreen() {
  if (admin.state === 'idle') setTimeout(loadAdmin, 0);
  if (!inTelegram) return `<h1>Пульт</h1><div class="empty">Пульт открывается внутри Telegram: команда /admin в боте.</div>`;
  if (admin.state === 'error') return `<h1>Пульт</h1><div class="empty">${admin.err === 'forbidden' ? 'Доступ только для владельца.' : 'Не удалось загрузить данные.'}</div><button class="cta" data-act="adminReload">Обновить</button>`;
  const d = admin.data;
  if (!d) return `<h1>Пульт</h1><div class="empty">Загружаю...</div>`;
  const kpi = (t, v, sub = '') => `<div class="kpi"><small>${t}</small><b>${v}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  const days = d.days, lbl = days.map((x, k) => [k, x.day.slice(8, 10) + '.' + x.day.slice(5, 7)]).filter(([k]) => k % 7 === 2 || k === days.length - 1);
  const today = days[days.length - 1] || {};
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '0%');
  return `<div class="topbar"><h1>Пульт</h1><button class="sbtn" data-act="adminReload">${ico('retry', 'sm')}</button></div>
    <p class="lead">Данные бота и тренажёра. Активный = писал боту или открывал тренажёр в этот день.</p>
    <div class="kpis">
      ${kpi('Всего уникальных', d.total, `тренажёр открывали: ${d.appUsers}`)}
      ${kpi('Сегодня', d.dau, `новых: ${today.fresh || 0}`)}
      ${kpi('За 7 дней', d.wau, `DAU/WAU ${pct(d.dau, d.wau)}`)}
      ${kpi('За 30 дней', d.mau)}
      ${kpi('Полный доступ', d.premium, `конверсия ${pct(d.premium, d.total)}`)}
      ${kpi('Звёзд получено', d.stars + ' ⭐')}
    </div>
    <h2>Активные по дням<span>30 дней</span></h2><div class="card">${barsSvg(days.map((x) => x.active), 'var(--accent)', lbl)}</div>
    <h2>Новые пользователи<span>30 дней</span></h2><div class="card">${barsSvg(days.map((x) => x.fresh), 'var(--t-green)', lbl)}</div>
    <h2>Оплаты<span>30 дней</span></h2><div class="card">${barsSvg(days.map((x) => x.paid), '#F2A21E', lbl)}</div>
    <h2>Лига этой недели<span>${d.league} участн.</span></h2>
    ${d.top.length ? `<div class="list lg">${d.top.map((u, k) => `<div class="lrow"><span class="rk r${k + 1}">${k + 1}</span><span class="nm">${esc(u.name)}</span><b>${u.xp} XP</b></div>`).join('')}</div>` : '<div class="empty">Пока пусто</div>'}
    <div class="list" style="margin-top:12px"><div class="lrow"><span class="nm">Казахский язык Telegram</span><b>${d.kk} из ${d.total}</b></div></div>
    <p class="foot">Команда /stats в боте присылает сводку текстом.</p>`;
}

// ---------------------------------------------------------------- первый запуск
function welcomeScreen() {
  ui.back = null;
  const ex = nextExam();
  const pts = S().welcomePoints;
  const pIcons = [['doc', 'green'], ['chart', 'blue'], ['cap', 'indigo'], ['heart', 'pink']];
  return `
    <div class="navrow"><div class="seg"><button class="chip ${lang === 'kk' ? 'on' : ''}" data-act="setLang" data-v="kk">Қаз</button><button class="chip ${lang === 'ru' ? 'on' : ''}" data-act="setLang" data-v="ru">Рус</button></div></div>
    <h1 style="margin-top:4px">${S().app}</h1>
    <p class="lead">${S().welcomeTitle}</p>
    ${ex ? `<div class="card exam-solo"><span class="hint">${S().examNext}, ${ex.date.getDate()} ${S().months[ex.date.getMonth()]}</span><b>${S().daysN(ex.days)}</b></div>` : ''}
    <div class="list ic" style="margin-top:12px">${pts.map((x, k) => `<div class="lrow">${tile(...pIcons[k % pIcons.length])}<span class="nm">${x}</span></div>`).join('')}</div>
    <h2>${S().pickTrack}</h2>
    <div class="list ic tr">${Object.entries(TRACKS).map(([id, t]) => rowBtn({ act: 'setTrack', data: `data-v="${id}"`, icon: trackTiles(id), title: t[lang] })).join('')}</div>
    <p class="foot">${S().nonprofit}</p>`;
}

// ---------------------------------------------------------------- события
const ACT = {
  async setLang(d) {
    lang = d.v; store.setSettings({ lang });
    render();
  },
  async setTrack(d) {
    const first = !store.settings.onboarded;
    store.setSettings({ track: d.v, onboarded: true });
    pool.ensureBanks(needBanks());
    track('track', { track: d.v, lang });
    if (first) { goHome(); toast(S().trackSaved, 1800); return; }
    if (d.from === 'settings') { render(); return; }
    goHome();
  },
  settings() { show('settings'); },
  setGoal(d) { store.setSettings({ xpGoal: Number(d.v) }); tg.haptic('select'); render(); },
  premium() { premiumSheet(''); },
  openAdmin() { admin = { state: 'idle', data: null }; show('admin'); },
  adminReload() { admin = { state: 'idle', data: null }; render(); },
  buy(d, el) { buy(el); },
  watchAd(d, el) { watchReward(el); },
  async subjectTopics(d) { show('topics', { subject: d.s }); await pool.ensureBanks([d.s]); if (cur.name === 'topics') render(); },
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
  async topicSubject(d) { cur = { name: 'topics', params: { subject: d.s } }; render(); await pool.ensureBanks([d.s]); if (cur.name === 'topics' && cur.params.subject === d.s) render(); },
  topicCount(d) { topicCount = +d.n; cur = { name: 'topics', params: { subject: d.s } }; render(); },
  async startTopic(d) { await pool.ensureBanks([d.s]); startPractice(d.s, d.t || null, topicCount); },
  startMini() { startMini(); },
  goSubjects() { show('subjects'); },
  async startSubject(d) { await pool.ensureBanks([d.s]); startSubject(d.s); },
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
// Тема: в Telegram берём светлую/тёмную из клиента и красим шапку и низ под фон приложения
function applyTheme() {
  const W = tg.W;
  if (!W || !inTelegram) return;
  const dark = W.colorScheme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const bg = dark ? '#000000' : '#F2F2F7';
  try {
    if (W.setHeaderColor) W.setHeaderColor(bg);
    if (W.setBackgroundColor) W.setBackgroundColor(bg);
    if (W.setBottomBarColor) W.setBottomBarColor(bg);
    if (W.MainButton && W.MainButton.setParams) W.MainButton.setParams({ color: dark ? '#5E86FF' : '#2C5BD8', text_color: '#FFFFFF' });
  } catch (e) { /* старые версии клиента */ }
}

async function boot() {
  tg.init();
  applyTheme();
  tg.onTheme(() => { applyTheme(); render(); });
  await store.init();
  const tgLang = tg.user() && tg.user().language_code;
  lang = store.settings.lang || (tgLang === 'kk' ? 'kk' : 'ru');
  const saved = store.loadSession();
  if (saved && saved.q && saved.q.length) ses = saved;

  // первый запуск сразу на главную: язык берём из Telegram, профиль выбирается на главной
  cur = { name: 'home', params: {} };
  if (location.hash === '#admin') { nav = [cur]; cur = { name: 'admin', params: {} }; }
  render();

  // подгружаем остальное в фоне, не задерживая первый экран
  // банки грузим по нужде: сначала обязательные и профильные предметы, остальное при открытии
  pool.ensureBanks(needBanks()).then(() => { if (cur.name === 'topics' || cur.name === 'home') render(); });
  fetch('./data/ads.json').then((r) => r.json()).then((j) => { ads = j; if (cur.name === 'home') render(); }).catch(() => {});
  loadKatex();
  track('open', { lang });
  pingSeen();
  refreshPremium();
  const frozen = store.takeSavedNote();
  if (frozen) setTimeout(() => toast(S().freezeUsed(frozen), 3200), 600);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
boot();
