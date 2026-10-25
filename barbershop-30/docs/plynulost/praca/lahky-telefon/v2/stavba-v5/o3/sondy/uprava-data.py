# Oprava 3b – dáta: python3 -I uprava-data.py <sk.json> <jazyky_data.py> <jazyky-gen.py>
# Všeobecné pravidlá (ZASADY-ZHODY.md, p. 3, 4, 7):
#  a) silný kmeň služby s cenou = slovo z názvu alebo opisu služby na stránke (a jeho tvar/preklad); súčasť
#     balíka (whisky), nástroj (britva) a prenesené slovo (gentleman) je slabý kmeň; slovo pre inú službu, ktorú
#     stránka neuvádza (tetovanie), nie je kmeň vôbec; kmeň nesmie zahŕňať slovo iného významu (chlap = muž);
#  b) vek: každé číslo nad 10 (>10) spolu so slovom veku alebo dieťaťa;
#  c) „zaplatiť“ (sk, cs) je slabý kmeň témy platba (koľko zaplatím = cenová otázka), platiť, karta, hotovosť ostávajú silné;
#  d) opisné slová detského strihu zo stránky (fade) sú slabé kmene;
#  e) spojky (spoj) pre spojenú službu strih + brada (pravidlo „spolu“).
import json, re, sys
skp, dp, gp = sys.argv[1:4]

def nahrad(s, stare, nove, n=1):
    assert s.count(stare) == n, (stare, s.count(stare))
    return s.replace(stare, nove)

# ---- sk.json ----
s = open(skp, encoding='utf8').read()
s = nahrad(s, '"kluc": "Det Detsk Chlap Syn Synov Diet Gentlem Junior maly rok rokov rocn strih"',
              '"kluc": "Det Detsk Chlapec Chlapc Syn Synov Diet Junior Rocn gentlem maly rok rokov =10 fade strih"')
s = nahrad(s, '"kluc": "Holen Holit Hladk Towel Britv Ohol Oholen =hot"', '"kluc": "Holen Holit Hladk Towel Ohol Oholen britv =hot"')
s = nahrad(s, '"kluc": "Ohol Oholen Dohola Holen Holit Hladk Britv | hlav ples dohola"', '"kluc": "Ohol Oholen Dohola Holen Holit Hladk britv | hlav ples dohola"')
s = nahrad(s, '"kluc": "Ultra Inclusiv Whisk Najdrah Luxus balic"', '"kluc": "Ultra Inclusiv Najdrah Luxus whisk balic"')
s = nahrad(s, '"kluc": "Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb Ciar vlas"', '"kluc": "Ornament Kreativn Vzor Tribal Kresb Ciar vlas"')
s = nahrad(s, '"kluc": "Platb Platit Zaplat Kart ', '"kluc": "Platb Platit Kart ')
s = nahrad(s, 'Bankomat =Pay =Qr plat"', 'Bankomat =Pay =Qr plat zaplat"')
s = nahrad(s, '"kluc": "=11! =12! =13! =14! =15! =16! =17! =18! Tinedz Pubert | rok rokov rocn Tinedz Pubert"',
              '"kluc": ">10! Tinedz Pubert | rok rokov rocn Tinedz Pubert syn chlapec chlapc det diet"')
s = nahrad(s, '{"id": "cena-strih-brada","otazky"', '{"id": "cena-strih-brada","pravidlo": "spolu","otazky"')
s = nahrad(s, '"kluc": "Strih Ostrih pansk spolu | Brad Fuz Fuzo"', '"kluc": "Strih Ostrih pansk spolu | Brad Fuz Fuzo uprav"')
s = nahrad(s, '  "kontakt": {', '  "spoj": "a aj s so i plus",\n  "kontakt": {')
s = nahrad(s, '"kluc": "Strih Ostrih Fade Haircut pansk"', '"kluc": "Strih Ostrih Fade Haircut Pansk"')
s = nahrad(s, '"zdvor": "dakuj dekuj dik vdak prepac sorry ahoj cau dobr super fajn ok okej dovid zdravim jasne rozumiem"', '"zdvor": "dakuj dekuj dik vdak prepac sorry ahoj cau dobr vecer super fajn ok okej dovid zdravim jasne rozumiem"')
s = nahrad(s, '  "prah": {"odpoved": 0.55,"nevieme": 0.55,"blizko": 0.1},\n', '')
open(skp, 'w', encoding='utf8').write(s)
json.loads(s)

