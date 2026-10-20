---
name: build-premium-websites
description: Research, art-direct, implement and verify distinctive cinematic websites and maintainable web products with a senior decision workflow. Use for premium websites, graphic designer prompts and briefs, brand systems, typography, UX, film-like scrolling, seamless transitions, VFX, shaders, WebGL/WebGPU, interactive 3D, service sites, commerce, CMS, authenticated platforms, performance, accessibility, release and developer handoff. Contains exactly 100 selectively loaded operational chapters across 10 domains, detailed designer prompt templates, searchable references/techniques, planning and evidence utilities. Preserve truthful content, proportionate scope and working journeys; never promise a price, universal expertise or a quality multiplier.
---

# Premium & Cinematic Web Studio

Work as a responsible senior collaborator across the website lifecycle: make defensible choices, implement the authorized outcome, inspect it, correct important faults and deliver evidence. Explain decisions in the user's language; use Slovak for this user. This is one skill with exactly 100 operational chapters, not a requirement to load everything or install every tool.

## Operating contract

1. Read [C001: Senior operating contract](references/senior-operating-contract.md) for the decision standard. Distinguish research, a prompt, a prototype, an existing change and a release. A skill update does not authorize an unrelated client build.
2. Inspect the actual project, applicable instructions, stack, working tree, real content/media and visitor journey. Preserve others' work and existing authorization. Resolve ordinary reversible choices without redundant questions.
3. Choose the smallest useful set of chapters from the index or a route below. Use the chapter's decision, deliverable and verification contract. Do not load all 100 chapters into context.
4. State purpose, source of truth, constraints and the next observable result. Keep missing facts unknown. For substantial design work compare genuinely different compositions; preserve an approved direction for a minor fix.
5. Build excellent still composition and a working semantic journey before choreography. Give each changing property one owner. Define entry, hold, exit, interruption, reverse behavior, cleanup, mobile and reduced-motion alternatives.
6. Keep business authority in the backend/provider. Preserve navigation, focus, URLs, honest errors and real confirmation. A cinematic layer must not determine price, permission or whether a transaction succeeded.
7. Verify actual risks with suitable methods. Separate source review, mocks, browser interaction, visual observation, runtime measurement and real provider tests. Fix consequential observed defects; keep blocked checks explicit.
8. Read [C100: Senior final review](references/senior-final-review.md), finish the applicable save/release workflow and report the completed result, evidence and material limits. Stop optional polishing when the authorized outcome is sufficiently verified.

For a major architecture, security, payment, data or regulated decision, use the relevant specialist skill and current primary sources when needed. Senior judgment includes recognizing an unsupported assumption; this skill does not confer universal expertise or certification.

## Detailed graphic designer prompts

Use [C014](references/prompt-adaptation.md) and `assets/designer-prompts/master.md`. Select one D001–D024 task from `assets/catalogs/designer-prompts.json`. Compose the master, real brief and task-specific directions with `scripts/designer.py`. Deliver the resulting prompt when the user asks for a prompt; execute design-tool work only when requested/authorized. Never claim a Figma or Adobe file exists without successful creation.

Each prompt covers inputs, composition, typography, color, media, responsive behavior, states, motion where relevant, editable output, developer handoff and acceptance. Replace missing business facts with explicit unknowns. The 24 original task templates are separate from the preserved 1,000 reference prompt instances; they are not 24 externally sourced designer projects.

## 100 scenario briefs with visual effects

Use Z001–Z100 from `assets/catalogs/designer-briefs.json` for a complete scenario-based assignment. Search first, then run `scripts/briefs.py show Z001`; it prints the shared senior contract followed by only the selected brief. Each assignment includes a chapter/prompt route and conditional specialist skill selection. Each assignment contains reference provenance, required inputs, art direction, a specific effect, storyboard timing, mobile/reduced-motion fallback, deliverables and acceptance. The set applies 20 effect recipes to 100 distinct scenarios; it does not claim 100 unique effects or 100 real client commissions.

