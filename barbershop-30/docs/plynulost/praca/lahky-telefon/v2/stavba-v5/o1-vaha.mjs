// gzip (zlib úroveň 6) ako test 5; node o1-vaha.mjs <strom/barbershop-30>
import fs from 'node:fs'; import zlib from 'node:zlib';
const r = process.argv[2], g = (p) => zlib.gzipSync(fs.readFileSync(`${r}/${p}`), { level: 6 }).length;
const js = g('assets/recepcia.js'), css = g('assets/recepcia.css');
console.log(`js ${js} css ${css} sk ${g('assets/recepcia/sk.json')} spolu ${js + css + g('assets/recepcia/sk.json')} / 10240`);
for (const l of ['en', 'uk', 'hu', 'sr', 'pl', 'de', 'cs']) console.log(`${l} ${js + css + g(`assets/recepcia/${l}.json`)} / 12288`);
