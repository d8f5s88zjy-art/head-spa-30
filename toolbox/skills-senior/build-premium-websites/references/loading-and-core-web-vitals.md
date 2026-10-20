# 072 — Načítanie a Core Web Vitals

Use when the useful page appears late, interaction lags or layout jumps. Diagnose the actual critical path before changing visual quality.

## Decide

Identify the likely main content, first action and large layout shifts. Distinguish lab observations from field experience and preserve the measurement conditions. Choose loading priorities around visitor usefulness rather than treating every decorative asset as urgent.

## Execute

Make essential content and the important image discoverable early. Do not lazy-load the main visible hero indiscriminately. Defer optional scenes and below-fold assets when it reduces contention. Reserve media dimensions and inspect font/layout changes. Avoid a loader that hides already usable content until every decorative download finishes.

Break down delays into network/discovery, execution and rendering causes. Reduce long main-thread work affecting input, with appropriate scheduling and smaller work units. Keep scripts and third-party embeds accountable to the same journey. Use preload/fetch priorities selectively; prioritizing everything removes the meaning of priority.

## Verify

Record cold and warm paths with explicit device/network/tool settings. Inspect LCP, INP and CLS according to current definitions and field context. Test the actual primary interaction, not only initial load. Compare before/after under comparable conditions and avoid interpreting a single noisy run as a guaranteed improvement.

## Deliver

Provide the bottleneck, targeted change, observed result, measurement method and remaining uncertainty. Treat numeric budgets as project decisions and public thresholds as sourced definitions. A perfect synthetic score is not proof of reliable bookings, accessible navigation or real-world performance.