Adapt the selected brief to the user's actual brand, audience, facts and scope. Treat timings as starting proposals and references as inspiration, not proof of live animation. Do not launch a complete redesign for a small change. Use D001–D024 for a task-specific prompt; use Z001–Z100 for a fuller scenario. Read only relevant C chapters for execution. These assets supplement, rather than increase, the exactly 100 operational chapters.

## Bounded lookup

Run from the actual installed skill directory; persistence may rename its folder.

```bash
python scripts/catalog.py route graphic-designer
python scripts/catalog.py route service-site
python scripts/catalog.py search --kind chapters --query "rezervacie" --limit 3
python scripts/catalog.py show C066
python scripts/catalog.py search --kind techniques --query "prechod" --limit 3
python scripts/catalog.py show FX014
python scripts/catalog.py show S048
python scripts/catalog.py search --kind prompts --reference W005 --phase motion --limit 1
python scripts/briefs.py search "sluchadla" --limit 3
python scripts/briefs.py show Z100
python scripts/designer.py list
python scripts/designer.py render D007 --brief assets/templates/designer-brief.json
python scripts/studio.py plan assets/templates/project-brief.json
python scripts/studio.py memory assets/templates/memory-plan.json
python scripts/studio.py init-review assets/templates/project-brief.json --build actual-build-id
```

Search supports Slovak with or without diacritics and English. C = operational chapter; D = original designer task; W/T = reference/tool; P/O = published/original adapted prompt; FX = technique; S = dated primary source. Routes are starting shortlists, not orders to read every listed chapter. A small fix can use `minor-fix`; use `enterprise` only for real enterprise requirements.

## 100 chapters in 10 domains

### 1. Stratégia a seniorské rozhodovanie

| ID | Chapter | Use |
|---|---|---|
| C001 | [Seniorský spôsob práce](references/senior-operating-contract.md) | senior operating contract |
| C002 | [Kompletný produkčný postup](references/production-playbook.md) | production playbook |
| C003 | [Riadenie produkcie](references/studio-operating-system.md) | studio operating system |
| C004 | [Rozsah, rozpočet a hodnota](references/scope-and-value.md) | scope and value |
| C005 | [Discovery a overiteľné požiadavky](references/discovery-and-requirements.md) | discovery and requirements |
| C006 | [Odhad práce a kompromisy](references/estimation-and-tradeoffs.md) | estimation and tradeoffs |
| C007 | [Architektonické rozhodnutia](references/architecture-decisions.md) | architecture decisions |
| C008 | [Komunikácia a zmeny rozsahu](references/stakeholder-and-change-control.md) | stakeholder and change control |
| C009 | [Riziká a závislosti projektu](references/risk-and-dependency-planning.md) | risk and dependency planning |
| C010 | [Výber nástrojov a schopností](references/tool-routing.md) | tool routing |

### 2. Výskum a vizuálny smer

| ID | Chapter | Use |
|---|---|---|
| C011 | [Analýza referencií a prenos princípov](references/reference-analysis.md) | reference analysis |
| C012 | [Práca s katalógmi](references/catalog-guide.md) | catalog guide |
| C013 | [Metódy odvodené z referencií](references/learned-methods.md) | learned methods |
| C014 | [Detailné prompty a zadania pre dizajnéra](references/prompt-adaptation.md) | prompt adaptation |
| C015 | [Pôvod zdrojov a hranice dôkazov](references/provenance.md) | provenance |
| C016 | [Umelecký smer a filmový scenár](references/art-direction.md) | art direction |
| C017 | [Vizuálne alternatívy a kritika](references/visual-direction-review.md) | visual direction review |
| C018 | [Značka a jednotný vizuálny systém](references/brand-systems.md) | brand systems |
| C019 | [Texty, ponuka a dôveryhodnosť](references/copywriting-and-evidence.md) | copywriting and evidence |
| C020 | [Publikum a pozícia produktu](references/audience-and-positioning.md) | audience and positioning |

### 3. UX a grafický dizajn

