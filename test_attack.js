const script = require('./script.js');

let state = {
  currentPlayer: 'p1',
  cards: { p1: { A: 2, B: 1 }, p2: { A: 0, B: 1 } },
  customRules: { maxValue: 5, zeroWhenFiveOrMore: false, multiplyAttack: false, loseValues: [0] },
  limits: { p1: { pull: -1, transfer: -1, pass: 0 }, p2: { pull: -1, transfer: -1, pass: 0 } }
};
script.gameState = state; // override global
console.log("Before:", script.gameState.cards.p2.A);
// mimic executeAttack
let nextTargetVal = script.gameState.cards.p1.A + script.gameState.cards.p2.A;
nextTargetVal = script.calculateCardValue(nextTargetVal);
script.gameState.cards.p2.A = nextTargetVal;
console.log("After UI executeAttack:", script.gameState.cards.p2.A);

let state2 = {
  currentPlayer: 'p1',
  cards: { p1: { A: 2, B: 1 }, p2: { A: 0, B: 1 } },
  customRules: { maxValue: 5, zeroWhenFiveOrMore: false, multiplyAttack: true, loseValues: [0], cardCount: 2 },
  limits: { p1: { pull: -1, transfer: -1, pass: 0 }, p2: { pull: -1, transfer: -1, pass: 0 } }
};
let res = script.simulateMove(state2, { type: 'attack', from: 'A', to: 'A' });
console.log("After simulateMove (multiply=true):", res.cards.p2.A);
