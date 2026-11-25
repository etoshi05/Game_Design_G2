
/* ==========================================
   NIGHT ROAD｜道具效果
   檔案：effects-items.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    /* ---------- 取得道具 ---------- */

    E.collectItem = function (playerId, itemId) {
        const player = E.getPlayer(playerId);

        if (!player || !Array.isArray(player.items)) {
            return E.result(false, "玩家資料不正確。");
        }

        if (!itemId) {
            return E.result(false, "缺少道具編號。");
        }

        player.items.push(itemId);

        return E.result(
            true,
            `${player.name} 取得道具：${itemId}`,
            { player, itemId }
        );
    };


    /* ---------- 消耗道具 ---------- */

    E.consumeItem = function (playerId, itemId) {
        const player = E.getPlayer(playerId);

        if (!player || !Array.isArray(player.items)) {
            return E.result(false, "玩家資料不正確。");
        }

        const index = player.items.indexOf(itemId);

        if (index === -1) {
            return E.result(
                false,
                "玩家沒有持有此道具。"
            );
        }

        player.items.splice(index, 1);

        return E.result(
            true,
            `${player.name} 使用道具：${itemId}`,
            { player, itemId }
        );
    };


    /* ---------- 使用道具 ---------- */

    E.useItem = function (
        playerId,
        itemId,
        context = {}
    ) {
        const state = E.getState();
        const player = E.getPlayer(playerId);

        if (!state || !player) {
            return E.result(
                false,
                "找不到遊戲或玩家資料。"
            );
        }

        if (!Array.isArray(player.items)) {
            return E.result(
                false,
                "玩家道具資料不正確。"
            );
        }

        const itemIndex = player.items.indexOf(itemId);

        if (itemIndex === -1) {
            return E.result(
                false,
                "玩家沒有持有這個道具。"
            );
        }

        const item = E.DATA.find(itemId);

        if (!item || item.category !== "道具卡") {
            return E.result(
                false,
                "找不到指定道具卡。"
            );
        }

        const effect = item.useEffect;

        if (!effect || !effect.type) {
            return E.result(
                false,
                "這張道具卡尚未設定使用效果。"
            );
        }

        // 檢查事件觸發條件
        if (effect.triggerEvent) {
            const eventCard = state.currentEvent
                ? E.DATA.find(state.currentEvent)
                : null;

            const eventName =
                context.eventName || eventCard?.name;

            if (
                !eventName ||
                eventName !== effect.triggerEvent
            ) {
                return E.result(
                    false,
                    `此道具只能在「${effect.triggerEvent}」事件時使用。`
                );
            }
        }

        // 檢查使用地點
        if (
            effect.location &&
            context.location !== effect.location
        ) {
            return E.result(
                false,
                `此道具只能在${effect.location}使用。`
            );
        }

        // 舊日記只能在驗證規則時使用
        if (
            effect.type === "rule-discussion-support" &&
            context.action !== "verify"
        ) {
            return E.result(
                false,
                "舊日記只能在驗證規則時使用。"
            );
        }

        // 建立操作前快照
        E.snapshot();

        let message = "";

        switch (effect.type) {

            // 手電筒：本回合探索精神值保護
            case "sanity-protection": {
                if (!state.protections) {
                    state.protections = {};
                }

                state.protections[player.id] = {
                    type: "sanity",
                    round: state.currentRound
                };

                message =
                    `${player.name} 使用手電筒，本回合探索不受精神值減少影響。`;

                break;
            }

            // 舊日記：提供規則討論輔助
            case "rule-discussion-support": {
                if (!context.ruleId) {
                    return E.result(
                        false,
                        "請先指定要討論的規則卡。"
                    );
                }

                message =
                    `${player.name} 使用舊日記，提供規則 ${context.ruleId} 的額外討論線索。`;

                break;
            }

            // 安神香包：恢復精神值
            case "sanity": {
                const sanityResult = E.changeSanity(
                    player.id,
                    effect.value
                );

                if (!sanityResult.success) {
                    return sanityResult;
                }

                message = sanityResult.message;
                break;
            }

            // 銅製鑰匙：取得出口信物
            case "escape-key": {
                state.exitToken = true;

                message =
                    `${player.name} 持有銅製鑰匙，已取得開啟村口大門的必要道具。`;

                break;
            }

            // 紅線：保護山徑探索
            case "exploration-protection": {
                if (!state.protections) {
                    state.protections = {};
                }

                state.protections[player.id] = {
                    type: "exploration",
                    location: effect.location,
                    round: state.currentRound
                };

                message =
                    `${player.name} 使用紅線，本回合在山徑探索不受重複路口事件限制。`;

                break;
            }

            // 舊式懷錶：立即觸發額外討論
            case "extra-rule-discussion": {
                message =
                    `全隊使用舊式懷錶，立即進行一次額外規則討論，時間為 ${effect.extraMinutes} 分鐘。`;

                break;
            }

            default:
                return E.result(
                    false,
                    "不支援的道具效果。"
                );
        }

        // 除銅製鑰匙外，其餘道具使用後消耗
        if (effect.consume) {
            player.items.splice(itemIndex, 1);

            if (!Array.isArray(state.usedItems)) {
                state.usedItems = [];
            }

            state.usedItems.push(itemId);
        }

        // 記錄使用道具
        player.actions.push({
            round: state.currentRound,
            action: "使用道具",
            cardId: itemId,
            effect: effect.type
        });

        E.saveState();
        E.addLog(message);

        return E.result(true, message, {
            player,
            item,
            effect: effect.type
        });
    };
})();
