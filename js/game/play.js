/* ==========================================
   NIGHT ROAD｜主持人操作台主程式
   檔案：play.js

   負責：
   1. 初始化遊戲模組
   2. 連接遊戲資料、狀態及效果
   3. 建立遊戲紀錄
   4. 啟動各功能模組
   5. 恢復遊戲進度
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const P = window.NIGHTROAD_PLAY;

    if (!P) {
        console.error("play-config.js 尚未載入。");
        return;
    }

    /* ==========================================
       取得既有遊戲模組
    ========================================== */

    P.DATA = window.NIGHTROAD_GAME_DATA;
    P.STATE = window.NIGHTROAD_STATE;
    P.SELECTOR = window.NIGHTROAD_CARD_SELECTOR;
    P.EFFECTS = window.NIGHTROAD_CARD_EFFECTS;
    P.HISTORY = window.NIGHTROAD_HISTORY;


    /* ==========================================
       檢查模組是否正確載入
    ========================================== */

    if (
        !P ||
        !P.DATA ||
        !P.STATE ||
        !P.SELECTOR ||
        !P.EFFECTS ||
        !P.HISTORY
    ) {
        console.error(
            "遊戲模組沒有正確載入，請檢查 play.html 的 script 順序。"
        );

        alert(
            "遊戲程式載入失敗，請檢查 game 資料夾中的程式。"
        );

        return;
    }


    /* ==========================================
       初始化遊戲狀態
    ========================================== */

    P.gameData = null;

    P.pendingAction = null;

    P.processing = false;

    P.selectedInventoryItem = null;

    P.selectedRuleId = null;

    P.currentExplorationLocation = null;


    /* ==========================================
       初始化 HTML 元素
    ========================================== */

    if (!P.initElements()) {
        return;
    }


    /* ==========================================
       遊戲紀錄
    ========================================== */

    P.addLog = function (message) {
        if (!P.gameData) return;

        P.HISTORY.log(message);

        P.gameData = P.STATE.get();

        P.renderLogs();
    };


    /* ==========================================
       初始化各功能模組
    ========================================== */

    // 建立動態卡牌容器
    P.ensureDynamicContainers();

    // 玩家設定及建立遊戲
    P.initSetup();

    // 玩家道具背包
    P.initInventory();

    // 玩家行動按鈕
    P.initActions();

    // 階段與回合控制
    P.initRound();


    /* ==========================================
       恢復遊戲
    ========================================== */

    P.restoreGame();


    console.log("NIGHT ROAD 主持人操作台初始化完成。");

});