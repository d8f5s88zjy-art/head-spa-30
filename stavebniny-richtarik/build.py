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
import obsah
from popisy import ZNACKY

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = ROOT
SRC = json.load(open(os.path.join(ROOT, 'zdroj/pages.json'), encoding='utf-8'))
IMG_SIZES = json.load(open(os.path.join(ROOT, 'zdroj/obrazky.json')))
PDF_LOCAL = set(os.listdir(os.path.join(ROOT, 'pdf')))
OLD = 'http://www.stavebninyrichtarik.sk'
# produkčná adresa webu (koreň hostingu); canonical, og:url, og:image a sitemap.xml sú absolútne na túto doménu.
# Náhľad v podpriečinku (GitHub Pages) funguje ďalej, lebo všetky odkazy v stránkach ostávajú relatívne.
DOMENA = 'https://www.stavebninyrichtarik.sk/'
OG_IMG = ('img/og-dvor.jpg', 1200, 630)   # výrez skutočnej fotky dvora u4, bez auta (pôvod v img/FOTKY.md)
OG_ALT = 'Dvor Stavebnín Richtárik v Nitre plný materiálu na paletách'


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

# Kategórie katalógu: slug pôvodného webu -> pekný názov, popis, značky, fotka na karte
KATEGORIE = [
    ('sypke-zmesy', 'Sypké zmesi', 'Cement, vápno, malty, omietky, lepidlá, stierky a samonivelačné hmoty.', 'Baumit, Cemmac, Calmit, Holcim, Murexin, Univerbau', 'cement'),
    ('murovaci-material', 'Murovací materiál', 'Tehly, pórobetónové a betónové tvárnice, preklady a stropné systémy.', 'Pezinské tehelne, Ytong, Porfix, Betonárka Nadlice', 'tehla'),
    ('stresne-kritiny', 'Strešné krytiny', 'Pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo.', 'Tondach, Bramac, Mediterran, Onduline, Icopal, Blachotrapez', 'strecha'),
    ('dlazby', 'Dlažby a ploty', 'Zámkové dlažby, terasové platne, obrubníky, palisády a plotové systémy.', 'City Stone Design, Premac, Stadreko', 'dlazba'),
    ('izolacny-material', 'Izolačný materiál', 'Minerálna vlna, polystyrén, asfaltové pásy, izolácie proti vode a radónu.', 'Knauf Insulation, Isover, Nobasil, Icopal, Den Braven, Climowool', 'izolacia'),
    ('kominove-systemy', 'Komínové systémy', 'Certifikované komíny so šamotovou alebo nerezovou vložkou.', 'Stadreko, Schiedel', 'komin'),
    ('stresne-okna', 'Strešné okná', 'Kyvné a výklopné strešné okná, výlezy, svetlíky, schody a doplnky.', 'Velux, Fakro, Rooflite', 'okno-strecha'),
    ('hutny-material', 'Hutný materiál', 'Betonárska oceľ, siete, plechy, profily, rúry, zárubne a garážové brány.', 'Yssel Steel', 'hutny'),
    ('dvere---okna', 'Dvere a okná', 'Interiérové, vchodové, bezpečnostné a posuvné dvere. Okná drevené, dvojsklo.', 'Masonite', 'dvere'),
    ('stavebne-rezivo', 'Stavebné rezivo', 'Dosky, hranoly, foršne, strešné laty, tatranský profil, krovy na mieru.', 'Drepex', 'rezivo'),
    ('stavebne-naradie-doplnky', 'Náradie a doplnky', 'Stavebné, elektrické a záhradné náradie, spojovací materiál, mriežky a poklopy.', 'Slovakia Trend, DS Haco', 'naradie'),
    ('podhlady---pvc', 'Podhľady a PVC', 'Plastové zatrávňovacie dlažby, plotovky, profily, platne a káblové žľaby.', 'Transform Recykling', 'zahrada'),
    ('sadrokartonovy---zateplovaci-system', 'Sadrokartón a zateplenie', 'Suchá výstavba, profily, polystyrén, sklotex, fólie a strešné doplnky.', 'Stavebné profily, Masterplast', 'sadrokarton'),
    ('fasadny-system', 'Fasádny systém', 'Silikónové, silikátové a mozaikové omietky, fasádne farby, zatepľovacie systémy.', 'Baumit, Univerbau', 'fasada'),
    ('farby---laky', 'Farby a laky', 'Interiérové a fasádne farby, laky, lepidlá, riedidlá, tónovacie systémy.', 'Het, Chemolak, Chemos, Elastik', 'farby'),
]
KAT = {k[0]: k for k in KATEGORIE}

# Aktuálny cenník akcií z pôvodného webu (files/662.pdf, „STIAHNUŤ-CENNÍK AKTUÁLNYCH AKCII“, aktualizovaný 28. 1. 2026)
# a podmienky zliav doslova podľa jeho hlavičky (662: „ZĽAVA Z AKCIOVÝCH CIEN / ZÁKAZNÍCKA KARTA / PLATBA V HOTOVOSTI -5 %
# / PLATBA PLAT. KARTOU -3,3 % … Ceny platia pri platbe v hotovosti, z ceny je už odrátaná 5% zľava“).
CENNIK_PDF = 'pdf/662.pdf'
CENNIK_TEXT = 'Cenník aktuálnych akcií (PDF, aktualizovaný 28.\u00a01.\u00a02026)'
CENNIK_LETAK = 'Cenník aktuálnych akcií – aktualizovaný 28.\u00a01.\u00a02026'
# nezlomiteľná medzera medzi číslom a % a v dátume, aby sa na telefóne nerozdelili na dva riadky
ZLAVA_AKCIE = ('Zľava z akciových cien so zákazníckou kartou: 5\u00a0% pri platbe v hotovosti, 3,3\u00a0% pri platbe platobnou kartou. '
               'Ceny v cenníku akcií (28.\u00a01.\u00a02026) platia pri platbe v hotovosti, z ceny je už odrátaná 5\u00a0% zľava.')

