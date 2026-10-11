"""Zhoda štruktúrovaných dát (JSON-LD, schema.org) s textom stránky, bez siete.
Ponuky (Offer) s url na #id proti kartám <article id data-min data-price> s názvom v <h3> (ponuky bez
#id aspoň proti textu stránky: názov a cena), priceRange proti
najnižšej a najvyššej cene kariet, otázky FAQPage proti .faq-item (.faq-q a .faq-a) na stránke.
Spustenie: python3 -I ld-zhoda.py index.html"""
import html, json, re, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
s = open(sys.argv[1], encoding='utf-8').read()
txt = lambda x: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x)).replace('\xa0', ' ')).strip()
ld = [json.loads(m) for m in re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', s)]
uzly = []
def prejdi(o):
    if isinstance(o, list): [prejdi(x) for x in o]
    elif isinstance(o, dict): uzly.append(o); [prejdi(v) for v in o.values()]
prejdi(ld)

def cislo(x):
    try: return float(str(x).replace(',', '.'))
    except ValueError: return float('nan')
karty = {}
for m in re.finditer(r'<article\b([^>]*)>([\s\S]*?)</article>', s):
    a, b = m.group(1), m.group(2)
    # id karty, nie data-id (pred „id“ nesmie byť písmeno ani spojovník)
    kid, cen, h3 = re.search(r'(?<![\w-])id="([^"]+)"', a), re.search(r'data-price="([\d.]+)"', a), re.search(r'<h3>([\s\S]*?)</h3>', b)
    if not (kid and cen and h3):
        continue
    karty[kid.group(1)] = {
        'nazov': txt(h3.group(1)),
        'min': int(re.search(r'data-min="(\d+)"', a).group(1)), 'cena': cislo(cen.group(1))}

chyby = []
ponuky = [o for o in uzly if o.get('@type') == 'Offer']
telo = txt(re.sub(r'<(script|style)\b[\s\S]*?</\1>', '', s[s.find('<body'):]))
videne = set()
for o in ponuky:
    sluzba = o.get('itemOffered') or {}
    if '#' not in str(o.get('url', '')):
        # ponuka bez odkazu na kartu: aspoň názov a cena (slovenský zápis) musia byť v texte stránky
        cena_sk = str(o.get('price', '')).replace('.', ',')
        if sluzba.get('name') not in telo: chyby.append(f"ponuka „{sluzba.get('name')}“: názov v texte stránky nie je")
        if f'{cena_sk} €' not in telo: chyby.append(f"ponuka „{sluzba.get('name')}“: cena {cena_sk} € v texte stránky nie je")
        continue
    kid = str(o.get('url', '')).rsplit('#', 1)[-1]
    k = karty.get(kid)
    if not k:
        chyby.append(f"ponuka {sluzba.get('name')}: karta #{kid} na stránke nie je"); continue
    videne.add(kid)
    if sluzba.get('name') != k['nazov']: chyby.append(f"#{kid}: názov v dátach „{sluzba.get('name')}“, na stránke „{k['nazov']}“")
    if cislo(o.get('price')) != k['cena']: chyby.append(f"#{kid}: cena v dátach {o.get('price')}, na stránke {k['cena']:g}")
    if sluzba.get('duration') and sluzba['duration'] != f"PT{k['min']}M": chyby.append(f"#{kid}: dĺžka v dátach {sluzba['duration']}, na stránke {k['min']} min")
if videne:
    for kid in set(karty) - videne: chyby.append(f"karta #{kid} ({karty[kid]['nazov']}) nemá ponuku v dátach")

for o in uzly:
    if 'priceRange' in o and karty:
        ceny = [k['cena'] for k in karty.values()]
        cisla = [cislo(x) for x in re.findall(r'\d+(?:[.,]\d+)?', o['priceRange'])]
        if cisla != [min(ceny), max(ceny)]: chyby.append(f"priceRange „{o['priceRange']}“, karty majú {min(ceny):g} až {max(ceny):g} €")

faq = next((o for o in uzly if o.get('@type') == 'FAQPage'), None)
if faq:
    polozky = [(txt(q), txt(a)) for q, a in re.findall(r'class="faq-q"[^>]*>([\s\S]*?)<span[\s\S]*?class="faq-a"[^>]*>([\s\S]*?)</div></div>', s)]
    otazky = faq.get('mainEntity', [])
    if len(polozky) != len(otazky): chyby.append(f'FAQ: na stránke {len(polozky)} otázok, v dátach {len(otazky)}')
    for (q, a), me in zip(polozky, otazky):
        if me.get('name') != q: chyby.append(f"FAQ: otázka v dátach „{me.get('name')}“, na stránke „{q}“")
        elif txt((me.get('acceptedAnswer') or {}).get('text', '')) != a: chyby.append(f'FAQ „{q}“: odpoveď v dátach sa líši od stránky')

print(f'JSON-LD: {len(ponuky)} ponúk, karty: {len(karty)}, FAQ v dátach: {len(faq.get("mainEntity", [])) if faq else 0}')
for c in chyby: print(' NESEDÍ:', c)
print('Dáta pre vyhľadávače sedia s textom.' if not chyby else f'Nesedí: {len(chyby)}')
sys.exit(1 if chyby else 0)
