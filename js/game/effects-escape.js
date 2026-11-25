
/* ==========================================
   NIGHT ROAD｜逃生條件判定
   檔案：effects-escape.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    E.checkEscapeConditions = function () {
        const state = E.getState();

        if (!state) {
            return E.result(
                false,
                "目前沒有進行中的遊戲。"
            );
        }

        const verifiedRules = Array.isArray(state.verifiedRules)
            ? state.verifiedRules
            : [];

        const escapeClues = Array.isArray(state.escapeClues)
            ? state.escapeClues
            : [];

        const hasRules = verifiedRules.length >= 2;
        const hasClues = escapeClues.length >= 2;
        const hasToken = state.exitToken === true;

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

        return E.result(
            missing.length === 0,
            missing.length === 0
                ? "已符合基本逃生條件。"
                : `尚未符合逃生條件：${missing.join("、")}`,
            {
                hasRules,
                hasClues,
                hasToken,
                missing
            }
        );
    };
})();
