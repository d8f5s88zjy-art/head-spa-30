"""Zostaví statický web VISIONARY LIVING z obsahu (source/obsah.json) a obrázkov (assets/img/obrazky.json).
Spustenie z priečinka visionary-living/: python3 source/zostav.py
Vznikne: index.html, o-projekte.html, byty.html, byt/<id>.html (12 stránok), financovanie.html, galeria.html,
kontakt.html, ochrana-sukromia.html, cookies.html, sitemap.xml, robots.txt.
Všetky texty sú z obsah.json (zdroje: docs/ZDROJE.md); nič sa tu nevymýšľa, len skladá.
Reč webu: projektová dokumentácia – každá stránka je list výkresu s názvom v rohu, fakty sú kóty a pečiatka,
byt sa vyberá na nakreslenej fasáde (dizajnový brief: docs/NAVRH.md).
"""
import html
import json
import os
import re

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
O = json.load(open(os.path.join(KOREN, 'source', 'obsah.json'), encoding='utf-8'))
IMG = json.load(open(os.path.join(KOREN, 'assets', 'img', 'obrazky.json'), encoding='utf-8'))
# DEPLOY STEP: základná adresa webu (canonical, og:url, sitemap). Pri vlastnej doméne nahraď jedným sed.
BASE = 'https://d8f5s88zjy-art.github.io/head-spa-30/visionary-living/'
STAV_DATUM = '13. 10. 2026'
NBSP = ' '
K = O['kontakt']
Z = O['znacka']
L = O['lokalita']
P = O['projekt']
F = O['financovanie']


def e(s):
    return html.escape(str(s), quote=True)


def typo(s):
    """Slovenská typografia: pevná medzera za jednopísmenovými predložkami a v číslach s jednotkami."""
    s = re.sub(r'(?<![\w&;])([vszkaouiVSZKAOUI]) (?=\S)', '\\1' + NBSP, s)
    s = re.sub(r'(\d) (\d{3})(?!\d)', '\\1' + NBSP + '\\2', s)
    s = re.sub(r'(\d) (km|ha|m²|€|%)', '\\1' + NBSP + '\\2', s)
    return s


def prva_veta(s, n=1):
    """Prvých n viet textu (pre skrátené výťahy na úvode)."""
    vety = re.split(r'(?<=[.!?]) ', s)
    return ' '.join(vety[:n])


def cena(n):
    return f'{int(n):,}'.replace(',', NBSP) + NBSP + '€'


def plocha(x):
    return f'{float(x):.2f}'.replace('.', ',') + NBSP + 'm²'


def srcsety(meno, base=''):
    t = IMG[meno]
    stupne = sorted(t['stupne'].items(), key=lambda kv: int(kv[0]))
    return (', '.join(f'{base}assets/img/{meno}-{w}.avif {w}w' for w, _ in stupne),
            ', '.join(f'{base}assets/img/{meno}-{w}.webp {w}w' for w, _ in stupne), stupne[-1][0], t)


def picture(meno, sizes, alt, cls='', loading='lazy', priority=False, base=''):
    avif, webp, big, t = srcsety(meno, base)
    attrs = f'alt="{e(alt)}" width="{t["w"]}" height="{t["h"]}" decoding="async"'
    attrs += ' fetchpriority="high"' if priority else f' loading="{loading}"'
    c = f' class="{cls}"' if cls else ''
    return (f'<picture{c}><source type="image/avif" srcset="{avif}" sizes="{sizes}">'
            f'<img src="{base}assets/img/{meno}-{big}.webp" srcset="{webp}" sizes="{sizes}" {attrs}></picture>')


def foto(meno, sizes, alt, popis=None, cls='', loading='lazy', priority=False, base='', lupa=None):
    """Fotografia v rohových značkách výkresu; s lupa=<skupina> je klikateľná (otvorí dialóg zväčšenia)."""
    obr = picture(meno, sizes, alt, loading=loading, priority=priority, base=base)
    if lupa:
        _, _, big, t = srcsety(meno, base)
        obr = (f'<button type="button" class="lupa" data-galeria="{lupa}" data-src="{base}assets/img/{meno}-{big}.webp" '
               f'data-w="{t["stupne"][str(big)]["w"]}" data-h="{t["stupne"][str(big)]["h"]}" aria-label="Zväčšiť: {e(popis or alt)}">{obr}</button>')
    cap = f'<figcaption>{typo(popis)}</figcaption>' if popis else ''
    return f'<figure class="foto{" " + cls if cls else ""}">{obr}{cap}</figure>'


# ---------- spoločné časti ----------
MENU = [('index.html', 'Úvod'), ('o-projekte.html', 'O projekte'), ('byty.html', 'Byty'), ('financovanie.html', 'Financovanie'), ('galeria.html', 'Galéria'), ('kontakt.html', 'Kontakt')]
TEL_IKONA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3h3l1.6 4.2-2 1.4a12 12 0 0 0 6.2 6.2l1.4-2L21 14.4v3A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'


def lista(base, aktivna):
    odkazy = ''.join(f'<li><a href="{base}{h}"{" aria-current=" + chr(34) + "page" + chr(34) if h == aktivna else ""}>{t}</a></li>' for h, t in MENU)
    return f'''<header class="lista" data-menu="zatvorene">
  <div class="lista-vnutro">
    <a class="znacka" href="{base}index.html" aria-label="Visionary Living, úvodná stránka"><span class="znacka-roh" aria-hidden="true"></span><span class="znacka-text">Visionary Living</span><span class="znacka-roh znacka-roh-p" aria-hidden="true"></span></a>
    <nav class="menu" id="menu" aria-label="Hlavné menu">
      <ul>{odkazy}</ul>
      <div class="menu-kontakt"><a href="tel:{K['telefon_tel']}">{K['telefon']}</a><a href="mailto:{K['email']}">{K['email']}</a></div>
    </nav>
    <a class="tlacidlo tlacidlo-obrys lista-telefon" href="tel:{K['telefon_tel']}">{TEL_IKONA}<span class="visually-hidden">Zavolať </span><span class="lista-telefon-text">{K['telefon']}</span></a>
    <button class="menu-prepinac" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-ciary" aria-hidden="true"></span><span class="menu-prepinac-text">Menu</span></button>
  </div>
</header>'''


def paticka(base):
    return f'''<footer class="paticka">
  <div class="paticka-mriezka">
    <div><p class="paticka-znacka">Visionary Living</p><p>{Z['slogan']}</p></div>
    <div><p class="paticka-nadpis">Kontakt</p><p><a href="tel:{K['telefon_tel']}">{K['telefon']}</a><br><a href="mailto:{K['email']}">{K['email']}</a></p></div>
    <div><p class="paticka-nadpis">Sledujte nás</p><p><a href="{K['facebook']}" rel="noopener" target="_blank">Facebook</a><br><a href="{K['instagram']}" rel="noopener" target="_blank">Instagram</a></p></div>
    <div><p class="paticka-nadpis">{Z['prevadzkovatel']}</p><p><a href="{base}ochrana-sukromia.html">Zásady ochrany osobných údajov</a><br><a href="{base}cookies.html">Cookies</a></p></div>
  </div>
  <p class="paticka-stav">Ceny a{NBSP}dostupnosť bytov podľa stavu ponuky k{NBSP}{STAV_DATUM.replace(' ', NBSP)}.</p>
</footer>'''


