---
name: youtube-shorts
description: YouTube Shorts (a reels na výšku) pre HEAD SPA 30, Barbershop 30 a GYM KLUB zo skutočných záberov z telefónu. Recept 30 až 45 s (hook do 1,5 s, kroky, druhý hook, výzva), titulky, strih, zvuk, bezpečné zóny YouTube, šablóny scenára a popisu, formáty z rozborov V1 až V11. scripts/short.py urobí z EDL hotový súbor (9:16, HDR na SDR, titulky a štítky NEPOTVRDENÉ v ASS, -14 LUFS, H.264 a AAC) a skontroluje ho v 11 bodoch; strihy.sh zmeria strihy videa; strih_podla_referencie.py zostaví strih v rytme referencie bez cudzej služby; titulok_16x9.py robí formát stály titulok + pás 16:9; tvrdenia.py kontroluje čísla a fámy v scenári; schvalenie.py zapíše schválenie presného súboru. Výzvy za slovo do komentára či DM nepoužívame. Použi pri „urob short“, „reel aj na YouTube“, „titulky do videa“, „vyrovnaj hlasitosť“, „HDR je vyblednuté“, „ako je strihnuté toto video“, „strihni to ako toto video“, „skontroluj video pred nahratím“. Nič neuverejňuje, nahráva majiteľ.
---

# YouTube Shorts pre prevádzku

Short je zvislé alebo štvorcové video do 3 minút. Pre prevádzky ho robíme zo skutočných záberov z telefónu,
s titulkami do obrazu, a odovzdávame majiteľovi ako hotový súbor s textami do YouTube Studio. Cieľ shortu je
rezervácia, nie sledovatelia. Uverejňuje majiteľ.

Postup vznikol 2026-10-17 z rozboru troch TikTokov (V1 martin.gocik, V2 sadie.ontech, V3 restructureai;
merania v [references/anatomia-referencii.md](references/anatomia-referencii.md)), z pomocníka YouTube
([references/youtube-fakty.md](references/youtube-fakty.md), overené 2026-10-17) a zo skúšok na záberoch
GYM KLUB (skript a výsledky v [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md)). Doplnený 2026-10-19
o rozbory V4 až V10 (God's Eye View, Agency Agents, „Unethical GitHub projects“, „0x Alpha“, TRELLIS.2,
„$10,000 website“, strih cez editor pripojený ku Claude; záznamy 11 až 17 v
`../referencie-z-videi/references/naucene-z-videi.md`): formáty, fámy, výzvy a strih podľa referencie nižšie.
Doplnený 2026-10-20 o V11 (nocode.joshua, číslovaná vysvetľovačka so schémami; záznam 20): index, počítadlo
položiek a súhrnná karta.

## Kedy použiť

- Majiteľ chce short, „reel aj na YouTube“ alebo vertikálne video z toho, čo natočil.
- Treba scenár a zoznam záberov na natáčanie (šablóny v [references/sablony.md](references/sablony.md)).
- Treba titulky do obrazu, vyrovnať hlasitosť, opraviť vyblednuté HDR z iPhonu alebo urobiť z videa 9:16.
- Majiteľ pošle cudzí short a pýta sa, prečo funguje: najprv `../referencie-z-videi/` (stiahnutie, prehľad),
  potom `scripts/strihy.sh` (strihy a tempo) a porovnanie s receptom nižšie.
- Hotové video (render, prehliadka) treba skontrolovať alebo prebaliť podľa odporúčaní YouTube.
- Majiteľ chce „strihnúť ako toto video“ (časť „Strih podľa referencie“), má vodorovný materiál (formát 16:9)
  alebo oznam pred vlastnou stránkou (green screen, `references/sablony.md`, časť 10).
- Scenár obsahuje novinku, číslo zo snímky alebo tvrdenie z cudzieho videa (časť „Novinky, fámy a čísla zo snímok“).

Nepoužívaj na uverejňovanie, prihlasovanie do účtov, komentovanie, odpovede ani správy v mene účtu, na
generovanie obrazu či hlasu a na preberanie cudzích videí do vlastného shortu.

## Pravidlá praxe (platia vždy)

1. **Nič sa neuverejní bez majiteľa.** Majiteľ schvaľuje presný súbor videa a presný text popisu
   (`scripts/schvalenie.py`), nahráva a uverejňuje sám. Každá zmena po schválení potrebuje nové áno.
2. **Žiadne automatické komentáre, odpovede ani DM** v mene účtu. Odpovede na komentáre pod shortom
   pripravujeme len ako návrhy (`../instagram-salon/`, režim 3).
3. **Len skutočné zábery prevádzky.** Žiadny stock vydávaný za prevádzku, žiadne makety vydávané za nahrávku,
   žiadne cudzie kancelárie a ľudia ako v V2. AI obraz alebo hlas predvolene nie; len s výslovným súhlasom
   majiteľa a človeka, ktorého tvár či hlas to je, a vtedy s označením (YouTube Studio, „AI use“ = Yes). Pri
   HEAD SPA 30 nie vôbec (`CLAUDE.md`: žiadna zmienka o AI).
4. **Fakty a čísla len zo zdrojov prevádzky**, prečítaných v deň výroby
   (`../instagram-salon/references/fakty-*.md` a zdroje, na ktoré odkazujú). Žiadne vymyslené recenzie,
   hodnotenia, citácie zákazníkov, počty ani „najlepší v Nitre“ (zákon č. 108/2024 Z. z., § 10 a príloha č. 1;
   body v [references/youtube-fakty.md](references/youtube-fakty.md), časť 11).
5. **Ľudia v zábere:** zamestnanci len s privolením (Občiansky zákonník § 12), klienti nerozpoznateľní alebo
   s privolením, deti len so súhlasom rodiča. Pozor na odrazy v skle a zrkadlách a na obrazovky s menami
   klientov (kalendár, rezervácie). Pravidlá záberov: `../film-z-fotiek/references/priprava-zaberov.md`.
6. **Hudba** len vlastná (napr. syntéza), z knižnice zvukov YouTube alebo s licenciou, ktorú vieme doložiť.
   Inak hrozí nárok Content ID.
7. **Heslá, tokeny a kľúče** nikdy do chatu, EDL, scenára ani repozitára.
8. **Text:** slovenčina so správnou diakritikou, tykanie alebo vykanie podľa webu prevádzky, bez pomlčky em
   dash, text v obraze je to isté, čo zaznie.

## Recept shortu pre prevádzku (35 s)

Odvodené z merania V1 až V3 (prvá zmena obrazu 1,43 s a 1,57 s, medián záberu 2,00 s a 1,57 s, druhý hook
v 49 % a 74 % dĺžky, výzva v posledných 2,9 až 3,4 s) a prispôsobené prevádzke.

