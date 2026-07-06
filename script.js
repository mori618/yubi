// ==========================================
// ゲーム状態管理 (State)
// ==========================================
const gameState = {
  mode: null,          // 'local' または 'cpu'
  currentPlayer: 'p1', // 'p1' または 'p2'
  cards: {
    p1: { A: 1, B: 1 },
    p2: { A: 1, B: 1 }
  },
  isGameOver: false,
  draggedCard: null,   // ドラッグ中のカード情報 { player, cardId, value }
  limits: {
    p1: { pull: -1, transfer: -1, pass: 0 },
    p2: { pull: -1, transfer: -1, pass: 0 }
  },
  explodedCards: new Set(),
  customRules: {
    cpuDifficulty: 'strong',
    initialValueMin: 1,
    initialValueMax: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    pullLimit: -1,
    transferLimit: -1,
    passLimit: 0,
    allowSelfAdd: false,
    blindMode: false,
    reverseWin: false,
    multiplyAttack: false,
    chainExplosion: false
  }
};

// ==========================================
// DOM 要素の取得
// ==========================================
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const btnLocal = document.getElementById('btn-local');
const btnCpu = document.getElementById('btn-cpu');
const btnRestart = document.getElementById('btn-restart');
const btnRematch = document.getElementById('btn-rematch');
const turnIndicator = document.getElementById('turn-indicator');
const logList = document.getElementById('log-list');
const winnerMessage = document.getElementById('winner-message');

// 新規追加ボタンとモーダル
const btnSetupRules = document.getElementById('btn-setup-rules');
const btnShowRules = document.getElementById('btn-show-rules');
const btnCloseRules = document.getElementById('btn-close-rules');
const btnShowLog = document.getElementById('btn-show-log');
const btnCloseLog = document.getElementById('btn-close-log');
const rulesModal = document.getElementById('rules-modal');
const logModal = document.getElementById('log-modal');

const p1Section = document.getElementById('player1-section');
const p2Section = document.getElementById('player2-section');
const p2Name = document.getElementById('p2-name');

// ルール設定用要素
const ruleCpuDifficulty = document.getElementById('rule-cpu-difficulty');
const ruleInitMin = document.getElementById('rule-initial-value-min');
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

const ruleAllowSelfAdd = document.getElementById('rule-allow-self-add');
const ruleBlindMode = document.getElementById('rule-blind-mode');
const ruleReverseWin = document.getElementById('rule-reverse-win');
const ruleMultiplyAttack = document.getElementById('rule-multiply-attack');
const ruleChainExplosion = document.getElementById('rule-chain-explosion');

const p1CardsContainer = document.getElementById('p1-cards-container');
const p2CardsContainer = document.getElementById('p2-cards-container');

// 全カードスロットの取得
let cardSlots = document.querySelectorAll('.card-slot');

// ==========================================
// 初期化・イベント設定
// ==========================================
function init() {
  btnLocal.addEventListener('click', () => startGame('local'));
  btnCpu.addEventListener('click', () => startGame('cpu'));
  btnRestart.addEventListener('click', backToTitle);
  btnRematch.addEventListener('click', resetGame);

  // モーダル制御
  btnSetupRules.addEventListener('click', () => rulesModal.classList.add('active'));
  btnShowRules.addEventListener('click', () => rulesModal.classList.add('active'));
  btnCloseRules.addEventListener('click', () => rulesModal.classList.remove('active'));
  
  btnShowLog.addEventListener('click', () => {
    logModal.classList.add('active');
    logList.scrollTop = logList.scrollHeight; // 開いたときに最新を見る
  });
  btnCloseLog.addEventListener('click', () => logModal.classList.remove('active'));

}

