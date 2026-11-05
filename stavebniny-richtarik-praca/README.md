# Stavebniny Richtárik – podklady k prerábke (rozpracované, 5. 11. 2026)

Priebežná záloha práce na želania majiteľa zo 4. a 5. 11. 2026: auto preč, filmový úvod so silným hookom zo skutočných
fotiek plných zásob, profesionálne texty, seniorské SEO, asistent na otázky, filmové prechody s inšpiráciou z internetu
a uvítanie pred tovarom. Nič nie je nasadené.

- Web (stav vetvy `richtarik-profi`, commit `1bd764bd`): priečinok `stavebniny-richtarik/` v tomto repozitári.
  Rozpracované: texty a SEO podstránok, zlúčenie asistenta, uvítanie, filmové doladenie, záverečné kontroly.
- Asistent (vetva `richtarik-asistent`, commit `2eda9c90`, od `4b2646bf`): `asistent-vetva/*.patch`
  (`git am` na `4b2646bf`, alebo zlúčenie s webom). Kľúč API v repozitári nie je, v súboroch sú len zástupné hodnoty.
- `diagnoza/` – úvod a fotky, texty (`FAKTY.md` = povolené fakty so zdrojom, `STYL.md` = štýlová príručka), SEO
  (`KLUCOVE-SLOVA.md`), asistent.
- `inspiracia/` – rešerše z internetu (galérie ocenených webov, odvetvie, technika); zdroje sú v ZAPIS.md, nič nie je
  skopírované. Snímky cudzích webov sa sem neukladajú, hárky technika sú z vlastných testovacích stránok.
- `koncept-*` – štyri návrhy úvodu (A Inventúra, B Kamera, C Odhalenie, D Film), `porota/VYBER.md` – výber (D Film)
  a plán.
- `z1/`, `zf/` (`POHYB.md` = pohybový systém), `z3/` – zápisy zapisovateľov; `uvitanie/` – tri návrhy uvítania.