| Čas (s) | Úloha | Obraz | Reč a titulok | Pravidlo |
| --- | --- | --- | --- | --- |
| 0,0 až 1,5 | hook, obraz | najrozpoznateľnejší skutočný záber miesta, už v pohybe (ruka na kľučke, kamera ide dverami) | prvé 2 až 4 slová hooku, titulok od 0,0 s | žiadne logo, úvod ani hudba bez reči |
| 1,5 až 3,0 | hook, sľub | druhý záber alebo priblíženie 110 až 115 % | dokončenie hooku, spolu najviac 10 slov | hlavná myšlienka čitateľná aj bez zvuku |
| 3,0 až 6,0 | čo dostaneš | 2 zábery po ~1,5 s | jedna veta | |
| 6,0 až 8,0 | číslo | karta s overeným číslom alebo detail, ktorý číslo ukazuje | číslo + 1 až 2 slová | len číslo so zdrojom |
| 8,0 až 20,0 | ako to prebieha | 4 až 6 záberov po 2 až 3 s, krok = záber | 3 až 4 kroky jednou vetnou šablónou | tváre len s privolením |
| 20,0 až 24,0 | druhý hook | najsilnejší detail | „A najlepšie…“ + overený fakt | 57 až 69 % dĺžky |
| 24,0 až 30,0 | miesto a dôkaz | exteriér, ulica, dvere, interiér zo širšia | kde sme, pre koho (zo zdroja) | žiadne recenzie ani hodnotenia bez zdroja |
| 30,0 až 32,0 | zhrnutie | najkrajší široký záber | jedna veta, obrat hooku | |
| 32,0 až 35,0 | výzva | rezervácia na telefóne (skutočná stránka) alebo dvere | jedna akcia + adresa webu v obraze | žiadne „napíš do komentára“ |

- **30 s:** kroky len 3 (8 až 17 s), bez zhrnutia, druhý hook 17 až 20 s, výzva 27 až 30 s.
- **45 s:** kroky 5 (8 až 26 s), druhý hook 26 až 31 s, miesto 31 až 39 s, zhrnutie 39 až 42 s, výzva 42 až 45 s.
- **Nad 45 s** len so zmysluplnými kapitolami (ako V3: „Modul jeden, dva, tri“ s pauzou 0,3 až 0,5 s pred
  kapitolou). Nad 60 s pozor na hudbu (Content ID, [references/youtube-fakty.md](references/youtube-fakty.md), časť 4).
- **HEAD SPA 30** je pokojná značka: zábery 2,2 až 3,0 s, prelínanie 0,3 s, žiadne záblesky, hlas 110 až 140 slov/min.

Vyplnené kostry pre fitko, barbershop a spa (len so zástupnými poľami a odkazmi na zdroje) sú v
[references/sablony.md](references/sablony.md).

## Hook (prvé 3 sekundy)

- Reč a pohyb od prvej snímky. Všetky tri referencie hovoria od 0,0 s, žiadna nemá logo ani úvod.
- Prvá veta nesie výsledok, problém alebo obraz miesta; do 10 slov. Hlavná myšlienka musí byť čitateľná bez zvuku.
- Prvý strih alebo priblíženie do 1,5 s (V3 stojí 2,77 s a je to jeho slabina).
- Tri varianty porovnaj: `python3 -I ../instagram-salon/scripts/hook_skore.py "veta 1" "veta 2" "veta 3"`.
  Skóre porovnáva len vety medzi sebou; autoritu ani obraz nevidí (prvá veta V1 má 36, hoci hook funguje obrazom).
- **Dôkaz v prvej snímke** (V5, V8): vstup vedľa výsledku, výsledok už v pohybe (V8: obrázok a otáčajúci sa model
  od 0,0 s), alebo skutočná stránka hore a tvár dole (V5). Pre prevádzku skutočné „pred a po“ so súhlasom človeka
  v zábere; nikdy cudzia ukážka vydávaná za vlastnú.
- **Tri takty (V6):** štítok 2 až 4 slová, obrat alebo varovanie, podmienka „Ak chceš …, …“. Spolu do 7 s, prvé
  slovo od 0,0 s, každý takt iný záber, prvá zmena do 1,1 s. Len s pravdivým obsahom od majiteľa, napr. GYM KLUB
  „Takto drep nerob. Ak chceš drep bez bolesti v kolenách, sleduj, kam idú kolená.“ (vzor; čo je správne, povie
  tréner). Pri HEAD SPA 30 bez varovania a bez „zakázaného“.
- Nie: cudzia tvár alebo meno ako hook (V1, V7 „Fable 5 killer?“), hyperbola, ktorú hneď poprieš (V2 „replaced
  your entire team“, „No exaggeration“), číslo námahy bez dôkazu (V3 „200 hours“), cenová kotva bez zdroja (V9
  „$10,000“), reakcia tváre bez výsledku (V10), „neetické“ a „zadarmo, aj keď nevieš ako“ (V6: sľub, ktorý
  prevádzka nesplní, alebo propagácia porušovania podmienok, ktorú YouTube zakazuje).
- **Časový sľub len zmeraný (V11).** „Explained in less than 60 seconds“ zaznelo pri videu dlhom 90 s (samotný
  zoznam trvá 77,7 s). Ak hook sľubuje dĺžku („za 30 sekúnd“), zmeraj hotový súbor; inak sľub vynechaj.

### Zakázaný alebo šokujúci hook (V6, V7): kedy áno a čo nie

| Kedy áno | Čo nikdy |
| --- | --- |
| varovanie pred skutočnou chybou, ktorú prevádzka vidí („Takto drep nerob“, „Toto po holení nerob“), a short ju hneď pravdivo vysvetlí | „neetické“, „zakázané“, „toto ti nechcú ukázať“ pri bežnej službe; obsah, ako obísť platbu alebo podmienky (YouTube to zakazuje, `references/youtube-fakty.md`, časť 14) |
| otázka, ktorú short sám overeným faktom zodpovie („Mám si pred rituálom umyť vlasy?“ → odpoveď z FAQ v `index.html`) | otázka s tvrdením a požičaným menom („X killer?“): otáznik tvrdenie neruší |
| červená farba len na varovanie, najviac dvakrát za video, Barbershop 30 a GYM KLUB | pri HEAD SPA 30 žiadne varovanie, „zakázané“ ani poplach; pokojná značka |
| tvrdenie, ktoré dokazuje záber v tej istej sekunde | poplašné slová bez dátumu („nikto nevie“, „BREAKING“), superlatív z fámy |

Kontrola: `python3 -I scripts/tvrdenia.py tvrdenia.json` (otázky s tvrdením, superlatívy, zdravotné sľuby).

## Titulky

- **Písmo:** `assets/pisma/ManropeTitulky-700.ttf` (Manrope 700, SIL OFL 1.1, celá slovenská diakritika v jednom
  súbore; licencia `assets/pisma/OFL.txt`), 76 px pri 1080×1920.
- **Vzhľad:** biely text na tmavom podklade #161616 s krytím 85 %, jeden obdĺžnik pod celou frázou (ASS
  BorderStyle 4). Aktuálne slovo inou farbou (akcent značky), najviac jedno zvýraznené slovo naraz.
- **Farba s významom (V6):** najviac dve farby navyše k bielej: akcent značky na pointu, červená len na varovanie
  (Barbershop 30, GYM KLUB, najviac dvakrát za video; HEAD SPA 30 nie). Podklad len nad svetlým alebo rušným
  obrazom (biela stena, obrazovka); nad tmavým záberom stačí tieň.
- **Štítky hore (V7):** „NEPOTVRDENÉ · stav k [deň]“ alebo „Zdroj: [stránka], [dátum]“ cez `titulky.stitky` v EDL;
  `short.py` ich kreslí v bezpečnej zóne od 312 px (polia v [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md)).
