# Agency Agents (The Agency): rozbor pre tím rolí

Repozitár **github.com/msitarzewski/agency-agents** („The Agency“, správca Michael Sitarzewski, profil GitHub
msitarzewski), licencia **MIT**, v súbore `LICENSE:3` „Copyright (c) 2025 AgentLand Contributors“. Prečítané
2026-10-19 na klone `--depth 1` (commit `652b269` z 2026-10-15), len čítanie: nič sme nespúšťali ani neinštalovali.
Pôvod: video V5 (ai.with.andrew), `../../referencie-z-videi/references/naucene-z-videi.md`.

Stav 2026-10-19: 161,3k hviezd, 26,1k forkov, 774 commitov (stránka repozitára); 100 prispievateľov, so
zahrnutím anonymných 107 (shields.io); vznik október 2025 (shields.io); README: „Born from a Reddit thread“
(`README.md:21`).

## 1. Čo to je

Knižnica **promptov rolí v Markdowne** („agent personalities“), ktoré sa kopírujú ako subagenti do Claude Code
(`~/.claude/agents/`) alebo sa prekladajú do formátov iných nástrojov (`scripts/convert.sh`, priečinok
`integrations/`). Nie je to bežiaci systém: nemá hooky, server ani pamäť. Tú „pamäť“, o ktorej súbory píšu
(„Learning & Memory“), súbor sám nič neukladá ani nenačíta.

| Čo | Počet (náš počet na klone) | Zdroj |
| --- | --- | --- |
| súbory agentov s frontmatter | **282** v 18 divíziách | `divisions.json`, priečinky |
| divízie | engineering 65, specialized 59, marketing 37, game-development 21, gis 13, security 12, design 10, sales 9, testing 9, paid-media 7, project-management 7, academic 6, product 6, spatial-computing 6, support 6, finance 5, healthcare 3, research 1 | priečinky |
| README o sebe | „230+ Specialized Agents“ | `README.md:729`, `:1151` |
| stratégia NEXUS | `strategy/nexus-strategy.md` (1 110 riadkov), 7 playbookov fáz 0 až 6, 4 runbooky, šablóny odovzdania | `strategy/` |
| runbooky | startup-mvp 18 agentov, enterprise-feature 22, marketing-campaign 14, incident-response 10 | `strategy/runbooks.json` |
| rozsah textu | medián 243 riadkov a 1 917 slov na agenta, spolu 553 051 slov | náš počet |

## 2. Formát definície agenta

Frontmatter: povinné `name`, `description`, `color` (inak chyba lintera, `scripts/lint-agents.sh:39`); takmer
všade aj `emoji` (282) a `vibe` (281); `tools` len 17 súborov, `services` 4. Sekcie „Identity“, „Core Mission“
a „Critical Rules“ sú len odporúčané, ich chýbanie dá varovanie (`lint-agents.sh:40`, `:149-160`).

Šablóna (`CONTRIBUTING.md:87-162`) a ako často ju súbory naozaj majú (nadpisy, náš počet z 282):

| Sekcia | Čo v nej má byť | Výskyt |
| --- | --- | --- |
| Identity & Memory | rola, osobnosť, „pamäť“, skúsenosť | 277 |
| Core Mission | 3 hlavné zodpovednosti s výstupmi, „Default requirement“ | 255 |
| Critical Rules | doménové pravidlá a hranice | 258 |
| Technical Deliverables | ukážky výstupov: kód, šablóny, dokumenty | 218 |
| Workflow Process | kroky (objav, plán, vykonanie, revízia) | 239 |
| Communication Style | tón a typické vety | 244 |
| Learning & Memory | čo sa „učí“ | 259 |
| Success Metrics | merateľné výsledky „s číslami“ | 244 |
| Advanced Capabilities | pokročilé techniky | 195 |

Delenie na **Persona** (identita, štýl, pravidlá) a **Operácie** (poslanie, výstupy, postup, metriky)
(`CONTRIBUTING.md:164-185`) je užitočné: oddeľuje „kto si“ od „čo odovzdáš a podľa čoho sa to meria“.

Tvrdenie videa, že „každý“ agent má osobnosť, postup, výstupy a metriky, platí pre väčšinu, nie pre všetkých:
metriky má 244, výstupy 218 a postup 239 z 282.

## 3. Orchestrátor (`specialized/agents-orchestrator.md`, 366 riadkov)

- Postup pre **vývoj softvéru**: „PM → ArchitectUX → [Dev ↔ QA Loop] → Integration“ (`:22`). Video ho opisuje ako
  „operations head“ nad všetkými divíziami; v súbore riadi len vývojárov a QA.
- Dobré pravidlá: každá úloha musí prejsť QA pred ďalšou (`:28`, `:42`), najviac 3 pokusy, potom eskalácia
  (`:44`, `:137-141`), nejasný dôkaz = FAIL (`:167`), rozhodnutia len podľa skutočných výstupov (`:43`).
