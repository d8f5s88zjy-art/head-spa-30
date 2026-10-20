// Original dependency-free mathematical helpers, not a rendering engine.
function finite(...values) {
  if (!values.every(Number.isFinite)) throw new TypeError('Expected finite numbers');
}
export function clamp01(value) {
  finite(value);
  return Math.min(1, Math.max(0, value));
}
export function mapProgress(value, start, end) {
  finite(value, start, end);
  if (end <= start) throw new RangeError('end must exceed start');
  return clamp01((value - start) / (end - start));
}
export function smoothstep(value) {
  const p = clamp01(value);
  return p * p * (3 - 2 * p);
}
export function damp(current, target, lambda, deltaSeconds) {
  finite(current, target, lambda, deltaSeconds);
  if (lambda < 0 || deltaSeconds < 0) throw new RangeError('Negative rate or time');
  return current + (target - current) * -Math.expm1(-lambda * deltaSeconds);
}
export function createShotSampler(keyframes) {
  if (!Array.isArray(keyframes) || keyframes.length < 2) throw new TypeError('Need at least two keys');
  // Copy once so caller mutation cannot change a running scene unexpectedly.
  const keys = keyframes.map((key, i) => {
    const {progress, position, target, fov} = key;
    finite(progress, fov);
    for (const v of [position, target]) {
      if (!Array.isArray(v) || v.length !== 3) throw new TypeError('Expected vec3');
      finite(...v);
    }
    if (progress < 0 || progress > 1 || fov <= 0 || fov >= 180) throw new RangeError('Invalid camera key');
    if (i && progress <= keyframes[i - 1].progress) throw new RangeError('Keys must increase');
    if (position.every((v, j) => v === target[j])) throw new RangeError('Camera and target coincide');
    return {progress, position: [...position], target: [...target], fov};
  });
  if (keys[0].progress !== 0 || keys.at(-1).progress !== 1) throw new RangeError('Keys must cover 0..1');
  return value => {
    const p = clamp01(value);
    let i = 1;
    while (i < keys.length - 1 && p > keys[i].progress) i++;
    const a = keys[i - 1], b = keys[i];
    const t = mapProgress(p, a.progress, b.progress);
    const mix = (x, y) => x + (y - x) * t;
    return {progress:p, position:a.position.map((x,j)=>mix(x,b.position[j])),
      target:a.target.map((x,j)=>mix(x,b.target[j])), fov:mix(a.fov,b.fov)};
  };
}
