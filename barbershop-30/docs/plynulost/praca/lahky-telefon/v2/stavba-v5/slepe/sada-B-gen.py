# Sada B „pasce“ – slepá skúšobná sada pre Recepciu (autor nečítal recepcia.js ani kmene).
# Spustenie: python3 -I sada-B-gen.py <cesta k barbershop-30>
# Zapíše sada-B.jsonl vedľa seba a overí, že každá služba s cenou v očakávaní
# má cenu presne na uvedenom riadku index.html.
#
# Význam poľa ocakavane:
#   <id>         správna je práve táto položka (pri cene overená v index.html, pozri ZDROJ)
#   odovzdanie   téma mimo stránky – len odovzdanie (nevieme / fallback, prípadne „Myslíš toto?“
#                s celým cenníkom); žiadna konkrétna cena, trvanie ani „áno“ na službu
#   bez-ceny     nie je to otázka na konkrétnu ponúkanú službu, alebo sa pýta na údaj, ktorý
#                recepcia nemá (trvanie inej služby, farbenie žene); prijateľná je akákoľvek
#                odpoveď BEZ konkrétnej ceny a BEZ trvania (pozdrav, odovzdanie, hodiny, kontakt,
#                farbenie-vlasov …)
import json, os, sys

ZDROJ = {  # id: (riadok index.html, text, ktorý tam musí byť)
    'cena-strih': (531, '18 €'), 'cena-strih-brada': (537, '28 €'), 'cena-dlhe': (543, '22 €'),
    'deti': (549, '15 €'), 'hlava': (555, '13 €'), 'cena-brada': (567, '15 €'),
    'holenie': (573, '15 €'), 'farbenie-brady': (579, '10 €'), 'balicky': (591, '30 €'),
    'ultra': (597, '40 €'), 'plet': (609, '21,50 €'), 'obocie': (633, '5 €'),
    'depilacia': (621, '5,50 €'), 'ornament': (627, '4 €'),
    'trvanie': (530, '40 min'), 'farbenie-vlasov': (642, 'samostatnom systéme'),
    'hodiny': (829, 'Ne zatvorené'), 'kresla': (838, '8 kresiel'),
}
O, B = 'odovzdanie', 'bez-ceny'

