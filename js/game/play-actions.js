/* ==========================================
   NIGHT ROAD｜玩家行動流程
   檔案：play-actions.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;


    /* ---------- 取得目前玩家 ---------- */

    P.getActivePlayer = function () {
        const index = Number(P.el.activePlayer.value);

        return P.gameData?.players[index] || null;
    };


    /* ---------- 判斷玩家是否已行動 ---------- */

    P.playerHasActed = function (player) {
        if (!player || !Array.isArray(player.actions)) {
            return false;
        }

        return player.actions.some(action =>
            action.round === P.gameData.currentRound &&
            !["使用道具", "事件結算"].includes(action.action)
        );
    };


    /* ---------- 處理玩家行動 ---------- */

    P.handlePlayerAction = function (action) {
        if (!P.gameData || P.processing) return;

        if (P.gameData.currentPhase !== "action") {
            P.showInlineMessage(
                "目前不是玩家行動階段。"
            );

            return;
        }

        const player = P.getActivePlayer();

        if (!player) return;

        if (P.playerHasActed(player)) {
            P.showInlineMessage(
                `${player.name} 本回合已完成行動。`
            );

            P.selectNextPlayer();
            return;
        }


        /* ---------- 探索 ---------- */

        if (action === "explore") {
            P.pendingAction = {
                type: "explore",
                playerId: player.id
            };

            P.showPendingAction(player, "explore");
            return;
        }


        /* ---------- 驗證規則 ---------- */

        if (action === "verify") {
            P.pendingAction = {
                type: "verify",
                playerId: player.id
            };

            P.showPendingAction(player, "verify");
            return;
        }


        /* ---------- 休息 ---------- */

        if (action === "rest") {
            P.HISTORY.snapshot();

            if (player.sanity >= player.maxSanity) {
                P.el.actionResult.textContent =
                    `${player.name} 的精神值已達上限，無法恢復。`;
            } else {
                player.sanity = Math.min(
                    player.maxSanity,
                    player.sanity + 1
                );

                P.el.actionResult.textContent =
                    `${player.name} 休息，精神值恢復 1 點，目前為 ${player.sanity} / 4。`;
            }

            player.actions.push({
                round: P.gameData.currentRound,
                action: "休息"
            });

            P.save();

            P.addLog(P.el.actionResult.textContent);

            P.renderPlayers();

            P.finishPlayerAction(player);

            return;
        }


        /* ---------- 前往出口 ---------- */

        if (action === "escape") {
            P.handleEscape(player);
        }
    };


    /* ---------- 顯示待完成行動 ---------- */

    P.showPendingAction = function (player, action) {
        const exploreContainer = P.$("exploreCardPicker");
        const verifyContainer = P.$("verifyCardPicker");

        if (exploreContainer) {
            exploreContainer.innerHTML = "";
            exploreContainer.hidden = false;
        }

        if (verifyContainer) {
            verifyContainer.innerHTML = "";
            verifyContainer.hidden = false;
        }

        if (action === "explore") {
            P.renderExplorePicker(player);
        }

        if (action === "verify") {
            P.renderVerifyPicker(player);
        }

        P.el.actionResult.textContent =
            `${player.name} 正在進行${action === "explore" ? "探索" : "驗證規則"}，請完成卡牌選擇及確認。`;
    };


    /* ---------- 完成玩家行動 ---------- */

    P.finishPlayerAction = function (player) {
        if (!P.gameData || !player) return;

        P.pendingAction = null;

        // 玩家完成行動後，隱藏上一位玩家的探索畫面
        const explorePicker = P.$("exploreCardPicker");
        const exploreResult = P.$("exploreCardResult");

        if (explorePicker) {
            explorePicker.innerHTML = "";
            explorePicker.hidden = true;
        }

        if (exploreResult) {
            exploreResult.innerHTML = "";
            exploreResult.hidden = true;
        }

        P.renderPlayers();

        const nextIndex = P.gameData.players.findIndex(
            candidate => !P.playerHasActed(candidate)
        );

        if (nextIndex !== -1) {
            P.el.activePlayer.value = String(nextIndex);

            const nextPlayer = P.gameData.players[nextIndex];

            // 更新目前玩家的背包
            P.renderInventory();

            // 更新玩家狀態及主持人提示
            P.renderPlayers();
            P.renderPhase();

            P.el.actionResult.textContent =
                `${player.name} 已完成行動。下一位是 ${nextPlayer.name}（${nextPlayer.role}）。`;

            P.addLog(`自動切換至 ${nextPlayer.name}。`);

        } else {
            P.gameData.currentPhase = "settlement";

            P.save();

            P.renderAll();

            P.el.actionResult.textContent =
                "所有玩家都已完成本回合行動，系統自動進入結算階段。";

            P.addLog(
                `第 ${P.gameData.currentRound} 回合所有玩家已完成行動，進入結算階段。`
            );
        }

        P.save();
    };


    /* ---------- 切換下一位尚未行動的玩家 ---------- */

    P.selectNextPlayer = function () {
        const nextIndex = P.gameData.players.findIndex(
            player => !P.playerHasActed(player)
        );

        if (nextIndex !== -1) {
            P.el.activePlayer.value = String(nextIndex);
        }
    };


    /* ---------- 逃離條件 ---------- */

    P.handleEscape = function (player) {
        const hasRules =
            P.gameData.verifiedRules.length >= 2;

        const hasClues =
            P.gameData.escapeClues.length >= 2;

        const hasToken =
            P.gameData.exitToken === true;

        const missing = [];

        if (!hasRules) {
            missing.push("至少 2 條已驗證有效規則");
        }

        if (!hasClues) {
            missing.push("2 張指定逃生線索");
        }

        if (!hasToken) {
            missing.push("出口通行信物");
        }

        if (missing.length > 0) {
            P.showInlineMessage(
                `目前尚未符合逃離條件：\n\n${missing.map(item => "・" + item).join("\n")}`
            );

            return;
        }

        P.HISTORY.snapshot();

        player.escaped = true;

        player.actions.push({
            round: P.gameData.currentRound,
            action: "正式逃離"
        });

        P.save();

        P.addLog(
            `${player.name} 執行正式逃離行動。`
        );

        P.finishPlayerAction(player);
    };


    /* ---------- 綁定行動按鈕 ---------- */

    P.initActions = function () {
        P.el.actionArea
            .querySelectorAll("[data-action]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    P.handlePlayerAction(
                        button.dataset.action
                    );
                });
            });
    };

})();