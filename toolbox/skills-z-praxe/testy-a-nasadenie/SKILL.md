---
name: testy-a-nasadenie
description: Testy statického webu v prehliadači (Playwright, Chromium, headless, SwiftShader) a nasadenie na GitHub Pages, do samostatného repozitára alebo cez FTP. Použi pri dymovom teste (smoke test) pred nasadením, pri snímkach obrazovky (screenshots) telefónu a počítača, pri teste WebGL filmu, šírky na telefóne, CLS a behu bez JavaScriptu, pri nestabilných testoch (flaky, čakania, timeout), pri nasadení cez git (vetva, fast-forward do main, GitHub Actions, admin) a pri overení naživo (deploy, cache, .htaccess).
---

# Testy v prehliadači a nasadenie

Postup z webov HEAD SPA 30 (koreň repozitára) a BARBERSHOP 30 (`barbershop-30/`): statické weby bez frameworku,
testované v headless Chromiu cez Playwright v kontajneri bez grafickej karty a nasadzované na GitHub Pages.

Zásada: **najprv rýchla cielená kontrola, celá sada až potom; nasadzuj po zelených testoch a vždy over naživo.**

## Kedy použiť

- Pred každým nasadením (dymový test), po zmene rozloženia, výšok sekcií, brány filmu alebo skriptu stránky.
- Treba snímky telefónu a počítača na posúdenie okom (úvod, titulné karty, strihy, prechody, ostrosť).
- Test raz prejde a raz nie, alebo čaká naslepo (`waitForTimeout`) a zlyháva na pomalom kreslení.
- Nasadenie na Pages z pracovnej vetvy, do samostatného repozitára alebo balík pre FTP hosting.

Lighthouse, plynulosť skrolu a váhu stránky rieši skill `rychly-web`; samotný WebGL film skill `film-z-fotiek`.

## 1. Prostredie

- Playwright je nainštalovaný globálne, Chromium leží v `/opt/pw-browsers` (premenná `PLAYWRIGHT_BROWSERS_PATH`).
  **Nič neinštaluj.** ESM `import` ignoruje `NODE_PATH`, preto nástroje načítajú Playwright cez CommonJS
  (`barbershop-30/source/shot.mjs`):

```js
// Playwright is installed globally (not in this project). ESM `import` ignores NODE_PATH,
// CommonJS resolution honours it, so resolve the global package via createRequire.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
```

- Spúšťanie prehliadača: `chromium.launch(PRESETS[0])`, jediná predvoľba overená na osvetlenú WebGL scénu:

```js
{ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
```

- Kontajner nemá grafickú kartu, WebGL kreslí softvérovo (SwiftShader). Podľa `barbershop-30/docs/CHECKS.md`:
  „časy snímkov orientačné; prenesené bajty a stavy sú presné“.
- Vyhodnotenie snímok: Python 3 s numpy a Pillow (`uvod-zhoda.py`, `ostrost.py`, prehľady snímok), vždy `python3 -I`.

## 2. Lokálny server

- Nástroje si spúšťajú vlastný server `startStaticServer(root)` zo `shot.mjs`: `127.0.0.1`, voľný port,
  `Cache-Control: no-store`, 403 mimo koreňa, `/` → `index.html`. Na verejnú adresu idú s `--url=`.
- Ručný náhľad HEAD SPA 30 (README, Náhľad): dvojklik na `index.html` funguje, pre skrol spusti server
  `npx http-server -p 8080` a otvor `http://localhost:8080`.
- Lokálny server je bez kompresie: Lighthouse lokálne dal telefónu 69 (LCP 5,3 s), naživo 96 až 99. Výkon meraj naživo.
- Cesty v HTML nech sú relatívne: BARBERSHOP 30 sa tak dá nasadiť do koreňa domény aj do podpriečinka a test to stráži.

## 3. Háčiky v stránke namiesto čakania naslepo

Stránka sama povie, kedy je hotová (`barbershop-30/assets/app.js`):

```js
window.__renderDone = false;
window.__scrollSettled = false;
```

