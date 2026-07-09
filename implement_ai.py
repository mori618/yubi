import re

with open("script.js", "r") as f:
    lines = f.readlines()

cpu_start = 0
for i, line in enumerate(lines):
    if "CPU (AI) の思考ロジック" in line:
        cpu_start = i - 1
        break

new_ai = """// ==========================================
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
  
  // 探索深さの決定 (カードが多いと計算量が増えるため減らす)
  let maxDepth = 4;
  if (gameState.customRules.cardCount >= 3) maxDepth = 3;
  if (gameState.customRules.chainExplosion && gameState.customRules.cardCount >= 3) maxDepth = 3;

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
"""

with open("script.js", "w") as f:
    f.writelines(lines[:cpu_start])
    f.write(new_ai)

