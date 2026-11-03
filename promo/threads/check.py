#!/usr/bin/env python3
"""Проверка постов: python3 check.py posts_wN.json  (стоп-слова, тире, латиница в KK, повторы с history.txt)"""
import json, re, sys, difflib, pathlib
here = pathlib.Path(__file__).parent
STOP = [r'бесплатн', r'даром', r'тегін', r'акци', r'скидк', r'промокод', r'купи', r'заработ', r'гаранти', r'100\s?%',
        r'лайкн', r'поставь \+', r'отметь друга', r'репостн', r'скинь (этот пост )?друг', r'сохрани', r'досыңа .*жібер',
        r'шок', r'срочно', r'только сегодня', r'не поверишь', r'розыгрыш', r'giveaway', r'конкурс', r'https?://', r'—', r'телеграм', r'telegram', r'инстаграм', r'instagram']
d = json.load(open(sys.argv[1]))
hist = [l.strip() for l in open(here / 'history.txt', encoding='utf8') if l.strip()] if (here / 'history.txt').exists() else []
bad = 0
for lang in ('ru', 'kk'):
    posts = d.get(lang, [])
    links = sum('@enttrainer_bot' in p for p in posts)
    print(f'{lang}: {len(posts)} постов, со ссылкой {links}')
    for i, p in enumerate(posts):
        low = p.lower()
        for s in STOP:
            if re.search(s, low): print(f'  [{lang} {i}] стоп-слово {s!r}: {p[:60]}'); bad += 1
        if lang == 'kk' and re.search('[a-z]', low.replace('@enttrainer_bot', '')): print(f'  [{lang} {i}] латиница: {p[:60]}'); bad += 1
        first = low.split('\n')[0]
        for h in hist + posts[:i]:
            if difflib.SequenceMatcher(None, first, h.lower().split('\n')[0]).ratio() > 0.7:
                print(f'  [{lang} {i}] похоже на старый пост: {p[:50]} ~ {h[:50]}'); bad += 1; break
print('ОК' if not bad else f'проблем: {bad}')
sys.exit(1 if bad else 0)
