# Čo sme sa naučili z referenčných videí (október 2026)

Sedem videí, z ktorých niečo prešlo do projektu. Pri každom: čo video hovorí (z oEmbed popisu
alebo titulkov), čo sme si zobrali, kam to prešlo a čo nie. Tvrdenia autorov sú ich tvrdenia,
nie overené fakty.

## 1. antenucci.studio: web barbershopu

- Adresa: https://www.tiktok.com/@antenucci.studio/video/7658328292251962641
- Popis autora (oEmbed): web barbershopu postavený za pár hodín; obsahuje „cinematic video hero,
  online booking flow, service menu with pricing, mobile perfect“. Na konci výzva „DM PROMPT“
  (ignorovaná).
- Rozbor po snímkach (`barbershop-30/docs/CHECKS.md`, časť 10): text je pripnutý a mení sa len
  krytím za 0,17 až 0,2 s, kamera ide bokom až 30 % šírky za scénu, na 7 scén pripadajú 3 tvrdé
  strihy, 3 prelínania a 1 záblesk, obraz je tmavý, tlačidlá sú len v úvode a na konci.
- Čo prešlo do webu Barbershop 30: filmové titulné karty bez dosky, nadpis po slovách, texty so
  silným hookom (traja textári a porota, každý údaj so zdrojom), skutočné videá majiteľa na
  telefóne, vlastný strih pre každý prechod (tabuľka `CUTS` v `barbershop-30/assets/film.js`).
  Cesta a texty kariet: `barbershop-30/docs/TOUR_DIRECTION.md`.
- Nástroje rozboru: snímky `fps=6`, časy strihov cez `select='gt(scene,0.25)',showinfo` (s
  `-hide_banner`, pri `-v error` sa nič nevypíše), jednotlivé snímky v presných časoch (`-ss`).

## 2. jackroberts____: Magic UI

- Adresa: https://www.tiktok.com/@jackroberts____/video/7694855095170780448
- Popis autora: veľké značky nepôsobia prémiovo náhodou, robia to drobné pohyblivé detaily
  (lesklé tlačidlá, animované zoznamy, bežiaci pás log); odkaz na magicui.design.
- Čo prešlo do webu Barbershop 30 (`CHECKS.md`, časť 10): lesk na hlavnom tlačidle, bežiaci pás
  služieb, kroky strihu, tabuľa dnešných hodín, svetlo po okraji kontaktnej karty, tím a galéria
  ako pás posúvaný prstom.
- Čo nie: na HEAD SPA 30 nič z toho. `CLAUDE.md` tam zakazuje žiary, prechody farieb, efekty pod
  kurzorom, čiastočky aj poskakovanie. Referencia neprebije pravidlá projektu.
- Výkonová lekcia, ktorá z toho vyplynula: nekonečné CSS animácie mimo obrazovky pauzovať cez
  IntersectionObserver (trieda `is-off`, `animation-play-state: paused`).
- Na stiahnutie bolo treba stránku načítať znova (prvé pokusy vrátili `statusCode` 10204).

## 3. millee.md: zoznam skills na animácie

- Adresa: https://www.tiktok.com/@millee.md/video/7694728261703683349
- Popis autora: zoznam, ktorý treba dať Claude, aby robil pohybové animácie.
- Čo prešlo: `toolbox/skills-animacie/` so štyrmi skills s licenciou MIT (GSAP skills od
  GreenSock, Design DNA, Motion Design Skill od LottieFiles, Genjutsu), každý aj s textom licencie.
  Three.js skills (CloudAI-X) nemajú licenciu, preto sú len odkazom v `README.md` a `toolbox/ZDROJE.md`.
- Lekcia: pred kopírovaním cudzieho repozitára over licenciu; bez nej len odkaz.

## 4. nategold.ai: Instagram Agent

- Adresa: https://www.tiktok.com/@nategold.ai/video/7694805301538737430 (44 s, titulky eng-US ASR)
- Titulky: Claude sa pripojí na Instagram a spravuje účet; „Instagram Agent“ zadarmo, 11 skills
  ako 11 agentov: píše príspevky podľa overených vzorcov úvodnej vety, komentuje cudzie príspevky,
  vybavuje odpovede, upravuje profil, plánuje týždeň (čo, kedy, s kým). Najlepšia časť: nájde
  najúspešnejšie reels v odbore, rozoberie, prečo fungovali, a premení ich na vlastné reels.
  Inštalácia: vložiť odkaz do Claude alebo komentovať „agent“ (ignorované).
- Obraz: karta „Your Instagram team, 11 skills. One workflow.“ s menami Post Writer, Comment
  Drafter, Reply Handler, Profile Optimizer, Content Planner, Virality Engine, Hook Extractor,
  Reel Scripter, Grid Planner, Trend Watcher, Engagement Loop; plán „This week“; rozbor reelu
  (HOOK, VISUAL, STRUCTURE); scenár reelu 00, 01, 02.
