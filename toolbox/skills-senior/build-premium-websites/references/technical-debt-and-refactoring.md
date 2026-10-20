# 094 — Technický dlh a refaktoring

Use when existing structure makes a requested change risky or slow. Improve a concrete constraint rather than rewriting for personal preference.

## Decide

Identify the cost of the debt: duplicated authority, fragile lifecycle, untestable boundary, obsolete dependency or inconsistent data. Compare a local repair, incremental extraction and replacement. Keep approved behavior and user changes intact.

## Execute

Establish the affected behavior with a useful baseline or characterization check. Make one seam clearer at a time: isolate provider adapters, separate domain state from effects, centralize real duplication or remove dead code. Avoid combining a major redesign, migration and refactor unless the scope explicitly requires it.

Use small reviewable changes and keep a rollback path. Preserve semantic behavior during extraction. Do not abstract every repeated line; repeated responsibility with coordinated change is stronger evidence than superficial syntax similarity.

## Verify

Run checks that protect the behavior being preserved and inspect the affected UI. Check performance/resource ownership if the refactor changes lifecycle. Review the diff for unrelated churn and accidental loss of in-progress work. A smaller file count is not by itself an improvement.

## Deliver

Explain the original constraint, what became easier/safer and the evidence that behavior survived. Record remaining debt with consequences and revisit triggers. Stop when the authorized change is reliable; do not use the task as permission for an unlimited architecture cleanup.
