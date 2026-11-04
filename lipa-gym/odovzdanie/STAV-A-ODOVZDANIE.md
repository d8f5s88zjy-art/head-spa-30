# GYM KLUB (Lipa gym): stav práce a odovzdanie webu

Stav k 4. 11. 2026 (časti 1, 2, 4, 5 a 6 doplnené po Profesionálnom vzhľade; predtým 3. 11. po Filmovej vrstve). Tento súbor je „pamäť“ projektu. Ak pri odovzdaní webu niečo nevieš, odpoveď
by mala byť tu alebo v súboroch, na ktoré odkazuje.

## 1. Kde čo je

| Čo | Kde | Stav |
| --- | --- | --- |
| Živý web dnes | repozitár `d8f5s88zjy-art/Lupa-gym`, vetva `main` = commit `4fb1416` (tvoja verzia), web <https://d8f5s88zjy-art.github.io/Lupa-gym/> | beží, bez mojich zmien |
| Moje hotové zmeny (logo, Marko Rigo, Bar, editor pre Ondreja) | záloha `lupa-gym-zaloha.bundle` v tomto priečinku, vetva `main` (commity `69d7665` až `396f446`) | hotové, skontrolované, **nenahraté** do Lupa-gym |
| Nový vzhľad (redizajn) | tá istá záloha, vetva `redizajn-2026-10` (od `534f588`) | **rozpracované**, nenasadzovať |
| Profesionálny vzhľad (želanie z 3. 11.: „menej jak dokument, ako profesionálna stránka“) | vetva `profesionalny-vzhlad` (od `36d8066`, posledný commit `c6c01d0`), prírastková záloha `lupa-gym-profesionalny-vzhlad.bundle` v tomto priečinku | **hotové a overené**, nezverejnené, nenasadené (časť 2) |
| Náhľad redizajnu | <https://claude.ai/artifact/2a5djhGB6rjJKtWyUBsffC> (súkromný, zdieľa sa cez Share) | stav pred pohybovým systémom |
| Špecifikácia redizajnu | `SPEC.md` v tomto priečinku | záväzná pre dokončenie |
| Denník implementácie | `IMPLEMENTACIA-POZNAMKY.md` v tomto priečinku | všetky rozhodnutia, merania a odchýlky |
| Návod pre Ondreja | `NAVOD-PRE-ONDREJA.md` (kópia z repozitára) | aktuálny pre vetvu `main` |
| Návod pre vlastníka GitHub účtu | `NASTAVENIE-CMS.md` (kópia z repozitára) | aktuálny pre vetvu `main` |

Nahratie do `Lupa-gym` som nespravil, lebo systém mi bez tvojho výslovného súhlasu nepovolil zápis do toho
repozitára. Stačí napísať „nahraj do Lupa-gym“, alebo to nahrať sám (časť 3).

## 2. Čo je hotové

**Vetva `main` (pripravená na nahratie):**

- Logo z klubovej kartičky namiesto činky: hlavička (na bielej kartičke), pätička, ikona v prehliadači.
- Nová fotka Mgr. Marka Riga (od majiteľa fitka cez WhatsApp).
- Časť „Po tréningu na kávu“ (Bar) s piatimi fotkami a položka „Bar“ v menu.
- Editor obsahu pre Ondreja (Pages CMS, zadarmo): hodiny, tréneri, rozvrh, cenník, recenzie, otázky, fotky,
  oznam navrchu webu. Prihlásenie e-mailom a kódom, bez hesla. Po uložení sa web sám zverejní asi za 1–2 minúty.
- Pri chybe v obsahu sa web nezverejní (ostane posledná funkčná verzia) a stránka
  <https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> po slovensky povie, čo a kde opraviť.
- 70 automatických testov, vzhľad zhodný s dnešným webom (okrem zámerných zmien: telefóny trénerov v tvare +421).

**Vetva `redizajn-2026-10` (rozpracované, smer „pokojný prémiový magazín“, vybrala ho porota troch sudcov):**