SK = [
    # iné produkty a služby
    ('Robíte aj manikúru?', O), ('Koľko stojí pedikúra?', O), ('Gélové nechty robíte?', O),
    ('Koľko stojí tetovanie?', O), ('Robíte piercing do ucha?', O),
    ('Máte permanentku na 10 strihov?', O), ('Dá sa u vás mesačné predplatné na strihanie?', O),
    ('Koľko stojí kozmetické ošetrenie tváre pre ženy?', O), ('Masáž hlavy koľko stojí?', O),
    ('Robíte head spa?', O), ('Keratínové vyrovnanie vlasov cena', O), ('Predlžovanie vlasov robíte?', O),
    ('Koľko stojí farbenie mihalníc?', O), ('Laminácia obočia cena', O),
    ('Depilácia chrbta voskom koľko?', O), ('voskovanie hrudnika cena', O), ('Holíte aj nohy?', O),
    ('Predávate vosk na vlasy?', O), ('Koľko stojí balzam na bradu?', O),
    ('Olej na bradu kúpim u vás?', O), ('Máte šampón proti lupinám na predaj?', O),
    ('Máte pivo?', O), ('Dostanem aj čaj?', O), ('Je tu wifi?', O),
    ('Koľko stojí samotná whisky bez služby?', O), ('Botox na vrásky robíte?', O),
    ('Dredy robíte?', O), ('Viete upraviť parochňu?', O), ('detox pleti', O),
    ('Bielenie zubov máte?', O), ('Strihate aj nechty?', O),
    ('Koľko stojí kurz strihania pre verejnosť?', O),
    ('Mikropigmentácia hlavy (tetovanie vlasov) cena', O),
    ('Horúci uterák na tvár bez holenia koľko?', O),
    # iné osoby
    ('Koľko stojí strih pre manželku?', O), ('Ostriháte aj moju dcéru? Má 7 rokov.', O),
    ('strih pre babku', O), ('Kamarátka chce krátky strih, koľko zaplatí?', O),
    ('Koľko by stál strih pre sestru?', O), ('Mama by sa chcela ostrihať, dá sa?', O),
    ('Dámsky strih cena', O), ('strihate aj zeny?', O), ('Strih pre dievča, 9 rokov', O),
    ('Strih pre malú slečnu, koľko?', O), ('Fade pre dcéru', O),
    ('Ornament do vlasov pre dcéru', O), ('Pleťová maska pre manželku', O),
    ('Ostriháte môjho psa?', O), ('Môžem prísť so psom?', O),
    ('Koľko stojí strih pre syna, má 6 rokov?', 'deti'),
    ('Strih pre malého gentlemana, 8 rokov', 'deti'), ('Strih pre 4-ročného chlapca', 'deti'),
    ('Syn má 12 rokov, platí ešte detský strih?', O), ('Strih pre 14-ročného syna, aká cena?', O),
    ('Koľko stojí strih pre manžela?', 'cena-strih'), ('Strih pre brata cena', 'cena-strih'),
    ('Kolega chce oholiť hlavu britvou, koľko to stojí?', 'hlava'),
    ('Farbenie brady pre otca, koľko?', 'farbenie-brady'),
    ('Má dôchodca zľavu?', O), ('Máte študentskú zľavu?', O),
    ('Otec je na vozíku, je vstup bezbariérový?', O),
    ('Darček pre manžela – poukážka na strih, koľko stojí?', O),
    # iné miesta a časy
    ('Prídete ostrihať ku mne domov?', O), ('Strihate aj v nemocnici?', O),
    ('Môžete prísť strihať do domova dôchodcov?', O), ('Strihanie u nás vo firme pre kolegov', O),
    ('Prídete na svadbu ostrihať ženícha?', O), ('Máte otvorené na Vianoce?', O),
    ('Ste otvorení 1. mája?', O), ('Máte otvorené na Silvestra?', O),
    ('Môžem prísť o polnoci?', B), ('Strihate aj v noci?', B),
    ('Máte otvorené v nedeľu?', 'hodiny'), ('Do koľkej máte v sobotu?', 'hodiny'),
    ('Koľko stojí strih v nedeľu?', B), ('Večerný strih po 19:00 koľko stojí?', B),
    ('Máte pobočku v Bratislave?', O), ('Kde zaparkujem?', O),
    ('Môžem prísť hneď teraz bez objednania?', O),
    # trvanie iných služieb
    ('Ako dlho trvá holenie?', B), ('Koľko minút trvá oholenie hlavy?', B),
    ('Ako dlho trvá farbenie brady?', B), ('Ako dlho trvá balíček 1?', B),
    ('Ako dlho trvá Ultra inclusive?', B), ('Ako dlho trvá detský strih?', B),
    ('Ako dlho trvá farbenie vlasov u Romany?', B), ('Ako dlho trvá úprava obočia?', B),
    ('Ako dlho trvá strih dlhých vlasov nad 10 cm?', B), ('ako dlho trva hot towel', B),
    ('Ako dlho trvá manikúra?', O), ('Ako dlho budem čakať v čakárni?', O),
    ('Ako dlho trvá pánsky strih?', 'trvanie'), ('Koľko trvá úprava brady?', 'trvanie'),
    # ceny iných služieb a podobných položiek
    ('Koľko stojí strih bez umývania?', O), ('Koľko stojí len zastrihnúť ofinu?', O),
    ('Len zastrihnúť kontúry na krku, koľko?', O), ('Koľko stojí strih strojčekom na nulu?', O),
    ('Expresný strih za 15 minút máte?', O), ('Koľko stojí strih za 10 minút?', O),
    ('Koľko stojí farbenie vlasov?', 'farbenie-vlasov'), ('Koľko stojí melír?', 'farbenie-vlasov'),
    ('Farbenie vlasov pre manželku, cena?', B), ('Koľko stojí farbenie obočia?', 'obocie'),
    ('Depilácia nosa cena', 'depilacia'), ('Koľko stojí ornament do vlasov?', 'ornament'),
    ('Koľko stojí poukážka na strih?', O), ('Balíček 2 koľko stojí?', O), ('Balíček 3 cena', O),
    ('Koľko stojí 20 ml farby navyše?', O), ('Čo dostanem za 10 eur?', B),
    # zápor
    ('Nechcem bradu, len strih. Koľko?', 'cena-strih'), ('Bez brady, iba vlasy, cena?', 'cena-strih'),
    ('Nechcem strih, len upraviť bradu', 'cena-brada'), ('Neholiť hlavu, len ostrihať, koľko?', 'cena-strih'),
    ('Nechcem britvu, bradu len strojčekom, koľko?', O), ('Nechcem umývať vlasy, bude to lacnejšie?', O),
    ('Ultra inclusive bez whisky je lacnejšie?', O),
    # dve služby naraz, čísla a veky
    ('Strih a úprava brady spolu koľko?', 'cena-strih-brada'), ('Strih a farbenie brady spolu koľko?', O),
    ('Strih pre mňa a pre syna (6), koľko spolu?', O), ('Oholenie hlavy a úprava brady naraz cena', O),
    ('Úprava obočia a depilácia uší spolu koľko?', O), ('Dvojičky, chlapci 5 rokov, koľko spolu?', O),
    ('Mám vlasy 15 cm, koľko zaplatím?', 'cena-dlhe'), ('Mám vlasy 3 cm, koľko stojí strih?', 'cena-strih'),
    ('Synovi je 9, koľko stojí strih?', 'deti'), ('Synovi je 11, koľko stojí strih?', O),
    ('Koľko stojí strih pre 30-ročného chlapa?', 'cena-strih'), ('Prídeme piati chlapi naraz, dá sa?', O),
    ('Koľko máte kresiel?', 'kresla'),
    # zdravie
    ('Mám alergiu na kolínsku, môžem prísť?', O), ('Mám vši, ostriháte ma?', O),
    ('Holenie hlavy po chemoterapii, dá sa?', O), ('Som tehotná, môžem na farbenie?', O),
    # podobné ponuke
    ('Holenie hlavy britvou koľko?', 'hlava'), ('Hot towel holenie tváre koľko?', 'holenie'),
    # zmiešané jazyky
    ('kolko stoji beard oil', O), ('haircut pre dcéru', O), ('ladies haircut cena', O),
    ("men's haircut bez brady kolko", 'cena-strih'),
    # krátke správy a zdvorilosti
    ('ok', B), ('ďakujem', B), ('dakujem pekne', B), ('👍', B), ('super, vďaka', B),
    ('prepáčte', B), ('ahoj', B), ('hm', B), ('?', B), ('nie', B), ('áno', B), ('18', B),
    ('sedačka', B), ('dovidenia', B), ('sorry', B),
]

