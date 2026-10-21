// Test adminu HEAD SPA bez GitHubu: api.github.com je podvrhnuté, súbory idú z lokálneho servera.
// Spustenie: python3 -m http.server 8940 v hs-tool, potom node mock-test.mjs
import { createRequire } from 'module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-tool';
const OUT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/admin/engine/snimky';
const ADMIN = 'http://localhost:8940/admin/';
const b = await chromium.launch();

// podvrh GitHub API: stav vetvy, súbory, bloby, strom, commit, posun vetvy
function mock(page, opts = {}) {
  const log = []; let refCalls = 0; const blobs = []; let tree = null; let patched = null;
  page.route('https://api.github.com/**', async (route) => {
    const req = route.request(); const u = new URL(req.url()); const p = u.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, ''); const m = req.method();
    log.push(m + ' ' + p + (u.search ? '?' + u.search.slice(1, 30) : ''));
    const json = (o, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o) });
    if (opts.offline) return route.abort('internetdisconnected');
    if (opts.status401) return json({ message: 'Bad credentials' }, 401);
    if (p === '' && m === 'GET') return json({ permissions: { push: true }, default_branch: 'main' });
    if (p.startsWith('/git/ref/heads/')) { refCalls++; return json({ object: { sha: opts.staleOnSave && refCalls > 1 ? 'def' : 'abc' } }); }
    if (p.startsWith('/git/commits/') && m === 'GET') return json({ tree: { sha: 't0' } });
    if (p.startsWith('/contents/')) {
      const rel = decodeURIComponent(p.slice('/contents/'.length)); const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) return json({ message: 'Not Found' }, 404);
      if (fs.statSync(abs).isDirectory()) return json(fs.readdirSync(abs).map((n) => ({ path: rel + '/' + n, type: fs.statSync(path.join(abs, n)).isDirectory() ? 'dir' : 'file' })));
      const buf = fs.readFileSync(abs); return json({ sha: 'f' + buf.length, encoding: 'base64', content: buf.toString('base64') });
    }
    if (p === '/git/blobs' && m === 'POST') { blobs.push(JSON.parse(req.postData())); return json({ sha: 'b' + blobs.length }); }
    if (p === '/git/trees' && m === 'POST') { tree = JSON.parse(req.postData()); return json({ sha: 't1' }); }
    if (p === '/git/commits' && m === 'POST') return json({ sha: 'c1' });
    if (p.startsWith('/git/refs/heads/') && m === 'PATCH') { if (opts.conflictOnPatch) return json({ message: 'Update is not a fast forward' }, 422); patched = JSON.parse(req.postData()); return json({ object: { sha: 'c1' } }); }
    return json({});
  });
  return { log, blobs, tree: () => tree, patched: () => patched };
}
async function login(page) {
  await page.goto(ADMIN, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('hs30.admin', 'github_pat_test'));
  const t0 = Date.now(); await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#app:not([hidden])', { timeout: 20000 }); return Date.now() - t0;
}
const msg = (page) => page.evaluate(() => { const a = document.querySelector('#saveMsg'); const l = document.querySelector('#loginMsg'); return [(a && !a.hidden ? a.innerText : ''), (l && !l.hidden ? l.innerText : '')].join(' | ').trim(); });

