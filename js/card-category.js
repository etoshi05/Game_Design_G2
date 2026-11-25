
/* =========================================
   夜路・番婆｜卡牌分類圖鑑
   card-category.js
========================================= */

(() => {

  /* =======================================
     1. 取得卡牌資料
  ======================================= */

  const categories = window.NIGHTROAD_CARD_CATEGORIES || [];

  const params = new URLSearchParams(location.search);
  const initialSlug = params.get("category");


  /* =======================================
     2. 取得 HTML 元素
  ======================================= */

  const title = document.querySelector("[data-category-title]");
  const count = document.querySelector("[data-card-count]");
  const grid = document.querySelector("[data-card-grid]");

  // 下拉選單
  const dropdownTrigger = document.querySelector("[data-dropdown-trigger]");
  const dropdownMenu = document.querySelector("[data-dropdown-menu]");
  const dropdownLabel = document.querySelector("[data-dropdown-label]");

  // 放大視窗
  const modal = document.querySelector("[data-card-modal]");
  const modalImage = document.querySelector("[data-modal-image]");
  const modalClose = document.querySelector("[data-modal-close]");


  /* =======================================
     3. 目前選擇的類別
  ======================================= */

  let currentSlug = categories.some(item => item.slug === initialSlug)
    ? initialSlug
    : "all";


      
    /* =======================================
      卡牌正式名稱
    ======================================= */

    const CARD_NAMES = {

      // 角色卡
      roles: [
        "守夜人",
        "記錄者",
        "引路人",
        "同行者",
        "守護者",
        "探路者"
      ],

      // 規則卡
      rules: [
        "不要回應呼喚",
        "不要獨自前行",
        "不要撿拾地上的物品",
        "不要相信陌生人的指引",
        "三次敲門",
        "村口的紅色標記",
        "鏡中的自己",
        "熄燈後的走廊",
        "午夜鐘聲",
        "老屋的燈"
      ],

      // 線索卡
      clues: [
        "被撕去的日記",
        "山徑巡查紀錄",
        "走廊燈光紀錄",
        "遺失物品清單",
        "老屋訪客紀錄",
        "被遺忘的名字",
        "山徑地圖",
        "村口紀錄",
        "破碎的路標",
        "遺留的車票",
        "出口旁的記號",
        "最後一頁"
      ],

      // 心理干擾卡
      mental: [
        "耳邊低語",
        "記憶錯置",
        "無法辨認的身影",
        "時間停滯",
        "錯誤的聲音",
        "最後的清醒"
      ],

      // 道具卡
      tools: [
        "手電筒",
        "舊日記",
        "安神香包",
        "銅製鑰匙",
        "紅線",
        "舊式懷錶"
      ],

      // 事件卡
      events: [
        "三次敲門",
        "有人叫你的名字",
        "燈光熄滅",
        "重複路口",
        "同伴的異常舉動",
        "遠方微弱燈火",
        "窗外的影子",
        "鐘聲響起",
        "散落的紙條",
        "陌生人的指引",
        "突然的寂靜",
        "最後的倒數"
      ]

    };


  /* =======================================
     4. 取得目前要顯示的卡牌
  ======================================= */

  
/* =======================================
   取得卡牌資料與正式名稱
======================================= */

  const getCards = () => {

    // 全部卡牌
    const selectedCategories = currentSlug === "all"
      ? categories
      : categories.filter(item => item.slug === currentSlug);

    return selectedCategories.flatMap(category => {

      return category.cards.map((src, index) => {

        const names = CARD_NAMES[category.slug] || [];

        return {
          src: src.trim(),

          // 使用卡牌圖片上的正式名稱
          name: names[index] || `${category.label} ${index + 1}`,

          category: category.label
        };

      });

    });

  };



  /* =======================================
     5. 更新頁面標題
  ======================================= */

  const updateTitle = () => {

    const selected = categories.find(
      item => item.slug === currentSlug
    );

    const label = selected ? selected.label : "全部卡牌";

    if (title) title.textContent = label;

    if (dropdownLabel) dropdownLabel.textContent = label;

    document.title = `${label}｜夜路・番婆`;

  };


  /* =======================================
     6. 建立下拉選單
  ======================================= */

  const createDropdown = () => {

    if (!dropdownMenu) return;

    dropdownMenu.replaceChildren();

    const options = [
      {
        slug: "all",
        label: "全部卡牌"
      },
      ...categories.map(category => ({
        slug: category.slug,
        label: category.label
      }))
    ];

    options.forEach(option => {

      const button = document.createElement("button");

      button.type = "button";
      button.className = "card-dropdown__item";
      button.textContent = option.label;

      button.addEventListener("click", () => {
        selectCategory(option.slug);
      });

      dropdownMenu.append(button);

    });

  };


  /* =======================================
     7. 展開與收起選單
  ======================================= */

  const openDropdown = () => {

    if (!dropdownMenu || !dropdownTrigger) return;

    dropdownMenu.hidden = false;

    dropdownTrigger.setAttribute("aria-expanded", "true");

  };


  const closeDropdown = () => {

    if (!dropdownMenu || !dropdownTrigger) return;

    dropdownMenu.hidden = true;

    dropdownTrigger.setAttribute("aria-expanded", "false");

  };


  dropdownTrigger?.addEventListener("click", () => {

    const isOpen =
      dropdownTrigger.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }

  });


  // 點擊選單以外的地方收起

  document.addEventListener("click", event => {

    if (!event.target.closest(".card-dropdown")) {
      closeDropdown();
    }

  });


  /* =======================================
     8. 切換卡牌類別
  ======================================= */

  const selectCategory = slug => {

    currentSlug = slug;

    updateTitle();

    renderCards();

    closeDropdown();

    // 更新網址，不重新載入頁面
    const url = new URL(location.href);

    if (slug === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", slug);
    }

    history.replaceState({}, "", url);

    // 更新選單選取狀態
    dropdownMenu?.querySelectorAll(".card-dropdown__item")
      .forEach(button => {

        const isActive = button.textContent === dropdownLabel.textContent;

        button.classList.toggle("is-active", isActive);

      });

  };


  /* =======================================
     9. 開啟卡牌放大視窗
  ======================================= */

  const openModal = card => {

    if (!modal || !modalImage) return;

    modalImage.src = card.src;
    modalImage.alt = card.name;

    modal.hidden = false;

    document.body.classList.add("modal-open");

    modalClose?.focus();

  };


  /* =======================================
     10. 顯示卡牌網格
  ======================================= */

  const renderCards = () => {

    if (!grid) return;

    const cards = getCards();

    // 更新數量
    if (count) {
      count.textContent = `共 ${cards.length} 張`;
    }

    grid.replaceChildren();

    // 沒有卡牌時
    if (cards.length === 0) {

      const empty = document.createElement("p");

      empty.className = "card-empty";
      empty.textContent = "目前沒有卡牌資料。";

      grid.append(empty);

      return;
    }

    // 建立每張卡牌
    cards.forEach(card => {

      const button = document.createElement("button");

      button.type = "button";
      button.className = "archive-card";

      button.setAttribute(
        "aria-label",
        `放大檢視${card.name}`
      );

      // 圖片
      const img = document.createElement("img");

      img.src = card.src;
      img.alt = card.name;
      img.loading = "lazy";

      img.addEventListener("error", () => {
        button.classList.add("image-error");
        img.alt = `${card.name}：圖片載入失敗`;
      });

      // 名稱
      const caption = document.createElement("span");

      caption.textContent = card.name;

      button.append(img, caption);

      // 點擊放大
      button.addEventListener("click", () => {
        openModal(card);
      });

      grid.append(button);

    });

  };


  /* =======================================
     11. 關閉放大視窗
  ======================================= */

  const closeModal = () => {

    if (modal) {
      modal.hidden = true;
    }

    if (modalImage) {
      modalImage.removeAttribute("src");
    }

    document.body.classList.remove("modal-open");

  };


  modalClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", event => {

    if (event.target === modal) {
      closeModal();
    }

  });


  /* =======================================
     12. 鍵盤操作
  ======================================= */

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

      closeDropdown();

      if (modal && !modal.hidden) {
        closeModal();
      }

    }

  });


  /* =======================================
     13. 初始化
  ======================================= */

  createDropdown();

  updateTitle();

  renderCards();

})();
