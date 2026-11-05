# Smer C „Odhalenie“: návrh úvodu Stavebniny Richtárik (4. 11. 2026)

Prototyp je v `koncept-odhalenie/web/index.html`. Je to kópia webu bez `img/film`. Podstránky, `img/*` okrem `img/odhal`,
`pdf`, `subory`, `zdroj` a `nasadenie` sú symbolické odkazy na strom. Zloží sa príkazom
`python3 -I nastroje/zloz.py <strom>/stavebniny-richtarik/index.html <koncept-odhalenie>`. Skript vezme `index.html` zo
stromu a vloží doň `nastroje/odhal.css` a `nastroje/odhal.js`.
Strom `hs-richtarik-obnova` som nemenil: `git status --short | wc -l` = 0, HEAD `4b2646bf`. Servery na portoch 9660
(prototyp) a 9661 (dnešný strom) som po práci ukončil (`curl` na oba porty vracia `000`).

## 1. Hook

Celú prvú obrazovku zaberá veta **„DVOR PLNÝ MATERIÁLU.“** Jej písmená sú vyrezané do svetlého papiera (`#faf8f4`) a cez
každé písmeno vidno **skutočnú fotku plného dvora**. Fotka teda vetu hneď dokazuje. Potom sa písmeno **L** v slove
„PLNÝ“ rozrastie a zmení sa na okno. Kamera ním „preletí“ a otvorí sa celá fotka dvora s popisom
„Skutočná fotka · náš dvor v Horných Krškanoch“. Nakoniec sa fotka zmenší a zapadne do mozaiky zásob v hero sekcii.
Okolo nej sa poskladajú dlaždice (tehly TermoBRIK, pórobetón Porfix, Stadreko, rezivo, rad TermoBRIK pred predajňou),
H1, vyhľadávanie a tlačidlá.

| Text | Kde | Zdroj |
|---|---|---|
| „DVOR PLNÝ MATERIÁLU.“ (maska) a H1 „Dvor plný materiálu. Od základov po strechu.“ | scéna, H1 | STYL.md §4 vzor H1 úvodu; FAKTY F („dvor plný materiálu“ je povolený) |
| „Stavebniny Richtárik · Nitra · od roku 1997“ | nad vetou | O nás: rodinná firma založená v roku 1997 |
| „Skutočná fotka · náš dvor v Horných Krškanoch / v Nitre“ | popis fotky | fotky majiteľa (diagnóza úvodu 2b, A1); adresa Novozámocká 62/68, Nitra-Horné Krškany |
| eyebrow „Stavebniny Nitra – Horné Krškany · od roku 1997“ | hero | adresa, rok 1997; SEO: „stavebniny“ a „Nitra“ |
| „Rodinné stavebniny v Nitre. Spotrebu spočítame a cenovú ponuku pripravíme zadarmo, materiál dovezieme vlastnými autami, aj s mechanickou rukou.“ | lede | Služby: bezplatný výpočet spotreby; O nás: cenové ponuky zadarmo; doprava Iveco s mech. rukou (značku auta nepíšem, otázka LIAZ/Iveco); „vlastnými autami“ je na dnešnom webe |
| „Čo hľadáte? Cement, Ytong, škridla, Fakro…“, „Zavolať 0905 622 223“, „Katalóg“, „Aktuálne akcie“, „Novozámocká 62/68, Nitra · Po – Pi 7:00 – 16:00 · So 7:00 – 12:00“ | hero | dnešný web, kontakt |

Kontrola textu hero sekcie (Python nad `web/index.html`, bez skriptov a značiek): žiadny z výrazov „AI“, „hneď“,
„ihneď“, „najlacn“, „najlep“, „Iveco“, „LIAZ“, „zložíme“, „zdarma“, „celom Slovensku“ ani „%“ sa v nej nevyskytuje
(všetko `False`). Texty vykajú a nepridávajú nové tvrdenia. Zľavy 5 % a 3,3 % ani dopravu „po celom Slovensku“ som do
úvodu nedal.

## 2. Scenár po sekundách

Čas 0 je okamih, keď sa ukáže veta. Ukáže sa až po načítaní písma a po `DOMContentLoaded`. Pri CPU 4× to bolo
0,42 – 0,57 s po načítaní, bez obmedzenia 0,18 – 0,30 s. Dovtedy je vidieť len svetlý papier.

