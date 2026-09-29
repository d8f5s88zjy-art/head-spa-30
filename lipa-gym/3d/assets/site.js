// GYM KLUB – web fitka: úvod so svetlami, lišta a menu, živý stav otvorenia, kinetické nadpisy,
// scéna šiestich priestorov, príchodový film s titulkami, galérie, fotky na celú obrazovku,
// kalkulačka členstva, mapa po kliknutí a formulár návštevy.
// Skrolovanie ostáva natívne; skript len nastavuje triedy a premenné (--p) najviac raz za snímku.
// Pri obmedzenom pohybe sa nič samo nehýbe a všetok obsah je viditeľný hneď.

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const hasIO = 'IntersectionObserver' in window;

// úvod: ak beží svetelná scéna (WebGL), titulok odkryje ona, keď sa rozsvieti; inak po dekódovaní fotky
const heroImg = $('.hero-scene img');
const reveal = () => requestAnimationFrame(() => root.classList.add('ready'));
const glOk = !reduce && hasIO && !!window.WebGLRenderingContext;
if (!heroImg) reveal();
else if (glOk) setTimeout(reveal, 900);   // text nečaká na 3D scénu
else Promise.race([
  (heroImg.complete ? Promise.resolve() : new Promise(r => heroImg.addEventListener('load', r, { once: true }))).then(() => heroImg.decode()).catch(() => {}),
  new Promise(r => setTimeout(r, 2500))
]).then(reveal);

// ---------- živý stav otvorenia (čas v Nitre) ----------
// Po – Št 06:30 – 21:00, Pi 06:30 – 23:00 (gymklub.sk). Víkendové hodiny sa v zdrojoch líšia,
// preto sa cez víkend nepíše „otvorené“ ani „zatvorené“, len výzva overiť ich telefonicky.
const OPEN = { 1: [390, 1260], 2: [390, 1260], 3: [390, 1260], 4: [390, 1260], 5: [390, 1380] };
const hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function nitraNow() {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { d: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1, m: +p.hour * 60 + +p.minute };
  } catch (e) { const n = new Date(); return { d: n.getDay() || 7, m: n.getHours() * 60 + n.getMinutes() }; }
}
function status() {
  const { d, m } = nitraNow(), h = OPEN[d];
  if (!h) return { open: false, short: 'overte telefonicky', long: 'Cez víkend kratšie, hodiny overte telefonicky', pill: 'Víkend: overte telefonicky', d };
  if (m >= h[0] && m < h[1]) return { open: true, short: `do ${hm(h[1])}`, long: `Otvorené, dnes do ${hm(h[1])}`, pill: `Otvorené do ${hm(h[1])}`, d };
  if (m < h[0]) return { open: false, short: `od ${hm(h[0])}`, long: `Zatvorené, dnes otvárame o ${hm(h[0])}`, pill: `Otvárame o ${hm(h[0])}`, d };
  const nx = OPEN[d % 7 + 1];
  return nx ? { open: false, short: `zajtra od ${hm(nx[0])}`, long: `Zatvorené, zajtra od ${hm(nx[0])}`, pill: `Zajtra od ${hm(nx[0])}`, d }
            : { open: false, short: 'zatvorené', long: 'Zatvorené. Cez víkend kratšie, overte telefonicky', pill: 'Zatvorené', d };
}
function paintStatus() {
  const s = status();
  $$('[data-status]').forEach(el => { el.classList.toggle('open', s.open); el.querySelector('.st-l').textContent = s.pill; el.querySelector('.st-s').textContent = s.open ? s.short : s.pill.replace('Víkend: overte telefonicky', 'Víkend'); });
  $$('[data-status-short]').forEach(el => { el.textContent = s.short; });
  $$('[data-status-long]').forEach(el => { el.textContent = s.long; el.classList.toggle('open', s.open); });
  $$('[data-status-text]').forEach(el => { el.textContent = s.long; });
  $$('[data-hours] li').forEach(li => { const [a, b] = li.dataset.days.split('-').map(Number); li.classList.toggle('today', s.d >= a && s.d <= (b || a)); });
  $$('.tt-day[data-day]').forEach(el => el.classList.toggle('today', +el.dataset.day === s.d));
}
paintStatus();
setInterval(paintStatus, 60000);

