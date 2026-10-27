# Zdroje obchodných údajov – BARBERSHOP 30

Každý údaj na webe má tu zapísaný zdroj, dátum získania a stupeň overenia.
Stupne: **overené‑oficiálne** (web podniku alebo jeho rezervačný systém),
**tretia strana** (katalógy, recenzné weby), **slabé** (jediná neoficiálna zmienka),
**neoverené** (tvrdenie majiteľa alebo odhad – na web ide až po potvrdení).
Dátum získania všetkých údajov: **2026‑10‑09**, pokiaľ nie je uvedené inak.

## Identita a kontakt (overené‑oficiálne, https://www.barbershop30.sk/)

| údaj | hodnota | poznámka |
|---|---|---|
| názov | Barbershop30 (web, logo „30 Barbershop Holičstvo“) | Facebook stránka „Barbershop 30“; na webe používame „Barbershop 30“ ako značku a „Barbershop30“ v právnych údajoch |
| adresa | Mostná 30, 949 01 Nitra | fasáda na fotkách z aktuálneho webu potvrdzuje susedstvo so Salónom 30 (spoločná budova) |
| telefón | 0951 267 203 (+421 951 267 203) | `tel:+421951267203` |
| e‑mail | info@barbershop30.sk | |
| otváracie hodiny | Po–Pi 09:00–19:00, So 09:00–14:00, Ne zatvorené | |
| rezervácia | https://www.barbershop30.sk/rezervacia | vlastný rezervačný systém podniku (Vue komponent, endpoint /rezervacia/ajax); nie Bookio. Nový web naň odkazuje, neembeduje ho. Predvoľba služby/barbera cez URL nie je zdokumentovaná → neprenáša sa. |
| farbenie, melír, trvalá | https://booqme.app/sk/rezervacia/barbershop30 | samostatná Booqme stránka (pracovníčka Romana); na novom webe len ako odkaz v sekcii služieb |
| založenie | 2019 („Sme tu pre vás už od roku 2019“) | na webe len ako „na Mostnej 30 od roku 2019“ (viazané na adresu); recepcia „8 rokov“ pozri nižšie |
| kapacita | 8 kresiel, recepčná, káva a minerálka zdarma, online rezervácie 24/7, strihanie detí | prevzaté z „Prečo práve my?“ na aktuálnom webe |
| kde sa podáva káva | vzadu, kde ľudia čakajú (čakáreň s kreslami a pumpou Route 66), nie pri recepcii | majiteľ 2026‑10‑11; na webe v karte Čakáreň |
| Instagram | https://www.instagram.com/barbershop30_nitra/ | |
| Facebook | https://www.facebook.com/barbershop30nitra/ | |
| TikTok | nenájdený | |
| prevádzkovateľ | FACEPALM, s.r.o., IČO 52231381, DIČ 2120952218 | ORSR https://www.orsr.sk/vypis.asp?ID=554260&SID=9&P=0 (zápis 05.03.2019) – ide do pätičky ako právne údaje |
| analytika na starom webe | GTM-K8PZD4KR, GA4 G-D9FMT63FQC | nový web žiadnu analytiku nezapája, kým majiteľ nepotvrdí súhlasovú lištu |

## Tím (overené‑oficiálne, https://www.barbershop30.sk/#nas-team)

Krstné mená a roly presne podľa aktuálneho webu; portréty prevzaté z toho istého
webu (`source/team/`). Priezviská ani špecializácie web neuvádza – nevymýšľame.

| portrét (súbor na starom webe) | meno | rola |
|---|---|---|
| team/47.png | Nikolas | Barber |
| team/50.png | Kristián | Barber |
| team/49.png | Damian | Barber |
| team/40.png | Michal | Barber |
| team/48.png | Andy | Barber |
| team/41.png | Dominika | Barberka |
| team/38.png | Kevin | Barber |
| team/18.png | Lajko | Barber |
| team/2.png | Jojo | Barber |
| team/42.png | Adrian | Barber |

Popisy pod menami (od 2026‑10‑11) sú na želanie majiteľa krátke pochvalné vety o remesle a prístupe,
nie fakty o osobe: žiadne roky praxe, špecializácie ani ocenenia. Ak majiteľ pošle skutočné údaje
o jednotlivých barberoch, popisy sa môžu prispôsobiť.

Romana (farbenie/melír/trvalá) je uvedená len na Booqme – na webe ju spomenieme
iba v odkaze na Booqme, bez portrétu.

## Služby a ceny (overené‑oficiálne, JSON rezervačného systému na https://www.barbershop30.sk/rezervacia, 2026‑10‑09)