- Slabé miesta: „Handle errors and bottlenecks without manual intervention“ (`:36`); po 3 zlyhaniach „Mark task as
  blocked, continue pipeline“ (`:161-162`), teda bez človeka ďalej.
- Mená nesedia: orchestrátor volá „ArchitectUX“ a „EvidenceQA“ (`:73`, `:90`), ale `name` vo frontmatter je
  „UX Architect“ (`design/design-ux-architect.md:2`) a „Evidence Collector“ (`testing/testing-evidence-collector.md:2`);
  „ArchitectUX“ je len meno v tele promptu (`design-ux-architect.md:11`). Odovzdanie stojí na tom, či model mená
  správne priradí.
- Reality Checker a Evidence Collector ako povinný prvý krok spúšťajú `./qa-playwright-capture.sh`
  (`testing-reality-checker.md:63`, `testing-evidence-collector.md:44`, `project-manager-senior.md:97`); taký skript
  v repozitári nie je.

## 4. NEXUS: odovzdanie a eskalácia (`strategy/coordination/handoff-templates.md`)

- **Štandardné odovzdanie** (`:7-47`): Od, Komu, Fáza, Úloha, Priorita, Čas; Kontext (aktuálny stav, relevantné
  súbory s tým, čo obsahujú, závislosti, obmedzenia); Požadovaný výstup s **merateľnými kritériami prijatia**;
  Kvalita („Must pass“, **„Evidence required“**, komu ide výstup a v akom formáte).
- **QA verdikt PASS a FAIL** (`:49-146`): pri FAIL problémy so závažnosťou, stav kritérií prijatia, pokyny na opravu.
- **Eskalácia po 3 pokusoch** (`:148-205`): história pokusov (čo sa našlo, čo sa opravilo, prečo stále FAIL),
  príčina, možnosti „Reassign, Decompose, Revise approach, Accept current state with documented limitations, Defer“
  (`:189-193`), dopad. Rozhoduje však agent: „Decision maker: [Agents Orchestrator / Studio Producer]“ (`:201`).
- V marketingovom runbooku schvaľuje obsah pred uverejnením agent Brand Guardian
  (`strategy/runbooks/scenario-marketing-campaign.md:184`).

## 5. Inštalácia do Claude Code a čo zapisuje

- Skript: `./scripts/install.sh --tool claude-code` skopíruje `*.md` do `~/.claude/agents/` (`install.sh:15`,
  `:862-875`; `README.md:46-57`, `:836`); `--division` a `--agent` vyberú časť. `cp` prepíše rovnomenný súbor
  (`install.sh:340`). Skripty `install.sh` a `convert.sh` nič nesťahujú (žiadne `curl`, `wget`, `npm`).
- Aplikácia **Agency Agents** (github.com/msitarzewski/agency-agents-app, MIT, Tauri 2 a Svelte 5, vydanie v0.3.2
  podľa shields.io 2026-10-19): podľa jej README zapisuje do `~/.claude/agents/*.md`, vedie lokálnu evidenciu
  inštalácií a zistí zmenu súboru mimo aplikácie, „does not run telemetry“; macOS podpísaný a notarizovaný,
  **Windows `.exe` nepodpísaný** (SmartScreen); voliteľne prihlásenie cez GitHub (OAuth Device Flow); aktualizácie
  overené vloženým kľúčom, na macOS, „opt-in and gated by Settings“. README hlavného repozitára píše „it
  auto-updates“ (`README.md:13`). Aplikáciu sme nespúšťali.
- Claude Code (code.claude.com/docs/en/sub-agents, čítané 2026-10-19): `tools` „Inherits every tool available to
  subagents if omitted“; Claude deleguje **automaticky podľa `description`**; projektové `.claude/agents/` majú
  prednosť pred `~/.claude/agents/`; subagent má vlastné kontextové okno a rozhovor nevidí.
- Dôsledok: **265 z 282** agentov nemá `tools`, teda po inštalácii dedia všetky nástroje (Bash, zápis, MCP).
  Zo 17 s `tools` má 16 webové nástroje (WebFetch, WebSearch) spolu so zápisom (Write, Edit), z toho 7 z oddelenia
  paid-media aj Bash: cudzí obsah z webu a zápis u jedného agenta. Opisy všetkých 282 majú
  62 118 znakov, podľa nich Claude vyberá, komu úlohu dá. Inštalácia do `~/.claude/agents/` platí pre všetky
  projekty, aj pre repozitár s webmi.

## 6. Kvalita obsahu: čo nesedí

