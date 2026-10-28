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

## 21. Barber: 251 overených odpovedí a telefón (2026‑10‑22)

- Zadávateľ: Barber má mať aspoň 250 odpovedí na najčastejšie otázky a byť pohodlný na telefóne.
- `../asistent/znalosti/barbershop-otazky.json`: 251 otázok v 11 témach, len fakty z `barbershop.md` a webu.
  `otazky.mjs`: ceny a dĺžky len z cenníka index.html, len overený telefón, odkazy a hodiny, žiadne 24/7, odpoveď
  o termíne s telefónom a istotou; každá otázka aj iné znenie nájde samu seba; server a prehliadač zoradia rovnako
  (826 otázok).
- Cena: celý zoznam v pokynoch by mal asi 25 000 tokenov; pri malej návštevnosti by cache často vypršala a každý
  nový rozhovor by ho platil znova. Preto server pridá len 6 najpodobnejších (rádovo stovky tokenov).
- `asistent-test.mjs` 71 OK (nové: 11 tém, otázka ťuknutím bez servera a označená, súvisiace otázky, písaná otázka
  ide na server, clona, klávesnica simulovaná náhradou visualViewport, ťuk na clonu zavrie); server 37 + 17 OK.
- Opravený test servera: súbežný test prepisoval počítadlo chýb (`zle`), súhrn mohol ukázať 0 FAIL aj pri chybe.
- Neoverené: skutočná klávesnica na iPhone a Androide (emulácia), odpovede skutočného modelu (chýba kľúč API).

## 22. Živý telefón, háčiky a menšie ikony (2026‑10‑22)

- Zadávateľ: na telefóne web pôsobí ako PowerPoint; chce živý web, každá animácia so silným háčikom, aby zákazník
  ostal a objednal sa; ikony menšie, aby nebili do očí.
- Príčina dojmu prezentácie: v pokojnej verzii (bez WebGL a kým film nenabehne) stála pri titulnej karte fotka
  pevne (len 6 % priblíženie za celú scénu) a karta sa len rozsvietila a zhasla; cenník mal na 390 px vyše
  15 obrazoviek.
- Zmeny (style.css P15, app.js časť 12): pohyb kamery bez filmu podľa `data-mv` (overené výpočtom: čakáreň
  1,04 → 1,16 počas scény), hĺbka karty 44 px, 7 háčikov v kartách scén (8 jazykov), živý stav otváracích hodín
  v úvode (o 22:04 „Teraz zatvorené, zajtra od 9:00“, správne), záložky cenníka pripnuté pod lištou so zvýraznením
  skupiny na obrazovke, popis služby na dva riadky (ťuk rozbalí), nástup riadkov, jednorazové posunutie pásov
  tímu a galérie. Ikona asistenta 48 px (telefón 44 px), bublina menšia a až po 8 s, spodná lišta 42 px.
- Pri snímaní počas plynulého skrolu (scroll-behavior: smooth) robil Playwright snímky s posunutou stránkou
  a čiernou plochou; meranie polohy lišty v každom snímku ukázalo, že stránka sa neposúva (chyba snímania).
  Prehliadky odteraz skrolujú okamžite.
- Testy: i18n-test, app-smoke, asistent-test, objednavka-test OK; mobil-audit 360/390/430 nižšie.
- Neoverené: skutočný telefón (len emulácia), film na skutočnej grafike telefónu.

## 23. Vernostná kartička Barbershopu na jeho webe (2026‑10‑22)

- Zadávateľ: odkaz na kartičku v pätičke viedol na HEAD SPA 30; po zaplatení má zákazník dostať ponuku založiť si
  účet (body, odmeny), odmeny nastavuje Lajko v admine.
- Príčina: pätička viedla na https://www.headspa30.sk/vernost/karta/, server kartičiek tam ešte nie je nahratý, ukázala
  sa 404 stránka HEAD SPA 30 (overené požiadavkou).
- Kartička Barbershopu je teraz na webe Barbershopu (`barbershop-30/karta/`), server vracia odkaz podľa prevádzky
  (registrácia, e‑mail, upozornenie, admin). Formulár na založenie (`?nova`) pre QR kód na recepcii po zaplatení;
  admin → Klienti → QR pre nového klienta. Bez servera stránka povie „Kartičky práve spúšťame“ a dá telefón.
- `vernost/testy/spusti.sh` 117 OK (nové: kópie súborov kartičky, odkaz na web Barbershopu, založenie cez `?nova`
  bez HEAD SPA, uloženie pre pätičku, QR v admine). Opravené: text „null“ na stránke bez kartičky, test pätičky
  hľadal dva odkazy na kartičku.
- Ostáva: nahrať server kartičiek na headspa30.sk (FTP) a heslo `VERNOST_HESLO_BARBERSHOP`; zásady ochrany údajov
  kartičky sú zatiaľ na headspa30.sk/vernost/ochrana-udajov.html.

## 24. Admin pre Lajka (2026‑10‑22)

