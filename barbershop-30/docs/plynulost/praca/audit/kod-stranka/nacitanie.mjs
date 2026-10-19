// Načítanie stránky na telefóne (CPU 4×, Fast 4G, bez dotyku) prvých 7 s: dlhé úlohy a z čoho sú, rozloženia nad 20 ms,
// kedy prišli písma (Resource Timing), LCP/FCP, posuny rozloženia.
import fs from 'fs';
import { opt, BASE, launch, open, sleep, traceStart, CATS } from './spolocne.mjs';
import { analyze, mainThread } from './analyza.mjs';
const browser = await launch();
const { page, cdp, ctx } = await open(browser, { cpu: Number(opt.cpu || 4), net: opt.net || 'fast4g', cache: false });
const stop = await traceStart(cdp, CATS);
await page.goto(BASE + '?' + (opt.q || 'uvod=off'), { waitUntil: 'commit' });
await sleep(Number(opt.ms || 7000));
const ev = await stop();
if (opt.save) { const zlib = await import('zlib'); fs.writeFileSync(new URL('./nacitanie-trace.json.gz', import.meta.url), zlib.gzipSync(JSON.stringify({ traceEvents: ev }))); }
const info = await page.evaluate(() => ({
  pisma: performance.getEntriesByType('resource').filter((r) => /woff2/.test(r.name)).map((r) => `${r.name.split('/').pop()} ${Math.round(r.responseEnd)} ms`),
  fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0),
}));
const nav = ev.find((e) => e.name === 'navigationStart' || e.name === 'NavigationTiming') ;
const mt = mainThread(ev);
let t0 = Infinity; for (const e of ev) if (e.name === 'navigationStart' && e.ts < t0) t0 = e.ts;
if (!isFinite(t0)) for (const e of ev) if (e.ph === 'X' && e.ts < t0) t0 = e.ts;
const res = analyze(ev, { from: t0 });
const lay = ev.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X' && (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.dur > 20000).map((e) => `${e.name} o ${Math.round((e.ts - t0) / 1000)} ms trvá ${Math.round(e.dur / 1000)} ms${e.args?.elementCount ? ' (' + e.args.elementCount + ' prvkov)' : ''}${e.args?.beginData?.stackTrace ? ' <- ' + e.args.beginData.stackTrace[0].url.split('/').pop() + ':' + e.args.beginData.stackTrace[0].functionName + ':' + e.args.beginData.stackTrace[0].lineNumber : ''}`);
console.log('FCP', info.fcp, 'ms; písma:', info.pisma.join(', '));
console.log('dlhé úlohy:'); for (const d of res.dlhe_ulohy) console.log('  ', d.ts, 'ms', d.ms, 'ms', d.parts.slice(0, 5).join(', '));
console.log('štýl/rozloženie > 20 ms:'); for (const l of lay) console.log('  ', l);
fs.writeFileSync(new URL(`./nacitanie-${(opt.q || 'uvod=off').replace(/[^a-z0-9]+/gi, '_')}.json`, import.meta.url), JSON.stringify({ info, dlhe: res.dlhe_ulohy, lay, vlakno: res.hlavne_vlakno_ms, skripty: res.skripty }, null, 1));
await ctx.close(); await browser.close();
