# Kontroly (čo, ako, výsledok)

Stav k 2026‑10‑09, verzia s prehliadkou podniku (film zo skutočných fotiek s hĺbkou) a úvodom
ako filmom (prológ z ulice cez dvere dnu). Všetko merané lokálne v headless Chromiu (Playwright,
WebGL cez SwiftShader), preto sú časy snímkov orientačné; prenesené bajty a stavy sú presné.

## 1. Dymový test režiséra stránky – `node source/tools/app-smoke.mjs`

Výsledok: **všetky kontroly prešli** (desktop 1440×900, mobil 390×844).
- načítanie bez chýb konzoly, bez 404, bez absolútnych ciest;
- 9 sekcií: `data-scene-active` ide 1 → 9, priebeh skrolu rastie, `--sp` kotiev v rozsahu 0–1;
- každá kotva `.film-shot` má výšku okna, záloha `.film-still` viditeľná, záloha úvodu
  `fetchpriority="high"` a načítaná (aj bez WebGL: `naturalWidth` 1440);
- `?motion=off` a `prefers-reduced-motion`: `data-motion="off"`, bez triedy `world`, bez plátna,
  bez three.js, bez videa, dosky viditeľné;
- mobilné menu (aria-expanded, Esc), lightbox (otvorenie, šípky, Esc, návrat fokusu),
  mobilné CTA skryté v poslednej sekcii;
- videá: hrá najviac jedno a len viditeľné, po odscrollovaní sa pozastaví;
- bez WebGL (`--disable-3d-apis`): bez triedy `world`, zálohy ostávajú, tlačidlo rezervácie
  v poslednej sekcii viditeľné;
- šírky 375 / 390 / 430 px: žiadne vodorovné pretekanie.

## 2. Úvod ako film – `node source/tools/uvod-shot.mjs`

Desktop aj mobil, čistý kontext (bez sessionStorage):
- pred filmom: `html.pro` áno, statická záloha úvodu = fasáda (`vstup-1448.avif` / `-1086`);
- prvý snímok filmu 2,1 s (desktop) / 0,6 s (mobil) po `load` v headless prehliadači;
- prológ zastavený na polohách 0 · 0,18 · 0,35 (pri dverách) · 0,5 (šero, mix 0,5) · 0,62
  (mix 0,97) · 0,8 · 1: záber ide `vstup` → `rohozka`, po polohe 1 je prológ skončený
  (`state.pro=false`, trieda `pro` zložená), kamera stojí na kotve úvodu (S = 1);
- skrol o 700 px po prológu: S ide pružinou k cieľu (desktop S 1,65 → T 1,78), záber `recepcia`;
- druhé načítanie v tej istej relácii: bez prológu, záloha úvodu = rohožka;
- `?film=off`: bez prológu, bez plátna, záloha rohožka.
Snímky: `docs/screenshots/uvod-{desktop,mobile}-s{000,018,035,050,062,080,100}.jpg`,
`uvod-*-scroll700.jpg`, `uvod-*-druhykrat.jpg`, `uvod-*-pokojna.jpg`.

## 3. Snímky všetkých scén – `node source/tools/scenes-shot.mjs`

22 polôh × desktop + mobil (`docs/screenshots/scena-*.jpg`): kotvy 1–9, prelínania (1x, 3x, 4x,
8x), pásy (2b fakty, 6b tím, 8b galéria), cenník uprostred (7m), pätička (9f). Posúdené ručne:
dosky čitateľné, bod záujmu záberov v obraze na desktope aj mobile, cenník na mobile v jednom
stĺpci, žiadne prázdne plochy pri načítavaní (pod filmom je vždy záloha).
Nález a oprava: šero v strede prelínania bolo takmer čierne (7 % + 7 % jasu) – upravené na
asi 36 % (starý záber mizne do 0,7, nový nastupuje od 0,3), aby medzi miestnosťami nebola tma.

## 4. Váha prvého obrazu – `node source/tools/vaha.mjs`

Bajty zo statického servera bez kompresie (GitHub Pages posiela text gzipom, takže HTML, CSS a
skripty sú naživo asi 4× menšie):

| | do `load` bez filmu | prológ navyše (three.js + zábery) |
|---|---|---|
| desktop 1440×900 | 383 KB (HTML 73, CSS 39, písma 70, JS 65, záloha AVIF 72, WebP 64) | 1 769 KB (three.js 671 KB nekomprimované ≈ 170 KB gzip; vstup 222 + rohozka 126 + susedia) |
| mobil 390×844 @3× | 351 KB | 1 379 KB |

Prvý čitateľný obraz je teda hlboko pod cieľom 1,5 MB; prológ sa sťahuje až po `load`
(neovplyvní LCP) a bez filmu sa nesťahuje vôbec. V teste sa záloha a film sťahovali dvakrát
(server testu posiela `Cache-Control: no-store`); naživo ide druhý dotaz z cache.
LCP/CLS Lighthouse: lokálne nemerané (bez Lighthouse); CLS: zálohy aj plátno majú pevné
rozmery, doska úvodu nastupuje len animáciou `transform/opacity`.

## 6. Maximálny detail a prechody (2026‑10‑09, druhá verzia)

**Zábery**: `source/tools/film.py` – stupne 1086/1448/2172/2896 px (fasáda `vstup` aj 4096),
AVIF q66 / WebP q84, nič sa nezväčšuje nad originál; pre telefón výrezy na výšku 9 : 16 okolo bodu
záujmu (`<meno>-m-{1086,1448}` + vlastná hĺbková mapa; rohožka z foto‑30 na výšku; karafa,
pracovné miesto a káva s užším oknom okolo predmetu, `mh`). 14 záberov,
`assets/img/film` 39 MB na disku (sťahuje sa vždy len to, čo zariadenie potrebuje).