// ---------- menu na telefóne ----------
const menu = $('#menu'), menuBtn = $('#menuBtn');
const ICON_MENU = menuBtn.innerHTML;
const ICON_X = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"/></svg>';
function setMenu(open) {
  menu.hidden = !open;
  root.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Zavrieť menu' : 'Otvoriť menu');
  menuBtn.innerHTML = open ? ICON_X : ICON_MENU;
  if (open) menu.querySelector('a').focus(); else menuBtn.focus({ preventScroll: true });
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
matchMedia('(min-width: 1181px)').addEventListener?.('change', m => { if (m.matches && !menu.hidden) setMenu(false); });

// ---------- kinetické nadpisy: slová v maskách ----------
function split(el) {
  let i = 0;
  const walk = node => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/( +)/);
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (!p) continue;
          if (/^ +$/.test(p)) { frag.append(' '); continue; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = p; inner.style.setProperty('--i', i++);
          w.append(inner); frag.append(w);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
    }
  };
  walk(el);
}
$$('[data-kt], .zn-h').forEach(split);
if (hasIO) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-kt], .rv').forEach(el => io.observe(el));
} else $$('[data-kt], .rv').forEach(el => el.classList.add('in'));

// slová vyhlásenia sa rozsvecujú podľa skrolovania
$$('[data-scrub]').forEach(el => {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'sw'; s.textContent = w; s.style.setProperty('--i', i); el.append(s, ' '); });
  el.style.setProperty('--n', words.length);
});

// ---------- lišta: pozadie po úvode, pri skrolovaní nadol sa skryje, nahor ukáže ----------
const bar = $('#bar'), hero = $('.hero');
let lastY = scrollY;

// ---------- scéna šiestich priestorov (počítač): pripnutá obrazovka, strih pri skrolovaní ----------
const zones = $('.zones');
const zoneEls = zones ? $$('.zn', zones) : [];
const ticks = zones ? $$('.zones-ticks button', zones) : [];
const pinMQ = matchMedia('(min-width: 1024px)');
let zonePin = false, zoneCur = -1;
function setPin() {
  zonePin = !!zones && !reduce && pinMQ.matches;
  zones?.classList.toggle('pin', zonePin);
  zones?.style.setProperty('--n', zoneEls.length);
  zoneCur = -1;
  if (!zonePin) zoneEls.forEach(z => z.classList.remove('on', 'was'));
}
setPin();
pinMQ.addEventListener?.('change', () => { setPin(); tick(); });
function zoneFrame(vh) {
  const pin = zones.querySelector('.zones-pin'), r = pin.getBoundingClientRect();
  const n = zoneEls.length, p = clamp(-r.top / Math.max(1, r.height - vh));
  const i = Math.min(n - 1, Math.floor(p * n * 0.9999));
  if (i !== zoneCur) {
    zoneEls.forEach((z, k) => { z.classList.toggle('was', k === zoneCur); z.classList.toggle('on', k === i); });
    ticks.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    zoneCur = i;
  }
  zoneEls[i].style.setProperty('--lp', (p * n - i).toFixed(3));
  zones.style.setProperty('--zp', p.toFixed(4));
}
ticks.forEach((t, k) => t.addEventListener('click', () => {
  const pin = zones.querySelector('.zones-pin');
  if (!zonePin) { zoneEls[k].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'start', block: 'nearest' }); return; }
  const top = pin.getBoundingClientRect().top + scrollY, h = pin.offsetHeight - innerHeight;
  scrollTo({ top: top + h * (k + 0.08) / zoneEls.length, behavior: 'smooth' });
}));

// ---------- jeden skrolovací cyklus pre všetko, čo závisí od polohy ----------
const scEls = $$('[data-sc], [data-par], [data-scrub]');
$$('[data-par]').forEach(el => el.style.setProperty('--par', el.dataset.par));
let pending = false;
function tick() {
  pending = false;
  const vh = innerHeight, y = scrollY;
  // lišta
  if (hero) bar.classList.toggle('solid', hero.getBoundingClientRect().bottom < 80);
  const down = y > lastY + 4, up = y < lastY - 4;
  if (!root.classList.contains('menu-open')) {
    if (down && y > 500) bar.classList.add('hide');
    else if (up || y < 200) bar.classList.remove('hide');
  }
  if (down || up) lastY = y;
  if (hero) document.body.classList.toggle('dock-on', y > vh * 0.5);
  if (reduce) return;
  for (const el of scEls) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    let p;
    if (el.hasAttribute('data-scrub')) p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3));
    else if (el.classList.contains('phero')) p = clamp(-r.top / r.height);
    else p = clamp((vh - r.top) / (vh + r.height));
    const v = p.toFixed(3);
    if (el._p !== v) { el._p = v; el.style.setProperty('--p', v); }
  }
  if (zonePin) zoneFrame(vh);
}
const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(tick); } };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
tick();

