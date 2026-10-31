// Генераторы: математика, профильный предмет (14 шаблонов).
import { num, need, gcd, frac, sg, T } from './util.js';

const S = 'math';

// "ax + b" в виде строки для формул
const lin = (a, b) => `${a === 1 ? '' : a}x ${sg(b)}`;
// слагаемое с переменной: tm(-1,'x') -> "- x", tm(3,'x^2') -> "+ 3x^2"
const tm = (c, v) => (c < 0 ? '- ' : '+ ') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v;

const TRIG = [
  ['\\sin 30^\\circ', 0.5], ['\\cos 60^\\circ', 0.5], ['\\tan 45^\\circ', 1],
  ['\\sin 90^\\circ', 1], ['\\cos 90^\\circ', 0], ['\\cos 0^\\circ', 1],
];
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
const flipOp = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
const strictOp = { '<': '≤', '>': '≥', '≤': '<', '≥': '>' };
const C = (n, k) => { let x = 1; for (let i = 1; i <= k; i++) x = x * (n - k + i) / i; return Math.round(x); };

export const templates = [
  {
    id: 'm-linear', subject: S, topic: 'eq', difficulty: 1,
    build(r) {
      const a = r.int(2, 9), x = r.int(-9, 12), b = r.int(-15, 15);
      need(x !== 0 && b !== 0);
      const c = a * x + b;
      return {
        ru: { t: `Решите уравнение: ${T(`${lin(a, b)} = ${c}`)}`, e: `${a}x = ${c} ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${c - b}, откуда x = ${c - b} / ${a} = ${x}.` },
        kk: { t: `Теңдеуді шешіңіз: ${T(`${lin(a, b)} = ${c}`)}`, e: `${a}x = ${c} ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${c - b}, олай болса x = ${c - b} / ${a} = ${x}.` },
        c: x, w: [x + 1, x - 1, -x, x + 2, x - 2],
      };
    },
  },
  {
    id: 'm-quad', subject: S, topic: 'eq', difficulty: 2,
    build(r) {
      const p = r.int(-6, 8), q = r.int(-6, 8);
      need(p !== q);
      const Ssum = p + q, Pr = p * q;
      const hi = Math.max(p, q), lo = Math.min(p, q);
      const eq = `x^2 ${tm(-Ssum, 'x')} ${sg(Pr)} = 0`;
      need(Ssum !== 0 && Pr !== 0);
      return {
        ru: { t: `Найдите больший корень уравнения ${T(eq)}`, e: `По теореме Виета сумма корней ${Ssum}, произведение ${Pr}. Корни ${lo} и ${hi}. Больший: ${hi}.` },
        kk: { t: `${T(eq)} теңдеуінің үлкен түбірін табыңыз.`, e: `Виет теоремасы бойынша түбірлер қосындысы ${Ssum}, көбейтіндісі ${Pr}. Түбірлері ${lo} және ${hi}. Үлкені: ${hi}.` },
        c: hi, w: [lo, -hi, Ssum, -lo, Pr],
      };
    },
  },
  {
    id: 'm-ineq', subject: S, topic: 'eq', difficulty: 2,
    build(r) {
      const a = r.pick([-5, -4, -3, -2, 2, 3, 4, 5]), x0 = r.int(-6, 8), b = r.int(-9, 9);
      need(b !== 0 && x0 !== 0);
      const c = a * x0 + b;
      const op = r.pick(['<', '>', '≤', '≥']);
      const res = a > 0 ? op : flipOp[op];
      const eq = `${lin(a, b)} ${op} ${c}`;
      return {
        ru: { t: `Решите неравенство: ${T(eq.replace('≤', '\\le').replace('≥', '\\ge'))}`, e: `${a}x ${op} ${c - b}. Делим на ${a}${a < 0 ? ' (знак неравенства меняется на противоположный)' : ''}: x ${res} ${x0}.` },
        kk: { t: `Теңсіздікті шешіңіз: ${T(eq.replace('≤', '\\le').replace('≥', '\\ge'))}`, e: `${a}x ${op} ${c - b}. ${a}-ге бөлеміз${a < 0 ? ' (теңсіздік белгісі қарама-қарсыға ауысады)' : ''}: x ${res} ${x0}.` },
        c: `x ${res} ${x0}`,
        w: [`x ${a > 0 ? flipOp[op] : op} ${x0}`, `x ${res} ${-x0}`, `x ${strictOp[res]} ${x0}`, `x ${op} ${-x0}`],
      };
    },
  },
  {
    id: 'm-ap', subject: S, topic: 'prog', difficulty: 1,
    build(r) {
      const a1 = r.int(-5, 12), d = r.pick([-4, -3, -2, 2, 3, 4, 5, 6, 7]), n = r.int(8, 20);
      const an = a1 + (n - 1) * d;
      return {
        ru: { t: `В арифметической прогрессии ${T(`a_1 = ${a1}`)}, ${T(`d = ${d}`)}. Найдите ${T(`a_{${n}}`)}.`, e: `a_n = a_1 + (n - 1)d = ${a1} + ${n - 1} · (${d}) = ${an}.` },
        kk: { t: `Арифметикалық прогрессияда ${T(`a_1 = ${a1}`)}, ${T(`d = ${d}`)}. ${T(`a_{${n}}`)} мүшесін табыңыз.`, e: `a_n = a_1 + (n - 1)d = ${a1} + ${n - 1} · (${d}) = ${an}.` },
        c: an, w: [a1 + n * d, a1 + (n - 2) * d, a1 + (n + 1) * d, a1 + (n - 1) + d],
      };
    },
  },
  {
    id: 'm-gp', subject: S, topic: 'prog', difficulty: 2,
    build(r) {
      const b1 = r.int(1, 5), q = r.pick([2, 3]), n = r.pick([3, 4, 5]);
      const Sn = b1 * (Math.pow(q, n) - 1) / (q - 1);
      return {
        ru: { t: `Геометрическая прогрессия: ${T(`b_1 = ${b1}`)}, ${T(`q = ${q}`)}. Найдите сумму первых ${n} членов.`, e: `S_n = b_1 (q^n - 1) / (q - 1) = ${b1} · (${Math.pow(q, n)} - 1) / ${q - 1} = ${Sn}.` },
        kk: { t: `Геометриялық прогрессияда ${T(`b_1 = ${b1}`)}, ${T(`q = ${q}`)}. Алғашқы ${n} мүшесінің қосындысын табыңыз.`, e: `S_n = b_1 (q^n - 1) / (q - 1) = ${b1} · (${Math.pow(q, n)} - 1) / ${q - 1} = ${Sn}.` },
        c: Sn, w: [b1 * Math.pow(q, n), b1 * (Math.pow(q, n) - 1), b1 * Math.pow(q, n - 1), Sn + b1],
      };
    },
  },
  {
    id: 'm-deriv', subject: S, topic: 'func', difficulty: 2,
    build(r) {
      const a = r.int(1, 3), b = r.int(-4, 4), c = r.int(-5, 5), x0 = r.pick([-2, -1, 1, 2, 3]);
      need(b !== 0 && c !== 0);
      const d = 3 * a * x0 * x0 + 2 * b * x0 + c;
      const f = a * x0 ** 3 + b * x0 ** 2 + c * x0;
      const fx = `${a === 1 ? '' : a}x^3 ${tm(b, 'x^2')} ${tm(c, 'x')}`;
      return {
        ru: { t: `Найдите значение производной функции ${T(`f(x) = ${fx}`)} в точке ${T(`x_0 = ${x0}`)}.`, e: `f'(x) = ${3 * a}x^2 + ${2 * b}x + ${c}. f'(${x0}) = ${3 * a * x0 * x0} + ${2 * b * x0} + ${c} = ${d}.` },
        kk: { t: `${T(`f(x) = ${fx}`)} функциясының ${T(`x_0 = ${x0}`)} нүктесіндегі туындысының мәнін табыңыз.`, e: `f'(x) = ${3 * a}x^2 + ${2 * b}x + ${c}. f'(${x0}) = ${3 * a * x0 * x0} + ${2 * b * x0} + ${c} = ${d}.` },
        c: d, w: [f, 3 * a * x0 * x0 + b * x0 + c, 3 * a * x0 * x0 + 2 * b * x0, d + 2 * b, a * x0 * x0 + 2 * b * x0 + c],
      };
    },
  },
  {
    id: 'm-compose', subject: S, topic: 'func', difficulty: 1,
    build(r) {
      const a = r.int(2, 5), b = r.int(-6, 6), k = r.int(-4, 4);
      need(b !== 0 && k !== 0);
      const fg = a * k * k + b, gf = (a * k + b) ** 2;
      return {
        ru: { t: `Даны функции ${T(`f(x) = ${lin(a, b)}`)} и ${T('g(x) = x^2')}. Найдите ${T(`f(g(${k}))`)}.`, e: `g(${k}) = ${k * k}. f(${k * k}) = ${a} · ${k * k} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${fg}.` },
        kk: { t: `${T(`f(x) = ${lin(a, b)}`)} және ${T('g(x) = x^2')} функциялары берілген. ${T(`f(g(${k}))`)} мәнін табыңыз.`, e: `g(${k}) = ${k * k}. f(${k * k}) = ${a} · ${k * k} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${fg}.` },
        c: fg, w: [gf, a * k + b + k * k, fg + b, a * (k * k + b), fg - 2 * b],
      };
    },
  },
  {
    id: 'm-log', subject: S, topic: 'logs', difficulty: 2,
    build(r) {
      const a = r.pick([2, 3, 5]), b = r.pick([2, 3, 4, 10]);
      need(a !== b);
      const k1 = r.int(1, 4), k2 = r.int(1, 3);
      const m = Math.pow(a, k1), n = Math.pow(b, k2);
      const plus = r.chance(0.5);
      const ans = plus ? k1 + k2 : k1 - k2;
      const ex = `\\log_{${a}} ${m} ${plus ? '+' : '-'} \\log_{${b}} ${n}`;
      return {
        ru: { t: `Вычислите: ${T(ex)}`, e: `log_${a} ${m} = ${k1}, так как ${a}^${k1} = ${m}. log_${b} ${n} = ${k2}. Ответ: ${k1} ${plus ? '+' : '-'} ${k2} = ${ans}.` },
        kk: { t: `Есептеңіз: ${T(ex)}`, e: `log_${a} ${m} = ${k1}, себебі ${a}^${k1} = ${m}. log_${b} ${n} = ${k2}. Жауабы: ${k1} ${plus ? '+' : '-'} ${k2} = ${ans}.` },
        c: ans, w: [k1 * k2, plus ? k1 - k2 : k1 + k2, ans + 1, ans - 1, k2 - k1],
      };
    },
  },
  {
    id: 'm-trig', subject: S, topic: 'trig', difficulty: 1,
    build(r) {
      const [t1, t2] = r.shuffle(TRIG).slice(0, 2);
      const a = r.int(2, 8), b = r.int(2, 8);
      const plus = r.chance(0.5);
      const ans = a * t1[1] + (plus ? 1 : -1) * b * t2[1];
      const ex = `${a}${t1[0]} ${plus ? '+' : '-'} ${b}${t2[0]}`;
      return {
        ru: { t: `Найдите значение выражения: ${T(ex)}`, e: `Подставляем табличные значения: ${a} · ${num(t1[1])} ${plus ? '+' : '-'} ${b} · ${num(t2[1])} = ${num(ans)}.` },
        kk: { t: `Өрнектің мәнін табыңыз: ${T(ex)}`, e: `Кесте мәндерін қоямыз: ${a} · ${num(t1[1])} ${plus ? '+' : '-'} ${b} · ${num(t2[1])} = ${num(ans)}.` },
        c: num(ans), w: [num(a + b), num(a * t1[1] + (plus ? -1 : 1) * b * t2[1]), num(ans + 1), num(ans - 0.5), num(ans + 0.5)],
      };
    },
  },
  {
    id: 'm-pyth', subject: S, topic: 'geom', difficulty: 1,
    build(r) {
      const [x, y, z] = r.pick(TRIPLES), k = r.int(1, 3);
      const a = x * k, b = y * k, c = z * k;
      const area = r.chance(0.5);
      return area ? {
        ru: { t: `Гипотенуза прямоугольного треугольника равна ${c}, один из катетов равен ${a}. Найдите площадь треугольника.`, e: `Второй катет: sqrt(${c}^2 - ${a}^2) = ${b}. Площадь: ${a} · ${b} / 2 = ${a * b / 2}.` },
        kk: { t: `Тікбұрышты үшбұрыштың гипотенузасы ${c}, катеттерінің бірі ${a}. Үшбұрыштың ауданын табыңыз.`, e: `Екінші катет: sqrt(${c}^2 - ${a}^2) = ${b}. Ауданы: ${a} · ${b} / 2 = ${a * b / 2}.` },
        c: num(a * b / 2), w: [num(a * b), num(a + b + c), num((a + b) / 2), num(a * c / 2)],
      } : {
        ru: { t: `Катеты прямоугольного треугольника равны ${a} и ${b}. Найдите гипотенузу.`, e: `По теореме Пифагора: c = sqrt(${a}^2 + ${b}^2) = sqrt(${a * a + b * b}) = ${c}.` },
        kk: { t: `Тікбұрышты үшбұрыштың катеттері ${a} және ${b}. Гипотенузасын табыңыз.`, e: `Пифагор теоремасы бойынша: c = sqrt(${a}^2 + ${b}^2) = sqrt(${a * a + b * b}) = ${c}.` },
        c: String(c), w: [String(a + b), String(a * a + b * b), String(c + 1), String(c - 1), String(b - a)],
      };
    },
  },
  {
    id: 'm-circle', subject: S, topic: 'geom', difficulty: 1,
    build(r) {
      const R = r.int(2, 25);
      return {
        ru: { t: `Радиус круга равен ${R} см. Найдите площадь круга (в см²).`, e: `S = πR² = π · ${R}² = ${R * R}π.` },
        kk: { t: `Дөңгелектің радиусы ${R} см. Дөңгелектің ауданын табыңыз (см²).`, e: `S = πR² = π · ${R}² = ${R * R}π.` },
        c: `${R * R}π`, w: [`${2 * R}π`, `${R}π`, `${2 * R * R}π`, `${R * R / 2}π`.replace('.', ',')],
      };
    },
  },
  {
    id: 'm-comb', subject: S, topic: 'comb', difficulty: 2,
    build(r) {
      const n = r.int(5, 12), k = r.int(2, 3);
      const c = C(n, k);
      let pm = 1; for (let i = 0; i < k; i++) pm *= (n - i);
      return {
        ru: { t: `Из ${n} учеников нужно выбрать ${k} для участия в олимпиаде (порядок не важен). Сколькими способами это можно сделать?`, e: `Число сочетаний C(${n}, ${k}) = ${n}! / (${k}! · ${n - k}!) = ${c}.` },
        kk: { t: `${n} оқушыдан олимпиадаға қатысу үшін ${k} оқушы таңдау керек (реті маңызды емес). Мұны неше тәсілмен жасауға болады?`, e: `Теру саны C(${n}, ${k}) = ${n}! / (${k}! · ${n - k}!) = ${c}.` },
        c: String(c), w: [String(pm), String(Math.pow(n, k)), String(c + n), String(n * k), String(c * 2)],
      };
    },
  },
  {
    id: 'm-prob', subject: S, topic: 'comb', difficulty: 1,
    build(r) {
      const red = r.int(2, 9), blue = r.int(2, 9);
      need(red !== blue);
      const tot = red + blue;
      return {
        ru: { t: `В коробке ${red} красных и ${blue} синих шаров. Наугад достают один шар. Какова вероятность, что он красный?`, e: `Благоприятных исходов ${red}, всего ${tot}. P = ${red}/${tot}${gcd(red, tot) > 1 ? ' = ' + frac(red, tot) : ''}.` },
        kk: { t: `Қорапта ${red} қызыл және ${blue} көк шар бар. Кездейсоқ бір шар алынады. Оның қызыл болу ықтималдығы қандай?`, e: `Қолайлы нәтиже ${red}, барлығы ${tot}. P = ${red}/${tot}${gcd(red, tot) > 1 ? ' = ' + frac(red, tot) : ''}.` },
        c: frac(red, tot), w: [frac(red, blue), frac(blue, tot), frac(1, tot), frac(red, tot - 1), frac(blue, red)],
      };
    },
  },
  {
    id: 'm-dot', subject: S, topic: 'vec', difficulty: 1,
    build(r) {
      const x1 = r.int(-5, 5), y1 = r.int(-5, 5), x2 = r.int(-5, 5), y2 = r.int(-5, 5);
      need(x1 && y1 && x2 && y2);
      const d = x1 * x2 + y1 * y2;
      return {
        ru: { t: `Найдите скалярное произведение векторов ${T(`\\vec{a}(${x1}; ${y1})`)} и ${T(`\\vec{b}(${x2}; ${y2})`)}.`, e: `a · b = x1·x2 + y1·y2 = ${x1} · ${x2} + ${y1} · ${y2} = ${d}.` },
        kk: { t: `${T(`\\vec{a}(${x1}; ${y1})`)} және ${T(`\\vec{b}(${x2}; ${y2})`)} векторларының скаляр көбейтіндісін табыңыз.`, e: `a · b = x1·x2 + y1·y2 = ${x1} · ${x2} + ${y1} · ${y2} = ${d}.` },
        c: d, w: [x1 * y2 - y1 * x2, (x1 + x2) * (y1 + y2), x1 * x2 - y1 * y2, x1 * y2 + y1 * x2, d + 2],
      };
    },
  },
];
