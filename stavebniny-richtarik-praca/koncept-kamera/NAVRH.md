# Smer B „Kamera po dvore“: návrh úvodu Stavebniny Richtárik (4. 11. 2026)

Prototyp: `koncept-kamera/web/index.html` (kópia webu bez `img/film`, `pdf` a `subory` sú odkazy na strom).
Strom `hs-richtarik-obnova` som nemenil (`git status --short | wc -l` = 0, HEAD `4b2646bf`). Servery 9650 a 9651
som ukončil. Prototyp sa dá znova zložiť príkazom `prac/obnov.sh` (generátor `gen.mjs` → `kamera.css` → `zloz.py`).

## 1. Hook

Úvod je jeden plynulý pohyb kamery po **skutočnej fotke dvora**. Fotku sme nevymenili, nedokreslili ani nevygenerovali.
Je na nej plný dvor, takže fotka sama dokazuje tvrdenie v nadpise.

| Čas | Text | Kde | Zdroj faktu |
|---|---|---|---|
| 0,3 – 3,8 s | **„Žiadna ilustračná fotka. / Toto je náš dvor v Nitre.“** | veľký titulok na svetlých pásoch, odkryje sa maskou | fotka je od majiteľa (`img/uvod` → git `u4`); dnešný web: „Fotky sú z nášho dvora v Nitre“ |
| od 0,2 s | H1 **„Dvor plný materiálu. Od základov po strechu.“** | svetlá karta | STYL.md §4 (vzor H1 úvodu), FAKTY F („dvor plný materiálu“ povolené) |
| 3,7 / 4,3 / 4,9 s | titulky na paletách: „01 Poradíme s výberom“, „02 Spotrebu spočítame zadarmo“, „03 Doprava autom s mechanickou rukou“ | štítok s bodom priamo na konkrétnom stohu paliet | FAKTY B (poradenstvo, bezplatný výpočet spotreby, auto 8 t s mechanickou rukou; bez značky podľa H-2) |
| stále | „Skutočná fotka nášho dvora v Nitre“ | popis fotky | rovnako ako riadok 1 |
| stále | eyebrow „Stavebniny Nitra – Horné Krškany“, odsek „Rodinná firma od roku 1997. Materiál v celom sortimente, výpočet spotreby a cenová ponuka zadarmo, doprava na miesto, ktoré určíte.“, CTA „Zavolať 0905 622 223“ + „Prezrieť katalóg“ (telefón: „Prezrieť katalóg“ + „Aktuálne akcie“, volanie je v spodnej lište), na počítači adresa a hodiny | karta | FAKTY A, B; I-04 („na miesto, ktoré určíte“) |

Kontrola textu úvodu (prac, Python nad `web/index.html`): nevyskytuje sa v ňom „AI“, „ihneď“, „hneď“, „najlacn…“,
„najlep…“, „Iveco“, „LIAZ“, „zložíme“ ani „zdarma“ (všetko `False`). Vyká sa (STYL §1). Vyhľadávanie som prepísal
na „Čo hľadáte?…“.
SEO: H1 je skutočný text v HTML a vidno ho aj bez JS. „Stavebniny“ a „Nitra“ sú v eyebrow, `<title>` a JSON-LD.
Ak má byť lokalita priamo v H1, porota môže zvoliť „Dvor plný materiálu v Nitre. Od základov po strechu.“
(rozhodnutie pre textára). og:image a JSON-LD `image` ukazujú na novú `img/kamera/og-dvor.jpg` (výrez skutočnej
fotky, 1200×630). Otvoril som ju: nie je na nej auto.

## 2. Scenár po sekundách (počítač 1440 × 900 / telefón 390 × 844)

| s | Kamera | Text a svetlo |
|---|---|---|
| 0,0 | tesný záber: počítač zväčšenie 1,19, vľavo dole (zabalené palety s potlačou), telefón 1,12 dole (paleta tvárnic v popredí) | karta s eyebrow a tlačidlami je hneď, slová H1 nabiehajú (0,2 – 1,1 s) |
| 0,3 – 1,4 | kamera sa začne hýbať: počítač doprava a hore, telefón hore (žeriavový záber) | titulok „Žiadna ilustračná fotka.“, potom „Toto je náš dvor v Nitre.“ (maska) |
| 2,4 – 4,6 | prechádza po rade stohov | jeden svetlý pás „slnka“ prejde po paletách (len zosvetlenie, priehľadnosť najviac 0,38) |
| 3,2 – 3,8 | — | úvodný titulok odíde hore do masky |
| 3,7 / 4,3 / 4,9 | kamera ide ďalej, štítky stoja na svojich paletách | titulky 01, 02, 03 (bod, čiara, štítok) |
| 7,2 | celok dvora: zväčšenie 1,0, nebo aj rady paliet | koncový stav = statický stav (bez JS aj pri „obmedziť pohyb“) |

