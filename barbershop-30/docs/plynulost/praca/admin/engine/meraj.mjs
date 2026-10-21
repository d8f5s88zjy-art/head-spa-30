// Meranie častí adminu HEAD SPA: CSS, HTML záložiek, JS po funkciách (zdroj aj gzip)
import fs from 'node:fs'; import zlib from 'node:zlib';
const src = fs.readFileSync(process.argv[2], 'utf8');
const gz = (s) => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
const B = (s) => Buffer.byteLength(s);
const css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const js = src.match(/<script>([\s\S]*?)<\/script>/)[1];
const head = src.slice(0, src.indexOf('<style>'));
const bodyHtml = src.slice(src.indexOf('</style>') + 8, src.indexOf('<script>'));
const r = (n, s) => console.log(n.padEnd(34), String(B(s)).padStart(7), 'B', String(gz(s)).padStart(6), 'gz');
r('celý súbor', src); r('head (bez style)', head); r('CSS', css); r('HTML (telo, záložky)', bodyHtml); r('JS', js);
// JS po blokoch oddelených komentármi /* ---------- názov ---------- */
console.log('\nJS po častiach:');
const parts = js.split(/(?=\/\* -{6,} [^*]+ -{6,} \*\/)/);
let acc = 0;
for (const p of parts) { const m = p.match(/\/\* -{6,} ([^*]+?) -{6,} \*\//); const n = m ? m[1].trim() : 'úvod (pomocníci, konštanty)'; acc += B(p); r('  ' + n, p); }
// JS po funkciách (vrchná úroveň: function x( / const x = / async function)
console.log('\nJS po funkciách (najväčšie):');
const fnRe = /^\s{2}(?:async\s+)?function\s+(\w+)|^\s{2}const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>/gm;
const idx = []; let m; while ((m = fnRe.exec(js))) idx.push({ name: m[1] || m[2], at: m.index });
const fns = idx.map((f, i) => ({ name: f.name, size: B(js.slice(f.at, idx[i + 1] ? idx[i + 1].at : js.length)), text: js.slice(f.at, idx[i + 1] ? idx[i + 1].at : js.length) }));
fns.sort((a, b) => b.size - a.size).slice(0, 40).forEach((f) => r('  ' + f.name, f.text));
// HTML po záložkách
console.log('\nHTML po záložkách:');
for (const s of bodyHtml.matchAll(/<section class="tab" id="p-(\w+)"[\s\S]*?<\/section>/g)) r('  ' + s[1], s[0]);
const login = bodyHtml.match(/<section id="login"[\s\S]*?<\/section>/)[0]; r('  login', login);
const bar = bodyHtml.match(/<div class="bar"[\s\S]*?<\/div><\/div>/)[0]; r('  lišta', bar);
// CSS po komentovaných častiach
console.log('\nCSS po častiach:');
for (const p of css.split(/(?=\n\/\* )/)) { const n = (p.match(/\/\* ([^*]+?) \*\//) || [, 'písma a základ'])[1]; r('  ' + n.slice(0, 32), p); }
