import { readFileSync } from 'node:fs';
const [root, l, q] = process.argv.slice(2);
const { odpovedz } = await import(root + '/assets/recepcia.js?' + Date.now());
const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
const r = odpovedz(q, kb);
console.log(r.typ, r.id, r.sluzba || '', Array.isArray(r.p) ? r.p.map((x) => x.id) : '');