| s | Telefón 390 × 844 | Počítač 1440 × 900 |
|---|---|---|
| 0,00 – 0,32 | papierový závoj zmizne, cez písmená „DVOR / PLNÝ / MATERIÁLU.“ (3 riadky, každý na šírku obrazovky) vidno fotku; nad vetou je drobný riadok s rokom 1997 | rovnako, 2 riadky „DVOR PLNÝ / MATERIÁLU.“ (písmo 301 a 281 px) |
| 0,00 – 1,30 | veta sa jemne usadí (mierka 1,035 → 1) | rovnako |
| 1,15 | **okno sa otvára**: písmeno L rastie geometricky do mierky 19,6 (0,95 s), papier zmizne medzi 0,5 a 0,86 s | mierka 40,9 |
| 1,15 – 3,55 | kamera prejde po rade paliet o 85 px vodorovne (fotka je širšia ako displej, bez zväčšenia) | kamera ide z priblíženia 1,10 na 1,0 (stále v natívnom rozlíšení) |
| 1,97 – 2,67 | celá fotka plného dvora s popisom „Skutočná fotka · náš dvor v Horných Krškanoch“ | rovnako |
| 2,67 – 3,57 | **skladanie**: fotka sa zmenší presne do veľkej dlaždice, lišta a spodná lišta sa objavia (od +0,38 s), dlaždice zásob vyskočia po 75 ms, text ide hore po 65 ms | rovnako, mozaika 3 × 3 vpravo, text vľavo |
| 3,57 | scéna sa odstráni a pod ňou je tá istá fotka v dlaždici | |
| 3,98 | koniec: koncový stav je ten istý ako bez JS | |

Úvod sa preskočí ťuknutím, kliknutím, kolieskom, klávesom alebo zmenou šírky okna. Nehrá sa pri návrate späť, pri odkaze
s `#` a pri „obmedziť pohyb“. Poistky: ak sa písmo nenačíta do 2 s alebo fotka do 3,2 s, ostane statická stránka.
CSS poistka ukáže obsah po 8 s aj vtedy, keby skript zlyhal.

Sekvencie (otvorené): `sekvencia-390.jpg` a `sekvencia-1440.jpg` (zábery 0,15; 0,8; 1,3; 1,45; 1,75; 2,4; 2,95;
3,3 s a koniec). Jednotlivé zábery sú v `snimky/z390-*.jpg` a `snimky/z1440-*.jpg`, vrátane `*-bezjs` a `*-pokoj`.
Videá: `odhalenie-telefon.webm|mp4` (5,08 s) a `odhalenie-pocitac.webm|mp4` (5,12 s). Pozrel som si ich ako kontaktné
hárky `video-harok-telefon.jpg` a `video-harok-pocitac.jpg` (4 snímky za sekundu, otvorené).

## 3. Technika

- **Maska**: inline SVG cez celé okno. Obsahuje `<mask>` (biely obdĺžnik a čierny text) a papierový obdĺžnik
  s maskou. Riadky sa zarovnajú na šírku cez `canvas.measureText` už načítaným písmom Barlow Condensed 800.
  Stred zvislého ťahu L sa nájde z vykreslenia L na malom plátne (`getImageData` jedného riadku), z neho je
  `transform-origin`. Rastie len `transform` celého SVG (WAAPI, 15 kľúčových snímok geometricky) a `opacity`.
  Maska sa najprv raz vykreslí pod závojom, až potom sa závoj odkryje, takže drahé prvé rastrovanie nepadne do pohybu.
- **Fotka scény** je kópia `<picture>` veľkej dlaždice (rovnaké `srcset` aj `sizes`), takže ide o ten istý súbor
  z vyrovnávacej pamäte. Pred otvorením sa čaká na `img.decode()`.
- **Skladanie do dlaždice** je len `transform`. Okno `.o-okno` sa nerovnomerne zmenší na obdĺžnik dlaždice a fotka
  v ňom dostane opačnú mierku, takže na obrazovke ostane nezdeformovaná (19 kľúčových snímok, krivka sa počíta v JS).
  Koncový obraz sa zhoduje s `object-fit: cover; object-position` dlaždice. Prvá verzia s animovaným
  `clip-path: inset()` zhodila Chromium dvakrát v kompozítore (`dmesg`: `traps: Compositor … trap int3`). Po prechode na
  transformy som v ďalších asi 80 načítaniach (zábery, merania, videá, kontroly) pád nevidel.
- Počas úvodu majú sekcie pod hero `content-visibility: hidden` (lenivé obrázky sa nesťahujú), potom `auto`.
- Bez JS a pri „obmedziť pohyb“ je `.o-scena` `display: none` a stránka je hneď v koncovom stave.
- Lišta na úvode je svetlá a biele logo pre film som z HTML vyhodil. Pás „Plná zásoba“ som v prototype vyhodil, lebo tie
  isté štyri zásoby sú už v mozaike a H2 „Dvor plný materiálu“ by opakoval H1. Bola v ňom aj upravená fotka Porfix.
  O tomto rozhodne orchestrátor.
