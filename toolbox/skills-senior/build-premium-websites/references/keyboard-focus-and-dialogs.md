# 074 — Klávesnica, fokus a dialógy

Use when controls, overlays or route transitions affect keyboard navigation. Focus is part of application state, not decorative styling.

## Decide

Choose native control semantics and determine whether an overlay is truly modal. Define opening focus, traversal, escape/close behavior and return focus. Nonmodal menus and panels should not trap focus as if they were dialogs.

## Execute

Keep a logical tab order and visible focus indication. Avoid positive tabindex to repair a broken document order. Ensure fixed headers, footers and cinematic layers do not obscure the active control. Use the established accessible component behavior when suitable rather than rebuilding it casually.

For a modal, manage background interaction and focus according to the actual dialog pattern. Restore focus to a sensible surviving element on close. Coordinate route focus with the committed page, not a delayed animation callback. Preserve keyboard access when motion is disabled or media initialization fails.

## Verify

Complete the main journey with keyboard only. Open/close overlays, trigger validation, navigate Back and activate skip links. Check focus after the original trigger is removed. Inspect both visual visibility and programmatic location. Automated tooling can help but cannot establish the entire interaction.

## Deliver

Provide focus rules, keyboard behaviors, selected pattern and actual manual observations. Use S026 and S036 for scoped criteria/pattern guidance. Do not claim full accessibility from a working Tab key or from an ARIA attribute added without corresponding behavior.
