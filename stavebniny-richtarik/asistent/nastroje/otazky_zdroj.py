"""Zdroj častých otázok asistenta Stavebnín Richtárik (overené odpovede len z asistent/znalosti/richtarik.md).
Spustenie: python3 -I asistent/nastroje/otazky_zdroj.py <priečinok webu stavebniny-richtarik>
Zapíše asistent/znalosti/richtarik-otazky.json, jeho kópiu pre web assets/asistent-otazky.json a časť „Stránky webu“
v asistent/znalosti/richtarik.md (len stránky, ktoré na webe naozaj sú; doprava.html a caste-otazky.html pribudnú
s textami webu). Po zmene stránok webu spustiť znova, potom kontrolu node asistent/nastroje/otazky.mjs <priečinok>.
Každá odpoveď: q otázka, v iné znenia, a odpoveď, t téma, tel = pod odpoveď patrí Zavolať (a Cenová ponuka).
Kontrolu faktov a hľadania robí otazky.mjs, zhodu so stránkou Časté otázky caste.mjs."""
import json
import os
import re
import sys

KOREN = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..'))
JE = lambda p: os.path.isfile(os.path.join(KOREN, p))
# stránky, na ktoré asistent smie odkázať (v poradí do znalostí); pridá sa len tá, ktorá v strome je
STRANKY = [('kontakt.html', 'Kontakt a mapa'), ('sluzby.html', 'Služby'),
           ('doprava.html', 'Doprava na stavbu (autá, podmienky dopravy pri akciách)'),
           ('caste-otazky.html', 'Časté otázky'), ('o-nas.html', 'O nás'),
           ('galeria/index.html', 'Galéria (predajňa, sklad, výstavy)')]

W = 'https://www.stavebninyrichtarik.sk/'
TEL = '0905 622 223'
DOPRAVA = W + ('doprava.html' if JE('doprava.html') else 'sluzby.html')
TEMY = {
    'kontakt': 'Adresa a kontakt',
    'hodiny': 'Otváracie hodiny',
    'sluzby': 'Služby a cenová ponuka',
    'doprava': 'Doprava na stavbu',
    'zlavy': 'Zľavy a platba',
    'akcie': 'Akcie a ceny',
    'sortiment': 'Sortiment a značky',
    'asistent': 'O asistentovi',
}
O = []


def q(id_, t, otazka, znenia, odpoved, tel=False):
    O.append({'id': id_, 't': t, 'q': otazka, 'v': znenia, 'a': odpoved, **({'tel': True} if tel else {})})


# ---------- kontakt ----------
q('kontakt-adresa', 'kontakt', 'Kde sa nachádzate?',
  ['Aká je vaša adresa?', 'Kde je predajňa?', 'kde sídlite', 'sídlo firmy', 'adresa stavebnín', 'kde vas najdem', 'kde ste v Nitre', 'kde je sklad'],
  'Predajňa a sklad sú na adrese Novozámocká 62/68, 949 05 Nitra, Horné Krškany. Navigácia: '
  'https://www.google.com/maps/search/?api=1&query=Novoz%C3%A1mock%C3%A1+62%2F68%2C+949+05+Nitra')
q('kontakt-telefon', 'kontakt', 'Aké máte telefónne číslo?',
  ['Na aké číslo môžem zavolať?', 'telefónne číslo predajne', 'kontakt na predajňu', 'číslo na predajňu', 'mobilné číslo', 'pevná linka'],
  f'Zavolajte nám na mobil {TEL} alebo na pevnú linku 037 651 17 77. Otváracie hodiny: '
  'pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00.', tel=True)
q('kontakt-email', 'kontakt', 'Aký je váš e-mail?',
  ['Kam môžem napísať?', 'emailová adresa', 'mail', 'môžem vám poslať e-mail', 'kontaktný e-mail'],
  'Napíšte nám na info@stavebninyrichtarik.sk. Pošlite aj zoznam materiálu alebo projekt a pripravíme vám cenovú ponuku.')
