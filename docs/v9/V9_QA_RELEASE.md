# V9 QA / Release Gate

## Must pass before merge

### Business truth
- [ ] 17 services remain the existing verified set.
- [ ] Prices and durations are unchanged unless explicitly approved from source data.
- [ ] Booking stays on `https://booqme.app/sk/rezervacia/barbershop-30`.
- [ ] Voucher shop stays on `https://booqme.app/sk/eshop/barbershop-30`.
- [ ] Phone, email, address, hours and schema.org remain aligned with current production.
- [ ] No fake reviews, staff profiles, awards, claims or availability.

### Primary journey
- [ ] Hero CTA opens real Booqme.
- [ ] Ritual-card booking CTA works.
- [ ] Voucher CTA opens real Booqme e-shop.
- [ ] Mobile sticky bar works.
- [ ] Phone and map links work.
- [ ] External click is never described as a confirmed booking.

### Responsive
- [ ] 320
- [ ] 375
- [ ] 390
- [ ] 430
- [ ] 768
- [ ] 1024
- [ ] 1280
- [ ] 1440
- [ ] 1920
- [ ] no horizontal overflow
- [ ] no text clipping
- [ ] no CTA hidden behind fixed UI

### Accessibility
- [ ] keyboard path through nav, ritual filters, cards, FAQ, forms, footer
- [ ] visible focus states
- [ ] reduced-motion equivalent
- [ ] 200% zoom still usable
- [ ] no essential information only on hover
- [ ] contrast checked

### Performance
- [ ] no new render-blocking remote dependency
- [ ] Save-Data skips optional pointer effects
- [ ] low-memory/low-core devices skip optional pointer effects
- [ ] no scroll listener doing layout-heavy work every frame
- [ ] existing hero canvas still pauses per original logic
- [ ] Lighthouse mobile target remains 95+ where environment allows

### SEO / technical
- [ ] canonical intact
- [ ] hreflang intact
- [ ] schema.org intact
- [ ] robots.txt and sitemap unchanged unless intentionally updated
- [ ] console clean
- [ ] 404 still works

## Creative Director final pass

Fix only the five highest-impact weaknesses. Do not add effects because the site "needs more". The strongest version should feel calmer, more expensive and more deliberate, not busier.
