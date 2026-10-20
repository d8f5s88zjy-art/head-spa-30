# 055 — Súbeh, asynchrónne operácie a transakcie

Use when requests can overlap, responses arrive late or repeated intent has consequences. Reads, writes and owned-resource loads need different contracts.

## Decide

Use latest-wins for replaceable reads such as search or preview selection. Use explicit transaction/idempotency rules for writes such as booking and payment. Aborting local presentation is not proof a server operation was cancelled. Define what “cancel” actually means for each boundary.

## Execute

Associate reads with an epoch/request identity and check it immediately before commit. Abort superseded work where supported, and independently ignore stale completion. Handle errors and late resources without unhandled rejection or leaks.

For writes create a stable operation identity and follow provider-specific retry semantics. Keep an ambiguous timeout distinct from a definite failure; query/reconcile the authoritative outcome before creating another operation where duplication matters. Preserve durable invariants with transactions, constraints or documented provider mechanisms. Do not promise exactly-once network delivery.

## Verify

Force out-of-order success, stale error, duplicate intent, timeout after accepted write and unmount before completion. Assert the final authoritative state and user-visible recovery. Test retry handling against the real integration contract in an authorized test environment; a mocked animation callback is not enough.

## Deliver

Provide operation identities, state transitions, retry/reconciliation rules and ownership of late results. Record provider versions and bounded test evidence. The bundled latest-resource utility coordinates reads; it is not a general payment or database transaction system.
