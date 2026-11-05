# Porota: výber filmového úvodu a plán dokončenia webu Stavebniny Richtárik (5. 11. 2026)

Porota: kreatívny riaditeľ, majiteľ stavebnín, zákazník, ktorý si stavia dom a pozerá na telefóne, a senior SEO.
Hodnotili sme koncepty A Inventúra, B Kamera po dvore, C Odhalenie a D Film. D je koncept inšpirovaný internetom
a vznikol na doplnenie majiteľa z 5. 11.

**V strome som nič nemenil.** `git -C hs-richtarik-obnova status --short | wc -l` → `0`, HEAD `4b2646bf`.
Servery 9670 až 9675 som po sebe ukončil (`curl` na každý port → `000`, `pgrep -fa "http.server 967"` → nič).
Všetky výstupy poroty sú v `richtarik/profi/porota/` a cesty nižšie sú relatívne k tomuto priečinku.
- `nastroje/`: `prehliadka2.mjs`, `suhrn2.py`, `prechod2.mjs`, `jas2.py`, `iframe2.mjs`, `sirky2.mjs`, `porovnaj2.mjs` a `h1.mjs`.
  `jas2.py` spúšťajte cez `/usr/bin/python3.12`, lebo PIL pre 3.13 nemá `_imaging`.
- `prac2/`: logy, súhrny, snímky a hárky.

Starší pracovný priečinok `prac/` je zo 4. 11. Má meranie A až C pri záťaži 5 až 6 a ostáva ako doplnkový doklad.

**Podmienky merania.** Playwright, Chromium 1243 z `/opt/pw-browsers`, lokálne servery, sieť bez obmedzenia.
- Telefón: 390×844, DPR 3, CPU 4×.
- Počítač: 1440×900, CPU 1×.
- Varianty sme striedali A/B a poradie sa posúvalo v každom kole.
- **Súbežne bežali iné úlohy.** Záťaž bola 5,44 až 7,29 na 4 jadrách (`prac2/suhrn-uvod.txt`, riadok 1), takže čísla sú
  orientačné a porovnávajú sa len v rámci kola. Pri nižšej záťaži (1,6 až 3,5) namerali autori konceptov lepšie hodnoty,
  pozri ich NAVRH.md.

---

## 1. Čo som otvoril a pozrel

**Hárky a snímky konceptov** (všetky som otvoril nástrojom Read):
- **A:** `koncept-inventura/snimky/harok-390.jpg` a `harok-1440.jpg`.
- **B:** `koncept-kamera/sekvencia-390.jpg` a `sekvencia-1440.jpg`.
- **C:** `koncept-odhalenie/sekvencia-390.jpg`, `sekvencia-1440.jpg` a `video-harok-pocitac.jpg`.
- **D – úvod:** `koncept-film/sekvencia-uvod-390.jpg`, `sekvencia-uvod-1440.jpg`, `snimky/uvod-1440-01500.jpg`,
  `snimky/uvod-390-04600.jpg` a `video/video-harok-telefon.jpg`.
- **D – prechody a posun:** `snimky/prechod-390-2-katalog-kategoria.jpg`, `prechod-1440-2-katalog-kategoria.jpg`,
  `prechod-390-6-akcia-detail.jpg`, `posun-sekcie-390.jpg` a `web/img/film-d/og-dvor.jpg`.
- **Rešerš:** `inspiracia/galerie/harok-haven-m.jpg`.

**Vlastná prehliadka v prehliadači pri 390 a 1440** (hárky som otvoril):
- `prac2/harok-ABCD-390.jpg` a `prac2/harok-ABCD-1440.jpg`: A až D vedľa seba v čase 1,0 s, 2,5 s a 5,0 s.
- `prac2/harok-film-tel.jpg`: D v čase, bez JS a pri „obmedziť pohyb“.
- `prac2/harok-posun.jpg`: posun úvodnou stránkou, D proti dnešku.
- `prac2/harok-vt-film-tel-k1-2-katalog-kategoria.jpg` a `prac2/harok-vt-film-tel-k1-3-spat.jpg`: prechody medzi stránkami.
- `prac2/spat-koniec.jpg`: koniec prechodu Späť.
- `prac2/harok-sirky.jpg`: D pri 320, 360, 768 a 1024.

---

## 2. Merania poroty (A/B striedavo, 3 kolá)

### 2a. Úvod (`prac2/suhrn-uvod.txt`, surové dáta `prac2/prehliadka2.log`)

Okno animácie je podľa scenárov v NAVRH.md: D 1,0–4,1 s, A 0,7–5,2 s, B 0,3–7,3 s, C 0,4–4,6 s. Dnešný web
sa bez posunu nehýbe, preto má okno 0,6–5,0 s.

| profil | variant | LCP medián (behy) ms | snímky > 50 ms v okne animácie | najdlhšia | H1 použiteľný ms | hľadanie ms | telefón ms | kB za 8 s |
|---|---|---|---|---|---|---|---|---|
| tel | dnes (film s autom) | 816 (700/924/816) | 1/2/2 | 183 | 733/924/664 | nie je na 1. obrazovke | 447/668/478 | 5 198 |
| tel | A Inventúra | 780 (832/780/620) | **6**/0/2 | **1 183** | 4 264/1 194/1 054 | 4 382/1 348/1 218 | 3 381/481/402 | 3 008 |
| tel | B Kamera | **468** (640/468/440) | 3/3/2 | 167 | 562/531/333 | 446/345/333 | 446/345/333 | 2 375 |
| tel | C Odhalenie | 624 (944/612/624) | 4/0/0 | 250 | **4 339/4 025/4 056** | 4 458/4 136/4 167 | 4 403/4 079/4 111 | 2 505 |
| tel | **D Film** | 508 (524/508/436) | **0/1/2** | **67** | 883/286/498 | 883/286/498 | 222/286/498 | 2 815 |
| pc | dnes | 316 | 0/0/2 | 117 | 305/297/328 | – | 305/180/159 | 8 417 |
| pc | A | 176 | 0/0/0 | 0 | 754/515/523 | 804/667/676 | 173/136/82 | 2 669 |
| pc | B | 280 | 4/1/0 | 117 | 297/336/225 | 163/155/225 | 163/155/225 | 2 211 |
| pc | C | 252 | 2/0/0 | 133 | **3 815/3 591/3 542** | 3 976/3 693/3 693 | 3 926/3 642/3 592 | 2 274 |
| pc | **D** | 256 | 2/0/0 | 67 | 203/340/237 | 203/340/237 | 203/105/62 | **2 170** |

- **CLS:** pri všetkých variantoch najviac 0,0053.
- **Chyby v konzole:** 0 pri všetkých variantoch.
- **Súbory `img/film/` a `og.jpg`:** stiahne ich len dnešný web (stĺpec `film` = 1).
- **D:** pri záťaži 5,4 až 7,3 mal D počas strihu na telefóne 0, 1 a 2 snímky po 50 až 67 ms. Autor D nameral pri záťaži
  1,6 až 3,5 v štyroch behoch 0/0/0/0 (`koncept-film/NAVRH.md:35–37`). Cieľ „0 snímok nad 50 ms“ treba preto pri
  zapracovaní overiť pri záťaži ≤ 3,5 (kritérium Z1-10).
- **C:** spĺňa pravidlo „animácia nesmie oneskoriť obsah“ najhoršie. H1, telefón aj hľadanie sú na telefóne použiteľné až
  po 4,0 až 4,4 s a na počítači po 3,5 až 3,9 s.

### 2b. Posun úvodnej stránky (telefón CPU 4×, 30 × 120 px kolieskom, `prac2/prehliadka2.log`, riadky `"posun"`)

| variant | posun scrollY po každých 3 krokoch | snímky > 50 ms | pripnuté prvky > 5 % okna |
|---|---|---|---|
| dnes | 360, 720, … 3 600 (presne) | 9 (max 133) a 3 (max 117) | lišta, drawer, **`DIV.pin 390×844`** (film), mbar |
| D | 360, 720, … 3 600 (presne) | 2 (max 83) a **0** | lišta, drawer (zavretý), mbar |

