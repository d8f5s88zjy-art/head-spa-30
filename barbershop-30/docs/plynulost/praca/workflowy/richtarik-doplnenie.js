export const meta = {
  name: 'richtarik-doplnenie-a-ladenie',
  description: 'Stavebniny Richtárik: doplnenie skutočného tovaru na fotky webu (kópie vlastných paliet) ‖ doladenie príjazdu auta; kontrola realizmu, zladenie do webu, nové snímky a video',
  phases: [
    { title: 'Práca', detail: '3 retušéri (skupiny fotiek) ‖ ladenie príjazdu' },
    { title: 'Kontrola', detail: 'realizmus každej fotky pri 100/200 %; 1 kolo opráv' },
    { title: 'Zladenie', detail: 'exporty z doplnených fotiek, build, testy, video, hárok pred/po' },
    { title: 'Záver', detail: 'nezávislá kontrola vzhľadu celku' },
  ],
}
const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const R = SP + '/richtarik'
const STROM = SP + '/hs-richtarik-prijazd'
const WEB = STROM + '/stavebniny-richtarik'
const FOTKY = R + '/podklady/fotky-majitel'
const DOPL = R + '/podklady/doplnene'
const D = R + '/doplnenie'
const P = R + '/prijazd'
const SPOL = `KONTEXT: web STAVEBNINY RICHTÁRIK (Nitra). Strom ${STROM} (git worktree vetvy richtarik-prijazd, HEAD 311ff2a: úvod zo skutočných fotiek + prototyp príjazdu auta). Obrazové linky: ${R}/uvod/praca/fotky.py (zoznam POLOZKY: originál → orez → exporty AVIF/WebP do img/uvod/) a ${P}/praca/prijazd-export.py (podklad cesty 3a5b1dd2 a výrez auta 3bd2f79b). Originály: ${FOTKY}/ (inventár ${R}/uvod/inventar-1..3.md). Zadanie a zásady doplnenia: ${D}/ZADANIE.md (prečítaj celé). Zadanie úvodu: ${R}/uvod/BRIEF-MAJITELA.md.
Pravidlá: commity len lokálne, po slovensky, bez podpisov a bez zmienky o AI; NIKDY push, merge, reset --hard, rm -rf mimo dočasných priečinkov. Každé tvrdenie dolož príkazom, cestou:riadkom alebo snímkou, ktorú si OTVORIL nástrojom Read. Po slovensky so správnou diakritikou. Python 3 s PIL 12; výrezy: pip install --user rembg onnxruntime opencv-python-headless (model isnet-general-use sa stiahne do ~/.rembg; po skončení ho zmaž: rm -rf ~/.rembg ~/.u2net a pip cache purge); Playwright createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers; server python3 -I -m http.server <port> --bind 127.0.0.1 --directory ${STROM}. Disk má ~1,4 GB – pracovné súbory nad 50 MB maž priebežne.`
const ODOV = { type: 'object', properties: { zhrnutie: { type: 'string' }, vystupy: { type: 'array', items: { type: 'string' } }, merania: { type: 'array', items: { type: 'string' } }, nedokoncene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'vystupy', 'merania', 'nedokoncene', 'subor'] }
const HOD = { type: 'object', properties: { fotky: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, realizmus: { type: 'integer', minimum: 0, maximum: 10 }, verdikt: { type: 'string', enum: ['pouzit', 'opravit', 'nepouzit'] }, chyby: { type: 'string' } }, required: ['id', 'realizmus', 'verdikt', 'chyby'] } }, subor: { type: 'string' } }, required: ['fotky', 'subor'] }

