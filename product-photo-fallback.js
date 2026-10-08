/* Lightweight fallback for product pictures when an upstream image cannot load. */
(() => {
  const labels = {
    pt: 'Fotografia temporariamente indisponível. Consulte a ficha do produto.',
    en: 'Product photo temporarily unavailable. See product details.'
  };
  const text = document.documentElement.lang.toLowerCase().startsWith('en') ? labels.en : labels.pt;
  document.querySelectorAll('img[data-hmatias-product-photo]').forEach(img => {
    const showFallback = () => {
      if (img.dataset.photoFailed === '1') return;
      img.dataset.photoFailed = '1';
      img.hidden = true;
      img.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.className = 'hmatias-product-photo-unavailable';
      fallback.textContent = text;
      fallback.setAttribute('role', 'status');
      img.insertAdjacentElement('afterend', fallback);
    };
    img.addEventListener('error', showFallback, {once: true});
    if (img.complete && img.naturalWidth === 0) showFallback();
  });
})();
