#!/usr/bin/env python3
"""Kniha schválení: majiteľ schvaľuje presný súbor, nie „ten Short“.

Myšlienka prevzatá z ECC (skill operator-approval-loop, MIT, Affaan Mustafa):
schválenie patrí k odtlačku sha256 presného textu. Keď sa súbor po schválení
zmení, schválenie preň neplatí. Tu bez databázy, len riadky JSON v jednom súbore.

Použitie (Python 3, bez balíkov):
  python3 -I schvalenie.py zapis --kniha schvalenia.jsonl --kto "majiteľ" \
      --ako "odpoveď v chate 17.10. 14:05" short-01.mp4 short-01-popis.txt
  python3 -I schvalenie.py over --kniha schvalenia.jsonl short-01.mp4 short-01-popis.txt
  python3 -I schvalenie.py zoznam --kniha schvalenia.jsonl

`zapis` spúšťa ten, kto od majiteľa dostal výslovné áno na presne tieto súbory.
`over` vráti kód 0 len vtedy, keď je každý súbor bajt po bajte schválený.
Skript nič neuverejňuje a nikam sa nepripája.
"""
import argparse
import datetime
import hashlib
import json
import os
import sys


def odtlacok(cesta):
    h = hashlib.sha256()
    with open(cesta, 'rb') as f:
        for kus in iter(lambda: f.read(1024 * 1024), b''):
            h.update(kus)
    return h.hexdigest()


def nacitaj(kniha):
    if not os.path.exists(kniha):
        return []
    zaznamy = []
    with open(kniha, encoding='utf-8') as f:
        for i, riadok in enumerate(f, 1):
            riadok = riadok.strip()
            if not riadok:
                continue
            try:
                zaznamy.append(json.loads(riadok))
            except json.JSONDecodeError:
                print(f'kniha {kniha}: riadok {i} nie je JSON, preskakujem', file=sys.stderr)
    return zaznamy


def zapis(a):
    if not a.kto.strip() or not a.ako.strip():
        sys.exit('chýba --kto alebo --ako (kto schválil a ako to vieme)')
    subory = []
    for cesta in a.subory:
        if not os.path.isfile(cesta):
            sys.exit(f'súbor neexistuje: {cesta}')
        subory.append({'subor': os.path.basename(cesta), 'sha256': odtlacok(cesta),
                       'bajty': os.path.getsize(cesta)})
    zaznam = {
        'cas': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
        'kto': a.kto.strip(),
        'ako': a.ako.strip(),
        'poznamka': (a.poznamka or '').strip(),
        'subory': subory,
    }
    with open(a.kniha, 'a', encoding='utf-8') as f:
        f.write(json.dumps(zaznam, ensure_ascii=False) + '\n')
    for s in subory:
        print(f"zapísané: {s['subor']}  sha256 {s['sha256'][:12]}  ({s['bajty']} B)")


def over(a):
    schvalene = {}
    for z in nacitaj(a.kniha):
        for s in z.get('subory', []):
            schvalene.setdefault(s.get('sha256'), (z, s))
    vsetko = True
    for cesta in a.subory:
        if not os.path.isfile(cesta):
            print(f'CHÝBA      {cesta}')
            vsetko = False
            continue
        h = odtlacok(cesta)
        if h in schvalene:
            z, s = schvalene[h]
            print(f"SCHVÁLENÉ  {cesta}  ({z['kto']}, {z['ako']}, {z['cas']}; pôvodne {s['subor']})")
        else:
            print(f'NESCHVÁLENÉ {cesta}  sha256 {h[:12]} nie je v knihe {a.kniha}')
            vsetko = False
    sys.exit(0 if vsetko else 1)


def zoznam(a):
    for z in nacitaj(a.kniha):
        mena = ', '.join(f"{s['subor']} ({s['sha256'][:12]})" for s in z.get('subory', []))
        print(f"{z['cas']}  {z['kto']}  [{z['ako']}]  {mena}")


def main():
    p = argparse.ArgumentParser(description='Kniha schválení podľa sha256 (len lokálne súbory).')
    sub = p.add_subparsers(dest='prikaz', required=True)
    pz = sub.add_parser('zapis', help='zapíše schválenie presne týchto súborov')
    pz.add_argument('--kniha', required=True)
    pz.add_argument('--kto', required=True, help='kto schválil (napr. majiteľ)')
    pz.add_argument('--ako', required=True, help='kde a kedy to povedal')
    pz.add_argument('--poznamka', default='')
    pz.add_argument('subory', nargs='+')
    pz.set_defaults(fn=zapis)
    po = sub.add_parser('over', help='overí, že súbory sú bajt po bajte schválené')
    po.add_argument('--kniha', required=True)
    po.add_argument('subory', nargs='+')
    po.set_defaults(fn=over)
    pl = sub.add_parser('zoznam', help='vypíše knihu')
    pl.add_argument('--kniha', required=True)
    pl.set_defaults(fn=zoznam)
    a = p.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
