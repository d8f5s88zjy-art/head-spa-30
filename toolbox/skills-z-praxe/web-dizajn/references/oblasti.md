# 24 oblastí web dizajnu

Mená a krátke popisy oblastí sú zo zoznamu skills na snímke vo videu sebintel (repozitár
„claude-web-design-skills“, štítok typu v zátvorke). Obsah repozitára sme nečítali; pravidlá nižšie sú naše:
zo štandardov (WCAG 2.2, úroveň AA, ak nie je napísané inak), z tradičnej typografie a z kódu našich webov.
Hodnoty „u nás“ sú zo štýlov a meraní v prehliadači (Chromium cez Playwright, 390 a 1440 px) 2026-10-11.
Keď sa kód zmení, platí kód.

Pri každej oblasti: **stráži** (o čo ide), **pravidlá** (s číslami), **u nás** (cesty a hodnoty), **rieši**
(skill alebo nástroj). Merateľné veci hlási `scripts/dizajn-audit.mjs` v správe po oblastiach; čo presne meria,
je v hlavičke skriptu. Cesty `../../skills/…` a `../../skills-animacie/…` sú vzhľadom na priečinok skillu.

Prehľad podľa kroku postupu (SKILL.md):

| Krok | Oblasti |
| --- | --- |
| 3 dizajnový systém | 1 typografia, 2 rozostupy, 4 mriežka, 6 farby, 14 tokeny, 15 CSS |
| 4 rozloženie a komponenty | 3 stavba stránky, 7 komponenty, 8 sekcie, 11 interakcie, 12 formuláre, 16 Tailwind, 17 hierarchia, 18 drôtový model, 19 úvod, 20 karty, 21 navigácia |
| 5 pohyb | 10 |
| 6 kontrola | 5 zariadenia, 9 prístupnosť, 22 testy v prehliadači, 24 posudok |
| viac krokov | 13 Figma (2 až 4), 23 zdroje (každý) |

---

## 1. typography-system: hierarchia písma

Vo videu: „Better type hierarchy“ (UI).

- **Stráži:** poradie dôležitosti textu cez veľkosť, rez, váhu a riadkovanie; čitateľnosť odseku.
- **Pravidlá:**
  - Najviac dve rodiny, zreteľne odlišné (nadpisy a text). Písma lokálne, orezané na použité znaky,
    `font-display: swap`, preload len rezov prvej obrazovky.
  - Text 16 až 19 px; na telefóne telo nie menej ako 16 px. Nadpisy displeja `clamp(min, vw, max)`.
  - Pomer stupňov podľa modulovej škály: 1,2 až 1,25 pre husté rozhranie, 1,333 až 1,5 pre prezentačný web;
    nadpis úvodu môže byť mimo škály, ak je to jediná dominanta.
  - Riadkovanie: odsek 1,5 až 1,8 (WCAG 1.4.8 AAA aspoň 1,5), nadpisy 0,95 až 1,15; patkové písmo v texte
    o niečo viac.
  - Dĺžka riadku 45 až 75 znakov s medzerami, ideál okolo 66 (Bringhurst, The Elements of Typographic Style);
    WCAG 1.4.8 AAA najviac 80. **Meraj v prehliadači:** `ch` je šírka nuly, nie priemerný znak.
  - Verzálky len na krátkych štítkoch, s rozostupom písmen 0,1 až 0,3 em. Nadpisy `text-wrap: balance`,
    odseky `text-wrap: pretty`.
  - Slovenská typografia: pevné medzery za jednopísmenovými slovami, bez em dash a en dash.
- **U nás:**
  - HEAD SPA 30: Lora 400 (nadpisy; zlatá kurzíva `em` ako jediný akcent), Manrope 400 a 700 (`assets/fonts/`,
    štyri súbory). `.band h1` `clamp(52px,7.4vw,112px)`, na telefóne `clamp(44px,12.5vw,56px)`, zmerané
    106,6 px (1440) a 54,6 px (390). `.h2` `clamp(42px,5.6vw,88px)` s riadkovaním 1, zmerané 80,6 a 42 px.
    Telo 16 px / 1,6, `.lede` `clamp(17px,1.35vw,19px)` / 1,75 a `max-width: 52ch`, štítok `.kicker` 12 px
    verzálky. Pomer nadpisu úvodu k telu 6,7 : 1 na počítači, 3,4 : 1 na telefóne. Riadky (1440): popis rituálu
    71 znakov (`58ch` pri 16,5 px), odpoveď v otázkach 71 až 73, úvod časti Rituál 58; na telefóne 36 až 49.
    Písma sú orezané na použité znaky: znak U+2011 (pevný spojovník v „24‑karátovým“ v popise rituálu) v nich
    nie je a kreslí ho systémové písmo (`dizajn-audit.mjs`, 2026-10-11). Nový znak v texte = skontrolovať písmo.
  - BARBERSHOP 30: Fraunces 800 (opsz 144) a Manrope 400/600/700; škála v `docs/ART_DIRECTION.md` časť 3
    (H1 `clamp(2.75rem,7.2vw,6.75rem)` / 0,94, H2 `clamp(2rem,4.4vw,3.5rem)` / 1, H3 `clamp(1.35rem,2vw,1.75rem)`,
    `.lead` `clamp(1.125rem,1.5vw,1.375rem)` / 1,45, `.body` 17 px / 1,6, štítok 13 px verzálky .14 em).
    Titulné karty prehliadky `--title-size: clamp(2.75rem,6.6vw,6rem)` (95 px pri 1440), úvod `--hero-size`
    (109 px). `.measure` 62ch; `.price-desc` 62ch pri 15 px dal na počítači 83 znakov na riadok, čo je nad 75.
