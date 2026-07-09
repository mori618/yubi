const fs = require('fs');

const dummyElement = {
  classList: { add: () => {}, remove: () => {} },
  addEventListener: () => {},
  appendChild: () => {},
  innerHTML: '',
  textContent: '',
  style: {},
  querySelector: () => dummyElement,
  querySelectorAll: () => [],
  closest: () => dummyElement
};

global.document = {
  getElementById: () => dummyElement,
  createElement: () => dummyElement
};
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => null };
global.requestAnimationFrame = (cb) => cb();

const { 
  gameState, 
  generateLegalMoves, 
  simulateMove, 
  evaluateBoard, 
  isAlive,
  isLoseValue,
  isWinValue,
  simulateVictoryCheck,
} = require('./script.js');

// Parse CAMPAIGN_STAGES directly from script.js
const scriptContent = fs.readFileSync('./script.js', 'utf8');
const match = scriptContent.match(/const CAMPAIGN_STAGES = (\[[\s\S]*?\]);/);
const CAMPAIGN_STAGES_LOCAL = eval(match[1]);

function analyzeStage(stageData) {
  const rules = {
    initialValueMin: 1,
    initialValueMax: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    pullLimit: 0,
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
    loseValues: [0],
    ...stageData.rules
  };
  
  gameState.customRules = rules;
  
  const cards = { p1: {}, p2: {} };
  const labels = ['A', 'B', 'C', 'D'].slice(0, rules.cardCount);
  
  for (const p of ['p1', 'p2']) {
    for (const l of labels) {
      cards[p][l] = Math.floor((rules.initialValueMin + rules.initialValueMax) / 2);
    }
  }

  const limits = {
    p1: { pull: rules.pullLimit, transfer: rules.transferLimit, pass: rules.passLimit },
    p2: { pull: rules.pullLimit, transfer: rules.transferLimit, pass: rules.passLimit }
  };

  const initialState = {
    cards: cards,
    limits: limits,
    turnPlayer: 'p1',
    explodedCards: new Set()
  };

  // Depth 5 should be enough to see immediate advantage, maybe 6 if fast enough
  const { score } = alphaBeta(initialState, 6, -Infinity, Infinity, true, 'p1');
  return score;
}

function alphaBeta(state, depth, alpha, beta, isMaximizing, rootPlayer) {
  const winner = simulateVictoryCheck(state.cards);
  if (winner === rootPlayer) return { score: 1000 + depth };
  if (winner && winner !== 'draw') return { score: -1000 - depth };
  if (winner === 'draw') return { score: 0 };
  if (depth === 0) return { score: evaluateBoard(state.cards, rootPlayer) };

  const moves = generateLegalMoves(state.cards, state.turnPlayer, state.limits);
  if (moves.length === 0) return { score: 0 };

  let bestMove = null;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = simulateMove(state, move);
      const evalResult = alphaBeta(nextState, depth - 1, alpha, beta, false, rootPlayer).score;
      if (evalResult > maxEval) {
        maxEval = evalResult;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = simulateMove(state, move);
      const evalResult = alphaBeta(nextState, depth - 1, alpha, beta, true, rootPlayer).score;
      if (evalResult < minEval) {
        minEval = evalResult;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

let md = "# Stage Analysis Results\n\n";

for (let i = 0; i < CAMPAIGN_STAGES_LOCAL.length; i++) {
  const stage = CAMPAIGN_STAGES_LOCAL[i];
  const score = analyzeStage(stage);
  let adv = "互角 (Draw/Unknown)";
  if (score > 500) adv = "先手必勝 (First Player Win)";
  else if (score < -500) adv = "後手必勝 (Second Player Win)";
  else if (score > 10) adv = "先手有利 (First Player Adv)";
  else if (score < -10) adv = "後手有利 (Second Player Adv)";
  
  const line = `**Stage ${i+1}: ${stage.title}** - Score: ${score} => ${adv}\n`;
  console.log(line);
  md += line;
}

fs.writeFileSync('analysis_results.md', md);
