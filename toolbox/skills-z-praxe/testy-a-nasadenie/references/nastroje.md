# Nástroje na testy a snímky (BARBERSHOP 30)

Všetky sú v `barbershop-30/source/tools/` a spúšťajú sa z koreňa `barbershop-30` (cesty si skript
odvodí sám zo svojej polohy, okrem `strih-shot.mjs`, pozri nižšie). Každý si spustí vlastný statický
server (`startStaticServer` zo `source/shot.mjs`, voľný port, `Cache-Control: no-store`); tie, ktoré
majú voľbu `--url=` (`uvod-meranie`, `uvod-shot`, `karty-shot`, `prechod-shot`, `vaha`), idú na zadanú
adresu, `ostrost.mjs` má `--a=`/`--b=`. Prehliadač: `chromium.launch(PRESETS[0])` (SwiftShader cez ANGLE).
Predvolený výstup snímok: `barbershop-30/docs/screenshots/` (`strih-shot.mjs` do `strihy/`, `ostrost.mjs`
do `ostrost/` v ňom).

Prehľad: kto hlási chybu návratovým kódom a kto len vypisuje.

| Nástroj | Výsledok | Exit 1 pri chybe |
| --- | --- | --- |
| `app-smoke.mjs` | OK/FAIL na riadok, súčet | áno |
| `uvod-meranie.mjs` | časová os prológu, snímky na zhodu | áno (čakanie pri dverách, zmena dpr) |
| `uvod-zhoda.py` | posun a mierka zálohy voči filmu | áno |
| `koliesko-test.mjs` | OK/FAIL na riadok | **nie** (čítaj výstup) |
| `uvod-shot.mjs`, `karty-shot.mjs`, `scenes-shot.mjs`, `strih-shot.mjs`, `prechod-shot.mjs` | snímky a stavy na posúdenie okom | nie |
| `ostrost.mjs` + `ostrost.py` | číslo ostrosti | nie |
| `vaha.mjs` | bajty do `load` a navyše | nie |

## shot.mjs: snímka ľubovoľnej adresy (`barbershop-30/source/shot.mjs`)

```
node source/shot.mjs <url> <name> [scrollY] [waitMs]
node source/shot.mjs /index.html home 1200 800
node source/shot.mjs https://example.com/ remote
voľby: --scroll=<px> --wait=<ms> (400) --preset=<n> (0) --dpr=<n> (1) --full --out=<dir> --only=desktop|mobile
```

- Cesta začínajúca `/` ide cez vstavaný server z koreňa projektu, `http(s)://` sa otvorí priamo.
- Počítač 1440×900, telefón 390×844, `colorScheme: 'dark'`. Výstup `<out>/<name>-desktop.png` a `-mobile.png`.
- Čaká na `window.__renderDone !== false` (najviac 20 s) a na `document.fonts.ready`.
- Pred skrolom aj pred snímkou vloží `html{scroll-behavior:auto !important}` (inak „čierne/rozbehnuté snímky“).
- Exportuje `startStaticServer` a `PRESETS` pre ostatné nástroje. `PRESETS[0]` je podľa komentára jediný
  overený na osvetlenú WebGL scénu; ďalšie (`--use-gl=swiftshader`, `--disable-gpu`, `headless=new`, bez
  argumentov) sú na skúšanie.

## app-smoke.mjs: dymový test celej stránky

`node source/tools/app-smoke.mjs` (bez parametrov). Podrobne: [dymovy-test.md](dymovy-test.md).

## koliesko-test.mjs: koliesko myši a návrat na ulicu

`node source/tools/koliesko-test.mjs`, počítač 1440×900, adresa `?uvod=off&film=on`.

1. `mouse.wheel(0, 300)`, potom 14 vzoriek `scrollY` po 50 ms. OK, keď aspoň 3 vzorky sú medzi 0 a 300
   a posledná ≥ 295 („stránka dobieha plynulo“, nedoskočí naraz).
2. Čaká na `world-in` (40 s), koliesko o −600, čaká na `scrollY === 0` (15 s), potom **500 ms**
   (film berie koliesko nahor až po 350 ms pokoja na vrchu, `atTopSettled`).
3. Koliesko o −100: `BS30_FILM.state.leaving || outside` do 8 s (kamera ide von na ulicu).
4. Čaká na `state.outside` **25 s** (vonku sa znova načíta fasáda, pri softvérovom kreslení aj viac než 8 s).
5. Koliesko o +100: prológ beží (`state.pro`, 5 s) a dobehne na rohožku (`S ≈ 1`, 15 s).

Skript nevolá `process.exit`: aj pri `FAIL` končí s kódom 0, výsledok sú riadky `OK`/`FAIL`.

## uvod-meranie.mjs + uvod-zhoda.py: plynulosť úvodu

```
node source/tools/uvod-meranie.mjs [--out=dir] [--url=http://...] [--only=os|zhoda]
python3 -I source/tools/uvod-zhoda.py [adresár so snímkami]
```

