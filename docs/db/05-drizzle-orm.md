# Drizzle ORM 実装解説

Drizzle ORM を使ったスキーマ定義・クエリ実装を、1行ずつ解説する。

---

## Drizzle ORM とは

- TypeScript ファーストの ORM（Object Relational Mapper）
- SQL に近い書き方ができる（「SQL のように書ける TypeScript」）
- 型安全: スキーマから型が自動生成される
- Turso (libSQL / SQLite) に公式対応

---

## セットアップ

```bash
# パッケージのインストール
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

---

## ① スキーマ定義

`src/features/quiz/infrastructure/db/schema.ts`

```typescript
// drizzle-orm/libsql から SQLite 用のカラム定義ヘルパーをインポート
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ───────────────────────────────────────────────
// users テーブル
// ───────────────────────────────────────────────

export const users = sqliteTable("users", {
  // text("id") → TEXT 型の "id" カラムを定義
  // .primaryKey() → このカラムが主キー
  id: text("id").primaryKey(),

  // .notNull() → NULL を禁止（必須項目）
  name: text("name").notNull(),

  // .unique() → 重複を禁止
  email: text("email").unique().notNull(),

  // .default("general") → INSERT 時に省略したら "general" が入る
  role: text("role", { enum: ["general", "admin"] })
    .notNull()
    .default("general"),
  //   ↑ { enum: [...] } で TypeScript 側の型も "general" | "admin" に絞れる

  // sql`(unixepoch())` → SQL の関数を直接呼ぶ（現在時刻の Unix 秒）
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  //             ↑ $defaultFn → TypeScript 側でデフォルト値を生成する関数
});

// ───────────────────────────────────────────────
// quizzes テーブル
// ───────────────────────────────────────────────

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  questionWord: text("question_word").notNull(),
  questionVowels: text("question_vowels").notNull(),
  imageKey: text("image_key").notNull(),
  explanation: text("explanation").notNull(),

  // references(() => users.id) → users.id への外部キー
  // () => で遅延評価することで循環参照エラーを防ぐ
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ───────────────────────────────────────────────
// choices テーブル
// ───────────────────────────────────────────────

export const choices = sqliteTable("choices", {
  id: text("id").primaryKey(),

  // ON DELETE CASCADE: クイズ削除時に選択肢も自動削除
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  //                               ↑ onDelete オプションで CASCADE を指定

  text: text("text").notNull(),
  vowels: text("vowels").notNull(),

  // integer("is_correct", { mode: "boolean" }) → 内部は 0/1 だが TypeScript では boolean に見える
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),

  orderIndex: integer("order_index").notNull().default(0),
});

// ───────────────────────────────────────────────
// TypeScript 型を自動生成
// ───────────────────────────────────────────────

// テーブルから INSERT/SELECT 時の型を導出
// typeof users.$inferSelect → SELECT 結果の型 { id: string; name: string; ... }
// typeof users.$inferInsert → INSERT 用の型（nullable フィールドが optional になる）
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type Choice = typeof choices.$inferSelect;
export type NewChoice = typeof choices.$inferInsert;
```

---

## ② DB接続

`src/features/quiz/infrastructure/db/client.ts`

```typescript
// createClient → Turso (libSQL) への接続を作る
import { createClient } from "@libsql/client";

// drizzle → Drizzle ORM のメインエントリ（libSQL 用アダプター）
import { drizzle } from "drizzle-orm/libsql";

// スキーマをインポート（Drizzle がテーブル定義を認識するために必要）
import * as schema from "./schema";

// libSQL クライアントを作成
// url と authToken は環境変数から読む（Cloudflare Pages の場合は env.TURSO_URL）
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  // !  → TypeScript に「undefined にはならない」と伝えるキャスト（非 null アサーション）
  authToken: process.env.TURSO_AUTH_TOKEN,
  // authToken はローカル開発では不要（省略可）
});

// Drizzle インスタンスを作成してエクスポート
// { schema } を渡すことで db.query.quizzes.findMany() のような Relational Query が使えるようになる
export const db = drizzle(client, { schema });
```

---

## ③ 基本的なクエリ

### クイズ1件をランダムに取得

```typescript
import { db } from "../db/client";
import { quizzes } from "../db/schema";
import { sql } from "drizzle-orm";
// sql → 生 SQL を TypeScript の中に埋め込むためのタグ付きテンプレートリテラル

