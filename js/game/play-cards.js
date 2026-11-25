/* ==========================================
   NIGHT ROAD｜卡牌選擇與效果
   檔案：play-cards.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;


    /* ==========================================
       共用卡牌選擇介面
    ========================================== */

    P.createCardPicker = function ({
        title,
        category,
        container,
        playerId = null,
        onConfirm
    }) {
        container.innerHTML = "";

        const wrapper = P.makeElement(
            "div",
            "card-picker"
        );

        const heading = P.makeElement(
            "h3",
            "",
            title
        );

        const instruction = P.makeElement(
            "p",
            "",
            "請先從實體牌堆抽卡，再選擇與實體卡牌相同的編號。"
        );

        const select = P.makeElement("select");

        select.className = "setup-field-select";

        P.SELECTOR.renderSelect(select, category);

        const detail = P.makeElement(
            "div",
            "selected-card-detail"
        );

        const confirmButton = P.makeElement(
            "button",
            "primary-btn",
            "確認卡牌"
        );

        confirmButton.type = "button";
        confirmButton.disabled = true;

        select.addEventListener("change", () => {
            const card = P.SELECTOR.getCard(select.value);

            detail.innerHTML = "";

            confirmButton.disabled = !card;

            if (card) {
                P.SELECTOR.renderCardDetail(card, detail);
            }
        });

        confirmButton.addEventListener("click", () => {
            const card = P.SELECTOR.getCard(select.value);

            if (!card) {
                P.showInlineMessage("請先選擇卡牌。");
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
    };


    /* ==========================================
       事件卡選擇
    ========================================== */

    P.renderEventPicker = function () {
        const container = P.$("eventCardPicker");

        if (!container) return;

        P.createCardPicker({
            title: "主持人：選擇實體抽到的事件卡",
            category: "事件卡",
            container,

            onConfirm(card) {
                P.confirmEventCard(card);
            }
        });
    };


    /* ---------- 確認事件卡 ---------- */

    P.confirmEventCard = function (card) {
        if (!P.gameData) return;

        if (P.gameData.usedEvents.includes(card.id)) {
            P.showInlineMessage(
                "這張事件卡本局已經使用過，請選擇其他卡牌。"
            );

            return;
        }

        P.HISTORY.snapshot();

        P.gameData.usedEvents.push(card.id);

        P.gameData.currentEvent = card.id;

        P.save();

        const detail = P.$("eventCardResult");

        if (detail) {
            detail.innerHTML = "";
            P.SELECTOR.renderCardDetail(card, detail);
        }

        P.addLog(
            `第 ${P.gameData.currentRound} 回合抽取事件卡：${card.id}。`
        );

        // 事件卡確認完成，自動進入討論階段
        P.gameData.currentPhase = "discussion";

        P.save();

        P.renderAll();

        P.addLog("事件卡確認完成，自動進入討論階段。");

        P.renderEventPicker();
    };


    /* ==========================================
       探索卡牌選擇
    ========================================== */

    P.renderExplorePicker = function (player) {
        const container = P.$("exploreCardPicker");

        if (!container) return;

        container.hidden = false;
        container.innerHTML = "";

        const wrapper = P.makeElement(
            "div",
            "card-picker"
        );

        const title = P.makeElement(
            "h3",
            "",
            "探索結果"
        );

        const guide = P.makeElement(
            "p",
            "",
            "請選擇探索地點，再從實體牌堆抽卡，最後選擇抽到的卡牌。"
        );

        // 探索地點
        const placeLabel = P.makeElement(
            "label",
            "",
            "探索地點"
        );

        const placeSelect = P.makeElement("select");

        placeSelect.className = "setup-field-select";

        [
            "老屋",
            "山徑",
            "村口",
            "舊檔案室",
            "中央營地"
        ].forEach(place => {
            const option = P.makeElement(
                "option",
                "",
                place
            );

            option.value = place;

            placeSelect.appendChild(option);
        });

        placeSelect.addEventListener("change", () => {
            P.currentExplorationLocation = placeSelect.value;
        });


        // 卡牌類型
        const categoryLabel = P.makeElement(
            "label",
            "",
            "抽到的卡牌類型"
        );

        const categorySelect = P.makeElement("select");

        categorySelect.className = "setup-field-select";

        [
            {
                value: "線索卡",
                label: "線索卡"
            },
            {
                value: "道具卡",
                label: "道具卡"
            }
        ].forEach(item => {
            const option = P.makeElement(
                "option",
                "",
                item.label
            );

            option.value = item.value;

            categorySelect.appendChild(option);
        });


        // 卡牌選擇
        const cardSelect = P.makeElement("select");

        cardSelect.className = "setup-field-select";

        const detail = P.makeElement(
            "div",
            "selected-card-detail"
        );

        const confirmButton = P.makeElement(
            "button",
            "primary-btn",
            "確認探索結果"
        );

        confirmButton.type = "button";
        confirmButton.disabled = true;


        // 更新卡牌列表
        function refreshCards() {
            detail.innerHTML = "";

            P.SELECTOR.renderSelect(
                cardSelect,
                categorySelect.value
            );

            confirmButton.disabled = true;
        }


        // 顯示選擇的卡牌
        function showSelectedCard() {
            const card = P.SELECTOR.getCard(cardSelect.value);

            detail.innerHTML = "";

            confirmButton.disabled = !card;

            if (card) {
                P.SELECTOR.renderCardDetail(card, detail);
            }
        }

        categorySelect.addEventListener(
            "change",
            refreshCards
        );

        cardSelect.addEventListener(
            "change",
            showSelectedCard
        );

        refreshCards();

        P.currentExplorationLocation = placeSelect.value;


        // 確認探索結果
        confirmButton.addEventListener("click", () => {
            const card = P.SELECTOR.getCard(cardSelect.value);

            if (!card) {
                P.showInlineMessage(
                    "請選擇實際抽到的卡牌。"
                );

                return;
            }

            P.confirmExploreCard(
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
    };


    /* ---------- 確認探索卡牌 ---------- */

    P.confirmExploreCard = function (player, place, card) {
        if (!P.gameData || !player || !card) return;
            // EVENT-04｜重複路口
            // 山徑探索必須持有紅線保護或破碎的路標
            const currentEventId =
                typeof P.gameData.currentEvent === "string"
                    ? P.gameData.currentEvent
                    : P.gameData.currentEvent?.id;

            if (
                currentEventId === "EVENT-04" &&
                place === "山徑"
            ) {
                const protection = P.gameData.protections?.[player.id];

                const hasRedLineProtection =
                    protection &&
                    protection.type === "exploration" &&
                    protection.location === "山徑" &&
                    protection.round === P.gameData.currentRound;

                const hasSignpostClue =
                    Array.isArray(player.clues) &&
                    player.clues.includes("CLUE-08");

                if (!hasRedLineProtection && !hasSignpostClue) {
                    P.showInlineMessage(
                        "目前發生「重複路口」事件，必須使用紅線或持有破碎的路標，才能在山徑取得卡牌。"
                    );
                    return;
                }
            }

        P.currentExplorationLocation = place;

        // 確認卡牌類型
        if (!["線索卡", "道具卡"].includes(card.category)) {
            P.showInlineMessage(
                "這不是可用於探索的卡牌。"
            );

            return;
        }

        // 確認卡牌是否已經使用
        const usedList =
            card.category === "線索卡"
                ? P.gameData.usedClues
                : P.gameData.usedItems;

        if (usedList.includes(card.id)) {
            P.showInlineMessage(
                "這張卡牌本局已經使用過，請選擇其他卡牌。"
            );

            return;
        }

        // 確認卡牌效果是否已建檔
        if (!card.confirmed) {
            P.showInlineMessage(
                "這張卡牌的效果尚未建檔，暫時無法自動執行。\n\n" +
                "請先完成 game-data.js 的卡牌效果設定。"
            );

            return;
        }

        // 執行卡牌效果
        const effectResult = P.EFFECTS.apply(
            card.id,
            player.id,
            {
                location: place,
                round: P.gameData.currentRound
            }
        );

        // 效果執行失敗，不記錄本次探索
        if (!effectResult.success) {
            P.showInlineMessage(effectResult.message);
            return;
        }

        // 判定 EVENT-03「燈光熄滅」效果
        const eventResult = P.EFFECTS.resolveEvent03(
            player.id,
            "explore"
        );

        // EVENT-03 效果執行失敗
        if (!eventResult.success) {
            P.showInlineMessage(eventResult.message);
            return;
        }

        // 重新取得最新遊戲狀態
        P.gameData = P.STATE.get();

        const currentPlayer = P.STATE.getPlayer(player.id);

        if (!currentPlayer) {
            P.showInlineMessage("找不到玩家資料。");
            return;
        }

        // 記錄卡牌已使用
        const currentUsedList =
            card.category === "線索卡"
                ? P.gameData.usedClues
                : P.gameData.usedItems;

        if (!currentUsedList.includes(card.id)) {
            currentUsedList.push(card.id);
        }

        // 記錄玩家行動
        currentPlayer.actions.push({
            round: P.gameData.currentRound,
            action: "探索",
            place,
            cardId: card.id,
            effect: effectResult.message
        });

        P.save();

        // 顯示探索結果
        const detail = P.$("exploreCardResult");

        if (detail) {
            detail.innerHTML = "";

            // 保留原本設定：線索卡與道具卡均不顯示結果區
            if (card.category === "線索卡") {
                detail.hidden = true;
                P.SELECTOR.renderCardDetail(card, detail);
            } else if (card.category === "道具卡") {
                detail.hidden = true;
            }
        }

        // 更新遊戲紀錄
        P.addLog(
            `${currentPlayer.name} 在${place}探索，取得${card.name}。`
        );

        P.addLog(
            `卡牌效果：${effectResult.message}`
        );

        // 記錄 EVENT-03 的效果
        if (eventResult.message) {
            P.addLog(`事件效果：${eventResult.message}`);
        }

        // 更新主持人提示
        P.updateHostHint(
            `卡牌效果已自動執行：${effectResult.message}`
        );

        // 完成玩家行動
        P.finishPlayerAction(currentPlayer);
    };


    /* ==========================================
       驗證規則
    ========================================== */

    P.renderVerifyPicker = function (player) {
        const container = P.$("verifyCardPicker");

        if (!container) return;

        container.innerHTML = "";

        const wrapper = P.makeElement(
            "div",
            "card-picker"
        );

        const title = P.makeElement(
            "h3",
            "",
            "自動驗證規則"
        );

        const guide = P.makeElement(
            "p",
            "",
            "請選擇玩家要驗證的規則卡，系統會依照本局隱藏規則自動判定結果。"
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

        P.DATA.rules.forEach(card => {
            const option = P.makeElement(
                "option",
                "",
                `${card.id}｜${card.name}`
            );

            option.value = card.id;

            select.appendChild(option);
        });

        const detail = P.makeElement(
            "div",
            "selected-card-detail"
        );

        const confirmButton = P.makeElement(
            "button",
            "primary-btn",
            "開始自動驗證"
        );

        confirmButton.type = "button";
        confirmButton.disabled = true;


        // 選擇規則卡
        select.addEventListener("change", () => {
            P.selectedRuleId = select.value || null;

            const card = P.SELECTOR.getCard(select.value);

            detail.innerHTML = "";

            confirmButton.disabled = !card;

            if (card) {
                P.SELECTOR.renderCardDetail(card, detail);
            }
        });


        // 執行規則驗證
        confirmButton.addEventListener("click", () => {
            const card = P.SELECTOR.getCard(select.value);

            if (!card) {
                P.showInlineMessage("請先選擇規則卡。");
                return;
            }

            const verification = P.EFFECTS.verifyRule(
                card.id,
                {
                    round: P.gameData.currentRound
                }
            );

            if (!verification.success) {
                if (verification.pending) {
                    P.el.actionResult.textContent =
                        verification.message;

                    P.showInlineMessage(verification.message);

                    return;
                }

                P.showInlineMessage(verification.message);
                return;
            }

            player.actions.push({
                round: P.gameData.currentRound,
                action: "驗證規則",
                cardId: card.id,
                result: verification.valid ? "true" : "false"
            });

            P.save();

            // 顯示規則卡的實際類型
            const ruleTypeNames = {
                true: "真規則",
                false: "假規則",
                conditional: "條件規則"
            };

            const ruleTypeName =
                ruleTypeNames[verification.rule?.type] || "未知類型";

            // 根據驗證結果顯示訊息
            const verificationText = verification.valid
                ? `驗證成功！這張是「${ruleTypeName}」。`
                : `驗證失敗！這張是「${ruleTypeName}」。`;

            P.el.actionResult.textContent = verificationText;

            // 寫入遊戲紀錄
            P.addLog(
                `${player.name} 驗證 ${card.id}：${verificationText}`
            );

            P.finishPlayerAction(player);
            // 保留驗證結果，並附上行動切換提示
            const nextActionMessage = P.el.actionResult.textContent;

            P.el.actionResult.textContent =
                `${verificationText}\n${nextActionMessage}`;
        });


        wrapper.append(
            title,
            guide,
            select,
            detail,
            confirmButton
        );

        container.appendChild(wrapper);
    };

})();