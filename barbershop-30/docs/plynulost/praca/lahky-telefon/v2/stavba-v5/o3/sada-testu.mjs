// vypíše SADA a OTAZKY_JAZYK z testu ako riadky "jazyk|otázka|očakávané" (bez spustenia testov)
import { readFileSync } from 'node:fs';
const src = readFileSync(process.argv[2], 'utf8');
const vyrez = (od, po) => src.slice(src.indexOf(od), src.indexOf(po, src.indexOf(od)));
const SADA = eval(vyrez('const SADA = [', '];\n') .replace('const SADA = ', '') + ']');
const OJ = eval('(' + vyrez('const OTAZKY_JAZYK = {', '};\n').replace('const OTAZKY_JAZYK = ', '') + '})');
for (const [q, oc] of SADA) console.log(`sk|${q}|${[].concat(oc).join(',')}`);
for (const [l, a] of Object.entries(OJ)) for (const [q, oc] of a) console.log(`${l}|${q}|${[].concat(oc).join(',')}`);
