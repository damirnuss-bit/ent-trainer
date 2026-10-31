// Генераторы: математика, дополнительные шаблоны (20 штук).
import { num, need, gcd, frac, sg, T } from './util.js';

const S = 'math';
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const ANG = [30, 45, 60, 90, 120, 150];
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]];

export const templates = [
  {
    id: 'm-sys', subject: S, topic: 'eq', difficulty: 1,
    build(r) {
      const x = r.int(-8, 12), y = r.int(-8, 12);
      need(x !== y && x !== 0 && y !== 0);
      const s = x + y, d = x - y;
      const sys = `\\begin{cases} x + y = ${s} \\\\ x - y = ${d} \\end{cases}`;
      return {
        ru: { t: `Решите систему уравнений и найдите ${T('x')}: ${T(sys)}`, e: `Сложим уравнения: 2x = ${s} + (${d}) = ${s + d}, значит x = ${x}. Тогда y = ${y}.` },
        kk: { t: `Теңдеулер жүйесін шешіп, ${T('x')} табыңыз: ${T(sys)}`, e: `Теңдеулерді қосамыз: 2x = ${s} + (${d}) = ${s + d}, олай болса x = ${x}. Сонда y = ${y}.` },
        c: x, w: [y, x + y, x - y, -x, x + 1],
      };
    },
  },
  {
    id: 'm-abs', subject: S, topic: 'eq', difficulty: 2,
    build(r) {
      const a = r.int(-6, 9), b = r.int(1, 9);
      need(a !== 0);
      const eq = `|x ${sg(-a)}| = ${b}`;
      return {
        ru: { t: `Найдите сумму корней уравнения ${T(eq)}`, e: `Два корня: x = ${a} + ${b} = ${a + b} и x = ${a} - ${b} = ${a - b}. Сумма: ${2 * a}.` },
        kk: { t: `${T(eq)} теңдеуі түбірлерінің қосындысын табыңыз.`, e: `Екі түбір: x = ${a} + ${b} = ${a + b} және x = ${a} - ${b} = ${a - b}. Қосындысы: ${2 * a}.` },
        c: 2 * a, w: [a, 2 * b, a + b, a * b, -2 * a, 0],
      };
    },
  },
  {
    id: 'm-sqrteq', subject: S, topic: 'eq', difficulty: 2,
    build(r) {
      const a = r.int(-7, 12), b = r.int(2, 9);
      need(a !== 0);
      const x = b * b - a;
      const eq = `\\sqrt{x ${sg(a)}} = ${b}`;
      return {
        ru: { t: `Решите уравнение: ${T(eq)}`, e: `Возведём обе части в квадрат: x ${a < 0 ? '-' : '+'} ${Math.abs(a)} = ${b * b}, откуда x = ${x}.` },
        kk: { t: `Теңдеуді шешіңіз: ${T(eq)}`, e: `Екі жағын квадраттаймыз: x ${a < 0 ? '-' : '+'} ${Math.abs(a)} = ${b * b}, олай болса x = ${x}.` },
        c: x, w: [b - a, b * b + a, -x, b + a, x + 2],
      };
    },
  },
  {
    id: 'm-expo', subject: S, topic: 'eq', difficulty: 2,
    build(r) {
      const base = r.pick([2, 3, 5]), k = r.int(2, 5), b = r.int(-4, 6);
      need(b !== 0);
      const x = k + b;
      const eq = `${base}^{x ${sg(-b)}} = ${Math.pow(base, k)}`;
      return {
        ru: { t: `Решите уравнение: ${T(eq)}`, e: `${Math.pow(base, k)} = ${base}^${k}. Приравниваем показатели: x ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${k}, откуда x = ${x}.` },
        kk: { t: `Теңдеуді шешіңіз: ${T(eq)}`, e: `${Math.pow(base, k)} = ${base}^${k}. Көрсеткіштерді теңейміз: x ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${k}, олай болса x = ${x}.` },
        c: x, w: [k, k - b, -x, Math.pow(base, k), x + 1],
      };
    },
  },
  {
    id: 'm-apsum', subject: S, topic: 'prog', difficulty: 2,
    build(r) {
      const a1 = r.int(-4, 10), d = r.pick([2, 3, 4, 5, -2, -3]), n = r.int(6, 16);
      const an = a1 + (n - 1) * d, s = n * (a1 + an) / 2;
      need(Number.isInteger(s));
      return {
        ru: { t: `Найдите сумму первых ${n} членов арифметической прогрессии, если ${T(`a_1 = ${a1}`)}, ${T(`d = ${d}`)}.`, e: `a_${n} = ${a1} + ${n - 1} · (${d}) = ${an}. S = ${n} · (${a1} + (${an})) / 2 = ${s}.` },
        kk: { t: `Арифметикалық прогрессияның алғашқы ${n} мүшесінің қосындысын табыңыз, егер ${T(`a_1 = ${a1}`)}, ${T(`d = ${d}`)}.`, e: `a_${n} = ${a1} + ${n - 1} · (${d}) = ${an}. S = ${n} · (${a1} + (${an})) / 2 = ${s}.` },
        c: s, w: [n * a1, s + n, n * an, s - d * n, (a1 + an) * n],
      };
    },
  },
  {
    id: 'm-gpsum', subject: S, topic: 'prog', difficulty: 2,
    build(r) {
      const b1 = r.int(1, 6), q = r.pick([2, 3]), n = r.int(3, 6);
      const s = b1 * (Math.pow(q, n) - 1) / (q - 1);
      return {
        ru: { t: `Найдите сумму первых ${n} членов геометрической прогрессии, если ${T(`b_1 = ${b1}`)}, ${T(`q = ${q}`)}.`, e: `S = b_1 (q^n - 1) / (q - 1) = ${b1} · (${Math.pow(q, n)} - 1) / ${q - 1} = ${s}.` },
        kk: { t: `Геометриялық прогрессияның алғашқы ${n} мүшесінің қосындысын табыңыз, егер ${T(`b_1 = ${b1}`)}, ${T(`q = ${q}`)}.`, e: `S = b_1 (q^n - 1) / (q - 1) = ${b1} · (${Math.pow(q, n)} - 1) / ${q - 1} = ${s}.` },
        c: s, w: [b1 * Math.pow(q, n), s + b1, b1 * n * q, s - 1, b1 * (Math.pow(q, n) + 1) / (q - 1)],
      };
    },
  },
  {
    id: 'm-apd', subject: S, topic: 'prog', difficulty: 2,
    build(r) {
      const a1 = r.int(-5, 8), d = r.pick([-4, -3, -2, 2, 3, 4, 5]), m = r.int(2, 5), n = r.int(7, 12);
      const am = a1 + (m - 1) * d, an = a1 + (n - 1) * d;
      return {
        ru: { t: `В арифметической прогрессии ${T(`a_{${m}} = ${am}`)}, ${T(`a_{${n}} = ${an}`)}. Найдите разность ${T('d')}.`, e: `a_${n} - a_${m} = (${n} - ${m}) d, то есть ${an} - (${am}) = ${n - m} d. Значит d = ${d}.` },
        kk: { t: `Арифметикалық прогрессияда ${T(`a_{${m}} = ${am}`)}, ${T(`a_{${n}} = ${an}`)}. ${T('d')} айырымын табыңыз.`, e: `a_${n} - a_${m} = (${n} - ${m}) d, яғни ${an} - (${am}) = ${n - m} d. Олай болса d = ${d}.` },
        c: d, w: [-d, d + 1, an - am, d - 1, (an - am) / (n + m)],
      };
    },
  },
  {
    id: 'm-derpt', subject: S, topic: 'func', difficulty: 2,
    build(r) {
      const a = r.int(1, 4), b = r.int(-5, 6), c = r.int(-6, 8), x0 = r.int(-3, 4);
      need(b !== 0 && c !== 0 && x0 !== 0);
      const f = `x^3 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x^2 ${sg(c)}x`.replace(/^x\^3/, `${a === 1 ? '' : a}x^3`);
      const d = 3 * a * x0 * x0 + 2 * b * x0 + c;
      return {
        ru: { t: `Найдите значение производной функции ${T(`f(x) = ${f}`)} в точке ${T(`x_0 = ${x0}`)}.`, e: `f'(x) = ${3 * a}x^2 ${sg(2 * b)}x ${sg(c)}. f'(${x0}) = ${3 * a} · ${x0 * x0} + (${2 * b}) · (${x0}) + (${c}) = ${d}.` },
        kk: { t: `${T(`f(x) = ${f}`)} функциясының ${T(`x_0 = ${x0}`)} нүктесіндегі туындысының мәнін табыңыз.`, e: `f'(x) = ${3 * a}x^2 ${sg(2 * b)}x ${sg(c)}. f'(${x0}) = ${3 * a} · ${x0 * x0} + (${2 * b}) · (${x0}) + (${c}) = ${d}.` },
        c: d, w: [d + c, 3 * a * x0 * x0, 3 * a * x0 * x0 + 2 * b + c, d - 2 * b * x0, a * x0 ** 3 + b * x0 * x0 + c * x0],
      };
    },
  },
  {
    id: 'm-vertex', subject: S, topic: 'func', difficulty: 2,
    build(r) {
      const p = r.pick([-10, -8, -6, -4, -2, 2, 4, 6, 8, 10]), q = r.int(-5, 14);
      need(q !== 0);
      const mn = q - p * p / 4;
      const f = `x^2 ${sg(p)}x ${sg(q)}`;
      return {
        ru: { t: `Найдите наименьшее значение функции ${T(`y = ${f}`)}.`, e: `Вершина параболы x = ${-p / 2}. Подставляем: y = ${q} - ${p * p / 4} = ${mn}.` },
        kk: { t: `${T(`y = ${f}`)} функциясының ең кіші мәнін табыңыз.`, e: `Параболаның төбесі x = ${-p / 2}. Қойсақ: y = ${q} - ${p * p / 4} = ${mn}.` },
        c: mn, w: [q, -mn, q + p * p / 4, mn + 2, p * p / 4],
      };
    },
  },
  {
    id: 'm-domain', subject: S, topic: 'func', difficulty: 1,
    build(r) {
      const a = r.int(-9, 12);
      need(a !== 0);
      const ex = `y = \\sqrt{x ${sg(-a)}}`;
      const c = `x ≥ ${a}`;
      return {
        ru: { t: `Найдите область определения функции ${T(ex)}`, e: `Выражение под корнем должно быть неотрицательным: x ${a < 0 ? '+' : '-'} ${Math.abs(a)} ≥ 0, значит ${c}.` },
        kk: { t: `${T(ex)} функциясының анықталу облысын табыңыз.`, e: `Түбір астындағы өрнек теріс болмауы керек: x ${a < 0 ? '+' : '-'} ${Math.abs(a)} ≥ 0, олай болса ${c}.` },
        c, w: [`x > ${a}`, `x ≤ ${a}`, `x ≥ ${-a}`, `x < ${a}`],
      };
    },
  },
  {
    id: 'm-logeq', subject: S, topic: 'logs', difficulty: 2,
    build(r) {
      const a = r.pick([2, 3, 5]), k = r.int(2, 4), b = r.int(-5, 9);
      need(b !== 0);
      const x = Math.pow(a, k) - b;
      const eq = `\\log_{${a}}(x ${sg(b)}) = ${k}`;
      return {
        ru: { t: `Решите уравнение: ${T(eq)}`, e: `x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a}^${k} = ${Math.pow(a, k)}, откуда x = ${x}.` },
        kk: { t: `Теңдеуді шешіңіз: ${T(eq)}`, e: `x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a}^${k} = ${Math.pow(a, k)}, олай болса x = ${x}.` },
        c: x, w: [a * k - b, Math.pow(a, k), Math.pow(a, k) + b, x + a, k - b],
      };
    },
  },
  {
    id: 'm-logneg', subject: S, topic: 'logs', difficulty: 2,
    build(r) {
      const a = r.pick([2, 3, 4, 5, 6, 7, 10]), k = r.int(1, 3);
      const eq = `\\log_{${a}} x = -${k}`;
      const c = `1/${Math.pow(a, k)}`;
      return {
        ru: { t: r.chance(0.5) ? `Найдите ${T('x')}, если ${T(eq)}` : `Решите уравнение ${T(eq)}`, e: `x = ${a}^(-${k}) = 1 / ${a}^${k} = ${c}.` },
        kk: { t: `${T(eq)} болса, ${T('x')} табыңыз.`, e: `x = ${a}^(-${k}) = 1 / ${a}^${k} = ${c}.` },
        c, w: [`-${Math.pow(a, k)}`, `${Math.pow(a, k)}`, `-${a * k}`, `1/${a * k}`],
      };
    },
  },
  {
    id: 'm-trigeq', subject: S, topic: 'trig', difficulty: 1,
    build(r) {
      const row = r.pick([['\\sin x = \\frac{1}{2}', 30], ['\\cos x = \\frac{1}{2}', 60], ['\\tan x = 1', 45], ['\\sin x = 1', 90], ['\\cos x = 0', 90], ['\\sin x = \\frac{\\sqrt{2}}{2}', 45], ['\\cos x = \\frac{\\sqrt{3}}{2}', 30], ['\\sin x = \\frac{\\sqrt{3}}{2}', 60], ['\\tan x = \\sqrt{3}', 60], ['\\cos x = \\frac{\\sqrt{2}}{2}', 45]]);
      const phr = r.int(0, 1);
      const ans = row[1];
      return {
        ru: { t: phr ? `Решите уравнение ${T(row[0])}. В ответе укажите наименьший положительный корень в градусах.` : `Найдите наименьший положительный корень уравнения ${T(row[0])} (в градусах).`, e: `По таблице значений тригонометрических функций наименьший положительный угол равен ${ans}°.` },
        kk: { t: phr ? `${T(row[0])} теңдеуін шешіңіз. Жауапта ең кіші оң түбірді градуспен көрсетіңіз.` : `${T(row[0])} теңдеуінің ең кіші оң түбірін табыңыз (градуспен).`, e: `Тригонометриялық функциялар кестесі бойынша ең кіші оң бұрыш ${ans}°.` },
        c: ans + '°', w: ANG.filter((x) => x !== ans).map((x) => x + '°'),
      };
    },
  },
  {
    id: 'm-sincos', subject: S, topic: 'trig', difficulty: 2,
    build(r) {
      const [p, q, c] = r.pick(TRIPLES);
      const swap = r.chance(0.5), askTan = r.chance(0.5);
      const given = swap ? q : p, other = swap ? p : q;
      const fn = r.chance(0.5) ? 'cos' : 'sin', ask = fn === 'cos' ? 'sin' : 'cos';
      const ans = askTan ? frac(other, given) : frac(other, c);
      const askName = askTan ? 'tan' : ask;
      const gStr = frac(given, c);
      return {
        ru: { t: `Найдите ${T(`\\${askName} \\alpha`)}, если ${T(`\\${fn} \\alpha = \\frac{${given}}{${c}}`)} и угол ${T('\\alpha')} лежит в первой четверти.`, e: `Из sin^2 + cos^2 = 1 находим второй катет: ${other}/${c}. ${askTan ? `tan = sin / cos = ${other}/${given} = ${ans}.` : `Значит ${askName} = ${other}/${c} = ${ans}.`}` },
        kk: { t: `${T(`\\${fn} \\alpha = \\frac{${given}}{${c}}`)} және ${T('\\alpha')} бұрышы бірінші ширекте жатса, ${T(`\\${askName} \\alpha`)} табыңыз.`, e: `sin^2 + cos^2 = 1 теңдігінен екінші катетті табамыз: ${other}/${c}. ${askTan ? `tan = sin / cos = ${other}/${given} = ${ans}.` : `Демек ${askName} = ${other}/${c} = ${ans}.`}` },
        c: ans, w: [gStr, frac(given, other), frac(c - other, c), frac(other + 1, c), frac(c, other)].filter((x) => x !== ans),
      };
    },
  },
  {
    id: 'm-trapezoid', subject: S, topic: 'geom', difficulty: 1,
    build(r) {
      const a = r.int(4, 14), b = r.int(2, 12), h = r.int(2, 10);
      need(a > b);
      const s = (a + b) * h / 2;
      return {
        ru: { t: `Основания трапеции равны ${a} см и ${b} см, высота равна ${h} см. Найдите площадь трапеции (в см²).`, e: `S = (${a} + ${b}) / 2 · ${h} = ${num(s)}.` },
        kk: { t: `Трапецияның табандары ${a} см және ${b} см, биіктігі ${h} см. Трапецияның ауданын табыңыз (см²).`, e: `S = (${a} + ${b}) / 2 · ${h} = ${num(s)}.` },
        c: num(s), w: [num((a + b) * h), num(a * h), num((a - b) * h / 2), num(s + h), num(a * b)],
      };
    },
  },
  {
    id: 'm-cylinder', subject: S, topic: 'geom', difficulty: 2,
    build(r) {
      const R = r.int(2, 9), h = r.int(2, 12);
      const v = R * R * h;
      return {
        ru: { t: `Радиус основания цилиндра равен ${R} см, высота равна ${h} см. Найдите объём цилиндра (в см³).`, e: `V = πR²h = π · ${R * R} · ${h} = ${v}π.` },
        kk: { t: `Цилиндр табанының радиусы ${R} см, биіктігі ${h} см. Цилиндрдің көлемін табыңыз (см³).`, e: `V = πR²h = π · ${R * R} · ${h} = ${v}π.` },
        c: `${v}π`, w: [`${2 * R * h}π`, `${v / 3 % 1 === 0 ? v / 3 : v + R}π`, `${R * h}π`, `${v * 2}π`],
      };
    },
  },
  {
    id: 'm-perm', subject: S, topic: 'comb', difficulty: 1,
    build(r) {
      const n = r.int(4, 9);
      const obj = r.pick([['разных книг на полке', 'түрлі кітапты сөреге'], ['разных флагов на стене', 'түрлі жалауды қабырғаға'], ['разных цветных карандашей на столе', 'түрлі түсті қарындашты үстелге']]);
      return {
        ru: { t: `Сколькими способами можно расставить ${n} ${obj[0]} в ряд?`, e: `Число перестановок: ${n}! = ${fact(n)}.` },
        kk: { t: `${n} ${obj[1]} қатарға неше тәсілмен орналастыруға болады?`, e: `Алмастырулар саны: ${n}! = ${fact(n)}.` },
        c: fact(n), w: [n * n, fact(n - 1), 2 * n, fact(n) / 2, fact(n + 1)],
      };
    },
  },
  {
    id: 'm-dice', subject: S, topic: 'comb', difficulty: 2,
    build(r) {
      const kind = r.pick(['eq', 'less', 'more']);
      const cnt = (k) => (k <= 7 ? k - 1 : 13 - k);
      let s, ways, ru, kk;
      if (kind === 'eq') { s = r.int(3, 11); need(s !== 7); ways = cnt(s); ru = `равна ${s}`; kk = `${s}-ге тең болу`; }
      else if (kind === 'less') { s = r.int(3, 7); ways = 0; for (let k = 2; k < s; k++) ways += cnt(k); ru = `меньше ${s}`; kk = `${s}-ден кіші болу`; }
      else { s = r.int(7, 11); ways = 0; for (let k = s + 1; k <= 12; k++) ways += cnt(k); ru = `больше ${s}`; kk = `${s}-ден үлкен болу`; }
      const c = frac(ways, 36);
      return {
        ru: { t: `Бросают две игральные кости. Какова вероятность, что сумма выпавших очков ${ru}?`, e: `Благоприятных исходов ${ways} из 36. P = ${ways}/36 = ${c}.` },
        kk: { t: `Екі ойын сүйегі лақтырылады. Түскен ұпайлар қосындысының ${kk} ықтималдығы қандай?`, e: `Қолайлы нәтиже ${ways}, барлығы 36. P = ${ways}/36 = ${c}.` },
        c, w: [frac(1, 6), frac(s, 36), frac(ways, 12), frac(ways + 1, 36), frac(1, s), frac(ways + 2, 36)].filter((x) => x !== c),
      };
    },
  },
  {
    id: 'm-veclen', subject: S, topic: 'vec', difficulty: 1,
    build(r) {
      const [a, b, c] = r.pick(TRIPLES);
      const x = r.pick([a, -a]), y = r.pick([b, -b]);
      return {
        ru: { t: `Найдите длину вектора ${T(`\\vec{a}(${x}; ${y})`)}.`, e: `|a| = sqrt(${x}^2 + ${y}^2) = sqrt(${a * a + b * b}) = ${c}.` },
        kk: { t: `${T(`\\vec{a}(${x}; ${y})`)} векторының ұзындығын табыңыз.`, e: `|a| = sqrt(${x}^2 + ${y}^2) = sqrt(${a * a + b * b}) = ${c}.` },
        c, w: [a + b, a * a + b * b, c + 1, c - 1, Math.abs(a - b)],
      };
    },
  },
  {
    id: 'm-mid', subject: S, topic: 'vec', difficulty: 1,
    build(r) {
      const x1 = r.int(-8, 8), y1 = r.int(-8, 8), x2 = r.int(-8, 8), y2 = r.int(-8, 8);
      need((x1 + x2) % 2 === 0 && (y1 + y2) % 2 === 0 && x1 !== x2);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const c = `(${mx}; ${my})`;
      return {
        ru: { t: `Найдите координаты середины отрезка ${T('AB')}, если ${T(`A(${x1}; ${y1})`)}, ${T(`B(${x2}; ${y2})`)}.`, e: `x = (${x1} + (${x2})) / 2 = ${mx}, y = (${y1} + (${y2})) / 2 = ${my}. Середина ${c}.` },
        kk: { t: `${T(`A(${x1}; ${y1})`)}, ${T(`B(${x2}; ${y2})`)} болса, ${T('AB')} кесіндісінің ортасының координаталарын табыңыз.`, e: `x = (${x1} + (${x2})) / 2 = ${mx}, y = (${y1} + (${y2})) / 2 = ${my}. Ортасы ${c}.` },
        c, w: [`(${x1 + x2}; ${y1 + y2})`, `(${my}; ${mx})`, `(${(x2 - x1) / 2}; ${(y2 - y1) / 2})`, `(${mx + 1}; ${my})`, `(${x1 - x2}; ${y1 - y2})`],
      };
    },
  },
];
