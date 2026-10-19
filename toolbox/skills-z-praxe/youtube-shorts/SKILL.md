---
name: youtube-shorts
description: YouTube Shorts (a reels na výšku) pre HEAD SPA 30, Barbershop 30 a GYM KLUB zo skutočných záberov z telefónu. Recept 30 až 45 s s časovou osou (hook do 1,5 s, kroky, druhý hook, výzva), pravidlá titulkov, strihu, zvuku a bezpečných zón YouTube, šablóny scenára, storyboardu, názvu, popisu a hashtagov. Skript scripts/short.py urobí z EDL hotový súbor (9:16 a 1080×1920, HDR z iPhonu na SDR, prelínanie, titulky slovo po slove v ASS, -14 LUFS, H.264 a AAC, faststart) a skontroluje ho v 11 bodoch; scripts/strihy.sh zmeria strihy a tempo referenčného videa; scripts/schvalenie.py zapíše schválenie presného súboru majiteľom. Použi pri „urob short“, „vertikálne video“, „reel aj na YouTube“, „titulky do videa“, „vyrovnaj hlasitosť“, „HDR je vyblednuté“, „ako je strihnuté toto video“, „skontroluj video pred nahratím“. Nič neuverejňuje, nahráva majiteľ.
---

# YouTube Shorts pre prevádzku

Short je zvislé alebo štvorcové video do 3 minút. Pre prevádzky ho robíme zo skutočných záberov z telefónu,
s titulkami do obrazu, a odovzdávame majiteľovi ako hotový súbor s textami do YouTube Studio. Cieľ shortu je
rezervácia, nie sledovatelia. Uverejňuje majiteľ.

Postup vznikol 2026-10-17 z rozboru troch TikTokov (V1 martin.gocik, V2 sadie.ontech, V3 restructureai;
merania v [references/anatomia-referencii.md](references/anatomia-referencii.md)), z pomocníka YouTube
([references/youtube-fakty.md](references/youtube-fakty.md), overené 2026-10-17) a zo skúšok na záberoch
GYM KLUB (skript a výsledky v [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md)).

## Kedy použiť

- Majiteľ chce short, „reel aj na YouTube“ alebo vertikálne video z toho, čo natočil.
- Treba scenár a zoznam záberov na natáčanie (šablóny v [references/sablony.md](references/sablony.md)).
- Treba titulky do obrazu, vyrovnať hlasitosť, opraviť vyblednuté HDR z iPhonu alebo urobiť z videa 9:16.
- Majiteľ pošle cudzí short a pýta sa, prečo funguje: najprv `../referencie-z-videi/` (stiahnutie, prehľad),
  potom `scripts/strihy.sh` (strihy a tempo) a porovnanie s receptom nižšie.
- Hotové video (render, prehliadka) treba skontrolovať alebo prebaliť podľa odporúčaní YouTube.

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
- Nie: cudzia tvár alebo meno ako hook (V1), hyperbola, ktorú hneď poprieš (V2 „replaced your entire team“,
  „No exaggeration“), číslo námahy bez dôkazu (V3 „200 hours“).

## Titulky

- **Písmo:** `assets/pisma/ManropeTitulky-700.ttf` (Manrope 700, SIL OFL 1.1, celá slovenská diakritika v jednom
  súbore; licencia `assets/pisma/OFL.txt`), 76 px pri 1080×1920.
- **Vzhľad:** biely text na tmavom podklade #161616 s krytím 85 %, jeden obdĺžnik pod celou frázou (ASS
  BorderStyle 4). Aktuálne slovo inou farbou (akcent značky), najviac jedno zvýraznené slovo naraz.
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
- Nie: „daj follow“, „napíš do komentára XY a pošlem ti…“ (výzvy V1 až V3), sľuby výsledku.

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
   varianty hooku cez `hook_skore.py`. Čo zdroj nemá, ide do „Treba potvrdiť“.
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

## Kontrolný zoznam pred uverejnením

Fakty a text
- [ ] Každá veta a každé číslo má zdroj prečítaný v deň výroby; ceny, hodiny a služby zo zdroja, nie z pamäti.
- [ ] Žiadne recenzie, hodnotenia, citácie ani „najlepší“ bez zdroja; nič vymyslené.
- [ ] Text v obraze = hovorené slovo, diakritika, bez em dash, bez zmienky o AI (ak nie je AI obsah označený).

Ľudia a zábery
- [ ] Len skutočné zábery prevádzky; žiadny stock, maketa ani generovaný obraz vydávaný za skutočnosť.
- [ ] Privolenie každého rozpoznateľného človeka; klienti nerozpoznateľní; deti so súhlasom rodiča; žiadne odrazy.
- [ ] Na obrazovkách v zábere nie sú mená, telefóny ani rezervácie klientov.
- [ ] AI obraz alebo hlas len so súhlasom a s „AI use“ = Yes; pri HEAD SPA 30 žiadny.

