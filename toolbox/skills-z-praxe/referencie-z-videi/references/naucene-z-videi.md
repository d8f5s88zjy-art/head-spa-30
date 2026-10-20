# Čo sme sa naučili z referenčných videí (október 2026)

Osemnásť videí a jeden karusel (záznam 18), z ktorých niečo prešlo do projektu. Pri každom: čo video hovorí (z oEmbed popisu,
titulkov alebo textu v obraze), čo sme si zobrali, kam to prešlo a čo nie. Tvrdenia autorov sú ich tvrdenia,
nie overené fakty. Označenie V1 až V10 v skilloch `youtube-shorts` a `tim-roly` zodpovedá záznamom 8 až 17
(V1 = 8, V2 = 9, V3 = 10, V4 = 11 … V10 = 17); záznamy 15 až 17 sú reels z Instagramu (bez titulkov, text zo snímok).

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

## 8. martin.gocik: gstack, „celý tím v Claude Code“

- Adresa: https://www.tiktok.com/@martin.gocik/video/7696528372595444995 (44,78 s, po slovensky, uverejnené 2026-10-15,
  3 247 pozretí a 222 uložení pri stiahnutí 7 h po uverejnení, pozreté 2026-10-17)
- Popis autora: šéf Y Combinatoru dal na GitHub svoj setup pre Claude Code, úplne zadarmo; volá sa gstack a z Claude Code
  spraví celý tím (CEO, engineering manažér, dizajnér, review, QA); inštalácia jedným príkazom, open source.
- Titulky: automatický prepis (Source: ASR) je slovenčina prepísaná ako angličtina a skoro nepoužiteľný: „Vola sa gistek
  az cloud code“ = „Volá sa gstack a z Claude Code“, „trigger with a fraction“ = „spúšťaš cez lomítko“, „Tory will lock
  your own architecture“ = „ktorý ti zamkne vlastnú architektúru“. Reč sme preto čítali z titulkov v obraze.
- Obraz (snímky s časmi): hovoriaca hlava striedaná s grafikou hore; 0 až 1,4 s fotka Garryho Tana so štítkom „šéf
  Y Combinatoru“; 1,4 s skutočná stránka repozitára s hviezdami (135.7k na snímke); 8,2 s číslo rastie na „23 nástrojov
  cez /“; 10,9 až 29,9 s roly vždy „rola + čo ti urobí“ (CEO, Eng manažér, Dizajnér, Review, QA, ilustračný test
  „checkout keeps cart“); 29,9 s maketa terminálu „git clone …/gstack.git && ./setup ✓ hotovo za ~30 sekúnd“; 35,2 s
  „Prémiová verzia“ prečiarknutá, „Všetko zadarmo“; 37,6 až 38,6 s počítadlo „130 000+ hviezd na GitHube“; 41,9 s výzva
  „follow“ (ignorovaná).
- Formát (merané): 23 záberov, medián 2,00 s, prvá zmena obrazu 1,43 s, 188 slov/min bez páuz, -15,8 LUFS, druhý hook
  „Najlepšie na tom je“ v 33,1 s (74 %), titulky v pilulke na švíku delenej obrazovky; pri tvári na celú obrazovku
  titulok dvakrát na očiach. Podrobne `../../youtube-shorts/references/anatomia-referencii.md`.
- Overené 2026-10-17 na klone github.com/garrytan/gstack (verzia 1.91.101.0, commit 47d639a, MIT, Copyright (c) 2026
  Garry Tan), len čítanie, nič nespustené: Garry Tan je „President & CEO“ Y Combinatoru (ycombinator.com/people).
  „23“ je z vety README „Twenty-three specialists and eight power tools“ (`README.md:23`), tabuľky README majú 34 rolí
  a 13 power tools, repozitár 56 skills. Inštalácia: `./setup` meral autor 31 s po klonovaní na 4-vCPU stroji
  (`README.md:45`), treba Git, Bun 1.4.2+ a na Windows Node.js (`:47`); setup stiahne Chromium a skompiluje nástroje.
  Bez prémiovej verzie: MIT a „No premium tier, no waitlist“ (`:606`); prevádzka však potrebuje Claude Code a predvolene
  zapnuté outside reviews cez Codex. Hviezdy 136,7k (stránka repozitára 2026-10-17).
- Čo nesedí: „23“ (stav je 56 skills), „menej ako 30 s“ (31 s po klonovaní, bez Bunu viac), terminál je maketa, nie
  nahrávka; „celý tím“ sú sady pokynov v Markdowne; počítadlá od nuly sú efekt.
- Čo prešlo: skill `../../tim-roly/` (otázky majiteľovi, režimy rozsahu, dizajn 0 až 10 a AI slop, eng manažér,
  staff recenzent s AUTO-FIX a ASK, QA s charterom, vyšetrovateľ s Iron Law a stopom po 3, bezpečnosť podľa `/cso`,
  release s „žiadne tvrdenie o hotovom bez čerstvého dôkazu“), šablóna `../../workflowy/priklady/tim-roly-plan.js`
  (vzor 8). Pre Shorts: reč od 0,0 s, dôkaz do 1,5 s, kroky jednou vetnou šablónou, druhý hook (`../../youtube-shorts/`).
- Čo nie: inštalácia gstacku (Bun, binárky, Stop hook v `~/.claude/settings.json`, vlastný prehliadač s cookies,
  telemetria a kontrola aktualizácií), outside reviews cez Codex a OpenAI, automatické rozhodnutie za človeka,
  automatický merge, VERSION a CHANGELOG. Vo videu: cudzia tvár ako hook, makety ako dôkaz, počítadlá od nuly.

## 9. sadie.ontech: ECC, „64 agentov, 261 skills“

- Adresa: https://www.tiktok.com/@sadie.ontech/video/7696238669086068000 (54,22 s, titulky eng-US ASR, uverejnené
  2026-10-13, 186 500 pozretí a 13 301 uložení, pozreté 2026-10-17)
- Titulky: jeden človek nahradil celý inžiniersky tím a dal to zadarmo na GitHub, „No exaggeration“; „One developer shipped
  it alone in 10 months“, „crossed 250,000 stars“; inštalácia za 30 s v Claude Code, Cursor alebo Codex cez
  `/plugin marketplace add` a `/plugin install`; „Tell it to plan / build / secure / test“; „64 agents, 261 skills, all
  free“. Chyba prepisu: „cloud code“ = Claude Code. Výzva „save … follow“ ignorovaná.
- Obraz: hore text po slovách, v strede pevný nadpis „ONE DEVELOPER VS / AN ENTIRE TEAM“, dole moderátor (13 % času;
  či je to skutočný človek, z obrazu neurčíme); ~73 % času b-roll cudzích kancelárií a ľudí bez vzťahu k nástroju;
  karty s maketami (README, „256.0k stars“, písanie `/plugin`), teplé záblesky 0,2 až 0,4 s; na konci „64 AGENTS, 261
  SKILLS, ALL FREE“.
- Formát (merané): 27 záberov, medián 1,57 s, prvá zmena 1,57 s, 159 slov/min, basový podklad, -10,8 LUFS, druhý hook
  „Here's the part that makes this insane“ v 26,6 s (49 %), titulky po jednom slove v dolnom páse.
- Overené 2026-10-17 na klone github.com/affaan-m/ECC (presmerované z everything-claude-code; verzia 2.2.3, commit 76aaa77,
  MIT, Copyright (c) 2026 Affaan Mustafa), len čítanie: 71 agentov, 311 skills, 97 príkazov, 27 hookov. 64/261 sú čísla
  verzie 2.0.0 z 2026-06-09 („2.0.0 shipped 64/261/84“, `docs/releases/2.1.0/release-notes.md:52`). Hviezdy 281.8k
  (stránka repozitára), prispievateľov 412 (shields.io), takže „alone“ neplatí; „10 months“ je v návode autora dĺžka
  jeho používania Claude Code (`the-shortform-guide.md:9`). Príkaz build neexistuje (len `/build-fix` a opravári
  zostavenia); „secure“ skenuje konfiguráciu agenta (AgentShield) a dáva kontrolný zoznam OWASP, na aplikáciu neútočí;
  80 % je pokyn v `/test-coverage`. Presné príkazy: `/plugin marketplace add https://github.com/affaan-m/ECC`
  a `/plugin install ecc@ecc` (`README.md:290-291`), Cursor a Codex majú iné. Pri plugine je 27 hookov predvolene
  zapnutých a zapisujú pozorovania nástrojov a súhrny relácií mimo projektu.
- Čo nesedí: zastarané počty, „alone“, „build“, „attacks on your app“, „30 s“ (balík 76 MB, treba Claude Code 2.1+,
  Git a Node.js 18+); ilustračné zábery naznačujú tím, ktorý neexistuje.
- Čo prešlo: brána dvoch recenzentov (podľa `santa-method`; `../../workflowy/priklady/brana-dvoch-recenzentov.js`,
  vzor 7), schválenie presného súboru podľa sha256 (podľa `operator-approval-loop`;
  `../../youtube-shorts/scripts/schvalenie.py`), zásady krátkeho videa z `content-engine` (zo skutočného materiálu,
  jedno video jedno tvrdenie, prvé sekundy výsledok alebo problém, bez „engagement bait“) a „edit, don't generate“
  z `video-editing`, správa PRIPRAVENÉ alebo NEPRIPRAVENÉ (podľa `verification-loop`), „lethal trifecta“ a „executable
  configuration“ do roly bezpečnosť (`../../tim-roly/`).
- Čo nie: inštalácia ECC (hooky, GateGuard podľa autorov asi o 45 % viac kôl bez nameraného účinku, `npx` z npm),
  automatická pamäť relácií, uverejňovanie cez `social-publisher` a oslovovanie cez `lead-intelligence`, generovaný
  obraz a hlas bez súhlasu, pravidlá pre aplikácie (80 % pokrytie). Video samo je ukážka, čo v Shorts nerobiť:
  staré čísla, sľuby, ktoré nástroj nerobí, a ilustračné zábery.

## 10. restructureai: „AI Social Media Team That Runs Your Marketing“

- Adresa: https://www.tiktok.com/@restructureai/video/7697097038286130453 (97,58 s, titulky eng-US ASR, uverejnené
  2026-10-16, 107 300 pozretí, 5 676 páči sa, 5 920 uložení, pozreté 2026-10-17)
- Titulky: „200 hours“, „exact blueprint for free“; tri moduly. Reklamy: rozpočet $500 na týždeň, Jev nájde cudzie
  reklamy, ktoré bežia týždne, Claude napíše 20 reklám, Higgsfield spraví video z fotiek, ElevenLabs dá každej iný hlas,
  schválenie, 48 h test, rozpočet na víťazov. Dopyty: číta všetky komentáre a DM na Instagrame, TikToku a Facebooku,
  označí kupujúcich a pošle odkaz „nechaj číslo“. Predaj: hlasový agent ElevenLabs volá do 60 s, rezervuje termín.
  Claude Code spája reklamy, komentáre a hovory; ranný súhrn; „no ad or post goes live until you sign off on it“.
  Chyby prepisu (overené v obraze): „Jeff“ = Jev, „Hicksfield“ = Higgsfield, „11 Labs“ = ElevenLabs, „Cloud code“ =
  Claude Code, „Leeds“ = leads. Výzva „like a follow“ ignorovaná, za „blueprint“ sa v článku autora chce komentár.
- Obraz: hustý plagát (01 Signals, 02 System of Record, 03 The Brain, 05 Departments s ôsmimi oddeleniami, What Interrupts
  The Loop, 07 Human Handoff), veta „Claude writes. Jev decides. ElevenLabs talks. You just approve.“; mini toky modulov
  s vymyslenou značkou „Groove & Grain“ a číslami, ktoré nesedia ($41,200 proti $40,800, „within 60 seconds“ proti 0:47,
  „10x“ a o sekundu „95x“); formulár „Get your quote“ bez súhlasu a bez informácie o AI hovore či nahrávaní.
- Formát (merané): 14 záberov s 36 krokmi vnútri (medián kroku 2,51 s), statický úvod do 2,77 s, 172 slov/min, pauzy
  0,3 až 0,5 s pred kapitolami, -16,6 LUFS; titulky len v 33 % času.
