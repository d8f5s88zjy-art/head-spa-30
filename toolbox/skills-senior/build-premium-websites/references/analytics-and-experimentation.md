# 092 — Analytika a experimenty

Use when evaluating business behavior or comparing design alternatives. Define the measurement before interpreting a chart.

## Decide

Choose the decision, primary metric, denominator, observation window and guardrails. Distinguish link clicks, submissions, accepted bookings and revenue. Check whether the available traffic and data quality can support an experiment; small samples may only justify qualitative learning.

## Execute

Write an event contract with trigger, identity/deduplication scope and permitted properties. Keep private data out of event payloads. Coordinate consent behavior with the actual policy. Verify events through the implemented journey, including Back/forward and retries.

For an experiment state the hypothesis, allocation unit, expected mechanism, stopping rule and relevant confounders before looking for a winning result. Preserve comparable populations and exposure. Do not keep peeking until a convenient result appears or attribute unrelated seasonal change to an animation.

## Verify

Check missing/duplicate events, bot/internal traffic assumptions and end-to-end outcome reconciliation where available. Validate assignment persistence and guardrails. Distinguish observational correlation, controlled evidence and subjective preference. Use the relevant analytics skill for consequential analysis.

## Deliver

Provide metric definitions, data limits, observations and the justified decision. Do not claim uplift from visual polish alone. If evidence is insufficient, recommend the next useful observation rather than manufacturing precision or launching an oversized experiment programme.
