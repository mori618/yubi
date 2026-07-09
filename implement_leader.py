import re

with open("index.html", "r") as f:
    html = f.read()

old_html_select = """            <select id="rule-lose-count">
              <option value="all" selected>すべてのカード</option>
              <option value="1">1枚でも消滅したら</option>
              <option value="2">2枚消滅したら</option>
              <option value="3">3枚消滅したら</option>
            </select>"""

new_html_select = """            <select id="rule-lose-count">
              <option value="all" selected>すべてのカード</option>
              <option value="1">1枚でも消滅したら</option>
              <option value="2">2枚消滅したら</option>
              <option value="3">3枚消滅したら</option>
              <option value="leader">リーダー（左手）が消滅したら</option>
            </select>"""
html = html.replace(old_html_select, new_html_select)

with open("index.html", "w") as f:
    f.write(html)

with open("script.js", "r") as f:
    js = f.read()

# 1. Update DOM creation for Leader
old_create = """  for (let i = 0; i < gameState.customRules.cardCount; i++) {
    const cardId = labels[i];
    const handLabel = handLabels[i];"""

new_create = """  for (let i = 0; i < gameState.customRules.cardCount; i++) {
    const cardId = labels[i];
    let handLabel = handLabels[i];
    
    if (gameState.customRules.loseCount === 'leader' && cardId === 'A') {
      handLabel = `👑 ${handLabel}`;
    }"""
js = js.replace(old_create, new_create)

# 2. Update checkVictory for Leader
old_victory = """  let requiredZeros = gameState.customRules.cardCount;
  if (gameState.customRules.loseCount !== 'all') {
    requiredZeros = parseInt(gameState.customRules.loseCount, 10);
    if (requiredZeros > gameState.customRules.cardCount) {
      requiredZeros = gameState.customRules.cardCount;
    }
  }

  const p1Defeated = p1Zeros >= requiredZeros;
  const p2Defeated = p2Zeros >= requiredZeros;"""

new_victory = """  let p1Defeated = false;
  let p2Defeated = false;

  if (gameState.customRules.loseCount === 'leader') {
    p1Defeated = gameState.cards.p1['A'] === 0;
    p2Defeated = gameState.cards.p2['A'] === 0;
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
  }"""
js = js.replace(old_victory, new_victory)

# 3. Update AI logic - evaluateAttackResult
old_ai_attack = """function evaluateAttackResult(targetCardId, originalVal, nextVal) {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  let p1Zeros = 0;
  labels.forEach(id => {
    if (id === targetCardId) {
      if (nextVal === 0) p1Zeros++;
    } else {
      if (gameState.cards.p1[id] === 0) p1Zeros++;
    }
  });

  let requiredZeros = gameState.customRules.cardCount;
  if (gameState.customRules.loseCount !== 'all') {
    requiredZeros = parseInt(gameState.customRules.loseCount, 10);
    if (requiredZeros > gameState.customRules.cardCount) requiredZeros = gameState.customRules.cardCount;
  }

  // 1. トドメを刺せる
  if (p1Zeros >= requiredZeros) {
    return gameState.customRules.reverseWin ? -1000 : 1000;
  }"""

new_ai_attack = """function evaluateAttackResult(targetCardId, originalVal, nextVal) {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  
  // リーダールールの場合のトドメ判定
  if (gameState.customRules.loseCount === 'leader') {
    if (targetCardId === 'A' && nextVal === 0) {
      return gameState.customRules.reverseWin ? -1000 : 1000;
    }
  }

  let p1Zeros = 0;
  labels.forEach(id => {
    if (id === targetCardId) {
      if (nextVal === 0) p1Zeros++;
    } else {
      if (gameState.cards.p1[id] === 0) p1Zeros++;
    }
  });

  if (gameState.customRules.loseCount !== 'leader') {
    let requiredZeros = gameState.customRules.cardCount;
    if (gameState.customRules.loseCount !== 'all') {
      requiredZeros = parseInt(gameState.customRules.loseCount, 10);
      if (requiredZeros > gameState.customRules.cardCount) requiredZeros = gameState.customRules.cardCount;
    }
    if (p1Zeros >= requiredZeros) {
      return gameState.customRules.reverseWin ? -1000 : 1000;
    }
  }"""
js = js.replace(old_ai_attack, new_ai_attack)

# 4. Update AI logic - evaluatePullResult
old_ai_pull = """function evaluatePullResult(myCardId, originalVal, nextVal) {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  let p2Zeros = 0;
  labels.forEach(id => {
    if (id === myCardId) {
      if (nextVal === 0) p2Zeros++;
    } else {
      if (gameState.cards.p2[id] === 0) p2Zeros++;
    }
  });

  let requiredZeros = gameState.customRules.cardCount;
  if (gameState.customRules.loseCount !== 'all') {
    requiredZeros = parseInt(gameState.customRules.loseCount, 10);
    if (requiredZeros > gameState.customRules.cardCount) requiredZeros = gameState.customRules.cardCount;
  }

  // 1. 引き込んだ結果、自分が全滅条件を満たすなら最悪の手
  if (p2Zeros >= requiredZeros) {
    return gameState.customRules.reverseWin ? 1000 : -1000;
  }"""

new_ai_pull = """function evaluatePullResult(myCardId, originalVal, nextVal) {
  const labels = ['A', 'B', 'C', 'D'].slice(0, gameState.customRules.cardCount);
  
  if (gameState.customRules.loseCount === 'leader') {
    if (myCardId === 'A' && nextVal === 0) {
      return gameState.customRules.reverseWin ? 1000 : -1000;
    }
  }

  let p2Zeros = 0;
  labels.forEach(id => {
    if (id === myCardId) {
      if (nextVal === 0) p2Zeros++;
    } else {
      if (gameState.cards.p2[id] === 0) p2Zeros++;
    }
  });

  if (gameState.customRules.loseCount !== 'leader') {
    let requiredZeros = gameState.customRules.cardCount;
    if (gameState.customRules.loseCount !== 'all') {
      requiredZeros = parseInt(gameState.customRules.loseCount, 10);
      if (requiredZeros > gameState.customRules.cardCount) requiredZeros = gameState.customRules.cardCount;
    }
    if (p2Zeros >= requiredZeros) {
      return gameState.customRules.reverseWin ? 1000 : -1000;
    }
  }"""
js = js.replace(old_ai_pull, new_ai_pull)

# Also update AI to prioritize leader attack/defense
old_ai_prio = """  // 2. 相手の1枚を0にする（全滅ではないが数的有利）
  if (nextVal === 0) {
    return 100;
  }"""

new_ai_prio = """  // 2. 相手の1枚を0にする（全滅ではないが数的有利）
  if (nextVal === 0) {
    // リーダールールの場合はリーダーを狙う価値が通常より高い(トドメにならない場合でも)
    if (gameState.customRules.loseCount === 'leader' && targetCardId === 'A') {
      return 200;
    }
    return 100;
  }"""
js = js.replace(old_ai_prio, new_ai_prio)


with open("script.js", "w") as f:
    f.write(js)