- **Rieši:** `../../skills/frontend-design/` (typografia, generické znaky), `../obsah-a-texty/`
  (`scripts/typografia-kontrola.mjs`: em dash, pevné medzery), `../rychly-web/` časť 3 (písma v hlavičke),
  `design-dna` (rozbor typografie referencie), `dizajn-audit.mjs`.

## 2. spacing-rules: rozostupy

Vo videu: „Cleaner spacing decisions“ (UI).

- **Stráži:** zoskupenie podľa blízkosti, rytmus, dýchanie stránky.
- **Pravidlá:**
  - Škála po 4 alebo 8 px (4, 8, 12, 16, 24, 32, 48, 64, 96, 128…), nie náhodné 13 či 27 px.
  - Medzera vnútri skupiny menšia ako medzi skupinami, aspoň 1,5 až 2-násobne. Nadpis bližšie k svojmu
    textu než k predchádzajúcej časti.
  - Jedna premenná pre zvislý odstup častí; na telefóne asi polovica až dve tretiny počítačovej.
  - Výška tlačidla z `min-height`, nie z riadkovania a náhodného odsadenia.
  - Prémiový dojem robí priestor: radšej o stupeň väčšia medzera ako ďalšia ozdoba.
- **U nás:**
  - BARBERSHOP 30: `--s1` až `--s10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 144 px; `.section` 96 px, telefón
    64 px; hlavička časti 48 px nad obsahom; `.stack` 16 px; `.cluster` 12 / 16 px.
  - HEAD SPA 30: pevnú škálu nemá, hodnoty idú cez `clamp`. Medzi časťami `--lux-space` (posledná definícia
    `clamp(76px,9vw,128px)`), pásy Luxusnej kompozície `padding: clamp(72px,9vw,140px) 0`, na telefóne
    `56px 20px`; rituál v cenníku `clamp(34px,4vw,48px)` hore. Vo vrstvách opráv sú aj hodnoty mimo škály
    (17, 26, 34 px).
- **Rieši:** `design-dna` (spacing v schéme), `../../skills/frontend-design/`, `dizajn-audit.mjs`.

## 3. layout-composer: stavba stránky

Vo videu: „Smarter page structure“ (UI).

- **Stráži:** aby každá časť mala úlohu a stránka mala rytmus.
- **Pravidlá:**
  - Jedna úloha stránky; časť, ktorá jej neslúži, ide preč.
  - Poradie podľa rozhodovania návštevníka: čo to je, prečo práve tu, ponuka a cena, dôkaz, otázky, kde
    a ako rezervovať.
  - Striedať hustotu: veľký obraz, pokojný pás s textom, zoznam; nie desať rovnakých blokov pod sebou.
  - Jedna hlavná os zarovnania (text vľavo); na stred len krátke bloky.
  - Prvá obrazovka telefónu: nadpis, jedna veta a hlavná výzva bez skrolu.
- **U nás:**
  - HEAD SPA 30, Luxusná kompozícia (`assets/style.css`): záber filmu cez celú obrazovku
    (`html.world .site>section{padding:78vh 0 0}`, telefón 40vh), potom plný pokojný pás (`.wrap` s pozadím
    `#0d0a07`). Poradie častí: `#ritual`, `#cennik`, `#poukaz`, `#tim`, `#galeria`, `#faq`, `#kontakt`.
  - BARBERSHOP 30: zábery v poradí chôdze prevádzkou (`docs/MASTER_BRIEF.md` časť 2, `docs/TOUR_DIRECTION.md`),
    titulná karta sa strieda vľavo, vpravo a v strede (`data-card`), pásy s obsahom len pri tíme, službách,
    galérii a kontakte.
- **Rieši:** `../../skills/frontend-design/` (koncept rozloženia, ASCII), `../film-z-fotiek/` (kompozícia so
  zábermi), `references/zadanie.md` (sekcie v poradí).

## 4. grid-systems: mriežka

Vo videu: „Consistent grid layouts“ (UI).

- **Stráži:** aby prvky v celom webe sadli na tie isté osi.
- **Pravidlá:**
  - Kontajner 1100 až 1400 px, bočné okraje 16 px telefón, 24 px tablet, 32 až 40 px počítač.
  - 12 stĺpcov na počítači, 8 na tablete, 4 na telefóne; medzera 16 až 24 px; prvky začínajú a končia na
    hranách stĺpcov.
  - Text nikdy cez celú šírku kontajnera: 5 až 7 stĺpcov z 12 alebo `max-width` (oblasť 1).
  - CSS Grid so stĺpcami `minmax(0,1fr)`, inak dlhé slovo stĺpec roztiahne a stránka pretečie.
  - Jedna mriežka pre všetky časti; výnimky vedome (obraz cez celú šírku).
- **U nás:**
  - BARBERSHOP 30: `.grid` `repeat(12, minmax(0,1fr))`, medzera 24 px, do 800 px 4 stĺpce a 16 px;
    `.container` `min(100% - 2 × --gutter, 1360px)`, `--gutter` 40 / 24 / 16 px; textové bloky v scénach
    5 z 12 stĺpcov (`ART_DIRECTION.md` časť 4).
  - HEAD SPA 30: bez 12-stĺpcovej mriežky; `.wrap` `min(1180px, 100% - 48px)`, do 640 px `100% - 32px`;
    cenník jeden stĺpec `max-width: 920px`; kontakt, galéria a pätička majú vlastné mriežky.
- **Rieši:** `design-dna` (layout), `../../skills/frontend-design/`, `dizajn-audit.mjs` (pretečenie).

## 5. responsive-reviewer: kontrola na zariadeniach

