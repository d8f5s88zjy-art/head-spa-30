# ZENTURY – návrh nového webu

Jednostránkový web pre Zentury (ZENTURY s.r.o. a ZENTURY TAX k.s., Piaristická 1, Nitra) v štýle
„tmavá kancelária pod lampou“: modročierne pozadie, teplé svetlo, ktoré ide za kurzorom, mosadz z loga.
Predloha štýlu bolo video webu advokátskej kancelárie (tmavý web, kladivko sudcu v kuželi svetla,
oblasti práva ako knihy v poličke, záver „Let's Talk“ s fotkou knižnice).

Texty sú len z pôvodného webu zentury.sk (titulka a podstránky služieb), nič nie je vymyslené.

## Čo je na stránke
1. **Úvod:** 3D kladivko (WebGL) s mosadznými pásmi, teplé svetlo ide za kurzorom, klik do úvodu = úder.
   Nadpis sa pri načítaní preklopí do svetla (jediná orchestrálna animácia).
2. **O nás:** fotka stĺpov a váh, ktorú odhalí svetlo pod kurzorom (na telefóne pri posúvaní), majiteľ,
   poistenie, etický kódex, ocenenie GOLD Dôveryhodná firma 2023.
3. **Služby:** 8 kníh v drevených priehradkách, polica sa posúva do strán (myšou ťahom, šípky, klávesnica).
   Knihy sa natáčajú k stredu a pri rýchlom posune sa nakláňajú. Klik otvorí knihu: obal sa preklopí
   a na strane je obsah služby a tlačidlo „Opýtať sa na túto službu“ (vyplní formulár).
4. **Prečo účtovníctvo od nás:** šesť zásad ako paragrafy § 1 až § 6.
5. **Elektronický archív:** pečať eIDAS, odkaz na podstránku zentury.sk.
6. **Kontakt:** fotka knižnice, „Poďme sa porozprávať“, forma poradenstva (4 možnosti), formulár.
   Web nemá server, preto formulár pripraví e-mail na info@zentury.sk v e-mailovom programe návštevníka.
   Na hostingu s PHP sa dá napojiť na pôvodný kontaktný formulár.

## Súbory
- `index.html`, `assets/style.css`, `assets/site.js` – stránka (bez knižníc).
- `assets/kladivko.min.js` – zostavené 3D kladivko, načíta sa až po zobrazení stránky. Zdroj je
  `source/kladivko.js`; po zmene spusti `source/zostav-3d.sh` (esbuild pribalí z three.js len potrebné časti).
- `assets/img/kladivko-*.webp` – statický obrázok kladivka (pred načítaním 3D, pri obmedzenom pohybe,
  bez grafickej karty). Po zmene tvaru kladivka: statický server nad koreňom repozitára na porte 8761
  a `PORT=8761 node source/plagat.mjs`.
- `assets/fonts/` – Gilda Display (nadpisy) a Jost (text), latinka a stredoeurópska latinka.

## Výkon a prístupnosť (Lighthouse 12.8, lokálne)
- Mobil: výkon 98, prístupnosť 100, osvedčené postupy 100. Počítač: 100 / 100 / 100.
- SEO 66 je len kvôli `noindex`: návrh nemá súperiť vo vyhľadávaní s pôvodným webom.
  **Pred spustením na zentury.sk riadok `<meta name="robots" content="noindex">` odstrániť.**
- 3D sa nespustí bez grafickej karty (SwiftShader, llvmpipe), pri obmedzenom pohybe a pri šetrení dát.
  Na test v takom prostredí pridaj do adresy `?3d`.

## Pasce, na ktoré sme narazili
- Cormorant Garamond z Google Fonts má v stredoeurópskej sade mäkčene nad š, č, ň posadené príliš
  vysoko, pôsobia ako samostatné znaky. Gilda Display ich má správne.
- Rotujúci kruh textu v kontakte zväčšoval šírku stránky na telefóne (otočený štvorec presahuje),
  preto má sekcia `overflow-x: clip`.
- Čas z requestAnimationFrame môže byť menší ako `performance.now()` z predošlého volania.
  Záporný krok rozkmital tlmenie a kladivko odletelo; krok je preto orezaný na 0 až 50 ms.

## Treba overiť s klientom
- Skúsenosti: na pôvodnom webe je „15 rokov skúseností v praxi“ (majiteľ) aj „16-ročné skúsenosti“
  (tím ZENTURY TAX). Na webe sú obe tak, ako ich uvádza pôvodný web.
- Cenník (daňové poradenstvo 250 €/hod., daňové priznania od 80 €) z podstránok sme nedali, lebo
  nevieme, či platí.
- Fotka majiteľa a tímu: pôvodný web má len ilustračné fotky, preto tu nie sú.
- Česká verzia (pôvodný web má SK a CZ) zatiaľ chýba.

## Zdroje a licencie
- Logo, fotka stĺpov a váh, ocenenie a logo partnera: z webu zentury.sk (materiály klienta).
- Fotka knižnice: Unsplash, `photo-1505664194779-8beaceb93744`, licencia Unsplash.
- Písma Gilda Display a Jost: SIL Open Font License 1.1 (Google Fonts).
- three.js 0.169.0: licencia MIT (hlavička je na konci `assets/kladivko.min.js`).