- Zadávateľ: admin, v ktorom Lajko zmení všetko sám (texty, fotky), ako administrátor; odmeny kartičky v admine kartičky.
- `admin/` (vzor: admin HEAD SPA 30): záložky Texty (167 polí po častiach webu, hľadanie, hlavička a pätička
  rezervačnej stránky sa menia spolu s hlavnou), Cenník (15 služieb), Tím (10 ľudí, nový člen, odstránenie, fotka),
  Galéria (8 fotiek), Odpovede asistenta (251), Kartička (odkazy na admin kartičky a stránku založenia).
- `node source/tools/admin-test.mjs`: 63 OK. Falošný GitHub drží súbory v pamäti a commit ich naozaj zmení.
  Overené: zlý kľúč a kľúč len na čítanie; web ešte nie je v `main` (jasná správa, kľúč ostane); text na mieste a preklad na novom kľúči; cena v oboch súboroch,
  v znalostiach aj v odpovediach (10 odpovedí na kontrolu, jedinečná cena prepísaná); zlá cena zastaví uloženie;
  popis a fotka barbera (WebP aj JPEG, stará fotka nahradená celá, ohnisko zachované); nový člen bez fotky
  zastavený, s fotkou v oboch súboroch, v prekladoch, znalostiach a odpovediach; popis fotky galérie aj zväčšenia;
  súbeh (web zmenený inde) nič neprepíše; web po zmenách bez chýb, 11 kariet, fotka sa načíta, angličtina
  preložená; admin na 390 px bez pretekania a bez chýb (aj s Content-Security-Policy: spojenie len na GitHub).
- Opravené počas testu: úseky bez písmen (bodka, rok, telefón) a údaje (hodiny, adresa, e‑mail) sa v admine
  nedajú meniť, lebo sú aj v odkazoch a v asistentovi; dvojité polia hlavičky a pätičky rezervačnej stránky;
  odsadenie a fetchpriority novej fotky; menovky zmien v tíme s menom.
- Neoverené: skutočný GitHub (kľúč nemám a do `main` sa bez súhlasu neukladá), skutočný telefón.
- Pozor: admin číta a ukladá `main`. Kým web Barbershopu nie je zverejnený v `main`, admin nemá čo upravovať.

## 25. Admin: Kontakt a hodiny, odkaz na ochranu údajov kartičky (2026‑10‑24)

- Zadávateľ: dokončiť, čo predtým nebolo hotové. V admine chýbala zmena telefónu, e‑mailu a hodín (bola len poznámka
  „pošli tvorcovi webu“), lebo sú na mnohých miestach.
- Súpis: telefón vo vyše 20 súboroch v troch tvaroch, hodiny 341 dvojíc „od–do“ v 8 jazykoch, JSON‑LD, app.js HOURS,
  server asistenta, kartička, vizitka, CLAUDE.md. Osamotené časy v odpovediach asistenta: 3 vety s časom otvorenia
  bez dňa („otvárame o 9:00“), 2 s „19:00“, 1 so „14:00“; ďalej termíny v ukážke objednávky a príklad v pokynoch
  asistenta (tie sa menia, len ak sa zhodujú s otváracími hodinami).
- Záložka Kontakt a hodiny: telefón (mobil 09xx xxx xxx), e‑mail, Po–Pi a sobota od–do (celé hodiny). Náhľad
  „Zmení sa N miest v M súboroch“ a vety s časom otvorenia bez dňa na kontrolu, keď sa otvorenie Po–Pi a v sobotu
  rozíde. Zmena sa robí v hotových textoch až po ostatných úpravách, v jednom commite.
- `node source/tools/admin-test.mjs`: 100 OK. Skúška: telefón 0905 123 456, e‑mail, Po–Pi 9–20, So 10–14.
  Starý telefón a e‑mail nikde; tel: odkazy, JSON‑LD, vizitka, kartička (HEAD SPA nezmenená, kópie karta.js
  rovnaké), app.js HOURS, preklady (kľúč aj preklad, maďarčina, nemčina), odpovede a znalosti asistenta, pokyny
  asistenta (príklad termínov nezmenený), CLAUDE.md, ukážka objednávky nezmenená; PHP (`php -l`) a JS (`node
  --check`) bez chyby syntaxe; web po zmene: všetky Zavolať na nové číslo, angličtina, tabuľa hodín v sobotu 10–14.
- `source/tools/otazky.mjs` berie povolené časy z app.js (inak by po zmene hodín hlásil chybu).
- Kartička na webe Barbershopu: odkaz „Ochrana osobných údajov“ pod kartičkou viedol na `barbershop-30/ochrana-udajov.html`
  (neexistuje). Oba odkazy teraz vedú na spoločnú stránku pri API kartičiek. `vernost/testy/spusti.sh` 118 OK
  (nová kontrola: odkaz existuje, odpoveď 200).
- Neoverené: skutočný GitHub a skutočný telefón.

