# Hodnotenie ako slepe/zarad-v2-1-rucne.py (hodnotiteľ v2-1), nad výsledkami po-*-zarad.json (zarad.py = zarad-v2-1.py).
#   python3 -I hodnot-v2.py <predpona>
# Ručné zaradenia hodnotiteľa: ODCH_LEG/ODCH_NELEG sú odchýlky bez tvrdenia; CAS_PRI_CENE sa ráta ako odovzdanie navyše
# len vtedy, keď odpoveď je stále voľba trvania (príznak cas). Každý CHYBA-KANDIDAT mimo odchýlok je CHYBA.
import json, sys, collections
P = sys.argv[1]
ODCH_LEG = {'chcem sa objednat na strih', 'Dobry den, chcel by som sa objednat na strih, ako na to?', 'Môžem sa objednať na strih na zajtra ráno?', 'Můžu se objednat na střih na zítra ráno?'}
ODCH_NELEG = {'Máte TikTok?', 'Hundefriseur?', 'Máte wifi v čakárni?'}
CAS_PRI_CENE = {'My hair is quite long, over 10 cm. Is it more expensive?', 'Mám vlasy dlho nestrihané, asi 15 cm, koľko?'}
NELEG = {'odovzdanie', 'bez-ceny'}
def okset(r):
    p = r.get('prijatelne') or []
    if isinstance(p, str): p = [x for x in p.split(',') if x]
    return {r['ocakavane']} | set(p)
T = collections.Counter(); L = F = 0
print('| sada | spolu | OK | ODCHÝLKA | ODOVZDANIE‑NAVYŠE | CHYBA | legitímne | fallback_legit |\n|---|---|---|---|---|---|---|---|')
for s in ['A', 'B', 'C2', 'D1', 'D2']:
    rows = json.load(open(f'{P}-{s}-zarad.json')); c = collections.Counter(); l = f = 0
    for r in rows:
        q, t = r['otazka'], r['trieda']
        if t == 'CHYBA-KANDIDAT': t = 'ODCHYLKA' if (q in ODCH_LEG or q in ODCH_NELEG) else 'CHYBA'
        elif q in CAS_PRI_CENE and r.get('cas'): t = 'ODOVZDANIE-NAVYSE'
        c[t] += 1
        if t == 'CHYBA': print('CHYBA', s, r['jazyk'], q, r['typ'], r['id'], file=sys.stderr)
        if not okset(r) <= NELEG:
            l += 1; f += t in ('ODOVZDANIE-NAVYSE', 'ODCHYLKA')
    T.update(c); L += l; F += f
    print(f"| {s} | {len(rows)} | {c['OK']} | {c['ODCHYLKA']} | {c['ODOVZDANIE-NAVYSE']} | {c['CHYBA']} | {l} | {f} ({100*f/l:.1f} %) |")
print(f"| spolu | {sum(T.values())} | {T['OK']} | {T['ODCHYLKA']} | {T['ODOVZDANIE-NAVYSE']} | {T['CHYBA']} | {L} | {F} ({100*F/L:.2f} %) |")