q('kontakt-firma', 'kontakt', 'Aké sú vaše firemné údaje?',
  ['IČO na faktúru', 'DIČ', 'fakturačné údaje', 'kto je prevádzkovateľ', 'názov firmy', 'údaje na faktúru'],
  'Prevádzkovateľ: Ing. Mário Richtárik - Stavebniny, Novozámocká 62/68, 949 05 Nitra, Horné Krškany. '
  'IČO 45959846, DIČ SK1083167855.')
q('kontakt-mapa', 'kontakt', 'Ako sa k vám dostanem?',
  ['navigácia', 'cesta k vám', 'mapa', 'ako k vám prísť autom', 'trasa do predajne'],
  'Nájdete nás v Nitre – Horných Krškanoch na Novozámockej ulici 62/68. Navigácia: '
  'https://www.google.com/maps/search/?api=1&query=Novoz%C3%A1mock%C3%A1+62%2F68%2C+949+05+Nitra')
q('kontakt-prehliadka', 'kontakt', 'Dá sa predajňa pozrieť na webe?',
  ['Ako vyzerá predajňa?', 'prechádzka predajňou', 'prehliadka predajne', 'virtuálna prehliadka', 'pozrieť si predajňu online', 'pohľad z ulice na predajňu'],
  'Áno. Na úvodnej stránke a na stránke Kontakt je Prechádzka predajňou: 9 zastávok zo skutočných fotiek od tabule '
  'pri ceste po pult v predajni. Fotku posúvate ťahaním, medzi zastávkami prejdete šípkami. Druhá záložka ukáže pohľad '
  'z ulice z Google Máp. ' + W + 'kontakt.html')
q('kontakt-parkovanie', 'kontakt', 'Dá sa u vás parkovať?',
  ['parkovisko', 'kde zaparkujem', 'môžem prísť s vozíkom', 'príjazd s prívesom'],
  f'Parkovanie web neuvádza. Pred cestou nám zavolajte na {TEL}, radi vám poradíme.', tel=True)

# ---------- hodiny ----------
q('hodiny', 'hodiny', 'Aké máte otváracie hodiny?',
  ['Kedy máte otvorené?', 'otváracia doba', 'do koľkej máte otvorené', 'od koľkej ste otvorení', 'hodiny predajne'],
  'Pondelok – piatok 7:00 – 16:00, sobota 7:00 – 12:00.')
q('hodiny-sobota', 'hodiny', 'Máte otvorené aj v sobotu?',
  ['sobota', 'v sobotu do koľkej', 'otvorené cez víkend', 'víkend'],
  'Áno, v sobotu máme otvorené 7:00 – 12:00, v pracovné dni 7:00 – 16:00.')
q('hodiny-nedela', 'hodiny', 'Máte otvorené v nedeľu?',
  ['nedeľa', 'v nedeľu', 'sviatky', 'otvorené cez sviatok', 'štátny sviatok'],
  f'Otváracie hodiny máme pondelok – piatok 7:00 – 16:00 a v sobotu 7:00 – 12:00. Nedeľu a sviatky si, prosím, '
  f'overte vopred na {TEL}.', tel=True)

# ---------- služby ----------
q('sluzby-prehlad', 'sluzby', 'Aké služby ponúkate?',
  ['čo všetko robíte', 'služby', 'čo pre mňa urobíte', 'ponuka služieb'],
  '- predaj stavebného materiálu v celom sortimente\n- bezplatný výpočet spotreby materiálu\n- cenová ponuka zadarmo\n'
  '- bezplatné poradenstvo\n- množstevné zľavy\n- doprava vlastnými autami po celom Slovensku, aj autom s mechanickou rukou\n'
  '- platba kartou a nákup na splátky Quatro\nViac: ' + W + 'sluzby.html')
q('sluzby-ponuka', 'sluzby', 'Ako získam cenovú ponuku?',
  ['cenová ponuka', 'nacenenie', 'pripravíte mi ponuku', 'chcem ponuku na dom', 'ponuka na materiál', 'kalkulácia'],
  'Cenová ponuka je zadarmo. Pošlite nám zoznam materiálu alebo projekt na info@stavebninyrichtarik.sk, prípadne '
  f'prineste projekt alebo rozmery do predajne. Spočítame spotrebu, pripravíme ponuku a dohodneme dopravu. Telefón {TEL}.',
  tel=True)
