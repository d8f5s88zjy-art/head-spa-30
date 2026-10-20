# Plynulý skrol a animácie podrobne

Zdroj: `barbershop-30/assets/app.js` (časti 3 až 6b, 12), `barbershop-30/assets/style.css` (P12, hlavička,
dosky), `barbershop-30/assets/film.js` (`measure`, `resize`, `keepAround`), `barbershop-30/docs/CHECKS.md`
(časti 12 a 13), HEAD SPA 30 `assets/style.css`, úpravy podľa auditu (perf-patch, október 2026).

## Slučka stránky: jeden zdroj, čítanie pred zápisom

`barbershop-30/assets/app.js` má jednu slučku `requestAnimationFrame`, ktorá sa spúšťa udalosťou `scroll`
(`passive: true`) a sama sa zastaví, keď dobehne cieľ:

```js
function tick(now) {
  rafId = 0;
  const dt = lastFrame ? Math.min(100, now - lastFrame) : 16.667;
  lastFrame = now;
  readTarget();

  if (motionOff || now < snapUntil) {
    shownP = targetP;
  } else {
    // frame-rate-nezávislý lerp: k = 0.16 pri 60 fps
    shownP += (targetP - shownP) * (1 - Math.pow(1 - 0.16, dt / 16.667));
  }

  if (Math.abs(targetP - shownP) < 0.0005) {
    shownP = targetP;
    apply(shownP);
    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
```

- Dobiehanie je nezávislé od frekvencie displeja (exponent `dt / 16.667`), takže 60 aj 240 Hz idú rovnako rýchlo.
- V pokoji slučka nebeží (nič nekreslí, nemíňa batériu). Pri skrytej karte (`visibilitychange`) sa zruší.
- Skok cez kotvu: stav sa dorovná bez dobiehania (`snapNow`), skrol nech robí prehliadač.

### Rozmery len pri zmene

```js
let resizeTimer = 0;
function scheduleMeasure() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measure();
    snapNow(0); // po zmene rozmerov bez dobiehania
  }, 120);
}
```

`measure()` číta `innerHeight`, `scrollHeight` a `getBoundingClientRect` všetkých kotiev a uloží ich polohy
v dokumente; `apply()` už len počíta z čísel. Spúšťa sa pri `resize`, `orientationchange`, `ResizeObserver` na
`body`, `document.fonts.ready`, `load`.

Film (`film.js`) to isté: výška okna sa číta v `measure()` do `vhNow`, nie v každej snímke (`innerHeight` v snímke
vynúti na telefóne prepočet). Lišta prehliadača pri skrole posiela `resize`; plátno má výšku `100lvh`, takže sa
nemení, a vtedy sa kotvy prepočítajú až o 150 ms:

```js
if ((canvas.clientWidth || innerWidth) === cw && (canvas.clientHeight || innerHeight) === ch) { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); }
```

Správa okolia (sťahovanie a uvoľňovanie záberov, zastavenie videa) neide v každej snímke, ale v `setTimeout(…, 0)`
najviac raz za 100 ms alebo pri zmene záberu či smeru.

## Zápisy: čo najmenej prvkov

`setVar` (`app.js`) zapíše premennú len pri zmene a na konkrétny prvok:

```js
function setVar(name, value, el = html) {
  const v = clamp01(value);
  // posledná zapísaná hodnota pre každú premennú zvlášť (kotva má --sp aj --o)
  const cache = el === html ? varCache : (el.__v || (el.__v = new Map()));
  const last = cache.get(name);
  // zapisuj len pri zmene > 0.002; krajné hodnoty 0 a 1 vždy dosadni presne
  if (last !== undefined && Math.abs(v - last) <= 0.002 && !((v === 0 || v === 1) && v !== last)) return;
  cache.set(name, v);
  el.style.setProperty(name, v.toFixed(4));
}
```

`setClass` a `setAttr` menia triedu či atribút len vtedy, keď je iný. Premenné na kotvách: `--sp` (lokálny priebeh
záberu), `--o` (krytie titulnej karty), `--so` (krytie zálohy), v úvode `--hint`.

Čo sa zmenilo podľa auditu (CHECKS 13):

