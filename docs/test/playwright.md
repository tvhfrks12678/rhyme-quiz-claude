# Playwright E2E テスト解説

## Playwright とは

**Playwright** は実際のブラウザ（Chromium / Firefox / Safari）を自動操作して、
アプリ全体を「端から端まで（E2E = End-to-End）」テストするツール。

Vitest（ユニット・コンポーネントテスト）とは異なり、
**実際のサーバーが動いた状態**でテストする。

---

## Vitest との違い

| | Vitest（ユニット/コンポーネント） | Playwright（E2E） |
|--|---|---|
| テスト対象 | 関数・コンポーネント単体 | アプリ全体（画面操作） |
| 実行速度 | 速い（ミリ秒単位） | 遅い（秒単位） |
| サーバー | 不要 | 必要（`pnpm dev` を起動） |
| ブラウザ | 使わない（jsdom でエミュレート） | 実際のブラウザを使う |
| 用途 | ロジックの正確さ確認 | ユーザー操作の確認 |

---

## テストの実行方法

```bash
# 開発サーバーを起動した状態で（別ターミナル）
pnpm dev

# Playwright テストを実行
pnpm test:e2e

# ブラウザを画面に表示しながら実行（デバッグ時に便利）
pnpm test:e2e --headed

# 特定のファイルだけ実行
pnpm test:e2e e2e/quiz-video.spec.ts
```

---

## 設定ファイル: `playwright.config.ts`

```ts
export default defineConfig({
  testDir: "./e2e",       // テストファイルの場所
  use: {
    baseURL: "http://localhost:3000",  // テスト対象のURL
    screenshot: "only-on-failure",    // 失敗時にスクリーンショットを保存
  },
  webServer: {
    command: "pnpm dev",              // テスト前に自動でサーバーを起動
    url: "http://localhost:3000",
    reuseExistingServer: true,        // 既に起動中なら再起動しない
  },
});
```

---

## テストの基本構文

```ts
import { test, expect } from "@playwright/test";

test.describe("グループ名", () => {
  test("テストの説明", async ({ page }) => {
    // ページを開く
    await page.goto("/");

    // 要素を探して操作する
    await page.getByText("おか").click();
    await page.getByRole("button", { name: "解答する" }).click();

    // 結果を確認する
    await expect(page.getByTestId("video-player")).toBeVisible();
  });
});
```

**注意**: Playwright は非同期処理なので `async / await` を使う。

---

## このプロジェクトの E2E テスト: `e2e/quiz-video.spec.ts`

Q2 の動画表示機能をブラウザで確認するテスト。

### テスト 1: Q1 は動画なし

```
アクセス → / (トップページ = Q1)
確認:
  - data-testid="video-player" が見えない
  - data-testid="image-placeholder" が見える
```

### テスト 2: Q1 を回答 → Q2 で動画が出る

```
アクセス → /
操作:
  1. 「おか」テキストをクリック（Q1 の正解選択肢）
  2. 「解答する」ボタンをクリック
  3. 結果表示を待つ（正解 or 不正解）
  4. 「次の問題へ」ボタンをクリック
確認:
  - 「あたま」（Q2 の問題文）が表示されている
  - data-testid="video-player" が見える
  - src 属性に ".mp4" が含まれる
  - data-testid="image-placeholder" が見えない
```

---

## よく使う Playwright のメソッド

### ページ操作

| メソッド | 意味 |
|---------|------|
| `page.goto("/")` | URL に移動する |
| `page.getByText("テキスト").click()` | テキストを含む要素をクリック |
| `page.getByRole("button", { name: "ラベル" }).click()` | ボタンをクリック |
| `page.getByTestId("name").click()` | `data-testid="name"` の要素をクリック |

### アサーション（確認）

| メソッド | 意味 |
|---------|------|
| `expect(locator).toBeVisible()` | 要素が画面に表示されている |
| `expect(locator).not.toBeVisible()` | 要素が画面に表示されていない |
| `expect(locator).toHaveAttribute("src", "...")` | 属性値が一致する |
| `locator.getAttribute("src")` | 属性値を取得する |

### タイムアウト

```ts
// デフォルトタイムアウトを変えたいとき
await expect(page.getByText(/あたま/)).toBeVisible({ timeout: 5000 });
```

非同期で表示される要素（API レスポンス待ちなど）は `timeout` を指定する。

---

## テスト失敗時の確認方法

テストが失敗すると、`e2e/results/` フォルダにスクリーンショットが保存される。
何が表示されていたかを画像で確認できる。

```bash
# HTML レポートを開く（テスト後に生成される）
pnpm exec playwright show-report
```

---

## `data-testid` について

Playwright でも RTL でも、要素を特定するために `data-testid` 属性を使う。

```tsx
// コンポーネント側
<video data-testid="video-player" />

// テスト側
await expect(page.getByTestId("video-player")).toBeVisible();
```

`data-testid` はテスト専用の識別子。本番ビルドに含まれても動作には影響しない。
ただし「テストのためだけに属性を追加する」より、テキストやロールで特定できる場合はそちらが望ましい。
