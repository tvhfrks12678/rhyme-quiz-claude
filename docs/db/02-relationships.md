# リレーションシップ解説

テーブル間の関係（リレーションシップ）を図と SQL で解説する。

---

## ER図（Entity-Relationship Diagram）

```
users                    quizzes                  choices
┌──────────────┐         ┌──────────────────┐     ┌──────────────────┐
│ id (PK)      │         │ id (PK)          │     │ id (PK)          │
│ name         │◄────────│ created_by (FK)  │◄────│ quiz_id (FK)     │
│ email        │  1対多  │ question_word    │1対多│ text             │
│ role         │         │ question_vowels  │     │ vowels           │
│ created_at   │         │ image_key        │     │ is_correct       │
└──────────────┘         │ explanation      │     │ order_index      │
                         │ created_at       │     └──────────────────┘
                         └──────────────────┘
```

---

## 1対多（One-to-Many）の関係

### users と quizzes: 1対多

「1人のユーザーが複数のクイズを投稿できる」

```
user-1 (山田太郎) ──┬── q1 (とら)
                    ├── q2 (くるま)
                    └── q3 (ひかり)

user-2 (佐藤次郎) ──── q4 (なみだ)
```

**SQL での表現**:

```sql
-- 山田太郎が投稿したクイズを取得
SELECT quizzes.*
FROM quizzes
JOIN users ON quizzes.created_by = users.id
WHERE users.name = '山田太郎';
```

### quizzes と choices: 1対多

「1つのクイズが複数の選択肢を持つ」

```
q1 (とら) ──┬── q1-c1 (おか)
            ├── q1-c2 (ぶた)
            ├── q1-c3 (ふぐ)
            └── q1-c4 (さる)
```

**SQL での表現**:

```sql
-- q1 の全選択肢を取得（表示順に並べる）
SELECT *
FROM choices
WHERE quiz_id = 'q1'
ORDER BY order_index;
```

---

## 参照整合性（Referential Integrity）

外部キーが指す先のデータが必ず存在することを保証する仕組み。

### 違反の例

```sql
-- ユーザー user-999 は存在しない
INSERT INTO quizzes (id, created_by, ...)
VALUES ('q10', 'user-999', ...);  -- ← 外部キー制約違反！
```

Turso (libSQL) は SQLite ベースなので、外部キー制約を有効にするために設定が必要:

```sql
PRAGMA foreign_keys = ON;
```

Drizzle ORM では接続時に自動的に設定できる（詳細は [05-drizzle-orm.md](./05-drizzle-orm.md)）。

---

## CASCADE（連鎖）オプション

親レコードを削除したとき、子レコードをどう扱うかを指定できる。

```sql
CREATE TABLE choices (
  id      TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE
  --                                            ↑ クイズを削除すると選択肢も自動削除
);
```

| オプション        | 意味                               |
|-------------------|------------------------------------|
| `ON DELETE CASCADE` | 親を削除すると子も削除される       |
| `ON DELETE RESTRICT` | 子が存在する場合、親を削除できない |
| `ON DELETE SET NULL` | 親を削除すると子の FK が NULL になる |

今回の設計:
- `quizzes` 削除 → `choices` も CASCADE で削除 ✅（クイズなし選択肢は不要）
- `users` 削除 → `quizzes` は RESTRICT（ユーザー削除前にクイズを移管/削除する） ✅

---

## 多対多（Many-to-Many）が必要になるケース

現在の設計では必要ないが、将来「ユーザーが回答履歴を持つ」機能を追加する場合、
**users と quizzes は多対多の関係**になる。

```
user_quiz_answers (中間テーブル)
┌──────────────────────────┐
│ id (PK)                  │
│ user_id (FK → users.id)  │
│ quiz_id (FK → quizzes.id)│
│ is_correct               │
│ answered_at              │
└──────────────────────────┘
```

```
user-1 ──── q1 (正解)
user-1 ──── q2 (不正解)
user-2 ──── q1 (不正解)
user-2 ──── q3 (正解)
```

---

## リレーションシップのまとめ

| 関係                         | 種類   | 実装方法                     |
|------------------------------|--------|------------------------------|
| users → quizzes              | 1対多  | `quizzes.created_by` FK      |
| quizzes → choices            | 1対多  | `choices.quiz_id` FK         |
| users → quizzes（回答履歴）  | 多対多 | 中間テーブル `user_quiz_answers` |

---

次: [03-schema-design.md — スキーマ設計](./03-schema-design.md)