D nič nepripína a posun nezamyká. Krok kolieska sa prejaví celý (`ys` lineárne).

### 2c. Prechody medzi stránkami (`prac2/suhrn-prechod.txt`, `prac2/jas-prechody.txt`, snímky `prac2/vt/`)

Merané 2 kolá A/B, vždy 3 prechody: úvod → katalóg, katalóg → Murovací materiál dlaždicou a Späť. Prechod medzi
dokumentmi je podporovaný (`vtPodpora: true`).

| profil | variant | snímky > 50 ms po prvom vykreslení novej stránky (6 prechodov) | najnižší jas snímky | najviac tmavých px (Y < 60) |
|---|---|---|---|---|
| tel | dnes („papier“) | 4 | 95,0 (východisková stránka s filmom) | 28,0 % (film) |
| tel | **D** | **0** | 170,6 | 9,0 % |
| pc | dnes | 14 | 102,0 (film) | 19,6 % |
| pc | **D** | **18** (najmä Späť: 4 a 5) | 163,2 | 13,4 % |

Najtmavšia snímka D je vždy východisková stránka, nie clona. Čierna ani tmavá plocha pri prechode nie je.
Na počítači je D o niečo horší, čo potvrdzuje riziko R1 z `koncept-film/NAVRH.md:252–256`: zdieľaná fotka sa
v headless Chromiu bez GPU skladá softvérovo. Riešenie je v kroku ZF-02.

### 2d. Ďalšie kontroly D

- **Bez JS a pri „obmedziť pohyb“** (`prac2/prehliadka2.log`, riadky `"staticke"`):
  - H1, telefón a hľadanie sú viditeľné na úvode aj na katalógu.
  - Skrytých prvkov je 0 a strana nepreteká (`sirka = okno`).
  - Pri „obmedziť pohyb“ beží 0 animácií.
  - Bez JS bežia 2 animácie: `fd-odjazd` (fotka pri posune, `film-d.css:117–122`) a pás značiek, ktorý má aj dnešný web.
    Obsah tým neskryjú.
- **Iframe** (`prac2/iframe.txt`):
  - Dnes aj D majú 0 `pageerror`.
  - V ráme bez `allow-same-origin` je 16 chýb konzoly, rovnako ako dnes (8× CORS pri písmach, 8× `net::ERR_FAILED`).
  - Prechod do katalógu v ráme funguje.
- **Šírky 320 až 1920** (`prac2/sirky.txt`, `prac2/harok-sirky.jpg`): stránka nikde nepreteká (`sw = iw`). Nájdené chyby
  sú v časti 3, D-3 až D-6.
- **H1 a telefón na prvej obrazovke** (`prac2/h1-tel.txt`):
  - D 390: H1 má 32,8 px na y 487–557 a z telefónov je vidieť len „Zavolať“ bez čísla.
  - D 1440: H1 má 57,6 px a začína až na y 674.
  - Pre porovnanie: A 1440 má H1 80 px a C 86,4 px.
- **Auto** (príkazy v `prac2/hero-texty.txt` a v časti 3):
  - `grep -rlE 'img/film/|uvod/og\.jpg|prvy-t|posl-p'` v D → 0.
  - og:image na 75 z 75 stránok je `img/film-d/og-dvor.jpg` (1200×630, 175 703 B). Otvoril som ho: sú na ňom palety, dom
    a stĺp, auto nie.
  - Skutočné autá firmy (nie z klipu): `index.html:148` (`img/p/885`) a `sluzby.html:96, 101` (`p/883–885`).
- **Vrátené fotky:** 20 súborov `pas-dvor-*`, `dvor-predajna-*` a `zasoba-porfix-*` v D sa zhoduje s `bb6bbaeb`
  (md5, **20 / 20**). Dnešné súbory sa líšia (výpis md5 je v tomto zápise, časť 3).
- **Knižnice:** v D nie je žiadny skript z CDN ani cudzia knižnica (`grep` na `<script src="http…"`, cdn, gsap, lenis,
  barba a swup → 0). Slovo „AI“ sa v HTML, CSS ani JS nevyskytuje (0).

---

## 3. Hodnotenie (1–10)

Váhy: hook 3, filmové prechody a animácie celého webu 3, plné zásoby 2, obsah nečaká 2, plynulosť 2, pravdivosť 2,
profesionálny dojem 1, inšpirácia s mierou 1, bez auta a tmavých plôch 1 (spolu 17).

| kritérium | A Inventúra | B Kamera | C Odhalenie | **D Film** |
|---|---|---|---|---|
| sila hooku do 3 s (×3) | 7 | 6 | 9 | 8 |
| filmové prechody a animácie: sekcie, stránky, mikro (×3) | 3 | 2 | 3 | **9** |
| „plné zásoby“ jasne viditeľné (×2) | 9 | 7 | 8 | 8 |
| obsah nečaká (H1, telefón, hľadanie, LCP) (×2) | 6 | 9 | 2 | 8 |
| plynulosť, merané (×2) | 7 | 8 | 6 | 8 |
| pravdivosť proti FAKTY.md (×2) | 8 | 6 | 9 | 8 |
| profesionálny dojem (×1) | 7 | 8 | 7 | 8 |
| inšpirácia s mierou, nič skopírované (×1) | 5 | 5 | 6 | 9 |
| žiadne auto, žiadne tmavé plochy (×1) | 10 | 10 | 9 | 10 |
| **vážený priemer** | **6,6** | **6,3** | **6,4** | **8,4** |

### A Inventúra (6,6)

**Silné stránky:**
- Najsilnejšie ukazuje plné zásoby: 7 skutočných záberov a štítok ako na palete (Nitra, Tehly, Pórobetón, Dlažby, Rezivo,
  Pred predajňou, Celý dvor a Náš dvor).
- Najväčší H1 na počítači (80 px).

**Slabé stránky:**
- Rieši len úvod. Nemá prechody medzi stránkami ani sekciami.
- H1 je na telefóne použiteľný až po 1,05 až 1,19 s.
- Na počítači je rám na výšku malý.
- V jednom behu pri záťaži 6 mal snímky 767 ms a 1 183 ms (`prac2/prehliadka2.log`, kolo 1, tel, inv).
- Štítok „Celý dvor“ nad jednou uličkou je mierne nadnesený.
- Zdroje inšpirácie neuvádza.

### B Kamera (6,3)

**Silné stránky:**
- Najlepšie LCP (telefón 468 ms) a obsah je hneď použiteľný.
- Pôsobí pokojne a prémiovo.

**Slabé stránky:**
- Iba jedna fotka, takže sortiment nie je vidieť.
- Titulok „Žiadna ilustračná fotka.“ je absolútne tvrdenie. Dlaždice kategórií sú pritom fotky Pexels a pôvod `u4` nie
  je istý na 100 % (NAVRH B, riziko 1).
- Štítky služieb („01 Poradíme s výberom“) sú pripnuté na konkrétnych paletách, čo významovo nesedí.
- Nemá žiadne prechody.

### C Odhalenie (6,4)

**Silné stránky:**
- Vizuálne najsilnejší hook: veta „DVOR PLNÝ MATERIÁLU.“ je okno do skutočnej fotky.

**Slabé stránky:**
- **Porušuje pravidlo „animácia nesmie oneskoriť obsah“.** Lišta, H1, telefón aj hľadanie prídu až po 3,5 až 4,4 s.
- Na počítači je v čase 1,75 s viditeľný polopriehľadný zvyšok písmen „PL“ cez fotku (`sekvencia-1440.jpg`,
  `video-harok-pocitac.jpg`).
- Verzia s `clip-path` zhodila kompozítor (`koncept-odhalenie/NAVRH.md:69–71`).
- Nemá prechody medzi stránkami.

### D Film (8,4) – víťaz

**Silné stránky:**
- Je to jediný koncept, ktorý rieši celé zadanie z 5. 11.:
  - filmový úvod, v ktorom je skutočný plný dvor od prvej snímky (LCP 436–524 ms na telefóne),
  - H1 vyjde z drážky a štyri skutočné zábery zásob dopadnú ako výtlačky,
  - prechody medzi stránkami s tromi typmi strihu a so zdieľanou fotkou dlaždica ↔ hlavička,
  - odhalenia sekcií pri posune bez pripínania,
  - mikroanimácie.
