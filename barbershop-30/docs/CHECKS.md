# Kontroly (čo, ako, výsledok)

Stav k 2026‑10‑09, verzia s prehliadkou podniku (film zo skutočných fotiek s hĺbkou) a úvodom
ako filmom (prológ z ulice cez dvere dnu). Všetko merané lokálne v headless Chromiu (Playwright,
WebGL cez SwiftShader), preto sú časy snímkov orientačné; prenesené bajty a stavy sú presné.

## 1. Dymový test režiséra stránky – `node source/tools/app-smoke.mjs`

Výsledok: **všetky kontroly prešli** (desktop 1440×900, mobil 390×844).
- načítanie bez chýb konzoly, bez 404, bez absolútnych ciest;
- 9 sekcií: `data-scene-active` ide 1 → 9, `--p` rastie, `--sp` kotiev v rozsahu 0–1;
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

## 5. Čo ostáva overiť naživo

- Po nasadení: `curl` hlavných súborov (index, style.css, app.js, film.js, three, prvé zábery,
  rohozka-*), snímka z verejnej adresy (desktop + mobil, s `?v=` proti cache CDN).
- Na skutočnom telefóne: plynulosť prológu a filmu (30 snímok/s v pokoji), presah 1,24 na výšku.
- Súhlasy osôb vo videách a portrétoch (CONTENT_SOURCES.md) – potvrdiť u majiteľa.
