/*
 * BARBERSHOP 30 – režisér stránky (docs/CONTRACT.md §3, §6; docs/TOUR_DIRECTION.md; docs/ART_DIRECTION.md §8).
 *
 * Jediný zdroj pravdy je scroll. Jedna slučka requestAnimationFrame číta window.scrollY, počíta celkový
 * progress a lokálne t každého záberu (.film-shot), zapisuje CSS premenné priamo na prvky, ktoré ich čítajú
 * (img zálohy, .title-frame, .film-still; nikdy na <html> ani na kotvu, odkiaľ by sa dedili do celého podstromu),
 * prepína stavy (is-in, aktívna kapitola v aria-current, lišta, linka príbehu, mobilné CTA) a riadi tiché
 * videoslučky, menu a lightbox.
 * Film zo skutočných fotiek (assets/film.js) je samostatný modul: číta kotvy .film-shot a triedy world /
 * world-in / world-off na <html> – tento súbor ich nenastavuje ani nečíta.
 * Žiadne externé požiadavky, žiadna analytika, žiadne globálne premenné
 * (iba window.__renderDone / window.__scrollSettled pre source/shot.mjs a testy).
 */

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease01 = (v) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
// titulná karta: nábeh a odchod ako podiel jej voľnej dĺžky (referencia: nový text za 0,12 až 0,18 obrazovky, starý za 0,1)
const CARD_IN = 0.12, CARD_OUT = 0.08;

// shot.mjs čaká, kým nebude true – stránka je čitateľná hneď po prvom nastavení stavu (bez 3D)
window.__renderDone = false;
window.__scrollSettled = false; // true, keď slučka dobehla cieľ (scrollY) – testy čakajú na túto hodnotu

/* ----------------------------------------------------------------------------
   1. Brána pohybu
   ---------------------------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqMobile = matchMedia('(max-width: 900px)');
const mqFinePointer = matchMedia('(hover: hover) and (pointer: fine)');
const deviceMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : undefined;

const motionOff = params.get('motion') === 'off'
  || (params.get('motion') !== 'on' && (
    mqReduced.matches
    || !!navigator.connection?.saveData
    || (deviceMemory !== undefined && deviceMemory < 4)
  ));
const motionOn = !motionOff;
html.dataset.motion = motionOn ? 'on' : 'off';

/* ----------------------------------------------------------------------------
   2. DOM
   ---------------------------------------------------------------------------- */
const header = $('.site-header');
const navToggle = $('.nav-toggle');
const nav = $('#nav') || $('.nav');
const storyLine = $('.story-line');
const storyLinks = storyLine ? $$('a[data-chapter]', storyLine) : [];
const navLinks = nav ? $$('a[href^="#"]', nav) : [];
const mobileCta = $('#mobile-cta');
const footer = $('.site-footer');

/* ----------------------------------------------------------------------------
   3. Meranie rozsahov (resize, obrázky, fonty)
   ---------------------------------------------------------------------------- */
let vh = window.innerHeight;
let maxScroll = 1;
let shots = [];     // .film-shot: { el, top, height, items: [{ el, a, b }] }
let sections = [];  // section[data-scene]: { el, scene, id, top, height }
let lastScene = 0;  // číslo poslednej kapitoly (rezervácia) – tam sa skryje mobilné CTA
let footerBox = null;
let titles = [];    // kotvy s titulnou kartou v poradí dokumentu (zábery bez filmu sa prelínajú medzi nimi)
let pricesBox = null; // pás cenníka: tam sa plávajúce tlačidlo skryje (každá služba má vlastné Objednať)

