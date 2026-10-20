# 063 — API kontrakty a validácia dát

Use when the website consumes or exposes external data. Treat every boundary as a contract with independent failure modes.

## Decide

Define request identity, permitted inputs, response shape, error semantics, pagination and version expectations. Distinguish trusted internal invariants from unvalidated external values. Static TypeScript types do not validate network responses.

## Execute

Validate at the receiving boundary and normalize deliberately into domain types. Preserve important distinctions such as absent, null, zero, unknown and unavailable. Use stable identifiers and documented units/currencies. Keep provider adapters separate from visual components so a contract change has a clear owner.

Set timeouts and retry rules appropriate to reads versus writes. Bound response sizes and pagination; avoid fetching an entire catalog to render one page. Handle rate limits and partial data honestly. Keep credentials and authoritative decisions on the server when required.

## Verify

Test a valid response, missing required data, unknown enum, malformed value, empty page, rate limit and provider failure. Inspect whether errors retain enough safe context for diagnosis without leaking secrets. Exercise the real authorized provider path for integration evidence, not only synthetic fixtures.

## Deliver

Provide schema, mapping, failure/retry behavior, version assumptions and representative fixtures. Mark which fields are display-only versus authoritative. Do not silently coerce corrupt data into plausible business values just to prevent an error screen.
