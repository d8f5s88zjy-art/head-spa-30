#!/usr/bin/env python3
"""Oprava 3 po krokoch: zostaví assets/recepcia/{sk,zdroje}.json a jazyky_data.py pre krok 1–6 zo stavu HEAD d4657b7
(o3/sk.pred.json, jazyky_data.pred-o3.py) a spustí jazyky-gen.py. Krok 6 = konečný stav.
  python3 -I kroky.py <krok> <koreň barbershop-30>
Kroky: 1 zdroje.json + varianty bez vplyvu, 2 pravidlo 1 (krátke kmene), 3 pravidlá 2 a 5 (neznáme slovo, zdvorilosť),
4 pravidlo 3 (špecifickosť), 5 pravidlo 4 (triedy osôb, miest, veku, produktov), 6 pravidlo 6 (trvanie)."""
import ast, json, re, subprocess, sys
from pathlib import Path

KROK = int(sys.argv[1])
ROOT = Path(sys.argv[2])
O = Path(__file__).resolve().parent
S = O.parent
N = '=11! =12! =13! =14! =15! =16! =17! =18!'

# ---------------- sk.json (ručný zdroj) ----------------
SK_KLUC = [  # (krok, sekcia, id, kluc)
 (2, 'polozky', 'cena-strih-brada', 'Strih Ostrih spolu | Brad Fuz Fuzo'),
 (2, 'polozky', 'cena-brada', 'Brad Fuz Fuzo Zastrih uprav'),
 (2, 'polozky', 'cena-dlhe', 'Dlh Dlhs Dlhy =10! =Cm Priplat Drah vlas strih'),
 (2, 'polozky', 'deti', 'Det Detsk Chlap Syn Synov Diet Gentlem Junior rok rokov rocn strih'),
 (2, 'polozky', 'holenie', 'Holen Holit Hladk Towel Britv Ohol Oholen =hot'),
 (2, 'polozky', 'hlava', 'Ohol Oholen Dohola Holen | hlav ples dohola'),
 (2, 'polozky', 'obocie', 'Oboc farb farben uprav'),
 (2, 'polozky', 'farbenie-brady', 'Farb Farben Zafarb Ofarb | Brad Fuz Fuzo sediv sedin'),
 (2, 'polozky', 'farbenie-vlasov', 'Farb Farben Zafarb Ofarb Odfarb Melir Trval Blond Tonov | Vlas Melir Trval Blond roman'),
 (2, 'polozky', 'kava', 'Kav Caka Cakar Pock Napoj Obcerstv Mineralk Pit zdarma zadarmo'),
 (2, 'nevieme', 'storno', 'Zrus Zrusen Storn Presun Preloz Mesk Nestih Odvol Zmen termin poplat'),
 (2, 'nevieme', 'parkovanie', 'Park Parkov Zapark =Mhd Autobus Zastavk Garaz auto'),
 (2, 'nevieme', 'romana-ceny', 'Roman farb farben melir trval vlas kedy dni'),
 # pravidlo 3: slová z názvu služby v cenníku a celá trieda činnosti pri dvojskupinovej službe
 (4, 'polozky', 'cena-strih-brada', 'Strih Ostrih pansk spolu | Brad Fuz Fuzo'),
 (4, 'polozky', 'cena-dlhe', 'Dlh Dlhs Dlhy Dlzk =10! =Cm Priplat Drah vlas strih'),
 (4, 'polozky', 'deti', 'Det Detsk Chlap Syn Synov Diet Gentlem Junior maly rok rokov rocn strih'),
 (4, 'polozky', 'hlava', 'Ohol Oholen Dohola Holen Holit Hladk Britv | hlav ples dohola'),
 (4, 'polozky', 'plet', 'Plet Pokozk Starostl Peeling Mask Premium Osetren naparen tvar'),
 (4, 'polozky', 'ornament', 'Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb Ciar vlas'),
 # pravidlo 4: slovník tried (produkty, ženská osoba); zriedkavé tvary nechá na strážcu neznámych slov
 (5, 'nevieme', 'produkty', 'Produkt Pomad Predav Predaj Kupit Kupim Znack Kozmetik Pripravk =Gel Olej Balzam Hreben =Kefa =Kefu Serum Sampon Kondicion Sprej Puder Krem =Pena vosk vlas brad'),
 (5, 'nevieme', 'damske', 'Damsk =Damy Zensk =Zena =Zeny =Zenu =Zene Dievc Dcer Manzelk Priatelk Frajerk Slecn =Baba =Babu =Baby Babk Babic '
                          '=Mama =Mamu =Mamy =Mamou Mamk Mamin Mamic Sestr =Teta =Tetu Tetk Svokr Kamaratk'),
 # pravidlo 6: prvá skupina = slová o čase, druhá = služba bez mena
 (6, 'polozky', 'trvanie', 'Trvanie Minut =Trva =Trvat =Casu =Casovo dlho | strih brad'),
]
SK_VYPLN = 'robi pyta stal chcel potreb zaujim opyt spyt otazk viet treba klasick male zajtra rano pondel utor stred stvrt piat sluzb sluzie vlastne kolkych'
SK_ZDVOR = 'dakuj dekuj dik vdak prepac sorry ahoj cau dobr super fajn ok okej dovid zdravim jasne rozumiem'
SK_NOVE = [
    {'id': 'mimo', 'otazky': ['Chodíte strihať aj domov?', 'doma'], 'kluc': 'Domov =Doma =Domu Nemocnic Dochodc Hotel Svadb Vyjazd',
     'odovzdanie': 'Služby mimo podniku na webe neuvádzame.', 'akcie': ['tel', 'email']},
    {'id': 'vek', 'otazky': ['Strihate aj tínedžerov?', '12 rokov'], 'kluc': N + ' Tinedz Pubert | rok rokov rocn Tinedz Pubert',
     'odovzdanie': 'Strih pre chlapcov nad 10 rokov na webe neuvádzame.', 'akcie': ['tel', 'email']},
]
# price-time z cenníka (riadok medzi názvom a cenou); zdroj = rozsah názov–cena; overené 23. 10. 2026
SK_CAS = {
    'cena-strih': (['40 min'], ['index.html:529-531']), 'cena-strih-brada': (['60 min'], ['index.html:535-537']),
    'cena-brada': (['20 min'], ['index.html:565-567']), 'cena-dlhe': (['60 min'], ['index.html:541-543']),
    'deti': (['45 min'], ['index.html:547-549']), 'holenie': (['30 min'], ['index.html:571-573']),
    'hlava': (['25 min'], ['index.html:553-555']), 'balicky': (['65 min', '80 min'], ['index.html:589-591', 'index.html:595-597']),
    'ultra': (['80 min'], ['index.html:595-597']), 'plet': (['30 min'], ['index.html:607-609']),
    'obocie': (['5 min', '10 min'], ['index.html:613-615', 'index.html:631-633']), 'depilacia': (['10 min'], ['index.html:619-621']),
    'farbenie-brady': (['30 min'], ['index.html:577-579']), 'ornament': (['10 min'], ['index.html:625-627']),
}
# varianty otázok, ktoré menia výsledok v sadách (varianty.mjs); ostatné nad 2 sa vynechajú (váha)
SK_VARIANT = {'email': ['emailova adresa'], 'ornament': ['hair tattoo'], 'ceny-konecne': ['ceny', 'aké máte ceny'],
              'co-je-v-strihu': ['co je v strihu'], 'recepcia': ['kto ma privíta'], 'bez-objednania': ['bez objednania']}

