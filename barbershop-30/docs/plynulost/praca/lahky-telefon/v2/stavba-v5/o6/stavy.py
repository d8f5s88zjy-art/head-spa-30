#!/usr/bin/env python3
"""Zostavenie commitov opravy 6 z konečného stavu (o6/final/) po etapách S1–S5.
  python3 -I stavy.py <etapa 1–5>   → zapíše súbory etapy do stromu hs-recepcia (JSON cez generátor) a do o6/stav/<n>/
Etapy (kumulatívne nad aeaafb7):
  S1 váha: varianty otázok len tam, kde menia odpoveď; tel: a mailto: v dátach (bez zmeny odpovedí)
  S2 voľby P2 a preklep: kandidát aj pri istej zhode so silným kmeňom, preklep len pri slove, ktoré nie je kmeňom, Dice len pri rovnakom prvom písmene
  S3 trieda W + Z: deň, zajtra, časť dňa a čas sú slová hodín; zdvorilé slovo-kmeň je pozdrav len po inom zdvorilom slove
  S4 triedy D + M: druhá osoba so spojkou, dieťa opísané veľkosťou
  S5 testy: nezávislé orákulum, P6f, P6g, P1 lint, otázky skeptika
"""
import ast, json, re, subprocess, sys, importlib.util
from pathlib import Path
SP = Path('/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad')
REPO = SP / 'hs-recepcia'; R = REPO / 'barbershop-30'; S5 = SP / 'barber/lahky-telefon/v2/stavba-v5'; O6 = S5 / 'o6'
FINAL = O6 / 'final'
head = lambda p: subprocess.run(['git', '-C', str(REPO), 'show', f'aeaafb7:barbershop-30/{p}'], capture_output=True, check=True).stdout.decode('utf8')

def rep(s, pary):
    for a, b in pary:
        assert s.count(a) == 1, (a[:80], s.count(a))
        s = s.replace(a, b)
    return s

