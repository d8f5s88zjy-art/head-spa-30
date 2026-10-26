#!/usr/bin/env node
// K2 – statická kontrola kódu filmu (assets/film.js + style.css) na cesty, ktorými sa na plátne môže objaviť čierna.
// Použitie: node k2-staticka.mjs [koreň barbershop-30] [--json]
//   predvolený koreň: worktree hs-skvrny/barbershop-30
// Výstup: riadky "OK|CHYBA|POZOR  kód  popis  (súbor:riadok)"; návratový kód 1, keď je aspoň jedna CHYBA.
// CHYBA = cesta, ktorá preukázateľne dáva čierne škvrny (alebo poistka chýba); POZOR = riziko na sledovanie.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const ROOT = args.find((a) => !a.startsWith('--')) ||
  '/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/hs-skvrny/barbershop-30';
const FILM = path.join(ROOT, 'assets/film.js');
const CSS = path.join(ROOT, 'assets/style.css');
const src = fs.readFileSync(FILM, 'utf8');
const css = fs.existsSync(CSS) ? fs.readFileSync(CSS, 'utf8') : '';
const out = [];
const lineOf = (text, idx) => text.slice(0, Math.max(0, idx)).split('\n').length;
const at = (re, text = src, file = 'assets/film.js') => { const m = re.exec(text); return m ? `${file}:${lineOf(text, m.index)}` : `${file}:?`; };
const add = (stav, kod, popis, kde) => out.push({ stav, kod, popis, kde });

