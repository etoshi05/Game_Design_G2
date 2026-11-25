/* ==========================================
   NIGHT ROAD｜遊戲設定
========================================== */

window.NIGHTROAD_PLAY = window.NIGHTROAD_PLAY || {};

(() => {
    const P = window.NIGHTROAD_PLAY;

    P.ROLES = [
        "守夜人",
        "記錄者",
        "引路人",
        "同行者",
        "守護者",
        "探路者"
    ];

    P.PHASES = [
        {
            id: "event",
            name: "事件階段",
            hint: "請從實體事件卡牌堆抽取一張卡，再於網站選擇相同的卡牌。"
        },
        {
            id: "discussion",
            name: "討論階段",
            hint: "請讓玩家討論線索、規則及接下來的行動，討論時間為 2 分鐘。"
        },
        {
            id: "action",
            name: "行動階段",
            hint: "請依序選擇玩家，記錄每位玩家本回合的行動。"
        },
        {
            id: "settlement",
            name: "結算階段",
            hint: "請確認本回合卡牌效果、玩家精神值、道具及線索狀態。"
        }
    ];

    P.RULE_COUNTS = {
        true: 4,
        false: 3,
        conditional: 3
    };

    P.STORAGE_KEY = "nightRoadHostGame_v3";
})();