def stranka(base, aktivna, titul, popis, list_nazov, telo, jsonld=None, trieda='', og_img='exterier-01-1024.webp', preload_img=None):
    url = BASE + (aktivna if aktivna != 'index.html' else '')
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ''
    pre = ''
    if preload_img:
        avif, _, _, _ = srcsety(preload_img[0], base)
        pre = f'<link rel="preload" as="image" type="image/avif" imagesrcset="{avif}" imagesizes="{preload_img[1]}">\n  '
    return f'''<!doctype html>
<html lang="sk" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(titul)}</title>
  <meta name="description" content="{e(popis)}">
  <!-- návrh nového webu: pred spustením na visionaryliving.sk riadok robots odstrániť -->
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website"><meta property="og:locale" content="sk_SK"><meta property="og:site_name" content="Visionary Living">
  <meta property="og:title" content="{e(titul)}"><meta property="og:description" content="{e(popis)}"><meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}assets/img/{og_img}">
  <meta name="theme-color" content="#f5f6f3">
  <meta name="format-detection" content="telephone=no">
  <link rel="icon" href="{base}assets/img/ikona-32.png" sizes="32x32"><link rel="apple-touch-icon" href="{base}assets/img/ikona-180.png">
  <link rel="preload" href="{base}assets/fonts/nadpisy-700-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{base}assets/fonts/text-latin.woff2" as="font" type="font/woff2" crossorigin>
  {pre}<script>document.documentElement.classList.replace('no-js','js');</script>
  <link rel="stylesheet" href="{base}assets/style.css">
  {ld}
</head>
<body class="{trieda}">
  <a class="preskocit" href="#obsah">Preskočiť na obsah</a>
{lista(base, aktivna)}
<main id="obsah">
<div class="list">
  <p class="list-nazov" aria-hidden="true">{list_nazov}</p>
{telo}
</div>
</main>
{paticka(base)}
<script type="module" src="{base}assets/site.js"></script>
</body>
</html>
'''


# ---------- údaje o bytoch ----------
BYTY = O['byty']
TYPY = O['typy']


def byt_info(b):
    t = TYPY[b['typ']]
    return {**b, 'nazov': t['nazov'], 'cena': int(t['cena']), 'plocha': float(t['plocha']), 'miestnosti': t['miestnosti'], 'izby': int(b['typ']),
            'podlazie_text': f'{b["podlazie"]}. podlažie', 'url': f'byt/{b["id"].lower()}.html', 'stav_kod': 'volny' if b['stav'] == 'voľný' else 'iny'}


INFO = [byt_info(b) for b in BYTY]
PODLAZIA = {p: [b for b in INFO if b['podlazie'] == p] for p in (1, 2, 3)}
PRVY = INFO[0]


def stav_html(b, s_datumom=False):
    d = f'<small> k{NBSP}{STAV_DATUM.replace(" ", NBSP)}</small>' if s_datumom else ''
    return f'<span class="stav stav-{b["stav_kod"]}">{b["stav"]}{d}</span>'


def byt_popisok(b):
    return f'Byt {b["id"]}, {b["nazov"].lower()}, {b["podlazie_text"]}, {b["stav"]}, {cena(b["cena"])}'


def fasada(base, rezim='plny', aktualny=None):
    """Nakreslený pohľad na fasádu: 3 podlažia × 4 byty, šírky buniek úmerné plochám (196/304/304/196).
    rezim 'plny'/'kratky': bunky sú tlačidlá (výber do panelu); 'mini': bunky sú odkazy na detail, aktuálny byt zvýraznený."""
    podlazia = ''
    for p in (3, 2, 1):
        bunky = ''
        for i, b in enumerate(PODLAZIA[p]):
            okna = ('<i class="loggia"></i><i class="okno"></i>' if b['izby'] == 2 else '<i class="okno"></i><i class="loggia"></i><i class="okno"></i>')
            spolocne = f'class="byt typ-{b["typ"]}{" je-on" if rezim == "mini" and aktualny == b["id"] else ""}" data-id="{b["id"]}" data-typ="{b["typ"]}" data-podlazie="{p}" data-stav="{b["stav"]}" style="--i:{i}"'
            vnutro = f'<span class="byt-id">{b["id"]}</span><span class="okna" aria-hidden="true">{okna}</span>'
            if rezim == 'mini':
                cur = ' aria-current="page"' if aktualny == b['id'] else ''
                bunky += f'<a {spolocne} href="{base}{b["url"]}"{cur} aria-label="{byt_popisok(b)}">{vnutro}</a>'
            else:
                bunky += f'<button type="button" {spolocne} aria-pressed="false" aria-label="{byt_popisok(b)}">{vnutro}</button>'
        vchod = '<span class="vchod" aria-hidden="true"></span>' if p == 1 else ''
        podlazia += f'<div class="podlazie" data-podlazie="{p}" style="--p:{3 - p}">{bunky}{vchod}</div>'
    kresli = '' if rezim == 'mini' else ' data-kresli'
    kota = ''.join(f'<span>{plocha(b["plocha"])}</span>' for b in PODLAZIA[1])
    popis = '' if rezim == 'mini' else f'<p class="fasada-popis">Dve dispozične rovnaké bytovky, 3{NBSP}nadzemné podlažia, 4{NBSP}byty na podlaží. Schéma, poradie bytov podľa pôdorysov.</p>'
    return f'''<div class="fasada fasada-{rezim}"{kresli} role="group" aria-label="Fasáda bytovky: 3 podlažia, 4 byty na podlaží">
      <div class="fasada-obrys" aria-hidden="true"></div>
      <div class="fasada-popisy" aria-hidden="true"><span>3.<em> podlažie</em></span><span>2.<em> podlažie</em></span><span>1.<em> podlažie</em></span></div>
      <div class="fasada-kresba">
        <div class="strecha" aria-hidden="true"></div>
        {podlazia}
        <div class="teren" aria-hidden="true"></div>
      </div>
      <div class="fasada-kota" aria-hidden="true">{kota}</div>
      {popis}
    </div>'''


def panel_plan(b, base, cls='panel-plan'):
    return foto('byt-' + b['podorys'], '(max-width: 1023px) 92vw, 380px', f'Výrez z pôdorysu podlažia, byt {b["id"]} vyznačený',
                f'Výrez z{NBSP}pôdorysu podlažia, byt {b["id"]} vyznačený.', cls=cls, base=base)


