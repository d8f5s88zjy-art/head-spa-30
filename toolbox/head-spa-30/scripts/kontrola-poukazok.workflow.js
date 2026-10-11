export const meta = {
  name: 'kontrola-poukazok',
  description: 'Nezávislá vizuálna kontrola obrázkov poukazov pre Booqme: obsah, orez v obchode, okraje',
  phases: [{ title: 'Kontrola' }],
}
// Spúšťa sa nástrojom Workflow so scriptPath na tento súbor a args:
//   { koren: '<absolútna cesta k repozitáru>', pracovny: '<absolútny priečinok na výstupy>' }
// Kontroluje docs/poukazky/sablona/booqme/*.jpg podľa docs/poukazky/sablona/ritualy.json.
const K = (args && args.koren) || '.'
const P = (args && args.pracovny) || '/tmp/kontrola-poukazok'
const V = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, issue: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'minor'] } }, required: ['file', 'issue', 'severity'] } },
    notes: { type: 'string' },
  },
  required: ['pass', 'problems', 'notes'],
}
const spolu = `Images: ${K}/docs/poukazky/sablona/booqme/NN-*.jpg (1600x1200, 4:3; a 2:1 gift voucher full width in the middle, dark bands above and below). Expected ritual for each NN, its price (vouchers from the salon template show the price in euros) or duration (vouchers designed by the salon, "salon": true, show "NN minút"): read ${K}/docs/poukazky/sablona/ritualy.json (fields poradie, nazov, cena, min, salon) and ${K}/docs/booqme-sluzby.csv. Open images with the Read tool. Be strict; report only what you actually see. Write any helper files under ${P}/.`
phase('Kontrola')
const r = await parallel([
  () => agent(`${spolu}\nLens: CONTENT. Open every image. Check the printed ritual name (diacritics: Ĺ, Č, Ý, Á, Ň, Ž…), the price or duration and "2 osoby" for couple rituals against the expected data, and that the footer reads HEADSPA30.SK. Any mismatch is a blocker.`, { label: 'obsah', schema: V, phase: 'Kontrola' }),
  () => agent(`${spolu}\nLens: HOW THE BOOQME SHOP SHOWS THEM. Run: python3 ${K}/toolbox/head-spa-30/scripts/vyrez-booqme.py ${P}/vyrez ${K}/docs/poukazky/sablona/booqme/*.jpg and Read the three sheets (box 200 px high, object-fit: cover; 318 px wide on phones, 263 desktop, 192 tablet). On phone and desktop the whole voucher must be visible (ribbon, frame, fields, name, price or duration, footer): losing any of it is a blocker. On tablet, losing only ribbon, seal or field edges is minor; cut text is a blocker.`, { label: 'vyrez', schema: V, phase: 'Kontrola' }),
  () => agent(`${spolu}\nLens: EDGES AND ARTEFACTS. For each image crop the top and bottom 260 px with PIL (save under ${P}/okraje/) and Read them. Look for streaks, smudges, hard seams, colour mismatch, banding, JPEG blocking, and leftover phone UI from screenshots (buttons, page dots, status bar, rounded device corners). Anything that looks like an error rather than a deliberate dark surround is a blocker.`, { label: 'okraje', schema: V, phase: 'Kontrola' }),
])
return { obsah: r[0], vyrez: r[1], okraje: r[2] }
