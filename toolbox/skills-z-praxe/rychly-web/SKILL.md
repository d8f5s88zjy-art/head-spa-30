---
name: rychly-web
description: Rýchly a plynulý statický web, Lighthouse mobil 95+ a desktop 100 (LCP, FCP, CLS, TBT, Speed Index) a plynulý skrol 60 až 240 Hz bez sekania (jank). Použi pri meraní a ladení výkonu (Lighthouse, PageSpeed Insights, Core Web Vitals, simulate vs observed, Lantern), pri ťažkých obrázkoch na telefóne (AVIF, WebP, srcset, preload), pri posune rozloženia (layout shift), pri sekaní skrolu (style recalc, CSS premenné, requestAnimationFrame, IntersectionObserver, backdrop-filter) a pri overovaní nálezov auditu výkonu meraním.
---

# Rýchly a plynulý web

Postup, ktorým web BARBERSHOP 30 (`barbershop-30/`) dosiahol naživo Lighthouse telefón medián 97 (8 behov, 93 až 99)
a počítač 100, prístupnosť, osvedčené postupy a SEO 100, CLS 0, a ktorým sa skrol zbavil prepočtu štýlu celej stránky v každej
snímke. Platí pre statické weby bez frameworku (HTML, CSS, JS, GitHub Pages), s pohyblivým pozadím aj bez neho.

Zásada: **meraj, oprav jednu vec, meraj znova tou istou metódou.** Dojem ani tvrdenie auditu nie je meranie.

## Kedy použiť

- Lighthouse alebo PageSpeed Insights na telefóne pod 95, na počítači pod 100, alebo veľký rozptyl medzi behmi.
- Pomalý prvý obraz (LCP, FCP), posun rozloženia (CLS), dlhé úlohy (TBT).
- Skrol, animácie alebo pohyblivé pozadie na telefóne sekajú, ventilátor či batéria trpia v pokoji.
- Audit výkonu navrhol úpravy a treba rozhodnúť, ktoré naozaj pomôžu.

Nepoužívaj na samotný WebGL film (renderer, adaptívne DPR, nahrávanie textúr): to je skill `film-z-fotiek`
([references/vykon.md](../film-z-fotiek/references/vykon.md)); video pri skrolovaní je `video-a-sekvencie`.

## 1. Meraj správne

1. **Naživo alebo na serveri s gzipom.** GitHub Pages posiela text komprimovaný (asi 4× menší). Lokálny server bez
   kompresie dal BARBERSHOP 30 na telefóne 69 bodov (LCP 5,3 s), naživo po oprave CLS 96 až 99.
2. **Viac behov, jeden po druhom.** Telefón aspoň 5 (lepšie 8), počítač 2; zapíš všetky čísla, medián aj najhorší.
   Súbežné testy na tom istom stroji zvyšujú rozptyl.
3. **Pozri simulované aj pozorované hodnoty.** Lighthouse predvolene simuluje (`throttlingMethod: simulate`,
   simulácia Lantern) pomalú 4G a 4× pomalší procesor. Prepočítava však to, čo sa v laboratórnom behu naozaj
   stalo: v 8 behoch BARBERSHOP 30 mali behy 93 a 94 bodov pozorovaný prvý obraz až po 2,5 s a simulovaný
   Speed Index 4,4 s, behy 96 až 99 pozorovaný obraz 0,6 až 1,5 s. Neskorý pozorovaný prvý obraz stojí body.
4. **Laboratórny prehliadač nemá grafickú kartu** (SwiftShader). WebGL tam kreslí snímku aj 1,7 s, TBT desiatky
   sekúnd je artefakt. Brána (časť 3) dá softvérovému kresleniu pokojnú verziu, takže Lighthouse meria tú.

```bash
# tento skill: 8 behov telefónu a 2 počítača za sebou; na konci sám vypíše súhrn (skóre, simulované/pozorované
# FCP, LCP, SI, TBT, CLS, prvok LCP, medián a najhorší beh)
scripts/lighthouse.sh https://<web>/ 8 2 ./lh
node scripts/lh-suhrn.mjs ./lh    # súhrn znova z uložených JSON (aj zo starších behov)
```

