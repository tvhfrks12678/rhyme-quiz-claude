# トランザクションと ACID

---

## トランザクション（Transaction）とは？

複数のデータベース操作を「1つのまとまり」として実行する仕組み。
**全部成功 or 全部失敗** を保証する。

### なぜ必要か？

クイズと選択肢を別々に INSERT するとき、途中でエラーが起きると:

```
quizzes テーブル → INSERT 成功 ✅
choices テーブル → INSERT 失敗 ❌  ← クイズだけ存在して選択肢がない状態に！
```

トランザクションを使えば、選択肢の INSERT が失敗した場合にクイズの INSERT も取り消される（ロールバック）。

### 基本構文

```sql
BEGIN;                          -- トランザクション開始
  INSERT INTO quizzes ...;
  INSERT INTO choices ...;      -- ここで失敗してもトランザクションは自動では終わらない
COMMIT;                         -- 全て成功したら確定

-- ⚠️ SQLite/libSQL では文エラーが起きても自動でロールバックはされない
-- エラーを検知したら、アプリ側で明示的に ROLLBACK を呼ぶ必要がある
-- ROLLBACK;                    -- ← 明示的に呼ばないと以前の成功した INSERT が残る可能性がある
```

> **補足**: `db.transaction()` を使う Drizzle ORM では、コールバック内で例外が投げられると自動で `ROLLBACK` が発行される。生 SQL を直接書く場合は、エラーハンドリングと `ROLLBACK` の明示的な呼び出しが必要。

---

## ACID とは？

トランザクションが保証する4つの性質の頭文字。

| 頭文字 | 名称              | 意味                                       |
|--------|-------------------|--------------------------------------------|
| **A**  | Atomicity（原子性）   | 全て成功 or 全て失敗（中途半端な状態にならない）|
| **C**  | Consistency（一貫性）| 処理前後でデータの整合性が保たれる           |
| **I**  | Isolation（分離性）  | 並行する複数トランザクションが互いに影響しない |
| **D**  | Durability（永続性） | コミットされたデータはシステム障害後も失われない|

### 各性質の具体例

#### A — Atomicity（原子性）

```
クイズ登録処理:
  1. quizzes に INSERT ← 成功
  2. choices に INSERT ← 失敗

Atomicity がなければ: quizzes だけ登録され、選択肢のないクイズが残る ❌
Atomicity があれば : 1 も取り消される。データは元の状態のまま ✅
```

#### C — Consistency（一貫性）

外部キー制約や NOT NULL 制約を守った状態を維持する。

```sql
-- choices.quiz_id は quizzes.id を参照する（外部キー制約）
-- 存在しない quiz_id を INSERT しようとするとエラーになる
INSERT INTO choices (quiz_id, text, ...) VALUES ('存在しないID', 'おか', ...);
-- → エラー: FOREIGN KEY constraint failed
```

#### I — Isolation（分離性）

2人のユーザーが同時に操作しても、互いの変更が干渉しない。

```
ユーザーA: クイズ一覧を取得中...
ユーザーB: 同時に新しいクイズを登録中...

Isolation があれば: A は B の処理が完了する前後どちらかの状態を見る（中途半端な状態は見えない）
```

#### D — Durability（永続性）

COMMIT したデータはサーバーが落ちても消えない。

```
COMMIT 完了 → ディスクに書き込み完了
→ その後サーバーがクラッシュしても、データは復元できる ✅
```

---

## Turso (libSQL) における ACID

このプロジェクトでは **Turso（libSQL）** を DB として使用する。

libSQL は SQLite をベースにしており、**SQLite の ACID 保証をそのまま継承している**。

| 性質 | Turso/libSQL での扱い |
|------|----------------------|
| Atomicity   | BEGIN/COMMIT/ROLLBACK で保証（Drizzle が自動管理）|
| Consistency | 制約（NOT NULL, UNIQUE, FK）が常に適用される |
| Isolation   | SQLite のデフォルト分離レベル（Serializable）で保証 |
| Durability  | ディスク書き込み + Turso のレプリケーションで保証 |

