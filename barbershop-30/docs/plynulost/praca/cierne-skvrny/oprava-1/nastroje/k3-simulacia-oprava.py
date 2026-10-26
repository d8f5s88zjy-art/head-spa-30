#!/usr/bin/env python3
"""K3 – simulácia hĺbkových máp filmu Barbershop 30 mimo prehliadača.

Zopakuje výpočet z assets/film.js (bez prehliadača):
  - zjemnenie hĺbky soften(): max filter (vodorovne, zvislo) + Gaussovo rozmazanie, každý prechod
    do 8-bitového cieľa (RGBA8), polomery podľa SEG[0];
  - mriežka PlaneGeometry(1, 1, SEG) so vzorkovaním hĺbky vo vrcholoch (LinearFilter, ClampToEdge);
  - vertex shader: w = uEye + (w - uEye) * (1 - uAmt * z);
  - kamera place(): dráha MOVES podľa shotT, dýchanie (krajné hodnoty), myš (počítač), posuny pri
    strihoch (push, CK, cut.k/dir/a/b), lookAt, PerspectiveCamera(FOV, near, far) a na telefóne pás
    (setViewOffset);
a pre každú polohu kamery zistí: preklopené trojuholníky (odvrátené, ShaderMaterial side Front ich
nekreslí), body pred blízkou rovinou / za kamerou, diery v pokrytí okna (pixely, ktoré nepokryje žiadny
kreslený trojuholník = farba plátna), extrémne natiahnutie a oblasti s alfou 0 (FRAG zapisuje
gl_FragColor.a = vZ = hĺbka; pri jednom zábere ide rovno na obrazovku).

Parametre sa čítajú z film.js a index.html (node vyhodnotí konštanty ARC, MOVES, CK, CUTS, ...);
dajú sa prepísať: --param AMT=0.3 --param 'SEG=[128,96]' (JSON hodnota, platí pre zvolené zariadenie).

Použitie:
  python3 -I k3-simulacia.py --web <barbershop-30> --out <priečinok> [--zariadenie pc,telefon]
          [--pc 1440x900] [--telefon 390x844] [--zabery cakaren,sala-rano] [--param K=V ...]
  python3 -I k3-simulacia.py prechody --web <barbershop-30> --out <priečinok>   (diery po skladaní strihu v post shaderi)
  python3 -I k3-simulacia.py porovnaj --web <barbershop-30> --snimky <priečinok so z###.jpg> --out <priečinok>
  python3 -I k3-simulacia.py skvrny --web <barbershop-30> --out <priečinok>   (súvislé oblasti alfa 0 v okne každého záberu v pokoji)
"""
import argparse, json, math, os, re, subprocess, sys, glob
import numpy as np
import cv2

NODE = os.environ.get('NODE', '/opt/node22/bin/node')

# ---------------------------------------------------------------- parametre z kódu
NODE_SRC = r"""
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf8');
const phone = process.argv[2] === '1';
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('nenašiel som ' + name); return m[0]; };
const parts = [
  grab(/const ARC = [^;]+;/, 'ARC'),
  grab(/const MOVES = \{[\s\S]*?\n  \};/, 'MOVES'),
  grab(/const CUTS = \{[\s\S]*?\n  \};/, 'CUTS'),
  grab(/const CUT_KINDS = [^;]+;/, 'CUT_KINDS'),
  grab(/const CUT_DIRS = [^;]+;/, 'CUT_DIRS'),
  grab(/const PAS_B = [^;]+;/, 'PAS_B'),
  grab(/const FOV = [^;]+;/, 'FOV'),
  grab(/const SEG = [^;]+;/, 'SEG'),
  grab(/const AMT = [^;]+;/, 'AMT'),
  grab(/const OVER = [^;]+;/, 'OVER'),
  grab(/const OVER_V = [^;]+;/, 'OVER_V'),
  grab(/const DRIFT = [^;]+;/, 'DRIFT'),
  grab(/const CK = phone[\s\S]*?\};\n/, 'CK').replace(/\n$/, ''),
];
const f = new Function('phone', parts.join('\n') + '\nreturn { ARC, MOVES, CUTS, CUT_KINDS, CUT_DIRS, PAS_B, FOV, DIST, SEG, AMT, OVER, OVER_V, DRIFT, CK };');
const P = f(phone);
const num = (re, name) => { const m = src.match(re); if (!m) throw new Error('nenašiel som ' + name); return m.slice(1).map(Number); };
[P.NEAR, P.FAR] = num(/new THREE\.PerspectiveCamera\(FOV, 1, ([\d.]+), ([\d.]+)\)/, 'near/far');
[P.SIG_MIN, P.SIG_K] = num(/const sig = Math\.max\(([\d.]+), ([\d.]+) \* w \/ SEG\[0\]\)/, 'sig');
[P.R_MAX_K] = num(/pass\(t, a, 1, 0, 0, Math\.round\(([\d.]+) \* sig\)\)/, 'polomer max');
[P.R_G_CAP, P.R_G_K] = num(/pass\(b\.texture, a, 1, 0, 1, Math\.min\((\d+), Math\.round\(([\d.]+) \* sig\)\)\)/, 'polomer gauss');
[P.DEPTH_W] = num(/const DEPTH_W = (\d+);/, 'DEPTH_W');
[P.AMP_K4, P.AMP_INE] = (() => { const m = src.match(/const amp = cut && cut\.k === 4 \? CK\.amp : ([\d.]+);/); return m ? [P.CK.amp, Number(m[1])] : [P.CK.amp, 0.1]; })();
[P.PUSH_OUT_E, P.PUSH_OUT_K] = num(/push > 0 \? Math\.pow\(push, ([\d.]+)\) \* ([\d.]+)/, 'push von');
[P.PUSH_IN_E, P.PUSH_IN_V, P.PUSH_IN_K] = num(/-Math\.pow\(-push, ([\d.]+)\) \* \(s\.video \? ([\d.]+) : ([\d.]+)\)/, 'push dnu');
[P.SHOT_PRO, P.SHOT_OFF, P.SHOT_LEN] = num(/s\.pi === 0 \? clamp\(S \/ ([\d.]+), 0, 1\) : clamp\(\(S - s\.pi \+ ([\d.]+)\) \/ ([\d.]+), 0, 1\)/, 'shotT');
P.VERT_OK = /w\.xyz = uEye \+ \(w\.xyz - uEye\) \* \(1\.0 - uAmt \* z\);/.test(src);
P.FRAG_ALFA_HLBKA = /gl_FragColor = vec4\(c, vZ\);/.test(src);
// oprava B (okraj): vertex shader stiahne hĺbku v krajných OKRAJ fotky na 0 (z *= smoothstep(0, OKRAJ, min(e)))
P.OKRAJ = (() => { const m = src.match(/vec2 e = min\(uv, 1\.0 - uv\); z \*= smoothstep\(0\.0, ([\d.]+), min\(e\.x, e\.y\)\);/); return m ? Number(m[1]) : 0; })();
P.SIDE = (src.match(/s\.mat = new THREE\.ShaderMaterial\(\{[\s\S]*?\}\);/) || [''])[0].match(/side:\s*THREE\.(\w+)/);
P.SIDE = P.SIDE ? P.SIDE[1] : 'FrontSide (predvolené)';
P.CANVAS_ALPHA = (src.match(/WebGLRenderer\(\{[^}]*alpha: (true|false)/) || [, '?'])[1];
P.CLEAR = (src.match(/setClearColor\((0x[0-9a-f]+), ([\d.]+)\)/i) || [, '?', '?']).slice(1);
process.stdout.write(JSON.stringify(P));
"""


def load_params(film_js, phone, overrides):
    out = subprocess.run([NODE, '-e', NODE_SRC, film_js, '1' if phone else '0'], capture_output=True, text=True)
    if out.returncode:
        sys.exit('chyba pri čítaní film.js: ' + out.stderr)
    P = json.loads(out.stdout)
    for k, v in overrides:
        P[k] = v
    return P


