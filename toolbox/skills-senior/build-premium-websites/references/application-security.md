# 077 — Bezpečnosť webovej aplikácie

Use when the project handles input, identities, uploads, sensitive data or third-party integrations. Apply controls to actual trust boundaries.

## Decide

Identify assets, actors, entry points and consequential failure paths. Select a risk-appropriate verification scope and relevant specialist skill. A public brochure and a multitenant payment portal need different depth; neither benefits from unsupported certification language.

## Execute

Keep secrets server-side and minimize privileges. Validate inputs, use safe data access patterns and enforce permissions where data is read or changed. Escape output for its actual context; sanitize intentionally allowed rich HTML with a suitable maintained tool. Avoid unsafe HTML insertion of untrusted strings.

Use framework/provider protections for sessions and CSRF. Bound uploads by allowed type, size, processing and access rather than trusting a filename. Treat third-party scripts as part of the trust surface. Keep logs useful without tokens, secrets or unnecessary private content. Recheck current official guidance for the concrete stack.

## Verify

Exercise the affected authorization/input boundaries in an authorized test context. Check denial paths as well as successful access. Review error/log output for exposure. Use targeted tests and scans as evidence for their actual scope; investigate findings rather than blindly suppressing them.

## Deliver

Provide the addressed risks, controls, evidence and remaining material issues. Do not promise the site is unhackable or fully secure. Security work should result in concrete verified behavior, not a generic warning that prevents an otherwise authorized low-risk edit.