// ゲーム開始
function startGame(mode) {
  // 設定を読み取る
  gameState.customRules.cpuDifficulty = ruleCpuDifficulty.value;
  gameState.customRules.initialValueMin = parseInt(ruleInitMin.value, 10);
  gameState.customRules.initialValueMax = Math.max(gameState.customRules.initialValueMin, parseInt(ruleInitMax.value, 10));
  gameState.customRules.maxValue = parseInt(ruleMaxValue.value, 10);
  gameState.customRules.cardCount = parseInt(ruleCardCount.value, 10);
  gameState.customRules.loseCount = ruleLoseCount.value;
  gameState.customRules.zeroWhenFiveOrMore = ruleZeroOnFive.checked;
  gameState.customRules.pullLimit = parseInt(rulePullLimit.value, 10);
  gameState.customRules.transferLimit = parseInt(ruleTransferLimit.value, 10);
  gameState.customRules.passLimit = parseInt(rulePassLimit.value, 10);
  gameState.customRules.allowSelfAdd = ruleAllowSelfAdd.checked;
  gameState.customRules.blindMode = ruleBlindMode.checked;
  gameState.customRules.reverseWin = ruleReverseWin.checked;
  gameState.customRules.multiplyAttack = ruleMultiplyAttack.checked;
  gameState.customRules.chainExplosion = ruleChainExplosion.checked;

  gameState.mode = mode;
  p2Name.textContent = mode === 'cpu' ? 'CPU (AI)' : 'プレイヤー2';
  setupScreen.classList.remove('active');
  gameScreen.classList.add('active');
  resetGame();
}

// タイトルへ戻る
function backToTitle() {
  gameScreen.classList.remove('active');
  gameoverScreen.classList.remove('active');
  setupScreen.classList.add('active');
}

// ゲームリセット
function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;
  gameState.explodedCards.clear();
  
  gameState.limits.p1 = { pull: gameState.customRules.pullLimit, transfer: gameState.customRules.transferLimit, pass: gameState.customRules.passLimit };
  gameState.limits.p2 = { pull: gameState.customRules.pullLimit, transfer: gameState.customRules.transferLimit, pass: gameState.customRules.passLimit };

  createCardsDOM();

  gameoverScreen.classList.remove('active');
  
  // ログクリア
  logList.innerHTML = '<div class="log-item system">ゲームが開始されました。</div>';
  
  updateUI();
  updateTurnIndicator();
  enablePlayerDrag();
  addLog('システム', 'プレイヤー1のターンです。', 'system');
}

// ==========================================
// 計算ロジック (仕様書準拠)
// ==========================================


function createCardsDOM() {
  p1CardsContainer.innerHTML = '';
  p2CardsContainer.innerHTML = '';
  
  const labels = ['A', 'B', 'C', 'D'];
  const handLabels = ['左手', '右手', '第3の手', '第4の手'];
  
  gameState.cards.p1 = {};
  gameState.cards.p2 = {};

  const min = gameState.customRules.initialValueMin;
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
  }
  
  cardSlots = document.querySelectorAll('.card-slot');
  setupDragAndDrop();
}

// カスタムルールを考慮した合計値計算
function calculateCardValue(totalValue) {
  const max = gameState.customRules.maxValue;
  if (totalValue >= max) {
    if (gameState.customRules.zeroWhenFiveOrMore) {
      return 0; 
    }
    return totalValue - max;
  }
  return totalValue;
}

// 攻撃処理のロジック

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

function executeAttack(attackerPlayerId, targetPlayerId, attackerCardId, targetCardId) {
  const attackerVal = gameState.cards[attackerPlayerId][attackerCardId];
  const targetVal = gameState.cards[targetPlayerId][targetCardId];

  // 攻撃された側のカードに加算
  let nextTargetVal = attackerVal + targetVal;
  
  // 新しいルール：5以上なら5を引いた数を残す
  nextTargetVal = calculateCardValue(nextTargetVal);

  // 状態の更新
  gameState.cards[targetPlayerId][targetCardId] = nextTargetVal;

  const attackerName = getPlayerName(attackerPlayerId);
  const targetName = getPlayerName(targetPlayerId);
  
  addLog(
    attackerPlayerId,
    `${attackerName}が${getHandName(attacke)}(指${attackerVal}本)で、${targetName}の${getHandName(targe)}(指${targetVal}本)を攻撃！結果: → ${nextTargetVal}本`,
    attackerPlayerId
  );

  triggerUpdateAnimation(targetPlayerId, targetCardId);
}

