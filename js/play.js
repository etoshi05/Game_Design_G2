
/* ==========================================
   NIGHT ROAD｜主持人操作台
   需要先載入：
   game-data.js
   game-state.js
   game-history.js
   game-card-selector.js
   game-card-effects.js
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  const DATA = window.NIGHTROAD_GAME_DATA;
  const STATE = window.NIGHTROAD_STATE;
  const SELECTOR = window.NIGHTROAD_CARD_SELECTOR;
  const EFFECTS = window.NIGHTROAD_CARD_EFFECTS;
  const HISTORY = window.NIGHTROAD_HISTORY;

  if (!DATA || !STATE || !SELECTOR || !EFFECTS || !HISTORY) {
    console.error("遊戲模組沒有正確載入，請檢查 play.html 的 script 順序。");
    alert("遊戲程式載入失敗，請檢查 game 資料夾中的程式。");
    return;
  }

  const STORAGE_KEY = "nightRoadHostGame_v3";

  const ROLES = ["守夜人", "記錄者", "引路人", "同行者"];

  const PHASES = [
    {
      id: "event",
      name: "事件階段",
      hint: "請從實體事件卡牌堆抽取一張卡，再於網站選擇相同的卡牌。"
    },
    {
      id: "discussion",
      name: "討論階段",
      hint: "請讓玩家討論線索、規則及接下來的行動，討論時間為 2 分鐘。"
    },
    {
      id: "action",
      name: "行動階段",
      hint: "請依序選擇玩家，記錄每位玩家本回合的行動。"
    },
    {
      id: "settlement",
      name: "結算階段",
      hint: "請確認本回合卡牌效果、玩家精神值、道具及線索狀態。"
    }
  ];

  const RULE_COUNTS = {
    true: 4,
    false: 3,
    conditional: 3
  };

  const $ = id => document.getElementById(id);

  const el = {
    playerCount: $("playerCount"),
    playerSetupGrid: $("playerSetupGrid"),
    startGame: $("startGame"),
    resetGame: $("resetGame"),

    mainStatus: $("mainStatus"),
    roundNumber: $("roundNumber"),

    setupPanel: $("setupPanel"),
    rulesPanel: $("rulesPanel"),
    playersPanel: $("playersPanel"),
    roundPanel: $("roundPanel"),
    logPanel: $("logPanel"),
    bottomControls: $("bottomControls"),

    ruleSummary: $("ruleSummary"),
    ruleList: $("ruleList"),
    playerGrid: $("playerGrid"),

    currentRoundBadge: $("currentRoundBadge"),
    phaseList: $("phaseList"),

    eventTitle: $("eventTitle"),
    eventDescription: $("eventDescription"),
    hostHintText: $("hostHintText"),

    actionArea: $("actionArea"),
    activePlayer: $("activePlayer"),
    actionResult: $("actionResult"),
    inventoryGrid: $("inventoryGrid"),
    inventoryDetail: $("inventoryDetail"),
    inventoryItemName: $("inventoryItemName"),
    inventoryItemDescription: $("inventoryItemDescription"),
    inventoryUseOptions: $("inventoryUseOptions"),
    useItemButton: $("useItemButton"),
    previousPhase: $("previousPhase"),
    nextPhase: $("nextPhase"),
    previousRound: $("previousRound"),
    nextRound: $("nextRound"),

    gameLog: $("gameLog")
  };

  if (Object.values(el).some(node => !node)) {
    console.error("play.html 缺少必要的 HTML 元素。");
    return;
  }

  let gameData = null;

  // 目前等待確認的行動
  let pendingAction = null;

  // 避免重複點擊
  let processing = false;


  /* ==========================================
     共用工具
  ========================================== */

  function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  function setVisible(element, visible) {
    element.hidden = !visible;
  }

  function save() {
    STATE.save();
    gameData = STATE.get();
  }


  /* ==========================================
     玩家設定
  ========================================== */

  function renderPlayerSetup() {
    const count = Number(el.playerCount.value);

    el.playerSetupGrid.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const card = makeElement("div", "player-setup-card");

      const title = makeElement("strong", "", `玩家 ${i + 1}`);
      const label = makeElement("small", "", "選擇角色");

      const select = makeElement("select", "player-role-select");
      select.dataset.player = String(i);

      const placeholder = makeElement("option", "", "請選擇角色");
      placeholder.value = "";
      select.appendChild(placeholder);

      ROLES.forEach((role, index) => {
        const option = makeElement("option", "", role);
        option.value = role;

        if (count === 4 && index === i) {
          option.selected = true;
        }

        select.appendChild(option);
      });

      if (count === 4) {
        select.value = ROLES[i];
      }

      card.append(title, label, select);
      el.playerSetupGrid.appendChild(card);
    }
  }

  el.playerCount.addEventListener("change", renderPlayerSetup);


  function collectRoles() {
    const selects = [
      ...el.playerSetupGrid.querySelectorAll(".player-role-select")
    ];

    const roles = [];

    for (let i = 0; i < selects.length; i++) {
      const role = selects[i].value;

      if (!role) {
        alert(`請先選擇玩家 ${i + 1} 的角色。`);
        return null;
      }

      roles.push(role);
    }

    return roles;
  }


  /* ==========================================
     隨機隱藏規則
  ========================================== */


  /* ==========================================
     建立遊戲
  ========================================== */

  function startGame() {
    if (gameData) return;

    const roles = collectRoles();
    if (!roles) return;

    STATE.createGame(roles);

    gameData = STATE.get();

    const ruleResult = EFFECTS.initializeRules();

    if (!ruleResult.success) {
        alert(ruleResult.message);
        return;
    }

    gameData = STATE.get();

    // 初始化本局卡牌紀錄
    gameData.usedEvents = [];
    gameData.usedClues = [];
    gameData.usedItems = [];
    gameData.verifiedRules = [];
    gameData.escapeClues = [];
    gameData.legendClues = [];

    gameData.currentRound = 1;
    gameData.currentPhase = "event";
    gameData.currentPlayerIndex = 0;

    gameData.pendingCard = null;
    gameData.phaseCompleted = false;

    save();

    showGamePanels();

    addLog("遊戲開始，本局隱藏規則已隨機分配。");
    addLog(`本局共有 ${gameData.playerCount} 位玩家。`);
    addLog("所有玩家初始精神值為 4 點。");

    renderAll();
  }

  function showGamePanels() {
    setVisible(el.setupPanel, false);
    setVisible(el.rulesPanel, true);
    setVisible(el.playersPanel, true);
    setVisible(el.roundPanel, true);
    setVisible(el.logPanel, true);
    setVisible(el.bottomControls, true);
  }

  el.startGame.addEventListener("click", startGame);


  /* ==========================================
     遊戲紀錄
  ========================================== */

  function addLog(message) {
    if (!gameData) return;

    HISTORY.log(message);

    gameData = STATE.get();

    renderLogs();
  }

  function renderLogs() {
    el.gameLog.innerHTML = "";

    if (!gameData || !gameData.logs.length) {
      el.gameLog.appendChild(
        makeElement("p", "", "— 尚無遊戲紀錄。")
      );
      return;
    }

    [...gameData.logs].reverse().forEach(log => {
      const row = makeElement(
        "p",
        "",
        `— [${log.time}] ${log.message}`
      );

      el.gameLog.appendChild(row);
    });
  }


  /* ==========================================
     規則卡顯示
  ========================================== */

  function renderRules() {
    if (!gameData) return;

    const counts = {
      true: 0,
      false: 0,
      conditional: 0
    };

    gameData.hiddenRules.forEach(rule => {
      counts[rule.type]++;
    });

    el.ruleSummary.innerHTML = "";

    const summaryItems = [
      { key: "true", name: "真規則", className: "true-count" },
      { key: "false", name: "假規則", className: "false-count" },
      { key: "conditional", name: "條件規則", className: "conditional-count" }
    ];

    summaryItems.forEach(item => {
      const card = makeElement("div", `rule-count-card ${item.className}`);

      card.append(
        makeElement("span", "", item.name),
        makeElement("strong", "", String(counts[item.key])),
        makeElement("small", "", "張")
      );

      el.ruleSummary.appendChild(card);
    });

    el.ruleList.innerHTML = "";

    gameData.hiddenRules.forEach(rule => {
      const row = makeElement("div", "rule-item");

      const name = makeElement("strong", "", `規則卡 ${rule.id}`);

      const typeName = {
        true: "真規則",
        false: "假規則",
        conditional: "條件規則"
      }[rule.type];

      const type = makeElement(
        "span",
        `rule-type ${rule.type}`,
        typeName
      );

      row.append(name, type);
      el.ruleList.appendChild(row);
    });
  }


  /* ==========================================
     玩家狀態
  ========================================== */

  function renderPlayers() {
    if (!gameData) return;

    el.playerGrid.innerHTML = "";
    el.activePlayer.innerHTML = "";

    gameData.players.forEach((player, index) => {
      const card = makeElement("div", "player-card");

      const hasActed = playerHasActed(player);
      const isCurrentPlayer =
          gameData.currentPhase === "action" &&
          index === gameData.players.findIndex(p => !playerHasActed(p));

      if (gameData.currentPhase === "action") {
          if (hasActed) {
              card.classList.add("player-acted");
          } else if (isCurrentPlayer) {
              card.classList.add("player-current");
          } else {
              card.classList.add("player-waiting");
          }
      }

      const top = makeElement("div", "player-card-top");
      const identity = makeElement("div");

      identity.append(
        makeElement("h3", "", player.name),
        makeElement("div", "player-role", player.role)
      );

      const statusText = gameData.currentPhase !== "action"
          ? ""
          : hasActed
              ? "已完成"
              : isCurrentPlayer
                  ? "目前行動"
                  : "尚未行動";

      const status = makeElement(
          "span",
          "player-action-status",
          statusText
      );

      top.append(
          identity,
          status,
          makeElement("span", "", `${player.sanity} / 4`)
      );

      const line = makeElement("div", "sanity-line");

      line.append(
        makeElement("span", "", "精神值"),
        makeElement("span", "", `${player.sanity} 點`)
      );

      const bar = makeElement("div", "sanity-bar");
      const fill = makeElement("span");

      fill.style.width =
        `${Math.max(0, Math.min(100, player.sanity / 4 * 100))}%`;

      bar.appendChild(fill);

      const detail = makeElement(
        "div",
        "player-detail",
        `道具：${player.items.length} 件｜線索：${player.clues.length} 張`
      );

      card.append(top, line, bar, detail);
      el.playerGrid.appendChild(card);

      const option = makeElement(
        "option",
        "",
        `${player.name}｜${player.role}`
      );

      option.value = String(index);

      el.activePlayer.appendChild(option);
    });
  }
  
  /* ==========================================
      玩家道具背包
    ========================================== */

    let selectedInventoryItem = null;
    let selectedRuleId = null;
    let currentExplorationLocation = null;
    function renderInventory() {
        if (!gameData || !el.inventoryGrid) return;

        const player = getActivePlayer();

        el.inventoryGrid.innerHTML = "";
        el.inventoryDetail.hidden = true;
        el.useItemButton.disabled = true;
        selectedInventoryItem = null;

        if (!player) {
            el.inventoryGrid.appendChild(
                makeElement("p", "inventory-empty", "請先選擇玩家。")
            );
            return;
        }

        if (!player.items || player.items.length === 0) {
            el.inventoryGrid.appendChild(
                makeElement("p", "inventory-empty", `${player.name} 目前沒有持有道具。`)
            );
            return;
        }

        player.items.forEach(itemId => {
            const item = DATA.find(itemId);
            if (!item) return;

            const button = makeElement("button", "inventory-card");
            button.type = "button";

            button.append(
                makeElement("strong", "", item.name),
                makeElement("small", "", item.id)
            );

            button.addEventListener("click", () => {
                selectInventoryItem(item, button);
            });

            el.inventoryGrid.appendChild(button);
        });
    }

    function selectInventoryItem(item, button) {
        selectedInventoryItem = item;

        el.inventoryGrid
            .querySelectorAll(".inventory-card")
            .forEach(card => card.classList.remove("active"));

        button.classList.add("active");

        el.inventoryDetail.hidden = false;
        el.inventoryItemName.textContent = item.name;
        el.inventoryItemDescription.textContent = item.description;

        el.inventoryUseOptions.innerHTML = "";

        const effect = item.useEffect;

        if (!effect) {
            el.inventoryUseOptions.textContent = "此道具尚未設定使用效果。";
            el.useItemButton.disabled = true;
            return;
        }

        el.inventoryUseOptions.textContent =
            effect.consume === false
                ? "此道具使用後不會消耗。"
                : "此道具使用後會消耗。";

        el.useItemButton.disabled = false;
    }
    
    function handleUseItem() {
        if (!gameData || !selectedInventoryItem) return;

        const player = getActivePlayer();

        if (!player) {
            el.actionResult.textContent = "請先選擇玩家。";
            return;
        }

        const item = selectedInventoryItem;
        const context = {};
        const effect = item.useEffect;

        // 舊日記：自動取得目前選擇的規則卡
        if (effect.type === "rule-discussion-support") {
            if (!selectedRuleId) {
                el.actionResult.textContent = "請先選擇要討論的規則卡。";
                return;
            }

            context.action = "verify";
            context.ruleId = selectedRuleId;
        }

        // 自動取得目前事件名稱
        if (effect.triggerEvent) {
            const currentEvent = gameData.currentEvent;

            const eventCard = typeof currentEvent === "string"
                ? DATA.find(currentEvent)
                : currentEvent;

            context.eventName = eventCard?.name || currentEvent?.name || "";

            if (!context.eventName) {
                el.actionResult.textContent = "目前沒有正在發生的事件，無法使用此道具。";
                return;
            }
        }

        // 紅線：自動取得最近一次選擇的探索地點
        if (effect.location) {
            context.location = currentExplorationLocation || "";

            if (!context.location) {
                el.actionResult.textContent = "目前沒有探索地點紀錄，無法使用此道具。";
                return;
            }
        }

        // 直接執行道具效果，不跳出確認視窗
        const result = EFFECTS.useItem(
            player.id,
            item.id,
            context
        );

        if (!result.success) {
            el.actionResult.textContent = result.message;
            return;
        }

        gameData = STATE.get();

        el.actionResult.textContent = result.message;

        selectedInventoryItem = null;

        renderAll();
    }

    el.useItemButton.addEventListener("click", handleUseItem);

    el.activePlayer.addEventListener("change", () => {
        selectedInventoryItem = null;
        renderInventory();
    });
  /* ==========================================
     動態建立卡牌選擇介面
  ========================================== */

  function createCardPicker({
    title,
    category,
    container,
    playerId = null,
    onConfirm
  }) {
    container.innerHTML = "";

    const wrapper = makeElement("div", "card-picker");

    const heading = makeElement("h3", "", title);
    const instruction = makeElement(
      "p",
      "",
      "請先從實體牌堆抽卡，再選擇與實體卡牌相同的編號。"
    );

    const select = makeElement("select");
    select.className = "setup-field-select";

    SELECTOR.renderSelect(select, category);

    const detail = makeElement("div", "selected-card-detail");

    const confirmButton = makeElement(
      "button",
      "primary-btn",
      "確認卡牌"
    );

    confirmButton.type = "button";
    confirmButton.disabled = true;

    select.addEventListener("change", () => {
      const card = SELECTOR.getCard(select.value);

      detail.innerHTML = "";

      confirmButton.disabled = !card;

      if (card) {
        SELECTOR.renderCardDetail(card, detail);
      }
    });

    confirmButton.addEventListener("click", () => {
      const card = SELECTOR.getCard(select.value);

      if (!card) {
        alert("請先選擇卡牌。");
        return;
      }

      if (typeof onConfirm === "function") {
        onConfirm(card, playerId);
      }
    });

    wrapper.append(
      heading,
      instruction,
      select,
      detail,
      confirmButton
    );

    container.appendChild(wrapper);

    return wrapper;
  }


  /* ==========================================
     事件卡選擇
  ========================================== */

  function renderEventPicker() {
    const container = $("eventCardPicker");

    if (!container) return;

    createCardPicker({
      title: "主持人：選擇實體抽到的事件卡",
      category: "事件卡",
      container,

      onConfirm(card) {
        confirmEventCard(card);
      }
    });
  }

  function confirmEventCard(card) {
    if (!gameData) return;

    if (gameData.usedEvents.includes(card.id)) {
      alert("這張事件卡本局已經使用過，請選擇其他卡牌。");
      return;
    }


    HISTORY.snapshot();

    gameData.usedEvents.push(card.id);

    gameData.currentEvent = card.id;

    save();

    const detail = $("eventCardResult");

    if (detail) {
      detail.innerHTML = "";
      SELECTOR.renderCardDetail(card, detail);
    }

    addLog(`第 ${gameData.currentRound} 回合抽取事件卡：${card.id}。`);

    // 事件卡確認完成，自動進入討論階段
    gameData.currentPhase = "discussion";

    save();

    renderAll();

    addLog("事件卡確認完成，自動進入討論階段。");

    renderEventPicker();
  }


  /* ==========================================
     探索卡牌選擇
  ========================================== */

  function renderExplorePicker(player) {
    const container = $("exploreCardPicker");

    if (!container) return;
    container.hidden = false;
    container.innerHTML = "";

    const wrapper = makeElement("div", "card-picker");

    const title = makeElement("h3", "", "探索結果");

    const guide = makeElement(
      "p",
      "",
      "請選擇探索地點，再從實體牌堆抽卡，最後選擇抽到的卡牌。"
    );

    const placeLabel = makeElement("label", "", "探索地點");

    const placeSelect = makeElement("select");
    placeSelect.className = "setup-field-select";
    placeSelect.addEventListener("change", () => {
        currentExplorationLocation = placeSelect.value;
    });
    [
      "老屋",
      "山徑",
      "村口",
      "舊檔案室",
      "中央營地"
    ].forEach(place => {
      const option = makeElement("option", "", place);
      option.value = place;
      placeSelect.appendChild(option);
    });

    const categoryLabel = makeElement("label", "", "抽到的卡牌類型");

    const categorySelect = makeElement("select");
    categorySelect.className = "setup-field-select";

    [
      { value: "線索卡", label: "線索卡" },
      { value: "道具卡", label: "道具卡" }
    ].forEach(item => {
      const option = makeElement("option", "", item.label);
      option.value = item.value;
      categorySelect.appendChild(option);
    });

    const cardSelect = makeElement("select");
    cardSelect.className = "setup-field-select";

    const detail = makeElement("div", "selected-card-detail");

    const confirmButton = makeElement(
      "button",
      "primary-btn",
      "確認探索結果"
    );

    confirmButton.type = "button";
    confirmButton.disabled = true;

    function refreshCards() {
      detail.innerHTML = "";

      SELECTOR.renderSelect(
        cardSelect,
        categorySelect.value
      );

      confirmButton.disabled = true;
    }

    function showSelectedCard() {
      const card = SELECTOR.getCard(cardSelect.value);

      detail.innerHTML = "";

      confirmButton.disabled = !card;

      if (card) {
        SELECTOR.renderCardDetail(card, detail);
      }
    }

    categorySelect.addEventListener("change", refreshCards);
    cardSelect.addEventListener("change", showSelectedCard);

    refreshCards();
    currentExplorationLocation = placeSelect.value;

    confirmButton.addEventListener("click", () => {
      const card = SELECTOR.getCard(cardSelect.value);

      if (!card) {
        alert("請選擇實際抽到的卡牌。");
        return;
      }

      confirmExploreCard(
        player,
        placeSelect.value,
        card
      );
    });

    wrapper.append(
      title,
      guide,
      placeLabel,
      placeSelect,
      categoryLabel,
      categorySelect,
      cardSelect,
      detail,
      confirmButton
    );

    container.appendChild(wrapper);
  }

  function confirmExploreCard(player, place, card) {
      if (!gameData || !player || !card) return;
      currentExplorationLocation = place;
      // 確認卡牌類型
      if (!["線索卡", "道具卡"].includes(card.category)) {
          alert("這不是可用於探索的卡牌。");
          return;
      }

      // 確認卡牌是否已經使用
      const usedList = card.category === "線索卡"
          ? gameData.usedClues
          : gameData.usedItems;

      if (usedList.includes(card.id)) {
          alert("這張卡牌本局已經使用過，請選擇其他卡牌。");
          return;
      }



      // 確認卡牌效果是否已建檔
      if (!card.confirmed) {
          alert(
              "這張卡牌的效果尚未建檔，暫時無法自動執行。\n\n" +
              "請先完成 game-data.js 的卡牌效果設定。"
          );

          return;
      }

      // 執行卡牌效果
      const effectResult = EFFECTS.apply(
          card.id,
          player.id,
          {
              location: place,
              round: gameData.currentRound
          }
      );

      // 效果執行失敗，不記錄本次探索
      if (!effectResult.success) {
          alert(effectResult.message);
          return;
      }
      // 判定 EVENT-03「燈光熄滅」效果
      const eventResult = EFFECTS.resolveEvent03(
          player.id,
          "explore"
      );

      // EVENT-03 效果執行失敗
      if (!eventResult.success) {
          alert(eventResult.message);
          return;
      }

      // 重新取得最新遊戲狀態
      gameData = STATE.get();

      const currentPlayer = STATE.getPlayer(player.id);

      if (!currentPlayer) {
          alert("找不到玩家資料。");
          return;
      }

      // 記錄卡牌已使用
      const currentUsedList = card.category === "線索卡"
          ? gameData.usedClues
          : gameData.usedItems;

      if (!currentUsedList.includes(card.id)) {
          currentUsedList.push(card.id);
      }

      // 記錄玩家行動
      currentPlayer.actions.push({
          round: gameData.currentRound,
          action: "探索",
          place,
          cardId: card.id,
          effect: effectResult.message
      });

      save();

      // 顯示抽到的卡牌
      // 顯示探索結果：線索卡不顯示，道具卡不顯示
      const detail = $("exploreCardResult");

      if (detail) {
          detail.innerHTML = "";

          if (card.category === "線索卡") {
              detail.hidden = true;
              SELECTOR.renderCardDetail(card, detail);
          } else if (card.category === "道具卡") {
              detail.hidden = true;
          }
      }

      // 更新遊戲紀錄
      addLog(
          `${currentPlayer.name} 在${place}探索，取得${card.name}。`
      );

      addLog(
          `卡牌效果：${effectResult.message}`
      );
      // 記錄 EVENT-03 的效果
      if (eventResult.message) {
          addLog(`事件效果：${eventResult.message}`);
      }
      
      // 更新主持人提示
      updateHostHint(
          `卡牌效果已自動執行：${effectResult.message}`
      );

      // 完成玩家行動
      finishPlayerAction(currentPlayer);
  }

  /* ==========================================
     驗證規則
  ========================================== */

  function renderVerifyPicker(player) {
      const container = $("verifyCardPicker");

      if (!container) return;

      container.innerHTML = "";

      const wrapper = makeElement("div", "card-picker");

      const title = makeElement("h3", "", "自動驗證規則");

      const guide = makeElement(
          "p",
          "",
          "請選擇玩家要驗證的規則卡，系統會依照本局隱藏規則自動判定結果。"
      );

      const select = makeElement("select");
      select.className = "setup-field-select";

      const placeholder = makeElement(
          "option",
          "",
          "請選擇規則卡"
      );

      placeholder.value = "";
      select.appendChild(placeholder);

      DATA.rules.forEach(card => {
          const option = makeElement(
              "option",
              "",
              `${card.id}｜${card.name}`
          );

          option.value = card.id;

          select.appendChild(option);
      });

      const detail = makeElement("div", "selected-card-detail");

      const confirmButton = makeElement(
          "button",
          "primary-btn",
          "開始自動驗證"
      );

      confirmButton.type = "button";
      confirmButton.disabled = true;

      select.addEventListener("change", () => {
          selectedRuleId = select.value || null;
          const card = SELECTOR.getCard(select.value);

          detail.innerHTML = "";
          confirmButton.disabled = !card;

          if (card) {
              SELECTOR.renderCardDetail(card, detail);
          }
      });

      confirmButton.addEventListener("click", () => {
          const card = SELECTOR.getCard(select.value);

          if (!card) {
              alert("請先選擇規則卡。");
              return;
          }


          const verification = EFFECTS.verifyRule(
              card.id,
              {
                  round: gameData.currentRound
              }
          );

          if (!verification.success) {
              if (verification.pending) {
                  el.actionResult.textContent =
                      verification.message;

                  alert(verification.message);

                  return;
              }

              alert(verification.message);
              return;
          }

          player.actions.push({
              round: gameData.currentRound,
              action: "驗證規則",
              cardId: card.id,
              result: verification.valid ? "true" : "false"
          });

          save();

          el.actionResult.textContent =
              verification.message;

          addLog(
              `${player.name} 驗證 ${card.id}：${verification.message}`
          );

          finishPlayerAction(player);
      });

      wrapper.append(
          title,
          guide,
          select,
          detail,
          confirmButton
      );

      container.appendChild(wrapper);
  }


  /* ==========================================
     玩家行動流程
  ========================================== */

  function getActivePlayer() {
    const index = Number(el.activePlayer.value);
    return gameData?.players[index] || null;
  }

  function playerHasActed(player) {
    return player.actions.some(action =>
      action.round === gameData.currentRound
    );
  }

  function handlePlayerAction(action) {
    if (!gameData || processing) return;

    if (gameData.currentPhase !== "action") {
      alert("目前不是玩家行動階段。");
      return;
    }

    const player = getActivePlayer();

    if (!player) return;

    if (playerHasActed(player)) {
      alert(`${player.name} 本回合已完成行動。`);
      selectNextPlayer();
      return;
    }

    if (action === "explore") {
      pendingAction = { type: "explore", playerId: player.id };
      showPendingAction(player, "explore");
      return;
    }

    if (action === "verify") {
      pendingAction = { type: "verify", playerId: player.id };
      showPendingAction(player, "verify");
      return;
    }

    if (action === "rest") {
      HISTORY.snapshot();

      if (player.sanity >= player.maxSanity) {
        el.actionResult.textContent =
          `${player.name} 的精神值已達上限，無法恢復。`;
      } else {
        player.sanity = Math.min(
          player.maxSanity,
          player.sanity + 1
        );

        el.actionResult.textContent =
          `${player.name} 休息，精神值恢復 1 點，目前為 ${player.sanity} / 4。`;
      }

      player.actions.push({
        round: gameData.currentRound,
        action: "休息"
      });

      save();

      addLog(el.actionResult.textContent);

      renderPlayers();
      finishPlayerAction(player);

      return;
    }

    if (action === "escape") {
      handleEscape(player);
    }
  }


  function showPendingAction(player, action) {
    const exploreContainer = $("exploreCardPicker");
    const verifyContainer = $("verifyCardPicker");

    if (exploreContainer) exploreContainer.innerHTML = "";
    if (verifyContainer) verifyContainer.innerHTML = "";

    if (action === "explore") {
      renderExplorePicker(player);
    }

    if (action === "verify") {
      renderVerifyPicker(player);
    }

    el.actionResult.textContent =
      `${player.name} 正在進行${action === "explore" ? "探索" : "驗證規則"}，請完成卡牌選擇及確認。`;
  }


  function finishPlayerAction(player) {
    if (!gameData || !player) return;

    pendingAction = null;
    // 玩家完成行動後，隱藏上一位玩家的探索畫面
    const explorePicker = $("exploreCardPicker");
    const exploreResult = $("exploreCardResult");

    if (explorePicker) {
        explorePicker.innerHTML = "";
        explorePicker.hidden = true;
    }

    if (exploreResult) {
        exploreResult.innerHTML = "";
        exploreResult.hidden = true;
    }
    renderPlayers();

    const nextIndex = gameData.players.findIndex(candidate =>
      !playerHasActed(candidate)
    );

    if (nextIndex !== -1) {
      el.activePlayer.value = String(nextIndex);

      const nextPlayer = gameData.players[nextIndex];

      el.actionResult.textContent =
        `${player.name} 已完成行動。下一位是 ${nextPlayer.name}（${nextPlayer.role}）。`;

      addLog(`自動切換至 ${nextPlayer.name}。`);

    } else {
      gameData.currentPhase = "settlement";

      save();

      renderAll();

      el.actionResult.textContent =
        "所有玩家都已完成本回合行動，系統自動進入結算階段。";

      addLog(
        `第 ${gameData.currentRound} 回合所有玩家已完成行動，進入結算階段。`
      );
    }

    save();
  }


  function selectNextPlayer() {
    const nextIndex = gameData.players.findIndex(player =>
      !playerHasActed(player)
    );

    if (nextIndex !== -1) {
      el.activePlayer.value = String(nextIndex);
    }
  }


  /* ==========================================
     逃離條件
  ========================================== */

  function handleEscape(player) {
    const hasRules = gameData.verifiedRules.length >= 2;
    const hasClues = gameData.escapeClues.length >= 2;
    const hasToken = gameData.exitToken === true;

    const missing = [];

    if (!hasRules) missing.push("至少 2 條已驗證有效規則");
    if (!hasClues) missing.push("2 張指定逃生線索");
    if (!hasToken) missing.push("出口通行信物");

    if (missing.length > 0) {
      alert(
        `目前尚未符合逃離條件：\n\n${missing.map(item => "・" + item).join("\n")}`
      );
      return;
    }


    HISTORY.snapshot();

    player.escaped = true;

    player.actions.push({
      round: gameData.currentRound,
      action: "正式逃離"
    });

    save();

    addLog(`${player.name} 執行正式逃離行動。`);

    finishPlayerAction(player);
  }


  /* ==========================================
     行動按鈕
  ========================================== */

  el.actionArea.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      handlePlayerAction(button.dataset.action);
    });
  });


  /* ==========================================
     事件階段及動態卡牌區
  ========================================== */

  function ensureDynamicContainers() {
    if (!$("eventCardPicker")) {
      const eventPicker = makeElement("div");
      eventPicker.id = "eventCardPicker";
      el.eventDescription.insertAdjacentElement("afterend", eventPicker);
    }

    if (!$("eventCardResult")) {
      const eventResult = makeElement("div");
      eventResult.id = "eventCardResult";
      $("eventCardPicker").insertAdjacentElement("afterend", eventResult);
    }

    if (!$("exploreCardPicker")) {
      const explorePicker = makeElement("div");
      explorePicker.id = "exploreCardPicker";
      el.actionResult.insertAdjacentElement("afterend", explorePicker);
    }

    if (!$("exploreCardResult")) {
      const exploreResult = makeElement("div");
      exploreResult.id = "exploreCardResult";
      $("exploreCardPicker").insertAdjacentElement("afterend", exploreResult);
    }

    if (!$("verifyCardPicker")) {
      const verifyPicker = makeElement("div");
      verifyPicker.id = "verifyCardPicker";
      $("exploreCardResult").insertAdjacentElement("afterend", verifyPicker);
    }

    if (!$("undoAction")) {
      const undoButton = makeElement(
        "button",
        "secondary-btn",
        "撤銷上一步"
      );

      undoButton.id = "undoAction";
      undoButton.type = "button";

      el.roundPanel.appendChild(undoButton);

      undoButton.addEventListener("click", undoLastAction);
    }
  }


  function updateHostHint(message) {
    el.hostHintText.textContent = message;
  }


  /* ==========================================
     階段顯示
  ========================================== */

  function renderPhase() {
    if (!gameData) return;

    const phase = PHASES.find(item =>
      item.id === gameData.currentPhase
    );

    if (!phase) return;

    el.mainStatus.textContent =
      `第 ${gameData.currentRound} 回合｜${phase.name}`;

    el.currentRoundBadge.textContent =
      `第 ${gameData.currentRound} 回合`;

    el.roundNumber.textContent = gameData.currentRound;

    el.hostHintText.textContent = phase.hint;

    [...el.phaseList.querySelectorAll(".phase-item")].forEach((item, index) => {
      item.classList.toggle(
        "active",
        PHASES[index].id === gameData.currentPhase
      );
    });

    el.actionArea.hidden = phase.id !== "action";

    el.previousPhase.disabled =
      gameData.currentPhase === "event";

    el.nextPhase.textContent =
      phase.id === "settlement" ? "結束本回合" : "下一階段";
          // 檢查是否有玩家尚未行動
      const unfinishedPlayers = gameData.players.filter(player =>
          !playerHasActed(player)
      );

      const actionBlocked =
          phase.id === "action" &&
          (unfinishedPlayers.length > 0 || pendingAction);

      // 行動未完成時，禁止進入結算
      el.nextPhase.disabled = actionBlocked;

      // 顯示紅色提醒
      if (phase.id === "action" && actionBlocked) {
          const names = unfinishedPlayers.map(player => player.name);

          el.hostHintText.textContent = pendingAction
              ? "目前玩家尚未完成卡牌選擇及確認。"
              : `${names.join("、")} 還未行動。`;

          el.hostHintText.style.color = "#e05252";
      } else {
          el.hostHintText.textContent = phase.hint;
          el.hostHintText.style.color = "";
      }

    el.previousRound.disabled = gameData.currentRound <= 1;

    el.nextRound.disabled =
      gameData.currentRound >= 6;

    if (phase.id === "event") {
      const eventResult = $("eventCardResult");

      if (eventResult) {
          eventResult.hidden = false;
      }
      el.eventTitle.textContent = "事件卡抽取";
      el.eventDescription.textContent =
        "請從實體事件卡堆抽取一張卡，再在下方選擇相同卡牌。";
      const eventPicker = $("eventCardPicker");

      if (eventPicker) {
          eventPicker.hidden = false;
      }
      renderEventPicker();
    }

    if (phase.id === "discussion") {
        const eventResult = $("eventCardResult");

        if (eventResult) {
            eventResult.hidden = true;
        }
        el.eventTitle.textContent = "玩家討論時間";
        el.eventDescription.textContent =
            "請讓玩家討論線索、規則及接下來的行動。討論時間為 2 分鐘。";

        // 隱藏事件卡選擇區
        const eventPicker = $("eventCardPicker");

        if (eventPicker) {
            eventPicker.innerHTML = "";
            eventPicker.hidden = true;
        }
    }

    if (phase.id === "action") {
      const eventResult = $("eventCardResult");

      if (eventResult) {
          eventResult.hidden = true;
      }
      el.eventTitle.textContent = "玩家行動階段";
      el.eventDescription.textContent =
        "每位玩家依序選擇一項行動。完成後系統會自動切換下一位玩家。";

      $("eventCardPicker").innerHTML = "";

      const firstUnacted = gameData.players.findIndex(player =>
        !playerHasActed(player)
      );

      if (firstUnacted !== -1) {
        el.activePlayer.value = String(firstUnacted);
      }
    }

    if (phase.id === "settlement") {
      el.eventTitle.textContent = "回合結算";
      el.eventDescription.textContent =
        "請確認所有玩家行動、事件效果及精神值變化。確認完成後即可結束本回合。";

      $("eventCardPicker").innerHTML = "";
    }
  }


  /* ==========================================
     階段切換
  ========================================== */

  function changePhase(direction) {
    if (!gameData || pendingAction) {
      if (pendingAction) {
        alert("請先完成目前玩家的卡牌選擇及確認。");
      }
      return;
    }

    const currentIndex = PHASES.findIndex(item =>
      item.id === gameData.currentPhase
    );

    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= PHASES.length) return;

    if (direction > 0 && gameData.currentPhase === "event") {
      if (!gameData.currentEvent) {
        alert("請先選擇本回合實際抽到的事件卡。");
        return;
      }
    }

    if (direction > 0 && gameData.currentPhase === "action") {
        const unfinished = gameData.players.filter(player =>
            !playerHasActed(player)
        );

        if (unfinished.length > 0) {
            return;
        }
    }

    HISTORY.snapshot();

    gameData.currentPhase = PHASES[nextIndex].id;

    save();

    renderAll();

    addLog(`進入${PHASES[nextIndex].name}。`);
  }

  el.previousPhase.addEventListener("click", () => {
    changePhase(-1);
  });

  el.nextPhase.addEventListener("click", () => {
      if (gameData.currentPhase === "settlement") {
          nextRound();
          return;
      }

      changePhase(1);
  });


  /* ==========================================
     回合切換
  ========================================== */

  function nextRound() {
    if (!gameData || pendingAction) return;

    if (gameData.currentRound >= 6) {
      showEndingCheck();
      return;
    }

    if (gameData.currentPhase !== "settlement") {
      alert("請先完成本回合的事件、討論、玩家行動及結算。");
      return;
    }
    const unfinishedPlayers = gameData.players.filter(
        player => !playerHasActed(player)
    );

    if (unfinishedPlayers.length > 0) {
        el.hostHintText.textContent =
            `${unfinishedPlayers.map(p => p.name).join("、")} 還未完成行動，無法進入下一回合。`;

        el.hostHintText.style.color = "#e05252";
        return;
    }

    // 檢查本回合是否已抽取事件卡
    if (!gameData.currentEvent) {
        el.hostHintText.textContent =
            "本回合尚未確認事件卡，無法進入下一回合。";

        el.hostHintText.style.color = "#e05252";
        return;
    }
    HISTORY.snapshot();

    gameData.currentRound++;
    gameData.currentPhase = "event";
    gameData.currentPlayerIndex = 0;
    gameData.currentEvent = null;
    // 清除上一回合的事件卡顯示
    const eventResult = $("eventCardResult");

    if (eventResult) {
        eventResult.innerHTML = "";
        eventResult.hidden = true;
    }

    // 清空上一回合的事件卡選擇介面
    const eventPicker = $("eventCardPicker");

    if (eventPicker) {
        eventPicker.innerHTML = "";
    }
    save();

    renderAll();

    addLog(`進入第 ${gameData.currentRound} 回合。`);
  }

  function previousRound() {
    if (!gameData || gameData.currentRound <= 1) return;

    

    HISTORY.snapshot();

    gameData.currentRound--;
    gameData.currentPhase = "event";
    gameData.currentEvent = null;

    save();

    renderAll();

    addLog(`返回第 ${gameData.currentRound} 回合。`);
  }

  el.nextRound.addEventListener("click", nextRound);
  el.previousRound.addEventListener("click", previousRound);


  /* ==========================================
     結局條件檢查
  ========================================== */

  function showEndingCheck() {
    const rules = gameData.verifiedRules.length >= 2;
    const clues = gameData.escapeClues.length >= 2;
    const token = gameData.exitToken;

    const missing = [];

    if (!rules) missing.push("至少 2 條已驗證有效規則");
    if (!clues) missing.push("2 張指定逃生線索");
    if (!token) missing.push("出口通行信物");

    if (missing.length) {
      alert(
        "第六回合已結束，目前尚未達成逃離條件：\n\n" +
        missing.map(item => "・" + item).join("\n")
      );
      return;
    }

    alert(
      "目前已符合基本逃離條件！\n\n請主持人確認正式逃離行動及是否達成額外傳說線索條件。"
    );
  }


  /* ==========================================
     撤銷
  ========================================== */

  function undoLastAction() {


    const result = HISTORY.undo();

    if (!result.success) {
      alert(result.message);
      return;
    }

    gameData = STATE.get();

    pendingAction = null;

    renderAll();

    addLog("主持人撤銷上一個操作。");
  }


  /* ==========================================
     重新開始
  ========================================== */

  function resetGame() {

    STATE.clear();

    gameData = null;
    pendingAction = null;

    setVisible(el.setupPanel, true);
    setVisible(el.rulesPanel, false);
    setVisible(el.playersPanel, false);
    setVisible(el.roundPanel, false);
    setVisible(el.logPanel, false);
    setVisible(el.bottomControls, false);

    el.playerCount.value = "4";

    el.mainStatus.textContent = "等待遊戲開始";
    el.roundNumber.textContent = "0";

    renderPlayerSetup();

    el.gameLog.innerHTML = "<p>— 尚無遊戲紀錄。</p>";

  }

  el.resetGame.addEventListener("click", resetGame);


  /* ==========================================
     全畫面更新
  ========================================== */

  function renderAll() {
      if (!gameData) return;

      renderRules();
      renderPlayers();
      renderInventory();
      renderPhase();
      renderLogs();

      el.mainStatus.textContent = "遊戲進行中";
  }


  /* ==========================================
     恢復遊戲
  ========================================== */

  function restoreGame() {
    gameData = STATE.load();

    if (!gameData) {
      setVisible(el.setupPanel, true);
      setVisible(el.rulesPanel, false);
      setVisible(el.playersPanel, false);
      setVisible(el.roundPanel, false);
      setVisible(el.logPanel, false);
      setVisible(el.bottomControls, false);

      renderPlayerSetup();
      return;
    }

    showGamePanels();

    ensureDynamicContainers();

    renderAll();

    addLog("已恢復上次的遊戲進度，隱藏規則及卡牌紀錄保持不變。");
  }


  /* ==========================================
     初始化
  ========================================== */

  ensureDynamicContainers();

  renderPlayerSetup();

  restoreGame();

});
