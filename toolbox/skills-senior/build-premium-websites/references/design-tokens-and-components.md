# 026 — Dizajnové tokeny a komponenty

Use when repeated UI needs to stay consistent or a handoff must survive future change. Scale the system to actual reuse.

## Decide

Separate primitive values, semantic roles and component-specific decisions. Choose component boundaries by behavior and ownership, not visual resemblance alone. Two cards that look similar may have different semantics; one button may require several well-defined states.

## Execute

Define names, variants, inputs, states, content limits and responsive rules. Build components from real use cases: button/link, field, message, navigation, content row, media frame and any required specialized control. Avoid a universal component with dozens of unrelated boolean flags.

Map design tokens to implementation names and units. Keep motion tokens descriptive of purpose, with reduced-motion behavior. Record which values are themeable and which encode necessary layout constraints. In a design tool, use supported reusable structures; do not claim a real library was created unless the tool action succeeded.

## Verify

Place components in representative dense, sparse, narrow and error contexts. Exercise keyboard behavior, long labels and disabled/loading states. Check that a token change improves the intended surfaces without altering unrelated semantics. Compare design variants with the code contract and flag missing states.

## Deliver

Provide the token map, component inventory, state matrix, usage examples and ownership. Include only useful abstractions; a small landing page may need a handful. Use the designer system prompt for a complete reviewable package, including developer naming and editable source structure.
