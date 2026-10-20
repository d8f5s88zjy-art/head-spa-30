# 012 — Práca s katalógmi

Search matches all query terms in descriptive fields. Short terms match complete words; terms of four or more characters may match word prefixes. URLs, license boilerplate and evidence disclaimers are excluded from search scoring. Use a broader single term when a specific multiword query has no match; absence of a direct reference is not evidence that a similar industry was reviewed.

## Contents

- IDs and coverage
- Selection method
- Search and phase mapping
- Evidence boundaries

## IDs and coverage

| ID | Meaning | Data file |
|---|---|---|
| C001–C100 | 100 operational chapters in ten domains, with decision, deliverable and verification contracts | `assets/catalogs/chapters.json` |
| D001–D024 | 24 original detailed graphic designer task templates, composed with one master and actual brief | `assets/catalogs/designer-prompts.json` |
| W001–W100 | 100 distinct website project references, project-page metadata and reviewed submission previews | `assets/catalogs/websites.json` |
| T001–T100 | 100 tools/resources; 60 GitHub repositories and 40 other sources | `assets/catalogs/tools.json` |
| P001–P100 | 100 published original prompt documents from three MIT-licensed repositories | `assets/catalogs/prompts.jsonl` |
| O001–O900 | 100 distinct practice briefs × 9 reusable production phases, written for this catalog | `assets/catalogs/prompts.jsonl` |
| TT... | TikTok discovery metadata, not completed video watches | `assets/catalogs/social.json` |
| FX001–FX056 | Original motion, transition, camera, VFX and interaction recipes | `assets/catalogs/techniques.json` |
| S001–S059 | Dated primary documentation/source records with evidence levels | `assets/catalogs/sources.json` |

Read `manifest.json` for the exact timestamp and counts. Publication does not establish popularity or production use. The public examples preserve their original language; the original phase prompts are Slovak.

The cinematic extension is dated separately from the original catalog. Use `--kind techniques`, optional `--family transition` (or motion/camera/vfx/interaction), and `show FX...` for full recipes. Use `show S...` for a cited mechanism's source. `source_ids` support the underlying mechanism, not a claim that the author published our exact recipe. Each FX record states its validation scope. Runtime checks of a representative utility do not validate all FX records.

Use `route graphic-designer`, `route service-site` or another named route as a starting shortlist. Search `--kind chapters` with an optional `--domain cinema` or another domain from the chapter registry; `show C066` returns the full decision contract and file path. Search `--kind designer-prompts` or use `scripts/designer.py list`, then compose one relevant task with the real brief. Do not load all chapters or all designer prompts for a focused change.

## Selection method

1. Start with the visitor outcome, content and available assets.
2. Search two or three relevant families: product, editorial, portfolio, institutional, immersive, commerce, photography or culture.
3. Read the selected W record. It separates `preview_observation`, `proposed_transfer`, `design_risk` and `required_inputs`.
4. Inspect the actual reference again if motion, current behavior or live technology matters. Recorded tags are source-declared metadata, not a new code audit.
5. Read one relevant original phase prompt. Do not re-run all nine when the user only needs one repair.
6. Choose the smallest suitable tool set. A reference's `suggested_tool_ids` are recommendations for a new practice project, never an assertion about the source site's exact stack.

Search accepts English category names and Slovak text. Use short meaningful terms. `--reference W040` finds the nine original prompts for the logistics scenario; combine with `--phase motion` for one.

## Phase mapping

| Problem | Phase |
|---|---|
| Pretty page, unclear offer | brief; content-conversion |
| Generic template appearance | art-direction; design-system |
| Blurry image, weak crop, decorative 3D | hero-assets |
| Scroll traps, excessive transitions | motion |
| Desktop works, mobile fails | responsive |
| Slow, inaccessible, fragile | performance-accessibility |
| Almost finished, uneven details | polish-handoff |

## Evidence boundaries

All W records have a reviewed project page and a static submission preview. Zero live website interactions and zero TikTok videos were played end to end during this collection run. Thirty-four of the 100 retained TikTok search candidates were relevant by caption; 66 were rejected. One additional search title names Bruno Simon's portfolio but does not establish the version. These are separate from the 100 W references.

Public prompt text is reproduced with repository attribution and MIT notices. Linked images, videos, fonts, brands and logos are not automatically licensed by that text license. Do not download or reuse those assets without checking their own terms.

## Senior decision gate

- **Decision:** Select a few relevant records and preserve their evidence class.
- **Deliverable:** A bounded set of references and concrete proposed adaptations.
- **Verification:** Separate observed behavior from static preview and proposed reconstruction.
