# 058 — Schopnosti prehliadača a progresívne vylepšenie

Use when relying on modern CSS, transition, media or graphics features. Build a useful base and add capability-specific behavior.

## Decide

Identify the exact feature the design needs, not merely an API family name. Decide the fallback for unsupported behavior and partial failure. Browser brand or a successful constructor does not prove every required subfeature works.

## Execute

Use appropriate feature detection, CSS supports conditions and guarded initialization. Keep ordinary links, readable content and controls functional before optional enhancement loads. Handle dynamic import, media and graphics errors locally. Avoid downloading expensive assets for a branch that will not be used.

Document the support target from real project needs. Recheck current primary documentation when selecting new APIs. Separate capability, user preference and measured performance; all three may change the experience differently. Preserve deterministic content and focus across fallback paths.

## Verify

Exercise unsupported branches deliberately instead of waiting for a user report. Test a rejected initializer, missing chunk, reduced motion and fallback navigation. Inspect the baseline with decorative JavaScript unavailable. Do not infer performance from feature detection.

## Deliver

Provide a capability matrix, base/enhanced behavior and evidence for the tested environments. State version-specific uncertainty where relevant. A fallback should be an intentional design with the same primary purpose, not an error message telling visitors to buy a different device.