- Telefón: 0 dlhých snímok po prvom vykreslení v 6 zo 6 prechodov (dnes 4).
- Fotky s doplneným tovarom sú vrátené (20 / 20 md5).
- Auto nie je nikde.
- Uvádza 17 zdrojov s URL, dátumom, princípom a tým, čím sa líši (`koncept-film/NAVRH.md:291–312`). Kód je vlastný a bez
  knižnice.

**Chyby, ktoré musí zapracovanie opraviť** (všetky sú v pláne):
- **D-1:** stráž písma skryje text úvodu až na 1 s (`koncept-film/web/index.html:24`, `film-d.css:76–77`). Na hárku videa
  v 0,0 s nie je H1.
- **D-2:** na počítači je H1 malý a nízko (57,6 px, y 674).
- **D-3:** na telefóne nie je na prvej obrazovke celé číslo 0905 622 223 (STYL §5: „Telefón vždy s číslom“).
- **D-4:** pri 320×640 je hľadanie čiastočne pod spodnou lištou. Pri 320 a 360 je odznak „Skutočné fotky z nášho dvora“
  orezaný tlačidlom „Prehrať úvod“.
- **D-5:** pri 1024 sa eyebrow rozpadne do troch úzkych stĺpcov a tlačidlo „Akcie“ sa zalomí.
- **D-6:** zástupný text hľadania pretečie pri 320, 360, 390, 414 a 1024 (`prac2/sirky.txt`).
- **D-7:** lede „dovezieme vlastnými autami s mechanickou rukou“ v množnom čísle je nadnesené. Zdroj uvádza „Avia 3,5t
  a Iveco s mech.rukou 8t“ (`diagnoza/texty/nastroje/povodny-web.txt:31`), čiže mechanickú ruku má jedno auto.
- **D-8:** na úvode ostali karty akcií „Super ceny“ a „Najlacnejší komínový systém…“ (`koncept-film/web/index.html:138`)
  a fotka skutočného auta `img/p/885` (`:148`).
- **D-9:** na počítači sú pri zdieľanej fotke dlhé snímky (2c).
- **D-10:** prelnutie stránok vytvára dvojexpozíciu textu (`prechod-390-6-akcia-detail.jpg`, 328 ms).
- **D-11:** pri Späť sú dlaždice obnoveného katalógu asi 100 ms prázdne a sivé (`prac2/harok-vt-film-tel-k1-3-spat.jpg`,
  476–565 ms).
- **D-12:** časť pohybu beží aj bez JS (`fd-odjazd`). Obsah neskrýva, ale kvôli jednotnosti patrí pod `(scripting: enabled)`.

### Pravdivosť úvodov proti FAKTY.md (`prac2/hero-texty.txt`)

| text | A | B | C | D | zdroj / verdikt |
|---|---|---|---|---|---|
| „Dvor plný materiálu. Od základov po strechu.“ | ✓ | ✓ | ✓ | ✓ | FAKTY F (povolené), STYL §4 |
| eyebrow s Nitrou, Hornými Krškanmi a rokom 1997 | ✓ | ✓ | ✓ | ✓ | FAKTY A |
| spotreba a cenová ponuka zadarmo | ✓ | ✓ | ✓ | ✓ | PW:28, PW:9, PW:2722 |
| „vlastnými autami s mechanickou rukou“ | ⚠ | – | ✓ „aj s mechanickou rukou“ | ⚠ | PW:31: ruku má len 8 t auto, preto opraviť (Z1-07) |
| „po celom Slovensku“ | – | – | – | ✓ | PW:9 „v rámci celého Slovenska“ |
| „Žiadna ilustračná fotka.“ | – | ⚠ | – | – | absolútne tvrdenie, nepreberá sa |
| „Stavebné rezivo priamo na sklade“ | – | – | – | ✓ | PW:956 |
| „Skutočné fotky z nášho dvora“ | ✓ | ✓ | ✓ | ✓ | FAKTY F. Pôvod `u4` treba potvrdiť originálmi (pre majiteľa) |
| AI, hneď, najlacnejší, zložíme, Iveco/LIAZ v úvode | 0 | 0 | 0 | 0 | kontroly autorov aj moje čítanie textu úvodu |

---

## 4. Víťaz a prenesené nápady

**Víťaz: D Film.** Zapracuje sa ako základ úvodu (z1) a celého pohybu webu (zf), spolu s opravami D-1 až D-12.

| odkiaľ | nápad | kam |
|---|---|---|
| B Kamera | H1 viditeľný od prvého vykreslenia (žiadne skrývanie textu kvôli písmu) a najrýchlejšie LCP | Z1-06 |
| B Kamera | stály popis fotky „Skutočná fotka nášho dvora v Nitre“ pre čítačku aj pri zastavenom strihu | Z1-05 (figcaption) |
| B Kamera | oprava riadku tlačidiel na telefóne `.btn{flex:1 1 0;min-width:0}` (stránka mala 426 px) | Z1-06 |
| B / STYL P5 | „Dovezieme na miesto, ktoré určíte“ | Z1-07 |
| A Inventúra | typografická sila H1 na počítači (≥ 64 px) a rytmus strihu, ktorý sa zrýchľuje | Z1-06 |
| A Inventúra | „Prehrať znova“ a ukončenie strihu pri písaní do hľadania | Z1-05 (D to má, ponechať) |
| C Odhalenie | skúsenosť, že `clip-path` na veľkej ploche zhadzuje kompozítor, preto len `transform` a `opacity` | ZF-03 |
| C Odhalenie | mozaika zásob hneď pod úvodom (pás „Na našom dvore v Nitre“) | Z1-07 (ostáva D pás) |
| rešerš N4 (odvetvie) | zvýraznenie dnešného dňa v otváracích hodinách. **Bez tvrdenia „teraz otvorené“**: sviatky nie sú vo FAKTY | Z1-06 |
| rešerš N8 / STYL §5 | „Cenník akcií z 28. 1. 2026 (PDF)“ pri akciách | Z2-09 |
| rešerš R15 / N6 | pás značiek s tlačidlom Zastaviť a pauzou pri fokuse | ZF-04 |
| technika §0.3, §0.7 | zrušiť 200 ms čakanie bez podpory, zrušiť modrý záblesk ťuknutia, odstrániť dvojexpozíciu | ZF-01, ZF-02 |

**Nepreberá sa:**
- závoj C pred obsahom (oneskoruje obsah o 3,5 až 4,4 s),
- titulok B „Žiadna ilustračná fotka.“ (absolútne tvrdenie),
- štítky služieb na paletách z B,
- biele záblesky z A (D ich nepotrebuje).

---

## 5. Štýl textov (rozhodnutie poroty)

Prijímame `diagnoza/texty/STYL.md` celý. Doplnenia poroty:

1. **Oslovenie:** celý web vyká malými písmenami („vy, vám, váš“), firma hovorí „my“ a tlačidlá sú v neurčitku
   („Zavolať 0905 622 223“, „Prezrieť katalóg“, „Poslať dopyt e-mailom“). Dôvody: B2B aj stavebníci 30–70 rokov,
   pôvodný web vyká (PW:4–8) a majiteľ chce „viac profesionálne“. Tykanie sa ruší všade, aj na 21 stránkach so zmiešaným
   oslovením.
2. **Tón:** vecný a istý ako skúsený predavač za pultom.
   - Čísla namiesto prídavných mien.
   - Bez výkričníkov, verzálok vo vete a emotikonov.
   - „Akciová cena“ namiesto „super ceny“.
   - Bez prázdnych fráz (STYL §8).
3. **Pravdivosť:**
   - Každé tvrdenie musí byť vo FAKTY.md.
   - „Zadarmo“ sa píše len pri cenovej ponuke, poradenstve a výpočte spotreby. Pri doprave len s podmienkou zo zdroja.
   - Mechanickú ruku spomínajte v jednotnom čísle („aj autom s mechanickou rukou“).
   - Značku 8 t auta v nových textoch neuvádzajte. Kde je dnes „Iveco“ alebo „LIAZ“, ostáva bez zmeny (otvorená otázka).
