import re

with open("script.js", "r") as f:
    content = f.read()

# 1. Update gameState definition
old_state = """  customRules: {
    initialValue: 1,
    zeroWhenFiveOrMore: false,
    disablePull: false,
    disableTransfer: false
  }
};"""

new_state = """  customRules: {
    initialValue: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    disablePull: false,
    disableTransfer: false,
    allowSelfAdd: false,
    blindMode: false,
    reverseWin: false
  }
};"""
content = content.replace(old_state, new_state)

# 2. Change `const cardSlots = ...` to `let cardSlots = ...`
content = content.replace("const cardSlots = document.querySelectorAll('.card-slot');", "let cardSlots = document.querySelectorAll('.card-slot');")

# 3. Add new DOM elements
old_dom = """// ルール設定用要素
const ruleInitialValue = document.getElementById('rule-initial-value');
const ruleZeroOnFive = document.getElementById('rule-zero-on-five');
const ruleDisablePull = document.getElementById('rule-disable-pull');
const ruleDisableTransfer = document.getElementById('rule-disable-transfer');"""

new_dom = """// ルール設定用要素
const ruleInitialValue = document.getElementById('rule-initial-value');
const ruleMaxValue = document.getElementById('rule-max-value');
const ruleCardCount = document.getElementById('rule-card-count');
const ruleLoseCount = document.getElementById('rule-lose-count');
const ruleZeroOnFive = document.getElementById('rule-zero-on-five');
const ruleDisablePull = document.getElementById('rule-disable-pull');
const ruleDisableTransfer = document.getElementById('rule-disable-transfer');
const ruleAllowSelfAdd = document.getElementById('rule-allow-self-add');
const ruleBlindMode = document.getElementById('rule-blind-mode');
const ruleReverseWin = document.getElementById('rule-reverse-win');

const p1CardsContainer = document.getElementById('p1-cards-container');
const p2CardsContainer = document.getElementById('p2-cards-container');"""
content = content.replace(old_dom, new_dom)

# 4. Remove `setupDragAndDrop()` from `init()`
content = content.replace("  setupDragAndDrop();\n}", "}")

# 5. Update startGame
old_start = """function startGame(mode) {
  // 設定を読み取る
  gameState.customRules.initialValue = parseInt(ruleInitialValue.value, 10);
  gameState.customRules.zeroWhenFiveOrMore = ruleZeroOnFive.checked;
  gameState.customRules.disablePull = ruleDisablePull.checked;
  gameState.customRules.disableTransfer = ruleDisableTransfer.checked;"""

new_start = """function startGame(mode) {
  // 設定を読み取る
  gameState.customRules.initialValue = parseInt(ruleInitialValue.value, 10);
  gameState.customRules.maxValue = parseInt(ruleMaxValue.value, 10);
  gameState.customRules.cardCount = parseInt(ruleCardCount.value, 10);
  gameState.customRules.loseCount = ruleLoseCount.value;
  gameState.customRules.zeroWhenFiveOrMore = ruleZeroOnFive.checked;
  gameState.customRules.disablePull = ruleDisablePull.checked;
  gameState.customRules.disableTransfer = ruleDisableTransfer.checked;
  gameState.customRules.allowSelfAdd = ruleAllowSelfAdd.checked;
  gameState.customRules.blindMode = ruleBlindMode.checked;
  gameState.customRules.reverseWin = ruleReverseWin.checked;"""
content = content.replace(old_start, new_start)

# 6. Update resetGame and createCardsDOM
old_reset = """function resetGame() {
  const initVal = gameState.customRules.initialValue;
  gameState.currentPlayer = 'p1';
  gameState.cards.p1.A = initVal;
  gameState.cards.p1.B = initVal;
  gameState.cards.p2.A = initVal;
  gameState.cards.p2.B = initVal;
  gameState.isGameOver = false;
  gameState.draggedCard = null;"""

new_reset = """function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;
  
  createCardsDOM();"""
content = content.replace(old_reset, new_reset)

# 7. Add createCardsDOM before calculateCardValue
create_cards_func = """
function createCardsDOM() {
  p1CardsContainer.innerHTML = '';
  p2CardsContainer.innerHTML = '';
  
  const labels = ['A', 'B', 'C', 'D'];
  const handLabels = ['左手', '右手', '第3の手', '第4の手'];
  
  gameState.cards.p1 = {};
  gameState.cards.p2 = {};

  const initVal = gameState.customRules.initialValue;

  for (let i = 0; i < gameState.customRules.cardCount; i++) {
    const cardId = labels[i];
    const handLabel = handLabels[i];
    
    gameState.cards.p1[cardId] = initVal;
    const p1Card = `
      <div class="card-slot" id="p1-card-${cardId}" data-player="p1" data-card-id="${cardId}">
        <div class="card-inner">
          <span class="card-label">${handLabel}</span>
          <div class="card-value-display">
            <span class="card-value">${initVal}</span>
          </div>
        </div>
      </div>
    `;
    p1CardsContainer.insertAdjacentHTML('beforeend', p1Card);

    gameState.cards.p2[cardId] = initVal;
    const p2Card = `
      <div class="card-slot" id="p2-card-${cardId}" data-player="p2" data-card-id="${cardId}">
        <div class="card-inner">
          <span class="card-label">${handLabel}</span>
          <div class="card-value-display">
            <span class="card-value">${initVal}</span>
          </div>
        </div>
      </div>
    `;
    p2CardsContainer.insertAdjacentHTML('beforeend', p2Card);
  }
  
  cardSlots = document.querySelectorAll('.card-slot');
  setupDragAndDrop();
}

// カスタムルールを考慮した合計値計算
"""
content = content.replace("// カスタムルールを考慮した合計値計算\n", create_cards_func)