# ---------------------------------------------------------------- zábery z index.html
def parse_shots(html_path, phone, P):
    html = open(html_path, encoding='utf8').read()
    def attrs(tag):
        return dict(re.findall(r'([a-zA-Z-]+)="([^"]*)"', tag))
    def pair(v, d):
        try:
            a = [float(x) for x in re.split(r'[\s,;]+', (v or '').strip()) if x]
            if len(a) == 2:
                return [min(1, max(0, a[0])), min(1, max(0, a[1]))]
        except ValueError:
            pass
        return d
    def ratio(v):
        a = re.split(r'[x×,\s]+', v or '')
        try:
            return float(a[0]) / float(a[1])
        except Exception:
            return 1.5
    shots = []
    for tag in re.findall(r'<div class="film-shot[^"]*"[^>]*data-shot="[^"]*"[^>]*>', html):
        a = attrs(tag)
        if not phone and a.get('data-desk') == 'skip':
            continue
        s = dict(name=a['data-shot'], photo=a['data-shot'], f=pair(a.get('data-f'), [0.5, 0.5]),
                 mv=a.get('data-mv') if a.get('data-mv') in P['MOVES'] else 'in', pa=ratio(a.get('data-size')),
                 cut=a.get('data-cut'), pro=False, video=bool(a.get('data-video')))
        if s['video']:
            s['photo'] = s['name'] + '-video'
        shots.append(s)
    m = re.search(r'<[^>]*data-pro="[^"]*"[^>]*>', html)
    if m:
        a = attrs(m.group(0))
        pm = phone and a.get('data-pro-m')
        f = pair(a.get('data-pro-f'), [0.5, 0.5]); fm = pair(a.get('data-pro-fm'), None)
        shots.insert(0, dict(name=a['data-pro'], photo=pm or a['data-pro'], f=fm if (pm and fm) else f,
                             mv=a.get('data-pro-mv') if a.get('data-pro-mv') in P['MOVES'] else 'in',
                             pa=ratio(a.get('data-pro-m-size') if pm else a.get('data-pro-size')), cut=None, pro=True, video=False))
    for i, s in enumerate(shots):
        s['pi'] = i
    return shots


def parse_cut(spec, phone, P):
    gen, mob = [], []
    for t in str(spec or '').strip().lower().split():
        if re.match(r'^m[ab]:', t): mob.append(t[1:])
        elif t.startswith('m:'): mob.append(t[2:])
        elif t: gen.append(t)
    c = dict(name='', k=0, dir=[0, 0], a=None, b=None, own='')
    for t in (gen + mob if phone else gen):
        if t in P['CUT_KINDS']: c['name'] = t; c['k'] = P['CUT_KINDS'][t]
        elif t in P['CUT_DIRS']: c['dir'] = P['CUT_DIRS'][t]
        elif re.match(r'^[ab]:', t):
            v = [float(x) for x in t[2:].split(',')]
            c[t[0]] = v; c['own'] = t[0]
    return c if c['name'] else None


# ---------------------------------------------------------------- hĺbka
def q8(x):
    return np.floor(np.clip(x, 0, 1) * 255 + 0.5) / 255


def soften(depth_u8, P):
    """depth_u8: 2D uint8 (kanál R). Vráti zjemnenú hĺbku 0..1 (8-bitová ako v RGBA8 cieli)."""
    h, w = depth_u8.shape
    sig = max(P['SIG_MIN'], P['SIG_K'] * w / P['SEG'][0])
    r1 = int(round(P['R_MAX_K'] * sig)); r2 = int(min(P['R_G_CAP'], round(P['R_G_K'] * sig)))
    z = depth_u8.astype(np.float64) / 255
    def maxpass(a, axis, r):
        p = np.pad(a, [(0, 0), (r, r)] if axis == 1 else [(r, r), (0, 0)], mode='edge')
        out = np.full_like(a, 0.0)
        n = a.shape[axis]
        for f in range(-r, r + 1):
            sl = p[:, r + f:r + f + n] if axis == 1 else p[r + f:r + f + n, :]
            out = np.maximum(out, sl)
        return q8(out)
    def gpass(a, axis, r):
        s2 = r * r / 9.0
        p = np.pad(a, [(0, 0), (r, r)] if axis == 1 else [(r, r), (0, 0)], mode='edge')
        acc = np.zeros_like(a); ws = 0.0; n = a.shape[axis]
        for f in range(-r, r + 1):
            wt = math.exp(-0.5 * f * f / s2)
            sl = p[:, r + f:r + f + n] if axis == 1 else p[r + f:r + f + n, :]
            acc += sl * wt; ws += wt
        return q8(acc / ws)
    z = maxpass(z, 1, r1); z = maxpass(z, 0, r1)
    z = gpass(z, 1, r2); z = gpass(z, 0, r2)
    return z, dict(sig=sig, r_max=r1, r_gauss=r2)


def bilinear(tex, u, v):
    h, w = tex.shape
    x = np.clip(u * w - 0.5, 0, w - 1); y = np.clip(v * h - 0.5, 0, h - 1)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    x1 = np.minimum(x0 + 1, w - 1); y1 = np.minimum(y0 + 1, h - 1)
    fx = x - x0; fy = y - y0
    return (tex[y0, x0] * (1 - fx) * (1 - fy) + tex[y0, x1] * fx * (1 - fy) + tex[y1, x0] * (1 - fx) * fy + tex[y1, x1] * fx * fy)


# ---------------------------------------------------------------- kamera (three.js)
def look_at_view(eye, target):
    z = eye - target; z = z / np.linalg.norm(z)
    up = np.array([0.0, 1.0, 0.0])
    x = np.cross(up, z)
    if np.linalg.norm(x) < 1e-9:
        x = np.array([1.0, 0, 0])
    x = x / np.linalg.norm(x); y = np.cross(z, x)
    R = np.stack([x, y, z], 1)  # stĺpce = osi kamery vo svete
    V = np.eye(4); V[:3, :3] = R.T; V[:3, 3] = -R.T @ eye
    return V


def projection(P, cw, ch, band):
    near, far = P['NEAR'], P['FAR']
    aspect = cw / (ch * band)
    top = near * math.tan(math.radians(P['FOV']) / 2); height = 2 * top; width = aspect * height; left = -0.5 * width
    if band != 1:  # setViewOffset(cw, ch*b, 0, 0, cw, ch)
        width *= cw / cw; height *= ch / (ch * band)
    right = left + width; bottom = top - height
    M = np.zeros((4, 4))
    M[0, 0] = 2 * near / (right - left); M[0, 2] = (right + left) / (right - left)
    M[1, 1] = 2 * near / (top - bottom); M[1, 2] = (top + bottom) / (top - bottom)
    M[2, 2] = -(far + near) / (far - near); M[2, 3] = -2 * far * near / (far - near); M[3, 2] = -1
    return M


# ---------------------------------------------------------------- záber: rozloženie a mriežka
class Shot:
    def __init__(self, s, P, phone, cw, ch, web):
        self.__dict__.update(s)
        self.P = P
        aspect = cw / ch
        pas = phone and aspect < 1
        DIST = P['DIST']
        tanH = math.tan(math.radians(P['FOV']) / 2)
        vh = 2 * DIST * tanH
        self.band = P['PAS_B'] if (pas and not self.pro) else 1
        vw = vh * aspect / self.band
        ovr = P['OVER_V'] if self.video else P['OVER']; ov = 1 + 2 * ovr
        pw = vw * ov; ph = pw / self.pa
        if ph < vh * ov:
            ph = vh * ov; pw = ph * self.pa
        self.pw, self.ph, self.vw, self.vh = pw, ph, vw, vh
        f = self.f
        mx = max(0, (pw - vw) / 2 - vw * ovr * 0.5); my = max(0, (ph - vh) / 2 - vh * ovr * 0.5)
        self.eye = np.array([min(mx, max(-mx, (f[0] - 0.5) * pw)), min(my, max(-my, (0.5 - f[1]) * ph)), DIST])
        # hĺbka a mriežka
        dpath = os.path.join(web, 'assets/img/film', self.photo + '-hlbka.webp')
        self.has_depth = os.path.exists(dpath) and not self.video
        SX, SY = P['SEG']
        gu = np.linspace(0, 1, SX + 1); gv = np.linspace(0, 1, SY + 1)
        U, Vv = np.meshgrid(gu, gv)                          # vUv = (uv.x, 1 - uv.y), riadok 0 = horný okraj
        if self.has_depth:
            d = cv2.imread(dpath, cv2.IMREAD_UNCHANGED)
            d = d if d.ndim == 2 else d[..., 2]
            if d.shape[1] > P['DEPTH_W']:
                d = cv2.resize(d, (P['DEPTH_W'], round(d.shape[0] * P['DEPTH_W'] / d.shape[1])), interpolation=cv2.INTER_AREA)
            self.depth_raw = d
            self.zsoft, self.soft_info = soften(d, P)
            Z = bilinear(self.zsoft, U, Vv)
            if P.get('OKRAJ'):                                  # oprava B: okraj fotky ostáva na rovine steny
                e = np.minimum(np.minimum(U, 1 - U), np.minimum(Vv, 1 - Vv))
                tt = np.clip(e / P['OKRAJ'], 0, 1); Z = Z * (tt * tt * (3 - 2 * tt))
        else:
            self.depth_raw = None; self.zsoft = None; self.soft_info = {}
            Z = np.zeros_like(U)
        self.U, self.V, self.Z = U, Vv, Z
        X = (U - 0.5) * pw; Y = (0.5 - Vv) * ph
        self.Pw = np.stack([X, Y, np.zeros_like(X)], -1).reshape(-1, 3)
        self.z = Z.reshape(-1)
        n1 = SX + 1
        ix, iy = np.meshgrid(np.arange(SX), np.arange(SY))
        a = (ix + n1 * iy).ravel(); b = (ix + n1 * (iy + 1)).ravel(); c = (ix + 1 + n1 * (iy + 1)).ravel(); dd = (ix + 1 + n1 * iy).ravel()
        self.tri = np.concatenate([np.stack([a, b, dd], 1), np.stack([b, c, dd], 1)])
        # fotka (na farby náhľadu)
        cand = sorted(glob.glob(os.path.join(web, 'assets/img/film', self.photo + '-[0-9]*.webp')), key=lambda p: int(re.findall(r'-(\d+)\.webp$', p)[0]))
        self.img = cv2.imread(cand[0]) if cand else None

    def pt_of(self, p):
        return [(p[0] - 0.5) * self.pw, (0.5 - p[1]) * self.ph]


