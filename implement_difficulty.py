import re

# Update index.html
with open("index.html", "r") as f:
    html = f.read()

old_html_settings = """          <div class="setting-item">
            <label for="rule-initial-value-min">初期値（最小値）</label>"""
            
new_html_settings = """          <div class="setting-item">
            <label for="rule-cpu-difficulty">CPUの強さ</label>
            <select id="rule-cpu-difficulty">
              <option value="strong" selected>強い（最強AI）</option>
              <option value="normal">普通（1手先だけ考える）</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="rule-initial-value-min">初期値（最小値）</label>"""
html = html.replace(old_html_settings, new_html_settings)

with open("index.html", "w") as f:
    f.write(html)

# Update script.js
with open("script.js", "r") as f:
    js = f.read()

old_state_def = """  customRules: {
    initialValueMin: 1,"""
new_state_def = """  customRules: {
    cpuDifficulty: 'strong',
    initialValueMin: 1,"""
js = js.replace(old_state_def, new_state_def)

old_dom_def = """const ruleInitMin = document.getElementById('rule-initial-value-min');"""
new_dom_def = """const ruleCpuDifficulty = document.getElementById('rule-cpu-difficulty');
const ruleInitMin = document.getElementById('rule-initial-value-min');"""
js = js.replace(old_dom_def, new_dom_def)

old_start_read = """  // 設定を読み取る
  gameState.customRules.initialValueMin = parseInt(ruleInitMin.value, 10);"""
new_start_read = """  // 設定を読み取る
  gameState.customRules.cpuDifficulty = ruleCpuDifficulty.value;
  gameState.customRules.initialValueMin = parseInt(ruleInitMin.value, 10);"""
js = js.replace(old_start_read, new_start_read)

# Update executeCpuTurn
old_depth = """  // 探索深さの決定 (カードが多いと計算量が増えるため減らす)
  let maxDepth = 4;
  if (gameState.customRules.cardCount >= 3) maxDepth = 3;
  if (gameState.customRules.chainExplosion && gameState.customRules.cardCount >= 3) maxDepth = 3;"""
new_depth = """  // 探索深さの決定
  let maxDepth = 4;
  if (gameState.customRules.cpuDifficulty === 'normal') {
    maxDepth = 1; // 普通は1手先のみ
  } else {
    // 強い場合は数手先を読むが、カード数が多いと重くなるので調整
    if (gameState.customRules.cardCount >= 3) maxDepth = 3;
    if (gameState.customRules.chainExplosion && gameState.customRules.cardCount >= 3) maxDepth = 3;
  }"""
js = js.replace(old_depth, new_depth)

with open("script.js", "w") as f:
    f.write(js)