// 譲渡処理のロジック
function executeTransfer(playerId, sourceCardId, targetCardId) {
  const sourceVal = gameState.cards[playerId][sourceCardId];
  const targetVal = gameState.cards[playerId][targetCardId];

  if (sourceVal < 1) return false;
  if (gameState.limits[playerId].transfer === 0) return false;
  if (gameState.limits[playerId].transfer > 0) gameState.limits[playerId].transfer--;

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
  }

  // 状態の更新
  gameState.cards[playerId][sourceCardId] = newSourceVal;
  gameState.cards[playerId][targetCardId] = newTargetVal;

  const playerName = getPlayerName(playerId);
  addLog(
    playerId,
    `${playerName}が${getHandName(sourc)}(指${sourceVal}本)から${getHandName(targe)}(指${targetVal}本)へ指を譲渡。結果: 送り側→ ${newSourceVal}本, 受け取り側→ ${newTargetVal}本`,
    playerId
  );

  triggerUpdateAnimation(playerId, sourceCardId);
  triggerUpdateAnimation(playerId, targetCardId);
  return true;
}

// 引き込み処理のロジック (案B: 相手は変化なし、自分に加算)
function executePull(pullerPlayerId, targetPlayerId, pullerCardId, targetCardId) {
  const pullerVal = gameState.cards[pullerPlayerId][pullerCardId];
  const targetVal = gameState.cards[targetPlayerId][targetCardId];

  // 自分のカードに加算
  let nextPullerVal = pullerVal + targetVal;
  nextPullerVal = calculateCardValue(nextPullerVal);

  // 状態の更新
  gameState.cards[pullerPlayerId][pullerCardId] = nextPullerVal;

  const pullerName = getPlayerName(pullerPlayerId);
  const targetName = getPlayerName(targetPlayerId);

  addLog(
    pullerPlayerId,
    `${pullerName}が相手の${getHandName(targe)}(指${targetVal}本)を自分の${getHandName(pulle)}(指${pullerVal}本)に引き込んで加算！結果: 自分の手→ ${nextPullerVal}本 (相手は変化なし)`,
    pullerPlayerId
  );

  triggerUpdateAnimation(pullerPlayerId, pullerCardId);
}

// ==========================================
// ドラッグ＆ドロップ制御 (Drag and Drop)
// ==========================================
function setupDragAndDrop() {
  cardSlots.forEach(slot => {
    // ドラッグ開始
    slot.addEventListener('dragstart', (e) => {
      if (gameState.isGameOver) {
        e.preventDefault();
        return;
      }

      const player = slot.dataset.player;
      const cardId = slot.dataset.cardId;
      const value = gameState.cards[player][cardId];

      // 消滅していないカード(0より大きい)であればドラッグ可能（自分のカードも相手のカードも可）
      if (value > 0) {
        gameState.draggedCard = { player, cardId, value };
        slot.classList.add('dragging');
        
        // ドロップ先のターゲット候補をハイライトするためのガイダンス表示
        highlightValidTargets(player, cardId, value);
      } else {
        e.preventDefault();
      }
    });

    // ドラッグ終了
    slot.addEventListener('dragend', () => {
      slot.classList.remove('dragging');
      clearHighlights();
      gameState.draggedCard = null;
    });

    // ドラッグが要素の上に入ったとき
    slot.addEventListener('dragenter', (e) => {
      if (!gameState.draggedCard) return;
      e.preventDefault();

      const dragSource = gameState.draggedCard;
      const targetPlayer = slot.dataset.player;
      const targetCardId = slot.dataset.cardId;
      const targetValue = gameState.cards[targetPlayer][targetCardId];
      
      const isSourceOwn = dragSource.player === gameState.currentPlayer;

      if (isSourceOwn) {
        // 自分のカードをドラッグ：攻撃または譲渡
        if (targetPlayer !== dragSource.player && targetValue > 0) {
          slot.classList.add('drop-target-attack');
        } else if (targetPlayer === dragSource.player && targetCardId !== dragSource.cardId) {
          if (!gameState.customRules.disableTransfer && dragSource.value >= 1) {
            slot.classList.add('drop-target-transfer');
          } else {
            slot.classList.add('drop-target-invalid');
          }
        }
      } else {
        // 相手のカードをドラッグ：引き込み加算
        if (targetPlayer === gameState.currentPlayer) {
          if (!gameState.customRules.disablePull && targetValue > 0) {
            slot.classList.add('drop-target-pull');
          } else {
            slot.classList.add('drop-target-invalid'); // 引き込み不可
          }
        }
      }
    });

    // ドラッグが要素の上にあるとき
    slot.addEventListener('dragover', (e) => {
      if (!gameState.draggedCard) return;
      
      const dragSource = gameState.draggedCard;
      const targetPlayer = slot.dataset.player;
      const targetCardId = slot.dataset.cardId;
      const targetValue = gameState.cards[targetPlayer][targetCardId];
      
      const isSourceOwn = dragSource.player === gameState.currentPlayer;

      if (isSourceOwn) {
        // 攻撃：相手の1以上のカードに対してドロップを許可
        if (targetPlayer !== dragSource.player && targetValue > 0) {
          e.preventDefault();
        }
        // 譲渡：自分の1以上のカードから、もう一方のカードに対してドロップを許可
        else if (!gameState.customRules.disableTransfer && targetPlayer === dragSource.player && targetCardId !== dragSource.cardId && dragSource.value >= 1) {
          e.preventDefault();
        }
      } else {
        // 引き込み：相手のカードを自分の1以上のカードにドロップするのを許可
        if (!gameState.customRules.disablePull && targetPlayer === gameState.currentPlayer && targetValue > 0) {
          e.preventDefault();
        }
      }
    });

    // ドラッグが要素から離れたとき
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drop-target-attack', 'drop-target-transfer', 'drop-target-invalid', 'drop-target-pull');
    });

    // ドロップされたとき
    slot.addEventListener('drop', (e) => {
      if (!gameState.draggedCard) return;
      e.preventDefault();

      const dragSource = gameState.draggedCard;
      const targetPlayer = slot.dataset.player;
      const targetCardId = slot.dataset.cardId;

      slot.classList.remove('drop-target-attack', 'drop-target-transfer', 'drop-target-invalid', 'drop-target-pull');

      let actionExecuted = false;
      const isSourceOwn = dragSource.player === gameState.currentPlayer;

      if (isSourceOwn) {
        // 攻撃の実行
        if (targetPlayer !== dragSource.player) {
          executeAttack(dragSource.player, targetPlayer, dragSource.cardId, targetCardId);
          actionExecuted = true;
        }
        // 譲渡の実行
        else if (targetPlayer === dragSource.player && targetCardId !== dragSource.cardId) {
          if (!gameState.customRules.disableTransfer) {
            actionExecuted = executeTransfer(dragSource.player, dragSource.cardId, targetCardId);
          }
        }
      } else {
        // 引き込みの実行（相手のカードを自分のカードへドロップ）
        const currentTargetValue = gameState.cards[targetPlayer][targetCardId];
        if (!gameState.customRules.disablePull && targetPlayer === gameState.currentPlayer && currentTargetValue > 0) {
          executePull(targetPlayer, dragSource.player, targetCardId, dragSource.cardId);
          actionExecuted = true;
        }
      }

      if (actionExecuted) {
        endTurn();
      }
    });
  });
}

