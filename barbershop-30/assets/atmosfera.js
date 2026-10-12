/*
 * BARBERSHOP 30 – atmosféra: svetlo pod kurzorom a hudba na pozadí.
 *
 * Kurzor v tvare nožníc je čisto v CSS (style.css, časť 12), funguje aj bez tohto súboru.
 * 1. Svetlo: teplý kruh pod kurzorom (len myš), aby sa návštevník na tmavej stránke nestratil. Hýbe sa iba
 *    transform na vlastnom prvku (nič sa nezapisuje na <html>, nič sa neprepočítava na celej stránke).
 * 2. Hudba: vlastná skladba (source/tools/hudba.py), slučka bez medzery cez Web Audio. Prehliadač zvuk dovolí
 *    až po kliknutí alebo ťuknutí, preto sa pustí pri prvom kliknutí na stránke (nie pri klávese, aby nerušila
 *    čítačku obrazovky). Tlačidlo „Hudba“ v lište ju vypne a zapne; voľba sa pamätá (localStorage).
 *    Súbor sa stiahne až pri prvom pustení. ?hudba=off ju vypne, ?svetlo=off vypne svetlo.
 */
const html = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = html.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------------------
   1. Svetlo pod kurzorom
   ---------------------------------------------------------------------------- */
(function svetlo() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || params.get('svetlo') === 'off') return;
  const el = document.createElement('div');
  el.className = 'kurzor-svetlo';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  const SEL = 'a, button, [role="button"], label, summary, select, .btn';
  let x = 0, y = 0, cx = 0, cy = 0, s = 1, ts = 1, raf = 0, on = false;
  const tick = () => {
    raf = 0;
    const k = reduced ? 1 : 0.3;
    cx += (x - cx) * k; cy += (y - cy) * k; s += (ts - s) * (reduced ? 1 : 0.18);
    const moving = Math.abs(x - cx) > 0.3 || Math.abs(y - cy) > 0.3 || Math.abs(ts - s) > 0.002;
    if (!moving) { cx = x; cy = y; s = ts; }          // dobehne presne na miesto kurzora
    el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    if (moving) raf = requestAnimationFrame(tick);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; cx = x; cy = y; el.classList.add('is-on'); }
    go();
  }, { passive: true });
  // nad odkazom a tlačidlom sa svetlo trochu zväčší
  document.addEventListener('pointerover', (e) => {
    const t = e.target instanceof Element && e.target.closest(SEL) ? 1.3 : 1;
    if (t !== ts) { ts = t; go(); }
  }, { passive: true });
  // strih: pri kliknutí krátko zosilnie
  addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    el.classList.remove('is-strih'); void el.offsetWidth; el.classList.add('is-strih');
  }, { passive: true });
  // kurzor mimo okna: svetlo zhasne
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) { on = false; el.classList.remove('is-on'); } });
})();

/* ----------------------------------------------------------------------------
   2. Hudba
   ---------------------------------------------------------------------------- */
(function hudba() {
  const btn = document.querySelector('.hudba');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC || !window.fetch || params.get('hudba') === 'off') return;
  const KEY = 'b30-hudba';
  const LOOP = 16 * 4 * 60 / 82;          // dĺžka slučky v s (16 taktov, 82 BPM)
  const VOL = 0.5;
  const probe = document.createElement('audio');
  const url = new URL(probe.canPlayType('audio/webm; codecs="opus"') ? 'audio/hudba.webm' : 'audio/hudba.m4a', import.meta.url);
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* súkromné okno */ } };
  let ctx = null, gain = null, src = null, buf = null, loading = null, playing = false;

  const show = () => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.title = playing ? 'Vypnúť hudbu' : 'Zapnúť hudbu';
  };
  const ramp = (to, sec) => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(to, t + sec);
  };
  const load = () => loading || (loading = fetch(url)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((a) => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej))));

  // volá sa priamo z kliknutia: kontext sa vytvorí a rozbehne ešte v rámci gesta, súbor sa načíta potom
  function start() {
    if (playing) return;
    playing = true; show();
    try {
      if (!ctx) {
        ctx = new AC();
        gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
      }
      if (ctx.state !== 'running') ctx.resume();
    } catch (e) { fail(); return; }
    load().then((b) => {
      buf = b;
      if (!playing) return;
      if (!src) {
        src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(LOOP, buf.duration);
        src.connect(gain); src.start();
      }
      ramp(VOL, 2.5);
    }).catch(fail);
  }
  function stop() {
    if (!playing) return;
    playing = false; show();
    if (!ctx) return;
    ramp(0, 0.5);
    setTimeout(() => { if (!playing && ctx.state === 'running') ctx.suspend(); }, 650);
  }
  function fail() { playing = false; btn.hidden = true; }

  btn.hidden = false; show();
  btn.addEventListener('click', () => {
    if (playing) { stop(); save('vyp'); } else { start(); save('zap'); }
  });

  // prvé kliknutie alebo ťuknutie na stránke pustí hudbu, ak ju návštevník predtým nevypol
  const GESTA = ['pointerdown', 'pointerup', 'touchend', 'click'];
  const first = (e) => {
    if (e.target instanceof Element && e.target.closest('.hudba')) return;   // tlačidlo rieši samo
    if (read() === 'vyp') { done(); return; }
    if (e.type === 'pointerdown' && e.pointerType !== 'mouse') return;    // pri dotyku až pointerup/touchend
    if (!playing) start(); else if (ctx && ctx.state !== 'running') ctx.resume();
    if (ctx && ctx.state === 'running') done();
    else if (ctx) ctx.addEventListener('statechange', () => { if (ctx.state === 'running') done(); }, { once: true });
  };
  const done = () => GESTA.forEach((g) => removeEventListener(g, first, true));
  if (read() !== 'vyp') GESTA.forEach((g) => addEventListener(g, first, { capture: true, passive: true }));

  // skrytá karta: zvuk sa zastaví, po návrate pokračuje
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (playing) ctx.resume();
  });
})();