def panel(base):
    b = PRVY
    miest = ''.join(f'<li><span>{m[0]}</span><span>{plocha(m[1])}</span></li>' for m in b['miestnosti'])
    return f'''<aside class="panel" aria-label="Zvolený byt">
      <p class="visually-hidden panel-live" aria-live="polite"></p>
      <div class="panel-vnutro">
        <p class="panel-hlava"><a class="panel-byt" href="{base}{b['url']}">Byt {b['id']}</a>{stav_html(b)}</p>
        <p class="panel-typ">{b['nazov']}, {b['podlazie_text']}</p>
        <p class="panel-cena"><strong>{cena(b['cena'])}</strong><span>{plocha(b['plocha'])} vrátane loggie</span></p>
        {panel_plan(b, base)}
        <ol class="panel-miestnosti" aria-label="Miestnosti">{miest}</ol>
        <p class="panel-spolu"><span>Spolu</span><span>{plocha(b['plocha'])} vrátane loggie</span></p>
        <div class="panel-akcie"><a class="tlacidlo panel-detail" href="{base}{b['url']}">Detail bytu {b['id']}</a><a class="tlacidlo tlacidlo-obrys panel-zaujem" href="{base}kontakt.html?byt={b['id']}">Mám záujem</a></div>
      </div>
    </aside>'''


def tabulka_bytov(base):
    riadky = ''
    for b in INFO:
        riadky += (f'<tr data-id="{b["id"]}" data-typ="{b["typ"]}" data-podlazie="{b["podlazie"]}"><th scope="row" data-label="Byt">{b["id"]}</th>'
                   f'<td data-label="Podlažie">{b["podlazie"]}.</td><td data-label="Typ">{b["nazov"]}</td><td data-label="Plocha">{plocha(b["plocha"])}</td>'
                   f'<td data-label="Cena">{cena(b["cena"])}</td><td data-label="Stav">{stav_html(b)}</td><td class="tabulka-detail"><a href="{base}{b["url"]}">Detail<span class="visually-hidden"> bytu {b["id"]}</span></a></td></tr>')
    return f'''<table class="tabulka-bytov">
      <caption class="visually-hidden">Zoznam 12 bytov s podlažím, typom, plochou, cenou a stavom</caption>
      <thead><tr><th scope="col">Byt</th><th scope="col">Podlažie</th><th scope="col">Typ</th><th scope="col">Plocha</th><th scope="col">Cena</th><th scope="col">Stav</th><th scope="col"><span class="visually-hidden">Odkaz</span></th></tr></thead>
      <tbody>{riadky}</tbody>
    </table>'''


def vyber_bytov(base, rezim='plny'):
    data = {}
    for b in INFO:
        avif, webp, big, t = srcsety('byt-' + b['podorys'], base)
        data[b['id']] = {'typ': b['typ'], 'podlazie': b['podlazie'], 'nazov': b['nazov'], 'cena': b['cena'], 'plocha': b['plocha'], 'stav': b['stav'],
                         'url': base + b['url'], 'miestnosti': b['miestnosti'],
                         'obr': {'avif': avif, 'webp': webp, 'src': f'{base}assets/img/byt-{b["podorys"]}-{big}.webp', 'w': t['w'], 'h': t['h']}}
    t2, t3 = TYPY['2'], TYPY['3']
    filtre = (f'<button type="button" role="radio" aria-checked="true" data-filter="vsetky">Všetky<span>3{NBSP}podlažia</span></button>'
              f'<button type="button" role="radio" aria-checked="false" data-filter="t2">Dvojizbové<span>{cena(t2["cena"])}, {plocha(t2["plocha"])}</span></button>'
              f'<button type="button" role="radio" aria-checked="false" data-filter="t3">Trojizbové<span>{cena(t3["cena"])}, {plocha(t3["plocha"])}</span></button>')
    hlava = ('<h2 id="vyber-nadpis" class="visually-hidden">Výber bytu</h2>' if rezim == 'plny'
             else f'<div class="sekcia-hlava"><h2 id="vyber-nadpis">Byty</h2><p>Vyberte si byt priamo na fasáde. {typo(prva_veta(P["charakteristika_bytov"]))}</p></div>')
    tab = f'<div class="tabulka-obal">{tabulka_bytov(base)}</div>' if rezim == 'plny' else f'<p class="sekcia-odkaz"><a class="odkaz" href="{base}byty.html">Všetky byty a{NBSP}pôdorysy</a></p>'
    return f'''<section class="vyber" id="byty" aria-labelledby="vyber-nadpis">
  <script type="application/json" id="byty-data">{json.dumps(data, ensure_ascii=False)}</script>
  {hlava}
  <div class="filter" role="radiogroup" aria-label="Typ bytu">{filtre}<p class="filter-pocet" role="status">12 bytov</p></div>
  <div class="vyber-telo">
    {fasada(base, rezim)}
    {panel(base)}
  </div>
  {tab}
</section>'''


# ---------- komponenty ----------
def kota_vzdialenosti(cls='', kresli=False):
    """Kóta vzdialeností z Černíka v mierke (0 až 23 km); popisy v dvoch úrovniach, aby sa Podhájska a Vráble neprekrývali.
    SVG je dekorácia, prístupný text je zoznam (na telefóne viditeľný, inak visually-hidden)."""
    vz = L['vzdialenosti']
    maxkm = max(km for _, km in vz)
    X0, X1 = 24, 576
    x = lambda km: X0 + km / maxkm * (X1 - X0)
    hore = {'Šurany', 'Vráble'}
    znacky = f'<g class="kota-znacka" style="--i:0"><line x1="{X0}" y1="60" x2="{X0}" y2="36"/><text x="{X0}" y="26" text-anchor="start">Černík</text></g>'
    for i, (mesto, km) in enumerate(sorted(vz, key=lambda m: m[1])):
        xx = x(km); h = mesto in hore
        anchor = 'end' if km == maxkm else 'middle'
        znacky += (f'<g class="kota-znacka" style="--i:{i + 1}"><line x1="{xx:.1f}" y1="60" x2="{xx:.1f}" y2="{36 if h else 84}"/>'
                   f'<text x="{xx:.1f}" y="{26 if h else 102}" text-anchor="{anchor}">{mesto} {km}{NBSP}km</text></g>')
    zoznam = ''.join(f'<li><strong>{km}{NBSP}km</strong><span>{mesto}</span></li>' for mesto, km in vz)
    return f'''<div class="kota{" " + cls if cls else ""}"{" data-kresli" if kresli else ""}>
      <svg class="kota-svg" viewBox="0 0 600 112" aria-hidden="true" focusable="false">
        <line class="kota-os" x1="{X0}" y1="60" x2="{X1}" y2="60"/>
        {znacky}
      </svg>
      <ul class="kota-zoznam" aria-label="Vzdialenosti z Černíka">{zoznam}</ul>
    </div>'''


