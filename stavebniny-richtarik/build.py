#!/usr/bin/env python3
"""Generátor webu Stavebniny Richtárik.

Zo záložného obsahu pôvodnej stránky (zdroj/pages.json, 83 podstránok stiahnutých
z www.stavebninyrichtarik.sk) postaví viacstránkový statický web: úvod, akcie,
katalóg so 14 kategóriami a podstránkami značiek, novinky, galériu, služby, o nás
a kontakt. Spustenie: python3 build.py (potrebuje lxml).
"""
import json, os, re, html, shutil
from urllib.parse import quote
from lxml import html as LH, etree
import obsah, texty
from popisy import ZNACKY

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = ROOT
SRC = json.load(open(os.path.join(ROOT, 'zdroj/pages.json'), encoding='utf-8'))
IMG_SIZES = json.load(open(os.path.join(ROOT, 'zdroj/obrazky.json')))

# Úpravy zdrojového HTML pred rozborom (len značky, text sa nemení): na pôvodnej stránke Topstone sú dva zoznamy odrážok
# celé tučné, rozbor obsahu (obsah.py: „tučná odrážka je nadpis“) z nich robil šesť samostatných nadpisov (KF-15). Odrážky
# sa odtučnia a otázka „Prečo zvoliť povrchy Bianka?“ je označená ako nadpis, takže vyjde nadpis, odsek a pod ním zoznam.
ZDROJ_UPRAVY = {
    'novinky__topstone-oprava-starych-chodnikov': [
        ('</span></strong></u><strong><span style="color: rgb(178, 34, 34);">&bull; schodísk', '</span></strong></u><br />\n\t<span>&bull; schodísk'),
        ('&bull; podláh altánov a pergol</span></strong></p>', '&bull; podláh altánov a pergol</span></p>'),
        ('<u><strong><span style="color: rgb(0, 0, 0);">Prečo zvoliť povrchy BIANKA?</span></strong></u><br />', '</p><h3>Prečo zvoliť povrchy BIANKA?</h3><p>'),
        ('<u><strong><span style="color: rgb(178, 34, 34);">&bull; mrazuvzdorný', '<span>&bull; mrazuvzdorný'),
        ('&bull; je nenáročný na údržbu v lete aj v zime<br />\n\t</span></strong></u><br />', '&bull; je nenáročný na údržbu v lete aj v zime</span></p>\n<p>'),
    ],
}
for _slug, _upravy in ZDROJ_UPRAVY.items():
    for _a, _b in _upravy:
        assert SRC[_slug]['html'].count(_a) == 1, (_slug, _a)   # zdroj sa zmenil: úpravu treba prejsť znova
        SRC[_slug]['html'] = SRC[_slug]['html'].replace(_a, _b)
PDF_LOCAL = set(os.listdir(os.path.join(ROOT, 'pdf')))
OLD = 'http://www.stavebninyrichtarik.sk'
# produkčná adresa webu (koreň hostingu); canonical, og:url, og:image a sitemap.xml sú absolútne na túto doménu.
# Náhľad v podpriečinku (GitHub Pages) funguje ďalej, lebo všetky odkazy v stránkach ostávajú relatívne.
DOMENA = 'https://www.stavebninyrichtarik.sk/'
OG_IMG = ('img/og-stavebniny-richtarik.jpg', 1200, 630)   # nové logo RS a názov na papieri webu (majitel/podklady/assets/og, 9. 11. 2026)
OG_ALT = 'Logo RS a názov Stavebniny Richtárik, predaj stavebného materiálu v celom sortimente, Nitra – Horné Krškany'


