# Toolbox: skills a zdroje na tvorbu webu a obsahu

Priečinok nie je súčasťou webu (na GitHub Pages sa nenasadzuje). Je to sada
nástrojov, ktoré sa dajú použiť s Claude Code alebo s Claude.ai pri ďalšej práci na
HEAD SPA 30 aj na iných projektoch.

## Čo je vnútri

`skills/` – skills od Anthropicu z verejného repozitára anthropics/skills, všetky pod
licenciou Apache 2.0 (licencia je v každom priečinku):

| Skill | Na čo je |
| --- | --- |
| `frontend-design` | dizajn webových rozhraní, ktoré nevyzerajú ako šablóna |
| `web-artifacts-builder` | zložitejšie webové aplikácie (React, Tailwind, shadcn/ui) |
| `theme-factory` | farebné a písmové témy pre stránky, prezentácie a dokumenty |
| `brand-guidelines` | držanie sa vizuálnej identity značky |
| `canvas-design` | vizuály, plagáty a grafika (obsahuje písma, preto je väčší) |
| `algorithmic-art` | generatívna grafika (p5.js) |
| `webapp-testing` | testovanie webu v prehliadači cez Playwright |
| `skill-creator` | tvorba vlastných skills a ich meranie |
| `mcp-builder` | tvorba MCP serverov (prepojenie na iné služby) |

`skills-animacie/` – skills na pohyb, 3D a vizuálnu identitu z verejných repozitárov
(MIT), zoznam a pôvod v `skills-animacie/README.md`; ako spúšťať UI/UX Pro Max z Genjutsu
v `skills-animacie/ui-ux-pro-max-u-nas.md`.

`skills-senior/` – Premium & Cinematic Web Studio (`build-premium-websites`): 100 kapitol seniorskej práce na
filmovom webe (art direction, prechody, kontinuita scén, VFX, výkon, prístupnosť, dodanie) a 100 zadaní pre senior
grafika s vizuálnymi efektmi Z001–Z100. Pôvod, overenie a použitie v `skills-senior/README.md`.

`skills-z-praxe/` – naše vlastné postupy z prác na weboch HEAD SPA 30 a BARBERSHOP 30,
spísané z kódu, ktorý na webe naozaj beží, a overené proti nemu. Prehľad je
v `skills-z-praxe/README.md`:

| Skill | Na čo je |
| --- | --- |
| `instagram-salon` | návrhy príspevkov, reels, odpovedí, bio a týždenného plánu pre Instagram salónu, reklamy a dopyty bez automatiky (len návrhy, uverejňuje majiteľ) |
| `referencie-z-videi` | ako sa poučiť z odkazu na TikTok alebo Instagram reel: popis, titulky, video, text zo snímok, zásada sťahovania, 19 rozobratých videí a jeden karusel |
| `film-z-fotiek` | film zo skutočných fotiek s hĺbkovou mapou na pozadí webu (WebGL2), strihy, kamera, zálohy |
| `video-a-sekvencie` | plynulé video pri skrolovaní ako sekvencia snímok po 0,1 s, slučky videa bez švu |
| `rychly-web` | Lighthouse mobil 95+ a desktop 100, plynulý skrol, pasce s CLS, LCP a prepočtom štýlu, pohyb bez knižnice (nástup pri skrole, svetlo, Motion a 21st.dev do vanilla) |
| `testy-a-nasadenie` | testy v prehliadači (Playwright), nasadenie na GitHub Pages, FTP balík |
| `obsah-a-texty` | pravdivé texty po slovensky, zdroje faktov, šesť jazykov, štruktúrované dáta |
| `booqme-rezervacie` | web napojený na Booqme (rezervácie, poukazy), zosúladenie po zmene v kalendári |
| `workflowy` | práca s viacerými agentmi naraz: stavba, kontroly, porota návrhov, audit s overením |
| `youtube-shorts` | YouTube Shorts zo skutočných záberov: recept, titulky, -14 LUFS, kontrola a balík na nahratie (nahráva majiteľ); formát 16:9, fámy a štítok NEPOTVRDENÉ, strih podľa rytmu referencie |
| `tim-roly` | tím rolí podľa gstack, ECC a Agency Agents: otázky majiteľovi, revízie, recenzent, QA, bezpečnosť, release, brána dvoch recenzentov, karta roly, roly pre obsah a predaj |
| `3d-modely-na-web` | 3D modely na weby: rozhodnutie, licencie (TRELLIS.2 a závislosti), rozpočet GLB pre telefón, postup fotka → GLB → web, kontrola `glb_info.py` |

`head-spa-30/` – prevádzka webu HEAD SPA 30: nahratie na Forpsi, kontrola nahratia, poukazy a ceny
v Booqme, orez poukážok (skripty v `scripts/`, návody v `references/`, začína sa v `SKILL.md`).
`gym-klub/` – kde je projekt GYM KLUB (iná vetva) a pravidlá pre jeho fotky.