**Ostrosť** – `node source/tools/ostrost.mjs --a=<naživo stará> --shots=sala,kreslo,recepcia`
(telefón 390×844 @3×, počítač 1440×900 @2×, film na rovnakej polohe, rozptyl Laplaciánu v strede
obrazu; väčšie = viac detailu; rôzna kompozícia výrezu číslo ovplyvňuje, preto aj výrezy 1 : 1
v `docs/screenshots/ostrost/`):

| záber | telefón pred (1448 px na šírku) | telefón po (výrez -m 1448) | počítač pred (2172) | počítač po (2896) |
|---|---|---|---|---|
| recepcia | 402 | **512** | 284 | **394** |
| kreslo (plytká hĺbka ostrosti) | 7 | **23** | 37 | **55** |
| sála | 560 | 546 (iná kompozícia výrezu) | 176 | 174 |

Výrezy 1 : 1 (`ostrost/porovnanie-mobil-recepcia.jpg`, `porovnanie-desktop-recepcia.jpg`): neónový
nápis a lamely na telefóne predtým rozmazané, teraz kreslené bod na bod; na počítači ostrejšie hrany
kruhového svetla a obrazu. Film na telefóne kreslí plátno 2× (strop `dpr` 2), textúra výrezu
1448 px pokrýva 1,24 šírky okna.

**Prechod cez priestor** – `node source/tools/prechod-shot.mjs` (desktop + mobil, dvojice sála →
kreslo a sud → vstup, prechod zastavený na 0 / 0,25 / 0,5 / 0,75 / 1 cez `BS30_FILM.fadeFreeze`):
snímky `docs/screenshots/prechod-*.jpg`. Ďaleký koniec nového záberu sa vynára prvý, blízke kreslo
starého záberu mizne posledné, nič nie je rozmazané, v strede 82 % jasu. Ten istý prechod má prológ
(`uvod-*-s050.jpg`: interiér sa vynára cez dvere).

**Hook úvodu a telefón**: filmové pásy počas prológu (`uvod-mobile-s018.jpg`, `uvod-desktop-pred-filmom.jpg`),
choreografia nadpisu, doska pláva nad filmom (±14 px), kompaktná doska na telefóne („Zavolať“ ako
odkaz, hlavné tlačidlo v spodnej lište), výzva „Prejdi si podnik“ nad lištou (`uvod-mobile-s100.jpg`).
Dymový test po zmenách: všetky kontroly prešli; úvod (desktop + mobil) prechádza polohami 0 → 1,
na telefóne so zábermi `vstup-m` → `rohozka-m`.

**Naživo po nasadení (cd58607, 2026‑10‑09)**: nová verzia na Pages po 61 s; súbory `film.js`,
`style.css`, `rohozka-m-1086.avif`, `vstup-m-1448.avif`, `vstup-4096.avif`, `sala-2896.avif`,
`sala-m-hlbka.webp` 200. Úvod z verejnej adresy: desktop `vstup` → `rohozka`, mobil `vstup-m` →
`rohozka-m`, polohy 0 → 1, druhé načítanie bez prológu, `?film=off` pokojná verzia.
Lighthouse z verejnej adresy (headless, SwiftShader; súbežne bežali iné testy, preto rozptyl):
mobil `?film=off` 87 (LCP 2,8 s, CLS 0, TBT 300 ms), mobil `?uvod=off` 97 (LCP 2,4 s, CLS 0,
TBT 50 ms), desktop 99 (LCP 0,5 s, CLS 0); prístupnosť, osvedčené postupy a SEO 100.

## 7. Návrat na otváraciu scénu (2026‑10‑09, naživo 6f94263)

`node source/tools/uvod-shot.mjs --url=<naživo>`: po prológu `uvod.von()` → stav vonku (S = 0, záber
`vstup` / `vstup-m`, tlačidlo „Vojdi dnu“, pásy zasunuté), potom koliesko nadol (počítač) alebo
tlačidlo (telefón) → prológ znova a kamera na rohožke (S = 1); pri druhej návšteve (bez
automatického prológu) sa dá vyjsť von rovnako. Desktop aj mobil prešli z verejnej adresy; dymový
test po úpravách prešiel celý. Snímky: `docs/screenshots/uvod-*-vonku.jpg`, `uvod-*-znova.jpg`.

## 8. Nezávislé kontroly (2026‑10‑09/10) a čo sa z nich zmenilo

Tri kontroly (stránka a súbory; kód film.js; mobilná kompozícia a hook) – nálezy a opravy:
- preload fasády bez stupňa 4096 → tabuľky preloadu sa generujú z film.json (zhodné so šablónou);
- mipmapy sa v skutočnosti netvorili (three s `generateMipmaps=false` vyhradí jednu úroveň) →
  `generateMipmaps = true` pred `initTexture`, ručný `generateMipmap` po pásoch doplní obsah;
- na ulici (outside) bežalo kreslenie naplno → vonku sa kreslí pokojovo;
- zotrvačnosť kolieska/trackpadu po dojazde hore mohla vyviesť von → von až keď stránka stojí na
  vrchu aspoň 350 ms; odraz (záporný scrollY) sa berie ako 0; gestá neplatia pri otvorenom menu či
  lightboxe; medzerník/šípka dole z ulice vojdú dnu bez skoku stránky;
- telefón sa určuje podľa zariadenia (aj naležato), odchod/opakované vojdenie bez fasády sa po 6 s
  vzdá, prológ pri obnovenom skrole začne z vrchu, `scrollTo` so zálohou pre staré Safari;
- chôdza k dverám na počítači ide aj bokom k dverám (dvere skončia vedľa dosky);
- prechod radí body podľa bližšej z dvoch hĺbok (ďaleký koniec oboch miestností prvý, popredie
  posledné), okno 0,45;
