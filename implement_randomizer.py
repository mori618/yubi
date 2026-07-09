import re

# Update index.html
with open("index.html", "r") as f:
    html = f.read()

old_settings_header = """        <div class="settings-panel">
          <h3>ルール設定</h3>"""
          
new_settings_header = """        <div class="settings-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0;">ルール設定</h3>
            <button id="btn-randomize-rules" class="btn btn-warning" style="padding: 5px 10px; font-size: 0.9rem;">🎲 ランダム設定</button>
          </div>"""
html = html.replace(old_settings_header, new_settings_header)

with open("index.html", "w") as f:
    f.write(html)

# Update style.css
with open("style.css", "a") as f:
    f.write("""
/* ランダム設定ボタン用 */
.btn-warning {
  background-color: #9b59b6;
  color: white;
}
.btn-warning:hover {
  background-color: #8e44ad;
}
""")

# Update script.js
with open("script.js", "r") as f:
    js = f.read()

old_dom_def = """const ruleInitMin = document.getElementById('rule-initial-value-min');"""
new_dom_def = """const btnRandomizeRules = document.getElementById('btn-randomize-rules');
const ruleInitMin = document.getElementById('rule-initial-value-min');"""
js = js.replace(old_dom_def, new_dom_def)

# Add randomize button listener and function
randomize_code = """
btnRandomizeRules.addEventListener('click', randomizeRules);

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomizeRules() {
  ruleCpuDifficulty.value = getRandomItem(['strong', 'normal']);
  
  const minVal = getRandomItem([1, 2, 3, 4]);
  ruleInitMin.value = minVal;
  
  // maxValはminVal以上
  const validMaxVals = [1, 2, 3, 4].filter(v => v >= minVal);
  ruleInitMax.value = getRandomItem(validMaxVals);
  
  ruleMaxValue.value = Math.floor(Math.random() * (12 - 4 + 1)) + 4; // 4〜12
  
  ruleCardCount.value = getRandomItem([2, 3, 4]);
  
  // 敗北条件はカード数に応じて
  const cCount = parseInt(ruleCardCount.value, 10);
  const loseOptions = ['all', '1', 'leader'];
  if (cCount >= 2) loseOptions.push('2');
  if (cCount >= 3) loseOptions.push('3');
  ruleLoseCount.value = getRandomItem(loseOptions);
  
  rulePullLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  ruleTransferLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  rulePassLimit.value = getRandomItem([-1, 0, 1, 2, 3]);
  
  ruleZeroOnFive.checked = Math.random() < 0.5;
  ruleAllowSelfAdd.checked = Math.random() < 0.5;
  ruleBlindMode.checked = Math.random() < 0.5;
  ruleReverseWin.checked = Math.random() < 0.5;
  ruleMultiplyAttack.checked = Math.random() < 0.5;
  ruleChainExplosion.checked = Math.random() < 0.5;
  
  // 視覚的フィードバック（チカッと光る）
  const panel = document.querySelector('.settings-panel');
  panel.style.transition = 'background-color 0.3s';
  panel.style.backgroundColor = '#f1c40f';
  setTimeout(() => {
    panel.style.backgroundColor = '#f9f9f9';
  }, 300);
}
"""

old_event_listeners = """document.getElementById('p1-btn-pass').addEventListener('click', () => executePass('p1'));"""
new_event_listeners = randomize_code + "\n" + old_event_listeners
js = js.replace(old_event_listeners, new_event_listeners)

with open("script.js", "w") as f:
    f.write(js)
