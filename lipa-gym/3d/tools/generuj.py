#!/usr/bin/env python3
"""Vygeneruje 6 stránok webu GYM KLUB (index, o-fitku, clenstva, sluzby, mma, kontakt) so spoločnou
hlavičkou, navigáciou a pätičkou. Spustenie z priečinka lipa-gym/3d:  python3 tools/generuj.py

Všetky fakty o prevádzke sú v slovníkoch nižšie. Údaje, ktoré prevádzka ešte nepotvrdila,
sú na stránke označené značkou „Doplniť: …“ (funkcia todo); pred zverejnením ich treba získať
alebo potvrdiť a značku odstrániť (TODO_VISIBLE = False ich skryje všetky naraz).

Art direction: čierna, kostená biela a signálna červená zo značenia podlahy vo funkčnej zóne,
písmo Archivo (variabilná šírka a váha) a IBM Plex Mono na údaje. Nadpisy s atribútom data-kt
skript rozdelí na slová a odkryje ich; bez skriptu alebo pri obmedzenom pohybe je všetko hneď vidno.
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTKY = json.load(open(os.path.join(ROOT, 'tools', 'fotky.json'), encoding='utf-8'))
BASE_URL = 'https://d8f5s88zjy-art.github.io/head-spa-30/lipa-gym/3d/'
TODO_VISIBLE = True
e = lambda t: html.escape(t, quote=True)

# ---------------------------------------------------------------------------------------------
# Fakty. Zdroj: gymklub.sk – úvod, cenník, časté otázky, kontakt, tréneri a stránky tréningov
# (stiahnuté 28. 9. 2026; server uvádza poslednú úpravu webu 12. 4. 2025). Oficiálny názov: Gym Klub Fitness & Bodybuilding.
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
HOURS = [('Pondelok – štvrtok', '06:30 – 21:00'), ('Piatok', '06:30 – 23:00'), ('Sobota – nedeľa', 'kratšie, overte telefonicky')]
HOURS_NOTE = 'víkendové hodiny. Gymklub.sk uvádza v otázkach a v rozvrhu 08:00 – 17:00, v pätičke a na stránke Kontakt 08:30 – 18:00.'
PRICES_NOTE = 'potvrdenie, že ceny platia aj v roku 2026. Sú z cenníka na gymklub.sk, ktorý bol naposledy upravený 12. 4. 2025.'
PLANS = [
    {'name': 'Jednorazový vstup', 'price': '6', 'per': '1 vstup', 'text': 'Jeden fitness tréning v celom fitku. Bez viazanosti, na vyskúšanie alebo keď chodíte nepravidelne.', 'cards': 'MultiSport, Upbalansea app', 'main': False},
    {'name': 'Permanentka klasická', 'price': '50', 'per': 'mesiac', 'text': 'Fitness tréningy počas celého mesiaca. Pri 9 a viac tréningoch mesačne vychádza lacnejšie než jednotlivé vstupy.', 'cards': 'Upbalansea app', 'main': True},
    {'name': 'Permanentka študent', 'price': '42', 'per': 'mesiac', 'text': 'Fitness tréningy počas celého mesiaca so zľavou pre študentov.', 'cards': 'Upbalansea app', 'main': False},
]
MORE = [('10 krát vstup', '10 fitness tréningov, 5 € za vstup', 'Upbalansea app', '50 €'), ('20 krát vstup', '20 fitness tréningov, 4 € za vstup', 'Upbalansea app', '80 €'),
        ('Študent · jednorazový vstup', '1 fitness tréning', 'Upbalansea app', '5 €'), ('Dôchodca · jednorazový vstup', '1 fitness tréning', 'Upbalansea app', '3,50 €')]
TERMS = ['Platí sa na recepcii, a to podľa gymklub.sk len v hotovosti. Platobnou kartou sa platiť nedá.',
         'Upbalansea app je v cenníku uvedená pri všetkých vstupoch a permanentkách.',
         'MultiSport je v cenníku uvedený len pri jednorazovom vstupe za 6 €.',
         'Ceny platia pre samostatný fitness tréning. Cenu bojových športov, lekcií a osobného tréningu dohodnete priamo s trénerom.',
         'Na samostatný tréning sa netreba objednávať.']
TIMETABLE = [  # deň 0 = pondelok
    (0, '16:00', '17:00', 'Pilates', 'Majka Navrátilová'), (0, '17:00', '18:30', 'Krav Maga', 'Tomáš Židek'),
    (1, '17:00', '19:00', 'Bojové športy', 'Michal Šášik'), (1, '18:00', '19:00', 'Zdravý chrbát', 'Nikol Molnárová'),
    (2, '18:00', '19:00', 'Pilates', 'Majka Navrátilová'),
    (3, '17:00', '19:00', 'Bojové športy', 'Michal Šášik'), (3, '18:00', '19:00', 'Zdravý chrbát', 'Nikol Molnárová'),
    (5, '13:00', '15:00', 'Bojové športy', 'Michal Šášik'),
]
DAYS = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa']
COACHES = [  # (meno, zameranie, text, telefón alebo None) – podľa stránky Tréneri a stránok tréningov na gymklub.sk
    ('Michal Šášik', 'Bojové športy · Panda Fight Club', 'MMA, Luta Livre a Jiu Jitsu. Postoj s prvkami boxu, kickboxu a juda, na zemi páky a škrtenia.', '0905 930 597'),
    ('Mgr. Tomáš Králik', 'Fitness', 'Výživové poradenstvo, kondičný tréning, box, MMA a grappling (fialový pás v BJJ).', '0908 484 155'),
    ('Jakub Vrána', 'Fitness', 'Prevencia zranení, mobilita, správna technika, tréningový plán a strava podľa cieľa.', None),
    ('Jozef Humay', 'Fitness', 'Majster Slovenska a Československa v športovej kulturistike. Kulturistika, fitness a jedálniček.', '0907 736 944'),
    ('Tomáš Židek', 'Krav Maga', 'Lekcia Krav Maga v pondelok 17:00 – 18:30.', '0903 776 825'),
    ('Slavo Juro', 'Krav Maga', 'Inštruktor Krav Maga.', '+421 903 616 451'),
    ('Nikol Molnárová', 'Zdravý chrbát', 'Posilnenie trupu, správne držanie tela, uvoľnenie stuhnutých svalov. Vhodné pre začiatočníkov.', '+421 948 899 131'),
    ('Majka Navrátilová', 'Pilates', 'Lekcie pilatesu v pondelok a v stredu.', '+421 907 795 803'),
    ('Kristián Filipčík', 'Fitness', 'Osobné fitness tréningy.', '0902 203 379'),
    ('Jaroslav Šoltís', 'Nutričné poradenstvo', 'Výživa a stravovanie.', None),
]
# zóny: id, názov, popis, fotky v galérii, hlavná fotka, druhá fotka do kompozície, vybavenie viditeľné na fotkách
ZONES = [
    ('prichod', 'Príchod a recepcia', 'Vchod je z krytej terasy Lipa Centra, dvere pod nápisom GYM KLUB & caffee. Hneď za nimi je recepcia s nápojmi a polička na obuv, tu zaplatíte vstup.',
     ['terasa-1', 'vstup-1', 'recepcia-1'], 'vstup-1', 'recepcia-1', ['Recepcia', 'Nápoje', 'Polička na obuv']),
    ('hlavna-sala', 'Hlavná sála', 'Najviac strojov na jednom mieste: viacstaničné kladkové veže, stroje so záťažou na jednotlivé partie, kotúčové jednoručky a zrkadlová stena.',
     ['hlavna-sala-1', 'hlavna-sala-2', 'hlavna-sala-4', 'hlavna-sala-5', 'hlavna-sala-3', 'hlavna-sala-6'], 'hlavna-sala-2', 'hlavna-sala-4', ['Kladkové veže', 'Stroje na partie', 'Kotúčové jednoručky', 'Zrkadlová stena']),
    ('sala-so-strojmi', 'Sála so strojmi', 'Druhá, svetlá sála s veľkými oknami: kladkové stroje, polohovateľné lavice, lavice so stojanmi na osi a stojan s pevnými činkami.',
     ['stroje-4', 'stroje-1', 'stroje-2', 'stroje-3'], 'stroje-4', 'stroje-2', ['Kladkové stroje', 'Polohovateľné lavice', 'Stojany na osi', 'Pevné činky']),
    ('kardio', 'Kardio', 'Rad bežeckých pásov Life Fitness pri oknách s výhľadom do zelene, eliptický a schodový trenažér. Hodí sa na rozcvičenie aj samostatný kardio tréning.',
     ['kardio-3', 'kardio-1', 'kardio-2'], 'kardio-1', 'kardio-2', ['Bežecké pásy Life Fitness', 'Eliptický trenažér', 'Schodový trenažér', 'Spinningové bicykle']),
    ('volne-vahy', 'Voľné váhy', 'Stojany s jednoručkami pri zrkadlách, samostatný stojan s gumovými jednoručkami do 20 kg, lavice so stojanmi na osi, kotúče a lavica na bicepsy.',
     ['volne-vahy-1', 'volne-vahy-2', 'volne-vahy-3', 'jednorucky-1'], 'volne-vahy-2', 'jednorucky-1', ['Jednoručky pri zrkadlách', 'Jednoručky do 20 kg', 'Lavice so stojanmi', 'Lavica na bicepsy']),
    ('funkcna-zona', 'Funkčná zóna', 'Priestor na kondičný a funkčný tréning: šprintérska dráha na podlahe, rig Life Fitness so závesnými popruhmi a boxovacím vrecom, kettlebelly, medicinbaly a vzduchový bicykel.',
     ['funkcna-zona-4', 'funkcna-zona-1', 'funkcna-zona-2', 'funkcna-zona-5', 'funkcna-zona-3', 'funkcna-zona-6', 'funkcna-zona-7'], 'funkcna-zona-6', 'funkcna-zona-2', ['Šprintérska dráha', 'Rig Life Fitness', 'Závesné popruhy', 'Kettlebelly', 'Vzduchový bicykel']),
    ('tatami', 'Tatami', 'Samostatná miestnosť bez strojov: podložky, zrkadlová stena, švédska rebrina a závesné popruhy.',
     ['tatami-1', 'tatami-2', 'tatami-3'], 'tatami-2', 'tatami-3', ['Podložky', 'Zrkadlová stena', 'Švédska rebrina', 'Závesné popruhy']),
]
PAGES = [('index.html', 'Domov'), ('o-fitku.html', 'Prehliadka'), ('clenstva.html', 'Cenník'), ('sluzby.html', 'Služby'), ('mma.html', 'MMA'), ('kontakt.html', 'Kontakt')]
# Panda Fight Club: klub bojových športov, ktorý trénuje v GYM KLUB. Zdroje: pandafightclub.webnode.sk,
# gymklub.sk, instagram.com/pandafightclubnitra, orlyfyzickejaktivity.eu (28. 9. 2026).
PANDA = {
    'name': 'Panda Fight Club Nitra', 'coach': 'Michal Šášik', 'phone': '0905 930 597', 'tel': '+421905930597',
    'email': 'pandafightclub@gmail.com',
    'instagram': 'https://www.instagram.com/pandafightclubnitra/', 'facebook': 'https://www.facebook.com/PFCNR/',
    'web': 'https://pandafightclub.webnode.sk/',
    'award': 'https://www.orlyfyzickejaktivity.eu/profile-28362-panda-fight-club-nitra',
}
PANDA_SCHEDULE_NOTE = ('platný rozvrh od trénera. Zdroje sa líšia: gymklub.sk Ut a Št 17:00 – 19:00, So 13:00 – 15:00; '
                       'web Panda Fight Club Št 16:00 – 18:00, So a Ne 13:00 – 15:00.')
NEWTAB = ' target="_blank" rel="noopener"'
ADDR = f"{GYM['street']} ({GYM['place']}), {GYM['zip']} {GYM['city']}"


def todo(note):
    """Viditeľná značka pre údaj, ktorý treba doplniť alebo potvrdiť pred zverejnením."""
    if not TODO_VISIBLE:
        return ''
    return f'<span class="todo"><b>Doplniť:</b> {e(note)}</span>'


def pic(sid, sizes, alt=None, lazy=True, cls='', eager_hi=False, pos=None):
    """Skutočná fotka z prevádzky. AVIF v troch šírkach, WebP 1280 px ako záloha pre prehliadače bez AVIF,
    malé JPG len pre najstaršie prehliadače."""
    f = FOTKY[sid]; big = f['big']; h1280 = round(f['h'] * 1280 / f['w'])
    avif = f'media/tour-{sid}-480.avif 480w, media/tour-{sid}-1280.avif 1280w, media/tour-{sid}-{big}.avif {big}w'
    load = 'fetchpriority="high"' if eager_hi else ('loading="lazy"' if lazy else '')
    c = f' class="{cls}"' if cls else ''
    op = pos or f'{f["fx"]}% {f["fy"]}%'
    return (f'<picture{c}><source type="image/avif" srcset="{avif}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="media/tour-{sid}-1280.webp 1280w" sizes="{sizes}">'
            f'<img src="media/tour-{sid}-480.jpg" width="1280" height="{h1280}" '
            f'alt="{e(f["alt"] if alt is None else alt)}" decoding="async" {load} style="object-position:{op}"></picture>')


def pic_panda(n, sizes, alt, lazy=True, eager_hi=False, cls=''):
    """Fotky sály Panda Fight Club z gymklub.sk (1200 × 800)."""
    b = f'media/panda-sala-{n}'
    load = 'fetchpriority="high"' if eager_hi else ('loading="lazy"' if lazy else '')
    c = f' class="{cls}"' if cls else ''
    return (f'<picture{c}><source type="image/avif" srcset="{b}-640.avif 640w, {b}-1200.avif 1200w" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{b}-640.webp 640w, {b}-1200.webp 1200w" sizes="{sizes}">'
            f'<img src="{b}-1200.jpg" srcset="{b}-640.jpg 640w, {b}-1200.jpg 1200w" sizes="{sizes}" width="1200" height="800" '
            f'alt="{e(alt)}" decoding="async" {load}></picture>')


PANDA_ALT = ['Sála Panda Fight Club: modro-červené tatami, boxovacie vrecia, hrazdy s loptami a steny s logom pandy.',
             'Sála Panda Fight Club s veľkou plochou tatami a nápisom Luta Livre na stene.']


def any_pic(photo, sizes, **kw):
    if photo.startswith('panda:'):
        n = int(photo[6:])
        return pic_panda(n, sizes, PANDA_ALT[n - 1], **{k: v for k, v in kw.items() if k in ('lazy', 'eager_hi', 'cls')})
    return pic(photo, sizes, **kw)


ICON = {
    'arrow': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'down': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v13M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'ig': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    'fb': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    'menu': '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.8"/></svg>',
    'tel': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.6 3h3l1.5 4.5-2 1.3a12 12 0 0 0 6.1 6.1l1.3-2 4.5 1.5v3A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    'pin': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    'play': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
    'pause': '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
}


def btn(href, label, kind='', icon='arrow', extra=''):
    """Tlačidlo: text v maske (pri prejdení sa vymení za kópiu zdola), šípka vpravo."""
    ic = ICON[icon] if icon else ''
    cls = 'btn' + (' ' + kind if kind else '')
    return (f'<a class="{cls}" href="{href}"{extra}><span class="btn-t"><span>{label}</span><span aria-hidden="true">{label}</span></span>'
            f'{f"<i>{ic}</i>" if ic else ""}</a>')


# filmový nástup: rozhodne sa ešte pred prvým vykreslením, aby titulok neblikol. Nehrá pri obmedzenom pohybe,
# šetrení dát, odkaze na kotvu ani pri ďalšej návšteve v tej istej relácii. Poistka ho po 4 s zruší.
INTRO_GATE = """
<script>try{var d=document.documentElement,c=navigator.connection;if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!location.hash&&!sessionStorage.getItem('gk-intro')&&!(c&&c.saveData)){d.classList.add('intro-on');sessionStorage.setItem('gk-intro','1');[CUT_SETS].forEach(function(n){var l=document.createElement('link');l.rel='preload';l.as='image';l.type='image/avif';l.setAttribute('imagesrcset',n);l.setAttribute('imagesizes','100vw');document.head.appendChild(l)});setTimeout(function(){d.classList.remove('intro-on')},4000)}}catch(e){}</script>"""
INTRO_GATE = INTRO_GATE.replace('CUT_SETS', ','.join("'" + ', '.join(f'media/tour-{n}-{w}.avif {w}w' for w in (480, 1280, FOTKY[n]['big'])) + "'" for n in ('vstup-1', 'jednorucky-1', 'stroje-2')))


def head(file, title, desc, og_img='og.jpg', extra=''):
    return f'''<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<!-- Návrh na posúdenie: kým prevádzka nedodá údaje označené „Doplniť:“, stránka sa neindexuje. Pred zverejnením odstrániť. -->
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#060707">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link rel="canonical" href="{BASE_URL}{'' if file == 'index.html' else file}">
<meta property="og:type" content="website">
<meta property="og:locale" content="sk_SK">
<meta property="og:site_name" content="GYM KLUB Nitra">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{BASE_URL}media/{og_img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="assets/fonts/Archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Archivo-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css">
<!-- poistka: obsah sa odkryje najneskôr po 1,5 s, aj keby skript nenabehol -->
<script>document.documentElement.classList.add('js');setTimeout(function(){{document.documentElement.classList.add('ready')}},1500)</script>{INTRO_GATE if file == 'index.html' else ''}
{extra}</head>'''


def header(file, over_hero=False):
    cur = ' aria-current="page"'
    links = '\n'.join(f'      <a href="{f}"{cur if f == file else ""}><span>{e(n)}</span></a>' for f, n in PAGES)
    mlinks = '\n'.join(f'    <li><a class="menu-a" href="{f}"{cur if f == file else ""}><small>{i:02d}</small><span>{e(n)}</span></a></li>' for i, (f, n) in enumerate(PAGES, 1))
    return f'''<body class="{'home' if over_hero else 'sub'} p-{file[:-5]}">
<a class="skip" href="#obsah">Preskočiť na obsah</a>
<header class="bar{'' if over_hero else ' solid'}" id="bar">
  <a class="brand" href="index.html" aria-label="GYM KLUB Nitra, domov">
    <img src="../assets/img/logo-gymklub.png" width="104" height="38" alt="GYM KLUB">
  </a>
  <nav class="nav" aria-label="Hlavná navigácia">
{links}
  </nav>
  <p class="status" data-status aria-live="off"><i aria-hidden="true"></i><span class="st-l">Po – Št 06:30 – 21:00</span><span class="st-s">06:30 – 21:00</span></p>
  <a class="btn btn-sm bar-cta" href="kontakt.html#navsteva"><span class="btn-t"><span>Naplánovať návštevu</span><span aria-hidden="true">Naplánovať návštevu</span></span></a>
  <button class="menu-btn" type="button" id="menuBtn" aria-expanded="false" aria-controls="menu" aria-label="Otvoriť menu">{ICON['menu']}</button>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Menu"><ol class="menu-l">
{mlinks}
  </ol></nav>
  <div class="menu-foot">
    <p class="menu-info">{GYM['street']}, {GYM['place']}, Nitra<br><span data-status-text>Po – Št 06:30 – 21:00, Pi do 23:00</span></p>
    <a class="btn" href="kontakt.html#navsteva"><span class="btn-t"><span>Naplánovať návštevu</span><span aria-hidden="true">Naplánovať návštevu</span></span></a>
    <a class="menu-tel" href="tel:{GYM['tel']}">{ICON['tel']} {GYM['phone']}</a>
  </div>
</div>
'''


def footer():
    links = ''.join(f'<li><a href="{f}">{e(n)}</a></li>' for f, n in PAGES)
    hours = ''.join(f'<li><span>{d}</span><span>{h}</span></li>' for d, h in HOURS)
    return f'''<footer class="foot">
  <div class="wrap foot-grid">
    <div class="foot-a">
      <p class="mono foot-h">Adresa</p>
      <address class="foot-addr">{e(GYM['full'])}<br>{GYM['street']} ({GYM['place']})<br>{GYM['zip']} {GYM['city']} – {GYM['district']}</address>
      <p class="foot-c"><a class="u" href="{GYM['maps']}" target="_blank" rel="noopener">Navigovať</a></p>
    </div>
    <div>
      <p class="mono foot-h">Kontakt</p>
      <p class="foot-c"><a class="u" href="tel:{GYM['tel']}">{GYM['phone']}</a><br><a class="u" href="mailto:{GYM['email']}">{GYM['email']}</a></p>
      <p class="social"><a href="{GYM['instagram']}" target="_blank" rel="noopener" aria-label="Instagram GYM KLUB (nové okno)">{ICON['ig']}</a><a href="{GYM['facebook']}" target="_blank" rel="noopener" aria-label="Facebook GYM KLUB (nové okno)">{ICON['fb']}</a></p>
    </div>
    <div>
      <p class="mono foot-h">Otváracie hodiny</p>
      <ul class="foot-hours">{hours}</ul>
      {todo('potvrdené víkendové hodiny')}
    </div>
    <div>
      <p class="mono foot-h">Stránky</p>
      <ul class="foot-l">{links}</ul>
    </div>
  </div>
  <p class="foot-word" aria-hidden="true">GYM KLUB</p>
  <div class="wrap foot-b">
    <p>© 2026 {e(GYM['full'])}</p>
    <p><a href="../">Klasická verzia webu</a> · <a href="https://www.gymklub.sk/" target="_blank" rel="noopener">gymklub.sk</a></p>
  </div>
</footer>

<nav class="dock" id="dock" aria-label="Rýchle odkazy">
  <a class="dock-a" href="clenstva.html">Cenník</a>
  <a class="dock-a dock-tel" href="tel:{GYM['tel']}" aria-label="Zavolať do GYM KLUB {GYM['phone']}">{ICON['tel']}</a>
  <a class="dock-a dock-main" href="kontakt.html#navsteva">Naplánovať návštevu</a>
</nav>
'''


def phero(photo, kicker, title, lead, alt=None, extra='', pos=None):
    """Úvod podstránky: veľká skutočná fotka s pomalým nájazdom kamery, kinetický nadpis."""
    img = any_pic(photo, '100vw', alt=alt, lazy=False, eager_hi=True, pos=pos) if not photo.startswith('panda:') else any_pic(photo, '100vw', lazy=False, eager_hi=True)
    return f'''<section class="phero" aria-labelledby="h-page" data-sc>
    <div class="phero-img">{img}</div>
    <div class="wrap phero-in">
      <p class="mono kicker">{kicker}</p>
      <h1 class="h1" id="h-page" data-kt>{title}</h1>
      <p class="lead">{lead}</p>
      {extra}
    </div>
  </section>'''


def typo(html_doc):
    """Slovenská typografia v texte (nie v skriptoch): pevná medzera za jednopísmenovými predložkami
    a spojkami a pred znakom €, aby nezostali osamotené na konci alebo začiatku riadka."""
    parts = re.split(r'(<script.*?</script>|<style.*?</style>)', html_doc, flags=re.S)
    def fix(t):
        t = re.sub(r'(?<=[\s(])([vVaAsSzZkKoOuUiI]) (?=\S)', r'\1&nbsp;', t)
        return re.sub(r'(\d) (€|%)', r'\1&nbsp;\2', t)
    return ''.join(p if p.startswith(('<script', '<style')) else re.sub(r'>([^<]+)<', lambda m: '>' + fix(m.group(1)) + '<', p) for p in parts)


def page(file, title, desc, body, over_hero=False, extra_head='', scripts=True):
    doc = head(file, title, desc, extra=extra_head) + '\n' + header(file, over_hero) + '\n<main id="obsah">\n' + typo(body) + '\n</main>\n\n' + typo(footer())
    if file == 'o-fitku.html':
        doc += LIGHTBOX
        doc += '\n<script src="assets/tour.js" type="module"></script>'
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


def price_tiles(link=True):
    out = []
    for p in PLANS:
        out.append(f'''<li class="tile{' tile-main' if p['main'] else ''}" data-spot>
          <p class="mono tile-k">{e(p['name'])}{'<b>Pri pravidelnom tréningu</b>' if p['main'] else ''}</p>
          <p class="tile-price"><span class="tile-n">{p['price']}</span><span class="tile-u">€<small>/ {p['per']}</small></span></p>
          <p class="tile-p">{e(p['text'])}</p>
          <p class="mono tile-c">Platí aj: {e(p['cards'])}</p>
        </li>''')
    return '<ul class="tiles">' + '\n        '.join(out) + '</ul>'


def more_prices():
    return '<ul class="more-prices">' + ''.join(
        f'<li><span class="mono">{e(n)}</span><b>{e(pr)}</b><small>{e(inc)}</small></li>' for n, inc, cards, pr in MORE) + '</ul>'


def cta_band(title='Príďte si to prejsť naživo', text='Na samostatný tréning sa netreba objednávať. Stačí prísť počas otváracích hodín s čistou obuvou, uterákom a vodou.', photo='vstup-1'):
    return f'''<section class="final" aria-labelledby="h-final" data-sc>
    <div class="final-img">{pic(photo, '100vw', alt='')}</div>
    <div class="wrap final-in">
      <p class="mono kicker">GYM KLUB · {GYM['street']}, Nitra</p>
      <h2 class="h-xl" id="h-final" data-kt>{title}</h2>
      <p class="lead">{text}</p>
      <div class="cta-row">{btn('kontakt.html#navsteva', 'Naplánovať návštevu')}{btn('tel:' + GYM['tel'], GYM['phone'], 'btn-ghost', 'tel')}</div>
    </div>
  </section>'''


# ---------------------------------------------------------------------------------------------
# DOMOV
JSONLD = json.dumps({
    '@context': 'https://schema.org', '@type': 'ExerciseGym', 'name': GYM['full'], 'url': BASE_URL,
    'image': BASE_URL + 'media/og.jpg', 'telephone': GYM['phone'], 'email': GYM['email'],
    'address': {'@type': 'PostalAddress', 'streetAddress': GYM['street'], 'addressLocality': GYM['city'], 'postalCode': GYM['zip'], 'addressCountry': 'SK'},
    'sameAs': [GYM['instagram'], GYM['facebook'], 'https://www.gymklub.sk/'],
}, ensure_ascii=False)

TRAIN_ZONES = [z for z in ZONES if z[0] != 'prichod']
zone_scene = []
for i, (zid, name, text, photos, main, second, gear) in enumerate(TRAIN_ZONES):
    chips = ''.join(f'<li>{e(g)}</li>' for g in gear)
    zone_scene.append(f'''      <article class="zn" id="z-{zid}" data-i="{i}" aria-labelledby="zh-{zid}">
        <div class="zn-bg" aria-hidden="true">{pic(main, '12vw', alt='')}</div>
        <div class="zn-media">
          <div class="zn-main">{pic(main, '(max-width: 1023px) 86vw, 40vw')}</div>
          <div class="zn-second" aria-hidden="true">{pic(second, '(max-width: 1023px) 40vw, 18vw', alt='')}</div>
        </div>
        <div class="zn-copy" data-spot>
          <p class="mono zn-n"><b>{i + 1:02d}</b> / {len(TRAIN_ZONES):02d}</p>
          <h3 class="zn-h" id="zh-{zid}">{e(name)}</h3>
          <p class="zn-p">{e(text)}</p>
          <ul class="chips" aria-label="Vybavenie">{chips}</ul>
          <a class="u zn-a" href="o-fitku.html#{zid}">Pozrieť zónu v prehliadke {ICON['arrow']}</a>
        </div>
      </article>''')
zone_ticks = ''.join(f'<li><button type="button" data-go="{i}"><span class="mono">{i + 1:02d}</span> {e(z[1])}</button></li>' for i, z in enumerate(TRAIN_ZONES))

WHY = [
    ('Tréning bez objednávania', 'Na samostatný tréning stačí prísť počas otváracích hodín. Vstup zaplatíte na recepcii, jednorazovo za 6 € alebo mesačnou permanentkou.', 'hlavna-sala-5'),
    ('Sila, kardio aj boj na jednej adrese', 'Dve sály so strojmi, voľné váhy, kardio, funkčná zóna a tatami. V samostatnej sále trénuje Panda Fight Club MMA, Luta Livre a Jiu Jitsu.', 'funkcna-zona-2'),
    ('Tréneri pre fitness aj lekcie', 'Osobní tréneri vrátane majstra Slovenska a Československa v športovej kulturistike. Lekcie Krav Maga, pilatesu a zdravého chrbta.', 'volne-vahy-1'),
    ('Začať sa dá od základov', 'Zdravý chrbát je podľa trénerky vhodný pre začiatočníkov a bojové športy začínajú od úplných základov. Študenti a dôchodcovia majú zľavnený vstup.', 'tatami-2'),
]
why_html = ''.join(
    f'''<li class="why-i" data-img="{i}"><span class="mono why-n">{i + 1:02d}</span><h3 class="why-h">{e(t)}</h3><p class="why-p">{e(x)}</p>
          <div class="why-thumb" aria-hidden="true">{pic(p, '(max-width: 1023px) 28vw, 1px', alt='')}</div></li>'''
    for i, (t, x, p) in enumerate(WHY))
why_float = ''.join(f'<div class="why-f" data-f="{i}">{pic(p, "22vw", alt="")}</div>' for i, (t, x, p) in enumerate(WHY))

SERVICES_SHORT = [
    ('fitness', 'Samostatný tréning', 'Stroje, voľné váhy, kardio a funkčná zóna každý deň počas otváracích hodín. Bez objednávania.', 'hlavna-sala-4'),
    ('osobny-trening', 'Osobný tréner', 'Plán podľa cieľa, kontrola techniky a jedálniček. Termín dohodnete priamo s trénerom.', 'volne-vahy-3'),
    ('bojove-sporty', 'MMA a bojové športy', 'MMA, Jiu Jitsu a Luta Livre s Panda Fight Club. Začína sa od úplných základov.', 'panda:2'),
    ('lekcie', 'Skupinové lekcie', 'Krav Maga, pilates a zdravý chrbát v pevných časoch podľa týždenného rozvrhu.', 'tatami-3'),
]
svc_home = ''.join(
    f'<li class="svc-i"><a href="sluzby.html#{s[0]}"><div class="svc-img">{any_pic(s[3], "(max-width: 1023px) 92vw, 24vw")}</div>'
    f'<span class="mono svc-n">{i + 1:02d}</span><span class="svc-h">{e(s[1])}</span><span class="svc-p">{e(s[2])}</span><i class="svc-go">{ICON["arrow"]}</i></a></li>'
    for i, s in enumerate(SERVICES_SHORT))

FILM_STEPS = [(0, 'Krytý chodník', 'Pozdĺž budovy Lipa Centrum na Výstavnej 6.'),
              (3.1, 'Terasa so stolmi', 'Vchod do fitka je z krytej terasy.'),
              (5.0, 'Dvere pod nápisom', 'GYM KLUB & caffee, biele presklené dvere.'),
              (5.85, 'Recepcia', 'Hneď za dverami. Tu zaplatíte vstup a prezujete sa.')]
film_steps = ''.join(f'<li data-t="{t}"><span class="mono">{i + 1:02d}</span><b>{e(h)}</b><small>{e(x)}</small></li>' for i, (t, h, x) in enumerate(FILM_STEPS))

hours_rows_home = ''.join(f'<li data-days="{d}"><span>{n}</span><b>{h}</b></li>' for d, (n, h) in zip(['1-4', '5', '6-7'], HOURS))

home = f'''  <section class="hero" id="uvod" aria-labelledby="h-hero">
    <div class="hero-stage">
      <!-- úvodná scéna: skutočná fotka funkčnej zóny; skript ju zhasne, rozsvieti LED šesťuholníky a pri skrolovaní vojde kamera do priestoru -->
      <div class="hero-scene" id="heroScene" data-depth="media/depth-funkcna-zona-7.png" data-lights="media/lights-funkcna-zona-7.png">
        {pic('funkcna-zona-7', '100vw', alt='Funkčná zóna fitka GYM KLUB so stropom zo šesťuholníkových LED svetiel a šprintérskou dráhou na podlahe.', lazy=False, eager_hi=True)}
      </div>
      <div class="hero-in wrap" id="heroIn">
        <p class="mono hero-k"><span>Nitra</span><span>Výstavná 6</span><span>Lipa Centrum</span></p>
        <h1 class="hero-h" id="h-hero" aria-label="GYM KLUB, fitko a bojové športy v Nitre"><span class="hero-w" aria-hidden="true"><span>GYM</span></span><span class="hero-w" aria-hidden="true"><span>KLUB</span></span></h1>
        <div class="hero-row">
          <p class="hero-p">Fitko a bojové športy v Lipa Centre. Dve sály so strojmi, voľné váhy, kardio, funkčná zóna a tatami.</p>
          <div class="cta-row">{btn('o-fitku.html#prehliadka', 'Vstúpiť do prehliadky')}{btn('clenstva.html', 'Cenník', 'btn-ghost', None)}</div>
        </div>
      </div>
      <ul class="hero-meta mono" aria-label="Rýchle informácie">
        <li><span>Dnes</span><b data-status-short>06:30 – 21:00</b></li>
        <li><span>Vstup</span><b>od 6 €</b></li>
        <li><span>Objednávanie</span><b>netreba</b></li>
      </ul>
      <a class="hero-skip mono" href="#rychle">Preskočiť úvod {ICON['down']}</a>
      <!-- filmový nástup (len prvá návšteva v relácii): tri rýchle strihy zo skutočných záberov – vchod, jednoručky, stroje –
           potom strih do funkčnej zóny, kde sa rozsvietia LED svetlá. Obrázky sa vložia až pri prehrávaní (šablóna). -->
      <template id="cutTpl">
        <div class="cut" id="cut" aria-hidden="true">
          <figure class="cut-f cut-1">{pic('vstup-1', '100vw', alt='', lazy=False)}<figcaption class="mono">Vchod · Výstavná 6</figcaption></figure>
          <figure class="cut-f cut-2">{pic('jednorucky-1', '100vw', alt='', lazy=False)}<figcaption class="mono">Jednoručky</figcaption></figure>
          <figure class="cut-f cut-3">{pic('stroje-2', '100vw', alt='', lazy=False)}<figcaption class="mono">Sála so strojmi</figcaption></figure>
        </div>
      </template>
      <button class="intro-skip glass mono" type="button" id="introSkip">Preskočiť</button>
    </div>
  </section>

  <section class="info" id="rychle" aria-label="Najdôležitejšie informácie">
    <ul class="wrap info-l">
      <li><span class="mono">Dnes</span><b data-status-long>Po – Št 06:30 – 21:00, Pi do 23:00</b><a class="u" href="#hodiny">Všetky hodiny</a></li>
      <li><span class="mono">Vstup</span><b>6 € · mesiac 50 €</b><a class="u" href="clenstva.html">Celý cenník</a></li>
      <li><span class="mono">Adresa</span><b>{GYM['street']}, {GYM['place']}</b><a class="u" href="{GYM['maps']}" target="_blank" rel="noopener">Navigovať</a></li>
      <li><span class="mono">Telefón</span><b>{GYM['phone']}</b><a class="u" href="tel:{GYM['tel']}">Zavolať</a></li>
    </ul>
  </section>

  <section class="statement" aria-labelledby="h-st" data-sc>
    <div class="wrap st-grid">
      <p class="mono kicker" id="h-st">Fitko v Lipa Centre</p>
      <p class="st-t" data-scrub>Šesť tréningových priestorov a samostatná sála pre MMA. Hlavná sála, sála so strojmi, kardio pri oknách, voľné váhy, funkčná zóna so šprintérskou dráhou a tatami. Plne klimatizované, otvorené každý deň a na samostatný tréning bez objednávania.</p>
      <figure class="st-pic" data-par="-0.12">{pic('kardio-1', '(max-width: 1023px) 60vw, 22vw')}</figure>
    </div>
  </section>

  <section class="zones" id="priestory" aria-labelledby="h-zones">
    <div class="wrap zones-head">
      <p class="mono kicker">Priestory · {len(TRAIN_ZONES)} zón</p>
      <h2 class="h-xl" id="h-zones" data-kt>Každý priestor na&nbsp;iný tréning</h2>
      <p class="mono zones-hint" aria-hidden="true">Posuňte prstom</p>
    </div>
    <div class="zones-pin">
      <div class="zones-stage">
{chr(10).join(zone_scene)}
        <ol class="zones-ticks" aria-label="Zóny">{zone_ticks}</ol>
        <div class="zones-bar" aria-hidden="true"><i></i></div>
      </div>
    </div>
  </section>

  <section class="why" aria-labelledby="h-why">
    <div class="wrap">
      <div class="why-head">
        <p class="mono kicker">Prečo GYM KLUB</p>
        <h2 class="h-l" id="h-why" data-kt>Štyri dôvody prísť</h2>
      </div>
      <ol class="why-l">{why_html}</ol>
    </div>
    <div class="why-float" aria-hidden="true">{why_float}</div>
  </section>

  <section class="panda" aria-labelledby="h-panda-home" data-sc>
    <div class="marquee mono-xl" aria-hidden="true"><div class="marquee-t"><span>MMA</span><span>Luta Livre</span><span>Jiu Jitsu</span><span>Panda Fight Club</span><span>MMA</span><span>Luta Livre</span><span>Jiu Jitsu</span><span>Panda Fight Club</span></div></div>
    <div class="panda-img">{pic_panda(1, '100vw', PANDA_ALT[0])}</div>
    <div class="wrap panda-in">
      <p class="mono kicker">Bojové športy v GYM KLUB</p>
      <h2 class="h-xl" data-kt id="h-panda-home">Panda Fight Club</h2>
      <p class="lead">MMA, Luta Livre a Jiu Jitsu s trénerom Michalom Šášikom vo vlastnej sále s tatami. Klub prijíma nových členov a začína sa od základov.</p>
      <div class="cta-row">{btn('mma.html', 'Rozvrh a kontakt klubu')}{btn('tel:' + PANDA['tel'], 'Zavolať trénerovi', 'btn-ghost', 'tel')}</div>
      <p class="src mono">Fotka sály: gymklub.sk</p>
    </div>
  </section>

  <section class="svc" aria-labelledby="h-sluzby">
    <div class="wrap">
      <div class="svc-head">
        <p class="mono kicker">Služby</p>
        <h2 class="h-l" id="h-sluzby" data-kt>Samostatne, s&nbsp;trénerom alebo v&nbsp;skupine</h2>
      </div>
      <ul class="svc-l">{svc_home}</ul>
    </div>
  </section>

  <section class="prices" id="cennik" aria-labelledby="h-cena">
    <div class="wrap">
      <div class="prices-head">
        <p class="mono kicker">Cenník</p>
        <h2 class="h-xl" id="h-cena" data-kt>Jeden vstup 6&nbsp;€. Mesiac 50&nbsp;€.</h2>
        <p class="lead">Platí sa na recepcii v hotovosti. Kto trénuje viac ako dvakrát do týždňa, ušetrí s permanentkou. {todo(PRICES_NOTE)}</p>
      </div>
      {price_tiles()}
      {more_prices()}
      <div class="cta-row">{btn('clenstva.html', 'Celý cenník a podmienky')}{btn('clenstva.html#porovnanie', 'Vstupy alebo permanentka?', 'btn-ghost', None)}</div>
    </div>
  </section>

  <section class="visit" id="hodiny" aria-labelledby="h-visit">
    <div class="wrap">
      <div class="visit-head">
        <p class="mono kicker">Prvá návšteva</p>
        <h2 class="h-l" id="h-visit" data-kt>Čo potrebujete vedieť</h2>
      </div>
      <div class="visit-grid">
        <div class="visit-c">
          <p class="mono visit-k">Otváracie hodiny</p>
          <p class="visit-now" data-status-long>Po – Št 06:30 – 21:00, Pi do 23:00</p>
          <ul class="hours" data-hours>{hours_rows_home}</ul>
          {todo('potvrdené víkendové hodiny')}
        </div>
        <div class="visit-c">
          <p class="mono visit-k">Adresa</p>
          <address class="visit-addr">{GYM['street']}<br>{GYM['place']}<br>{GYM['zip']} {GYM['city']}</address>
          <p class="visit-p">Vchod je z krytej terasy, dvere pod nápisom GYM KLUB &amp; caffee.</p>
          <div class="cta-row">{btn(GYM['maps'], 'Navigovať', 'btn-ghost', 'pin', NEWTAB)}</div>
        </div>
        <div class="visit-c">
          <p class="mono visit-k">Čo si zobrať</p>
          <ol class="steps">
            <li><b>Čistú obuv na prezutie</b></li>
            <li><b>Uterák a vodu</b></li>
            <li><b>Hotovosť na vstup</b> alebo Upbalansea či MultiSport</li>
          </ol>
          <p class="visit-p">Šatne a sprchy sú na mieste. Osobný tréning a lekcie si dohodnete s trénerom.</p>
        </div>
      </div>
    </div>
  </section>

  {cta_band('Vidíme sa na Výstavnej 6', 'Na samostatný tréning sa netreba objednávať. Zoberte si čistú obuv, uterák a vodu, zvyšok je na mieste.')}'''
page('index.html', 'GYM KLUB Nitra | Fitko a bojové športy v Lipa Centre',
     'Fitko GYM KLUB na Výstavnej 6 v Nitre (Lipa Centrum): dve sály so strojmi, voľné váhy, kardio, funkčná zóna a tatami. Vstup 6 €, permanentka 50 €, osobní tréneri, MMA a lekcie.',
     home, over_hero=True, extra_head=f'<script type="application/ld+json">{JSONLD}</script>\n')

# ---------------------------------------------------------------------------------------------
# PREHLIADKA (o-fitku.html): prehliadka skutočných panorám a fotiek, pod ňou zóny s fotkami
TOUR = json.load(open(os.path.join(ROOT, 'assets', 'tour.json'), encoding='utf-8'))
ZONE_TEXT = {z[0]: z[2] for z in ZONES}
ZONE_GEAR = {z[0]: z[6] for z in ZONES}
ZONE_TEXT['panda'] = 'Samostatná sála klubu Panda Fight Club s veľkou plochou tatami, boxovacími vrecami a hrazdami. Trénuje sa tu MMA, Luta Livre a Jiu Jitsu.'
ZONE_GEAR['panda'] = ['Tatami', 'Boxovacie vrecia', 'Hrazdy']
ZONE_TEXT['prichod'] = 'Vchod je z krytej terasy Lipa Centra, dvere sú pod nápisom GYM KLUB & caffee. Hneď za nimi je recepcia s nápojmi a polička na obuv. Tu zaplatíte vstup.'
TOUR_STOPS = [s for s in TOUR['stops'] if s.get('tour', True)]
TOUR_PAGE = {'zones': [dict(z, text=ZONE_TEXT[z['id']]) for z in TOUR['zones']], 'stops': TOUR_STOPS}
N_PANO = sum(1 for s in TOUR_STOPS if s['type'] == 'pano')
N_PHOTO = len(TOUR_STOPS) - N_PANO
first = TOUR_STOPS[0]
PANO_ZONES = {s['zone'] for s in TOUR_STOPS if s['type'] == 'pano'}
NO_PANO = [z['name'] for z in TOUR['zones'] if z['id'] not in PANO_ZONES]
# trasa zón v scéne: poradie od vchodu (nie pôdorys), šírka úseku podľa počtu miest
rail = ''.join(
    f'<li style="--n:{sum(1 for s in TOUR_STOPS if s["zone"] == z["id"])}"><button type="button" data-zone="{z["id"]}" aria-label="{i:02d} {e(z["name"])}{", panoráma" if z["id"] in PANO_ZONES else ""}">'
    f'<span class="mono">{i:02d}</span><em>{e(z["name"])}</em><i></i></button></li>'
    for i, z in enumerate(TOUR['zones'], 1))
places = []
for i, z in enumerate(TOUR['zones'], 1):
    li = ''.join(
        f'<li><button type="button" data-stop="{s["id"]}"><span>{e(s["title"])}</span>'
        f'<small class="mono">{"Panoráma " + str(s["hfov"]) + "°" if s["type"] == "pano" else "Fotka"}</small></button></li>'
        for s in TOUR_STOPS if s['zone'] == z['id'])
    places.append(f'<li><p class="tv-list-z mono"><b>{i:02d}</b> {e(z["name"])}</p><ol>{li}</ol></li>')
places = ''.join(places)


def zone_pic(s, sizes):
    if s['id'].startswith('panda'):
        return pic_panda(s['id'][-1], sizes, s['alt'])
    return pic(s['id'], sizes)


zones_html = []
gi = 0
for zi, z in enumerate(TOUR['zones'], 1):
    zs = [s for s in TOUR['stops'] if s['zone'] == z['id'] and s['type'] == 'photo']
    first_stop = next(s for s in TOUR_STOPS if s['zone'] == z['id'])
    items = []
    for n, s in enumerate(zs, 1):
        big = s['sizes'][0]
        items.append(f'''          <li class="rail-i"><a class="ph" href="media/{s['img']}-{big}.{'jpg' if s['id'].startswith('panda') else 'avif'}" data-i="{gi}" data-src="{s['img']}" data-big="{big}" data-w="{s['w']}" data-h="{s['h']}" data-zone="{e(z['name'])}" aria-label="{e(z['name'])}, fotka {n} z {len(zs)}: zväčšiť">{zone_pic(s, "(max-width: 760px) 62vw, 300px")}</a></li>''')
        gi += 1
    src = '<p class="src mono">Fotky: gymklub.sk</p>' if z['id'] == 'panda' else ''
    gear = ''.join(f'<li>{e(g)}</li>' for g in ZONE_GEAR[z['id']])
    pano = ' <span class="mono tag-pano">Panoráma</span>' if z['id'] in PANO_ZONES else ''
    zones_html.append(f'''    <article class="zone" id="{z['id']}" aria-labelledby="h-{z['id']}">
      <div class="wrap zone-head">
        <p class="mono zone-n"><b>{zi:02d}</b> / {len(TOUR['zones']):02d}{pano}</p>
        <h2 class="zone-h" id="h-{z['id']}" data-kt>{e(z['name'])}</h2>
        <div class="zone-side">
          <p class="zone-p">{e(ZONE_TEXT[z['id']])}</p>
          <ul class="chips" aria-label="Vybavenie">{gear}</ul>
          <p class="zone-a"><a class="u" href="#prehliadka" data-tour-stop="{first_stop['id']}">Otvoriť v prehliadke {ICON['arrow']}</a></p>
          {src}
        </div>
      </div>
      <div class="rail-wrap">
        <ul class="rail" aria-label="Fotky: {e(z['name'])}">
{chr(10).join(items)}
        </ul>
        <div class="wrap rail-ctl" hidden>
          <span class="mono rail-count" aria-hidden="true"><b>1</b> / {len(zs)}</span>
          <button class="rail-btn" type="button" data-dir="-1" aria-label="Predchádzajúce fotky: {e(z['name'])}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="rail-btn" type="button" data-dir="1" aria-label="Ďalšie fotky: {e(z['name'])}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
        </div>
      </div>
    </article>''')

IC = lambda d, w=20: f'<svg viewBox="0 0 24 24" width="{w}" height="{w}" aria-hidden="true"><path d="{d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
about = f'''  <section class="tv" id="prehliadka" aria-labelledby="h-tv">
    <div class="tv-stage" tabindex="0" aria-roledescription="prehliadka" aria-describedby="tvHelp">
      <div class="tv-flat"><img class="tv-img" src="media/{first['img']}-240.webp" alt="{e(first['alt'])}" fetchpriority="high" decoding="async"></div>
      <div class="tv-pins"></div>
      <button class="tv-go" type="button"><i aria-hidden="true">{ICON['arrow']}</i><span>Ďalej</span></button>
      <div class="tv-cap">
        <h1 class="tv-h mono" id="h-tv">Prehliadka GYM KLUB</h1>
        <p class="tv-zone mono"></p>
        <p class="tv-title"></p>
        <p class="tv-count"><span class="tv-badge mono"></span> <span class="tv-n"></span></p>
      </div>
      <div class="tv-top">
        <button class="tv-pill tv-back" type="button" hidden>{IC('M15 5l-7 7 7 7')} <span>Späť na web</span></button>
        <button class="tv-pill tv-open" type="button" aria-expanded="false" aria-controls="tvList">{IC('M4 7h16M4 12h16M4 17h10')} <span>Priestory</span></button>
        <button class="tv-pill tv-resume" type="button" hidden>{IC('M8 5v14l11-7z')} <span>Pokračovať vo filme</span></button>
        <button class="tv-pill tv-film-btn" type="button" aria-label="Spustiť filmovú prehliadku od začiatku">{IC('M8 5v14l11-7z')} <span>Film</span></button>
        <a class="tv-pill tv-cta" href="kontakt.html#navsteva">Naplánovať návštevu</a>
      </div>
      <!-- filmová cesta: popis záberu, priebeh a ovládanie (tour.js, FILM) -->
      <div class="tv-lower" aria-live="polite"><p class="tv-lower-k mono"></p><p class="tv-lower-h"></p><p class="tv-lower-s"></p></div>
      <div class="tv-filmbar" aria-hidden="true"><i></i></div>
      <div class="tv-fctl">
        <button class="tv-pill tv-pause" type="button" aria-pressed="false" hidden><svg class="i-pause" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg><svg class="i-play" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span>Pozastaviť</span></button>
        <button class="tv-pill tv-skip" type="button" hidden>Preskočiť film {IC('M5 5l7 7-7 7M13 5l7 7-7 7', 18)}</button>
      </div>
      <div class="tv-end" hidden>
        <div class="tv-end-in">
          <p class="mono kicker">Koniec filmovej prehliadky</p>
          <p class="tv-end-h">Príďte si to prejsť naživo</p>
          <p class="tv-end-p">Na samostatný tréning sa netreba objednávať. Stačí prísť počas otváracích hodín, vstup zaplatíte na recepcii.</p>
          <div class="cta-row">{btn('kontakt.html#navsteva', 'Naplánovať návštevu')}<button class="btn btn-ghost tv-explore" type="button"><span class="btn-t"><span>Preskúmať sám</span><span aria-hidden="true">Preskúmať sám</span></span></button></div>
          <button class="tv-again u mono" type="button">Pozrieť film znova</button>
        </div>
      </div>
      <div class="tv-compass" aria-hidden="true" hidden><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="29" fill="rgba(6,7,7,.6)" stroke="rgba(241,239,233,.25)"/><path class="tv-arc" fill="none" stroke="rgba(241,239,233,.55)" stroke-width="3"/><path class="tv-cone" fill="rgba(255,58,36,.8)"/><circle cx="32" cy="32" r="3" fill="#f1efe9"/></svg><span class="mono tv-deg"></span></div>
      <div class="tv-card" hidden><p class="tv-card-h"></p><p class="tv-card-p"></p><button class="tv-card-x" type="button" aria-label="Zavrieť popis">{IC('M6 6l12 12M18 6L6 18', 18)}</button></div>
      <nav class="tv-rail" aria-label="Trasa zón od vchodu"><ol>{rail}</ol></nav>
      <div class="tv-ctl" role="toolbar" aria-label="Ovládanie prehliadky">
        <div class="tv-grp">
          <button class="tv-btn tv-prev" type="button" aria-label="Predchádzajúce miesto" title="Späť (P)">{IC('M15 5l-7 7 7 7', 22)}</button>
          <button class="tv-btn tv-next" type="button" aria-label="Ďalšie miesto" title="Ďalej (N)">{IC('M9 5l7 7-7 7', 22)}</button>
        </div>
        <div class="tv-grp tv-grp-s">
          <button class="tv-btn tv-zout" type="button" aria-label="Oddialiť" title="Oddialiť (−)">{IC('M5 12h14')}</button>
          <button class="tv-btn tv-zin" type="button" aria-label="Priblížiť" title="Priblížiť (+)">{IC('M12 5v14M5 12h14')}</button>
          <button class="tv-btn tv-gyro" type="button" aria-pressed="false" aria-label="Rozhliadať sa pohybom telefónu" title="Pohyb telefónom" hidden>{IC('M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2M3 9c-1 2-1 4 0 6M21 9c1 2 1 4 0 6')}</button>
          <button class="tv-btn tv-home" type="button" aria-label="Späť na začiatok prehliadky" title="Na začiatok (0)">{IC('M4 11l8-7 8 7M6 10v10h12V10')}</button>
          <button class="tv-btn tv-fs" type="button" aria-pressed="false" aria-label="Celá obrazovka" title="Celá obrazovka (F)">{IC('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5')}</button>
        </div>
      </div>
      <div class="tv-list" id="tvList" hidden>
        <div class="tv-list-in">
          <div class="tv-list-head"><p class="tv-list-t">Priestory</p><button class="tv-btn tv-list-x" type="button" aria-label="Zavrieť zoznam">{IC('M6 6l12 12M18 6L6 18')}</button></div>
          <ol class="tv-list-l">{places}</ol>
          <p class="tv-list-note">Panoráma je zložená zo skutočného videa, v ktorom sa kamera otáčala na mieste. Fotka je jeden záber s jemným priestorovým efektom. Pôdorys prevádzky nie je k dispozícii, preto sú zóny v poradí od vchodu. Panoráma zatiaľ chýba: {e(', '.join(NO_PANO))}.</p>
        </div>
      </div>
      <div class="tv-intro" hidden>
        <div class="tv-intro-in">
          <p class="mono kicker">Výstavná 6 · Lipa Centrum · Nitra</p>
          <p class="tv-intro-h" data-kt>Vstúpte do GYM KLUB</p>
          <p class="tv-intro-p">Filmová cesta od terasy cez všetky sály až po tatami, asi 45 sekúnd. Kedykoľvek ju zastavíte a rozhliadnete sa sami. Zábery sú skutočné: {N_PANO} čiastočné panorámy zložené z videa a {N_PHOTO} fotiek.</p>
          <div class="cta-row"><button class="btn tv-start" type="button"><span class="btn-t"><span>Spustiť prehliadku</span><span aria-hidden="true">Spustiť prehliadku</span></span><i>{ICON['arrow']}</i></button><button class="btn btn-ghost tv-enter" type="button"><span class="btn-t"><span>Preskúmať sám</span><span aria-hidden="true">Preskúmať sám</span></span></button></div>
          <a class="tv-intro-skip u mono" href="#obsah-prehliadky">Zoznam zón pod prehliadkou</a>
        </div>
      </div>
      <p class="tv-state" hidden><span class="tv-state-t"></span> <button class="tv-retry" type="button" hidden>Skúsiť znova</button></p>
      <p class="sr-only" id="tvHelp">Šípky: rozhliadanie. Plus a mínus: priblíženie. N a P: ďalšie a predchádzajúce miesto. 0: začiatok. F: celá obrazovka. Esc: zavrieť.</p>
      <p class="sr-only tv-live" aria-live="polite"></p>
    </div>
    <div class="wrap tv-under">
      <div class="tv-info" aria-live="off"><p class="tv-info-p"></p><ul class="tv-info-l chips" aria-label="Na tomto mieste"></ul></div>
      <p class="tv-note mono">{N_PANO} panorámy zložené zo skutočného videa a {N_PHOTO} fotiek. Vlastné zábery sú z 26. 9. 2026, dve fotky sály Panda sú z gymklub.sk. Zóny idú v poradí od vchodu, nie je to pôdorys.</p>
    </div>
    <script type="application/json" id="tourData">{json.dumps(TOUR_PAGE, ensure_ascii=False, separators=(',', ':'))}</script>
  </section>

  <section class="tour" id="obsah-prehliadky" aria-labelledby="h-tour">
    <div class="wrap tour-head">
      <p class="mono kicker">Zóny a vybavenie</p>
      <h2 class="h-xl" id="h-tour" data-kt>Čo nájdete v&nbsp;každej zóne</h2>
      <p class="lead">Vybavenie, ktoré je vidno na fotkách. Fotky posuniete prstom alebo šípkami, ťuknutím ich zväčšíte.</p>
    </div>
{chr(10).join(zones_html)}
  </section>

  <section class="facility" aria-labelledby="h-zazemie">
    <div class="wrap facility-grid">
      <div>
        <p class="mono kicker">Zázemie</p>
        <h2 class="h-l" id="h-zazemie" data-kt>Šatne, sprchy a&nbsp;recepcia</h2>
      </div>
      <ul class="checks">
        <li>Recepcia hneď pri vchode: tu zaplatíte vstup a ukážete Upbalansea alebo MultiSport.</li>
        <li>Šatne a sprchy. {todo('fotky šatní a spŕch; skrinky, či treba vlastný zámok')}</li>
        <li>Klimatizácia v celom fitku.</li>
      </ul>
    </div>
  </section>
'''
page('o-fitku.html', 'Prehliadka fitka | GYM KLUB Nitra',
     f'Prejdite si fitko GYM KLUB v Lipa Centre v Nitre: {N_PANO} panorámy zo skutočného videa a {N_PHOTO} fotiek. Príchod, hlavná sála, sála so strojmi, kardio, voľné váhy, funkčná zóna, tatami a sála Panda Fight Club.',
     about + cta_band('Príďte si to prejsť naživo'))

# ---------------------------------------------------------------------------------------------
# CENNÍK
PRICE_ROWS = [(p['name'], p['price'] + ' € / ' + p['per'], p['text'], p['cards']) for p in PLANS] + [(a, d, b, c) for a, b, c, d in MORE]
price_rows = ''.join(
    f'<tr><th scope="row">{e(n)}</th><td class="num">{e(pr)}</td><td>{e(inc)}</td><td>{e(cards)}</td></tr>'
    for n, pr, inc, cards in PRICE_ROWS)
terms = ''.join(f'<li>{e(t)}</li>' for t in TERMS)
PRICE_FAQ = [
    ('Dá sa platiť kartou?', 'Podľa častých otázok na gymklub.sk nie, platí sa len v hotovosti na recepcii.'),
    ('Platí MultiSport aj na permanentku?', 'Cenník na gymklub.sk uvádza MultiSport len pri jednorazovom vstupe. Upbalansea app je uvedená pri všetkých položkách.'),
    ('Koľko stojí osobný tréning alebo lekcia?', None),
    ('Od kedy platí mesačná permanentka?', None),
]
price_faq = ''.join(
    f'<details class="faq-i"><summary>{e(q)}</summary><p>{e(a) if a else todo("cena osobného tréningu a lekcií" if "Koľko" in q else "či permanentka platí 30 dní od kúpy alebo kalendárny mesiac, a ako dlho platia balíky 10 a 20 vstupov")}</p></details>'
    for q, a in PRICE_FAQ)
members = phero('volne-vahy-2', 'Cenník · platí sa na recepcii', 'Vstup 6&nbsp;€, mesiac 50&nbsp;€',
                'Všetky ceny sú pre samostatný fitness tréning v celom fitku. Platí sa na recepcii v hotovosti, bez objednávania.',
                extra=f'<div class="cta-row">{btn("#vsetky-ceny", "Celý cenník", "", "down")}{btn("#porovnanie", "Porovnať vstupy", "btn-ghost", None)}</div>') + f'''

  <section class="prices prices-page" aria-labelledby="h-plans">
    <div class="wrap">
      <div class="prices-head">
        <p class="mono kicker">Najčastejšie vstupy</p>
        <h2 class="h-l" id="h-plans" data-kt>Vyberte si podľa toho, ako často chodíte</h2>
        <p class="lead">{todo(PRICES_NOTE)}</p>
      </div>
      {price_tiles()}
    </div>
  </section>

  <section class="sec" id="vsetky-ceny" aria-labelledby="h-all">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Celý cenník</p>
        <h2 class="h-l" id="h-all" data-kt>Všetky vstupy a&nbsp;permanentky</h2>
        <p class="lead">Podľa cenníka na gymklub.sk. Stĺpec Karty a aplikácie uvádza, čo cenník pri položke výslovne prijíma.</p>
      </div>
      <div class="table-wrap" tabindex="0" role="region" aria-labelledby="h-all">
        <table class="table price-t">
          <thead><tr><th scope="col">Položka</th><th scope="col" class="num">Cena</th><th scope="col">Čo zahŕňa</th><th scope="col">Karty a aplikácie</th></tr></thead>
          <tbody>{price_rows}</tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec sec-alt" id="porovnanie" aria-labelledby="h-calc">
    <div class="wrap two">
      <div>
        <p class="mono kicker">Porovnanie</p>
        <h2 class="h-l" id="h-calc" data-kt>Vstupy alebo permanentka?</h2>
        <p class="lead">Posuňte, koľkokrát do mesiaca prídete. Porovnáva jednotlivé vstupy za 6 € s permanentkou za 50 €. Balíky 10 a 20 vstupov vychádzajú na 5 € a 4 € za vstup.</p>
      </div>
      <div class="calc" id="calc" data-single="6" data-month="50">
        <label class="calc-l mono" for="calcN">Tréningov za mesiac</label>
        <output class="calc-o" id="calcOut" for="calcN">8</output>
        <input type="range" id="calcN" min="1" max="30" value="8">
        <p class="calc-r" id="calcR" aria-live="polite"></p>
        <noscript><p class="calc-r">Do 8 tréningov mesačne vychádzajú lacnejšie jednotlivé vstupy (8 × 6 € = 48 €), od 9. tréningu permanentka za 50 €.</p></noscript>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-terms">
    <div class="wrap two">
      <div>
        <p class="mono kicker">Platba</p>
        <h2 class="h-l" id="h-terms" data-kt>Ako sa platí</h2>
      </div>
      <ul class="checks">{terms}</ul>
    </div>
  </section>

  <section class="sec sec-alt" aria-labelledby="h-pfaq">
    <div class="wrap two">
      <div><p class="mono kicker">Otázky k cenám</p><h2 class="h-l" id="h-pfaq" data-kt>Čo sa často pýtate</h2></div>
      <div class="faq">{price_faq}</div>
    </div>
  </section>
  {cta_band('Prvý vstup zaplatíte na recepcii', 'Príďte počas otváracích hodín, nič netreba vopred rezervovať. S otázkou k permanentke zavolajte alebo napíšte.', 'recepcia-1')}'''
page('clenstva.html', 'Cenník vstupov a permanentiek | GYM KLUB Nitra',
     'Cenník fitka GYM KLUB Nitra: jednorazový vstup 6 €, permanentka 50 € mesačne, študent 42 €, 10 vstupov 50 €, 20 vstupov 80 €, dôchodca 3,50 €. Platba v hotovosti, Upbalansea a MultiSport.',
     members)

# ---------------------------------------------------------------------------------------------
# SLUŽBY
def when(name):
    out = [f'{DAYS[d][:2]} {a} – {b}' for d, a, b, n, c in TIMETABLE if n == name]
    return ' · '.join(out)


SVC = [
    ('fitness', 'Fitness tréning', 'Každý deň počas otváracích hodín', 'Samostatný silový tréning na strojoch, s voľnými váhami a na kardio zariadeniach. Na samostatný tréning sa netreba objednávať.', 'hlavna-sala-4', None),
    ('osobny-trening', 'Osobný tréning', 'Termín podľa dohody s trénerom', 'Diagnostika pohybu, správna technika, tréningový plán a jedálniček podľa cieľa. Tréneri pripravia aj na súťaž vo fitness a silovom trojboji.', 'volne-vahy-1', None),
    ('bojove-sporty', 'Bojové športy · Panda Fight Club', when('Bojové športy'), 'MMA, Jiu Jitsu a Luta Livre (no-gi, bez kimona) s Michalom Šášikom a jeho klubom Panda Fight Club. Postoj s prvkami boxu, kickboxu a juda, na zemi páky, škrtenia a obrana proti nim. Začať sa dá od úplných základov.', 'panda:1', 'mma.html'),
    ('krav-maga', 'Krav Maga', when('Krav Maga'), 'Praktická sebaobrana s Tomášom Židekom a Slavom Jurom. Jednoduché techniky pre reálne situácie, bez predchádzajúcich skúseností.', 'tatami-3', None),
    ('zdravy-chrbat', 'Zdravý chrbát', when('Zdravý chrbát'), 'Cvičenie s Nikol Molnárovou: posilnenie trupu, správne držanie tela a uvoľnenie stuhnutých svalov. S malými činkami a na karimatke, vhodné aj pri sedavej práci.', 'tatami-2', None),
    ('pilates', 'Pilates', when('Pilates'), 'Pilates s Majkou Navrátilovou pre stabilitu, mobilitu a pevný stred tela. Pokojnejšie tempo a presné prevedenie.', 'tatami-1', None),
    ('vyziva', 'Nutričné poradenstvo', 'Podľa dohody', 'Analýza telesného zloženia a stravovací protokol s Jaroslavom Šoltísom, výživové poradenstvo aj u Mgr. Tomáša Králika.', 'recepcia-1', None),
]
svc_html = []
for i, (sid_, name, time, text, photo, more) in enumerate(SVC):
    svc_html.append(f'''    <article class="svc-row{' svc-rev' if i % 2 else ''}" id="{sid_}" aria-labelledby="h-{sid_}">
      <div class="svc-media" data-par="0.08">{any_pic(photo, "(max-width: 1023px) 100vw, 46vw")}</div>
      <div class="svc-body">
        <p class="mono svc-idx"><b>{i + 1:02d}</b> / {len(SVC):02d}</p>
        <h2 class="h-l" id="h-{sid_}" data-kt>{e(name)}</h2>
        <p class="mono svc-when">{e(time)}</p>
        <p class="lead">{e(text)}</p>
        {f'<p class="more"><a class="u" href="{more}">Viac o Panda Fight Club {ICON["arrow"]}</a></p>' if more else ''}
      </div>
    </article>''')
lekcie_anchor = '<span id="lekcie" class="anchor"></span>'

rows = []
for d in range(7):
    items = [f'<li><b class="mono">{a} – {b}</b> {e(n)}<span>{e(c)}</span></li>' for dd, a, b, n, c in TIMETABLE if dd == d]
    rows.append(f'<div class="tt-day" data-day="{d + 1}"><h3 class="tt-h">{DAYS[d]}</h3>' + (f'<ul>{"".join(items)}</ul>' if items else '<p class="tt-none">Fitness počas otváracích hodín</p>') + '</div>')

coach_html = ''.join(
    f'<li class="coach" data-spot><p class="mono coach-tag">{e(t)}</p><h3 class="coach-h">{e(n)}</h3><p>{e(x)}</p>'
    + (f'<a class="coach-tel u" href="tel:{p.replace(" ", "")}">{p}</a>' if p else '<p class="coach-tel coach-none">Kontakt na recepcii</p>') + '</li>'
    for n, t, x, p in COACHES)

services = phero('funkcna-zona-2', 'Služby a tréneri', 'Samostatne, s&nbsp;trénerom alebo v&nbsp;skupine',
                 'Fitness tréning je voľne prístupný počas otváracích hodín. Osobný tréning si dohodnete s trénerom, bojové športy a lekcie sú v pevných časoch.',
                 extra=f'<div class="cta-row">{btn("#rozvrh", "Rozvrh lekcií", "", "down")}{btn("#treneri", "Tréneri", "btn-ghost", None)}</div>') + f'''

  <section class="sec" aria-label="Služby">
    <div class="wrap svc-list">
{chr(10).join(svc_html[:3])}
      {lekcie_anchor}
{chr(10).join(svc_html[3:])}
    </div>
  </section>

  <section class="sec sec-alt" id="rozvrh" aria-labelledby="h-rozvrh">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Rozvrh</p>
        <h2 class="h-l" id="h-rozvrh" data-kt>Kedy sú lekcie a&nbsp;bojové športy</h2>
        <p class="lead">Na lekciu príďte podľa rozvrhu, prvýkrát stačí športové oblečenie a voda. {todo('aktuálny rozvrh lekcií od prevádzky, teraz podľa gymklub.sk (27. 9. 2026)')}</p>
      </div>
      <div class="tt" data-tt>{''.join(rows)}</div>
    </div>
  </section>

  <section class="sec" id="treneri" aria-labelledby="h-treneri">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Tréneri</p>
        <h2 class="h-l" id="h-treneri" data-kt>Tréneri a&nbsp;ich zameranie</h2>
        <p class="lead">Osobný tréning dohodnete priamo s trénerom. Ak telefón nie je uvedený, pomôžu na recepcii alebo na čísle <a class="u" href="tel:{GYM['tel']}">{GYM['phone']}</a>. {todo('zoznam aktívnych trénerov a ich fotky; menu a stránka trénerov na gymklub.sk sa líšia')}</p>
      </div>
      <ul class="coaches">{coach_html}</ul>
    </div>
  </section>
  {cta_band('Nie ste si istí, čo si vybrať?', 'Napíšte, čo chcete dosiahnuť, a odporučíme lekciu alebo trénera. Prvýkrát stačí športové oblečenie a voda.', 'hlavna-sala-1')}'''
page('sluzby.html', 'Osobný tréning, lekcie a tréneri | GYM KLUB Nitra',
     'Fitness tréning, osobní tréneri, MMA, Jiu Jitsu, Luta Livre, Krav Maga, pilates, zdravý chrbát a nutričné poradenstvo v GYM KLUB Nitra. Rozvrh lekcií a kontakty na trénerov.',
     services)

# ---------------------------------------------------------------------------------------------
# MMA · PANDA FIGHT CLUB
bj = [(d, a, b) for d, a, b, n, c in TIMETABLE if n == 'Bojové športy']
bj_rows = ''.join(f'<tr><th scope="row">{DAYS[d]}</th><td class="num">{a} – {b}</td></tr>' for d, a, b in bj)
DISC = [
    ('MMA', 'Zmiešané bojové umenia: postoj s prvkami boxu, kickboxu a juda, prechod na zem a boj na zemi.'),
    ('Luta Livre', 'Brazílsky zápasnícky štýl bez kimona (no-gi): páky, škrtenia a obrana proti nim.'),
    ('Jiu Jitsu', 'Boj na zemi: kontrola súpera, páky a škrtenia.'),
]
disc = ''.join(f'<li class="disc-i" data-spot><span class="mono">{i + 1:02d}</span><h3 class="disc-h">{e(n)}</h3><p>{e(t)}</p></li>' for i, (n, t) in enumerate(DISC))
mma = phero('panda:1', 'MMA · Luta Livre · Jiu Jitsu', 'Panda Fight Club',
            'Klub bojových športov trénera Michala Šášika v GYM KLUB na Výstavnej 6, vo vlastnej sále s tatami. Nových členov prijíma stále, začať sa dá bez skúseností.',
            extra=f'<div class="cta-row">{btn("tel:" + PANDA["tel"], "Zavolať trénerovi", "", "tel")}{btn("#rozvrh-mma", "Kedy sa trénuje", "btn-ghost", None)}</div>') + f'''

  <div class="marquee mono-xl marquee-band" aria-hidden="true"><div class="marquee-t"><span>Postoj</span><span>Zem</span><span>Páky</span><span>Škrtenia</span><span>Postoj</span><span>Zem</span><span>Páky</span><span>Škrtenia</span></div></div>

  <section class="sec" aria-labelledby="h-disc">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Čo sa trénuje</p>
        <h2 class="h-xl" id="h-disc" data-kt>Postoj aj zem</h2>
        <p class="lead">Tréningy vedie Michal Šášik. Skúsenosti nie sú potrebné, začína sa od úplných základov. Prvýkrát stačí športové oblečenie a voda.</p>
      </div>
      <ol class="disc">{disc}</ol>
    </div>
  </section>

  <section class="sec sec-alt" aria-labelledby="h-sala">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Sála</p>
        <h2 class="h-l" id="h-sala" data-kt>Tatami, vrecia a&nbsp;hrazdy</h2>
        <p class="lead">Samostatná sála s veľkou plochou tatami. Podľa webu klubu sa na tréning vchádza zo zadnej strany budovy OC Lipa. {todo('potvrdenie vchodu do sály zo zadnej strany budovy a súhlas klubu s použitím mena, loga a fotiek')}</p>
      </div>
      <div class="panda-pics">
        <figure data-par="0.06">{pic_panda(1, '(max-width: 760px) 100vw, 58vw', PANDA_ALT[0])}</figure>
        <figure data-par="-0.06">{pic_panda(2, '(max-width: 760px) 100vw, 40vw', PANDA_ALT[1])}</figure>
      </div>
      <p class="src mono">Fotky sály: gymklub.sk</p>
    </div>
  </section>

  <section class="sec" id="rozvrh-mma" aria-labelledby="h-mma-rozvrh">
    <div class="wrap two">
      <div>
        <p class="mono kicker">Rozvrh</p>
        <h2 class="h-l" id="h-mma-rozvrh" data-kt>Kedy sa trénuje</h2>
        <p class="lead">Pred prvým tréningom dajte trénerovi vedieť telefonicky alebo správou na Instagrame. {todo('cena tréningov a členstva v klube')}</p>
      </div>
      <div>
        <table class="table">
          <caption class="sr-only">Tréningy Panda Fight Club</caption>
          <tbody>{bj_rows}</tbody>
        </table>
        <p class="lead">{todo(PANDA_SCHEDULE_NOTE)}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-alt" aria-labelledby="h-trener">
    <div class="wrap two">
      <div>
        <p class="mono kicker">Tréner a kontakt</p>
        <h2 class="h-l" id="h-trener" data-kt>{PANDA['coach']}</h2>
        <p class="lead">Hlavný tréner Panda Fight Club. Termín prvého tréningu, cenu aj otázky k začiatkom dohodnete priamo s ním.</p>
        <p class="award">Panda Fight Club Nitra je laureát a držiteľ zlatej medaily v súťaži <a class="u" href="{PANDA['award']}" target="_blank" rel="noopener">Orly fyzickej aktivity 2024</a>.</p>
      </div>
      <ul class="c-list">
        <li><span class="mono c-l">Telefón</span><a class="c-v" href="tel:{PANDA['tel']}">{PANDA['phone']}</a></li>
        <li><span class="mono c-l">E-mail</span><a class="c-v" href="mailto:{PANDA['email']}">{PANDA['email']}</a></li>
        <li><span class="mono c-l">Sociálne siete</span><span class="c-v c-soc"><a href="{PANDA['instagram']}" target="_blank" rel="noopener">Instagram</a> · <a href="{PANDA['facebook']}" target="_blank" rel="noopener">Facebook</a></span></li>
        <li><span class="mono c-l">Web klubu</span><a class="c-v" href="{PANDA['web']}" target="_blank" rel="noopener">pandafightclub.webnode.sk</a></li>
      </ul>
    </div>
  </section>
  {cta_band('Príďte na prvý tréning', 'Stačí športové oblečenie a voda. Ak chcete trénovať aj vo fitku, pozrite si vstupy a permanentky GYM KLUB.', 'tatami-1')}'''
page('mma.html', 'MMA a Panda Fight Club | GYM KLUB Nitra',
     'Panda Fight Club Nitra v GYM KLUB na Výstavnej 6: MMA, Luta Livre a Jiu Jitsu s trénerom Michalom Šášikom. Rozvrh, sála s tatami a kontakt.',
     mma)

# ---------------------------------------------------------------------------------------------
# KONTAKT
hours_rows = ''.join(f'<li data-days="{d}"><span>{n}</span><b>{h}</b></li>' for d, (n, h) in zip(['1-4', '5', '6-7'], HOURS))
FAQ = [
    ('Musím sa objednať?', 'Na samostatný fitness tréning nie, stačí prísť počas otváracích hodín. Na lekcie príďte podľa rozvrhu, osobný tréning dohodnete priamo s trénerom.'),
    ('Potrebujem skúsenosti s bojovými športmi?', 'Nie. Inštruktori začnú aj od úplných základov. Prvýkrát stačí športové oblečenie a voda.'),
    ('Ako môžem zaplatiť?', 'Na recepcii v hotovosti, kartou sa podľa gymklub.sk platiť nedá. Upbalansea app platí pri všetkých vstupoch, MultiSport pri jednorazovom vstupe.'),
    ('Musím byť členom, aby som mohol prísť?', 'Nie. Stačí zaplatiť jednorazový vstup za 6 € a trénovať.'),
    ('Sú k dispozícii šatne a sprchy?', 'Áno. Zoberte si uterák, čistú obuv na prezutie a vodu.'),
    ('Kde parkovať?', None),
]
faq_html = ''.join(
    f'<details class="faq-i"><summary>{e(q)}</summary><p>{e(a) if a else todo("parkovanie pri Lipa Centre (kde, či je bezplatné)")}</p></details>'
    for q, a in FAQ)
contact = phero('vstup-1', 'Kontakt · Lipa Centrum, Chrenová', 'Výstavná 6, Nitra',
                'Vchod je z krytej terasy Lipa Centra, dvere pod nápisom GYM KLUB &amp; caffee. Zavolajte, napíšte alebo príďte rovno počas otváracích hodín.',
                extra='<div class="cta-row">' + btn(GYM['maps'], 'Navigovať', '', 'pin', NEWTAB) + btn('tel:' + GYM['tel'], GYM['phone'], 'btn-ghost', 'tel') + '</div>') + f'''

  <section class="sec" aria-labelledby="h-kde">
    <div class="wrap contact-grid">
      <div>
        <p class="mono kicker">Kontakt</p>
        <h2 class="h-l" id="h-kde" data-kt>Zavolajte alebo napíšte</h2>
        <ul class="c-list">
          <li><span class="mono c-l">Telefón</span><a class="c-v" href="tel:{GYM['tel']}">{GYM['phone']}</a></li>
          <li><span class="mono c-l">E-mail</span><a class="c-v" href="mailto:{GYM['email']}">{GYM['email']}</a></li>
          <li><span class="mono c-l">Adresa</span><span class="c-v">{GYM['street']} ({GYM['place']})<br>{GYM['zip']} {GYM['city']} – {GYM['district']}</span></li>
          <li><span class="mono c-l">Sociálne siete</span><span class="c-v c-soc"><a href="{GYM['instagram']}" target="_blank" rel="noopener">Instagram</a> · <a href="{GYM['facebook']}" target="_blank" rel="noopener">Facebook</a></span></li>
        </ul>
      </div>
      <div id="hodiny">
        <p class="mono kicker">Otváracie hodiny</p>
        <h2 class="h-l" data-kt>Kedy je otvorené</h2>
        <p class="visit-now" data-status-long>Po – Št 06:30 – 21:00, Pi do 23:00</p>
        <ul class="hours" data-hours>{hours_rows}</ul>
        <p class="lead">Počas sviatkov overte hodiny telefonicky. {todo(HOURS_NOTE)} {todo('otváracie hodiny počas sviatkov')}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-alt" aria-labelledby="h-mapa">
    <div class="wrap">
      <div class="sec-head">
        <p class="mono kicker">Poloha</p>
        <h2 class="h-l" id="h-mapa" data-kt>Ako sa k&nbsp;nám dostanete</h2>
        <p class="lead">Výstavná 6, budova Lipa Centrum na Chrenovej. Vchod je z krytej terasy, dvere pod nápisom GYM KLUB &amp; caffee. {todo('parkovanie a zastávka MHD v blízkosti')}</p>
      </div>
      <div class="map" id="map">
        {pic('terasa-1', '(max-width: 760px) 100vw, 1400px', alt='')}
        <div class="map-in">
          <p class="mono">Mapa sa načíta z Map Google až po kliknutí.</p>
          <div class="cta-row"><button class="btn" type="button" id="mapLoad" data-src="{GYM['embed']}"><span class="btn-t"><span>Zobraziť mapu</span><span aria-hidden="true">Zobraziť mapu</span></span></button>{btn(GYM['maps'], 'Navigovať', 'btn-ghost', 'pin', NEWTAB)}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="navsteva" aria-labelledby="h-form">
    <div class="wrap two">
      <div>
        <p class="mono kicker">Naplánovať návštevu</p>
        <h2 class="h-l" id="h-form" data-kt>Dajte vedieť, kedy prídete</h2>
        <p class="lead">Vyplňte meno, kontakt a čo vás zaujíma. Po odoslaní sa otvorí váš e-mail s pripravenou správou pre GYM KLUB, stačí ju odoslať. Radšej voláte? <a class="u" href="tel:{GYM['tel']}">{GYM['phone']}</a></p>
        <p class="lead">{todo('ak majú správy chodiť priamo bez e-mailového programu návštevníka, napojenie formulára na službu (napr. Formspree) a súhlas so spracovaním osobných údajov')}</p>
      </div>
      <form class="form" id="form" action="mailto:{GYM['email']}" method="post" enctype="text/plain" novalidate>
        <div class="f-row">
          <label for="fName">Meno <span aria-hidden="true">*</span></label>
          <input id="fName" name="meno" autocomplete="name" required aria-describedby="fNameErr">
          <p class="f-err" id="fNameErr" hidden>Napíšte meno.</p>
        </div>
        <div class="f-row">
          <label for="fContact">Telefón alebo e-mail <span aria-hidden="true">*</span></label>
          <input id="fContact" name="kontakt" autocomplete="email" inputmode="email" required aria-describedby="fContactHelp fContactErr">
          <p class="f-help" id="fContactHelp">Ozveme sa na číslo alebo e-mail, ktorý uvediete.</p>
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
          <textarea id="fMsg" name="sprava" rows="4" placeholder="Napríklad: chcem začať s osobným trénerom, trénujem 3-krát týždenne."></textarea>
        </div>
        <button class="btn" type="submit"><span class="btn-t"><span>Pripraviť správu</span><span aria-hidden="true">Pripraviť správu</span></span><i>{ICON['arrow']}</i></button>
        <p class="f-ok" id="fOk" role="status" hidden>Otvoril sa váš e-mailový program s pripravenou správou. Ak sa neotvoril, napíšte na <a class="u" href="mailto:{GYM['email']}">{GYM['email']}</a> alebo zavolajte.</p>
      </form>
    </div>
  </section>

  <section class="sec sec-alt" aria-labelledby="h-faq">
    <div class="wrap two">
      <div><p class="mono kicker">Otázky</p><h2 class="h-l" id="h-faq" data-kt>Pred prvým tréningom</h2></div>
      <div class="faq">{faq_html}</div>
    </div>
  </section>'''
page('kontakt.html', 'Kontakt a otváracie hodiny | GYM KLUB Nitra',
     'GYM KLUB, Výstavná 6 (Lipa Centrum), 949 01 Nitra. Telefón +421 944 800 394, e-mail info@gymklub.sk, otváracie hodiny, mapa a formulár na naplánovanie návštevy.',
     contact)
print('hotovo')