- výrezy na telefón míňali bod záujmu z názvu (sud, pumpa, pult, stôl) → nové x (0,78 / 0,72 /
  0,30 / 0,62), kreslo pri okne o 5 % vyššie; hero na telefóne z foto‑40 (1932×2576, výrez 1449 px)
  namiesto foto‑30 (900 px);
- počas prológu nebolo na telefóne vidieť „Rezervovať termín“ → spodná lišta nad pásom aj pri úvode;
  poistka pásov platí len kým film nenakreslil prvý snímok (12 s); popis miesta pod pásmi skrytý;
  druhé „Rezervovať termín“ v doske tímu na telefóne skryté; tlačidlo dverí na počítači hore vľavo
  pod značkou (nie dve pilulky nad sebou), výzva na skrol na telefóne skrytá (vedie spodná lišta).
Neriešené (vyžadujú majiteľa): fasáda bez rozmazaného auta (nová fotka), fotka dverí zblízka.
Nepotvrdené skeptikmi (limit relácie), nálezy prijaté po vlastnom overení kódu a snímok.

**Po opravách (47fe7cb+)**: koliesko (plynulý dobeh, von na ulicu z vrchu, dnu z ulice, prológ dobehol),
dymový test celý, úvod desktop + mobil vrátane von/znova a druhej návštevy, prechod sála → kreslo
(ďaleký koniec prvý, popredie posledné), scény na telefóne s novými výrezmi (pult, opierka celá, stôl
bez TV, pumpa Route 66, sud s uterákmi) – `docs/screenshots/kolo3-*`.

**Naživo (10d80ac, 2026‑10‑10)**: nová verzia na Pages po 41 s, súbory 200; úvod z verejnej adresy desktop
aj mobil vrátane von/znova; pri druhej návšteve na telefóne odchod von v headless prehliadači nestihol
6 s limit na načítanie fasády (pomalé sťahovanie + softvérová grafika) – limit zvýšený na 12 s.
Lighthouse z verejnej adresy: mobil `?uvod=off` 90 (LCP 3,3 s, CLS 0, TBT 160 ms), mobil `?film=off`
94 (LCP 3,1 s, CLS 0, TBT 40 ms), desktop 100 (LCP 0,5 s, CLS 0, TBT 0); prístupnosť, osvedčené
postupy a SEO 100. LCP na mobile vzrástol oproti 2,1 s, lebo záloha úvodu na telefóne je teraz
výrez z foto‑40 (278 KB AVIF namiesto 132 KB) – cena za ostrý prvý obraz; na skutočnom 4G je to pod 1 s.

## 9. Plynulý úvod na telefóne (2026‑10‑10) – `node source/tools/uvod-meranie.mjs`

Podnet majiteľa: úvod a prvé prechody na telefóne nie sú také plynulé ako na referenčnom videu.
Zmerané pred úpravou (telefón 390×844 2×, headless, softvérové kreslenie):
- chôdza začínala hneď po fasáde a pri dverách čakala na záber úvodu (S 0,33: 1,8 s pri rýchlej
  sieti, 5,8 s pri 1,6 Mb/s) – úvod bol dva pohyby s pauzou;
- rozlíšenie plátna sa znižovalo uprostred prológu (dpr 2 → 1,5 → 1) kvôli dlhým snímkam pri
  nahrávaní fotiek do grafiky;
- statická záloha a prvý snímok filmu mali iné rámovanie (film 1,18× bližšie a posunutý na bod
  záujmu), prelínanie zálohy do filmu bolo viditeľný skok;
- záloha a film sťahovali rôzne stupne fotky (záloha 1448, film 1086 na telefóne, 2172 na počítači).
Po úprave (film.js, style.css, stills.py):
- chôdza začne až s načítaným záberom úvodu, kamera dovtedy stojí na prvom snímku; zastavenia
  počas chôdze: žiadne pri rýchlej ani pomalej sieti (ostáva len prvý snímok po štarte chôdze,
  ktorý v softvérovom kreslení trvá 1,5 s), dpr 2 celý prológ, bez stropu 30 fps;
- zhoda zálohy s prvým snímkom (`uvod-zhoda.py`, fázová korelácia bez jasu, výrez 12–88 %):
  telefón prológ dx 0 / dy −6 px (z 780×1282), mierka 0,99; telefón úvod bez prológu dx +1 / dy 0,
  0,99; počítač prológ dx +7 / dy −5 px (z 1440×684), 0,98; počítač úvod bez prológu dx +5 / dy −3,
  0,98 (2 % sú hĺbkový posun filmu voči plochej fotke, pri prelínaní 0,7 s nevidno);
- záloha berie ten istý stupeň ako film (telefón `vstup-m-1086`, počítač `vstup-2172`);
- `uvod-shot.mjs` (desktop + mobil), `koliesko-test.mjs`, `prechod-shot.mjs --only=mobile`,
  `app-smoke.mjs`: všetko prešlo.
Naživo (af5ef46, Pages): `uvod-meranie.mjs --url=…`: bez čakania pri dverách pri rýchlej aj pomalej
sieti, dpr 2 celý prológ; zhoda zálohy s filmom rovnaká ako lokálne (do 7 px, mierka 0,98–0,99).
Lighthouse z verejnej adresy ako v skorších záznamoch (`?uvod=off`, headless): mobil 100 (LCP 1,6 s,
predtým 2,4–3,3 s – záloha berie na telefóne stupeň 1086 ako film; TBT 0, CLS 0), desktop 100 (LCP
0,6 s, TBT 0, CLS 0). Predvolená adresa s prológom sa v headless Lighthouse (softvérové kreslenie,
snímka filmu trvá 1,7 s) merať nedá: TBT desiatky sekúnd je artefakt laboratória, rovnaký aj pred
touto úpravou (lokálne b878ff0: 41 bodov, TBT 40,7 s; teraz 38 bodov, TBT 55,6 s), na telefóne
s grafikou sa netýka.