| predtým | teraz | prečo |
| --- | --- | --- |
| `setVar('--p', p)` na `<html>` v každej snímke, CSS `opacity: clamp(0, 1 - var(--p) / 0.02, 1)` | `--hint` len na kotvu úvodu, CSS `opacity: var(--hint, 1)` | premenná na koreni sa dedí do asi 750 prvkov |
| `--pointer-x/y` na `<html>` pri každom `pointermove` | zrušené | nikto ich nečítal, prepočet celej stránky pri pohybe myši |
| `(window.scrollY \|\| 0) > 80` v `apply()` po zápisoch | `curY > 80` z `readTarget()` | čítanie po zápise vynúti prepočet |
| pás služieb pauzovaný mimo okna | aj svetlo po okraji karty a lesk tlačidla | nekonečné animácie mimo okna tikajú v hlavnom vlákne |

Test, ktorý čítal `--p` z `<html>`, teraz počíta priebeh z polohy:
`scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)` (`source/tools/app-smoke.mjs`).

## Plynulý skrol kolieskom (len myš)

`app.js` časť 6b: koliesko neposúva skokmi po zárezoch, ale posúva cieľ, ku ktorému stránka dobieha s časovou
konštantou 140 ms. Platí len pri `(hover: hover) and (pointer: fine)` a zapnutom pohybe; dotyk, klávesy, posuvník
a kotvy ostávajú natívne; pri Ctrl/Cmd (lupa), vodorovnom skrole, otvorenom menu či lightboxe sa koliesko nechá
prehliadaču. Bez tejto výnimky by lupa a dotyk prestali fungovať.

## Animácie

- Len `transform` a `opacity` (P12 v `style.css`: „Všetko tlmené, vo farbe lampy, len transform a opacity“).
- Nekonečné animácie mimo okna pauzovať (úryvky v SKILL.md). Pomocník `io` v `app.js` pri chýbajúcom
  `IntersectionObserver` všetko zapne, aby nič neostalo skryté.
- Pri `prefers-reduced-motion` alebo `data-motion="off"` všetko stojí v konečnom stave.
- `will-change: transform` len kým sa prvok hýbe (`html[data-motion="on"] .film-still img`), pri bežiacom filme
  `will-change: auto`.
- Opätovné spustenie CSS animácie cez `void b.offsetWidth` (tabuľa hodín) vynúti rozloženie; nápad z auditu je
  WAAPI (`el.animate`), zatiaľ nenasadený (references/audit.md).

## backdrop-filter

Rozmazanie pozadia sa prekresľuje s každým snímkom pod ním (nad filmom či videom v každej snímke).

BARBERSHOP 30 (`style.css`):

```css
@media (min-width: 901px) {
  .board { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
}
```

a pod 900 px `.site-header.is-scrolled { -webkit-backdrop-filter: none; backdrop-filter: none; background: rgba(14, 13, 12, 0.9); }`,
`.chip` rovnako. Pozor: prvok s `backdrop-filter` je pre `position: fixed` potomkov kontajner (komentár pri menu),
preto má mobilné menu výšku zadanú výslovne.

HEAD SPA 30 (`assets/style.css`):

```css
/* 13. tablet a telefón s dotykom: bez rozmazania pozadia nad filmom (každý snímok by sa prekresľoval) */
@media (pointer:coarse){
  .nav::before,.lang-menu,.to-top,.map-link,.tools,.drawer::backdrop,.lb::backdrop{backdrop-filter:none;-webkit-backdrop-filter:none}
```

plus `@media (max-width:640px)` pre lištu, spodný panel, štítky a dialógy; náhrada je takmer nepriehľadné pozadie
(`rgba(..., .95)` až `.98`).

## Pohyblivé pozadie (canvas, WebGL)

Pravidlá stránky platia aj tu (čítanie raz, rozmery v `measure()`, nič zbytočné v snímke). Navyše:

- adaptívne rozlíšenie podľa mediánu a 90. percentilu dĺžky snímky voči frekvencii displeja (najkratšia snímka,
  nie kratšia ako 1/250 s), znižovať po 0,25, zvyšovať až po 8 s stability, nemerať počas nahrávania textúr;
- strop `dpr` 2 (3× brzdilo slabšie telefóny), prekladať shadery vopred, dýchanie kamery v pokoji len obmedzený čas.

Podrobne skill `film-z-fotiek` (references/vykon.md). Skutočné snímky za sekundu bez grafickej karty zmerať nejde;
Safari na iPhone kreslí stránky najviac 60 snímok za sekundu.
