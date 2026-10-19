# Čo sme sa naučili z referenčných videí (október 2026)

Desať videí, z ktorých niečo prešlo do projektu. Pri každom: čo video hovorí (z oEmbed popisu
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

## Spoločné lekcie

- Hook pre texty: prvá veta je jasný sľub, potom obraz miesta, potom čo dostaneš a ako rezervovať.
- Rozbor rob po snímkach a s časmi; popis autora o obsahu nevypovedá.
- Tvrdenia z videí o nástrojoch over v repozitári a na stránke projektu s dátumom (záznamy 8 až 10: čísla boli
  zastarané, inštalácia zjednodušená, makety vydávané za nahrávku). Nástroj čítaj, neinštaluj.
- Každé rozhodnutie z referencie zapíš do dokumentu projektu (tu `CHECKS.md`, `TOUR_DIRECTION.md`),
  inak sa o mesiac nebude vedieť, prečo je web taký, aký je.
