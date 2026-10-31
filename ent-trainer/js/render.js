// Безопасный вывод текста вопросов и формул (KaTeX с CDN, запасной вариант: красивый обычный текст).
import { CONFIG } from './config.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', n: 'ₙ' };

// Обычный текст: x^2 -> x², a_1 -> a₁, sqrt( -> √(
function pretty(s) {
  return s
    .replace(/sqrt\(/g, '√(')
    .replace(/\^([0-9n])/g, (m, d) => SUP[d])
    .replace(/_([0-9n])/g, (m, d) => SUB[d]);
}

// Формула без KaTeX: читаемая запись
function plainTex(s) {
  let r = s
    .replace(/\\le(?![a-z])/g, '≤').replace(/\\ge(?![a-z])/g, '≥')
    .replace(/\\pi/g, 'π').replace(/\\cdot/g, '·').replace(/\\circ/g, '°')
    .replace(/\\(sin|cos|tan|log)/g, '$1')
    .replace(/\\vec\{(\w)\}/g, '$1⃗')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/_\{([0-9n]+)\}/g, (m, d) => d.split('').map((c) => SUB[c] || c).join(''))
    .replace(/\^\{([0-9n]+)\}/g, (m, d) => d.split('').map((c) => SUP[c] || c).join(''))
    .replace(/_([0-9n])/g, (m, d) => SUB[d])
    .replace(/\^([0-9n])/g, (m, d) => SUP[d])
    .replace(/[{}]/g, '');
  return r;
}

// Текст с формулами $...$ -> безопасный HTML
export function rt(text) {
  if (text == null) return '';
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return parts.map((p) => {
    if (p.length > 2 && p[0] === '$' && p[p.length - 1] === '$') {
      const tex = p.slice(1, -1);
      return `<span class="tex" data-t="${esc(tex)}">${esc(plainTex(tex))}</span>`;
    }
    return esc(pretty(p));
  }).join('');
}

// Отрисовать формулы KaTeX, если он уже загружен
export function typeset(root = document) {
  if (!window.katex) return;
  root.querySelectorAll('.tex:not([data-done])').forEach((el) => {
    try {
      window.katex.render(el.dataset.t, el, { throwOnError: false });
      el.dataset.done = '1';
    } catch (e) { /* остаётся простой текст */ }
  });
}

let katexLoading = false;
export function loadKatex() {
  if (katexLoading || window.katex) return;
  katexLoading = true;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = CONFIG.katexCss;
  document.head.appendChild(css);
  const js = document.createElement('script');
  js.src = CONFIG.katexJs; js.async = true;
  js.onload = () => typeset(document);
  js.onerror = () => { katexLoading = false; };    // офлайн: остаётся простой текст
  document.head.appendChild(js);
}

export const escHtml = esc;