- Overené 2026-10-17: Jev je rozhodovací model firmy TypeSafe AI (nepíše text; skorý prístup od 15. 9. 2026, výkon
  uvádza len výrobca). „Blueprint“ nie je kód: text videa je verejne v článku na re-structure.ai, plná mapa za komentár
  (nekomentovali sme, e-mail ani telefón nezadávali). Schválenie vo videu pokrýva len reklamy a príspevky; odpovede,
  správy, hovory a presun rozpočtu idú bez majiteľa. Zákony (primárne zdroje, slov-lex.sk): zákon 452/2021 § 116 ods. 3
  (automatické volacie systémy na priamy marketing len s predchádzajúcim preukázateľným súhlasom), § 109 ods. 8 (cookies),
  Občiansky zákonník § 12 (záznam hlasu len s privolením), AI Act čl. 50 (oznámiť AI, označiť deepfake), zákon 108/2024
  (§ 10, príloha č. 1 body 31 a 32 o hodnoteniach). Meta: automatický zber len cez API, správy v okne 24 h; Ad Library
  pri bežných reklamách výdavky neukazuje. Podrobne `../../instagram-salon/references/pravne-hranice.md`.
- Čo prešlo: do `../../instagram-salon/` časť „Reklamy, dopyty a schvaľovanie“ (schválenie všetkého, čo ide von,
  konkurencia v Meta Ad Library ručne a skriptom `scripts/reklamy_konkurencie.py`, 2 až 3 varianty reklamy z overených
  faktov namiesto 20, odkazy s UTM, súhrn v piatich riadkoch, kedy zastaviť), právne hranice v
  `references/pravne-hranice.md`. Pre Shorts: poistka nahlas, kapitoly s pauzou, domovský záber, reťaz uzlov ako
  ukazovateľ postupu (`../../youtube-shorts/`).
- Čo nie: AI hovor do 60 s, automatické komentáre a DM, video z fotiek a AI hlasy pri službách, učenie z cudzích
  reklám ako predloha, agent s prístupom k reklamnému účtu a platbám, žiadosti o recenzie len od spokojných, vymyslené
  čísla. Ako zistiť, kam vedie „blueprint“: odkaz v bio (`signature`, `bioLink` v `webapp.user-detail`, pasca v `../SKILL.md`).

## 11. billyfx (Bilawal Sidhu): God's Eye View, „I open sourced God's Eye View“

- Adresa: https://www.tiktok.com/@billyfx/video/7683571519200578830 (66,07 s, titulky eng-US ASR, uverejnené
  2026-09-09 16:22 UTC, 422 400 pozretí, 31 900 páči sa a 17 807 uložení pri stiahnutí 2026-10-17, pozreté 2026-10-17)
- Titulky (opravené podľa obrazu): God's Eye View je open source; „I knew you wanted the code, but I didn't think
  this would happen“; iní tvorcovia o ňom točia videá („Google Maps on steroids“, „this website shows you the whole
  planet live right now“); launch video malo za prvé dni pol milióna pozretí; repozitár bol #1 na GitHub Trending
  „and a week later it's still up there“; vynálezca hashtagu ho dal na Product Hunt; Brendan Eich, „the creator of
  Brave, Firefox and JavaScript“, sa zapojil; „things are getting spicy“ (mém „FBI, open up!“); dve otázky divákov
  (ako to spustiť bez programovania, celý návod) a „So today, let's get into both“. Chyby prepisu: „Outside view“ =
  God's Eye View, „Planet Earth“ = Palantir. Výzvy (pozrieť dlhé video, odoberať) sme nevykonali.
- Obraz: čierny rám 9:16, nad ním **stály titulok v troch riadkoch celých 66 s** („I open sourced God's Eye View. /
  It hit #1 on GitHub Tending. / Then then things got interesting.“, dva preklepy), pod ním pás 16:9 (y 656 až 1263);
  hook 4 zábery za 2,97 s pod slovom, ktoré rastie („OPEN“ → „OPEN SOURCED“); písací stroj vedľa kariet cudzích videí
  („THIS IS PALANTIR BEFORE GTA6 GETS OPEN SOURCED.“, ~25 znakov/s, kurzor bliká); snímky skutočných stránok s jedným
  zvýraznením (YouTube „770k views 11 days ago“ žltým zvýrazňovačom, GitHub Trending s červeným rámikom a rozmazaným
  okolím, Product Hunt so štítkom „INVENTOR OF THE HASHTAG [#]“, príspevok Brendana Eicha so zvýraznenou vetou
  „Governments may get :mad: about it, don't care.“); čierny obraz, mém so zásahovou jednotkou a farebné pruhy s tónom
  1 kHz; otázky „[1]“, „[2]“ na 8,34 s; koncová karta „WATCH THE FULL VIDEO ON YOUTUBE“ s animovaným kurzorom na
  páči sa mi a Odoberať.
- Formát (merané): 27 záberov v páse, medián 2,07 s, najdlhší 8,34 s; `select='gt(scene,0.25)'` na celom obraze
  našiel len 7 zmien (čierne pásy a stály titulok zriedia skóre), na páse (`crop=1080:608:0:656`) 22; reč od 0,1 s,
  hlas pred obrazom (J-strih 0,27 s), ~165 slov/min, basový podklad, -20,8 LUFS, -5,8 dBTP; tvár 46 % času, dôkazy
  47 %; uloženia 4,2 % (návod je v dlhom videu, short je upútavka). Podrobne
  `../../youtube-shorts/references/anatomia-referencii.md` (V4).
- Overené 2026-10-17 na klone github.com/bilawalsidhu/gods-eye-view (commit 1df2a27, verzia 0.2.1), len čítanie,
  nič spustené: desktopová aplikácia s lokálnym Node serverom (CesiumJS 1.138.0, Apache-2.0; Vite; Node 24.14+),
  autori ju volajú „not a hardened production service“; hostovaná verzia „is coming“. Kód je MIT („Copyright (c) 2026
  Bilawal Sidhu“); GitHub API ukazuje NOASSERTION, lebo za textom MIT je poznámka o dátach tretích strán (TeleGeography
  CC BY-NC-SA, OSM ODbL, 3D modely, GIFy z README nie sú pod MIT). 57 394 hviezd. #1 na GitHub Trending platí
  (Star History: 27. 8. a 12. 9. 2026), „o týždeň stále“ len čiastočne (denný rebríček 28. 8. #4, 29. 8. #2, od 1. 9.
  bez záznamu); Product Hunt: hunter Chris Messina, Day Rank #8; príspevok Brendana Eicha sedí so záberom (overené cez
  api.fxtwitter.com, x.com vrátil 402). Podmienky pre nás: Google Photorealistic 3D Tiles nie sú dostupné pre projekty
  s fakturačnou adresou v EEA vytvorené po 8. 7. 2025 (developers.google.com/maps/comms/eea/map-tiles); obsah Google
  Earth a Earth Studio „may not be used for any commercial or promotional purposes“ (Google geo-guidelines); Cesium ion
  Community len „Personal and non-commercial use“.
- Čo nesedí: „website that shows you the whole planet live“ (lokálna aplikácia, doprava je simulovaná, pózy kamier
  odhad), „a week later it's still up there“ len čiastočne, „creator of Brave, Firefox“ je zjednodušenie (JavaScript
  vytvoril, Mozillu a Brave spoluzaložil), „spicy“ je rámovanie (nič sa nestalo). Preklepy v titulku sú na očiach 66 s.
  Dôkazy sú tu inak poctivejšie ako vo V1 až V3: snímky skutočných stránok, nie makety.
- Čo prešlo: do `../../youtube-shorts/` formát „stály titulok + pás 16:9“ na recykláciu vodorovného materiálu
  (`references/format-16x9.md`, `scripts/titulok_16x9.py`, `assets/sablona-16x9.ass`, `assets/format-16x9-priklad.json`,
  písmo `assets/pisma/BebasTitulky.ttf` s licenciou OFL); meranie strihov na páse cez `crop`; dôkaz zo snímky skutočnej
  stránky s jedným zvýraznením; short ako upútavka na dlhšie video cez Related video. Pre weby: Google Maps Embed
  a tlačidlo Navigovať ostávajú; „3D okolie“ prevádzky len vlastným videom cesty alebo MapLibre s budovami z OSM
  (`../../3d-modely-na-web/`), nie Google 3D.
- Čo nie: God's Eye View na weby prevádzok (lokálna aplikácia, Google 3D v EEA nedostupné, ťažké pre telefón),
  zábery z Google Earth, Google 3D alebo GEV s Google podkladom v propagačných shortoch, preklepy v stálom titulku,
  cudzie videá a tváre bez súhlasu, mém so zásahovou jednotkou, napodobnené tlačidlá páči sa mi a Odoberať, takmer
  stojaci záber 8,34 s, dĺžka 66 s, -20,8 LUFS.

## 12. ai.with.andrew: Agency Agents, „200 agentov ako agentúra“

- Adresa: https://www.tiktok.com/@ai.with.andrew/video/7697376652807965959 (76,72 s, titulky eng-US ASR, uverejnené
  2026-10-16, pri stiahnutí 52 000 pozretí, 2 832 páči sa, 213 komentárov, 873 zdieľaní a 3 876 uložení, pozreté 2026-10-19)
- Titulky: s týmto repozitárom postavíš „one person agency company with 200 agents“; volá sa Agency Agents, „155,000 stars
  and 25,000 forks“; knižnica viac ako 200 agentov, každý je špecialista „with its own personality, workflow, deliverables
  and way of measuring success“; „These aren't generic prompts“; zostava ako skutočná agentúra (inžinierstvo s frontend,
  backend, AI inžiniermi a recenzentmi kódu, dizajn, marketing, predaj, financie) a nad nimi „agents orchestrator“ ako
  vedúci prevádzky; desktopová aplikácia pre Mac, Windows a Linux nainštaluje agentov do Claude Code, Cursor, Codex alebo
  Gemini jedným klikom; zadarmo, MIT. Chyby prepisu: „cloud code“ = Claude Code, „Purser“ = Cursor, „agent's
  orchestrator“ = Agents Orchestrator. Výzva „comment agent“ ignorovaná.
- Obraz (snímky s časmi): 0 až 2,67 s hore skutočná stránka repozitára (agency-agents, Public, 19 Branches), dole
  hovoriaci, na švíku „200 ai agents“ a „ONE PERSON AGENCY“; 2,67 až 6,37 s kinetické písmo „ONE PERSON AI COMPANY“,
  „200+ AGENTS“; 6,4 až 16,9 s skutočný README (Quick Start, Option 2 Claude Code, Option 3 „Each agent file contains“,
  `install.sh --tool …`, tabuľky rolí); **17,7 až 31,7 s rozhranie Kimi** (karty s logom KIMI a menami Gannon, Dr. Li,
  KK, Judy, „Create Subagent · Arxiv Researcher“, „Agent Swarm“, „Kimi's Computer · Task Progress“, „OUTPUT FILES
  SUMMARY“) práve pri vete o osobnosti, postupe a výstupoch agentov; **31,7 až 54,5 s svetlé ukážky iných rozhraní**
  („Search Arena & What We're Learning About Human Preference“ je článok LMArena, hlasovanie „A surreal scene of a woman
  by the sea · A is better / B is better“, „Perfectly“, „Scholastic Primaries“; pôvod ostatných z obrazu neurčíme);
  57,5 až 65 s README (tabuľky, „Add a New Agent“); 65 až 69,2 s logá Claude, Cursor, OpenAI a Gemini 3 presne pri
  menách nástrojov; 71,5 až 74,6 s animácie terminálu („git add, git commit, git push“, „Notifying integrations… Slack,
  Datadog, Sentry, PagerDuty“). Desktopová aplikácia, o ktorej hovorí v 59,3 s, sa neukáže ani raz (v obraze je README).
