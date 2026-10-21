# Kontrola merania D1: číselné akceptačné kritériá dávky (davky.json D1 / PLAN.md) z mojej série pred/po – mediány
# behov (skrol 3×, ostatné 2×). Textové nástroje (over-audio, over-intl, hlavicka, over-property, vrstvy, cena-sceny) sa
# čítajú ručne z *.txt.   python3 -I kriteria.py
import json, glob, os, re, statistics as st
K = os.path.dirname(os.path.abspath(__file__))
NASE = r'(app|i18n|atmosfera)\.js'
def med(xs): return round(st.median(xs), 2) if xs else None
def skrol(p, s):
    out = []
    for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-kod-stranka/ab-{p}-{s}-*/vysledok.json')):
        v = json.load(open(f)); sh = v['snimky_hlavne']; sn = v['snimky']
        zle = [l for l in v['loaf'] if l['d'] > 50 and any(re.search(NASE, x.get('src') or '') and (x['d'] > 10 or (x.get('forced') or 0) > 10) for x in l['scripts'])]
        atm = [l for l in v['loaf'] if l['d'] > 50 and any(x.get('src') == 'atmosfera.js' for x in l['scripts'])]
        out.append({'p95': sh['spolu']['p95'], 'styl': sh['UpdateLayoutTree']['avg'], 'styl95': sh['UpdateLayoutTree']['p95'], 'nad16': sh['nad16_pct'], 'dlhe': len(v['dlhe_ulohy']),
            'najdlhsia': max([x['ms'] for x in v['dlhe_ulohy']], default=0), 'loafmax': max([l['d'] for l in v['loaf']], default=0), 'zle': len(zle), 'atm': len(atm), 'raf33': sn['nad33_pct'],
            'tab_vyn': sum(x['n'] for x in v['vynutene'] if re.search(r'app\.js:(tick:69\d|krok)', x['k'])), 'tab_ms': sum(x['ms'] for x in v['skripty'] if re.search(r'app\.js:(tick:69\d|krok)', x['k'])),
            'cls': sum(x['v'] for x in v.get('layout_shift', []))})
    return out
def s2(cpu, s):
    out = []
    for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-{cpu}-{s}-*.json')):
        v = json.load(open(f)); out.append({'p95': v['vlaknoNaSnimku']['cpu']['p95'], 'styl': v['vlaknoNaSnimku']['stylPriem'], 'v50': v['dlheUlohy']['vlakno50']})
    return out
def inp(cpu, s):
    out = []
    for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-inp{cpu}-{s}-*.json')):
        k = json.load(open(f))['kroky']; out.append({n: k[n]['inpMs'] for n in k})
    return out
rows = []
def krit(nazov, pred, po, ciel, ok, pozn=''): rows.append((nazov, pred, po, ciel, 'ÁNO' if ok else 'NIE', pozn))
def M(xs, k): return med([x[k] for x in xs])
def L(xs, k): return ', '.join(str(round(x[k], 2)) for x in xs)
a, b = skrol('k1', 'pred'), skrol('k1', 'po')
if b:
    krit('stredne: úloha snímky p95 ms', M(a, 'p95'), M(b, 'p95'), '≤ 20', M(b, 'p95') <= 20, f'behy po {L(b, "p95")}')
    krit('stredne: štýl na snímku ms', M(a, 'styl'), M(b, 'styl'), '≤ 2,0', M(b, 'styl') <= 2.0, f'behy po {L(b, "styl")}')
    krit('stredne: štýl p95 ms', M(a, 'styl95'), M(b, 'styl95'), '≤ 6', M(b, 'styl95') <= 6, f'behy po {L(b, "styl95")}')
    krit('stredne: snímky > 16,7 ms %', M(a, 'nad16'), M(b, 'nad16'), '≤ 8', M(b, 'nad16') <= 8, f'behy po {L(b, "nad16")}')
    krit('stredne: dlhé úlohy', M(a, 'dlhe'), M(b, 'dlhe'), '≤ 6', M(b, 'dlhe') <= 6, f'behy po {L(b, "dlhe")}')
    krit('stredne: LoAF > 50 so skriptom stránky > 10 ms (alebo vynútený štýl > 10)', M(a, 'zle'), M(b, 'zle'), '0 (žiadna)', all(x['zle'] == 0 for x in b), f'behy po {L(b, "zle")}, pred {L(a, "zle")}')
    krit('stredne: rAF > 33 ms % (celá stránka, kontajner)', M(a, 'raf33'), M(b, 'raf33'), '≤ 3', M(b, 'raf33') <= 3, f'behy po {L(b, "raf33")}')
    krit('stredne: CLS počas skrolu', M(a, 'cls'), M(b, 'cls'), '< 0,05', M(b, 'cls') < 0.05)
    krit('stredne: data-scene-active a tabuľa – vynútené Layout/štýl z tabule', M(a, 'tab_vyn'), M(b, 'tab_vyn'), '0', M(b, 'tab_vyn') == 0)
a, b = skrol('k1s', 'pred'), skrol('k1s', 'po')
if b:
    krit('švih: úloha snímky p95 ms', M(a, 'p95'), M(b, 'p95'), '≤ 18', M(b, 'p95') <= 18, f'behy po {L(b, "p95")}')
    krit('švih: dlhé úlohy', M(a, 'dlhe'), M(b, 'dlhe'), '≤ 6', M(b, 'dlhe') <= 6, f'behy po {L(b, "dlhe")}')
