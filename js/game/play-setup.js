/* ==========================================
   NIGHT ROAD｜玩家設定與遊戲建立
   檔案：play-setup.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;

    /* ---------- HTML 元素 ---------- */

    P.initElements = function () {
        const $ = P.$;

        P.el = {
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

            gameLog: $("gameLog")
        };

        const missing = Object.entries(P.el)
            .filter(([, node]) => !node)
            .map(([name]) => name);

        if (missing.length > 0) {
            console.error("play.html 缺少必要元素：", missing);
            alert("遊戲程式載入失敗，請檢查 play.html 的 HTML 元素。");
            return false;
        }

        return true;
    };


    /* ---------- 玩家角色設定 ---------- */

    P.renderPlayerSetup = function () {
        const el = P.el;
        const count = Number(el.playerCount.value);

        el.playerSetupGrid.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const card = P.makeElement(
                "div",
                "player-setup-card"
            );

            const title = P.makeElement(
                "strong",
                "",
                `玩家 ${i + 1}`
            );

            const label = P.makeElement(
                "small",
                "",
                "選擇角色"
            );

            const select = P.makeElement(
                "select",
                "player-role-select"
            );

            select.dataset.player = String(i);

            const placeholder = P.makeElement(
                "option",
                "",
                "請選擇角色"
            );

            placeholder.value = "";
            select.appendChild(placeholder);

            P.ROLES.forEach(role => {
                const option = P.makeElement(
                    "option",
                    "",
                    role
                );

                option.value = role;
                select.appendChild(option);
            });

            // 預設依照玩家順序分配角色
            select.value = P.ROLES[i];

            card.append(title, label, select);
            el.playerSetupGrid.appendChild(card);
        }
    };


    /* ---------- 收集玩家角色 ---------- */

    P.collectRoles = function () {
        const selects = [
            ...P.el.playerSetupGrid.querySelectorAll(
                ".player-role-select"
            )
        ];

        if (![5, 6].includes(selects.length)) {
            P.showInlineMessage("遊戲人數必須為 5～6 人！");
            return null;
        }

        const roles = [];

        for (let i = 0; i < selects.length; i++) {
            const role = selects[i].value;

            if (!role) {
                P.showInlineMessage(
                    `請先選擇玩家 ${i + 1} 的角色。`
                );

                return null;
            }

            roles.push(role);
        }

        if (new Set(roles).size !== roles.length) {
            P.showInlineMessage(
                "角色不可重複，請重新分配！"
            );

            return null;
        }

        return roles;
    };


    /* ---------- 顯示遊戲畫面 ---------- */

    P.showGamePanels = function () {
        const el = P.el;

        P.setVisible(el.setupPanel, false);
        P.setVisible(el.rulesPanel, true);
        P.setVisible(el.playersPanel, true);
        P.setVisible(el.roundPanel, true);
        P.setVisible(el.logPanel, true);
        P.setVisible(el.bottomControls, true);
    };


    /* ---------- 建立遊戲 ---------- */

    P.startGame = function () {
        if (P.gameData) return;

        const roles = P.collectRoles();

        if (!roles) return;

        try {
            P.STATE.createGame(roles);
        } catch (error) {
            P.showInlineMessage(error.message);
            return;
        }

        P.gameData = P.STATE.get();

        const ruleResult = P.EFFECTS.initializeRules();

        if (!ruleResult.success) {
            P.showInlineMessage(ruleResult.message);
            return;
        }

        P.gameData = P.STATE.get();

        // 初始化本局卡牌紀錄
        P.gameData.usedEvents = [];
        P.gameData.usedClues = [];
        P.gameData.usedItems = [];
        P.gameData.verifiedRules = [];
        P.gameData.escapeClues = [];
        P.gameData.legendClues = [];

        P.gameData.currentRound = 1;
        P.gameData.currentPhase = "event";
        P.gameData.currentPlayerIndex = 0;

        P.gameData.pendingCard = null;
        P.gameData.phaseCompleted = false;

        P.save();

        P.showGamePanels();

        P.addLog("遊戲開始，本局隱藏規則已隨機分配。");
        P.addLog(`本局共有 ${P.gameData.playerCount} 位玩家。`);
        P.addLog("所有玩家初始精神值為 4 點。");

        P.renderAll();
    };


    /* ---------- 重新開始遊戲 ---------- */

    P.resetGame = function () {
        P.STATE.clear();

        P.gameData = null;
        P.pendingAction = null;
        P.selectedInventoryItem = null;
        P.selectedRuleId = null;
        P.currentExplorationLocation = null;

        const el = P.el;

        P.setVisible(el.setupPanel, true);
        P.setVisible(el.rulesPanel, false);
        P.setVisible(el.playersPanel, false);
        P.setVisible(el.roundPanel, false);
        P.setVisible(el.logPanel, false);
        P.setVisible(el.bottomControls, false);

        el.playerCount.value = "5";

        el.mainStatus.textContent = "等待遊戲開始";
        el.mainStatus.style.color = "";

        el.roundNumber.textContent = "0";

        el.gameLog.innerHTML =
            "<p>— 尚無遊戲紀錄。</p>";

        P.renderPlayerSetup();

        // 清除動態卡牌區
        [
            "eventCardPicker",
            "eventCardResult",
            "exploreCardPicker",
            "exploreCardResult",
            "verifyCardPicker"
        ].forEach(id => {
            const node = P.$(id);

            if (node) {
                node.innerHTML = "";
                node.hidden = false;
            }
        });
    };


    /* ---------- 綁定事件 ---------- */

    P.initSetup = function () {
        const el = P.el;

        el.playerCount.addEventListener(
            "change",
            P.renderPlayerSetup
        );

        el.startGame.addEventListener(
            "click",
            P.startGame
        );

        el.resetGame.addEventListener(
            "click",
            P.resetGame
        );

        P.renderPlayerSetup();
    };
})();