## 10. Ako na videu: titulné karty, skutočné videá, rôzne strihy (2026‑10‑10/11)

Podnet majiteľa: vojdenie a celý web majú byť na telefóne plynulé a pekné ako referenčné video
(antenucci.studio), texty elegantné so silným hookom, každý prechod vlastný strih. Ďalej videá
o Magic UI (drobné pohyblivé detaily) a o štýloch animácií (kinetická typografia).
- Rozbor referencie po snímkach (scratchpad `rozbor/`): text pripnutý a mení sa len krytím za 0,17–0,2 s,
  kamera bokom až 30 % šírky za scénu, 3 tvrdé strihy + 3 prelínania + 1 záblesk na 7 scén, tmavý obraz,
  tlačidlá len v úvode a na konci.
- Texty: 3 textári, 2 porotcovia (pravidlá a fakty; zákazník), syntéza; každý údaj má zdroj.
- Rozloženie: titulné karty bez dosky (P11), nadpis po slovách (P12), spodné tlačidlo kompaktné vpravo.
- Videá (telefón): Poď ďalej = video‑3 0–5 s (skrol), Remeslo = video‑3 5–9,3 s (skrol), Tím = video‑2
  slučka; bez tónovania, len stabilizácia (`videa.sh`); stiahnu sa až po pohybe a blízko scény.
- Strihy (film.js, tabuľka CUTS, atribút `data-cut`): nájazd cez dvere (prológ), krok dopredu, švih,
  nájazd z kresla do kresla a do karafy, prechod popri operadle a stĺpe, odjazd von na Mostnú. Návrh troch
  strihačov (kamera, svetlo, tvar); porota a syntéza nedobehli (limit relácie), zvolený je slovník
  strihača „kamera“, lebo najviac zodpovedá pohybu kamery v referencii. Na telefóne 12, na počítači 16 vzoriek
  textúry na pixel počas strihu (mimo strihu 1 ako doteraz); na skutočnom iPhone nemerané.
- Pohyblivé detaily: lesk na hlavnom tlačidle, bežiaci pás služieb, kroky strihu, tabuľa dnešných hodín
  (Europe/Bratislava), svetlo po okraji kontaktnej karty, tím a galéria ako pás posúvaný prstom.
- Brána filmu: softvérové kreslenie dá pokojnú verziu (aj Lighthouse a PageSpeed Insights); testy `?film=on`.
  Grafiku overuje film.js až po prvom vykreslení (hlavička bez WebGL kontextu, ten oneskoroval prvý obraz
  telefónu o 1 s); pri neskorom vypnutí trieda `world-frame` drží rámovanie zálohy. `app-smoke.mjs` to kontroluje
  bez `?film=on` (desktop aj telefón: world-frame + world-off, CLS do 0,0001, záloha s presahom).
  `koliesko-test.mjs` čaká na vrchu 500 ms (film berie koliesko nahor až po 350 ms pokoja na vrchu).
- Šírka na telefóne: skryté popisky `.visually-hidden` v páse tímu boli ukotvené mimo pásu a stránku
  roztiahli na 2326 px (telefón ju v prvých snímkach oddialil na 1648 px, po app.js preskočila späť:
  posun rozloženia 0,14 na filmových pásoch). Pás má teraz `position: relative`; `app-smoke.mjs` kontroluje
  šírku aj pri páse tímu a galérie a bez app.js.
- Úvodné fotky na telefón (vstup-m, rohozka-m, stupeň 1086) AVIF 46 / WebP 74: 107 a 122 kB namiesto 215
  a 272 kB; text úvodu (LCP) na ne v Lighthouse čakal. Rámovanie zálohy `object-fit: cover` (rámik má pomer
  strán fotky, kreslí to isté ako fill).
Overené lokálne (headless): `app-smoke.mjs` všetko prešlo; `uvod-shot.mjs` desktop aj mobil (prológ,
von a dnu, druhá návšteva, `?film=off`); `koliesko-test.mjs` OK; `uvod-meranie.mjs` bez čakania pri
dverách, dpr stále; `uvod-zhoda.py` posun do 7 px, mierka 0,98–0,99; `strih-shot.mjs` všetkých 14 prechodov
na telefóne bez chýb konzoly (snímky `strihy-mobile.jpg`); `karty-shot.mjs` telefón aj počítač.
Lighthouse lokálne (bez kompresie, python http.server): počítač 99 / 100 / 100 / 100, telefón 69 (LCP 5,3 s
pre nekomprimované súbory; CLS 0,13 od spodného tlačidla, opravené: tlačidlo začína skryté, karty okrem úvodu
čakajú na app.js). Naživo pozri nižšie.

**Naživo (5f45af8, 2026‑10‑11)**, Lighthouse 12.8.2 z verejnej adresy, predvolená adresa (s prológom):
- telefón 5 behov: výkon 96 / 99 / 97 / 96 / 98, prístupnosť 100, osvedčené postupy 100, SEO 100;
  FCP 1,2–1,5 s, LCP 2,1–2,4 s, TBT 3–137 ms, CLS 0 (pred úpravami 88–94, LCP 2,9–3,3 s, CLS až 0,14);
- počítač 2 behy: 100 / 100 / 100 / 100 (FCP 0,3 s, LCP 0,6 s, TBT 0, CLS 0).
Snímky kariet z verejnej adresy (`karty-shot.mjs --wait=5000`): telefón aj počítač, každý záber ostrý
a k svojej karte. Pri čakaní 1,5 s zachytí softvérové kreslenie (asi 7 snímok/s) strih ešte v pohybe;
zastavený strih sa dokreslí (mix 0,999 za 4 s), na zariadení s grafikou za zlomok sekundy.
Známe: pri skoku cez menu do vzdialenej časti je film, kým sa fotka záberu načíta, tmavý (v teste 2–3 s).

## 11. Kratšia cesta, káva v čakárni, popisy barberov, ostrejšie videá (2026‑10‑11)