`sablona-skillu/` – šablóna nového skillu, `specifikacia/` – špecifikácia formátu
Agent Skills. `ZDROJE.md` – vybrané bezplatné zdroje (písma, ikony, fotky, šablóny,
nástroje) s licenciami.

Skills na dokumenty (docx, pptx, xlsx, pdf) tu nie sú, lebo Anthropic ich dáva pod
inou licenciou. V Claude Code ich dostaneš celé jedným príkazom:

```
/plugin marketplace add anthropics/skills
```

## Ako to použiť

- **Claude Code:** skill sa načíta sám, keď je v `.claude/skills/` projektu alebo
  v `~/.claude/skills/`. Stačí skopírovať priečinok, napríklad
  `cp -r toolbox/skills/frontend-design .claude/skills/`.
- **Claude.ai:** v nastaveniach (Settings, Capabilities, Skills) nahraj priečinok
  skillu ako zip.
- Na Instagram salónu je hotový `skills-z-praxe/instagram-salon`. Ďalší vlastný
  skill (napríklad správy zákazníkom v šiestich jazykoch) sa dá spraviť zo
  `sablona-skillu/`.
- Postupy zo `skills-z-praxe/` sa pri práci v tomto repozitári dajú čítať priamo,
  netreba ich kopírovať; do `.claude/skills/` ich skopíruj, ak ich chceš mať
  k dispozícii automaticky alebo v inom projekte.

## Kam patrí požiadavka (smerovanie)

Repozitár a toolbox slúžia viacerým projektom. Pri novej požiadavke postupuj takto:

1. Urči projekt podľa podniku alebo adresy v požiadavke (tabuľka nižšie).
2. Nájdi pracovný strom a vetvu (`git worktree list`), urob `git fetch` a zisti, či je vetva aktuálna voči
   základnej. Zoznam stromov sa mení s každou reláciou, preto patrí do `PRIEBEH.md` projektu, nie sem.
3. Prečítaj záväzné pravidlá **toho** projektu. Koreňový `CLAUDE.md` je písaný pre web HEAD SPA 30; ktoré jeho
   pravidlá platia aj pre iný projekt (napríklad commity po slovensky bez podpisov), napíš do zadania
   (`skills-z-praxe/workflowy/`, Pasce: „Pravidlá iného webu“).
4. Ak sa požiadavka týka peňazí, klientov, zverejnenia alebo účtov, prejdi zoznam
   `skills-z-praxe/tim-roly/SKILL.md`, časť „Schválenia majiteľa“.
5. Keď nie je jasné, kam požiadavka patrí, polož jednu otázku vo formáte D1 (`skills-z-praxe/tim-roly/`) a nehádaj.
   Pri pochybnosti ide požiadavka prísnejšou cestou, ako robí aj smerovanie recenzií.

Kde v stĺpci „Kto schvaľuje“ stojí „návrh (D1)“, je súhlas majiteľa pred pushom do `main` zatiaľ len návrh, ktorý
čaká na rozhodnutie majiteľa; `CLAUDE.md` ho dnes nežiada (`head-spa-30/SKILL.md` ho pri HEAD SPA 30 žiada).