Vo videu: „Multi-device checking“ (UI).

- **Stráži:** že web funguje od úzkeho telefónu po široký monitor.
- **Pravidlá:**
  - Šírky: 320 (WCAG 1.4.10, obsah bez vodorovného skrolu), 375, 390, 430 (telefóny), 768 (tablet),
    1024 a 1280 až 1440 (počítač); výšky telefónu 667 až 932.
  - `scrollWidth <= innerWidth` v každej šírke, aj bez JavaScriptu.
  - Zlomy podľa obsahu, nie podľa značiek zariadení; čo najmenej zlomov.
  - Plné obrazovky na telefóne cez `svh`, `lvh` alebo `dvh` (lišta prehliadača mení `vh`), spodná lišta
    s `env(safe-area-inset-bottom)`.
  - Stavy pod ukazovateľom len v `@media (hover:hover) and (pointer:fine)`; na dotyku musí všetko ísť ťuknutím.
  - Obrázky so `srcset` a `sizes`, na telefón výrez na výšku.
- **U nás:** HEAD SPA 30 má najviac pravidiel pri 640 px (asi 57), ďalej 900/901, 720 a 1024/1025;
  BARBERSHOP 30 640, 800, 900, 1024 a 1100. Zmerané 2026-10-11: oba weby pri 390 aj 1440 bez pretečenia.
  BARBERSHOP 30 má výrezy fotiek na telefón (`*-m-1086`), HEAD SPA 30 `okna-m`. Pasca so zmenšením
  zobrazenia na telefóne (CLS 0,14): `../rychly-web/SKILL.md`, časť 4.
- **Rieši:** `../testy-a-nasadenie/scripts/dymovy-test.mjs` (šírky 375, 390, 430, beh bez skriptu),
  `dizajn-audit.mjs --sirky=`, `../rychly-web/` (CLS).

## 6. color-harmony: paleta

Vo videu: „Better palette choices“ (Design).

- **Stráži:** súdržnú paletu s jasnými úlohami farieb.
- **Pravidlá:**
  - 4 až 6 hodnôt s úlohou: pozadie, plocha, text v troch stupňoch, linka, jeden akcent a jeho stav.
  - Plochy zhruba 60 / 30 / 10 (základ, druhá plocha, akcent); akcent na to, čo treba vidieť alebo stlačiť.
  - Neutrálne tóny zladené s akcentom (teplá čierna k teplému akcentu).
  - Farby z fotiek merať skriptom, nie odhadom (odchýlka ΔE pri odhade býva 10 a viac, `design-dna`).
  - Kontrast hneď pri tokenoch (oblasť 9), aj pre stav pod ukazovateľom a fokus.
  - Farba nikdy nie je jediný nositeľ informácie (WCAG 1.4.1).
- **U nás:**
  - HEAD SPA 30: farby odpísané z prevádzky (komentár v prvom `:root`: orech a parkety, zelené dvere, olivové
    závesy, biele uteráky, svit LED pásu); dnes tóny orecha so zlatou a žiadna zelená plocha (`CLAUDE.md`).
    Zlatá `#c9a66b` na štítky, linky, akcent v nadpise a hlavné tlačidlo.
  - BARBERSHOP 30: jeden svetelný akcent `--lamp #e0601c` (oranžová lámp), `--teal #163b3c` najviac v jednej
    časti, mosadz len vo fotkách (`ART_DIRECTION.md` časť 2).
  - Kontrasty: SKILL.md, časť 3.
- **Rieši:** `../../skills-animacie/design-dna/` (`scripts/measure-colors.mjs`, `scripts/verify.mjs`),
  `../../skills/theme-factory/` (podnik bez identity), `../../skills/frontend-design/` (generické palety),
  `dizajn-audit.mjs` (kontrast).

## 7. ui-component-library: komponenty

Vo videu: „Reusable components“ (Frontend).

- **Stráži:** že rovnaká vec vyzerá a správa sa všade rovnako.
- **Pravidlá:**
  - Jedna definícia, varianty (hlavné, vedľajšie, textové, malé) a stavy (pokoj, pod ukazovateľom, stlačené,
    fokus, vypnuté, načítava).
  - Hodnoty z tokenov, nie literály. Názvy podľa úlohy (`.btn-primary`), nie podľa vzhľadu (`.gold-btn`).
  - Úprava pre jednu časť cez modifikátor, nie cez dlhší selektor s `!important`.
  - Rovnaká akcia, rovnaký komponent a rovnaké slovo v celom webe.
- **U nás:**
  - BARBERSHOP 30 (`ART_DIRECTION.md` časť 5, `style.css` časť 5): `.btn` (`min-height` 52 px, telefón 50 px
    a celá šírka), `.btn-primary` (lamp, stav `--lamp-2`), `.btn-secondary` (obrys `rgba(241,233,221,.42)`),
    `.btn-ghost`, `.link-arrow`, `.chip`, `.card`.
  - HEAD SPA 30: `.btn.primary`, `.btn.ghost`, `.btn.small`, `.card`, `.chip`, `.faq-q`; tlačidlá normálnym
    písmom 15 px tučne (časť Čitateľnosť), rádius 2 px. Tlačidlo rituálu v cenníku je prepísané viackrát
    (`html .site #cennik .card .actions .btn.small` s `!important`).
- **Rieši:** `../../skills/frontend-design/` (špecifickosť selektorov), `../motion-grafika/` (šablóny berú
  farby a písma zo `style.css` webu), `dizajn-audit.mjs`.

## 8. landing-page-planner: časti stránky

Vo videu: „Better page sections“ (UX).

