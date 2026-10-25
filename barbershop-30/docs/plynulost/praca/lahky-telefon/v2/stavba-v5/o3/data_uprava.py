#!/usr/bin/env python3
"""Oprava 3: úprava jazyky_data.py (7 jazykov) podľa pravidiel zhody 1–6. Spustenie: python3 -I data_uprava.py <jazyky_data.py>
Mení len vybrané riadky (kmene), pridáva vypln/zdvor a témy mimo a vek. Idempotentné nie je – spúšťa sa nad zálohou pred-o3."""
import ast, re, sys
from pathlib import Path

P = Path(sys.argv[1])
src = P.read_text('utf8')
N = '=11! =12! =13! =14! =15! =16! =17! =18!'

ZMENY = {
 'EN': {
  'vypln': "would like know need want tell question much many really kind sort normal regular classic simple basic small tomorrow morning afternoon monday tuesday wednesday thursday friday service usual mean guys charge",
  'zdvor': "thank thanks thx sorry hello hi hey ok okay good great bye goodbye cheers morning afternoon evening nice perfect understood alright fine cool",
  'polozky': {
   'trvanie': 'Duration Minute Minutes =Take =Takes =long | haircut beard',
   'farbenie-brady': 'Colour Color Dye Dyeing Tint Grey Gray | Beard',
   'hlava': 'Shave Shaved Shaving Razor Smooth Bald | head bald',
   'farbenie-vlasov': 'Colour Color Dye Dyeing Highlight Perm Bleach Blond Tint | =Hair Highlight Perm Bleach Blond roman',
   'ornament': 'Pattern Design Tattoo Tribal Ornament Creative =hair',
   # slová z názvu služby v cenníku (price-name) patria medzi kmene položky
   'cena-dlhe': 'Long =10! =Cm Extra Surcharg expensiv over =hair haircut',
   'holenie': 'Shave Shaving Razor Towel Smooth Clean =hot',
  },
  'nevieme': {
   'damske': 'Women Woman Ladies Lady Girl Girls Female Daughter Wife Girlfriend Mom Mommy Mum Mummy Mother Mama Grandma Granny Grandmother Sister Aunt Niece Bride Fiancee',
   'produkty': 'Product Products Pomade Sell Selling Brand Cosmetic Shampoo =Gel Oil Balm Comb Brush Serum Conditioner Spray Cream Lotion Aftershave wax buy =hair beard',
  },
  'nove': {
   'mimo': (['Do you do home visits?', 'haircut at home'], 'Home House Hospital Hotel Wedding Nursing Outcall Onsite', "We don't list services outside the shop on the website."),
   'vek': (['Do you cut teenagers?', 'my son is 12 years old'], N + ' Teen Teenag Adolesc | year =old Teen Teenag Adolesc', "We don't list haircuts for boys over 10 on the website."),
  },
 },
 'DE': {
  'vypln': "möchte möchten hätte gern gerne würde frage fragen wissen brauche mal normal klassisch einfach klein kleine morgen montag dienstag mittwoch donnerstag freitag leistung eigentlich genau etwa ungefähr macht machen",
  'zdvor': "danke dank vielen hallo servus tschüss gut super okay ok entschuldigung guten morgen tag abend prima klasse verstanden",
  'polozky': {
   'hodiny': 'Öffn Öffnung Offen Geöffn Zeit Schließ Schliess Samstag Sonntag Wochenend Heute Jetzt wann spät',
   'trvanie': '=Dauer =Dauert Minut =lange | haarschnitt bart',
   'hlava': 'Kopfrasur Glatz Kahl Rasur Rasier Messer Glatt | kopf Kopfrasur glatz kahl',
   'farbenie-brady': 'Färb Farb Tönen Grau Bartfärb | Bart Bartfärb',
   'cena-brada': 'Bart Trimm Barttrimm Bartpfleg pfleg',
   # slová z názvu služby v cenníku (Herrenhaarschnitt und Bartpflege) patria medzi kmene položky
   'cena-strih-brada': 'Haarschnitt Schnitt Herrenhaar zusammen | Bart Bartpfleg',
   'cena-dlhe': 'lang Haarläng über =10! =Cm Aufpreis Teurer Zuschlag =haar =haare schnitt',
   'ornament': 'Muster Tattoo Tribal Linie Ornament Motiv Kreativ =haar =haare',
  },
  'nevieme': {
   'damske': 'Damen Dame Frau Frauen Mädchen Tochter Ehefrau Freundin Mutter Mama =Mami Mutti =Oma Schwester Tante Nichte Enkelin Kollegin Nachbarin Schwiegermutter Braut',
   'produkty': 'Produkt Pomade Verkauf Marke Kosmetik Shampoo =Gel =Öl Bartöl Haaröl Balsam Bartbalsam Bartwachs Haarwachs Kamm Bartkamm Bürste Serum Spray Creme Spülung Kaufen wachs =haar =haare bart',
  },
  'nove': {
   'mimo': (['Kommt ihr auch nach Hause?', 'Hausbesuch'], 'Hause =Haus Hausbesuch Krankenhaus Klinik Hotel Hochzeit Altenheim Pflegeheim Seniorenheim', 'Leistungen außerhalb des Barbershops nennen wir auf der Website nicht.'),
   'vek': (['Schneidet ihr auch Teenager?', 'mein Sohn ist 12 Jahre alt'], N + ' Teenager Jugendlich Pubert | jahr jährig =alt Teenager Jugendlich Pubert', 'Haarschnitte für Jungen über 10 Jahre nennen wir auf der Website nicht.'),
  },
 },
 'CS': {
  'vypln': "děla chtěl chtěla potřeb zajím zeptat ptát otázk mohl můžete víte věděl třeba běžn normáln klasick obyčejn nějak jeden jedna jednu malé malý velk dobr pane ráda zítra ráno odpoledn oběd pondělí úterý středa čtvrtek pátek týden služb vlastně teda taky vůbec potom stál stála stálo celk",
  'zdvor': "děkuj dík díky promiň promiňte sorry ahoj čau dobrý dobře dobrá super fajn okej ok nashle zdravím pěkný jasně rozumím aha",
  'polozky': {
   'deti': 'Dět Děti Dětsk Kluk Chlap Syn Junior Gentlem rok střih',
   'holenie': 'Holen Holit Hladk Towel Břitv Ohol Oholen =hot',
   'hlava': 'Ohol Oholen Dohola Holen Holit Hladk Břitv | hlav plešat dohola',
   'plet': 'Pleť Péč Pokožk Peeling Mask Premium Ošetřen napař obličej',
   'ornament': 'Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb =Čáry =Čáru vlas',
   'kava': 'Káv Čeka Počk Nápoj Občerstv Minerálk Pít zdarma',
   'cena-dlhe': 'Dlouh Délk =10! =Cm Příplat Dražš vlas střih',
   'cena-strih-brada': 'Střih Ostřih pánsk spolu | Vous Fous Brad',
   'trvanie': 'Trvání Minut =Trvá =Trvat =Času Časově dlouho | střih vous',
  },
  'nevieme': {
   'parkovanie': 'Park Parkov Zapark =Mhd Autobus Zastávk Garáž auto',
   'damske': 'Dámsk =Dámy Žensk =Žena =Ženy =Ženu =Ženě Dívk Holk Holčič Dcer Manželk Přítelk =Máma =Mámu =Mámy Mamk Mamin Maminc Babičk =Babi Sestr =Teta =Tetu =Tety Tetk Tchyn Kamarádk Kolegyn Sousedk Neteř Vnučk Partnerk Nevěst',
   'produkty': 'Produkt Pomád Prodáv Prodej Koupit Koupím Značk Kosmetik Přípravk =Gel Olej Balzám Hřeben Kartáč Sérum Šampon Kondicion Sprej Pudr Krém =Pěna =Pěnu vosk vlas vous',
  },
  'nove': {
   'mimo': (['Chodíte stříhat i domů?', 'stříhání mimo provozovnu'], 'Domů =Doma Domov Nemocnic Důchodc Hospic Hotel Svatb Výjezd', 'Služby mimo provozovnu na webu neuvádíme.'),
   'vek': (['Stříháte i teenagery?', 'syn má 12 let'], N + ' Teenager Puberť Dospív | rok roků =let letý Teenager Puberť Dospív', 'Střih pro kluky nad 10 let na webu neuvádíme.'),
  },
 },
 'PL': {
  'vypln': "robi robić chciał chciała potrzeb interes zapytać pytanie wiecie trzeba normaln klasyczn zwykł jakiś jeden jedna małe mały duży dobr jutro rano popołudn poniedział wtorek środa czwartek piątek tydzień usług właściwie też potem bierze biorą",
  'zdvor': "dziękuj dzięki przeprasz sorry cześć hej dzień dobry dobrze ok okej super pozdraw widzenia rozumiem jasne",
  'polozky': {
   'trvanie': '=Trwa Trwanie Minut =Czasu =Czas długo dlugo | strzyż brod',
   'hlava': 'Ogol Ogolen Golen Golic Golim Brzytw Gładk Łys Lys | głow glow łys lys',
   'farbenie-brady': 'Farb Farbow Koloryz Odsiwi | Brod Zarost siw',
   'farbenie-vlasov': 'Farb Farbow Koloryz Rozjaś Pasemk Balejaż Trwał Blond Ombre | Włos Wlos Pasemk Trwał Blond roman',
   'obocie': 'Brwi Brew farb farbow regul henn',
   'deti': 'Dziec Dzieci Chłop Chlop Syn Synk Junior Gentlem Dżentelm mał lat strzyż',
   'ornament': 'Ornament Kreatywn Wzór Wzor Wzory Tribal Tattoo Tatuaż Linie włos wlos',
   'cena-strih-brada': 'Strzyż Ostrzyż razem | Brod Zarost Trymow',
   'cena-strih': 'Strzyż Ostrzyż Fade Haircut męsk panów',
   'cena-brada': 'Brod Zarost Trym Trymow Przycię modelow',
   'cena-dlhe': 'Dług Dlug Dłuższ =10! =Cm Dopłat Doplat Droższ włos wlos strzyż',
  },
  'nevieme': {
   'romana-ceny': 'roman farb farbow pasem trwał włos wlos kiedy dni',
   'parkovanie': 'Park Parkow Zapark Parking Garaż =Mpk Autobus Przystan auto',
   'damske': 'Damsk =Panie =Pan Kobiet Kobieta Dziewcz Córk Żona Żonę Żony Dziewczyn =Mama =Mamę =Mamy =Mamie Mamus Babc Siostr Ciot Cioc Teściow Koleżank Przyjaciółk Sąsiadk Siostrzenic Wnuczk Partnerk',
   'produkty': 'Produkt Pomad Sprzedaj Sprzedaż Kupi Kupić Marki Marka Kosmet =Żel =Olejek Olej Balsam Grzebień Szczotk Serum Szampon Odżywk Spray Lakier Krem Piank wosk włos brod',
  },
  'nove': {
   'mimo': (['Czy dojeżdżacie do domu?', 'strzyżenie w domu'], 'Domu =Dom =Domem Szpital Hotel Wesel Dojazd Dojeżdż Wyjazd Hospic', 'Usług poza salonem nie podajemy na stronie.'),
   'vek': (['Czy strzyżecie nastolatków?', 'syn ma 12 lat'], N + ' Nastolat Dojrzew | =lat =lata letni roku Nastolat Dojrzew', 'Strzyżenia dla chłopców powyżej 10 lat nie podajemy na stronie.'),
  },
 },
 'HU': {
  'vypln': "csinál szeretn kérdez kérdés tudni kellene normál klasszikus sima egyszerű kicsi nagy holnap reggel délután hétfő kedd szerda csütörtök péntek szolgáltat tulajdonk",
  'zdvor': "köszön köszi bocsánat elnézést szia helló hello hallo jó napot estét reggelt rendben oké ok szuper viszlát értem",
  'polozky': {
   'trvanie': 'Ideig =Tart Tartam Perc Perces =idő | hajvág szakáll',
   'hlava': 'Fejborotv Borotv Borotval Simára Penge Kopasz | fej Fejborotv kopasz',
   'farbenie-brady': 'Fest Festés Színez Szakállfest | Szakáll ősz',
   'deti': 'Gyerek Fiú Fiam Kisfiú Úriember Junior Gentlem kis év vág vágt vágn haj',
   'tim': 'Csapat Barber Borbély Fodrász Emberek =Ki =Nevek dolgoz vág vágt vágn',
   'ornament': 'Ornament Kreatív Mint Minta Tribal Tattoo Tetovál Csík Vonal haj',
   'cena-dlhe': 'Hossz Felett =10! =Cm Felár Drágább haj vágás',
  },
  'nevieme': {
   'romana-ceny': 'roman fest hajfest melír dauer haj mikor napok',
   'damske': 'Női =Nő =Nők =Nőket Lány Lányom Feleség Barátnő =Anya =Anyu =Anyát =Anyám =Anyámat Anyuk =Mama =Mamát Nagymam Nagyi Nővér =Húg Húgom Nagynén Néni Kollégan Hölgy Asszony Menyasszony Unokahúg',
   'produkty': 'Termék Pomádé Árul Árusít Vásárol Vehet Márka Kozmetik Sampon =Zselé Olaj Balzsam Szakállolaj Hajolaj Hajwax Szakállviasz Fésű Kefe Szérum Spray Hajlakk Krém viasz haj szakáll',
  },
  'nove': {
   'mimo': (['Házhoz is jöttök?', 'hajvágás otthon'], 'Otthon Házhoz Kórház Szálloda Hotel Esküvő Idősek Kiszáll', 'Az üzleten kívüli szolgáltatásokat az oldalon nem tüntetjük fel.'),
   'vek': (['Tinédzsereket is vágtok?', 'a fiam 12 éves'], N + ' Tinédzser Kamasz | =év Éves Tinédzser Kamasz', '10 év feletti fiúk hajvágását az oldalon nem tüntetjük fel.'),
  },
 },
 'SR': {
  'vypln': "radi raditi hteo htela treba zanima pitati pitanje znati normaln klasičn običn neki jedan jedna malo mali velik dobr sutra popodne ponedeljak utorak sreda četvrtak petak usluga zapravo takođe onda",
  'zdvor': "hvala izvini izvinite sorry zdravo ćao dobar dobro dan veče jutro pozdrav ok okej super razumem prijatno",
  'polozky': {
   'trvanie': '=Traje =Trajanje Minut =Vremena dugo | šiša brad',
   'hlava': 'Brij Brijan Obrij Britv Glatk Ćelav | glav ćelav',
   'farbenie-brady': 'Farb Farban Ofarb Boj | Brad sed',
   'farbenie-vlasov': 'Farb Farban Ofarb Boj Pramen Trajn Blond Izbelj | Kosa Kosu Kose Kosi Pramen Trajn Blond roman',
   'obocie': 'Obrv farb farban sređ sredj uređiv uredjiv',
   'ornament': 'Ornament Kreativn Šar Tribal Tattoo Tetov Crt Linij kosa kosu kose kosi kosom',
   'cena-strih-brada': 'Šiša zajedno | Brad Uređiv Uredjiv',
   'cena-brada': 'Brad Trimov Sređiv Sredjiv Uređiv Uredjiv Oblikov',
   'deti': 'Dec Deca Decu Dečij Dete Dečak Sin Junior Gentlem Džentlmen mal godin šiša',
   'depilacia': 'Depil vosak vosk =Uši =Ušiju =Uho =Nos =Nosu =Nosa dlak',
  },
  'nevieme': {
   'romana-ceny': 'roman farb farban pramen trajn kosa kosu kose kosi kosom kad dan',
   'damske': 'Žensk Žene Žena Ženu Devojč Devojk Ćerk Supruga =Suprugu =Mama =Mamu =Mami =Mame Majk =Baka =Baku =Baki Bakic Sestr Tetk =Tetu =Teta Svekrv Tašt Drugaric Prijateljic Komšinic Koleginic Nećakinj =Unuka =Unuku Verenic',
   'produkty': 'Proizvod Pomad Prodaj Prodaje Kupi Kupiti Brend Kozmetik Šampon =Gel Ulj Balzam Češalj Četk Serum Regenerator Sprej Krem vosak kosa kosu kose kosi kosom brad',
  },
  'nove': {
   'mimo': (['Da li dolazite kući?', 'šišanje kod kuće'], '=Kući =Kuću =Kuća =Kuće Bolnic Hotel Venčanj Svadb Staračk', 'Usluge van salona ne navodimo na sajtu.'),
   'vek': (['Šišate li tinejdžere?', 'sin ima 12 godina'], N + ' Tinejdžer Pubert | godin Tinejdžer Pubert', 'Šišanje za dečake starije od 10 godina ne navodimo na sajtu.'),
  },
 },
 'UK': {
  'vypln': "робите робити хотів хотіла потрібн цікав запитат питання знати звичайн класичн простий якийсь один одна мале малий великий добр завтра ранок понеділ вівтор середа четвер послуг взагалі також потім",
  'zdvor': "дякую дяку спасибі вибач вибачте sorry привіт добрий доброго день вечір окей ок супер зрозум побачен",
  'polozky': {
   'trvanie': 'Трива Тривал Хвилин =Часу довго | стриж бород',
   'hlava': 'Голін Голит Голи Поголит Бритв Гладк Лис | голов лис',
   'deti': 'Діт Дітей Дитяч Дитин Хлопч Син Junior Джентльмен Маленьк мал рок стриж',
   'holenie': 'Голін Голит Голи Бритв Гладк Начисто Towel =hot',
   'tim': 'Команд Барбер Barber Перукар Люди =Хто =Імена працю стриж',
   'farbenie-brady': 'Фарб Фарбув Пофарб Тонув | Бород сив',
   'farbenie-vlasov': 'Фарб Фарбув Пофарб Мелір Хімзавив Завивк Блонд Освітл | Волос Мелір Завивк Блонд роман',
   'obocie': 'Брів Брови Брову фарб фарбув корег корек',
   'ornament': 'Орнамент Ornament Креатив Візерун Малюн Tribal Tattoo Тату Лінії волос',
  },
  'nevieme': {
   'romana-ceny': 'роман фарб фарбув мелір завивк волос коли дні',
   'damske': 'Жіноч Жінк Жінок Дівчат Доньк Дочк Дружин Дівчин Мама Маму Мамі Мамо Матір Бабус Бабц Сестр Тітк Тещ Свекр Подруг Сусідк Племінниц Онучк',
   'produkty': 'Продукт Продукц Помад Продає Продаж Купит Бренд Косметик Шампун =Гель Олі Бальзам Гребін Щітк Сироват Кондиціонер Спрей Крем віск волос бород',
  },
  'nove': {
   'mimo': (['Чи приїжджаєте додому?', 'стрижка вдома'], 'Додому Вдома =Дома Лікарн Госпітал Готел Весілл Виїзд Приїждж', 'Послуги поза барбершопом на сайті не вказуємо.'),
   'vek': (['Чи стрижете підлітків?', 'синові 12 років'], N + ' Підліт | рок років річн Підліт', 'Стрижки для хлопців старше 10 років на сайті не вказуємо.'),
  },
 },
}


