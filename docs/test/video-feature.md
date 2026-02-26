# 動画表示機能のテスト解説

このドキュメントでは、「Q2 に動画を表示する機能」に対して
どんなテストを書いているか・なぜそのテストが必要かを、
テストの基礎用語とあわせて解説する。

---

## テストしている機能の全体像

```
【動画表示機能の処理の流れ】

1. quizData.ts
   └─ Q2 に videoKey: "20260226_1254_..." が設定されている

2. mediaResolver.ts
   └─ resolveVideoUrl(key) → "/video/20260226_1254_....mp4"
      （将来は Cloudinary・Bunny Stream の URL に切り替え可能）

3. quizService.ts（サーバー側）
   └─ getQuestionByIndex(1) → { videoUrl: "/video/..." } を返す
      videoKey がない問題は videoUrl を返さない

4. QuizCard.tsx（ブラウザ側）
   └─ videoUrl があれば <video> を表示
      なければ画像プレースホルダーを表示
```

この 2〜4 のそれぞれをテストしている。

---

## テスト全体マップ

| テストファイル | テストの種類 | テスト対象 | ケース数 |
|-------------|------------|----------|---------|
| `mediaResolver.test.ts` | ユニットテスト | `resolveVideoUrl()` 関数 | 5 |
| `quizService.test.ts` | ユニットテスト（モックあり） | `getQuestionByIndex()` 関数 | 5 |
| `QuizCard.test.tsx` | コンポーネントテスト（RTL） | `QuizCard` コンポーネント | 8 |
| `quiz-video.spec.ts` | E2E テスト（Playwright） | ブラウザ操作全体 | 2 |

---

## テストの基礎用語

### テストの種類（3層構造）

テストには大きく3種類あり、「速さ・信頼性・カバー範囲」のバランスが違う。

```
        /\
       /  \   E2E テスト（Playwright）
      /    \  ・実際のブラウザを動かす
     /      \ ・遅い・壊れやすい・でも最もリアル
    /────────\
   /          \ コンポーネントテスト（RTL）
  /            \ ・仮想 DOM で React を動かす
 /              \ ・中くらいの速さ
/────────────────\
  ユニットテスト（Vitest）
  ・関数だけを単体でテスト
  ・速い・安定している
```

小さいテストをたくさん書き、大きいテストは最小限にするのが基本。
「テストピラミッド」と呼ばれる考え方。

---

### テストの基本構造: describe / it / expect

```ts
describe("テストのグループ名", () => {   // ← 関連するテストをまとめる箱

  it("何をテストするかの説明", () => {   // ← 1つのテストケース（it = "it should..."）

    expect(実際の値).toBe(期待する値);   // ← アサーション（これが核心）

  });
});
```

- **`describe`** ： テストを意味のまとまりでグループ化する。入れ子にできる。
- **`it`** ： 1つのテストケース。「〜のとき〜になる」という文章で書く。
- **`expect`** ： 実際の値が期待通りかを検証する。これが失敗するとテストが赤くなる。

### アサーション（Assertion）

`expect` に続けて書く「〜であること」の条件。

```ts
expect(x).toBe("/video/abc.mp4")        // 完全一致
expect(x).toBeUndefined()               // undefined である
expect(x).toBeNull()                    // null である
expect(x).toContain(".mp4")             // 文字列に ".mp4" が含まれる
expect(x).toHaveProperty("id")          // オブジェクトに "id" キーがある
expect(x).not.toHaveProperty("isCorrect") // "isCorrect" キーがない（.not で逆転）
expect(el).toBeInTheDocument()          // DOM に要素が存在する（jest-dom）
expect(el).toHaveAttribute("src", "...") // 属性値が一致する（jest-dom）
expect(el).toBeDisabled()               // disabled 状態である（jest-dom）
```

---

## テスト1: `mediaResolver.test.ts`（ユニットテスト）

### テスト対象のコード

