# Zadanie: BARBERSHOP 30 – plynulý a špičkový web aj na telefóne

Toto je hlavné zadanie pre všetkých agentov (audit, návrh, implementácia, kontrola). Číta sa celé.

## 1. Slová majiteľa (doslova, 19. 10. 2026)

„Chcem aby si upravil fungovanie stránky Barbershop30 aby to bolo plynule graficky špičkovo spravené. Chcem aby
tá stránka vyzerala na telefóne tak isto. Chcem aby na telefóne fungovalo plynule tiež, lebo pôsobia strašne
zasekane. Aby niekde neboli žiadne čierne okná, že zákazník nič nevidí. Si senior, vytvor si preto prompt
a využi všetky tools z toolboxu, skills a pluginy čo chceš, máš na všetko povolenie.“

## 2. Čo presne znamená „hotovo“ (merateľne)

1. **Plynulosť na telefóne.** Emulácia 390 × 844, DPR 3, dotyk, CPU spomalené 4× (stredný Android) a sieť
   „Fast 4G“: pri skrolovaní celou stránkou prstom (krátke ťahy aj rýchly švih) a pri všetkých prechodoch
   (úvodný film, strihy medzi zábermi, sekvencie, videá, menu, jazyk, vernostná karta) platí:
   - žiadna dlhá úloha > 50 ms počas skrolu, žiadna snímka > 100 ms,
   - 95. percentil času snímky ≤ 20 ms (60 Hz), podiel snímok > 33 ms ≤ 2 %,
   - INP < 200 ms, CLS < 0,05, LCP ≤ 2,5 s, Lighthouse mobil ≥ 95 (cieľ z CLAUDE.md), počítač 100.
   Kontajner nemá grafickú kartu (WebGL beží softvérovo cez SwiftShader). Preto sa meria dvakrát: (a) celá stránka
   vrátane WebGL a (b) práca hlavného vlákna bez kreslenia GPU (texImage2D, dekódovanie, JS na snímku, štýl,
   layout). Cieľom je, aby (b) bolo s rezervou a (a) nemalo zaseknutia od nahrávania textúr a dekódovania.
2. **Žiadne čierne okná.** Pri žiadnej rýchlosti skrolu (aj rýchly švih, aj skok z menu, aj späť hore), pri
   pomalej sieti (Slow 4G), pri prvej návšteve aj návrate, s filmom aj bez neho (záloha) nesmie byť viac ako
   20 % viditeľnej plochy jednofarebná tmavá plocha bez obsahu dlhšie ako 150 ms tam, kde má byť obraz
   (fotka, film, video, sekvencia, titulná karta). Zámerné tmavé plochy dizajnu (orechové pozadie s textom) nie sú
   chyba, ale aj tie musia mať obsah. Kým sa obraz načítava, vidno náhľad (rozmazaný LQIP, plagát, posledný
   snímok), nikdy čiernu.
3. **Rovnako dobre na telefóne ako na počítači.** Telefón dostane ten istý zážitok a rovnakú kvalitu obrazu
   (film zo skutočných fotiek, prechody, titulné karty, videá), prispôsobený na výšku, nie ochudobnený. Ak
   efekt v reálnom čase na telefóne nevie byť plynulý, nahradí sa vizuálne rovnocennou ľahkou verziou
   (predpočítaná sekvencia alebo video, CSS transformácie), nikdy čiernou plochou ani prázdnym miestom.
4. **Graficky špičkovo.** Ostré fotky, správne orezy na výšku, plynulé prelínania bez preblikávania, bez
   skokov rozloženia, čitateľné texty, jednotné tempo pohybu. Vzhľad sa neprerába, len zdokonaľuje a opravuje.

## 3. Pravidlá, ktoré platia vždy

- Prečítaj a dodrž: `barbershop-30/README.md`, `barbershop-30/docs/MASTER_BRIEF.md`, `ART_DIRECTION.md`,
  `CONTRACT.md`, `CONTENT_SOURCES.md`, `TOUR_DIRECTION.md`, `CHECKS.md` (najmä časti 9, 12, 13) a `CLAUDE.md`
  v koreni repozitára (časť Technika a pravidlá textov platia aj tu, kde nie sú v rozpore s dokumentmi Barbershopu).
- Obsah sa nemení: texty, ceny, služby, tím, recenzie, odkazy do Booqme, vernostná karta (prihláška),
  jazykové verzie (každý nový viditeľný text potrebuje kľúč vo všetkých `assets/i18n/*.json`, test
  `node source/tools/i18n-test.mjs`).
- Len skutočné fotky a videá prevádzky, nič generované ani vymodelované.
- Funkcie ostávajú: úvodný film s dverami, „Späť na ulicu“/„Vojdi dnu“, kurzor nožníc, hudba a strih (počítač),
  `?film=off`, `?uvod=off`, `?hudba=off`, obmedzenie pohybu (všetko statické a viditeľné), šetrenie dát.
- Žiadna zmienka o AI na webe, v kóde, v komentároch ani v commitoch. Commity po slovensky, bez podpisov.
- Komentáre v kóde po slovensky. Žiadny backdrop-filter na mobile.
- Po zmene zdrojov `node tools/build.mjs` ak sa ho týka (pozri README a CHECKS), testy z `source/tools/`.

## 4. Nástroje a skills

- Toolbox `toolbox/skills-z-praxe/`: `rychly-web` (Lighthouse, plynulý skrol, pasce CLS, LCP, prepočet štýlu,
  pohyb bez knižnice), `video-a-sekvencie` (sekvencie snímok, slučky bez švu), `film-z-fotiek` (film s hĺbkovou
  mapou, WebGL2, zálohy), `testy-a-nasadenie` (Playwright, nasadenie), `workflowy`, `tim-roly` (roly CEO,
  dizajnér, eng manažér, recenzent, QA, benchmark; Iron Law: najprv príčina, potom oprava; regresný test,
  ktorý bez opravy padne a s ňou prejde; stop po troch neúspešných opravách).
- Nástroje projektu: `barbershop-30/source/tools/*` (app-smoke, scenes-shot, uvod-shot, uvod-meranie,
  vaha, prechod-shot, karty-shot, koliesko-test, i18n-test, atmosfera-test, strih-shot).
- Playwright: `import { createRequire } from 'module'; const require = createRequire('/opt/node22/lib/node_modules/');
  const { chromium } = require('playwright');` – nikdy `playwright install`. CDP: `Emulation.setCPUThrottlingRate`,
  `Network.emulateNetworkConditions`, `Input.synthesizeScrollGesture` (dotykový švih), `Tracing`, `Page.startScreencast`
  alebo `recordVideo`. ffmpeg je v `/usr/local/bin`. Snímky si vždy pozri (Read na obrázok).
- Server: `python3 -m http.server <port 8100–8999>` v koreni pracovného stromu, web na `/barbershop-30/`.

## 5. Postup (tím rolí)

1. Audit (QA, benchmark, dizajnér, staff recenzent): zmerať, nájsť a doložiť každé zaseknutie a každé čierne okno
   s príčinou v kóde (súbor:riadok) a s reprodukciou.
2. Návrh opráv (eng manažér + dizajnér): poradie podľa dopadu, riziko, akceptačné kritériá, ako sa overí.
3. Implementácia po dávkach, po každej nezávislá kontrola (recenzent + QA) a meranie pred/po tou istou metódou.
4. Záverečná kontrola celku, zápis do `barbershop-30/docs/CHECKS.md` (nová časť), nasadenie na `main`.
