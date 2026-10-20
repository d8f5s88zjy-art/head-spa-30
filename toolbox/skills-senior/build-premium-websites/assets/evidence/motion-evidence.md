# Evidence for the cinematic extension

## Contents

1. Scope and origin
2. Source retrieval
3. Validation
4. Reuse limits

## 1. Scope and origin

Extension date: 20 October 2026. This expands the existing `build-premium-websites` skill in place. The original 100 website references, 100 tools/resources, 60 GitHub repositories and 1000 prompts retain their original counts, credits and limitations. The older research snapshot is documented separately in `provenance.md`.

The extension adds 56 original bounded technique records, current documentation/source records, Slovak production chapters, templates, native motion utilities and a small instructional lab. Recipes are original recommendations about applying mechanisms, not recovered implementations from award websites.

No new claim is made that the TikTok collection was watched, the reference sites were interactively tested, all effects were built, or all tools were installed. Monetary bands are illustrative scope planning using the user's stated ambition, not researched market valuations.

## 2. Source retrieval

At the original cinematic-extension checkpoint, `assets/catalogs/sources.json` contained 34 primary-source records: 25 page retrievals and 9 primary-source search excerpts. The later production upgrade adds seven page records; see `upgrade-evidence.md` and the current manifest for cumulative counts. Only relevant material was inspected; this is not a claim of reading every linked manual in full. The source registry records the evidence class for each entry.

Direct Blender page retrieval failed. S032 and S033 remain search-excerpt evidence and must not be described as full manual review or executed Blender work. Older Three.js `/manual/en/` links returned errors; the retrieved documentation now uses `/manual/pages/`. The Motion reduced-motion page was located at `/react-use-reduced-motion`. Recheck URLs, installed revisions and compatibility before production.

No paid tool installation, public deployment or live client data changes were needed to create this extension.

## 3. Validation

Executed locally with Node v24.19.0 and Python 3.12.14:

| Check | Actual result and boundary |
|---|---|
| Skill creator `quick_validate.py` | Passed frontmatter/name validation |
| `scripts/validate_bundle.py` | Passed links, 56 technique records, 34 sources, legacy counts, five catalog queries and 14 unexecuted acceptance-template rows |
| `node --test scripts/test_motion.mjs` | 13 tests passed: math, camera sampling, animation ownership, cancellation, preference changes, synchronous commit behavior, geometry fallbacks and GSAP adapter contract |
| `node --check assets/motion-lab/lab.mjs` | Syntax passed; not browser execution |
| Git whitespace check | Passed |
| Local browser visit | Not completed: the cloud browser could not reach the local HTTP server (`ERR_CONNECTION_REFUSED`) |
| Physical devices / WebGL / WebGPU / real GSAP runtime | Not executed in this extension |

The Node animation and transition checks use test doubles. They prove the tested control flow, not browser rendering, frame rates or cross-browser behavior. No FX record is promoted to individually runtime-tested merely because the supporting utility passed.

Two fresh-context application exercises were used under the skill-creator workflow. A €1,500 barbershop brief produced a bounded photo-based plan, a real booking path and appropriate checks without unnecessary 3D. A native-transition integration exercise checked the actual code and exposed viewport/local-coordinate issues for scaled ancestors, nested FLIP compensation and BFCache lifecycle risk. The simple FLIP recipe now deliberately skips animation in unsupported geometry, with regression tests. The lab keeps listeners during persisted pagehide and redraws on pageshow; that lifecycle correction remains code-reviewed rather than browser-verified.

## 4. Reuse limits

`createShotSampler` demonstrates piecewise linear camera-state interpolation. It is not a quaternion/spline camera controller, a collision system or an automatic composition engine. A continuous camera path needs project-specific interpolation and framing review.

`createMotionController` animates an already committed target state; wrappers need exclusive ownership of transform. `flipTranslate` handles translation, not size/scale correction. It deliberately falls back without animation for transformed/CSS-zoomed ancestors or nested selected targets rather than applying viewport deltas as incorrect local pixels. `createViewSwitcher` accepts synchronous visual DOM commits only; it is not a router, network mutation or payment API. The GSAP adapter uses caller-supplied dependencies; a test double verifies its contract only.

The local lab covers selected native patterns and uses no client business claims. It does not establish real-device frame rates, Core Web Vitals, WebGL/WebGPU compatibility, accessibility conformance or production readiness of every technique. Future actual project checks must be recorded independently.
