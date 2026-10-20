// Overenie K03: čo spraví prvý ťah prstom (skrol nadol, vodorovný švih po páse tímu, ťuknutie) s hudbou na telefóne.
// Telefón 390×844 @3, CPU 4×, Fast 4G, ?uvod=off. AudioContext sa obalí (čas konštrukcie, stav, či malo gesto aktiváciu),
// zaznamenajú sa požiadavky na assets/audio/*, LoAF so zdrojom a stav tlačidla Hudba.
//   node over-audio.mjs [--n=2]
import { opt, BASE, launch, open, swipe, sleep } from './spolocne.mjs';
const N = Number(opt.n || 2);
const browser = await launch();
const rows = [];
for (const typ of ['skrol', 'pas-vodorovne', 'tuknutie']) for (let i = 0; i < N; i++) {
  const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'fast4g' });
  await page.addInitScript(() => {
    window.__ac = []; window.__loaf = [];
    const AC0 = window.AudioContext;
    if (AC0) window.AudioContext = class extends AC0 {
      constructor(...a) { const t = performance.now(); super(...a); const ua = navigator.userActivation; window.__ac.push({ t: Math.round(t), konstrukcia_ms: +(performance.now() - t).toFixed(1), stav: this.state, aktivacia: ua ? ua.hasBeenActive : '?' }); window.__acRef = this; this.addEventListener('statechange', () => window.__ac.push({ t: Math.round(performance.now()), stav: this.state })); }
    };
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), blk: Math.round(e.blockingDuration || 0), s: (e.scripts || []).filter((s) => s.duration > 3).map((s) => `${s.invoker.slice(0, 40)} ${(s.sourceURL || '').split('/').pop()} ${Math.round(s.duration)}`) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  });
  const reqs = [];
  page.on('request', (r) => { if (/audio\//.test(r.url())) reqs.push({ t: Date.now(), u: r.url().split('/').pop() }); });
  await page.goto(BASE + '?uvod=off', { waitUntil: 'load', timeout: 120000 });
  await sleep(5000);   // atmosfera.js sa načíta 3,5 s po load (aj bez dotyku)
  if (typ === 'pas-vodorovne') {
    await page.evaluate(() => { const g = document.querySelector('.team-grid'); window.scrollTo({ top: g.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); });
    await sleep(1500);
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t0 = await page.evaluate(() => performance.now());
  const tr0 = Date.now();
  if (typ === 'skrol') await swipe(cdp, { dy: 600, speed: 1300 });
  else if (typ === 'pas-vodorovne') {
    const y = await page.evaluate(() => { const r = document.querySelector('.team-grid').getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
    const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 360, y }] })];
    for (let k = 1; k <= 8; k++) { await sleep(16); sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 360 - k * 40, y }] })); }
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
    await Promise.all(sent);
  } else {
    // ťuknutie na neaktívne miesto (text titulnej karty), nie na odkaz
    await page.touchscreen.tap(195, 300);
  }
  await sleep(3500);
  const m = await page.evaluate((t0) => ({
    ac: window.__ac, stav_teraz: window.__acRef ? window.__acRef.state : 'žiadny AudioContext',
    aktivacia: navigator.userActivation ? { bola: navigator.userActivation.hasBeenActive } : '?',
    hudba: document.querySelector('.hudba')?.getAttribute('aria-pressed'),
    eq_animacie: document.getAnimations().filter((a) => a.effect?.target?.closest?.('.hudba-eq') && a.playState === 'running').length,
    loaf: window.__loaf.filter((e) => e.t >= t0 && e.d > 50),
    scrollY: Math.round(scrollY), pas: Math.round(document.querySelector('.team-grid').scrollLeft),
  }), t0);
  rows.push({ typ, beh: i + 1, ...m, audio_poziadavky: reqs.filter((r) => r.t >= tr0).map((r) => `${r.u} +${r.t - tr0} ms`) });
  await ctx.close();
}
await browser.close();
for (const r of rows) {
  console.log(`--- ${r.typ} beh ${r.beh}: scrollY ${r.scrollY}, pás ${r.pas}, aktivácia ${JSON.stringify(r.aktivacia)}, Hudba aria-pressed=${r.hudba}, bežiace animácie ekvalizéra ${r.eq_animacie}, AudioContext teraz: ${r.stav_teraz}`);
  console.log('    AudioContext:', JSON.stringify(r.ac));
  console.log('    audio požiadavky:', r.audio_poziadavky.join(', ') || '-');
  for (const l of r.loaf) console.log(`    LoAF ${l.d} ms (blok ${l.blk}) ${l.s.join(' | ')}`);
}