function parseAt(value) {
  const parts = String(value || '').split(',').map((s) => parseFloat(s));
  const a = Number.isFinite(parts[0]) ? parts[0] : 0;
  const b = Number.isFinite(parts[1]) ? parts[1] : 1;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

function measure() {
  vh = window.innerHeight || 1;
  const scrollH = Math.max(html.scrollHeight, document.body?.scrollHeight || 0);
  maxScroll = Math.max(1, scrollH - vh);
  const y = window.scrollY || 0;

  sections = $$('section[data-scene]').map((el) => {
    const r = el.getBoundingClientRect();
    return { el, id: el.id, scene: Number(el.dataset.scene) || 0, top: r.top + y, height: r.height };
  });
  lastScene = sections.reduce((m, s) => Math.max(m, s.scene), 0);

  shots = $$('.film-shot').map((el) => {
    const r = el.getBoundingClientRect();
    const items = $$('[data-at]', el).map((node) => ({ el: node, ...parseAt(node.dataset.at) }));
    // titulná karta (P11): first = úvod, ten je viditeľný hneď od vrchu stránky (bez nábehu)
    const top = r.top + y, title = el.classList.contains('is-title');
    // voľná dĺžka karty: celá kotva, pri .title-long (za kartou je pás) bez poslednej výšky okna
    const free = Math.max(1, r.height - (el.classList.contains('title-long') ? vh : 0));
    // prvky, ktoré premenné čítajú (style.css, @property bez dedenia): --sp img zálohy, --o rám karty, --so záloha
    return { el, top, height: Math.max(1, r.height), items, title, free, first: title && top < 1,
      img: el.querySelector('.film-still img'), fr: el.querySelector('.title-frame'), st: el.querySelector('.film-still') };
  });

  const pr = $('.band-prices');
  if (pr) { const r = pr.getBoundingClientRect(); pricesBox = { top: r.top + y, bottom: r.bottom + y }; }

  titles = shots.filter((s) => s.title);

  if (footer) {
    const r = footer.getBoundingClientRect();
    footerBox = { top: r.top + y, height: r.height };
  }
}

/* ----------------------------------------------------------------------------
   4. Zápis CSS premenných a stavov (len pri zmene)
   ---------------------------------------------------------------------------- */
const varCache = new Map();
function setVar(name, value, el = html) {
  const v = clamp01(value);
  // posledná zapísaná hodnota pre každú premennú zvlášť (kotva má --sp aj --o)
  const cache = el === html ? varCache : (el.__v || (el.__v = new Map()));
  const last = cache.get(name);
  // zapisuj len pri zmene > 0.002; krajné hodnoty 0 a 1 vždy dosadni presne
  if (last !== undefined && Math.abs(v - last) <= 0.002 && !((v === 0 || v === 1) && v !== last)) return;
  cache.set(name, v);
  el.style.setProperty(name, v.toFixed(4));
}

function setClass(el, cls, on) {
  if (!el) return;
  if (el.classList.contains(cls) !== !!on) el.classList.toggle(cls, !!on);
}

function setAttr(el, name, value) {
  if (!el) return;
  if (value === null || value === undefined) { if (el.hasAttribute(name)) el.removeAttribute(name); return; }
  if (el.getAttribute(name) !== String(value)) el.setAttribute(name, String(value));
}

/* ----------------------------------------------------------------------------
   5. Stav slučky
   ---------------------------------------------------------------------------- */
let targetP = 0;       // skutočný progress zo scrollY
let shownP = 0;        // zobrazený (dobieha lerpom)
let rafId = 0;
let lastFrame = 0;
let snapUntil = performance.now() + 600; // do tohto času sa stav nastavuje okamžite (bez lerpu)
let menuOpen = false;
let activeScene = 0;
let lastHeaderScrolled = null;

let curY = 0;
function readTarget() {
  curY = window.scrollY || 0;
  targetP = clamp01(curY / maxScroll);
}

// Aktívna sekcia: tá, v ktorej leží bod 40 % výšky okna (sekcie sú rôzne dlhé – záber + pás);
// pred prvou je prvá, za poslednou posledná. Pätička vyhráva pre navigáciu, keď bod leží v nej.
function closestSection(y) {
  const mark = y + vh * 0.4;
  let best = null;
  for (const s of sections) {
    if (mark >= s.top && mark < s.top + s.height) { best = s; break; }
    if (mark < s.top) { best = best || s; break; }
    best = s;
  }
  const footerWins = !!(footerBox && footerBox.height > 0 && mark >= footerBox.top);
  return { section: best, footerWins };
}

// --sp (jemný prejazd zálohy 1 → 1.06) číta len pokojná verzia s pohybom: s filmom (world, kým nezlyhá),
// s rámovaním prvého snímku filmu (world-frame) aj pri obmedzenom pohybe má img zálohy transform: none
// (style.css), takže zápis by len zbytočne prepočítaval štýl. Triedy sa menia za behu (film.js), preto sa
// podmienka vyhodnotí v každej snímke (len classList, nevynúti prepočet).
const spNeeded = () => motionOn && !html.classList.contains('world-frame')
  && !(html.classList.contains('world') && !html.classList.contains('world-off'));
// film sa môže vypnúť aj za behu (film.js pridá world-off): stav sa vtedy nastaví hneď, nie až pri ďalšom posune,
// inak by záloha poskočila na správny prejazd až pri prvom skrole
let spLast = spNeeded();
if ('MutationObserver' in window) {
  new MutationObserver(() => { const s = spNeeded(); if (s !== spLast) { spLast = s; snapNow(0); } })
    .observe(html, { attributes: true, attributeFilter: ['class'] });
}

function apply(p) {
  const y = p * maxScroll;
  // výzva a dvere v úvode zmiznú v prvých 2 % skrolu; premenná ide len na kotvu úvodu (na <html> by sa
  // dedila do celej stránky a každý zápis by prepočítal asi 750 prvkov v každej snímke skrolu)
  if (shots[0] && shots[0].first) setVar('--hint', 1 - p / 0.02, shots[0].el);

  // lokálne t záberu: 0 keď stred obrazovky vstúpi na jeho horný okraj, 1 keď vyjde spodným okrajom.
  // Z neho CSS odvodí jemný prejazd zálohy (scale 1 → 1.06, premenná --sp na img zálohy) a stav data-at prvkov.
  const sp = spNeeded();
  for (const s of shots) {
    const t = clamp01((y + vh * 0.5 - s.top) / s.height);
    // --sp titulných kariet zapisuje zabery() len na zálohy v okolí (is-near); ostatné majú display: none
    s.t = t;
    if (sp && s.img && !s.title) setVar('--sp', t, s.img);
    for (const it of s.items) setClass(it.el, 'is-in', t >= it.a && t <= it.b);
    // titulná karta: u = 0 keď horný okraj kotvy dosiahne horný okraj okna (karta sa pripne), 1 keď spodný.
    // Krytie: nábeh 0 až 0,12 (úvod bez nábehu), odchod 0,92 až 1; nikdy sa nehýbe, mení sa len krytie.
    if (s.title) {
      const u = (y - s.top) / s.free;
      const o = Math.min(s.first ? 1 : ease01(u / CARD_IN), 1 - ease01((u - 1 + CARD_OUT) / CARD_OUT));
      setVar('--o', o, s.fr || s.el);
      setClass(s.el, 'is-on', o > 0.01);
    }
  }
  zabery(y, sp);

  // aktívna kapitola: len v aria-current (linka kapitol, navigácia). Atribút data-scene-active na <html> sa
  // nastaví raz pri štarte (CSS testuje len jeho prítomnosť); zmena hodnoty by prepočítala štýl celej stránky.
  const { section, footerWins } = closestSection(y);
  const scene = section ? section.scene : 0;
  if (scene) {
    if (scene !== activeScene) {
      activeScene = scene;
      for (const a of storyLinks) setAttr(a, 'aria-current', Number(a.dataset.chapter) === scene ? 'true' : null);
    }
    const currentHash = footerWins && footer?.id ? `#${footer.id}` : `#${section.id}`;
    for (const a of navLinks) setAttr(a, 'aria-current', a.getAttribute('href') === currentHash ? 'true' : null);
  }

  // lišta, linka príbehu, plávajúce CTA
  const scrolled = curY > 80;                               // nečítať scrollY po zápisoch štýlu
  if (scrolled !== lastHeaderScrolled) { lastHeaderScrolled = scrolled; setClass(header, 'is-scrolled', scrolled); }
  setClass(storyLine, 'is-visible', p > 0.02);
  setClass(mobileCta, 'is-hidden', ctaHidden(y));
}

/* ----------------------------------------------------------------------------
   5b. Zábery bez filmu (ľahký telefón, pokojná verzia, záloha kým film nebeží) – jeden model na jednom mieste:
   - fotky stoja cez celé okno (pevná vrstva), pohyb je len pomalé priblíženie 1 → 1,06 okolo bodu záujmu
     (--sp na img, transform) a prelínanie kariet (--so na .film-still, opacity); oboje riadi skrol, v pokoji sa
     nekreslí nič. Ďalší záber sa prelína navrch počas nábehu svojej karty, predchádzajúci zmizne, až keď je nový celý.
   - fotka sa nikdy neukáže neúplná: záber sa začne prelínať len keď je jeho fotka stiahnutá a dekódovaná
     (img.decode(), pri chybe dekódovania stačí stiahnutá); dovtedy ostáva na obrazovke posledná hotová fotka.
     Keď fotka dobehne neskôr, než ju skrol chcel, dobehne prelínaním 400 ms (trieda is-catch, jediný
     transition) a starú zakryje až potom.
   - poistka len pre úplne prvý obraz: kým nie je dekódovaná žiadna fotka (load to neukončí), úvod (fotka z HTML,
     predčítaná v hlavičke) sa ukazuje bez čakania, aj ako záloha pod kartou pri obnovenej polohe či kotve.
   - okolie (display, sťahovanie): to, čo je na obrazovke, aktuálna karta a po dekódovaní prvého obrazu aj
     ďalšia a predchádzajúca (nie až po load, V2), ďalšie s fetchpriority low; najviac 3 zálohy bez display: none.
     Aktuálna karta je vždy v okolí (aj obnovená poloha, kotvy, späť, t-wait – V1).
   ---------------------------------------------------------------------------- */
let anyDec = false;      // aspoň jedna fotka záberu je dekódovaná: končí poistka prvého obrazu
let firstDone = false;   // prvý obraz je dekódovaný (alebo stránka načítaná): od vtedy sa sťahuje aj okolie ±1
const CATCH_MS = 420;
addEventListener('load', () => { if (!firstDone) { firstDone = true; snapNow(0); } }, { once: true });
// fotka záberu: po stiahnutí dekódovať; príznak __dec platí len pre aktuálny pobyt v okolí (mimo okolia má
// záloha display: none a prehliadač smie dekódovaný obraz zahodiť, preto sa po návrate dekóduje znova)
function prepStill(s) {
  const img = s.img;
  if (!img || img.__dec || img.__busy) return;
  if (!img.__go) {
    img.__go = () => {
      if (!img.__near || img.__dec || img.__busy) return;
      img.__busy = true;
      const done = (ok) => {
        img.__busy = false;
        if (ok && img.__near && !img.__dec) { img.__dec = true; anyDec = true; firstDone = true; snapNow(0); }
      };
      if (img.decode) img.decode().then(() => done(true), () => done(img.complete && img.naturalWidth > 0));
      else done(true);
    };
    // nová fotka (aj iný kandidát srcset po otočení): dekódovať; hotová fotka na obrazovke sa medzitým neskryje
    img.addEventListener('load', () => prepStill(s));
  }
  if (img.complete && img.naturalWidth > 0) img.__go();
}
function zabery(y, sp) {
  const now = performance.now();
  const footerIn = !!footerBox && y + vh > footerBox.top;
  // aktuálna karta podľa poradia (posledná, ktorej horný okraj je nad stredom okna); okolie sa ráta v kartách,
  // nie v pixeloch, aby ho neobišlo rozloženie, ktoré sa pri načítaní ešte dopočítava
  let cur = 0;
  for (let i = 0; i < titles.length; i++) if (titles[i].top <= y + vh * 0.5) cur = i;
  // krytie od posledného záberu: záber zakryje všetky pod sebou, keď je celý, hotový a už nedobieha
  // vis = najvyšší záber, ktorý chce skrol ukázať (want > 0), base = najvyšší, ktorý má byť celý (want = 1, pod vis);
  // oba aj keď ešte nie sú hotové
  let covered = false, vis = 0, base = 0;
  const so = new Array(titles.length), shown = [];
  for (let i = titles.length - 1; i >= 0; i--) {
    const s = titles[i], img = s.img;
    const want = s.first ? 1 : ease01((y - s.top) / s.free / CARD_IN);
    if (want > 0.001 && i > vis) vis = i;
    if (want >= 1 && i > base) base = i;
    const ok = !!img && ((img.__near && img.__dec) || (s.first && !anyDec));
    // fotka práve dobehla, kým ju skrol už chcel: dobehne prelínaním (inak riadi krytie len skrol)
    if (ok && !s.ok && want > 0.001 && !s.first) { s.catchUntil = now + CATCH_MS; setTimeout(() => snapNow(0), CATCH_MS + 10); }
    s.ok = ok;
    const catching = s.catchUntil > now;
    so[i] = footerIn || covered || !ok ? 0 : want;
    if (so[i] > 0.001) shown.push(i);
    if (ok && want >= 1 && !catching) covered = true;
  }
  // pod najnižším zobrazeným záberom nie je nič hotové (rýchly švih, skok, záber pod ním sa ešte sťahuje): ten
  // záber je posledná hotová fotka, ukáže sa celý (dobehne prelínaním), nikdy čiastočne priehľadný nad inkom
  const low = shown.length ? shown[shown.length - 1] : -1;
  if (low >= 0 && so[low] < 1) {
    so[low] = 1;
    const s = titles[low];
    if (!(s.catchUntil > now)) { s.catchUntil = now + CATCH_MS; setTimeout(() => snapNow(0), CATCH_MS + 10); }
  }
  // okolie v poradí dôležitosti: čo je na obrazovke (vždy), zábery, ktoré chce skrol (vis a pod ním base, aby sa
  // vôbec stiahli: pri obnovenej polohe ich inak vytlačila aktuálna karta so susedom a ostala by záloha úvodu,
  // pri rýchlom švihu by pod nastupujúcim záberom chýbal celý), aktuálna karta (vždy), po prvom obraze ďalšia
  // a predchádzajúca; susedia len do 3 záloh (vis, base a aktuálna sú obvykle dve susedné karty)
  const near = new Set(shown);
  near.add(base); near.add(vis); near.add(cur);
  const add = (i) => { if (i >= 0 && i < titles.length && near.size < 3) near.add(i); };
  if (firstDone) { add(cur + 1); add(cur - 1); }
  for (let i = 0; i < titles.length; i++) {
    const s = titles[i], img = s.img, on = near.has(i);
    if (img && on !== !!img.__near) {
      img.__near = on;
      img.__dec = false;
      // okolie mimo aktuálnej karty sa sťahuje s nízkou prioritou (účinné, kým požiadavka ešte nezačala)
      if (on && i !== cur && !img.complete) img.fetchPriority = 'low';
    }
    setClass(s.el, 'is-near', on);
    setClass(s.el, 'is-catch', s.catchUntil > now);
    // pomalé priblíženie len na zálohách v okolí (najviac 3), nie na všetkých 9 v každej snímke; záloha, ktorá sa
    // do okolia vráti, dostane aktuálnu hodnotu hneď v tej istej snímke, keď sa jej zruší display: none
    if (on && sp && img) setVar('--sp', s.t, img);
    if (on) prepStill(s);
    setVar('--so', so[i], s.st || s.el);
    setClass(s.el, 'is-shown', so[i] > 0.001);
  }
}

// lesk spodného tlačidla prejde len raz (style.css, lesk-raz): po prvom celom prechode sa už nespúšťa
mobileCta?.addEventListener('animationend', (e) => { if (e.animationName === 'lesk') mobileCta.classList.add('lesk-raz'); });

// spodné tlačidlo: nie v úvode (titulná karta má vlastné tlačidlá), nie v rezervácii, nie pri menu
function ctaHidden(y = window.scrollY || 0) {
  const hero = shots[0] && shots[0].first && y < shots[0].height * 0.6;
  const mid = y + vh * 0.5, prices = !!pricesBox && mid > pricesBox.top && mid < pricesBox.bottom;
  return activeScene === lastScene || menuOpen || !!hero || prices;
}

// Dobiehanie (lerp) len pre koliesko a klávesy na počítači; na dotyku stav ide presne s prstom (prehliadač skrol
// sám vyhladzuje a zotrvačnosť po švihu je už plynulá – lerp navyše oneskoroval karty a pri dlhom skoku zaostával).
// Zariadenie s myšou aj dotykom: posledný vstup rozhoduje (dotyk lerp vypne, koliesko zapne).
let lerpOn = !matchMedia('(hover: none) and (pointer: coarse)').matches;
addEventListener('touchstart', () => { lerpOn = false; }, { passive: true, capture: true });
addEventListener('wheel', () => { lerpOn = true; }, { passive: true, capture: true });

function tick(now) {
  rafId = 0;
  const dt = lastFrame ? Math.min(100, now - lastFrame) : 16.667;
  lastFrame = now;
  readTarget();

  if (motionOff || !lerpOn || now < snapUntil) {
    shownP = targetP;
  } else {
    // frame-rate-nezávislý lerp: k = 0.16 pri 60 fps
    shownP += (targetP - shownP) * (1 - Math.pow(1 - 0.16, dt / 16.667));
  }

  if (Math.abs(targetP - shownP) < 0.0005) {
    shownP = targetP;
    apply(shownP);
    skrolTrieda();
    lastFrame = 0; // slučka sa zastaví; ďalší štart začne čistým dt
    // bez dobiehania (dotyk) slučka dobehne v každej snímke, aj keď prehliadač ešte plynulo skroluje (kotva, návrat
    // späť): hotovo až 150 ms po poslednom posune (časovač triedy skrol), inak by testy čítali stav uprostred skrolu
    window.__scrollSettled = !skrolTimer;
    return;
  }
  apply(shownP);
  skrolTrieda();
  rafId = requestAnimationFrame(tick);
}

function start() {
  window.__scrollSettled = false;
  if (rafId || document.visibilityState === 'hidden') return;
  rafId = requestAnimationFrame(tick);
}

function snapNow(ms = 0) {
  snapUntil = Math.max(snapUntil, performance.now() + ms);
  start();
}

/* ----------------------------------------------------------------------------
   6. Udalosti: scroll, resize, viditeľnosť karty, kotvy
   ---------------------------------------------------------------------------- */
// Počas skrolu stoja nekonečné animácie (lesk tlačidla, svetlo po okraji karty, pás služieb, ekvalizér Hudba):
// trieda skrol na <html>, zruší sa 150 ms po poslednom posune. Selektory v style.css a atmosfera.css mieria
// len na tie prvky (cez triedy), takže prepnutie triedy prepočíta len ich (nie celú stránku). Trieda sa pridá
// aj zruší v snímke slučky až po prečítaní scrollY a zápisoch (skrolTrieda v tick): zmenená hneď v udalosti scroll
// alebo v časovači by čítanie scrollY v nasledujúcej snímke vynútilo prepočet štýlu navyše. Časovač sa pri každom
// posune nenastavuje znova, len si pamätá čas posledného posunu.
const SKROL_MS = 150;
let skrolT = 0, skrolTimer = 0, skrolCaka = false, skrolKonci = false;
function skrolKoniec() {
  const zostava = SKROL_MS - (performance.now() - skrolT);
  if (zostava > 1) { skrolTimer = setTimeout(skrolKoniec, zostava); return; }
  skrolTimer = 0;
  if (rafId) skrolKonci = true; else { html.classList.remove('skrol'); window.__scrollSettled = true; }   // slučka beží: zruší sa v jej snímke
}
function skrolTrieda() {
  if (skrolCaka) {
    skrolCaka = false; skrolKonci = false;
    if (!skrolTimer) { html.classList.add('skrol'); skrolTimer = setTimeout(skrolKoniec, SKROL_MS); }
  } else if (skrolKonci) {
    skrolKonci = false; html.classList.remove('skrol');
  }
}
function onScroll() {
  skrolT = performance.now();
  if (!skrolTimer) skrolCaka = true;
  start();
}
window.addEventListener('scroll', onScroll, { passive: true });

// Práca, ktorá by počas skrolu zasekla snímku (načítanie jazykov na dotyku, prvé vytvorenie formátovača času),
// sa spustí vo voľnej chvíli, keď sa stránka aspoň `ticho` ms neposunula (návštevník číta), nie v prvom ťahu prstom.
const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 2000 }) : (f) => setTimeout(f, 0);
function vPokoji(f, ticho = 1000) {
  const skus = () => {
    const zostava = ticho - (performance.now() - skrolT);
    if (zostava > 0) { setTimeout(skus, zostava); return; }
    idle(() => { if (performance.now() - skrolT < ticho) skus(); else f(); });
  };
  skus();
}