- **Stráži:** že časti idú v poradí, ktoré vedie k jednej akcii.
- **Pravidlá:**
  - Jedna hlavná výzva, zopakovaná pri ponuke a na konci; vedľajšia výzva slabšia.
  - Kostra: úvod so sľubom, čo dostaneš alebo ako to prebieha, ponuka a ceny, dôkaz (ľudia, priestor,
    hodnotenie len s odkazom), otázky, kde a kontakt, záverečná výzva.
  - Každá časť odpovedá na jednu otázku návštevníka; nadpis je odpoveď, nie štítok.
  - Nič dvakrát (README HEAD SPA 30, Bez opakovania); dôkaz len pravdivý, žiadne vymyslené recenzie.
- **U nás:**
  - HEAD SPA 30: „Vypni hlavu.“ → „Nie umytie vlasov. Rituál pre hlavu.“ → „17 rituálov. Jedna adresa.“ →
    „Daruj chvíľu pokoja.“ → „Postaráme sa o tvoju hlavu.“ → „Za týmito dverami.“ → „Všetko, čo chceš vedieť.“
    → „Kde nás nájdeš.“
  - BARBERSHOP 30: „Tvoj strih. Tvoje miesto.“ → „Poď ďalej.“ → „Povedz, ako to chceš.“ → „Vzadu ťa čaká káva.“
    → „Komu zveríš hlavu?“ → „Čo to bude dnes?“ → „Pozri si to zblízka.“ → „Kedy si sadneš?“
- **Rieši:** `references/zadanie.md`, `../obsah-a-texty/` (hook, hlas), `../booqme-rezervacie/` (výzvy),
  `../../skills/frontend-design/`.

## 9. accessibility-auditor: prístupnosť

Vo videu: „WCAG and usability checks“ (Accessibility).

- **Stráži:** že web prečíta a ovládne každý: slabší zrak, klávesnica, čítačka, veľký prst, citlivosť na pohyb.
- **Pravidlá:**
  - Kontrast textu 4,5 : 1; veľký text (od 24 px, alebo od 18,66 px tučne) 3 : 1 (1.4.3). Ovládacie prvky,
    rámiky polí, ikony a obrys fokusu 3 : 1 (1.4.11).
  - Fokus viditeľný (2.4.7) a nezakrytý lepivou lištou (2.4.11, nové v 2.2): `scroll-padding-top` alebo
    `scroll-margin-top` podľa výšky lišty.
  - Dotykové plochy aspoň 24 × 24 CSS px (2.5.8; výnimky: odkaz vo vete, dostatočný rozostup), odporúčané
    44 × 44 (2.5.5, AAA; Apple 44 pt, Material 48 dp; tabuľka v genjutsu `mobile-principles`).
  - Jeden viditeľný h1, nadpisy bez preskakovania úrovní (1.3.1, 2.4.6); `lang` na `<html>` (3.1.1); odkaz na
    preskočenie na obsah (2.4.1); `alt` na každom obrázku, ozdobné `alt=""` (1.1.1).
  - Reflow pri 320 px (1.4.10), text zväčšený na 200 % bez straty (1.4.4).
  - Pohyb: `prefers-reduced-motion` (2.3.3 je AAA, u nás povinné); čo sa hýbe samo dlhšie ako 5 s, sa dá
    zastaviť (2.2.2).
  - Farba nie je jediný nositeľ informácie (1.4.1).
- **U nás:** oba weby `lang="sk"`, odkaz „Preskočiť na obsah“ (`.skip`, `.skip-link`), `:focus-visible`
  2 px obrys akcentom s odsadením 3 px. Zmerané 2026-10-11 (390 a 1440 px): nadpisy bez preskakovania úrovní,
  0 obrázkov bez `alt`, jeden viditeľný h1. Ciele na telefóne nižšie ako 24 px: HEAD SPA 30 jeden (telefón
  v pätičke, 78 × 20), BARBERSHOP 30 sedem (telefón a e-mail v kontakte, odkazy v pätičke, 21 až 23 px vysoké);
  pravdepodobne spĺňajú výnimku pre rozostup, ale telefónne číslo je hlavná akcia a zaslúži si 44 px.
  HEAD SPA 30 dáva v `@media (pointer:coarse)` tlačidlám, filtrom a otázkam `min-height: 44px`; BARBERSHOP 30
  tlačidlá 52 px (telefón 50), `.nav-toggle` 44 × 44. Odsadenie kotiev: BARBERSHOP 30
  `scroll-padding-top: calc(var(--nav-h) + 16px)`, HEAD SPA 30 `section{scroll-margin-top:80px}`, karta
  rituálu 170 px (telefón 200 px). Lighthouse prístupnosť 100 (README HEAD SPA 30, Rýchlosť a prístupnosť;
  `../rychly-web/`, BARBERSHOP 30).
- **Rieši:** genjutsu `design-audit` (statický audit kódu, `../../skills-animacie/genjutsu/skills/_jutsu/design-audit/`),
  `ui-ux-pro-max` (priority), `../testy-a-nasadenie/`, `../rychly-web/` (Lighthouse), `dizajn-audit.mjs`.

## 10. motion-principles: pohyb

Vo videu: „Smooth interface motion“ (UI).

- **Stráži:** aby pohyb vysvetľoval zmenu a nezdržiaval.
- **Pravidlá:**
  - Pohyb len pri príchode, odchode alebo zmene stavu; jeden zladený moment pôsobí lepšie než nástup každej
    časti (`frontend-design`).
  - Trvanie: odozva na dotyk 100 až 150 ms, zmena rozhrania 200 až 300 ms, prechod medzi stránkami 300 až
    500 ms (genjutsu `motion-principles`, Timing Rules); čím častejšie sa opakuje, tým kratšie.
  - Krivky: príchod ease-out, odchod ease-in, presun ease-in-out, pohyb viazaný na skrol lineárne.
  - Len `transform` a `opacity`; `will-change` len počas pohybu; nekonečné animácie mimo okna pauzovať.
  - `prefers-reduced-motion: reduce` dá koncové stavy; obsah nikdy nečaká na animáciu ani na skript.