EN = [
    ('How much is a women\'s haircut?', O), ('Haircut for my wife', O),
    ('Do you cut girls\' hair? My daughter is 6', O), ('How much for my son, he is 7?', 'deti'),
    ('My son is 13, does he get the kids price?', O), ('Haircut for my husband, price?', 'cena-strih'),
    ('Do you do nails?', O), ('Tattoo price', O), ('How long does a head shave take?', B),
    ('How long does the hot towel shave take?', B), ('How long does a haircut take?', 'trvanie'),
    ('Do you sell beard oil?', O), ('Beard balm price', O), ('Hair colouring for my wife', B),
    ('Hair colouring price', 'farbenie-vlasov'), ('Eyelash tint', O), ('Back waxing price', O),
    ('Ear and nose waxing price', 'depilacia'), ('No beard, just a haircut, how much?', 'cena-strih'),
    ('Haircut and beard trim together, price?', 'cena-strih-brada'),
    ('Head shave with a straight razor, how much?', 'hlava'), ('Can you come to my house?', O),
    ('Are you open on Christmas Day?', O), ('Are you open at midnight?', B), ('Do you take cards?', O),
    ('Gift card', O), ('Dog grooming', O), ('sorry', B), ('thanks', B), ('ok 👍', B),
    ('Package 2 price', O), ('My hair is 12 cm long, what is the price?', 'cena-dlhe'),
    ('Facial for women', O), ('Head massage', O), ('haircut pre manželku', O),
]

