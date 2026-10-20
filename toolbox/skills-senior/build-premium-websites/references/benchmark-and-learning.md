# 099 — Praktické učenie a zlepšovanie

## Contents
1. Use realistic cases
2. Preserve evaluation integrity
3. Make a useful improvement record

## 1. Use realistic cases

The prompts in `assets/catalogs/application-cases.json` cover small service sites, cinematic redesign, real 3D selection, mobile motion, asynchronous navigation, CMS editing, large platform scope and minor fixes. They are original exercise prompts, not claims of completed client work. Their status is not automatically passed because the skill contains matching vocabulary.

For skill revisions use the skill-creator workflow. On a substantial change run independent task applications with only the skill and raw request. Ask for a concrete deliverable appropriate to the case; do not reveal intended answers or seed the critique. Keep production systems untouched. Record which cases were actually run and the remaining limitations.

## 2. Preserve evaluation integrity

Inspect outputs for operational specificity: can someone implement the selected design, use actual assets, understand state ownership, reproduce checks, identify missing dependencies and tell what is complete? Do not reward long answers, tool counts or glamorous adjectives. Keep assessment dimensions separate:

- factual grounding and respect for scope;
- concrete composition and responsive adaptation;
- motion continuity and failure behavior;
- implementation feasibility under the given constraints;
- validity of verification claims;
- efficiency and proportionality.

A task application is not a controlled A/B experiment. Different requests, different context or evaluator judgment prevent a claim of a measured quality multiplier. For a credible comparative study freeze prompts and conditions, use blinded assessors and suitable repeated samples; do not fabricate that work.

## 3. Make a useful improvement record

Capture `task → observed failure → evidence → smallest correction → retest → scope of generalization`. Save a reusable rule only if it changes future action. Examples: a CMS reorder broke index-based selectors; a stale asset response overwrote the current selection; a mandatory animation hid the booking link. Record the concrete fix and test boundary, not “became a senior designer.”

Keep working recipes small and scoped. Update current API assumptions from official documentation at implementation time. Preserve source attribution and the difference between page retrieval, search excerpt, code execution, browser behavior and physical-device testing. A saved skill extends future working instructions; it does not retrain the underlying model.

## Senior decision gate

- **Decision:** Improve the skill from demonstrated failures without contaminating evaluation.
- **Deliverable:** A bounded reusable correction and honest evidence.
- **Verification:** Use raw artifacts and distinguish task applications from statistical quality proof.