d = json.loads((O / 'sk.pred.json').read_text('utf8'))
if KROK >= 3:
    d['vypln'], d['zdvor'] = SK_VYPLN, SK_ZDVOR
    d = {k: d[k] for k in ['jazyk', 'prah', 'stop', 'cenove', 'vypln', 'zdvor'] + [k for k in d if k not in ('jazyk', 'prah', 'stop', 'cenove', 'vypln', 'zdvor')]}
for krok, sek, pid, kluc in SK_KLUC:
    if krok <= KROK:
        next(p for p in d[sek] if p['id'] == pid)['kluc'] = kluc
for p in d['polozky'] + d['nevieme']:
    k = SK_VARIANT.get(p['id'], [])
    o = [p['otazky'][0]] + [x for x in p['otazky'][1:] if x in k]
    for x in p['otazky'][1:]:
        if len(o) < 2 and x not in o:
            o.append(x)
    p['otazky'] = o
if KROK >= 5:
    ids = [p['id'] for p in d['nevieme']]
    for n in SK_NOVE:
        d['nevieme'].insert(ids.index('cena-ina-sluzba'), n)
        ids = [p['id'] for p in d['nevieme']]
zdroje = {}
for i, p in enumerate(d['polozky']):
    z, o = p.pop('zdroj'), p.pop('overene')
    if KROK >= 6 and p['id'] in SK_CAS:
        cas, z = SK_CAS[p['id']]
        o = '2026-10-23'
        q = {}
        for k, v in p.items():
            q[k] = v
            if k == 'odpoved':
                q['cas'] = cas
        d['polozky'][i] = p = q
    if KROK >= 6 and p['id'] == 'trvanie':
        d['polozky'][i] = {'id': 'trvanie', 'pravidlo': 'cas', **{k: v for k, v in p.items() if k != 'id'}}
    zdroje[p['id']] = {'zdroj': z, 'overene': o}

c = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ': '))


def zapis(path, d):
    r = ['{']
    keys = list(d)
    for i, k in enumerate(keys):
        end = ',' if i < len(keys) - 1 else ''
        v = d[k]
        if k in ('polozky', 'nevieme'):
            r += [f'  "{k}": [', ',\n'.join('    ' + c(x) for x in v), '  ]' + end]
        elif k in ('kontakt', 'panel'):
            r += [f'  "{k}": {{', ',\n'.join(f'    {c(a)}: {c(b)}' for a, b in v.items()), '  }' + end]
        else:
            r.append(f'  {c(k)}: {c(v)}{end}')
    r.append('}')
    path.write_text('\n'.join(r) + '\n', 'utf8')


zapis(ROOT / 'assets/recepcia/sk.json', d)
(ROOT / 'assets/recepcia/zdroje.json').write_text('{\n' + ',\n'.join(f'  {c(k)}: {c(v)}' for k, v in zdroje.items()) + '\n}\n', 'utf8')

# ---------------- jazyky_data.py (7 jazykov) ----------------
JK = {  # jazyk: [(krok, sekcia, id, kluc)]; sekcia 'nove' = nová téma (otázky, kluc, odovzdanie)
 'EN': [
  (2, 'polozky', 'farbenie-brady', 'Colour Color Dye Dyeing Tint Grey Gray | Beard'),
  (2, 'polozky', 'farbenie-vlasov', 'Colour Color Dye Dyeing Highlight Perm Bleach Blond Tint | =Hair Highlight Perm Bleach Blond roman'),
  (4, 'polozky', 'ornament', 'Pattern Design Tattoo Tribal Ornament Creative =hair'),
  (4, 'polozky', 'cena-dlhe', 'Long =10! =Cm Extra Surcharg expensiv over =hair haircut'),
  (4, 'polozky', 'holenie', 'Shave Shaving Razor Towel Smooth Clean =hot'),
  (4, 'polozky', 'hlava', 'Shave Shaved Shaving Razor Smooth Bald | head bald'),
  (5, 'nevieme', 'damske', 'Women Woman Ladies Lady Girl Girls Female Daughter Wife Girlfriend Mom Mommy Mum Mummy Mother Mama Grandma Granny Grandmother Sister Aunt Niece Bride Fiancee'),
  (5, 'nevieme', 'produkty', 'Product Products Pomade Sell Selling Brand Cosmetic Shampoo =Gel Oil Balm Comb Brush Serum Conditioner Spray Cream Lotion Aftershave wax buy =hair beard'),
  (5, 'nove', 'mimo', (['Do you do home visits?', 'haircut at home'], 'Home House Hospital Hotel Wedding Nursing Outcall Onsite', "We don't list services outside the shop on the website.")),
  (5, 'nove', 'vek', (['Do you cut teenagers?', 'my son is 12 years old'], N + ' Teen Teenag Adolesc | year =old Teen Teenag Adolesc', "We don't list haircuts for boys over 10 on the website.")),
  (6, 'polozky', 'trvanie', 'Duration Minute Minutes =Take =Takes =long | haircut beard'),
 ],
 'DE': [
  (2, 'polozky', 'hodiny', 'Öffn Öffnung Offen Geöffn Zeit Schließ Schliess Samstag Sonntag Wochenend Heute Jetzt wann spät'),
  (2, 'polozky', 'farbenie-brady', 'Färb Farb Tönen Grau Bartfärb | Bart Bartfärb'),
  (2, 'polozky', 'cena-brada', 'Bart Trimm Barttrimm Bartpfleg pfleg'),
  (4, 'polozky', 'hlava', 'Kopfrasur Glatz Kahl Rasur Rasier Messer Glatt | kopf Kopfrasur glatz kahl'),
  (4, 'polozky', 'ornament', 'Muster Tattoo Tribal Linie Ornament Motiv Kreativ =haar =haare'),
  (4, 'polozky', 'cena-strih-brada', 'Haarschnitt Schnitt Herrenhaar zusammen | Bart Bartpfleg'),
  (4, 'polozky', 'cena-dlhe', 'lang Haarläng über =10! =Cm Aufpreis Teurer Zuschlag =haar =haare schnitt'),
  (5, 'nevieme', 'damske', 'Damen Dame Frau Frauen Mädchen Tochter Ehefrau Freundin Mutter Mama =Mami Mutti =Oma Schwester Tante Nichte Enkelin Kollegin Nachbarin Schwiegermutter Braut'),
  (5, 'nevieme', 'produkty', 'Produkt Pomade Verkauf Marke Kosmetik Shampoo =Gel =Öl Bartöl Haaröl Balsam Bartbalsam Bartwachs Haarwachs Kamm Bartkamm Bürste Serum Spray Creme Spülung Kaufen wachs =haar =haare bart'),
  (5, 'nove', 'mimo', (['Kommt ihr auch nach Hause?', 'Hausbesuch'], 'Hause =Haus Hausbesuch Krankenhaus Klinik Hotel Hochzeit Altenheim Pflegeheim Seniorenheim', 'Leistungen außerhalb des Barbershops nennen wir auf der Website nicht.')),
  (5, 'nove', 'vek', (['Schneidet ihr auch Teenager?', 'mein Sohn ist 12 Jahre alt'], N + ' Teenager Jugendlich Pubert | jahr jährig =alt Teenager Jugendlich Pubert', 'Haarschnitte für Jungen über 10 Jahre nennen wir auf der Website nicht.')),
  (6, 'polozky', 'trvanie', '=Dauer =Dauert Minut =lange | haarschnitt bart'),
 ],
 'CS': [
  (2, 'polozky', 'deti', 'Dět Děti Dětsk Kluk Chlap Syn Junior Gentlem rok střih'),
  (2, 'polozky', 'holenie', 'Holen Holit Hladk Towel Břitv Ohol Oholen =hot'),
  (2, 'polozky', 'hlava', 'Ohol Oholen Dohola Holen | hlav plešat dohola'),
  (2, 'polozky', 'kava', 'Káv Čeka Počk Nápoj Občerstv Minerálk Pít zdarma'),
  (2, 'nevieme', 'parkovanie', 'Park Parkov Zapark =Mhd Autobus Zastávk Garáž auto'),
  (4, 'polozky', 'hlava', 'Ohol Oholen Dohola Holen Holit Hladk Břitv | hlav plešat dohola'),
  (4, 'polozky', 'plet', 'Pleť Péč Pokožk Peeling Mask Premium Ošetřen napař obličej'),
  (4, 'polozky', 'ornament', 'Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb =Čáry =Čáru vlas'),
  (4, 'polozky', 'cena-dlhe', 'Dlouh Délk =10! =Cm Příplat Dražš vlas střih'),
  (4, 'polozky', 'cena-strih-brada', 'Střih Ostřih pánsk spolu | Vous Fous Brad'),
  (5, 'nevieme', 'damske', 'Dámsk =Dámy Žensk =Žena =Ženy =Ženu =Ženě Dívk Holk Holčič Dcer Manželk Přítelk =Máma =Mámu =Mámy Mamk Mamin Maminc Babičk =Babi Sestr =Teta =Tetu =Tety Tetk Tchyn Kamarádk Kolegyn Sousedk Neteř Vnučk Partnerk Nevěst'),
  (5, 'nevieme', 'produkty', 'Produkt Pomád Prodáv Prodej Koupit Koupím Značk Kosmetik Přípravk =Gel Olej Balzám Hřeben Kartáč Sérum Šampon Kondicion Sprej Pudr Krém =Pěna =Pěnu vosk vlas vous'),
  (5, 'nove', 'mimo', (['Chodíte stříhat i domů?', 'stříhání mimo provozovnu'], 'Domů =Doma Domov Nemocnic Důchodc Hospic Hotel Svatb Výjezd', 'Služby mimo provozovnu na webu neuvádíme.')),
  (5, 'nove', 'vek', (['Stříháte i teenagery?', 'syn má 12 let'], N + ' Teenager Puberť Dospív | rok roků =let letý Teenager Puberť Dospív', 'Střih pro kluky nad 10 let na webu neuvádíme.')),
  (6, 'polozky', 'trvanie', 'Trvání Minut =Trvá =Trvat =Času Časově dlouho | střih vous'),
 ],
 'PL': [
  (2, 'polozky', 'hlava', 'Ogol Ogolen Golen Łys Lys | głow glow łys lys'),
  (2, 'polozky', 'farbenie-brady', 'Farb Farbow Koloryz Odsiwi | Brod Zarost siw'),
  (2, 'polozky', 'farbenie-vlasov', 'Farb Farbow Koloryz Rozjaś Pasemk Balejaż Trwał Blond Ombre | Włos Wlos Pasemk Trwał Blond roman'),
  (2, 'polozky', 'obocie', 'Brwi Brew farb farbow regul henn'),
  (2, 'polozky', 'deti', 'Dziec Dzieci Chłop Chlop Syn Synk Junior Gentlem mał lat strzyż'),
  (2, 'polozky', 'cena-brada', 'Brod Zarost Trym Trymow Przycię modelow'),
  (2, 'nevieme', 'romana-ceny', 'roman farb farbow pasem trwał włos wlos kiedy dni'),
  (2, 'nevieme', 'parkovanie', 'Park Parkow Zapark Parking Garaż =Mpk Autobus Przystan auto'),
  (4, 'polozky', 'hlava', 'Ogol Ogolen Golen Golic Golim Brzytw Gładk Łys Lys | głow glow łys lys'),
  (4, 'polozky', 'deti', 'Dziec Dzieci Chłop Chlop Syn Synk Junior Gentlem Dżentelm mał lat strzyż'),
  (4, 'polozky', 'ornament', 'Ornament Kreatywn Wzór Wzor Wzory Tribal Tattoo Tatuaż Linie włos wlos'),
  (4, 'polozky', 'cena-strih-brada', 'Strzyż Ostrzyż razem | Brod Zarost Trymow'),
  (4, 'polozky', 'cena-strih', 'Strzyż Ostrzyż Fade Haircut męsk panów'),
  (4, 'polozky', 'cena-dlhe', 'Dług Dlug Dłuższ =10! =Cm Dopłat Doplat Droższ włos wlos strzyż'),
  (5, 'nevieme', 'damske', 'Damsk =Panie =Pan Kobiet Kobieta Dziewcz Córk Żona Żonę Żony Dziewczyn =Mama =Mamę =Mamy =Mamie Mamus Babc Siostr Ciot Cioc Teściow Koleżank Przyjaciółk Sąsiadk Siostrzenic Wnuczk Partnerk'),
  (5, 'nevieme', 'produkty', 'Produkt Pomad Sprzedaj Sprzedaż Kupi Kupić Marki Marka Kosmet =Żel =Olejek Olej Balsam Grzebień Szczotk Serum Szampon Odżywk Spray Lakier Krem Piank wosk włos brod'),
  (5, 'nove', 'mimo', (['Czy dojeżdżacie do domu?', 'strzyżenie w domu'], 'Domu =Dom =Domem Szpital Hotel Wesel Dojazd Dojeżdż Wyjazd Hospic', 'Usług poza salonem nie podajemy na stronie.')),
  (5, 'nove', 'vek', (['Czy strzyżecie nastolatków?', 'syn ma 12 lat'], N + ' Nastolat Dojrzew | =lat =lata letni roku Nastolat Dojrzew', 'Strzyżenia dla chłopców powyżej 10 lat nie podajemy na stronie.')),
  (6, 'polozky', 'trvanie', '=Trwa Trwanie Minut =Czasu =Czas długo dlugo | strzyż brod'),
 ],
 'HU': [
  (2, 'polozky', 'hlava', 'Fejborotv Borotv Kopasz | fej Fejborotv kopasz'),
  (2, 'polozky', 'farbenie-brady', 'Fest Festés Színez Szakállfest | Szakáll ősz'),
  (2, 'polozky', 'deti', 'Gyerek Fiú Fiam Kisfiú Junior Gentlem kis év vág vágt vágn haj'),
  (2, 'polozky', 'tim', 'Csapat Barber Borbély Fodrász Emberek =Ki =Nevek dolgoz vág vágt vágn'),
  (2, 'nevieme', 'romana-ceny', 'roman fest hajfest melír dauer haj mikor napok'),
  (4, 'polozky', 'hlava', 'Fejborotv Borotv Borotval Simára Penge Kopasz | fej Fejborotv kopasz'),
  (4, 'polozky', 'deti', 'Gyerek Fiú Fiam Kisfiú Úriember Junior Gentlem kis év vág vágt vágn haj'),
  (4, 'polozky', 'ornament', 'Ornament Kreatív Mint Minta Tribal Tattoo Tetovál Csík Vonal haj'),
  (4, 'polozky', 'cena-dlhe', 'Hossz Felett =10! =Cm Felár Drágább haj vágás'),
  (5, 'nevieme', 'damske', 'Női =Nő =Nők =Nőket Lány Lányom Feleség Barátnő =Anya =Anyu =Anyát =Anyám =Anyámat Anyuk =Mama =Mamát Nagymam Nagyi Nővér =Húg Húgom Nagynén Néni Kollégan Hölgy Asszony Menyasszony Unokahúg'),
  (5, 'nevieme', 'produkty', 'Termék Pomádé Árul Árusít Vásárol Vehet Márka Kozmetik Sampon =Zselé Olaj Balzsam Szakállolaj Hajolaj Hajwax Szakállviasz Fésű Kefe Szérum Spray Hajlakk Krém viasz haj szakáll'),
  (5, 'nove', 'mimo', (['Házhoz is jöttök?', 'hajvágás otthon'], 'Otthon Házhoz Kórház Szálloda Hotel Esküvő Idősek Kiszáll', 'Az üzleten kívüli szolgáltatásokat az oldalon nem tüntetjük fel.')),
  (5, 'nove', 'vek', (['Tinédzsereket is vágtok?', 'a fiam 12 éves'], N + ' Tinédzser Kamasz | =év Éves Tinédzser Kamasz', '10 év feletti fiúk hajvágását az oldalon nem tüntetjük fel.')),
  (6, 'polozky', 'trvanie', 'Ideig =Tart Tartam Perc Perces =idő | hajvág szakáll'),
 ],
 'SR': [
  (2, 'polozky', 'hlava', 'Brij Brijan Obrij Ćelav | glav ćelav'),
  (2, 'polozky', 'farbenie-brady', 'Farb Farban Ofarb Boj | Brad sed'),
  (2, 'polozky', 'farbenie-vlasov', 'Farb Farban Ofarb Boj Pramen Trajn Blond Izbelj | Kosa Kosu Kose Kosi Pramen Trajn Blond roman'),
  (2, 'polozky', 'obocie', 'Obrv farb farban sređ sredj'),
  (2, 'nevieme', 'romana-ceny', 'roman farb farban pramen trajn kosa kosu kose kosi kosom kad dan'),
  (4, 'polozky', 'hlava', 'Brij Brijan Obrij Britv Glatk Ćelav | glav ćelav'),
  (4, 'polozky', 'obocie', 'Obrv farb farban sređ sredj uređiv uredjiv'),
  (4, 'polozky', 'ornament', 'Ornament Kreativn Šar Tribal Tattoo Tetov Crt Linij kosa kosu kose kosi kosom'),
  (4, 'polozky', 'cena-strih-brada', 'Šiša zajedno | Brad Uređiv Uredjiv'),
  (4, 'polozky', 'cena-brada', 'Brad Trimov Sređiv Sredjiv Uređiv Uredjiv Oblikov'),
  (4, 'polozky', 'deti', 'Dec Deca Decu Dečij Dete Dečak Sin Junior Gentlem Džentlmen mal godin šiša'),
  (4, 'polozky', 'depilacia', 'Depil vosak vosk =Uši =Ušiju =Uho =Nos =Nosu =Nosa dlak'),
  (5, 'nevieme', 'damske', 'Žensk Žene Žena Ženu Devojč Devojk Ćerk Supruga =Suprugu =Mama =Mamu =Mami =Mame Majk =Baka =Baku =Baki Bakic Sestr Tetk =Tetu =Teta Svekrv Tašt Drugaric Prijateljic Komšinic Koleginic Nećakinj =Unuka =Unuku Verenic'),
  (5, 'nevieme', 'produkty', 'Proizvod Pomad Prodaj Prodaje Kupi Kupiti Brend Kozmetik Šampon =Gel Ulj Balzam Češalj Četk Serum Regenerator Sprej Krem vosak kosa kosu kose kosi kosom brad'),
  (5, 'nove', 'mimo', (['Da li dolazite kući?', 'šišanje kod kuće'], '=Kući =Kuću =Kuća =Kuće Bolnic Hotel Venčanj Svadb Staračk', 'Usluge van salona ne navodimo na sajtu.')),
  (5, 'nove', 'vek', (['Šišate li tinejdžere?', 'sin ima 12 godina'], N + ' Tinejdžer Pubert | godin Tinejdžer Pubert', 'Šišanje za dečake starije od 10 godina ne navodimo na sajtu.')),
  (6, 'polozky', 'trvanie', '=Traje =Trajanje Minut =Vremena dugo | šiša brad'),
 ],
 'UK': [
  (2, 'polozky', 'deti', 'Діт Дітей Дитяч Дитин Хлопч Син Junior Джентльмен мал рок стриж'),
  (2, 'polozky', 'farbenie-brady', 'Фарб Фарбув Пофарб Тонув | Бород сив'),
  (2, 'polozky', 'farbenie-vlasov', 'Фарб Фарбув Пофарб Мелір Хімзавив Завивк Блонд Освітл | Волос Мелір Завивк Блонд роман'),
  (2, 'polozky', 'obocie', 'Брів Брови Брову фарб фарбув корег корек'),
  (2, 'nevieme', 'romana-ceny', 'роман фарб фарбув мелір завивк волос коли дні'),
  (4, 'polozky', 'hlava', 'Голін Голит Голи Поголит Бритв Гладк Лис | голов лис'),
  (4, 'polozky', 'deti', 'Діт Дітей Дитяч Дитин Хлопч Син Junior Джентльмен Маленьк мал рок стриж'),
  (4, 'polozky', 'holenie', 'Голін Голит Голи Бритв Гладк Начисто Towel =hot'),
  (4, 'polozky', 'tim', 'Команд Барбер Barber Перукар Люди =Хто =Імена працю стриж'),
  (4, 'polozky', 'ornament', 'Орнамент Ornament Креатив Візерун Малюн Tribal Tattoo Тату Лінії волос'),
  (5, 'nevieme', 'damske', 'Жіноч Жінк Жінок Дівчат Доньк Дочк Дружин Дівчин Мама Маму Мамі Мамо Матір Бабус Бабц Сестр Тітк Тещ Свекр Подруг Сусідк Племінниц Онучк'),
  (5, 'nevieme', 'produkty', 'Продукт Продукц Помад Продає Продаж Купит Бренд Косметик Шампун =Гель Олі Бальзам Гребін Щітк Сироват Кондиціонер Спрей Крем віск волос бород'),
  (5, 'nove', 'mimo', (['Чи приїжджаєте додому?', 'стрижка вдома'], 'Додому Вдома =Дома Лікарн Госпітал Готел Весілл Виїзд Приїждж', 'Послуги поза барбершопом на сайті не вказуємо.')),
  (5, 'nove', 'vek', (['Чи стрижете підлітків?', 'синові 12 років'], N + ' Підліт | рок років річн Підліт', 'Стрижки для хлопців старше 10 років на сайті не вказуємо.')),
  (6, 'polozky', 'trvanie', 'Трива Тривал Хвилин =Часу довго | стриж бород'),
 ],
}
VZ = {  # výplňové a zdvorilé slová (krok 3)
 'EN': ("would like know need want tell question much many really kind sort normal regular classic simple basic small tomorrow morning afternoon monday tuesday wednesday thursday friday service usual mean guys charge",
        "thank thanks thx sorry hello hi hey ok okay good great bye goodbye cheers morning afternoon evening nice perfect understood alright fine cool"),
 'DE': ("möchte möchten hätte gern gerne würde frage fragen wissen brauche mal normal klassisch einfach klein kleine morgen montag dienstag mittwoch donnerstag freitag leistung eigentlich genau etwa ungefähr macht machen",
        "danke dank vielen hallo servus tschüss gut super okay ok entschuldigung guten morgen tag abend prima klasse verstanden"),
 'CS': ("děla chtěl chtěla potřeb zajím zeptat ptát otázk mohl můžete víte věděl třeba běžn normáln klasick obyčejn nějak jeden jedna jednu malé malý velk dobr pane ráda zítra ráno odpoledn oběd pondělí úterý středa čtvrtek pátek týden služb vlastně teda taky vůbec potom stál stála stálo celk",
        "děkuj dík díky promiň promiňte sorry ahoj čau dobrý dobře dobrá super fajn okej ok nashle zdravím pěkný jasně rozumím aha"),
 'PL': ("robi robić chciał chciała potrzeb interes zapytać pytanie wiecie trzeba normaln klasyczn zwykł jakiś jeden jedna małe mały duży dobr jutro rano popołudn poniedział wtorek środa czwartek piątek tydzień usług właściwie też potem bierze biorą",
        "dziękuj dzięki przeprasz sorry cześć hej dzień dobry dobrze ok okej super pozdraw widzenia rozumiem jasne"),
 'HU': ("csinál szeretn kérdez kérdés tudni kellene normál klasszikus sima egyszerű kicsi nagy holnap reggel délután hétfő kedd szerda csütörtök péntek szolgáltat tulajdonk",
        "köszön köszi bocsánat elnézést szia helló hello hallo jó napot estét reggelt rendben oké ok szuper viszlát értem"),
 'SR': ("radi raditi hteo htela treba zanima pitati pitanje znati normaln klasičn običn neki jedan jedna malo mali velik dobr sutra popodne ponedeljak utorak sreda četvrtak petak usluga zapravo takođe onda",
        "hvala izvini izvinite sorry zdravo ćao dobar dobro dan veče jutro pozdrav ok okej super razumem prijatno"),
 'UK': ("робите робити хотів хотіла потрібн цікав запитат питання знати звичайн класичн простий якийсь один одна мале малий великий добр завтра ранок понеділ вівтор середа четвер послуг взагалі також потім",
        "дякую дяку спасибі вибач вибачте sorry привіт добрий доброго день вечір окей ок супер зрозум побачен"),
}

