# 081 — Brány kvality

Apply the gates relevant to the actual change. A small reversible edit does not require unrelated broad testing. A complete interactive site does require the important journeys and failure modes to be checked.

| Gate | Evidence required | Failure examples |
|---|---|---|
| Truth and scope | Sources for business facts; actual implemented scope | Fake client logos, invented prices, a hero presented as a complete site |
| Visual direction | Coherent focal point, type, spacing, image treatment | Generic decoration, weak image, competing focal points |
| Media integrity | Suitable resolution, crop, rights and fallback | Stretched image, lost face/product, unlicensed external video |
| Functional route | Working main action and honest states | Dead buttons, fake form success, unavailable checkout |
| Mobile | Recomposition, touch controls, long-content stability | Desktop merely shrunk, hover-only action, hidden CTA |
| Accessibility | Semantics, keyboard, focus, contrast, labels, reduced motion | Focus trap, inaccessible canvas content, unreadable text |
| Motion | Interruption, reverse scroll, refresh, resize, cleanup | Stale listeners, impossible mid-page state, mandatory long intro |
| Performance | Measured environment, asset costs, bounded scene workload | Multiple full-resolution decodes, huge textures, invented score |
| Engineering | Applicable build and targeted checks | Console errors, incompatible dependencies, committed credentials |
| Delivery | Editable sources, credits, actual verification and limits | Claiming publication without success evidence |

For interactive 3D verify that DOM navigation works while the scene loads or fails. Test reduced motion with content already readable. Try direct navigation into a later section and browser back. Do not infer these results from a screenshot.

For forms verify input validation, loading, server error and confirmation without sending unapproved messages or changing live customer data. Use an appropriate test path within authorization.

When reporting performance, give the actual measurement conditions. A lab check does not establish real-user Core Web Vitals. If a device or scenario could not be tested, list it as untested rather than passing it by assumption.

## Senior decision gate

- **Decision:** Do not let visual appeal compensate for broken truth or functionality.
- **Deliverable:** A scoped acceptance result with unresolved limitations.
- **Verification:** Verify relevant gates and keep unexecuted checks unpassed.