- **Poloha:** pás 1040 až 1240 px na výšku, na stred, najviac 690 px široko (195 až 885 px). Tvár na celú
  obrazovku musí stáť nad pásom; titulok nikdy cez oči a ústa (chyba V1 pri 17,0 a 33,0 s).
- **Delenie:** frázy po 2 až 4 slovách, 0,6 až 1,2 s na frázu, najviac 2 riadky. Titulky po celý čas reči
  (V3 ich nemá v 67 % času, bez zvuku sa nedá sledovať).
- **Časovanie:** titulok sa objaví so slovom (±2 snímky), nábeh krytím 0,12 s. Pri hovorenom shorte zadaj časy
  slov ručne (pole `slova` v EDL); odhad podľa dĺžky slov sedí len pri hudbe.
- **Text:** to isté, čo zaznie; bez anglicizmov (V1: setup, review, bugy) a bez em dash.

## Strih a obraz

- Medián záberu 1,8 až 2,2 s (Barbershop 30, GYM KLUB), 2,2 až 3,0 s (HEAD SPA 30). Žiadny záber dlhší ako
  3,5 s bez zmeny; zmena je strih, priblíženie, nový titulok alebo pohyb kamery.
- Strih na prízvuk vety. Prelínanie 0,2 až 0,3 s len pri zmene miesta. Záblesky najviac dva, len v teplej farbe
  značky; pri HEAD SPA 30 žiadne.
- Kroky jednou vetnou šablónou (V1 „rola + čo ti urobí“, V2 „Tell it to …“): divák rytmus predvída.
- **Karty krokov (V9):** krátka karta „Krok 1“ 0,6 až 0,9 s v štýle značky, hneď za ňou dôkaz v zaoblenom rámiku
  (skutočná stránka alebo záber) s jedným zvýraznením údaju zo zdroja (cena, čas). Pri HEAD SPA 30 bez zábleskov.
- **Delená obrazovka (V1, V6, V8):** hore skutočný záber práce (ruky barbera, činky, voda pri head spa), dole
  hovoriaci človek, titulok na švíku (švík okolo y 880 je v bezpečnej zóne). Po vystrihnutí páuz striedaj delenú
  obrazovku a tvár zblízka: skok v tvári po strihu v reči nie je vidieť. B-roll vždy ukazuje to, čo práve zaznie;
  logo alebo stránka presne v momente, keď zaznie jej meno (V5).
- **Séria s jednou kostrou (V1, V8):** rovnaké sloty pre celú sériu (hook s dôkazom, „volá sa / ako to prebieha“,
  druhý hook, karta „staré → nové“ len keď je pravdivá, výzva); kostra v [references/sablony.md](references/sablony.md),
  časť 12.
- **Index a súhrnná karta (V11):** do 4 s karta so všetkými N položkami (číslo a názov presne zo zdroja). Posledná
  položka je zvýraznená akcentom značky, čím vznikne otvorená slučka. Na konci 3 až 4 s tá istá mriežka
  a pri každej položke jeden údaj zo zdroja (trvanie, cena v deň výroby). Súhrnná karta je ťahák, ktorý si
  divák uloží; výzvu „ulož si“ nepridávame. V11 má 6,8 % uložení z pozretí (1,25× viac ako páči sa), čo je
  v rozpätí V1 až V3 bez súhrnnej karty (5,5 až 7,1 %); prínos karty sa z toho odčítať nedá.
- **Počítadlo položiek (V11):** číslica 0,4 až 0,6 s (HEAD SPA 30: 0,8 s s prelínaním) presne na hovorené číslo
  (±0,2 s), potom pilulka „[POLOŽKA] n Z N“ od y 312 px. Pred číslom 0,2 až 0,4 s bez titulku. Posledná položka
  má dlhšiu číslicu (1,0 až 1,4 s) a je druhým hookom v 57 až 69 % dĺžky (V11 to má v 76 %). Hore je vždy
  **skutočný záber** položky; karta nesie len číslo, názov a jeden údaj, žiadne schémy ani makety rozhraní.
- **Karta mení obraz aj bez strihu:** pri kartách na svetlom pozadí vidí `strihy.sh` len prepínanie rozloženia
  (V11: 16 „strihov“, medián 4,60 s, 14 zo 17 záberov nad 3,5 s, hoci sa karta mení v mediáne každých 0,9 s).
  Pravidlo „nič nad 3,5 s bez zmeny“ vtedy kontroluj meraním zmien v časti obrazu (časť „Rozbor cudzieho
  shortu“).
- Karta s číslom 1,2 až 2,0 s. `short.py` karty nerobí: priprav obrázok 1080×1920 a sprav z neho klip
  `ffmpeg -loop 1 -i karta.png -t 1.8 -r 30 -pix_fmt yuv420p -c:v libx264 karta.mp4` (overené, pozri pipeline).
- Natáčanie: na výšku, 4 až 6 s na záber (strihá sa 1,5 až 3 s), stabilne, svetlo prevádzky. HDR z iPhonu
  nevadí, skript ho prevedie. Trasúci sa záber stabilizuj vopred (`../video-a-sekvencie/references/ffmpeg-prikazy.md`).
- Formát 1080×1920, 30 fps, 30 až 45 s.

## Zvuk

- Hlas zblízka (20 až 30 cm alebo klopový mikrofón) v tichej prevádzke, tempo 140 až 170 slov/min
  (HEAD SPA 30: 110 až 140). V1 má 188 slov/min po slovensky, to je na hrane zrozumiteľnosti.
- Hluché pauzy nad 0,3 s vystrihni: `python3 -I ../instagram-salon/scripts/pauzy.py zaber.mp4 --dlzka 0.3`
  (zoznam), s `--strih` nový súbor. Pred novou časťou nechaj 0,3 až 0,5 s.
- Podklad: zvuk prevádzky (strojček, voda, kotúče) alebo licencovaná hudba 18 až 22 dB pod hlasom
  (`klipy_db` a `hudba.db` v EDL).
- Hlasitosť: náš pracovný cieľ -14 LUFS a skutočná špička najviac -1 dBTP. YouTube oficiálny cieľ neuvádza;
  V1 má -15,8, V2 -10,8 a V3 -16,6 LUFS. `short.py` meria cez `ebur128` a hlási výsledok.

## Výzva (posledné ~3 s)

- Jedna akcia: rezervácia online (Booqme alebo rezervačný systém prevádzky), prípadne telefón zo zdroja.
- Adresa webu v obraze, krátka a čitateľná. Odkazy v popise a komentároch shortov podľa sekundárnych zdrojov
  nie sú klikateľné (TechCrunch a Tubefilter, 2023-08-10); súčasný stav over v aplikácii. Oficiálne sa dá ku
  shortu pridať súvisiace video z vlastného kanála ([references/youtube-fakty.md](references/youtube-fakty.md), časť 7).
- **Slučka slova (V6):** slovo z prvého titulku sa vráti vo výzve (služba, „Rezervuj“), divák ho spozná.
- **Výzva ako modul (V6):** posledné ~3 s nahraj raz za sezónu pre každú prevádzku (skutočné dvere alebo
  rezervácia na telefóne) a meň len text. Pred každým použitím over hodiny a adresu webu zo zdroja.
