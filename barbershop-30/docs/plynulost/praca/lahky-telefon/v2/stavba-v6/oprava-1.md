# Oprava po kole 1 – dávka V6 (vernostná kartička na webe BARBERSHOP 30)

Senior opravár, 22. 10. 2026, 05:40–05:45 UTC. Strom `$SP/hs-vernost` (vetva `barbershop-vernost`), pridelené porty 8735–8739,
`$SP` = `/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad`.
Vstup: `kontrola-kod-1.md` (N1 vážna) a `kontrola-bezp-1.md` (bez vážneho nálezu). Zadanie: opraviť len vážne nálezy; nič mimo nich.

**Výsledok: N1 opravená jedným commitom `52ce64f`; celý `sh vernost/testy/spusti.sh` prešiel (111 v poriadku, 0 zlyhalo).**
Stredné a drobné nálezy (N2–N8, S1–S3, T1–T3) som nemenil – nie sú vážne a zadanie ich do tejto opravy nedáva.

## 1. N1 (vážna) – `spusti.sh` padal: dva prvky `[data-vernost-karta]`, `e2e.mjs:204` v strict mode

Potvrdenie nálezu bez prehliadača: `grep -c "data-vernost-karta" barbershop-30/index.html index.html` → `2` / `1`
(Barbershop: sekcia `barbershop-30/index.html:841` a pätička `:888`; HEAD SPA: len `index.html:718`). Pôvodný riadok
`p.locator('[data-vernost-karta]').click()` (`vernost/testy/e2e.mjs:204` pred opravou) pri dvoch prvkoch v Playwright strict mode hádže.

Oprava (`vernost/testy/e2e.mjs:204–212` po oprave, commit `52ce64f`, 1 súbor, +9/−2): namiesto zúženia na pätičku test overí
**všetky** odkazy na kartičku, aby pokryl aj novú sekciu (návrh kontrolóra, druhá možnosť):

1. `odkazy = p.locator('[data-vernost-karta]')`, `pocet = await odkazy.count()`;
2. `evaluateAll` pre každý prvok: `href === uložená adresa`, nie je v skrytom predkovi (`closest('[hidden]')` – teda sekcia aj pätička
   sú odkryté), popis `[data-vernost-nova]` skrytý a `[data-vernost-ma]` odkrytý (na HEAD SPA bez týchto popisov platí triviálne);
   kontrola `pocet >= 1 && every(...)` s výpisom stavu pri zlyhaní;
3. slučka: každý odkaz postupne `click()` → `popup.url() === uložená adresa` (označenie „sekcia“/„pätička“), popup zavrieť.

Na Barbershope tak pribudli 2 kontroly na beh (2 behy: sk, en), na HEAD SPA 1 kontrola; pätička sa overuje tak ako doteraz.
Zdroj prihlášky ani kópia sa nemenili (`cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` → bez výstupu; kontrola `e2e.mjs:25`
v behu prešla). `index.html` bez zmeny – `data-skuska` v strome stále nie je (`grep -c data-skuska` nemenené, 0/0 z kola 1 platí).

## 2. Testy s výstupom

Prehliadač bol voľný: `pgrep -f "http.server 86[01]"` → nič (rc=1); `pgrep -c -f "headless_shel[l]|chrome-linux/chrom[e]"` → `0`
(pozor: vzor bez zátvoriek `"headless_shell|chrome-linux/chrome"` nájde vlastný shell `bash -c …`, ktorý ten vzor nesie – kontrolór kola 1
to mal rovnako; preto hranaté zátvorky). Jeden prehliadač, beh 27 s (05:40:46–05:41:13 UTC), po ňom `pgrep` → `0`.

| Príkaz | Výsledok |
|---|---|
| `node --check vernost/testy/e2e.mjs` | `syntax OK` |
| `SNIMKY=$SP/oprava-v6 VERNOST_PORT=8735 VERNOST_PUSH_PORT=8736 sh vernost/testy/spusti.sh` | `API`, `admin`, `karta a push`, `súbežnosť`, `oddelenie prevádzok`, `prehliadač` → **`VÝSLEDOK: 111 v poriadku, 0 zlyhalo`**, rc=0 |
| `cmp vernost/web/prihlaska.js barbershop-30/assets/vernost.js` | bez výstupu (`cmp OK`) |
| upratanie po teste | `vernost/config.php` a `vernost/data/meno.php` neexistujú; `pgrep -c -f "php -S 127.0.0.1:87[3][5-9]\|push-moc[k]"` → `0`; `git status --short` → len zmenený `e2e.mjs` pred commitom, po commite prázdny |

Snímky a `php.log` z behu: `$SP/oprava-v6/` (4,6 MB, 17 súborov: `prihlaska-barbershop*.png`, `prihlaska-headspa*.png`, `karta-*.png`,
`qr-*.png`, `admin-*.png`).

## 3. Commit

| Hash | Správa | Súbor |
|---|---|---|
| `52ce64f` | Vernosť: test prihlášky overí sekciu aj pätičku, nie jeden odkaz na kartičku | `vernost/testy/e2e.mjs` (+9/−2) |

`git log --oneline f624ee8..HEAD`: 5 commitov (`cbd97c2`, `f1a47bb`, `72d9537`, `1f45265`, `52ce64f`), rovnaký autor ako predošlé
(commit som raz amendoval len kvôli zjednoteniu autora s vetvou; nepushnuté, lokálne). Žiadny push, merge ani reset; iné stromy nedotknuté.

## 4. Pre odovzdávku

Odovzdávka časť 4 bod 1 („`spusti.sh` ODLOŽENÝ, očakávanie: prihláška na oboch weboch prejde“) sa dá nahradiť výsledkom vyššie:
celý `spusti.sh` prešiel po oprave testu (111/0). Nič ďalšie v dávke sa nemenilo.
