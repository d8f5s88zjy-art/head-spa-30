// Profil JS pri načítaní (CPU 4×): čas vo funkciách app.js, film.js, vernost.js do 2,5 s (vlastný čas podľa vzoriek)
import { BASE, launch, open, sleep } from './spolocne.mjs';
const browser = await launch();
const agg = new Map();
for (let run = 0; run < 3; run++) {
  const { page, cdp, ctx } = await open(browser, { cpu: 4, net: 'fast4g', cache: false });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await page.goto(BASE + '?uvod=off', { waitUntil: 'commit' });
  await sleep(2500);
  const { profile } = await cdp.send('Profiler.stop');
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const dt = profile.timeDeltas; const self = new Map();
  profile.samples.forEach((id, i) => { self.set(id, (self.get(id) || 0) + (dt[i] || 0)); });
  for (const [id, us] of self) { const n = byId.get(id); const cf = n.callFrame; const file = cf.url.split('/').pop() || '(' + cf.functionName + ')'; const k = `${file}:${cf.functionName || '(anon)'}:${cf.lineNumber + 1}`; agg.set(k, (agg.get(k) || 0) + us / 3000); }
  await ctx.close();
}
await browser.close();
const rows = [...agg.entries()].filter(([k]) => /app\.js|film\.js|vernost\.js|i18n|atmosfera|recenzie|\(garbage|\(program|\(idle/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log('vlastný čas (ms, priemer z 3 behov, CPU 4×) do 2,5 s od navigácie:');
for (const [k, v] of rows) console.log(`  ${v.toFixed(1).padStart(7)}  ${k}`);
const sum = (re) => [...agg.entries()].filter(([k]) => re.test(k)).reduce((a, [, v]) => a + v, 0).toFixed(1);
console.log('spolu app.js', sum(/^app\.js/), 'film.js', sum(/^film\.js/), 'vernost.js', sum(/^vernost\.js/));
