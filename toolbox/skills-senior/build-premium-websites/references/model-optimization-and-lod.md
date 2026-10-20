# 047 — Optimalizácia modelov a LOD

Use when models load slowly, exceed memory budgets or render poorly on target devices. Optimize the asset for its actual camera use.

## Decide

Inspect geometry, draw calls, materials, texture dimensions, animation tracks and useful viewing distance. Choose which details affect silhouette or identity. A small transfer size is not evidence of low decoded memory or cheap rendering.

## Execute

Preserve an editable source and create versioned derivatives. Remove unused data, consolidate compatible materials and simplify geometry where visual impact is acceptable. Select compression supported by the chosen loader and deployment pipeline; include decoder cost in the plan. Use texture sizes justified by screen-space use.

Define detail tiers and transitions based on meaningful viewing conditions. Avoid visible popping of important product features. Keep collision, selection and business identity independent of visual LOD. Track shared textures/materials so disposing one instance does not break another. Use glTF inspection tooling only after checking the current CLI and input backup.

## Verify

Compare original and optimized versions in representative close, distant and mobile shots. Inspect UV seams, normals, labels, transparency and animation. Measure transfer, decode, upload and steady-state separately. Repeat mount/replace/unmount to detect ownership problems.

## Deliver

Provide original/derivative mapping, chosen transformations, visual comparison, nominal memory estimate and measured device results where available. Use S016 and S041 for tool/disposal context. Do not describe an offline estimate as a real GPU measurement or delete the editable master after producing a web derivative.