# ---- jazyky_data.py ----
d = open(dp, encoding='utf8').read()
N = '=11! =12! =13! =14! =15! =16! =17! =18! '
Z = {  # jazyk: [(starý reťazec, nový)]
 'EN': [("'Kid Child Children Boy Son Junior Gentlem Little year cut =hair'", "'Kid Child Children Boy Son Junior gentlem Little year =10 fade cut haircut =hair'"),
        ("'Shave Shaving Razor Towel Smooth Clean =hot'", "'Shave Shaving Towel Smooth Clean razor =hot'"),
        ("'Shave Shaved Shaving Razor Smooth Bald | head bald'", "'Shave Shaved Shaving Smooth Bald razor | head bald'"),
        ("'Ultra Inclusiv Whisk Luxur =most expensiv package'", "'Ultra Inclusiv Luxur =most expensiv whisk package'"),
        ("'Haircut =cut together combo | Beard'", "'Haircut =cut together combo men | Beard trim'"),
        ("'Pattern Design Tattoo Tribal Ornament Creative =hair'", "'Pattern Design Tribal Ornament Creative =hair'"),
        (N + "Teen Teenag Adolesc | year =old Teen Teenag Adolesc'", ">10! Teen Teenag Adolesc | year =old Teen Teenag Adolesc son boy kid child'")],
 'DE': [("'Kind Kinder Junge Sohn Junior Gentlem klein jahr schneid =haar =haare'", "'Kind Kinder Junge Sohn Junior gentlem klein jahr =10 fade schneid haarschnitt =haar =haare'"),
        ("'Rasur Rasier Rasiermesser Messer Towel Glatt =hot'", "'Rasur Rasier Towel Glatt rasiermesser messer =hot'"),
        ("'Kopfrasur Glatz Kahl Rasur Rasier Messer Glatt | kopf Kopfrasur glatz kahl'", "'Kopfrasur Glatz Kahl Rasur Rasier Glatt messer | kopf Kopfrasur glatz kahl'"),
        ("'Ultra Inclusiv Whisk Luxus =teuerstes paket'", "'Ultra Inclusiv Luxus =teuerstes whisk paket'"),
        ("'Muster Tattoo Tribal Linie Ornament Motiv Kreativ =haar =haare'", "'Muster Tribal Linie Ornament Motiv Kreativ =haar =haare'"),
        (N + "Teenager Jugendlich Pubert | jahr jährig =alt Teenager Jugendlich Pubert'", ">10! Teenager Jugendlich Pubert | jahr jährig =alt Teenager Jugendlich Pubert sohn junge kind'")],
 'CS': [("'Dět Děti Dětsk Kluk Chlap Syn Junior Gentlem rok střih'", "'Dět Děti Dětsk Kluk Chlapec Chlapc Syn Junior gentlem rok =10 fade střih'"),
        ("'Holen Holit Hladk Towel Břitv Ohol Oholen =hot'", "'Holen Holit Hladk Towel Ohol Oholen břitv =hot'"),
        ("'Ohol Oholen Dohola Holen Holit Hladk Břitv | hlav plešat dohola'", "'Ohol Oholen Dohola Holen Holit Hladk břitv | hlav plešat dohola'"),
        ("'Ultra Inclusiv Whisk Nejdražš Luxus balíč'", "'Ultra Inclusiv Nejdražš Luxus whisk balíč'"),
        ("'Střih Ostřih pánsk spolu | Vous Fous Brad'", "'Střih Ostřih pánsk spolu | Vous Fous Brad úprav'"),
        ("'Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb =Čáry =Čáru vlas'", "'Ornament Kreativn Vzor Tribal Kresb =Čáry =Čáru vlas'"),
        ("'Platb Platit Zaplat Kart ", "'Platb Platit Kart "), ("Terminál Bankomat =Pay =Qr plat'", "Terminál Bankomat =Pay =Qr plat zaplat'"),
        (N + "Teenager Puberť Dospív | rok roků =let letý Teenager Puberť Dospív'", ">10! Teenager Puberť Dospív | rok roků =let letý Teenager Puberť Dospív syn kluk chlapec chlapc dět'")],
 'PL': [("'Dziec Dzieci Chłop Chlop Syn Synk Junior Gentlem Dżentelm mał lat strzyż'", "'Dziec Dzieci Chłopiec Chłopc Chlopiec Chlopc Syn Synk Junior gentlem dżentelm mał lat =10 fade strzyż'"),
        ("'Golen Golic Golim Brzytw Gładk Towel =hot'", "'Golen Golic Golim Gładk Towel brzytw =hot'"),
        ("'Ogol Ogolen Golen Golic Golim Brzytw Gładk Łys Lys | głow glow łys lys'", "'Ogol Ogolen Golen Golic Golim Gładk Łys Lys brzytw | głow glow łys lys'"),
        ("'Ultra Inclusiv Whisk Najdroższ Luksus pakiet'", "'Ultra Inclusiv Najdroższ Luksus whisk pakiet'"),
        ("'Strzyż Ostrzyż razem | Brod Zarost Trymow'", "'Strzyż Ostrzyż razem męsk | Brod Zarost Trymow'"),
        ("'Ornament Kreatywn Wzór Wzor Wzory Tribal Tattoo Tatuaż Linie włos wlos'", "'Ornament Kreatywn Wzór Wzor Wzory Tribal Linie włos wlos'"),
        (N + "Nastolat Dojrzew | =lat =lata letni roku Nastolat Dojrzew'", ">10! Nastolat Dojrzew | =lat =lata letni roku Nastolat Dojrzew syn synk chłopiec chłopc chlopiec chlopc dziec'")],
 'HU': [("'Gyerek Fiú Fiam Kisfiú Úriember Junior Gentlem kis év vág vágt vágn haj'", "'Gyerek Fiú Fiam Kisfiú Junior úriember gentlem kis év =10 fade hajvág vág vágt vágn haj'"),
        ("'Borotv Borotvál Simára Towel Penge =hot'", "'Borotv Borotvál Simára Towel penge =hot'"),
        ("'Fejborotv Borotv Borotval Simára Penge Kopasz | fej Fejborotv kopasz'", "'Fejborotv Borotv Borotval Simára Kopasz penge | fej Fejborotv kopasz'"),
        ("'Ultra Inclusiv Whisk Legdrágább Luxus csomag'", "'Ultra Inclusiv Legdrágább Luxus whisk csomag'"),
        ("'Hajvág Vágás együtt | Szakáll'", "'Hajvág Vágás együtt férfi | Szakáll'"),
        ("'Ornament Kreatív Mint Minta Tribal Tattoo Tetovál Csík Vonal haj'", "'Ornament Kreatív Mint Minta Tribal Csík Vonal haj'"),
        (N + "Tinédzser Kamasz | =év Éves Tinédzser Kamasz'", ">10! Tinédzser Kamasz | =év Éves Tinédzser Kamasz fiam fiú gyerek'")],
 'SR': [("'Dec Deca Decu Dečij Dete Dečak Sin Junior Gentlem Džentlmen mal godin šiša'", "'Dec Deca Decu Dečij Dete Dečak Sin Junior gentlem džentlmen mal godin =10 fade šiša'"),
        ("'Brij Brijan Britv Glatk Towel =hot'", "'Brij Brijan Glatk Towel britv =hot'"),
        ("'Brij Brijan Obrij Britv Glatk Ćelav | glav ćelav'", "'Brij Brijan Obrij Glatk Ćelav britv | glav ćelav'"),
        ("'Ultra Inclusiv Whisk Visk Najskuplj Luksuz paket'", "'Ultra Inclusiv Najskuplj Luksuz whisk visk paket'"),
        ("'Šiša zajedno | Brad Uređiv Uredjiv'", "'Šiša zajedno mušk | Brad Uređiv Uredjiv'"),
        ("'Ornament Kreativn Šar Tribal Tattoo Tetov Crt Linij kosa kosu kose kosi kosom'", "'Ornament Kreativn Šar Tribal Crt Linij kosa kosu kose kosi kosom'"),
        (N + "Tinejdžer Pubert | godin Tinejdžer Pubert'", ">10! Tinejdžer Pubert | godin Tinejdžer Pubert sin dečak dete deca'")],
 'UK': [("'Діт Дітей Дитяч Дитин Хлопч Син Junior Джентльмен Маленьк мал рок стриж'", "'Діт Дітей Дитяч Дитин Хлопч Син Junior Маленьк джентльмен мал рок =10 fade стриж'"),
        ("'Голін Голит Голи Бритв Гладк Начисто Towel =hot'", "'Голін Голит Голи Гладк Начисто Towel бритв =hot'"),
        ("'Голін Голит Голи Поголит Бритв Гладк Лис | голов лис'", "'Голін Голит Голи Поголит Гладк Лис бритв | голов лис'"),
        ("'Ultra Inclusiv Віскі Whisk Найдорож Люкс пакет'", "'Ultra Inclusiv Найдорож Люкс віскі whisk пакет'"),
        ("'Стрижк Підстриг разом | Бород'", "'Стрижк Підстриг разом чолові | Бород оформ'"),
        ("'Орнамент Ornament Креатив Візерун Малюн Tribal Tattoo Тату Лінії волос'", "'Орнамент Ornament Креатив Візерун Малюн Tribal Лінії волос'"),
        (N + "Підліт | рок років річн Підліт'", ">10! Підліт | рок років річн Підліт син сина синові хлопч дит'")],
}
MUZ = {  # p. 3/7: slovo „pánsky“ z názvu Pánsky strih je silný kmeň strihu (v spojenej službe je slabý; inde nie, aby
         # ostalo kmeňom najviac dvoch položiek a počítalo sa do špecifickosti)
 'EN': [("'Haircut Fade =cut mens men'", "'Haircut Fade =cut Mens Men'")],
 'CS': [("'Střih Ostřih Fade Haircut pánsk'", "'Střih Ostřih Fade Haircut Pánsk'")],
 'PL': [("'Strzyż Ostrzyż Fade Haircut męsk panów'", "'Strzyż Ostrzyż Fade Haircut Męsk panów'")],
 'HU': [("'Hajvág Vágás Fade Haircut férfi'", "'Hajvág Vágás Fade Haircut Férfi'")],
 'SR': [("'Šiša Fade Haircut mušk'", "'Šiša Fade Haircut Mušk'")],
 'UK': [("'Стрижк Підстриг Фейд Fade Haircut чолові'", "'Стрижк Підстриг Фейд Fade Haircut Чолові'")],
}
SPOJ = {'EN': 'and with plus', 'DE': 'und mit plus', 'CS': 'a i s se plus', 'PL': 'i z oraz plus', 'HU': 'és meg plusz', 'SR': 'i sa plus', 'UK': 'і й та з плюс'}
for name, zmeny in Z.items():
    a = d.index(f'\n{name} = {{\n') + 1
    b = d.index('\n}\n', a) + 3
    t = d[a:b]
    for x, y in zmeny:
        t = nahrad(t, x, y)
    for x, y in MUZ.get(name, []):
        t = nahrad(t, x, y)
    m = re.search(r"\n 'zdvor': [^\n]*\n", t)
    t = t[:m.end()] + f" 'spoj': {SPOJ[name]!r},\n" + t[m.end():]
    d = d[:a] + t + d[b:]