def peciatka():
    t2, t3 = TYPY['2'], TYPY['3']
    h = P['harmonogram']
    polia = [('Projekt', Z['nazov'], Z['slogan']), ('Obec', L['obec'], f'okres {L["okres"]}'),
             ('Objekt', 'Dve dispozične rovnaké bytovky', f'3{NBSP}nadzemné podlažia'), ('Byty', f'12{NBSP}bytov', 'dvojizbové a trojizbové'),
             (t2['nazov'], cena(t2['cena']), f'{plocha(t2["plocha"])} vrátane loggie'), (t3['nazov'], cena(t3['cena']), f'{plocha(t3["plocha"])} vrátane loggie'),
             (h[0][1], h[0][0], ''), (h[1][1], h[1][0], '')]
    bunky = ''.join(f'<div><dt>{a}</dt><dd><strong>{b}</strong>{"<span>" + c + "</span>" if c else ""}</dd></div>' for a, b, c in polia)
    # Termín „Jar 2026“ je podľa zdroja (visionaryliving.sk, stav 13. 10. 2026); je už minulosťou – klient má údaj aktualizovať (docs/ZDROJE.md).
    return f'<dl class="peciatka" aria-label="Údaje o projekte">{bunky}</dl>'


def galeria_mriezka(base, polozky, skupina, lazy_od=2):
    pol = ''
    for i, (m, popis) in enumerate(polozky):
        t = IMG[m]
        na_vysku = ' na-vysku' if t['h'] > t['w'] else ''
        pol += f'<li class="galeria-polozka{na_vysku}">{foto(m, "(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 400px", popis, popis, base=base, lupa=skupina, loading="eager" if i < lazy_od else "lazy")}</li>'
    return f'<ul class="galeria-mriezka">{pol}</ul>'


EXT = [('exterier-01', 'Vizualizácia bytovky s loggiami a zeleňou'), ('exterier-02', 'Vizualizácia vstupu do bytovky a lúky s kvetmi'), ('exterier-03', 'Vizualizácia chodníka medzi bytovkami'),
       ('exterier-04', 'Vizualizácia parkovania pri bytovke'), ('exterier-05', 'Vizualizácia dvora so zeleňou'), ('dron', 'Vizualizácia dvoch bytoviek zo vzduchu'),
       ('dron-dvor', 'Vizualizácia dvora medzi bytovkami zo vzduchu'), ('uvod-loggia', 'Vizualizácia loggie s výhľadom do dvora')]
INT2 = [('interier-obyvacka-1', 'Obývacia izba s pohovkou'), ('interier-obyvacka-2', 'Obývacia izba s televízorom'), ('interier-kuchyna', 'Kuchyňa s jedálenským stolom'), ('interier-spalna-1', 'Spálňa'),
        ('interier-kupelna-1', 'Kúpeľňa'), ('interier-chodba', 'Vstupná chodba'), ('interier-jedalen', 'Jedálenský kút')]
INT3 = [('interier-sedacka-1', 'Obývacia izba so zelenou pohovkou'), ('interier-sedacka-2', 'Obývacia izba s výhľadom na loggiu'), ('interier-kuchyna-2', 'Kuchyňa s jedálenským stolom'),
        ('interier-detska', 'Detská izba'), ('interier-vstup', 'Vstupná chodba so šatníkom'), ('interier-kupelna-2', 'Kúpeľňa s vaňou'), ('interier-spalna-2', 'Spálňa')]


def kontakt_blok(base, text, nadpis='Kontakt'):
    return f'''<section class="kontakt-blok" aria-labelledby="kb-nadpis">
  <h2 id="kb-nadpis">{nadpis}</h2>
  <p class="kontakt-velky"><a href="tel:{K['telefon_tel']}">{K['telefon']}</a><a href="mailto:{K['email']}">{K['email']}</a></p>
  <p class="kontakt-text">{typo(text)}</p>
  <p class="akcie"><a class="tlacidlo" href="{base}kontakt.html">Napísať správu</a></p>
</section>'''


def cesta(base, rezim, kroky, odkaz=True, nadpis='Ako prebieha kúpa', uroven='h3'):
    """Cesta kúpy: 'kratka' (vodorovná kóta, úvod), 'plna' (Financovanie: zvislá čiara odvíjaná skrolom + krokomer), 'zvisla' (detail bytu)."""
    polozky = ''
    for i, k in enumerate(kroky):
        suma = f'<p class="krok-suma">{typo(k["suma"])}</p>' if k.get('suma') else ''
        polozky += (f'<li class="krok" data-krok="{i + 1}" data-nazov="{e(k["nazov"])}" style="--i:{i}"><span class="krok-uzol" aria-hidden="true"></span>'
                    f'<{uroven}><span class="krok-cislo" aria-hidden="true">{i + 1}</span><span class="visually-hidden">Krok {i + 1}: </span>{k["nazov"]}</{uroven}>{suma}<p>{typo(k["text"])}</p></li>')
    krokomer = ''
    if rezim == 'plna':
        krokomer = (f'<div class="krokomer" aria-hidden="true"><p><strong class="krokomer-cislo">1</strong><span class="krokomer-nazov">{kroky[0]["nazov"]}</span>'
                    f'<span class="krokomer-z">krok 1 z{NBSP}{len(kroky)}</span></p></div>')
    ciara = '<div class="cesta-ciara" aria-hidden="true"><i></i></div>'
    odk = f'<p class="sekcia-odkaz"><a class="odkaz" href="{base}financovanie.html">Celý splátkový plán</a></p>' if odkaz else ''
    hl = f'<div class="sekcia-hlava"><h2 id="cesta-nadpis">{nadpis}</h2></div>' if nadpis else ''
    return f'''<section class="cesta cesta-{rezim}" aria-labelledby="cesta-nadpis">
  {hl}
  <div class="cesta-telo">{krokomer}<ol class="kroky" data-kresli>{ciara}{polozky}</ol></div>
  {odk}
</section>'''


# ---------- úvod ----------
def titul(base):
    U = O['uvod']
    return f'''<section class="titul" aria-labelledby="uvod-nadpis">
  <div class="titul-text">
    <h1 id="uvod-nadpis"><span class="riadok"><span>Moderné bývanie</span></span> <span class="riadok"><span>uprostred prírody –</span></span> <span class="riadok"><span>Černík</span></span></h1>
    <p class="titul-podtitul">{typo(U['podtitul'])}</p>
    <div class="akcie"><a class="tlacidlo" href="{base}byty.html">Vybrať byt</a><a class="tlacidlo tlacidlo-obrys" href="tel:{K['telefon_tel']}">Zavolať {K['telefon']}</a></div>
  </div>
  <div class="titul-obraz">
    {foto('exterier-01', '(max-width: 899px) 92vw, 46vw', EXT[0][1], cls='titul-foto', priority=True, base=base)}
    {kota_vzdialenosti('kota-titul')}
  </div>
  {peciatka()}
</section>'''


def situacia(base):
    cisla = ''.join(f'<li><strong>{c[0].replace(" ", NBSP)}{NBSP}ha</strong><span>{c[1].replace("ha ", "")}</span></li>' for c in L['cisla'])
    vzd = ', '.join(f'{m} {km}{NBSP}km' for m, km in L['vzdialenosti'])
    return f'''<section class="situacia" aria-labelledby="sit-nadpis">
  <div class="situacia-mriezka">
    {foto('dron', '(max-width: 899px) 92vw, 46vw', EXT[5][1], EXT[5][1], base=base)}
    <div class="situacia-text">
      <h2 id="sit-nadpis">Lokalita</h2>
      <p>{typo(L['uvod'])}</p>
      <ul class="koty-obce" aria-label="Čísla o obci">{cisla}</ul>
      <p class="situacia-vzdialenosti">Vzdialenosti z{NBSP}Černíka: {vzd}.</p>
      <p><a class="odkaz" href="{base}o-projekte.html#lokalita">Viac o{NBSP}lokalite</a></p>
    </div>
  </div>
  {foto('exterier-02', '(max-width: 1399px) 96vw, 1300px', EXT[1][1], P['body'][1], cls='foto-sirka', base=base)}
</section>'''


