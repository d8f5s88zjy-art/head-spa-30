#!/usr/bin/env python3
"""Ručný prehľad konkurenčných reklám z Meta Ad Library a značené odkazy na vlastné reklamy.

Myšlienka z videa restructureai (TikTok, 2026-10-16): reklamy, ktoré konkurencia nechá bežať
dlho, sú signál, čo funguje. U nás bez agenta a bez sťahovania z Mety: Meta zakazuje
automatický zber údajov mimo svojich API (developers.facebook.com, Automated Data Collection).
Reklamy si človek pozrie v knižnici a zapíše do CSV; skript len spočíta dni a zhrnie.
Dĺžka behu je slabý signál, nie dôkaz zisku (malé podniky nechávajú bežať aj lacné
„propagované príspevky“). Výdavky konkurencie knižnica pri bežných reklamách neukazuje.

Príkazy (Python 3, len štandardná knižnica, nič neuverejňuje, nikam sa neprihlasuje):

  python3 -I reklamy_konkurencie.py odkazy "head spa" "barbershop Nitra" [--krajina SK] [--aj-neaktivne]
      vypíše adresy hľadania v Meta Ad Library (otvorí ich človek v prehliadači)

  python3 -I reklamy_konkurencie.py sablona > zaznam.csv
      prázdny záznam so stĺpcami

  python3 -I reklamy_konkurencie.py prehlad zaznam.csv [--k-datumu 2026-10-17] [--dlho 21]
      tabuľka v Markdowne: dni behu, čím reklama otvára, ponuka, výzva; počty podľa typu úvodu

  python3 -I reklamy_konkurencie.py utm https://www.headspa30.sk/ --kampan jesen-2026 --variant v1-pokoj
      odkaz s parametrami UTM pre vlastnú reklamu (aby sa dalo spárovať reklama -> návšteva webu)

Návratové kódy: 0 v poriadku, 1 chyba v údajoch, 2 zlé argumenty.
"""
import argparse
import csv
import datetime as dt
import io
import sys
import unicodedata
import urllib.parse

STLPCE = ['inzerent', 'odkaz_kniznice', 'zaciatok', 'koniec', 'aktivna', 'format',
          'vedie_s', 'uvod', 'ponuka', 'vyzva', 'poznamka']
TYPY_UVODU = ['cena', 'dokaz', 'naliehavost', 'zazitok', 'novinka', 'ine']
KNIZNICA = 'https://www.facebook.com/ads/library/'


def odkazy(args):
    for q in args.hladaj:
        param = {
            'active_status': 'all' if args.aj_neaktivne else 'active',
            'ad_type': 'all',
            'country': args.krajina,
            'media_type': 'all',
            'q': q,
            'search_type': 'keyword_unordered',
        }
        print(f'{q}\t{KNIZNICA}?{urllib.parse.urlencode(param, quote_via=urllib.parse.quote)}')
    return 0


def sablona(_args):
    w = csv.writer(sys.stdout, delimiter=';', lineterminator='\n')
    w.writerow(STLPCE)
    w.writerow(['(meno stránky inzerenta)', '(odkaz na reklamu v knižnici)', '2026-09-01', '',
                'ano', 'video|foto|karusel', '|'.join(TYPY_UVODU), '(prvá veta alebo text v obraze)',
                '(čo ponúka)', '(tlačidlo alebo výzva)', '(zapísané kým a kedy)'])
    return 0


def datum(text, pole, riadok):
    text = (text or '').strip()
    if not text:
        return None
    try:
        return dt.date.fromisoformat(text)
    except ValueError:
        raise ValueError(f'riadok {riadok}: {pole} „{text}“ nie je dátum RRRR-MM-DD')


def nacitaj(cesta):
    with open(cesta, encoding='utf-8-sig', newline='') as f:
        obsah = f.read()
    try:
        dialekt = csv.Sniffer().sniff(obsah.splitlines()[0], delimiters=';,\t')
    except (csv.Error, IndexError):
        class dialekt(csv.excel):
            delimiter = ';'
    citac = csv.DictReader(io.StringIO(obsah), dialect=dialekt)
    chyba = [s for s in ('inzerent', 'zaciatok') if s not in (citac.fieldnames or [])]
    if chyba:
        raise ValueError(f'chýbajú stĺpce: {", ".join(chyba)} (pozri príkaz sablona)')
    return list(citac)


