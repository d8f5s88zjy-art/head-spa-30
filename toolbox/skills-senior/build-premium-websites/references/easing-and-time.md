# 035 — Easing, časovanie a fyzika pohybu

Use when animation feels abrupt, floaty, mechanical or inconsistent. Diagnose timing and property ownership before adding blur.

## Decide

Choose the movement's purpose: immediate feedback, spatial continuity, emphasis or narrative pacing. Use duration-based motion for repeatable editorial choreography and spring behavior when direct manipulation should settle naturally. Do not prescribe one duration for every travel distance or context.

## Execute

Define start/end states, delay, curve or physical parameters, interruption and final state. Keep input feedback prompt even if decorative settling continues. Use shared timing relationships for related elements and restrained stagger; a long list should not force users to wait for its last item.

For scroll-driven scenes, distinguish raw progress, displayed smoothed progress and semantic state. Coordinate text and camera to the same intended state. Make smoothing time-step-aware and clamp abnormal time gaps after tab suspension where necessary. Reverse without jumping or restarting an unrelated timeline.

## Verify

Observe rapid repeated input, interruption halfway, reverse scroll and background/foreground return. Inspect settled state after cancellation. Compare at different refresh rates when practical; a single recording cannot establish consistent frame pacing. Use reduced-motion changes at runtime as an ownership test.

## Deliver

Provide motion tokens with purpose, parameter meaning and tested conditions. Keep suggested values as starting hypotheses until observed in the actual composition. If a numerical easing choice is changed, describe its perceptual effect rather than claiming a specific curve makes every interface premium.