| Požiadavka (príklad) | Projekt | Kde | Záväzné pravidlá | Skills | Bežný postup | Kto schvaľuje |
| --- | --- | --- | --- | --- | --- | --- |
| text, rituál, cenník, poukážka na webe | HEAD SPA 30 (web) | koreň repozitára `head-spa-30`; pracovná vetva `claude/head-spa-30-page-uil3m0`, nasadenie z `main` | `CLAUDE.md`, `docs/booqme-sluzby.csv`, `docs/booqme-poukazy.csv`, `docs/recenzie.md` | `obsah-a-texty`, `booqme-rezervacie`, `rychly-web`, `testy-a-nasadenie` | malá zmena priamo; väčšia s kontrolou troma pohľadmi | push do `main` nasadí GitHub Pages a pri nastavených FTP tajomstvách aj headspa30.sk (`.github/workflows/ftp.yml`); súhlas majiteľa: návrh (D1) |
| cena alebo poukaz v Booqme, nahratie na headspa30.sk | HEAD SPA 30 (prevádzka) | `toolbox/head-spa-30/` | `head-spa-30/SKILL.md`, `head-spa-30/references/booqme.md` | `head-spa-30` | pripravíme súbory a postup | zmenu v Booqme a nahratie robí majiteľ |
| vernostná kartička: prihláška, body, odmeny, akcie, správy | Vernostná kartička 30 (Barbershop 30 a HEAD SPA 30) | `vernost/` v `main`; nasadzuje sa s webom HEAD SPA 30; kópia prihlášky v `barbershop-30/assets/vernost.js` | `vernost/README.md`, `vernost/ochrana-udajov.html` | `testy-a-nasadenie`, `tim-roly` (bezpečnosť) | zmena kódu: `sh vernost/testy/spusti.sh` a bezpečnosť nad diffom; odmeny, akcie a správy zadáva prevádzka v admine | majiteľ: texty súhlasov, odmeny, hromadné správy, heslá v GitHub tajomstvách |
| plynulosť, vzhľad, nová časť webu | Barbershop 30 | `barbershop-30/` v `main`; oprava plynulosti na vetve `barbershop-plynulost`, denník na `barbershop-plynulost-dennik` | `barbershop-30/docs/` (`CONTENT_SOURCES.md`, `ART_DIRECTION.md`, `CHECKS.md`), zadanie práce (`ZADANIE.md` v scratchpade, kópia v denníku); pravidlá názvov z `CLAUDE.md` sa ho netýkajú | `film-z-fotiek`, `video-a-sekvencie`, `rychly-web`, `workflowy`, `skills-senior` | audit → plán → dávky s hodnotiteľom (`workflowy`, vzor 9) | merge do `main` po záverečnej kontrole celku; súhlas majiteľa: návrh (D1) |
| GYM KLUB: tréner, rozvrh, ceny na živom webe | GYM KLUB (obsah) | repozitár Lupa-gym, správca mení obsah cez Pages CMS (každé uloženie je commit do `main`); pôvodný zdroj `lipa-gym/` na vetve `claude/subor-idk-fotografie-fitka-5lqm3q` | `NAVOD-PRE-ONDREJA.md` a `NASTAVENIE-CMS.md` v Lupa-gym, `gym-klub/README.md` (fotky) | `obsah-a-texty`, `workflowy` | malá zmena priamo, kontrola s overením nálezov | push a nasadenie kódu: návrh (D1); ktorý z dvoch zdrojov je pravda, potvrdiť (D1) |
| GYM KLUB: redizajn, filmová vrstva | GYM KLUB (redizajn) | Lupa-gym, lokálna vetva `redizajn-2026-10` (nepushovať) | špecifikácia redizajnu (`SPEC.md` v scratchpade) a záväzné úpravy majiteľa (dnes len v zadaní workflowu stavby; patria do `ROZHODNUTIA.md`) | `workflowy`, `skills-senior` | balíky s hodnotiteľom (vzor 9) | smer a nasadenie: majiteľ (vetva sa nepushuje) |
| web klienta: Zentury, Visionary Living, Stavebniny Richtárik | projekt klienta | `zentury/`, `visionary-living/`, `stavebniny-richtarik/` v `main` (kópie na vetve GYM KLUB sa nepoužívajú) | README projektu, `docs/` projektu; texty len z pôvodného webu klienta | `skills-senior`, `obsah-a-texty`, `rychly-web`, `workflowy` (porota) | nový smer: porota a 2 až 3 snímky majiteľovi pred stavbou | odkaz klientovi a doména: majiteľ |
| short, reel, video | video prevádzky | výstupy v scratchpade; prompt videa (dnes `prompty/` na vetve GYM KLUB) | `skills-z-praxe/youtube-shorts/SKILL.md`, `skills-z-praxe/referencie-z-videi/references/stahovanie-a-pravo.md` | `youtube-shorts`, `instagram-salon`, `tim-roly` | fakty a zábery → skeptici → brána dvoch recenzentov → `schvalenie.py` | presný súbor schváli a uverejní majiteľ |
| príspevok, odpoveď, reklama na Instagrame | marketing prevádzky | bez repozitára | `skills-z-praxe/instagram-salon/SKILL.md` | `instagram-salon`, `tim-roly` (časť 9) | len návrh | majiteľ odošle sám |
| „pozri toto video a nauč sa“ | toolbox | `scratchpad/referencie/vNN/` → záznam do `skills-z-praxe/referencie-z-videi/references/naucene-z-videi.md` | `skills-z-praxe/referencie-z-videi/SKILL.md`, `…/references/stahovanie-a-pravo.md` | `referencie-z-videi`, `workflowy` | rozbor, overenie a naša prax naraz → koncept → kontrola; do `naucene-z-videi.md` píše jeden beh naraz | commit toolboxu: hlavná relácia; inštaláciu nástroja z videa: majiteľ |
| nový alebo opravený skill | toolbox | `toolbox/` v `main` | tento README, `sablona-skillu/`, `specifikacia/` | `skill-creator`, `workflowy` (vzor 6) | autor → overovateľ | push: hlavná relácia; súhlas majiteľa: návrh (D1) |
| nejasné alebo viac projektov naraz | – | – | – | – | jedna otázka D1 | majiteľ |