- **Návrat k hooku (V9):** posledná veta pred výzvou odpovedá na prvú.
- Nie: „daj follow“, „napíš do komentára XY a pošlem ti…“ (výzvy V1 až V3, V5, V9, V10), „napíš mi slovo do DM“
  (V6), otázka do komentárov (V7), sľuby výsledku.

### Výzvy „napíš slovo do komentára alebo DM“: ako fungujú a prečo ich nepoužívame

Štyri zo siedmich videí V4 až V10 končia výzvou za kľúčové slovo. Mechanizmus (overený 2026-10-19, podrobne
[references/youtube-fakty.md](references/youtube-fakty.md), časť 14): profesionálny účet na Instagrame prepojený cez API
s nástrojom (napr. ManyChat) dostane webhook so správou alebo komentárom a pošle odkaz; správy smie posielať len
v okne 24 h od správy človeka, na komentár jednu súkromnú odpoveď do 7 dní. Autor tým zbiera kontakty a hodnota
videa sa presúva do DM (V9: viac komentárov ako páči sa).

U nás nie, lebo: (1) **YouTube súkromné správy zrušil** 18. 9. 2019 a dnes ich má len obmedzene: konverzácia
začne až po pozvánke, ktorú druhá strana povolí (`references/youtube-fakty.md`, časť 14), takže v shorte takáto
výzva nefunguje; (2) naše
pravidlo 2 zakazuje automatické odpovede a DM v mene účtu; (3) short má dať hodnotu priamo a výzva je jedna akcia,
rezervácia. Ak by majiteľ chcel na Instagrame automatickú odpoveď na kľúčové slovo, je to jeho rozhodnutie
(otázka D1 podľa `../tim-roly/`) a zmena pravidla 2; potom len cez oficiálne API Mety a schváleného partnera, okno
24 h, jedna súkromná odpoveď na komentár, oznámenie, že ide o automatiku (pri AI chate AI Act čl. 50), presný text
odpovede schválený majiteľom, žiadny zber telefónov ani e-mailov bez súhlasu
(`../instagram-salon/references/pravne-hranice.md`).

## Formáty z referencií: kedy áno a čo nerobiť

| Formát | Odkiaľ | Kedy áno | Čo nerobiť | Ako |
| --- | --- | --- | --- | --- |
| stály titulok + pás 16:9 | V4 | vodorovný materiál (nahrávka webu, 360° prehliadka, vodorovné video), short ako upútavka na dlhšie video | preklepy v titulku (je na očiach celý čas), zvislé zábery (zahodí 68 % obrazu), zábery z Google Earth a Google 3D | [references/format-16x9.md](references/format-16x9.md), `scripts/titulok_16x9.py`, `assets/sablona-16x9.ass` |
| delená obrazovka, titulok na švíku | V1, V6, V8 | hovoriaci majiteľ alebo personál + skutočný záber práce hore | ilustračný b-roll bez vzťahu k vete, cudzie profily a weby hore | časť „Strih a obraz“, `sablony.md` časť 10 b) |
| komentár pred snímkou (green screen) | V7 | oznam prevádzky pred **vlastnou** stránkou (nová služba, hodiny, poukazy) | cudzí príspevok ako pozadie, 23 s bez zmeny obrazu, tvár cez číslo | [references/sablony.md](references/sablony.md), časť 10 (chromakey alebo vstack) |
| problém, 3 kroky, výsledok | V9, V10 | „rezervácia online v 3 krokoch“ ako záznam obrazovky telefónu | výsledok až na konci, „jeden riadok“ pri štyroch krokoch, „Done“ pri chybe | `sablony.md` časť 12 |
| séria s jednou kostrou | V1, V8 | séria shortov jednej prevádzky (raz za týždeň) | počítadlá od nuly, karta „staré → nové“ bez pravdy | `sablony.md` časť 12 |
| číslovaná vysvetľovačka (index → položky „n z N“ → súhrnná karta) | V11 | ponuka na výber (rituály, strihy, tréningy, poukazy), 3 až 5 položiek, 30 až 45 s | abstraktné schémy a makety namiesto záberov, nepravdivý časový sľub („less than 60 seconds“ pri 90 s), titulky pod 1248 px, napodobnené tlačidlo „Follow“ | časť „Strih a obraz“ (index a súhrnná karta), [references/anatomia-referencii.md](references/anatomia-referencii.md) V11 |
| rytmus podľa referencie | V10 | majiteľ chce „strihnúť ako toto video“ | cudzí obraz, zvuk, texty, ostré masky po 0,1 s | časť „Strih podľa referencie“ nižšie |

## Novinky, fámy a čísla zo snímok (poučenie z V7)

V7 (marcinteodoru, 2026-08-22, 202 000 pozretí) povedal „It's a 2.6 trillion model“, hoci graf za ním ukazoval
2,6 T **tokenov za deň** (hlavička „AUG 21 / 9.2T total“); model má 320 miliárd parametrov. „Fable 5 killer?“ stálo
na 10 úlohách jedného vývojára; na celom teste je model pod Fable 5 (63 % proti 70 %). O 4 dni sa ukázalo, kto
model robí, a video ostalo bez dátumu aj opravy (záznam 14).

| Stav tvrdenia (`scripts/tvrdenia.py`) | Kedy | Ako to povedať | V obraze |
| --- | --- | --- | --- |
| overené | primárny zdroj (výrobca, správca rebríčka, úrad), zdroj prevádzky, vlastné meranie s postupom | priamo | voliteľne „Zdroj: …“ |
| pripísané | dôveryhodné médium cituje iných | „Podľa [médium] …“ | „Zdroj: …, dátum“ |
| nepotvrdené | príspevok na sieti, cudzie video, jeden test | kto to tvrdí a na čom: „Jeden vývojár na 10 úlohách nameral …“ | štítok **NEPOTVRDENÉ · stav k [deň]** po celý čas tvrdenia |
| nepravdivé | zdroj tvrdenie vyvracia | nehovoriť; vyvrátenie je samostatné overené tvrdenie | |
| názor | tvoje hodnotenie | „Podľa mňa …“ | |

1. **Over pred tvrdením.** Zdroj otvor a prečítaj v deň výroby; príspevok, článok ani cudzie video nie je primárny
   zdroj, len stopa k nemu.
2. **Číslo len s jednotkou zo zdroja.** Pri grafe a tabuľke prečítaj hlavičku, jednotky a súčet; do `tvrdenia.py`
   zapíš `citat` a `jednotka`, skript skontroluje číslo aj jednotku vo vete.
3. **Fáma nahlas aj v obraze:** kto to tvrdí a na čom, štítok NEPOTVRDENÉ s dátumom. „Údajne“, „supposedly“ ani
   otáznik bez mena nestačia. Superlatív ani porovnanie z fámy, ani s otáznikom.
4. **Dátum stavu a oprava.** Keď sa stav zmení, majiteľ dostane návrh opravy (veta do popisu, pripnutý komentár),
   uverejní ju on; pri veľkom omyle short skryť. Pred uverejnením naplánovaného shortu over znova, ak od overenia
   prešlo viac ako 7 dní (`max_vek_dni`).
