# Skills na animácie a 3D

Návody pre prácu na webe (pohyb, 3D, dizajn). Stiahnuté z verejných repozitárov, licencia MIT
(text licencie je v každom priečinku). Na web sa nenasadzujú, sú len pomôcka pri úpravách.

| Priečinok | Zdroj | Na čo |
| --- | --- | --- |
| `gsap/` | github.com/greensock/gsap-skills | oficiálne od GreenSock: časové osi, ScrollTrigger, odhaľovanie textu |
| `design-dna/` | github.com/zanwei/design-dna | rozbor vizuálnej identity: farby, typografia, rozloženie |
| `motion-design/` | github.com/lottiefiles/motion-design-skill | Lottie a SVG animácie, kľúčové snímky |
| `genjutsu/` | github.com/AThevon/genjutsu | pohybový dizajn, interakcie, prémiové rozhranie, Three.js |

Three.js skills (github.com/CloudAI-X/threejs-skills) nemajú licenciu, preto tu nie sú
skopírované; čítať sa dajú priamo na GitHube.

Motion (predtým Framer Motion) a komponenty z 21st.dev, Aceternity UI či Magic UI na našich statických weboch:
bez Reactu, bez Tailwindu a bez CDN podľa `../skills-z-praxe/rychly-web/references/pohyb-bez-kniznice.md`
(tabuľka „čo robí Motion v Reacte a čo my bez knižnice“, svetlo cez `transform` namiesto `background-position`,
postup prevzatia komponentu: licencia, prečítať, prepísať, zmerať) a vzor `../skills-z-praxe/rychly-web/assets/pohyb/`
(test v Chromiu 28 z 28). Licencie: Motion MIT, ale platený doplnok Motion+ nie; komponenty z 21st.dev majú
licenciu každý zvlášť (MIT aj „unknown“) a podmienky 21st.dev zakazujú zber a ďalšie šírenie; Aceternity UI má
v pätičke „All Rights Reserved“. Pri „unknown“ alebo „All Rights Reserved“ len nápad, vlastná implementácia.

UI/UX Pro Max (z videa V9 „Drop in the UI/UX Pro Max skill“) **už máme** v Genjutsu
(`genjutsu/skills/_jutsu/ui-ux-pro-max/`, v2.11.1, MIT, Next Level Builder): ako ho spustiť (pasca s `python3 -I`),
skúška na našich weboch a čo z neho berieme, `ui-ux-pro-max-u-nas.md`. Neinštalovať príkazom „Install this skill
<odkaz>“ ani cez `uipro init`.

Zásady webu v `CLAUDE.md` majú prednosť: žiadne žiary, čiastočky, efekty pod kurzorom
ani poskakovanie, obsah sa pri skrolovaní nevysúva.