# 8. calculateCardValue logic
old_calc = """function calculateCardValue(totalValue) {
  if (totalValue >= 5) {
    if (gameState.customRules.zeroWhenFiveOrMore) {
      return 0; // 5以上なら一律0になる
    }
    return totalValue - 5;
  }
  return totalValue;
}"""

new_calc = """function calculateCardValue(totalValue) {
  const max = gameState.customRules.maxValue;
  if (totalValue >= max) {
    if (gameState.customRules.zeroWhenFiveOrMore) {
      return 0; 
    }
    return totalValue - max;
  }
  return totalValue;
}"""
content = content.replace(old_calc, new_calc)

# 9. executeTransfer Logic for Self-Addition
old_transfer = """function executeTransfer(playerId, sourceCardId, targetCardId) {
  const sourceVal = gameState.cards[playerId][sourceCardId];
  const targetVal = gameState.cards[playerId][targetCardId];

  if (sourceVal < 1) return false; // 0からは譲渡不可

  let transferAmount = 0;
  let newSourceVal = 0;

  if (sourceVal === 1) { transferAmount = 1; newSourceVal = 0; }
  else if (sourceVal === 2) { transferAmount = 1; newSourceVal = 1; }
  else if (sourceVal === 3) { transferAmount = 1; newSourceVal = 2; }
  else if (sourceVal === 4) { transferAmount = 2; newSourceVal = 2; }

  // ターゲットへの加算と、5以上の端数処理
  let newTargetVal = calculateCardValue(targetVal + transferAmount);"""

new_transfer = """function executeTransfer(playerId, sourceCardId, targetCardId) {
  const sourceVal = gameState.cards[playerId][sourceCardId];
  const targetVal = gameState.cards[playerId][targetCardId];

  if (sourceVal < 1) return false; // 0からは譲渡不可

  let newSourceVal = 0;
  let newTargetVal = 0;

  if (gameState.customRules.allowSelfAdd) {
    newSourceVal = 0;
    newTargetVal = calculateCardValue(targetVal + sourceVal);
  } else {
    let transferAmount = 0;
    if (sourceVal === 1) { transferAmount = 1; newSourceVal = 0; }
    else if (sourceVal === 2) { transferAmount = 1; newSourceVal = 1; }
    else if (sourceVal === 3) { transferAmount = 1; newSourceVal = 2; }
    else if (sourceVal === 4) { transferAmount = 2; newSourceVal = 2; }
    else { transferAmount = Math.floor(sourceVal/2); newSourceVal = sourceVal - transferAmount; }
    
    newTargetVal = calculateCardValue(targetVal + transferAmount);
  }"""
content = content.replace(old_transfer, new_transfer)

# 10. checkVictory Logic for Win Reversal and Dynamic cards
old_victory = """function checkVictory() {
  const p1Defeated = gameState.cards.p1.A === 0 && gameState.cards.p1.B === 0;
  const p2Defeated = gameState.cards.p2.A === 0 && gameState.cards.p2.B === 0;

  if (p1Defeated || p2Defeated) {
    gameState.isGameOver = true;
    let winnerText = '';

    if (p1Defeated && p2Defeated) {
      // 基本的には交互プレイなので同時は稀だが、ロジック上発生した場合は引き分け
      winnerText = '引き分け！';
    } else if (p2Defeated) {
      winnerText = 'プレイヤー1の勝利！';
    } else {
      winnerText = gameState.mode === 'cpu' ? 'CPU (AI) の勝利！' : 'プレイヤー2の勝利！';
    }"""

