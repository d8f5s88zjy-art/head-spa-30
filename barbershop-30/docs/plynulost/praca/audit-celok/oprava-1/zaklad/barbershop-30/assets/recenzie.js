/* Recenzie zákazníkov: doslovné citácie z Google Maps, profil „Barbershop30 Nitra“ (5,0 z 945 recenzií), overené
   13. 10. 2026 znovu priamo na zdroji (docs/CONTENT_SOURCES.md, časť Recenzie). Text sa neopravuje; „…“ označuje
   vynechanú časť dlhšej recenzie. Mená sú skrátené na meno a iniciálu priezviska. Modul načíta app.js hneď po štarte,
   aby recenzie nezväčšili HTML (prvé okno TCP). */
const GOOGLE = 'https://www.google.com/maps?cid=18132360254733427623';
const RECENZIE = [
  {
    "meno": "Marek J.",
    "lang": "sk",
    "text": "Barbershop si drží vysokú kvalitu aj po rokoch fungovania, čo dnes nie je samozrejmosť. Vidno, že majiteľ sa podniku aktívne venuje a záleží mu na úrovni služieb. Príjemným bonusom je aj nápoj v cene strihania. Každý si síce musí nájsť svojho barbera, ktorý mu najviac sadne, ale presne takto by malo vyzerať kvalitné podnikanie."
  },
  {
    "meno": "Kristián V.",
    "lang": "sk",
    "text": "Skvelý barbershop, každý barber vie čo robí a rozumie svojej práci. Veľmi profesionálny prístup. Strih spravený presne podľa predstáv, rýchlo a kvalitne. Výsledok vyzerá super, určite odporúčam každému, kto chce dobrý strih za rozumnú cenu."
  },
  {
    "meno": "Stanislava B.",
    "lang": "sk",
    "text": "Prvá skúsenosť s týmto barbershopom veľmi pozitívna. Strihal ma Tony a bola som spokojná ako s jeho prístupom tak aj s finálnym výsledkom. Ak vás bavia mullety, určite odporúčam práve jeho. Ja sa čoskoro opäť vrátim 🤙🏻"
  },
  {
    "meno": "Marcel W.",
    "lang": "en",
    "text": "The haircut was done with incredible precision, professionalism, and great attention to detail. … I will definitely keep coming back every time I’m in Nitra."
  },
  {
    "meno": "Jana U.",
    "lang": "sk",
    "text": "Syn bol u Vás prvýkrát, pri vstupe hned bol obslúžený a usadený do kresla bez rezervácie, veľmi spokojný s účesom, príjemné pocity, tak dalšia cesta na strihanie bude určite k Vám BARBERSHOP 30, Ďakujeme"
  },
  {
    "meno": "Ladislav T.",
    "lang": "sk",
    "text": "Super priestor, rezervácia bola presne na čas. Ponúkli aj občerstvenie. Strihal má sympatický, šikovný chalan - Tony. S účesom som nadmieru spokojný. 👍"
  }
];

export function spusti(zoznam) {
  const box = zoznam.closest('.recenzie');
  zoznam.replaceChildren(...RECENZIE.map((r) => {
    const li = document.createElement('li');
    const fig = document.createElement('figure');
    const q = document.createElement('blockquote');
    q.lang = r.lang; q.cite = GOOGLE;
    const p = document.createElement('p'); p.textContent = r.text; q.append(p);
    const cap = document.createElement('figcaption');
    const hv = document.createElement('span'); hv.className = 'rec-hv'; hv.setAttribute('aria-hidden', 'true'); hv.textContent = '★★★★★';
    cap.append(hv, `${r.meno} · Google`);
    fig.append(q, cap); li.append(fig);
    return li;
  }));
  if (box) box.hidden = false;
}