def webp_rozmer(cesta):
    """Šírka a výška obrázka WebP z hlavičky súboru (bez knižnice na obrázky)."""
    with open(cesta, 'rb') as f: b = f.read(40)
    if b[12:16] == b'VP8X': return 1 + int.from_bytes(b[24:27], 'little'), 1 + int.from_bytes(b[27:30], 'little')
    if b[12:16] == b'VP8 ': return int.from_bytes(b[26:28], 'little') & 0x3fff, int.from_bytes(b[28:30], 'little') & 0x3fff
    if b[12:16] == b'VP8L':
        v = int.from_bytes(b[21:25], 'little'); return (v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1
    return None


def obr_rozmer(cesta):
    """Šírka a výška obrázka WebP alebo PNG z hlavičky súboru; None, ak sa nedá zistiť."""
    if cesta.endswith('.webp'): return webp_rozmer(cesta)
    if cesta.endswith('.png'):
        with open(cesta, 'rb') as f: b = f.read(24)
        if b[12:16] == b'IHDR': return int.from_bytes(b[16:20], 'big'), int.from_bytes(b[20:24], 'big')
    return None


def rozmery(t, path):
    """Každý <img> s miestnym súborom dostane width a height (miesto pre obrázok je rezervované, obsah neposkočí).
    Výnimka: prázdny obrázok lightboxu (src="" sa plní skriptom)."""
    base = os.path.dirname(os.path.join(OUT, path))
    def f(m):
        tag = m.group(0)
        if re.search(r'\swidth=', tag) and re.search(r'\sheight=', tag): return tag
        src = re.search(r'\ssrc="([^"]+)"', tag)
        if not src or src.group(1).startswith(('http', 'data:')): return tag
        s = src.group(1)
        cesta = os.path.join(OUT, s.lstrip('/')) if s.startswith('/') else os.path.normpath(os.path.join(base, s))
        wh = obr_rozmer(cesta) if os.path.exists(cesta) else None
        if not wh: return tag
        tag = re.sub(r'\s(width|height)=("[^"]*"|\S+)', '', tag)
        return tag[:-1].rstrip('/ ') + f' width="{wh[0]}" height="{wh[1]}">'
    return re.sub(r'<img\b[^>]*>', f, t)


def url_abs(path):
    """Absolútna adresa stránky; úvod je koreň domény."""
    return DOMENA + ('' if path == 'index.html' else path)

FIRMA = {
    'nazov': 'Stavebniny Richtárik', 'majitel': 'Ing. Mário Richtárik - Stavebniny',
    'ulica': 'Novozámocká 62/68', 'mesto': '949 05 Nitra, Horné Krškany',
    'mobil': '0905 622 223', 'mobil_tel': '+421905622223',
    'pevna': '037 651 17 77', 'pevna_tel': '+421376511777',
    'email': 'info@stavebninyrichtarik.sk', 'ico': '45959846', 'dic': 'SK1083167855',
    'mapa': 'https://www.google.com/maps/search/?api=1&query=Novoz%C3%A1mock%C3%A1+62%2F68%2C+949+05+Nitra',
}
# Prehliadka predajne 360° priamo na stránke (majiteľ 9. 11. 2026: panoramatický pohľad z Googlu „keby sa dal použiť aj v našej
# stránke“; Lajo 9. 11.: nikoho neposielať na Google). Dva zdroje, oba sa načítajú až po kliknutí (pred ním 0 požiadaviek na Google):
#  'src'     – kód „Vložiť mapu“ panorámy z Google Máp (src rámu https://www.google.com/maps/embed?pb=…); prázdne = rám sa nepoužije,
#              postup získania je v README (Údržba) a richtarik/majitel/360/ZAPIS.md,
#  'obrazok' – vlastná equirektangulárna panoráma 2:1 (img/panorama/predajna.jpg) pre prehliadač zdroj/panorama.js; dnes skúšobný
#              obraz vygenerovaný lokálne (nápis „skúšobná panoráma“), skutočný záber nahradí súbor pod tým istým názvom.
# Prednosť má 'src'; bez oboch ostáva v komponente fotka a tlačidlo je skryté.
#  'skusobna' – True, kým je v 'obrazok' len skúšobný obraz (KF-12): náhľad na kontrolu to hovorí priamo v stránke (odznak
#              „360° · ukážka“, veta pod oknom, odsek sekcie, texty odkazov) a nasadenie/balik.sh sekciu aj odkazy medzi značkami
#              <!--p360--> … <!--/p360--> z balíka na ostrý web vynechá. Po dodaní skutočného záberu (alebo 'src') nastaviť False,
#              spustiť build a na úvode vymeniť blok, odsek a text odkazu (kontrola_uvodu vypíše, čo sa nezhoduje).
PANORAMA = {'src': '', 'obrazok': 'img/panorama/predajna.jpg', 'skusobna': True}
P360_SKUSOBNA = bool(PANORAMA.get('skusobna')) and not PANORAMA['src']
P360_LEDE = ('Ukážka na kontrolu: prehliadka zatiaľ ukazuje skúšobný obraz. Skutočný 360° záber predajne doplníme.' if P360_SKUSOBNA
             else 'Otočte sa po predajni a sklade priamo na našej stránke.')
P360_ODKAZ = 'Prehliadka 360° (ukážka)' if P360_SKUSOBNA else 'Prezrieť predajňu v 360°'
# Stavebná firma FIZO SK (brat majiteľa; majiteľ 9. 11. 2026: „odkaz aj na bratovu stránku – www.fizosk.sk“). Popis len
# z adresára a titulku stránky (majitel/dodavatelia/ZAPIS.md časť 3), rodinný vzťah ani odber materiálu sa neuvádzajú.
FIZOSK = 'https://www.fizosk.sk/'

# Kategórie katalógu: slug pôvodného webu -> pekný názov, popis, značky, fotka na karte
KATEGORIE = [
    ('sypke-zmesy', 'Sypké zmesi', 'Cement, vápno, malty, omietky, lepidlá, stierky a samonivelačné hmoty.', 'Baumit, Cemmac, Calmit, Holcim, Murexin, Univerbau', 'cement'),
    ('murovaci-material', 'Murovací materiál', 'Tehly, pórobetónové a betónové tvárnice, preklady a stropné systémy.', 'Pezinské tehelne, Ytong, Porfix, Betonárka Nadlice', 'tehla'),
    ('stresne-kritiny', 'Strešné krytiny', 'Pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo.', 'Tondach, Bramac, Mediterran, Onduline, Icopal, Blachotrapez', 'strecha'),
    ('dlazby', 'Dlažby a ploty', 'Zámkové dlažby, terasové platne, obrubníky, palisády a plotové systémy.', 'City Stone Design, Premac, Stadreko', 'dlazba'),
    ('izolacny-material', 'Izolačný materiál', 'Minerálna vlna, polystyrén, asfaltové pásy a izolácie proti vode a radónu.', 'Knauf Insulation, Isover, Nobasil, Icopal, Den Braven, Climowool', 'izolacia'),
    ('kominove-systemy', 'Komínové systémy', 'Certifikované komíny so šamotovou alebo nerezovou vložkou.', 'Stadreko, Schiedel', 'komin'),
    ('stresne-okna', 'Strešné okná', 'Kyvné a výklopné strešné okná, výlezy, svetlíky, podkrovné schody a doplnky.', 'Velux, Fakro, RoofLITE', 'okno-strecha'),
    ('hutny-material', 'Hutný materiál', 'Betonárska oceľ, siete, plechy, profily, rúry, zárubne a garážové brány.', 'Yssel Steel', 'hutny'),
    ('dvere---okna', 'Dvere a okná', 'Interiérové, vchodové, bezpečnostné a posuvné dvere, drevené okná s dvojsklom.', 'Masonite', 'dvere'),
    ('stavebne-rezivo', 'Stavebné rezivo', 'Dosky, hranoly, foršne, strešné laty, tatranský profil a krovy na mieru.', 'Drepex', 'rezivo'),
    ('stavebne-naradie-doplnky', 'Náradie a doplnky', 'Stavebné, elektrické a záhradné náradie, spojovací materiál, mriežky a poklopy.', 'Slovakia Trend, DS Haco', 'naradie'),
    ('podhlady---pvc', 'Podhľady a PVC', 'Plastové zatrávňovacie dlažby, plotovky, profily, platne a káblové žľaby.', 'Transform Recykling', 'zahrada'),
    ('sadrokartonovy---zateplovaci-system', 'Sadrokartón a zateplenie', 'Suchá výstavba, profily, polystyrén, sklotex, fólie a strešné doplnky.', 'Stavebné profily, Masterplast', 'sadrokarton'),
    ('fasadny-system', 'Fasádny systém', 'Silikónové, silikátové a mozaikové omietky, fasádne farby a zatepľovacie systémy.', 'Baumit, Univerbau', 'fasada'),
    ('farby---laky', 'Farby a laky', 'Interiérové a fasádne farby, laky, lepidlá, riedidlá a tónovacie systémy.', 'Het, Chemolak, Chemos, Elastik', 'farby'),
]
KAT = {k[0]: k for k in KATEGORIE}

# Aktuálny cenník akcií z pôvodného webu (files/662.pdf, „STIAHNUŤ-CENNÍK AKTUÁLNYCH AKCII“, aktualizovaný 28. 1. 2026)
# a podmienky zliav doslova podľa jeho hlavičky (662: „ZĽAVA Z AKCIOVÝCH CIEN / ZÁKAZNÍCKA KARTA / PLATBA V HOTOVOSTI -5 %
# / PLATBA PLAT. KARTOU -3,3 % … Ceny platia pri platbe v hotovosti, z ceny je už odrátaná 5% zľava“).
CENNIK_PDF = 'pdf/662.pdf'
CENNIK_TEXT = 'Cenník akcií z 28.\u00a01.\u00a02026 (PDF)'
CENNIK_LETAK = 'Cenník akcií z 28.\u00a01.\u00a02026 (PDF, 4 strany)'
# nezlomiteľná medzera medzi číslom a % a v dátume, aby sa na telefóne nerozdelili na dva riadky
ZLAVA_AKCIE = ('Zľava z akciových cien so zákazníckou kartou: 5\u00a0% pri platbe v hotovosti, 3,3\u00a0% pri platbe platobnou kartou. '
               'Ceny v cenníku akcií (28.\u00a01.\u00a02026) platia pri platbe v hotovosti, z ceny je už odrátaná 5\u00a0% zľava.')

# Karty akcií v poradí a znení pôvodnej stránky Akcie (zdroj/pages.json „akcie“; menený len pravopis a veľké písmená).
# slug: podstránka akcie (akcie/<slug>.html), alebo celý slug inej stránky (karta bez letáku vedie tam).
AKCIE_KARTY = [
    ('pezinska-tehla-termobrik', 'Akciová cena', 'Pezinská tehla TermoBRIK', 'Brúsené tehly TermoBRIK so systémom Dry, lepidlo zdarma. Na váš dom pripravíme individuálnu cenovú ponuku. Doprava až na stavbu zdarma, vykládka za poplatok.'),
    ('komin-qatro', 'Na sklade', 'Komín Stadreko', 'Certifikovaný komínový systém priamo na sklade, odber ihneď. Napríklad kompletný komín 6 m, ø 160/90 za 618 € s DPH.'),
    ('krytina-blachotrapez', 'Doprava 17 €', 'Krytina Blachotrapez', 'Pri odbere nad 50 m²: škridloplech od 9,22 €/m², trapézové plechy od 8,28 €/m² a doprava po celom Slovensku za 17 €, ceny s DPH. Vykládka 40 € s DPH.'),
    ('katalog-roduktov__dlazby', '15 – 30 %', 'Dlažba City Stone Design', 'Zľava 15 – 30 % z cenníkových cien (objektové zľavy).'),
    ('dlazby--ploty-stadreko', 'Akciová cena', 'Dlažby a ploty Stadreko', 'Dlažby, obrubníky, plotové tvárnice, striešky, svahovky, palisády a zatrávňovačky za akciové ceny, napríklad dlažba Holland od 10,45 €/m² s DPH.'),
    ('okna--schody-fakro', 'Zľava 20 %', 'Okná a schody Fakro', 'Strešné okná, podkrovné sklápacie schody a strešné doplnky so zľavou 20 %, v rôznych druhoch a rozmeroch.'),
    ('stavebne-rezivo', 'Akciová cena', 'Stavebné rezivo', 'Dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo a krovy na mieru za akciové ceny, rezivo priamo na sklade.'),
    ('stavebne-naradie', 'Na sklade', 'Stavebné náradie', 'Náradie na stavbu, do dielne, do záhrady aj do domácnosti, priamo na sklade.'),
    ('sadrokartonovy---zateplovaci-system', 'Doprava zdarma', 'Zatepľovací a sadrokartónový systém', 'Sadrokartón, profily, polystyrén a príslušenstvo v kompletnom sortimente. Polystyrén vám dovezieme domov zdarma.'),
    ('porfix', 'Špeciálne zľavy', 'Porfix', 'Tvárnice na obvodové murivo a priečky, strop, lepidlá a malty. Pri celom kamióne doprava až domov zdarma.'),
    ('ytong', 'Špeciálne zľavy', 'Ytong', 'Pórobetónové tvárnice, preklady a stropné dielce. Pri celom kamióne doprava zdarma až na stavbu.'),
    ('novinky__garaze--zahradne-domceky', 'Akciová cena', 'Garáže, záhradné domčeky', 'Montované plechové garáže a záhradné domčeky za akciové ceny. Doprava aj montáž po celom Slovensku zdarma.'),
    ('betonove-tvarnice', 'Znížené ceny', 'Betónové tvárnice', 'Presné tvárnice s perom a drážkou: šalovacie od 1,28 € a stĺpové od 1,57 € za kus s DPH.'),
    ('cement-325-r', '4,42 €/vrece', 'Cement 325 R a 425 R', 'Cement 325 R za 4,42 € a 425 R za 5,18 € za vrece 25 kg s DPH. Ceny platia pri platbe v hotovosti.'),
    ('sakret', 'Znížené ceny', 'Lepidlá a omietky Univerbau', 'Lepidlá mrazuvzdorné, na polystyrén a na kvádre, flexibilné lepidlá, nivelit, hrubé omietky, murovacie malty a betónový poter za znížené ceny.'),
    ('nobasil', 'Akciová cena', 'Climowool 039', 'Izolácia na šikmé a ploché strechy, steny, stropy, podlahy a fasády, napríklad hrúbka 15 cm za 29,88 € za balenie s DPH.'),
    ('stresne-okna-rooflite', 'Akciová cena', 'Strešné okná RoofLITE', 'Strešné okno Solid Pine 78 × 118 s lemovaním TFX za 283 € s DPH, ďalšie rozmery a druhy za akciové ceny.'),
]
# karty bez letáku: text odkazu
AKCIE_ODKAZ = {'katalog-roduktov__dlazby': 'City Stone Design v katalógu', 'novinky__garaze--zahradne-domceky': 'Garáže a domčeky'}
# letáky odkázané priamo z pôvodnej stránky Akcie (názov podľa textu odkazu v zdroji)
AKCIE_LETAKY = [('pdf/631.pdf', 'Leták akcie: krytina Blachotrapez (PDF, 6. 11. 2024)'), ('pdf/633.pdf', 'Leták akcie: cement 325 a 425 (PDF, 6. 11. 2024)')]
# Dátum letáku akcie v názve odkazu: dátum vytvorenia súboru (pdfinfo, CreationDate). Na stránke akcie je vždy najnovší
# leták prvý a pri starších letákoch je jasné, že ide o staršie ceny (staré akcie bez dátumu sú otvorená otázka majiteľa).
PDF_DATUM = {'631': '6. 11. 2024', '633': '6. 11. 2024', '649': '28. 4. 2025', '653': '28. 4. 2025', '658': '7. 6. 2025',
             '659': '28. 1. 2026', '660': '28. 1. 2026', '558': '20. 2. 2012', '618': '14. 6. 2024', '434': '10. 5. 2014',
             '433': '10. 5. 2014', '33': '9. 2. 2010', '39': '10. 2. 2010', '641': '11. 1. 2025', '471': '30. 4. 2015',
             '626': '8. 7. 2024', '663': '28. 1. 2026', '654': '28. 4. 2025', '664': '28. 1. 2026', '661': '28. 1. 2026',
             '662': '28. 1. 2026', '386': '27. 4. 2012', '385': '10. 4. 2012', '197': '30. 11. 2009'}
# letáky pôvodného webu, ktoré tam už neexistujú (404) – neodkazujú sa
PDF_MRTVE = {'521.pdf', '497.pdf'}

# Sortiment z úvodnej stránky pôvodného webu (zdroj „uvod“, časť „Tovar ktorý máme v ponuke“), doslova, opravený len
# pravopis. Na kategóriách, ktorých podstránky tieto položky nemajú (OBS-13), aby ich našlo aj vyhľadávanie.
PONUKA_NADPIS = 'Tovar, ktorý máme v ponuke'
PONUKA_UVOD = {
    'sypke-zmesy': 'Cement – portlandský troskový cement, portlandský cement, portlandský zmesný cement – CEM II/A-S 32,5 R, CEM II/B-S 32,5 R, '
                   'CEM I 32,5 R, CEM I 42,5 R, vápno, brizolit, omietky, lepidlá, šparovačky, malta murovacia, omietková – stierky, '
                   'samonivelačná hmota – Nivelit na vyrovnávanie betónových podláh. Baumit, Cemmac, Calmit, Murexin, Styrcon, Univerbau.',
    'murovaci-material': 'Pezinská tehelňa – murovací materiál pre obvodové murivo, murovací materiál pre akustické priečky, murovací materiál '
                         'pre deliace a nosné priečky, materiál pre ostatné murivo, keramické nosníky s priestorovou výstužou, keramické stropné '
                         'vložky, keramické preklady, tehla biela, žltá, šamotová 29, 25, plátky, tehla pálená – plná 25, 30, tehla ľahčená 29, 25, '
                         'tehla 2-dierová, CV-14, CDm, tehla obvodová, priečkovky. Presné tvárnice pórobetónové – kvádre, priečkovky 5; 7,5; 10; '
                         '12,5; 15; 20, obvodové 25; 30; 37,5 Ytong, Porfix. Betónové tvárnice – murovacie 10; 25, šalovacie 15; 20; 30; 40 '
                         'Betonárka Nadlice.',
    'dlazby': 'Prvky vonkajšej architektúry – betónové zámkové dlažby – Háčko, Dvojvlna, Top Zóna systém, Top Zóna Delgado, Top Zóna Antiko, '
              'Blok, Slepecký blok, Eko Cuadro, zatrávňovacia dlažba, Kyjak, Šesťhran, Romana, betónové platne. Prvky záhradnej architektúry – '
              'Romana palisády, guľa z vymývaného betónu. Prvky pre cestné komunikácie – obrubník cestný, obrubník parkový, obrubník bariérový, '
              'prídlažba, žľabovka. Plotový systém – plotové prvky štiepané Casser, zákrytové dosky, debniace betónové tvárnice. '
              'Stavebniny Richtárik Nitra ponúkajú dlažby a doplnky v rôznych farbách – šedá, čierna, biela, žltá, zelená, červená, hnedá, '
              'piesková, terakota – City Stone Design, Premac, Stadreko.',
    'stavebne-naradie-doplnky': 'Odlučovače ropných látok, lapače tukov a škrobov, neutralizačné nádrže, kalové nádrže, regulátory prietoku, '
                                'nástenné stavidlá, dažďové nádrže, prečerpávacie stanice, odvodňovacie žľaby, nerezový program, plastové '
                                'poklopy, liatinové poklopy, plastové mreže, poklopy pre zadláždenie, zatrávňovacie panely, odľahčené stropy, '
                                'prevetrané podlahy, pivničné svetlíky, vetracie šachty, mrežové rošty – Slovakia Trend, DS Haco.',
}
# úvodný text pôvodného webu o sortimente a nákupe (zdroj „uvod“), doslova; na stránke Katalóg
SORTIMENT_UVOD = ('V našich stavebninách nájdete produkty popredných slovenských aj svetových výrobcov. Systém zliav dohodnutý '
                  's výrobcami nám dovoľuje predávať za výhodné ceny stavebným firmám, individuálnym stavebníkom aj spolupracujúcim '
                  'stavebninám. Materiál dopravíme vlastnou nákladnou dopravou na miesto stavby, ktoré určíte, po celom Slovensku. '
                  'Stavebný materiál môžete kúpiť aj na splátky cez Quatro a platiť platobnou kartou cez terminál. Cenové ponuky '
                  'a poradenstvo sú u nás zadarmo.')

NOVINKY_POPIS = {
    'dekoracne-kamene': 'Biely mramorový okruhliak, čierny Nero Ebono a kamenná kôra vo vreciach po 25 kg, ceny s DPH.',
    'topstone-oprava-starych-chodnikov': 'Kamenný koberec Bianka na úpravu schodísk, balkónov, výjazdov, vstupov, dvorov a chodníkov.',
    'delap--ohybny-kamenny-obklad': 'Prírodný kameň v ohybných pásoch, 7 tvarov, balenie 4 m², akciová cena 17,80 €/m² s DPH.',
    'magic-floor-vynilova-podlaha': 'Vinylové podlahy Magic Floor do domácnosti aj do priemyselných priestorov.',
    'vyrobky-z-plastu': 'Zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu.',
    'garaze--zahradne-domceky': 'Montované plechové garáže a záhradné domčeky, doprava a montáž po celom Slovensku zdarma.',
    'ekostyren': 'Plnivo do betónu z polystyrénovej drte, ktoré zlepší jeho tepelnoizolačné vlastnosti.',
    'betonove--vyrobky': 'Šalovacie diely, tvárnice a betónové prvky za akciové ceny.',
}


# Podtitul kategórie s predajným hookom. Len fakty z pôvodného webu (sklad, zľavy, doprava, poradenstvo).
HOOKY = {
    'sypke-zmesy': 'Cement, vápno, malty, omietky a lepidlá Baumit, Cemmac, Calmit a Holcim. Spotrebu materiálu vám spočítame zadarmo.',
    'murovaci-material': 'Tehly TermoBRIK, tvárnice Ytong a Porfix, preklady a stropné systémy. Spotrebu na celý dom vám spočítame zadarmo.',
    'stresne-kritiny': 'Pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo. Výpočet krytiny je zadarmo.',
    'dlazby': 'Zámková dlažba, terasové platne, obrubníky, palisády a ploty. Pri väčšom odbere poskytujeme množstevné zľavy.',
    'izolacny-material': 'Minerálna vlna, polystyrén, asfaltové pásy a izolácie proti vode a radónu. Spotrebu materiálu vám spočítame zadarmo.',
    'kominove-systemy': 'Certifikované komíny Stadreko a Schiedel so šamotovou alebo nerezovou vložkou. Komín Stadreko máme priamo na sklade, odber možný ihneď.',
    'stresne-okna': 'Strešné okná Velux, Fakro a RoofLITE, výlezy, svetlíky a podkrovné schody. Akcia: okná a schody Fakro so zľavou 20 %.',
    'hutny-material': 'Betonárska oceľ, siete, plechy, profily, rúry, oceľové zárubne a garážové brány. Materiál vám dovezieme na miesto stavby, ktoré určíte.',
    'dvere---okna': 'Interiérové, vchodové a bezpečnostné dvere Masonite v siedmich dekoroch. Bežné druhy máme priamo na sklade, ostatné na objednávku.',
    'stavebne-rezivo': 'Dosky, hranoly, foršne, strešné laty, tatranský profil a krovy na mieru. Rezivo máme priamo na sklade, v ponuke je aj palivové drevo agát.',
    'stavebne-naradie-doplnky': 'Náradie na stavbu, do dielne aj do záhrady, spojovací materiál, mriežky a poklopy. Náradie máme priamo na sklade.',
    'podhlady---pvc': 'Zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu. Sme výhradný predajca Transform Recykling pre Nitru a okolie.',
    'sadrokartonovy---zateplovaci-system': 'Sadrokartón, profily, polystyrén, sklotex, fólie a strešné doplnky. Polystyrén vám dovezieme domov zdarma.',
    'fasadny-system': 'Omietky a fasádne farby Baumit, Univerbau a Delap, zatepľovacie systémy. Spotrebu na vašu fasádu vám spočítame zadarmo.',
    'farby---laky': 'Interiérové a fasádne farby, laky, lepidlá a riedidlá Het, Chemolak, Chemos a Elastik. Čo nie je na sklade, zabezpečíme na požiadanie.',
}


# Opravy preklepov a jednotné názvy značiek v texte (OBS-18, OBS-19, FUN-13). Použijú sa na celý výstup write() pre .html a .json;
# vzory obsahujú medzery alebo veľké písmená, takže sa nedotknú adries (URL a názvy súborov sú malými písmenami).
OPRAVY = [
    (r'ceritifikovan', 'certifikovan'),
    (r'Tenický list', 'Technický list'), (r'Akcivý', 'Akciový'), (r'navod k pokladke', 'návod na pokládku'),
    (r'omietkviny', 'omietkoviny'), (r'porfily', 'profily'), (r'dialničn', 'diaľničn'), (r'Modyly', 'Modely'),
    (r'Otiene', 'Odtiene'), (r'Ekostyrenber[oó]n', 'Ekostyrénbetón'), (r'Ekostyrenbetón', 'Ekostyrénbetón'),
    (r'ekostyrenbetón', 'ekostyrénbetón'), (r'ušľachntil', 'ušľachtil'), (r'Plech vzor skridla', 'Plech vzor škridla'),
    (r'Delap- ohybný kamenný obklad', 'Delap, ohybný kamenný obklad'), (r'Magic floor', 'Magic Floor'),
    (r'Lepidla, omietky', 'Lepidlá, omietky'), (r'splátky Qatro', 'splátky Quatro'), (r'skutočného otieňa', 'skutočného odtieňa'),
    (r'\bTermo[Bb]rik\b', 'TermoBRIK'), (r'\bPORFIX\b', 'Porfix'), (r'\bYTONG\b', 'Ytong'),
    (r'CITY STONE DESIGN|Citystonedesign', 'City Stone Design'),
    # superlatívy ako naše tvrdenie preč (FAKTY I-06, I-07, STYL §8; o návrate rozhodne majiteľ), tvrdenia výrobcov
    # len s pripísaním výrobcovi (FAKTY G)
    (r'Najla[a-zšíéj]+ certifikovaný komínový systém na Slovensku', 'Certifikovaný komínový systém'),
    (r'<section class="art rv"><h3>10\. Najekonomickejší komín</h3><p>Bezkonkurenčné ceny na Slovensku\.</p></section>', ''),
    (r'<h2 class="sh rv"><span>Najla[a-zšíéj]+ garáže na slovensku</span></h2>', ''),
    (r'Holcim \(Slovensko\) a\.s\. je najväčším', 'Holcim (Slovensko) a.s. je podľa vlastných údajov najväčším'),
    (r'Schiedel je odborník v oblasti komínov a najväčší', 'Schiedel je podľa vlastných údajov odborník v oblasti komínov a najväčší'),
    (r'Najväčší výrobca pálených škridiel v strednej Európe', 'Najväčší výrobca pálených škridiel v strednej Európe (podľa výrobcu)'),
]


# Vonkajšie odkazy z pôvodného webu, ktorých podstránka vracia 404 (overené GET 3. 11. 2026): koreň domény výrobcu vracia 200.
ODKAZY_OPRAVY = {'http://www.murexin.com/sk/main1': 'https://www.murexin.com/', 'http://www.raven.sk/lang_1/default.aspx': 'https://www.raven.sk/'}


def opravy(t):
    for a, b in OPRAVY: t = re.sub(a, b, t)
    for a, b in ODKAZY_OPRAVY.items(): t = t.replace(a, b)
    return t


def nadpisy(t):
    """V <main> zmení h3, pred ktorými od h1 nie je žiadne h2, na <h2 class="h3"> (rovnaký vzhľad, bez skoku úrovne)."""
    i, j = t.find('<main'), t.find('</main>')
    if i < 0 or j < 0: return t
    videl_h2 = False
    def f(m):
        nonlocal videl_h2
        if m.group(1) == '2': videl_h2 = True; return m.group(0)
        if videl_h2: return m.group(0)
        at = m.group(2)
        at = re.sub(r'class="([^"]*)"', r'class="\1 h3"', at) if 'class="' in at else at + ' class="h3"'
        return f'<h2{at}>{m.group(3)}</h2>'
    return t[:i] + re.sub(r'<h([23])\b([^>]*)>(.*?)</h\1>', f, t[i:j], flags=re.S) + t[j:]


def drazky(t):
    """Nadpisy sekcií (h2.sh s triedou rv) dostanú text v drážke <span class="dr"><span>…</span></span>: pri odhalení
    pri posune vyjde zdola ako riadok H1 (RP2-06, site.css Pohybový systém časť 4A). Text ani poradie sa nemenia."""
    return re.sub(r'(<h2 class="sh rv"[^>]*>)<span>((?:(?!</?span\b).)*?)</span>', r'\1<span class="dr"><span>\2</span></span>', t, flags=re.S)


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
            if b not in PDF_LOCAL:  # súbor na pôvodnom webe už nie je – odkaz preč, text ostáva
                a.drop_tag(); continue
            a.set('href', rel(page_path, 'pdf/' + b))
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


def parser(path, ctx=None):
    return obsah.Parser(IMG_SIZES, PDF_LOCAL, URL2PATH, path, rel, ctx)


def first_big(slug, minw=180, minh=100):
    """Prvý väčší obrázok podstránky (na kartu značky, novinky)."""
    for i, e in SRC[slug]['imgs']:
        if i in IMG_SIZES and IMG_SIZES[i][0] >= minw and IMG_SIZES[i][1] >= minh: return i
    return None


def ctx_for(slug):
    """Súvislosti pre katalógovú stránku: kategória, jej fotka, podstránky značiek."""
    parts = slug.split('__')
    if parts[0] != 'katalog-roduktov' or len(parts) < 2: return {}
    cat = KAT[parts[1]]; catslug = 'katalog-roduktov__' + parts[1]
    subs = {c.split('__')[2]: (PAGES[c], nice_title(SRC[c]['title'])) for c in children(catslug)}
    sub_img = {PAGES[c]: ('p/' + first_big(c)) for c in children(catslug) if first_big(c)}
    return {'kat': parts[1], 'kat_img': cat[4], 'subs': subs, 'sub_img': sub_img}


def content(slug, path):
    """Obsah pôvodnej stránky prerobený do moderných blokov."""
    p = parser(path, ctx_for(slug))
    return p.render(p.blocks(SRC[slug]['html']))


def snippet(slug, n=110):
    p = parser('x.html')
    t = p.plain(p.blocks(SRC[slug]['html']))
    return (t[:n].rsplit(' ', 1)[0] + '…') if len(t) > n else t


# ---------- šablóna ----------
NAV = [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), ('katalog/index.html', 'Katalóg'), ('novinky/index.html', 'Novinky'), ('sluzby.html', 'Služby'), ('doprava.html', 'Doprava'), ('galeria/index.html', 'Galéria'), ('o-nas.html', 'O nás'), ('kontakt.html', 'Kontakt')]


def breadcrumb_ld(path, crumbs):
    """BreadcrumbList pre Google: tie isté položky ako viditeľná navigačná cesta."""
    if not crumbs: return ''
    items = [{"@type": "ListItem", "position": i + 1, "name": texty._typografia(html.unescape(re.sub(r'<[^>]+>', '', opravy(t)))), "item": url_abs(p or path)} for i, (p, t) in enumerate(crumbs)]
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}, ensure_ascii=False) + '</script>\n'


FARBA = '#1c1a1b'   # farba lišty prehliadača (theme-color, manifest): antracit farebnej témy (nad červenou lištou webu tmavá linka ako v páse loga); pri ?tema=svetla ju skript TEMA_HEAD prepíše na #faf8f4, pri ?tema=tmava na #121110
TEMA = 'farebna'    # predvolená téma v atribúte data-tema na <html> každej stránky (farebná aj bez JS; zdroj/tema-head.js)


def zmensi_js(s):
    """Zmenší zdroj skriptu zo zdroj/: bez komentárov /* */ a // (za kódom len s medzerou pred aj za //), medzery okolo
    interpunkcie preč; reťazce v úvodzovkách ostávajú bez zmeny. Zdroj musí mať bodkočiarky všade (riadky sa spoja)."""
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    riadky = []
    for r in s.split('\n'):
        r = re.sub(r'\s+//\s.*$', '', r).strip()
        if r and not r.startswith('//'): riadky.append(r)
    casti = re.split(r"('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")", ' '.join(riadky))
    for i in range(0, len(casti), 2):
        casti[i] = re.sub(r'\s*([{}()\[\];,=:+\-*/<>!?&|])\s*', r'\1', re.sub(r'\s+', ' ', casti[i]))
    return ''.join(casti).strip()


def zmensi_css(s):
    """Zmenší zdroj štýlu zo zdroj/: bez komentárov, medzery okolo { } ; , > a za dvojbodkou preč (medzery okolo + a -
    v calc() ostávajú). Zdroj nemá dvojbodku s medzerou v selektore."""
    s = re.sub(r'\s+', ' ', re.sub(r'/\*.*?\*/', '', s, flags=re.S))
    return re.sub(r':\s+', ':', re.sub(r'\s*([{};,>])\s*', r'\1', s)).replace(';}', '}').strip()


