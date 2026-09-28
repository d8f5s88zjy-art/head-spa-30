#!/usr/bin/env python3
"""Generátor webu Stavebniny Richtárik.

Zo záložného obsahu pôvodnej stránky (zdroj/pages.json, 83 podstránok stiahnutých
z www.stavebninyrichtarik.sk) postaví viacstránkový statický web: úvod, akcie,
katalóg so 14 kategóriami a podstránkami značiek, novinky, galériu, služby, o nás
a kontakt. Spustenie: python3 build.py (potrebuje lxml).
"""
import json, os, re, html, shutil
from lxml import html as LH, etree
import obsah

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = ROOT
SRC = json.load(open(os.path.join(ROOT, 'zdroj/pages.json'), encoding='utf-8'))
IMG_SIZES = json.load(open(os.path.join(ROOT, 'zdroj/obrazky.json')))
PDF_LOCAL = set(os.listdir(os.path.join(ROOT, 'pdf')))
OLD = 'http://www.stavebninyrichtarik.sk'

FIRMA = {
    'nazov': 'Stavebniny Richtárik', 'majitel': 'Ing. Mário Richtárik - Stavebniny',
    'ulica': 'Novozámocká 62/68', 'mesto': '949 05 Nitra, Horné Krškany',
    'mobil': '0905 622 223', 'mobil_tel': '+421905622223',
    'pevna': '037 651 17 77', 'pevna_tel': '+421376511777',
    'email': 'info@stavebninyrichtarik.sk', 'ico': '45959846', 'dic': 'SK1083167855',
    'mapa': 'https://www.google.com/maps/search/?api=1&query=Novoz%C3%A1mock%C3%A1+62%2F68%2C+949+05+Nitra',
}

# Kategórie katalógu: slug pôvodného webu -> pekný názov, popis, značky, fotka na karte
KATEGORIE = [
    ('sypke-zmesy', 'Sypké zmesi', 'Cement, vápno, malty, omietky, lepidlá, stierky a samonivelačné hmoty.', 'Baumit, Cemmac, Calmit, Holcim, Murexin, Univerbau', 'cement'),
    ('murovaci-material', 'Murovací materiál', 'Tehly, pórobetónové a betónové tvárnice, preklady a stropné systémy.', 'Pezinské tehelne, Ytong, Porfix, Betonárka Nadlice', 'tehla'),
    ('stresne-kritiny', 'Strešné krytiny', 'Pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo.', 'Tondach, Bramac, Mediterran, Onduline, Icopal, Blachotrapez', 'strecha'),
    ('dlazby', 'Dlažby a ploty', 'Zámkové dlažby, terasové platne, obrubníky, palisády a plotové systémy.', 'City Stone Design, Premac, Stadreko', 'dlazba'),
    ('izolacny-material', 'Izolačný materiál', 'Minerálna vlna, polystyrén, asfaltové pásy, izolácie proti vode a radónu.', 'Knauf Insulation, Isover, Nobasil, Icopal, Den Braven, Climowool', 'izolacia'),
    ('kominove-systemy', 'Komínové systémy', 'Certifikované komíny so šamotovou alebo nerezovou vložkou.', 'Stadreko, Schiedel', 'komin'),
    ('stresne-okna', 'Strešné okná', 'Kyvné a výklopné strešné okná, výlezy, svetlíky, schody a doplnky.', 'Velux, Fakro, Rooflite', 'okna'),
    ('hutny-material', 'Hutný materiál', 'Betonárska oceľ, siete, plechy, profily, rúry, zárubne a garážové brány.', 'Yssel Steel', 'hutny'),
    ('dvere---okna', 'Dvere a okná', 'Interiérové, vchodové a bezpečnostné dvere, drevené okná.', 'Masonite', 'dvere'),
    ('stavebne-rezivo', 'Stavebné rezivo', 'Dosky, hranoly, foršne, strešné laty, tatranský profil, krovy na mieru.', 'Drepex', 'rezivo'),
    ('stavebne-naradie-doplnky', 'Náradie a doplnky', 'Stavebné, elektrické a záhradné náradie, spojovací materiál, mriežky a poklopy.', 'Slovakia Trend, DS Haco', 'naradie'),
    ('podhlady---pvc', 'Podhľady a PVC', 'Plastové zatrávňovacie dlažby, plotovky, profily, platne a káblové žľaby.', 'Transform Recykling', 'zahrada'),
    ('sadrokartonovy---zateplovaci-system', 'Sadrokartón a zateplenie', 'Suchá výstavba, profily, polystyrén, sklotex, fólie a strešné doplnky.', 'Stavebné profily, Masterplast', 'sadrokarton'),
    ('fasadny-system', 'Fasádny systém', 'Silikónové, silikátové a mozaikové omietky, fasádne farby, zatepľovacie systémy.', 'Baumit, Univerbau', 'fasada'),
    ('farby---laky', 'Farby a laky', 'Interiérové a fasádne farby, laky, lepidlá, riedidlá, tónovacie systémy.', 'Het, Chemolak, Chemos, Elastik', 'farby'),
]
KAT = {k[0]: k for k in KATEGORIE}