// ---------- príchodový film: prehráva sa len v obraze, titulky podľa času ----------
const film = $('#filmV');
if (film) {
  const steps = $$('#filmSteps li'), T = steps.map(li => +li.dataset.t);
  const cap = $('#filmCap'), tc = $('#filmTc'), playBtn = $('#filmPlay');
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>';
  const ICON_PAUSE = playBtn.innerHTML;
  let userPaused = reduce, inView = false, raf = 0;
  const setBtn = () => { const on = !film.paused; playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY; playBtn.setAttribute('aria-label', on ? 'Pozastaviť video' : 'Prehrať video'); };
  const draw = () => {
    raf = 0;
    const t = film.currentTime, dur = film.duration || 6.9;
    let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i]) k = i;
    steps.forEach((li, i) => {
      li.classList.toggle('on', i === k);
      const end = T[i + 1] ?? dur;
      li.style.setProperty('--sp', i < k ? 1 : i > k ? 0 : clamp((t - T[i]) / (end - T[i])).toFixed(3));
    });
    cap.textContent = steps[k].querySelector('b').textContent;
    tc.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}`;
    if (!film.paused) raf = requestAnimationFrame(draw);
  };
  const play = () => { if (!userPaused && inView) film.play().then(() => { setBtn(); if (!raf) raf = requestAnimationFrame(draw); }).catch(() => setBtn()); };
  film.addEventListener('pause', setBtn);
  // keď načítanie prerušilo prvé spustenie, video sa rozbehne, len čo je pripravené
  film.addEventListener('canplay', () => { if (inView && !userPaused && film.paused) play(); });
  film.addEventListener('play', () => { setBtn(); if (!raf) raf = requestAnimationFrame(draw); });
  film.addEventListener('seeked', draw);
  playBtn.addEventListener('click', () => { if (film.paused) { userPaused = false; inView = true; film.preload = 'auto'; film.play().catch(() => {}); } else { userPaused = true; film.pause(); } });
  setBtn();
  if (hasIO) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting && film.preload === 'none') { film.preload = 'auto'; film.load(); } }, { rootMargin: '600px 0px' }).observe(film);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) play(); else film.pause(); }, { threshold: 0.35 }).observe(film);
  }
  draw();
}

// ---------- dôvody: pri prejdení myšou sa pri kurzore ukáže fotka ----------
const whyF = $('.why-float');
if (whyF && fine && !reduce) {
  const pics = $$('.why-f', whyF);
  let tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
  const loop = () => { x += (tx - x) * 0.14; y += (ty - y) * 0.14; whyF.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; raf = on || Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0; };
  $$('.why-i').forEach(li => {
    li.addEventListener('pointerenter', e => {
      if (innerWidth < 1024) return;
      pics.forEach(p => p.classList.toggle('on', p.dataset.f === li.dataset.img));
      if (!on) { tx = x = e.clientX + 30; ty = y = e.clientY - whyF.offsetHeight / 2; }
      on = true; whyF.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop);
    });
    li.addEventListener('pointermove', e => { tx = e.clientX + 30; ty = e.clientY - whyF.offsetHeight / 2; });
  });
  $('.why-l').addEventListener('pointerleave', () => { on = false; whyF.classList.remove('on'); pics.forEach(p => p.classList.remove('on')); });
}

// ---------- tlačidlá a karty reagujú na kurzor ----------
if (fine && !reduce) {
  $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
      b.style.transform = `translate3d(${(dx * 10).toFixed(1)}px,${(dy * 8).toFixed(1)}px,0)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  $$('[data-spot]').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
}

// pásy s textom bežia len v obraze
if (hasIO && !reduce) {
  const mio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('run', e.isIntersecting)));
  $$('.marquee').forEach(m => mio.observe(m));
}

// ---------- kalkulačka: pri zadanom počte tréningov za mesiac vyberie najlacnejšiu možnosť ----------
const calc = $('#calc');
if (calc) {
  const n = $('#calcN'), out = $('#calcOut'), res = $('#calcR');
  const c = k => +calc.dataset[k];
  const eur = x => (Math.round(x * 100) / 100).toLocaleString('sk-SK', { minimumFractionDigits: Number.isInteger(x) ? 0 : 2 }) + ' €';
  const run = () => {
    const k = +n.value;
    out.textContent = k;
    const single = k * c('single'), month = c('month');
    res.innerHTML = single <= month
      ? `Jednotlivé vstupy: <b>${eur(single)}</b> mesačne. Permanentka by stála ${eur(month)}.`
      : `Permanentka: <b>${eur(month)}</b> mesačne, teda ${eur(month / k)} za tréning. Jednotlivo by ste zaplatili ${eur(single)}.`;
  };
  n.addEventListener('input', run);
  run();
}

