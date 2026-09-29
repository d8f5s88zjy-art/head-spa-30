#!/usr/bin/env python3
"""Vygeneruje 6 stránok webu GYM KLUB (index, o-fitku, clenstva, sluzby, mma, kontakt) so spoločnou
hlavičkou, navigáciou a pätičkou. Spustenie z priečinka lipa-gym/3d:  python3 tools/generuj.py

Všetky fakty o prevádzke sú v slovníku GYM nižšie. Údaje, ktoré prevádzka ešte nepotvrdila,
sú na stránke označené značkou „Doplniť: …“ (funkcia todo); pred zverejnením ich treba získať
alebo potvrdiť a značku odstrániť (TODO_VISIBLE = False ich skryje všetky naraz).
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
    {'name': 'Jednorazový vstup', 'price': '6 €', 'per': '1 vstup', 'text': 'Jeden fitness tréning v celom fitku. Bez viazanosti, na vyskúšanie alebo keď chodíte nepravidelne.', 'cards': 'MultiSport, Upbalansea app', 'main': False},
    {'name': 'Permanentka klasická', 'price': '50 €', 'per': 'mesiac', 'text': 'Fitness tréningy počas celého mesiaca. Pri 9 a viac tréningoch mesačne vychádza lacnejšie než jednotlivé vstupy.', 'cards': 'Upbalansea app', 'main': True},
    {'name': 'Permanentka študent', 'price': '42 €', 'per': 'mesiac', 'text': 'Fitness tréningy počas celého mesiaca so zľavou pre študentov.', 'cards': 'Upbalansea app', 'main': False},
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
ZONES = [
    ('prichod', 'Príchod a recepcia', 'Vchod je z krytej terasy Lipa Centra, dvere pod nápisom GYM KLUB & caffee. Hneď za nimi je recepcia s nápojmi a polička na obuv, tu zaplatíte vstup.', ['terasa-1', 'vstup-1', 'recepcia-1'], 'vstup-1'),
    ('hlavna-sala', 'Hlavná sála', 'Najviac strojov na jednom mieste: viacstaničné kladkové veže, stroje so záťažou na jednotlivé partie, kotúčové jednoručky a zrkadlová stena.', ['hlavna-sala-1', 'hlavna-sala-2', 'hlavna-sala-4', 'hlavna-sala-5', 'hlavna-sala-3', 'hlavna-sala-6'], 'hlavna-sala-2'),
    ('sala-so-strojmi', 'Sála so strojmi', 'Druhá, svetlá sála s veľkými oknami: kladkové stroje, polohovateľné lavice, lavice so stojanmi na osi a stojan s pevnými činkami.', ['stroje-4', 'stroje-1', 'stroje-2', 'stroje-3'], 'stroje-4'),
    ('kardio', 'Kardio', 'Rad bežeckých pásov Life Fitness pri oknách s výhľadom do zelene, eliptický a schodový trenažér. Hodí sa na rozcvičenie aj samostatný kardio tréning.', ['kardio-3', 'kardio-1', 'kardio-2'], 'kardio-1'),
    ('volne-vahy', 'Voľné váhy', 'Stojany s jednoručkami pri zrkadlách, samostatný stojan s gumovými jednoručkami do 20 kg, lavice so stojanmi na osi, kotúče a lavica na bicepsy.', ['volne-vahy-1', 'volne-vahy-2', 'volne-vahy-3', 'jednorucky-1'], 'volne-vahy-2'),
    ('funkcna-zona', 'Funkčná zóna', 'Priestor na kondičný a funkčný tréning: šprintérska dráha na podlahe, rig Life Fitness so závesnými popruhmi a boxovacím vrecom, kettlebelly, medicinbaly a vzduchový bicykel.', ['funkcna-zona-4', 'funkcna-zona-1', 'funkcna-zona-2', 'funkcna-zona-5', 'funkcna-zona-3', 'funkcna-zona-6', 'funkcna-zona-7'], 'funkcna-zona-6'),
    ('tatami', 'Tatami', 'Samostatná miestnosť bez strojov: podložky, zrkadlová stena, švédska rebrina a závesné popruhy.', ['tatami-1', 'tatami-2', 'tatami-3'], 'tatami-2'),
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
ADDR = f"{GYM['street']} ({GYM['place']}), {GYM['zip']} {GYM['city']}"


def todo(note):
    """Viditeľná značka pre údaj, ktorý treba doplniť alebo potvrdiť pred zverejnením."""
    if not TODO_VISIBLE:
        return ''
    return f'<span class="todo"><b>Doplniť:</b> {e(note)}</span>'


def pic(sid, sizes, alt=None, lazy=True, cls='', eager_hi=False):
    f = FOTKY[sid]; big = f['big']; h1280 = round(f['h'] * 1280 / f['w'])
    ss = lambda ext: f'media/tour-{sid}-480.{ext} 480w, media/tour-{sid}-1280.{ext} 1280w, media/tour-{sid}-{big}.{ext} {big}w'
    load = 'fetchpriority="high"' if eager_hi else ('loading="lazy"' if lazy else '')
    c = f' class="{cls}"' if cls else ''
    return (f'<picture{c}><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="media/tour-{sid}-1280.jpg" srcset="{ss("jpg")}" sizes="{sizes}" width="1280" height="{h1280}" '
            f'alt="{e(f["alt"] if alt is None else alt)}" decoding="async" {load} style="object-position:{f["fx"]}% {f["fy"]}%"></picture>')


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


def stage(sid, extra_cls=''):
    f = FOTKY[sid]
    return (f'<div class="s3d{extra_cls}" data-depth="media/depth-{sid}.png" data-fx="{f["fx"]}" data-fy="{f["fy"]}">'
            f'{pic(sid, "100vw")}</div>')


ICON = {
    'arrow': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    'ig': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    'fb': '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    'menu': '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8"/></svg>',
    'tel': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.6 3h3l1.5 4.5-2 1.3a12 12 0 0 0 6.1 6.1l1.3-2 4.5 1.5v3A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    'pin': '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
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
<!-- Návrh na posúdenie: kým prevádzka nedodá údaje označené „Doplniť:“, stránka sa neindexuje. Pred zverejnením odstrániť. -->
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
<!-- poistka: text úvodu sa odkryje najneskôr po 1,5 s, aj keby skript nenabehol -->
<script>document.documentElement.classList.add('js');setTimeout(function(){{document.documentElement.classList.add('ready')}},1500)</script>
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
    <p class="menu-info">{GYM['street']}, {GYM['place']}, Nitra</p>
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
      {todo('potvrdené víkendové hodiny')}
    </div>
  </div>
  <div class="wrap foot-b">
    <p>© 2026 {e(GYM['full'])}</p>
    <p><a href="../">Klasická verzia webu</a> · <a href="https://www.gymklub.sk/" target="_blank" rel="noopener">gymklub.sk</a></p>
  </div>
</footer>

<nav class="dock" id="dock" aria-label="Rýchle odkazy">
  <a class="dock-a" href="clenstva.html">Cenník</a>
  <a class="dock-a dock-tel" href="tel:{GYM['tel']}" aria-label="Zavolať do GYM KLUB {GYM['phone']}">{ICON['tel']}<span>Volať</span></a>
  <a class="dock-a dock-main" href="kontakt.html#navsteva">Naplánovať návštevu</a>
</nav>
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


def plan_cards(link=True):
    out = []
    for p in PLANS:
        out.append(f'''<li class="plan{' plan-main' if p['main'] else ''}">
          {'<p class="plan-tag">Pri pravidelnom tréningu</p>' if p['main'] else ''}
          <h3 class="plan-h">{e(p['name'])}</h3>
          <p class="plan-price"><span>{p['price']}</span> / {p['per']}</p>
          <p class="plan-p">{e(p['text'])}</p>
          <p class="plan-cards">{e(p['cards'])}</p>
          {f'<a class="btn{"" if p["main"] else " btn-ghost"}" href="kontakt.html#navsteva">Naplánovať prvý tréning</a>' if link else ''}
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
    ('fitness', 'Samostatný tréning', 'Stroje, voľné váhy, kardio a funkčná zóna každý deň počas otváracích hodín. Bez objednávania.', 'hlavna-sala-4'),
    ('osobny-trening', 'Osobný tréner', 'Plán podľa cieľa, kontrola techniky a jedálniček. Termín dohodnete priamo s trénerom.', 'volne-vahy-1'),
    ('bojove-sporty', 'MMA a bojové športy', 'MMA, Jiu Jitsu a Luta Livre s Panda Fight Club. Začína sa od úplných základov.', 'panda:1'),
    ('lekcie', 'Skupinové lekcie', 'Krav Maga, pilates a zdravý chrbát v pevných časoch podľa týždenného rozvrhu.', 'tatami-3'),
]


def svc_pic(photo, sizes):
    if photo.startswith('panda:'):
        return pic_panda(photo[6:], sizes, PANDA_ALT[int(photo[6:]) - 1])
    return pic(photo, sizes)


QUICK = f'''<section class="quick" id="rychle" aria-label="Najdôležitejšie informácie">
    <ul class="wrap quick-l">
      <li><span class="quick-k">{ICON['pin']} Adresa</span><span class="quick-v">{GYM['street']}, {GYM['place']}, Nitra</span><a class="quick-a" href="{GYM['maps']}" target="_blank" rel="noopener">Navigovať</a></li>
      <li><span class="quick-k">Otvorené každý deň</span><span class="quick-v">Po – Št 06:30 – 21:00, Pi do 23:00, cez víkend kratšie</span><a class="quick-a" href="kontakt.html#hodiny">Všetky hodiny</a></li>
      <li><span class="quick-k">Vstup</span><span class="quick-v">6 € jednorazovo, 50 € na mesiac, platba v hotovosti</span><a class="quick-a" href="clenstva.html">Celý cenník</a></li>
      <li><span class="quick-k">{ICON['tel']} Telefón</span><span class="quick-v">{GYM['phone']}</span><a class="quick-a" href="tel:{GYM['tel']}">Zavolať</a></li>
    </ul>
  </section>'''

home = f'''  <section class="hero" id="uvod" aria-labelledby="h-hero">
    <div class="hero-stage">
      <!-- úvodná scéna: skutočná fotka funkčnej zóny; skript ju zhasne, rozsvieti LED šesťuholníky a pri skrolovaní vojde kamera do priestoru -->
      <div class="hero-scene" id="heroScene" data-depth="media/depth-funkcna-zona-7.png" data-lights="media/lights-funkcna-zona-7.png">
        {pic('funkcna-zona-7', '100vw', alt='Funkčná zóna fitka GYM KLUB so stropom zo šesťuholníkových LED svetiel a šprintérskou dráhou na podlahe.', lazy=False, eager_hi=True)}
      </div>
      <div class="hero-in wrap" id="heroIn">
        <p class="hero-k">Výstavná 6 · Lipa Centrum · Nitra</p>
        <h1 class="hero-h" id="h-hero"><span>GYM KLUB</span> <span class="hero-h2">Fitko a bojové športy v Lipa Centre</span></h1>
        <p class="hero-p">Dve sály so strojmi, voľné váhy, kardio, funkčná zóna so šprintérskou dráhou a sála s tatami pre MMA. Plne klimatizované a otvorené každý deň.</p>
        <div class="cta-row">
          <a class="btn" href="o-fitku.html#prehliadka">Otvoriť 3D prehliadku</a>
          <a class="btn btn-ghost" href="clenstva.html">Cenník od 6 €</a>
        </div>
        <a class="hero-skip-m" href="#rychle">Preskočiť úvod na adresu a hodiny</a>
      </div>
      <a class="hero-skip" href="#rychle">Preskočiť úvod <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  {QUICK}

  <section class="sec" aria-labelledby="h-preco">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Prečo sem</p>
        <h2 class="h2" id="h-preco">Silový tréning, kardio aj MMA na jednej adrese</h2>
      </div>
      <ol class="reasons">
        <li class="rv"><span class="reason-n">01</span><h3 class="h3">Sedem priestorov, nie jedna sála</h3><p>Hlavná sála, druhá sála s kladkami, kardio pri oknách, voľné váhy, funkčná zóna a tatami. Každý typ tréningu má svoje miesto.</p></li>
        <li class="rv"><span class="reason-n">02</span><h3 class="h3">Tréneri pre fitness aj boj</h3><p>Osobní tréneri, Panda Fight Club pre MMA a lekcie Krav Maga, pilates a zdravý chrbát. Začať sa dá aj bez skúseností.</p></li>
        <li class="rv"><span class="reason-n">03</span><h3 class="h3">Prídete, zaplatíte, trénujete</h3><p>Na samostatný tréning sa netreba objednávať. Jednorazový vstup za 6 € alebo mesačná permanentka, platí sa v hotovosti na recepcii.</p></li>
      </ol>
      <div class="who rv">
        <h3 class="h3">Pre koho je GYM KLUB</h3>
        <ul class="who-l">
          <li><b>Silový tréning a kulturistika.</b> Dve sály so strojmi, voľné váhy a tréneri vrátane majstra Slovenska v kulturistike.</li>
          <li><b>Začiatočníci.</b> Zdravý chrbát je podľa trénerky vhodný pre začiatočníkov, bojové športy začínajú od základov.</li>
          <li><b>MMA a bojové športy.</b> Panda Fight Club s vlastnou sálou a tatami.</li>
          <li><b>Študenti a dôchodcovia.</b> Zľavnený vstup za 5 € a 3,50 €, študentská permanentka za 42 €.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-priestory">
    <div class="wrap sec-head rv">
      <p class="kicker">Priestory</p>
      <h2 class="h2" id="h-priestory">Pozrite sa dnu skôr, než prídete</h2>
      <p class="sec-p">32 skutočných záberov z prevádzky v 3D prehliadke: prejdete od vchodu cez sály až po tatami a pri vybavení uvidíte, čo je čo.</p>
    </div>
    <div class="wrap preview rv">
      {stage('hlavna-sala-2', ' preview-stage')}
      <ul class="preview-l">
        <li><a class="tile" href="o-fitku.html#kardio">{pic('kardio-1', '(max-width: 760px) 50vw, 300px')}<span>Kardio</span></a></li>
        <li><a class="tile" href="o-fitku.html#funkcna-zona">{pic('funkcna-zona-6', '(max-width: 760px) 50vw, 300px')}<span>Funkčná zóna</span></a></li>
        <li><a class="tile" href="o-fitku.html#volne-vahy">{pic('volne-vahy-2', '(max-width: 760px) 50vw, 300px')}<span>Voľné váhy</span></a></li>
        <li><a class="tile" href="o-fitku.html#tatami">{pic('tatami-2', '(max-width: 760px) 50vw, 300px')}<span>Tatami</span></a></li>
      </ul>
    </div>
    <div class="wrap more rv"><a class="btn" href="o-fitku.html#prehliadka">Otvoriť 3D prehliadku</a></div>
  </section>

  <section class="sec" aria-labelledby="h-sluzby">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Služby</p>
        <h2 class="h2" id="h-sluzby">Samostatne, s trénerom alebo v skupine</h2>
      </div>
      <ul class="svc">
        {''.join(f'<li class="svc-i rv"><a href="sluzby.html#{s[0]}">{svc_pic(s[3], "(max-width: 760px) 40vw, 300px")}<span class="svc-t"><span class="h3">{e(s[1])}</span><span class="svc-p">{e(s[2])}</span></span></a></li>' for s in SERVICES_SHORT)}
      </ul>
    </div>
  </section>

  <section class="panda-band" aria-labelledby="h-panda-home">
    {pic_panda(1, '100vw', PANDA_ALT[0], cls='panda-band-img')}
    <div class="wrap panda-band-in rv">
      <p class="kicker">MMA v GYM KLUB</p>
      <h2 class="h2" id="h-panda-home">Panda Fight Club</h2>
      <p class="lead">MMA, Luta Livre a Jiu Jitsu s trénerom Michalom Šášikom vo vlastnej sále s tatami. Klub neustále prijíma nových členov a začína sa od základov, stačí prísť na tréning.</p>
      <div class="cta-row"><a class="btn" href="mma.html">Rozvrh a kontakt klubu</a><a class="btn btn-ghost" href="tel:{PANDA['tel']}">Zavolať trénerovi</a></div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-clenstva">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Cenník</p>
        <h2 class="h2" id="h-clenstva">Jeden vstup za 6 €, mesiac za 50 €</h2>
        <p class="sec-p">Žiadna dlhodobá zmluva, platí sa v hotovosti na recepcii. Kto trénuje viac ako dvakrát do týždňa, ušetrí s permanentkou. {todo(PRICES_NOTE)}</p>
      </div>
      <div class="rv">{plan_cards()}</div>
      <div class="more rv"><a class="link" href="clenstva.html">Balíky vstupov, zľavy a podmienky {ICON['arrow']}</a></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-prva">
    <div class="wrap first">
      <div class="rv">
        <p class="kicker">Prvá návšteva</p>
        <h2 class="h2" id="h-prva">Čo si zobrať a ako to prebieha</h2>
        <p class="sec-p">Na samostatný tréning netreba nič vopred vybavovať. Ak chcete začať s trénerom alebo na lekcii, dohodnite si termín vopred.</p>
        <div class="cta-row"><a class="btn" href="kontakt.html#navsteva">Naplánovať návštevu</a><a class="btn btn-ghost" href="tel:{GYM['tel']}">{ICON['tel']} {GYM['phone']}</a></div>
      </div>
      <ol class="steps rv">
        <li><b>Príďte kedykoľvek počas otváracích hodín.</b> Vchod je z krytej terasy Lipa Centra, dvere pod nápisom GYM KLUB &amp; caffee.</li>
        <li><b>Na recepcii zaplaťte vstup v hotovosti.</b> Jednorazový vstup stojí 6 €. Upbalansea app alebo MultiSport ukážte tu.</li>
        <li><b>Prezujte sa a prezlečte.</b> Potrebujete čistú obuv, uterák a vodu. Šatne a sprchy sú k dispozícii.</li>
        <li><b>Trénujte sami alebo s trénerom.</b> Stroje a váhy sú voľne prístupné. Osobný tréning a lekcie si dohodnete priamo s trénerom.</li>
      </ol>
    </div>
  </section>'''
page('index.html', 'GYM KLUB Nitra | Fitko a bojové športy v Lipa Centre',
     'Fitko GYM KLUB na Výstavnej 6 v Nitre (Lipa Centrum): dve sály so strojmi, voľné váhy, kardio, funkčná zóna a tatami. Vstup 6 €, permanentka 50 €, osobní tréneri, MMA a lekcie.',
     home, over_hero=True, extra_head=f'<script type="application/ld+json">{JSONLD}</script>\n')

# ---------------------------------------------------------------------------------------------
# PREHLIADKA (o-fitku.html): 3D prehliadka skutočných záberov, pod ňou zóny s fotkami
TOUR = json.load(open(os.path.join(ROOT, 'assets', 'tour.json'), encoding='utf-8'))
ZONE_TEXT = {z[0]: z[2] for z in ZONES}
ZONE_TEXT['panda'] = 'Samostatná sála klubu Panda Fight Club s veľkou plochou tatami, boxovacími vrecami a hrazdami. Trénuje sa tu MMA, Luta Livre a Jiu Jitsu.'
ZONE_TEXT['prichod'] = 'Vchod je z krytej terasy Lipa Centra, dvere sú pod nápisom GYM KLUB & caffee. Hneď za nimi je recepcia s nápojmi a polička na obuv. Tu zaplatíte vstup.'
TOUR_STOPS = [s for s in TOUR['stops'] if s.get('tour', True)]
TOUR_PAGE = {'zones': TOUR['zones'], 'stops': TOUR_STOPS}
N_PANO = sum(1 for s in TOUR_STOPS if s['type'] == 'pano')
N_PHOTO = len(TOUR_STOPS) - N_PANO
first = TOUR_STOPS[0]
PANO_ZONES = {s['zone'] for s in TOUR_STOPS if s['type'] == 'pano'}
route = ''.join(
    f'<li><button type="button" data-zone="{z["id"]}"><b>{i:02d}</b> {e(z["name"])}'
    f'{" <em>panoráma</em>" if z["id"] in PANO_ZONES else ""}'
    f' <small>{sum(1 for s in TOUR_STOPS if s["zone"] == z["id"])}</small></button></li>'
    for i, z in enumerate(TOUR['zones'], 1))
# zoznam miest v prehliadke (panel v scéne, funguje aj na celej obrazovke)
places = []
for i, z in enumerate(TOUR['zones'], 1):
    li = ''.join(
        f'<li><button type="button" data-stop="{s["id"]}"><span>{e(s["title"])}</span>'
        f'<small>{"Panoráma " + str(s["hfov"]) + "°" if s["type"] == "pano" else "Fotka"}</small></button></li>'
        for s in TOUR_STOPS if s['zone'] == z['id'])
    places.append(f'<li><p class="tv-list-z"><b>{i:02d}</b> {e(z["name"])}</p><ol>{li}</ol></li>')
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
        items.append(f'''          <li class="rail-i"><a class="ph" href="media/{s['img']}-{big}.jpg" data-i="{gi}" data-src="{s['img']}" data-big="{big}" data-w="{s['w']}" data-h="{s['h']}" data-zone="{e(z['name'])}" aria-label="{e(z['name'])}, fotka {n} z {len(zs)}: zväčšiť">{zone_pic(s, "(max-width: 760px) 44vw, 240px")}</a></li>''')
        gi += 1
    src = '<p class="src">Fotky: gymklub.sk.</p>' if z['id'] == 'panda' else ''
    zones_html.append(f'''    <article class="zone rv" id="{z['id']}" aria-labelledby="h-{z['id']}">
      <div class="wrap zone-head">
        <div>
          <p class="zone-n">{zi:02d} <span>/ {len(TOUR['zones']):02d}</span></p>
          <h2 class="zone-h" id="h-{z['id']}">{e(z['name'])}</h2>
          <p class="zone-p">{e(ZONE_TEXT[z['id']])}</p>
          <p class="zone-a"><a class="link" href="#prehliadka" data-tour-stop="{first_stop['id']}">Otvoriť v prehliadke {ICON['arrow']}</a></p>
          {src}
        </div>
        <div class="rail-ctl" hidden>
          <span class="rail-count" aria-hidden="true"><b>1</b> / {len(zs)}</span>
          <button class="rail-btn" type="button" data-dir="-1" aria-label="Predchádzajúce fotky: {e(z['name'])}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="rail-btn" type="button" data-dir="1" aria-label="Ďalšie fotky: {e(z['name'])}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
        </div>
      </div>
      <ul class="rail" aria-label="Fotky: {e(z['name'])}">
{chr(10).join(items)}
      </ul>
    </article>''')

about = f'''  <section class="tv" id="prehliadka" aria-labelledby="h-tv">
    <div class="tv-stage" tabindex="0" aria-roledescription="prehliadka" aria-describedby="tvHelp">
      <div class="tv-flat"><img class="tv-img" src="media/{first['img']}-240.webp" alt="{e(first['alt'])}" fetchpriority="high" decoding="async"></div>
      <div class="tv-pins"></div>
      <button class="tv-go" type="button"><i aria-hidden="true">{ICON['arrow']}</i><span>Ďalej</span></button>
      <div class="tv-cap">
        <h1 class="tv-h" id="h-tv">Prehliadka GYM KLUB</h1>
        <p class="tv-zone"></p>
        <p class="tv-title"></p>
        <p class="tv-count"><span class="tv-badge"></span> <span class="tv-n"></span></p>
      </div>
      <div class="tv-top">
        <button class="tv-pill tv-open" type="button" aria-expanded="false" aria-controls="tvList"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> <span>Priestory</span></button>
        <a class="tv-pill tv-cta" href="kontakt.html#navsteva">Naplánovať návštevu</a>
      </div>
      <div class="tv-card" hidden><p class="tv-card-h"></p><p class="tv-card-p"></p><button class="tv-card-x" type="button" aria-label="Zavrieť popis"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="tv-ctl" role="toolbar" aria-label="Ovládanie prehliadky">
        <div class="tv-grp">
          <button class="tv-btn tv-prev" type="button" aria-label="Predchádzajúce miesto" title="Späť (P)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tv-btn tv-next" type="button" aria-label="Ďalšie miesto" title="Ďalej (N)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="tv-grp tv-grp-s">
          <button class="tv-btn tv-zout" type="button" aria-label="Oddialiť" title="Oddialiť (−)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tv-btn tv-zin" type="button" aria-label="Priblížiť" title="Priblížiť (+)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tv-btn tv-gyro" type="button" aria-pressed="false" aria-label="Rozhliadať sa pohybom telefónu" title="Pohyb telefónom" hidden><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2M3 9c-1 2-1 4 0 6M21 9c1 2 1 4 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tv-btn tv-home" type="button" aria-label="Späť na začiatok prehliadky" title="Na začiatok (0)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 11l8-7 8 7M6 10v10h12V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="tv-btn tv-fs" type="button" aria-pressed="false" aria-label="Celá obrazovka" title="Celá obrazovka (F)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      <div class="tv-list" id="tvList" hidden>
        <div class="tv-list-in">
          <div class="tv-list-head"><p class="tv-list-t">Priestory v prehliadke</p><button class="tv-btn tv-list-x" type="button" aria-label="Zavrieť zoznam"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
          <ol class="tv-list-l">{places}</ol>
          <p class="tv-list-note">Panoráma je zložená zo skutočného videa, ktoré sa otáča na mieste. Fotka je jeden záber s jemným priestorovým efektom. Pôdorys nie je k dispozícii, preto ide o zoznam v poradí od vchodu.</p>
        </div>
      </div>
      <div class="tv-guide" hidden>
        <div class="tv-guide-in">
          <p class="tv-guide-h">Ako sa pohybovať</p>
          <ul>
            <li><b>Rozhliadanie:</b> ťahajte obraz myšou alebo prstom. Na klávesnici šípky.</li>
            <li><b>Body v scéne:</b> kliknite na bod a zobrazí sa, čo na mieste nájdete.</li>
            <li><b>Ďalej:</b> tlačidlo v scéne vás presunie na ďalšie miesto. Zoznam priestorov je vpravo hore.</li>
          </ul>
          <button class="btn tv-guide-ok" type="button">Rozumiem</button>
        </div>
      </div>
      <p class="tv-state" hidden><span class="tv-state-t"></span> <button class="tv-retry" type="button" hidden>Skúsiť znova</button></p>
      <p class="sr-only" id="tvHelp">Šípky: rozhliadanie. Plus a mínus: priblíženie. N a P: ďalšie a predchádzajúce miesto. 0: začiatok. F: celá obrazovka.</p>
      <p class="sr-only tv-live" aria-live="polite"></p>
    </div>
    <div class="wrap tv-under">
      <nav class="tv-route" aria-label="Zóny prehliadky"><ol>{route}</ol></nav>
      <p class="tv-note">{N_PANO} panorámy zložené zo skutočného videa a {N_PHOTO} fotiek. Vlastné zábery sú z 26. 9. 2026, dve fotky sály Panda sú z gymklub.sk. Zóny idú v poradí od vchodu, nie je to pôdorys.</p>
      <div class="tv-info" aria-live="off"><p class="tv-info-p"></p><ul class="tv-info-l" aria-label="Na tomto mieste"></ul></div>
    </div>
    <script type="application/json" id="tourData">{json.dumps(TOUR_PAGE, ensure_ascii=False, separators=(',', ':'))}</script>
  </section>

  <section class="facts" aria-label="Základné informácie">
    <ul class="wrap facts-l">
      <li><span class="facts-k">Adresa</span><span class="facts-v">{GYM['street']}, {GYM['place']}, Nitra</span></li>
      <li><span class="facts-k">Otvorené</span><span class="facts-v">každý deň, bez objednávania</span></li>
      <li><span class="facts-k">Klíma</span><span class="facts-v">plne klimatizované</span></li>
    </ul>
  </section>

  <section class="tour" aria-labelledby="h-tour">
    <div class="wrap sec-head rv">
      <p class="kicker">Zóny a vybavenie</p>
      <h2 class="h2" id="h-tour">Čo nájdete v každej zóne</h2>
      <p class="sec-p">Pri každej zóne je zoznam vybavenia, ktoré je vidno na fotkách. Fotky posuniete prstom alebo šípkami, ťuknutím ich zväčšíte.</p>
    </div>
{chr(10).join(zones_html)}
  </section>

  <section class="sec sec-dark" aria-labelledby="h-zazemie">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Zázemie</p>
        <h2 class="h2" id="h-zazemie">Šatne, sprchy a recepcia</h2>
      </div>
      <ul class="checks rv">
        <li>Recepcia hneď pri vchode: tu zaplatíte vstup a ukážete Upbalansea alebo MultiSport.</li>
        <li>Šatne a sprchy. {todo('fotky šatní a spŕch; skrinky, či treba vlastný zámok')}</li>
        <li>Klimatizácia v celom fitku.</li>
      </ul>
    </div>
  </section>
'''


def cta_band(title='Príďte si to prejsť naživo', text='Na samostatný tréning sa netreba objednávať. Stačí prísť počas otváracích hodín s čistou obuvou, uterákom a vodou.'):
    return f'''<section class="band" aria-labelledby="h-band">
    <div class="wrap band-in rv">
      <h2 class="h2" id="h-band">{title}</h2>
      <p class="sec-p">{text}</p>
      <div class="cta-row"><a class="btn" href="kontakt.html#navsteva">Naplánovať návštevu</a><a class="btn btn-ghost" href="clenstva.html">Pozrieť cenník</a></div>
    </div>
  </section>'''


page('o-fitku.html', 'Prehliadka fitka | GYM KLUB Nitra',
     f'Prejdite si fitko GYM KLUB v Lipa Centre v Nitre: {N_PANO} panorámy zo skutočného videa a {N_PHOTO} fotiek. Príchod, hlavná sála, sála so strojmi, kardio, voľné váhy, funkčná zóna, tatami a sála Panda Fight Club.',
     about + cta_band())

# ---------------------------------------------------------------------------------------------
# CENNÍK
PRICE_ROWS = [(p['name'], p['price'] + ' / ' + p['per'], p['text'], p['cards']) for p in PLANS] + [(a, d, b, c) for a, b, c, d in MORE]
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
members = phero('volne-vahy-2', 'Cenník', 'Vstup 6 €, mesiac 50 €',
                'Všetky ceny sú pre samostatný fitness tréning v celom fitku. Platí sa na recepcii v hotovosti, bez dlhodobej zmluvy.') + f'''

  <section class="sec" aria-labelledby="h-plans">
    <div class="wrap">
      <div class="sec-head rv">
        <h2 class="h2" id="h-plans">Najčastejšie vstupy</h2>
        <p class="sec-p">{todo(PRICES_NOTE)}</p>
      </div>
      <div class="rv">{plan_cards()}</div>
    </div>
  </section>

  <section class="sec sec-dark" id="vsetky-ceny" aria-labelledby="h-all">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Celý cenník</p>
        <h2 class="h2" id="h-all">Všetky vstupy a permanentky</h2>
        <p class="sec-p">Podľa cenníka na gymklub.sk. Stĺpec Karty a aplikácie uvádza, čo cenník pri položke výslovne prijíma.</p>
      </div>
      <div class="table-wrap rv" tabindex="0" role="region" aria-labelledby="h-all">
        <table class="table price-t">
          <thead><tr><th scope="col">Položka</th><th scope="col" class="num">Cena</th><th scope="col">Čo zahŕňa</th><th scope="col">Karty a aplikácie</th></tr></thead>
          <tbody>{price_rows}</tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-calc">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Porovnanie</p>
        <h2 class="h2" id="h-calc">Vstupy alebo permanentka?</h2>
        <p class="sec-p">Posuňte, koľkokrát do mesiaca prídete. Porovnáva jednotlivé vstupy za 6 € s permanentkou za 50 €. Balíky 10 a 20 vstupov vychádzajú na 5 € a 4 € za vstup.</p>
      </div>
      <div class="calc rv" id="calc" data-single="6" data-month="50">
        <label class="calc-l" for="calcN">Tréningov za mesiac: <output id="calcOut" for="calcN">8</output></label>
        <input type="range" id="calcN" min="1" max="30" value="8">
        <p class="calc-r" id="calcR" aria-live="polite"></p>
        <noscript><p class="calc-r">Do 8 tréningov mesačne vychádzajú lacnejšie jednotlivé vstupy (8 × 6 € = 48 €), od 9. tréningu permanentka za 50 €.</p></noscript>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-terms">
    <div class="wrap two">
      <div class="rv">
        <h2 class="h2" id="h-terms">Ako sa platí</h2>
      </div>
      <div class="rv">
        <ul class="checks">{terms}</ul>
      </div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-pfaq">
    <div class="wrap two">
      <div class="rv"><p class="kicker">Otázky k cenám</p><h2 class="h2" id="h-pfaq">Čo sa často pýtate</h2></div>
      <div class="faq rv">{price_faq}</div>
    </div>
  </section>
  {cta_band('Prvý vstup zaplatíte na recepcii', 'Príďte počas otváracích hodín, nič netreba vopred rezervovať. S otázkou k permanentke zavolajte alebo napíšte.')}'''
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
    svc_html.append(f'''    <article class="svc-row rv{' svc-rev' if i % 2 else ''}" id="{sid_}" aria-labelledby="h-{sid_}">
      <div class="svc-media">{pic_panda(photo[6:], "(max-width: 760px) 100vw, 50vw", PANDA_ALT[int(photo[6:]) - 1]) if photo.startswith('panda:') else pic(photo, "(max-width: 760px) 100vw, 50vw")}</div>
      <div class="svc-body">
        <p class="kicker">{e(time)}</p>
        <h2 class="h2 h2-s" id="h-{sid_}">{e(name)}</h2>
        <p class="sec-p">{e(text)}</p>
        {f'<p class="more"><a class="link" href="{more}">Viac o Panda Fight Club {ICON["arrow"]}</a></p>' if more else ''}
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

services = phero('funkcna-zona-2', 'Služby a tréneri', 'Samostatne, s trénerom alebo v skupine',
                 'Fitness tréning je voľne prístupný počas otváracích hodín. Osobný tréning si dohodnete s trénerom, bojové športy a lekcie sú v pevných časoch.') + f'''

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
        <h2 class="h2" id="h-rozvrh">Kedy sú lekcie a bojové športy</h2>
        <p class="sec-p">Na lekciu príďte podľa rozvrhu, prvýkrát stačí športové oblečenie a voda. {todo('aktuálny rozvrh lekcií od prevádzky, teraz podľa gymklub.sk (27. 9. 2026)')}</p>
      </div>
      <div class="tt rv">{''.join(rows)}</div>
    </div>
  </section>

  <section class="sec" id="treneri" aria-labelledby="h-treneri">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Tréneri</p>
        <h2 class="h2" id="h-treneri">Tréneri a ich zameranie</h2>
        <p class="sec-p">Osobný tréning dohodnete priamo s trénerom. Ak telefón nie je uvedený, pomôžu na recepcii alebo na čísle <a href="tel:{GYM['tel']}">{GYM['phone']}</a>. {todo('zoznam aktívnych trénerov a ich fotky; menu a stránka trénerov na gymklub.sk sa líšia')}</p>
      </div>
      <ul class="coaches rv">{coach_html}</ul>
    </div>
  </section>
  {cta_band('Nie ste si istí, čo si vybrať?', 'Napíšte, čo chcete dosiahnuť, a odporučíme lekciu alebo trénera. Prvýkrát stačí športové oblečenie a voda.')}'''
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
disc = ''.join(f'<li class="rv"><h3 class="h3">{e(n)}</h3><p>{e(t)}</p></li>' for n, t in DISC)
mma = f'''<section class="phero" aria-labelledby="h-page">
    {pic_panda(1, '100vw', PANDA_ALT[0], lazy=False, eager_hi=True, cls='phero-img')}
    <div class="wrap phero-in">
      <p class="kicker">MMA · Luta Livre · Jiu Jitsu</p>
      <h1 class="h1" id="h-page">Panda Fight Club</h1>
      <p class="lead">Klub bojových športov trénera Michala Šášika v GYM KLUB na Výstavnej 6, vo vlastnej sále s tatami. Nových členov prijíma stále, začať sa dá bez skúseností.</p>
      <div class="cta-row"><a class="btn" href="tel:{PANDA['tel']}">Zavolať trénerovi</a><a class="btn btn-ghost" href="#rozvrh-mma">Kedy sa trénuje</a></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="h-disc">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Čo sa trénuje</p>
        <h2 class="h2" id="h-disc">Postoj aj zem</h2>
        <p class="sec-p">Tréningy vedie Michal Šášik. Skúsenosti nie sú potrebné, začína sa od úplných základov. Prvýkrát stačí športové oblečenie a voda.</p>
      </div>
      <ol class="reasons">{disc}</ol>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-sala">
    <div class="wrap">
      <div class="sec-head rv">
        <p class="kicker">Sála</p>
        <h2 class="h2" id="h-sala">Tatami, vrecia a hrazdy</h2>
        <p class="sec-p">Samostatná sála s veľkou plochou tatami. Podľa webu klubu sa na tréning vchádza zo zadnej strany budovy OC Lipa. {todo('potvrdenie vchodu do sály zo zadnej strany budovy a súhlas klubu s použitím mena, loga a fotiek')}</p>
      </div>
      <div class="panda-pics rv">
        <figure>{pic_panda(1, '(max-width: 760px) 100vw, 50vw', PANDA_ALT[0])}</figure>
        <figure>{pic_panda(2, '(max-width: 760px) 100vw, 50vw', PANDA_ALT[1])}</figure>
      </div>
      <p class="sec-p src">Fotky sály: gymklub.sk.</p>
    </div>
  </section>

  <section class="sec" id="rozvrh-mma" aria-labelledby="h-mma-rozvrh">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Rozvrh</p>
        <h2 class="h2" id="h-mma-rozvrh">Kedy sa trénuje</h2>
        <p class="sec-p">Pred prvým tréningom dajte trénerovi vedieť telefonicky alebo správou na Instagrame. {todo('cena tréningov a členstva v klube')}</p>
      </div>
      <div class="rv">
        <table class="table">
          <caption class="sr-only">Tréningy Panda Fight Club</caption>
          <tbody>{bj_rows}</tbody>
        </table>
        <p class="sec-p">{todo(PANDA_SCHEDULE_NOTE)}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-trener">
    <div class="wrap two">
      <div class="rv">
        <p class="kicker">Tréner a kontakt</p>
        <h2 class="h2" id="h-trener">{PANDA['coach']}</h2>
        <p class="sec-p">Hlavný tréner Panda Fight Club. Termín prvého tréningu, cenu aj otázky k začiatkom dohodnete priamo s ním.</p>
        <p class="award">Panda Fight Club Nitra je laureát a držiteľ zlatej medaily v súťaži <a href="{PANDA['award']}" target="_blank" rel="noopener">Orly fyzickej aktivity 2024</a>.</p>
      </div>
      <ul class="c-list rv">
        <li><span class="c-l">Telefón</span><a class="c-v" href="tel:{PANDA['tel']}">{PANDA['phone']}</a></li>
        <li><span class="c-l">E-mail</span><a class="c-v" href="mailto:{PANDA['email']}">{PANDA['email']}</a></li>
        <li><span class="c-l">Sociálne siete</span><span class="c-v c-soc"><a href="{PANDA['instagram']}" target="_blank" rel="noopener">Instagram</a> · <a href="{PANDA['facebook']}" target="_blank" rel="noopener">Facebook</a></span></li>
        <li><span class="c-l">Web klubu</span><a class="c-v c-map" href="{PANDA['web']}" target="_blank" rel="noopener">pandafightclub.webnode.sk</a></li>
      </ul>
    </div>
  </section>
  {cta_band('Príďte na prvý tréning', 'Stačí športové oblečenie a voda. Ak chcete trénovať aj vo fitku, pozrite si vstupy a permanentky GYM KLUB.')}'''
page('mma.html', 'MMA a Panda Fight Club | GYM KLUB Nitra',
     'Panda Fight Club Nitra v GYM KLUB na Výstavnej 6: MMA, Luta Livre a Jiu Jitsu s trénerom Michalom Šášikom. Rozvrh, sála s tatami a kontakt.',
     mma)

# ---------------------------------------------------------------------------------------------
# KONTAKT
hours_rows = ''.join(f'<tr><th scope="row">{d}</th><td class="num">{h}</td></tr>' for d, h in HOURS)
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
contact = phero('vstup-1', 'Kontakt', 'Výstavná 6, Lipa Centrum, Nitra',
                'Vchod je z krytej terasy Lipa Centra, dvere pod nápisom GYM KLUB &amp; caffee. Zavolajte, napíšte alebo príďte rovno počas otváracích hodín.') + f'''

  <section class="sec" aria-labelledby="h-kde">
    <div class="wrap contact-grid">
      <div class="rv">
        <h2 class="h2 h2-s" id="h-kde">Adresa, telefón a e-mail</h2>
        <address class="c-addr">{e(GYM['full'])}<br>{GYM['street']} ({GYM['place']})<br>{GYM['zip']} {GYM['city']} – {GYM['district']}</address>
        <ul class="c-list">
          <li><span class="c-l">Telefón</span><a class="c-v" href="tel:{GYM['tel']}">{GYM['phone']}</a></li>
          <li><span class="c-l">E-mail</span><a class="c-v" href="mailto:{GYM['email']}">{GYM['email']}</a></li>
          <li><span class="c-l">Sociálne siete</span><span class="c-v c-soc"><a href="{GYM['instagram']}" target="_blank" rel="noopener">Instagram</a> · <a href="{GYM['facebook']}" target="_blank" rel="noopener">Facebook</a></span></li>
        </ul>
      </div>
      <div class="rv" id="hodiny">
        <h2 class="h2 h2-s">Otváracie hodiny</h2>
        <table class="table">
          <caption class="sr-only">Otváracie hodiny fitness centra</caption>
          <tbody>{hours_rows}</tbody>
        </table>
        <p class="sec-p">Počas sviatkov overte hodiny telefonicky. {todo(HOURS_NOTE)} {todo('otváracie hodiny počas sviatkov')}</p>
      </div>
    </div>
  </section>

  <section class="sec sec-dark" aria-labelledby="h-mapa">
    <div class="wrap">
      <h2 class="h2 h2-s rv" id="h-mapa">Ako sa k nám dostanete</h2>
      <p class="sec-p rv">GYM KLUB je v budove Lipa Centrum na Chrenovej. {todo('parkovanie a zastávka MHD v blízkosti')}</p>
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
        <h2 class="h2" id="h-form">Dajte vedieť, kedy prídete</h2>
        <p class="sec-p">Vyplňte meno, kontakt a čo vás zaujíma. Po odoslaní sa otvorí váš e-mail s pripravenou správou pre GYM KLUB, stačí ju odoslať. Radšej voláte? <a href="tel:{GYM['tel']}">{GYM['phone']}</a></p>
        <p class="sec-p">{todo('ak majú správy chodiť priamo bez e-mailového programu návštevníka, napojenie formulára na službu (napr. Formspree) a súhlas so spracovaním osobných údajov')}</p>
      </div>
      <form class="form rv" id="form" action="mailto:{GYM['email']}" method="post" enctype="text/plain" novalidate>
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
        <button class="btn" type="submit">Pripraviť správu</button>
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