`__renderDone` prepne na `true` po prvom nastavení stavu stránky (`measure`, `apply`), `__scrollSettled` na `true`, keď slučka dobehla cieľ (`scrollY`).

Testy čakajú `waitForFunction(() => window.__renderDone !== false)` a po skoku `__scrollSettled` najprv `false`, potom
`true` (pozri [references/dymovy-test.md](references/dymovy-test.md)). Ďalšie ovládanie z adresy a z konzoly:

| Prostriedok | Účel |
| --- | --- |
| `?film=on` | vynechá overenie grafiky, film beží aj v softvérovom kreslení (testy) |
| `?film=off`, `?motion=off` | pokojná verzia bez filmu |
| `?uvod=off`, `?uvod=znova` | prológ vynechať / pustiť znova (inak raz za návštevu cez `sessionStorage`) |
| `BS30_FILM.goTo(záber, t)` | skok na záber bez jazdy |
| `proFreeze(s)`, `fadeFreeze(v)`, `cutFreeze(meno, mix)` | prológ, prechod alebo strih zastavený na polohe; `null` pustí ďalej |
| `pause(true/false)` | film prestane kresliť, posledný snímok ostane (snímka pri pomalej grafike) |
| `BS30_FILM.state` | `S`, `mix`, `current`, `ready`, `frames`, `pro`, `outside`, `dpr` na kontrolu stavu |

V inom projekte: daj stránke podobné príznaky a ladiace zastavenie animácie. Čakanie na stav je spoľahlivejšie
než pevný počet milisekúnd a zastavená animácia dá rovnakú snímku pri rýchlej aj pomalej grafike.

## 4. Dymový test pred nasadením

```bash
cd barbershop-30
node source/tools/app-smoke.mjs        # OK/FAIL na riadok, exit 1 pri chybe
```

Overené 2026-10-11 (dva behy): 105 OK, 0 FAIL, 283 a 287 s. Kontroluje (podrobne v [references/dymovy-test.md](references/dymovy-test.md)):
- počítač 1440×900 a telefón 390×844: žiadne chyby konzoly, 404 ani externé požiadavky, relatívne cesty, kotvy
  a ich výšky, prepínanie kapitol, titulné karty, menu, lightbox, videá, pohyblivé detaily;
- `?motion=off` a `prefers-reduced-motion`: pokojná verzia bez three.js a videa;
- bez WebGL (`--disable-gpu --disable-3d-apis`): stránka použiteľná, zálohy viditeľné;
- softvérové kreslenie **bez** `?film=on`: film sa po prvom vykreslení vypne (`world-frame`), CLS pod 0,01;
- šírky 375, 390, 430 px na piatich miestach stránky aj pri pásoch: `scrollWidth <= innerWidth`;
- bez app.js pri 412×823 @1,75: `innerWidth` ostane 412 (telefón stránku neoddiali).

**Všeobecná verzia pre akýkoľvek statický web:** [scripts/dymovy-test.mjs](scripts/dymovy-test.mjs) (chyby, relatívne
cesty, externé požiadavky, CLS so zdrojmi posunu, šírky, beh bez skriptov, obmedzenie pohybu; lokálne aj `--url=`).

```bash
# z koreňa repozitára
node toolbox/skills-z-praxe/testy-a-nasadenie/scripts/dymovy-test.mjs --root=barbershop-30 --bez-externych
node toolbox/skills-z-praxe/testy-a-nasadenie/scripts/dymovy-test.mjs --url=https://d8f5s88zjy-art.github.io/head-spa-30/
```

Overené 2026-10-11: BARBERSHOP 30 lokálne všetko OK za 18 až 20 s; HEAD SPA 30 lokálne za 12 až 14 s, pri
niektorých behoch FAIL CLS 0,014 na počítači (posun odkazov v lište okolo 200 ms), inak 0. Na verejnej adrese
BARBERSHOP 30 kolísalo CLS na počítači medzi behmi 0,0001 až 0,05: jeden FAIL CLS najprv zopakuj.

## 5. Cielené testy a snímky (`barbershop-30/source/tools/`)