| ID | Chapter | Use |
|---|---|---|
| C021 | [Informačná architektúra](references/information-architecture.md) | information architecture |
| C022 | [Používateľská cesta a konverzia](references/journey-and-conversion.md) | journey and conversion |
| C023 | [Typografia a fonty](references/typography-and-fonts.md) | typography and fonts |
| C024 | [Mriežka, proporcie a kompozícia](references/grids-and-layout.md) | grids and layout |
| C025 | [Farby, kontrast a stavové významy](references/color-and-contrast.md) | color and contrast |
| C026 | [Dizajnové tokeny a komponenty](references/design-tokens-and-components.md) | design tokens and components |
| C027 | [Kompozície jednotlivých sekcií](references/section-recipes.md) | section recipes |
| C028 | [Formuláre a validácia](references/forms-and-validation.md) | forms and validation |
| C029 | [Navigácia a vyhľadávacie rozhranie](references/navigation-and-search.md) | navigation and search |
| C030 | [Odolnosť dizajnu voči obsahu](references/content-edge-cases.md) | content edge cases |

### 4. Filmový pohyb a kontinuita

| ID | Chapter | Use |
|---|---|---|
| C031 | [Jazyk a plynulosť pohybu](references/motion-language.md) | motion language |
| C032 | [Filmové a webové prechody](references/cinematic-transitions.md) | cinematic transitions |
| C033 | [Kontinuita scén a kamery](references/scene-continuity.md) | scene continuity |
| C034 | [Storyboard a animatik webu](references/storyboards-and-animatics.md) | storyboards and animatics |
| C035 | [Easing, časovanie a fyzika pohybu](references/easing-and-time.md) | easing and time |
| C036 | [Filmové rozprávanie pri skrolovaní](references/scroll-storytelling.md) | scroll storytelling |
| C037 | [Zdieľané prvky a prechody stránok](references/shared-element-and-route-motion.md) | shared element and route motion |
| C038 | [Mikrointerakcie a spätná väzba](references/microinteractions-and-feedback.md) | microinteractions and feedback |
| C039 | [Filmová typografia a kinetický text](references/cinematic-typography.md) | cinematic typography |
| C040 | [Zvuk a ovládanie médií](references/sound-and-media-control.md) | sound and media control |

### 5. 3D, VFX a médiá

| ID | Chapter | Use |
|---|---|---|
| C041 | [Kamera a príprava 3D scény](references/camera-and-assets.md) | camera and assets |
| C042 | [VFX a compositing](references/vfx-compositing.md) | vfx compositing |
| C043 | [Produkcia a výkon médií](references/asset-performance-pipeline.md) | asset performance pipeline |
| C044 | [Svetlo a materiály v 3D](references/lighting-and-materials.md) | lighting and materials |
| C045 | [Výroba a ladenie shaderov](references/shader-production.md) | shader production |
| C046 | [Častice a simulácia](references/particles-and-simulation.md) | particles and simulation |
| C047 | [Optimalizácia modelov a LOD](references/model-optimization-and-lod.md) | model optimization and lod |
| C048 | [Video a obrazové sekvencie](references/video-and-image-sequences.md) | video and image sequences |
| C049 | [Práva a autenticita podkladov](references/asset-rights-and-authenticity.md) | asset rights and authenticity |
| C050 | [Adaptívna kvalita a náhradné zobrazenie](references/adaptive-rendering-and-fallbacks.md) | adaptive rendering and fallbacks |

### 6. Frontend a architektúra rozhrania

| ID | Chapter | Use |
|---|---|---|
| C051 | [Implementačné recepty pohybu](references/implementation-recipes.md) | implementation recipes |
| C052 | [Framework a stratégia renderovania](references/framework-and-rendering-strategy.md) | framework and rendering strategy |
| C053 | [Komponenty a vlastníctvo stavu](references/component-and-state-boundaries.md) | component and state boundaries |
| C054 | [Životný cyklus a uvoľňovanie zdrojov](references/lifecycle-and-resource-ownership.md) | lifecycle and resource ownership |
| C055 | [Súbeh, asynchrónne operácie a transakcie](references/async-concurrency-and-transactions.md) | async concurrency and transactions |
| C056 | [URL, história a priame odkazy](references/urls-history-and-deep-links.md) | urls history and deep links |
| C057 | [Mobilná kompozícia a dotyk](references/responsive-mobile-composition.md) | responsive mobile composition |
| C058 | [Schopnosti prehliadača a progresívne vylepšenie](references/browser-capabilities-and-enhancement.md) | browser capabilities and enhancement |
| C059 | [Odolné rozhranie a obnova po chybe](references/resilient-ui-and-error-recovery.md) | resilient ui and error recovery |
| C060 | [Závislosti a reprodukovateľný build](references/dependency-and-build-hygiene.md) | dependency and build hygiene |