AKCIE_KARTY = [  # z pôvodnej stránky Akcie
    ('okna--schody-fakro', 'Zľava 20 %', 'Okná a schody Fakro', 'Strešné okná, podkrovné sklápacie schody a strešné doplnky. Rôzne druhy, rôzne rozmery.'),
    ('dlazby--ploty-stadreko', '15 až 30 %', 'Dlažba City Stone Design', 'Zľava z cenníkových cien betónovej zámkovej dlažby a doplnkov, objektové zľavy pre firmy.'),
    ('pezinska-tehla-termobrik', 'Super ceny', 'Pezinská tehla Termobrik', 'Brúsená tehla a Dry systém Termobrik s pojivom, lepidlo zdarma. Individuálna ponuka na tvoj dom.'),
    ('komin-qatro', 'Na sklade', 'Komín Stadreko', 'Najlacnejší certifikovaný komínový systém na Slovensku, odber možný ihneď.'),
    ('krytina-blachotrapez', 'Doprava 17 €', 'Krytina Blachotrapez', 'Škridloplech a trapézové plechy. Doprava nad 50 m² za 17 € s DPH po celom Slovensku.'),
    ('sadrokartonovy---zateplovaci-system', 'Zdarma domov', 'Zateplenie a sadrokartón', 'Kompletný sortiment. Polystyrén dovezieme priamo domov zdarma.'),
    ('porfix', 'Špeciálne zľavy', 'Porfix', 'Obvodové murivo, priečky, strop, lepidlá a malty so špeciálnymi zľavami.'),
    ('stavebne-rezivo', 'Super ceny', 'Stavebné rezivo', 'Dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo, krovy na mieru.'),
    ('stavebne-naradie', 'Na sklade', 'Stavebné náradie', 'Náradie na stavbu, do záhrady, do domácnosti aj do dielne.'),
    ('ytong', 'Akcia', 'Ytong', 'Presné tvárnice, preklady a stropné dielce v akcii.'),
    ('cement-325-r', 'Akcia', 'Cement 32,5 R', 'Portlandský cement v akciovej cene.'),
    ('betonove-tvarnice', 'Akcia', 'Betónové tvárnice', 'Debniace a murovacie tvárnice v akcii.'),
    ('nobasil', 'Akcia', 'Climowool', 'Minerálna izolácia Climowool v akcii.'),
    ('sakret', 'Akcia', 'Lepidlá a omietky Univerbau', 'Lepidlá, malty a omietky Univerbau v akcii.'),
    ('stresne-okna-rooflite', 'Akcia', 'Strešné okná Rooflite', 'Strešné okná Rooflite v akciovej cene.'),
]

NOVINKY_POPIS = {
    'dekoracne-kamene': 'Mramorový okruhliak, Nero Ebano a kamenná kôra v 25 kg vreciach, ceny s DPH.',
    'topstone-oprava-starych-chodnikov': 'Kamenný koberec na opravu starých chodníkov, schodov a terás bez búrania.',
    'delap--ohybny-kamenny-obklad': 'Ohybný obklad z prírodného kameňa, akciová cena 17,80 € za m² s DPH.',
    'magic-floor-vynilova-podlaha': 'Vinylové podlahy Magic Floor do domácnosti aj do prevádzok.',
    'vyrobky-z-plastu': 'Zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu.',
    'garaze--zahradne-domceky': 'Montované plechové garáže na mieru, doprava a montáž v rámci Slovenska zdarma.',
    'ekostyren': 'Ekostyrén, ľahký tepelnoizolačný betón do podláh a striech.',
    'betonove--vyrobky': 'Šalovacie diely, tvárnice a betónové prvky v super cenách.',
}


def nice_slug(s):
    return re.sub(r'-{2,}', '-', s)


def nice_title(t):
    t = re.sub(r'\s+', ' ', html.unescape(t)).strip()
    if t.isupper():
        t = t.capitalize()
        t = t.replace(' + ', ' a ').replace('Sádrokartónový', 'Sadrokartónový')
    t = t.replace('DELAP- OHYBNÝ KAMENNÝ OBKLAD', 'Delap, ohybný kamenný obklad')
    return t


def path_for(slug):
    """Cesta novej stránky pre slug pôvodného webu; None = stránka sa nevytvára."""
    parts = slug.split('__')
    if slug == 'uvod': return 'index.html'
    if parts[0] == 'katalog-roduktov':
        if len(parts) == 1: return 'katalog/index.html'
        return 'katalog/' + '/'.join(nice_slug(p) for p in parts[1:]) + '.html'
    if parts[0] == 'akcie':
        return 'akcie/index.html' if len(parts) == 1 else 'akcie/' + nice_slug(parts[1]) + '.html'
    if parts[0] == 'novinky':
        return 'novinky/index.html' if len(parts) == 1 else 'novinky/' + nice_slug(parts[1]) + '.html'
    if parts[0] == 'fotogaleria':
        return 'galeria/index.html' if len(parts) == 1 else 'galeria/' + nice_slug(parts[1]) + '.html'
    if slug == 'o-nas': return 'o-nas.html'
    if slug == 'sluzby': return 'sluzby.html'
    if slug == 'kontakt': return 'kontakt.html'
    if slug == 'akciovy-letak': return 'letak.html'
    return None


SKIP = {'error-page', 'kontakt__kontaktny-formular', 'kontakt__googlemap', 'mapa', 'sluzby__poradenstvo', 'katalog-roduktov__stresne-okna__velux', 'novinky'}
PAGES = {s: path_for(s) for s in SRC if s not in SKIP and path_for(s)}
URL2PATH = {SRC[s]['url']: p for s, p in PAGES.items()}
URL2PATH[OLD + '/sk.aspx'] = 'index.html'
URL2PATH[OLD + '/'] = 'index.html'


def rel(from_path, to_path):
    depth = from_path.count('/')
    return '../' * depth + to_path


def prefix(from_path):
    return '../' * from_path.count('/')


def children(slug):
    return sorted([s for s in PAGES if s.startswith(slug + '__') and s.count('__') == slug.count('__') + 1])


def text_of(h):
    t = re.sub(r'<[^>]+>', ' ', h)
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def _sub(parent, tag):
    e = LH.Element(tag); parent.append(e); return e


def _drop(el):
    p = el.getparent()
    if p is not None:
        if el.tail:
            prev = el.getprevious()
            if prev is not None: prev.tail = (prev.tail or '') + el.tail
            else: p.text = (p.text or '') + el.tail
        p.remove(el)