4. **Superlatívy:**
   - Vlastné tvrdenie „najlacnejší komínový systém“ sa predvolene nahradí cenou z cenníka podľa STYL P9:
     „napríklad kompletný komín 6 m, ø 160/90 za 618 € s DPH“ (PDF s.1). Majiteľ ho môže vrátiť (pre majiteľa).
   - „Najlacnejšie garáže“ vypadnú.
   - Tvrdenia výrobcov sa uvádzajú len s pripísaním výrobcovi.
5. **H1 úvodu (SEO):** `<h1><span class="h1-miesto">Stavebniny Nitra – Horné Krškany</span> Dvor plný materiálu. Od základov po strechu.</h1>`.
   - Prvá časť vyzerá ako dnešný eyebrow, „od roku 1997“ ostáva mimo H1.
   - Dôvod: SEO diagnóza chce „stavebniny“ a „Nitra“ v H1 (`diagnoza/seo/ZAPIS.md:64–65`) a obraz ostáva.
6. **Slovo AI:**
   - Na webe sa nepoužíva, okrem povinného označenia asistenta podľa STYL §9: odznak „AI“, „AI asistent Stavebnín Richtárik“,
     podtitul a odkaz Ochrana údajov.
   - Nepoužíva sa ani v kóde mimo asistenta a ani v commitoch.
7. **Typografia:** podľa STYL §6. Pomlčka s medzerami, nezlomiteľné medzery, m², €, % s medzerou a desatinná čiarka.

---

## 6. Plán pre zapisovateľov z1 → zf → z2 → z3

### Spoločné pravidlá (platia pre každý krok)

**Vetva a commity:**
- z1 založí vetvu `richtarik-profi` z `4b2646bf` v `hs-richtarik-obnova` (`git switch -c richtarik-profi`).
- Ďalší zapisovatelia pokračujú na nej.
- Commity sú len lokálne, po slovensky, bez podpisových riadkov a bez názvov nástrojov. Autor je
  `Claude <noreply@anthropic.com>`, teda `git -c user.name=Claude -c user.email=noreply@anthropic.com commit`.
- Nikdy push, merge, `reset --hard` ani `rm -rf` mimo dočasných priečinkov. Nič sa nenasadzuje.

**Meranie:**
- Vždy A/B striedavo voči predchádzajúcemu commitu. Kópia vznikne cez `git archive <commit> stavebniny-richtarik | tar -x -C <scratchpad>/porovnanie-<krok>`.
- Pred meraním a po ňom zapíšte `uptime`. Ak je záťaž nad 3,5, zopakujte meranie (najviac 3×) a uveďte to.
- Servery spúšťajte cez `python3 -I -m http.server <port> --bind 127.0.0.1` a po sebe ich ukončite.
- Porty pridelí orchestrátor. Návrh: z1 9740–9749, zf 9750–9759, z2 9760–9769, z3 9780–9789.

**Nástroje:**
- `porota/nastroje/prehliadka2.mjs`, `prechod2.mjs`, `jas2.py`, `sirky2.mjs`, `iframe2.mjs`, `h1.mjs`.
  Upravte v nich `VAR` a `BASE`.
- `koncept-film/nastroje/ostrost.mjs`, `kontroly.mjs`, `video.mjs` a `harok.py`.
- `dokoncenie/nastroje/prehliadka.mjs` (všetky stránky).
- `diagnoza/texty/nastroje/vypis.py` a `audit.py`.
- `diagnoza/seo/nastroje/audit.py`, `cwv.mjs` a `cls-vsetky.mjs`.
- `diagnoza/asistent/navrh/nastroje/*`.

**Dôkazy a výstupy:**
- Každé tvrdenie v zápise doložte príkazom s výstupom, cestou:riadkom alebo snímkou, ktorú ste otvorili nástrojom Read.
- Zápis ide do `richtarik/profi/<zapisovatel>/ZAPIS.md`.

**Spoločné brány na konci každého zapisovateľa:**
- `python3 build.py` prebehne a `kontrola_uvodu()` je OK.
- `dokoncenie/nastroje/prehliadka.mjs` na všetkých stránkach: 0 chýb JS a 0 chýbajúcich lokálnych odkazov.
- Iframe: 0 `pageerror`.
- Bez JS a pri „obmedziť pohyb“: na úvode a 4 podstránkach je 0 skrytých prvkov a pri „obmedziť pohyb“ beží 0 animácií.
- Šírky 320, 360, 390, 414, 768, 1024, 1440 a 1920: `scrollWidth = innerWidth`.

### z1: úvod, odstránenie auta, vrátenie fotiek, texty úvodnej stránky