### 7. Obsah, dáta a integrácie

| ID | Chapter | Use |
|---|---|---|
| C061 | [Kontrakty obsahu a integrácií](references/content-and-integration-contracts.md) | content and integration contracts |
| C062 | [CMS a redakčný pracovný postup](references/cms-editorial-workflows.md) | cms editorial workflows |
| C063 | [API kontrakty a validácia dát](references/api-contracts-and-validation.md) | api contracts and validation |
| C064 | [Dátový model a migrácie](references/data-modeling-and-migrations.md) | data modeling and migrations |
| C065 | [Identita a oprávnenia](references/authentication-and-authorization.md) | authentication and authorization |
| C066 | [Rezervácie a dostupnosť](references/booking-and-availability.md) | booking and availability |
| C067 | [Obchod, ceny a checkout](references/commerce-pricing-and-checkout.md) | commerce pricing and checkout |
| C068 | [Webhooky a úlohy na pozadí](references/webhooks-and-background-jobs.md) | webhooks and background jobs |
| C069 | [Lokalizácia, mena a čas](references/localization-and-time.md) | localization and time |
| C070 | [Vyhľadávanie a veľké dáta](references/search-and-large-datasets.md) | search and large datasets |

### 8. Výkon, prístupnosť a dôvera

| ID | Chapter | Use |
|---|---|---|
| C071 | [Výkon a prístupnosť v praxi](references/performance-accessibility.md) | performance accessibility |
| C072 | [Načítanie a Core Web Vitals](references/loading-and-core-web-vitals.md) | loading and core web vitals |
| C073 | [Profilovanie runtime a pamäte](references/runtime-profiling-and-memory.md) | runtime profiling and memory |
| C074 | [Klávesnica, fokus a dialógy](references/keyboard-focus-and-dialogs.md) | keyboard focus and dialogs |
| C075 | [Sémantika a čítačky obrazovky](references/semantic-content-and-screen-readers.md) | semantic content and screen readers |
| C076 | [Obmedzený pohyb a zmyslová prístupnosť](references/reduced-motion-and-sensory-access.md) | reduced motion and sensory access |
| C077 | [Bezpečnosť webovej aplikácie](references/application-security.md) | application security |
| C078 | [Súkromie, súhlas a minimum dát](references/privacy-consent-and-minimal-data.md) | privacy consent and minimal data |
| C079 | [Cache a konzistentnosť dát](references/caching-and-consistency.md) | caching and consistency |
| C080 | [Offline stav a životný cyklus prehliadača](references/offline-reconnect-and-browser-lifecycle.md) | offline reconnect and browser lifecycle |

### 9. Overovanie a dodanie

| ID | Chapter | Use |
|---|---|---|
| C081 | [Brány kvality](references/quality-gates.md) | quality gates |
| C082 | [Revízia a diagnostika](references/review-and-debug.md) | review and debug |
| C083 | [Dôkazy a akceptácia](references/evidence-and-acceptance.md) | evidence and acceptance |
| C084 | [Vizuálna kontrola a regresie](references/visual-regression-and-art-review.md) | visual regression and art review |
| C085 | [Integračné a end-to-end testy](references/integration-and-end-to-end-tests.md) | integration and end to end tests |
| C086 | [Testovanie prístupnosti](references/accessibility-testing.md) | accessibility testing |
| C087 | [Výkonnostné rozpočty a regresie](references/performance-budgets-and-regression.md) | performance budgets and regression |
| C088 | [Nasadenie a návrat predchádzajúcej verzie](references/release-and-rollback.md) | release and rollback |
| C089 | [Monitoring a riešenie incidentov](references/observability-and-incidents.md) | observability and incidents |
| C090 | [Inžinierstvo a odovzdanie](references/engineering-and-handoff.md) | engineering and handoff |