| id | služba | cena | trvanie | opis zo systému |
|---|---|---|---|---|
| 1 | Pánsky strih | 18 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej |
| 18 | Pánsky strih a Úprava brady | 28 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej.Úprava brady, naparenie horúcim ručníkom, britva, záverečný styling s prípravkami. |
| 5 | Strih pre malých gentlemenov | 15 € | None min | Klasický strih, Fade, prípadne kreatívne ornamenty vo vlasoch, umytie vlasov, záverečný styling - do 10 rokov |
| 3 | Úprava brady | 15 € | None min | Úprava brady, naparenie horúcim ručníkom, britva, záverečný styling s prípravkami |
| 19 | Pánsky strih - dĺžka vlasov nad 10cm | 22 € | None min | Strihanie vlasov rôznymi technikami tzv.fade. Konzultácia, strihanie strojčekom/nožnicami, umytie vlasov, fénovanie, záverečný styling a aplikácia kolínskej |
| 14 | Balíček 1 | 30 € | None min | Konzultácia, strihanie strojčekom/nožnicami, úprava brady, Hot Towel, úprava obočia, depilácia uší, umytie vlasov, vlasový tonic, fénovanie, záverečný styling a aplikácia kolínskej |
| 15 | Ultra inclusive Barbershop30 | 40 € | None min | Konzultácia, strihanie strojčekom/nožnicami, úprava brady, Hot Towel, umytie vlasov, vlasový tonic, depilácia uší, úprava obočia, naparenie tváre, peeling, relaxačná maska podľa vlastného výberu, fénovanie, pohárik whisky, záverečný styling a aplikácia kolínskej |
| 6 | Starostlivosť o pleť PREMIUM | 21.5 € | None min | Naparenie tváre, peeling, relaxačná maska podľa vlastného výberu |
| 4 | Holenie do hladka Hot Towel | 15 € | None min | Holenie britvou, naparenie horúcim ručníkom, ošetrenie pleti po holení |
| 2 | Oholenie hlavy | 13 € | None min | Príprava pokožky hlavy na holenie britvou, umývanie a sušenie, záverečný styling |
| 7 | Úprava obočia | 3 € | None min | Vytrhanie a úprava obočia |
| 8 | Depilácia uši a nosa voskom | 5.5 € | None min | Depilácia uší |
| 10 | Kreatívny ornament na hlave | 4 € | None min | . |
| 11 | Farbenie brady | 10 € | None min | Farbenie brady profesionálnymi farbami - 20 ml farby |
| 12 | Farbenie obočia | 5 € | None min | Farbenie obočia profesionálnymi farbami |

Ceny sú konečné (bez „od“). Booqme služby (farbenie 40–80 €, trvalá 45–60 €,
tónovanie 35–40 €, melír 45 €) ostávajú len ako odkaz – ich ceny sa na novom webe
nezobrazujú, aby neboli dva cenníky na jednom mieste.

## Dôkazy a ocenenia (tretia strana – na webe iba s odkazom na zdroj)

- Google hodnotenie: agregované cez Zlatá Firma (5,0 z 792 recenzií Google Maps)
  a QuickBook (5/5 z 813) – priamo z Google Maps nečitateľné. Na webe: „Hodnotenie
  na Google“ ako odkaz na profil, **bez čísla v schéme** a bez vymyslených citácií.
  Zdroj: https://www.zlatafirma.eu/company/barbershop-30-227214
- Zlatá Firma: „Víťaz ocenenia“, odznaky 2022–2026 (vrátane 2024). Orly kaderníctva:
  laureát 2022, 2023, 2025, 2026. Obe sú komerčné ratingy z recenzií. Plaketu „2024“
  v prevádzke nevieme jednoznačne priradiť – **spýtať sa majiteľa** pred použitím.
