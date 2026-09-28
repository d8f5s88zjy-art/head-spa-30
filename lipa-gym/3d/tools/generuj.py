#!/usr/bin/env python3
"""Vygeneruje 5 stránok webu GYM KLUB (index, o-fitku, clenstva, sluzby, kontakt) so spoločnou
hlavičkou, navigáciou a pätičkou. Spustenie z priečinka lipa-gym/3d:  python3 tools/generuj.py

Všetky fakty o prevádzke sú v slovníku GYM nižšie. Údaje, ktoré prevádzka ešte nepotvrdila,
sú na stránke označené značkou OVERIŤ (funkcia todo); pred zverejnením ich treba potvrdiť alebo
opraviť a značku odstrániť (TODO_VISIBLE = False ich skryje všetky naraz).
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTKY = json.load(open(os.path.join(ROOT, 'tools', 'fotky.json'), encoding='utf-8'))
BASE_URL = 'https://d8f5s88zjy-art.github.io/head-spa-30/lipa-gym/3d/'
TODO_VISIBLE = True
e = lambda t: html.escape(t, quote=True)

# ---------------------------------------------------------------------------------------------
# Fakty. Zdroj: gymklub.sk (27. 9. 2026) a terajší web lipa-gym/. „overit“ = treba potvrdiť.
GYM = {
    'name': 'GYM KLUB',
    'full': 'GYM KLUB Fitness & Bodybuilding',
    'street': 'Výstavná 6', 'place': 'Lipa Centrum', 'district': 'Chrenová', 'zip': '949 01', 'city': 'Nitra',
    'phone': '+421 944 800 394', 'tel': '+421944800394',
    'email': 'info@gymklub.sk',
    'instagram': 'https://www.instagram.com/gymklubnitra/',
    'facebook': 'https://www.facebook.com/profile.php?id=100057511568169',
    'maps': 'https://www.google.com/maps/search/?api=1&query=Gym+Klub%2C+V%C3%BDstavn%C3%A1+6%2C+949+01+Nitra',
    'embed': 'https://www.google.com/maps?q=Gym+Klub,+V%C3%BDstavn%C3%A1+6,+949+01+Nitra&output=embed',
}
HOURS = [('Pondelok – štvrtok', '06:30 – 21:00'), ('Piatok', '06:30 – 23:00'), ('Sobota – nedeľa', '08:00 – 17:00')]
HOURS_NOTE = 'Otázky na gymklub.sk uvádzajú cez víkend 08:00 – 17:00, pätička toho istého webu 08:30 – 18:00. Potvrdiť s prevádzkou.'
PRICES_NOTE = 'Ceny, podmienky a spôsob platby sú prevzaté z gymklub.sk (27. 9. 2026). Pred zverejnením ich potvrdiť s prevádzkou.'
PLANS = [
    {'name': 'Jednorazový vstup', 'price': '6 €', 'per': '1 vstup', 'text': 'Príďte, kedy sa vám hodí, bez viazanosti. Vstup do celého fitness centra.', 'main': False},
    {'name': 'Permanentka', 'price': '50 €', 'per': 'mesiac', 'text': 'Neobmedzené fitness tréningy počas mesiaca. Od deviateho vstupu v mesiaci vychádza lacnejšie než jednotlivé vstupy.', 'main': True},
    {'name': 'Permanentka študent', 'price': '42 €', 'per': 'mesiac', 'text': 'Mesačná permanentka pre študentov. Pri kúpe a vstupe ukážte platný študentský preukaz.', 'main': False},
]
MORE = [('10 vstupov', 'bez viazanosti na mesiac', '50 €'), ('20 vstupov', '4 € za vstup', '80 €'),
        ('Študent · 1 vstup', 'so študentským preukazom', '5 €'), ('Dôchodca · 1 vstup', '', '3,50 €')]
TERMS = ['Platba na recepcii, podľa gymklub.sk len v hotovosti.', 'Prijímame MultiSport a Upbalansea app, kartu alebo aplikáciu ukážte pri príchode.',
         'Ceny platia pre samostatný fitness tréning. Bojové športy, skupinové lekcie a osobné tréningy dohodnete s trénerom.']
TIMETABLE = [  # deň 0 = pondelok
    (0, '16:00', '17:00', 'Pilates', 'Majka Navrátilová'), (0, '17:00', '18:30', 'Krav Maga', 'Tomáš Židek, Slavo Juro'),
    (1, '17:00', '19:00', 'Bojové športy', 'Michal Šášik'), (1, '18:00', '19:00', 'Zdravý chrbát', 'Nikol Molnárová'),
    (2, '18:00', '19:00', 'Pilates', 'Majka Navrátilová'),
    (3, '17:00', '19:00', 'Bojové športy', 'Michal Šášik'), (3, '18:00', '19:00', 'Zdravý chrbát', 'Nikol Molnárová'),
    (5, '13:00', '15:00', 'Bojové športy', 'Michal Šášik'),
]
DAYS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa']
COACHES = [  # (meno, zameranie, text, telefón alebo None)
    ('Michal Šášik', 'Bojové športy', 'MMA, Jiu Jitsu a Luta Livre. Postoj aj zem, od úplných základov po zápas.', '0905 930 597'),
    ('Mgr. Tomáš Králik', 'Fitness a výživa', 'Kondičný a kruhový tréning, TRX, kettlebell, kondičný box, výživové poradenstvo.', '+421 908 484 155'),
    ('Jakub Vrána', 'Fitness', 'Diagnostika pohybu, správna technika, tréningový plán a jedálniček podľa cieľa.', '0915 605 514'),
    ('Jozef Humay', 'Fitness', 'Osobné a kondičné tréningy, poradenstvo pre stravu, výživu a doplnky.', '+421 907 736 944'),
    ('Tomáš Židek', 'Krav Maga', 'Praktická sebaobrana pre reálne situácie.', None),
    ('Slavo Juro', 'Krav Maga', 'Inštruktor Krav Maga.', None),
    ('Nikol Molnárová', 'Zdravý chrbát', 'Posilnenie trupu, správne držanie tela a uvoľnenie stuhnutých svalov.', '+421 948 899 131'),
    ('Majka Navrátilová', 'Pilates', 'Pilates pre pevný stred tela, stabilitu a mobilitu.', None),
    ('Kristián Filipčík', 'Fitness', 'Osobné fitness tréningy.', None),
    ('Jaroslav Šoltís', 'Nutričné poradenstvo', 'Analýza telesného zloženia, stravovací protokol, príprava na súťaž vo fitness a silovom trojboji.', None),
]
ZONES = [
    ('prichod', 'Príchod', 'Výstavná 6, Lipa Centrum. Vchod je z krytej terasy, hneď za dverami je recepcia.', ['terasa-1', 'vstup-1', 'recepcia-1'], 'vstup-1'),
    ('hlavna-sala', 'Hlavná sála', 'Silový tréning na strojoch.', ['hlavna-sala-1', 'hlavna-sala-2', 'hlavna-sala-4', 'hlavna-sala-5', 'hlavna-sala-3', 'hlavna-sala-6'], 'hlavna-sala-2'),
    ('sala-so-strojmi', 'Sála so strojmi', 'Druhá sála na silový tréning.', ['stroje-4', 'stroje-1', 'stroje-2', 'stroje-3'], 'stroje-4'),
    ('kardio', 'Kardio', 'Kardio tréning pri oknách.', ['kardio-3', 'kardio-1', 'kardio-2'], 'kardio-1'),
    ('volne-vahy', 'Voľné váhy', 'Tréning s jednoručkami a osami.', ['volne-vahy-1', 'volne-vahy-2', 'volne-vahy-3', 'jednorucky-1'], 'volne-vahy-2'),
    ('funkcna-zona', 'Funkčná zóna', 'Funkčný a kondičný tréning.', ['funkcna-zona-4', 'funkcna-zona-1', 'funkcna-zona-2', 'funkcna-zona-5', 'funkcna-zona-3', 'funkcna-zona-6', 'funkcna-zona-7'], 'funkcna-zona-6'),
    ('tatami', 'Tatami', 'Samostatná miestnosť na cvičenie na podložkách.', ['tatami-1', 'tatami-2', 'tatami-3'], 'tatami-2'),
]
PAGES = [('index.html', 'Domov'), ('o-fitku.html', 'O fitku'), ('clenstva.html', 'Členstvá'), ('sluzby.html', 'Služby'), ('kontakt.html', 'Kontakt')]
ADDR = f"{GYM['street']} ({GYM['place']}), {GYM['zip']} {GYM['city']}"


def todo(note):
    """Viditeľná značka pre údaj, ktorý treba doplniť alebo potvrdiť pred zverejnením."""
    if not TODO_VISIBLE:
        return ''
    return f'<span class="todo"><b>Overiť</b> {e(note)}</span>'


def pic(sid, sizes, alt=None, lazy=True, cls='', eager_hi=False):
    f = FOTKY[sid]; big = f['big']; h1280 = round(f['h'] * 1280 / f['w'])
    ss = lambda ext: f'media/tour-{sid}-1280.{ext} 1280w, media/tour-{sid}-{big}.{ext} {big}w'
    load = 'fetchpriority="high"' if eager_hi else ('loading="lazy"' if lazy else '')
    c = f' class="{cls}"' if cls else ''
    return (f'<picture{c}><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="media/tour-{sid}-1280.jpg" srcset="{ss("jpg")}" sizes="{sizes}" width="1280" height="{h1280}" '
            f'alt="{e(f["alt"] if alt is None else alt)}" decoding="async" {load} style="object-position:{f["fx"]}% {f["fy"]}%"></picture>')


def stage(sid, extra_cls=''):
    f = FOTKY[sid]
    return (f'<div class="s3d{extra_cls}" data-depth="media/depth-{sid}.png" data-fx="{f["fx"]}" data-fy="{f["fy"]}">'
            f'{pic(sid, "100vw")}</div>')


ICON = {
    'arrow': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'ig': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    'fb': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    'menu': '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8"/></svg>',
    'x': '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"/></svg>',
}


def head(file, title, desc, og_img='og.jpg', extra=''):
    return f'''<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<!-- Návrh na posúdenie: kým prevádzka nepotvrdí údaje označené OVERIŤ, stránka sa neindexuje. Pred zverejnením odstrániť. -->
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#08090a">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link rel="canonical" href="{BASE_URL}{'' if file == 'index.html' else file}">
<meta property="og:type" content="website">
<meta property="og:locale" content="sk_SK">
<meta property="og:site_name" content="GYM KLUB Nitra">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{BASE_URL}media/{og_img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="../assets/fonts/BebasNeue-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="assets/style.css">
<!-- poistka: úvod sa odkryje najneskôr po 4,5 s, aj keby skript nenabehol alebo sa scéna načítavala dlho -->
<script>document.documentElement.classList.add('js');setTimeout(function(){{document.documentElement.classList.add('ready')}},4500)</script>
{extra}</head>'''


def header(file, over_hero=False):
    cur = ' aria-current="page"'
    links = '\n'.join(f'      <a href="{f}"{cur if f == file else ""}>{e(n)}</a>' for f, n in PAGES)
    return f'''<body class="{'home' if over_hero else 'sub'}">
<a class="skip" href="#obsah">Preskočiť na obsah</a>
<header class="bar{'' if over_hero else ' solid'}" id="bar">
  <a class="brand" href="index.html" aria-label="GYM KLUB Nitra, domov">
    <img src="../assets/img/logo-gymklub.png" width="104" height="38" alt="GYM KLUB">
  </a>
  <nav class="nav" aria-label="Hlavná navigácia">
{links}
  </nav>
  <a class="btn btn-sm bar-cta" href="kontakt.html#navsteva">Naplánovať návštevu</a>
  <button class="menu-btn" type="button" id="menuBtn" aria-expanded="false" aria-controls="menu" aria-label="Otvoriť menu">{ICON['menu']}</button>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Menu">
{links.replace('      <a', '    <a class="menu-a"')}
  </nav>
  <div class="menu-foot">
    <a class="btn" href="kontakt.html#navsteva">Naplánovať návštevu</a>
    <a class="menu-tel" href="tel:{GYM['tel']}">{GYM['phone']}</a>
  </div>
</div>
'''


def footer():
    links = ''.join(f'<li><a href="{f}">{e(n)}</a></li>' for f, n in PAGES)
    hours = ''.join(f'<li><span>{d}</span><span>{h}</span></li>' for d, h in HOURS)
    return f'''<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <img src="../assets/img/logo-gymklub.png" width="104" height="38" alt="GYM KLUB" loading="lazy">
      <address class="foot-addr">{e(GYM['full'])}<br>{GYM['street']} ({GYM['place']})<br>{GYM['zip']} {GYM['city']} – {GYM['district']}</address>
      <p class="foot-c"><a href="tel:{GYM['tel']}">{GYM['phone']}</a><br><a href="mailto:{GYM['email']}">{GYM['email']}</a></p>
      <p class="social"><a href="{GYM['instagram']}" target="_blank" rel="noopener" aria-label="Instagram GYM KLUB (nové okno)">{ICON['ig']}</a><a href="{GYM['facebook']}" target="_blank" rel="noopener" aria-label="Facebook GYM KLUB (nové okno)">{ICON['fb']}</a></p>
    </div>
    <div>
      <p class="foot-h">Stránky</p>
      <ul class="foot-l">{links}</ul>
    </div>
    <div>
      <p class="foot-h">Otváracie hodiny</p>
      <ul class="foot-hours">{hours}</ul>
      {todo('víkendové hodiny')}
    </div>
  </div>
  <div class="wrap foot-b">
    <p>© 2026 {e(GYM['full'])}</p>
    <p><a href="../">Klasická verzia webu</a> · <a href="https://www.gymklub.sk/" target="_blank" rel="noopener">gymklub.sk</a></p>
  </div>
</footer>

<div class="dock" id="dock">
  <a class="dock-a" href="clenstva.html">Členstvá</a>
  <a class="dock-a dock-main" href="kontakt.html#navsteva">Naplánovať návštevu</a>
</div>
'''


def phero(sid, kicker, title, lead, alt=''):
    return f'''<section class="phero" aria-labelledby="h-page">
    {pic(sid, "100vw", alt=alt, lazy=False, cls="phero-img", eager_hi=True)}
    <div class="wrap phero-in">
      <p class="kicker">{kicker}</p>
      <h1 class="h1" id="h-page">{title}</h1>
      <p class="lead">{lead}</p>
    </div>
  </section>'''


def page(file, title, desc, body, over_hero=False, extra_head='', scripts=True):
    doc = head(file, title, desc, extra=extra_head) + '\n' + header(file, over_hero) + '\n<main id="obsah">\n' + body + '\n</main>\n\n' + footer()
    if file == 'o-fitku.html':
        doc += LIGHTBOX
    doc += '\n<script src="assets/site.js" type="module"></script>\n</body>\n</html>\n'
    open(os.path.join(ROOT, file), 'w', encoding='utf-8').write(doc)


LIGHTBOX = '''
<dialog class="lb" id="lb" aria-label="Fotky fitka na celú obrazovku">
  <div class="lb-track" id="lbTrack"></div>
  <div class="lb-top">
    <p class="lb-cap" id="lbCap" aria-live="polite"></p>
    <button class="lb-x" type="button" id="lbClose" aria-label="Zavrieť"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
  </div>
  <button class="lb-nav lb-prev" type="button" data-dir="-1" aria-label="Predchádzajúca fotka"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
  <button class="lb-nav lb-next" type="button" data-dir="1" aria-label="Ďalšia fotka"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
</dialog>
'''


def plan_cards(link=True):
    out = []
    for p in PLANS:
        out.append(f'''<li class="plan{' plan-main' if p['main'] else ''}">
          {'<p class="plan-tag">Pri pravidelnom tréningu</p>' if p['main'] else ''}
          <h3 class="plan-h">{e(p['name'])}</h3>
          <p class="plan-price"><span>{p['price']}</span> / {p['per']}</p>
          <p class="plan-p">{e(p['text'])}</p>
          {f'<a class="btn{"" if p["main"] else " btn-ghost"}" href="kontakt.html#navsteva">Prísť si zacvičiť</a>' if link else ''}
        </li>''')
    return '<ul class="plans">' + '\n        '.join(out) + '</ul>'


# ---------------------------------------------------------------------------------------------
# DOMOV
JSONLD = json.dumps({
    '@context': 'https://schema.org', '@type': 'ExerciseGym', 'name': GYM['full'], 'url': BASE_URL,
    'image': BASE_URL + 'media/og.jpg', 'telephone': GYM['phone'], 'email': GYM['email'],
    'address': {'@type': 'PostalAddress', 'streetAddress': GYM['street'], 'addressLocality': GYM['city'], 'postalCode': GYM['zip'], 'addressCountry': 'SK'},
    'sameAs': [GYM['instagram'], GYM['facebook'], 'https://www.gymklub.sk/'],
}, ensure_ascii=False)

SERVICES_SHORT = [
    ('Fitness tréning', 'Samostatne na strojoch a s voľnými váhami, každý deň počas otváracích hodín. Netreba sa objednávať.', 'hlavna-sala-4'),
    ('Osobný tréning', 'Tréningový plán, technika a jedálniček podľa cieľa. Termín dohodnete priamo s trénerom.', 'volne-vahy-1'),
    ('Bojové športy', 'MMA, Jiu Jitsu a Luta Livre. Začať sa dá od úplných základov.', 'tatami-1'),
    ('Skupinové lekcie', 'Krav Maga, pilates a zdravý chrbát podľa týždenného rozvrhu.', 'tatami-3'),
]

home = f'''  <section class="hero" id="uvod" aria-labelledby="h-hero">
    <div class="hero-stage">
      <!-- úvodná scéna: skutočná fotka funkčnej zóny; skript ju zhasne, rozsvieti LED šesťuholníky a pri skrolovaní vojde kamera do priestoru -->
      <div class="hero-scene" id="heroScene" data-depth="media/depth-funkcna-zona-7.png" data-lights="media/lights-funkcna-zona-7.png">
        {pic('funkcna-zona-7', '100vw', alt='Funkčná zóna fitka GYM KLUB so stropom zo šesťuholníkových LED svetiel a červenou šprintérskou dráhou.', lazy=False, eager_hi=True)}
      </div>
      <div class="hero-in wrap" id="heroIn">
        <p class="hero-k">Fitness a bojové športy <span aria-hidden="true">·</span> Lipa Centrum, Nitra</p>
        <h1 class="hero-h" id="h-hero"><span>Tu sa nehrá na fitko.</span> <span class="hero-h2">Tu sa trénuje.</span></h1>
        <p class="hero-p">Plne klimatizované fitko na Výstavnej 6: stroje, voľné váhy, kardio, funkčná zóna so šprintérskou dráhou a samostatná miestnosť s tatami.</p>
        <div class="cta-row">
          <a class="btn" href="clenstva.html">Pozrieť členstvá</a>
          <a class="btn btn-ghost" href="kontakt.html#navsteva">Naplánovať návštevu</a>
        </div>
        <p class="hero-hint" aria-hidden="true">Skrolujte a vojdite dnu</p>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-preco">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Prečo GYM KLUB</p>
        <h2 class="h2" id="h-preco">Všetko na tréning pod jednou strechou</h2>
      </div>
      <ol class="reasons">
        <li class="rv"><span class="reason-n">01</span><h3 class="h3">Sedem priestorov</h3><p>Hlavná sála so strojmi, druhá sála s kladkami, kardio pri oknách, voľné váhy, funkčná zóna a tatami. Silový, kondičný aj bojový tréning na jednom mieste.</p></li>
        <li class="rv"><span class="reason-n">02</span><h3 class="h3">Tréneri na fitness aj boj</h3><p>Osobný tréning, MMA, Jiu Jitsu, Luta Livre, Krav Maga, pilates a zdravý chrbát. Inštruktori začnú aj s úplným začiatočníkom.</p></li>
        <li class="rv"><span class="reason-n">03</span><h3 class="h3">Bez objednávania</h3><p>Na samostatný tréning stačí prísť počas otváracích hodín. Jednorazový vstup alebo mesačná permanentka, MultiSport aj Upbalansea.</p></li>
      </ol>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-priestory">
    <div class="wrap sec-head rv">
      <p class="kicker">Priestory</p>
      <h2 class="h2" id="h-priestory">Pozrite sa dnu skôr, než prídete</h2>
      <p class="sec-p">Fotky sú z 26. septembra 2026, priamo z prevádzky. Hlavná fotka je priestorová: pohnite myšou alebo potiahnite prstom.</p>
    </div>
    <div class="wrap preview rv">
      {stage('hlavna-sala-2', ' preview-stage')}
      <ul class="preview-l">
        <li><a class="tile" href="o-fitku.html#kardio">{pic('kardio-1', '(max-width: 760px) 50vw, 25vw')}<span>Kardio</span></a></li>
        <li><a class="tile" href="o-fitku.html#funkcna-zona">{pic('funkcna-zona-6', '(max-width: 760px) 50vw, 25vw')}<span>Funkčná zóna</span></a></li>
        <li><a class="tile" href="o-fitku.html#volne-vahy">{pic('volne-vahy-2', '(max-width: 760px) 50vw, 25vw')}<span>Voľné váhy</span></a></li>
        <li><a class="tile" href="o-fitku.html#tatami">{pic('tatami-2', '(max-width: 760px) 50vw, 25vw')}<span>Tatami</span></a></li>
      </ul>
    </div>
    <div class="wrap more rv"><a class="link" href="o-fitku.html">Prejsť celé fitko {ICON['arrow']}</a></div>
  </section>

  <section class="sec" aria-labelledby="h-sluzby">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Služby</p>
        <h2 class="h2" id="h-sluzby">Vyberte si, ako chcete trénovať</h2>
      </div>
      <ul class="svc">
        {''.join(f'<li class="svc-i rv"><a href="sluzby.html#{["fitness","osobny-trening","bojove-sporty","lekcie"][i]}">{pic(s[2], "(max-width: 760px) 100vw, 25vw")}<span class="svc-t"><span class="h3">{e(s[0])}</span><span class="svc-p">{e(s[1])}</span></span></a></li>' for i, s in enumerate(SERVICES_SHORT))}
      </ul>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-clenstva">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Členstvá</p>
        <h2 class="h2" id="h-clenstva">Začnite jedným vstupom</h2>
        <p class="sec-p">Jednorazový vstup bez viazanosti alebo mesačná permanentka. {todo(PRICES_NOTE)}</p>
      </div>
      <div class="rv">{plan_cards()}</div>
      <div class="more rv"><a class="link" href="clenstva.html">Všetky vstupy a podmienky {ICON['arrow']}</a></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-prva">
    <div class="wrap first">
      <div class="rv">
        <p class="kicker">Prvá návšteva</p>
        <h2 class="h2" id="h-prva">Príďte si to prejsť naživo</h2>
        <div class="cta-row"><a class="btn" href="kontakt.html#navsteva">Naplánovať návštevu</a><a class="btn btn-ghost" href="tel:{GYM['tel']}">Zavolať {GYM['phone']}</a></div>
      </div>
      <ol class="steps rv">
        <li><b>Príďte počas otváracích hodín.</b> Na samostatný fitness tréning sa netreba objednávať. Vstup zaplatíte na recepcii.</li>
        <li><b>Zoberte si čistú obuv, uterák a vodu.</b> Šatne a sprchy sú k dispozícii. MultiSport alebo Upbalansea ukážte pri príchode.</li>
        <li><b>Chcete lekciu alebo trénera?</b> Na lekciu príďte podľa rozvrhu, osobný tréning dohodnete priamo s trénerom.</li>
      </ol>
    </div>
  </section>'''
page('index.html', 'GYM KLUB Nitra | Fitness a bojové športy v Lipa Centre',
     'Plne klimatizované fitko na Výstavnej 6 v Nitre (Lipa Centrum): stroje, voľné váhy, kardio, funkčná zóna, tatami. Fitness, osobné tréningy, MMA, Jiu Jitsu, Krav Maga, pilates.',
     home, over_hero=True, extra_head=f'<script type="application/ld+json">{JSONLD}</script>\n')

# ---------------------------------------------------------------------------------------------
# O FITKU
zones = []
gi = 0
for zi, (zid, name, line, ids, lead) in enumerate(ZONES, 1):
    items = []
    for n, sid in enumerate(ids, 1):
        f = FOTKY[sid]
        items.append(f'''          <li class="rail-i"><a class="ph" href="media/tour-{sid}-{f['big']}.jpg" data-i="{gi}" data-src="tour-{sid}" data-big="{f['big']}" data-w="{f['w']}" data-h="{f['h']}" data-zone="{e(name)}" aria-label="{e(name)}, fotka {n} z {len(ids)}: zväčšiť">{pic(sid, "(max-width: 760px) 44vw, 240px")}</a></li>''')
        gi += 1
    zones.append(f'''    <article class="zone rv" id="{zid}" aria-labelledby="h-{zid}">
      <div class="wrap zone-head">
        <div>
          <p class="zone-n">{zi:02d} <span>/ {len(ZONES):02d}</span></p>
          <h2 class="zone-h" id="h-{zid}">{e(name)}</h2>
          <p class="zone-p">{e(line)}</p>
        </div>
        <div class="rail-ctl" hidden>
          <span class="rail-count" aria-hidden="true"><b>1</b> / {len(ids)}</span>
          <button class="rail-btn" type="button" data-dir="-1" aria-label="Predchádzajúce fotky: {e(name)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="rail-btn" type="button" data-dir="1" aria-label="Ďalšie fotky: {e(name)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
        </div>
      </div>
      {stage(lead)}
      <ul class="rail" aria-label="Fotky: {e(name)}">
{chr(10).join(items)}
      </ul>
    </article>''')

about = phero('hlavna-sala-3', 'O fitku', 'Old-school posilka, poriadne vybavenie',
              'Fitko na Výstavnej 6 v Lipa Centre. Za recepciou sú dve sály so strojmi, kardio pri oknách, voľné váhy, tmavá funkčná zóna so šprintérskou dráhou a samostatná miestnosť s tatami.') + f'''

  <section class="facts" aria-label="Základné informácie">
    <ul class="wrap facts-l">
      <li><span class="facts-k">Adresa</span><span class="facts-v">{GYM['street']}, {GYM['place']}</span></li>
      <li><span class="facts-k">Priestory</span><span class="facts-v">7 priestorov, 30 fotiek</span></li>
      <li><span class="facts-k">Klíma</span><span class="facts-v">Plne klimatizované</span></li>
    </ul>
  </section>

  <section class="tour" id="prehliadka" aria-labelledby="h-tour">
    <div class="wrap sec-head rv">
      <p class="kicker">Prehliadka</p>
      <h2 class="h2" id="h-tour">Od vchodu po tatami</h2>
      <p class="sec-p">Veľká fotka každého priestoru je priestorová, pohnite myšou alebo potiahnite prstom. Pod ňou potiahnutím prejdete ďalšie fotky, ťuknutím ich otvoríte na celú obrazovku.</p>
    </div>
{chr(10).join(zones)}
  </section>

  <section class="sec sec-dark" aria-labelledby="h-zazemie">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Zázemie</p>
        <h2 class="h2" id="h-zazemie">Čo nájdete okrem strojov</h2>
      </div>
      <ul class="checks rv">
        <li>Recepcia s nápojmi, kde zaplatíte vstup alebo permanentku.</li>
        <li>Šatne a sprchy.</li>
        <li>Klimatizácia v celom fitku.</li>
        <li>Samostatná miestnosť s tatami pre bojové športy a lekcie.</li>
      </ul>
    </div>
  </section>
'''


def cta_band(title='Príďte si to prejsť naživo', text='Na samostatný tréning sa netreba objednávať. Ak chcete, aby vás niekto previedol, dajte vedieť vopred.'):
    return f'''<section class="band" aria-labelledby="h-band">
    <div class="wrap band-in rv">
      <h2 class="h2" id="h-band">{title}</h2>
      <p class="sec-p">{text}</p>
      <div class="cta-row"><a class="btn" href="kontakt.html#navsteva">Naplánovať návštevu</a><a class="btn btn-ghost" href="clenstva.html">Pozrieť členstvá</a></div>
    </div>
  </section>'''


page('o-fitku.html', 'O fitku | GYM KLUB Nitra',
     'Prehliadka fitka GYM KLUB v Lipa Centre v Nitre: príchod, hlavná sála, sála so strojmi, kardio, voľné váhy, funkčná zóna a tatami na 30 skutočných fotkách.',
     about + cta_band())

# ---------------------------------------------------------------------------------------------
# ČLENSTVÁ
more_rows = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td><td class="num">{c}</td></tr>' for a, b, c in MORE)
terms = ''.join(f'<li>{e(t)}</li>' for t in TERMS)
members = phero('volne-vahy-2', 'Členstvá a cenník', 'Začnite jedným vstupom',
                'Jednorazový vstup, balík vstupov alebo mesačná permanentka. Na samostatný tréning sa netreba objednávať.') + f'''

  <section class="sec" aria-labelledby="h-plans">
    <div class="wrap">
      <div class="sec-head rv">
        <h2 class="h2" id="h-plans">Fitness vstupy</h2>
        <p class="sec-p">{todo(PRICES_NOTE)}</p>
      </div>
      <div class="rv">{plan_cards()}</div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-calc">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Porovnanie</p>
        <h2 class="h2" id="h-calc">Čo sa vám oplatí</h2>
        <p class="sec-p">Posuňte, koľkokrát do mesiaca prídete. Porovnanie jednotlivých vstupov a mesačnej permanentky podľa cien vyššie. Balíky 10 a 20 vstupov vychádzajú na 5 € a 4 € za vstup.</p>
      </div>
      <div class="calc rv" id="calc" data-single="6" data-month="50">
        <label class="calc-l" for="calcN">Tréningov za mesiac: <output id="calcOut" for="calcN">8</output></label>
        <input type="range" id="calcN" min="1" max="30" value="8">
        <p class="calc-r" id="calcR" aria-live="polite"></p>
        <noscript><p class="calc-r">Do 8 tréningov mesačne vychádzajú lacnejšie jednotlivé vstupy (8 × 6 € = 48 €), od 9. tréningu permanentka za 50 €.</p></noscript>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-more">
    <div class="wrap two">
      <div class="rv">
        <h2 class="h2" id="h-more">Ďalšie vstupy</h2>
      </div>
      <div class="rv">
        <table class="table">
          <caption class="sr-only">Ďalšie vstupy a permanentky</caption>
          <thead><tr><th scope="col">Vstup</th><th scope="col">Poznámka</th><th scope="col" class="num">Cena</th></tr></thead>
          <tbody>{more_rows}</tbody>
        </table>
        <p class="sec-p">{todo('platnosť balíkov 10 a 20 vstupov')}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-terms">
    <div class="wrap two">
      <div class="rv">
        <h2 class="h2" id="h-terms">Podmienky</h2>
      </div>
      <div class="rv">
        <ul class="checks">{terms}</ul>
        <p class="sec-p">{todo('platba len v hotovosti, prijímanie MultiSport a Upbalansea')}</p>
      </div>
    </div>
  </section>
  {cta_band('Prvý vstup si zaplatíte na recepcii', 'Príďte počas otváracích hodín, nič netreba vopred rezervovať. Ak máte otázku k permanentke, napíšte alebo zavolajte.')}'''
page('clenstva.html', 'Členstvá a cenník | GYM KLUB Nitra',
     'Ceny vstupov a permanentiek vo fitku GYM KLUB Nitra: jednorazový vstup, balíky vstupov, mesačná permanentka, študent a dôchodca. Podmienky a spôsob platby.',
     members)

# ---------------------------------------------------------------------------------------------
# SLUŽBY
def when(name):
    out = [f'{DAYS[d][:2]} {a} – {b}' for d, a, b, n, c in TIMETABLE if n == name]
    return ' · '.join(out)


SVC = [
    ('fitness', 'Fitness tréning', 'Každý deň počas otváracích hodín', 'Samostatný silový tréning na strojoch, s voľnými váhami a na kardio zariadeniach. Na samostatný tréning sa netreba objednávať.', 'hlavna-sala-4', None),
    ('osobny-trening', 'Osobný tréning', 'Termín podľa dohody s trénerom', 'Diagnostika pohybu, správna technika, tréningový plán a jedálniček podľa cieľa. Tréneri pripravia aj na súťaž vo fitness a silovom trojboji.', 'volne-vahy-1', None),
    ('bojove-sporty', 'Bojové športy', when('Bojové športy'), 'MMA, Jiu Jitsu a Luta Livre (no-gi, bez kimona) s Michalom Šášikom. Postoj s prvkami boxu, kickboxu a juda, na zemi páky, škrtenia a obrana proti nim. Začať sa dá od úplných základov.', 'tatami-1', None),
    ('krav-maga', 'Krav Maga', when('Krav Maga'), 'Praktická sebaobrana s Tomášom Židekom a Slavom Jurom. Jednoduché techniky pre reálne situácie, bez predchádzajúcich skúseností.', 'tatami-3', None),
    ('zdravy-chrbat', 'Zdravý chrbát', when('Zdravý chrbát'), 'Cvičenie s Nikol Molnárovou: posilnenie trupu, správne držanie tela a uvoľnenie stuhnutých svalov. S malými činkami a na karimatke, vhodné aj pri sedavej práci.', 'tatami-2', None),
    ('pilates', 'Pilates', when('Pilates'), 'Pilates s Majkou Navrátilovou pre stabilitu, mobilitu a pevný stred tela. Pokojnejšie tempo a presné prevedenie.', 'tatami-1', None),
    ('vyziva', 'Nutričné poradenstvo', 'Podľa dohody', 'Analýza telesného zloženia a stravovací protokol s Jaroslavom Šoltísom, výživové poradenstvo aj u Mgr. Tomáša Králika.', 'recepcia-1', None),
]
svc_html = []
for i, (sid_, name, time, text, photo, _) in enumerate(SVC):
    svc_html.append(f'''    <article class="svc-row rv{' svc-rev' if i % 2 else ''}" id="{sid_}" aria-labelledby="h-{sid_}">
      <div class="svc-media">{pic(photo, "(max-width: 760px) 100vw, 50vw")}</div>
      <div class="svc-body">
        <p class="kicker">{e(time)}</p>
        <h2 class="h2 h2-s" id="h-{sid_}">{e(name)}</h2>
        <p class="sec-p">{e(text)}</p>
      </div>
    </article>''')
lekcie_anchor = '<span id="lekcie" class="anchor"></span>'

rows = []
for d in range(7):
    items = [f'<li><b>{a} – {b}</b> {e(n)}<span>{e(c)}</span></li>' for dd, a, b, n, c in TIMETABLE if dd == d]
    rows.append(f'<div class="tt-day"><h3 class="tt-h">{DAYS[d]}</h3>' + (f'<ul>{"".join(items)}</ul>' if items else '<p class="tt-none">Fitness počas otváracích hodín</p>') + '</div>')

coach_html = ''.join(
    f'<li class="coach"><p class="coach-tag">{e(t)}</p><h3 class="h3">{e(n)}</h3><p>{e(x)}</p>'
    + (f'<a class="coach-tel" href="tel:{p.replace(" ", "")}">{p}</a>' if p else '<p class="coach-tel coach-none">Kontakt na recepcii</p>') + '</li>'
    for n, t, x, p in COACHES)

services = phero('funkcna-zona-2', 'Služby', 'Vyberte si smer, ktorý vám sadne',
                 'Samostatný tréning celý deň, osobný tréner podľa dohody, bojové športy a skupinové lekcie podľa rozvrhu.') + f'''

  <section class="sec" aria-label="Služby">
    <div class="wrap svc-list">
{chr(10).join(svc_html[:3])}
      {lekcie_anchor}
{chr(10).join(svc_html[3:])}
    </div>
  </section>

  <section class="sec sec-dark" id="rozvrh" aria-labelledby="h-rozvrh">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Rozvrh</p>
        <h2 class="h2" id="h-rozvrh">Lekcie v týždni</h2>
        <p class="sec-p">Na lekciu príďte podľa rozvrhu, prvýkrát stačí športové oblečenie a voda. {todo('rozvrh lekcií podľa gymklub.sk k 27. 9. 2026')}</p>
      </div>
      <div class="tt rv">{''.join(rows)}</div>
    </div>
  </section>

  <section class="sec" id="treneri" aria-labelledby="h-treneri">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Tréneri</p>
        <h2 class="h2" id="h-treneri">Ľudia, ktorí vás posunú</h2>
        <p class="sec-p">Osobný tréning dohodnete priamo s trénerom. Ak telefón nie je uvedený, pomôžu na recepcii alebo na čísle <a href="tel:{GYM['tel']}">{GYM['phone']}</a>. {todo('zoznam aktívnych trénerov: menu a stránka trénerov na gymklub.sk sa líšia')}</p>
      </div>
      <ul class="coaches rv">{coach_html}</ul>
    </div>
  </section>
  {cta_band('Nie ste si istí, čo si vybrať?', 'Napíšte, čo chcete dosiahnuť, a odporučíme lekciu alebo trénera. Prvýkrát stačí športové oblečenie a voda.')}'''
page('sluzby.html', 'Služby a tréneri | GYM KLUB Nitra',
     'Fitness tréning, osobní tréneri, MMA, Jiu Jitsu, Luta Livre, Krav Maga, pilates, zdravý chrbát a nutričné poradenstvo v GYM KLUB Nitra. Rozvrh lekcií a kontakty na trénerov.',
     services)

# ---------------------------------------------------------------------------------------------
# KONTAKT
hours_rows = ''.join(f'<tr><th scope="row">{d}</th><td class="num">{h}</td></tr>' for d, h in HOURS)
FAQ = [
    ('Musím sa objednať?', 'Na samostatný fitness tréning nie, stačí prísť počas otváracích hodín. Na lekcie príďte podľa rozvrhu, osobný tréning dohodnete priamo s trénerom.'),
    ('Potrebujem skúsenosti s bojovými športmi?', 'Nie. Inštruktori začnú aj od úplných základov. Prvýkrát stačí športové oblečenie a voda.'),
    ('Ako môžem zaplatiť?', 'Na recepcii, podľa gymklub.sk len v hotovosti. Prijímame MultiSport a Upbalansea app.'),
    ('Kde parkovať?', None),
]
faq_html = ''.join(
    f'<details class="faq-i"><summary>{e(q)}</summary><p>{e(a) if a else todo("parkovanie pri Lipa Centre – doplniť, ak je k dispozícii")}</p></details>'
    for q, a in FAQ)
contact = phero('vstup-1', 'Kontakt', 'Príďte sa pozrieť',
                'Výstavná 6, Lipa Centrum, Nitra-Chrenová. Vchod je z krytej terasy, dvere pod nápisom GYM KLUB &amp; caffee.') + f'''

  <section class="sec" aria-labelledby="h-kde">
    <div class="wrap contact-grid">
      <div class="rv">
        <h2 class="h2 h2-s" id="h-kde">Adresa a spojenie</h2>
        <address class="c-addr">{e(GYM['full'])}<br>{GYM['street']} ({GYM['place']})<br>{GYM['zip']} {GYM['city']} – {GYM['district']}</address>
        <ul class="c-list">
          <li><span class="c-l">Telefón</span><a class="c-v" href="tel:{GYM['tel']}">{GYM['phone']}</a></li>
          <li><span class="c-l">E-mail</span><a class="c-v" href="mailto:{GYM['email']}">{GYM['email']}</a></li>
          <li><span class="c-l">Sociálne siete</span><span class="c-v c-soc"><a href="{GYM['instagram']}" target="_blank" rel="noopener">Instagram</a> · <a href="{GYM['facebook']}" target="_blank" rel="noopener">Facebook</a></span></li>
        </ul>
      </div>
      <div class="rv">
        <h2 class="h2 h2-s">Otváracie hodiny</h2>
        <table class="table">
          <caption class="sr-only">Otváracie hodiny fitness centra</caption>
          <tbody>{hours_rows}</tbody>
        </table>
        <p class="sec-p">Počas sviatkov overte hodiny telefonicky. {todo(HOURS_NOTE)}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-mapa">
    <div class="wrap">
      <h2 class="h2 h2-s rv" id="h-mapa">Mapa</h2>
      <div class="map rv" id="map">
        {pic('terasa-1', '(max-width: 760px) 100vw, 1240px', alt='')}
        <div class="map-in">
          <p>Mapa sa načíta z Map Google až po kliknutí.</p>
          <div class="cta-row"><button class="btn" type="button" id="mapLoad" data-src="{GYM['embed']}">Zobraziť mapu</button><a class="btn btn-ghost" href="{GYM['maps']}" target="_blank" rel="noopener">Navigovať</a></div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="navsteva" aria-labelledby="h-form">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Naplánovať návštevu</p>
        <h2 class="h2" id="h-form">Napíšte nám</h2>
        <p class="sec-p">Kedy chcete prísť, čo vás zaujíma a ako vás máme kontaktovať. Formulár pripraví e-mail vo vašom e-mailovom programe, nič sa neukladá. Radšej voláte? <a href="tel:{GYM['tel']}">{GYM['phone']}</a></p>
        <p class="sec-p">{todo('napojenie formulára na službu, ktorá doručí správu aj bez e-mailového programu (napr. Formspree), ak ho chcete')}</p>
      </div>
      <form class="form rv" id="form" action="mailto:{GYM['email']}" method="post" enctype="text/plain" novalidate>
        <div class="f-row">
          <label for="fName">Meno <span aria-hidden="true">*</span></label>
          <input id="fName" name="meno" autocomplete="name" required aria-describedby="fNameErr">
          <p class="f-err" id="fNameErr" hidden>Napíšte meno.</p>
        </div>
        <div class="f-row">
          <label for="fContact">Telefón alebo e-mail <span aria-hidden="true">*</span></label>
          <input id="fContact" name="kontakt" autocomplete="email" inputmode="email" required aria-describedby="fContactErr">
          <p class="f-err" id="fContactErr" hidden>Napíšte telefón alebo e-mail, aby sme vám vedeli odpovedať.</p>
        </div>
        <div class="f-row">
          <label for="fTopic">Čo vás zaujíma</label>
          <select id="fTopic" name="tema">
            <option>Prvá návšteva</option><option>Členstvo a ceny</option><option>Osobný tréning</option><option>Bojové športy</option><option>Skupinové lekcie</option><option>Iné</option>
          </select>
        </div>
        <div class="f-2">
          <div class="f-row"><label for="fDate">Kedy by ste prišli</label><input id="fDate" name="datum" type="date"></div>
          <div class="f-row"><label for="fTime">Približný čas</label><input id="fTime" name="cas" type="time"></div>
        </div>
        <div class="f-row">
          <label for="fMsg">Správa</label>
          <textarea id="fMsg" name="sprava" rows="4"></textarea>
        </div>
        <button class="btn" type="submit">Pripraviť e-mail</button>
        <p class="f-ok" id="fOk" role="status" hidden>Otvoril sa váš e-mailový program s pripravenou správou. Ak sa neotvoril, napíšte na <a href="mailto:{GYM['email']}">{GYM['email']}</a> alebo zavolajte.</p>
      </form>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-faq">
    <div class="wrap two">
      <div class="rv"><p class="kicker">Otázky</p><h2 class="h2" id="h-faq">Pred prvým tréningom</h2></div>
      <div class="faq rv">{faq_html}</div>
    </div>
  </section>'''
page('kontakt.html', 'Kontakt a otváracie hodiny | GYM KLUB Nitra',
     'GYM KLUB, Výstavná 6 (Lipa Centrum), 949 01 Nitra. Telefón +421 944 800 394, e-mail info@gymklub.sk, otváracie hodiny, mapa a formulár na naplánovanie návštevy.',
     contact)
print('hotovo')
