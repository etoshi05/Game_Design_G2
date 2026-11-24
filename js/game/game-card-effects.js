/* ========================================
   NIGHT ROAD｜卡牌效果自動裁定系統
   檔案：js/game-card-effects.js

   需要先載入：
   game-data.js
   game-state.js
   game-history.js
   game-card-selector.js
======================================== */

window.NIGHTROAD_CARD_EFFECTS = (() => {
    "use strict";

    const DATA = window.NIGHTROAD_GAME_DATA;
    const STATE = window.NIGHTROAD_STATE;
    const HISTORY = window.NIGHTROAD_HISTORY;
    const CARD_SELECTOR = window.NIGHTROAD_CARD_SELECTOR;

    /* ========================================
       系統檢查
    ======================================== */

    function checkModules() {
        return Boolean(
            DATA &&
            Array.isArray(DATA.rules) &&
            STATE &&
            typeof STATE.get === "function" &&
            typeof STATE.save === "function" &&
            HISTORY &&
            typeof HISTORY.snapshot === "function" &&
            CARD_SELECTOR &&
            typeof CARD_SELECTOR.getCard === "function"
        );
    }

    function result(success, message, extra = {}) {
        return {
            success,
            message,
            ...extra
        };
    }

    function getState() {
        return STATE.get();
    }

    function getPlayer(playerId) {
        const state = getState();

        if (!state || !Array.isArray(state.players)) {
            return null;
        }

        return state.players.find(
            player => player.id === Number(playerId)
        ) || null;
    }

    function saveState() {
        STATE.save();
    }

    function addLog(message) {
        if (HISTORY && typeof HISTORY.log === "function") {
            HISTORY.log(message);
        }
    }

    function snapshot() {
        if (HISTORY && typeof HISTORY.snapshot === "function") {
            HISTORY.snapshot();
        }
    }

    function shuffle(array) {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] = [
                result[j],
                result[i]
            ];
        }

        return result;
    }


    /* ========================================
       每局隨機分配隱藏規則
       4 張有效、3 張錯誤、3 張條件式
    ======================================== */

    function generateRandomRules(ruleCards = DATA.rules) {
        if (!Array.isArray(ruleCards) || ruleCards.length !== 10) {
            return result(
                false,
                "規則卡資料必須剛好有 10 張。"
            );
        }

        const types = shuffle([
            "true", "true", "true", "true",
            "false", "false", "false",
            "conditional", "conditional", "conditional"
        ]);

        const cards = shuffle(ruleCards);

        const rules = cards.map((card, index) => ({
            id: card.id,
            name: card.name,
            type: types[index],

            // 條件必須來自實際卡牌資料，不自行編造
            condition: card.condition || null,

            verified: false,
            result: null
        }));

        return result(
            true,
            "本局隱藏規則已隨機分配。",
            { rules }
        );
    }


    /* ========================================
       初始化本局隱藏規則
    ======================================== */

    function initializeRules() {
        if (!checkModules()) {
            return result(false, "遊戲模組尚未正確載入。");
        }

        const state = getState();

        if (!state) {
            return result(false, "目前沒有進行中的遊戲。");
        }

        const generated = generateRandomRules(DATA.rules);

        if (!generated.success) {
            return generated;
        }

        snapshot();

        state.hiddenRules = generated.rules;
        state.verifiedRules = [];

        saveState();

        addLog("本局 10 張隱藏規則已重新隨機分配。");

        return result(
            true,
            "隱藏規則初始化完成。",
            { rules: generated.rules }
        );
    }


    /* ========================================
       條件式規則判定

       condition 格式需要依照實體規則卡設定。
       尚未設定條件時，不會擅自判定。
    ======================================== */

    function evaluateCondition(condition, context = {}) {
        if (!condition || typeof condition !== "object") {
            return null;
        }

        /*
         * 支援的條件格式：
         *
         * { field: "round", operator: "gte", value: 3 }
         * { field: "location", operator: "equals", value: "老屋" }
         * { field: "sanity", operator: "lte", value: 2 }
         *
         * field、operator、value 必須依實體卡牌內容設定。
         */

        const actual = context[condition.field];
        const expected = condition.value;

        if (actual === undefined || expected === undefined) {
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
    }


    /* ========================================
       驗證規則
    ======================================== */

    function verifyRule(ruleId, context = {}) {
        const state = getState();

        if (!state) {
            return result(false, "目前沒有進行中的遊戲。");
        }

        if (!Array.isArray(state.hiddenRules)) {
            return result(false, "找不到本局隱藏規則資料。");
        }

        const rule = state.hiddenRules.find(
            item => item.id === ruleId
        );

        if (!rule) {
            return result(false, "找不到這張規則卡。");
        }

        if (rule.verified) {
            return result(false, "這張規則卡已經驗證過。");
        }

        let valid = false;

        if (rule.type === "true") {
            valid = true;
        }

        else if (rule.type === "false") {
            valid = false;
        }

        else if (rule.type === "conditional") {
            const conditionResult = evaluateCondition(
                rule.condition,
                context
            );

            // 沒有條件或缺少判定資料，不進行猜測
            if (conditionResult === null) {
                return result(
                    false,
                    "條件式規則尚缺少實際條件或判定資料，暫時無法驗證。",
                    {
                        pending: true,
                        rule
                    }
                );
            }

            valid = conditionResult;
        }

        else {
            return result(false, "規則類型不正確。");
        }

        snapshot();

        rule.verified = true;
        rule.result = valid ? "valid" : "invalid";

        if (valid && !state.verifiedRules.includes(rule.id)) {
            state.verifiedRules.push(rule.id);
        }

        saveState();

        const message = valid
            ? `規則「${rule.name}」驗證成功！`
            : `規則「${rule.name}」驗證失敗。`;

        addLog(message);

        return result(true, message, {
            valid,
            ruleId,
            rule
        });
    }


    /* ========================================
       精神值處理
    ======================================== */

    function changeSanity(playerId, amount) {
        const player = getPlayer(playerId);

        if (!player) {
            return result(false, "找不到指定玩家。");
        }

        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return result(false, "精神值變動數值不正確。");
        }

        const maxSanity = Number.isFinite(player.maxSanity)
            ? player.maxSanity
            : 4;

        const before = player.sanity;

        player.sanity = Math.max(
            0,
            Math.min(maxSanity, before + value)
        );

        return result(
            true,
            `${player.name} 精神值：${before} → ${player.sanity}`,
            {
                player,
                before,
                after: player.sanity,
                change: player.sanity - before
            }
        );
    }


    /* ========================================
       道具處理
    ======================================== */

    function collectItem(playerId, itemId) {
        const player = getPlayer(playerId);

        if (!player || !Array.isArray(player.items)) {
            return result(false, "玩家資料不正確。");
        }

        if (!itemId) {
            return result(false, "缺少道具編號。");
        }

        player.items.push(itemId);

        return result(
            true,
            `${player.name} 取得道具：${itemId}`,
            { player, itemId }
        );
    }

    function consumeItem(playerId, itemId) {
        const player = getPlayer(playerId);

        if (!player || !Array.isArray(player.items)) {
            return result(false, "玩家資料不正確。");
        }

        const index = player.items.indexOf(itemId);

        if (index === -1) {
            return result(false, "玩家沒有持有此道具。");
        }

        player.items.splice(index, 1);

        return result(
            true,
            `${player.name} 使用道具：${itemId}`,
            { player, itemId }
        );
    }


    /* ========================================
       線索處理
    ======================================== */

    function collectClue(playerId, clueId) {
        const player = getPlayer(playerId);

        if (!player || !Array.isArray(player.clues)) {
            return result(false, "玩家資料不正確。");
        }

        if (!clueId) {
            return result(false, "缺少線索編號。");
        }

        if (player.clues.includes(clueId)) {
            return result(false, "玩家已經取得這張線索。");
        }

        player.clues.push(clueId);

        return result(
            true,
            `${player.name} 取得線索：${clueId}`,
            { player, clueId }
        );
    }


    /* ========================================
       取得逃生線索
    ======================================== */

    function collectEscapeClue(playerId, clueId) {
        const state = getState();
        const player = getPlayer(playerId);

        if (!state || !player) {
            return result(false, "找不到遊戲或玩家資料。");
        }

        if (!Array.isArray(state.escapeClues)) {
            state.escapeClues = [];
        }

        const clueResult = collectClue(playerId, clueId);

        if (!clueResult.success) {
            return clueResult;
        }

        if (!state.escapeClues.includes(clueId)) {
            state.escapeClues.push(clueId);
        }

        return result(
            true,
            `${player.name} 取得指定逃生線索：${clueId}`,
            { player, clueId }
        );
    }


    /* ========================================
       出口信物
    ======================================== */

    function collectExitToken() {
        const state = getState();

        if (!state) {
            return result(false, "目前沒有進行中的遊戲。");
        }

        state.exitToken = true;

        return result(true, "已取得出口通行信物。");
    }

    /* ========================================
    使用道具
    ======================================== */

    function useItem(playerId, itemId, context = {}) {
        const state = getState();
        const player = getPlayer(playerId);

        if (!state || !player) {
            return result(false, "找不到遊戲或玩家資料。");
        }

        if (!Array.isArray(player.items)) {
            return result(false, "玩家道具資料不正確。");
        }

        const itemIndex = player.items.indexOf(itemId);

        if (itemIndex === -1) {
            return result(false, "玩家沒有持有這個道具。");
        }

        const item = DATA.find(itemId);

        if (!item || item.category !== "道具卡") {
            return result(false, "找不到指定道具卡。");
        }

        const effect = item.useEffect;

        if (!effect || !effect.type) {
            return result(false, "這張道具卡尚未設定使用效果。");
        }

        // 檢查事件觸發條件
        if (effect.triggerEvent) {
            const eventCard = state.currentEvent
                ? DATA.find(state.currentEvent)
                : null;

            const eventName = context.eventName || eventCard?.name;

            if (!eventName || eventName !== effect.triggerEvent) {
                return result(
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
            return result(
                false,
                `此道具只能在${effect.location}使用。`
            );
        }

        // 檢查舊日記的使用時機
        if (
            effect.type === "rule-discussion-support" &&
            context.action !== "verify"
        ) {
            return result(
                false,
                "舊日記只能在驗證規則時使用。"
            );
        }

        // 建立操作前快照
        snapshot();

        let message = "";

        switch (effect.type) {

            // 手電筒：保護本回合精神值
            case "sanity-protection":

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


            // 舊日記：提供規則討論輔助
            case "rule-discussion-support":

                if (!context.ruleId) {
                    return result(false, "請先指定要討論的規則卡。");
                }

                message =
                    `${player.name} 使用舊日記，提供規則 ${context.ruleId} 的額外討論線索。`;

                break;


            // 安神香包：恢復精神值
            case "sanity": {
                const sanityResult = changeSanity(
                    player.id,
                    effect.value
                );

                if (!sanityResult.success) {
                    return sanityResult;
                }

                message = sanityResult.message;

                break;
            }


            // 銅製鑰匙：取得逃生資格
            case "escape-key":

                state.exitToken = true;

                message =
                    `${player.name} 持有銅製鑰匙，已取得開啟村口大門的必要道具。`;

                break;


            // 紅線：保護山徑探索
            case "exploration-protection":

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


            // 舊式懷錶：增加討論時間
            case "extra-rule-discussion":

                state.extraDiscussionMinutes =
                    (state.extraDiscussionMinutes || 0) +
                    effect.extraMinutes;

                message =
                    `全隊使用舊式懷錶，額外增加 ${effect.extraMinutes} 分鐘規則討論時間。`;

                break;


            default:
                return result(false, "不支援的道具效果。");
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

        saveState();

        addLog(message);

        return result(true, message, {
            player,
            item,
            effect: effect.type
        });
    }


    
    /* ========================================
    EVENT-03｜燈光熄滅
    手電筒必須由玩家主動使用
    ======================================== */

    function resolveEvent03(playerId, action) {
        const state = getState();
        const player = getPlayer(playerId);

        if (!state || !player) {
            return result(false, "找不到遊戲或玩家資料。");
        }

        const currentEventId =
            typeof state.currentEvent === "string"
                ? state.currentEvent
                : state.currentEvent?.id;

        if (currentEventId !== "EVENT-03") {
            return result(true, "目前不是燈光熄滅事件。", {
                applied: false
            });
        }

        // 只有探索行動會受到影響
        if (action !== "explore") {
            return result(true, "其他行動不受燈光熄滅事件影響。", {
                applied: false
            });
        }

        if (!Array.isArray(state.eventEffectsResolved)) {
            state.eventEffectsResolved = [];
        }

        const resolutionKey =
            `EVENT-03-${state.currentRound}-PLAYER-${player.id}`;

        if (state.eventEffectsResolved.includes(resolutionKey)) {
            return result(false, "這名玩家本回合已結算過燈光熄滅事件。");
        }

        const protection = state.protections?.[player.id];

        // 玩家已主動使用手電筒
        if (
            protection &&
            protection.type === "sanity" &&
            protection.round === state.currentRound
        ) {
            snapshot();

            state.eventEffectsResolved.push(resolutionKey);

            player.actions.push({
                round: state.currentRound,
                action: "事件結算",
                eventId: "EVENT-03",
                result: "手電筒保護成功"
            });

            const message =
                `${player.name} 使用手電筒，本次探索不受精神值懲罰。`;

            saveState();
            addLog(message);

            return result(true, message, {
                applied: true,
                protected: true
            });
        }

        // 沒有主動使用手電筒：精神值減少 1
        snapshot();

        const sanityResult = changeSanity(player.id, -1);

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

        saveState();
        addLog(message);

        return result(true, message, {
            applied: true,
            protected: false,
            sanity: player.sanity
        });
    }


    /* ========================================
       卡牌效果執行
    ======================================== */

    function apply(cardId, playerId, context = {}) {
        if (!checkModules()) {
            return result(false, "遊戲模組尚未正確載入。");
        }

        const state = getState();
        const card = CARD_SELECTOR.getCard(cardId);

        if (!state || !card) {
            return result(false, "找不到卡牌或遊戲資料。");
        }

        if (!card.confirmed || !card.effect) {
            return result(
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
            if (!getPlayer(playerId)) {
                return result(false, "請先選擇受到影響的玩家。");
            }
        }

        if (effect.type === "verify" && !effect.ruleId) {
            return result(false, "尚未設定要驗證的規則。");
        }

        const supportedTypes = [
            ...playerRequiredTypes,
            "verify",
            "exit-token"
        ];

        if (!supportedTypes.includes(effect.type)) {
            return result(
                false,
                "不支援的卡牌效果類型。",
                { card }
            );
        }

        // 條件式規則若尚不能判定，不先建立快照
        // 規則驗證交由 verifyRule 自行處理
        if (effect.type === "verify") {
            return verifyRule(effect.ruleId, context);
        }

        snapshot();

        let actionResult;

        switch (effect.type) {
            case "sanity":
                actionResult = changeSanity(
                    playerId,
                    effect.value
                );
                break;

            case "item":
                actionResult = collectItem(
                    playerId,
                    effect.itemId || card.id
                );
                break;

            case "clue":
                actionResult = collectClue(
                    playerId,
                    effect.clueId || card.id
                );
                break;

            case "escape-clue":
                actionResult = collectEscapeClue(
                    playerId,
                    effect.clueId || card.id
                );
                break;

            case "consume-item":
                actionResult = consumeItem(
                    playerId,
                    effect.itemId
                );
                break;

            case "exit-token":
                actionResult = collectExitToken();
                break;
        }

        if (!actionResult || !actionResult.success) {
            return actionResult || result(
                false,
                "卡牌效果執行失敗。"
            );
        }

        saveState();

        addLog(
            `執行卡牌 ${card.id}：${card.name}｜${actionResult.message}`
        );

        return result(
            true,
            actionResult.message,
            {
                card,
                player: actionResult.player || getPlayer(playerId),
                effect: effect.type,
                details: actionResult
            }
        );
    }


    /* ========================================
       檢查逃生條件
    ======================================== */

    function checkEscapeConditions() {
        const state = getState();

        if (!state) {
            return result(false, "目前沒有進行中的遊戲。");
        }

        const hasRules = state.verifiedRules.length >= 2;
        const hasClues = state.escapeClues.length >= 2;
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

        return result(
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
    }


    /* ========================================
       對外公開功能
    ======================================== */

    return {
        generateRandomRules,
        initializeRules,
        verifyRule,
        apply,
        useItem,
        resolveEvent03,

        changeSanity,
        collectItem,
        consumeItem,
        collectClue,
        collectEscapeClue,
        collectExitToken,

        checkEscapeConditions
    };

})();