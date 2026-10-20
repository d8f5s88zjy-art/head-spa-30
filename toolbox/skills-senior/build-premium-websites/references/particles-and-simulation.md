# 046 — Častice a simulácia

Use when motion of many elements helps express a material, system or story. Do not use particles to disguise weak composition.

## Decide

Choose deterministic analytic motion for a reversible scroll narrative and stateful simulation only when its behavior matters. Define bounds, density, visual purpose and which input affects it. Decide what happens when the tab sleeps or the user jumps to another chapter.

## Execute

Prefer batched/instanced rendering where appropriate and avoid creating one heavyweight component per particle. Reuse buffers and keep allocations out of the frame loop. Bound simulation step size and catch-up work so a suspended tab does not trigger a costly burst. Use reproducible seeds where repeatable visual review is needed.

Separate decorative particle state from business state and interaction targets. Reduce density, resolution or layers on constrained devices. Consider overdraw and transparency cost, not only particle count. A sparse bright field over several full-screen layers can cost more than a larger simple geometry set.

## Verify

Measure steady state, first appearance, rapid input, long runtime and background return. Check for unbounded buffers, orphaned loops and inconsistent resets. Compare reduced-motion and no-GPU alternatives. Ensure pointer interaction never captures scrolling or hides accessible controls.

## Deliver

Provide state model, timestep/seed policy, boundaries, quality controls, lifecycle ownership and the observed performance conditions. Keep a stable poster or CSS alternative. Do not claim physical realism or universal frame rate from an aesthetically convincing desktop preview.
