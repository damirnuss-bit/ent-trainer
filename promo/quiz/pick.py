"""Собирает выпуски «Готов к ЕНТ? 5 вопросов» из банка вопросов приложения.

python3 pick.py                 # выпуски из списка CURATED (руками отобранные)
python3 pick.py --auto 10       # +10 выпусков автоматически: по одному вопросу из 5 групп,
                                # только difficulty 1, короткие, без повторов (учёт в used.json)
Результат: episodes.json
"""
import json, random, re, sys
from pathlib import Path

BANK = Path(__file__).resolve().parents[2] / 'ent-trainer' / 'data' / 'bank'
HERE = Path(__file__).resolve().parent
SUBJ = {'history': ('История Казахстана', 'Қазақстан тарихы'),
        'math': ('Математика', 'Математика'),
        'mathlit': ('Мат. грамотность', 'Мат. сауаттылық'),
        'biology': ('Биология', 'Биология'),
        'chemistry': ('Химия', 'Химия'),
        'physics': ('Физика', 'Физика')}
# порядок в ролике: от лёгкого к «ну это все знают» в конце не нужен, просто чередуем предметы
CURATED = [
    ['bio-cell-0030', 'ml-percent-0001', 'chem-general-0025', 'hist-khanate-0001', 'phys-mkt-0003'],
    ['hist-saki-0003', 'math-trig-0007', 'bio-human-0021', 'chem-organic-0034', 'phys-mech-0001'],
    ['hist-xx-0011', 'ml-units-0002', 'bio-gen-0015', 'chem-calc-0009', 'phys-optics-0012'],
    ['hist-khanate-0016', 'math-comb-0006', 'bio-human-0015', 'chem-inorg-0038', 'phys-elec-0017'],
    ['hist-colony-0008', 'math-logs-0005', 'bio-human-0005', 'chem-organic-0010', 'phys-optics-0006'],
    ['hist-indep-0002', 'ml-tariff-0001', 'bio-ecology-0010', 'chem-atom-0001', 'phys-wave-0001'],
]
GROUPS = [['history'], ['math', 'mathlit'], ['biology'], ['chemistry'], ['physics']]


def load():
    qs = {}
    for f in BANK.glob('*.json'):
        for q in json.load(open(f, encoding='utf-8')):
            qs[q['id']] = q
    return qs


def short_easy(q):
    if q.get('difficulty') != 1 or q['type'] != 'single' or not q.get('kk') or len(q['answer']) != 1:
        return False
    r, k = q['ru'], q['kk']
    if len(r['text']) > 95 or len(k['text']) > 110:
        return False
    if max(len(o) for o in r['options'] + k['options']) > 32:
        return False
    return not re.search(r'[$\\_{}<]', r['text'] + k['text'] + ''.join(r['options'] + k['options']))


def item(q, rng):
    order = list(range(len(q['options'] if 'options' in q else q['ru']['options'])))
    rng.shuffle(order)
    out = {'id': q['id'], 'subject': SUBJ[q['subject']], 'correct': order.index(q['answer'][0])}
    for lang in ('ru', 'kk'):
        out[lang] = {'text': q[lang]['text'], 'options': [q[lang]['options'][i] for i in order],
                     'explanation': q[lang].get('explanation', '')}
    return out


def main():
    qs = load()
    rng = random.Random(2027)
    used_f = HERE / 'used.json'
    used = set(json.load(open(used_f))) if used_f.exists() else set()
    eps = []
    for ids in CURATED:
        eps.append([item(qs[i], rng) for i in ids]); used.update(ids)
    if '--auto' in sys.argv:
        n = int(sys.argv[sys.argv.index('--auto') + 1])
        # не берём почти одинаковые шаблонные вопросы: одна тема = один вопрос на выпуск, и тема не чаще раза в 3 выпуска
        pools = [[q for q in qs.values() if q['subject'] in g and short_easy(q)] for g in GROUPS]
        recent = []
        for _ in range(n):
            ep = []
            for pool in pools:
                cand = [q for q in pool if q['id'] not in used and (q['subject'], q['topic']) not in recent[-15:]]
                if not cand:
                    print('банк простых вопросов закончился'); break
                q = rng.choice(cand); used.add(q['id']); recent.append((q['subject'], q['topic'])); ep.append(item(q, rng))
            if len(ep) == 5:
                eps.append(ep)
    json.dump(eps, open(HERE / 'episodes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(sorted(used), open(used_f, 'w'), indent=0)
    print(len(eps), 'выпусков')


main()
