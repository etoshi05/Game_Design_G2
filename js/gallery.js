(() => {
  const categories = window.NIGHTROAD_CARD_CATEGORIES || [];
  const trackA = document.querySelector('[data-gallery-track="a"]');
  const trackB = document.querySelector('[data-gallery-track="b"]');
  if (!trackA || !trackB) return;

  // 每類取出全部卡牌，兩列交錯排列；點擊任何卡牌都進入該分類圖鑑。
  const cards = categories.flatMap(category => category.cards.map((src, index) => ({
    src, label: category.label, slug: category.slug, index
  })));
  const makeCard = ({ src, label, slug, index }) => {
    const link = document.createElement('a');
    link.className = 'gallery-card';
    link.href = `card-category.html?category=${encodeURIComponent(slug)}`;
    link.setAttribute('aria-label', `瀏覽${label}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${label} ${index + 1}`;
    img.loading = 'lazy';
    link.append(img);
    return link;
  };
  const split = cards.filter((_, i) => i % 2 === 0);
  const other = cards.filter((_, i) => i % 2 === 1);
  // 複製一輪內容，讓 CSS 無縫循環；複製項目不另設不同目的地。
  [ [trackA, split], [trackB, other] ].forEach(([track, items]) => {
    [...items, ...items].forEach(item => track.append(makeCard(item)));
  });
})();
