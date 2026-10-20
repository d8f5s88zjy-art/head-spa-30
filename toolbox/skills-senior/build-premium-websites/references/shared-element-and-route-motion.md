# 037 — Zdieľané prvky a prechody stránok

Use when continuity across layouts or pages helps orientation. Keep navigation state authoritative and animation optional.

## Decide

Choose whether the object truly represents the same entity in both states. Use stable identity, not a coincidental index. Decide whether a native transition, framework layout system or measured FLIP fits the installed environment. Check feature-specific support instead of assuming a universal API.

## Execute

Commit the next valid route/data state once and let the decorative transition observe it. Own title, focus, history and scroll restoration in the navigation layer. Abort or ignore stale reads before commit; do not use animation cancellation to undo completed business operations. Keep failure routes usable.

Measure geometry in the correct coordinate system. The bundled translation-only FLIP falls back for transformed/zoomed ancestors and nested selected targets; do not disable that guard to force an inaccurate animation. For a specialized engine, validate its transformed-layout behavior against current documentation and the real component.

## Verify

Exercise two rapid navigations, Back during transition, a failed data load, reduced-motion changes and route unmount. Confirm no duplicate commit, stale focus jump or invisible overlay remains. Test unsupported transition capability with ordinary navigation still working.

## Deliver

Provide shared IDs, route ownership, request cancellation semantics, focus/scroll rules and fallback. Keep transition-specific concerns isolated so removing the effect does not break the product. Record which lifecycle branches were tested with mocks and which were observed in a browser.