q('sluzby-vypocet', 'sluzby', 'Spočítate mi, koľko materiálu potrebujem?',
  ['výpočet spotreby', 'koľko tehál potrebujem', 'koľko potrebujem na dom', 'vypočítate množstvo',
   'koľko kusov na m2', 'koľko vriec omietky', 'spotreba materiálu'],
  'Áno, výpočet spotreby materiálu je zadarmo. Pošlite projekt alebo rozmery na info@stavebninyrichtarik.sk alebo '
  f'zavolajte na {TEL}. Množstvo spočíta personál predajne, ja výpočty nerobím.', tel=True)
q('sluzby-poradenstvo', 'sluzby', 'Poradíte mi s výberom materiálu?',
  ['poradenstvo', 'neviem čo vybrať', 'odporučíte mi', 'potrebujem poradiť', 'čo je lepšie'],
  f'Áno, poradenstvo je zadarmo. Zaškolený personál vám poradí v predajni alebo na telefóne {TEL}.', tel=True)
q('sluzby-objednavka', 'sluzby', 'Ako si môžem objednať materiál?',
  ['objednávka', 'chcem objednať', 'máte e-shop', 'dá sa objednať online', 'internetový obchod', 'ako nakúpiť'],
  f'Objednať si môžete telefonicky na {TEL}, e-mailom na info@stavebninyrichtarik.sk alebo priamo v predajni na '
  'Novozámockej 62/68 v Nitre. E-shop web nemá.', tel=True)
q('sluzby-firmy', 'sluzby', 'Máte ceny pre stavebné firmy?',
  ['som živnostník', 'lepšie ceny pre živnostníka', 'zľava pre firmy', 'veľkoodber', 'spolupráca so stavebninami', 'množstevná zľava'],
  'Áno. Pri väčšom odbere a pre stavebné firmy, živnostníkov a spolupracujúce stavebniny máme špeciálne zľavy. '
  f'Dohodnete sa v predajni alebo na {TEL}.', tel=True)
q('sluzby-reklamacia', 'sluzby', 'Ako reklamovať tovar?',
  ['reklamácia', 'vrátenie tovaru', 'chcem vrátiť materiál', 'faktúra', 'poškodený tovar'],
  f'Reklamácie, vrátenie tovaru a faktúry rieši predajňa. Zavolajte na {TEL} alebo napíšte na '
  'info@stavebninyrichtarik.sk.', tel=True)
q('o-nas', 'sluzby', 'Odkedy fungujete?',
  ['kto ste', 'o firme', 'rodinná firma', 'história', 'ako dlho existujete', 'odkedy existujete'],
  'Stavebniny Richtárik sú rodinná firma z Nitry, založená v roku 1997. Hlavným profilom je predaj a '
  'sprostredkovanie stavebného materiálu. Viac: ' + W + 'o-nas.html')

# ---------- doprava ----------
q('doprava', 'doprava', 'Dovezete materiál na stavbu?',
  ['doprava', 'robíte dopravu na stavbu', 'dovoz materiálu', 'privezte mi tovar', 'rozvoz', 'dovážate', 'doprava domov'],
  'Áno. Tovar dovezieme vlastnými autami na miesto stavby, ktoré určíte, po celom Slovensku: Avia 3,5 t a nákladné '
  f'auto 8 t s mechanickou rukou. Cenu dopravy na vašu adresu vám povieme na {TEL}. Viac: {DOPRAVA}', tel=True)
q('doprava-cena', 'doprava', 'Koľko stojí doprava?',
  ['cena dopravy', 'koľko účtujete za dopravu', 'koľko zaplatím za dovoz', 'doprava zadarmo', 'je doprava zdarma', 'poplatok za dopravu'],
  f'Cenu dopravy na konkrétnu stavbu vám povie predajňa na {TEL}. Pri niektorých akciách je doprava zdarma: '
  'celý kamión Porfix alebo Ytong, polystyrén až domov, montované garáže aj s montážou. Krytina Blachotrapez: doprava '
  f'nad 50 m² 17 € s DPH po celom Slovensku. Viac: {DOPRAVA}', tel=True)
