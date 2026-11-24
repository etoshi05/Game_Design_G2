/* =================================
   全站共用 JS
   導覽列、目前頁面標示、淡入動畫
================================= */

document.addEventListener('DOMContentLoaded', () => {

  // 手機版導覽選單
  const menu = document.querySelector('#menu');
  const nav = document.querySelector('#navlinks');

  if (menu && nav) {
    menu.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // 標示目前所在頁面
  document.querySelectorAll('.navlinks a').forEach(a => {
    if (a.pathname === window.location.pathname) {
      a.classList.add('active');
    }

    a.addEventListener('click', () => {
      nav?.classList.remove('open');
    });
  });

  // 滾動淡入動畫
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.fade-in').forEach(el => {
      io.observe(el);
    });
  } else {
    // 不支援 IntersectionObserver 的瀏覽器，直接顯示內容
    document.querySelectorAll('.fade-in').forEach(el => {
      el.classList.add('in-view');
    });
  }

});