// Lišta Safari na telefóne sa pri skrole skrýva a ukazuje: okno zmení len výšku o asi 50 až 115 px (resize). Dĺžky
// kariet sú zo stabilných svh a pevné zábery z lvh (style.css), takže sa nič nepremeriava: len výška okna a koniec
// skrolu (2 čítania), nie celé measure() s getBoundingClientRect všetkých sekcií a kariet uprostred švihu.
// Plné meranie ide pri zmene šírky (otočenie), výšky o 120 px a viac a pri zmene výšky dokumentu (fotky, písma).
let resizeTimer = 0, measW = 0, measH = 0, measDoc = 0, measForce = false;
const docH = () => Math.max(html.scrollHeight, document.body?.scrollHeight || 0);
function measureFull() {
  measure();
  measW = window.innerWidth; measH = window.innerHeight; measDoc = docH();
}
// force === true: načítanie stránky a písma merajú vždy celé (ResizeObserver odovzdá pole záznamov, nie true)
function scheduleMeasure(force) {
  if (force === true) measForce = true;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const w = window.innerWidth, h = window.innerHeight, d = docH();
    if (!measForce && measW && w === measW && d === measDoc && Math.abs(h - measH) < 120) {
      vh = h || 1;
      maxScroll = Math.max(1, d - vh);
    } else {
      measForce = false;
      measureFull();
    }
    snapNow(0); // po zmene rozmerov bez dobiehania
  }, 120);
}
window.addEventListener('resize', scheduleMeasure);
window.addEventListener('orientationchange', scheduleMeasure);
if ('ResizeObserver' in window && document.body) {
  // obrázky, fonty, neskorší obsah – mení sa výška dokumentu
  new ResizeObserver(scheduleMeasure).observe(document.body);
}
document.fonts?.ready?.then(() => scheduleMeasure(true));
window.addEventListener('load', () => { scheduleMeasure(true); snapNow(400); });
window.addEventListener('pageshow', () => snapNow(300));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    lastFrame = 0;
  } else {
    snapNow(0);
  }
});

