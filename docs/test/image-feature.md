# 画像機能のテスト説明

## 概要

問題文に画像を表示する機能（Issue #27）に関するテストの説明。

## テスト対象ファイル

| テストファイル | テスト対象 |
|---|---|
| `src/features/quiz/infrastructure/__tests__/imageUrl.test.ts` | `getImageUrl` 関数 |
| `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx` | `QuizCard` コンポーネント（画像表示部分） |

---

## 1. getImageUrl ユニットテスト

**ファイル**: `src/features/quiz/infrastructure/__tests__/imageUrl.test.ts`

### 目的

`getImageUrl(imageKey)` が正しい画像 URL を返すことを確認する。
また、`VITE_IMAGE_BASE_URL` 環境変数で Cloudflare R2 などに切り替えられることを確認する。

### テストケース一覧

#### デフォルト動作（`VITE_IMAGE_BASE_URL` 未設定）

| テスト | 期待値 |
|---|---|
| `"tora"` を渡す | `"/image/tora.jpg"` |
| `"umikaze"` を渡す | `"/image/umikaze.jpg"` |
| `""` を渡す | `""` （空文字） |

#### `VITE_IMAGE_BASE_URL` が設定されている場合

環境変数に `"https://pub-example.r2.dev"` を設定したとき:

| テスト | 期待値 |
|---|---|
| `"tora"` を渡す | `"https://pub-example.r2.dev/tora.jpg"` |
| `""` を渡す | `""` （空文字） |

### Cloudflare R2 への切り替え方法

`.env` ファイルまたはデプロイ設定に以下を追加するだけで画像の配信元を切り替えられる:

```env
VITE_IMAGE_BASE_URL=https://pub-xxxxxxxxxx.r2.dev
```

---

## 2. QuizCard 画像表示テスト

**ファイル**: `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx`

### 目的

`QuizCard` が問題データの内容に応じて正しい要素（`<video>` / `<img>` / プレースホルダー）を表示することを確認する。

### 表示の優先順位

```
videoUrl あり → <video> を表示
imageKey あり（videoUrl なし） → <img> を表示
どちらもなし → プレースホルダーを表示
```

### テストケース一覧

#### 動画表示（`videoUrl` あり）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| `<video>` が描画される | `video-player` | タグが `VIDEO` であること |
| `src` 属性が正しい | `video-player` | 指定した URL が設定されること |
| 画像プレースホルダーは非表示 | `image-placeholder` | DOM に存在しないこと |

#### 画像表示（`imageKey` あり・`videoUrl` なし）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| `<img>` が描画される | `quiz-image` | タグが `IMG` であること |
| `src` 属性が正しい | `quiz-image` | `/image/tora.jpg` が設定されること |
| `alt` 属性が正しい | `quiz-image` | `questionWord` が設定されること |
| `<video>` は非表示 | `video-player` | DOM に存在しないこと |
| プレースホルダーは非表示 | `image-placeholder` | DOM に存在しないこと |

#### プレースホルダー表示（`imageKey` も `videoUrl` もなし）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| プレースホルダーが表示される | `image-placeholder` | DOM に存在すること |
| `<video>` は非表示 | `video-player` | DOM に存在しないこと |
| `<img>` は非表示 | `quiz-image` | DOM に存在しないこと |

---

## 実行方法

```bash
# 全テスト
pnpm test

# imageUrl のみ
pnpm test src/features/quiz/infrastructure/__tests__/imageUrl.test.ts

# QuizCard のみ
pnpm test src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx
```

---

## 画像ファイルの配置

現在ローカルで配信している画像:

| imageKey | ファイルパス |
|---|---|
| `tora` | `public/image/tora.jpg` |

追加する場合は `public/image/{imageKey}.jpg` に配置し、`quizData.ts` の `imageKey` に設定する。