def prechody_head():
    """Skript prechodov medzi stránkami (zdroj zdroj/prechody.js bez komentárov) a pravidlá prípravy stránky
    (Speculation Rules): cieľ dlaždice katalógu, akcie, zásoby alebo novinky sa začne pripravovať pri dotyku
    (eagerness conservative = pointerdown), takže fotka hlavičky je pri prechode načítaná. Len stránky .html
    toho istého webu, nikdy PDF, subory/, mailto: ani tel:. Rovnaký blok je ručne v index.html (kontrola_uvodu)."""
    js = zmensi_js(open(os.path.join(ROOT, 'zdroj', 'prechody.js'), encoding='utf-8').read())
    pravidla = {"prerender": [{"where": {"and": [{"selector_matches": "a.cat, a.deal, a.zt, a.nov"}, {"href_matches": "/*.html"}]}, "eagerness": "conservative"}]}
    return '<script>' + js + '</script>\n<script type="speculationrules">' + json.dumps(pravidla, separators=(',', ':')) + '</script>\n'


PRECHODY_HEAD = prechody_head()


def tema_head():
    """Skript témy podkladu (zdroj zdroj/tema-head.js). Predvolená farebná téma je v HTML (data-tema="farebna" na <html>,
    konštanta TEMA), skript ju pred štýlom každej stránky len prepne na porovnanie: ?tema=svetla (bez atribútu) alebo
    ?tema=tmava, voľba sa pamätá v localStorage, ?tema=farebna ju zruší; všetko pred prvým vykreslením (bez bliku).
    Rovnaký blok je ručne v index.html (kontrola_uvodu) a medzi značkami <!--tema--> v asistent/ochrana-udajov.html
    (ochrana_prechody). Tokeny: site.css, časti Tmavá téma a Farebná téma."""
    return '<script>' + zmensi_js(open(os.path.join(ROOT, 'zdroj', 'tema-head.js'), encoding='utf-8').read()) + '</script>\n'


TEMA_HEAD = tema_head()


def uvitanie_bloky():
    """Uvítanie „Brána“ pred úvodom (len index.html): štyri bloky zo zdroj/uvitanie-head.js, uvitanie.css,
    uvitanie.html a uvitanie.js. Úvod je ručný, build.py ho neprepisuje: bloky sa vložia ručne (zdroj/uvitanie_vloz.py:
    head a style pred skript uv-ide v <head>, prekryv ako prvý prvok <body>, aby bol pozdrav v prvom vykreslení, skript
    za hlavičkou a menu tesne pred <main>) a kontrola_uvodu() overí, že sú v index.html
    práve raz a zhodujú sa so zdrojom. Vypnutie: VYP = 1 v uvitanie-head.js alebo zmazať štyri bloky (README, Úvod)."""
    z = lambda n: open(os.path.join(ROOT, 'zdroj', n), encoding='utf-8').read()
    tpl = ''.join(r.strip() for r in re.sub(r'<!--.*?-->', '', z('uvitanie.html'), flags=re.S).split('\n'))
    return {'style': '<style>' + zmensi_css(z('uvitanie.css')) + '</style>',
            'head': '<script>' + zmensi_js(z('uvitanie-head.js')) + '</script>',
            'sablona': tpl,
            'skript': '<script>' + zmensi_js(z('uvitanie.js')) + '</script>'}


# Fotka v hlavičke podstránky: ostrá, v ráme (počítač vpravo do 520 px, telefón pod textom celou šírkou obsahu, výška 230 px),
# bez stmavenia a bez paralaxy. Skutočné fotky areálu predajne (img/uvod, existujúce šírky AVIF a WebP) a áut firmy (img/p) tam, kde
# ukazujú presne ten tovar alebo firmu; ilustračné fotky img/hd (verzia 1200 px, q80) len pri kategóriách tovaru.
# Výrez: object-position drží palety a tovar v zábere.
UVOD_FOTO = {   # názov: (šírky v názvoch súborov, skutočný rozmer najväčšieho, object-position)
    # pas-dvor-1920 má po vyrovnaní horizontu (elegantná úprava 5. 11. 2026, nič nezväčšené) 1848 × 1040: deskriptor
    # najväčšieho súboru v srcset je jeho skutočná šírka, názov súboru ostáva.
    'zasoba-tehly': ((480, 720, 856), (856, 1070), '50% 42%'),
    'zasoba-porfix': ((480, 720, 900), (900, 1125), '50% 56%'),
    'zasoba-stadreko': ((480, 720, 900), (900, 1125), '50% 45%'),
    'zasoba-rezivo': ((480, 720, 900), (900, 1125), '50% 52%'),
    'pas-dvor': ((1280, 1920), (1848, 1040), '20% 55%'),
    'dvor-predajna': ((800, 1200), (1200, 800), '28% 55%'),
}
FOTO_SIZES = '(max-width:700px) calc(100vw - 36px), (max-width:1000px) 40vw, 520px'
# Fotky od majiteľa (e-mail 8./9. 11. 2026, snímky ~1320 px upravené vzhľadom Svetlé ráno; zápis majitel/podklady/assets/ZAPIS.md):
# img/predajna/<názov>-<šírka>.avif|webp, šírky 480/720/960/1290 (1290 ≈ 1:1 so zdrojom) a 1720 (zväčšenie 1,33×, len na celú
# šírku okna); zvislé výrezy -t- pre telefón. Výrezy (object-position) držia tovar a predajňu v zábere. Úvodná fotka 11 je
# provizórna, kým majiteľ nepotvrdí „fotku číslo 5“ (hárok majitel/podklady/fotky-cislovane.jpg). Dve autá (10) sú len
# v Doprave a Službách, nie na úvode.
PREDAJNA_POS = {'01-predajna-naradie': '50% 50%', '02-tvarnice-obloha': '50% 55%', '03-baumit-sklad': '50% 55%', '04-ytong-porfix': '55% 50%',
                '05-hala-vozik': '50% 55%', '06-regal-profily': '50% 45%', '07-univer-bau-sklad': '50% 55%', '08-predajna-pult': '50% 45%',
                '09-tabula-ulica': '58% 45%', '10-auta-firmy': '50% 55%', '11-tvarnice-porfix-cesta': '50% 55%', '12-predajna-regaly': '50% 50%',
                '13-dlazba-sklad': '50% 60%'}
PREDAJNA_ALT = {   # opis toho, čo je na fotke (STYL §10); značky len tie, ktoré sú na obaloch čitateľné
    '01-predajna-naradie': 'Predajňa Stavebnín Richtárik zvnútra: náradie, rezné kotúče a vedrá na regáloch',
    '02-tvarnice-obloha': 'Palety betónových tvárnic v areáli predajne Stavebnín Richtárik pod modrou oblohou',
    '03-baumit-sklad': 'Palety omietok a mált Baumit v sklade predajne',
    '04-ytong-porfix': 'Palety pórobetónu Ytong a Porfix v areáli predajne v Nitre',
    '05-hala-vozik': 'Krytá hala s vrecovanými zmesami a vysokozdvižným vozíkom',
    '06-regal-profily': 'Regál s oceľovými profilmi v areáli predajne',
    '07-univer-bau-sklad': 'Palety lepidiel a omietok Univer Bau v sklade predajne',
    '08-predajna-pult': 'Predajňa Stavebnín Richtárik s pultom a regálmi, nad vchodom tabuľa Richtárik Stavebniny',
    '09-tabula-ulica': 'Tabuľa Stavebniny Richtárik pri ceste pred predajňou v Nitre – Horných Krškanoch',
    '10-auta-firmy': 'Dve nákladné autá Stavebnín Richtárik s nápisom firmy, jedno s mechanickou rukou',
    '11-tvarnice-porfix-cesta': 'Predajňa Stavebnín Richtárik v Nitre: rad paliet betónových tvárnic a materiál v červenej fólii pri ceste k predajni',
    '12-predajna-regaly': 'Predajňa zvnútra: lopaty, násady a náradie na regáloch',
    '13-dlazba-sklad': 'Palety betónovej dlažby v areáli predajne, v pozadí sklad',
}


def predajna_sirky(meno):
    """Existujúce šírky fotky z img/predajna (podľa súborov, nie podľa zoznamu)."""
    z = os.path.join(ROOT, 'img', 'predajna')
    return sorted(int(m.group(1)) for f in os.listdir(z) for m in [re.fullmatch(re.escape(meno) + r'-(\d+)\.webp', f)] if m)


def predajna_picture(pre, meno, sizes, alt=None, lazy=True, max_sirka=1290, pos=None, cls='', fetch=False):
    """<picture> fotky od majiteľa: AVIF a WebP srcset do max_sirka, src najväčšia WebP, width a height zo súboru."""
    sir = [s for s in predajna_sirky(meno) if s <= max_sirka] or predajna_sirky(meno)[:1]
    w, h = webp_rozmer(os.path.join(ROOT, f'img/predajna/{meno}-{sir[-1]}.webp'))
    ss = lambda ext: ', '.join(f'{pre}img/predajna/{meno}-{s}.{ext} {s}w' for s in sir)
    a = PREDAJNA_ALT[meno] if alt is None else alt
    p = pos or PREDAJNA_POS.get(meno, '50% 50%')
    extra = ' fetchpriority="high"' if fetch else (' loading="lazy" decoding="async"' if lazy else ' decoding="async"')
    return (f'<picture{" class=" + chr(34) + cls + chr(34) if cls else ""}><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<img src="{pre}img/predajna/{meno}-{sir[-1]}.webp" srcset="{ss("webp")}" sizes="{sizes}" width="{w}" height="{h}" alt="{html.escape(a, quote=True)}" style="object-position:{p}"{extra}></picture>')
# Fotka hlavičky podľa stránky (prednosť pred head_img volajúceho): fotky od majiteľa (img/predajna) pri prehľadových stránkach,
# Kontakte, O nás, Službách a Doprave a pri kategóriách s tým istým tovarom, skutočný tovar z img/uvod pri tehlách, Porfixe,
# dlažbe a rezive; ostatné akcie a novinky
# fotka kategórie tovaru (img/hd). Leták je bez fotky.
HLAVICKA_FOTO = {
    'katalog/index.html': 'predajna:11-tvarnice-porfix-cesta', 'akcie/index.html': 'predajna:04-ytong-porfix', 'galeria/index.html': 'predajna:02-tvarnice-obloha',
    'kontakt.html': 'predajna:13-dlazba-sklad', 'o-nas.html': 'predajna:08-predajna-pult', 'sluzby.html': 'predajna:10-auta-firmy',
    'katalog/sypke-zmesy.html': 'predajna:03-baumit-sklad', 'katalog/sypke-zmesy/baumit.html': 'predajna:03-baumit-sklad',
    'katalog/murovaci-material/ytong.html': 'predajna:04-ytong-porfix', 'akcie/ytong.html': 'predajna:04-ytong-porfix',
    'katalog/fasadny-system.html': 'predajna:07-univer-bau-sklad', 'akcie/sakret.html': 'predajna:07-univer-bau-sklad',
    'katalog/hutny-material.html': 'predajna:06-regal-profily', 'katalog/sadrokartonovy-zateplovaci-system.html': 'predajna:06-regal-profily',
    'katalog/stavebne-naradie-doplnky.html': 'predajna:12-predajna-regaly', 'akcie/stavebne-naradie.html': 'predajna:01-predajna-naradie',
    'akcie/cement-325-r.html': 'predajna:05-hala-vozik',
    'katalog/murovaci-material.html': 'uvod:zasoba-tehly', 'katalog/murovaci-material/pezinske-tehelne.html': 'uvod:zasoba-tehly',
    'katalog/murovaci-material/porfix.html': 'uvod:zasoba-porfix', 'katalog/dlazby.html': 'uvod:zasoba-stadreko',
    'katalog/stavebne-rezivo.html': 'uvod:zasoba-rezivo',
    'akcie/porfix.html': 'uvod:zasoba-porfix', 'akcie/pezinska-tehla-termobrik.html': 'uvod:zasoba-tehly',
    'akcie/dlazby-ploty-stadreko.html': 'uvod:zasoba-stadreko', 'akcie/stavebne-rezivo.html': 'uvod:zasoba-rezivo',
    'akcie/komin-qatro.html': 'komin', 'akcie/krytina-blachotrapez.html': 'strecha', 'akcie/okna-schody-fakro.html': 'okno-strecha',
    'akcie/stresne-okna-rooflite.html': 'okno-strecha',
    'akcie/sadrokartonovy-zateplovaci-system.html': 'sadrokarton', 'akcie/betonove-tvarnice.html': 'tehla',
    'akcie/nobasil.html': 'izolacia',
    'novinky/index.html': 'zahrada', 'novinky/betonove-vyrobky.html': 'tehla', 'novinky/dekoracne-kamene.html': 'dlazba',
    'novinky/topstone-oprava-starych-chodnikov.html': 'dlazba', 'novinky/delap-ohybny-kamenny-obklad.html': 'fasada',
    'novinky/ekostyren.html': 'beton', 'novinky/garaze-zahradne-domceky.html': 'hutny',
    'novinky/magic-floor-vynilova-podlaha.html': 'sadrokarton', 'novinky/vyrobky-z-plastu.html': 'zahrada',
    'letak.html': None, 'caste-otazky.html': None, 'doprava.html': 'predajna:10-auta-firmy',
    # strešné okná: svetlá fotka strešného okna na streche (pôvodná fotka okien bola z 80 % tmavé drevo)
    'katalog/stresne-okna.html': 'okno-strecha', 'katalog/stresne-okna/fakro.html': 'okno-strecha',
    'katalog/stresne-okna/fakro/fakro-schody-vylezy.html': 'okno-strecha',
}


# Telefón (do 480 px): rám fotky je celá šírka obsahu × 230 px, preto dostane výrez 720 × 468 (zdroj/hlavicky.sh) namiesto
# celej fotky na výšku. Menej bajtov pred LCP na pomalej sieti; 720 px je aspoň 1,6-násobok šírky rámu (README).
FOTO_TEL = '(max-width:480px)'


def telefon_zdroje(pre, druh, meno):
    """<source> s výrezom pre telefón, ak výrez existuje (img/uvod/hlavicka/, img/hd/hlavicka/)."""
    zlozka = {'uvod': 'img/uvod/hlavicka', 'hd': 'img/hd/hlavicka'}.get(druh)
    if not zlozka or not os.path.exists(os.path.join(ROOT, f'{zlozka}/{meno}-720.avif')): return ''
    return ''.join(f'<source media="{FOTO_TEL}" type="image/{ext}" srcset="{pre}{zlozka}/{meno}-720.{ext} 720w" sizes="calc(100vw - 36px)">'
                   for ext in ('avif', 'webp'))


def foto_hlavicky(path, spec):
    """<figure> s fotkou hlavičky. spec: 'predajna:<názov>' (fotka od majiteľa, img/predajna), 'uvod:<názov>' (skutočná fotka
    areálu predajne, img/uvod), 'p:<číslo>' (fotka z pôvodného webu), inak '<názov>' alebo 'hd:<názov>' (img/hd, -1200 so srcset 2400 px)."""
    pre = prefix(path)
    druh, meno = spec.split(':', 1) if ':' in spec else ('hd', spec)
    tel = telefon_zdroje(pre, druh, meno)
    if druh == 'predajna':
        img = predajna_picture(pre, meno, FOTO_SIZES, alt='', lazy=False, fetch=True)
    elif druh == 'uvod':
        sir, (w, h), pos = UVOD_FOTO[meno]
        ss = lambda ext: ', '.join(f'{pre}img/uvod/{meno}-{s}.{ext} {w if s == sir[-1] else s}w' for s in sir)
        img = (f'<picture>{tel}<source type="image/avif" srcset="{ss("avif")}" sizes="{FOTO_SIZES}">'
               f'<img src="{pre}img/uvod/{meno}-{sir[-1]}.webp" srcset="{ss("webp")}" sizes="{FOTO_SIZES}" width="{w}" height="{h}" alt="" style="object-position:{pos}" fetchpriority="high"></picture>')
    elif druh == 'p':
        w, h = IMG_SIZES[meno]
        img = f'<img src="{pre}img/p/{meno}.webp" width="{w}" height="{h}" alt="" fetchpriority="high">'
    else:
        if os.path.exists(os.path.join(ROOT, f'img/hd/{meno}-1200.webp')):
            w, h = webp_rozmer(os.path.join(ROOT, f'img/hd/{meno}-1200.webp'))
            img = f'<img src="{pre}img/hd/{meno}-1200.webp" srcset="{pre}img/hd/{meno}-1200.webp 1200w, {pre}img/hd/{meno}.webp 2400w" sizes="{FOTO_SIZES}" width="{w}" height="{h}" alt="" fetchpriority="high">'
        else:
            w, h = webp_rozmer(os.path.join(ROOT, f'img/hd/{meno}.webp'))
            img = f'<img src="{pre}img/hd/{meno}.webp" width="{w}" height="{h}" alt="" fetchpriority="high">'
        if tel: img = f'<picture>{tel}{img}</picture>'
    return f'<figure class="ph-foto">{img}</figure>'


def prehliadka_blok(pre, foto, sizes='(max-width:700px) 100vw, 1184px'):
    """Komponent „Prehliadka predajne 360°“ (site.js, site.css .p360): fotka predajne od majiteľa ako náhľad, tlačidlo skryté
    (hidden), kým ho site.js neodkryje podľa zdroja v data-panorama-src (rám Google Máp) alebo data-panorama-obrazok (vlastná
    panoráma, zdroj/panorama.js); bez JS ostáva fotka s vetou z <noscript>. Rám alebo panoráma sa vytvoria až po kliknutí (nič sa
    nenačíta vopred), ostanú v stránke (telefón 60 vh, počítač 16:9), tlačidlá Celá obrazovka a Zavrieť, žiadny odkaz von. Ten istý
    blok je na úvode (ručne, kontrola_uvodu overí zhodu s fotkou 13) a na Kontakte (fotka 02). Okno nemá triedu rvimg (pásy
    okna kina viazané na posun by po skoku odkazom #prehliadka ostali na fotke, kým sa neposunie; fotka tu stojí)."""
    src, obr = PANORAMA['src'], PANORAMA['obrazok']
    if src: veta = 'Prehliadka sa načíta z Google Máp až po kliknutí; dovtedy sa Googlu nič neodosiela (ochrana údajov). Otáčajte ťahaním prstom alebo myšou.'
    elif obr: veta = 'Panorámu otáčajte ťahaním prstom alebo myšou, na počítači aj šípkami; dva prsty alebo klávesy + a − priblížia.'
    else: veta = ''
    skus = P360_SKUSOBNA and bool(obr)
    if skus: veta = 'Ukážka: skúšobný obraz, nie záber predajne. ' + veta
    return (f'<figure class="p360" id="prehliadka" data-panorama-src="{html.escape(src, quote=True)}" data-panorama-obrazok="{(pre + obr) if obr else ""}"{" data-panorama-skusobna" if skus else ""}>'
            f'<div class="p360-okno">{predajna_picture(pre, foto, sizes, max_sirka=1720)}<span class="p360-znak" aria-hidden="true">{"360° · ukážka" if skus else "360°"}</span>'
            f'<div class="p360-stred"><button class="btn primary p360-start" type="button" hidden>{"Vyskúšať prehliadku 360°" if skus else "Prezrieť predajňu v 360°"}</button>'
            f'<noscript><p class="p360-nojs">Prehliadka potrebuje zapnutý JavaScript.</p></noscript></div>'
            f'<div class="p360-lista" hidden><button class="p360-cela" type="button" aria-pressed="false">Celá obrazovka</button>'
            f'<button class="p360-zavri" type="button">Zavrieť prehliadku</button></div></div>'
            f'{f"<figcaption class=p360-info>{veta}</figcaption>" if veta else ""}</figure>')


