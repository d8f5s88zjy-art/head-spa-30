# 029 — Navigácia a vyhľadávacie rozhranie

Use when visitors need to move between pages or find items. Keep orientation available while decorative scenes change.

## Decide

Choose a small visible navigation structure matching information architecture. Use search when there is enough content and a real retrieval mechanism to justify it. Distinguish page navigation, in-page jumps, filters and application actions; they need different semantics.

## Execute

Use real links for destinations and buttons for local actions. Define current location, menu expansion and return behavior. A mobile menu must manage focus, close predictably and preserve scroll appropriately; choose a dialog only if its actual interaction is modal. Keep fixed headers from covering anchored headings and focused controls.

For search define query, submit/debounce behavior, loading, results, empty and error states. Preserve useful query/filter state in the URL where shareability matters. Cancel stale read results without erasing a newer query. Keep an explicit recovery from zero results and do not silently reinterpret a user's query.

## Verify

Test direct links, keyboard traversal, escape where appropriate, browser Back and narrow screens. Check that animated overlays never remain as invisible click interceptors. Try a long query, no match and delayed response. Validate the actual destination rather than only the visual menu opening.

## Deliver

Supply navigation structure, state rules, focus behavior and query/URL contracts. For large data use the separate search/data chapter. Do not add an ornamental search field that has no real index or useful results just to fill a header design.
