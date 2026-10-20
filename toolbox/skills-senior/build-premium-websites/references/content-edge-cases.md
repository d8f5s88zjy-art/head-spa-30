# 030 — Odolnosť dizajnu voči obsahu

Use when a composition must survive editing, localization and missing optional media. Treat real variability as a design input.

## Decide

Identify which content is required for meaning and which is optional decoration. Set constraints based on the domain rather than convenient placeholder length. Decide how absence, unknown, zero and unavailable differ; do not collapse them into an empty string.

## Execute

Create a small fixture set: long Slovak title, unbroken URL, one item, many items, missing image, mixed aspect ratios, unpublished entry, unavailable price and longer translation. Define wrapping, grouping, pagination and fallback at the component level. Preserve complete critical terms; truncate only where an accessible path to the full content exists.

Use stable IDs for content and animation targets. Avoid coupling meaning to array index or visual position. If an editor reorders services, the price and booking destination must move with the same service. Reserve media geometry without fabricating a replacement testimonial or product.

## Verify

Render fixtures at representative widths and inspect the actual result. Check text zoom, sorting, filtering and animated reorder. Confirm that a missing optional field does not create a mysterious gap or disable the main action. Test data validation separately from presentation behavior.

## Deliver

Provide supported content rules, fallback compositions and a few reusable fixtures. Record which constraints the CMS enforces and which the UI handles. A professional template should remain usable after an ordinary editorial change without requiring a developer to retune every animation.