def prehliadka_sekcia(pre, foto):
    """Nadpis a komponent prehliadky (Kontakt; na úvode je nadpis v sekcii úvodu ručne)."""
    return (f'<!--p360--><div class="p360-sek"><div class="head"><div class="eyebrow">Predajňa</div><h2><span class="dr"><span>Prezrite si predajňu v 360°</span></span></h2>'
            f'<p class="lede">{P360_LEDE}</p></div>{prehliadka_blok(pre, foto)}</div><!--/p360-->')


def panorama_js():
    """Prehliadač panorámy zdroj/panorama.js zmenšený do assets/panorama.js (modul, site.js ho importuje až po kliknutí)."""
    s = zmensi_js(open(os.path.join(ROOT, 'zdroj', 'panorama.js'), encoding='utf-8').read())
    open(os.path.join(OUT, 'assets', 'panorama.js'), 'w', encoding='utf-8').write(s + '\n')
    return len(s)


def page(path, title, body, crumbs=None, extra_head='', head=None, home=False, head_img=None, druh=''):
    """Šablóna stránky. H1, titulok a popis pre vyhľadávače sú z texty.STRANKY; kde stránka nie je, H1 ostáva od
    volajúceho a popis zloží generátor texty.popis podľa druhu stránky (kategoria, znacka, akcia, novinka).
    Hlavička stránky (omrvinky, H1, fotka) je prvá časť <main>."""
    pre = prefix(path)
    st = texty.stranka(path)
    if head and st.get('h1'): head = (head[0], st['h1'], head[2])
    def _nav_a(p, t):
        cur = ' aria-current="page"' if (path == p or (p != "index.html" and path.startswith(p.split("/")[0] + "/"))) else ''
        # podčiarknutie aktívnej položky je samostatný prvok: pri prechode medzi stránkami sa presunie k novej položke
        return f'<a href="{rel(path, p)}"{cur}>{t}<span class="nav-ciara" aria-hidden="true"></span></a>' if cur else f'<a href="{rel(path, p)}">{t}</a>'
    nav = ''.join(_nav_a(p, t) for p, t in NAV)
    dnav = ''.join(f'<a href="{rel(path, p)}">{t}</a>' for p, t in NAV)
    crumb = ''
    if crumbs:
        items = ''.join(f'<li><a href="{rel(path, p)}">{t}</a></li>' if p else f'<li aria-current="page">{t}</li>' for p, t in crumbs)
        crumb = f'<nav class="crumbs" aria-label="Navigačná cesta"><ol>{items}</ol></nav>'
    band = ''
    if head:
        kicker, h1, lede = head
        head_img = HLAVICKA_FOTO.get(path, head_img)
        foto = foto_hlavicky(path, head_img) if head_img else ''
        # H1 v drážke (span.dr, RP2-04): na telefóne po prechode vyjde zdola (site.css, Pohybový systém časť 2), text sa nemení
        band = f'<section class="page-head{" has-img" if foto else ""}"><div class="wrap">{crumb}<div class="ph-in"><div class="head"><div class="eyebrow">{kicker}</div><h1><span class="dr"><span>{h1}</span></span></h1>{f"<p class=lede>{lede}</p>" if lede else ""}</div>{foto}</div></div></section>'
    elif crumb:
        band = f'<section class="page-head"><div class="wrap">{crumb}</div></section>'
    crumb = band
    titul = html.escape(texty.titulok(path, title))
    d = html.escape(texty.popis(path, head[1] if head else title, druh, head[2] if head and head[2] else ''))
    return f'''<!doctype html>
<html lang="sk" data-tema="{TEMA}" data-asistent="ukazka">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{titul}</title>
<meta name="description" content="{d}">
<meta name="theme-color" content="{FARBA}">
<meta property="og:title" content="{titul}">
<meta property="og:description" content="{d}">
<link rel="canonical" href="{url_abs(path)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="sk_SK">
<meta property="og:site_name" content="Stavebniny Richtárik">
<meta property="og:url" content="{url_abs(path)}">
<meta property="og:image" content="{DOMENA}{OG_IMG[0]}">
<meta property="og:image:width" content="{OG_IMG[1]}">
<meta property="og:image:height" content="{OG_IMG[2]}">
<meta property="og:image:alt" content="{OG_ALT}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{pre}img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="{pre}img/ikona-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="{pre}img/apple-touch-icon.png">
<link rel="manifest" href="{pre}manifest.webmanifest">
<link rel="preload" href="{pre}assets/fonts/BarlowCondensed-800-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{pre}assets/fonts/BarlowCondensed-800-latin.woff2" as="font" type="font/woff2" crossorigin>
{TEMA_HEAD}<link rel="stylesheet" href="{pre}assets/site.css">
{PRECHODY_HEAD}{breadcrumb_ld(path, crumbs)}{extra_head}
</head>
<body{' class="home"' if home else ''}>
<a class="skip" href="#obsah">Preskočiť na obsah</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="{pre}index.html" aria-label="Stavebniny Richtárik, úvod"><picture><source type="image/webp" srcset="{pre}img/logo-rs-360.webp 360w, {pre}img/logo-rs-720.webp 720w" sizes="99px"><img class="lg-znak" src="{pre}img/logo-rs-360.png" srcset="{pre}img/logo-rs-360.png 360w, {pre}img/logo-rs-720.png 720w" sizes="99px" width="360" height="175" alt=""></picture><span class="lg-nazov"><span>Stavebniny</span><span>Richtárik</span></span></a>
    <nav class="nav" aria-label="Hlavné menu">{nav}</nav>
    <a class="tel" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a>
    <button class="menu-btn" type="button" aria-label="Otvoriť menu" aria-expanded="false" aria-controls="drawer"><span></span></button>
  </div>
</header>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu" inert>
  <button class="close" type="button" aria-label="Zavrieť menu">&times;</button>
  <nav aria-label="Menu">{dnav}</nav>
  <div class="dtel"><a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a></div>
</div>
<main id="obsah">
{crumb}{body}
</main>
<section class="cta-pas">
  <div class="wrap">
    <div><div class="eyebrow light">Cenová ponuka zadarmo</div><h2><span class="dr"><span>Pošlite nám projekt alebo zoznam materiálu</span></span></h2><p>Spočítame spotrebu, pripravíme cenovú ponuku a dohodneme dopravu na stavbu.</p></div>
    <div class="cta"><a class="btn primary" href="mailto:{FIRMA['email']}?subject=Cenov%C3%A1%20ponuka">Poslať dopyt e-mailom</a><a class="btn light" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
  </div>
</section>
<footer>
  <div class="wrap grid">
    <div class="f-firma"><img src="{pre}img/logo-rs-360.png" alt="Stavebniny Richtárik" width="360" height="175" class="flogo" loading="lazy" decoding="async"><p>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</p><p>IČO {FIRMA['ico']} · DIČ {FIRMA['dic']}</p></div>
    <details class="f-zb" open><summary>Stránky</summary>{dnav}<a href="{rel(path, 'caste-otazky.html')}">Časté otázky</a></details>
    <details class="f-zb" open><summary>Katalóg</summary>{''.join(f'<a href="{rel(path, "katalog/" + nice_slug(k[0]) + ".html")}">{k[1]}</a>' for k in KATEGORIE[:8])}<a href="{rel(path, 'katalog/index.html')}">Celý katalóg</a></details>
    <div class="f-kontakt"><h3>Kontakt</h3><a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a class="mail" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a><p>Po – Pi 7:00 – 16:00<br>So 7:00 – 12:00</p></div>
  </div>
  <div class="wrap bottom"><span>© <span id="rok">2026</span> {FIRMA['majitel']}, Nitra</span><a href="{rel(path, 'letak.html')}">Akciový leták</a><a href="{rel(path, 'asistent/ochrana-udajov.html')}" data-asistent-odkaz>Ochrana údajov</a><a href="{FIZOSK}" target="_blank" rel="noopener">Stavebná firma FIZO SK – www.fizosk.sk</a></div>
</footer>
<div class="mbar" aria-label="Rýchly kontakt"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať</a><a class="btn ghost" href="{rel(path, 'kontakt.html')}">Cenová ponuka</a></div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Fotografia" hidden><button class="lb-x" type="button" aria-label="Zavrieť">&times;</button></div>
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
                def _li(c):
                    vnor = ''
                    if current_slug.startswith(c + '__'):   # stránka 3. úrovne: jej súrodenci pod rodičom, rodič len zvýraznený
                        vnor = '<ul>' + ''.join('<li><a href="%s"%s>%s</a></li>' % (rel(path, PAGES[g]), CUR if g == current_slug else '', nice_title(SRC[g]["title"])) for g in children(c)) + '</ul>'
                    return '<li%s><a href="%s"%s>%s</a>%s</li>' % (' class="act"' if vnor else '', rel(path, PAGES[c]), CUR if c == current_slug else '', nice_title(SRC[c]["title"]), vnor)
                subs = '<ul>' + ''.join(_li(c) for c in ch) + '</ul>'
        items += '<li%s><a href="%s"%s>%s</a>%s</li>' % (' class="act"' if act else '', rel(path, p), CUR if current_slug == slug else '', k[1], subs)
    return f'<aside class="side"><div class="side-in"><h2>Katalóg</h2><ul class="kat">{items}</ul><a class="btn ghost small" href="{rel(path, "katalog/index.html")}">Všetky kategórie</a></div></aside>'


ZAPISANE = set()   # vygenerované stránky HTML (výpis na konci behu)


def write(path, content):
    if path == 'index.html':  # poistka: úvod sa udržiava ručne (README, časť Úvod), generátor ho nikdy neprepíše
        raise SystemExit('build.py: index.html (úvod) sa negeneruje, upravuje sa ručne')
    if path.endswith(('.html', '.json')): content = opravy(content)
    if path.endswith('.html'): content = rozmery(drazky(nadpisy(texty.uprav(content))), path); ZAPISANE.add(path)
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(content)


# ---------- jednotlivé typy stránok ----------
# Dlaždice kategórií (úvod aj Katalóg): fotka hore, svetlý popisný pás pod ňou (bez tmavého prechodu). Rozloženie „bento“:
# prvá veľká (2×2), šiesta a jedenásta široké (2×1) – 15 dlaždíc vyplní 4 stĺpce bez diery. Murovací materiál, rezivo
# a dlažby majú skutočné fotky z dvora (img/uvod, AVIF + WebP), ostatné ilustračnú fotku kategórie (900 px, veľká a široká
# dlaždica 1200 px z img/hd, aby bola ostrá aj na počítači s DPR 2).
DLAZDICA_UVOD = {'murovaci-material': 'zasoba-tehly', 'stavebne-rezivo': 'zasoba-rezivo', 'dlazby': 'zasoba-stadreko'}
# fotky od majiteľa (img/predajna) na dlaždiciach kategórií, kde ukazujú ten istý tovar; ostatné kategórie čakajú na fotky
# výrobcov s povolením (majitel/dodavatelia/ZAPIS.md), dovtedy ilustračná fotka img/hd
DLAZDICA_PREDAJNA = {'sypke-zmesy': '03-baumit-sklad', 'hutny-material': '06-regal-profily', 'sadrokartonovy---zateplovaci-system': '06-regal-profily',
                     'fasadny-system': '07-univer-bau-sklad', 'stavebne-naradie-doplnky': '12-predajna-regaly'}


def dlazdice(path, cisla=False):
    """Dlaždice kategórií (úvod ručne aj Katalóg). Skutočné fotky z areálu predajne sú v <picture>: AVIF 720 (src aj prvý zdroj),
    WebP 720 pre prehliadač bez AVIF; ostatné kategórie majú ilustračnú fotku (img/hd, 1200 px pri veľkej a širokej)."""
    pre = prefix(path); out = ''
    for n, k in enumerate(KATEGORIE):
        cls = ' big' if n == 0 else (' wide' if n in (5, 10) else '')
        if k[0] in DLAZDICA_PREDAJNA:
            img = predajna_picture(pre, DLAZDICA_PREDAJNA[k[0]], '(max-width:720px) 50vw, (max-width:1100px) 33vw, 300px' if not cls else '(max-width:720px) 100vw, (max-width:1100px) 66vw, 620px', alt='', max_sirka=960 if cls else 720)
        elif k[0] in DLAZDICA_UVOD:
            m = DLAZDICA_UVOD[k[0]]; _, (w, h), pos = UVOD_FOTO[m]
            img = (f'<picture><source type="image/avif" srcset="{pre}img/uvod/{m}-720.avif"><source type="image/webp" srcset="{pre}img/uvod/{m}-720.webp">'
                   f'<img src="{pre}img/uvod/{m}-720.avif" alt="" loading="lazy" decoding="async" width="720" height="{round(720 * h / w)}" style="object-position:{pos}"></picture>')
        else:
            hd = f'img/hd/{k[4]}-1200.webp'
            if cls and os.path.exists(os.path.join(ROOT, hd)):
                w, h = webp_rozmer(os.path.join(ROOT, hd))
                img = f'<img src="{pre}{hd}" alt="" loading="lazy" decoding="async" width="{w}" height="{h}">'
            else:
                img = f'<img src="{pre}img/{k[4]}.webp" alt="" loading="lazy" decoding="async" width="900" height="600">'
        num = f'<span class="n">{n + 1:02d}</span>' if cisla else ''
        out += f'<a class="cat{cls}" href="{rel(path, "katalog/" + nice_slug(k[0]) + ".html")}"><div class="ph">{img}</div>{num}<div class="tx"><h3>{k[1]}</h3><p>{k[2]}</p><span class="brands">{k[3]}</span></div></a>'
    return out


def build_katalog_index():
    path = 'katalog/index.html'
    cards = dlazdice(path)
    body = f'''<section class="sec"><div class="wrap">
<div class="search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Hľadajte: cement, Ytong, škridla…" autocomplete="off" aria-controls="res" aria-expanded="false" aria-describedby="res-stav"><div class="res" id="res" role="region" aria-label="Výsledky hľadania" hidden></div><p class="vh" id="res-stav" role="status" aria-live="polite"></p></div>
<div class="cats">{cards}</div>
<div class="txt rv" style="margin-top:32px"><p>{SORTIMENT_UVOD}</p></div>
<div class="sort-note"><p>Nenašli ste, čo hľadáte? Zavolajte, poradíme vám.</p><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
</div></section>'''
    write(path, page(path, 'Katalóg stavebného materiálu', body, [('index.html', 'Úvod'), (None, 'Katalóg')], head=('Katalóg', 'Katalóg stavebného materiálu', '15 kategórií a viac ako 40 značiek popredných slovenských aj svetových výrobcov. Vyberte kategóriu alebo hľadajte podľa výrobku alebo značky.'), head_img='uvod:pas-dvor'))


def karta_podstranky(c):
    """Karta „Podrobnejšie“: názov = H1 cieľovej stránky (text odkazu hovorí, kam vedie), text = prvá veta jej popisu
    z texty.STRANKY (overené fakty, bez reklamných viet výrobcu zo zdroja). Úvod vety pred dvojbodkou, ktorý len
    opakuje názov („Baumit: …“), sa vynechá. Stránka bez ručného popisu: začiatok textu zo zdroja (snippet)."""
    st = texty.stranka(PAGES[c])
    nazov = st.get('h1') or nice_title(SRC[c]['title'])
    if not st.get('d'): return nazov, snippet(c)
    veta = re.split(r'(?<=[.])\s+(?=[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ])', st['d'])[0]
    m = re.match(r'([^:]{2,60}):\s+(.+)$', veta)
    if m and all(w.lower() in nazov.lower() for w in re.findall(r'[^\W\d_]+', m.group(1))):
        veta = m.group(2)[:1].upper() + m.group(2)[1:]
    return nazov, veta


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
        subs = '<div class="subs"><h2>Podrobnejšie</h2><div class="sub-grid">' + ''.join(f'<a class="sub rv" href="{rel(path, PAGES[c])}"><b>{html.escape(n)}</b> <span>{html.escape(t)}</span></a>' for c in ch for n, t in [karta_podstranky(c)]) + '</div></div>'
    lede = HOOKY.get(parts[0], cat[2]) if len(parts) == 1 else None
    if len(parts) == 1 and cont.strip():
        cont = '<h2 class="sh rv"><span>Značky, ktoré máme v ponuke</span></h2>' + cont
    if len(parts) == 1 and parts[0] in PONUKA_UVOD:
        cont += f'<h2 class="sh rv"><span>{PONUKA_NADPIS}</span></h2><div class="txt rv"><p>{html.escape(PONUKA_UVOD[parts[0]])}</p></div>'
    body = f'''<section class="sec kat-page"><div class="wrap two">
{sidebar(path, slug)}
<div class="main">
<div class="content">{cont}</div>
{subs}{v_akcii(path)}{novinky_kategorie(path, parts[0] if len(parts) == 1 else '')}
<div class="kat-cta"><p>Potrebujete cenu na konkrétne množstvo? Zavolajte alebo napíšte, cenovú ponuku pripravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject={quote(title)}">Napísať e-mail</a></div></div>
</div></div></section>'''
    write(path, page(path, title, body, crumbs, head=('Katalóg' if len(parts) == 1 else cat[1], title, lede), head_img=cat[4], druh='kategoria' if len(parts) == 1 else 'znacka'))


def build_akcie():
    path = 'akcie/index.html'
    cards = ''
    for slug, tag, h, p in AKCIE_KARTY:
        s = slug if '__' in slug else 'akcie__' + slug
        href = rel(path, PAGES[s]) if s in PAGES else None
        more = AKCIE_ODKAZ.get(s, 'Leták akcie')
        thumb = letak_thumb(s, path) if s.startswith('akcie__') else ''
        cards += f'<a class="deal" href="{href}">{thumb}<span class="tag">{tag}</span><h3>{h}</h3><p>{p}</p><span class="more">{more}</span></a>' if href else f'<div class="deal"><span class="tag">{tag}</span><h3>{h}</h3><p>{p}</p></div>'
    letaky = ''.join(f'<a class="pdf" href="{rel(path, f)}" target="_blank" rel="noopener"><span>{html.escape(t)}</span></a>' for f, t in AKCIE_LETAKY)
    body = f'''<section class="sec akcie-page"><div class="wrap">