// šablóna shadera v JS: const NAME = `...`;  (alebo fragmentShader: `...`)
function tpl(name) {
  const re = new RegExp('const\\s+' + name + '\\s*=\\s*`([\\s\\S]*?)`;');
  const m = re.exec(src); return m ? { body: m[1], idx: m.index } : null;
}
function postFrag() {
  const i = src.indexOf('const post = new THREE.Mesh');
  if (i < 0) return null;
  const j = src.indexOf('fragmentShader: `', i); const k = src.indexOf('`,', j + 17);
  return j > 0 && k > j ? { body: src.slice(j + 17, k), idx: j } : null;
}
// hodnota alfy v zápisoch gl_FragColor = vec4(..., X)  (posledný argument na najvyššej úrovni)
function alphaArgs(glsl) {
  const res = [];
  const re = /gl_FragColor\s*=\s*vec4\s*\(/g; let m;
  while ((m = re.exec(glsl))) {
    let d = 1, i = re.lastIndex, last = i;
    for (; i < glsl.length && d > 0; i++) {
      const ch = glsl[i];
      if (ch === '(') d++; else if (ch === ')') d--; else if (ch === ',' && d === 1) last = i + 1;
    }
    res.push({ arg: glsl.slice(last, i - 1).trim(), idx: m.index });
  }
  return res;
}

/* ---- K2-01: alfa v priamom prechode na obrazovku (hlavná príčina škvŕn) ----
   Záber sa bez prelínania kreslí rovno do plátna shaderom FRAG (uVig.w = 1). Keď FRAG zapíše do alfy hĺbku (vZ),
   dostane plátno alfu 0 všade, kde je hĺbková mapa 0 (najvzdialenejšie miesta). alpha:false to v Chromiu skryje,
   Safari (záznam majiteľa) tieto pixely ukáže čierne. Poistka: v priamom prechode alfa 1.0, alebo colorMask(…, false). */
const F = tpl('FRAG');
const colorMaskGuard = /colorMask\s*\(\s*true\s*,\s*true\s*,\s*true\s*,\s*false\s*\)/.test(src);
if (!F) add('CHYBA', 'K2-01', 'nenašiel sa fragment shader FRAG (const FRAG = `…`)', 'assets/film.js:?');
else {
  const al = alphaArgs(F.body);
  const forced = /if\s*\(\s*uVig\.w\s*>\s*0\.5\s*\)\s*gl_FragColor\.a\s*=\s*1\.0/.test(F.body);
  const bad = al.filter((a) => !/^1(\.0*)?$/.test(a.arg) && !/uVig\.w/.test(a.arg));
  const where = `assets/film.js:${lineOf(src, src.indexOf(F.body) + (al[0] ? al[0].idx : 0))}`;
  if (!al.length) add('CHYBA', 'K2-01', 'FRAG nezapisuje gl_FragColor', where);
  else if (bad.length && !forced && !colorMaskGuard)
    add('CHYBA', 'K2-01', `priamy prechod na obrazovku píše do alfy plátna „${bad.map((b) => b.arg).join(' | ')}“ (hĺbka); kde je hĺbka 0, je alfa 0 → Safari čierne škvrny. Oprava: alfa 1.0, keď uVig.w > 0.5`, where);
  else add('OK', 'K2-01', 'priamy prechod píše alfu 1 (alebo je alfa plátna zamaskovaná colorMask)', where);
  // FRAG_SEQ vzniká z FRAG cez replace: nesmie prepísať zápis alfy
  const seq = /const\s+FRAG_SEQ\s*=\s*FRAG\.replace\(([\s\S]*?)\);/.exec(src);
  if (seq && /gl_FragColor/.test(seq[1])) add('CHYBA', 'K2-01b', 'FRAG_SEQ prepisuje zápis gl_FragColor (poistka alfy by neplatila pre sekvencie)', at(/const\s+FRAG_SEQ/));
  else if (seq) add('OK', 'K2-01b', 'FRAG_SEQ dedí zápis alfy z FRAG (replace mení len vzorkovanie)', at(/const\s+FRAG_SEQ/));
}
// všetky ostatné shadery, ktoré kreslia do plátna: prechod (post) musí písať alfu 1
const P = postFrag();
if (P) {
  const al = alphaArgs(P.body), bad = al.filter((a) => !/^1(\.0*)?$/.test(a.arg));
  add(bad.length ? 'CHYBA' : 'OK', 'K2-02', bad.length ? `prechod (post) píše alfu „${bad.map((b) => b.arg).join(' | ')}“` : `prechod (post) píše vždy alfu 1.0 (${al.length}×)`, `assets/film.js:${lineOf(src, P.idx)}`);
} else add('POZOR', 'K2-02', 'shader prechodu (post) sa nenašiel', 'assets/film.js:?');

/* ---- K2-03: kontext plátna ---- */
const rend = /new THREE\.WebGLRenderer\(\{([^}]*)\}/.exec(src);
if (rend) {
  const o = rend[1], w = `assets/film.js:${lineOf(src, rend.index)}`;
  const alpha = /alpha:\s*(true|false)/.exec(o), pma = /premultipliedAlpha:\s*(true|false)/.exec(o), pres = /preserveDrawingBuffer:\s*true/.test(o);
  if (alpha && alpha[1] === 'true') add('CHYBA', 'K2-03', 'WebGLRenderer alpha:true – plátno je priehľadné, každá alfa < 1 presvitne na podklad (--ink)', w);
  else add('POZOR', 'K2-03', 'alpha:false: Chromium alfu zahodí, ale Safari (WebKit) sa na to nedá spoliehať – preto musí platiť K2-01', w);
  if (pma && pma[1] === 'false') add('POZOR', 'K2-03b', 'premultipliedAlpha:false mení skladanie plátna v Safari', w);
  if (pres) add('POZOR', 'K2-03c', 'preserveDrawingBuffer:true – pamäť a výkon na telefóne', w);
  if (!/depth:\s*true/.test(o)) add('CHYBA', 'K2-03d', 'plátno bez hĺbkového bufferu: mriežka sa prekrýva sama so sebou', w);
}

/* ---- K2-04: farba čistenia (to, čo je vidieť v každej diere) ---- */
const cc = /setClearColor\(\s*([^,)]+)\s*(?:,\s*([^)]+))?\)/.exec(src);
if (!cc) add('POZOR', 'K2-04', 'setClearColor chýba (diery by boli čierne 0,0,0)', 'assets/film.js:?');
else {
  const a = cc[2] ? parseFloat(cc[2]) : 1;
  if (!(a >= 1)) add('CHYBA', 'K2-04', `setClearColor s alfou ${cc[2]} – vyčistené miesta majú alfu < 1`, at(/setClearColor/));
  else add('POZOR', 'K2-04', `farba čistenia ${cc[1].trim()} (--ink, takmer čierna): každá diera v mriežke by bola čierna; pokusom „diery“ overené 0 nepokrytých pixelov`, at(/setClearColor/));
}
if (/setClearAlpha\(\s*0/.test(src)) add('CHYBA', 'K2-04b', 'setClearAlpha(0)', at(/setClearAlpha/));

/* ---- K2-05: strany trojuholníkov mriežky ---- */
const sm = /s\.mat\s*=\s*new THREE\.ShaderMaterial\(\{([\s\S]*?)\}\);/.exec(src);
if (sm) {
  const side = /side:\s*THREE\.(\w+)/.exec(sm[1]);
  if (side && side[1] === 'BackSide') add('CHYBA', 'K2-05', 'mriežka záberu side: BackSide – fotka by sa nekreslila', at(/s\.mat\s*=\s*new THREE\.ShaderMaterial/));
  else add('OK', 'K2-05', `mriežka záberu side: ${side ? side[1] : 'FrontSide (predvolené)'}; súvislá výšková plocha má v obryse vždy prednú stranu (pokus „rub“: odvrátená strana nikde nie je vidieť)`, at(/s\.mat\s*=\s*new THREE\.ShaderMaterial/));
}
if (/\bdiscard\b/.test(src)) add('CHYBA', 'K2-05b', 'shader obsahuje discard – zahodené fragmenty ukážu farbu čistenia', at(/\bdiscard\b/));
else add('OK', 'K2-05b', 'žiadny discard v shaderoch', 'assets/film.js');

/* ---- K2-06: blízka rovina kamery a posun hĺbky ---- */
const cam = /new THREE\.PerspectiveCamera\(\s*FOV\s*,\s*1\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/.exec(src);
const num = (re, i = 1) => { const m = re.exec(src); return m ? parseFloat(m[i]) : NaN; };
const DIST = num(/DIST\s*=\s*([\d.]+)/), AMTd = num(/const AMT = phone \? ([\d.]+) : ([\d.]+)/, 2);
const ampMax = Math.max(0.1, num(/amp:\s*([\d.]+)\s*\}\s*$/m) || 0, ...[...src.matchAll(/amp:\s*([\d.]+)/g)].map((m) => +m[1]));
const nz = Math.max(...[...src.matchAll(/nz:\s*([\d.]+)/g)].map((m) => +m[1]));
const zFwd = Math.max(...[...src.matchAll(/\[\[[^\]]*\],\s*\[[^\]]*,\s*(-[\d.]+)\]\]/g)].map((m) => -m[1]));
if (cam) {
  const near = +cam[1];
  // najbližší vrchol (hĺbka 1) je vo svete na z = DIST·(AMT + amp·mix); kamera na DIST·(1 − pohyb záberu − drift − posun strihu).
  // Odchádzajúci záber nájazdu sa kreslí najviac do mix ≈ 0,61 (t0 0,39 + 0,14 + 0,08), potom ho vystrieda prichádzajúci.
  const walk = Math.max(...[...src.matchAll(/walk:\s*([\d.]+)/g)].map((m) => +m[1]));
  const xN = 0.61, drift = 0.022;
  const cases = [
    ['bežný záber + popredie', DIST * (AMTd + ampMax), DIST * (1 - 0.12 - drift - 0.06)],
    ['pohyb (krok dopredu, walk ' + walk + ')', DIST * (AMTd + 0.1), DIST * (1 - 0.12 - drift - walk)],
    ['nájazd (nz ' + nz + ')', DIST * (AMTd + 0.1 * xN), DIST * (1 - 0.12 - drift - nz * Math.pow(xN, 1.6))],
    ['prológ „door“ ' + zFwd + ' + nájazd do rohožky', DIST * (AMTd + 0.1 * xN), DIST * (1 - zFwd - drift - nz * Math.pow(xN, 1.6))],
  ];
  for (const [n, vz, cz] of cases) {
    const r = cz - vz;
    if (r > near) add('OK', 'K2-06', `blízka rovina ${near}, ${n}: kamera z≈${cz.toFixed(2)}, najbližší vrchol z=${vz.toFixed(2)} (rezerva ${r.toFixed(2)})`, `assets/film.js:${lineOf(src, cam.index)}`);
    else add('POZOR', 'K2-06b', `${n}: kamera z≈${cz.toFixed(2)} je bližšie než najbližšie vrcholy (z=${vz.toFixed(2)}, ${r.toFixed(2)}) – tie sa orežú; diera je len vtedy, keď orezaná časť padne do záberu (pokus „diery“ na strihu z prológu)`, `assets/film.js:${lineOf(src, src.indexOf('nz:'))}`);
  }
}