open(dp, 'w', encoding='utf8').write(d)

# ---- jazyky-gen.py: spoj ako výplňové slová ----
g = open(gp, encoding='utf8').read()
if "'prah': SK['prah'], " in g:
    g = nahrad(g, "'prah': SK['prah'], ", '')  # prahy sú konštanty v recepcia.js
if "('vypln', 'zdvor', 'spoj')" not in g:
    g = nahrad(g, "for k in ('vypln', 'zdvor') if k in D}", "for k in ('vypln', 'zdvor', 'spoj') if k in D}")
    open(gp, 'w', encoding='utf8').write(g)
print('dáta upravené')

# ---- f) trojpísmenové výplňové slová do stop (p. 2 od 3 znakov) a g) témy nevieme len so zobrazovanou otázkou (váha) ----
STOP3 = {'sk': 'cez pri nad pod dam ist den kam vie nas nam moj bol sme ich jej ten raz asi iba aby mne',
         'EN': 'how why way got yes not all one out too off see may her she', 'DE': 'hab nur bis ihn ihm',
         'CS': 'dám jít den kam náš můj byl ten raz asi aby nad pod', 'PL': 'wie mój nam ich jej ten raz nad pod był niż',
         'HU': 'kit kér ide oda fel ezt azt két sok', 'SR': 'ste kod nas moj ide nad pod', 'UK': 'для мою мій моя нас над під він'}
