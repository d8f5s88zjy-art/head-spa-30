"""Písma webu: skopíruje stiahnuté rezy (woff2 z Google Fonts, podmnožiny latin a latin-ext) do assets/fonts/
pod stálymi menami, ktoré používa generátor (nadpisy-*.woff2, text-*.woff2), a vypíše @font-face pre style.css.

Spustenie: ZDROJ=/priečinok/s/woff2 NADPISY=Fraunces TEXT=InstrumentSans python3 source/pisma.py
Mená rodín zodpovedajú predponám súborov v ZDROJ (napr. Fraunces-normal-300-700-latin.woff2).
"""
import os
import re
import shutil
import sys

ZDROJ = os.environ.get('ZDROJ') or sys.exit('chýba ZDROJ=/priečinok/s/woff2')
ROLY = {'nadpisy': os.environ.get('NADPISY'), 'text': os.environ.get('TEXT')}
if not all(ROLY.values()):
    sys.exit('chýba NADPISY= a TEXT= (predpony súborov v ZDROJ)')
KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(KOREN, 'assets', 'fonts')
os.makedirs(OUT, exist_ok=True)
ROZSAHY = {
    'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latinext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
}
MENA = {'nadpisy': 'Nadpisy', 'text': 'Text'}            # mená rodín v CSS (nezávislé od zdroja)

for stary in os.listdir(OUT):
    os.remove(os.path.join(OUT, stary))
css = []
for rola, rodina in ROLY.items():
    subory = sorted(f for f in os.listdir(ZDROJ) if f.startswith(rodina + '-') and f.endswith('.woff2'))
    if not subory:
        sys.exit(f'v {ZDROJ} nie je žiadny {rodina}-*.woff2')
    for f in subory:
        m = re.match(rf'{re.escape(rodina)}-(normal|italic)-(\d+)(?:-(\d+))?-(latin|latin-ext)\.woff2$', f)
        if not m:
            continue
        styl, v1, v2, sada = m.groups()
        sada = sada.replace('-', '')
        cast = ('-kurziva' if styl == 'italic' else '') + (f'-{v1}' if not v2 and styl == 'normal' and len(subory) > 2 else '')
        meno = f'{rola}{cast}-{sada}.woff2'
        shutil.copyfile(os.path.join(ZDROJ, f), os.path.join(OUT, meno))
        vaha = f'{v1} {v2}' if v2 else v1
        css.append(f"@font-face{{font-family:'{MENA[rola]}';font-style:{styl};font-weight:{vaha};font-display:swap;"
                   f"src:url(fonts/{meno}) format('woff2');unicode-range:{ROZSAHY[sada]}}}")
        print(meno, os.path.getsize(os.path.join(OUT, meno)) // 1024, 'kB')
print('\n'.join(css))
