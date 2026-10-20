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

`skills-z-praxe/` – naše vlastné postupy z prác na weboch HEAD SPA 30 a BARBERSHOP 30,
spísané z kódu, ktorý na webe naozaj beží, a overené proti nemu. Prehľad je
v `skills-z-praxe/README.md`:

| Skill | Na čo je |
| --- | --- |
| `instagram-salon` | návrhy príspevkov, reels, odpovedí, bio a týždenného plánu pre Instagram salónu, reklamy a dopyty bez automatiky (len návrhy, uverejňuje majiteľ) |
| `referencie-z-videi` | ako sa poučiť z odkazu na TikTok alebo Instagram reel: popis, titulky, video, text zo snímok, zásada sťahovania, 17 rozobratých videí |
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
