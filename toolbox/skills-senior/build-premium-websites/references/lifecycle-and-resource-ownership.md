# 054 — Životný cyklus a uvoľňovanie zdrojov

Use when animations, subscriptions, models or buffers survive their intended scope. Establish ownership before adding cleanup calls.

## Decide

For every resource identify creator, owner, borrowers, lifetime and release operation. Shared textures and caches need an explicit sharing policy; blindly traversing a removed object and disposing everything can break other scenes. Distinguish a suspended page from a permanently unmounted component.

## Execute

Pair each setup with a symmetrical release: listeners, observers, animation frames, timers, media, render targets and loaded objects. Make cleanup idempotent where repeated execution is possible. Preserve the claim/adoption boundary for async resources; stale loaded values must be released unless ownership already transferred.

Use the bundled owned-selection wrapper only within its documented contract. The application remains responsible for previous and current adopted models. Do not treat aborting a request as proof that a decoder stopped or an already-created resource disappeared. Scope framework effects so repeated development setup/cleanup is harmless.

## Verify

Repeat mount, replace, cancel and unmount. Exercise late completion and cleanup errors without disposing the new owner's value. Track resource counts and memory under stated conditions; retained renderer caches can differ from a genuine leak. Check Back/forward restoration separately from ordinary unmount.

## Deliver

Provide an ownership table, lifecycle rules, observed repetition results and remaining GPU/browser gaps. Code-level disposal tests prove control flow, not that every driver released memory. Never fix a leak by removing a necessary ownership guard without understanding who still uses the object.