- Chyby automatických titulkov: „Claw“ namiesto Claude, „variety skill“ namiesto virality.
- Repozitár `github.com/nategoldai/instagram-agent` sa nepodarilo otvoriť (prístup zamietnutý).
- Čo prešlo: vlastný skill `toolbox/skills-z-praxe/instagram-salon/`, ktorý pripravuje len
  návrhy. Automatické komentovanie a odpovedanie z účtu sme odmietli: Instagram ho obmedzuje
  a pôsobí ako spam.

## 5. nicksadler.io: RuFlo, „60 agentov naraz“

- Adresa: https://www.tiktok.com/@nicksadler.io/video/7682904134776917270 (37 s, titulky eng-US ASR, pozreté 2026-10-12)
- Titulky: najsilnejší nástroj pre Claude, volá sa Ruflo; 60 agentov naraz so zdieľanou pamäťou, po každom behu
  „múdrejší“; jeden plánuje, jeden píše kód, jeden testuje, jeden kontroluje bezpečnosť; náklady na Claude API
  nižšie o 75 %; jednoduché úlohy idú automaticky na bezplatnú úroveň, zložité na najlepší model, predplatné
  vydrží 2,5× viac; „číslo jeden na GitHube“, open source. Výzva „comment flow“ ignorovaná.
- Obraz (snímky 19,5 s a 25,5 s, dokumentácia projektu): „Optimization: Skip expensive LLM calls for simple tasks
  using WebAssembly transforms, and compress tokens to reduce API costs by 30-50%“; tabuľka Agent Booster (WASM,
  analýza AST, jednoduché úpravy bez LLM pod 1 ms) a Token Optimizer (kompresia a cache, 30 až 50 % menej tokenov);
  Task Routing („Extend your Claude Code subscription by 250%“): jednoduché úlohy Agent Booster, stredné Haiku
  alebo Sonnet, zložité Opus a roj agentov. V rýchlom štarte je voliteľne `claude --dangerously-skip-permissions`.
- Overené 2026-10-12 na github.com/ruvnet/ruflo (predtým Claude Flow, MIT): README ho volá „agent meta-harness for
  Claude Code and Codex“. Inštalácia ako plugin (`/plugin marketplace add ruvnet/ruflo`, `/plugin install ruflo-core@ruflo`,
  podľa README bez hookov) alebo `npx ruflo@latest init wizard` (zapíše `.claude/`, `.claude-flow/`, `CLAUDE.md`,
  hooky a MCP server). README varuje, že mody „bežia s oprávneniami tvojho účtu a nie sú v sandboxe“.
- Čo nesedí: 75 % z videa nie je ani v dokumentácii, ktorú video ukazuje (30 až 50 %), a súčasné README konkrétnu
  úsporu neuvádza. „Číslo jeden“ ani „89 % presnosť smerovania“ nemajú v README metodiku, počet agentov je raz
  „100+“, raz „98“. Články z vyhľadávania sú často propagačné; jeden uvádza nezávislý audit, podľa ktorého sú
  niektoré časti len kostry (neoverili sme).
- Čo prešlo: tri myšlienky, ktoré sa dajú použiť bez inštalácie (skill `workflowy`, časť „Smerovanie podľa
  náročnosti a zdieľaná pamäť“, a šablóna `priklady/smerovanie-podla-narocnosti.js`): mechanické úlohy bez modelu
  (skript namiesto agenta), lacnejší model a nižšie `effort` na jednoduché fázy, zdieľaná pamäť agentov v súboroch.
  Odkaz v `toolbox/ZDROJE.md`. Skript `tiktok.sh` teraz nájde ffmpeg aj z balíka `imageio_ffmpeg`.
- Čo nie: inštalácia RuFlo do tohto repozitára. Prepisuje `CLAUDE.md` a `.claude/`, pridáva hooky a MCP server,
  rýchly štart ponúka vypnutie povolení. Vyskúšať sa dá na vlastnom počítači v prázdnom testovacom priečinku cez
  plugin, nikdy s `--dangerously-skip-permissions` a nie v repozitári s webmi.

## 6. joshfpocock: „YouTube agent“, 11 skills na kanál

