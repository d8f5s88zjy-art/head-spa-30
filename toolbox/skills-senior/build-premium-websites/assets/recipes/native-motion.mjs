// All helpers enhance an already committed, visible target DOM state.
// Layout wrappers must not have another owner of transform.
export function createMotionController(media = window.matchMedia('(prefers-reduced-motion: reduce)')) {
  const running = new Set(), owners = new WeakMap();
  let disposed = false;
  function cancel(element) {
    const old = owners.get(element);
    if (old) { old.cancel(); running.delete(old); owners.delete(element); }
  }
  function stopAll() {
    for (const animation of running) animation.cancel();
    running.clear();
  }
  const preferenceChanged = () => { if (media.matches) stopAll(); };
  media.addEventListener('change', preferenceChanged);
  return {
    get reduced() { return media.matches; },
    get activeCount() { return running.size; },
    cancel,
    play(element, keyframes, options = {}) {
      cancel(element);
      if (disposed || media.matches || typeof element.animate !== 'function') return null;
      const animation = element.animate(keyframes, {duration:320, easing:'cubic-bezier(.2,.7,.2,1)', ...options, fill:'none'});
      owners.set(element, animation); running.add(animation);
      const release = () => {
        running.delete(animation);
        if (owners.get(element) === animation) owners.delete(element);
      };
      // Cancellation is expected; attach rejection handling immediately.
      animation.finished.then(release, release);
      return animation;
    },
    dispose() { if (!disposed) { disposed = true; stopAll(); media.removeEventListener('change', preferenceChanged); } }
  };
}

function plainLayout(element) {
  const view = element.ownerDocument?.defaultView;
  if (!view?.getComputedStyle) return false;
  for (let node = element; node; node = node.parentElement || node.getRootNode?.().host || null) {
    const style = view.getComputedStyle(node);
    // Rectangles are viewport coordinates. Without matrix conversion their deltas
    // cannot be used as local pixels under transformed or CSS-zoomed ancestors.
    if ([style.transform,style.perspective,style.rotate,style.scale,style.translate].some(v=>v && v !== 'none')) return false;
    if (style.zoom && style.zoom !== '1' && style.zoom !== 'normal') return false;
  }
  return true;
}

export function flipTranslate(elements, commitLayout, controller, geometrySupported = plainLayout) {
  const before = new Map(elements.map(el => [el, el.getBoundingClientRect()]));
  elements.forEach(el => controller.cancel(el));
  commitLayout(); // Synchronous layout mutation, exactly once.
  const safe = elements.filter(el => el.isConnected && geometrySupported(el) &&
    !elements.some(other => other !== el && (el.contains?.(other) || other.contains?.(el))));
  const after = new Map(safe.map(el => [el, el.getBoundingClientRect()]));
  for (const [el, last] of after) {
    const first = before.get(el);
    if (!first.width || !first.height || !last.width || !last.height) continue;
    const x = first.left-last.left, y = first.top-last.top;
    if (x || y) controller.play(el, [{transform:`translate(${x}px, ${y}px)`}, {transform:'translate(0px, 0px)'}]);
  }
}

// Same-document, synchronous visual DOM commits only. Not a router or transaction API.
export function createViewSwitcher(doc = document, media = window.matchMedia('(prefers-reduced-motion: reduce)')) {
  let active = null, sequence = 0, disposed = false;
  const preferenceChanged = () => { if (media.matches) active?.skipTransition(); };
  media.addEventListener('change', preferenceChanged);
  return {
    async update(commit) {
      if (disposed) throw new Error('View switcher disposed');
      if (typeof commit !== 'function') throw new TypeError('Expected synchronous commit');
      const request = ++sequence;
      active?.skipTransition();
      let applied = false;
      const once = () => {
        if (applied || request !== sequence || disposed) return;
        applied = true;
        const result = commit();
        if (result && typeof result.then === 'function') throw new TypeError('Commit must be synchronous');
      };
      if (media.matches || typeof doc.startViewTransition !== 'function') { once(); return applied; }
      let transition;
      try { transition = doc.startViewTransition(once); }
      catch (error) {
        if (applied) throw error; // Never replay a failed commit.
        once(); return applied;
      }
      active = transition;
      transition.ready.catch(() => {}); // Skipped/unsupported visual animation is non-fatal.
      try { await Promise.all([transition.updateCallbackDone, transition.finished]); }
      finally { if (active === transition) active = null; }
      return applied;
    },
    dispose() {
      if (!disposed) { disposed=true; sequence++; active?.skipTransition(); media.removeEventListener('change', preferenceChanged); }
    }
  };
}
