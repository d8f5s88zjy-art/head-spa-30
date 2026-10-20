# Dymový test celej stránky (`barbershop-30/source/tools/app-smoke.mjs`)

`node source/tools/app-smoke.mjs` z koreňa `barbershop-30`, bez parametrov. Každá kontrola vypíše `OK`
alebo `FAIL`, na konci súčet a `exit 1`, ak niečo zlyhalo. Posledný zapísaný výsledok: 105 OK
(CHECKS 11, 9 kotiev, 8 kapitol). Beh trvá niekoľko minút (každý blok spúšťa nový prehliadač a čaká na
dobeh skrolu), preto ho púšťaj až po rýchlych cielených kontrolách.

## Otvorenie stránky so zberom chýb

```js
async function openPage(browser, { viewport = { width: 1440, height: 900 }, mobile = false, query = '', reducedMotion = 'no-preference', raw = false } = {}) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion });
  const page = await ctx.newPage();
  const problems = [], requests = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !filmNoise(m.text())) problems.push(`console.error: ${m.text()}`); });
  page.on('requestfailed', (r) => { if (!filmNoise(r.url())) problems.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !filmNoise(r.url())) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => requests.push(r.url()));
  // prehliadač v teste kreslí softvérovo: ?film=on povolí film aj tak (brána v hlavičke inak dá pokojnú verziu)
  // (raw: adresa bez ?film=on, film overí grafiku sám a pri softvérovom kreslení sa vypne)
  const q = raw || /film=off|motion=off/.test(query) ? query : (query ? query + '&' : '?') + 'film=on';
```

- Poslucháče sa pripájajú **pred** `goto`, inak chyby počas načítania ujdú.
- `filmNoise` toleruje chýbajúci `assets/film.js`, kým modul ešte neexistoval (stránka musí fungovať aj bez neho).
- Po `goto` čaká na `window.__renderDone !== false` (60 s) a vloží `html{scroll-behavior:auto !important}`.

## Skrol, ktorý počká na stránku

```js
async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(y));
  await page.waitForFunction(() => window.__scrollSettled === false, null, { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => window.__scrollSettled === true, null, { timeout: 90000 }).catch(() => {});
  await sleep(250);
}
```

Najprv počká, kým slučka stránky zaznamená pohyb (`false`), potom kým dobehne (`true`). Polohu kotvy meria
tesne pred skokom, lebo písma a obrázky v pásoch môžu stránku ešte posunúť.

## Čo kontroluje (v poradí behu)

1. **Počítač 1440×900 a telefón 390×844, pohyb zapnutý**
   - načítanie bez `pageerror`, `console.error`, zlyhaných požiadaviek a HTTP 4xx;
   - všetky `src`, `href`, `srcset`, `poster`, `data-lightbox-src` relatívne (nezačínajú `/`);
   - žiadne externé požiadavky za behu (všetko z vlastného servera, `data:` a `blob:`);
   - `data-motion="on"`;
   - 9 kotiev `.film-shot` s `data-shot`, `data-f`, `data-mv` a zálohou `picture.film-still img[width][height][alt]`;
   - výšky kotiev: úvod celé okno, karta 0,7 okna, karta pred pásom 1,6 okna (tolerancia ±0,01);
   - prvá záloha `fetchpriority="high"` a nie lazy, ostatné `loading="lazy"`; prvá viditeľná a načítaná alebo beží film;
   - kapitoly 1 až N: skok do tretiny prvej kotvy kapitoly, `data-scene-active` sedí, priebeh rastie, titulná karta svieti;
   - `--sp` na všetkých kotvách v rozsahu 0 až 1; karta druhého záberu (`sud`) zhasnutá pred kotvou, svieti v pripnutí;
   - návrat hore (priebeh 0, scéna 1); `.site-header.is-scrolled`; mobilné CTA skryté v rezervácii, viditeľné v službách;
   - telefón: menu (`aria-expanded` po kliku, CTA skryté, Esc zatvára);
   - lightbox: otvorenie, šípka vpravo mení fotku, Esc zatvorí a vráti fokus na tlačidlo; galéria má 8 fotiek;
   - videá: na počítači hrá video tímu a mimo okna sa pozastaví; na telefóne je okno s videom skryté a nehrá;
   - pohyblivé detaily: tabuľa hodín (`aria-label` začína „Dnes “), pás služieb aspoň 10 položiek, 5 krokov, nadpisy po slovách.
2. **`?motion=off` a `prefers-reduced-motion`**: `data-motion="off"`, bez triedy `world`, `__renderDone`, záloha stojí
   (`opacity 1`, `transform none`), žiadne plátno, titulná karta čakárne celá viditeľná, bez three.js a videí, žiadne video nehrá.
3. **Bez WebGL** (`--disable-gpu --disable-3d-apis`): film nejde (bez `world` alebo s `world-off`), záloha úvodu
   viditeľná a načítaná, tlačidlo rezervácie viditeľné, žiadne chyby okrem správy o WebGL.
4. **Softvérové kreslenie bez `?film=on`** (počítač aj telefón 412×823, `raw: true`): film sa po prvom vykreslení
   vypne (`world-frame` + `world-off`), CLS pod 0,01 (meria `PerformanceObserver` typu `layout-shift` s `buffered: true`),
   záloha úvodu má rámovanie filmu (širšia než okno), bez chýb.
5. **Šírky 375, 390, 430 px**: na 0, 25, 50, 75, 100 % výšky a pri páse tímu a galérie (po 900 ms, keď karty
   nastúpia) `scrollWidth <= innerWidth`; pri chybe vypíše prvé dva prvky, ktoré presahujú (bez `position: fixed`).
6. **Bez app.js** (412×823 @1,75, obrazovka mobilného Lighthouse):

```js
await page.route(/assets\/(app|film)\.js/, (r) => r.abort());
await page.goto(`${base}/index.html`, { waitUntil: 'load', timeout: 60000 });
await sleep(500);
const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
ok(r.iw === 412 && r.sw <= r.iw, '[412 px bez app.js] žiadne vodorovné pretekanie, telefón stránku neoddiali', JSON.stringify(r));
```

   Prečo `iw === 412`: pri pretečení telefón stránku oddiali a `innerWidth` narastie (BARBERSHOP 30: 1648 px),
   po dobehnutí skriptu preskočí späť a Lighthouse namerá CLS 0,14 (skill `rychly-web`, časť CLS).

## Prečo jednotlivé bloky

- `?film=on` v teste: brána v hlavičke by v prehliadači bez grafickej karty dala pokojnú verziu a test by film
  vôbec nevidel. Samostatný blok bez `?film=on` overí práve tú pokojnú cestu (to, čo uvidí aj Lighthouse).
- Bez WebGL a bez app.js: stránka musí byť použiteľná, aj keď skript zlyhá alebo prehliadač nevie grafiku.
- Šírky a CLS: chyby, ktoré na počítači nevidno a Lighthouse ich na telefóne trestá.

## Všeobecná verzia

`../scripts/dymovy-test.mjs` robí kontroly, ktoré nezávisia od filmu (chyby, relatívne cesty, externé
požiadavky, CLS, šírky, beh bez skriptov, obmedzenie pohybu), pre ľubovoľný statický web, lokálne aj naživo
(`--url=`). Kontroly konkrétnych prvkov (menu, lightbox, kapitoly) dopíš podľa stránky v štýle `app-smoke.mjs`.
