/* Prehliadač panorámy bez cudzích knižníc. Zdroj: zdroj/panorama.js, build.py ho zmenší do assets/panorama.js; načíta ho
   (import) prechádzka predajňou assets/prechadzka.js, až keď návštevník príde na zastávku typu panoráma – dovtedy sa nič
   nesťahuje. Dva druhy obrazu:
   – guľa: equirektangulárny obraz 2 : 1 (360° × 180°, 360° kamera alebo Fotosféra),
   – valec: čiastočná panoráma z telefónu (režim Pano; pomer iný než 2 : 1), vodorovný rozsah v stupňoch udáva nast.uhol
     (predvolene 180), zvislý sa dopočíta z pomeru strán; pohľad sa zastaví na okraji obrazu, nič sa nedomýšľa.
   WebGL: celý obraz je jeden trojuholník, zlomkový shader počíta smer pohľadu každého bodu a číta z textúry (yaw, pitch,
   zorný uhol). Bez WebGL je záloha v CSS: pás panorámy ako pozadie, ťahaním sa posúva. Ovládanie: ťahanie prstom alebo
   myšou so zotrvačnosťou (obraz ide za prstom), dva prsty = priblíženie, šípky a +/− na klávesnici (nast.klavesy false ich
   nechá na prechádzku), koliesko len na celej obrazovke (v stránke koliesko posúva stránku). yaw = smer stredu pohľadu
   v stupňoch (0 = stred obrazu, kladný doprava), pitch kladný hore. premietni(yaw, pitch) vráti polohu smeru v okne (šípky
   prechádzky ukotvené na zemi), nast.kresli sa volá po každom prekreslení. Kreslí sa len počas pohybu (requestAnimationFrame
   beží, kým sa niečo mení), inak 0 práce. Pri „obmedziť pohyb“ bez zotrvačnosti (obraz sa hýbe len pod prstom). Zdroj musí
   mať bodkočiarky všade a bez regulárnych výrazov a šablónových reťazcov (zmensi_js). */
