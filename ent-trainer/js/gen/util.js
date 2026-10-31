// Помощники для генераторов. Не трогают DOM, работают и в браузере, и в Node.

export class GenRetry extends Error {}

// Если условие не выполнено, шаблон просто пробует другие числа
export function need(cond) {
  if (!cond) throw new GenRetry('retry');
}

export function mkRng(seed) {
  let f = Math.random;
  if (seed != null) {
    let a = seed >>> 0;
    f = () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  return {
    f,
    int: (a, b) => a + Math.floor(f() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    shuffle: (arr) => {
      const x = arr.slice();
      for (let i = x.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [x[i], x[j]] = [x[j], x[i]];
      }
      return x;
    },
    chance: (p) => f() < p,
  };
}

// Число в виде строки с запятой: 2.5 -> "2,5"
export function num(x) {
  const v = Math.round(x * 1e6) / 1e6;
  return String(v).replace('.', ',');
}

// Число с пробелами-разделителями тысяч: 12500 -> "12 500"
export function money(x) {
  const s = num(x);
  const [i, d] = s.split(',');
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return d ? g + ',' + d : g;
}

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }

export function frac(a, b) {
  const g = gcd(a, b);
  const n = a / g, d = b / g;
  return d === 1 ? String(n) : n + '/' + d;
}

// знак перед числом в записи многочлена: sg(5) -> "+ 5", sg(-3) -> "- 3"
export function sg(x) { return x < 0 ? '- ' + Math.abs(x) : '+ ' + x; }

// $ ... $ для формул
export const T = (s) => '$' + s + '$';