Podnet majiteľa (snímka z iPhonu, karta Remeslo): čo najostrejšie, úvod a cesta k obsahu sú dlhé, káva
sa podáva vzadu, kde sa čaká, nie pri recepcii; ku každému barberovi elegantný popis.
- Cesta: 9 kariet namiesto 14 (TOUR_DIRECTION, Cesta). Telefón 390×844: tím na 6. obrazovke (predtým 11.),
  cenník 8,9 (13,9), kontakt 19,2 (24,2), celá stránka 21,4 obrazovky (26,4). Nové strihy `rohozka>sala`
  (krok dopredu), `sala>stol` (popri operadle; telefón prelínanie, obe videá sú jeden súvislý záber),
  `stol>cakaren` (švih); snímky strihov na telefóne aj počítači bez chýb.
- Prológ: chôdza 1,7 s, vstup 1,3 s (2,3 a 1,6), pred podnikom najviac 1,5 s (6 s). `uvod-meranie.mjs`:
  rýchla sieť koniec prológu 7,7 s od načítania (11,7 s), bez čakania pri dverách; pomalá sieť 1,6 Mb/s
  pri dverách 0,3 až 0,45 s (test povoľuje do 1 s, kompromis kratšieho úvodu).
- Videá: originály 576×1024; `videa.sh` ich zväčší na 864×1536 (lanczos), doostrí CAS 0,5 a kóduje s menšou
  kompresiou (H.264 crf 20, kľúčová každá 4. snímka; VP9 crf 33). Výrez tváre pri zväčšení na displej
  telefónu je zreteľne ostrejší. Cena: videá vo filme spolu asi 10 MB H.264 (predtým 3,8 MB), sťahujú sa
  až po pohybe a blízko scény. Ostrejší obraz dá len originál z telefónu (1080p alebo 4K).
- Popisy barberov: workflow (traja textári, porota pravidiel a zákazníka, syntéza, korektúra), 43 až 68
  znakov, bez faktov o osobe (CONTENT_SOURCES, Tím). Pás tímu na telefóne aj počítači skontrolovaný.
- Testy: `app-smoke.mjs` 105 OK (9 kotiev, 8 kapitol, karta sud ako druhý záber kapitoly, čakáreň pri
  motion=off); `koliesko-test.mjs` OK; `uvod-zhoda.py` posun do 6 px; `uvod-shot.mjs` OK;
  `karty-shot.mjs --wait=5000` telefón: 9 kariet, každý záber ostrý a k svojej karte.
- Naživo (4f7b589), Lighthouse 12.8.2: telefón 8 behov 97 / 97 / 93 / 97 / 94 / 99 / 97 / 96 (medián 97),
  prístupnosť, osvedčené postupy a SEO 100, CLS 0, LCP 2,1–2,5 s; počítač 100 / 100 / 100 / 100. Behy pod 95
  majú prvý obraz v laboratórnom prehliadači (softvérové kreslenie) až po 2,5 s pri rovnakom hlavnom vlákne
  ako rýchle behy; rovnaký rozptyl bol aj pred touto úpravou.

## 12. Plynulosť 60 až 240 snímok za sekundu, videá ako fotky po 0,1 s (2026‑10‑11)

Podnet majiteľa: videá pôsobia zaseknuto; celá stránka aspoň 60 a podľa zariadenia až 240 snímok za sekundu;
video rozložiť na snímky po 0,10 s.
- Film: kreslí plnou frekvenciou displeja aj v pokoji (predtým po 60 s len 30 snímok/s), bez stropu 30 snímok.
  Rozlíšenie sa prispôsobuje: medián snímky pod 60 snímok/s (alebo 90. percentil pod 40) zníži dpr o 0,25
  (najnižšie 1x); pri plnej frekvencii displeja s rezervou sa po 8 s vráti. Interval displeja do 1/250 s.
- Poď ďalej a Povedz, ako to chceš: `sekvencie.sh` (video‑3 stabilizované, každá 3. snímka = 0,1 s, lanczos
  720×1280 + CAS, AVIF 56 / WebP 80): 51 a 44 fotiek, 2,0 a 1,6 MB AVIF (menej než predchádzajúce videá).
  film.js `data-video-mode="seq"`: sťahovanie od hrubých k jemným (8., 4., 2., všetky, 4 naraz), dekódovanie
  `createImageBitmap`, v grafike najviac 6 snímok, najviac 2 nahratia za snímku displeja (najbližšie k polohe
  prvé, vzdialené sa zahodia), prelínanie dvoch susedných snímok v strednej tretine intervalu, v pokoji
  dorovnanie na celú snímku (0,2 s). Test v prehliadači (390×844): snímka a prelínanie sledujú skrol bez
  zastavenia, v pokoji `mix` 0 alebo 1 (ostrý obraz bez zdvojenia), bez chýb konzoly.
- Video tímu: slučka 60 snímok/s (medzisnímky `minterpolate` z pohybu, aj cez šev: slučka 3× za sebou,
  vystrihnutá prostredná perióda); šev 1,6 pri bežnom rozdiele susedných snímok 1,7.
- Obmedzenie: Safari na iPhone kreslí webové stránky najviac 60 snímok/s (nastavenie Apple); 90 až 240 Hz
  platí pre Chrome na Androide a počítače s rýchlym monitorom. Na skutočnom zariadení nemerané (kontajner
  nemá grafickú kartu).

## 13. Audit výkonu a úpravy (2026‑10‑11)

Workflow (3 audity: JS filmu, grafika, stránka a CSS; každý overený skeptikom), merania v scratchpad `fps/`.
Zapracované (overené nálezy s nízkym rizikom):
- app.js: `--p` sa už nepíše na `<html>` (dedil sa do ~750 prvkov, prepočet štýlu v každej snímke skrolu);
  výzva a dvere v úvode čítajú `--hint` len z kotvy úvodu. Zrušené `--pointer-x/y` (nikto ich nečítal,
  prepočet celej stránky pri každom pohybe myši). `scrollY` sa číta raz na začiatku snímky. Nekonečné
  animácie (pás služieb, svetlo po okraji karty, lesk tlačidla) sa mimo obrazovky pozastavia.
