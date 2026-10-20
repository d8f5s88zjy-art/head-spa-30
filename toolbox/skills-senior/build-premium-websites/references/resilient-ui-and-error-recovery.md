# 059 — Odolné rozhranie a obnova po chybe

Use when normal network, content or dependency failures can leave the visitor stuck. Design recovery as part of the main flow.

## Decide

Distinguish empty data, unavailable service, forbidden access, invalid input, stale data and unexpected failure. Decide which failures can be retried safely and which need reconciliation or another route. Avoid a generic “Something went wrong” for every condition.

## Execute

Keep errors scoped to the failed feature while preserving useful surrounding content. Retain valid input and explain the next action. Show last-known data only with appropriate freshness/authority semantics; stale price or availability cannot silently authorize a transaction. Keep destructive recovery actions deliberate.

Implement retry with bounded attempts and an explicit stop state. Do not retry every write blindly. Provide a fallback contact or destination when it is real and within scope. Ensure loading states have a failure path and that visual overlays are removed on rejected promises.

## Verify

Simulate the specific failures that threaten the primary journey. Check focus, messages, preserved input and actual recovery. Return from another route after an error and repeat the action. Confirm that failures do not expose secrets, raw customer data or misleading success states.

## Deliver

Provide the error taxonomy, user messages, retry/reconciliation policy and observed checks. Avoid inventing backend behavior to make a mockup look complete. Report a blocked integration honestly while finishing the rest of the authorized experience.
