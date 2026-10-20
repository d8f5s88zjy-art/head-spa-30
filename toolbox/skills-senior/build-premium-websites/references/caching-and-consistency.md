# 079 — Cache a konzistentnosť dát

Use when content freshness, performance or privacy depends on cached responses. Make cache identity and authority explicit.

## Decide

Classify immutable assets, public changing content, personalized data and transactional truth. Choose freshness tolerance for each. A cached product description may be acceptable while cached availability cannot authorize a new reservation. Define who invalidates or revalidates after a change.

## Execute

Set policies at browser, CDN, application and provider layers deliberately. Version immutable asset URLs. Scope keys by relevant locale, query, identity and tenant where needed. Avoid serving authenticated data through a shared public cache. Distinguish `no-cache` revalidation from `no-store` storage prevention.

Coordinate CMS publication with cache invalidation and keep preview isolated. Handle stale-while-refresh presentation honestly where used. Do not assume browser history restoration follows normal HTTP fetch behavior; recheck consequential state on the appropriate lifecycle event. Document cache ownership to avoid several layers silently overriding each other.

## Verify

Test cold/warm reads, content update, logout/account change, locale change and stale provider response. Inspect actual headers and returned data through the deployed path. Confirm that invalidation reaches the user-visible layer and does not leak another visitor's data.

## Deliver

Provide cache classes, keys, lifetimes, invalidation triggers and evidence. Do not apply one aggressive policy to every response to improve a benchmark. Performance and consistency must both match the visitor task.