**os** (časová os prológu): telefón 390×844 @2, čistý kontext, rýchla sieť a pomalá sieť cez CDP:

```js
if (throttle) { const cdp = await ctx.newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: throttle / 8, uploadThroughput: 500e3 / 8 }); }
```

`addInitScript` zapisuje každých 50 ms `S`, `dpr`, `pro`, `cap` a triedy `<html>` (najviac 30 s). Vypíše prvý
snímok, začiatok chôdze, koniec prológu, zmeny dpr a zastavenia (rovnaké `S` dlhšie než 250 ms počas chôdze).
Chyba: zastavenie pri dverách (`S` 0,33) na rýchlej sieti akékoľvek, na pomalej (1,6 Mb/s, 150 ms) dlhšie
než 1000 ms (zastavenie sa ráta až od 250 ms), alebo zmena dpr počas prológu. Komentár v skripte: časy sa v softvérovom kreslení nezhodujú
s telefónom, zastavenia a zmeny dpr áno.

**zhoda**: telefón 390×844 @2 a počítač 1440×900, prvá návšteva (`proFreeze(0)`) aj druhá (ťuknutie alebo
pohyb myšou). Skryje dosky a hlavičku, odfotí zálohu a potom film vo výreze 12 až 88 % výšky:
`zhoda-{zaloha,film}-<zariadenie>[-2].png`. Zálohu vracia cez `style.setProperty(..., 'important')`, lebo
`cssText` by zmazal vlastné premenné v inline štýle.

`uvod-zhoda.py`: odstráni jas (odčíta Gaussovo rozmazanie 12 px), fázová korelácia na strede 80 % dá posun,
hrubé hľadanie mierku 0,95 až 1,05 po 0,01. OK pri posune do 8 px (pri snímke užšej než 800 px sa limit
násobí `W / 390`, telefón @2 má 780 px, teda 16 px) a mierke do 2,5 %. Zapísané výsledky (CHECKS 9): telefón dx 0 / dy −6
px, mierka 0,99; počítač dx +7 / dy −5 px, 0,98.

## uvod-shot.mjs: prológ v snímkach a jeho stavy

`node source/tools/uvod-shot.mjs [--out=dir] [--only=desktop|mobile] [--url=http://...]`

Počítač 1440×900 aj telefón 390×844 (@1), čistý kontext (bez `sessionStorage`, prológ povolený):
1. prológ hneď zastaví `proFreeze(0)`, počká na `world-in` (20 s), potom polohy `0, 0.18, 0.35, 0.5, 0.62,
   0.8, 1`, každá 900 ms a snímka `uvod-<zariadenie>-s000.png` až `s100.png`;
2. `uvod.von()` → stav vonku (15 s), snímka `-vonku`; dnu kolieskom (počítač) alebo klikom na `.film-door`
   (telefón, potiahnutie prstom headless nevie), snímka `-znova`;
3. skrol o 700 px, 1500 ms, snímka `-scroll700`;
4. nové načítanie v tom istom kontexte: prológ sa nepustí, záloha je rohožka; von aj pri druhej návšteve;
5. `?film=off`: pokojná verzia bez plátna, snímka `-pokojna`.
Na konci súhrn stavov `BS30_FILM.state` a chyby konzoly.

## karty-shot.mjs: všetky titulné karty

`node source/tools/karty-shot.mjs [--out=dir] [--only=mobile|desktop] [--wait=1500] [--url=...]`

Adresa `?uvod=off&film=on`, telefón 390×844 @2, počítač 1440×900. Každá kotva `.film-shot` v 35 % voľnej
výšky (pri `title-long` bez jedného okna), čaká na `__scrollSettled` (30 s) a `--wait`. Výstup
`karta-<nn>-<záber>-<zariadenie>.png` a prehľad `karty-<zariadenie>.jpg` (Pillow cez `python3 -I -c`,
7 stĺpcov na telefóne, 3 na počítači). Naživo `--wait=5000`: pri 1,5 s zachytí softvérové kreslenie
(asi 7 snímok za sekundu) strih ešte v pohybe (CHECKS 10).

## scenes-shot.mjs: polohy celej prehliadky

```
node source/tools/scenes-shot.mjs                        # všetko -> docs/screenshots/scena-*.png
node source/tools/scenes-shot.mjs --only=desktop --scenes=1,3,3x
node source/tools/scenes-shot.mjs --out=/tmp/iter1 --wait=800 --query=?film=off
```

Mapa `SHOTS` (prvá kotva sekcie, `x` = polovica cesty k ďalšej kotve, `b` = pás, `7m` cenník, `9f` pätička).
Po skoku čaká `wait` (700), `__scrollSettled` (90 s) a 500 ms; vypíše polohu, priebeh, aktívnu scénu a `--sp`
kotiev v okne. **Pozor:** mapa je z verzie s 13 kotvami a sekciou `#recepcia`. Stránka má po skrátení cesty
(2026-10-11) 9 kotiev a 8 sekcií, takže id odkazujúce na kotvy 9 až 12 a `2b` nesedia. Pred použitím mapu
zosúlaď s `index.html` (alebo použi `karty-shot.mjs`, ktorý kotvy číta zo stránky).

