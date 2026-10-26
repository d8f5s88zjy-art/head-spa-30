#!/usr/bin/env node
// A3: dlhé úlohy hlavného vlákna (> 50 ms) s pôvodom zo záznamu výkonu Chromia (tracing), Chromium bez prepínačov.
//   node a3-dlhe-ulohy.mjs [--port=8883] [--cpu=4] [--stranka=index.html] [--behy=2] [--q=]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const ROOT = '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny', PORT = +(opt.port || 8883), CPU = +(opt.cpu || 4), S = opt.stranka || 'index.html', BEHY = +(opt.behy || 2), Q = opt.q ? '?' + opt.q : '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('python3', ['-I', '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/barbershop-30/${S}`)).ok) break; } catch (e) { await sleep(200); } }
const b = await chromium.launch({ headless: true });
try {
  for (let beh = 0; beh < BEHY; beh++) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, colorScheme: 'dark' });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await b.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'loading'] });
    await p.goto(`http://127.0.0.1:${PORT}/barbershop-30/${S}${Q}`, { waitUntil: 'load' });
    await sleep(8000);
    const buf = await b.stopTracing();
    const ev = JSON.parse(buf.toString()).traceEvents;
    const main = ev.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain' && ev.some((x) => x.pid === e.pid && x.name === 'ParseHTML'));
    const M = ev.filter((e) => e.pid === main.pid && e.tid === main.tid && e.ph === 'X');
    const nav = ev.find((e) => e.name === 'navigationStart' && e.pid === main.pid) || ev.find((e) => e.name === 'TracingStartedInBrowser');
    const t0 = nav ? nav.ts : M[0].ts;
    const fcpE = ev.find((e) => e.name === 'firstContentfulPaint' && e.pid === main.pid);
    const fcp = fcpE ? (fcpE.ts - t0) / 1000 : 0;
    const dlhe = M.filter((e) => e.name === 'RunTask' && e.dur > 50000).sort((a, c) => a.ts - c.ts);
    let tbt = 0;
    console.log(`\nbeh ${beh + 1} ${S}${Q} CPU ${CPU}× FCP ${Math.round(fcp)} ms, dlhých úloh ${dlhe.length}`);
    for (const t of dlhe) {
      const st = (t.ts - t0) / 1000, d = t.dur / 1000;
      tbt += Math.max(0, st + d - Math.max(st + 50, fcp));
      const vnut = M.filter((e) => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
      const sum = new Map();
      for (const e of vnut) {
        const url = e.args?.data?.url || e.args?.data?.scriptName || e.args?.data?.styleSheetUrl || e.args?.fileName || '';
        let k = e.name;
        if (/^(EvaluateScript|FunctionCall|v8\.compile|v8\.compileModule|v8\.evaluateModule|TimerFire|FireAnimationFrame|EventDispatch|v8\.callFunction|RunMicrotasks)$/.test(e.name)) k = `${e.name}${url ? ' ' + url.split('/').pop() : ''}${e.args?.data?.functionName ? ' ' + e.args.data.functionName : ''}`;
        else if (e.name === 'ParseAuthorStyleSheet') k = `${e.name} ${url.split('/').pop()}`;
        else if (!/^(ParseHTML|Layout|UpdateLayoutTree|Paint|PrePaint|Layerize|Decode Image|ImageDecodeTask|ParseAuthorStyleSheet|ScheduleStyleRecalculation|HitTest|IntersectionObserverController::computeIntersections|CommitLoad|Document::updateStyle|LocalFrameView::RunPostLifecycleSteps)$/.test(e.name)) continue;
        sum.set(k, (sum.get(k) || 0) + e.dur / 1000);
      }
      const top = [...sum].sort((a, c) => c[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${Math.round(v)}ms`).join('; ');
      console.log(`  ${Math.round(st)} ms +${Math.round(d)} ms: ${top}`);
    }
    console.log(`  TBT ${Math.round(tbt)} ms`);
    await ctx.close();
  }
} finally { await b.close(); srv.kill(); }
