#!/usr/bin/env python3
"""Úprava assets/recepcia/sk.json pre opravu 3 (pravidlá zhody 1–6). Spustenie: python3 -I sk_uprava.py <koreň barbershop-30>
sk.json je ručný zdroj; zápis má rovnaký tvar ako jazyky-gen.py (zapis)."""
import json, sys
from pathlib import Path

ROOT = Path(sys.argv[1])
P = ROOT / 'assets/recepcia/sk.json'
d = json.loads(P.read_text('utf8'))

# trieda výplňových a zdvorilých slov (pravidlá 2 a 5); zhoda ako pri kmeňoch (predpona podľa pravidla 1)
VYPLN = 'robi pyta stal chcel potreb zaujim opyt spyt otazk viet treba klasick male zajtra rano pondel utor stred stvrt piat sluzb sluzie vlastne kolkych'
ZDVOR = 'dakuj dekuj dik vdak prepac sorry ahoj cau dobr super fajn ok okej dovid zdravim jasne rozumiem'

# price-time z cenníka (riadok medzi názvom a cenou, index.html); zdroj = rozsah názov–cena
CAS = {
    'cena-strih': (['40 min'], ['index.html:529-531']),
    'cena-strih-brada': (['60 min'], ['index.html:535-537']),
    'cena-brada': (['20 min'], ['index.html:565-567']),
    'cena-dlhe': (['60 min'], ['index.html:541-543']),
    'deti': (['45 min'], ['index.html:547-549']),
    'holenie': (['30 min'], ['index.html:571-573']),
    'hlava': (['25 min'], ['index.html:553-555']),
    'balicky': (['65 min', '80 min'], ['index.html:589-591', 'index.html:595-597']),
    'ultra': (['80 min'], ['index.html:595-597']),
    'plet': (['30 min'], ['index.html:607-609']),
    'obocie': (['5 min', '10 min'], ['index.html:613-615', 'index.html:631-633']),
    'depilacia': (['10 min'], ['index.html:619-621']),
    'farbenie-brady': (['30 min'], ['index.html:577-579']),
    'ornament': (['10 min'], ['index.html:625-627']),
}

# kmene: pravidlo 1 (kmeň do 4 znakov len s krátkou koncovkou) vyžaduje kmeň od 5 znakov pre dlhé tvary tej istej rodiny slov
KLUC = {
    'cena-strih-brada': 'Strih Ostrih pansk spolu | Brad Fuz Fuzo',
    'cena-brada': 'Brad Fuz Fuzo Zastrih uprav',
    'cena-dlhe': 'Dlh Dlhs Dlhy Dlzk =10! =Cm Priplat Drah vlas strih',
    'deti': 'Det Detsk Chlap Syn Synov Diet Gentlem Junior maly rok rokov rocn strih',
    'holenie': 'Holen Holit Hladk Towel Britv Ohol Oholen =hot',
    # dvojskupinová služba = trieda činnosti (celá slovná zásoba holenia) × predmet
    'hlava': 'Ohol Oholen Dohola Holen Holit Hladk Britv | hlav ples dohola',
    'obocie': 'Oboc farb farben uprav',
    'farbenie-brady': 'Farb Farben Zafarb Ofarb | Brad Fuz Fuzo sediv sedin',
    'farbenie-vlasov': 'Farb Farben Zafarb Ofarb Odfarb Melir Trval Blond Tonov | Vlas Melir Trval Blond roman',
    'kava': 'Kav Caka Cakar Pock Napoj Obcerstv Mineralk Pit zdarma zadarmo',
    # slová z názvu služby v cenníku (index.html, price-name) patria medzi kmene položky
    'plet': 'Plet Pokozk Starostl Peeling Mask Premium Osetren naparen tvar',
    'ornament': 'Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb Ciar vlas',
    'trvanie': 'Trvanie Minut =Trva =Trvat =Casu =Casovo dlho | strih brad',
}
KLUC_N = {
    'storno': 'Zrus Zrusen Storn Presun Preloz Mesk Nestih Odvol Zmen termin poplat',
    'parkovanie': 'Park Parkov Zapark =Mhd Autobus Zastavk Garaz auto',
    # trieda produktov (pravidlo 4: slovník tried je povolený)
    'produkty': 'Produkt Pomad Predav Predaj Kupit Kupim Znack Kozmetik Pripravk =Gel Olej Balzam Hreben =Kefa =Kefu Serum Sampon Kondicion Sprej Puder Krem =Pena vosk vlas brad',
    # trieda ženská osoba (rodina, okolie)
    # zriedkavé tvary (susedka, neter…) nechytá slovník, ale strážca neznámych slov (pravidlo 2) – nedostanú cenu
    'damske': ('Damsk =Damy Zensk =Zena =Zeny =Zenu =Zene Dievc Dcer Manzelk Priatelk Frajerk Slecn =Baba =Babu =Baby Babk Babic '
               '=Mama =Mamu =Mamy =Mamou Mamk Mamin Mamic Sestr =Teta =Tetu Tetk Svokr Kamaratk'),
    'romana-ceny': 'Roman farb farben melir trval vlas kedy dni',
}
NOVE = [
    # trieda miesto mimo podniku
    {'id': 'mimo', 'otazky': ['Chodíte strihať aj domov?', 'doma'],
     'kluc': 'Domov =Doma =Domu Nemocnic Dochodc Hotel Svadb Vyjazd',
     'odovzdanie': 'Služby mimo podniku na webe neuvádzame.', 'akcie': ['tel', 'email']},
    # trieda dieťa podľa veku, ktorý stránka neuvádza (stránka: „pre chlapcov do 10 rokov“, index.html:547)
    {'id': 'vek', 'otazky': ['Strihate aj tínedžerov?', '12 rokov'],
     'kluc': '=11! =12! =13! =14! =15! =16! =17! =18! Tinedz Pubert | rok rokov rocn Tinedz Pubert',
     'odovzdanie': 'Strih pre chlapcov nad 10 rokov na webe neuvádzame.', 'akcie': ['tel', 'email']},
]

