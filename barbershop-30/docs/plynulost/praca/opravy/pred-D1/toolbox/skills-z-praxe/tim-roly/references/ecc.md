# ECC (Everything Claude Code): rozbor a porovnanie

Rozbor, z ktorého vychádza skill [`tim-roly`](../SKILL.md) (brána dvoch recenzentov, schválenie presného súboru,
správa PRIPRAVENÉ / NEPRIPRAVENÉ, bezpečnosť) a časti skillu `../../youtube-shorts/` (zásady krátkeho videa).

Zdroj: klon `github.com/affaan-m/everything-claude-code` (dnes presmerované na `github.com/affaan-m/ECC`),
commit `76aaa77df6adc5b889e689007bf99b9a4f74af34` z 2026-10-15, verzia `2.2.3` (súbor `VERSION`,
`CHANGELOG.md:30` „2.2.3 - 2026-10-01“). Licencia MIT, „Copyright (c) 2026 Affaan Mustafa“ (`LICENSE:1-3`).
Čítané 2026-10-17 ako cudzie údaje; nič z repozitára sa nespúšťalo (žiadne `npx`, `npm`, `install.sh`, hooky ani
skripty). Odkazy `súbor:riadok` sú relatívne ku koreňu repozitára ECC. Tvrdenia autora sú jeho tvrdenia; počty sú
spočítané zo súborov. Kľúčové citáty (santa-method, operator-approval-loop, content-engine, verification-loop,
security-reviewer, „lethal trifecta“, „executable configuration“) sme 2026-10-17 overili grepom v klone.

## 1. Čo to je (podľa autora)

- „Your agent can write code, but ECC gives it a coordinated engineering system and toolbox: it plans
  before it builds, verifies changes with tests, reviews its own work from a fresh context, remembers what
  matters, and turns repeated wins into reusable skills and workflows.“ Postup `plan -> test -> implement ->
  review -> verify -> remember -> improve` (`README.md:132-136`).
- Plugin pre Claude Code s adaptérmi pre Codex, Qoder, Cursor, OpenCode, Gemini, Zed, Copilot a ďalšie
  (`README.md:142`). Päť zásad: Agent-First, Test-Driven (80 % pokrytie), Security-First, Immutability,
  Plan Before Execute (`AGENTS.md:9-13`, `SOUL.md`).
- Financovanie: MIT „forever“, platená GitHub App „ECC Pro“ pre súkromné repozitáre („from $19/seat/mo“,
  `README.md:85`), sponzori (CodeRabbit, Greptile, Moonshot/Kimi, Itô Markets, SerpApi; `README.md:112-118`).
  Itô má v repozitári vlastné skills (`ito-baskets`, `ito-compute`, `ito-inference`, `ito-training`) a text
  sponzora v inštalátore (`scripts/lib/compute-sponsor.js`).

## 2. Čo je vnútri (spočítané zo súborov)

| Časť | Počet | Poznámka |
| --- | --- | --- |
| `agents/*.md` | 71 | 26 recenzentov (`*-reviewer`: kód, bezpečnosť, 20 jazykov a rámcov, databáza, RAG, zdravotníctvo), 12 opravárov zostavenia (`*-resolver`), 33 ďalších (planner, architect, code-explorer, tdd-guide, e2e-runner, doc-updater, refactor-cleaner, performance-optimizer, silent-failure-hunter, marketing-agent, seo-specialist, chief-of-staff, trojica gan-*, trojica opensource-* …). Model v hlavičke: 61× sonnet, 6× haiku, 4× opus |
| `skills/*/SKILL.md` | 311 | 26 inštalačných modulov (`manifests/install-modules.json`), tabuľka nižšie |
| `commands/*.md` | 97 | „legacy command shims“; nové postupy majú ísť do `skills/` (`AGENTS.md:175-179`) |
| `hooks/hooks.json` | 27 záznamov | 8 udalostí, časť 4 |
| `rules/` | `common` (10 súborov) + 21 jazykov | plugin ich nedistribuuje, kopírujú sa ručne (`README.md:300-308`) |
| MCP | 1 predvolený, 34 v katalógu | `.mcp.json`: `chrome-devtools` cez `npx -y chrome-devtools-mcp@1.10.1`; katalóg `mcp-configs/mcp-servers.json` |
| veľkosť | 76 MB, 4 621 súborov | bez `.git` |

