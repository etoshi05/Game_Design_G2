/* =================================
   線上遊戲頁專用 JS
   六回合體驗版遊戲
================================= */

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});

function initGame() {

  // 確認目前頁面是否有遊戲區塊
  const root = document.querySelector('[data-game]');
  if (!root) return;

  // 只在遊戲頁面內尋找元素，避免影響其他頁面
  const $ = id => root.querySelector(`#${id}`);

  // 必要元素檢查
  const requiredIds = [
    'roundLabel', 'sanity', 'sanityBar', 'rules', 'clues',
    'token', 'eventTitle', 'eventText', 'log', 'reset'
  ];

  if (requiredIds.some(id => !$(id))) {
    console.warn('線上遊戲初始化失敗：遊戲 HTML 缺少必要元素。');
    return;
  }

  /* =================================
     六回合事件內容
  ================================= */

  const events = [
    ['門外的三次敲門', '夜深了，老屋外突然傳來三次敲門聲。你要調查門外，還是先確認規則？'],
    ['有人叫你的名字', '黑暗中傳來熟悉的聲音。不要急著回應，先想想你們已經確認了哪些規則。'],
    ['突然熄滅的燈', '四周陷入黑暗。手電筒或其他準備，可能成為探索時的依靠。'],
    ['重複出現的路口', '你們似乎又回到相同的岔路。路線線索也許能幫助你們解除迷途。'],
    ['同伴的異常舉動', '有人看起來不太對勁。先互相確認狀況，不要讓恐懼拆散隊伍。'],
    ['遠方的微弱燈火', '遠處似乎有燈光。那可能是出口，也可能是另一個陷阱。']
  ];

  /* =================================
     遊戲初始狀態
  ================================= */

  const initialState = () => ({
    round: 1,
    sanity: 4,
    rules: 0,
    clues: 0,
    token: false,
    done: false,
    rest: false
  });

  let state = initialState();

  /* =================================
     遊戲紀錄
  ================================= */

  function log(message) {
    const p = document.createElement('p');
    p.textContent = '— ' + message;
    $('log').appendChild(p);
    $('log').scrollTop = $('log').scrollHeight;
  }

  /* =================================
     更新遊戲畫面
  ================================= */

  function render() {
    $('roundLabel').textContent =
      `第 ${Math.min(state.round, 6)} / 6 回合`;

    $('sanity').textContent = `${state.sanity} / 4`;
    $('sanityBar').style.width = (state.sanity / 4 * 100) + '%';
    $('rules').textContent = `${state.rules} / 2`;
    $('clues').textContent = `${state.clues} / 2`;
    $('token').textContent = state.token ? '已取得' : '未取得';

    root.querySelectorAll('.action').forEach(button => {
      button.disabled = state.done;
    });
  }

  /* =================================
     遊戲結局判定
  ================================= */

  function end() {
    state.done = true;

    const win =
      state.rules >= 2 &&
      state.clues >= 2 &&
      state.token &&
      state.sanity > 0;

    if (win) {
      $('eventTitle').textContent = '結局一｜成功逃離';
      $('eventText').textContent =
        '你們確認規則、拼出逃生路線，也找到了出口信物。所有人一起跨出村口。';
    } else {
      $('eventTitle').textContent = '結局三｜未能逃離';
      $('eventText').textContent =
        '第六回合結束，仍有條件尚未完成。迷霧吞沒了最後一點燈火。';
    }

    log(win ? '成功逃離！全隊獲勝。' : '逃離失敗。請檢視尚未完成的條件。');
    render();
  }

  /* =================================
     玩家行動系統
  ================================= */

  function act(action) {
    if (state.done) return;

    let message = '';

    // 探索
    if (action === 'explore') {
      if (state.clues < 2) {
        state.clues++;
        message = '你們在山徑附近找到一份路線記錄。體驗版取得 1 張逃生線索。';
      } else if (!state.token) {
        state.token = true;
        message = '你們在村口附近找到出口通行信物。';
      } else {
        state.sanity = Math.max(0, state.sanity - 1);
        message = '探索沒有新發現，精神值下降 1 點。';
      }
    }

    // 驗證規則
    if (action === 'verify') {
      if (state.rules < 2) {
        state.rules++;
        message =
          '你們找到一份規則證據。體驗版暫記為 1 條有效規則；正式判定仍須由主持人依隱藏答案裁定。';
      } else {
        message = '已達成至少 2 條有效規則的體驗目標。';
      }
    }

    // 休息
    if (action === 'rest') {
      if (state.rest) {
        message = '本回合已透過休息恢復過精神值。';
      } else {
        const oldSanity = state.sanity;
        state.sanity = Math.min(4, state.sanity + 1);
        state.rest = true;
        message = oldSanity === 4
          ? '精神值已滿，無須恢復。'
          : '暫時休息，精神值恢復 1 點。';
      }
    }

    // 前往出口
    if (action === 'escape') {
      if (state.rules >= 2 && state.clues >= 2 && state.token) {
        log('你們帶著信物抵達村口，正式執行逃離行動。');
        end();
        return;
      } else {
        message =
          '出口尚未開啟。還需要 ' +
          Math.max(0, 2 - state.rules) +
          ' 條有效規則、' +
          Math.max(0, 2 - state.clues) +
          ' 張逃生線索' +
          (!state.token ? '，以及出口通行信物' : '') +
          '。';
      }
    }

    log(`第 ${state.round} 回合：${message}`);

    // 精神值歸零判定
    if (state.sanity <= 0) {
      state.done = true;
      $('eventTitle').textContent = '精神值歸零';
      $('eventText').textContent =
        '你們已無法繼續前進。這趟夜路以失敗告終。';
      render();
      return;
    }

    // 回合前進
    state.round++;
    state.rest = false;

    if (state.round > 6) {
      end();
      return;
    }

    const event = events[state.round - 1];
    $('eventTitle').textContent = event[0];
    $('eventText').textContent = event[1];

    render();
  }

  /* =================================
     行動按鈕事件
  ================================= */

  root.querySelectorAll('.action').forEach(button => {
    button.addEventListener('click', () => {
      act(button.dataset.action);
    });
  });

  /* =================================
     重新開始遊戲
  ================================= */

  $('reset').addEventListener('click', () => {
    state = initialState();

    $('eventTitle').textContent = events[0][0];
    $('eventText').textContent = events[0][1];

    $('log').innerHTML = `
      <p>— 你們踏入迷霧聚落。夜晚開始了。</p>
      <p>— 勝利需要：2 條有效規則、2 張逃生線索、出口信物，以及正式逃離行動。</p>
    `;

    render();
  });

  // 初始化畫面
  $('eventTitle').textContent = events[0][0];
  $('eventText').textContent = events[0][1];
  render();
}
