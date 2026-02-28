# ファサードパターン（Facade Pattern）

## どのパターンか？

**ファサードパターン**は、複数のサブシステムへのアクセスをまとめた「窓口（facade）」を提供する構造パターンです。GoF の23パターンのひとつです。

Facade とはフランス語で「建物の正面（顔）」を意味します。建物の内部構造を隠し、外からは正面だけを見せるイメージです。

---

## 解決する問題

複雑な処理をそのまま呼び出し側に公開すると、呼び出し側がサブシステムの詳細を知る必要が生じます。

```
❌ 呼び出し側が複雑さを知る設計
API ルートが直接:
  1. getRepository() を呼んで
  2. repo.findAllQuestions() を呼んで
  3. インデックスで絞り込んで
  4. resolveImageUrl() を呼んで
  5. 選択肢をシャッフルして
  6. DTOに詰めて返す
  → 全部 API ルートに書くと責任過多になる
```

```
✅ ファサードパターン
API ルートは:
  getQuestionByIndex(index) を呼ぶだけ  ← 1行で済む
                  ↓
  quizService.ts が内部の複雑さを隠蔽
```

---

## 本プロジェクトでの実装

`src/features/quiz/application/services/quizService.ts` がファサードの役割を担っています。

### ファサード（quizService.ts）

```typescript
export async function getQuestionByIndex(
  index: number,
): Promise<QuestionForClient | null> {
  // 1. リポジトリを取得（Factory パターンを利用）
  const repo = getRepository();

  // 2. データ取得
  const allQuizzes = await repo.findAllQuestions();
  const quiz = allQuizzes[index];
  if (!quiz) return null;

  // 3. 選択肢をシャッフル（毎回ランダムな順序）
  const shuffledChoices = quiz.choices
    .map((c) => ({ id: c.id, text: c.text }))
    .sort(() => Math.random() - 0.5);

  // 4. メディアURLを解決（Strategy パターンを利用）
  return {
    id: quiz.id,
    questionWord: quiz.questionWord,
    imageKey: quiz.imageKey,
    ...(quiz.imageKey ? { imageUrl: resolveImageUrl(quiz.imageKey) } : {}),
    ...(quiz.videoKey ? { videoUrl: resolveVideoUrl(quiz.videoKey) } : {}),
    choices: shuffledChoices,
    total: allQuizzes.length,
    index,
  };
}
```

### 呼び出し側（API ルート）

`app/routes/api/quiz/next.ts` は 1 行呼ぶだけで済みます。

```typescript
const question = await getQuestionByIndex(index);
```

内部で Repository、Strategy、シャッフルロジックなどを呼び出していることを呼び出し側は知りません。

---

## 依存関係図

```
[APIルート]
    │ getQuestionByIndex(index) を呼ぶだけ
    ▼
[quizService.ts]  ← ファサード（窓口）
    │
    ├─── getRepository() → JsonQuizRepository
    │         （Repository パターン）
    │
    ├─── resolveImageUrl() → ImageStrategy
    │         （Strategy パターン）
    │
    ├─── resolveVideoUrl() → VideoStrategy
    │         （Strategy パターン）
    │
    └─── judgeAnswer() → 純粋関数
              （Domain Logic）
```

---

## なぜ application/ 層に置くのか？

```
domain/      → ビジネスルール（純粋関数、型定義）
application/ → ユースケースの調整役 ← ここがファサード
infrastructure/ → 外部アクセス（DB, API, JSON）
presentation/ → UI
```

ファサードは「ユースケースを実行するためにサブシステムを調整する」役割なので、
`application/` 層に配置するのが適切です。
また、TanStack Start や Hono などのフレームワークには依存しないため、
将来フレームワークを変えても `quizService.ts` はそのまま使えます。

---

## メリット

| メリット | 説明 |
|---------|------|
| **シンプルな呼び出し** | 呼び出し側は複雑な処理を知らなくてよい |
| **疎結合** | サブシステムの実装変更が呼び出し側に影響しない |
| **テストが容易** | ファサードをモックすれば API ルートのテストが書ける |
| **フレームワーク非依存** | quizService.ts 自体はフレームワークを知らない |
