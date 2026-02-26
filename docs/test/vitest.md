# Vitest テスト解説

## Vitest とは

**Vitest** は Vite 製のテストフレームワーク。
テストファイルを書いて `pnpm test` を実行すると、コードが「期待通りに動くか」を自動で確認してくれる。

---

## テストの実行方法

```bash
pnpm test          # 全テストを1回実行
pnpm test --watch  # ファイルを変更するたびに自動実行（開発中に便利）
```

---

## このプロジェクトにあるテストファイル一覧

| ファイル | 種類 | 何をテストするか |
|---------|------|----------------|
| `src/features/quiz/domain/logic/__tests__/rhyme.test.ts` | ユニット | 母音抽出・正解判定ロジック |
| `src/features/quiz/domain/logic/__tests__/scoring.test.ts` | ユニット | スコア計算・称号ロジック |
| `src/features/quiz/infrastructure/media/__tests__/mediaResolver.test.ts` | ユニット | 動画URLの生成（プロバイダー切り替え） |
| `src/features/quiz/application/services/__tests__/quizService.test.ts` | ユニット（モックあり） | サービス層の videoUrl 解決 |
| `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx` | コンポーネント（RTL） | 動画 / 画像の表示切り替え |

---

## テストの基本構文

```ts
import { describe, it, expect } from "vitest";

describe("グループ名", () => {       // テストをグループにまとめる
  it("テストの説明", () => {         // 1つのテストケース
    expect(実際の値).toBe(期待する値); // アサーション（検証）
  });
});
```

### よく使うアサーション

| 書き方 | 意味 |
|-------|------|
| `expect(x).toBe(y)` | `x === y` であること |
| `expect(x).toBeUndefined()` | `x` が undefined であること |
| `expect(x).toBeNull()` | `x` が null であること |
| `expect(x).toContain(y)` | 配列・文字列が `y` を含むこと |
| `expect(x).toHaveProperty("key")` | オブジェクトに `key` があること |
| `expect(x).not.toHaveProperty("key")` | オブジェクトに `key` がないこと |

---

## ユニットテスト

**「1つの関数だけ」を切り出してテストする**方法。
外部への依存（DB、ファイル、API）がないので、速くて安定している。

### 例: `mediaResolver.test.ts`

```ts
// テスト対象の関数
// resolveVideoUrl("abc123") → "/video/abc123.mp4"

it("VIDEO_PROVIDER 未設定のとき /video/${key}.mp4 を返す", () => {
  expect(resolveVideoUrl("abc123")).toBe("/video/abc123.mp4");
});
```

#### `vi.stubEnv` — 環境変数を一時的に書き換える

実際の環境変数を変えずに、テスト中だけ別の値を設定できる。

```ts
vi.stubEnv("VIDEO_PROVIDER", "cloudinary");
vi.stubEnv("CLOUDINARY_CLOUD_NAME", "mycloud");

// テスト後に元に戻す
afterEach(() => {
  vi.unstubAllEnvs();
});
```

---

## モックを使ったユニットテスト

**「外部依存（DB・ファイル）を偽物に差し替える」**テスト方法。
実際のデータを使わないので、テスト環境がシンプルで済む。

### 例: `quizService.test.ts`

```ts
// getRepository() が返す「偽のリポジトリ」を定義する
vi.mock("../../../infrastructure/getRepository", () => ({
  getRepository: () => ({
    findAllQuestions: async () => [
      { id: "q1", questionWord: "とら", /* ... */ },
      { id: "q2", videoKey: "test-video-key", /* ... */ },
    ],
  }),
}));

// サービス関数をテスト
it("videoKey がある問題は videoUrl を含む", async () => {
  const question = await getQuestionByIndex(1);
  expect(question?.videoUrl).toBe("/video/test-video-key.mp4");
});
```

#### なぜモックが必要か？

- `getQuestionByIndex` は内部で `getRepository()` を呼び、ファイルを読む
- テスト中に実際のファイルを読むと**テストが遅くなる・環境依存になる**
- モックで「偽のデータ」を渡せば、関数の振る舞いだけをテストできる

---

## コンポーネントテスト（React Testing Library）

**「React コンポーネントが正しく描画されるか」**をテストする方法。
実際の DOM に描画して、要素の存在を確認する。

### jsdom とは？

ブラウザ環境を Node.js 上でシミュレートするライブラリ。
`document`、`window` などのブラウザ API が使えるようになる。

ファイル先頭に以下のコメントを書くと、そのファイルだけ jsdom で実行される:

```ts
// @vitest-environment jsdom
```

### 例: `QuizCard.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";

it("videoUrl があるとき <video> 要素を表示する", () => {
  render(<QuizCard question={questionWithVideo} />);

  const video = screen.getByTestId("video-player");
  expect(video).toBeInTheDocument();  // jest-dom のマッチャー
  expect(video.tagName).toBe("VIDEO");
});
```

#### `screen` の主なクエリメソッド

| メソッド | 用途 |
|---------|------|
| `screen.getByTestId("name")` | `data-testid="name"` の要素を取得（見つからないとエラー） |
| `screen.queryByTestId("name")` | 同上（見つからないと `null`、存在しないことの確認に使う） |
| `screen.getByRole("button", { name: "解答する" })` | role とテキストで要素を取得 |
| `screen.getByText(/テキスト/)` | テキスト内容で要素を取得 |
| `screen.getAllByText("テキスト")` | 同名要素が複数ある場合 |

#### `afterEach(cleanup)` — テスト後に DOM をリセット

```ts
import { cleanup } from "@testing-library/react";
afterEach(cleanup); // 各テスト後に DOM を空にする
```

これをしないと、前のテストで描画した要素が残り、次のテストで「複数要素が見つかった」エラーになる。

#### `beforeEach` で Zustand ストアをリセット

```ts
beforeEach(() => {
  useQuizStore.getState().reset(); // Zustand の状態を初期化
});
```

グローバルな状態（Zustand ストア）はテスト間で共有されるため、毎回リセットする。

#### Provider でのラップ

TanStack Query の `useMutation` を使うコンポーネントは `QueryClientProvider` で包む必要がある:

```tsx
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

---

## jest-dom マッチャー

`@testing-library/jest-dom` が提供する追加のアサーション。
`src/test/setup.ts` でインポートしているため、全テストで使える。

| マッチャー | 意味 |
|-----------|------|
| `expect(el).toBeInTheDocument()` | 要素が DOM に存在する |
| `expect(el).not.toBeInTheDocument()` | 要素が DOM に存在しない |
| `expect(el).toHaveAttribute("src", "/video/x.mp4")` | 属性値が一致する |
| `expect(el).toBeDisabled()` | disabled 状態である |