// ---------- mapa sa načíta z Map Google až po kliknutí (rýchlosť a súkromie) ----------
const mapBtn = $('#mapLoad');
mapBtn?.addEventListener('click', () => {
  const f = document.createElement('iframe');
  f.src = mapBtn.dataset.src; f.title = 'Mapa: GYM KLUB, Výstavná 6, Nitra'; f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
  $('#map').append(f);
  mapBtn.disabled = true;
});

// ---------- formulár návštevy: kontrola povinných polí a príprava e-mailu ----------
const form = $('#form');
if (form) {
  const need = [['#fName', '#fNameErr'], ['#fContact', '#fContactErr']];
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    let first = null;
    for (const [i, er] of need) {
      const inp = $(i, form), bad = !inp.value.trim();
      inp.setAttribute('aria-invalid', bad); $(er, form).hidden = !bad;
      if (bad && !first) first = inp;
    }
    if (first) { first.focus(); return; }
    const v = id => $(id, form).value.trim();
    const date = v('#fDate') ? new Date(v('#fDate') + 'T12:00').toLocaleDateString('sk-SK') : '';
    const lines = [
      `Meno: ${v('#fName')}`, `Kontakt: ${v('#fContact')}`, `Téma: ${v('#fTopic')}`,
      date || v('#fTime') ? `Kedy by som prišiel/prišla: ${[date, v('#fTime')].filter(Boolean).join(' o ')}` : '',
      '', v('#fMsg')
    ].filter((l, i, a) => l !== '' || (i > 0 && a[i - 1] !== ''));
    const to = form.getAttribute('action').replace('mailto:', '');
    location.href = `mailto:${to}?subject=${encodeURIComponent('GYM KLUB: ' + v('#fTopic'))}&body=${encodeURIComponent(lines.join('\n'))}`;
    $('#fOk', form).hidden = false;
  });
  for (const [i, er] of need) $(i, form).addEventListener('input', e => { if (e.target.value.trim()) { e.target.setAttribute('aria-invalid', 'false'); $(er, form).hidden = true; } });
}