- Kód: `odhal.js` 12 593 B (nezmenšený, s komentármi, inline). Film mal v `site.js` 51 801 B. `odhal.css` 7 099 B
  (film 12 880 B). Z `site.js` a `site.css` prototypu som film odstránil (`site.js` 67 785 → 15 901 B).
  `index.html` gzip 16 178 B.

## 4. Fotky a bajty

Všetko sú **skutočné, neupravené** fotky. `u4` (A1 z diagnózy) je z gitu `44aa237b^`, pôvodný `pas-dvor`
a `zasoba-porfix` z `bb6bbaeb` (md5 sa zhoduje s `fotky-ai/orig`), tehly, Stadreko a rezivo sú z HEAD. Pexels ani
`img/film` v úvode nie sú. Sú v `web/img/odhal/`:

| Súbor | Rozmer | B | Použitie |
|---|---|---|---|
| `dvor-t-1448.avif` / `dvor-t-1086.avif` | 1448×2574 / 1086×1931 | 304 363 / 234 393 | telefón (na výšku): scéna a veľká dlaždica |
| `dvor-p-1740.avif` / `-1280.avif` / `-1740.webp` | 1740×1080 (výrez x 0–1740 z `u4-p-1920`) | 73 798 / 55 082 / 191 076 | počítač |
| `tehly|porfix|stadreko|rezivo|pasdvor-320|480.avif` (+ `-480.webp`) | 320×400, 480×600 | 10,5 – 22,6 kB / 23 – 62 kB | dlaždice |
| `og-dvor.jpg` | 1200×630 | 140 327 | og:image a JSON-LD `image` (+ `og:image:alt`) |

Výrez `u4-p` som urobil kvôli skutočnému autu na pravom okraji pôvodnej fotky. Otvoril som orez pravého okraja
`dvor-p-1740` a auto na ňom nie je. Na `u4-t` auto nie je. Kvalitu AVIF som vyberal z porovnania `prac/porovnanie-kvalita.jpg`
(otvorené, crf 34/42/46/50). Fotka pre telefón má crf 44. Náhľady pod písmenami, kým sa fotka načíta, sú base64 WebP
16 px (194 B) a 32 px (286 B).

## 5. Merania (A = dnešný film zo stromu, B = Odhalenie; striedavo A, B, A, B, za rovnakých podmienok)

Playwright Chromium, `nastroje/meraj.mjs`, bez obmedzenia siete, cache vypnutá. Snímky > 50 ms sú medzery `rAF` prvých
6 s bez skrolovania. Bajty sú `transferSize` z Resource Timing stránky aj Workera filmu plus samotný dokument. Súbežne
bežali iné úlohy s prehliadačom (load average 2,9 – 4,4), preto sú absolútne časy orientačné a porovnanie je len
párové. Surové dáta: `prac/meranie-390.json`, `prac/meranie-1440.json`.

**Telefón 390 × 844, DPR 3, CPU 4×, 4 + 4 behy (posledná verzia kódu):**

| | A film | B Odhalenie |
|---|---|---|
| snímky > 50 ms za 6 s | 2 / 2 / 2 / 2 (všetky do 0,75 s) | 3 / 3 / 3 / 3: dve pred zobrazením vety (do 0,5 s, papier), jedna 100 – 150 ms tesne po konci úvodu (4,43 – 4,56 s, statický stav) |
| snímky > 50 ms **počas pohybu** (veta → koniec) | – | **0 / 0 / 0 / 0** |
| najdlhšia snímka | 83 – 233 ms | 150 – 200 ms |
| LCP | 444 / 836 / 648 / 572 ms (`prvy-t960.avif`) | 428 / 448 / 440 / 588 ms (text vety v SVG) |
| CLS | 0 | 0 |
| bajty prvej obrazovky | **5 202 220 B** do 2,5 s (34 súborov) | **726 574 B** do konca úvodu (19 súborov) |
| bajty za 6 s | 5 202 220 B | 2 508 056 B (po úvode sa lenivo načítajú sekcie hneď pod hero) |

Behy B: veta 426 / 443 / 424 / 572 ms, koniec 4 420 / 4 437 / 4 429 / 4 568 ms. Dlhé snímky [začiatok, trvanie]:
[68, 150] [268, 117] [4451, 100] · [108, 133] [242, 150] [4458, 150] · [78, 133] [212, 150] [4428, 133] ·
[114, 200] [398, 100] [4564, 133]. Stopa (`prac/stopa.mjs`, CPU 4×) ukázala `EvaluateScript site.js` 206 ms
a `ImageDecodeTask` 80 ms. Preto sa veta ukazuje až po `DOMContentLoaded`.