q('doprava-ruka', 'doprava', 'Máte auto s hydraulickou rukou?',
  ['mechanická ruka', 'vykládka', 'zložíte tovar', 'hydraulická ruka', 'auto s rukou', 'zloženie paliet'],
  'Áno. Okrem auta Avia 3,5 t máme nákladné auto 8 t s mechanickou rukou. Vykládka sa pri niektorých akciách platí, '
  f'napríklad pri krytine Blachotrapez 40 € s DPH. Podrobnosti vám povieme na {TEL}.', tel=True)
q('doprava-slovensko', 'doprava', 'Vozíte aj mimo Nitry?',
  ['doprava do Bratislavy', 'vozíte po celom Slovensku', 'doprava do inej obce', 'dovoz mimo Nitry', 'kam vozíte'],
  f'Áno, materiál dovezieme na stavbu po celom Slovensku. Cenu a termín dovozu vám povieme na {TEL}.', tel=True)
q('doprava-termin', 'doprava', 'Kedy mi materiál dovezete?',
  ['termín dovozu', 'kedy viete doviezť', 'kedy dovezete', 'ako rýchlo dovezete', 'dodacia lehota', 'zajtra dovoz', 'dokedy dovezete'],
  f'Termín dovozu dohodnete s predajňou na {TEL}, ja ho potvrdiť neviem.', tel=True)

# ---------- zľavy a platba ----------
q('zlava-karta', 'zlavy', 'Aké zľavy máte so zákazníckou kartou?',
  ['zákaznícka karta', 'aké zľavy dávate', 'zľava 5 %', 'zľava pri platbe v hotovosti', 'ďalšia zľava z akcie', 'zľavy', 'rozdávate zľavy'],
  'Z akciových cien dostanete so zákazníckou kartou ďalšiu zľavu: 5 % pri platbe v hotovosti a 3,3 % pri platbe '
  'platobnou kartou. Kartu si vyzdvihnete v predajni.')
q('zlava-kartu-ziskam', 'zlavy', 'Ako získam zákaznícku kartu?',
  ['kde dostanem kartu', 'vybavenie karty', 'chcem zákaznícku kartu', 'ako získať zákaznícku kartu'],
  'Zákaznícku kartu si vyzdvihnete v predajni na Novozámockej 62/68 v Nitre. S ňou máte z akciových cien ďalšiu '
  'zľavu 5 % v hotovosti alebo 3,3 % kartou.')
q('zlava-cennik', 'zlavy', 'Sú ceny v cenníku akcií už so zľavou?',
  ['ceny v cenníku', 'je v cene zľava', 'cena v hotovosti', 'cenník so zľavou'],
  'Áno. Ceny v cenníku akcií (28. 1. 2026) platia pri platbe v hotovosti, z ceny je už odrátaná 5 % zľava.')
q('platba-karta', 'zlavy', 'Môžem platiť kartou?',
  ['platba kartou', 'terminál', 'platobná karta', 'berete karty', 'platba', 'ako sa dá platiť'],
  'Áno, v predajni je platobný terminál (VÚB banka). Platiť môžete aj v hotovosti; pri akciových cenách so '
  'zákazníckou kartou je zľava 5 % v hotovosti a 3,3 % kartou.')
q('platba-splatky', 'zlavy', 'Dá sa kúpiť materiál na splátky?',
  ['splátky', 'Quatro', 'úver na materiál', 'kúpa na splátky', 'financovanie'],
  f'Áno, stavebný materiál môžete kúpiť na splátky cez Quatro. Podrobnosti vám povieme v predajni alebo na {TEL}.',
  tel=True)

# ---------- akcie a ceny ----------
q('akcie', 'akcie', 'Aké máte aktuálne akcie?',
  ['akcie', 'čo je v akcii', 'čo máte teraz v akcii', 'zľavnený tovar', 'akciový leták', 'výpredaj', 'aktuálne ponuky'],
  'Akcie máme napríklad na tehly TermoBRIK, komín Stadreko, krytinu Blachotrapez, okná a schody Fakro (zľava 20 %), '
  'stavebné rezivo, Porfix, Ytong a cement. Všetky akcie: ' + W + 'akcie/index.html. Cenník akcií (28. 1. 2026): '
  + W + f'pdf/662.pdf. Platnosť a cenu vám potvrdíme na {TEL}.', tel=True)
