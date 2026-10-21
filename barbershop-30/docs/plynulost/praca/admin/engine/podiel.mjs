// Podiel kódu adminu HEAD SPA: jadro (prenositeľné) vs. kód špecifický pre web HEAD SPA, podľa funkcií a blokov
import fs from 'node:fs'; import zlib from 'node:zlib';
const src = fs.readFileSync(process.argv[2], 'utf8'); const js = src.match(/<script>([\s\S]*?)<\/script>/)[1];
const B = (s) => Buffer.byteLength(s); const gz = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
const fnRe = /^\s{2}(?:async\s+)?function\s+(\w+)|^\s{2}const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>/gm;
const idx = []; let m; while ((m = fnRe.exec(js))) idx.push({ name: m[1] || m[2], at: m.index });
const fns = {}; idx.forEach((f, i) => { fns[f.name] = js.slice(f.at, idx[i + 1] ? idx[i + 1].at : js.length); });
const JADRO = ['gh', 'human', 'b64dec', 'b64enc', 'readFile', 'commit', 'load', 'snapshot', 'reapply', 'login', 'save', 'msg', 'quiet',
  'reg', 'valOf', 'changed', 'bind', 'mark', 'markStale', 'staleUpdate', 'grow', 'field', 'trField', 'trDetails', 'trRows', 'collect', 'refresh', 'fitBar', 'buildTabs', 'show', 'focusTarget', 'renderChipsState',
  'norm', 'esc', 'escA', 'reEsc', 'dec', 'decAttr', 'short', 'plain', 'same', 'clone', 'safeJson', 'hm', 'fromHm', 'isHttps', 'slugify', 'plural', 'h', 'scan', 'at', 'cls', 'setKey', 'renameKey', 'i18nText', 'i18nLines', 'splitPara', 'splitLines'];
const FOTKA = ['openCropper', 'encodePhoto'];
const TEXTY = ['sectionOf', 'skipText', 'kindOf', 'parseTexts', 'renderTexty', 'fixedWhy', 'blockEditor', 'filterTexts'];
let j = '', f = '', t = '', s = ''; const spec = [];
for (const [n, body] of Object.entries(fns)) { if (JADRO.includes(n)) j += body; else if (FOTKA.includes(n)) f += body; else if (TEXTY.includes(n)) t += body; else { s += body; spec.push(n); } }
const rest = js.length - Object.values(fns).reduce((a, x) => a + x.length, 0);
const r = (n, x) => console.log(n.padEnd(46), String(B(x)).padStart(6), 'B', String(gz(x)).padStart(6), 'gz', String(Math.round(100 * B(x) / B(js))).padStart(3) + ' %');
r('jadro (GitHub, polia, lišta, záložky, pomocníci)', j); r('fotka: výrez a kódovanie (prenositeľné)', f); r('záložka Texty (skener HTML, časti HEAD SPA)', t); r('špecifické pre HEAD SPA (' + spec.length + ' funkcií)', s);
console.log('  špecifické:', spec.join(', ')); console.log('  mimo funkcií (konštanty, registrácie udalostí) B', rest);