# ---------- recepcia.js ----------
JS = {
 1: [("  a.href = k === 'tel' ? 'tel:' + h : k === 'email' ? 'mailto:' + h : h;\n", "  a.href = h;\n")],
 2: [(": dice(w, k) >= 0.6 ? 0.5 : 0;", ": w[0] === k[0] && dice(w, k) >= 0.6 ? 0.5 : 0;"),
     ("Math.max(...X._g.flat().map(([k, s]) => zhoda(w, k) * (s + 1)))", "Math.max(...X._g.flat().map(([k, s], z) => ((z = zhoda(w, k)) && z < 0.9 && zn(w) ? 0 : z * (z > 0.5 ? s + 1 : 1))))"),
     ("(x[0] >= 0.55 || (ce && x[0] * nv.length >= 2))", "(x[0] >= 0.55 || ((ce || x[1][3]) && x[0] * nv.length >= 2))")],
 3: [(".replace(/\\d+:\\d+|(^|\\D)\\d\\s?(cm|см)/gi, '$1'))", ".replace(/\\d+:\\d\\d|\\d+ ?[ap]\\.?m\\b/gi, ' 0h ').replace(/(^|\\D)\\d\\s?(cm|см)/gi, '$1'))"),
     ("zdv = zo(kb._zdv, pred), vyp", "zdv = zo(kb._zdv, pred), gr = (w) => zdv(u[u.indexOf(w) - 1] || ''), vyp"),
     ("const ws = w0.filter((w) => zn(w) || ce(w) || !(vyp(w) || zdv(w)));", "const ws = w0.filter((w) => (zn(w) && !(zdv(w) && gr(w))) || ce(w) || !(vyp(w) || zdv(w)));"),
     ("vol = (w) => ce(w) || vyp(w) || zdv(w) || ((w.length", "vol = (w) => ce(w) || vyp(w) || ((w.length")],
 4: [("&& !xs.includes(m)));\n", "&& !xs.includes(m))) && !(sp && X.ine?.split(' ').some((m) => Q.includes(` ${m} `)));\n")],
}
# ---------- sk.json ----------
SK = {
 1: [('"tel":"+421951267203"', '"tel":"tel:+421951267203"'), ('"email":"info@barbershop30.sk"', '"email":"mailto:info@barbershop30.sk"')],
 3: [('treba klasick male zajtra rano pondel utor stred stvrt piat sluzb', 'treba klasick male sluzb'),
     ('"zdvor":"dakuj dekuj dik vdak prepac sorry ahoj cau dobr vecer super', '"zdvor":"dakuj dekuj dik vdak prepac sorry ahoj cau dobr rano vecer super'),
     ('Teraz Dnes Prave Momentaln Aktualn kedy kolkej stihn"', 'Teraz Dnes Prave Momentaln Aktualn =0h! kedy kolkej stihn zajtra pondel utor =streda =stredu =stredy stvrtk stvrtok piatk piatok rano dopoludn doobed poobed popoludn vecer"'),
     ('Dohovor Rozum Hovor Speak', 'Dohovor =Rozumiete =Rozumie Hovor Speak')],
 4: [('iba aby mne roz"', 'iba aby mne mna roz"'),
     ('treba klasick male sluzb', 'treba klasick sluzb'),
     ('"kluc":"Det Detsk Chlapec Chlapc Syn Synov Diet Junior Rocn gentlem maly rok rokov =10 fade strih",', '"kluc":"Det Detsk Chlapec Chlapc Syn Synov Diet Junior Rocn gentlem maly male malych maleho malemu rok rokov =10 fade strih","ine":"mna mne",')],
}
# ---------- jazyky_data.py ----------
DATAP = {
 3: [("small tomorrow morning afternoon monday tuesday wednesday thursday friday service", "small service"),
     ("'Open Hour Close Closing Saturday Sunday Weekend Today =Now when time late early'", "'Open Hour Close Closing Saturday Sunday Weekend Today =Now =0h! when time late early tomorrow monday tuesday wednesday thursday friday morning afternoon evening tonight night'"),
     ("klein kleine morgen montag dienstag mittwoch donnerstag freitag leistung", "klein kleine leistung"),
     ("'Öffn Öffnung Offen Geöffn Zeit Schließ Schliess Samstag Sonntag Wochenend Heute Jetzt wann spät'", "'Öffn Öffnung Offen Geöffn Zeit Schließ Schliess Samstag Sonntag Wochenend Heute Jetzt =0h! wann spät montag dienstag mittwoch donnerstag freitag morgen vormittag nachmittag abend nacht'"),
     ("pane ráda zítra ráno odpoledn oběd pondělí úterý středa čtvrtek pátek týden služb", "pane ráda oběd týden služb"),
     ("'děkuj dík díky promiň promiňte sorry ahoj čau dobrý dobře dobrá super", "'děkuj dík díky promiň promiňte sorry ahoj čau dobrý dobře dobrá ráno večer odpoledne super"),
     ("'Otevř Otevír Otvír Zavír Zavř Sobot Neděl Víkend Teď Dnes Právě =kdy kolika stihn doba'", "'Otevř Otevír Otvír Zavír Zavř Sobot Neděl Víkend Teď Dnes Právě =0h! =kdy kolika stihn doba zítra pondělí úter =středa =středu =středy čtvrtek čtvrtk pátek pátk ráno dopoledn odpoledn večer'"),
     ("Domluv Rozum Mluv Speak", "Domluv =Rozumíte =Rozumí Mluv Speak"),
     ("dobr jutro rano popołudn poniedział wtorek środa czwartek piątek tydzień usług", "dobr tydzień usług"),
     ("'dziękuj dzięki przeprasz sorry cześć hej dzień dobry dobrze ok", "'dziękuj dzięki przeprasz sorry cześć hej dzień dobry dobrze wieczór ok"),
     ("'Otwar Otwier Godzin Zamyk Zamkn Sobot Niedziel Weekend Teraz Dziś Dzisiaj kiedy której'", "'Otwar Otwier Godzin Zamyk Zamkn Sobot Niedziel Weekend Teraz Dziś Dzisiaj =0h! kiedy której jutro poniedział wtor =środa =środę =środy czwart piątek piątk rano przedpołudn popołudn wieczor noc'"),
     ("'Odkąd =Roku =Rok Dział Dzial Istniej", "'Odkąd =Roku =Rok Działa Dziala Istniej"),
     ("Mówic Mówi Rozumie Speak", "Mówic Mówi =Rozumiecie =Rozumie Speak"),
     ("kicsi nagy holnap reggel délután hétfő kedd szerda csütörtök péntek szolgáltat", "kicsi nagy szolgáltat"),
     ("'Nyitva Nyitvatart Nyit Zár Zárva Szombat Vasárnap Hétvég Most =Ma mikor meddig hány'", "'Nyitva Nyitvatart Nyit Zár Zárva Szombat Vasárnap Hétvég Most =Ma =0h! mikor meddig hány holnap hétfő kedd szerda csütörtök péntek reggel délelőtt délután este éjjel'"),
     ("dobr sutra popodne ponedeljak utorak sreda četvrtak petak usluga", "dobr usluga"),
     ("'Otvor Radno vreme Zatvar Zatvor Subot Nedelj Vikend Sada Danas kad kada radite'", "'Otvor Radno vreme Zatvar Zatvor Subot Nedelj Vikend Sada Danas =0h! kad kada radite sutra ponedelj utor =sreda =sredu =srede četvrt petak petk jutro jutru prepodne popodne veče večer noć'"),
     ("добр завтра ранок понеділ вівтор середа четвер послуг", "добр послуг"),
     ("'дяку спасибі вибач sorry привіт добрий доброго день вечір", "'дяку спасибі вибач sorry привіт добрий доброго день вечір ранку"),
     ("'Відчин Відкри Годин Зачин Субот Неділ Вихідн Зараз Сьогодні коли котрої працює'", "'Відчин Відкри Годин Зачин Субот Неділ Вихідн Зараз Сьогодні =0h! коли котрої працює завтра понеділ вівтор середа середу четвер ятниц ранок ранку вранці вечір вечер вечор'"),
     ("'Онлайн Online Цілодоб =24! Інтернет ніч вечер вихідн запис брон'", "'Онлайн Online Цілодоб =24! Інтернет ніч вноч вечер вихідн запис брон'"),
     ("'Рецепц Адміністрат Зустр Привіт двер вхід'", "'Рецепц Адміністрат Зустр Привіта двер вхід'")],
 4: [("simple basic small service", "simple basic service"),
     ("'Kid Child Children Boy Son Junior gentlem Little year =10 fade cut haircut =hair'", "'Kid Child Children Boy Son Junior gentlem Little year =10 fade cut haircut =hair small'"),
     ("normal klassisch einfach klein kleine leistung", "normal klassisch einfach leistung"),
     ("jednu malé malý velk dobr", "jednu velk dobr"),
     ("'Dět Děti Dětsk Kluk Chlapec Chlapc Syn Junior gentlem rok =10 fade střih'", "'Dět Děti Dětsk Kluk Chlapec Chlapc Syn Junior gentlem rok =10 fade střih malý malé malých malého'"),
     ("jedna małe mały duży dobr", "jedna duży dobr"),
     ("klasszikus sima egyszerű kicsi nagy", "klasszikus =sima egyszerű nagy"),
     ("'Gyerek Fiú Fiam Kisfiú Junior úriember gentlem kis év =10 fade hajvág vág vágt vágn haj'", "'Gyerek Fiú Fiam Kisfiú Junior úriember gentlem kis kicsi év =10 fade hajvág vág vágt vágn haj'"),
     ('"a az és is van vannak vagy vagytok vagyok lehet kell', '"a az és is van vannak vagy vagytok vagyok lehet kell nekem engem'),
     ("jedna malo mali velik dobr", "jedna velik dobr"),
     ("onda gde gdje kad kada ko kome zašto", "onda gde gdje kad kada =ko kome zašto"),
     ('"je su sam si se da li na u do od za sa s o po pri iz', '"je su sam si se da li na u do od za sa s o po pri iz mene'),
     ("одна мале малий великий", "одна великий")],
}
INE = {'and with plus': 'me myself', 'und mit plus': 'mich mir', 'a i s se plus': 'mě mne', 'i z oraz plus': 'mnie', 'és meg plusz': 'nekem engem én', 'i sa plus': 'mene meni', 'і й та з плюс': 'мене мені'}
GEN4 = [("        q['akcie'] = p['akcie']  # zdroj a overene sú len v zdroje.json (rovnaké pre všetky jazyky)\n",
         "        if 'ine' in p:  # zámená prvej osoby, ktoré položka pre inú osobu nevysvetlí, keď ich otázka spája spojkou (oprava 6)\n            q['ine'] = stop(D['ine'][p['id']])\n        q['akcie'] = p['akcie']  # zdroj a overene sú len v zdroje.json (rovnaké pre všetky jazyky)\n")]

