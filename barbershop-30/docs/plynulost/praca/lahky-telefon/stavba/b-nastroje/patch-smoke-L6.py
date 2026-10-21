import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
rep=[
("""//     ?film=on na telefóne film zapne (world); úzke okno 600×900 s myšou ostáva na filme (world, bez lite)
""","""//     ?film=on na telefóne film zapne (world); úzke okno 600×900 s myšou ostáva na filme (world, bez lite);
//     slučka záberu Tím (L6): pri štarte sa nič nesťahuje, plagát až v okolí, video až pri prehraní; hrá len pri
//     zábere cez okno, mimo neho stojí, najviac jedno hrajúce, bez posunu rozloženia; úsporný režim nechá plagát;
//     pri obmedzenom pohybe a ?film=on žiadna slučka
"""),
("""    const FILM_REQ = /three\\.module|film\\.js|film-worker|\\/seq\\/|hlbka|tim-slucka/;
""","""    const FILM_REQ = /three\\.module|film\\.js|film-worker|\\/seq\\/|hlbka|tim-slucka/;
    // pri kotve #tim je slučka záberu Tím (L6, tim-slucka) v okolí zámerne; ostatné súbory filmu nie
    const FILM_REQ_KOTVA = /three\\.module|film\\.js|film-worker|\\/seq\\/|hlbka/;
"""),
("""      ok(st.lite && st.off && st.curNear && (st.hotova.length > 0 || st.kryte) && st.gl === 0 && !requests.some((u) => FILM_REQ.test(u)),""",
"""      ok(st.lite && st.off && st.curNear && (st.hotova.length > 0 || st.kryte) && st.gl === 0 && !requests.some((u) => FILM_REQ_KOTVA.test(u)),"""),
("""    {
      const ctx = await browser.newContext({ viewport: { width: 600, height: 900 }, colorScheme: 'dark' });
      const page = await ctx.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
      const cls = await page.evaluate(() => document.documentElement.className);
      ok(/(^|\\s)world(\\s|$)/.test(cls) && !/\\blite\\b/.test(cls),""",
"""    // slučka záberu Tím (L6): bežné <video> v zálohe, bez väzby na skrol
    {
      const loopState = (page) => page.evaluate(() => {
        const v = document.querySelector('.film-loop'); if (!v) return null;
        const sh = v.closest('.film-shot'), r = v.getBoundingClientRect();
        return { shot: sh.dataset.shot, near: sh.classList.contains('is-near'), shown: sh.classList.contains('is-shown'), poster: v.poster.split('/').pop(),
          paused: v.paused, t: +v.currentTime.toFixed(2), preload: v.getAttribute('preload'), muted: v.muted, loop: v.loop, inline: v.playsInline,
          playing: [...document.querySelectorAll('video')].filter((x) => !x.paused).length, box: [r.width, r.height].map(Math.round), still: (() => { const b = sh.querySelector('.film-still').getBoundingClientRect(); return [b.width, b.height].map(Math.round); })() };
      });
      const LOOP_HOOK = `window.__ls = 0; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__ls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
        window.__maxPlay = 0; (function f() { const n = [...document.querySelectorAll('video')].filter((v) => !v.paused).length; if (n > window.__maxPlay) window.__maxPlay = n; requestAnimationFrame(f); })();`;
      const goShot = async (page, sel, off) => { await page.evaluate(([sel, off]) => { const e = document.querySelector(sel); scrollTo({ top: e.getBoundingClientRect().top + scrollY + off * innerHeight, behavior: 'instant' }); }, [sel, off]); await sleep(900); };
      const { ctx, page, problems, requests } = await liteOpen({ viewport: { width: 390, height: 844 }, init: LOOP_HOOK });
      const vreq = () => requests.filter((u) => /tim-slucka/.test(u)).map((u) => u.split('/').pop());
      const s0 = await loopState(page), r0 = vreq();
      ok(!!s0 && s0.shot === 'sala-rano' && s0.preload === 'none' && s0.muted && s0.loop && s0.inline && s0.paused && r0.length === 0 && (await page.evaluate(() => document.querySelectorAll('.film-loop').length)) === 1,
        '[lite slučka] jedna slučka v zábere Tím (muted, playsinline, loop, preload none), pri štarte sa nič nesťahuje', JSON.stringify({ s0, r0 }));
      await goShot(page, '[data-shot="cakaren"]', 0.3);
      const s1 = await loopState(page), r1 = vreq();
      ok(s1.near && s1.paused && r1.length === 1 && /poster/.test(r1[0]), '[lite slučka] karta pred Tímom: plagát áno, video sa ešte nesťahuje', JSON.stringify({ s1, r1 }));
      await goShot(page, '[data-shot="sala-rano"]', 0.35);
      const s2 = await loopState(page); await sleep(1200); const s3 = await loopState(page);
      ok(!s3.paused && s3.t > s2.t && s3.playing === 1 && vreq().some((u) => /\\.(mp4|webm)$/.test(u)) && s3.box[0] === s3.still[0] && s3.box[1] === s3.still[1],
        '[lite slučka] záber Tím cez okno: video hrá, leží presne na zálohe', JSON.stringify({ s2: s2.t, s3, r: vreq() }));
      await goShot(page, '.band-team', 0.1);
      const s4 = await loopState(page);
      await goShot(page, '[data-shot="kreslo-stred"]', 0.4);
      const s5 = await loopState(page);
      ok(s4.paused && s5.paused, '[lite slučka] mimo záberu (pás tímu, ďalšia karta) video stojí', JSON.stringify({ s4: [s4.paused, s4.shown], s5: [s5.paused, s5.shown] }));
      const ls = await page.evaluate(() => window.__ls), mp = await page.evaluate(() => window.__maxPlay);
      ok(mp <= 1 && ls < 0.001 && problems.length === 0, '[lite slučka] najviac jedno hrajúce video, žiadny posun rozloženia, bez chýb', JSON.stringify({ maxPlay: mp, cls: +ls.toFixed(4), problems: problems.slice(0, 2) }));
      await ctx.close();
    }
    {
      // úsporný režim (play() odmietnuté): ostáva plagát, bez chýb
      const { ctx, page, problems } = await liteOpen({ viewport: { width: 390, height: 844 }, init: ';HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException("x", "NotAllowedError")); };' });
      for (const [sel, off] of [['[data-shot="cakaren"]', 0.3], ['[data-shot="sala-rano"]', 0.35]]) {
        await page.evaluate(([sel, off]) => { const e = document.querySelector(sel); scrollTo({ top: e.getBoundingClientRect().top + scrollY + off * innerHeight, behavior: 'instant' }); }, [sel, off]); await sleep(900);
      }
      const u = await page.evaluate(() => { const v = document.querySelector('.film-loop'); return { paused: v.paused, poster: v.poster.split('/').pop(), ready: v.classList.contains('is-ready'), op: getComputedStyle(v).opacity }; });
      ok(u.paused && /poster/.test(u.poster) && u.ready && u.op === '1' && problems.length === 0, '[lite slučka] úsporný režim (play odmietnuté): ostáva plagát, bez chýb', JSON.stringify({ u, problems: problems.slice(0, 2) }));
      await ctx.close();
    }
    for (const [name, opt, q] of [['prefers-reduced-motion', { reducedMotion: 'reduce' }, ''], ['?film=on', {}, '?film=on']]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'dark', ...opt });
      const page = await ctx.newPage(); const reqs = [];
      page.on('request', (r) => reqs.push(r.url()));
      await page.goto(`${base}/index.html${q}`, { waitUntil: 'load', timeout: 60000 }); await sleep(800);
      const n = await page.evaluate(() => document.querySelectorAll('.film-loop').length);
      ok(n === 0 && !reqs.some((u) => /tim-slucka-864\\.(mp4|webm)/.test(u)), `[lite slučka] ${name}: žiadna slučka v zálohe`, JSON.stringify({ n }));
      await ctx.close();
    }
    {
      const ctx = await browser.newContext({ viewport: { width: 600, height: 900 }, colorScheme: 'dark' });
      const page = await ctx.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
      const cls = await page.evaluate(() => document.documentElement.className);
      ok(/(^|\\s)world(\\s|$)/.test(cls) && !/\\blite\\b/.test(cls),"""),
]
for a,b in rep:
    assert s.count(a)==1,a[:60]
    s=s.replace(a,b)
open(p,'w',encoding='utf-8').write(s)
