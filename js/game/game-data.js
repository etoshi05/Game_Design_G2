
/* ========================================
   NIGHT ROAD｜GAME DATA
   實體卡牌資料庫
======================================== */

window.NIGHTROAD_GAME_DATA = (() => {

  const ASSET = "assets/cards";

  // 建立卡牌資料
  function createCards(category, prefix, folder, sheets) {

    const cards = [];
    let number = 1;

    sheets.forEach(sheet => {

      for (let i = 1; i <= sheet.count; i++) {

        const cardNumber = String(i).padStart(2, "0");

        cards.push({

          id: `${prefix}-${String(number).padStart(2, "0")}`,

          category,

          name: `${category} ${String(number).padStart(2, "0")}`,

          image:
            `${ASSET}/${folder}/sheet${sheet.sheet}-card${cardNumber}.png`,

          description: "卡牌內容待依實體卡牌原文確認。",

          effect: {
            type: "manual",
            value: null
          },

          confirmed: false

        });

        number++;

      }

    });

    return cards;

  }


  /* ========================================
     六種類型卡牌
  ======================================== */

  // 角色卡：4 張
  const roles = createCards(
    "角色卡",
    "ROLE",
    "roles",
    [
      { sheet: "01", count: 4 }
    ]
  );


    // 規則卡：10 張
    const ruleNames = {
        "RULE-01": "不要回應呼喚",
        "RULE-02": "三次敲門",
        "RULE-03": "熄燈後的走廊",
        "RULE-04": "不要獨自前行",
        "RULE-05": "村口的紅色標記",
        "RULE-06": "午夜鐘聲",
        "RULE-07": "不要撿拾地上的物品",
        "RULE-08": "鏡中的自己",
        "RULE-09": "老屋的燈",
        "RULE-10": "不要相信陌生人的指引"
    };

    const rules = createCards(
        "規則卡",
        "RULE",
        "rules",
        [
            { sheet: "03", count: 4 },
            { sheet: "05", count: 6 }
        ]
    ).map(rule => ({
        ...rule,
        name: ruleNames[rule.id] || rule.name
    }));



    // 線索卡：12 張
    const clueDefinitions = [
        {
            id: "CLUE-01",
            name: "被撕去的日記",
            sheet: "11",
            imageNumber: "01",
            type: "rule-evidence",
            relatedRules: ["RULE-01", "RULE-02"]
        },
        {
            id: "CLUE-02",
            name: "山徑巡查紀錄",
            sheet: "11",
            imageNumber: "02",
            type: "rule-evidence",
            relatedRules: ["RULE-04", "RULE-05"]
        },
        {
            id: "CLUE-03",
            name: "走廊燈光紀錄",
            sheet: "11",
            imageNumber: "03",
            type: "rule-evidence",
            relatedRules: ["RULE-03", "RULE-06"]
        },
        {
            id: "CLUE-04",
            name: "遺失物品清單",
            sheet: "11",
            imageNumber: "04",
            type: "rule-evidence",
            relatedRules: ["RULE-07", "RULE-08"]
        },
        {
            id: "CLUE-05",
            name: "老屋訪客紀錄",
            sheet: "11",
            imageNumber: "05",
            type: "rule-evidence",
            relatedRules: ["RULE-09", "RULE-10"]
        },
        {
            id: "CLUE-11",
            name: "被遺忘的名字",
            sheet: "11",
            imageNumber: "06",
            type: "legend"
        },
        {
            id: "CLUE-06",
            name: "山徑地圖",
            sheet: "13",
            imageNumber: "01",
            type: "escape"
        },
        {
            id: "CLUE-07",
            name: "村口紀錄",
            sheet: "13",
            imageNumber: "02",
            type: "escape"
        },
        {
            id: "CLUE-08",
            name: "破碎的路標",
            sheet: "13",
            imageNumber: "03",
            type: "special"
        },
        {
            id: "CLUE-09",
            name: "遺留的車票",
            sheet: "13",
            imageNumber: "04",
            type: "special"
        },
        {
            id: "CLUE-10",
            name: "出口旁的記號",
            sheet: "13",
            imageNumber: "05",
            type: "special"
        },
        {
            id: "CLUE-12",
            name: "最後一頁",
            sheet: "13",
            imageNumber: "06",
            type: "legend"
        }
    ];

    const clues = clueDefinitions.map(card => ({
        id: card.id,
        category: "線索卡",
        name: card.name,

        image:
            `${ASSET}/clues/sheet${card.sheet}-card${card.imageNumber}.png`,

        description: "依照實體線索卡內容判定。",

        clueType: card.type,
        relatedRules: card.relatedRules || [],

        effect: {
            type: "manual",
            value: null
        },

        confirmed: false
    }));


  // 心理干擾卡：6 張
  const mental = createCards(
    "心理干擾卡",
    "MIND",
    "mental",
    [
      { sheet: "15", count: 6 }
    ]
  );


  // 道具卡：6 張
  /* ========================================
   道具卡：6 張
======================================== */

const itemDefinitions = [
    {
        id: "ITEM-01",
        name: "手電筒",
        description: "當發生「燈光熄滅」事件時，可以使用手電筒，使自己本回合探索不受到精神值減少的影響。",
        useEffect: {
            type: "sanity-protection",
            triggerEvent: "燈光熄滅",
            duration: "current-round",
            consume: true
        }
    },
    {
        id: "ITEM-02",
        name: "舊日記",
        description: "持有者在驗證規則時，可以將舊日記作為額外的線索輔助，使用該線索公開討論該規則的相關內容。",
        useEffect: {
            type: "rule-discussion-support",
            consume: true
        }
    },
    {
        id: "ITEM-03",
        name: "安神香包",
        description: "使用後恢復自己 1 點精神值，精神值最高不能超過 4 點。",
        useEffect: {
            type: "sanity",
            value: 1,
            consume: true
        }
    },
    {
        id: "ITEM-04",
        name: "銅製鑰匙",
        description: "開啟村口大門的必要道具。玩家必須取得銅製鑰匙，才能執行最終逃離行動。",
        useEffect: {
            type: "escape-key",
            consume: false
        }
    },
    {
        id: "ITEM-05",
        name: "紅線",
        description: "發生「重複路口」事件時，可以使用紅線，使自己本回合在山徑正常探索，不受該事件限制。",
        useEffect: {
            type: "exploration-protection",
            triggerEvent: "重複路口",
            location: "山徑",
            duration: "current-round",
            consume: true
        }
    },
    {
        id: "ITEM-06",
        name: "舊式懷錶",
        description: "使用後，全隊可以額外進行一次規則討論，討論時間增加 1 分鐘。",
        useEffect: {
            type: "extra-rule-discussion",
            extraMinutes: 1,
            consume: true
        }
    }
];

    const items = itemDefinitions.map((item, index) => ({
        id: item.id,
        category: "道具卡",
        name: item.name,

        image:
            `${ASSET}/tools/sheet17-card${String(index + 1).padStart(2, "0")}.png`,

        description: item.description,

        // 抽到時先取得道具，不會直接執行使用效果
        effect: {
            type: "item",
            itemId: item.id
        },

        // 真正使用道具時才執行
        useEffect: item.useEffect,

        confirmed: true
    }));


  // 事件卡：12 張
    
    /* ========================================
    事件卡：12 張
    依照實體卡牌建立
    ======================================== */

    const eventDefinitions = [
        {
            id: "EVENT-01",
            name: "三次敲門",
            sheet: "07",
            imageNumber: "01",
            description:
                "夜深了，老屋外突然傳來三次敲門聲。\n\n" +
                "位於老屋的玩家可以選擇花費本回合的行動進行調查，取得老屋尚未被拿走的一張卡牌。\n\n" +
                "若選擇開門，該玩家精神值減少 1 點；若不開門，則不會受到懲罰。",
            eventType: "investigate_or_open"
        },
        {
            id: "EVENT-02",
            name: "有人叫你的名字",
            sheet: "07",
            imageNumber: "02",
            description:
                "遠處傳來熟悉的聲音，似乎有人正在呼喚你。\n\n" +
                "所有玩家檢查自己是否遵守已驗證規則 01。\n" +
                "已驗證規則 01 且遵守者：不受影響。\n" +
                "未遵守者：精神值減少 1 點。\n" +
                "精神值減少後低於或等於 2 點者，符合條件時抽取心理干擾卡。",
            eventType: "check_rule_01"
        },
        {
            id: "EVENT-03",
            name: "燈光熄滅",
            sheet: "07",
            imageNumber: "03",
            description:
                "走廊的燈突然全部熄滅，四周陷入黑暗。\n\n" +
                "本回合探索時：\n" +
                "持有手電筒的玩家可以正常探索，使用後手電筒棄置。\n" +
                "沒有手電筒的玩家若進行探索，精神值減少 1 點。\n" +
                "其他行動不受影響。",
            eventType: "lights_out"
        },
        {
            id: "EVENT-04",
            name: "重複路口",
            sheet: "07",
            imageNumber: "04",
            description:
                "你們似乎又走回了相同的路口，周圍景色一模一樣。\n\n" +
                "本回合在山徑探索時，必須持有紅線或破碎的路標，才能取得探索卡牌。\n" +
                "若沒有這兩項道具，仍可移動，但無法在山徑取得卡牌。",
            eventType: "repeated_path"
        },
        {
            id: "EVENT-05",
            name: "同伴的異常舉動",
            sheet: "07",
            imageNumber: "05",
            description:
                "其中一名同伴突然停下腳步，做出了令人不解的舉動。\n\n" +
                "全隊可以選擇由一名玩家花費本回合的行動進行調查。\n" +
                "若有人調查：全隊不受懲罰。\n" +
                "若沒有人調查：隨機一名玩家精神值減少 1 點。",
            eventType: "team_investigation"
        },
        {
            id: "EVENT-06",
            name: "遠方微弱燈火",
            sheet: "07",
            imageNumber: "06",
            description:
                "山徑深處出現一道微弱的燈火，似乎在指引方向。\n\n" +
                "位於山徑的玩家可以花費本回合的行動進行探索，取得一張尚未被拿走的逃生線索卡。\n" +
                "若山徑已沒有逃生線索，則可以取得一張尚未被拿走的輔助線索。",
            eventType: "distant_light"
        },
        {
            id: "EVENT-07",
            name: "窗外的影子",
            sheet: "09",
            imageNumber: "01",
            description:
                "窗外似乎有一道影子，正靜靜地注視著屋內。\n\n" +
                "所有精神值低於或等於 2 點的玩家，各抽取一張心理干擾卡，並執行卡牌效果。",
            eventType: "low_sanity_interference"
        },
        {
            id: "EVENT-08",
            name: "鐘聲響起",
            sheet: "09",
            imageNumber: "02",
            description:
                "遠處傳來沉重的鐘聲，整座村莊彷彿安靜了下來。\n\n" +
                "本回合若規則 06 尚未驗證，玩家不能前往村口進行探索。\n" +
                "若規則 06 已驗證，則必須依照該規則的條件判斷是否能前往村口。",
            eventType: "check_rule_06"
        },
        {
            id: "EVENT-09",
            name: "散落的紙條",
            sheet: "09",
            imageNumber: "03",
            description:
                "地板上散落著幾張紙條，上面似乎記載著重要訊息。\n\n" +
                "位於老屋或舊檔案室的玩家，可以花費本回合的行動進行探索，取得一張尚未被拿走的規則證據卡。\n" +
                "若沒有剩餘規則證據卡，則可以取得一張尚未被拿走的故事線索卡。",
            eventType: "scattered_notes"
        },
        {
            id: "EVENT-10",
            name: "陌生人的指引",
            sheet: "09",
            imageNumber: "04",
            description:
                "一名陌生人出現在路口，指著其中一條路說：出口就在那裡。\n\n" +
                "已驗證規則 10 並遵守者：不受影響。\n" +
                "未遵守規則 10，且選擇跟隨陌生人指引者：精神值減少 1 點。\n" +
                "玩家可以選擇不跟隨，不會受到懲罰。",
            eventType: "check_rule_10"
        },
        {
            id: "EVENT-11",
            name: "突然的寂靜",
            sheet: "09",
            imageNumber: "05",
            description:
                "所有聲音突然消失，四周安靜得令人不安。\n\n" +
                "所有玩家必須公開自己目前持有的線索卡名稱，但不必公開卡牌內容。\n" +
                "精神值低於或等於 2 點的玩家，各抽取一張心理干擾卡。",
            eventType: "reveal_clue_names"
        },
        {
            id: "EVENT-12",
            name: "最後的倒數",
            sheet: "09",
            imageNumber: "06",
            description:
                "鐘聲再次響起，你們感覺時間已經所剩不多。\n\n" +
                "若本回合結束時全隊仍未成功逃離，每位玩家精神值減少 1 點。\n" +
                "若本回合成功逃離，則不執行此效果。",
            eventType: "final_countdown"
        }
    ];

    const events = eventDefinitions.map(event => ({
        id: event.id,
        category: "事件卡",
        name: event.name,

        image:
            `${ASSET}/events/sheet${event.sheet}-card${event.imageNumber}.png`,

        description: event.description,

        eventType: event.eventType,

        effect: {
            type: "manual",
            value: null
        },

        confirmed: true
    }));



  /* ========================================
     合併卡牌資料
  ======================================== */

  const all = [
    ...roles,
    ...rules,
    ...clues,
    ...mental,
    ...items,
    ...events
  ];


  /* ========================================
     查詢卡牌
  ======================================== */

  function find(id) {

    return all.find(card => card.id === id) || null;

  }


  /* ========================================
     依照類型取得卡牌
  ======================================== */

  function byCategory(category) {

    return all.filter(card =>
      card.category === category
    );

  }


  /* ========================================
     回傳資料
     注意：return 必須留在這個函式裡
  ======================================== */

  return {

    roles,
    rules,
    clues,
    mental,
    items,
    events,

    all,

    find,
    byCategory

  };

})();