new_victory = """function checkVictory() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  let p1Zeros = 0;
  let p2Zeros = 0;
  
  labels.forEach(id => {
    if (gameState.cards.p1[id] === 0) p1Zeros++;
    if (gameState.cards.p2[id] === 0) p2Zeros++;
  });
  
  let requiredZeros = gameState.customRules.cardCount;
  if (gameState.customRules.loseCount !== 'all') {
    requiredZeros = parseInt(gameState.customRules.loseCount, 10);
    if (requiredZeros > gameState.customRules.cardCount) {
      requiredZeros = gameState.customRules.cardCount;
    }
  }

  const p1Defeated = p1Zeros >= requiredZeros;
  const p2Defeated = p2Zeros >= requiredZeros;

  if (p1Defeated || p2Defeated) {
    gameState.isGameOver = true;
    let winnerText = '';

    if (p1Defeated && p2Defeated) {
      winnerText = '引き分け！';
    } else {
      if (gameState.customRules.reverseWin) {
        if (p1Defeated) winnerText = 'プレイヤー1の勝利！';
        else winnerText = gameState.mode === 'cpu' ? 'CPU (AI) の勝利！' : 'プレイヤー2の勝利！';
      } else {
        if (p2Defeated) winnerText = 'プレイヤー1の勝利！';
        else winnerText = gameState.mode === 'cpu' ? 'CPU (AI) の勝利！' : 'プレイヤー2の勝利！';
      }
    }"""
content = content.replace(old_victory, new_victory)

# 11. updateUI Logic for Blind mode
old_ui = """function updateUI() {
  for (const player of ['p1', 'p2']) {
    for (const cardId of ['A', 'B']) {
      const val = gameState.cards[player][cardId];
      const slot = document.getElementById(`${player}-card-${cardId}`);
      const valElement = slot.querySelector('.card-value');

      valElement.textContent = val;"""

new_ui = """function updateUI() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  for (const player of ['p1', 'p2']) {
    for (const cardId of labels) {
      const val = gameState.cards[player][cardId];
      const slot = document.getElementById(`${player}-card-${cardId}`);
      if (!slot) continue;
      const valElement = slot.querySelector('.card-value');

      const isOpponent = player !== gameState.currentPlayer;
      if (gameState.customRules.blindMode && isOpponent) {
        valElement.textContent = '?';
      } else {
        valElement.textContent = val;
      }"""
content = content.replace(old_ui, new_ui)

# 12. Update executeCpuTurn
old_cpu1 = """  // 1. 攻撃の手
  for (const cpuCardId of ['A', 'B']) {"""
new_cpu1 = """  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  // 1. 攻撃の手
  for (const cpuCardId of labels) {"""
content = content.replace(old_cpu1, new_cpu1)

old_cpu2 = """    for (const playerCardId of ['A', 'B']) {"""
new_cpu2 = """    for (const playerCardId of labels) {"""
content = content.replace(old_cpu2, new_cpu2) # Replaces both attack and pull loops

old_cpu3 = """  if (!gameState.customRules.disableTransfer) {
    for (const sourceCardId of ['A', 'B']) {"""
new_cpu3 = """  if (!gameState.customRules.disableTransfer) {
    for (const sourceCardId of labels) {"""
content = content.replace(old_cpu3, new_cpu3)

old_cpu4 = """      const targetCardId = sourceCardId === 'A' ? 'B' : 'A';"""
new_cpu4 = """      for (const targetCardId of labels) {
        if (sourceCardId === targetCardId) continue;"""
content = content.replace(old_cpu4, new_cpu4)

# We need to properly close the loop for targetCardId in the transfer section
# Find the transfer sim block
old_cpu_transfer_sim = """      let transferAmount = 0;
      if (sourceVal === 1 || sourceVal === 2 || sourceVal === 3) transferAmount = 1;
      else if (sourceVal === 4) transferAmount = 2;

      // 譲渡シミュレーション
      const nextTargetVal = calculateCardValue(targetVal + transferAmount);

      validMoves.push({
        type: 'transfer',
        from: sourceCardId,
        to: targetCardId,
        score: evaluateTransferResult(sourceCardId, targetCardId, sourceVal, targetVal, nextTargetVal)
      });
    }
  }

  // 3. 引き込みの手"""

new_cpu_transfer_sim = """      let transferAmount = 0;
      if (gameState.customRules.allowSelfAdd) {
        transferAmount = sourceVal;
      } else {
        if (sourceVal === 1 || sourceVal === 2 || sourceVal === 3) transferAmount = 1;
        else if (sourceVal === 4) transferAmount = 2;
        else transferAmount = Math.floor(sourceVal/2);
      }

      // 譲渡シミュレーション
      const nextTargetVal = calculateCardValue(targetVal + transferAmount);

      validMoves.push({
        type: 'transfer',
        from: sourceCardId,
        to: targetCardId,
        score: evaluateTransferResult(sourceCardId, targetCardId, sourceVal, targetVal, nextTargetVal)
      });
      }
    }
  }

  // 3. 引き込みの手"""
content = content.replace(old_cpu_transfer_sim, new_cpu_transfer_sim)

old_cpu5 = """  if (!gameState.customRules.disablePull) {
    for (const cpuCardId of ['A', 'B']) {"""
new_cpu5 = """  if (!gameState.customRules.disablePull) {
    for (const cpuCardId of labels) {"""
content = content.replace(old_cpu5, new_cpu5)


with open("script.js", "w") as f:
    f.write(content)