# Karty akcií v poradí a znení pôvodnej stránky Akcie (zdroj/pages.json „akcie“; menený len pravopis a veľké písmená).
# slug: podstránka akcie (akcie/<slug>.html), alebo celý slug inej stránky (karta bez letáku vedie tam).
AKCIE_KARTY = [
    ('pezinska-tehla-termobrik', 'Super ceny', 'Pezinská tehla TermoBRIK', 'Brúsená tehla, Dry systém TermoBRIK. S pojivom, zdarma lepidlo. Na tehlu vám spravím individuálnu cenovú ponuku konkrétne na váš dom, pokúsim sa spraviť najlepšiu cenu.'),
    ('komin-qatro', 'Na sklade', 'Komín Stadreko', 'Najlacnejší komínový systém na Slovensku. Máme priamo na sklade, odber možný ihneď.'),
    ('krytina-blachotrapez', 'Doprava 17 €', 'Krytina Blachotrapez', 'Škridloplech, trapézové plechy. Doprava nad 50 m² – 17 € s DPH po celom Slovensku. Do 50 m² + ochranná fólia – 0,55 €/m². Podlimitná objednávka do 30 m² + 1,20 €/m². Vykládka tovaru 40 € s DPH.'),
    ('katalog-roduktov__dlazby', '15 – 30 %', 'Dlažba City Stone Design', 'Zľava 15 – 30 % z cenníkových cien (objektové zľavy).'),
    ('dlazby--ploty-stadreko', 'Super ceny', 'Dlažby a ploty Stadreko', 'Betónové dlažby, ploty, tvárnice, striešky, svahovky, palisády, zatrávňovačky, obrubníky, komíny v super cenách.'),
    ('okna--schody-fakro', 'Zľava 20 %', 'Okná a schody Fakro', 'Strešné okná, podkrovné – stropné sklápacie schody, strešné doplnky. Rôzne druhy, rôzne rozmery.'),
    ('stavebne-rezivo', 'Super ceny', 'Stavebné rezivo', 'Máme v super cenách dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo, krovy na mieru.'),
    ('stavebne-naradie', 'Na sklade', 'Stavebné náradie', 'Ponúkame náradie na stavbu, do záhrady, do domácnosti, do dielne. Široká ponuka priamo na sklade.'),
    ('sadrokartonovy---zateplovaci-system', 'Zdarma domov', 'Zatepľovací a sadrokartónový systém', 'Kompletný sortiment výrobkov. Polystyrén dovezieme priamo domov zdarma.'),
    ('porfix', 'Špeciálne zľavy', 'Porfix', 'Obvodové murivo, priečky, strop, lepidlá, malty. Pri celom kamióne doprava až domov zdarma.'),
    ('ytong', 'Špeciálne zľavy', 'Ytong', 'Špeciálne zľavy. Doprava pri celom kamióne zdarma až na stavbu.'),
    ('novinky__garaze--zahradne-domceky', 'Super ceny', 'Garáže, záhradné domčeky', 'Garáže, záhradné domčeky v super cenách. Doprava aj montáž po celom Slovensku zdarma.'),
    ('betonove-tvarnice', 'Znížené ceny', 'Betónové tvárnice', 'Znížené ceny, základové aj stĺpikové tvárnice.'),
    ('cement-325-r', '4,42 €/vrece', 'Cement 325 R a 425 R', 'Cement 325 R, 25 kg – 4,42 €/vrece s DPH. Cement 425 R, 25 kg – 5,18 €/vrece s DPH. Cena platí pri platbe v hotovosti.'),
    ('sakret', 'Znížené ceny', 'Lepidlá, omietky Univerbau', 'Znížené ceny: lepidlo mrazuvzdorné, na polystyrén, kvádre, flexibilné, nivelit, omietky hrubé, putzovky, murovacie malty, betónový poter a iné.'),
    ('nobasil', 'Super ceny', 'Climowool 039', 'Šikmé strechy, vnútorné steny, stropy, podlahy, vonkajšie steny (fasády), ploché strechy, viacúčelové, technické izolácie a iné.'),
    ('stresne-okna-rooflite', 'Super ceny', 'Strešné okná Rooflite', 'Akcia, super ceny.'),
]
# karty bez letáku: text odkazu
AKCIE_ODKAZ = {'katalog-roduktov__dlazby': 'City Stone Design v katalógu', 'novinky__garaze--zahradne-domceky': 'Garáže a domčeky'}
# letáky odkázané priamo z pôvodnej stránky Akcie (názov podľa textu odkazu v zdroji)
AKCIE_LETAKY = [('pdf/631.pdf', 'Krytina Blachotrapez – akcia, škridloplech, trapézové plechy'), ('pdf/633.pdf', 'Cement 325, 425 – akcia')]
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
SORTIMENT_UVOD = ('V sortimente tovarov v našich stavebninách nájdete produkty popredných slovenských, ale i svetových výrobcov. '
                  'Systém zliav dohodnutý s výrobcami materiálu nám dovoľuje predávať vo výhodných cenách stavebným firmám, individuálnym '
                  'stavebníkom, ako aj spolupracujúcim stavebninám. Materiál dopravíme vlastnou nákladnou dopravou na miesto stavby, ktoré '
                  'určíte, a to v rámci celého Slovenska. V našich stavebninách máte možnosť kúpiť stavebný materiál na splátky cez Quatro '
                  'a úplnou samozrejmosťou je aj platba (cez terminál) platobnými kartami. Tiež vám zdarma vypracujeme cenové ponuky '
                  'a samozrejme aj poradíme.')

NOVINKY_POPIS = {
    'dekoracne-kamene': 'Mramorový okruhliak, Nero Ebono a kamenná kôra v 25 kg vreciach, ceny s DPH.',
    'topstone-oprava-starych-chodnikov': 'Kamenný koberec BIANKA na úpravu schodísk, balkónov, výjazdov, vstupov, dvorov a chodníkov.',
    'delap--ohybny-kamenny-obklad': 'Ohybný obklad z prírodného kameňa, akciová cena 17,80 € za m² s DPH.',
    'magic-floor-vynilova-podlaha': 'Vinylové podlahy Magic Floor do domácnosti aj do prevádzok.',
    'vyrobky-z-plastu': 'Zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu.',
    'garaze--zahradne-domceky': 'Montované plechové garáže na mieru, doprava a montáž v rámci Slovenska zdarma.',
    'ekostyren': 'Ekostyrén, ľahký tepelnoizolačný betón do podláh a striech.',
    'betonove--vyrobky': 'Šalovacie diely, tvárnice a betónové prvky v super cenách.',
}


# Podtitul kategórie s predajným hookom. Len fakty z pôvodného webu (sklad, zľavy, doprava, poradenstvo).
HOOKY = {
    'sypke-zmesy': 'Cement, vápno, malty, omietky a lepidlá od Baumit, Cemmac, Calmit a Holcim. Povieš rozmery, my spočítame vrecia aj palety zadarmo.',
    'murovaci-material': 'Tehly TermoBrik, tvárnice Ytong a Porfix, preklady a stropné systémy. Prines projekt, spočítame kusy na celý dom a dohodneme dopravu na stavbu.',
    'stresne-kritiny': 'Pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo. Pošli plochu strechy, vypočítame potrebu vrátane hrebeňov a doplnkov.',
    'dlazby': 'Zámková dlažba, terasové platne, obrubníky, palisády a ploty. Pri väčšom odbere a pre firmy máme objektové zľavy.',
    'izolacny-material': 'Minerálna vlna, polystyrén, asfaltové pásy a izolácie proti vode a radónu. Poradíme hrúbku a spočítame balíky presne na tvoju plochu.',
    'kominove-systemy': 'Certifikované komíny Stadreko a Schiedel so šamotovou alebo nerezovou vložkou. Komín Stadreko máme priamo na sklade, odber možný ihneď.',
    'stresne-okna': 'Strešné okná Velux, Fakro a Rooflite, výlezy, svetlíky a podkrovné schody. Akcia: okná a schody Fakro so zľavou 20 %.',
    'hutny-material': 'Betonárska oceľ, siete, plechy, profily, rúry, oceľové zárubne a garážové brány. Väčšie množstvá dovezieme priamo na stavbu.',
    'dvere---okna': 'Interiérové, vchodové a bezpečnostné dvere Masonite v siedmich dekoroch. Bežné druhy máme priamo na sklade, ostatné na objednávku.',
    'stavebne-rezivo': 'Dosky, hranoly, foršne, strešné laty, tatranský profil a krovy na mieru. Rezivo je priamo na sklade, v ponuke aj palivové drevo agát.',
    'stavebne-naradie-doplnky': 'Náradie na stavbu, do dielne aj do záhrady, spojovací materiál, mriežky a poklopy. Všetko k materiálu kúpiš na jednom mieste.',
    'podhlady---pvc': 'Zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu. Sme výhradný predajca pre Nitru a okolie.',
    'sadrokartonovy---zateplovaci-system': 'Sadrokartón, profily, polystyrén, sklotex, fólie a strešné doplnky. Polystyrén ti dovezieme domov zdarma.',
    'fasadny-system': 'Omietky a fasádne farby Baumit, Univerbau a Delap, zatepľovacie systémy. Spočítame spotrebu na m² fasády zadarmo.',
    'farby---laky': 'Interiérové a fasádne farby, laky, lepidlá a riedidlá Het, Chemolak, Chemos a Elastik. Čo nie je na sklade, zabezpečíme na požiadanie.',
}


