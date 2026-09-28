// GYM KLUB – prechádzka fitkom.
// Jeden stav: poloha skrolovania vyberá zastávku (dopredu aj dozadu, po obnovení aj z priameho odkazu #id),
// ťahanie obrazom posúva pohľad v rámci ostrého záberu. Bez knižníc, bez cudzích požiadaviek.

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const pad = n => String(n).padStart(2, '0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const coarse = matchMedia('(pointer: coarse)').matches;
const videoOK = !reduced && !saveData;

const tour = $('#prehliadka'), stage = $('#stage'), view = $('#view'), overlay = $('#overlay');
const hud = $('#hud'), hero = $('#hero'), zoznam = $('#zoznam'), menu = $('#menu');
const hudZone = $('#hudZone'), hudTitle = $('#hudTitle'), hudCount = $('#hudCount'), desc = $('#stopDesc');
const strip = $('#strip'), minimap = $('#minimap'), ring = $('#compassRing');
const prevBtn = $('#prev'), nextBtn = $('#next'), menuBtn = $('#menuBtn'), fsBtn = $('#fs'), motionBtn = $('#motion');

async function main() {
  const r = await fetch('assets/tour-data.json');
  if (!r.ok) throw new Error('tour-data.json ' + r.status);
  const data = await r.json();
  const STOPS = data.stops.slice().sort((a, b) => a.order - b.order);
  const N = STOPS.length;
  const ZONES = data.zones;
  const zoneById = Object.fromEntries(ZONES.map(z => [z.id, z]));
  const idx = Object.fromEntries(STOPS.map((s, i) => [s.id, i]));

  // ——— rozmery a poloha zastávok ———
  // Krok je odvodený zo stabilnej výšky okna (mení sa len pri otočení alebo veľkej zmene),
  // aby skrývanie adresného riadka na mobile neposúvalo zastávky.
  let vw = innerWidth, vh = innerHeight, vhBase = vh;
  let step = Math.round(vhBase * 0.85), tail = Math.round(vhBase * 0.5), tTop = 0;
  const posOf = i => tTop + i * step;
  const indexAt = y => clamp(Math.round((y - tTop) / step), 0, N - 1);

  // zoznam pre stránku bez JS už netreba, nahradia ho značky zastávok (#id) a dialóg so zoznamom
  zoznam.remove();
  // značky idú pred scénu, aby po priamom odkaze pokračoval Tab do ovládania prehliadky
  const markers = STOPS.map(s => { const m = document.createElement('div'); m.className = 'mark'; m.id = s.id; return m; });
  stage.before(...markers);
  function layoutTour() {
    tour.style.height = ((N - 1) * step + vhBase + tail) + 'px';
    markers.forEach((m, i) => { m.style.top = (i * step) + 'px'; });
    tTop = Math.round(tour.getBoundingClientRect().top + scrollY);
  }
  layoutTour();
  hud.hidden = false;

  // ——— plátna so záberom ———
  const plates = new Map();
  // Pokrytie okna. Na šírku sa záber zväčší až o 18 %, aby mal vodorovný ťah priestor, ale nikdy
  // nad natívne rozlíšenie záberu v CSS px (ostrosť má prednosť; na 1920 px širokom okne ostáva len pokrytie).
  const OVER = 1.18;
  const coverScale = s => { const s0 = Math.max(vw / s.w, vh / s.h); return vw > vh ? s0 * clamp(1 / s0, 1, OVER) : s0; };
  const sizesFor = s => `(orientation: landscape) ${Math.round(OVER * 100)}vw, (min-aspect-ratio: ${s.w}/${s.h}) 100vw, ${(s.w / s.h * 100).toFixed(2)}vh`;
  // úvodný obrázok (hero) musí mať rovnaké zväčšenie ako prvý záber, inak by pri prepnutí poskočil
  function syncHero() { const s = STOPS[0], s0 = Math.max(vw / s.w, vh / s.h); hero.style.transform = `scale(${(coverScale(s) / s0).toFixed(4)})`; }
  syncHero();
  function makePlate(s) {
    const el = document.createElement('div');
    el.className = 'plate'; el.dataset.id = s.id;
    const med = document.createElement('div');
    med.className = 'plate-media';
    med.style.width = s.w + 'px'; med.style.height = s.h + 'px';
    const base = s.src, [big, small] = s.sizes, sizes = sizesFor(s);
    const pic = document.createElement('picture');
    for (const [type, ext] of [['image/avif', 'avif'], ['image/webp', 'webp']]) {
      const so = document.createElement('source');
      so.type = type; so.sizes = sizes;
      so.srcset = `media/${base}-${big}.${ext} ${big}w, media/${base}-${small}.${ext} ${small}w`;
      pic.append(so);
    }
    const img = document.createElement('img');
    img.sizes = sizes;
    img.srcset = `media/${base}-${big}.jpg ${big}w, media/${base}-${small}.jpg ${small}w`;
    img.src = `media/${base}-${small}.jpg`;
    img.width = s.w; img.height = s.h; img.alt = s.alt; img.decoding = 'async'; img.draggable = false;
    pic.append(img);
    med.append(pic);
    if (s.type === 'video' && s.video) {
      const v = document.createElement('video');
      v.muted = true; v.loop = s.video.loop !== false; v.playsInline = true; v.preload = 'none';   // krátky klip vstupu sa neopakuje, ostane na poslednej snímke
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.width = s.w; v.height = s.h; v.disablePictureInPicture = true;
      v.addEventListener('playing', () => el.classList.add('playing'));
      med.append(v);
      el._video = v;
    }
    el.append(med);
    el._media = med; el._img = img; el._stop = s;
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
  function loadVideo(el, preload) {
    const v = el._video;
    if (!v || !videoOK) return;
    if (!v.dataset.src) {
      v.dataset.src = '1';
      v.innerHTML = `<source src="media/${el._stop.video.webm}" type="video/webm"><source src="media/${el._stop.video.mp4}" type="video/mp4">`;
    }
    if (preload && v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
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

  // ——— stav pohľadu ———
  let cur = null, pan = { x: 0, y: 0 }, zoom = 1, vel = { x: 0, y: 0 }, inertia = 0, rafR = 0;
  let overlayItems = [], discPos = null, shown = null;   // shown = záber, ktorý je práve vidno
  const hudB = $('.hud-b');
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
  function render() {
    rafR = 0;
    if (cur == null) return;
    const el = plates.get(STOPS[cur].id); if (!el) return;
    const L = applyView(el, pan, zoom);
    const hb = hudB.offsetHeight || 120;
    for (const o of overlayItems) {
      let x = L.tx + o.x / 100 * L.dw, y = L.ty + o.y / 100 * L.dh;
      if (o.disc) {
        // disk smeru chôdze ostáva vždy v zábere (na šírku býva podlaha pod okrajom okna)
        x = clamp(x, 96, vw - 96); y = clamp(y, vh * 0.3, vh - hb - 44);
        o.el.classList.toggle('lab-top', y > vh - hb - 110);
        discPos = { x, y };
      } else {
        // bod mimo okna sa dá nájsť rozhliadaním, ale klávesom Tab sa nepreskakuje (zameranie by posunulo scénu)
        const vis = x >= 0 && x <= vw && y >= 0 && y <= vh;
        if (o.vis !== vis) { o.vis = vis; o.el.tabIndex = vis ? 0 : -1; }
      }
      o.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }
    const f = L.minX < -40 ? (L.tx - L.minX / 2) / (-L.minX / 2) : 0;   // -1 = pravý okraj, 1 = ľavý okraj
    const g = L.minY < -1 ? (L.ty - L.minY / 2) / (-L.minY / 2) : 0;
    // kompas sa otáča podľa vodorovného rozhliadania; kde záber nemá vodorovný priestor, podľa zvislého
    ring.style.transform = `rotate(${((L.minX < -40 ? f : g) * 45).toFixed(1)}deg)`;
    hud.style.setProperty('--px', (f * 7).toFixed(1) + 'px');
    hud.style.setProperty('--py', (g * 5).toFixed(1) + 'px');
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

  // ——— prechod = krok vpred (alebo späť) ———
  let anim = null;
  function transition(fromEl, toEl, dir) {
    if (anim) anim.cancel();
    return new Promise(res => {
      const dur = reduced ? 350 : 650;
      let ox = vw / 2, oy = vh / 2;
      if (dir > 0 && discPos) { ox = discPos.x; oy = discPos.y; }
      fromEl.style.transformOrigin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      toEl.style.transformOrigin = `${(vw / 2).toFixed(1)}px ${(vh / 2).toFixed(1)}px`;
      fromEl.style.zIndex = 3; toEl.style.zIndex = 2;
      fromEl.classList.add('on'); toEl.classList.add('on');
      const t0 = performance.now();
      let raf = 0;
      const done = () => {
        cancelAnimationFrame(raf);
        for (const p of plates.values()) p.classList.toggle('on', p === toEl);   // aj pri zrušení ostáva vidno len cieľ
        for (const el of [fromEl, toEl]) { el.style.opacity = ''; el.style.transform = ''; el.style.zIndex = ''; }
        shown = toEl; anim = null; res();
      };
      const tick = now => {
        const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3), fade = 1 - clamp(t / 0.8, 0, 1);
        if (reduced) fromEl.style.opacity = (1 - t).toFixed(3);
        else if (dir > 0) {
          fromEl.style.transform = `scale(${(1 + 0.28 * e).toFixed(4)})`; fromEl.style.opacity = fade.toFixed(3);
          toEl.style.transform = `scale(${(1.08 - 0.08 * e).toFixed(4)})`;
        } else {
          fromEl.style.transform = `scale(${(1 - 0.12 * e).toFixed(4)})`; fromEl.style.opacity = fade.toFixed(3);
          toEl.style.transform = `scale(${(1.12 - 0.12 * e).toFixed(4)})`;
        }
        if (t < 1) raf = requestAnimationFrame(tick); else done();
      };
      anim = { cancel: done };
      raf = requestAnimationFrame(tick);
    });
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
    d.setAttribute('aria-label', last ? 'Koniec prechádzky: prejsť na parametre priestoru' : label);
    d.innerHTML = `<span class="disc-ring"><span class="disc-arrow"></span></span><span class="disc-lab" aria-hidden="true">${label}</span>`;
    d.addEventListener('click', () => {
      if (last) $('#parametre').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
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
    const b = stripBtns[i];
    if (b) strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
    seen.add(s.zone);
    for (const [zid, r] of mmRects) { r.classList.toggle('cur', zid === s.zone); r.classList.toggle('seen', zid !== s.zone && seen.has(zid)); }
    prevBtn.disabled = i === 0; nextBtn.disabled = i === N - 1;
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
    if (shown && shown !== el && animate && !document.hidden) {
      await Promise.race([el._img.decode().catch(() => {}), new Promise(r => setTimeout(r, 500))]);
      if (my !== seq) return;   // predbehnuté volanie; novšie už uvoľnilo zábery a dokončí krok
      if (anim) { anim.cancel(); prunePlates(new Set([STOPS[i].id]), true); }   // zrušený prechod nechá vidno svoj cieľ, odtiaľ sa kráča ďalej
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
      render();
    }
    if (!stage.classList.contains('ready')) { const mark = () => stage.classList.add('ready'); if (el._img.complete) mark(); else el._img.addEventListener('load', mark, { once: true }); }
    // ponechať len predchádzajúcu, aktuálnu a nasledujúcu; nasledujúcu načítať dopredu
    const keep = new Set([STOPS[i].id]);
    if (i > 0) keep.add(STOPS[i - 1].id);
    if (i < N - 1) { keep.add(STOPS[i + 1].id); const nx = plateFor(i + 1); loadVideo(nx, true); }
    prunePlates(keep);
    playVideo(el);
  }
  function jump(i) {
    i = clamp(i, 0, N - 1);
    scrollTo({ top: posOf(i), behavior: 'instant' });
    setStop(i);
  }
  const tourActive = () => { const r = tour.getBoundingClientRect(); return r.top <= 1 && r.bottom >= vh * 0.5; };

  // ——— skrolovanie → zastávka ———
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      root.classList.toggle('in-tour', tourActive());
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
    if (dy < 0) { if (cur < N - 1) jump(cur + 1); else $('#parametre').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
    else if (cur > 0) jump(cur - 1);
  }
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && (e.button !== 0 || !e.target.closest('.view'))) return;
    if (e.target.closest('a,dialog,.hud-b,.hud-tr')) return;   // prst môže švihnúť aj z bodu alebo disku, ťuknutie ostáva kliknutím
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.setPointerCapture(e.pointerId);
    cancelAnimationFrame(inertia); inertia = 0; vel = { x: 0, y: 0 };
    if (ptrs.size === 1) drag = { lx: e.clientX, ly: e.clientY, sx: e.clientX, sy: e.clientY, vx: 0, vy: 0, t: performance.now(), touch: e.pointerType !== 'mouse', axis: null };
    else if (ptrs.size === 2) { pinch = { d: dist(), z: zoom }; drag = null; }
  });
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
    view.classList.add('dragging');
    requestRender();
  });
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
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);
  stage.addEventListener('lostpointercapture', endPtr);
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
    e.preventDefault();
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
      const port = !matchMedia('(orientation: landscape)').matches;
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
      addEventListener('deviceorientation', onOrient);
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

  // ——— zmena veľkosti okna, skrytá karta ———
  addEventListener('resize', () => {
    const w = innerWidth, h = innerHeight;
    const big = w !== vw || Math.abs(h - vhBase) > vhBase * 0.2;
    vw = w; vh = h;
    if (big) {
      vhBase = h; step = Math.round(vhBase * 0.85); tail = Math.round(vhBase * 0.5);
      layoutTour();
      if (cur != null && tourActive()) scrollTo({ top: posOf(cur), behavior: 'instant' });
    }
    syncHero();
    for (const el of plates.values()) applyView(el, el === plates.get(STOPS[cur]?.id) ? pan : { x: 0, y: 0 }, el === plates.get(STOPS[cur]?.id) ? zoom : 1);
    clampPan(); requestRender();
  });
  document.addEventListener('visibilitychange', () => {
    const el = cur != null ? plates.get(STOPS[cur].id) : null;
    if (document.hidden) el?._video?.pause(); else playVideo(el);
  });

  // ——— štart: priamy odkaz #id alebo obnovená poloha ———
  const h = decodeURIComponent(location.hash.slice(1));
  let start = idx[h];
  if (start != null) {
    scrollTo({ top: posOf(start), behavior: 'instant' });
    // po priamom odkaze má Tab pokračovať do ovládania prehliadky, nie za scénou (kde bol zoznam)
    stage.tabIndex = -1; stage.focus({ preventScroll: true });
  } else start = indexAt(scrollY);
  if (start !== 0) hero.hidden = true;
  root.classList.toggle('in-tour', tourActive());
  await setStop(start, false);
}

main().catch(err => {
  // bez údajov ostáva stránka bez JS: zoznam zastávok a sekcie pod ním
  console.warn('Prechádzka sa nespustila, zobrazuje sa zoznam zastávok.', err);
  root.classList.remove('js');
  hud.hidden = true;
});

// mapa sa načíta až na požiadanie (žiadne cudzie požiadavky bez kliknutia)
$('#mapLoad').addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.title = 'Mapa: GYM KLUB, Výstavná 6, Nitra';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade';
  f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('GYM KLUB, Výstavná 6, 949 01 Nitra') + '&z=16&output=embed';
  $('#map').replaceChildren(f);
});
