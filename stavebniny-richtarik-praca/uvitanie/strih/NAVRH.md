# Uvítanie „Strih“ (smer C): rýchly strih zásob pred úvodom – Stavebniny Richtárik (5. 11. 2026)

Rola: senior motion a web dizajn. Prototyp je urobený len v kópii `/dev/shm/uvitanie-strih/stavebniny-richtarik`, ktorá vznikla
príkazom `git archive richtarik-profi` na commite **ff5e8685f3496858606489e67abb80482eb67301**. Do `hs-richtarik-obnova` som nič
nezapisoval. Kód je vlastný, tvoria ho CSS a WAAPI. Nepoužil som knižnicu, CDN ani žiadny nový obrázok či video. Cesty nižšie sú
relatívne k tomuto priečinku (`uvitanie/strih/`).

| Čo | Kde |
|---|---|
| zmenené súbory | `prototyp/index.html`, `prototyp/assets/site.js` |
| diff voči kópii (261 riadkov) | `prototyp/uvitanie.diff` |
| zdroj uvítania | `prototyp/uw.css` (6,4 kB, gzip 2,4 kB), `prototyp/uw.js` (10,2 kB, gzip 4,0 kB, z toho veľa komentárov) |
| skladanie | `python3 -I prototyp/zloz.py <kópia> <cieľ> prototyp/` (vloží CSS, skript v `<head>` a skript za úvod) |
| merania | `mer/*.jsonl`, súhrn `mer/suhrn.txt`, funkčné kontroly `mer/kontroly.json` |
| hárky (všetky som otvoril) | `harky/harok-telefon.jpg`, `harky/harok-pocitac.jpg`, `harky/harok-dnes-telefon.jpg`, `harky/h-preskoc-tuk.jpg`, `harky/h-sirky.jpg`, `harky/video-harok-telefon.jpg` |
| videá | `video/uvitanie-telefon.mp4` (4,3 s, 321 kB) a `.webm`, `video/uvitanie-pocitac.mp4` (3,7 s, 606 kB) a `.webm` |
| snímky stavov | `snimky/bez-js.png`, `obmedzit-pohyb-250ms.png`, `iframe-sandbox.png`, `iframe-same-origin.png`, `znova-400ms.png` |
| nástroje | `nastroje/` (`mer.mjs`, `ab.sh`, `suhrn.py`, `harok.py`, `jas.py`, `kontroly.mjs`, `iframe-ab.mjs`, `video.mjs`, `sirky.mjs`, `znova.mjs`) |

**Prototyp spustíte takto:** rozbaľte kópiu (`git archive … | tar -x`), prepíšte ju dvoma súbormi z `prototyp/` a spustite
`python3 -I -m http.server <port> --bind 127.0.0.1 --directory <kópia>`. Uvítanie sa ukáže len pri prvej návšteve v relácii,
preto ho znova uvidíte v novom súkromnom okne alebo cez tlačidlo „Prehrať úvod“.

---

## 1. Hook: tri znenia a výber

Strihy nesú štyri slová a hook je nadpis, do ktorého strihy vyústia. Všetky znenia som overil voči FAKTY.md a STYL.md.

| # | Znenie | Pravdivosť a štýl | Sila |
|---|---|---|---|
| **H1 (vybrané)** | slová strihov **Tehly. · Pórobetón. · Dlažby. · Rezivo.** → **„Dvor plný materiálu. Od základov po strechu.“** | Slová opisujú štyri skutočné fotky zo zásob (FAKTY F: zasoba-tehly, -porfix, -stadreko, -rezivo). Hook je **doslova dnešné H1**: „dvor plný materiálu“ je v FAKTY F výslovne povolený a STYL §4 ho uvádza ako vzor H1. Nie je v ňom číslo ani superlatív a výkričník tiež nie. | Štyri slová sú zoznam, „Dvor plný materiálu“ je ich súčet a v tej istej chvíli ho dokladá celá fotka dvora. Hook sa premení na H1 bez výmeny textu, takže SEO aj čítačka ostávajú bez zmeny. |
| H2 | „Tehly. Pórobetón. Dlažby. Rezivo. Na jednom dvore v Nitre.“ | Pravdivé, lebo ide o tie isté štyri fotky. „Na jednom…“ je blízko obmedzenej frázy (STYL §8: „na jednom mieste“ najviac 1× na webe). | Zopakovalo by slová, ktoré divák práve videl. Ako H1 by vyšlo dlhšie ako 45 znakov (STYL §3). |
| H3 | „Materiál na celú stavbu. Na dvore v Nitre.“ | STYL P1 ho uvádza ako variant B. „Na celú stavbu“ je zovšeobecnenie z „predaj stavebného materiálu v celom sortimente“ (PW:27). | Slabší obraz, nemá súčet ako H1. |
| zamietnuté | „Všetko na stavbu na jednom dvore v Nitre.“ (návrh zo zadania) | **Nepravdivé:** nie všetko leží na dvore. Masonite má „určité druhy na objednávku“ a Chemolak „okamžite na požiadanie zabezpečíme“ (FAKTY F, I-09). | – |

