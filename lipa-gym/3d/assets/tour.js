// GYM KLUB – prechádzka fitkom.
// Jeden stav: poloha skrolovania vyberá zastávku (dopredu aj dozadu, po obnovení aj z priameho odkazu #id),
// ťahanie obrazom posúva pohľad v rámci ostrého záberu. Bez knižníc, bez cudzích požiadaviek.
// Výkon: všetky pohyby sú transform/opacity cez Web Animations (bežia na kompozítore), rozmery rozhrania
// sa čítajú len pri zmene veľkosti (ResizeObserver), nikdy uprostred zápisu v snímke.

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const pad = n => String(n).padStart(2, '0');
const wait = ms => new Promise(r => setTimeout(r, ms));
const idle = window.requestIdleCallback ? cb => requestIdleCallback(cb, { timeout: 900 }) : cb => setTimeout(cb, 200);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const coarse = matchMedia('(pointer: coarse)').matches;
const videoOK = !reduced && !saveData;
const DPR = Math.min(window.devicePixelRatio || 1, 3);

const tour = $('#prehliadka'), stage = $('#stage'), view = $('#view'), overlay = $('#overlay');
const hud = $('#hud'), hero = $('#hero'), heroImg = $('#hero img'), zoznam = $('#zoznam'), menu = $('#menu');
const hudZone = $('#hudZone'), hudTitle = $('#hudTitle'), hudCount = $('#hudCount'), desc = $('#stopDesc');
const hudTL = $('#hudTL'), hudTR = $('#hudTR'), hudB = $('.hud-b');
const strip = $('#strip'), minimap = $('#minimap'), ring = $('#compassRing');
const prevBtn = $('#prev'), nextBtn = $('#next'), menuBtn = $('#menuBtn'), fsBtn = $('#fs'), motionBtn = $('#motion');
const zp = $('#zp'), zpToggle = $('#zpToggle'), zpKicker = $('#zpKicker'), zpTitle = $('#zpTitle'), zpText = $('#zpText'), zpList = $('#zpList');
const chapter = $('#chapter'), chK = $('#chK'), chT = $('#chT'), chS = $('#chS'), chRule = $('.ch-rule');

// ——— úvodná sekvencia ———
// Pásy letterboxu sa otvoria, titulky sa postupne odhalia (CSS, trieda intro-go) a záber terasy sa pomaly
// približuje. Začne sa až keď je obraz dekódovaný, aby prvá snímka nebola prázdna ani sekaná.
const PUSH = { kf: [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }], opt: { duration: 16000, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'forwards' } };
let heroPush = null, introStarted = false, onIntro = null;
const deepLink = decodeURIComponent(location.hash.slice(1));
function startIntro() {
  if (introStarted) return;
  introStarted = true;
  root.classList.add('intro-go');
  if (!reduced && !hero.hidden) heroPush = heroImg.animate(PUSH.kf, PUSH.opt);
  onIntro?.();
}
if (deepLink && deepLink !== 'top' && !/^(kontakt|koniec|o-fitku|treningy|hodiny|prehliadka)$/.test(deepLink)) {
  root.classList.add('no-intro'); startIntro();
} else {
  Promise.race([heroImg.decode().catch(() => {}), wait(1800)]).then(startIntro);
}

// ——— odhalenie sekcií a záverečnej karty pri skrolovaní ———
{
  const els = document.querySelectorAll('.endcard, .block');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));
}

