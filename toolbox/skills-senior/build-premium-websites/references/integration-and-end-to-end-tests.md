# 085 — Integračné a end-to-end testy

Use when independently correct pieces can fail together. Choose tests that protect meaningful behavior and boundary contracts.

## Decide

Identify the few failures with real consequences: wrong SKU, duplicate booking, unauthorized data, lost form input or inaccessible navigation. Choose the narrowest test layer that can reveal each. Avoid brittle tests that mirror implementation or add ceremony to trivial reversible changes.

## Execute

Use deterministic fixtures for pure logic and representative integration paths for real adapters. Keep test environments and accounts explicit. Model slow, rejected, duplicated and out-of-order responses where they affect correctness. Separate mocked evidence from actual provider/browser observations.

For end-to-end checks, exercise a visitor's intention through the real UI and authoritative response. Use supported browser tools and existing project test workflows. Do not bypass tool restrictions or send real emails, charges or notifications without authorization. Keep tests isolated and restore approved fixtures.

## Verify

Investigate flaky failures rather than masking them with arbitrary waits or repeated passes. Assert outcomes and invariants, not CSS selectors chosen only because they are convenient. Re-run affected tests after fixes and stop broader repetition once the concrete risk is resolved.

## Deliver

Provide scope, environment, commands/observations, results and remaining gaps. A passing local suite is evidence for those cases only. Preserve useful regression tests for observed bugs and avoid inflating quality claims by counting superficial assertions.
