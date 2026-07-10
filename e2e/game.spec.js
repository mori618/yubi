const { test, expect } = require('@playwright/test');

test('ローカル対戦で攻撃を実行できること', async ({ page }) => {
  // コンソールエラーを監視
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // サーバーにアクセス
  await page.goto('/index.html');

  // ローカル対戦ボタンをクリック
  await page.click('#btnLocal');

  // ゲーム画面が表示されるのを待つ
  try {
    await expect(page.locator('#battle-screen')).toBeVisible({ timeout: 3000 });
  } catch (e) {
    console.error('Errors found in browser console:', errors);
    throw e;
  }

  // p1のターンであることを確認
  await expect(page.locator('#turn-indicator')).toHaveText('プレイヤー1のターン');

  // p1のカードAからp2のカードAへドラッグ＆ドロップ (攻撃)
  await page.dragAndDrop('#p1-card-A', '#p2-card-A');

  // 未定義エラー等がないこと
  expect(errors).toHaveLength(0); 

  // p2のカードAの数値が更新されていることを確認 (1 + 1 = 2)
  await expect(page.locator('#p2-card-A .card-value')).toHaveText('2');
  
  // ターンが切り替わっていること
  await expect(page.locator('#turn-indicator')).toHaveText('プレイヤー2のターン');
});