## strih-shot.mjs: zastavené strihy

```
node source/tools/strih-shot.mjs [--only=desktop|mobile] [--cuts=pro,rohozka,...] [--mixes=0,0.5,1] [--out=dir] [--content]
```

Strih sa vyberá podľa záberu, z ktorého ide (`pro` = prológ, adresa `?uvod=znova`; ostatné `?uvod=off`).
Bez `--content` skryje všetko okrem plátna. Pre každý mix (predvolene `0,0.2,0.35,0.5,0.65,0.8,1`):

```js
const f0 = await page.evaluate(([n, v]) => { window.BS30_FILM.cutFreeze(n, v); return window.BS30_FILM.state.frames; }, [name, m]);
// softvérová grafika kreslí pomaly: čakať, kým sa nakreslia aspoň tri snímky v novej polohe
await page.waitForFunction((f) => window.BS30_FILM.state.frames >= f + 3, f0, { timeout: 30000, polling: 100 }).catch(() => log.push(`${kind} ${name} ${m}: snímky nedobehli`));
```

potom `pause(true)`, 150 ms, snímka (timeout 120 s), `pause(false)`. Výstup `<odkiaľ>-<zariadenie>-m<mix>.png`,
prehľad `strihy-<zariadenie>.jpg` (riadok na strih, stĺpec na mix), chyby konzoly `konzola.txt`
(predvolene `docs/screenshots/strihy/`). **Pozor:** skript importuje `shot.mjs` absolútnou cestou
`/home/user/head-spa-30/barbershop-30/source/shot.mjs`; v inom klone treba cestu prepísať na relatívnu
(`'../shot.mjs'` ako v ostatných nástrojoch).

## prechod-shot.mjs: prechod medzi dvoma zábermi

`node source/tools/prechod-shot.mjs [--out=dir] [--pairs=sala,sud] [--only=desktop|mobile] [--url=http://...]`

`goTo(záber, 0.5)`, čaká na načítanie aktuálneho aj nasledujúceho záberu (40 s), potom `fadeFreeze(m)` pre
`0, 0.25, 0.5, 0.75, 1`, vždy 900 ms a snímka `prechod-<záber>-<zariadenie>-m<mix>.png`. Film sa rozbehne
skrolom o kúsok a späť (`scrollTo(0, 10); scrollTo(0, 0)`). Komentár v hlavičke spomína aj pás `.jpg`,
kód ho nevytvára.

## ostrost.mjs + ostrost.py: porovnanie ostrosti dvoch verzií

```
node source/tools/ostrost.mjs --a=https://.../barbershop-30/ --b=http://127.0.0.1:8765/ [--out=dir] [--shots=sala,kreslo]
```

Bez `--b` sa porovnáva s lokálnym serverom. Predvolené zábery `sala,stol,cakaren`. Príklad `kreslo`
z hlavičky skriptu je zo staršej cesty: stránka má dnes zábery `rohozka, sala, stol, cakaren, sala-rano,
kreslo-stred, kava, sud, vstup`, pri neznámom mene `goTo` vráti `false` a skript vypíše „záber nedobehol“.
Telefón 390×844 @3, počítač 1440×900 @2, záber cez
`goTo(záber, 0.5)`, čaká na načítanie v cieľovej veľkosti a `mix === 0` (40 s) a 1500 ms. `ostrost.py`:
rozptyl Laplaciánu jasu v strede 60 % × 60 %, väčšie = ostrejšie. Tabuľka vypíše aj stupeň fotky a dpr.
Rôzna kompozícia výrezu číslo ovplyvní (sála 560 → 546 pri inom výreze), preto CHECKS 6 pridáva aj
výrezy 1 : 1 na porovnanie okom.

## vaha.mjs: bajty prvého obrazu

`node source/tools/vaha.mjs [--url=http://...]`

Počítač 1440×900 a telefón 390×844 @3, režimy `?film=off` a `?film=on`. Sčíta `response.body()` do
udalosti `load`; s filmom čaká na `world-in` (20 s) a 2500 ms a vypíše, koľko stiahol prológ navyše.
Rozpis podľa typu a 6 najväčších súborov nad 40 kB. Zapísané (CHECKS 4): počítač do `load` 383 KB,
prológ navyše 1 769 KB; telefón 351 KB a 1 379 KB. Server testu posiela `no-store`, preto sa záloha a film
stiahli dvakrát; naživo ide druhý dotaz z cache. Bajty sú z lokálneho servera bez kompresie (GitHub Pages
posiela text gzipom, asi 4× menší).

## Lighthouse

Skripty na viac behov a súhrn sú v skille `rychly-web` (`scripts/lighthouse.sh`, `scripts/lh-suhrn.mjs`).
Meraj naživo: lokálny server bez kompresie (python `http.server`) dal telefónu 69 bodov (LCP 5,3 s), naživo
96 až 99 (CHECKS 10).
