# 062 — CMS a redakčný pracovný postup

Use when non-developers must maintain content. Design the editing experience alongside the public website.

## Decide

Identify editors, content types, approval needs, locales and publication frequency. Choose structured content for meaningful entities and bounded composition controls where editorial flexibility is useful. Do not make editors manage shader uniforms or raw layout CSS for routine changes.

## Execute

Define stable IDs, required fields, media/focal points, references, validation and publication states. Separate draft preview from public data and enforce preview permissions. Model reusable services/products once instead of duplicating names and prices across pages.

Support useful defaults and explicit optional fields. Keep editorial reorder independent of animation timing assumptions. Define preview, publish, rollback/unpublish and cache invalidation behavior. For migrations preserve source IDs and an export/restore path before transforming content.

## Verify

Have the authorized editor workflow create, update, reorder, preview and unpublish representative content in a test context. Exercise long text, missing optional media, conflicting edits and invalid references. Check that draft data cannot appear through a public cache or unauthenticated preview link.

## Deliver

Provide the schema, role/permission map, publishing sequence, content fixtures and short editing instructions. Record which operations were actually exercised. A static content JSON file is not a complete CMS merely because the frontend reads it dynamically.
