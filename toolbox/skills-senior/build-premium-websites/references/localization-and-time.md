# 069 — Lokalizácia, mena a čas

Use when content, money or schedules serve multiple languages or regions. Locale and timezone are different inputs.

## Decide

Identify supported languages, authoritative timezone, currency and translation owner. Distinguish an instant, a local date and a recurring wall-clock appointment. Never assume the execution server's timezone is the user's or business's timezone.

## Execute

Use stable semantic keys and appropriate locale formatting for numbers, money and dates. Keep currency explicit and obtain minor-unit/rounding rules from the provider's documented contract. Do not concatenate sentence fragments that make translation awkward. Support pluralization and longer text deliberately.

For schedules retain the business timezone and handle ambiguous or nonexistent local times according to the booking system. Store and exchange instants with clear offsets where appropriate, without turning every date-only field into midnight UTC. Coordinate localized URLs, metadata and fallback language with content policy.

## Verify

Inspect Slovak diacritics, long translations, numeric formatting and screen-reader labels. Test daylight-saving boundaries relevant to the business, direct localized links and missing translation. Compare server/client rendering to prevent mismatched formatted output on hydration.

## Deliver

Provide locale/time/currency policy, content ownership, URL strategy and representative fixtures. Use current formatting API documentation and actual provider semantics. A translated heading does not make an otherwise hardcoded booking or checkout flow fully localized.
