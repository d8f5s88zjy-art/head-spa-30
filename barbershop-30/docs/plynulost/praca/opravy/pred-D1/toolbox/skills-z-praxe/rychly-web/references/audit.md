# Audit výkonu s overením

Zdroj: workflow `audit-fps` (skript workflowu z relácie, mimo repozitára), úpravy podľa overeného auditu
(perf-patch, október 2026), `barbershop-30/docs/CHECKS.md` časť 13, `barbershop-30/assets/style.css`
(P12, `.beam`), kontrolné meranie rozmerov karty pri písaní skillu.

## Priebeh

1. **Kontext pre audítorov**: čo je projekt, cieľ (celá stránka 60 až 120 snímok za sekundu na telefóne aj
   počítači pri zachovaní ostrosti a vzhľadu), zákaz upravovať súbory, ako merať (Playwright, statický server,
   `?film=on|off`, `?uvod=off`), čo merať nejde (kontajner bez grafickej karty: čas GPU odhadnúť z kódu, merať
   hlavné vlákno cez CDP `Performance.getMetrics` s `Emulation.setCPUThrottlingRate` 4) a čo už je známe
   („neopakuj“). Požiadavka: konkrétne nálezy `súbor:riadok`, cena v každej snímke, odhad úspory, presný návrh
   kódu, riziko pre vzhľad, zoradené podľa prínosu, žiadne všeobecné rady.
2. **Tri oblasti naraz**: JavaScript filmu v každej snímke; záťaž grafiky na snímku (prechody, ciele, vzorky,
   mipmapy, dpr); stránka nad filmom (app.js, animácie a prechody v CSS, premenné na `<html>`, `backdrop-filter`,
   `mask`, vrstvy).
3. **Skeptik pre každú oblasť**: pre každý nález overí v kóde, či (1) naozaj stojí čas v každej snímke,
   (2) navrhnutá úprava ho ušetrí, (3) nič nerozbije (vzhľad, strihy, prológ, videá, testy). Čo neobstojí,
   zamietne s dôvodom.
4. **Zapracovať len overené nálezy s nízkym rizikom**, jedným skriptom úprav, ktorý pri každej náhrade overí,
   že text v súbore je presne raz (`assert s.count(a) == 1`), a zároveň upraví test, ktorý sa na starý stav spoliehal.
5. **Merať pred a po** tou istou metódou, na tom istom stroji, striedavo; spustiť testy (app-smoke, koliesko,
   zhoda úvodu, úvod); zapísať do CHECKS aj nezapracované nápady.

Jadro workflowu (výňatok zo skriptu `audit-fps`):

```js
const results = await pipeline(
  AREAS,
  (a) => agent(`${CTX}\n\n${a.prompt}`, { label: `audit ${a.key}`, phase: 'Audit', schema: FIND }).then((r) => (r ? { area: a.key, ...r } : null)),
  (r, a) => r && agent(`${CTX}\n\nSi skeptický recenzent výkonu. Pre každý nález z oblasti ${a.key} over v kóde, či (1) naozaj stojí čas v každej snímke, (2) navrhnutá úprava ho ušetrí, (3) nič nerozbije (vzhľad, strihy, prológ, videá, testy v source/tools). Nálezy, ktoré neobstoja, zamietni s dôvodom. Vráť len tie, ktoré obstoja, s prípadne spresnenou úpravou.\n\nNálezy (JSON):\n${JSON.stringify(r.findings)}`,
    { label: `overenie ${a.key}`, phase: 'Overenie', schema: FIND }).then((v) => (v ? { area: a.key, audit: r, verified: v } : null)),
)
```

Schéma nálezu: `where`, `cost`, `fix`, `gain`, `risk` (povinné), `measured`. Štruktúrovaný výstup núti audítora
pomenovať miesto v kóde a cenu; nálezy bez merania sa ľahšie odhalia.

Časť „už vieme“ vymedzí, čo audítori neriešia. V `audit-fps` tam bolo správanie filmu, ktoré sa práve súbežne
menilo (30 snímok za sekundu v pokoji, strop 30 snímok, „toto upravujem sám“; výsledok je CHECKS 12: plná
frekvencia displeja). Keď sa kód mení počas auditu, napíš to do kontextu, nech sa nálezy netýkajú starého stavu.

## Čo sa zapracovalo (CHECKS 13)

- `app.js`: `--p` už nie na `<html>`, `--hint` len na kotvu úvodu; zrušené `--pointer-x/y`; `scrollY` raz na
  začiatku snímky; pauza aj pre svetlo po okraji karty a lesk tlačidla.
- `film.js`: výška okna z `measure()`; správa okolia najviac raz za 100 ms alebo pri zmene záberu; `resize` od
  lišty prehliadača až po 150 ms; programy zjemnenia a postprocesu preložené a raz použité vopred (do cieľa 1×1 px),
  aby prvý strih nezasekol.
