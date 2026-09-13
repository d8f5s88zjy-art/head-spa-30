import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.dirname(new URL(import.meta.url).pathname);

const mark = `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" stroke="#d9b56a" stroke-width="1.5"/><path d="M14 40c6-9 12-9 18 0s12 9 18 0" fill="none" stroke="#8cc3b6" stroke-width="1.6" stroke-linecap="round"/><text x="32" y="33" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="21" fill="#f2ede2">30</text></svg>`;

// miska s vodou: sústredné kruhy a kvapka
const bowl = `<svg class="bowl" viewBox="0 0 640 640" fill="none">
  <defs><radialGradient id="g" cx="50%" cy="62%" r="52%">
    <stop offset="0%" stop-color="#8cc3b6" stop-opacity=".30"/><stop offset="70%" stop-color="#8cc3b6" stop-opacity=".06"/><stop offset="100%" stop-color="#8cc3b6" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="320" cy="400" rx="250" ry="96" fill="url(#g)"/>
  ${[250,206,162,118,74,38].map((r,i)=>`<ellipse cx="320" cy="400" rx="${r}" ry="${Math.round(r*0.385)}" fill="none" stroke="#8cc3b6" stroke-opacity="${(0.40-i*0.045).toFixed(2)}" stroke-width="1.6"/>`).join('')}
  <path d="M320 96v268" stroke="#ecd08f" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
  <circle cx="320" cy="372" r="7" fill="#ecd08f" fill-opacity=".8"/>
  ${[300,252,204].map((r,i)=>`<ellipse cx="320" cy="400" rx="${r}" ry="${Math.round(r*0.385)}" fill="none" stroke="#d9b56a" stroke-opacity="${(0.16-i*0.04).toFixed(2)}" stroke-width="1"/>`).join('')}
</svg>`;

const VARIANTY = [
  { id: '50', hodnota: '50 €', lbl: 'Hodnota poukazu', claim: 'Daruj čas <em>pre seba.</em>',
    note: 'Poukaz pokryje Klasický Head Spa, štyridsať minút od peelingu cez masáž až po vodný rituál. Pri dlhšom rituáli sa rozdiel dopláca v salóne.' },
  { id: '70', hodnota: '70 €', lbl: 'Hodnota poukazu', claim: 'Daruj hodinu <em>ticha.</em>',
    note: 'Poukaz pokryje ktorýkoľvek Head Spa rituál v hodnote do 70 €. Pri drahšom rituáli sa rozdiel dopláca v salóne.' },
  { id: '100', hodnota: '100 €', lbl: 'Hodnota poukazu', claim: 'Daruj teplo <em>a vodu.</em>',
    note: 'Poukaz pokryje ktorýkoľvek Head Spa rituál v hodnote do 100 €, vrátane hĺbkových deväťdesiatminútových rituálov.' },
  { id: '149', hodnota: '149 €', lbl: 'Hodnota poukazu', claim: 'Daruj <em>to najlepšie,</em> čo máme.',
    note: 'Najvyšší poukaz pokryje ktorýkoľvek rituál z celej ponuky vrátane dvojhodinových prémiových rituálov a rituálov pre dvoch.' },
  { id: 'ritual', hodnota: 'Konkrétny rituál', lbl: 'Poukaz na rituál', small: true,
    claim: 'Daruj presne <em>ten pravý.</em>',
    note: 'Rituál je vybraný a zaplatený vopred, obdarovaný si už len vyberie termín.', fieldRitual: true },
];

const front = (v) => `<div class="card front" id="front-${v.id}">
  <div class="frame"></div><div class="frame2"></div>
  <div class="f-head">
    <div class="brand">${mark}<div class="w">Head Spa 30<small>Súčasť Salónu 30 · Nitra</small></div></div>
    <div class="f-kind">Darčekový poukaz</div>
  </div>
  ${bowl}
  <div class="f-body">
    <div class="f-lbl">${v.lbl}</div>
    <div class="f-val${v.small ? ' small' : ''}">${v.hodnota}</div>
    <div class="f-claim">${v.claim}</div>
    <p class="f-note">${v.note}</p>
  </div>
  <div class="f-foot">
    <div class="f-contact"><b>Mostná 226/30, Nitra</b>0911 153 136 · salon30.sk</div>
    <div class="f-code">${v.fieldRitual ? 'Rituál' : 'Kód poukazu'}<i></i></div>
  </div>
  <div class="grain"></div>
</div>`;

const back = `<div class="card back" id="back">
  <div class="frame"></div><div class="frame2"></div>
  <div class="b-head"><span class="t">Head Spa 30</span><span class="s">Darčekový poukaz</span></div>
  <div class="b-rule"></div>
  <div class="b-cols">
    <div>
      <div class="fields">
        <label class="fld"><span>Pre koho</span><i></i></label>
        <label class="fld"><span>Od koho</span><i></i></label>
        <label class="fld wide"><span>Venovanie</span><i></i></label>
        <label class="fld"><span>Kód poukazu</span><i></i></label>
        <label class="fld"><span>Platí do</span><i></i></label>
      </div>
      <div class="steps">
        <h3>Ako ho uplatniť</h3>
        <ol>
          <li>Vyber si rituál, štrnásť Head Spa rituálov od 40 do 120 minút.</li>
          <li>Rezervuj si termín cez QR kód vedľa alebo telefonicky na 0911 153 136.</li>
          <li>Poukaz prines so sebou, stačí aj v telefóne.</li>
        </ol>
      </div>
      <div class="b-facts">
        <div><b>14</b><span>rituálov</span></div>
        <div><b>40 až 120</b><span>minút</span></div>
        <div><b>od 50 €</b><span>ceny rituálov</span></div>
        <div><b>Mostná 30</b><span>Nitra</span></div>
      </div>
    </div>
    <div class="b-side">
      <img class="qr" src="qr.png" alt="QR kód na online rezerváciu">
      <div class="qcap">Rezervácia online<br>booqme.app</div>
      <div class="who">HEAD SPA 30<br>v Salóne 30</div>
      <div class="adr"><b>Mostná 226/30, Nitra</b>Po až Pi 9.00 – 18.00<br>So 9.00 – 15.00</div>
    </div>
  </div>
  <div class="b-terms">
    <p>Poukaz platí na všetky rituály HEAD SPA 30 v Salóne 30 na Mostnej 30 v Nitre. Nie je vymeniteľný za hotovosť. Termín si prosím rezervuj vopred.</p>
    <div class="sig">Salón 30<br>salon30.sk</div>
  </div>
  <div class="grain" style="opacity:.07;mix-blend-mode:multiply"></div>
</div>`;

const html = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>Darčekové poukazy HEAD SPA 30</title>
<link rel="stylesheet" href="poukaz.css"></head><body>
${VARIANTY.map(front).join('\n')}
${back}
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'poukaz.html'), html);
fs.writeFileSync(path.join(ROOT, 'varianty.json'), JSON.stringify(VARIANTY.map((v) => v.id)));
console.log('poukaz.html', VARIANTY.length, 'líc + rub');
