// Бот @enttrainer_bot: отвечает на /start приветствием и кнопкой, которая открывает тренажёр.
// Работает на Cloudflare Workers (бесплатно). Нужна одна секретная переменная: BOT_TOKEN.
// После публикации один раз откройте в браузере https://<адрес-воркера>/setup
// Он сам подключит вебхук, описание бота, команды и кнопку меню.
// Статистика (/stats только для владельца): нужна база D1, привязанная к воркеру под именем DB.
// Без базы бот работает как раньше, просто ничего не считает.

const APP_URL = 'https://damirnuss-bit.github.io/ent-trainer/ent-trainer/';

const T = {
  ru: {
    hello: (name) => `Привет${name ? ', ' + name : ''}! Это бесплатный тренажёр ЕНТ.

• Тесты по предметам ЕНТ: физмат и химбио, история Казахстана, грамотность чтения, математическая грамотность
• После каждого ответа сразу разбор
• Прогноз баллов из 140 и твои слабые темы
• Пробный ЕНТ: 120 заданий, 4 часа, как на экзамене
• На русском и казахском

Без рекламы и подписок. Жми кнопку ниже 👇`,
    other: 'Тренажёр открывается кнопкой ниже 👇',
    btn: 'Открыть тренажёр',
    menu: 'Тренажёр',
    cmdStart: 'Открыть тренажёр',
    cmdHelp: 'Что умеет бот',
    desc: 'Бесплатный тренажёр ЕНТ прямо в Telegram. Тесты с разбором каждого ответа, прогноз баллов, слабые темы, пробный ЕНТ на 120 заданий. Русский и казахский. Без рекламы и подписок.\n\nНажми «Старт» 👇',
    short: 'Бесплатный тренажёр ЕНТ: тесты с разбором, прогноз баллов, пробный ЕНТ. Без рекламы.',
  },
  kk: {
    hello: (name) => `Сәлем${name ? ', ' + name : ''}! Бұл ҰБТ-ға тегін тренажер.

• ҰБТ пәндері бойынша тесттер: физмат пен химбио, Қазақстан тарихы, оқу сауаттылығы, математикалық сауаттылық
• Әр жауаптан кейін бірден түсіндірме
• 140 балдан болжам және әлсіз тақырыптарың
• Сынақ ҰБТ: 120 тапсырма, 4 сағат, нағыз емтихандағыдай
• Қазақша және орысша

Жарнамасыз, жазылымсыз. Төмендегі батырманы бас 👇`,
    other: 'Тренажер төмендегі батырма арқылы ашылады 👇',
    btn: 'Тренажерді ашу',
    menu: 'Тренажер',
    cmdStart: 'Тренажерді ашу',
    cmdHelp: 'Бот не істей алады',
    desc: 'Telegram ішіндегі ҰБТ-ға тегін тренажер. Әр жауаптың түсіндірмесі бар тесттер, балл болжамы, әлсіз тақырыптар, 120 тапсырмалық сынақ ҰБТ. Қазақша және орысша. Жарнамасыз, жазылымсыз.\n\n«Бастау» батырмасын бас 👇',
    short: 'ҰБТ-ға тегін тренажер: түсіндірмесі бар тесттер, балл болжамы, сынақ ҰБТ. Жарнамасыз.',
  },
};

const OWNER_USERNAME = 'mariachiman88';
const TZ_OFFSET = 5 * 3600 * 1000; // Казахстан, UTC+5
const DAY = 86400 * 1000;

const SCHEMA = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  lang TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  last_app INTEGER,
  via TEXT
)`;

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare(SCHEMA).run();
  schemaReady = true;
}

// Запоминаем пользователя: когда пришёл впервые и когда был последний раз. via: 'bot' или 'app'
async function seen(env, user, via) {
  if (!env.DB || !user || !user.id || user.is_bot) return;
  await ensureSchema(env);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, username, lang, first_seen, last_seen, last_app, via) VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6)
     ON CONFLICT(id) DO UPDATE SET username = ?2, lang = COALESCE(?3, lang), last_seen = ?4, last_app = COALESCE(?5, last_app)`
  ).bind(user.id, user.username || null, user.language_code || null, now, via === 'app' ? now : null, via).run();
}

const isOwner = (env, from) => !!from && (String(from.id) === String(env.OWNER_ID || '') || (from.username || '').toLowerCase() === OWNER_USERNAME);

