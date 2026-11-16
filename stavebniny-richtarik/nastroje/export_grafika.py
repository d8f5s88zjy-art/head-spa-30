#!/usr/bin/env python3
"""Jednorazový prenos albumov Máriových grafík do data/galeria.json (16. 11. 2026): album „letaky“ (stránka Leták, časť
Letáky a bannery) a album „grafika“ (Galéria, Logo a firemná grafika). Súbory img/grafika/<id>-n.avif|webp (náhľad)
a <id>-v.webp (veľký) vyrába nastroje/grafika_maria.sh. Položka je ako fotka galérie; navyše môže mať „plati_pri“ –
údaje, ktoré má v obrázku (hodiny, telefón, e-mail, adresa): na webe je len dovtedy, kým platia (vykreslenie.udaje_platia).

Spustenie raz, v priečinku webu: python3 nastroje/export_grafika.py
Skript sa po prenose nepoužíva (albumy potom spravuje správa webu); ostáva ako záznam, odkiaľ sa dáta vzali.
"""
import json, os, struct, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CESTA = os.path.join(ROOT, 'data', 'galeria.json')


def rozmer(c):
    """Rozmer WebP (VP8, VP8L, VP8X) bez knižníc."""
    b = open(os.path.join(ROOT, c), 'rb').read(40)
    if b[12:16] == b'VP8 ': return struct.unpack('<HH', b[26:30])[0] & 0x3fff, struct.unpack('<HH', b[26:30])[1] & 0x3fff
    if b[12:16] == b'VP8L':
        n = struct.unpack('<I', b[21:25])[0]; return (n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1
    return int.from_bytes(b[24:27], 'little') + 1, int.from_bytes(b[27:30], 'little') + 1


def pol(i, popis, plati=None):
    w, h = rozmer(f'img/grafika/{i}-n.webp')
    d = {'id': i, 'popis': popis, 'velka': f'img/grafika/{i}-v.webp', 'src': f'img/grafika/{i}-n.webp', 'w': w, 'h': h,
         'webp': [[w, f'img/grafika/{i}-n.webp']], 'avif': [[w, f'img/grafika/{i}-n.avif']], 'viditelna': True, 'zdroj': 'web'}
    if plati: d['plati_pri'] = plati
    return d


LETAKY = {'id': 'letaky', 'nadpis': 'Letáky a bannery', 'fotky': [
    pol('letak-preco-nakupovat', 'Leták Prečo nakupovať u nás', ['hodiny']),
    pol('letak-stavebniny-richtarik', 'Leták so sortimentom predajne', ['ulica', 'pevna', 'mobil', 'email']),
    pol('banner-kompletne-systemy', 'Reklamný banner so sortimentom a značkami'),
    pol('banner-super-ceny', 'Široký reklamný banner so sortimentom')]}
GRAFIKA = {'id': 'grafika', 'nadpis': 'Logo a firemná grafika', 'fotky': [
    pol('logo-rs-vodorovne', 'Logo RS Richtárik stavebniny, vodorovné'),
    pol('logo-rs-pod-sebou', 'Logo RS Richtárik stavebniny, zvislé'),
    pol('logo-rs-cierna-doska', 'Logo RS Richtárik Stavebniny na čiernom podklade'),
    pol('tabula-siroka', 'Firemná tabuľa Richtárik Stavebniny'),
    pol('tabula-vysoka', 'Firemná tabuľa s adresou, kontaktom a otváracou dobou', ['ulica', 'psc', 'pevna', 'mobil', 'email', 'hodiny']),
    pol('vizitka', 'Vizitka Ing. Mário Richtárik – Stavebniny', ['majitel', 'ulica', 'psc', 'pevna', 'mobil', 'email']),
    pol('karta', 'Zákaznícka karta Stavebniny Richtárik', ['ulica', 'psc', 'pevna', 'mobil', 'email']),
    pol('alt-auto-zlte', 'Ilustrácia: nákladné auto s paletami tehál'),
    pol('alt-sypke-zmesi-ikona', 'Ilustrácia: robotník s lopatou a fúrikom'),
    pol('alt-okna-robotnik', 'Ilustrácia: robotník nesie okno'),
    pol('alt-rezivo-kruh', 'Ilustrácia: robotník reže drevo'),
    pol('alt-stresne-krytiny-stvorec', 'Ilustrácia: pokrývač kladie škridlu')]}

if __name__ == '__main__':
    g = json.load(open(CESTA, encoding='utf-8'))
    if any(a['id'] in ('letaky', 'grafika') for a in g['albumy']): sys.exit('data/galeria.json už albumy letaky a grafika má (spravuje ich správa webu)')
    g['albumy'] += [LETAKY, GRAFIKA]
    with open(CESTA, 'w', encoding='utf-8') as f: f.write(json.dumps(g, ensure_ascii=False, indent=2, sort_keys=True) + '\n')
    print('albumy grafiky:', len(LETAKY['fotky']), '+', len(GRAFIKA['fotky']))
