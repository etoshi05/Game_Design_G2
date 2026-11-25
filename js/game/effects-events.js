
/* ==========================================
   NIGHT ROAD｜事件效果
   檔案：effects-events.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    // EVENT-03｜燈光熄滅
    // 手電筒必須由玩家主動使用
    E.resolveEvent03 = function (playerId, action) {
        const state = E.getState();
        const player = E.getPlayer(playerId);

        if (!state || !player) {
            return E.result(
                false,
                "找不到遊戲或玩家資料。"
            );
        }

        const currentEventId =
            typeof state.currentEvent === "string"
                ? state.currentEvent
                : state.currentEvent?.id;

        if (currentEventId !== "EVENT-03") {
            return E.result(
                true,
                "目前不是燈光熄滅事件。",
                { applied: false }
            );
        }

        // 只有探索行動會受到影響
        if (action !== "explore") {
            return E.result(
                true,
                "其他行動不受燈光熄滅事件影響。",
                { applied: false }
            );
        }

        if (!Array.isArray(state.eventEffectsResolved)) {
            state.eventEffectsResolved = [];
        }

        const resolutionKey =
            `EVENT-03-${state.currentRound}-PLAYER-${player.id}`;

        if (state.eventEffectsResolved.includes(resolutionKey)) {
            return E.result(
                false,
                "這名玩家本回合已結算過燈光熄滅事件。"
            );
        }

        const protection = state.protections?.[player.id];

        // 玩家已主動使用手電筒
        if (
            protection &&
            protection.type === "sanity" &&
            protection.round === state.currentRound
        ) {
            E.snapshot();

            state.eventEffectsResolved.push(resolutionKey);

            player.actions.push({
                round: state.currentRound,
                action: "事件結算",
                eventId: "EVENT-03",
                result: "手電筒保護成功"
            });

            const message =
                `${player.name} 使用手電筒，本次探索不受精神值懲罰。`;

            E.saveState();
            E.addLog(message);

            return E.result(true, message, {
                applied: true,
                protected: true
            });
        }

        // 沒有主動使用手電筒：精神值減少 1
        E.snapshot();

        const sanityResult = E.changeSanity(
            player.id,
            -1
        );

        if (!sanityResult.success) {
            return sanityResult;
        }

        state.eventEffectsResolved.push(resolutionKey);

        player.actions.push({
            round: state.currentRound,
            action: "事件結算",
            eventId: "EVENT-03",
            result: "未使用手電筒，精神值減少 1"
        });

        const message =
            `${player.name} 未使用手電筒，精神值減少 1 點。`;

        E.saveState();
        E.addLog(message);

        return E.result(true, message, {
            applied: true,
            protected: false,
            sanity: player.sanity
        });
    };
})();
