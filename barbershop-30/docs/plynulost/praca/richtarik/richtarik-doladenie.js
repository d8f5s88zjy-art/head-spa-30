export const meta = {
  name: 'richtarik-doladenie',
  description: 'Stavebniny Richtárik: doladenie filmu po skeptikovi – bez zastavenia na konci prvého prejazdu, koniec na ostrej snímke, 320 px bez tmavej plochy → kontrola → skeptik',
  phases: [
    { title: 'Doladenie', detail: 'zastavenie na konci, posledná snímka, 320 px' },
    { title: 'Kontrola', detail: 'nezávislá kontrola plynulosti a vzhľadu' },
    { title: 'Skeptik', detail: 'poslať majiteľovi?' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const STROM = SP + '/hs-richtarik-obnova'
const WEB = STROM + '/stavebniny-richtarik'
const F1 = SP + '/richtarik/film'
const OUT = SP + '/richtarik/film3'
const F2 = SP + '/richtarik/film2'
const AI = SP + '/richtarik/fotky-ai'
const BAZA = '6bffd83e'
const KONTEXT = `KONTEXT (rozhovor s majiteľom nevidíš): web STAVEBNINY RICHTÁRIK (Nitra, rodinná firma od 1997), statický web ${WEB}. Strom ${STROM} = git worktree, vetva richtarik-film, HEAD ${BAZA} (film ovládaný skrolovaním, plné palety na fotkách, opravy ec85cc39 a ${BAZA} – pozri ${F2}/film/odovzdavka.md, ${F2}/oprava.md, ${F2}/kontrola-film.md, ${F2}/SKEPTIK.md; staršie – pozri ${F1}/odovzdavka.md, ${F1}/oprava.md, ${F1}/kontrola-plynulost.md, ${F1}/kontrola-obsah.md, ${F1}/SKEPTIK.md, skripty ${WEB}/zdroj/film.sh a film.mjs, zdroj filmu ${SP}/richtarik/zdroj/klip-4k.mp4 a start-ulica.png).
MAJITEĽ: úvodná animácia ovládaná skrolovaním, plynulá a filmová; „na fotkách, čo máme, tovar dorobený tak, aby vyzeral, že je úplný“. Trvalé želania: telefón ľahký a plynulý, ŽIADNE čierne ani tmavé polia, ostré fotky, filmové prechody.
PRAVIDLÁ: commity po slovensky, BEZ podpisových riadkov, autor Claude <noreply@anthropic.com>; v strome je naraz jediný zapisovateľ. NIKDY push, merge, reset --hard, rm -rf mimo dočasných priečinkov; nič nenasadzovať; žiadna zmienka o AI na webe ani v kóde. Nových súborov oproti bb6bbaeb spolu ≤ 120. Každé tvrdenie dolož príkazom s výstupom, cestou:riadkom alebo snímkou, ktorú si OTVORIL nástrojom Read. Po slovensky. Prehliadač: Playwright createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers (nič neinštaluj); server python3 -I -m http.server <port> --bind 127.0.0.1 --directory ${STROM}, stránka /stavebniny-richtarik/index.html. ffmpeg, ImageMagick; Pillow je rozbitý (nepoužívaj PIL).`
const ODOV = { type: 'object', properties: { zhrnutie: { type: 'string' }, commity: { type: 'array', items: { type: 'string' } }, merania: { type: 'array', items: { type: 'string' } }, snimky: { type: 'array', items: { type: 'string' } }, nedokoncene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'commity', 'merania', 'snimky', 'nedokoncene', 'subor'] }
const NAL = { type: 'object', properties: { ok: { type: 'boolean' }, verdikt: { type: 'string' }, nalezy: { type: 'array', items: { type: 'object', properties: { zavaznost: { type: 'string', enum: ['vazna', 'stredna', 'drobna'] }, nazov: { type: 'string' }, dokaz: { type: 'string' }, navrh: { type: 'string' } }, required: ['zavaznost', 'nazov', 'dokaz', 'navrh'] } }, subor: { type: 'string' } }, required: ['ok', 'verdikt', 'nalezy', 'subor'] }


phase('Doladenie')
const O = await agent(`${KONTEXT}\n\nROLA: senior front-end a filmový strihač (jediný zapisovateľ v strome). Porty 9000–9009. Výstupy ${OUT}/. Majiteľ už má náhľad stavu ${BAZA}. Skeptik (${F2}/SKEPTIK.md) našiel 3 veci, oprav ich bez zhoršenia čohokoľvek iného: 1) ZASTAVENIE NA KONCI PRVÉHO PREJAZDU: na telefóne s CPU 4× (Chromium bez GPU) sa obraz na konci filmu pri prvom prejazde zastaví na 200–267 ms a pri návrate hore na 217 ms (2 z 2 behov) – nájdi príčinu (dekódovanie posledného bloku, prepnutie na plné rozlíšenie, zmena rozloženia pri odchode úvodu, vysunutie svetlého pásu, garbage collection…) pomocou performance trace (Long Animation Frames, CDP Tracing) a odstráň ju; cieľ 0 snímok nad 100 ms a najviac 1 nad 50 ms v 3 čerstvých behoch dopredu aj dozadu. 2) KONIEC NA OSTREJ SNÍMKE: film sa zastaví na najrozmazanejšej snímke (pohyb kamery) – nech posledná pokojová snímka je ostrá (napr. posledných pár snímok vyber z ostrejších, alebo ostrá statická posledná snímka z 4K zdroja), bez skoku. 3) 320 px: na začiatku je za nadpisom súvislá tmavá plocha ~28 % obrazovky – majiteľ nechce tmavé plochy; čitateľnosť textu zabezpeč inak (tieň textu, menší a jemnejší prechod, umiestnenie nad tmavšiu časť fotky), cieľ jas < 60/255 najviac 10 % obrazovky a kontrast textu ≥ 4,5 : 1 (zmeraj). Svetlé sekcie pod filmom ostávajú (majiteľ nechce tmavé plochy). Zmeraj pred/po (nástroje ${F2}/kp, ${F2}/oprava/m), nové hárky ${OUT}/harok-telefon.jpg a harok-320.jpg – OTVOR ich. Commit „Stavebniny Richtárik: film bez zastavenia na konci a ostrý posledný záber“ (bez podpisov). Zapíš ${OUT}/odovzdavka.md.`, { label: 'doladenie', phase: 'Doladenie', schema: ODOV, effort: 'xhigh' })
if (!O) return { stav: 'ZLYHALO', dovod: 'doladenie' }

phase('Kontrola')
const k = await agent(`${KONTEXT}\n\nROLA: nezávislý kontrolór plynulosti a vzhľadu (nič v strome nemeníš; súbory len v ${OUT}/kp/). Porty 9010–9019. Odovzdávka ${O.subor}. Telefón 390×844 DPR 3 (CPU 4×), 360×780, 320×568, počítač 1440×900: prvý aj ďalšie prejazdy dopredu a dozadu – dlhé snímky (rAF + Long Animation Frames), najmä na konci filmu; ostrosť poslednej pokojovej snímky (OTVOR výrez 100 %); tmavé plochy (jas < 60) pri 320 px na začiatku a kontrast textu; nič iné sa nezhoršilo (CLS 0, čierne riadky/stĺpce 0, reduced-motion, bez JS, podstránky). Zapíš ${OUT}/kontrola.md.`, { label: 'kontrola', phase: 'Kontrola', schema: NAL, effort: 'high' })
const vazne = ((k && k.nalezy) || []).filter((n) => n.zavaznost !== 'drobna')
let O2 = null
if (vazne.length) {
  O2 = await agent(`${KONTEXT}\n\nROLA: senior front-end (jediný zapisovateľ). Porty 9000–9009. Oprav vážne a stredné nálezy (${k.subor}); zopakuj merania; commit bez podpisov. Zapíš ${OUT}/oprava.md.\n${JSON.stringify(vazne).slice(0, 8000)}`, { label: 'oprava', phase: 'Kontrola', schema: ODOV, effort: 'high' })
}

phase('Skeptik')
const VS = { type: 'object', properties: { poslat: { type: 'boolean' }, dovod: { type: 'string' }, pre_majitela: { type: 'string' }, otazky_pre_majitela: { type: 'array', items: { type: 'string' } }, nepotvrdene: { type: 'array', items: { type: 'string' } } }, required: ['poslat', 'dovod', 'pre_majitela', 'otazky_pre_majitela', 'nepotvrdene'] }
const sk = await agent(`${KONTEXT}\n\nROLA: skeptik. Tvrdenie: „Film sa na konci prvého prejazdu na telefóne (CPU 4×) už nezastaví (0 snímok nad 100 ms), končí na ostrom zábere, pri 320 px nie je za nadpisom tmavá plocha a text je čitateľný; nič iné sa oproti ${BAZA} nezhoršilo; commity bez podpisov.“ Podklady ${OUT}/. Over sám aspoň 8 tvrdení (porty 9020–9029, prehliadač najviac 6 min). Pri neistote poslat=false. pre_majitela: 3–5 viet bez žargónu. Zapíš ${OUT}/SKEPTIK.md.`, { label: 'skeptik', phase: 'Skeptik', schema: VS, effort: 'high' })
return { stav: sk ? (sk.poslat ? 'POSLAT' : 'NEPOSLAT') : 'BEZ_SKEPTIKA', skeptik: sk, O, k, O2 }
