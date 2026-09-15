// Päť návrhov darčekového poukazu pre HEAD SPA 30 a pre SALÓN 30.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.dirname(new URL(import.meta.url).pathname);

const mark = (c = '#f2ede2') => `<svg class="mark" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" stroke="#d9b56a" stroke-width="1.5"/><path d="M14 40c6-9 12-9 18 0s12 9 18 0" fill="none" stroke="#8cc3b6" stroke-width="1.6" stroke-linecap="round"/><text x="32" y="33" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="21" fill="${c}">30</text></svg>`;

// miska s vodou, rytina
const bowl = (cls, stroke = '#8cc3b6', gold = '#d9b56a') => `<svg class="art ${cls}" viewBox="0 0 600 600" fill="none">
  ${[240, 198, 156, 114, 74, 38].map((r, i) => `<ellipse cx="300" cy="374" rx="${r}" ry="${Math.round(r * .385)}" fill="none" stroke="${stroke}" stroke-opacity="${(.42 - i * .05).toFixed(2)}" stroke-width="1.6"/>`).join('')}
  <path d="M300 86v266" stroke="${gold}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
  <circle cx="300" cy="360" r="6.5" fill="${gold}" fill-opacity=".85"/>
  ${[288, 246].map((r, i) => `<ellipse cx="300" cy="374" rx="${r}" ry="${Math.round(r * .385)}" fill="none" stroke="${gold}" stroke-opacity="${(.15 - i * .05).toFixed(2)}" stroke-width="1"/>`).join('')}
</svg>`;

// giloš: rozeta ako na certifikáte
function rosette(cx, cy, R, k, a, kopie, stroke, op, sq = 1) {
  const p = [];
  for (let c = 0; c < kopie; c++) {
    const off = (c * Math.PI * 2) / (kopie * k);
    let d = '';
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const r = R + a * Math.cos(k * t + off);
      const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t) * sq;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    p.push(`<path d="${d}Z" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/>`);
  }
  return p.join('');
}
const guilloche = `<svg class="guilloche" viewBox="0 0 1748 1240" fill="none">
  ${rosette(874, 640, 398, 26, 20, 14, '#8cc3b6', .13, .76)}
  ${rosette(874, 640, 306, 20, 17, 12, '#d9b56a', .13, .8)}
  ${rosette(874, 640, 212, 14, 14, 10, '#8cc3b6', .12, .84)}
  ${rosette(874, 640, 128, 10, 11, 8, '#d9b56a', .12, .88)}
  ${[0, 1, 2].map((i) => `<rect x="${70 + i * 9}" y="${70 + i * 9}" width="${1608 - i * 18}" height="${1100 - i * 18}" fill="none" stroke="#d9b56a" stroke-opacity="${.1 - i * .025}" stroke-width="1"/>`).join('')}
</svg>`;
const seal = `<svg class="seal" viewBox="0 0 150 150" fill="none">
  ${rosette(75, 75, 56, 16, 5, 6, '#d9b56a', .45)}
  <circle cx="75" cy="75" r="40" fill="none" stroke="#d9b56a" stroke-opacity=".55" stroke-width="1"/>
  <text x="75" y="84" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="30" fill="#ecd08f" fill-opacity=".9">30</text></svg>`;

const ZNACKY = {
  hs: {
    id: 'headspa', slovo: 'Head Spa 30', pod: 'Súčasť Salónu 30 · Nitra',
    hodnota: '100 €', claim: 'Daruj čas <em>pre seba.</em>',
    note: 'Platí na všetkých sedemnásť Head Spa rituálov, od 40 do 120 minút.',
    noteKratko: 'Platí na všetkých sedemnásť Head Spa rituálov.',
    adresa: 'Mostná 226/30, Nitra', kontakt: '0911 153 136 · salon30.sk',
    kroky: ['Vyber si rituál, sedemnásť Head Spa rituálov od 40 do 120 minút.',
            'Rezervuj si termín cez QR kód vedľa alebo telefonicky na 0911 153 136.',
            'Poukaz prines so sebou, stačí aj v telefóne.'],
    fakty: [['17', 'rituálov'], ['40 až 120', 'minút'], ['od 50 €', 'ceny rituálov'], ['Mostná 30', 'Nitra']],
    kto: 'HEAD SPA 30<br>v Salóne 30',
    faktyLice: [['17', 'rituálov'], ['40 až 120', 'minút'], ['od 50 €', 'ceny rituálov']],
  },
  s30: {
    id: 'salon30', slovo: 'Salón 30', pod: 'Kaderníctvo · Nitra',
    hodnota: '50 €', claim: 'Daruj vlasom <em>starostlivosť.</em>',
    note: 'Platí na strih, farbenie, koloristiku, vlasové terapie aj trichologické vyšetrenie.',
    noteKratko: 'Platí na strih, farbenie, koloristiku aj vlasové terapie.',
    adresa: 'Mostná 226/30, Nitra', kontakt: '0911 153 136 · salon30.sk',
    kroky: ['Vyber si službu: strih, farbenie, koloristika, vlasová terapia alebo styling.',
            'Rezervuj si termín cez QR kód vedľa alebo telefonicky na 0911 153 136.',
            'Poukaz prines so sebou, stačí aj v telefóne.'],
    fakty: [['6', 'kaderníčok'], ['od 15 €', 'ceny služieb'], ['Oroexpert', 'kozmetika'], ['Mostná 30', 'Nitra']],
    kto: 'SALÓN 30<br>kaderníctvo',
    faktyLice: [['6', 'kaderníčok'], ['Oroexpert', '24 karátov'], ['trichológia', 'mikrokamera']],
  },
};