| Nástroj | Čo meria | Príklad |
| --- | --- | --- |
| `koliesko-test.mjs` | koliesko dobieha plynulo, z vrchu von na ulicu, späť dnu, prológ dobehne | `node source/tools/koliesko-test.mjs` |
| `uvod-meranie.mjs` | časová os prológu (zastavenia, zmena dpr) na rýchlej a pomalej sieti; snímky na zhodu | `--only=os`, `--url=` |
| `uvod-zhoda.py` | posun a mierka statickej zálohy voči prvému snímku filmu (do 8 px a 2,5 %) | `python3 -I source/tools/uvod-zhoda.py` |
| `uvod-shot.mjs` | prológ v 7 polohách, von a dnu, skrol, druhá návšteva, `?film=off` | `--only=mobile` |
| `karty-shot.mjs` | každá titulná karta v tretine pripnutia + prehľad JPG | `--wait=5000 --url=` naživo |
| `scenes-shot.mjs` | pevné polohy celej prehliadky | mapa zastaraná, pozri časť 7 |
| `strih-shot.mjs` | strihy zastavené na mixoch, prehľad riadok na strih | `--cuts=sala --mixes=0,0.5,1` |
| `prechod-shot.mjs` | prechod dvoch záberov na 0 / 0,25 / 0,5 / 0,75 / 1 | `--pairs=sala --only=mobile` |
| `ostrost.mjs` + `ostrost.py` | ostrosť záberu na dvoch adresách (rozptyl Laplaciánu) | `--a=<naživo> --shots=sala` |
| `vaha.mjs` | bajty do `load` a koľko navyše stiahne film | `--url=` |
| `../shot.mjs` | snímka ľubovoľnej adresy, počítač + telefón | `node source/shot.mjs /index.html home 1200 800` |

Všetky sa spúšťajú z koreňa `barbershop-30`. Spomaľovanie siete cez CDP (`uvod-meranie.mjs`):

```js
if (throttle) { const cdp = await ctx.newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: throttle / 8, uploadThroughput: 500e3 / 8 }); }
```

Parametre, výstupy a prahy každého nástroja: [references/nastroje.md](references/nastroje.md).

## 6. Pasce (lekcie)

| Pasca | Riešenie |
| --- | --- |
| Test kolieska čakal na vrchu 300 ms a zlyhával | film berie koliesko nahor až po 350 ms pokoja na vrchu; čakanie 500 ms |
| Odchod von na ulicu nestihol 8 s (znova sa načíta fasáda) | v softvérovom kreslení čakať 25 s; čakaj na stav, nie na čas |
| Po zmene výšok kotiev (70svh, 160svh) padal test výšok | test zosúladiť so zmenou v tom istom commite („Testy prispôsobené výškam kariet“) |
| Test hľadal zálohu úvodu podľa `[data-shot="vstup"]`, úvod sa zmenil | selektor podľa úlohy prvku (`#uvod`), nie podľa obsahu |
| Softvérové kreslenie asi 7 snímok/s: snímka po 1,5 s zachytí strih v pohybe | zastaviť (`cutFreeze`), počkať na 3 nové snímky (`frames >= f + 3`), `pause(true)`; naživo `--wait=5000` |
| Skutočné fps tu zmerať nejde, Lighthouse s filmom mal TBT desiatky sekúnd | artefakt laboratória; brána dá softvéru pokojnú verziu, plynulosť over na zariadení |
| `html{scroll-behavior:smooth}` dáva čierne alebo rozbehnuté snímky | pred skrolom vložiť `html{scroll-behavior:auto !important}`, `behavior: 'instant'` |
| Film sa spúšťa až pohybom návštevníka | `mouse.move(10, 10)` alebo `scrollTo(0, 10); scrollTo(0, 0)` |
| Prológ len raz za návštevu (`sessionStorage`) | prvá návšteva v novom kontexte, druhá novým načítaním v tom istom |
| Headless nevie potiahnuť prstom | na telefóne kliknúť na tlačidlo (`.film-door`) |
| Server testu `no-store`: súbory sa stiahli dvakrát | váhu čítať s vedomím servera; naživo ide druhý dotaz z cache |
| Súbežné testy na jednom stroji zvýšili rozptyl Lighthouse | merať po jednom |
| CLS pri prvom načítaní kolíše medzi behmi | opakovať, pozrieť zdroje posunu (všeobecný skript ich vypíše) |
| Celá sada beží minúty a používateľ dlhý beh prerušil | najprv cielene (`--only`, `--cuts`, `--pairs`, `--shots`, všeobecný test za 20 s), celú sadu až potom |
| Na verejnej adrese headless nestihol 6 s limit na načítanie fasády pri odchode von (pomalé sťahovanie + softvér) | posúdiť, či ide o artefakt testu alebo skutočný limit; tu sa limit zvýšil na 12 s (CHECKS 8) |