async function getRandomQuiz() {
  const result = await db
    .select()
    // .select() → SELECT * に相当。引数に { id: quizzes.id } のように渡すと SELECT id だけになる
    .from(quizzes)
    // .from(quizzes) → FROM quizzes に相当
    .orderBy(sql`RANDOM()`)
    // .orderBy(sql`RANDOM()`) → ORDER BY RANDOM() に相当（SQLite でのランダム順）
    .limit(1);
    // .limit(1) → LIMIT 1 に相当

  // result は Quiz[] 型（配列）なので最初の要素を取得
  return result[0] ?? null;
}
```

---

## ④ N+1問題とその解決

### 問題: N+1クエリになってしまうコード

```typescript
// ❌ 悪い例: クイズごとに選択肢クエリを発行してしまう
async function getAllQuizzesWithChoicesBad() {
  // クエリ 1回目: 全クイズ取得
  const allQuizzes = await db.select().from(quizzes);
  // ↑ SELECT * FROM quizzes → N件取得

  // ループの中でクエリを発行 → N回のクエリ
  const result = await Promise.all(
    allQuizzes.map(async (quiz) => {
      // クエリ 2〜N+1回目: 各クイズの選択肢を取得
      const quizChoices = await db
        .select()
        .from(choices)
        .where(eq(choices.quizId, quiz.id));
      //       ↑ SELECT * FROM choices WHERE quiz_id = ?
      //       クイズの数だけこのクエリが走る = N+1問題

      return { ...quiz, choices: quizChoices };
    })
  );
  return result;
}
// クイズが 100 件あれば → 1 + 100 = 101 回のクエリ 🔥
```

---

### 解決策①: JOIN を使って1クエリにまとめる

```typescript
import { db } from "../db/client";
import { quizzes, choices } from "../db/schema";
import { eq } from "drizzle-orm";
// eq → Equal（等号）条件を作るヘルパー。eq(choices.quizId, quizzes.id) → choices.quiz_id = quizzes.id

async function getAllQuizzesWithChoicesJoin() {
  // LEFT JOIN で一度に取得
  const rows = await db
    .select({
      // 取得するカラムを明示的に指定
      // キー名は任意（TypeScript での変数名になる）
      quizId: quizzes.id,
      questionWord: quizzes.questionWord,
      questionVowels: quizzes.questionVowels,
      imageKey: quizzes.imageKey,
      explanation: quizzes.explanation,
      choiceId: choices.id,
      choiceText: choices.text,
      choiceVowels: choices.vowels,
      choiceIsCorrect: choices.isCorrect,
      choiceOrderIndex: choices.orderIndex,
    })
    .from(quizzes)
    // .leftJoin(対象テーブル, JOIN条件)
    // LEFT JOIN: クイズに選択肢がなくても クイズ行は返す（choices.* は null になる）
    .leftJoin(choices, eq(choices.quizId, quizzes.id))
    //                  ↑ ON choices.quiz_id = quizzes.id
    .orderBy(quizzes.createdAt, choices.orderIndex);
    // ORDER BY quizzes.created_at, choices.order_index

  // JOIN結果はフラットな行の配列なので、グループ化が必要
  // 例: q1 の行が4行（選択肢4つ分）× クイズ数 だけ返ってくる
  return groupQuizRows(rows);
}

// フラットな行を「クイズ + 選択肢の配列」構造に変換するヘルパー
function groupQuizRows(rows: typeof result) {
  const map = new Map<string, { quiz: Quiz; choices: Choice[] }>();

  for (const row of rows) {
    if (!map.has(row.quizId)) {
      // まだこのクイズIDが登場していなければエントリを作成
      map.set(row.quizId, {
        quiz: { id: row.quizId, questionWord: row.questionWord, ... },
        choices: [],
      });
    }

    if (row.choiceId !== null) {
      // choiceId が null でなければ（LEFT JOIN で一致した場合）選択肢を追加
      map.get(row.quizId)!.choices.push({
        id: row.choiceId,
        text: row.choiceText!,
        ...
      });
    }
  }

  return [...map.values()];
}
// クエリ合計: 1回 ✅
```

---

### 解決策②: Drizzle Relational Queries（推奨）

Drizzle の「Relational Queries」は、JOIN と グループ化を自動でやってくれる高レベル API。

**まずリレーションを定義する** (`schema.ts` に追記):

```typescript
import { relations } from "drizzle-orm";
// relations → テーブル間のリレーション定義ヘルパー

// quizzes のリレーション定義
export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
  // many("choices") → quizzes は choices を「多」持つ
  choices: many(choices),
  // one(users, ...) → quizzes は users を「一」参照する
  creator: one(users, {
    fields: [quizzes.createdBy],
    // fields → 自テーブル側の外部キーカラム
    references: [users.id],
    // references → 参照先テーブルの主キーカラム
  }),
}));

// choices のリレーション定義
export const choicesRelations = relations(choices, ({ one }) => ({
  // one(quizzes, ...) → choices は quizzes を「一」参照する
  quiz: one(quizzes, {
    fields: [choices.quizId],
    references: [quizzes.id],
  }),
}));

