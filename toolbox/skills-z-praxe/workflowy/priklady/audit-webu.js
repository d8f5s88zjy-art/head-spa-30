export const meta = {
  name: 'barbershop30-audit',
  description: 'Audit podkladov pre web Barbershop 30: overené obchodné údaje, inventár fotiek, pravidlá z referencií, technická príprava',
  phases: [
    { title: 'Výskum', detail: 'obchodné údaje so zdrojmi, TikTok referencie' },
    { title: 'Fotky', detail: '45 fotiek v troch dávkach' },
    { title: 'Referencie', detail: 'destilácia pravidiel z dodaných balíkov' },
    { title: 'Technika', detail: 'three.js, písma, headless WebGL' },
  ],
}

// Príklad z praxe: audit podkladov pred stavbou webu BARBERSHOP 30 (pôvodne workflow „barbershop30-audit“, 2026-10-09).
// Štyri prúdy naraz: výskum obchodných údajov so zdrojom a stupňom dôveryhodnosti, inventár 45 fotiek
// v troch dávkach po 15 (pipeline), pravidlá z dodaných referenčných balíkov, technická príprava
// (three.js, písma, screenshoty WebGL v headless Chromiu).
// Kedy sa osvedčil: na začiatku projektu. Prvé tri stupne dôveryhodnosti zo schémy BUSINESS má
// barbershop-30/docs/CONTENT_SOURCES.md po slovensky (namiesto not-found stupeň neoverené), polia fotiek
// (bod záujmu, alt, ľudia) sú ako v docs/MEDIA_SELECTION.md.
// Spustenie: nástroj Workflow so scriptPath na tento súbor. Cesty v P a S sú z pôvodnej relácie, uprav ich.
// Oproti originálu pribudol len tento komentár.

const P = '/home/user/head-spa-30/barbershop-30'
const S = '/tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/x'

const BUSINESS = {
  type: 'object',
  properties: {
    fields: { type: 'array', items: { type: 'object', properties: {
      key: { type: 'string' }, value: { type: 'string' }, source_url: { type: 'string' },
      retrieved: { type: 'string' }, confidence: { type: 'string', enum: ['verified-official', 'third-party', 'weak', 'not-found'] },
      note: { type: 'string' } }, required: ['key', 'value', 'source_url', 'confidence'] } },
    services: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, price: { type: 'string' }, duration: { type: 'string' }, source_url: { type: 'string' }, note: { type: 'string' } }, required: ['name', 'source_url'] } },
    team: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, source_url: { type: 'string' } }, required: ['name', 'source_url'] } },
    not_found: { type: 'array', items: { type: 'string' } },
    blocked_sources: { type: 'array', items: { type: 'string' } },
    tiktok: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, readable: { type: 'boolean' }, what_was_readable: { type: 'string' } }, required: ['url', 'readable'] } },
    summary: { type: 'string' },
  },
  required: ['fields', 'services', 'team', 'not_found', 'blocked_sources', 'tiktok', 'summary'],
}

const PHOTOS = {
  type: 'object',
  properties: {
    photos: { type: 'array', items: { type: 'object', properties: {
      file: { type: 'string' }, width: { type: 'integer' }, height: { type: 'integer' },
      room: { type: 'string' }, description: { type: 'string' }, subjects: { type: 'array', items: { type: 'string' } },
      light: { type: 'string' }, quality: { type: 'integer' }, hero_fit: { type: 'integer' },
      scenes: { type: 'array', items: { type: 'integer' } }, focal_x: { type: 'integer' }, focal_y: { type: 'integer' },
      people_visible: { type: 'string' }, near_duplicate_of: { type: 'string' }, alt_sk: { type: 'string' }, notes: { type: 'string' } },
      required: ['file', 'width', 'height', 'room', 'description', 'quality', 'hero_fit', 'scenes', 'focal_x', 'focal_y', 'alt_sk', 'people_visible'] } },
    batch_notes: { type: 'string' },
  },
  required: ['photos', 'batch_notes'],
}