Sekvencie (otvorené): `sekvencia-390.jpg` a `sekvencia-1440.jpg` (8 záberov: 0; 0,7; 1,5; 2,5; 3,5; 4,4; 5,4; 7,3 s),
jednotlivo v `snimky/z390-*.png` a `snimky/z1440-*.png`. Koncový stav je v `snimky/koniec-bezjs-*.png`
a `snimky/koniec-obmedzit-*.png`. Videá: `kamera-telefon.webm/.mp4` (390 × 844, CPU 4×, 9 s) a
`kamera-pocitac.webm/.mp4` (1440 × 900, 10 s). Kontaktné hárky videí `video-harok-telefon.jpg` (každých 0,5 s)
a `video-harok-pocitac.jpg` (každú 1 s) som otvoril. Pohyb je plynulý, bez čiernej snímky. Prvá snímka telefónu
(0,0 s) je biela stránka pred načítaním.

## 3. Technika

- **Fotky:** jediný zdroj je skutočná fotka `u4` z gitu (`44aa237b^:stavebniny-richtarik/img/uvod/u4-p-1920.webp`
  a `u4-t-1448.webp`, md5 `249b9d2ae8b0` a `bd300f4d00f0` sa zhodujú s `diagnoza/uvod/prac/hist`). Nie je
  v súboroch generatívnej úpravy (`fotky-ai/edit` a `orig` neobsahujú u4, `grep -c u4` = 0). Fotky Pexels ani
  `img/film` sa nepoužívajú.
  - Počítač: výrez 1720 × 1080 (x 0–1720). Pôvodných 1920 px má vpravo dole od x ≈ 1755 kabínu a ruku
    skutočného auta firmy (otvorené `prac/u4-rb`, teraz zmazané). Výrez ho celé odstráni. Pravý dolný roh koncového
    záberu som overil zväčšením (`prac/roh.png`): je tam dom a stĺp, nie auto.
  - Telefón: výrez 1448 × 2000 (y 200–2200). Auto na ňom nie je.
  - Súbory `web/img/kamera/`: `dvor-p-1720.avif` 154 491 B, `dvor-p-1290.avif` 95 429 B, `dvor-t-1448.avif`
    272 653 B, `dvor-t-1086.avif` 207 111 B. K tomu WebP zálohy (len pre prehliadače bez AVIF), `og-dvor.jpg`
    148 402 B a náhľady 206 B / 248 B (base64 v HTML ako svetlý rozmazaný podklad, nikdy nie tmavá plocha).
- **Pohyb:** všetko je CSS animácia. Animuje sa len `transform` a `opacity`, takže pohyb robí kompozítor a
  nezaťažuje hlavné vlákno. Vrstva `.kam-cam` (fotka) má `translate + scale`. Titulky sú v **samostatných vrstvách
  rovnakej veľkosti** s rovnakou dráhou, len bez zväčšenia: `T + (k − 1)·(p − 50 %)`. Štítok tak stojí presne
  na palete a jeho text sa pri zväčšení nerozmaže ani neprekresľuje. Kľúčové snímky generuje `prac/gen.mjs`.
  Ten na 200 bodoch času a pri krajných pomeroch výšky scény overí, že fotka nikde neodkryje okraj, titulky sú
  od objavenia po koniec vo vnútri scény a zväčšenie nepresiahne rozlíšenie (výstup `prac/gen.out`, všetko OK).
- **Hĺbka:** vrstvy sa hýbu rozdielne. Fotka ide so zväčšením. Titulky stoja na paletách, takže sa posúvajú
  s fotkou, ale nezväčšujú sa. Karta a popis stoja na mieste. K tomu maska (odkrytie titulku) a svetlo (pás slnka).
  Fotku som nerozrezal na popredie a pozadie: medzera za vystrihnutou vrstvou by sa musela dokresliť.
- **JS** (1 099 B v `site.js`): pohyb pustí, až keď je fotka dekódovaná (`img.decode()`, trieda `.hraj`), takže
  prvý záber nikdy nie je prázdny. Keď fotka nepríde do 3,5 s, pohyb sa nespustí a zostane statický koncový záber.
  Otestované pri 400 kb/s (`prac/pomala.mjs`): `kam:false`, nadpis viditeľný, podklad svetlý
  (`snimky/pomala-siet-390.png`, otvorené).
