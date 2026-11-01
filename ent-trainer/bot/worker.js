// Бот @enttrainer_bot: отвечает на /start приветствием и кнопкой, которая открывает тренажёр.
// Работает на Cloudflare Workers (бесплатно). Нужна одна секретная переменная: BOT_TOKEN.
// После публикации один раз откройте в браузере https://<адрес-воркера>/setup
// Он сам подключит вебхук, описание бота, команды и кнопку меню.

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

    if (url.pathname === '/setup') {
      const r = await setup(env, url.origin);
      const ok = Object.values(r).every((x) => x && x.ok);
      return new Response((ok ? 'Готово ✅ Бот настроен. Откройте его в Telegram и нажмите Старт.\n\n' : 'Что-то не так, детали ниже:\n\n') + JSON.stringify(r, null, 2),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }

    return new Response('ent-bot работает');
  },
};