5. **O prevádzke žiadne fámy.** Termíny, nové služby, ceny, „vraj“ od zákazníkov len od majiteľa alebo zo zdroja
   prevádzky; zdravotné a výsledkové sľuby (vypadávanie vlasov, detox, chudnutie) len doslovne zo zdroja alebo
   s dokladom. Novinky o AI na kanáloch prevádzok nerobíme (HEAD SPA 30, `CLAUDE.md`: žiadna zmienka o AI).
6. **Kontrola pred schválením:** `python3 -I scripts/tvrdenia.py tvrdenia.json` kód 0; rýchly scenár v texte
   `--text scenar.txt` so značkami `[zdroj: …, RRRR-MM-DD]` alebo `[nepotvrdené: kto, RRRR-MM-DD]`. Vzory
   v `assets/tvrdenia/` (V7 ako ho povedal autor: 12 chýb; správna verzia: 0; test prevádzky: 5).

## Bezpečné zóny (1080×1920)

- Rozhranie YouTube zakrýva okraje. Prísna hranica podľa Google Ads, „YouTube | Vertical Video Ads“
  (support.google.com/google-ads/answer/9128498, stiahnuté 2026-10-17): **288 px hore, 672 px dole, 48 px vľavo,
  192 px vpravo**. Pre organické Shorts YouTube čísla nezverejňuje, preto berieme tieto.
- Všetko dôležité (titulky, číslo, adresa) patrí do obdĺžnika 48 až 888 px na šírku a 288 až 1248 px na výšku;
  titulky do pásu 1040 až 1240 px. Šablóna na prekrytie v strihovom programe: `assets/bezpecne-zony-1080x1920.png`.
- Titulky referencií sú v 68 až 84 % výšky (stavané pre TikTok) a na YouTube padajú pod názov a kanál.
- `short.py` kreslí zóny do náhľadu `<výstup>-nahlad.jpg` (červená zóna, modrý pás titulkov).

## Výroba krok za krokom

1. **Otázky majiteľovi** (pred väčším shortom): aké jedno tvrdenie má video dokázať, ktorý skutočný záber ho
   dokazuje, na čo sa zákazníci naozaj pýtajú. Otázky a formát rozhodnutia: `../tim-roly/` (rola CEO a produkt).
2. **Scenár** podľa [references/sablony.md](references/sablony.md): časová os, každá veta so zdrojom, tri
   varianty hooku cez `hook_skore.py`. Čo zdroj nemá, ide do „Treba potvrdiť“. Čísla a tvrdenia prejdú
   `scripts/tvrdenia.py` (kód 0).
3. **Zoznam záberov a súhlasy.** Čo majiteľ nemá, sa natočí; nič sa nevymýšľa ani negeneruje. Privolenie ľudí
   v zábere pred natáčaním.
4. **Kontrola záberov** snímka po snímke (ľudia, odrazy, obrazovky). Prehľad z vlastného videa:
   `bash ../referencie-z-videi/scripts/tiktok.sh --snimky zaber.mov <priečinok>`. Nevhodné úseky zapíš.
5. **EDL** podľa `assets/strih-priklad.json` (všetky polia v [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md)).
   Časy záberov sú v čase zdroja, časy titulkov v čase shortu. `--len-titulky` vypíše dĺžku a začiatky záberov:

   ```bash
   S=toolbox/skills-z-praxe/youtube-shorts/scripts
   python3 -I $S/short.py strih.json --len-titulky
   ```

6. **Výroba** (zábery, titulky, zvuk, export, kontrola 11 bodov, test synchronizácie, náhľad so zónami):

   ```bash
   python3 -I $S/short.py strih.json          # kód 0 = všetko OK, 1 = pozri <výstup>-kontrola.json
   bash $S/strihy.sh <výstup>.mp4 --prah 0.12  # tempo vlastného shortu proti receptu
   ```

7. **Kontrola človekom:** náhľad so zónami, celý short na telefóne so zvukom aj bez neho, titulky = hovorené
   slovo, diakritika. Pri dôležitom shorte brána dvoch nezávislých recenzentov
   (`../workflowy/priklady/brana-dvoch-recenzentov.js`, rubrika v `../tim-roly/references/sablony-rol.md`).
8. **Schválenie presného súboru:** majiteľ dostane video a text popisu, povie áno; zapíšeš kto a kde:

   ```bash
   python3 -I $S/schvalenie.py zapis --kniha <scratchpad>/schvalenia.jsonl --kto "majiteľ" --ako "správa 17.10. 14:05" short.mp4 popis.txt
   python3 -I $S/schvalenie.py over --kniha <scratchpad>/schvalenia.jsonl short.mp4 popis.txt   # pred odovzdaním, kód 0 = schválené
   ```

9. **Balík pre majiteľa** (nahráva v YouTube Studio alebo v aplikácii):

   | Pole | Čo dať | Prečo |
   | --- | --- | --- |
   | súbor | `<výstup>.mp4` | 1080×1920, do 3 min = Short |
   | súkromie | najprv súkromné alebo naplánované, verejné až po kontrole na telefóne | pravidlo 1 |
   | názov | hook, najviac 100 znakov | answer/10343433 |
   | popis | 1 až 2 vety s faktami, adresa, 2 až 3 sediace hashtagy | nad 60 hashtagov sa ignorujú všetky; pri názve sa ukážu najviac 3 |
   | made for kids | nie (ak short nie je pre deti) | povinná voľba v aplikácii |
   | AI use | No pri skutočných záberoch (farby, strih, titulky netreba označovať) | answer/14328491 |
   | paid promotion | nie na vlastnom kanáli prevádzky; áno, keď je v shorte cudzia značka za protihodnotu alebo short uverejní iný kanál za odmenu | answer/17596007 |
   | miniatúra | snímka zo shortu, vyberá sa v aplikácii YouTube (zo Studia sa pri shorte nedá) | answer/10343433 |
   | súvisiace video | Studio, Content, short, Related Video (vlastný kanál, treba pokročilé funkcie) | answer/14075157 |
   | titulky | automatické slovenské titulky YouTube skontrolovať; `titulky.srt` nahrať len pri verzii bez titulkov v obraze | answer/6373554 |

10. **Po uverejnení:** majiteľ pošle zo Studia po 48 h a po 7 dňoch **engaged views** a **Stayed to watch**.
    Celkové pozretia sa od 24. 8. 2026 počítajú od prvej snímky a na porovnávanie sa nehodia. Čísla zapíš pri
    shorte s dátumom, nič neodhaduj.

## Rozbor cudzieho shortu (tempo a strihy)

```bash
bash toolbox/skills-z-praxe/referencie-z-videi/scripts/tiktok.sh "https://vm.tiktok.com/<kód>/" <scratchpad>/ref
bash toolbox/skills-z-praxe/youtube-shorts/scripts/strihy.sh <scratchpad>/ref/video.mp4 --harok
bash toolbox/skills-z-praxe/youtube-shorts/scripts/strihy.sh <scratchpad>/ref/video.mp4 <scratchpad>/ref/strihy-012 --prah 0.12
```

`strihy.sh` vypíše strihy, počet a dĺžky záberov (priemer, medián), prvú zmenu obrazu, strihy za minútu,
hustotu po oknách a zábery nad 3,5 s; `--harok` dá prostrednú snímku každého záberu. Prah 0,25 nájde tvrdé
strihy celého obrazu, 0,12 aj zmeny v časti obrazu (V1: 13 strihov pri 0,25, 18 pri 0,12 a prvá zmena 1,43 s
ako pri ručnom rozbore). Prelínanie nenájde ani 0,12. Počet záberov over na hárku; rozdelená obrazovka
mení len polovicu obrazu (V1 má ručne 23 záberov, ffmpeg pri 0,25 len 14).