const SKUPINY = [
  { id: 'A', fotky: ['c4d64dbd', '29c67901', 'a5ee01ec', 'eb67a496'], popis: 'úvod (zábery u1, u3, u4 na telefóne aj počítači)', porty: '8930–8934' },
  { id: 'B', fotky: ['3a5b1dd2', '57796619', 'c344d317'], popis: 'podklad príjazdu (cesta MUSÍ ostať voľná, dopĺňať len po bokoch a v diaľke) a široké zábery dvora (pás Sklad a doprava, kontakt)', porty: '8935–8939' },
  { id: 'C', fotky: ['197d110d', '69dcf853', 'd79d0429', 'da4bb0c9'], popis: 'pás Plná zásoba (tehly, Porfix, Stadreko, rezivo) – doplniť len tam, kde je v oreze z fotky.py prázdne miesto alebo štrk', porty: '8940–8944' },
]
const retus = (s, extra) => agent(`${SPOL}\n\nROLA: senior retušér a compositor, skupina ${s.id}: ${s.popis}. Fotky: ${s.fotky.map((f) => f + '.jpg').join(', ')}. Pre každú: otvor originál Read, zisti orez, ktorý z nej web používa (fotky.py POLOZKY alebo prijazd-export.py), nájdi v ňom prázdne miesta, kde by tovar na dvore stavebnín prirodzene stál, a doplň ich kópiami skutočných paliet z fotiek majiteľa (výrez rembg/GrabCut zo zdrojovej fotky s podobným svetlom a uhlom; mierka podľa hĺbky, kontaktný tieň, farba a zrno zladené, žiadne zrkadlenie nápisov, žiadne opakovanie toho istého stohu vedľa seba). Cieľ: dvor pôsobí plne naskladnený, ale stále prirodzene a ostro. Výstup: ${DOPL}/<id>.jpg (plné rozlíšenie, JPG q95, ICC z originálu), porovnanie ${D}/porovnanie-<id>.jpg (originál | doplnené, šírka 2400 px) a výrezy 200 % z 2 miest vloženia ${D}/detail-<id>-1.png, -2.png; OTVOR ich Read a oprav, čo vidíš (aura, plávajúca paleta, iná ostrosť, tieň iným smerom). Skript ulož do ${D}/praca/doplnenie-${s.id}.py (opakovateľný). Zapíš do ${D}/DOPLNENE-${s.id}.md, čo kde pribudlo a odkiaľ.${extra || ''}`, { label: `retuš ${s.id}`, phase: 'Práca', schema: ODOV, effort: 'high' })
const hodnot = (s, r, kolo) => agent(`${SPOL}\n\nROLA: fotoeditor-kontrolór realizmu (nezávislý, nič nemeníš). Kolo ${kolo}, skupina ${s.id}. Podklady ${r.subor}. Pre každú fotku ${s.fotky.join(', ')}: otvor Read originál, ${DOPL}/<id>.jpg (zmenšené na 1600 px aj výrezy 100 % a 200 % z každého vloženého miesta – urob si ich PIL) a porovnanie. Hodnoť tvrdo ako art director, ktorý pozná fotomontáže: perspektíva a mierka, tiene a smer svetla, kontaktné tiene, okraje, zrno/ostrosť, opakovanie rovnakých stohov, logika skladu (či by tam naozaj mohol stáť tovar), čitateľnosť nápisov (nezrkadlené). Daj realizmus 0–10 a verdikt pouzit (≥ 8 a nič nekričí) / opravit / nepouzit. Zapíš ${D}/kontrola-${s.id}-${kolo}.md.`, { label: `kontrola ${s.id}:${kolo}`, phase: 'Kontrola', schema: HOD, effort: 'high' })

const ULOHY_LADENIE = `1) S1 farba: výrez auta je modrastý (B−R +63) na teplom štrku (−8) – auto stálo v tieni. Zjednoť tak, aby auto patrilo do dvora a prechod do skutočnej koncovej fotky u2 nebol skok farby (rovnaký teplejší posun výrezu aj u2, alebo prechod farby počas dojazdu). Zmeraj B−R auta, štrku a paliet pred/po. 2) Zelený chumáč na kĺbe ľavého zrkadla (${P}/SKEPTIK.md, ${P}/sk/z200-zrkadlo-4000.png) – odstráň z masky, over pri 200 %. 3) Telefón: pri prelínaní do skutočnej fotky sa mení pozadie – vyhlaď (dlhšie prelínanie s maskou okolo auta alebo zarovnanie), over snímky 4,8–5,6 s po 0,1 s. 4) Počítač 1440×900: auto zastaví malé uprostred cesty a potom je 0,6 s dvojexpozícia (site.css:177) – auto má dôjsť tak blízko, aby nápis STAVEBNINY RICHTÁRIK bol čitateľný nad textom, a prechod bez dvojexpozície. NEMEŇ podklad cesty (img/uvod/prijazd-podklad-*): ten sa po doplnení tovaru vymení v kroku zladenia.`

phase('Práca')
const [retusy, ladenie] = await Promise.all([
  parallel(SKUPINY.map((s) => () => retus(s))),
  agent(`${SPOL}\n\nROLA: senior compositor a front-end, JEDINÝ zapisovateľ v ${STROM} v tejto fáze (retušéri píšu len do ${DOPL} a ${D}). Porty 8900–8909. Úlohy:\n${ULOHY_LADENIE}\nCommit(y) po slovensky. Zapíš ${P}/ladenie-1.md a cestu vráť v poli subor.`, { label: 'ladenie príjazdu', phase: 'Práca', schema: ODOV, effort: 'high' }),
])
log(`Retuš: ${retusy.filter(Boolean).length}/3 skupín; ladenie: ${ladenie ? 'hotové' : 'ZLYHALO'}`)