- Formát (merané, `strihy.sh`, `ebur128`): 720×1280, HEVC, 30 fps; prah 0,25: 21 záberov, medián 2,30 s; prah 0,12:
  36 záberov, medián 1,82 s, prvá zmena 2,67 s, najdlhší záber 10,1 s (animácia Kimi s pohybom vnútri); hovoriaci na
  celú obrazovku ~11 % času, zábery mimo Agency Agents ~48 %; 223 slov, 175 slov/min; hudba „Million Dolla Hip Hop“
  (Brentin Davis) pod rečou bez páuz; -12,1 LUFS; titulky po jednom slove, biele tučné so tieňom, na stred v ~77 % výšky;
  kontrast „These aren't generic prompts.“ v 27,9 s (36 %), vrchol „sitting on top of all of them“ v 51,2 s (67 %);
  výzva v posledných 2,3 s. Podrobne `../../youtube-shorts/references/anatomia-referencii.md` (V5).
- Overené 2026-10-19 na klone github.com/msitarzewski/agency-agents (commit 652b269 z 2026-10-15, MIT, `LICENSE`:
  „Copyright (c) 2025 AgentLand Contributors“; správca Michael Sitarzewski), len čítanie, nič spustené: **282 agentov
  v 18 divíziách** (engineering 65, specialized 59, marketing 37, design 10, sales 9, finance 5 …; README sám „230+“,
  `README.md:729`); hviezdy 161,3k, forky 26,1k, 774 commitov (stránka repozitára), 100 prispievateľov (shields.io).
  Formát agenta: frontmatter `name`, `description`, `color` povinné, sekcie Identity & Memory, Core Mission, Critical
  Rules, Technical Deliverables, Workflow Process, Communication Style, Learning & Memory, Success Metrics
  (`CONTRIBUTING.md:87-162`); metriky má 244, výstupy 218, postup 239 z 282. Orchestrátor (`specialized/agents-orchestrator.md`)
  riadi len vývoj „PM → ArchitectUX → [Dev ↔ QA Loop] → Integration“ (`:22`), najviac 3 pokusy na úlohu (`:44`), ale
  „without manual intervention“ (`:36`) a po 3 zlyhaniach „continue pipeline“ (`:161-162`). Inštalácia do Claude Code:
  kópia `.md` do `~/.claude/agents/` (`install.sh:862-875`); 265 z 282 nemá `tools`, teda podľa dokumentácie Claude Code
  dedí všetky nástroje. Aplikácia github.com/msitarzewski/agency-agents-app (MIT, Tauri, v0.3.2): podľa README zapisuje
  `~/.claude/agents/*.md`, bez telemetrie, Windows inštalátor nepodpísaný. Zábery 17,7 až 31,7 s sú Kimi Agent Swarm
  (Moonshot AI, kimi.com/help/agent/agent-swarm), článok „Search Arena…“ je z news.lmarena.ai.
- Čo nesedí: „200+“ (282); „každý“ agent s metrikami a výstupmi (väčšina, nie všetci); „These aren't generic prompts“
  (sú to prompty v Markdowne a ich metriky sú často bez zdroja, napr. Instagram „Engagement Rate: 3.5%+“, „200+ branded
  posts per month“, `marketing-instagram-curator.md:83-91`; IGTV v pláne, hoci aplikáciu Instagram ukončil v roku 2022);
  orchestrátor nie je „operations head“ nad marketingom a predajom, je to postup vývoja softvéru a volá agentov
  menami, ktoré nesedia s ich `name` („ArchitectUX“ proti „UX Architect“); Reality Checker spúšťa
  `./qa-playwright-capture.sh`, ktorý v repozitári nie je; takmer polovica videa ukazuje iné produkty; aplikácia sa
  neukáže. Čísla hviezd a forkov v čase uverejnenia sedia s rezervou (dnes viac).
- Čo prešlo: do `../../tim-roly/` karta roly (poslanie, vstupy, pravidlá, postup, výstup a schéma, kontrola výstupu,
  výsledok z údajov majiteľa, hranice, eskalácia; bez osobnosti a pamäte), odovzdávací blok (`handoff-templates.md:7-47`),
  eskalácia po troch kolách ako otázka D1 so štyrmi možnosťami (`:148-205`, rozhoduje majiteľ, nie agent), pravidlá
  dôkazu QA (podozrivé „zero issues“, nula nálezov len s rozsahom, snímka formulára nie je dôkaz odoslania) a tri roly
  pre prevádzky: textár a obsah, ponuka a rezervácie („nepropaguj, čo nevieš splniť“, „najprv over, potom škáluj“,
  „meraj rezervácie“), recenzie a sťažnosti (HEARD bez osobných údajov, žiadne selektívne žiadosti o recenzie); schémy
  `NAVRH_OBSAHU`, `AUDIT_CESTY`, `NAVRH_ODPOVEDE`, `ESKALACIA` v `../../tim-roly/assets/schemy-obsah-predaj.json`
  (kontrola `../../tim-roly/scripts/kontrola_schem.py`: štruktúra OK, 4 platné vzory prešli, 8 neplatných odmietnutých).
  Rozbor repozitára: `../../tim-roly/references/agency-agents.md`. Do `../../workflowy/`: jedno meno roly všade,
  nástroje vymenovať. Do `../../youtube-shorts/`: zábery iného produktu ako ilustrácia = nie; logo nástroja presne pri
  jeho mene áno.
- Čo nie: inštalácia 282 agentov skriptom alebo aplikáciou (všetky projekty, všetky nástroje, automatický výber podľa
  opisov), osobnosti a cieľové metriky bez zdroja, autonómny orchestrátor a agent ako schvaľovateľ (Brand Guardian,
  „Decision maker: Agents Orchestrator / Studio Producer“), Carousel Growth Engine („Zero Confirmation“, denné
  uverejňovanie), B2B predaj a automatické rozosielanie, žiadosť o recenziu len od spokojných
  (`hospitality-guest-services.md:375`). Vo videu: cudzie produkty ako ilustrácia, titulky pod bezpečnou zónou YouTube,
  -12,1 LUFS, výzva „comment“.

## 13. nateherkai: „Unethical GitHub projects“ (formát upútavky s výzvou do DM)

- Adresa: https://www.tiktok.com/@nateherkai/video/7697652685377522958 (36,20 s, titulky eng-US ASR, uverejnené
  2026-10-17, 161 000 pozretí, 15 700 páči sa, 11 999 uložení a 846 komentárov pri stiahnutí 38,7 h po uverejnení,
  pozreté 2026-10-19)
- Popis autora: „Go to my Instagram, DM me ‘UNETHICAL’ and I’ll send it over. Link’s in bio.“ (výzva ignorovaná;
  v bio TikToku je len text „IG 👉🏼 @nateherkai“, klikateľný odkaz nie).
- Titulky (po slovensky): projekty na GitHube, ktoré „zmenia život“; „prosím, nepoužívajte ich“; ak chceš svoje
  predplatené nástroje zadarmo a je ti jedno ako, počúvaj; vývojári robia nástroje, ktoré úplne ignorujú, ako
  chcú firmy, aby si ich produkty používal; jedna kategória sťahuje videá z platforiem, ktoré všetko držia
  v aplikácii; druhá sa snaží obísť modely predplatného softvéru; „a je to ešte horšie“: celé open source projekty
  na prístup k filmom, seriálom a obsahu z mnohých streamovacích platforiem na jednom mieste; nič z toho nie je
  na súkromnom fóre, kód aj profily vývojárov sú verejné, niektoré projekty sú pripnuté na ich profiloch.
  Chyby prepisu: „Gighub“ a „gethub“ = GitHub, „private form“ = forum (v obraze „forum“, 27,5 s).
- Obraz: delená obrazovka (hore b-roll, dole moderátor), tvár zblízka a b-roll na celú obrazovku sa striedajú;
  karty predplatného AI („Monthly prices · USD · Oct 2026“), rozhranie „Explore AI Models“ so štítkom „FREE“ pri
  platených modeloch, ilustračné okno so sťahovaním súborov, stránka firemných pravidiel prečiarknutá červenou,
  scéna z filmu a seriál na obrazovkách, logá streamovacích služieb, skutočné profily dvoch vývojárov (pri jednom
  e-mail) a ich pripnuté repozitáre. **Názvy nástrojov a repozitárov z obrazu zámerne neuvádzame.** Veľká časť
  b-rollu s vetou nesúvisí (priečinok „Olympic Launch P&L“, okná ERP, dokumentácia s tabuľkami).
- Formát (merané): 25 záberov pri prahu 0,12 (23 pri 0,25), medián 1,35 s, prvá zmena 1,08 s, 39,8 strihu za
  minútu; delená obrazovka 45 % času, tvár zblízka 28 %, b-roll na celú obrazovku 27 %; titulok na švíku
  (y 851 až 898, švík y ≈ 879), pri tvári y 1070 až 1115, výzva y 1283 až 1345 (pod hranicou YouTube 1248);
  titulok na všetkých snímkach po 0,25 s, ~70 titulkov po 1 až 3 slovách, farby s významom (červená zákaz,
  zelená zadarmo, tyrkysová pätková pointa); 156 slov = 258 slov za minútu, žiadna pauza nad 0,12 s pri -35 dB;
  -20,6 LUFS, špička -3,3 dBTP; hook v troch taktoch do 6,8 s (štítok „UNETHICAL“, „PLEASE DON'T USE THESE“,
  „if you want … for free … then listen in“); druhý hook „And somehow it gets even worse“ v 18,2 s (50 %);
  výzva 33,0 až 36,2 s v inom oblečení a pred inou stenou, to isté slovo ako na začiatku. Podrobne
  `../../youtube-shorts/references/anatomia-referencii.md` (V6).
- Overené 2026-10-19 (len kategórie, žiadny konkrétny nástroj sme neotvárali ani nehľadali):
  - Video nič nepomenuje; celý obsah (zoznam) je za výzvou v DM na Instagrame. Akým nástrojom autor odpovedá,
    nevieme. Mechanizmus Instagramu: profesionálny účet, správa diváka otvorí okno 24 h, nástroj dostane webhook
    `messages` a odpovie; pri komentári jedna súkromná odpoveď do 7 dní (developers.facebook.com). ManyChat sa
    opisuje ako „official Meta Business Partner“ s „keyword triggers“ v DM aj komentároch (manychat.com,
    2026-07-31). YouTube súkromné správy zrušil 18. 9. 2019 (Engadget 2019-08-20) a dnes ich má obmedzene ako „Video
    sharing & messaging“: vybrané krajiny vrátane Slovenska, od 18 rokov, prihlásený kanál, konverzácia až po
    pozvánke, ktorú druhá strana povolí (odkaz platí 7 dní; support.google.com/youtube/answer/16650958, 2026-10-19).
  - „Verejné na GitHube“ neznamená legálne: GitHub pri oznámeniach „exercises little discretion in the
    process“ (DMCA Takedown Policy) a jeho pravidlá zakazujú zdieľať „software for bypassing checks for product
    licensing keys, including extension of a free license beyond its trial period“ (Acceptable Use Policies, časť 3).
  - YouTube zakazuje obsah „that shows viewers how to get unauthorized access to content, software, or services
    that usually require payment“ (Harmful or dangerous content, „Bypassing payment for digital content or
    services“, support.google.com/youtube/answer/2801964).
  - Repozitáre, ktoré sa vydávali za cracknutý softvér zadarmo, šírili infostealer RisePro (G Data podľa CSO
    Online 2024-03-18); v kampani z júla 2026 sa 292 falošných repozitárov vydávalo za známy softvér vrátane
    „cheat“ nástrojov (Arctic Wolf podľa Help Net Security 2026-07-15).
  - Právo (SK a EÚ) v `stahovanie-a-pravo.md`: autorský zákon § 19, § 42, § 51c, § 60, Trestný zákon § 283,
    SD EÚ C-435/12.
