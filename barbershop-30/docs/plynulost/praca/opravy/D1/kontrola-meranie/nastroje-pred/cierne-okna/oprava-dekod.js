// Skúška opravy Z-DEC (pokojná verzia): záloha karty sa dekóduje vopred (img.decode()), len čo je v okolí (is-near),
// a predošlá karta zmizne až keď je nová dekódovaná. Vkladá sa cez rec.mjs --inject=oprava-dekod.js, repozitár sa nemení.
addEventListener('DOMContentLoaded', () => {
  const done = new WeakSet();
  const dec = (shot) => {
    const im = shot.querySelector('.film-still img');
    if (!im || done.has(im)) return;
    done.add(im);
    const go = () => im.decode().then(() => shot.setAttribute('data-dec', '1'), () => {});
    if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true });
  };
  const mo = new MutationObserver((ms) => ms.forEach((m) => { if (m.target.classList.contains('is-near')) dec(m.target); }));
  document.querySelectorAll('.film-shot').forEach((el) => { mo.observe(el, { attributes: true, attributeFilter: ['class'] }); if (el.classList.contains('is-near')) dec(el); });
});
