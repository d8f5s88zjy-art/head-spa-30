// GYM KLUB – prehliadka fitka: úvod, odkrývanie sekcií, galérie priestorov a fotky na celú obrazovku.
// Skrolovanie ostáva natívne; skript len pridáva triedy a reaguje na posun galérií (najviac raz za snímku).

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// úvod: fotka a titulok sa odkryjú, keď je úvodná fotka dekódovaná (poistka po 2,5 s)
const heroImg = document.querySelector('.hero-img img');
Promise.race([
  (heroImg.complete ? Promise.resolve() : new Promise(r => heroImg.addEventListener('load', r, { once: true }))).then(() => heroImg.decode()).catch(() => {}),
  new Promise(r => setTimeout(r, 2500))
]).then(() => requestAnimationFrame(() => root.classList.add('ready')));

// lišta dostane pozadie, keď úvod odíde z obrazu
const bar = document.querySelector('.bar');
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => bar.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' })
    .observe(document.querySelector('.hero'));

  // sekcie sa odkryjú raz, keď vojdú do obrazu
  root.classList.add('io');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
} else {
  bar.classList.add('solid');
  document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
}

// galérie priestorov: počítadlo a šípky (na dotyku sa posúva prstom)
for (const zone of document.querySelectorAll('.zone')) {
  const rail = zone.querySelector('.rail');
  const items = rail.children;
  const ctl = zone.querySelector('.rail-ctl');
  const num = ctl.querySelector('b');
  const [prev, next] = ctl.querySelectorAll('.rail-btn');
  ctl.hidden = false;
  const step = () => items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth;
  let pending = false;
  const update = () => {
    pending = false;
    const max = rail.scrollWidth - rail.clientWidth;
    const i = Math.min(items.length - 1, Math.round(rail.scrollLeft / step()));
    num.textContent = i + 1;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max - 2;
  };
  rail.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  for (const b of [prev, next]) b.addEventListener('click', () => {
    const perPage = Math.max(1, Math.floor(rail.clientWidth / step()) - 1);
    rail.scrollBy({ left: +b.dataset.dir * perPage * step(), behavior: reduce ? 'auto' : 'smooth' });
  });
  update();
}

// fotky na celú obrazovku: jeden vodorovný pás všetkých 30 fotiek, posúva sa prstom, šípkami alebo klávesmi
const lb = document.getElementById('lb');
const track = document.getElementById('lbTrack');
const cap = document.getElementById('lbCap');
const lbPrev = lb.querySelector('.lb-prev');
const lbNext = lb.querySelector('.lb-next');
const photos = [...document.querySelectorAll('.ph')];
const zoneTotal = {}, zonePos = [];
for (const p of photos) { const z = p.dataset.zone; zoneTotal[z] = (zoneTotal[z] || 0) + 1; zonePos.push(zoneTotal[z]); }

let slides = null, cur = 0, opener = null, raf = 0;

function build() {
  slides = photos.map(p => {
    const s = document.createElement('div');
    s.className = 'lb-s';
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.alt = p.querySelector('img').alt;
    img.width = +p.dataset.w; img.height = +p.dataset.h;
    img.decoding = 'async';
    pic.append(img); s.append(pic); track.append(s);
    return { s, pic, img, p, loaded: false };
  });
}

function load(i) {
  const sl = slides[i];
  if (!sl || sl.loaded) return;
  sl.loaded = true;
  const base = `media/${sl.p.dataset.src}-${sl.p.dataset.big}`;
  for (const [type, ext] of [['image/avif', 'avif'], ['image/webp', 'webp']]) {
    const so = document.createElement('source'); so.type = type; so.srcset = `${base}.${ext}`;
    sl.pic.insertBefore(so, sl.img);
  }
  sl.img.src = `${base}.jpg`;
}

function show(i) {
  cur = i;
  for (let k = i - 1; k <= i + 2; k++) load(k);
  const p = photos[i];
  cap.innerHTML = '';
  cap.append(p.dataset.zone);
  const n = document.createElement('span');
  n.textContent = `${zonePos[i]} / ${zoneTotal[p.dataset.zone]}`;
  cap.append(n);
  lbPrev.disabled = i === 0;
  lbNext.disabled = i === photos.length - 1;
}

function go(i, smooth = true) {
  i = Math.max(0, Math.min(photos.length - 1, i));
  track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  show(i);
}

if (typeof lb.showModal === 'function') {
  photos.forEach((p, i) => p.addEventListener('click', ev => {
    ev.preventDefault();
    if (!slides) build();
    opener = p;
    root.classList.add('lb-open');
    lb.showModal();
    go(i, false);
    lb.querySelector('.lb-x').focus();
  }));

  track.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== cur) show(i);
    });
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
    // galéria na stránke sa posunie na naposledy zobrazenú fotku a zameranie sa vráti na ňu
    const p = photos[cur];
    const rail = p.closest('.rail');
    rail.scrollLeft = p.parentElement.offsetLeft - rail.firstElementChild.offsetLeft;
    (opener && photos[cur] !== opener ? p : opener)?.focus({ preventScroll: true });
  });
  addEventListener('resize', () => { if (lb.open) track.scrollLeft = cur * track.clientWidth; });
}
