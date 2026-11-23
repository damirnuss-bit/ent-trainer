// Бот @enttrainer_bot: отвечает на /start приветствием и кнопкой, которая открывает тренажёр.
// Работает на Cloudflare Workers (бесплатно). Нужна одна секретная переменная: BOT_TOKEN.
// После публикации один раз откройте в браузере https://<адрес-воркера>/setup
// Он сам подключит вебхук, описание бота, команды и кнопку меню.
// Статистика (/stats только для владельца): нужна база D1, привязанная к воркеру под именем DB.
// Без базы бот работает как раньше, просто ничего не считает.

const APP_URL = 'https://damirnuss-bit.github.io/ent-trainer/ent-trainer/';

const T = {
  ru: {
    hello: (name) => `Привет${name ? ', ' + name : ''}! Это тренажёр ЕНТ.

• Тесты по всем предметам ЕНТ: обязательным и профильным
• После каждого ответа сразу разбор
• Прогноз баллов из 140 и твои слабые темы
• Пробный ЕНТ: 120 заданий, 4 часа, как на экзамене
• На русском и казахском

• Серии дней, опыт и недельная лига

Основное бесплатно. Жми кнопку ниже 👇`,
    other: 'Тренажёр открывается кнопкой ниже 👇',
    btn: 'Открыть тренажёр',
    menu: 'Тренажёр',
    cmdStart: 'Открыть тренажёр',
    cmdHelp: 'Что умеет бот',
    cmdPremium: 'Полный доступ за звёзды',
    cmdSupport: 'Помощь с оплатой',
    cmdTerms: 'Условия оплаты',
    desc: 'Тренажёр ЕНТ прямо в Telegram. Тесты по всем предметам с разбором каждого ответа, прогноз баллов, слабые темы, пробный ЕНТ на 120 заданий, серии дней и лига. Русский и казахский. Основное бесплатно.\n\nНажми «Старт» 👇',
    short: 'Тренажёр ЕНТ: тесты с разбором по всем предметам, прогноз баллов, пробный ЕНТ.',
  },
  kk: {
    hello: (name) => `Сәлем${name ? ', ' + name : ''}! Бұл ҰБТ-ға дайындық тренажері.

• ҰБТ-ның барлық пәндері бойынша тесттер: міндетті және бейіндік
• Әр жауаптан кейін бірден түсіндірме
• 140 балдан болжам және әлсіз тақырыптарың
• Сынақ ҰБТ: 120 тапсырма, 4 сағат, нағыз емтихандағыдай
• Қазақша және орысша

• Күндер сериясы, тәжірибе ұпайы және апталық лига

Негізгісі тегін. Төмендегі батырманы бас 👇`,
    other: 'Тренажер төмендегі батырма арқылы ашылады 👇',
    btn: 'Тренажерді ашу',
    menu: 'Тренажер',
    cmdStart: 'Тренажерді ашу',
    cmdHelp: 'Бот не істей алады',
    cmdPremium: 'Жұлдызбен толық қолжетімділік',
    cmdSupport: 'Төлем бойынша көмек',
    cmdTerms: 'Төлем шарттары',
    desc: 'Telegram ішіндегі ҰБТ тренажері. Барлық пәндер бойынша әр жауаптың түсіндірмесі бар тесттер, балл болжамы, әлсіз тақырыптар, 120 тапсырмалық сынақ ҰБТ, күндер сериясы және лига. Қазақша және орысша. Негізгісі тегін.\n\n«Бастау» батырмасын бас 👇',
    short: 'ҰБТ тренажері: барлық пәндер бойынша түсіндірмесі бар тесттер, балл болжамы, сынақ ҰБТ.',
  },
};

const OWNER_USERNAME = 'mariachiman88';

