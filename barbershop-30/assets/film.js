/* BARBERSHOP 30: prehliadka podniku ako film.
   Pozadie webu sú skutočné fotky podniku, nie vymodelovaná scéna. Každá fotka má hĺbkovú mapu,
   takže kamera sa v nej pohne ako v skutočnej miestnosti: kreslá a pult vpredu sa posúvajú viac
   ako stena za nimi. Pri skrolovaní ide kamera pomalým filmovým pohybom a medzi časťami webu sa
   zábery prelínajú. Fotky sa netónujú, pridá sa len vinetácia a krátke šero pri prelínaní.
   Film je iba pozadie: text, cenník a tlačidlá ostávajú v HTML nad ním.

   Rozhranie so stránkou (index.html + style.css):
   - kotvy <div class="film-shot" data-shot="meno" data-f="x,y" data-mv="in|right|left|rise|down|near"
     [data-fm="x,y" pre telefón] [data-place="popis miesta"]> v poradí dokumentu; v každej je statická
     záloha <picture class="film-still"> s <img width height> (z rozmerov sa berie pomer strán fotky).
     Záber je celý na obrazovke, keď je horný okraj kotvy (pri sticky/fixed kotve jej rodiča) na
     hornom okraji okna; medzi susednými kotvami sa zábery prelínajú v polovici vzdialenosti.
   - fotky: img/film/<meno>-{1086,1448,2172,2896}.{avif,webp} (+ -4096 pre fasádu) a pre telefón výrezy
     <meno>-m-{1086,1448}; k nim <meno>-hlbka.webp / <meno>-m-hlbka.webp vedľa tohto skriptu (data-tiers na kotve).
   - triedy na <html>: world (film sa použije), world-in (prvý snímok je nakreslený, zálohy zmiznú),
     world-off (film zlyhal alebo skončil, zálohy ostávajú). Keď stránka v hlavičke triedu world
     nedala, rozhodne sa tu podľa tých istých pravidiel (WebGL2, pohyb, dáta, výška, pamäť, jadrá).
     html[data-film="force"] (vývojová stránka) obíde rozhodovanie aj čakanie na pohyb návštevníka.
   - dosky s textom .board (a pätička): popis miesta vľavo dole sa ukazuje len tam, kde ich nie je.
   - úvod ako film (prológ): kotva úvodu má data-pro="meno" (+ data-pro-f, data-pro-fm, data-pro-mv,
     data-pro-size="ŠxV", data-pro-place). Keď stránka v hlavičke dala triedu pro (raz za návštevu, len
     s filmom, bez kotvy v adrese), film sa nečaká na pohyb návštevníka, začne záberom prológu (fasáda,
     kamera dôjde k dverám), cez šero prejde do záberu úvodu a odtiaľ už vedie skrolovanie. Prológ sa
     dá kedykoľvek preskočiť skrolovaním; bez triedy pro sa nič z toho nedeje.
   - data-size="ŠxV" na kotve: rozmery fotky záberu, keď ich nedáva <img> (viac záloh v kotve).
   - skutočné video ako záber (data-video="assets/video/meno-864", bez prípony; súbory .mp4 a .webm):
     data-video-mode="seq" (video rozložené na fotky po 0,1 s v priečinku data-video, f000.avif|webp…,
     počet data-video-n; skrol vyberá a prelína dve susedné snímky, plynulé pri 60 až 240 Hz), "play"
     (tichá slučka v čase, len kým je záber na obrazovke) alebo "scroll" (čas videa vedie skrolovanie;
     na telefóne pri posune trhané a pri zastavení stojí, preto ho web od 2026‑10‑11 nepoužíva), data-video-t="od,do" (sekundy súboru na celý
     pohyb záberu), data-video-size="864x1536", data-video-f="x,y" (bod záujmu vo videu),
     data-video-poster="assets/video/meno-poster-864" (+ .avif/.webp/.jpg; ukáže sa, kým video nemá
     snímku, a ostane, keď video nejde), data-video-fps (snímky za sekundu súboru, pre posun po snímkach),
     data-video-on="phone" (predvolené; na počítači je kotva bežný záber fotky z data-shot) alebo "all".
     Video nemá hĺbkovú mapu (rovina bez posunu popredia), prelína sa s fotkami tým istým prechodom.
     Súbor sa začne sťahovať až po prvom pohybe návštevníka a len blízko scény (keepAround).
   - data-cut="druh [smer] [a:x,y] [b:x,y] [m:…]" na kotve: strih z predchádzajúceho záberu do tohto
     (pohyb, svih, najazd, odjazd, popredie, prelinanie); bez atribútu platí tabuľka CUTS (časť Strihy).
   - window.BS30_FILM = { ready, shots, goTo(meno, t), state, cuts, cutFreeze(meno, mix), pause, dbg } na ladenie. */