def shot_t(s, S, P):
    if s.pi == 0:
        return min(1, max(0, S / P['SHOT_PRO']))
    return min(1, max(0, (S - s.pi + P['SHOT_OFF']) / P['SHOT_LEN']))


def place(s, P, t, amt, drift=(0, 0, 0), mouse=(0, 0), push=0.0, cut=None):
    """Kópia place() z film.js. drift = (dx, dy, dz) v podieloch amplitúdy -1..1 (dýchanie), mouse = pmx, pmy."""
    DIST = P['DIST']; CK = P['CK']
    m = P['MOVES'][s.mv]
    e = t * t * (3 - 2 * t) * 0.6 + t * 0.4
    off = np.array([(m[0][0] + (m[1][0] - m[0][0]) * e) * s.vw, (m[0][1] + (m[1][1] - m[0][1]) * e) * s.vh,
                    (m[0][2] + (m[1][2] - m[0][2]) * e) * DIST])
    dr = P['DRIFT']
    off[0] += (drift[0] * 0.017 * dr + mouse[0] * 0.03) * s.vw
    off[1] += (drift[1] * 0.010 * dr + mouse[1] * 0.018) * s.vh
    off[2] += drift[2] * 0.022 * DIST * dr
    zp = (push ** P['PUSH_OUT_E']) * P['PUSH_OUT_K'] if push > 0 else (-((-push) ** P['PUSH_IN_E']) * (P['PUSH_IN_V'] if s.video else P['PUSH_IN_K']) if push < 0 else 0)
    dx = dy = yaw = fx = fy = 0.0
    if cut and push:
        out = push > 0; x = push if out else 1 + push; y = 1 - x; k = cut['k']; dd = cut['dir']
        if k in (1, 2, 4):
            if dd[0] or dd[1]:
                L = CK['lat'][k]; d2 = L * x * x if out else -L * y * y
                dx = dd[0] * d2 * s.vw; dy = dd[1] * d2 * s.vh; yaw = CK['yaw'][k]
                zp = x ** 1.6 * 0.06 if out else -(y ** 1.3) * 0.04
            else:
                zp = CK['walk'] * x * x if out else -CK['walkB'] * y * y
        elif k == 3:
            close = (cut['name'] == 'najazd') == out; v = x if out else y; p = cut['a'] if out else cut['b']
            zp = CK['nz'] * v ** 1.6 if close else -0.12 * v ** 1.3
            if p:
                pt = s.pt_of(p); w = (0.85 if close else 0.6) * v * v * (3 - 2 * v)
                fx = (pt[0] - s.eye[0]) * w; fy = (pt[1] - s.eye[1]) * w
    off[2] -= zp * DIST
    cam = s.eye + off
    tmp = np.array([s.eye[0] + off[0] * 0.08, s.eye[1] + off[1] * 0.08, 0.0])
    lx = dx * (1 + yaw) + fx; ly = dy * (1 + yaw) + fy
    if lx or ly:
        D = max(0.2 * DIST, DIST + off[2]); hw = s.vw / 2 * D / DIST; hh = s.vh / 2 * D / DIST
        ea = amt * 0.6; par = ea / (1 - ea)
        ax = max(abs(tmp[0]), s.pw / 2 - hw - s.vw * 0.005 - abs(dx + fx) * par)
        ay = max(abs(tmp[1]), s.ph / 2 - hh - s.vh * 0.005 - abs(dy + fy) * par)
        nx = min(ax, max(-ax, tmp[0] + lx)) - tmp[0]; ny = min(ay, max(-ay, tmp[1] + ly)) - tmp[1]
        kx = nx / lx if lx else 1; ky = ny / ly if ly else 1
        cam[0] += (dx + fx * 0.9) * kx; cam[1] += (dy + fy * 0.9) * ky
        tmp[0] += nx; tmp[1] += ny
    return cam, tmp