| ID | krok | merateľné kritérium |
|---|---|---|
| Z1-01 | Založiť vetvu `richtarik-profi` z `4b2646bf` a zmerať východisko: úvod (prehliadka2 `meraj`, 3 kolá) a prechody (prechod2, 2 kolá) na dnešnom strome. Výstup uložiť do `richtarik/profi/z1/vychodisko/`. | `git rev-parse --abbrev-ref HEAD` → `richtarik-profi`, `git merge-base HEAD 4b2646bf` = `4b2646bf`, `status` prázdny. Súbory `vychodisko/*.log` existujú a uvádzajú záťaž. |
| Z1-02 | Vrátiť fotky s doplneným tovarom: `git checkout bb6bbaeb -- stavebniny-richtarik/img/uvod/{pas-dvor,dvor-predajna,zasoba-porfix}-*` (20 súborov, všetky veľkosti a formáty). | md5 všetkých 20 súborov = `bb6bbaeb` (20 / 20, skript ako v časti 2d). V celom `stavebniny-richtarik/` je 0 súborov, ktorých md5 sa zhoduje s niektorou z 20 upravených verzií v `4b2646bf`. Hárok pôvodná/dnešná otvorený. |
| Z1-03 | Odstrániť auto a starý film všade: `img/film/` (108 súborov), `img/uvod/og.jpg`, `zdroj/film.sh`, `film.mjs`, `napis.mjs`. Ďalej `site.js:113–817` (prehrávač), `site.css:170–180` a `770–883` a biele logo nad filmom (`:62`, `:69`, `:131`). V `index.html` preload `img/film`, skript v `<head>` s triedou `film-ide`, `film-data`, base64 náhľady filmu a alt s IVECO. V `build.py` `--stary-uvod` (`:683–684`, `:1053`, `:1173`), výnimku `img/film` v `nasadenie/balik.sh:21, 31`, film v `README.md` a `img/FOTKY.md:33`. Testy filmu v `dokoncenie/nastroje` (`funkcie.mjs:145–242`, `technika_fling.mjs`) nahradiť testami nového úvodu. | `git ls-files stavebniny-richtarik/img/film \| wc -l` → 0. `grep -rIlE 'img/film\|uvod/og\.jpg\|film-data\|richtarikFilm\|film-ide\|stary-uvod\|IVECO' stavebniny-richtarik` → 0. `grep -c 'Iveco'` v `index.html` → len pôvodný riadok služieb (otvorená otázka, nemeniť). 0 obrázkov v strome s md5 súboru z `img/film` alebo `og.jpg`. |
| Z1-04 | Nový og obrázok `img/og-dvor.jpg` 1200×630 (z `koncept-film/web/img/film-d/og-dvor.jpg`, výrez `u4` bez pravého okraja s autom). V `build.py:24` `OG_IMG = ('img/og-dvor.jpg', 1200, 630)` s pravdivým komentárom („výrez skutočnej fotky dvora u4, bez auta“), `og:image:alt`, JSON-LD `image` a ručne v `index.html`. | `grep -l 'img/og-dvor.jpg'` → 75 z 75 HTML. `identify` → 1200×630, ≤ 200 kB. Snímku aj zväčšený pravý okraj otvoriť (žiadne auto). Komentár neobsahuje „auta firmy“. |
| Z1-05 | Zapracovať úvod D: HTML úvodu z `koncept-film/web/index.html`, CSS úvodu `film-d.css:7–123`, JS `film-d.js` a fotky dvora (`img/film-d/dvor-*` → `img/uvod/dvor-*`). Predpony tried `fd-` premenovať na `uv-` a žiadny súbor, trieda ani komentár nesmie obsahovať slovo „film“. Scenár podľa `koncept-film/NAVRH.md:66–90`: plátno 0,2–1,05 s, kamera 0–2,9 s, H1 0,12–1,06 s, štyri zábery 1,0–3,0 s (tehly, Porfix neupravený, Stadreko, rezivo), odchod 3,32–3,84 s, pečiatka „Náš dvor · Novozámocká 62/68, Nitra“. Prerušenie posunom, dotykom, klávesom a fokusom v hľadaní. Raz za reláciu, nie pri `saveData`, tlačidlo „Prehrať úvod“, zábery v `<template>`. Pridať stály `figcaption` „Skutočná fotka nášho dvora v Nitre“ (z B). | `grep -ci film` v `index.html`, `site.css` a `site.js` → 0. Snímky v 0,3 / 1,0 / 1,5 / 2,0 / 2,5 / 3,0 / 4,0 / 5,0 s pri 390 a 1440 (prehliadka2 `snimky`) zobrazujú celý scenár a koniec „Náš dvor“. Hľadanie „cement“ počas strihu ukončí strih a ukáže ≥ 7 výsledkov. Bez JS sa stiahne 0 záberov strihu. |
| Z1-06 | Opraviť D-1 až D-6 a D-12. (a) Zrušiť skrývanie textu kvôli písmu. Pridať záložné písmo s `size-adjust`/`ascent-override` pre Barlow Condensed, aby výmena písma neposunula riadky. (b) Počítač ≥ 1100 px: H1 ≥ 64 px a celý H1, „Zavolať 0905 622 223“ aj hľadanie v okne 1440×900. Pás fotky ≥ 50 % výšky okna. (c) Telefón 360–430 px: na prvej obrazovke je viditeľný odkaz `tel:` s celým číslom 0905 622 223 (v úvode alebo v spodnej lište, napr. „Zavolať 0905 622 223“). Pri 320 px aspoň ikona s číslom. (d) Pri 320×640 je hľadanie celé nad spodnou lištou a odznak sa neoreže. (e) Pri 1024 je eyebrow v jednom riadku a tlačidlá v jednom riadku. (f) Kratší zástupný text „Hľadajte: cement, Ytong, škridla…“, ktorý sa zmestí pri 320–1920. (g) Riadok hodín: dnešný deň zvýrazniť skriptom, bez textu „otvorené“, bez JS statické hodiny. (h) `.btn{flex:1 1 0;min-width:0}` v riadkoch tlačidiel. (i) `uv-odjazd` presunúť pod `(scripting: enabled)`. | `h1.mjs` a `sirky2.mjs` (s kontrolou `left ≥ 0 && right ≤ innerWidth`): na 360/390/414 je číslo na 1. obrazovke `true`, na 1440 `h1px ≥ 64` a spodok H1, telefónu aj hľadania ≤ 900. `placeholderPretece` je `false` na všetkých 8 šírkach. Pri 320 je spodok hľadania ≤ horný okraj `.mbar` a `scrollWidth ≤ clientWidth` odznaku. Medián „H1 použiteľný“ na telefóne s CPU 4× ≤ 1 100 ms (4 behy) a H1 je na prvej snímke po FCP v DOM viditeľný (nie `visibility:hidden`). CLS ≤ 0,01. Bez JS beží 0 animácií okrem pásu značiek. |
| Z1-07 | Prepísať texty úvodnej stránky podľa STYL P1–P8, P9 (karty akcií na úvode), P10 a drobného textu a podľa rozhodnutí v časti 5. H1 je podľa bodu 5.5. Lede: „Spotrebu spočítame a cenovú ponuku pripravíme zadarmo. Dovezieme vlastnými autami po celom Slovensku, aj autom s mechanickou rukou.“ (131 znakov). Pás pod úvodom: „Skutočné fotografie · Na našom dvore v Nitre“. Doprava: „Dovezieme na miesto, ktoré určíte“. Karty akcií: „Akciová cena“ a komín s cenou z PDF s.1. Logá značiek dostanú alt s názvom. Služby na úvode: namiesto `img/p/885` skutočná fotka dvora (napr. `prijazd-podklad` z `44aa237b^` alebo výrez `u4`). Na `sluzby.html` ostávajú `p/883–885` (pre majiteľa). | `audit.py` nad výpisom `index.html` → tykanie 0. `grep -ciE 'super cen\|najlacn\|zložíme\|presne tam\|poradíme hneď\|na sklade alebo objednáme\|\bAI\b'` → 0. `index.html` neobsahuje `img/p/88[345]`. H1 obsahuje „Stavebniny“ aj „Nitr“ a na stránke je práve 1 H1. Tabuľka „text → FAKTY.md ID“ pre každý reťazec úvodu je v zápise bez neznámeho riadku. Lede ≤ 160 znakov. |
| Z1-08 | Ostrosť a fotky: zábery strihu pri DPR 3 brať z väčších zdrojov, ak existujú. Pomer zobrazených px ku px súboru zmerať cez `ostrost.mjs`. | Pri 390@3 a 1440@1 je koncový stav ≤ 1,0. Zábery strihu ≤ 1,05 pri 390@3 (D: 0,83–0,88). Ak je niečo nad touto hranicou, zapísať ako riziko s riešením (originály od majiteľa). |
| Z1-09 | Jas a tmavé plochy: video úvodu pri 390 a 1440 (`video.mjs`), 10 snímok/s, cez `jas2.py`. | Každá snímka má priemerný jas ≥ 155 a podiel px s Y < 60 ≤ 18 % (D: 169 / 13,7 % a 160 / 16,9 %). Žiadna čierna ani tmavá clona. Hárky otvoriť. |
| Z1-10 | Výkon A/B voči `4b2646bf` pri záťaži ≤ 3,5: 4 kolá na telefóne (CPU 4×) a 3 na počítači. | Telefón: medián LCP ≤ 550 ms a prvok LCP je fotka dvora. V okne 1,0–4,1 s sú dlhé snímky (> 50 ms) 0 aspoň v 3 zo 4 behov a nikdy nad 67 ms. Bajty za 8 s ≤ 3,0 MB. Počítač: medián LCP ≤ 300 ms, dlhé snímky v okne 0 vo všetkých behoch, CLS ≤ 0,01. Iframe so `sandbox` s `allow-same-origin` aj bez neho: 0 `pageerror`. |
| Z1-11 | Dokumentácia: README časť „Úvod“ (scenár, fotky, ako vymeniť záber, ako vypnúť), `img/FOTKY.md` (pôvod `u4` z `44aa237b^`, vrátené fotky z `bb6bbaeb` a dôvod), `build.py:kontrola_uvodu()`: žiadne `img/film`, og-dvor na 75 stránkach, H1 s „Stavebniny“, 1 H1. | `python3 build.py` → OK a `kontrola_uvodu()` je OK. Pregenerovaných 74 podstránok má nový og. `grep -c 'img/film'` v README a FOTKY → 0. |
| Z1-12 | Commity (napr. „Stavebniny Richtárik: úvod zo skutočných fotiek dvora bez auta“, „… vrátené neupravené fotky dvora“, „… texty úvodnej stránky s vykaním“) a zápis `richtarik/profi/z1/ZAPIS.md` s meraniami, hárkami a rizikami. | `git log --format='%an <%ae>%n%B' richtarik-profi` → autor Claude, 0 riadkov `Co-Authored-By` a `Claude-Session`, 0 slov AI. `git status` je prázdny. |

### zf: filmové prechody a animácie celého webu

