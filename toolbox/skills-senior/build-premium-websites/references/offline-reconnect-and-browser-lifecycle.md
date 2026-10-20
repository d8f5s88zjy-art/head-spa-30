# 080 — Offline stav a životný cyklus prehliadača

Use when tab suspension, disconnection or Back/forward restoration can break the experience. A page may pause and resume without a fresh mount.

## Decide

Choose which read-only information may remain useful offline and which actions require authoritative connectivity. Do not queue consequential writes unless the product has explicit operation identity, reconciliation and user expectations. Separate transient suspension from permanent teardown.

## Execute

Pause unnecessary work on visibility/lifecycle changes and resume from current state. Handle pagehide/pageshow and persisted restoration according to the supported environment. Preserve valid listeners for a restorable page, or recreate them deliberately; do not permanently abort the app merely because it entered the back/forward cache.

On reconnect revalidate consequential data and resolve pending ambiguous writes. If a service worker is needed, define cache versions, activation, update and recovery; do not add one purely as a badge. Keep an escape from a stale application shell and avoid silently discarding unsaved work.

## Verify

Test away/Back, tab suspension, network loss during read/write and restoration with stale data. Check that animation time does not jump through seconds of queued work. Record whether restoration actually used BFCache; pressing Back alone does not prove it.

## Deliver

Provide lifecycle states, pause/resume ownership, offline boundaries and recovery behavior. Mark browser checks separately from mocked events. Preserve the primary task even if the cinematic layer must return as a still frame.