# Opravy preklepov a jednotné názvy značiek v texte (OBS-18, OBS-19, FUN-13). Použijú sa na celý výstup write() pre .html a .json;
# vzory obsahujú medzery alebo veľké písmená, takže sa nedotknú adries (URL a názvy súborov sú malými písmenami).
OPRAVY = [
    (r'Najlacenjší', 'Najlacnejší'), (r'najlacenjší', 'najlacnejší'), (r'ceritifikovan', 'certifikovan'),
    (r'Tenický list', 'Technický list'), (r'Akcivý', 'Akciový'), (r'navod k pokladke', 'návod na pokládku'),
    (r'omietkviny', 'omietkoviny'), (r'porfily', 'profily'), (r'dialničn', 'diaľničn'), (r'Modyly', 'Modely'),
    (r'Otiene', 'Odtiene'), (r'Ekostyrenber[oó]n', 'Ekostyrénbetón'), (r'Ekostyrenbetón', 'Ekostyrénbetón'),
    (r'ekostyrenbetón', 'ekostyrénbetón'), (r'ušľachntil', 'ušľachtil'), (r'Plech vzor skridla', 'Plech vzor škridla'),
    (r'Delap- ohybný kamenný obklad', 'Delap, ohybný kamenný obklad'), (r'Magic floor', 'Magic Floor'),
    (r'Lepidla, omietky', 'Lepidlá, omietky'), (r'splátky Qatro', 'splátky Quatro'), (r'skutočného otieňa', 'skutočného odtieňa'),
    (r'\bTermo[Bb]rik\b', 'TermoBRIK'), (r'\bPORFIX\b', 'Porfix'), (r'\bYTONG\b', 'Ytong'),
    (r'CITY STONE DESIGN|Citystonedesign', 'City Stone Design'), (r'RoofLITE', 'Rooflite'),
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
NAV = [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), ('katalog/index.html', 'Katalóg'), ('novinky/index.html', 'Novinky'), ('sluzby.html', 'Služby'), ('galeria/index.html', 'Galéria'), ('o-nas.html', 'O nás'), ('kontakt.html', 'Kontakt')]


def breadcrumb_ld(path, crumbs):
    """BreadcrumbList pre Google: tie isté položky ako viditeľná navigácia Kde si."""
    if not crumbs: return ''
    items = [{"@type": "ListItem", "position": i + 1, "name": html.unescape(re.sub(r'<[^>]+>', '', t)), "item": url_abs(p or path)} for i, (p, t) in enumerate(crumbs)]
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}, ensure_ascii=False) + '</script>\n'


FARBA = '#faf8f4'   # svetlý podklad webu (theme-color, manifest, ikona)


def prechody_head():
    """Skript prechodov medzi stránkami (zdroj zdroj/prechody.js bez komentárov) a pravidlá prípravy stránky
    (Speculation Rules): cieľ dlaždice katalógu, akcie, zásoby alebo novinky sa začne pripravovať pri dotyku
    (eagerness conservative = pointerdown), takže fotka hlavičky je pri prechode načítaná. Len stránky .html
    toho istého webu, nikdy PDF, subory/, mailto: ani tel:. Rovnaký blok je ručne v index.html (kontrola_uvodu)."""
    s = open(os.path.join(ROOT, 'zdroj', 'prechody.js'), encoding='utf-8').read()
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    riadky = []
    for r in s.split('\n'):
        r = re.sub(r'\s+//\s.*$', '', r).strip()
        if r and not r.startswith('//'): riadky.append(r)
    # zmenšenie: medzery okolo interpunkcie preč (reťazce v úvodzovkách ostávajú bez zmeny), zdroj má bodkočiarky všade
    casti = re.split(r"('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")", ' '.join(riadky))
    for i in range(0, len(casti), 2):
        casti[i] = re.sub(r'\s*([{}()\[\];,=:+\-*/<>!?&|])\s*', r'\1', re.sub(r'\s+', ' ', casti[i]))
    js = ''.join(casti).strip()
    pravidla = {"prerender": [{"where": {"and": [{"selector_matches": "a.cat, a.deal, a.zt, a.nov"}, {"href_matches": "/*.html"}]}, "eagerness": "conservative"}]}
    return '<script>' + js + '</script>\n<script type="speculationrules">' + json.dumps(pravidla, separators=(',', ':')) + '</script>\n'


PRECHODY_HEAD = prechody_head()


def popis(desc, body):
    """Meta description 120–155 znakov: zadaný popis doplnený textom zo začiatku obsahu stránky (bez bočného menu
    a navigácie), dlhší skrátený na celé slovo."""
    t = re.sub(r'(?s)<(aside|nav|script|style)\b.*?</\1>', ' ', body)
    t = text_of(re.sub(r'<(br|/p|/h\d|/li|/div|/td)\b[^>]*>', '. ', t))
    t = re.sub(r'\s+([.,;:])', r'\1', t)
    t = re.sub(r'(\s*\.\s*){2,}', '. ', t).strip(' .')
    d = (desc or '').strip()
    for veta in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ])', t):   # nie za číslom (28. 1. 2026)
        if len(d) >= 120: break
        veta = veta.strip()
        if len(veta) < 3 or veta.lower() in d.lower(): continue
        d = (d + ' ' + veta).strip() if d else veta
        if not re.search(r'[.!?…]$', d): d += '.'
    if len(d) < 120: d = (d + ' Stavebniny Richtárik, Nitra Horné Krškany, stavebný materiál od roku 1997.').strip()
    if len(d) > 155: d = d[:154].rsplit(' ', 1)[0].rstrip(' ,;:–-') + '…'
    return d


def titulok(title):
    """<title> najviac 60 znakov: s príponou | Stavebniny Richtárik Nitra, inak kratšia prípona."""
    if title == 'Stavebniny Richtárik Nitra': return title
    for pr in (' | Stavebniny Richtárik Nitra', ' | Stavebniny Richtárik', ' | Richtárik Nitra'):
        if len(title + pr) <= 60: return title + pr
    return title[:60]


