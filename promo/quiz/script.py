"""Текст озвучки выпуска: 12 фраз (сегментов). Между ними в ролике идут таймеры и анимации.
0 интро | 1 Q1 | 2 Q2 | 3 ответ2+лайк | 4 Q3 | 5 ответ3 | 6 Q4 | 7 ответ4 | 8 Q5 | 9 ответ5 | 10 ответ на Q1 | 11 призыв
"""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
LV = {'ru': ['Первый уровень.', 'Второй уровень.', 'Третий уровень, сложный.', 'Четвёртый уровень, эксперт.', 'Последний уровень, невозможный.'],
      'kk': ['Бірінші деңгей.', 'Екінші деңгей.', 'Үшінші деңгей, қиын.', 'Төртінші деңгей, сарапшы.', 'Соңғы деңгей, мүмкін емес.']}
TXT = {'ru': dict(intro='Ответишь на все пять, значит к ЕНТ готов.', later='Ответ скажу в самом конце.',
                  tap='Если ответил правильно, тапни два раза по экрану.', back='А теперь первый вопрос.',
                  cta='Сколько из пяти? Пиши в комменты. Дальше тренируйся в Телеграм боте ЕНТ тренажёр. Две тысячи вопросов, платить ничего не надо. Ссылка в профиле.'),
       'kk': dict(intro='Бесеуіне де жауап берсең, ҰБТ-ға дайынсың.', later='Жауабын ең соңында айтамын.',
                  tap='Дұрыс жауап берсең, экранды екі рет бас.', back='Ал енді бірінші сұрақ.',
                  cta='Бестен қаншасы? Комментарийге жаз. Ары қарай Телеграмдағы ҰБТ тренажер ботында жаттық. Екі мың сұрақ, ештеңе төлеудің қажеті жоқ. Сілтеме профильде.')}

def say(q, lang):
    s = json.load(open(HERE / 'say.json', encoding='utf-8')).get(q['id'], {}).get(lang, {})
    return s.get('q', q[lang]['text']), s.get('a', q[lang]['options'][q['correct']] + '.')

def segments(ep, lang):
    t = TXT[lang]; S = [say(q, lang) for q in ep]
    seg = [t['intro'], f"{LV[lang][0]} {S[0][0]} {t['later']}"]
    for k in range(1, 5):
        seg.append(f"{LV[lang][k]} {S[k][0]}")
        seg.append(S[k][1] + (f" {t['tap']}" if k == 1 else ''))
    seg.append(f"{t['back']} {S[0][1]}")
    seg.append(t['cta'])
    return seg

def tts_text(ep, lang):  # один запрос в ElevenLabs/vidIQ: паузы 2.5 с режут сегменты
    return ' <break time="2.5s" />\n'.join(segments(ep, lang))

def needs_review(q, lang):
    """Вопросы с цифрами/формулами TTS читает плохо: для них нужна запись в say.json."""
    import re
    s = json.load(open(HERE / 'say.json', encoding='utf-8')).get(q['id'], {}).get(lang)
    return not s and bool(re.search(r'[₀-₉⁰-⁹²³¹·√]|\d[a-zA-Z]\b|\b[A-Z][a-z]?[A-Z0-9]', q[lang]['text'] + q[lang]['options'][q['correct']]))