- **Bez JS a pri „obmedziť pohyb“** (trieda `html.kam` sa nepridá): je vidno koncový záber, titulky na paletách,
  H1, tlačidlá aj vyhľadávanie. Overil som to v `prac/staticke.mjs` pri 390 aj 1440 (h1, foto, cta a hladaj
  „vidno“, pri „obmedziť pohyb“ beží 0 animácií).
- **Lišta** na úvode je rovnaká ako na podstránkach (svetlá, prilepená). Biele logo nad filmom aj priehľadná lišta
  sú preč.
- **Obsah pod úvodom** má `content-visibility: auto`. Jeho lenivé obrázky sa tak nesťahujú a nevykresľujú hneď
  počas pohybu.
- **Odstránené oproti dnešku:** prehrávač filmu `site.js` (67 785 → 16 999 B, gzip 23 374 → 6 189), časť
  „Úvodný film“ v `site.css` (89 541 → 87 115 B vrátane novej časti 11,6 kB), prednačítanie `img/film/prvy-*`,
  `film-data`, náhľady snímky filmu, alt s Ivecom (`index.html` 42 541 → 38 519 B). `grep -c film` v `index.html`
  a `site.js` = 0. `img/film/` v prototype nie je.

## 4. Bajty a merania

Meral som A/B **striedavo** (A = dnešný web na 9650, B = prototyp na 9651). Tri kolá, v každom kole A a B za sebou
pre každý profil. Súbežne bežali iné úlohy s prehliadačom na zdieľanom CPU, preto uvádzam mediány. Nástroj je
`prac/meraj.mjs`, surové dáta `prac/meranie-ab.json`. Telefón: 390 × 844, DPR 3, CPU 4× (CDP). Bajty zahŕňajú
aj sťahovanie filmu pracovným vláknom (udalosti Playwright `requestfinished`).
Snímky: B počas 8 s pohybu kamery. A počas prejdenia filmu kolieskom (30 × 120 px po 60 ms, ako v diagnóze),
pretože dnešný film sa bez skrolovania nehýbe.

| Profil | Verzia | LCP | CLS | Bajty do 2,5 s po `load` | Bajty po úvode | Fotky/film úvodu | Snímky > 50 ms | Najdlhšia | LoAF > 50 ms |
|---|---|---|---|---|---|---|---|---|---|
| telefón CPU 4× | A dnes | 756 ms | 0 | 5 077 kB | 8 911 kB | **4 145 kB** | 13 z 289 | 217 ms | 16 |
| telefón CPU 4× | **B kamera** | **428 ms** | 0 | 2 315 kB | 2 320 kB | **266 kB** | **2 z 468** | 100 ms | 5 |
| telefón CPU 4× + 4G | A | 1 304 ms | 0 | 2 300 kB | 6 483 kB | 4 145 kB | 9 z 300 | 217 ms | 16 |
| telefón CPU 4× + 4G | B | 1 436 ms | 0 | **944 kB** | **950 kB** | 266 kB | **3 z 463** | 67 ms | 7 |
| počítač 1440 | A | 400 ms | 0 | 8 220 kB | 10 765 kB | **7 946 kB** | 6 z 334 | 283 ms | 9 |
| počítač 1440 | B | **252 ms** | 0–0,0001 | 2 151 kB | 2 160 kB | **151 kB** | 3 z 457 | 150 ms | 4 |

- Fotka úvodu je na telefóne **15,6× ľahšia** (266 kB proti 4 145 kB) a na počítači **52× ľahšia** (151 kB proti
  7 946 kB). Celá stránka po úvode má na telefóne 2,3 MB proti 8,9 MB a na 4G 0,95 MB proti 6,5 MB.
- B na nezaťaženej sieti stiahne do 2,5 s aj lenivé obrázky najbližších sekcií (`prac/ziadosti.mjs`: pás zásob
  a dlaždice kategórií, spolu ~2,1 MB). Dnešok ich počas filmu zámerne zdržiaval triedou `skryte`.
- LCP na 4G je pri B o ~130 ms horší (1 436 proti 1 304 ms). Prvá snímka filmu má 134 kB, fotka telefónu 266 kB,
  lebo potrebuje rezervu na zväčšenie 1,12 pri hustote 3.
- **Ostrosť** (`prac/ostrost.mjs`, šírka vrstvy v pixeloch zariadenia ÷ šírka súboru, v čase 0 a na konci):
  360 × 3 → 0,836 / 0,746; **390 × 3 → 0,905 / 0,808**; 430 × 3 → 0,998 / 0,891; 390 × 2 → 0,805 / 0,718;
  1024 → 0,945 / 0,794; 1280 → 0,885 / 0,744; **1440 → 0,997 / 0,837**; 1920 → 0,997 / 0,837 (scéna má najviac
  1440 px a je vycentrovaná). Fotka sa nikdy nezväčšuje nad svoje rozlíšenie. Okraj scény je pokrytý vždy (`true`).
