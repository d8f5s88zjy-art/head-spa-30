# /brag (brag-slim) – GYM KLUB Nitra

Spustené cez /brag z `latent-spaces/brag` (commit c893c5e). Na Opus 5.5 /brag podľa svojho pravidla odovzdáva prácu brag-slim. Tón **cinematic**, formát **vertical 1080 × 1920, 30 fps, 20 s**.

## 1. Preskúmanie projektu (odpovede pred plánom)

- **Čo to je:** web fitka GYM KLUB na Výstavnej 6 v Nitre (Lipa Centrum) s prehliadkou skutočných priestorov.
- **Pre koho a čo im dá:** pre ľudí z Nitry, ktorí hľadajú fitko. Uvidia skutočné priestory skôr, než prídu, a hneď zistia cenu, hodiny a cestu.
- **Čím sa líši:** prehliadka zo skutočných panorám zložených z videa (terasa 238°, vchod 149°, funkčná zóna 158° a 173°) a fotiek, nie generický 3D interiér.
- **Najsilnejšie pravdivé tvrdenie:** „Pozrite sa dnu skôr, než prídete.“ Plus ceny priamo z webu: jeden vstup 6 €, mesiac 50 €.
- **Vizuálny háčik:** úvod webu. Skutočná fotka funkčnej zóny sa ponorí do tmy a LED šesťuholníky na strope sa po jednom s blikaním rozsvietia.
- **Skutočné UI a tok:** vstup → „Vstúpiť“ → rozhliadnutie ťahom prstom → skok na funkčnú zónu cez trasu zón → ťuknutie na bod „Šprintérska dráha“ → karta s informáciou.
- **Tón:** cinematic, sebavedomý a vážny. Bez vtipu, pretože projekt nie je paródia.
- **Identita:** čierna #060707, kostená biela #f1efe9, signálna červená #ff3a24 zo značenia dráhy. Písmo Archivo (kondenzované 900) a IBM Plex Mono.
- **Popis k príspevku:** „Pozrite sa do GYM KLUB skôr, než prídete.“

## 2. Uhol

Video je jedna súvislá cesta: svetlá sa rozsvietia → kamera vojde dnu → vstúpime do prehliadky a rozhliadneme sa → cesta ku dverám → ceny → názov a výzva. Všetko je skutočný web v mobilnom zobrazení, nahrávaný pri používaní (ťuknutia, ťah, skrolovanie). Titulky sú len tam, kde samotné UI nestačí.

## 3. Storyboard (90 BPM, strihy na dobách: 1 takt = 2,667 s)

| # | Čas | Scéna | Na obrazovke | Pohyb a strih | Zvuk |
|---|---|---|---|---|---|
| 1 | 0,00 – 2,67 | **Háčik: svetlá** | Úvod webu: tma, LED trubice sa s blikaním rozsvecujú, nápis GYM KLUB sa zúži zo širokého písma | Skutočná animácia webu | Hlboký dron, elektrické cvaknutia podľa jasu trubíc, na 2,67 úder |
| 2 | 2,67 – 5,33 | **Odhalenie** | Skrolovanie: kamera vojde do priestoru funkčnej zóny. Titulok „Fitko a bojové športy / v Lipa Centre“ (text webu) | Skutočný nájazd kamery pri skrolovaní | Nastúpi pulz basu a kopák |
| 3 | 5,33 – 11,33 | **Prehliadka** | „Vstúpte do GYM KLUB“ → ťuk „Vstúpiť“ → panoráma terasy, ťah prstom → ťuk na trasu „Funkčná zóna“ → panoráma so šprintérskou dráhou → ťuk na bod → karta. Titulok počas ťahu: „Panoráma zo skutočného videa“ | Červená stierka do scény, kruhy pri dotyku | Plný groove, jemné klik pri dotyku, šum pri prechode |
| 4 | 11,33 – 14,67 | **Moment 1: príchod** | Sekcia „Takto k nám trafíte“: kroky sa zvýrazňujú, potom video so skutočnou cestou k dverám a na recepciu | Stmievačka cez čiernu, skrolovanie ku videu | Groove pokračuje |
| 5 | 14,67 – 17,33 | **Moment 2: ceny** | Dlaždice cenníka: jednorazový vstup 6 €, permanentka 50 € | Vysunutie nahor | Stúpanie do záveru |
| 6 | 17,33 – 20,00 | **Záver** | Fotka LED stropu, „GYM KLUB“, „Výstavná 6 · Nitra“, výzva „Pozrite si prehliadku na webe“ / „Odkaz v popise“ | Záblesk cez čiernu, titul sa zúži ako na webe | Záverečný úder a akord Am9, doznenie |

Súčet: 20,0 s. Čitateľnosť: titulok v scéne 2 stojí 2,0 s (6 slov), titulok v scéne 3 1,6 s (4 slová), záverečná výzva 1,7 s.

## 4. Pravdivosť

- Žiadne hodnotenia, počty členov ani vymyslené tvrdenia.
- Ceny sú tie, ktoré uvádza web podľa gymklub.sk (naposledy upravené 12. 4. 2025). Pred zverejnením príspevku ich treba potvrdiť pre rok 2026.
- Nepíše sa „360°“: žiadna panoráma nemá celý kruh.
- Nie je uvedená žiadna URL, pretože web zatiaľ nemá verejnú adresu. Odkaz patrí do popisu príspevku.
- Stav „Otvorené do 21:00“ v zázname zodpovedá utorku 18:00, teda skutočným hodinám Po – Št 06:30 – 21:00.

## 5. Zvuk

Celý soundtrack je syntetizovaný v A mol, 90 BPM, ako jeden celok:
- dron a sub;
- elektrické cvaknutia zosynchronizované s jasom rozsvecujúcich sa trubíc (merané zo snímok);
- bas s pulzom, jemný kopák a hi-hat, pad Am – F – C – G;
- šum pri prechodoch a tiché klik pri dotykoch v tónine;
- záverečný úder a akord.

Efekty sú zmiešané pod hudbou, na konci je jemný limiter.
