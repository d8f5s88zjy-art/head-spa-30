# 025 — Farby, kontrast a stavové významy

Use when a palette must carry both identity and usable information. Distinguish decorative color from semantic state and interaction.

## Decide

Assign roles for surfaces, primary/secondary text, borders, actions, focus, success, warning and error. Choose hierarchy before adding gradients. A single brand accent need not carry every status. Define the actual foreground/background pairs to evaluate.

## Execute

Create semantic tokens and representative component states. Test text over the actual image/video frames, not a flat mock background. Use stable scrims or solid backing where content would otherwise depend on a changing pixel. Pair meaning with labels, icons or structure so color is not the only signal.

Define light/dark behavior only when required; it is a second set of relationships, not a blanket inversion. Check disabled, hover, selected and focus states separately. For shader and image grading, preserve product color truth and coordinate with the renderer's color pipeline rather than compensating with arbitrary UI saturation.

## Verify

Measure relevant contrast pairs using the applicable current accessibility criteria; use S022 for criterion context. Check focus against adjacent surfaces and all interactive states. Inspect actual composited frames and media fallback. A static token value cannot prove a changing background is always readable.

## Deliver

Supply semantic palette tokens, allowed pairings, status conventions and observed contrast results. State unresolved media combinations. Use designer briefs to request evidence on real components rather than an attractive palette swatch alone. Do not claim a full accessibility pass from color checks.
