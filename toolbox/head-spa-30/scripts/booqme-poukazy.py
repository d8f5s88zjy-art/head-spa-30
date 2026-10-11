"""Vypíše poukazy z verejného obchodu Booqme (bez prihlásenia) a porovná ich s ritualy.json.

Pre každý poukaz: číslo typu poukazu (gift card ID), názov, cenu v obchode, novú cenu z webu,
odkaz na jeho úpravu v administrácii a dátum nahratia obrázka (z názvu súboru obrázka).
Hodí sa na zoznam „čo treba v Booqme zmeniť“ a na kontrolu, či sa obrázky a ceny naozaj zmenili.
S prepínačom --json vypíše to isté ako JSON (vstup pre booqme-balik.py).

Použitie (z koreňa repozitára):
  python3 toolbox/head-spa-30/scripts/booqme-poukazy.py [--json]
"""
import datetime
import html
import json
import os
import re
import sys
import urllib.request

OBCHOD = 'https://booqme.app/sk/eshop/salon-30-head-spa'
KOREN = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))


def poukazy():
    req = urllib.request.Request(OBCHOD, headers={'User-Agent': 'Mozilla/5.0'})
    s = urllib.request.urlopen(req, timeout=60).read().decode('utf-8')
    obr = {int(i): int(t) for i, t in re.findall(r'gift_cards/[^"]*gift_card_(\d+)/\d+/(\d+)_', s)}
    with open(os.path.join(KOREN, 'docs', 'poukazky', 'sablona', 'ritualy.json'), encoding='utf-8') as fh:
        R = json.load(fh)
    web = {r['nazov']: r for r in R}
    vysledok = []
    for m in re.finditer(r'js-item_(\d+) js-eshopItem" data-product_name="Poukaz: ([^"]+)" data-product_price="([\d.]+)"', s):
        i, nazov, cena = int(m.group(1)), html.unescape(m.group(2)), float(m.group(3))
        r = web.get(nazov)
        t = obr.get(i)
        vysledok.append({
            'id': i, 'nazov': nazov, 'cena_obchod': cena,
            'cena_web': r['cena'] if r else None, 'poradie': r['poradie'] if r else None,
            'subor': r['subor'] if r else None,
            'obrazok_nahraty': datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime('%Y-%m-%d') if t else None,
            'uprava': f'https://dashboard.booqme.app/gift-cards/types/edit/{i}',
        })
    if not vysledok:
        raise SystemExit('V obchode Booqme som nenašiel žiadny poukaz. Zmenila sa stránka?')
    chyba = sorted(set(web) - {v['nazov'] for v in vysledok})
    return vysledok, chyba


if __name__ == '__main__':
    V, chyba = poukazy()
    if '--json' in sys.argv:
        print(json.dumps({'poukazy': V, 'chyba_v_obchode': chyba}, ensure_ascii=False, indent=1))
        sys.exit(0)
    zmeny = 0
    for v in V:
        if v['cena_web'] is None:
            pozn = 'nie je v ritualy.json'
        elif v['cena_web'] == v['cena_obchod']:
            pozn = 'ok'
        else:
            pozn = f"ZMENIŤ na {v['cena_web']} €"
            zmeny += 1
        print(f"{v['id']}  {v['nazov']:40s} {v['cena_obchod']:7.2f} €  {pozn:22s} obrázok z {v['obrazok_nahraty'] or '?'}  {v['uprava']}")
    for n in chyba:
        print(f'chýba v obchode: {n}')
    print(f'\npoukazov v obchode: {len(V)}, cien na zmenu: {zmeny}')
