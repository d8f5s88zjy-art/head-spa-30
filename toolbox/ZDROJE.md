# Vybrané bezplatné zdroje na tvorbu webu a obsahu

Nie tisíc odkazov, ale tie, ktoré sa v praxi naozaj používajú. Pri každom je
licencia, aby bolo jasné, čo sa dá použiť komerčne.

## Písma
- Google Fonts, fonts.google.com, otvorené licencie (OFL, Apache); Lora a Manrope z tohto webu sú odtiaľ
- Fontshare, fontshare.com, bezplatné písma od Indian Type Foundry (ITF Free Font License)
- Fontsource, fontsource.org, tie isté písma ako balíčky na vlastné hostovanie

## Ikony
- Lucide, lucide.dev, ISC licencia, čisté čiarové ikony
- Tabler Icons, tabler.io/icons, MIT, vyše 5 000 ikon
- Phosphor Icons, phosphoricons.com, MIT, viac hrúbok
- Simple Icons, simpleicons.org, CC0, logá značiek (Instagram, WhatsApp a pod.)

## Fotky a video
- Unsplash, unsplash.com, Unsplash License (komerčne áno, bez predaja samotnej fotky)
- Pexels, pexels.com, Pexels License, fotky aj videá
- Pixabay, pixabay.com, Pixabay Content License
- Coverr, coverr.co, bezplatné videá na pozadie

## Šablóny a komponenty
- HTML5 UP, html5up.net, CC BY 3.0, hotové responzívne stránky
- Start Bootstrap, startbootstrap.com, MIT, témy a bloky pre Bootstrap
- Tailwind CSS, tailwindcss.com, MIT; Tailwind UI Components (free časť), tailwindcss.com/plus/ui-blocks
- shadcn/ui, ui.shadcn.com, MIT, komponenty pre React
- daisyUI, daisyui.com, MIT, komponenty nad Tailwindom
- Open Props, open-props.style, MIT, dizajnové premenné pre čisté CSS
- Free Frontend, freefrontend.com, zbierka ukážok kódu (licencia podľa autora)

## Animácie a efekty
- GSAP, gsap.com, od roku 2024 bezplatné aj komerčne
- Motion (Framer Motion), motion.dev, MIT
- Lenis, lenis.darkroom.engineering, MIT, plynulý skrol
- Lottie, lottiefiles.com, animácie vo formáte JSON (licencia podľa súboru)

## Farby a dizajn
- Coolors, coolors.co, generátor paliet
- Realtime Colors, realtimecolors.com, skúška palety na živej stránke
- Penpot, penpot.app, otvorený nástroj na dizajn (MPL 2.0), alternatíva k Figme
- Figma, figma.com, bezplatný plán pre jednotlivcov

## Obrázky, ikony webu, výkon
- Squoosh, squoosh.app, zmenšenie a prevod obrázkov (AVIF, WebP)
- RealFaviconGenerator, realfavicongenerator.net, ikony pre všetky zariadenia
- PageSpeed Insights, pagespeed.web.dev, meranie rýchlosti (Lighthouse)
- WebPageTest, webpagetest.org, podrobné meranie načítania
- Can I use, caniuse.com, podpora vlastností v prehliadačoch

## Prístupnosť a SEO
- WAVE, wave.webaim.org, kontrola prístupnosti
- axe DevTools, deque.com/axe, rozšírenie do prehliadača
- Schema.org, schema.org, štruktúrované dáta (tento web ich používa pre salón, ponuky a FAQ)
- Rich Results Test, search.google.com/test/rich-results, kontrola štruktúrovaných dát

## Generátory a mikro nástroje
- CSS Gradient, cssgradient.io
- Clippy, bennettfeely.com/clippy, clip-path tvary
- Fancy Border Radius, 9elements.github.io/fancy-border-radius
- Haikei, haikei.app, SVG pozadia a vlny
- SVGOMG, jakearchibald.github.io/svgomg, zmenšenie SVG

## Statické generátory a hosting
- Astro, astro.build, MIT
- Eleventy, 11ty.dev, MIT
- GitHub Pages, pages.github.com, bezplatný hosting statických stránok (tento web)
- Cloudflare Pages, pages.cloudflare.com, bezplatný plán
- Netlify, netlify.com, bezplatný plán

## Texty a obsah
- Hemingway Editor, hemingwayapp.com, čitateľnosť textu
- LanguageTool, languagetool.org, kontrola slovenčiny aj iných jazykov
- Ľudový slovník a Jazykovedný ústav Ľ. Štúra, slovnik.juls.savba.sk, pravopis a tvary

## Skills a agenti
- Anthropic skills, github.com/anthropics/skills (kópia vybraných je v `skills/`)
- Špecifikácia Agent Skills, agentskills.io
- skills.sh, katalóg skills od komunity

