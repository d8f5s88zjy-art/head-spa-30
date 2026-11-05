/*
 * BARBERSHOP 30 – Kino a „Ďalej“ (lenivý modul k pásu kapitol v app.js; načíta sa v nečinnosti po načítaní stránky
 * alebo hneď pri ťuku na ▶).
 * KF-02 Kino ▶ „Prehrať prehliadku“: kamera sama prejde kapitoly (jazda aspoň 1,8 s ease-in-out, pri titulnej karte
 *   státie 3,2 s; cez dlhý pás s textom – tím, cenník, galéria – strih, film zábery prelína sám). Koniec na Rezervácii.
 *   Akýkoľvek dotyk, koliesko, kláves alebo skrytie karty Kino hneď zastaví. Pri obmedzenom pohybe skoky po 5 s.
 *   Hudbu pustí to isté prvé ťuknutie ako inde na stránke (atmosfera.js), ak ju zákazník nevypol.
 * KF-03 „Ďalej: <kapitola> ↓“: keď zákazník 1,8 s neskroluje (nie v úvode, na poslednej kapitole, počas Kina ani
 *   nad pásmi s textom). Len text s tieňom a čiara, žiadna doska. Názvy kapitol sú aria-label z pásu (preklady i18n).
 * KF-07 titulky „krok za krokom“ (B5): pri karte Remesla bežia dole kroky pánskeho strihu z cenníka (.steps, preklady
 *   i18n) podľa polohy v karte, ako titulky filmu. Text s tieňom bez dosky, čítačka ich nečíta (sú v cenníku).
 *   Poloha z jednej slučky app.js (BS30_PAS.krok), nič sa pri skrole nemeria. Pri obmedzenom pohybe nie sú.
 * Štýly modulu sú tu (CSS), do prvého obrazu nič nepridávajú.
 */
const d = document, root = d.documentElement;
const line = d.querySelector('.story-line');
const links = line ? [...line.querySelectorAll('a[data-chapter]')] : [];
const play = line && line.querySelector('.kino-play');
const PAS = window.BS30_PAS;
const N = links.length;
const reduced = () => root.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD = 3200, STOJ = 1800;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// popis ▶ pre čítačku v jazyku stránky (slovník i18n; kým sa nenačíta, po slovensky)
const tr = (k) => (window.B30_LANG ? window.B30_LANG.t(k) : k);

let zapnute = false, next = null, nextN = null, nextK = null, stojT = 0;
let playing = false, tw = 0, hold = 0;
const jazda = [];
const CSS = `
.kino-tit{position:absolute;left:0;right:0;bottom:104px;width:min(640px,calc(100% - 48px));height:3em;margin:0 auto;padding:0;list-style:none;text-align:center;pointer-events:none}
.kino-tit li{position:absolute;left:0;right:0;bottom:0;opacity:0;transform:translateY(6px);transition:opacity .35s,transform .35s;color:var(--paper);font:600 1.125rem/1.35 var(--font-text);text-shadow:0 0 2px rgba(0,0,0,.95),0 1px 6px rgba(0,0,0,.9),0 0 16px rgba(0,0,0,.65)}
.kino-tit li.on{opacity:1;transform:none}
.kino-tit i{margin-right:.45em;font:italic 500 1.05em var(--font-display);color:var(--lamp-2)}
@media (max-width:720px) and (orientation:portrait){.kino-tit{bottom:auto;top:calc(var(--pas) - 4.05rem);left:var(--gutter);right:var(--gutter);width:auto;height:2.7rem}.kino-tit li{font-size:1rem}}
@media (max-height:500px){.kino-tit{display:none}}
html.obj-otvorene .kino-tit,.site-header[data-menu="open"]~.site .kino-tit,html.lang-ponuka .kino-tit{opacity:0}
@media (max-width:900px){html.asi-open .kino-tit{opacity:0}}
@media (prefers-reduced-motion:reduce){.kino-tit{display:none}}
html[data-motion="off"] .kino-tit{display:none}`;

/* pásy s textom v skrole (merajú sa pri štarte jazdy, nie počas nej) */
const pasy = () => [...d.querySelectorAll('.band')].map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; });

function dalej() {
  if (!next) return;
  const c = PAS.kapitola;
  const ok = c > 0 && c < N - 1;
  next.hidden = !ok;
  if (!ok) return;
  next.href = links[c + 1].getAttribute('href');
  nextN.textContent = links[c + 1].getAttribute('aria-label');
  nextK.textContent = tr('Ďalej');
}