- Prečo tieto kategórie nepoužívame (ani na prácu, ani v prevádzkach):

  | Kategória z videa | Autorské právo a zákon | Podmienky služieb | Ďalšie riziko pre nás |
  | --- | --- | --- | --- |
  | sťahovanie videí z platforiem | stiahnutie = rozmnoženina (§ 19 ods. 4 písm. d); súkromná kópia len pre fyzickú osobu bez obchodného účelu (§ 42); zverejnenie cudzieho videa bez súhlasu je zásah, pri počítačovom systéme až 2 roky (TZ § 283 ods. 2 písm. d) | YouTube bod 1 (download len „as expressly authorized“), TikTok 4.5, Meta (len API) | Content ID a nároky na kanáli prevádzky; preto len rozbor podľa `stahovanie-a-pravo.md` |
  | obchádzanie predplatného softvéru (cracky, generátory kľúčov, predĺženie skúšobnej verzie, neoficiálny „bezplatný“ prístup k plateným AI) | obchádzanie technologického opatrenia či kontrolného mechanizmu (§ 60 ods. 1 a 3), porušenie licencie, TZ § 283 | GitHub zakazuje nástroje na obchádzanie kontroly licenčných kľúčov; podmienky poskytovateľa softvéru | malvér a krádež hesiel (prípady vyššie); cez neoficiálnu bránu by odchádzali texty a údaje klientov neznámemu serveru; strata účtu |
  | zoskupené streamovanie filmov a seriálov | sprístupnenie diel bez licencie; kópia z nelegálneho zdroja nie je súkromná kópia (SD EÚ C-435/12); obchádzanie DRM (§ 60) | podmienky streamovacích služieb | v prevádzke je pustený film či seriál verejné vykonanie (§ 26 ods. 2) a aj legálne domáce predplatné je „personal, non-commercial use only“ (Netflix 1.4, 1.8(i)) |

- Čo prešlo: zásada sťahovania referencií `stahovanie-a-pravo.md` (poradie ciest: súbor uložený v aplikácii,
  pozeranie, nástroj až tretí; YouTube nesťahujeme; červené čiary: prihlásenie, neverejný obsah, DRM, geoblokovanie,
  hromadne, stop pri prvom odmietnutí; po rozbore zmazať video), skript `../scripts/vycisti_info.py` (cookies relácie
  a podpísané adresy z `video.info.json`, ktoré yt-dlp pri TikToku zapisuje napriek `--clean-info-json`). Pre Shorts
  (`../../youtube-shorts/`): hook v troch taktoch s pravdivým obsahom, slučka slova (slovo z prvého titulku sa vráti
  vo výzve), výzva ako modul nahraný raz za sezónu, delená obrazovka so skutočným záberom práce a titulkom na švíku,
  striedanie rozložení, ktoré skryje strih v reči, farba titulku s významom; mechanizmus výziev „napíš slovo“ do
  `../../youtube-shorts/references/youtube-fakty.md` a `../../instagram-salon/references/pravne-hranice.md`.
- Čo nie: výzva „napíš mi slovo do DM“ a automatické odpovede (naše pravidlo; na YouTube správy len po pozvánke), video, ktoré
  obsah schová za výzvu, ilustračný b-roll bez vzťahu k vete, skutočné osoby a ich profily či e-maily v obraze,
  258 slov za minútu, -20,6 LUFS, titulok výzvy pod 1248 px, „neetické“ a „zadarmo, aj keď nevieš ako“ ako hook.
  Do toolboxu nejdú názvy ani odkazy na nástroje na pirátstvo či obchádzanie predplatného.

## 14. marcinteodoru: „0x Alpha“, fáma o modeli pred snímkou obrazovky

- Adresa: https://www.tiktok.com/@marcinteodoru/video/7676998208815516958 (27,93 s, titulky eng-US ASR, uverejnené
  2026-08-22 23:14 UTC, 202 000 pozretí a 4 922 uložení pri stiahnutí 2026-10-19)
- Titulky: „What the hell is going on?“; nový model, o ktorom nikto nevie, kto ho vytvoril, „is absolutely crushing“;
  je na OpenRouteri, práve sa objavil; „It's called 0 x Alpha. It's a 2.6 trillion model“; „supposedly doing really
  well against fable 5 and GTP 5.6 soul“; „Has anybody tried it?“ (výzva na komentár, ignorovaná). Chyby prepisu
  (overené v obraze): „0 x Alpha“ = Ox Alpha (`ox-alpha`), „GTP 5.6 soul“ = GPT-5.6 Sol, „open router“ = OpenRouter.
- Obraz: jeden záber bez strihu, efekt green screen (#greenscreen). Za autorom nehybná snímka príspevku Coin Bureau
  na X („BREAKING: A mysterious new AI model called “Ox Alpha” is reportedly BEATING Claude Fable 5 and GPT-5.6 Sol
  at coding, and nobody knows who built it.“, „1 million-token context window, multimodal capabilities, and no
  disclosed owner“), graf „AUG 21 / 9.2T total“ s riadkom „ox-alpha 2.6T“; 0,0 až 4,47 s šikmý červený štítok
  „Fable 5 killer?“. Titulky do obrazu nie sú.
- Formát (merané): 0 strihov, jediná zmena obrazu v 4,50 s (zmizne štítok), 23,4 s bez zmeny; prvé slovo 0,34 s,
  63 slov, 137 slov/min, 7 páuz 0,32 až 0,70 s medzi vetami, -18,3 LUFS; štítok zasahuje 124 px do horného pásu
  YouTube. Podrobne `../../youtube-shorts/references/anatomia-referencii.md` (V7).
- Overené 2026-10-19 (primárne zdroje a médiá s dátumom): Ox Alpha existoval ako anonymný `stealth/ox-alpha` na
  OpenRouteri od 20. 8. 2026, zadarmo (Decrypt a Crypto Briefing, 2026-08-24); dnes v zozname modelov OpenRouteru
  nie je a `api/v1/models/stealth/ox-alpha/endpoints` vracia 0 poskytovateľov (stránka modelu podľa klienta
  404 alebo prázdna). 26. 8. Z.ai potvrdila Bloombergu, že ide o model série GLM (The Next Web, 2026-08-26;
  The Batch, 2026-09-04); dnes `z-ai/glm-5.3-flash` na OpenRouteri (created 2026-08-26) a `zai-org/GLM-5.3-Flash`
  na Hugging Face, „License: mit“, „320B total parameters and just 18B active“. Priame vyhlásenie Z.ai so slovami
  „Ox Alpha“ sme nenašli. „2.6 trillion“ je omyl: graf za autorom ukazuje tokeny spracované za deň (riadky dávajú
  súčet 9,31 T pri „9.2T total“; OpenRouter radí modely podľa spracovaných tokenov). Porovnanie s Fable 5 a GPT-5.6
  Sol je z 10 úloh DeepSWE jedného vývojára (Ben Davis, 21. 8.: 80 / 65 / 52 %, s vlastnou výhradou o rozptyle;
  Decrypt). Na celom DeepSWE (113 úloh, deepswe.datacurve.ai, 2026-09-22): glm-5.3-flash 63 % ±4 %, claude-fable-5
  70 % ±3 %, gpt-5.6-sol 73 % ±3 %. „Crushing“ platí pre spotrebu tokenov (týždeň do 23. 8.: 11,60 bilióna, delené
  prvé miesto, DoNews 2026-08-25).
- Čo nesedí: parametre (2,6 bilióna proti 320 miliardám), „beating“ (na celom teste je pod oboma), „nobody knows“
  (o 4 dni neplatí, video nemá dátum ani opravu), „supposedly“ bez mena toho, kto tvrdí; popis mieša Claude Code
  (nástroj) a Claude Fable 5 (model). Neistota: či je zverejnený GLM-5.3-Flash totožný s ukážkou Ox Alpha, nevieme;
  plné behy ukážky (~63 %, Decrypt) a výsledok zverejneného modelu (63 %) sa zhodujú.
- Čo prešlo: pravidlá pre novinky a fámy v shortoch (`../../youtube-shorts/SKILL.md`, časť „Novinky, fámy a čísla
  zo snímok“): overiť pred tvrdením, číslo len s jednotkou zo zdroja, kto to tvrdí a na čom, štítok
  „NEPOTVRDENÉ · stav k …“, bez superlatívu a porovnania z fámy ani s otáznikom, dátum stavu a oprava po zmene.
  Kontrola scenára `../../youtube-shorts/scripts/tvrdenia.py` (stavy overené, pripísané, nepotvrdené, nepravdivé,
  názor; čísla proti citátu a jednotke; príklady v `assets/tvrdenia/`: V7 ako ho povedal autor 12 chýb, správna verzia
  0, test prevádzky 5, textový režim 3); štítky hore v `short.py` (pole `titulky.stitky`, v bezpečnej zóne, overené na
  skúšobnom zábere: kontrola 11 z 11, synchronizácia +2,7 ms). Formát „rýchla správa pred snímkou“ pre oznamy
  prevádzky pred vlastnou stránkou (`../../youtube-shorts/references/sablony.md`, časť 5), so zmenou obrazu každé
  2 až 3 s a titulkami po celý čas. Zdroje na overovanie modelov v `toolbox/ZDROJE.md`.
- Čo nie: cudzí príspevok ako pozadie (cudzí obsah s menom a profilovou fotkou iného; prevádzka má vlastné stránky),
  požičané meno v hooku („Fable 5 killer?“), otázka s tvrdením, výzva otázkou do komentárov, 23 s bez zmeny obrazu,
  hlasitosť -18 LUFS. Novinky o AI na kanáloch prevádzok nerobíme (HEAD SPA 30, `CLAUDE.md`: žiadna zmienka o AI).

## 15. martin.gocik: TRELLIS.2, „3D model z jednej fotky“ (Instagram)

- Adresa: https://www.instagram.com/reel/Den8Ak5DNou/ (48,19 s, po slovensky, uverejnené 2026-10-18 05:31 UTC,
  3 203 páči sa a 37 komentárov pri stiahnutí 2026-10-19; pozretia Instagram nedáva). Ten istý autor ako záznam 8.
- Popis autora: „Microsoft dal zadarmo na GitHub AI, ktorá z jednej fotky spraví 3D model aj s textúrami“,
  TRELLIS.2, „open source pod licenciou MIT“, na vlastnom počítači treba grafiku s 24 GB, demo na Hugging Face v prehliadači.
- Reč (z titulkov v obraze, Instagram titulky nemá; snímky po 0,25 s a pás titulkov po 0,1 s): Microsoft spravil AI,
  ktorá z jednej fotky vytvorí 3D model, a dal ju zadarmo na GitHub; v podstate 3D modelár, ktorému stačí jeden obrázok;
  hotový 3D objekt aj s textúrami; kov, drsnosť, priehľadnosť; tvary, „na ktorých iné generátory padajú a nefungujú“
  (oblečenie, listy, duté vnútro); „Najlepšie na tom je“ MIT a jedenásť tisíc hviezd; pozor na 24 GB; demo na Hugging
  Face; „Namiesto modelovania v grafickom programe ti stačí jedna fotka.“ Výzva „Daj mi follow“ ignorovaná.
- Obraz: šablóna V1 (delená obrazovka, pilulka na švíku). Ukážky katapultu a prilby z projektovej stránky (vstup
  vedľa otáčajúceho sa výsledku), repozitár s odznakom hviezd 11 509, README s rámikmi („Base Color, Roughness,
  Metallic, and Opacity“, „Open Surfaces“, „An NVIDIA GPU with at least 24GB of memory is necessary“), počítadlá
  0+ → 11 000+ a 0 → 24 GB, Space „Running on ZERO“, karta „Modelovanie v programe“ preškrtnutá → „Stačí jedna fotka“.
- Formát (merané): 21 záberov, medián 2,10 s, pohyb od 0,0 s, prvý strih 3,50 s, 135 slov, 169 slov/min, -14,2 LUFS,
  -0,9 dBTP, druhý hook v 25,75 s (53 %), pilulka na oku v 6,05 s, titulky pri tvári a kartách pod 1248 px.
  Podrobne `../../youtube-shorts/references/anatomia-referencii.md` (V8).
