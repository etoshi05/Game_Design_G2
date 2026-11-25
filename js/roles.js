
/* =================================
   角色卡牌選擇與翻轉功能
================================= */

const characterData = {

  watchman: {
    name: '守夜人',
    image: 'assets/role/watchman-front.png',
    back: 'assets/role/watchman-back.png',
    abilityTitle: '角色能力｜預知',
    ability: '每場遊戲限使用一次。在回合開始翻開事件卡之前，可以查看一張尚未翻開的事件卡，再將其放回原位。不得公開隱藏資訊。',
    feature: '擅長提前掌握情報。',
    number: 'ROLE 01'
  },

  recorder: {
    name: '記錄者',
    image: 'assets/role/recorder-front.png',
    back: 'assets/role/recorder-back.png',
    abilityTitle: '角色能力｜交叉比對',
    ability: '每場遊戲限使用一次。驗證規則時不必額外消耗道具，但仍須持有相關證據。',
    feature: '擅長分析規則與證據。',
    number: 'ROLE 02'
  },

  guide: {
    name: '引路人',
    image: 'assets/role/guide-front.png',
    back: 'assets/role/guide-back.png',
    abilityTitle: '角色能力｜尋找方向',
    ability: '每場遊戲限使用一次。探索時抽取兩張線索卡並選擇一張取得，另一張放回牌堆底；不能選擇未開放地點的專屬線索。',
    feature: '擅長尋找線索與物品。',
    number: 'ROLE 03'
  },

  companion: {
    name: '同行者',
    image: 'assets/role/companion-front.png',
    back: 'assets/role/companion-back.png',
    abilityTitle: '角色能力｜互相扶持',
    ability: '每場遊戲限使用一次。在自己的行動階段，選擇自己或同一地點的一名隊友，恢復 1 點精神值，精神值最高不能超過 4 點。',
    feature: '擅長維持團隊狀態。',
    number: 'ROLE 04'
  },

    guardian: {
    name: '守護者',
    image: 'assets/role/guardian-front.png',
    back: 'assets/role/guardian-back.png',
    abilityTitle: '角色能力｜穩定心神',
    ability: '每場遊戲限使用一次。當自己或同一地點的一名隊友因事件效果失去精神值時，可以使用此能力，使該次精神值損失減少 1 點，最低為 0 點。',
    feature: '擅長抵禦精神干擾，降低團隊受到的傷害。',
    number: 'ROLE 05'
  },

  scout: {
    name: '探路者',
    image: 'assets/role/scout-front.png',
    back: 'assets/role/scout-back.png',
    abilityTitle: '角色能力｜深入搜尋',
    ability: '每場遊戲限使用一次。進行探索時，可以額外取得該地點一張尚未取得的可用卡牌，但必須符合該地點的探索條件。',
    feature: '擅長提高探索效率，協助團隊更快取得所需卡牌。',
    number: 'ROLE 06'
  }
};


// =================================
// 取得 HTML 元素
// =================================

const selectedCard = document.querySelector('#selectedCard');
const selectedCardBox = document.querySelector('.selected-card');

const characterName = document.querySelector('#characterName');
const characterAbility = document.querySelector('#characterAbility');
const characterFeature = document.querySelector('#characterFeature');
const characterNumber = document.querySelector('#characterNumber');
const abilityTitle = document.querySelector('.character-info h3');


// =================================
// 翻牌狀態
// =================================

let currentCharacter = 'watchman';
let isBack = false;
let isAnimating = false;


// =================================
// 切換上方大卡牌正反面
// =================================

function flipCharacterCard() {

  if (!selectedCard || !selectedCardBox) return;
  if (isAnimating) return;

  const character = characterData[currentCharacter];
  if (!character) return;

  const nextImage = isBack
    ? character.image
    : character.back;

  if (!nextImage) return;

  isAnimating = true;

  // 開始翻轉
  selectedCardBox.classList.add('is-flipping');

  // 翻轉至中間時更換圖片
  setTimeout(() => {

    selectedCard.src = nextImage;
    selectedCard.alt = character.name + (isBack ? '正面' : '背面');

    isBack = !isBack;

  }, 275);

  // 結束翻轉
  setTimeout(() => {

    selectedCardBox.classList.remove('is-flipping');
    isAnimating = false;

  }, 550);

}


// =================================
// 點擊上方卡牌翻轉
// =================================

if (selectedCard && selectedCardBox) {

  selectedCardBox.addEventListener('click', flipCharacterCard);

  // 支援鍵盤操作
  selectedCardBox.setAttribute('role', 'button');
  selectedCardBox.setAttribute('tabindex', '0');
  selectedCardBox.setAttribute('aria-label', '點擊翻轉角色卡牌');

  selectedCardBox.addEventListener('keydown', event => {

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flipCharacterCard();
    }

  });

}


// =================================
// 下方角色選擇功能
// =================================

if (
  selectedCard &&
  characterName &&
  characterAbility &&
  characterFeature &&
  characterNumber &&
  abilityTitle
) {

  document.querySelectorAll('.character-option').forEach(button => {

    button.addEventListener('click', () => {

      const key = button.dataset.character;
      const character = characterData[key];

      if (!character) return;

      // 更新目前角色
      currentCharacter = key;

      // 切換角色時一律回到正面
      isBack = false;
      isAnimating = false;
      selectedCardBox.classList.remove('is-flipping');

      // 更新上方卡牌
      selectedCard.src = character.image;
      selectedCard.alt = character.name + '角色卡正面';

      // 更新右側角色介紹
      characterName.textContent = character.name;
      abilityTitle.textContent = character.abilityTitle;
      characterAbility.textContent = character.ability;
      characterFeature.textContent = character.feature;
      characterNumber.textContent = character.number;

      // 更新下方選取狀態
      document.querySelectorAll('.character-option').forEach(item => {
        item.classList.remove('active');
      });

      button.classList.add('active');


      if (selectedCardBox) {
        selectedCardBox.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }

    });

  });

}