export function zapni() {
  if (zapnute || !line || !PAS || !N) return;
  zapnute = true;
  next = d.createElement('a'); next.className = 'kino-next'; next.href = '#'; next.hidden = true;
  // „Ďalej“ zo slovníka i18n (pri zmene jazyka ho preloží dalej(), nie zbierka textov i18n)
  next.innerHTML = '<span class="kino-next-k" data-no-i18n></span> <span class="kino-next-n"></span> <span aria-hidden="true">↓</span>';
  nextN = next.querySelector('.kino-next-n'); nextK = next.querySelector('.kino-next-k');
  line.after(next); // hneď za pásom: v poradí Tab za kapitolami, nie až za pätičkou
  // kapitola sa mení v app.js (data-scene-active); jazyk mení názvy (aria-label)
  new MutationObserver(dalej).observe(root, { attributes: true, attributeFilter: ['data-scene-active', 'lang'] });
  dalej();
  const st = d.createElement('style'); st.textContent = CSS; d.head.append(st);
  titulky();
  // zastavenie: 1,8 s bez skrolu (len časovač, nič sa pri skrole nemeria)
  const stoj = () => { if (!playing) root.classList.add('kino-stoji'); };
  addEventListener('scroll', () => { if (root.classList.contains('kino-stoji')) root.classList.remove('kino-stoji'); clearTimeout(stojT); stojT = setTimeout(stoj, STOJ); }, { passive: true });
  stojT = setTimeout(stoj, STOJ);
  // Kino zastaví zákazník: koliesko a kláves vždy (aj s myšou nad ▶ či fokusom na ▶ hneď po kliknutí), dotyk a stlačenie
  // mimo ▶, skrytie karty. ▶ prepína len kliknutím; Enter a medzerník na fokusovanom ▶ sú to isté kliknutie.
  const prerus = (e) => { if (playing && !(e.target instanceof Element && e.target.closest('.kino-play'))) stop(); };
  ['touchstart', 'pointerdown'].forEach((t) => addEventListener(t, prerus, { passive: true, capture: true }));
  addEventListener('wheel', () => { if (playing) stop(); }, { passive: true, capture: true });
  addEventListener('keydown', (e) => { if (playing && !(d.activeElement === play && (e.key === 'Enter' || e.key === ' '))) stop(); }, { capture: true });
  d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); });
  window.BS30_KINO = { play: start, stop, get state() { return { playing, cur: PAS.kapitola, ciele: links.map((_, i) => Math.round(PAS.ciel(i))), jazda: jazda.slice() }; } };
}

function titulky() {
  const ol = d.querySelector('.steps'), fr = d.querySelector('#remeslo .title-frame');
  const iR = links.findIndex((a) => a.getAttribute('href') === '#remeslo');
  if (!ol || !fr || iR < 0 || !PAS.karta || reduced()) return;
  const n = ol.children.length, box = d.createElement('ol');
  box.className = 'kino-tit'; box.setAttribute('aria-hidden', 'true');
  // texty zo zoznamu krokov na stránke (už preložené); i18n.js vložené uzly zaradí a prekladá ďalej
  const li = [...ol.children].map((x, i) => {
    const e = d.createElement('li'); e.innerHTML = `<i>0${i + 1}</i><span></span>`;
    e.lastChild.textContent = x.textContent.trim(); return e;
  });
  box.append(...li); fr.append(box);
  // krok podľa polohy v karte Remesla: u 0 karta prichádza, 0,92 odchádza; päť rovnakých úsekov
  let cur = -1;
  PAS.krok = (y) => {
    const k = PAS.karta(iR), u = k ? (y - k[0]) / k[1] : -1;
    const j = u < 0 || u >= 0.92 ? -1 : Math.floor(u / 0.92 * n);
    if (j === cur) return;
    if (li[cur]) li[cur].classList.remove('on');
    cur = j; if (li[j]) li[j].classList.add('on');
  };
}
function go(i, b) {
  if (!playing) return;
  if (i >= N) { stop(); return; }
  const y0 = scrollY, y1 = PAS.ciel(i), vh = innerHeight, dist = Math.abs(y1 - y0);
  const potom = () => { jazda.push({ i, y: Math.round(scrollY), t: Math.round(performance.now()) }); hold = setTimeout(() => go(i + 1, b), reduced() ? 5000 : HOLD); };
  // cez dlhý pás s textom sa nejazdí, ide sa strihom (jazda cez cenník by ukázala len prebiehajúci text)
  const strih = b.some((p) => p[1] - p[0] > vh * 0.8 && p[0] < Math.max(y0, y1) && p[1] > Math.min(y0, y1));
  if (reduced() || dist < 4 || strih) { scrollTo({ top: y1, behavior: 'instant' }); potom(); return; }
  const dur = Math.max(1800, Math.min(6000, dist / vh * 1250)), t0 = performance.now();
  const krok = (now) => {
    if (!playing) return;
    const t = Math.min(1, (now - t0) / dur);
    scrollTo({ top: y0 + (y1 - y0) * ease(t), behavior: 'instant' });
    if (t < 1) tw = requestAnimationFrame(krok); else potom();
  };
  tw = requestAnimationFrame(krok);
}
function start() {
  zapni();
  if (playing) return;
  playing = true; root.classList.add('kino-hra'); root.classList.remove('kino-stoji');
  play.setAttribute('aria-label', tr('Zastaviť prehliadku'));
  // z rozpozeranej kapitoly pokračuje; na konci stránky začne odznova
  let i = Math.max(0, PAS.kapitola);
  if (scrollY > PAS.ciel(i) + 8) i++;
  if (i >= N) i = 0;
  go(i, pasy());
}
function stop() {
  if (!playing) return;
  playing = false; cancelAnimationFrame(tw); clearTimeout(hold);
  root.classList.remove('kino-hra'); play.setAttribute('aria-label', tr('Prehrať prehliadku'));
}
export function prepni() { zapni(); if (playing) stop(); else start(); }