Podrobne (nastavenia simulácie, polia v JSON, história meraní, váha a ostrosť): [references/meranie.md](references/meranie.md).

## 2. LCP: prvý veľký obraz

- Zisti, čo je prvok LCP (`lh-suhrn.mjs` ho vypíše). Na BARBERSHOP 30 je to text nadpisu úvodu nad fotkou a na
  telefóne v Lighthouse čakal na fotku úvodu; so zmenšením fotky (a ďalšími opravami v CHECKS 10) klesol LCP
  z 2,9 až 3,3 s na 2,1 až 2,4 s.
- **Fotka úvodu na telefón v najmenšom stupni, ktorý stačí**, a v tom istom stupni, ktorý neskôr použije film
  (inak sa sťahuje dvakrát). Na BARBERSHOP 30 je to výrez na výšku široký 1086 px (`*-m-1086`, 1086×1931),
  len tento prvý obraz v nižšej kvalite (`barbershop-30/source/tools/film.py`):

```python
# prvý obraz stránky na telefóne (záloha úvodu, stupeň 1086): úspornejšie, aby text úvodu nečakal na veľkú
# fotku (Lighthouse telefón); pri 100 % rozdiel takmer neviditeľný, vyššie stupne ostávajú v plnej kvalite
FIRST_Q = {'vstup-m-1086': (46, 74), 'rohozka-m-1086': (46, 74)}
```

  Výsledok: 107 a 122 kB namiesto 215 a 272 kB (AVIF). Ostatné stupne AVIF 66 / WebP 84. Keď bola fotka úvodu
  278 kB, LCP na telefóne stúpol na 3,1 až 3,3 s; s rovnakým stupňom ako film klesol na 1,6 s.
- **Preload z hlavičky s tými istými `imagesrcset` a `imagesizes` ako `<picture>`**, `fetchPriority = 'high'`,
  aby sa fotka sťahovala hneď s HTML a `<picture>` ju vzal z cache (`barbershop-30/index.html`, inline skript):

```js
l.rel='preload';l.as='image';l.type='image/avif';l.setAttribute('imagesrcset',W[n].map(function(w,i){return 'assets/img/film/'+n+'-'+w+'.avif '+S[n].split(',')[i];}).join(', '));l.setAttribute('imagesizes','(max-width: 720px) 93vw, 124vw');l.fetchPriority='high';document.head.appendChild(l);
```

- **Obrázky `position: fixed` sú vždy „v okne“**, `loading="lazy"` nepomôže. Mimo okolia aktuálnej karty
  majú `display: none`; okolie určuje trieda `is-near` z app.js (aktuálna karta, dve ďalšie a jedna
  predchádzajúca; kým sa stránka nenačíta celá, len úvod).

## 3. FCP: nič drahé pred prvým vykreslením

- Štýl ako prvý súbor; písma `@font-face` priamo v `<style>` v hlavičke, `font-display: swap`, preload len rezov
  z prvej obrazovky (aj kurzíva, ak je v nadpise úvodu). Písma orezané na použité znaky (HEAD SPA 30 spolu asi 93 kB).
- Prvý nadpis rozdelený na slová už v HTML, úvod viditeľný priamo z CSS; telo sa neskrýva, kým nenabehne skript
  (HEAD SPA 30).
- **Brána v `<head>` len z lacných kontrol** (`'WebGL2RenderingContext' in window`, `prefers-reduced-motion`,
  `saveData`, výška okna, `deviceMemory`, `hardwareConcurrency`). WebGL kontext v hlavičke oneskoril prvý obraz
  telefónu o 1 s. Drahú kontrolu grafiky rob až po prvom vykreslení (`barbershop-30/assets/film.js`):