- Školenia: barberkurzy.sk („Profesionálne barber kurzy, Est'd 2018“) sídli na
  Mostnej 30, iný telefón (0951 207 055); prepojenie so značkou Barbershop 30 je
  **slabé/neoverené** – na webe len ako samostatný odkaz „Školenia“, ak ho majiteľ potvrdí.

## Médiá

- 45 fotiek od majiteľa (`source/photos/`), všetky na výšku; inventár v `source/audit.json`.
- Z aktuálneho webu prevzaté (`source/team/`, `source/gallery/`, `source/slider/`,
  `source/logo.png`): 10 portrétov, 17 profesionálnych fotiek na šírku (4096×2731),
  3 slider zábery (1920×1200), logo 100×100 px. Práva: fotky zverejnil podnik na
  vlastnom webe; **potvrdiť u majiteľa**, že ich môžeme použiť na novom webe
  (najmä portréty – súhlas zamestnancov).
- Vektorové logo nemáme – na webe je značka sadzaná písmom; logo PNG slúži len
  ako favicon/ikonka. **Vyžiadať vektor od majiteľa.**

## Čo ostáva neoverené (`data-required` v kóde)

- „Recepcia funguje 8 rokov“ – nesúlad s rokom 2019 na webe.
- Plaketa 2024 v prevádzke.
- Školenia pod značkou Barbershop 30.
- Vzťah so Salónom 30 (spoločná budova; žiadny web nespomína druhý).
- Vernostná karta – žiadny zdroj; na webe sa nezobrazuje.
- Výsledky strihov (pred/po) – žiadne fotky; galéria zatiaľ ukazuje priestor a remeslo.

## Videá od majiteľa (2026‑10‑09)

Tri telefónne videá z prevádzky (barberi pri práci). Vidno zamestnancov spredu a
klientov zozadu. Na webe len ako tiché slučky; **pred zverejnením potvrdiť súhlas
zamestnancov a to, že klienti nie sú rozpoznateľní** (v `remeslo-strojcek` a
`tim-v-akcii` sú klienti zozadu alebo z profilu v diaľke).

## Texty na želanie majiteľa (Lajko, 2026‑10‑13, odovzdané cez správcu webu)

Stupeň: **tvrdenie majiteľa** – ide na web, lebo ho majiteľ výslovne chce; nie je overené z iného zdroja.

| text na webe | kde | doslovné zadanie | poznámka |
|---|---|---|---|
| Lokálny barber na Mostnej 30, kde stretneš hocikoho. | podtitul úvodu | „Lokálny Barber kde stretneš hoci koho“ | nahradil „Za dverami na Mostnej 30 sa strihá od roku 2019.“ |
| Pri dverách ťa privíta recepčná. Ako jediný barbershop v Nitre ju máme už 8 rokov. | karta „Poď ďalej“ | „Máme ako jediný v Nitre 8 rokov recepčnú“ | recepcia je v prednej sále pri vchode (ART_DIRECTION); „8 rokov“ = od 2018, kým „na Mostnej 30 od roku 2019“ – možné, ak podnik začínal inde; **potvrdiť u majiteľa** |
| Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek. | karta tímu | „pod značkou Barber shop 30 pracuje tím barberov a barberiek“ | nahradil „Desať ľudí, jeden kalendár.“ |
| Školenia – na poschodí, pod značkou Barbershop 30 | zoznam faktov pri kontakte | „hore sú školenia pod značkou Barbershop 30“ | „hore“ chápeme ako poschodie v tej istej budove; **potvrdiť u majiteľa** |
| Recepcia – ako jediný barbershop v Nitre, už 8 rokov | zoznam faktov pri kontakte | ako vyššie | |
| Zavolaj na recepciu, v pracovné dni od 9:00 do 19:00. Alebo si termín sprav online, jednoducho cez náš rezervačný systém. | karta rezervácie | „Recepcia zavolaj si počas dňa od 9 do 19 alebo sprav online termín jednoducho cez náš rezervačný systém“ | „v pracovné dni“ doplnené podľa otváracích hodín (So 9:00–14:00) |

Ďalšie želania z toho istého zadania, ktoré zatiaľ **nie sú na webe**:
- „nejaké slová s recenziami“ – **na webe od 13. 10. 2026**, pozri časť Recenzie nižšie.
- vernostná karta prepojená na admin s hromadnými správami – **postavená** (`vernost/`, návod `vernost/README.md`).

## Recenzie (doslovné citácie, overené 13. 10. 2026)

Zdroj: Google Maps, profil „Barbershop30 Nitra“, https://www.google.com/maps?cid=18132360254733427623
(5,0 z 945 recenzií; rozdelenie 928× 5★, 11× 4★, 1× 3★, 1× 2★, 4× 1★). Ďalšie verejné zdroje: Facebook (28 odporúčaní, 100 %),
Zľavomat (4,9 zo 14), Zlatá Firma a QuickBook (preberajú Google). Každú citáciu druhý nezávislý kontrolór znova otvoril
na Google a porovnal znak po znaku. Text sa neopravuje (ani preklepy); „…“ označuje vynechanú časť dlhšej recenzie.
Mená sú skrátené na meno a iniciálu priezviska. Na webe sú v `assets/recenzie.js` (samostatný modul, HTML ostáva v prvom okne TCP).

| Na webe | Hodnotenie, vek na Google k 13. 10. 2026 | Poznámka |
|---|---|---|
| Marek J. | 5★, pred 2 mesiacmi | celá recenzia |
| Kristián V. | 5★, pred 11 mesiacmi | celá recenzia |
| Stanislava B. | 5★, pred 10 mesiacmi | celá recenzia |
| Marcel W. | 5★, pred 4 mesiacmi | úryvok z anglickej recenzie (dve celé vety, medzi nimi „…“) |
| Jana U. | 5★, pred mesiacom | celá recenzia |
| Ladislav T. | 5★, pred rokom | celá recenzia |

Nepoužité zámerne: recenzie, ktoré zhadzujú iné podniky, a texty s menom tretej osoby celým priezviskom.
Hodnotenie na Google ostáva aj ako odkaz (teraz priamo na profil, nie na vyhľadávanie).

## Úvod: hodnotenie a cena (2026‑10‑21)

- „5,0 na Google · 945 recenzií“ v úvode: profil Barbershop30 Nitra na Google Maps, overené priamo na zdroji 13. 10. 2026
  (časť Recenzie vyššie); odkaz vedie na profil. Počet recenzií rastie, pri ďalšej kontrole ho aktualizuj
  (index.html, `.hero-proof`, a kľúč v `assets/i18n/*.json`). Do štruktúrovaných údajov (JSON‑LD) sa nepíše.
- „Pánsky strih 18 €“: cenník rezervačného systému (časť Služby a ceny).
- „…v pracovné dni od 9:00 do 19:00 telefón vždy zdvihneme“: hodiny recepcie z webu, veta je ubezpečenie zadávateľa
  (2026‑10‑21); nesľubuje telefón mimo týchto hodín.

## Vizitka, kontakt na uloženie a objednávkové okno (2026‑10‑21)

- Vizitka (`assets/karty.js`): tá, ktorú prevádzka rozdáva na recepcii (fotka `source/photos/foto-17.jpg`), nie nový
  návrh. Logo z vektora starého webu (`source/web-povodny/logo-vector-black.svg`). Text len z riadkov čitateľných na
  fotke a zhodných s časťou Identita a kontakt: 0951 267 203, info@barbershop30.sk, Mostná 30, 949 01 Nitra,
  www.barbershop30.sk. Riadok pod adresou (asi sociálna sieť) sa z fotky prečítať nedá, preto chýba; s fotkou alebo
  tlačovým súborom vizitky od prevádzky sa doplní presne. `assets/barbershop30.vcf` z overených údajov.
- Vernostná kartička na webe: texty z prihlášky (`assets/vernost.js`); odmeny ani počty bodov sa neuvádzajú, určuje ich
  majiteľ v administrácii.
- Objednávkové okno: služby, časy a ceny z cenníka na stránke, id služieb z rezervačného systému (rovnaké ako
  `SLUZBY` v `asistent/lib/kalendar.php`), barberi a voľné časy priamo z rezervačného systému pri otvorení okna.
  Predvoľba služby a barbera v rezervačnom systéme cez adresu nie je zdokumentovaná, preto Dokončiť otvorí jeho formulár
  bez nej.


## Texty tímu, časté otázky a prevádzky v pätičke (2026‑10‑27)

Zadanie majiteľa z 27. 10. 2026: údernejšie texty pri barberoch, recepcia v častých otázkach, odkazy na prevádzky.
Pravidlo: žiadny nový fakt; každá veta stavia len na textoch, ktoré už na webe sú, alebo na živých weboch prevádzok.
Riadky barberov ostávajú dojem a prístup, nie fakty o osobe (žiadne roky praxe, špecializácie, ocenenia).
Garancia na webe nie je, kým ju majiteľ nepotvrdí (`dennik/.../OTAZKY-PRE-MAJITELA.md`, otázka 25).

| text na webe | kde | opora | stupeň |
|---|---|---|---|
| Úvod tímu „Tím barberov a barberiek pod jednou značkou. … strih, ktorý vyzerá dobre aj o týždeň. Ty povieš, ako to chceš. Zvyšok je remeslo.“ | tím, `.lead` | karta tímu „Pod značkou Barbershop 30 tu pracuje tím barberov a barberiek.“ (želanie majiteľa 13. 10.), krok Konzultácia v cenníku, „Výsledok ťa poteší aj o týždeň.“ (pôvodný riadok Kevina), scéna „Povedz, ako to chceš.“ | zostavené z webu |
| Riadky pri desiatich barberoch | tím, `.team-bio` (aj `rezervacia.html`, odpovede asistenta `tim-*`) | zostrené pôvodné riadky z 11. 10.; bez faktov o osobe | dojem a prístup |
| Pilier Skúsenosti „Striháme na Mostnej 30 od roku 2019. Hodnotenie 5,0 na Google sa za týždeň nastrihať nedá. Nič naslepo.“ | tím, `.team-pillars` | „Na Mostnej 30 striháme od roku 2019.“ (karta Dôvera), „5,0 na Google“ (úvod, časť Úvod: hodnotenie a cena); počet recenzií sa v pilieri neuvádza, lebo starne | overené‑oficiálne + tretia strana (Google) |
| Pilier Precíznosť „Konzultácia pred prvým ťahom strojčeka, britva pri brade, styling a kolínska na záver: nič sa tu nerobí od oka.“ | tím | „Pánsky strih krok za krokom“ (konzultácia, strojček a nožnice, horúci uterák a britva, styling a kolínska) | overené‑oficiálne (cenník) |
| Pilier Pohodlie „Pri dverách recepčná, v čakárni káva a minerálka zdarma. Ty si len sadneš.“ | tím | karty „Poď ďalej“ (recepčná pri dverách) a „Čakáreň“ (káva aj minerálka zdarma) | overené‑oficiálne |
| „Mám volať barberovi alebo recepcii?“ – „Vždy recepcii: 0951 267 203, … Recepčná sa stará o tvoj termín a pohodlie, barber o tvoj výsledok. … Recepcia ti termín nájde, zmenu či zrušenie jej daj vedieť čo najskôr.“ | časté otázky (2. položka) | telefón a hodiny recepcie (karta Rezervácia), rozdelenie recepčná/barber = zadanie majiteľa 27. 10., „Daj nám vedieť čo najskôr“ (otázka „Čo ak nestihnem prísť?“); lehoty a poplatky za storno (otázka 3) sa neuvádzajú | tvrdenie majiteľa + web |
| „Čo ma čaká, keď prídem?“ – recepčná pri dverách, káva alebo minerálka vzadu, konzultácia, strojček, nožnice, fade, horúci uterák a britva, styling a kolínska | časté otázky (9. položka) | karty „Poď ďalej“, „Čakáreň“, „Remeslo“, „Cestou von“, cenník | overené‑oficiálne |
| Pätička „Naše prevádzky“: HEAD SPA 30 → https://www.headspa30.sk/ „Head Spa rituály pre relax a regeneráciu vlasov.“ | pätička | web HEAD SPA 30 v tomto repozitári (meta description koreňového `index.html`), živá doména (curl 27. 10.: 200, `headspa30.sk` presmeruje na `www`; `tools/ftp-balik.sh` prepisuje kanonickú adresu na doménu) | overené‑oficiálne |
| Salón 30 → https://www.salon30.sk/ „Kaderníctvo a wellness pre vlasy: strihy, farbenie a koloristika, trichologické vyšetrenie.“ | pätička | www.salon30.sk (curl 27. 10.: 200; na stránke „Wellness pre vaše vlasy“, „Strih“, „koloristika“, „Trichologické vyšetrenie vlasov“, Mostná 30) | overené‑oficiálne (web salónu) |
| Barbershop 30 → `#uvod` (aktuálna prevádzka, `aria-current="page"`) „Pánske strihy, brada a holenie britvou. Si tu.“ | pätička | pätička webu a cenník (holenie britvou); po spustení na www.barbershop30.sk sa prepne na doménu (otázka 21) | overené‑oficiálne |

Nadpis „Naše prevádzky“ sú slová majiteľa z 27. 10.; prevádzkovateľ FACEPALM, s.r.o., IČO 52231381 je uvedený na
barbershop30.sk aj salon30.sk a HEAD SPA 30 sídli v priestoroch Salónu 30. Doterajšie pravidlo „Vzťah so Salónom 30 … žiadny
web nespomína druhý“ (časť Čo ostáva neoverené) tým majiteľ zmenil; potvrdenie nadpisu je otázka 26. Telefóny iných
prevádzok sa neuvádzajú. Dôkazy adries (`curl -sS -o /dev/null -L -w '%{http_code} final=%{url_effective}'`, 27. 10. 2026):
https://www.headspa30.sk/ → 200 (final www), https://headspa30.sk/ → 200 (final https://www.headspa30.sk/),
https://d8f5s88zjy-art.github.io/head-spa-30/ → 200, https://www.salon30.sk/ → 200, https://salon30.sk/ → 200 (final www),
https://d8f5s88zjy-art.github.io/head-spa-30/barbershop-30/ → 200, https://www.barbershop30.sk/ → 200 (starý web).