## 26. Telefón: fotka v páse nad textom, celé fotky, menšie okná (2026‑10‑25)

- Zadávateľ: „na telefóne nie je fotky vidno úplne, okná zakrývajú celú obrazovku“.
- Príčina: fotka na šírku cez celú výšku displeja 390 × 844 ukáže najviac 31 % svojej šírky, s presahom 1,24 filmu asi
  25 %; spodnú polovicu prekrývala karta so stmavením. Galéria na telefóne orezávala fotky na 4 : 5, tím na 4 : 5
  z fotiek 820 × 694. Menu 93 % výšky, objednávka 100 %, asistent 86 %.
- P16: fotka scény v páse 56 % výšky (asi 50 % šírky fotky, dvojnásobok), text pod ňou; prológ cez celé okno.
  Film: zábery na šírku, `setViewOffset` s osou v strede pásu, `CAP` na telefóne 2172 px. Záloha s rovnakým rámovaním.
- Overené (Playwright, emulácia telefónu):
  - karty s filmom (`karty-shot.mjs`) aj bez filmu (`mobil-audit.mjs` 360/390/430): fotka celá v páse, text pod ňou,
    pretekanie 0 px, žiadna snímka nad 70 % tmy; opravené počas kontroly: výzva „Prejdi si podnik“ cez tlačidlo
    v úvode a háčik cenníka cez spodnú lištu;
  - záloha a prvý snímok filmu v páse: rovnaká poloha fotky (rozdiel len text úvodu, ktorý práve nabiehal);
  - galéria: všetkých 8 fotiek v pôvodnom pomere strán (358 × 224, 358 × 239, na výšku 114 × 152), tím celé portréty;
  - menu 68 % výšky, ťuk mimo zavrie; objednávka 82 %, ťuk nad ňu zavrie; asistent 72 %;
  - testy: app-smoke všetko OK (najprv 2 chyby: `aspect-ratio: auto` na fotke galérie zrušil pomer strán pred
    načítaním a stránka sa posúvala, opravené), i18n-test, objednavka-test, asistent-test, tma-test OK.
- `stills.py --check` zhodné (výrezy -m len prológu, ostatné `sizes` 170vw).
- Neoverené: skutočný telefón (iPhone, Android), plynulosť filmu na skutočnej grafike s väčšími textúrami.

## 27. SEO: titulok, popis, H1, časté otázky, anglická stránka (2026‑10‑25)

- Zadávateľ schválil body 1 až 4 z `docs/SEO-ANALYZA.md` („100 krát urob“).
- Titulok `Barbershop 30 Nitra | Pánske holičstvo, Mostná 30` (49 znakov), popis so službami a výzvou, H1 obsahuje
  „Barbershop 30 · Nitra“ (nadpisok verzálkami ako predtým), podnadpis „Pánske holičstvo na Mostnej 30“.
- Časté otázky: 8 otázok (`<details>`, bez skriptu fungujú) v páse pod kontaktom; odpovede len z overených údajov
  webu (cenník, hodiny, tím, Romana farbí). „Bez objednania“, poukážky, produkty a detská stolička nie sú, čakajú
  na potvrdenie prevádzky.
- Údaje pre Google: `hasMap` na profil v Mapách (cid z odkazu na webe); `geo` nie, súradnice nie sú overené.
- Anglická stránka `en/` (`en-stranka.mjs`): 352 prekladov, 0 chýbajúcich; vlastná kanonická adresa, `og:locale`
  en_GB, cesty `../assets`; v `sitemap.xml` hreflang en vedie na `en/` (9 miest). Vytvára sa pri nasadení v pages.yml
  aj v `nasad-barbershop30.sh` až po všetkých úpravách index.html (aj po admine).
- Admin: zmena názvu alebo ceny služby prepíše aj cenu v údajoch pre Google (admin-test kontroluje).
- Overené (Playwright, emulácia telefónu 390): `en-test.mjs` všetko OK (jazyk, titulok, popis, kanonická adresa, H1,
  8 otázok po anglicky, žiadny slovenský text zo slovníka, žiadny chýbajúci súbor, bez chýb skriptu, pretekanie 0,
  ťuk otvorí odpoveď, prepínač na nemčinu otvorí slovenskú stránku s `?lang=de` a preloží ju); admin-test 101 OK,
  i18n-test, app-smoke, objednavka-test OK, `otazky.mjs` OK, `stills.py --check` zhodné. Snímky `docs/screenshots/seo/`.
- Neoverené: ako Google stránky naozaj zaindexuje (až po nasadení na doménu a odoslaní sitemap v Search Console).

## 28. Telefón: kontrola a opravy chýb (2026‑10‑25)

- Zadávateľ: „nájdi chyby na mobilnej verzii a uprav“. Kontrola 360/390/430 px (emulácia v Playwright): snímky po
  krokoch skrolu s filmom aj bez neho, meranie prázdnej plochy pod pásom fotky (podiel okna bez textu a obrázkov
  s krytím rodičov), ťukacie plochy, písmo pod 12 px, orezaný text, prvky mimo okna, otvorené okná.
