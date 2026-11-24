(() => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('category');
  const category = (window.NIGHTROAD_CARD_CATEGORIES || []).find(item => item.slug === slug);
  const title = document.querySelector('[data-category-title]');
  const count = document.querySelector('[data-card-count]');
  const grid = document.querySelector('[data-card-grid]');
  const search = document.querySelector('[data-card-search]');
  const modal = document.querySelector('[data-card-modal]');
  const modalImage = document.querySelector('[data-modal-image]');
  const modalClose = document.querySelector('[data-modal-close]');

  if (!category) {
    if (title) title.textContent = '找不到這個卡牌分類';
    if (grid) grid.innerHTML = '<p class="card-empty">請從卡牌圖鑑首頁重新選擇分類。</p>';
    return;
  }
  document.title = `${category.label}｜夜路・番婆`;
  if (title) title.textContent = category.label;

  const entries = category.cards.map((src, index) => ({ src, name: `${category.label} ${String(index + 1).padStart(2, '0')}` }));
  const render = (keyword = '') => {
    const filtered = entries.filter(card => card.name.toLowerCase().includes(keyword.trim().toLowerCase()));
    if (count) count.textContent = `共 ${filtered.length} 張`;
    if (!grid) return;
    grid.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('p'); empty.className = 'card-empty'; empty.textContent = '沒有符合搜尋條件的卡牌。'; grid.append(empty); return;
    }
    filtered.forEach(card => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'archive-card'; button.setAttribute('aria-label', `放大檢視${card.name}`);
      const img = document.createElement('img'); img.src = card.src; img.alt = card.name; img.loading = 'lazy';
      const caption = document.createElement('span'); caption.textContent = card.name;
      button.append(img, caption);
      button.addEventListener('click', () => {
        if (!modal || !modalImage) return;
        modalImage.src = card.src; modalImage.alt = card.name;
        modal.hidden = false; document.body.classList.add('modal-open');
      });
      grid.append(button);
    });
  };
  search?.addEventListener('input', () => render(search.value));
  const close = () => { if (modal) modal.hidden = true; document.body.classList.remove('modal-open'); };
  modalClose?.addEventListener('click', close);
  modal?.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  render();
})();