def piliere(base):
    pol = ''.join(f'<li><h3>{p["nazov"]}</h3><p>{typo(p["text"])}</p></li>' for p in O['uvod']['piliere'])
    return f'''<section class="piliere" aria-labelledby="piliere-nadpis">
  <h2 id="piliere-nadpis" class="visually-hidden">Prečo Visionary Living</h2>
  <p class="piliere-uvod">{typo(O['uvod']['preco_kratko'])}</p>
  <ul class="piliere-zoznam">{pol}</ul>
  <p class="piliere-zaver">{typo(O['uvod']['o_projekte_kratko'])}</p>
</section>'''


def index():
    base = ''
    kroky = [{'nazov': 'Vyberte si byt', 'suma': '', 'text': f'Dvojizbový alebo trojizbový byt, všetky s{NBSP}loggiou a{NBSP}vlastným parkovacím miestom v{NBSP}cene.'},
             {'nazov': F['kroky'][0]['nazov'], 'suma': F['kroky'][0]['suma'], 'text': prva_veta(F['kroky'][0]['text'])},
             {'nazov': F['kroky'][1]['nazov'], 'suma': F['kroky'][1]['suma'], 'text': prva_veta(F['kroky'][1]['text'])}]
    telo = '\n'.join([titul(base), vyber_bytov(base, 'kratky'), situacia(base), piliere(base), cesta(base, 'kratka', kroky),
                      kontakt_blok(base, 'Máte otázku k bytu alebo chcete termín obhliadky? Zavolajte, alebo napíšte.')])
    ld = [LD_FIRMA, {'@context': 'https://schema.org', '@type': 'ApartmentComplex', 'name': 'Visionary Living Černík', 'url': BASE,
          'address': {'@type': 'PostalAddress', 'addressLocality': 'Černík', 'addressRegion': 'Nitriansky kraj', 'addressCountry': 'SK'}, 'numberOfAccommodationUnits': 12}]
    return stranka(base, 'index.html', 'Visionary Living – moderné bývanie uprostred prírody, Černík', O['uvod']['podtitul'], 'List 1 – Titulný list', telo, ld, 'je-uvodna',
                   preload_img=('exterier-01', '(max-width: 899px) 92vw, 46vw'))


# ---------- O projekte ----------
IKONY = {
    'dom': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 22 24 8l16 14M12 20v18h24V20M20 38V28h8v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 14h4v6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    'okno': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 10h28v28H10zM24 10v28M10 24h28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 14h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    'cerpadlo': '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="14" width="32" height="22" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="24" cy="25" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M24 18v14M17 25h14M12 36v4M36 36v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 8h4M22 8h4M30 8h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'ihrisko': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40h32M12 40V18l12-8 12 8v22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M18 40V30h12v10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="38" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M38 17v9" stroke="currentColor" stroke-width="1.5"/></svg>',
    'auto': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30v-6l4-10h24l4 10v6M8 30h32M8 30v4h6v-4M34 30v4h6v-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="15" cy="27" r="2" fill="currentColor"/><circle cx="33" cy="27" r="2" fill="currentColor"/></svg>',
}


def ikona_vyhody(nazov):
    n = nazov.lower()
    return IKONY['cerpadlo' if 'náklad' in n else 'auto' if 'parkov' in n else 'ihrisko' if 'komunit' in n else 'okno']


def o_projekte():
    base = ''
    body = ''.join(f'<li>{typo(b)}</li>' for b in P['body'])
    dom = ''.join(f'<tr><th scope="row">{r[0]}</th><td>{typo(r[1])}</td></tr>' for r in P['charakteristika_domu'])
    vyhody = ''.join(f'<li><span class="schema" aria-hidden="true">{ikona_vyhody(v["nazov"])}</span><h3>{v["nazov"]}</h3><p>{typo(v["text"])}</p></li>' for v in P['vyhody'])
    harm = ''.join(f'<li style="--i:{i}"><span class="os-znacka" aria-hidden="true"></span><strong>{h[0]}</strong><span>{h[1]}</span></li>' for i, h in enumerate(P['harmonogram']))
    preco = ''.join(f'<div><dt>{p[0]}</dt><dd>{typo(p[1])}</dd></div>' for p in L['preco'])
    lok_foto = [('exterier-02', EXT[1][1]), ('exterier-04', EXT[3][1]), ('exterier-05', EXT[4][1]), ('dron-dvor', EXT[6][1])]
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis">
  <h1 id="pu-nadpis">{typo(P['nadpis'])}</h1>
  <p class="list-perex">{typo(P['popis'])}</p>
  <ul class="body">{body}</ul>
</section>
<section class="charakteristika" aria-label="Charakteristika">
  <div class="charakteristika-mriezka">
    <div><h2>Charakteristika bytov</h2><p>{typo(P['charakteristika_bytov'])}</p></div>
    <div><h2>Charakteristika bytového domu</h2><table class="tabulka-udaje"><tbody>{dom}</tbody></table></div>
  </div>
</section>
{foto('exterier-03', '(max-width: 1399px) 96vw, 1300px', EXT[2][1], EXT[2][1], cls='foto-sirka', base=base, loading='lazy')}
<section class="vyhody" aria-labelledby="vyh-nadpis">
  <h2 id="vyh-nadpis">Výhody</h2>
  <ul class="vyhody-zoznam">{vyhody}</ul>
</section>
<section class="harmonogram" aria-labelledby="har-nadpis">
  <h2 id="har-nadpis">Harmonogram výstavby</h2>
  <!-- Termíny sú podľa zdroja (visionaryliving.sk, stav 13. 10. 2026); „Jar 2026“ je už minulosťou, klient má údaj aktualizovať. -->
  <ol class="casova-os" data-kresli>{harm}</ol>
</section>
<section class="lokalita" id="lokalita" aria-labelledby="lok-nadpis">
  <h2 id="lok-nadpis">Lokalita</h2>
  <div class="lokalita-mriezka">
    <div class="lokalita-text"><p>{typo(L['uvod'])}</p><p>{typo(L['popis'])}</p><p>{typo(L['priroda'])}</p><p>{typo(L['investicia'])}</p></div>
    <div class="lokalita-bok">{kota_vzdialenosti('kota-lokalita', kresli=True)}<p class="susedia">Susedné obce: {', '.join(L['susedia'])}.</p></div>
  </div>
  {galeria_mriezka(base, lok_foto, 'lokalita', lazy_od=0)}
</section>
<section class="preco" aria-labelledby="preco-nadpis">
  <h2 id="preco-nadpis">Prečo Černík</h2>
  <dl class="legenda">{preco}</dl>
