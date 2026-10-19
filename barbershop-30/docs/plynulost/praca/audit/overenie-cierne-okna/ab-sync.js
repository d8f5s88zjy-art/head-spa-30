// A/B pre CO-2 (iný zásah ako audit): zálohy kariet dostanú decoding="sync" namiesto "async".
// Ak zmizne obraz pri výmene karty kvôli odloženému dekódovaniu (checker-imaging), s "sync" sa okná stratia.
addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.film-still img').forEach((im) => im.setAttribute('decoding', 'sync'));
  new MutationObserver(() => document.querySelectorAll('.film-still img[decoding="async"]').forEach((im) => im.setAttribute('decoding', 'sync')))
    .observe(document.body, { childList: true, subtree: true });
});
