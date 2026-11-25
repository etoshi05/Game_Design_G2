
/* ==========================================
   NIGHT ROAD｜卡牌效果系統整合入口
   檔案：game-card-effects.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    if (!E) {
        console.error("找不到 NIGHTROAD_EFFECTS 核心模組。");
        return;
    }

    window.NIGHTROAD_CARD_EFFECTS = {
        generateRandomRules: E.generateRandomRules,
        initializeRules: E.initializeRules,
        verifyRule: E.verifyRule,
        evaluateCondition: E.evaluateCondition,

        apply: E.apply,
        useItem: E.useItem,
        resolveEvent03: E.resolveEvent03,

        changeSanity: E.changeSanity,

        collectItem: E.collectItem,
        consumeItem: E.consumeItem,

        collectClue: E.collectClue,
        collectEscapeClue: E.collectEscapeClue,
        collectExitToken: E.collectExitToken,

        checkEscapeConditions: E.checkEscapeConditions
    };

    console.log("NIGHT ROAD 卡牌效果系統載入完成。");
})();