// users のリレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  // many(quizzes) → users は quizzes を「多」持つ
  quizzes: many(quizzes),
}));
```

**Relational Queries でのクエリ**:

```typescript
async function getAllQuizzesWithChoicesRelational() {
  // db.query.quizzes → schema で定義した quizzes テーブルへのクエリビルダー
  const result = await db.query.quizzes.findMany({
    // with: 一緒に取得するリレーションを指定
    with: {
      // choices: true → choices を全件取得
      choices: {
        // orderBy で選択肢の表示順を指定
        orderBy: (choices, { asc }) => [asc(choices.orderIndex)],
      },
      // creator: true → 投稿者情報も取得
      creator: {
        // columns で取得するカラムを制限（パスワード等を隠す用途にも使える）
        columns: { id: true, name: true, role: true },
      },
    },
    // orderBy で最新順に並べる
    orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
  });

  // result の型:
  // {
  //   id: string;
  //   questionWord: string;
  //   ...
  //   choices: { id: string; text: string; ... }[];  ← 自動的に配列になる
  //   creator: { id: string; name: string; role: "general" | "admin" };
  // }[]

  return result;
}
// クエリ合計: 内部で最適化された 1〜2 回のクエリ ✅
```

---

## ⑤ 特定クイズの取得（1件）

```typescript
import { eq } from "drizzle-orm";

async function getQuizById(id: string) {
  // findFirst → 1件だけ取得（配列ではなく単一オブジェクトを返す）
  const quiz = await db.query.quizzes.findFirst({
    // where → 絞り込み条件
    // eq(quizzes.id, id) → WHERE quizzes.id = id に相当
    where: eq(quizzes.id, id),
    with: {
      choices: {
        orderBy: (choices, { asc }) => [asc(choices.orderIndex)],
      },
    },
  });

  // quiz は QuizWithChoices | undefined
  // undefined の場合は 404 エラー処理をする
  return quiz ?? null;
}
```

---

## ⑥ クイズ投稿（管理者のみ）

```typescript
import { db } from "../db/client";
import { quizzes, choices } from "../db/schema";

async function createQuiz(input: {
  questionWord: string;
  questionVowels: string;
  imageKey: string;
  explanation: string;
  createdBy: string;
  choices: Array<{
    text: string;
    vowels: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
}) {
  // crypto.randomUUID() → ランダムな UUID を生成（例: 'qz_01abc...'）
  const quizId = `qz_${crypto.randomUUID()}`;

  // db.transaction() → BEGIN / COMMIT / ROLLBACK を自動管理
  // tx（transaction）は db と同じインターフェースを持つ
  await db.transaction(async (tx) => {
    // クイズを INSERT
    await tx.insert(quizzes).values({
      id: quizId,
      questionWord: input.questionWord,
      questionVowels: input.questionVowels,
      imageKey: input.imageKey,
      explanation: input.explanation,
      createdBy: input.createdBy,
    });
    // ↑ INSERT INTO quizzes (...) VALUES (...) に相当

    // 選択肢を一括 INSERT
    await tx.insert(choices).values(
      input.choices.map((choice, index) => ({
        id: `ch_${crypto.randomUUID()}`,
        quizId: quizId,
        text: choice.text,
        vowels: choice.vowels,
        isCorrect: choice.isCorrect,
        orderIndex: choice.orderIndex ?? index,
      }))
    );
    // ↑ INSERT INTO choices (...) VALUES (...), (...), (...), (...) に相当
    // 配列を渡すと1回のクエリで複数行を INSERT できる
  });
  // ここまで到達すれば COMMIT、例外が投げられれば自動 ROLLBACK

  return quizId;
}
```

---

## ⑦ 正誤判定用のデータ取得

```typescript
async function getQuizForJudge(quizId: string) {
  // 正誤判定に必要なデータ（母音、正解フラグ）を取得
  return await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: {
      choices: {
        // columns で不要なカラムを省略してデータ量を減らす
        columns: {
          id: true,
          vowels: true,
          isCorrect: true,
        },
        // ↑ text や orderIndex は判定に不要なので取得しない
      },
    },
    columns: {
      id: true,
      questionVowels: true,
      explanation: true,
    },
    // ↑ image_key や created_by 等は判定に不要
  });
}
```

---

## ⑧ 外部キー制約の有効化（Turso 接続時）

SQLite / libSQL はデフォルトで外部キー制約が無効。接続時に有効化が必要。

```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
export const db = drizzle(client, { schema });

// 外部キー制約を有効化（接続後すぐに実行）
// PRAGMA foreign_keys = ON → SQLite の外部キー制約を有効にする設定
await db.run(sql`PRAGMA foreign_keys = ON`);
```

---

## まとめ

| やること               | Drizzle のコード                          |
|------------------------|-------------------------------------------|
| スキーマ定義           | `sqliteTable()` + カラム定義ヘルパー      |
| 型の自動生成           | `$inferSelect` / `$inferInsert`           |
| 全件取得               | `db.select().from(table)`                 |
| 条件付き取得           | `.where(eq(table.col, value))`            |
| リレーション付き取得   | `db.query.table.findMany({ with: {...} })` |
| 挿入                   | `db.insert(table).values({...})`          |
| トランザクション       | `db.transaction(async (tx) => {...})`     |
| N+1の回避              | `with:` を使った Relational Query         |

---

前: [04-sql-tuning.md](./04-sql-tuning.md)
