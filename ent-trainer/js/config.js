// Настройки проекта. Меняется только этот файл.
export const CONFIG = {
  appName: 'ЕНТ Тренажёр',
  version: '0.2.0-beta',

  // Имя бота без @ (для кнопки «Поделиться»). Заполнить после создания в @BotFather
  botUsername: 'YOUR_BOT_USERNAME',
  // Твой Telegram username без @: куда приходят отчёты «Нашёл ошибку» и заявки от рекламодателей
  ownerUsername: 'YOUR_TELEGRAM_USERNAME',

  // Карта для добровольной поддержки проекта (показывается в окне «Поддержать»). Пусто = кнопка скрыта
  donateCard: '4400 4302 7345 1358',

  // Дата основного ЕНТ для счётчика «осталось N дней». Уточнить по графику НЦТ.
  examDate: '2027-06-01',
  // Если у ЕНТ несколько потоков, перечисли остальные даты здесь: на главной покажется ближайшая будущая
  examDates: [],

  // Цель на день (количество вопросов)
  dailyGoal: 20,

  // Сбор статистики для продаж рекламы (адрес Google Apps Script, см. docs/apps-script.gs). Пусто = выключено
  trackUrl: '',

  // KaTeX с CDN. Если не загрузится, формулы покажутся простым текстом
  katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  katexJs: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',

  // Какие статусы вопросов показывать: draft, checked, live (на бете показываем все)
  allowedStatus: ['draft', 'checked', 'live'],

  // Доля вопросов из генераторов (остальное из банка). Если одной стороны нет, берётся другая
  genShare: { math: 0.75, mathlit: 1, physics: 0.6, chemistry: 0.5, biology: 0.15, history: 0, reading: 0 },
};