s = open(skp, encoding='utf8').read()
m = re.search(r'\n  "stop": "([^"]*)"', s)
s = s[:m.start(1)] + m.group(1) + ' ' + STOP3['sk'] + s[m.end(1):]
d0 = json.loads(s)
for x in d0['nevieme']:
    if len(x['otazky']) > 1:
        old = '"otazky": ' + json.dumps(x['otazky'], ensure_ascii=False, separators=(',', ': ')).replace('", "', '","')
        s = nahrad(s, old, '"otazky": ' + json.dumps(x['otazky'][:1], ensure_ascii=False))
open(skp, 'w', encoding='utf8').write(s)
json.loads(s)
d = open(dp, encoding='utf8').read()
for name in ['EN', 'DE', 'CS', 'PL', 'HU', 'SR', 'UK']:
    a = d.index(f'\n{name} = {{\n') + 1
    b = d.index('\n}\n', a) + 3
    t = d[a:b]
    m = re.search(r"\n 'stop': (\"|')(.*?)\1,\n", t)
    t = t[:m.start(2)] + m.group(2) + ' ' + STOP3[name] + t[m.end(2):]
    d = d[:a] + t + d[b:]
open(dp, 'w', encoding='utf8').write(d)
g = open(gp, encoding='utf8').read()
if "o[:1]" not in g:
    g = nahrad(g, "q.update({'otazky': o, 'kluc': kluc(k), 'odovzdanie': od, 'akcie': p['akcie']})",
                  "q.update({'otazky': o[:1], 'kluc': kluc(k), 'odovzdanie': od, 'akcie': p['akcie']})  # téma: len zobrazovaná otázka (váha)")
    open(gp, 'w', encoding='utf8').write(g)
print('stop a otázky tém upravené')

# ---- h) položky v sk: varianty otázok len tam, kde menia odpoveď (zmerané na 1 291 otázkach); celý názov služby
#         z cenníka je variant sám osebe (p. 7), takže ostatné varianty sú zbytočná váha ----
VARIANT = {'email', 'recepcia', 'ceny-konecne', 'ultra', 'ornament', 'co-je-v-strihu', 'cena-strih-brada'}  # spojená služba: variant so spojkou (test 13)
s = open(skp, encoding='utf8').read()
for x in json.loads(s)['polozky']:
    if len(x['otazky']) > 1 and x['id'] not in VARIANT:
        old = '"otazky": ' + json.dumps(x['otazky'], ensure_ascii=False, separators=(',', ': ')).replace('", "', '","')
        s = nahrad(s, old, '"otazky": ' + json.dumps(x['otazky'][:1], ensure_ascii=False))
open(skp, 'w', encoding='utf8').write(s)
json.loads(s)
print('varianty sk orezané')