Skills podľa modulov (súčet 311, každý skill v práve jednom module):

| Modul | Počet | Príklady |
| --- | ---: | --- |
| framework-language | 71 | django-, laravel-, springboot-, kotlin-, rust-, react-patterns … |
| workflow-quality | 52 | tdd-workflow, verification-loop, council, santa-method, strategic-compact, delivery-gate, continuous-learning-v2 |
| agentic-patterns | 37 | autonomous-loops, agent-harness-construction, cost-aware-llm-pipeline |
| security | 21 | security-review, security-scan, gateguard, safety-guard, hipaa-compliance |
| operator-workflows | 20 | email-ops, google-workspace-ops, customer-billing-ops |
| devops-infra | 17 | docker-patterns, deployment-patterns, kubernetes-patterns |
| business-content | 14 | content-engine, brand-voice, marketing-campaign, seo, lead-intelligence |
| media-generation | 11 | video-editing, remotion-video-creation, manim-video, fal-ai-media, videodb |
| research-apis | 10 | deep-research, exa-search |
| database, optimization-workflows, supply-chain-domain | 8 + 8 + 8 | supply-chain skills majú licenciu Apache-2.0 |
| swift-apple | 7 | |
| operator-desk-patterns, machine-learning | 4 + 4 | operator-approval-loop |
| social-distribution, prediction-market-skills, ito-compute | 3 + 3 + 3 | crosspost, x-api, social-publisher |
| ostatné (8 modulov) | 2 + 2 + 6 × 1 | |

Skill priamo na YouTube Shorts v ECC nie je (`grep -il shorts skills/*/SKILL.md` nič nenájde). Krátkeho videa
sa týkajú `content-engine` (časť „Short Video“), `video-editing`, `marketing-campaign` a `brand-voice`.

Kľúčové príkazy (`COMMANDS-QUICK-REF.md`, `README.md:691-776`): `/plan` (zopakuje požiadavky, riziká, plán
po fázach, „WAIT for user CONFIRM before touching any code“, `commands/plan.md:2`), `/feature-dev`,
`/code-review`, `/build-fix`, `/test-coverage`, `/security-scan`, `/santa-loop`, `/quality-gate`,
`/refactor-clean`, `/save-session`, `/resume-session`, `/learn`, `/skill-create`. Skratky `/tdd` a `/eval`
sú presunuté do `legacy-command-shims/` (`README.md:754`); TDD je skill `tdd-workflow`.

Repozitár si v číslach protirečí: `COMMANDS-QUICK-REF.md:3` „94 slash commands“ proti 97 súborom,
`AGENTS.md:210` „14 MCP server configurations“ proti 34 v katalógu, preložené README majú staré počty
(es 63/249/79, ur 61/246/76, zh-CN/pt-BR/tr „261 skills“).

## 3. Inštalácia a čo robí s `~/.claude` a projektom

Presné príkazy z README:

- Odporúčané: `npx ecc-universal@2.2.3 setup` (`README.md:176`), sprievodca vyberie rozsah
  (`user`, `project`, `local`) a profil hookov. README sám píše: „A version pin is not a security audit or an
  integrity check“ (`README.md:219`). Spúšťa kód z npm.
- Natívne v Claude Code (to ukazuje video):
  `/plugin marketplace add https://github.com/affaan-m/ECC` a `/plugin install ecc@ecc` (`README.md:290-291`).
  Podmienky: Claude Code 2.1+, Git, pre hooky Node.js 18+ (`README.md:166-169`).
- Deklaratívne v `~/.claude/settings.json`: `extraKnownMarketplaces` + `enabledPlugins: {"ecc@ecc": true}`
  (`README.md:315-330`).
