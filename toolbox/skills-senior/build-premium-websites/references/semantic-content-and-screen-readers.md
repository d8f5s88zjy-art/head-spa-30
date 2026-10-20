# 075 — Sémantika a čítačky obrazovky

Use when the visual experience relies on canvas, split text, icons or rich custom controls. Preserve a coherent nonvisual representation.

## Decide

Identify meaningful content, decorative media, controls and status changes. Choose native HTML before custom roles. Decide what information the visual scene conveys and provide an equivalent path without duplicating every decorative object in the accessibility tree.

## Execute

Use descriptive headings, landmarks, links and labels in logical order. Write alternative text for purpose in context, not a keyword dump. Keep decorative layers out of the reading sequence while retaining essential copy and product choices in DOM. Avoid duplicate accessible text when using animation clones.

Use live status announcements sparingly and for meaningful updates. Label custom controls with actual state and relationships. Preserve list/table semantics where those structures communicate real relationships. Do not use ARIA to claim behavior that the component has not implemented.

## Verify

Inspect the accessibility tree and, when tools permit, perform representative screen-reader tasks with a named browser/reader combination. Check control names, headings, error discovery, changing status and route context. A source review or automated scan is only partial evidence.

## Deliver

Provide semantic structure, media alternatives, status-announcement policy and observed coverage. Keep gaps explicit. A cinematic site can remain expressive while offering the same meaningful information and actions through a conventional document.
