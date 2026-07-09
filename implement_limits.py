import re

with open("index.html", "r") as f:
    html = f.read()

# 1. Update settings UI for Initial Value Min/Max
old_init_val = """          <div class="setting-item">
            <label for="rule-initial-value">初期値</label>
            <select id="rule-initial-value">
              <option value="1" selected>1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>"""

new_init_val = """          <div class="setting-item">
            <label for="rule-initial-value-min">初期値（最小値）</label>
            <select id="rule-initial-value-min">
              <option value="1" selected>1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="rule-initial-value-max">初期値（最大値）</label>
            <select id="rule-initial-value-max">
              <option value="1" selected>1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>"""
html = html.replace(old_init_val, new_init_val)

# 2. Update disable options to selects
old_disable = """          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-disable-pull">
              相手の数字を引き込む（加算する）操作を禁止
            </label>
          </div>
          
          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-disable-transfer">
              自分の数字を分ける（譲渡）操作を禁止
            </label>
          </div>"""

new_disable = """          <div class="setting-item">
            <label for="rule-pull-limit">引き込みの回数制限</label>
            <select id="rule-pull-limit">
              <option value="-1" selected>無制限</option>
              <option value="0">禁止（0回）</option>
              <option value="1">1回まで</option>
              <option value="2">2回まで</option>
              <option value="3">3回まで</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label for="rule-transfer-limit">譲渡(分配)の回数制限</label>
            <select id="rule-transfer-limit">
              <option value="-1" selected>無制限</option>
              <option value="0">禁止（0回）</option>
              <option value="1">1回まで</option>
              <option value="2">2回まで</option>
              <option value="3">3回まで</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="rule-pass-limit">パスの回数制限</label>
            <select id="rule-pass-limit">
              <option value="0" selected>禁止（0回）</option>
              <option value="1">1回まで</option>
              <option value="2">2回まで</option>
              <option value="3">3回まで</option>
              <option value="-1">無制限</option>
            </select>
          </div>"""
html = html.replace(old_disable, new_disable)

# 3. Add Player Actions UI
old_p2 = """        <div class="player-section" id="player2-section" data-player="p2">
          <h3 class="player-name" id="p2-name">プレイヤー2</h3>
          <div class="cards-container" id="p2-cards-container">"""

new_p2 = """        <div class="player-section" id="player2-section" data-player="p2">
          <h3 class="player-name" id="p2-name">プレイヤー2</h3>
          <div class="player-actions" id="p2-actions">
            <span class="action-limit" id="p2-limit-transfer">譲渡: 無制限</span>
            <span class="action-limit" id="p2-limit-pull">引込: 無制限</span>
            <button class="btn pass-btn" id="p2-btn-pass">パス (0)</button>
          </div>
          <div class="cards-container" id="p2-cards-container">"""
html = html.replace(old_p2, new_p2)

old_p1 = """        <div class="player-section" id="player1-section" data-player="p1">
          <h3 class="player-name" id="p1-name">プレイヤー1</h3>
          <div class="cards-container" id="p1-cards-container">"""

new_p1 = """        <div class="player-section" id="player1-section" data-player="p1">
          <h3 class="player-name" id="p1-name">プレイヤー1</h3>
          <div class="player-actions" id="p1-actions">
            <span class="action-limit" id="p1-limit-transfer">譲渡: 無制限</span>
            <span class="action-limit" id="p1-limit-pull">引込: 無制限</span>
            <button class="btn pass-btn" id="p1-btn-pass">パス (0)</button>
          </div>
          <div class="cards-container" id="p1-cards-container">"""
html = html.replace(old_p1, new_p1)

with open("index.html", "w") as f:
    f.write(html)

# Update style.css
with open("style.css", "a") as f:
    f.write("""
/* 行動制限・パス UI */
.player-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}
.action-limit {
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  color: #555;
}
.pass-btn {
  background-color: #f1c40f;
  color: #fff;
  padding: 5px 15px;
  font-size: 0.9rem;
}
.pass-btn:hover {
  background-color: #f39c12;
}
.pass-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}
""")