- **U nás:**
  - HEAD SPA 30, Pohybový systém: `--t-fast` 180 ms, `--t-base` 320 ms, `--t-slow` 700 ms,
    `--e-out cubic-bezier(.16,1,.3,1)`, `--e-io cubic-bezier(.65,0,.35,1)`; pod ukazovateľom len farba a linka,
    stlačenie `opacity: .82`; obsah sa pri skrole nevysúva (`.rv` natvrdo `opacity:1`, `transform:none`); pri
    obmedzenom pohybe `animation:none` a `transition:none` všade. Film dýcha v pokoji ešte 25 s pri 30 snímkach
    za sekundu, potom stojí (`CLAUDE.md`).
  - BARBERSHOP 30: `--t-micro` 200 ms, `--t-text` 560 ms, `--ease-out cubic-bezier(.2,.7,.2,1)`; `.reveal`
    posun 16 px s oneskorením 80, 160, 240 ms; obmedzený pohyb skráti všetko na 1 ms; `?motion=off`.
    Pravidlá v `ART_DIRECTION.md` časť 8 (paralaxa do 6 %, žiadne častice ani rozmazaný text).
- **Rieši:** `../../skills-animacie/` (gsap, motion-design, genjutsu `motion-principles` a `css-native`),
  `../rychly-web/` časť 5, `../video-a-sekvencie/`, `../film-z-fotiek/`.

## 11. interaction-patterns: toky a interakcie

Vo videu: „Better user flows“ (UX).

- **Stráži:** cestu od záujmu k akcii bez zbytočných krokov.
- **Pravidlá:**
  - Hlavná akcia najviac na dve ťuknutia odkiaľkoľvek (lišta, spodné tlačidlo na telefóne).
  - Tlačidlo hovorí, čo sa stane („Rezervovať online“, nie „Odoslať“); akcia má rovnaké meno v celom toku.
  - Odozva do 100 ms (stav stlačenia); dlhšia operácia ukazuje priebeh.
  - Všetko ide ťuknutím aj klávesnicou (Tab, Enter, Esc zavrie menu); hover je len doplnok.
  - Otvorené menu: fokus dnu, Esc a tlačidlo zavrieť, fokus späť na spúšťač, pozadie sa neskroluje.
  - Odkaz von s `target="_blank"` má `rel="noopener"`; cudzí systém (rezervácia) je jasne pomenovaný.
- **U nás:** žiadne formuláre; tlačidlá rezervácie vedú rovno do Booqme (HEAD SPA 30, `CLAUDE.md`) alebo do
  rezervačného systému podniku (BARBERSHOP 30, `CONTENT_SOURCES.md`). HEAD SPA 30: lišta, vysúvacie menu
  `.drawer`, bočná lišta častí `.rail` (na počítači čiarky vpravo, na telefóne jazýček), spodná lišta `.mbar`.
  BARBERSHOP 30: menu cez celú obrazovku do 900 px, spodné tlačidlo „Rezervovať termín“ (skryje sa vo
  finálnej scéne), linka kapitol.
- **Rieši:** `../booqme-rezervacie/`, `../../skills/frontend-design/` (texty v rozhraní), `../testy-a-nasadenie/`
  (menu v `app-smoke.mjs`), `../../skills/webapp-testing/`.

## 12. form-ux-checker: formuláre

Vo videu: „Stronger form design“ (UX).

- **Stráži:** že sa formulár dá vyplniť rýchlo a bez chyby.
- **Pravidlá:**
  - Viditeľný popisok nad poľom, nie zástupný text namiesto neho (3.3.2).
  - Písmo v poli aspoň 16 px (Safari na iPhone inak pri fokuse priblíži stránku).
  - Správny `type`, `inputmode` a `autocomplete` (1.3.5); povinné pole označené slovom.
  - Chyba pri poli, konkrétne čo opraviť (3.3.1, 3.3.3), prepojená cez `aria-describedby`; nie len červený rámik.
  - Pole aj tlačidlo aspoň 44 px vysoké; rámik poľa 3 : 1 voči pozadiu (1.4.11).
  - Čo najmenej polí; ak systém (rezervácia, platba) formulár má, radšej naň odkázať.
- **U nás:** HEAD SPA 30 ani BARBERSHOP 30 formulár nemajú (0 × `<form>`, `<input>`, `<select>` v `index.html`).
  V `assets/style.css` HEAD SPA 30 ostali pravidlá polí zo staršej verzie (Čitateľnosť: popisok 14,5 px tučne,
  pole s rámikom 1 px `rgba(239,231,218,.22)`, `padding: 14px 16px`, písmo 16 px, fokus zlatý rámik a 3 px
  tieň); zástupný text `#7d7366` na `--panel` má len 4,1 : 1. Keby sa formulár vrátil, treba to premerať.
- **Rieši:** `../../skills/webapp-testing/` (vyplnenie v prehliadači), `../../skills/frontend-design/` (texty
  chýb), `../booqme-rezervacie/` (prečo formulár nie).

## 13. figma-mcp: prepojenie s Figmou

Vo videu: „Design file connection“ (MCP).