Kontrola textov: v `uw.css`, `uw.js` a v skripte v `<head>` nie je slovo „AI“ ani výkričník. Hľadal som príkazom `grep -wn AI` a `grep -n '!'`
v textoch (výskyty `!` sú len JS operátory). Čísla „01 / 04“ sú poradie záberu, nie počet zásob. Dnešný úvod mal rovnaké
počítadlo (`.uv-tc`).

---

## 2. Scenár po desatinách sekundy

**Štart (t₀)** nastane, keď sú všetky štyri zábery dekódované a fotka dvora stiahnutá, najskôr 150 ms po navigácii. Ak to do
1 250 ms nestihnú, uvítanie sa **vynechá** a hneď sa ukáže obyčajný úvod (pozri §4). Namerané t₀: počítač 0,20 – 0,45 s,
telefón s CPU 4× bez obmedzenia siete 0,57 – 0,90 s, telefón na 4G 1,24 s (keď sa stihne).

| čas | Obraz (telefón / počítač) | Slovo v drážke 1. riadku H1 | Technika |
|---|---|---|---|
| 0 → t₀ | **Papier v ráme fotky**. Navrchu lišta s logom a telefónom, vpravo hore pri 390 px menu. Nad drážkou nadpisu sa kreslí linka eyebrow „Stavebniny Nitra – Horné Krškany“. Na telefóne je **dolná lišta Zavolať / Cenová ponuka viditeľná a funkčná celý čas**. | – | trieda `uw` zo skriptu v `<head>` pred prvým vykreslením |
| t₀ + 0,0 | **01 TEHLY**: na telefóne tvrdý strih vo výtlačku 4 : 5 vpravo v ráme (palety TermoBRIK), vľavo veľké tehlové „01 / 04“. Na počítači papierová stierka za 0,11 s odkryje 1. výtlačok zo štyroch. | **Tehly.** vyjde zdola za 0,12 s | WAAPI: pás 4 fotiek sa posúva skokmi (telefón), opona z papiera sa posúva (počítač) |
| 0,0 – 0,2 | telefón: záber sa „pritlačí“ (zväčšenie 1,12 → 1,02) | | `scale` na obale pásu |
| t₀ + 0,2 (210 ms) | **02 PÓROBETÓN** (modré palety Porfix, neupravená fotka) | Tehly. odíde hore, **Pórobetón.** príde zdola | počítadlo 01 → 02 sa posunie za 90 ms |
| t₀ + 0,4 (390 ms) | **03 DLAŽBY** (Stadreko) | **Dlažby.** | rytmus sa zrýchľuje: 210 / 180 / 170 / 170 ms |
| t₀ + 0,6 (560 ms) | **04 REZIVO** | **Rezivo.** | na počítači teraz stoja vedľa seba všetky štyri výtlačky |
| **t₀ + 0,7 (730 ms)** | **Strih na celý dvor**: papier s výtlačkami zmizne naraz a pod ním je **tá istá fotka dvora, ktorá je LCP**, bez kópie a bez prelínania. Kamera dosadne (1,07 → 1,00 za 1,5 s). | **Rezivo.** odíde hore a z tej istej drážky vyjde **„Dvor plný materiálu.“** (0,55 s) | CSS, `--o: .73s` |
| t₀ + 0,8 | | 2. riadok **„Od základov po strechu.“** (tehlová) | |
| t₀ + 0,8 – 1,3 | text pod nadpisom, tlačidlá **Zavolať 0905 622 223** a Poslať dopyt, odkazy a **vyhľadávanie** vyjdú o 14 px a za 0,42 s sú celé | | `uw-vyjdi` |
| t₀ + 1,0 | štítok **Náš dvor · Novozámocká 62/68, Nitra** sa vrazí (pečiatka, jeden malý prekmit podľa POHYB.md) | | `uw-pecat` |
| t₀ + 1,0 – 1,3 | odznak „Skutočná fotka nášho dvora v Nitre“ sa objaví | | |
| **t₀ + ≈1,25** | **úvod je použiteľný**: H1 stojí, Zavolať a hľadanie sú viditeľné a klikateľné | | merané (§3) |
| t₀ + 2,23 | koniec: triedy sa upracú, obsah ostane v konečnom stave (obyčajné HTML a CSS), vpravo hore je tlačidlo „Prehrať úvod“ | | `uw-hotovo` |