# Script.js modifications
with open("script.js", "r") as f:
    js = f.read()

old_state = """  explodedCards: new Set(),
  customRules: {
    initialValue: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    disablePull: false,
    disableTransfer: false,"""

new_state = """  limits: {
    p1: { pull: -1, transfer: -1, pass: 0 },
    p2: { pull: -1, transfer: -1, pass: 0 }
  },
  explodedCards: new Set(),
  customRules: {
    initialValueMin: 1,
    initialValueMax: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    pullLimit: -1,
    transferLimit: -1,
    passLimit: 0,"""
js = js.replace(old_state, new_state)

old_dom = """const ruleInitialValue = document.getElementById('rule-initial-value');
const ruleMaxValue = document.getElementById('rule-max-value');
const ruleCardCount = document.getElementById('rule-card-count');
const ruleLoseCount = document.getElementById('rule-lose-count');
const ruleZeroOnFive = document.getElementById('rule-zero-on-five');
const ruleDisablePull = document.getElementById('rule-disable-pull');
const ruleDisableTransfer = document.getElementById('rule-disable-transfer');"""

new_dom = """const ruleInitMin = document.getElementById('rule-initial-value-min');
const ruleInitMax = document.getElementById('rule-initial-value-max');
const ruleMaxValue = document.getElementById('rule-max-value');
const ruleCardCount = document.getElementById('rule-card-count');
const ruleLoseCount = document.getElementById('rule-lose-count');
const ruleZeroOnFive = document.getElementById('rule-zero-on-five');
const rulePullLimit = document.getElementById('rule-pull-limit');
const ruleTransferLimit = document.getElementById('rule-transfer-limit');
const rulePassLimit = document.getElementById('rule-pass-limit');

document.getElementById('p1-btn-pass').addEventListener('click', () => executePass('p1'));
document.getElementById('p2-btn-pass').addEventListener('click', () => executePass('p2'));
"""
js = js.replace(old_dom, new_dom)

old_start = """  // 設定を読み取る
  gameState.customRules.initialValue = parseInt(ruleInitialValue.value, 10);
  gameState.customRules.maxValue = parseInt(ruleMaxValue.value, 10);
  gameState.customRules.cardCount = parseInt(ruleCardCount.value, 10);
  gameState.customRules.loseCount = ruleLoseCount.value;
  gameState.customRules.zeroWhenFiveOrMore = ruleZeroOnFive.checked;
  gameState.customRules.disablePull = ruleDisablePull.checked;
  gameState.customRules.disableTransfer = ruleDisableTransfer.checked;"""

new_start = """  // 設定を読み取る
  gameState.customRules.initialValueMin = parseInt(ruleInitMin.value, 10);
  gameState.customRules.initialValueMax = Math.max(gameState.customRules.initialValueMin, parseInt(ruleInitMax.value, 10));
  gameState.customRules.maxValue = parseInt(ruleMaxValue.value, 10);
  gameState.customRules.cardCount = parseInt(ruleCardCount.value, 10);
  gameState.customRules.loseCount = ruleLoseCount.value;
  gameState.customRules.zeroWhenFiveOrMore = ruleZeroOnFive.checked;
  gameState.customRules.pullLimit = parseInt(rulePullLimit.value, 10);
  gameState.customRules.transferLimit = parseInt(ruleTransferLimit.value, 10);
  gameState.customRules.passLimit = parseInt(rulePassLimit.value, 10);"""
js = js.replace(old_start, new_start)


old_reset = """function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;
  gameState.explodedCards.clear();
  
  createCardsDOM();"""

new_reset = """function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;
  gameState.explodedCards.clear();
  
  gameState.limits.p1 = { pull: gameState.customRules.pullLimit, transfer: gameState.customRules.transferLimit, pass: gameState.customRules.passLimit };
  gameState.limits.p2 = { pull: gameState.customRules.pullLimit, transfer: gameState.customRules.transferLimit, pass: gameState.customRules.passLimit };

  createCardsDOM();"""