<div class="cta" style="margin-bottom:28px"><a class="btn primary" href="{rel(path, CENNIK_PDF)}" target="_blank" rel="noopener">{CENNIK_TEXT}</a><a class="btn ghost" href="{rel(path, 'letak.html')}">Akciový leták</a></div>
<div class="deals">{cards}</div>
<div class="pdfs rv" style="margin-top:28px">{letaky}</div>
</div></section>'''
    write(path, page(path, 'Akcie', body, [('index.html', 'Úvod'), (None, 'Akcie')], head=('Akcie', 'Aktuálne akcie na vybrané druhy výrobkov', ZLAVA_AKCIE), head_img='uvod:pas-dvor'))
    karty = {s: (tag, h, p) for s, tag, h, p in AKCIE_KARTY}
    for s in children('akcie'):
        p = PAGES[s]; t = nice_title(SRC[s]['title'])
        k = s.split('__')[1]
        tag, h, popis = karty.get(k, ('Akcia', t, ''))
        pr = parser(p); bl = pr.blocks(SRC[s]['html'])
        imgs = [x for kind, v in bl if kind == 'images' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['imgs']]
        pdfs = [x for kind, v in bl if kind == 'pdfs' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['pdfs']]
        pdfs = [x for x in pdfs if os.path.basename(x[0]) not in PDF_MRTVE]
        pdfs = letaky_akcie(pdfs, h)
        letak = ''
        if imgs:
            i, alt = imgs[0]
            letak = f'<figure class="letak rv"><a href="{pr._src(i)}" data-lb="1" data-cap="{html.escape(h)}"><img src="{pr._src(i)}" alt="Leták akcie {html.escape(h)}" width="{IMG_SIZES.get(i, (0, 0))[0]}" height="{IMG_SIZES.get(i, (0, 0))[1]}"></a><figcaption>Leták akcie. Kliknutím zväčšíte.</figcaption></figure>'
        others = ''.join(f'<a href="{rel(p, PAGES["akcie__" + s2])}"><span class="tag">{tag2}</span><b>{h2}</b></a>' for s2, tag2, h2, _ in AKCIE_KARTY if s2 != k and '__' not in s2 and 'akcie__' + s2 in PAGES)
        body = f'''<section class="sec akcia"><div class="wrap two">
<div class="main">
<div class="akcia-tag"><span class="tag">{tag}</span><span>{ZLAVA_AKCIE}</span></div>
{v_katalogu(p, k)}{cennik_akcie(p, k)}{letak}
<div class="pdfs rv">{''.join(pr._pdf(hh, tt) for hh, tt in pdfs)}<a class="pdf" href="{rel(p, CENNIK_PDF)}" target="_blank" rel="noopener"><span>{CENNIK_TEXT}</span></a></div>
<div class="kat-cta rv"><p>Potrebujete akciovú cenu na konkrétne množstvo? Zavolajte alebo napíšte, cenovú ponuku pripravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject={quote('Akcia ' + h)}">Napísať e-mail</a></div></div>
</div>
<aside class="side"><div class="side-in"><h2>Ďalšie akcie</h2><div class="others">{others}</div><a class="btn ghost small" href="{rel(p, 'akcie/index.html')}">Všetky akcie</a></div></aside>
</div></section>'''
        write(p, page(p, h + ' v akcii', body, [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), (None, h)], head=('Akcia', h, popis), head_img=None, druh='akcia'))


def build_novinky():
    path = 'novinky/index.html'
    items = ''
    for s in children('novinky'):
        k = s.split('__')[1]; t = nice_title(SRC[s]['title'])
        first = [i for i, e in SRC[s]['imgs'] if i in IMG_SIZES and IMG_SIZES[i][0] >= 200]
        img = f'<div class="ph"><img src="{rel(path, "img/p/" + first[0] + ".webp")}" alt="" loading="lazy"></div>' if first else nov_tile(k)
        items += f'<a class="nov" href="{rel(path, PAGES[s])}">{img}<div class="tx"><h3>{t}</h3><p>{NOVINKY_POPIS.get(k, "")}</p></div></a>'
    body = f'''<section class="sec"><div class="wrap">
<div class="novs grid-page">{items}</div>
</div></section>'''
    write(path, page(path, 'Novinky', body, [('index.html', 'Úvod'), (None, 'Novinky')], head=('Novinky', 'Novinky v sortimente', 'Dekoračné kamene, ohybný kamenný obklad Delap, plnivo Ekostyrén, montované garáže, vinylové podlahy a výrobky z recyklovaného plastu.'), head_img=None))
    for s in children('novinky'):
        p = PAGES[s]; t = nice_title(SRC[s]['title']); k = s.split('__')[1]
        cont = cennik_kamene(s) if k == 'dekoracne-kamene' else lb_fotky(content(s, p), t)
        body = f'''<section class="sec novinka-page"><div class="wrap">
<div class="content">{cont}</div>
<p class="back"><a href="{rel(p, 'novinky/index.html')}">Všetky novinky</a></p>
</div></section>'''
        write(p, page(p, t, body, [('index.html', 'Úvod'), ('novinky/index.html', 'Novinky'), (None, t)], head=('Novinka', t, NOVINKY_POPIS.get(k, None)), head_img=None, druh='novinka'))


def lb_fotky(t, cap=''):
    """Novinky: aj menšie fotky (pod 300 px) v obsahu sa otvoria v lightboxe (v prirodzenej veľkosti, nezväčšené);
    logá (výška do 60 px) ostávajú bez odkazu."""
    def f(m):
        img, pre, i = m.group(1), m.group(2), m.group(3)
        if i not in IMG_SIZES or IMG_SIZES[i][1] <= 60: return m.group(0)
        return f'<a href="{pre}img/p/{i}.webp" data-lb="1" data-cap="{html.escape(cap)}">{img}</a>'
    return re.sub(r'<span class="">(<img src="((?:\.\./)*)img/p/(\d+)\.webp"[^>]*>)</span>', f, t)


def kamene():
    """Ceny dekoračných kameňov z pôvodnej stránky: (názov, cena za vrece)."""
    t = text_of(SRC['novinky__dekoracne-kamene']['html']).replace('DEKORAČNÉ KAMEŇE', '')
    out = []
    for chunk in t.split('Eur/vr')[:-1]:
        m = re.search(r'([A-ZÁ-Ž][^.]*?)\s*-\s*(\d+[,.]\d{2})\s*$', chunk.strip())
        if m:
            n = re.sub(r'\s+', ' ', m.group(1)).strip(' ,').replace(' ,', ',').replace(',biely', ', biely').replace(',cierny', ', čierny')
            n = re.sub(r'(\d)cm', r'\1 cm', re.sub(r'(\d)kg', r'\1 kg', n))
            n = re.sub(r',?\s*25 kg$', '', n).strip(' ,')   # „vrece 25 kg“ je v popise pod názvom
            out.append((n, m.group(2).replace('.', ',')))
    return out


def cennik_kamene(slug):
    rows = ''.join(f'<article class="cen rv"><div><b>{html.escape(n)}</b><span>vrece 25 kg, cena s DPH</span></div><strong>{c} €</strong></article>' for n, c in kamene())
    return f'''<h2 class="sh rv"><span>Dekoračné kamene</span><small>ceny za vrece</small></h2><div class="cennik">{rows}</div>
<p class="txt rv">Z cien je už odrátaná 5 % zľava pri platbe v hotovosti.</p>'''


def nov_tile(k):
    """Dlaždica novinky bez fotky: pri kameňoch najnižšia cena, inak logo."""
    if k == 'dekoracne-kamene' and kamene():
        low = min(float(c.replace(',', '.')) for _, c in kamene())
        return f'<div class="ph price"><small>Dekoračné kamene</small><b>od {str(low).replace(".", ",")} €</b><span>za vrece 25 kg s DPH</span></div>'
    return '<div class="ph empty"></div>'


GALERIA_ALBUMY = [  # (slug zdroja, názov albumu v nadpise a v popisku fotky)
    ('fotogaleria', 'Predajňa a sklad'),
    ('fotogaleria__fotky---vystava-domexpo-nitra-2010', 'Výstava Domexpo Nitra 2010'),
    ('fotogaleria__vystava-agrokomplex-2011', 'Výstava Agrokomplex 2011'),
    ('fotogaleria__vystava-agrokomplex-2012', 'Výstava Agrokomplex 2012'),
    ('fotogaleria__vystava-gardenia-2012', 'Výstava Gardenia 2012'),
]


# Prvé sekcie galérie: fotky od majiteľa (img/predajna, 9. 11. 2026) a skutočné fotky areálu predajne (img/uvod, tie isté
# ako v strihu zásob na úvode). Majiteľ 9. 11. 2026: miesto je predajňa, nie dvor.
GALERIA_PREDAJNA = ['08-predajna-pult', '01-predajna-naradie', '12-predajna-regaly', '09-tabula-ulica', '02-tvarnice-obloha', '11-tvarnice-porfix-cesta',
                    '04-ytong-porfix', '13-dlazba-sklad', '03-baumit-sklad', '07-univer-bau-sklad', '05-hala-vozik', '06-regal-profily', '10-auta-firmy']
GALERIA_DVOR = [('dvor-predajna', 'Areál predajne Stavebniny Richtárik v Nitre s paletami TermoBRIK a Porfix'),
                ('pas-dvor', 'Palety tehál TermoBRIK a pórobetónu Porfix v areáli predajne Stavebnín Richtárik v Nitre'),
                ('zasoba-tehly', 'Palety tehál TermoBRIK v areáli predajne Stavebnín Richtárik v Nitre'),
                ('zasoba-porfix', 'Palety pórobetónu Porfix pod modrými plachtami v areáli predajne v Nitre'),
                ('zasoba-stadreko', 'Palety betónovej dlažby a obrubníkov Stadreko v areáli predajne v Nitre'),
                ('zasoba-rezivo', 'Stavebné rezivo naskladané v areáli predajne Stavebnín Richtárik v Nitre')]


def galeria_predajna(path):
    pre = prefix(path); g = ''
    sizes = '(max-width:700px) 46vw, 300px'
    for m in GALERIA_PREDAJNA:
        cap = PREDAJNA_ALT[m]
        g += f'<a href="{pre}img/predajna/{m}-1290.webp" data-lb="1" data-cap="{html.escape(cap)}">{predajna_picture(pre, m, sizes, max_sirka=720)}</a>'
    n = len(GALERIA_PREDAJNA)
    return f'<div class="album"><h2 class="sh rv"><span>Naša predajňa a sklad</span><small>{n} fotografií</small></h2><div class="galeria rv">{g}</div></div>'


def galeria_dvor(path):
    pre = prefix(path); g = ''
    sizes = '(max-width:700px) 46vw, 300px'
    for m, cap in GALERIA_DVOR:
        sir, (w, h), pos = UVOD_FOTO[m]
        nahl = [x for x in sir if x <= 800] or [sir[0]]   # náhľad: 480 a 720, 800, pri páse 1280
        ss = lambda ext: ', '.join(f'{pre}img/uvod/{m}-{x}.{ext} {x}w' for x in nahl)
        nw = nahl[-1]; nh = round(nw * h / w)
        g += (f'<a href="{pre}img/uvod/{m}-{sir[-1]}.webp" data-lb="1" data-cap="{html.escape(cap)}"><picture><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
              f'<img src="{pre}img/uvod/{m}-{nw}.webp" srcset="{ss("webp")}" sizes="{sizes}" alt="{html.escape(cap)}" loading="lazy" decoding="async" width="{nw}" height="{nh}" style="object-position:{pos}"></picture></a>')
    return f'<div class="album"><h2 class="sh rv"><span>Materiál v areáli predajne</span><small>{len(GALERIA_DVOR)} fotografií</small></h2><div class="galeria dvor rv">{g}</div></div>'


def build_galeria():
    """Galéria: najprv predajňa a sklad (hlavná fotogaléria pôvodného webu, 28 fotiek), potom výstavy. Popisok fotky
    je názov albumu (pôvodné popisky sú názvy súborov z fotoaparátu, napr. P4250213, DSCN0436)."""
    path = 'galeria/index.html'
    secs = ''
    for s, t in GALERIA_ALBUMY:
        ids = list(dict.fromkeys(re.findall(r'<a [^>]*href="[^"]*images/gallery/(\d+)\.jpg"', SRC[s]['html'])))
        ids = [i for i in ids if os.path.exists(os.path.join(ROOT, 'img/g', i + '.webp')) and os.path.exists(os.path.join(ROOT, 'img/gt', i + '.webp'))]
        g = ''
        for n, i in enumerate(ids, 1):
            w, h = webp_rozmer(os.path.join(ROOT, 'img/gt', i + '.webp'))
            g += (f'<a href="{rel(path, "img/g/" + i + ".webp")}" data-lb="1" data-cap="{html.escape(t)}">'
                  f'<img src="{rel(path, "img/gt/" + i + ".webp")}" alt="{html.escape(texty.GALERIA_ALT.get(i, t))}" loading="lazy" width="{w}" height="{h}"></a>')
        g = f'<div class="galeria rv">{g}</div>'
        n = g.count("data-lb")   # riadky mriežky pri 4 a 2 stĺpcoch: odhad výšky albumu pod prvým (content-visibility, RP2-09)
        secs += f'<div class="album" style="--r:{-(-n // 4)};--rt:{-(-n // 2)}"><h2 class="sh rv"><span>{t}</span><small>{n} fotografií</small></h2>{g}</div>'
    body = f'''<section class="sec"><div class="wrap">
{galeria_predajna(path)}
{galeria_dvor(path)}
{secs}
</div></section>'''
    write(path, page(path, 'Galéria', body, [('index.html', 'Úvod'), (None, 'Galéria')], head=('Galéria', 'Z predajne, skladu a výstav', 'Naša predajňa a sklad v Horných Krškanoch a naše stánky na výstavách Domexpo, Agrokomplex a Gardenia v Nitre.'), head_img='predajna:02-tvarnice-obloha'))


def build_simple(slug, kicker, h1, lede=None, extra='', head_img=None):
    p = PAGES[slug]; t = nice_title(SRC[slug]['title'])
    body = f'''<section class="sec {slug}-page"><div class="wrap{" narrow" if slug not in ("sluzby", "o-nas") else ""}">
<div class="content">{content(slug, p)}</div>
{extra}
</div></section>'''
    write(p, page(p, t.capitalize() if t.isupper() else t, body, None, [('index.html', 'Úvod'), (None, h1)], head=(kicker, h1, lede), head_img=head_img))


# Služby: celý text zdroja „sluzby“ (úvodná veta, zoznam služieb ako číslované položky, odsek o doprave), popisy položiek
# len z textov, ktoré na webe sú (Katalóg, výzva pred pätou, O nás a úvod pôvodného webu – zdroj „uvod“, úvod nového webu);
# všetky vykajú alebo sú neutrálne ako zdroj. Fotky áut z pôvodnej stránky Služby (885, 884, 883) bez rámov, s lightboxom.
SLUZBY_UVOD = 'Od výberu materiálu po dopravu na stavbu: poradenstvo, výpočet spotreby a cenová ponuka sú u nás zadarmo.'
SLUZBY = [
    ('Stavebný materiál v celom sortimente', 'Výrobky popredných slovenských aj svetových výrobcov v 15 kategóriách, od základov po strechu.'),
    ('Výpočet spotreby zadarmo', 'Prineste projekt alebo rozmery a spočítame, koľko materiálu na stavbu potrebujete.'),
    ('Poradenstvo zadarmo', 'Zaškolený personál vám poradí s výberom z celého sortimentu materiálov a výrobkov.'),
    ('Množstevné zľavy', 'Pri väčšom odbere poskytujeme množstevné zľavy. Stavebné firmy, živnostníci a predajne stavebnín majú špeciálne zľavy.'),
    ('Doprava na stavbu', 'Tovar dovezieme priamo na stavbu, bez zbytočného skladovania a prekladania, pri ktorom hrozí poškodenie. '
                          'Na rozvoz máme autá Avia 3,5 t a LIAZ 8 t s mechanickou rukou.'),
    ('Nákup na splátky', 'Stavebný materiál si u nás môžete kúpiť aj na splátky cez Quatro.'),
    ('Platba kartou', 'V predajni môžete platiť platobnou kartou cez terminál VÚB banky.'),
]
SLUZBY_FOTKY = ['885', '884', '883']


def build_sluzby():
    p = PAGES['sluzby']
    polozky = ''.join(f'<article class="srv rv"><i>{n:02d}</i><div><h3>{html.escape(t)}</h3><p>{html.escape(d)}</p></div></article>' for n, (t, d) in enumerate(SLUZBY, 1))
    cap = 'Naše autá: Avia 3,5 t a nákladné auto 8 t s mechanickou rukou'
    # opis každej fotky (fotky áut z pôvodnej stránky Služby, hárok v z2/prac/auta-883-885.jpg)
    alt = {'883': 'Červená Avia s valníkom a modré nákladné auto s mechanickou rukou',
           '884': 'Avia a nákladné auto s mechanickou rukou pred predajňou pri paletách',
           '885': 'Avia a modré nákladné auto so zdvihnutou mechanickou rukou'}
    fotky = ''.join(f'<a href="{rel(p, "img/p/" + i + ".webp")}" data-lb="1" data-cap="{cap}"><img src="{rel(p, "img/p/" + i + ".webp")}" alt="{alt[i]}" loading="lazy" decoding="async" width="{IMG_SIZES[i][0]}" height="{IMG_SIZES[i][1]}"></a>' for i in SLUZBY_FOTKY)
    body = f'''<section class="sec sluzby-page"><div class="wrap">