const fline = (z) => `<div class="fline">${z.faktyLice.map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join('')}</div>`;
const brand = (z, c) => `<div class="brand">${mark(c)}<div class="w">${z.slovo}<small>${z.pod}</small></div></div>`;

const NAVRHY = {
  d1: (z) => `
    <div class="frame"></div><div class="frame2"></div>
    <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
    <div class="head">${brand(z)}<span class="kind">Darčekový poukaz</span></div>
    ${bowl('')}
    <div class="body">
      <div class="lbl">Hodnota poukazu</div>
      <div class="val">${z.hodnota}</div>
      <div class="claim">${z.claim}</div>
      <p class="note">${z.note}</p>
    </div>
    ${fline(z)}
    <div class="foot">
      <div class="contact"><b>${z.adresa}</b>${z.kontakt}</div>
      <div class="code lbl">Kód poukazu<i class="dots"></i></div>
    </div>`,

  d2: (z) => `
    <div class="band"><div class="bandin"></div></div>
    <div class="frame"></div>
    <div class="head">${brand(z)}<span class="kind">Darčekový poukaz</span></div>
    <div class="claim">${z.claim}</div>
    <p class="note">${z.note}</p>
    ${fline(z)}
    <div class="contact"><b>${z.adresa}</b>${z.kontakt}</div>
    <div class="vbox">
      <div class="lbl">Hodnota</div>
      <div class="val">${z.hodnota}</div>
      <div class="sub">${z.noteKratko}</div>
      <div class="codeline"><div class="codelbl">Kód poukazu</div><div class="dots"></div></div>
    </div>`,

  d3: (z) => `
    <div class="frame"></div>
    <div class="head">${brand(z, '#15190f')}<span class="kind">Darčekový poukaz</span></div>
    <div class="rule"></div>
    ${bowl('', '#6f7a3d', '#8a6d28')}
    <div class="body">
      <div class="lbl">Hodnota poukazu</div>
      <div class="val">${z.hodnota}</div>
      <div class="claim">${z.claim}</div>
      <p class="note">${z.note}</p>
    </div>
    ${fline(z)}
    <div class="foot">
      <div class="contact"><b>${z.adresa}</b>${z.kontakt}</div>
      <div class="code lbl">Kód poukazu<i class="dots"></i></div>
    </div>`,

  d4: (z) => `
    ${guilloche}
    <div class="frame"></div><div class="frame2"></div>
    <div class="stack">
      <div style="display:flex;flex-direction:column;align-items:center">
        ${brand(z)}
        <span class="kind">Darčekový poukaz</span>
      </div>
      <div class="mid">
        <div class="lbl">Hodnota poukazu</div>
        <div class="val">${z.hodnota}</div>
        <div class="claim">${z.claim}</div>
        ${seal}
      </div>
      <div class="bot">
        <div class="contact"><b>${z.adresa}</b>${z.kontakt}</div>
        <div class="code lbl">Kód poukazu<i class="dots"></i></div>
      </div>
    </div>`,

  d5: (z) => `
    <div class="frame"></div>
    <div class="head">${brand(z)}<span class="kind">Darčekový poukaz</span></div>
    <div class="body">
      <div class="lbl">Hodnota poukazu</div>
      <div class="val">${z.hodnota}</div>
      <div class="claim">${z.claim}</div>
      <p class="note">${z.note}</p>
    </div>
    ${fline(z)}
    <div class="contact"><b>${z.adresa}</b>${z.kontakt}</div>
    <div class="perf"></div>
    <svg class="scissors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 7.9 20 20M20 4 8.1 16.1"/></svg>
    <div class="stub">
      ${mark('#15190f').replace('class="mark"', 'class="smark"')}
      <div class="slbl">Útržok pre salón</div>
      <div class="sval">${z.hodnota}</div>
      <div class="sfld"><span>Kód</span><i></i></div>
      <div class="sfld"><span>Uplatnené dňa</span><i></i></div>
      <div class="sfld"><span>Podpis</span><i></i></div>
      <div class="snote">${z.slovo}<br>Mostná 30 · Nitra</div>
    </div>`,
};

