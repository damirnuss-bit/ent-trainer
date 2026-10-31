// Генераторы: математическая грамотность (10 шаблонов).
import { num, money, need } from './util.js';

const S = 'mathlit';

export const templates = [
  {
    id: 'ml-discount', subject: S, topic: 'percent', difficulty: 1,
    build(r) {
      const P = r.int(4, 40) * 500, d = r.pick([10, 15, 20, 25, 30, 40, 50]);
      const disc = P * d / 100; need(Number.isInteger(disc));
      const ans = P - disc;
      return {
        ru: { t: `Цена товара ${money(P)} тенге. На него действует скидка ${d}%. Сколько тенге нужно заплатить? (Ответ в тенге.)`,
              e: `Скидка: ${money(P)} · ${d} / 100 = ${money(disc)}. К оплате: ${money(P)} - ${money(disc)} = ${money(ans)} тенге.` },
        kk: { t: `Тауардың бағасы ${money(P)} теңге. Оған ${d}% жеңілдік жасалды. Қанша теңге төлеу керек? (Жауап теңгемен.)`,
              e: `Жеңілдік: ${money(P)} · ${d} / 100 = ${money(disc)}. Төлемге: ${money(P)} - ${money(disc)} = ${money(ans)} теңге.` },
        c: money(ans),
        w: [money(disc), money(P + disc), money(P - d), money(P * (100 - d) / 1000)],
      };
    },
  },
  {
    id: 'ml-updown', subject: S, topic: 'percent', difficulty: 2,
    build(r) {
      const p = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90]);
      const up = r.chance(0.5);
      const ch = -(p * p) / 100;
      const mid = up ? 100 + p : 100 - p;
      const ruWord = up ? ['выросла', 'снизилась'] : ['снизилась', 'выросла'];
      const kkWord = up ? ['өсті', 'төмендеді'] : ['төмендеді', 'өсті'];
      return {
        ru: { t: `Цена товара сначала ${ruWord[0]} на ${p}%, а затем ${ruWord[1]} на ${p}%. Как изменилась цена по сравнению с первоначальной?`,
              e: `Пусть цена 100. После первого изменения: ${mid}. После второго: ${up ? `${mid} · (1 - ${p}/100)` : `${mid} · (1 + ${p}/100)`} = ${100 + ch}. Изменение: ${num(ch)}%.` },
        kk: { t: `Тауардың бағасы алдымен ${p}%-ға ${kkWord[0]}, содан кейін ${p}%-ға ${kkWord[1]}. Баға бастапқы бағамен салыстырғанда қалай өзгерді?`,
              e: `Баға 100 делік. Бірінші өзгерістен кейін: ${mid}. Екіншіден кейін: ${up ? `${mid} · (1 - ${p}/100)` : `${mid} · (1 + ${p}/100)`} = ${100 + ch}. Өзгеріс: ${num(ch)}%.` },
        c: num(ch) + '%',
        w: ['0%', '+' + num(-ch) + '%', '-' + p + '%', '+' + p + '%', num(ch * 2) + '%'],
      };
    },
  },
  {
    id: 'ml-speed', subject: S, topic: 'speed', difficulty: 1,
    build(r) {
      const v = r.pick([40, 50, 60, 75, 80, 90, 100, 120]);
      const t = r.pick([1.5, 2, 2.5, 3, 4, 5]);
      const D = v * t; need(Number.isInteger(D));
      return {
        ru: { t: `Автобус едет со скоростью ${v} км/ч. За сколько часов он проедет ${D} км?`,
              e: `Время = путь / скорость = ${D} / ${v} = ${num(t)} ч.` },
        kk: { t: `Автобус ${v} км/сағ жылдамдықпен жүріп барады. Ол ${D} км жолды неше сағатта жүріп өтеді?`,
              e: `Уақыт = жол / жылдамдық = ${D} / ${v} = ${num(t)} сағ.` },
        c: num(t),
        w: [num(t + 0.5), num(Math.max(0.5, t - 0.5)), num(t * 2), num(D / 100), num(t + 1)],
      };
    },
  },
  {
    id: 'ml-ms-kmh', subject: S, topic: 'units', difficulty: 1,
    build(r) {
      if (r.chance(0.6)) {
        const v = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
        const a = v * 3.6;
        return {
          ru: { t: `Скорость велосипедиста ${v} м/с. Выразите её в км/ч.`,
                e: `1 м/с = 3,6 км/ч. ${v} · 3,6 = ${num(a)} км/ч.` },
          kk: { t: `Велосипедшінің жылдамдығы ${v} м/с. Оны км/сағ-пен өрнектеңіз.`,
                e: `1 м/с = 3,6 км/сағ. ${v} · 3,6 = ${num(a)} км/сағ.` },
          c: num(a),
          w: [num(v / 3.6), num(v * 6), num(v * 36), num(v * 0.36)],
        };
      }
      const kmh = r.pick([18, 36, 54, 72, 90, 108, 126, 144]);
      const ms = kmh / 3.6;
      return {
        ru: { t: `Скорость поезда ${kmh} км/ч. Выразите её в м/с.`,
              e: `1 км/ч = 1000 м / 3600 с, то есть делим на 3,6. ${kmh} / 3,6 = ${num(ms)} м/с.` },
        kk: { t: `Пойыздың жылдамдығы ${kmh} км/сағ. Оны м/с-пен өрнектеңіз.`,
              e: `1 км/сағ = 1000 м / 3600 с, яғни 3,6-ға бөлеміз. ${kmh} / 3,6 = ${num(ms)} м/с.` },
        c: num(ms),
        w: [num(kmh * 3.6), num(kmh / 36), num(kmh / 6), num(ms * 2), num(ms + 1)],
      };
    },
  },
  {
    id: 'ml-tariff', subject: S, topic: 'tariff', difficulty: 2,
    build(r) {
      const a = r.pick([20, 25, 30, 35, 40]), b = a + r.pick([5, 10, 15]);
      const N = r.pick([150, 180, 200, 250, 300]);
      const ans = 100 * a + (N - 100) * b;
      return {
        ru: { t: `Тариф на электроэнергию: первые 100 кВт·ч стоят ${a} тенге за 1 кВт·ч, всё сверх этого стоит ${b} тенге за 1 кВт·ч. Сколько тенге нужно заплатить за ${N} кВт·ч?`,
              e: `Первые 100 кВт·ч: 100 · ${a} = ${money(100 * a)}. Остальные ${N - 100} кВт·ч: ${N - 100} · ${b} = ${money((N - 100) * b)}. Всего: ${money(ans)} тенге.` },
        kk: { t: `Электр қуаты тарифі: алғашқы 100 кВт·сағ үшін 1 кВт·сағ ${a} теңге, одан артығы үшін 1 кВт·сағ ${b} теңге. ${N} кВт·сағ үшін қанша теңге төлеу керек?`,
              e: `Алғашқы 100 кВт·сағ: 100 · ${a} = ${money(100 * a)}. Қалған ${N - 100} кВт·сағ: ${N - 100} · ${b} = ${money((N - 100) * b)}. Барлығы: ${money(ans)} теңге.` },
        c: money(ans),
        w: [money(N * a), money(N * b), money(N * (a + b) / 2), money(100 * a + N * b)],
      };
    },
  },
  {
    id: 'ml-mean', subject: S, topic: 'stats', difficulty: 1,
    build(r) {
      const mu = r.int(8, 40);
      const xs = [r.int(mu - 6, mu + 6), r.int(mu - 6, mu + 6), r.int(mu - 6, mu + 6), r.int(mu - 6, mu + 6)];
      const last = 5 * mu - xs.reduce((s, x) => s + x, 0);
      need(last > 0 && Math.abs(last - mu) <= 12);
      const arr = r.shuffle([...xs, last]);
      const sorted = arr.slice().sort((p, q) => p - q);
      const median = sorted[2];
      need(median !== mu);
      return {
        ru: { t: `Результаты пяти контрольных работ: ${arr.join(', ')}. Найдите среднее арифметическое.`,
              e: `Сумма: ${arr.join(' + ')} = ${5 * mu}. Среднее: ${5 * mu} / 5 = ${mu}.` },
        kk: { t: `Бес бақылау жұмысының нәтижелері: ${arr.join(', ')}. Арифметикалық ортасын табыңыз.`,
              e: `Қосынды: ${arr.join(' + ')} = ${5 * mu}. Орташа мәні: ${5 * mu} / 5 = ${mu}.` },
        c: String(mu),
        w: [String(median), String(mu + 1), String(mu - 1), String(sorted[0] + sorted[4]), String(5 * mu)],
      };
    },
  },
  {
    id: 'ml-scale', subject: S, topic: 'scale', difficulty: 1,
    build(r) {
      const k = r.pick([1, 2, 5, 10]);          // 1 см = k км
      const S1 = k * 100000;
      const d = r.int(3, 12);
      const ans = d * k;
      return {
        ru: { t: `Масштаб карты 1 : ${money(S1)}. Расстояние между двумя городами на карте ${d} см. Каково реальное расстояние в километрах?`,
              e: `В 1 см карты ${money(S1)} см = ${k} км. ${d} · ${k} = ${ans} км.` },
        kk: { t: `Картаның масштабы 1 : ${money(S1)}. Картада екі қала арасындағы қашықтық ${d} см. Нақты қашықтық неше километр?`,
              e: `Картадағы 1 см жерде ${money(S1)} см = ${k} км. ${d} · ${k} = ${ans} км.` },
        c: String(ans),
        w: [String(ans * 10), num(ans / 10), String(d * S1 / 1000), String(ans + d), String(ans * 2)],
      };
    },
  },
  {
    id: 'ml-tiles', subject: S, topic: 'area', difficulty: 2,
    build(r) {
      const t = r.pick([20, 25, 50]);                // сторона плитки, см
      const a = r.pick([2, 3, 4, 5, 6]), b = r.pick([3, 4, 5, 6, 8]);
      need(a !== b);
      const cnt = (a * 100 / t) * (b * 100 / t);
      need(Number.isInteger(cnt));
      return {
        ru: { t: `Пол комнаты имеет размеры ${a} м × ${b} м. Его нужно выложить квадратной плиткой со стороной ${t} см. Сколько плиток понадобится?`,
              e: `Размеры в см: ${a * 100} × ${b * 100}. Вдоль одной стороны ${a * 100 / t} плиток, вдоль другой ${b * 100 / t}. Всего: ${a * 100 / t} · ${b * 100 / t} = ${cnt}.` },
        kk: { t: `Бөлменің еден өлшемі ${a} м × ${b} м. Оған қабырғасы ${t} см шаршы тақтайша төселеді. Қанша тақтайша керек?`,
              e: `Өлшемі см-мен: ${a * 100} × ${b * 100}. Бір қабырға бойына ${a * 100 / t} тақтайша, екіншісіне ${b * 100 / t}. Барлығы: ${a * 100 / t} · ${b * 100 / t} = ${cnt}.` },
        c: String(cnt),
        w: [String(2 * (a * 100 / t + b * 100 / t)), String(a * b * 100 / t), String(cnt * 2), String(cnt + a * 100 / t), String(cnt - b * 100 / t)],
      };
    },
  },
  {
    id: 'ml-deposit', subject: S, topic: 'money', difficulty: 2,
    build(r) {
      const P = r.int(1, 10) * 100000, p = r.pick([5, 8, 10, 12]), n = r.pick([2, 3, 4]);
      const inter = P * p * n / 100; need(Number.isInteger(inter));
      const total = P + inter;
      return {
        ru: { t: `Вкладчик положил в банк ${money(P)} тенге под ${p}% годовых (простые проценты) на ${n} ${n < 5 ? 'года' : 'лет'}. Сколько тенге будет на счёте в конце срока?`,
              e: `Проценты за год: ${money(P)} · ${p} / 100 = ${money(P * p / 100)}. За ${n} ${n < 5 ? 'года' : 'лет'}: ${money(inter)}. На счёте: ${money(P)} + ${money(inter)} = ${money(total)} тенге.` },
        kk: { t: `Салымшы банкке ${money(P)} теңгені жылдық ${p}% қарапайым пайызбен ${n} жылға салды. Мерзім соңында шотында қанша теңге болады?`,
              e: `Бір жылғы пайыз: ${money(P)} · ${p} / 100 = ${money(P * p / 100)}. ${n} жылда: ${money(inter)}. Шотта: ${money(P)} + ${money(inter)} = ${money(total)} теңге.` },
        c: money(total),
        w: [money(inter), money(P + P * p / 100), money(P + p * n), money(P * (1 + p * n / 10))],
      };
    },
  },
  {
    id: 'ml-work', subject: S, topic: 'work', difficulty: 2,
    build(r) {
      const w1 = r.pick([3, 4, 6, 8, 9]), d1 = r.pick([6, 8, 10, 12, 15, 18]);
      const w2 = r.pick([2, 3, 4, 5, 6, 9, 12]);
      need(w1 !== w2);
      const total = w1 * d1;
      need(total % w2 === 0);
      const ans = total / w2;
      return {
        ru: { t: `${w1} рабочих выполняют работу за ${d1} дней. За сколько дней эту же работу выполнят ${w2} рабочих при той же производительности?`,
              e: `Вся работа: ${w1} · ${d1} = ${total} рабочих-дней. ${total} / ${w2} = ${ans} дней.` },
        kk: { t: `${w1} жұмысшы жұмысты ${d1} күнде орындайды. Өнімділігі бірдей ${w2} жұмысшы сол жұмысты неше күнде орындайды?`,
              e: `Барлық жұмыс: ${w1} · ${d1} = ${total} жұмысшы-күн. ${total} / ${w2} = ${ans} күн.` },
        c: String(ans),
        w: [num(d1 * w2 / w1), String(d1 + w2), String(d1 * w2), String(ans + 2), String(Math.max(1, ans - 2))],
      };
    },
  },
];
