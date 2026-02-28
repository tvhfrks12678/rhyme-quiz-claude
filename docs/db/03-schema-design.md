# スキーマ設計（正規化・冗長性を意識）

正規化と冗長性のバランスを取った、このアプリの最終スキーマを定義する。

---

## 設計方針

1. **第3正規形（3NF）を基本とする** — データの重複を排除
2. **必要な冗長性は許容する** — JOINが多すぎてパフォーマンスが悪化するなら非正規化も検討
3. **外部キー制約で整合性を保証する**
4. **インデックスは「検索条件になるカラム」に張る**

---

## 完全なスキーマ定義（SQL）

### users テーブル

```sql
CREATE TABLE users (
  id         TEXT    PRIMARY KEY,               -- UUID (例: 'usr_01HXYZ...')
  name       TEXT    NOT NULL,                  -- 表示名
  email      TEXT    UNIQUE NOT NULL,           -- ログイン用メールアドレス
  role       TEXT    NOT NULL DEFAULT 'general' -- 'general' | 'admin'
               CHECK (role IN ('general', 'admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())  -- Unix タイムスタンプ（秒）
);
```

**設計上の決定**:
- `id` に UUID（Text型）を使用: 連番だと総件数が推測されるためセキュリティ上好ましくない
- `role` を CHECK 制約で列挙: 想定外の値を弾く
- `email` を UNIQUE: 同じメールで複数アカウントを防ぐ

---

### quizzes テーブル

```sql
CREATE TABLE quizzes (
  id              TEXT    PRIMARY KEY,           -- 例: 'qz_01HXYZ...'
  question_word   TEXT    NOT NULL,              -- 問題文（例: 'とら'）
  question_vowels TEXT    NOT NULL,              -- 問題の母音（例: 'おあ'）
  image_key       TEXT    NOT NULL,              -- 画像ファイル名のキー（例: 'tora'）
  explanation     TEXT    NOT NULL,              -- 解説文
  created_by      TEXT    NOT NULL
                    REFERENCES users(id)
                    ON DELETE RESTRICT,          -- ユーザー削除を制限
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 投稿者でフィルタするクエリを高速化
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

-- 新着順取得を高速化
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);
```

**設計上の決定**:
- `question_vowels` は `quizzes` に直接持つ: 問題判定に常に必要なため JOIN 不要にする（意図的な冗長性）
- `ON DELETE RESTRICT`: ユーザーが削除されてもクイズは残す（ユーザー削除時はまずクイズを別ユーザーに移管する運用を想定）

---

### choices テーブル

```sql
CREATE TABLE choices (
  id          TEXT    PRIMARY KEY,              -- 例: 'ch_01HXYZ...'
  quiz_id     TEXT    NOT NULL
                REFERENCES quizzes(id)
                ON DELETE CASCADE,             -- クイズ削除時に選択肢も一括削除
  text        TEXT    NOT NULL,                -- 選択肢テキスト（例: 'おか'）
  vowels      TEXT    NOT NULL,                -- 選択肢の母音（例: 'おあ'）
  is_correct  INTEGER NOT NULL DEFAULT 0
                CHECK (is_correct IN (0, 1)), -- 0: 不正解, 1: 正解
  order_index INTEGER NOT NULL DEFAULT 0      -- 表示順（0始まり）
);

-- クイズの選択肢取得（最頻出クエリ）を高速化
CREATE INDEX idx_choices_quiz_id ON choices(quiz_id);
```

---

## テーブル間の依存関係

```
users
  └── quizzes (created_by → users.id)
        └── choices (quiz_id → quizzes.id)
```

削除の安全な順序: `choices` → `quizzes` → `users`

---

## 意図的な冗長性について

### `question_vowels` をクイズテーブルに持つ理由

正答判定フローを思い出す:

```
1. GET /api/quiz/next   → quizzes を取得（question_word だけ返せばよい）
2. POST /api/quiz/:id/submit → 正誤判定のために question_vowels が必要
```

`question_vowels` をクイズテーブルに持たない場合、判定のたびにどこかから母音を計算/取得する必要がある。
この値はクイズ作成時に確定し、変更されない（「とら」の母音は常に「おあ」）ため、
**計算済みの値をキャッシュ的に保持する** のは合理的な設計。

---

## 冗長性を排除した箇所

| 排除した冗長性                          | 理由                                       |
|-----------------------------------------|--------------------------------------------|
| クイズ行に投稿者名を直接持たない        | ユーザー名変更時に全クイズ行の更新が必要になるため |
| 選択肢をカラムで並べない                | 選択肢数変更時にスキーマ変更が必要になるため |

---

## カラム型の選択指針（Turso / libSQL）

Turso は SQLite ベースなので型が少ない:

| 用途               | 使う型    | 理由                                      |
|--------------------|-----------|-------------------------------------------|
| ID（UUID）         | `TEXT`    | UUID は文字列                             |
| 文字列             | `TEXT`    |                                           |
| フラグ（true/false）| `INTEGER` | SQLite に BOOLEAN がない。0 or 1 で表現  |
| 日時               | `INTEGER` | Unix タイムスタンプ（秒）が扱いやすい     |
| 小数               | `REAL`    | スコアの割合など                          |

---

## スキーマ全体の俯瞰

```
┌─────────────┐         ┌──────────────────────────┐
│   users     │         │        quizzes           │
├─────────────┤         ├──────────────────────────┤
│ id (PK)     │◄────────│ id (PK)                  │
│ name        │  1 : N  │ created_by (FK)          │
│ email       │         │ question_word            │
│ role        │         │ question_vowels  ← 冗長 ✅│
│ created_at  │         │ image_key                │
└─────────────┘         │ explanation              │
                        │ created_at               │
                        └──────────┬───────────────┘
                                   │ 1 : N
                        ┌──────────▼───────────────┐
                        │        choices           │
                        ├──────────────────────────┤
                        │ id (PK)                  │
                        │ quiz_id (FK)             │
                        │ text                     │
                        │ vowels                   │
                        │ is_correct               │
                        │ order_index              │
                        └──────────────────────────┘
```

---

次: [04-sql-tuning.md — SQLチューニング](./04-sql-tuning.md)
