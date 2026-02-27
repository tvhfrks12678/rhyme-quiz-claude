# 画像機能のテスト解説

## 概要

クイズ問題に画像を表示する機能のテストについて説明します。
画像の URL 解決（`imageResolver`）と画像の表示ロジック（`QuizCard`）の2つをテストします。

---

## 1. imageResolver のテスト

**ファイル**: `src/features/quiz/infrastructure/media/__tests__/imageResolver.test.ts`

### テスト対象

`resolveImageUrl(key: string): string` 関数。
環境変数 `IMAGE_PROVIDER` に応じて異なる URL を生成する。

### 画像プロバイダー一覧

| プロバイダー | 説明 | URL 例 |
|---|---|---|
| `local`（デフォルト） | `public/images/` 以下のファイルを参照 | `/images/tora.jpg` |
| `cloudflare-r2` | Cloudflare R2 パブリックバケットを参照 | `https://{R2_URL}/tora.jpg` |

### 環境変数

| 変数名 | 説明 | 例 |
|---|---|---|
| `IMAGE_PROVIDER` | 使用するプロバイダー（省略時は `local`） | `cloudflare-r2` |
| `CLOUDFLARE_R2_PUBLIC_URL` | R2 パブリックバケットのドメイン | `pub-abc123.r2.dev` |

### テストケース

| テスト名 | 検証内容 |
|---|---|
| IMAGE_PROVIDER 未設定 | ローカルパス `/images/tora.jpg` を返す |
| IMAGE_PROVIDER=local | ローカルパス `/images/tora.jpg` を返す |
| IMAGE_PROVIDER=cloudflare-r2 | `https://{R2_URL}/tora.jpg` を返す |
| 異なる imageKey | key がそのまま URL に含まれることを確認 |
| 別ドメインの R2 | カスタムドメインでも正しく URL を構築できる |

### なぜこのテストが必要か

`imageResolver` は将来 Cloudflare R2 へ移行する際の差し替えポイントです。
環境変数を切り替えるだけで本番環境とローカルの動作を分けられることを保証します。
`vi.stubEnv()` で環境変数を一時的に書き換え、テスト後に `vi.unstubAllEnvs()` でリセットします。

---

## 2. QuizCard の画像表示テスト

**ファイル**: `src/features/quiz/presentation/parts/__tests__/QuizCard.test.tsx`

### 表示ロジック

| 条件 | 表示内容 | testid |
|---|---|---|
| `videoUrl` あり | `<video>` 要素 | `video-player` |
| `imageUrl` あり（videoUrl なし） | `<img>` 要素 | `image-display` |
| `imageUrl` の読み込みエラー | 画像プレースホルダー | `image-placeholder` |
| どちらもなし | 画像プレースホルダー | `image-placeholder` |

### テストケース（画像表示グループ）

| テスト名 | 検証内容 |
|---|---|
| imageUrl があるとき `<img>` を表示する | `image-display` testid で `<IMG>` タグを確認 |
| src 属性が正しく設定される | `src="/images/tora.jpg"` を確認 |
| alt 属性が questionWord に設定される | `alt="とら"` を確認（アクセシビリティ） |
| 画像プレースホルダーは表示しない | `image-placeholder` が DOM にないことを確認 |
| `<video>` 要素は表示しない | `video-player` が DOM にないことを確認 |
| 画像読み込みエラー時にプレースホルダーを表示する | `fireEvent.error(img)` でエラーをシミュレート |

### 画像読み込みエラーのテスト

jsdom 環境では実際の画像ファイルを読み込まないため、`fireEvent.error(img)` で `onError` イベントを手動発火します。
これにより画像が存在しないサーバー環境でもプレースホルダーにフォールバックすることを保証します。

---

## 3. 現在の画像ファイル配置

```
public/
└── images/
    └── tora.jpg   ← Q1（とら）の画像
```

将来的には Cloudflare R2 にすべての画像をアップロードし、
`IMAGE_PROVIDER=cloudflare-r2` に設定することでローカルファイルなしで動作します。