- **Tmavé plochy** (podiel blokov 10 × 10 px s jasom pod 60, ImageMagick, nad snímkami zo sekvencie): B telefón
  3,3–4,8 %, počítač 7,6–13,9 %. Je to len samotná fotka (tmavé fólie paliet), nič ju nestmavuje. Dnes (snímky
  diagnózy): telefón 26,4 % na začiatku a 13,5 % v strede, počítač 18,2 % a 20,2 % (stmavenie pod textom). Prechod
  do obsahu je svetlý (`snimky/prechod-1440-koliesko.png` a `prechod-390.png`, otvorené: pás zásob a fakty na
  svetlom podklade).
- **Prvá obrazovka:** telefón 390 × 844 má vyhľadávanie na 679–737 px a spodnú lištu so „Zavolať“ od 775 px.
  Počítač 1440 × 900 má vyhľadávanie na 795–853 px a telefón v lište aj v karte. Vyhľadávanie funguje
  („cement“ → 7 výsledkov, 0 chýb konzoly, `prac/hladaj.mjs`).

## 5. Riziká a otvorené body

1. **Pôvod fotky u4.** Fotka prišla do repozitára v `bb6bbaeb` (obnova náhľadu „plnší sklad na fotkách dvora“).
   Nie je medzi súbormi generatívnej úpravy a pri pohľade som na nej nenašiel stopy po úprave. Úplnú istotu dá až
   originál od majiteľa. Hook „Žiadna ilustračná fotka“ stojí práve na tom, preto **pred nasadením treba porovnať
   s originálom majiteľa** (zároveň by sme dostali väčšie rozlíšenie).
2. **Hook vs. zvyšok webu:** dlaždice kategórií používajú ilustračné fotky Pexels (`img/hd`). Titulok hovorí len
   o tejto fotke, čo je pravda. Majiteľ by to ale mal vedieť. Pás zásob pod úvodom má stále `pas-dvor`,
   `dvor-predajna` a `zasoba-porfix` s doplnenými paletami (diagnóza 2a). To je mimo úvodu, rozhodne orchestrátor.
3. **Počítač s hustotou 2 (Retina 1440):** potrebuje 2 880 px, fotka má 1 720 px, zväčšenie je 1,67×. To isté
   platí pre dnešný film (p1920). Pomôže len originál.
4. **LCP na 4G** je o ~0,13 s horší. Dá sa to zmierniť AVIF s vyšším crf alebo menším zväčšením na telefóne
   (napr. 1,08).
5. **Bajty pod úvodom:** ak má byť úvod úplne „čistý“, dá sa vrátiť odloženie sekcií pod úvodom do konca pohybu
   (ako dnes `skryte`, ~10 riadkov JS).
6. **Chyba, ktorú prototyp odhalil:** na telefóne sa dve tlačidlá v jednom riadku nezmestili a stránka sa
   zväčšila na 426 px. V úvode som to opravil (`.kam .cta .btn{flex:1 1 0;min-width:0}`). Dnes to maskoval film,
   ktorý obsah pod sebou nevykresľoval. Pri nasadení treba skontrolovať aj ďalšie riadky tlačidiel.
7. **Dlhé snímky:** pri B zostali 2–3 snímky nad 50 ms z ~460 počas pohybu (napr. dekódovanie lenivých obrázkov
   a písma). Dnes je ich 9–13. Pohyb beží v kompozítore, takže snímky hlavného vlákna nezasekávajú fotku.
   Videozáznam pri CPU 4× je plynulý.
8. **Nasadenie do stromu:** `build.py` neprepisuje `index.html`. Treba ešte zmazať `img/film/`, zmeniť
   `OG_IMG` v `build.py:24` na `img/kamera/og-dvor.jpg` (75 stránok), upraviť výnimku `nasadenie/balik.sh`,
   README a FOTKY.md a testy filmu v `dokoncenie/nastroje` (zoznam je v diagnóze, časť 1). Prototyp mení len úvodnú
   stránku a jej `site.css` a `site.js`.
9. Otvorené otázky majiteľa (staré akcie, LIAZ vs. Iveco, znenie zľavy 5 % / 3,3 %, Nero Ebono, hosting a HTTPS)
   som nemenil. Iveco v páse Služieb (`index.html`, sekcia Sklad a doprava) zostáva, kým majiteľ nerozhodne.
