# Skills z praxe

Naše vlastné postupy z prác na weboch HEAD SPA 30 (koreň repozitára) a BARBERSHOP 30
(`barbershop-30/`), október 2026. Každý je spísaný z kódu a dokumentov, ktoré na webe naozaj
bežia, a nezávisle overený proti nim. Keď sa kód neskôr zmení, platí kód; skill vtedy oprav.

| Skill | Kedy siahnuť |
| --- | --- |
| [`instagram-salon`](instagram-salon/SKILL.md) | príspevok, reel, odpoveď na komentár, bio, týždenný plán alebo rozbor cudzieho reelu pre Instagram salónu; pripravuje len návrhy |
| [`referencie-z-videi`](referencie-z-videi/SKILL.md) | niekto pošle odkaz na TikTok a chce, aby si sa z neho poučil |
| [`film-z-fotiek`](film-z-fotiek/SKILL.md) | pozadie webu ako film zo skutočných fotiek s hĺbkou, strihy medzi zábermi, dvere v úvode |
| [`video-a-sekvencie`](video-a-sekvencie/SKILL.md) | video pri skrolovaní seká, treba plynulý pohyb na 60 až 240 Hz alebo slučku bez švu |
| [`rychly-web`](rychly-web/SKILL.md) | Lighthouse, LCP, CLS, FCP, sekanie pri skrolovaní, audit výkonu |
| [`testy-a-nasadenie`](testy-a-nasadenie/SKILL.md) | testy v prehliadači, snímky obrazovky, nasadenie na GitHub Pages alebo cez FTP |
| [`obsah-a-texty`](obsah-a-texty/SKILL.md) | texty webu, fakty o podniku, preklady, štruktúrované dáta, opravy od majiteľa |
| [`booqme-rezervacie`](booqme-rezervacie/SKILL.md) | rezervácie a poukazy cez Booqme, zosúladenie webu po zmene v kalendári |
| [`kratke-video`](kratke-video/SKILL.md) | krátke vertikálne video (reel, TikTok, Shorts) zo skutočných záberov a fotiek podniku s titulkami |
| [`motion-grafika`](motion-grafika/SKILL.md) | pohyblivá grafika vo vrstvách: lower third, titulná karta, priebeh, značka na konci, s priehľadnosťou |
| [`web-dizajn`](web-dizajn/SKILL.md) | nový web alebo redizajn: zadanie slovami, vkus z referencií, dizajnový systém, kontrola a snímky v prehliadači |
| [`workflowy`](workflowy/SKILL.md) | väčšia úloha pre viac agentov naraz: stavba, kontrola, porota návrhov, audit s overením |

Prevádzka webu HEAD SPA 30 (nahratie na Forpsi, poukazy v Booqme, poukážky) je v samostatnom skille
[`../head-spa-30/`](../head-spa-30/SKILL.md), projekt GYM KLUB v [`../gym-klub/`](../gym-klub/README.md).

## Použitie v iných chatoch

- **Claude Code v tomto repozitári:** netreba nič, `CLAUDE.md` na skills odkazuje.
- **Claude.ai (každý nový chat):** zabaľ skill do zipu a nahraj ho v nastaveniach (Settings,
  Capabilities, Skills). Zipy vyrobí `python3 -I toolbox/skills-z-praxe/zabal.py <priečinok>`
  (všetky) alebo s menami skills (len vybrané).
- **Claude Code na inom počítači:** rozbaľ zip do `~/.claude/skills/`, skill sa načíta sám.
- Mimo repozitára chýbajú zdrojové súbory webov (fakty, zábery, písma): skills, ktoré ich
  potrebujú, to hovoria v časti „Mimo tohto repozitára“ a pýtajú si ich od majiteľa.

Spoločné pravidlá platia vždy: fakty len zo zdrojov, slovenčina a tykanie, krátke texty bez
pomlčky em dash, žiadna zmienka o AI na webe, v kóde ani v commitoch (podrobne `CLAUDE.md`).
