// Adapter, not a bundled dependency. Caller supplies compatible installed GSAP/ScrollTrigger.
// DOM content and CTA must already be readable; this only animates a decorative visual.
export function mountScrollScene({root, gsap, ScrollTrigger}) {
  if (!root || !gsap || !ScrollTrigger) throw new TypeError('Missing scene dependencies');
  const visual = root.querySelector('[data-scene-visual]');
  if (!visual) return () => {};
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia(root);
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const timeline = gsap.timeline({scrollTrigger:{trigger:root, start:'top bottom', end:'bottom top', scrub:true}});
    timeline.fromTo(visual, {yPercent:-4}, {yPercent:4, ease:'none'});
  });
  // matchMedia reverts its own animations/triggers. Add cleanup for any custom resources separately.
  return () => media.revert();
}
