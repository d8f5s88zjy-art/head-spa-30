// VISIONARY LIVING – správanie stránky. Bez knižníc. Všetko, čo sa hýbe, mení len transform a opacity;
// pri prefers-reduced-motion sa obsah ukáže hneď a nič sa nehýbe.
const d = document, html = d.documentElement;
const $ = (s, r = d) => r.querySelector(s);
const $$ = (s, r = d) => [...r.querySelectorAll(s)];
const pohyb = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const mys = matchMedia('(hover: hover) and (pointer: fine)').matches;
const NBSP = ' ';
const cena = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + NBSP + '€';
const plocha = (x) => x.toFixed(2).replace('.', ',') + NBSP + 'm²';

// 1. úvodná sekvencia: jediná animácia, ktorá beží sama (nadpis, text, tlačidlá, fakty)
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('uvod-start')));

// 2. lišta: po posunutí dostane pozadie; menu na telefóne
(function hlavicka() {
  const h = $('.hlavicka'); if (!h) return;
  const posun = () => h.classList.toggle('je-posunuta', scrollY > 8);
  addEventListener('scroll', posun, { passive: true }); posun();
  const btn = $('.menu-prepinac', h), nav = $('#menu', h);
  const nastav = (on) => {
    h.dataset.menu = on ? 'otvorene' : 'zatvorene';
    btn.setAttribute('aria-expanded', String(on));
    $('.visually-hidden', btn).textContent = on ? 'Zavrieť menu' : 'Menu';
    d.body.classList.toggle('menu-otvorene', on);
  };
  btn.addEventListener('click', () => nastav(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) nastav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { nastav(false); btn.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && nastav(false));
})();

// 3. odhaľovanie pri skrole: prvok s data-odhal dostane triedu je-in, keď vojde do okna (raz)
(function odhal() {
  const els = $$('[data-odhal]');
  if (!els.length) return;
  if (!pohyb || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('je-in')); return; }
  const io = new IntersectionObserver((zs, o) => zs.forEach((z) => { if (z.isIntersecting) { z.target.classList.add('je-in'); o.unobserve(z.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => io.observe(el));
})();

// 4. počítadlá: číslo nabehne od nuly, keď je na obrazovke
(function pocitadla() {
  const els = $$('[data-pocitadlo]');
  if (!els.length || !pohyb) return;
  const io = new IntersectionObserver((zs, o) => zs.forEach((z) => {
    if (!z.isIntersecting) return; o.unobserve(z.target);
    const el = z.target, ciel = +el.dataset.pocitadlo, t0 = performance.now(), T = 900;
    const krok = (t) => { const p = Math.min(1, (t - t0) / T), k = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(ciel * k); if (p < 1) requestAnimationFrame(krok); };
    requestAnimationFrame(krok);
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

// 5. úvodný obraz: pomalý posun pri skrole (len počítač a myš; na telefóne obraz stojí)
(function uvodParallax() {
  const obraz = $('.uvod-obraz'), sekcia = $('.uvod');
  if (!obraz || !sekcia || !pohyb || !mys) return;
  let raf = 0;
  const krok = () => { raf = 0; const h = sekcia.offsetHeight, y = Math.min(scrollY, h); obraz.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`; };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(krok); }, { passive: true });
})();

// 6. výber bytu: schéma bytovky, filter, panel s údajmi
(function vyber() {
  const sekcia = $('.vyber'); if (!sekcia) return;
  const data = JSON.parse($('#byty-data').textContent);
  const bunky = $$('.bunka', sekcia), karty = $$('.byt-karta', sekcia), filtre = $$('.filter', sekcia);
  const panel = $('.vyber-detail-obsah', sekcia), tip = $('.vyber-detail-tip', sekcia);
  let vybrany = null;

  const ukaz = (id) => {
    const b = data[id]; if (!b) return;
    vybrany = id;
    bunky.forEach((c) => c.classList.toggle('je-vybrana', c.dataset.id === id));
    karty.forEach((k) => k.classList.toggle('je-vybrana', k.dataset.id === id));
    const miest = b.miestnosti.map((m) => `<li><span>${m[0]}</span><span>${plocha(m[1])}</span></li>`).join('');
    panel.innerHTML = `<p class="vyber-detail-kicker">${b.podlazie}. podlažie · ${b.stav}</p><h3>Byt ${id}<span>${b.nazov}</span></h3>` +
      `<p class="vyber-detail-cena">${cena(b.cena)}<small>${plocha(b.plocha)} vrátane loggie</small></p>` +
      `<ul class="miestnosti miestnosti-male">${miest}</ul><a class="tlacidlo tlacidlo-maly" href="${b.url}">Pôdorys a detail bytu ${id}</a>`;
    panel.hidden = false; tip.hidden = true;
    sekcia.classList.add('ma-vyber');
  };
  bunky.forEach((c) => {
    c.addEventListener('pointerenter', () => mys && ukaz(c.dataset.id));
    c.addEventListener('focus', () => ukaz(c.dataset.id));
    // na dotyku prvé ťuknutie ukáže údaje, druhé otvorí detail
    c.addEventListener('click', (e) => { if (!mys && vybrany !== c.dataset.id) { e.preventDefault(); ukaz(c.dataset.id); panel.scrollIntoView({ block: 'nearest', behavior: pohyb ? 'smooth' : 'auto' }); } });
  });
  karty.forEach((k) => { k.addEventListener('pointerenter', () => mys && ukaz(k.dataset.id)); $('a', k).addEventListener('focus', () => ukaz(k.dataset.id)); });

  const filtruj = (f) => {
    filtre.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
    let n = 0;
    const sedi = (el) => f === 'vsetky' || (f[0] === 'p' && el.dataset.podlazie === f[1]) || (f[0] === 't' && el.dataset.typ === f[1]);
    bunky.forEach((c) => { const ok = sedi(c); c.classList.toggle('je-mimo', !ok); c.tabIndex = ok ? 0 : -1; if (ok) n++; });
    karty.forEach((k) => { k.hidden = !sedi(k); });
    $$('.podlazie', sekcia).forEach((p) => p.classList.toggle('je-aktivne', f[0] === 'p' && p.dataset.podlazie === f[1]));
    sekcia.dataset.filter = f;
    const ziv = $('.vyber-pocet', sekcia) || sekcia.querySelector('.vyber-filtre').appendChild(Object.assign(d.createElement('p'), { className: 'vyber-pocet', role: 'status' }));
    ziv.textContent = n === 12 ? `${n} bytov` : n === 1 ? '1 byt' : n < 5 ? `${n} byty` : `${n} bytov`;
  };
  filtre.forEach((b) => b.addEventListener('click', () => filtruj(b.dataset.filter)));
  filtruj('vsetky');
  // klávesnica v schéme: šípky medzi bytmi
  bunky.forEach((c, i) => c.addEventListener('keydown', (e) => {
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 4, ArrowUp: i - 4 };
    if (!(e.key in map)) return; const j = map[e.key]; if (bunky[j] && !bunky[j].classList.contains('je-mimo')) { e.preventDefault(); bunky[j].focus(); }
  }));
})();

// 7. pásy miestností (detail bytu, karty typov): šírka podľa podielu plochy
(function pasy() {
  const zoznamy = $$('[data-miestnosti]');
  if (!zoznamy.length) return;
  if (!pohyb) { zoznamy.forEach((z) => z.classList.add('je-in')); return; }
  const io = new IntersectionObserver((zs, o) => zs.forEach((z) => { if (z.isIntersecting) { z.target.classList.add('je-in'); o.unobserve(z.target); } }), { threshold: 0.3 });
  zoznamy.forEach((z) => io.observe(z));
})();

// 8. prezeranie obrázkov (galéria, pôdorys): dialóg so šípkami, klávesnicou a návratom fokusu
(function prezeranie() {
  const tlacidla = $$('[data-galeria]'); if (!tlacidla.length) return;
  const dlg = d.createElement('dialog'); dlg.className = 'prezeranie'; dlg.setAttribute('aria-label', 'Zväčšený obrázok');
  dlg.innerHTML = '<figure class="prezeranie-obsah"><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="prezeranie-tl prezeranie-pred" aria-label="Predchádzajúci obrázok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="prezeranie-tl prezeranie-dal" aria-label="Ďalší obrázok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="prezeranie-tl prezeranie-zavriet" aria-label="Zavrieť"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
    '<p class="prezeranie-pocet" aria-live="polite"></p>';
  d.body.append(dlg);
  const img = $('img', dlg), cap = $('figcaption', dlg), pocet = $('.prezeranie-pocet', dlg), pred = $('.prezeranie-pred', dlg), dal = $('.prezeranie-dal', dlg);
  let skupina = [], i = 0, otvaral = null;
  const ukaz = (n) => {
    i = (n + skupina.length) % skupina.length; const b = skupina[i];
    img.src = b.dataset.src; img.width = +b.dataset.w; img.height = +b.dataset.h;
    const alt = ($('img', b) || {}).alt || b.getAttribute('aria-label').replace(/^Zväčšiť: /, '');
    img.alt = alt; cap.textContent = alt;
    const jeden = skupina.length < 2; pred.hidden = dal.hidden = jeden;
    pocet.textContent = jeden ? '' : `${i + 1} / ${skupina.length}`;
    if (!jeden) { const dalsi = skupina[(i + 1) % skupina.length]; new Image().src = dalsi.dataset.src; }
  };
  const otvor = (b) => {
    otvaral = b; skupina = tlacidla.filter((x) => x.dataset.galeria === b.dataset.galeria);
    ukaz(skupina.indexOf(b)); dlg.showModal(); $('.prezeranie-zavriet', dlg).focus();
  };
  const zavri = () => { dlg.close(); };
  dlg.addEventListener('close', () => { img.removeAttribute('src'); otvaral && otvaral.focus(); });
  tlacidla.forEach((b) => b.addEventListener('click', () => otvor(b)));
  pred.addEventListener('click', () => ukaz(i - 1)); dal.addEventListener('click', () => ukaz(i + 1));
  $('.prezeranie-zavriet', dlg).addEventListener('click', zavri);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) zavri(); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ukaz(i + 1); if (e.key === 'ArrowLeft') ukaz(i - 1); });
  // potiahnutie prstom
  let x0 = null;
  dlg.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  dlg.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50 && skupina.length > 1) ukaz(dx < 0 ? i + 1 : i - 1); });
})();

// 9. formulár: predvyplní byt z adresy (?byt=A1), overí polia a pripraví e-mail
(function formular() {
  const f = $('#formular'); if (!f) return;
  const byt = new URLSearchParams(location.search).get('byt');
  const sel = f.elements.byt;
  if (byt && sel && [...sel.options].some((o) => o.value === byt.toUpperCase())) {
    sel.value = byt.toUpperCase();
    if (!f.elements.sprava.value) f.elements.sprava.value = `Mám záujem o byt ${byt.toUpperCase()}. `;
  }
  const pozn = $('#formular-pozn');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    $$('.pole', f).forEach((p) => p.removeAttribute('data-chyba'));
    const zle = $$('[required]', f).filter((el) => !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)));
    if (zle.length) { zle.forEach((el) => el.closest('.pole').setAttribute('data-chyba', '')); pozn.textContent = 'Vyplňte, prosím, meno, platný e-mail a správu.'; zle[0].focus(); return; }
    const v = Object.fromEntries(new FormData(f));
    const predmet = v.byt ? `Záujem o byt ${v.byt} – Visionary Living` : 'Dopyt – Visionary Living';
    const telo = `Meno: ${v.meno}\nTelefón: ${v.telefon || ''}\nE-mail: ${v.email}\nByt: ${v.byt || 'zatiaľ neviem'}\n\n${v.sprava}\n`;
    pozn.textContent = 'Otvárame váš e-mailový program s pripravenou správou.';
    location.href = `mailto:${f.getAttribute('action').replace('mailto:', '')}?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
  });
  f.addEventListener('input', (e) => { const p = e.target.closest('.pole'); if (p && e.target.value.trim()) p.removeAttribute('data-chyba'); });
})();
