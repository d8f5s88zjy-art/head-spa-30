# 009 — Riziká a závislosti projektu

Use when missing inputs, integration uncertainty or release constraints can derail execution. Treat uncertainty as something to resolve, not a reason to stop all work.

## Decide

Identify the small set of risks that could invalidate scope, create irreversible damage or break the visitor's primary task. Describe each as cause, event and consequence. Separate an actual blocker from a preference and from a future hypothetical concern. Give priority to high consequence and weak evidence.

## Execute

Build a dependency order from real artifacts: booking contract before confirmation UI, source media before final crops, content schema before migration, rollback plan before a destructive change. For each important risk choose an owner, early signal, bounded investigation, fallback and decision deadline. Continue independent work while waiting for external inputs.

Prefer a small proof that addresses the weakest assumption. A loading spinner prototype does not de-risk an undocumented payment callback. A device trace with the actual model does. If a dependency cannot be inspected, state that limitation and implement an honest boundary rather than a fake integration.

## Verify

At each useful milestone check whether the original assumption still holds. Reassess only affected risks after changes. Make sure mitigation actually reduces the consequence rather than creating a new fragile dependency. An untested backup is not verified recovery; a disabled button is not duplicate transaction protection.

## Deliver

Keep a compact risk/dependency register and a next-action list. Mark resolved risks with the observation that resolved them. Report only material remaining limitations to the user. Do not add a generic safety checklist to a low-impact design edit; senior judgment includes keeping effort and caution proportionate.
