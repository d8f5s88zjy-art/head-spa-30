# Úprava source/tools/recepcia-test.mjs (oprava 3b): pravidlá 1–7 v hlavičke, triedy 12–14, vek nad 10, slovo od 3 znakov
import sys
p = sys.argv[1]
s = open(p, encoding='utf8').read()
def r(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
r("""//  6.–11. triedy podľa pravidiel zhody; otázky sa skladajú z dát a šablón, nie z nálezov kontroly:
//     6 krátke kmene, 7 neznáme slovo, 8 názov služby vedie na tú službu, 9 osoby, miesta, vek a produkty mimo
//     ponuky, 10 zdvorilosti, 11 trvanie menovanej služby
""", """//  6.–14. triedy podľa pravidiel zhody (p. 1–7 v komentároch recepcia.js); otázky sa skladajú z dát a šablón,
//     nie z nálezov kontroly:
//     p. 1 kmeň do 4 znakov len presne alebo s koncovkou najviac +3, preklep len pri kmeni od 5 znakov (test 6)
//     p. 2 neznáme obsahové slovo od 3 znakov pri službe s cenou → „Myslíš toto?“ alebo odovzdanie (test 7)
//     p. 3 špecifickejšia služba vyhrá; slovo inej služby, ktoré víťaz nevysvetlí, alebo spojená služba
//          (strih a brada) bez spojky → „Myslíš toto?“ s oboma (testy 8, 12, 13)
//     p. 4 osoba, miesto, vek (každé číslo nad 10) a produkt mimo ponuky → téma nevieme, ktorá vetuje cenu (test 9)
//     p. 5 zdvorilosť a krátka správa → úvodná veta a voľby, nikdy cena (test 10)
//     p. 6 trvanie je trvanie menovanej služby (test 11)
//     p. 7 cena alebo trvanie len pri istej zhode so silným kmeňom služby (slovo z názvu alebo opisu služby na
//          stránke); súčasť balíka, nástroj či prenesené slovo je slabý kmeň (test 14)
""")
r("    if (t[0] === '=') continue;\n    const k = t.replace('!', '').toLowerCase();", "    if ('=>'.includes(t[0])) continue;\n    const k = t.replace('!', '').toLowerCase();")
r("['dam si ostrihat bradu', 'cena-strih-brada']", "['dam si ostrihat bradu', ['cena-brada', 'cena-strih-brada']]")
r("    for (const q of [`${FRAZA.cena[l]} ${nazov(p)} ${nahodne()}`, `${nahodne()} ${nazov(p)}`]) {",
  "    for (const q of [`${FRAZA.cena[l]} ${nazov(p)} ${nahodne()}`, `${nahodne()} ${nazov(p)}`, `${FRAZA.cena[l]} ${nazov(p)} ${nahodne().slice(0, 3)}`]) {")
V0 = "  vek: {\n"
a = s.index(V0); b = s.index("  },\n", a) + 4
s = s[:a] + """  vek: {
    sk: [['Syn má {} rokov, koľko stojí strih?', 'Strihate aj {}-ročných?', 'Syn má {}, koľko stojí strih?'], VEK],
    en: [['My son is {} years old, how much is a haircut?', 'My son is {}, how much is a haircut?'], VEK],
    de: [['Mein Sohn ist {} Jahre alt, was kostet ein Haarschnitt?', 'Mein Sohn ist {}, was kostet ein Haarschnitt?'], VEK],
    cs: [['Syn má {} let, kolik stojí střih?', 'Můj syn má {}, kolik stojí střih?'], VEK],
    pl: [['Syn ma {} lat, ile kosztuje strzyżenie?', 'Mój syn ma {}, ile kosztuje strzyżenie?'], VEK],
    hu: [['A fiam {} éves, mennyibe kerül a hajvágás?', 'A fiam {}, mennyibe kerül a hajvágás?'], VEK],
    sr: [['Sin ima {} godina, koliko košta šišanje?', 'Moj sin ima {}, koliko košta šišanje?'], VEK],
    uk: [['Синові {} років, скільки коштує стрижка?', 'Моєму синові {}, скільки коштує стрижка?'], VEK],
  },
""" + s[b:]
r("const TRIEDY = {", "/* vek nad 10 rokov (stránka uvádza strih pre chlapcov do 10 rokov), aj bez slova „rokov“ */\nconst VEK = ['11', '12', '13', '14', '15', '16', '17', '19', '25', '40'];\nconst TRIEDY = {")
r("  for (const q of ['Syn má 8 rokov, koľko stojí strih?', 'Strihate aj 5-ročných?']) {", "  for (const q of ['Syn má 8 rokov, koľko stojí strih?', 'Syn má 10 rokov, koľko stojí strih?', 'Strihate aj 5-ročných?', 'Koľko stojí strih pre 5-ročného?']) {")
s = s.rstrip('\n') + """

/* p. 3: dve služby z cenníka v jednej otázke nikdy nedostanú holú cenu len jednej z nich */
const SPOLU = { 'cena-strih-brada': ['cena-strih', 'cena-brada'] };
test('12. pravidlo 3: dve služby v otázke = Myslíš toto? alebo spojená služba, nikdy holá cena jednej', () => {
  let n = 0, v = 0, obe = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const c = kb.polozky.filter(cenove), spoj = kb.spoj.split(' ')[0];
    for (const a of c) for (const b of c) {
      if (a === b) continue;
      const q = `${FRAZA.cena[l]} ${nazov(a)} ${spoj} ${nazov(b)}?`, r = odpovedz(q, kb), t = r.typ === 'odpoved' && JSON.stringify(r.p.odpoved); n++;
      if (r.typ === 'vyber') { v++; if ([a, b].every((x) => r.p.some((y) => y.id === x.id))) obe++; continue; }
      // spojená služba pokrýva svoje časti (aj keď je jednou z dvojice)
      const S = (x, y) => (r.id === x.id && (SPOLU[x.id] || []).includes(y.id)) || ((SPOLU[r.id] || []).includes(x.id) && (SPOLU[r.id] || []).includes(y.id));
      assert.ok(!cena(r) || S(a, b) || S(b, a) || [a, b].every((x) => t.includes(nazov(x))), `${l} „${q}“ → ${popis(r)}: cena len jednej služby`);
    }
  }
  console.log(`dvojíc služieb: ${n}, z toho „Myslíš toto?“ ${v} (s oboma ${obe})`);
});

/* p. 3: spojená služba (pravidlo „spolu“) len so spojkou (a, s, +, and, und …); bez nej Myslíš toto? */
test('13. pravidlo 3: strih a brada so spojkou = spojená služba, bez spojky nie', () => {
  for (const [l, kb] of Object.entries(KB)) {
    const p = kb.polozky.find((x) => x.pravidlo === 'spolu'), spoj = kb.spoj.split(' ');
    assert.ok(p, `${l}: spojená služba`);
    const so = p.otazky[1], bez = norm(so).split(' ').filter((w) => !spoj.includes(w)).join(' ');
    assert.notEqual(so.split(' ').length, bez.split(' ').length, `${l}: variant „${so}“ má spojku`);
    for (const q of [so, `${FRAZA.cena[l]} ${so}?`, bez.replace(' ', ' + ')]) {
      const r = odpovedz(q, kb);
      assert.ok(r.typ === 'odpoved' && r.id === p.id, `${l} „${q}“ → ${popis(r)}, čakané ${p.id}`);
    }
    for (const q of [bez, `${FRAZA.cena[l]} ${bez}?`]) {
      const r = odpovedz(q, kb);
      assert.ok(!(r.typ === 'odpoved' && r.id === p.id), `${l} „${q}“ → ${popis(r)}: spojená služba bez spojky`);
    }
  }
});

/* p. 7: otázka len zo slabých kmeňov služby (súčasť, nástroj, opisné slovo) nedostane jej cenu */
test('14. pravidlo 7: cena len pri istej zhode so silným kmeňom služby', () => {
  let n = 0;
  for (const [l, kb] of Object.entries(KB)) {
    const silne = new Set([...kb.polozky, ...kb.nevieme].flatMap((p) => p.kluc.split(/[\\s|]+/).filter((t) => /^[A-Z]/.test(t) || t.endsWith('!')).map((t) => t.replace(/[=!]/g, '').toLowerCase())));
    for (const p of kb.polozky.filter(cenove)) {
      const slabe = [...new Set(p.kluc.split(/[\\s|]+/).map((t) => t.replace('=', '')).filter((t) => t && !/^[A-Z>]/.test(t) && !t.endsWith('!')))].filter((t) => ![...silne].some((k) => zhoda(t, k) > 0.89));
      if (!slabe.length) continue;
      const q = `${FRAZA.cena[l]} ${slabe.join(' ')}?`, r = odpovedz(q, kb); n++;
      assert.ok(!(cena(r) && r.id === p.id), `${l} „${q}“ → ${popis(r)}: cena bez silného kmeňa`);
    }
  }
  console.log(`otázok len so slabými kmeňmi: ${n}`);
});
"""
open(p, 'w', encoding='utf8').write(s)
print('ok')
s = open(p, encoding='utf8').read()
r("assert.ok(n.otazky.length >= 2 && (n.kluc.length || n.pravidlo) && n.odovzdanie, `neúplná téma nevieme ${n.id}`);",
  "assert.ok(n.otazky.length >= 1 && (n.kluc.length || n.pravidlo) && n.odovzdanie, `neúplná téma nevieme ${n.id}`);")
r("assert.ok(t.otazky.length >= 2 && (t.kluc.length || t.pravidlo) && t.odovzdanie, `${l}/${p.id}: téma nevieme neúplná`);",
  "assert.ok(t.otazky.length >= 1 && (t.kluc.length || t.pravidlo) && t.odovzdanie, `${l}/${p.id}: téma nevieme neúplná`);")
r("//     Schéma JSON: otazky[0] je zobrazovaná otázka, kluc", "//     Schéma JSON: otazky[0] je zobrazovaná otázka (téma nevieme má len ju), kluc")
r("„!“ = silný kmeň, „=“ = len celé slovo, „|“ = skupiny)", "„!“ = silný kmeň, „=“ = len celé slovo, „>10“ = číslo nad 10, „|“ = skupiny), spoj = spojky")
open(p, 'w', encoding='utf8').write(s)
print('ok 2')