def blok(name):
    a = src.index(f'\n{name} = {{\n') + 1
    b = src.index('\n}\n', a) + 3
    return a, b


def riadok(t):
    """Python zápis n-tice ako v jazyky_data.py (repr reťazcov)."""
    return '(' + ', '.join('[' + ', '.join(repr(x) for x in v) + ']' if isinstance(v, list) else repr(v) for v in t) + ')'


for name, Z in ZMENY.items():
    a, b = blok(name)
    t = src[a:b]
    # vypln a zdvor za 'cenove'
    m = re.search(r"\n 'cenove': [^\n]*\n", t)
    t = t[:m.end()] + f" 'vypln': {Z['vypln']!r},\n 'zdvor': {Z['zdvor']!r},\n" + t[m.end():]
    for sekcia in ('polozky', 'nevieme'):
        for pid, kluc in Z[sekcia].items():
            m = re.search(r"\n  '" + re.escape(pid) + r"': (\(.*\)),\n", t)
            assert m, (name, pid)
            v = list(ast.literal_eval(m.group(1)))
            v[1] = kluc
            t = t[:m.start(1)] + riadok(v) + t[m.end(1):]
    # nové témy pred cena-ina-sluzba
    m = re.search(r"\n  'cena-ina-sluzba': ", t)
    nove = ''.join(f"\n  {pid!r}: {riadok(v)}," for pid, v in Z['nove'].items())
    t = t[:m.start()] + nove + t[m.start():]
    src = src[:a] + t + src[b:]

P.write_text(src, 'utf8')
print('jazyky_data.py upravený')