- Overené 2026-10-19 (klon github.com/microsoft/TRELLIS.2, commit 75fbf01, len čítanie, nič nespustené; Hugging Face;
  arXiv 2512.14692; licencie závislostí; tri ukážkové GLB zmerané): kód a váhy MIT, 4 miliardy parametrov, jeden
  obrázok na vstupe, PBR (farba, kov, drsnosť, priehľadnosť; export `OPAQUE`), Linux a NVIDIA 24 GB+ (README,
  riadky 59 a 60), `setup.sh` má aj AMD ROCm. Export GLB s textúrami volá **nvdiffrast** (`o_voxel/postprocess.py`,
  riadky 10 a 230 až 249), ktorý je len na výskum alebo hodnotenie; predvolené odstránenie pozadia je **RMBG-2.0**
  (CC BY-NC 4.0); povinný **DINOv3** má vlastnú licenciu (schvaľuje Meta). Issue #22 o komerčnom použití je otvorené,
  otázka o exporte GLB bez odpovede. Demo (ZeroGPU, kvóta 2/5/40 min denne) pošle obrázok bez priehľadného pozadia
  do Space `briaai/BRIA-RMBG-2.0`. Ukážky Microsoftu: 42 až 50 MB, ~0,95 milióna trojuholníkov, 2× textúra 4096²,
  bez normálovej mapy. Článok testuje na 100 obrázkoch vytvorených modelom NanoBanana, hodnotenie ľudí robili autori
  (~40 účastníkov); nezávislé porovnanie sme nenašli. Dnes 12.3k hviezd.
- Čo nesedí: „MIT, zadarmo“ (kľúčové závislosti nie sú MIT a komerčne nie), „iné generátory padajú“ (README hovorí
  o hraniciach iso-plôch), „z jednej fotky“ na čistých ukážkových obrázkoch, nie na fotke z telefónu, „stačí jedna
  fotka namiesto modelovania“ (výstup treba upraviť: veľkosť, topológia, vymyslené časti), počítadlá od nuly.
- Čo prešlo: nový skill `../../3d-modely-na-web/` (kedy 3D áno a kedy nie, licencie, súkromie, vymyslené detaily,
  rozpočet GLB pre telefón, postup fotka → GLB → web s three.js alebo model-viewer, cloudová GPU len ako opis)
  a skript `scripts/glb_info.py` (rozbor GLB a rozpočet, kód 0/1/2; pri zápise znova overený: tri ukážky Microsoftu
  a `topology.glb` kód 1, skúšobné GLB s PNG, JPEG a WebP kód 0, neznáme povinné rozšírenie kód 1, poškodený súbor
  kód 2). Pre Shorts: dôkaz „vstup → výsledok“ od prvej snímky, šablóna série, karta „staré → nové“ len pravdivo
  (`../../youtube-shorts/`). Pre čítanie reelov: `../scripts/snimky_text.py` (hárky s časom, zmeny v páse titulkov).
- Čo nie: 3D model na HEAD SPA 30 (`CLAUDE.md`: nič vymodelované, žiadna zmienka o AI), výstup TRELLIS.2 na
  komerčný web pred posúdením licencií, nahrávanie fotiek prevádzky alebo klientov do dema bez súhlasu majiteľa,
  produkty s cudzími značkami, model z fotky vydávaný za skutočný sken, inštalácia do repozitára webov, neoficiálne
  weby s kreditmi (trellis2.app vzťah k Microsoftu neuvádza).

## 16. thechriscordero: „$10,000 website“, Claude Code + Framer Motion + UI/UX Pro Max + 21st.dev

- Adresa: https://www.instagram.com/reel/DdJyA92DXGm/ (Instagram reel, Chris Cordero, 31,30 s, 1080×1920, 60 fps,
  uverejnené 2026-09-11 15:55 UTC, 5 049 páči sa mi a 7 728 komentárov pri stiahnutí 2026-10-19; pozretia
  Instagram nedal). Bez titulkov a bez prepisu reči: text sme čítali zo snímok po 0,25 a 0,1 s.
- Popis autora: štyri nástroje v termináli (Claude Code, Framer Motion, skill UI/UX Pro Max, jeden riadok
  z 21st.dev) a výsledok „looks like a $10,000 website built by a senior designer“. Výzva „Comment SETUP“
  (v popise aj na konci videa) ignorovaná.
- Titulky v obraze (doslovne, s časom): 0,3 s „This is a“ / 0,75 „$10,000“ / 1,5 „website“ / 2,0 „I built it with“ /
  2,7 „one line of code.“ / 3,4 až 5,8 karta „No developers“, „No designers“, „No experience“ / 6,0 „Step One“ /
  6,5 „Install Claude Code.“ / 7,5 „One line in“ / 8,0 „your terminal.“ / 8,4 „Done“ / 8,8 „Step Two“ / 9,4 „Plug in
  Framer Motion.“ / 10,5 „That's where the“ / 11,0 „smooth animations“ / 11,5 „come from“ / 12,0 „the kind agencies“ /
  12,8 „charge thousands for“ / 13,7 „Step Three“ / 14,3 „Drop in the“ / 14,7 „UI/UX Pro Max“ / 15,8 „skill“ /
  16,0 „Tell Claude Code“ / 16,7 „to install it“ / 17,3 „Now it thinks“ / 18,0 „like a senior“ / 18,3 „designer“ /
  18,9 „Step Four“ / 19,5 „Head to 21st.dev“ / 20,5 „Copy the line.“ / 21,3 „Paste it into“ / 21,8 „Claude Code.“ /
  22,3 „That's the moment“ / 23,0 „it builds the“ / 23,3 „full site.“ / 23,7 „Designed“ / 24,1 „Animated“ /
  24,6 „Production - ready“ / 25,3 „Agencies are still“ / 26,0 „charging five figures“ / 27,0 „for this exact“ /
  27,8 „build“ / 28,0 „You're doing it“ / 28,3 „from your terminal.“ / 29,0 „Comment "SETUP"“ / 29,8 „and I'll send“ /
  30,0 „you the full“ / 30,5 „step-by-step.“ (či titulky sedia s rečou, bez prepisu neoverené).
- Obraz: hore nahrávky webov (energetický nápoj „ZERO POINT“ s plechovkami Titan Burn, Nebula Berry, Plasma Shock;
  jedlo „luscious“; Nike Jordan s vodoznakom „@uiuxzaid“ a „© 2025 All rights reserved“; módny magazín „VANITY“,
  „BE YOUR OWN MUSE“; Pepsi „Get More With Pepsi“), dole autor v štúdiu. Dôkazy krokov v zaoblených kartách:
  stránka „Download Claude“ a príkazy inštalácie (7,6 s, PowerShell podfarbený žltou), terminál „Last login: Fri
  Mar 27 02:01:05“, `curl -fsSL https://claude.ai/install.sh | bash` (8,4 s); npm `framer-motion` „12.38.0 • Public •
  Published a month ago“, „Motion for React“, `npm install motion` (9,7 s); stránka „UI UX Pro Max Design
  Intelligence“ so „57 UI Styles, 95 Color Palettes, 56 Font Pairings, 8 Tech Stacks, 24 Chart Types, 29 Landing
  Patterns“ a `uipro init --ai windsurf` (14,6 s); Claude Code v2.1.81, „Sonnet 4.6 · Claude Pro“, „Install this skill
  https://github.com/nextlevelbuilder/…“ (16,0 až 17,0 s); `21st.dev/community/components` (19,5 s), tlačidlo „Copy
  prompt“ pri komponente „Background lights are cool you know.“ (20,8 s); v Claude Code „[Pasted text #1 +710 lines]“
  (21,6 s); terminál „Claude Code successfully installed! Version: 2.1.89“, „Native installation exists but
  ~/.local/bin is not in your PATH“ a potom `npm install motion` v `~` (28,1 až 28,7 s).
- Formát (merané): 25 záberov pri prahu 0,12, medián 1,07 s, 46 strihov za minútu, tvár ~34 % času, karty krokov
  0,6 až 0,9 s, ~230 slov za minútu (odhad z titulkov), -14,4 LUFS, špička +2,4 dBFS, druhý hook v 22,3 s (71 %).
  Podrobne `../../youtube-shorts/references/anatomia-referencii.md` (V9).
- Dátum nahrávok: Claude Code 2.1.89 vyšiel 2026-03-31, `framer-motion` 12.38.0 2026-03-17 a bol najnovší do
  12.39.0 (2026-05-18) (npm registry, `time`, 2026-10-19). Zábery obrazovky sú teda z obdobia od konca marca
  do mája 2026 (inštalácia 2.1.89 najskôr 31. 3., stránka npm „Published a month ago“ okolo polovice apríla),
  video vyšlo v septembri; vtedy už bol Motion 13 (2026-08-05), dnes 14.3.0 (2026-10-15).
- Overené 2026-10-19:
  - **Motion:** Framer Motion je od 2024-11-12 samostatný projekt Motion (motion.dev/blog); `motion` aj
    `framer-motion` 14.3.0, MIT, `react` a `react-dom` voliteľné, takže ide aj vo vanilla JS (`import { animate,
    inView } from "motion"`); Motion One zlúčený vo verzii 11.11.12 (motion.dev/docs/upgrade-guide); `animate`
    mini 3,2 kB, hybrid 22 kB, `inView` 0,5 kB, `scroll` 3,8 kB (motion.dev/docs). Platený doplnok Motion+
    (štruktúrované dáta stránky: 399 USD jednorazovo).
  - **UI/UX Pro Max:** github.com/nextlevelbuilder/ui-ux-pro-max-skill, MIT (Copyright (c) 2024 Next Level Builder),
    klon `--depth 1`, commit 56ea9cf (2026-10-15), `skill.json` 2.15.0: 79 štýlov, 192 paliet, 74 dvojíc písiem,
    119 UX zásad, 25 grafov, 22 stackov. Čísla vo videu (57/95/56/8/24/29) sú zo staršej verzie; CLI je dnes
    `ui-ux-pro-max-cli`, `uipro-cli` README označuje za zastaraný. **Máme ho**: v2.11.1 v
    `toolbox/skills-animacie/genjutsu/skills/_jutsu/ui-ux-pro-max/`. Skripty nesiahajú na sieť.
  - **21st.dev:** katalóg 12 000+ komponentov pre React a Tailwind (21st.dev/llms.txt); „jeden riadok“ je vo videu
    „Copy prompt“ so 710 riadkami, inak `npx shadcn@latest add "https://21st.dev/r/<autor>/<komponent>?api_key=…"`
    s API kľúčom. Licencia pri každom komponente zvlášť (MIT aj „unknown“); podmienky z 2026-07-20: obsah autorov
    a 21st Labs, dema patria 21st Labs, zákaz zberu, trénovania AI a šírenia. Cenník: zadarmo 2 kópie denne, Builder
    6 USD mesačne pri ročnej platbe, AI kredity od 15 USD. Magic MCP je dnes 21st MCP (API kľúč, generovanie za
    predplatné AI; klient `@21st-dev/magic` 0.2.3, ISC, commit 6b5299e). Komponent z videa je Aurora Background
    z Aceternity UI (demo text sedí; animuje `background-position` 60 s donekonečna; na 21st.dev kópia s „mit“,
    stránka Aceternity má v pätičke „All Rights Reserved“).
  - **Claude Code:** príkaz inštalácie zo záberu je oficiálny (code.claude.com/docs/en/setup); Claude Code
    potrebuje plán Pro, Max, Team, Enterprise alebo Console, bezplatný plán nestačí.
- Čo nesedí: „one line of code“ (štyri kroky, terminál, PATH, npm, 710-riadkový prompt, platený plán), „No developers,
  no designers, no experience“, „Done“ (na zábere hneď upozornenie na PATH), „thinks like a senior designer“ (naša
  skúška: pre spa ružová a fialová s Google Fonts cez `@import`, pre barbershop Liquid Glass s `backdrop-filter`
  a „Performance: Moderate-Poor“), „$10,000“ a „agencies charging five figures“ (bez zdroja). Ukázané weby vo videu
  nevznikajú: žiadny záznam stavby, Nike a Pepsi sú neoficiálne koncepty cudzích značiek, pri Nike vodoznak iného
  autora. „Production-ready“ bez merania. Zábery staré 4 až 5 mesiacov, verzie zastarané.
- Čo prešlo: `../../rychly-web/references/pohyb-bez-kniznice.md` a vzor `../../rychly-web/assets/pohyb/` (nástup
  pri skrole cez IntersectionObserver a Web Animations API, pružina cez `linear()`, rozostup, svetlo cez
  `transform` s pauzou mimo obrazovky, skrývanie len v `@media (scripting: enabled)` so zálohou v CSS; test v Chromiu
  28 z 28, pri zápise do toolboxu znova trikrát 28 z 28; meranie: svetlo cez `background-position` 428 až 1 049 ms
  hlavného vlákna a 308 až 360 prekreslení za 3 s, cez `transform` 9 až 28 ms a 0); tabuľka „čo robí Motion
  v Reacte a čo my bez knižnice“; postup prevzatia komponentu z 21st.dev (licencia, prečítať, prepísať, zmerať);
  `toolbox/skills-animacie/ui-ux-pro-max-u-nas.md` (verzie, spustenie bez pasce `-I`, skúška na našich weboch,
  čo z neho berieme). Pre Shorts: karty krokov, dôkaz v karte, trojica jednoslovných záverov, návrat k hooku
  (`../../youtube-shorts/references/anatomia-referencii.md`, časť V9).
- Čo nie: React, Tailwind a shadcn na jednostránkové statické weby, knižnice z CDN a `@latest`, vkladanie
  700-riadkových promptov z cudzích stránok do projektu, 21st MCP (účet, platby, React), inštalácia skillov príkazom
  „Install this skill <odkaz>“, palety a písma z generátora bez majiteľa, svetlo a vysúvanie na HEAD SPA 30
  (`CLAUDE.md`), Motion+. Vo videu: cenová kotva bez zdroja ako hook, cudzie a neoficiálne weby ako výsledok
  metódy, výzva na komentár za kľúčové slovo.

## 17. dazzzlme: „Editing 2 days when there's this“ (strih cez editor pripojený ku Claude)

- Adresa: https://www.instagram.com/reel/DcebVePOnGH/ (Instagram reel, 13,73 s, účet dazzzlme „Graphic Designer •
  Illustrator“, uverejnené 2026-08-25 19:50 UTC, 2 928 páči sa a 433 komentárov pri stiahnutí, pozreté 2026-10-19;
  yt-dlp dal 660×1172 VP9, bez titulkov)