# ---------- čistenie obsahu pôvodného webu ----------
def clean(raw, page_path):
    pre = prefix(page_path)
    try:
        root = LH.fragment_fromstring(raw, create_parent='div')
    except Exception:
        return ''
    # preč: skripty, iframy, navigácia galérie, prázdne a servisné prvky
    for el in root.xpath('.//script|.//iframe|.//hr|.//*[@class="clear"]|.//*[@id="content_gallery_navigation"]|.//a[@class="nodisplay"]|.//*[@id="panContent"]'):
        el.drop_tree()
    for el in root.xpath('.//h5'):
        if text_of(etree.tostring(el, encoding='unicode')).strip().lower() == 'galéria': el.drop_tree()
    # galéria fotiek: tabuľka content_gallery -> mriežka
    for tb in root.xpath('.//table[contains(@class,"content_gallery")]'):
        g = LH.Element('div'); g.set('class', 'galeria')
        for a in tb.xpath('.//a[@href]'):
            href = a.get('href'); m = re.search(r'images/gallery/(\d+)\.jpg', href)
            if not m: continue
            i = m.group(1)
            if not os.path.exists(os.path.join(ROOT, 'img/g', i + '.webp')): continue
            na = _sub(g, 'a'); na.set('href', pre + f'img/g/{i}.webp'); na.set('data-lb', '1')
            im = _sub(na, 'img'); im.set('src', pre + f'img/gt/{i}.webp'); im.set('alt', a.get('title') or 'Fotografia'); im.set('loading', 'lazy')
        tb.getparent().replace(tb, g)
    # obrázky
    for im in root.xpath('.//img'):
        src = im.get('src') or ''
        if src.startswith(pre + 'img/'): continue  # náhľady galérie vytvorené vyššie
        m = re.search(r'img=(\d+)', src)
        gm = re.search(r'images/gallery/_?(\d+)\.jpg', src)
        i = m.group(1) if m else (gm.group(1) if gm else None)
        for a in ('style', 'width', 'height', 'align', 'hspace', 'vspace', 'border', 'title'):
            if a in im.attrib: del im.attrib[a]
        if i and i in IMG_SIZES:
            w, h = IMG_SIZES[i]
            im.set('src', pre + f'img/p/{i}.webp'); im.set('width', str(w)); im.set('height', str(h)); im.set('loading', 'lazy')
            if not im.get('alt'): im.set('alt', '')
            if w >= 300:
                im.set('class', 'big')
                par = im.getparent()
                if par.tag != 'a':  # veľký obrázok sa dá otvoriť v plnej veľkosti
                    a = LH.Element('a'); a.set('href', pre + f'img/p/{i}.webp'); a.set('data-lb', '1')
                    par.replace(im, a); a.append(im)
            elif h <= 60 and w <= 200:
                im.set('class', 'logo')
        elif i and os.path.exists(os.path.join(ROOT, 'img/g', i + '.webp')):
            im.set('src', pre + f'img/g/{i}.webp'); im.set('class', 'big'); im.set('loading', 'lazy')
        else:
            _drop(im)
    # odkazy
    for a in root.xpath('.//a'):
        href = (a.get('href') or '').strip()
        if not href or href.startswith('javascript'):
            a.drop_tag(); continue
        if href.endswith('.pdf'):
            b = os.path.basename(href)
            a.set('href', pre + 'pdf/' + b if b in PDF_LOCAL else (href if href.startswith('http') else OLD + '/' + href.lstrip('/')))
            a.set('class', 'pdf'); a.set('target', '_blank'); a.set('rel', 'noopener')
            if not text_of(etree.tostring(a, encoding='unicode')): a.text = 'Stiahnuť PDF'
            continue
        if re.search(r'images/gallery/(\d+)\.jpg', href):
            i = re.search(r'images/gallery/(\d+)\.jpg', href).group(1)
            loc = f'img/p/{i}.webp' if i in IMG_SIZES else f'img/g/{i}.webp'
            a.set('href', pre + loc); a.set('data-lb', '1'); continue
        if href in URL2PATH:
            a.set('href', rel(page_path, URL2PATH[href])); continue
        if href.startswith(OLD):
            a.set('href', rel(page_path, 'index.html')); continue
        if href.startswith('http'):
            a.set('target', '_blank'); a.set('rel', 'noopener')
        for at in ('title', 'style'):
            if at in a.attrib: del a.attrib[at]
    # tabuľky značiek (logo + text) -> zoznam značiek; ostatné tabuľky ostávajú
    for tb in root.xpath('.//table'):
        rows = tb.xpath('./tbody/tr|./tr')
        two = rows and all(len(r.xpath('./td')) == 2 for r in rows)
        brandy = two and all(text_of(etree.tostring(r.xpath('./td')[1], encoding='unicode')) for r in rows) and all(not r.xpath('./td[1]//img[@class="big"]') for r in rows)
        if brandy:
            box = LH.Element('div'); box.set('class', 'znacky')
            for r in rows:
                c1, c2 = r.xpath('./td')
                it = _sub(box, 'div'); it.set('class', 'znacka')
                lg = _sub(it, 'div'); lg.set('class', 'lg')
                for im in c1.xpath('.//img'):
                    ln = c1.xpath('.//a[@href]')
                    if ln:
                        a = _sub(lg, 'a'); a.set('href', ln[0].get('href')); a.set('target', '_blank'); a.set('rel', 'noopener'); a.append(im)
                    else: lg.append(im)
                tx = _sub(it, 'div'); tx.set('class', 'tx')
                for ch in list(c2): tx.append(ch)
                tx.text = (c2.text or '') + (tx.text or '')
            tb.getparent().replace(tb, box)
        else:
            for at in list(tb.attrib): del tb.attrib[at]
            tb.set('class', 'tbl')
            wrap = LH.Element('div'); wrap.set('class', 'scroll')
            tb.getparent().replace(tb, wrap); wrap.append(tb)
    # atribúty a obalové značky
    for el in root.iter():
        if not isinstance(el.tag, str): continue
        for at in ('style', 'align', 'border', 'cellpadding', 'cellspacing', 'id', 'lang', 'dir', 'valign', 'bgcolor', 'nowrap'):
            if at in el.attrib: del el.attrib[at]
        if el.tag in ('span', 'font', 'u', 'center') or (el.tag == 'div' and el.get('class') not in ('znacky', 'znacka', 'lg', 'tx', 'galeria', 'scroll') and el is not root):
            el.drop_tag()
    for el in root.xpath('.//td|.//th|.//li|.//p'):
        if 'class' in el.attrib and el.get('class') not in ('big',): del el.attrib['class']
    out = etree.tostring(root, encoding='unicode', method='html')
    out = re.sub(r'^<div>|</div>$', '', out.strip())
    out = re.sub(r'<p>(\s|&#160;|&nbsp;|<br>|<br/>|<br />)*</p>', '', out)
    out = re.sub(r'(<br>\s*){3,}', '<br><br>', out)
    out = out.replace('&#160;', ' ')
    out = re.sub(r'<p>\s*/f(?=<img)', '<p>', out)  # preklep z pôvodného webu
    return out


def parser(path):
    return obsah.Parser(IMG_SIZES, PDF_LOCAL, URL2PATH, path, rel)