Videné na hárkoch: `harky/harok-telefon.jpg` (16 snímok, t₀ = 902 ms), `harky/harok-pocitac.jpg` (15 snímok, t₀ = 203 ms) a
`harky/video-harok-telefon.jpg`. Pre porovnanie je dnešný stav v `harky/harok-dnes-telefon.jpg`.

**Odovzdanie obrazu je bez skoku.** „Celý dvor“ nie je kópia fotky, ale samotný `<picture class="uv-dvor">` úvodu, ktorý sa celý
čas vykresľuje pod papierom uvítania. Slová ležia v drážke presne na mieste 1. riadku H1: skript odmeria `.uv h1 .ln` a skopíruje
písmo, veľkosť, riadkovanie aj odsadenie. Pri 320, 360, 768, 1024 aj 1920 px sedí obdĺžnik slov s riadkom H1 na pixel
(`nastroje/sirky.mjs`, výstup `slova` = `ln`). Vodorovné posúvanie stránky nevzniká (`scrollWidth` = šírka okna).

---

## 3. Merania A/B (A = kópia bez uvítania, B = prototyp)

Podmienky: Playwright, Chromium 1243 z `/opt/pw-browsers`, `python3 -I -m http.server` bez gzip a HTTP/1.0, nová relácia pri
každom behu. Varianty sa striedali a poradie sa v každom kole otočilo (`nastroje/ab.sh`). Telefón: 390×844, DPR 3, CPU 4×.
**4G** = latencia 165 ms, 8,1 Mb/s. **Slow 4G** = 562,5 ms, 1,44 Mb/s (predvoľby DevTools). Počítač: 1440×900, bez obmedzenia.
**Záťaž stroja bola 4,5 – 7,6 na 4 jadrách** (bežali iné úlohy), preto čísla porovnávam len v rámci kola. Súhrn: `mer/suhrn.txt`.

„Použiteľný“ = oba riadky H1 stoja (posun < 1 px) a sú navrchu (`elementFromPoint`), tlačidlo Zavolať a pole hľadania majú
plnú nepriehľadnosť a zasiahne ich ťuk do stredu. Meria sa v `requestAnimationFrame` (`nastroje/mer.mjs`).

| profil | variant | LCP medián (behy) ms | CLS max | H1 použiteľný ms | Zavolať / hľadanie ms | snímky > 50 ms počas uvítania (rAF / LoAF) | bajty |
|---|---|---|---|---|---|---|---|
| telefón 4G (11 behov A, 11 B) | A | 1 092 (988 – 1 252) | 0,0001 | 1 689 (1 603 – 1 915) | 719 (670 – 781) | dnes: 2 – 5 v okne 2,3 s po FCP | 1 434 kB |
| | **B, uvítanie prebehlo** (1 z 11) | 996 | 0 | **2 453** | **2 437** | **0 / 0** | 1 720 kB (+286) |
| | **B, vynechané** (10 z 11, zábery neprišli do 1 250 ms) | 960 (872 – 1 140) | 0 | 1 284 (1 255 – 1 468) | rovnako | 0 / 0 | 1 720 kB |
| telefón Slow 4G (3) | A | 3 316 | 0,0001 | 3 686 | 2 753 | 0 | 1 125 – 1 368 kB* |
| | B (vždy vynechané) | 3 336 (+20) | 0,0001 | **2 731** | 2 731 | 0 | 1 054 kB* |
| počítač (4) | A | 248 (196 – 280) | 0,0004 | 1 038 | 62 | 0 – 1 | 2 190 kB |
| | **B** (prebehlo 4 z 4, t₀ 230 – 366) | 258 (244 – 272) | 0,0003 | **1 585** (1 488 – 1 602) | **1 519** | **0 / 0** | 2 207 kB (+17) |

