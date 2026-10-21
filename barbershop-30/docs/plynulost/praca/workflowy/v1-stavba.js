export const meta = {
  name: 'barbershop-v1-ziadne-cierne-polia',
  description: 'Ľahký telefón V1+V4+V6a: LQIP pod každou fotkou, WebP pred AVIF na telefóne, plagáty z náhľadov, bez videí na telefóne, kontrola kód+vzhľad, meranie, opravy, skeptik',
  phases: [
    { title: 'Stavba', detail: 'V1 (bez V1f), V4 v hs-lahky, test po každom commite' },
    { title: 'Kontrola', detail: 'kód ‖ vzhľad, potom meranie bez súbežnej záťaže' },
    { title: 'Opravy', detail: 'najviac 2 kolá' },
    { title: 'Skeptik', detail: 'vyvrátenie pred náhľadom pre majiteľa' },
  ],
}

const SP = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad'
const LT = SP + '/barber/lahky-telefon'
const V2 = LT + '/v2'
const STROM = SP + '/hs-lahky'
const D1 = SP + '/hs-pred-d1'
const OUT = V2 + '/stavba-v1'
const ZAKLAD = args && args.zaklad ? args.zaklad : 'f624ee8'

const KONTEXT = `PROJEKT: web BARBERSHOP 30 (Nitra), statický web barbershop-30/. Pracovný strom ${STROM} (git worktree, vetva barbershop-lahky-telefon, HEAD ${ZAKLAD} = ľahký režim lite L1–L6 po kontrole). Porovnávací strom D1 (len čítať): ${D1}. Iné stromy v ${SP} NEMEŇ.
MAJITEĽ (21. 10. 2026, iPhone 430×932): stále čierne obrazovky, horšia plynulosť, žiadne čierne polia ani okná, celé fotky, bez videí na telefóne (rozmazané, sekajú), filmové prechody, asistent, zákaznícka karta. Táto dávka rieši len V1 + V4. V6a–V6e (vernosť, pätička, assets/vernost.js, vernost/) robí súbežne vetva barbershop-vernost v inom strome – vernost.js, vernost/ ani pätičku NEMEŇ (pätičku rieši V6a inde). V2 (celá fotka) a V3 (prechody) čakajú na voľbu majiteľa – NEROB ich. V1f (vypnutie priblíženia --sp na lite) NEROB (ide spolu s V3).
PLÁN: ${V2}/PLAN-TELEFON-V2.md – časti „1. Pravidlá stavby“, „V1“, „V4“, s úpravami ${V2}/REVIZIA-PO-SKEPTIKOVI.md (má prednosť). Podklady: ${V2}/diagnoza.md (P1–P10), ${V2}/pohyb.md časť 3.4 (LQIP ako okolie), ${V2}/vernost.md časť 4 (V6a). Hotové LQIP náhľady: ${V2}/lqip/lqip.json (48 fotiek, data:image/webp;base64, 24 px, ~400 B) – vytvorené z assets/img/film/*-1086.webp, *-m-1086.webp, galeria-*-640.webp, video/*-poster-*.webp, img/*-640.webp (kľúč = cesta relatívna k barbershop-30/).
PRAVIDLÁ: commity len lokálne v ${STROM}, po slovensky, bez podpisov a bez zmienky o AI; jeden commit na V1 a jeden na V4; NIKDY git push, merge, reset --hard, checkout ., rm -rf mimo dočasných priečinkov; nič nenasadzovať. Počítač (1440×900, aj 700×900 s myšou) musí ostať bez zmeny vzhľadu a správania (film, videá, hĺbkové mapy ostávajú pre počítač). Každé tvrdenie podlož príkazom s výstupom alebo súbor:riadok. Servery na pridelených portoch, pred testom over title (curl -s http://127.0.0.1:<port>/barbershop-30/ | grep -o '<title>[^<]*'), po sebe ukonči. Playwright: createRequire('/opt/node22/lib/node_modules/'), Chromium /opt/pw-browsers; nič neinštaluj. Porty 8600–8619 sú vyhradené meraniu – nepoužívaj ich mimo kroku merania. Dočasné súbory nad 50 MB zmaž (df -h / pred veľkým zápisom). Po slovensky so správnou diakritikou.
ROZPOČET: index.html má dnes 16 477 B gzip (rozpočet 14 600 B už prekračuje vetva lite – rozhodnutie o rozpočte je otvorené); LQIP pridá ≈ 4 kB gzip – zapíš presné čísla pred a po do odovzdávky, nehľadaj úspory na úkor čitateľnosti.`