def prehlad(args):
    try:
        k_datumu = dt.date.fromisoformat(args.k_datumu) if args.k_datumu else dt.date.today()
    except ValueError:
        print(f'--k-datumu „{args.k_datumu}“ nie je dátum RRRR-MM-DD', file=sys.stderr)
        return 2
    try:
        riadky = nacitaj(args.subor)
    except (OSError, ValueError) as e:
        print(f'chyba: {e}', file=sys.stderr)
        return 1
    zaznamy, chyby = [], []
    for i, r in enumerate(riadky, start=2):
        if (r.get('inzerent') or '').startswith('('):
            continue  # riadok s návodom zo šablóny
        try:
            zac = datum(r.get('zaciatok'), 'zaciatok', i)
            kon = datum(r.get('koniec'), 'koniec', i)
        except ValueError as e:
            chyby.append(str(e))
            continue
        if zac is None:
            chyby.append(f'riadok {i}: chýba zaciatok')
            continue
        aktivna = (r.get('aktivna') or '').strip().lower() in ('ano', 'áno', 'a', '1', 'true', 'yes')
        koniec = k_datumu if (aktivna or kon is None) else kon
        dni = (koniec - zac).days + 1
        if dni < 1:
            chyby.append(f'riadok {i}: koniec je pred začiatkom')
            continue
        typ = (r.get('vedie_s') or '').strip().lower() or 'neurčené'
        if typ not in TYPY_UVODU and typ != 'neurčené':
            chyby.append(f'riadok {i}: vedie_s „{typ}“ nie je z {"/".join(TYPY_UVODU)}')
            typ = 'ine'
        zaznamy.append({**r, 'dni': dni, 'aktivna_b': aktivna, 'typ': typ})
    for c in chyby:
        print(f'pozor: {c}', file=sys.stderr)
    if not zaznamy:
        print('žiadny platný záznam', file=sys.stderr)
        return 1

    zaznamy.sort(key=lambda z: -z['dni'])
    bunka = lambda t: (t or '').replace('|', '/').replace('\n', ' ').strip()
    print(f'# Konkurenčné reklamy k {k_datumu.isoformat()}\n')
    print(f'Záznamov: {len(zaznamy)}, aktívnych: {sum(z["aktivna_b"] for z in zaznamy)}. '
          f'„Dlho beží“ = aspoň {args.dlho} dní (slabý signál, nie dôkaz zisku).\n')
    print('| dni | stav | inzerent | formát | vedie s | úvod | ponuka | výzva |')
    print('| ---: | --- | --- | --- | --- | --- | --- | --- |')
    for z in zaznamy:
        stav = ('beží' if z['aktivna_b'] else 'skončila') + (', dlho' if z['dni'] >= args.dlho else '')
        print(f'| {z["dni"]} | {stav} | {bunka(z.get("inzerent"))} | {bunka(z.get("format"))} | {z["typ"]} '
              f'| {bunka(z.get("uvod"))} | {bunka(z.get("ponuka"))} | {bunka(z.get("vyzva"))} |')
    print('\n## Čím reklamy otvárajú\n')
    dlhe = [z for z in zaznamy if z['dni'] >= args.dlho]
    print('| typ úvodu | všetky | z nich dlho bežiace |')
    print('| --- | ---: | ---: |')
    typy = TYPY_UVODU + (['neurčené'] if any(z['typ'] == 'neurčené' for z in zaznamy) else [])
    for t in typy:
        print(f'| {t} | {sum(z["typ"] == t for z in zaznamy)} | {sum(z["typ"] == t for z in dlhe)} |')
    nepouzite = [t for t in TYPY_UVODU[:-1] if not any(z['typ'] == t for z in zaznamy)]
    if nepouzite:
        print(f'\nNikto neotvára: {", ".join(nepouzite)}. Je to hypotéza na test, nie záver.')
    if len(zaznamy) < 10:
        print(f'\nMálo záznamov ({len(zaznamy)}); počty berte len ako orientáciu.')
    return 1 if chyby else 0


def utm(args):
    casti = urllib.parse.urlsplit(args.adresa)
    if casti.scheme not in ('http', 'https') or not casti.netloc:
        print(f'„{args.adresa}“ nie je úplná adresa http(s)', file=sys.stderr)
        return 2
    def cisty(t):
        # bez diakritiky a medzier, aby sa hodnoty v prehľadoch nerozpadli na varianty
        t = unicodedata.normalize('NFKD', t.strip().lower().replace(' ', '-'))
        return ''.join(ch for ch in t if ch.isascii() and (ch.isalnum() or ch in '-_.'))
    nove = [('utm_source', cisty(args.zdroj)), ('utm_medium', cisty(args.medium)),
            ('utm_campaign', cisty(args.kampan)), ('utm_content', cisty(args.variant))]
    if any(not v for _, v in nove):
        print('kampaň, variant, zdroj a médium nesmú byť prázdne', file=sys.stderr)
        return 2
    povodne = [(k, v) for k, v in urllib.parse.parse_qsl(casti.query, keep_blank_values=True)
               if not k.startswith('utm_')]
    dotaz = urllib.parse.urlencode(povodne + nove)
    print(urllib.parse.urlunsplit((casti.scheme, casti.netloc, casti.path or '/', dotaz, casti.fragment)))
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    sp = p.add_subparsers(dest='prikaz', required=True)
    a = sp.add_parser('odkazy', help='adresy hľadania v Meta Ad Library')
    a.add_argument('hladaj', nargs='+')
    a.add_argument('--krajina', default='SK')
    a.add_argument('--aj-neaktivne', action='store_true')
    a.set_defaults(f=odkazy)
    b = sp.add_parser('sablona', help='prázdny záznam CSV')
    b.set_defaults(f=sablona)
    c = sp.add_parser('prehlad', help='prehľad zo záznamu CSV')
    c.add_argument('subor')
    c.add_argument('--k-datumu')
    c.add_argument('--dlho', type=int, default=21)
    c.set_defaults(f=prehlad)
    d = sp.add_parser('utm', help='odkaz s UTM pre vlastnú reklamu')
    d.add_argument('adresa')
    d.add_argument('--kampan', required=True)
    d.add_argument('--variant', required=True)
    d.add_argument('--zdroj', default='meta')
    d.add_argument('--medium', default='paid_social')
    d.set_defaults(f=utm)
    args = p.parse_args()
    sys.exit(args.f(args))


if __name__ == '__main__':
    main()