# ---------------------------------------------------------------- vyhodnotenie jednej polohy
def evaluate(s, P, cam, target, amt, cw, ch, scale, want_img=False, want_alpha=True, full=False, want_vz=False):
    V = look_at_view(cam, target); Pm = projection(P, cw, ch, s.band)
    W = s.eye[None, :] + (s.Pw - s.eye[None, :]) * (1 - amt * s.z)[:, None]   # vertex shader
    Wh = np.concatenate([W, np.ones((len(W), 1))], 1)
    vs = Wh @ V.T                                   # súradnice kamery (pozerá do -z)
    depth = -vs[:, 2]
    clip = vs @ Pm.T
    near = P['NEAR']
    with np.errstate(divide='ignore', invalid='ignore'):
        ndc = clip[:, :2] / clip[:, 3:4]
    # bez hĺbky (amt 0) na porovnanie natiahnutia
    W0h = np.concatenate([s.Pw, np.ones((len(W), 1))], 1) @ V.T @ Pm.T
    ndc0 = W0h[:, :2] / W0h[:, 3:4]
    T = s.tri
    dep_t = depth[T]
    in_front = (dep_t > near).all(1)
    clipped = (dep_t <= near).any(1)
    behind = (dep_t <= 0).any(1)
    p0, p1, p2 = ndc[T[:, 0]], ndc[T[:, 1]], ndc[T[:, 2]]
    area = 0.5 * ((p1[:, 0] - p0[:, 0]) * (p2[:, 1] - p0[:, 1]) - (p2[:, 0] - p0[:, 0]) * (p1[:, 1] - p0[:, 1]))
    q0, q1, q2 = ndc0[T[:, 0]], ndc0[T[:, 1]], ndc0[T[:, 2]]
    area0 = 0.5 * ((q1[:, 0] - q0[:, 0]) * (q2[:, 1] - q0[:, 1]) - (q2[:, 0] - q0[:, 0]) * (q1[:, 1] - q0[:, 1]))
    flipped = in_front & (area <= 0)
    stretch = np.where(in_front & (area > 0), area / np.maximum(area0, 1e-12), 0)
    # okno: celé plátno, na telefóne na výšku horný pás (ndc y od 1 - 2*band po 1)
    RW, RH = int(round(cw * scale)), int(round(ch * (1 if full else s.band) * scale))
    def to_px(nd):
        x = (nd[..., 0] + 1) / 2 * RW
        y = (1 - nd[..., 1]) / 2 * (ch * scale)      # y od horného okraja plátna; pás = horných ch*band*scale pixelov
        return np.stack([x, y], -1)
    front = in_front & (area > 0)
    # trojuholníky čiastočne pred blízkou rovinou: orež v priestore kamery (Sutherland–Hodgman), ostatné rovno
    cover = np.zeros((RH, RW), np.uint8)
    pxs = to_px(ndc)
    tri_px = np.round(pxs[T] * 16).astype(np.int64)
    vis_bb = ((tri_px[:, :, 0].max(1) >= 0) & (tri_px[:, :, 0].min(1) < RW * 16) & (tri_px[:, :, 1].max(1) >= 0) & (tri_px[:, :, 1].min(1) < RH * 16))
    idx = np.nonzero(front & vis_bb)[0]
    # painter: od najvzdialenejšieho, aby navrchu bol najbližší trojuholník (alfa a náhľad)
    order = idx[np.argsort(-dep_t[idx].mean(1))]
    alpha0_tri = (np.floor(s.z[T] * 255 + 0.5) == 0).all(1)          # vZ v celom trojuholníku < 0,5/255 -> alfa 0
    amap = np.zeros((RH, RW), np.uint8)
    vz = np.ones((RH, RW), np.float32) if want_vz else None   # diera = farba plátna s alfou 1
    zt = s.z[T].mean(1)
    img = np.zeros((RH, RW, 3), np.uint8) if want_img else None
    if want_img and s.img is not None:
        ih, iw = s.img.shape[:2]
        cu = s.U.reshape(-1)[T].mean(1); cv_ = s.V.reshape(-1)[T].mean(1)
        cols = s.img[np.clip((cv_ * ih).astype(int), 0, ih - 1), np.clip((cu * iw).astype(int), 0, iw - 1)]
    tp = np.clip(tri_px, -2**30, 2**30).astype(np.int32)
    for i in order:
        cv2.fillConvexPoly(cover, tp[i], 1, cv2.LINE_8, 4)
        if want_alpha:
            cv2.fillConvexPoly(amap, tp[i], 2 if alpha0_tri[i] else 1, cv2.LINE_8, 4)
        if want_vz:
            cv2.fillConvexPoly(vz, tp[i], float(zt[i]), cv2.LINE_8, 4)
        if want_img:
            cv2.fillConvexPoly(img, tp[i], tuple(int(c) for c in cols[i]) if s.img is not None else (128, 128, 128), cv2.LINE_8, 4)
    # orezané trojuholníky (časť za blízkou rovinou): orezaná časť sa nakreslí, zvyšok chýba
    cidx = np.nonzero(clipped)[0]
    n_clip_drawn = 0
    for i in cidx:
        poly = clip_near(vs[T[i]], near)
        if len(poly) < 3:
            continue
        ph_ = np.concatenate([poly, np.ones((len(poly), 1))], 1) @ Pm.T
        nd = ph_[:, :2] / ph_[:, 3:4]
        a2 = 0.5 * sum(nd[j, 0] * nd[(j + 1) % len(nd), 1] - nd[(j + 1) % len(nd), 0] * nd[j, 1] for j in range(len(nd)))
        if a2 <= 0:
            continue
        pp = np.round(to_px(nd) * 16).astype(np.int64)
        pp = np.clip(pp, -2**30, 2**30).astype(np.int32)
        cv2.fillConvexPoly(cover, pp, 1, cv2.LINE_8, 4); cv2.fillConvexPoly(amap, pp, 1, cv2.LINE_8, 4)
        if want_vz:
            cv2.fillConvexPoly(vz, pp, float(zt[i]), cv2.LINE_8, 4)
        n_clip_drawn += 1
    holes = cover == 0
    res = dict(
        n_tri=int(len(T)), flipped=int(flipped.sum()), clipped=int(clipped.sum()), behind=int(behind.sum()),
        min_depth=float(depth.min()), max_stretch=float(stretch.max()), n_stretch8=int((stretch > 8).sum()),
        hole_px=int(holes.sum()), hole_frac=float(holes.mean()),
        alpha0_frac=float((amap == 2).mean()),
    )
    return res, dict(flipped=flipped, clipped=clipped, stretch=stretch, holes=holes, amap=amap, img=img, vz=vz, Pm=Pm, V=V)


def clip_near(pts, near):
    """Sutherland–Hodgman: časť polygónu (súradnice kamery) pred rovinou z = -near."""
    out = []
    n = len(pts)
    for j in range(n):
        a, b = pts[j][:3], pts[(j + 1) % n][:3]
        ia, ib = -a[2] >= near, -b[2] >= near
        if ia:
            out.append(a)
        if ia != ib:
            t = (-near - a[2]) / (b[2] - a[2])
            out.append(a + (b - a) * t)
    return np.array(out) if out else np.zeros((0, 3))


# ---------------------------------------------------------------- polohy kamery
def poses(shots, P, phone):
    """Generuje (záber, popis, t, amt, drift, mouse, push, cut, mix)."""
    N = len(shots) - 1
    AMT = P['AMT']
    drifts = [(1, 1, 1), (-1, -1, -1), (1, -1, 1), (-1, 1, -1)]
    mice = [(0, 0)] if phone else [(0, 0), (0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5)]
    for s in shots:
        for t in (0, 0.25, 0.5, 0.75, 1):
            for d in drifts:
                for m in mice:
                    yield s, f'pokoj t={t} drift={d} mys={m}', t, AMT, d, m, 0.0, None, 0.0
    span = 0.3
    for k in range(N):
        A, B = shots[k], shots[k + 1]
        cut = parse_cut(B.cut or P['CUTS'].get(A.name + '>' + B.name), phone, P)
        amp = P['AMP_K4'] if (cut and cut['k'] == 4) else P['AMP_INE']
        for mix in (0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95):
            u = 0.5 - math.sin(math.asin(1 - 2 * mix) / 3)          # inverzná smoothstep
            S = k + 0.5 - span / 2 + span * u
            for d in drifts[:2]:
                for m in mice[:1] + mice[1:3]:
                    yield A, f'prechod {A.name}>{B.name} ({cut["name"] if cut else "prelinanie"}) mix={mix} A drift={d} mys={m}', shot_t(A, S, P), AMT + amp * mix, d, m, mix, cut, mix
                    yield B, f'prechod {A.name}>{B.name} ({cut["name"] if cut else "prelinanie"}) mix={mix} B drift={d} mys={m}', shot_t(B, S, P), AMT + amp - amp * mix, d, m, -(1 - mix), cut, mix