// 有効なターゲットを視覚的にハイライトする
function highlightValidTargets(dragPlayer, cardId, value) {
  const isOwnCard = dragPlayer === gameState.currentPlayer;

  cardSlots.forEach(slot => {
    const slotPlayer = slot.dataset.player;
    const slotCardId = slot.dataset.cardId;
    const slotValue = gameState.cards[slotPlayer][slotCardId];

    if (isOwnCard) {
      // 自分のカードをドラッグ：攻撃（相手の1以上）または譲渡（自分のもう一方）
      if (slotPlayer !== dragPlayer && slotValue > 0) {
        slot.style.borderColor = 'rgba(255, 59, 48, 0.4)';
      } else if (!gameState.customRules.disableTransfer && slotPlayer === dragPlayer && slotCardId !== cardId && value >= 1) {
        slot.style.borderColor = 'rgba(52, 199, 89, 0.4)';
      }
    } else {
      // 相手のカードをドラッグ：引き込み（自分の1以上）
      if (!gameState.customRules.disablePull && slotPlayer === gameState.currentPlayer && slotValue > 0) {
        slot.style.borderColor = 'rgba(255, 204, 0, 0.4)';
      }
    }
  });
}

// ハイライトを消去する
function clearHighlights() {
  cardSlots.forEach(slot => {
    slot.style.borderColor = '';
    slot.classList.remove('drop-target-attack', 'drop-target-transfer', 'drop-target-invalid', 'drop-target-pull');
  });
}

// カードの更新アニメーションを適用する

