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
  draggedCard: null    // ドラッグ中のカード情報 { player, cardId, value }
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

// 全カードスロットの取得
const cardSlots = document.querySelectorAll('.card-slot');

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

  setupDragAndDrop();
}

// ゲーム開始
function startGame(mode) {
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
  gameState.cards.p1.A = 1;
  gameState.cards.p1.B = 1;
  gameState.cards.p2.A = 1;
  gameState.cards.p2.B = 1;
  gameState.isGameOver = false;
  gameState.draggedCard = null;

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

// 5以上になったら5を引く、5未満ならそのままの数値を返す関数
function calculateCardValue(totalValue) {
  if (totalValue >= 5) {
    return totalValue - 5;
  }
  return totalValue;
}

// 攻撃処理のロジック
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
    `${attackerName}が${attackerCardId === 'A' ? '左手' : '右手'}(指${attackerVal}本)で、${targetName}の${targetCardId === 'A' ? '左手' : '右手'}(指${targetVal}本)を攻撃！結果: → ${nextTargetVal}本`,
    attackerPlayerId
  );

  triggerUpdateAnimation(targetPlayerId, targetCardId);
}

// 譲渡処理のロジック
function executeTransfer(playerId, sourceCardId, targetCardId) {
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
  let newTargetVal = calculateCardValue(targetVal + transferAmount);

  // 状態の更新
  gameState.cards[playerId][sourceCardId] = newSourceVal;
  gameState.cards[playerId][targetCardId] = newTargetVal;

  const playerName = getPlayerName(playerId);
  addLog(
    playerId,
    `${playerName}が${sourceCardId === 'A' ? '左手' : '右手'}(指${sourceVal}本)から${targetCardId === 'A' ? '左手' : '右手'}(指${targetVal}本)へ指を譲渡。結果: 送り側→ ${newSourceVal}本, 受け取り側→ ${newTargetVal}本`,
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
    `${pullerName}が相手の${targetCardId === 'A' ? '左手' : '右手'}(指${targetVal}本)を自分の${pullerCardId === 'A' ? '左手' : '右手'}(指${pullerVal}本)に引き込んで加算！結果: 自分の手→ ${nextPullerVal}本 (相手は変化なし)`,
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
          if (dragSource.value >= 1) {
            slot.classList.add('drop-target-transfer');
          } else {
            slot.classList.add('drop-target-invalid');
          }
        }
      } else {
        // 相手のカードをドラッグ：引き込み加算
        if (targetPlayer === gameState.currentPlayer) {
          if (targetValue > 0) {
            slot.classList.add('drop-target-pull');
          } else {
            slot.classList.add('drop-target-invalid'); // 0へは引き込めない
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
        else if (targetPlayer === dragSource.player && targetCardId !== dragSource.cardId && dragSource.value >= 1) {
          e.preventDefault();
        }
      } else {
        // 引き込み：相手のカードを自分の1以上のカードにドロップするのを許可
        if (targetPlayer === gameState.currentPlayer && targetValue > 0) {
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
          actionExecuted = executeTransfer(dragSource.player, dragSource.cardId, targetCardId);
        }
      } else {
        // 引き込みの実行（相手のカードを自分のカードへドロップ）
        const currentTargetValue = gameState.cards[targetPlayer][targetCardId];
        if (targetPlayer === gameState.currentPlayer && currentTargetValue > 0) {
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
      } else if (slotPlayer === dragPlayer && slotCardId !== cardId && value >= 1) {
        slot.style.borderColor = 'rgba(52, 199, 89, 0.4)';
      }
    } else {
      // 相手のカードをドラッグ：引き込み（自分の1以上）
      if (slotPlayer === gameState.currentPlayer && slotValue > 0) {
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
  for (const player of ['p1', 'p2']) {
    for (const cardId of ['A', 'B']) {
      const val = gameState.cards[player][cardId];
      const slot = document.getElementById(`${player}-card-${cardId}`);
      const valElement = slot.querySelector('.card-value');

      valElement.textContent = val;

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
// CPU (AI) の思考ロジック
// ==========================================
function executeCpuTurn() {
  if (gameState.isGameOver) return;

  const cpuCards = gameState.cards.p2;
  const playerCards = gameState.cards.p1;
  const validMoves = [];

  // 可能なすべての手をリストアップする
  // 1. 攻撃の手
  for (const cpuCardId of ['A', 'B']) {
    const cpuVal = cpuCards[cpuCardId];
    if (cpuVal === 0) continue; // 消滅カードからは攻撃不可

    for (const playerCardId of ['A', 'B']) {
      const playerVal = playerCards[playerCardId];
      if (playerVal === 0) continue; // 消滅カードへは攻撃不可

      // 攻撃シミュレーション
      const nextPlayerVal = calculateCardValue(cpuVal + playerVal);
      
      validMoves.push({
        type: 'attack',
        from: cpuCardId,
        to: playerCardId,
        score: evaluateAttackResult(playerCardId, playerVal, nextPlayerVal)
      });
    }
  }

  // 2. 譲渡の手
  for (const sourceCardId of ['A', 'B']) {
    const sourceVal = cpuCards[sourceCardId];
    if (sourceVal < 1) continue; // 1以上なら譲渡可能

    const targetCardId = sourceCardId === 'A' ? 'B' : 'A';
    const targetVal = cpuCards[targetCardId];

    let transferAmount = 0;
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

  // 3. 引き込みの手
  for (const cpuCardId of ['A', 'B']) {
    const cpuVal = cpuCards[cpuCardId];
    if (cpuVal === 0) continue; // 消滅カードへは引き込めない

    for (const playerCardId of ['A', 'B']) {
      const playerVal = playerCards[playerCardId];
      if (playerVal === 0) continue; // 消滅カードからは引き込めない

      // 引き込みシミュレーション
      const nextCpuVal = calculateCardValue(cpuVal + playerVal);

      validMoves.push({
        type: 'pull',
        from: playerCardId,
        to: cpuCardId,
        score: evaluatePullResult(cpuCardId, cpuVal, nextCpuVal)
      });
    }
  }

  if (validMoves.length === 0) {
    // 打つ手がない場合（基本的には全滅チェックで弾かれるが、安全策）
    endTurn();
    return;
  }

  // スコア順にソート（降順）
  validMoves.sort((a, b) => b.score - a.score);

  // 同率一位の手がある場合はランダムに選ぶ
  const topScore = validMoves[0].score;
  const bestMoves = validMoves.filter(move => move.score === topScore);
  const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  // アクションの実行
  if (chosenMove.type === 'attack') {
    // 画面上にビジュアル演出を加えるために少し待機
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
    // 相手(p1)から自分(p2)へ引き込み
    visualizeCpuAction('p1', chosenMove.from, 'p2', chosenMove.to);
    setTimeout(() => {
      executePull('p2', 'p1', chosenMove.to, chosenMove.from);
      endTurn();
    }, 400);
  }
}

// 攻撃手の評価関数
function evaluateAttackResult(targetCardId, originalVal, nextVal) {
  // 1. トドメを刺せる（相手のもう一方のカードも0で、この攻撃でターゲットも0になる）
  const otherCardId = targetCardId === 'A' ? 'B' : 'A';
  const otherVal = gameState.cards.p1[otherCardId];
  if (otherVal === 0 && nextVal === 0) {
    return 1000; // 最優先：勝利決定
  }

  // 2. 相手の1枚を0にする（全滅ではないが数的有利）
  if (nextVal === 0) {
    return 100;
  }

  // 3. 相手のカードの数値を高くしすぎない（4などは相手が譲渡で分配しやすくなるため避ける）
  if (nextVal === 4) {
    return 10;
  }

  // 4. 相手のカードの数値を2や3など、譲渡の起点にしやすい中途半端な値にする
  if (nextVal === 2 || nextVal === 3) {
    return 20;
  }

  // 5. 相手のカードの数値を1にする（譲渡できなくなるため有利）
  if (nextVal === 1) {
    return 50;
  }

  return 0;
}

// 譲渡手の評価関数
function evaluateTransferResult(sourceCardId, targetCardId, sourceOriginalVal, targetOriginalVal, targetNextVal) {
  // 1. 味方の消滅カード(0)を復活させる手は価値が高い
  if (targetOriginalVal === 0 && targetNextVal > 0) {
    return 200; // 0のカードを復活させるのは非常に強力
  }

  // 2. 自分のカードが0になるような危険な譲渡（譲渡して5以上になり0になる等）は避ける
  if (targetNextVal === 0) {
    return -50; // 自殺行為
  }

  // 3. 譲渡後に両方のカードの数値がバランスよくなる手（例：2と2にするなど）
  let sourceNextVal = 0;
  if (sourceOriginalVal === 1) sourceNextVal = 0;
  else if (sourceOriginalVal === 2) sourceNextVal = 1;
  else if (sourceOriginalVal === 3) sourceNextVal = 2;
  else if (sourceOriginalVal === 4) sourceNextVal = 2;

  // 両方が0になるような最悪の譲渡（全滅）は避ける
  if (sourceNextVal === 0 && targetNextVal === 0) {
    return -1000;
  }

  // 数値が均等に近い方が、防御面・攻撃面で有利なことが多い
  const balanceDiff = Math.abs(sourceNextVal - targetNextVal);
  if (balanceDiff === 0) {
    return 40;
  } else if (balanceDiff === 1) {
    return 30;
  }

  return 10;
}

// 引き込み手の評価関数
function evaluatePullResult(myCardId, originalVal, nextVal) {
  // 1. 引き込んだ結果、自分が両方とも0になって全滅するなら最悪の手（自殺行為）
  const otherCardId = myCardId === 'A' ? 'B' : 'A';
  const otherVal = gameState.cards.p2[otherCardId];
  if (otherVal === 0 && nextVal === 0) {
    return -1000;
  }

  // 2. 自分のカードの数値をちょうど0（消滅）にするのは、相方が生きている場合はターゲットを減らせるが、自分も弱体化するため低評価
  if (nextVal === 0) {
    return 10;
  }

  // 3. 自分の数値を1にする（相手から譲渡・攻撃されにくく、安全）
  if (nextVal === 1) {
    return 60;
  }

  // 4. 自分の数値を2か3にする（譲渡に使えて使い勝手が良い）
  if (nextVal === 2 || nextVal === 3) {
    return 40;
  }

  // 5. 自分の数値を4にする（増やしすぎて危険値）
  if (nextVal === 4) {
    return 20;
  }

  return 0;
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
        // ドラッグ元が相手でドロップ先が自分なら引き込み
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
