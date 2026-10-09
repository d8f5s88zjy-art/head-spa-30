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
záujmu (`<meno>-m-{1086,1448}` + vlastná hĺbková mapa; rohožka z foto‑30 na výšku). 14 záberov,
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

## 5. Čo ostáva overiť naživo

- Po nasadení: `curl` hlavných súborov (index, style.css, app.js, film.js, three, prvé zábery,
  rohozka-*), snímka z verejnej adresy (desktop + mobil, s `?v=` proti cache CDN).
- Na skutočnom telefóne: plynulosť prológu a filmu (30 snímok/s v pokoji), presah 1,24 na výšku.
- Súhlasy osôb vo videách a portrétoch (CONTENT_SOURCES.md) – potvrdiť u majiteľa.