- Hĺbkové mapy uložené v šírke najviac 768 px (970 → 222 kB); film ich už nezmenšuje na hlavnom vlákne (audit:
  zastavenie 36 až 320 ms pri každom novom zábere).

## Tvrdenie auditu verzus meranie

| | audit | meranie po úprave |
| --- | --- | --- |
| prepočet štýlu na snímku | 48,7 → 7,4 ms (iná metóda) | 5,1 → 4,8 ms |
| hlavné vlákno na snímku | 61 → 20 ms (iná metóda) | 10,9 → 9,6 ms |

Meranie: telefón 390×844, CPU 4×, film vypnutý (CHECKS 13; čísla auditu z výstupu workflowu). Úprava pomohla
(úspora 0,3 ms štýlu a 1,3 ms hlavného vlákna na snímku), no oveľa menej, než sľuboval audit (asi 41 ms).
Rôzne metódy (iná rýchlosť skrolu, iné počítanie snímok, zápis po snímke verzus trace) dávajú rôzne absolútne čísla;
porovnávaj len pred a po tou istou metódou a do kontrol zapisuj to, čo si nameral.

## Zamietnuté: svetlo po okraji karty `width: 200%`

Svetlo po okraji karty (`.beam`) je štvorec s kužeľovým prechodom, ktorý sa točí okolo stredu karty
(`animation: obeh 7s linear infinite`) a maska nechá z neho vidieť len 1 px rámik:

```css
.beam > .beam-line::before {
  content: ""; position: absolute; left: 50%; top: 50%; width: 200vmax; height: 200vmax; margin: -100vmax 0 0 -100vmax;
```

Audit navrhol menšiu vrstvu `width: 200%; height: auto; aspect-ratio: 1; margin: -100% 0 0 -100%`. Aby otáčajúci sa
štvorec pokryl rám pri každom uhle, polovica jeho strany musí byť aspoň polovica uhlopriečky karty. Pri `200%` je
polovica strany rovná šírke vrstvy `.beam-line` (karta bez 1 px rámika, o 2 px užšia). Rozmery karty rezervácie
(zmerané pri písaní skillu aj pri overení, `?film=off&uvod=off`):

| šírka okna | karta | polovica uhlopriečky | polovica strany pri 200 % |
| --- | --- | --- | --- |
| 320 px | 291 × 592 px | 330 px | 291 px (nestačí) |
| 390 px | 358 × 568 px | 336 px | 358 px |
| 1440 px | 716 × 583 px | 462 px | 716 px |

Na úzkom telefóne je karta vyššia ako široká a rohy by pri niektorých uhloch ostali bez svetla, preto overovateľ
návrh zamietol. Skúšal sa aj variant so stranou `calc(100cqw + 100cqh)` (`container-type: size` na `.beam-line`),
ktorá je vždy aspoň uhlopriečka; nenasadený.

## Overené, ešte nenasadené nápady

Väčší zásah alebo zmena vzhľadu, na ďalšie kolo (CHECKS 13 a podklad z auditu):

- **Strih: kresliť len potrebný cieľ** (nie oba zábery do cieľov, keď jeden stačí).
- **Mipmapy cieľov len pri rozmazaní** (strih s rozmazaním ich potrebuje, bežný záber nie).
- **Šero pri spodku do shadera filmu**: dnes je to `body::after` cez celé okno (`position: fixed`, prechod
  `linear-gradient`) nad plátnom.
- **Prispôsobivé pásy nahrávania fotiek do grafiky** s limitom bajtov na snímku, vrátane sekvencií snímok z videa.
- **Menej vzoriek rozmazania pri krátkej stope strihu** (dnes 12 na telefóne, 16 na počítači počas strihu).
- **Skryté zálohy bez sťahovania pri bežiacom filme** (`display: none` namiesto `opacity: 0; visibility: hidden`).
- **Premenné `--sp`, `--o`, `--so` na podprvky**, ktoré ich čítajú, nie na celú kotvu (menej prvkov v prepočte).
- **Tabuľa dnešných hodín cez WAAPI** namiesto reštartu CSS animácie cez `void b.offsetWidth` (vynútené rozloženie).
- **Okraje bežiaceho pásu služieb bez masky** (dnes `mask: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)`).
- **Matné sklo lišty a dosiek na počítači** (`backdrop-filter`): zmena vzhľadu, rozhoduje majiteľ.

Pred nasadením každého: zmerať pred a po (`scripts/skrol-vlakno.mjs`, na filme časy snímok na zariadení s grafikou),
snímky obrazovky na telefóne aj počítači, testy, zápis do CHECKS.
