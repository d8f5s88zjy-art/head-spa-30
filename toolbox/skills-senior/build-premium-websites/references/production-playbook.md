# 002 — Kompletný produkčný postup

## Contents

1. Diagnose the real problem
2. Establish art direction
3. Build semantic structure and tokens
4. Prepare media
5. Coordinate motion
6. Compose for mobile
7. Connect the visitor's path
8. Refine and hand off

## 1. Diagnose the real problem

Inspect the page and assets before proposing a redesign. Separate content, hierarchy, media quality, behavior, performance and implementation problems. A blurry product photo needs a better source or a smaller display area; a new animation library does not fix it. An unclear offer needs better information architecture; dramatic 3D does not explain it automatically.

Create a short evidence table: fact or asset, source, date, allowed use and uncertainty. Ask only for missing information that materially blocks the actual task. Continue with a reversible layout and explicit internal assumptions when appropriate.

Define one visitor outcome and the complete route to it. For a service site, that may be finding an appropriate treatment and requesting a real appointment. For a product, it may be selecting the correct variant and reaching a working purchase flow. For a portfolio, it may be understanding the role and contacting the author.

## 2. Establish art direction

Select references for mechanisms, not prestige. Contrast a composition reference with a content reference and a restraint reference. Write what transfers and what does not.

Determine:

- The first, second and third focal point.
- A type system with actual family names, weights, language coverage and use cases.
- Semantic color roles and the reason for the accent.
- A spacing rhythm and section cadence.
- A media language: documentary, studio product, illustration, editorial photography, material study or conceptual scene.
- One signature interaction or repeated graphic device.

Draw desktop and mobile compositions early. A wordmark intersecting a product may work at 1440 px but require a separate stacked arrangement at 390 px. Test real words, not short lorem ipsum.

## 3. Build semantic structure and tokens

Start with headings, content, links, buttons, forms and navigation in useful source order. Keep text and actions outside decorative canvases. Maintain a readable content width inside full-bleed image sections. Full width does not mean every paragraph spans the monitor.

Define tokens for text, backgrounds, accent, borders, focus, spacing, type and motion. Use a small component vocabulary. A grid is a relationship between pieces of content; do not make every section the same three-card row.

Reuse the project's framework and component contracts. Verify current APIs from official documentation before adding a dependency. Choose one animation authority for each property. Treat imported code as code to review, not proof of production quality.

## 4. Prepare media

For each asset record original dimensions, crop, intended display, rights and fallback. Use original project media for claims about real products, staff and locations. Stock or generated imagery may illustrate an idea but must not masquerade as evidence of the client's real venue.

Choose media according to the interaction:

| Interaction | Suitable starting point |
|---|---|
| No viewer control needed | Well-composed still image |
| Fixed cinematic motion | Prepared video, poster and responsive sources |
| Frame-accurate scroll sequence | Measured image/video sequence with bounded buffering |
| Inspecting angle or variant | Interactive model with meaningful controls |
| Explaining system relationships | Semantic diagram or labeled components; optional 3D |

For 3D, check geometry, UVs, material count, texture resolution, lighting and camera before adding post-processing. Use glTF optimization and texture compression only with visual comparison and decoder compatibility checks. Consider bounded DPR, scene suspension offscreen and capability-based fallback as design choices to measure.

Do not make a universal promise that one renderer, compression setting or pixel ratio is best. Set provisional budgets for the actual device and journey, measure and adjust.

## 5. Coordinate motion

Describe motion as a state transition: trigger, source state, target state, duration, easing, ownership, interruption and reduced-motion alternative. Give the visitor control. Long mandatory intros consume attention before delivering value.

For scroll scenes, use a deterministic progress model and named chapter ranges. Verify reverse scroll, refresh at the middle, direct anchor navigation, resized viewport and history restoration. Make content readable at all stable stops. Cancel old listeners and timelines on route changes.

Use transform and opacity where appropriate, but do not assume they are free. Large blur, layered transparency, many particles and simultaneous video decodes still cost resources. Reduce work based on measurement.

Keep sound opt-in. Present controls that remain usable without the animated scene. Do not infer a site's motion from an award thumbnail or automatically generated social description.

## 6. Compose for mobile

Choose the mobile focal point and crop deliberately. Stack by semantic priority; preserve the primary action. Replace hover-only interaction with a clear control. Let long content define height rather than forcing every section into a viewport.

Check narrow phone, wider phone, tablet and desktop layouts, plus orientation change and zoom. These checks are samples, not a claim of universal device testing. Reserve space for images and fonts to prevent layout instability.

Reduce decorative layers before removing information. Offer a simple index when a large spatial scene is impractical. Keep native scrolling and avoid gesture traps.

## 7. Connect the visitor's path

Use real destinations and all required states. A form needs labels, validation, loading, failure and an honest confirmation. A cart needs real variant and quantity behavior. A booking CTA must reach an authorized real booking flow or be clearly marked as a prototype.

Do not fabricate testimonials, customers, awards, metrics, prices or availability. If proof is missing, explain the actual process and show authentic work. Separate objective claims from art direction.

External messages, charges and publication require authorization for that scope. Prepare concrete work first and reuse prior authorization rather than asking again unnecessarily.

## 8. Refine and hand off

Review the whole page in a small overview and at actual reading scale. Fix rhythm, crop, contrast and inconsistent component details. Recheck only risks affected by the change; do not turn a small reversible typography edit into an unrelated test project.

Record what was actually checked, relevant environments and remaining limits. Keep editable sources, tokens and asset credits. Deliver the complete authorized task, not a promise to improve it in the background.

## Senior decision gate

- **Decision:** Choose a complete functional slice before multiplying visual effects.
- **Deliverable:** A working visitor journey and coherent composition.
- **Verification:** Inspect the real primary action with mobile and failure behavior.
