const fs = require('fs');

// Read script.js and extract the necessary functions by using eval or just reading them
const scriptContent = fs.readFileSync('script.js', 'utf8');

// We can extract functions by mocking document and running the script in a context
const vm = require('vm');
const sandbox = {
  document: {
    getElementById: () => ({
      classList: { add: ()=>{}, remove: ()=>{} },
      addEventListener: ()=>{},
      appendChild: ()=>{},
      innerHTML: '',
      textContent: '',
      style: {},
      querySelector: () => null,
      querySelectorAll: () => [],
      closest: () => null
    }),
    createElement: () => ({
      classList: { add: ()=>{}, remove: ()=>{} }
    })
  },
  window: {},
  localStorage: { getItem: () => null, setItem: () => null },
  requestAnimationFrame: (cb) => cb(),
  setTimeout: () => {},
  console: console,
  module: { exports: {} }
};
vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);

const {
  gameState,
  simulateVictoryCheck,
  evaluateBoard,
  generateLegalMoves,
  simulateMove,
  CAMPAIGN_STAGES
} = sandbox.module.exports;

// For some reason, CAMPAIGN_STAGES might not be exported. Let's extract it.
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
  
  sandbox.gameState.customRules = rules;
  
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

  const { score } = alphaBeta(initialState, 7, -Infinity, Infinity, true, 'p1');
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

console.log("Analyzing 20 stages...");
for (let i = 0; i < CAMPAIGN_STAGES_LOCAL.length; i++) {
  const stage = CAMPAIGN_STAGES_LOCAL[i];
  const score = analyzeStage(stage);
  let adv = "互角 (Draw/Unknown)";
  if (score > 500) adv = "先手必勝 (First Player Win)";
  else if (score < -500) adv = "後手必勝 (Second Player Win)";
  else if (score > 10) adv = "先手有利 (First Player Adv)";
  else if (score < -10) adv = "後手有利 (Second Player Adv)";
  
  console.log(`Stage ${i+1}: Score = ${score} => ${adv}`);
}