## 7. Stav nástrojov (overené proti kódu 2026-10-11)

- `scenes-shot.mjs` má mapu z verzie s 13 kotvami a sekciou `#recepcia`; stránka má 9 kotiev a 8 sekcií.
  `--scenes=9` padá na `TypeError: Cannot read properties of undefined (reading 'top')`. Pred použitím zosúladiť.
- `strih-shot.mjs` importuje `shot.mjs` absolútnou cestou `/home/user/head-spa-30/...`; v inom klone prepísať na `'../shot.mjs'`.
- `koliesko-test.mjs` končí aj pri `FAIL` s kódom 0, výsledok je len v riadkoch `OK`/`FAIL`.
- `ostrost.mjs` uvádza v hlavičke príklad `--shots=sala,kreslo`; záber `kreslo` už v stránke nie je (dnes `kreslo-stred`).
- Hlavička `uvod-meranie.mjs` uvádza mierku do 2 %, `uvod-zhoda.py` povoľuje 2,5 % (platí kód).
- Hlavička `prechod-shot.mjs` spomína pás `.jpg`, kód ho nevytvára.

## 8. Nasadenie na GitHub Pages

```bash
git fetch origin main && git merge origin/main            # admin (admin/) ukladá priamo do main
node tools/build.mjs                                      # HEAD SPA 30 po zmene CSS/JS (esbuild, *.min.*)
git commit ... && git push -u origin <vetva>
git checkout main && git merge --ff-only <vetva> && git push origin main
```

- `.github/workflows/pages.yml` pri pushi do `main` skopíruje **len vymenované** súbory do `_site` (nová stránka
  v koreni sa musí do zoznamu pridať), BARBERSHOP 30 do `/barbershop-30/` s prepisom základnej adresy cez `sed`,
  a pribalí FTP ZIPy.
- Keď `main` medzitým zmenil admin, `--ff-only` alebo push zlúčenie odmietne: zopakuj fetch a merge na vetve.
- Over naživo: Pages sa obnovili po 41 až 61 s; `curl` hlavných súborov (200), odtlačok `md5sum` lokálne aj
  naživo (nie pri súboroch, ktoré prepisuje `sed`), hlavička `cache-control: max-age=600` (snímky s `?v=`),
  nástroje s `--url=`, výsledok s hashom do kontrol.
- Commity po slovensky s predponou projektu („BARBERSHOP 30: …“), telo vysvetľuje prečo, bez podpisov, bez
  odkazov na nástroje a bez zmienky o AI (aj v názve vetvy). Prihlasovacie údaje nikdy do repozitára.

Podrobne, vrátane overenia a commitov: [references/nasadenie.md](references/nasadenie.md).

## 9. Samostatný repozitár a FTP

- **Samostatný repozitár:** `bash source/tools/nasad-barbershop30.sh "BARBERSHOP 30: čo sa zmenilo"` (z koreňa
  `barbershop-30`, po nasadení do `main`). Cieľ sa vytvorí nanovo len z webu (`index.html`, `assets/`, `robots.txt`,
  `sitemap.xml`, `.nojekyll`), bez zmien sa necommituje. Všeobecne: [scripts/nasad-do-repozitara.sh](scripts/nasad-do-repozitara.sh)
  (`REMOTE=... bash nasad-do-repozitara.sh <web> "správa" index.html assets ...`), odskúšané proti lokálnemu holému repozitáru.