const REFS = {
  type: 'object',
  properties: {
    rules: { type: 'array', items: { type: 'object', properties: { area: { type: 'string' }, rule: { type: 'string' }, source: { type: 'string' } }, required: ['area', 'rule', 'source'] } },
    anti_patterns: { type: 'array', items: { type: 'string' } },
    scene_ideas: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['rules', 'anti_patterns', 'scene_ideas', 'notes'],
}

const TECH = {
  type: 'object',
  properties: {
    three_version: { type: 'string' }, three_files: { type: 'array', items: { type: 'string' } }, three_size_kb: { type: 'number' },
    fonts: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, family: { type: 'string' }, weight: { type: 'string' }, style: { type: 'string' }, size_kb: { type: 'number' } }, required: ['file', 'family', 'weight', 'size_kb'] } },
    fonts_css_path: { type: 'string' },
    webgl_screenshot_ok: { type: 'boolean' }, chromium_launch: { type: 'string' }, screenshot_script_path: { type: 'string' },
    notes: { type: 'array', items: { type: 'string' } }, issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['three_version', 'three_files', 'three_size_kb', 'fonts', 'fonts_css_path', 'webgl_screenshot_ok', 'chromium_launch', 'screenshot_script_path', 'notes', 'issues'],
}

const COMMON = `Kontext: staviame nový web pre BARBERSHOP 30 v Nitre (slovenský barbershop, značka „30 Barbershop Holičstvo“, sesterský podnik Salónu 30 na Mostnej 30, Nitra – pozor, údaje Salónu 30 NIE sú údaje barbershopu). Projektový priečinok: ${P}. Dnešný dátum: 2026-10-09. Pravidlo pravdy: nikdy nič nevymýšľaj; čo nenájdeš, označ ako nenájdené.`

const research = agent(`${COMMON}

Úloha: nájdi OVERENÉ obchodné údaje o Barbershop 30 Nitra (iné názvy: „30 Barbershop“, „30 Barbershop Holičstvo“, „Barbershop30“). Načítaj si nástroje WebSearch a WebFetch cez ToolSearch (query "select:WebSearch,WebFetch"). Použi WebSearch v móde "extended" (niche lokálny podnik) s viacerými dotazmi po slovensky aj anglicky: "Barbershop 30 Nitra", "30 Barbershop Holičstvo Nitra", "barbershop30 nitra bookio", "barbershop 30 nitra cenník", "barbershop 30 nitra instagram", "barbershop 30 nitra školenia barber", "salon 30 barbershop nitra", "barbershop30.sk".
Hľadaj: oficiálny web / doména, adresu (ulica, PSČ), telefón, e-mail, otváracie hodiny, rezervačný systém (Bookio/Reservio/iné) a presnú URL rezervácie, zoznam služieb s cenami a trvaním (Bookio stránky majú verejný zoznam služieb – skús services.bookio.com aj www.bookio.sk varianty; ak dostaneš 403, zapíš to do blocked_sources), tím (mená len z oficiálnych zdrojov podniku), Instagram/Facebook/TikTok profily, Google hodnotenie (len ak čitateľné z dôveryhodného zdroja, uveď ho ako third-party), rok založenia, školenia/akadémia pod značkou, akékoľvek ocenenie (na fotke v prevádzke je plaketa s rokom 2024 – skús zistiť, čo to je, ale nehádaj).
Každý údaj: hodnota, URL zdroja, dátum získania, dôveryhodnosť (verified-official = web/profil podniku alebo jeho rezervačný systém; third-party = katalógy, mapy, recenzné weby; weak = jediná neoficiálna zmienka). Nezlučuj údaje Salónu 30 (salon30.sk, 0911 153 136) s barbershopom – ak zdroj hovorí, že zdieľajú adresu/telefón, cituj ho.
Navyše: skús WebFetch na tieto tri TikTok odkazy a zapíš, či sa dá prečítať aspoň popis/caption: https://vm.tiktok.com/ZN8kbPkAu/ , https://vm.tiktok.com/ZN8MmEQH5/ , https://vm.tiktok.com/ZN8Mj41uu/ . Nehádaj obsah videí.
Vráť štruktúrovaný výsledok. Do summary napíš 5–8 viet, čo je spoľahlivo overené a čo chýba.`, { label: 'výskum: obchodné údaje', phase: 'Výskum', schema: BUSINESS, effort: 'high' })

