
/* =========================================
   夜路・番婆｜遊戲介紹頁面互動
   rules.js
========================================= */


/* =========================================
   1. 區塊捲動進場動畫
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const fadeElements = document.querySelectorAll(".fade-in");

  // 使用者偏好減少動態效果時，直接顯示內容
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    fadeElements.forEach((element) => {
      element.classList.add("visible");
    });

    return;
  }

  // 建立捲動觀察器
  const fadeObserver = new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("visible");

          // 顯示後停止觀察
          observer.unobserve(entry.target);

        }

      });

    },
    {
      threshold: 0.12
    }
  );

  // 監聽所有區塊
  fadeElements.forEach((element) => {
    fadeObserver.observe(element);
  });

});

/* =========================================
   夜路・番婆｜遊戲介紹頁面互動
   rules.js
========================================= */


/* =========================================
   1. 區塊捲動進場動畫
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const fadeElements = document.querySelectorAll(".fade-in");

  // 使用者偏好減少動態效果時，直接顯示內容
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    fadeElements.forEach((element) => {
      element.classList.add("visible");
    });

    return;
  }

  // 建立捲動觀察器
  const fadeObserver = new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("visible");

          // 顯示後停止觀察
          observer.unobserve(entry.target);

        }

      });

    },
    {
      threshold: 0.12
    }
  );

  // 監聽所有區塊
  fadeElements.forEach((element) => {
    fadeObserver.observe(element);
  });

});
