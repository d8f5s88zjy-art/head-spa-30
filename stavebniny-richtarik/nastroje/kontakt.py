"""Zmena telefónu alebo e-mailu zo správy webu v repozitári (sprava_import.py): rovnaké podoby ako sprava/jadro/Kontakt.php
(0905 622 223, s nezlomiteľnými medzerami, s &nbsp;, 037/651 17 77, +421…, 421…). Nahradí ich vo všetkých textových
zdrojoch a výstupoch (index.html, zdroj/pages.json, assets/*.js, znalosti asistenta…); build.py potom vyrobí ostatné."""
import os, re

POLIA = ('mobil', 'pevna', 'email')
PRIPONY = ('.html', '.js', '.json', '.xml', '.txt', '.md', '.webmanifest', '.py', '.css', '.tsv', '.php')
VYNECHAT = {'img', 'pdf', 'subory', '.git', '__pycache__', 'data', 'vendor'}


def podoby(pole, v):
    if pole == 'email': return [v]
    p = [v, v.replace(' ', ' '), v.replace(' ', '&nbsp;')]
    lomka = re.sub(r'^(\d+) ', r'\1/', v, count=1)
    if lomka != v: p.append(lomka)
    return p


def pary(stara, nova):
    von = []
    for pole in POLIA:
        if stara.get(pole, '') == nova.get(pole, '') or not stara.get(pole): continue
        s, n = podoby(pole, stara[pole]), podoby(pole, nova[pole])
        von += [(x, n[min(i, len(n) - 1)]) for i, x in enumerate(s)]
        if pole != 'email':
            von += [(stara[pole + '_tel'], nova[pole + '_tel']), (stara[pole + '_tel'].lstrip('+'), nova[pole + '_tel'].lstrip('+'))]
    return sorted(von, key=lambda x: -len(x[0].encode('utf-8')))


def nahrad(t, p):
    for a, b in p: t = t.replace(a, b)
    return t


def nahrad_v_strome(koren, p):
    """Nahradí staré podoby kontaktu vo všetkých textových súboroch pod koreňom; vráti zoznam zmenených."""
    zmenene = []
    for kor, dirs, subory in os.walk(koren):
        dirs[:] = [d for d in dirs if d not in VYNECHAT]
        for f in subory:
            if not f.endswith(PRIPONY): continue
            c = os.path.join(kor, f)
            try: t = open(c, encoding='utf-8').read()
            except UnicodeDecodeError: continue
            n = nahrad(t, p)
            if n != t:
                open(c, 'w', encoding='utf-8').write(n); zmenene.append(os.path.relpath(c, koren))
    return zmenene