- Popis autora: „Drop SHOP below to take the link #us #usa🇺🇸“ (výzva ignorovaná). Reč neprepisujeme (nástroj nie je);
  zvuk je súvislý (žiadne ticho nad 0,3 s pod -40 dB), -14,1 LUFS, LRA 3,1 LU.
- Obraz (snímky po 0,25 s, výrezy 3× s doostrením): 0 až 3,10 s zrkadlená selfie autorky s kapucňou, na notebooku
  časová os Shorty, text „Editing 2 days when there's this“; 3,10 až 4,00 s claude.ai v Safari (účet „aizat“, Free),
  karta „Shorty — AI video editor…“, text „1. Connect this video editor to Claude“; 4,00 až 5,23 s Connectors,
  „Add“ → „Browse connectors“, „Add custom connector“, na lište „Tue Aug 25 8:58 PM“; 5,23 až 6,20 s dialóg „Add
  custom connector“ s názvom „shorty“ a adresou „https://mcp.shortyedit.com/mcp“ (pri zápise znova prečítané
  výrezom v 5,8 s), v adrese prehliadača „…=add-custom-connector#settings/cu…“; 6,20 až 8,03 s „2. It can actually
  understand your videos“: Finder, 9 súborov .mov (IMG_2065.mov až IMG_8109.mov) pretiahnutých na „Drop your footage
  here / Release to add videos and images to this edit“; 8,03 až 9,47 s „3. Describe your idea“: prompt v claude.ai
  („Up late, aizat?“, Sonnet 5 Medium, Chat); 9,47 až 11,53 s „Let it cook🔥🔥“: Shorty („…ortyedit.com/?ff=live-assembly
  &assembly=…“), „Edit / san diego • Editing“, „Uploaded — close this whenever you like. The edit keeps running.“,
  Footage 2, Pipeline (Analyze brief + footage, Build the shot plan, Edit the timeline, Render the video), Shot plan
  10 riadkov so štítkami FLASH, CUT, WHIP, časová os V1, TXT, MUS, „Assembling the timeline…“, počítadlo 0:01:02 až
  0:12:26; 11,53 až 13,73 s výsledok: fotka predajne 7-Eleven v dvoch farebných verziách striedaná ostrými
  geometrickými maskami každých 0,10 až 0,43 s, text „Comment “SHOP” and I'll send you the link🔥“ (ignorované).
- Prompt (doslovne zo snímok 8,55 až 9,30 s; jedno písmeno trvalo zakrýva kurzor, najskôr „pacing“): „Recreate the
  reference video's editing exactly on my footage. Match the timing, beat cuts, rhythm, pa[c]ing, composition, and all
  transitions precisely. Use the same rapid geometric shape reveals (squares, rectangles, circles, etc.) to show the
  photos, exactly as in the reference.“
- Formát (merané `strihy.sh`): 8 scén pri prahu 0,25 (medián 1,95 s), prvý strih 3,10 s, záver 2,2 s s 11 zmenami
  (prah 0,12); kroky číslované 1 až 3, každý jeden záber a jeden riadok textu hore (16 až 23 % výšky, tesne pod
  hornou hranicou zóny YouTube), výsledok až v posledných 2,2 s. Podrobne
  `../../youtube-shorts/references/anatomia-referencii.md` (V10).
- Overené 2026-10-19: Shorty (shortyedit.com, Tools Products FZ-LLC, právo SAE, súdy v Dubaji) je webový AI strihač
  „reference-driven“: referencia voliteľná (analýza ide do Google Gemini, výstup „StyleSpec“), do 150 klipov a 8 GB,
  MP4 9:16 až 21:9. MCP server `https://mcp.shortyedit.com/mcp`: bez prihlásenia HTTP 401 „Missing bearer token.
  Connect via OAuth, or pass your shorty API key…“, OAuth s dynamickou registráciou, rozsahy `mcp openid email`;
  zoznam nástrojov bez účtu nevidno (účet sme nezakladali). Ceny od 19 $ mesačne (4 400 kreditov, podľa stránky ~21
  strihov), bezplatný plán stránka neuvádza. Súkromie (účinné od 10. 10. 2026): úložisko Supabase, spracovanie aj
  v SAE, USA a EÚ, AI poskytovatelia „including“ Google Gemini a Anthropic. Podmienky (od 14. 10. 2026): hudbu ani
  referencie nelicencuje, zvuk referencie môže použiť vo výstupe, za práva zodpovedá používateľ. Claude: vlastný
  konektor (remote MCP) má aj plán Free, najviac jeden; „Malicious MCP servers may include hidden instructions…“
  (support.claude.com, článok 11175166). Nezávislú recenziu Shorty sme nenašli.
- Čo nesedí: „It can actually understand your videos“ obraz nedokazuje (len pretiahnutie súborov); prompt je napísaný,
  ale neodoslaný a bez priloženej referencie; v kroku 2 ide 9 súborov .mov, v kroku „Let it cook“ má projekt 2 zábery
  (fotky predajne, vo Finderi „7 eleven.jpeg“ zo včera) a plán záberov („hands on the counter“, „reaction — the laugh
  land…“) k dvom fotkám nesedí: zostrih rôznych relácií, nie jeden beh. „Editing 2 days“ je nadsádzka bez merania.
  Podmienky a zásady Shorty, ktoré sme čítali, sú novšie ako video.
- Čo prešlo: `../../youtube-shorts/scripts/strih_podla_referencie.py` a časť „Strih podľa referencie“ v
  `../../youtube-shorts/SKILL.md` s podrobnosťami v `../../youtube-shorts/references/strih-podla-referencie.md`
  (z referencie len časy strihov; prichytenie na doby vlastnej hudby; zlúčenie a delenie záberov; prechody bez posunu
  strihov; hárok párov; `--porovnaj`); overené na V2 a V10 s klipmi GYM KLUB, pri zápise do toolboxu znova z jeho
  umiestnenia (V2 0 až 18 s: 9 z 9 tvrdých strihov presne, short.py 11 z 11; V10 s dvoma prechodmi: 8 z 8, 412
  snímok = 13,73 s). Porovnanie Shorty, Descript MCP (Agent Underlord) a nášho postupu tamže. Do `../../tim-roly/`
  (rola bezpečnosť): vlastný konektor je cudzí server. Formát „problém, 3 číslované kroky, výsledok“ s krokom
  v jednom riadku hore sa hodí na „rezervácia online v 3 krokoch“ (skutočný záznam obrazovky telefónu, nie notebook
  natočený mobilom: text rozhrania bol pri 660 px čitateľný len s 3× výrezom).
- Čo nie: Shorty a iné cudzie konektory na klientske zábery bez súhlasu majiteľa (firma mimo EÚ, ďalší AI poskytovatelia,
  zvuk referencie vo výstupe = riziko Content ID); „recreate exactly“ cudzie video (obraz, hudba, texty); série po
  0,1 s (proti receptu, pri HEAD SPA nikdy); reakcia tváre ako hook; výsledok až na konci; výzva „comment“.

## 18. doughwealth: „päť webov, ktoré nahradia viac aplikácií“ (Instagram karusel)

- Adresa: https://www.instagram.com/p/DemVHnSHK6A/ (autor Dough, 17. 10. 2026, karusel obrázkov, nie video).
- Popis autora: Learn-Anything (cesta učenia k téme), Delphi (zbierka online nástrojov), ViralityAI (nápady a trendy
  pre tvorcov), Poe (viac AI modelov na jednom mieste), Turbo (z textu audio ako podcast).
- Obraz: yt-dlp pri karuseli obrázkov nič nestiahne („No video formats found“) a vloženú stránku `/embed/captioned/`
  Instagram vrátil bez obrázkov príspevku. Snímky sme nevideli; ktorý web je ktorý, je odvodené z popisu.
- Overenie 2026-10-19 (podrobne v `toolbox/ZDROJE.md`, časť „Webové nástroje z karuselu doughwealth“): delphi.tools
  je zadarmo a beží v prehliadači (0BSD); ViralityAI si v podmienkach berie trvalú licenciu na obsah vrátane obrazu,
  mena a hlasu; Poe si v zásadách súkromia odporuje pri tréningu; Turbo dovoľuje výstup len osobne a nekomerčne;
  Learn-Anything je katalóg odkazov bez podmienok a bez verejného kódu.
- Čo prešlo: delphi.tools do praxe (GPS z fotiek, QR, prvý návrh titulkov), ViralityAI len na nápady z účtu majiteľa,
  Poe voliteľne na porovnanie hookov; pravidlá pre všetkých päť v `ZDROJE.md`.
- Čo nie: audio z Turbo do shortov (licencia), nahrávanie vlastných videí do ViralityAI (licencia na obraz a hlas),
  údaje klientov do ktorejkoľvek služby, zakladanie účtov za majiteľa.
- Lekcia: pri karuseli obrázkov pýtať od majiteľa snímky obrazovky; popis príspevku nestačí na istotu, o ktorý web ide.

## 19. sadie.ontech: „5 must-have Claude plugins“ (brána k cudzím modelom, Superpowers, Caveman, Claude Code Setup, Claude Security)

- Adresa: https://www.tiktok.com/@sadie.ontech/video/7697561993997225249 (67,48 s, 1080×1920, HEVC, titulky eng-US ASR,
  uverejnené 2026-10-17 09:11 UTC, 20 900 pozretí, 811 páči sa, 54 komentárov, 290 zdieľaní a 1 090 uložení pri
  stiahnutí 2026-10-20 11:05 UTC, pozreté 2026-10-20). Ten istý účet ako záznam 9.
- Popis autora: „Claude just got supercharged with five must-have plugins for unlimited AI coding power and security.
  See how [brána k cudzím modelom – názov vynechaný], Superpowers, Caveman, Claude Code Setup, and Claude Security boost efficiency, cut token use, and
  protect your projects.“ Výzvy „Comment PLUGINS to get the links“ a „Save this free tool and follow“ ignorované.
