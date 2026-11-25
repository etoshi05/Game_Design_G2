
/* ==========================================
   NIGHT ROAD｜規則卡判定
   檔案：effects-rules.js
========================================== */

(() => {
    "use strict";

    const E = window.NIGHTROAD_EFFECTS;

    // 每局隨機分配 4 真、3 假、3 條件規則
    E.generateRandomRules = function (
        ruleCards = E.DATA.rules
    ) {
        if (!Array.isArray(ruleCards) || ruleCards.length !== 10) {
            return E.result(
                false,
                "規則卡資料必須剛好有 10 張。"
            );
        }

        const types = E.shuffle([
            "true", "true", "true", "true",
            "false", "false", "false",
            "conditional", "conditional", "conditional"
        ]);

        const cards = E.shuffle(ruleCards);

        const rules = cards.map((card, index) => ({
            id: card.id,
            name: card.name,
            type: types[index],
            condition: card.condition || null,
            verified: false,
            result: null
        }));

        return E.result(
            true,
            "本局隱藏規則已隨機分配。",
            { rules }
        );
    };

    // 初始化本局規則
    E.initializeRules = function () {
        if (!E.checkModules()) {
            return E.result(
                false,
                "遊戲模組尚未正確載入。"
            );
        }

        const state = E.getState();

        if (!state) {
            return E.result(
                false,
                "目前沒有進行中的遊戲。"
            );
        }

        const generated = E.generateRandomRules(E.DATA.rules);

        if (!generated.success) {
            return generated;
        }

        E.snapshot();

        state.hiddenRules = generated.rules;
        state.verifiedRules = [];

        E.saveState();

        E.addLog("本局 10 張隱藏規則已重新隨機分配。");

        return E.result(
            true,
            "隱藏規則初始化完成。",
            { rules: generated.rules }
        );
    };

    // 條件規則判定
    E.evaluateCondition = function (
        condition,
        context = {}
    ) {
        if (!condition || typeof condition !== "object") {
            return null;
        }

        const actual = context[condition.field];
        const expected = condition.value;

        if (
            actual === undefined ||
            expected === undefined
        ) {
            return null;
        }

        switch (condition.operator) {
            case "equals":
                return actual === expected;

            case "notEquals":
                return actual !== expected;

            case "gte":
                return Number(actual) >= Number(expected);

            case "lte":
                return Number(actual) <= Number(expected);

            case "gt":
                return Number(actual) > Number(expected);

            case "lt":
                return Number(actual) < Number(expected);

            case "includes":
                return Array.isArray(actual) &&
                    actual.includes(expected);

            default:
                return null;
        }
    };

    // 驗證規則
    E.verifyRule = function (ruleId, context = {}) {
        const state = E.getState();

        if (!state) {
            return E.result(
                false,
                "目前沒有進行中的遊戲。"
            );
        }

        if (!Array.isArray(state.hiddenRules)) {
            return E.result(
                false,
                "找不到本局隱藏規則資料。"
            );
        }

        const rule = state.hiddenRules.find(
            item => item.id === ruleId
        );

        if (!rule) {
            return E.result(
                false,
                "找不到這張規則卡。"
            );
        }

        if (rule.verified) {
            return E.result(
                false,
                "這張規則卡已經驗證過。"
            );
        }

        let valid = false;

        if (rule.type === "true") {
            valid = true;
        } else if (rule.type === "false") {
            valid = false;
        } else if (rule.type === "conditional") {
            const conditionResult = E.evaluateCondition(
                rule.condition,
                context
            );

            if (conditionResult === null) {
                return E.result(
                    false,
                    "條件式規則尚缺少實際條件或判定資料，暫時無法驗證。",
                    {
                        pending: true,
                        rule
                    }
                );
            }

            valid = conditionResult;
        } else {
            return E.result(
                false,
                "規則類型不正確。"
            );
        }

        E.snapshot();

        rule.verified = true;
        rule.result = valid ? "valid" : "invalid";

        if (!Array.isArray(state.verifiedRules)) {
            state.verifiedRules = [];
        }

        if (
            valid &&
            !state.verifiedRules.includes(rule.id)
        ) {
            state.verifiedRules.push(rule.id);
        }

        E.saveState();

        const message = valid
            ? `規則「${rule.name}」驗證成功！`
            : `規則「${rule.name}」驗證失敗。`;

        E.addLog(message);

        return E.result(true, message, {
            valid,
            ruleId,
            rule
        });
    };
})();
