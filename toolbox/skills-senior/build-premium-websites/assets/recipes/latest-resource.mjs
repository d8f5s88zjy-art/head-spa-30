// Resource preparation only. Never use this to discard or retry purchases/saves.
// prepare(input, {signal}) -> Promise<value>; commit(value) -> synchronous void.
export function createLatestResource(prepare, commit) {
  if (typeof prepare !== 'function' || typeof commit !== 'function') throw new TypeError('Need callbacks');
  let epoch = 0, active = null, disposed = false;
  return {
    async run(input) {
      if (disposed) throw new Error('Resource loader disposed');
      const request = ++epoch;
      active?.abort();
      const controller = new AbortController();
      active = controller;
      let value;
      try {
        value = await prepare(input, {signal:controller.signal});
      } catch (error) {
        if (request !== epoch || disposed || controller.signal.aborted) return {status:'stale'};
        throw error;
      } finally {
        if (active === controller) active = null;
      }
      if (request !== epoch || disposed || controller.signal.aborted) return {status:'stale'};
      const result = commit(value);
      if (result && typeof result.then === 'function') {
        // Consume rejection so contract violation cannot create an unhandled promise.
        Promise.resolve(result).catch(() => {});
        throw new TypeError('Commit must be synchronous; async side effects cannot be rolled back');
      }
      return {status:'committed'};
    },
    cancel() { epoch++; active?.abort(); active=null; },
    dispose() { if (!disposed) {disposed=true;epoch++;active?.abort();active=null;} }
  };
}
