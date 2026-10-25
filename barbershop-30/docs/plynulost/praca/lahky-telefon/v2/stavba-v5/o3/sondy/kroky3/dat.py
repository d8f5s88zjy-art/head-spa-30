#!/usr/bin/env python3
"""Oprava 3b po krokoch – dáta: python3 -I dat.py <krok 7|8|9> <sk.json> <jazyky_data.py> <jazyky-gen.py>
Vstupy musia byť v stave commitu 366c21f (kroky3/base/); kroky sa aplikujú kumulatívne.
 7 váha: prahy v kóde (preč z JSON), témy nevieme len so zobrazovanou otázkou, varianty sk len tam, kde menia odpoveď
 8 p. 7 a p. 3: silný kmeň = slovo z názvu alebo opisu služby; súčasť (whisky), nástroj (britva), prenesené slovo
   (gentleman) slabé; tetovanie nie je kmeň; chlap (muž) nie je chlapec; slovo „pánsky“ silné pri strihu; spojky
   a spojená služba (pravidlo „spolu“) so slovami názvov svojich častí
 9 p. 4 a p. 2: vek >10 so slovom veku alebo dieťaťa; trojpísmenové výplňové slová do stop; dobrý večer;
   „zaplatiť“ (sk, cs) slabé (koľko zaplatím = cenová otázka)"""
import json, re, sys
KROK = int(sys.argv[1]); skp, dp, gp = sys.argv[2:5]

def nahrad(s, stare, nove, n=1):
    assert s.count(stare) == n, (stare, s.count(stare))
    return s.replace(stare, nove)

def bez_variantov(s, ponechat=()):
    d0 = json.loads(s)
    for x in d0['nevieme'] + d0['polozky']:
        if len(x['otazky']) > 1 and x['id'] not in ponechat and (x in d0['nevieme'] or 'odovzdanie' not in x):
            old = '"otazky": ' + json.dumps(x['otazky'], ensure_ascii=False, separators=(',', ': ')).replace('", "', '","')
            s = nahrad(s, old, '"otazky": ' + json.dumps(x['otazky'][:1], ensure_ascii=False))
    return s

def jazyk(d, name, f):
    a = d.index(f'\n{name} = {{\n') + 1
    b = d.index('\n}\n', a) + 3
    return d[:a] + f(d[a:b]) + d[b:]

s = open(skp, encoding='utf8').read()
d = open(dp, encoding='utf8').read()
g = open(gp, encoding='utf8').read()

# ---- krok 7: váha ----
s = nahrad(s, '  "prah": {"odpoved": 0.55,"nevieme": 0.55,"blizko": 0.1},\n', '')
# téma nevieme: len zobrazovaná otázka (druhé otázky tém menia 1 z 1 431 odpovedí)
s = bez_variantov(s, {p['id'] for p in json.loads(s)['polozky']})
g = nahrad(g, "'prah': SK['prah'], ", '')  # prahy sú konštanty v recepcia.js
g = nahrad(g, "q.update({'otazky': o, 'kluc': kluc(k), 'odovzdanie': od, 'akcie': p['akcie']})",
              "q.update({'otazky': o[:1], 'kluc': kluc(k), 'odovzdanie': od, 'akcie': p['akcie']})  # téma: len zobrazovaná otázka (váha)")