def otazky_z_finalu(s):
    """S1: zoznamy otázok položiek v jazyky_data.py nahradí zoznamami z konečného stavu (varianty, ktoré menia odpoveď)."""
    spec = importlib.util.spec_from_file_location('fin', FINAL / 'jazyky_data.py'); fin = importlib.util.module_from_spec(spec); spec.loader.exec_module(fin)
    NAZ = {'en': 'EN', 'uk': 'UK', 'hu': 'HU', 'sr': 'SR', 'pl': 'PL', 'de': 'DE', 'cs': 'CS'}
    for l, v in NAZ.items():
        st = sorted((s.index(f'\n{x} = {{'), y) for y, x in NAZ.items())
        hr = {y: (a, st[i + 1][0] if i + 1 < len(st) else s.index('\nDATA = ')) for i, (a, y) in enumerate(st)}
        a, b = hr[l]; blok = s[a:b]
        for pid, (oz, _) in fin.DATA[l]['polozky'].items():
            m = re.search(r"\n  '" + re.escape(pid) + r"': \(\[", blok); i = m.end() - 1; d = 0; j = i; q = None
            while True:
                c = blok[j]
                if q:
                    if c == '\\': j += 1
                    elif c == q: q = None
                elif c in '"\'': q = c
                elif c == '[': d += 1
                elif c == ']':
                    d -= 1
                    if d == 0: break
                j += 1
            novy = '[' + ', '.join(repr(x) if '"' in x or "'" not in x else json.dumps(x, ensure_ascii=False) for x in oz) + ']'
            blok = blok[:i] + novy + blok[j + 1:]
        s = s[:a] + blok + s[b:]
    return s

