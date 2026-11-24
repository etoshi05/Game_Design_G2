
/* ========================================
   GAME STATE｜遊戲狀態管理
======================================== */

window.NIGHTROAD_STATE = (() => {

  const STORAGE_KEY = "nightRoadHostGame_v3";

  let state = null;

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

  function createGame(playerRoles) {

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
