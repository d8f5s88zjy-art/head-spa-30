// Skúška UI recepcie (assets/recepcia.js) bez prehliadača: minimálny falošný DOM v Node.
// Nenahrádza prehliadač (rozloženie, fokus v top layer, VoiceOver) – overí len logiku panelu.
//   node dom-skuska.mjs <koreň barbershop-30>
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(process.argv[2]);
const VOID = new Set(['input', 'link', 'br', 'img']);
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
let aktivny = null;
class E {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this._t = ''; this.parent = null; this.scrollTop = 0; this.scrollHeight = 100; this.open = false; this.lang = ''; this.value = ''; }
  get className() { return this.attrs.class || ''; } set className(v) { this.attrs.class = v; }
  get id() { return this.attrs.id || ''; } set id(v) { this.attrs.id = v; }
  get textContent() { return this._t + this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; this._t = String(v); }
  set innerHTML(h) { this.children = []; this._t = ''; parse(h, this); }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  append(...n) { n.forEach((c) => { if (typeof c === 'string') { const t = new E('#text'); t._t = c; c = t; } c.parent = this; this.children.push(c); }); }
  replaceChildren(...n) { this.children = []; this._t = ''; this.append(...n); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k.startsWith('data-')) this.dataset[camel(k.slice(5))] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  focus() { aktivny = this; }
  showModal() { this.open = true; }
  close() { if (!this.open) return; this.open = false; if (this.onclose) this.onclose(); }
  addEventListener(t, f) { (this['_' + t] ||= []).push(f); }
  all() { return this.children.flatMap((c) => [c, ...c.all()]); }
  matches(sel) {
    const m = /^(\w+)?((?:[.#][\w-]+)*)(\[[\w-]+\])?$/.exec(sel.trim()); if (!m) throw new Error('selektor ' + sel);
    if (m[1] && m[1].toUpperCase() !== this.tagName) return false;
    for (const x of m[2].match(/[.#][\w-]+/g) || []) { if (x[0] === '.' && !this.className.split(' ').includes(x.slice(1))) return false; if (x[0] === '#' && this.id !== x.slice(1)) return false; }
    if (m[3] && !(m[3].slice(1, -1) in this.attrs)) return false;
    return true;
  }
  querySelectorAll(sel) { return this.all().filter((e) => e.tagName !== '#TEXT' && sel.split(',').some((s) => e.matches(s))); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function parse(h, root) {
  const st = [root];
  for (const m of h.matchAll(/<(\/?)(\w+)([^>]*)>|([^<]+)/g)) {
    if (m[4]) { st[st.length - 1].append(m[4]); continue; }
    if (m[1]) { st.pop(); continue; }
    const e = new E(m[2]);
    for (const a of m[3].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) e.setAttribute(a[1], a[2] ?? '');
    st[st.length - 1].append(e);
    if (!VOID.has(m[2])) st.push(e);
  }
}
const poslucha = {};
const doc = {
  documentElement: { lang: 'sk' }, head: new E('head'), body: new E('body'),
  createElement: (t) => new E(t),
  addEventListener: (t, f) => (poslucha[t] ||= []).push(f),
  querySelector: () => null,
};
const ziadosti = [];
globalThis.document = doc;
globalThis.window = { B30_LANG: { langs: [{ code: 'sk', rez: '' }, { code: 'en', rez: 'The booking page is in Slovak.' }] } };
globalThis.fetch = async (u) => {
  ziadosti.push(String(u));
  const p = new URL(u).pathname;
  if (!fs.existsSync(p)) throw new Error('404 ' + p);
  return { json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
};
const { spusti } = await import(pathToFileURL(path.join(ROOT, 'assets/recepcia.js')).href);
const ok = (n) => console.log('OK  ' + n);

const btn = new E('button'); btn.setAttribute('aria-expanded', 'false');
await spusti(btn);
const dlg = doc.body.querySelector('dialog');
assert.ok(dlg && dlg.open, 'dialóg otvorený'); ok('panel je natívny <dialog>, otvorený cez showModal()');
assert.ok('data-no-i18n' in dlg.attrs); ok('dialóg má data-no-i18n');
assert.equal(dlg.getAttribute('aria-labelledby'), 'rc-h'); assert.equal(dlg.querySelector('#rc-h').textContent, 'Recepcia'); ok('aria-labelledby → nadpis „Recepcia“');
assert.equal(btn.getAttribute('aria-expanded'), 'true'); assert.equal(btn.getAttribute('aria-controls'), 'rc-panel'); ok('tlačidlo aria-expanded=true, aria-controls=rc-panel');
const chips = dlg.querySelectorAll('.rc-chip');
assert.deepEqual(chips.map((c) => c.textContent), ['Rezervovať', 'Hodiny', 'Cenník', 'Kde nás nájdete', 'Zavolať']); ok('rýchle voľby: ' + chips.map((c) => c.textContent).join(' / '));
assert.equal(aktivny, chips[0]); ok('fokus na prvej rýchlej voľbe (nie na vstupe – klávesnica by zakryla voľby)');
assert.equal(chips[0].tagName, 'A'); assert.equal(chips[0].attrs.href || chips[0].href, 'https://www.barbershop30.sk/rezervacia'); assert.equal(chips[0].target, '_blank');
assert.equal(chips[4].href, 'tel:+421951267203'); ok('Rezervovať = odkaz na rezerváciu (nové okno), Zavolať = tel:+421951267203');
const uvod = dlg.querySelector('.rc-log').firstChild.textContent;
assert.match(uvod, /pripravených odpovedí/); assert.doesNotMatch(dlg.textContent + uvod, new RegExp(['\\bA' + 'I\\b', 'ume' + 'l', 'chat' + 'bot', 'asis' + 'tent'].join('|'), 'i')); ok('úvodná veta: „' + uvod + '“ (bez zakázaných označení)');
assert.equal(dlg.querySelector('.rc-sukromie').textContent, 'Odpovede sú zo stránky, nič sa neodosiela.'); ok('veta o súkromí v pätičke panelu');
assert.equal(doc.head.querySelector('link').href.toString().endsWith('/assets/recepcia.css'), true); ok('recepcia.css sa pripojí až s modulom');

const inp = dlg.querySelector('#rc-q'), form = dlg.querySelector('form');
const opytaj = (q) => { inp.value = q; form.onsubmit({ preventDefault() {} }); const li = dlg.querySelector('.rc-log').lastChild; return li; };
let li = opytaj('Dá sa platiť kartou?');
assert.match(li.textContent, /nemáme potvrdené: spôsob platby\./); assert.doesNotMatch(li.textContent, /vernost|kartičk/i);
assert.ok(li.querySelectorAll('a').some((a) => a.href === 'tel:+421951267203')); ok('„Dá sa platiť kartou?“ → odovzdanie na recepciu (nie vernostná kartička): ' + li.firstChild.textContent);
assert.equal(inp.value, ''); ok('vstup sa po odoslaní vyprázdni');
li = opytaj('kolko stoji panksy strih');
assert.match(li.textContent, /^Myslíš toto\?/); assert.doesNotMatch(li.textContent, /€/);
const kand = li.querySelectorAll('button'); assert.equal(kand.length, 1); assert.equal(kand[0].textContent, 'Koľko stojí pánsky strih?');
assert.deepEqual(li.querySelectorAll('a').map((a) => a.href.split(':')[0]), ['#sluzby', 'tel', 'mailto']);
ok('preklep „panksy strih“ (neisté slovo) → „Myslíš toto?“ + kandidát + Celý cenník, telefón, e-mail; bez ceny');
kand[0].onclick(); li = dlg.querySelector('.rc-log').lastChild;
assert.match(li.textContent, /Pánsky strih 18 €/); assert.match(li.textContent, /zo stránky/); ok('ťuknutie na kandidáta → „Pánsky strih 18 €“ + značka „zo stránky“');
li = opytaj('ďakujem');
assert.match(li.textContent, /pripravených odpovedí/); assert.doesNotMatch(li.textContent, /€/); assert.equal(li.querySelectorAll('.rc-chip').length, 5);
ok('„ďakujem“ → úvodná veta a rýchle voľby, bez ceny (pravidlo 5)');
li = opytaj('ako dlho trvá holenie');
assert.match(li.textContent, /Holenie do hladka Hot Towel 30 min/); assert.doesNotMatch(li.textContent, /€|40 min/); ok('„ako dlho trvá holenie“ → „Holenie do hladka Hot Towel 30 min“ (pravidlo 6)');
li = opytaj('ostriháte aj mamu?');
assert.match(li.textContent, /Dámske strihy na webe neuvádzame\./); assert.doesNotMatch(li.textContent, /€/); ok('„ostriháte aj mamu?“ → „Dámske strihy na webe neuvádzame.“ (pravidlo 4)');
li = opytaj('kolko stoji holenie hlavy britvou');
assert.match(li.textContent, /Oholenie hlavy 13 €/); ok('„holenie hlavy britvou“ → „Oholenie hlavy 13 €“ (pravidlo 3)');
const zly = '<img src=x onerror=alert(1)>';
opytaj(zly); const q = dlg.querySelectorAll('.rc-q').pop();
assert.equal(q.textContent, zly); assert.equal(q.children.length, 0); ok('text návštevníka ide cez textContent (žiadny prvok z otázky)');
li = opytaj('aké bude zajtra počasie');
assert.match(li.textContent, /Toto neviem presne/); assert.deepEqual(li.querySelectorAll('a').map((a) => a.href.split(':')[0]), ['tel', 'mailto', 'https']); ok('mimo témy → fallback s tromi cestami: telefón, e-mail, rezervácia');
assert.ok(li.querySelectorAll('a').every((a) => !/[?&](body|subject)=/.test(a.href))); ok('mailto bez tela správy (otázka sa nikam neposiela)');
chips[1].onclick(); li = dlg.querySelector('.rc-log').lastChild;
assert.match(li.textContent, /Po–Pi 9:00–19:00/); ok('voľba Hodiny → „Po–Pi 9:00–19:00 / So 9:00–14:00 / Ne zatvorené“');
chips[2].onclick(); li = dlg.querySelector('.rc-log').lastChild;
const cenn = li.querySelectorAll('a').find((a) => a.href === '#sluzby'); assert.ok(cenn); cenn.onclick();
assert.equal(dlg.open, false); assert.equal(btn.getAttribute('aria-expanded'), 'false'); assert.equal(aktivny, btn); ok('„Celý cenník“ zatvorí panel, fokus sa vráti na tlačidlo');
await spusti(btn); assert.ok(dlg.open); dlg.close(); assert.equal(aktivny, btn); ok('zatvorenie (Esc = natívne close) vráti fokus na tlačidlo');
assert.ok(ziadosti.every((u) => /\/assets\/recepcia\/(sk|en|uk|hu|sr|pl|de|cs)\.json$/.test(u))); ok('požiadavky len na assets/recepcia/<jazyk>.json: ' + [...new Set(ziadosti.map((u) => u.split('/assets/')[1]))].join(', '));

doc.documentElement.lang = process.argv[3] || 'en';
for (const f of poslucha.langchange || []) f();
await new Promise((r) => setTimeout(r, 50));
await spusti(btn);
console.log(`jazyk ${doc.documentElement.lang}: nadpis „${dlg.querySelector('#rc-h').textContent}“, dialóg lang=${dlg.lang}, voľby: ${dlg.querySelectorAll('.rc-chip').map((c) => c.textContent).join(' / ')}`);
li = opytaj('How much is a haircut?');
console.log(`jazyk ${doc.documentElement.lang}: „How much is a haircut?“ → ${li.textContent.slice(0, 120)}`);
console.log('hotovo');