- Nájdené a opravené:
  - prázdny atrament pod fotkou pri prechode pás → scéna (tím → služby, cenník → galéria, galéria → predná sála):
    560 až 640 px skrolu (66 až 76 % okna) bez textu; a scéna → pás 160 až 320 px. Príčina: karta za pásom sa
    ukazovala až po pripnutí kotvy 87 px pod pásom fotky a karta pred pásom zhasla skôr, ako pás prišiel.
    Oprava (P18, app.js): scéna za pásom začína o pás fotky skôr (karta ide hneď za pásom a je vidieť pri nábehu),
    karta pred pásom zhasne až pod pásom. Po oprave: 390 px tri a 360 px dva krátke úseky po 80 px pri výmene
    kariet (prelínanie), inak nikde;
  - kotva oreže len do strán (`overflow: clip visible`): pripnutá karta by bez zhasnutia vytŕčala pod kratším pásom
    tímu („Vyber si svojho barbera“ pod pásom), preto zhasne, keď ju pás prekryje;
  - film na telefóne menil fotku nad pásom: pás tímu má na telefóne 0,83 výšky okna, pevný strih 1,5 okna pred
    kartou bol mimo pásu. Strih je teraz v strede úseku, keď pás kryje celý pás fotky (film.js), záloha bez filmu
    rovnako (app.js) a pás leží nad zálohami ďalších scén (inak by ich prekryla fotka galérie, overené snímkou);
  - lišta po odskrolovaní mala 90 % krytie, cez logo presvital text stránky: teraz plná (aj bez app.js, bez
    rozmazania pozadia na telefóne);
  - spodná lišta: Zavolať bol priesvitný (text pod ním presvital), písmo 11,5 px: teraz plný podklad a 12 px;
  - ponuka jazyka (prúžok „This page is also in English“) zakrývala 12 s dva riadky textu nad spodnou lištou:
    zmizne aj po odskrolovaní o obrazovku (ukáže sa pri ďalšej návšteve);
  - ťukacie plochy 23 až 29 px (odkazy so šípkou, hodnotenie v úvode, telefón a e‑mail v pätičke, Späť hore):
    neviditeľný presah, teraz 47 až 49 px, rozloženie bez zmeny (overené ťukom 7 px nad a pod odkazom).
- Bez chyby: vodorovné pretekanie 0 px na všetkých šírkach a stránkach (index, rezervácia, en), žiadna chyba
  skriptu ani chýbajúci súbor, menu, objednávka, asistent, zväčšená fotka a časté otázky na telefóne v poriadku.
  Písmo pod 12 px je len na vizitke (napodobenina tlačenej vizitky, údaje sú aj vedľa).
- Testy: app-smoke OK okrem známeho nestáleho posunu na počítači (softvérové kreslenie, CLS 0,028, nesúvisí),
  i18n-test, en-test, tma-test, objednavka-test, asistent-test (výsledky v zázname POSTUP).
- Neoverené: skutočný telefón (iPhone Safari, Android Chrome), plynulosť na skutočnej grafike.

## 29. Rezervácia: overenie bez odoslania (2026‑10‑25)

- Zadávateľ: „skontroluj, či rezervácia by prešla úspešne a či funguje, ako má“. Skutočná objednávka sa
  neodoslala (vznikol by termín v kalendári prevádzky); všetko len čítaním ako návštevník, makeOrder zablokované.
- Odkazy: všetkých 37 tlačidiel Objednať sa na webe a 25 na rezervačnej stránke vedie na
  https://www.barbershop30.sk/rezervacia (200), farbenie u Romany na Booqme (200), telefón tel:+421951267203.
- Cenník proti rezervačnému systému (dáta formulára): všetkých 15 služieb existuje pod rovnakým číslom
  (data-sluzba) s rovnakou cenou aj trvaním; názvy sa líšia len opravami (Úprava → úprava, gentlemenov →
  gentlemanov, uši → uší, pomlčka a medzera pri 10 cm). Tím na webe = barberi v systéme (10 mien).
- Ich formulár v prehliadači (390 px): služba → Pokračovať → barber (Nezáleží + 10) → kalendár 25. 10. až
  25. 11. 2026, nedele zatvorené → pondelok 26. 10.: 38 voľných začiatkov → krok 4 osobné údaje (meno, priezvisko,
  e‑mail, telefón, Pokračovať). Ďalej sa nešlo.
- Nájdená chyba v našom serveri (`asistent/lib/kalendar.php`, prejavila by sa až po zapnutí kalendára): barber
  išiel ako číslo a dátum ako reťazec. Skutočný systém číslo 0 („Nezáleží“) odmietne, iné číslo ticho ignoruje
  (vráti kalendár aj časy u kohokoľvek: Kristián 41 namiesto svojich 28 časov a všeobecné voľno namiesto jeho
  107 dní) a dátum ako reťazec skončí chybou 500. Rýchla voľba by teda vždy hlásila „neviem overiť“ a výber
  barbera by ukázal časy, keď barber nemá voľno. Oprava: barber ako objekt zo zoznamu (id, meno, rozvrh, bez
  e‑mailu a telefónu), dátum ako objekt kalendára (selectedDate), overené proti skutočnému systému.
