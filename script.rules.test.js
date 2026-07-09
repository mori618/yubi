/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// DOMの初期化
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

const script = require('./script.js');

describe('Custom Rules Tests', () => {
  let state;

  beforeEach(() => {
    // 基本となる状態の初期化
    state = {
      currentPlayer: 'p1',
      cards: {
        p1: { A: 1, B: 1 },
        p2: { A: 1, B: 1 }
      },
      limits: {
        p1: { pull: -1, transfer: -1, pass: 0 },
        p2: { pull: -1, transfer: -1, pass: 0 }
      },
      explodedCards: new Set(),
      customRules: {
        cardCount: 2,
        maxValue: 5,
        zeroWhenFiveOrMore: false,
        allowSelfAdd: false,
        multiplyAttack: false,
        chainExplosion: false,
        attackHandRestriction: 'none',
        pullTargetRestriction: 'none',
        reverseWin: false,
        loseCount: 'all',
        winValues: [],
        loseValues: [0]
      }
    };
  });

  test('multiplyAttack: 攻撃値が掛け算になること', () => {
    state.customRules.multiplyAttack = true;
    state.cards.p1.A = 2; // attacker
    state.cards.p2.A = 3; // target
    // p1がp2を攻撃
    const move = { type: 'attack', from: 'A', to: 'A' };
    const nextState = script.simulateMove(state, move);
    // 2 * 3 = 6. maxValueが5、zeroWhenFiveOrMore=falseなので 6 - 5 = 1
    expect(nextState.cards.p2.A).toBe(1);
  });

  test('chainExplosion: 消滅時に他の全生存カードが+1されること', () => {
    state.customRules.chainExplosion = true;
    // p1-Aを0（消滅状態）にする
    state.cards.p1.A = 0; 
    state.cards.p1.B = 1;
    state.cards.p2.A = 2;
    state.cards.p2.B = 3;

    script.simulateChainExplosion(state, new Set());

    // 0だったカードが爆発し、他のカードがすべて+1される
    // 0のカード自体は爆発後も0
    expect(state.cards.p1.A).toBe(0);
    expect(state.cards.p1.B).toBe(2);
    expect(state.cards.p2.A).toBe(3);
    expect(state.cards.p2.B).toBe(4);
  });

  test('allowSelfAdd: 自分自身への譲渡/攻撃ムーブが生成されるか', () => {
    state.customRules.allowSelfAdd = true;
    // p1が currentPlayer
    state.cards.p1.A = 1;
    state.cards.p1.B = 2;
    const moves = script.generateLegalMoves(state);
    
    // p1のAからBへの譲渡(transfer)または攻撃が存在するか
    const hasSelfMove = moves.some(m => m.type === 'transfer' && m.from === 'A' && m.to === 'B');
    expect(hasSelfMove).toBe(true);
  });

  test('reverseWin: 勝利条件が逆転（自分が全滅したら勝ち）になること', () => {
    state.customRules.reverseWin = true;
    // p1を全滅させる
    state.cards.p1.A = 0;
    state.cards.p1.B = 0;
    state.cards.p2.A = 1;
    state.cards.p2.B = 1;

    // 通常ならp2の勝ち（p1の負け）だが、reverseWinなのでp1の勝ち
    expect(script.simulateVictoryCheck(state)).toBe('p1');
  });

  describe('attackHandRestriction (攻撃手の制限)', () => {
    test('min: 最小値のカードしか攻撃に使えないこと', () => {
      state.customRules.attackHandRestriction = 'min';
      state.cards.p1.A = 1;
      state.cards.p1.B = 3;
      
      // A(1) は最小なので動かせる
      expect(script.isCardMovable(state, 'p1', 'A')).toBe(true);
      // B(3) は最小ではないので動かせない
      expect(script.isCardMovable(state, 'p1', 'B')).toBe(false);
    });

    test('max: 最大値のカードしか攻撃に使えないこと', () => {
      state.customRules.attackHandRestriction = 'max';
      state.cards.p1.A = 1;
      state.cards.p1.B = 3;
      
      expect(script.isCardMovable(state, 'p1', 'A')).toBe(false);
      expect(script.isCardMovable(state, 'p1', 'B')).toBe(true);
    });
  });

  describe('pullTargetRestriction (引込先の制限)', () => {
    test('min: 相手の最小値のカードしか引き込めないこと', () => {
      state.customRules.pullTargetRestriction = 'min';
      state.cards.p2.A = 2;
      state.cards.p2.B = 4;
      
      // A(2) は最小なので対象にできる
      expect(script.isPullTargetValid(state, 'p2', 'A')).toBe(true);
      // B(4) は最小ではないので対象にできない
      expect(script.isPullTargetValid(state, 'p2', 'B')).toBe(false);
    });
  });

  describe('loseCount (敗北判定の枚数)', () => {
    test('leader: 左手(A)が消滅しただけで敗北となること', () => {
      state.customRules.loseCount = 'leader';
      state.cards.p1.A = 0; // A消滅
      state.cards.p1.B = 2; // B生存
      
      // Aが消滅していれば敗北
      expect(script.simulateVictoryCheck(state)).toBe('p2');
    });

    test('1: いずれか1枚が消滅しただけで敗北となること', () => {
      state.customRules.loseCount = '1';
      state.cards.p1.A = 1; 
      state.cards.p1.B = 0; // B消滅
      
      expect(script.simulateVictoryCheck(state)).toBe('p2');
    });
  });
});