### 10. Prevádzka a dlhodobá hodnota

| ID | Chapter | Use |
|---|---|---|
| C091 | [SEO a migrácia adries](references/seo-and-migration.md) | seo and migration |
| C092 | [Analytika a experimenty](references/analytics-and-experimentation.md) | analytics and experimentation |
| C093 | [Údržba a zastarávanie](references/maintenance-and-deprecation.md) | maintenance and deprecation |
| C094 | [Technický dlh a refaktoring](references/technical-debt-and-refactoring.md) | technical debt and refactoring |
| C095 | [Tímové kontrakty a code review](references/team-contracts-and-code-review.md) | team contracts and code review |
| C096 | [Enterprise riadenie a oddelenie tenantov](references/enterprise-governance-and-multitenancy.md) | enterprise governance and multitenancy |
| C097 | [Náklady, kapacita a efektívnosť](references/cost-capacity-and-sustainability.md) | cost capacity and sustainability |
| C098 | [Produkčný rozsah a dodávatelia](references/procurement-and-production-scope.md) | procurement and production scope |
| C099 | [Praktické učenie a zlepšovanie](references/benchmark-and-learning.md) | benchmark and learning |
| C100 | [Záverečná seniorská kontrola](references/senior-final-review.md) | senior final review |

## Reusable production resources

- `assets/templates/production-contract.md`, `project-brief.json`: purpose, scope, dependencies and acceptance.
- `assets/templates/designer-brief.json`, `assets/designer-prompts/`: detailed original designer briefs and task prompts.
- `assets/templates/motion-spec.json`, `shot-plan.json`, `scene-plan.json`: explicit motion and scene contracts; fictional examples, not client facts.
- `assets/templates/memory-plan.json`, `acceptance-matrix.csv`: nominal payload and unexecuted check templates.
- `assets/recipes/motion-core.mjs`, `native-motion.mjs`, `gsap-scroll.mjs`: scoped progress, ownership and animation recipes.
- `assets/recipes/scene-timeline.mjs`, `latest-resource.mjs`, `owned-selection.mjs`: scene sampling, latest-read coordination and explicit resource adoption. These are not payment transaction systems or complete renderers.
- `assets/motion-lab/index.html`: local instructional study, not a finished client site.
- `assets/catalogs/acceptance-checks.json`, `application-cases.json`: concrete check definitions and exercise prompts; catalog presence is not proof of execution.
- `scripts/studio.py`: planning, nominal memory estimation and evidence-record consistency. It cannot authenticate human observations or perform browser checks.
- `scripts/validate_bundle.py` and bundled targeted tests: internal integrity and recorded utility behavior, not universal website certification.

## Evidence and maintenance

Read [C015](references/provenance.md) for source boundaries and [C083](references/evidence-and-acceptance.md) for acceptance methods. Historical executions are in [motion evidence](assets/evidence/motion-evidence.md) and [production evidence](assets/evidence/upgrade-evidence.md); current expansion evidence is `assets/evidence/senior-upgrade.json`. These logs are excluded from the 100 operational chapters.

Preserve the original catalogs: 100 website references, 100 tool/resource entries and 1,000 prompt instances (100 published originals plus 900 original reference/phase adaptations). Cataloged tools are not necessarily installed. Static previews do not prove live animation. Recheck current API versions, licenses, prices and jurisdiction-specific requirements before concrete production decisions.

Do not claim that more chapters retrain the model, that all effects were runtime tested, that a quality multiplier was measured, or that effects guarantee €1,500–€400,000 value. Use the price ambition to clarify scope, production, integrations, reliability and maintainability. Improve this skill from an observed failure and verified correction, not from invented benchmarks.