```ts
// mediaResolver.ts
export function resolveVideoUrl(key: string): string {
  const provider = getVideoProvider(); // VIDEO_PROVIDER 環境変数を読む
  switch (provider) {
    case "cloudinary":
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${key}.mp4`;
    case "bunny":
      return `https://${process.env.BUNNY_HOSTNAME}/${key}.mp4`;
    case "local":
    default:
      return `/video/${key}.mp4`;
  }
}
```

### なぜこのテストが必要か

この関数は「動画をどこから取ってくるか」を決める重要な部分。

- 将来 Cloudinary や Bunny Stream に切り替えるとき、URL の形式が正しいかを確認したい
- 環境変数の設定ミスで間違った URL が生成されないか確認したい
- `key` がどんな文字列でも正しく URL に組み込まれるか確認したい

### 何をテストしているか

```ts
// テスト1: デフォルト動作（環境変数なし）
it("VIDEO_PROVIDER 未設定のとき /video/${key}.mp4 を返す", () => {
  expect(resolveVideoUrl("abc123")).toBe("/video/abc123.mp4");
});
```
→ 何も設定しなくても、`public/video/` フォルダの動画を参照することを確認

```ts
// テスト2: cloudinary への切り替え
it("VIDEO_PROVIDER=cloudinary のとき Cloudinary 動画 URL を返す", () => {
  vi.stubEnv("VIDEO_PROVIDER", "cloudinary");
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "mycloud");
  expect(resolveVideoUrl("abc123")).toBe(
    "https://res.cloudinary.com/mycloud/video/upload/abc123.mp4"
  );
});
```
→ Cloudinary に切り替えたとき、正しい URL 形式になることを確認

```ts
// テスト5: 実際のファイル名でも動作する
it("key が長い文字列でも URL に正しく含まれる", () => {
  const key = "20260226_1254_01kjb86c8mf86rdf15zcrvc52b";
  expect(resolveVideoUrl(key)).toBe(`/video/${key}.mp4`);
});
```
→ 実際に使っている動画ファイル名（長い文字列）でも壊れないことを確認

### 基礎用語: `vi.stubEnv` — 環境変数を一時的に差し替える

```ts
vi.stubEnv("VIDEO_PROVIDER", "cloudinary"); // テスト中だけ書き換え

afterEach(() => {
  vi.unstubAllEnvs(); // テスト後に元の値に戻す ← 必ずセットで書く
});
```

`process.env` を直接書き換えると他のテストに影響するが、
`vi.stubEnv` なら `afterEach` で自動リセットできる。

---

## テスト2: `quizService.test.ts`（ユニットテスト + モック）

### テスト対象のコード

```ts
// quizService.ts
export async function getQuestionByIndex(index: number) {
  const repo = getRepository();           // ← ファイルを読む（外部依存）
  const allQuizzes = await repo.findAllQuestions();
  const quiz = allQuizzes[index];
  if (!quiz) return null;

  return {
    ...
    // videoKey があれば resolveVideoUrl() で URL に変換して渡す
    ...(quiz.videoKey ? { videoUrl: resolveVideoUrl(quiz.videoKey) } : {}),
    ...
  };
}
```

### なぜこのテストが必要か

この関数が「動画機能」における最重要ポイント。

- `videoKey` → `videoUrl` の変換が正しく行われるか
- `videoKey` がない問題に `videoUrl` を誤って付けていないか
- `isCorrect`（正解情報）がクライアントに漏れていないか

特に最後の点は**セキュリティ上重要**。
クライアントに `isCorrect: true` が渡ると、画面を調べて答えがバレてしまう。

### 何をテストしているか

```ts
// テスト1: videoKey → videoUrl 変換
it("videoKey がある問題は videoUrl を含む", async () => {
  const question = await getQuestionByIndex(1); // Q2（videoKey あり）
  expect(question?.videoUrl).toBe("/video/test-video-key.mp4");
});
```
→ `videoKey: "test-video-key"` が `videoUrl: "/video/test-video-key.mp4"` に変換されることを確認

```ts
// テスト2: videoKey なしの問題は videoUrl なし
it("videoKey がない問題は videoUrl が undefined", async () => {
  const question = await getQuestionByIndex(0); // Q1（videoKey なし）
  expect(question?.videoUrl).toBeUndefined();
});
```
→ 動画のない問題に誤って `videoUrl` が付かないことを確認

```ts
// テスト5: 正解情報の非公開
it("choices に isCorrect などサーバー情報が含まれない", async () => {
  const choice = question?.choices[0];
  expect(choice).not.toHaveProperty("isCorrect"); // isCorrect は返さない
  expect(choice).toHaveProperty("id");             // id は返す
  expect(choice).toHaveProperty("text");           // text は返す
});
```
→ クライアントへは `{ id, text }` だけ渡し、正解情報を隠していることを確認

### 基礎用語: `vi.mock` — 外部依存をモック（偽物）に差し替える

```ts
// 「getRepository() を呼んだら偽のリポジトリを返す」という設定
vi.mock("../../../infrastructure/getRepository", () => ({
  getRepository: () => ({
    findAllQuestions: async () => [
      { id: "q1", questionWord: "とら", /* ... */ },
      { id: "q2", videoKey: "test-video-key", /* ... */ },
    ],
  }),
}));
```

**なぜモックが必要か？**

`getQuestionByIndex` は内部で `getRepository()` を呼び、
実際にはファイル (`quizData.ts`) を読む。

テストで実際のファイルを使うと：
- テストデータが変わるたびにテストが壊れる
- 「サービス関数の振る舞い」ではなく「データの内容」をテストしてしまう

モックを使うと：
- テストデータを固定できる
- 関数の振る舞いだけに集中できる
- テストが速く・安定する

**モックとスタブの違い（参考）**

| 用語 | 意味 |
|-----|------|
| **モック（Mock）** | 関数・クラスごと偽物に差し替える（`vi.mock`） |
| **スタブ（Stub）** | 特定の値を返すように差し替える（`vi.stubEnv` など） |
| **スパイ（Spy）** | 本物のまま「何回呼ばれたか」を監視する（`vi.spyOn`） |

---

## テスト3: `QuizCard.test.tsx`（コンポーネントテスト）

### テスト対象のコード

```tsx
// QuizCard.tsx（一部抜粋）
{question.videoUrl ? (
  <video
    src={question.videoUrl}
    controls
    data-testid="video-player"     // ← テストで探すための目印
  />
) : (
  <div data-testid="image-placeholder">  // ← テストで探すための目印
    <ImageIcon />
  </div>
)}
```

### なぜこのテストが必要か

「`videoUrl` があれば動画を表示し、なければプレースホルダーを表示する」
という条件分岐のロジックが正しく動くかを確認する。

ユニットテストでは React コンポーネントの描画は確認できないため、
React Testing Library（RTL）を使って実際に描画して確認する。

### 何をテストしているか

```ts
// 動画表示グループ（videoUrl あり）
it("videoUrl があるとき <video> 要素を表示する", () => {
  renderWithProviders(<QuizCard question={questionWithVideo} />);
  const video = screen.getByTestId("video-player");
  expect(video).toBeInTheDocument(); // DOM に存在する
  expect(video.tagName).toBe("VIDEO"); // タグが本当に <video> である
});