<div class="srv-grid"><div class="srvs">{polozky}</div></div>
<h2 class="sh rv"><span>Vlastná doprava</span><small><a href="{rel(p, 'doprava.html')}">Doprava a podmienky</a></small></h2>
<div class="auta rv">{fotky}</div>
<div class="txt rv"><p>{cap}. Podmienky dopravy pri jednotlivých akciách nájdete na stránke <a href="{rel(p, 'doprava.html')}">Doprava</a>, ďalšie odpovede na stránke <a href="{rel(p, 'caste-otazky.html')}">Časté otázky</a>.</p></div>
</div></section>'''
    write(p, page(p, 'Služby', body, [('index.html', 'Úvod'), (None, 'Služby')], head=('Služby', 'Výpočet materiálu, poradenstvo a doprava', SLUZBY_UVOD), head_img='p:884'))


# O nás: pás faktov z úvodu (index.html, pás „V skratke“; texty doslova)
FAKTY_ONAS = ('<div class="facts n3 rv" aria-label="V skratke"><div><b>1997</b><span>rodinná firma v Nitre</span></div>'
              '<div><b><i>5</i> %</b><span>ďalšia zľava z akciových cien so zákazníckou kartou pri platbe v hotovosti</span></div>'
              '<div><b><i>3,3</i> %</b><span>ďalšia zľava z akciových cien so zákazníckou kartou pri platbe platobnou kartou</span></div></div>')
# Text O nás (pôvodný web PW:2720–2722, STYL P8): bez kalku „za účelom“, verzálok a s vykaním
ONAS_TEXT = ['Stavebniny Richtárik založil Ing. Mário Richtárik v roku 1997, aby rozšíril služby, ktoré dovtedy v stavebníctve ponúkal. '
             'Sme rodinná firma: predávame a sprostredkúvame stavebný materiál a majiteľ aj personál majú dlhoročné skúsenosti v stavebníctve.',
             'Zaškolený personál vám poradí s výberom z celého sortimentu materiálov a výrobkov a priebežne sa školí, pretože trh so stavebným '
             'materiálom sa stále mení.',
             'Poradenstvo a vypracovanie cenových ponúk sú u nás zadarmo. Najdôležitejšia je pre nás vaša spokojnosť.']


def build_o_nas():
    p = PAGES['o-nas']
    body = f'''<section class="sec o-nas-page"><div class="wrap">
<div class="content"><div class="figs rv n1"><figure class="fig"><a href="img/p/110.webp" data-lb="1" data-cap="Predajňa Stavebniny Richtárik, Novozámocká 62/68"><img src="img/p/110.webp" alt="Predajňa Stavebniny Richtárik v Nitre" loading="lazy" width="533" height="400"></a></figure></div>
<div class="txt rv">{''.join(f'<p>{html.escape(x)}</p>' for x in ONAS_TEXT)}</div></div>
{FAKTY_ONAS}
</div></section>'''
    write(p, page(p, 'O nás', body, [('index.html', 'Úvod'), (None, 'O nás')], head=('O nás', 'Rodinná firma od roku 1997', None), head_img='uvod:dvor-predajna'))


def build_letak():
    """Akciový leták: aktuálny cenník akcií (662) a staršie letáky z pôvodnej stránky Akciový leták (386, 385, 197)
    s náhľadmi 886 a 887 (každý raz), reklama v Spravodaji a reklamná tabuľa."""
    p = PAGES['akciovy-letak']
    def fig(i, cap, href=None):
        w, h = IMG_SIZES[i]
        return f'<figure class="fig"><a href="{href or rel(p, f"img/p/{i}.webp")}" data-lb="1" data-cap="{html.escape(cap)}"><img src="{rel(p, f"img/p/{i}.webp")}" alt="{html.escape(cap)}" loading="lazy" width="{w}" height="{h}"></a><figcaption>{html.escape(cap)}</figcaption></figure>'
    def pdf(f, t):
        return f'<a class="pdf" href="{rel(p, f)}" target="_blank" rel="noopener"><span>{html.escape(t)}</span></a>'
    body = f'''<section class="sec"><div class="wrap narrow">
<div class="content">
<div class="pdfs rv">{pdf(CENNIK_PDF, CENNIK_LETAK)}</div>
<p class="txt rv">{ZLAVA_AKCIE}</p>
<h2 class="sh rv"><span>Staršie letáky</span></h2>
<div class="pdfs rv">{pdf('pdf/386.pdf', 'Akciový leták 1 (PDF, 27. 4. 2012)')}{pdf('pdf/385.pdf', 'Akciový leták 2 (PDF, 10. 4. 2012)')}{pdf('pdf/197.pdf', 'Leták Stavebniny Richtárik (PDF, 30. 11. 2009)')}</div>
<div class="figs rv n2">{fig('886', 'Akciový leták 1')}{fig('887', 'Akciový leták 2')}</div>
<h2 class="sh rv"><span>Reklama</span></h2>
<div class="figs rv n2">{fig('360', 'Reklama Spravodaj Nitra 2010')}{fig('361', 'Reklamná tabuľa na plote')}</div>
</div>
</div></section>'''
    write(p, page(p, 'Akciový leták', body, [('index.html', 'Úvod'), (None, 'Akciové letáky')],
                  head=('Akciový leták', 'Akciové letáky na stiahnutie', 'Cenník akcií z 28.\u00a01.\u00a02026 a staršie akciové letáky na stiahnutie.'), head_img=None))


def build_404():
    """Stránka 404 pre hosting v koreni domény: odkazy a zdroje od koreňa (/…), aby fungovala na každej neexistujúcej
    adrese (aj /a/b/c.html). Bez canonical, s noindex; nastavenie servera je v nasadenie/ (ErrorDocument, httpErrors)."""
    p = '404.html'
    body = f'''<section class="sec"><div class="wrap narrow">
<div class="head" style="margin-bottom:28px"><div class="eyebrow">Chyba 404</div><h1>Stránka sa nenašla</h1><p class="lede">Stránka na tejto adrese neexistuje. Hľadajte v katalógu, pokračujte na akcie alebo nám zavolajte.</p></div>
<div class="search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Hľadajte: cement, Ytong, škridla…" autocomplete="off" aria-controls="res" aria-expanded="false" aria-describedby="res-stav"><div class="res" id="res" role="region" aria-label="Výsledky hľadania" hidden></div><p class="vh" id="res-stav" role="status" aria-live="polite"></p></div>
<div class="cta" style="margin-top:28px"><a class="btn primary" href="index.html">Úvod</a><a class="btn ghost" href="katalog/index.html">Katalóg</a><a class="btn ghost" href="akcie/index.html">Akcie</a><a class="btn ghost" href="kontakt.html">Kontakt</a></div>
<p style="margin-top:28px">Poradíme vám aj po telefóne <a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a>.</p>
</div></section>'''
    t = page(p, 'Stránka sa nenašla', body)   # svetlá stránka bez tmavej hlavičky
    t = re.sub(r'<link rel="canonical"[^>]*>\n|<meta property="og:url"[^>]*>\n', '', t)
    t = t.replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"', 1)
    # relatívne adresy na adresy od koreňa domény
    t = re.sub(r'(\s(?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:)([^"]+)"', r'\1/\2"', t)
    write(p, t)


def build_kontakt():
    p = 'kontakt.html'
    body = f'''<section class="sec kontakt-page"><div class="wrap">
<div class="kgrid">
  <div class="kbox"><h3>Predajňa a sklad</h3><address>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</address><a class="btn ghost small" href="{FIRMA['mapa']}" target="_blank" rel="noopener">Navigovať do predajne</a></div>
  <div class="kbox"><h3>Telefón a e-mail</h3><a class="big" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a class="big" href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a class="mail" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a></div>
  <div class="kbox khod"><h3>Otváracie hodiny</h3><table class="hours"><tr><td>Pondelok – piatok</td><td>7:00 – 16:00</td></tr><tr><td>Sobota</td><td>7:00 – 12:00</td></tr></table></div>
  <div class="kbox kfir"><h3>Firemné údaje a platba</h3><address>IČO {FIRMA['ico']}<br>DIČ {FIRMA['dic']}<br>Platba kartou (terminál VÚB banky)<br>Nákup na splátky (Quatro)</address></div>
  <figure class="kdvor">{predajna_picture('', '09-tabula-ulica', '(max-width:700px) calc(100vw - 36px), 600px')}<figcaption><span>Novozámocká 62/68, Nitra, Horné Krškany</span><span class="cta"><a class="btn primary small" href="{FIRMA['mapa']}" target="_blank" rel="noopener">Navigovať do predajne</a><!--p360--><a class="btn ghost small" href="#prehliadka">{P360_ODKAZ}</a><!--/p360--></span></figcaption></figure>
</div>
{prehliadka_sekcia('', '02-tvarnice-obloha')}
<div class="txt rv kpartner"><p>Odkaz na stavebnú firmu z Nitry: <a href="{FIZOSK}" target="_blank" rel="noopener">Stavebná firma FIZO SK – www.fizosk.sk</a>.</p></div>

</div></section>'''
    write(p, page(p, 'Kontakt', body, [('index.html', 'Úvod'), (None, 'Kontakt')], head=('Kontakt', 'Predajňa a sklad v Nitre – Horných Krškanoch', 'Príďte do predajne na Novozámockej 62/68, poradíme vám s výberom materiálu a cenovú ponuku pripravíme zadarmo.'), head_img='uvod:pas-dvor', extra_head=firma_ld()))

# ---------- údaje o firme pre vyhľadávače (JSON-LD) ----------
def firma_ld():
    """HardwareStore s @id: ten istý blok je na úvode (ručne, kontrola_uvodu overí zhodu) a na Kontakte. Bez geo
    (poloha špendlíka nie je v zdroji), sameAs (profily nie sú v zdroji) a Offer (cenník nemá platnosť do)."""
    d = {"@context": "https://schema.org", "@type": "HardwareStore", "@id": DOMENA + "#predajna", "name": "Stavebniny Richtárik",
         "alternateName": FIRMA['majitel'], "telephone": [FIRMA['mobil_tel'], FIRMA['pevna_tel']], "email": FIRMA['email'],
         "foundingDate": "1997",
         "address": {"@type": "PostalAddress", "streetAddress": FIRMA['ulica'], "addressLocality": "Nitra", "postalCode": "949 05", "addressCountry": "SK"},
         "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "07:00", "closes": "16:00"},
                                       {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "07:00", "closes": "12:00"}],
         "paymentAccepted": "Cash, Credit Card", "areaServed": "Slovensko", "url": DOMENA, "logo": DOMENA + "img/logo-rs-720.png",
         "image": DOMENA + OG_IMG[0], "hasMap": "https://maps.google.com/?cid=137067579998285540", "taxID": FIRMA['dic']}
    return '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + '</script>\n'


# ---------- letáky akcií: názov s dátumom, najnovší prvý ----------
def letaky_akcie(pdfs, h):
    """Odkazy na letáky akcie (STYL §5: názov a typ): „Leták akcie: názov (PDF, dátum)“, bez dvojíc a bez cenníka 662
    (ten je na stránke vždy samostatne), od najnovšieho."""
    import datetime
    def kluc(x):
        d = PDF_DATUM.get(os.path.basename(x[0]).split('.')[0], '1. 1. 1900')
        dd, mm, rr = [int(v) for v in d.replace(' ', '').split('.')]
        return datetime.date(rr, mm, dd)
    out, videl = [], set()
    for href, t in pdfs:
        b = os.path.basename(href)
        if b in videl or b == os.path.basename(CENNIK_PDF): continue
        videl.add(b)
        if b.endswith('.pdf'):
            dat = PDF_DATUM.get(b.split('.')[0])
            t = f'Leták akcie: {h} (PDF, {dat})' if dat else f'Leták akcie: {h} (PDF)'
        out.append((href, t))
    return sorted(out, key=kluc, reverse=True)


# ---------- prelinkovanie akcia ↔ katalóg a novinky z kategórií ----------
# akcia (akcie/<kľúč>.html) -> stránky katalógu s tým istým tovarom (SEO diagnóza, časť 4)
AKCIA_KATALOG = {
    'porfix': ['katalog/murovaci-material/porfix.html'], 'ytong': ['katalog/murovaci-material/ytong.html'],
    'pezinska-tehla-termobrik': ['katalog/murovaci-material/pezinske-tehelne.html'],
    'betonove-tvarnice': ['katalog/murovaci-material.html', 'katalog/dlazby.html'],
    'cement-325-r': ['katalog/sypke-zmesy.html'], 'sakret': ['katalog/sypke-zmesy.html', 'katalog/fasadny-system.html'],
    'komin-qatro': ['katalog/kominove-systemy/qatro.html'], 'krytina-blachotrapez': ['katalog/stresne-kritiny/blachotrapez.html'],
    'okna-schody-fakro': ['katalog/stresne-okna/fakro.html', 'katalog/stresne-okna/fakro/fakro-schody-vylezy.html'],
    'stresne-okna-rooflite': ['katalog/stresne-okna.html'], 'nobasil': ['katalog/izolacny-material.html'],
    'sadrokartonovy-zateplovaci-system': ['katalog/sadrokartonovy-zateplovaci-system.html'],
    'dlazby-ploty-stadreko': ['katalog/dlazby.html'], 'stavebne-rezivo': ['katalog/stavebne-rezivo.html'],
    'stavebne-naradie': ['katalog/stavebne-naradie-doplnky.html'],
}
# kategória katalógu -> novinky s tým istým druhom tovaru (každá novinka má aspoň dva odkazy mimo menu a päty)
NOVINKY_KATEGORIE = {
    'dlazby': ['topstone-oprava-starych-chodnikov', 'dekoracne-kamene', 'betonove-vyrobky'],
    'podhlady---pvc': ['vyrobky-z-plastu', 'magic-floor-vynilova-podlaha'],
    'izolacny-material': ['ekostyren'], 'fasadny-system': ['delap-ohybny-kamenny-obklad'],
    'hutny-material': ['garaze-zahradne-domceky'], 'murovaci-material': ['betonove-vyrobky'],
}


def _akcia_karta(k):
    """Štítok a názov karty akcie podľa kľúča stránky (akcie/<kľúč>.html; v zdroji môže mať dvojité pomlčky)."""
    return next(((tag, h) for s2, tag, h, _ in AKCIE_KARTY if nice_slug(s2) == k), ('Akcia', k))


def v_katalogu(p, k):
    """Na stránke akcie: odkaz na ten istý tovar v katalógu (text odkazu je H1 katalógovej stránky)."""
    ciele = AKCIA_KATALOG.get(nice_slug(k), [])
    if not ciele: return ''
    def nazov(c):
        h1 = texty.stranka(c).get('h1')
        if h1: return h1
        slug = next((s2 for s2, v in PAGES.items() if v == c), '')
        return KAT[slug.split('__')[1]][1] if slug.count('__') == 1 else nice_title(SRC[slug]['title'])
    odk = ''.join(f'<a class="btn ghost small" href="{rel(p, c)}">{html.escape(nazov(c))}</a>' for c in ciele)
    return f'<div class="v-katalogu rv"><p>Tento tovar v katalógu:</p><div class="cta">{odk}</div></div>'


def v_akcii(path):
    """Na stránke katalógu: akcie, ktoré vedú na túto stránku (blok „Táto značka je v akcii“ alebo pri kategórii
    „V akcii z tejto kategórie“)."""
    akcie = [k for k, ciele in AKCIA_KATALOG.items() if path in ciele and f'akcie/{k}.html' in PAGES.values()]
    if not akcie: return ''
    kat = path.count('/') == 1
    odk = ''.join(f'<a href="{rel(path, "akcie/" + k + ".html")}"><span class="tag">{_akcia_karta(k)[0]}</span><b>{_akcia_karta(k)[1]}</b></a>' for k in akcie)
    return f'<div class="subs v-akcii"><h2>{"V akcii z tejto kategórie" if kat else "Táto značka je v akcii"}</h2><div class="others">{odk}</div></div>'


def novinky_kategorie(path, kat):
    """Na stránke kategórie: novinky s tým istým druhom tovaru."""
    nov = [n for n in NOVINKY_KATEGORIE.get(kat, []) if f'novinky/{n}.html' in PAGES.values()]
    if not nov: return ''
    polozky = ''
    for n in nov:
        slug = next(s2 for s2, v in PAGES.items() if v == f'novinky/{n}.html')
        k = slug.split('__')[1]
        h1 = texty.stranka(f'novinky/{n}.html').get('h1') or nice_title(SRC[slug]['title'])
        polozky += f'<a class="sub rv" href="{rel(path, PAGES[slug])}"><b>{html.escape(h1)}</b> <span>{html.escape(NOVINKY_POPIS.get(k, ""))}</span></a>'
    return f'<div class="subs"><h2>Novinky v ponuke</h2><div class="sub-grid">{polozky}</div></div>'


# ---------- ceny akcií z cenníka 28. 1. 2026 (pdf/662.pdf) ----------
# Prepis cien z PDF do HTML (ceny s DPH, ako v cenníku). Žiadna nová cena: každé číslo s € je v texte PDF
# (kontrola v z2/nastroje/ceny_kontrola.py). Strana PDF je v komentári pri tabuľke.
CENNIK_AKCIE = {
    'komin-qatro': [('Kompletné komíny Stadreko (s. 1)', [
        ('10 m, ø 200/45', '918 €'), ('10 m, ø 200/90', '892 €'), ('10 m, ø 160/45', '891 €'), ('10 m, ø 160/90', '864 €'),
        ('8 m, ø 200/45', '791 €'), ('8 m, ø 200/90', '764 €'), ('8 m, ø 160/45', '768 €'), ('8 m, ø 160/90', '741 €'),
        ('6 m, ø 200/45', '664 €'), ('6 m, ø 200/90', '637 €'), ('6 m, ø 160/45', '644 €'), ('6 m, ø 160/90', '618 €')],
        'Komín sa dá vyskladať aj v inej výške.')],
    'krytina-blachotrapez': [('Plechové krytiny, hrúbka 0,5 mm (s. 2)', [
        ('Diament eco, lesklý', '9,22 €/m²'), ('Diament eco, matný', '12,36 €/m²'), ('Kingas eco, lesklý', '9,22 €/m²'),
        ('Kingas eco, matný', '12,36 €/m²'), ('Germania 25, lesklý', '9,73 €/m²'), ('Germania 25, matný', '13,06 €/m²'),
        ('Jánošík Relief wood', '18,90 €/m²'), ('Trapézový plech T7, lesklý', '8,53 €/m²'), ('Trapézový plech T7, matný', '11,22 €/m²'),
        ('Trapézový plech T7, aluzinok', '8,28 €/m²'), ('Trapézový plech T18+, lesklý', '8,74 €/m²'),
        ('Trapézový plech T18+, matný', '11,48 €/m²'), ('Trapézový plech T18+, aluzinok', '8,47 €/m²')],
        'Ceny platia nad 50 m². Doprava nad 50 m² 17 € s DPH po celom Slovensku. Do 50 m² + ochranná fólia 0,55 €/m², podlimitná objednávka do 30 m² + 1,20 €/m². Vykládka tovaru 40 € s DPH.')],
    'betonove-tvarnice': [('Betónové tvárnice, presné, pero a drážka (s. 1)', [
        ('Šalovacia tvárnica 50 × 25 × 40', '2,35 €/ks'), ('Šalovacia tvárnica 50 × 25 × 30', '1,80 €/ks'),
        ('Šalovacia tvárnica 50 × 25 × 25', '1,64 €/ks'), ('Šalovacia tvárnica 50 × 25 × 20', '1,45 €/ks'),
        ('Šalovacia tvárnica 50 × 25 × 15', '1,32 €/ks'), ('Šalovacia tvárnica 50 × 25 × 12', '1,28 €/ks'),
        ('Stĺpová tvárnica 20 × 20 × 25', '1,57 €/ks'), ('Stĺpová tvárnica 25 × 25 × 25', '1,62 €/ks'),
        ('Stĺpová tvárnica 30 × 30 × 25', '2,01 €/ks'), ('Stĺpová tvárnica 40 × 40 × 25', '2,21 €/ks'),
        ('Stĺpová tvárnica ø 30/25', '1,90 €/ks'), ('Svahovka 35/19, sivá', '4,38 €/ks'), ('Svahovka 35/19, žltá, červená', '7,60 €/ks'),
        ('Žľabovka 35 × 25', '6 €/ks'), ('Žľabovka 50 × 16', '5,42 €/ks')], '')],
    'dlazby-ploty-stadreko': [('Betónové výrobky – dlažby, obrubníky a iné (s. 3)', [
        ('Dlažba Holland 20 × 10 × 4, sivá', '10,45 €/m²'), ('Dlažba Holland 20 × 10 × 4, farebná', '12,11 €/m²'),
        ('Dlažba Holland 20 × 10 × 6, sivá', '12,50 €/m²'), ('Dlažba Holland 20 × 10 × 6, farebná', '12,65 €/m²'),
        ('Dlažba Behaton (háčko) 6 cm, sivá', '10,50 €/m²'), ('Dlažba Behaton (háčko) 6 cm, farebná', '11,80 €/m²'),
        ('Dlažba Delano 4 cm, sivá', '10,30 €/m²'), ('Dlažba Delano 4 cm, farebná', '13,60 €/m²'),
        ('Dlažba Delano 6 cm, sivá', '11,64 €/m²'), ('Dlažba Delano 6 cm, farebná', '13,60 €/m²'),
        ('Obrubník parkový 100 × 20 × 5, sivý', '1,89 €/ks'), ('Obrubník parkový 100 × 20 × 5, farebný', '2,56 €/ks'),
        ('Obrubník parkový 100 × 25 × 5, sivý', '2,90 €/ks'), ('Obrubník cestný 100 × 25 × 15, sivý', '5,94 €/ks'),
        ('Zatrávňovačka 60 × 40 × 8, sivá', '2,57 €/ks'), ('Štiepaná plotová tvárnica 40 × 20 × 19, jednostranná, sivá', '2,86 €/ks'),
        ('Štiepaná plotová tvárnica, jednostranná, farebná', '3,75 €/ks'), ('Štiepaná plotová tvárnica, obojstranná, sivá', '3,35 €/ks'),
        ('Štiepaná plotová tvárnica, obojstranná, farebná', '4,20 €/ks'), ('Štiepaná krycia doska, sivá', '2,30 €/ks'),
        ('Štiepaná krycia doska, farebná', '3,10 €/ks')], ''),
        ('Betónové striešky, sivé (s. 4)', [
        ('Plotová strieška 50 × 18', '3,80 €/ks'), ('Plotová strieška 50 × 21', '4,05 €/ks'), ('Plotová strieška 50 × 27', '4,97 €/ks'),
        ('Plotová strieška 50 × 31', '5,36 €/ks'), ('Plotová strieška 50 × 34', '5,85 €/ks'), ('Plotová strieška 50 × 36', '6,33 €/ks'),
        ('Plotová strieška 50 × 40', '6,62 €/ks'), ('Plotová strieška 50 × 45', '7,01 €/ks'), ('Stĺpová strieška 49 × 49', '7,70 €/ks'),
        ('Stĺpová strieška 39 × 39', '5,85 €/ks'), ('Stĺpová strieška 30 × 30', '5,11 €/ks')], '')],
    'cement-325-r': [('Cement (s. 3)', [('Cement R 325, 25 kg', '4,42 €/vrece'), ('Cement R 425, 25 kg', '5,18 €/vrece')], '')],
    'sakret': [('Lepidlá, omietky, malty (s. 2)', [
        ('Suchý betón 25 kg', '3,75 €/vrece'), ('Jadrová omietka (omietková a murovacia) 25 kg', '4,64 €/vrece'),
        ('Nivelizačný poter cementový 25 kg', '9,95 €/vrece'), ('Nivelizačný poter sadrový 25 kg', '12,50 €/vrece'),
        ('Lepidlo na obklad a dlažbu C1T 25 kg', '5,35 €/vrece'), ('Flexibilné lepidlo C2TE 25 kg', '9,02 €/vrece'),
        ('Super elastik C2TE S1 25 kg', '14,11 €/vrece'), ('Fajnštuk vonkajší, vnútorný 40 kg', '6,60 €/vrece'),
        ('Jednovrstvová omietka (MVR uni) 40 kg', '6,87 €/vrece'), ('Zateplenie UNI (lepenie a armovanie) 25 kg', '6,67 €/vrece')], ''),
        ('Omietky (s. 4)', [('Silikónová omietka 25 kg, rôzne farby', '40,10 €/vedro + pigmentácia'),
        ('Akryl-silikónová omietka 25 kg, rôzne farby', '32,50 €/vedro + pigmentácia'),
        ('Soklová omietka Marmolit 1 – 1,6 mm, 25 kg = 5 m²', '57,70 €/vedro')], '')],
    'nobasil': [('Climowool 039 (s. 4)', [('Hrúbka 5 cm, 18,48 m² v balení', '31,30 €/balenie'), ('Hrúbka 8 cm, 11,52 m² v balení', '30,07 €/balenie'),
        ('Hrúbka 15 cm, 6,12 m² v balení', '29,88 €/balenie'), ('Hrúbka 20 cm, 4,56 m² v balení', '30,97 €/balenie')], '')],
    'stresne-okna-rooflite': [('Strešné okná RoofLITE (s. 3)', [('Solid Pine 78 × 118 s lemovaním TFX', '283 €/ks')], 'Rôzne rozmery a druhy.')],
    'sadrokartonovy-zateplovaci-system': [('Sadrokartón Norgips 2 × 1,2 m, 2,4 m² v kuse (s. 2)', [
        ('Biely', '6,22 €/ks'), ('Zelený', '9,70 €/ks'), ('Červený', '9,93 €/ks')], 'V akcii je aj príslušenstvo k sadrokartónu.'),
        ('Styrodur Fibrostir XPS 1250 × 600 mm, 0,75 m² v kuse (s. 4)', [('2 cm', '1,90 €/ks'), ('3 cm', '2,85 €/ks'), ('5 cm', '4,80 €/ks'), ('10 cm', '9,60 €/ks')], ''),
        ('OSB doska Kronopol 2500 × 1250 mm, 3,125 m² v kuse (s. 4)', [('8 mm', '13,70 €/ks'), ('12 mm', '16,58 €/ks'), ('15 mm', '22,71 €/ks'), ('22 mm', '34,90 €/ks')], '')],
    'stavebne-rezivo': [('Palivové drevo (s. 1)', [('Palivové drevo buk, paleta 100 × 100', '134,90 €/paleta')], 'Cenník uvádza aj predaj reziva a krovy na mieru (s. 4).')],
}


def cennik_akcie(p, k):
    """Tabuľky cien akcie z cenníka 28. 1. 2026 s odkazom na PDF a vetou o platnosti."""
    k = nice_slug(k)
    tab = CENNIK_AKCIE.get(k)
    if not tab: return ''
    out = ''
    for nazov, riadky, pozn in tab:
        rows = ''.join(f'<tr><td>{html.escape(a)}</td><td>{html.escape(b)}</td></tr>' for a, b in riadky)
        out += (f'<div class="scroll rv"><table class="tbl cennik-akcie"><caption>{html.escape(nazov)}</caption>'
                f'<thead><tr><th scope="col">Výrobok</th><th scope="col">Cena s DPH</th></tr></thead><tbody>{rows}</tbody></table></div>'
                + (f'<p class="txt rv">{html.escape(pozn)}</p>' if pozn else ''))
    return (f'<section class="ceny-akcie" aria-labelledby="ceny-{k}"><h2 class="sh rv" id="ceny-{k}"><span><a href="{rel(p, CENNIK_PDF)}" target="_blank" rel="noopener">{CENNIK_TEXT}</a></span></h2>'
            f'{out}<p class="txt rv">Platnosť ceny potvrdí predajňa.</p></section>')


# ---------- Doprava (len fakty z pôvodného webu a cenníka akcií) ----------
def build_doprava():
    p = 'doprava.html'
    tel = f'<a href="tel:{FIRMA["mobil_tel"]}">{FIRMA["mobil"]}</a>'
    cennik = [('Pezinská tehla TermoBRIK', 'doprava zdarma až na stavbu, vykládka za poplatok.', 'akcie/pezinska-tehla-termobrik.html'),
              ('Krytina Blachotrapez', 'doprava nad 50 m² 17 € s DPH po celom Slovensku, do 50 m² + ochranná fólia 0,55 €/m², podlimitná objednávka do 30 m² + 1,20 €/m², vykládka tovaru 40 € s DPH.', 'akcie/krytina-blachotrapez.html'),
              ('Strešné krytiny', 'výpočet krytiny zdarma, doprava zdarma.', 'katalog/stresne-kritiny.html'),
              ('Pieskový biely', 'pri celom kamióne doprava zdarma až na stavbu.', None),
              ('Plastové výrobky', 'k cene sa pripočíta doprava od výrobcu.', 'novinky/vyrobky-z-plastu.html')]
    stare = [('Porfix', 'pri celom kamióne doprava až domov zdarma.', 'akcie/porfix.html'),
             ('Ytong', 'pri celom kamióne doprava zdarma až na stavbu.', 'akcie/ytong.html'),
             ('Zatepľovací a sadrokartónový systém', 'polystyrén dovezieme priamo domov zdarma.', 'akcie/sadrokartonovy-zateplovaci-system.html'),
             ('Garáže a záhradné domčeky', 'doprava aj montáž po celom Slovensku zdarma.', 'novinky/garaze-zahradne-domceky.html')]
    def li(zoz):
        out = ''
        for n, t, u in zoz:
            nazov = f'<a href="{rel(p, u)}">{html.escape(n)}</a>' if u else html.escape(n)
            out += f'<li><strong>{nazov}:</strong> {html.escape(t)}</li>'
        return out
    body = f'''<section class="sec doprava-page"><div class="wrap">
