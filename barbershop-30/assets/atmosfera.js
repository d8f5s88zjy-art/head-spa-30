/*
 * BARBERSHOP 30 – atmosféra: kurzor nožnice, svetlo pod kurzorom, hudba na pozadí a zvuk strihnutia pri kliknutí.
 *
 * Modul načíta app.js (časť 7b) až pri prvom pohybe myši, dotyku či klávese, inak 3,5 s po načítaní stránky,
 * a zavolá spusti(gesto); gesto = návštevník už klikol alebo ťukol, kým sa modul načítaval. Nič z toho
 * sa nesťahuje pred prvým obrazom: HTML aj style.css ostávajú bez zmeny (Lighthouse telefón, LCP).
 * 0. Štýly (atmosfera.css): kurzor v tvare nožníc, svetlo a tlačidlo Hudba; tlačidlo sa ukáže až s nimi.
 * 1. Svetlo: teplý kruh pod kurzorom (len myš), aby sa návštevník na tmavej stránke nestratil. Hýbe sa iba
 *    transform na vlastnom prvku (nič sa nezapisuje na <html>, nič sa neprepočítava na celej stránke).
 * 2. Zvuk (Web Audio, jeden spoločný kontext):
 *    - hudba: vlastná skladba (source/tools/hudba.py, pokojná bossa nova), tichá slučka bez medzery. Prehliadač zvuk dovolí až po kliknutí
 *      alebo ťuknutí, preto sa pustí pri prvom kliknutí na stránke (nie pri klávese, aby nerušila čítačku);
 *      súbor sa stiahne až pri prvom pustení;
 *    - strihnutie: krátky zvuk nožníc (source/tools/strih.py, 3 varianty) pri kliknutí myšou (spolu so zatvorením
 *      kurzora) a pri ťuknutí prstom, nie pri skrolovaní ani klávese; malý súbor sa načíta hneď po module
 *      (pri data-motion=off až pri prvom kliknutí).
 *    Tlačidlo „Hudba“ v lište vypne aj zapne hudbu aj strihanie; voľba sa pamätá (localStorage).
 *    ?hudba=off vypne zvuk, ?svetlo=off vypne svetlo.
 */
const html = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = html.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------------------------
   1. Svetlo pod kurzorom
   ---------------------------------------------------------------------------- */
function svetlo() {
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
}

/* ----------------------------------------------------------------------------
   2. Zvuk: hudba a strihnutie
   ---------------------------------------------------------------------------- */