// 1) telefón: prihlásenie, záložky, zmena, zoznam zmien, uloženie
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  const M = mock(page);
  const ms = await login(page);
  console.log('P390 prihlásenie a načítanie ms', ms, '| volaní API pri štarte', M.log.length); console.log('  ', M.log.join('\n   '));
  const stav = await page.evaluate(() => ({ tabs: [...document.querySelectorAll('#tabs button')].map((e) => e.textContent.trim()), inputs: document.querySelectorAll('input,textarea,select').length, nodes: document.querySelectorAll('*').length, scrollH: document.documentElement.scrollHeight }));
  console.log('   stav', JSON.stringify(stav));
  await page.screenshot({ path: `${OUT}/p390-oznam.png` });
  for (const t of ['texty', 'ritualy', 'tim', 'hodiny', 'kontakt', 'platby']) { await page.click(`#tabs button[data-tab="${t}"]`); await page.waitForTimeout(300); if (t === 'ritualy') { await page.click('#ritList details.card >> nth=0 >> summary'); await page.waitForTimeout(300); } await page.screenshot({ path: `${OUT}/p390-${t}.png` }); }
  const tx = await page.evaluate(() => ({ bloky: document.querySelectorAll('#textList .blk').length, polia: document.querySelectorAll('#textList textarea').length, ritualy: document.querySelectorAll('#ritList .card').length, nodes: document.querySelectorAll('*').length }));
  console.log('   texty: blokov', tx.bloky, 'polí', tx.polia, '| rituálov', tx.ritualy, '| uzlov DOM', tx.nodes);
  // zmena ceny prvého rituálu + oznam, zoznam zmien, uloženie
  await page.click('#tabs button[data-tab="ritualy"]'); await page.waitForTimeout(200);
  const price = page.locator('#ritList details.card >> nth=0 >> input[type=number] >> nth=1'); const old = await price.inputValue(); await price.fill(String(+old + 1));
  await page.click('#tabs button[data-tab="oznam"]'); await page.fill('#ozBox textarea >> nth=0', 'Od 4. do 11. augusta máme dovolenku.');
  await page.waitForTimeout(200); await page.click('#count'); await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/p390-zmeny.png` });
  console.log('   lišta:', await page.evaluate(() => document.querySelector('#bar').innerText.replace(/\n+/g, ' | ')));
  const n0 = M.log.length; await page.click('#ulozit'); await page.waitForFunction(() => /Uložené|Neuložené|zastavilo|inde/.test((document.querySelector('#saveMsg') || {}).innerText || ''), null, { timeout: 20000 });
  console.log('   po uložení:', await msg(page)); console.log('   volaní API pri uložení', M.log.length - n0, '| blobov', M.blobs.length, '| strom:', JSON.stringify((M.tree() || {}).tree?.map((t) => t.path)), '| posun vetvy:', JSON.stringify(M.patched()));
  await page.screenshot({ path: `${OUT}/p390-ulozene.png` });
  console.log('   chyby stránky:', errs);
  await ctx.close();
}
// 2) počítač: texty, rituály
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); mock(page);
  await login(page); await page.click('#tabs button[data-tab="texty"]'); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/d1440-texty.png` });
  await page.click('#tabs button[data-tab="ritualy"]'); await page.click('#ritList details.card >> nth=0 >> summary'); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/d1440-ritualy.png` });
  await page.click('#tabs button[data-tab="tim"]'); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/d1440-tim.png` });
  await ctx.close();
}
// 3) konflikt: main sa medzitým posunul (ref vráti iný sha pri ukladaní)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); const M = mock(page, { staleOnSave: true });
  await login(page); await page.fill('#ozBox textarea >> nth=0', 'Test konfliktu'); await page.waitForTimeout(200); await page.click('#ulozit');
  await page.waitForFunction(() => /Uložené|Neuložené|inde|znova/.test((document.querySelector('#saveMsg') || {}).innerText || ''), null, { timeout: 20000 });
  console.log('KONFLIKT (stale sha):', await msg(page)); console.log('   hodnota poľa po konflikte:', await page.inputValue('#ozBox textarea >> nth=0'), '| volaní', M.log.length);
  await page.screenshot({ path: `${OUT}/p390-konflikt.png` });
  await ctx.close();
}
// 4) 422 pri posune vetvy
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); mock(page, { conflictOnPatch: true });
  await login(page); await page.fill('#ozBox textarea >> nth=0', 'Test 422'); await page.waitForTimeout(200); await page.click('#ulozit');
  await page.waitForFunction(() => /Uložené|Neuložené|inde|znova/.test((document.querySelector('#saveMsg') || {}).innerText || ''), null, { timeout: 20000 });
  console.log('KONFLIKT (422 pri PATCH):', await msg(page));
  await ctx.close();
}
// 5) 401 a sieť preč pri prihlásení
for (const o of [{ status401: true }, { offline: true }]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); mock(page, o);
  await page.goto(ADMIN, { waitUntil: 'domcontentloaded' }); await page.evaluate(() => localStorage.setItem('hs30.admin', 'github_pat_test')); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1200);
  console.log(JSON.stringify(o), '→', await msg(page), '| kľúč ostal v localStorage:', await page.evaluate(() => !!localStorage.getItem('hs30.admin')));
  await page.screenshot({ path: `${OUT}/p390-${o.status401 ? '401' : 'offline'}.png` });
  await ctx.close();
}
// 6) sieť preč pri ukladaní
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); const M = mock(page);
  await login(page); await page.fill('#ozBox textarea >> nth=0', 'Test offline'); await page.waitForTimeout(200);
  await page.unroute('https://api.github.com/**'); await page.route('https://api.github.com/**', (r) => r.abort('internetdisconnected'));
  await page.click('#ulozit'); await page.waitForFunction(() => /Uložené|Neuložené|spojiť/.test((document.querySelector('#saveMsg') || {}).innerText || ''), null, { timeout: 20000 });
  console.log('OFFLINE pri ukladaní:', await msg(page), '| pole ostalo:', await page.inputValue('#ozBox textarea >> nth=0'));
  await ctx.close();
}
await b.close();