- B0–B1: nové orezy a jednotná farebná úprava skutočných fotiek (len Pillow, nič generované).
- B2: nová štruktúra stránky, kratšia asi o tretinu; CMS polia upravené, návody aktualizované.
- B3: vizuálny systém: farby z loga (čierna, kostená biela, červená #e2412f), písma Oswald a Manrope.
- Opravy: svetlejší úvod na telefóne (fitko je vidno), nová fotka v medzihre „Funkčná zóna“ (`u-38047dcd`),
  cenník na telefóne, lightbox, tlačidlo hore, záložné formáty fotiek.
- B4: pohybový systém: jemné odhalenia, otvorenie úvodu, skok z menu cez View Transition, lightbox s letom fotky.
  Commit `d450017`, po nezávislej kontrole opravy v `809bc02` (fotka sa odhalí až načítaná, fokus v lightboxe,
  pulz bodky pri obmedzenom pohybe).

**Vetva `filmova-vrstva` (od `809bc02`, 3. 11. 2026, posledný commit `36d8066`; záloha `lupa-gym-filmova-vrstva.bundle`
v tomto priečinku, obnova v časti 6; zverejnená v náhľade claude.ai 3. 11. 2026; do Lupa-gym **nenahratá**):**

- Na žiadosť majiteľa z 2. 11. („filmové prechody, kurzor činka, cinematické efekty, profesionálne, skontrolovať fotky“).
- Kontrola fotiek a opravy (`dcd8414`): všetky fotky sa ukážu pri všetkých šírkach, v lightboxe, po skoku z menu aj na
  pomalej sieti (karty trénerov a plagáty videí už nie sú prázdne sivé rámy); diakritika druhého riadku nadpisov sa
  nedotkne prvého; logo MDS v pätičke pri 1024 px nie je stlačené; video Ladydefence sa po ťuknutí samo prehrá; v náhľade
  claude.ai odkazy Zavolať a e-mail otvoria nové okno namiesto chybovej stránky.
- Mapa a tlačidlo Späť (`c6aa7e7`): keď sa Google mapa nenačíta (zablokovaná, offline, náhľad), ostane pekná karta
  s adresou a tlačidlom Navigovať; Späť po skoku z menu vráti na pôvodné miesto. Výnimka (KF-2, otvorené): keď
  Google pošle chybovú alebo prázdnu stránku, iframe ostane biely – istotu dá len načítanie mapy po kliknutí (rozhodne majiteľ).
- Filmová vrstva a kurzor (`07eca7a`, oprava rytmu úvodu `c8de97f`): otvárací záber úvodu (na počítači rozostrený záber zaostrí a kinematografické
  pásy sa stiahnu, titulok v rytme), titulkové karty kapitol, fotky sa „exponujú“ z tmy, veľké zábery priestoru pomaly
  odstúpia (4,8 s, potom stoja), skok z menu strihom cez tmu, vineta medzihry, záverečný titulok pätičky, kurzor činka
  (kostená, nad odkazmi červená) len pre myš. Len CSS, žiadny nový JavaScript, žiadne video ani efekt riadený
  skrolovaním, pri „obmedziť pohyb“ a bez JS všetko statické a viditeľné; na telefóne pri 4× spomalenom CPU rovnako plynulé
  snímky obrazu ako predtým, otvorenie a skok bez nových dlhých úloh. Testy a dokumentácia (`SPEC.md` 2.8, 5.6, `IMPLEMENTACIA-POZNAMKY.md` „Filmová vrstva a kurzor“).
- Oprava 2 po nezávislej kontrole (`36d8066`): skok z otvoreného mobilného menu bez dvojexpozície (menu zhasne do tmy,
  cieľ sa rozsvieti), pomalé odďaľovanie len pri širokej ploche eseje (menej vrstiev pri súvislom skrole), Tab nezájde pod
  otvorené menu, rozvrh ovládateľný aj Home/End. Overenie: unittest 91 OK, test_prehliadac a test_vzhlad (93) OK, pri 6 šírkach
  všetky fotky načítané, lightbox 12/12, 8/8 skokov so Späť na pôvodné miesto, v prehliadači náhľadov 36/36 fotiek a 0 chýb.
- Poznámka: „bez efektu riadeného skrolovaním a bez pripínania“ platí pre filmovú vrstvu. Odchod úvodu, pruh postupu, parallax
  a lepiace prvky (úvod, Kde začať, video lekcií, nadpis Otázok) sú od B3/B4 (SPEC 5.2 #4–5); či ostanú, rozhodne majiteľ.

**Vetva `profesionalny-vzhlad` (od `36d8066`, 3.–4. 11. 2026, posledný commit `c6c01d0`; záloha
`lupa-gym-profesionalny-vzhlad.bundle` v tomto priečinku, obnova v časti 6; nezverejnená, do Lupa-gym **nenahratá**):**

- Na želanie majiteľa z 3. 11.: „Skús to fitko urobiť menej jak dokument ale ako profesionálnu stránku s ktorou bude
  zákazník spokojný.“ Tri koncepty, porota (víťaz A „Klub ako značka“ s prvkami z B a C) a plán P-01 až P-33
  (`gym/profi/porota/VYBER.md`). Štruktúra a komponenty: `SPEC.md` kapitola 14; denník a merania:
  `IMPLEMENTACIA-POZNAMKY.md`, „Profesionálny vzhľad“.
- Čo uvidí zákazník: tmavé a svetlé (kostené) časti sa striedajú, obsah je v kartách. Hneď pod úvodom sú štyri
  dlaždice: cena vstupu a permanentky, dnešné otváracie hodiny, čo práve prebieha, adresa. Ponuka je v šiestich
  kartách s fotkou, cenník v kartách (permanentka zvýraznená), prvá návšteva v troch krokoch, päť kariet lekcií
  (video až po ťuknutí), rozvrh, tréneri (na telefóne vodorovný pás), galéria priestoru, recenzie, otázky, kontakt
  v troch kartách (Google mapa až po kliknutí). Na telefóne je dole dok Zavolať · Navigovať · výzva.
- Stránka je kratšia: telefón 22,9 → 15,6 obrazovky, počítač 18,4 → 12,6. Cena a hodiny sú v prvej obrazovke,
  prvá návšteva do 3,7 obrazovky (predtým 16,9), bojové športy do 4,8 (predtým 8,3), všetko na 1 ťuk.
- Pravidlá ostali: len skutočné fotky z fitka (každá na stránke raz), žiadne nové tvrdenia ani čísla (texty len
  skrátené), **nič sa nepripína a nič nie je riadené skrolovaním** (zrušené lepiace prvky, pruh postupu, parallax,
  odchod úvodu), pri „obmedziť pohyb“ a bez JS je všetko statické a viditeľné, v náhľade claude.ai nič nezlyhá.
- Plynulosť na telefóne pri 4× spomalenom CPU je lepšia ako predtým (v žiadnom z 5 párov meraní viac zaseknutých
  snímok nad 50 ms, spolu 29 → 5; vrstvy kompozítora 31 → 17); celá stránka sa stiahne za 1,5 MB namiesto 2,0 MB (počítač 3,3 → 1,3 MB).
- Overenie na `c6c01d0`: 99 testov OK, testy v prehliadači a vzhľadu pri 360–1920 px bez chyby, fotky pri 6 šírkach
  načítané, lightbox 11/11, čistá zostava z klonu (podrobne v `IMPLEMENTACIA-POZNAMKY.md`).

## 3. Postup pri odovzdaní (v tomto poradí)

1. **Nahrať vetvu `main` do Lupa-gym** (zo zálohy, časť 6) a hneď potom v Lupa-gym otvoriť
   **Settings → Pages**: Source = „Deploy from a branch“, vetva **gh-pages**, priečinok **/ (root)**.
   Bez toho sa web po nahratí nezobrazí (v `main` už nie je hotový `index.html`, generuje sa).
2. **Settings → Actions → General**: Actions povolené; ak by nasadenie padalo na `git push`, prepnúť
   „Workflow permissions“ na „Read and write permissions“.
3. **Vetva `main` nesmie vyžadovať pull request ani podpis commitov** (CMS zapisuje priamo do `main`).
4. **Pages CMS**: <https://app.pagescms.org> → „Sign in with GitHub“ (účet d8f5s88zjy-art) → inštalácia
   aplikácie → „Only select repositories“ → **len Lupa-gym** (nie všetky, aplikácia má široké oprávnenia).
5. **Pozvať Ondreja**: v Pages CMS v projekte Lupa-gym → Collaborators → Invite → jeho e-mail.
   Príde mu e-mail „… invited you to "d8f5s88zjy-art/Lupa-gym"“ s tlačidlom „Join …“. **Pozvánka platí 24 hodín.**
6. Poslať Ondrejovi `NAVOD-PRE-ONDREJA.md` (napr. ako PDF).
7. Redizajn nasadiť až po dokončení (časť 4) a v čase, keď Ondrej v CMS needituje (mení sa štruktúra polí;
   postup je v `NASTAVENIE-CMS.md`, časť 3a vo vetve `redizajn-2026-10`).

## 4. Čo zostáva na redizajne

| Krok | Čo | Stav |
| --- | --- | --- |
| Kontrola B4 | nezávislá kontrola pohybového systému a opravy | hotové (`809bc02`); oba otvorené body (Späť po skoku z menu, biela plocha mapy) opravené vo vetve `filmova-vrstva` (`c6aa7e7`) |
| B5 | výkon a prístupnosť (SPEC kap. 9 a 10), Lighthouse, klávesnica | nezačaté |
| Filmová vrstva | požiadavka majiteľa: „filmové prechody, kurzor činka, cinematické efekty, profesionálne, skontrolovať fotky“ | **implementované** vo vetve `filmova-vrstva` (`dcd8414`, `c6aa7e7`, `07eca7a`, `afe892b`, `c8de97f`), nezávislé kontroly KF a KP hotové, ich stredné nálezy opravené v `36d8066` (skok z mobilného menu bez prekrytia menu s cieľom, pomalé odďaľovanie len širokej plochy – menej vrstiev, Tab neodíde pod otvorené menu, rozvrh Home/End); čaká na nový náhľad pre majiteľa a zlúčenie do `redizajn-2026-10`. Otvorené: lightbox ako „premietanie“ (FIL-07, voliteľné), prah vrstiev počas prechodov, ručné overenie kurzora a prechodov na iPhone (Safari 18 a 26) a Androide |
| Profesionálny vzhľad | želanie majiteľa z 3. 11. (menej dokument, viac profesionálna stránka) | **implementované a overené** vo vetve `profesionalny-vzhlad` (`b0a3273` až `c6c01d0`), čaká na náhľad pre majiteľa a jeho rozhodnutia v časti 5 (body 7–11); nahrádza štruktúru z B2–B4 a zredukuje filmovú vrstvu |
| B6 | záverečná kontrola, snímky 390–1920 px, návody, zoznam pre majiteľa | nezačaté |

**Filmová vrstva, materiál a pravidlá:** použité sú len súbory v repozitári – skutočné fotky (`assets/img/f`, tím)
a tri existujúce videá (zápasenie, MDS, Ladydefence). Pôvodné videoklipy z 26. 9. 2026 (`IMG_8981` až `IMG_8998`)
v zálohe nie sú, preto filmovosť nesie pohyb kamery a strih nad fotkami, nie nové video. Pravidlá: len skutočné zábery
(žiadne AI, nič generované ani vymyslené), žiadne video ani efekt riadený skrolovaním po snímkach (klient ho odmietol
ako zasekané), žiadne pripínanie obsahu, plynulosť na bežnom telefóne, pri „obmedziť pohyb“ a bez JS všetko statické
a viditeľné.

**Známe otvorené body z kontrol:** plynulosť: prah sa meria na snímkach kompozítora pri 4× spomalenom CPU a na hlavnom
vlákne pri bežnom CPU (zmena zapísaná v SPEC 9); rozpočet `app.js` 14 kB gzip je takmer vyčerpaný (rezerva 111 B po `36d8066`); mapa: keď Google odpovie, ale vloženie mapy zablokuje blokovač alebo firemný filter, ostane biela plocha mapy (adresa a „Navigovať“ sú hneď nad ňou; úplná náprava = mapa len na klik);
vrstvy kompozítora počas prechodov („najviac počas scény“) sú nad 40 už pred filmovou vrstvou – navrhnutý prah
„špička ≤ stav pred + 10“ potvrdí orchestrátor; pár záberov (plagáty videí, `mma-1-32`) je na telefóne pod 1× DPR,
bez nových záberov sa to zlepšiť nedá;
úvod na telefóne pri výške okna 781–880 px ukazuje málo fitka; fotka `volne-vahy-2` je na webe dvakrát;
treba ručne overiť na skutočnom iPhone a Androide.

**Po Profesionálnom vzhľade (4. 11.):** lepiace prvky, pruh postupu, parallax a odchod úvodu sú zrušené; každá fotka je
na webe raz (aj `volne-vahy-2`); úvod na telefóne je nižší a prvý rad dlaždíc je v prvej obrazovke; mapa sa načíta
len po kliknutí (bod o bielej ploche mapy tým odpadá); `app.js` má 12 995 B gzip (rezerva 705 B do 13 700 B).
Otvorené: text je na telefóne hustejší, než chcel plán (medián slov na obrazovku nad 58), a prenos prvej obrazovky
bez kompresie je 765 kB (s gzipom na GitHub Pages asi 590 kB) – podrobne v `IMPLEMENTACIA-POZNAMKY.md`.

## 5. Rozhodnutia pre majiteľa fitka

1. **Logo v hlavičke**: ponechané plnofarebné logo z kartičky na bielej kartičke (tak si to chcel).
   Biela verzia loga je pripravená, ale nepoužitá.
2. **Nadpis úvodu**: ostáva „Stačí prísť. Vstup 6 €.“ Dá sa zmeniť v CMS.
3. **Fotky Panda Fight Club** (z gymklub.sk): platí ešte súhlas klubu? Na jednej je čitateľný banner ProFighters.eu.
4. **Text medzihry „Funkčná zóna“** spomína vzduchový bicykel, ktorý na fotke nie je: skrátiť text v CMS, alebo dofotiť.
   *(V Profesionálnom vzhľade medzihra nie je; karta „Funkčná zóna“ má text „Kettlebelly a šprintérska dráha. Kruhový
   tréning sami alebo s trénerom.“ bez bicykla.)*
5. **Fotky funkčnej zóny s nápismi susedných firiem v oknách** (SATELITNÁ TECHNIKA, ANTIK, namiSAT) sa nepoužívajú;
   kým sa nedofotí, medzihra používa fotku rigu pri oknách.
6. **Dofotiť** (bez toho nebude dojem naplno prémiový): recepcia a pult; šatne a sprchy; ľudia pri tréningu
   so súhlasom (hlavná sála, funkčná zóna pod LED, lekcia na tatami); vlastné zábery sály Panda; široké zábery
   na šírku zo statívu vo výške asi 1,3 m; originály fotiek baru s vypnutým televízorom. Pred fotením upratať
   popolníky, bundy na rigoch a ľudí v zrkadlách.

Po Profesionálnom vzhľade (vetva `profesionalny-vzhlad`, predvolené voľby sú už v nej):

7. **Hustota textu na telefóne:** stránka je kratšia (15,6 obrazovky), ale text je hustejší, ako chcel plán (medián
   slov na obrazovku nad 58). Ak má pôsobiť ešte vzdušnejšie, treba ubrať asi pätinu textu (popisy lekcií, poznámka
   v cenníku, texty kariet) – v CMS, bez vývojára. Alebo ostať pri dnešnom stave.
8. **Fotka karty mapy:** `hlavna-sala-5` (plán chcel `hlavna-sala-3`, tá je v galérii a každá fotka má byť na webe raz).
9. **Červený pás pred pätičkou** je bez fotky (len farba, slogan a dve tlačidlá).
10. **Odsek úvodu** je skrátený na „Bez objednávania. Platíte na recepcii, MultiSport ukážete pri príchode.“ –
    hotovosť a karta sú v dlaždiciach a v cenníku. Dá sa zmeniť v CMS (najviac 20 slov).
11. **Nasadenie:** vetva `profesionalny-vzhlad` mení štruktúru polí CMS (nové položky „Úvod a ponuka“, „Nadpisy častí“,
    „Texty rozhrania“, karty cenníka, galéria). Nasadiť až po náhľade a súhlase majiteľa a keď Ondrej needituje;
    návod pre Ondreja v repozitári (`NAVOD-PRE-ONDREJA.md` vo vetve) je aktualizovaný.

## 6. Obnova zo zálohy

Záloha obsahuje celú históriu práce nad commitom `4fb1416` (dnešný `main` v Lupa-gym), obe vetvy.

```bash
git clone https://github.com/d8f5s88zjy-art/Lupa-gym.git && cd Lupa-gym
git bundle verify ../lupa-gym-zaloha.bundle
git fetch ../lupa-gym-zaloha.bundle main:zaloha-main redizajn-2026-10:redizajn-2026-10
git log --oneline zaloha-main -3          # posledný má byť 396f446
git push origin zaloha-main:main          # NAHRATIE hotových zmien (len keď si pripravený, časť 3)
```

Filmová vrstva (prírastková záloha, potrebuje `809bc02` z vetvy `redizajn-2026-10` vyššie):

```bash
git bundle verify ../lupa-gym-filmova-vrstva.bundle
git fetch ../lupa-gym-filmova-vrstva.bundle filmova-vrstva:filmova-vrstva
git log --oneline filmova-vrstva -1       # má byť 36d8066
```

Profesionálny vzhľad (prírastková záloha, potrebuje `36d8066` z vetvy `filmova-vrstva` vyššie):

```bash
git bundle verify ../lupa-gym-profesionalny-vzhlad.bundle
git fetch ../lupa-gym-profesionalny-vzhlad.bundle profesionalny-vzhlad:profesionalny-vzhlad
git log --oneline profesionalny-vzhlad -1 # má byť c6c01d0
```

Zostavenie a testy (Python 3 + `pip install -r nastroje/requirements.txt`):

```bash
python3 nastroje/zostav.py                                    # web do _site/
python3 -m unittest discover -s nastroje -p 'test_*.py'       # testy
```

## 7. Časté otázky pri odovzdaní

- **Koľko to stojí?** Pages CMS aj GitHub Pages sú zadarmo.
- **Čo Ondrej zmení sám?** Hodiny, trénerov, rozvrh, ceny, recenzie, otázky, fotky a oznam. Videá a logo nie
  (to cez vývojára). Fotky do asi 3 MB; pred fotením vypnúť polohu v mobile (repozitár je verejný).
- **Čo nevie web zobraziť?** Celý deň zatvorené a otvorenie cez polnoc; na výnimky slúži oznam.
- **Web sa po uložení nezmenil?** Pozrieť `stav.html` (obnoviť stránku, môže byť až 10 minút v cache).
- **Kto uvidí, kto čo zmenil?** E-mail toho, kto ukladá v CMS, je v histórii verejného repozitára.
- **Ako zrušiť Ondrejovi prístup?** Pages CMS → Collaborators → odobrať (`NASTAVENIE-CMS.md`, časť 4).

## 8. Bezpečnosť

- Heslá, prihlasovacie údaje k FTP, Booqme ani iné tajné údaje nikdy nepísať do chatu ani do repozitára.
- Pages CMS inštalovať len na repozitár Lupa-gym.
- Repozitár Lupa-gym je verejný: žiadne osobné údaje klientov.

## 9. Ostatné projekty (zastavené na žiadosť majiteľa, 15. 10. 2026)

- **Vernostná kartička 30** (Barbershop 30 a HEAD SPA 30): kód je v `main` repozitára head-spa-30; na zapnutie
  chýbajú GitHub secrets `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR`, `VERNOST_HESLO_BARBERSHOP`,
  `VERNOST_HESLO_HEADSPA`, `VERNOST_EMAIL_OD` a obchodné meno a IČO HEAD SPA 30.
- **Visionary Living**: čaká na pokyn „pokračuj“.
- **gstack** (TikTok od martin.gocik, sada rolí pre Claude Code od Garryho Tana, licencia MIT): rozbor zastavený,
  do toolboxu sa nič nezapísalo.
- **Reel GYM KLUB**: verzia v1 vznikla, nezverejnená.