</section>
<p class="akcie akcie-zaver"><a class="tlacidlo" href="{base}byty.html">Vybrať byt</a><a class="tlacidlo tlacidlo-obrys" href="{base}financovanie.html">Financovanie</a></p>'''
    return stranka(base, 'o-projekte.html', 'O projekte – Visionary Living, Černík', P['popis'], 'List 2 – Technická správa', telo, LD_FIRMA, 'je-podstranka', 'exterier-03-1024.webp')


# ---------- Byty ----------
def byty():
    base = ''
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis">
  <h1 id="pu-nadpis">Byty</h1>
  <p class="list-perex">{typo(prva_veta(P['charakteristika_bytov']))} Vyberte si byt priamo na fasáde alebo v{NBSP}zozname pod ňou.</p>
</section>
{vyber_bytov(base, 'plny')}
<section class="standard" aria-labelledby="std-nadpis">
  <h2 id="std-nadpis">Štandard bytov</h2>
  <p>{typo(P['standard_kratko'])}</p>
  <p>{typo(P['vyhody'][3]['text'])}</p>
</section>
{kontakt_blok(base, 'Chcete si pozrieť pôdorys osobne alebo rezervovať byt? Zavolajte, alebo napíšte, ktorý byt vás zaujal.')}'''
    return stranka(base, 'byty.html', 'Byty – Visionary Living, Černík', 'Dvanásť dvojizbových a trojizbových bytov v dvoch bytovkách v Černíku: pôdorysy, plochy, ceny.', 'List 3 – Pohľad', telo, LD_FIRMA, 'je-podstranka')