\* Slow 4G: bajty za 9 s. B stiahne menej, lebo nespustí starý strih s výtlačkami 900 px.

**Čo z toho vyplýva (poctivo):**

- **LCP sa nezhoršil o viac ako 150 ms.** Telefón 4G: medián B 980 ms (872 – 1 140), A 1 092 ms (988 – 1 252). Počítač: +10 ms. Slow 4G: +20 ms. Pozor,
  metrika LCP berie fotku dvora, ktorá sa pod papierom uvítania vykresľuje od FCP. **Zákazník ju naozaj uvidí až pri strihu na dvor**:
  na počítači asi 0,93 s (dnes asi 0,25 s), na telefóne bez obmedzenia siete 1,63 s (dnes 0,48 s). Uvítanie teda zámerne odkladá
  pohľad na dvor, presne podľa zadania („pred tým, než uvidí tovar“).
- **CLS** je 0 – 0,0003. Všetko je absolútne umiestnené a pohybuje sa len cez transform alebo opacity.
- **Snímky nad 50 ms počas uvítania: 0** na telefóne (CPU 4×) aj na počítači (rAF aj Long Animation Frames, okno od t₀ po koniec).
  Strihy sú WAAPI animácie v kompozítore a všetky fotky sú vykreslené vopred (§5).
- **Cieľ ≤ 2,5 s do použiteľného úvodu:** počítač 1,42 – 1,64 s ✔. Telefón 4G 2,44 s, keď uvítanie prebehne ✔, ale tesne.
  Inak 1,26 – 1,47 s ✔ (rýchlejšie ako dnes, lebo nečaká na nábeh riadkov). Slow 4G 2,73 s (dnes 3,69 s).
- **Na telefóne 4G pri tejto záťaži stroja uvítanie väčšinou neprebehlo (10 z 11).** Štyri zábery (268 kB) prišli až za
  1,04 – 1,24 s (`mer/ab-tel4g-2.jsonl`, pole `obr`). Pri nižšej záťaži (2,8 – 4,5) som v skoršom kole s tou istou sekvenciou
  pre telefón mal štart vo 4 behoch zo 4 (t₀ 1 228 – 1 249 ms, H1 2 421 – 2 459 ms). Ten súbor som však prepísal novším meraním,
  takže ho doložiť nemôžem a beriem ho len ako orientačný. Na ostrom serveri s gzip (CSS má 113 kB bez kompresie) a HTTP/2
  bude FCP aj príchod záberov skôr, to však treba overiť na skutočnom telefóne.
- **Bajty navyše:** **počítač 0 nových obrázkov** (+17 kB je len kód). Uvítanie používa tie isté súbory `zasoba-*-480.avif`, ktoré
  si úvod aj tak stiahne pre pás zásob (v A sú v zozname `obr`). **Telefón +268 kB obrázkov** (sada 480 px, spolu +286 kB).
  Telefón si pre pás inak berie verzie 856/900 px (spolu 858 kB), ktoré na 4G do 1,25 s nestihnú prísť. Menej sa dá dosiahnuť
  len tak, že pás zásob na telefóne prejde na 480/720 px. Nie je to úloha uvítania.
- **Kód:** index.html narastie zo 44,6 kB na 62,3 kB (gzip 11,0 → 17,2 kB). Väčšinu tvoria slovenské komentáre a pri zostavení
  ich treba zmenšiť.

---

## 4. Kedy sa uvítanie ukáže a ako sa dá preskočiť (overené, `mer/kontroly.json`)

Skript v `<head>` pridá `uw-mozne`, keď je povolený pohyb a nie je zapnuté šetrenie dát. Pridá `uw` (uvítanie), keď navyše platí:
**prvá návšteva v relácii** (`sessionStorage` `uw-videne`), **bez kotvy**, navigácia typu `navigate` (nie obnovenie ani Späť),
**príchod zvonku**, teda nie z vlastnej podstránky (`document.referrer` má iný host), a hlavička HTML prišla do 0,9 s.

