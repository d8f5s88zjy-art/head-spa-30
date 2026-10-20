# 007 — Architektonické rozhodnutia

Use when a choice changes responsibility boundaries, deployment, data authority or long-term cost. Skip a formal record for routine local styling.

## Decide

Start with the existing system and its real limits. Compare retaining it, extending it and replacing it against the required journey, operating skill and migration risk. Choose by constraints rather than novelty. Distinguish a reversible library choice from a content model or identity scheme that will be costly to migrate.

## Execute

Write a compact record: context, decision, considered alternatives, tradeoffs, consequences, evidence and revisit trigger. Draw boundaries among content, domain logic, presentation, animation and infrastructure. Put price, entitlement and transaction authority on the server/provider, not inside a cinematic component. Define which module owns each changing state and how others observe it.

Use a representative vertical slice to challenge the architecture: initial render, real interaction, failure, recovery and deployment. Prefer an established monolith for a small team unless independently deployed services solve a demonstrated problem. Avoid abstractions whose only consumer is an imagined future customer.

## Verify

Ask whether the proposed choice can be built, operated and changed by the actual maintainer. Check dependency compatibility and implementation documentation at the installed versions. Exercise one costly boundary, such as authenticated data caching or editor preview. A successful isolated demo does not settle production availability or integration concerns.

## Deliver

Provide the decision record and the minimum component/data diagram needed to understand it. Include a migration or exit path for meaningful lock-in. Keep rejected options brief and factual. Revisit the decision when its stated constraint changes; do not endlessly reopen it because a different framework becomes popular.