- Falošný systém v testoch (`asistent/testy/mock-rezervacie.php`) sa správa ako skutočný (číslo barbera
  odmietne alebo ignoruje, reťazec dátumu = 500, konkrétny barber má iné časy ako Nezáleží); kalendar-test
  kontroluje tvar požiadaviek a že sa kontakty barberov neposielajú. Pôvodný kód s ním zlyhá (overené).
- Testy: asistent 37 OK + kalendár 21 OK, objednavka-test 113 OK (okno nikdy neukáže úspech, „termín ešte nie je
  rezervovaný“, makeOrder sa nikdy neodošle), app-smoke všetko OK.
- Neoverené: samotné odoslanie objednávky (urobí sa len so súhlasom prevádzky, napr. skúšobný termín, ktorý
  recepcia hneď zruší).

## 30. Vychytávky: pripomienka strihu, Pošli kamarátovi, ikona na plochu (2026‑10‑25)

- Zadávateľ: „pridaj na stránku vychytávky, aby bola efektívna“. Vybrané len to, čo vedie k objednávke a nepotrebuje
  nové údaje: návrat stálych zákazníkov (pripomienka), odporúčanie (zdieľanie), rýchly návrat na web (ikona).
  Poukážky, „bez objednania“, produkty a detská stolička čakajú na potvrdenie prevádzky. Oznam „online aj teraz“
  v úvode vynechaný (pod ním je tlačidlo Objednať sa a na 360 px by sa riadok zalomil).
- Pripomienka: voľba 3, 4 (predvolené) alebo 6 týždňov, dátum vypísaný („Pripomienka pondelok 23. novembra
  o 10:00“), nedeľa sa posunie na pondelok. Súbor .ics: CRLF, riadky do 75 bajtov, UID, DTSTAMP, upozornenie
  v začiatku, text „Objednaj sa na strih · Barbershop 30“ a „Pripomienka, nie rezervácia“, odkaz na rezerváciu,
  telefón (súbor je v zozname KONTAKT adminu) a adresa. Google Kalendár: šablóna s časom a pásmom Europe/Bratislava.
  Texty v 8 jazykoch, udalosť v jazyku stránky.
- Pošli kamarátovi: zdieľanie telefónu s kanonickou adresou (bez parametrov), inak kópia odkazu a správa
  „Odkaz je skopírovaný“; bez oboch sa tlačidlo neukáže.
- Ikona na plochu: `assets/manifest.webmanifest` (Barbershop 30, začiatok na webe, minimal-ui), ikony 192, 512
  a maskovateľná 512, apple-touch-icon 180 (motív favicon, písmo Fraunces) na index, rezervácii aj en/.
- Overené (Playwright 360/390/430/1440): `vychytavky-test.mjs` všetko OK (stiahnutie súboru, zmena voľby, angličtina,
  schránka, bez pretekania, ťukacie plochy aspoň 40 px), snímky `docs/screenshots/vychytavky/`.
- Neoverené: ako .ics otvorí skutočný iPhone (Safari) a Android, a pridanie ikony na plochu na skutočnom telefóne.

## 31. Krajšie texty a elegantnejšie rámčeky pri rezervácii (2026‑10‑25)

- Zadávateľ: „texty, čo majú zákazníci, keď sa rezervujú, krajšie, aj rámčeky textov, nech je to elegantnejšie“.
- Naše okno objednávky (`assets/objednavka.js`, `objednavka.css`, 8 jazykov): doterajší výber ako tichý riadok
  (služba · barber · termín, ťuk vráti na krok) namiesto krabičiek; súhrn ako lístok s tenkým rámikom
  (nadpisky Služba, Barber, Termín, vpravo dĺžka a cena alebo čas); poznámky (termín ešte nie je rezervovaný,
  časy neviem overiť, deň je plný) v rámčeku s linkou lampy, prvá veta nadpisom; čas overenia samostatne tichšie.
  Texty: „V tento deň je už plno“, „U prvého voľného barbera z tímu. Ťukni na čas, ktorý ti sedí.“; poctivé vety
  ostali („Termín ešte nie je rezervovaný“, „predbežný“, telefón v pracovné dni). objednavka-test 113 OK.
- Ich rezervácia (www.barbershop30.sk/rezervacia): texty sú v ich systéme, nový web ich nemení. Návrh pre ich
  správcu `docs/TEXTY_REZERVACIA.md` a `docs/texty-rezervacia.sk.json` (29 kľúčov: kroky, polia, potvrdenie,
  e‑mail s potvrdením, pripomienka, SMS, chyba telefónu): tykanie ako na webe (dnes sa mieša s vykaním, preklepy
  „Zvolte si Vášho“), „Barbershop 30“ s medzerou, SMS bez diakritiky 112 znakov (jedna správa).