q('akcie-cennik', 'akcie', 'Kde nájdem cenník?',
  ['cenník', 'cenník akcií', 'pdf cenník', 'ceny tovaru', 'cenník na stiahnutie', 'leták'],
  'Cenník akcií z 28. 1. 2026: ' + W + 'pdf/662.pdf. Akciové letáky: ' + W
  + f'letak.html. Ceny ostatného tovaru vám povieme na {TEL}.', tel=True)
q('akcie-platnost', 'akcie', 'Dokedy platia akcie?',
  ['platnosť akcie', 'je akcia ešte platná', 'do kedy je akcia', 'platí ešte cena'],
  f'Cenník akcií je aktualizovaný 28. 1. 2026, dátum konca akcií web neuvádza. Platnosť a cenu vám potvrdíme na {TEL}.',
  tel=True)
q('cena-ina', 'akcie', 'Koľko stojí tovar, ktorý nie je v akcii?',
  ['cena tehly', 'koľko stojí', 'cena za kus', 'aká je cena', 'cena polystyrénu', 'cena za m2', 'cena za paletu'],
  'Ceny uvádzam len pri akciách z cenníka akcií (28. 1. 2026). Aktuálnu cenu ostatného tovaru vám povieme na '
  f'{TEL} alebo v cenovej ponuke zadarmo (info@stavebninyrichtarik.sk).', tel=True)
q('cena-cement', 'akcie', 'Koľko stojí cement?',
  ['cena cementu', 'cement 25 kg', 'cement 325', 'cement 425', 'vrece cementu'],
  'V akcii: cement 325 R, 25 kg za 4,42 € za vrece s DPH a cement 425 R, 25 kg za 5,18 € za vrece s DPH. '
  f'Cena platí pri platbe v hotovosti. Platnosť vám potvrdíme na {TEL}.', tel=True)
q('akcia-termobrik', 'akcie', 'Aká je akcia na tehly TermoBRIK?',
  ['Pezinská tehla', 'TermoBRIK cena', 'brúsená tehla', 'Dry systém', 'tehly na dom', 'Leier'],
  'Pezinská tehla TermoBRIK: brúsená tehla so systémom Dry a pojivom, lepidlo zdarma. Na váš dom pripravíme '
  'individuálnu cenovú ponuku. Podľa cenníka akcií je doprava až na stavbu zdarma, vykládka za poplatok. '
  f'Zavolajte {TEL}.', tel=True)
q('akcia-komin', 'akcie', 'Máte komín Stadreko na sklade?',
  ['komín', 'komín Stadreko cena', 'komínový systém', 'komín akcia', 'Schiedel'],
  'Komín Stadreko máme v akcii priamo na sklade, odber možný ihneď. Ceny kompletných komínov sú v cenníku akcií, '
  'napríklad komín 6 m, ø 160/90 za 618 € s DPH: ' + W + f'pdf/662.pdf. Komíny Schiedel máme v katalógu. Poradíme na {TEL}.',
  tel=True)
q('akcia-blachotrapez', 'akcie', 'Aké sú podmienky pri krytine Blachotrapez?',
  ['plechová krytina', 'škridloplech', 'trapézový plech', 'Blachotrapez doprava', 'plech na strechu'],
  'Krytina Blachotrapez (škridloplech, trapézové plechy): doprava nad 50 m² 17 € s DPH po celom Slovensku, do 50 m² '
  'plus ochranná fólia 0,55 €/m², podlimitná objednávka do 30 m² plus 1,20 €/m², vykládka tovaru 40 € s DPH.')
q('akcia-fakro', 'akcie', 'Je zľava na strešné okná?',
  ['Fakro zľava', 'strešné okno akcia', 'podkrovné schody', 'sklápacie schody', 'Velux', 'Rooflite'],
  'Okná a schody Fakro sú v akcii so zľavou 20 % (strešné okná, podkrovné stropné sklápacie schody, strešné '
  'doplnky). V akcii sú aj strešné okná RoofLITE. V katalógu máme aj Velux.')