| ID | krok | merateľné kritérium |
|---|---|---|
| ZF-01 | Prechody medzi stránkami na všetkých stránkach. `koncept-film/nastroje/vt-head.js` vložiť ako inline skript do `<head>` v šablóne `build.py:page()` (pri `:585–610`) a ručne do `index.html` a `404.html`. CSS `film-d.css:184–212` nahradí dnešné `site.css:637–666` (`@view-transition{navigation:auto}`, papierový podklad, typy `dalej`, `spat` a `strih`, zdieľaná fotka dlaždica ↔ `.ph-foto`). Zrušiť 200 ms čakanie bez podpory v `site.js` (dnes `:819–831`). Speculation Rules `prerender` s `eagerness: conservative` len pre dlaždice `a.cat`, `a.deal`, `a.zt` a `a.nov` v rovnakom pôvode, nie pre PDF, `subory/`, `mailto:` a `tel:`. `skipTransition` pri `pointerdown` a `keydown`. Pri reloade a „obmedziť pohyb“ bez prechodu. `-webkit-tap-highlight-color: transparent` a vlastné `:active`. | Na všetkých 76+ HTML je skript prechodov práve raz (`grep -c 'pagereveal'` = 1 na stránku). `prechod2.mjs` na telefóne s CPU 4×, 2 kolá × 3 prechody: dlhé snímky po prvom vykreslení 0 aspoň v 5 zo 6. Trvanie od FP ≤ 520 ms. Bez podpory (vložené `@view-transition{navigation:none}`): od kliknutia po štart navigácie ≤ 20 ms (dnes 205–207 ms podľa `inspiracia/technika/ZAPIS.md`, §0.3), žiadna snímka s jasom < 150. |
| ZF-02 | Opraviť D-9, D-10 a D-11. Dvojexpozícia: animácia starej stránky skončí skôr, ako začne nová (`animation-delay` novej ≥ trvanie starej). Späť: dlaždica sa neukáže ako prázdny sivý rám (dekódovanie fotky pred odhalením alebo prelnutie dlaždice až po načítaní). Počítač: A/B 3 kolá voči z1. Ak sú dlhé snímky po FP pri zdieľanej fotke horšie ako pri z1 v 2 meraniach za sebou, zapnúť na ≥ 1001 px len prelnutie (`::view-transition-group(uv-foto){animation-duration:0s}`) a zapísať to. | CSS: oneskorenie novej ≥ trvanie starej (výpis pravidiel). Screencast Späť (`prechod2.mjs`): 0 snímok, kde je dlaždica Murovací materiál v okne a jej obrázok nie je vykreslený (`naturalWidth`/`complete`, alebo vizuálne: hárok otvoriť). Počítač: dlhé snímky po FP ≤ z1 (súčet 3 kolá). Jas všetkých snímok prechodov ≥ 150 a ≥ min(jas začiatku, jas konca) − 10. |
| ZF-03 | Prechody sekcií pri posune podľa D S1–S5 (`film-d.css:124–166`). Filmová clona fotiek (`scaleY` pásov papiera, nie `clip-path` na veľkej ploche), nadpisy a bloky zdola (priehľadnosť nikdy pod 0,2), pečiatka štítku akcie a pomalší pás Doprava. Len v `@supports (animation-timeline: view())` a `@media (prefers-reduced-motion: no-preference) and (scripting: enabled)`. Bez podpory ostáva dnešné `.rv` cez IntersectionObserver. `content-visibility: auto` s `contain-intrinsic-size` pre sekcie pod prvou. Nekonečný drift pásu Doprava zrušiť. Platí na úvode aj na podstránkach (katalóg, akcie, galéria, O nás, kontakt). | Posun 30 × 120 px (telefón CPU 4×, 3 behy): `scrollY` rastie presne o 120 na krok. Pripnuté prvky > 5 % okna sú len lišta, mbar a zavretý drawer. Dlhé snímky 0 aspoň v 2 z 3 behov a nikdy nad 83 ms (≤ z1). CLS pri posune ≤ 0,01. Odkazy s `#` pristanú na ±4 px. Snímky pri posune majú jas ≥ 150. Pri „obmedziť pohyb“ a bez JS: 0 skrytých prvkov na 5 typoch stránok. Tlač: všetko viditeľné. |
| ZF-04 | Mikroanimácie podľa D M1–M5 (`film-d.css:168–183`). Tlačidlo sa stlačí (`scale .97`, 80 ms), dlaždice katalógu, akcií, zásob a noviniek sa stlačia (`.985`) a pri myši vyjde šípka „→“ a fotka sa zväčší na 1,04. Štítok akcie dopadne raz pri vstupe a pri myši sa zväčší na 1,06. Štítky zásob sa zdvihnú o 3 px. `:focus-visible` krúžok. Hover efekty len v `(hover: hover)`. Pás značiek: pauza pri `:hover` a `:focus-within`, tlačidlo „Zastaviť pohyb“ (`aria-pressed`), pri „obmedziť pohyb“ statický zoznam, ktorý sa dá posúvať. | INP náhrada (ťuk na dlaždicu, tlačidlo a menu, telefón CPU 4×, 8 interakcií) ≤ 100 ms medián. Po Tab má každý odkaz a tlačidlo `outline-width` ≥ 2 px. Po kliknutí na „Zastaviť pohyb“ je `getAnimations()` pásu `paused`. Pri „obmedziť pohyb“ beží 0 animácií. |
| ZF-05 | Rozpočet a regresia. Doplnené CSS pohybu ≤ 8 kB gzip a JS ≤ 3 kB gzip (skript prechodov v `<head>` ≤ 1,5 kB gzip). LCP podstránok (katalóg, Murovací materiál, akcia Porfix, kontakt) a prvá snímka novej stránky A/B voči z1. | `gzip -c \| wc -c` výpis. LCP podstránok na telefóne s CPU 4× ≤ z1 + 50 ms (medián 3 behov). Prvé vykreslenie novej stránky ≤ z1 + 30 ms. Iframe so sandboxom aj bez neho: 0 `pageerror`, prechod v ráme funguje. |
| ZF-06 | Videá a hárky: telefón (úvod → posun → katalóg strihom → kategória zdieľanou fotkou → Späť → Vpred) a počítač. Snímky prechodov pri 390 a 1440 otvoriť. | Hárky každých 0,5 s otvorené. Najnižší jas videa ≥ 155. Žiadna čierna snímka. |
| ZF-07 | Dokumentácia: README časť „Pohyb a prechody“ (typy prechodov, ako vypnúť, správanie bez podpory, Firefox s okamžitým strihom, Safari 18.2+ treba overiť na iPhone) a zdroje inšpirácie (tabuľka z `koncept-film/NAVRH.md:291–312`: princíp, URL a dátum, nič kopírované). Testy prechodov do `dokoncenie/nastroje`. Commit a `richtarik/profi/zf/ZAPIS.md`. | README obsahuje všetky 4 typy (`dalej`, `spat`, `strih`, zdieľaná fotka) a postup vypnutia. Commit bez podpisových riadkov. Spoločné brány sú OK. |

### z2: texty celého webu, SEO, vyhľadávanie a balík