const files = Array.from({ length: 45 }, (_, i) => `${P}/source/photos/foto-${String(i + 1).padStart(2, '0')}.jpg`)
const batches = [files.slice(0, 15), files.slice(15, 30), files.slice(30, 45)]
const photos = pipeline(batches, (batch, _, idx) => agent(`${COMMON}

Úloha: urob inventár fotiek interiéru barbershopu pre art direction webu. Otvor KAŽDÝ z týchto ${batch.length} súborov nástrojom Read (zobrazí sa ti obrázok) a popíš ho:
${batch.join('\n')}
Rozmery zisti cez Bash: python3 -c "from PIL import Image;import sys;[print(f, *Image.open(f).size) for f in sys.argv[1:]]" <súbory>.
Pre každú fotku vyplň: room (hlavná sála s oranžovými lampami a zelenými obkladmi / predná sála s recepciou a bielymi obkladmi a priemyselným stropom / zadná miestnosť s čiernymi obkladmi a zelenými sedačkami / vstup a čakáreň pri dverách / detail), description (2–3 vety, čo presne vidno), subjects (kreslá, lampy, barber pole, recepcia, produkty, neón, detské autíčko, sud, astronaut, obklady…), light (teplé/denné/zmiešané, odkiaľ), quality 1–5 (ostrosť, kompozícia, šum), hero_fit 1–5 (vhodnosť ako veľký obrazový záber na celú obrazovku), scenes = pre ktoré scény webu sa hodí: 1 prvý dojem (kreslo), 2 remeslo (detail materiálu/nástroja), 3 miesto (atmosféra salónu, recepcia), 4 ľudia, 5 služby (pokojné pozadie), 6 výsledky/dôvera (detaily, ocenenia, recenzie), 7 rezervácia (vstup, dvere, recepcia). focal_x/focal_y = bod záujmu v percentách šírky/výšky (pre object-position pri orezoch na mobil/desktop). people_visible: "nie" / "áno – popis" (napr. odraz barbera v zrkadle, chodci za sklom) – dôležité pre súkromie. near_duplicate_of: názov súboru, ak je to takmer rovnaký záber ako iný v tvojej dávke, inak prázdny reťazec. alt_sk: vecný alternatívny text po slovensky (max 120 znakov, bez vymýšľania). notes: čo je na fotke čitateľné (nápisy, cenník, plakety, logá) alebo rušivé (káble, odpadkový kôš, odraz telefónu).
Nehodnoť nič, čo si neotvoril. Do batch_notes napíš, čo v tejto dávke chýba pre web (portréty tímu, práca rúk, výsledky strihov…).`, { label: `fotky dávka ${idx + 1}`, phase: 'Fotky', schema: PHOTOS }))

const refs = agent(`${COMMON}

Úloha: z dodaných referenčných balíkov vydestiluj KONKRÉTNE, použiteľné pravidlá pre tento web – filmovo vedený, scrollom riadený one-page web s 3D hero objektom (barber kreslo), autentickými fotkami, službami, cenami a rezerváciou. Prečítaj:
- ${P}/source/refs/PROMPT_BARBERSHOP_30.md (zadávací prompt priamo pre tento podnik – vyber z neho štruktúru, pravidlo pravdy, prístupnosť, výkon, SEO, kvalitné brány)
- ${P}/source/refs/PROMPT_LOCAL_BUSINESS_WEBSITE_PRO.md
- ${S}/63bc668e-10k-websites-skill/10k-websites/SKILL.md a priečinok references/ (design-package.md, prompt-laws.md, troubleshooting.md)
- v ${S}/881986a3-max-studio-ultra-x-v7-local-business-pro/max-studio-ultra-x/references/ použi Grep/Glob a prečítaj LEN moduly relevantné pre: hero/first impression, scroll-driven camera a scrollytelling, 3D materiály a svetlo (Three.js), motion timing, typografia a layout, anti-patterns, local business conversion, performance budgets, accessibility. Nečítaj video/Higgsfield/ecommerce moduly.
Výstup: max 80 pravidiel, každé jedna veta, konkrétne a overiteľné (čísla, prahy, čo áno/čo nie), s area (hero, motion, 3d, typo, layout, conversion, perf, a11y, seo, content-truth) a source (súbor). Plus zoznam anti-patterns (max 25) a scene_ideas (max 15 nápadov na prechody/kompozície vhodné pre 7 scén: kreslo → remeslo → miesto → ľudia → služby → výsledky → rezervácia). Do notes napíš, čo v balíkoch chýba alebo si protirečí. Súbor „Analyza_10_referencnych_videi.md“ nemáme – nevymýšľaj jeho obsah.`, { label: 'referencie: pravidlá', phase: 'Referencie', schema: REFS })