> **ポイント**: Turso は SQLite の ACID を持ちつつ、エッジ環境（Cloudflare Workers 等）への分散配置を可能にするサービス。ACID の概念は従来の RDB と同じように適用される。

---

## Drizzle ORM でのトランザクション（コード例）

Drizzle ORM では `db.transaction()` を使うことで ACID が自動適用される。

### 基本パターン

```typescript
import { db } from '@/infrastructure/db/client';
import { quizzes, choices } from '@/infrastructure/db/schema';

async function createQuizWithChoices(input: {
  questionWord: string;
  questionVowels: string;
  choices: Array<{ text: string; vowels: string; isCorrect: boolean }>;
}) {
  const quizId = `qz_${crypto.randomUUID()}`;

  // db.transaction() → BEGIN を発行し、成功で COMMIT、例外で ROLLBACK
  await db.transaction(async (tx) => {
    // 1. クイズを INSERT（A: 両方成功しないと確定しない）
    await tx.insert(quizzes).values({
      id: quizId,
      questionWord: input.questionWord,
      questionVowels: input.questionVowels,
    });

    // 2. 選択肢を INSERT（ここで例外が出ると 1 も ROLLBACK）
    await tx.insert(choices).values(
      input.choices.map((choice) => ({
        id: `ch_${crypto.randomUUID()}`,
        quizId: quizId,        // C: 存在する quizId のみ（FK 制約）
        text: choice.text,
        vowels: choice.vowels,
        isCorrect: choice.isCorrect,
      }))
    );
  });
  // ↑ ここまで到達 = COMMIT（D: ディスクに永続化）
  //   例外が投げられた場合 = 自動 ROLLBACK（A: 中途半端な状態にならない）

  return quizId;
}
```

### エラー時の動作を確認する

```typescript
await db.transaction(async (tx) => {
  await tx.insert(quizzes).values({ id: 'q1', questionWord: 'とら', ... });

  // 意図的にエラーを発生させる
  throw new Error('何か問題が発生');

  // ↑ この後の INSERT は実行されない
  await tx.insert(choices).values([...]);
});
// → quizzes への INSERT も ROLLBACK される（q1 は存在しない）
```

### ネストしたトランザクション（セーブポイント）

Drizzle/libSQL はネストしたトランザクションを **セーブポイント** で扱う。

内側の `tx.transaction()` が失敗したとき、セーブポイントまで巻き戻すことができる。
ただし、**エラーをキャッチしないと外側のトランザクションまで伝播してしまう**ため、
内側のエラーを外側に伝えたくない場合は `try/catch` で明示的に捕捉する必要がある。

```typescript
await db.transaction(async (tx) => {
  // 外側: クイズを INSERT
  await tx.insert(quizzes).values({ id: 'q1', ... });

  try {
    // ネストした transaction → 内部では SAVEPOINT として扱われる
    await tx.transaction(async (tx2) => {
      await tx2.insert(choices).values([...]);
      // tx2 のコールバックで例外が出ると SAVEPOINT へのロールバックが発生する
    });
  } catch {
    // ここで内側のエラーをキャッチすることで、外側の tx は継続できる
    // → クイズの INSERT は残り、選択肢の INSERT だけが取り消される
    console.error('選択肢の登録に失敗しました（クイズは登録済み）');
  }
});
// try/catch がなければ、tx2 のエラーが外側まで伝播し、tx1 ごとロールバックされる ⚠️
```

---

## このプロジェクトで ACID が必要なケース

| 操作 | ACIDが必要な理由 |
|------|-----------------|
| クイズ登録（quizzes + choices 同時 INSERT）| クイズだけ・選択肢だけが残る状態を防ぐ（Atomicity）|
| クイズ削除（quizzes + choices 同時 DELETE）| 選択肢が孤立したまま残る状態を防ぐ（Atomicity）|
| スコア更新（複数テーブルを跨ぐ UPDATE）   | 中途半端な更新状態を防ぐ（Atomicity + Consistency）|

---

前: [05-drizzle-orm.md — Drizzle ORM の使い方](./05-drizzle-orm.md)
