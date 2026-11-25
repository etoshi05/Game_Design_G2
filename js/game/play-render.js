/* ==========================================
   NIGHT ROAD｜遊戲畫面更新
   檔案：play-render.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;


    /* ---------- 遊戲紀錄畫面 ---------- */

    P.renderLogs = function () {
        const el = P.el;

        el.gameLog.innerHTML = "";

        if (!P.gameData || !P.gameData.logs.length) {
            el.gameLog.appendChild(
                P.makeElement("p", "", "— 尚無遊戲紀錄。")
            );

            return;
        }

        [...P.gameData.logs].reverse().forEach(log => {
            const row = P.makeElement(
                "p",
                "",
                `— [${log.time}] ${log.message}`
            );

            el.gameLog.appendChild(row);
        });
    };


    /* ---------- 隱藏規則畫面 ---------- */

    P.renderRules = function () {
        const gameData = P.gameData;
        const el = P.el;

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
            {
                key: "true",
                name: "真規則",
                className: "true-count"
            },
            {
                key: "false",
                name: "假規則",
                className: "false-count"
            },
            {
                key: "conditional",
                name: "條件規則",
                className: "conditional-count"
            }
        ];

        summaryItems.forEach(item => {
            const card = P.makeElement(
                "div",
                `rule-count-card ${item.className}`
            );

            card.append(
                P.makeElement("span", "", item.name),
                P.makeElement(
                    "strong",
                    "",
                    String(counts[item.key])
                ),
                P.makeElement("small", "", "張")
            );

            el.ruleSummary.appendChild(card);
        });

        el.ruleList.innerHTML = "";

        gameData.hiddenRules.forEach(rule => {
            const row = P.makeElement(
                "div",
                "rule-item"
            );

            const name = P.makeElement(
                "strong",
                "",
                `${rule.id}｜${rule.name || "未命名規則"}`
            );

            const typeName = {
                true: "真規則",
                false: "假規則",
                conditional: "條件規則"
            }[rule.type];

            const type = P.makeElement(
                "span",
                `rule-type ${rule.type}`,
                typeName
            );

            row.append(name, type);
            el.ruleList.appendChild(row);
        });
    };


    /* ---------- 玩家狀態畫面 ---------- */

    P.renderPlayers = function () {
        const gameData = P.gameData;
        const el = P.el;

        if (!gameData) return;

        el.playerGrid.innerHTML = "";
        el.activePlayer.innerHTML = "";

        gameData.players.forEach((player, index) => {
            const card = P.makeElement(
                "div",
                "player-card"
            );

            const hasActed = P.playerHasActed(player);

            const firstUnacted = gameData.players.findIndex(
                p => !P.playerHasActed(p)
            );

            const isCurrentPlayer =
                gameData.currentPhase === "action" &&
                index === firstUnacted;

            if (gameData.currentPhase === "action") {
                if (hasActed) {
                    card.classList.add("player-acted");
                } else if (isCurrentPlayer) {
                    card.classList.add("player-current");
                } else {
                    card.classList.add("player-waiting");
                }
            }

            const top = P.makeElement(
                "div",
                "player-card-top"
            );

            const identity = P.makeElement("div");

            identity.append(
                P.makeElement("h3", "", player.name),
                P.makeElement("div", "player-role", player.role)
            );

            const statusText =
                gameData.currentPhase !== "action"
                    ? ""
                    : hasActed
                        ? "已完成"
                        : isCurrentPlayer
                            ? "目前行動"
                            : "尚未行動";

            const status = P.makeElement(
                "span",
                "player-action-status",
                statusText
            );

            top.append(
                identity,
                status,
                P.makeElement(
                    "span",
                    "",
                    `${player.sanity} / 4`
                )
            );

            const line = P.makeElement(
                "div",
                "sanity-line"
            );

            line.append(
                P.makeElement("span", "", "精神值"),
                P.makeElement(
                    "span",
                    "",
                    `${player.sanity} 點`
                )
            );

            const bar = P.makeElement(
                "div",
                "sanity-bar"
            );

            const fill = P.makeElement("span");

            fill.style.width =
                `${Math.max(
                    0,
                    Math.min(100, player.sanity / 4 * 100)
                )}%`;

            bar.appendChild(fill);

            const detail = P.makeElement(
                "div",
                "player-detail",
                `道具：${player.items.length} 件｜線索：${player.clues.length} 張`
            );

            card.append(top, line, bar, detail);

            el.playerGrid.appendChild(card);

            const option = P.makeElement(
                "option",
                "",
                `${player.name}｜${player.role}`
            );

            option.value = String(index);

            el.activePlayer.appendChild(option);
        });
    };


    /* ---------- 階段畫面 ---------- */

    P.renderPhase = function () {
        const gameData = P.gameData;
        const el = P.el;

        if (!gameData) return;

        const phase = P.PHASES.find(
            item => item.id === gameData.currentPhase
        );

        if (!phase) return;
        // 舊式懷錶額外討論中：暫時顯示專用討論畫面
        if (gameData.extraDiscussion) {
            el.mainStatus.textContent =
                `第 ${gameData.currentRound} 回合｜額外討論階段`;

            el.eventTitle.textContent = "舊式懷錶｜額外規則討論";

            el.eventDescription.textContent =
                "全隊可以額外進行一次規則討論，請利用這段時間分享線索及討論接下來的行動。";

            el.hostHintText.textContent =
                "舊式懷錶已啟動，全隊正在進行額外討論。";

            el.hostHintText.style.color = "#c9a66b";

            // 暫時隱藏玩家行動區，避免討論期間操作
            el.actionArea.hidden = true;
            el.previousPhase.disabled = true;
            el.nextPhase.disabled = true;

            // 隱藏事件卡選擇介面
            const eventPicker = P.$("eventCardPicker");

            if (eventPicker) {
                eventPicker.hidden = true;
            }

            P.hideDiscussionTimer?.();

            // 顯示額外討論倒數
            P.renderExtraDiscussion(el.eventDescription);

            return;
        }
        el.mainStatus.textContent =
            `第 ${gameData.currentRound} 回合｜${phase.name}`;

        el.currentRoundBadge.textContent =
            `第 ${gameData.currentRound} 回合`;

        el.roundNumber.textContent =
            gameData.currentRound;
        // 一般討論階段固定為 2 分鐘
        const discussionHint = phase.hint;
        el.hostHintText.textContent = discussionHint;

        [...el.phaseList.querySelectorAll(".phase-item")]
            .forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.phase === gameData.currentPhase
                );
            });

        el.actionArea.hidden =
            phase.id !== "action";

        el.previousPhase.disabled =
            gameData.currentPhase === "event";

        el.nextPhase.textContent =
            phase.id === "settlement"
                ? "結束本回合"
                : "下一階段";

        // 檢查是否有玩家尚未行動
        const unfinishedPlayers = gameData.players.filter(
            player => !P.playerHasActed(player)
        );

        const actionBlocked =
            phase.id === "action" &&
            (
                unfinishedPlayers.length > 0 ||
                P.pendingAction
            );

        el.nextPhase.disabled = actionBlocked;

        // 提示跟隨目前選擇的玩家
        if (phase.id === "action" && actionBlocked) {
            const player = P.getActivePlayer();

            if (P.pendingAction) {
                el.hostHintText.textContent =
                    `${player?.name || "目前玩家"} 尚未完成行動，請完成卡牌選擇及確認。`;
            } else if (player && !P.playerHasActed(player)) {
                el.hostHintText.textContent =
                    `${player.name} 尚未行動，請完成本回合行動。`;
            } else {
                el.hostHintText.textContent =
                    "請選擇尚未行動的玩家。";
            }

            el.hostHintText.style.color = "#e05252";
        } else {
            el.hostHintText.textContent = discussionHint;
            el.hostHintText.style.color = "";
        }

        el.previousRound.disabled =
            gameData.currentRound <= 1;


        /* ---------- 事件階段 ---------- */

        if (phase.id === "event") {
            const eventResult = P.$("eventCardResult");

            if (eventResult) {
                eventResult.hidden = false;
            }

            el.eventTitle.textContent = "事件卡抽取";

            el.eventDescription.textContent =
                "請從實體事件卡堆抽取一張卡，再在下方選擇相同卡牌。";

            const eventPicker = P.$("eventCardPicker");

            if (eventPicker) {
                eventPicker.hidden = false;
            }

            P.renderEventPicker();
        }


        /* ---------- 討論階段 ---------- */

        if (phase.id === "discussion") {
            const eventResult = P.$("eventCardResult");

            if (eventResult) {
                eventResult.hidden = true;
            }

            el.eventTitle.textContent = "玩家討論時間";

            el.eventDescription.textContent =
                "請讓玩家討論線索、規則及接下來的行動。討論時間為 2 分鐘。";

            el.hostHintText.textContent =
                el.eventDescription.textContent;

            el.hostHintText.style.color = "";

            const eventPicker = P.$("eventCardPicker");

            if (eventPicker) {
                eventPicker.hidden = true;
            }

            // 一般討論階段不使用舊式懷錶的額外計時器
            P.hideExtraDiscussion?.();
        }


        /* ---------- 行動階段 ---------- */

        if (phase.id === "action") {
            const eventResult = P.$("eventCardResult");

            if (eventResult) {
                eventResult.hidden = true;
            }

            el.eventTitle.textContent = "玩家行動階段";

            el.eventDescription.textContent =
                "每位玩家依序選擇一項行動。完成後系統會自動切換下一位玩家。";

            P.$("eventCardPicker").innerHTML = "";

            const firstUnacted = gameData.players.findIndex(
                player => !P.playerHasActed(player)
            );

            if (firstUnacted !== -1) {
                el.activePlayer.value = String(firstUnacted);
            }
        }


        /* ---------- 結算階段 ---------- */

        if (phase.id === "settlement") {
            el.eventTitle.textContent = "回合結算";

            el.eventDescription.textContent =
                "請確認所有玩家行動、事件效果及精神值變化。確認完成後即可結束本回合。";

            P.$("eventCardPicker").innerHTML = "";
        }
    };


    /* ---------- 全畫面更新 ---------- */

    P.renderAll = function () {
        if (!P.gameData) return;

        P.renderRules();
        P.renderPlayers();

        if (typeof P.renderInventory === "function") {
            P.renderInventory();
        }

        P.renderPhase();
        P.renderLogs();
    };

})();