## Skills na animácie a 3D
- GSAP skills, github.com/greensock/gsap-skills, MIT, v `toolbox/skills-animacie/gsap`
- Design DNA, github.com/zanwei/design-dna, MIT, v `toolbox/skills-animacie/design-dna`
- Motion Design Skill, github.com/lottiefiles/motion-design-skill, MIT, v `toolbox/skills-animacie/motion-design`
- Genjutsu, github.com/AThevon/genjutsu, MIT, v `toolbox/skills-animacie/genjutsu`
- Three.js skills, github.com/CloudAI-X/threejs-skills, bez licencie (len odkaz, neskopírované)
- Instagram Agent (nategold.ai), github.com/nategoldai/instagram-agent, 11 skills na správu Instagramu; licencia
  neznáma, repozitár sme neotvárali (len video). Náš vlastný postup len s návrhmi je `skills-z-praxe/instagram-salon`
- Naše overené postupy z prác na weboch: `skills-z-praxe/` (prehľad v `skills-z-praxe/README.md`)
- RuFlo (predtým Claude Flow), github.com/ruvnet/ruflo, MIT: orchestrácia mnohých agentov pre Claude Code (roje,
  pamäť, smerovanie úloh medzi modelmi). Neinštalované: zapisuje `CLAUDE.md`, `.claude/`, hooky a MCP server.
  Rozbor a čo sme si vzali: `skills-z-praxe/referencie-z-videi/references/naucene-z-videi.md` (časť 5)
  a `skills-z-praxe/workflowy` (smerovanie podľa náročnosti)
- gstack, github.com/garrytan/gstack, MIT (Copyright (c) 2026 Garry Tan), verzia 1.91.101.0, commit 47d639a: skills pre
  Claude Code ako roly (CEO, dizajnér, eng manažér, review, QA, ship, cso). Neinštalované (Bun, binárky, Stop hook
  v `~/.claude/settings.json`, vlastný prehliadač, telemetria). Prevzaté postupy po slovensky s krátkymi citátmi
  a odkazom na súbor: `skills-z-praxe/tim-roly`; rozbor videa: `skills-z-praxe/referencie-z-videi/references/naucene-z-videi.md` (časť 8)
- ECC (Everything Claude Code), github.com/affaan-m/ECC, MIT (Copyright (c) 2026 Affaan Mustafa), verzia 2.2.3, commit 76aaa77;
  8 skills z oblasti supply chain má Apache-2.0 a `osint-investigation` CC-BY-SA-4.0 (tie nepreberáme). Neinštalované
  (27 hookov predvolene zapnutých, zápis práce mimo projektu). Prevzaté myšlienky ako vlastný text: brána dvoch recenzentov
  (`santa-method`, pôvod podľa skillu Ronald Skelton), schválenie presného súboru (`operator-approval-loop`), zásady krátkeho
  videa (`content-engine`, `video-editing`), správa PRIPRAVENÉ alebo NEPRIPRAVENÉ (`verification-loop`), „lethal trifecta“:
  `skills-z-praxe/tim-roly`, `skills-z-praxe/youtube-shorts`, `skills-z-praxe/workflowy` (vzor 7); rozbor videa: časť 9
- „AI Social Media Team“ (ReStructure AI, re-structure.ai): kód ani súbory nie sú verejné, nič neprevzaté; rozbor videa
  a právne hranice: `skills-z-praxe/referencie-z-videi/references/naucene-z-videi.md` (časť 10),
  `skills-z-praxe/instagram-salon/references/pravne-hranice.md`

## Video, zvuk a krátke videá (len odkazy, nič neskopírované, ak nie je uvedené inak)
- FFmpeg, ffmpeg.org, LGPL alebo GPL podľa zostavy: strih, titulky (libass), tónovanie HDR (zimg), hlasitosť; skripty
  v `skills-z-praxe/youtube-shorts/scripts/`
- Manrope, github.com/sharanda/manrope, SIL OFL 1.1: písmo titulkov, premenovaná kópia rezu 700 s celou slovenskou
  diakritikou v `skills-z-praxe/youtube-shorts/assets/pisma/` aj s textom licencie (`OFL.txt`)
- yt-dlp, github.com/yt-dlp/yt-dlp, Unlicense: stiahnutie referenčného videa s titulkami a metadátami, keď nestačí
  `referencie-z-videi/scripts/tiktok.sh` (len na rozbor, nie na zverejnenie)
- Knižnica zvukov YouTube (YouTube Studio, Audio Library): hudba bez nároku Content ID (support.google.com/youtube/answer/15424877)
- Google Ads, bezpečná zóna zvislého videa, support.google.com/google-ads/answer/9128498 (288/672/48/192 px pri 1080×1920)
- Remotion, remotion.dev: video z kódu; vlastná licencia, zadarmo pre jednotlivcov, neziskovky a firmy do 3 zamestnancov,
  inak firemná licencia (github.com/remotion-dev/remotion/blob/main/LICENSE.md, pozreté 2026-10-17); nepoužívame
- Nástroje z videa restructureai, len na posúdenie, nič nenapojené: Meta Ad Library (facebook.com/ads/library, ručne),
  ElevenLabs (hlasy a hlasoví agenti; podmienky oznámenia AI a nahrávania), Higgsfield (video z obrázkov), Jev od
  TypeSafe AI (rozhodovací model, skorý prístup). Prečo nie: `skills-z-praxe/instagram-salon/references/pravne-hranice.md`
