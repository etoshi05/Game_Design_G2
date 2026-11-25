
/* ========================================
   GAME STATE｜遊戲狀態管理
======================================== */

window.NIGHTROAD_STATE = (() => {

  const STORAGE_KEY = "nightRoadHostGame_v3";

  let state = null;

  // 建立玩家
  function createPlayer(id, role) {
    return {
      id,
      name: `玩家 ${id}`,
      role,
      sanity: 4,
      maxSanity: 4,
      items: [],
      clues: [],
      actions: [],
      escaped: false
    };
  }

  // 建立遊戲
  function createGame(playerRoles) {

    // 檢查玩家人數
    if (!Array.isArray(playerRoles) ||
        ![5, 6].includes(playerRoles.length)) {
      throw new Error("遊戲人數必須為 5～6 人！");
    }

    // 檢查角色是否重複
    if (new Set(playerRoles).size !== playerRoles.length) {
      throw new Error("角色不可重複，每位玩家必須使用不同角色！");
    }

    // 檢查角色是否為空
    if (playerRoles.some(role => !role)) {
      throw new Error("請完成所有玩家的角色分配！");
    }

    state = {
      started: true,

      playerCount: playerRoles.length,

      currentRound: 1,

      currentPhase: "event",

      currentPlayerIndex: 0,

      players: playerRoles.map((role, index) =>
        createPlayer(index + 1, role)
      ),

      hiddenRules: [],

      verifiedRules: [],

      escapeClues: [],

      legendClues: [],

      exitToken: false,

      usedEvents: [],

      usedClues: [],

      usedItems: [],

      currentEvent: null,

      logs: [],

      history: [],

      createdAt: new Date().toISOString()
    };

    save();

    return state;
  }

  function get() {
    return state;
  }

  function set(newState) {
    state = newState;
    save();
  }

  function save() {

    if (!state) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

  }

  function load() {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return null;

      const data = JSON.parse(raw);

      if (
        data.started !== true ||
        !Array.isArray(data.players) ||
        ![5, 6].includes(data.players.length) ||
        new Set(data.players.map(p => p.role)).size !== data.players.length ||
        !Array.isArray(data.hiddenRules) ||
        !Array.isArray(data.logs) ||
        !Array.isArray(data.history)
      ) {
        throw new Error("遊戲資料格式錯誤");
      }

      state = data;

      return state;

    } catch (error) {

      console.error("遊戲資料讀取失敗", error);

      return null;

    }

  }

  function clear() {

    state = null;

    localStorage.removeItem(STORAGE_KEY);

  }

  function getPlayer(playerId) {

    if (!state) return null;

    return state.players.find(player =>
      player.id === Number(playerId)
    ) || null;

  }

  function updatePlayer(playerId, callback) {

    const player = getPlayer(playerId);

    if (!player) return false;

    callback(player);

    save();

    return true;

  }

  return {
    createGame,
    get,
    set,
    save,
    load,
    clear,
    getPlayer,
    updatePlayer
  };

})();