- film.js: výška okna z measure() namiesto `innerHeight` v každej snímke (vynútený prepočet na telefóne);
  správa okolia (načítanie, uvoľnenie, zastavenie videa) v samostatnej úlohe najviac raz za 100 ms alebo
  pri zmene záberu, nie v každej snímke; lišta prehliadača (resize pri skrole) prepočíta kotvy až po 150 ms;
  programy zjemnenia a postprocesu sa preložia a raz použijú vopred (prvý strih bez zaseknutia).
- Hĺbkové mapy uložené v šírke ≤ 768 px (970 → 222 kB); film ich už nezmenšuje na hlavnom vlákne
  (audit: zastavenie 36 až 320 ms pri každom novom zábere). hlbka.py ukladá rovno v tejto šírke.
- Meranie skrolu (telefón 390×844, CPU 4×, film vypnutý): hlavné vlákno 10,9 → 9,6 ms na snímku, prepočet
  štýlu 5,1 → 4,8 ms (audit inou metódou 48,7 → 7,4 ms). Testy: app-smoke 105 OK, koliesko, uvod-zhoda, uvod-shot.
Nezapracované (väčší zásah alebo zmena vzhľadu, na ďalšie kolo): kreslenie len potrebného cieľa v strihu,
mipmapy cieľov len pri rozmazaní, šero `body::after` do shadera, prispôsobivé pásy nahrávania fotiek,
menej vzoriek pri krátkej stope strihu, skryté zálohy bez sťahovania pri bežiacom filme, matné sklo
lišty a dosiek na počítači (rozhoduje majiteľ).

## 5. Čo ostáva overiť naživo

- Po nasadení: `curl` hlavných súborov (index, style.css, app.js, film.js, three, prvé zábery,
  rohozka-*), snímka z verejnej adresy (desktop + mobil, s `?v=` proti cache CDN).
- Na skutočnom telefóne: plynulosť prológu a filmu (30 snímok/s v pokoji), presah 1,24 na výšku.
- Súhlasy osôb vo videách a portrétoch (CONTENT_SOURCES.md) – potvrdiť u majiteľa.

## 14. Bez čiernych obrazoviek a asistent (2026‑10‑21)

- Film: pri rýchlom skrole a skoku cez menu (cieľ sa ešte načítava) sa plátno vymazalo na čierno a po skoku
  rozsvecovalo zo šera. Teraz ostane posledný ukázaný záber a cieľ sa doň prelnie (650 ms, plynulý rozbeh aj dobeh),
  šero v strede strihu 2 až 3 % namiesto 10 až 18 %. `tma-test.mjs` (pomalá sieť 250 kB/s, 8 krokov skrolu
  a 5 skokov, počítač aj telefón): pred opravou 10 úplne čiernych snímok, po oprave žiadna.
- Testy po zmene: app-smoke všetky kontroly OK, koliesko-test OK (dvakrát po sebe), tma-test OK.
- Asistent: `../asistent/testy/spusti.sh` 17 OK (prúd po kúskoch, model, úsilie, záložný model, cache, kľúč len
  na serveri, kontrola vstupu, pôvod, limit, chyba, odmietnutie); `asistent-test.mjs` všetko OK (bez zapnutia
  žiadna požiadavka, tlačidlo neprekrýva Zavolať a Rezervovať, odpoveď po kúskoch, odkazy, Esc, rozhovor po
  obnovení, chyba servera, angličtina, telefón bez pretekania). Naživo čaká na kľúč API a FTP v tajomstvách.

## 15. Telefón, objednávka, filmový pohyb a AI asistent s voľnými termínmi (2026‑10‑21)

Všetko v emulácii prehliadača (Playwright, Chromium bez grafickej karty), nie na fyzickom telefóne.

- Príčiny tmavých plôch na telefóne (`mobil-audit.mjs`, 360/390/430 px, pokojná verzia aj film): ostré rozhranie
  záber/pás s plochým tmavým odsadením (64 px + nadpisy), jazyková ponuka zalomená do 4 riadkov cez obsah, videá zo
  zdroja 576 px (rozmazané po zväčšení, 60 fps slučka tímu dopočítaná interpoláciou z 30 fps). Opravené: stmievačka
  namiesto hrany, menšie odsadenia, ponuka na dva riadky nad spodnou lištou, na telefóne ostré výrezy fotiek bez videa.
- Úvod: čo, prečo, ako na prvej obrazovke (360 až 1440 px), Objednať sa a Zavolať a potvrdiť termín celé a aspoň 44 px.
  Spodná lišta Zavolať + Objednať sa, asistent vľavo, bez prekryvu.
- Filmový pohyb: linka strihu pri nástupe pásu, odhalenie fotiek maskou (IntersectionObserver sleduje rodiča, maska
  sama prvok skryje pred pozorovateľom), odozva tlačidiel; obmedzený pohyb a bez skriptu nič neskryté (`nahlad.mjs`).
- HTML gzip 14 369 → 14 251 B (prvé okno TCP), style.css gzip 18 051 → 19 102 B.
- AI asistent: `asistent/testy/spusti.sh` 28 + 17 OK (nástroj na voľné termíny: overené, žiadny voľný, zatvorené,
  mimo rozsahu, minulosť, neznámy barber, bez napojenia, výpadok 500, časový limit, súkromie, vyrovnávacia pamäť,
  podpis premýšľania späť nezmenený, udalosť tel); `asistent-test.mjs` v prehliadači (karta časov, Zavolať a potvrdiť
  termín pri každej odpovedi o termíne a pri chybe, označenie AI). Skutočné API Anthropic ani živý rezervačný systém
  netestované (kľúč a súhlas chýbajú).