<div class="srv-grid"><div class="srvs">
<article class="srv rv"><i>01</i><div><h2 class="h3">Vlastné autá</h2><p>Na rozvoz tovaru máme auto Avia 3,5 t a nákladné auto 8 t s mechanickou rukou.</p></div></article>
<article class="srv rv"><i>02</i><div><h2 class="h3">Po celom Slovensku</h2><p>Dovezieme na stavbu alebo domov, na miesto, ktoré určíte, kdekoľvek na Slovensku.</p></div></article>
<article class="srv rv"><i>03</i><div><h2 class="h3">Bez zbytočného prekladania</h2><p>Tovar ide zo skladu priamo k vám. Bez medziskladov a opakovaného prekladania je menšie riziko poškodenia.</p></div></article>
<article class="srv rv"><i>04</i><div><h2 class="h3">Cena a termín dovozu</h2><p>Oboje dohodneme na {tel}, spolu s cenovou ponukou na materiál, ktorá je zadarmo.</p></div></article>
</div></div>
<h2 class="sh rv"><span>Doprava pri akciách</span><small><a href="{rel(p, CENNIK_PDF)}" target="_blank" rel="noopener">{CENNIK_TEXT}</a></small></h2>
<div class="txt rv"><p>Podľa cenníka akcií z 28.&nbsp;1.&nbsp;2026:</p><ul class="ticks">{li(cennik)}</ul>
<p>Pri ďalších akciách zo stránky <a href="{rel(p, 'akcie/index.html')}">Akcie</a> (bez dátumu, platnosť potvrdí predajňa):</p><ul class="ticks">{li(stare)}</ul></div>
<div class="txt rv"><p>Ďalšie odpovede sú na stránke <a href="{rel(p, 'caste-otazky.html')}">Časté otázky</a>, prehľad služieb na stránke <a href="{rel(p, 'sluzby.html')}">Služby</a>.</p></div>
</div></section>'''
    write(p, page(p, 'Doprava', body, [('index.html', 'Úvod'), (None, 'Doprava')],
                  head=('Doprava', 'Doprava materiálu po celom Slovensku', 'Materiál dovezieme vlastnými autami na miesto stavby, ktoré určíte, aj autom s mechanickou rukou.'), head_img='uvod:pas-dvor'))


# ---------- Časté otázky (odpovede doslova z overenej databázy asistenta) ----------
# Ak je v strome databáza asistenta (asistent/znalosti/richtarik-otazky.json), odpovede sa berú z nej podľa id, aby web
# a asistent hovorili to isté. Inak platí táto kópia (vetva richtarik-asistent, 2eda9c90, tie isté texty).
CASTE_ID = ['kontakt-telefon', 'kontakt-email', 'hodiny', 'sluzby-ponuka', 'sluzby-poradenstvo', 'sluzby-firmy',
            'doprava-slovensko', 'doprava-ruka', 'zlava-karta', 'zlava-cennik', 'platba-karta', 'platba-splatky',
            'akcia-porfix-ytong', 'akcia-zateplenie', 'cena-cement']
CASTE_KOPIA = {
    'kontakt-telefon': ('kontakt', 'Aké máte telefónne číslo?', 'Zavolajte nám na mobil 0905 622 223 alebo na pevnú linku 037 651 17 77. Otváracie hodiny: pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00.'),
    'kontakt-email': ('kontakt', 'Aký je váš e-mail?', 'Napíšte nám na info@stavebninyrichtarik.sk. Pošlite aj zoznam materiálu alebo projekt a pripravíme vám cenovú ponuku.'),
    'hodiny': ('hodiny', 'Aké máte otváracie hodiny?', 'Pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00.'),
    'sluzby-ponuka': ('sluzby', 'Ako získam cenovú ponuku?', 'Cenová ponuka je zadarmo. Pošlite nám zoznam materiálu alebo projekt na info@stavebninyrichtarik.sk, prípadne prineste projekt alebo rozmery do predajne. Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu. Telefón 0905 622 223.'),
    'sluzby-poradenstvo': ('sluzby', 'Poradíte mi s výberom materiálu?', 'Áno, poradenstvo je zadarmo. Zaškolený personál vám poradí v predajni alebo na telefóne 0905 622 223.'),
    'sluzby-firmy': ('sluzby', 'Máte ceny pre stavebné firmy?', 'Áno. Pri väčšom odbere a pre stavebné firmy, živnostníkov a spolupracujúce stavebniny máme špeciálne ceny. Dohodnete sa v predajni alebo na 0905 622 223.'),
    'doprava-slovensko': ('doprava', 'Vozíte aj mimo Nitry?', 'Áno, materiál dovezieme na stavbu po celom Slovensku. Cenu a termín dovozu vám povieme na 0905 622 223.'),
    'doprava-ruka': ('doprava', 'Máte auto s hydraulickou rukou?', 'Áno. Okrem auta Avia 3,5 t máme nákladné auto 8 t s mechanickou rukou. Vykládka sa pri niektorých akciách platí, napríklad pri krytine Blachotrapez 40 € s DPH. Podrobnosti vám povieme na 0905 622 223.'),
    'zlava-karta': ('zlavy', 'Aké zľavy máte so zákazníckou kartou?', 'Z akciových cien dostanete so zákazníckou kartou ďalšiu zľavu: 5 % pri platbe v hotovosti a 3,3 % pri platbe platobnou kartou. Kartu si vyzdvihnete v predajni.'),
    'zlava-cennik': ('zlavy', 'Sú ceny v cenníku akcií už so zľavou?', 'Áno. Ceny v cenníku akcií (28. 1. 2026) platia pri platbe v hotovosti, z ceny je už odrátaná 5 % zľava.'),
    'platba-karta': ('zlavy', 'Môžem platiť kartou?', 'Áno, v predajni je platobný terminál (VÚB banka). Platiť môžete aj v hotovosti; pri akciových cenách so zákazníckou kartou je zľava 5 % v hotovosti a 3,3 % kartou.'),
    'platba-splatky': ('zlavy', 'Dá sa kúpiť materiál na splátky?', 'Áno, stavebný materiál môžete kúpiť na splátky cez Quatro. Podrobnosti vám povieme v predajni alebo na 0905 622 223.'),
    'akcia-porfix-ytong': ('akcie', 'Je doprava zdarma pri Porfixe alebo Ytongu?', 'Porfix aj Ytong majú špeciálne zľavy. Pri celom kamióne je doprava zdarma: Porfix až domov, Ytong až na stavbu.'),
    'akcia-zateplenie': ('akcie', 'Dovezete polystyrén zadarmo?', 'Áno, pri akcii na zatepľovací a sadrokartónový systém dovezieme polystyrén priamo domov zdarma.'),
    'cena-cement': ('akcie', 'Koľko stojí cement?', 'V akcii: cement 325 R, 25 kg za 4,42 € za vrece s DPH a cement 425 R, 25 kg za 5,18 € za vrece s DPH. Cena platí pri platbe v hotovosti. Platnosť vám potvrdíme na 0905 622 223.'),
}
CASTE_TEMY = [('kontakt', 'Kontakt a otváracie hodiny'), ('hodiny', None), ('sluzby', 'Cenová ponuka a služby'), ('doprava', 'Doprava na stavbu'),
              ('zlavy', 'Zľavy a platba'), ('akcie', 'Akcie a ceny')]


def caste_otazky():
    """(id, téma, otázka, odpoveď) v poradí CASTE_ID: z databázy asistenta, ak je v strome, inak z kópie."""
    db = os.path.join(ROOT, 'asistent', 'znalosti', 'richtarik-otazky.json')
    zdroj = {}
    if os.path.exists(db):
        zdroj = {o['id']: (o['t'], o['q'], o['a']) for o in json.load(open(db, encoding='utf-8'))['otazky']}
    return [(i,) + zdroj.get(i, CASTE_KOPIA[i]) for i in CASTE_ID]


def _odkazy_v_odpovedi(t):
    """Telefóny a e-mail v odpovedi ako odkazy (text sa nemení, porovnanie s databázou je po odstránení značiek)."""
    t = html.escape(t)
    t = t.replace('0905 622 223', f'<a href="tel:{FIRMA["mobil_tel"]}">0905 622 223</a>').replace('037 651 17 77', f'<a href="tel:{FIRMA["pevna_tel"]}">037 651 17 77</a>')
    return t.replace('info@stavebninyrichtarik.sk', '<a href="mailto:info@stavebninyrichtarik.sk">info@stavebninyrichtarik.sk</a>')


def build_caste_otazky():
    p = 'caste-otazky.html'
    qa = caste_otazky()
    bloky = ''
    for tema, nadpis in CASTE_TEMY:
        if not nadpis: continue
        temy = [tema] + (['hodiny'] if tema == 'kontakt' else [])
        # otázka a odpoveď sú vždy viditeľné (bez rozbaľovania): text je hneď čitateľný aj bez JS a pre vyhľadávače
        polozky = ''.join(f'<div class="otazka rv" id="{i}"><h3>{html.escape(q)}</h3><p>{_odkazy_v_odpovedi(a)}</p></div>' for i, t, q, a in qa if t in temy)
        if polozky: bloky += f'<h2 class="sh rv"><span>{nadpis}</span></h2><div class="otazky">{polozky}</div>'
    ld = {"@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for i, t, q, a in qa]}
    body = f'''<section class="sec caste-page"><div class="wrap narrow">
