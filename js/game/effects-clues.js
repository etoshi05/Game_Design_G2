
/* ==========================================
   NIGHT ROAD｜線索與逃生信物
   檔案：effects-clues.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;


    /* ---------- 取得一般線索 ---------- */

    E.collectClue = function (playerId, clueId) {
        const player = E.getPlayer(playerId);

        if (!player || !Array.isArray(player.clues)) {
            return E.result(
                false,
                "玩家資料不正確。"
            );
        }

        if (!clueId) {
            return E.result(
                false,
                "缺少線索編號。"
            );
        }

        if (player.clues.includes(clueId)) {
            return E.result(
                false,
                "玩家已經取得這張線索。"
            );
        }

        player.clues.push(clueId);

        return E.result(
            true,
            `${player.name} 取得線索：${clueId}`,
            { player, clueId }
        );
    };


    /* ---------- 取得逃生線索 ---------- */

    E.collectEscapeClue = function (playerId, clueId) {
        const state = E.getState();
        const player = E.getPlayer(playerId);

        if (!state || !player) {
            return E.result(
                false,
                "找不到遊戲或玩家資料。"
            );
        }

        if (!Array.isArray(state.escapeClues)) {
            state.escapeClues = [];
        }

        const clueResult = E.collectClue(
            playerId,
            clueId
        );

        if (!clueResult.success) {
            return clueResult;
        }

        if (!state.escapeClues.includes(clueId)) {
            state.escapeClues.push(clueId);
        }

        return E.result(
            true,
            `${player.name} 取得指定逃生線索：${clueId}`,
            { player, clueId }
        );
    };


    /* ---------- 取得出口信物 ---------- */

    E.collectExitToken = function () {
        const state = E.getState();

        if (!state) {
            return E.result(
                false,
                "目前沒有進行中的遊戲。"
            );
        }

        state.exitToken = true;

        return E.result(
            true,
            "已取得出口通行信物。"
        );
    };

})();
