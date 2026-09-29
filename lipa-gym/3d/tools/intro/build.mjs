// Zostaví úvodnú scénu do jedného modulu assets/intro.js (three.js je v ňom, len použité časti).
// node tools/intro/build.mjs   (esbuild a three 0.186 z pomocného priečinka, pozri PRODUKCIA.md)
import { build } from '/tmp/gymklub-3d-build/node_modules/esbuild/lib/main.js';
const THREE = process.env.THREE_DIR || '/tmp/gymklub-3d-build/node_modules/three';
const r = await build({
  entryPoints: [new URL('./intro.src.js', import.meta.url).pathname],
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'eof',
  outfile: new URL('../../assets/intro.js', import.meta.url).pathname,
  alias: { three: THREE + '/build/three.module.js', 'three/examples/jsm/objects/Sky.js': THREE + '/examples/jsm/objects/Sky.js' },
  metafile: true, logLevel: 'warning',
});
const o = Object.values(r.metafile.outputs)[0];
console.log('intro.js', (o.bytes / 1024).toFixed(0), 'kB');
