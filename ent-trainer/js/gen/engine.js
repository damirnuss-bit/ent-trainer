// Движок генераторов: берёт шаблон, подставляет числа, собирает вопрос в общем формате.
import { GenRetry } from './util.js';

// Шаблон: { id, subject, topic, difficulty, build(r) }
// build возвращает { ru:{t,e}, kk:{t,e}, c: верный ответ, w: [неверные варианты (типичные ошибки)] }
// Варианты одинаковые на обоих языках (числа, формулы), текст условия и разбор на двух языках.

export function make(tpl, r, serial = 0) {
  for (let tries = 0; tries < 40; tries++) {
    try {
      return finish(tpl, tpl.build(r), r, serial);
    } catch (e) {
      if (!(e instanceof GenRetry)) throw e;
    }
  }
  throw new Error('Шаблон ' + tpl.id + ' не смог собрать вопрос за 40 попыток');
}

function finish(tpl, b, r, serial) {
  const correct = String(b.c);
  const wrongs = [];
  for (const w of b.w) {
    const s = String(w);
    if (s !== correct && !wrongs.includes(s) && s !== 'NaN' && s !== 'Infinity') wrongs.push(s);
  }
  if (wrongs.length < 3) throw new GenRetry('мало неверных вариантов');
  const picked = r.shuffle(wrongs).slice(0, 3);
  const opts = r.shuffle([correct, ...picked]);
  return {
    id: tpl.id + '~' + serial + '-' + Math.floor(r.f() * 1e6),
    tpl: tpl.id,
    subject: tpl.subject,
    topic: tpl.topic,
    type: 'single',
    difficulty: tpl.difficulty || 2,
    gen: true,
    ru: { text: b.ru.t, options: opts, explanation: b.ru.e },
    kk: { text: b.kk.t, options: opts, explanation: b.kk.e },
    answer: [opts.indexOf(correct)],
    status: 'live',
  };
}
