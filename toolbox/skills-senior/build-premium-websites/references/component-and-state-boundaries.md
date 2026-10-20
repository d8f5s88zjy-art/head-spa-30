# 053 — Komponenty a vlastníctvo stavu

Use when state becomes inconsistent or a component mixes unrelated responsibilities. Split by behavior and ownership rather than file-size anxiety.

## Decide

Identify authoritative domain state, derived presentation state, transient interaction state and external resources. Decide the narrowest owner that can coordinate consumers correctly. Avoid maintaining several independently editable copies of selected variant, price or route.

## Execute

Model meaningful states explicitly and derive values where possible. Keep animation progress separate from confirmed business status. Pass stable identity through the content, DOM and scene layers. Use an event/reducer model when transitions and invariants are complex, not by default for a simple toggle.

Keep components focused: semantic shell, data adapter, media renderer and motion controller can have distinct responsibilities. Synchronize external systems through a scoped lifecycle. Use effects for real synchronization rather than storing values that could be calculated during render. Preserve the existing framework's conventions.

## Verify

Exercise state combinations that must be impossible: unavailable product marked purchasable, old model with new price, success after failed submission. Check repeated mounts and changed props. Validate external data at the boundary rather than relying on static types alone.

## Deliver

Provide the state owner map, component contracts, allowed transitions and important invariants. Include cleanup ownership for external resources. Favor a few clear seams over a general-purpose abstraction that makes ordinary changes harder to understand.
