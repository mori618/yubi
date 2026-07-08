// ==========================================
// ゲーム状態管理 (State)
// ==========================================
const gameState = {
  mode: null,          // 'local' または 'cpu'
  campaignStage: null, // 現在プレイ中のステージ番号
  currentPlayer: 'p1', // 'p1' または 'p2'
  playerTurnCount: { p1: 0, p2: 0 },
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
    chainExplosion: false,
    attackHandRestriction: 'none',
    pullTargetRestriction: 'none',
    winValues: [],
    loseValues: [0]
  }
};

// --- 値判定ヘルパー ---
function parseValues(str) {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
}

function isLoseValue(state, val) {
  return state.customRules.loseValues.includes(val);
}

function isWinValue(state, val) {
  return state.customRules.winValues.includes(val);
}

function isAlive(state, val) {
  return !isLoseValue(state, val);
}

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

// 追加：ステージ攻略モード関連のUI要素
const btnCampaign = document.getElementById('btn-campaign');
const stageSelectScreen = document.getElementById('stage-select-screen');
const stageGrid = document.getElementById('stage-grid');
const btnBackToTitle = document.getElementById('btn-back-to-title');
const stageInfoBar = document.getElementById('stage-info-bar');
const stageTitleEl = document.getElementById('stage-title');
const stageDescEl = document.getElementById('stage-desc');
const btnNextStage = document.getElementById('btn-next-stage');
const btnBackToSelect = document.getElementById('btn-back-to-select');


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
const btnRandomizeRules = document.getElementById('btn-randomize-rules');
const ruleInitMin = document.getElementById('rule-initial-value-min');
const ruleInitMax = document.getElementById('rule-initial-value-max');
const ruleMaxValue = document.getElementById('rule-max-value');
const ruleCardCount = document.getElementById('rule-card-count');
const ruleLoseCount = document.getElementById('rule-lose-count');
const ruleZeroOnFive = document.getElementById('rule-zero-on-five');
const rulePullLimit = document.getElementById('rule-pull-limit');
const ruleTransferLimit = document.getElementById('rule-transfer-limit');
const rulePassLimit = document.getElementById('rule-pass-limit');
const ruleAttackHandRestriction = document.getElementById('rule-attack-hand-restriction');
const rulePullTargetRestriction = document.getElementById('rule-pull-target-restriction');
const ruleWinValues = document.getElementById('rule-win-values');
const ruleLoseValues = document.getElementById('rule-lose-values');

