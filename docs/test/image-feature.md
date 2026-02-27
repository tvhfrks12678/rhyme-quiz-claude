# 画像機能のテスト説明

## 概要

問題文に画像を表示する機能（Issue #27）に関するテストの説明。

## テスト対象ファイル

| テストファイル | テスト対象 |
|---|---|
| `src/features/quiz/infrastructure/media/__tests__/mediaResolver.test.ts` | `resolveImageUrl` 関数 |
| `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx` | `QuizCard` コンポーネント（画像表示部分） |
| `e2e/quiz-image.spec.ts` | 画像表示の E2E テスト |

---

## 画像 URL の解決フロー

画像 URL の解決はサーバーサイドで行い、クライアントは解決済みの URL を受け取る。
これは動画（`videoUrl`）と同じパターン。

```
quizData.ts (imageKey: "tora")
    ↓
quizService.ts → resolveImageUrl("tora") → "/images/tora.jpg"
    ↓
API レスポンス (imageUrl: "/images/tora.jpg")
    ↓
QuizCard.tsx → <img src="/images/tora.jpg" />
```

---

## 1. resolveImageUrl ユニットテスト

**ファイル**: `src/features/quiz/infrastructure/media/__tests__/mediaResolver.test.ts`

### 目的

`resolveImageUrl(key)` が `IMAGE_PROVIDER` 環境変数に応じて正しい画像 URL を返すことを確認する。

### テストケース一覧

#### デフォルト動作（`IMAGE_PROVIDER` 未設定）

| テスト | 期待値 |
|---|---|
| `"tora"` を渡す | `"/images/tora.jpg"` |

#### `IMAGE_PROVIDER` が設定されている場合

| `IMAGE_PROVIDER` 値 | テスト | 期待値 |
|---|---|---|
| `local` | `"tora"` を渡す | `"/images/tora.jpg"` |
| `cloudinary` | `"tora"` を渡す（`CLOUDINARY_CLOUD_NAME=mycloud`） | `"https://res.cloudinary.com/mycloud/image/upload/tora.jpg"` |
| 未設定 | `""` を渡す | `""` （空文字） |

### Cloudflare R2 や他のストレージへの切り替え方法

`mediaResolver.ts` に新しい `ImageProvider` を追加し、`IMAGE_PROVIDER` 環境変数で切り替える:

```env
# ローカル開発（デフォルト）
IMAGE_PROVIDER=local

# Cloudinary を使う場合
IMAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Cloudflare R2 に対応する場合は `mediaResolver.ts` に `r2` ケースを追加する。

---

## 2. QuizCard 画像表示テスト

**ファイル**: `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx`

### 目的

`QuizCard` が問題データの内容に応じて正しい要素（`<video>` / `<img>` / プレースホルダー）を表示することを確認する。

### 表示の優先順位

```
videoUrl あり              → <video> を表示
imageUrl あり（動画なし）  → <img> を表示
どちらもなし               → プレースホルダーを表示
```

### テストケース一覧

#### 動画表示（`videoUrl` あり）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| `<video>` が描画される | `video-player` | タグが `VIDEO` であること |
| `src` 属性が正しい | `video-player` | 指定した URL が設定されること |
| 画像プレースホルダーは非表示 | `image-placeholder` | DOM に存在しないこと |

#### 画像表示（`imageUrl` あり・`videoUrl` なし）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| `<img>` が描画される | `question-image` | タグが `IMG` であること |
| `src` 属性が正しい | `question-image` | `/images/tora.jpg` が設定されること |
| `alt` 属性が正しい | `question-image` | `questionWord` が設定されること |
| `<video>` は非表示 | `video-player` | DOM に存在しないこと |
| プレースホルダーは非表示 | `image-placeholder` | DOM に存在しないこと |

#### プレースホルダー表示（`imageUrl` も `videoUrl` もなし）

| テスト | `data-testid` | 確認内容 |
|---|---|---|
| プレースホルダーが表示される | `image-placeholder` | DOM に存在すること |
| `<video>` は非表示 | `video-player` | DOM に存在しないこと |
| `<img>` は非表示 | `question-image` | DOM に存在しないこと |

---

## 3. E2E テスト（Playwright）

**ファイル**: `e2e/quiz-image.spec.ts`

### テストケース一覧

| テスト | 内容 |
|---|---|
| Q1 で画像が表示される | `/images/tora.jpg` の `<img>` が表示されること |
| Q2 では動画が優先される | `<video>` が表示され `<img>` は表示されないこと |

---

## 実行方法

```bash
# ユニット・コンポーネントテスト
pnpm test

# mediaResolver のテストのみ
pnpm test src/features/quiz/infrastructure/media/__tests__/mediaResolver.test.ts

# QuizCard のテストのみ
pnpm test src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx
```

---

## 画像ファイルの配置

現在ローカルで配信している画像:

| imageKey | ファイルパス | 備考 |
|---|---|---|
| `tora` | `public/images/tora.jpg` | 1問目（とら） |

追加する場合は `public/images/{imageKey}.jpg` に配置し、`quizData.ts` の `imageKey` に設定する。