# ---------- Detail bytu ----------
def byt(b, i):
    base = '../'
    pred = INFO[i - 1] if i > 0 else None
    dal = INFO[i + 1] if i < len(INFO) - 1 else None
    miest = ''.join(f'<li style="--podiel:{m[1] / b["plocha"]:.3f};--i:{i}"><span class="miestnost-nazov">{m[0]}</span><span class="miestnost-pas" aria-hidden="true"><i></i></span><span class="miestnost-plocha">{plocha(m[1])}</span></li>' for i, m in enumerate(b['miestnosti']))
    int_set = INT2 if b['typ'] == '2' else INT3
    vzorovy = b['id'] != 'A1'
    gal_nadpis = 'Interiér bytu A1' if not vzorovy else 'Vzorový interiér'
    gal_text = (f'Vizualizácie interiéru bytu A1 v{NBSP}štandarde projektu.' if not vzorovy
                else f'Vzorový interiér {b["nazov"].lower()}u v{NBSP}štandarde projektu; vizualizácie nie sú priradené ku konkrétnemu bytu.')
    nav = ''
    if pred: nav += f'<a class="susedia-odkaz" href="{base}{pred["url"]}" rel="prev"><span>Predchádzajúci</span>Byt {pred["id"]}</a>'
    nav += f'<a class="susedia-odkaz susedia-vsetky" href="{base}byty.html">Všetky byty</a>'
    if dal: nav += f'<a class="susedia-odkaz susedia-dalsi" href="{base}{dal["url"]}" rel="next"><span>Ďalší</span>Byt {dal["id"]}</a>'
    po = IMG['podorys-' + b['podorys']]
    nasleduje = [{'nazov': k['nazov'], 'suma': k['suma'], 'text': prva_veta(k['text'])} for k in F['kroky']]
    telo = f'''<section class="byt-hlava" aria-labelledby="byt-nadpis">
  <p class="list-spat"><a href="{base}byty.html">Byty</a></p>
  <div class="byt-hlava-mriezka">
    <div>
      <h1 id="byt-nadpis">Byt {b['id']}</h1>
      <p class="byt-typ">{b['nazov']}, {b['podlazie_text']}</p>
      <p>{stav_html(b, True)}</p>
    </div>
    <dl class="byt-cisla">
      <div><dt>Cena</dt><dd>{cena(b['cena'])}</dd></div>
      <div><dt>Plocha</dt><dd>{plocha(b['plocha'])}<small>vrátane loggie</small></dd></div>
    </dl>
  </div>
</section>
{foto('podorys-' + b['podorys'], '(max-width: 1399px) 96vw, 1300px', f'Pôdorys {b["podlazie"]}. podlažia s vyznačeným bytom {b["id"]}', f'Pôdorys {b["podlazie"]}. podlažia, byt {b["id"]} vyznačený. Kliknutím zväčšíte.', cls='foto-sirka byt-podorys', priority=True, base=base, lupa='podorys')}
<section class="byt-miestnosti" aria-labelledby="miest-nadpis">
  <div class="byt-miestnosti-mriezka">
    {panel_plan(b, base, 'byt-plan')}
    <div>
      <h2 id="miest-nadpis">Miestnosti a{NBSP}plochy</h2>
      <ol class="miestnosti-pasy" data-kresli aria-label="Miestnosti bytu {b['id']}">{miest}</ol>
      <p class="miestnosti-spolu"><span>Spolu</span><span>{plocha(b['plocha'])} vrátane loggie</span></p>
    </div>
  </div>
</section>
<section class="standard" aria-labelledby="std-nadpis">
  <h2 id="std-nadpis">Štandard bytu</h2>
  <p>{typo(P['standard_kratko'])}</p>
  <p>Loggia a{NBSP}vlastné parkovacie miesto sú v{NBSP}cene bytu.</p>
</section>
<section class="byt-galeria" aria-labelledby="bg-nadpis">
  <h2 id="bg-nadpis">{gal_nadpis}</h2>
  <p>{gal_text}</p>
  {galeria_mriezka(base, int_set, 'byt', lazy_od=0)}
</section>
{cesta(base, 'zvisla', nasleduje, nadpis='Čo nasleduje')}
<section class="susedia-byty" aria-labelledby="sus-nadpis">
  <h2 id="sus-nadpis">Ďalšie byty</h2>
  <nav class="susedia-nav" aria-label="Predchádzajúci a ďalší byt">{nav}</nav>
  {fasada(base, 'mini', b['id'])}
</section>
<div class="byt-akcie"><a class="tlacidlo" href="{base}kontakt.html?byt={b['id']}">Mám záujem o{NBSP}byt {b['id']}</a><a class="tlacidlo tlacidlo-obrys" href="tel:{K['telefon_tel']}">{TEL_IKONA}Zavolať {K['telefon']}</a></div>'''
    ld = [{'@context': 'https://schema.org', '@type': 'Apartment', 'name': f'Byt {b["id"]}, {b["nazov"].lower()}', 'url': BASE + b['url'],
           'numberOfRooms': b['izby'], 'floorLevel': str(b['podlazie']),
           'floorSize': {'@type': 'QuantitativeValue', 'value': b['plocha'], 'unitCode': 'MTK'},
           'address': {'@type': 'PostalAddress', 'addressLocality': 'Černík', 'addressCountry': 'SK'},
           'offers': {'@type': 'Offer', 'price': b['cena'], 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock', 'seller': {'@type': 'Organization', 'name': Z['prevadzkovatel']}}}]
    return stranka(base, b['url'], f'Byt {b["id"]} – {b["nazov"].lower()}, {b["podlazie"]}. podlažie – Visionary Living Černík',
                   f'Byt {b["id"]}: {b["nazov"].lower()} na {b["podlazie"]}. podlaží, {plocha(b["plocha"]).replace(NBSP, " ")} vrátane loggie, {cena(b["cena"]).replace(NBSP, " ")}, parkovacie miesto v cene.',
                   f'List 4 – Pôdorys, byt {b["id"]}', telo, ld, 'je-podstranka je-byt', f'podorys-{b["podorys"]}-1100.webp')


# ---------- Financovanie, Galéria, Kontakt ----------
def financovanie():
    base = ''
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis">
  <h1 id="pu-nadpis">Financovanie</h1>
  <p class="list-perex">{typo(F['uvod'])}</p>
</section>
{cesta(base, 'plna', F['kroky'], odkaz=False, nadpis='Splátkový plán', uroven='h3')}
<p class="poznamka">Rezervačný poplatok sa započítava do prvej splátky kúpnej ceny. Parkovacie miesto je v{NBSP}cene bytu.</p>
{kontakt_blok(base, 'Hypotéku a poistenie nehnuteľnosti vám sprostredkujú naši finanční špecialisti. Ozvite sa, prejdeme to spolu.', 'Finanční špecialisti')}'''
    return stranka(base, 'financovanie.html', 'Financovanie – Visionary Living, Černík', 'Rezervačný poplatok 5 000 €, tri splátky kúpnej ceny, sprostredkovanie hypotéky a poistenia.', 'List 5 – Splátkový plán', telo, LD_FIRMA, 'je-podstranka')


def galeria():
    base = ''
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis">
  <h1 id="pu-nadpis">Galéria</h1>
  <p class="list-perex">Vizualizácie exteriéru a{NBSP}interiéru: dve bytovky so zeleňou okolo a{NBSP}byty v{NBSP}štandarde projektu.</p>
</section>
<section class="galeria-skupina" aria-labelledby="ge-nadpis"><h2 id="ge-nadpis">Exteriér</h2>{galeria_mriezka(base, EXT[:6], 'ext')}</section>
<section class="galeria-skupina" aria-labelledby="gi-nadpis"><h2 id="gi-nadpis">Interiér</h2>{galeria_mriezka(base, INT2 + INT3, 'int', lazy_od=0)}</section>
{kontakt_blok(base, 'Máte otázku k bytu alebo chcete termín obhliadky? Zavolajte, alebo napíšte.')}'''
    return stranka(base, 'galeria.html', 'Galéria – Visionary Living, Černík', 'Vizualizácie bytoviek, dvora a interiérov bytov v Černíku.', 'List 6 – Vizualizácie', telo, LD_FIRMA, 'je-podstranka')


def kontakt():
    base = ''
    moznosti = ''.join(f'<option value="{b["id"]}">Byt {b["id"]} – {b["nazov"].lower()}, {b["podlazie"]}. podlažie</option>' for b in INFO)
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis">
  <h1 id="pu-nadpis">Kontakt</h1>
</section>
<section class="kontakt" aria-label="Kontaktné údaje a formulár">
  <div class="kontakt-mriezka">
    <div class="kontakt-udaje">
      <p class="kontakt-velky"><a href="tel:{K['telefon_tel']}">{K['telefon']}</a><a href="mailto:{K['email']}">{K['email']}</a></p>
      <dl class="tabulka-dl">
        <div><dt>Sledujte nás</dt><dd><a href="{K['facebook']}" rel="noopener" target="_blank">Facebook</a>, <a href="{K['instagram']}" rel="noopener" target="_blank">Instagram</a></dd></div>
        <div><dt>Prevádzkovateľ</dt><dd>{Z['prevadzkovatel']}</dd></div>
        <div><dt>Projekt</dt><dd>{L['obec']}, okres {L['okres']}, {L['kraj']}<br><a href="https://www.google.com/maps/search/?api=1&query=%C4%8Cern%C3%ADk" rel="noopener" target="_blank">Zobraziť Černík na mape</a></dd></div>
      </dl>
    </div>
    <form class="formular" id="formular" action="mailto:{K['email']}" method="post" enctype="text/plain" novalidate>
      <h2 class="formular-nadpis">Napíšte nám</h2>
      <div class="polia">
        <div class="pole"><label for="f-meno">Meno a{NBSP}priezvisko</label><input id="f-meno" name="meno" autocomplete="name" required><p class="pole-chyba" id="f-meno-chyba"></p></div>
        <div class="pole"><label for="f-telefon">Telefón</label><input id="f-telefon" name="telefon" type="tel" autocomplete="tel" inputmode="tel"><p class="pole-chyba" id="f-telefon-chyba"></p></div>
        <div class="pole"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required><p class="pole-chyba" id="f-email-chyba"></p></div>
        <div class="pole"><label for="f-byt">Byt, ktorý vás zaujal</label><select id="f-byt" name="byt"><option value="">Zatiaľ neviem</option>{moznosti}</select><p class="pole-chyba" id="f-byt-chyba"></p></div>
        <div class="pole pole-sirka"><label for="f-sprava">Správa</label><textarea id="f-sprava" name="sprava" rows="5" required></textarea><p class="pole-chyba" id="f-sprava-chyba"></p></div>
      </div>
      <div class="formular-spodok"><button class="tlacidlo" type="submit">Odoslať správu</button><p class="formular-pozn" id="formular-pozn">Tlačidlo otvorí váš e-mailový program s{NBSP}pripravenou správou pre {K['email']}.</p></div>
    </form>
  </div>
</section>
{foto('exterier-05', '(max-width: 1399px) 96vw, 1300px', EXT[4][1], P['vyhody'][3]['text'], cls='foto-sirka', base=base)}
<p class="poznamka">Ako nakladáme s{NBSP}vašimi údajmi, uvádzajú <a href="{base}ochrana-sukromia.html">Zásady ochrany osobných údajov</a> (aktualizácia {O['ochrana_sukromia_aktualizacia']}).</p>'''
    return stranka(base, 'kontakt.html', 'Kontakt – Visionary Living, Černík', 'Telefón 0908 545 096, e-mail info@visionaryliving.sk. Napíšte nám, ktorý byt vás zaujal.', 'List 7 – Kontakt', telo, LD_FIRMA, 'je-podstranka')


def pravne(subor, titul, odseky):
    base = ''
    telo = f'''<section class="list-hlava" aria-labelledby="pu-nadpis"><h1 id="pu-nadpis">{titul}</h1></section>
<section class="pravny-text">{odseky}</section>'''
    return stranka(base, subor, f'{titul} – Visionary Living', titul, 'Príloha', telo, None, 'je-podstranka')


def ochrana():
    t = f'''<p>Spoločnosť {Z['prevadzkovatel']} (ďalej len „prevádzkovateľ“) prevádzkuje webstránku visionaryliving.sk pod značkou Visionary Living. Ochrana vašich osobných údajov je pre nás prioritou. Tieto zásady vysvetľujú, aké údaje zhromažďujeme, ako ich spracúvame a{NBSP}aké máte práva podľa nariadenia GDPR a{NBSP}zákona č. 18/2018 Z. z. o{NBSP}ochrane osobných údajov.</p>
<h2>Zodpovedná osoba</h2><p>{Z['zodpovedna_osoba']}, kontakt: <a href="mailto:{K['email']}">{K['email']}</a>, {K['telefon']}.</p>
<h2>1. Aké údaje zhromažďujeme</h2><p><strong>Údaje z{NBSP}kontaktného formulára:</strong> ak nám pošlete správu, spracúvame meno, e-mailovú adresu, telefónne číslo a{NBSP}obsah správy, výlučne na zodpovedanie vašej požiadavky (napríklad rezervácia bytu alebo odpoveď na otázku).</p><p><strong>Technické údaje:</strong> táto stránka neukladá cookies ani iné údaje do vášho prehliadača; poskytovateľ hostingu môže z{NBSP}technických dôvodov krátkodobo zaznamenať IP adresu a{NBSP}typ prehliadača.</p>
<h2>2. Právny základ spracúvania</h2><ul><li>plnenie zmluvy (čl. 6 ods. 1 písm. b) GDPR), napríklad pri rezervácii bytu,</li><li>oprávnený záujem (čl. 6 ods. 1 písm. f) GDPR), napríklad pri odpovedi na váš dopyt,</li><li>súhlas (čl. 6 ods. 1 písm. a) GDPR), ak nám dobrovoľne poskytnete ďalšie údaje.</li></ul>
<h2>3. Ako dlho uchovávame vaše údaje</h2><ul><li>údaje z{NBSP}dopytu po dobu nevyhnutnú na jeho vybavenie, najviac 1 rok od poslednej komunikácie,</li><li>údaje z{NBSP}rezervácie po dobu trvania zmluvného vzťahu a{NBSP}následne 5 rokov po jeho ukončení (archivácia podľa právnych predpisov).</li></ul>
<h2>4. Komu odovzdávame vaše údaje</h2><p>Osobné údaje neodovzdávame tretím stranám, pokiaľ to nie je nevyhnutné na plnenie zmluvy alebo zákonných povinností: poskytovateľ hostingu (technické údaje, napríklad IP adresa), účtovné a{NBSP}právne služby (pri rezervácii bytu účtovné doklady, zmluvy). Údaje sa neprenášajú mimo Európskeho hospodárskeho priestoru.</p>
<h2>5. Vaše práva</h2><ul><li>právo na prístup k{NBSP}údajom,</li><li>právo na opravu,</li><li>právo na vymazanie („právo na zabudnutie“),</li><li>právo na obmedzenie spracúvania,</li><li>právo na prenosnosť údajov,</li><li>právo namietať proti spracúvaniu na základe oprávneného záujmu,</li><li>právo podať sťažnosť na Úrad na ochranu osobných údajov Slovenskej republiky.</li></ul>
<h2>6. Ako nás kontaktovať</h2><p>{Z['prevadzkovatel']}, e-mail <a href="mailto:{K['email']}">{K['email']}</a>, telefón {K['telefon']}, zodpovedná osoba {Z['zodpovedna_osoba']}.</p>
<h2>7. Zmeny zásad</h2><p>Tieto zásady môžeme priebežne aktualizovať; aktuálnu verziu vždy nájdete na tejto stránke. Dátum poslednej aktualizácie: {O['ochrana_sukromia_aktualizacia']}.</p>'''
    return pravne('ochrana-sukromia.html', 'Zásady ochrany osobných údajov', t)


def cookies():
    t = f'''<p>Spoločnosť {Z['prevadzkovatel']} prevádzkuje webstránku visionaryliving.sk pod značkou Visionary Living.</p>
