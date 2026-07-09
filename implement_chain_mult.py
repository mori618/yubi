import re

with open("index.html", "r") as f:
    html = f.read()

# Add checkboxes to index.html
old_html_settings = """          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-reverse-win">
              勝利条件の逆転（自分が敗北条件を満たすと「勝ち」になるデスゲーム）
            </label>
          </div>
        </div>"""

new_html_settings = """          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-reverse-win">
              勝利条件の逆転（自分が敗北条件を満たすと「勝ち」になるデスゲーム）
            </label>
          </div>

          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-multiply-attack">
              攻撃を「足し算」ではなく「掛け算」にする
            </label>
          </div>

          <div class="setting-item checkbox-item">
            <label>
              <input type="checkbox" id="rule-chain-explosion">
              連鎖爆発（誰かのカードが0になった瞬間、他の全員のカードに＋1）
            </label>
          </div>
        </div>"""
html = html.replace(old_html_settings, new_html_settings)
with open("index.html", "w") as f:
    f.write(html)

with open("script.js", "r") as f:
    js = f.read()

# 1. Update gameState definition
old_state = """  customRules: {
    initialValue: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    disablePull: false,
    disableTransfer: false,
    allowSelfAdd: false,
    blindMode: false,
    reverseWin: false
  }"""
new_state = """  explodedCards: new Set(),
  customRules: {
    initialValue: 1,
    maxValue: 5,
    cardCount: 2,
    loseCount: 'all',
    zeroWhenFiveOrMore: false,
    disablePull: false,
    disableTransfer: false,
    allowSelfAdd: false,
    blindMode: false,
    reverseWin: false,
    multiplyAttack: false,
    chainExplosion: false
  }"""
js = js.replace(old_state, new_state)

# 2. Setup DOM variables
old_dom = """const ruleBlindMode = document.getElementById('rule-blind-mode');
const ruleReverseWin = document.getElementById('rule-reverse-win');"""
new_dom = """const ruleBlindMode = document.getElementById('rule-blind-mode');
const ruleReverseWin = document.getElementById('rule-reverse-win');
const ruleMultiplyAttack = document.getElementById('rule-multiply-attack');
const ruleChainExplosion = document.getElementById('rule-chain-explosion');"""
js = js.replace(old_dom, new_dom)

# 3. Read settings in startGame
old_start = """  gameState.customRules.blindMode = ruleBlindMode.checked;
  gameState.customRules.reverseWin = ruleReverseWin.checked;"""
new_start = """  gameState.customRules.blindMode = ruleBlindMode.checked;
  gameState.customRules.reverseWin = ruleReverseWin.checked;
  gameState.customRules.multiplyAttack = ruleMultiplyAttack.checked;
  gameState.customRules.chainExplosion = ruleChainExplosion.checked;"""
js = js.replace(old_start, new_start)

# 4. resetGame clear explodedCards
old_reset = """function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;"""
new_reset = """function resetGame() {
  gameState.currentPlayer = 'p1';
  gameState.isGameOver = false;
  gameState.draggedCard = null;
  gameState.explodedCards.clear();"""
js = js.replace(old_reset, new_reset)

# 5. Attack calculation
old_attack_calc = """function executeAttack(attackerPlayerId, targetPlayerId, attackerCardId, targetCardId) {
  const attackerVal = gameState.cards[attackerPlayerId][attackerCardId];
  const targetVal = gameState.cards[targetPlayerId][targetCardId];

  if (attackerVal === 0 || targetVal === 0) return false; // 0からは攻撃不可、0へも攻撃不可

  // 攻撃の実行（値の加算と、5以上になった時の端数処理）
  const nextTargetVal = calculateCardValue(targetVal + attackerVal);"""
new_attack_calc = """function executeAttack(attackerPlayerId, targetPlayerId, attackerCardId, targetCardId) {
  const attackerVal = gameState.cards[attackerPlayerId][attackerCardId];
  const targetVal = gameState.cards[targetPlayerId][targetCardId];

  if (attackerVal === 0 || targetVal === 0) return false;

  // 攻撃の実行
  let rawDamage = targetVal + attackerVal;
  if (gameState.customRules.multiplyAttack) {
    rawDamage = targetVal * attackerVal;
  }
  const nextTargetVal = calculateCardValue(rawDamage);"""
js = js.replace(old_attack_calc, new_attack_calc)

# Update log for attack
old_attack_log = """  addLog(
    `${attackerName}が${getHandName(attackerCardId)}(指${attackerVal}本)で、${targetName}の${getHandName(targetCardId)}(指${targetVal}本)を攻撃！結果: → ${nextTargetVal}本`
  );"""
new_attack_log = """  const verb = gameState.customRules.multiplyAttack ? '掛け算攻撃' : '攻撃';
  addLog(
    `${attackerName}が${getHandName(attackerCardId)}(指${attackerVal}本)で、${targetName}の${getHandName(targetCardId)}(指${targetVal}本)を${verb}！結果: → ${nextTargetVal}本`
  );"""
js = js.replace(old_attack_log, new_attack_log)

# 6. Chain Explosion Logic
chain_func = """
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
"""

# Insert chain_func after triggerUpdateAnimation
js = js.replace("function triggerUpdateAnimation(player, cardId) {", chain_func + "\nfunction triggerUpdateAnimation(player, cardId) {")


# 7. Add handleChainExplosion to endTurn
old_end_turn = """function endTurn() {
  checkVictory();"""
new_end_turn = """function endTurn() {
  checkRevivals();
  handleChainExplosion();
  checkRevivals(); // 爆発後にもし1以上になったら（通常ありえないが念のため）
  checkVictory();"""
js = js.replace(old_end_turn, new_end_turn)

# Wait, `checkRevivals` should run AFTER `executeTransfer`, `executePull` assigns > 0 to a card, but BEFORE `handleChainExplosion` finds 0s. 
# `endTurn` happens right after executeAttack/Transfer/Pull. So checking it there is perfect.


# 8. CPU Attack Logic for Multiplication
old_cpu_sim_attack = """      // 攻撃シミュレーション
      const nextPlayerVal = calculateCardValue(cpuVal + playerVal);"""
new_cpu_sim_attack = """      // 攻撃シミュレーション
      let rawSimDamage = cpuVal + playerVal;
      if (gameState.customRules.multiplyAttack) rawSimDamage = cpuVal * playerVal;
      const nextPlayerVal = calculateCardValue(rawSimDamage);"""
js = js.replace(old_cpu_sim_attack, new_cpu_sim_attack)


with open("script.js", "w") as f:
    f.write(js)