src = (S / 'jazyky_data.pred-o3.py').read_text('utf8')
riadok = lambda t: '(' + ', '.join('[' + ', '.join(repr(x) for x in v) + ']' if isinstance(v, list) else repr(v) for v in t) + ')'
for name, zmeny in JK.items():
    a = src.index(f'\n{name} = {{\n') + 1
    b = src.index('\n}\n', a) + 3
    t = src[a:b]
    if KROK >= 3:
        m = re.search(r"\n 'cenove': [^\n]*\n", t)
        t = t[:m.end()] + f" 'vypln': {VZ[name][0]!r},\n 'zdvor': {VZ[name][1]!r},\n" + t[m.end():]
    nove = ''
    for krok, sek, pid, val in zmeny:
        if krok > KROK:
            continue
        if sek == 'nove':
            nove += f"\n  {pid!r}: {riadok(val)},"
            continue
        m = re.search(r"\n  '" + re.escape(pid) + r"': (\(.*\)),\n", t)
        v = list(ast.literal_eval(m.group(1)))
        v[1] = val
        t = t[:m.start(1)] + riadok(v) + t[m.end(1):]
    if nove:
        m = re.search(r"\n  'cena-ina-sluzba': ", t)
        t = t[:m.start()] + nove + t[m.start():]
    src = src[:a] + t + src[b:]
(S / 'jazyky_data.py').write_text(src, 'utf8')
subprocess.run([sys.executable, '-I', str(S / 'jazyky-gen.py'), str(ROOT)], check=True, stdout=subprocess.DEVNULL)
print(f'krok {KROK}: sk.json, zdroje.json, jazyky_data.py a 7 jazykov zapísané')
