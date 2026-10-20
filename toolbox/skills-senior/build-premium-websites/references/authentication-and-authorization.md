# 065 — Identita a oprávnenia

Use when users access private data or privileged actions. Treat identity and permission as separate concerns.

## Decide

Choose an established identity solution suitable for the project. Map actor, resource, action and context, including tenant boundaries. Default-deny sensitive operations and define how permissions are checked at the authoritative server boundary. Hiding a button is presentation, not enforcement.

## Execute

Use the provider's current session and recovery guidance; avoid inventing cryptography or password storage. Keep credentials/tokens out of client logs and unsafe URLs. Check access on each protected operation, including files, exports and background tasks. Scope caches by identity where required.

Define expired, revoked, forbidden and signed-out behavior. Preserve safe return destinations while validating redirect targets. For cookie-authenticated writes use the framework's appropriate CSRF protections; SameSite settings alone are not a universal substitute. Keep role changes and account recovery observable without collecting unnecessary secrets.

## Verify

Use authorized test accounts for two distinct users/tenants. Try direct resource access, stale sessions, changed roles and protected downloads. Verify server denial rather than only absence of UI. Test the most consequential permission boundary before claiming an authenticated flow is complete.

## Deliver

Provide the permission matrix, provider/version assumptions, session lifecycle, safe failure states and bounded evidence. Apply a relevant security skill for material review. Do not claim certification or complete security from a short checklist.