- Titulky (po slovensky): päť pluginov, ktoré „treba nainštalovať do Claude“. (1) brána k cudzím modelom (názov vynechávame, pozri zapis-referencie.md) dá Claude Code „takmer
  neobmedzené používanie“ pripojením k vyše 300 poskytovateľom API; keď dôjde limit, prepne na „ďalší najlepší model“,
  „až 1,6 miliardy tokenov zadarmo každý mesiac“. (2) Superpowers spraví z jedného agenta „celý vývojový tím“:
  brainstorming, plán, testy a revízia vlastného kódu skôr, ako ho uvidíš. (3) Caveman: Claude hovorí ako jaskynný
  človek, bez výplňových slov a zdvorilostí, „presne ten istý kód“ pri „oveľa menej“ spálených tokenoch. (4) Claude Code
  Setup, „oficiálny plugin Anthropicu“, preskenuje celý kód a odporučí hooky, skills, subagentov a MCP servery.
  (5) Claude Security, „oficiálny bezpečnostný skener Anthropicu“, prehľadá kód, nájde zraniteľnosti a „opraví diery“
  skôr, ako má hacker šancu. Chyby prepisu: „omniroot“ = názov brány (karta v 3,8 s), „300 A. I A. P. I. Providers“ =
  „300 AI API providers“, „gets a chance to comment. Plugins to get the links“ = „… a chance. Comment PLUGINS to get the
  links“ (titulok „comment“ v 62,1 s).
- Obraz (hárok po 1 s, snímky v detaile): 0 až 1,80 s hore pixelová tabuľa „NOW SHOWING“, v ktorej sa vypíše „FABLE“,
  dole moderátor, na švíku štítok „5 MUST-HAVE CLAUDE PLUGINS“; 1,80 až 3,83 s tmavý ilustračný záber človeka pri
  monitore; karty „#1 (brána)“ až „#5 Claude Security“ na modrom pozadí v 3,83 / 19,33 / 31,53 / 41,70 / 52,17 s.
  **Brána k cudzím modelom** (5,30 až 19,33 s): snímky rozhrania Claude („Analyzing your request“, zoznam úloh), web projektu
  („90+ free“, „FREE Claude / GPT / Gemini“, „290 providers“, „15–95% tokens“), schéma „Your IDE / CLI → brána“
  so „Smart Router“ a úrovňami Subscription, API key, Cheap, Free, panel „~1.53B FREE TOKENS / MONTH · STEADY“ a „up to
  ~2.15B … signup credits“ pod titulkom „1.6 billion“, zoznam bezplatných modelov (Mistral Large 3, Llama 3.3 70B,
  Llama 4 Scout …). **Superpowers** (21,53 až 31,53 s): infografika „Build Your Whole Team with 42 essential Claude
  skills“ s vodoznakom charliehills.substack.com, potom terminál s promptom „use the superpowers skills for
  structure…“ a plánom `docs/superpowers/plans/2026-07-14-rate-limiting.md` nad ilustračným záberom notebooku.
  **Caveman** (32,87 až 41,70 s): ponuka `/caveman` lite / full / ultra, sekcia „Auto-Clarity“ s príkladom
  `DROP TABLE users`, terminál Claude Code v2.1.150 s odpoveďou v plných vetách. **Claude Code Setup** (43,50 až
  52,17 s): karta „Claude Automation Recommender · Anthropic“, README „Claude Code Setup Plugin“ so zvýraznenými riadkami.
  **Claude Security** (53,73 až 65,93 s): README GitHub Action „Claude Code Security Review“ (záložka MIT license),
  aplikácia „Get started with Claude Security … Start a scan“, výsledok `acme-corp/hookrelay` so štyrmi nálezmi a kurzor
  na „Suggest fix“, dole ilustračný muž v kapucni pri monitoroch; 65,93 s moderátor („paid“).
- Formát (merané `strihy.sh`, `ebur128`, `silencedetect`): 24 záberov pri prahu 0,12 (17 pri 0,25), medián 2,28 s,
  prvá zmena 1,80 s, 20,5 strihu za minútu; najdlhšie zábery 5,97 s (panel tokenov) a 6,50 s (terminál Superpowers).
  Reč od 0,02 s, 203 slov, 181 slov za minútu, žiadne ticho nad 0,25 s pod -35 dB; -18,1 LUFS, -4,9 dBTP. Moderátor
  len ~5 % času (0 až 1,80 a 65,93 až 67,48 s), zvyšok snímky obrazovky, karty a ilustračné zábery. Titulky po jednom
  slove v tmavej pilulke celý čas, na švíku delenej obrazovky (y ≈ 960), pri kartách nižšie. Hook je zoznam s číslom
  („These are the top five plugins…“), nie výsledok; karty #1 až #5 (1,3 až 2,2 s) ukazujú postup, každá položka
  10 až 16 s; druhý hook nie je, len „Finally“ v 52,1 s (77 %); výzva v 62,1 s.