- Ručne z klonu: `./install.sh --profile minimal|core|developer|security|research|full --target claude`;
  `install.sh` volá `npm install --ignore-scripts` a `scripts/install-apply.js` (`install.sh:26-41`).

Čo zapisuje (podľa README a skriptov):

| Kam | Čo | Odkiaľ |
| --- | --- | --- |
| plugin cache Claude Code | celý repozitár (skills, agents, commands, hooks, scripts) | `/plugin install` |
| `~/.claude/settings.json` | pri ručnej inštalácii hookov záznamy hookov (ECC ich sleduje podľa ID); pri plugine sa hooky načítajú samy z `hooks/hooks.json` | `hooks/README.md:27-50`, `README.md:1948-1958` |
| `~/.claude/skills/<skill>/`, `~/.claude/rules/ecc/` | pri ručnej inštalácii skills a pravidlá | `README.md:475`, `:300-308` |
| `~/.claude/session-data/`, `~/.claude/sessions/` | súhrny relácií (úlohy používateľa, nástroje) | `scripts/hooks/session-end.js`, `scripts/lib/utils.js:56-66` |
| `~/.local/share/ecc-homunculus/` | pozorovania každého volania nástroja (vstup a výstup do 5 000 znakov, regex na tajomstvá) | `skills/continuous-learning-v2/hooks/observe.sh:228-245`, `SKILL.md:138-146` |
| `~/.claude/metrics/costs.jsonl`, `~/.claude/state/skill-runs.jsonl`, `/tmp/ecc-metrics-*.json` | lokálna telemetria nákladov a behov skills | `scripts/hooks/cost-tracker.js`, `skill-run-tracker.js`, `ecc-metrics-bridge.js` |
| projekt | pri `--target claude-project` priečinok `.claude/`; `.claude/hookify.*.local.md` pravidlá | `README.md:475`, `hooks/README.md:165-182` |

Odinštalovanie: `npx ecc-universal@2.2.3 uninstall --dry-run`, potom bez `--dry-run`; plugin sa odstráni
v Claude Code (`README.md:646-685`). `commands/auto-update.md` stiahne nové zmeny z upstreamu a preinštaluje.

## 4. Hooky (bezpečnostne najdôležitejšie)

Pri plugine sú hooky predvolene zapnuté: `userConfig.hooks_enabled` `"default": true`, profil `standard`
(`.claude-plugin/plugin.json:25-38`). Každý záznam volá Node.js cez `node -e` a `plugin-hook-bootstrap.js`.
Profily určuje posledný argument v `hooks/hooks.json` (`minimal`, `standard`, `strict`).