def content(slug, path):
    """Obsah pôvodnej stránky prerobený do moderných blokov."""
    p = parser(path)
    return p.render(p.blocks(SRC[slug]['html']))


def snippet(slug, n=110):
    p = parser('x.html')
    t = p.plain(p.blocks(SRC[slug]['html']))
    return (t[:n].rsplit(' ', 1)[0] + '…') if len(t) > n else t


# ---------- šablóna ----------
NAV = [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), ('katalog/index.html', 'Katalóg'), ('novinky/index.html', 'Novinky'), ('sluzby.html', 'Služby'), ('galeria/index.html', 'Galéria'), ('o-nas.html', 'O nás'), ('kontakt.html', 'Kontakt')]


def page(path, title, body, desc=None, crumbs=None, wide=False, extra_head='', head=None, home=False):
    pre = prefix(path)
    def _nav_a(p, t):
        cur = ' aria-current="page"' if (path == p or (p != "index.html" and path.startswith(p.split("/")[0] + "/"))) else ''
        return f'<a href="{rel(path, p)}"{cur}>{t}</a>'
    nav = ''.join(_nav_a(p, t) for p, t in NAV)
    dnav = ''.join(f'<a href="{rel(path, p)}">{t}</a>' for p, t in NAV)
    crumb = ''
    if crumbs:
        items = ''.join(f'<li><a href="{rel(path, p)}">{t}</a></li>' if p else f'<li aria-current="page">{t}</li>' for p, t in crumbs)
        crumb = f'<nav class="crumbs" aria-label="Kde si"><ol>{items}</ol></nav>'
    band = ''
    if head:
        kicker, h1, lede = head
        band = f'<section class="page-head grainy"><div class="wrap">{crumb}<div class="head"><div class="eyebrow">{kicker}</div><h1>{h1}</h1>{f"<p class=lede>{lede}</p>" if lede else ""}</div></div></section>'
    elif crumb:
        band = f'<section class="page-head"><div class="wrap">{crumb}</div></section>'
    crumb = band
    d = html.escape(desc or 'Stavebniny Richtárik, Nitra Horné Krškany. Stavebný materiál v celom sortimente od roku 1997, doprava po celom Slovensku.')
    return f'''<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title) if title == 'Stavebniny Richtárik Nitra' else html.escape(title) + ' | Stavebniny Richtárik Nitra'}</title>
<meta name="description" content="{d}">
<meta name="theme-color" content="#1c1a17">
<meta property="og:title" content="{html.escape(title)} | Stavebniny Richtárik">
<meta property="og:description" content="{d}">
<meta property="og:image" content="{pre}img/hero.jpg">
<link rel="icon" href="{pre}img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{pre}assets/site.css">
{extra_head}
</head>
<body{' class="home"' if home else ''}>
<a class="skip" href="#obsah">Preskočiť na obsah</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="{pre}index.html" aria-label="Stavebniny Richtárik, úvod"><img src="{pre}img/logo-white.png" alt="Stavebniny Richtárik" width="480" height="142"></a>
    <nav class="nav" aria-label="Hlavné menu">{nav}</nav>
    <a class="tel" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a>
    <button class="menu-btn" type="button" aria-label="Otvoriť menu" aria-expanded="false" aria-controls="drawer"><span></span></button>
  </div>
</header>
<div class="drawer" id="drawer" aria-label="Menu">
  <button class="close" type="button" aria-label="Zavrieť menu">&times;</button>
  <nav aria-label="Menu">{dnav}</nav>
  <div class="dtel"><a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a></div>
</div>
{crumb}
<main id="obsah">
{body}
</main>
<section class="cta-pas">
  <div class="wrap">
    <div><div class="eyebrow light">Cenová ponuka zadarmo</div><h2>Pošli nám zoznam materiálu alebo projekt</h2><p>Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu na stavbu. Zvyčajne do niekoľkých dní.</p></div>
    <div class="cta"><a class="btn primary" href="mailto:{FIRMA['email']}?subject=Cenov%C3%A1%20ponuka">Poslať dopyt e-mailom</a><a class="btn light" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
  </div>
</section>
<footer>
  <div class="wrap grid">
    <div><img src="{pre}img/logo-white.png" alt="Stavebniny Richtárik" width="200" height="59" class="flogo"><p>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</p><p>IČO {FIRMA['ico']} · DIČ {FIRMA['dic']}</p></div>
    <div><h3>Stránky</h3>{dnav}</div>
    <div><h3>Katalóg</h3>{''.join(f'<a href="{rel(path, "katalog/" + nice_slug(k[0]) + ".html")}">{k[1]}</a>' for k in KATEGORIE[:8])}<a href="{rel(path, 'katalog/index.html')}">Celý katalóg</a></div>
    <div><h3>Kontakt</h3><a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a href="mailto:{FIRMA['email']}">{FIRMA['email']}</a><p>Po až Pia 7:00 až 16:00<br>So 7:00 až 12:00</p></div>
  </div>
  <div class="wrap bottom"><span>© <span id="rok">2026</span> {FIRMA['majitel']}, Nitra</span><a href="{rel(path, 'letak.html')}">Akciový leták</a></div>
</footer>
<div class="mbar" aria-label="Rýchly kontakt"><a class="btn dark" href="tel:{FIRMA['mobil_tel']}">Zavolať</a><a class="btn primary" href="{rel(path, 'kontakt.html')}">Cenová ponuka</a></div>
<div class="lb" id="lb" hidden><button class="lb-x" type="button" aria-label="Zavrieť">&times;</button><img src="" alt=""></div>
<script src="{pre}assets/site.js" defer></script>
</body>
</html>
'''


def head_block(kicker, h, lede=None, light=False):
    return f'<div class="head"><div class="eyebrow{" light" if light else ""}">{kicker}</div><h1>{h}</h1>{f"<p class=lede>{lede}</p>" if lede else ""}</div>'


CUR = ' aria-current="page"'

