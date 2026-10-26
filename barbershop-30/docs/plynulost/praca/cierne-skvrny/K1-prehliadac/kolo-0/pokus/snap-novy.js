    // surové pixely kresliaceho buffra filmu (gl.readPixels, bez prepočtov 2D plátna) a dva pohľady naň:
    //  chromium = ako ich skladá Chromium (premultiplikovaná alfa nad pozadím stránky; rgb > alfa sa pripočíta, nič nestmavne)
    //  safari   = model podľa záznamu majiteľa: pixel s alfou presne 0 je priehľadný, vidno pozadie stránky (#0e0d0c)
    grab(cv, W, H) {
      const gl = cv.getContext('webgl2') || cv.getContext('webgl');
      if (!gl) return null;
      const DW = gl.drawingBufferWidth, DH = gl.drawingBufferHeight, n4 = DW * DH * 4;
      if (!this.px || this.px.length !== n4) this.px = new Uint8Array(n4);
      const px = this.px, rb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING), pb = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); if (pb) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.readPixels(0, 0, DW, DH, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rb); if (pb) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pb);
      const N = W * H, ink = this.ink;
      const V = { chromium: { rgb: new Uint8Array(N * 3), L: new Uint8Array(N) }, safari: { rgb: new Uint8Array(N * 3), L: new Uint8Array(N) } };
      const A0 = new Uint8Array(N);                            // podiel pixelov s alfou 0 (0..255)
      const stp = Math.max(1, Math.floor(DW / W / 2));
      let a0all = 0, a16 = 0, cnt = 0;
      for (let ay = 0; ay < H; ay++) {
        const y0 = Math.floor(ay * DH / H), y1 = Math.max(y0 + 1, Math.floor((ay + 1) * DH / H));
        for (let ax = 0; ax < W; ax++) {
          const x0 = Math.floor(ax * DW / W), x1 = Math.max(x0 + 1, Math.floor((ax + 1) * DW / W));
          let cr = 0, cg = 0, cb = 0, sr = 0, sg = 0, sb = 0, z = 0, m = 0;
          for (let yy = y0; yy < y1; yy += stp) {
            const row = (DH - 1 - yy) * DW;                      // readPixels má riadky zdola
            for (let xx = x0; xx < x1; xx += stp) {
              const p = (row + xx) * 4, a = px[p + 3], k = (255 - a) / 255;
              const r = Math.min(255, px[p] + k * ink[0]), g = Math.min(255, px[p + 1] + k * ink[1]), b = Math.min(255, px[p + 2] + k * ink[2]);
              cr += r; cg += g; cb += b;
              if (a === 0) { z++; sr += ink[0]; sg += ink[1]; sb += ink[2]; } else { sr += r; sg += g; sb += b; }
              if (a < 16) a16++;
              m++;
            }
          }
          const i = ay * W + ax;
          V.chromium.rgb[i * 3] = cr / m; V.chromium.rgb[i * 3 + 1] = cg / m; V.chromium.rgb[i * 3 + 2] = cb / m;
          V.safari.rgb[i * 3] = sr / m; V.safari.rgb[i * 3 + 1] = sg / m; V.safari.rgb[i * 3 + 2] = sb / m;
          V.chromium.L[i] = (54 * cr / m + 183 * cg / m + 19 * cb / m) / 256; V.safari.L[i] = (54 * sr / m + 183 * sg / m + 19 * sb / m) / 256;
          A0[i] = Math.round(z / m * 255); a0all += z; cnt += m;
        }
      }
      return { V, A0, DW, DH, a0: a0all / cnt, a16: a16 / cnt };
    },
    // súvislé oblasti masky (8-susednosť) s plochou aspoň minA
    comps(mask, W, H, minA) {
      const N = W * H, lab = new Int32Array(N), q = new Int32Array(N); let qn = 0; const out = [];
      for (let i0 = 0; i0 < N; i0++) {
        if (!mask[i0] || lab[i0]) continue;
        const start = qn; lab[i0] = 1; q[qn++] = i0;
        let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (let h = start; h < qn; h++) {
          const i = q[h], xx = i % W, yy = (i - xx) / W;
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
          for (let dy = -1; dy <= 1; dy++) { const ny = yy + dy; if (ny < 0 || ny >= H) continue; for (let dx = -1; dx <= 1; dx++) { const nx = xx + dx; if (nx < 0 || nx >= W) continue; const j = ny * W + nx; if (mask[j] && !lab[j]) { lab[j] = 1; q[qn++] = j; } } }
        }
        if (qn - start >= minA) out.push({ px: q.slice(start, qn), area: qn - start, x0, y0, x1, y1 });
      }
      return out;
    },
    snap(o) {
      const t0 = performance.now(), api = window.BS30_FILM, cv = document.querySelector('canvas.film-canvas');
      if (!api || !cv || !cv.width) return { err: 'film nebeží (chýba BS30_FILM alebo plátno)' };
      const st = api.state, aspect = cv.width / cv.height, phone = st.phone;
      const W = aspect >= 1 ? o.sirka : Math.round(o.sirka * aspect), H = aspect >= 1 ? Math.round(o.sirka / aspect) : o.sirka, N = W * H;
      const G = this.grab(cv, W, H);
      if (!G) return { err: 'bez WebGL kontextu plátna' };
      const k = Math.max(0, Math.floor(st.S)), info = this.info || [];
      let jas = 0; for (let i = 0; i < N; i++) jas += G.V.chromium.L[i];
      const res = { y: Math.round(scrollY), S: +st.S.toFixed(4), T: +st.T.toFixed(4), mix: +st.mix.toFixed(3), cut: st.cut, cur: st.current, pro: !!(st.pro || st.leaving || st.outside),
        A: info[k] && info[k].photo, B: info[k + 1] && info[k + 1].photo, dpr: st.dpr, cw: G.DW, ch: G.DH, jas: Math.round(jas / N),
        alfa0: +(G.a0 * 100).toFixed(2), alfa16: +(G.a16 * 100).toFixed(2), kand: 0, spots: [], podozrenia: [] };
      const minA = Math.max(4, Math.round(N * o.plocha / 100));
      // kandidáti v každom pohľade; pri značke len zelená v pohľade chromium
      const views = o.znacka ? ['chromium'] : ['safari', 'chromium'];
      const cand = [];
      for (const vn of views) {
        const v = G.V[vn], mask = new Uint8Array(N);
        for (let i = 0; i < N; i++) {
          if (o.znacka) { const r = v.rgb[i * 3], g = v.rgb[i * 3 + 1], b = v.rgb[i * 3 + 2]; mask[i] = g > 110 && r < 70 && b < 70 && g > 2.2 * Math.max(r, b) ? 1 : 0; }
          else mask[i] = v.L[i] < o.prah ? 1 : 0;
        }
        for (const c of this.comps(mask, W, H, minA)) { c.view = vn; cand.push(c); }
      }
      res.kand = cand.length;
      if (!cand.length) { res.ms = Math.round(performance.now() - t0); return res; }
      // referencia: pri mix 0 záber, ktorý najlepšie sedí na plátno (k alebo k+1, pri skoku aj susedia); pri prechode zábery, ktoré sedia
      const pairMix = st.mix > 0.001, Lc = G.V.chromium.L;
      const refs = [];
      for (const i of pairMix ? [k, k + 1] : [k - 1, k, k + 1, k + 2]) {
        const s = info[i]; if (!s) continue;
        const r = this.refLuma(s, st.S, W, H, aspect, phone); if (!r) continue;
        let e = 0, n = 0; for (let p = 0; p < N; p += 7) if (r.known[p] && Lc[p] >= o.prah) { e += Math.abs(r.L[p] - Lc[p]); n++; }
        refs.push({ photo: s.photo, r, mae: n ? e / n : 999 });
      }
      refs.sort((a, b) => a.mae - b.mae);
      const use = refs.length ? (pairMix ? refs.filter((r) => r.mae <= refs[0].mae + 12) : refs.slice(0, 1)) : [];
      res.ref = use.map((r) => ({ photo: r.photo, mae: +r.mae.toFixed(1) }));
      const rad = Math.max(2, Math.round(W * (pairMix ? 2 * o.tol : o.tol) / 100));
      const er = use.map((r) => ({ E: this.erode(r.r.L, W, H, rad), known: r.r.known }));
      const rect = cv.getBoundingClientRect(), ink = this.ink;
      let pe = null;
      for (const cp of cand) {
        const v = G.V[cp.view];
        let sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0, unexp = 0, kn = 0, refSum = 0, z = 0;
        for (const i of cp.px) {
          sr += v.rgb[i * 3]; sg += v.rgb[i * 3 + 1]; sb += v.rgb[i * 3 + 2]; sl += v.L[i]; sl2 += v.L[i] * v.L[i]; z += G.A0[i];
          if (er.length) {
            let all = true, mn = 255;
            for (const e of er) { if (!e.known[i]) { all = false; break; } if (e.E[i] < mn) mn = e.E[i]; }
            if (all) { kn++; refSum += mn; if (mn >= o.refJas) unexp++; }
          }
        }
        const n = cp.area, ml = sl / n, sd = Math.sqrt(Math.max(0, sl2 / n - ml * ml)), mean = [sr / n, sg / n, sb / n].map((x) => +x.toFixed(1));
        const flat = sd < 2.5 && ml <= 22, inkLike = Math.abs(mean[0] - mean[2]) < 6 && mean[0] <= ink[0] + 6;
        const fu = kn ? unexp / kn : null;
        let verdict, dovod;
        if (o.znacka) { verdict = true; dovod = 'zelená farba čistenia = mriežka záberu tu nič nenakreslila'; }
        else if (fu == null || kn / n < 0.3) { verdict = flat && inkLike; dovod = 'bez referencie: rozhoduje rovná farba pozadia'; }
        else if (!pairMix || !st.cut || /prelinanie|pohyb/.test(st.cut)) { verdict = fu >= 0.4; dovod = 'fotka je na tom mieste svetlá'; }
        else { verdict = fu >= 0.4 && flat; dovod = 'strih s posunom obrazu: navyše rovná čierna'; }
        const suspect = !verdict && (fu == null || fu >= 0.25 || (flat && inkLike));
        if (!verdict && !suspect) continue;
        // viditeľnosť: až 9 bodov z oblasti; nad plátnom nesmie byť nepriehľadný prvok stránky
        if (!pe) { pe = document.createElement('style'); pe.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(pe); }
        let vis = 0, tot = 0; const sp = Math.max(1, Math.floor(n / 9));
        for (let h = 0; h < n; h += sp) { const i = cp.px[h], xx = i % W, yy = (i - xx) / W; tot++; if (this.visibleAt(cv, rect.left + (xx + 0.5) / W * rect.width, rect.top + (yy + 0.5) / H * rect.height)) vis++; }
        if (vis / tot < 0.5) continue;
        const o2 = {
          pohlad: cp.view,
          bbox: { x: +(cp.x0 / W * rect.width + rect.left).toFixed(1), y: +(cp.y0 / H * rect.height + rect.top).toFixed(1), w: +((cp.x1 - cp.x0 + 1) / W * rect.width).toFixed(1), h: +((cp.y1 - cp.y0 + 1) / H * rect.height).toFixed(1) },
          stred: [+((cp.x0 + cp.x1 + 1) / 2 / W).toFixed(3), +((cp.y0 + cp.y1 + 1) / 2 / H).toFixed(3)],
          plocha: +(n / N * 100).toFixed(3), jas: +ml.toFixed(1), rozptyl: +sd.toFixed(2), farba: mean, rovna: flat, ako_pozadie: inkLike,
          alfa0_podiel: +(z / n / 255).toFixed(3), ref_jas: kn ? +(refSum / kn).toFixed(1) : null, necakane: fu == null ? null : +fu.toFixed(3), znama: +(kn / n).toFixed(2), viditelna: +(vis / tot).toFixed(2), dovod,
          _a: [cp.x0, cp.y0, cp.x1, cp.y1],
        };
        (verdict ? res.spots : res.podozrenia).push(o2);
      }
      if (pe) pe.remove();
      // výrezy pri 100 % (pixely kresliaceho buffra v pohľade nálezu) a náhľad pohľadu safari s rámčekmi
      if (res.spots.length && o.vyrezy) {
        res.crops = [];
        const px = this.px;
        for (const s of res.spots.slice(0, 3)) {
          const [ax0, ay0, ax1, ay1] = s._a, fx = G.DW / W, fy = G.DH / H;
          const mw = Math.max(24, (ax1 - ax0) * fx * 0.15), mh = Math.max(24, (ay1 - ay0) * fy * 0.15);
          const sx = Math.max(0, Math.floor(ax0 * fx - mw)), sy = Math.max(0, Math.floor(ay0 * fy - mh));
          const sw = Math.min(G.DW - sx, Math.ceil((ax1 + 1) * fx + mw) - sx), sh = Math.min(G.DH - sy, Math.ceil((ay1 + 1) * fy + mh) - sy);
          const cc = document.createElement('canvas'); cc.width = sw; cc.height = sh; const cx = cc.getContext('2d'), id = cx.createImageData(sw, sh);
          for (let yy = 0; yy < sh; yy++) for (let xx = 0; xx < sw; xx++) {
            const p = ((G.DH - 1 - (sy + yy)) * G.DW + sx + xx) * 4, d = (yy * sw + xx) * 4, a = px[p + 3], kk = (255 - a) / 255;
            if (s.pohlad === 'safari' && a === 0) { id.data[d] = ink[0]; id.data[d + 1] = ink[1]; id.data[d + 2] = ink[2]; }
            else { id.data[d] = Math.min(255, px[p] + kk * ink[0]); id.data[d + 1] = Math.min(255, px[p + 1] + kk * ink[1]); id.data[d + 2] = Math.min(255, px[p + 2] + kk * ink[2]); }
            id.data[d + 3] = 255;
          }
          cx.putImageData(id, 0, 0);
          res.crops.push({ png: cc.toDataURL('image/png'), px: [sx, sy, sw, sh], pohlad: s.pohlad });
        }
        const th = document.createElement('canvas'); th.width = W; th.height = H; const tx = th.getContext('2d'), id = tx.createImageData(W, H);
        for (let i = 0; i < N; i++) { id.data[i * 4] = G.V.safari.rgb[i * 3]; id.data[i * 4 + 1] = G.V.safari.rgb[i * 3 + 1]; id.data[i * 4 + 2] = G.V.safari.rgb[i * 3 + 2]; id.data[i * 4 + 3] = 255; }
        tx.putImageData(id, 0, 0); tx.lineWidth = 2;
        for (const s of res.spots) { const [ax0, ay0, ax1, ay1] = s._a; tx.strokeStyle = s.pohlad === 'safari' ? '#ff2fd0' : '#00e5ff'; tx.strokeRect(ax0 - 2, ay0 - 2, ax1 - ax0 + 5, ay1 - ay0 + 5); }
        for (const s of res.podozrenia) { const [ax0, ay0, ax1, ay1] = s._a; tx.strokeStyle = '#ffd400'; tx.setLineDash([4, 3]); tx.strokeRect(ax0 - 2, ay0 - 2, ax1 - ax0 + 5, ay1 - ay0 + 5); tx.setLineDash([]); }
        res.nahlad = th.toDataURL('image/jpeg', 0.85);
        if (o.pauza) api.pause(true);                         // obraz stojí, kým volajúci urobí snímku obrazovky
      }
      res.ms = Math.round(performance.now() - t0);
      return res;
    },
