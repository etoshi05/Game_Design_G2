
/* ========================================
   NIGHT ROAD｜GAME HISTORY
   操作紀錄與復原系統
======================================== */

window.NIGHTROAD_HISTORY = (() => {

  const MAX_HISTORY = 30;

  /* 保存操作前的遊戲狀態 */
  function snapshot() {

    const state = window.NIGHTROAD_STATE.get();

    if (!state) return false;

    const snapshotData = JSON.parse(JSON.stringify({

      players: state.players,
      hiddenRules: state.hiddenRules,

      verifiedRules: state.verifiedRules,
      escapeClues: state.escapeClues,
      legendClues: state.legendClues,

      exitToken: state.exitToken,

      usedEvents: state.usedEvents,
      usedClues: state.usedClues,
      usedItems: state.usedItems,

      currentEvent: state.currentEvent,

      currentRound: state.currentRound,
      currentPhase: state.currentPhase,
      currentPlayerIndex: state.currentPlayerIndex,

      pendingCard: state.pendingCard,
      phaseCompleted: state.phaseCompleted

    }));

    state.history.push(snapshotData);

    if (state.history.length > MAX_HISTORY) {
      state.history.shift();
    }

    window.NIGHTROAD_STATE.save();

    return true;
  }


  /* 撤銷上一個操作 */
  function undo() {

    const state = window.NIGHTROAD_STATE.get();

    if (!state) {

      return {
        success: false,
        message: "目前沒有進行中的遊戲。"
      };

    }

    if (!Array.isArray(state.history) || state.history.length === 0) {

      return {
        success: false,
        message: "沒有可以復原的操作。"
      };

    }

    const previous = state.history.pop();

    Object.assign(state, previous);

    window.NIGHTROAD_STATE.save();

    return {
      success: true,
      message: "已成功復原上一個操作。"
    };

  }


  /* 新增遊戲紀錄 */
  function log(message) {

    const state = window.NIGHTROAD_STATE.get();

    if (!state) return false;

    if (!Array.isArray(state.logs)) {
      state.logs = [];
    }

    state.logs.push({

      message: String(message),

      time: new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })

    });

    if (state.logs.length > 150) {
      state.logs.shift();
    }

    window.NIGHTROAD_STATE.save();

    return true;

  }


  /* 清除操作歷史 */
  function clear() {

    const state = window.NIGHTROAD_STATE.get();

    if (!state) return;

    state.history = [];

    window.NIGHTROAD_STATE.save();

  }


  /* 回傳功能 */
  return {

    snapshot,
    undo,
    log,
    clear

  };

})();