- **FTP:** `sh tools/ftp-balik.sh headspa30.sk [absolútna cesta k zip]` pripraví `_ftp` s `.htaccess` a adresami na doménu,
  `python3 tools/ftp-rozdel.py <priečinok> 18` rozdelí na ZIPy pod limit hostingu, `.github/workflows/ftp.yml`
  nahráva po každej zmene, keď sú nastavené tajomstvá `FTP_*`.
- `.htaccess`: https presmerovanie až so SSL certifikátom; žiadne pravidlo www → bez www (Forpsi presmerúva sám,
  slučka presmerovaní v Safari); po zmene súbor nahrať znova.

## V tomto repozitári

- Testy BARBERSHOP 30: `barbershop-30/source/shot.mjs` (server, predvoľby, snímky), `barbershop-30/source/tools/`
  (`app-smoke.mjs`, `koliesko-test.mjs`, `uvod-meranie.mjs`, `uvod-zhoda.py`, `uvod-shot.mjs`, `karty-shot.mjs`,
  `scenes-shot.mjs`, `strih-shot.mjs`, `prechod-shot.mjs`, `ostrost.mjs`, `ostrost.py`, `vaha.mjs`).
- Háčiky v stránke: `barbershop-30/assets/app.js` (`__renderDone`, `__scrollSettled`), `barbershop-30/assets/film.js`
  (`window.BS30_FILM`, `?film=on`), brána a prológ v hlavičke `barbershop-30/index.html`.
- Záznamy kontrol: `barbershop-30/docs/CHECKS.md`, `barbershop-30/docs/INTEGRATION_LOG.md`, snímky `barbershop-30/docs/screenshots/`.
- Nasadenie: `CLAUDE.md` (Postup nasadenia), `.github/workflows/pages.yml`, `.github/workflows/ftp.yml`, `tools/build.mjs`,
  `tools/ftp-balik.sh`, `tools/ftp-rozdel.py`, `tools/ftp.htaccess`, `barbershop-30/source/tools/nasad-barbershop30.sh`,
  README časti Admin (admin/), Náhľad, Nasadenie a Web na vlastnom FTP hostingu.
- HEAD SPA 30 nemá vlastný dymový test; použi `scripts/dymovy-test.mjs --root=.` a po zmene Booqme
  `node tools/booqme-kontrola.mjs` (porovná cenník s Booqme, nič nemení).

## Kontrolný zoznam

- [ ] Pred prácou `git fetch origin main && git merge origin/main` (admin).
- [ ] HEAD SPA 30 po zmene CSS/JS: `node tools/build.mjs`, stránka načíta aktuálne `*.min.*`.
- [ ] Najprv cielený test zmenenej časti (`--only`, `--cuts`, všeobecný `dymovy-test.mjs`), potom celý `app-smoke.mjs` bez FAIL.
- [ ] Testy zmenené spolu s obsahom (počty kotiev, výšky, selektory) a v commite to stojí.
- [ ] Šírky 375, 390, 430 px a beh bez skriptov bez pretečenia; CLS pod 0,01 (pri náhodnom prekročení opakovať, pozrieť zdroje).
- [ ] Snímky telefónu aj počítača pozreté okom (karty, strihy, úvod), nie len čísla.
- [ ] Nová stránka alebo priečinok v koreni pridaný do `cp` v `pages.yml` (pre FTP aj v `tools/ftp-balik.sh`).
- [ ] Commit po slovensky s predponou projektu, bez podpisov a bez zmienky o AI; žiadne heslá ani tokeny.
- [ ] `git merge --ff-only` do `main` a push; po minúte `curl` 200 a zhodný `md5sum` skriptov a štýlov.
- [ ] Naživo `dymovy-test.mjs --url=`, snímky s `?v=`; Lighthouse naživo (skill `rychly-web`).
- [ ] Výsledok s hashom commitu a dátumom zapísaný do kontrol (`docs/CHECKS.md`).
