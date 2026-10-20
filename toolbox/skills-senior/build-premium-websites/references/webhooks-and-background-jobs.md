# 068 — Webhooky a úlohy na pozadí

Use when external events or slow work update the system asynchronously. Design for duplicates, delay and out-of-order delivery.

## Decide

Define event identity, authenticated origin, durable receipt, processing state and side effects. Distinguish receiving an event from completing its business action. Choose a queue only when asynchronous work and operational needs justify it.

## Execute

Verify signatures using the provider's documented raw-body and timestamp rules. Persist or durably enqueue accepted work before acknowledging when the architecture requires it. Make processing idempotent against the authoritative entity and event semantics. Do not assume delivery order or use a timestamp alone as a duplicate key.

Use bounded retries with backoff, a visible failed-work path and safe replay. Keep event handling versioned and validate payloads. Ensure a crash between a side effect and its receipt record cannot silently duplicate a consequential action; choose transactional/outbox or provider idempotency patterns as appropriate.

## Verify

Test invalid signature, duplicate event, delayed older event, worker crash and replay. Confirm the business invariant rather than just HTTP status. Check that failure logs contain useful identifiers without secrets or unnecessary customer payloads. Exercise the real provider's authorized test delivery where available.

## Deliver

Provide event contracts, deduplication scope, processing states, retry/replay procedure and ownership. Record limitations honestly. Do not describe an in-memory Set as durable duplicate protection for a multi-instance production system.