Keď je obraz z kariet na svetlom pozadí (V11), ffmpeg zmeny nevidí ani na výreze karty (prah 0,12: jediná
udalosť za 90 s). Zmeny vtedy meraj podielom zmenených pixelov v časti obrazu: horná karta bez pásu titulkov,
zmena jasu o viac ako 25 úrovní na viac ako 0,2 % pixelov, nový pohyb po aspoň 6 snímkach pokoja. Pri V11 to
dalo 75 zmien s mediánom 0,90 s (podľa citlivosti 71 až 85 a 0,77 až 1,00 s). Postup a výsledky:
`../referencie-z-videi/references/naucene-z-videi.md`, záznam 20, a [references/anatomia-referencii.md](references/anatomia-referencii.md),
V11; skript na to zatiaľ v toolboxe nie je.

## Strih podľa referencie (rytmus, nie obsah)

Majiteľ pošle video a povie „strihni to takto“: z referencie berieme len časy strihov, obraz, zvuk a texty nie.
Beží lokálne, klientske zábery nikam neodchádzajú (V10; overené 2026-10-19 na V2 a V10 s klipmi GYM KLUB: tvrdé
strihy výsledku na snímku presne, `short.py` 11 z 11).

```bash
python3 -I $S/strih_podla_referencie.py ref.mp4 zabery/ -o strih.json --bpm 100 --delenie 2 \
  --min-zaber 0.6 --max-zaber 3.5 --hudba hudba/podklad.wav --harok        # kostra EDL + hárok párov
python3 -I $S/short.py strih.json                                         # po doplnení titulkov
python3 -I $S/strih_podla_referencie.py --porovnaj strih.mp4 strih.json   # strihy ±1 snímka
```

HEAD SPA 30: `--mierka 1.5 --min-zaber 1.75`, len prelínanie; Barbershop 30 a GYM KLUB: `--mierka 1.15
--min-zaber 0.6`. Postup, prechody, výsledky a porovnanie s editormi napojenými na Claude (Shorty, Descript MCP
s Agent Underlord): [references/strih-podla-referencie.md](references/strih-podla-referencie.md). Cudzia strihacia
služba len so súhlasom majiteľa; vlastný konektor je cudzí server, ktorý dostáva zábery a môže vracať pokyny.

## Kontrolný zoznam pred uverejnením

Fakty a text
- [ ] Každá veta a každé číslo má zdroj prečítaný v deň výroby; ceny, hodiny a služby zo zdroja, nie z pamäti.
- [ ] Žiadne recenzie, hodnotenia, citácie ani „najlepší“ bez zdroja; nič vymyslené.
- [ ] Text v obraze = hovorené slovo, diakritika, bez em dash, bez zmienky o AI (ak nie je AI obsah označený).
- [ ] `scripts/tvrdenia.py` skončil s kódom 0; každé číslo má citát a jednotku zo zdroja.
- [ ] Nepotvrdené (len pri novinkách, nie o prevádzke): kto tvrdí a na čom zaznie nahlas, štítok NEPOTVRDENÉ s dátumom.
- [ ] Žiadne tvrdenie s otáznikom („X killer?“), žiadny superlatív ani porovnanie z fámy; ak od overenia prešlo
      viac ako 7 dní, tvrdenia sú overené znova.
- [ ] Stály titulok (formát 16:9) prečítali dvaja: pravopis a diakritika.

Ľudia a zábery
- [ ] Len skutočné zábery prevádzky; žiadny stock, maketa ani generovaný obraz vydávaný za skutočnosť.
- [ ] Nič z cudzieho videa (zábery, hudba, texty, snímky cudzích príspevkov); z referencie najviac rytmus strihov.
- [ ] B-roll ukazuje to, čo práve zaznie; žiadne zábery iného produktu ani cudzie profily a weby.
- [ ] Žiadne zábery z Google Earth, Google 3D ani nástrojov s Google podkladom.
- [ ] Privolenie každého rozpoznateľného človeka; klienti nerozpoznateľní; deti so súhlasom rodiča; žiadne odrazy.
- [ ] Na obrazovkách v zábere nie sú mená, telefóny ani rezervácie klientov.
- [ ] AI obraz alebo hlas len so súhlasom a s „AI use“ = Yes; pri HEAD SPA 30 žiadny.

Formát a zvuk
- [ ] `short.py` skončil s kódom 0 (11 bodov kontroly, synchronizácia ±5 ms okolo +2,7 ms).
- [ ] Reč od 0,0 s, prvý strih do 1,5 s, medián záberu podľa značky, nič nad 3,5 s bez zmeny (`strihy.sh`).
- [ ] Časový sľub v hooku (ak je) sedí s dĺžkou hotového súboru; pri formáte s kartami sú zmeny obrazu zmerané
      aj v časti obrazu, nielen `strihy.sh`.
- [ ] Titulky po celý čas reči, v páse 1040 až 1240 px, najviac 690 px široko, nie cez oči a ústa.
- [ ] Druhý hook medzi 55 a 75 % dĺžky; výzva v posledných ~3 s, jedna akcia, adresa webu v obraze;
      žiadne „comment“, „DM“ ani „follow“.
- [ ] Formát 16:9: pás 640 až 1247 px, strihy merané na páse (`crop`); štítky hore od 288 px.
- [ ] -14 LUFS ±1, špička najviac -1 dBTP; hudba vlastná, z knižnice YouTube alebo licencovaná.

Odovzdanie
- [ ] Pozreté na telefóne so zvukom aj bez neho; nič dôležité pod tlačidlami vpravo ani pod názvom dole.
- [ ] Majiteľ schválil presný súbor a text (`schvalenie.py over` vráti 0); uverejní ho on.
- [ ] Balík: súbor, názov, popis, hashtagy, AI use, paid promotion, made for kids, miniatúra.
- [ ] Žiadne automatické komentáre, odpovede ani DM; odpovede len ako návrhy.

## Čo nerobiť (poučenie z V1 až V11)

