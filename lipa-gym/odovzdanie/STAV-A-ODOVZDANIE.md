# GYM KLUB (Lipa gym): stav práce a odovzdanie webu

Stav k 15. 10. 2026. Tento súbor je „pamäť“ projektu. Ak pri odovzdaní webu niečo nevieš, odpoveď
by mala byť tu alebo v súboroch, na ktoré odkazuje.

## 1. Kde čo je

| Čo | Kde | Stav |
| --- | --- | --- |
| Živý web dnes | repozitár `d8f5s88zjy-art/Lupa-gym`, vetva `main` = commit `4fb1416` (tvoja verzia), web <https://d8f5s88zjy-art.github.io/Lupa-gym/> | beží, bez mojich zmien |
| Moje hotové zmeny (logo, Marko Rigo, Bar, editor pre Ondreja) | záloha `lupa-gym-zaloha.bundle` v tomto priečinku, vetva `main` (commity `69d7665` až `396f446`) | hotové, skontrolované, **nenahraté** do Lupa-gym |
| Nový vzhľad (redizajn) | tá istá záloha, vetva `redizajn-2026-10` (od `534f588`) | **rozpracované**, nenasadzovať |
| Náhľad redizajnu | <https://claude.ai/artifact/2a5djhGB6rjJKtWyUBsffC> (súkromný, zdieľa sa cez Share) | stav pred pohybovým systémom |
| Špecifikácia redizajnu | `SPEC.md` v tomto priečinku | záväzná pre dokončenie |
| Denník implementácie | `IMPLEMENTACIA-POZNAMKY.md` v tomto priečinku | všetky rozhodnutia, merania a odchýlky |
| Návod pre Ondreja | `NAVOD-PRE-ONDREJA.md` (kópia z repozitára) | aktuálny pre vetvu `main` |
| Návod pre vlastníka GitHub účtu | `NASTAVENIE-CMS.md` (kópia z repozitára) | aktuálny pre vetvu `main` |

Nahratie do `Lupa-gym` som nespravil, lebo systém mi bez tvojho výslovného súhlasu nepovolil zápis do toho
repozitára. Stačí napísať „nahraj do Lupa-gym“, alebo to nahrať sám (časť 3).

## 2. Čo je hotové

**Vetva `main` (pripravená na nahratie):**

- Logo z klubovej kartičky namiesto činky: hlavička (na bielej kartičke), pätička, ikona v prehliadači.
- Nová fotka Mgr. Marka Riga (od majiteľa fitka cez WhatsApp).
- Časť „Po tréningu na kávu“ (Bar) s piatimi fotkami a položka „Bar“ v menu.
- Editor obsahu pre Ondreja (Pages CMS, zadarmo): hodiny, tréneri, rozvrh, cenník, recenzie, otázky, fotky,
  oznam navrchu webu. Prihlásenie e-mailom a kódom, bez hesla. Po uložení sa web sám zverejní asi za 1–2 minúty.
- Pri chybe v obsahu sa web nezverejní (ostane posledná funkčná verzia) a stránka
  <https://d8f5s88zjy-art.github.io/Lupa-gym/stav.html> po slovensky povie, čo a kde opraviť.
- 70 automatických testov, vzhľad zhodný s dnešným webom (okrem zámerných zmien: telefóny trénerov v tvare +421).

**Vetva `redizajn-2026-10` (rozpracované, smer „pokojný prémiový magazín“, vybrala ho porota troch sudcov):**

