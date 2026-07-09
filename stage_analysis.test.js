/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

const script = require('./script.js');

describe('Stage Analysis', () => {
  test('Analyze all stages', () => {
    const scriptContent = fs.readFileSync(path.resolve(__dirname, './script.js'), 'utf8');
    const match = scriptContent.match(/const CAMPAIGN_STAGES = (\[[\s\S]*?\]);/);
    const stages = eval(match[1]);

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
        turnPlayer: 'p1', // First player moves first
        explodedCards: new Set(),
        customRules: rules,
        currentPlayer: 'p1' // Also needed for generateLegalMoves
      };
      
      script.gameState.customRules = rules;

      // evaluateBoard is from p2 perspective (positive = p2 winning).
      // So alphaBeta will return positive if p2 is winning.
      // But let's run minimax assuming p1 is maximizing! Wait, no.
      // If we run alphaBeta, we need a standard zero-sum evaluation.
      // Since evaluateBoard returns positive for P2, we'll negate it inside the search so positive = rootPlayer.
      const { score } = alphaBeta(initialState, 12, -Infinity, Infinity, true, 'p1');
      return score;
    }

    function alphaBeta(state, depth, alpha, beta, isMaximizing, rootPlayer) {
      const winner = script.simulateVictoryCheck(state);
      if (winner === rootPlayer) return { score: 1000 + depth };
      if (winner && winner !== 'draw') return { score: -1000 - depth };
      if (winner === 'draw') return { score: 0 };
      
      if (depth === 0) {
        let evalScore = script.evaluateBoard(state);
        // evaluateBoard uses P2 perspective. So if rootPlayer is P1, negate it.
        if (rootPlayer === 'p1') evalScore = -evalScore;
        return { score: evalScore };
      }

      const moves = script.generateLegalMoves(state);
      if (moves.length === 0) return { score: 0 }; // draw

      let bestMove = null;
      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          const nextState = script.simulateMove(state, move);
          nextState.customRules = state.customRules;
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
          const nextState = script.simulateMove(state, move);
          nextState.customRules = state.customRules;
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
    console.log("\n--- STAGE ANALYSIS RESULTS ---");
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const score = analyzeStage(stage);
      let adv = "互角 (Draw/Unknown)";
      if (score > 500) adv = "先手必勝 (First Player Win)";
      else if (score < -500) adv = "後手必勝 (Second Player Win)";
      else if (score > 10) adv = "先手有利 (First Player Adv)";
      else if (score < -10) adv = "後手有利 (Second Player Adv)";
      
      const res = `Stage ${i+1} (${stage.title}): Score = ${score} => ${adv}`;
      console.log(res);
      md += res + "\n";
    }
    console.log("------------------------------\n");
    fs.writeFileSync(path.resolve(__dirname, 'analysis_results.md'), md);
  });
});