// Полный доступ за Telegram Stars. Цену можно поменять переменной PREMIUM_STARS в настройках воркера.
const PREMIUM_STARS = 250;
const PREMIUM_UNTIL = Date.UTC(2027, 7, 31, 18); // доступ действует до 31 августа 2027 (после всех потоков ЕНТ)
const PAY = {
  ru: { title: 'Полный доступ к тренажёру ЕНТ', desc: 'Безлимитные тесты, все варианты пробного ЕНТ, без рекламы. Один платёж до 31 августа 2027.', label: 'Полный доступ',
    thanks: 'Оплата прошла ✅ Полный доступ открыт до 31 августа 2027. Возвращайся в тренажёр 👇', support: 'Вопросы по оплате: напиши @' + 'mariachiman88' + ' и укажи дату платежа. Если доступ не открылся, вернём звёзды.',
    terms: 'Полный доступ к тренажёру ЕНТ: разовый платёж в Telegram Stars, действует до 31 августа 2027. Это цифровой доступ, он открывается сразу после оплаты. Если доступ не открылся или ты передумал в течение 7 дней, напиши в /paysupport, и мы вернём звёзды.' },
  kk: { title: 'ҰБТ тренажеріне толық қолжетімділік', desc: 'Шексіз тесттер, сынақ ҰБТ-ның барлық нұсқалары, жарнамасыз. 2027 жылғы 31 тамызға дейін бір рет төлем.', label: 'Толық қолжетімділік',
    thanks: 'Төлем өтті ✅ Толық қолжетімділік 2027 жылғы 31 тамызға дейін ашылды. Тренажерге орал 👇', support: 'Төлем бойынша сұрақтар: @' + 'mariachiman88' + ' жаз, төлем күнін көрсет. Қолжетімділік ашылмаса, жұлдыздарды қайтарамыз.',
    terms: 'ҰБТ тренажеріне толық қолжетімділік: Telegram Stars арқылы бір реттік төлем, 2027 жылғы 31 тамызға дейін жарамды. Бұл цифрлық қолжетімділік, төлемнен кейін бірден ашылады. Ашылмаса немесе 7 күн ішінде ойыңнан айнысаң, /paysupport арқылы жаз, жұлдыздарды қайтарамыз.' },
};
const stars = (env) => Number(env.PREMIUM_STARS || PREMIUM_STARS);
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

const SCHEMA2 = [
  `CREATE TABLE IF NOT EXISTS premium (id INTEGER PRIMARY KEY, until INTEGER NOT NULL, stars INTEGER, charge_id TEXT, paid_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS league (id INTEGER NOT NULL, week TEXT NOT NULL, name TEXT, xp INTEGER NOT NULL, updated INTEGER, PRIMARY KEY (id, week))`,
  `CREATE TABLE IF NOT EXISTS activity (day TEXT NOT NULL, id INTEGER NOT NULL, bot INTEGER DEFAULT 0, app INTEGER DEFAULT 0, PRIMARY KEY (day, id))`,
  // индекс: таблица лиги и место ученика читают десятки строк, а не всю неделю
  `CREATE INDEX IF NOT EXISTS league_week_xp ON league (week, xp DESC)`,
  `CREATE INDEX IF NOT EXISTS users_first_seen ON users (first_seen)`,
];
const dayKz = (t = Date.now()) => new Date(t + TZ_OFFSET).toISOString().slice(0, 10);

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare(SCHEMA).run();
  for (const q of SCHEMA2) await env.DB.prepare(q).run();
  schemaReady = true;
}

async function premiumOf(env, id) {
  if (!env.DB) return 0;
  await ensureSchema(env);
  return (await env.DB.prepare('SELECT until FROM premium WHERE id = ?1').bind(id).first('until')) || 0;
}

async function invoiceLink(env, lang) {
  const P = PAY[lang] || PAY.ru;
  const r = await tg(env, 'createInvoiceLink', { title: P.title, description: P.desc, payload: 'premium', currency: 'XTR', prices: [{ label: P.label, amount: stars(env) }] });
  return r.ok ? r.result : null;
}