- Lighthouse 12.8.2, server s gzipom, stará (HEAD) a nová verzia striedavo, telefón 5 behov, počítač 1 (pokojná verzia,
  laboratórny prehliadač bez grafickej karty): telefón stará 69/94/95/93/95 (medián 94, LCP 2,86 s), nová 96/97/86/93/95
  (medián 95, LCP 2,72 s); počítač 99 → 99; prístupnosť, postupy, SEO 100; CLS 0.
- `nahlad.mjs`: 360/390/430/768/1440 px bez pretekania, 5 odkazov tel: na +421951267203, všetky Objednať sa do
  rezervačného systému, obe tlačidlá úvodu celé na prvej obrazovke; obmedzený pohyb a bez skriptu nič skryté.
- app-smoke, i18n-test, tma-test, asistent-test: všetko OK. koliesko-test pri súbežnom teste zlyhal (časovanie pod
  záťažou), samostatne OK.

## 16. Objednávka v štýle webu, vizitka a vernostná kartička (2026‑10‑21)

Všetko v emulácii prehliadača (Playwright, Chromium bez grafickej karty) proti falošnému rezervačnému systému
(`asistent/testy/mock-rezervacie.php`); živý rezervačný systém ani fyzický telefón netestované.

- `objednavka-test.mjs` 57 OK: okno sa zapne len so serverom s pripojeným kalendárom; 15 služieb z cenníka s časom a
  cenou; barberi z rezervačného systému s portrétmi z tímu; prvý deň s voľným časom (dnes večer už nič → ďalší deň),
  nedeľa zatvorená, časy predbežné s časom overenia; výber bez „rezervované“, Dokončiť v rezervačnom systéme a Zavolať
  a potvrdiť termín; cenník a tím predvyberú službu a barbera; Späť v telefóne a Esc zatvoria okno; výpadok kalendára =
  poctivá správa a telefón; 360/390/430/768/1440 px bez pretekania; zmena jazyka; bez príznaku ani bez kalendára sa nič
  nesťahuje a Objednať sa ide rovno do rezervačného systému; so zapnutou prihláškou ju tlačidlo kartičky aj Dokončiť
  otvoria; meno iného zákazníka nikde; makeOrder sa nikdy neodoslal; žiadna požiadavka na skutočné systémy.
- Server `asistent/testy/spusti.sh` 35 + 17 OK (nové: barberi, dni, voľné časy pre okno, výpadok, neznáma služba a
  barber, bez napojenia 503, cudzí pôvod 403; vlastný limit pre čítanie kalendára).
- Vizitka: na želanie zadávateľa tá, ktorú prevádzka už má (nie nový návrh). Predloha fotka recepcie (foto-17):
  pruhy barber pole, biely kruh s logom „30 Barbershop Holičstvo“, kontakt pod ním; logo z vektora starého webu (vrstvy
  odtieňov → priehľadné WebP 480 px, 45 kB). Na prednej strane len riadky čitateľné na fotke (telefón, e‑mail, adresa,
  web); jeden riadok (asi sociálna sieť) sa z fotky prečítať nedá, nie je tam. Číslice v klasickom pätkovom písme
  (vo Fraunces vyzerá malá „3“ ako „5“). vCard 3.0 (meno, telefón, e‑mail, adresa, web, Instagram, hodiny).
- HTML gzip 14 251 → 14 355 B (id služieb pri tlačidlách cenníka), nové súbory sa sťahujú až po načítaní stránky.
- Lighthouse (rovnaký postup ako v časti 15), nová verzia: telefón 90/96/95/95/96 (medián 95, LCP 2,71 s), počítač 99;
  prístupnosť, postupy, SEO 100; CLS 0.
- app-smoke, i18n-test (vizitka s `lang="sk"` sa neprekladá), tma-test, asistent-test, nahlad: všetko OK.

## 17. Rezervačná stránka a AI asistent na nej (2026‑10‑22)

Emulácia prehliadača proti falošnému rezervačnému systému; živý systém ani fyzický telefón netestované.

- `objednavka-test.mjs` (spolu s oknom na webe všetko OK, 3 behy po sebe): stránka bez skriptu (úvod, 15 služieb
  s odkazom do rezervačného systému, telefón, text viditeľný, bez pretekania); bez príznaku sa nič nesťahuje ani
  neposiela; s kalendárom kroky priamo na stránke na 360/390/430/768/1440 px bez pretekania, výber predbežný
  s dokončením v rezervačnom systéme; odkaz `?sluzba=1&barber=Adrian` rovno na deň; po anglicky úvod, názov aj kroky;
  tlačidlo AI asistenta označené ako AI; žiadna požiadavka na skutočné systémy, makeOrder nikdy.
- Časy v teste nezávisia od hodiny: dnes sa ukážu len časy, ktoré ešte neprešli (okno vtedy prejde na ďalší deň).
- Preklady stránky v 7 jazykoch bez zvyškov slovenčiny (rovnaká kontrola ako i18n-test).
- Lighthouse rezervacia.html (server s gzipom): telefón 96/96/97, počítač 100; prístupnosť a postupy 100; SEO 66 len
  pre zámerné `noindex` (zatiaľ duplikát cenníka, nasadenie s kalendárom ho odstráni); CLS 0.
- Čísla dní v Manrope (vo Fraunces vyzerala malá „3“ ako „5“). Bez plávajúcej spodnej lišty, aby nič neprekrývalo
  tlačidlá cenníka; Zavolať je v úvode, v krokoch aj pri kontakte.