| Čo | Kde | Prečo nás to zaujíma |
| --- | --- | --- |
| cieľové metriky bez zdroja: Instagram „Engagement Rate: 3.5%+“, „Reach Growth: 25% month-over-month“, „UGC Generation: 200+ branded posts per month“ | `marketing/marketing-instagram-curator.md:83-91` | pre salón v Nitre nezmysel; čísla bez zdroja nepreberáme |
| „Engagement Rate: 8%+ (industry average: 5.96%)“ bez zdroja | `marketing/marketing-tiktok-strategist.md:84` | priemer bez zdroja |
| „50%+ retention at the 3-minute mark“ | `marketing/marketing-video-optimization-specialist.md:114` | pri Shorts (do 3 min) nepoužiteľné |
| IGTV v pláne obsahu | `marketing-instagram-curator.md:19`, `:57`, `:104` | samostatnú aplikáciu IGTV Instagram ukončil vo februári a marci 2022 (TechCrunch, 9to5Mac) |
| „A one-point increase in a hotel's review score can increase revenue by up to 9%“ bez zdroja | `specialized/hospitality-guest-services.md:53` | číslo bez zdroja |
| žiadosť o verejnú recenziu len pri „exceptional“ zážitku, inak odpoveď e-mailom | `hospitality-guest-services.md:375` | Google zakazuje „selectively solicit positive reviews“ (Prohibited & restricted content, support.google.com/contributionpolicy/answer/7400114) |
| „Zero Confirmation: Run the entire pipeline without asking for user approval“, „never ask for permission … publish“ | `marketing/marketing-carousel-growth-engine.md:47`, `:25` | opak nášho pravidla 1 (nič sa neuverejní bez majiteľa) |
| README cituje Evidence Collector „I default to finding 3-5 issues“ | `README.md:709`, `CONTRIBUTING.md:192` | súbor dnes píše „Zero reproducible issues is a valid finding for the tested scope“ (`testing-evidence-collector.md:29`); README a vzor zaostávajú za súborom |
| „Let me add a celebration animation that reduces task completion anxiety by 40%“ ako ukážka osobnosti | `README.md:721` | vymyslené číslo ako vzor štýlu |

Protipríklad v tej istej knižnici: Multi-Platform Publisher „Draft-First Safety: Always sync as draft. Never
auto-publish“ (`marketing/marketing-multi-platform-publisher.md:33`), teda to isté ako naše „len návrhy“.

## 7. Porovnanie: gstack, ECC, Agency Agents a my

| | gstack 1.91.101.0 | ECC 2.2.3 | Agency Agents (652b269) | My |
| --- | --- | --- | --- | --- |
| čo to je | proces sprintu, skill = rola | katalóg agentov, skills, príkazov a hookov | 282 promptov rolí v 18 divíziách + stratégia NEXUS | skripty pre Workflow, slovenské skills z praxe |
| hĺbka roly | hlboké postupy s pravidlami dôkazu | rôzna | široké, často plytké; metriky bez zdroja | postup, hranice, schéma, citát `súbor:riadok` |
| inštalácia | `./setup`, Bun, Stop hook | plugin alebo `npx`, 27 hookov | kópia `.md` do `~/.claude/agents/` alebo aplikácia | nič |
| bežiaci kód | binárky, prehliadač | hooky | žiadny (len skripty na kópiu a prevod) | naše skripty v toolboxe |
| nástroje agenta | podľa skillu | podľa agenta | 265 z 282 dedí všetky | `tools` a hranice v zadaní |
| kto rozhoduje | človek pri otázkach | človek pri bráne | eskalácia na agenta (Orchestrator, Studio Producer) | majiteľ (D1) |
| obsah a predaj | prakticky nič | content-engine, brand-voice | marketing 37, sales 9, paid-media 7, support 6 | `instagram-salon`, `youtube-shorts`, `booqme-rezervacie` |

## 8. Čo preberáme (ako vlastný slovenský text, bez kopírovania súborov)

1. **Karta roly** (štruktúra definície roly) z `CONTRIBUTING.md:87-185`, upravená: bez osobnosti a pamäte, s
   dvoma druhmi metrík (kontrola výstupu hneď a výsledok po uverejnení z údajov majiteľa), s hranicami a
   eskaláciou. → `sablony-rol.md`, časť 0b.
2. **Odovzdávací blok** z `handoff-templates.md:7-47` (stav, súbory, merateľné kritériá prijatia, požadovaný dôkaz,
   komu výstup ide). → `sablony-rol.md`, časť 0.
3. **Eskalácia po 3 kolách** s históriou a piatimi možnosťami z `handoff-templates.md:148-205`, ale rozhoduje
   majiteľ cez otázku D1. → `sablony-rol.md`, časť 8.