js = js.replace(old_reset, new_reset)


old_create = """  const initVal = gameState.customRules.initialValue;

  for (let i = 0; i < gameState.customRules.cardCount; i++) {
    const cardId = labels[i];
    let handLabel = handLabels[i];
    
    if (gameState.customRules.loseCount === 'leader' && cardId === 'A') {
      handLabel = `👑 ${handLabel}`;
    }
    
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
  }"""

new_create = """  const min = gameState.customRules.initialValueMin;
  const max = gameState.customRules.initialValueMax;

  for (let i = 0; i < gameState.customRules.cardCount; i++) {
    const cardId = labels[i];
    let handLabel = handLabels[i];
    
    if (gameState.customRules.loseCount === 'leader' && cardId === 'A') {
      handLabel = `👑 ${handLabel}`;
    }
    
    const p1Init = Math.floor(Math.random() * (max - min + 1)) + min;
    const p2Init = Math.floor(Math.random() * (max - min + 1)) + min;

    gameState.cards.p1[cardId] = p1Init;
    const p1Card = `
      <div class="card-slot" id="p1-card-${cardId}" data-player="p1" data-card-id="${cardId}">
        <div class="card-inner">
          <span class="card-label">${handLabel}</span>
          <div class="card-value-display">
            <span class="card-value">${p1Init}</span>
          </div>
        </div>
      </div>
    `;
    p1CardsContainer.insertAdjacentHTML('beforeend', p1Card);

    gameState.cards.p2[cardId] = p2Init;
    const p2Card = `
      <div class="card-slot" id="p2-card-${cardId}" data-player="p2" data-card-id="${cardId}">
        <div class="card-inner">
          <span class="card-label">${handLabel}</span>
          <div class="card-value-display">
            <span class="card-value">${p2Init}</span>
          </div>
        </div>
      </div>
    `;
    p2CardsContainer.insertAdjacentHTML('beforeend', p2Card);
  }"""
js = js.replace(old_create, new_create)


old_update_ui = """  // UI表示を更新
  updateUI();
  
  if (gameState.currentPlayer === 'p2' && gameState.mode === 'cpu') {"""

new_update_ui = """  // UI表示を更新
  updateUI();
  
  if (gameState.currentPlayer === 'p2' && gameState.mode === 'cpu') {"""
# Wait, we need to update limits in updateUI.

old_ui_func = """function updateUI() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);"""

new_ui_func = """function updateUI() {
  // 制限表示の更新
  for (const p of ['p1', 'p2']) {
    const pullStr = gameState.limits[p].pull === -1 ? '無制限' : gameState.limits[p].pull;
    const transStr = gameState.limits[p].transfer === -1 ? '無制限' : gameState.limits[p].transfer;
    const passStr = gameState.limits[p].pass === -1 ? '無制限' : gameState.limits[p].pass;
    
    document.getElementById(`${p}-limit-transfer`).textContent = `譲渡: ${transStr}`;
    document.getElementById(`${p}-limit-pull`).textContent = `引込: ${pullStr}`;
    
    const passBtn = document.getElementById(`${p}-btn-pass`);
    if (gameState.limits[p].pass === 0 || gameState.currentPlayer !== p || (gameState.mode === 'cpu' && p === 'p2')) {
      passBtn.disabled = true;
      passBtn.style.display = gameState.limits[p].pass === 0 ? 'none' : 'inline-block';
      passBtn.textContent = `パス (${passStr})`;
    } else {
      passBtn.disabled = false;
      passBtn.style.display = 'inline-block';
      passBtn.textContent = `パス (${passStr})`;
    }
  }

  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);"""
js = js.replace(old_ui_func, new_ui_func)