<div class="content">{bloky}</div>
<div class="txt rv kat-cta"><p>Nenašli ste odpoveď? Zavolajte na <a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a> alebo napíšte na <a href="mailto:{FIRMA['email']}">{FIRMA['email']}</a>.</p></div>
</div></section>'''
    write(p, page(p, 'Časté otázky', body, [('index.html', 'Úvod'), (None, 'Časté otázky')],
                  head=('Časté otázky', 'Časté otázky', 'Doprava, zľavy, platba a cenová ponuka. Ďalšie otázky vám zodpovieme na 0905 622 223.'), head_img=None,
                  extra_head='<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n'))



def letak_thumb(slug, path):
    """Náhľad letáku akcie do karty."""
    if slug not in SRC: return ''
    big = [i for i, e in SRC[slug]['imgs'] if i in IMG_SIZES and IMG_SIZES[i][1] >= 500]
    return f'<img class="thumb" src="{rel(path, "img/p/" + big[0] + ".webp")}" alt="" loading="lazy" width="{IMG_SIZES[big[0]][0]}" height="{IMG_SIZES[big[0]][1]}">' if big else ''


def build_search_index():
    """Index hľadania z vygenerovaných stránok (okrem úvodu a 404): titulok z H1, kategória, text = úvodný odstavec
    hlavičky (pri akciách text karty s cenami) + obsah stránky bez bočného menu a navigácie (sortiment zo zdroja „uvod“,
    cenníky, kontakty). Text je skrátený na 1600 znakov."""
    idx = []
    stranky = sorted({p for p in PAGES.values() if p != 'index.html' and os.path.exists(os.path.join(OUT, p))} | {'katalog/index.html', 'novinky/index.html'} | set(NOVE_STRANKY))
    slug_of = {v: k for k, v in PAGES.items()}
    for p in stranky:
        h = open(os.path.join(OUT, p), encoding='utf-8').read()
        doc = LH.fromstring(h)
        h1 = doc.xpath('//h1')
        t = re.sub(r'\s+', ' ', h1[0].text_content()).strip() if h1 else nice_title(p)
        lede = ' '.join(re.sub(r'\s+', ' ', e.text_content()).strip() for e in doc.xpath('//section[contains(@class,"page-head")]//p[contains(@class,"lede")]'))
        main = doc.xpath('//main')
        for e in (main[0].xpath('.//aside|.//nav|.//script|.//*[contains(@class,"search")]|.//*[contains(@class,"kat-cta")]|.//section[contains(@class,"page-head")]') if main else []):
            e.getparent().remove(e)
        txt = re.sub(r'\s+', ' ', ' '.join(main[0].itertext()) if main else '').strip()
        sl = slug_of.get(p, '').split('__')
        ponuka = ''
        if sl[0] == 'katalog-roduktov' and len(sl) > 1:
            k = KAT[sl[1]][1]
            if len(sl) == 2: ponuka = PONUKA_UVOD.get(sl[1], '')   # sortiment zo zdroja „uvod“ vpredu, aby sa našiel
        elif p == 'katalog/index.html': k = 'Katalóg'
        else:
            k = {'akcie': 'Akcie', 'novinky': 'Novinky', 'galeria': 'Galéria'}.get(p.split('/')[0], 'Stránka')
        x = re.sub(r'\s+', ' ', ' '.join((lede, ponuka, txt))).strip()[:1600]
        idx.append({'t': t, 'k': k, 'p': p, 'x': x})
    write('assets/index.json', json.dumps(idx, ensure_ascii=False, separators=(',', ':')))


NOVE_STRANKY = ['doprava.html', 'caste-otazky.html']   # stránky, ktoré nie sú v zdroji (len z faktov)


def datum_zmeny(path):
    """Dátum poslednej zmeny stránky pre sitemap: dátum posledného commitu súboru; ak sa súbor od neho zmenil alebo
    ešte nie je v gite, dnešný dátum. Bez gitu (napr. na hostingu) dátum úpravy súboru."""
    import subprocess, datetime
    full = os.path.join(OUT, path)
    try:
        zmena = subprocess.run(['git', 'status', '--porcelain', '--', full], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
        if zmena: return datetime.date.today().isoformat()
        d = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', full], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
        if d: return d
    except (OSError, subprocess.CalledProcessError):
        pass
    return datetime.date.fromtimestamp(os.path.getmtime(full)).isoformat()


def build_sitemap():
    """sitemap.xml so všetkými HTML stránkami (aj úvodom, ktorý sa negeneruje) s dátumom zmeny a robots.txt s odkazom
    naň. Priečinok asistent/ (server asistenta, ak sa zapne) sa neprehľadáva."""
    stranky = sorted({'index.html', 'katalog/index.html', 'novinky/index.html'} | set(NOVE_STRANKY) | {p for p in PAGES.values() if os.path.exists(os.path.join(OUT, p))})
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join(f'  <url><loc>{html.escape(url_abs(p))}</loc><lastmod>{datum_zmeny(p)}</lastmod></url>\n' for p in stranky) + '</urlset>\n'
    write('sitemap.xml', xml)
    write('robots.txt', f'User-agent: *\nAllow: /\nDisallow: /asistent/\n\nSitemap: {DOMENA}sitemap.xml\n')
    return len(stranky)


def kontrola_textov():
    """Kontrola textov vo všetkých stránkach (README, Texty a SEO): titulok najviac 60 znakov vo vzore
    „… | Stavebniny Richtárik Nitra“, popis 120 – 155 znakov bez „…“ na konci, žiadne dva rovnaké titulky, popisy ani H1,
    na stránke práve jeden H1 s 2 až 7 slovami a najviac 45 znakmi (okrem úvodu) a stránky bez ručného popisu."""
    chyby = []; tit = {}; pop = {}; h1s = {}
    for kor, dirs, subory in os.walk(OUT):
        dirs[:] = [x for x in dirs if x not in ('img', 'pdf', 'subory', 'zdroj', 'nasadenie', '__pycache__', '.git', 'asistent')]
        for f in subory:
            if not f.endswith('.html'): continue
            rp = os.path.relpath(os.path.join(kor, f), OUT)
            doc = LH.parse(os.path.join(kor, f)).getroot()
            t = (doc.findtext('.//title') or '').strip()
            d = (doc.xpath('//meta[@name="description"]/@content') or [''])[0]
            h1 = [re.sub(r'\s+', ' ', e.text_content()).strip() for e in doc.xpath('//h1')]
            if rp != 'index.html':
                if len(t) > 60 or not t.endswith(texty.PRIPONA): chyby.append(f'{rp}: titulok {len(t)} znakov „{t}“')
                if len(h1) != 1: chyby.append(f'{rp}: H1 {len(h1)}×')
                elif not (2 <= len(re.findall(r'[\w]+', h1[0])) <= 7 and len(h1[0]) <= 45): chyby.append(f'{rp}: H1 „{h1[0]}“')
                if rp != '404.html' and not texty.stranka(rp).get('d'): chyby.append(f'{rp}: popis zložil generátor (doplňte ručný do texty.STRANKY)')
            if not (120 <= len(d) <= 155) or d.endswith(('…', '...')): chyby.append(f'{rp}: popis {len(d)} znakov')
            tit.setdefault(t, []).append(rp); pop.setdefault(d, []).append(rp)
            if h1: h1s.setdefault(h1[0], []).append(rp)
    for nazov, slovnik in (('titulok', tit), ('popis', pop), ('H1', h1s)):
        chyby += [f'rovnaký {nazov} na {", ".join(v)}' for k, v in slovnik.items() if len(v) > 1]
    if chyby: print('POZOR: kontrola textov:', *chyby, sep='\n  ')
    else: print('kontrola textov: OK (titulky, popisy a H1 všetkých stránok)')
    return not chyby


# priečinok odstráneného videa s autom a jeho obrázok pri zdieľaní (skladá sa z častí, aby kontrola nenašla samu seba)
STARE_VIDEO = 'img/' + 'fi' + 'lm' + '|' + 'uvod/' + r'og\.jpg'


def ochrana_prechody():
    """Stránka asistenta asistent/ochrana-udajov.html je ručná (vlastný štýl, noindex), prechody má ako celý web:
    medzi značky <!--prechody…--> a <!--/prechody--> sa vloží ten istý skript ako do <head> ostatných stránok
    (bez pravidiel prípravy stránok, z nej nevedú dlaždice). Ak stránka v strome nie je, nič sa nerobí."""
    p = os.path.join(OUT, 'asistent', 'ochrana-udajov.html')
    if not os.path.exists(p): return
    s = open(p, encoding='utf-8').read()
    n = s
    for znacka, skript in (('prechody', PRECHODY_HEAD.split('</script>')[0] + '</script>'), ('tema', TEMA_HEAD.strip())):
        m = re.sub(r'(<!--' + znacka + r'[^>]*-->).*?(<!--/' + znacka + r'-->)', lambda x: x.group(1) + skript + x.group(2), n, count=1, flags=re.S)
        if m == n and skript not in n: print(f'POZOR: asistent/ochrana-udajov.html bez značiek <!--{znacka}--> (skript {znacka})')
        n = m
    if n != s: open(p, 'w', encoding='utf-8').write(n)


def kontrola_uvodu():
    """Úvod (index.html) je ručne udržiavaný, build.py ho neprepisuje. Upozorní, keď sa menu alebo údaje firmy
    v build.py zmenili a v úvode nie sú (treba ich doplniť ručne), a skontroluje celý web: žiadny odkaz na staré
    video s autom ani na jeho obrázok pri zdieľaní, og obrázok (logo a názov) na každej stránke, na úvode práve jeden H1
    so slovom „Stavebniny“ (SEO) a og aj JSON-LD obrázok."""
    s = open(os.path.join(OUT, 'index.html'), encoding='utf-8').read()
    chyba = [p for p, t in NAV if p != 'index.html' and f'href="{p}">{t}<' not in s]
    if 'data-asistent="ukazka"' not in s: chyba.append('data-asistent="ukazka" na <html> (asistent v náhľade)')
    chyba += [v for k, v in FIRMA.items() if k not in ('mapa',) and v not in s and html.escape(v) not in s]
    stranky = bez_og = 0; stare = []; bez_prechodu = []; bez_temy = []; von360 = []
    for kor, dirs, subory in os.walk(OUT):
        dirs[:] = [x for x in dirs if x not in ('img', 'pdf', 'subory', 'zdroj', 'nasadenie', '__pycache__', '.git')]
        for f in subory:
            if not f.endswith(('.html', '.css', '.js', '.json', '.webmanifest', '.xml')): continue
            t = open(os.path.join(kor, f), encoding='utf-8', errors='replace').read()
            if re.search(STARE_VIDEO, t): stare.append(os.path.relpath(os.path.join(kor, f), OUT))
            # prehliadka 360° je v stránke (Lajo 9. 11. 2026): žiadny odkaz von na záznam v Google Mapách ani starý odkaz-360
            if 'google.com/maps?cid' in t or 'odkaz-360' in t: von360.append(os.path.relpath(os.path.join(kor, f), OUT))
            if f.endswith('.html'):
                stranky += 1
                if f'{DOMENA}{OG_IMG[0]}' not in t: bez_og += 1
                if t.count("'pagereveal'") != 1: bez_prechodu.append(os.path.relpath(os.path.join(kor, f), OUT))
                if t.count('tema=(farebna|svetla|tmava)') != 1 or len(re.findall(r'<html lang="sk" data-tema="' + TEMA + '"[ >]', t)) != 1 or t.count(f'<meta name="theme-color" content="{FARBA}">') > 1: bez_temy.append(os.path.relpath(os.path.join(kor, f), OUT))
    if firma_ld().strip() not in s: chyba.append('úvod: JSON-LD HardwareStore sa nezhoduje s firma_ld() (vlož výstup firma_ld())')
    if PRECHODY_HEAD not in s: chyba.append('úvod: skript prechodov v <head> sa nezhoduje so zdroj/prechody.js (vlož výstup prechody_head())')
    if bez_prechodu: chyba.append('skript prechodov nie je práve raz: ' + ', '.join(bez_prechodu[:5]))
    if bez_temy: chyba.append('skript témy (zdroj/tema-head.js) nie je práve raz alebo <html> nemá predvolenú tému data-tema="' + TEMA + '": ' + ', '.join(bez_temy[:5]))
    if s.split('<link rel="stylesheet"')[0].count(TEMA_HEAD.strip()) != 1: chyba.append('úvod: skript témy v <head> pred štýlom sa nezhoduje so zdroj/tema-head.js (vlož výstup tema_head())')
    if stare: chyba.append('odkaz na staré video alebo og.jpg: ' + ', '.join(stare[:5]))
    if von360: chyba.append('odkaz von na 360° v Google Mapách (má byť prehliadka v stránke): ' + ', '.join(von360[:5]))
    if s.count(f'<p class="lede">{P360_LEDE}</p>') != 1 or s.count(f'<!--p360--> <a href="#prehliadka">{P360_ODKAZ}</a><!--/p360-->') != 1 or s.count('<!--p360-->') != 2 or s.count('<!--/p360-->') != 2:
        chyba.append('úvod: sekcia prehliadky 360° nemá odsek P360_LEDE, odkaz P360_ODKAZ alebo značky <!--p360--> … <!--/p360--> okolo sekcie a odkazu (balik.sh podľa nich skúšobnú prehliadku vynechá)')
    if s.count(prehliadka_blok('', '13-dlazba-sklad')) != 1: chyba.append('úvod: komponent prehliadky 360° nie je v index.html práve raz alebo sa nezhoduje s prehliadka_blok(\'\', \'13-dlazba-sklad\') (vlož jeho výstup)')
    if bez_og: chyba.append(f'og obrázok {OG_IMG[0]} chýba na {bez_og} z {stranky} stránok')
    h1 = re.findall(r'<h1[ >].*?</h1>', s, re.S)
    if len(h1) != 1 or 'Stavebniny' not in h1[0]: chyba.append(f'úvod: H1 {len(h1)}×, so slovom Stavebniny: {bool(h1) and "Stavebniny" in h1[0]}')
    if s.count(f'{DOMENA}{OG_IMG[0]}') < 2: chyba.append('úvod: og:image alebo JSON-LD image nie je og obrázok webu')
    # uvítanie Brána (zdroj/uvitanie.*): štyri bloky zo zdroja práve raz, prekryv ako prvý prvok <body> (bez triedy br-ide
    # skrytý), mimo čítačky (aria-hidden, vnútro inert), bez nadpisu, odkazu, prvku s fokusom, výkričníka a štítku označenia asistenta
    # (skratka z assets/asistent.js, patrí len k oknu asistenta); rozhodnutie
    # v <head> práve raz a dnešný pohyb úvodu (uv-ide) sa pri uvítaní nespustí; bez otáčania, perspektívy a clip-path
    hlava, uv = s.split('</head>')[0], uvitanie_bloky()
    oznacenie = re.search(r"\bai: '([^']+)'", open(os.path.join(OUT, 'assets', 'asistent.js'), encoding='utf-8').read()).group(1)
    chyba += [f'úvod: blok uvítania {n} nie je v index.html práve raz alebo sa nezhoduje so zdrojom (vlož výstup uvitanie_bloky())'
              for n, b in uv.items() if s.count(b) != 1]
    sab = uv['sablona']
    if not re.search(r'<body[^>]*>\n' + re.escape(sab), s): chyba.append('úvod: prekryv uvítania nie je prvý prvok <body>')
    elif not sab.startswith('<div class="br" aria-hidden="true"><div class="br-in" inert>'): chyba.append('úvod: prekryv uvítania bez aria-hidden alebo vnútro bez inert')
    elif re.search(r'<h[1-6][\s>]|<a[\s>]|<button|<input|tabindex|!|\b' + re.escape(oznacenie) + r'\b', sab): chyba.append('úvod: prekryv uvítania má nadpis, odkaz, prvok s fokusom, výkričník alebo označenie asistenta')
    if '.br{display:none;' not in uv['style'] or '.br-ide .br{display:block}' not in uv['style']: chyba.append('úvod: prekryv uvítania nie je bez triedy br-ide skrytý')
    if hlava.count("classList.add('br-ide')") != 1: chyba.append('úvod: rozhodnutie uvítania (br-ide) nie je v <head> práve raz')
    if '.matches&&!h.classList.contains("br-ide"))h.classList.add("uv-ide")' not in hlava: chyba.append('úvod: pohyb úvodu uv-ide sa spustí aj pri uvítaní')
    if re.search(r'rotate|perspective|clip-path', uv['style'] + uv['skript']): chyba.append('úvod: uvítanie otáča, má perspektívu alebo clip-path')
    if chyba: print('POZOR: kontrola úvodu (doplň ručne):', chyba)
    else: print(f'kontrola úvodu: OK (stránok {stranky}, og obrázok na všetkých, H1 1×, bez starého videa, skript prechodov a témy 1× na každej, uvítanie zo zdroja 1×)')
    return not chyba


if __name__ == '__main__':
    import sys
    # úvod (index.html) je ručne udržiavaný, build.py ho neprepisuje (kontrola_uvodu na konci)
    build_katalog_index()
    for s in PAGES:
        if s.startswith('katalog-roduktov__'): build_katalog_page(s)
    build_akcie()
    build_novinky()
    build_galeria()
    build_o_nas()
    build_sluzby()
    build_doprava()
    build_caste_otazky()
    build_letak()
    build_kontakt()
    build_404()
    build_search_index()
    print('assets/panorama.js (prehliadač panorámy zo zdroj/panorama.js):', panorama_js(), 'B')
    ochrana_prechody()
    print('stránok v sitemap.xml:', build_sitemap())
    if obsah.CHYBAJUCE: print('vynechané odkazy na súbory, ktoré už neexistujú:', ' '.join(sorted(obsah.CHYBAJUCE)))
    kontrola_uvodu()
    kontrola_textov()
    print('vygenerovaných stránok HTML:', len(ZAPISANE), '(úvod index.html sa upravuje ručne)')
