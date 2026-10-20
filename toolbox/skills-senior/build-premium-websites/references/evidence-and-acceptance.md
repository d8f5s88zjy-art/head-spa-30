# 083 — Dôkazy a akceptácia

## Contents
1. Select the required checks
2. Record observations
3. Validate the ledger
4. Interpret the result

## 1. Select the required checks

`assets/catalogs/acceptance-checks.json` defines check IDs, concrete observations and acceptable evidence classes. `studio.py plan` selects checks from an explicit brief. This registry is an original production checklist, not a comprehensive legal/accessibility/security audit. Use the applicable project gates as well.

For tiny edits, use the existing proportional workflow rather than manufacturing a full-site ledger. For a full project, keep truth, main journey, composition, mobile, keyboard, engineering and delivery checks; add motion, CMS, forms, commerce and 3D checks when those capabilities are in scope. A mandatory check cannot be dropped simply because the available tool cannot execute it.

## 2. Record observations

A record has `build_id`, check ID, status, method, environment, observation and evidence files. Use `not_run`, `blocked`, `fail` or `pass`. Attach a reason to blocked/failed checks. Never prefill a pass in a reusable template.

Evidence classes distinguish `source_review`, `visual_review`, `browser_behavior`, `runtime_measurement`, `build_or_targeted_test`, and `handoff_review`. A screenshot can support a visual observation but cannot prove keyboard navigation, interruption, server response or runtime performance. A code review or test double cannot pass a check requiring actual browser behavior. A narrative describing a test is not the test itself.

Tie every evidence file to the subject build. Use a relative path under the explicit evidence root, its SHA-256, and an actual observation. Keep screenshots/traces/raw responses when available; do not include credentials or unrelated personal data. The source of evidence must be honest, not generated to look like a real execution log.

## 3. Validate the ledger

Generate an unexecuted ledger using:

```bash
python scripts/studio.py init-review BRIEF.json --build current-build-id
python scripts/studio.py check BRIEF.json REVIEW.json --root EVIDENCE_DIRECTORY --build current-build-id
```

Redirect command output to a chosen project evidence path when appropriate. Run from the installed skill folder or use the script's absolute path. `--build` must identify the actual reviewed revision/artifact, including working changes if any; a clean Git commit alone does not identify a dirty build.

The checker rejects missing/duplicate/unknown records, stale build IDs, wrong evidence classes, absent/changed/empty files, paths escaping the evidence root, and any required check not passed. It does not execute browser checks, authenticate observations, score design or certify production readiness. A consistent record can still contain a dishonest human-entered claim; review the underlying artifacts.

## 4. Interpret the result

`record_consistent` means the selected records have the required structure, permitted evidence type, matching build and matching local artifact hashes. Report that exact scope. `incomplete_or_inconsistent` means the ledger must not be used as evidence of completed acceptance. Preserve the failure reason.

Do not turn missing tools into a fabricated pass. Deliver completed independent work with exact limits. A high visual rubric cannot cancel a failed booking path. A passing build cannot cancel broken mobile behavior. Use the whole relevant evidence set and professional review to make a release decision under the user's actual authorization.

For target sizes use the WCAG 2.2 minimum and exceptions accurately: SC 2.5.8 is 24×24 CSS pixels with stated exceptions, including spacing; a larger project target is an internal choice. S035. Sticky decoration must not entirely obscure the focused component under SC 2.4.11; also inspect focus visibility and contrast separately. S036. These two checks do not establish complete WCAG conformance.

## Senior decision gate

- **Decision:** Select methods that can establish the actual claim.
- **Deliverable:** A build-linked evidence ledger.
- **Verification:** Treat record consistency as consistency, not authentication or certification.