# ---------------------------------------------------------------- hlavný beh
def run(args):
    web = args.web
    film_js = os.path.join(web, 'assets/film.js'); html = os.path.join(web, args.stranka)
    os.makedirs(args.out, exist_ok=True)
    overrides = [(kv.split('=', 1)[0], json.loads(kv.split('=', 1)[1])) for kv in args.param]
    summary = {}
    for dev in args.zariadenie.split(','):
        phone = dev == 'telefon'
        P = load_params(film_js, phone, overrides)
        cw, ch = [int(x) for x in (args.telefon if phone else args.pc).split('x')]
        scale = 1.0 if phone else 0.5
        sh = [Shot(s, P, phone, cw, ch, web) for s in parse_shots(html, phone, P)]
        print(f'== {dev} {cw}x{ch}: SEG={P["SEG"]} AMT={P["AMT"]} FOV={P["FOV"]} DIST={P["DIST"]} near={P["NEAR"]} '
              f'ARC={P["ARC"]} side={P["SIDE"]} okraj={P.get("OKRAJ")} FRAG alfa=vZ: {P["FRAG_ALFA_HLBKA"]} canvas alpha={P["CANVAS_ALPHA"]} clear={P["CLEAR"]} vertex OK: {P["VERT_OK"]}')
        for s in sh:
            print(f'   záber {s.pi} {s.name:13s} fotka={s.photo:14s} mv={s.mv:5s} f={s.f} pás={s.band} hĺbka={s.has_depth} soften={s.soft_info}')
        sel = set(args.zabery.split(',')) if args.zabery else None
        acc = {}
        for (s, desc, t, amt, d, m, push, cut, mix) in poses(sh, P, phone):
            if sel and s.name not in sel:
                continue
            cam, tgt = place(s, P, t, amt, d, m, push, cut)
            r, maps = evaluate(s, P, cam, tgt, amt, cw, ch, scale, want_alpha=(mix == 0 and bool(P['FRAG_ALFA_HLBKA'])))   # oprava A: alfa 0 len kým FRAG píše vZ
            key = (s.pi, s.name)
            a = acc.setdefault(key, dict(poses=0, worst={}, flip_u=np.zeros(len(s.tri), bool), clip_u=np.zeros(len(s.tri), bool),
                                         str_max=np.zeros(len(s.tri)), holes_any=0, hole_desc=[], alpha0_rest=[], shot=s))
            a['poses'] += 1
            a['flip_u'] |= maps['flipped']; a['clip_u'] |= maps['clipped']; a['str_max'] = np.maximum(a['str_max'], maps['stretch'])
            for k_ in ('flipped', 'clipped', 'behind', 'max_stretch', 'hole_px', 'alpha0_frac'):
                if r[k_] > a['worst'].get(k_, (-1, ''))[0]:
                    a['worst'][k_] = (r[k_], desc)
            if r['hole_px'] > 0:
                a['holes_any'] += 1
                if len(a['hole_desc']) < 400:
                    a['hole_desc'].append((r['hole_px'], round(r['hole_frac'] * 100, 3), desc, cam.tolist(), tgt.tolist(), amt))
            if mix == 0:
                a['alpha0_rest'].append(r['alpha0_frac'])
        # obrázky a súhrn
        for (pi, name), a in sorted(acc.items()):
            s = a['shot']
            worst_hole = max(a['hole_desc'], default=None)
            # mapa v priestore fotky: preklopené (žlté), orezané blízkou rovinou (fialové), natiahnutie > 8 (modré),
            # alfa 0 po zjemnení (červené)
            base = cv2.resize(s.img, (768, int(768 / s.pa))) if s.img is not None else np.full((512, 768, 3), 90, np.uint8)
            H_, W_ = base.shape[:2]
            ov = (base * 0.55).astype(np.uint8)
            if s.zsoft is not None:
                z0 = cv2.resize((np.floor(s.zsoft * 255 + 0.5) == 0).astype(np.uint8), (W_, H_), interpolation=cv2.INTER_NEAREST) > 0
                ov[z0] = (0.5 * ov[z0] + 0.5 * np.array([0, 0, 255])).astype(np.uint8)
            uvs = np.stack([s.U.reshape(-1), s.V.reshape(-1)], 1)
            def mark(mask, col):
                for i in np.nonzero(mask)[0]:
                    p = (uvs[s.tri[i]] * [W_, H_]).astype(np.int32)
                    cv2.fillConvexPoly(ov, p, col)
            mark(a['str_max'] > 8, (255, 160, 0)); mark(a['flip_u'], (0, 255, 255)); mark(a['clip_u'], (255, 0, 255))
            # okno záberu v pokoji
            u0 = 0.5 + s.eye[0] / s.pw; v0 = 0.5 - s.eye[1] / s.ph; hu = s.vw / 2 / s.pw; hv = s.vh / 2 / s.ph
            cv2.rectangle(ov, (int((u0 - hu) * W_), int((v0 - hv) * H_)), (int((u0 + hu) * W_), int((v0 + hv) * H_)), (255, 255, 255), 1)
            cv2.putText(ov, f'{dev} {name}: zlte=preklopene  fialove=blizka rovina  modre=natiahnutie>8  cervene=alfa 0 (vZ=0)', (6, 18), 0, 0.42, (255, 255, 255), 1)
            panels = [ov]
            # náhľad v pokoji (t=0,5) s alfou 0 načierno, a najhoršia poloha s dierami (zelené)
            cam, tgt = place(s, P, 0.5, P['AMT'])
            r, mp = evaluate(s, P, cam, tgt, P['AMT'], cw, ch, scale, want_img=True)
            pv = mp['img'].copy(); pv[mp['amap'] == 2] = (0, 0, 0); pv[mp['holes']] = (0, 255, 0)
            cv2.putText(pv, f'pokoj t=0.5: alfa0={r["alpha0_frac"]*100:.1f} % (cierne), diery={r["hole_px"]} px (zelene)', (6, 18), 0, 0.42, (0, 255, 255), 1)
            panels.append(pv)
            if worst_hole:
                camw, tgtw, amtw = np.array(worst_hole[3]), np.array(worst_hole[4]), worst_hole[5]
                r2, mp2 = evaluate(s, P, camw, tgtw, amtw, cw, ch, scale, want_img=True)
                pw_ = mp2['img'].copy(); pw_[mp2['holes']] = (0, 255, 0)
                cv2.putText(pw_, ('najviac dier: ' + worst_hole[2])[:110], (6, 18), 0, 0.38, (0, 255, 255), 1)
                cv2.putText(pw_, f'diery {r2["hole_px"]} px = {r2["hole_frac"]*100:.2f} % okna (zelene)', (6, 36), 0, 0.42, (0, 255, 255), 1)
                panels.append(pw_)
            hh = 360
            row = [cv2.resize(p_, (int(p_.shape[1] * hh / p_.shape[0]), hh)) for p_ in panels]
            out_img = np.hstack(row)
            fn = os.path.join(args.out, f'mapa-{dev}-{pi:02d}-{name}.jpg')
            cv2.imwrite(fn, out_img, [cv2.IMWRITE_JPEG_QUALITY, 86])
            summary.setdefault(dev, {})[f'{pi:02d}-{name}'] = dict(
                polohy=a['poses'], preklopene_max=a['worst']['flipped'], blizka_rovina_max=a['worst']['clipped'],
                za_kamerou_max=a['worst']['behind'], natiahnutie_max=a['worst']['max_stretch'],
                diery_px_max=a['worst']['hole_px'], polohy_s_dierami=a['holes_any'],
                diery_zoznam=sorted(a['hole_desc'], reverse=True)[:12],
                alfa0_pokoj_podiel_okna=[round(min(a['alpha0_rest']) * 100, 2), round(max(a['alpha0_rest']) * 100, 2)] if a['alpha0_rest'] else None,
                preklopene_unia=int(a['flip_u'].sum()), blizka_unia=int(a['clip_u'].sum()), natiahnutie8_unia=int((a['str_max'] > 8).sum()),
                mapa=fn)
            w = summary[dev][f'{pi:02d}-{name}']
            print(f'   {pi:02d} {name:13s} polôh {a["poses"]:4d} | preklopené max {w["preklopene_max"][0]:5d} | blízka rovina max {w["blizka_rovina_max"][0]:4d} '
                  f'| natiahnutie max {w["natiahnutie_max"][0]:7.2f} | diery max {w["diery_px_max"][0]:6d} px v {a["holes_any"]} polohách '
                  f'| alfa 0 v pokoji {w["alfa0_pokoj_podiel_okna"]} % okna')
    with open(os.path.join(args.out, 'k3-suhrn.json'), 'w') as f:
        json.dump(summary, f, ensure_ascii=False, indent=1, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
    print('súhrn:', os.path.join(args.out, 'k3-suhrn.json'))



# ---------------------------------------------------------------- prechody: diery až po skladaní (post shader)
def _ss(a, b, x):
    t = np.clip((x - a) / np.where(np.abs(b - a) < 1e-9, 1e-9, b - a), 0, 1)
    return t * t * (3 - 2 * t)


def _sample(tex, u, v):
    """texture2D s MirroredRepeat a LinearFilter; tex (RH, RW, C) s riadkom 0 hore, u, v ako vUv (v nahor)."""
    RH, RW = tex.shape[:2]
    mx = (u * RW - 0.5).astype(np.float32); my = ((1 - v) * RH - 0.5).astype(np.float32)
    return cv2.remap(tex, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def composite(kind, x, TA, TB, f1, f2, dS, uLead, asp, CK):
    """Kópia vetiev post shadera (bez rozmazania). TA/TB: (RH, RW, 5) = B, G, R, diera, alfa. Vráti (RH, RW, 4) = farba + podiel diery."""
    RH, RW = TA.shape[:2]
    jj, ii = np.meshgrid((np.arange(RW) + 0.5) / RW, 1 - (np.arange(RH) + 0.5) / RH)
    u, v = jj.astype(np.float32), ii.astype(np.float32)
    A0 = _sample(TA, u, v); B0 = _sample(TB, u, v)
    aa, ba = A0[..., 4], B0[..., 4]
    s_ = math.sin(math.pi * x)
    if kind == 0:
        o = np.maximum(aa, ba); w = _ss(o * 0.55, o * 0.55 + 0.45, x)
        out = A0[..., :4] * (1 - w[..., None]) + B0[..., :4] * w[..., None]
    elif kind == 1:
        lat = (dS[0] or dS[1])
        if lat:
            h = np.clip(((u - 0.5) * dS[0] + (v - 0.5) * dS[1]) * 0.9 + 0.5, 0, 1)
        else:
            q = np.stack([(u - f1[0]) * asp, v - f1[1]], -1)
            h = 1 - np.clip(np.linalg.norm(q, axis=-1) / max(asp, 1) * 1.3, 0, 1)
        t0 = 0.6 * (1 - h) + 0.12 * np.maximum(aa, ba); w = _ss(t0, t0 + 0.22, x)
        out = A0[..., :4] * (1 - w[..., None]) + B0[..., :4] * w[..., None]
    elif kind == 2:
        cx = math.cos(math.pi * x); Pp = (2 - 3 * cx + cx ** 3) * 0.25
        sh = (dS[0] * CK['sx'], dS[1] * CK['sy']); m = float(_ss(0.45, 0.55, x))
        Aa = _sample(TA, u + sh[0] * Pp, v + sh[1] * Pp); Bb = _sample(TB, u - sh[0] * (1 - Pp), v - sh[1] * (1 - Pp))
        out = Aa[..., :4] * (1 - m) + Bb[..., :4] * m
    elif kind == 3:
        qx, qy = u - f1[0], v - f1[1]; q2x, q2y = u - f2[0], v - f2[1]
        den = math.hypot(max(f1[0], 1 - f1[0]) * asp, max(f1[1], 1 - f1[1]))
        r = np.clip(np.hypot(qx * asp, qy) / den, 0, 1); t0 = 0.39 + 0.14 * r; m = _ss(t0, t0 + 0.08, x)
        zA = 1 + CK['za'] * x * x; k = CK['kz'] * s_ * s_
        Aa = _sample(TA, f1[0] + qx * (1 - k / 2) / zA, f1[1] + qy * (1 - k / 2) / zA)
        Bb = _sample(TB, f2[0] + q2x * (1 - k / 2), f2[1] + q2y * (1 - k / 2))
        out = Aa[..., :4] * (1 - m[..., None]) + Bb[..., :4] * m[..., None]
    else:
        md = (-dS[0], -dS[1]); pd = (md[1], -md[0])
        uu = (u - 0.5) * md[0] + (v - 0.5) * md[1] + 0.5; ww = (u - 0.5) * pd[0] + (v - 0.5) * pd[1] + 0.5
        wF = (f1[0] - 0.5) * pd[0] + (f1[1] - 0.5) * pd[1] + 0.5
        R0 = -0.15
        L = uLead + (1 + CK['pe'] - uLead) * float(_ss(0.0, 0.56, x)); R = R0 + (1 + CK['pe'] - R0) * float(_ss(0.2, 0.86, x))
        g = float(_ss(0.0, 0.5, x)); fill = float(_ss(0.04, 0.26, x)); kk = (L - R) / max(uLead - R0, 0.05)
        us = R0 + (uu - R) / kk; ws = wF + (ww - wF) / kk
        inside = _ss(0.0, 0.12 * g + 1e-4, us)
        psx = np.clip(0.5 + md[0] * (us - 0.5) + pd[0] * (ws - 0.5), 0.002, 0.998)
        psy = np.clip(0.5 + md[1] * (us - 0.5) + pd[1] * (ws - 0.5), 0.002, 0.998)
        O = _sample(TA, psx.astype(np.float32), psy.astype(np.float32))
        oa = 1 + (O[..., 4] - 1) * inside
        pw = CK['pw'] * (0.4 + 0.6 * g)
        bow = CK['bow'] * g * (1 - np.minimum(1, 4 * (ww - wF) ** 2)); Re = R - bow; Le = L + bow
        near_ = _ss(0.5, 0.78, oa)
        cov = _ss(Re - pw, Re + pw, uu) * (1 - _ss(Le - pw, Le + pw, uu)) * (near_ + (1 - near_) * fill)
        useB = (uu < Re + 2 * pw) & (fill >= 1)
        base = np.where(useB[..., None], B0[..., :4], A0[..., :4])
        oc = O[..., :4].copy(); oc[..., :3] *= (1 - CK['pd'] * g)
        out = base * (1 - cov[..., None]) + oc * cov[..., None]
    return out


def transitions(args):
    web = args.web
    film_js = os.path.join(web, 'assets/film.js'); html = os.path.join(web, args.stranka)
    os.makedirs(args.out, exist_ok=True)
    overrides = [(kv.split('=', 1)[0], json.loads(kv.split('=', 1)[1])) for kv in args.param]
    INK = np.array([12, 13, 14], np.float32)   # 0x0e0d0c v BGR
    report = {}
    for dev in args.zariadenie.split(','):
        phone = dev == 'telefon'
        P = load_params(film_js, phone, overrides)
        cw, ch = [int(x) for x in (args.telefon if phone else args.pc).split('x')]
        scale = 0.5 if not phone else 1.0
        sh = [Shot(s, P, phone, cw, ch, web) for s in parse_shots(html, phone, P)]
        AMT = P['AMT']; span = 0.3; asp = cw / ch
        drifts = [(1, 1, 1), (-1, -1, -1)]; mice = [(0, 0)] if phone else [(0, 0), (-0.5, 0.5)]
        for k in range(len(sh) - 1):
            A, B = sh[k], sh[k + 1]
            if args.zabery and B.name not in args.zabery.split(',') and A.name not in args.zabery.split(','):
                continue
            cut = parse_cut(B.cut or P['CUTS'].get(A.name + '>' + B.name), phone, P)
            if cut and cut['k'] == 4 and not (B if cut['own'] == 'b' else A).has_depth:
                cut = dict(cut, k=1, name='pohyb')
            amp = P['AMP_K4'] if (cut and cut['k'] == 4) else P['AMP_INE']
            kind = cut['k'] if cut else 0
            rev = bool(cut and (cut['name'] == 'odjazd' or (cut['k'] == 4 and cut['own'] == 'b')))
            key = f'{A.name}>{B.name}'
            worst = None; rows = []
            for mix in np.round(np.arange(0.04, 0.97, 0.08), 2):
                u_ = 0.5 - math.sin(math.asin(1 - 2 * mix) / 3)
                S = k + 0.5 - span / 2 + span * u_
                for d in drifts:
                    for m in mice:
                        rend = {}
                        for role, s_, push, amt in (('A', A, mix, AMT + amp * mix), ('B', B, -(1 - mix), AMT + amp - amp * mix)):
                            cam, tgt = place(s_, P, shot_t(s_, S, P), amt, d, m, push, cut)
                            r, mp = evaluate(s_, P, cam, tgt, amt, cw, ch, scale, want_alpha=False, full=True, want_vz=True)
                            pt = s_.pt_of(cut[role.lower()]) if (cut and cut.get(role.lower())) else [s_.eye[0], s_.eye[1]]
                            c4 = mp['Pm'] @ mp['V'] @ np.array([pt[0], pt[1], 0, 1.0]); f = [c4[0] / c4[3] * 0.5 + 0.5, c4[1] / c4[3] * 0.5 + 0.5]
                            rend[role] = (r, mp, f, cam, tgt, amt)
                        fA, fB = rend['A'][2], rend['B'][2]
                        dS = ([-cut['dir'][0], -cut['dir'][1]] if rev else cut['dir']) if cut else [0, 0]
                        f1, f2 = (fB, fA) if rev else (fA, fB)
                        uLead = 0.5 - (f1[0] - 0.5) * dS[0] - (f1[1] - 0.5) * dS[1]
                        def tex(role):
                            mp = rend[role][1]
                            t = np.zeros(mp['holes'].shape + (5,), np.float32)
                            t[..., 3] = mp['holes']; t[..., 4] = mp['vz']
                            return t
                        TA, TB = (tex('B'), tex('A')) if rev else (tex('A'), tex('B'))
                        x = 1 - mix if rev else mix
                        out = composite(kind, x, TA, TB, f1, f2, dS, uLead, asp, P['CK'])
                        bandH = int(round(ch * scale * (B.band if not B.pro else 1)))
                        D = out[:bandH, :, 3]
                        vis = int((D > 0.3).sum())
                        row = dict(mix=float(mix), drift=d, mys=m, diery_A=int(rend['A'][1]['holes'][:bandH].sum()), diery_B=int(rend['B'][1]['holes'][:bandH].sum()),
                                   viditelne_px=vis, viditelne_pct=round(vis / D.size * 100, 3), max_podiel=round(float(D.max()), 3))
                        rows.append(row)
                        if vis and (not worst or vis > worst[0]):
                            worst = (vis, row, {r_: (rend[r_][3], rend[r_][4], rend[r_][5]) for r_ in 'AB'}, (f1, f2, dS, uLead, x))
            tot = sum(1 for r_ in rows if r_['viditelne_px'])
            mx = max(rows, key=lambda r_: r_['viditelne_px'])
            raw = max(rows, key=lambda r_: max(r_['diery_A'], r_['diery_B']))
            print(f'{dev} {key:24s} strih={cut["name"] if cut else "prelinanie"}{" (odzadu)" if rev else ""} | diery v textúrach max A {max(r_["diery_A"] for r_ in rows)} B {max(r_["diery_B"] for r_ in rows)} px '
                  f'| po skladaní viditeľné (podiel diery > 0,3) v {tot}/{len(rows)} polohách, max {mx["viditelne_px"]} px = {mx["viditelne_pct"]} % pri mix={mx["mix"]} drift={mx["drift"]} myš={mx["mys"]}')
            report.setdefault(dev, {})[key] = dict(strih=cut['name'] if cut else 'prelinanie', odzadu=rev, polohy=rows)
            if worst:
                # obrázok: zložený záber s dierami vo farbe plátna (zelený obrys)
                imgs = {}
                for r_ in 'AB':
                    s_ = A if r_ == 'A' else B
                    cam, tgt, amt = worst[2][r_]
                    rr, mp = evaluate(s_, P, cam, tgt, amt, cw, ch, scale, want_alpha=False, full=True, want_vz=True, want_img=True)
                    t = np.zeros(mp['holes'].shape + (5,), np.float32)
                    t[..., :3] = mp['img']; t[mp['holes'], :3] = INK; t[..., 3] = mp['holes']; t[..., 4] = mp['vz']
                    imgs[r_] = t
                f1, f2, dS, uLead, x = worst[3]
                TA, TB = (imgs['B'], imgs['A']) if rev else (imgs['A'], imgs['B'])
                out = composite(kind, x, TA, TB, f1, f2, dS, uLead, asp, P['CK'])
                bandH = int(round(ch * scale * (B.band if not B.pro else 1)))
                pic = np.clip(out[:bandH, :, :3], 0, 255).astype(np.uint8).copy()
                mask = (out[:bandH, :, 3] > 0.3).astype(np.uint8)
                cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(pic, cnts, -1, (0, 255, 0), 2)
                w_ = worst[1]
                cv2.putText(pic, f'{dev} {key} mix={w_["mix"]} drift={w_["drift"]} mys={w_["mys"]}: viditelne diery {w_["viditelne_px"]} px ({w_["viditelne_pct"]} %)', (6, 18), 0, 0.45, (0, 255, 255), 1)
                fn = os.path.join(args.out, f'prechod-{dev}-{k:02d}-{A.name}-{B.name}.jpg')
                cv2.imwrite(fn, pic, [cv2.IMWRITE_JPEG_QUALITY, 86])
                report[dev][key]['obrazok'] = fn
    with open(os.path.join(args.out, 'k3-prechody.json'), 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)


# ---------------------------------------------------------------- porovnanie so záznamom
def compare(args):
    """Každú snímku záznamu priradí k fotke záberu (SIFT + homografia), nájde v nej čierne škvrny
    (tmavé na zázname, ale svetlé na fotke) a porovná ich s mapou alfy 0 (vZ = 0 po zjemnení)."""
    web = args.web
    film_js = os.path.join(web, 'assets/film.js')
    P = load_params(film_js, False, [])
    shots = parse_shots(os.path.join(web, args.stranka), False, P)
    sift = cv2.SIFT_create(4000)
    ref = {}
    for s in shots:
        if s['name'] in ref:
            continue
        cand = sorted(glob.glob(os.path.join(web, 'assets/img/film', s['photo'] + '-[0-9]*.webp')), key=lambda p: int(re.findall(r'-(\d+)\.webp$', p)[0]))
        img = cv2.resize(cv2.imread(cand[0]), (768, 512))
        d = cv2.imread(os.path.join(web, 'assets/img/film', s['photo'] + '-hlbka.webp'))[..., 2]
        z, _ = soften(d, P)
        a0 = cv2.resize((np.floor(z * 255 + 0.5) == 0).astype(np.uint8), (768, 512), interpolation=cv2.INTER_NEAREST)
        kp, de = sift.detectAndCompute(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), None)
        # okno záberu v pokoji (plátno args.pc), zmenšené o 10 % (pohyb kamery, lišty Safari a Docku mimo)
        sh = Shot(s, P, False, *[int(x) for x in args.pc.split('x')], web)
        u0 = 0.5 + sh.eye[0] / sh.pw; v0 = 0.5 - sh.eye[1] / sh.ph; hu = 0.9 * sh.vw / 2 / sh.pw; hv = 0.9 * sh.vh / 2 / sh.ph
        win = np.zeros((512, 768), np.uint8); win[int((v0 - hv) * 512):int((v0 + hv) * 512), int((u0 - hu) * 768):int((u0 + hu) * 768)] = 1
        ref[s['name']] = dict(img=img, a0=a0, kp=kp, de=de, win=win)
    bf = cv2.BFMatcher()
    rows = []
    os.makedirs(args.out, exist_ok=True)
    frames = sorted(glob.glob(os.path.join(args.snimky, 'z*.jpg')))
    for fp in frames:
        fr = cv2.imread(fp); g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        kp, de = sift.detectAndCompute(g, None)
        best = None
        if de is None or len(kp) < 20:
            rows.append(dict(snimka=os.path.basename(fp), zaber=None)); continue
        for n, r in ref.items():
            ms = bf.knnMatch(de, r['de'], k=2)
            good = [m for m, m2 in (x for x in ms if len(x) == 2) if m.distance < 0.7 * m2.distance]
            if len(good) < 25:
                continue
            src = np.float32([r['kp'][m.trainIdx].pt for m in good]); dst = np.float32([kp[m.queryIdx].pt for m in good])
            H, inl = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
            if H is None:
                continue
            ni = int(inl.sum())
            if not best or ni > best[1]:
                best = (n, ni, H)
        if not best or best[1] < 30:
            rows.append(dict(snimka=os.path.basename(fp), zaber=None)); continue
        n, ni, H = best; r = ref[n]
        hw = (fr.shape[1], fr.shape[0])
        warp = cv2.warpPerspective(r['img'], H, hw)
        valid = cv2.warpPerspective(np.ones((512, 768), np.uint8), H, hw, flags=cv2.INTER_NEAREST) > 0
        valid = cv2.erode(valid.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
        valid &= cv2.warpPerspective(r['win'], H, hw, flags=cv2.INTER_NEAREST) > 0
        a0w = cv2.warpPerspective(r['a0'], H, hw, flags=cv2.INTER_NEAREST) > 0
        vf = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)[..., 2].astype(int); vp = cv2.cvtColor(warp, cv2.COLOR_BGR2HSV)[..., 2].astype(int)
        black = valid & (vf < 28) & (vp > 70)                     # čierne na zázname, svetlé na fotke
        black = cv2.morphologyEx(black.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        nlab, lab, st, _ = cv2.connectedComponentsWithStats(black)
        spots = [i for i in range(1, nlab) if st[i, cv2.CC_STAT_AREA] >= 150]
        bm = np.isin(lab, spots)
        inter = int((bm & a0w).sum()); uni = int((bm | (a0w & valid)).sum())
        cov = inter / max(1, int(bm.sum()))                        # podiel čiernych škvŕn vo vZ = 0
        prec = inter / max(1, int((a0w & valid).sum()))            # podiel vZ = 0 okna, ktorý je čierny
        bright = valid & (vp > 70); dark_f = vf < 28
        p_in = float((dark_f & bright & a0w).sum() / max(1, (bright & a0w).sum()))      # P(čierne | alfa 0, fotka svetlá)
        p_out = float((dark_f & bright & ~a0w).sum() / max(1, (bright & ~a0w).sum()))   # P(čierne | alfa > 0, fotka svetlá)
        rows.append(dict(snimka=os.path.basename(fp), zaber=n, inliers=ni, skvrny=len(spots), cierne_px=int(bm.sum()),
                         p_cierne_alfa0=round(p_in, 3), p_cierne_inde=round(p_out, 4), svetle_alfa0_px=int((bright & a0w).sum()),
                         alfa0_px=int((a0w & valid).sum()), skvrny_v_alfa0=round(cov, 3), alfa0_cierne=round(prec, 3), iou=round(inter / max(1, uni), 3)))
        if args.vyrezy and bm.sum() >= 150:
            vis = fr.copy()
            cnts, _ = cv2.findContours(bm.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnt2, _ = cv2.findContours((a0w & valid).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis, cnts, -1, (0, 255, 0), 2); cv2.drawContours(vis, cnt2, -1, (0, 0, 255), 1)
            cv2.imwrite(os.path.join(args.out, 'porovnanie-' + os.path.basename(fp)), np.hstack([fr, vis, warp]), [cv2.IMWRITE_JPEG_QUALITY, 85])
    with open(os.path.join(args.out, 'k3-porovnanie.json'), 'w') as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    for r in rows:
        if r.get('zaber'):
            print(f"{r['snimka']} {r['zaber']:13s} inl={r['inliers']:4d} škvŕn={r['skvrny']} čierne={r['cierne_px']:6d} px  alfa0 okna={r['alfa0_px']:6d} px  "
                  f"škvrny v alfa0={r['skvrny_v_alfa0']:.2f}  alfa0 čierna={r['alfa0_cierne']:.2f}  IoU={r['iou']:.2f}  "
                  f"P(čierne|alfa0)={r['p_cierne_alfa0']:.2f} ({r['svetle_alfa0_px']} px)  P(čierne|inde)={r['p_cierne_inde']:.3f}")
        else:
            print(r['snimka'], '-')



# ---------------------------------------------------------------- skvrny: súvislé oblasti s alfou 0 v okne záberu
def spots(args):
    """Režim skvrny: pre každý záber v pokoji (bez prechodu, kreslí sa rovno na obrazovku s alfou = vZ) nájde
    súvislé oblasti okna, kde je zjemnená hĺbka presne 0 (alfa 0). Pokoj = t 0 / 0,5 / 1, dýchanie v krajných
    polohách a (počítač) myš. Vypíše tabuľku, uloží k3-skvrny.json a obrázok skvrny-<zariadenie>-<záber>.jpg
    (čierne = alfa 0 pri t = 0,5 bez dýchania, červený obrys = zjednotenie cez všetky pokojné polohy)."""
    web = args.web
    film_js = os.path.join(web, 'assets/film.js'); html = os.path.join(web, args.stranka)
    os.makedirs(args.out, exist_ok=True)
    overrides = [(kv.split('=', 1)[0], json.loads(kv.split('=', 1)[1])) for kv in args.param]
    sel = set(args.zabery.split(',')) if args.zabery else None
    report = {}; total = 0
    for dev in args.zariadenie.split(','):
        phone = dev == 'telefon'
        P = load_params(film_js, phone, overrides)
        cw, ch = [int(x) for x in (args.telefon if phone else args.pc).split('x')]
        scale = 1.0 if phone else 0.5
        sh = [Shot(s, P, phone, cw, ch, web) for s in parse_shots(html, phone, P)]
        drifts = [(0, 0, 0), (1, 1, 1), (-1, -1, -1), (1, -1, 1), (-1, 1, -1)]
        mice = [(0, 0)] if phone else [(0, 0), (0.5, 0.5), (-0.5, -0.5)]
        for s in sh:
            if sel and s.name not in sel:
                continue
            union = None; base = None; rest = None
            for t in (0, 0.5, 1):
                for d in drifts:
                    for m in mice:
                        cam, tgt = place(s, P, t, P['AMT'], d, m)
                        want = t == 0.5 and d == (0, 0, 0) and m == (0, 0)
                        r, mp = evaluate(s, P, cam, tgt, P['AMT'], cw, ch, scale, want_img=want)
                        a0 = mp['amap'] == 2
                        union = a0 if union is None else (union | a0)
                        if want:
                            base = mp['img'].copy(); rest = a0
            RH, RW = union.shape
            def comps(mask):
                n, lab, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
                out = []
                for i in range(1, n):
                    area = int(st[i, cv2.CC_STAT_AREA])
                    if area / scale / scale < args.min_px:
                        continue
                    x, y, w, h = [int(v) for v in st[i, :4]]
                    out.append(dict(plocha_px=int(round(area / scale / scale)), podiel_okna_pct=round(area / mask.size * 100, 2),
                                    stred_pct=[round(cen[i][0] / RW * 100, 1), round(cen[i][1] / RH * 100, 1)],
                                    ramcek_pct=[round(x / RW * 100, 1), round(y / RH * 100, 1), round((x + w) / RW * 100, 1), round((y + h) / RH * 100, 1)]))
                return sorted(out, key=lambda c: -c['plocha_px'])
            c_rest = comps(rest); c_union = comps(union)
            key = f'{s.pi:02d}-{s.name}'
            report.setdefault(dev, {})[key] = dict(okno_px=[cw, int(round(ch * s.band))], pokoj_t05=c_rest, zjednotenie_pokoj=c_union,
                                                    alfa0_pokoj_t05_pct=round(rest.mean() * 100, 2), alfa0_zjednotenie_pct=round(union.mean() * 100, 2))
            total += len(c_union)
            pic = base.copy(); pic[rest] = (0, 0, 0)
            cnts, _ = cv2.findContours(union.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(pic, cnts, -1, (0, 0, 255), 1)
            for i, c in enumerate(c_union, 1):
                cx, cy = int(c['stred_pct'][0] / 100 * RW), int(c['stred_pct'][1] / 100 * RH)
                cv2.putText(pic, str(i), (cx, cy), 0, 0.7, (0, 255, 255), 2)
            cv2.putText(pic, f'{dev} {s.name}: alfa 0 v pokoji t=0.5 {rest.mean()*100:.2f} % okna (cierne), zjednotenie {union.mean()*100:.2f} % (cerveny obrys), {len(c_union)} oblasti', (6, 18), 0, 0.42, (0, 255, 255), 1)
            fn = os.path.join(args.out, f'skvrny-{dev}-{s.pi:02d}-{s.name}.jpg')
            cv2.imwrite(fn, pic, [cv2.IMWRITE_JPEG_QUALITY, 88])
            report[dev][key]['obrazok'] = fn
            desc = '; '.join(f"#{i} {c['plocha_px']} px ({c['podiel_okna_pct']} % okna) stred x {c['stred_pct'][0]} % y {c['stred_pct'][1]} %" for i, c in enumerate(c_union, 1)) or '-'
            print(f'{dev} {key:16s} okno {cw}x{int(round(ch * s.band))} | alfa 0 v pokoji t=0,5: {rest.mean()*100:5.2f} % | zjednotenie pokojných polôh: {union.mean()*100:5.2f} % | oblasti ≥ {args.min_px} px: {len(c_union)} | {desc}', flush=True)
    with open(os.path.join(args.out, 'k3-skvrny.json'), 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print(f'spolu oblastí alfa 0 (všetky zariadenia a zábery): {total}')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('rezim', nargs='?', default='simuluj', choices=['simuluj', 'porovnaj', 'prechody', 'skvrny'])
    ap.add_argument('--web', required=True, help='priečinok barbershop-30')
    ap.add_argument('--stranka', default='index.html')
    ap.add_argument('--out', required=True)
    ap.add_argument('--zariadenie', default='pc,telefon')
    ap.add_argument('--pc', default='1440x900'); ap.add_argument('--telefon', default='390x844')
    ap.add_argument('--zabery', default='')
    ap.add_argument('--param', action='append', default=[], help='prepis parametra kódu, napr. AMT=0.3 alebo SEG=[128,96]')
    ap.add_argument('--snimky', help='porovnaj: priečinok so snímkami záznamu z###.jpg')
    ap.add_argument('--vyrezy', action='store_true', help='porovnaj: uložiť obrázky porovnania (len snímky so škvrnami)')
    ap.add_argument('--min-px', type=int, default=100, help='skvrny: najmenšia oblasť alfa 0 v pixeloch plátna')
    a = ap.parse_args()
    {'porovnaj': compare, 'prechody': transitions, 'skvrny': spots}.get(a.rezim, run)(a)