def etapa(n):
    js, sk, dat, gen = head('assets/recepcia.js'), head('assets/recepcia/sk.json'), (O6 / 'jazyky_data.pred-o6.py').read_text('utf8'), (O6 / 'jazyky-gen.pred-o6.py').read_text('utf8')
    test = head('source/tools/recepcia-kombinacie-test.mjs')
    for k in range(1, n + 1):
        js = rep(js, JS.get(k, [])); sk = rep(sk, SK.get(k, []))
        if k == 1: dat = otazky_z_finalu(dat)
        dat = rep(dat, DATAP.get(k, []))
        if k == 4:
            gen = rep(gen, GEN4)
            for spoj, ine in INE.items():
                a = f" 'spoj': '{spoj}',\n"
                dat = rep(dat, [(a, a + f" 'ine': {{'deti': '{ine}'}},  # zámeno prvej osoby: so spojkou je to druhá osoba, položka deti ju nevysvetlí (oprava 6, trieda D)\n")])
        if k == 5: test = (FINAL / 'recepcia-kombinacie-test.mjs').read_text('utf8')
    d = O6 / 'stav' / str(n); d.mkdir(parents=True, exist_ok=True)
    (d / 'jazyky_data.py').write_text(dat, 'utf8'); (d / 'jazyky-gen.py').write_text(gen, 'utf8')
    (R / 'assets/recepcia.js').write_text(js, 'utf8'); (R / 'assets/recepcia/sk.json').write_text(sk, 'utf8')
    (R / 'source/tools/recepcia-kombinacie-test.mjs').write_text(test, 'utf8')
    subprocess.run(['python3', '-I', str(d / 'jazyky-gen.py'), str(R)], check=True, capture_output=True)
    print(f'etapa S{n} zapísaná do stromu, dáta generátora v {d}')

if __name__ == '__main__':
    etapa(int(sys.argv[1]))