async function main() {
  const r = await fetch('assets/tour-data.json');
  if (!r.ok) throw new Error('tour-data.json ' + r.status);
  const data = await r.json();
  const STOPS = data.stops.slice().sort((a, b) => a.order - b.order);
  const N = STOPS.length;
  const ZONES = data.zones;
  const zoneById = Object.fromEntries(ZONES.map(z => [z.id, z]));
  const zoneNo = Object.fromEntries(ZONES.map((z, k) => [z.id, k + 1]));
  const idx = Object.fromEntries(STOPS.map((s, i) => [s.id, i]));

  // ——— rozmery a poloha zastávok ———
  // Krok je odvodený zo stabilnej výšky okna (mení sa len pri otočení alebo veľkej zmene),
  // aby skrývanie adresného riadka na mobile neposúvalo zastávky.
  let vw = innerWidth, vh = innerHeight, vhBase = vh;
  let step = Math.round(vhBase * 0.85), tail = Math.round(vhBase * 0.5), tTop = 0, tourH = 0;
  const posOf = i => tTop + i * step;
  const indexAt = y => clamp(Math.round((y - tTop) / step), 0, N - 1);

  // zoznam pre stránku bez JS už netreba, nahradia ho značky zastávok (#id) a dialóg so zoznamom
  zoznam.remove();
  // značky idú pred scénu, aby po priamom odkaze pokračoval Tab do ovládania prehliadky
  const markers = STOPS.map(s => { const m = document.createElement('div'); m.className = 'mark'; m.id = s.id; return m; });
  stage.before(...markers);
  function layoutTour() {
    tourH = (N - 1) * step + vhBase + tail;
    tour.style.height = tourH + 'px';
    markers.forEach((m, i) => { m.style.top = (i * step) + 'px'; });
    tTop = Math.round(tour.getBoundingClientRect().top + scrollY);   // čítanie len tu (štart, zmena veľkosti)
  }
  layoutTour();
  hud.hidden = false;
  // aktívna prechádzka sa počíta z uložených čísel, bez čítania rozloženia pri skrolovaní
  const tourActive = () => { const top = tTop - scrollY; return top <= 1 && top + tourH >= vh * 0.5; };

  // rozmery rozhrania z ResizeObserver (callback beží po rozložení, čítanie tu nič nevynúti)
  let hb = 120, zpRect = null, stripW = 0, stripPos = [];
  const measureStrip = () => { stripW = strip.clientWidth; stripPos = stripBtns.map(b => b.offsetLeft + b.offsetWidth / 2); };
  const ro = new ResizeObserver(() => {
    hb = hudB.offsetHeight || 120;
    const z = zp.getBoundingClientRect();
    zpRect = z.height ? { l: z.left, r: z.right, b: z.bottom } : null;
    measureStrip();
    requestRender();
  });

  // ——— plátna so záberom ———
  const plates = new Map();
  // Pokrytie okna. Na šírku sa záber zväčší až o 18 %, aby mal vodorovný ťah priestor, ale nikdy
  // nad natívne rozlíšenie záberu v CSS px (ostrosť má prednosť; na 1920 px širokom okne ostáva len pokrytie).
  const OVER = 1.18;
  const coverScale = s => { const s0 = Math.max(vw / s.w, vh / s.h); return vw > vh ? s0 * clamp(1 / s0, 1, OVER) : s0; };
  // Veľkosť súboru: telefóny (kratšia strana do 430 px) vždy 1280 px; inak podľa skutočnej potreby
  // (šírka záberu na obrazovke × DPR, najviac 2×), väčší súbor len keď 1280 px nestačí.
  function pickSize(s) {
    const [big, small] = s.sizes;
    if (Math.min(vw, vh) <= 430 && DPR <= 3) return small;
    return s.w * coverScale(s) * Math.min(DPR, 2) > small * 1.15 ? big : small;
  }
  // úvodný obrázok (hero) musí mať rovnaké zväčšenie ako prvý záber, inak by pri prepnutí poskočil
  function syncHero() { const s = STOPS[0], s0 = Math.max(vw / s.w, vh / s.h); hero.style.transform = `scale(${(coverScale(s) / s0).toFixed(4)})`; }
  syncHero();
  function makePlate(s) {
    const el = document.createElement('div');
    el.className = 'plate'; el.dataset.id = s.id;
    const kb = document.createElement('div'); kb.className = 'kb';
    const med = document.createElement('div');
    med.className = 'plate-media';
    med.style.width = s.w + 'px'; med.style.height = s.h + 'px';
    const img = document.createElement('img');
    const size = pickSize(s), base = `media/${s.src}-${size}`;
    if (s === STOPS[0] && heroImg.currentSrc) {
      img.src = heroImg.currentSrc;   // ten istý súbor ako úvod: žiadne druhé sťahovanie, žiadny skok
      med.append(img);
    } else {
      const pic = document.createElement('picture');
      for (const [type, ext] of [['image/avif', 'avif'], ['image/webp', 'webp']]) {
        const so = document.createElement('source'); so.type = type; so.srcset = `${base}.${ext}`; pic.append(so);
      }
      img.src = `${base}.jpg`;
      pic.append(img); med.append(pic);
    }
    img.width = s.w; img.height = s.h; img.alt = s.alt; img.decoding = 'async'; img.draggable = false;
    if (s.type === 'video' && s.video) {
      const v = document.createElement('video');
      v.muted = true; v.loop = s.video.loop !== false; v.playsInline = true; v.preload = 'none';   // krátky klip vstupu sa neopakuje, ostane na poslednej snímke
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.width = s.w; v.height = s.h; v.disablePictureInPicture = true;
      v.addEventListener('playing', () => el.classList.add('playing'));
      med.append(v);
      el._video = v;
    }
    kb.append(med); el.append(kb);
    el._kb = kb; el._media = med; el._img = img; el._stop = s;
    return el;
  }
  function plateFor(i) {
    const s = STOPS[i];
    let el = plates.get(s.id);
    if (!el) { el = makePlate(s); plates.set(s.id, el); view.append(el); applyView(el, { x: 0, y: 0 }, 1); }
    return el;
  }
  // keepShown: zábery, ktoré sú práve vidno (trieda on, aj počas prechodu), sa nechajú
  function prunePlates(keep, keepShown = false) {
    for (const [id, el] of plates) if (!keep.has(id) && !(keepShown && el.classList.contains('on'))) { el._video?.pause(); el.remove(); plates.delete(id); }
  }
  // Video: zdroje dostane len aktívna zastávka (preload auto) a nasledujúca (preload metadata); hrá len aktívna.
  function loadVideo(el, active) {
    const v = el?._video;
    if (!v || !videoOK) return;
    if (!v.dataset.src) {
      v.dataset.src = '1';
      v.preload = active ? 'auto' : 'metadata';
      v.innerHTML = `<source src="media/${el._stop.video.webm}" type="video/webm"><source src="media/${el._stop.video.mp4}" type="video/mp4">`;
    } else if (active) v.preload = 'auto';
  }
  function playVideo(el) {
    const v = el?._video;
    if (!v || !videoOK || document.hidden) return;
    loadVideo(el, true);
    v.play().catch(() => {});
  }

  // Zobrazenie záberu: pokrytie okna so stredom v bode focus, posun pohľadu pan a priblíženie zoom.
  function applyView(el, pan, zoom) {
    const s = el._stop;
    const sc = coverScale(s) * zoom, dw = s.w * sc, dh = s.h * sc;
    const ix = vw / 2 - s.focus.x / 100 * dw, iy = vh / 2 - s.focus.y / 100 * dh;
    const minX = vw - dw, minY = vh - dh;
    const tx = clamp(ix + pan.x, minX, 0), ty = clamp(iy + pan.y, minY, 0);
    el._media.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${sc.toFixed(5)})`;
    const L = { tx, ty, dw, dh, sc, minX, minY, ix, iy };
    el._L = L;
    return L;
  }

  // ——— Ken Burns: veľmi pomalý drift pokojového záberu (len transform, na kompozítore) ———
  // Rovnaká animácia beží aj na vrstve s bodmi, takže body ostávajú presne na svojich miestach.
  const DRIFT = [[-1, -0.6], [1, -0.4], [-0.8, 0.6], [0.9, 0.5]];
  let overlayKB = null;
  function startKB(el, i) {
    el._kbA?.cancel(); overlayKB?.cancel(); overlayKB = null;
    if (reduced) return;
    if (i === 0) {
      if (!introStarted) return;   // priblíženie začne spolu s úvodnou sekvenciou
      el._kbA = el._kb.animate(PUSH.kf, PUSH.opt);
      // prvý záber pokračuje presne tam, kde je úvodný obrázok (spoločný čas začiatku)
      if (heroPush && heroPush.startTime != null && heroPush.playState === 'running') el._kbA.startTime = heroPush.startTime;
      return;
    }
    const [dx, dy] = DRIFT[i % DRIFT.length], k = Math.min(vw, vh) <= 430 ? 7 : 12;
    const kf = [{ transform: 'translate3d(0,0,0) scale(1)' }, { transform: `translate3d(${(dx * k).toFixed(1)}px,${(dy * k).toFixed(1)}px,0) scale(1.045)` }];
    const opt = { duration: 22000, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' };
    el._kbA = el._kb.animate(kf, opt);
    overlayKB = overlay.animate(kf, opt);
    overlayKB.startTime = el._kbA.startTime;
  }

  // ——— stav pohľadu ———
  let cur = null, pan = { x: 0, y: 0 }, zoom = 1, vel = { x: 0, y: 0 }, inertia = 0, rafR = 0;
  let overlayItems = [], discPos = null, shown = null;   // shown = záber, ktorý je práve vidno
  function bounds() {
    const el = plates.get(STOPS[cur].id); if (!el) return null;
    const s = el._stop, sc = coverScale(s) * zoom, dw = s.w * sc, dh = s.h * sc;
    const ix = vw / 2 - s.focus.x / 100 * dw, iy = vh / 2 - s.focus.y / 100 * dh;
    return { minX: (vw - dw) - ix, maxX: -ix, minY: (vh - dh) - iy, maxY: -iy };
  }
  function clampPan() {
    const b = bounds(); if (!b) return;
    const nx = clamp(pan.x, b.minX, b.maxX), ny = clamp(pan.y, b.minY, b.maxY);
    if (nx !== pan.x) vel.x = 0;
    if (ny !== pan.y) vel.y = 0;
    pan.x = nx; pan.y = ny;
  }
  function requestRender() { if (!rafR) rafR = requestAnimationFrame(render); }
  // render len zapisuje (transformácie); všetky rozmery sú vopred uložené
  function render() {
    rafR = 0;
    if (cur == null) return;
    const el = plates.get(STOPS[cur].id); if (!el) return;
    const L = applyView(el, pan, zoom);
    const P = zpRect;
    for (const o of overlayItems) {
      let x = L.tx + o.x / 100 * L.dw, y = L.ty + o.y / 100 * L.dh;
      if (o.disc) {
        // disk smeru chôdze ostáva vždy v zábere (na šírku býva podlaha pod okrajom okna) a nikdy pod informačným oknom
        x = clamp(x, 96, vw - 96);
        let top = vh * 0.3;
        if (P && x > P.l - 60 && x < P.r + 60) top = Math.max(top, P.b + 56);
        y = clamp(y, Math.min(top, vh - hb - 44), vh - hb - 44);
        const lt = y > vh - hb - 110;
        if (o.lt !== lt) { o.lt = lt; o.el.classList.toggle('lab-top', lt); }
        discPos = { x, y };
      } else {
        // bod mimo okna alebo pod informačným oknom sa dá nájsť rozhliadaním, ale klávesom Tab sa nepreskakuje
        const under = !!P && x > P.l - 16 && x < P.r + 16 && y < P.b + 16;
        const vis = x >= 0 && x <= vw && y >= 0 && y <= vh && !under;
        if (o.vis !== vis) { o.vis = vis; o.el.tabIndex = vis ? 0 : -1; }
        if (o.under !== under) { o.under = under; o.el.style.visibility = under ? 'hidden' : ''; }
      }
      o.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    }
    const f = L.minX < -40 ? (L.tx - L.minX / 2) / (-L.minX / 2) : 0;   // -1 = pravý okraj, 1 = ľavý okraj
    const g = L.minY < -1 ? (L.ty - L.minY / 2) / (-L.minY / 2) : 0;
    // kompas sa otáča podľa vodorovného rozhliadania; kde záber nemá vodorovný priestor, podľa zvislého
    ring.setAttribute('transform', `rotate(${((L.minX < -40 ? f : g) * 45).toFixed(1)} 22 22)`);
    const par = `translate3d(${(f * 7).toFixed(1)}px,${(g * 5).toFixed(1)}px,0)`;
    hudTL.style.transform = par; hudTR.style.transform = par;
  }
  function setZoom(z) {
    const el = plates.get(STOPS[cur].id); if (!el) return;
    z = clamp(z, 1, 1.25);
    const L = el._L || applyView(el, pan, zoom);
    const u = (vw / 2 - L.tx) / L.sc, v = (vh / 2 - L.ty) / L.sc;   // bod obrazu v strede okna
    zoom = z;
    const s = el._stop, sc = coverScale(s) * zoom, dw = s.w * sc, dh = s.h * sc;
    const ix = vw / 2 - s.focus.x / 100 * dw, iy = vh / 2 - s.focus.y / 100 * dh;
    pan.x = (vw / 2 - u * sc) - ix; pan.y = (vh / 2 - v * sc) - iy;
    clampPan(); requestRender();
  }

  // ——— prechod = filmové prelínanie ———
  // Odchádzajúci záber sa jemne pohne smerom chôdze a rozplynie, nový sa pod ním usadí.
  // Web Animations (transform + opacity) bežia na kompozítore, hlavné vlákno počas prechodu nepracuje.
  let anim = null;
  function transition(fromEl, toEl, dir) {
    if (anim) anim.cancel();
    return new Promise(res => {
      const dur = reduced ? 380 : Math.min(vw, vh) <= 430 ? 1000 : 1200;
      let ox = vw / 2, oy = vh / 2;
      if (dir > 0 && discPos) { ox = discPos.x; oy = discPos.y; }
      fromEl.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      toEl.style.transformOrigin = '50% 50%';
      fromEl.style.zIndex = 3; toEl.style.zIndex = 2;
      fromEl.classList.add('on'); toEl.classList.add('on');
      let a1, a2 = null, finished = false;
      if (reduced) a1 = fromEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, fill: 'forwards' });
      else {
        const s1 = dir > 0 ? 1.08 : 0.97, s2 = dir > 0 ? 1.04 : 1.06;
        a1 = fromEl.animate([
          { transform: 'scale(1)', opacity: 1, easing: 'cubic-bezier(.5,0,.3,1)' },
          { transform: `scale(${s1})`, opacity: 0 }
        ], { duration: dur, fill: 'forwards' });
        a2 = toEl.animate([{ transform: `scale(${s2})` }, { transform: 'scale(1)' }], { duration: dur * 1.25, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      }
      const done = () => {
        if (finished) return;
        finished = true;
        a1.cancel();
        for (const p of plates.values()) {
          const on = p === toEl;
          p.classList.toggle('on', on);   // aj pri zrušení ostáva vidno len cieľ
          if (!on) { p._kbA?.cancel(); p._kbA = null; }
        }
        fromEl.style.zIndex = ''; toEl.style.zIndex = '';
        shown = toEl; anim = null; res();
      };
      a1.onfinish = done;
      // usadenie nového záberu dobehne samo; pri zrušení ho treba zastaviť
      anim = { cancel: () => { a2?.cancel(); done(); } };
      if (a2) a2.onfinish = () => a2.cancel();
    });
  }

  // ——— kapitola pri vstupe do novej zóny ———
  let chapAnims = [], chapTimer = 0, chapPending = 0, lastZone = null;
  function showChapter(z) {
    clearTimeout(chapTimer);
    chapAnims.forEach(a => a.cancel()); chapAnims = [];
    chK.textContent = `Kapitola ${pad(zoneNo[z.id])}`;
    chT.textContent = z.name;
    chS.textContent = z.chapter || '';
    chapter.classList.add('show');
    const hold = reduced ? 1500 : 2200, out = reduced ? 500 : 1200, total = hold + out;
    const card = chapter.animate([
      { opacity: 0 }, { opacity: 1, offset: (reduced ? 200 : 450) / total }, { opacity: 1, offset: hold / total }, { opacity: 0 }
    ], { duration: total, fill: 'both' });
    chapAnims.push(card);
    if (!reduced) {
      stage.classList.add('lb-on');
      chapTimer = setTimeout(() => stage.classList.remove('lb-on'), hold);
      [chK, chT, chRule, chS].forEach((el, k) => chapAnims.push(el.animate(
        [{ transform: 'translate3d(0,20px,0)', opacity: 0 }, { transform: 'translate3d(0,0,0)', opacity: 1 }],
        { duration: 1100, delay: 120 + k * 130, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' })));
      // titul kapitoly sa počas držania ešte jemne priblíži
      chapAnims.push(chT.animate([{ scale: '1' }, { scale: '1.04' }], { duration: total, easing: 'linear' }));
    }
    card.onfinish = () => { chapter.classList.remove('show'); chapAnims.forEach(a => a.cancel()); chapAnims = []; };
  }
  function hideChapter() {
    clearTimeout(chapTimer); clearTimeout(chapPending);
    stage.classList.remove('lb-on');
    chapAnims.forEach(a => a.cancel()); chapAnims = []; chapter.classList.remove('show');
  }

  // ——— informačné okno o zóne ———
  let zpZone = null, zpTouched = false, deskCollapsed = false;
  try { deskCollapsed = localStorage.getItem('gk-zp') === '0'; } catch {}
  const compactPanel = () => vw <= 760 || vh <= 500;
  function setCollapsed(c) {
    zp.classList.toggle('collapsed', c);
    zpToggle.setAttribute('aria-expanded', String(!c));
  }
  zpToggle.addEventListener('click', () => {
    const c = !zp.classList.contains('collapsed');
    setCollapsed(c); zpTouched = true;
    if (!compactPanel()) { deskCollapsed = c; try { localStorage.setItem('gk-zp', c ? '0' : '1'); } catch {} }
  });
  function updatePanel(s) {
    const z = zoneById[s.zone];
    if (zpZone === z.id) {
      // na telefóne sa okno po prvej zastávke zóny samo zbalí, aby bolo vidno záber (ak ho návštevník neovládal)
      if (compactPanel() && !zpTouched) setCollapsed(true);
      return;
    }
    zpZone = z.id; zpTouched = false;
    zpKicker.textContent = `Kapitola ${pad(zoneNo[z.id])}`;
    zpTitle.textContent = z.name;
    zpText.textContent = (z.about || [z.blurb]).join(' ');
    zpList.replaceChildren(...(z.items || []).map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
    setCollapsed(compactPanel() ? vh <= 500 : deskCollapsed);
    if (!reduced) zp.animate([{ opacity: 0, transform: 'translate3d(0,12px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
      { duration: 900, delay: lastZone == null ? 300 : 1400, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  }

  // ——— HUD ———
  const stripBtns = [], mmRects = new Map(), menuBtns = [];
  const thumb = (id, cls) => `<picture><source type="image/avif" srcset="media/thumb-${id}.avif"><source type="image/webp" srcset="media/thumb-${id}.webp"><img src="media/thumb-${id}.jpg" width="480" height="320" alt="" loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ''}></picture>`;
  // pás zón
  for (const z of ZONES) {
    const g = document.createElement('div'); g.className = 'sg';
    g.innerHTML = `<span class="sg-name" aria-hidden="true">${z.name}</span><div class="sg-row" role="group" aria-label="${z.name}"></div>`;
    const row = g.lastElementChild;
    STOPS.forEach((s, i) => {
      if (s.zone !== z.id) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'st'; b.setAttribute('aria-current', 'false');
      b.setAttribute('aria-label', `${pad(i + 1)} ${z.name}: ${s.title}`);
      b.innerHTML = thumb(s.id);
      b.addEventListener('click', () => jump(i));
      row.append(b); stripBtns[i] = b;
    });
    strip.append(g);
  }
  // minimapa (schéma zón, nie pôdorys)
  {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100');
    for (const rc of data.zonesLayout) {
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', rc.x); r.setAttribute('y', rc.y); r.setAttribute('width', rc.w); r.setAttribute('height', rc.h); r.setAttribute('rx', 2);
      r.setAttribute('class', 'mz'); r.dataset.zone = rc.id;
      const t = document.createElementNS(ns, 'title'); t.textContent = zoneById[rc.id]?.name || rc.id; r.append(t);
      r.addEventListener('click', () => { const i = STOPS.findIndex(s => s.zone === rc.id); if (i >= 0) jump(i); });
      svg.append(r); mmRects.set(rc.id, r);
    }
    minimap.append(svg);
    const lab = document.createElement('span'); lab.className = 'minimap-lab'; lab.textContent = data.zonesLayoutNote?.split(',')[0] || 'schéma zón';
    minimap.append(lab);
  }
  // dialóg so zoznamom zón a zastávok (slúži aj čítačkám obrazovky)
  {
    const head = document.createElement('div'); head.className = 'menu-head';
    head.innerHTML = `<h2 id="h-menu">Zoznam zón</h2><button class="ico ico-txt" type="button" id="menuClose">Zavrieť</button>`;
    const body = document.createElement('nav'); body.className = 'menu-body'; body.setAttribute('aria-label', 'Zastávky prehliadky');
    for (const z of ZONES) {
      const zs = STOPS.map((s, i) => [s, i]).filter(([s]) => s.zone === z.id);
      const sec = document.createElement('section'); sec.className = 'menu-zone';
      sec.innerHTML = `<h3>${z.name}<small>${zs.length} ${zs.length === 1 ? 'zastávka' : zs.length < 5 ? 'zastávky' : 'zastávok'}</small></h3><p>${z.blurb}</p><ul class="menu-stops"></ul>`;
      const ul = sec.lastElementChild;
      for (const [s, i] of zs) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ms'; b.setAttribute('aria-current', 'false');
        b.innerHTML = `${thumb(s.id)}<span><b>${pad(i + 1)}</b>${s.title}</span>`;
        b.addEventListener('click', () => { menu.close(); jump(i); });
        li.append(b); ul.append(li); menuBtns[i] = b;
      }
      body.append(sec);
    }
    menu.append(head, body);
    $('#menuClose').addEventListener('click', () => menu.close());
    menuBtn.addEventListener('click', () => { menu.showModal(); menuBtns[cur]?.focus(); });
    menu.addEventListener('click', e => { if (e.target === menu) menu.close(); });
  }
  ro.observe(hudB); ro.observe(zp); ro.observe(strip);

  const toEnd = () => $('#koniec').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  function buildOverlay(s, i) {
    overlayItems = [];
    const frag = document.createDocumentFragment();
    for (const p of s.pins || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pin' + (p.x < 18 ? ' right' : p.x > 82 ? ' left' : '');
      b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', p.label);
      b.innerHTML = `<span class="pin-dot"></span><span class="pin-lab" aria-hidden="true">${p.label}</span>`;
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-expanded') === 'true';
        overlay.querySelectorAll('.pin[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
        b.setAttribute('aria-expanded', String(!on));
      });
      frag.append(b); overlayItems.push({ el: b, x: p.x, y: p.y });
    }
    const w = s.walk || { x: 50, y: 85 };
    const d = document.createElement('button');
    d.type = 'button';
    const last = i === N - 1;
    d.className = 'disc' + (last ? ' end' : '');
    const label = last ? 'Koniec prechádzky' : (s.hotspot?.label || `Ďalej: ${zoneById[STOPS[i + 1].zone].name}`);
    d.setAttribute('aria-label', last ? 'Koniec prechádzky: prejsť na záver a kontakt' : label);
    d.innerHTML = `<span class="disc-ring"><span class="disc-arrow"></span></span><span class="disc-lab" aria-hidden="true">${label}</span>`;
    d.addEventListener('click', () => {
      if (last) toEnd();
      else jump(s.hotspot?.target != null && idx[s.hotspot.target] != null ? idx[s.hotspot.target] : i + 1);
    });
    frag.append(d); overlayItems.push({ el: d, x: w.x, y: w.y, disc: true });
    const hadFocus = overlay.contains(document.activeElement);
    overlay.replaceChildren(frag);
    if (hadFocus) d.focus({ preventScroll: true });   // zameranie neprepadne na začiatok stránky, pokračuje na novom disku
  }

  const seen = new Set();
  function updateHud(i) {
    const s = STOPS[i], z = zoneById[s.zone];
    hudZone.textContent = z.name;
    hudTitle.textContent = s.title;
    hudCount.textContent = `${pad(i + 1)} / ${N}`;
    desc.textContent = `${z.name}, zastávka ${i + 1} z ${N}: ${s.title}. ${s.alt}`;
    stage.classList.toggle('is-open', i === 0);
    stripBtns.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
    menuBtns.forEach((b, j) => b.setAttribute('aria-current', j === i ? 'true' : 'false'));
    if (stripPos[i] != null) strip.scrollTo({ left: stripPos[i] - stripW / 2, behavior: reduced ? 'auto' : 'smooth' });   // uložené polohy, bez čítania rozloženia
    seen.add(s.zone);
    for (const [zid, r] of mmRects) { r.classList.toggle('cur', zid === s.zone); r.classList.toggle('seen', zid !== s.zone && seen.has(zid)); }
    prevBtn.disabled = i === 0; nextBtn.disabled = i === N - 1;
    updatePanel(s);
    buildOverlay(s, i);
    const h = i === 0 ? '' : '#' + s.id;
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
  }

  // ——— výber zastávky ———
  let seq = 0;
  async function setStop(i, animate = true) {
    if (i === cur) return;
    const my = ++seq;
    const from = cur, dir = from == null || i > from ? 1 : -1;
    const origin = dir > 0 ? discPos : null;   // disk predchádzajúcej zastávky = miesto, kam sa kráča
    cur = i; pan = { x: 0, y: 0 }; zoom = 1; vel = { x: 0, y: 0 }; cancelAnimationFrame(inertia); inertia = 0;
    const el = plateFor(i);
    // pri rýchlom skrolovaní sa predbehnuté zastávky hneď uvoľnia: ostáva len to, čo je vidno, a nový cieľ
    prunePlates(new Set([STOPS[i].id]), true);
    applyView(el, pan, zoom);
    updateHud(i);
    discPos = origin;
    for (const p of plates.values()) if (p !== el) p._video?.pause();
    // kapitola pri zmene zóny (okrem terasy, tú uvádza úvod); pri rýchlom skrolovaní len pre cieľovú zónu
    const zid = STOPS[i].zone;
    clearTimeout(chapPending);
    if (zid !== lastZone) {
      if (i === 0) hideChapter();
      else chapPending = setTimeout(() => { if (my === seq) showChapter(zoneById[zid]); }, lastZone == null ? 400 : 160);
      lastZone = zid;
    }
    if (shown && shown !== el && animate && !document.hidden) {
      // obraz sa ukáže až dekódovaný (inak by prvé snímky prechodu sekali)
      await Promise.race([el._img.decode().catch(() => {}), wait(1500)]);
      if (my !== seq) return;   // predbehnuté volanie; novšie už uvoľnilo zábery a dokončí krok
      if (anim) { anim.cancel(); prunePlates(new Set([STOPS[i].id]), true); }   // zrušený prechod nechá vidno svoj cieľ, odtiaľ sa kráča ďalej
      startKB(el, i);
      if (shown !== el) {
        const p = transition(shown, el, dir);   // počiatok prechodu = disk predchádzajúcej zastávky
        render();
        await p;
      } else render();
      if (my !== seq) return;
    } else {
      if (anim) anim.cancel();
      for (const p of plates.values()) p.classList.toggle('on', p === el);
      shown = el;
      startKB(el, i);
      render();
    }
    if (!stage.classList.contains('ready')) { const mark = () => stage.classList.add('ready'); if (el._img.complete) mark(); else el._img.addEventListener('load', mark, { once: true }); }
    // ponechať len predchádzajúcu, aktuálnu a nasledujúcu; nasledujúcu načítať a dekódovať dopredu
    const keep = new Set([STOPS[i].id]);
    if (i > 0) keep.add(STOPS[i - 1].id);
    if (i < N - 1) {
      keep.add(STOPS[i + 1].id);
      const nx = plateFor(i + 1);
      loadVideo(nx, false);
      idle(() => { if (my === seq && nx.isConnected) nx._img.decode().catch(() => {}); });
    }
    prunePlates(keep);
    playVideo(el);
  }
  function jump(i) {
    i = clamp(i, 0, N - 1);
    scrollTo({ top: posOf(i), behavior: 'instant' });
    setStop(i);
  }

  // ——— skrolovanie → zastávka ———
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const act = tourActive();
      root.classList.toggle('in-tour', act);
      if (!act) { clearTimeout(chapPending); if (chapter.classList.contains('show') && scrollY > tTop + tourH - vh) hideChapter(); }
      const i = indexAt(scrollY);
      if (i !== cur) setStop(i);
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  // ——— rozhliadanie: ťahanie, zotrvačnosť, štipnutie, koliesko s Ctrl ———
  // Scéna má touch-action: none. Prst: vodorovný ťah rozhliada, zvislý ťah = presne jeden krok (žiadne
  // zotrvačné preskakovanie zastávok). Myš: ťahanie v zábere rozhliada oboma smermi, koliesko skroluje.
  const ptrs = new Map();
  let drag = null, pinch = null;
  const dist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const SWIPE = 40;   // px zvislého ťahu prstom na jeden krok
  function swipeStep(dy) {
    if (dy < 0) { if (cur < N - 1) jump(cur + 1); else toEnd(); }
    else if (cur > 0) jump(cur - 1);
  }
  const PASSIVE = { passive: true };
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && (e.button !== 0 || !e.target.closest('.view'))) return;
    if (e.target.closest('a,dialog,.hud-b,.hud-tr,.zp')) return;   // prst môže švihnúť aj z bodu alebo disku, ťuknutie ostáva kliknutím
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    cancelAnimationFrame(inertia); inertia = 0; vel = { x: 0, y: 0 };
    if (ptrs.size === 1) drag = { lx: e.clientX, ly: e.clientY, sx: e.clientX, sy: e.clientY, vx: 0, vy: 0, t: performance.now(), touch: e.pointerType !== 'mouse', axis: null };
    else if (ptrs.size === 2) { pinch = { d: dist(), z: zoom }; drag = null; }
  }, PASSIVE);
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch) { setZoom(pinch.z * dist() / pinch.d); return; }
    if (!drag) return;
    if (drag.touch && !drag.axis) {
      const ax = Math.abs(e.clientX - drag.sx), ay = Math.abs(e.clientY - drag.sy);
      if (Math.max(ax, ay) < 8) return;
      drag.axis = ay > ax ? 'y' : 'x';
    }
    if (drag.axis === 'y') { drag.ly = e.clientY; return; }   // krok sa vyhodnotí pri zdvihnutí prsta
    const now = performance.now(), dt = Math.max(1, now - drag.t);
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    pan.x += dx; pan.y += dy; clampPan();
    drag.vx = 0.7 * drag.vx + 0.3 * (dx / dt * 16); drag.vy = 0.7 * drag.vy + 0.3 * (dy / dt * 16);
    drag.lx = e.clientX; drag.ly = e.clientY; drag.t = now;
    if (!drag.on) { drag.on = true; view.classList.add('dragging'); }
    requestRender();
  }, PASSIVE);
  function endPtr(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      if (drag && drag.axis === 'y') { const dy = drag.ly - drag.sy; if (e.type !== 'pointercancel' && Math.abs(dy) >= SWIPE) swipeStep(dy); }
      else if (drag && !reduced && performance.now() - drag.t < 90) { vel = { x: drag.vx, y: drag.vy }; startInertia(); }
      drag = null; view.classList.remove('dragging');
    }
  }
  stage.addEventListener('pointerup', endPtr, PASSIVE);
  stage.addEventListener('pointercancel', endPtr, PASSIVE);
  stage.addEventListener('lostpointercapture', endPtr, PASSIVE);
  function startInertia() {
    cancelAnimationFrame(inertia);
    const tick = () => {
      pan.x += vel.x; pan.y += vel.y; vel.x *= 0.93; vel.y *= 0.93; clampPan(); requestRender();
      inertia = Math.hypot(vel.x, vel.y) > 0.15 ? requestAnimationFrame(tick) : 0;
    };
    inertia = requestAnimationFrame(tick);
  }
  view.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();   // jediný aktívny poslucháč: priblíženie kolieskom s Ctrl
    setZoom(zoom * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  view.addEventListener('dblclick', e => { if (!e.target.closest('button,a')) setZoom(zoom > 1.05 ? 1 : 1.25); });

  // ——— pohyb zariadenia (na dotykových zariadeniach, na iOS po povolení) ———
  if ('DeviceOrientationEvent' in window && coarse && !reduced) {
    motionBtn.hidden = false;
    let base = null, target = null, rafM = 0, on = false;
    const onOrient = e => {
      if (e.gamma == null || e.beta == null) return;
      if (!base) base = { g: e.gamma, b: e.beta };
      const port = vh >= vw;
      const dxDeg = port ? e.gamma - base.g : e.beta - base.b;
      const dyDeg = port ? e.beta - base.b : -(e.gamma - base.g);
      target = { x: clamp(-dxDeg, -30, 30) * 10, y: clamp(-dyDeg, -30, 30) * 10 };
      if (!rafM) rafM = requestAnimationFrame(follow);
    };
    const follow = () => {
      rafM = 0;
      if (!on || !target || drag) return;
      pan.x += (target.x - pan.x) * 0.08; pan.y += (target.y - pan.y) * 0.08; clampPan(); requestRender();
      if (Math.abs(target.x - pan.x) + Math.abs(target.y - pan.y) > 0.5) rafM = requestAnimationFrame(follow);
    };
    motionBtn.addEventListener('click', async () => {
      if (on) { on = false; removeEventListener('deviceorientation', onOrient); motionBtn.setAttribute('aria-pressed', 'false'); motionBtn.textContent = 'Povoliť pohyb'; return; }
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const st = await DeviceOrientationEvent.requestPermission();
          if (st !== 'granted') return;
        }
      } catch { return; }
      on = true; base = null;
      addEventListener('deviceorientation', onOrient, PASSIVE);
      motionBtn.setAttribute('aria-pressed', 'true'); motionBtn.textContent = 'Pohyb zapnutý';
    });
  }

  // ——— celá obrazovka ———
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    const on = !!document.fullscreenElement;
    fsBtn.setAttribute('aria-pressed', String(on));
    fsBtn.setAttribute('aria-label', on ? 'Ukončiť celú obrazovku' : 'Celá obrazovka');
  });

  // ——— tlačidlá, klávesy, odkazy ———
  prevBtn.addEventListener('click', () => jump(cur - 1));
  nextBtn.addEventListener('click', () => jump(cur + 1));
  $('#enter').addEventListener('click', e => { e.preventDefault(); jump(1); });
  $('#navTour').addEventListener('click', e => { e.preventDefault(); jump(cur > 0 ? cur : 1); });
  document.addEventListener('keydown', e => {
    if (menu.open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (!tourActive()) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { if (cur >= N - 1) return; e.preventDefault(); jump(cur + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { if (cur <= 0) return; e.preventDefault(); jump(cur - 1); }
    else if (k === 'Home') { e.preventDefault(); jump(0); }
    else if (k === 'End') { e.preventDefault(); jump(N - 1); }
  });
  addEventListener('hashchange', () => {
    const i = idx[decodeURIComponent(location.hash.slice(1))];
    if (i != null && i !== cur) jump(i);
  });

  // ——— zmena veľkosti okna (lacné prekreslenie v snímke, drahé prepočítanie s oneskorením), skrytá karta ———
  let rsRaf = 0, rsT = 0;
  function relayout() {
    const h = innerHeight;
    if (vw !== innerWidth || Math.abs(h - vhBase) > vhBase * 0.2) {
      vhBase = h; step = Math.round(vhBase * 0.85); tail = Math.round(vhBase * 0.5);
      layoutTour();
      if (cur != null && tourActive()) scrollTo({ top: posOf(cur), behavior: 'instant' });
    }
  }
  addEventListener('resize', () => {
    if (!rsRaf) rsRaf = requestAnimationFrame(() => {
      rsRaf = 0;
      vw = innerWidth; vh = innerHeight;
      syncHero();
      const c = cur != null ? plates.get(STOPS[cur].id) : null;
      for (const el of plates.values()) applyView(el, el === c ? pan : { x: 0, y: 0 }, el === c ? zoom : 1);
      clampPan(); requestRender();
    });
    clearTimeout(rsT); rsT = setTimeout(relayout, 180);
  }, PASSIVE);
  document.addEventListener('visibilitychange', () => {
    const el = cur != null ? plates.get(STOPS[cur].id) : null;
    if (document.hidden) el?._video?.pause(); else playVideo(el);
  });

  onIntro = () => { if (cur === 0 && shown) startKB(shown, 0); };

  // ——— štart: priamy odkaz #id alebo obnovená poloha ———
  let start = idx[deepLink];
  if (start != null) {
    scrollTo({ top: posOf(start), behavior: 'instant' });
    // po priamom odkaze má Tab pokračovať do ovládania prehliadky, nie za scénou (kde bol zoznam)
    stage.tabIndex = -1; stage.focus({ preventScroll: true });
  } else start = indexAt(scrollY);
  if (start !== 0) { hero.hidden = true; heroPush?.cancel(); root.classList.add('no-intro'); startIntro(); }
  root.classList.toggle('in-tour', tourActive());
  await setStop(start, false);
}

main().catch(err => {
  // bez údajov ostáva stránka bez JS: zoznam zastávok a sekcie pod ním
  console.warn('Prechádzka sa nespustila, zobrazuje sa zoznam zastávok.', err);
  root.classList.remove('js');
  hud.hidden = true;
});