<h2>Čo sú cookies</h2><p>Cookies sú malé textové súbory, ktoré sa ukladajú do vášho zariadenia pri návšteve webstránky a{NBSP}pomáhajú jej zapamätať si informácie o{NBSP}vašej návšteve.</p>
<h2>Aké cookies používame</h2><p>Táto stránka <strong>nepoužíva analytické ani marketingové cookies</strong> a{NBSP}neukladá žiadne cookies ani iné údaje do vášho prehliadača. Nezhromažďujeme údaje o{NBSP}vašom správaní na webe a{NBSP}neposkytujeme ich tretím stranám na reklamné účely.</p>
<h2>Odkazy na iné služby</h2><p>Odkazy na Facebook, Instagram a{NBSP}mapu vedú na stránky tretích strán, ktoré majú vlastné pravidlá používania cookies. Otvárajú sa až po kliknutí.</p>
<h2>Kontakt</h2><p>Otázky k{NBSP}cookies a{NBSP}ochrane údajov: <a href="mailto:{K['email']}">{K['email']}</a>, {K['telefon']}. Viac v{NBSP}<a href="ochrana-sukromia.html">Zásadách ochrany osobných údajov</a>.</p>'''
    return pravne('cookies.html', 'Informácie o používaní cookies', t)


LD_FIRMA = {
    '@context': 'https://schema.org', '@type': 'RealEstateAgent', 'name': 'Visionary Living', 'url': BASE,
    'telephone': '+421908545096', 'email': K['email'], 'sameAs': [K['facebook'], K['instagram']],
    'parentOrganization': {'@type': 'Organization', 'name': Z['prevadzkovatel']},
    'areaServed': {'@type': 'Place', 'name': 'Černík, okres Nové Zámky'},
}


def sitemap(strany):
    urls = ''.join(f'  <url><loc>{BASE}{s if s != "index.html" else ""}</loc><lastmod>2026-10-13</lastmod><priority>{"1.0" if s == "index.html" else "0.6" if s.startswith("byt/") else "0.8"}</priority></url>\n' for s in strany if s not in ('ochrana-sukromia.html', 'cookies.html'))
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<!-- DEPLOY STEP: pri inej doméne nahraď základnú adresu jedným sed. -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n'


if __name__ == '__main__':
    os.makedirs(os.path.join(KOREN, 'byt'), exist_ok=True)
    vystupy = {'index.html': index(), 'o-projekte.html': o_projekte(), 'byty.html': byty(), 'financovanie.html': financovanie(), 'galeria.html': galeria(), 'kontakt.html': kontakt(), 'ochrana-sukromia.html': ochrana(), 'cookies.html': cookies()}
    for i, b in enumerate(INFO):
        vystupy[b['url']] = byt(b, i)
    for subor, obsah in vystupy.items():
        with open(os.path.join(KOREN, subor), 'w', encoding='utf-8') as f:
            f.write(obsah)
    open(os.path.join(KOREN, 'sitemap.xml'), 'w').write(sitemap(list(vystupy)))
    open(os.path.join(KOREN, 'robots.txt'), 'w').write(f'User-agent: *\nDisallow:\nSitemap: {BASE}sitemap.xml\n')
    print(f'{len(vystupy)} stránok, sitemap.xml, robots.txt')
