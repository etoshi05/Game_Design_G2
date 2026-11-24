/* =================================
   首頁專用 JS
   漂浮火光效果
================================= */

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.embers').forEach(layer => {
    // 避免同一個容器重複建立火光
    if (layer.dataset.embersReady === 'true') return;
    layer.dataset.embersReady = 'true';

    for (let i = 0; i < 26; i++) {
      const particle = document.createElement('i');

      particle.className = 'ember';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.setProperty(
        '--dur',
        (7 + Math.random() * 12) + 's'
      );
      particle.style.setProperty(
        '--delay',
        (-Math.random() * 18) + 's'
      );

      layer.appendChild(particle);
    }
  });

});