- **Stráži:** aby návrh vo Figme a kód hovorili tými istými hodnotami.
- **Pravidlá:** z Figmy čítať rámce, premenné (tokeny) a komponenty, nie odhadovať zo snímky; mená tokenov
  v kóde rovnaké ako vo Figme; po prenose porovnať snímku kódu so snímkou rámca.
- **U nás:** weby vo Figme nemajú návrh; zdrojom sú fotky prevádzky, `CLAUDE.md`, `ART_DIRECTION.md` a HTML.
  Konektor Figma bol pripojený 2026-10-11 počas písania tohto skillu, jeho nástroje sme neskúšali. Postup
  s Figmou aj bez nej: `references/figma-mcp.md`.
- **Rieši:** konektor Figma (Claude, nastavenia konektorov), `references/figma-mcp.md`.

## 14. design-token-manager: tokeny

Vo videu: „Scalable design tokens“ (Frontend).

- **Stráži:** jeden zdroj pravdy pre farby, písma, mierky a pohyb.
- **Pravidlá:**
  - Dve vrstvy: základné (`--walnut`, `--lamp`) a významové (`--text-primary`, `--accent`); komponenty
    používajú len významové.
  - Jeden blok `:root` (alebo jeden na vrstvu s komentárom), nie predefinovanie na viacerých miestach.
  - Mierky ako tokeny: rozostupy, veľkosti písma, rádius, trvania a krivky, výška lišty.
  - Tokeny zapísané aj v dokumente (paleta s kontrastmi, škála); pri zmene sa mení oboje.
  - Z Figmy premenné → CSS premenné s rovnakými menami (oblasť 13).
- **U nás:**
  - BARBERSHOP 30: tabuľka tokenov v `ART_DIRECTION.md` časť 2 a `:root` v `style.css` časť 1 majú rovnaké mená;
    prehliadka má vlastný blok (`--title-size`, `--hero-size`, riadok 947).
  - HEAD SPA 30: prvý `:root` hovorí v komentári, odkiaľ sú farby; Luxusná vrstva ich prepisuje (`--canvas`,
    `--accent`, `--radius*` na 2 px), Prechody menia `--lux-space`, Pohybový systém pridáva `--t-*` a `--e-*`
    (spolu päť blokov `:root`). Platná je posledná definícia.
- **Rieši:** `design-dna` (DNA JSON → CSS premenné, `references/generation-guide.md`),
  `../../skills/theme-factory/`, Figma (oblasť 13).

## 15. css-architecture: stavba CSS

Vo videu: „Better CSS structure“ (Frontend).

- **Stráži:** aby sa štýl dal meniť bez prebíjania.
- **Pravidlá:**
  - Poradie: tokeny, reset, typografia, rozloženie, komponenty, časti, stavy a médiá; každá časť s nadpisom
    v komentári (po slovensky).
  - Nízka špecifickosť (trieda, nie `html .site #id .x`); `!important` len pri pomocných triedach
    (`.visually-hidden`, `[hidden]`).
  - Oprava na mieste pravidla, nie nová vrstva na konci súboru. Mŕtve pravidlá mazať.
  - Media query pri komponente; jednotne mobil najprv alebo počítač najprv.
  - Do produkcie minifikované.
- **U nás:**
  - BARBERSHOP 30: `style.css` 1281 riadkov v číslovaných častiach 1 až 8 a PREHLIADKA (P0 a ďalej), 7 ×
    `!important`, web načítava zdrojový súbor (gzip robí GitHub Pages).
  - HEAD SPA 30: `style.css` 2727 riadkov, 39 hlavných sekcií, z toho 13 „Opravy …“ a vrstvy Luxusná vrstva,
    Čitateľnosť, Luxusná kompozícia; 94 × `!important`; web načítava `style.min.css` (`node tools/build.mjs`).
    Vrstvenie na koniec bolo rýchle, ale každá ďalšia zmena musí prebiť predchádzajúce.
- **Rieši:** `../../skills/frontend-design/` (špecifickosť), `../rychly-web/` (build, CSS premenné v slučke
  skrolu).

## 16. tailwind-helper: Tailwind

Vo videu: „Utility-first styling support“ (Frontend).

- **Stráži:** rozumné použitie triedového CSS.
- **Pravidlá:** Tailwind má zmysel v projekte s build krokom a komponentmi; tokeny patria do jeho
  konfigurácie, nie ako ľubovoľné hodnoty (`w-[37px]`) všade; opakované kombinácie tried sú komponent. Pri
  statickom webe bez frameworku je CSS s premennými menšie a jednoduchšie.
- **U nás:** oba weby Tailwind nepoužívajú (čisté CSS; HEAD SPA 30 len minifikácia esbuildom, BARBERSHOP 30
  bez build kroku). Tailwind len v prototype alebo artefakte.
- **Rieši:** `../../skills/web-artifacts-builder/` (React, Tailwind, shadcn/ui).

## 17. visual-hierarchy: vizuálna hierarchia

Vo videu: „Clear content emphasis“ (Design).

- **Stráži:** aby oko vedelo, čo je prvé, druhé a tretie.
- **Pravidlá:**
  - Na každej obrazovke jedna dominanta (nadpis, obraz alebo výzva).
  - Prostriedky podľa sily: veľkosť, kontrast a farba, váha, priestor okolo, poloha.
  - Akcent len na najdôležitejšie; keď je zlaté všetko, nie je nič.
  - Test prižmúrenia: rozmazaná snímka (Pillow `ImageFilter.GaussianBlur(8)`) stále ukáže poradie.
  - Hlavné tlačidlo plné, vedľajšie obrys alebo text.
