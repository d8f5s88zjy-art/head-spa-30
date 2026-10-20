# 036 — Filmové rozprávanie pri skrolovaní

Use when sequential explanation benefits from a changing visual scene. Preserve the document's navigation and the user's control over pace.

## Decide

Choose between ordinary sections, sticky composition and a bounded pinned sequence. Pin only when a stable stage improves comprehension. Define a skip/direct-link path and the text equivalent. Avoid converting the whole website into one mandatory intro.

## Execute

Partition normalized progress into contiguous scenes with entry, hold and exit. Map state deterministically from current progress rather than relying only on forward callbacks. Recalculate measurements when relevant content, fonts or dimensions change. Avoid layouts where the pinned scene changes its own measurement continuously.

Give one system authority over scrolling and one over each animated property. If optional smooth scrolling is used, integrate its clock intentionally and preserve native input expectations. Recompose mobile scenes to reduce travel and avoid browser chrome/keyboard conflicts. Keep URLs and headings meaningful independently of canvas position.

## Verify

Reload halfway through, scroll upward, jump via anchor, resize and use Back. Try a short viewport and rapid wheel/touch input. Confirm the CTA is usable while assets load or fail. Profile the actual scene before increasing pin duration or adding more passes.

## Deliver

Supply chapter boundaries, state mapping, measurement dependencies, ownership, cleanup and fallback. Link the scene-plan template and relevant FX records. A smooth recording is only one observation; document reverse, mid-page and reduced-motion behavior separately when they have actually been checked.
