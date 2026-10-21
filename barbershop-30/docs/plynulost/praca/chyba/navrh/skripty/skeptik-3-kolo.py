# Tretie kolo skeptika (20. 10. 2026): tri opravy citácií v PLAN-D6-D7.md, záznam 11.2 a dve úpravy generuj-davky.py.
# Použitie: python3 -I skeptik-3-kolo.py <PLAN-D6-D7.md> <generuj-davky.py>
# Každý starý reťazec sa musí vyskytovať presne raz, inak skript nič nezapíše.
import sys, pathlib

def uprav(cesta, opravy, dopln=''):
    p = pathlib.Path(cesta); t = p.read_text(encoding='utf-8')
    for stare, nove in opravy:
        n = t.count(stare)
        if n != 1:
            sys.exit(f'CHYBA {p.name}: reťazec sa vyskytuje {n}×, má 1×:\n{stare[:120]}')
        t = t.replace(stare, nove)
    if dopln:
        if dopln.strip() in t: sys.exit(f'CHYBA {p.name}: doplnok už existuje')
        t = t.rstrip('\n') + '\n' + dopln
    p.write_text(t, encoding='utf-8'); print(f'OK {p.name}: {len(opravy)} úprav' + (' + doplnok' if dopln else ''))

uprav(sys.argv[1], [
("""   D5 mení v `index.html` len hlavičku, prvé karty a galériu; do slovníkov môže pridať kľúče, preto sa kľúče 404 pridajú
   ako samostatný blok a pri zlúčení sa slovníky overia `i18n-test.mjs`.
""",
"""   D5 mení v `index.html` len hlavičku (K15), kartu Poď ďalej (VZ‑01, riadky 212–213), galériu (K13, 681–735)
   a značku skriptu filmu (T8, riadok 902), nie riadok pätičky 863; do slovníkov môže pridať kľúče, preto sa kľúče
   404 pridajú ako samostatný blok a pri zlúčení sa slovníky overia `i18n-test.mjs`.
"""),
("""| 6 / 9 / 14 h | tabuľa po D1, ikony z kriviek, pravne.html a jej kontrola, rozpočet HTML |""",
 """| 6 / 9 / 14 h | tabuľa po D1, ikony rastrom z `favicon.svg` (písmo v rasterizéri, R14), `pravne.html` a jej kontrola, rozpočet HTML |"""),
("""Lightbox galérie (`app.js:481–529`)""",
 """Lightbox galérie (`setupLightbox`, `app.js:457–543`)"""),
], dopln="""
### 11.2 Tretie kolo (skeptik, 20. 10. 2026): overenie zapracovania a tri opravy citácií

Overené proti kódu (kópia `hs-tool/barbershop-30`) a proti `PLAN.md`: body 1–6 z 2. kola sú v texte (R11–R15, D6a bod 5,
D6b technika s rozpočtom a poradím vypúšťania, E1 ako `<picture>`/`<img>` s `img.decode()`, E4 len pás tímu, ikony
rastrom, kartička A/B s otázkou 15); `zhoda.py` dáva ZHODA, 0 chýb; v pláne nie je žiadny predpoklad variabilného písma,
`image-set` ani `new Image`; nepotvrdené údaje sú označené ako skryté v časti 0 (bod 4), tabuľke časti 2, R11, D6b
(body 3, 7, 8, 11, 14, 17), časti 6 a časti 8. Citované riadky kódu (`fonts.css`, `style.css`, `i18n.js`, `app.js`,
`vernost.js`, `index.html`), veľkosti gzip, 7 × 262 kľúčov, commit `7ea247c` v `hs2` a súbory dôkazov existujú a sedia.
Opravené priamo:
- časť 9, riadok D6a: „ikony z kriviek“ → ikony rastrom z `favicon.svg` (zvyšok z verzie pred R14),
- E3: lightbox je `setupLightbox` v `app.js:457–543` (nie 481–529); rovnako v `generuj-davky.py` a v JSON,
- časť 1, bod 3: D5 mení v `index.html` aj značku skriptu filmu (T8, riadok 902), nielen hlavičku, kartu Poď ďalej
  a galériu; riadok pätičky 863 D5 nemení (D6a‑0 ostáva bez konfliktu).

Záloha: `chyba/navrh/PLAN-D6-D7.pred-skeptikom-3.md`; skript: `chyba/navrh/skripty/skeptik-3-kolo.py`; JSON vygenerovaný
nanovo a `zhoda.txt` obnovený.
""")

uprav(sys.argv[2], [
("""# Strojová podoba dávok D6a-0, D6a, D6b, D6c a D7 z PLAN-D6-D7.md (po 2. kole skeptika, 20. 10. 2026).""",
 """# Strojová podoba dávok D6a-0, D6a, D6b, D6c a D7 z PLAN-D6-D7.md (po 3. kole skeptika, 20. 10. 2026)."""),
("""app.js:481–529""", """app.js:457–543"""),
("""  "z": "PLAN-D6-D7.md po 2. kole skeptika (rozhodnutia hlavného agenta 1–6, časť 11.1)",""",
 """  "z": "PLAN-D6-D7.md po 3. kole skeptika (rozhodnutia hlavného agenta 1–6, časť 11.1; opravy citácií, časť 11.2)","""),
])