- **U nás:** HEAD SPA 30 zlatá kurzíva v nadpise ako jediný akcent (`.h2 em`), hlavné tlačidlo plné zlaté,
  vedľajšie obrys, v cenníku jeden top rituál na kategóriu v zlatom ráme s plným tlačidlom. BARBERSHOP 30
  jediný akcent `--lamp`, hlavné tlačidlo len v úvode a v rezervácii, inde malé (`MASTER_BRIEF.md` časť 3).
- **Rieši:** `../../skills/frontend-design/` (Restraint: jedna zapamätateľná vec), snímky z `dizajn-audit.mjs`.

## 18. wireframe-builder: drôtový model

Vo videu: „Fast layout planning“ (UX).

- **Stráži:** že rozloženie sa rozhodne skôr, než sa ladí farba a písmo.
- **Pravidlá:** krabice a poradie najprv na telefóne; ASCII alebo sivý HTML prototyp so skutočnou dĺžkou
  textov; pri každej krabici úloha, obsah zo zdroja a akcia; dva až tri varianty a výber podľa zadania; pri
  viacerých autoroch pevné rozhranie (mená tried, dátové atribúty) pred stavbou.
- **U nás:** BARBERSHOP 30 `docs/CONTRACT.md` (záväzné rozhrania pred stavbou po moduloch),
  `../workflowy/priklady/stavba-webu.js`. Dnešná kostra HEAD SPA 30 na telefóne:

```
+------------------------------+
| lišta: značka, menu          |
| [film: dvere salónu]         |
| Vypni hlavu.                 |
| jedna veta                   |
| [Rezervovať online]          |
| 17 rituálov a ceny           |
+------------------------------+
| Rituál: kroky 01 až 05       |
| Cenník: kategórie, rituály   |
| Poukaz, Tím, Galéria         |
| Otázky, Kontakt, pätička     |
| spodná lišta (.mbar)         |
+------------------------------+
```

  Čísla krokov rituálu sú na mieste, lebo ide o skutočný sled krokov (`frontend-design`: čísla len pri sekvencii).
- **Rieši:** `../../skills/frontend-design/` (ASCII drôtové modely), `../workflowy/`.

## 19. hero-section-crafter: úvod

Vo videu: „Strong hero composition“ (UI).

- **Stráži:** prvý dojem a prvú akciu.
- **Pravidlá:**
  - Najcharakteristickejšia vec podniku hneď na začiatku: skutočný priestor, nie fotobanka.
  - Nadpis do šiestich slov, jedna veta pod ním, jedna hlavná a jedna vedľajšia výzva; nič ďalšie.
  - Text nad fotkou čitateľný: stmavenie len pod textom, kontrast 4,5 : 1 (veľký 3 : 1) aj na najsvetlejšom
    mieste.
  - Prvý obraz rýchlo: LCP do 2,5 s, fotka v najmenšom postačujúcom stupni a v preloade (`../rychly-web/`, časť 2).
  - Funguje bez skriptu aj bez pohybu (pokojná verzia s fotkou); na telefóne 390 × 844 celé nad zlomom.
- **U nás:** HEAD SPA 30 „Vypni hlavu.“, veta „Hlboký relax a regenerácia vlasov v jednom rituáli. Začína
  teplou vodou a končí tichom.“, tlačidlá „Rezervovať online“ a „17 rituálov a ceny“, skutočné dvere salónu
  (README, Úvodné dvere), pokojný úvod `.hero-static`. BARBERSHOP 30 „Tvoj strih. Tvoje miesto.“, nadpis
  a tlačidlá od prvej sekundy, prvý obraz rovnaký ako prvá snímka filmu (`MASTER_BRIEF.md` časť 2b), kontrast
  nad fotkou meraný na 99. percentile (časť 3).
- **Rieši:** `../film-z-fotiek/` (úvod a dvere), `../rychly-web/` (LCP), `../obsah-a-texty/` (hook),
  `../../skills/frontend-design/`.

## 20. card-layouts: karty a bloky

Vo videu: „Better cards and content blocks“ (UI).

- **Stráži:** aby bloky obsahu mali jednotnú stavbu a karta bola len tam, kde patrí.
- **Pravidlá:**
  - Karta len pre samostatnú jednotku s vlastnou akciou; inak zoznam s vlasovou linkou.
  - V jednej sade rovnaká stavba: obrázok v rovnakom pomere, nadpis, text, údaj, jedna akcia; akcie zarovnané.
  - Rádius a tieň podľa hierarchie, nie jeden rovnaký na všetkom (`frontend-design`, „SaaS-card kit“).
  - Celá karta klikateľná len pri jednej akcii; inak zreteľné tlačidlá.
  - Na telefóne jeden stĺpec; vodorovný pás so `scroll-snap` a kúskom ďalšej karty.
- **U nás:** HEAD SPA 30 má cenník ako menu: rituál oddelený vlasovou linkou `rgba(239,231,218,.12)` bez rámika
  a pozadia (zmerané), top rituál kategórie v zlatom ráme (`rgba(212,174,98,.62)` a vnútorná linka cez
  `box-shadow: inset`), cena vpravo písmom Lora 26 až 32 px. Pozor: `CLAUDE.md` píše o rituáloch „v pokojných
  okienkach (tenký rámik)“, kód 2026-10-11 dáva okienko len top rituálu; rozdiel povedz majiteľovi, nemeň ho
  potichu. BARBERSHOP 30 `.card` 1 px `--line`, rádius 8 px, `padding: 24px`; tím 10 portrétov v rovnakom
  výreze 4 : 5 (`MASTER_BRIEF.md` časť 3).
- **Rieši:** `../../skills/frontend-design/`, `dizajn-audit.mjs` (snímky).

## 21. navigation-systems: navigácia

Vo videu: „Better menus and IA“ (UX).

