/* ==========================================
   NIGHT ROAD｜玩家道具背包
   檔案：play-inventory.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;

    // 目前選擇的道具
    P.selectedInventoryItem = null;

    // 目前選擇的規則卡
    P.selectedRuleId = null;

    // 最近一次探索地點
    P.currentExplorationLocation = null;


    /* ---------- 顯示玩家背包 ---------- */

    P.renderInventory = function () {
        const el = P.el;

        if (!P.gameData || !el.inventoryGrid) return;

        const player = P.getActivePlayer();

        el.inventoryGrid.innerHTML = "";
        el.inventoryDetail.hidden = true;
        el.useItemButton.disabled = true;

        P.selectedInventoryItem = null;

        if (!player) {
            el.inventoryGrid.appendChild(
                P.makeElement(
                    "p",
                    "inventory-empty",
                    "請先選擇玩家。"
                )
            );

            return;
        }

        if (!player.items || player.items.length === 0) {
            el.inventoryGrid.appendChild(
                P.makeElement(
                    "p",
                    "inventory-empty",
                    `${player.name} 目前沒有持有道具。`
                )
            );

            return;
        }

        player.items.forEach(itemId => {
            const item = P.DATA.find(itemId);

            if (!item) return;

            const button = P.makeElement(
                "button",
                "inventory-card"
            );

            button.type = "button";

            button.append(
                P.makeElement("strong", "", item.name),
                P.makeElement("small", "", item.id)
            );

            button.addEventListener("click", () => {
                P.selectInventoryItem(item, button);
            });

            el.inventoryGrid.appendChild(button);
        });
    };


    /* ---------- 選擇道具 ---------- */

    P.selectInventoryItem = function (item, button) {
        P.selectedInventoryItem = item;
        P.selectedRuleId = null;

        P.el.inventoryGrid
            .querySelectorAll(".inventory-card")
            .forEach(card => card.classList.remove("active"));

        button.classList.add("active");

        P.el.inventoryDetail.hidden = false;
        P.el.inventoryItemName.textContent = item.name;
        P.el.inventoryItemDescription.textContent = item.description;

        P.el.inventoryUseOptions.innerHTML = "";

        const effect = item.useEffect;

        if (!effect) {
            P.el.inventoryUseOptions.textContent =
                "此道具尚未設定使用效果。";

            P.el.useItemButton.disabled = true;
            return;
        }

        // 舊日記：建立規則卡選擇欄位
        if (
            item.id === "ITEM-02" ||
            effect.type === "rule-discussion-support"
        ) {
            const label = P.makeElement(
                "label",
                "",
                "選擇要討論的規則卡"
            );

            const select = P.makeElement("select");
            select.className = "setup-field-select";

            const placeholder = P.makeElement(
                "option",
                "",
                "請選擇規則卡"
            );

            placeholder.value = "";
            select.appendChild(placeholder);

            if (!Array.isArray(P.DATA.rules)) {
                console.error("找不到規則卡資料：P.DATA.rules");
                P.el.inventoryUseOptions.textContent =
                    "目前無法載入規則卡清單。";
                P.el.useItemButton.disabled = true;
                return;
            }

            P.DATA.rules.forEach(card => {
                const option = P.makeElement(
                    "option",
                    "",
                    `${card.id}｜${card.name}`
                );

                option.value = card.id;
                select.appendChild(option);
            });

            select.addEventListener("change", () => {
                P.selectedRuleId = select.value || null;
            });

            P.el.inventoryUseOptions.append(
                label,
                select
            );
        }

        const consumeText = P.makeElement(
            "p",
            "",
            effect.consume === false
                ? "此道具使用後不會消耗。"
                : "此道具使用後會消耗。"
        );

        P.el.inventoryUseOptions.appendChild(consumeText);

        P.el.useItemButton.disabled = false;
    };


    /* ---------- 使用道具 ---------- */

    P.handleUseItem = function () {
        if (!P.gameData || !P.selectedInventoryItem) return;

        const player = P.getActivePlayer();

        if (!player) {
            P.el.actionResult.textContent = "請先選擇玩家。";
            return;
        }

        const item = P.selectedInventoryItem;
        const context = {};
        const effect = item.useEffect;

        // 舊日記：自動取得目前選擇的規則卡
        if (effect.type === "rule-discussion-support") {
            if (!P.selectedRuleId) {
                P.el.actionResult.textContent =
                    "請先選擇要討論的規則卡。";

                return;
            }

            context.action = "verify";
            context.ruleId = P.selectedRuleId;
        }

        // 自動取得目前事件名稱
        if (effect.triggerEvent) {
            const currentEvent = P.gameData.currentEvent;

            const eventCard =
                typeof currentEvent === "string"
                    ? P.DATA.find(currentEvent)
                    : currentEvent;

            context.eventName =
                eventCard?.name ||
                currentEvent?.name ||
                "";

            if (!context.eventName) {
                P.el.actionResult.textContent =
                    "目前沒有正在發生的事件，無法使用此道具。";

                return;
            }
        }

        // 紅線：自動取得最近一次選擇的探索地點
        if (effect.location) {
            context.location =
                P.currentExplorationLocation || "";

            if (!context.location) {
                P.el.actionResult.textContent =
                    "目前沒有探索地點紀錄，無法使用此道具。";

                return;
            }
        }

        // 直接執行道具效果
        const result = P.EFFECTS.useItem(
            player.id,
            item.id,
            context
        );

        if (!result.success) {
            P.el.actionResult.textContent = result.message;
            return;
        }

        P.gameData = P.STATE.get();

        P.el.actionResult.textContent = result.message;

        P.selectedInventoryItem = null;
        P.selectedRuleId = null;

        // 重新更新玩家背包及遊戲畫面
        P.renderAll();

        // 同步更新主持人提示
        P.el.hostHintText.textContent = result.message;
        P.el.hostHintText.style.color = "#c9a66b";

        // 舊式懷錶：立即進入額外 3 分鐘討論
        if (item.id === "ITEM-06") {
            // 原本討論 2 分鐘，加上懷錶增加的 1 分鐘
            const discussionMinutes =
                2 + (Number(effect.extraMinutes) || 1);

            P.startExtraDiscussion(discussionMinutes);
        }
    };


    /* ---------- 綁定背包事件 ---------- */

    P.initInventory = function () {
        P.el.useItemButton.addEventListener(
            "click",
            P.handleUseItem
        );

        P.el.activePlayer.addEventListener("change", () => {
            P.selectedInventoryItem = null;

            P.renderInventory();

            if (P.gameData?.currentPhase === "action") {
                P.renderPhase();
            }
        });
    };

})();