| Udalosť | Hooky (ID z `hooks/hooks.metadata.json`) | Čo to pre nás znamená |
| --- | --- | --- |
| PreToolUse, každý nástroj | `pre:observe:continuous-learning` (async), `pre:hookify-runtime` | každé volanie nástroja sa zapíše na disk (aj obsah súborov a výstupy príkazov) |
| PreToolUse, Bash | `pre:bash:dispatcher` (tmux, git push, kontrola commitu, GateGuard, blokovanie `--no-verify`) | blokuje `npm run dev` mimo tmux, kontroluje commit |
| PreToolUse, Edit/Write | `pre:edit-write:gateguard-fact-force` | **odmietne prvú úpravu každého súboru**, kým agent neodpovie na otázky; vlastný pilot autorov: 72 relácií, „about 45% more turns“ a o účinku „nothing“ (`CHANGELOG.md:17`); tvrdenie „+2.25 quality points“ stojí na 2 úlohách (`skills/gateguard/SKILL.md:35-43`) |
| PreToolUse, Write/Edit | `pre:config-protection` | blokuje úpravy konfigurácie linterov a formátovačov |
| PreToolUse, `^mcp__` | `pre:mcp-health-check` | pred volaním MCP pošle HTTP GET na server alebo spustí jeho príkaz (stdio) na sondu; opätovné pripojenie len s `ECC_MCP_RECONNECT_ALLOW` (`scripts/hooks/mcp-health-check.js:616-625`) |
| SessionStart | `session:start`, `session-start:plan-canvas-sessions` | vloží do kontextu súhrn poslednej relácie (do 8 000 znakov) a „instincts“; autori mali incident, keď model po obnovení znova spustil staré úlohy, preto obal „HISTORICAL REFERENCE ONLY , NOT LIVE INSTRUCTIONS.“ (`scripts/hooks/session-start.js:723-744`, issue #1534) |
| UserPromptSubmit, Stop | `prompt:hookify-runtime`, `stop:hookify-runtime` | projektové pravidlá; súbory sledované Gitom sú predvolene vypnuté („opening a repository must not activate repository-authored instructions“, `hooks/README.md:179-182`) |
| PostToolUse | 2 dispečery, 12 podháčikov (`scripts/hooks/posttooluse-dispatcher.js:36-68`) | kontrola kvality po úprave, varovanie pred „generic template-looking UI“, metriky, pozorovanie |
| Stop | 8 háčikov (formátovanie a `tsc` pri JS/TS s konfiguráciou formátovača, `console.log`, súhrn relácie, hľadanie vzorov, náklady, upozornenie na ploche) | po každej odpovedi beží až 8 procesov; `stop:format-typecheck` má časový limit 300 s |
| PreCompact, SessionEnd | uloženie stavu, značka konca | |

Sieť a telemetria: v `scripts/hooks` sú sieťové volania len v `mcp-health-check.js` (HTTP sonda MCP)
a `plan-canvas-pending.js` (len `127.0.0.1`). Adresy na odosielanie telemetrie som v hookoch nenašiel; README
tvrdí „ECC never uploads diagnostics automatically“ (`README.md:283`, `:675`). Sieť používajú: `npx` pri
inštalácii a pri MCP `chrome-devtools`, `/astra-review` („Invoking the command is your consent to send that
diff to OpenAI“, `README.md:640`), skills napojené na služby (`social-publisher` → getsocialclaw.com,
`fal-ai-media`, `x-api`, `exa-search` …).

Hodnotenie: hooky sú napísané starostlivo (obmedzenie vstupu, fail-closed pri GateGuard, vypnuté projektové
pravidlá z Gitu, opt-in reconnect), ale pre nás sú problém v troch veciach: (1) zapisujú obsah práce
(správy majiteľa, texty, výstupy príkazov) do troch miest na disku mimo projektu; (2) GateGuard a Stop háčiky
pridávajú kolá a čas, čo pri našom týždennom limite agentov stojí reálne peniaze (workflowy, Pasce:
„You've hit your weekly limit“); (3) automatické vkladanie starých súhrnov do kontextu je presne ten druh
pamäte, z ktorého vznikol ich incident #1534. Vlastný bezpečnostný návod ECC to pomenúva: „Hooks can run
shell commands, MCP servers can hold credentials, and project instructions can enter an agent's context.
Treat all three as executable configuration.“ (`README.md:1983`).

## 5. Tvrdenia videa V2 (sadie.ontech, 2026-10-13) proti repozitáru

Časy sú z automatických titulkov `video.eng-US.vtt` (sedia s rečou), obraz z `prehlad-01.jpg`.

| Čas (s) | Video | Verdikt | Dôkaz |
| --- | --- | --- | --- |
| 0,0–5,4 | „One guy just replaced your entire engineering team“ | reklama | nástroj pre agenta, nie tím; `README.md:106` „a single maintainer ships weekly“ |
| 8,1–11,1 | „One developer shipped it alone in 10 months“ | čiastočne | jeden správca áno, ale 412 prispievateľov (shields.io, 2026-10-17) a 3 934 commitov (stránka repozitára, 2026-10-17). „10 months of daily use“ je dĺžka autorovho používania Claude Code (`the-shortform-guide.md:9`), nie čas stavby. Repozitár zverejnený v januári 2026 (emelia.io; shields.io „created at january“) |
| 11,1–14,6 | „already crossed 250,000 stars“ | sedí | v obraze „256.0k stars“; 2026-10-17 stránka GitHub „281.8k“, shields.io „282k“ |
| 14,6–26,6 | inštalácia za 30 s v „cloud code, Cursor alebo Codex“ cez `/plugin marketplace add` a `/plugin install` | čiastočne | príkazy platia pre Claude Code (`README.md:290-291`); Codex má `codex plugin marketplace add`, Cursor `ecc install --target cursor`; 30 s nikto nemeral, balík má 76 MB. Titulky „cloud code“ = Claude Code |
| 28,8–32,9 | plan: „one agent maps out your entire architecture“ | sedí s výhradou | `/plan` robí plán po fázach a čaká na potvrdenie; mapovanie kódu je `code-explorer`, návrh `architect` |
| 32,9–36,9 | build: „writes working code in whatever stack you use“ | nesedí | príkaz build neexistuje; `/build-fix` a 12 opravárov opravuje chyby zostavenia; kód píše model podľa `tdd-workflow` alebo `/feature-dev`. V obraze pri „Build it“ je príkaz `/model-route` |
| 36,9–41,4 | secure: „runs its own attacks on your app“ | nesedí | `/security-scan` spúšťa AgentShield na konfiguráciu agenta (hooky, MCP, oprávnenia, tajomstvá; `commands/security-scan.md:1-10`), `security-reviewer` je kontrolný zoznam OWASP; `--opus` je „red-team/blue-team/auditor“ úvaha o konfigurácii (`README.md:2062`), nie útok na bežiacu aplikáciu |
| 41,4–45,2 | test: „grinds until coverage hits 80%“ | sedí ako pokyn | `commands/test-coverage.md:51` „If still below 80%, repeat Step 3“, `AGENTS.md:149`; pokyn modelu, nie záruka |
| 45,3–48,3 | „64 agents, 261 skills“ | zastarané | to sú čísla verzie 2.0.0 z 2026-06-09: „2.0.0 shipped 64/261/84“ (`docs/releases/2.1.0/release-notes.md:52`); dnes 71/311/97 |
| 48,3–50,8 | „all free“ | sedí pre repozitár | MIT; platená je ECC Pro pre súkromné repozitáre |

Poznámka k forme videa: štúdiové zábery osôb a kancelárií sú ilustračné, s nástrojom nesúvisia; jediné
zábery nástroja sú snímky GitHubu a webu ECC. Pre naše Shorts to platí naopak: len skutočné zábery prevádzok.

## 6. Porovnanie: ECC, gstack a náš spôsob

gstack podľa `gstack-digest/etos-readme.md` a `claude-arch.md` (verzia 1.91.101.0, MIT, Garry Tan).

| | ECC 2.2.3 | gstack 1.91.101.0 | My (Workflow s agentmi, toolbox) |
| --- | --- | --- | --- |
| Čo to je | katalóg: 71 agentov, 311 skills, 97 príkazov, hooky, pravidlá | proces sprintu: Think → Plan → Build → Review → Test → Ship → Reflect, každý skill odovzdá výstup ďalšiemu | skripty pre nástroj Workflow: stavba po moduloch, kontrolóri, skeptici, porota; skills po slovensky z našej praxe |
| Inštalácia | plugin alebo `npx`; hooky predvolene zapnuté | `./setup` (Bun, kompilované binárky), hooky v `~/.claude/settings.json` | nič sa neinštaluje; skript sa spustí nástrojom Workflow |
| Pamäť | automatická (súhrny relácií, „instincts“ z pozorovaní) | `/learn`, `/context-save`, gbrain | súbory v projekte (`CHECKS.md`, `INTEGRATION_LOG.md`), `<scratch>/pamat/` |
| Kontrola | code-reviewer, security-reviewer, `/santa-loop` (dvaja recenzenti musia schváliť) | `/review`, `/qa`, `/cso` | nezávislí kontrolóri + dvaja skeptici na nález, meranie pred a po |
| Telemetria | lokálne súbory, podľa README nič neodosiela | opt-in do Supabase, kontrola aktualizácie predvolene | žiadna |
| Pre naše weby | zamerané na aplikácie (80 % pokrytie, API, databázy) | zamerané na produkt a aplikácie (QA v prehliadači) | statické weby, video, obsah, Booqme |
| Pre obsah | content-engine, brand-voice, video-editing, marketing-campaign | prakticky nič | instagram-salon, referencie-z-videi, film-z-fotiek |

Spoločné s nami: plán pred kódom a potvrdenie, nezávislá kontrola z čistého kontextu, „nevymýšľaj“,
skeptický prístup k nálezom. Rozdiel: ECC a gstack sa inštalujú a menia prostredie; my si berieme postupy
ako text a spúšťame ich sami, keď treba.

## 7. Odporúčanie: čo prevziať

Všetko ako postup (text po slovensky, prispôsobený), nie inštaláciou. Poradie podľa úžitku pre Shorts a weby.

1. **Brána pred odovzdaním majiteľovi (zo `santa-method`).** Dvaja nezávislí recenzenti s rovnakou rubrikou,
   výstup prejde, len keď **obaja** dajú PASS (`skills/santa-method/SKILL.md:3`, „Why both must pass“ `:174`), oprava a nové kolo,
   najviac 3 kolá, potom rozhodne človek (`:179-201`). Rubrika pre Short: každý fakt má zdroj, žiadne vymyslené
   čísla ani recenzie, ľudia v zábere so súhlasom, AI obraz alebo hlas len so súhlasom a označením, slovenčina
   a dĺžka titulkov, prvé 2 s ukazujú výsledok alebo problém. Dopĺňa náš vzor 4 (skeptici overujú nálezy
   kontroly); tu sa overuje hotový výstup. **V toolboxe:** `../../workflowy/priklady/brana-dvoch-recenzentov.js`
   (vzor 7) a rubriky v [sablony-rol.md](sablony-rol.md), časť 8.
2. **Schválenie presného súboru (z `operator-approval-loop`).** Majiteľ neschvaľuje „ten Short“, ale presný
   súbor: odtlačok sha256 videa a popisu sa zapíše s tým, kto a ako schválil; zmena po schválení schválenie
   ruší (`skills/operator-approval-loop/SKILL.md:30-50`). **V toolboxe:** `../../youtube-shorts/scripts/schvalenie.py`
   (bez databázy, kód vlastný; otestovaný: schválený súbor a jeho kópia prejdú, zmena jedného znaku v popise
   neprejde, kód 1).
3. **Zásady krátkeho videa z `content-engine`** (`skills/content-engine/SKILL.md:22-26`, `:81-86`, `:99-107`):
   začni zo skutočného materiálu; jedno video nesie jedno tvrdenie; konkrétnosť namiesto prídavných mien;
   žiadne „engagement bait“; prvé sekundy ukážu výsledok, problém alebo úder; scenár podľa obrazu a dôkazov,
   nie podľa toho, ako znie na papieri; postup kotva → 3 až 7 atómov → poradie → jedna myšlienka na výstup.
   **V toolboxe:** `../../youtube-shorts/SKILL.md` (hook, jedno tvrdenie, výzva).
4. **„Edit, don't generate“ z `video-editing`** (`skills/video-editing/SKILL.md:23`, `:320`): AI skracuje
   a štruktúruje skutočné zábery, negeneruje celé video; posledná vrstva je ľudský vkus. Sedí s naším pravidlom
   len skutočných záberov. Recepty ffmpeg (9:16 orez, `silencedetect`, `loudnorm`) sú bežné; pozor:
   `-ss … -to … -c copy` (`:91`) strihá na kľúčových snímkach, na presný strih Shortu treba prekódovať.
   Cieľová hlasitosť `I=-16` (`:127`) je ich voľba, cieľ YouTube sme neoverovali.
5. **Správa READY / NOT READY z `verification-loop`** (`skills/verification-loop/SKILL.md:97-113`): na konci
   kontroly jedna tabuľka PASS/FAIL. U nás namiesto build/typy/pokrytie: Playwright dymový test, Lighthouse,
   grep na kľúče a heslá pred commitom, diff. **V toolboxe:** [sablony-rol.md](sablony-rol.md), časť 7.
6. **Chybu najprv zopakuj padajúcim testom** (z `tdd-workflow`, `README.md:764-769`): pri regresii webu
   (preklady, odkazy Booqme) najprv test, ktorý padne, potom oprava. Celé TDD s 80 % pokrytím pre statické weby
   nepreberáme.
7. **Hlas značky** (`brand-voice`): pole „what the author never does“ porovnať s našou `sablona-hlas.md`;
   ak chýba, doplniť riadok „čo nikdy nerobíme“.
8. **Bezpečnostný rámec do zadaní agentov:** „lethal trifecta“ (súkromné údaje, cudzí obsah, odosielanie von;
   `the-security-guide.md:39`, podľa Simona Willisona). Agent, ktorý číta komentáre alebo DM (video V3),
   nesmie mať zároveň prístup k odosielaniu. Skills berieme ako dodávateľský reťazec: čítať pred kopírovaním
   (ECC cituje štúdiu Snyk ToxicSkills, prompt injection v 36 % z 3 984 verejných skills, `:83`; neoverené).

## 8. Čo neprevziať a prečo

| Čo | Prečo nie |
| --- | --- |
| inštalácia pluginu alebo `npx ecc-universal` do repozitára s webmi či do `~/.claude` | 27 hookov predvolene zapnutých; zapisujú obsah práce mimo projektu (časť 3); GateGuard podľa autorov +45 % kôl bez nameraného účinku; `npx` spúšťa kód z npm („A version pin is not a security audit“) |
| `continuous-learning-v2`, `session-end`/`session-start` pamäť | ukladá správy majiteľa a výstupy nástrojov (aj údaje zákazníkov) do `~/.local/share` a `~/.claude`; automatické vkladanie starých súhrnov viedlo k opakovaniu starých úloh (#1534). U nás pamäť ostáva v súboroch projektu, ktoré vidno |
| `social-publisher`, `crosspost`, `x-api` | uverejňovanie a plánovanie cez tretiu stranu (getsocialclaw.com, OAuth na všetky účty); u nás uverejňuje len majiteľ |
| `lead-intelligence`, `marketing-agent` pri oslovovaní, `chief-of-staff` | oslovovanie ľudí a správy v mene účtu; u nás žiadne automatické DM ani komentáre |
| `fal-ai-media`, generovaný hlas a obraz z `video-editing` | len so súhlasom majiteľa a označením; predvolene nie |
| `/astra-review`, `multi-*` | posiela diff do OpenAI, resp. vyžaduje externý runtime (`README.md:623-640`) |
| `rules/common` (80 % pokrytie, immutability, rate limiting) a `AGENTS.md` ako celok | pravidlá pre aplikácie s API a databázou; naše statické weby majú vlastné pravidlá v `CLAUDE.md` |
| 311 skills naraz | opisy skills majú 93 730 znakov, hrubý odhad asi 23 000 tokenov v kontexte; väčšina (supply chain, Kotlin, HarmonyOS, siete) sa nás netýka |
| `commands/auto-update.md` | ťahá zmeny z upstreamu a preinštaluje; každý update je nový kód na prečítanie |

## 9. Licencia: čo sa dá skopírovať

- Repozitár je MIT (`LICENSE`): kopírovať, upravovať aj šíriť sa dá, ak kópia alebo podstatná časť nesie
  copyright a text licencie.
- Výnimky: 8 skills s `license: Apache-2.0` (carrier-relationship-management, customs-trade-compliance,
  energy-procurement, inventory-demand-planning, logistics-exception-management, production-scheduling,
  quality-nonconformance, returns-reverse-logistics) a `osint-investigation` s CC-BY-SA-4.0
  (`skills/osint-investigation/LICENSE.txt`). Tie nekopírujeme (netýkajú sa nás; CC-BY-SA by viazala licenciu
  odvodeného textu).
- `santa-method` má v hlavičke „origin: Ronald Skelton - Founder, RapportScore.ai“, `gateguard` a `social-publisher`
  „origin: community“; v repozitári sú pod MIT ako celok. Pri doslovnej kópii uviesť aj pôvod zo `metadata.origin`.
- Odporúčaný postup ako pri `skills-animacie/`: preberáme myšlienky a píšeme vlastný slovenský text (to licenciu
  nevyžaduje, ale zdroj uvedieme ako pri RuFlo). Ak skopírujeme doslovne celý skill alebo jeho podstatnú časť,
  ide do vlastného priečinka s `LICENSE` (MIT, Copyright (c) 2026 Affaan Mustafa) a riadkom v README toolboxu
  so zdrojom `github.com/affaan-m/ECC`, commit `76aaa77`.

## 10. Čo z toho pre YouTube Shorts

- ECC nemá skill na Shorts; použiteľné sú zásady z `content-engine` (bod 3), téza „edit, don't generate“
  (bod 4), brána dvoch recenzentov (bod 1) a schválenie presného súboru (bod 2).
- Video V2 je ukážka, čo nerobiť v obsahu: zastarané čísla (64/261 namiesto 71/311), sľuby, ktoré nástroj
  nerobí („runs its own attacks“), ilustračné zábery bez vzťahu k téme. Naša brána (bod 1) by takýto scenár
  vrátila na opravu: každé číslo so zdrojom a dátumom, každé tvrdenie overiteľné v obraze.
- Remotion (spomenutý v `video-editing`) má vlastnú licenciu: zadarmo pre jednotlivcov, firmy do 3 zamestnancov
  a neziskovky, inak „Company License“ (github.com/remotion-dev/remotion/blob/main/LICENSE.md, pozreté
  2026-10-17). Pred použitím pre prevádzky over počet zamestnancov; ffmpeg a naše skripty túto podmienku nemajú.

## Zdroje overené na webe (2026-10-17)

- github.com/affaan-m/ECC: 281.8k hviezd, 41.9k forkov, 3 934 commitov.
- img.shields.io/github/stars/affaan-m/ECC.json: „282k“; /contributors: „412“; /created-at: „january“.
- emelia.io/de/hub/everything-claude-code-github-repo-100k-sterne: zverejnenie v januári 2026, okolo 100 000
  hviezd v apríli 2026 (článok tretej strany; údaj zo súhrnu vyhľadávania, článok som celý neotváral).
- github.com/remotion-dev/remotion/blob/main/LICENSE.md: podmienky bezplatnej licencie.
- GitHub API pre `affaan-m/everything-claude-code` v tejto relácii nebolo dostupné (proxy 403); čísla sú zo
  stránky repozitára a shields.io.

## 11. Ako si ECC vyskúšať na vlastnom počítači (nie v repozitári s webmi)

Len popis príkazov z `README.md` (riadky v zátvorke); my sme nič neinštalovali. Pred inštaláciou si prečítaj
časti 3 a 4 (čo zapisuje, hooky predvolene zapnuté).

1. Vlastný prázdny testovací priečinok, nie repozitár s webmi; Node.js 18+, Git, Claude Code 2.1+ (`:166-169`).
2. V Claude Code: `/plugin marketplace add https://github.com/affaan-m/ECC` a `/plugin install ecc@ecc` (`:290-291`).
   Natívna cesta nainštaluje skills, agentov, príkazy aj hooky; README radí potom už nespúšťať ručnú inštaláciu (`:294`).
3. Alebo `npx ecc-universal@2.2.3 setup` (`:176`): spúšťa kód z npm; „A version pin is not a security audit or an
   integrity check“ (`:219`).
4. Hooky vypnúť alebo zmeniť profil v sprievodcovi; pozri, čo pribudlo v `~/.claude` a `~/.local/share/ecc-homunculus/`.
5. Odinštalovanie: `npx ecc-universal@2.2.3 uninstall --dry-run`, potom bez `--dry-run` (`:655`); plugin
   odstrániť v Claude Code. `auto-update` nespúšťať bez prečítania zmien.