it("videoUrl があるとき src 属性が正しく設定される", () => {
  renderWithProviders(<QuizCard question={questionWithVideo} />);
  const video = screen.getByTestId("video-player");
  expect(video).toHaveAttribute("src", "/video/test-video.mp4");
});

it("videoUrl があるとき画像プレースホルダーは表示しない", () => {
  renderWithProviders(<QuizCard question={questionWithVideo} />);
  expect(screen.queryByTestId("image-placeholder")).not.toBeInTheDocument();
});
```

```ts
// プレースホルダー表示グループ（videoUrl なし）
it("videoUrl がないとき画像プレースホルダーを表示する", () => {
  renderWithProviders(<QuizCard question={questionWithoutVideo} />);
  expect(screen.getByTestId("image-placeholder")).toBeInTheDocument();
});
```

### 基礎用語: `data-testid` — テスト専用の目印

```tsx
<video data-testid="video-player" />
```

```ts
screen.getByTestId("video-player") // テストから探せる
```

`<video>` 要素は `role`（ARIA ロール）が定義されていないため、
`getByRole("video")` のような書き方ができない。
そのため `data-testid` という属性を目印として付けている。

`data-testid` はあくまでテスト用の属性で、ユーザーには見えない。

### 基礎用語: `getByTestId` vs `queryByTestId` の違い

```ts
screen.getByTestId("video-player")
// → 見つからないとエラーになる
// → 「この要素は絶対あるはず」という確認に使う

screen.queryByTestId("image-placeholder")
// → 見つからないと null を返す（エラーにならない）
// → 「この要素はないはず」という確認に使う（.not.toBeInTheDocument() と組み合わせる）
```

### 基礎用語: `beforeEach` と `afterEach`

```ts
// 各テストが始まる前に実行される
beforeEach(() => {
  useQuizStore.getState().reset(); // Zustand の状態をリセット
});

// 各テストが終わった後に実行される
afterEach(cleanup); // 仮想 DOM をリセット
```

**なぜ必要か？**

テストは「どんな順番で実行されても同じ結果になる」必要がある（**テストの独立性**）。

- Zustand ストアはグローバル → 前のテストで選択した選択肢が残る → リセットが必要
- RTL の `render` は DOM に追加するだけ → 前のテストの要素が残る → `cleanup` が必要

### 基礎用語: `renderWithProviders` — Provider でのラップ

```tsx
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

`QuizCard` は内部で `useMutation`（TanStack Query）を使っている。
`useMutation` は `QueryClientProvider` の中でしか動かないため、
テスト時も必ずラップして渡す。

`retry: false` にしているのは、テスト中に API が失敗してもリトライせず
すぐ結果を返してほしいため（デフォルトは3回リトライしてテストが遅くなる）。