q('akcia-porfix-ytong', 'akcie', 'Je doprava zdarma pri Porfixe alebo Ytongu?',
  ['Porfix', 'Ytong', 'pórobetón', 'celý kamión', 'Ytong doprava zadarmo', 'Porfix doprava zdarma'],
  'Porfix aj Ytong majú špeciálne zľavy. Pri celom kamióne je doprava zdarma: Porfix až domov, Ytong až na stavbu.')
q('akcia-dlazba', 'akcie', 'Máte akciu na dlažbu?',
  ['zámková dlažba', 'City Stone Design', 'dlažba zľava', 'obrubníky', 'Stadreko dlažba', 'ploty'],
  'Áno. Dlažba City Stone Design má zľavu 15 až 30 % z cenníkových cien (objektové zľavy). V akcii sú aj dlažby '
  'a ploty Stadreko (dlažby, ploty, tvárnice, palisády, obrubníky a iné).')
q('akcia-zateplenie', 'akcie', 'Dovezete polystyrén zadarmo?',
  ['polystyrén', 'zateplenie', 'sadrokartón', 'zatepľovací systém', 'vozíte polystyrén domov zadarmo'],
  'Áno, pri akcii na zatepľovací a sadrokartónový systém dovezieme polystyrén priamo domov zdarma.')
q('akcia-rezivo', 'akcie', 'Predávate stavebné rezivo?',
  ['rezivo', 'drevo', 'hranoly', 'krov', 'strešné laty', 'palivové drevo', 'dosky'],
  'Áno, stavebné rezivo máme priamo na sklade a v akcii: dosky, hranoly, strešné laty, foršne, tatranský obklad, '
  'palivové drevo aj krovy na mieru.')
q('akcia-garaze', 'akcie', 'Predávate garáže alebo záhradné domčeky?',
  ['garáž', 'plechová garáž', 'záhradný domček', 'montovaná garáž'],
  'Áno, montované plechové garáže a záhradné domčeky sú v akcii. Doprava aj montáž po celom Slovensku zdarma. '
  'Viac: ' + W + 'novinky/garaze-zahradne-domceky.html')
q('akcia-univerbau', 'akcie', 'Máte akciu na lepidlá a omietky?',
  ['lepidlo na polystyrén', 'omietky', 'Univerbau', 'malta', 'flexibilné lepidlo', 'nivelit'],
  'Áno, lepidlá a omietky Univerbau sú za znížené ceny: lepidlo mrazuvzdorné, na polystyrén, flexibilné, nivelit, '
  'hrubé omietky, murovacie malty, betónový poter a iné. Ceny vybraných lepidiel a omietok sú v cenníku akcií: '
  + W + 'pdf/662.pdf')
q('novinky-kamene', 'akcie', 'Koľko stoja dekoračné kamene?',
  ['dekoračný kameň', 'okruhliaky', 'kamenná kôra', 'mramor', 'kamene do záhrady'],
  'Dekoračné kamene sú vo vreciach 25 kg, ceny s DPH: kamenná kôra od 8,95 € za vrece, mramorový okruhliak biely '
  '11,20 €. Viac: ' + W + 'novinky/dekoracne-kamene.html')
q('novinky-delap', 'akcie', 'Koľko stojí kamenný obklad Delap?',
  ['Delap', 'ohybný obklad', 'kamenný obklad', 'obklad na fasádu'],
  'Ohybný kamenný obklad Delap má akciovú cenu 17,80 € za m² s DPH pri platbe v hotovosti, v balení sú 4 m².')
q('novinky', 'akcie', 'Čo máte nové v ponuke?',
  ['novinky', 'nový tovar', 'čo je nové', 'Magic Floor', 'Ekostyrén', 'kamenný koberec'],
  'Novinky: betónové výrobky, dekoračné kamene, ohybný obklad Delap, Ekostyrén, garáže a záhradné domčeky, vinylové '
  'podlahy Magic Floor, kamenný koberec Bianka a výrobky z recyklovaného plastu. Viac: ' + W + 'novinky/index.html')