- B0–B1: nové orezy a jednotná farebná úprava skutočných fotiek (len Pillow, nič generované).
- B2: nová štruktúra stránky, kratšia asi o tretinu; CMS polia upravené, návody aktualizované.
- B3: vizuálny systém: farby z loga (čierna, kostená biela, červená #e2412f), písma Oswald a Manrope.
- Opravy: svetlejší úvod na telefóne (fitko je vidno), nová fotka v medzihre „Funkčná zóna“ (`u-38047dcd`),
  cenník na telefóne, lightbox, tlačidlo hore, záložné formáty fotiek.
- B4: pohybový systém: jemné odhalenia, otvorenie úvodu, skok z menu cez View Transition, lightbox s letom fotky.
  Commit `d450017`. Nezávislá kontrola B4 bola v čase zápisu rozbehnutá (výsledok nie je v tejto zálohe).

## 3. Postup pri odovzdaní (v tomto poradí)

1. **Nahrať vetvu `main` do Lupa-gym** (zo zálohy, časť 6) a hneď potom v Lupa-gym otvoriť
   **Settings → Pages**: Source = „Deploy from a branch“, vetva **gh-pages**, priečinok **/ (root)**.
   Bez toho sa web po nahratí nezobrazí (v `main` už nie je hotový `index.html`, generuje sa).
2. **Settings → Actions → General**: Actions povolené; ak by nasadenie padalo na `git push`, prepnúť
   „Workflow permissions“ na „Read and write permissions“.
3. **Vetva `main` nesmie vyžadovať pull request ani podpis commitov** (CMS zapisuje priamo do `main`).
4. **Pages CMS**: <https://app.pagescms.org> → „Sign in with GitHub“ (účet d8f5s88zjy-art) → inštalácia
   aplikácie → „Only select repositories“ → **len Lupa-gym** (nie všetky, aplikácia má široké oprávnenia).
5. **Pozvať Ondreja**: v Pages CMS v projekte Lupa-gym → Collaborators → Invite → jeho e-mail.
   Príde mu e-mail „… invited you to "d8f5s88zjy-art/Lupa-gym"“ s tlačidlom „Join …“. **Pozvánka platí 24 hodín.**
6. Poslať Ondrejovi `NAVOD-PRE-ONDREJA.md` (napr. ako PDF).
7. Redizajn nasadiť až po dokončení (časť 4) a v čase, keď Ondrej v CMS needituje (mení sa štruktúra polí;
   postup je v `NASTAVENIE-CMS.md`, časť 3a vo vetve `redizajn-2026-10`).

## 4. Čo zostáva na redizajne

| Krok | Čo | Stav |
| --- | --- | --- |
| Kontrola B4 | nezávislá kontrola pohybového systému a prípadné opravy | rozbehnutá, výsledok neuložený |
| B5 | výkon a prístupnosť (SPEC kap. 9 a 10), Lighthouse, klávesnica | nezačaté |
| Filmová vrstva | **nová požiadavka majiteľa**: „viac profesionálne, filmové animácie, filmové prechody, ukáž fitko čo najlepšie“ | koncept nezačatý (prvý pokus zastavil limit relácie) |
| B6 | záverečná kontrola, snímky 390–1920 px, návody, zoznam pre majiteľa | nezačaté |

**Filmová vrstva, materiál a pravidlá:** 12 skutočných videoklipov z prevádzky z 26. 9. 2026 (`IMG_8981` až
`IMG_8998`, na výšku 1080 × 1920), príchodový film `prichod-900.mp4`, skutočné panorámy, fotky. Pravidlá: len
skutočné zábery (žiadne AI), žiadne video riadené skrolovaním (klient ho v minulosti odmietol ako zasekané),
žiadne pripínanie obsahu, plynulosť na bežnom telefóne, pri „obmedziť pohyb“ všetko statické. Pôvodné klipy
boli len v dočasnom priestore a v tejto zálohe nie sú; zdroj sú videá od majiteľa z 26. 9.

**Známe otvorené body z kontrol:** plynulosť na počítači pri 4× spomalenom CPU je pod cieľom 55 fps (asi 40–50);
úvod na telefóne pri výške okna 781–880 px ukazuje málo fitka; fotka `volne-vahy-2` je na webe dvakrát;
treba ručne overiť na skutočnom iPhone a Androide.

## 5. Rozhodnutia pre majiteľa fitka

1. **Logo v hlavičke**: ponechané plnofarebné logo z kartičky na bielej kartičke (tak si to chcel).
   Biela verzia loga je pripravená, ale nepoužitá.
2. **Nadpis úvodu**: ostáva „Stačí prísť. Vstup 6 €.“ Dá sa zmeniť v CMS.
3. **Fotky Panda Fight Club** (z gymklub.sk): platí ešte súhlas klubu? Na jednej je čitateľný banner ProFighters.eu.
4. **Text medzihry „Funkčná zóna“** spomína vzduchový bicykel, ktorý na fotke nie je: skrátiť text v CMS, alebo dofotiť.
5. **Fotky funkčnej zóny s nápismi susedných firiem v oknách** (SATELITNÁ TECHNIKA, ANTIK, namiSAT) sa nepoužívajú;
   kým sa nedofotí, medzihra používa fotku rigu pri oknách.
6. **Dofotiť** (bez toho nebude dojem naplno prémiový): recepcia a pult; šatne a sprchy; ľudia pri tréningu
   so súhlasom (hlavná sála, funkčná zóna pod LED, lekcia na tatami); vlastné zábery sály Panda; široké zábery
   na šírku zo statívu vo výške asi 1,3 m; originály fotiek baru s vypnutým televízorom. Pred fotením upratať
   popolníky, bundy na rigoch a ľudí v zrkadlách.

## 6. Obnova zo zálohy

Záloha obsahuje celú históriu práce nad commitom `4fb1416` (dnešný `main` v Lupa-gym), obe vetvy.

```bash
git clone https://github.com/d8f5s88zjy-art/Lupa-gym.git && cd Lupa-gym
git bundle verify ../lupa-gym-zaloha.bundle
git fetch ../lupa-gym-zaloha.bundle main:zaloha-main redizajn-2026-10:redizajn-2026-10
git log --oneline zaloha-main -3          # posledný má byť 396f446
git push origin zaloha-main:main          # NAHRATIE hotových zmien (len keď si pripravený, časť 3)
```

Zostavenie a testy (Python 3 + `pip install -r nastroje/requirements.txt`):

```bash
python3 nastroje/zostav.py                                    # web do _site/
python3 -m unittest discover -s nastroje -p 'test_*.py'       # testy
```

## 7. Časté otázky pri odovzdaní

- **Koľko to stojí?** Pages CMS aj GitHub Pages sú zadarmo.
- **Čo Ondrej zmení sám?** Hodiny, trénerov, rozvrh, ceny, recenzie, otázky, fotky a oznam. Videá a logo nie
  (to cez vývojára). Fotky do asi 3 MB; pred fotením vypnúť polohu v mobile (repozitár je verejný).
- **Čo nevie web zobraziť?** Celý deň zatvorené a otvorenie cez polnoc; na výnimky slúži oznam.
- **Web sa po uložení nezmenil?** Pozrieť `stav.html` (obnoviť stránku, môže byť až 10 minút v cache).
- **Kto uvidí, kto čo zmenil?** E-mail toho, kto ukladá v CMS, je v histórii verejného repozitára.
- **Ako zrušiť Ondrejovi prístup?** Pages CMS → Collaborators → odobrať (`NASTAVENIE-CMS.md`, časť 4).

## 8. Bezpečnosť

- Heslá, prihlasovacie údaje k FTP, Booqme ani iné tajné údaje nikdy nepísať do chatu ani do repozitára.
- Pages CMS inštalovať len na repozitár Lupa-gym.
- Repozitár Lupa-gym je verejný: žiadne osobné údaje klientov.

## 9. Ostatné projekty (zastavené na žiadosť majiteľa, 15. 10. 2026)

- **Vernostná kartička 30** (Barbershop 30 a HEAD SPA 30): kód je v `main` repozitára head-spa-30; na zapnutie
  chýbajú GitHub secrets `FTP_SERVER`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR`, `VERNOST_HESLO_BARBERSHOP`,
  `VERNOST_HESLO_HEADSPA`, `VERNOST_EMAIL_OD` a obchodné meno a IČO HEAD SPA 30.
- **Visionary Living**: čaká na pokyn „pokračuj“.
- **gstack** (TikTok od martin.gocik, sada rolí pre Claude Code od Garryho Tana, licencia MIT): rozbor zastavený,
  do toolboxu sa nič nezapísalo.
- **Reel GYM KLUB**: verzia v1 vznikla, nezverejnená.