// Skok cez kotvu: natívny scroll (pri motion=on smooth v CSS), stav sledujeme bez lerpu.
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
  if (!a || a.getAttribute('href') === '#') return;
  snapNow(motionOn ? 900 : 100);
});
window.addEventListener('hashchange', () => snapNow(motionOn ? 900 : 100));

/* ----------------------------------------------------------------------------
   6b. Plynulý skrol kolieskom (len počítač s myšou)
   Koliesko stránku neposúva skokmi po zárezoch, ale posúva cieľ, ku ktorému stránka plynulo dobieha
   (časová konštanta 140 ms), takže film, dosky aj prechody idú ako jeden pomalý pohyb kamery.
   Dotyk, klávesy, posuvník a odkazy na kotvy ostávajú natívne; pri obmedzení pohybu, Ctrl/Cmd+koliesko
   (lupa), vodorovnom skrole, otvorenom menu alebo lightboxe sa koliesko nechá prehliadaču.
   ---------------------------------------------------------------------------- */
if (motionOn && mqFinePointer.matches) {
  const lightbox = $('#lightbox');
  let target = 0, cur = 0, raf = 0, last = 0, ours = false;
  const maxY = () => Math.max(0, (document.scrollingElement || html).scrollHeight - window.innerHeight);
  const step = (now) => {
    raf = 0;
    const dt = last ? Math.min(100, now - last) : 16.667; last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / 140));
    // na krajoch (vrch, spodok) dobehne hneď, aby koliesko nahor na vrchu bez čakania viedlo von na ulicu
    if (Math.abs(target - cur) < 0.5 || ((target === 0 || target >= maxY()) && Math.abs(target - cur) < 12)) cur = target;
    ours = true; window.scrollTo({ top: cur, left: 0, behavior: 'instant' }); ours = false;
    if (cur !== target) raf = requestAnimationFrame(step); else last = 0;
  };
  window.addEventListener('wheel', (e) => {
    // otvorený dialóg (napr. prihláška k vernostnej kartičke) sa posúva sám, stránka za ním nie
    if (e.ctrlKey || e.metaKey || menuOpen || (lightbox && !lightbox.hidden) || document.body.style.overflow === 'hidden' || document.querySelector('dialog[open]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    e.preventDefault();
    if (!raf) { cur = target = window.scrollY; }
    target = Math.min(maxY(), Math.max(0, target + e.deltaY * unit));
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });
  // posun odinakiaľ (posuvník, klávesy, skok na kotvu): cieľ sa vyrovná so skutočnou polohou
  window.addEventListener('scroll', () => { if (!ours && !raf) cur = target = window.scrollY; }, { passive: true });
}

/* 7. (kurzor) zrušené: --pointer-x/y na <html> pri každom pohybe myši prepočítali štýl celej stránky a nič
   ich nečítalo; film má na posun pohľadu vlastný pointermove */

/* ----------------------------------------------------------------------------
   7b. Atmosféra (assets/atmosfera.js: kurzor nožnice, svetlo pod kurzorom, hudba, zvuk strihnutia)
   Načíta sa až pri prvom pohybe myši, dotyku či klávese, inak 3,5 s po načítaní stránky, aby nič z nej
   nesúperilo s prvým obrazom. Kliknutie alebo ťuknutie pred načítaním sa odovzdá (hudba sa pustí hneď);
   ťah prstom (skrol) nie je ťuknutie: dotyk sa ráta až kliknutím, ktoré prehliadač pošle len po ťuknutí.
   ---------------------------------------------------------------------------- */
(function atmosfera() {
  let loaded = false, gesture = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    import('./atmosfera.js').then((m) => m.spusti(gesture)).catch(() => {});
  };
  // myš: ľavé tlačidlo; dotyk a pero: kliknutie po ťuknutí (detail 0 = kliknutie klávesom, to hudbu nepustí)
  const onGesture = (e) => {
    if (e.type === 'pointerdown' ? e.pointerType === 'mouse' && e.button === 0 : e.detail > 0) {
      gesture = true;
      removeEventListener('pointerdown', onGesture, true); removeEventListener('click', onGesture, true);
    }
  };
  addEventListener('pointerdown', onGesture, { capture: true, passive: true });
  addEventListener('click', onGesture, { capture: true, passive: true });
  if (mqFinePointer.matches) {
    ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) => addEventListener(t, load, { once: true, passive: true }));
    const later = () => setTimeout(load, 3500);
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
    return;
  }
  // Dotyk (L5): modul (štýly, tlačidlo Hudba v lište, poslucháče) sa nenačíta pri prvom ťahu prstom, kde by
  // jeho spracovanie a nové štýly zasekli prvý švih. Načíta sa vo voľnej chvíli (3,5 s po načítaní, potom aspoň 1 s
  // bez posunu, ako jazyky), pri ťuknutí (kliknutie po ťuknutí, nie ťah; gesto sa odovzdá a hudba sa pustí ako
  // doteraz pri ťuknutí pred načítaním modulu), pri klávese alebo pohybe myši (tablet s myšou).
  // Poslucháč kliknutia ide po onGesture (oba vo fáze capture na window), takže gesto je už zapísané.
  addEventListener('click', (e) => { if (e.detail > 0) load(); }, { capture: true, passive: true });
  addEventListener('keydown', load, { once: true, passive: true });
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') load(); }, { passive: true });
  const later = () => setTimeout(() => vPokoji(load), 3500);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
})();

