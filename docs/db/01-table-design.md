# テーブル設計と正規化

ラップ韻クイズに必要なデータを「非正規化」と「正規化」の2パターンで比較する。

---

## 管理するデータの整理

まずアプリが扱うデータを洗い出す。

| データ         | 内容                                         |
|----------------|----------------------------------------------|
| ユーザー       | 一般ユーザー / 管理者ユーザー                |
| クイズ問題     | 問題文、母音、画像キー、解説、投稿者         |
| 選択肢         | テキスト、母音、正解フラグ、表示順、所属問題 |

---

## パターン①: 非正規化（1テーブルにすべてまとめる）

すべてのデータを `quizzes` テーブル1つに詰め込む設計。

```sql
CREATE TABLE quizzes (
  id                   TEXT PRIMARY KEY,         -- 問題ID
  question_word        TEXT NOT NULL,            -- 問題文（例: とら）
  question_vowels      TEXT NOT NULL,            -- 問題の母音（例: おあ）
  image_key            TEXT NOT NULL,            -- 画像キー（例: tora）
  explanation          TEXT NOT NULL,            -- 解説文
  -- 投稿者情報（users テーブルなし）
  created_by_user_id   TEXT NOT NULL,
  created_by_user_name TEXT NOT NULL,            -- ← 冗長！
  created_by_user_role TEXT NOT NULL,            -- ← 冗長！
  -- 選択肢をカラムとして並べる
  choice_1_id          TEXT NOT NULL,
  choice_1_text        TEXT NOT NULL,
  choice_1_vowels      TEXT NOT NULL,
  choice_1_is_correct  INTEGER NOT NULL,         -- 0 or 1
  choice_2_id          TEXT NOT NULL,
  choice_2_text        TEXT NOT NULL,
  choice_2_vowels      TEXT NOT NULL,
  choice_2_is_correct  INTEGER NOT NULL,
  choice_3_id          TEXT NOT NULL,
  choice_3_text        TEXT NOT NULL,
  choice_3_vowels      TEXT NOT NULL,
  choice_3_is_correct  INTEGER NOT NULL,
  choice_4_id          TEXT NOT NULL,
  choice_4_text        TEXT NOT NULL,
  choice_4_vowels      TEXT NOT NULL,
  choice_4_is_correct  INTEGER NOT NULL
);
```

**データ例**:

| id | question_word | created_by_user_name | created_by_user_role | choice_1_text | choice_2_text | ... |
|----|--------------|----------------------|----------------------|--------------|--------------|-----|
| q1 | とら         | 山田太郎             | admin                | おか          | ぶた          | ... |
| q2 | くるま       | 山田太郎             | admin                | つくば        | さくら        | ... |

### 非正規化の問題点

**1. 更新異常（Update Anomaly）**

山田太郎の名前を「山田一郎」に変更するとき → **全クイズの行を更新しなければならない**。
更新漏れが発生するとデータの一貫性が壊れる。

**2. 挿入異常（Insert Anomaly）**

新しい管理者ユーザーを登録するには、必ずクイズも同時に作成しなければならない
（`created_by_user_*` カラムはクイズがないと存在できない）。

**3. 削除異常（Delete Anomaly）**

あるユーザーが作成した最後のクイズを削除すると、そのユーザーの情報も消えてしまう。

**4. 選択肢が4択固定になる**

5択にしたいときは `choice_5_*` カラムを追加する必要がある（ALTER TABLE が必要）。
問題によって選択肢数が変わる要件に対応できない。

---

## パターン②: 正規化（3テーブルに分割）

データを意味のまとまりごとに分割し、外部キーで関係を持たせる設計。

### users テーブル

```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('general', 'admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### quizzes テーブル

```sql
CREATE TABLE quizzes (
  id              TEXT PRIMARY KEY,
  question_word   TEXT NOT NULL,
  question_vowels TEXT NOT NULL,
  image_key       TEXT NOT NULL,
  explanation     TEXT NOT NULL,
  created_by      TEXT NOT NULL REFERENCES users(id),  -- ← 外部キー
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### choices テーブル

```sql
CREATE TABLE choices (
  id          TEXT PRIMARY KEY,
  quiz_id     TEXT NOT NULL REFERENCES quizzes(id),  -- ← 外部キー
  text        TEXT NOT NULL,
  vowels      TEXT NOT NULL,
  is_correct  INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  order_index INTEGER NOT NULL DEFAULT 0  -- 表示順
);
```

**データ例**:

```
users:
| id     | name   | role  |
|--------|--------|-------|
| user-1 | 山田太郎 | admin |

quizzes:
| id | question_word | created_by |
|----|--------------|------------|
| q1 | とら         | user-1     |
| q2 | くるま       | user-1     |

choices:
| id     | quiz_id | text   | vowels | is_correct | order_index |
|--------|---------|--------|--------|------------|-------------|
| q1-c1  | q1      | おか   | おあ   | 1          | 0           |
| q1-c2  | q1      | ぶた   | うあ   | 0          | 1           |
| q1-c3  | q1      | ふぐ   | うう   | 0          | 2           |
| q1-c4  | q1      | さる   | あう   | 0          | 3           |
| q2-c1  | q2      | つくば | ううあ | 1          | 0           |
...
```

---

## 比較まとめ

| 観点               | 非正規化                     | 正規化（3テーブル）         |
|--------------------|------------------------------|-----------------------------|
| 更新の一貫性       | ❌ 重複データの更新漏れリスク | ✅ 1箇所を更新すれば済む     |
| 選択肢数の柔軟性   | ❌ カラム数を変えなければならない | ✅ 行を追加するだけ          |
| クエリの複雑さ     | ✅ SELECT が単純              | ⚠️ JOIN が必要              |
| ユーザー管理       | ❌ ユーザーテーブルがない     | ✅ ユーザーを独立管理できる  |
| 将来の拡張         | ❌ スキーマ変更が頻発         | ✅ テーブルを追加しやすい    |

---

## 正規化の第何形式か？

今回の設計は **第3正規形（3NF）** を満たしている。

| 形式       | 条件                                           |
|------------|------------------------------------------------|
| 第1正規形  | 繰り返しグループを排除（選択肢を別テーブルへ） |
| 第2正規形  | 部分関数従属を排除（複合キーがないので自動的に満たす） |
| 第3正規形  | 推移関数従属を排除（ユーザー名をクイズに直接持たない） |

---

次: [02-relationships.md — リレーションシップ](./02-relationships.md)
