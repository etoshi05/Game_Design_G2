
/* ==========================================
   NIGHT ROAD｜卡牌效果執行
   檔案：effects-cards.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    E.apply = function (
        cardId,
        playerId,
        context = {}
    ) {
        if (!E.checkModules()) {
            return E.result(
                false,
                "遊戲模組尚未正確載入。"
            );
        }

        const state = E.getState();
        const card = E.CARD_SELECTOR.getCard(cardId);

        if (!state || !card) {
            return E.result(
                false,
                "找不到卡牌或遊戲資料。"
            );
        }

        if (!card.confirmed || !card.effect) {
            return E.result(
                false,
                "此卡牌效果尚未建檔，無法自動執行。",
                {
                    requiresHost: true,
                    card
                }
            );
        }

        const effect = card.effect;

        const playerRequiredTypes = [
            "sanity",
            "item",
            "clue",
            "escape-clue",
            "consume-item"
        ];

        if (playerRequiredTypes.includes(effect.type)) {
            if (!E.getPlayer(playerId)) {
                return E.result(
                    false,
                    "請先選擇受到影響的玩家。"
                );
            }
        }

        if (effect.type === "verify" && !effect.ruleId) {
            return E.result(
                false,
                "尚未設定要驗證的規則。"
            );
        }

        const supportedTypes = [
            ...playerRequiredTypes,
            "verify",
            "exit-token"
        ];

        if (!supportedTypes.includes(effect.type)) {
            return E.result(
                false,
                "不支援的卡牌效果類型。",
                { card }
            );
        }

        // 規則驗證由規則模組處理
        if (effect.type === "verify") {
            return E.verifyRule(
                effect.ruleId,
                context
            );
        }

        E.snapshot();

        let actionResult;

        switch (effect.type) {
            case "sanity":
                actionResult = E.changeSanity(
                    playerId,
                    effect.value
                );
                break;

            case "item":
                actionResult = E.collectItem(
                    playerId,
                    effect.itemId || card.id
                );
                break;

            case "clue":
                actionResult = E.collectClue(
                    playerId,
                    effect.clueId || card.id
                );
                break;

            case "escape-clue":
                actionResult = E.collectEscapeClue(
                    playerId,
                    effect.clueId || card.id
                );
                break;

            case "consume-item":
                actionResult = E.consumeItem(
                    playerId,
                    effect.itemId
                );
                break;

            case "exit-token":
                actionResult = E.collectExitToken();
                break;
        }

        if (!actionResult || !actionResult.success) {
            return actionResult || E.result(
                false,
                "卡牌效果執行失敗。"
            );
        }

        E.saveState();

        E.addLog(
            `執行卡牌 ${card.id}：${card.name}｜${actionResult.message}`
        );

        return E.result(
            true,
            actionResult.message,
            {
                card,
                player: actionResult.player || E.getPlayer(playerId),
                effect: effect.type,
                details: actionResult
            }
        );
    };
})();