- Overené 2026-10-20 (klony len na čítanie, nič spustené, nainštalované ani pripojené; `gh api` vrátil 403, čísla
  hviezd a inštalácií zo stránok):
  - **Brána k cudzím modelom** (názov a odkaz vynechávame podľa pravidla zápisu; verejný repozitár, MIT len na kód, verzia 3.8.53): **nie je plugin**. Je to
    samostatný server (npm, Docker, Electron), na ktorý sa Claude Code presmeruje zmenou adresy API; prekladá formáty
    pre 239 chatových poskytovateľov („375 registered“ ráta aj médiá, vyhľadávanie a lokálne služby; video 290, web 352)
    a pri chybe 429 alebo vyčerpanej kvóte prejde na ďalší **pripojený** cieľ. Predvolené `auto` drží posledný úspešný
    model, nie „najlepší“; ďalší v poradí je spravidla slabší alebo bezplatný. Skutočný model je v poli `model` odpovede
    a v hlavičke (voľba ho vie prepísať aj tam); či ho Claude Code ukáže, alebo ďalej ukazuje nastavené meno, sme
    v rozhraní neoverili. Anthropic: „doesn't support routing Claude Code to non-Claude models through any gateway“
    (code.claude.com/docs/en/llm-gateway). **Tokeny zadarmo nedáva projekt**: README „estimated aggregate across
    separately eligible third-party free tiers, not a token grant from [the gateway]“, účet u každého poskytovateľa zvlášť;
    z ~1,62 mld. je ~1,00 mld. (62 %) jediný pool Mistral Free mode, na ktorého vstupoch aj výstupoch môže Mistral
    trénovať (s možnosťou odhlásenia) a jeho limit overil len správca v konzole (2026-09-02); jednorazové kredity
    zdvihnú prvý mesiac na ~2,22 mld.; video ~1,53 mld., web 1,51 mld. Server drží všetky API kľúče, prihlasovacie
    tokeny predplatných a cookies webových rozhraní; „stealth“ vrstva maskuje požiadavky iných klientov ako Claude Code
    a rieši ochranu Cloudflare Turnstile na claude.ai. To ide proti podmienkam Anthropicu
    (code.claude.com/docs/en/legal-and-compliance: „developers may not collect, store, or intermediate Claude.ai
    credentials or session tokens“; Consumer Terms: zdieľanie účtu, automatizovaný prístup len cez API kľúč, obchádzanie
    ochranných opatrení); projekt sám radí Claude Web medzi poskytovateľov „with real ban risk“ a 17 položiek katalógu
    značí tos „avoid“ (aj Antigravity, cez ktorý ide „FREE Claude“ z obrazu). Bezpečnosť: kritické RCE (CVE-2026-88062,
    CVSS 4.0 9,5, zverejnené 2026-09-10; bez prihlásenia pri vypnutom `requireLogin` alebo počas prvého nastavenia;
    oprava #11028 je v changelogu 3.8.50, databáza GitHubu vedie ako zraniteľné verzie do 3.8.50 vrátane) na serveri,
    ktorý drží všetky kľúče naraz. „RTK + Caveman, −89 % avg“ sú čísla projektu, nemerali sme ich.
  - **Superpowers** (github.com/obra/superpowers, MIT, Copyright (c) 2025 Jesse Vincent, v7.0.0, commit bb92a77): plugin
    pre Claude Code a ďalšie kódovacie nástroje (nie pre chat). Je v oficiálnom marketplace Anthropicu s pripnutým
    commitom, ale bez štítku „Anthropic verified“; Anthropic obsah pluginov nekontroluje (README marketplace).
    15 procesných skills a hook SessionStart, ktorý do každej relácie vloží `using-superpowers` („even a 1% chance
    a skill might apply … you ABSOLUTELY MUST invoke the skill“). Role tímu nemá; viac agentov len pri
    subagent-driven-development (nový implementátor na úlohu, recenzent s dvoma verdiktmi, záverečný recenzent).
    Brainstorming po jednej otázke a nič sa nestavia pred schválením, plán do `docs/superpowers/plans/`, testy pred
    kódom („NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST“), recenzia čerstvým recenzentom bez histórie relácie: sedí;
    „before you even see it“ platí len pre kód, návrh a plán človek schvaľuje vopred. Ukážka je skutočná (dátum
    13. 7. 2026 = v6.1.1), na obraze sú však aj cudzie nástroje (plugin claude-mem, Codex). **Infografika „42 essential
    Claude skills“ k projektu nepatrí**: vodoznak charliehills.substack.com, organigram „like a real company“,
    Superpowers je v nej jedna dlaždica „14-skill power pack“; autora infografiky sme neoverili (rovnaký koncept
    uverejnil v júli 2026 Hamza Khalid). Tokeny: issues #2551 (implementátori v opravných kolách na 300k+ kontextu),
    #1988 (úloha ~4 h, 120,7 mil. tokenov), #1152 (v Codexe jednoduchý plán minul celý 5-hodinový limit). Pôvod: znenie
    Iron Law a „dôkaz pred tvrdením“, ktoré v `tim-roly` citujeme z gstacku, sú v Superpowers od prvého commitu dd013f6
    (2025-10-09); gstack začína 2026-03-11 a Superpowers neuvádza.
  - **Caveman** (github.com/JuliusBrussee/caveman, Apache-2.0 od v3.0.0, „Caveman“ je ochranná známka, v4.0.1, commit
    bad48a0, jeden udržiavateľ): nie je v oficiálnom marketplace ani od Anthropicu. Skill je pokyn na štýl výstupu
    (~1 160 vstupných tokenov, „Input reduction from the skill: 0%“); jaskynnú reč dnešný `SKILL.md` zakazuje („Never
    add a word to sound caveman“), je to stručná technická angličtina podľa ASD-STE100. Ponuka lite / full / ultra je
    zastaraná (od 2026-10-02 `/caveman`, `/ultracave`, `/megacave`), „Auto-Clarity“ je dnes „When to break the rules“
    a je to veta v pokyne, nie poistka. Úspora výstupu na 10 otázkach (claude-opus-5-5): −41 % proti ničomu, ale −3 %
    (medián) proti jednej vete „Answer concisely.“ (merané na pravidlách 3.1.0, zatiaľ nezopakované); účet agenta je
    podľa projektu „mostly input and cache re-reads, which an output-style rule cannot touch“ (cudzie A/B testy: výstup
    −44 %, cena +0,06 %; výstup 0,3 % všetkých tokenov). JetBrains (86 úloh): výstup −8,5 %, kvalita bez rozdielu
    (p = 0,82); „exact same code“ je len pokyn a projekt tvrdenie o rovnakej kvalite nezverejňuje. Od 4.0 je hlavná
    inštalácia CLI s lokálnym proxy na celú prevádzku Claude Code, telemetriou zapnutou predvolene a výberom modelu cez
    Caveman Cloud (po prihlásení; na bezplatnom pláne si zadania vrátane `CLAUDE.md` môže ponechať). Terminál v 38 až
    41 s nie je v štýle caveman (plné vety), k ukážke nepatrí.
  - **Claude Code Setup** (anthropics/claude-plugins-official, `plugins/claude-code-setup`, Apache-2.0, 1.0.0, autor
    Anthropic, štítok „Anthropic verified“, 195 067 inštalácií; klon a0b04d9): „oficiálny“ platí. Je to jeden skill
    `claude-automation-recommender`, len text, nič nespúšťa. „Scans your entire code base“ je pár príkazov `ls`, `cat`
    a `grep` nad manifestmi; `CLAUDE.md` ani `AGENTS.md` nečíta (issue #6029). Odporučí 1 až 2 položky na kategóriu
    (MCP, skills, hooky, subagenti, pluginy) z pevných tabuliek pre npm, Python, Go a Rust a z webového hľadania, nič
    nenastaví; „read-only“ drží len text pokynu, pole `tools:` skill nepozná (issue #6369). Karta v 44 s je výrez
    z obrázka v repozitári so starším menom pluginu a príkazom na balík `@anthropic-ai/context7-mcp`, ktorý na npm
    neexistuje (HTTP 404, 2026-10-20; správny je `@upstash/context7-mcp`); README stále uvádza „Slash Commands“, zlúčené
    do skills 2026-01-20. V cloudovej relácii (claude.ai/code) sa pluginy nenačítajú. Suchý beh podľa jeho tabuliek nad
    týmto repozitárom: takmer všetko, čo by navrhol, máme (GitHub MCP, Playwright a dymový test, roly, `/security-review`);
    jediné nové nápady (hook, ktorý po úprave zdrojov spustí `node tools/build.mjs`, a hook, ktorý zastaví správu commitu
    s podpisom) plynú z `CLAUDE.md`, ktorý skill nečíta.
  - **Claude Security**: pod jedným menom **štyri nástroje Anthropicu**: GitHub Action
    `anthropics/claude-code-security-review` (MIT, Copyright (c) 2025 Anthropic, commit 0c6a49f, len diff pull requestu,
    vlastný API kľúč, posledný commit 2026-02-11), vstavaný `/security-review` (diff vetvy proti `origin/HEAD`), plugin
    `claude-security` (oficiálny marketplace, v0.12.0, beta, proprietárna licencia; celé repo, časť alebo diff)
    a hostovaný Claude Security na claude.ai (len Enterprise, verejná beta od 2026-04-30). V obraze sú Action
    a hostovaná aplikácia, plugin nie; `acme-corp/hookrelay` je ukážkový príklad Anthropicu (tie isté štyri nálezy sú na
    claude.com). „Fixes the holes“ neplatí pre žiadny z nich: navrhujú patch, aplikuje človek („Patches are never
    applied automatically“, docs claude-security; „Nothing is applied without human approval“, anthropic.com). Bez
    príplatku idú len `/security-review` a plugin, oba z používania plánu Claude Code (plugin „may use a significant
    number of tokens“); Action platí tokeny API, hostovaný produkt Enterprise a Extra Usage. Action podľa kódu dnes
    s predvolenými nastaveniami dá zelenú kontrolu bez skenu (predvolený model vyradený 2026-08-05, chyba skenu sa zmení
    na varovanie a 0 nálezov; issues #152, #154) a „is not hardened against prompt injection attacks“. Action
    a `/security-review` vylučujú celé triedy (DoS, rate limiting, nálezy v `.md`, open redirect len pri veľmi vysokej
    istote); výsledky skenov sa medzi behmi líšia (README pluginu). U nás `/security-review` zlyhá, kým klon nemá
    `origin/HEAD` (oprava lokálne `git remote set-head origin main`).
- Čo nesedí: „plugins … in Claude“ (pre Claude Code, nie chat; brána nie je plugin vôbec, pri Claude Security
  v obraze Action a aplikácia pre Enterprise), „almost unlimited“, „1.6 billion free tokens“ a „next best model“,
  „entire dev team“, „talk like a caveman“ a „way fewer tokens“, „scans your entire code base“, „fixes the holes“,
  „free tool“. Infografika 42 skills a terminál pri Caveman k nástrojom nepatria, ukážky Claude Security sú propagačný
  materiál Anthropicu, ponuka Caveman je zo staršej verzie.
- Čo prešlo:
  - `../../tim-roly/` (vlastný text s citátmi `súbor:riadok`): zo Superpowers plán pre vykonávateľa (časť 3b: úloha
    s vlastným testom, Súbory a Rozhrania, krok s príkazom a očakávaným výstupom, globálne obmedzenia z `CLAUDE.md`,
    päť netestovaných vstupov, sebakontrola s proporciou, záznam drobných rozhodnutí a štyri stopky), doplnky otázok
    majiteľovi (zhrnutia s označenými odhadmi, anti-ciele, predvolené hodnoty nahlas, veľkosť práce) a kontrola
    staviteľom (schéma `KONTROLA_STAVITELOM`), prechod 0 staff recenzenta „súlad so zadaním“, tabuľka dôkazov
    s overením `git diff`, nejasná pripomienka zastaví všetky, pôvod Iron Law; z Caveman pravidlá pre voľné textové polia
    správ agentov (spoločný blok); z Claude Code Setup postup „signál v repozitári → automatizácia“ (časť 3);
    z `/security-review` metóda „nájdi, potom vyvracaj“ s prahom 8 z 10 a triedy, ktoré nástroj vylučuje a my nie (časť 6).
  - `../../testy-a-nasadenie/` (časť 8a): `/security-review` ako brána pred nasadením zmien v `admin/`, `vernost/`,
    formulároch, workflowoch a rezervačných odkazoch; nálezy cez skeptika do schémy `BEZPECNOST` so stavom „čiastočne“.
  - `toolbox/ZDROJE.md`: časť „Nástroje pre Claude Code z videa sadie.ontech“ s licenciami a rozhodnutím pri každom.
  - Pre Shorts (zatiaľ len tu, do `../../youtube-shorts/` nezapísané): číslované karty ako ukazovateľ postupu pri
    zozname; nič viac.
- Čo nie:
  - Brány k cudzím modelom a free tierom (podmienky Anthropicu, kľúče a predplatné na serveri tretej
    strany, kód a texty klientov k neznámym poskytovateľom vrátane takých, čo trénujú na vstupoch, kritické RCE, Claude
    Code na cudzom modeli bez upozornenia). Názov uvádzame len preto, že ho video menuje (popis, reč, karta v obraze);
    odkaz, repozitár a postup inštalácie zámerne nie (`zapis-referencie.md`), v `ZDROJE.md` len kategória. Pri limitoch
    legitímne: `/model` a effort, Haiku na jednoduché subagenty (`../../workflowy/`, smerovanie podľa náročnosti),
    vlastný API kľúč z Claude Console alebo extra usage v pláne; pri limite zastaviť a nahlásiť, nie potichu pokračovať
    slabším modelom.
  - Inštalácia Superpowers (hook v každej relácii, „1 % → MUSÍŠ“ by spúšťal brainstorming aj pri malej oprave, réžia
    tokenov), `docs/superpowers/` a anglické commity („feat: add specific feature“), nepretržité vykonávanie bez otázok,
    „Delete means delete“ pri vizuálnej práci, 5 opravných kôl, visual companion s telemetriou.
  - Caveman skill aj CLI: v slovenčine niet členov na vypustenie a majiteľ dostáva plné vety bez žargónu; proxy na celú
    prevádzku, telemetria a cloud sú proti pravidlám toolboxu.
  - Claude Code Setup tu nespúšťať (v cloude sa nenačíta, tabuľky sú pre npm a Python). Lokálne len v režime plán,
    s pokynom najprv prečítať `CLAUDE.md`, každý inštalačný príkaz overiť v registri; dva hooky vyššie sú návrh pre
    majiteľa (otázka D1), nič nezapísané.
  - GitHub Action (nemáme pull requesty, platený kľúč, zelená kontrola bez skenu), hostovaný Claude Security (Enterprise),
    kopírovanie promptov pluginu `claude-security` (proprietárna licencia); plugin voliteľne len lokálne nad `vernost/`
    po súhlase majiteľa s nákladmi, výstup `CLAUDE-SECURITY-*` necommitovať.
  - Vo videu: „top 5“ bez overenia, „oficiálny“ zliaty pre viac nástrojov, cudzia infografika a ilustračný b-roll ako
    dôkaz, sľuby, ktoré nástroj nerobí, „free“ pri nástrojoch platených tokenmi, výzva „comment PLUGINS“.

## Spoločné lekcie

- Hook pre texty: prvá veta je jasný sľub, potom obraz miesta, potom čo dostaneš a ako rezervovať.
- Rozbor rob po snímkach a s časmi; popis autora o obsahu nevypovedá.
- Tvrdenia z videí o nástrojoch over v repozitári a na stránke projektu s dátumom (záznamy 8 až 10: čísla boli
  zastarané, inštalácia zjednodušená, makety vydávané za nahrávku). Nástroj čítaj, neinštaluj.
- Každé rozhodnutie z referencie zapíš do dokumentu projektu (tu `CHECKS.md`, `TOUR_DIRECTION.md`),
  inak sa o mesiac nebude vedieť, prečo je web taký, aký je.
- Video, ktoré nič nepomenuje a všetko schová za „napíš mi do DM“ alebo „comment SLOVO“, je upútavka na zbieranie
  kontaktov, nie zdroj (záznamy 13, 16, 17). Nepíšeme autorovi; rozoberieme formát a tvrdenia overíme sami.
- Stiahnuté cudzie video je len na rozbor a po zápise ide preč (`stahovanie-a-pravo.md`); YouTube nesťahujeme.
- B-roll nemusí byť z nástroja, o ktorom video hovorí (záznam 12: polovica videa sú iné produkty; záznam 19:
  infografika „42 skills“ s vodoznakom cudzieho newslettera pri Superpowers, terminál v plných vetách pri Caveman);
  čítaj značky, vodoznaky a nápisy v detaile, kým napíšeš „video ukazuje“.
- Číslo zo snímky ber s jednotkou z hlavičky grafu (záznam 14: tokeny za deň vydávané za parametre) a novinku
  over k dátumu videa aj k dnešku.
- „Licencia MIT“ platí pre repozitár, nie pre jeho závislosti a služby okolo (záznam 15: nvdiffrast, RMBG-2.0).
  „Zadarmo“ je licencia, nie prevádzka: tokeny, API kľúč a plán platíš aj pri nástroji s MIT (záznam 19: GitHub
  Action pod MIT platí každý beh tokenmi API z vlastného kľúča, Superpowers pod MIT minul v jednej úlohe 120,7 mil.
  tokenov).
- Dátum záberov obrazovky ber z verzií na snímke (npm `time`: `curl -s https://registry.npmjs.org/<balík>`), nie
  z dátumu uverejnenia (záznam 16: zábery z konca marca až mája, video zo septembra); „jeden riadok“ over na snímke
  vloženia (`[Pasted text #1 +710 lines]`).
- „Tri kroky“ vo videu môžu byť z rôznych relácií (záznam 17: 9 súborov v kroku 2, 2 fotky v projekte); porovnaj
  súbory, názvy projektov a obsah medzi krokmi.
- „Oficiálny“ v titulku over pri každom nástroji zvlášť: autor v manifeste, oficiálny marketplace
  (`anthropics/claude-plugins-official`) a štítok „Anthropic verified“ na claude.com/plugins (záznam 19: oficiálne
  dva z piatich, pod menom „Claude Security“ štyri rôzne nástroje). Ani oficiálny marketplace neznamená, že Anthropic
  obsah pluginu skontroloval, a aj oficiálny obrázok môže mať zlý inštalačný príkaz: balík over cez
  `curl -s -o /dev/null -w '%{http_code}' https://registry.npmjs.org/<balík>` (404 = neexistuje).
- „Plugin“ môže byť samostatný server, ktorému odovzdáš kľúče a predplatné, a „ďalší najlepší model“ je spravidla
  slabší model (záznam 19). Číslo typu „X tokenov zadarmo mesačne“ rozlož na zložky: čo je jednorazové, aký podiel
  má jeden poskytovateľ, či trénuje na vstupoch, kto číslo overil a kedy (tam 62 % z jedného poolu, overené len
  v konzole správcu).
- Percento úspory sa pýta „voči čomu a z akej časti účtu“: kontrolou je jedna veta „odpovedaj stručne“, nie nič,
  a meria sa celý účet relácie, nie len výstup (záznam 19: Caveman −41 % proti ničomu, −3 % proti kontrole,
  cena relácie v cudzích testoch ±0).
- Skener, ktorý „nájde a opraví“: zisti, čo naozaj číta (diff alebo celé repo), ktoré triedy zámerne vylučuje a kto
  aplikuje opravu; prázdny výsledok znamená „žiadne podložené nálezy v posúdenom rozsahu“, nie „bezpečné“.
- Pôvod pravidla over prvým commitom: znenie, ktoré cituje jeden projekt, mohol prevziať z iného bez zmienky
  (záznam 19: Iron Law je v Superpowers od 2025-10-09, gstack vznikol 2026-03-11).
