"""Pripraví všetko na ručnú výmenu poukazov v obchode Booqme.

Vytvorí v cieľovom priečinku:
  headspa30-poukazky-booqme.zip   POUKAZKY-DO-BOOQME/NN-Nazov.jpg (17 obrázkov 1600 × 1200)
                                  + BOOQME-POUKAZY.txt (postup, stará a nová cena, odkaz na úpravu, CRLF)
  stranka/                        (s --stranka) stránka do mobilu so zoznamom, obrázkami, cenami,
                                  odkazmi a odškrtávaním; dá sa zverejniť ako súkromná stránka
                                  (poukazy-do-booqme.html + img/) alebo poslať ako súbory

Ceny v obchode a čísla poukazov berie naživo z verejného obchodu Booqme (booqme-poukazy.py),
nové ceny a poradie z docs/poukazky/sablona/ritualy.json, obrázky z docs/poukazky/sablona/booqme/.

Použitie (z koreňa repozitára):
  python3 toolbox/head-spa-30/scripts/booqme-balik.py <cieľový-priečinok> [--stranka]
"""
import html
import importlib.util
import json
import os
import shutil
import sys
import zipfile

TU = os.path.dirname(os.path.abspath(__file__))
KOREN = os.path.normpath(os.path.join(TU, '..', '..', '..'))
BOOQME = os.path.join(KOREN, 'docs', 'poukazky', 'sablona', 'booqme')

spec = importlib.util.spec_from_file_location('booqme_poukazy', os.path.join(TU, 'booqme-poukazy.py'))
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

if len(sys.argv) < 2:
    raise SystemExit(__doc__)
out = os.path.abspath(sys.argv[1])
os.makedirs(out, exist_ok=True)

with open(os.path.join(KOREN, 'docs', 'poukazky', 'sablona', 'ritualy.json'), encoding='utf-8') as fh:
    R = json.load(fh)
salon = [r for r in R if r.get('salon')]
V, chyba = bp.poukazy()
if chyba:
    raise SystemExit('V obchode chýbajú poukazy: ' + ', '.join(chyba))
V = sorted(V, key=lambda v: v['poradie'] or 99)
obrazky = {int(f[:2]): f for f in os.listdir(BOOQME) if f.endswith('.jpg') and f[:2].isdigit()}
for v in V:
    v['obrazok'] = obrazky.get(v['poradie'])
    if not v['obrazok']:
        raise SystemExit(f"chýba obrázok pre {v['nazov']} (poradie {v['poradie']}) v {BOOQME}")
zmien = sum(1 for v in V if v['cena_web'] != v['cena_obchod'])


def eur(x):
    return f'{x:g} €'.replace('.', ',')


sablona = [v['nazov'] for v in V if not any(r['nazov'] == v['nazov'] for r in salon)]
L = ['POUKAZY DO OBCHODU BOOQME (Salon 30 - Head Spa)', '',
     'Obrázky v priečinku POUKAZKY-DO-BOOQME. Číslo v názve súboru = poradie poukazu v obchode.',
     'Obrázky sú v pomere 4:3, aby obchod Booqme ukázal celú poukážku na mobile aj na počítači.']
if salon:
    L.append(f'{len(salon)} poukazov je v podobe HEAD SPA 30 od salónu, '
             f'{len(sablona)} podľa šablóny salónu' + (f" ({', '.join(sablona)})." if sablona else '.'))
L += ['', 'POSTUP',
      '1. V prehliadači sa prihláste na https://dashboard.booqme.app',
      '2. Otvorte darčekové poukážky: https://dashboard.booqme.app/gift-cards/types',
      '3. Pri každom poukaze kliknite na úpravu, vymeňte obrázok za súbor s rovnakým číslom,',
      '   prepíšte cenu podľa zoznamu nižšie a uložte.',
      '4. Nakoniec skontrolujte obchod: https://booqme.app/sk/eshop/salon-30-head-spa', '',
      'ZOZNAM (priamy odkaz na úpravu; ak nefunguje, vyberte poukaz v zozname podľa názvu)', '']
for v in V:
    cena = (f"{eur(v['cena_obchod'])} -> {eur(v['cena_web'])}" if v['cena_web'] != v['cena_obchod']
            else f"{eur(v['cena_web'])} (cena ostáva)")
    L += [f"{v['poradie']:02d}  Poukaz: {v['nazov']}", f'    cena: {cena}', f"    obrázok: {v['obrazok']}",
          f"    úprava: {v['uprava']}", '']
L.append('Ceny sú rovnaké ako v rezervačnom kalendári a na webe headspa30.sk.')
txt = '\r\n'.join(L) + '\r\n'

zcesta = os.path.join(out, 'headspa30-poukazky-booqme.zip')
with zipfile.ZipFile(zcesta, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('BOOQME-POUKAZY.txt', txt.encode('utf-8'))
    for v in V:
        z.write(os.path.join(BOOQME, v['obrazok']), 'POUKAZKY-DO-BOOQME/' + v['obrazok'])
print(f'{zcesta}  ({len(V)} obrázkov, cien na zmenu: {zmien})')

if '--stranka' in sys.argv:
    st = os.path.join(out, 'stranka')
    os.makedirs(os.path.join(st, 'img'), exist_ok=True)
    rows = []
    for v in V:
        shutil.copy(os.path.join(BOOQME, v['obrazok']), os.path.join(st, 'img', v['obrazok']))
        zmena = v['cena_web'] != v['cena_obchod']
        cena = (f'<span class="old">{eur(v["cena_obchod"]).replace(" ", "&nbsp;")}</span><span class="arr" aria-hidden="true">→</span>'
                f'<b>{eur(v["cena_web"]).replace(" ", "&nbsp;")}</b>' if zmena
                else f'<b>{eur(v["cena_web"]).replace(" ", "&nbsp;")}</b><span class="same">cena ostáva</span>')
        n = html.escape(v['nazov'])
        rows.append(f'''<li class="item{' chg' if zmena else ''}" id="p{v['id']}">
  <img src="img/{v['obrazok']}" width="1600" height="1200" alt="Poukážka {n}" loading="lazy">
  <div class="meta">
    <div class="no">{v['poradie']:02d}</div>
    <h2>{n}</h2>
    <div class="price">{cena}</div>
    <div class="file">Súbor: {v['obrazok']}</div>
    <div class="acts">
      <a class="btn" href="{v['uprava']}" target="_blank" rel="noopener">Otvoriť v Booqme</a>
      <label class="done"><input type="checkbox" id="h{v['id']}" data-id="{v['id']}"> Hotovo</label>
    </div>
  </div>
</li>''')
    uvod = f'{len(V)} darčekových poukazov'
    if salon:
        uvod += f': {len(salon)} v podobe HEAD SPA 30 od salónu, {len(sablona)} podľa šablóny salónu'
    uvod += f'. Pri {zmien} z nich sa mení aj cena, aby bola rovnaká ako v rezervačnom kalendári.' if zmien else '.'
    with open(os.path.join(TU, 'booqme-stranka', 'hlava.html'), encoding='utf-8') as fh:
        hlava = fh.read().replace('{{UVOD}}', html.escape(uvod))
    with open(os.path.join(TU, 'booqme-stranka', 'koniec.html'), encoding='utf-8') as fh:
        koniec = fh.read()
    with open(os.path.join(st, 'poukazy-do-booqme.html'), 'w', encoding='utf-8') as fh:
        fh.write(hlava + '\n'.join(rows) + '\n' + koniec)
    print(os.path.join(st, 'poukazy-do-booqme.html'))