function handleChainExplosion() {
  if (!gameState.customRules.chainExplosion) return;

  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  let keepChecking = true;
  let chainCount = 0;

  while(keepChecking) {
    keepChecking = false;
    let newExplosions = 0;

    for (const player of ['p1', 'p2']) {
      for (const id of labels) {
        // もし値が0になっていて、まだ爆発済みリストになければ爆発！
        if (gameState.cards[player][id] === 0 && !gameState.explodedCards.has(`${player}-${id}`)) {
           gameState.explodedCards.add(`${player}-${id}`);
           newExplosions++;
           const name = player === 'p1' ? 'プレイヤー1' : 'プレイヤー2'; // 厳密にはCPU名とかあるけど簡易的に
           addLog(`💥 【連鎖爆発】${name}の${getHandName(id)}が0になり爆発！他のすべてのカードに ＋1`);
        }
      }
    }

    if (newExplosions > 0) {
      keepChecking = true;
      chainCount++;
      // すべての「生存している（> 0）」カードに ＋newExplosions する
      for (const player of ['p1', 'p2']) {
        for (const id of labels) {
          if (gameState.cards[player][id] > 0) {
             let newVal = gameState.cards[player][id] + newExplosions;
             gameState.cards[player][id] = calculateCardValue(newVal);
             triggerUpdateAnimation(player, id);
          }
        }
      }
      updateUI();
    }
  }
}

// 復活処理用（0から1以上になったら爆発フラグを消す）
function checkRevivals() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  for (const player of ['p1', 'p2']) {
    for (const id of labels) {
      if (gameState.cards[player][id] > 0) {
         gameState.explodedCards.delete(`${player}-${id}`);
      }
    }
  }
}

function triggerUpdateAnimation(player, cardId) {
  const slot = document.getElementById(`${player}-card-${cardId}`);
  if (slot) {
    slot.classList.remove('updated');
    void slot.offsetWidth; // リフローを発生させてアニメーションをリセット
    slot.classList.add('updated');
  }
}

// ==========================================
// ターン管理・勝敗判定
// ==========================================
function endTurn() {
  updateUI();

  // 勝敗チェック
  if (checkVictory()) {
    return;
  }

  // ターン交代
  gameState.currentPlayer = gameState.currentPlayer === 'p1' ? 'p2' : 'p1';

  // UI上のターン表示更新
  updateTurnIndicator();

  // CPUターン処理
  if (gameState.mode === 'cpu' && gameState.currentPlayer === 'p2') {
    disablePlayerDrag();
    setTimeout(executeCpuTurn, 1200); // 思考時間風のウェイト
  } else {
    enablePlayerDrag();
  }
}

// ドラッグの有効化/無効化
function enablePlayerDrag() {
  cardSlots.forEach(slot => {
    const player = slot.dataset.player;
    const cardId = slot.dataset.cardId;
    const value = gameState.cards[player][cardId];
    // 自分の1以上のカード、および相手の1以上のカードをドラッグ可能にする
    if (value > 0) {
      slot.setAttribute('draggable', 'true');
    } else {
      slot.setAttribute('draggable', 'false');
    }
  });
}

function disablePlayerDrag() {
  cardSlots.forEach(slot => {
    slot.setAttribute('draggable', 'false');
  });
}

// 勝敗判定
function checkVictory() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  let p1Zeros = 0;
  let p2Zeros = 0;
  
  labels.forEach(id => {
    if (gameState.cards.p1[id] === 0) p1Zeros++;
    if (gameState.cards.p2[id] === 0) p2Zeros++;
  });
  
  let p1Defeated = false;
  let p2Defeated = false;

  if (gameState.customRules.loseCount === 'leader') {
    p1Defeated = gameState.cards.p1['A'] === 0;
    p2Defeated = gameState.cards.p2['A'] === 0;
  } else {
    let requiredZeros = gameState.customRules.cardCount;
    if (gameState.customRules.loseCount !== 'all') {
      requiredZeros = parseInt(gameState.customRules.loseCount, 10);
      if (requiredZeros > gameState.customRules.cardCount) {
        requiredZeros = gameState.customRules.cardCount;
      }
    }
    p1Defeated = p1Zeros >= requiredZeros;
    p2Defeated = p2Zeros >= requiredZeros;
  }

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
    }

    winnerMessage.textContent = winnerText;
    
    // 勝利ログ
    addLog('システム', `ゲーム終了！ ${winnerText}`, 'system');
    
    setTimeout(() => {
      gameoverScreen.classList.add('active');
    }, 800);

    return true;
  }
  return false;
}

