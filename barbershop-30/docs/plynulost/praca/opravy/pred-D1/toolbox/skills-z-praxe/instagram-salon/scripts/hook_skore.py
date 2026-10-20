#!/usr/bin/env python3
"""Skóre úvodnej vety (hooku) reelu alebo príspevku po slovensky: päť častí po 0 až 100 a spolu.

Pomôcka na porovnanie variantov, nie predpoveď pozretí. Kategórie sú podľa videa joshfpocock „YouTube agent“
(karta hookscore: Specificity, Address, Stakes, Curiosity, Brevity); pravidlá a váhy sú naše vlastné, pôvodný
kód nie je verejný (rozbor: ../../referencie-z-videi/references/naucene-z-videi.md, časť 6).

  konkrétnosť  čísla, čas, cena, miesto, vlastné mená, hmatateľné veci z prevádzky
  oslovenie    ty/vy, tvoj/váš, rozkaz alebo sloveso v 2. osobe (príď, prídeš, prídete)
  stávka       problém alebo prínos pre zákazníka (stres, čakanie, čas, pokoj, bez objednávania)
  zvedavosť    otázka, kontrast „nie X, ale Y“, otvorená slučka (prečo, toto, takto)
  stručnosť    počet slov (do 6 najlepšie)

python3 hook_skore.py "Vypni hlavu." "Tvoj strih. Tvoje miesto."     # varianty za sebou
python3 hook_skore.py --subor varianty.txt                           # jeden hook na riadok
"""
import re, sys, json

TY = r'\b(ty|ťa|ti|teba|tebe|tebou|tvoj\w*|tvoj|tvoja|tvoje|si|sa\s+ti)\b'
VY = r'\b(vy|vás|vám|vami|váš|vaš\w*)\b'
ROZKAZ = r'\b(vypni|príď|poď|poďte|príďte|rezervuj|rezervujte|zavolaj|zavolajte|daruj|darujte|povedz|vyskúšaj|vyskúšajte|objednaj|sadni|uvoľni|nečakaj|pozri|pozrite|zacvič|zastav|dopraj|doprajte|vstúp|vstúpte|vezmi|nechaj|nechajte)\b'
SLOVESO_2 = r'\b\w{3,}(eš|íš|áš|aš|ieš|ete|íte|áte|ate|ujete)\b'
STAVKA = r'\b(stres\w*|chaos\w*|únav\w*|bolest\w*|bolí|napät\w*|ponáhľ\w*|čakan\w*|čakať|bez\s+čakania|bez\s+objednávania|čas\w*|rýchl\w*|pokoj\w*|oddych\w*|relax\w*|zadarmo|zdarma|stačí|jednoducho|vypn\w*|uvoľn\w*|oddýchn\w*|konečne|prestaň\w*|nikdy|vždy|ľahk\w*|istot\w*|strach\w*|hanb\w*|chyb\w*|problém\w*|riešen\w*|uľav\w*|zbav\w*|prvý\w*|prvá|prvé)\b'
ZVEDAV = r'(\?|…|\.\.\.|\bprečo\b|\bčo\s+sa\b|\btoto\b|\btakto\b|\btajomstv\w*|\bnikto\b|\bjediný\w*|\bnie\b[^.?!]*[.,]\s*\w|\bale\b)'
KONKRET = r'(\d+|€|\bmin\b|\bhlav\w*|\bhod\w*\b|\bkresl\w*|\bkáv\w*|\bdver\w*|\buterák\w*|\bvod\w*|\bbrad\w*|\bstrih\w*|\bnožnic\w*|\blamp\w*|\brituál\w*|\bmasáž\w*|\bmisk\w*|\bšampón\w*|\bčinky|\bčink\w*|\brig\w*|\bdráh\w*|\btatami\b|\bpumpa\b|\bMostn\w*|\bNitr\w*|\bVýstavn\w*)'


def score(h):
    t = h.strip()
    low = t.lower()
    words = re.findall(r"[\wÀ-ž']+", t)
    n = len(t.split())                       # slová podľa medzier (17:30 je jedno slovo)
    vlastne = sum(1 for i, w in enumerate(words) if i > 0 and w[:1].isupper() and not re.match(r'[.!?]\s*$', t[:t.find(w)].strip()[-1:] or ''))
    s = {}
    k = len(re.findall(KONKRET, t, re.I)) + vlastne
    s['konkrétnosť'] = min(100, 25 * k)
    a = len(re.findall(TY, low)) + len(re.findall(VY, low)) + len(re.findall(ROZKAZ, low)) + len(re.findall(SLOVESO_2, low))
    s['oslovenie'] = min(100, 50 * a)
    st = len(re.findall(STAVKA, low))
    s['stávka'] = min(100, 40 * st)
    z = len(re.findall(ZVEDAV, low))
    s['zvedavosť'] = min(100, 45 * z)
    s['stručnosť'] = 100 if n <= 6 else 80 if n <= 10 else 55 if n <= 14 else 30 if n <= 20 else 10
    vahy = {'konkrétnosť': .2, 'oslovenie': .2, 'stávka': .2, 'zvedavosť': .15, 'stručnosť': .25}
    spolu = round(sum(s[c] * vahy[c] for c in s))
    rady = {
        'konkrétnosť': 'pridaj číslo, miesto alebo vec z prevádzky (8 kresiel, Mostná 30, teplý uterák)',
        'oslovenie': 'hovor priamo k zákazníkovi (tvoj, príď, prídeš) alebo vykaj, ak tak píše web',
        'stávka': 'pomenuj problém alebo prínos (bez čakania, pokoj, čas)',
        'zvedavosť': 'otázka alebo kontrast „nie X, ale Y“',
        'stručnosť': 'skráť na 6 až 10 slov',
    }
    slabe = [rady[c] for c in s if s[c] < 50]
    # dobrý hook zvyčajne zasiahne tri z piatich častí; všetkých päť naraz je zriedkavé
    stav = 'silný' if spolu >= 60 else 'dobrý' if spolu >= 40 else 'slabý'
    return {'hook': t, 'slov': n, 'casti': s, 'spolu': spolu, 'stav': stav, 'rady': slabe}


def main(a):
    if a and a[0] == '--subor':
        hooky = [r.strip() for r in open(a[1], encoding='utf-8') if r.strip()]
    else:
        hooky = a
    if not hooky:
        print(__doc__); return 2
    vys = sorted((score(h) for h in hooky), key=lambda r: -r['spolu'])
    if '--json' in sys.argv:
        print(json.dumps(vys, ensure_ascii=False, indent=1)); return 0
    for r in vys:
        c = '  '.join(f'{k} {v}' for k, v in r['casti'].items())
        print(f"{r['spolu']:3d} {r['stav']:6}  {r['hook']}\n     {c}")
        for x in r['rady']:
            print(f'     · {x}')
    return 0


if __name__ == '__main__':
    sys.exit(main([x for x in sys.argv[1:] if x != '--json']))