async function statsText(env) {
  if (!env.DB) return 'База для статистики не подключена (нужна D1 с именем DB в настройках воркера).';
  await ensureSchema(env);
  const now = Date.now();
  const today = Math.floor((now + TZ_OFFSET) / DAY) * DAY - TZ_OFFSET; // полночь по Казахстану
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).first('n');
  const [total, newToday, new7, act1, act7, act30, app7, kk] = await Promise.all([
    q('SELECT COUNT(*) n FROM users'),
    q('SELECT COUNT(*) n FROM users WHERE first_seen >= ?1', today),
    q('SELECT COUNT(*) n FROM users WHERE first_seen >= ?1', now - 7 * DAY),
    q('SELECT COUNT(*) n FROM users WHERE last_seen >= ?1', today),
    q('SELECT COUNT(*) n FROM users WHERE last_seen >= ?1', now - 7 * DAY),
    q('SELECT COUNT(*) n FROM users WHERE last_seen >= ?1', now - 30 * DAY),
    q('SELECT COUNT(*) n FROM users WHERE last_app >= ?1', now - 7 * DAY),
    q("SELECT COUNT(*) n FROM users WHERE lang LIKE 'kk%'"),
  ]);
  const { results } = await env.DB.prepare(
    `SELECT CAST((first_seen + ?1) / ?2 AS INTEGER) AS d, COUNT(*) AS n FROM users WHERE first_seen >= ?3 GROUP BY d ORDER BY d`
  ).bind(TZ_OFFSET, DAY, today - 6 * DAY).all();
  const byDay = new Map(results.map((r) => [Number(r.d), r.n]));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = Math.floor((today + TZ_OFFSET) / DAY) - i;
    const dt = new Date(d * DAY);
    days.push(`${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}: +${byDay.get(d) || 0}`);
  }
  const first = await env.DB.prepare('SELECT MIN(first_seen) n FROM users').first('n');
  const since = first ? new Date(first + TZ_OFFSET).toISOString().slice(0, 10).split('-').reverse().join('.') : 'сегодня';
  return `📊 Статистика бота

Всего пользователей: ${total}
Новые сегодня: ${newToday}
Новые за 7 дней: ${new7}

Активные сегодня: ${act1}
Активные за 7 дней: ${act7}
Активные за 30 дней: ${act30}
Открывали тренажёр за 7 дней: ${app7}

Казахский язык Telegram: ${kk} из ${total}

Новые по дням:
${days.join('\n')}

Считаем с ${since}. Активный = писал боту или открывал тренажёр.`;
}

// Проверка подписи initData из мини-приложения (чтобы никто не накрутил статистику)
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? new TextEncoder().encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data)));
}
async function checkInitData(env, initData) {
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const dcs = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac('WebAppData', env.BOT_TOKEN);
  const sig = [...(await hmac(secret, dcs))].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (sig !== hash) return null;
  const authDate = Number(p.get('auth_date') || 0) * 1000;
  if (Date.now() - authDate > 2 * DAY) return null;
  try { return JSON.parse(p.get('user') || 'null'); } catch (e) { return null; }
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };

const pick = (code) => (code && code.startsWith('kk') ? 'kk' : 'ru');

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function hookSecret(env) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ent-hook:' + env.BOT_TOKEN));
  return [...new Uint8Array(d)].slice(0, 24).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function onUpdate(env, u) {
  const m = u.message;
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const L = T[pick(m.from && m.from.language_code)];
  const text = (m.text || '').trim();
  try { await seen(env, m.from, 'bot'); } catch (e) { /* статистика не должна ломать бота */ }
  if (/^\/stats(@\w+)?$/i.test(text) && isOwner(env, m.from)) {
    let out;
    try { out = await statsText(env); } catch (e) { out = 'Ошибка статистики: ' + e.message; }
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: out });
    return;
  }
  const isStart = text.startsWith('/start') || text.startsWith('/help');
  await tg(env, 'sendMessage', {
    chat_id: m.chat.id,
    text: isStart ? L.hello(m.from && m.from.first_name) : L.other,
    reply_markup: { inline_keyboard: [[{ text: L.btn, web_app: { url: APP_URL } }]] },
  });
}

async function setup(env, origin) {
  const out = {};
  out.webhook = await tg(env, 'setWebhook', { url: origin + '/hook', secret_token: await hookSecret(env), allowed_updates: ['message'], drop_pending_updates: true });
  for (const [lc, L] of [['', T.ru], ['ru', T.ru], ['kk', T.kk]]) {
    const extra = lc ? { language_code: lc } : {};
    out['desc_' + (lc || 'default')] = await tg(env, 'setMyDescription', { description: L.desc, ...extra });
    out['short_' + (lc || 'default')] = await tg(env, 'setMyShortDescription', { short_description: L.short, ...extra });
    out['cmds_' + (lc || 'default')] = await tg(env, 'setMyCommands', { commands: [{ command: 'start', description: L.cmdStart }, { command: 'help', description: L.cmdHelp }], ...extra });
  }
  if (env.DB) { try { await ensureSchema(env); out.db = { ok: true }; } catch (e) { out.db = { ok: false, error: e.message }; } }
  out.menu = await tg(env, 'setChatMenuButton', { menu_button: { type: 'web_app', text: T.ru.menu, web_app: { url: APP_URL } } });
  return out;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.BOT_TOKEN) return new Response('Нет переменной BOT_TOKEN. Добавьте её в Settings → Variables and Secrets.', { status: 500 });

    if (req.method === 'POST' && url.pathname === '/hook') {
      if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== (await hookSecret(env))) return new Response('forbidden', { status: 403 });
      try { await onUpdate(env, await req.json()); } catch (e) { /* Telegram не должен получать ошибку, иначе будет повторять */ }
      return new Response('ok');
    }

    if (url.pathname === '/seen') {
      if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
      if (req.method === 'POST') {
        try {
          const user = await checkInitData(env, await req.text());
          if (user) await seen(env, user, 'app');
        } catch (e) { /* молча */ }
        return new Response('ok', { headers: CORS });
      }
    }

    if (url.pathname === '/setup') {
      const r = await setup(env, url.origin);
      const ok = Object.values(r).every((x) => x && x.ok);
      return new Response((ok ? 'Готово ✅ Бот настроен. Откройте его в Telegram и нажмите Старт.\n\n' : 'Что-то не так, детали ниже:\n\n') + JSON.stringify(r, null, 2),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    return new Response('ent-bot работает');
  },
};