// UIの同期更新
function updateUI() {
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
      }

      if (val === 0) {
        slot.classList.add('extinguished');
      } else {
        slot.classList.remove('extinguished');
      }
    }
  }

  // ターンクラスの割り当て
  if (gameState.currentPlayer === 'p1') {
    p1Section.classList.add('active-turn');
    p2Section.classList.remove('active-turn');
  } else {
    p2Section.classList.add('active-turn');
    p1Section.classList.remove('active-turn');
  }
}

function updateTurnIndicator() {
  turnIndicator.classList.remove('turn-p1', 'turn-p2');
  if (gameState.currentPlayer === 'p1') {
    turnIndicator.textContent = 'プレイヤー1のターン';
    turnIndicator.classList.add('turn-p1');
  } else {
    const name = gameState.mode === 'cpu' ? 'CPU (AI)' : 'プレイヤー2';
    turnIndicator.textContent = `${name}のターン`;
    turnIndicator.classList.add('turn-p2');
  }
}

// プレイヤー名取得
function getPlayerName(playerId) {
  if (playerId === 'p1') return 'プレイヤー1';
  return gameState.mode === 'cpu' ? 'CPU (AI)' : 'プレイヤー2';
}

// ログの追加
function addLog(speaker, text, type) {
  const item = document.createElement('div');
  item.className = `log-item ${type}`;
  item.textContent = text;
  logList.appendChild(item);
  logList.scrollTop = logList.scrollHeight; // スクロールを一番下に
}

// ==========================================
// CPU (AI) の思考ロジック (Minimax / Alpha-Beta)
// ==========================================

// --- シミュレーション用純粋関数 ---

function cloneState(state) {
  return {
    cards: {
      p1: { ...state.cards.p1 },
      p2: { ...state.cards.p2 }
    },
    limits: {
      p1: { ...state.limits.p1 },
      p2: { ...state.limits.p2 }
    },
    currentPlayer: state.currentPlayer,
    customRules: state.customRules, // ルールは不変なので参照でOK
    // 勝敗状態は別途判定するため不要
  };
}

function simulateVictoryCheck(state) {
  let p1Zeros = 0;
  let p2Zeros = 0;
  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);

  if (state.customRules.loseCount === 'leader') {
    if (state.cards.p1['A'] === 0) p1Zeros = 999;
    if (state.cards.p2['A'] === 0) p2Zeros = 999;
  } else {
    labels.forEach(id => {
      if (state.cards.p1[id] === 0) p1Zeros++;
      if (state.cards.p2[id] === 0) p2Zeros++;
    });
  }

  let requiredZeros = state.customRules.cardCount;
  if (state.customRules.loseCount !== 'all' && state.customRules.loseCount !== 'leader') {
    requiredZeros = parseInt(state.customRules.loseCount, 10);
    if (requiredZeros > state.customRules.cardCount) requiredZeros = state.customRules.cardCount;
  }
  
  if (state.customRules.loseCount === 'leader') {
      requiredZeros = 999;
  }

  const p1Defeated = p1Zeros >= requiredZeros;
  const p2Defeated = p2Zeros >= requiredZeros;

  if (p1Defeated && p2Defeated) return 'draw';
  if (p1Defeated) return state.customRules.reverseWin ? 'p1' : 'p2';
  if (p2Defeated) return state.customRules.reverseWin ? 'p2' : 'p1';
  return null;
}

function simulateCalculateVal(state, val) {
  if (state.customRules.zeroWhenFiveOrMore && val >= state.customRules.maxValue) return 0;
  return val >= state.customRules.maxValue ? val - state.customRules.maxValue : val;
}

function simulateChainExplosion(state, explodedSet) {
  if (!state.customRules.chainExplosion) return;
  
  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  let hasNewExplosion = true;

  while (hasNewExplosion) {
    hasNewExplosion = false;
    const toExplode = [];

    ['p1', 'p2'].forEach(p => {
      labels.forEach(id => {
        if (state.cards[p][id] === 0 && !explodedSet.has(`${p}-${id}`)) {
          toExplode.push({ p, id });
        }
      });
    });

    if (toExplode.length > 0) {
      toExplode.forEach(c => {
        explodedSet.add(`${c.p}-${c.id}`);
        // 生きている全カードに+1
        ['p1', 'p2'].forEach(tp => {
          labels.forEach(tid => {
            if (state.cards[tp][tid] > 0) {
              state.cards[tp][tid] = simulateCalculateVal(state, state.cards[tp][tid] + 1);
            }
          });
        });
      });
      hasNewExplosion = true; // 新しい0が生まれたかもしれないので再ループ
    }
  }
}