---

## テスト4: `quiz-video.spec.ts`（E2E テスト）

### なぜこのテストが必要か

ユニットテストとコンポーネントテストは「パーツ単体」の動作を確認する。
しかし、**パーツが正しくても、組み合わせると壊れることがある**。

E2E テストは実際のブラウザで「ユーザーが操作する一連の流れ」を確認する。
サーバーが動き、画面が描画され、ボタンを押したらAPIが呼ばれる——
この全体を通して確認できるのが E2E テストの強み。

### 何をテストしているか

#### テスト1: Q1 に動画がないことを確認

```ts
test("Q1 では動画が表示されず、画像プレースホルダーが表示される", async ({ page }) => {
  await page.goto("/"); // ブラウザでアクセス

  await expect(page.getByText(/とら/)).toBeVisible();           // Q1 が表示されている
  await expect(page.getByTestId("video-player")).not.toBeVisible(); // 動画はない
  await expect(page.getByTestId("image-placeholder")).toBeVisible(); // プレースホルダーはある
});
```

→ Q1（とら）では動画が出ないことを、ブラウザ上で直接確認

#### テスト2: Q1 → Q2 と進んで動画が出ることを確認

```ts
test("Q1 を回答して Q2 に進むと動画が表示される", async ({ page }) => {
  await page.goto("/");

  // Q1 を回答する
  await page.getByText("おか").click();                         // 「おか」を選択
  await page.getByRole("button", { name: "解答する" }).click(); // 解答ボタン押下
  await expect(page.getByText(/正解|不正解/).first()).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "次の問題へ" }).click(); // 次へ

  // Q2 に動画が表示されていることを確認
  await expect(page.getByText(/あたま/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId("video-player")).toBeVisible();

  const src = await video.getAttribute("src");
  expect(src).toContain(".mp4"); // src が動画ファイルを指している
});
```

→ ユーザーの実際の操作（クリック → 回答 → 次へ）の流れで動画が表示されることを確認

### 基礎用語: `await` — 非同期処理の待機

E2E テストは全て `async/await` で書く。

```ts
test("テスト名", async ({ page }) => {  // async をつける
  await page.goto("/");                 // await でページ読み込み完了を待つ
  await page.getByText("おか").click(); // await でクリック完了を待つ
});
```

ブラウザの操作は時間がかかる（ネットワーク通信・描画など）。
`await` なしで進むと、まだ読み込み中の要素を操作しようとしてエラーになる。

### 基礎用語: `timeout` — 待機の上限時間

```ts
await expect(page.getByText(/正解|不正解/).first()).toBeVisible({ timeout: 5000 });
//                                                                ^^^^^
//                                              最大 5000ms 待つ
```

API レスポンスを待って表示される要素は、描画に時間がかかる。
`timeout` を指定することで「5秒以内に表示されればOK」という意味になる。

### 基礎用語: ロケーター（Locator）

Playwright で要素を特定する方法。

```ts
page.getByText("おか")                       // テキスト内容で探す
page.getByRole("button", { name: "解答する" }) // role とラベルで探す
page.getByTestId("video-player")              // data-testid で探す
```

---

## なぜ4種類のテストが必要なのか（まとめ）

```
┌─────────────────────────────────────────────────────────────────┐
│ テスト1: mediaResolver.test.ts                                    │
│ 「URL 生成の計算が正しいか」                                       │
│ → 最小単位。速くて何度でも実行できる。                               │
│   Cloudinary 切り替えを将来実装したときもここで確認できる。          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ テスト2: quizService.test.ts                                      │
│ 「サーバーが正しい情報を組み立てて返すか」                           │
│ → videoKey → videoUrl 変換が結線されているかを確認。               │
│   正解情報（isCorrect）の漏洩防止も確認できる。                     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ テスト3: QuizCard.test.tsx                                        │
│ 「コンポーネントが正しく描画を切り替えるか」                         │
│ → videoUrl の有無で <video> / プレースホルダーが                   │
│   正しく出し分けされることを確認。                                  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ テスト4: quiz-video.spec.ts                                       │
│ 「ユーザーが実際に操作したとき、全体が正しく動くか」                  │
│ → サーバー・API・ブラウザ全部を通したリアルな確認。                  │
│   一番信頼できるが遅いので最低限だけ書く。                          │
└─────────────────────────────────────────────────────────────────┘
```

テストを4層に分けることで：
- **速い**（ユニットで大部分をカバー）
- **安定**（ユニット・コンポーネントは外部依存なし）
- **信頼できる**（E2E で最終確認）

というバランスが取れる。
