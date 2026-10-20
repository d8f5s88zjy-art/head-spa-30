# 066 — Rezervácie a dostupnosť

Use when users choose a service, time, resource or practitioner. An available-looking calendar is not a reservation system.

## Decide

Identify the authoritative provider, slot duration, location timezone, resource constraints and confirmation rules. Distinguish external-link booking, embedded provider flow and custom server integration. Do not infer live availability from a static schedule.

## Execute

Keep service IDs, prices/durations and booking destination aligned. Represent selected, checking, held if supported, confirmed, expired and unavailable states according to the provider's real capabilities. Revalidate availability where the contract requires it; two visitors can select the same apparent slot.

Handle retries and ambiguous outcomes without creating duplicate reservations. Preserve the selected service while explaining an unavailable time. Use explicit timezone display and provider identifiers. Keep notifications separate from reservation truth; an email failure does not necessarily undo a booking.

## Verify

Use an authorized test environment or read-only destination check appropriate to scope. Test unavailable slots, expired selection, slow response, repeated submit and return from the provider. Check daylight-saving and locale formatting for the actual location. Avoid sending real customer notifications merely to test a design.

## Deliver

Provide integration type, state model, authoritative IDs, timezone policy and actual evidence. If the scope is a real external link, report that honestly. Do not call a decorative date picker or synthetic confirmation a working booking integration.