| Kontrola | Výsledok |
|---|---|
| preskočenie **ťukom** (telefón), **klikom**, **kolieskom**, **klávesom** (↓), **posunom** | vo všetkých piatich prípadoch je konečný stav o **257 – 331 ms** po vstupe (H1 `transform: none`, Zavolať viditeľné). Zábery a slová zmiznú naraz (strih na dvor) a nadpis s tlačidlami dobehnú 8× rýchlejšie z miesta, kde práve sú, takže nič neskočí. Hárok `harky/h-preskoc-tuk.jpg`: ani jedna prázdna snímka, najmenší jas 176. |
| obnovenie stránky po preskočení | bez uvítania (`html` nemá `uw`) |
| **druhá návšteva v relácii** (Kontakt → Úvod) | bez uvítania, 0 záberov, nič sa nestiahne |
| príchod z vlastnej podstránky v novej relácii | bez uvítania |
| **obmedziť pohyb** | žiadna trieda, `.uw-strih` `display: none`, 0 záberov (`snimky/obmedzit-pohyb-250ms.png` je hotový úvod pri 250 ms) |
| **bez JS** | žiadna trieda, `.uv-b` má opacity 1, H1 je v HTML (`snimky/bez-js.png`) |
| **kotva** `#obsah` | bez uvítania |
| **šetrenie dát** (`saveData`) | bez uvítania |
| **iframe** iného pôvodu, `sandbox="allow-scripts"` (sessionStorage hádže SecurityError) aj s `allow-same-origin` | uvítanie prebehne a skončí (`uw-start`, `uw-koniec`), **0 chýb z kódu uvítania**. V sandboxe bez same-origin je 18 chýb CORS pri písmach, **rovnako aj v A** (`nastroje/iframe-ab.mjs`). |
| „Prehrať úvod“ | uvítanie prebehne znova celé (2 231 ms, `nastroje/znova.mjs`) |
| čítačka a SEO | `.uw-strih` aj `.uw-slova` majú `aria-hidden="true"`, H1, text a odkazy sú v HTML od začiatku a nemenia sa. Počas uvítania sú tlačidlá pod nadpisom `visibility: hidden` (nedajú sa fokusovať). Ľubovoľný kláves vrátane Tab uvítanie ukončí. |
| poistky | Ak sa skript za úvodom nespustí, CSS po 2,4 s ukáže konečný stav. Ak sa uvítanie do 4,5 s nespustí, skript ukáže úvod. Ak stránka príde neskoro (hlavička po 0,9 s alebo skript po 1,25 s), uvítanie sa nespustí vôbec. |

---

## 5. Jas a „žiadna tmavá plocha“

Jas je priemer luminancie snímky (0 – 255), merané `nastroje/jas.py` na snímkach z CDP screencastu a na videách po 0,1 s:

| Záznam | min. jas | max. podiel tmavých px (< 50) |
|---|---|---|
| telefón, celá sekvencia (125 snímok) | **175,6** (koncový stav s fotkou) | 7,7 % (tiene na fotke) |
| počítač, celá sekvencia (121 snímok) | **164,8** (koncový stav) | 11,4 % |
| dnes (A), telefón | 173,4 | 8,1 % |
| video telefón / počítač (43 / 41 snímok) | 174,2 / 163,6 | – |
| preskočenia (5 záznamov) | 164,7 – 181,7 | 7,4 – 11,3 % |

Uvítanie je po celý čas **svetlejšie ako koncový úvod**: papier `#faf8f4`, zábery na ňom a stierka z papiera. Čierna ani tmavá
plocha nie je nikde. Tmavé pixely pochádzajú len z tieňov na skutočných fotkách.

**Technické poučenie (doložené):** priehľadný výtlačok, ktorý sa zjaví až na strih, ostal na počítači 0,2 s prázdny (sivý rám).
Opravil som to tak, že fotky sú od začiatku viditeľné a vykreslené: na telefóne v jednom páse a na počítači pod papierovou oponou.
Trik s `opacity: .002` v screencaste presvital ako duch fotky, preto som ho zahodil a doložil meraním `dbg3.png` (min. 248 = čistý papier).

---

## 6. Zhodnotenie hárkov: sila hooku do 3 s a profesionálny dojem

Hárky som otvoril a hodnotím ich ako zákazník a ako motion dizajnér.