- Štýl ich rezervácie (`assets/tema-rezervacia.css`): súhrn pred odoslaním a potvrdenie ako lístok zarovnaný vľavo,
  malé nadpisky nad údajmi, vlasové linky namiesto prerušovaných, skrytý dlhý popis služby v potvrdení, polia
  s medzerou a zaoblením 4 px. Náhľad `node source/tools/tema-nahlad.mjs --texty` (ich stránka lokálne so
  skúšobným kalendárom, odoslanie prijme len lokálny server, k nim nejde nič): snímky pred a po
  `docs/screenshots/tema-rezervacia/` (390 a 1440 px, kroky 1 až 6 vrátane súhrnu a potvrdenia).
- Nedá sa cez jazykový súbor: „Posledný krok“, „Skontrolujte si Vašu rezerváciu…“, „Služby:“, „Odstrániť“,
  „Pridať službu“, „Zmeniť“ a dvojbodky za popismi (sú v kóde ich systému). Vzhľad e‑mailov je v ich šablóne.

## 32. Texty tímu, recepcia v častých otázkach a odkazy na prevádzky (2026‑10‑27)

- Zadávateľ: údernejšie texty pri barberoch (garancia, skúsenosti), v otázkach recepčná = termíny a pohodlie, barber
  = výsledok, na konci stránky odkazy na HEAD SPA 30, Salón 30 a Barbershop 30.
- Tím (`#tim .band-team`): úvod „Tím barberov a barberiek pod jednou značkou. … Ty povieš, ako to chceš. Zvyšok je
  remeslo.“, tri piliere `ul.team-pillars` (Skúsenosti · Precíznosť · Pohodlie, každý ≤ 140 znakov) nad portrétmi,
  riadky barberov ≤ 90 znakov (rovnaké v `rezervacia.html` a v odpovediach asistenta `tim-*`, `node source/tools/otazky.mjs`
  OK). Bez faktov o osobe, bez porovnávania konkurencie, bez zdravotných sľubov. Garancia len ako otázka pre majiteľa.
- Časté otázky: 10 položiek (`en-test.mjs` čaká 10); „Mám volať barberovi alebo recepcii?“ 319 znakov, „Čo ma čaká,
  keď prídem?“ 205 znakov; každá veta má oporu na stránke (CONTENT_SOURCES, časť 2026‑10‑27).
- Pätička: `.footer-shops` medzi stĺpcami a riadkom prevádzkovateľa; HEAD SPA 30 → https://www.headspa30.sk/
  (200, headspa30.sk presmeruje na www), Salón 30 → https://www.salon30.sk/ (200), Barbershop 30 → `#uvod`
  s `aria-current="page"`; externé odkazy `target="_blank" rel="noopener"`; na telefóne ťukacia plocha 44 px.
  Ostatné stĺpce pätičky bez zmeny; film.js bez zmeny.
- Jazyky: 27 nových kľúčov v 7 slovníkoch (11 starých odobraných), `en/index.html` pregenerovaná (369 prekladov,
  bez prekladu 0). CSS: `ul.team-pillars`, lebo `ul[role="list"]` nuluje okraje s vyššou špecifickosťou.
- Overené (Playwright, 390×844 DPR 3 a 1440×900): snímky tímu, otázok a pätičky PRED (bdabff7) a PO, hárok
  `scratchpad/barber/texty/pred-po.jpg`; bez vodorovného pretekania, bez chýb skriptu. Testy i18n (55 OK), en (16 OK),
  vychytavky (27 OK), admin (101 OK); app-smoke 108 OK + 1 FAIL „[softvér desktop] bez posunu rozloženia (CLS 0.0283)“
  s rovnakou hodnotou ako pred zmenou (v jednom z dvoch behov 109 OK, kolísavé meranie záložného úvodu bez filmu);
  tma-test v tomto prostredí padá na chýbajúcom module Pillow (`PIL._imaging`), rovnako pred zmenou aj po nej.
- Veľkosť: index.html gzip 14 844 → 15 758 B (nad 14 600 B z plánu D6; hranica bola prekročená už pred touto zmenou).

## 33. Ráznejšie texty tímu, prax 10 až 15 rokov a garancia v kresle (2026‑10‑28)

- Majiteľ 27. 10. po videní verzie c88d29a: „Musia to byť rázne texty, nechám to na teba.“, „Barberi majú 10–15 rokov
  praxe.“ Rázne = sebavedomé, krátke, priame; bez vulgarít, bez porovnávania konkurencie, bez zdravotných sľubov.
- Tím (`#tim .band-team`): úvod v troch vetách (182 znakov) s praxou 10 až 15 rokov; piliere Skúsenosti (102) ·
  Precíznosť (111) · Garancia (75: „Z kresla vstaneš, až keď si spokojný. Čo nesedí, dohodneme a doladíme hneď.“, bez
  lehôt, bez „zadarmo“); riadky barberov 46 až 74 znakov (Kristián, Michal, Dominika bez zmeny), rovnaké v `rezervacia.html`
  a v odpovediach asistenta `tim-*`.
