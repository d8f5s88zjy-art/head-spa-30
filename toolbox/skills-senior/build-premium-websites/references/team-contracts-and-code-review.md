# 095 — Tímové kontrakty a code review

Use when several contributors work on the same product or a change needs another maintainer's review. Make boundaries and intent easy to inspect.

## Decide

Define module ownership, integration contracts and the minimum shared context. Separate parallel independent work from dependent mutations. Delegate only when the session and applicable instructions authorize it; this chapter is not blanket permission to create agents.

## Execute

Provide each contributor the real task, interfaces, constraints and artifacts needed. Avoid leaking expected answers into independent evaluation. Preserve shared working-tree changes and coordinate edits to the same files. Use stable IDs and explicit contracts for data, design tokens and motion ownership.

Write reviews around correctness, user impact, maintenance and observed evidence. Distinguish blocking defects from suggestions. A PR description should explain the problem, change, resulting behavior and relevant checks. Avoid line-by-line narration of obvious code or vague “looks good” approval.

## Verify

Inspect the combined behavior at integration seams, not only each contributor's local result. Check that cleanup, naming, error semantics and dependency versions agree. Investigate conflicting findings from the source artifact and run targeted checks rather than averaging opinions.

## Deliver

Provide a reviewable diff, interface decisions, test evidence and unresolved material issues. Keep code and design handoff aligned. Do not send external comments or messages unless explicitly authorized, and do not claim an independent review when everyone saw the intended answer.