4. **Pravidlá dôkazu QA**: „zero issues“ alebo dokonalé skóre od predošlého agenta je podozrivé
   (`testing-reality-checker.md:43`); nula nálezov platí len s opísaným rozsahom testu
   (`testing-evidence-collector.md:29`, `:103`); snímka vyplneného formulára nedokazuje odoslanie (`:23`); nálezy
   nevymýšľať kvôli kvóte (`:30`); tvrdenia „prémiový, luxusný“ len s dôkazom (`testing-reality-checker.md:44`).
   → `SKILL.md`, zásada 6, a QA v `sablony-rol.md`, časť 5.
5. **Roly pre obsah a predaj prevádzky** (textár a obsah, ponuka a rezervácie, recenzie a sťažnosti) z myšlienok
   `sales-offer-lead-gen-strategist.md:88`, `:96`, `:105` („Never build capture you can't honor“, „Validate before
   you scale“, merať príležitosti, nie kliky), `hospitality-guest-services.md:222-297` (postup pri sťažnosti HEARD,
   „Never: 'I apologize for any inconvenience.'“, `:246`) a `marketing-short-video-editing-coach.md:405-408`
   (technické kritériá videa). → `sablony-rol.md`, časť 9.
6. **Jedno meno roly všade**: tá istá menovka v zadaní, v `label` skriptu aj v schéme (poučenie z nesediacich mien
   orchestrátora).

## 9. Čo nepreberáme a prečo

| Čo | Prečo nie | Zdroj |
| --- | --- | --- |
| inštalácia 282 agentov (skriptom alebo aplikáciou) do `~/.claude/agents/` alebo `.claude/agents/` repozitára s webmi | platí pre všetky projekty; 265 bez `tools` dedí všetky nástroje; Claude ich vyberá automaticky podľa opisov; `cp` prepíše rovnomenné súbory | `install.sh:340`, `:862-875`; docs Claude Code |
| desktopová aplikácia na pracovnom počítači s webmi | cudzí program so zápisom do `~/.claude`, na Windows nepodpísaný | README agency-agents-app |
| osobnosť a „pamäť“ ako súčasť roly | rolu u nás určuje postup, hranice a schéma; tón len pri textoch (`../../instagram-salon/references/sablona-hlas.md`) | `CONTRIBUTING.md:189-192` |
| cieľové metriky bez zdroja (3,5 %, 8 %, 200+ UGC, 50 % v 3. minúte) | vymyslené alebo nesediace čísla; u nás len vlastná základňa a údaje majiteľa | časť 6 |
| autonómny orchestrátor („without manual intervention“, „continue pipeline“ po 3 zlyhaniach) | stop a otázka majiteľovi | `agents-orchestrator.md:36`, `:161-162` |
| agent ako schvaľovateľ (Brand Guardian pred uverejnením, Orchestrator ako „Decision maker“) | schvaľuje majiteľ presný súbor | `scenario-marketing-campaign.md:184`, `handoff-templates.md:201` |
| Carousel Growth Engine (denné uverejňovanie, generované obrázky, „Zero Confirmation“) | pravidlá 1 a 3 praxe | `marketing-carousel-growth-engine.md:25`, `:47` |
| žiadosť o recenziu len od spokojných | selektívne vyžiadanie zakazuje Google | `hospitality-guest-services.md:375` |
| B2B predaj (MEDDPICC, outbound sekvencie, studené e-maily), automatické rozosielanie správ | náš predaj je rezervácia; automatické správy nie (zákon 452/2021 § 116) | `sales/`, `specialized/report-distribution-agent.md` |
| čínske platformy, hry, GIS, zdravotníctvo USA, štátne zákazky | netýka sa prevádzok | `marketing/`, `game-development/`, `gis/`, `healthcare/` |
| kopírovanie textov agentov do toolboxu | nepotrebujeme; ak by sa niečo kopírovalo, tak s `LICENSE` („Copyright (c) 2025 AgentLand Contributors“), aj keď README píše „Attribution appreciated but not required“ (`README.md:1145`) | `LICENSE` |

## 10. Inštalácia na vlastnom počítači (len popis, nie v repozitári s webmi)

Ak si to niekto chce vyskúšať: na vlastnom počítači, v testovacom používateľskom profile alebo s vlastným
`CLAUDE_CONFIG_DIR` (skript ho rešpektuje, `install.sh:54`, `:386-410`), len vybrané agenty a nikdy s
`--dangerously-skip-permissions`. Príkazy sú z README (čítané 2026-10-19); my sme ich nespúšťali.

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git
cd agency-agents
./scripts/install.sh --tool claude-code --agent testing-reality-checker --dry-run   # najprv len ukážka
./scripts/install.sh --tool claude-code --agent testing-reality-checker             # jeden agent
```

Pred použitím: doplniť do frontmatter `tools` (napr. `Read, Grep, Glob`), inak agent dedí všetky nástroje.
Odinštalovanie: zmazať skopírované súbory z `~/.claude/agents/`.
