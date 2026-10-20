"""Písma webu: zo stiahnutých rezov (woff2 z Google Fonts, podmnožiny latin a latin-ext) vyrobí do assets/fonts/
súbory so stálymi menami, ktoré používa generátor (nadpisy-*.woff2, text-*.woff2), a vypíše @font-face pre style.css.
Variabilné písmo vie orezať na použité osi (menší súbor pre prvé okno TCP) a každý súbor podsadí na znaky svojej
podmnožiny (latin, latin-ext), aby v ňom nezostali nepoužité glyfy.

Spustenie: ZDROJ=/priečinok/s/woff2 NADPISY=BricolageGrotesque TEXT=InstrumentSans \
           OSI_NADPISY="wght=500:700,wdth=85:100,opsz=96" python3 source/pisma.py
Mená rodín zodpovedajú predponám súborov v ZDROJ (napr. Fraunces-normal-300-700-latin.woff2).
OSI_NADPISY / OSI_TEXT: os=min:max ponechá rozsah, os=hodnota os zafixuje; ostatné osi ostanú celé.
"""
import io
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

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


def rozsah_unicode(sada):
    """Zoznam kódových bodov pre podmnožinu podľa jej unicode-range."""
    body = []
    for cast in ROZSAHY[sada].split(','):
        a, _, b = cast.strip()[2:].partition('-')
        body.extend(range(int(a, 16), int(b or a, 16) + 1))
    return body


def uprav(vstup, vystup, sada, osi, vaha):
    """Oreže osi variabilného písma (ak sú zadané) a podsadí glyfy na znaky podmnožiny; vráti font-weight pre CSS."""
    f = TTFont(vstup)
    if osi and 'fvar' in f:
        limity = {}
        for cast in osi.split(','):
            os_, _, hod = cast.strip().partition('=')
            limity[os_] = tuple(float(x) for x in hod.split(':')) if ':' in hod else float(hod)
        f = instancer.instantiateVariableFont(f, limity, inplace=False, updateFontNames=False)
        buf = io.BytesIO(); f.save(buf); f = TTFont(io.BytesIO(buf.getvalue()))    # po orezaní znovu načítať (gvar)
        if 'wght' in limity:
            w = limity['wght']
            vaha = f'{int(w[0])} {int(w[1])}' if isinstance(w, tuple) else str(int(w))
    o = subset.Options(flavor='woff2', layout_features=['*'], notdef_outline=True, name_IDs=['*'], hinting=False)
    o.drop_tables += ['DSIG']
    sub = subset.Subsetter(o)
    sub.populate(unicodes=rozsah_unicode(sada))
    sub.subset(f)
    f.flavor = 'woff2'
    f.save(vystup)
    return vaha

for stary in os.listdir(OUT):
    os.remove(os.path.join(OUT, stary))
css = []
for rola, rodina in ROLY.items():
    subory = sorted(f for f in os.listdir(ZDROJ) if f.startswith(rodina + '-') and f.endswith('.woff2'))
    if not subory:
        sys.exit(f'v {ZDROJ} nie je žiadny {rodina}-*.woff2')
    # OSI_<ROLA>: jedna alebo viac inštancií oddelených bodkočiarkou, každá voliteľne s menom: "700:opsz=96,wdth=92,wght=700;500:opsz=12,wdth=87.5,wght=500"
    instancie = [(i.split(':', 1)[0], i.split(':', 1)[1]) if re.match(r'^\w+:', i) else ('', i) for i in os.environ.get('OSI_' + rola.upper(), '').split(';') if i.strip()] or [('', '')]
    for f in subory:
        m = re.match(rf'{re.escape(rodina)}-(normal|italic)-(\d+)(?:-(\d+))?-(latin|latin-ext)\.woff2$', f)
        if not m or (m.group(1) == 'italic' and os.environ.get('BEZ_KURZIVY')):
            continue
        styl, v1, v2, sada = m.groups()
        sada = sada.replace('-', '')
        for znacka, osi in instancie:
            cast = ('-kurziva' if styl == 'italic' else '') + (f'-{znacka}' if znacka else '') + (f'-{v1}' if not v2 and not znacka and styl == 'normal' and len(subory) > 2 else '')
            meno = f'{rola}{cast}-{sada}.woff2'
            vaha = f'{v1} {v2}' if v2 else v1
            vaha = uprav(os.path.join(ZDROJ, f), os.path.join(OUT, meno), sada, osi, vaha)
            css.append(f"@font-face{{font-family:'{MENA[rola]}';font-style:{styl};font-weight:{vaha};font-display:swap;"
                       f"src:url(fonts/{meno}) format('woff2');unicode-range:{ROZSAHY[sada]}}}")
            print(meno, os.path.getsize(os.path.join(OUT, meno)) // 1024, 'kB')
print('\n'.join(css))