VARIANT = {'email': ['emailova adresa'], 'ornament': ['hair tattoo'], 'ceny-konecne': ['ceny', 'aké máte ceny'], 'co-je-v-strihu': ['co je v strihu'],
           'recepcia': ['kto ma privíta'], 'bez-objednania': ['bez objednania']}
d['vypln'] = VYPLN
d['zdvor'] = ZDVOR
# poradie kľúčov: vypln a zdvor hneď za cenove
d = {k: d[k] for k in ['jazyk', 'prah', 'stop', 'cenove', 'vypln', 'zdvor'] + [k for k in d if k not in ('jazyk', 'prah', 'stop', 'cenove', 'vypln', 'zdvor')]}
for p in d['polozky']:
    if p['id'] in KLUC:
        p['kluc'] = KLUC[p['id']]
    if p['id'] in CAS:
        cas, zdroj = CAS[p['id']]
        q = {}
        for k, v in p.items():
            q[k] = v
            if k == 'odpoved':
                q['cas'] = cas
        q['zdroj'] = zdroj
        p.clear(); p.update(q)
    if p['id'] == 'trvanie':
        q = {'id': p['id'], 'pravidlo': 'cas'}
        q.update({k: v for k, v in p.items() if k != 'id'})
        p.clear(); p.update(q)
for p in d['polozky'] + d['nevieme']:
    k = VARIANT.get(p['id'], [])
    o = [p['otazky'][0]] + [x for x in p['otazky'][1:] if x in k]
    for x in p['otazky'][1:]:
        if len(o) < 2 and x not in o:
            o.append(x)
    p['otazky'] = o
for p in d['nevieme']:
    if p['id'] in KLUC_N:
        p['kluc'] = KLUC_N[p['id']]
ids = [p['id'] for p in d['nevieme']]
for n in NOVE:
    if n['id'] not in ids:
        d['nevieme'].insert(ids.index('cena-ina-sluzba'), n)
        ids = [p['id'] for p in d['nevieme']]

# zdroj a overene nie sú v jazykovom JSON (modul ich nečíta, sú rovnaké pre 8 jazykov): jeden súbor zdroje.json
ZDROJE = ROOT / 'assets/recepcia/zdroje.json'
z = {p['id']: {'zdroj': p.pop('zdroj'), 'overene': '2026-10-23' if p['id'] in CAS else p.pop('overene')} for p in d['polozky']}
for p in d['polozky']:
    p.pop('overene', None)
c = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ': '))
ZDROJE.write_text('{\n' + ',\n'.join(f'  {c(k)}: {c(v)}' for k, v in z.items()) + '\n}\n', 'utf8')


def zapis(path, d):
    c = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ': '))
    r = ['{']
    keys = list(d)
    for i, k in enumerate(keys):
        end = ',' if i < len(keys) - 1 else ''
        v = d[k]
        if k in ('polozky', 'nevieme'):
            r.append(f'  "{k}": [')
            r.append(',\n'.join('    ' + c(x) for x in v))
            r.append('  ]' + end)
        elif k in ('kontakt', 'panel'):
            r.append(f'  "{k}": {{')
            r.append(',\n'.join(f'    {c(a)}: {c(b)}' for a, b in v.items()))
            r.append('  }' + end)
        else:
            r.append(f'  {c(k)}: {c(v)}{end}')
    r.append('}')
    path.write_text('\n'.join(r) + '\n', 'utf8')


zapis(P, d)
print('sk.json upravený')