# ---------- sortiment ----------
q('sortiment', 'sortiment', 'Čo všetko predávate?',
  ['sortiment', 'aký tovar máte', 'čo máte v ponuke', 'katalóg', 'stavebný materiál', 'všetko na stavbu'],
  'Máme 15 kategórií: sypké zmesi, murovací materiál, strešné krytiny, dlažby a ploty, izolácie, komíny, strešné '
  'okná, hutný materiál, dvere a okná, rezivo, náradie, podhľady a PVC, sadrokartón a zateplenie, fasády, farby a laky. '
  'Katalóg: ' + W + 'katalog/index.html')
q('sortiment-sklad', 'sortiment', 'Máte tento tovar na sklade?',
  ['je to skladom', 'máte na sklade', 'dostupnosť', 'koľko kusov máte', 'skladová zásoba', 'máte hneď'],
  f'Skladovú zásobu konkrétneho výrobku overiť neviem, dostupnosť vám potvrdí predajňa na {TEL}. Priamo na sklade '
  'máme podľa webu komín Stadreko, stavebné náradie, stavebné rezivo a bežné druhy dverí Masonite.', tel=True)
q('sortiment-tehly', 'sortiment', 'Aké tehly a tvárnice máte?',
  ['tehly', 'murovací materiál', 'tvárnice', 'Pezinské tehelne', 'Ytong tvárnice a preklady', 'stropy'],
  'Murovací materiál: tehly, pórobetónové a betónové tvárnice, preklady a stropné systémy od Pezinských tehelní, '
  'Ytongu, Porfixu a Betonárky Nadlice. Viac: ' + W + 'katalog/murovaci-material.html')
q('sortiment-strecha', 'sortiment', 'Aké strešné krytiny máte?',
  ['strecha', 'pálená škridla', 'Tondach', 'Bramac', 'krytina', 'asfaltové pásy'],
  'Strešné krytiny: pálené a betónové škridly, plechové krytiny, asfaltové pásy a príslušenstvo. Značky Tondach, '
  'Bramac, Mediterran, Onduline, Icopal a Blachotrapez. Viac: ' + W + 'katalog/stresne-kritiny.html')
q('sortiment-izolacie', 'sortiment', 'Aké izolácie máte?',
  ['izolácia', 'minerálna vlna', 'Isover', 'Knauf', 'izolácia proti vode', 'radón'],
  'Izolačný materiál: minerálna vlna, polystyrén, asfaltové pásy a izolácie proti vode a radónu. Značky Knauf '
  'Insulation, Isover, Nobasil, Icopal, Den Braven a Climowool. Viac: ' + W + 'katalog/izolacny-material.html')
q('sortiment-zmesi', 'sortiment', 'Máte cement, vápno a omietky?',
  ['sypké zmesi', 'vápno', 'Baumit', 'Holcim', 'stierky', 'samonivelačná hmota'],
  'Áno. Sypké zmesi: cement, vápno, malty, omietky, lepidlá, stierky a samonivelačné hmoty od Baumit, Cemmac, Calmit, '
  'Holcim, Murexin a Univerbau. Viac: ' + W + 'katalog/sypke-zmesy.html')
q('sortiment-dvere', 'sortiment', 'Predávate dvere a okná?',
  ['dvere', 'vchodové dvere', 'interiérové dvere', 'Masonite', 'okná'],
  'Áno: interiérové, vchodové, bezpečnostné a posuvné dvere (Masonite) a drevené okná s dvojsklom. Viac: '
  + W + 'katalog/dvere-okna.html')
q('sortiment-hutny', 'sortiment', 'Máte betonársku oceľ a siete?',
  ['hutný materiál', 'kari siete', 'oceľ', 'plechy', 'profily', 'zárubne', 'garážová brána'],
  'Áno. Hutný materiál: betonárska oceľ, siete, plechy, profily, rúry, zárubne a garážové brány (Yssel Steel). '
  'Viac: ' + W + 'katalog/hutny-material.html')
q('sortiment-farby', 'sortiment', 'Máte farby a laky?',
  ['farby', 'laky', 'fasádna farba', 'riedidlo', 'Het', 'Chemolak'],
  'Áno: interiérové a fasádne farby, laky, lepidlá, riedidlá a tónovacie systémy od Het, Chemolak, Chemos a Elastik. '
  'Viac: ' + W + 'katalog/farby-laky.html')
