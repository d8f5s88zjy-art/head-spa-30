# 033 — Kontinuita scén a kamery

## Contents
1. Map the film to an interactive document
2. Compose transitions
3. Resolve competing state
4. Use the chapter sampler
5. Own loaded resources explicitly

## 1. Map the film to an interactive document

Specify each scene's spatial subject, reader question, stable pose, text hold, entry/exit direction and mobile form. Use normalized progress for planning but derive actual scroll distance from content and viewport. A long paragraph requires enough ordinary reading space; do not force it into a narrow progress interval.

Identify three separate states: **requested input** (scroll/selection), **displayed progress** (possibly damped), and **business state** (selected service, variant, saved form). Decoration follows displayed progress. Business state must not be recomputed from a cinematic camera position. Use direct sampling for reload/reverse/anchors, and avoid event-only “play next scene” logic.

## 2. Compose transitions

| Pattern | Continuity anchor | Implementation boundary | Avoid | Fallback |
|---|---|---|---|---|
| Match composition | Subject position/scale/direction | Match source crops first; then crossfade/mask | Dissolving unrelated images and calling it a match cut | Direct cut between useful stills |
| Occlusion wipe | A foreground edge covers the junction | Keep occluder in separate decorative layer | Covering an active form or delaying navigation | Short opacity change or none |
| Shared detail | Stable object moves between layouts | Matrix-aware layout tool for transformed/nested ancestors | Treating viewport deltas as local pixels | Instant layout change |
| Camera handoff | Matching pose and apparent object size | Match projection/FOV, light and exposure at the junction | Teleporting camera at the chapter boundary | Separate static chapter |
| Product exploded view | Component correspondence | Label real parts and preserve selection | Invented internal structure or unreadable text attached to moving objects | Labeled still diagram |
| Depth reveal | Foreground/middle/background separation | Bound translation; review text readability throughout | Distorting factual geometry as a fake tour | Flat composition |
| Material reveal | Same geometry, controlled lighting/material | Validate actual variant map; interpolation is decorative | Showing impossible combinations or misleading finish | Real variant photo |
| Typography handoff | Repeated word/baseline/grid line | Preserve one accessible reading order and stable copy | Per-letter delays for body copy | Full phrase visible immediately |
| Editorial chapter cut | Repeated margin/line/shape | Let clear content change be the transition | Mandatory long pinning with no information | Standard section break |
| Data-to-scene bridge | Same selection or identifier | Commit real data once; animate representation separately | A visual tween performing a purchase or data mutation | Immediate truthful state |

For film terminology and the complete FX catalog use the existing motion chapters. Do not claim these original web recipes reproduce a particular reference site's implementation.

## 3. Resolve competing state

Choose one owner per property. Put layout transform on a wrapper, hover feedback on a child, camera input under one controller, and business selection in the existing app state. Avoid several libraries writing `transform` on the same element.

During rapid navigation, load resources with request identity and cancellation; accept only the latest live request. Aborting fetch is insufficient if decoding or other asynchronous work has already started. Guard the final commit too. Keep commit synchronous and local; a visual transition must never repeat a server mutation. The bundled `latest-resource.mjs` demonstrates this narrow contract without pretending to be a router or transaction client.

For responsive changes, recompute scene geometry after layout settles, preserving the logical chapter or destination as appropriate. Do not animate a resize-induced reflow through a stale coordinate snapshot. Use a native static flow when pinning or transformed geometry cannot be made reliable.

For complex FLIP with nested/transformed targets, evaluate the actual GSAP Flip integration and its documented nested handling; the simple bundled translation helper deliberately declines that geometry. S040. For R3F on-demand rendering, call invalidation when imperative mutations need a frame and verify the first frame of a synchronous animation; an idle frame loop alone does not guarantee smooth interaction. S037.

## 4. Use the chapter sampler

`assets/recipes/scene-timeline.mjs` validates a continuous ordered partition of 0..1. It returns chapter, phase and local progress deterministically, with exact boundaries assigned to the next chapter except for the final endpoint. It deliberately does not hide text, pin DOM, manage a router or promise camera continuity. A chapter's `anchor` is descriptive metadata; browser navigation remains the app's responsibility.

Read `assets/templates/scene-plan.json` for a fictional three-beat example. Use the returned state to drive one displayed timeline. With reduced motion, preserve the same logical chapter but render its stable representation. Verify actual DOM/rendering separately; mathematical continuity is not perceptual continuity.

## 5. Own loaded resources explicitly

`latest-resource.mjs` prevents a stale commit but intentionally does not know how to dispose arbitrary values. For allocated models or images use `owned-selection.mjs` with explicit ownership callbacks.

| Stage | Owner and obligation |
|---|---|
| Partial prepare, then rejection | `prepare` owns and releases partial allocations before rejecting |
| Successful prepare, not yet adopted | Wrapper holds the result for this request |
| Stale result, cancellation, unmount before adoption | Wrapper invokes `discard(value)` once, even if loading ignored abort |
| Partial attach, then throw before `claim()` | `discard` must detach and release the unclaimed new object |
| Application stores next and calls `claim()` | Application owns next, including if a later step throws |
| Successful replacement | Application detaches/releases previous; errors are reported without discarding next |
| Component destruction | Cancel pending selection; application releases current; late unclaimed values are discarded |

`adopt` and `discard` must be synchronous. Do not reenter the selection controller from either callback. `discard` should attempt all owned cleanup steps and report failures; never silently call a failed cleanup successful. The wrapper is not a universal rollback engine and does not own the currently displayed model. Protect asynchronous UI status updates with the caller's current selection/lifecycle identity as well.

```js
let current = null;
const selection = createOwnedSelection(
  loadDetachedOwnedModel,
  (next, claim) => {
    attachAndRenderCurrentPose(next); // discard must undo partial attachment on error
    const previous = current;
    current = next;                  // store in the application owner first
    claim();                        // exact ownership handoff
    try { releaseOwned(previous); }
    catch (error) { reportCleanupFailure(error); }
  },
  next => releaseOwned(next)
);
function unmountGallery() {
  selection.dispose();
  const previous = current;
  current = null;
  releaseOwned(previous);
}
```

The function names above are integration seams, not supplied renderer implementations. `releaseOwned` must be safe for null, idempotent for its owned lease and able to detach a partially attached root. Track shared textures/materials with leases or reference counting; do not destroy another component's assets. Three.js material disposal does not automatically release textures, and owned ImageBitmap resources need their own lifecycle. A mesh removal alone is not resource disposal. S041.

When motion preference changes, stop the relevant animation and render the current logical chapter's static pose immediately. A sampler returning `presentation: static` does not stop a RAF by itself. Preserve selected product/variant independently. For BFCache suspension, retain the recoverable instance and re-evaluate state on restoration; do not apply irreversible component unmount disposal to every persisted pagehide.

Node test doubles demonstrate ownership callbacks and control flow. They do not prove physical GPU memory release. Verify repeated real model swaps and inspect trends after settling; Three.js internal caches mean counters need not reach zero. S041.

## Senior decision gate

- **Decision:** Keep text, camera and selected state coherent across time and async completion.
- **Deliverable:** A deterministic scene/state plan and ownership rules.
- **Verification:** Exercise mid-page entry, out-of-order loads and disposal of unclaimed resources.