phase('Kontrola')
const hodnotenia = []
for (let i = 0; i < SKUPINY.length; i++) {
  const s = SKUPINY[i]
  let r = retusy[i]
  if (!r) { hodnotenia.push({ s, h: null }); continue }
  let h = await hodnot(s, r, 1)
  const zle = h ? h.fotky.filter((f) => f.verdikt !== 'pouzit') : []
  if (h && zle.length) {
    const r2 = await retus(s, `\n\nOPRAVA (kolo 2): kontrolór ${h.subor} vrátil tieto fotky: ${JSON.stringify(zle).slice(0, 4000)}. Oprav len ich; ak sa realizmus ≥ 8 nedá dosiahnuť, menej doplň (radšej menej a ostro než veľa a falošne) a napíš to.`)
    if (r2) { r = r2; h = await hodnot(s, r2, 2) }
  }
  hodnotenia.push({ s, h })
}
const pouzit = hodnotenia.flatMap((x) => (x.h ? x.h.fotky.filter((f) => f.verdikt === 'pouzit').map((f) => f.id) : []))
log(`Doplnené fotky schválené na použitie: ${pouzit.join(', ') || 'žiadna'}`)

phase('Zladenie')
const zl = await agent(`${SPOL}\n\nROLA: senior front-end a obrazová linka, jediný zapisovateľ v ${STROM}. Porty 8950–8959. Ladenie príjazdu: ${ladenie ? ladenie.subor : 'NEDOBEHLO – nerob jeho úlohy'}. Schválené doplnené fotky (len tieto!): ${pouzit.join(', ') || 'žiadne'} (súbory ${DOPL}/<id>.jpg; kontroly ${hodnotenia.map((x) => x.h && x.h.subor).filter(Boolean).join(', ')}). 1) Uprav fotky.py a prijazd-export.py tak, aby pre schválené id brali ${DOPL}/<id>.jpg namiesto originálu (premenná, jedno miesto, komentár), spusti ich, skontroluj, že orezy a rozmery sedia s predošlými exportmi (rovnaké názvy, rovnaké rozmery). 2) python3 -B build.py, diff mimo index.html prázdny. 3) Ak sa zmenil podklad príjazdu, over, že auto stále ide po voľnej ceste a zastaví na tom istom mieste. 4) Testy z ${P}/praca (CLS 0, 0 videí, rAF, bajty prvej obrazovky telefónu ≤ 650 kB). 5) Nové MP4 (telefón aj počítač, 8 s, ≤ 6 MB) do ${P}/video/ a pásy ${P}/pas-telefon.jpg, pas-pocitac.jpg (prepíš); hárok pred/po pre majiteľa ${D}/pred-po-tovar.jpg (PIL, šírka 2400 px: pre každú schválenú fotku originálny orez webu | doplnený orez, s popiskom, max 6 riadkov). 6) img/FOTKY.md: doplň vetu, že na fotkách dvora bol doplnený tovar kópiami paliet z fotiek predajne. Commit „Stavebniny Richtárik: plnší sklad na fotkách dvora“. Zapíš ${D}/zladenie.md.`, { label: 'zladenie', phase: 'Zladenie', schema: ODOV, effort: 'high' })
if (!zl) return { stav: 'ZLYHALO', dovod: 'zladenie nedobehlo', retusy, ladenie, hodnotenia: hodnotenia.map((x) => x.h) }

phase('Záver')
const K = { type: 'object', properties: { ok: { type: 'boolean' }, verdikt: { type: 'string' }, nalezy: { type: 'array', items: { type: 'string' } }, pre_majitela: { type: 'string' }, subor: { type: 'string' } }, required: ['ok', 'verdikt', 'nalezy', 'pre_majitela', 'subor'] }
const zaver = await agent(`${SPOL}\n\nROLA: kreatívny riaditeľ (nezávislý, nič nemeníš). Porty 8960–8969. Podklady ${zl.subor}, ${ladenie ? ladenie.subor : ''}, hárok ${D}/pred-po-tovar.jpg, pásy a MP4 v ${P} (vytiahni snímky ffmpeg). Sprav vlastné snímky telefón 390×844 DPR 3 a počítač 1440×900 v 8 časoch 0–8 s a zoskroluj na pás Plná zásoba a Sklad a doprava; OTVOR všetko Read. Posúď: pôsobí dvor plne naskladnený a pritom pravdivo (žiadna zjavná montáž), je príjazd plynulý a farebne zladený, zrkadlo čisté, prechod bez skoku, počítač s čitateľným nápisom. Verdikt „poslať majiteľovi“ / „ešte opraviť“ a zoznam nálezov. pre_majitela: 4–5 viet bez žargónu. Zapíš ${D}/ZAVER.md.`, { label: 'záverečná kontrola', phase: 'Záver', schema: K, effort: 'high' })
return { stav: zaver ? (zaver.ok ? 'PASS' : 'NALEZY') : 'BEZ_ZAVERU', zaver, pouzit, zladenie: zl.subor, ladenie: ladenie && ladenie.subor, hodnotenia: hodnotenia.map((x) => x.h && { subor: x.h.subor, fotky: x.h.fotky }) }
