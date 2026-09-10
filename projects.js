(() => {
  const dialog = document.querySelector('#projectGallery');
  if (!dialog) return;

  const image = dialog.querySelector('[data-gallery-image]');
  const title = dialog.querySelector('[data-gallery-title]');
  const caption = dialog.querySelector('[data-gallery-caption]');
  const count = dialog.querySelector('[data-gallery-count]');
  const prev = dialog.querySelector('[data-gallery-prev]');
  const next = dialog.querySelector('[data-gallery-next]');
  const close = dialog.querySelector('[data-gallery-close]');

  let items = [];
  let index = 0;

  function render() {
    const current = items[index];
    if (!current) return;
    image.src = current.src;
    image.alt = current.alt || title.textContent || 'HMATIAS project image';
    caption.textContent = current.caption || '';
    count.textContent = `${index + 1} / ${items.length}`;
    const single = items.length <= 1;
    prev.hidden = single;
    next.hidden = single;
  }

  function move(step) {
    if (items.length < 2) return;
    index = (index + step + items.length) % items.length;
    render();
  }

  document.querySelectorAll('[data-gallery-open]').forEach(button => {
    button.addEventListener('click', () => {
      let parsed;
      try {
        parsed = JSON.parse(button.dataset.gallery || '[]');
      } catch {
        parsed = [];
      }
      items = Array.isArray(parsed) ? parsed.filter(item => item && typeof item.src === 'string') : [];
      if (!items.length) return;
      index = 0;
      title.textContent = button.dataset.galleryTitle || '';
      render();
      dialog.showModal();
    });
  });

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  close.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });
})();