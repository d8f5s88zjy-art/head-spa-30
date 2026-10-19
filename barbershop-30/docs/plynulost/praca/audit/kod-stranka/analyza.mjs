// Rozbor trace hlavného vlákna stránky: dlhé úlohy a z čoho sú, prepočty štýlu (počet prvkov a čo ich spustilo),
// vynútené rozloženie zo skriptu (so zásobníkom), kreslenie (Paint) podľa prvku, rasterizácia a dekódovanie obrázkov
// na všetkých vláknach, skript podľa súboru a funkcie.
const pct = (arr, p) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const r1 = (v) => Math.round(v * 10) / 10;

export function threads(events) {
  const names = new Map();
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args.name);
  return names;
}

export function mainThread(events) {
  const names = threads(events);
  const cnt = new Map();
  for (const e of events) {
    const k = `${e.pid}:${e.tid}`;
    if (names.get(k) === 'CrRendererMain') cnt.set(k, (cnt.get(k) || 0) + 1);
  }
  return [...cnt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

// hlavné X udalosti s potomkami (podľa vnorenia v čase)
function nest(evs) {
  const out = []; const stack = [];
  for (const e of evs) {
    while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) stack.pop();
    e.children = [];
    e.parent = stack[stack.length - 1] || null;
    if (e.parent) e.parent.children.push(e); else out.push(e);
    stack.push(e);
  }
  return out;
}

const label = (e) => {
  const d = e.args?.data || {};
  if (e.name === 'FunctionCall') return `FunctionCall ${(d.url || '').split('/').pop()}:${d.functionName || '?'}:${d.lineNumber ?? '?'}`;
  if (e.name === 'EvaluateScript' || e.name === 'v8.compileModule' || e.name === 'v8.evaluateModule') return `${e.name} ${(d.url || e.args?.fileName || '').split('/').pop()}`;
  if (e.name === 'EventDispatch') return `EventDispatch ${d.type}`;
  if (e.name === 'TimerFire') return 'TimerFire';
  if (e.name === 'ParseAuthorStyleSheet') return `ParseAuthorStyleSheet ${(d.styleSheetUrl || '').split('/').pop()}`;
  return e.name;
};

export function analyze(events, { from = 0, to = Infinity } = {}) {
  const mt = mainThread(events);
  const names = threads(events);
  const inWin = (e) => e.ts >= from && e.ts <= to;
  const main = events.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X' && inWin(e)).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const top = nest(main);
  const tasks = top.filter((e) => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask');
  const all = main;
  const span = (to === Infinity ? (main.length ? main[main.length - 1].ts - main[0].ts : 1) : to - from) / 1000;

  // dlhé úlohy a ich zloženie (potomkovia do hĺbky 3, súčet podľa menovky)
  const long = tasks.filter((t) => t.dur > 50000).map((t) => {
    const parts = new Map();
    const walk = (e, d) => { for (const c of e.children) { if (['FunctionCall', 'EvaluateScript', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'ParseHTML', 'Decode Image', 'ParseAuthorStyleSheet', 'v8.compileModule', 'v8.evaluateModule', 'MajorGC', 'MinorGC', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR', 'HitTest', 'IntersectionObserverController::computeIntersections', 'UpdateLayer', 'ScrollLayer', 'PaintImage', 'ImageDecodeTask', 'Decode LazyPixelRef', 'MarkLoad', 'ResourceReceivedData', 'FireAnimationFrame', 'EventDispatch', 'TimerFire'].includes(c.name)) { const k = label(c); parts.set(k, (parts.get(k) || 0) + c.dur / 1000); } if (d < 3) walk(c, d + 1); } };
    walk(t, 0);
    return { ts: r1((t.ts - from) / 1000), ms: r1(t.dur / 1000), parts: [...parts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${r1(v)}`) };
  });

  // prepočty štýlu
  const ult = all.filter((e) => e.name === 'UpdateLayoutTree');
  const counts = ult.map((e) => e.args?.elementCount ?? e.args?.data?.elementCount ?? 0);
  const bigUlt = ult.filter((e) => (e.args?.elementCount || 0) >= 200).map((e) => ({ ts: r1((e.ts - from) / 1000), ms: r1(e.dur / 1000), prvkov: e.args.elementCount, js: stackTop(e) }));

  // vynútené rozloženie / štýl zo skriptu (udalosť má zásobník JS alebo je vnorená vo FunctionCall)
  const forced = new Map();
  for (const e of all) {
    if (e.name !== 'Layout' && e.name !== 'UpdateLayoutTree') continue;
    let p = e.parent, inJs = false;
    while (p) { if (['FunctionCall', 'EvaluateScript', 'TimerFire', 'EventDispatch', 'FireAnimationFrame', 'v8.evaluateModule', 'FireIdleCallback'].includes(p.name)) { inJs = true; break; } p = p.parent; }
    if (!inJs) continue;
    const k = `${e.name} <- ${stackTop(e) || label(p)}`;
    const v = forced.get(k) || { n: 0, ms: 0 }; v.n++; v.ms += e.dur / 1000; forced.set(k, v);
  }

  // kreslenie podľa prvku (nodeId sa doplní mimo, describeNode)
  const paints = all.filter((e) => e.name === 'Paint');
  const paintByNode = new Map();
  for (const e of paints) { const id = e.args?.data?.nodeId ?? 'x'; const v = paintByNode.get(id) || { n: 0, ms: 0, area: 0 }; v.n++; v.ms += e.dur / 1000; const c = e.args?.data?.clip; if (c && c.length === 8) v.area += Math.abs((c[2] - c[0]) * (c[5] - c[1])); paintByNode.set(id, v); }

  // skript podľa funkcie (najvyššie FunctionCall)
  const scripts = new Map();
  for (const e of all) { if (e.name !== 'FunctionCall') continue; let p = e.parent, nested = false; while (p) { if (p.name === 'FunctionCall') { nested = true; break; } p = p.parent; } if (nested) continue; const k = label(e); const v = scripts.get(k) || { n: 0, ms: 0, max: 0 }; v.n++; v.ms += e.dur / 1000; v.max = Math.max(v.max, e.dur / 1000); scripts.set(k, v); }

  // ostatné vlákna: raster, dekódovanie
  const other = events.filter((e) => e.ph === 'X' && inWin(e) && `${e.pid}:${e.tid}` !== mt);
  const byThread = (nm) => { const m = new Map(); for (const e of other) { if (!nm.includes(e.name)) continue; const t = names.get(`${e.pid}:${e.tid}`) || `${e.pid}:${e.tid}`; const v = m.get(t) || { n: 0, ms: 0, max: 0 }; v.n++; v.ms += e.dur / 1000; v.max = Math.max(v.max, e.dur / 1000); m.set(t, v); } return Object.fromEntries([...m.entries()].map(([k, v]) => [k, { n: v.n, ms: r1(v.ms), max: r1(v.max) }])); };
  const decodeMain = all.filter((e) => /Decode/.test(e.name));

  const sum = (nm) => r1(all.filter((e) => e.name === nm && !(e.parent && e.parent.name === nm)).reduce((a, e) => a + e.dur / 1000, 0));
  return {
    okno_s: r1(span),
    ulohy: tasks.length,
    dlhe_ulohy: long,
    hlavne_vlakno_ms: { spolu: r1(tasks.reduce((a, t) => a + t.dur / 1000, 0)), skript: sum('FunctionCall'), styl: sum('UpdateLayoutTree'), layout: sum('Layout'), prepaint: sum('PrePaint'), paint: sum('Paint'), layerize: sum('Layerize'), commit: sum('Commit'), dekodovanie: r1(decodeMain.reduce((a, e) => a + e.dur / 1000, 0)) },
    styl_prepocty: { n: ult.length, prvkov_p50: pct(counts, 0.5), prvkov_p95: pct(counts, 0.95), prvkov_max: counts.reduce((a, b) => Math.max(a, b), 0), velke: bigUlt.slice(0, 30) },
    vynutene: [...forced.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 15).map(([k, v]) => ({ k, n: v.n, ms: r1(v.ms) })),
    paint: { n: paints.length, ms: r1(paints.reduce((a, e) => a + e.dur / 1000, 0)), podla_uzla: [...paintByNode.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 12).map(([id, v]) => ({ nodeId: id, n: v.n, ms: r1(v.ms), plocha_kpx: Math.round(v.area / 1000) })) },
    skripty: [...scripts.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 15).map(([k, v]) => ({ k, n: v.n, ms: r1(v.ms), max: r1(v.max) })),
    raster: byThread(['RasterTask']),
    dekod_vlakna: byThread(['Decode Image', 'ImageDecodeTask', 'Decode LazyPixelRef', 'ImageFrameGenerator::decode', 'ImageFrameGenerator::decodeAndScale']),
    dekod_hlavne: decodeMain.length ? { n: decodeMain.length, ms: r1(decodeMain.reduce((a, e) => a + e.dur / 1000, 0)), max: r1(decodeMain.reduce((a, e) => Math.max(a, e.dur / 1000), 0)) } : null,
  };
}

function stackTop(e) {
  const st = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace || e.args?.stackTrace;
  if (!st || !st.length) return '';
  const f = st[0];
  return `${(f.url || '').split('/').pop()}:${f.functionName || '(anon)'}:${f.lineNumber ?? -1}`;
}

// zneplatnenia štýlu (invalidationTracking): čo zmenilo triedu/atribút a koľko uzlov tým zasiahlo
export function invalidations(events, { from = 0, to = Infinity } = {}) {
  const mt = mainThread(events);
  const ev = events.filter((e) => `${e.pid}:${e.tid}` === mt && e.ts >= from && e.ts <= to && /InvalidationTracking/.test(e.name));
  const sched = new Map(), recalc = new Map();
  for (const e of ev) {
    const d = e.args?.data || {};
    if (e.name === 'ScheduleStyleInvalidationTracking') {
      const what = d.changedAttribute ? `@${d.changedAttribute}` : d.changedClass ? `.${d.changedClass}` : d.changedPseudo ? `:${d.changedPseudo}` : d.changedId ? `#${d.changedId}` : '?';
      const k = `${d.nodeName || '?'} ${what}`;
      sched.set(k, (sched.get(k) || 0) + 1);
    } else if (e.name === 'StyleRecalcInvalidationTracking' || e.name === 'StyleInvalidatorInvalidationTracking') {
      const k = `${e.name.replace('InvalidationTracking', '')} ${d.reason || ''} ${(d.extraData || d.changedAttribute || '').toString().slice(0, 40)}`;
      recalc.set(k, (recalc.get(k) || 0) + 1);
    }
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => `${n}× ${k}`);
  return { naplanovane: top(sched), prepocet: top(recalc), n: ev.length };
}

// rozklad úloh s vykreslením (PrePaint/Commit) na časti; percentily cez snímky
export function frameBreakdown(events) {
  const mt = mainThread(events);
  const X = events.filter((e) => `${e.pid}:${e.tid}` === mt && e.ph === 'X').sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const tasks = X.filter((e) => e.name === 'RunTask');
  const K = ['FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'Commit', 'HitTest', 'IntersectionObserverController::computeIntersections'];
  const frames = []; let j = 0;
  for (const t of tasks) {
    while (j < X.length && X[j].ts < t.ts) j++;
    const parts = Object.fromEntries(K.map((k) => [k, 0])); let isFrame = false;
    for (let i = j; i < X.length && X[i].ts < t.ts + t.dur; i++) { const e = X[i]; if (e === t) continue; if (e.name === 'PrePaint' || e.name === 'Commit') isFrame = true; if (K.includes(e.name)) parts[e.name] += e.dur / 1000; }
    if (isFrame) frames.push({ ms: t.dur / 1000, ...parts });
  }
  const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] || 0; };
  const out = { n: frames.length, nad16_pct: +(100 * frames.filter((f) => f.ms > 16.7).length / Math.max(1, frames.length)).toFixed(1), nad50: frames.filter((f) => f.ms > 50).length };
  for (const k of ['ms', ...K]) { const v = frames.map((f) => f[k]); out[k === 'ms' ? 'spolu' : k.replace('IntersectionObserverController::computeIntersections', 'IO')] = { p50: +q(v, 0.5).toFixed(2), p95: +q(v, 0.95).toFixed(2), avg: +(v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)).toFixed(2) }; }
  return out;
}