| Vo videu | Prečo nie | U nás |
| --- | --- | --- |
| cudzia tvár a meno ako hook (V1 Garry Tan) | nie je to naša prevádzka | najrozpoznateľnejší záber vlastného miesta |
| makety obrazovky vydávané za nahrávku (V1 terminál „hotovo za ~30 sekúnd“) | divák to berie ako dôkaz | len skutočné zábery a skutočné stránky |
| počítadlá hviezd od nuly, staré čísla (V2 64/261, dnes 71/311) | efekt a zastarané údaje | číslo so zdrojom a dátumom, bez animácie od nuly |
| b-roll cudzích kancelárií a ľudí (V2, ~73 % času) | naznačuje tím, ktorý neexistuje | zábery prevádzky alebo nič |
| moderátor, o ktorom nevieme, či je človek (V2) | nedôvera, povinnosť označiť AI | skutočný človek s privolením |
| ukážkové čísla vyzerajúce ako výsledky (V3 $41,200 proti $40,800) | klamlivé (zákon 108/2024, § 10) | žiadne čísla bez zdroja |
| titulky len v tretine videa (V3) | bez zvuku sa nedá sledovať | titulky po celý čas reči |
| titulky v 68 až 84 % výšky (všetky tri; aj V5 ~77 %, V8 a V9 pri tvári 70 až 76 %, titulok výzvy V6 y 1283 až 1345) | na YouTube pod názvom a kanálom | pás 1040 až 1240 px |
| hlasný basový podklad, -10,8 LUFS (V2) | prebíja reč | hudba 18 až 22 dB pod hlasom, -14 LUFS |
| „follow“, „comment“, „blueprint zadarmo“ | výzva bez hodnoty, „blueprint“ za komentár | rezervácia online |
| AI hovor do 60 s a automatické DM (V3) | zákon 452/2021 § 116 ods. 3, AI Act čl. 50, naše pravidlá | `../instagram-salon/`, časť Reklamy, dopyty a schvaľovanie |
| preklepy v stálom titulku (V4 „Tending“, „Then then“ celých 66 s) | titulok je na očiach celý čas | titulok prečítajú dvaja pred napálením |
| zábery z Google Earth alebo Google 3D (V4 nástroj s Google podkladom) | Google ich zakazuje na propagáciu; v EEA Google 3D Tiles pre nové projekty nie | vlastné video cesty k prevádzke |
| mém so zásahovou jednotkou, farebné pruhy s tónom, napodobnené tlačidlá (V4) | lacný efekt, napodobnené UI | nič také |
| zábery iného produktu ako ilustrácia toho, o ktorom hovoríš (V5: Kimi Agent Swarm, LMArena a ďalšie rozhrania počas viet o Agency Agents, 17,7 až 54,5 s, ~48 % času; aplikácia, o ktorej je reč, sa neukáže) | divák to berie ako ukážku produktu | len zábery prevádzky, o ktorej short je |
| video, ktoré nič nepomenuje a obsah schová za „DM me ‘UNETHICAL’“ (V6) | upútavka na zbieranie kontaktov; na YouTube správy len po pozvánke | hodnota priamo v shorte, výzva je rezervácia |
| ilustračné obrazovky bez vzťahu k vete (V6: okná ERP, cudzia dokumentácia) | divák ich berie ako dôkaz | b-roll ukazuje to, čo zaznie |
| cudzie profily s menami a e-mailom v obraze (V6) | osobné údaje tretích osôb | nikoho cudzieho v obraze |
| 258 slov za minútu bez jedinej pauzy, -20,6 LUFS (V6) | rýchlosť na hrane zrozumiteľnosti, tiché | 140 až 170 slov/min (HEAD SPA 110 až 140), -14 LUFS |
| „neetické“, „zadarmo, aj keď nevieš ako“ ako hook (V6) | sľub, ktorý prevádzka nesplní, alebo propagácia porušovania podmienok | pravdivé varovanie alebo obraz miesta |
| číslo zo snímky bez jednotky (V7 „2.6 trillion model“, na grafe 2,6 T tokenov za deň) | nepravdivé tvrdenie, ktoré divák nemá ako skontrolovať (moderátor číslo zakrýva) | číslo s jednotkou zo zdroja, `tvrdenia.py` (citát a jednotka) |
| tvrdenie s otáznikom a požičaným menom (V7 „Fable 5 killer?“) | otáznik tvrdenie neruší; na celom teste 63 % proti 70 % | otázka, ktorú short sám pravdivo zodpovie |
| „supposedly“ bez mena a dátumu, cudzí príspevok ako pozadie (V7) | nepovie, kto tvrdí a na čom; o 4 dni neplatné; cudzí obsah | kto, na čom, štítok NEPOTVRDENÉ · stav k [deň]; pozadie len vlastná stránka |
| 23 s bez zmeny obrazu pred nehybnou snímkou (V7) | drží len pri horúcej novinke | zmena každé 2 až 3 s: priblíženie na detail, ktorý práve hovoríš |
| „licencia MIT, zadarmo“ bez výhrad (V8) | závislosti (nvdiffrast, RMBG-2.0) sú len nekomerčné | tvrdenie o licencii len po prečítaní závislostí, inak vynechať |
| ukážkové obrázky výrobcu vydávané za „fotku“, počítadlá od nuly (V8) | výsledok na fotke z telefónu je iný; efekt | skutočné „pred a po“ prevádzky |
| cenová kotva bez zdroja ako hook (V9 „$10,000“, „five figures“) | neoveriteľné, klamlivé (zákon 108/2024, § 10) | výsledok alebo obraz miesta |
| „No developers. No designers. No experience.“ (V9) | nepravda, záber ju vyvracia | sľub, ktorý short ukáže |
| cudzie a neoficiálne weby ako výsledok metódy (V9 Nike, Pepsi, vodoznak iného autora) | cudzia práca ako dôkaz | len vlastné zábery |
| „Done“ pri zábere s chybou PATH (V9) | dôkaz vyvracia tvrdenie | čo sa tvrdí, to záber ukazuje |
| „3 kroky“ zostrihané z rôznych relácií, výsledok až v posledných 2,2 s (V10) | nie je to jeden beh; divák čaká na dôkaz | jeden skutočný záznam, výsledok v hooku |
| série zmien po 0,1 s a ostré tvarové masky (V10) | proti receptu, pri pokojnej značke rušivé | strih podľa receptu; pri HEAD SPA nikdy |
| „comment SLOVO“, „DM SLOVO“ (V5, V6, V9, V10) | výzva bez hodnoty; na YouTube správy len po pozvánke; automatické odpovede sú proti pravidlu 2 | rezervácia online |
| časový sľub, ktorý video nesplní (V11 „less than 60 seconds“ pri 90 s) | nepravdivé tvrdenie (zákon 108/2024, § 10) | dĺžku zmerať, inak nesľubovať |
| abstraktné schémy a maketa kurzora, ktorý „klikne Approve“ (V11) | pri prevádzke by to divák bral ako ukážku | skutočný záber položky, karta len na číslo, názov a údaj |
| titulky delené mechanicky po troch slovách („THEN A MARKETING / AGENT WOULD MARKET“, V11) | trhá frázy | 2 až 4 slová podľa zmyslu |
| titulky pri karte na celú obrazovku v y 1424 až 1530 a pilulka v y 228 až 271 (V11) | na YouTube pod názvom, resp. v hornom páse s ovládaním | pás 1040 až 1240 px, štítky od 312 px |
| -12,6 LUFS so skutočnou špičkou +0,2 dBFS (V11) | hlasné, riziko skreslenia | -14 LUFS, najviac -1 dBTP (`short.py`) |

## Pasce a lekcie (zmerané 2026-10-17, 2026-10-19 a 2026-10-20)

