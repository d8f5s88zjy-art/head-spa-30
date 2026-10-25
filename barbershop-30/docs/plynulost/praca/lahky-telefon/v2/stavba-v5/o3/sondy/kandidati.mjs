import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { norm, zhoda } = await import(root + '/assets/recepcia.js');
const K = {
  sk: 'cez pri nad pod dám ísť deň kam vie nás nám môj bol sme ich jej kto čo tvoj ten tie raz asi iba aby kým tým mne byť máš mať',
  en: 'how who why way get got yes not all one out now too off see may new can her his him she they them their',
  de: 'wie wer was wo man für hab gut ja nein mal nur bis vom zum zur den dem des sie ihn ihm',
  cs: 'dám jít den kam ví náš náš můj byl jsme jich její kdo co tvůj ten tam raz asi jen aby nad pod pro při',
  pl: 'wie mój moj moją nas nam ich jej kto co ten tam raz też bez nad pod dla ile jak już był',
  hu: 'hol kit mit van nem meg kér kell ide oda ott itt már még fel ezt azt egy két sok',
  sr: 'ste kod gde šta ali već još nas vas moj moja ima ide bez nad pod koji kad',
  uk: 'для мою мій моя нас вас там тут хто що вже ще без над під він вона їх',
};
for (const [l, s] of Object.entries(K)) {
  const kb = JSON.parse(readFileSync(`${root}/assets/recepcia/${l}.json`, 'utf8'));
  const st = kb.stop.split(' '), x = [kb.cenove, kb.vypln, kb.zdvor, kb.spoj].join(' ').split(' ');
  const keys = [...kb.polozky, ...kb.nevieme].flatMap((p) => p.kluc.split(/[\s|]+/).filter(Boolean).map((t) => t.replace('!', '').toLowerCase()));
  const out = [];
  for (const w0 of s.split(' ')) { const w = norm(w0); if (w.length !== 3) continue; if (st.includes(w)) continue; const k = keys.filter((k) => zhoda(w, k) > 0.89); if (x.some((y) => y && (zhoda(w, y) === 1))) continue; out.push(k.length ? `${w}(kmeň ${k.join('/')})` : w); }
  console.log(l, out.join(' '));
}