function simulateMove(baseState, move) {
  const state = cloneState(baseState);
  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  const p = state.currentPlayer;
  const op = p === 'p1' ? 'p2' : 'p1';

  const explodedSet = new Set();
  // 初期状態ですでに0のものは爆発済みとしてセット
  ['p1', 'p2'].forEach(player => {
    labels.forEach(id => {
      if (state.cards[player][id] === 0) explodedSet.add(`${player}-${id}`);
    });
  });

  if (move.type === 'attack') {
    const sVal = state.cards[p][move.from];
    const tVal = state.cards[op][move.to];
    let newVal;
    if (state.customRules.multiplyAttack) {
      newVal = simulateCalculateVal(state, sVal * tVal);
    } else {
      newVal = simulateCalculateVal(state, sVal + tVal);
    }
    state.cards[op][move.to] = newVal;
  } 
  else if (move.type === 'transfer') {
    const sVal = state.cards[p][move.from];
    const tVal = Math.floor(sVal / 2);
    const remain = sVal - tVal;
    
    if (state.customRules.allowSelfAdd) {
       // self-add logic
       const curTVal = state.cards[p][move.to];
       state.cards[p][move.to] = simulateCalculateVal(state, sVal + curTVal);
       state.cards[p][move.from] = 0;
    } else {
       state.cards[p][move.to] = tVal;
       state.cards[p][move.from] = remain;
    }
    if (state.limits[p].transfer > 0) state.limits[p].transfer--;
  } 
  else if (move.type === 'pull') {
    const sVal = state.cards[op][move.from];
    const curVal = state.cards[p][move.to];
    state.cards[p][move.to] = simulateCalculateVal(state, curVal + sVal);
    if (state.limits[p].pull > 0) state.limits[p].pull--;
  } 
  else if (move.type === 'pass') {
    if (state.limits[p].pass > 0) state.limits[p].pass--;
  }

  // 爆発処理
  simulateChainExplosion(state, explodedSet);
  
  // ターン交代
  state.currentPlayer = op;

  return state;
}

function generateLegalMoves(state) {
  const p = state.currentPlayer;
  const op = p === 'p1' ? 'p2' : 'p1';
  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  const moves = [];

  labels.forEach(fromId => {
    const sVal = state.cards[p][fromId];
    if (sVal === 0) return;

    // Attack
    labels.forEach(toId => {
      if (state.cards[op][toId] !== 0) {
        moves.push({ type: 'attack', from: fromId, to: toId });
      }
    });

    // Transfer
    if (state.limits[p].transfer !== 0 && sVal >= 1) {
      labels.forEach(toId => {
        if (fromId !== toId) {
          const tVal = state.cards[p][toId];
          if (tVal === 0) {
            moves.push({ type: 'transfer', from: fromId, to: toId }); // 復活譲渡
          } else if (sVal >= 2 && !state.customRules.allowSelfAdd) {
            moves.push({ type: 'transfer', from: fromId, to: toId }); // 分配
          } else if (state.customRules.allowSelfAdd) {
            moves.push({ type: 'transfer', from: fromId, to: toId }); // 自己加算
          }
        }
      });
    }

    // Pull
    if (state.limits[p].pull !== 0) {
      labels.forEach(oppId => {
        if (state.cards[op][oppId] !== 0) {
           moves.push({ type: 'pull', from: oppId, to: fromId });
        }
      });
    }
  });

  // Pass
  if (state.limits[p].pass !== 0) {
    moves.push({ type: 'pass' });
  }
  
  return moves;
}

// 評価関数: 正の数ならp2有利、負の数ならp1有利
function evaluateBoard(state) {
  const winner = simulateVictoryCheck(state);
  if (winner === 'p2') return 10000;
  if (winner === 'p1') return -10000;
  if (winner === 'draw') return 0;

  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  let p1Score = 0;
  let p2Score = 0;

  // 生存カード数や、リーダーの生存状態による加点
  labels.forEach(id => {
    const p1v = state.cards.p1[id];
    const p2v = state.cards.p2[id];
    
    if (p1v > 0) p1Score += 50;
    if (p2v > 0) p2Score += 50;
    
    // リーダールールの場合、リーダーへの圧力を評価
    if (state.customRules.loseCount === 'leader' && id === 'A') {
       if (p1v > 0) p1Score += 200;
       if (p2v > 0) p2Score += 200;
    }
    
    // 1は防御力が高いので少しボーナス
    if (p1v === 1) p1Score += 10;
    if (p2v === 1) p2Score += 10;
  });

  return p2Score - p1Score;
}