function zvuk(btn, gesto) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC || !window.fetch) { if (btn) btn.remove(); return; }
  const KEY = 'b30-hudba';
  const LOOP = 16 * 4 * 60 / 76;          // dĺžka slučky hudby v s (16 taktov, 76 BPM)
  const VOL = 0.3;                        // hlasitosť hudby: tiché pozadie (skladba má RMS -22 dBFS)
  const SNIP_VOL = 0.42, SLOT = 0.25, SNIPS = 3;   // strihnutie: 3 varianty po 0,25 s (source/tools/strih.py)
  const opus = !!document.createElement('audio').canPlayType('audio/webm; codecs="opus"');
  const file = (name) => new URL(`audio/${name}.${opus ? 'webm' : 'm4a'}`, import.meta.url);
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* súkromné okno */ } };
  const muted = () => read() === 'vyp';
  let ctx = null, gain = null, src = null, loading = null, playing = false;

  // dekódovanie bez kontextu, ktorý by čakal na gesto (OfflineAudioContext gesto nepotrebuje);
  // AudioBuffer sa dá prehrať v ktoromkoľvek kontexte
  const decode = (url) => fetch(url)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((a) => {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const dc = ctx || new OAC(2, 1, 48000);
      return new Promise((res, rej) => dc.decodeAudioData(a, res, rej));
    });

  // kontext sa vytvorí a rozbehne priamo v obsluhe kliknutia (v rámci gesta)
  const ensure = () => {
    if (!ctx) {
      ctx = new AC();
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    }
    if (ctx.state !== 'running') ctx.resume();
    return ctx;
  };

  /* ---- strihnutie ---- */
  let snipBuf = null, snipLoad = null, lastSnip = -1;
  const loadSnip = () => snipLoad || (snipLoad = decode(file('strih')).then((b) => (snipBuf = b)).catch(() => null));
  const snip = () => {
    if (muted()) return;
    try { ensure(); } catch (e) { return; }
    const play = () => {
      if (!snipBuf || muted()) return;
      let i = Math.floor(Math.random() * SNIPS);
      if (i === lastSnip) i = (i + 1) % SNIPS;            // nie dvakrát za sebou ten istý
      lastSnip = i;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = snipBuf;
      s.playbackRate.value = 0.94 + Math.random() * 0.12;
      g.gain.value = SNIP_VOL;
      s.connect(g); g.connect(ctx.destination);
      s.start(0, i * SLOT, SLOT);
    };
    if (snipBuf) play(); else loadSnip().then(play);
  };
  // malý súbor (asi 15 kB) až po načítaní stránky, mimo prvého obrazu; pri šetrení dát a pokojnej verzii
  // (data-motion=off) sa vopred nesťahuje nič, zvuk sa načíta až pri prvom kliknutí
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  if (!muted() && html.dataset.motion !== 'off') {
    if (document.readyState === 'complete') idle(() => loadSnip());
    else addEventListener('load', () => idle(() => loadSnip()), { once: true });
  }

  /* ---- hudba ---- */
  const show = () => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.title = playing ? 'Vypnúť hudbu a zvuky' : 'Zapnúť hudbu a zvuky';
  };
  const ramp = (to, sec) => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(to, t + sec);
  };
  const loadMusic = () => loading || (loading = decode(file('hudba')));
  function start() {
    if (playing) return;
    playing = true; show();
    try { ensure(); } catch (e) { fail(); return; }
    loadMusic().then((buf) => {
      if (!playing) return;
      if (!src) {
        src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(LOOP, buf.duration);
        src.connect(gain); src.start();
      }
      ramp(VOL, 4);                     // pomalý nástup
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
    if (playing) { stop(); save('vyp'); } else { save('zap'); start(); loadSnip(); }
  });

  /* ---- gestá ----
     myš: strihnutie hneď pri stlačení (spolu so zatvorením kurzora); prst a pero: až pri ťuknutí (click),
     aby skrolovanie nestrihalo; kláves ani tlačidlo Hudba nestrihá. Prvé gesto pustí aj hudbu. */
  let firstDone = muted();
  const first = () => {
    if (firstDone || muted()) { firstDone = true; return; }
    if (!playing) start(); else if (ctx && ctx.state !== 'running') ctx.resume();
    if (ctx && ctx.state === 'running') firstDone = true;
    else if (ctx) ctx.addEventListener('statechange', () => { if (ctx.state === 'running') firstDone = true; }, { once: true });
  };
  const onBtn = (e) => e.target instanceof Element && e.target.closest('.hudba');
  let lastType = 'mouse';
  addEventListener('pointerdown', (e) => {
    lastType = e.pointerType;
    if (e.pointerType !== 'mouse' || e.button !== 0 || onBtn(e)) return;
    first(); snip();
  }, { capture: true, passive: true });
  addEventListener('click', (e) => {
    if (lastType === 'mouse' || e.detail === 0 || onBtn(e)) return;   // detail 0 = kliknutie klávesom
    first(); snip();
  }, { capture: true, passive: true });
  // iOS Safari odomkne zvuk až pri touchend; prvé ťuknutie pustí hudbu
  addEventListener('touchend', (e) => { if (!onBtn(e)) first(); }, { capture: true, passive: true });

  // skrytá karta: zvuk sa zastaví, po návrate pokračuje
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (playing) ctx.resume();
  });

  // kliknutie alebo ťuknutie pred načítaním modulu pustí hudbu teraz (prehliadač si interakciu so stránkou
  // pamätá; Safari na iPhone ju pustí až pri ďalšom ťuknutí, first() to zvládne)
  if (gesto && !muted() && !document.hidden) first();
}

/* ----------------------------------------------------------------------------
   0. Štýly a tlačidlo Hudba; spustenie
   ---------------------------------------------------------------------------- */
const TLACIDLO = '<span class="hudba-ikona" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path class="hudba-preskrt" d="M3.5 3.5l17 17"/></svg><span class="hudba-eq"><i></i><i></i><i></i></span></span><span class="hudba-text">Hudba</span>';

export function spusti(gesto = false) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('atmosfera.css', import.meta.url).href;
  // tlačidlo do lišty pred prepínač menu (na počítači je prepínač skrytý, tlačidlo stojí pred navigáciou)
  let btn = null;
  const head = document.querySelector('.site-header .container');
  if (head && params.get('hudba') !== 'off') {
    btn = document.createElement('button');
    btn.className = 'hudba'; btn.type = 'button'; btn.hidden = true;
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = TLACIDLO;
    head.insertBefore(btn, head.querySelector('.nav-toggle'));
  }
  const ready = () => { svetlo(); zvuk(btn, gesto); };
  link.addEventListener('load', ready, { once: true });
  link.addEventListener('error', () => { if (btn) btn.remove(); }, { once: true });
  document.head.append(link);
}