```js
const fin = () => { clearTimeout(t); requestAnimationFrame(() => setTimeout(r, 50)); };
const fcp = (list) => list.some((e) => e.name === 'first-contentful-paint');
if (fcp(performance.getEntriesByType('paint'))) { fin(); return; }
t = setTimeout(fin, 3000);
try { const po = new PerformanceObserver((l) => { if (fcp(l.getEntries())) { po.disconnect(); fin(); } }); po.observe({ type: 'paint', buffered: true }); } catch (e) { /* bez Paint Timing čaká záloha */ }
```

- Veľké knižnice (three.js) až po `load` a po prvom obraze, bez úvodného filmu až po prvom pohybe návštevníka; bez
  pohybu ich po 4 s stiahni do cache v `requestIdleCallback` s `fetch(src, { priority: 'low' })`. Pohyb počas
  čakania si zapamätaj.
- Časti pod prvou obrazovkou spúšťaj vo voľnej chvíli (`requestIdleCallback`, záloha `setTimeout`), sekcie majú
  `content-visibility: auto` s `contain-intrinsic-size` (HEAD SPA 30, príchod s `#kotvou` vypne cez `cv-all`).
- CSS a JS minifikuj (`node tools/build.mjs`, esbuild) a stránka nech načítava `*.min.*` (HEAD SPA 30; BARBERSHOP 30
  načítava zdrojové súbory a spolieha sa na gzip GitHub Pages).

Podrobnosti a ďalšie úryvky: [references/prvy-obraz.md](references/prvy-obraz.md).

## 4. CLS: nič neposkočí

- **Pasca so zmenšením zobrazenia na telefóne.** Skryté popisky `.visually-hidden` (`position: absolute`) vo
  vodorovnom páse s `overflow-x: auto` unikli z pásu, lebo pás nebol kontajner pre absolútne umiestnené prvky.
  Stránka mala 2326 px na šírku, telefón ju v prvých snímkach oddialil na 1648 px a po app.js preskočila späť:
  CLS 0,14. Oprava v `barbershop-30/assets/style.css`:

```css
/* position: relative drží v páse aj absolútne umiestnené prvky (skryté popisky .visually-hidden),
   inak by z neho unikli a stránku roztiahli do šírky (telefón by ju oddialil) */
@media (max-width: 640px) {
  .team-grid, .gallery-grid {
    position: relative;
```

- Kontroluj `scrollWidth <= innerWidth` na šírkach 375, 390, 430 px aj **bez app.js** pri 412×823 @1,75
  (obrazovka mobilného Lighthouse); telefón pri pretečení zväčší `innerWidth` (`source/tools/app-smoke.mjs`).
- Plávajúce tlačidlo začína skryté priamo v HTML (`class="mobile-cta is-hidden"`), karty okrem úvodu čakajú
  na prvý výpočet app.js (`opacity: var(--o, 0)`); predtým CLS 0,13. Nástupy len cez `transform` a `opacity`.
- Pevné rozmery: `width`/`height` na obrázkoch, zálohy a plátno s pevnou veľkosťou, výrezy s `object-fit: cover`
  (audit osvedčených postupov `image-aspect-ratio`).

## 5. Plynulý skrol 60 až 240 Hz

Jedna slučka `requestAnimationFrame`, ktorá **najprv číta, potom píše**, a zápisy, ktoré prepočítajú čo najmenej
prvkov. Výsledok na BARBERSHOP 30 (telefón, CPU 4×, bez filmu): prepočty štýlu zasiahnu asi 25 prvkov na snímku,
pred úpravou ich audit nameral 693 na telefóne a 752 na počítači.

1. **Čítaj raz na začiatku snímky.** `scrollY` po zápise štýlu vynúti prepočet (`barbershop-30/assets/app.js`):

```js
let curY = 0;
function readTarget() {
  curY = window.scrollY || 0;
  targetP = clamp01(curY / maxScroll);
}
// ... v apply() už len: const scrolled = curY > 80;   // nečítať scrollY po zápisoch štýlu
```

   Rozmery (`innerHeight`, `getBoundingClientRect`) len v `measure()` pri `resize` (odložene o 120 ms),
   `ResizeObserver` na `body` a `document.fonts.ready`. `innerHeight` v každej snímke vynúti prepočet na telefóne
   (film v `film.js` preto berie výšku okna z `measure()` do `vhNow`). Lišta prehliadača pri skrole posiela
   `resize`; keď sa plátno (`100lvh`) nezmenilo, film prepočíta kotvy až o 150 ms (`film.js`).
