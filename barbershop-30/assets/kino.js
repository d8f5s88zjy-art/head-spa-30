/*
 * BARBERSHOP 30 – Kino a „Ďalej“ (lenivý modul k pásu kapitol v app.js; načíta sa v nečinnosti po načítaní stránky
 * alebo hneď pri ťuku na ▶).
 * KF-02 Kino ▶ „Prehrať prehliadku“: kamera sama prejde kapitoly (jazda aspoň 1,8 s ease-in-out, pri titulnej karte
 *   státie 3,2 s; cez dlhý pás s textom – tím, cenník, galéria – strih, film zábery prelína sám). Koniec na Rezervácii.
 *   Akýkoľvek dotyk, koliesko, kláves alebo skrytie karty Kino hneď zastaví. Pri obmedzenom pohybe skoky po 5 s.
 *   Hudbu pustí to isté prvé ťuknutie ako inde na stránke (atmosfera.js), ak ju zákazník nevypol.
 * KF-03 „Ďalej: <kapitola> ↓“: keď zákazník 1,8 s neskroluje (nie v úvode, na poslednej kapitole, počas Kina ani
 *   nad pásmi s textom). Len text s tieňom a čiara, žiadna doska. Názvy kapitol sú aria-label z pásu (preklady i18n).
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

let zapnute = false, next = null, nextN = null, stojT = 0;
let playing = false, tw = 0, hold = 0;
const jazda = [];

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
}

export function zapni() {
  if (zapnute || !line || !PAS || !N) return;
  zapnute = true;
  next = d.createElement('a'); next.className = 'kino-next'; next.href = '#'; next.hidden = true;
  next.innerHTML = '<span class="kino-next-k">Ďalej</span> <span class="kino-next-n"></span> <span aria-hidden="true">↓</span>';
  nextN = next.querySelector('.kino-next-n');
  line.after(next); // hneď za pásom: v poradí Tab za kapitolami, nie až za pätičkou
  // kapitola sa mení v app.js (data-scene-active); jazyk mení názvy (aria-label)
  new MutationObserver(dalej).observe(root, { attributes: true, attributeFilter: ['data-scene-active', 'lang'] });
  dalej();
  // zastavenie: 1,8 s bez skrolu (len časovač, nič sa pri skrole nemeria)
  const stoj = () => { if (!playing) root.classList.add('kino-stoji'); };
  addEventListener('scroll', () => { if (root.classList.contains('kino-stoji')) root.classList.remove('kino-stoji'); clearTimeout(stojT); stojT = setTimeout(stoj, STOJ); }, { passive: true });
  stojT = setTimeout(stoj, STOJ);
  // Kino zastaví zákazník: dotyk, koliesko, kláves (okrem ▶), skrytie karty
  const prerus = (e) => { if (playing && !(e.target instanceof Element && e.target.closest('.kino-play'))) stop(); };
  ['wheel', 'touchstart', 'pointerdown'].forEach((t) => addEventListener(t, prerus, { passive: true, capture: true }));
  addEventListener('keydown', (e) => { if (playing && d.activeElement !== play) stop(); }, { capture: true });
  d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); });
  window.BS30_KINO = { play: start, stop, get state() { return { playing, cur: PAS.kapitola, ciele: links.map((_, i) => Math.round(PAS.ciel(i))), jazda: jazda.slice() }; } };
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
