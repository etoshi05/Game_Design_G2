
/* ========================================
   GAME CARD SELECTOR｜主持人選卡
======================================== */

window.NIGHTROAD_CARD_SELECTOR = (() => {

  const DATA = window.NIGHTROAD_GAME_DATA;
  const STATE = window.NIGHTROAD_STATE;

  function getAvailableCards(category) {

    const state = STATE.get();

    if (!state) return [];

    let cards = DATA.byCategory(category);

    if (category === "事件卡") {

      cards = cards.filter(card =>
        !state.usedEvents.includes(card.id)
      );

    }

    if (category === "線索卡") {

      cards = cards.filter(card =>
        !state.usedClues.includes(card.id)
      );

    }

    if (category === "道具卡") {

      cards = cards.filter(card =>
        !state.usedItems.includes(card.id)
      );

    }

    return cards;

  }

  function renderSelect(selectElement, category) {

    if (!selectElement) return;

    selectElement.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "請選擇實際抽到的卡牌";

    selectElement.appendChild(placeholder);

    getAvailableCards(category).forEach(card => {

      const option = document.createElement("option");

      option.value = card.id;

      option.textContent =
        `${card.id}｜${card.name}${card.confirmed ? "" : "（待確認效果）"}`;

      selectElement.appendChild(option);

    });

  }

  function getCard(id) {
    return DATA.find(id);
  }

  function renderCardDetail(card, container) {

    if (!card || !container) return;

    container.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = card.name;

    const id = document.createElement("p");
    id.textContent = `卡牌編號：${card.id}`;

    const description = document.createElement("p");
    description.textContent = card.description;

    const status = document.createElement("p");

    status.textContent = card.confirmed
      ? "卡牌效果已確認"
      : "卡牌效果尚待確認，請依實體卡牌裁定。";

    const image = document.createElement("img");

    image.src = card.image;
    image.alt = card.name;
    image.className = "selected-game-card";

    image.onerror = () => {
      image.hidden = true;
    };

    container.append(
      image,
      title,
      id,
      description,
      status
    );

  }

  return {
    getAvailableCards,
    renderSelect,
    getCard,
    renderCardDetail
  };

})();