function minimax(state, depth, alpha, beta, isMaximizing) {
  const winner = simulateVictoryCheck(state);
  if (winner !== null || depth === 0) {
    return evaluateBoard(state);
  }

  const moves = generateLegalMoves(state);
  if (moves.length === 0) {
    return evaluateBoard(state);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = simulateMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = simulateMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function executeCpuTurn() {
  if (gameState.isGameOver) return;
  
  // 探索深さの決定
  let maxDepth = 4;
  if (gameState.customRules.cpuDifficulty === 'normal') {
    maxDepth = 1; // 普通は1手先のみ
  } else {
    // 強い場合は数手先を読むが、カード数が多いと重くなるので調整
    if (gameState.customRules.cardCount >= 3) maxDepth = 3;
    if (gameState.customRules.chainExplosion && gameState.customRules.cardCount >= 3) maxDepth = 3;
  }

  const moves = generateLegalMoves(gameState);
  
  if (moves.length === 0) {
    endTurn();
    return;
  }

  // 1手先を実際にシミュレートして、その後のMinimaxスコアを求める
  let bestScore = -Infinity;
  let bestMoves = [];

  for (const move of moves) {
    const nextState = simulateMove(gameState, move);
    // CPU(p2)はmaximizingPlayer。次のターンはp1なのでfalse
    const score = minimax(nextState, maxDepth - 1, -Infinity, Infinity, false);
    
    // 少しだけランダム性を入れて同じ手ばかり打たないようにする（スコアに微小な乱数を足す）
    const randomizedScore = score + (Math.random() * 2 - 1);

    if (randomizedScore > bestScore) {
      bestScore = randomizedScore;
      bestMoves = [move];
    } else if (Math.abs(randomizedScore - bestScore) < 0.1) {
      bestMoves.push(move);
    }
  }

  const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  // アクションの実行
  if (chosenMove.type === 'attack') {
    visualizeCpuAction('p2', chosenMove.from, 'p1', chosenMove.to);
    setTimeout(() => {
      executeAttack('p2', 'p1', chosenMove.from, chosenMove.to);
      endTurn();
    }, 400);
  } else if (chosenMove.type === 'transfer') {
    visualizeCpuAction('p2', chosenMove.from, 'p2', chosenMove.to);
    setTimeout(() => {
      executeTransfer('p2', chosenMove.from, chosenMove.to);
      endTurn();
    }, 400);
  } else if (chosenMove.type === 'pull') {
    visualizeCpuAction('p1', chosenMove.from, 'p2', chosenMove.to);
    setTimeout(() => {
      executePull('p2', 'p1', chosenMove.to, chosenMove.from);
      endTurn();
    }, 400);
  } else if (chosenMove.type === 'pass') {
    setTimeout(() => {
      executePass('p2');
    }, 400);
  }
}

// CPUのドラッグ操作を視覚的に表現するエフェクト
function visualizeCpuAction(fromPlayer, fromCardId, toPlayer, toCardId) {
  const fromSlot = document.getElementById(`${fromPlayer}-card-${fromCardId}`);
  const toSlot = document.getElementById(`${toPlayer}-card-${toCardId}`);
  
  if (fromSlot && toSlot) {
    fromSlot.classList.add('dragging');
    
    setTimeout(() => {
      fromSlot.classList.remove('dragging');
      if (fromPlayer !== toPlayer) {
        if (fromPlayer === 'p1' && toPlayer === 'p2') {
          toSlot.classList.add('drop-target-pull');
        } else {
          toSlot.classList.add('drop-target-attack');
        }
      } else {
        toSlot.classList.add('drop-target-transfer');
      }
      
      setTimeout(() => {
        toSlot.classList.remove('drop-target-attack', 'drop-target-transfer', 'drop-target-pull');
      }, 300);
    }, 300);
  }
}

// ==========================================
// 起動
// ==========================================
window.onload = init;