/* ----------------------------------------------------------------------------
   7b2. Recenzie (assets/recenzie.js): doslovné citácie z Google. Sú v samostatnom module, aby HTML ostalo v prvom
   okne TCP; bez skriptu ostáva odkaz na hodnotenie na Google.
   ---------------------------------------------------------------------------- */
(function recenzie() {
  const zoznam = document.querySelector('[data-recenzie]');
  if (!zoznam) return;
  // hneď (malý modul, ďaleko pod prvou obrazovkou): obsah pod ním sa tak posunie ešte pred načítaním stránky,
  // nie počas skrolovania, a kotvy filmu sa merajú už s recenziami
  import('./recenzie.js').then((m) => m.spusti(zoznam)).catch(() => {});
})();

/* ----------------------------------------------------------------------------
   7c. Jazyky (assets/i18n.js, slovníky assets/i18n/*.json). Pri ?lang= alebo uloženej voľbe sa modul načíta hneď
   (úvod je zatiaľ skrytý triedou t-wait z hlavičky). Inak na počítači pri prvom geste alebo 3,5 s po načítaní
   (prepínač v lište, ponuka). Na dotykovom zariadení nie pri prvom ťahu prstom (štýly prepínača a prvé spracovanie
   by zasekli skrol), ale vo voľnej chvíli po načítaní, keď sa práve neskroluje; otvorenie menu ho načíta hneď
   (prepínač jazyka je v menu).
   ---------------------------------------------------------------------------- */
(function jazyky() {
  let lang = new URLSearchParams(location.search).get('lang');
  try { lang = lang || localStorage.getItem('b30.lang'); } catch (e) { /* súkromné okno */ }
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    import('./i18n.js').then((m) => m.spusti()).catch(() => html.classList.remove('t-wait'));
  };
  if (lang && lang !== 'sk') { load(); return; }
  navToggle?.addEventListener('click', load, { once: true });
  if (mqFinePointer.matches) {
    ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) => addEventListener(t, load, { once: true, passive: true }));
    const later = () => setTimeout(load, 3500);
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
    return;
  }
  addEventListener('keydown', load, { once: true, passive: true });
  // 3,5 s po načítaní, potom v pokoji (aspoň 1 s bez posunu stránky) vo voľnej chvíli
  const later = () => setTimeout(() => vPokoji(load), 3500);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
})();

/* ----------------------------------------------------------------------------
   8. Prvky .reveal (dosky, karty) – IntersectionObserver, jednorazový nástup
   ---------------------------------------------------------------------------- */
