#!/usr/bin/env python3
"""Profil balíka: úpravy HTML pri balení webu na hosting (volá ho nasadenie/balik.sh aj nastroje/sprava_import.py).

  python3 -I nasadenie/profil.py <priečinok> [adresa api asistenta]

Bez adresy: asistent je vypnutý – z každého HTML zmizne data-asistent="ukazka" a odkaz Ochrana údajov v päte
(data-asistent-odkaz). S adresou https://…/api.php: data-asistent dostane túto adresu. Ten istý profil musí dostať aj
výstup build.py pri porovnaní s hostingom (import zmien zo správy webu), inak by sa líšil len týmto atribútom.
"""
import os, re, sys

ODKAZ = re.compile(r'<a [^>]*data-asistent-odkaz[^>]*>[^<]*</a>')


def uprav(t, api=None):
    if api: return t.replace('data-asistent="ukazka"', f'data-asistent="{api}"')
    return ODKAZ.sub('', t.replace(' data-asistent="ukazka"', ''))


def uprav_priecinok(koren, api=None):
    n = 0
    for kor, dirs, subory in os.walk(koren):
        for f in subory:
            if not f.endswith('.html'): continue
            p = os.path.join(kor, f)
            t = open(p, encoding='utf-8').read()
            u = uprav(t, api)
            if u != t:
                open(p, 'w', encoding='utf-8').write(u); n += 1
    return n


if __name__ == '__main__':
    api = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    if api and not re.fullmatch(r'https://[^\s"<>]+/api\.php', api): sys.exit('CHYBA: adresa asistenta musí byť https://…/api.php')
    print('profil balíka:', 'asistent ' + api if api else 'asistent vypnutý', '–', uprav_priecinok(sys.argv[1], api), 'HTML upravených')
