# 032 — Filmové a webové prechody

## Obsah

1. Kontinuita a výber
2. Detailné recepty
3. Prechody medzi stránkami
4. Diagnostika

## 1. Kontinuita a výber

Urč, čo ostáva stabilné a čo sa mení: bod záujmu, smer, mierka, svetlo, horizont, farba, význam. Ak sa zmení všetko, používateľ musí obraz znovu hľadať. Zachovaj zmysluplné poradie obsahu aj mimo vizuálnej scény.

| Technika | Použitie | Kontrola |
|---|---|---|
| Hard cut | Okamžitá zmena stavu | Žiadny prázdny záblesk |
| Dissolve / crossfade | Atmosférická zmena obrazu | Bez dvojitého textu |
| Match cut | Nadväznosť tvaru, pohybu alebo významu | Kotva, mierka, orez |
| Cut on action | Výmena počas zodpovedajúcej činnosti | Fáza, smer, rýchlosť |
| Occlusion wipe | Skrytá výmena pod popredím | Úplné zakrytie aj na mobile |
| Whip pan | Krátka smerová energia | Nehýbať čitateľným formulárom |
| Iris/mask reveal | Sústredenie na predmet | Pokrytie celého viewportu |
| Shared element / FLIP | Karta → detail alebo galéria | Fokus, rozmery, späť |
| Morph | Súvislá premena tvaru | Topológia a poradie bodov |
| Displacement dissolve | Tekutá/materialová zmena obrazu | Stabilný DOM text a koncové stavy |
| Camera bridge | Prechod priestorom cez známu kotvu | Orientácia a dostupná navigácia |
| J/L cut | Zvuková kontinuita médií | Zvuk len po povolení |

S030–S031 podporujú filmové pojmy. Webové recepty sú vlastné adaptácie. J-cut prinesie zvuk ďalšieho záberu pred jeho obrazom; L-cut nechá zvuk pôvodného pokračovať do nového. Samotný prekrytý text nie je J-cut.

## 2. Detailné recepty

### Match cut

Vyber siluetu/bod v oboch obrazoch. Zapíš normalizované súradnice, veľkosť, smer a fázu pohybu. Úzky a široký orez navrhni osobitne. Porovnaj najprv koncové statické zábery, potom časovanie. Chýbajúci predmet nevymýšľaj ako súčasť reality firmy.

Pre kartu → detail uprednostni layout/shared-element mechanizmus pred videom. Zachovaj stabilný identifikátor, cieľové rozmery a dostupný detail bez animácie. S003, S004, S006.

### Prechod zakrytím

Popredie zakryje oblasť výmeny, podklad sa zmení a popredie odíde motivovaným smerom. Scroll fázu vypočítaj z progresu, aby bol správny aj návrat. Over extrémny aspect ratio, safe areas a zmenu orientácie. Po skončení nesmie vrstva zachytávať kliknutia. Pri reduced motion vykonaj okamžitú výmenu.

### FLIP

Zmeraj prvý obdĺžnik, vykonaj layout zmenu, zmeraj posledný, invertuj rozdiel a animuj k identite. Zoskup čítania a zápisy; nevyvolávaj layout pre každú kartu striedavo. Rieš nulové rozmery, odstránené prvky a deformáciu textu. Pri opakovanom kliknutí začni z viditeľného stavu. Native recept v balíku rieši obmedzený presun, nie celý rozsah GSAP Flip/Motion.

### Displacement

Dva obrazy potrebujú správne aspect ratio, dekódovanie pred začiatkom a pole posunu. V strede posuň UV a miešaj textúry; obálka posunu musí byť na oboch koncoch nulová. Rieš sample mimo obrazu, clamp okrajov a správny color pipeline. Text a ovládanie nechaj mimo shaderu. Na slabšej vetve použi fade alebo cut.

### Slučka

Zhoduj prvú a poslednú snímku vrátane polohy, rýchlosti, svetla a častíc. Crossfade nemusí skryť chybnú kontinuitu. Pri procedurálnom pohybe používaj periodický čas a stabilný seed. Pre automatický pohyb popri obsahu posúď ovládanie zastavenia podľa S023.

## 3. Prechody medzi stránkami

Deteguj konkrétnu podporovanú funkciu View Transition API; podpora jedného mechanizmu nepreukazuje všetky podfunkcie. Pomenované reprezentácie musia spĺňať jedinečnosť v zachytávanom stave. S006.

Postup: pripraviť potrebné dáta → vykonať update presne raz → nastaviť názov/fokus → dokončiť alebo preskočiť animáciu. Router ostáva vlastníkom histórie a scroll restoration. Sieťové čakanie neskrývaj v dlhej blokovanej snímke.

Rozlišuj zlyhanie vizuálneho prechodu od zlyhania update. `skipTransition()` preskočí animáciu, nie DOM callback. Pri reject neopakuj update automaticky. Priložená ukážka je same-document prepínač; plný router potrebuje vlastnú integráciu lifecycle a test histórie.

## 4. Diagnostika

Ak každá sekcia používa iný efekt, zredukuj slovník. Pri dvojitom texte oddeľ obrazový crossfade od textového stavu. Pri layout skoku rezervuj miesto. Pri chybnom opačnom skrole odvádzaj stav z progresu namiesto udalostí. Ak CTA čaká na koniec animácie, oddeľ funkčný stav od dekorácie. Ak používateľ stráca orientáciu, zachovaj názov kapitoly alebo stabilnú vizuálnu kotvu.

## Senior decision gate

- **Decision:** Choose a transition that preserves meaning and spatial orientation.
- **Deliverable:** Transition phases with stable frames and state ownership.
- **Verification:** Check interruption, reverse, transformed layouts and unsupported capability.
