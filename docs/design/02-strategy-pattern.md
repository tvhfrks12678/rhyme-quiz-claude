# ストラテジーパターン（Strategy Pattern）

## どのパターンか？

**ストラテジーパターン**は、アルゴリズム（処理方法）をオブジェクトとして定義し、実行時に切り替えられるようにする振る舞いパターンです。GoF の23パターンのひとつです。

---

## 解決する問題

「条件によって処理を切り替えたい」というケースで `if` や `switch` を使うと、追加するたびにコードが膨れ上がります。

```typescript
// ❌ switch に追加し続ける設計
switch (provider) {
  case "cloudflare-r2":
    return `https://.../${key}.jpg`;
  case "aws-s3":                    // ← 追加のたびにここを変える
    return `https://s3.../${key}`;
  case "local":
  default:
    return `/images/${key}.jpg`;
}
```

新しいプロバイダーを追加するたびに既存コードを修正する必要があり、**開放閉鎖の原則（OCP）** に違反します。

---

## 本プロジェクトでの実装

`src/features/quiz/infrastructure/media/imageResolver.ts` をリファクタリングしました。

### リファクタリング前（switch 版）

```typescript
export function resolveImageUrl(key: string): string {
  const provider = getImageProvider();
  switch (provider) {
    case "cloudflare-r2":
      return `https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}.jpg`;
    case "local":
    default:
      return `/images/${key}.jpg`;
  }
}
```

### リファクタリング後（Strategy パターン版）

```typescript
// Strategy インターフェース：「どう解決するか」の契約
interface ImageStrategy {
  resolve(key: string): string;
}

// 具体的なストラテジー① ローカルファイルを使う
class LocalImageStrategy implements ImageStrategy {
  resolve(key: string): string {
    return `/images/${key}.jpg`;
  }
}

// 具体的なストラテジー② Cloudflare R2 を使う
class CloudflareR2ImageStrategy implements ImageStrategy {
  resolve(key: string): string {
    return `https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}.jpg`;
  }
}

// ストラテジーの登録テーブル（新しいプロバイダーはここに追加するだけ）
const imageStrategies: Record<ImageProvider, ImageStrategy> = {
  local: new LocalImageStrategy(),
  "cloudflare-r2": new CloudflareR2ImageStrategy(),
};

// 公開 API は変わらない
export function resolveImageUrl(key: string): string {
  const provider = getImageProvider();
  return imageStrategies[provider].resolve(key);
}
```

---

## クラス図

```
<<interface>>
ImageStrategy
  + resolve(key: string): string
         ↑ implements
LocalImageStrategy          CloudflareR2ImageStrategy
  resolve() → "/images/..." resolve() → "https://..."

imageStrategies: Record<ImageProvider, ImageStrategy>
  { local: LocalImageStrategy, "cloudflare-r2": CloudflareR2ImageStrategy }
```

---

## 新しいプロバイダーの追加方法

AWS S3 を追加したい場合、**既存コードを一切変更せず**に追加できます。

```typescript
// 1. 新しいストラテジークラスを追加
class AwsS3ImageStrategy implements ImageStrategy {
  resolve(key: string): string {
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}.jpg`;
  }
}

// 2. 型に追加
export type ImageProvider = "local" | "cloudflare-r2" | "aws-s3";

// 3. テーブルに追加
const imageStrategies: Record<ImageProvider, ImageStrategy> = {
  local: new LocalImageStrategy(),
  "cloudflare-r2": new CloudflareR2ImageStrategy(),
  "aws-s3": new AwsS3ImageStrategy(),   // ← ここだけ変更
};
```

既存の `LocalImageStrategy` や `CloudflareR2ImageStrategy` は一切触らなくて済みます。

---

## 関連パターンとの比較

| パターン | 特徴 | 使いどころ |
|---------|------|-----------|
| Strategy | アルゴリズムをオブジェクトとして分離 | 実行時に切り替えたい |
| Template Method | 骨格を定め、詳細をサブクラスに委ねる | 処理の流れは固定したい |
| Factory | オブジェクト生成を分離 | 生成ロジックを隠したい |

---

## メリット

| メリット | 説明 |
|---------|------|
| **開放閉鎖の原則** | 追加は「開放」、既存コードの変更は「閉鎖」 |
| **単一責任の原則** | 各ストラテジーは1つの実装責任だけ持つ |
| **テストが容易** | 各ストラテジーを単独でテストできる |
| **切り替えが安全** | 型システムが全プロバイダーの実装を強制する |