btnRandomizeRules.addEventListener('click', randomizeRules);

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomizeRules() {
  ruleCpuDifficulty.value = getRandomItem(['strong', 'normal']);
  
  const minVal = getRandomItem([1, 2, 3, 4]);
  ruleInitMin.value = minVal;
  
  // maxValはminVal以上
  const validMaxVals = [1, 2, 3, 4].filter(v => v >= minVal);
  ruleInitMax.value = getRandomItem(validMaxVals);
  
  ruleMaxValue.value = Math.floor(Math.random() * (12 - 4 + 1)) + 4; // 4〜12
  
  ruleCardCount.value = getRandomItem([2, 3, 4]);
  
  // 敗北条件はカード数に応じて
  const cCount = parseInt(ruleCardCount.value, 10);
  const loseOptions = ['all', '1', 'leader'];
  if (cCount >= 2) loseOptions.push('2');
  if (cCount >= 3) loseOptions.push('3');
  ruleLoseCount.value = getRandomItem(loseOptions);
  
  rulePullLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  ruleTransferLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  rulePassLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  
  ruleZeroOnFive.checked = Math.random() < 0.5;
  ruleAllowSelfAdd.checked = Math.random() < 0.5;
  ruleBlindMode.checked = Math.random() < 0.5;
  ruleReverseWin.checked = Math.random() < 0.5;
  ruleMultiplyAttack.checked = Math.random() < 0.5;
  ruleChainExplosion.checked = Math.random() < 0.5;
  ruleAttackHandRestriction.value = getRandomItem(['none', 'min', 'max', 'alternate']);
  rulePullTargetRestriction.value = getRandomItem(['none', 'min', 'max', 'alternate']);
  
  if (Math.random() < 0.3) {
    ruleWinValues.value = getRandomItem(['', '5', '10', '5, 10']);
  } else {
    ruleWinValues.value = '';
  }
  
  if (Math.random() < 0.3) {
    ruleLoseValues.value = getRandomItem(['0', '0, 5', '0, 10']);
  } else {
    ruleLoseValues.value = '0';
  }
  
  // 視覚的フィードバック（チカッと光る）
  const panel = document.querySelector('.settings-panel');
  panel.style.transition = 'background-color 0.3s';
  panel.style.backgroundColor = '#f1c40f';
  setTimeout(() => {
    panel.style.backgroundColor = '#f9f9f9';
  }, 300);
}

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
  btnCampaign.addEventListener('click', showStageSelectScreen);
  btnBackToTitle.addEventListener('click', () => {
    stageSelectScreen.classList.remove('active');
    stageSelectScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.add('active');
  });
  btnNextStage.addEventListener('click', () => {
    if (gameState.campaignStage && gameState.campaignStage < CAMPAIGN_STAGES.length) {
      startCampaignStage(gameState.campaignStage + 1);
    } else {
      showStageSelectScreen();
    }
  });
  btnBackToSelect.addEventListener('click', showStageSelectScreen);

  btnLocal.addEventListener('click', () => { gameState.campaignStage = null; stageInfoBar.classList.add('hidden'); startGame('local'); });
  btnCpu.addEventListener('click', () => { gameState.campaignStage = null; stageInfoBar.classList.add('hidden'); startGame('cpu'); });

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
  if (gameState.campaignStage === null) {
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
  gameState.customRules.attackHandRestriction = ruleAttackHandRestriction.value;
  gameState.customRules.pullTargetRestriction = rulePullTargetRestriction.value;
  gameState.customRules.winValues = parseValues(ruleWinValues.value);
  gameState.customRules.loseValues = parseValues(ruleLoseValues.value);
  if (gameState.customRules.loseValues.length === 0) {
    gameState.customRules.loseValues = [0]; // 最低限0は含めるか、空でも良いが基本ルールとして0をデフォルトにする
  }

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
  gameState.playerTurnCount = { p1: 0, p2: 0 };
  
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

// 動かせる自分の手か判定
function isCardMovable(state, player, cardId) {
  if (state.customRules.attackHandRestriction === 'none') return true;

  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  let minVal = Infinity;
  let maxVal = -1;

  labels.forEach(id => {
    const val = state.cards[player][id];
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  });

  const val = state.cards[player][cardId];

  let rule = state.customRules.attackHandRestriction;
  if (rule === 'alternate') {
    rule = (state.playerTurnCount[player] % 2 === 0) ? 'min' : 'max';
  }

  if (rule === 'min') {
    return val === minVal;
  } else if (rule === 'max') {
    return val === maxVal;
  }
  return true;
}

// 引き込み可能な相手の手か判定
function isPullTargetValid(state, targetPlayer, targetCardId) {
  if (state.customRules.pullTargetRestriction === 'none') return true;

  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);
  let minVal = Infinity;
  let maxVal = -1;

  labels.forEach(id => {
    const val = state.cards[targetPlayer][id];
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  });

  const val = state.cards[targetPlayer][targetCardId];

  let rule = state.customRules.pullTargetRestriction;
  if (rule === 'alternate') {
    rule = (state.playerTurnCount[state.currentPlayer] % 2 === 0) ? 'min' : 'max';
  }

  if (rule === 'min') {
    return val === minVal;
  } else if (rule === 'max') {
    return val === maxVal;
  }
  return true;
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

      // 値に関係なくドラッグ可能（自分のカードも相手のカードも可）
      if (player === gameState.currentPlayer && !isCardMovable(gameState, player, cardId)) {
        e.preventDefault();
        return;
      }
      if (player !== gameState.currentPlayer && !isPullTargetValid(gameState, player, cardId)) {
        e.preventDefault();
        return;
      }

      gameState.draggedCard = { player, cardId, value };
      slot.classList.add('dragging');
      
      // ドロップ先のターゲット候補をハイライトするためのガイダンス表示
      highlightValidTargets(player, cardId, value);
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
        if (targetPlayer !== dragSource.player) {
          slot.classList.add('drop-target-attack');
        } else if (targetPlayer === dragSource.player && targetCardId !== dragSource.cardId) {
          if (!gameState.customRules.disableTransfer) {
            slot.classList.add('drop-target-transfer');
          } else {
            slot.classList.add('drop-target-invalid');
          }
        }
      } else {
        // 相手のカードをドラッグ：引き込み加算
        if (targetPlayer === gameState.currentPlayer) {
          if (!gameState.customRules.disablePull && isCardMovable(gameState, targetPlayer, targetCardId)) {
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
        // 攻撃：相手のすべてのカードに対してドロップを許可
        if (targetPlayer !== dragSource.player) {
          e.preventDefault();
        }
        // 譲渡：自分のすべてのカードから、もう一方のカードに対してドロップを許可
        else if (!gameState.customRules.disableTransfer && targetPlayer === dragSource.player && targetCardId !== dragSource.cardId) {
          e.preventDefault();
        }
      } else {
        // 引き込み：相手のカードを自分のすべてのカードにドロップするのを許可
        if (!gameState.customRules.disablePull && targetPlayer === gameState.currentPlayer && isCardMovable(gameState, targetPlayer, targetCardId)) {
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
        if (!gameState.customRules.disablePull && targetPlayer === gameState.currentPlayer && currentTargetValue > 0 && isCardMovable(gameState, targetPlayer, targetCardId)) {
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
      // 自分のカードをドラッグ：攻撃（相手のカード）または譲渡（自分のもう一方）
      if (slotPlayer !== dragPlayer) {
        slot.style.borderColor = 'rgba(255, 59, 48, 0.4)';
      } else if (!gameState.customRules.disableTransfer && slotPlayer === dragPlayer && slotCardId !== cardId) {
        slot.style.borderColor = 'rgba(52, 199, 89, 0.4)';
      }
    } else {
      // 相手のカードをドラッグ：引き込み（自分のカード）
      if (!gameState.customRules.disablePull && slotPlayer === gameState.currentPlayer && isCardMovable(gameState, slotPlayer, slotCardId)) {
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
        // 負け数字(0など)になっていて、まだ爆発済みリストになければ爆発
        if (isLoseValue(gameState, gameState.cards[player][id]) && !gameState.explodedCards.has(`${player}-${id}`)) {
           gameState.explodedCards.add(`${player}-${id}`);
           newExplosions++;
           const name = player === 'p1' ? 'プレイヤー1' : 'プレイヤー2';
           addLog(`💥 【連鎖爆発】${name}の${getHandName(id)}が消滅し爆発！他のすべての生存カードに ＋1`);
        }
      }
    }

    if (newExplosions > 0) {
      keepChecking = true;
      chainCount++;
      // すべての「生存している」カードに ＋newExplosions する
      for (const player of ['p1', 'p2']) {
        for (const id of labels) {
          if (isAlive(gameState, gameState.cards[player][id])) {
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

// 復活処理用（生存状態になったら爆発フラグを消す）
function checkRevivals() {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  for (const player of ['p1', 'p2']) {
    for (const id of labels) {
      if (isAlive(gameState, gameState.cards[player][id])) {
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
  gameState.playerTurnCount[gameState.currentPlayer]++;
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
    // 自分のカード、および相手のカードをドラッグ可能にする
    if (player === gameState.currentPlayer) {
      if (isCardMovable(gameState, player, cardId)) {
        slot.setAttribute('draggable', 'true');
      } else {
        slot.setAttribute('draggable', 'false');
      }
    } else {
      if (!gameState.customRules.disablePull && isPullTargetValid(gameState, player, cardId)) {
        slot.setAttribute('draggable', 'true');
      } else {
        slot.setAttribute('draggable', 'false');
      }
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
    if (isLoseValue(gameState, gameState.cards.p1[id])) p1Zeros++;
    if (isLoseValue(gameState, gameState.cards.p2[id])) p2Zeros++;
  });
  
  let p1Defeated = false;
  let p2Defeated = false;

  if (gameState.customRules.loseCount === 'leader') {
    p1Defeated = isLoseValue(gameState, gameState.cards.p1['A']);
    p2Defeated = isLoseValue(gameState, gameState.cards.p2['A']);
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

  let p1WonBySpecial = false;
  let p2WonBySpecial = false;

  if (gameState.customRules.winValues.length > 0) {
    p1WonBySpecial = true;
    p2WonBySpecial = true;
    for (let id of labels) {
      if (!isWinValue(gameState, gameState.cards.p1[id])) p1WonBySpecial = false;
      if (!isWinValue(gameState, gameState.cards.p2[id])) p2WonBySpecial = false;
    }
  }

  if (p1Defeated || p2Defeated || p1WonBySpecial || p2WonBySpecial) {
    gameState.isGameOver = true;
    let winnerText = '';

    if ((p1Defeated && p2Defeated) || (p1WonBySpecial && p2WonBySpecial)) {
      winnerText = '引き分け！';
    } else if (p1WonBySpecial || p2Defeated) {
      if (gameState.customRules.reverseWin && p2Defeated) {
        winnerText = gameState.mode === 'cpu' ? 'CPU (AI) の勝利！' : 'プレイヤー2の勝利！';
      } else {
        winnerText = 'プレイヤー1の勝利！';
      }
    } else if (p2WonBySpecial || p1Defeated) {
      if (gameState.customRules.reverseWin && p1Defeated) {
        winnerText = 'プレイヤー1の勝利！';
      } else {
        winnerText = gameState.mode === 'cpu' ? 'CPU (AI) の勝利！' : 'プレイヤー2の勝利！';
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

      if (isLoseValue(gameState, val)) {
        slot.classList.add('extinguished');
      } else {
        slot.classList.remove('extinguished');
      }

      slot.classList.remove('special-win', 'special-lose');
      if (isWinValue(gameState, val)) {
        slot.classList.add('special-win');
      }
      if (isLoseValue(gameState, val)) {
        slot.classList.add('special-lose');
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
    playerTurnCount: { ...state.playerTurnCount },
    customRules: state.customRules, // ルールは不変なので参照でOK
    // 勝敗状態は別途判定するため不要
  };
}

function simulateVictoryCheck(state) {
  let p1Zeros = 0;
  let p2Zeros = 0;
  const labels = ['A', 'B', 'C', 'D'].slice(0, state.customRules.cardCount);

  if (state.customRules.loseCount === 'leader') {
    if (isLoseValue(state, state.cards.p1['A'])) p1Zeros = 999;
    if (isLoseValue(state, state.cards.p2['A'])) p2Zeros = 999;
  } else {
    labels.forEach(id => {
      if (isLoseValue(state, state.cards.p1[id])) p1Zeros++;
      if (isLoseValue(state, state.cards.p2[id])) p2Zeros++;
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

  let p1Defeated = p1Zeros >= requiredZeros;
  let p2Defeated = p2Zeros >= requiredZeros;

  let p1WonBySpecial = false;
  let p2WonBySpecial = false;

  if (state.customRules.loseValue !== 'none') {
    const loseVal = parseInt(state.customRules.loseValue, 10);
    if (checkAllCardsMatch(state, 'p1', loseVal)) p1Defeated = true;
    if (checkAllCardsMatch(state, 'p2', loseVal)) p2Defeated = true;
  }

  if (state.customRules.winValues.length > 0) {
    p1WonBySpecial = true;
    p2WonBySpecial = true;
    for (let id of labels) {
      if (!isWinValue(state, state.cards.p1[id])) p1WonBySpecial = false;
      if (!isWinValue(state, state.cards.p2[id])) p2WonBySpecial = false;
    }
  }

  if ((p1Defeated && p2Defeated) || (p1WonBySpecial && p2WonBySpecial)) return 'draw';
  
  if (p1WonBySpecial || p2Defeated) return state.customRules.reverseWin && p2Defeated ? 'p2' : 'p1';
  if (p2WonBySpecial || p1Defeated) return state.customRules.reverseWin && p1Defeated ? 'p1' : 'p2';

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
        if (isLoseValue(state, state.cards[p][id]) && !explodedSet.has(`${p}-${id}`)) {
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
            if (isAlive(state, state.cards[tp][tid])) {
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
  // 初期状態ですでに消滅状態のものは爆発済みとしてセット
  ['p1', 'p2'].forEach(player => {
    labels.forEach(id => {
      if (isLoseValue(state, state.cards[player][id])) explodedSet.add(`${player}-${id}`);
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
  
  // ターン交代の前にカウントアップ
  state.playerTurnCount[p]++;

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
    
    if (!isCardMovable(state, p, fromId)) return;

    // Attack
    labels.forEach(toId => {
      moves.push({ type: 'attack', from: fromId, to: toId });
    });

    // Transfer
    if (state.limits[p].transfer !== 0) {
      labels.forEach(toId => {
        if (fromId !== toId) {
          const tVal = state.cards[p][toId];
          if (isLoseValue(state, tVal)) {
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
         if (isPullTargetValid(state, op, oppId)) {
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
    
    if (isAlive(state, p1v)) p1Score += 50;
    if (isAlive(state, p2v)) p2Score += 50;
    
    // リーダールールの場合、リーダーへの圧力を評価
    if (state.customRules.loseCount === 'leader' && id === 'A') {
       if (isAlive(state, p1v)) p1Score += 200;
       if (isAlive(state, p2v)) p2Score += 200;
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



// ==========================================
// ステージ攻略モードのマスターデータとロジック
// ==========================================
const CAMPAIGN_STAGES = [
  // 第1エリア: 基礎訓練
  { title: "Stage 1: 基本のキ", desc: "相手の手を5以上にして消そう。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 1 } },
  { title: "Stage 2: 移動の極意", desc: "自分の手から手へ数値を移動して調整しよう。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 1, transferLimit: -1 } },
  { title: "Stage 3: あふれる力", desc: "5以上になると「5を引いた余り」になるぞ。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 1, zeroWhenFiveOrMore: true } },
  { title: "Stage 4: 奪取の技", desc: "相手の手の数値を自分に引き込めるぞ。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 1, pullLimit: -1 } },
  { title: "Stage 5: 三つ巴", desc: "お互いに手が3本に増加！", rules: { cardCount: 3, maxValue: 5, initialValueMin: 1, initialValueMax: 1 } },
  // 第2エリア: 変則数値
  { title: "Stage 6: ギリギリの戦い", desc: "お互い初期値が4の状態でスタート。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 4, initialValueMax: 4 } },
  { title: "Stage 7: デス・ナンバー", desc: "「3」を作ってしまったらその手は消滅する！", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 2, loseValues: [3], zeroWhenFiveOrMore: true } },
  { title: "Stage 8: イレブン", desc: "上限が11に拡張。長期戦を制覇しろ。", rules: { cardCount: 2, maxValue: 11, initialValueMin: 1, initialValueMax: 1 } },
  { title: "Stage 9: ダブル・ゼロ", desc: "5以上の超過は「0」になり即消滅！", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 2, zeroWhenFiveOrMore: true, loseValues: [0] } },
  { title: "Stage 10: パスゲーム", desc: "パスが3回まで使える。どう押し付けるか？", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 2, passLimit: 3 } },
  // 第3エリア: 特殊ルール
  { title: "Stage 11: 王将戦", desc: "左手が消滅した時点で負けになる！", rules: { cardCount: 3, maxValue: 5, initialValueMin: 1, initialValueMax: 1, loseCount: 'leader' } },
  { title: "Stage 12: 暗闇の戦い", desc: "相手の手が見えない。推測して戦え。", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 2, blindMode: true, transferLimit: -1 } },
  { title: "Stage 13: インフレーション", desc: "攻撃が掛け算に！一気に上限突破を狙え。", rules: { cardCount: 2, maxValue: 10, initialValueMin: 1, initialValueMax: 2, multiplyAttack: true } },
  { title: "Stage 14: 逆転の世界", desc: "「自分が全滅したら勝ち」のデスゲーム！", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 1, reverseWin: true } },
  { title: "Stage 15: 連鎖の恐怖", desc: "手が消滅すると他の手にもダメージが飛ぶ！", rules: { cardCount: 3, maxValue: 5, initialValueMin: 1, initialValueMax: 2, chainExplosion: true } },
  // 第4エリア: 複合と極限
  { title: "Stage 16: 見えない王将", desc: "王将戦 ＋ ブラインドモード！", rules: { cardCount: 3, maxValue: 5, initialValueMin: 1, initialValueMax: 1, loseCount: 'leader', blindMode: true } },
  { title: "Stage 17: デス・スパイラル", desc: "連鎖爆発 ＋ 0戻り ＋ 掛け算！", rules: { cardCount: 2, maxValue: 10, initialValueMin: 1, initialValueMax: 2, chainExplosion: true, zeroWhenFiveOrMore: true, multiplyAttack: true } },
  { title: "Stage 18: 四面楚歌", desc: "手4本、2と3を作ったら負け！", rules: { cardCount: 4, maxValue: 5, initialValueMin: 1, initialValueMax: 1, loseValues: [2, 3] } },
  { title: "Stage 19: 究極の矛と盾", desc: "吸収無制限 ＋ 自分が全滅したら勝ち", rules: { cardCount: 2, maxValue: 5, initialValueMin: 1, initialValueMax: 2, pullLimit: -1, reverseWin: true } },
  { title: "Stage 20: 真の最終試練", desc: "今まで学んだ全てを駆使しろ！", rules: { cardCount: 4, maxValue: 5, initialValueMin: 1, initialValueMax: 2, transferLimit: -1, pullLimit: -1, chainExplosion: true, cpuDifficulty: 'strong' } }
];

function getUnlockedStage() {
  return parseInt(localStorage.getItem('numberCrush_unlockedStage') || '1', 10);
}

function saveUnlockedStage(stage) {
  const current = getUnlockedStage();
  if (stage > current) {
    localStorage.setItem('numberCrush_unlockedStage', stage.toString());
  }
}

function showStageSelectScreen() {
  setupScreen.classList.remove('active');
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('active');
  gameScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  stageSelectScreen.classList.remove('hidden');
  stageSelectScreen.classList.add('active');

  renderStageGrid();
}

function renderStageGrid() {
  stageGrid.innerHTML = '';
  const unlocked = getUnlockedStage();

  CAMPAIGN_STAGES.forEach((stage, index) => {
    const stageNum = index + 1;
    const btn = document.createElement('div');
    btn.className = 'btn-stage';
    
    if (stageNum < unlocked) {
      btn.classList.add('cleared');
      btn.innerHTML = `<span class="stage-num">${stageNum}</span>`;
      btn.onclick = () => startCampaignStage(stageNum);
    } else if (stageNum === unlocked) {
      btn.classList.add('current');
      btn.innerHTML = `<span class="stage-num">${stageNum}</span>`;
      btn.onclick = () => startCampaignStage(stageNum);
    } else {
      btn.classList.add('locked');
      btn.innerHTML = `<span class="stage-num">🔒</span>`;
    }
    
    btn.title = stage.title + "\n" + stage.desc;
    stageGrid.appendChild(btn);
  });
}

function startCampaignStage(stageNum) {
  const stageData = CAMPAIGN_STAGES[stageNum - 1];
  gameState.campaignStage = stageNum;
  
  // デフォルトルールをベースにステージ固有ルールで上書き
  const defaultRules = {
    cpuDifficulty: stageNum <= 5 ? 'normal' : 'strong', // 序盤は少し弱め
    initialValueMin: 1,
    initialValueMax: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    pullLimit: 0, // ステージ攻略では明記がない限り移動と吸収は最初は0（無効）とする
    transferLimit: 0,
    passLimit: 0,
    allowSelfAdd: false,
    blindMode: false,
    reverseWin: false,
    multiplyAttack: false,
    chainExplosion: false,
    attackHandRestriction: 'none',
    pullTargetRestriction: 'none',
    winValues: [],
    loseValues: [0]
  };

  gameState.customRules = { ...defaultRules, ...stageData.rules };

  // 画面遷移
  stageSelectScreen.classList.remove('active');
  stageSelectScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');

  // ヘッダー情報表示
  stageTitleEl.textContent = stageData.title;
  stageDescEl.textContent = stageData.desc;
  stageInfoBar.classList.remove('hidden');

  startGame('cpu');
}
