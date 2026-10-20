# 038 — Mikrointerakcie a spätná väzba

Use when controls feel unresponsive or state changes are difficult to perceive. Favor meaningful feedback over decorative activity.

## Decide

Identify the user's intent and the system's actual state. Distinguish hover, focus, pressed, selected, busy, successful and failed. Avoid using one visual change to imply both selection and server confirmation.

## Execute

Design the static states first. Add a brief transition that preserves shape and label clarity. Keep pointer-only effects optional; keyboard and touch users need equivalent state information. A magnetic button must not move its hit target away from the person attempting to activate it.

For long operations show useful progress only when meaningful data exists; otherwise show an honest busy state and recovery. Keep status text accessible without excessive announcements. Allow rapid repeated harmless interactions while guarding consequential duplicate operations in the authoritative layer.

## Verify

Test hover-to-click, focus-to-Enter, touch, cancellation and failed response. Observe a low-power or reduced-motion path. Check that disabled controls explain what is required where that is not obvious. Ensure visual success never fires before the actual accepted outcome.

## Deliver

Supply a control-state matrix, transition purpose, timing, input equivalents and server/UI boundary. Do not attach sound, particles or celebration to every click. A well-designed microinteraction makes the state easier to understand and leaves the visitor in control.