**Silné stránky**
- Do 1 s od štartu vidí zákazník štyri skutočné zásoby a štyri slová a potom celý dvor. Veta „Dvor plný materiálu.“ prichádza
  ako súčet toho, čo práve videl. Dôkaz predchádza tvrdeniu a to je najsilnejší hook, aký sa dá postaviť pravdivo bez čísel.
- Na počítači je pás štyroch výtlačkov, ktorý stierka odkrýva zľava doprava, čitateľný ako „inventúra“ a pôsobí redakčne,
  ako titulky dokumentu. Strih z malých výtlačkov na široký dvor má veľký kontrast mierky a funguje ako „smash cut“.
- Slová idú v tej istej drážke ako H1, takže typografia je jedna. Prechod Rezivo. → Dvor plný materiálu. pôsobí ako jedna veta.
- Strih je svetlý, krátky (0,73 s strihov + 0,5 s nástup textu), nič nebliká a preskočenie je okamžité.

**Slabé stránky (bez prikrášľovania)**
1. **Telefón: počas strihov je spodných asi 430 px prázdny papier.** Výtlačok a slovo sú hore a kompozícia je ťažká navrchu.
   Návrh: slová strihov na telefóne zväčšiť na 1,5-násobok H1 a pri strihu na dvor ich zmenšiť do H1 (FLIP, len transform).
2. **Pred prvým strihom je papier len s eyebrow.** Na telefóne bez obmedzenia siete trvá 0,3 – 0,5 s, na 4G asi 0,3 s.
   Pôsobí to ako prázdna stránka. Návrh: v tejto fáze ukázať aspoň „01 / 04“ a obrys výtlačku, alebo štartovať hneď, keď sú
   dekódované prvé dva zábery.
3. **Na telefóne 4G pri záťaži uvítanie často nestihne prebehnúť** (§3). Vtedy zákazník vidí 0,3 s papier a potom hneď úvod.
   Nie je to chyba, ale hook neprebehne.
4. Zábery 480 px sú na telefóne s DPR 3 pri výtlačku 243 px mierne mäkké (asi 2 px fotky na CSS px). Pri 0,2 s strihu to
   nevadí, na statickej snímke áno.
5. Dvor je vidno neskôr ako dnes (§3). To je cena každého uvítania „pred tovarom“.

**Hodnotenie:** sila hooku do 3 s je **4/5 na počítači a 3,5/5 na telefóne**. Profesionálny dojem je **4/5**: pôsobí ako
titulková sekvencia, nie ako preloader, ale na telefóne mu chýba plnšia kompozícia (bod 1).

---

## 7. Napojenie na dnešný úvod a čo treba pri zapracovaní

- **Strih s výtlačkami (`#uv-zabery`, `site.js` 119 – 175, CSS `.uv-mont`) sa po zapracovaní nespustí nikdy.** Pri `uw-mozne`
  ho preberie uvítanie a bez pohybu sa nespúšťa ani dnes. Pri zapracovaní ho treba zmazať, šablóna má asi 3 kB HTML. V prototype
  je len vypnutý jednou podmienkou v `site.js:127`.
- Triedy `uv-ide` (nábeh dnešného úvodu) ostávajú. Pri uvítaní ich prepíše `html.uw` a po konci sa znova nespustia (`uw-hotovo`).
  Parallax fotky pri posune (`uv-odjazd`, scroll timeline) zostáva nedotknutý.
- Prechody medzi stránkami (zf) sa neprekrývajú: pri príchode z vlastnej podstránky sa uvítanie nespustí, pri prechode preč
  ho kliknutie ukončí.
- **Nález v dnešnej vetve (nie z uvítania):** tlačidlo „Prehrať úvod“ (`.uv-znova`) je na počítači z časti mimo obrazovky vľavo,
  `boundingBox x = −48` (`nastroje/znova.mjs`). Rovnako je to v A (prvá snímka `a-1440.png`, text „EHRAŤ Ú“). Patrí to
  zapisovateľovi zf.
- Pri zostavení (build.py) treba CSS a skript uvítania zmenšiť (bez komentárov) a vložiť ich len do `index.html`.

## 8. Servery

Servery 9820 (A), 9821 (B) a 9822 (hostiteľ iframe) som po meraní ukončil: `curl` na každý port vráti `000` a `pgrep -fa "http.server 982"` nevráti nič. Pracovná kópia ostáva v `/dev/shm/uvitanie-strih` (len RAM).
