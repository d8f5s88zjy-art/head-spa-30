# Texty webu Stavebniny Richtárik, ktoré nie sú v zdroji (zdroj/pages.json): záväzné názvy značiek, nadpisy H1,
# titulky a popisy stránok pre vyhľadávače a úprava písania v textoch zo zdroja (verzálky, jednotky, pomlčky, preklepy).
#
# Pravidlá (README, časť Texty a SEO):
# - Web vyká malými písmenami („vy, vám, váš“), firma hovorí „my“, tlačidlá sú v neurčitku („Zavolať 0905 622 223“).
# - Len fakty z pôvodného webu (zdroj/pages.json) a z cenníka akcií pdf/662.pdf (28. 1. 2026). Žiadne superlatívy ako
#   naše tvrdenie, žiadne čísla, ktoré zdroj nemá. Tvrdenia výrobcov len s pripísaním výrobcovi a nie v popisoch stránok.
# - H1 má 2 až 7 slov a najviac 45 znakov, titulok najviac 60 znakov vo vzore „… | Stavebniny Richtárik Nitra“,
#   popis stránky 120 až 155 znakov z celých viet (build.py to pri každom behu skontroluje).
import re, html

PRIPONA = ' | Stavebniny Richtárik Nitra'

# ---------- názvy značiek (záväzné tvary) ----------
# Názov značky na karte v katalógu je zo zdroja (tučný text v tabuľke značiek, často verzálkami). Kľúč: názov zo zdroja
# malými písmenami, hodnota: tvar, ktorý používa výrobca a pôvodný web v texte.
NAZVY_ZNACIEK = {
    'pezinské tehelne': 'Pezinské tehelne', 'stavebné profily': 'Stavebné profily', 'km beta': 'KM Beta',
    'ico pal': 'Icopal', 'icopal': 'Icopal', 'knaufinsulation': 'Knauf Insulation', 'haco': 'DS Haco',
    'recykling': 'Transform Recykling', 'dlažby - city stone design': 'City Stone Design',
    'qatro': 'Stadreko (komínový systém Qatro)', 'betonárka nadlice': 'Betonárka Nadlice',
}


def nazov_znacky(meno):
    """Záväzný tvar názvu značky; neznámy názov verzálkami dostane veľké začiatočné písmená slov."""
    k = re.sub(r'\s+', ' ', meno).strip().lower()
    if k in NAZVY_ZNACIEK: return NAZVY_ZNACIEK[k]
    return meno.title() if meno.isupper() else meno


