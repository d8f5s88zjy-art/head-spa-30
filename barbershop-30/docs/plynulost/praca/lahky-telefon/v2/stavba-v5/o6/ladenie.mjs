// ladenie: node ladenie.mjs <modul.js> <jazyk> <otázka>
import { readFileSync } from 'node:fs';
const [mod, l, q] = process.argv.slice(2);
const { odpovedz } = await import(mod);
const kb = JSON.parse(readFileSync(`/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-recepcia/barbershop-30/assets/recepcia/${l}.json`, 'utf8'));
const r = odpovedz(q, kb);
console.log(r.typ, r.id, r.skore, Array.isArray(r.p) ? r.p.map((x) => x.id) : '');