2. **CSS premenné nikdy na `<html>` v každej snímke.** Premenná na koreni sa dedí do celej stránky a každý zápis
   prepočíta štýl všetkých prvkov (asi 750). Píš ju na prvok, ktorý ju číta:

```js
if (shots[0] && shots[0].first) setVar('--hint', 1 - p / 0.02, shots[0].el);
```

   `setVar` zapisuje len pri zmene nad 0,002 (krajné 0 a 1 vždy presne), triedy a atribúty len pri zmene.
   Kontrolné meranie skriptom `cena-premennej.mjs` (telefón, CPU 4×, 741 prvkov): zápis na `<html>` asi 10×
   drahší ako na jednu kotvu (dva behy: 49,6 oproti 4,6 ms a 85,6 oproti 8,4 ms; absolútne čísla kolíšu so
   zaťažením stroja, pomer platí).
3. **Zruš zápisy, ktoré nikto nečíta.** `--pointer-x/y` na `<html>` pri každom pohybe myši prepočítali celú
   stránku a nič ich nepoužívalo.
4. **Nekonečné animácie mimo obrazovky pauzuj** (komentár v app.js: mimo okna ich Chrome nepustí na kompozitor
   a tikajú v hlavnom vlákne):

```js
io([...d.querySelectorAll('.marquee, .beam, .btn-primary')], (el, on) => el.classList.toggle('is-off', !on));
```

```css
.marquee.is-off .marquee-track, .beam.is-off > .beam-line::before, .btn-primary.is-off::after { animation-play-state: paused; }
```

5. **Žiadny `backdrop-filter` na telefóne.** BARBERSHOP 30 rozmazáva dosky len `@media (min-width: 901px)`,
   lištu a štítky pod 900 px vypína; HEAD SPA 30 vypína pod 640 px a pri `pointer: coarse`.
6. Animuj len `transform` a `opacity`; `will-change` len kým prvok naozaj hýbe (pri bežiacom filme
   `will-change: auto`). Pri skrytej karte slučku zastav (`visibilitychange`).

Merať: `scripts/skrol-vlakno.mjs` (ms na snímku a prvkov v prepočte), `scripts/cena-premennej.mjs`.
Podrobne: [references/plynuly-skrol.md](references/plynuly-skrol.md).

## 6. Audit výkonu a jeho overenie

1. Audit z viacerých pohľadov naraz (JS v každej snímke, grafika, stránka a CSS), len čítanie a meranie.
2. Každý nález nezávisle preverí skeptik: stojí to naozaj čas v každej snímke, ušetrí to úprava, nič nerozbije?
3. Zapracuj len overené nálezy s nízkym rizikom; meraj pred a po tou istou metódou na tom istom stroji.
4. Zapíš do kontrol (napr. `docs/CHECKS.md`) aj čo sa nezapracovalo a prečo.

Tvrdenia auditu over meraním: audit inou metódou uvádzal prepočet štýlu 48,7 → 7,4 ms na snímku, meranie pri
4× spomalení dalo hlavné vlákno 10,9 → 9,6 ms a prepočet štýlu 5,1 → 4,8 ms. Overovateľ zamietol aj zmenu
svetla po okraji karty na `width: 200%`, lebo na úzkom telefóne nepokryje rohy karty.

Zoznam overených a ešte nenasadených nápadov, zamietnuté návrhy s dôvodmi a skript workflowu:
[references/audit.md](references/audit.md).

## Pasce (lekcie)

