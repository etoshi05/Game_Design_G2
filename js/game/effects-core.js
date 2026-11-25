
/* ==========================================
   NIGHT ROAD｜效果系統核心
   檔案：effects-core.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS = {};

    E.DATA = window.NIGHTROAD_GAME_DATA;
    E.STATE = window.NIGHTROAD_STATE;
    E.HISTORY = window.NIGHTROAD_HISTORY;
    E.CARD_SELECTOR = window.NIGHTROAD_CARD_SELECTOR;

    E.result = function (success, message, extra = {}) {
        return {
            success,
            message,
            ...extra
        };
    };

    E.checkModules = function () {
        return Boolean(
            E.DATA &&
            Array.isArray(E.DATA.rules) &&
            E.STATE &&
            typeof E.STATE.get === "function" &&
            typeof E.STATE.save === "function" &&
            E.HISTORY &&
            typeof E.HISTORY.snapshot === "function" &&
            E.CARD_SELECTOR &&
            typeof E.CARD_SELECTOR.getCard === "function"
        );
    };

    E.getState = function () {
        return E.STATE.get();
    };

    E.getPlayer = function (playerId) {
        const state = E.getState();

        if (!state || !Array.isArray(state.players)) {
            return null;
        }

        return state.players.find(
            player => player.id === Number(playerId)
        ) || null;
    };

    E.saveState = function () {
        E.STATE.save();
    };

    E.addLog = function (message) {
        if (typeof E.HISTORY.log === "function") {
            E.HISTORY.log(message);
        }
    };

    E.snapshot = function () {
        if (typeof E.HISTORY.snapshot === "function") {
            E.HISTORY.snapshot();
        }
    };

    E.shuffle = function (array) {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] = [
                result[j],
                result[i]
            ];
        }

        return result;
    };
})();
