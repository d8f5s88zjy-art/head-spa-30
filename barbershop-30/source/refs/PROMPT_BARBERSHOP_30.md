# BARBERSHOP 30 — Cinematic Website + AI Video Production Prompt

Copy the entire prompt below into Claude Code/Claude with **Max Studio Ultra X 6.0** installed. Connect Higgsfield or the currently eligible Google Veo/Google Vids tools when asset generation is required.

```text
Use Max Studio Ultra X in premium local-business + cinematic website mode. Route media through Higgsfield Production Director or Google Video Production Director according to the connected tools and approved production brief.

PROJECT
Create a complete, production-quality website for BARBERSHOP 30. The central idea is “Choose the cut before you sit in the chair.” Visitors must be able to see haircut examples, select the exact style they want, add details or a reference photo, and carry that structured haircut brief into the reservation flow so the barber knows what the client expects.

Do not create only a visual mock-up. Build the working responsive website, interactions, forms, media fallbacks, and booking handoff. If an existing repository is supplied, inspect it and preserve its working stack and conventions. For a new repository, use a maintainable modern stack such as Next.js + TypeScript with accessible semantic HTML and a small, justified motion layer. Do not add heavy 3D or multiple animation libraries merely for spectacle.

TRUTH RULE
Inspect all supplied website content, logo, photos, videos, service list, prices, barbers, address, opening hours, contact details, social links, reviews, and booking URL before writing production copy. Never invent them. Put unresolved facts in one typed content/config file and mark them clearly as REQUIRED_REAL_DATA, while still completing the structure and demo interactions. Never fabricate a booking confirmation, testimonial, award, price, barber profile, or haircut result.

PRIMARY USER JOURNEY
1. Understand the Barbershop 30 brand within three seconds.
2. Experience a short cinematic moss-wall/scissors reveal without being blocked.
3. See real or clearly labelled inspirational haircut examples.
4. Choose a haircut and specify the result.
5. Review the haircut brief.
6. Continue to the verified Bookio reservation flow with the selection preserved through supported prefill fields, or through a real alternative handoff if Bookio cannot accept those fields.

BRAND DIRECTION
Create an original, masculine, premium, tactile identity—not a generic black-and-gold barber template.

- Core materials: deep forest-green living moss, matte charcoal/near-black, warm walnut, brushed dark metal, restrained antique brass, warm ivory type.
- Mood: confident, precise, calm, modern craftsmanship; cinematic but welcoming.
- Typography: one editorial display face with character plus one highly legible grotesk/sans for interface and Slovak text. Load efficiently and provide system fallbacks.
- Photography: honest close-ups of craft—scissors, comb, clippers, hair texture, hands, mirror, chair, and interior details. Preserve real skin and hair texture; avoid plastic AI faces.
- Layout: editorial asymmetry, strong negative space, precise grid, tactile full-bleed media, subtle hairline rules. Avoid repetitive equal cards, excessive rounded containers, glassmorphism, neon gradients, and animation on every element.
- Motion rhythm: stillness → precise cut → reveal → calm confidence. Use the sound/motion language of one clean snip, not constant visual noise.

SLOVAK HERO COPY
Eyebrow: BARBERSHOP 30
Headline: VYBER SI STRIH. MY HO DOTIAHNEME.
Subheadline: Pozri si výsledok ešte pred rezerváciou, vyber štýl a pošli barberovi presnú predstavu.
Primary CTA: VYBRAŤ STRIH
Secondary CTA: REZERVOVAŤ TERMÍN
Optional microcopy: Tvoj výber sa pridá k rezervácii.

Adjust the wording only if verified brand copy is supplied. Keep all customer-facing website copy in natural Slovak with correct diacritics.

SIGNATURE OPENING EXPERIENCE — MOSS CUT REVEAL
Build a short, non-blocking full-viewport opening composition. It is a website hero transition, not a splash screen that hides the business.

Sequence:
- 0.0–0.7 s: an extreme tactile view of a dark green moss wall fills the frame. BARBERSHOP 30 navigation and a Skip intro control are already usable in accessible HTML.
- 0.7–2.4 s: one pair of polished barber scissors makes a precise vertical cut through a narrow centre line of long moss fibres. Each closure is readable. The moss fibres separate like hair; no destruction, gore, melting, or fantasy debris.
- 2.4–3.2 s: the two moss planes ease apart just enough to reveal warm amber light and the real barbershop interior. The camera moves through the opening.
- 3.2–5.8 s: match cut to a macro, physically correct scissors-over-comb haircut on a client. One barber hand holds the comb; the other controls one pair of scissors. The blades cut only hair extending beyond the comb, never skin or ear. Fine trimmed strands fall naturally with gravity. Show craft and the evolving shape of the cut.
- 5.8–6.5 s: settle into the website hero frame with a clear client silhouette/interior on one side and readable headline + CTAs on the other.

For generation reliability, produce this as two independently approved shots—A: moss reveal; B: haircut detail—and join them with a controlled match cut. Use Higgsfield or Google Veo according to live capability inspection; Google Vids may assemble, narrate, caption, review, and export the sequence. Generate deliberate 16:9 desktop and 9:16 mobile compositions rather than blindly cropping one master. Also create optimized poster frames for both.

The intro must:
- be muted and playsinline when autoplay is attempted;
- never autoplay sound;
- expose Skip intro immediately and remain navigable before video loads;
- collapse to the final poster/hero for prefers-reduced-motion, failed autoplay, unsupported codec, Save-Data/slow connection, or a repeat visit when appropriate;
- keep headline and both CTAs as HTML, never baked into generated video;
- avoid scroll locking after the first resolved state;
- pause when offscreen/hidden;
- finish in a visually stable hero, without flashing or a black frame.

HIGGSFIELD PRODUCTION WORKFLOW
If the Higgsfield connector/plugin/CLI is available, inspect the current models, operations, parameters, credits, generation history, and job-status tools before calling anything. Load references 93, 94, and 95. Do not assume model names or costs are current.

1. Label supplied assets as @MOSS_REFERENCE, @INTERIOR_REFERENCE, @BARBER_REFERENCE, @CLIENT_REFERENCE, @HAIRCUT_REFERENCE, and @BRAND_REFERENCE. State exactly what each controls.
2. Establish reference stills before video. Use the real shop interior and real brand assets when provided.
3. Generate one short low-cost preview for Shot A and Shot B separately.
4. Inspect hands, tool count, grip, hair state, moss behaviour, screen direction, lighting, and the last/first frames of the match cut.
5. Change one variable per revision. Prefer regional repair for one local defect.
6. Stop after two materially similar failures and report the exact blocker rather than repeatedly spending credits.
7. Generate approved desktop and mobile masters, then web derivatives and posters.
8. Probe and visually inspect the actual files before integrating them.

GOOGLE VEO + GOOGLE VIDS ALTERNATIVE
If Google video tools are the selected production route, load references 96–99 and use `PROMPT_GOOGLE_VIDEO_STUDIO_PRO.md`. Inspect the live account, models, clip controls, formats, limits, audio behavior, eligibility, quota, and export options rather than assuming them. Search the packaged codebook for `cinematic website hero`, `local booking`, or `tactile macro craft`; shortlist at most five `GV-xxxxx` recipes and record one selected code in the brief. Verified starting candidates are `GV-19941` for a tactile, looping cinematic website hero and `GV-18243` for a local-booking before/process/after macro sequence; still compare them to the final brief before selection.

Create Shot A and Shot B below as separate Veo shot packets with the same safety, first-frame, camera, lighting, physics, continuity, and QC requirements. Generate and inspect one representative preview before masters. In Google Vids, assemble only approved source clips, keep all business copy and CTAs as editable text, align optional audio and captions, preserve the source/prompt/rights manifest, and review the actual export. Do not present the synthetic haircut as proof of a real customer result; label it as inspiration where appropriate.

HIGGSFIELD SHOT A — MOSS WALL REVEAL
DELIVERABLE: 3.2 seconds. Create one 16:9 desktop composition and one separately composed 9:16 mobile composition. Photoreal cinematic commercial, no text, no logo generated inside the footage, no dialogue.

GLOBAL STYLE: premium modern barbershop craftsmanship; tactile dark forest-green preserved moss, matte charcoal surroundings, warm amber backlight, brushed chrome scissors; restrained contrast, rich blacks with preserved detail, realistic texture, subtle fine film grain, no fantasy glow, no oversaturation, no generic luxury gold particles.

FIRST FRAME / BLOCKING: the moss wall fills the frame edge-to-edge. A narrow centre seam of slightly longer moss fibres runs vertically. One correctly formed pair of professional barber scissors enters from lower centre, held by one anatomically correct right hand partly visible at frame edge. The blades align around the fibre seam. Warm barbershop light is hidden behind the wall.

TIMELINE:
- 0.0–0.7 s: locked macro hold; tiny natural moss movement only; scissors settle into exact alignment.
- 0.7–2.4 s: camera makes a slow controlled push-in while the scissors travel upward and close exactly three times. Each closure cuts only the long moss fibres at the centre seam. Fibres separate cleanly and a thin warm amber line appears behind them. No duplicated scissors or fingers.
- 2.4–3.2 s: the left and right moss planes move apart by a small, believable amount like concealed sliding panels, revealing an authentic warm barbershop interior. The camera glides forward through the opening and ends aimed at a barber chair and mirror, ready for the match cut.

CAMERA / OPTICS: controlled macro-to-medium push, premium commercial lens character, shallow depth initially, focus transfers from scissor blades to the revealed chair, stable centre line, no whip pan, no handheld shake.

LIGHTING: soft charcoal frontal fill; narrow cool specular highlight on the scissors; motivated warm practical light from behind the wall; no changing sun direction or pulsing exposure.

PHYSICS: moss is fibrous, slightly springy, and attached to firm panels. Cut fibres fall a few centimetres under gravity. Panels remain solid and do not stretch, liquefy, tear like fabric, explode, or produce dust clouds.

AUDIO GUIDE FOR OPTIONAL USER-ACTIVATED MIX: quiet room tone, three dry close scissor snips, subtle fibre brushing, restrained low warm reveal swell. No voice, no loud impact, no stock cinematic boom. Website remains muted by default.

NEGATIVES: no text, watermark, extra hands, extra fingers, duplicated scissors, warped blades, tool-body merging, skin contact, floating fibres, organic gore, sparks, glitter, smoke, impossible wall movement, sudden interior redesign, exposure flicker, camera jump, black final frame.

HIGGSFIELD SHOT B — REAL HAIRCUT CRAFT
DELIVERABLE: 3.3 seconds. Match the destination frame, warm interior, screen direction, contrast, and camera velocity of Shot A. Create separate 16:9 and 9:16 compositions. Photoreal, no generated text/logo, no dialogue.

GLOBAL STYLE: intimate premium documentary-commercial realism, real skin pores and hair fibres, warm walnut and charcoal barbershop interior, clean but not sterile, restrained grade matching Shot A.

FIRST FRAME / BLOCKING: client seated in profile three-quarter view. The visible temple and upper side of the head are centred. The haircut is in progress with a clean low-to-mid fade and textured top, based on @HAIRCUT_REFERENCE. One barber hand holds a dark comb horizontally away from the ear; the other holds one professional scissor. Both hands and the contact area are fully readable. Keep the client's identity, hairline, ear, cape, chair, mirror, and background fixed.

TIMELINE:
- 0.0–0.5 s: camera completes the forward movement from Shot A and focus lands on hair projected beyond the comb.
- 0.5–2.5 s: the barber performs three precise scissors-over-comb closures while the comb advances gradually upward along the side blend. Each closure removes only the hair extending beyond the comb. Fine hair strands fall naturally. The client remains still and relaxed.
- 2.5–3.3 s: the barber lowers the scissors, brushes the blend once with the comb, and the camera settles to reveal the clean transition and textured top, leaving negative space for HTML hero copy.

CAMERA / OPTICS: 65–85 mm close-detail feel, slow stabilized slider motion, shallow but sufficient focus on comb, blades, and hairline; no orbit, whip, or rack focus away from the action.

LIGHTING: soft warm key from mirror/front, subtle cooler rim from behind, controlled blade reflections, stable exposure, natural skin tone, detail retained in dark hair.

PHYSICS / SAFETY: exactly two anatomically correct hands and one comb/scissor pair. Natural wrist angles. Scissor blades stay outside the comb and never touch the client's scalp, face, or ear. Hair decreases gradually and never regrows, changes colour, changes curl pattern, or jumps between lengths. No clipper appears.

NEGATIVES: no extra fingers, duplicated tools, comb through skin, blade through ear, deformed face, moving hairline, morphing haircut, plastic skin, floating hair, background people appearing, mirror mismatch, flicker, speed ramp, generated lettering, watermark, black final frame.

WEB ASSET DELIVERY
From the approved masters, create:
- desktop hero WebM plus MP4/H.264 fallback;
- mobile portrait WebM plus MP4/H.264 fallback;
- AVIF/WebP poster images sized for relevant breakpoints;
- optional user-activated audio track only if it materially improves the experience;
- a lightweight static reduced-motion composition.

Use fast-start metadata, correct dimensions/codecs, no unnecessary audio stream in the muted loop, and a sensible quality/size budget. Do not send a 4K master to every phone. Verify the derivatives with media probing and browser playback. The poster should carry LCP; video should enhance it after the page becomes interactive.

SITE ARCHITECTURE
1. Header: logo/wordmark, Strihy, Služby a ceny, Barberi, Galéria, Kontakt, Rezervovať. Sticky but compact; mobile booking CTA always reachable.
2. Cinematic hero: the moss/scissors experience, headline, short promise, Vybrať strih and Rezervovať termín.
3. “Nájdi svoj strih” selector: a visual, filterable haircut library.
4. Selected haircut configurator: cut details + optional reference upload + review summary.
5. Services and verified prices/durations.
6. Real before/after or portfolio gallery.
7. Barber profiles with actual specialties and availability only when supplied.
8. Process: Vyber strih → Doplň predstavu → Rezervuj termín → Barber dostane brief.
9. Real reviews/proof only.
10. Contact: verified location, hours, telephone, map/directions, parking/transit notes when real, Instagram.
11. Footer: business/legal/privacy/cookie information and booking link.

“NÁJDI SVOJ STRIH” SELECTOR
Make this the main conversion feature, not a decorative gallery.

- Use the exact services offered by Barbershop 30. If the real list is not supplied, configure illustrative options in data with an obvious REQUIRED_REAL_DATA flag rather than presenting them as real services.
- Potential categories, only if offered: Skin fade, Low fade, Mid fade, High fade, Taper fade, Textured crop, Classic scissor cut, Buzz cut, Pompadour/side part, Mullet, Beard trim and combined hair + beard.
- Filters: hair length, fade height, hair texture, maintenance level, style/finish, beard option.
- Each option opens a detail view with verified real photos/video where possible: front, side, back, technique, expected maintenance, and what to tell the barber.
- AI-generated examples must be visibly labelled “Inšpirácia / ilustračná ukážka”; never promise an identical biological result.
- Add a strong “Tento strih chcem” action and a persistent selected-state summary.
- Keyboard users must be able to browse, select, review, change, and continue without drag-only gestures.

HAIRCUT BRIEF
After selecting a style, collect only useful appointment details:
- selected service/style ID and title;
- fade height: low / mid / high / not sure;
- preferred top length or “poradí barber”;
- finish: natural / textured / slick / not sure;
- beard: none / trim / shape / complete service, only if offered;
- current hair notes and desired result;
- preferred barber, only if actual data exists;
- optional inspiration photo upload;
- consent/privacy acknowledgement for the photo;
- editable review summary.

Keep the form reassuring and fast. Use progressive disclosure and include “Nie som si istý — poradí mi barber.” Do not diagnose hair/scalp conditions. Validate upload type and size, show replace/delete, strip metadata where appropriate, and never put the photo or free-text note in analytics.

BOOKIO HANDOFF
Use the verified Barbershop 30 Bookio URL/integration. Inspect what Bookio actually supports before implementation.

- If Bookio supports service/barber/time prefill or custom fields, map the haircut brief only through documented fields and verify the received appointment data.
- If it does not support the full brief, implement a real approved pre-booking brief handoff and provide the user with a copyable summary, then open Bookio for the appointment. Do not claim the barber received the brief unless storage/transmission is confirmed.
- Preserve the selected style across navigation and back/forward actions.
- Never show a fake success screen. Booking completion analytics fire only when Bookio or the confirmed integration can truthfully report completion.

INTERACTION AND MOTION SYSTEM
Use no more than five signature moments:
1. Moss-wall scissor reveal.
2. Precise hairline mask/reveal for the selector heading.
3. Selected haircut card expands into a detail view with one controlled shared transition.
4. Haircut brief progress uses a restrained “cut line” indicator.
5. Booking CTA resolves with a subtle clean snip/line animation after the brief is valid.

All other motion is short functional feedback. Respect reduced motion. Avoid cursor hijacking, excessive parallax, long pinned scroll sections, hidden scrollbars, and effects that delay selection or booking.

ACCESSIBILITY
- Semantic landmarks, logical headings, skip link, keyboard-complete navigation and selector.
- Visible focus states, adequate contrast over every poster/video frame, 44 px minimum touch targets.
- Captions/transcript for any meaningful spoken content; audio never required.
- Descriptive alternative text for real hairstyle images; decorative generated texture has empty alt.
- Error messages linked to fields and announced; upload status accessible.
- `prefers-reduced-motion` equivalent; no flashing; pause control for moving content lasting more than five seconds.

PERFORMANCE
- Treat the optimized poster as LCP; never block first paint on Higgsfield video.
- Use responsive images, explicit dimensions, lazy loading below the fold, font subsetting/preload discipline, and route-level code splitting.
- Load only one motion library when needed. Avoid WebGL unless a measured, essential benefit justifies it.
- Pause offscreen videos and avoid simultaneous autoplay in haircut cards; play a preview only on user intent.
- Define and verify a media budget on realistic mobile network conditions.

SEO AND LOCAL DISCOVERY
Use verified business data for titles, descriptions, canonical URL, Open Graph, LocalBusiness/BarberShop structured data where valid, services, address, geo, hours, telephone, and sameAs links. Create useful Slovak copy around haircut intent without keyword stuffing. Never add fabricated aggregate ratings or reviews to schema.

ANALYTICS EVENTS
Implement only when an analytics/consent system is supplied and verified. Suggested non-sensitive events:
- intro_skipped / intro_completed;
- haircut_filter_used;
- haircut_viewed;
- haircut_selected;
- brief_started;
- brief_completed;
- booking_opened;
- booking_confirmed only from a trustworthy integration signal.
Never include photos, notes, names, telephone numbers, or other personal content in event payloads.

QUALITY GATES
Before saying the website is complete:
- run build, typecheck, lint, and relevant tests;
- test the main journey at 375, 390, 430 px, tablet, and desktop;
- verify keyboard, focus, reduced motion, autoplay rejection, slow network, video failure, cached repeat visit, and back navigation;
- confirm navigation and CTAs are usable before/during/after the intro;
- confirm the haircut selection and brief survive the real Bookio handoff or clearly documented alternative;
- inspect console/runtime errors, loading/error/empty states, forms, uploads, links, metadata, schema, and consent behavior;
- probe every video derivative and visually inspect hands, scissors, comb, hair continuity, mobile crop, first/final frame, and match cut;
- run one focused Creative Director pass and fix the five highest-impact issues only;
- list every REQUIRED_REAL_DATA item still needed before launch.

FINAL HANDOFF
Provide:
1. the completed website files;
2. a concise architecture and content map;
3. the Higgsfield asset manifest with prompt/reference versions and accepted output files;
4. the exact Bookio integration state and what was verified;
5. build/test/browser/media verification results;
6. unresolved real business content or permissions;
7. launch instructions without claiming deployment unless it actually succeeded.
```