q('sortiment-naradie', 'sortiment', 'Predávate náradie?',
  ['náradie', 'spojovací materiál', 'záhradné náradie', 'elektrické náradie'],
  'Áno: stavebné, elektrické a záhradné náradie, spojovací materiál, mriežky a poklopy. Stavebné náradie máme v akcii '
  'priamo na sklade. Viac: ' + W + 'katalog/stavebne-naradie-doplnky.html')
q('sortiment-fasada', 'sortiment', 'Máte fasádne omietky a zateplenie?',
  ['fasáda', 'silikónová omietka', 'fasádne omietky', 'Masterplast', 'sklotex', 'suchá výstavba'],
  'Áno: fasádny systém (silikónové, silikátové a mozaikové omietky, fasádne farby, zatepľovacie systémy, Baumit, '
  'Univerbau) a sadrokartón a zateplenie (suchá výstavba, profily, polystyrén, sklotex, fólie). Viac: '
  + W + 'katalog/fasadny-system.html')
q('sortiment-znacka-ina', 'sortiment', 'Predávate aj značku, ktorú nevidím na webe?',
  ['máte inú značku', 'objednáte inú značku', 'iný výrobca', 'nenašiel som výrobok'],
  f'Na webe sú značky z našej ponuky. Či vieme zohnať inú značku, vám povieme na {TEL}.',
  tel=True)

# ---------- asistent ----------
q('asistent-clovek', 'asistent', 'Píšem s človekom?',
  ['si človek', 'ste skutočný človek', 'kto odpovedá', 'si robot', 'je to automat', 'hovorím s predavačom'],
  'Nie, som AI asistent webu Stavebniny Richtárik, teda automatický asistent, nie človek. S človekom sa spojíte na '
  f'{TEL} alebo v predajni.', tel=True)
q('asistent-udaje', 'asistent', 'Čo sa stane s mojimi otázkami?',
  ['ochrana údajov', 'ukladáte rozhovor', 'ukladáte si moje správy', 'gdpr', 'osobné údaje', 'súkromie'],
  'Rozhovory neukladáme. Nepíšte sem osobné údaje. Podrobnosti sú v časti Ochrana údajov pod oknom.')
q('asistent-co-vie', 'asistent', 'S čím mi viete pomôcť?',
  ['čo vieš', 's čím mi vieš pomôcť', 'na čo sa môžem opýtať', 'pomoc', 'ako funguješ'],
  'Odpoviem na otázky o sortimente, akciách, zľavách, doprave, službách, otváracích hodinách a kontakte. Ceny uvádzam '
  'len z cenníka akcií; presnú ponuku, výpočet materiálu a termín dovozu vybaví predajňa.'
  + (' Časté otázky: ' + W + 'caste-otazky.html' if JE('caste-otazky.html') else ''))

if __name__ == '__main__':
    data = {'verzia': '2026-11-06', 'zdroj': 'asistent/znalosti/richtarik.md', 'temy': TEMY, 'otazky': O}
    text = json.dumps(data, ensure_ascii=False, indent=1)
    for ciel in ('asistent/znalosti/richtarik-otazky.json', 'assets/asistent-otazky.json'):
        with open(os.path.join(KOREN, ciel), 'w', encoding='utf-8') as f: f.write(text)
    # znalosti: časť Stránky webu len so stránkami, ktoré v strome sú
    md = os.path.join(KOREN, 'asistent/znalosti/richtarik.md')
    s = open(md, encoding='utf-8').read()
    riadky = ''.join(f'- {n}: {W}{p}\n' for p, n in STRANKY if JE(p))
    s, k = re.subn(r'(<!-- stranky:[^\n]*-->\n)(?:.*?\n)?(<!-- /stranky -->)', lambda m: m.group(1) + riadky + m.group(2), s, flags=re.S)
    if k != 1: sys.exit('znalosti: chýba časť <!-- stranky: … --> … <!-- /stranky -->')
    with open(md, 'w', encoding='utf-8') as f: f.write(s)
    print('otázok:', len(O), '| stránky v znalostiach:', ', '.join(p for p, _ in STRANKY if JE(p)),
          '| chýbajú (pribudnú s textami webu):', ', '.join(p for p, _ in STRANKY if not JE(p)) or '0')
