export const meta = {
  name: 'richtarik-prijazd-ladenie',
  description: 'Stavebniny Richtárik: doladenie prototypu príjazdu podľa skeptika – farba auta k dvoru, zrkadlo, prechod do skutočnej fotky bez skoku pozadia, koniec na počítači; kontrola vzhľadu, najviac 1 ďalšia oprava',
  phases: [
    { title: 'Ladenie', detail: 'oprava S1 farba, zrkadlo, prechod, počítač' },
    { title: 'Kontrola', detail: 'vzhľad so snímkami a videom; 1 kolo opráv' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const R = SP + '/richtarik'
const STROM = SP + '/hs-richtarik-prijazd'
const OUT = R + '/prijazd'
const KONTEXT = `KONTEXT: web STAVEBNINY RICHTÁRIK, prototyp príjazdu auta v úvode (strom ${STROM}, vetva richtarik-prijazd, HEAD 311ff2a; odovzdávka ${OUT}/odovzdavka.md, opravy ${OUT}/oprava-1.md, kontroly ${OUT}/kontrola-vzhlad-*.md a kontrola-kod-*.md, skeptik ${OUT}/SKEPTIK.md, skripty ${OUT}/praca/ a ${R}/uvod/praca/). Majiteľ už dostal video z telefónu a náhľad; teraz ide o doladenie pred jeho hodnotením. Zadanie majiteľa: ${R}/uvod/BRIEF-MAJITELA.md („auto vchádza do predajne“, maximálna ostrosť a presnosť).
Pravidlá: jediný zapisovateľ v ${STROM} je ladič; commity len lokálne, po slovensky, bez podpisov a bez zmienky o AI; NIKDY push, merge, reset --hard, rm -rf mimo dočasných priečinkov. Animácia len transform/opacity, žiadne JS zápisy na snímku, telefón bez videa, CLS 0, reduced-motion statická fotka, prvá obrazovka telefónu ≤ 650 kB. Snímky obrazovky súkromných e-mailov (PNG) nikdy nepoužívať. Každé tvrdenie dolož príkazom, cestou:riadkom alebo snímkou, ktorú si OTVORIL nástrojom Read. Po slovensky so správnou diakritikou. Playwright: createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers; server python3 -I -m http.server <port> --bind 127.0.0.1 --directory ${STROM}, stránka /stavebniny-richtarik/. Prehliadač najviac 10 min naraz. Disk má ~1,5 GB: dočasné veci nad 50 MB zmaž.`
const ODOV = { type: 'object', properties: { zhrnutie: { type: 'string' }, commity: { type: 'array', items: { type: 'string' } }, merania: { type: 'array', items: { type: 'string' } }, nedokoncene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'commity', 'merania', 'nedokoncene', 'subor'] }
const KONTR = { type: 'object', properties: { ok: { type: 'boolean' }, verdikt: { type: 'string' }, nalezy: { type: 'array', items: { type: 'object', properties: { zavaznost: { type: 'string', enum: ['vazna', 'stredna', 'drobna'] }, nazov: { type: 'string' }, dokaz: { type: 'string' }, navrh: { type: 'string' } }, required: ['zavaznost', 'nazov', 'dokaz', 'navrh'] } }, pre_majitela: { type: 'string' }, subor: { type: 'string' } }, required: ['ok', 'verdikt', 'nalezy', 'pre_majitela', 'subor'] }
const ULOHY = `1) S1 farba: výrez auta je modrastý (B−R +63) na teplom štrku (−8) – auto stálo v tieni pod modrou oblohou, podklad je na slnku. Zjednoť tak, aby auto patrilo do dvora a prechod do skutočnej fotky nebol skok farby: buď teplejší výrez a rovnaký posun na skutočnej koncovej fotke u2 (oba rovnako), alebo prechod farby počas dojazdu (opacity medzi dvoma verziami výrezu). Zmeraj B−R auta, štrku a paliet pred/po (PIL) na snímke v 3,0 s a na koncovom zábere. 2) Zelený chumáč na kĺbe ľavého zrkadla (SKEPTIK.md, sk/z200-zrkadlo-4000.png) – odstráň z masky, over pri 200 %. 3) Telefón: pri prelínaní do skutočnej fotky sa mení pozadie – nech sa prelína len auto a jeho okolie bez skoku (napr. koncová fotka orezaná a zarovnaná tak, aby podklad zostal rovnaký, alebo prelínanie dlhšie s maskou), over snímky 4,8–5,6 s po 0,1 s. 4) Počítač 1440×900: auto zastaví malé uprostred cesty a potom je 0,6 s dvojexpozícia dvoch áut (site.css:177) – auto má na konci dôjsť tak blízko a tak veľké, aby nápis STAVEBNINY RICHTÁRIK bol čitateľný nad textom, a prechod bez dvojexpozície. 5) Nová nahrávka MP4 telefón aj počítač (8 s, H.264, ≤ 6 MB) a pásy ${OUT}/pas-telefon.jpg, pas-pocitac.jpg (prepíš), testy z ${OUT}/praca (CLS, rAF, bajty, reduced-motion).`

phase('Ladenie')
const A = await agent(`${KONTEXT}\n\nROLA: senior compositor a front-end (jediný zapisovateľ). Porty 8900–8909. Úlohy:\n${ULOHY}\nCommit(y). Zapíš ${OUT}/ladenie-1.md a cestu vráť v poli subor.`, { label: 'ladenie', phase: 'Ladenie', schema: ODOV, effort: 'high' })
if (!A) return { stav: 'ZLYHALO', dovod: 'ladenie nedobehlo' }
let kolo = 1, k
while (true) {
  phase('Kontrola')
  k = await agent(`${KONTEXT}\n\nROLA: kreatívny riaditeľ (nezávislý, nič nemeníš). Kolo ${kolo}. Ladenie ${A.subor}${kolo > 1 ? ` a ${OUT}/ladenie-2.md` : ''}. Porty 8910–8919. Vlastné snímky telefón 390×844 DPR 3 a počítač 1440×900 v 12 časoch 0–7 s a výrez pri 200 % v 3 časoch; vytiahni snímky z nových MP4 (ffmpeg) – OTVOR všetko Read. Over body 1–4 z úloh (${ULOHY.slice(0, 200)}…): farba auta voči dvoru a koncovej fotke (zmeraj B−R), zrkadlo, skok pozadia pri prelínaní, koniec na počítači, dvojexpozícia. Verdikt „poslať majiteľovi“ / „ešte opraviť“. pre_majitela: 3–4 vety bez žargónu, čo uvidí. Zapíš ${OUT}/ladenie-kontrola-${kolo}.md.`, { label: `kontrola:vzhľad:${kolo}`, phase: 'Kontrola', schema: KONTR, effort: 'high' })
  if (!k) return { stav: 'NEOVERENE', A }
  const vazne = k.nalezy.filter((n) => n.zavaznost === 'vazna')
  if (!vazne.length || kolo >= 2) break
  const op = await agent(`${KONTEXT}\n\nROLA: senior compositor (jediný zapisovateľ). Porty 8920–8929. Oprav vážne nálezy z ${k.subor}; čo nie je skutočné, dokáž snímkou. Nové MP4 a pásy (prepíš). Commit. Zapíš ${OUT}/ladenie-2.md.\nNÁLEZY:\n${JSON.stringify(vazne).slice(0, 8000)}`, { label: 'oprava ladenia', phase: 'Kontrola', schema: ODOV, effort: 'high' })
  if (!op) return { stav: 'ZLYHALO', dovod: 'oprava nedobehla', k }
  kolo++
}
return { stav: k.nalezy.some((n) => n.zavaznost === 'vazna') ? 'ESKALACIA' : 'PASS', kontrola: k, A }