# ---- krok 8: p. 7 a p. 3 ----
if KROK >= 8:
    # položky sk: varianty otázok len tam, kde menia odpoveď – celý názov služby z cenníka je od kroku 8 variant sám
    # osebe (bez ostatných variantov 0 zmien na 1 431 otázkach)
    VARIANT = {'email', 'recepcia', 'ceny-konecne', 'ultra', 'ornament', 'co-je-v-strihu', 'cena-strih-brada'}
    s = bez_variantov(s, VARIANT | {p['id'] for p in json.loads(s)['nevieme']})
    s = nahrad(s, '"kluc": "Det Detsk Chlap Syn Synov Diet Gentlem Junior maly rok rokov rocn strih"',
                  '"kluc": "Det Detsk Chlapec Chlapc Syn Synov Diet Junior Rocn gentlem maly rok rokov =10 fade strih"')
    s = nahrad(s, '"kluc": "Holen Holit Hladk Towel Britv Ohol Oholen =hot"', '"kluc": "Holen Holit Hladk Towel Ohol Oholen britv =hot"')
    s = nahrad(s, '"kluc": "Ohol Oholen Dohola Holen Holit Hladk Britv | hlav ples dohola"', '"kluc": "Ohol Oholen Dohola Holen Holit Hladk britv | hlav ples dohola"')
    s = nahrad(s, '"kluc": "Ultra Inclusiv Whisk Najdrah Luxus balic"', '"kluc": "Ultra Inclusiv Najdrah Luxus whisk balic"')
    s = nahrad(s, '"kluc": "Ornament Kreativn Vzor Tribal Tattoo Tetov Kresb Ciar vlas"', '"kluc": "Ornament Kreativn Vzor Tribal Kresb Ciar vlas"')
    s = nahrad(s, '{"id": "cena-strih-brada","otazky"', '{"id": "cena-strih-brada","pravidlo": "spolu","otazky"')
    s = nahrad(s, '"kluc": "Strih Ostrih pansk spolu | Brad Fuz Fuzo"', '"kluc": "Strih Ostrih pansk spolu | Brad Fuz Fuzo uprav"')
    s = nahrad(s, '"kluc": "Strih Ostrih Fade Haircut pansk"', '"kluc": "Strih Ostrih Fade Haircut Pansk"')
    s = nahrad(s, '  "kontakt": {', '  "spoj": "a aj s so i plus",\n  "kontakt": {')
    g = nahrad(g, "for k in ('vypln', 'zdvor') if k in D}", "for k in ('vypln', 'zdvor', 'spoj') if k in D}")

# ---- krok 9: p. 4 a p. 2 ----
if KROK >= 9:
    s = nahrad(s, '"kluc": "=11! =12! =13! =14! =15! =16! =17! =18! Tinedz Pubert | rok rokov rocn Tinedz Pubert"',
                  '"kluc": ">10! Tinedz Pubert | rok rokov rocn Tinedz Pubert syn chlapec chlapc det diet"')
    s = nahrad(s, '"kluc": "Platb Platit Zaplat Kart ', '"kluc": "Platb Platit Kart ')
    s = nahrad(s, 'Bankomat =Pay =Qr plat"', 'Bankomat =Pay =Qr plat zaplat"')
    s = nahrad(s, '"zdvor": "dakuj dekuj dik vdak prepac sorry ahoj cau dobr super', '"zdvor": "dakuj dekuj dik vdak prepac sorry ahoj cau dobr vecer super')

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
STOP3 = {'sk': 'cez pri nad pod dam ist den kam vie nas nam moj bol sme ich jej ten raz asi iba aby mne',
         'EN': 'how why way got yes not all one out too off see may her she', 'DE': 'hab nur bis ihn ihm',
         'CS': 'dám jít den kam náš můj byl ten raz asi aby nad pod', 'PL': 'wie mój nam ich jej ten raz nad pod był niż',
         'HU': 'kit kér ide oda fel ezt azt két sok', 'SR': 'ste kod nas moj ide nad pod', 'UK': 'для мою мій моя нас над під він'}

K9 = lambda x, y: x.startswith(N) or "'Platb Platit Zaplat Kart " in x or "Terminál Bankomat =Pay =Qr plat'" in x
if KROK >= 9:
    m = re.search(r'\n  "stop": "([^"]*)"', s)
    s = s[:m.start(1)] + m.group(1) + ' ' + STOP3['sk'] + s[m.end(1):]
for name, zmeny in Z.items():
    def f(t):
        for x, y in zmeny:
            if (KROK >= 9) if K9(x, y) else (KROK >= 8):
                t = nahrad(t, x, y)
        if KROK >= 8:
            for x, y in MUZ.get(name, []):
                t = nahrad(t, x, y)
            m = re.search(r"\n 'zdvor': [^\n]*\n", t)
            t = t[:m.end()] + f" 'spoj': {SPOJ[name]!r},\n" + t[m.end():]
        if KROK >= 9:
            m = re.search(r"\n 'stop': (\"|')(.*?)\1,\n", t)
            t = t[:m.start(2)] + m.group(2) + ' ' + STOP3[name] + t[m.end(2):]
        return t
    d = jazyk(d, name, f)

json.loads(s)
open(skp, 'w', encoding='utf8').write(s)
open(dp, 'w', encoding='utf8').write(d)
open(gp, 'w', encoding='utf8').write(g)
print(f'dáta krok {KROK} zapísané')