- Adresa: https://www.tiktok.com/@joshfpocock/video/7695119366140087570 (55 s, titulky eng-US ASR, pozreté 2026-10-12)
- Titulky a popis: 11 skills pre YouTube zadarmo (licencia MIT podľa videa): scenár podľa 21 vzorcov úvodnej vety
  a skóre úvodu pred natáčaním; názov a obálka spolu; nájde mŕtve pauzy a opakované zábery a Claude ich vystrihne
  cez ffmpeg; nájde krátke videá v dlhých; audit kanála s jednou vecou na opravu; z údajov retencie presná sekunda,
  keď ľudia odišli, a čo vtedy zaznelo; „virality engine“ s videami, ktorým sa v odbore darí; hlas z vlastných
  videí; kapitoly, popisy, odpovede, týždenný plán. „It writes, you upload.“ Výzva „comment YOUTUBE“ ignorovaná.
- Obraz (prehľad snímok): príkazy `/yt-script`, `/yt-package`, `/yt-edit`, `/yt-shorts`, `/yt-audit`,
  `/yt-retention`, `/yt-viral`; karta hookscore (Specificity 62, Address 100, Stakes 88, Curiosity 92,
  Brevity 100, spolu „78 STRONG“); vzorce The Reveal, The Superlative, The Comparison, The Origin, The Deadline,
  The Result, The Mistake, Contrarian, Insider, The Impossible Claim; audit (posledných 10 názvov, obálky vo
  veľkosti v zozname, prvých 15 s, rytmus nahrávania, tvar retencie); retencia s poklesom v 0:07 pri vete
  „so before we start, a quick bit of backstory“; virality engine s násobkami 9,35×, 7,23×, 4,19× a 1,00×
  (video proti mediánu kanála); `voice.md` (komu hovorím, ako naozaj hovorím, slová, ktoré nepoužívam, čo netvrdím).
- Overenie 2026-10-12: repozitár sme nenašli (vyhľadávanie „youtube-agent-skill“ bez výsledku). Odkaz z popisu
  vedie na stránku, ktorá knižnicu odomkne až po zadaní e-mailu; e-mail za majiteľa nezadávame. Licenciu ani kód
  sme preto nevideli, výkon („murdered YouTube“) je reklama.
- Čo prešlo (skill `instagram-salon`, časť „Doplnky z videa YouTube agent“): `scripts/hook_skore.py` (vlastné
  pravidlá pre slovenčinu, kalibrované na vetách z našich webov), `scripts/pauzy.py` (ffmpeg silencedetect a strih,
  overené na skúšobnom videu: 2 pauzy po 1,5 s nájdené, 0,4 s ignorovaná, 8,0 s → 5,5 s), `references/sablona-hlas.md`,
  audit profilu s jednou vecou, retencia a výnimočné reels (pozretia ÷ medián).
- Čo nie: pripojenie k účtu, automatické uverejňovanie, kopírovanie cudzích videí („rebuilds them end to end“).

## 7. torontowebsites: „Lawyer Website“

- Adresa: https://www.tiktok.com/@torontowebsites/video/7253066917328653573 (21 s, bez titulkov a reči, pozreté 2026-10-12)
- Obraz (snímky po 0,5 s): tmavý web advokáta na naklonenej obrazovke. Úvod: malé „Law Firm Name“, veľký svetlý pätkový
  nadpis, ktorý sa preklopí z perspektívy, drevené kladivko sudcu v kuželi teplého svetla, ktoré ide za kurzorom, zlatá
  minca so šípkou a točiacim sa textom „scroll down“, bodky sekcií vpravo. Ďalej portrét, ktorý svetlo odhalí, oblasti práva
  ako knihy v drevených priehradkách (vodorovný pás, knihy sa pri posune natáčajú), recenzie v tmavých kartách s bronzovým
  levom, na konci široká fotka knižnice a „Let's Talk“ v teplej žiare s kruhom textu.
- Čo prešlo (web `zentury/`, README tam): 3D kladivko (three.js, LatheGeometry, drevo kreslené v canvase, mosadzné pásy
  z farby loga) so svetlom za kurzorom a úderom na klik; nadpis preklopený do svetla; minca; bodky; fotka odhalená svetlom
  (maska radial-gradient, `@property` na plynulý pohyb); služby ako 3D knihy v CSS (obal, chrbát, orezy strán), kniha sa
  otvorí v dialógu s preklopením obalu; zásady ako paragrafy § 1 až § 6 namiesto vymyslených recenzií; „Poďme sa porozprávať“.
- Čo nie: recenzie klientov (nemáme skutočné), ilustračné fotky tímu, naklonená obrazovka a modré pozadie (to je len
  prezentácia vo videu).

## Spoločné lekcie

- Hook pre texty: prvá veta je jasný sľub, potom obraz miesta, potom čo dostaneš a ako rezervovať.
- Rozbor rob po snímkach a s časmi; popis autora o obsahu nevypovedá.
- Každé rozhodnutie z referencie zapíš do dokumentu projektu (tu `CHECKS.md`, `TOUR_DIRECTION.md`),
  inak sa o mesiac nebude vedieť, prečo je web taký, aký je.
