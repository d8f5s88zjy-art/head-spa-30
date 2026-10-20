# „ČO NEVIDÍŠ V ZÁBERE“ – priebeh výroby (19. 10. 2026)

Prompt: `prompty/co-nevidis-v-zabere.md` (vetva claude/subor-idk-fotografie-fitka-5lqm3q, commit 9772c6a).
Rozhodnutia majiteľa sú v časti 12 promptu: bez hlasu; **žiadna AI** (rozhodnutie popoludní) – obraz tvoria len
ukážky z oficiálnych trailerov filmu Athena a skutočné zábery/fotky z Francúzska s licenciou + karty
„VO FILME“ / „V SKUTOČNOSTI“.

| # | Krok | Stav | Výsledok |
| --- | --- | --- | --- |
| 1 | Prvý beh (fakty, práva, scenár) `wf_078ac092-f26` | prerušený reštartom kontajnera | prežili: `prava/zdroje/` (Commons imageinfo, kategórie, podmienky info.gouv.fr/interieur/paris.fr), `prava/kandidati/` (len 04 Limoges je obrázok, ostatné sú chybové HTML – Commons vracia 429/400 na sťahovanie) |
| 2 | AI skúšky (portrét A, klipy K3, K4) | hotové, **nepoužijú sa** (rozhodnutie majiteľa) | `ai/` |
| 3 | Nový beh bez AI: fakty (2 zdroje) ‖ skutočné zábery s licenciou ‖ ukážky z filmu (oficiálne trailery, citácia) → scenár/karty/EDL → skeptik → strih short.py → kontrola | pripravuje sa | `fakty/`, `prava/`, `film/`, `scenar/`, `strih/` |
| 4 | Odovzdanie (MP4 1080×1920, popis, zdroje, riziká práv), oznámenie majiteľovi | čaká | |

## Zistenia k zdrojom (19. 10. 15:30 UTC)

- Wikimedia Commons má fotky z udalostí: „Paris riots, 17 October 2026“ (Jorge Jaramillo, CC BY-SA 4.0: dav vniká
  do butiku Chanel; hasiči hasia horiace auto), manifestácia 17. 10. Paríž (CC BY-SA 4.0) a Aix-en-Provence (CC0),
  lýceisti 2. 10. Perpignan (CC BY 4.0), 5. 10. Rennes (CC BY 4.0), 6. 10. Paríž/Nancy (CC BY-SA 4.0),
  radnica Limoges 18. 10. (CC BY 4.0). Sťahovanie originálov blokuje 429 – treba prestávky a správny User-Agent.
- YouTube: oficiálne trailery Athena – Netflix `vRunUkdkK8s` (154 s), Netflix France VF `I4Fr6xokozw` (160 s),
  teaser `ahBOK08eosA`/`qvZfgErsiJU` (63 s). yt-dlp web klient hlási „Sign in to confirm you're not a bot“ –
  skúšajú sa iné klienty.

## 19. 10. 18:40 UTC – TikTok ako zdroj (pokyn majiteľa)

- Spustený tím `co-nevidis-tiktok`: scout cez médiá a fact-checky, tvorca „V2“ a vznik výzvy, overovateľ
  pravosti, právnik (citácia/§ 39, žiadosť o súhlas). Výstupy `tiktok/TIKTOK.md`, `VYZVA.md`, `PRAVOST.md`,
  `PRAVNE-TIKTOK.md`, `ZIADOST-O-SUHLAS.md`, stiahnuté na rozbor v `tiktok/stiahnute/` (mimo gitu).
- Kontext (fr.wikipedia „Manifestations du 17 octobre 2026“, 19. 10.): mobilizácia proti drahote, 550–800 tis.
  ľudí, 1 200 zadržaných, 1 500–3 000 poškodených obchodov, radnica Limoges vyhorela, 1 mŕtvy; Le Figaro údajne
  o zákaze vychádzania 23–6 h (Paríž, Lyon, Lille, Nice) – overuje editor faktov.

## 20. 10. 07:20 UTC – stav (video pozastavené, majiteľ: „Pokračuj v barbershope“)

- Hotové: fakty (editor faktov, `fakty/tabulka-faktov.md` – potvrdené: drahota + školy, 550–800 tis.,
  ≥ 3 000 obchodov podľa ministra Papina, zákazy vychádzania PLATIA od noci 19./20. 10. v Paríži (République,
  Les Halles 23–6 h), Lille/Nord, Lyon, Nice; Abdel vo filme je vojak, nie policajt), výzva z TikToku
  (`tiktok/VYZVA.md` – @v2.95, video 8. 9. 2026, 5,8 mil. zobrazení), ukážky z filmu (`film/UKAZKY.md`, 16 klipov),
  hudba (`hudba.py`, `HUDBA.md`).
- Prerušené limitom relácie (treba spustiť znova): zábery z Commons (videá, fotky), skeptici faktov a práv,
  TikTok scout, overenie pravosti, právnik. Potom scenár → porota → karty a kompozity → strih (short.py) → kontrola.
  Skript ďalšieho kroku: `scratchpad/video/co-nevidis/workflowy/2-scenar-a-strih.js` (kópia nižšie v repozitári nie je).
