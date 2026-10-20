# Skills pre senior grafika a filmový web

## `build-premium-websites` – Premium & Cinematic Web Studio

Skill a katalóg 100 zadaní pre senior grafika a vizuálne efekty (verzia 2.0, 20. 10. 2026), ktorý dodal
majiteľ 20. 10. 2026 ako jeden dokument „Kompletný skill Premium & Cinematic Web Studio + 100 zadaní s VFX“.
Súbory sú obnovené z jeho časti II podľa presných relatívnych ciest; všetkých 273 súborov sedí na SHA-256
uvedený v dokumente a `scripts/validate_bundle.py` prešiel (100 kapitol, 24 promptov D001–D024, 56 techník,
59 zdrojov, 1 000 promptov).

- `SKILL.md` – hlavné pravidlá a register 100 kapitol C001–C100 v 10 oblastiach.
- `references/` – kapitoly (prechody C032, kontinuita scén C033, VFX C042, sekvencie C048, náhradné zobrazenie
  C050, mobil C057, Core Web Vitals C072, obmedzený pohyb C076, vizuálna kontrola C084, záverečná kontrola C100…).
- `assets/catalogs/designer-briefs.json` – zadania Z001–Z100 (projekt, podklady, art direction, efekt
  s časovaním a náhradnou verziou, výstupy, kontrola prijatia); `assets/designer-prompts/` – prompty D001–D024.
- `assets/recipes/` – vzory pohybu a vlastníctva zdrojov (`motion-core.mjs`, `scene-timeline.mjs`,
  `latest-resource.mjs`, `owned-selection.mjs` …); `assets/templates/` – šablóny zadania, pohybu a akceptácie.
- `scripts/` – vyhľadávanie a výpis (bez siete, bez zápisu mimo zadaného výstupu):

```bash
cd toolbox/skills-senior/build-premium-websites
python3 scripts/validate_bundle.py                      # kontrola celistvosti
python3 -I scripts/catalog.py route service-site        # trasa kapitol pre web so službami a rezerváciou
python3 -I scripts/catalog.py search --kind chapters --query prechod --limit 3
python3 -I scripts/catalog.py show FX029                # technika (napr. rack focus)
python3 -I scripts/briefs.py search kaviaren --limit 3
python3 -I scripts/briefs.py show Z046                  # celé zadanie so spoločným seniorským štandardom
```

Hľadanie funguje lepšie po jednom slove (`prechod`, `kontinuita`, `nacitanie`, `film`).

Pôvod a hranice: `references/provenance.md` (C015). Prevzaté verejné prompty sú pod MIT, plné znenia licencií
sú v `assets/catalogs/licenses.json` a pri každom zázname. Referencie sú inšpirácia, nie dôkaz živej animácie;
čísla a ceny v katalógu nie sú overené hodnoty projektov.

Použitie u nás: BARBERSHOP 30, plynulosť a vzhľad na telefóne (október 2026) – každá dávka opráv dostala trasu
kapitol (C031, C032, C033, C042, C043, C048, C050, C057, C072, C076, C084, C100 a ďalšie), potom nasleduje
seniorský art direction a VFX prechod podľa C016/C017. Pravidlá webu (`CLAUDE.md`, len skutočné fotky, obsah sa
nemení) majú prednosť pred skillom.
