# Skills z praxe

Naše vlastné postupy z prác na weboch HEAD SPA 30 (koreň repozitára) a BARBERSHOP 30
(`barbershop-30/`), október 2026. Každý je spísaný z kódu a dokumentov, ktoré na webe naozaj
bežia, a nezávisle overený proti nim. Keď sa kód neskôr zmení, platí kód; skill vtedy oprav.

| Skill | Kedy siahnuť |
| --- | --- |
| [`instagram-salon`](instagram-salon/SKILL.md) | príspevok, reel, odpoveď na komentár, bio, týždenný plán alebo rozbor cudzieho reelu pre Instagram salónu; reklamy a dopyty bez automatiky (Ad Library, UTM, právne hranice); pripravuje len návrhy |
| [`referencie-z-videi`](referencie-z-videi/SKILL.md) | niekto pošle odkaz na TikTok alebo Instagram reel a chce, aby si sa z neho poučil; text z obrazu bez titulkov (`snimky_text.py`), zásada sťahovania a čistenie metadát (`vycisti_info.py`), 20 záznamov (19 videí a karusel) |
| [`film-z-fotiek`](film-z-fotiek/SKILL.md) | pozadie webu ako film zo skutočných fotiek s hĺbkou, strihy medzi zábermi, dvere v úvode |
| [`video-a-sekvencie`](video-a-sekvencie/SKILL.md) | video pri skrolovaní seká, treba plynulý pohyb na 60 až 240 Hz alebo slučku bez švu |
| [`rychly-web`](rychly-web/SKILL.md) | Lighthouse, LCP, CLS, FCP, sekanie pri skrolovaní, audit výkonu; nástup pri skrole a svetlo bez knižnice (vzor `assets/pohyb/` s testom), Motion a komponenty z 21st.dev do vanilla |
| [`testy-a-nasadenie`](testy-a-nasadenie/SKILL.md) | testy v prehliadači, snímky obrazovky, nasadenie na GitHub Pages alebo cez FTP |
| [`obsah-a-texty`](obsah-a-texty/SKILL.md) | texty webu, fakty o podniku, preklady, štruktúrované dáta, opravy od majiteľa |
| [`booqme-rezervacie`](booqme-rezervacie/SKILL.md) | rezervácie a poukazy cez Booqme, zosúladenie webu po zmene v kalendári |
| [`workflowy`](workflowy/SKILL.md) | väčšia úloha pre viac agentov naraz: stavba, kontrola, porota návrhov, audit s overením |
| [`youtube-shorts`](youtube-shorts/SKILL.md) | short alebo reel na YouTube zo skutočných záberov: recept 30 až 45 s, titulky do obrazu, hlasitosť, HDR z iPhonu, kontrola pred nahratím, rozbor strihov cudzieho videa, schválenie presného súboru (skripty `short.py`, `strihy.sh`, `schvalenie.py`); formát stály titulok + pás 16:9 (`titulok_16x9.py`), kontrola tvrdení a fám (`tvrdenia.py`), strih podľa rytmu referencie (`strih_podla_referencie.py`), výzvy za slovo a prečo nie |
| [`tim-roly`](tim-roly/SKILL.md) | pred stavbou alebo natáčaním (otázky majiteľovi, revízia rozsahu, dizajnu 0 až 10 a techniky), kontrola diffu, QA, ladenie (Iron Law), bezpečnosť, release, brána dvoch recenzentov; karta novej roly, eskalácia po troch kolách, roly textár, ponuka a rezervácie, recenzie; podľa gstack, ECC a Agency Agents so zadaniami a schémami |
| [`asistent-na-webe`](asistent-na-webe/SKILL.md) | okno „Opýtaj sa nás“ na webe: odpovede návštevníkom z overených údajov (Claude Opus 5.5 cez PHP, prúd po kúskoch), znalosti po zmene cenníka, limity a nasadenie |
| [`3d-modely-na-web`](3d-modely-na-web/SKILL.md) | 3D model na web (GLB, three.js, model-viewer) alebo „3D z fotky“ (TRELLIS.2): kedy áno a kedy nie, licencie závislostí, súkromie dema, rozpočet pre telefón, kontrola GLB skriptom `glb_info.py`, „3D okolie“ z máp |

Prevádzka webu HEAD SPA 30 (nahratie na Forpsi, poukazy v Booqme, poukážky) je v samostatnom skille
[`../head-spa-30/`](../head-spa-30/SKILL.md), projekt GYM KLUB v [`../gym-klub/`](../gym-klub/README.md).

Spoločné pravidlá platia vždy: fakty len zo zdrojov, slovenčina a tykanie, krátke texty bez
pomlčky em dash, žiadna zmienka o AI na webe, v kóde ani v commitoch (podrobne `CLAUDE.md`).
