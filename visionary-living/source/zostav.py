"""Zostaví statický web VISIONARY LIVING z obsahu (source/obsah.json) a obrázkov (assets/img/obrazky.json).
Spustenie z priečinka visionary-living/: python3 source/zostav.py
Vznikne: index.html, o-projekte.html, byty.html, byt/<id>.html (12 stránok), financovanie.html, galeria.html,
kontakt.html, ochrana-sukromia.html, cookies.html, sitemap.xml, robots.txt.
Všetky texty sú z obsah.json (zdroje: docs/ZDROJE.md); nič sa tu nevymýšľa, len skladá.
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
NBSP = ' '

def e(s):
    return html.escape(str(s), quote=True)

def typo(s):
    """Slovenská typografia: pevná medzera za jednopísmenovými predložkami a v číslach s jednotkami."""
    s = re.sub(r'(?<![\w&;])([vszkaouiVSZKAOUI]) (?=\S)', '\\1' + NBSP, s)
    s = re.sub(r'(\d) (\d{3})(?!\d)', '\\1' + NBSP + '\\2', s)
    s = re.sub(r'(\d) (km|ha|m²|€|%)', '\\1' + NBSP + '\\2', s)
    return s

def cena(n):
    return f'{n:,}'.replace(',', NBSP) + NBSP + '€'

def plocha(x):
    return f'{x:.2f}'.replace('.', ',') + NBSP + 'm²'

def picture(meno, sizes, alt, cls='', loading='lazy', priority=False, base=''):
    t = IMG[meno]
    stupne = sorted(t['stupne'].items(), key=lambda kv: int(kv[0]))
    avif = ', '.join(f'{base}assets/img/{meno}-{w}.avif {w}w' for w, _ in stupne)
    webp = ', '.join(f'{base}assets/img/{meno}-{w}.webp {w}w' for w, _ in stupne)
    big = stupne[-1][0]
    attrs = f'alt="{e(alt)}" width="{t["w"]}" height="{t["h"]}" decoding="async"'
    attrs += ' fetchpriority="high"' if priority else f' loading="{loading}"'
    return (f'<picture{" class=" + chr(34) + cls + chr(34) if cls else ""}><source type="image/avif" srcset="{avif}" sizes="{sizes}">'
            f'<img src="{base}assets/img/{meno}-{big}.webp" srcset="{webp}" sizes="{sizes}" {attrs}></picture>')

# ---------- spoločné časti ----------
MENU = [('index.html', 'Úvod'), ('o-projekte.html', 'O projekte'), ('byty.html', 'Byty'), ('financovanie.html', 'Financovanie'), ('galeria.html', 'Galéria'), ('kontakt.html', 'Kontakt')]
K = O['kontakt']

def hlavicka(base, aktivna):
    odkazy = ''.join(f'<li><a href="{base}{h}"{" aria-current=" + chr(34) + "page" + chr(34) if h == aktivna else ""}>{t}</a></li>' for h, t in MENU)
    return f'''<header class="hlavicka" data-menu="zatvorene">
  <div class="hlavicka-vnutro">
    <a class="logo" href="{base}index.html" aria-label="Visionary Living, úvodná stránka"><img src="{base}assets/img/logo-tmave.png" width="168" height="56" alt="Visionary Living"></a>
    <nav class="menu" id="menu" aria-label="Hlavné menu">
      <ul>{odkazy}</ul>
      <a class="menu-telefon" href="tel:{K['telefon_tel']}">{K['telefon']}</a>
    </nav>
    <a class="tlacidlo tlacidlo-maly hlavicka-cta" href="tel:{K['telefon_tel']}"><span class="visually-hidden">Zavolať </span>{K['telefon']}</a>
    <button class="menu-prepinac" type="button" aria-expanded="false" aria-controls="menu"><span class="visually-hidden">Menu</span><span class="menu-ciary" aria-hidden="true"></span></button>
  </div>
</header>'''

def paticka(base):
    return f'''<footer class="paticka">
  <div class="wrap paticka-vnutro">
    <div class="paticka-znacka">
      <img src="{base}assets/img/logo-biele.png" width="168" height="56" alt="Visionary Living" loading="lazy" decoding="async">
      <p>{typo(O['uvod']['podtitul'])}</p>
    </div>
    <dl class="paticka-kontakt">
      <div><dt>E-mail</dt><dd><a href="mailto:{K['email']}">{K['email']}</a></dd></div>
      <div><dt>Zavolajte nám</dt><dd><a href="tel:{K['telefon_tel']}">{K['telefon']}</a></dd></div>
      <div><dt>Sledujte nás</dt><dd><a href="{K['facebook']}" rel="noopener" target="_blank">Facebook</a> · <a href="{K['instagram']}" rel="noopener" target="_blank">Instagram</a></dd></div>
    </dl>
    <ul class="paticka-odkazy">
      <li><a href="{base}ochrana-sukromia.html">Ochrana súkromia</a></li>
      <li><a href="{base}cookies.html">Cookies</a></li>
    </ul>
    <p class="paticka-pravne">© 2026 Visionary Living · {O['znacka']['prevadzkovatel']}</p>
  </div>
</footer>'''

def stranka(base, aktivna, titul, popis, telo, jsonld=None, trieda='', og_img='uvod-loggia-1600.webp'):
    url = BASE + (aktivna if aktivna != 'index.html' else '')
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ''
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
  <meta name="theme-color" content="#1f2924">
  <meta name="format-detection" content="telephone=no">
  <link rel="icon" href="{base}assets/img/ikona-32.png" sizes="32x32"><link rel="apple-touch-icon" href="{base}assets/img/ikona-180.png">
  <link rel="preload" href="{base}assets/fonts/nadpisy-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{base}assets/fonts/nadpisy-latinext.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{base}assets/fonts/text-latin.woff2" as="font" type="font/woff2" crossorigin>
  <script>document.documentElement.classList.replace('no-js','js');</script>
  <link rel="stylesheet" href="{base}assets/style.css">
  {ld}
</head>
<body class="{trieda}">
  <a class="preskocit" href="#obsah">Preskočiť na obsah</a>
{hlavicka(base, aktivna)}
<main id="obsah">
{telo}
</main>
{paticka(base)}
<script type="module" src="{base}assets/site.js"></script>
</body>
</html>
'''

# ---------- údaje o bytoch ----------
BYTY = O['byty']
TYPY = O['typy']
RAD = ['A', 'B', 'C', 'D']           # poradie bytov na podlaží (z pôdorysu: A a D sú dvojizbové, B a C trojizbové)

def byt_info(b):
    t = TYPY[b['typ']]
    return {**b, 'nazov': t['nazov'], 'cena': t['cena'], 'plocha': t['plocha'], 'miestnosti': t['miestnosti'], 'izby': int(b['typ']),
            'podlazie_text': f'{b["podlazie"]}. podlažie' + (' (prízemie)' if b['podlazie'] == 1 else ''), 'url': f'byt/{b["id"].lower()}.html'}

INFO = [byt_info(b) for b in BYTY]
PODLAZIA = {p: [b for b in INFO if b['podlazie'] == p] for p in (1, 2, 3)}

def vyber_bytov(base, s_zoznamom=False, nadpis='Vyberte si byt'):
    """Výberovník: schéma bytovky (3 podlažia × 4 byty) + filter; každý byt je odkaz na svoju stránku."""
    filtre = ''.join(f'<button type="button" class="filter" data-filter="{k}" aria-pressed="{"true" if k == "vsetky" else "false"}">{t}</button>'
                     for k, t in [('vsetky', 'Všetky'), ('p1', '1. podlažie'), ('p2', '2. podlažie'), ('p3', '3. podlažie'), ('t2', 'Dvojizbové'), ('t3', 'Trojizbové')])
    poschodia = ''
    for p in (3, 2, 1):
        bunky = ''.join(
            f'<a class="bunka typ-{b["typ"]}" href="{base}{b["url"]}" data-id="{b["id"]}" data-podlazie="{b["podlazie"]}" data-typ="{b["typ"]}" '
            f'aria-label="Byt {b["id"]}, {b["nazov"].lower()}, {plocha(b["plocha"])}, {cena(b["cena"])}, {b["stav"]}">'
            f'<span class="bunka-id">{b["id"]}</span><span class="bunka-typ">{b["izby"]}-izb.</span><span class="bunka-plocha">{plocha(b["plocha"])}</span></a>'
            for b in PODLAZIA[p])
        poschodia += f'<div class="podlazie" data-podlazie="{p}"><span class="podlazie-popis">{p}. NP</span>{bunky}</div>'
    legenda = '<ul class="vyber-legenda"><li><i class="typ-2"></i>Dvojizbový, 44,20 m², 114 900 €</li><li><i class="typ-3"></i>Trojizbový, 68,67 m², 149 900 €</li></ul>'
    zoznam = ''
    if s_zoznamom:
        karty = ''.join(f'''<li class="byt-karta" data-id="{b["id"]}" data-podlazie="{b["podlazie"]}" data-typ="{b["typ"]}">
          <a href="{base}{b["url"]}"><span class="byt-karta-id">Byt {b["id"]}</span><span class="byt-karta-typ">{b["nazov"]} · {b["podlazie_text"].split(" (")[0]}</span>
          <span class="byt-karta-udaje"><span>{plocha(b["plocha"])}</span><span>{cena(b["cena"])}</span><span class="stav">{b["stav"].capitalize()}</span></span></a></li>''' for b in INFO)
        zoznam = f'<ul class="byty-zoznam" aria-label="Zoznam bytov">{karty}</ul>'
    data = {b['id']: {'typ': b['typ'], 'podlazie': b['podlazie'], 'nazov': b['nazov'], 'cena': b['cena'], 'plocha': b['plocha'], 'stav': b['stav'], 'url': base + b['url'], 'miestnosti': b['miestnosti']} for b in INFO}
    return f'''<section class="vyber" id="vyber" aria-labelledby="vyber-nadpis">
  <script type="application/json" id="byty-data">{json.dumps(data, ensure_ascii=False)}</script>
  <div class="wrap">
    <div class="vyber-hlava"><h2 id="vyber-nadpis" class="nadpis">{nadpis}</h2>
      <p>Dve dispozične rovnaké bytovky, tri nadzemné podlažia, štyri byty na podlaží. Všetky byty v ponuke sú voľné (stav k {STAV_DATUM}). Klik na byt otvorí pôdorys a cenu.</p></div>
    <div class="vyber-filtre" role="group" aria-label="Filter bytov">{filtre}</div>
    <div class="vyber-telo">
      <div class="budova" aria-label="Schéma bytovky: podlažia a byty">
        <div class="strecha" aria-hidden="true"></div>
        {poschodia}
        <div class="zaklad" aria-hidden="true"></div>
      </div>
      <aside class="vyber-detail" aria-live="polite">
        <p class="vyber-detail-tip">Ukážte na byt v schéme, zobrazia sa jeho údaje.</p>
        <div class="vyber-detail-obsah" hidden></div>
      </aside>
    </div>
    {legenda}
    {zoznam}
  </div>
</section>'''

# ---------- sekcie úvodu ----------
def uvod_hero(base):
    U = O['uvod']
    return f'''<section class="uvod" aria-labelledby="uvod-nadpis">
  <div class="uvod-obraz" aria-hidden="true">
    {picture('uvod-loggia', '100vw', '', 'uvod-obraz-sirka', priority=True, base=base)}
    {picture('uvod-loggia-m', '100vw', '', 'uvod-obraz-vyska', priority=True, base=base)}
  </div>
  <div class="wrap uvod-text">
    <p class="uvod-kicker">Černík · okres Nové Zámky · novostavba</p>
    <h1 id="uvod-nadpis" class="uvod-nadpis"><span class="riadok"><span>Moderné bývanie</span></span> <span class="riadok"><span>uprostred prírody</span></span></h1>
    <p class="uvod-popis">{typo(U['podtitul'])}</p>
    <div class="uvod-akcie"><a class="tlacidlo" href="{base}byty.html">Pozrieť byty</a><a class="tlacidlo tlacidlo-obrys" href="tel:{K['telefon_tel']}">Zavolať {K['telefon']}</a></div>
  </div>
  <ul class="uvod-fakty" aria-label="Základné údaje">
    <li><strong data-pocitadlo="12">12</strong><span>bytov v{NBSP}ponuke</span></li>
    <li><strong>od{NBSP}114{NBSP}900{NBSP}€</strong><span>dvojizbový byt</span></li>
    <li><strong>44 až 69{NBSP}m²</strong><span>plocha s{NBSP}loggiou</span></li>
    <li><strong>v{NBSP}cene</strong><span>parkovacie miesto</span></li>
  </ul>
</section>'''

IKONY = {
    'dom': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 22 24 8l16 14M12 20v18h24V20M20 38V28h8v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 14h4v6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    'list': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40c0-14 6-24 16-30-2 14-8 24-16 30Zm0 0C24 28 18 18 8 12c2 12 6 22 16 28Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 40V24" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    'cesta': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42s-12-11-12-21a12 12 0 0 1 24 0c0 10-12 21-12 21Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="24" cy="21" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    'slnko': '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    'kluc': '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="19" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m24 25 15 15M33 34l4-4M29 38l4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    'auto': '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30v-6l4-10h24l4 10v6M8 30h32M8 30v4h6v-4M34 30v4h6v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="15" cy="27" r="2" fill="currentColor"/><circle cx="33" cy="27" r="2" fill="currentColor"/></svg>',
    'ludia': '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="18" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="32" cy="18" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 38c0-8 5-12 12-12s12 4 12 12M30 38c0-5 3-9 9-9 3 0 5 1 6 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}

def uvod_piliere(base):
    ik = ['slnko', 'list', 'cesta']
    polozky = ''.join(f'<li data-odhal style="--i:{i}"><span class="ikona">{IKONY[ik[i]]}</span><h3>{p["nazov"]}</h3><p>{typo(p["text"])}</p></li>' for i, p in enumerate(O['uvod']['piliere']))
    return f'<section class="piliere" aria-label="Prečo Visionary Living"><div class="wrap"><ul class="piliere-zoznam">{polozky}</ul></div></section>'

def uvod_projekt(base):
    P = O['projekt']
    body = ''.join(f'<li>{typo(b)}</li>' for b in P['body'])
    return f'''<section class="projekt" id="o-projekte" aria-labelledby="projekt-nadpis">
  <div class="wrap projekt-mriezka">
    <figure class="projekt-obraz" data-odhal>{picture('dron-predok', '(max-width: 900px) 92vw, 54vw', 'Vizualizácia dvoch bytoviek v Černíku zo vzduchu', base=base)}</figure>
    <div class="projekt-text">
      <p class="kicker">O projekte</p>
      <h2 id="projekt-nadpis" class="nadpis">{typo(P['nadpis'])}</h2>
      <p>{typo(P['popis'])}</p>
      <ul class="odrazky">{body}</ul>
      <a class="odkaz-sipka" href="{base}o-projekte.html">Viac o projekte</a>
    </div>
  </div>
</section>'''

def uvod_typy(base):
    karty = ''
    for k in ('2', '3'):
        t = TYPY[k]
        miest = ''.join(f'<li><span>{m[0]}</span><span>{plocha(m[1])}</span></li>' for m in t['miestnosti'])
        byty = ', '.join(b['id'] for b in INFO if b['typ'] == k)
        karty += f'''<article class="typ-karta typ-{k}" data-odhal style="--i:{int(k) - 2}">
      <header><h3>{t['nazov']}</h3><p class="typ-cena">{cena(t['cena'])}</p><p class="typ-plocha">{plocha(t['plocha'])} vrátane loggie</p></header>
      <ul class="miestnosti" data-miestnosti>{miest}</ul>
      <p class="typ-byty">Byty {byty}</p>
    </article>'''
    return f'''<section class="typy" aria-labelledby="typy-nadpis">
  <div class="wrap">
    <div class="sekcia-hlava"><p class="kicker">Ponuka</p><h2 id="typy-nadpis" class="nadpis">Dva typy bytov, obidva s loggiou a parkovaním v cene</h2></div>
    <div class="typy-mriezka">{karty}</div>
  </div>
</section>'''

def lokalita_ciselnik():
    """Vzdialenosti ako kružnice okolo Černíka: polomer je úmerný kilometrom (23 km = 190 px)."""
    L = O['lokalita']
    maxkm = max(km for _, km in L['vzdialenosti'])
    R = 190
    kruhy = ''.join(f'<circle class="kruh" cx="240" cy="240" r="{km / maxkm * R:.1f}"/>' for _, km in L['vzdialenosti'])
    uhly = {'Šurany': 150, 'Podhájska': 20, 'Vráble': 285, 'Nitra': 230}
    body = ''
    for i, (mesto, km) in enumerate(L['vzdialenosti']):
        import math
        a = math.radians(uhly[mesto]); r = km / maxkm * R
        x, y = 240 + r * math.cos(a), 240 + r * math.sin(a)
        ax = 'end' if x < 220 else 'start' if x > 260 else 'middle'
        dx = -10 if ax == 'end' else 10 if ax == 'start' else 0
        body += f'<g class="mesto" style="--i:{i}"><line x1="240" y1="240" x2="{x:.1f}" y2="{y:.1f}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5"/><text x="{x + dx:.1f}" y="{y + (16 if y > 250 else -10):.1f}" text-anchor="{ax}">{mesto} <tspan>{km}{NBSP}km</tspan></text></g>'
    return f'''<svg class="ciselnik" viewBox="0 0 480 480" role="img" aria-label="Vzdialenosti z Černíka: Šurany 11 km, Podhájska 17 km, Vráble 18 km, Nitra 23 km">
  {kruhy}
  {body}
  <circle class="stred" cx="240" cy="240" r="7"/><text class="stred-text" x="240" y="268" text-anchor="middle">Černík</text>
</svg>'''

def uvod_lokalita(base):
    L = O['lokalita']
    cisla = ''.join(f'<li><strong>{c[0]}</strong><span>{c[1]}</span></li>' for c in L['cisla'])
    return f'''<section class="lokalita" id="lokalita" aria-labelledby="lokalita-nadpis">
  <div class="wrap lokalita-mriezka">
    <div class="lokalita-text">
      <p class="kicker">Lokalita</p>
      <h2 id="lokalita-nadpis" class="nadpis">Ticho obce, mestá na dosah</h2>
      <p>{typo(L['uvod'])} {typo(L['popis'])}</p>
      <p>{typo(L['priroda'])}</p>
      <ul class="cisla">{cisla}</ul>
      <p class="susedia">Susedné obce: {', '.join(L['susedia'])}.</p>
    </div>
    <div class="lokalita-ciselnik" data-odhal>{lokalita_ciselnik()}</div>
  </div>
</section>'''

def uvod_preco(base):
    L = O['lokalita']
    ik = ['slnko', 'list', 'cesta', 'dom', 'ludia', 'kluc']
    polozky = ''.join(f'<li data-odhal style="--i:{i}"><span class="ikona">{IKONY[ik[i]]}</span><h3>{p[0]}</h3><p>{typo(p[1])}</p></li>' for i, p in enumerate(L['preco']))
    return f'''<section class="preco" aria-labelledby="preco-nadpis">
  <div class="wrap">
    <div class="sekcia-hlava"><p class="kicker">Prečo Černík</p><h2 id="preco-nadpis" class="nadpis">Prečo si vybrať byt v{NBSP}novostavbe v{NBSP}obci Černík</h2><p>{typo(O['uvod']['preco_kratko'])}</p></div>
    <ul class="preco-zoznam">{polozky}</ul>
  </div>
</section>'''

def uvod_standard(base):
    P = O['projekt']
    riadky = ''.join(f'<div class="riadok-udaj" data-odhal style="--i:{i}"><dt>{r[0]}</dt><dd>{typo(r[1])}</dd></div>' for i, r in enumerate(P['charakteristika_domu']))
    harm = ''.join(f'<li data-odhal style="--i:{i}"><strong>{h[0]}</strong><span>{h[1]}</span></li>' for i, h in enumerate(P['harmonogram']))
    return f'''<section class="standard" aria-labelledby="standard-nadpis">
  <div class="wrap standard-mriezka">
    <div>
      <p class="kicker">Charakteristika bytového domu</p>
      <h2 id="standard-nadpis" class="nadpis">Novostavba v{NBSP}štandarde, do ktorého sa dá hneď nasťahovať</h2>
      <dl class="udaje">{riadky}</dl>
    </div>
    <div class="standard-bok">
      <figure data-odhal>{picture('interier-kuchyna', '(max-width: 900px) 92vw, 40vw', 'Vizualizácia kuchyne s jedálenským stolom', base=base)}</figure>
      <ol class="harmonogram" aria-label="Harmonogram výstavby">{harm}</ol>
    </div>
  </div>
</section>'''

def uvod_financovanie(base):
    F = O['financovanie']
    kroky = ''.join(f'<li data-odhal style="--i:{i}"><span class="krok-cislo">{i + 1}</span><h3>{k["nazov"]}</h3>{"<p class=" + chr(34) + "krok-suma" + chr(34) + ">" + k["suma"] + "</p>" if k["suma"] else ""}<p>{typo(k["text"])}</p></li>' for i, k in enumerate(F['kroky']))
    return f'''<section class="financovanie" id="financovanie" aria-labelledby="fin-nadpis">
  <div class="wrap">
    <div class="sekcia-hlava"><p class="kicker">Financovanie</p><h2 id="fin-nadpis" class="nadpis">Od rezervácie po kľúče v{NBSP}štyroch krokoch</h2><p>{typo(F['uvod'])}</p></div>
    <ol class="kroky">{kroky}</ol>
  </div>
</section>'''

def galeria_mriezka(base, mena, popisy, skupina):
    pol = ''
    for i, m in enumerate(mena):
        t = IMG[m]; big = max(int(w) for w in t['stupne'])
        pol += (f'<li data-odhal style="--i:{i % 6}"><button type="button" class="galeria-polozka" data-galeria="{skupina}" data-src="{base}assets/img/{m}-{big}.webp" data-w="{t["w"]}" data-h="{t["h"]}" aria-label="Zväčšiť: {e(popisy[i])}">'
                f'{picture(m, "(max-width: 640px) 46vw, (max-width: 1100px) 31vw, 380px", popisy[i], base=base)}</button></li>')
    return f'<ul class="galeria-mriezka">{pol}</ul>'

EXT = [('exterier-01', 'Vizualizácia bytovky s loggiami a zeleňou'), ('exterier-02', 'Vizualizácia vstupu do bytovky'), ('exterier-03', 'Vizualizácia chodníka medzi bytovkami'), ('exterier-04', 'Vizualizácia parkovania pri bytovke'), ('exterier-05', 'Vizualizácia dvora so zeleňou'), ('dron', 'Vizualizácia dvoch bytoviek zo vzduchu'), ('dron-dvor', 'Vizualizácia dvora medzi bytovkami zo vzduchu'), ('uvod-loggia', 'Vizualizácia loggie s výhľadom do dvora')]
INT2 = [('interier-obyvacka-1', 'Obývacia izba s pohovkou'), ('interier-obyvacka-2', 'Obývacia izba s televízorom'), ('interier-kuchyna', 'Kuchyňa s jedálenským stolom'), ('interier-spalna-1', 'Spálňa'), ('interier-kupelna-1', 'Kúpeľňa'), ('interier-chodba', 'Vstupná chodba'), ('interier-jedalen', 'Jedálenský kút')]
INT3 = [('interier-sedacka-1', 'Obývacia izba so zelenou pohovkou'), ('interier-sedacka-2', 'Obývacia izba s výhľadom na loggiu'), ('interier-kuchyna-2', 'Kuchyňa s jedálenským stolom'), ('interier-detska', 'Detská izba'), ('interier-vstup', 'Vstupná chodba so šatníkom'), ('interier-kupelna-2', 'Kúpeľňa s vaňou'), ('interier-spalna-2', 'Spálňa'), ('interier-chodba', 'Vstupná chodba')]

def uvod_galeria(base):
    vyber = [('exterier-01', EXT[0][1]), ('interier-obyvacka-1', INT2[0][1]), ('exterier-05', EXT[4][1]), ('interier-sedacka-1', INT3[0][1]), ('interier-kuchyna-2', INT3[2][1]), ('dron-dvor', EXT[6][1])]
    return f'''<section class="galeria-uvod" aria-labelledby="gal-nadpis">
  <div class="wrap"><div class="sekcia-hlava"><p class="kicker">Galéria</p><h2 id="gal-nadpis" class="nadpis">Pozrite si, ako bude váš nový domov vyzerať</h2></div>
    {galeria_mriezka(base, [m for m, _ in vyber], [p for _, p in vyber], 'uvod')}
    <p class="sekcia-odkaz"><a class="odkaz-sipka" href="{base}galeria.html">Celá galéria</a></p>
  </div>
</section>'''

def kontakt_cta(base, text='Máte otázku k bytu alebo chcete termín obhliadky? Zavolajte, alebo napíšte.'):
    return f'''<section class="cta" aria-labelledby="cta-nadpis">
  <div class="wrap cta-vnutro">
    <h2 id="cta-nadpis" class="nadpis">V{NBSP}prípade záujmu nás kontaktujte</h2>
    <p>{typo(text)}</p>
    <div class="cta-akcie"><a class="tlacidlo" href="tel:{K['telefon_tel']}">{K['telefon']}</a><a class="tlacidlo tlacidlo-obrys" href="{base}kontakt.html">Napísať správu</a></div>
  </div>
</section>'''

# ---------- stránky ----------
LD_FIRMA = {
    '@context': 'https://schema.org', '@type': 'RealEstateAgent', 'name': 'Visionary Living', 'url': BASE,
    'telephone': '+421908545096', 'email': K['email'], 'sameAs': [K['facebook'], K['instagram']],
    'parentOrganization': {'@type': 'Organization', 'name': O['znacka']['prevadzkovatel']},
    'areaServed': {'@type': 'Place', 'name': 'Černík, okres Nové Zámky'},
}

def index():
    base = ''
    telo = '\n'.join([uvod_hero(base), uvod_piliere(base), uvod_projekt(base), uvod_typy(base), vyber_bytov(base), uvod_lokalita(base), uvod_preco(base), uvod_standard(base), uvod_financovanie(base), uvod_galeria(base), kontakt_cta(base)])
    ld = [LD_FIRMA, {'@context': 'https://schema.org', '@type': 'ApartmentComplex', 'name': 'Visionary Living Černík', 'url': BASE,
          'address': {'@type': 'PostalAddress', 'addressLocality': 'Černík', 'addressRegion': 'Nitriansky kraj', 'addressCountry': 'SK'},
          'numberOfAccommodationUnits': 12, 'petsAllowed': None}]
    ld[1].pop('petsAllowed')
    return stranka(base, 'index.html', 'Visionary Living – moderné bývanie uprostred prírody, Černík', O['uvod']['podtitul'], telo, ld, 'je-uvodna')

def o_projekte():
    base = ''
    P = O['projekt']
    vyhody = ''.join(f'<li data-odhal style="--i:{i}"><span class="ikona">{IKONY[["slnko", "kluc", "ludia", "auto"][i]]}</span><h3>{v["nazov"]}</h3><p>{typo(v["text"])}</p></li>' for i, v in enumerate(P['vyhody']))
    telo = f'''<section class="podstranka-uvod" aria-labelledby="pu-nadpis">
  <div class="wrap"><p class="kicker">O projekte</p><h1 id="pu-nadpis" class="nadpis-velky">{typo(P['nadpis'])}</h1><p class="podstranka-perex">{typo(P['popis'])}</p></div>
  <figure class="podstranka-obraz" data-odhal>{picture('dron-dvor', '100vw', 'Vizualizácia dvora medzi bytovkami zo vzduchu', priority=True, base=base)}</figure>
</section>
<section class="charakteristika" aria-labelledby="ch-nadpis">
  <div class="wrap charakteristika-mriezka">
    <div><p class="kicker">Charakteristika bytov</p><h2 id="ch-nadpis" class="nadpis">Užite si život v{NBSP}modernom štandarde</h2></div>
    <div class="charakteristika-text"><p>{typo(P['charakteristika_bytov'])}</p><a class="odkaz-sipka" href="{base}byty.html">Pozrieť ponuku bytov</a></div>
  </div>
  <div class="wrap"><ul class="preco-zoznam vyhody">{vyhody}</ul></div>
</section>
{uvod_typy(base)}
{uvod_standard(base)}
{uvod_lokalita(base)}
{uvod_preco(base)}
{kontakt_cta(base)}'''
    return stranka(base, 'o-projekte.html', 'O projekte – Visionary Living, Černík', P['popis'], telo, LD_FIRMA, 'je-podstranka', 'dron-dvor-1600.webp')

def byty():
    base = ''
    telo = f'''<section class="podstranka-uvod podstranka-uvod-kratky" aria-labelledby="pu-nadpis">
  <div class="wrap"><p class="kicker">Dostupné byty</p><h1 id="pu-nadpis" class="nadpis-velky">Ponuka bytov</h1><p class="podstranka-perex">Na výber je z{NBSP}dvoch dispozične rovnakých bytoviek umiestnených vedľa seba. Dvojizbové byty majú 44,20{NBSP}m², trojizbové 68,67{NBSP}m², všetky s{NBSP}loggiou a{NBSP}parkovacím miestom v{NBSP}cene.</p></div>
</section>
{vyber_bytov(base, s_zoznamom=True, nadpis='Vyberte si byt v schéme alebo zo zoznamu')}
{uvod_typy(base)}
{kontakt_cta(base, 'Chcete si pozrieť pôdorys osobne alebo rezervovať byt? Zavolajte, alebo napíšte, ktorý byt vás zaujal.')}'''
    return stranka(base, 'byty.html', 'Dostupné byty – Visionary Living, Černík', 'Dvanásť dvojizbových a trojizbových bytov v dvoch bytovkách v Černíku: pôdorysy, plochy, ceny.', telo, LD_FIRMA, 'je-podstranka', 'bytovky-1024.webp')

def byt(b, i):
    base = '../'
    pred = INFO[i - 1] if i > 0 else None
    dal = INFO[i + 1] if i < len(INFO) - 1 else None
    miest = ''.join(f'<li style="--podiel:{m[1] / b["plocha"]:.3f}"><span class="miestnost-nazov">{m[0]}</span><span class="miestnost-pas" aria-hidden="true"><i></i></span><span class="miestnost-plocha">{plocha(m[1])}</span></li>' for m in b['miestnosti'])
    int_set = INT2 if b['typ'] == '2' else INT3
    galeria = galeria_mriezka(base, [m for m, _ in int_set], [p for _, p in int_set], 'byt')
    nav = ''
    if pred: nav += f'<a class="byt-nav-odkaz" href="{base}{pred["url"]}" rel="prev"><span>Predchádzajúci</span>Byt {pred["id"]}</a>'
    nav += f'<a class="byt-nav-odkaz byt-nav-stred" href="{base}byty.html">Všetky byty</a>'
    if dal: nav += f'<a class="byt-nav-odkaz byt-nav-dalsi" href="{base}{dal["url"]}" rel="next"><span>Ďalší</span>Byt {dal["id"]}</a>'
    ostatne = ''.join(f'<li><a href="{base}{x["url"]}"{" aria-current=" + chr(34) + "page" + chr(34) if x["id"] == b["id"] else ""} class="typ-{x["typ"]}">{x["id"]}</a></li>' for x in INFO)
    telo = f'''<section class="byt-uvod" aria-labelledby="byt-nadpis">
  <div class="wrap byt-uvod-mriezka">
    <div class="byt-uvod-text">
      <p class="kicker"><a href="{base}byty.html">Dostupné byty</a> · {b['podlazie_text']}</p>
      <h1 id="byt-nadpis" class="nadpis-velky">Byt {b['id']}<span class="byt-typ">{b['nazov']}</span></h1>
      <dl class="byt-fakty">
        <div><dt>Cena</dt><dd>{cena(b['cena'])}</dd></div>
        <div><dt>Podlahová plocha</dt><dd>{plocha(b['plocha'])}<small> vrátane loggie</small></dd></div>
        <div><dt>Podlažie</dt><dd>{b['podlazie']}. z{NBSP}3</dd></div>
        <div><dt>Stav</dt><dd><span class="stav stav-{b['stav'].replace('ľ', 'l')}">{b['stav'].capitalize()}</span><small> k {STAV_DATUM}</small></dd></div>
      </dl>
      <div class="uvod-akcie"><a class="tlacidlo" href="{base}kontakt.html?byt={b['id']}">Mám záujem o{NBSP}byt {b['id']}</a><a class="tlacidlo tlacidlo-obrys" href="tel:{K['telefon_tel']}">Zavolať {K['telefon']}</a></div>
    </div>
    <figure class="byt-podorys" data-odhal>
      <button type="button" class="podorys-zvacsit" data-galeria="podorys" data-src="{base}assets/img/podorys-{b['podorys']}-1600.webp" data-w="{IMG['podorys-' + b['podorys']]['w']}" data-h="{IMG['podorys-' + b['podorys']]['h']}" aria-label="Zväčšiť pôdorys bytu {b['id']}">
        {picture('podorys-' + b['podorys'], '(max-width: 900px) 92vw, 56vw', f'Pôdorys podlažia s vyznačeným bytom {b["id"]}', priority=True, base=base)}
      </button>
      <figcaption>Pôdorys {b['podlazie']}. podlažia, byt {b['id']} vyznačený. Ťuknutím zväčšíte.</figcaption>
    </figure>
  </div>
</section>
<section class="byt-miestnosti" aria-labelledby="miest-nadpis">
  <div class="wrap byt-miestnosti-mriezka">
    <div><p class="kicker">Popis bytu</p><h2 id="miest-nadpis" class="nadpis">Miestnosti a{NBSP}plochy</h2><p>{typo(O['projekt']['standard_kratko'])}</p></div>
    <ul class="miestnosti miestnosti-pasy" data-miestnosti aria-label="Miestnosti bytu {b['id']}">{miest}<li class="miestnosti-spolu"><span class="miestnost-nazov">Celková podlahová plocha</span><span class="miestnost-plocha">{plocha(b['plocha'])}</span></li></ul>
  </div>
</section>
<section class="byt-galeria" aria-labelledby="bg-nadpis">
  <div class="wrap"><div class="sekcia-hlava"><p class="kicker">Galéria – interiér</p><h2 id="bg-nadpis" class="nadpis">Pozrite si, ako bude váš nový domov vyzerať</h2><p>Vizualizácie interiéru {b['nazov'].lower()}u v{NBSP}štandarde projektu.</p></div>{galeria}</div>
</section>
<section class="byt-nav" aria-label="Ďalšie byty">
  <div class="wrap"><nav class="byt-nav-vnutro">{nav}</nav><ul class="byt-vsetky" aria-label="Všetky byty">{ostatne}</ul></div>
</section>
{kontakt_cta(base, f'Byt {b["id"]} vás zaujal? Zavolajte, alebo napíšte a dohodneme obhliadku pôdorysu a podmienok.')}'''
    ld = [{'@context': 'https://schema.org', '@type': 'Apartment', 'name': f'Byt {b["id"]}, {b["nazov"].lower()}', 'url': BASE + b['url'],
           'numberOfRooms': b['izby'], 'floorLevel': str(b['podlazie']),
           'floorSize': {'@type': 'QuantitativeValue', 'value': b['plocha'], 'unitCode': 'MTK'},
           'address': {'@type': 'PostalAddress', 'addressLocality': 'Černík', 'addressCountry': 'SK'},
           'offers': {'@type': 'Offer', 'price': b['cena'], 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock', 'seller': {'@type': 'Organization', 'name': O['znacka']['prevadzkovatel']}}}]
    return stranka(base, b['url'], f'Byt {b["id"]} – {b["nazov"].lower()}, {b["podlazie"]}. podlažie – Visionary Living Černík',
                   f'Byt {b["id"]}: {b["nazov"].lower()} na {b["podlazie"]}. podlaží, {plocha(b["plocha"]).replace(NBSP, " ")} vrátane loggie, {cena(b["cena"]).replace(NBSP, " ")}, parkovacie miesto v cene.', telo, ld, 'je-podstranka je-byt', f'podorys-{b["podorys"]}-1100.webp')

def financovanie():
    base = ''
    F = O['financovanie']
    kroky = ''.join(f'<li data-odhal style="--i:{i}"><span class="krok-cislo">{i + 1}</span><h2>{k["nazov"]}</h2>{"<p class=" + chr(34) + "krok-suma" + chr(34) + ">" + k["suma"] + "</p>" if k["suma"] else ""}<p>{typo(k["text"])}</p></li>' for i, k in enumerate(F['kroky']))
    telo = f'''<section class="podstranka-uvod podstranka-uvod-kratky" aria-labelledby="pu-nadpis">
  <div class="wrap"><p class="kicker">Financovanie</p><h1 id="pu-nadpis" class="nadpis-velky">Od rezervácie po kľúče v{NBSP}štyroch krokoch</h1><p class="podstranka-perex">{typo(F['uvod'])}</p></div>
</section>
<section class="financovanie financovanie-stranka" aria-label="Kroky financovania"><div class="wrap"><ol class="kroky">{kroky}</ol></div></section>
<section class="fin-ceny" aria-labelledby="fc-nadpis"><div class="wrap">
  <div class="sekcia-hlava"><p class="kicker">Ceny</p><h2 id="fc-nadpis" class="nadpis">Ceny bytov</h2></div>
  <ul class="fin-ceny-zoznam">
    <li data-odhal><strong>{cena(TYPY['2']['cena'])}</strong><span>{TYPY['2']['nazov'].lower()}, {plocha(TYPY['2']['plocha'])} vrátane loggie</span></li>
    <li data-odhal style="--i:1"><strong>{cena(TYPY['3']['cena'])}</strong><span>{TYPY['3']['nazov'].lower()}, {plocha(TYPY['3']['plocha'])} vrátane loggie</span></li>
  </ul>
  <p class="poznamka">Rezervačný poplatok 5{NBSP}000{NBSP}€ sa započítava do prvej splátky kúpnej ceny. Parkovacie miesto je v{NBSP}cene bytu.</p>
</div></section>
{kontakt_cta(base, 'Hypotéku a poistenie nehnuteľnosti vám sprostredkujú naši finanční špecialisti. Ozvite sa, prejdeme to spolu.')}'''
    return stranka(base, 'financovanie.html', 'Financovanie – Visionary Living, Černík', 'Rezervačný poplatok 5 000 €, tri splátky kúpnej ceny, sprostredkovanie hypotéky a poistenia.', telo, LD_FIRMA, 'je-podstranka')

def galeria():
    base = ''
    telo = f'''<section class="podstranka-uvod podstranka-uvod-kratky" aria-labelledby="pu-nadpis">
  <div class="wrap"><p class="kicker">Galéria</p><h1 id="pu-nadpis" class="nadpis-velky">Vizualizácie exteriéru a{NBSP}interiéru</h1><p class="podstranka-perex">Takto bude vyzerať bývanie v{NBSP}Černíku: dve bytovky so zeleňou okolo a{NBSP}byty v{NBSP}štandarde projektu.</p></div>
</section>
<section class="galeria-stranka" aria-labelledby="ge-nadpis"><div class="wrap"><h2 id="ge-nadpis" class="nadpis">Exteriér</h2>{galeria_mriezka(base, [m for m, _ in EXT], [p for _, p in EXT], 'ext')}</div></section>
<section class="galeria-stranka" aria-labelledby="gi-nadpis"><div class="wrap"><h2 id="gi-nadpis" class="nadpis">Interiér</h2>{galeria_mriezka(base, [m for m, _ in INT2 + INT3[:7]], [p for _, p in INT2 + INT3[:7]], 'int')}</div></section>
{kontakt_cta(base)}'''
    return stranka(base, 'galeria.html', 'Galéria – Visionary Living, Černík', 'Vizualizácie bytoviek, dvora a interiérov bytov v Černíku.', telo, LD_FIRMA, 'je-podstranka')

def kontakt():
    base = ''
    moznosti = ''.join(f'<option value="{b["id"]}">Byt {b["id"]} – {b["nazov"].lower()}, {b["podlazie"]}. podlažie</option>' for b in INFO)
    telo = f'''<section class="podstranka-uvod podstranka-uvod-kratky" aria-labelledby="pu-nadpis">
  <div class="wrap"><p class="kicker">Kontakt</p><h1 id="pu-nadpis" class="nadpis-velky">V{NBSP}prípade záujmu nás kontaktujte</h1></div>
</section>
<section class="kontakt" aria-label="Kontaktné údaje a formulár">
  <div class="wrap kontakt-mriezka">
    <div class="kontakt-udaje">
      <dl>
        <div><dt>Telefón</dt><dd><a href="tel:{K['telefon_tel']}">{K['telefon']}</a></dd></div>
        <div><dt>E-mail</dt><dd><a href="mailto:{K['email']}">{K['email']}</a></dd></div>
        <div><dt>Prevádzkovateľ</dt><dd>{O['znacka']['prevadzkovatel']}</dd></div>
        <div><dt>Projekt</dt><dd>Černík, okres Nové Zámky, Nitriansky kraj<br><a href="https://www.google.com/maps/search/?api=1&query=%C4%8Cern%C3%ADk" rel="noopener" target="_blank">Zobraziť Černík na mape</a></dd></div>
        <div><dt>Sledujte nás</dt><dd><a href="{K['facebook']}" rel="noopener" target="_blank">Facebook</a> · <a href="{K['instagram']}" rel="noopener" target="_blank">Instagram</a></dd></div>
      </dl>
    </div>
    <form class="formular" id="formular" action="mailto:{K['email']}" method="post" enctype="text/plain" novalidate>
      <h2 class="nadpis-maly">Kontaktný formulár</h2>
      <div class="polia">
        <label class="pole"><span>Meno a{NBSP}priezvisko</span><input name="meno" autocomplete="name" required></label>
        <label class="pole"><span>Telefón</span><input name="telefon" type="tel" autocomplete="tel" inputmode="tel"></label>
        <label class="pole"><span>E-mail</span><input name="email" type="email" autocomplete="email" required></label>
        <label class="pole"><span>Byt, ktorý vás zaujal</span><select name="byt"><option value="">Zatiaľ neviem</option>{moznosti}</select></label>
        <label class="pole pole-sirka"><span>Správa</span><textarea name="sprava" rows="5" required></textarea></label>
      </div>
      <div class="formular-spodok"><button class="tlacidlo" type="submit">Odoslať správu</button><p class="formular-pozn" id="formular-pozn">Tlačidlo otvorí váš e-mailový program s{NBSP}pripravenou správou pre {K['email']}.</p></div>
    </form>
  </div>
</section>'''
    return stranka(base, 'kontakt.html', 'Kontakt – Visionary Living, Černík', 'Telefón 0908 545 096, e-mail info@visionaryliving.sk. Napíšte nám, ktorý byt vás zaujal.', telo, LD_FIRMA, 'je-podstranka')

def pravne(subor, titul, kicker, odseky):
    base = ''
    telo = f'''<section class="podstranka-uvod podstranka-uvod-kratky"><div class="wrap"><p class="kicker">{kicker}</p><h1 class="nadpis-velky">{titul}</h1></div></section>
<section class="pravny-text"><div class="wrap pravny-vnutro">{odseky}</div></section>'''
    return stranka(base, subor, f'{titul} – Visionary Living', titul, telo, None, 'je-podstranka')

def ochrana():
    Z = O['znacka']
    t = f'''<p>Spoločnosť {Z['prevadzkovatel']} (ďalej len „prevádzkovateľ“) prevádzkuje webstránku visionaryliving.sk pod značkou Visionary Living. Ochrana vašich osobných údajov je pre nás prioritou. Tieto zásady vysvetľujú, aké údaje zhromažďujeme, ako ich spracúvame a{NBSP}aké máte práva.</p>
<h2>Zodpovedná osoba</h2><p>{Z['zodpovedna_osoba']}, kontakt: <a href="mailto:{K['email']}">{K['email']}</a>, {K['telefon']}.</p>
<h2>1. Aké údaje zhromažďujeme</h2><p><strong>Údaje z{NBSP}kontaktného formulára:</strong> ak nám pošlete správu, spracúvame meno, e-mailovú adresu, telefónne číslo a{NBSP}obsah správy, výlučne na zodpovedanie vašej požiadavky (napríklad rezervácia bytu alebo odpoveď na otázku). Formulár na tejto stránke otvorí váš e-mailový program, správu odosielate zo svojej adresy.</p><p><strong>Cookies:</strong> táto stránka nepoužíva analytické ani marketingové cookies a{NBSP}nesleduje vaše správanie. Podrobnosti sú na stránke <a href="cookies.html">Cookies</a>.</p>
<h2>2. Právny základ spracúvania</h2><ul><li>plnenie zmluvy (čl. 6 ods. 1 písm. b) GDPR), napríklad pri rezervácii bytu,</li><li>oprávnený záujem (čl. 6 ods. 1 písm. f) GDPR), napríklad pri odpovedi na váš dopyt,</li><li>súhlas (čl. 6 ods. 1 písm. a) GDPR), ak nám dobrovoľne poskytnete údaje na marketingové účely.</li></ul>
<h2>3. Ako dlho uchovávame vaše údaje</h2><ul><li>údaje z{NBSP}dopytu po dobu nevyhnutnú na jeho vybavenie, najviac 1 rok od poslednej komunikácie,</li><li>údaje z{NBSP}rezervácie po dobu trvania zmluvného vzťahu a{NBSP}následne 5 rokov po jeho ukončení (archivácia podľa právnych predpisov).</li></ul>
<h2>4. Komu odovzdávame vaše údaje</h2><p>Osobné údaje neodovzdávame tretím stranám, pokiaľ to nie je nevyhnutné na plnenie zmluvy alebo zákonných povinností: poskytovateľ hostingu (technické údaje, napríklad IP adresa), účtovné a{NBSP}právne služby (pri rezervácii bytu účtovná firma alebo advokát), štátne orgány (v{NBSP}prípade zákonnej povinnosti).</p>
<h2>5. Vaše práva</h2><ul><li>právo na prístup k{NBSP}údajom,</li><li>právo na opravu,</li><li>právo na vymazanie („právo na zabudnutie“),</li><li>právo na obmedzenie spracúvania,</li><li>právo na prenosnosť údajov,</li><li>právo namietať proti spracúvaniu na základe oprávneného záujmu,</li><li>právo odvolať súhlas,</li><li>právo podať sťažnosť na Úrad na ochranu osobných údajov SR (<a href="https://dataprotection.gov.sk" rel="noopener" target="_blank">dataprotection.gov.sk</a>).</li></ul>
<h2>6. Ako nás kontaktovať</h2><p>{Z['prevadzkovatel']}, e-mail <a href="mailto:{K['email']}">{K['email']}</a>, telefón {K['telefon']}, zodpovedná osoba {Z['zodpovedna_osoba']}.</p>
<h2>7. Zmeny zásad</h2><p>Tieto zásady môžeme priebežne aktualizovať; aktuálnu verziu vždy nájdete na tejto stránke. Dátum poslednej aktualizácie: {O['ochrana_sukromia_aktualizacia']}.</p>'''
    return pravne('ochrana-sukromia.html', 'Zásady ochrany osobných údajov', 'Ochrana súkromia', t)

def cookies():
    Z = O['znacka']
    t = f'''<p>Spoločnosť {Z['prevadzkovatel']} prevádzkuje webstránku visionaryliving.sk pod značkou Visionary Living.</p>
<h2>Čo sú cookies</h2><p>Cookies sú malé textové súbory, ktoré sa ukladajú do vášho zariadenia pri návšteve webstránky a{NBSP}pomáhajú jej zapamätať si informácie o{NBSP}vašej návšteve.</p>
<h2>Aké cookies používame</h2><p>Táto stránka <strong>nepoužíva analytické ani marketingové cookies</strong> a{NBSP}neukladá žiadne cookies ani iné údaje do vášho prehliadača. Nezhromažďujeme údaje o{NBSP}vašom správaní na webe a{NBSP}neposkytujeme ich tretím stranám na reklamné účely. Preto nie je potrebný váš súhlas a{NBSP}stránka nezobrazuje lištu so súhlasom.</p>
<h2>Odkazy na iné služby</h2><p>Odkazy na Facebook, Instagram a{NBSP}mapu vedú na stránky tretích strán, ktoré majú vlastné pravidlá používania cookies. Otvárajú sa až po kliknutí.</p>
<h2>Kontakt</h2><p>Otázky k{NBSP}cookies a{NBSP}ochrane údajov: <a href="mailto:{K['email']}">{K['email']}</a>, {K['telefon']}. Viac v{NBSP}<a href="ochrana-sukromia.html">Zásadách ochrany osobných údajov</a>.</p>'''
    return pravne('cookies.html', 'Informácie o používaní cookies', 'Cookies', t)

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
