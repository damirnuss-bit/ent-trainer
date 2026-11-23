// Настройки проекта. Меняется только этот файл.
export const CONFIG = {
  appName: 'ЕНТ Тренажёр',
  version: '0.4.0-beta',

  // Имя бота без @ (для кнопки «Поделиться»). Заполнить после создания в @BotFather
  botUsername: 'enttrainer_bot',
  // Твой Telegram username без @: куда приходят отчёты «Нашёл ошибку» и заявки от рекламодателей
  ownerUsername: 'mariachiman88',

  // Карта для добровольной поддержки проекта (показывается в окне «Поддержать»). Пусто = кнопка скрыта
  donateCard: '4400 4302 7345 1358',

  // Дата основного ЕНТ для счётчика «осталось N дней». Уточнить по графику НЦТ.
  examDate: '2027-06-01',
  // Если у ЕНТ несколько потоков, перечисли остальные даты здесь: на главной покажется ближайшая будущая
  examDates: [],

  // Цель на день (количество вопросов)
  dailyGoal: 20,

  // Сервер бота (Cloudflare Worker): оплата Stars, проверка доступа, лига
  apiUrl: 'https://ent-bot.damirnuss.workers.dev',
  // Полный доступ за Telegram Stars. enabled: false выключает все ограничения
  premium: { enabled: true, stars: 250, freeDaily: 30, freeVariants: 1 },
  // Реклама для бесплатных пользователей (AdsGram, сеть для мини-приложений Telegram, выплаты в TON).
  // Номера блоков берутся в кабинете partner.adsgram.ai. Пусто = реклама выключена.
  // rewardBlockId: числовой, например '12345' (реклама за награду: +rewardQuestions вопросов, до rewardPerDay раз в день)
  // interstitialBlockId: вида 'int-12345' (после теста, не чаще раза в interstitialGapSec секунд и раз в interstitialEvery тестов)
  ads: { rewardBlockId: '', interstitialBlockId: '', rewardQuestions: 10, rewardPerDay: 3, interstitialEvery: 2, interstitialGapSec: 180 },

  // Цели дня в опыте (XP), как в Duolingo. За верный ответ 10 XP
  xpGoals: [50, 100, 200, 300],
  xpGoalDefault: 100,

  // Сбор статистики для продаж рекламы (адрес Google Apps Script, см. docs/apps-script.gs). Пусто = выключено
  trackUrl: '',
  // Адрес воркера бота: при открытии приложения отмечаем, что человек заходил (для /stats в боте). Пусто = выключено
  seenUrl: 'https://ent-bot.damirnuss.workers.dev/seen',

  // KaTeX с CDN. Если не загрузится, формулы покажутся простым текстом
  katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  katexJs: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',

  // Какие статусы вопросов показывать: draft, checked, live (на бете показываем все)
  allowedStatus: ['draft', 'checked', 'live'],

  // Доля вопросов из генераторов (остальное из банка). Если одной стороны нет, берётся другая
  genShare: { math: 0.75, mathlit: 1, physics: 0.6, chemistry: 0.5, biology: 0.15, history: 0, reading: 0 },
};