(function setupReveal() {
  const nodes = $$('.reveal');
  if (!nodes.length) return;
  if (motionOff || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  nodes.forEach((el) => io.observe(el));
})();

/* ----------------------------------------------------------------------------
   9. Menu (mobil)
   ---------------------------------------------------------------------------- */
let bodyOverflowBefore = '';
function lockScroll(lock) {
  if (lock) { bodyOverflowBefore = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = bodyOverflowBefore || '';
}

function setMenu(open, { restoreFocus = true } = {}) {
  if (!header || !navToggle || !nav) return;
  open = !!open;
  if (open === menuOpen) return;
  menuOpen = open;
  header.dataset.menu = open ? 'open' : 'closed';
  navToggle.setAttribute('aria-expanded', String(open));
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  lockScroll(open);
  // poloha z poslednej snímky slučky (čítanie scrollY po zápisoch vyššie by vynútilo prepočet štýlu a rozloženia)
  setClass(mobileCta, 'is-hidden', ctaHidden(curY));
  // fokus až v ďalšej snímke: overenie, či sa prvok dá zamerať, by inak vynútilo štýl hneď po zápisoch
  if (open) {
    const first = $('a, button', nav);
    requestAnimationFrame(() => { if (menuOpen) first?.focus({ preventScroll: true }); });
  } else if (restoreFocus) {
    requestAnimationFrame(() => { if (!menuOpen) navToggle.focus({ preventScroll: true }); });
  }
}

if (navToggle && nav && header) {
  if (!navToggle.getAttribute('aria-controls') && nav.id) navToggle.setAttribute('aria-controls', nav.id);
  navToggle.addEventListener('click', () => setMenu(!menuOpen, { restoreFocus: false }));
  nav.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) setMenu(false, { restoreFocus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { e.preventDefault(); setMenu(false); }
  });
  // pri prechode na desktop menu zavri (navigácia je viditeľná v lište)
  mqMobile.addEventListener?.('change', (e) => { if (!e.matches) setMenu(false, { restoreFocus: false }); });
}

/* ----------------------------------------------------------------------------
   10. Lightbox galérie
   ---------------------------------------------------------------------------- */
(function setupLightbox() {
  const lb = $('#lightbox');
  if (!lb) return;
  const img = $('#lightbox-img', lb) || $('img', lb);
  const caption = $('#lightbox-caption', lb) || $('figcaption', lb);
  const btnClose = $('[data-lightbox="close"]:not(.lightbox-backdrop), .lightbox-close', lb);
  const btnPrev = $('[data-lightbox="prev"], .lightbox-prev', lb);
  const btnNext = $('[data-lightbox="next"], .lightbox-next', lb);

  // tlačidlá galérie: .gallery-item ako button, alebo button vnútri .gallery-item
  const triggers = $$('.gallery-item, .gallery-btn')
    .map((el) => (el.matches('button, a') ? el : $('button', el)))
    .filter((el, i, arr) => el && arr.indexOf(el) === i);
  const srcOf = (el) => el.dataset.full || el.dataset.lightboxSrc || '';
  const items = triggers.filter(srcOf);
  if (!items.length || !img) return;

  let index = -1;
  let opener = null;
  let open = false;

  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', 'true');

  function show(i) {
    index = (i + items.length) % items.length;
    const btn = items[index];
    const alt = btn.dataset.alt || btn.dataset.lightboxAlt || $('img', btn)?.alt || '';
    // obrázok sa načíta až teraz
    img.removeAttribute('srcset');
    img.src = srcOf(btn);
    if (btn.dataset.lightboxSrcset) { img.srcset = btn.dataset.lightboxSrcset; img.sizes = '100vw'; }
    if (btn.dataset.lightboxW && btn.dataset.lightboxH) { img.width = Number(btn.dataset.lightboxW); img.height = Number(btn.dataset.lightboxH); }
    const popis = window.B30_LANG ? window.B30_LANG.t(alt) : alt;   // popis fotky v jazyku stránky
    img.alt = popis;
    if (caption) caption.textContent = popis;
    const single = items.length < 2;
    if (btnPrev) btnPrev.hidden = single;
    if (btnNext) btnNext.hidden = single;
  }

  function openAt(i, from) {
    opener = from || document.activeElement;
    show(i);
    lb.hidden = false;
    open = true;
    lockScroll(true);
    (btnClose || lb).focus?.({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    lb.hidden = true;
    lockScroll(false);
    img.removeAttribute('src');
    img.removeAttribute('srcset');
    opener?.focus?.({ preventScroll: true });
    opener = null;
  }

  items.forEach((btn, i) => btn.addEventListener('click', (e) => { e.preventDefault(); openAt(i, btn); }));
  btnClose?.addEventListener('click', close);
  btnPrev?.addEventListener('click', () => show(index - 1));
  btnNext?.addEventListener('click', () => show(index + 1));
  // klik na pozadie (mimo obrázka a tlačidiel) zatvára
  lb.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t === lb || t.classList.contains('lightbox-backdrop') || t.closest('[data-lightbox="close"]') === t) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); return; }
    if (e.key === 'Tab') {
      // pasca fokusu vnútri lightboxu
      const focusables = $$('button, [href], [tabindex]:not([tabindex="-1"])', lb).filter((el) => !el.hidden && el.offsetParent !== null);
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !lb.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ----------------------------------------------------------------------------
   11. Tiché videoslučky (Remeslo, Tím; na ľahkom telefóne aj slučka záberu Tím)
   Pravidlá: play pri viditeľnosti >= 35 %, pause mimo viewportu a pri skrytej karte; súčasne hrá
   najviac jedno video; video v prvku s data-at alebo .reveal hrá, len kým je prvok zobrazený (.is-in);
   pri data-motion=off a prefers-reduced-motion sa nič nesťahuje ani neprehráva (ostáva poster).
   Ľahký telefón (html.lite, L6): záber s data-video-mode="play" (Tím, tá istá slučka tim-slucka ako vo filme na
   telefóne) dostane bežné <video muted playsinline loop preload="none"> cez celú zálohu (absolútne v pevnej
   .film-still, rozmer je rezervovaný, nič sa neposunie). Plagát je presne prvá snímka videa (PSNR 41,5 dB proti
   20,7 dB pri snímke 15), takže štart nič nezmení. Plagát a adresa videa sa nastavia, až keď je záber v okolí
   (is-near, karta pred ním); preload="none", takže súbor sa sťahuje až pri prvom play(). Hrá, keď kotva záberu
   zaberá aspoň 60 % výšky okna a záloha je zobrazená (is-shown, nie zakrytá ďalšou), inak stojí. Nič nie je
   viazané na skrol (len IntersectionObserver a triedy). Úsporný režim (play() odmietnuté) nechá plagát;
   ťuknutie skúsi play() znova.
   ---------------------------------------------------------------------------- */
(function setupVideos() {
  const vids = $$('video[data-video]');
  // plagát sa načíta až keď je okno s videom do dvoch obrazoviek od okna (nie hneď pri štarte stránky);
  // pri obmedzenom pohybe a bez IntersectionObserver sa dá hneď, aby okno nebolo prázdne
  const posters = vids.filter((v) => v.dataset.poster);
  const setPoster = (v) => { if (!v.poster) v.poster = v.dataset.poster; };
  if (posters.length) {
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setPoster(e.target); pio.unobserve(e.target); } }), { rootMargin: '200% 0px' });
      posters.forEach((v) => pio.observe(v));
    } else posters.forEach(setPoster);
  }
  if (motionOff || !('IntersectionObserver' in window)) return;
  const loops = slucky();
  if (!vids.length && !loops.length) return;
  const ratio = new Map(vids.map((v) => [v, 0]));
  const frac = new Map(loops.map((v) => [v, 0]));   // slučka záberu: podiel výšky okna, ktorý zaberá kotva

  const pause = (v) => { if (!v.paused) v.pause(); };
  const play = (v) => { if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => { /* autoplay zamietnutý – ostáva poster */ }); } };
  const gateOf = (v) => v.closest('[data-at], .reveal');
  const wanted = (v) => {
    if (v.__shot) {
      const c = v.__shot.classList;
      return !v.__fail && !!v.__armed && frac.get(v) >= 0.6 && c.contains('is-near') && c.contains('is-shown');
    }
    if ((ratio.get(v) || 0) < 0.35) return false;
    const gate = gateOf(v);
    return !gate || gate.classList.contains('is-in');
  };
  const all = [...vids, ...loops];
  function sync() {
    if (document.visibilityState !== 'visible') { all.forEach(pause); return; }
    let best = null, bestRatio = 0;
    for (const v of all) {
      const r = v.__shot ? frac.get(v) : ratio.get(v);
      if (wanted(v) && r > bestRatio) { best = v; bestRatio = r; }
    }
    for (const v of all) if (v !== best) pause(v);
    if (best) play(best);
  }

  if (vids.length) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) ratio.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
      sync();
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] });
    vids.forEach((v) => io.observe(v));
  }

  if (loops.length) {
    // pevná záloha je pri zobrazení vždy celá v okne, preto sa sleduje kotva záberu (jej dĺžka je 160 až 200 svh,
    // podiel z vlastnej plochy by 60 % okna nevyjadril); rootBounds chýba v cudzom rámci (náhľad), vtedy innerHeight
    const steps = Array.from({ length: 41 }, (_, i) => i / 40);
    const byShot = new Map(loops.map((v) => [v.__shot, v]));
    const lio = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const h = (en.rootBounds && en.rootBounds.height) || window.innerHeight || 1;
        frac.set(byShot.get(en.target), en.isIntersecting ? en.intersectionRect.height / h : 0);
      }
      sync();
    }, { threshold: steps });
    loops.forEach((v) => {
      lio.observe(v.__shot);
      // plagát a adresa až v okolí záberu (is-near z app.js 5b); triedy is-near/is-shown sa menia v slučke skrolu
      const arm = () => {
        if (v.__armed || !v.__shot.classList.contains('is-near')) return;
        v.__armed = true;
        if (v.__poster) {
          const im = new Image();
          // plagát sa ukáže až načítaný (inak by cez zálohu na chvíľu presvitalo prázdne video); prelínanie 400 ms
          im.onload = () => { v.poster = v.__poster; v.classList.add('is-ready'); };
          im.src = v.__poster;
        } else v.classList.add('is-ready');
        v.src = v.__src;
      };
      v.addEventListener('error', () => { v.__fail = true; sync(); });   // ostáva plagát (alebo fotka zálohy)
      new MutationObserver(() => { arm(); sync(); }).observe(v.__shot, { attributes: true, attributeFilter: ['class'] });
      arm();
    });
    // úsporný režim: ťuknutie je gesto, v ňom play() prejde
    addEventListener('touchend', sync, { passive: true });
  }

  // brány menia triedu is-in (slučka alebo IntersectionObserver) – sleduj zmenu a prehodnoť
  const mo = 'MutationObserver' in window ? new MutationObserver(sync) : null;
  new Set(vids.map(gateOf).filter(Boolean)).forEach((g) => mo?.observe(g, { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('visibilitychange', sync);
})();

// slučky záberov pre ľahký telefón (L6): existujúce súbory assets/video/*, typ ako vo film.js (H.264 mp4 má prednosť:
// na iPhone ho dekóduje hardvér), plagát .webp (Safari od iOS 14)
function slucky() {
  if (!html.classList.contains('lite') || !('MutationObserver' in window)) return [];
  const t = document.createElement('video');
  const mp4 = t.canPlayType('video/mp4; codecs="avc1.640028"'), webm = t.canPlayType('video/webm; codecs="vp9"');
  const ext = mp4 === 'probably' || (mp4 && !webm) ? '.mp4' : webm ? '.webm' : '';
  if (!ext) return [];
  return $$('.film-shot.is-title[data-video][data-video-mode="play"]').map((shot) => {
    const still = shot.querySelector('.film-still');
    if (!still) return null;
    const v = document.createElement('video');
    v.muted = v.defaultMuted = true; v.playsInline = true; v.loop = true; v.preload = 'none';
    ['muted', 'playsinline', 'webkit-playsinline', 'loop', 'disablepictureinpicture', 'disableremoteplayback'].forEach((a) => v.setAttribute(a, ''));
    v.setAttribute('preload', 'none'); v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
    v.className = 'film-loop';
    const [w, h] = (shot.dataset.videoSize || '').split('x').map(Number);
    if (w && h) { v.width = w; v.height = h; }
    const [fx, fy] = (shot.dataset.videoF || '0.5,0.5').split(',').map(parseFloat);
    v.style.objectPosition = `${((fx || 0.5) * 100).toFixed(1)}% ${((fy || 0.5) * 100).toFixed(1)}%`;
    v.__shot = shot;
    v.__src = new URL(shot.dataset.video + ext, document.baseURI).href;
    v.__poster = shot.dataset.videoPoster ? new URL(shot.dataset.videoPoster + '.webp', document.baseURI).href : '';
    still.append(v);
    return v;
  }).filter(Boolean);
}

/* ----------------------------------------------------------------------------
   12. Rok v pätičke
   ---------------------------------------------------------------------------- */
$$('.year').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ----------------------------------------------------------------------------
   13. Štart – stav okamžite (aj po obnovení stránky uprostred príbehu)
   ---------------------------------------------------------------------------- */
measureFull();
readTarget();
shownP = targetP;
// app.js prevzal riadenie (CSS skryje .reveal a pripraví nástupy); atribút sa už nemení (aktívna kapitola je v aria-current)
html.setAttribute('data-scene-active', '');
apply(shownP);
window.__renderDone = true;
start();

/* ----------------------------------------------------------------------------
   12. Pohyblivé detaily (style.css P12): nadpis po slovách, kroky strihu, pás služieb len keď je
   vidieť, tabuľa dnešných hodín podľa otváracích hodín. Pri obmedzenom pohybe všetko stojí.
   ---------------------------------------------------------------------------- */
(() => {
  const d = document, root = d.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
  const io = (els, fn, opt) => { if (!('IntersectionObserver' in window)) { els.forEach((el) => fn(el, true)); return; } const o = new IntersectionObserver((es) => es.forEach((e) => fn(e.target, e.isIntersecting, o)), opt); els.forEach((el) => o.observe(el)); };

  // nadpis po slovách: každé slovo do <span class="kw"> s poradím --i (oneskorenie), zalomenia a vnorené značky ostanú
  const kins = [...d.querySelectorAll('.kin')];
  const rozdel = (h) => {
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/), f = d.createDocumentFragment();
        parts.forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) { f.append(p); return; } const w = d.createElement('span'); w.className = 'kw'; w.style.setProperty('--i', i++); w.textContent = p; f.append(w); });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(h);
  };
  // jazyky: slová sa po delení prekladať nedajú (slovosled), preto si nadpis pamätá pôvodné riadky
  // a pri zmene jazyka sa preloží celý riadok (kľúč = pôvodný riadok) a rozdelí znova
  kins.forEach((h) => { h.__sk = h.cloneNode(true); h.setAttribute('data-no-i18n', ''); rozdel(h); });
  d.addEventListener('langchange', () => {
    const T = window.B30_LANG ? window.B30_LANG.t : (k) => k;
    kins.forEach((h) => {
      const c = h.__sk.cloneNode(true), tw = d.createTreeWalker(c, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const k = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!k) continue;
        n.nodeValue = (n.nodeValue.match(/^\s*/) || [''])[0] + T(k) + (n.nodeValue.match(/\s*$/) || [''])[0];
      }
      h.replaceChildren(...c.childNodes); rozdel(h);
    });
  });
  if (!still && kins.length) { root.classList.add('js-kin'); io(kins.filter((h) => !h.closest('.film-shot.is-title')), (el, on, o) => { if (on) { el.classList.add('is-in'); o && o.unobserve(el); } }, { threshold: 0.4 }); }

  // zoznam krokov: položky po jednej, keď je zoznam z tretiny na obrazovke
  const steps = [...d.querySelectorAll('.steps')];
  steps.forEach((ul) => [...ul.children].forEach((li, i) => li.style.setProperty('--i', i)));
  if (!still && steps.length) { root.classList.add('js-steps'); io(steps, (el, on, o) => { if (on) { el.classList.add('is-in'); o && o.unobserve(el); } }, { threshold: 0.35 }); }

  // pás služieb beží len na obrazovke (batéria)
  // nekonečné animácie bežia len na obrazovke: mimo okna ich Chrome nepustí na kompozitor a tikajú v hlavnom vlákne
  io([...d.querySelectorAll('.marquee, .beam, .btn-primary')], (el, on) => el.classList.toggle('is-off', !on));

  // tabuľa dnešných hodín podľa otváracích hodín v Nitre (Po–Pi 9–19, So 9–14, Ne zatvorené)
  const HOURS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 14], 0: null };
  // formátovač s časovou zónou je drahý (prvé vytvorenie načíta údaje zóny, 30–90 ms na pomalom telefóne):
  // vytvorí sa raz, nie pri štarte stránky – vopred vo voľnej chvíli po načítaní, keď sa neskroluje (nižšie),
  // a ak návštevník dôjde k tabuli skôr, až pri jej priblížení
  let fmt = null;
  const nowNitra = () => {
    fmt = fmt || new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), h: +p.hour + +p.minute / 60 };
  };
  if (d.querySelector('[data-flap]')) {
    const vopred = () => setTimeout(() => vPokoji(() => { if (!fmt) nowNitra(); }), 1500);
    if (d.readyState === 'complete') vopred(); else addEventListener('load', vopred, { once: true });
  }
  const FLIP = [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.2)' }, { transform: 'scaleY(1)' }];
  // slová tabule po slovensky; ostatné jazyky ich majú v slovníku (assets/i18n/<jazyk>.json, kľúč __tabula)
  const SK = { zatvorene: 'ZATVORENÉ', dni: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'], zajtra: 'zajtra',
    dalsi: '{kedy} od {cas}', terazOtvorene: 'Teraz otvorené', otvarameO: 'Otvárame o {cas}', terazZatvorene: 'Teraz zatvorené, {dalsi}',
    aria: 'Dnes {od} až {do}. {stav}.', ariaZatvorene: 'Dnes zatvorené. {stav}.' };
  const vypln = (sablona, v) => sablona.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
  const tabula = (box, ticho) => {
    const W = (window.B30_LANG && window.B30_LANG.data('__tabula')) || SK;
    const GLYPHS = '0123456789:–' + W.zatvorene.replace(/\s/g, '');
    const { dow, h } = nowNitra(), t = HOURS[dow];
    const text = t ? `${t[0]}:00 – ${t[1]}:00` : W.zatvorene;
    // najbližší otvorený deň po dnešku (sobota → pondelok), pomenovaný ako v reči: zajtra, v pondelok
    let n = (dow + 1) % 7; while (!HOURS[n]) n = (n + 1) % 7;
    const dalsi = vypln(W.dalsi, { kedy: n === (dow + 1) % 7 ? W.zajtra : W.dni[n], cas: `${HOURS[n][0]}:00` });
    let state;
    if (t && h >= t[0] && h < t[1]) state = W.terazOtvorene;
    else if (t && h < t[0]) state = vypln(W.otvarameO, { cas: `${t[0]}:00` });
    else state = vypln(W.terazZatvorene, { dalsi });
    const cells = box.querySelector('.flap-cells'), st = box.querySelector('.flap-state'), lab = box.querySelector('.flap-label');
    box.setAttribute('data-no-i18n', '');
    box.setAttribute('aria-label', t ? vypln(W.aria, { od: `${t[0]}:00`, do: `${t[1]}:00`, stav: state }) : vypln(W.ariaZatvorene, { stav: state }));
    if (lab) lab.textContent = window.B30_LANG ? window.B30_LANG.t('Dnes') : 'Dnes';
    cells.setAttribute('aria-hidden', 'true');
    cells.textContent = '';
    const bs = [...text].map((c) => { const b = d.createElement('b'); if (c === ' ') b.className = 'sp'; b.textContent = ticho ? c : (c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * 10)]); cells.append(b); return [b, c]; });
    if (st) st.textContent = state;
    if (ticho) return null;
    // preklápanie: políčko i začne o i × 40 ms, potom krok každých 70 ms, spolu 4 + 2i krokov, posledný ukáže
    // skutočný znak. Všetky políčka v jednej slučke requestAnimationFrame (text sa mení dávkovo v jednej snímke)
    // a preklopenie cez Web Animations (bez prepínania triedy a vynúteného rozloženia pri každom kroku).
    return () => {
      const t0 = performance.now();
      const pole = bs.map(([b, c], i) => (c === ' ' ? null : { b, c, n: 4 + i * 2, dalsi: t0 + i * 40 })).filter(Boolean);
      const krok = (now) => {
        let bezi = false;
        for (const s of pole) {
          if (s.n <= 0) continue;
          if (now >= s.dalsi) {
            s.n -= 1; s.dalsi = now + 70;
            s.b.textContent = s.n <= 0 ? s.c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            s.b.animate(FLIP, { duration: 90, easing: 'linear' });
          }
          if (s.n > 0) bezi = true;
        }
        if (bezi) requestAnimationFrame(krok);
      };
      requestAnimationFrame(krok);
    };
  };
  // tabuľa sa vyplní, až keď sa priblíži (do jednej výšky okna), rovno v jazyku stránky; preklápanie sa pustí,
  // keď je z 60 % na obrazovke. Dovtedy ostáva text z HTML (otváracie hodiny). Zmena jazyka prepíše vyplnenú tabuľu.
  d.querySelectorAll('[data-flap]').forEach((box) => {
    let hotovo = false;
    d.addEventListener('langchange', () => { if (hotovo) tabula(box, true); });
    io([box], (el, on, o) => {
      if (!on || hotovo) return;
      o && o.unobserve(el);
      hotovo = true;
      const run = tabula(box, still);
      if (run) io([box], (el2, on2, o2) => { if (on2) { run(); o2 && o2.unobserve(el2); } }, { threshold: 0.6 });
    }, { rootMargin: '100% 0px' });
  });
})();
