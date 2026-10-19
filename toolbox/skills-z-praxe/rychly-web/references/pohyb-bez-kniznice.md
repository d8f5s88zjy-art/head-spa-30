# Pohyb bez knižnice: Motion (Framer Motion) a komponenty z 21st.dev na statickom webe

Návod pre naše statické weby (HTML, CSS, vanilla JS, GitHub Pages, žiadne CDN). Vznikol 2026-10-19 z rozboru
videa V9 (thechriscordero, „Claude Code + Framer Motion + UI/UX Pro Max + jeden riadok z 21st.dev“), záznam
v `../../referencie-z-videi/references/naucene-z-videi.md`. Video stavia React projekt; my z neho berieme
princípy pohybu a nápady komponentov, nie React, nie knižnicu z CDN a nie 700-riadkové prompty.

Hotový vzor (overený testom v Chromiu, 28 kontrol): `../assets/pohyb/` (`pohyb.js`, `pohyb.css`,
`ukazka.html`, `test-pohyb.cjs`).

## Kedy čo

| Čo chceš | Motion v Reacte (video) | U nás bez knižnice | Cena |
| --- | --- | --- | --- |
| prvok sa pri skrole plynulo objaví | `motion.div` s `whileInView` | `data-pohyb` + `pohyb.js` (IntersectionObserver + `el.animate`) + `pohyb.css` | JS 1,7 kB bez komentárov (0,9 kB gzip), CSS 1,0 kB (0,5 kB gzip) |
| pružný dobeh | `transition: { type: "spring" }` | `linear()` easing (Baseline od 12/2023, `toolbox/skills-animacie/genjutsu/skills/_jutsu/VERSIONS.md`) | 0 |
| rozostup v zozname | `delayChildren: stagger(…)` | `delay = poradie × 50 ms`, najviac 5 krokov | 0 |
| pohyb viazaný na skrol (parallax, priebeh) | `useScroll` + `useTransform` | CSS `animation-timeline: view()` ako vylepšenie (Chrome a Edge 115+, Safari 26+, Firefox nie, overené v `toolbox/skills-animacie/genjutsu/skills/_jutsu/VERSIONS.md` 2026-09-08), inak naša slučka rAF (`../SKILL.md`, časť 5) | 0 až 1 kB |
| odchod prvku (zatvorenie) | `AnimatePresence` + `exit` | `@starting-style` a `transition-behavior: allow-discrete` (prechod `display` len Chrome 117+ a Safari 18+), alebo `el.animate(…).finished` a potom `hidden` | 0 |
| zdieľaný prechod medzi stavmi | `layout`, `layoutId` | View Transitions v rámci stránky (Baseline od 2025-10-14) | 0 |
| hover a stlačenie | `whileHover`, `whileTap` | CSS `:hover` v `@media (hover: hover)`, `:active`, `:focus-visible` | 0 |
| zložitá časová os, sekvencie, pružiny na nezávislých transformáciách | `animate` sekvencie | GSAP (`toolbox/skills-animacie/gsap`) alebo Motion vanilla (nižšie) | 22 kB a viac |

Pravidlo: najprv CSS, potom `pohyb.js`, knižnica až keď vzor nestačí a majiteľ súhlasí s váhou.

## Pravidlá (platia pre každý pohyb)

1. Animuj len `opacity` a `transform`. Rozloženie sa nemení (CLS 0, test to kontroluje).
2. Prvá obrazovka sa neanimuje: `data-pohyb` nikdy na nadpis úvodu ani prvý obraz, nesmú čakať na skript
   (LCP, FCP; `../SKILL.md`, časti 2 a 3). Test to kontroluje na telefóne aj počítači. Prvok, ktorý sa objaví
   skokom (príchod cez `#kotvu`, rýchly švih, hľadanie na stránke) a je už v hornej polovici okna, sa ukáže bez animácie.
3. `prefers-reduced-motion: reduce` = nič sa nehýbe a všetko je hneď viditeľné (aj svetlo stojí).
4. Obsah je viditeľný aj bez JS a aj keď skript nepríde: skrýva sa len v `@media (scripting: enabled) and
   (prefers-reduced-motion: no-preference)` (`scripting` je Baseline od decembra 2023, MDN) a záloha v CSS
   (animácia s oneskorením 3 s) prvky ukáže, kým `pohyb.js` nenastaví `data-pohyb-bezi`. Žiadny inline skript
   v `<head>`: aj 106 B navyše v HTML raz prekročilo prvé okno TCP a LCP stúpol o 0,5 s (`../SKILL.md`, Pasce).
   Ak skript príde po zálohe, ukáže všetko bez animácie a nič neskryje znova (test „pohyb.js neskoro“).