// ---------- galérie priestorov: počítadlo a šípky (na dotyku sa posúva prstom) ----------
for (const zone of $$('.zone')) {
  const rail = zone.querySelector('.rail');
  const items = rail.children;
  const ctl = zone.querySelector('.rail-ctl');
  const num = ctl.querySelector('b');
  const [prev, next] = ctl.querySelectorAll('.rail-btn');
  ctl.hidden = false;
  const step = () => items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth;
  let p = false;
  const update = () => {
    p = false;
    const max = rail.scrollWidth - rail.clientWidth;
    num.textContent = Math.min(items.length, Math.round(rail.scrollLeft / step()) + 1);
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max - 2;
  };
  rail.addEventListener('scroll', () => { if (!p) { p = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  for (const b of [prev, next]) b.addEventListener('click', () => {
    const perPage = Math.max(1, Math.floor(rail.clientWidth / step()) - 1);
    rail.scrollBy({ left: +b.dataset.dir * perPage * step(), behavior: reduce ? 'auto' : 'smooth' });
  });
  update();
}

// ---------- fotky na celú obrazovku: jeden vodorovný pás všetkých fotiek ----------
const lb = document.getElementById('lb');
if (lb) {
  const track = document.getElementById('lbTrack');
  const cap = document.getElementById('lbCap');
  const lbPrev = lb.querySelector('.lb-prev'), lbNext = lb.querySelector('.lb-next');
  const photos = $$('.ph');
  const zoneTotal = {}, zonePos = [];
  for (const p of photos) { const z = p.dataset.zone; zoneTotal[z] = (zoneTotal[z] || 0) + 1; zonePos.push(zoneTotal[z]); }
  let slides = null, cur = 0, opener = null, raf = 0;
  const build = () => {
    slides = photos.map(p => {
      const s = document.createElement('div'); s.className = 'lb-s';
      const pic = document.createElement('picture'), img = document.createElement('img');
      img.alt = p.querySelector('img').alt; img.width = +p.dataset.w; img.height = +p.dataset.h; img.decoding = 'async';
      pic.append(img); s.append(pic); track.append(s);
      return { s, pic, img, p, loaded: false };
    });
  };
  const load = i => {
    const sl = slides[i];
    if (!sl || sl.loaded) return;
    sl.loaded = true;
    const src = sl.p.dataset.src, big = sl.p.dataset.big, panda = src.startsWith('panda');
    // plné rozlíšenie v AVIF, záloha WebP 1280 px
    const srcs = panda ? [['image/avif', `media/${src}-${big}.avif`], ['image/webp', `media/${src}-${big}.webp`]]
                       : [['image/avif', `media/${src}-${big}.avif`], ['image/webp', `media/${src}-1280.webp`]];
    for (const [type, url] of srcs) { const so = document.createElement('source'); so.type = type; so.srcset = url; sl.pic.insertBefore(so, sl.img); }
    sl.img.src = panda ? `media/${src}-${big}.jpg` : `media/${src}-480.jpg`;
  };
  const show = i => {
    cur = i;
    for (let k = i - 1; k <= i + 2; k++) load(k);
    const p = photos[i];
    cap.textContent = p.dataset.zone;
    const n = document.createElement('span'); n.textContent = `${zonePos[i]} / ${zoneTotal[p.dataset.zone]}`; cap.append(n);
    lbPrev.disabled = i === 0; lbNext.disabled = i === photos.length - 1;
  };
  const go = (i, smooth = true) => {
    i = clamp(i, 0, photos.length - 1);
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    show(i);
  };
  if (typeof lb.showModal === 'function') {
    photos.forEach((p, i) => p.addEventListener('click', ev => {
      ev.preventDefault();
      if (!slides) build();
      opener = p; root.classList.add('lb-open'); lb.showModal(); go(i, false); lb.querySelector('.lb-x').focus();
    }));
    track.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== cur) show(i); });
    }, { passive: true });
    lbPrev.addEventListener('click', () => go(cur - 1));
    lbNext.addEventListener('click', () => go(cur + 1));
    document.getElementById('lbClose').addEventListener('click', () => lb.close());
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    lb.addEventListener('close', () => {
      root.classList.remove('lb-open');
      const p = photos[cur], rail = p.closest('.rail');
      rail.scrollLeft = p.parentElement.offsetLeft - rail.firstElementChild.offsetLeft;
      (opener && photos[cur] !== opener ? p : opener)?.focus({ preventScroll: true });
    });
    addEventListener('resize', () => { if (lb.open) track.scrollLeft = cur * track.clientWidth; });
  }
}

