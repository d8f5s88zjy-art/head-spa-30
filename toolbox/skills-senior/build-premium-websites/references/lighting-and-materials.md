# 044 — Svetlo a materiály v 3D

Use when a 3D scene looks flat, artificial or inconsistent with the brand. Solve lighting and material response before adding post-processing.

## Decide

Choose the subject, silhouette and visual hierarchy. Decide whether realistic product representation or stylized illustration is required. Keep product colors, proportions and finishes truthful when they support a purchase decision.

## Execute

Work in the renderer's documented color pipeline. Separate color textures from data textures and avoid double tone mapping or display conversion. Establish key, fill and separation with the fewest useful lights. Use an environment that reveals material form without washing out labels or interfaces.

Tune roughness, metalness, normal detail and transmission against reference material. Inspect the model under neutral light before compensating for a bad texture with colored light. Budget dynamic shadows, transparent layers and reflections explicitly. Coordinate camera framing with highlights; a technically correct shader can still hide the product silhouette.

## Verify

Inspect bright and dark views, camera movement, low-quality fallback and the final compositing chain. Check for blown highlights, crushed details, incorrect normals, z-fighting and unreadable product markings. Compare a real product reference where truth matters. Do not infer physical accuracy from visual appeal alone.

## Deliver

Provide lighting intention, material slots, color-management assumptions, source assets, quality tiers and comparison frames. Keep editable values understandable to another developer. Consult renderer-specific sources S010–S012 before adapting code; WebGL and WebGPU effect pipelines are not interchangeable.
