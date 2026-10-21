# Doladenie po 2. kole skeptika (20. 10. 2026): tri presné úpravy PLAN-D6-D7.md a jedna v generuj-davky.py.
# Použitie: python3 -I doladenie-2-kolo.py <PLAN-D6-D7.md> <generuj-davky.py>
# Každý starý reťazec sa musí vyskytovať presne raz, inak skript nič nezapíše.
import sys, pathlib

def uprav(cesta, opravy):
    p = pathlib.Path(cesta); t = p.read_text(encoding='utf-8')
    for stare, nove in opravy:
        n = t.count(stare)
        if n != 1:
            sys.exit(f'CHYBA {p.name}: reťazec sa vyskytuje {n}×, má 1×:\n{stare[:120]}')
        t = t.replace(stare, nove)
    p.write_text(t, encoding='utf-8'); print(f'OK {p.name}: {len(opravy)} úprav')

uprav(sys.argv[1], [
("""   Každé vloženie je zmerané na kópii `index.html` (`chyba/navrh/rozpocet/rozpocet.txt`, 20. 10. 2026, `gzip -c`):
""",
"""   Každé vloženie je zmerané na kópii `index.html` (`chyba/navrh/rozpocet/rozpocet.txt`, 20. 10. 2026, `gzip -c`;
   súbor meria zo štandardného vstupu, preto uvádza základ 14 398 B: hlavička gzip bez názvu súboru je o 11 B kratšia
   než pri `gzip -c index.html`, rozdiely vložení sú rovnaké):
"""),
("""   - Pätička dostane odkaz „Právne informácie“ (asi +40 B gzip) a `pages.yml` skopíruje `pravne.html`.
""",
"""   - Pätička dostane odkaz „Právne informácie“ (zmerané spolu so skrytím `<li>` z D6a‑0 +28 B gzip, `rozpocet.txt`)
     a `pages.yml` skopíruje `pravne.html`.
"""),
("""5. **Strojová podoba:** `davky-d6-d7.json` vygenerovaná nanovo z tohto textu; `zhoda.py` overuje, že každý N‑bod
   plánu je v JSON a naopak (`zhoda.txt`).
""",
"""5. **Strojová podoba:** `davky-d6-d7.json` vygenerovaná nanovo z tohto textu (`chyba/navrh/skripty/generuj-davky.py`);
   `zhoda.py` overuje, že každý N‑bod plánu je v JSON a naopak (`zhoda.txt`). Beh 20. 10. 2026: ZHODA, 0 chýb
   (41 N‑bodov obojsmerne, E1–E6, 24 otázok, 5 dávok s 9 poľami a kapitolami skillu, 19 bodov „nerobiť“, R2 a R11–R15).
"""),
])

uprav(sys.argv[2], [
("""(strop 14 600 B gzip; dnes 14 409 B, gzip -c index.html | wc -c)""",
 """(strop 14 600 B gzip; dnes 14 409 B, gzip -c index.html | wc -c; rozpocet.txt meria zo štandardného vstupu, preto uvádza základ 14 398 B – hlavička gzip bez názvu súboru je o 11 B kratšia, rozdiely vložení sú rovnaké)"""),
])