def sidebar(path, current_slug):
    """Bočný zoznam kategórií katalógu s podstránkami značiek."""
    items = ''
    for k in KATEGORIE:
        slug = 'katalog-roduktov__' + k[0]
        p = PAGES.get(slug)
        act = current_slug == slug or current_slug.startswith(slug + '__')
        subs = ''
        if act:
            ch = children(slug)
            if ch:
                subs = '<ul>' + ''.join('<li><a href="%s"%s>%s</a></li>' % (rel(path, PAGES[c]), CUR if (c == current_slug or current_slug.startswith(c + "__")) else '', nice_title(SRC[c]["title"])) for c in ch) + '</ul>'
        items += '<li%s><a href="%s"%s>%s</a>%s</li>' % (' class="act"' if act else '', rel(path, p), CUR if current_slug == slug else '', k[1], subs)
    return f'<aside class="side"><div class="side-in"><h2>Katalóg</h2><ul class="kat">{items}</ul><a class="btn ghost small" href="{rel(path, "katalog/index.html")}">Všetky kategórie</a></div></aside>'


def write(path, content):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(content)


# ---------- jednotlivé typy stránok ----------
def build_katalog_index():
    path = 'katalog/index.html'
    cards = ''.join(f'''<a class="cat" href="{rel(path, "katalog/" + nice_slug(k[0]) + ".html")}"><div class="ph"><img src="{rel(path, "img/" + k[4] + ".webp")}" alt="" loading="lazy" width="900" height="600"></div><div class="tx"><h3>{k[1]}</h3><p>{k[2]}</p><span class="brands">{k[3]}</span></div></a>''' for k in KATEGORIE)
    body = f'''<section class="sec"><div class="wrap">
<div class="search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Hľadaj: cement, Ytong, škridla, Fakro, polystyrén…" autocomplete="off"><div class="res" id="res" hidden></div></div>
<div class="cats">{cards}</div>
<div class="sort-note"><p>Nenašiel si, čo hľadáš? Zavolaj, väčšinu materiálu vieme objednať do niekoľkých dní a doviezť priamo na stavbu.</p><a class="btn dark" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
</div></section>'''
    write(path, page(path, 'Katalóg produktov', body, 'Katalóg stavebného materiálu Stavebniny Richtárik Nitra: sypké zmesi, murivo, krytiny, dlažby, izolácie, komíny, okná, hutný materiál, rezivo, náradie, sadrokartón, fasády, farby.', [('index.html', 'Úvod'), (None, 'Katalóg')], head=('Katalóg', 'Všetko na stavbu od základov po strechu', 'Produkty popredných slovenských aj svetových výrobcov. Vyber kategóriu alebo hľadaj podľa názvu výrobku či značky.')))


def build_katalog_page(slug):
    path = PAGES[slug]
    parts = slug.split('__')[1:]
    cat = KAT[parts[0]]
    title = cat[1] if len(parts) == 1 else nice_title(SRC[slug]['title'])
    crumbs = [('index.html', 'Úvod'), ('katalog/index.html', 'Katalóg')]
    acc = 'katalog-roduktov'
    for i, p in enumerate(parts):
        acc += '__' + p
        crumbs.append((PAGES[acc], nice_title(SRC[acc]['title']) if i else KAT[p][1]) if acc != slug else (None, title))
    cont = content(slug, path)
    ch = children(slug)
    subs = ''
    if ch:
        subs = '<div class="subs"><h2>Podrobnejšie</h2><div class="sub-grid">' + ''.join(f'<a class="sub rv" href="{rel(path, PAGES[c])}"><b>{nice_title(SRC[c]["title"])}</b><span>{snippet(c)}</span></a>' for c in ch) + '</div></div>'
    lede = cat[2] if len(parts) == 1 else None
    if len(parts) == 1 and cont.strip():
        cont = '<h2 class="sh rv"><span>Značky, ktoré máme v ponuke</span></h2>' + cont
    body = f'''<section class="sec kat-page"><div class="wrap two">
{sidebar(path, slug)}
<div class="main">
<div class="content">{cont}</div>
{subs}
<div class="kat-cta"><p>Chceš cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject={html.escape(title)}">Napísať e-mail</a></div></div>
</div></div></section>'''
    write(path, page(path, title, body, f'{title}. Stavebniny Richtárik Nitra, {cat[3]}.', crumbs, head=('Katalóg' if len(parts) == 1 else cat[1], title, lede)))


