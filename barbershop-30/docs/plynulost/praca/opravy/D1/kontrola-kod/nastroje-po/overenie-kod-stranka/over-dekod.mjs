// Overenie K04: je tmavá plocha pri zobrazení zálohy karty (a portrétu v páse tímu) spôsobená dekódovaním až pri kreslení?
// Telefón 390×844 @3, CPU 4×, Fast 4G, ?uvod=off. Test A (záloha): kotva k je v okolí (is-near) 4 s, fotka je stiahnutá
// (img.complete), potom okamžitý skok na jej kartu; Page.startScreencast zaznamená skutočne zobrazené snímky 1,5 s.
// Variant „decode“: pred skokom sa zavolá img.decode() (navrhovaná oprava). Test B (pás tímu): vodorovný švih,
// snímky obrazovky; variant „decode“: img.decode() na portrétoch pred švihom.
// Výstup: dekod/<test>-<variant>-<beh>/*.jpg + meta.json; rozbor: python3 over-dekod.py
//   node over-dekod.mjs [--n=2] [--k=3]
import fs from 'fs';
import { opt, BASE, launch, open, sleep } from './spolocne.mjs';
const N = Number(opt.n || 2), K = Number(opt.k || 3);
const browser = await launch();
const root = new URL('./dekod/', import.meta.url).pathname;
async function screencast(cdp, dir, ms) {
  fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  const h = async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {} };
  cdp.on('Page.screencastFrame', h);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
  return async () => { await sleep(ms); await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', h); frames.forEach((f, i) => fs.writeFileSync(`${dir}/${String(i).padStart(3, '0')}.jpg`, Buffer.from(f.data, 'base64'))); return frames.map((f) => f.ts); };
}
for (let i = 1; i <= N; i++) for (const v of ['dnes', 'decode']) {
  // ---- test A: záloha karty ----
  {
    const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'fast4g' });
    await page.goto(BASE + '?uvod=off', { waitUntil: 'load', timeout: 120000 });
    await sleep(4500);
    const geo = await page.evaluate((K) => { const t = [...document.querySelectorAll('.film-shot.is-title')]; const r = (e) => e.getBoundingClientRect().top + scrollY; const h = t[K].getBoundingClientRect().height; return { prev: r(t[K - 1]), top: r(t[K]), h, free: h - (t[K].classList.contains('title-long') ? innerHeight : 0), shot: t[K].dataset.shot, html: document.documentElement.className }; }, K);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), geo.prev + 10);
    await sleep(4000);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const pred = await page.evaluate((K) => { const s = [...document.querySelectorAll('.film-shot.is-title')][K]; const img = s.querySelector('.film-still img'); return { trieda: s.className, complete: img.complete, w: img.naturalWidth, src: (img.currentSrc || '').split('/').pop() }; }, K);
    if (v === 'decode') await page.evaluate((K) => Promise.race([[...document.querySelectorAll('.film-shot.is-title')][K].querySelector('.film-still img').decode().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]), K);
    await page.evaluate((K) => { const s = [...document.querySelectorAll('.film-shot.is-title')][K]; window.__c = []; new MutationObserver(() => window.__c.push({ t: performance.now(), c: s.className })).observe(s, { attributes: true, attributeFilter: ['class'] }); }, K);
    const dir = `${root}A-${v}-${i}`;
    const stop = await screencast(cdp, dir, 1600);
    await sleep(150);
    const tJump = await page.evaluate((y) => { const t = performance.now(); window.scrollTo({ top: y, behavior: 'instant' }); return t; }, geo.top + 0.13 * geo.free + 10);
    const ts = await stop();
    const tl = await page.evaluate(() => ({ c: window.__c, origin: performance.timeOrigin }));
    fs.writeFileSync(`${dir}/meta.json`, JSON.stringify({ test: 'A', v, geo, pred, tJump: tl.origin + tJump, frames: ts.map((x) => x * 1000), triedy: tl.c.map((c) => ({ t: tl.origin + c.t, c: c.c })) }, null, 1));
    console.log(`A ${v} ${i}: kotva ${geo.shot}, pred skokom ${JSON.stringify(pred)}, snímok ${ts.length}`);
    await ctx.close();
  }
  // ---- test B: pás tímu ----
  {
    const { page, cdp, ctx } = await open(browser, { cpu: 1, net: 'fast4g' });
    await page.goto(BASE + '?uvod=off', { waitUntil: 'load', timeout: 120000 });
    await sleep(4000);
    await page.evaluate(() => { const g = document.querySelector('.team-grid'); window.scrollTo({ top: g.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); });
    await sleep(2500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // oba varianty: všetky portréty stiahnuté vopred (loading=eager), aby sa meral len rozdiel dekódovania, nie siete
    await page.evaluate(() => document.querySelectorAll('.team-grid img').forEach((i) => { i.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.team-grid img')].every((i) => i.complete && i.naturalWidth), null, { timeout: 20000 }).catch(() => {});
    const pred = await page.evaluate(() => [...document.querySelectorAll('.team-grid img')].map((i) => (i.complete && i.naturalWidth ? 1 : 0)).join(''));
    if (v === 'decode') await page.evaluate(() => Promise.race([Promise.all([...document.querySelectorAll('.team-grid img')].map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 5000))]));
    const y = await page.evaluate(() => { const r = document.querySelector('.team-grid').getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
    const dir = `${root}B-${v}-${i}`;
    const stop = await screencast(cdp, dir, 1500);
    await sleep(150);
    const t0 = await page.evaluate(() => performance.timeOrigin + performance.now());
    const sent = [cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 360, y }] })];
    for (let k = 1; k <= 8; k++) { await sleep(16); sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 360 - k * 40, y }] })); }
    sent.push(cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }));
    await Promise.all(sent);
    const ts = await stop();
    const boxes = await page.evaluate(() => [...document.querySelectorAll('.team-grid img')].map((i) => { const r = i.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, alt: i.alt.slice(0, 20) }; }));
    fs.writeFileSync(`${dir}/meta.json`, JSON.stringify({ test: 'B', v, pred, t0, frames: ts.map((x) => x * 1000), boxes_konec: boxes, scrollLeft: await page.evaluate(() => document.querySelector('.team-grid').scrollLeft) }, null, 1));
    console.log(`B ${v} ${i}: portréty stiahnuté pred švihom ${pred}, snímok ${ts.length}`);
    await ctx.close();
  }
}
await browser.close();
