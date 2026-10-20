# 056 — URL, história a priame odkazy

Use when meaningful state should survive reload, sharing or browser navigation. Let the established router own history.

## Decide

Choose which state belongs in a path/query/hash and which is ephemeral. Product identity, filters and a meaningful chapter often merit a URL; pointer position usually does not. Keep sensitive data out of URLs because they may appear in logs and referrers.

## Execute

Define valid parameter parsing, defaults and invalid-state behavior. Use push versus replace according to user navigation semantics, not every animation frame. Coordinate title, focus and scroll restoration with committed route state. For async routes, prevent older results from changing the current address or focus.

Support native links, new tabs and direct entry. Preserve in-page anchors beneath sticky headers. A visual transition must not swallow browser Back or require the entire intro to run before a shared destination appears. Keep page state recoverable when the enhancement bundle fails.

## Verify

Open a direct link in a fresh session, reload, change filters, navigate away and return. Test malformed/unknown parameters and browser Back during a pending route. Check whether a restored scroll position agrees with the cinematic scene's computed state.

## Deliver

Provide the URL schema, push/replace rules, parsing behavior, title/focus/scroll policy and observed navigation checks. Use established routing APIs at installed versions. Do not build a second global popstate handler without reconciling it with the existing router.
