/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// 1. DOMの初期化
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// 2. script.jsの読み込み
const script = require('./script.js');

describe('Game Logic Tests', () => {
  beforeEach(() => {
    // 状態をリセットするための基本設定
    script.gameState.customRules = {
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
    };
  });

  describe('parseValues', () => {
    test('数値を正しく配列としてパースできるか', () => {
      expect(script.parseValues('1, 2, 3')).toEqual([1, 2, 3]);
      expect(script.parseValues(' 5 ')).toEqual([5]);
      expect(script.parseValues('')).toEqual([]);
      expect(script.parseValues(null)).toEqual([]);
    });
  });

  describe('isLoseValue / isWinValue / isAlive', () => {
    test('敗北条件の判定ができるか', () => {
      script.gameState.customRules.loseValues = [0, 10];
      expect(script.isLoseValue(script.gameState, 0)).toBe(true);
      expect(script.isLoseValue(script.gameState, 10)).toBe(true);
      expect(script.isLoseValue(script.gameState, 5)).toBe(false);
    });

    test('生存条件の判定ができるか', () => {
      script.gameState.customRules.loseValues = [0];
      expect(script.isAlive(script.gameState, 0)).toBe(false);
      expect(script.isAlive(script.gameState, 1)).toBe(true);
      expect(script.isAlive(script.gameState, 5)).toBe(true);
    });

    test('勝利条件の判定ができるか', () => {
      script.gameState.customRules.winValues = [5];
      expect(script.isWinValue(script.gameState, 5)).toBe(true);
      expect(script.isWinValue(script.gameState, 4)).toBe(false);
    });
  });

  describe('calculateCardValue', () => {
    test('通常時（maxValue未満）はそのままの値を返す', () => {
      script.gameState.customRules.maxValue = 5;
      script.gameState.customRules.zeroWhenFiveOrMore = false;
      expect(script.calculateCardValue(3)).toBe(3);
      expect(script.calculateCardValue(4)).toBe(4);
    });

    test('maxValue以上の時、zeroWhenFiveOrMoreがtrueなら0になる', () => {
      script.gameState.customRules.maxValue = 5;
      script.gameState.customRules.zeroWhenFiveOrMore = true;
      expect(script.calculateCardValue(5)).toBe(0);
      expect(script.calculateCardValue(6)).toBe(0);
    });

    test('maxValue以上の時、zeroWhenFiveOrMoreがfalseならmaxValueを引いた値になる', () => {
      script.gameState.customRules.maxValue = 5;
      script.gameState.customRules.zeroWhenFiveOrMore = false;
      expect(script.calculateCardValue(5)).toBe(0);
      expect(script.calculateCardValue(6)).toBe(1);
      expect(script.calculateCardValue(10)).toBe(5); // 10 - 5 = 5
    });
  });
});