| Pasca | Riešenie |
| --- | --- |
| Lokálny Lighthouse bez kompresie, telefón 69 | merať naživo alebo so serverom s gzipom |
| Jeden beh Lighthouse, náhodných 93 | 5 až 8 behov, medián a najhorší, pozorovaný prvý obraz |
| Test stiahne fotku dvakrát (`Cache-Control: no-store`) | váhu rátať s vedomím servera; naživo ide z cache |
| WebGL kontext v `<head>` | len lacné kontroly; GPU až po FCP + rAF + 50 ms |
| Fotka úvodu 278 kB, LCP 3,3 s | najmenší stupeň pre telefón, nižšia kvalita len pre prvý obraz |
| Pevné obrázky sa sťahujú všetky | mimo okolia `display: none` |
| Abspos prvky unikli z vodorovného pásu, CLS 0,14 | `position: relative` na páse, test šírky bez app.js |
| Premenná na `<html>` v každej snímke | písať na prvok, ktorý ju číta |
| `scrollY`/`innerHeight` po zápise štýlu | čítať raz na začiatku snímky, rozmery v `measure()` |
| Nekonečné animácie mimo okna | IntersectionObserver, `is-off`, `animation-play-state: paused` |
| Audit sľúbil prepočet štýlu 48,7 → 7,4 ms | merať pred a po; zapísať skutočné čísla |

## V tomto repozitári

- BARBERSHOP 30: `barbershop-30/index.html` (brána, preload úvodu, písma v hlavičke), `barbershop-30/assets/app.js`
  (`readTarget`, `apply`, `setVar`, `is-off`), `barbershop-30/assets/style.css` (`.visually-hidden`, pásy
  `position: relative`, `is-near`, `backdrop-filter` len na počítači, pauzy animácií), `barbershop-30/assets/film.js`
  (brána po FCP, `vhNow`, resize 150 ms), `barbershop-30/source/tools/film.py` (`FIRST_Q`, stupne),
  `vaha.mjs` (bajty do `load`), `ostrost.mjs` + `ostrost.py` (ostrosť po zmenšení), `app-smoke.mjs` (CLS, šírky),
  merania a opravy v `barbershop-30/docs/CHECKS.md` (časti 4, 6, 8 až 13).
- HEAD SPA 30: `index.html` (písma v hlavičke, `style.min.css`, brána), `assets/style.css` (`content-visibility`,
  `cv-all`, `backdrop-filter: none` na telefóne), `assets/app.js` (`idle()` cez `requestIdleCallback`),
  `tools/build.mjs` (esbuild, výstup `*.min.*`; esbuild v `PATH` alebo `ESBUILD=`), README časti Rýchlosť a
  prístupnosť, Výkon na mobile.
- Rozdiel: brána HEAD SPA 30 v `index.html` ešte vytvára WebGL2 kontext v hlavičke (`getContext('webgl2')`), čo na
  BARBERSHOP 30 oneskorilo prvý obraz telefónu o 1 s. Pred zmenou zmeraj (časť 1).

## Kontrolný zoznam pred nasadením

- [ ] Po zmene CSS/JS build (`node tools/build.mjs`), stránka načítava aktuálne `*.min.*`.
- [ ] Prvá obrazovka bez skriptu: nadpis aj fotka úvodu viditeľné, nič čakajúce na JS.
- [ ] V `<head>` žiadny WebGL kontext ani dlhý skript; písma prvej obrazovky v preloade.
- [ ] Fotka úvodu: preload s rovnakým `srcset`/`sizes` ako `<picture>`, najmenší postačujúci stupeň, AVIF + WebP.
- [ ] Šírky 375, 390, 430 px aj bez app.js: `scrollWidth <= innerWidth`; CLS z testu pod 0,01.
- [ ] V slučke skrolu žiadne čítanie rozmerov po zápise, žiadna premenná na `<html>`.
- [ ] Nekonečné animácie sa mimo okna pauzujú; `backdrop-filter` na telefóne vypnutý.
- [ ] `skrol-vlakno.mjs` pred a po: štýl ani úlohy na snímku nestúpli.
- [ ] Naživo: Lighthouse telefón aspoň 5 behov (medián 95+), počítač 2 behy (100); čísla do kontrol.
- [ ] `prefers-reduced-motion` a `saveData` dajú pokojnú verziu.
