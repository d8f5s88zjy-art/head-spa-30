// pomocná skúška: porovná návrh kontrolóra (silný Vosk v produkty) s opravou (slabý vosk v depilacia + cena v produkty), len v pamäti
import { readFileSync } from 'node:fs';
const root = process.argv[2];
const { odpovedz } = await import(root + '/assets/recepcia.js');
const kb = () => JSON.parse(readFileSync(`${root}/assets/recepcia/sk.json`, 'utf8'));
const uprav = (k, f) => { for (const p of [...k.polozky, ...k.nevieme]) f(p); return k; };
const navrh = uprav(kb(), (p) => { if (p.id === 'depilacia') p.kluc = 'Depil Usi Usn Chlp =Nos =Nose =Nosa | Vosk Usi Usn Nos'; if (p.id === 'produkty') p.kluc = p.kluc.replace(' vosk', ' Vosk'); });
const oprava = uprav(kb(), (p) => { if (p.id === 'depilacia') p.kluc = p.kluc.replace('Vosk', 'vosk'); if (p.id === 'produkty') p.cena = 1; });
const Q = ['kolko stoji vosk na vlasy', 'cena vosku na vlasy', 'kolko stoji vosk', 'kolko stoji olej na bradu', 'vosk usi a nos', 'depilacia voskom', 'kolko stoji depilacia usi voskom', 'depilacia nosa voskom cena'];
for (const q of Q) { const a = odpovedz(q, navrh), b = odpovedz(q, oprava); console.log(`${q} → návrh: ${a.typ} ${a.id} | oprava: ${b.typ} ${b.id}`); }