- Časté otázky: 11 položiek (`en-test.mjs` čaká 11); nová „Čo ak nebudem spokojný?“ (199 znakov, 10. miesto, pred
  „Kedy máte otvorené?“) s garanciou a telefónom recepcie.
- Zosúladenie: „Ako jediný barbershop v Nitre ju máme už 8 rokov.“ → „Tak je to tu od roku 2019.“ (karta Poď ďalej),
  „ako jediný barbershop v Nitre, už 8 rokov“ → „pri dverách, od roku 2019“ (karta Dôvera); v slovníkoch, `en/`, znalostiach
  aj otázkach asistenta nikde „jediný“ ani „8 rokov“ (`grep` 0 nálezov).
- Pätička: podnadpis `.footer-shops-sub` „Všetky tri na Mostnej 30 v Nitre.“ (headspa30.sk: Mostná 226/30 a „Mostnej 30
  v Nitre“, salon30.sk: Mostná 30; stiahnuté 27. 10.). CSS 1 riadok; film.js bez zmeny.
- Asistent: `znalosti/barbershop.md` (prax tímu, recepčná vs. barber, garancia v kresle, prevádzky, stav 28. 10.),
  `barbershop-otazky.json` 252 otázok (nová `garancia` so 4 zneniami; `prax`, `recepcia`, `pobocky`, `najlepsi-barber`,
  `preco-vy` upravené), `node source/tools/otazky.mjs` OK; „Čo ak nebudem spokojný?“, „mate garanciu“, „reklamacia“,
  „co ak sa mi strih nebude pacit“ nájdu `garancia`.
- Jazyky: 7 slovníkov 325 → 328 kľúčov (14 kľúčov nahradených, 3 nové, žiadna iná hodnota zmenená), `en/index.html`
  pregenerovaná (372 prekladov,
  bez prekladu 0), i18n-test OK.
- Overené (Playwright, 390×844 DPR 3 a 1440×900): snímky tímu, otázok a pätičky PRED (c88d29a) a PO, hárok
  `scratchpad/barber/razne/pred-po-texty.jpg`; bez vodorovného pretekania, bez chýb skriptu. Testy pozri odovzdávku
  `scratchpad/barber/razne/odovzdavka-texty.md`.
- Veľkosť: index.html gzip 15 747 → 15 848 B (nad 14 600 B z plánu D6 už pred zmenou).

## 34. Barber pozná ďalších 500 bežných otázok (2026‑10‑28)

- Majiteľ 27. 10. chce pre Barbera ďalších 500 bežných otázok. Zdroj `asistent/znalosti/barbershop-otazky.json`
  (verzia 2026-10-28): 252 → 776 otázok (+524: tím 71, kontakt 70, služby 69, brada 69, deti 67, hodiny 64, balíčky 63,
  objednanie 51; 210 s `tel`), +590 znení k existujúcim otázkam, znení spolu (q + v) 820 → 3 596. Žiadna otázka ani
  odpoveď zo základu sa nezmenila (13 znení s rovnakými kmeňmi ako iné znenie tej istej otázky vynechaných).
- Pôvod: 8 overených dávok (`scratchpad/barber/razne/otazky/*.overene.json`) s nezávislou kontrolou faktov
  (`*.kontrola.md`: 39 vyhodených duplicít, opravené tvrdenia bez opory); všetkých 39 v zdroji nie je, 524 nových otázok
  má presne overené znenie otázky a odpovede (`kontrola-vyhodene.mjs`). Zlúčenie: duplikát = Dice s váhami ≥ 0,9
  (kmene() z `assets/asistent-otazky.js`): 103 znení vynechaných, 1 otázka zlúčená (Strihá ma skúsený barber? → prax);
  12 párov ≥ 0,9 medzi rôznymi otázkami posúdených ako iný význam (napr. „mobilný barber“ a „barber pri strihu na mobile“),
  každé znenie nájde svoju otázku.
- Id: nové otázky tímu `o-time-*`; predpona `tim-` a `volno-` v téme tim je pre odpovede o členoch, admin ich pri zmene
  tímu zmaže (admin-test pred opravou „počet odpovedí rovnaký 705“). `otazky.mjs` to stráži (mená z `.team-name`).
- Kópia pre prehliadač (gzip > 60 kB pri jednom súbore): `assets/asistent-otazky.json` (otázky a odpovede, 203 738 B,
  gzip 41 553 B) pri prvom otvorení okna a `assets/asistent-otazky-kmene.json` (kmene znení podľa id, 77 665 B, gzip
  25 112 B) hneď po ňom; kým kmene nie sú, hľadá sa podľa otázok. Formát zdroja pre server bez zmeny. `otazky.mjs`:
  kópia hľadá rovnako ako zdroj (3 607 dotazov), bez kmeňov nájde každá otázka samu seba, server (php) a prehliadač
  zoradia rovnako. Admin kópiu pri uložení robí znova zo zdroja (`kopiaPreWeb()`), admin-test OK.
