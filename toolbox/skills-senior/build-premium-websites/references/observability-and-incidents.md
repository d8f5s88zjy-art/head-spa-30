# 089 — Monitoring a riešenie incidentov

Use when the site has ongoing operational responsibility or a failure needs diagnosis. Instrument what helps restore the visitor's task.

## Decide

Define critical operations and useful indicators: accepted booking rate, checkout errors, latency or content delivery freshness. Distinguish user-visible service health from infrastructure activity. Agree objectives and response ownership appropriate to the actual business, not an arbitrary enterprise number.

## Execute

Use logs for events, metrics for trends and traces for request relationships where the stack supports them. Include safe correlation identifiers, build/version and error context without secrets or unnecessary personal data. Alert on actionable symptoms with an owner and recovery guidance.

During an incident establish impact, start time, affected scope and the safest restoration action. Preserve evidence and distinguish facts from hypotheses. Mitigate before polishing a full causal narrative. Avoid external notifications unless explicitly authorized. Use a proportionate post-incident record after recovery.

## Verify

Exercise an authorized known failure to confirm visibility and routing. Check whether alerts distinguish a provider outage from a frontend exception. Validate recovery and watch for recurrence under stated conditions. An empty dashboard does not prove the absence of failure if instrumentation is broken.

## Deliver

Provide operational indicators, dashboard/query locations, response owner, runbook and known blind spots. Record observed incident lessons as targeted improvements. Do not promise 24/7 support or availability levels without an agreed service commitment and capacity.