// ---------------------------------------------------------------------------------------------
// Priestorové fotky (3D): každá fotka má hĺbkovú mapu (media/depth-*.png, bližšie = svetlejšie).
// WebGL posúva body obrazu podľa hĺbky, takže pri pohybe kamery sa popredie hýbe viac než pozadie.
// Kamera sa sama pomaly pohybuje; myš alebo ťah prstom ju vedie. Kreslí sa len to, čo je v obraze,
// WebGL kontext sa pri odchode ďaleko z obrazu uvoľní. Bez WebGL alebo pri obmedzenom pohybe ostáva
// obyčajná fotka pod plátnom.

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
// spoločná časť: kamera s hĺbkou (5 krokov hľadania povrchu po hĺbkovej mape)
const CAM = `precision mediump float;
varying vec2 v;
uniform sampler2D img,dep;
uniform vec2 cover,ctr,off;
uniform float zoom,push;
vec2 look(){
  vec2 base=ctr+(vec2(v.x,1.-v.y)-.5)*cover/zoom;
  vec2 uv=base;
  for(int i=0;i<5;i++){
    float d=texture2D(dep,uv).r;
    uv=base+off*(d-.4)-(base-ctr)*push*d;
  }
  return clamp(uv,.001,.999);
}`;
const FS = CAM + `
uniform float fade;
void main(){gl_FragColor=vec4(texture2D(img,look()).rgb*fade,1.);}`;
// úvod: miestnosť v tme, LED trubice sa po jednej s blikaním rozsvietia, potom sa rozsvieti celá sála.
// lit.r = maska svetla, lit.g = kedy sa trubica zapne, lit.b = náhodný rytmus blikania, lit.a = žiara
const FS_HERO = CAM + `
uniform sampler2D lit;
uniform float T,room;
float tube(float st,float sd){
  float k=(T-(.35+st*2.3))/(.3+sd*.5);
  if(k<0.)return 0.;
  if(k>.85)return 1.;
  return sin(k*47.+sd*60.)+sin(k*23.3+sd*17.)>.4?1.:.07;
}
void main(){
  vec2 uv=look();
  vec3 c=texture2D(img,uv).rgb;
  vec4 L=texture2D(lit,uv);
  float s=tube(L.g,L.b);
  vec3 col=mix(c*.035+vec3(.003,.005,.008),c,room);
  col=max(col,c*L.r*s*1.08);
  col+=vec3(.85,.95,1.)*L.a*s*.3*(1.-room*.8);
  gl_FragColor=vec4(col,1.);
}`;
// začiatky a rytmy 91 trubíc (rovnaké hodnoty ako v lit.g a lit.b), z nich sa počíta svetlo v miestnosti
const CELLS = [[0.676,0.468],[0.244,0.548],[0.789,0.322],[0.377,0.751],[0.474,0.025],[0.52,0.372],[0.78,0.03],[0.654,0.123],[0.529,0.967],[0.251,0.658],[0.387,0.428],[0.753,0.524],[0.444,0.873],[0.611,0.344],[0.585,0.59],[0.69,0.684],[0.367,0.355],[0.525,0.519],[0.786,0.765],[0.557,0.909],[0.196,0.151],[0.422,0.933],[0.111,0.005],[0.419,0.753],[0.796,0.811],[0.346,0.137],[0.608,0.419],[0.406,0.815],[0.525,0.014],[0.455,0.628],[0.416,0.793],[0.531,0.513],[0.433,0.726],[0.469,0.226],[0.424,0.199],[0.553,0.363],[0.523,0.179],[0.508,0.346],[0.516,0.948],[0.628,0.573],[0.436,0.34],[0.437,0.272],[0.359,0.952],[0.42,0.444],[0.935,0.98],[0.202,0.516],[0.196,0.521],[0.497,0.897],[0.659,0.743],[0.501,0.581],[0.568,0.427],[0.232,0.878],[0.376,0.412],[0.524,0.923],[0.451,0.069],[0.733,0.43],[0.439,0.52],[0.646,0.951],[0.834,0.251],[0.501,0.806],[0.591,0.676],[0.515,0.717],[0.48,0.63],[0.393,0.972],[0.388,0.333],[0.561,0.398],[0.616,0.203],[0.773,0.051],[0.407,0.213],[0.311,0.915],[0.456,0.84],[0.549,0.112],[0.626,0.604],[0.587,0.479],[0.72,0.595],[0.621,0.659],[0.724,0.307],[0.542,0.961],[0.306,0.466],[0.274,0.628],[0.356,0.635],[0.561,0.184],[0.476,0.062],[0.501,0.412],[0.356,0.764],[0.333,0.815],[0.582,0.73],[0.275,0.113],[0.534,0.913],[0.299,0.802],[0.726,0.878]];
const tubeState = (T, st, sd) => {
  const k = (T - (0.35 + st * 2.3)) / (0.3 + sd * 0.5);
  if (k < 0) return 0;
  if (k > 0.85) return 1;
  return Math.sin(k * 47 + sd * 60) + Math.sin(k * 23.3 + sd * 17) > 0.4 ? 1 : 0.07;
};
const LIGHTS_DONE = 3.6;   // po tomto čase (s) svietia všetky trubice

const AMP = 0.02;          // najväčší posun pri pohybe kamery (podiel šírky obrazu)
const ZOOM = 1.08;         // rezerva na okrajoch, aby posun neukázal hranu fotky
const coarse = matchMedia('(pointer: coarse)').matches;
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const loadImg = url => { const i = new Image(); i.src = url; return i.decode().then(() => i); };