- Meranie (Playwright, 390×844 DPR 3, sieť ako Lighthouse Slow 4G, CPU 4×, server s gzip, medián 5 behov): od ťuknutia na
  Barbera po témy 592 ms (c88d29a, 14,8 kB) → 876 ms (dnes; jeden súbor 64 kB 1 101 ms), kmene do 1 267 ms. Hľadanie na
  776 otázkach: node priemer 0,85 ms (p95 1,1, max 1,5), Chromium s CPU 4× priemer 2,8 ms (p95 do 5,8 ms).
- Slepá sada 150 vlastných otázok (130 v 8 témach + 20 mimo): správne odpovede 0,62 (c88d29a) → 0,75 (po zlúčení,
  slepo) → 0,91 (po doplnení 26 znení podľa nej a kontroly, už nie slepo); mimo témy zobrazená odpoveď 1 → 0 (najvyššie
  skóre 0,58). Kontrolná sada 58 otázok: 0,35 → 0,52 → 0,63. Podrobne `scratchpad/barber/razne/odovzdavka-otazky.md`.
- Prehliadač (?asistent=ukazka, 390×844): 11 tém, Tím barberov 8 + Všetky otázky (99), 10 písaných otázok z 10 tém
  a 1 mimo témy so správnou odpoveďou a súvisiacimi otázkami, bez chýb skriptu, bez vodorovného pretekania.
- Testy: `otazky.mjs --kontrola` OK (776 otázok), i18n-test 55 OK, en-test 16 OK, app-smoke 109 OK, vychytavky-test
  27 OK, admin-test 101 OK (kópia pre web zhodná po uložení odpovedí, tímu aj kontaktu, počet odpovedí 776).

## 35. Barber odpovedá presnejšie: všeobecné otázky, mimo témy, domnienky (2026‑10‑28)

- Kontrola kódu a textov po 34: nové znenia prebíjali všeobecné otázky („kto je najlepsi barber“ → špecializácie,
  „kolko trva uprava brady“ → cena), otázky mimo témy dostávali nesúvisiacu odpoveď („Aké bude zajtra počasie?“ →
  voľný termín zajtra 0,644, „kolko je hodin“ → otváracie hodiny 0,756) a niekoľko odpovedí domýšľalo prax podniku.
- Stráž `source/tools/otazky-ocakavane.json` v `otazky.mjs`: 158 bežných otázok s preklepmi a bez diakritiky
  (z každej z 11 tém 11 až 21) → id podľa významu, 64 otázok mimo témy pod prahom 0,6. Na 58dd5f8e 12 chýb, teraz 0.
  Opravené znenia, nie hľadanie (19 zmien: 11 kolíznych znení preč, presunutých alebo spresnených, otázka route66
  bez slova „benzínová“ a jej nové znenie, 6 prirodzených znení pre všeobecné otázky). Kmene: „recept“ a „počasie“ sa neskracujú (CELE v JS aj PHP),
  inak splývali s „recepcia“ a „počas“; server a prehliadač zoradia rovnako (3 837 dotazov).
- Odpovede (97 zmien, z toho 93 v nových otázkach; len overené fakty alebo recepcia s telefónom): vernostná kartička podľa stránky `karta/` (je na
  webe, odkaz v pätičke; doplnené aj v `asistent/znalosti/barbershop.md`), prax len o tíme (nie „každý má rukopis“,
  nie „barber v kresle s 10 až 15 rokmi praxe“), balíčky len podľa cenníka („strih, úprava brady, obočie…“ bez
  domnienok o fade a britve), odovzdania „spýtaj sa barbera v kresle“ → recepcia, tabuľa Dnes je v časti „Kedy si
  sadneš?“. Témy: newsletter → Platby a ostatné, kedy býva školenie → O nás.
- `asistent-otazky.js`: kópia otázok a kmeňov má spoločný otisk; kmene inej kópie alebo verzie sa nepoužijú a po chybe
  sa stiahnu znova pri ďalšom otvorení okna alebo otázke (stráž v `otazky.mjs`).
- Prehliadač (390×844, `?asistent=ukazka&objednavka=ukazka`): 12 otázok vrátane „cena fade“, „mozem prist bez
  objednania“, „kurz eura“, „recept na gulas“, 12 z 12 podľa očakávania, chyby skriptu 0, šírka 390. Prvá odpoveď po
  otvorení okna na pomalom 4G (CPU 4×, medián 5 behov): 1 855 ms (58dd5f8e) → 1 823 ms; prenos asistenta gzip +0,8 kB.
- Testy: `otazky.mjs --kontrola` OK, i18n-test 55, en-test 16, app-smoke 109, vychytavky-test 27, admin-test 101 OK.
