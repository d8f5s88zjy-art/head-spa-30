# 052 — Framework a stratégia renderovania

Use when a new project needs a stack or an existing render path causes a concrete problem. Preserve a viable existing stack.

## Decide

Classify public content, personalized data, editor preview and highly interactive surfaces. Choose static, server or client rendering per real requirement rather than applying one mode everywhere. Consider hosting constraints, content freshness, team knowledge and the cost of hydration.

## Execute

Inspect versions, package scripts, deployment target and data loading conventions. Keep public meaningful content available early and isolate heavy interactive islands where practical. Respect server/client boundaries: secrets and authoritative validation stay server-side; browser APIs run only where available.

Use the framework's established routing/data mechanisms instead of building competing systems inside components. Keep initial render deterministic across environments. Time, randomness and viewport assumptions must not create unexplained hydration mismatches. Load optional cinematic modules after the useful page exists and preserve a fallback if their chunk fails.

## Verify

Run the actual build and inspect cold entry, direct routes, server errors and client navigation. Check that a missing optional bundle does not remove the main content. Measure loading/hydration costs before rewriting architecture. Verify APIs against installed versions and current official docs.

## Deliver

Provide route/rendering decisions, data ownership, deployment assumptions and a reproducible build path. Explain why any new dependency is necessary. Do not claim that a framework alone guarantees SEO, performance or maintainability; those outcomes depend on the implemented path.