DE = [
    ('Damenhaarschnitt Preis', O), ('Haarschnitt für meine Frau', O),
    ('Kinderhaarschnitt für meine Tochter', O), ('Kinderhaarschnitt für meinen Sohn (5 Jahre)', 'deti'),
    ('Herrenhaarschnitt ohne Bart, was kostet das?', 'cena-strih'),
    ('Haarschnitt mit Bartpflege zusammen, Preis?', 'cena-strih-brada'),
    ('Wie lange dauert ein Haarschnitt?', 'trvanie'), ('Wie lange dauert die Bartfärbung?', B),
    ('Wie lange dauert die Kopfrasur?', B), ('Wie lange dauert Paket 1?', B),
    ('Was kostet eine Dauerwelle?', 'farbenie-vlasov'), ('Haarfärben für meine Frau', B),
    ('Kopfrasur mit Rasiermesser Preis', 'hlava'), ('Bartöl kaufen', O), ('Bartwachs Preis', O),
    ('Nagelstudio', O), ('Wimpernfärben', O), ('Rückenwaxing', O), ('Kopfmassage', O),
    ('Hausbesuch möglich?', O), ('An Feiertagen geöffnet?', O), ('Gutschein kaufen', O),
    ('Kartenzahlung möglich?', O), ('Hundefriseur', O), ('danke', B), ('Entschuldigung', B),
    ('Augenbrauenfärbung Preis', 'obocie'), ('Haare 15 cm lang, Preis?', 'cena-dlhe'),
    ('Haarschnitt für meinen Sohn, er ist 12', O),
]

HU = [
    ('Női hajvágás ára', O), ('Hajvágás a feleségemnek', O), ('Gyerekhajvágás lánynak', O),
    ('Mennyibe kerül a hajvágás a 6 éves fiamnak?', 'deti'),
    ('Férfi hajvágás szakáll nélkül mennyi?', 'cena-strih'),
    ('Hajvágás és szakálligazítás együtt mennyi?', 'cena-strih-brada'),
    ('Mennyi ideig tart a hajvágás?', 'trvanie'), ('Mennyi ideig tart a szakállfestés?', B),
    ('Mennyi ideig tart a fejborotválás?', B), ('Szakállfestés ára', 'farbenie-brady'),
    ('Körömfestés', O), ('Műköröm', O), ('Hajfestés a feleségemnek', B),
    ('Dauer ára', 'farbenie-vlasov'), ('Szempillafestés', O), ('Fejmasszázs', O),
    ('Szakállolaj vásárlás', O), ('Szakállbalzsam ára', O), ('Kutyakozmetika', O),
    ('Ajándékutalvány', O), ('Kártyás fizetés lehetséges?', O), ('Házhoz jön a borbély?', O),
    ('Karácsonykor nyitva vannak?', O), ('köszönöm', B), ('bocsánat', B),
    ('Fejborotválás borotvával mennyibe kerül?', 'hlava'), ('Tetoválás ára', O),
]

CS = [
    ('Dámský střih cena', O), ('Střih pro dceru', O), ('Střih pro manželku', O),
    ('Kolik stojí střih pro syna (6 let)?', 'deti'), ('Synovi je 12, platí dětský střih?', O),
    ('Pánský střih bez vousů kolik?', 'cena-strih'), ('Střih a úprava vousů dohromady', 'cena-strih-brada'),
    ('Jak dlouho trvá holení?', B), ('Jak dlouho trvá barvení vousů?', B),
    ('Jak dlouho trvá pánský střih?', 'trvanie'), ('Kolik stojí oholení hlavy břitvou?', 'hlava'),
    ('Barvení vlasů pro manželku', B), ('Manikúra', O), ('Tetování cena', O),
    ('Olej na vousy koupit', O), ('Vosk na vousy', O), ('Balzám na vousy', O), ('Střih doma', O),
    ('Stříháte i v nemocnici?', O), ('Masáž hlavy', O), ('Dárkový poukaz', O), ('Placení kartou', O),
    ('Máte dětskou sedačku?', O), ('děkuji', B), ('díky 👍', B), ('detox', O),
]