5. Nekonečné animácie mimo obrazovky pauzuj (`is-off`, `animation-play-state: paused`), ako pás a lesk na Barbershope.
6. Najprv čítaj, potom zapisuj: `getBoundingClientRect` všetkých prvkov naraz, potom triedy (jeden prepočet).
7. Dĺžky: nástup 450 až 650 ms, mikro odozva 150 až 300 ms (UI/UX Pro Max `duration-timing`, `toolbox/skills-animacie/ui-ux-pro-max-u-nas.md`), rozostup 50 ms,
   odchod kratší ako príchod.
8. Žiadne knižnice z CDN a žiadne `@latest`. Ak knižnicu raz naozaj treba, pripnutá verzia v repozitári aj
   s textom licencie a načítaná až po prvom obraze (`../SKILL.md`, časť 3).

## Podľa značky

| Web | Čo áno | Čo nie |
| --- | --- | --- |
| HEAD SPA 30 | len nástup krytím (`data-pohyb` bez hodnoty), pokojne 450 až 600 ms | vysúvanie ani skladanie obsahu pri skrole, svetlo, žiary, prechody farieb, efekty pod kurzorom (`CLAUDE.md`, časť Technika) |
| Barbershop 30 | nástup s posunom (`data-pohyb="vysun"`), svetlo v úvode (`data-svetlo`), lesk na tlačidle | svetlo cez `background-position` alebo `filter: blur` (nižšie), `backdrop-filter` na telefóne |
| GYM KLUB | svižnejšie (dĺžky bližšie k 450 ms), vysúvanie | nekonečné animácie bez pauzy mimo obrazovky |

## Svetlo v pozadí („aurora“ z videa): merané

Vo videu sa z 21st.dev kopíruje komponent Aurora Background (Aceternity UI; demo text „Background lights are
cool you know. And this, is chemical burn.“ sedí so snímkou 20,5 s). Podľa stránky Aceternity
(ui.aceternity.com/components/aurora-background, pozreté 2026-10-19) sa svetlo hýbe kľúčovými snímkami
`background-position` 50 % → 350 % po dobu 60 s donekonečna. Náš `pohyb.css` robí podobný dojem inak: posúva
a mierne otáča vrstvu s mäkkými radiálnymi prechodmi cez `transform`, bez `filter: blur`, a mimo obrazovky stojí.

Meranie 2026-10-19 (Chromium z Playwrightu, bez grafickej karty, telefón 390×844 @2, CPU 4× pomalší, 3 s,
tri behy; súbory v scratchpade `ref-nauka/v9-claude-web/meranie-svetla/`):

| Variant | Hlavné vlákno za 3 s | Prepočty štýlu | Udalosti Paint |
| --- | --- | --- | --- |
| `background-position` + `filter: blur(10px)` (napodobenina; blur je náš predpoklad) | 529 až 1 049 ms | 153 až 180 | 308 až 360 |
| `background-position` bez blur | 428 až 644 ms | 168 až 180 | 336 až 360 |
| `transform` (náš `pohyb.css`) | 9 až 28 ms | 0 | 0 |

Absolútne čísla kolíšu so zaťažením stroja, pomer platí: `background-position` prekresľuje plochu v každej
snímke na hlavnom vlákne, `transform` ide na kompozitor. Pri svetle vždy `transform`.

## Keď by sme raz chceli Motion vanilla

Overené 2026-10-19 (npm registry a motion.dev):

- Framer Motion je od 2024-11-12 samostatný projekt Motion (motion.dev, blog „Framer Motion is now independent“).
  Balíky `motion` aj `framer-motion` majú verziu 14.3.0 (2026-10-15), licencia MIT; `motion` je „An animation
  library for JavaScript and React“, `react` a `react-dom` sú voliteľné peer závislosti, teda ide aj bez Reactu.
- Motion One sa zlúčil do Motion vo verzii 11.11.12 (motion.dev/docs/upgrade-guide); verzie 13 a 14 nemenia
  JavaScript API (zmeny len pre React a interné balíky).
- Veľkosti podľa dokumentácie: `animate` „mini“ 3,2 kB (`import { animate } from "motion/mini"`, Web Animations
  API), „hybrid“ 22 kB (`from "motion"`: nezávislé transformácie, sekvencie, CSS premenné, SVG cesty), `inView`
  0,5 kB (IntersectionObserver), `scroll` 3,8 kB (ScrollTimeline, kde sa dá).
- Dokumentácia ukazuje `https://cdn.jsdelivr.net/npm/motion@latest/+esm` a sama radí nahradiť `latest`
  konkrétnou verziou. U nás ani tak nie: súbor pripnutej verzie patrí do repozitára aj s licenciou MIT
  a `defer` až po prvom obraze.
- Motion+ (motion.dev/plus) je platený doplnok (prémiové komponenty, príklady, „AI Kit“); štruktúrované dáta
  stránky uvádzajú 399 USD jednorazovo, viditeľnú cenu sme nečítali. Nepotrebujeme ho.
