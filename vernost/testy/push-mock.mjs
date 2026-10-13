/* Napodobenina služby upozornení: overí VAPID podpis (ES256), publikum, platnosť a TTL; /410/ vráti „odber zanikol“. */
import http from 'node:http';
import crypto from 'node:crypto';
const prijate = [];
const b64u = (s) => Buffer.from(s, 'base64url');
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/prijate') { res.end(JSON.stringify(prijate)); return; }
  const z = { url: req.url, ttl: req.headers.ttl, ok: false };
  try {
    const m = /^vapid t=([^,]+),\s*k=(.+)$/.exec(req.headers.authorization || '');
    if (!m) throw new Error('chýba vapid hlavička');
    const [h, p, s] = m[1].split('.');
    const pub = b64u(m[2]);
    if (pub.length !== 65 || pub[0] !== 4) throw new Error('kľúč nie je P-256 nekomprimovaný');
    const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' });
    if (!crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, b64u(s))) throw new Error('zlý podpis');
    const hl = JSON.parse(b64u(h)), tel = JSON.parse(b64u(p));
    if (hl.alg !== 'ES256') throw new Error('alg');
    if (tel.aud !== `http://${req.headers.host}`) throw new Error('aud ' + tel.aud);
    const teraz = Date.now() / 1000;
    if (!(tel.exp > teraz && tel.exp <= teraz + 86400)) throw new Error('exp');
    if (!/^mailto:|^https:/.test(tel.sub)) throw new Error('sub');
    z.ok = true; z.sub = tel.sub;
  } catch (e) { z.chyba = e.message; }
  prijate.push(z);
  res.statusCode = req.url.includes('/410/') ? 410 : z.ok ? 201 : 403;
  res.end();
}).listen(8078, '127.0.0.1');
