# 061 — Kontrakty obsahu a integrácií

## Contents
1. Content truth and schema
2. Layout under real editing
3. Integration states
4. Developer handoff

## 1. Content truth and schema

Before visual embellishment, map each claim to a source of truth and owner. For a service record use stable ID, locale, name, description, duration and price representation, inclusion/exclusion notes, optional image/alt, real booking destination, availability semantics and publication state. Do not invent values to fill empty fields. Use a deliberate distinction between absent, unknown, zero and free.

Store money in the backend/provider's documented representation and currency; display it using the project's localization conventions. Never infer that an apparent number is in euros or includes tax. Recheck current prices through the authorized source. Keep visual labels separate from IDs used by booking/commerce systems. A translated name must not change the identity of a service.

Model media as a referenced asset with alternative text, focal point, rights and fallback. Derive presentation ratios in the UI instead of hardcoding one fragile crop everywhere. Make optional content truly optional; missing reviews cannot become generated endorsements.

## 2. Layout under real editing

Exercise a representative fixture set: long Slovak title, unbroken URL, missing optional image, one and many items, reordered services, changed price, draft/unpublished entry, longer translated copy and server error. Distinguish content validation from truncating visible information. A layout should not need a developer every time a sentence changes.

Bind animation targets to stable IDs rather than nth-child indices whose meaning changes after editorial reorder. Keep essential copy in DOM and avoid duplicate accessible text from split headings. Refresh layout measurements after the relevant CMS content, font and media changes. A CMS preview must remain distinguishable from published data.

## 3. Integration states

| Flow | Minimum observable states | Common cinematic failure |
|---|---|---|
| External booking | Real link, correct destination, navigable return | Overlay swallows tap or delays actual navigation |
| Contact request | Idle, invalid, sending, confirmed response, recoverable error | Timer displays success before server accepts |
| Product choice | Initial, selected, unavailable, pricing/loading error | Scene color and actual SKU diverge |
| Checkout | Correct line items and provider response in authorized test path | Transition callback submits twice |
| CMS save | Dirty, saving, saved, conflict/error | Animation replaces error with a generic green state |
| Authenticated page | Loading, authenticated, forbidden, expired | Client-only hide pretends to enforce access |

Keep business operations under the established backend/provider contract. Decorative cancellation must not roll back a confirmed operation; retry must follow the provider's documented idempotency strategy. Do not add a pretend endpoint to satisfy the visual design. Never use client-only controls as access enforcement. Apply the appropriate provider/security skill when the scope requires it.

For analytics define the event meaning before implementation: booking-link activation is intent, not confirmed attendance or revenue. Define conversion denominator, deduplication and observation window. Respect the existing privacy/consent design and verify current requirements for the actual jurisdiction when legal guidance is requested. Do not promise uplift without valid data.

## 4. Developer handoff

Provide the component map, data schema, stable identifiers, design/motion tokens, dependency lockfile, build instructions, environment-variable names without secrets, owned-resource cleanup rules, asset licenses, relevant checks and deployment/rollback route. Record open dependencies with owners and impact. For a small edit, supply only the relevant subset.

Use behavior-focused acceptance: “An unpublished service disappears without reusing its booking link for another item”; “A failed request remains retryable and does not report success”; “With the canvas absent, the user can still choose the real variant.” Do not substitute line count, library count or a visual score for those outcomes.

## Senior decision gate

- **Decision:** Keep content, identity and authoritative integration outcomes aligned.
- **Deliverable:** Schemas, stable mappings and real failure states.
- **Verification:** Check unpublished content, reordered entries and provider rejection.