// Недельная лига: одна общая на всех, неделя с понедельника по Казахстану
function weekKeyKz() {
  const d = new Date(Date.now() + TZ_OFFSET);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const shortName = (u) => ((u.first_name || '') + (u.last_name ? ' ' + u.last_name[0] + '.' : '')).trim().slice(0, 24) || 'Ученик';

// Запоминаем пользователя: когда пришёл впервые и когда был последний раз. via: 'bot' или 'app'
async function seen(env, user, via) {
  if (!env.DB || !user || !user.id || user.is_bot) return;
  await ensureSchema(env);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, username, lang, first_seen, last_seen, last_app, via) VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6)
     ON CONFLICT(id) DO UPDATE SET username = ?2, lang = COALESCE(?3, lang), last_seen = ?4, last_app = COALESCE(?5, last_app)`
  ).bind(user.id, user.username || null, user.language_code || null, now, via === 'app' ? now : null, via).run();
  // активность по дням для пульта: уникальные за день, отдельно бот и приложение
  await env.DB.prepare(`INSERT INTO activity (day, id, bot, app) VALUES (?1, ?2, ?3, ?4)
    ON CONFLICT(day, id) DO UPDATE SET bot = MAX(bot, ?3), app = MAX(app, ?4)`).bind(dayKz(now), user.id, via === 'bot' ? 1 : 0, via === 'app' ? 1 : 0).run();
}

// Данные для пульта владельца
async function adminData(env) {
  await ensureSchema(env);
  const now = Date.now();
  const n = (sql, ...b) => env.DB.prepare(sql).bind(...b).first('n');
  const since = dayKz(now - 29 * DAY);
  const [total, prem, stars, d1, d7, d30, kk, appUsers, league] = await Promise.all([
    n('SELECT COUNT(*) n FROM users'),
    n('SELECT COUNT(*) n FROM premium WHERE until > ?1', now),
    n('SELECT COALESCE(SUM(stars), 0) n FROM premium WHERE until > 0'),
    n('SELECT COUNT(DISTINCT id) n FROM activity WHERE day = ?1', dayKz(now)),
    n('SELECT COUNT(DISTINCT id) n FROM activity WHERE day >= ?1', dayKz(now - 6 * DAY)),
    n('SELECT COUNT(DISTINCT id) n FROM activity WHERE day >= ?1', since),
    n("SELECT COUNT(*) n FROM users WHERE lang LIKE 'kk%'"),
    n('SELECT COUNT(*) n FROM users WHERE last_app IS NOT NULL'),
    n('SELECT COUNT(*) n FROM league WHERE week = ?1', weekKeyKz()),
  ]);
  const dau = (await env.DB.prepare('SELECT day, COUNT(*) a, SUM(app) p FROM activity WHERE day >= ?1 GROUP BY day ORDER BY day').bind(since).all()).results;
  const fresh = (await env.DB.prepare('SELECT CAST((first_seen + ?1) / ?2 AS INTEGER) d, COUNT(*) n FROM users WHERE first_seen >= ?3 GROUP BY d').bind(TZ_OFFSET, DAY, now - 30 * DAY).all()).results;
  const pays = (await env.DB.prepare('SELECT CAST((paid_at + ?1) / ?2 AS INTEGER) d, COUNT(*) n, SUM(stars) s FROM premium WHERE paid_at >= ?3 GROUP BY d').bind(TZ_OFFSET, DAY, now - 30 * DAY).all()).results;
  const byDay = {};
  for (let i = 29; i >= 0; i--) byDay[dayKz(now - i * DAY)] = { active: 0, app: 0, fresh: 0, paid: 0, stars: 0 };
  for (const r of dau) if (byDay[r.day]) { byDay[r.day].active = r.a; byDay[r.day].app = r.p || 0; }
  for (const r of fresh) { const k = new Date(r.d * DAY).toISOString().slice(0, 10); if (byDay[k]) byDay[k].fresh = r.n; }
  for (const r of pays) { const k = new Date(r.d * DAY).toISOString().slice(0, 10); if (byDay[k]) { byDay[k].paid = r.n; byDay[k].stars = r.s || 0; } }
  const top = (await env.DB.prepare('SELECT name, xp FROM league WHERE week = ?1 ORDER BY xp DESC LIMIT 5').bind(weekKeyKz()).all()).results;
  return { total, appUsers, kk, premium: prem, stars, dau: d1, wau: d7, mau: d30, league, top, days: Object.entries(byDay).map(([day, v]) => ({ day, ...v })) };
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
Оплатили полный доступ: ${await env.DB.prepare('SELECT COUNT(*) n FROM premium WHERE until > ?1').bind(now).first('n')}

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
  // Stars: подтверждаем оплату до списания
  if (u.pre_checkout_query) {
    const q = u.pre_checkout_query;
    const ok = q.currency === 'XTR' && q.invoice_payload === 'premium' && q.total_amount >= stars(env);
    await tg(env, 'answerPreCheckoutQuery', ok ? { pre_checkout_query_id: q.id, ok: true } : { pre_checkout_query_id: q.id, ok: false, error_message: 'Цена изменилась, открой оплату заново.' });
    return;
  }
  const m = u.message;
  if (m && m.successful_payment && m.from) {
    const sp = m.successful_payment;
    if (env.DB) {
      await ensureSchema(env);
      await env.DB.prepare(`INSERT INTO premium (id, until, stars, charge_id, paid_at) VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(id) DO UPDATE SET until = MAX(until, ?2), stars = ?3, charge_id = ?4, paid_at = ?5`)
        .bind(m.from.id, PREMIUM_UNTIL, sp.total_amount, sp.telegram_payment_charge_id, Date.now()).run();
    }
    const P = PAY[pick(m.from.language_code)];
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: P.thanks, reply_markup: { inline_keyboard: [[{ text: T[pick(m.from.language_code)].btn, web_app: { url: APP_URL } }]] } });
    return;
  }
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const L = T[pick(m.from && m.from.language_code)];
  const text = (m.text || '').trim();
  try { await seen(env, m.from, 'bot'); } catch (e) { /* статистика не должна ломать бота */ }
  if (/^\/admin/i.test(text) && isOwner(env, m.from)) {
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: 'Пульт управления 👇', reply_markup: { inline_keyboard: [[{ text: 'Открыть пульт', web_app: { url: APP_URL + '#admin' } }]] } });
    return;
  }
  if (/^\/stats(@\w+)?$/i.test(text) && isOwner(env, m.from)) {
    let out;
    try { out = await statsText(env); } catch (e) { out = 'Ошибка статистики: ' + e.message; }
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: out });
    return;
  }
  const lang = pick(m.from && m.from.language_code);
  if (/^\/paysupport/i.test(text)) { await tg(env, 'sendMessage', { chat_id: m.chat.id, text: PAY[lang].support }); return; }
  if (/^\/terms/i.test(text)) { await tg(env, 'sendMessage', { chat_id: m.chat.id, text: PAY[lang].terms }); return; }
  // /start premium или /premium: счёт прямо в чате
  if (/^\/(start\s+premium|premium)\b/i.test(text)) {
    const P = PAY[lang];
    await tg(env, 'sendInvoice', { chat_id: m.chat.id, title: P.title, description: P.desc, payload: 'premium', currency: 'XTR', prices: [{ label: P.label, amount: stars(env) }] });
    return;
  }
  // возврат звёзд, только владелец: /refund <user_id> <charge_id>
  const rf = text.match(/^\/refund\s+(\d+)\s+(\S+)/i);
  if (rf && isOwner(env, m.from)) {
    const r = await tg(env, 'refundStarPayment', { user_id: Number(rf[1]), telegram_payment_charge_id: rf[2] });
    if (r.ok && env.DB) await env.DB.prepare('UPDATE premium SET until = 0 WHERE id = ?1').bind(Number(rf[1])).run();
    await tg(env, 'sendMessage', { chat_id: m.chat.id, text: r.ok ? 'Возврат сделан, доступ закрыт.' : 'Ошибка возврата: ' + (r.description || '') });
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
  out.webhook = await tg(env, 'setWebhook', { url: origin + '/hook', secret_token: await hookSecret(env), allowed_updates: ['message', 'pre_checkout_query'], drop_pending_updates: true });
  for (const [lc, L] of [['', T.ru], ['ru', T.ru], ['kk', T.kk]]) {
    const extra = lc ? { language_code: lc } : {};
    out['desc_' + (lc || 'default')] = await tg(env, 'setMyDescription', { description: L.desc, ...extra });
    out['short_' + (lc || 'default')] = await tg(env, 'setMyShortDescription', { short_description: L.short, ...extra });
    out['cmds_' + (lc || 'default')] = await tg(env, 'setMyCommands', { commands: [{ command: 'start', description: L.cmdStart }, { command: 'help', description: L.cmdHelp }, { command: 'premium', description: L.cmdPremium }, { command: 'paysupport', description: L.cmdSupport }, { command: 'terms', description: L.cmdTerms }], ...extra });
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

    // API мини-приложения: тело запроса = подписанный initData (+ поля через &). Ответ JSON.
    if (['/me', '/invoice', '/league', '/admin'].includes(url.pathname)) {
      if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
      const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { ...CORS, 'content-type': 'application/json' } });
      if (req.method !== 'POST') return json({ ok: false }, 405);
      let body;
      try { body = await req.json(); } catch (e) { return json({ ok: false }, 400); }
      const user = await checkInitData(env, body.initData || '');
      if (!user) return json({ ok: false, error: 'auth' }, 401);
      try {
        if (url.pathname === '/me') return json({ ok: true, premium: await premiumOf(env, user.id), stars: stars(env), owner: isOwner(env, user) });
        if (url.pathname === '/admin') {
          if (!isOwner(env, user)) return json({ ok: false, error: 'forbidden' }, 403);
          if (!env.DB) return json({ ok: false, error: 'nodb' }, 503);
          return json({ ok: true, ...(await adminData(env)) });
        }
        if (url.pathname === '/invoice') {
          const link = await invoiceLink(env, pick(user.language_code));
          return json(link ? { ok: true, link } : { ok: false }, link ? 200 : 502);
        }
        // лига: клиент присылает свой опыт за неделю, получаем таблицу
        if (!env.DB) return json({ ok: false, error: 'nodb' }, 503);
        await ensureSchema(env);
        const week = weekKeyKz();
        const xp = Math.max(0, Math.min(20000, Math.floor(Number(body.xp) || 0)));
        if (xp > 0) {
          await env.DB.prepare(`INSERT INTO league (id, week, name, xp, updated) VALUES (?1, ?2, ?3, ?4, ?5)
            ON CONFLICT(id, week) DO UPDATE SET name = ?3, xp = MAX(xp, ?4), updated = ?5`).bind(user.id, week, shortName(user), xp, Date.now()).run();
        }
        const { results } = await env.DB.prepare('SELECT id, name, xp FROM league WHERE week = ?1 ORDER BY xp DESC, updated ASC LIMIT 30').bind(week).all();
        const mine = await env.DB.prepare('SELECT xp FROM league WHERE id = ?1 AND week = ?2').bind(user.id, week).first('xp');
        const rank = mine ? (await env.DB.prepare('SELECT COUNT(*) n FROM league WHERE week = ?1 AND xp > ?2').bind(week, mine).first('n')) + 1 : null;
        const total = await env.DB.prepare('SELECT COUNT(*) n FROM league WHERE week = ?1').bind(week).first('n');
        return json({ ok: true, week, rank, total, top: results.map((r) => ({ me: r.id === user.id, name: r.name, xp: r.xp })) });
      } catch (e) { return json({ ok: false, error: 'server' }, 500); }
    }

    if (url.pathname === '/status') {
      const i = await tg(env, 'getWebhookInfo', {});
      const r = i.result || {};
      return new Response(JSON.stringify({ ok: i.ok, url: r.url, pending: r.pending_update_count, last_error: r.last_error_message, last_error_at: r.last_error_date && new Date(r.last_error_date * 1000).toISOString(), ip: r.ip_address }, null, 2),
        { headers: { 'content-type': 'application/json; charset=utf-8' } });
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
