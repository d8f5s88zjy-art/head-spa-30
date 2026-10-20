# 070 — Vyhľadávanie a veľké dáta

Use when visitors navigate a substantial catalog or administrators work with many records. Optimize the real query and task, not a synthetic row count.

## Decide

Define searchable fields, ranking intent, filters, authorization, freshness and expected scale. Choose client-side search only when payload and privacy permit it. Distinguish server pagination from UI virtualization; they solve different costs.

## Execute

Use bounded requests, stable sorting and cursor/page semantics appropriate to changing data. Preserve filter/query state where sharing and Back matter. Avoid exposing private records through an otherwise public index. Keep loading, empty, stale and failed states distinct.

For virtualization preserve focus, meaningful labels and access to required information. Do not remove a focused row unexpectedly during a small scroll. Keep selection tied to stable record IDs across filtering. Plan index update/deletion propagation and user-visible freshness where consequential.

## Verify

Test no results, many results, changing filters quickly, late responses, deleted records and permission changes. Check duplicate/missing items at page boundaries. Measure actual payload, rendering and query behavior under representative data; a mocked list is not load testing.

## Deliver

Provide query/index contracts, pagination, selection identity, freshness and accessibility behavior. Record measured conditions and scale assumptions. Do not add a search engine or infinite scroll to a small content site without a real visitor benefit.
