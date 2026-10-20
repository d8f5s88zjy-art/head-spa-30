# 067 — Obchod, ceny a checkout

Use when visual product choices affect what a visitor buys. Keep commerce authority separate from scene presentation.

## Decide

Identify catalog, SKU/variant identity, currency, price/tax source, inventory and payment provider. Distinguish displayed estimate from authoritative charge. Choose provider-supported checkout patterns before building a custom transaction interface.

## Execute

Bind scene selection, labels, accessibility controls and cart to the same stable variant. Validate price and entitlement server-side. Handle unavailable combinations and changed price explicitly. Preserve intended quantity and identity through loading and route transitions.

Use documented operation identities/idempotency for retries. Do not create payment operations from animation callbacks. Treat a return URL as navigation; obtain actual payment/order truth through the provider's documented verification path. Keep secret keys on the server and avoid collecting payment data outside the appropriate provider flow.

## Verify

Exercise selection changes during loading, unavailable variants, quantity bounds, currency formatting, rejected payment and duplicate webhook/retry paths in the authorized test context. Confirm the order/charge corresponds to the selected real SKU. A polished success screen is not evidence of successful payment.

## Deliver

Provide catalog mappings, authority boundaries, state/error flow and tested provider path. Use the appropriate commerce/payment skills for concrete integration work. Keep business policies and jurisdiction-specific requirements sourced; do not invent refund, tax or shipping conditions.