# Fotka v hlavičke podstránky: ostrá, v ráme (počítač vpravo do 520 px, telefón pod textom celou šírkou obsahu, výška 230 px),
# bez stmavenia a bez paralaxy. Skutočné fotky dvora (img/uvod, existujúce šírky AVIF a WebP) a áut firmy (img/p) tam, kde
# ukazujú presne ten tovar alebo firmu; ilustračné fotky img/hd (verzia 1200 px, q80) len pri kategóriách tovaru.
# Výrez: object-position drží palety a tovar v zábere.
UVOD_FOTO = {   # názov: (šírky súborov, rozmer najväčšieho, object-position)
    'zasoba-tehly': ((480, 720, 856), (856, 1070), '50% 42%'),
    'zasoba-porfix': ((480, 720, 900), (900, 1125), '50% 56%'),
    'zasoba-stadreko': ((480, 720, 900), (900, 1125), '50% 45%'),
    'zasoba-rezivo': ((480, 720, 900), (900, 1125), '50% 52%'),
    'pas-dvor': ((1280, 1920), (1920, 1080), '20% 55%'),
    'dvor-predajna': ((800, 1200), (1200, 800), '28% 55%'),
}
FOTO_SIZES = '(max-width:700px) calc(100vw - 36px), (max-width:1000px) 40vw, 520px'
# Fotka hlavičky podľa stránky (prednosť pred head_img volajúceho): skutočný tovar z dvora pri tom istom tovare, dvor pri
# prehľadových stránkach a Kontakte (v tele Kontaktu je iný záber dvora), auto firmy pri Službách; ostatné akcie a novinky
# fotka kategórie tovaru (img/hd). Leták je bez fotky.
HLAVICKA_FOTO = {
    'katalog/index.html': 'uvod:pas-dvor', 'akcie/index.html': 'uvod:pas-dvor', 'galeria/index.html': 'uvod:pas-dvor',
    'kontakt.html': 'uvod:pas-dvor', 'o-nas.html': 'uvod:dvor-predajna', 'sluzby.html': 'p:884',
    'katalog/murovaci-material.html': 'uvod:zasoba-tehly', 'katalog/murovaci-material/pezinske-tehelne.html': 'uvod:zasoba-tehly',
    'katalog/murovaci-material/porfix.html': 'uvod:zasoba-porfix', 'katalog/dlazby.html': 'uvod:zasoba-stadreko',
    'katalog/stavebne-rezivo.html': 'uvod:zasoba-rezivo',
    'akcie/porfix.html': 'uvod:zasoba-porfix', 'akcie/pezinska-tehla-termobrik.html': 'uvod:zasoba-tehly',
    'akcie/dlazby-ploty-stadreko.html': 'uvod:zasoba-stadreko', 'akcie/stavebne-rezivo.html': 'uvod:zasoba-rezivo',
    'akcie/komin-qatro.html': 'komin', 'akcie/krytina-blachotrapez.html': 'strecha', 'akcie/okna-schody-fakro.html': 'okno-strecha',
    'akcie/stresne-okna-rooflite.html': 'okno-strecha', 'akcie/stavebne-naradie.html': 'naradie',
    'akcie/sadrokartonovy-zateplovaci-system.html': 'sadrokarton', 'akcie/ytong.html': 'tehla', 'akcie/betonove-tvarnice.html': 'tehla',
    'akcie/cement-325-r.html': 'cement', 'akcie/sakret.html': 'cement', 'akcie/nobasil.html': 'izolacia',
    'novinky/index.html': 'zahrada', 'novinky/betonove-vyrobky.html': 'tehla', 'novinky/dekoracne-kamene.html': 'dlazba',
    'novinky/topstone-oprava-starych-chodnikov.html': 'dlazba', 'novinky/delap-ohybny-kamenny-obklad.html': 'fasada',
    'novinky/ekostyren.html': 'beton', 'novinky/garaze-zahradne-domceky.html': 'hutny',
    'novinky/magic-floor-vynilova-podlaha.html': 'sadrokarton', 'novinky/vyrobky-z-plastu.html': 'zahrada',
    'letak.html': None,
    # strešné okná: svetlá fotka strešného okna na streche (pôvodná fotka okien bola z 80 % tmavé drevo)
    'katalog/stresne-okna.html': 'okno-strecha', 'katalog/stresne-okna/fakro.html': 'okno-strecha',
    'katalog/stresne-okna/fakro/fakro-schody-vylezy.html': 'okno-strecha',
}