class Space3D {
  constructor(el, inputEl = el) {
    this.el = el; this.img = el.querySelector('img'); this.inputEl = inputEl;
    this.fx = (+el.dataset.fx || 50) / 100; this.fy = (+el.dataset.fy || 50) / 100;
    this.cur = { x: 0, y: 0 }; this.user = null; this.shown = 0; this.raf = 0; this.gl = null;
    this.visible = false;
    this.fs = FS; this.extra = []; this.names = ['cover', 'ctr', 'off', 'zoom', 'push', 'fade'];
    this.onPointer();
  }
  async start() {
    if (this.gl || this.starting) return;
    this.starting = true;
    try {
      if (!this.img.complete || !this.img.naturalWidth) await new Promise((res, rej) => { this.img.addEventListener('load', res, { once: true }); this.img.addEventListener('error', rej, { once: true }); });
      const maps = await Promise.all([this.el.dataset.depth, ...this.extra].map(loadImg));
      // fotka sa dekóduje mimo hlavného vlákna; na telefónoch stačí textúra do 1400 px
      let src = this.img, bmp = null;
      if (window.createImageBitmap) {
        const mw = coarse ? 1400 : 2200, iw = this.img.naturalWidth, ih = this.img.naturalHeight;
        try { bmp = await createImageBitmap(this.img, iw > mw ? { resizeWidth: mw, resizeHeight: Math.round(ih * mw / iw), resizeQuality: 'high' } : undefined); src = bmp; } catch (e) { bmp = null; }
      }
      if (!this.wanted) { bmp?.close(); return; }
      const c = document.createElement('canvas');
      c.setAttribute('aria-hidden', 'true');
      const gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) { bmp?.close(); throw 0; }
      const sh = (type, code) => { const x = gl.createShader(type); gl.shaderSource(x, code); gl.compileShader(x); return x; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, this.fs)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { bmp?.close(); throw 0; }
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const tex = (unit, source, fmt) => {
        const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, source);
      };
      tex(0, src, gl.RGB); bmp?.close();
      maps.forEach((m, i) => tex(i + 1, m, i === 0 ? gl.RGB : gl.RGBA));
      const u = n => gl.getUniformLocation(pr, n);
      ['img', 'dep', 'lit'].forEach((n, i) => { const l = u(n); if (l) gl.uniform1i(l, i); });
      this.u = Object.fromEntries(this.names.map(n => [n, u(n)]));
      this.gl = gl; this.canvas = c; this.iw = this.img.naturalWidth; this.ih = this.img.naturalHeight;
      this.el.append(c);
      if (!this.shown) this.shown = performance.now();
      this.size();
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.drop(); });
      this.el.classList.add('gl');
      this.loop();
    } catch (e) { this.failed?.(); /* ostáva obyčajná fotka */ } finally { this.starting = false; }
  }
  size() {
    if (!this.gl) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    const k = Math.min(devicePixelRatio || 1, 2, 2200 / Math.max(w, 1));
    this.canvas.width = Math.round(w * k); this.canvas.height = Math.round(h * k);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // ako object-fit: cover s object-position podľa bodu záujmu
    const A = w / h, I = this.iw / this.ih;
    this.cw = A < I ? A / I : 1; this.ch = A < I ? 1 : I / A;
    this.gl.uniform2f(this.u.cover, this.cw, this.ch);
    this.aim(this.fx, this.fy, ZOOM);
    this.draw(performance.now());
  }
  // stred pohľadu v súradniciach fotky pre bod záujmu (fx, fy) a priblíženie
  aim(fx, fy, zoom) {
    const w = this.cw / zoom, h = this.ch / zoom;
    this.gl.uniform2f(this.u.ctr, w / 2 + (1 - w) * fx, h / 2 + (1 - h) * fy);
  }
  steer(dt, t, amp) {
    // samostatný pomalý pohyb kamery; vstup používateľa má prednosť a plynule sa doň prelieva
    const auto = { x: Math.sin(t * 0.33) * amp, y: Math.sin(t * 0.21 + 1.3) * amp * 0.66 };
    const tg = this.user || auto;
    const k = 1 - Math.exp(-dt * (this.user ? 5 : 2));
    this.cur.x += (tg.x - this.cur.x) * k; this.cur.y += (tg.y - this.cur.y) * k;
    this.gl.uniform2f(this.u.off, this.cur.x * AMP, -this.cur.y * AMP * 0.6);
  }
  draw(now) {
    const t = now / 1000;
    const dt = this.last ? Math.min(t - this.last, 0.05) : 0.016; this.last = t;
    this.steer(dt, t, 0.75);
    const gl = this.gl, U = this.u;
    // pri prvom zobrazení sa priestor rozsvieti ako žiarivky (krátke bliknutia) a kamera vojde dnu
    const r = (now - this.shown) / 1000, e = 1 - Math.pow(1 - Math.min(1, r / 2.4), 3);
    const fade = r < 0.7 ? (Math.sin(r * 47) + Math.sin(r * 23.3) > 0.4 ? 0.9 : 0.12) : Math.min(1, 0.9 + (r - 0.7) * 0.4);
    gl.uniform1f(U.zoom, ZOOM + 0.02 * Math.sin(t * 0.15));
    gl.uniform1f(U.push, 0.1 * (1 - e) + 0.025);
    gl.uniform1f(U.fade, fade);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  loop() {
    if (this.raf || !this.gl || !this.visible || document.hidden) return;
    const f = now => { this.raf = 0; if (!this.gl || !this.visible || document.hidden) return; this.draw(now); this.raf = requestAnimationFrame(f); };
    this.raf = requestAnimationFrame(f);
  }
  drop() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.gl) { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); this.canvas.remove(); }
    this.gl = null; this.canvas = null; this.last = 0;
    this.el.classList.remove('gl');
  }
  onPointer() {
    // myš: poloha nad fotkou; dotyk: vodorovný ťah (zvislý ostáva skrolovaniu stránky)
    const el = this.inputEl;
    let sx = 0, sy = 0, bx = 0, by = 0;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      if (e.pointerType === 'mouse') this.user = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      else if (this.user) this.user = { x: Math.max(-1, Math.min(1, bx + (e.clientX - sx) / (r.width * 0.5))), y: Math.max(-1, Math.min(1, by + (e.clientY - sy) / (r.height * 0.5))) };
    }, { passive: true });
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      sx = e.clientX; sy = e.clientY; bx = this.cur.x; by = this.cur.y; this.user = { x: bx, y: by };
    }, { passive: true });
    const end = e => { if (e.pointerType !== 'mouse' || e.type === 'pointerleave') this.user = null; };
    for (const n of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(n, end, { passive: true });
  }
}