# Adding executePass
pass_logic = """
function executePass(playerId) {
  if (gameState.currentPlayer !== playerId || gameState.isGameOver) return;
  if (gameState.limits[playerId].pass === 0) return;
  
  if (gameState.limits[playerId].pass > 0) {
    gameState.limits[playerId].pass--;
  }

  const name = playerId === 'p1' ? 'プレイヤー1' : (gameState.mode === 'cpu' ? 'CPU (AI)' : 'プレイヤー2');
  addLog(`⏩ ${name}がパスしました。`);
  endTurn();
}
"""
js = js.replace("function executeAttack(attackerPlayerId, targetPlayerId, attackerCardId, targetCardId) {", pass_logic + "\nfunction executeAttack(attackerPlayerId, targetPlayerId, attackerCardId, targetCardId) {")

# Update Drag constraints based on Limits
old_trans_check = """  if (sourceVal < 1) return false; // 0からは譲渡不可"""
new_trans_check = """  if (sourceVal < 1) return false;
  if (gameState.limits[playerId].transfer === 0) return false;
  if (gameState.limits[playerId].transfer > 0) gameState.limits[playerId].transfer--;"""
js = js.replace(old_trans_check, new_trans_check)

old_pull_check = """  if (pullerVal === 0 || targetVal === 0) return false; // 0へは引き込めない、0からは引き込めない"""
new_pull_check = """  if (pullerVal === 0 || targetVal === 0) return false;
  if (gameState.limits[pullerPlayerId].pull === 0) return false;
  if (gameState.limits[pullerPlayerId].pull > 0) gameState.limits[pullerPlayerId].pull--;"""
js = js.replace(old_pull_check, new_pull_check)

old_drag_enter = """    if (isSelf) {
      if (sourceVal >= 1 && (!gameState.customRules.disableTransfer || gameState.customRules.allowSelfAdd)) {
        slot.classList.add('drop-target-transfer');
      }
    } else {
      // 相手へのドラッグ
      if (gameState.draggedCard.player === gameState.currentPlayer) {
        // 自分から相手へのドラッグ（攻撃）
        slot.classList.add('drop-target-attack');
      } else {
        // 相手から自分へのドラッグ（引き込み）
        if (!gameState.customRules.disablePull) {
          slot.classList.add('drop-target-pull');
        }
      }
    }"""
new_drag_enter = """    if (isSelf) {
      if (sourceVal >= 1 && gameState.limits[gameState.currentPlayer].transfer !== 0) {
        slot.classList.add('drop-target-transfer');
      }
    } else {
      if (gameState.draggedCard.player === gameState.currentPlayer) {
        slot.classList.add('drop-target-attack');
      } else {
        if (gameState.limits[gameState.currentPlayer].pull !== 0) {
          slot.classList.add('drop-target-pull');
        }
      }
    }"""
js = js.replace(old_drag_enter, new_drag_enter)

old_drag_drop = """        if (isSelf) {
          // 自陣同士のドロップ（譲渡）
          if (!gameState.customRules.disableTransfer || gameState.customRules.allowSelfAdd) {
            executeTransfer(targetPlayer, dragSource.cardId, targetCardId);
          }
        } else {
          // 相手から自分、または自分から相手
          if (dragSource.player === gameState.currentPlayer) {
            // 自分から相手へのドロップ（攻撃）
            executeAttack(dragSource.player, targetPlayer, dragSource.cardId, targetCardId);
          } else {
            // 相手から自分へのドロップ（引き込み）
            if (!gameState.customRules.disablePull) {
              executePull(targetPlayer, dragSource.player, targetCardId, dragSource.cardId);
            }
          }
        }"""
new_drag_drop = """        if (isSelf) {
          if (gameState.limits[gameState.currentPlayer].transfer !== 0) {
            executeTransfer(targetPlayer, dragSource.cardId, targetCardId);
          }
        } else {
          if (dragSource.player === gameState.currentPlayer) {
            executeAttack(dragSource.player, targetPlayer, dragSource.cardId, targetCardId);
          } else {
            if (gameState.limits[gameState.currentPlayer].pull !== 0) {
              executePull(targetPlayer, dragSource.player, targetCardId, dragSource.cardId);
            }
          }
        }"""
