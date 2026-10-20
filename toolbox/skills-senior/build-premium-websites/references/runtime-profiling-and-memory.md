# 073 — Profilovanie runtime a pamäte

Use when motion stutters, a scene slows over time or resource use grows. Measure before selecting an optimization.

## Decide

Choose a reproducible action and identify whether the suspected bottleneck is network, decode, main-thread JavaScript, layout/paint, GPU or memory pressure. Frame rate alone does not identify the cause. Distinguish persistent growth from expected caches and temporary peaks.

## Execute

Capture a focused trace with stated environment and build. Inspect expensive tasks, layout invalidation, paint areas, animation work and resource allocation. Change one consequential cause at a time. Reduce unnecessary re-rendering, per-frame allocation or render passes based on observed evidence.

For memory use repeatable cycles: load, interact, replace, unmount and settle. Track owned resources and known shared caches. Estimate decoded media/GPU payload to choose a budget, but keep the estimate separate from measured residency. Avoid forcing garbage collection as the only proof that the ordinary user path is healthy.

## Verify

Repeat the same scenario after the change and inspect unintended visual/functional differences. Test long-session behavior only where a real risk exists. Confirm that a “fix” did not merely hide the scene or disable necessary interaction. Mark browser/GPU checks blocked if the environment cannot perform them.

## Deliver

Provide the trace/observation, environment, diagnosis, correction and bounded comparison. Do not claim universal 60 fps or device coverage from local utility tests. Keep an actionable next step when the evidence does not yet distinguish CPU from GPU cost.
