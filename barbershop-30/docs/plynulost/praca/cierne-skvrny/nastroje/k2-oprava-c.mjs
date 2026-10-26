// K2: doplní opravu C (strih popredia na telefóne počíta v páse fotky) do opravenej kópie film.js.
// Použitie: node k2-oprava-c.mjs <film.js na úpravu>
import fs from 'fs';
const f = process.argv[2];
let s = fs.readFileSync(f, 'utf8');
const must = (t, a, b) => { if (!t.includes(a)) throw new Error('chýba: ' + a); if (t.split(a).length !== 2) throw new Error('viackrát: ' + a); return t.split(a).join(b); };
const R = [
  ['uLead: { value: 0.5 }, uRes:', 'uLead: { value: 0.5 }, uB: { value: 1 }, uRes:'],
  ['uniform float uMix, uAspect, uKind, uLead, uDbg;', 'uniform float uMix, uAspect, uKind, uLead, uDbg, uB;'],
  ['float u = dot(vUv - 0.5, md) + 0.5, w = dot(vUv - 0.5, pd) + 0.5, wF = dot(uFoc - 0.5, pd) + 0.5;',
    '// telefón na výšku: fotka je len v hornom páse textúry (uB výšky), pod ním je farba čistenia; predmet aj jeho hrana\n' +
    '          // sa rátajú v súradniciach pásu, inak by sa „predmetom“ stal prázdny pás pod fotkou (čierna cez celý obraz)\n' +
    '          vec2 vb = vec2(vUv.x, 1.0 - (1.0 - vUv.y) / uB), fb = vec2(uFoc.x, 1.0 - (1.0 - uFoc.y) / uB);\n' +
    '          float u = dot(vb - 0.5, md) + 0.5, w = dot(vb - 0.5, pd) + 0.5, wF = dot(fb - 0.5, pd) + 0.5, lead = dot(fb - 0.5, md) + 0.5;'],
  ['float L = mix(uLead, ', 'float L = mix(lead, '],
  ['k = (L - R) / max(uLead - R0, 0.05);', 'k = (L - R) / max(lead - R0, 0.05);'],
  ['vec4 o = textureLod(tA, ps, mix(6.5, g * ${F(CK.pf)}, inside));',
    'float lo = mix(6.5, g * ${F(CK.pf)}, inside);\n' +
    '          // vzorka predmetu ostáva v páse fotky, s rezervou podľa úrovne mipmapy (rozmazanie nesmie siahnuť pod pás)\n' +
    '          if (uB < 0.999) ps.y = max(1.0 - (1.0 - ps.y) * uB, 1.0 - uB + 1.5 * exp2(lo) / uRes.y);\n' +
    '          vec4 o = textureLod(tA, ps, lo);'],
  ['pu.uLead.value = 0.5 - (f1[0] - 0.5) * dS[0] - (f1[1] - 0.5) * dS[1];   // hrana predmetu v smere jeho letu (−smer kamery)',
    'pu.uLead.value = 0.5 - (f1[0] - 0.5) * dS[0] - (f1[1] - 0.5) * dS[1];   // hrana predmetu v smere jeho letu (−smer kamery)\n' +
    '      pu.uB.value = cut && cut.k === 4 ? Math.min((A && A.band) || 1, B.band || 1) : 1;   // pás fotky na telefóne (popredie)'],
];
for (const [a, b] of R) s = must(s, a, b);
fs.writeFileSync(f, s);
console.log('oprava C doplnená:', f);