/* ---- K2-07: prázdna textúra a plochá hĺbka ---- */
const blank = /const blank = px\((\d+),\s*(\d+),\s*(\d+)\)/.exec(src);
if (blank) {
  const lum = +blank[1] + +blank[2] + +blank[3];
  add(lum < 90 ? 'POZOR' : 'OK', 'K2-07', `prázdna textúra blank = rgb(${blank[1]},${blank[2]},${blank[3]})${lum < 90 ? ' – tmavá: záber kreslený s ňou je čierne okno' : ''}`, at(/const blank = px/));
}
const readyNoMap = /if \(!s\.video\.poster\) \{ s\.ready = true;/.exec(src);
if (readyNoMap) add('POZOR', 'K2-07b', 'video bez plagátu je „ready“ s prázdnou textúrou (čierne okno, kým nepríde snímka videa); týka sa len kotiev s data-video bez data-video-poster', `assets/film.js:${lineOf(src, readyNoMap.index)}`);
const flatDraw = /uDepth:\s*\{\s*value:\s*flat\s*\}/.test(src);
if (flatDraw && F && alphaArgs(F.body).some((a) => a.arg === 'vZ'))
  add('CHYBA', 'K2-07c', 'záber s plochou hĺbkou (flat = 0: video, plagát) by mal v priamom prechode alfu 0 na celej ploche – celé čierne okno v Safari (dôsledok K2-01)', at(/const blank = px/));

/* ---- K2-08: strata kontextu, zmena veľkosti ---- */
if (!/webglcontextlost/.test(src)) add('CHYBA', 'K2-08', 'chýba obsluha webglcontextlost', 'assets/film.js:?');
else {
  add('OK', 'K2-08', 'strata kontextu: preventDefault + obnova textúr', at(/webglcontextlost/));
  if (!/webglcontextlost[^\n]*world-in/.test(src)) add('POZOR', 'K2-08b', 'počas straty kontextu a po obnove (kým sa fotky znova nenahrajú) sú zálohy .film-still skryté (world-in) a plátno je prázdne/--ink – čierne okno', at(/webglcontextrestored/));
}
const rs = /renderer\.setSize\(w, h, false\);/.exec(src);
if (rs) add('POZOR', 'K2-08c', 'setSize vyprázdni plátno; ďalší snímok kreslí wake() hneď – nanajvýš 1 snímka --ink pri zmene okna', `assets/film.js:${lineOf(src, rs.index)}`);

/* ---- K2-09: presnosť a textúry (rozdiely Safari) ---- */
if (/precision\s+(mediump|lowp)\s+float/.test(src) || /precision:\s*'(mediump|lowp)'/.test(src)) add('POZOR', 'K2-09', 'shader alebo renderer s mediump/lowp: vo vertex shaderi Safari to dá schodíky hĺbky', at(/precision/));
else add('OK', 'K2-09', 'bez vynútenej mediump/lowp (three dá highp)', 'assets/film.js');
if (!/t\.flipY = false/.test(src)) add('POZOR', 'K2-09b', 'textúry bez flipY=false', 'assets/film.js:?');
else add('OK', 'K2-09b', 'textúry flipY=false, NoColorSpace, ClampToEdge; nahrávanie po pásoch cez UNPACK_SKIP_ROWS (ak by zlyhalo, pás je 0 = čierny pruh, nie nepravidelná škvrna)', at(/t\.flipY = false/));

/* ---- K2-10: CSS plátna ---- */
const cr = /\.film-canvas\s*\{([^}]*)\}/.exec(css);
if (cr) {
  const bg = /background[^;]*;/.exec(cr[1]);
  add('POZOR', 'K2-10', `plátno ${bg ? 'má ' + bg[0] : 'nemá vlastné pozadie'}; pod ním je html/body background: var(--ink) – každá priehľadná časť plátna je čierna`, `assets/style.css:${lineOf(css, cr.index)}`);
}