const tech = agent(`${COMMON}

Úloha: technická príprava projektu (statický web bez build kroku, ES moduly). Pracuj v ${P}. Sieť funguje (npm, GitHub, Google Fonts).
1) three.js: do dočasného priečinka v /tmp/claude-0/-home-user/9632978b-2b69-5a1e-a151-fbbea674fc3a/scratchpad/three-tmp nainštaluj npm balík three@0.186.1 (npm install --prefix …). Skopíruj build/three.module.min.js (alebo three.module.js ak min chýba) do ${P}/assets/vendor/three.module.min.js a LICENSE do ${P}/assets/vendor/three-LICENSE. Skopíruj aj examples/jsm/environments/RoomEnvironment.js, examples/jsm/geometries/RoundedBoxGeometry.js a examples/jsm/postprocessing nepotrebujeme. V skopírovaných jsm súboroch prepíš import z 'three' na './three.module.min.js' (relatívne), aby fungovali bez import mapy. Over, že súbory nemajú ďalšie importy, ktoré chýbajú. Zapíš veľkosti v KB (aj gzip: gzip -c file | wc -c).
2) Písma: display Fraunces – stiahni variabilný TTF z https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf a italic https://github.com/google/fonts/raw/main/ofl/fraunces/Fraunces-Italic%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf (ak 404, pozri aktuálne názvy v https://github.com/google/fonts/tree/main/ofl/fraunces alebo použi Google Fonts css2 API s UA Chrome a stiahni woff2 pre subsety latin a latin-ext). Pomocou fontTools (pip už nainštalovaný: fontTools 4.66, brotli) vytvor statické inštancie: Fraunces opsz=144 wght=500 SOFT=0 WONK=0; wght=800 rovnaké; italic opsz=144 wght=500. Subsetuj (pyftsubset alebo fontTools.subset) na unicodes U+0000-00FF,U+0100-017F,U+0180-024F,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-21BB,U+2212,U+2215 s --layout-features='*' --flavor=woff2 do ${P}/assets/fonts/Fraunces-500.woff2, Fraunces-800.woff2, Fraunces-500i.woff2. Text font Manrope: skopíruj /home/user/head-spa-30/assets/fonts/Manrope-400.woff2, Manrope-600.woff2, Manrope-700.woff2 (už subsetované so slovenskou diakritikou) do ${P}/assets/fonts/. Over slovenské znaky (ľščťžýáíéôäňďú ĽŠČŤŽ) v každom fonte cez fontTools (cmap). Napíš ${P}/assets/fonts.css s @font-face (font-display: swap, local() nepoužívaj) pre family "Fraunces" (500 normal, 800 normal, 500 italic) a "Manrope" (400, 600, 700). Zapíš veľkosti.
3) Headless WebGL screenshoty: Playwright je nainštalovaný globálne (node -e "require('playwright')" funguje; Chromium v /opt/pw-browsers, PLAYWRIGHT_BROWSERS_PATH je nastavený, nerob "playwright install"). Vytvor testovaciu stránku ${P}/source/webgl-test.html, ktorá cez <script type="module"> importuje ./../assets/vendor/three.module.min.js, vyrenderuje osvetlenú guľu s MeshPhysicalMaterial (metalness 1, roughness 0.3) a PMREM z RoomEnvironment na tmavom pozadí. Napíš skript ${P}/source/shot.mjs (node, playwright), ktorý spustí statický server (python3 -m http.server v koreňi ${P} na voľnom porte alebo node http server) a urobí screenshoty danej URL vo viewportoch 1440x900 a 390x844 do ${P}/docs/screenshots/<názov>-desktop.png a -mobile.png; parametre: url, názov, voliteľne scrollY a čakanie. Skús najprv chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}); ak canvas vyjde čierny, skús iné kombinácie (--use-gl=swiftshader, --enable-webgl, --disable-gpu, headless 'new'). Over pixelmi (PIL), že screenshot nie je prázdny/čierny a že guľa má odlesky. Zapíš funkčné flagy do chromium_launch a do notes čas renderu.
4) Nič iné v projekte nemeň. Zmaž dočasné npm priečinky mimo projektu nemusíš. Vráť štruktúrovaný výsledok s presnými cestami a problémami.`, { label: 'technika: three, písma, WebGL', phase: 'Technika', schema: TECH })

const [business, photoBatches, rules, techres] = await Promise.all([research, photos, refs, tech])
const allPhotos = (photoBatches || []).filter(Boolean).flatMap(b => b.photos)
log(`Výskum: ${business ? business.fields.length : 0} údajov, fotky: ${allPhotos.length}/45, pravidlá: ${rules ? rules.rules.length : 0}, WebGL screenshot: ${techres ? techres.webgl_screenshot_ok : 'n/a'}`)
return { business, photos: allPhotos, photo_batch_notes: (photoBatches || []).filter(Boolean).map(b => b.batch_notes), refs: rules, tech: techres }