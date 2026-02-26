# React Testing Library（RTL）解説

## React Testing Library とは

**React Testing Library（RTL）** は、React コンポーネントをテストするためのライブラリ。

ポイントは **「ユーザー視点でテストする」** こと。
内部の実装（state の値・コンポーネント名）ではなく、
**画面に何が表示されているか** を確認する。

```
「このボタンを押したら、この文字が表示される」
→ ユーザーが実際に体験することをテストする
```

---

## インストール済みパッケージ

```bash
# このプロジェクトで使っているパッケージ（すでにインストール済み）
@testing-library/react     # RTL 本体（render / screen など）
@testing-library/dom       # DOM ユーティリティ（cleanup など）
@testing-library/jest-dom  # カスタムアサーション（toBeInTheDocument など）
```

確認方法:
```bash
grep "testing-library" package.json
```

---

## 他のテスト手法との比較

| | RTL | Vitest ユニットテスト | Playwright |
|--|---|---|---|
| テスト対象 | React コンポーネントの描画 | 純粋な関数・ロジック | ブラウザ全体の操作 |
| 実行環境 | jsdom（仮想DOM） | Node.js | 実ブラウザ |
| 速度 | 速い | 最速 | 遅い |
| 主な用途 | UI の描画確認 | 計算・変換ロジック | 画面遷移・統合確認 |

RTL は「コンポーネントが正しく描画されるか」を確認するのに使う。
ロジックのテストは Vitest ユニットテスト、
実際のブラウザ操作は Playwright に任せる。

---

## 基本の使い方

### 1. render — コンポーネントを仮想 DOM に描画する

```tsx
import { render } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

render(<MyComponent />);
// これで仮想 DOM に <MyComponent /> が描画された状態になる
```

### 2. screen — 描画された要素を取得する

```tsx
import { screen } from "@testing-library/react";

// テキストで要素を取得
const title = screen.getByText("タイトル");

// role（役割）で取得
const button = screen.getByRole("button", { name: "解答する" });

// data-testid で取得
const video = screen.getByTestId("video-player");
```

### 3. expect — 要素の状態を確認する

```tsx
import { expect } from "vitest";

expect(video).toBeInTheDocument();         // DOM に存在する
expect(video).toHaveAttribute("src", "..."); // 属性値が一致する
expect(button).toBeDisabled();             // disabled 状態
```

---

## このプロジェクトのコンポーネントテスト

### ファイル: `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx`

QuizCard コンポーネントが「動画 or 画像プレースホルダー」を
正しく切り替えて表示するかをテストしている。

---

## RTL を使うための準備

### jsdom 環境の指定

RTL は `document`（DOM）を使うため、Node.js の標準環境では動かない。
**ファイル先頭に以下のコメント**を書くと、そのファイルだけ jsdom 環境になる:

```ts
// @vitest-environment jsdom
```

jsdom とは「Node.js 上でブラウザ環境をシミュレートするライブラリ」。
`document.querySelector()` などが使えるようになる。

### jest-dom のセットアップ

`src/test/setup.ts` で一度インポートするだけで、すべてのテストで使える:

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

`vitest.config.ts` でこのファイルを読み込む設定になっている:

```ts
test: {
  setupFiles: ["./src/test/setup.ts"],
}
```

---

## このプロジェクトのテストのポイント

### Provider でのラップ

このアプリは TanStack Query を使っているため、
`useMutation` を使うコンポーネントは `QueryClientProvider` で包む必要がある。

```tsx
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// 使い方
renderWithProviders(<QuizCard question={question} />);
```

> `retry: false` にしているのは、テスト中に失敗したクエリを自動リトライしないようにするため。
> デフォルトは3回リトライするため、テストが遅くなる。

### テスト後の DOM リセット（cleanup）

```ts
import { cleanup } from "@testing-library/react";
afterEach(cleanup);
```

`cleanup` をしないと、前のテストで描画した要素が DOM に残り続ける。
次のテストで `getByTestId("video-player")` を呼ぶと
「複数の要素が見つかった」エラーになる。

### Zustand ストアのリセット

```ts
beforeEach(() => {
  useQuizStore.getState().reset();
});
```

Zustand のストアはグローバルな状態なので、テスト間で共有される。
`beforeEach` で毎回初期化しないと、選択済みの選択肢などが次のテストに持ち越される。

---

## screen のクエリメソッド 早見表

### `getBy` 系 — 要素が**必ず存在する**前提

| メソッド | 用途 | 見つからないと |
|---------|------|--------------|
| `screen.getByTestId("name")` | `data-testid="name"` の要素 | エラー |
| `screen.getByRole("button", { name: "ラベル" })` | role とラベルで取得 | エラー |
| `screen.getByText("テキスト")` | テキスト内容で取得 | エラー |
| `screen.getByText(/正規表現/)` | 部分一致で取得 | エラー |

### `queryBy` 系 — 要素が**存在しない**ことを確認したいとき

```ts
// 「存在しないこと」を確認する場合は queryBy を使う
// getBy は見つからないとエラーになるため
expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
```

| メソッド | 見つからないと |
|---------|--------------|
| `screen.queryByTestId("name")` | `null` を返す（エラーにならない） |
| `screen.queryByRole(...)` | `null` を返す |

### `getAllBy` 系 — **複数存在する**かもしれないとき

```ts
// 同じテキストが複数あっても大丈夫
expect(screen.getAllByText("からだ").length).toBeGreaterThan(0);
```

---

## jest-dom マッチャー 早見表

`@testing-library/jest-dom` が追加してくれるアサーション（`expect` に使えるもの）。

| マッチャー | 何を確認するか |
|-----------|--------------|
| `toBeInTheDocument()` | 要素が DOM に存在する |
| `not.toBeInTheDocument()` | 要素が DOM に存在しない |
| `toBeDisabled()` | ボタンなどが disabled 状態 |
| `toBeEnabled()` | disabled でない状態 |
| `toBeVisible()` | 画面に表示されている（hidden でない） |
| `toHaveAttribute("src", "/video/x.mp4")` | 属性値が一致する |
| `toHaveTextContent("テキスト")` | テキスト内容が一致する |
| `toHaveClass("クラス名")` | CSS クラスが付いている |

---

## data-testid について

テストで要素を特定するために `data-testid` 属性を使うことがある。

```tsx
// コンポーネント（QuizCard.tsx）
<video data-testid="video-player" ... />
<div  data-testid="image-placeholder" ... />

// テスト（QuizCard.test.tsx）
screen.getByTestId("video-player")
screen.queryByTestId("image-placeholder")
```

### いつ data-testid を使うか

テキストや role で特定できない場合に使う。

```
優先順位（高い順）:
1. getByRole     — ボタン、リンク、チェックボックスなど
2. getByText     — 画面に表示されているテキスト
3. getByTestId   — 上記で特定できない場合（<video> など）
```

`<video>` 要素は role が定義されていないため、`getByTestId` を使っている。

---

## テスト実行コマンド

```bash
# 全テストを実行
pnpm test

# 特定のファイルだけ実行
pnpm test QuizCard

# ウォッチモード（ファイルを変更するたびに自動実行）
pnpm test --watch
```