PL = [
    ('Strzyżenie damskie cena', O), ('Strzyżenie dla córki', O), ('Strzyżenie dla żony', O),
    ('Strzyżenie dla syna 6 lat', 'deti'), ('Strzyżenie męskie bez brody ile?', 'cena-strih'),
    ('Strzyżenie i trymowanie brody razem', 'cena-strih-brada'), ('Ile trwa golenie głowy?', B),
    ('Ile trwa farbowanie brody?', B), ('Ile trwa strzyżenie męskie?', 'trvanie'),
    ('Farbowanie brody cena', 'farbenie-brady'), ('Farbowanie włosów dla żony', B), ('Manicure', O),
    ('Tatuaż', O), ('Olejek do brody', O), ('Wosk do brody kupić', O), ('Masaż głowy', O),
    ('Bon podarunkowy', O), ('Płatność kartą', O), ('Dojazd do domu klienta', O),
    ('Otwarte w Wigilię?', O), ('Parking', O), ('Depilacja pleców', O), ('dziękuję', B),
    ('przepraszam', B), ('Golenie głowy brzytwą ile kosztuje?', 'hlava'), ('Regulacja brwi cena', 'obocie'),
]

SR = [
    ('Žensko šišanje cena', O), ('Šišanje za ćerku', O), ('Šišanje za ženu', O),
    ('Šišanje za sina od 6 godina', 'deti'), ('Muško šišanje bez brade koliko?', 'cena-strih'),
    ('Šišanje i uređivanje brade zajedno', 'cena-strih-brada'), ('Koliko traje brijanje glave?', B),
    ('Koliko traje farbanje brade?', B), ('Koliko traje muško šišanje?', 'trvanie'),
    ('Brijanje glave britvom cena', 'hlava'), ('Farbanje kose za ženu', B), ('Manikir', O),
    ('Tetovaža', O), ('Ulje za bradu', O), ('Vosak za bradu', O), ('Masaža glave', O),
    ('Poklon vaučer', O), ('Plaćanje karticom', O), ('Dolazite li kući?', O), ('Radite li za Božić?', O),
    ('hvala', B), ('izvini', B), ('Šišanje za psa', O), ('Depilacija leđa', O), ('Paket 2 cena', O),
]

UK = [
    ('Жіноча стрижка ціна', O), ('Стрижка для доньки', O), ('Стрижка для дружини', O),
    ('Стрижка для сина 6 років', 'deti'), ('Чоловіча стрижка без бороди скільки?', 'cena-strih'),
    ('Стрижка й оформлення бороди разом', 'cena-strih-brada'), ('Скільки триває гоління голови?', B),
    ('Скільки триває фарбування бороди?', B), ('Скільки триває чоловіча стрижка?', 'trvanie'),
    ('Гоління голови бритвою ціна', 'hlava'), ('Фарбування волосся для дружини', B), ('Манікюр', O),
    ('Тату', O), ('Олія для бороди', O), ('Віск для бороди', O), ('Масаж голови', O),
    ('Подарунковий сертифікат', O), ('Оплата карткою', O), ('Виїзд додому', O),
    ('Працюєте на Різдво?', O), ('дякую', B), ('вибачте', B), ('Стрижка для собаки', O),
    ('Депіляція спини', O), ('Пакет 2 ціна', O),
]

SADY = {'sk': SK, 'en': EN, 'de': DE, 'hu': HU, 'cs': CS, 'pl': PL, 'sr': SR, 'uk': UK}


def main():
    koren = sys.argv[1]
    riadky = open(os.path.join(koren, 'index.html'), encoding='utf-8').read().split('\n')
    chyby = 0
    for kod, (r, text) in ZDROJ.items():
        if text not in riadky[r - 1]:
            print('CHYBA zdroja', kod, r, text); chyby += 1
    vystup, videne = [], set()
    for jazyk, sada in SADY.items():
        for otazka, oc in sada:
            if (jazyk, otazka) in videne:
                print('DUPLIKÁT', jazyk, otazka); chyby += 1
            videne.add((jazyk, otazka))
            if oc not in (O, B) and oc not in ZDROJ:
                print('CHYBA id bez zdroja', oc); chyby += 1
            vystup.append({'jazyk': jazyk, 'otazka': otazka, 'ocakavane': oc})
    ciel = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sada-B.jsonl')
    with open(ciel, 'w', encoding='utf-8') as f:
        for v in vystup:
            f.write(json.dumps(v, ensure_ascii=False) + '\n')
    pocty = {j: len(s) for j, s in SADY.items()}
    druhy = {}
    for v in vystup:
        k = v['ocakavane'] if v['ocakavane'] in (O, B) else 'id'
        druhy[k] = druhy.get(k, 0) + 1
    print('spolu', len(vystup), pocty, druhy, 'chyby', chyby)
    sys.exit(1 if chyby else 0)


main()