def foto_hlavicky(path, spec):
    """<figure> s fotkou hlavičky. spec: 'uvod:<názov>' (skutočný dvor), 'p:<číslo>' (fotka z pôvodného webu),
    inak '<názov>' alebo 'hd:<názov>' (img/hd, verzia -1200 so srcset na 2400 px)."""
    pre = prefix(path)
    druh, meno = spec.split(':', 1) if ':' in spec else ('hd', spec)
    if druh == 'uvod':
        sir, (w, h), pos = UVOD_FOTO[meno]
        ss = lambda ext: ', '.join(f'{pre}img/uvod/{meno}-{s}.{ext} {s}w' for s in sir)
        img = (f'<picture><source type="image/avif" srcset="{ss("avif")}" sizes="{FOTO_SIZES}">'
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
    return f'<figure class="ph-foto">{img}</figure>'


def page(path, title, body, desc=None, crumbs=None, wide=False, extra_head='', head=None, home=False, head_img=None):
    pre = prefix(path)
    def _nav_a(p, t):
        cur = ' aria-current="page"' if (path == p or (p != "index.html" and path.startswith(p.split("/")[0] + "/"))) else ''
        # podčiarknutie aktívnej položky je samostatný prvok: pri prechode medzi stránkami sa presunie k novej položke
        return f'<a href="{rel(path, p)}"{cur}>{t}<span class="nav-ciara" aria-hidden="true"></span></a>' if cur else f'<a href="{rel(path, p)}">{t}</a>'
    nav = ''.join(_nav_a(p, t) for p, t in NAV)
    dnav = ''.join(f'<a href="{rel(path, p)}">{t}</a>' for p, t in NAV)
    crumb = ''
    if crumbs:
        items = ''.join(f'<li><a href="{rel(path, p)}">{t}</a></li>' if p else f'<li aria-current="page">{t}</li>' for p, t in crumbs)
        crumb = f'<nav class="crumbs" aria-label="Kde si"><ol>{items}</ol></nav>'
    band = ''
    if head:
        kicker, h1, lede = head
        head_img = HLAVICKA_FOTO.get(path, head_img)
        foto = foto_hlavicky(path, head_img) if head_img else ''
        band = f'<section class="page-head{" has-img" if foto else ""}"><div class="wrap">{crumb}<div class="ph-in"><div class="head"><div class="eyebrow">{kicker}</div><h1>{h1}</h1>{f"<p class=lede>{lede}</p>" if lede else ""}</div>{foto}</div></div></section>'
    elif crumb:
        band = f'<section class="page-head"><div class="wrap">{crumb}</div></section>'
    crumb = band
    d = html.escape(popis(desc, (f'<p>{head[2]}</p>' if head and head[2] else '') + body))
    return f'''<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(titulok(title))}</title>
<meta name="description" content="{d}">
<meta name="theme-color" content="{FARBA}">
<meta property="og:title" content="{html.escape(title)} | Stavebniny Richtárik">
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
<link rel="icon" href="{pre}img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{pre}img/apple-touch-icon.png">
<link rel="manifest" href="{pre}manifest.webmanifest">
<link rel="preload" href="{pre}assets/fonts/BarlowCondensed-800-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{pre}assets/fonts/BarlowCondensed-800-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{pre}assets/fonts/Barlow-400-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{pre}assets/fonts/Barlow-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{pre}assets/site.css">
{PRECHODY_HEAD}{breadcrumb_ld(path, crumbs)}{extra_head}
</head>
<body{' class="home"' if home else ''}>
<a class="skip" href="#obsah">Preskočiť na obsah</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="{pre}index.html" aria-label="Stavebniny Richtárik, úvod"><img class="lg-tm" src="{pre}img/logo.png" alt="Stavebniny Richtárik" width="480" height="142"></a>
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
{crumb}
<main id="obsah">
{body}
</main>
<section class="cta-pas">
  <div class="wrap">
    <div><div class="eyebrow light">Cenová ponuka zadarmo</div><h2>Pošli nám zoznam materiálu alebo projekt</h2><p>Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu na stavbu.</p></div>
    <div class="cta"><a class="btn primary" href="mailto:{FIRMA['email']}?subject=Cenov%C3%A1%20ponuka">Poslať dopyt e-mailom</a><a class="btn light" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
  </div>
</section>
<footer>
  <div class="wrap grid">
    <div class="f-firma"><img src="{pre}img/logo.png" alt="Stavebniny Richtárik" width="200" height="59" class="flogo" loading="lazy" decoding="async"><p>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</p><p>IČO {FIRMA['ico']} · DIČ {FIRMA['dic']}</p></div>
    <details class="f-zb" open><summary>Stránky</summary>{dnav}</details>
    <details class="f-zb" open><summary>Katalóg</summary>{''.join(f'<a href="{rel(path, "katalog/" + nice_slug(k[0]) + ".html")}">{k[1]}</a>' for k in KATEGORIE[:8])}<a href="{rel(path, 'katalog/index.html')}">Celý katalóg</a></details>
    <div class="f-kontakt"><h3>Kontakt</h3><a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a class="mail" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a><p>Po – Pi 7:00 – 16:00<br>So 7:00 – 12:00</p></div>
  </div>
  <div class="wrap bottom"><span>© <span id="rok">2026</span> {FIRMA['majitel']}, Nitra</span><a href="{rel(path, 'letak.html')}">Akciový leták</a></div>
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


def write(path, content):
    if path == 'index.html':  # poistka: úvod sa udržiava ručne (README, časť Úvod), generátor ho nikdy neprepíše
        raise SystemExit('build.py: index.html (úvod) sa negeneruje, upravuje sa ručne')
    if path.endswith(('.html', '.json')): content = opravy(content)
    if path.endswith('.html'): content = rozmery(nadpisy(content), path)
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(content)


# ---------- jednotlivé typy stránok ----------
# Dlaždice kategórií (úvod aj Katalóg): fotka hore, svetlý popisný pás pod ňou (bez tmavého prechodu). Rozloženie „bento“:
# prvá veľká (2×2), šiesta a jedenásta široké (2×1) – 15 dlaždíc vyplní 4 stĺpce bez diery. Murovací materiál, rezivo
# a dlažby majú skutočné fotky z dvora (img/uvod, AVIF + WebP), ostatné ilustračnú fotku kategórie (900 px, veľká a široká
# dlaždica 1200 px z img/hd, aby bola ostrá aj na počítači s DPR 2).
DLAZDICA_UVOD = {'murovaci-material': 'zasoba-tehly', 'stavebne-rezivo': 'zasoba-rezivo', 'dlazby': 'zasoba-stadreko'}


def dlazdice(path, cisla=False):
    """Dlaždice kategórií (úvod ručne aj Katalóg). Skutočné fotky z dvora sú v <picture>: AVIF 720 (src aj prvý zdroj),
    WebP 720 pre prehliadač bez AVIF; ostatné kategórie majú ilustračnú fotku (img/hd, 1200 px pri veľkej a širokej)."""
    pre = prefix(path); out = ''
    for n, k in enumerate(KATEGORIE):
        cls = ' big' if n == 0 else (' wide' if n in (5, 10) else '')
        if k[0] in DLAZDICA_UVOD:
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
<div class="search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Hľadaj: cement, Ytong, škridla, Fakro, polystyrén…" autocomplete="off" aria-controls="res" aria-expanded="false" aria-describedby="res-stav"><div class="res" id="res" role="region" aria-label="Výsledky hľadania" hidden></div><p class="vh" id="res-stav" role="status" aria-live="polite"></p></div>
<div class="cats">{cards}</div>
<div class="txt rv" style="margin-top:32px"><p>{SORTIMENT_UVOD}</p></div>
<div class="sort-note"><p>Nenašiel si, čo hľadáš? Zavolaj, poradíme.</p><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a></div>
</div></section>'''
    write(path, page(path, 'Katalóg produktov', body, 'Katalóg stavebného materiálu Stavebniny Richtárik Nitra: sypké zmesi, murivo, krytiny, dlažby, izolácie, komíny, okná, hutný materiál, rezivo, náradie, sadrokartón, fasády, farby.', [('index.html', 'Úvod'), (None, 'Katalóg')], head=('Katalóg', 'Všetko na stavbu od základov po strechu', 'Produkty popredných slovenských aj svetových výrobcov. Vyber kategóriu alebo hľadaj podľa názvu výrobku či značky.'), head_img='uvod:pas-dvor'))


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
    lede = HOOKY.get(parts[0], cat[2]) if len(parts) == 1 else None
    if len(parts) == 1 and cont.strip():
        cont = '<h2 class="sh rv"><span>Značky, ktoré máme v ponuke</span></h2>' + cont
    if len(parts) == 1 and parts[0] in PONUKA_UVOD:
        cont += f'<h2 class="sh rv"><span>{PONUKA_NADPIS}</span></h2><div class="txt rv"><p>{html.escape(PONUKA_UVOD[parts[0]])}</p></div>'
    body = f'''<section class="sec kat-page"><div class="wrap two">
{sidebar(path, slug)}
<div class="main">
<div class="content">{cont}</div>
{subs}
<div class="kat-cta"><p>Chceš cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject={quote(title)}">Napísať e-mail</a></div></div>
</div></div></section>'''
    write(path, page(path, title, body, f'{title}. Stavebniny Richtárik Nitra, {cat[3]}.', crumbs, head=('Katalóg' if len(parts) == 1 else cat[1], title, lede), head_img=cat[4]))


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
    write(path, page(path, 'Akcie', body, 'Akcie Stavebniny Richtárik Nitra: TermoBRIK, komín Stadreko, Blachotrapez, City Stone Design, Fakro, Porfix, Ytong, cement, rezivo, náradie.', [('index.html', 'Úvod'), (None, 'Akcie')], head=('Akcie', 'Aktuálne akcie na vybrané druhy výrobkov', ZLAVA_AKCIE), head_img='uvod:pas-dvor'))
    karty = {s: (tag, h, p) for s, tag, h, p in AKCIE_KARTY}
    for s in children('akcie'):
        p = PAGES[s]; t = nice_title(SRC[s]['title'])
        k = s.split('__')[1]
        tag, h, popis = karty.get(k, ('Akcia', t, ''))
        pr = parser(p); bl = pr.blocks(SRC[s]['html'])
        imgs = [x for kind, v in bl if kind == 'images' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['imgs']]
        pdfs = [x for kind, v in bl if kind == 'pdfs' for x in v] + [x for kind, v in bl if kind == 'item' for x in v['pdfs']]
        pdfs = [x for x in pdfs if os.path.basename(x[0]) not in PDF_MRTVE]
        letak = ''
        if imgs:
            i, alt = imgs[0]
            letak = f'<figure class="letak rv"><a href="{pr._src(i)}" data-lb="1" data-cap="{html.escape(h)}"><img src="{pr._src(i)}" alt="Leták akcie {html.escape(h)}" width="{IMG_SIZES.get(i, (0, 0))[0]}" height="{IMG_SIZES.get(i, (0, 0))[1]}"></a><figcaption>Leták akcie, klikni pre zväčšenie</figcaption></figure>'
        others = ''.join(f'<a href="{rel(p, PAGES["akcie__" + s2])}"><span class="tag">{tag2}</span><b>{h2}</b></a>' for s2, tag2, h2, _ in AKCIE_KARTY if s2 != k and '__' not in s2 and 'akcie__' + s2 in PAGES)
        body = f'''<section class="sec akcia"><div class="wrap two">
<div class="main">
<div class="akcia-tag"><span class="tag">{tag}</span><span>{ZLAVA_AKCIE}</span></div>
{letak}
<div class="pdfs rv">{''.join(pr._pdf(hh, tt) for hh, tt in pdfs)}<a class="pdf" href="{rel(p, CENNIK_PDF)}" target="_blank" rel="noopener"><span>{CENNIK_TEXT}</span></a></div>
<div class="kat-cta rv"><p>Chceš akciovú cenu na konkrétne množstvo? Zavolaj alebo napíš, cenovú ponuku spravíme zadarmo.</p><div class="cta"><a class="btn primary" href="tel:{FIRMA['mobil_tel']}">Zavolať {FIRMA['mobil']}</a><a class="btn ghost" href="mailto:{FIRMA['email']}?subject={quote('Akcia ' + h)}">Napísať e-mail</a></div></div>
</div>
<aside class="side"><div class="side-in"><h2>Ďalšie akcie</h2><div class="others">{others}</div><a class="btn ghost small" href="{rel(p, 'akcie/index.html')}">Všetky akcie</a></div></aside>
</div></section>'''
        write(p, page(p, h + ' v akcii', body, f'Akcia {h}: {popis} Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), ('akcie/index.html', 'Akcie'), (None, h)], head=('Akcia', h, popis), head_img=None))


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
    write(path, page(path, 'Novinky', body, 'Novinky v ponuke Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), (None, 'Novinky')], head=('Novinky', 'Čo sme pridali do ponuky', 'Nové materiály, dekoračné kamene, montované garáže a výrobky z recyklovaného plastu.'), head_img=None))
    for s in children('novinky'):
        p = PAGES[s]; t = nice_title(SRC[s]['title']); k = s.split('__')[1]
        cont = cennik_kamene(s) if k == 'dekoracne-kamene' else lb_fotky(content(s, p), t)
        body = f'''<section class="sec novinka-page"><div class="wrap">
<div class="content">{cont}</div>
<p class="back"><a href="{rel(p, 'novinky/index.html')}">Všetky novinky</a></p>
</div></section>'''
        write(p, page(p, t, body, f'{t}. Novinka v ponuke Stavebniny Richtárik Nitra.', [('index.html', 'Úvod'), ('novinky/index.html', 'Novinky'), (None, t)], head=('Novinka', t, NOVINKY_POPIS.get(k, None)), head_img=None))


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


# Prvá sekcia galérie: skutočné fotky dvora (tie isté ako na úvode). Popisky z úvodu (pás Plná zásoba, fotka pri kontakte).
GALERIA_DVOR = [('dvor-predajna', 'Dvor predajne Stavebniny Richtárik v Nitre s paletami TermoBRIK a Porfix'),
                ('pas-dvor', 'Dvor predajne Stavebniny Richtárik v Nitre'),
                ('zasoba-tehly', 'Tehly TermoBRIK'), ('zasoba-porfix', 'Pórobetón Porfix'),
                ('zasoba-stadreko', 'Dlažba a obrubníky Stadreko'), ('zasoba-rezivo', 'Stavebné rezivo')]


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
    return f'<div class="album"><h2 class="sh rv"><span>Z nášho dvora v Nitre</span><small>{len(GALERIA_DVOR)} fotografií</small></h2><div class="galeria dvor rv">{g}</div></div>'


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
                  f'<img src="{rel(path, "img/gt/" + i + ".webp")}" alt="{html.escape(t)}, fotografia {n}" loading="lazy" width="{w}" height="{h}"></a>')
        g = f'<div class="galeria rv">{g}</div>'
        secs += f'<div class="album"><h2 class="sh rv"><span>{t}</span><small>{g.count("data-lb")} fotografií</small></h2>{g}</div>'
    body = f'''<section class="sec"><div class="wrap">
{galeria_dvor(path)}
{secs}
</div></section>'''
    write(path, page(path, 'Galéria', body, 'Fotogaléria Stavebniny Richtárik Nitra: predajňa a sklad v Horných Krškanoch a výstavy Agrokomplex, Gardenia a Domexpo v Nitre.', [('index.html', 'Úvod'), (None, 'Galéria')], head=('Galéria', 'Z predajne, skladu a výstav', 'Fotografie z predajne a skladu a z výstav Agrokomplex, Gardenia a Domexpo v Nitre, kde sme vystavovali náš sortiment.'), head_img='uvod:pas-dvor'))


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
SLUZBY_UVOD = ('Snažíme sa všetkým zákazníkom vyjsť v ústrety a zabezpečiť Vašu úplnú spokojnosť. Aj vďaka tomu neustále '
               'rozširujeme a skvalitňujeme všetky ponúkané služby:')
SLUZBY = [
    ('Predaj stavebného materiálu v celom sortimente', 'Produkty popredných slovenských aj svetových výrobcov.'),
    ('Bezplatný výpočet spotreby stavebného materiálu', 'Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu na stavbu.'),
    ('Bezplatná poradenská činnosť', 'Zaškolený personál Vám vždy s ochotou poradí pri výbere z veľmi širokého sortimentu ponúkaných materiálov a výrobkov.'),
    ('Poskytovanie množstevných zliav', 'Pri väčšom odbere a pre stavebné firmy, živnostníkov a spolupracujúce stavebniny špeciálne ceny.'),
    ('Doprava', 'Vami zakúpený tovar dovezieme priamo k Vám – bez zbytočného skladovania, čím sa znižuje riziko poškodenia pri '
                'viacnásobnom prekladaní. Na rozvoz tovaru máme k dispozícii: AVIA 3,5 tony a LIAZ 8 ton s mechanickou rukou.'),
    ('Predaj na splátky Quatro', 'V našich stavebninách máte možnosť kúpiť stavebný materiál na splátky cez Quatro.'),
    ('Platba cez terminál VUB banka', 'Úplnou samozrejmosťou je aj platba (cez terminál) platobnými kartami.'),
]
SLUZBY_FOTKY = ['885', '884', '883']


def build_sluzby():
    p = PAGES['sluzby']
    polozky = ''.join(f'<article class="srv rv"><i>{n:02d}</i><div><h3>{html.escape(t)}</h3><p>{html.escape(d)}</p></div></article>' for n, (t, d) in enumerate(SLUZBY, 1))
    cap = 'Vlastné autá s mechanickou rukou'
    fotky = ''.join(f'<a href="{rel(p, "img/p/" + i + ".webp")}" data-lb="1" data-cap="{cap}"><img src="{rel(p, "img/p/" + i + ".webp")}" alt="{cap}" loading="lazy" decoding="async" width="{IMG_SIZES[i][0]}" height="{IMG_SIZES[i][1]}"></a>' for i in SLUZBY_FOTKY)
    body = f'''<section class="sec sluzby-page"><div class="wrap">
<div class="srv-grid"><p class="lede rv">{SLUZBY_UVOD}</p><div class="srvs">{polozky}</div></div>
<h2 class="sh rv"><span>Vlastné autá s mechanickou rukou</span></h2>
<div class="auta rv">{fotky}</div>
</div></section>'''
    write(p, page(p, 'Služby', body, None, [('index.html', 'Úvod'), (None, 'Poradíme, spočítame, dovezieme')], head=('Služby', 'Poradíme, spočítame, dovezieme', None), head_img='p:884'))


# O nás: pás faktov z úvodu (index.html, pás „V skratke“; texty doslova)
FAKTY_ONAS = ('<div class="facts n3 rv" aria-label="V skratke"><div><b>1997</b><span>rodinná firma v stavebninách od roku 1997</span></div>'
              '<div><b><i>5</i> %</b><span>zľava z akciových cien pri platbe v hotovosti (zákaznícka karta)</span></div>'
              '<div><b><i>3,3</i> %</b><span>zľava z akciových cien pri platbe platobnou kartou (zákaznícka karta)</span></div></div>')


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
<div class="pdfs rv">{pdf('pdf/386.pdf', 'Akciový leták 1 – Stavebniny Richtárik')}{pdf('pdf/385.pdf', 'Akciový leták 2 – Stavebniny Richtárik')}{pdf('pdf/197.pdf', 'Leták Stavebniny Richtárik')}</div>
<div class="figs rv n2">{fig('886', 'Akciový leták 1')}{fig('887', 'Akciový leták 2')}</div>
<h2 class="sh rv"><span>Reklama</span></h2>
<div class="figs rv n2">{fig('360', 'Reklama Spravodaj Nitra 2010')}{fig('361', 'Reklamná tabuľa – plot')}</div>
</div>
</div></section>'''
    write(p, page(p, 'Akciový leták', body, None, [('index.html', 'Úvod'), (None, 'Akciové letáky na stiahnutie')],
                  head=('Akciový leták', 'Akciové letáky na stiahnutie', 'Cenník aktuálnych akcií z 28.\u00a01.\u00a02026 a staršie akciové letáky na stiahnutie.'), head_img=None))


def build_404():
    """Stránka 404 pre hosting v koreni domény: odkazy a zdroje od koreňa (/…), aby fungovala na každej neexistujúcej
    adrese (aj /a/b/c.html). Bez canonical, s noindex; nastavenie servera je v nasadenie/ (ErrorDocument, httpErrors)."""
    p = '404.html'
    body = f'''<section class="sec"><div class="wrap narrow">
<div class="head" style="margin-bottom:28px"><div class="eyebrow">Chyba 404</div><h1>Stránka sa nenašla</h1><p class="lede">Adresa, ktorú hľadáš, na webe nie je. Vyber, kam pokračovať, alebo hľadaj v katalógu.</p></div>
<div class="search"><label for="q" class="vh">Hľadať v katalógu</label><input id="q" type="search" placeholder="Hľadaj: cement, Ytong, škridla, Fakro, polystyrén…" autocomplete="off" aria-controls="res" aria-expanded="false" aria-describedby="res-stav"><div class="res" id="res" role="region" aria-label="Výsledky hľadania" hidden></div><p class="vh" id="res-stav" role="status" aria-live="polite"></p></div>
<div class="cta" style="margin-top:28px"><a class="btn primary" href="index.html">Úvod</a><a class="btn ghost" href="katalog/index.html">Katalóg</a><a class="btn ghost" href="akcie/index.html">Akcie</a><a class="btn ghost" href="kontakt.html">Kontakt</a></div>
<p style="margin-top:28px">Poradíme aj po telefóne <a href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a></p>
</div></section>'''
    t = page(p, 'Stránka sa nenašla', body, 'Stránka sa nenašla. Stavebniny Richtárik, Nitra Horné Krškany.', None)   # svetlá stránka bez tmavej hlavičky
    t = re.sub(r'<title>.*?</title>', '<title>Stránka sa nenašla | Stavebniny Richtárik</title>', t)
    t = re.sub(r'<link rel="canonical"[^>]*>\n|<meta property="og:url"[^>]*>\n', '', t)
    t = t.replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"', 1)
    # relatívne adresy na adresy od koreňa domény
    t = re.sub(r'(\s(?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:)([^"]+)"', r'\1/\2"', t)
    write(p, t)


def build_kontakt():
    p = 'kontakt.html'
    body = f'''<section class="sec kontakt-page"><div class="wrap">
<div class="kgrid">
  <div class="kbox"><h3>Predajňa a sklad</h3><address>{FIRMA['majitel']}<br>{FIRMA['ulica']}<br>{FIRMA['mesto']}</address><a class="btn ghost small" href="{FIRMA['mapa']}" target="_blank" rel="noopener">Otvoriť v mapách</a></div>
  <div class="kbox"><h3>Zavolaj alebo napíš</h3><a class="big" href="tel:{FIRMA['mobil_tel']}">{FIRMA['mobil']}</a><a class="big" href="tel:{FIRMA['pevna_tel']}">{FIRMA['pevna']}</a><a class="mail" href="mailto:{FIRMA['email']}">{FIRMA['email']}</a></div>
  <div class="kbox khod"><h3>Otváracie hodiny</h3><table class="hours"><tr><td>Pondelok – piatok</td><td>7:00 – 16:00</td></tr><tr><td>Sobota</td><td>7:00 – 12:00</td></tr></table></div>
  <div class="kbox kfir"><h3>Firemné údaje</h3><address>IČO {FIRMA['ico']}<br>DIČ {FIRMA['dic']}<br>Platba kartou cez terminál VÚB<br>Nákup na splátky Quatro</address></div>
  <figure class="kdvor"><picture><source type="image/avif" srcset="img/uvod/dvor-predajna-800.avif 800w, img/uvod/dvor-predajna-1200.avif 1200w" sizes="(max-width:700px) calc(100vw - 36px), 600px"><img src="img/uvod/dvor-predajna-1200.webp" srcset="img/uvod/dvor-predajna-800.webp 800w, img/uvod/dvor-predajna-1200.webp 1200w" sizes="(max-width:700px) calc(100vw - 36px), 600px" alt="Dvor predajne Stavebniny Richtárik v Nitre s paletami TermoBRIK a Porfix" loading="lazy" decoding="async" width="1200" height="800"></picture><figcaption><span>Novozámocká 62/68, Nitra, Horné Krškany</span><a class="btn primary small" href="{FIRMA['mapa']}" target="_blank" rel="noopener">Otvoriť navigáciu</a></figcaption></figure>
</div>

</div></section>'''
    write(p, page(p, 'Kontakt', body, 'Kontakt Stavebniny Richtárik: Novozámocká 62/68, Nitra Horné Krškany, 0905 622 223, 037 651 17 77, otvorené Po – Pi 7:00 – 16:00, So 7:00 – 12:00.', [('index.html', 'Úvod'), (None, 'Kontakt')], head=('Kontakt', 'Príď k nám do Horných Krškán', 'Pozývame vás do našej predajne v Nitre-Horných Krškanoch na Novozámockej ulici č. 68, kde vám radi pomôžeme pri výbere z nášho sortimentu.'), head_img='uvod:pas-dvor'))


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
    stranky = sorted({p for p in PAGES.values() if p != 'index.html' and os.path.exists(os.path.join(OUT, p))} | {'katalog/index.html', 'novinky/index.html'})
    slug_of = {v: k for k, v in PAGES.items()}
    for p in stranky:
        h = open(os.path.join(OUT, p), encoding='utf-8').read()
        doc = LH.fromstring(h)
        h1 = doc.xpath('//h1')
        t = re.sub(r'\s+', ' ', h1[0].text_content()).strip() if h1 else nice_title(p)
        lede = ' '.join(re.sub(r'\s+', ' ', e.text_content()).strip() for e in doc.xpath('//section[contains(@class,"page-head")]//p[contains(@class,"lede")]'))
        main = doc.xpath('//main')
        for e in (main[0].xpath('.//aside|.//nav|.//script|.//*[contains(@class,"search")]|.//*[contains(@class,"kat-cta")]') if main else []):
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


def build_sitemap():
    """sitemap.xml so všetkými HTML stránkami (aj úvodom, ktorý sa negeneruje) a robots.txt s odkazom naň."""
    stranky = sorted({'index.html', 'katalog/index.html', 'novinky/index.html'} | {p for p in PAGES.values() if os.path.exists(os.path.join(OUT, p))})
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join(f'  <url><loc>{html.escape(url_abs(p))}</loc></url>\n' for p in stranky) + '</urlset>\n'
    write('sitemap.xml', xml)
    write('robots.txt', f'User-agent: *\nAllow: /\n\nSitemap: {DOMENA}sitemap.xml\n')
    return len(stranky)


# priečinok odstráneného videa s autom a jeho obrázok pri zdieľaní (skladá sa z častí, aby kontrola nenašla samu seba)
STARE_VIDEO = 'img/' + 'fi' + 'lm' + '|' + 'uvod/' + r'og\.jpg'


def kontrola_uvodu():
    """Úvod (index.html) je ručne udržiavaný, build.py ho neprepisuje. Upozorní, keď sa menu alebo údaje firmy
    v build.py zmenili a v úvode nie sú (treba ich doplniť ručne), a skontroluje celý web: žiadny odkaz na staré
    video s autom ani na jeho obrázok pri zdieľaní, og obrázok dvora na každej stránke, na úvode práve jeden H1 so slovom
    „Stavebniny“ (SEO) a og aj JSON-LD obrázok dvora."""
    s = open(os.path.join(OUT, 'index.html'), encoding='utf-8').read()
    chyba = [p for p, t in NAV if p != 'index.html' and f'href="{p}">{t}<' not in s]
    chyba += [v for k, v in FIRMA.items() if k not in ('mapa',) and v not in s and html.escape(v) not in s]
    stranky = bez_og = 0; stare = []; bez_prechodu = []
    for kor, dirs, subory in os.walk(OUT):
        dirs[:] = [x for x in dirs if x not in ('img', 'pdf', 'subory', 'zdroj', 'nasadenie', '__pycache__', '.git')]
        for f in subory:
            if not f.endswith(('.html', '.css', '.js', '.json', '.webmanifest', '.xml')): continue
            t = open(os.path.join(kor, f), encoding='utf-8', errors='replace').read()
            if re.search(STARE_VIDEO, t): stare.append(os.path.relpath(os.path.join(kor, f), OUT))
            if f.endswith('.html'):
                stranky += 1
                if f'{DOMENA}{OG_IMG[0]}' not in t: bez_og += 1
                if t.count("'pagereveal'") != 1: bez_prechodu.append(os.path.relpath(os.path.join(kor, f), OUT))
    if PRECHODY_HEAD not in s: chyba.append('úvod: skript prechodov v <head> sa nezhoduje so zdroj/prechody.js (vlož výstup prechody_head())')
    if bez_prechodu: chyba.append('skript prechodov nie je práve raz: ' + ', '.join(bez_prechodu[:5]))
    if stare: chyba.append('odkaz na staré video alebo og.jpg: ' + ', '.join(stare[:5]))
    if bez_og: chyba.append(f'og obrázok {OG_IMG[0]} chýba na {bez_og} z {stranky} stránok')
    h1 = re.findall(r'<h1[ >].*?</h1>', s, re.S)
    if len(h1) != 1 or 'Stavebniny' not in h1[0]: chyba.append(f'úvod: H1 {len(h1)}×, so slovom Stavebniny: {bool(h1) and "Stavebniny" in h1[0]}')
    if s.count(f'{DOMENA}{OG_IMG[0]}') < 2: chyba.append('úvod: og:image alebo JSON-LD image nie je og obrázok dvora')
    if chyba: print('POZOR: kontrola úvodu (doplň ručne):', chyba)
    else: print(f'kontrola úvodu: OK (stránok {stranky}, og obrázok dvora na všetkých, H1 1×, bez starého videa, skript prechodov 1× na každej)')
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
    build_simple('o-nas', 'O nás', 'Rodinná firma od roku 1997', extra=FAKTY_ONAS, head_img='uvod:dvor-predajna')
    build_sluzby()
    build_letak()
    build_kontakt()
    build_404()
    build_search_index()
    print('stránok v sitemap.xml:', build_sitemap())
    if obsah.CHYBAJUCE: print('vynechané odkazy na súbory, ktoré už neexistujú:', ' '.join(sorted(obsah.CHYBAJUCE)))
    kontrola_uvodu()
    print('stránok:', len(PAGES))