| Pasca | Čo sa stalo | Riešenie |
| --- | --- | --- |
| HDR z iPhonu vyblednuté | HLG prevedené len `scale` do BT.709: sýtosť 16,5 namiesto 26,7, vyšší jas | `zscale` linearizácia + `tonemap=hable` (robí `short.py`) |
| zvuk predbieha obraz | MP4 bez edit listu: B-snímky posunú obraz o 2 snímky, AAC pridá 1024 vzoriek; výsledok -42,7 ms | `+negative_cts_offsets` a odstrihnutých prvých 1024 vzoriek zmesi; overené +2,7 ms ako zdroj (`--test-sync`) |
| `loudnorm` meria inak | na 8 s zmesi -14,09 LUFS, `ebur128` -13,6 | meranie aj kontrola cez `ebur128`; `"metoda": "loudnorm"` len na želanie |
| AAC zdvihne špičku | -1,4 dBTP vo WAV, -0,9 až -0,4 dBTP po AAC | pred kódovaním strop -2 dBTP |
| tmavé pruhy v podklade titulkov | BorderStyle 3 s krytím 85 % kreslí box pod každý úsek, prekryvy sú tmavšie | BorderStyle 4, obrys priehľadný (predvolené `"podklad_tvar": "jeden"`) |
| chýbajúca diakritika | webové písma rozdelené na latin a latin-ext; libass potichu siahne po inom písme | jedno TTF s celou diakritikou; skript hlási `Glyph not found` a náhradu písma |
| `xfade` odmietne vstup | „inputs needs to be a constant frame rate“ po `concat` | `fps=30` pred každým prelínaním (v skripte) |
| trasenie pri pomalom priblížení | `crop` a `zoompan` posúvajú po celých pixeloch | `perspective` s `eval=frame` a `cubic` (v skripte) |
| metadáta telefónu vo výstupe | ffmpeg kopíruje model, softvér, dátum a polohu | `-map_metadata -1` (v skripte) |
| staršie videá nesedia s YouTube | `gymklub-reel-v1.mp4`: edit list, GOP 109, 3 B-snímky, -16,2 LUFS, kontrola 7 z 11 | prebaliť cez EDL s jedným klipom bez titulkov |
| pravidlá sa líšia podľa jazyka stránky | Content ID nad 1 min: en „blocked globally“, en-GB „no longer automatically blocked“ od 24. 9. 2026 | čítať viac jazykových verzií, pri rozpore konzervatívne |
| automatické titulky TikToku sú zlé | V1 je slovenčina prepísaná ako angličtina | reč referencie čítaj z titulkov v obraze, opravy označ |
| obrázok namiesto videa v EDL | `short.py` nevie prečítať dĺžku PNG | najprv klip cez `ffmpeg -loop 1 … -t` (príkaz vyššie) |
| strihy formátu 16:9 sa nedajú zmerať | čierne pásy a stály titulok zriedia skóre scény (V4: celý obraz 7 zmien, pás 22; náš test: celý obraz 0) | merať s `crop=1080:608:0:640` pred `select` |
| písací stroj sa bije s titulkami reči | písací stroj na y 1100 leží v páse titulkov 1040 až 1240 (skúška 2026-10-19) | pri titulkoch reči `y` 684 (hore v páse 16:9) |
| kurzor písacieho stroja sa číta ako „I“ | plné „\|“ v Manrope („TERASAI“, skúška V4) | zúžený kurzor vo farbe akcentu (`titulok_16x9.py`) |
| prechod posunie strihy | `xfade` skracuje časovú os o dĺžku prechodu | `strih_podla_referencie.py` predĺži predošlý záber; overené 412 snímok = 13,73 s |
| tvarový prechod nie je ostrý | `circleopen` v `xfade` má mäkký okraj | ostré masky ako V10 nerobíme; pri HEAD SPA žiadne tvary |
| štítok zakryje rozhranie YouTube | štítok nad 288 px (V7: 124 px v hornom páse) | `titulky.stitok.hore` od 312 px, `short.py` upozorní |
| `strihy.sh` vidí len prepínanie rozloženia | V11: 16 strihov, medián 4,60 s, hoci sa karta mení každých ~0,9 s; ffmpeg na výreze karty pri prahu 0,12 našiel 1 udalosť | podiel zmenených pixelov v časti obrazu (časť „Rozbor cudzieho shortu“) |

## V tomto toolboxe

- `scripts/short.py`: výroba, `--len-titulky`, `--kontrola`, `--test-sync` (Python 3, ffmpeg so `zscale`,
  `tonemap`, `ass`, `xfade`, `perspective`, `ebur128`; Pillow, fontTools, numpy). ffprobe netreba.
- `scripts/strihy.sh`: strihy, dĺžky záberov a hustota z ľubovoľného videa (bash, awk, ffmpeg).
- `scripts/schvalenie.py`: kniha schválení podľa sha256 (len štandardná knižnica; myšlienka z ECC
  `operator-approval-loop`, kód vlastný).
- `scripts/tvrdenia.py`: kontrola tvrdení scenára (stav, zdroj, dátum, citát a jednotka čísla, štítok
  NEPOTVRDENÉ, superlatívy, otázky s tvrdením, zdravotné sľuby); JSON alebo voľný text, kód 0 = bez chýb, len
  štandardná knižnica. Príklady v `assets/tvrdenia/`.
- `scripts/titulok_16x9.py`: formát stály titulok + pás 16:9 (Python 3, ffmpeg s `ass`); výstup ide do `short.py`.
- `scripts/strih_podla_referencie.py`: kostra EDL podľa rytmu referencie, hárok párov, `--porovnaj` (Python 3,
  ffmpeg, bash pre `strihy.sh`, Pillow pre hárok).
- `short.py`, pole `titulky.stitky`: štítky hore v bezpečnej zóne (NEPOTVRDENÉ, zdroj, dátum stavu).
- `assets/strih-priklad.json` (vzor EDL), `assets/pisma/` (písmo titulkov Manrope a licencia `OFL.txt`; písmo
  kinetického slova `BebasTitulky.ttf` a licencia `OFL-Bebas.txt`), `assets/bezpecne-zony-1080x1920.png` (šablóna
  zón), `assets/sablona-16x9.ass` a `assets/format-16x9-priklad.json` (formát V4), `assets/tvrdenia/` (vzory).
- [references/anatomia-referencii.md](references/anatomia-referencii.md): V1 až V11 s časmi a lekciami.
- [references/format-16x9.md](references/format-16x9.md): formát stály titulok + pás 16:9 (V4), rozmery, ffmpeg, skúšky.
- [references/strih-podla-referencie.md](references/strih-podla-referencie.md): strih podľa rytmu referencie (V10),
  nastavenia podľa značky, skúšky, porovnanie so Shorty a Descript MCP.
- [references/youtube-fakty.md](references/youtube-fakty.md): pravidlá YouTube a zákony so zdrojmi a dátumom.
- [references/sablony.md](references/sablony.md): scenár, storyboard, názov, popis, hashtagy (fitko, barbershop, spa).
- [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md): kroky skriptu, formát EDL, výsledky skúšok, riziká.
- Súvisiace: `../instagram-salon/` (hook_skore.py, pauzy.py, fakty, hlas, odpovede), `../referencie-z-videi/`
  (stiahnutie a rozbor cudzích videí, záznamy 8 až 17 a 20, zásada sťahovania), `../tim-roly/` (otázky, brána,
  schválenie, roly textár a obsah, ponuka a rezervácie),
  `../video-a-sekvencie/` (stabilizácia, video na web), `../film-z-fotiek/` (pravidlá záberov).
- Pracovné priečinky `<výstup>-prac/`, hotové videá, zábery a kniha schválení patria do scratchpadu, nie do repozitára.