/* ---- K2-11: dáta – hĺbkové mapy s presnou nulou (spúšťač K2-01) ---- */
try {
  const py = `import sys,glob,os\nfrom PIL import Image\nimport numpy as np\nfor f in sorted(glob.glob(os.path.join(sys.argv[1],'assets/img/film/*-hlbka.webp'))):\n  a=np.asarray(Image.open(f).convert('L'))\n  print(os.path.basename(f), round(100*(a==0).mean(),2))`;
  const r = execFileSync('python3', ['-I', '-c', py, ROOT], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const z = r.map((l) => l.split(' ')).filter((x) => +x[1] > 0);
  add('POZOR', 'K2-11', `hĺbkové mapy s presnou nulou: ${z.length}/${r.length} (${z.map((x) => x[0].replace('-hlbka.webp', '') + ' ' + x[1] + '%').join(', ')}); kým platí K2-01, tieto miesta sú v Safari čierne`, 'assets/img/film/*-hlbka.webp');
} catch (e) { add('POZOR', 'K2-11', 'hĺbkové mapy sa nedali prečítať (python3 + PIL)', 'assets/img/film'); }

/* ---- K2-12: rezerva okraja fotky pri posune kamery v strihu ----
   place() obmedzí bočný posun strihu tak, aby okno ostalo na fotke, s rezervou na paralaxu okraja ea = uAmt·k.
   Okraje hĺbkových máp majú hĺbku až 1,0 (podlaha, stĺp, kreslo pri okraji): pri k < max. hĺbke okraja sa blízky okraj
   môže vtiahnuť do záberu a v textúre strihu ostane nepokrytý pás (farba čistenia --ink). Pokus „diery“: kava>sud
   (popredie) pri mix 0,3 – pás pri ľavom okraji obrazovky. */
const er = /uAmt\.value\s*\*\s*([\d.]+)\s*,\s*par\s*=/.exec(src);
if (er) {
  const k = +er[1];
  let maxEdge = NaN;
  try {
    const py = `import sys,glob,os\nfrom PIL import Image\nimport numpy as np\nm=0\nfor f in glob.glob(os.path.join(sys.argv[1],'assets/img/film/*-hlbka.webp')):\n  if '-m-' in f: continue\n  a=np.asarray(Image.open(f).convert('L')).astype(float)/255\n  m=max(m,a[:,:4].max(),a[:,-4:].max(),a[:4].max(),a[-4:].max())\nprint(m)`;
    maxEdge = parseFloat(execFileSync('python3', ['-I', '-c', py, ROOT], { encoding: 'utf8' }));
  } catch (e) { /* bez PIL */ }
  const V = tpl('VERT');
  const edgeGuard = V && /min\(\s*uv\s*,\s*1\.0\s*-\s*uv\s*\)/.test(V.body) && /smoothstep/.test(V.body);
  if (edgeGuard) add('OK', 'K2-12', 'poistka okraja vo vertex shaderi: hĺbka sa pri okraji fotky stiahne na rovinu steny, okraj sa nevtiahne do záberu', `assets/film.js:${lineOf(src, V.idx)}`);
  else if (isFinite(maxEdge) && k < maxEdge) add('CHYBA', 'K2-12', `rezerva okraja v strihu počíta s hĺbkou okraja ${k}, mapy majú na okraji až ${maxEdge.toFixed(2)}: blízky okraj sa pri bočnom posune strihu vtiahne do záberu, v textúre strihu ostane nepokrytý pás (--ink) a strih popredia ho rozmaže cez obraz (pokus „dieryrt“: kava>sud mix 0,3 – 4,3 % rtB, na obrazovke čierny rozmazaný pás vľavo). Poistka: hĺbka pri okraji fotky → 0 vo VERT`, at(/uAmt\.value\s*\*\s*[\d.]+\s*,\s*par\s*=/));
  else add('OK', 'K2-12', `rezerva okraja ${k} ≥ max. hĺbka okraja ${isFinite(maxEdge) ? maxEdge.toFixed(2) : '?'}`, at(/uAmt\.value\s*\*\s*[\d.]+\s*,\s*par\s*=/));
}

if (asJson) console.log(JSON.stringify(out, null, 1));
else for (const o of out) console.log(`${o.stav.padEnd(5)}  ${o.kod.padEnd(7)}  ${o.popis}  (${o.kde})`);
const chyby = out.filter((o) => o.stav === 'CHYBA').length;
console.log(`\nSúhrn: ${chyby} CHYBA, ${out.filter((o) => o.stav === 'POZOR').length} POZOR, ${out.filter((o) => o.stav === 'OK').length} OK`);
process.exit(chyby ? 1 : 0);