| ID | krok | merateľné kritérium |
|---|---|---|
| Z2-01 | Vykanie na všetkých podstránkach. Upraviť šablóny `build.py:634, 727, 730, 760, 793, 800, 993–996, 1012, 1019`, `obsah.py`, `popisy.py`, `assets/site.js` (správa bez výsledku) a ručne `404.html`. Prevod podľa tabuľky STYL §1. | `vypis.py` a `audit.py` (`diagnoza/texty/nastroje`) nad 75+ stránkami: stránky s tykaním 0 a zmiešané 0. Tvary „Vy/Vám/Váš“ s veľkým písmenom vo vete 0. |
| Z2-02 | Odstrániť tvrdenia bez opory I-04, I-05, I-08 až I-12 a superlatívy I-06 a I-07 podľa časti 5.4. „Super ceny“ nahradiť „Akciová cena“. | `grep -rciE 'presne tam\|zložíme\|poradíme hneď\|na sklade alebo objednáme\|super cen\|najlacn'` v HTML aj generátoroch → 0. „Najväčší výrobca cementu“ je len s „podľa výrobcu“. Staré akcie ostávajú (otvorená otázka) a nedostanú nový dátum. |
| Z2-03 | Záväzné názvy značiek podľa tabuľky STYL §7 v `obsah.py` (namiesto `name.title()`), `build.py` a `popisy.py`. | `grep` variantov z T-06 (TermoBrik, Rooflite, Ico Pal, Knaufinsulation, Pezinské Tehelne, Stavebné Profily, Km Beta, Haco bez DS, Recykling bez Transform, VUB) → 0. |
| Z2-04 | Typografia, jednotky a preklepy. Rozšíriť opravnú tabuľku `build.py:202–208` (m², m³, € a DPH, % s medzerou, pomlčky, „…“, preklepy z T-09, lomky na zátvorky, verzálky zdroja). | `audit.py`: m2/m3 0, Eur/Dph 0, % bez medzery 0, preklepy z T-09 0, medzera pred čiarkou 0, VERZÁLKY ≥ 5 písmen len pri povolených skratkách. |
| Z2-05 | Nadpisy podľa STYL §4. Kategória = názov kategórie. Značka = značka a čo to je. Akcia = výrobok a výhoda (H1 akcie ≠ H1 katalógu, napr. „Porfix v akcii“). „Stone“ → „Kamenný koberec Bianka“, „Stadreko“ → „Komíny Stadreko (systém Qatro)“, „+“ → „a“. Kontakt: „Predajňa a sklad v Nitre – Horných Krškanoch“. | Duplicitné H1 naprieč stránkami 0. H1 má 2–7 slov a ≤ 45 znakov (výnimka: dvojveta úvodu). Na každej stránke je 1 H1. Hierarchia bez skokov. |
| Z2-06 | Titulky a meta popisy. Generátor podľa STYL §11 a ručné popisy pre 20 hlavných stránok z `diagnoza/seo/KLUCOVE-SLOVA.md`. og:title a og:description zladiť. | `seo/nastroje/audit.py`: title ≤ 60 znakov vo vzore „… \| Stavebniny Richtárik Nitra“, description 120–155 znakov, celé vety, 0 končiacich „…“, 0 duplicít, 0 zvyškov ako „1.“ alebo verzálky. |
| Z2-07 | Alt texty. Fotka výrobku = názov z H3 alebo popisu. Galéria: 28× „fotografia N“ nahradiť opisom toho, čo je na fotke vidieť (fotky otvoriť). Logá v páse dostanú názov značky. Dekoratívne fotky Pexels ostanú `alt=""` a netvrdí sa o nich, že sú z dvora. | `audit.json`: obsahové `<img>` s H3 vedľa a prázdnym alt = 0. „fotografia \d+“ = 0. Logá s prázdnym alt = 0. Alt má 5–15 slov. |
| Z2-08 | Interné odkazy: 16 párov akcia ↔ katalóg (`diagnoza/seo/ZAPIS.md:86–104`) a na katalógu blok „Táto značka je v akcii“. Novinky prelinkovať z kategórií (Bianka → Dlažby, plast → Podhľady a PVC, schody Fakro → Strešné okná). | Skript: každá akcia má odkaz na svoju katalógovú stránku a naopak (16/16). Každá novinka má ≥ 2 príchodzie odkazy mimo menu a päty. |
| Z2-09 | Ceny akcií v HTML (S-05). Tabuľky z `pdf/662.pdf` s hlavičkou „Cenník akcií z 28. 1. 2026 (PDF)“ a vetou „Platnosť ceny potvrdí predajňa.“. Žiadne nové ceny. | Skript: každé číslo s € v nových tabuľkách sa nájde v `pdftotext -layout pdf/662.pdf` (100 %). Počet stránok akcií s cenou v HTML ≥ 10. |
| Z2-10 | Nové stránky len z faktov. `doprava.html`: vlastná doprava po celom Slovensku, Avia 3,5 t a 8 t auto s mechanickou rukou bez značky, tovar priamo na stavbu a podmienky dopravy z akcií (PW a PDF), bez fotky auta (fotka dvora). Odkaz v menu, päte a sitemap. `caste-otazky.html`: 10–15 otázok, odpovede **doslova** z overenej databázy asistenta (`diagnoza/asistent/navrh/.../richtarik-otazky.json`), prevedené na vykanie. | Každá veta na oboch stránkach má FAKTY ID (tabuľka v zápise). Značka 8 t auta sa nespomína. `grep -c 'img/p/88'` na `doprava.html` → 0. Odpovede v `caste-otazky.html` = odpovede v JSON (skript porovná text, 100 %). |
| Z2-11 | Štruktúrované dáta: HardwareStore s `@id` `https://www.stavebninyrichtarik.sk/#predajna`, `image` og-dvor, ten istý blok aj na `kontakt.html`, FAQPage len na `caste-otazky.html`. Bez geo, sameAs a Offer. | `json.loads` na všetkých JSON-LD → OK. `@id` je rovnaký na úvode a kontakte. Počet BreadcrumbList = počet podstránok. |
| Z2-12 | Core Web Vitals podstránok (S-07, S-08). Menšie fotky hlavičiek (`sizes`, 720w pre telefón), 2 prednačítané písma namiesto 4 (`build.py:606–609`), `.logos img{height:48px;width:auto}`, `aspect-ratio` pre `.fig img`. | `cwv.mjs` (telefón CPU 4×, pomalé 4G, 3 kolá): LCP akcie Porfix a kontaktu ≤ 2 500 ms (dnes 3 370 a 3 100). `cls-vsetky.mjs`: všetky stránky ≤ 0,05 a Ytong ≤ 0,01. |
| Z2-13 | `sitemap.xml` s `lastmod` z dátumu commitu súboru (S-13), `page-head` do `<main>` (S-17), `robots.txt` s `Disallow: /asistent/`. Vyhľadávanie `assets/index.json` pregenerovať (nové názvy, `doprava.html`, `caste-otazky.html`). | Sitemap: `lastmod` na 100 % adries a 0 adries 404. `index.json` obsahuje všetky indexovateľné stránky. Hľadanie „doprava“ nájde `doprava.html`, „cement“ ≥ 7 výsledkov a „Bianka“ nájde novinku. |
| Z2-14 | Presmerovania pripraviť, nezapínať. V `nasadenie/htaccess.txt` a `web.config.txt` kanonické pravidlo (schéma a host) na začiatok a staré `.aspx` priamo na absolútne ciele (bez reťaze). `DOMENA` ostáva `https://www.` (otvorená otázka). V README postup prepnutia na http, ak hosting HTTPS mať nebude. | `presmerovania.py`: v zdroji 83 stránok, chýba 0, neexistujúci cieľ 0, reťaze 0. README má odsek „HTTPS a presmerovania“. |
| Z2-15 | Balík na hosting: `nasadenie/balik.sh` bez výnimky `img/film` a bez neodkazovaných súborov. Záverečná kontrola faktov: skript vypíše každé číslo, €, % a tvrdenie o službe v našich textoch a overí ho vo FAKTY.md alebo PDF. Commit a `richtarik/profi/z2/ZAPIS.md`. | Balík: chýbajúce lokálne odkazy 0, `img/film` 0, veľkosť zapísaná (pred a po). Kontrola faktov: 0 neznámych. Spoločné brány sú OK. |

### z3: asistent na otázky (výslovná žiadosť majiteľa)