# ---------- nadpisy, titulky a popisy stránok ----------
# h1: nadpis stránky (ak chýba, ostáva názov zo zdroja alebo kategórie), t: začiatok titulku pred príponou
# (najviac 60 − 28 = 32 znakov), d: popis pre vyhľadávače (120 – 155 znakov, celé vety).
STRANKY = {
    # prehľady a stránky firmy
    'katalog/index.html': dict(h1='Katalóg stavebného materiálu', t='Katalóg stavebného materiálu',
        d='Katalóg stavebného materiálu v Nitre: 15 kategórií a viac ako 40 značiek od základov po strechu. Výpočet spotreby a cenová ponuka zadarmo.'),
    'akcie/index.html': dict(t='Akcie na stavebný materiál',
        d='Aktuálne akcie Stavebnín Richtárik v Nitre podľa cenníka z 28. 1. 2026: komín Stadreko, krytina Blachotrapez, cement, tvárnice, rezivo a ďalšie.'),
    'novinky/index.html': dict(h1='Novinky v sortimente', t='Novinky v sortimente',
        d='Novinky v sortimente Stavebnín Richtárik v Nitre: dekoračné kamene, ohybný obklad Delap, kamenný koberec Bianka, garáže a výrobky z plastu.'),
    'galeria/index.html': dict(t='Fotogaléria predajne a skladu',
        d='Fotogaléria Stavebnín Richtárik: dvor a predajňa v Nitre – Horných Krškanoch a výstavy Domexpo, Agrokomplex a Gardenia, kde sme vystavovali.'),
    'kontakt.html': dict(h1='Predajňa a sklad v Nitre – Horných Krškanoch', t='Kontakt a otváracie hodiny',
        d='Stavebniny Richtárik, Novozámocká 62/68, Nitra – Horné Krškany. Telefón 0905 622 223. Otvorené pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00.'),
    'sluzby.html': dict(h1='Výpočet materiálu, poradenstvo a doprava', t='Výpočet materiálu a poradenstvo',
        d='Služby Stavebnín Richtárik v Nitre: bezplatný výpočet spotreby, poradenstvo a cenová ponuka, množstevné zľavy, doprava, platba kartou a splátky.'),
    'o-nas.html': dict(t='O nás – rodinná firma od 1997',
        d='Stavebniny Richtárik sú rodinná firma z Nitry založená v roku 1997. Predávame stavebný materiál, poradenstvo a cenové ponuky sú u nás zadarmo.'),
    'letak.html': dict(t='Akciový leták a cenník akcií',
        d='Akciové letáky Stavebnín Richtárik na stiahnutie: cenník akcií z 28. 1. 2026 vo formáte PDF, staršie letáky a reklama v Spravodaji Nitra.'),
    'doprava.html': dict(h1='Doprava materiálu po celom Slovensku', t='Doprava stavebného materiálu',
        d='Doprava stavebného materiálu po celom Slovensku vlastnými autami Avia 3,5 t a 8 t s mechanickou rukou. Dovezieme na miesto, ktoré určíte.'),
    'caste-otazky.html': dict(h1='Časté otázky', t='Časté otázky o doprave a zľavách',
        d='Časté otázky o Stavebninách Richtárik v Nitre: doprava po Slovensku, zákaznícka karta a zľavy, platba kartou, splátky a cenová ponuka zadarmo.'),
    '404.html': dict(t='Stránka sa nenašla',
        d='Stránka sa nenašla. Pokračujte do katalógu, na akcie alebo nám zavolajte na 0905 622 223. Stavebniny Richtárik, Nitra – Horné Krškany.'),

    # kategórie katalógu (H1 = názov kategórie)
    'katalog/sypke-zmesy.html': dict(t='Cement, vápno, malty a lepidlá',
        d='Sypké zmesi v Nitre: cement, vápno, malty, omietky a lepidlá Baumit, Cemmac, Calmit a Holcim. Výpočet spotreby a cenová ponuka zadarmo.'),
    'katalog/murovaci-material.html': dict(t='Tehly, tvárnice Ytong a Porfix',
        d='Murovací materiál v Nitre: tehly TermoBRIK, tvárnice Ytong a Porfix, preklady a stropné systémy. Výpočet spotreby a cenová ponuka zadarmo.'),
    'katalog/stresne-kritiny.html': dict(t='Strešné krytiny Tondach, Bramac',
        d='Strešné krytiny v Nitre: pálené a betónové škridly Tondach a Bramac, plechové krytiny a asfaltové pásy. Výpočet krytiny a cenová ponuka zadarmo.'),
    'katalog/dlazby.html': dict(t='Zámková dlažba, obrubníky, ploty',
        d='Dlažby a ploty v Nitre: zámková dlažba, terasové platne, obrubníky, palisády a ploty City Stone Design, Premac a Stadreko. Cenová ponuka zadarmo.'),
    'katalog/izolacny-material.html': dict(t='Polystyrén a minerálna vlna',
        d='Izolačný materiál v Nitre: minerálna vlna, polystyrén, asfaltové pásy a izolácie proti vode a radónu. Výpočet spotreby a cenová ponuka zadarmo.'),
    'katalog/kominove-systemy.html': dict(t='Komíny Stadreko a Schiedel',
        d='Komínové systémy v Nitre: certifikované komíny Stadreko a Schiedel so šamotovou alebo nerezovou vložkou. Komín Stadreko máme priamo na sklade.'),
    'katalog/stresne-okna.html': dict(t='Strešné okná Velux, Fakro',
        d='Strešné okná v Nitre: Velux, Fakro a RoofLITE, výlezy, svetlíky a podkrovné schody. Poradíme vám s výberom a cenovú ponuku pripravíme zadarmo.'),
    'katalog/hutny-material.html': dict(t='Hutný materiál a betonárska oceľ',
        d='Hutný materiál v Nitre: betonárska oceľ, siete, plechy, profily, rúry, oceľové zárubne a garážové brány. Cenová ponuka zadarmo, doprava na stavbu.'),
    'katalog/dvere-okna.html': dict(t='Dvere Masonite a drevené okná',
        d='Dvere a okná v Nitre: interiérové, vchodové a bezpečnostné dvere Masonite v siedmich dekoroch. Bežné druhy máme na sklade, ostatné na objednávku.'),
    'katalog/stavebne-rezivo.html': dict(t='Stavebné rezivo a krovy na mieru',
        d='Stavebné rezivo v Nitre priamo na sklade: dosky, hranoly, foršne, strešné laty, tatranský profil a krovy na mieru. V ponuke aj palivové drevo agát.'),
    'katalog/stavebne-naradie-doplnky.html': dict(t='Stavebné náradie a doplnky',
        d='Náradie a doplnky v Nitre: stavebné, elektrické a záhradné náradie, spojovací materiál, mriežky a poklopy Slovakia Trend a DS Haco. Poradíme vám.'),
    'katalog/podhlady-pvc.html': dict(t='Podhľady a výrobky z plastu',
        d='Podhľady a PVC v Nitre: zatrávňovacie dlažby, chodníky, plotovky, profily a palety z recyklovaného plastu. Výhradný predajca pre Nitru a okolie.'),
    'katalog/sadrokartonovy-zateplovaci-system.html': dict(t='Sadrokartón a zateplenie',
        d='Sadrokartón a zateplenie v Nitre: suchá výstavba, profily, polystyrén, sklotex, fólie a strešné doplnky Masterplast. Cenová ponuka zadarmo.'),
    'katalog/fasadny-system.html': dict(t='Fasádne omietky a zateplenie',
        d='Fasádny systém v Nitre: silikónové, silikátové a mozaikové omietky, fasádne farby a zatepľovacie systémy Baumit, Univerbau a Delap. Poradíme vám.'),
    'katalog/farby-laky.html': dict(t='Farby, laky a riedidlá',
        d='Farby a laky v Nitre: interiérové a fasádne farby, laky, lepidlá a riedidlá Het, Chemolak, Chemos a Elastik. Poradíme vám s výberom zadarmo.'),

    # značky a výrobky (H1 = značka a čo to je)
    'katalog/dlazby/dlazby-in-vest.html': dict(h1='Dlažby City Stone Design', t='Dlažby City Stone Design',
        d='Dlažby City Stone Design: zámkové dlažby Háčko, Dvojvlna, Top Zóna, Blok a Romana, palisády, obrubníky a plotový systém Casser. Nitra.'),
    'katalog/dlazby/dlazby-in-vest/plotovy-system.html': dict(h1='Plotový systém City Stone Design', t='Plotový systém City Stone Design',
        d='Plotový systém City Stone Design: štiepané plotové prvky Casser, zákrytové dosky a debniace betónové tvárnice. Cenová ponuka zadarmo.'),
    'katalog/dlazby/dlazby-in-vest/prvky-pre-cestne-komunikacie.html': dict(t='Prvky pre cestné komunikácie',
        d='Prvky pre cestné komunikácie City Stone Design: obrubník cestný, parkový a bariérový, prídlažba a žľabovka. Stavebniny Richtárik, Nitra.'),
    'katalog/dlazby/dlazby-in-vest/prvky-vonkajsej-architektury.html': dict(t='Prvky vonkajšej architektúry',
        d='Prvky vonkajšej architektúry City Stone Design: zámkové dlažby Háčko, Dvojvlna, Top Zóna, Kyjak a Šesťhran a betónové platne. Nitra.'),
    'katalog/dlazby/dlazby-in-vest/prvky-zahradnej-architektury.html': dict(t='Prvky záhradnej architektúry',
        d='Prvky záhradnej architektúry City Stone Design: palisády Romana a guľa z vymývaného betónu. Poradíme vám a cenovú ponuku pripravíme zadarmo.'),
    'katalog/kominove-systemy/qatro.html': dict(h1='Komíny Stadreko (systém Qatro)', t='Komíny Stadreko (systém Qatro)',
        d='Komíny Stadreko, systém Qatro: šamotové vložky pre pevné, kvapalné a plynné palivá, nerezové pre kondenzačné kotly. Komín máme priamo na sklade.'),
    'katalog/kominove-systemy/qatro/komin-nerezovy.html': dict(t='Komín Stadreko nerezový',
        d='Komín Stadreko z tvaroviek K3 s nerezovými vložkami pre kondenzačné kotly: postup montáže. Komín Stadreko máme v Nitre priamo na sklade.'),
    'katalog/kominove-systemy/qatro/komin-samotovy.html': dict(t='Komín Stadreko šamotový',
        d='Komín Stadreko so šamotovými vložkami pre pevné, kvapalné a plynné palivá: postup montáže. Komín Stadreko máme v Nitre priamo na sklade.'),
    'katalog/kominove-systemy/schiedel.html': dict(h1='Schiedel – keramické a nerezové komíny', t='Komíny Schiedel',
        d='Komíny Schiedel: keramické systémy Absolut, Uni Plus, Solid a Multi, nerezové komíny ICS, Prima Plus a Technoflex a vetranie Aero Comfort.'),
    'katalog/murovaci-material/pezinske-tehelne.html': dict(h1='Pezinské tehelne – tehly TermoBRIK', t='Pezinské tehelne, TermoBRIK',
        d='Tehly TermoBRIK od Pezinských tehelní: TD 440 až TD 85 na obvodové murivo a priečky, keramické stropy a preklady. Stavebniny Richtárik, Nitra.'),
    'katalog/murovaci-material/pezinske-tehelne/priecky.html': dict(h1='Priečkové tehly TermoBRIK', t='Priečkové tehly TermoBRIK',
        d='Priečkové tehly TermoBRIK TD 175 PD a TD 130 PD od Pezinských tehelní na vnútorné priečky. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo.'),
    'katalog/murovaci-material/pezinske-tehelne/stropny-system.html': dict(h1='Stropný systém a preklady', t='Stropný systém a preklady',
        d='Keramický stropný systém a preklady od Pezinských tehelní: stropné nosníky, vložky a keramické preklady. Cenová ponuka zadarmo, Nitra.'),
    'katalog/murovaci-material/porfix.html': dict(h1='Porfix – pórobetónové tvárnice a preklady', t='Porfix – pórobetónové tvárnice',
        d='Porfix: pórobetónové tvárnice Plus, priečkovky, U profily, preklady a stropný systém v hrúbkach od 5 do 37,5 cm. Stavebniny Richtárik, Nitra.'),
    'katalog/murovaci-material/ytong.html': dict(h1='Ytong – pórobetónové tvárnice a dielce', t='Ytong – pórobetónové tvárnice',
        d='Ytong: presné a tepelnoizolačné tvárnice, preklady, stropné a schodiskové dielce v hrúbkach od 5 do 37,5 cm. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-kritiny/blachotrapez.html': dict(h1='Blachotrapez – plechové krytiny', t='Blachotrapez – plechové krytiny',
        d='Plechové krytiny Blachotrapez: škridle Diament Plus, Joker a Kingas a trapézové plechy na požadovanú dĺžku, aj klampiarske výrobky. Nitra.'),
    'katalog/stresne-kritiny/blachotrapez/plech-trapezovy.html': dict(h1='Trapézový plech Blachotrapez', t='Trapézový plech Blachotrapez',
        d='Trapézové plechy Blachotrapez T-8 až T-135 v rôznych farbách a povrchových úpravách, na požadovanú dĺžku. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-kritiny/blachotrapez/plech-vzor-skridla.html': dict(h1='Plechová krytina vzor škridla', t='Plechová krytina vzor škridla',
        d='Plechová krytina vzor škridla Blachotrapez: Diament Plus, Kingas a Joker vo farebnej škále. Výpočet krytiny a cenová ponuka zadarmo.'),
    'katalog/stresne-kritiny/icopal.html': dict(h1='Icopal – asfaltové pásy a šindle', t='Icopal – asfaltové pásy a šindle',
        d='Icopal: asfaltové pásy SBS, modifikované pásy Elastobit a Polarbit, šindle JCP a strešný systém s fóliami. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-kritiny/mediterran.html': dict(h1='Mediterran – betónová krytina', t='Mediterran – betónová krytina',
        d='Betónová strešná krytina Mediterran Standard, Rundo, Danubia, Coppo a Zenit so všetkými tvarovkami a doplnkami. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-kritiny/onduline.html': dict(h1='Onduline – ľahké asfaltové krytiny', t='Onduline – asfaltové krytiny',
        d='Onduline: ľahké asfaltové vlnovky, škridle Onduvilla, šindle Bardoline a Tegola a priehľadné krytiny Onduclair. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-kritiny/tondach.html': dict(h1='Tondach – pálená strešná krytina', t='Tondach – pálená strešná krytina',
        d='Pálená strešná krytina Tondach: Bravura, Steinbrück, Figaro, bobrovky, viedenské škridly a keramické príslušenstvo. Stavebniny Richtárik, Nitra.'),
    'katalog/stresne-okna/fakro.html': dict(h1='Fakro – strešné okná', t='Strešné okná Fakro',
        d='Strešné okná Fakro z tlakovo impregnovanej borovice: kyvno-výklopné FPP, panoramatické FEL a plastové PPP, k nim markízy a rolety. Nitra.'),
    'katalog/stresne-okna/fakro/fakro-schody-vylezy.html': dict(h1='Podkrovné sklápacie schody Fakro', t='Podkrovné schody Fakro',
        d='Podkrovné sklápacie schody Fakro LWS Smart, LWK Komfort a zateplené LTK Thermo z borovicového dreva. Cenovú ponuku pripravíme zadarmo.'),
    'katalog/sypke-zmesy/baumit.html': dict(h1='Baumit – omietky, malty a lepidlá', t='Baumit – omietky, malty, lepidlá',
        d='Baumit: ručné a strojové omietky, stierky, zatepľovacie systémy, sanačné systémy Sanova, potery, lepidlá Baumacol a murovacie malty. Nitra.'),
    'katalog/sypke-zmesy/calmit.html': dict(h1='Calmit – vápenný hydrát a vápno', t='Calmit – vápenný hydrát a vápno',
        d='Vápno Calmit: vápenný hydrát Spezikalk, nehasené vápno Feinkalk a mleté vápence Florakalk v 25 kg vreciach. Stavebniny Richtárik, Nitra.'),
    'katalog/sypke-zmesy/cemmac.html': dict(h1='Cemmac – portlandský cement', t='Cemmac – portlandský cement',
        d='Cement Cemmac: portlandský troskový, portlandský a zmesný cement CEM II/A-S 32,5 R, CEM II/B-S 32,5 R, CEM I 32,5 R a CEM I 42,5 R. Nitra.'),
    'katalog/sypke-zmesy/holcim.html': dict(h1='Holcim – cement vo vreciach', t='Holcim – cement vo vreciach',
        d='Cement Holcim vo vreciach: Extracem 42,5 R a Multicem 32,5 R a cementové spojivo Profimalt na omietky a malty. Stavebniny Richtárik, Nitra.'),

    # akcie (H1 = výrobok a výhoda, iný ako H1 v katalógu)
    'akcie/betonove-tvarnice.html': dict(h1='Betónové tvárnice v akcii', t='Betónové tvárnice v akcii',
        d='Akcia betónové tvárnice: šalovacie od 1,28 € a stĺpové od 1,57 € za kus s DPH. So zákazníckou kartou ďalšia zľava 5 % v hotovosti alebo 3,3 % kartou.'),
    'akcie/cement-325-r.html': dict(h1='Cement v akcii od 4,42 €', t='Cement 325 R a 425 R v akcii',
        d='Akcia cement 325 R a 425 R: vrece 25 kg za 4,42 € a 5,18 € s DPH, cena platí pri platbe v hotovosti. Stavebniny Richtárik, Nitra – Horné Krškany.'),
    'akcie/dlazby-ploty-stadreko.html': dict(h1='Dlažby a ploty Stadreko v akcii', t='Dlažby a ploty Stadreko v akcii',
        d='Akcia dlažby a ploty Stadreko: dlažby, obrubníky, zatrávňovačky, plotové tvárnice a striešky za akciové ceny podľa cenníka z 28. 1. 2026.'),
    'akcie/komin-qatro.html': dict(h1='Komín Stadreko v akcii', t='Komín Stadreko v akcii',
        d='Akcia komín Stadreko: certifikovaný komínový systém priamo na sklade, napríklad komplet 6 m, ø 160/90 za 618 € s DPH. Odber ihneď, Nitra.'),
    'akcie/krytina-blachotrapez.html': dict(h1='Krytina Blachotrapez v akcii', t='Krytina Blachotrapez v akcii',
        d='Akcia krytina Blachotrapez: škridloplech od 9,22 €/m² s DPH, trapézové plechy, doprava nad 50 m² za 17 € po celom Slovensku. Nitra.'),
    'akcie/nobasil.html': dict(h1='Climowool 039 v akcii', t='Climowool 039 v akcii',
        d='Akcia Climowool 039: izolácia na šikmé strechy, vnútorné steny, stropy, podlahy a fasády od 29,88 € za balenie s DPH. Stavebniny Richtárik, Nitra.'),
    'akcie/okna-schody-fakro.html': dict(h1='Okná a schody Fakro so zľavou 20 %', t='Okná a schody Fakro v akcii',
        d='Akcia Fakro: strešné okná, podkrovné sklápacie schody a strešné doplnky so zľavou 20 %. Rôzne druhy a rozmery. Stavebniny Richtárik, Nitra.'),
    'akcie/pezinska-tehla-termobrik.html': dict(h1='Pezinská tehla TermoBRIK v akcii', t='Pezinská tehla TermoBRIK v akcii',
        d='Akcia Pezinská tehla TermoBRIK: brúsené tehly, systém Dry, lepidlo zdarma, individuálna cenová ponuka na váš dom. Doprava až na stavbu zdarma.'),
    'akcie/porfix.html': dict(h1='Porfix v akcii', t='Porfix v akcii',
        d='Akcia Porfix: špeciálne zľavy na obvodové murivo, priečky, strop, lepidlá a malty. Pri celom kamióne doprava až domov zdarma. Nitra.'),
    'akcie/sadrokartonovy-zateplovaci-system.html': dict(h1='Zatepľovací a sadrokartónový systém v akcii', t='Sadrokartón a zateplenie v akcii',
        d='Akcia sadrokartón a zateplenie: Norgips od 6,22 € za dosku s DPH, polystyrén Styrodur a OSB dosky. Polystyrén dovezieme domov zdarma.'),
    'akcie/sakret.html': dict(h1='Lepidlá a omietky Univerbau v akcii', t='Lepidlá a omietky v akcii',
        d='Akcia lepidlá a omietky Univerbau: lepidlá na obklad a polystyrén, nivelit, omietky, malty a betónový poter za znížené ceny. Nitra.'),
    'akcie/stavebne-naradie.html': dict(h1='Stavebné náradie v akcii', t='Stavebné náradie v akcii',
        d='Akcia stavebné náradie: náradie na stavbu, do záhrady, do domácnosti aj do dielne, široká ponuka priamo na sklade. Stavebniny Richtárik, Nitra.'),
    'akcie/stavebne-rezivo.html': dict(h1='Stavebné rezivo v akcii', t='Stavebné rezivo v akcii',
        d='Akcia stavebné rezivo: dosky, hranoly, strešné laty, foršne, tatranský obklad, palivové drevo a krovy na mieru za akciové ceny. Nitra.'),
    'akcie/stresne-okna-rooflite.html': dict(h1='Strešné okná RoofLITE v akcii', t='Strešné okná RoofLITE v akcii',
        d='Akcia strešné okná RoofLITE: napríklad Solid Pine 78 × 118 s lemovaním TFX za 283 € s DPH, rôzne rozmery a druhy. Stavebniny Richtárik, Nitra.'),
    'akcie/ytong.html': dict(h1='Ytong v akcii', t='Ytong v akcii',
        d='Akcia Ytong: špeciálne zľavy a pri celom kamióne doprava zdarma až na stavbu. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo. Nitra.'),

    # novinky (H1 = výrobok a použitie)
    'novinky/betonove-vyrobky.html': dict(h1='Betónové výrobky a šalovacie diely', t='Šalovacie diely a betónové prvky',
        d='Betónové výrobky v Stavebninách Richtárik: šalovacie diely DT 12 – 40, stĺpikové tvárnice, skruže, poklopy, striešky a vinohradnícke stĺpy.'),
    'novinky/dekoracne-kamene.html': dict(h1='Dekoračné kamene a kamenná kôra', t='Dekoračné kamene a kamenná kôra',
        d='Dekoračné kamene vo vreciach 25 kg: mramorový okruhliak za 11,20 €, Nero Ebono za 10,75 € a kamenná kôra za 8,95 € s DPH. Stavebniny Richtárik.'),
    'novinky/delap-ohybny-kamenny-obklad.html': dict(h1='Ohybný kamenný obklad Delap', t='Ohybný kamenný obklad Delap',
        d='Ohybný kamenný obklad Delap z prírodného kameňa: akciová cena 17,80 € za m² s DPH, balenie 4 m², 7 tvarov. Stavebniny Richtárik, Nitra.'),
    'novinky/ekostyren.html': dict(h1='Ekostyrén – plnivo do betónu', t='Ekostyrén – plnivo do betónu',
        d='Ekostyrén je plnivo do betónu z polystyrénovej drte vo vreciach 200 l. Príklady použitia a parametre podľa výrobcu. Stavebniny Richtárik, Nitra.'),
    'novinky/garaze-zahradne-domceky.html': dict(h1='Montované garáže a záhradné domčeky', t='Garáže a záhradné domčeky',
        d='Montované plechové garáže typov 3511 až 6622 a záhradné domčeky ZD11 a ZD21. Doprava aj montáž po celom Slovensku zdarma. Stavebniny Richtárik.'),
    'novinky/magic-floor-vynilova-podlaha.html': dict(h1='Vinylové podlahy Magic Floor', t='Vinylové podlahy Magic Floor',
        d='Vinylové podlahy Magic Floor do domácnosti (Home) aj do priemyselných priestorov (Commercial) so vzorkovníkom dekorov. Nitra.'),
    'novinky/topstone-oprava-starych-chodnikov.html': dict(h1='Kamenný koberec Bianka', t='Kamenný koberec Bianka',
        d='Kamenný koberec Bianka na úpravu schodísk, balkónov, vstupov, dvorov a chodníkov. Od 22,80 € za m² s prírodným kameňom. Stavebniny Richtárik.'),
    'novinky/vyrobky-z-plastu.html': dict(h1='Výrobky z recyklovaného plastu', t='Výrobky z recyklovaného plastu',
        d='Výrobky z recyklovaného plastu: zatrávňovacie dlažby, záhonové chodníky, plotovky, profily a palety. Stavebniny Richtárik, Nitra – Horné Krškany.'),
}


def stranka(path):
    return STRANKY.get(path, {})


def titulok(path, nazov):
    """<title> vo vzore „… | Stavebniny Richtárik Nitra“ (najviac 60 znakov)."""
    t = stranka(path).get('t') or nazov
    if len(t + PRIPONA) > 60: t = t[:60 - len(PRIPONA)].rsplit(' ', 1)[0].rstrip(' ,–-')
    return t + PRIPONA


# Zátvorky pre generátor popisov (STYL §11), keď stránka nemá ručný popis: celé vety, ktoré sa skladajú, kým sa popis
# zmestí do 120 – 155 znakov. Len fakty (výpočet spotreby, ponuka a poradenstvo zadarmo, doprava po Slovensku, adresa).
DOPLNKY = ['Výpočet spotreby a cenová ponuka zadarmo.', 'Doprava po celom Slovensku.', 'Poradíme vám s výberom.',
           'Stavebniny Richtárik, Nitra – Horné Krškany.', 'Nitra – Horné Krškany.']


def popis(path, nazov, druh, veta=''):
    """Popis stránky: ručný z STRANKY, inak generátor podľa STYL §11 (kategória, značka, akcia, novinka)."""
    d = stranka(path).get('d')
    if d: return d
    veta = (veta or '').strip().rstrip('.')
    zaklad = {'kategoria': f'{nazov} v Nitre: {veta[:1].lower() + veta[1:]}.' if veta else f'{nazov} v Nitre.',
              'znacka': f'{nazov} v Stavebninách Richtárik v Nitre.' + (f' {veta}.' if veta else ''),
              'akcia': f'Akcia {nazov}: {veta}.' if veta else f'Akcia {nazov}.',
              'novinka': f'{nazov}: {veta}.' if veta else f'{nazov}.'}.get(druh, f'{nazov}.')
    if druh == 'akcia': doplnky = ['So zákazníckou kartou ďalšia zľava 5 % v hotovosti alebo 3,3 % kartou.'] + DOPLNKY
    else: doplnky = list(DOPLNKY)
    d = zaklad
    if len(d) > 155:   # príliš dlhá veta: skrátiť na celé vety
        vety = re.split(r'(?<=[.!?])\s+', d); d = ''
        for v in vety:
            if len((d + ' ' + v).strip()) <= 155: d = (d + ' ' + v).strip()
    for x in doplnky:
        if len(d) >= 120: break
        if len(d + ' ' + x) <= 155: d = d + ' ' + x
    return d


# ---------- úprava písania v textoch (zdroj aj naše šablóny) ----------
# Skratky, ktoré ostávajú verzálkami (STYL §6), a kódy výrobkov a skúšobní zo zdroja.
SKRATKY = {'DPH', 'IČO', 'DIČ', 'VÚB', 'CEM', 'XPS', 'EPS', 'OSB', 'PVC', 'SBS', 'APP', 'JCP', 'PE', 'PP', 'DT', 'KNPV',
           'ČVUT', 'PAVÚS', 'SZÚ', 'TSÚS', 'AZL', 'CGAK', 'CGAT', 'CGATS', 'CGAMA', 'CGAMAT', 'PCGA', 'LIAZ', 'TFX', 'EDW',
           'EDS', 'EKW', 'GGL', 'GGU', 'GPL', 'GPU', 'FPP', 'FEL', 'PPP', 'FTS', 'FTP', 'FTT', 'FTL', 'FDL', 'FBL', 'ICS',
           'MVR', 'UNI', 'SK', 'PDF', 'DOC', 'MP4', 'KMB', 'PUR', 'PIR', 'LWS', 'LWK', 'LWT', 'LML', 'LST', 'WGI', 'HPL',
           'RAL', 'NCS', 'ISO', 'STN', 'EN', 'CE', 'SR', 'EU', 'EÚ', 'USA', 'DS', 'UV', 'ST', 'TD', 'PD', 'KM', 'P', 'D'}
# Mená výrobkov a značiek, ktoré zdroj píše verzálkami: tvar s veľkým začiatočným písmenom (aj vo vete).
MENA = {'STONE': 'Stone', 'BIANKA': 'Bianka', 'STADREKO': 'Stadreko', 'FAKRO': 'Fakro', 'TONDACH': 'Tondach',
        'QATRO': 'Qatro', 'KINGAS': 'Kingas', 'JOKER': 'Joker', 'DIAMENT': 'Diament', 'PLUS': 'Plus', 'COPPO': 'Coppo',
        'STANDARD': 'Standard', 'RUNDO': 'Rundo', 'DANUBIA': 'Danubia', 'ZENIT': 'Zenit', 'LAMBDA': 'Lambda',
        'TRAPLAST': 'Traplast', 'SENDWIX': 'Sendwix', 'SANOVA': 'Sanova', 'BAUMACOL': 'Baumacol', 'ABSOLUT': 'Absolut',
        'SOLID': 'Solid', 'MULTI': 'Multi', 'QUADRO': 'Quadro', 'KERASTAR': 'Kerastar', 'TECHNOFLEX': 'Technoflex',
        'TECHNOFIX': 'Technofix', 'HYDROBIT': 'Hydrobit', 'SOLAR': 'Solar', 'EKOSTYREN': 'Ekostyrén', 'VELUX': 'Velux',
        'YTONG': 'Ytong', 'PORFIX': 'Porfix', 'BRAMAC': 'Bramac', 'ONDULINE': 'Onduline', 'MEDITERRAN': 'Mediterran',
        'SCHIEDEL': 'Schiedel', 'BAUMIT': 'Baumit', 'HOLCIM': 'Holcim', 'CEMMAC': 'Cemmac', 'CALMIT': 'Calmit',
        'MASONITE': 'Masonite', 'ISOVER': 'Isover', 'ORSIL': 'Orsil', 'SKALA': 'Skala'}
VELKE = 'A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽÜÖĚŘ'
MALE = 'a-záäčďéíľĺňóôŕšťúýžüöěř'
SLOVO_VELKE = re.compile(rf'(?<![\w{VELKE}{MALE}])[{VELKE}]{{2,}}(?![\w{VELKE}{MALE}])')


def _verzalky(t):
    """Verzálky zo zdroja (STYL §6): úseky slov verzálkami s aspoň jedným slovom s 5 a viac písmenami sa prepíšu.
    Zoznam položiek oddelených čiarkou (BRAVURA, STEINBRÜCK, DRÁŽKOVÁ BOBROVKA) = mená, každá položka s veľkým
    začiatočným písmenom. Inak veta: veľké písmeno len na začiatku vety. Mená výrobkov (MENA) a skratky (SKRATKY)
    ostávajú vo svojom tvare."""
    slova = list(SLOVO_VELKE.finditer(t))
    if not slova: return t
    # úseky: susedné slová verzálkami oddelené len medzerami, čiarkami, číslami a znakmi + / - –
    useky = []; cur = [slova[0]]
    for a, b in zip(slova, slova[1:]):
        medzi = t[a.end():b.start()]
        if re.fullmatch(r'(?:[\s,+/\-–0-9.]|(?<=\s)[AVSKOUZI](?=\s))*', medzi) and not re.search(r'[.]\s', medzi): cur.append(b)
        else: useky.append(cur); cur = [b]
    useky.append(cur)
    out = []; poz = 0
    for u in useky:
        if not any(len(m.group(0)) >= 5 and m.group(0) not in SKRATKY for m in u): continue
        pred = t[:u[0].start()]
        zaciatok = not pred.strip() or re.search(r'[.!?]\s*$|[–-]\s*$|^\s*\d+\.\s*$', pred) is not None
        zoznam = len(u) > 1 and any(',' in t[a.end():b.start()] for a, b in zip(u, u[1:]))
        prve = True
        for i, m in enumerate(u):
            w = m.group(0)
            if i and ',' in t[u[i - 1].end():m.start()]: prve = True
            if w in SKRATKY: nove = w
            elif w in MENA: nove = MENA[w]
            elif prve and (zoznam or zaciatok or (i == 0 and len(u) == 1 and not re.search(rf'[{MALE}]\s*$', pred))):
                nove = w[:1] + w[1:].lower()
            else: nove = w.lower()
            if i:   # jednopísmenové predložky a spojky medzi slovami úseku (S, V, A, K…) tiež malým
                medzi = t[u[i - 1].end():m.start()]
                for j in re.finditer(r'(?<=\s)[AVSKOUZI](?=\s)', medzi):
                    out.append((u[i - 1].end() + j.start(), u[i - 1].end() + j.end(), j.group(0).lower()))
            out.append((m.start(), m.end(), nove)); prve = False
            if i == 0 and not zoznam: zaciatok = False
    if not out: return t
    r = []; poz = 0
    for a, b, n in out: r.append(t[poz:a]); r.append(n); poz = b
    r.append(t[poz:]); return ''.join(r)


# Preklepy a nejednotné tvary v textoch zdroja (T-09, T-06). Len vo viditeľnom texte, nie v adresách.
PREKLEPY = [
    (r'Počet kusok', 'Počet kusov'), (r'Betónove poklopy', 'Betónové poklopy'), (r'Žľaboka', 'Žľabovka'),
    (r'[Bb]arierov', lambda m: m.group(0)[0] + 'ariérov'), (r'niekolko', 'niekoľko'), (r'\bnei na\b', 'nie na'),
    (r'Lepísa', 'Lepí sa'), (r'zvchu', 'zvrchu'), (r'zvyslé', 'zvislé'), (r'gumenným', 'gumeným'),
    (r'vrámci Slovenska ZDARMA\s*!', 'po celom Slovensku zdarma'), (r'vrámci', 'v rámci'), (r'Druhy garáži\b', 'Druhy garáží'),
    (r'ľubovolnou', 'ľubovoľnou'), (r'starši aj nové', 'staršie aj nové'), (r'\bbetonov(é|ých|á|ou|ej)\b', r'betónov\1'),
    (r'\bbetonovéj\b', 'betónovej'), (r'betonovu plochu', 'betónovú plochu'), (r'vyčistenu napenetrovanu', 'vyčistenú napenetrovanú'),
    (r'voči vonkajšom vplyvom', 'voči vonkajším vplyvom'), (r'\bvynil', 'vinyl'), (r'zapezbečené', 'zabezpečené'),
    (r'\bNieje\b', 'Nie je'), (r'\bnieje\b', 'nie je'), (r'vyplíva', 'vyplýva'), (r'vášu strechu', 'vašu strechu'),
    (r'porovnateľný betónových', 'porovnateľných betónových'), (r'\bmame v ponuke', 'máme v ponuke'),
    (r'Tehla Pezinska', 'Pezinská tehla'), (r'Konštukčné', 'Konštrukčné'), (r'sadroartón', 'sadrokartón'),
    (r'Tímto zpôsobom', 'Týmto spôsobom'), (r'na celu plochu', 'na celú plochu'), (r'\bkameňe\b', 'kamene'),
    (r'nejlepšie', 'najlepšie'), (r'stupňou\b', 'stupňov'), (r'šindlov', 'šindľov'),
    (r'vjazdy do garáži', 'vjazdy do garáží'), (r'V baleni sú', 'V balení sú'), (r'podkrovie/strechu/', 'podkrovie (strechu)'), (r'\bumoňuje\b', 'umožňuje'),
    (r'\breríka\b', 'rebríka'), (r'Magicfloor|Magic floor', 'Magic Floor'), (r'\b[Ee]kostyren\b', 'Ekostyrén'), (r'\bEkostyrenbet', 'Ekostyrénbet'),
    (r'\bRooflite\b', 'RoofLITE'), (r'\bTermo[Bb]rik\b', 'TermoBRIK'), (r'\bIco ?[Pp]al\b', 'Icopal'),
    (r'Knaufinsulation', 'Knauf Insulation'), (r'Pezinské Tehelne', 'Pezinské tehelne'), (r'Stavebné Profily', 'Stavebné profily'),
    (r'\bKm Beta\b', 'KM Beta'), (r'\bVUB\b', 'VÚB'), (r'HOME /do domácnosti/', 'Do domácnosti (Home)'),
    (r'COMMERCIAL /priemyselné/', 'Priemyselné (Commercial)'), (r'Stropný systém \+ preklady', 'Stropný systém a preklady'),
    (r'STROPNÝ SYSTÉM \+ PREKLADY', 'Stropný systém a preklady'), (r'Sadrokartónový \+ zatepľovací systém', 'Sadrokartónový a zatepľovací systém'),
]
# hovorové „super“ ceny zo zdroja (STYL §2, §8): akciová cena
SUPER = [(r'(?i)\bv super\s+cenách\b', 'za akciové ceny'), (r'(?i)\bv super\s+cene\b', 'za akciovú cenu'),
         (r'(?i)\bsuper\s+cen(y|a)\b', 'akciové ceny')]


def _typografia(t):
    """Typografia v jednom textovom úseku (STYL §6)."""
    for a, b in PREKLEPY: t = re.sub(a, b, t)
    for a, b in SUPER: t = re.sub(a, lambda m: (b[:1].upper() + b[1:]) if m.group(0)[:1].isupper() and not m.group(0).startswith(('v ', 'V ')) else b, t)
    t = _verzalky(t)
    # jednotky: m2, m3 → m², m³; číslo a jednotka s nezlomiteľnou medzerou
    t = re.sub(r'(?<=[\s/\d(])m2(?![\w²])', 'm²', t); t = re.sub(r'(?<=[\s/\d(])m3(?![\w³])', 'm³', t)
    t = re.sub(r'\+\s?(\d+)\s?oC\b', '+\\1\u00a0°C', t)
    t = re.sub(r'(\d)(m²|m³|kg|cm|mm|ks|m|t)(?![\w²³])', '\\1\u00a0\\2', t)
    t = re.sub(r'(\d) (€|m²|m³|kg|cm|mm|ks|m|t|l)(?![\w²³])', '\\1\u00a0\\2', t)   # „17 €“, „8 t“ sa nerozdelia na dva riadky
    t = re.sub(r'(\d) ?[x×] ?(?=\d)', '\\1\u00a0× ', t)   # za „×“ bežná medzera: dlhý rozmer sa smie zalomiť (úzky stĺpec)
    # mena a DPH
    t = re.sub(r'(\d),-\s*(?=€|Eur\b|EUR\b)', r'\1 ', t)
    t = re.sub(r'\s?\b(?:Eur|EUR)\b', ' €', t)
    t = re.sub(r'(\d)\.(\d{2})(?=\s*€)', r'\1,\2', t)
    t = re.sub(r'(\d)€', '\\1\u00a0€', t)
    t = re.sub(r'\b(?:Dph|dph)\b', 'DPH', t)
    # nezlomiteľná medzera v dátume (28. 1. 2026) a za znakom priemeru (ø 160/90)
    t = re.sub(r'\b(\d{1,2})\. ?(\d{1,2})\. ?(\d{4})\b', '\\1.\u00a0\\2.\u00a0\\3', t); t = re.sub(r'ø ', 'ø\u00a0', t)
    # percentá s medzerou
    t = re.sub(r'(\d) ?%', '\\1\u00a0%', t)
    # pomlčka namiesto spojovníka medzi slovami (obchodný názov „Ing. Mário Richtárik - Stavebniny“ ostáva, T-08)
    t = re.sub(r'(?<!Richtárik)(?<=\S) - (?=\S)', ' – ', t); t = re.sub(r'(?<=\S) - ?$', ' – ', t)
    # tri bodky, dve bodky, výkričníky (texty výrobcov: bodka)
    t = re.sub(r'\.{3,}', '…', t); t = re.sub(r'(?<![.…])\.\.(?!\.)', '.', t)
    t = re.sub(r'\s*!+(?=[\s"“”’)&]|$)', '.', t); t = re.sub(r'!+(?=[A-ZÁÄČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ])', '. ', t)
    t = re.sub(r'\.\s*\.(?=\s|$)', '.', t); t = re.sub(r'…\s+\.', '…', t)
    # medzery pred interpunkciou a v zátvorkách, lomky namiesto zátvoriek; čiarka v zozname čísel zo zdroja („160 ,180“,
    # „110, 120,150“) je oddeľovač, nie desatinná čiarka: „160, 180“
    t = re.sub(r'(\d)[ \u00a0]+,(?=\d)', r'\1, ', t); t = re.sub(r'(?<=, )(\d{2,3}),(\d{2,3})(?=,)', r'\1, \2', t)
    t = re.sub(r'(?<=\S)[ \u00a0]+([,;])', r'\1', t); t = re.sub(r'(?<=[\w)])[ \u00a0]+\.(?=\s|$)', '.', t)
    t = re.sub(r'\([ \u00a0]+', '(', t); t = re.sub(r'[ \u00a0]+\)', ')', t)
    t = re.sub(rf'(?<=\s)/([{MALE}][{MALE} ]{{2,}}[{MALE}])/', r'(\1)', t)
    # vykanie: Vy, Vám, Váš… vo vete malým písmenom (veľké len na začiatku vety)
    t = re.sub(rf'(?<=[{MALE}0-9,;] )V(y|ám|ás|áš\w*|aš\w*|ami)\b', lambda m: 'v' + m.group(0)[1:], t)
    return t


_ATRIBUTY = re.compile(r'(\s(?:alt|title|aria-label|data-cap|placeholder)=")([^"]*)(")')
_META = re.compile(r'(<meta (?:name="description"|property="og:(?:title|description)"|name="twitter:(?:title|description)") content=")([^"]*)(")')


def uprav(h):
    """Úprava písania vo vygenerovanej stránke: len viditeľný text a textové atribúty, nikdy adresy, skripty a štýly."""
    casti = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)', h, flags=re.S)
    for i, c in enumerate(casti):
        if not c: continue
        if c.startswith('<'):
            if c.startswith(('<script', '<style')): continue
            c = _ATRIBUTY.sub(lambda m: m.group(1) + html.escape(_typografia(html.unescape(m.group(2))), quote=True) + m.group(3), c)
            c = _META.sub(lambda m: m.group(1) + html.escape(_typografia(html.unescape(m.group(2))), quote=True) + m.group(3), c)
            casti[i] = c
        else:
            casti[i] = _typografia(c)
    h = ''.join(casti)
    # pomlčka aj tam, kde je spojovník medzi tučným názvom a textom za ním (Extracem</strong> - vrecovaný cement)
    h = re.sub(r'(</(?:strong|b|a|span|em)>) - (?=\S)', '\\1 – ', h)
    h = re.sub(r'(\s</(?:strong|b|a|span|em)>)-\s', '\\1– ', h)
    return re.sub(r'(?<=\S) - (<(?:strong|b|a|span|em)\b)', ' – \\1', h)


# ---------- opisy obrázkov (alt) ----------
# Logá, letáky a fotky z pôvodného webu bez popisu (zdroj má alt prázdny alebo názov súboru). Opis toho, čo je na obrázku
# vidieť (obrázky som otvoril, hárky v zápise), pri logu názov značky.
OBR_ALT = {
    '137': 'Logo Holcim', '138': 'Reklamný obrázok s logom Holcim', '161': 'Logo Cemmac', '163': 'Logo Calmit',
    '239': 'Logo Baumit Open', '253': 'Logo Pezinské tehelne', '254': 'Keramické tehly Pezinských tehelní',
    '302': 'Logo Xella', '303': 'Logo Ytong', '362': 'Logo Mediterran', '378': 'Logo Blachotrapez', '429': 'Logo Icopal',
    '430': 'Rolky asfaltových pásov Icopal', '467': 'Logo IN', '468': 'Logo IN', '469': 'Logo IN', '475': 'Logo IN',
    '570': 'Logo Schiedel', '571': 'Leták Schiedel – jarná akcia', '446': 'Záhrada so vzorovanou betónovou dlažbou',
    '240': 'Budova s farebnou fasádou', '505': 'Schéma komínového systému s krbom a kotlom',
    '255': 'Keramická tehla s dutinami', '291': 'Logo Porfix', '304': 'Rozostavaný dom so škridlovou strechou',
    '340': 'Pálená škridla v reze s opisom vlastností', '363': 'Betónové škridly Mediterran na plánoch domu',
    '388': 'Model domu s plechovou krytinou', '417': 'Asfaltová vlnovka Onduline', '555': 'Strešné okno Fakro s roletou',
    '162': 'Areál cementárne', '165': 'Certifikát vnútropodnikovej kontroly', '139': 'Cement Holcim Extracem vo vreci',
}

# Galéria: opis každej fotky (5 až 15 slov, len to, čo je na fotke vidieť). Fotky dvora a predajne sú skutočné fotky
# z pôvodného webu (img/g), výstavy podľa názvu albumu.
GALERIA_ALT = {
    '99': 'Vstup do Stavebnín Richtárik z ulice s nápisom Stavebniny na plote',
    '98': 'Predajňa Stavebniny Richtárik s červenou fasádou a nápisom Stavebniny na plote',
    '105': 'Pohľad z ulice na predajňu a vjazd do dvora Stavebnín Richtárik',
    '106': 'Tabuľa Stavebniny Richtárik na plote pri predajni',
    '104': 'Dvor so stavebným tovarom a miešačkami pod prístreškom',
    '103': 'Regály s náradím, lopatami a farbami v predajni',
    '102': 'Predajňa s náradím, tmelmi, farbami a pletivom na regáloch',
    '101': 'Regály s kartónmi, kanistrami a náradím v predajni pri pulte',
    '100': 'Sklad profilov a hutného materiálu pod prístreškom na dvore',
    '93': 'Regál s plechmi a profilmi a palety tovaru na dvore',
    '91': 'Nákladné autá a palety materiálu na dvore pri sklade',
    '89': 'Dvor plný paliet s tvárnicami, tehlami a izoláciou pri hale',
    '90': 'Palety betónovej dlažby a tvárnic na dvore Stavebnín Richtárik',
    '88': 'Rady paliet s tvárnicami, tehlami a betónovými prvkami na dvore',
    '86': 'Palety pórobetónových tvárnic Ytong v žltej fólii na dvore',
    '87': 'Palety betónových tvárnic a tehál v červenej fólii na dvore',
    '84': 'Ulička medzi paletami betónových tvárnic, tehál a pórobetónu Ytong na dvore',
    '85': 'Dvor s drevenými paletami, tvárnicami Ytong a nákladným autom',
    '82': 'Plechová skladová hala na dvore Stavebnín Richtárik',
    '83': 'Skladová hala s paletami fólií, izolácie a vrecovaného tovaru',
    '81': 'Palety s vrecovanými zmesami a lepidlami v skladovej hale',
    '80': 'Palety vriec so suchými zmesami v skladovej hale',
    '79': 'Vysokozdvižný vozík medzi paletami vriec v skladovej hale',
    '78': 'Balené dosky polystyrénu v podkrovnom sklade',
    '77': 'Oceľové zárubne a hutný materiál v sklade',
    '76': 'Interiérové dvere a zárubne v sklade dverí',
    '75': 'Regály s rolami fólií a profilmi v sklade',
    '73': 'Stavebné rezivo, dosky a hranoly naskladané na dvore',
    '592': 'Stánok Stavebnín Richtárik na výstave Domexpo 2010 s plotom a komínom',
    '593': 'Ukážka plotu z farebných betónových tvárnic na výstave Domexpo 2010',
    '594': 'Ukážka komína a posedenie pod stanom na výstave Domexpo 2010',
    '595': 'Plot z farebných tvárnic a komín na stánku na výstave Domexpo 2010',
    '597': 'Vzorky plechových krytín a posedenie pod stanom na výstave Domexpo 2010',
    '857': 'Stánok Stavebnín Richtárik na výstave Agrokomplex 2011 s garážou a obkladmi',
    '858': 'Ukážka montovanej garáže a kamenných obkladov na výstave Agrokomplex 2011',
    '859': 'Vzorky strešných krytín a tvárnic na stánku na výstave Agrokomplex 2011',
    '860': 'Komín, plot z tvárnic a betónové tvárnice na výstave Agrokomplex 2011',
    '861': 'Montovaná garáž a vzorky kamenných obkladov na výstave Agrokomplex 2011',
    '862': 'Celkový pohľad na stánok Stavebnín Richtárik na výstave Agrokomplex 2011',
    '897': 'Plot z tvárnic, komín a vzorky obkladov na výstave Agrokomplex 2012',
    '898': 'Montovaná garáž a vzorky obkladov na stánku na výstave Agrokomplex 2012',
    '899': 'Stánok s garážou, plotom a komínom na výstave Agrokomplex 2012',
    '900': 'Vzorky plechových krytín a stavebnej chémie na výstave Agrokomplex 2012',
    '901': 'Stojany s plechovými krytinami a stavebnou chémiou na výstave Agrokomplex 2012',
    '902': 'Stojany stavebnej chémie Den Braven a obklady na výstave Agrokomplex 2012',
    '903': 'Vzorky plechových krytín na stojane na výstave Agrokomplex 2012',
    '904': 'Plechové krytiny a stavebná chémia pri vstupe na stánok, Agrokomplex 2012',
    '905': 'Garáž, vzorky obkladov a tvárnice na stánku na výstave Agrokomplex 2012',
    '906': 'Betónové tvárnice, komín a vzorky obkladov na výstave Agrokomplex 2012',
    '907': 'Betónové tvárnice, plechové krytiny a komín na výstave Agrokomplex 2012',
    '908': 'Stojany stavebnej chémie Den Braven na stánku na výstave Agrokomplex 2012',
    '909': 'Vzorky obkladov, komín a betónové prvky na stánku na výstave Agrokomplex 2012',
    '890': 'Montovaná garáž a vzorky kamenných obkladov na výstave Gardenia 2012',
    '891': 'Vzorky plotov a plotových dosiek na výstave Gardenia 2012',
    '892': 'Návštevníci pri obkladoch a komíne na stánku na výstave Gardenia 2012',
    '893': 'Posedenie pod stanom a vzorky krytín na výstave Gardenia 2012',
    '894': 'Garáž, obklady a komín pri vstupe na stánok na výstave Gardenia 2012',
    '895': 'Betónové tvárnice a vzorky plotov na výstave Gardenia 2012',
    '896': 'Plechové krytiny Blachotrapez a tehla TermoBRIK na výstave Gardenia 2012',
}
