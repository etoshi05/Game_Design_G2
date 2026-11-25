
/* ==========================================
   NIGHT ROAD｜玩家狀態效果
   檔案：effects-player.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    E.changeSanity = function (playerId, amount) {
        const player = E.getPlayer(playerId);

        if (!player) {
            return E.result(
                false,
                "找不到指定玩家。"
            );
        }

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return E.result(
                false,
                "精神值變動數值不正確。"
            );
        }

        const maxSanity = Number.isFinite(player.maxSanity)
            ? player.maxSanity
            : 4;

        const before = player.sanity;

        player.sanity = Math.max(
            0,
            Math.min(maxSanity, before + value)
        );

        return E.result(
            true,
            `${player.name} 精神值：${before} → ${player.sanity}`,
            {
                player,
                before,
                after: player.sanity,
                change: player.sanity - before
            }
        );
    };
})();