| ID | krok | merateľné kritérium |
|---|---|---|
| Z3-01 | Zapracovať návrh podľa `diagnoza/asistent/ZAPIS.md`, časť 3. Skopírovať `navrh/stavebniny-richtarik/*` (server `asistent/`, `assets/asistent*.js\|css\|json`, `nasadenie/asistent-config.php`) a nástroje do `asistent/nastroje/`. Záplatu `site.js-asistent.js` vložiť **pred** blok vyhľadávania (pozor na `if (!q \|\| !res) return;`). `data-asistent="ukazka"` dať do `build.py` (`<html lang="sk">`) a ručne do `index.html` a `404.html`. | `grep -c 'data-asistent="ukazka"'` = počet HTML. `git check-ignore asistent/config.php` → ignorovaný. `grep -rE 'sk-ant-[A-Za-z0-9]{8,}'` v strome aj v `git log -p richtarik-profi` → 0. |
| Z3-02 | Znalosti zosúladiť s textami po z2: vykanie, nové adresy (`doprava.html`, `caste-otazky.html`), „Akciová cena“, bez superlatívov a bez značky 8 t auta. 60 odpovedí = odpovede na `caste-otazky.html`. | `otazky.mjs` ≥ 343 OK (známy 1 FAIL „Kedy by ste mi to vedeli doviezť?“ je zdokumentovaný). Každé číslo a odkaz v odpovediach je v znalostiach. Mimo témy 20/20 pod prahom. Odpovede v JSON a na `caste-otazky.html` sa zhodujú na 100 %. |
| Z3-03 | Označenie ako na Barbershope (STYL §9): odznak „AI“ pri ikone aj mene, titul „AI asistent Stavebnín Richtárik“, podtitul „Odpovede sú automatické. Cenu a dostupnosť potvrdí predajňa.“, pozdrav podľa STYL §9, poznámka pod oknom a odkaz „Ochrana údajov“. V ukážke podtitul „Ukážka – odpovede sú pripravené vopred z častých otázok.“. | `prehliadac.mjs` nájde všetky reťazce. `grep -rnw 'AI'` mimo `asistent/`, `assets/asistent*` a `ochrana-udajov.html` → 0 (vrátane komentárov v CSS a JS, prepísať na „štítok označenia“). |
| Z3-04 | Umiestnenie voči novému úvodu. Ikona je skrytá, kým je úvod v okne (`data-bez-asistenta` na sekcii úvodu, lebo nemá triedu `.hero`). Neprekrýva spodnú lištu ani „Zavolať“. Modul sa načíta až po geste alebo 3,5 s po `load`. Svetlé okno a svetlé pozadie za ním. | Pri 320/360/390/414: spodok ikony ≤ horný okraj `.mbar` − 8 px. Počas strihu úvodu (0–4 s) ikona nie je. A/B s `?asistent=off` (4 behy, telefón CPU 4×): rozdiel LCP ≤ 30 ms medián, CLS 0, dlhé snímky v okne úvodu bez zmeny. Jas pozadia za oknom ≥ 150. Pri „obmedziť pohyb“ okno bez animácie. |
| Z3-05 | `asistent/ochrana-udajov.html` len z faktov: prevádzkovateľ Ing. Mário Richtárik - Stavebniny, adresa, IČO a e-mail z FAKTY A. Čo sa posiela (text otázky), komu (Anthropic PBC, USA, sprostredkovateľ), neukladanie rozhovorov a limity. Označiť ako návrh na kontrolu majiteľom alebo zodpovednou osobou pre GDPR. Stránka `noindex`, odkaz z okna aj z päty. | Stránka vráti 200 v náhľade a má `noindex`. Každý údaj o firme sa zhoduje s FAKTY A. V zápise je výslovne „text na schválenie majiteľom“. |
| Z3-06 | Server: testy proti falošnému API bez kľúča (`asistent/testy/spusti.sh`). Model `claude-opus-5-5`, úsilie low, záložný model, prúd, limity 12/10 min, 40/deň a 400/deň spolu, CORS len na www a holú doménu, `.htaccess` a `web.config`. | `spusti.sh` → 27/27 OK. V odpovedi servera nie je kľúč (test). Databáza limitov obsahuje len odtlačky a časy (test). |
| Z3-07 | Balík a zapnutie. Bez `ASISTENT_API` balík odstráni `data-asistent` a okno sa neukáže. S ním sa nastaví adresa servera. README „Zapnutie“: PHP 8.1+, HTTPS, kľúč len cez premennú `KLUC` do `config.php`, nikdy do repozitára ani do správ, limity, odhad nákladov, 20–30 skúšobných otázok s kľúčom majiteľa a kontrola 403 na `lib/`, `znalosti/` a `config.php` po nasadení. | `balik.sh` bez premennej: 0 stránok s `data-asistent` a 0 chýbajúcich odkazov. S premennou majú všetky stránky adresu servera. Testy, nástroje, README a `config.php` nie sú v balíku. |
| Z3-08 | Záverečná regresia celého webu: prehliadka všetkých stránok, iframe, šírky, bez JS a „obmedziť pohyb“, a meranie úvodu A/B voči zf. Commit a `richtarik/profi/z3/ZAPIS.md`. | Spoločné brány sú OK. `prehliadac.mjs` 50/50 (upravený na nový úvod). Medián LCP úvodu na telefóne ≤ zf + 30 ms. 0 chýb JS. |

---

## 7. Pre majiteľa (rozhodnutia a náklady)

1. **Hosting, PHP a HTTPS:**
   - Dnešný server je IIS 10 s ASP.NET 2.0, HTTPS nefunguje (`SSL_ERROR_SYSCALL`) a PHP nie je potvrdené.
   - Treba rozhodnúť: ostať a požiadať hosting o HTTPS (Let's Encrypt) a PHP 8.1+, alebo sa presťahovať na hosting
     s Apache a PHP 8.x.
   - Kým to nie je rozhodnuté, nový web predvolene počíta s `https://www.`. Bez HTTPS treba prepnúť jeden riadok na http
     (otvorená otázka ostáva).
2. **Asistent naostro:**
   - Treba účet na platform.claude.com na firmu.
   - API kľúč odovzdajte správcovi bezpečne, nie e-mailom ani v chate. V konzole si nastavte mesačný limit výdavkov.
   - Bez kľúča a servera ostane asistent na ostrom webe vypnutý. Náhľad beží v ukážkovom režime.
3. **Náklady asistenta** (odhad z diagnózy, nie meranie):
   - Jedna otázka stojí asi 0,01–0,015 $. Prvá otázka po pauze (studená vyrovnávacia pamäť) asi 0,03 $.
   - Pri 20 otázkach denne je to asi 5–10 $ mesačne.
   - V najhoršom prípade pri strope 400 otázok denne 4–12 $ za deň.
   - Hosting podľa ponuky poskytovateľa. Iné náklady nie sú: žiadny generátor ani platená knižnica.
4. **Ochrana údajov:** schváľte text stránky Ochrana údajov. Prevádzkovateľ je Ing. Mário Richtárik - Stavebniny,
   sprostredkovateľ Anthropic PBC (USA). Odporúčame, aby ho pozrel človek, ktorý vám robí GDPR.
5. **Strop asistenta:** vyhovuje 400 otázok denne spolu a 40 na návštevníka? Ak nie, povedzte iné čísla.
6. **Originály fotiek (59 kusov):**
   - Prosíme o originály. Dajú vyššie rozlíšenie (ostrosť na počítači s Retinou) a istotu, že fotka dvora `u4` nie je
     upravená.
   - Fotky s dokreslenými paletami sme vrátili na neupravené verzie (`pas-dvor`, `dvor-predajna`, `zasoba-porfix`).
     Na Porfixe je teraz vidieť prázdnu a načatú paletu a modré plachty.
   - Ak chcete plnší záber, jediná poctivá cesta je nová skutočná fotka.
7. **Fotky skutočných áut:**
   - Na úvode predvolene nie je žiadne auto, ani skutočné.
   - Na stránke Služby ostávajú pôvodné fotky áut s mechanickou rukou z vášho starého webu. Potvrďte ich, alebo ich dáme
     preč.
8. **Superlatívy:**
   - „Najlacnejší komínový systém na Slovensku“ sme predvolene nahradili cenou z cenníka (napr. komín 6 m, ø 160/90 za
     618 € s DPH). „Najlacnejšie garáže“ vypadli. Chcete superlatív vrátiť?
9. **Oslovenie:** web vyká. Ak chcete tykať, povedzte to pred textami (z2).
10. **Otvorené otázky bez zmeny:**
    - staré akcie bez dátumu,
    - LIAZ alebo Iveco pri 8 t aute,
    - znenie zľavy 5 % / 3,3 %,
    - Nero Ebono alebo Ebano,
    - hosting a HTTPS.
11. **Kontrola na skutočných zariadeniach:** po náhľade pozrite web na iPhone (Safari 18.2 a novšie, prechody medzi
    stránkami) a na lacnejšom Androide. Vo Firefoxe sú prechody len okamžitý strih, a to je zámer.
12. **Odporúčanie mimo webu (nepovinné):** Google Business Profile so skutočnými fotkami dvora, Search Console a jednotné
    údaje o firme (NAP) v katalógoch. Recenzie nevymýšľať ani nepreberať.