const ODOVZDAVKA = { type: 'object', properties: { zhrnutie: { type: 'string' }, commity: { type: 'array', items: { type: 'object', properties: { hash: { type: 'string' }, sprava: { type: 'string' } }, required: ['hash', 'sprava'] } }, testy: { type: 'array', items: { type: 'object', properties: { prikaz: { type: 'string' }, vysledok: { type: 'string' } }, required: ['prikaz', 'vysledok'] } }, nedokoncene: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['zhrnutie', 'commity', 'testy', 'nedokoncene', 'subor'] }

phase('Stavba')
const A = await agent(`${KONTEXT}\n\nSi senior staviteľ (výkon webu na iPhone/Safari, WebKit). Porty 8620–8629. Dva commity v poradí:\n1) V1: (a) LQIP pod každou z 9 záloh titulných kariet (.film-still) ako --nahlad data URI z lqip.json pre správny súbor (-m pre telefón, na šírku pre počítač ak CSS používa náhľad aj tam – rozhodni podľa style.css P11 a pravidla :1148–1150, ktoré dnes platí len pre [data-pro]; na lite musí platiť pre všetky karty) tak, aby pod fotkou nikdy nebola plochá farba --ink-2, ale rozmazaný náhľad tej istej scény; (b) rámiky galérie a okná videí: background-image z LQIP (style.css ~387–394 a ~806–808), nie ink; (c) na telefóne WebP pred AVIF: v telefónnych <source media="(max-width: 720px)"> prehodiť poradie (WebP prvý) alebo AVIF vynechať, rovnako preload v hlavičke VYMENIŤ na .webp (nie pridať – inak dvojité sťahovanie); zmenu urob v zdroji source/tools/stills.py a index.html zhodne (over diff generátora); lightbox data-lightbox-src .jpg nechaj, ak nemáš webp rovnakého rozmeru; (d) nič z V1f (priblíženie ostáva).\n2) V4: na lite žiadne videá: slucky() → [] v lite (app.js ~902), okno „Tím v akcii“ bez play() a bez sťahovania (plagát z LQIP alebo data-poster .webp ako statický obrázok), karta Tím = fotka sala-rano s normálnym prelínaním; <video> prvky v HTML ostávajú pre počítač; kritérium: v lite 0 požiadaviek na assets/video/*.mp4|.webm a 0 hrajúcich videí.\nPo každom commite: app-smoke.mjs, i18n-test.mjs, karty-shot.mjs --lite a --only=desktop (prečítaj hlavičky, ako sa púšťajú; B30_PORT), plus vlastná sonda: telefón 390×844 a 430×932 DPR3 dotyk – prvá návšteva, reload pri 3000 px, /#tim, /#kontakt, skok z menu na Slow 4G, späť: 0 snímok > 90 % tmy po FCP a žiadna plocha jasu < 20 väčšia než lišta + spodné tlačidlo; všetkých 9 currentSrc .webp, 1 preload .webp, 0 .avif na telefóne; počítač 1440×900 a 700×900 s myšou: snímky úvodu + 3 kariet pixelovo zhodné s ${ZAKLAD}. Gzip index.html pred/po.\nOdovzdávku zapíš do ${OUT}/odovzdavka.md (čo, kde súbor:riadok, testy, čísla, čo ostalo) a cestu vráť v poli subor.`,
  { label: 'stavba:V1', phase: 'Stavba', schema: ODOVZDAVKA, effort: 'high' })
if (!A) return { stav: 'ZASTAVENE', dovod: 'stavba nedobehla (limit alebo chyba); necommitnuté zmeny v strome ostávajú', strom: STROM }

const NALEZY = { type: 'object', properties: { ok: { type: 'boolean' }, nalezy: { type: 'array', items: { type: 'object', properties: { zavaznost: { type: 'string', enum: ['vazna', 'stredna', 'drobna'] }, nazov: { type: 'string' }, dokaz: { type: 'string' }, navrh: { type: 'string' } }, required: ['zavaznost', 'nazov', 'dokaz', 'navrh'] } }, preslo: { type: 'array', items: { type: 'string' } }, subor: { type: 'string' } }, required: ['ok', 'nalezy', 'preslo', 'subor'] }

const kontrolaKod = (kolo) => agent(`${KONTEXT}\n\nSi senior kontrolór kódu (nezávislý, nič nemeníš). Kolo ${kolo}. Odovzdávka ${A.subor}${kolo > 1 ? `, opravy ${OUT}/oprava-*.md` : ''}. Diff: git -C ${STROM} diff ${ZAKLAD}..HEAD -- barbershop-30. Over: generátor stills.py vs index.html zhodné; LQIP pre správny súbor (nie cudzia scéna – porovnaj kľúč lqip.json s currentSrc karty), žiadny zvyšok --ink-2 pod zálohou na lite, preload vymenený (nie pridaný), počítač bez zmeny (diff CSS/JS mimo html.lite vetiev), V4 bez sťahovania videí v lite, prístupnosť (alt, aria, reduced motion), testy prejdú (spusti sám, porty 8640–8645), gzip index.html. Nálezy s dôkazom. Zapíš ${OUT}/kontrola-kod-${kolo}.md.`, { label: `kontrola:kod:${kolo}`, phase: 'Kontrola', schema: NALEZY, effort: 'high' })

const kontrolaVzhlad = (kolo) => agent(`${KONTEXT}\n\nSi senior kontrolór vzhľadu a funkcie v prehliadači (nezávislý, nič nemeníš). Kolo ${kolo}. Porty 8630–8639 (server pre ${STROM} a pre ${D1}). Telefón 390×844 a 430×932 (DPR 3, isMobile, hasTouch), Fast 4G aj Slow 4G, CPU 4×: (1) 6 scenárov (prvá návšteva, reload pri 3000 px, /#tim, /#kontakt, skok z menu, späť) – screencast/snímky v 0,3/0,8/1,5/3 s: 0 snímok > 90 % tmy po prvom vykreslení, žiadna plocha jasu < 20 väčšia než lišta + spodné tlačidlo (okrem pätičky), pod každou fotkou rozmazaný náhľad tej istej scény (nie cudzej) kým sa fotka nestiahne; (2) skrol 3 švihy + skok z menu s pasívnou sondou: 0 viditeľných neúplných fotiek; (3) galéria a okno videa pri Slow 4G: rámiky majú náhľad, nie ink; (4) 0 požiadaviek na video, 0 hrajúcich videí, karta Tím = fotka; (5) currentSrc .webp všade, preload 1× .webp; (6) počítač 1440×900 a 700×900 s myšou: úvod + 3 karty pixelovo vs ${ZAKLAD} (≤ 0,5 %), film beží, videá hrajú ako predtým. Snímky do ${OUT}/vzhlad-${kolo}/. Zapíš ${OUT}/kontrola-vzhlad-${kolo}.md.`, { label: `kontrola:vzhlad:${kolo}`, phase: 'Kontrola', schema: NALEZY, effort: 'high' })

const MERANIE = { type: 'object', properties: { ok: { type: 'boolean' }, tabulka: { type: 'string' }, splnene: { type: 'array', items: { type: 'string' } }, nesplnene: { type: 'array', items: { type: 'string' } }, podmienky: { type: 'string' }, subor: { type: 'string' } }, required: ['ok', 'tabulka', 'splnene', 'nesplnene', 'podmienky', 'subor'] }

const meranie = (kolo) => agent(`${KONTEXT}\n\nSi senior kontrolór merania (nezávislý, nič nemeníš). Kolo ${kolo}. Metóda a nástroje: ${LT}/stavba/meranie-1.md a ${LT}/stavba/meranie-1/ (prevezmi skripty), porty 8600–8619. NAJPRV ticho: timeout 2400 bash -c 'until [ "$(pgrep -c -f "headless_shell|chrome-linux/chrome")" = 0 ]; do sleep 30; done' (ak vyprší, meraj a zapíš záťaž), /proc/loadavg pred každou sériou. PRED = ${STROM} na ${ZAKLAD} (git worktree alebo git archive do dočasného priečinka, zmaž po meraní) vs PO = HEAD; striedavo, skrol 3×, ostatné 2×, medián; telefón 390×844 DPR3 CPU 4× (a 6× len skrol), Fast 4G a Slow 4G: podiel tmy v 3 s po FCP (6 scenárov), čas do prvej fotky s nadpisom, bajty prvej obrazovky a celej stránky (očakávané −4,6 MB bez videí), úloha snímky p95 a LoAF > 50 ms pri skrole (očakávané: nezhoršené, p95 ≤ 16,7 ms), neúplné fotky (pasívne) 0, požiadavky na video 0; počítač 1440×900 krátky skrol p95 nezhoršený. Tabuľka pred/po. Zapíš ${OUT}/meranie-${kolo}.md.`, { label: `kontrola:meranie:${kolo}`, phase: 'Kontrola', schema: MERANIE, effort: 'high' })

let kolo = 1
let kod, vzhlad, mer
const historia = []
while (true) {
  phase('Kontrola')
  ;[kod, vzhlad] = await parallel([() => kontrolaKod(kolo), () => kontrolaVzhlad(kolo)])
  mer = await meranie(kolo)
  const vazne = [
    ...((kod && kod.nalezy) || []).filter((n) => n.zavaznost === 'vazna').map((n) => ({ ...n, od: 'kod' })),
    ...((vzhlad && vzhlad.nalezy) || []).filter((n) => n.zavaznost === 'vazna').map((n) => ({ ...n, od: 'vzhlad' })),
    ...((mer && !mer.ok) ? mer.nesplnene.map((x) => ({ zavaznost: 'vazna', nazov: x, dokaz: mer.subor, navrh: '', od: 'meranie' })) : []),
  ]
  const chyba = [!kod && 'kód', !vzhlad && 'vzhľad', !mer && 'meranie'].filter(Boolean)
  historia.push({ kolo, vazne: vazne.length, chyba, kod: kod && kod.subor, vzhlad: vzhlad && vzhlad.subor, meranie: mer && mer.subor })
  if (chyba.length) { log(`Kolo ${kolo}: nedobehli kontrolóri ${chyba.join(', ')} – zastavujem (fail closed).`); return { stav: 'ZASTAVENE', dovod: `nedobehli kontrolóri: ${chyba.join(', ')}`, A, kod, vzhlad, mer, historia } }
  if (!vazne.length) break
  if (kolo >= 3) { log(`Po 2 kolách opráv ostáva ${vazne.length} vážnych nálezov – eskalácia.`); return { stav: 'ESKALACIA', vazne, A, kod, vzhlad, mer, historia } }
  phase('Opravy')
  const op = await agent(`${KONTEXT}\n\nSi senior opravár (jediný zapisovateľ v ${STROM}). Porty 8650–8659. Oprav vážne nálezy kola ${kolo} (kód: ${kod.subor}, vzhľad: ${vzhlad.subor}, meranie: ${mer.subor}); ak nález nepovažuješ za skutočný, dokáž to príkazom. Každá oprava vlastný commit + dotknuté testy. Nič mimo nálezov.\nVÁŽNE NÁLEZY:\n${JSON.stringify(vazne).slice(0, 12000)}\nZapíš ${OUT}/oprava-${kolo}.md.`, { label: `oprava:${kolo}`, phase: 'Opravy', schema: ODOVZDAVKA, effort: 'high' })
  if (!op) return { stav: 'ZASTAVENE', dovod: `oprava kola ${kolo} nedobehla`, vazne, historia }
  kolo++
}

const VERDIKT = { type: 'object', properties: { vyvratene: { type: 'boolean' }, dovod: { type: 'string' }, pre_majitela: { type: 'string' }, nepotvrdene: { type: 'array', items: { type: 'string' } } }, required: ['vyvratene', 'dovod', 'pre_majitela', 'nepotvrdene'] }

phase('Skeptik')
const sk = await agent(`${KONTEXT}\n\nSi skeptik. Tvrdenie: „Po V1+V4 (${STROM} HEAD) nie je na telefóne pod žiadnou fotkou, rámikom galérie ani oknom videa plochá tmavá plocha, telefón dostáva WebP, nesťahuje videá, počítač je nezmenený.“ Podklady ${OUT}/*.md a snímky. Over aspoň 5 tvrdení sám (kód, príkaz, snímka; porty 8660–8669, prehliadač len ak nikto nemeria). Pri neistote vyvratene=true. pre_majitela: 4–6 viet bez žargónu, vrátane toho, čo ostáva nepotvrdené bez jeho iPhonu. Zapíš ${OUT}/SKEPTIK.md.`, { label: 'skeptik', phase: 'Skeptik', schema: VERDIKT, effort: 'high' })

return { stav: sk ? (sk.vyvratene ? 'VYVRATENE' : 'PASS') : 'BEZ_SKEPTIKA', skeptik: sk, A, kod, vzhlad, mer, historia }
