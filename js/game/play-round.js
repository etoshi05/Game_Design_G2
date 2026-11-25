/* ==========================================
   NIGHT ROAD｜回合與階段管理
   檔案：play-round.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;


    /* ---------- 確保動態卡牌容器存在 ---------- */

    P.ensureDynamicContainers = function () {
        const el = P.el;

        if (!P.$("eventCardPicker")) {
            const eventPicker = P.makeElement("div");

            eventPicker.id = "eventCardPicker";

            el.eventDescription.insertAdjacentElement(
                "afterend",
                eventPicker
            );
        }

        if (!P.$("eventCardResult")) {
            const eventResult = P.makeElement("div");

            eventResult.id = "eventCardResult";

            P.$("eventCardPicker").insertAdjacentElement(
                "afterend",
                eventResult
            );
        }

        if (!P.$("exploreCardPicker")) {
            const explorePicker = P.makeElement("div");

            explorePicker.id = "exploreCardPicker";

            el.actionResult.insertAdjacentElement(
                "afterend",
                explorePicker
            );
        }

        if (!P.$("exploreCardResult")) {
            const exploreResult = P.makeElement("div");

            exploreResult.id = "exploreCardResult";

            P.$("exploreCardPicker").insertAdjacentElement(
                "afterend",
                exploreResult
            );
        }

        if (!P.$("verifyCardPicker")) {
            const verifyPicker = P.makeElement("div");

            verifyPicker.id = "verifyCardPicker";

            P.$("exploreCardResult").insertAdjacentElement(
                "afterend",
                verifyPicker
            );
        }
    };


    /* ---------- 階段切換 ---------- */

    P.changePhase = function (direction) {
        if (!P.gameData || P.pendingAction) {
            if (P.pendingAction) {
                P.showInlineMessage(
                    "請先完成目前玩家的卡牌選擇及確認。"
                );
            }

            return;
        }

        const currentIndex = P.PHASES.findIndex(
            item => item.id === P.gameData.currentPhase
        );

        const nextIndex = currentIndex + direction;

        if (
            nextIndex < 0 ||
            nextIndex >= P.PHASES.length
        ) {
            return;
        }

        // 事件階段必須先確認事件卡
        if (
            direction > 0 &&
            P.gameData.currentPhase === "event"
        ) {
            if (!P.gameData.currentEvent) {
                P.showInlineMessage(
                    "請先選擇本回合實際抽到的事件卡。"
                );

                return;
            }
        }

        // 行動階段必須完成所有玩家行動
        if (
            direction > 0 &&
            P.gameData.currentPhase === "action"
        ) {
            const unfinished = P.gameData.players.filter(
                player => !P.playerHasActed(player)
            );

            if (unfinished.length > 0) {
                return;
            }
        }

        P.HISTORY.snapshot();

        P.gameData.currentPhase =
            P.PHASES[nextIndex].id;

        P.save();

        P.renderAll();

        P.addLog(
            `進入${P.PHASES[nextIndex].name}。`
        );
    };


    /* ---------- 下一回合 ---------- */

    P.nextRound = function () {
        if (!P.gameData || P.pendingAction) return;

        if (P.gameData.currentRound >= 6) {
            P.showEndingCheck();
            return;
        }

        if (P.gameData.currentPhase !== "settlement") {
            P.showInlineMessage(
                "請先完成本回合的事件、討論、玩家行動及結算。"
            );

            return;
        }

        const unfinishedPlayers =
            P.gameData.players.filter(
                player => !P.playerHasActed(player)
            );

        if (unfinishedPlayers.length > 0) {
            P.el.hostHintText.textContent =
                `${unfinishedPlayers.map(p => p.name).join("、")} 還未完成行動，無法進入下一回合。`;

            P.el.hostHintText.style.color = "#e05252";

            return;
        }

        // 檢查本回合是否已抽取事件卡
        if (!P.gameData.currentEvent) {
            P.el.hostHintText.textContent =
                "本回合尚未確認事件卡，無法進入下一回合。";

            P.el.hostHintText.style.color = "#e05252";

            return;
        }

        P.HISTORY.snapshot();

        P.gameData.currentRound++;

        P.gameData.currentPhase = "event";

        P.gameData.currentPlayerIndex = 0;

        P.gameData.currentEvent = null;

        // 清除上一回合的事件卡顯示
        const eventResult = P.$("eventCardResult");

        if (eventResult) {
            eventResult.innerHTML = "";
            eventResult.hidden = true;
        }

        // 清空上一回合的事件卡選擇介面
        const eventPicker = P.$("eventCardPicker");

        if (eventPicker) {
            eventPicker.innerHTML = "";
        }

        P.save();

        P.renderAll();

        P.addLog(
            `進入第 ${P.gameData.currentRound} 回合。`
        );
    };


    /* ---------- 上一回合 ---------- */

    P.previousRound = function () {
        if (
            !P.gameData ||
            P.gameData.currentRound <= 1
        ) {
            return;
        }

        P.HISTORY.snapshot();

        P.gameData.currentRound--;

        P.gameData.currentPhase = "event";

        P.gameData.currentEvent = null;

        P.save();

        P.renderAll();

        P.addLog(
            `返回第 ${P.gameData.currentRound} 回合。`
        );
    };


    /* ---------- 結局條件檢查 ---------- */

    P.showEndingCheck = function () {
        const rules =
            P.gameData.verifiedRules.length >= 2;

        const clues =
            P.gameData.escapeClues.length >= 2;

        const token = P.gameData.exitToken;

        const missing = [];

        if (!rules) {
            missing.push("至少 2 條已驗證有效規則");
        }

        if (!clues) {
            missing.push("2 張指定逃生線索");
        }

        if (!token) {
            missing.push("出口通行信物");
        }

        if (missing.length) {
            P.showInlineMessage(
                "第六回合已結束，目前尚未達成逃離條件：\n\n" +
                missing.map(item => "・" + item).join("\n")
            );

            return;
        }

        P.showInlineMessage(
            "目前已符合基本逃離條件！\n\n請主持人確認正式逃離行動及是否達成額外傳說線索條件。"
        );
    };


    /* ---------- 撤銷上一個操作 ---------- */

    P.undoLastAction = function () {
        const result = P.HISTORY.undo();

        if (!result.success) {
            P.showInlineMessage(result.message);
            return;
        }

        P.gameData = P.STATE.get();

        P.pendingAction = null;

        P.renderAll();

        P.addLog("主持人撤銷上一個操作。");
    };


    /* ---------- 恢復遊戲 ---------- */

    P.restoreGame = function () {
        P.gameData = P.STATE.load();

        if (!P.gameData) {
            const el = P.el;

            P.setVisible(el.setupPanel, true);
            P.setVisible(el.rulesPanel, false);
            P.setVisible(el.playersPanel, false);
            P.setVisible(el.roundPanel, false);
            P.setVisible(el.logPanel, false);
            P.setVisible(el.bottomControls, false);

            P.renderPlayerSetup();

            return;
        }

        P.showGamePanels();

        P.ensureDynamicContainers();

        P.renderAll();

        P.addLog(
            "已恢復上次的遊戲進度，隱藏規則及卡牌紀錄保持不變。"
        );
    };


    /* ---------- 綁定階段及回合按鈕 ---------- */

    P.initRound = function () {
        const el = P.el;

        el.previousPhase.addEventListener(
            "click",
            () => P.changePhase(-1)
        );

        el.nextPhase.addEventListener("click", () => {
            if (P.gameData?.currentPhase === "settlement") {
                P.nextRound();
                return;
            }

            P.changePhase(1);
        });

        el.previousRound.addEventListener(
            "click",
            P.previousRound
        );
    };

})();