- **Stráži:** aby návštevník vždy vedel, kde je a ako sa dostane k akcii.
- **Pravidlá:**
  - Hlavná lišta 5 až 7 položiek, mená podľa obsahu, v poradí stránky.
  - Výzva vždy viditeľná; na telefóne spodná lišta v dosahu palca s `env(safe-area-inset-bottom)`.
  - Lišta 56 až 80 px; po skrole pevný podklad kvôli čitateľnosti; na telefóne bez `backdrop-filter`.
  - Aktuálna poloha (`aria-current`); kotvy odsadené pod lištu (oblasť 9).
  - Mobilné menu ovládateľné klávesnicou, Esc zatvára. Pätička zopakuje navigáciu, kontakt a právne údaje.
- **U nás:** HEAD SPA 30 lišta 80 px (telefón 68 px), `.nav.solid` dostane podklad, `.nav.hide` ju pri skrole
  dole (od 260 px) skryje, pri skrole hore a pri fokuse vráti (`assets/app.js`), `.drawer`, `.rail`, `.mbar` so safe-area, `backdrop-filter` vypnutý pod 640 px a pri `pointer: coarse`.
  BARBERSHOP 30 lišta 64 px (telefón 60), po 80 px skrolu podklad `rgba(14,13,12,.72)`, rozmazanie len nad
  900 px, menu cez celú obrazovku, spodné tlačidlo (`--cta-h` 56 px), linka kapitol od 1100 px, `aria-current`.
- **Rieši:** `../testy-a-nasadenie/` (menu a kotvy v testoch), `../rychly-web/` (`backdrop-filter`),
  `dizajn-audit.mjs`.

## 22. playwright-tester: testy v prehliadači

Vo videu: „Browser and UI testing“ (Testing).

- **Stráži:** že čo vyzerá dobre v kóde, vyzerá dobre aj v prehliadači.
- **Pravidlá:**
  - Čakať na stav, nie na čas (`waitForFunction`, príznaky v stránke ako `window.__renderDone`).
  - Pred snímkou písma načítané (`document.fonts.ready`), `scroll-behavior: auto`; pred snímkou celej stránky
    ju prejsť skrolom (obrázky `loading="lazy"`, `content-visibility: auto`) a vrátiť sa hore (pasce v SKILL.md).
  - Snímka celej stránky vyššej ako 8192 px v Chromiu so SwiftShaderom sa od riadku 8192 opakuje od vrchu
    (`MAX_TEXTURE_SIZE` 8192); fotiť bez prepínačov SwiftShaderu alebo po úsekoch.
  - Pred a po oprave tie isté šírky a podmienky; výstupy mimo repozitára.
  - Kontajner bez grafickej karty: WebGL kreslí softvérovo, časy sú len orientačné.
- **U nás:** `scripts/dizajn-audit.mjs` (tento skill), `../testy-a-nasadenie/scripts/dymovy-test.mjs`,
  `barbershop-30/source/tools/app-smoke.mjs` (105 kontrol), `barbershop-30/source/shot.mjs`,
  `../../skills/webapp-testing/` (Python). Playwright globálne, Chromium v `/opt/pw-browsers`.
- **Rieši:** `../testy-a-nasadenie/`, `../../skills/webapp-testing/`.

## 23. docs-lookup: zdroje a dokumentácia

Vo videu: „Design docs lookup“ (Utility).

- **Stráži:** aby číslo alebo pravidlo malo zdroj, nie pamäť.
- **Pravidlá:** primárny zdroj prečítaný v ten deň: WCAG 2.2 (https://www.w3.org/TR/WCAG22/), MDN pre CSS
  a podporu v prehliadačoch, web.dev pre výkon, dokumentácia Figmy pre jej MCP. Pri tvrdení zdroj a dátum;
  verzie knižníc overiť (genjutsu ich má s dátumom v `skills/_jutsu/VERSIONS.md`). Dokumenty projektu majú
  prednosť pred všeobecnými.
- **U nás:** `CLAUDE.md`, `barbershop-30/docs/` (MASTER_BRIEF, ART_DIRECTION, TOUR_DIRECTION, CONTENT_SOURCES,
  CHECKS), README HEAD SPA 30, zoznam zdrojov `toolbox/ZDROJE.md`.
- **Rieši:** `../obsah-a-texty/` (zdroje faktov), `../referencie-z-videi/` (video ako zdroj).

## 24. prototype-reviewer: posudok návrhu

Vo videu: „Prototype feedback support“ (Design).

- **Stráži:** nezávislý pohľad, kým sa návrh dostane k ľuďom.
- **Pravidlá:**
  - Posudok proti zadaniu a pravidlám, nie proti vlastnej chuti: splní stránka svoju jednu úlohu?
  - Snímky v troch šírkach, úvod, stred a koniec; každý postreh s dôkazom (snímka, číslo).
  - Najprv blokery (fakty, prístupnosť, telefón), potom vkus.
  - Pred odovzdaním jednu ozdobu zober preč (`frontend-design`, rada Coco Chanel).
  - Posudzuje niekto, kto návrh nerobil; pri viacerých návrhoch porota.
- **U nás:** BARBERSHOP 30 `MASTER_BRIEF.md` časť 4: štyri nezávislé kontroly (prístupnosť a odolnosť,
  pravdivosť a SEO, výkon, kreatívny posudok proti pôvodnému webu), záznamy `CHECKS.md` a `COMPARISON.md`.
- **Rieši:** `../workflowy/` (`priklady/integracia-a-kontrola.js`, porota), `dizajn-audit.mjs`,
  `../../skills/frontend-design/` (sebakritika so snímkami).