(async function () {
  'use strict';
  const d = document, root = d.documentElement;
  const force = root.dataset.film === 'force';
  let readyDone;
  const api = {
    ready: new Promise((r) => { readyDone = r; }),       // true = prvý snímok, false = film nejde (world-off)
    shots: [],
    goTo() { return false; },
    proFreeze() { return false; },
    fadeFreeze() { return false; },
    get state() { return { on: false }; },
  };
  window.BS30_FILM = api;
  // film nejde (grafika, sieť, zariadenie): zálohy .film-still ostávajú, rozloženie stránky sa nemení
  const quit = () => { root.classList.add('world-off'); root.classList.remove('pro', 'outside'); readyDone(false); };

  /* ---------- či sa film vôbec použije ----------
     lacné podmienky rozhodne už skript v hlavičke stránky (trieda world), aby stránka mohla štýly
     prispôsobiť pred prvým vykreslením; keď to neurobil, rozhodne sa tu podľa rovnakých pravidiel.
     Grafickú kartu overí film až po prvom vykreslení (nižšie). */
  const filmOn = /[?&]film=on\b/.test(location.search);
  if (root.classList.contains('world-off')) return;
  if (!force && !root.classList.contains('world')) {
    const ok = 'WebGL2RenderingContext' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
      && !(navigator.connection && navigator.connection.saveData)
      && !matchMedia('(max-height: 500px)').matches
      && (navigator.deviceMemory || 8) >= 4 && (navigator.hardwareConcurrency || 8) >= 4;
    if (!ok) { quit(); return; }
    root.classList.add('world');
  } else if (force) root.classList.add('world');
  // pohyb návštevníka sa zapamätá už od začiatku: film bez prológu čaká naň (nižšie) a pohyb počas
  // načítania alebo overenia grafiky by sa inak stratil
  const INPUTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll', 'keydown'];
  let movedEarly = false;
  const markMove = () => { movedEarly = true; INPUTS.forEach((e) => removeEventListener(e, markMove)); };
  INPUTS.forEach((e) => addEventListener(e, markMove, { passive: true }));

  // adresa tohto skriptu (aj keď je načítaný ako modul, kde currentScript chýba): od nej sa odvíja vendor/ a img/film/
  const me = d.currentScript || d.querySelector('script[src$="film.js"],script[src*="film.js?"]');
  const here = (me && me.src) || location.href;
  if (d.readyState !== 'complete') await new Promise((r) => addEventListener('load', r, { once: true }));
  /* grafická karta: WebGL kontext vznikne až po prvom vykreslení stránky (pred ním by prehliadač štartoval
     grafiku a prvý obraz by prišiel o sekundu neskôr). Softvérové kreslenie (SwiftShader, llvmpipe) dá pokojnú
     verziu, film by sa tam trhal; záloha si nechá rámovanie prvého snímku filmu (world-frame), aby nič
     neposkočilo. ?film=on overenie vynechá a pri softvérovom kreslení film pustí (testy v prehliadači bez grafiky). */
  if (!force) {
    // prvé vykreslenie: záznam first-contentful-paint príde až keď je obraz naozaj na displeji (samotné
    // requestAnimationFrame nestačí, kontext by zdržal ešte rozpracovaný snímok); záloha po 3 s (skrytá karta)
    await new Promise((r) => {
      let t = 0;
      const fin = () => { clearTimeout(t); requestAnimationFrame(() => setTimeout(r, 50)); };
      const fcp = (list) => list.some((e) => e.name === 'first-contentful-paint');
      if (fcp(performance.getEntriesByType('paint'))) { fin(); return; }
      t = setTimeout(fin, 3000);
      try { const po = new PerformanceObserver((l) => { if (fcp(l.getEntries())) { po.disconnect(); fin(); } }); po.observe({ type: 'paint', buffered: true }); } catch (e) { /* bez Paint Timing čaká záloha */ }
    });
    let gpu = false;
    try {
      const c = d.createElement('canvas');
      const g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: !filmOn }) || (filmOn ? c.getContext('webgl2') : null);
      const ri = g && !filmOn && g.getExtension('WEBGL_debug_renderer_info');
      gpu = !!g && !(ri && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(g.getParameter(ri.UNMASKED_RENDERER_WEBGL) || ''));
      const x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
    } catch (e) { gpu = false; }
    if (!gpu) { root.classList.add('world-frame'); quit(); return; }
  }
  // prológ (úvod ako film) len keď návštevník naozaj stojí na začiatku stránky: obnovený scroll
  // uprostred stránky alebo skrytá karta ho zrušia a web sa správa ako bez neho
  const proEl = d.querySelector('.film-shot[data-pro]');
  let proArmed = root.classList.contains('pro') && !!proEl && scrollY < innerHeight * 0.25 && !d.hidden;
  if (!proArmed) root.classList.remove('pro');
  // prológ začína vždy z vrchu stránky (obnovený skrol o pár desiatok px by ho hneď zrušil)
  if (proArmed && scrollY > 0) jumpTo(0);
  // film sa spustí až keď sa návštevník pohne (dotyk, myš, skrolovanie, klávesnica); dovtedy drží
  // každé okno do filmu statická fotka (.film-still), takže nikde nie je prázdna plocha. Aby film
  // prišiel skoro aj po prvom švihu na telefóne, knižnica sa po načítaní stránky vo voľnej chvíli
  // len stiahne do vyrovnávacej pamäte (bez spustenia), až po chvíli, aby nebrzdila fotku úvodu.
  // S prológom sa nečaká: knižnica aj prvé dva zábery idú hneď po načítaní stránky (po jej prvom obraze).
  const src = new URL('vendor/three.module.min.js', here).href;
  const early = () => { fetch(src, { priority: 'low' }).catch(() => {}); };
  // videá vo filme sa sťahujú až po skutočnom pohybe návštevníka (meranie stránky bez pohybu ich nestiahne)
  let userMoved = force;
  if (!force && !proArmed) userMoved = true;                  // film bez prológu štartuje až po pohybe (nižšie)
  if (!force && !proArmed && !movedEarly) await new Promise((r) => {
    let t = 0;
    const go = () => { clearTimeout(t); INPUTS.forEach((e) => removeEventListener(e, go)); r(); };
    INPUTS.forEach((e) => addEventListener(e, go, { passive: true }));
    t = setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(early, { timeout: 3000 }); else early(); }, 4000);
  });
  const tStart = performance.now();
  let THREE;
  try { THREE = await import(src); } catch (e) { quit(); return; }

  // telefón podľa zariadenia (aj naležato), nie len podľa aktuálnej šírky okna
  const phone = matchMedia('(max-width: 720px)').matches || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 720);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // okamžitý skok bez plynulého skrolu z CSS (scroll-behavior: smooth); staré Safari nepozná 'instant'
  const jumpTo = (y) => { try { scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { const s = root.style.scrollBehavior; root.style.scrollBehavior = 'auto'; scrollTo(0, y); root.style.scrollBehavior = s; } };
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- zábery z kotiev v stránke ----------
     f  = bod záujmu na fotke (0 až 1, zľava a zhora), fm = to isté pre telefón (nepovinné)
     mv = pohyb kamery počas záberu: [x, y, z] na začiatku a na konci, v podieloch obrazu
          (x a y ako časť šírky a výšky záberu, z ako časť vzdialenosti; mínus z = nájazd)
     Jeden jednotný pohyb celého filmu: kamera ide stále pomaly dopredu s jemným bočným oblúkom
     okolo bodu záujmu (pozerá sa stále naň), popredie sa tak posúva voči stene ako pri skutočnej
     prechádzke podnikom. */
  const ARC = phone ? 0.02 : 0.04;                            // telefón: menší oblúk, výrez má blízke popredie
  const MOVES = {
    in: [[-ARC * 0.5, 0, 0.04], [ARC * 0.5, 0, -0.12]],
    right: [[-ARC, 0, 0.04], [ARC, 0, -0.12]],
    left: [[ARC, 0, 0.04], [-ARC, 0, -0.12]],
    rise: [[-ARC * 0.4, -ARC * 0.5, 0.04], [ARC * 0.4, ARC * 0.5, -0.12]],
    down: [[ARC * 0.4, ARC * 0.5, 0.04], [-ARC * 0.4, -ARC * 0.5, -0.12]],
    // len jemný nájazd: pokojný záber pod doskou s cenníkom
    near: [[-ARC * 0.5, 0, 0.02], [ARC * 0.5, 0, -0.03]],
    // prológ: chôdza z ulice k dverám, kamera ide dopredu o tretinu vzdialenosti (asi 1,5× priblíženie)
    door: [[-ARC * 0.3, 0, 0.05], [phone ? ARC * 0.3 : 0.15, 0, -0.34]],   // na počítači aj bokom k dverám (oko je pri okraji záberu zaseknuté)
    // záber z videa: pohyb robí kamera vo videu, film pridá len nepatrný nájazd a dýchanie
    still: [[0, 0, 0.01], [0, 0, -0.02]],
  };
  const pair = (v, dflt) => { const a = (v || '').split(/[\s,;]+/).map(parseFloat); return a.length === 2 && a.every(isFinite) ? [clamp(a[0], 0, 1), clamp(a[1], 0, 1)] : dflt; };

  /* ---------- strihy: každý prechod medzi miestnosťami má vlastný strih, ako od strihača ----------
     Všetky sú strihmi pohybom kamery, jeden vkus a jedna farebnosť: fotky sa netónujú, nikde záblesk,
     zrno ani farebný efekt; v mix 0 a 1 je obraz presne pôvodný a ostrý. Strih je len funkciou polohy
     v prechode (skrolovanie, v prológu čas), preto ide rovnako plynulo tam aj späť.
     Zápis: atribút data-cut na kotve prichádzajúceho záberu, inak tabuľka CUTS podľa dvojice záberov:
       "druh [smer] [a:x,y] [b:x,y] [m:druh] [m:smer] [ma:x,y] [mb:x,y]"
     smer = kam ide kamera (right, left, rise, down, in); a: bod na odchádzajúcej fotke, b: na prichádzajúcej
     (0 až 1 zľava a zhora); m… platí len pre telefón (výrez na výšku má predmety inde).
     - pohyb: pokračovanie pohybu; prichádzajúca kamera prevezme smer aj rýchlosť odchádzajúcej, nová
       miestnosť sa prelína zo strany, kam kamera ide (vzdialené skôr, blízke neskôr), ľahko rozmazaná pohybom
     - svih: švih kamery; obraz sa rozmaže v smere pohybu, strih padne do najväčšieho rozmazania a
       prichádzajúci záber zabrzdí z toho istého švihu
     - najazd: nájazd cez predmet; kamera vletí k bodu a:, rozmazanie zoomom okolo neho, nový záber
       sa otvorí z toho istého miesta a kamera v ňom dobehne k svojmu bodu b:
     - odjazd: nájazd pustený odzadu; kamera vycúva a starý záber sa stiahne do bodu b: (dvere)
     - popredie: kamera ide tesne popri blízkom predmete z hĺbkovej mapy; predmet (a: jeho hrana) sa priblíži
       k objektívu, neostrý a v tieni prejde cez obraz a za ním je už nová miestnosť. S bodom b: patrí
       predmet prichádzajúcemu záberu: prejde cez obraz a usadí sa na svojom mieste.
     - prelinanie: pôvodné prelínanie cez priestor (aj po skoku či pri čakaní na fotku) */
  const CUT_KINDS = { prelinanie: 0, pohyb: 1, svih: 2, najazd: 3, odjazd: 3, popredie: 4 };
  const CUT_DIRS = { right: [1, 0], left: [-1, 0], rise: [0, 1], up: [0, 1], down: [0, -1], in: [0, 0] };
  const CUTS = {
    'vstup>rohozka': 'najazd a:0.76,0.53 ma:0.50,0.53',                         // prológ: cez dvere dnu (von je to isté odzadu)
    'rohozka>sala': 'pohyb in',                                                // krok z rohožky dopredu do sály (telefón: do videa Poď ďalej)
    'sala>stol': 'popredie left a:0.27,0.55 m:prelinanie',                     // za operadlom kresla k pracovnému miestu; telefón: obe videá
                                                                               // sú jeden súvislý záber (0–5 s a 5–9,3 s), stačí prelínanie
    'stol>cakaren': 'svih right',                                              // od kresla švihom dozadu do čakárne
    'cakaren>sala-rano': 'popredie right b:0.30,0.62 m:rise mb:0.5,0.78',       // popri operadle do rannej sály
    'sala-rano>kreslo-stred': 'najazd a:0.635,0.56 b:0.5,0.45 ma:0.52,0.45',    // do kresla v sále, z neho na kreslo uprostred
    'kreslo-stred>kava': 'svih down',                                          // švih nadol na stolík s kávou
    'kava>sud': 'popredie left b:0.88,0.45 mb:0.78,0.4',                        // popri stĺpe do prednej sály
    'sud>vstup': 'odjazd b:0.76,0.53 mb:0.50,0.53',                            // von cez dvere na Mostnú
  };
  function parseCut(spec) {
    const gen = [], mob = [];
    for (const t of String(spec || '').trim().toLowerCase().split(/\s+/)) {
      if (/^m[ab]:/.test(t)) mob.push(t.slice(1)); else if (t.startsWith('m:')) mob.push(t.slice(2)); else if (t) gen.push(t);
    }
    const c = { name: '', k: 0, dir: [0, 0], a: null, b: null, own: '' };
    // telefón: jeho údaje prepíšu spoločné, nech sú v zápise kdekoľvek
    for (const t of phone ? gen.concat(mob) : gen) {
      if (t in CUT_KINDS) { c.name = t; c.k = CUT_KINDS[t]; }
      else if (CUT_DIRS[t]) c.dir = CUT_DIRS[t];
      else if (/^[ab]:/.test(t)) { c[t[0]] = pair(t.slice(2), null); c.own = t[0]; }
    }
    if (!c.name) return null;
    // strih odzadu: shader ho kreslí ako opačný strih (zábery vymenené, čas naspäť)
    c.rev = c.name === 'odjazd' || (c.k === 4 && c.own === 'b');
    return c;
  }
  // pomer strán fotky: z data-size="ŠxV", inak z width/height prvej zálohy <img> (zábery podniku sú 3 : 2)
  const ratio = (size, img) => {
    const a = (size || '').split(/[x×,\s]+/).map(parseFloat);
    if (a.length === 2 && a[0] > 0 && a[1] > 0) return a[0] / a[1];
    const w = img && parseFloat(img.getAttribute('width')), h = img && parseFloat(img.getAttribute('height'));
    return w > 0 && h > 0 ? w / h : 1.5;
  };
  // stupne šírky, ktoré pre záber existujú (data-tiers="1086,1448,2172"); bez údaju pôvodné tri
  const tiersOf = (v) => { const a = (v || '').split(/[\s,;]+/).map((x) => parseInt(x, 10)).filter((x) => x > 0); return a.length ? a.sort((p, q) => p - q) : [1086, 1448, 2172]; };
  /* telefón: každý záber má vlastný výrez na výšku (data-m="meno-m", data-m-size, data-m-tiers, bod záujmu
     data-fm vo výreze), takže sa na displeji nezväčšuje ako výsek z fotky na šírku. Bez výrezu sa berie
     fotka na šírku a data-fm je bod záujmu v nej. */
  const shotOf = (el, p) => {
    // p = '' pre záber kotvy, 'pro' pre záber prológu (atribúty data-pro-*)
    const g = (k) => el.dataset[p ? 'pro' + k[0].toUpperCase() + k.slice(1) : k];
    const f = pair(g('f'), [0.5, 0.5]), fm = pair(g('fm'), null), m = phone && g('m');
    return {
      at: el, photo: '', place: g('place') || '', f: m && fm ? fm : f, fm: m ? null : fm,   // photo doplní volajúci
      mv: MOVES[g('mv')] ? g('mv') : 'in',
      pa: m ? ratio(g('mSize'), null) : ratio(g('size'), el.querySelector('img')),
      tiers: tiersOf(m ? g('mTiers') : g('tiers')),
    };
  };
  // video ako záber: na telefóne (alebo všade pri data-video-on="all"); na počítači je kotva fotkou z data-shot
  const range = (v) => { const a = (v || '').split(/[\s,;]+/).map(parseFloat); return a.length === 2 && a.every(isFinite) && a[1] > a[0] ? a : null; };
  const videoOf = (el) => {
    const x = el.dataset;
    if (!x.video || !(phone || x.videoOn === 'all')) return null;
    const mode = x.videoMode === 'play' || x.videoMode === 'seq' ? x.videoMode : 'scroll';
    return { src: x.video, mode, t: range(x.videoT), poster: x.videoPoster || '', fps: parseFloat(x.videoFps) || 30, n: parseInt(x.videoN, 10) || 0 };
  };
  // kotva s data-desk="skip" má vlastný záber len na telefóne (video); na počítači ju film
  // preskočí a plynulo pokračuje zo susedného záberu, text karty sa vymení nad súvislým záberom
  const SHOTS = [...d.querySelectorAll('.film-shot[data-shot]')].filter((el) => phone || el.dataset.desk !== 'skip').map((el) => {
    const s = shotOf(el, '');
    s.photo = (phone && el.dataset.m) || el.dataset.shot;
    s.name = el.dataset.shot;                                // meno záberu bez výrezu (tabuľka strihov)
    const v = videoOf(el);
    if (v) {
      s.video = v; s.photo = el.dataset.shot + '-video';
      s.f = pair(el.dataset.videoF, [0.5, 0.5]); s.fm = null;
      s.pa = el.dataset.videoSize ? ratio(el.dataset.videoSize, null) : 0.5625;
      s.mv = MOVES[el.dataset.videoMv] ? el.dataset.videoMv : 'still';
    }
    // záloha ukazuje ten istý bod záujmu ako film (object-position cez vlastné premenné; výrez na
    // telefón má vlastné --fmx/--fmy zo stránky)
    const f = pair(el.dataset.f, [0.5, 0.5]);
    el.style.setProperty('--fx', (f[0] * 100).toFixed(1) + '%'); el.style.setProperty('--fy', (f[1] * 100).toFixed(1) + '%');
    return s;
  });
  if (!SHOTS.length) { quit(); return; }
  /* záber prológu: nemá vlastnú kotvu, stojí pred úvodom (index 0 v ceste, kotva jednu obrazovku nad
     začiatkom stránky), takže skrolovaním sa k nemu nedá vrátiť; po prológu sa uvoľní a už sa nekreslí */
  let PRO = null;
  if (proEl) {
    PRO = shotOf(proEl, 'pro');
    PRO.photo = (phone && proEl.dataset.proM) || proEl.dataset.pro;
    PRO.name = proEl.dataset.pro;
    PRO.pro = true;
    PRO.done = !proArmed;                                    // bez prológu sa nenačíta, kým ho návštevník nevyvolá
    SHOTS.unshift(PRO);
  }
  api.shots = SHOTS.map((s) => s.photo);

  /* ---------- renderer ---------- */
  const canvas = d.createElement('canvas');
  canvas.className = 'film-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  d.body.prepend(canvas);
  // prehliadka: nenápadný popis miesta vľavo dole, len tam kde film nezakrýva doska s textom
  const placeBox = d.createElement('div');
  placeBox.className = 'film-place'; placeBox.setAttribute('aria-hidden', 'true');
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const places = new Map(); SHOTS.forEach((s) => { if (s.place && !places.has(s.photo)) places.set(s.photo, s.place); });
  placeBox.innerHTML = '<b>Prehliadka podniku</b>' + [...places].map(([k, v]) => `<span data-p="${esc(k)}">${esc(v)}</span>`).join('');
  canvas.after(placeBox);
  // popis je vidieť, len kým ho celý odkrýva okno do filmu; doska s textom ho nikdy neprereže
  let placeNow = null, placeBand = [0, 0], bands = [];
  const measurePlace = () => { const r = placeBox.getBoundingClientRect(); placeBand = [r.top - 24, r.bottom + 24]; placeNow = -1; };
  const showPlace = (s) => {
    const y0 = sy + placeBand[0], y1 = sy + placeBand[1];
    const free = placeBand[1] > 0 && !bands.some((b) => b[0] < y1 && b[1] > y0);
    const key = s && s.place && free ? s.photo : null;
    if (key === placeNow) return;
    if (key) placeBox.querySelectorAll('span').forEach((e) => e.classList.toggle('on', e.dataset.p === key));
    placeNow = key;
    placeBox.classList.toggle('on', !!key);
  };
  let renderer;
  // bez prelínania sa záber kreslí rovno na obrazovku, preto aj ona má hĺbku (mriežka sa môže prekryť sama so sebou)
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); placeBox.remove(); quit(); return; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); canvas.remove(); placeBox.remove(); quit(); return; }
  // farby fotiek idú na obrazovku bez prepočtov, presne ako na fotke
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x0e0d0c, 1);                        // --ink
  // shadery sú hotové a overené; kontrola chýb by pri každom preklade čakala na grafiku (stovky ms na telefóne)
  renderer.debug.checkShaderErrors = false;
  // ostrosť: plné rozlíšenie displeja do 2x; pomalé zariadenie si ho samo zníži
  const DPR_MAX = Math.min(devicePixelRatio || 1, 2);          // 2x stačí (textúra výrezu 1448 px), 3x brzdilo slabšie telefóny
  const DPR_MIN = Math.min(DPR_MAX, 1);
  let dpr = DPR_MAX;

  const FOV = phone ? 50 : 38, DIST = 10;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const scene = new THREE.Scene();

  /* ---------- záber = fotka na mriežke, ktorú hĺbková mapa vytlačí k oku ---------- */
  // mriežka: na počítači bunka asi 7 px; na telefóne sú zábery výrezy na výšku, preto viac buniek
  // zvislo (bunka asi 4 × 5 px pri 1448 × 2575), aby hrany hĺbky neschodíkovali
  const SEG = phone ? [112, 200] : [256, 192];
  const grid = new THREE.PlaneGeometry(1, 1, SEG[0], SEG[1]);
  const VERT = `
    uniform sampler2D uDepth; uniform float uAmt; uniform vec3 uEye;
    varying vec2 vUv; varying float vZ;
    void main() {
      vUv = vec2(uv.x, 1.0 - uv.y);
      float z = texture2D(uDepth, vUv).r;
      vZ = z;                                                  // hĺbka bodu (1 = blízko) pre prechod medzi zábermi
      vec4 w = modelMatrix * vec4(position, 1.0);
      // bod sa posunie po priamke k oku: z pokojného miesta kamery je obraz presne fotka,
      // pri pohybe kamery sa bližšie veci posúvajú viac ako stena za nimi
      w.xyz = uEye + (w.xyz - uEye) * (1.0 - uAmt * z);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  // uVig: 1/šírka, 1/výška plátna, pomer strán, 1 = kreslí sa rovno na obrazovku (vinetácia už tu);
  // do textúry prechodu ide v alfe hĺbka bodu, podľa nej sa zábery prelínajú (blízke veci posledné)
  const FRAG = `
    uniform sampler2D uMap; uniform vec4 uVig; varying vec2 vUv; varying float vZ;
    void main() {
      vec3 c = texture2D(uMap, vUv).rgb;
      if (uVig.w > 0.5) {
        vec2 q = (gl_FragCoord.xy * uVig.xy - 0.5) * vec2(uVig.z, 1.0) / max(uVig.z, 1.0);
        c *= 1.0 - smoothstep(0.32, 0.9, length(q)) * 0.34;
      }
      gl_FragColor = vec4(c, vZ);
    }`;
  // sekvencia snímok (data-video-mode="seq"): dve susedné snímky a ich prelínanie podľa presnej polohy
  const FRAG_SEQ = FRAG.replace('uniform sampler2D uMap;', 'uniform sampler2D uMap; uniform sampler2D uMap2; uniform float uMix;')
    .replace('vec3 c = texture2D(uMap, vUv).rgb;', 'vec3 c = mix(texture2D(uMap, vUv).rgb, texture2D(uMap2, vUv).rgb, uMix);');
  /* hĺbková mapa sa po načítaní raz zjemní na grafike: popredie sa najprv mierne rozšíri (max filter),
     potom sa hrana rozmaže na šírku asi dvoch buniek mriežky. Predmet sa tak hýbe ako celok a pri
     pohybe sa naťahuje len úzky pás steny tesne za ním, hrana nesleduje bunky mriežky (žiadne zúbky) */
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2() }, uR: { value: 1 }, uMode: { value: 0 } },
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tSrc; uniform vec2 uTexel, uDir; uniform float uR, uMode;
      void main() {
        vec2 uv = gl_FragCoord.xy * uTexel;
        float acc = 0.0, ws = 0.0, s2 = uR * uR / 9.0;
        for (int i = -40; i <= 40; i++) {
          float f = float(i);
          if (abs(f) > uR) continue;
          float z = texture2D(tSrc, uv + uDir * uTexel * f).r;
          if (uMode < 0.5) acc = max(acc, z);
          else { float w = exp(-0.5 * f * f / s2); acc += z * w; ws += w; }
        }
        if (uMode > 0.5) acc /= ws;
        gl_FragColor = vec4(acc, acc, acc, 1.0);
      }`,
  }));
  soft.frustumCulled = false;
  const softScene = new THREE.Scene(); softScene.add(soft);
  function soften(t) {
    // rozmery z nahratia: samotný obrázok je po nahratí zavretý (bitmap.close) a hlási 0 × 0
    const w = t.userData.w, h = t.userData.h, u = soft.material.uniforms;
    const opt = { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false };
    const a = new THREE.WebGLRenderTarget(w, h, opt), b = new THREE.WebGLRenderTarget(w, h, opt);
    // polomer v texeloch hĺbkovej mapy podľa bunky mriežky: rozmazanie asi 1,2 bunky, rozšírenie dvojnásobok
    const sig = Math.max(1.5, 1.2 * w / SEG[0]);
    const pass = (src, dst, dx, dy, mode, r) => {
      u.tSrc.value = src; u.uTexel.value.set(1 / w, 1 / h); u.uDir.value.set(dx, dy); u.uMode.value = mode; u.uR.value = r;
      renderer.setRenderTarget(dst); renderer.render(softScene, postCam);
    };
    pass(t, a, 1, 0, 0, Math.round(2 * sig)); pass(a.texture, b, 0, 1, 0, Math.round(2 * sig));
    pass(b.texture, a, 1, 0, 1, Math.min(40, Math.round(3 * sig))); pass(a.texture, b, 0, 1, 1, Math.min(40, Math.round(3 * sig)));
    renderer.setRenderTarget(null); u.tSrc.value = null;
    a.dispose(); t.dispose();
    return b;
  }
  const vig = { value: new THREE.Vector4(1, 1, 1, 0) };      // spoločná pre všetky zábery
  // sila hĺbky: na telefóne menšia, lebo výrez na výšku má blízke popredie (kreslo, pult) a väčší posun by ho krútil
  const AMT = phone ? 0.3 : 0.42;
  const px = (r, g, b) => { const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1); t.needsUpdate = true; return t; };
  const blank = px(14, 13, 12), flat = px(0, 0, 0);

  SHOTS.forEach((s) => {
    const sq = s.video && s.video.mode === 'seq';
    s.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: sq ? FRAG_SEQ : FRAG,
      uniforms: Object.assign({ uMap: { value: blank }, uDepth: { value: flat }, uAmt: { value: AMT }, uEye: { value: new THREE.Vector3() }, uVig: vig },
        sq ? { uMap2: { value: blank }, uMix: { value: 0 } } : {}),
    });
    s.mesh = new THREE.Mesh(grid, s.mat);
    s.mesh.visible = false; s.mesh.frustumCulled = false;
    scene.add(s.mesh);
    s.eye = new THREE.Vector3();
    s.ready = false; s.loading = null; s.size = 0; s.pi = null;
  });

  /* ---------- načítanie fotiek: najprv aktuálny záber, potom susedia; ostatné sa uvoľnia ---------- */
  const base = new URL('img/film/', here).href;
  let maxTex = 4096;
  // telefón: najviac 1448 px (výrez na výšku je pri tom takmer bod na bod aj na displeji 3x);
  // počítač: do 2896 px (displej 2x pri 1440 px), záber prológu aj 4096 px, lebo kamera doň
  // nabieha 1,5× a po prológu sa uvoľní
  const CAP = phone ? 1448 : 2896;
  function pickSize(s) {
    // najmenšia fotka, ktorá na obrazovke nebude zväčšená (ostrosť ako na fotke)
    const fit = s.tiers.filter((w) => w <= maxTex && w <= (s.pro ? 4096 : CAP));
    if (!fit.length) fit.push(s.tiers[0]);
    const need = s.pw / s.vw * canvas.width;
    return fit.find((w) => w >= need * 0.95) || fit[fit.length - 1];
  }
  async function bitmap(url, signal) {
    const r = await fetch(url, { signal }); if (!r.ok) throw new Error(url);
    const blob = await r.blob();
    if (signal.aborted) throw new Error('zrušené');
    // bez volieb (Safari ich nepozná); prvý riadok obrázka je hore, shader to otočí sám
    return createImageBitmap(blob);
  }
  // hĺbková mapa: mriežka má 256 buniek na šírku, mapa širšia než 768 px by len zabrala pamäť grafiky
  // (4096 px = 45 MB na záber) a predĺžila zjemnenie; väčšia sa preto po rozbalení zmenší
  const DEPTH_W = 768;
  async function depthBitmap(url, signal) {
    const b = await bitmap(url, signal);
    if (b.width <= DEPTH_W) return b;
    const w = DEPTH_W, h = Math.round(b.height * w / b.width);
    const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(d.createElement('canvas'), { width: w, height: h });
    const x = c.getContext('2d'); x.drawImage(b, 0, 0, w, h); b.close();
    return createImageBitmap(c);
  }
  function tex(bmp) {
    const t = new THREE.Texture(bmp);
    t.flipY = false; t.generateMipmaps = false;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  }
  /* nahratie do grafiky po pásoch: jedno veľké nahratie by zastavilo stránku (na telefóne 40 až 250 ms),
     pásy po 256 riadkoch idú po jednom v ďalších snímkach, každý pár milisekúnd */
  const gl = renderer.getContext(), BAND = 256;
  // fotky záberov: mipmapy + trilineárne filtrovanie + anizotropia, aby bola fotka ostrá aj tam, kde ju
  // perspektíva naklonená hĺbkou vzorkuje šikmo, a bez moaré, keď je väčšia než obrazovka
  const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);
  let jobs = [];
  function upload(bmp, live, photo) {
    return new Promise((res) => {
      const t = tex(bmp);
      // generateMipmaps = true: three vyhradí všetky úrovne (texStorage2D), obsah doplní ručný generateMipmap po pásoch
      if (photo) { t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = ANISO; }
      t.userData.w = bmp.width; t.userData.h = bmp.height;  // rozmery ostanú známe aj po zavretí obrázka
      t.source.dataReady = false;                           // three len vyhradí miesto, obsah príde po pásoch
      renderer.initTexture(t);
      const glt = renderer.properties.get(t).__webglTexture;
      let y = 0;
      jobs.push(() => {                                     // vráti true, keď je fotka celá (alebo zrušená)
        if (!live()) { bmp.close(); t.dispose(); res(null); return true; }
        const h = Math.min(BAND, bmp.height - y);
        renderer.state.bindTexture(gl.TEXTURE_2D, glt);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, bmp.width, h, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
        y += h;
        if (y < bmp.height) return false;
        // mipmapy až keď je fotka celá (jeden krok na grafike, nie po pásoch)
        if (photo) gl.generateMipmap(gl.TEXTURE_2D);
        bmp.close(); res(t); return true;
      });
      wake();
    });
  }
  function pump(ms) {
    // aspoň jeden pás za snímku, ďalšie len kým neminie rozpočet
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < ms) if (jobs[0]()) jobs.shift();
  }
  // fotky sú v AVIF (o tretinu menšie) aj WebP; keď prehliadač AVIF nedekóduje, ďalej sa berie WebP
  let avif = true;
  async function photo(s, w, signal) {
    if (avif) {
      try { return await bitmap(`${base}${s.photo}-${w}.avif`, signal); }
      catch (e) { if (signal.aborted) throw e; avif = false; }
    }
    return bitmap(`${base}${s.photo}-${w}.webp`, signal);
  }
  const retryOk = (s) => !s.failedAt || performance.now() - s.failedAt > 10000;   // po výpadku siete skúsi znova
  function load(s) {
    if (s.video) { loadClip(s); return; }
    // raz načítaná veľkosť sa drží (z cache), aj keď pomalé zariadenie zníži rozlíšenie; väčšia len keď treba
    const w = Math.max(pickSize(s), s.w || 0);
    if (s.done || s.loading || (s.ready && s.size >= w) || !retryOk(s)) return;   // done: prológ, ktorý už prebehol
    // hotový záber v menšej veľkosti (napr. po otočení telefónu) sa vymení až keď je väčší načítaný
    const ctl = new AbortController(), upgrade = s.ready;
    const live = () => !ctl.signal.aborted && !lost && !(upgrade && !s.ready);
    s.ctl = ctl;
    s.loading = Promise.all([photo(s, w, ctl.signal), upgrade ? null : depthBitmap(`${base}${s.photo}-hlbka.webp`, ctl.signal)])
      .then(([img, dep]) => Promise.all([upload(img, live, true), dep && upload(dep, live, false)]))
      .then(([map, depth]) => {
        if (s.ctl === ctl) s.loading = null;
        if (!map || (!upgrade && !depth) || !live()) { if (map) map.dispose(); if (depth) depth.dispose(); return; }
        const u = s.mat.uniforms, old = upgrade ? u.uMap.value : null;
        u.uMap.value = map;                                   // obraz je už celý v grafickej karte
        if (depth) { s.drt = soften(depth); u.uDepth.value = s.drt.texture; }
        if (old) old.dispose();
        if (!upgrade) s.t0 = performance.now();
        s.ready = true; s.size = s.w = w; s.failedAt = 0; wake();
      })
      .catch(() => { if (s.ctl === ctl) s.loading = null; if (!ctl.signal.aborted) s.failedAt = performance.now(); });
  }
  function drop(s) {
    if (s.loading) { s.ctl.abort(); s.loading = null; }   // preskočený záber sa ani nedotiahne
    if (s.video) detach(s, false);
    if (!s.ready) return;
    const u = s.mat.uniforms;
    u.uMap.value.dispose(); if (s.drt) { s.drt.dispose(); s.drt = null; }
    u.uMap.value = blank; u.uDepth.value = flat; s.ready = false; s.size = 0; s.pmap = null;
  }

  /* ---------- video ako záber (data-video) ----------
     Plagát sa nahrá ako fotka (bez hĺbky), záber je tým hotový a prelína sa ako každý iný. Video sa pripojí
     až po prvom pohybe návštevníka a plagát nahradí, keď má snímku na správnom mieste:
     - scroll: video stojí, jeho čas vedie poloha vo filme (S cez pružinu, takže aj čas ide plynulo);
       posun po celých snímkach, súbor má každú snímku kľúčovú (-g 1), takže každý posun je jedna snímka;
     - play: tichá slučka v čase, hrá len kým je záber na obrazovke (a nie po 3 min bez pohybu).
     Keď video nejde (sieť, formát, úsporný režim telefónu nedovolí play), ostáva plagát s jemným nájazdom. */
  const vType = (() => {
    const v = d.createElement('video');
    const mp4 = v.canPlayType('video/mp4; codecs="avc1.640028"'), webm = v.canPlayType('video/webm; codecs="vp9"');
    return mp4 === 'probably' || (mp4 && !webm) ? '.mp4' : webm ? '.webm' : '';
  })();
  async function posterBitmap(s, signal) {
    const u = new URL(s.video.poster, d.baseURI).href;
    if (avif) {
      try { return await bitmap(u + '.avif', signal); }
      catch (e) { if (signal.aborted) throw e; avif = false; }
    }
    return bitmap(u + '.webp', signal);
  }
  function loadClip(s) {
    if (s.loading || !retryOk(s)) return;
    if (s.ready) { if (userMoved && !s.vel && !s.sq && !s.vfail) attach(s); return; }
    if (!s.video.poster) { s.ready = true; s.t0 = performance.now(); if (userMoved) attach(s); return; }
    const ctl = new AbortController(), live = () => !ctl.signal.aborted && !lost;
    s.ctl = ctl;
    s.loading = posterBitmap(s, ctl.signal).then((img) => upload(img, live, false)).then((map) => {
      if (s.ctl === ctl) s.loading = null;
      if (!map || !live()) { if (map) map.dispose(); return; }
      s.mat.uniforms.uMap.value = map; s.pmap = map;
      s.t0 = performance.now(); s.ready = true; s.size = s.w = 1; s.failedAt = 0; wake();
      if (userMoved) attach(s);
    }).catch(() => { if (s.ctl === ctl) s.loading = null; if (!ctl.signal.aborted) s.failedAt = performance.now(); });
  }
  /* súbor videa sa stiahne raz celý a drží sa v pamäti ako blob (1 až 2 MB): návrat k scéne ho nesťahuje
     znova (prehliadač žiadosti s rozsahom bajtov často nevezme z cache) a posun po snímkach nečaká na sieť */
  function clipBlob(s) {
    if (!s.vblob) {
      s.vblob = fetch(new URL(s.video.src + vType, d.baseURI).href, { priority: 'low' })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => URL.createObjectURL(b))
        .catch((e) => { s.vblob = null; throw e; });
    }
    return s.vblob;
  }
  function attach(s) {
    if (s.video.mode === 'seq') { seqStart(s); return; }
    // vfail: súbor sa nedá prehrať (formát, chyba dekódovania) – ostáva plagát; výpadok siete skúsi znova o 10 s
    if (s.vel || s.vfail || s.vwait || (s.vneterr && performance.now() - s.vneterr < 10000)) return;
    if (!vType) { s.vfail = true; return; }
    s.vwait = true;
    clipBlob(s).then((url) => { s.vwait = false; s.vneterr = 0; if (s.ready && !s.vel && !lost) attachUrl(s, url); }, () => { s.vwait = false; s.vneterr = performance.now(); });
  }
  function attachUrl(s, url) {
    const c = s.video, v = d.createElement('video');
    v.muted = v.defaultMuted = true; v.playsInline = true;
    ['muted', 'playsinline', 'webkit-playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach((a) => v.setAttribute(a, ''));
    v.loop = c.mode === 'play'; v.preload = 'auto'; v.className = 'film-video';
    v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
    const vt = new THREE.VideoTexture(v);
    vt.flipY = false; vt.colorSpace = THREE.NoColorSpace; vt.generateMipmaps = false;
    vt.minFilter = vt.magFilter = THREE.LinearFilter; vt.wrapS = vt.wrapT = THREE.ClampToEdgeWrapping;
    s.vel = v; s.vt = vt; s.vlive = false; s.vwant = -1; s.vblock = false;
    // nová snímka videa: prekresliť (v pokoji film sám nekreslí); prvá snímka na správnom mieste nahradí plagát
    const onFrame = () => {
      if (s.vel !== v) return;
      if (v.readyState >= 2) vt.needsUpdate = true;
      if (!s.vlive && v.readyState >= 2 && (c.mode === 'play' ? !v.paused : !v.seeking && s.vwant >= 0)) {
        s.vlive = true; s.mat.uniforms.uMap.value = vt;
      }
      wake();
    };
    if ('requestVideoFrameCallback' in v) { const f = () => { if (s.vel !== v) return; onFrame(); v.requestVideoFrameCallback(f); }; v.requestVideoFrameCallback(f); }
    v.addEventListener('seeked', onFrame); v.addEventListener('playing', onFrame); v.addEventListener('loadeddata', onFrame);
    v.addEventListener('loadedmetadata', wake);
    v.addEventListener('error', () => { if (s.vel === v) detach(s, true); });   // nie chyba z uvoľnenia (detach maže src)
    v.src = url;
    s.at.appendChild(v);                                      // v stránke: Safari nemusí dodávať snímky videu mimo dokumentu
    v.load();
  }
  function detach(s, failed) {
    if (s.sq) seqStop(s);
    const v = s.vel;
    if (failed) s.vfail = true;
    if (!v) return;
    s.vel = null;
    try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* nič */ }
    v.remove();
    if (s.vt) { if (s.mat.uniforms.uMap.value === s.vt) s.mat.uniforms.uMap.value = s.pmap || blank; s.vt.dispose(); s.vt = null; }
    s.vlive = false; s.vwant = -1; wake();
  }
  // poloha v pohybe záberu 0..1 (to isté t ako v place): čas videa v režime scroll
  /* ---------- sekvencia snímok ako záber (data-video-mode="seq") ----------
     Video rozložené na fotky po 0,1 s (majiteľ 2026‑10‑11, source/tools/sekvencie.sh): pri skrole sa nepretáča
     video, vyberú sa dve susedné snímky podľa presnej polohy vo filme a shader ich prelína (uMix), takže pohyb
     ide pri každej snímke displeja (60 až 240 Hz) a nikdy nečaká na dekodér videa. Snímky sa sťahujú od hrubých
     k jemným (každá 8., 4., 2., potom všetky) a kým jemnejšia chýba, prelína sa medzi najbližšími stiahnutými.
     Stiahnuté súbory ostávajú v pamäti (asi 40 kB na snímku), rozbalené sú len okolo aktuálnej polohy:
     dekódovanie mimo hlavného vlákna (createImageBitmap), v grafike najviac SEQ_TEX snímok. */
  const SEQ_TEX = 6, SEQ_NET = 4;
  const pad3 = (i) => String(i).padStart(3, '0');
  function seqStart(s) {
    const n = s.video.n;
    if (s.sq || !n) return;
    // poradie sťahovania: najprv každá 8. snímka (pohyb funguje hneď), potom 4., 2. a nakoniec zvyšné
    if (!s.sqBlobs) s.sqBlobs = new Array(n);
    const order = [], seen = new Set();
    for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(n - 1)) order.splice(1, 0, n - 1);
    s.sq = { n, order, next: 0, net: 0, tex: new Map(), dec: new Set(), up: [], dead: false, lo: -1, hi: -1, m: 0, at: 0, ext: avif ? '.avif' : '.webp' };
    seqFetch(s);
  }
  function seqFetch(s) {
    const q = s.sq;
    if (!q || q.dead) return;
    while (q.net < SEQ_NET && q.next < q.order.length) {
      const i = q.order[q.next++];
      if (s.sqBlobs[i]) continue;
      q.net++;
      fetch(new URL(`${s.video.src}/f${pad3(i)}${q.ext}`, d.baseURI).href, { priority: 'low' })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => { s.sqBlobs[i] = b; wake(); }, () => { if (q.ext === '.avif') { q.ext = '.webp'; q.order.push(i); } })
        .finally(() => { q.net--; seqFetch(s); });
    }
  }
  function seqStop(s) {
    const q = s.sq; s.sq = null;
    q.dead = true;
    for (const t of q.tex.values()) t.dispose();
    for (const [, b] of q.up) b.close();
    const u = s.mat.uniforms; u.uMap.value = s.pmap || blank; u.uMap2.value = blank; u.uMix.value = 0;
  }
  // snímka v grafike, alebo undefined (rozbalí sa a nahrá v niektorej z ďalších snímok)
  function seqTex(s, i) {
    const q = s.sq, t = q.tex.get(i);
    if (t) { q.tex.delete(i); q.tex.set(i, t); return t; }  // naposledy použitá ide na koniec (LRU)
    if (!q.dec.has(i) && s.sqBlobs[i]) {
      q.dec.add(i);
      createImageBitmap(s.sqBlobs[i]).then((b) => { if (q.dead) b.close(); else { q.up.push([i, b]); wake(); } }, () => {}).finally(() => q.dec.delete(i));
    }
    return undefined;
  }
  function seqDrive(s) {
    const q = s.sq, n = q.n, u = s.mat.uniforms;
    const ft = clamp(shotT(s), 0, 1) * (n - 1), has = (i) => !!s.sqBlobs[i];
    // rozbalené snímky ďaleko od polohy (rýchly skrol ich prebehol) sa zahodia, nenahrávajú sa
    for (let k = q.up.length - 1; k >= 0; k--) if (Math.abs(q.up[k][0] - ft) > 4) { q.up[k][1].close(); q.up.splice(k, 1); }
    // najviac dve nahratia do grafiky za snímku displeja (720 × 1280, po 1 až 3 ms), najbližšie k polohe prvé
    q.up.sort((a, b) => Math.abs(a[0] - ft) - Math.abs(b[0] - ft));
    for (let k = 0; k < 2 && q.up.length; k++) {
      const [i, b] = q.up.shift();
      if (q.tex.has(i)) { b.close(); continue; }
      const t = tex(b); renderer.initTexture(t); b.close();
      q.tex.set(i, t);
    }
    let lo = Math.floor(ft), hi = Math.ceil(ft);
    while (lo > 0 && !has(lo)) lo--;
    while (hi < n - 1 && !has(hi)) hi++;
    if (!has(lo)) lo = hi; if (!has(hi)) hi = lo;
    if (!has(lo)) return q.net > 0;                           // ešte nič: ostáva plagát
    const ta = seqTex(s, lo), tb = hi === lo ? ta : seqTex(s, hi);
    // vopred rozbaliť susedov v smere pohybu (len keď sa nečaká na veľa iných)
    if (q.up.length + q.dec.size < 3) {
      const dir = V < 0 ? -1 : 1;
      for (const k of [hi + dir, lo - dir, hi + 2 * dir]) if (k >= 0 && k < n && has(k) && !q.tex.has(k)) seqTex(s, k);
    }
    // prelínanie dvoch snímok: počas skrolu len v strednej tretine medzi nimi (inak jedna ostrá snímka, pri
    // rýchlom pohybe kamery by trvalé prelínanie zdvojovalo hrany); keď skrol stojí, obraz sa do 0,2 s dorovná
    // na najbližšiu celú snímku, takže v pokoji je vždy ostrý
    const now = performance.now(), dt = q.at ? Math.min(0.1, (now - q.at) / 1000) : 0; q.at = now;
    const show = (a, z, ta2, tz2) => {
      const raw = z > a ? clamp((ft - a) / (z - a), 0, 1) : 0;
      const goal = still > 0.25 ? Math.round(raw) : smooth(0.33, 0.67, raw);
      if (a !== q.lo || z !== q.hi) q.m = goal;              // nová dvojica snímok: bez dobiehania
      else q.m += (goal - q.m) * (1 - Math.pow(0.0005, dt));
      u.uMap.value = ta2; u.uMap2.value = tz2; u.uMix.value = q.m; q.lo = a; q.hi = z;
    };
    if (ta && tb) show(lo, hi, ta, tb);
    else {
      // presné snímky ešte nie sú v grafike: prelínať medzi najbližšími, ktoré tam už sú (obraz nestojí)
      let a = -1, z = -1;
      for (const k of q.tex.keys()) { if (k <= ft && k > a) a = k; if (k >= ft && (z < 0 || k < z)) z = k; }
      if (a < 0) a = z; if (z < 0) z = a;
      if (a >= 0) show(a, z, q.tex.get(a), q.tex.get(z));
    }
    // v grafike najviac SEQ_TEX snímok; práve kreslené sa neuvoľnia
    for (const [k, t] of q.tex) { if (q.tex.size <= SEQ_TEX) break; if (t !== u.uMap.value && t !== u.uMap2.value) { t.dispose(); q.tex.delete(k); } }
    return q.up.length > 0 || q.dec.size > 0 || q.net > 0;
  }
  const shotT = (s) => (s.pi == null ? 0.5 : s.pi === 0 ? clamp(S / 0.66, 0, 1) : clamp((S - s.pi + 0.66) / 1.32, 0, 1));
  function drive(s, now) {
    const v = s.vel, c = s.video;
    if (!v || v.readyState < 1) return false;
    if (c.mode === 'scroll') {
      const r = c.t || [0, v.duration || 0], fr = 1 / c.fps;
      // stred snímky (presný posun aj v prehliadačoch, ktoré zaokrúhľujú čas), nikdy nie za poslednou snímkou
      const t = r[0] + (r[1] - r[0]) * shotT(s);
      const want = Math.min(r[1] - fr * 0.5, (Math.floor(t / fr) + 0.5) * fr);
      if (Math.abs(want - s.vwant) > fr * 0.25 && !v.seeking) {
        s.vwant = want;
        if (typeof v.fastSeek === 'function') v.fastSeek(want); else v.currentTime = want;   // každá snímka kľúčová: fastSeek je presný
      }
      return v.seeking;
    }
    // hrá len záber, ktorý je naozaj vidieť (aj pri skoku cez menu, keď sa nový záber ešte načítava)
    const vis = onScreen.has(s) && Math.abs(s.pi - S) < 1 && now - lastInput < BREATH_MS;
    if (vis && !s.vblock) {
      if (v.paused && !s.vpend) {
        s.vpend = true;
        v.play().then(() => { s.vpend = false; }, () => { s.vpend = false; s.vblock = true; });   // úsporný režim: ostáva plagát
      }
    } else if (!v.paused) v.pause();
    return vis && !v.paused;
  }
  let onScreen = new Set();
  function keepAround(ci) {
    // v pamäti je aktuálny záber, susedia a ďalší v smere skrolovania (najviac štyri);
    // prológ, ktorý už prebehol (done), sa uvoľní, len čo zíde z obrazovky
    const dir = V < 0 ? -1 : 1, keep = (s) => !s.done && s.pi != null && (Math.abs(s.pi - ci) <= 1 || s.pi === ci + 2 * dir);
    SHOTS.forEach((s) => { if (!keep(s) && !onScreen.has(s)) drop(s); });
    const cur = path[ci];
    if (!cur) return;
    load(cur);
    if (!cur.ready) return;                                   // pri skoku najprv cieľ, susedia až potom
    for (const k of [ci + dir, ci - dir, ci + 2 * dir]) if (path[k] && !(pro && k === ci + 2 * dir)) load(path[k]);
  }

  /* ---------- rozloženie záberu podľa obrazovky ---------- */
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
  const OVER = 0.12;                                          // presah fotky za okraj (1,24), aby pohyb nikdy neodhalil hranu
  const OVER_V = 0.06;                                        // video: presah 1,12 (zdroj 576 px zväčšený na 864, každý presah ho zväčšuje); stačí na dýchanie a prechod
  function layout() {
    const aspect = canvas.width / canvas.height;
    const vh = 2 * DIST * tanH, vw = vh * aspect;
    SHOTS.forEach((s) => {
      // fotka pokryje okno s presahom na oboch stranách; na telefóne na výšku vidno jej stred okolo bodu záujmu
      const ovr = s.video ? OVER_V : OVER, ov = 1 + 2 * ovr;
      let pw = vw * ov, ph = pw / s.pa;
      if (ph < vh * ov) { ph = vh * ov; pw = ph * s.pa; }
      s.mesh.scale.set(pw, ph, 1);
      s.pw = pw; s.ph = ph; s.vw = vw; s.vh = vh;
      const f = (phone && s.fm) || s.f;
      const mx = Math.max(0, (pw - vw) / 2 - vw * ovr * 0.5), my = Math.max(0, (ph - vh) / 2 - vh * ovr * 0.5);
      s.eye.set(clamp((f[0] - 0.5) * pw, -mx, mx), clamp((0.5 - f[1]) * ph, -my, my), DIST);
      s.mat.uniforms.uEye.value.copy(s.eye);
    });
  }

  /* ---------- skladanie: dva zábery do textúr, prelínanie a vinetácia ---------- */
  // hĺbkový buffer ostáva: mriežka záberu sa pri pohybe môže prekrývať sama so sebou
  /* textúry záberov majú mipmapy (počítajú sa len počas prechodu, keď sa do nich kreslí): veľké rozmazanie
     strihu sa tak skladá z mála vzoriek, každá z úrovne podľa ich rozostupu, takže je hladké, bez pásov,
     kópií a šumu. Mimo okraja sa berie zrkadlový obraz, pod rozmazaním splynie (nikdy tvrdá hrana). */
  const rtOpt = { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.MirroredRepeatWrapping, wrapT: THREE.MirroredRepeatWrapping };
  const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpt), rtB = new THREE.WebGLRenderTarget(1, 1, rtOpt);
  /* parametre strihov; telefón má menej vzoriek a slabšie efekty (rozmery v podieloch obrazu):
     dip/vs šero a vinetácia v strede, mbx,mby/mz pohyb (rozmazanie vodorovne, zvislo, zoomom),
     nt/sx,sy/bx,by švih (vzorky, posun a rozmazanie vodorovne a zvislo), za/kz najazd (zoom, rozmazanie),
     pe/pw/pd/pf/bow popredie (presah, šírka neostrej hrany, tieň, neostrosť a vypuklosť predmetu), lat/yaw/nz/walk pohyb kamery */
  const CK = phone
    ? { dip: 0.1, vs: 0.1, mbx: 0.07, mby: 0.035, mz: 0.08, nt: 6, sx: 0.24, sy: 0.12, bx: 0.24, by: 0.12, za: 0.3, kz: 0.13, pe: 0.3, pw: 0.085, pd: 0.35, pf: 3.5, bow: 0.1,
      lat: [0, 0.07, 0.07, 0, 0.08], yaw: [0, 0.3, 0.6, 0, 0.3], nz: 0.34, walk: 0.2, walkB: 0.1, amp: 0.12 }
    : { dip: 0.18, vs: 0.16, mbx: 0.05, mby: 0.06, mz: 0.08, nt: 8, sx: 0.16, sy: 0.2, bx: 0.11, by: 0.15, za: 0.35, kz: 0.15, pe: 0.25, pw: 0.05, pd: 0.35, pf: 4.0, bow: 0.08,
      lat: [0, 0.1, 0.08, 0, 0.1], yaw: [0, 0.3, 0.6, 0, 0.3], nz: 0.4, walk: 0.24, walkB: 0.12, amp: 0.16 };
  const F = (v) => v.toFixed(4);
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
      tA: { value: rtA.texture }, tB: { value: rtB.texture }, uMix: { value: 0 }, uAspect: { value: 1 },
      // uKind = druh strihu (0 prelínanie, 1 pohyb, 2 švih, 3 nájazd, 4 popredie), uDir = smer kamery na obrazovke
      // (x doprava, y nahor), uFoc / uFoc2 = bod strihu na odchádzajúcom / prichádzajúcom zábere (0 až 1, zdola),
      // uLead = hrana predmetu popredia v smere jeho letu, uRes = plátno v pixeloch
      uKind: { value: 0 }, uDir: { value: new THREE.Vector2() }, uFoc: { value: new THREE.Vector2(0.5, 0.5) }, uFoc2: { value: new THREE.Vector2(0.5, 0.5) },
      uLead: { value: 0.5 }, uRes: { value: new THREE.Vector2(1, 1) }, uDbg: { value: 0 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tA, tB; uniform float uMix, uAspect, uKind, uLead, uDbg; uniform vec2 uDir, uFoc, uFoc2, uRes;
      varying vec2 vUv;
      #define PI 3.14159265
      #define NT ${CK.nt}
      // úroveň mipmapy pre vzorky vzdialené px pixelov od seba: rozmazanie je súvislé
      float lodOf(float px) { return log2(max(px, 1.0)); }
      // blízke veci podľa hĺbky (alfa 1 = blízko); záber bez hĺbky (video) nemá popredie
      float near(float z) { return smoothstep(0.5, 0.78, z); }
      /* rozmazanie pohybom: n vzoriek na úsečke st okolo uv; úroveň mipmapy o niečo menšia, než je ich
         rozostup, takže stopa je súvislá, ale naprieč pohybom ostáva skoro ostrá (šmuha, nie neostrosť) */
      vec4 streak(sampler2D t, vec2 uv, vec2 st, int n) {
        float lod = lodOf(length(st * uRes) / float(n)) - 0.6;
        vec4 acc = vec4(0.0);
        for (int i = 0; i < 2 * NT; i++) { if (i >= n) break; acc += textureLod(t, uv + st * ((float(i) + 0.5) / float(n) - 0.5), lod); }
        return acc / float(n);
      }
      // rozmazanie zoomom: n vzoriek od bodu uv smerom k stredu f (k = dĺžka stopy ako podiel vzdialenosti, z = zväčšenie)
      vec3 zoom(sampler2D t, vec2 f, vec2 q, float k, float z, int n) {
        float lod = lodOf(length(q * uRes) * k / z / float(n)) - 0.5;
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 2 * NT; i++) { if (i >= n) break; acc += textureLod(t, f + q * ((1.0 - k * (float(i) + 0.5) / float(n)) / z), lod).rgb; }
        return acc / float(n);
      }
      void main() {
        float x = uMix, s = sin(PI * x), vs = 0.34, dip = ${F(CK.dip)};
        vec3 c;
        if (x <= 0.0) c = texture2D(tA, vUv).rgb;
        else if (uKind < 0.5) {
          /* prelínanie cez priestor: každý bod vo vlastnom čase podľa bližšej z dvoch hĺbok,
             ďaleký koniec miestností sa vymení prvý, blízke veci posledné */
          vec4 a = texture2D(tA, vUv), b = texture2D(tB, vUv);
          float o = max(a.a, b.a);
          c = mix(a.rgb, b.rgb, smoothstep(o * 0.55, o * 0.55 + 0.45, x));
        } else if (uKind < 1.5) {
          /* pokračovanie pohybu: kamera ide ďalej tým istým smerom aj rýchlosťou, nová miestnosť prichádza
             zo strany, kam ide (pri kroku dopredu z diaľky v strede), vzdialené body skôr ako blízke;
             ľahké rozmazanie pohybom podľa rýchlosti */
          bool lat = dot(uDir, uDir) > 0.0;
          vec2 q = vUv - uFoc, st = lat ? uDir * vec2(${F(CK.mbx)}, ${F(CK.mby)}) * s * s : q * ${F(CK.mz)} * s * s;
          // oba zábery rozmazané pohybom: kde sa prekrývajú, je to šmuha pohybu, nie dva ostré obrazy
          vec4 a = streak(tA, vUv, st, NT), b = streak(tB, vUv, st, NT);
          float h = lat ? clamp(dot(vUv - 0.5, uDir) * 0.9 + 0.5, 0.0, 1.0)
                        : 1.0 - clamp(length(q * vec2(uAspect, 1.0)) / max(uAspect, 1.0) * 1.3, 0.0, 1.0);
          float t0 = 0.6 * (1.0 - h) + 0.12 * max(a.a, b.a);
          c = mix(a.rgb, b.rgb, smoothstep(t0, t0 + 0.22, x));
          dip *= 0.5;
        } else if (uKind < 2.5) {
          /* švih: obraz ide v smere švihu, rýchlosť sin³ (poloha je jej integrál), rozmazanie podľa
             rýchlosti; výmena záberov len v najväčšom rozmazaní */
          float cx = cos(PI * x), P = (2.0 - 3.0 * cx + cx * cx * cx) * 0.25, v = s * s * s;
          vec2 sh = uDir * vec2(${F(CK.sx)}, ${F(CK.sy)});
          vec2 sa = vUv + sh * P, sb = vUv - sh * (1.0 - P), st = uDir * vec2(${F(CK.bx)}, ${F(CK.by)}) * v;
          float m = smoothstep(0.45, 0.55, x);
          // mimo krátkej výmeny sa kreslí len jeden záber, s dvojnásobkom vzoriek
          if (m <= 0.0) c = streak(tA, sa, st, 2 * NT).rgb;
          else if (m >= 1.0) c = streak(tB, sb, st, 2 * NT).rgb;
          else c = mix(streak(tA, sa, st, NT).rgb, streak(tB, sb, st, NT).rgb, m);
          dip *= 0.4;
        } else if (uKind < 3.5) {
          /* nájazd cez predmet: starý záber sa navyše zväčšuje k bodu, rozmazanie zoomom okolo neho
             (bod sám ostáva ostrý); nový záber sa rozvinie z toho istého miesta von a dobehne svojím
             rozmazaním k pokoju. Odjazd je ten istý strih s vymenenými zábermi a časom naspäť. */
          vec2 asp = vec2(uAspect, 1.0), q = vUv - uFoc, q2 = vUv - uFoc2;
          float r = clamp(length(q * asp) / length(max(uFoc, 1.0 - uFoc) * asp), 0.0, 1.0);
          float t0 = 0.39 + 0.14 * r, m = smoothstep(t0, t0 + 0.08, x);
          float zA = 1.0 + ${F(CK.za)} * x * x, k = ${F(CK.kz)} * s * s;
          if (m <= 0.0) c = zoom(tA, uFoc, q, k, zA, 2 * NT);
          else if (m >= 1.0) c = zoom(tB, uFoc2, q2, k, 1.0, 2 * NT);
          else c = mix(zoom(tA, uFoc, q, k, zA, NT), zoom(tB, uFoc2, q2, k, 1.0, NT), m);
          dip *= 0.5;
        } else {
          /* popredie: kamera ide tesne popri blízkom predmete odchádzajúceho záberu (hĺbková mapa). Predmet
             (pás obrazu od okraja R0 po jeho hranu uLead) sa naťahuje k objektívu: jeho predná hrana L letí
             cez obraz, zadná R ide za ňou, medzi nimi je ten istý predmet zväčšený, čoraz neostrejší a v tieni.
             Za zadnou hranou je už nový záber; výmena je pod predmetom, kde kryje celý obraz. */
          vec2 md = -uDir, pd = vec2(md.y, -md.x);
          float u = dot(vUv - 0.5, md) + 0.5, w = dot(vUv - 0.5, pd) + 0.5, wF = dot(uFoc - 0.5, pd) + 0.5;
          const float R0 = -0.15;
          float L = mix(uLead, ${F(1 + CK.pe)}, smoothstep(0.0, 0.56, x));
          float R = mix(R0, ${F(1 + CK.pe)}, smoothstep(0.2, 0.86, x));
          float g = smoothstep(0.0, 0.5, x), fill = smoothstep(0.04, 0.26, x), k = (L - R) / max(uLead - R0, 0.05);
          // bod predmetu, ktorý sa kreslí na tomto mieste (pozdĺž letu natiahnutý, naprieč zväčšený okolo jeho bodu)
          float us = R0 + (u - R) / k, ws = wF + (w - wF) / k;
          /* časť predmetu za okrajom obrazu: krajný riadok, ku okraju čoraz neostrejší, takže predmet do tmy
             plynule pokračuje (zrkadlo by z neho urobilo súmerný obrazec, opakovaný riadok pruhy); je blízko */
          float inside = smoothstep(0.0, 0.12 * g + 1e-4, us);     // na začiatku strihu presne obraz (g = 0)
          vec2 ps = clamp(0.5 + md * (us - 0.5) + pd * (ws - 0.5), 0.002, 0.998);
          vec4 o = textureLod(tA, ps, mix(6.5, g * ${F(CK.pf)}, inside));
          o.a = mix(1.0, o.a, inside);
          float pw = ${F(CK.pw)} * (0.4 + 0.6 * g);                  // hrana predmetu neostrá podľa toho, ako blízko je
          // predmet je oblý (operadlo, sud, stĺp zblízka): obe hrany sú v strede o kúsok vypuklé, nie rovná čiara
          float bow = ${F(CK.bow)} * g * (1.0 - min(1.0, 4.0 * (w - wF) * (w - wF)));
          float Re = R - bow, Le = L + bow;
          float cov = smoothstep(Re - pw, Re + pw, u) * (1.0 - smoothstep(Le - pw, Le + pw, u)) * mix(near(o.a), 1.0, fill);
          vec3 base = (u < Re + 2.0 * pw && fill >= 1.0) ? texture2D(tB, vUv).rgb : texture2D(tA, vUv).rgb;
          c = mix(base, o.rgb * (1.0 - ${F(CK.pd)} * g), cov);
          dip *= 0.2;
        }
        // krátke šero uprostred a o niečo užšia vinetácia: oko ide do stredu, ako strih vo filme
        c *= 1.0 - dip * s;
        vs += ${F(CK.vs)} * s;
        // jemná vinetácia ako pri filmovom objektíve, stred ostáva nedotknutý
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
        c *= 1.0 - smoothstep(0.32, 0.9, length(q)) * vs;
        gl_FragColor = vec4(c, 1.0);
        if (uDbg > 0.5) gl_FragColor = vec4(vec3(uDbg > 1.5 ? texture2D(tB, vUv).a : texture2D(tA, vUv).a), 1.0);   // ladenie: hĺbka
      }`,
  }));
  post.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(post);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ---------- skrolovanie -> poloha vo filme ----------
     path = zábery, ktorých kotvy sú teraz v stránke (skrytá vypadne), anchors = kde na stránke je
     každý záber celý na obrazovke. S = poloha vo filme (index v path, s desatinami). */
  let path = [], anchors = [], N = 0;
  // horný okraj kotvy v súradniciach stránky; prilepená (sticky) alebo pevná kotva, aj jej prilepený
  // obal, sa pri skrolovaní hýbe, preto sa berie jej rodič: tam sa kotva začína lepiť
  function pageTop(el) {
    const y = scrollY;
    for (let e = el; e && e !== d.body; e = e.parentElement) {
      const p = getComputedStyle(e).position;
      if (p === 'sticky' || p === 'fixed') return (e.parentElement || e).getBoundingClientRect().top + y;
    }
    return el.getBoundingClientRect().top + y;
  }
  function measure() {
    const vh = innerHeight, P = [], An = [], was = path.map((s) => s.photo).join();
    SHOTS.forEach((s) => {
      s.pi = null;
      if (!s.at.offsetParent && getComputedStyle(s.at).position !== 'fixed') return;   // skrytá kotva vypadne
      // prológ stojí jednu obrazovku pred začiatkom stránky: pri scrollY 0 je film presne na zábere úvodu
      // titulná karta (.is-title, P11 v style.css) je pripnutá celú výšku kotvy: záber je celý na obrazovke
      // v strede pripnutia, a zábery sa menia na hornom okraji kotvy (cut), kde sa mení aj text. Úvod
      // (kotva s prológom) ostáva na vrchu stránky, aby bol pri scrollY 0 film presne na ňom.
      const top = s.pro ? -vh : Math.max(0, pageTop(s.at));
      const card = !s.pro && s.at.classList.contains('is-title') && !s.at.hasAttribute('data-pro');
      // voľná dĺžka karty (pri .title-long za ňou ide pás, ten ju po jednej obrazovke zakryje)
      const free = s.at.offsetHeight - (s.at.classList.contains('title-long') ? vh : 0);
      const a = card ? top + free / 2 : top;
      // pred kartou je pás (tím, cenník, galéria): záber sa vymení ešte pod pásom, aby spod neho vyšiel hotový
      const prev = s.at.previousElementSibling || (s.at.parentElement.previousElementSibling || {}).lastElementChild;
      s.cut = card ? top - (prev && prev.classList && prev.classList.contains('band') ? 1.5 * vh : 0) : null;
      if (An.length && a <= An[An.length - 1] + 1) return;
      s.pi = P.length; P.push(s); An.push(a);
    });
    path = P; anchors = An; N = Math.max(0, P.length - 1);
    // dosky s textom (aj ich mäkké prechody do filmu) v súradniciach stránky, pre popis miesta
    bands = [...d.querySelectorAll('.board,footer')].map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY - vh * 0.16, r.bottom + scrollY + vh * 0.1]; });
    if (root.classList.contains('world-in')) measurePlace();
    // iné poradie záberov (zmena stránky): film sa nastaví na nové miesto bez jazdy cez cudzie zábery
    if (P.map((s) => s.photo).join() !== was) { S = targetS(); V = 0; fadeK = -1; }
  }
  function targetS() {
    const y = sy;
    if (!anchors.length || y <= anchors[0]) return 0;
    for (let k = 1; k < anchors.length; k++) if (y < anchors[k]) return k - 1 + (y - anchors[k - 1]) / (anchors[k] - anchors[k - 1]);
    return N;
  }

  /* ---------- kamera: tlmená pružina, jemné dýchanie ako zo steadicamu ---------- */
  let S = 0, V = 0, mx = 0, my = 0, pmx = 0, pmy = 0, breath = 1, sy = scrollY;
  let raf = 0, last = 0, running = true, lost = false, shown = false, shownAt = 0, lastInput = performance.now();
  const started = performance.now();
  // kamera sa hýbe stále (ako video): plnou frekvenciou displeja (60 až 240 snímok/s, majiteľ 2026‑10‑11),
  // po 3 minútach bez pohybu sa zastaví (batéria); hocijaký pohyb ju zasa rozbehne
  const BREATH_MS = 180000, FULL_MS = BREATH_MS;
  const tmp = new THREE.Vector3(), off = new THREE.Vector3();
  const DRIFT = phone ? 0.6 : 1;                              // stály pohyb kamery: na telefóne jemnejší
  // bod fotky záberu (0 až 1 zľava a zhora) vo svete: rovina záberu stojí v strede sveta
  const ptOf = (s, p) => [(p[0] - 0.5) * s.pw, (0.5 - p[1]) * s.ph];
  function place(s, now, push = 0, cut = null) {
    // pohyb záberu trvá celý čas, keď je záber vidieť (od prelínania dnu po prelínanie von)
    const t = shotT(s);
    // video nejde (úsporný režim, sieť, formát): plagát dostane bežný nájazd ako fotka, nech záber nestojí
    const m = MOVES[s.video && (s.vblock || s.vfail || s.vneterr) ? 'in' : s.mv], e = t * t * (3 - 2 * t) * 0.6 + t * 0.4;
    off.set(
      (m[0][0] + (m[1][0] - m[0][0]) * e) * s.vw,
      (m[0][1] + (m[1][1] - m[0][1]) * e) * s.vh,
      (m[0][2] + (m[1][2] - m[0][2]) * e) * DIST,
    );
    // stály pomalý pohyb kamery ako zo steadicamu aj bez skrolovania (ako záber z videa, nie fotka):
    // dva pomalé oblúky v každej osi, spolu asi 1,7 % šírky, 1 % výšky a 2 % vzdialenosti
    const sec = now / 1000, dr = DRIFT * breath * (shownAt ? clamp((now - shownAt) / 1500, 0, 1) : 0);   // nabieha od prvého snímku, ktorý sedí na zálohe
    off.x += ((Math.sin(sec * 0.37) * 0.006 + Math.sin(sec * 0.13 + 0.7) * 0.011) * dr + pmx * 0.03) * s.vw;
    off.y += ((Math.sin(sec * 0.29 + 1.3) * 0.004 + Math.sin(sec * 0.09 + 2.1) * 0.006) * dr + pmy * 0.018) * s.vh;
    off.z += (Math.sin(sec * 0.21 + 0.4) * 0.008 + Math.sin(sec * 0.07 + 1.9) * 0.014) * DIST * dr;
    // pri prechode kamera odchádzajúceho záberu zrýchľuje dopredu, akoby prešla do ďalšej miestnosti
    // (do štvrtiny vzdialenosti); prichádzajúci záber dobieha zozadu a spomalí na svojom mieste
    let zp = push > 0 ? Math.pow(push, 1.6) * 0.25 : push < 0 ? -Math.pow(-push, 1.3) * (s.video ? 0.04 : 0.1) : 0;
    // strih: kamera bokom (svet) s natočením navyše v jej smere, krok dopredu, alebo let k bodu strihu
    let dx = 0, dy = 0, yaw = 0, fx = 0, fy = 0;
    if (cut && push) {
      const out = push > 0, x = out ? push : 1 + push, y = 1 - x, k = cut.k, dr = cut.dir;
      if (k === 1 || k === 2 || k === 4) {
        if (dr[0] || dr[1]) {
          // rovnaká rýchlosť v strede strihu: odchádzajúca kamera zrýchľuje (x²), prichádzajúca prichádza
          // z opačnej strany tou istou rýchlosťou a zabrzdí na svojom mieste ((1 − x)²)
          const L = CK.lat[k], dd = out ? L * x * x : -L * y * y;
          dx = dr[0] * dd * s.vw; dy = dr[1] * dd * s.vh; yaw = CK.yaw[k];
          zp = out ? Math.pow(x, 1.6) * 0.06 : -Math.pow(y, 1.3) * 0.04;
        } else zp = out ? CK.walk * x * x : -CK.walkB * y * y;   // krok dopredu: tá istá rýchlosť cez strih
      } else if (k === 3) {
        // nájazd: odchádzajúca kamera vletí k bodu a:, prichádzajúca dobieha zozadu od svojho bodu b:;
        // odjazd je to isté odzadu: odchádzajúca cúva, prichádzajúca začína tesne pri bode b: (dvere)
        const close = (cut.name === 'najazd') === out, v = out ? x : y, p = out ? cut.a : cut.b;
        zp = close ? CK.nz * Math.pow(v, 1.6) : -0.12 * Math.pow(v, 1.3);
        if (p) { const pt = ptOf(s, p), w = (close ? 0.85 : 0.6) * v * v * (3 - 2 * v); fx = (pt[0] - s.eye.x) * w; fy = (pt[1] - s.eye.y) * w; }
      }
    }
    off.z -= zp * DIST;
    camera.position.copy(s.eye).add(off);
    // pohľad ostáva takmer na bode záujmu: posun kamery sa mení na oblúk okolo neho
    tmp.set(s.eye.x + off.x * 0.08, s.eye.y + off.y * 0.08, 0);
    const lx = dx * (1 + yaw) + fx, ly = dy * (1 + yaw) + fy;
    if (lx || ly) {
      // posun strihu len kým okno ostáva na fotke (nikdy neodhalí jej okraj); okraj fotky má tiež hĺbku:
      // pri posune kamery bokom sa jeho blízke body posunú o kúsok proti nej (rezerva podľa uAmt)
      const D = Math.max(0.2 * DIST, DIST + off.z), hw = s.vw / 2 * D / DIST, hh = s.vh / 2 * D / DIST;
      const ea = s.mat.uniforms.uAmt.value * 0.6, par = ea / (1 - ea);
      const ax = Math.max(Math.abs(tmp.x), s.pw / 2 - hw - s.vw * 0.005 - Math.abs(dx + fx) * par);
      const ay = Math.max(Math.abs(tmp.y), s.ph / 2 - hh - s.vh * 0.005 - Math.abs(dy + fy) * par);
      const nx = clamp(tmp.x + lx, -ax, ax) - tmp.x, ny = clamp(tmp.y + ly, -ay, ay) - tmp.y;
      const kx = lx ? nx / lx : 1, ky = ly ? ny / ly : 1;
      camera.position.x += (dx + fx * 0.9) * kx; camera.position.y += (dy + fy * 0.9) * ky;
      tmp.x += nx; tmp.y += ny;
    }
    camera.lookAt(tmp);
  }
  // strih pre dvojicu susedných záberov: atribút kotvy prichádzajúceho záberu, inak tabuľka
  const cutCache = new Map();
  function cutOf(A, B) {
    const key = A.name + '>' + B.name;
    if (!cutCache.has(key)) {
      const c = parseCut(B.at.dataset.cut || CUTS[key]);
      if (c) c.key = key;
      cutCache.set(key, c);
    }
    return cutCache.get(key);
  }
  const fv = new THREE.Vector3();
  // bod sveta na obrazovke (0 až 1, zľava a zdola) pre kameru, ktorou sa práve kreslilo
  const screenOf = (w) => { fv.set(w[0], w[1], 0).project(camera); return [fv.x * 0.5 + 0.5, fv.y * 0.5 + 0.5]; };

  // prelínanie: v pohybe sleduje skrolovanie, v pokoji sa dokončí na bližší záber (nikdy neostane napoly)
  let fade = 0, fadeK = -1, fadeGoal = 0, still = 0, held = null, dark = false, fadeFreeze = null;   // dark: po skoku sa ide zo šera
  const fin = (s, now) => (s.t0 ? Math.min(1, (now - s.t0) / 450) : 1);   // nábeh práve načítanej fotky
  let mixNow = 0, cutNow = null, sFreeze = null;
  function draw(now, dt) {
    if (!path.length || !compiled) return false;
    keepAround(clamp(Math.round(S), 0, N));
    // videá: posun podľa polohy vo filme (scroll) alebo prehrávanie, kým je záber na obrazovke (play);
    // ešte pred kreslením, aby sa slučka zastavila aj vtedy, keď sa po skoku nový záber ešte načítava
    let vbusy = false;
    for (const s of path) if (s.vel) vbusy = drive(s, now) || vbusy; else if (s.sq) vbusy = seqDrive(s) || vbusy;
    const k = clamp(Math.floor(S), 0, N);
    let A = path[k], B = path[clamp(k + 1, 0, N)];
    // prechod zaberá najviac 30 % cesty medzi kotvami (pri bežnej medzere 1 obrazovka = 0,3 obrazovky skrolu),
    // pri väčších medzerách asi 55 % výšky okna, najmenej 16 %; vždy okolo stredu
    const gap = k < N ? anchors[k + 1] - anchors[k] : innerHeight, span = clamp(0.55 * innerHeight / Math.max(1, gap), 0.16, 0.3);
    // stred prechodu: pri titulnej karte tam, kde sa mení text (horný okraj jej kotvy), inak v polovici
    const c = A !== B && B.cut != null ? clamp((B.cut - anchors[k]) / Math.max(1, gap), span / 2 + 0.02, 1 - span / 2 - 0.02) : 0.5;
    const want = A === B ? 0 : smooth(c - span / 2, c + span / 2, S - k);
    if (k !== fadeK) { fade = want; fadeK = k; }
    // až keď skrolovanie naozaj stojí (nie medzi dvomi zárezmi kolieska), dokončí sa prelínanie;
    // v prológu vedie čas, prelínanie ide presne podľa neho
    still = Math.abs(V) < 0.03 ? still + dt : 0;
    const tl = !!(pro || leaving || outside);               // časová os (prológ, odchod, vonku): prelínanie presne podľa S
    fadeGoal = tl ? want : still > 0.6 ? Math.round(want) : want;
    fade = tl ? want : fade + (fadeGoal - fade) * (1 - Math.pow(0.02, dt));
    if (fadeFreeze != null) { fade = fadeFreeze; fadeGoal = fadeFreeze; }   // ladenie: prechod stojí
    let mix = A === B || !B.ready ? 0 : fade * fin(B, now);
    // prechod je celý na prichádzajúcom zábere (titulná karta po skoku, pol obrazovky pred kotvou):
    // nečaká sa na odchádzajúci záber, ktorý už nie je vidieť
    if (A !== B && !A.ready && B.ready && fade > 0.999) { A = B; mix = 0; }
    // prológ začína vždy svojím záberom (fasáda), nikdy záberom úvodu, keby sa náhodou načítal skôr
    if ((pro || outside) && !A.ready) return false;
    if (!A.ready) {
      // záber sa ešte načítava: ostane posledný obraz, ak je to susedný záber, a cieľ sa doň prelnie.
      // Záber z iného miesta stránky (po skoku) sa neukáže, namiesto neho je šero farby stránky.
      const H = held && held.ready && held.pi != null && Math.abs(held.pi - k) <= 1 ? held : B.ready && !dark ? B : null;
      if (!H) { if (shown) { renderer.setRenderTarget(null); renderer.clear(); held = null; } return false; }
      A = H; mix = B.ready && B !== A ? fin(B, now) : 0;
    } else if (held && held !== A && held !== B && held.ready && fin(A, now) < 1) { B = A; A = held; mix = fin(B, now); }
    else if (dark && fin(A, now) < 1) { B = A; A = null; mix = fin(B, now); }   // zo šera po skoku
    if (dark && A && A.ready && fin(A, now) >= 1) dark = false;
    if (mix >= 0.999) { A = B; mix = 0; }
    if (!A && mix <= 0.001) { renderer.setRenderTarget(null); renderer.clear(); return true; }
    if (mix > 0.001) {
      // prelínanie: oba zábery do textúr a spolu na obrazovku (bez prvého záberu len šero)
      vig.value.w = 0;
      // strih medzi susednými zábermi (po skoku či pri čakaní na fotku len pôvodné prelínanie)
      let cut = A && B.pi === A.pi + 1 ? cutOf(A, B) : null;
      const pu = post.material.uniforms;
      // popredie potrebuje hĺbku záberu, ktorému predmet patrí; záber bez nej (video) dostane pokračovanie pohybu
      if (cut && cut.k === 4 && (cut.own === 'b' ? B : A).mat.uniforms.uDepth.value === flat) cut = cut.alt || (cut.alt = Object.assign({}, cut, { k: 1, name: 'pohyb', rev: false }));
      cutNow = cut;
      // hĺbka sa pri prechode otvorí: blízke veci odchádzajúceho záberu sa posúvajú viac (prechádzajú popri
      // tebe), prichádzajúci záber sa z otvorenej hĺbky usadí na bežnú; popri predmete výraznejšie
      const amp = cut && cut.k === 4 ? CK.amp : 0.1;
      if (A) A.mat.uniforms.uAmt.value = AMT + amp * mix;
      B.mat.uniforms.uAmt.value = AMT + amp - amp * mix;
      let fA = [0.5, 0.5], fB = [0.5, 0.5];
      renderer.setRenderTarget(rtA); renderer.clear();
      if (A) {
        A.mesh.visible = true; place(A, now, mix, cut); renderer.render(scene, camera); A.mesh.visible = false;
        if (cut) fA = screenOf(cut.a ? ptOf(A, cut.a) : [A.eye.x, A.eye.y]);   // bod strihu tak, ako ho vidí kamera
      }
      renderer.setRenderTarget(rtB); renderer.clear();
      B.mesh.visible = true; place(B, now, -(1 - mix), cut); renderer.render(scene, camera); B.mesh.visible = false;
      if (cut) fB = screenOf(cut.b ? ptOf(B, cut.b) : [B.eye.x, B.eye.y]);
      if (A) A.mat.uniforms.uAmt.value = AMT;
      B.mat.uniforms.uAmt.value = AMT;
      // strih odzadu (odjazd, predmet prichádzajúceho záberu): shader kreslí opačný strih, zábery vymenené, čas naspäť
      const rev = !!(cut && cut.rev), dS = cut ? (rev ? [-cut.dir[0], -cut.dir[1]] : cut.dir) : [0, 0];
      const f1 = rev ? fB : fA, f2 = rev ? fA : fB;
      pu.tA.value = rev ? rtB.texture : rtA.texture; pu.tB.value = rev ? rtA.texture : rtB.texture;
      pu.uKind.value = cut ? cut.k : 0;
      pu.uDir.value.set(dS[0], dS[1]); pu.uFoc.value.set(f1[0], f1[1]); pu.uFoc2.value.set(f2[0], f2[1]);
      pu.uLead.value = 0.5 - (f1[0] - 0.5) * dS[0] - (f1[1] - 0.5) * dS[1];   // hrana predmetu v smere jeho letu (−smer kamery)
      pu.uMix.value = rev ? 1 - mix : mix;
      renderer.setRenderTarget(null); renderer.clear();
      renderer.render(postScene, postCam);
    } else {
      // jeden záber: rovno na obrazovku s vinetáciou, jeden prechod namiesto dvoch
      vig.value.w = 1;
      renderer.setRenderTarget(null); renderer.clear();
      A.mesh.visible = true; place(A, now, 0); renderer.render(scene, camera); A.mesh.visible = false;
    }
    mixNow = mix; frameDrawn = true; frames++;
    held = mix > 0.5 ? B : A;
    showPlace(held);
    onScreen = new Set((mix > 0.001 ? [A, B] : [A]).filter(Boolean));
    drawn = true;
    // ešte beží prelínanie alebo nábeh novej fotky: kresliť ďalej
    return vbusy || Math.abs(fadeGoal - fade) > 0.002 || (mix > 0.001 && mix < 0.999) || !A || fin(A, now) < 1;
  }
  let drawn = false, frames = 0;                             // frames: počet nakreslených snímok (ladenie)

  /* ---------- adaptívna kvalita: aspoň 60 snímok za sekundu, inak frekvencia displeja (až 240 Hz), čo najostrejšie ----------
     meria sa medián a 90. percentil dĺžky snímky za 30 snímok. Keď film nedrží aspoň 60 snímok (alebo
     frekvenciu displeja, ak je nižšia), rozlíšenie klesne o 0,25 (najnižšie 1x); keď beží plnou frekvenciou
     displeja s rezervou, po 8 s bez poklesu sa o 0,25 vráti k ostrosti. Strop 30 snímok už nie je.
     Najkratšia snímka zariadenia = frekvencia displeja (60, 90, 120, 144, 240 Hz; 30 Hz pri šetrení energie nie je „pomalé“). */
  let fastest = 0, lowAt = 0;
  const ft = [];
  function quality(dt, now) {
    // pri nahrávaní fotiek do grafiky a počas prológu či odchodu sa nemeria: dlhé snímky z nahrávania by
    // zmenili rozlíšenie uprostred úvodu (viditeľný skok), meria sa až bežné skrolovanie
    if (jobs.length || pro || leaving) { ft.length = 0; return; }
    if (dt <= 0 || dt >= 0.1) return;
    fastest = fastest ? Math.min(fastest, dt) : dt;
    ft.push(dt); if (ft.length < 30) return;
    ft.sort((a, b) => a - b);
    const med = ft[15], p90 = ft[27]; ft.length = 0;
    const hz = Math.max(fastest, 1 / 250);                   // interval displeja (60 až 240 Hz)
    if (med > Math.max(hz * 1.3, 1 / 55) || p90 > Math.max(hz * 2.2, 1 / 40)) {
      if (dpr > DPR_MIN) { dpr = Math.max(DPR_MIN, Math.round((dpr - 0.25) * 4) / 4); lowAt = now; resize(); }
    } else if (dpr < DPR_MAX && med < hz * 1.08 && p90 < hz * 1.5 && now - lowAt > 8000) {
      dpr = Math.min(DPR_MAX, Math.round((dpr + 0.25) * 4) / 4); resize();
    }
  }

  let cw = 0, ch = 0, cd = 0, compiled = false, firstMs = 0;
  function resize() {
    // plátno má výšku veľkého výrezu (100lvh), takže lišta prehliadača na mobile ho pri skrolovaní nemení
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    if (w !== cw || h !== ch || dpr !== cd) {
      cw = w; ch = h; cd = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      rtA.setSize(canvas.width, canvas.height); rtB.setSize(canvas.width, canvas.height);
      // nový render target pri prvom použití čaká na grafiku: overí sa hneď, v tej istej snímke ako zmena
      // rozlíšenia, a nie o chvíľu neskôr uprostred skrolu pri najbližšom prelínaní
      for (const rt of [rtA, rtB]) { renderer.setRenderTarget(rt); renderer.clear(); }
      renderer.setRenderTarget(null);
      post.material.uniforms.uAspect.value = w / h;
      post.material.uniforms.uRes.value.set(canvas.width, canvas.height);
      vig.value.set(1 / canvas.width, 1 / canvas.height, w / h, vig.value.w);
      layout();
    }
    measure(); wake();
  }
  function frame(now) {
    raf = 0;
    if (!running || lost) return;
    if (jobs.length) pump(4);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
    const T = targetS();
    frameDrawn = false;
    if (sFreeze != null) { S = sFreeze; V = 0; }               // ladenie: film stojí na danom mieste prechodu
    else if (pro) {
      // prológ: polohu vo filme vedie čas, nie pružina; skrolovanie ho hneď ukončí a ďalej vedie pružina
      // (pri opakovanom vojdení z ulice až pri posune cez pol obrazovky, aby nudge kolieskom nezrušil chôdzu)
      if (Math.abs(T - 1) > (pro.fast ? 0.5 : 0.02)) endPro(false);
      else if (pro.t0) S = proS(now);
      V = 0;
    } else if (leaving) {
      // odchod von: kamera ide z úvodu cez dvere na ulicu (S 1 -> 0); skrolovanie odchod zruší
      if (Math.abs(T - 1) > 0.02) cancelLeave();
      else if (leaving.t0) {
        const e = clamp((now - leaving.t0) / leaving.dur, 0, 1);
        S = 1 - easeIO(e);
        if (e >= 1) { leaving = null; outside = true; S = 0; root.classList.add('outside'); root.classList.remove('pro'); }
      }
      V = 0;
    } else if (outside) {
      // stojí sa pred podnikom; skrolovanie stránky znamená vojsť dnu (pružina prejde cez dvere)
      if (Math.abs(T - 1) > 0.02) { outside = false; root.classList.remove('outside'); if (PRO) PRO.done = true; }
      else { S = 0; V = 0; }
    } else {
      // kriticky tlmená pružina: plynulé rozbehnutie aj dobehnutie, žiadne trhnutie pri rýchlom skrole
      const w0 = 6.5;                                          // kamera dobehne skrol asi za 0,7 s (predtým 4,2 = 1,1 s, pôsobilo pomaly); zárezy kolieska sa stále zlejú
      V += ((T - S) * w0 * w0 - 2 * w0 * V) * dt; S += V * dt;
      if (Math.abs(T - S) < 0.0004 && Math.abs(V) < 0.0004) { S = T; V = 0; }
      // skok cez menu alebo tlačidlo: žiadna jazda cez celý podnik ani cudzie zábery; film je hneď na cieli
      // a jeho záber sa rozsvieti zo šera, len čo je načítaný (posledný záber zďaleka sa už neukáže)
      if (Math.abs(T - S) > 1.5) { S = T; V = 0; held = null; dark = shown; }
    }
    pmx += (mx - pmx) * (1 - Math.pow(0.02, dt)); pmy += (my - pmy) * (1 - Math.pow(0.02, dt));
    const idle = now - lastInput;
    breath = idle < BREATH_MS ? 1 : Math.max(0, 1 - (idle - BREATH_MS) / 3000);
    const active = idle < FULL_MS;                             // nedávny pohyb: kresliť každú snímku
    const busy = draw(now, dt);
    if (drawn && !shown) {
      shown = true; shownAt = now; firstMs = Math.round(performance.now() - tStart);
      requestAnimationFrame(() => { root.classList.add('world-in'); measurePlace(); wake(); readyDone(true); });
    }
    // prológ a odchod bežia od prvého snímku, v ktorom je záber fasády nakreslený; chôdza začne až keď je
    // načítaný aj záber úvodu (inak by kamera pri dverách čakala a úvod by nebol jeden plynulý pohyb);
    // pred podnikom sa stojí najviac 1,5 s (úvod nemá zdržiavať), potom sa ide aj tak a proS počká pri dverách
    if (pro && !pro.t0 && frameDrawn && PRO && PRO.ready) {
      if (!pro.seen) pro.seen = now;
      const hero = path[1];
      if ((hero && hero.ready) || now - pro.seen > 1500) pro.t0 = now;
    }
    if (leaving && !leaving.t0 && frameDrawn && PRO && PRO.ready) leaving.t0 = now;
    // fasáda neprišla (pomalá sieť): odchod aj opakované vojdenie sa po 12 s vzdajú a stránka ide ďalej normálne
    if (leaving && !leaving.t0 && now - leaving.since > 12000) cancelLeave();
    if (pro && !pro.t0 && !pro.seen && pro.since && now - pro.since > 12000) endPro(false);
    // prológ sa skončil: film stojí na zábere úvodu a ďalej vedie skrolovanie
    if (pro && pro.t0 && S >= 1) endPro(true);
    // naklonenie telefónu dobehne v pokojových 30 snímkach za sekundu, myš na počítači plynulo
    const moving = !!pro || !!leaving || active || busy || jobs.length > 0 || (!outside && Math.abs(T - S) > 0.0004) || Math.abs(V) > 0.0004 || (!phone && (Math.abs(mx - pmx) > 0.0008 || Math.abs(my - pmy) > 0.0008));
    if (!shown) {
      // prvý záber ešte nie je: čakať, a keď nič nepríde (sieť), vrátiť pokojný web.
      // Prológ, ktorý nepríde do 7 s (pomalá sieť), sa vynechá a film začne rovno záberom úvodu.
      if (pro && now - started > 7000) endPro(false);
      if (now - started > 15000) { stop(); return; }
      if (jobs.length) wake(); else setTimeout(wake, 120);   // fotka ide do grafiky: ďalší pás hneď v ďalšej snímke
      last = 0;
    } else if (moving || breath > 0) { quality(dt, now); if (!raf) raf = requestAnimationFrame(frame); }   // plnou frekvenciou displeja
    else last = 0;
  }
  function wake() { if (!raf && running && !lost) raf = requestAnimationFrame(frame); }
  const poke = () => { lastInput = performance.now(); wake(); };

  /* ---------- prológ: úvod ako film ----------
     čas -> poloha S v ceste: 0 = záber prológu (fasáda), 1 = záber úvodu. Najprv chôdza k dverám
     (S 0 -> 0,35, pomalý rozbeh aj dobeh), potom cez šero dnu (prelínanie je medzi 0,35 a 0,65) a
     dojazd na kotvu úvodu. Kým nie je záber úvodu načítaný, kamera pri dverách počká (najviac 4 s). */
  // kratší úvod (majiteľ 2026‑10‑11: úvod bol dlhý): chôdza 1,3 s a vstup 1,0 s na telefóne
  const proMs = () => ({ t0: 0, walk: phone ? 1300 : 1100, into: phone ? 1000 : 900, wait: 0 });
  let pro = PRO && proArmed ? proMs() : null;
  /* návrat na otváraciu scénu (rozhodnutie majiteľa): z vrchu stránky sa dá vyjsť von na ulicu
     (tlačidlo „Späť na ulicu“, potiahnutie nadol na vrchu, koliesko nahor, šípka hore) – kamera prejde
     cez dvere von (leaving, časová os 1 -> 0) a ostane stáť pred podnikom (outside, S = 0, pásy ostávajú).
     Z ulice sa vojde dnu tlačidlom „Vojdi dnu“, potiahnutím nahor, kolieskom nadol alebo skrolovaním:
     prológ sa pustí znova (startPro). Bežné skrolovanie z ulice preruší prológ až pri väčšom posune. */
  let outside = false, leaving = null, frameDrawn = false;
  const easeIO = (x) => x * x * (3 - 2 * x);
  function startPro(fast) {
    if (!PRO || pro) return false;
    leaving = null; outside = false; root.classList.remove('outside');
    PRO.done = false; load(PRO);
    pro = proMs(); pro.since = performance.now(); if (fast) { pro.walk *= 0.65; pro.into *= 0.75; pro.fast = true; }
    S = 0; V = 0; held = null; fadeK = -1; dark = false;
    root.classList.add('pro');
    if (scrollY > 0) jumpTo(0);
    sy = Math.max(0, scrollY); lastInput = performance.now(); wake(); return true;
  }
  function leave() {
    // stačí stáť na vrchu stránky; pružina S dobehne na 1 sama, odchod začne až keď je fasáda načítaná
    if (!PRO || pro || leaving || outside || !shown || scrollY > 4) return false;
    PRO.done = false; load(PRO);
    leaving = { t0: 0, dur: phone ? 2200 : 1900, since: performance.now() };
    root.classList.add('pro');                              // pásy dnu, výzva na skrol preč
    lastInput = performance.now(); wake(); return true;
  }
  function cancelLeave() {
    leaving = null; outside = false; root.classList.remove('outside', 'pro');
    if (PRO) PRO.done = true;
  }
  const ease = (t) => t * t * (3 - 2 * t), easeOut = (t) => 1 - (1 - t) * (1 - t);
  function proS(now) {
    if (pro.freeze != null) return pro.freeze;               // ladenie: prológ stojí na danej polohe
    // jedna plynulá krivka: pomalý rozbeh na chodníku, najrýchlejšie v dverách (tam je prelínanie),
    // pomalý dojazd na rohožke; kamera v dverách nezastaví
    const total = pro.walk + pro.into, el = now - pro.t0 - pro.wait;
    const s = ease(clamp(el / total, 0, 1));
    const hero = path[1];
    // záber úvodu ešte nie je načítaný: kamera počká pred dverami (S 0,33 = 38,6 % času), najviac 4 s
    if (s > 0.33 && !(hero && hero.ready) && now - pro.t0 < total + 4000) { pro.wait = (now - pro.t0) - 0.386 * total; return 0.33; }
    return s;
  }
  function endPro(finished) {
    if (!pro) return;
    pro = null;
    if (finished) { S = 1; V = 0; }
    else if (!shown) { S = targetS(); V = 0; held = null; fadeK = -1; }   // prológ sa ani nezačal: film začne tam, kde návštevník je
    if (PRO) PRO.done = true;                                 // uvoľní sa, len čo zíde z obrazovky (keepAround)
    root.classList.remove('pro');                            // filmové pásy sa odsunú (style.css)
    lastInput = performance.now(); wake();
  }

  /* ---------- udalosti; všetko sa dá naraz odpojiť, keď film skončí ---------- */
  const ac = new AbortController();
  const on = (t, e, f, o) => t.addEventListener(e, f, Object.assign({ passive: true, signal: ac.signal }, o));
  // poloha skrolu sa číta hneď na začiatku udalosti (zachytávanie, pred ostatnými poslucháčmi), keď je
  // štýl ešte čistý; čítanie scrollY v snímke až po zápisoch iných skriptov by vynútilo prepočet štýlu
  // záporný scrollY je odraz (Safari), nie poloha v stránke; topSince = odkedy stránka stojí na vrchu
  let topSince = scrollY <= 4 ? performance.now() : 0;
  on(window, 'scroll', () => { sy = Math.max(0, scrollY); if (sy > 4) topSince = 0; else if (!topSince) topSince = performance.now(); poke(); }, { capture: true });
  const atTopSettled = () => scrollY <= 4 && topSince && performance.now() - topSince > 350;
  on(window, 'resize', resize);
  // skutočný pohyb návštevníka: až potom sa sťahujú videá (meranie stránky bez pohybu ich nestiahne)
  const moved = () => { if (!userMoved) { userMoved = true; wake(); } };
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((t) => on(window, t, moved));
  // úsporný režim (iPhone) nedovolí video spustiť samo, ťuknutie je však gesto: skúsi sa znova v ňom;
  // video riadené skrolovaním sa pri prvom geste raz pustí a zastaví (Safari potom dodáva snímky aj pri posune)
  const gesture = () => SHOTS.forEach((s) => {
    const v = s.vel; if (!v) return;
    if (s.video.mode === 'play' && s.vblock && onScreen.has(s)) { s.vblock = false; v.play().catch(() => { s.vblock = true; }); }
    // úsporný režim: ťuknutie odomkne aj videá, ktoré ešte nie sú na obrazovke (pustia sa a hneď zastavia),
    // aby sa neskôr rozbehli samé a neostal namiesto nich stáť plagát
    else if (s.video.mode === 'play' && !s.vunlock && !onScreen.has(s)) { s.vunlock = true; v.play().then(() => { s.vblock = false; if (!onScreen.has(s)) v.pause(); }, () => {}); }
    else if (s.video.mode === 'scroll' && !s.vunlock && v.readyState < 2) { s.vunlock = true; v.play().then(() => { v.pause(); s.vwant = -1; wake(); }, () => {}); }
  });
  on(window, 'touchend', gesture); on(window, 'click', gesture);
  on(window, 'touchstart', poke);
  if (!phone) on(window, 'pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = -(e.clientY / innerHeight - 0.5); poke(); });
  // telefón: pri naklonení sa perspektíva jemne pohne ako pri pohľade do skutočnej miestnosti.
  // iPhone by na to potreboval povolenie, preto sa tam nepýtame a obraz ostáva len so skrolovaním.
  if (phone && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    let b0 = null, g0 = null;
    on(window, 'deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null || performance.now() - lastInput > BREATH_MS) return;
      // beta a gamma sú viazané na telefón, nie na obrazovku: na šírku sa osi vymenia
      const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let gx = e.gamma, by = e.beta;
      if (ang === 90) [gx, by] = [by, -gx]; else if (ang === 270 || ang === -90) [gx, by] = [-by, gx];
      if (b0 == null) { b0 = by; g0 = gx; }
      // základ sa pomaly dorovná, aby obraz neostal vychýlený, keď telefón držíš inak
      b0 += (by - b0) * 0.01; g0 += (gx - g0) * 0.01;
      const nx = clamp((gx - g0) / 24, -0.5, 0.5), ny = clamp((by - b0) / 24, -0.5, 0.5);
      // mŕtva zóna asi 0,7°: chvenie ruky obraz nerozhýbe
      if (Math.abs(nx - mx) > 0.03 || Math.abs(ny - my) > 0.03) { mx = nx; my = ny; wake(); }
    });
    if (screen.orientation) on(screen.orientation, 'change', () => { b0 = g0 = null; });
  }
  on(d, 'visibilitychange', () => { running = !d.hidden; if (running) { last = 0; poke(); } });
  // návrat na otváraciu scénu: tlačidlo v úvode, koliesko nahor na vrchu, potiahnutie nadol na vrchu, šípka hore;
  // z ulice dnu: tlačidlo, koliesko nadol, potiahnutie nahor, šípka dole alebo medzerník
  const door = d.querySelector('.film-door');
  if (door) on(door, 'click', () => { if (outside) startPro(true); else leave(); });
  // gestá neplatia, keď je otvorené menu alebo lightbox (stránka je zamknutá), ani z polí a tlačidiel
  const locked = () => d.body.style.overflow === 'hidden' || d.documentElement.classList.contains('menu-open');
  const typing = (e) => e.target && e.target.closest && e.target.closest('input, textarea, select, button, a, [contenteditable]');
  on(window, 'wheel', (e) => {
    if (locked()) return;
    if (e.deltaY < -8 && atTopSettled() && !pro && !leaving && !outside) leave();
    else if (e.deltaY > 8 && outside) startPro(true);
  });
  let ty0 = null;
  on(window, 'touchstart', (e) => { ty0 = e.touches && e.touches[0] ? e.touches[0].clientY : null; });
  on(window, 'touchmove', (e) => {
    if (ty0 == null || !e.touches || !e.touches[0] || locked()) return;
    const dy = e.touches[0].clientY - ty0;
    if (dy > 28 && atTopSettled() && !pro && !leaving && !outside) { if (leave()) ty0 = null; }
    else if (dy < -28 && outside) { startPro(true); ty0 = null; }
  });
  on(window, 'keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || locked() || typing(e)) return;
    if ((e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') && atTopSettled() && !pro && !leaving && !outside) leave();
    else if ((e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') && outside) { e.preventDefault(); startPro(true); }
  }, { passive: false });
  // strata grafického kontextu (málo pamäte): rozrobené pásy sa hneď zrušia (uvoľnia rozbalené fotky),
  // po obnove sa fotky načítajú znova
  on(canvas, 'webglcontextlost', (e) => { e.preventDefault(); lost = true; while (jobs.length) jobs.shift()(); }, { passive: false });
  on(canvas, 'webglcontextrestored', () => {
    lost = false;
    SHOTS.forEach((s) => { if (s.video) { detach(s, false); s.pmap = null; } if (s.loading) s.ctl.abort(); s.loading = null; s.ready = false; s.size = 0; s.drt = null; s.mat.uniforms.uMap.value = blank; s.mat.uniforms.uDepth.value = flat; });
    cw = 0; resize();
  });
  // obsah stránky mení výšku (fotky, rozbalené karty, menu), kotvy sa preto prepočítajú
  let mt;
  const ro = new ResizeObserver(() => { clearTimeout(mt); mt = setTimeout(() => { measure(); wake(); }, 150); });
  ro.observe(d.body);
  function stop() {
    running = false; ac.abort(); ro.disconnect(); clearTimeout(mt); jobs = [];
    if (raf) cancelAnimationFrame(raf);
    SHOTS.forEach(drop);
    SHOTS.forEach((s) => { if (s.vblob) s.vblob.then((u) => URL.revokeObjectURL(u), () => {}); s.vblob = null; });
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) { /* nič */ }
    canvas.remove(); placeBox.remove(); quit();
  }

  /* ---------- ladenie: window.BS30_FILM ---------- */
  // goTo(meno, t): skočí na záber bez jazdy; t 0..1 je poloha v jeho pohybe kamery (0,5 = kotva),
  // drží sa mimo prelínania, aby bol záber celý. Vráti false, keď taký záber v stránke nie je.
  api.goTo = (name, t = 0.5) => {
    const s = path.find((x) => x.photo === name || x.photo === name + '-m');   // na telefóne je záber výrez -m
    if (!s) return false;
    const k = s.pi, a = anchors[k], gap = k < N ? anchors[k + 1] - a : (k > 0 ? a - anchors[k - 1] : innerHeight);
    const y = Math.max(0, Math.round(a + (clamp(t, 0, 1) - 0.5) * 0.7 * gap));
    jumpTo(y);
    sy = Math.max(0, scrollY); S = targetS(); V = 0; still = 1; held = null; fadeK = -1; lastInput = performance.now(); wake();
    return true;
  };
  // proFreeze(s): prológ zastaví na polohe s (0 fasáda, 1 úvod) pre snímky; proFreeze(null) ho pustí ďalej
  // od toho miesta. Vráti false, keď prológ nebeží.
  api.proFreeze = (s) => {
    if (!pro) return false;
    if (s == null) { if (pro.freeze != null) { const f = pro.freeze; let x = f; for (let i = 0; i < 8; i++) x -= (ease(x) - f) / Math.max(1e-3, 6 * x * (1 - x)); pro.t0 = performance.now() - clamp(x, 0, 1) * (pro.walk + pro.into); pro.wait = 0; } pro.freeze = null; }
    else pro.freeze = clamp(s, 0, 1);
    wake(); return true;
  };
  // fadeFreeze(v): prechod medzi aktuálnym a ďalším záberom zastaví na v (0 až 1) pre snímky; null pustí ďalej
  api.fadeFreeze = (v) => { fadeFreeze = v == null ? null : clamp(v, 0, 1); still = 0; wake(); return true; };
  /* cutFreeze(meno, mix): prechod zo záberu meno (pro = prológ) do nasledujúceho zastaví na mix (0 až 1) aj s kamerou
     na tom mieste cesty, kde sa pri skrolovaní tento mix kreslí; cutFreeze(null) pustí ďalej. dbg(1|2): hĺbka A|B */
  api.dbg = (v) => { post.material.uniforms.uDbg.value = v; wake(); };
  // pause(true): film prestane kresliť (posledný snímok ostane), pause(false) pokračuje; pre snímky pri pomalej grafike
  api.pause = (v) => { running = !v && !d.hidden; if (running) { last = 0; wake(); } return true; };
  api.cutFreeze = (name, v) => {
    if (name == null) { sFreeze = null; fadeFreeze = null; still = 0; wake(); return true; }
    const s = name === 'pro' ? path[0] : path.find((x) => !x.pro && (x.photo === name || x.photo === name + '-m'));
    if (!s || s.pi >= N) return false;
    if (s.pro) { s.done = false; load(s); }                   // prológ, ktorý už prebehol, sa na snímku znova načíta
    const k = s.pi, gap = anchors[k + 1] - anchors[k], span = clamp(0.55 * innerHeight / Math.max(1, gap), 0.16, 0.3);
    const m = clamp(v, 0, 1);
    // poloha v ceste, kde je prechod presne na m (inverzia smoothstep)
    let u = m; for (let i = 0; i < 30; i++) u -= (u * u * (3 - 2 * u) - m) / Math.max(1e-3, 6 * u * (1 - u)); u = clamp(u, 0, 1);
    if (m <= 0) u = 0; if (m >= 1) u = 1;
    sFreeze = k + 0.5 - span / 2 + u * span; fadeFreeze = m; still = 0;
    if (!s.pro) jumpTo(Math.max(0, Math.round(anchors[k] + (sFreeze - k) * gap)));
    sy = Math.max(0, scrollY); held = null; fadeK = -1; lastInput = performance.now(); wake();
    return true;
  };
  Object.defineProperty(api, 'cuts', { get: () => path.slice(0, -1).map((s, i) => { const c = cutOf(s, path[i + 1]); return { from: s.name, to: path[i + 1].name, cut: c ? c.name : 'prelinanie', dir: c && c.dir, rev: !!(c && c.rev) }; }) });
  // uvod.von(): kamera vyjde na ulicu a ostane tam; uvod.znova(): prológ (vojdenie dnu) znova
  api.uvod = { von: leave, znova: () => startPro(outside) };
  Object.defineProperty(api, 'state', {
    get: () => ({
      on: true, shown, phone, dpr, S, T: targetS(), mix: mixNow, cut: cutNow && mixNow > 0 ? cutNow.key + ' ' + cutNow.name : null, frames, anchors: anchors.slice(), firstFrameMs: firstMs, pro: !!pro, leaving: !!leaving, outside,
      current: path[clamp(Math.round(S), 0, N)] && path[clamp(Math.round(S), 0, N)].photo,
      ready: path.map((s) => ({ shot: s.photo, ready: s.ready, size: s.size, loading: !!s.loading, depth: s.drt ? [s.drt.width, s.drt.height] : null })),
      userMoved,
      seq: path.filter((s) => s.video && s.video.mode === 'seq').map((s) => ({ shot: s.photo, on: !!s.sq, got: s.sqBlobs ? s.sqBlobs.filter(Boolean).length : 0, n: s.video.n, lo: s.sq ? s.sq.lo : -1, hi: s.sq ? s.sq.hi : -1, mix: +s.mat.uniforms.uMix.value.toFixed(3), tex: s.sq ? [...s.sq.tex.keys()].join(',') : '', up: s.sq ? s.sq.up.length : 0, dec: s.sq ? s.sq.dec.size : 0, t: +shotT(s).toFixed(3) })),
      video: path.filter((s) => s.video).map((s) => ({ shot: s.photo, mode: s.video.mode, src: s.vel ? s.vel.currentSrc.split('/').pop() : null, rs: s.vel ? s.vel.readyState : null, t: s.vel ? +s.vel.currentTime.toFixed(3) : null, want: +(s.vwant || 0).toFixed(3), seeking: s.vel ? s.vel.seeking : null, paused: s.vel ? s.vel.paused : null, live: !!s.vlive, poster: !!s.pmap, blocked: !!s.vblock, fail: !!s.vfail, netErr: !!s.vneterr, onScreen: onScreen.has(s) })),
    }),
  });

  maxTex = renderer.capabilities.maxTextureSize || 4096;
  await new Promise((r) => setTimeout(r, 0));                  // vytvorenie grafiky a meranie stránky nie v jednej dlhej úlohe
  resize();
  S = targetS();
  if (pro) { S = 0; V = 0; }                                   // prológ začína záberom fasády
  // prvé použitie shaderu čaká na grafiku: shadery sa preložia vopred a bez čakania
  // (KHR_parallel_shader_compile), nie až pri prvom zábere či prelínaní počas skrolu
  try { await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(postScene, postCam)]); } catch (e) { /* preloží sa pri prvom kreslení */ }
  compiled = true;
  // prvý obraz až keď je načítaný záber na mieste, kde návštevník je; potom sa statická fotka prelnie do filmu
  wake();
})();