- `npm install motion` z videa (snímka 28,5 s, v domovskom priečinku `~`, mimo projektu) statickému webu nič
  nedá: bez bundlera a bez Reactu sa balík z `node_modules` na GitHub Pages nedostane.

Kedy by Motion vanilla dávalo zmysel: sekvencia viacerých prvkov s pružinami a prerušením (napr. interaktívna
mapa služieb), kde by vlastný kód presiahol ~3 kB. Aj vtedy najprv porovnať s GSAP, ktorý už máme v
`toolbox/skills-animacie/gsap`.

## Komponent z 21st.dev, Aceternity alebo Magic UI: ako ho prevziať

1. **Licencia konkrétneho komponentu.** 21st.dev je katalóg 12 000+ komponentov pre React a Tailwind
   (21st.dev/llms.txt, 2026-10-19), licencia je pri každom zvlášť (napr. „mit“, inde „unknown“). Podmienky
   21st.dev (21st.dev/terms, „Last updated: July 20, 2026“): obsah patrí autorom a 21st Labs, dema a náhľady patria
   21st Labs aj pri cudzom kóde, zákaz zberu, trénovania AI a ďalšieho šírenia bez povolenia, pri open-source
   kóde zachovať licenciu a autora. Pri „unknown“ alebo „All Rights Reserved“ (pätička Aceternity UI) kód
   nepreberáme, berieme len nápad a robíme vlastnú implementáciu.
2. **Prečítaj, nevkladaj.** „Copy prompt“ vo videu vložil do Claude Code 710 riadkov (snímka 21,6 s:
   `[Pasted text #1 +710 lines]`), nie „jeden riadok“. Príkaz z 21st.dev má tvar
   `npx shadcn@latest add "https://21st.dev/r/<autor>/<komponent>?api_key=$API_KEY_21ST"` a predpokladá React,
   Tailwind a štruktúru shadcn. Do nášho repozitára nič z toho nepúšťame: komponent si prečítame na stránke,
   zapíšeme si, **čo** sa hýbe (vlastnosť, dĺžka, spúšťač, krivka), a urobíme to po svojom.
3. **Prepíš do nášho štýlu:** premenné značky, naše písma (žiadne Google Fonts cez `@import`), pravidlá vyššie,
   žiadna závislosť.
4. **Zmeraj:** `node ../scripts/skrol-vlakno.mjs --url=<adresa>` pred a po (ms na snímku), Lighthouse podľa
   `../SKILL.md`, a kontroly z `test-pohyb.cjs` (zníženie pohybu, bez JS, CLS, pretečenie).
5. **Zapíš pôvod nápadu** do kontrol projektu (`docs/CHECKS.md`): odkaz na komponent, licencia, čo sme zmenili.

Bezplatný účet 21st.dev dáva podľa cenníka (21st.dev/pricing, 2026-10-19) „2 free copies / day“; Builder
6 USD mesačne pri ročnej platbe, generovanie cez AI za kredity navyše (od 15 USD mesačne). 21st MCP (predtým
Magic MCP) potrebuje API kľúč a hostované generovanie predplatné AI (README `21st-dev/magic-mcp`, commit
6b5299e, 2026-09-09, balík `@21st-dev/magic` 0.2.3, ISC). Nepripájame: účet, platby, generuje React.

## Overenie vzoru (`test-pohyb.cjs`)

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node toolbox/skills-z-praxe/rychly-web/assets/pohyb/test-pohyb.cjs \
  toolbox/skills-z-praxe/rychly-web/assets/pohyb/ukazka.html     # kód 0 = všetko prešlo
```

Kontroluje (telefón 390×844 aj počítač 1440×900): v prvej obrazovke žiadny `data-pohyb`, prvok pod ohybom skrytý
a záloha v CSS po štarte skriptu zrušená, prvok vchádzajúci zdola sa objavuje postupne (krytie 0,21 až 0,32 po
60 ms) a potom je 1, po prejdení celej stránky je všetko viditeľné, svetlo beží v úvode a stojí mimo obrazovky,
CLS 0, žiadne pretečenie do šírky; príchod cez `#kontakt` bez animácie; pri znížení pohybu žiadna animácia;
bez JS všetko viditeľné; bez `pohyb.js` po 3 s všetko viditeľné; `pohyb.js` neskoro (3,6 s) nič neskryje znova.
Behy 2026-10-19: 28 z 28, trikrát za sebou.

Pri nasadení na web: `pohyb.js` (s `defer`) a `pohyb.css` vlož do zdrojov projektu (HEAD SPA 30 ich minifikuje
`node tools/build.mjs`), `data-pohyb` daj len prvkom pod prvou obrazovkou a test spusti proti stránke projektu:
`node test-pohyb.cjs index.html --kotva=#kontakt --dole="#kontakt h2"` (kotva = sekcia na príchod cez odkaz,
dole = prvok s `data-pohyb` hlboko pod ohybom).
