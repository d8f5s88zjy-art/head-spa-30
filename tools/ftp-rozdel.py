"""Rozdelí priečinok _ftp do viacerých ZIPov, každý menší ako limit hostingu.
Každý ZIP má cesty od koreňa webu, takže rozbalenie všetkých do /www/ poskladá celý web.
Použitie: python3 tools/ftp-rozdel.py <cieľový-priečinok> [limit-MB]"""
import os, sys, zipfile

ZDROJ = '_ftp'
CIEL = sys.argv[1] if len(sys.argv) > 1 else '.'
LIMIT = float(sys.argv[2] if len(sys.argv) > 2 else 18) * 1024 * 1024  # rezerva pod 19 MB

subory = []
for koren, _, mena in os.walk(ZDROJ):
    for m in mena:
        cesta = os.path.join(koren, m)
        subory.append((os.path.relpath(cesta, ZDROJ), os.path.getsize(cesta)))
# najprv stránky a malé súbory (1. ZIP stačí na spustenie webu), potom obrázky od najväčších
subory.sort(key=lambda s: (s[0].startswith('assets/img/'), -s[1] if s[0].startswith('assets/img/') else s[0]))

casti, aktualna, velkost = [], [], 0
for rel, sz in subory:
    if aktualna and velkost + sz > LIMIT:
        casti.append(aktualna); aktualna, velkost = [], 0
    aktualna.append(rel); velkost += sz
if aktualna: casti.append(aktualna)

os.makedirs(CIEL, exist_ok=True)
for i, cast in enumerate(casti, 1):
    meno = os.path.join(CIEL, f'headspa30-ftp-{i}-z-{len(casti)}.zip')
    with zipfile.ZipFile(meno, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in cast: z.write(os.path.join(ZDROJ, rel), rel)
    print(meno, round(os.path.getsize(meno) / 1024 / 1024, 1), 'MB', len(cast), 'súborov')