export function spusti(okno, src, hotovo, nast) {
  nast = nast || {};
  var d = document, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yaw = nast.yaw || 0, pitch = nast.pitch || 0, fov = 80, FOV_MIN = 45, FOV_MAX = 100;
  var valec = false, rozsah = 2 * Math.PI, tanMax = 0;   // valec: vodorovný rozsah v radiánoch a tangens zvislého polrozsahu
  var plocha = d.createElement('div');
  plocha.className = 'pan';
  plocha.tabIndex = nast.klavesy === false ? -1 : 0;
  plocha.setAttribute('role', 'img');
  plocha.setAttribute('aria-label', nast.popis || 'Panoráma predajne. Otáčajte ťahaním alebo šípkami, priblížte klávesmi plus a mínus.');
  var canvas = d.createElement('canvas'), gl = null, prog = null, uRot = null, uTan = null, tex = null, cssZaloha = false;
  var ziv = true, beh = false, zmena = true, w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  var obr = new Image();
  obr.decoding = 'async';

  function mat() {   // otočenie kamery: najprv pitch okolo x, potom yaw okolo y (stĺpcová matica pre GLSL)
    var a = -yaw * Math.PI / 180, b = pitch * Math.PI / 180;   // záporné: kladný yaw = pohľad doprava, obraz ide za prstom
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    return new Float32Array([ca, 0, -sa, sa * sb, cb, ca * sb, sa * cb, -sb, ca * cb]);
  }
  function rozmer() {
    var r = okno.getBoundingClientRect();
    var nw = Math.max(1, Math.round(r.width * dpr)), nh = Math.max(1, Math.round(r.height * dpr));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    if (gl) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    zmena = true;
  }
  function kresli() {
    if (cssZaloha) {
      // pás: výška obrazu 2,2 × výška okna, šírka = 2 × výška obrazu (pomer 2:1); yaw posúva x, pitch y
      var H = okno.clientHeight * 2.2, W = H * 2, cw = okno.clientWidth;
      var x = -((yaw / 360) * W) + cw / 2 - W / 2, y = -(H - okno.clientHeight) / 2 + (pitch / 90) * (H - okno.clientHeight) / 2;
      plocha.style.backgroundPosition = x + 'px ' + y + 'px';
      if (nast.kresli) nast.kresli();
      return;
    }
    var tt = tany();
    gl.uniformMatrix3fv(uRot, false, mat());
    gl.uniform2f(uTan, tt[0], tt[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (nast.kresli) nast.kresli();
  }
  function tany() {   // tangens vodorovného a zvislého polovičného zorného uhla (na výšku je fov zvislý)
    var pomer = w / Math.max(1, h), t = Math.tan(fov * Math.PI / 360);
    return pomer >= 1 ? [t, t / pomer] : [t * pomer, t];
  }
  // poloha smeru (yaw, pitch v stupňoch) v okne v CSS bodoch; vid false, keď je smer za chrbtom alebo mimo okna
  function premietni(y, p) {
    var m = mat(), a = y * Math.PI / 180, b = p * Math.PI / 180, cw = okno.clientWidth, ch = okno.clientHeight;
    if (cssZaloha) {
      var H = ch * 2.2, W = H * 2, dy = ((y - yaw + 540) % 360) - 180;
      return { x: cw / 2 + dy / 360 * W, y: ch / 2 - (p - pitch) / 180 * H, vid: Math.abs(dy) < 90 };
    }
    var sx = Math.sin(a) * Math.cos(b), sy = Math.sin(b), sz = -Math.cos(a) * Math.cos(b);
    var kx = m[0] * sx + m[1] * sy + m[2] * sz, ky = m[3] * sx + m[4] * sy + m[5] * sz, kz = m[6] * sx + m[7] * sy + m[8] * sz;
    if (kz > -0.05) return { x: 0, y: 0, vid: false };
    var tt = tany(), nx = kx / -kz / tt[0], ny = ky / -kz / tt[1];
    return { x: (nx + 1) / 2 * cw, y: (1 - ny) / 2 * ch, vid: Math.abs(nx) < 1.15 && Math.abs(ny) < 1.15 };
  }
  // zotrvačnosť: rýchlosť v stupňoch za ms, útlm exponenciálny (časová konštanta 320 ms), koniec pod 0,004 °/ms
  var vy = 0, vp = 0, tPred = 0;
  function snimka(t) {
    if (!ziv) { beh = false; return; }
    var dt = tPred ? Math.min(50, t - tPred) : 16;
    tPred = t;
    if (vy || vp) {
      var k = Math.exp(-dt / 320);
      yaw += vy * dt; pitch += vp * dt; vy *= k; vp *= k;
      if (Math.abs(vy) < 0.004) vy = 0;
      if (Math.abs(vp) < 0.004) vp = 0;
      zmena = true;
    }
    if (zmena) { obmedz(); kresli(); zmena = false; }
    if (vy || vp || zmena) requestAnimationFrame(snimka); else { beh = false; tPred = 0; }
  }
  function ozivi() { if (!beh && ziv) { beh = true; requestAnimationFrame(snimka); } }
  function obmedz() {
    var m = cssZaloha ? 90 : Math.max(5, 90 - fov / 2);
    if (valec && !cssZaloha) {
      // zorný uhol najviac taký, aby sa okno zmestilo do obrazu; yaw a pitch po okraj obrazu (rohy pri okraji dokreslí
      // shader farbou podkladu, preto rezerva 8 %)
      var st = 180 / Math.PI, latMax = Math.atan(tanMax) * st, polS = rozsah * st / 2, pomer = w / Math.max(1, h), i, tt, pv, ph;
      for (i = 0; i < 12; i++) {
        tt = tany(); ph = Math.atan(tt[0]) * st; pv = Math.atan(tt[1]) * st;
        if ((pv <= latMax * 0.92 && (rozsah >= 6.28 || ph <= polS * 0.92)) || fov <= 20) break;
        fov = fov * 0.92;
      }
      m = Math.max(0, latMax * 0.92 - pv);
      if (rozsah < 6.28) { var my = Math.max(0, polS * 0.92 - ph); if (yaw > my) { yaw = my; vy = 0; } else if (yaw < -my) { yaw = -my; vy = 0; } }
      else yaw = ((yaw % 360) + 360) % 360;
    } else yaw = ((yaw % 360) + 360) % 360;
    if (pitch > m) pitch = m; else if (pitch < -m) pitch = -m;
  }
  function stupneNaPixel() { return fov / Math.max(1, okno.clientWidth); }

  // ťahanie: pointer events (myš aj prst), rýchlosť z posledných 80 ms pohybu
  var akt = {}, pocet = 0, posl = null, vzd = 0, fov0 = 0;
  function dolu(e) {
    if (e.button && e.button !== 0) return;
    akt[e.pointerId] = { x: e.clientX, y: e.clientY };
    pocet++;
    plocha.setPointerCapture && plocha.setPointerCapture(e.pointerId);
    vy = vp = 0;
    posl = { x: e.clientX, y: e.clientY, t: e.timeStamp, vx: 0, vyy: 0 };
    if (pocet === 2) { vzd = vzdialenost(); fov0 = fov; }
    plocha.classList.add('taha');
  }
  function vzdialenost() {
    var k = Object.keys(akt), a = akt[k[0]], b = akt[k[1]];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }
  function pohyb(e) {
    var p = akt[e.pointerId];
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (pocet >= 2) {   // dva prsty: priblíženie
      var nf = fov0 * vzd / vzdialenost();
      fov = Math.min(FOV_MAX, Math.max(FOV_MIN, nf));
      zmena = true; ozivi();
      return;
    }
    var s = stupneNaPixel(), dx = e.clientX - posl.x, dy = e.clientY - posl.y, dt = Math.max(1, e.timeStamp - posl.t);
    yaw -= dx * s; pitch += dy * s;
    // vyhladená rýchlosť (nová váha 0,6), smer ako pohyb pohľadu
    posl.vx = posl.vx * 0.4 + (-dx * s / dt) * 0.6; posl.vyy = posl.vyy * 0.4 + (dy * s / dt) * 0.6;
    posl.x = e.clientX; posl.y = e.clientY; posl.t = e.timeStamp;
    zmena = true; ozivi();
  }
  function hore(e) {
    if (!akt[e.pointerId]) return;
    delete akt[e.pointerId]; pocet = Math.max(0, pocet - 1);
    if (pocet === 0) {
      plocha.classList.remove('taha');
      if (!reduce && posl && e.timeStamp - posl.t < 80) { vy = posl.vx; vp = posl.vyy; ozivi(); }
      posl = null;
    } else if (pocet === 1) { var k = Object.keys(akt), z = akt[k[0]]; posl = { x: z.x, y: z.y, t: e.timeStamp, vx: 0, vyy: 0 }; }
  }
  function klaves(e) {
    if (nast.klavesy === false) return;
    var krok = e.shiftKey ? 15 : 5, ok = true;
    if (e.key === 'ArrowLeft') yaw -= krok; else if (e.key === 'ArrowRight') yaw += krok;
    else if (e.key === 'ArrowUp') pitch += krok; else if (e.key === 'ArrowDown') pitch -= krok;
    else if (e.key === '+' || e.key === '=') fov = Math.max(FOV_MIN, fov - 5);
    else if (e.key === '-') fov = Math.min(FOV_MAX, fov + 5);
    else ok = false;
    if (ok) { e.preventDefault(); vy = vp = 0; zmena = true; ozivi(); }
  }
  function koliesko(e) {   // len na celej obrazovke (v stránke by bránilo posunu stránky)
    if (!plocha.closest('.pp-cela-on') && !e.ctrlKey) return;
    e.preventDefault();
    fov = Math.min(FOV_MAX, Math.max(FOV_MIN, fov + (e.deltaY > 0 ? 4 : -4)));
    zmena = true; ozivi();
  }

  function webgl() {
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return false;
    var vs = ['attribute vec2 p;', 'varying vec2 v;', 'void main(){v=p;gl_Position=vec4(p,0.,1.);}'].join('\n');
    var fs = ['precision highp float;', 'varying vec2 v;', 'uniform mat3 r;', 'uniform vec2 t;', 'uniform vec2 c;', 'uniform sampler2D s;',
      'void main(){',
      '  vec3 d=normalize(r*vec3(v.x*t.x,v.y*t.y,-1.));',
      '  float lon=atan(d.x,-d.z);',
      valec ? '  vec2 uv=vec2(lon/c.x+0.5,0.5-d.y/length(d.xz)/c.y);' : '  vec2 uv=vec2(lon/6.2831853+0.5,0.5-asin(clamp(d.y,-1.,1.))/3.1415927);',
      valec ? '  if(uv.y<0.||uv.y>1.||(c.x<6.28&&(uv.x<0.||uv.x>1.)))gl_FragColor=vec4(0.11,0.10,0.105,1.);else gl_FragColor=texture2D(s,uv);' : '  gl_FragColor=texture2D(s,uv);',
      '}'].join('\n');
    function sh(typ, z) { var x = gl.createShader(typ); gl.shaderSource(x, z); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) return false;
    prog = gl.createProgram(); gl.attachShader(prog, a); gl.attachShader(prog, b); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uRot = gl.getUniformLocation(prog, 'r'); uTan = gl.getUniformLocation(prog, 't');
    gl.uniform1i(gl.getUniformLocation(prog, 's'), 0);
    gl.uniform2f(gl.getUniformLocation(prog, 'c'), rozsah, 2 * tanMax);
    // textúra: šírka mocnina dvoch (najviac 4096, podľa MAX_TEXTURE_SIZE), výška polovica (valec: mocnina dvoch najbližšia
    // pomeru obrazu, 512 až 2048); guľa a celý valec sa vodorovne opakujú, čiastočný valec sa na okraji zastaví
    var max = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, sirka = 4096, vyska;
    while (sirka > max) sirka = sirka / 2;
    vyska = sirka / 2;
    if (valec) { vyska = 512; while (vyska < 2048 && vyska * 1.41 < sirka * obr.naturalHeight / obr.naturalWidth) vyska = vyska * 2; vyska = Math.min(vyska, sirka); }
    var zdroj = obr;
    if (obr.naturalWidth !== sirka || obr.naturalHeight !== vyska) {
      var c = d.createElement('canvas'); c.width = sirka; c.height = vyska;
      c.getContext('2d').drawImage(obr, 0, 0, sirka, vyska);
      zdroj = c;
    }
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, zdroj);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, valec && rozsah < 6.28 ? gl.CLAMP_TO_EDGE : gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);
    canvas.addEventListener('webglcontextrestored', function () { if (ziv) { gl = null; webgl(); rozmer(); zmena = true; ozivi(); } }, false);
    return gl.getError() === gl.NO_ERROR;
  }

  function pripoj() {
    plocha.addEventListener('pointerdown', dolu);
    plocha.addEventListener('pointermove', pohyb);
    plocha.addEventListener('pointerup', hore);
    plocha.addEventListener('pointercancel', hore);
    plocha.addEventListener('lostpointercapture', hore);
    plocha.addEventListener('keydown', klaves);
    plocha.addEventListener('wheel', koliesko, { passive: false });
    plocha.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var ro = window.ResizeObserver ? new ResizeObserver(function () { rozmer(); ozivi(); }) : null;
    if (ro) ro.observe(okno); else window.addEventListener('resize', function () { rozmer(); ozivi(); });
    plocha._ro = ro;
  }

  obr.onload = function () {
    if (!ziv) return;
    var ok = false, pomerObr = obr.naturalWidth / Math.max(1, obr.naturalHeight);
    // guľa len pri pomere 2 : 1 a celom kruhu; inak valec s rozsahom nast.uhol (predvolene 180°), zvislý rozsah z pomeru strán
    valec = Math.abs(pomerObr - 2) > 0.06 || (nast.uhol && nast.uhol < 359);
    if (valec) { rozsah = Math.min(360, Math.max(30, nast.uhol || 180)) * Math.PI / 180; tanMax = rozsah / pomerObr / 2; }
    plocha.appendChild(canvas);
    try { ok = webgl(); } catch (e) { ok = false; }
    if (!ok) {   // záloha bez WebGL: pás ako pozadie
      cssZaloha = true; gl = null;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      plocha.classList.add('pan-css');
      plocha.style.backgroundImage = 'url("' + src.split('"').join('').split('\\').join('') + '")';
    }
    okno.appendChild(plocha);
    pripoj();
    rozmer(); obmedz(); kresli(); zmena = false;
    hotovo(true, cssZaloha ? 'css' : 'webgl');
  };
  obr.onerror = function () { if (ziv) hotovo(false); };
  obr.src = src;

  return {
    znic: function () {
      ziv = false; vy = vp = 0;
      if (plocha._ro) plocha._ro.disconnect();
      if (gl) { var ext = gl.getExtension('WEBGL_lose_context'); if (tex) gl.deleteTexture(tex); if (ext) ext.loseContext(); gl = null; }
      if (plocha.parentNode) plocha.parentNode.removeChild(plocha);
      obr.onload = obr.onerror = null; obr.src = '';
    },
    plocha: plocha,
    pohlad: function () { return { yaw: yaw, pitch: pitch, fov: fov, zaloha: cssZaloha, valec: valec, rozsah: Math.round(rozsah * 180 / Math.PI) }; },
    premietni: premietni,
    nastav: function (y, p, f) { if (y !== undefined) yaw = y; if (p !== undefined) pitch = p; if (f !== undefined) fov = Math.min(FOV_MAX, Math.max(valec ? 20 : FOV_MIN, f)); vy = vp = 0; zmena = true; ozivi(); }
  };
}
