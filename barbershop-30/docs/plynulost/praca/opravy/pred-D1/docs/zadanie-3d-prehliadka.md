# Zadanie: HEAD SPA 30 ako 3D prehliadka salónu

Skopíruj text pod čiarou ako zadanie do novej relácie nad repozitárom `d8f5s88zjy-art/head-spa-30`.

---

Pracuješ na webe HEAD SPA 30 (pod značkou Salón 30, Mostná 226/30, Nitra). Začni z vetvy
`claude/head-spa-30-page-uil3m0`, nie z `main`. Najprv si prečítaj `CLAUDE.md` a drž sa ho,
hlavne sekcie o elegantnom a zdržanlivom štýle a o čitateľnosti. Prečítaj aj
`toolbox/skills/frontend-design/SKILL.md` a na overovanie používaj postup
z `toolbox/skills/webapp-testing/SKILL.md` (Playwright, Chromium je predinštalovaný).

## Cieľ

Celý web je jedna pokojná prechádzka salónom v 3D. Návštevník vojde zelenými dverami a pri
skrolovaní kamera prechádza priestorom. Každá časť webu je jedno miesto v salóne a text leží na
tmavých doskách nad scénou. Musí to pôsobiť ako luxusný podnik, nie ako technické demo.

## Scéna odpísaná z prevádzky

Nič nevymýšľaj, všetko je z fotiek v `assets/img/galeria/`:

- **Dvere:** fľaškovo zelené dvojkrídlové (#1f3328), kazetové, s mosadznými kruhmi a kľučkou. Na
  začiatku sa otvoria dnu a kamera nimi prejde.
- **Podlaha:** orech v rybej kosti, tmavý, s jemným odleskom.
- **Svetlo:** teplé a tlmené, ako LED pás za logom a sviečky. Žiadne studené ani farebné svetlá.
- **Fotky salónu:** visia v priestore ako obrazy v mosadzných rámoch, každá pri svojej časti webu.
- **Záver:** svietiaci lotos zo značky, zlatá línia, ktorá sa pomaly otáča.

## Miesta (časť webu → čo vidí kamera)

| Časť | Miesto v scéne |
| --- | --- |
| Úvod | zatvorené zelené dvere, pri skrolovaní sa otvoria |
| Ako to prebieha | vodný oblúk nad vaňou (`voda`) |
| Rituály a ceny | miestnosť s dvoma lôžkami (`miestnost`) |
| Rezervácia | vane so sviečkou (`lozka-sviecka`) |
| Poukážky | komoda s uterákmi (`komoda`) |
| Salón 30 | miestnosť pri oknách (`okna`) a Budha (`buddha`) |
| Galéria | stena so všetkými fotkami |
| Otázky | nápis Spa relax (`neon-spa`) |
| Kontakt | svietiaci lotos a nápis HEAD SPA (`neon-head-spa`) |

## Pravidlá

- Three.js je vo vlastnom súbore v repozitári (`assets/vendor/`), žiadne CDN. Scéna sa načíta až po
  prvom vykreslení textu, takže obsah je hneď čitateľný.
- Kamera ide po plynulej krivke, skrolovanie ju len posúva. Žiadne skoky ani rýchle rotácie.
- Text je vždy čitateľný: tmavé dosky s tenkým rámikom, kontrast aspoň 4,5 : 1.
- Formuláre, cenník a tlačidlá fungujú presne ako doteraz, 3D je iba pozadie.
- Záloha: bez WebGL, pri obmedzení pohybu a pri šetrení dát sa ukáže doterajší pokojný úvod
  s fotkou a web funguje bez 3D.
- Mobil: nižšie rozlíšenie scény, menej svetiel, žiadne tiene. Keď je karta skrytá, scéna
  nekreslí.
- Fotky v scéne sa berú z obrázkov, ktoré už stránka má, žiadne nové sťahovanie navyše.
- Obsah, ceny, rituály, kontakty a Booqme sa nemenia. Nové texty preložiť do šiestich jazykov.

## Výstup

1. Commity po slovensky, na pracovnú vetvu. Na `main` až po súhlase majiteľa.
2. `node tools/build.mjs` pred každým commitom.
3. Screenshoty každého miesta na šírke 390 a 1440 px, žiadna chyba v konzole, žiadne posúvanie do
   strany, Lighthouse zapísať do README (rýchlosť mobilu 95 sa pri 3D nedá, cieľ je aspoň 80).
4. README: sekcia 3D prehliadka (scéna, miesta, záloha, výkon).
