# 050 — Adaptívna kvalita a náhradné zobrazenie

Use when one visual scene must serve different hardware, preferences and network conditions. Plan graceful alternatives before failure occurs.

## Decide

Define a useful base experience in semantic DOM, then optional visual tiers. Choose degradation in a meaningful order: expensive post effects, resolution, particle/detail density, then a stable poster where needed. Do not use device names as a substitute for capability and observation.

## Execute

Feature-detect the required renderer/API and handle initialization failure. Keep adaptive changes bounded and use hysteresis so quality does not oscillate. Separate user preference from automatic capability decisions; reduced motion is not merely low graphics quality. Preserve the same selected product, copy and action across tiers.

Avoid loading the heaviest assets before deciding they are needed. Pause offscreen work and release owned resources deliberately. Define response to context loss and restoration; do not loop renderer creation indefinitely. Keep a clear path to retry where appropriate without blocking the main task.

## Verify

Exercise unsupported API, failed asset load, context loss where tooling permits, slow network, reduced motion and a quality downgrade mid-scene. Check that state does not reset or diverge from the DOM. Observe memory and responsiveness after repeated tier changes.

## Deliver

Provide tier criteria, resources per tier, transition behavior, fallback composition and observed coverage. Record which capability branches are code-reviewed versus runtime tested. Avoid a “premium only” route that leaves visitors with an empty canvas or an endless loader.
