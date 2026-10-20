# 043 — Produkcia a výkon médií

## Contents
1. Preserve source truth
2. Budget decoded work
3. Select quality deliberately
4. Diagnose a slow scene
5. Measure under stated conditions

## 1. Preserve source truth

Maintain originals and optimized derivatives separately. Record source ID, subject, dimensions, rights/credit, permitted use, crop, focal point, color treatment, derivative settings and fallback. A codec/texture change requires visual comparison. Do not claim a new generated interior is the real business. Do not overwrite the only editable original.

For photography, derive widths from actual display size and likely density; inspect sharpness and crop at that size. A tiny compressed source cannot deliver genuine fine detail simply by increasing export dimensions. For video, choose aspect ratio, duration, poster, audio policy and controls before encoding. Avoid a scroll-driven decoder pipeline for a fixed shot that could be a short normal video.

For 3D, inspect units, orientation, pivot, geometry/material counts, texture dimensions, alpha, UVs and lighting. Establish a clean render before post-processing. Pin exporter and runtime versions, test compressed decoders, and keep a known-good still. Asset licenses and code licenses are separate. Animation retargeting, actual product geometry and realistic material claims require source evidence.

## 2. Budget decoded work

Compressed transfer size is not decoded memory. For an RGBA8 image/frame, `width × height × 4` is a useful nominal estimate before allocator, GPU and pipeline overhead. An exact full mip chain is the sum of each halved level down to 1×1; use integer dimensions, not a universal 4/3 shortcut for all shapes. Render targets may have additional attachments, samples and precision. Do not equate this estimate with measured GPU memory.

`python scripts/studio.py memory assets/templates/memory-plan.json` estimates declared image/frame payloads and mip levels. A 1920×1080 RGBA8 frame is about 7.91 MiB; twelve retained frames are about 94.92 MiB, before overhead. This illustrates why a bounded window matters even when downloads are small. The command does not introspect a browser or validate a real decoder.

Use explicit provisional caps for initial transfer, deferred media, critical JS, retained frames/textures, DPR, post-processing passes and active canvases. Derive them from the audience and device sample; there is no universal premium-site budget. Label budgets as project decisions and measured values as observations.

## 3. Select quality deliberately

Start with a semantic DOM and poster. Then choose the least costly medium that fulfils the task. Use video for fixed cinematography, 3D for meaningful angle/part/variant interaction, and ordinary HTML/CSS for readable choices. Missing required media is a production dependency, not proof that an invented replacement is acceptable.

Use a capability ladder: static → light native motion → prepared video → interactive scene → optional post-processing. These are alternatives, not obligatory levels to climb. Reduced motion is a user preference, not a slow-device detector. Coarse pointer and small viewport are not hardware benchmarks. Feature-detect APIs and measure representative workloads.

If measured quality must adapt during a session, use a rolling window and hysteresis. Downgrade optional work before losing content, preserve selection, and avoid oscillating every frame. Do not change large render targets inside every frame. Pause invisible work and release only resources the component owns. R3F's demand rendering requires deliberate invalidation for imperative mutations. S037.

## 4. Diagnose a slow scene

| Observation to collect | Likely investigation | Targeted experiment |
|---|---|---|
| LCP resource discovered late | HTML discovery, preload/priority, dependency chain | Make the actual critical resource discoverable sooner |
| LCP resource fetched but displayed late | Render delay, hidden content, font/JS dependency | Remove unnecessary gate keeping the main content hidden |
| Slow click before handler starts | Main-thread contention/input delay | Remove or split unrelated work before input |
| Handler itself is long | Synchronous processing | Commit minimal feedback; defer noncritical work |
| Click handler short but next paint delayed | Layout/paint/compositing | Reduce invalidation and expensive painted regions |
| Higher pixel density dramatically worsens frame pacing | GPU fill/overdraw/render targets | Compare lower DPR and fewer passes |
| Re-entry costs grow | Listeners, decoder cache, resource ownership | Compare repeated mount/unmount with resource counts |

Use LCP's TTFB, resource-load delay, resource-load duration and render delay to avoid optimizing the wrong part. S039. Separate INP input delay, processing and presentation delay; shortening a handler does not fix all interaction latency. S038. These diagnostics supplement the existing performance chapter.

## 5. Measure under stated conditions

Record build, URL, browser/device, viewport, network/CPU conditions, cache state, motion setting, route, action and measurement method. Compare the same scenario before/after. Use actual runtime tools when available; a Node benchmark is not browser FPS. A viewport emulation is not a physical phone. Lab timing and field Core Web Vitals are distinct.

When tools cannot collect a metric, leave it unmeasured. Browser policy or connectivity failure cannot be repaired by making up a score or using an unapproved automation channel. Preserve executable local checks and explain the missing evidence.

## Senior decision gate

- **Decision:** Budget transfer, decoding and residency separately.
- **Deliverable:** Versioned derivatives and a nominal memory plan.
- **Verification:** Compare actual appearance and measured cost under stated conditions.