- Hlavný web: i18n-test, app-smoke, asistent-test všetko OK; server asistenta 35 + 17 OK.
- Najkratšia cesta (2026‑10‑22, na želanie zadávateľa „čo najmenej kliknutí“): po službe hneď najbližšie voľné časy
  u ktoréhokoľvek barbera, ťuk = výber; Objednať pri službe v cenníku → čas → výber sú dve kliknutia (360 až 1440 px
  bez pretekania). S barberom vybraným v tíme sa rýchla voľba neukáže. `objednavka-test.mjs` 98 OK.

## 18. Rezervácia s fotkami (2026‑10‑22)

- Zadávateľ: rezervácia pôsobila ako dokument; chce fotky toho, čo zákazník dostane, a prácu barberov z Instagramu.
- Instagram bez prihlásenia presmeruje na prihlásenie (overené jednou požiadavkou na profil); do účtu sa
  neprihlasujeme. Fotky práce dodá prevádzka (`docs/FOTKY_PRACE.md`), web ich ukáže pri barberovi a v galérii.
- V podkladoch nie je ani jedna fotka hotového strihu (starý web aj fotky od majiteľa sú priestory), preto pri
  službách skutočné fotky prevádzky z galérie webu, nie vymyslené výsledky.
- Celá cesta fotiek práce overená na skúšobných sivých obrázkoch (nástroj, náhľady pri barberovi, prehliadač,
  galéria), potom zmazané; v repozitári je prázdny `assets/praca.json`.
- `objednavka-test.mjs` 105 OK (skupiny s fotkou, tím na stránke, Objednať sa pri barberovi, galéria skrytá bez fotiek,
  bez chýb v konzole); testovacie servery sa zastavujú celou skupinou procesov (php -S s workermi).
- Preklady stránky v 7 jazykoch bez zvyškov slovenčiny.
- Opravená chyba servera: prvé súbežné požiadavky (okno pýta barberov a dni naraz) občas padli na „database is locked“
  (`asistent/lib/jadro.php`, WAL sa zapínal pred nastavením čakania na zámok); pred opravou 1 z 20 pokusov s chybou 500,
  po oprave 0 zo 40. Nový test v `asistent/testy/spusti.sh` (36 + 17 OK). Postihlo by to aj AI asistenta.
- Lighthouse rezervacia.html s fotkami: telefón 98/98/98 (úvodná fotka pre telefón 760 px, 48 kB, s preload; fotky
  v cenníku a tíme s nízkou prioritou), počítač 100; prístupnosť a postupy 100; SEO len zámerné noindex.

## 19. Vzhľad webu na rezervácii barbershop30.sk (2026‑10‑22)

- Zadávateľ: www.barbershop30.sk/rezervacia má vyzerať ako nový web a fungovať rovnako. Ich systém nie je náš, preto
  štýl `assets/tema-rezervacia.css` na vloženie jedným riadkom (`docs/TEMA_REZERVACIA.md`).
- Verejná stránka a jej súbory prečítané raz (HTML, css/app.css, js/app.js, jQuery, Bootstrap, logo, ikony); formulár
  je komponent Vue so službami v stránke a metódami getEmployees, getCalendar, getTime, makeOrder.
- `tema-nahlad.mjs`: ich stránka lokálne so skúšobným kalendárom, kroky služba → pracovník → deň a čas → údaje na
  390 a 1440 px pred a po, šírka bez pretekania, makeOrder nikdy, žiadna požiadavka na ich server okrem čítania súborov.
- Číslice nadpisov v Manrope (unicode-range), inak „3. Vyberte termín“ vyzeralo ako „5.“.
- Neoverené: ich živá stránka so štýlom (vloženie urobí ich správca), skutočný telefón.
- Ukážka na kontrolu (2026‑10‑22, zadávateľa náhľad stále vracal na pôvodnú rezerváciu, lebo kalendár nie je
  pripojený): `?objednavka=ukazka` na webe aj rezervačnej stránke, bez servera, ukážkové časy výrazne označené, výber
  bez úspechu. `objednavka-test.mjs` 113 OK.


## 20. Asistent Barber: logo, bublina pri ikone, Zavolať, skrytie (2026‑10‑22)

- Zadávateľ: asistent sa volá Barber, ikonou je ich logo, vyskakuje v rohu ako upozornenie, návštevník ho vie dať preč,
  otázky v chatovej bubline, stále s možnosťou zavolať.
- Ikona vľavo dole: logo Barbershopu 30 (`assets/img/logo-30-barbershop-160.webp`, 10 kB, z `logo-30-barbershop.webp`)
  v bielom kruhu so štítkom AI. Bublina nad ikonou po 5 s viditeľnosti (nie v úvode, pri menu ani pri ponuke jazyka),
  raz za návštevu, Spýtať sa a Zavolať, krížik ju zavrie na 14 dní. Okno na počítači ako bublina nad ikonou, na
  telefóne zdola; Zavolať v hlavičke (do 420 px ako slúchadlo), Skryť Barbera do konca návštevy.
- Označenie AI: štítok pri logu, v bubline aj pri mene, podnadpis „AI asistent Barbershopu 30“, prvá správa a poznámka.
  Model vie, že sa volá Barber (`MENO_ASISTENTA` v `asistent/lib/jadro.php`).
- Ukážka bez servera `?asistent=ukazka` (web aj rezervacia.html): vopred pripravené odpovede z údajov webu
  (`assets/asistent-ukazka.js`, cenník priamo zo stránky), pás „nepíše ich AI“, voľné termíny nevymýšľa, nič neposiela.
- `asistent-test.mjs` všetko OK (nové: logo a štítok, bublina nad ikonou bez pretekania na 360 px, Spýtať sa,
  Zavolať v hlavičke, fokus, krížik na 14 dní, Skryť Barbera, ukážka); server 36 + 17 OK; objednavka-test, i18n-test,
  app-smoke všetko OK. Snímky 360, 390, 430, 768 a 1440 px bez vodorovného pretekania. Skutočný telefón neoverený.