Formát a zvuk
- [ ] `short.py` skončil s kódom 0 (11 bodov kontroly, synchronizácia ±5 ms okolo +2,7 ms).
- [ ] Reč od 0,0 s, prvý strih do 1,5 s, medián záberu podľa značky, nič nad 3,5 s bez zmeny (`strihy.sh`).
- [ ] Titulky po celý čas reči, v páse 1040 až 1240 px, najviac 690 px široko, nie cez oči a ústa.
- [ ] Druhý hook medzi 55 a 75 % dĺžky; výzva v posledných ~3 s, jedna akcia, adresa webu v obraze.
- [ ] -14 LUFS ±1, špička najviac -1 dBTP; hudba vlastná, z knižnice YouTube alebo licencovaná.

Odovzdanie
- [ ] Pozreté na telefóne so zvukom aj bez neho; nič dôležité pod tlačidlami vpravo ani pod názvom dole.
- [ ] Majiteľ schválil presný súbor a text (`schvalenie.py over` vráti 0); uverejní ho on.
- [ ] Balík: súbor, názov, popis, hashtagy, AI use, paid promotion, made for kids, miniatúra.
- [ ] Žiadne automatické komentáre, odpovede ani DM; odpovede len ako návrhy.

## Čo nerobiť (poučenie z V1 až V3)

| Vo videu | Prečo nie | U nás |
| --- | --- | --- |
| cudzia tvár a meno ako hook (V1 Garry Tan) | nie je to naša prevádzka | najrozpoznateľnejší záber vlastného miesta |
| makety obrazovky vydávané za nahrávku (V1 terminál „hotovo za ~30 sekúnd“) | divák to berie ako dôkaz | len skutočné zábery a skutočné stránky |
| počítadlá hviezd od nuly, staré čísla (V2 64/261, dnes 71/311) | efekt a zastarané údaje | číslo so zdrojom a dátumom, bez animácie od nuly |
| b-roll cudzích kancelárií a ľudí (V2, ~73 % času) | naznačuje tím, ktorý neexistuje | zábery prevádzky alebo nič |
| moderátor, o ktorom nevieme, či je človek (V2) | nedôvera, povinnosť označiť AI | skutočný človek s privolením |
| ukážkové čísla vyzerajúce ako výsledky (V3 $41,200 proti $40,800) | klamlivé (zákon 108/2024, § 10) | žiadne čísla bez zdroja |
| titulky len v tretine videa (V3) | bez zvuku sa nedá sledovať | titulky po celý čas reči |
| titulky v 68 až 84 % výšky (všetky tri) | na YouTube pod názvom a kanálom | pás 1040 až 1240 px |
| hlasný basový podklad, -10,8 LUFS (V2) | prebíja reč | hudba 18 až 22 dB pod hlasom, -14 LUFS |
| „follow“, „comment“, „blueprint zadarmo“ | výzva bez hodnoty, „blueprint“ za komentár | rezervácia online |
| AI hovor do 60 s a automatické DM (V3) | zákon 452/2021 § 116 ods. 3, AI Act čl. 50, naše pravidlá | `../instagram-salon/`, časť Reklamy, dopyty a schvaľovanie |

## Pasce a lekcie (zmerané 2026-10-17)

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

## V tomto toolboxe

- `scripts/short.py`: výroba, `--len-titulky`, `--kontrola`, `--test-sync` (Python 3, ffmpeg so `zscale`,
  `tonemap`, `ass`, `xfade`, `perspective`, `ebur128`; Pillow, fontTools, numpy). ffprobe netreba.
- `scripts/strihy.sh`: strihy, dĺžky záberov a hustota z ľubovoľného videa (bash, awk, ffmpeg).
- `scripts/schvalenie.py`: kniha schválení podľa sha256 (len štandardná knižnica; myšlienka z ECC
  `operator-approval-loop`, kód vlastný).
- `assets/strih-priklad.json` (vzor EDL), `assets/pisma/` (písmo titulkov a licencia OFL),
  `assets/bezpecne-zony-1080x1920.png` (šablóna zón).
- [references/anatomia-referencii.md](references/anatomia-referencii.md): V1 až V3 s časmi a lekciami.
- [references/youtube-fakty.md](references/youtube-fakty.md): pravidlá YouTube a zákony so zdrojmi a dátumom.
- [references/sablony.md](references/sablony.md): scenár, storyboard, názov, popis, hashtagy (fitko, barbershop, spa).
- [references/pipeline-ffmpeg.md](references/pipeline-ffmpeg.md): kroky skriptu, formát EDL, výsledky skúšok, riziká.
- Súvisiace: `../instagram-salon/` (hook_skore.py, pauzy.py, fakty, hlas, odpovede), `../referencie-z-videi/`
  (stiahnutie a rozbor cudzích videí, záznamy 8 až 10), `../tim-roly/` (otázky, brána, schválenie),
  `../video-a-sekvencie/` (stabilizácia, video na web), `../film-z-fotiek/` (pravidlá záberov).
- Pracovné priečinky `<výstup>-prac/`, hotové videá, zábery a kniha schválení patria do scratchpadu, nie do repozitára.