**Počítač 1440 × 900, DPR 1, CPU 1×, 3 + 3 behy:**

| | A film | B Odhalenie |
|---|---|---|
| snímky > 50 ms | 2 / 1 / 2 (do 0,26 s) | 1 / 3 / 0 (do 0,13 s; v 2. behu jedna 67 ms na konci úvodu) |
| LCP | 252 / 300 / 292 ms | 244 / 360 / 208 ms |
| CLS | 0 / 0 / 0 | 0,0052 / 0,0052 / 0 (posun textu pri výmene písma) |
| bajty prvej obrazovky | **8 420 880 B** | **496 009 B** do konca úvodu; 2 277 562 B za 6 s |

**Ostrosť** (`nastroje/kontrola.mjs`): pomer zobrazených zariadenie-px k pixelom súboru (≤ 1 znamená bez zväčšenia).
Telefón DPR 3: koncový stav max 0,788, scéna 0,984 × priblíženie 1,016 = 1,0. Počítač DPR 1: koniec max 0,623,
scéna 0,834 × 1,10 = 0,92. Počítač DPR 2: koniec max 0,902.
**Tmavé plochy**: v každej snímke videí (10 za sekundu) je najviac 4,4 % (telefón) a 7,7 % (počítač) pixelov s jasom
pod 40/255, a to len prirodzené tiene paliet na fotke v plnom zábere. Najtmavšia snímka má priemerný jas 112 a 114
z 255. Všetky prechody idú cez papier `#faf8f4`.
**Prvá obrazovka** (koncový stav, s JS, bez JS aj pri „obmedziť pohyb“, rovnaké hodnoty): telefón: H1 viditeľný,
vyhľadávanie 666 – 721 px, „Zavolať“ v spodnej lište `.mbar` (od 775 px, tlačidlo do 834 px); tlačidlá v hero sú na
telefóne skryté, lebo ich nahrádza lišta. Počítač: vyhľadávanie 579 – 637 px, „Zavolať 0905 622 223“ do 711 px
a telefón aj v lište. `img/film` v HTML nie je, og:image a JSON-LD ukazujú na `img/odhal/og-dvor.jpg`. Pri „obmedziť
pohyb“ a bez JS má scéna `display: none`.

## 6. Riziká a otvorené body

1. **Pôvod fotky `u4`**: v gite je len jedna verzia (pridaná v `bb6bbaeb`, obnova stavu „plnší sklad na fotkách dvora“).
   `fotky-ai/edit` obsahuje len `dvor-predajna`, `pas-dvor`, `pas-dvor-t` a `zasoba-porfix`, nie `u4`, a diagnóza ju
   vedie ako skutočnú. Úplnú istotu dajú len originály od majiteľa. Odporúčam si ich vyžiadať.
2. **Retina počítač (DPR 2)**: počas 1,5 s plného záberu je fotka scény zväčšená 1,67× (zdroj má najviac 1920 px).
   Koncový stav je ostrý (0,90). Na obrazovkách širších ako 1740 css px je to 1,10×.
3. Úvod trvá asi 4 s, kým sa dá písať do vyhľadávania. Preskočí sa však akoukoľvek interakciou. Hrá sa pri každom novom
   načítaní úvodnej stránky (pri návrate späť nie). Možnosť: hrať raz za reláciu.
4. Jedna dlhá snímka 100 – 150 ms (telefón, CPU 4×) tesne po konci úvodu, keď sa uvoľní `content-visibility` sekcií
   pod hero. Obraz je vtedy už statický.
5. Rastrovanie masky pri veľkej mierke: s `clip-path` padal kompozítor (pozri technika), s transformami nie. Pred
   nasadením treba úvod overiť na skutočnom iPhone (Safari) a lacnom Androide.
6. LCP s JS je text vety v SVG (JS ho vytvára po načítaní písma). Bez písma do 2 s sa úvod nehrá.
7. Integrácia (nie je súčasť prototypu): `build.py` `OG_IMG` (og.jpg je na 75 stránkach), README a FOTKY.md,
   `zdroj/film.*`, výnimka `img/film` v `nasadenie/balik.sh`, testy filmu v `dokoncenie/nastroje`. Pás „Plná zásoba“
   som vyhodil (rozhodne orchestrátor). Podstránky v prototype sú odkazmi na strom, a teda ešte s pôvodným og:image.
8. Otvorené otázky majiteľa (staré akcie, LIAZ vs. Iveco, zľava 5 % / 3,3 %, Nero Ebono/Ebano, hosting a HTTPS) som
   nemenil. Značku auta ani zľavy úvod nepoužíva.