def build_akcie():
    path = 'akcie/index.html'
    cards = ''
    for slug, tag, h, p in AKCIE_KARTY:
        s = 'akcie__' + slug
        href = rel(path, PAGES[s]) if s in PAGES else None
        cards += f'<a class="deal" href="{href}"><span class="tag">{tag}</span><h3>{h}</h3><p>{p}</p><span class="more">Leták akcie</span></a>' if href else f'<div class="deal"><span class="tag">{tag}</span><h3>{h}</h3><p>{p}</p></div>'
    body = f'''<section class="sec akcie-page"><div class="wrap">
<div class="cta" style="margin-bottom:28px"><a class="btn primary" href="{rel(path, 'pdf/657.pdf')}" target="_blank" rel="noopener">Cenník aktuálnych akcií (PDF)</a><a class="btn ghost" href="{rel(path, 'letak.html')}">Akciový leták</a></div>
<div class="deals">{cards}</div>
</div></section>'''
    write(path, page(path, 'Akcie', body, 'Aktuálne akcie Stavebniny Richtárik Nitra: Fakro, City Stone Design, Termobrik, Stadreko, Blachotrapez, Porfix, Ytong, rezivo, náradie.', [('index.html', 'Úvod'), (None, 'Akcie')], head=('Akcie', 'Aktuálne akcie na vybrané výrobky', 'Ceny v akcii platia do vypredania zásob. Z akciových cien dostaneš ďalšiu zľavu 5 % pri platbe v hotovosti a 3,3 % pri platbe kartou.')))
    karty = {s: (tag, h, p) for s, tag, h, p in AKCIE_KARTY}
    for s in children('akcie'):
        p = PAGES[s]; t = nice_title(SRC[s]['title'])
        k = s.split('__')[1]
        tag, h, popis = karty.get(k, ('Akcia', t, ''))
        pr = parser(p); bl = pr.blocks(SRC[s]['html'])
        imgs = [x for kind, v in bl if kind == 'images' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['imgs']]
        pdfs = [x for kind, v in bl if kind == 'pdfs' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['pdfs']]
        letak = ''
        if imgs:
            i, alt = imgs[0]
            letak = f'<figure class="letak rv"><a href="{pr._src(i)}" data-lb="1" data-cap="{html.escape(h)}"><img src="{pr._src(i)}" alt="Leták akcie {html.escape(h)}" width="{IMG_SIZES.get(i, (0, 0))[0]}" height="{IMG_SIZES.get(i, (0, 0))[1]}"></a><figcaption>Leták akcie, klikni pre zväčšenie</figcaption></figure>'
        others = ''.join(f'<a href="{rel(p, PAGES["akcie__" + s2])}"><span class="tag">{tag2}</span><b>{h2}</b></a>' for s2, tag2, h2, _ in AKCIE_KARTY if s2 != k and 'akcie__' + s2 in PAGES)
        body = f'''<section class="sec akcia"><div class="wrap two">
<div class="main">
<div class="akcia-tag"><span class="tag">{tag}</span><span>Ceny platia do vypredania zásob. K akciovej cene dostaneš ešte 5 % pri platbe v hotovosti alebo 3,3 % kartou.</span></div>
{letak}
<div class="pdfs rv">{''.join(pr._pdf(hh, tt) for hh, tt in pdfs)}<a class="pdf" href="{rel(p, 'pdf/657.pdf')}" target="_blank" rel="noopener"><span>Cenník všetkých akcií</span></a></div>
<div class="kat-cta rv"><p>Chceš akciovú cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject=Akcia%20{html.escape(h)}">Napísať e-mail</a></div></div>
</div>
<aside class="side"><div class="side-in"><h2>Ďalšie akcie</h2><div class="others">{others}</div><a class="btn ghost small" href="{rel(p, 'akcie/index.html')}">Všetky akcie</a></div></aside>
</div></section>'''
        write(p, page(p, h + ' v akcii', body, f'Akcia {h}: {popis} Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), (None, h)], head=('Akcia', h, popis)))


def build_novinky():
    path = 'novinky/index.html'
    items = ''
    for s in children('novinky'):
        k = s.split('__')[1]; t = nice_title(SRC[s]['title'])
        first = [i for i, e in SRC[s]['imgs'] if i in IMG_SIZES and IMG_SIZES[i][0] >= 200]
        img = f'<div class="ph"><img src="{rel(path, "img/p/" + first[0] + ".webp")}" alt="" loading="lazy"></div>' if first else '<div class="ph empty"></div>'
        items += f'<a class="nov" href="{rel(path, PAGES[s])}">{img}<div class="tx"><h3>{t}</h3><p>{NOVINKY_POPIS.get(k, "")}</p></div></a>'
    body = f'''<section class="sec"><div class="wrap">
<div class="novs grid-page">{items}</div>
</div></section>'''
    write(path, page(path, 'Novinky', body, 'Novinky v ponuke Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), (None, 'Novinky')], head=('Novinky', 'Čo sme pridali do ponuky', 'Nové materiály, dekoračné kamene, montované garáže a výrobky z recyklovaného plastu. Vzorky si pozrieš priamo v predajni.')))
    for s in children('novinky'):
        p = PAGES[s]; t = nice_title(SRC[s]['title']); k = s.split('__')[1]
        body = f'''<section class="sec"><div class="wrap">
<div class="content">{content(s, p)}</div>
<p class="back"><a href="{rel(p, 'novinky/index.html')}">Všetky novinky</a></p>
</div></section>'''
        write(p, page(p, t, body, f'{t}. Novinka v ponuke Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), ('novinky/index.html', 'Novinky'), (None, t)], head=('Novinka', t, NOVINKY_POPIS.get(k, None))))


def build_galeria():
    path = 'galeria/index.html'
    albums = children('fotogaleria')
    secs = ''
    for s in albums:
        t = nice_title(SRC[s]['title']).replace('výstava', 'Výstava').replace('Fotky - ', '')
        g = content(s, path)
        n = len(SRC[s]['gallery']) if SRC[s].get('gallery') else g.count('data-lb')
        secs += f'<div class="album"><h2 class="sh rv"><span>{t}</span><small>{n} fotografií</small></h2>{g}</div>'
    body = f'''<section class="sec"><div class="wrap">
{secs}
</div></section>'''
    write(path, page(path, 'Galéria', body, 'Fotogaléria Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), (None, 'Galéria')], head=('Galéria', 'Z výstav a z predajne', 'Fotografie z výstav Agrokomplex, Gardenia a Domexpo v Nitre, kde sme vystavovali náš sortiment.')))


def build_simple(slug, kicker, h1, lede=None, extra=''):
    p = PAGES[slug]; t = nice_title(SRC[slug]['title'])
    body = f'''<section class="sec"><div class="wrap{" narrow" if slug != "sluzby" else ""}">
<div class="content">{content(slug, p)}</div>
{extra}
</div></section>'''
    write(p, page(p, t.capitalize() if t.isupper() else t, body, None, [('index.html', 'Úvod'), (None, h1)], head=(kicker, h1, lede)))


def build_kontakt():
    p = 'kontakt.html'
    body = f'''<section class="sec kontakt-page"><div class="wrap">
<div class="kgrid">
  <div class="kbox"><h3>Predajňa a sklad</h3><address>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</address><a class="btn ghost small" href="{FIRMA['mapa']}" target="_blank" rel="noopener">Otvoriť v mapách</a></div>
  <div class="kbox"><h3>Zavolaj alebo napíš</h3><a class="big" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a class="big" href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a class="mail" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a></div>
  <div class="kbox"><h3>Otváracie hodiny</h3><table class="hours"><tr><td>Pondelok až piatok</td><td>7:00 až 16:00</td></tr><tr><td>Sobota</td><td>7:00 až 12:00</td></tr><tr class="closed"><td>Nedeľa</td><td>zatvorené</td></tr></table></div>
  <div class="kbox"><h3>Firemné údaje</h3><address>IČO {FIRMA['ico']}<br>DIČ {FIRMA['dic']}<br>Platba kartou cez terminál VÚB<br>Nákup na splátky Quatro</address></div>
</div>
<div class="kmapa"><a href="{FIRMA['mapa']}" target="_blank" rel="noopener"><img src="img/predajna.webp" alt="Sklad stavebnín" loading="lazy" width="1200" height="800"><span>Novozámocká 62/68, Nitra, Horné Krškany. Otvoriť navigáciu</span></a></div>
</div></section>'''
    write(p, page(p, 'Kontakt', body, 'Kontakt Stavebniny Richtárik: Novozámocká 62/68, Nitra Horné Krškany, 0905 622 223, 037 651 17 77, otvorené Po až Pia 7 až 16, So 7 až 12.', [('index.html', 'Úvod'), (None, 'Kontakt')], head=('Kontakt', 'Príď k nám do Horných Krškán', 'Predajňa a sklad na Novozámockej ulici v Nitre, pri hlavnej ceste smerom na Nové Zámky.')))


LOGA = ['18', '19', '23', '30', '31', '44', '45', '53', '54', '118', '126', '378', '416', '429', '137', '302', '35', '24', '57', '59', '61', '62', '64', '66', '68', '122', '125']


def build_home():
    path = 'index.html'
    deals = ''.join(f'<a class="deal" href="{rel(path, PAGES["akcie__" + s])}"><span class="tag">{tag}</span><h3>{h}</h3><p>{p}</p></a>' for s, tag, h, p in AKCIE_KARTY[:6] if 'akcie__' + s in PAGES)
    cats = ''
    for n, k in enumerate(KATEGORIE):
        cls = ' big' if n == 0 else (' wide' if n in (5, 10) else '')
        cats += f'''<a class="cat{cls}" href="katalog/{nice_slug(k[0])}.html"><div class="ph"><img src="img/{k[4]}.webp" alt="" loading="lazy" width="900" height="600"></div><span class="n">{n + 1:02d}</span><div class="tx"><h3>{k[1]}</h3><p>{k[2]}</p><span class="brands">{k[3]}</span></div></a>'''
    novs = ''
    for s in children('novinky')[:4]:
        k = s.split('__')[1]; t = nice_title(SRC[s]['title'])
        first = [i for i, e in SRC[s]['imgs'] if i in IMG_SIZES and IMG_SIZES[i][0] >= 200]
        img = f'<div class="ph"><img src="img/p/{first[0]}.webp" alt="" loading="lazy"></div>' if first else '<div class="ph empty"></div>'
        novs += f'<a class="nov" href="{PAGES[s]}">{img}<div class="tx"><h3>{t}</h3><p>{NOVINKY_POPIS.get(k, "")}</p></div></a>'
    tiles = ''.join(f'<div class="tile"><img src="img/p/{i}.webp" alt="" loading="lazy"></div>' for i in LOGA if i in IMG_SIZES)
    body = f'''
<section class="hero" aria-labelledby="h-uvod">
  <div class="bg" data-parallax><picture><source type="image/webp" srcset="img/hero.webp"><img src="img/hero.jpg" alt="Sklad stavebného materiálu" width="1600" height="1067" fetchpriority="high"></picture></div>
  <div class="wrap">
    <div class="eyebrow">Stavebniny Richtárik, Nitra. Od roku 1997</div>
    <h1 id="h-uvod">Stavebný materiál <span class="thin">v celom sortimente.</span> <em>Za super ceny.</em></h1>
    <p>Rodinné stavebniny s vlastnou dopravou po celom Slovensku. Cenovú ponuku a výpočet spotreby materiálu ti spravíme zadarmo, s výberom poradíme na mieste.</p>
    <div class="search hero-search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Čo hľadáš? Cement, Ytong, škridla, Fakro, polystyrén…" autocomplete="off"><div class="res" id="res" hidden></div></div>
    <div class="cta"><a class="btn primary" href="katalog/index.html">Prezrieť katalóg</a><a class="btn outline" href="akcie/index.html">Aktuálne akcie</a></div>
  </div>
  <div class="cue" aria-hidden="true">Skroluj</div>
</section>
<div class="facts" aria-label="V skratke">
  <div><b>1997</b><span>rodinná firma, 29 rokov v stavebninách</span></div>
  <div><b><i data-count="5">5</i> %</b><span>ďalšia zľava pri platbe v hotovosti</span></div>
  <div><b><i data-count="3,3">3,3</i> %</b><span>ďalšia zľava pri platbe kartou</span></div>
  <div><b><i data-count="{len(KATEGORIE)}">{len(KATEGORIE)}</i></b><span>kategórií materiálu a {len(children('akcie'))} aktuálnych akcií</span></div>
</div>
<div class="marquee" aria-label="Značky v ponuke"><div class="lbl">Značky, ktoré máme na sklade alebo objednáme</div><div class="track">{tiles}{tiles}</div></div>
<section class="sec"><div class="wrap">
  <div class="head row"><div><div class="eyebrow">Katalóg</div><h2>Všetko na stavbu od základov po strechu</h2></div><a class="btn dark" href="katalog/index.html">Celý katalóg</a></div>
  <div class="cats">{cats}</div>
</div></section>
<section class="sec akcie dark grainy"><div class="wrap">
  <div class="head row"><div><div class="eyebrow light">Akcie</div><h2>Aktuálne akcie na vybrané výrobky</h2></div><a class="btn outline" href="akcie/index.html">Všetky akcie</a></div>
  <div class="deals">{deals}</div>
</div></section>
<section class="sec zlavy"><div class="wrap grid">
  <div><div class="eyebrow">Rozdávame zľavy</div><h2>Z akciových cien dostaneš ešte ďalšiu zľavu</h2><p>Stačí spôsob platby. Stavebné firmy, živnostníci a predajne stavebnín majú navyše špeciálne dohodnuté ceny.</p>
  <div class="disc"><div><b><i data-count="5">5</i> %</b><span>pri platbe v hotovosti</span></div><div><b><i data-count="3,3">3,3</i> %</b><span>pri platbe platobnou kartou</span></div></div></div>
  <div class="karta rv"><img src="img/p/944.webp" alt="Zákaznícka karta Stavebniny Richtárik" loading="lazy" width="671" height="427"><div><b>Zákaznícka karta</b><p>Príď si k nám pre svoju zákaznícku kartu a získaš všetky zľavy, ktoré sme pre teba pripravili.</p></div></div>
</div></section>
<section class="sec sluzby"><div class="wrap">
  <div class="head"><div class="eyebrow">Služby</div><h2>Poradíme, spočítame, dovezieme</h2><p class="lede">Tovar dovezieme priamo k tebe bez zbytočného skladovania, takže sa pri prekladaní nepoškodí.</p></div>
  <div class="grid">
    <figure class="ph rv"><img src="img/p/885.webp" alt="Nákladné auto s hydraulickou rukou pri nakládke" loading="lazy" width="576" height="768"><figcaption>Vlastná doprava s hydraulickou rukou zloží materiál presne tam, kde ho potrebuješ.</figcaption></figure>
    <div class="srvs">
      <article class="srv"><i>01</i><div><h3>Doprava po celom Slovensku</h3><p>Avia 3,5 t a nákladné auto 8 t s hydraulickou rukou. Materiál zložíme presne tam, kde ho na stavbe potrebuješ.</p></div></article>
      <article class="srv"><i>02</i><div><h3>Cenová ponuka zadarmo</h3><p>Prines projekt alebo rozmery a vypracujeme ti cenovú ponuku na celý dom aj na jednotlivé etapy.</p></div></article>
      <article class="srv"><i>03</i><div><h3>Výpočet spotreby materiálu</h3><p>Bezplatne spočítame, koľko tehál, izolácie, krytiny či omietky na stavbu skutočne potrebuješ.</p></div></article>
      <article class="srv"><i>04</i><div><h3>Bezplatné poradenstvo</h3><p>Zaškolený personál s dlhoročnými skúsenosťami ti pomôže vybrať správny materiál.</p></div></article>
      <article class="srv"><i>05</i><div><h3>Množstevné zľavy</h3><p>Pri väčšom odbere a pre stavebné firmy, živnostníkov a spolupracujúce stavebniny špeciálne ceny.</p></div></article>
      <article class="srv"><i>06</i><div><h3>Platba kartou a na splátky</h3><p>Platobný terminál priamo v predajni a nákup stavebného materiálu na splátky cez Quatro.</p></div></article>
    </div>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="head row"><div><div class="eyebrow">Novinky</div><h2>Čo sme pridali do ponuky</h2></div><a class="btn ghost" href="novinky/index.html">Všetky novinky</a></div>
  <div class="novs">{novs}</div>
</div></section>
<section class="sec onas"><div class="wrap grid">
  <div class="ph rv"><a href="img/p/110.webp" data-lb="1" data-cap="Predajňa Stavebniny Richtárik, Novozámocká 62/68"><img src="img/p/110.webp" alt="Predajňa Stavebniny Richtárik v Nitre" loading="lazy" width="533" height="400"></a><div class="year"><small>Od roku</small>1997</div></div>
  <div class="tx"><div class="eyebrow">O nás</div><h2>Rodinná firma, ktorá stavbám rozumie</h2><p>Stavebniny Richtárik založil Ing. Mário Richtárik v roku 1997. Hlavným profilom firmy je predaj a sprostredkovanie stavebného materiálu, majiteľ aj personál majú dlhoročné skúsenosti v stavebníctve.</p><p>Poradenstvo a vypracovanie cenových ponúk sú u nás zadarmo. Najdôležitejšia je pre nás tvoja spokojnosť.</p><a class="btn ghost" href="o-nas.html">Viac o nás</a></div>
</div></section>
<section class="sec kontakt-teaser dark grainy"><div class="wrap grid">
  <div><div class="eyebrow light">Kontakt</div><h2>Zavolaj, poradíme hneď</h2><a class="big-tel" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a>
  <div class="hours"><span><b>Po až Pia</b>7:00 až 16:00</span><span><b>Sobota</b>7:00 až 12:00</span></div>
  <p>{FIRMA['ulica']}, {FIRMA['mesto']}. Pri hlavnej ceste smerom na Nové Zámky.</p><div class="cta"><a class="btn primary" href="kontakt.html">Kontakt a mapa</a><a class="btn outline" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a></div></div>
  <a class="ph" href="kontakt.html"><img src="img/predajna.webp" alt="" loading="lazy" width="1200" height="800"></a>
</div></section>
'''
    ld = json.dumps({"@context": "https://schema.org", "@type": "HardwareStore", "name": "Stavebniny Richtárik", "alternateName": FIRMA['majitel'], "telephone": [FIRMA['mobil_tel'], FIRMA['pevna_tel']], "email": FIRMA['email'], "foundingDate": "1997", "address": {"@type": "PostalAddress", "streetAddress": FIRMA['ulica'], "addressLocality": "Nitra", "postalCode": "949 05", "addressCountry": "SK"}, "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "07:00", "closes": "16:00"}, {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "07:00", "closes": "12:00"}], "paymentAccepted": "Cash, Credit Card", "areaServed": "Slovensko", "vatID": FIRMA['dic']}, ensure_ascii=False)
    write(path, page(path, 'Stavebniny Richtárik Nitra', body, 'Stavebný materiál v celom sortimente za super ceny. Rodinné stavebniny v Nitre, Horné Krškany, doprava po celom Slovensku, cenová ponuka zadarmo.', None, extra_head=f'<script type="application/ld+json">{ld}</script>', home=True))


def build_search_index():
    idx = []
    for s, p in PAGES.items():
        if not s.startswith('katalog-roduktov__') and not s.startswith('novinky__') and not s.startswith('akcie__'): continue
        parts = s.split('__')
        if parts[0] == 'katalog-roduktov':
            t = KAT[parts[1]][1] if len(parts) == 2 else nice_title(SRC[s]['title'])
            kat = KAT[parts[1]][1]
        else:
            t = nice_title(SRC[s]['title']); kat = 'Akcie' if parts[0] == 'akcie' else 'Novinky'
        pr = parser('x.html'); txt = pr.plain(pr.blocks(SRC[s]['html']))
        idx.append({'t': t, 'k': kat, 'p': p, 'x': txt[:900]})
    write('assets/index.json', json.dumps(idx, ensure_ascii=False))


if __name__ == '__main__':
    build_home()
    build_katalog_index()
    for s in PAGES:
        if s.startswith('katalog-roduktov__'): build_katalog_page(s)
    build_akcie()
    build_novinky()
    build_galeria()
    build_simple('o-nas', 'O nás', 'Rodinná firma od roku 1997')
    build_simple('sluzby', 'Služby', 'Poradíme, spočítame, dovezieme')
    build_simple('akciovy-letak', 'Akciový leták', 'Akciové letáky na stiahnutie', 'Letáky s aktuálnymi akciami. Väčšie letáky sú na pôvodnej adrese webu.')
    build_kontakt()
    build_search_index()
    print('stránok:', len(PAGES))