// úvodná scéna: rozsvietenie a pri skrolovaní prelet do priestoru (kamera sa skloní od stropu k podlahe a vojde dnu)
class HeroScene extends Space3D {
  constructor(el, section, copy) {
    super(el, section);
    this.section = section; this.copy = copy; this.sp = 0; this.op = -1;
    this.fs = FS_HERO; this.extra = [el.dataset.lights];
    this.names = ['cover', 'ctr', 'off', 'zoom', 'push', 'T', 'room'];
  }
  failed() { reveal(); }
  draw(now) {
    const t = now / 1000;
    const dt = this.last ? Math.min(t - this.last, 0.05) : 0.016; this.last = t;
    // ak scéna naskočí neskôr než 3 s po otvorení stránky (pomalé pripojenie), svetlá sa už nezapínajú
    if (!this.t0) this.t0 = now > 3000 ? now - LIGHTS_DONE * 1000 : now;
    const T = (now - this.t0) / 1000;
    let room = 1;
    if (T < LIGHTS_DONE) { room = 0; for (const [st, sd] of CELLS) room += tubeState(T, st, sd); room = Math.pow(room / CELLS.length, 1.3); }
    if (!this.revealed) { this.revealed = true; setTimeout(reveal, 250); }  // text úvodu hneď, svetlá sa rozsvecujú za ním
    const r = this.section.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
    this.sp += (p - this.sp) * (1 - Math.exp(-dt * 7));
    const sp = this.sp, gl = this.gl, U = this.u;
    this.steer(dt, t, 0.5);
    const zoom = 1.14 + sp * 0.3;
    this.aim(0.5, 0.2 + sp * 0.55, zoom);
    gl.uniform1f(U.zoom, zoom);
    gl.uniform1f(U.push, 0.03 + sp * 0.22);
    gl.uniform1f(U.T, T);
    gl.uniform1f(U.room, room);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // titulok pri skrolovaní odíde
    const op = +(1 - clamp01(sp / 0.35)).toFixed(3);
    if (op !== this.op) { this.op = op; this.copy.style.opacity = op; this.copy.style.visibility = op ? '' : 'hidden'; }
  }
}

if (glOk) {
  const heroEl = document.getElementById('heroScene');
  const spaces = new Map([...document.querySelectorAll('.s3d')].map(el => [el, new Space3D(el)]));
  if (heroEl) spaces.set(heroEl, new HeroScene(heroEl, document.getElementById('uvod'), document.getElementById('heroIn')));
  // blízko obrazu: pripraviť kontext; v obraze: kresliť; ďaleko: uvoľniť
  const near = new IntersectionObserver(es => es.forEach(e => {
    const s = spaces.get(e.target);
    s.wanted = e.isIntersecting;
    if (e.isIntersecting) s.start(); else s.drop();
  }), { rootMargin: '600px 0px' });
  const vis = new IntersectionObserver(es => es.forEach(e => {
    const s = spaces.get(e.target);
    s.visible = e.isIntersecting;
    if (s.visible) s.loop();
  }), { rootMargin: '40px 0px' });
  spaces.forEach((s, el) => { near.observe(el); vis.observe(el); });
  const ro = new ResizeObserver(es => es.forEach(e => spaces.get(e.target)?.size()));
  spaces.forEach((s, el) => ro.observe(el));
  document.addEventListener('visibilitychange', () => spaces.forEach(s => s.loop()));
}