a, b = s2('cpu1', 'pred'), s2('cpu1', 'po')
if b:
    krit('čas vlákna CPU 1×: p95 ms', M(a, 'p95'), M(b, 'p95'), '≤ 5,5', M(b, 'p95') <= 5.5, f'behy po {L(b, "p95")}')
    krit('čas vlákna CPU 1×: štýl na snímku ms', M(a, 'styl'), M(b, 'styl'), '≤ 0,7', M(b, 'styl') <= 0.7, f'behy po {L(b, "styl")}')
    krit('čas vlákna CPU 1×: úlohy > 50 ms vlákna', M(a, 'v50'), M(b, 'v50'), '0', all(x['v50'] == 0 for x in b))
a, b = s2('cpu4', 'pred'), s2('cpu4', 'po')
if b: krit('čas vlákna CPU 4×: p95 ms', M(a, 'p95'), M(b, 'p95'), 'nezhoršiť', M(b, 'p95') <= M(a, 'p95'), f'behy pred {L(a, "p95")}, po {L(b, "p95")}')
a, b = skrol('k1pd', 'pred'), skrol('k1pd', 'po')
if b:
    krit('prvý dotyk (hudba=off): najdlhšia úloha ms', M(a, 'najdlhsia'), M(b, 'najdlhsia'), '≤ 100', all(x['najdlhsia'] <= 100 for x in b), f'behy po {L(b, "najdlhsia")}, pred {L(a, "najdlhsia")}')
    krit('prvý dotyk (hudba=off): najdlhšia LoAF ms', M(a, 'loafmax'), M(b, 'loafmax'), '≤ 100', all(x['loafmax'] <= 100 for x in b), f'behy po {L(b, "loafmax")}, pred {L(a, "loafmax")}')
a, b = skrol('k1pdh', 'pred'), skrol('k1pdh', 'po')
if b:
    krit('prvý dotyk s hudbou: LoAF > 50 so skriptom atmosfera.js', M(a, 'atm'), M(b, 'atm'), '0', all(x['atm'] == 0 for x in b), f'behy po {L(b, "atm")}, pred {L(a, "atm")}')
    krit('prvý dotyk s hudbou: najdlhšia úloha ms', M(a, 'najdlhsia'), M(b, 'najdlhsia'), '(informatívne)', True, f'behy po {L(b, "najdlhsia")}')
a, b = skrol('k1k', 'pred'), skrol('k1k', 'po')
if b:
    krit('kontakt: vynútené Layout/UpdateLayoutTree z tabule (n)', M(a, 'tab_vyn'), M(b, 'tab_vyn'), '0', all(x['tab_vyn'] == 0 for x in b), f'behy po {L(b, "tab_vyn")}, pred {L(a, "tab_vyn")}')
    krit('kontakt: skript tabule ms', M(a, 'tab_ms'), M(b, 'tab_ms'), '≤ 250', M(b, 'tab_ms') <= 250, f'behy po {L(b, "tab_ms")}')
for cpu, ciel in (('6', 200), ('4', None)):
    a, b = inp(cpu, 'pred'), inp(cpu, 'po')
    if b:
        mo = med([x['menuOtvor'] for x in b]); mp = med([x['menuOtvor'] for x in a]) if a else None
        krit(f'INP menu CPU {cpu}× ms', mp, mo, f'≤ {ciel}' if ciel else 'nezhoršiť', (mo <= ciel) if ciel else (mp is None or mo <= mp), f'behy po {", ".join(str(x["menuOtvor"]) for x in b)}, pred {", ".join(str(x["menuOtvor"]) for x in a)}')
        for j in ('jazykEN', 'jazykSK'):
            jo = med([x[j] for x in b if j in x]); jp = med([x[j] for x in a if j in x]) if a else None
            krit(f'INP {j} CPU {cpu}× ms', jp, jo, 'nezhoršiť', jp is None or jo <= jp + 16, f'behy po {", ".join(str(x[j]) for x in b if j in x)}, pred {", ".join(str(x[j]) for x in a if j in x)} (tolerancia 16 ms = 1 snímka)')
for s in ('pred', 'po'):
    for f in sorted(glob.glob(f'{K}/nastroje-{s}/overenie-vykon-telefon/vysledky/k1-nac-{s}-*.json')):
        v = json.load(open(f)); krit(f'načítanie {s} {os.path.basename(f)[-6]}: CLS / LCP ms / FCP ms', '', f'{v["cls"]} / {max([x["t"] for x in v["lcp"]], default=None)} / {v["fcpMs"]}', 'CLS < 0,05; LCP nezhoršiť', isinstance(v['cls'], (int, float)) and v['cls'] < 0.05)
for d in ('vzhlad', 'vzhlad-bez-i18n'):
    t = f'{K}/{d}-tabulka.txt'
    if os.path.exists(t):
        vals = [(l.split('|')[1].strip(), float(l.split('|')[2])) for l in open(t) if l.startswith('| ') and re.match(r'\| [pd]\d', l) and l.split('|')[2].strip().replace('.', '').isdigit()]
        if vals: krit(f'vzhľad pred/po ({d}): najväčší podiel pixelov s rozdielom > 30', '', f'{max(v for _, v in vals)} % ({max(vals, key=lambda x: x[1])[0]})', '≤ 0,5 %', max(v for _, v in vals) <= 0.5, f'{len(vals)} snímok')
print('| kritérium | pred | po | cieľ | splnené | poznámka |'); print('|---|---|---|---|---|---|')
for r in rows: print('| ' + ' | '.join(str(x) for x in r) + ' |')
print(f'\nNesplnené: {sum(1 for r in rows if r[4] == "NIE")} z {len(rows)}')