js = js.replace(old_drag_drop, new_drag_drop)

old_action_pos = """    if (val >= 1 && (!gameState.customRules.disableTransfer || gameState.customRules.allowSelfAdd)) {
      canTransfer = true;
    }
    
    for (const oppCard of labels) {
      if (oppCards[oppCard] > 0 && !gameState.customRules.disablePull) {
        canPull = true;
      }
    }"""
new_action_pos = """    if (val >= 1 && gameState.limits[gameState.currentPlayer].transfer !== 0) {
      canTransfer = true;
    }
    
    for (const oppCard of labels) {
      if (oppCards[oppCard] > 0 && gameState.limits[gameState.currentPlayer].pull !== 0) {
        canPull = true;
      }
    }"""
js = js.replace(old_action_pos, new_action_pos)
old_act_empty = """  if (!canAttack && !canTransfer && !canPull) {
    endTurn();
  }"""
new_act_empty = """  if (!canAttack && !canTransfer && !canPull) {
    if (gameState.limits[gameState.currentPlayer].pass !== 0) {
       executePass(gameState.currentPlayer);
    } else {
       endTurn();
    }
  }"""
js = js.replace(old_act_empty, new_act_empty)

# CPU Logic updates for limits
old_cpu_trans_chk = """  // 2. 譲渡の手
  if (!gameState.customRules.disableTransfer) {"""
new_cpu_trans_chk = """  // 2. 譲渡の手
  if (gameState.limits.p2.transfer !== 0) {"""
js = js.replace(old_cpu_trans_chk, new_cpu_trans_chk)

old_cpu_pull_chk = """  // 3. 引き込みの手
  if (!gameState.customRules.disablePull) {"""
new_cpu_pull_chk = """  // 3. 引き込みの手
  if (gameState.limits.p2.pull !== 0) {"""
js = js.replace(old_cpu_pull_chk, new_cpu_pull_chk)

# Add pass evaluation for CPU
old_cpu_sort = """  if (validMoves.length === 0) {
    // 打つ手がない場合（基本的には全滅チェックで弾かれるが、安全策）
    endTurn();
    return;
  }

  // スコア順にソート（降順）
  validMoves.sort((a, b) => b.score - a.score);"""

new_cpu_sort = """  if (validMoves.length === 0) {
    if (gameState.limits.p2.pass !== 0) {
      executePass('p2');
    } else {
      endTurn();
    }
    return;
  }

  // パスのシミュレーション
  if (gameState.limits.p2.pass !== 0) {
    // パスのスコアは0（何もしない）。もし他の手が全部マイナスならパスを選ぶ。
    validMoves.push({ type: 'pass', score: 0 });
  }

  // スコア順にソート（降順）
  validMoves.sort((a, b) => b.score - a.score);"""
js = js.replace(old_cpu_sort, new_cpu_sort)

old_cpu_exec = """  } else if (chosenMove.type === 'pull') {
    // 相手(p1)から自分(p2)へ引き込み
    visualizeCpuAction('p1', chosenMove.from, 'p2', chosenMove.to);
    setTimeout(() => {
      executePull('p2', 'p1', chosenMove.to, chosenMove.from);
      endTurn();
    }, 400);
  }"""
new_cpu_exec = """  } else if (chosenMove.type === 'pull') {
    visualizeCpuAction('p1', chosenMove.from, 'p2', chosenMove.to);
    setTimeout(() => {
      executePull('p2', 'p1', chosenMove.to, chosenMove.from);
      endTurn();
    }, 400);
  } else if (chosenMove.type === 'pass') {
    setTimeout(() => {
      executePass('p2');
    }, 400);
  }"""
js = js.replace(old_cpu_exec, new_cpu_exec)

with open("script.js", "w") as f:
    f.write(js)
