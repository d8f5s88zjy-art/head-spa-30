# 064 — Dátový model a migrácie

Use when persistent data structures change. Start from domain invariants and the compatibility needs of running code.

## Decide

Identify entities, relationships, identity, uniqueness, required history and deletion semantics. Decide which invariants belong in constraints or transactions. Separate an additive compatible change from a destructive conversion; authorization to adjust a UI does not automatically authorize deleting production data.

## Execute

Use the established migration tooling and inspect actual schema/version. For rolling changes prefer an expand, backfill, transition, contract sequence when appropriate. Keep old/new application compatibility explicit. Backfills need bounded batches, restartability, observability and a reconciliation check.

Plan rollback before the write. Reverting application code does not automatically reverse a data migration. Preserve backups and a tested restoration path for consequential changes. Choose isolation and retry behavior from the actual database contract; a serializable transaction can still require an application retry.

## Verify

Test on representative authorized fixtures including duplicates, missing values and interrupted batches. Check row/entity counts and important invariants before and after. Verify old/new application behavior during the transition and inspect query plans for affected hot paths. Do not run destructive production experiments to prove the design.

## Deliver

Provide migration steps, preconditions, backup/restore path, compatibility window, verification and owner. Keep unknown data quality visible until measured. A successful migration script exit is insufficient evidence that business relationships were preserved.