const RUB_TMAVY = { d1: 1, d2: 1, d4: 1, d5: 0, d3: 0 };

const rub = (z, tmavy) => `
  <div class="frame"></div>
  <div class="head"><span class="t">${z.slovo}</span><span class="s">Darčekový poukaz</span></div>
  <div class="rule"></div>
  <div class="cols">
    <div>
      <div class="fields">
        <label class="fld"><span>Pre koho</span><i></i></label>
        <label class="fld"><span>Od koho</span><i></i></label>
        <label class="fld wide"><span>Venovanie</span><i></i></label>
        <label class="fld"><span>Kód poukazu</span><i></i></label>
        <label class="fld"><span>Platí do</span><i></i></label>
      </div>
      <div class="steps"><h3>Ako ho uplatniť</h3><ol>${z.kroky.map((k) => `<li>${k}</li>`).join('')}</ol></div>
      <div class="facts">${z.fakty.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>
    </div>
    <div class="side">
      <img class="qr" src="qr.png" alt="QR kód na online rezerváciu">
      <div class="qcap">Rezervácia online<br>booqme.app</div>
      <div class="who">${z.kto}</div>
      <div class="adr"><b>${z.adresa}</b>Po až Pi 9.00 – 18.00<br>So 9.00 – 15.00</div>
    </div>
  </div>
  <div class="terms">
    <p>Poukaz platí na služby uvedené na líci, v prevádzke na Mostnej 30 v Nitre. Nie je vymeniteľný za hotovosť. Termín si prosím rezervuj vopred.</p>
    <div class="sig">Salón 30<br>salon30.sk</div>
  </div>`;

const karty = [];
for (const zk of ['hs', 's30']) {
  const z = ZNACKY[zk];
  for (const d of ['d1', 'd2', 'd3', 'd4', 'd5']) {
    karty.push({ id: `${d}-${z.id}-lice`, cls: `card ${d}`, html: NAVRHY[d](z), grain: d === 'd3' ? 'light' : '' });
    karty.push({ id: `${d}-${z.id}-rub`, cls: `card back${RUB_TMAVY[d] ? ' dark' : ''}`, html: rub(z, RUB_TMAVY[d]), grain: RUB_TMAVY[d] ? '' : 'light' });
  }
}

const html = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>Návrhy darčekových poukazov</title>
<link rel="stylesheet" href="navrhy.css"></head><body>
${karty.map((k) => `<div class="${k.cls}" id="${k.id}">${k.html}<div class="grain ${k.grain}"></div></div>`).join('\n')}
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'navrhy.html'), html);
fs.writeFileSync(path.join(ROOT, 'karty.json'), JSON.stringify(karty.map((k) => k.id), null, 0));

// tlačová verzia: A6 so spadávkou 3 mm, líce a rub za sebou
const printCss = `@page{size:154mm 111mm;margin:0}
html,body{margin:0;padding:0;background:#fff}
body{display:block;gap:0;padding:0}
.page{width:154mm;height:111mm;overflow:hidden;position:relative;page-break-after:always;display:flex;align-items:center;justify-content:center}
.page .card{transform:scale(.33831);transform-origin:center center;flex:0 0 auto}`;
fs.writeFileSync(path.join(ROOT, 'tlac.html'), `<!doctype html><html lang="sk"><head><meta charset="utf-8">
<link rel="stylesheet" href="navrhy.css"><style>${printCss}</style></head><body>
${karty.map((k) => `<div class="page"><div class="${k.cls}">${k.html}<div class="grain ${k.grain}"></div></div></div>`).join('\n')}
</body></html>`);
console.log('navrhy.html ·', karty.length, 'kariet');
