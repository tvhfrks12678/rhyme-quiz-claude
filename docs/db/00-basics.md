# DB 基礎用語解説

ラップ韻クイズのデータベース設計を学ぶ前に、必要な基礎用語を整理する。

---

## テーブル（Table）

データを格納する表。行（Row）と列（Column）で構成される。

```
users テーブルのイメージ:

| id | name   | email              | role    |
|----|--------|--------------------|---------|
|  1 | 山田太郎 | yamada@example.com | admin   |
|  2 | 鈴木花子 | suzuki@example.com | general |
```

---

## 主キー（Primary Key / PK）

テーブル内で各行を一意に識別する列。重複不可・NULL不可。

```sql
-- id が主キー
CREATE TABLE users (
  id   INTEGER PRIMARY KEY,  -- ← ここが主キー
  name TEXT NOT NULL
);
```

---

## 外部キー（Foreign Key / FK）

別のテーブルの主キーを参照する列。テーブル間の関係を表現する。

```sql
-- quizzes.created_by は users.id を参照する
CREATE TABLE quizzes (
  id         INTEGER PRIMARY KEY,
  question   TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id)  -- ← 外部キー
);
```

---

## インデックス（Index）

検索を高速化するためのデータ構造。本のページの「索引」に相当する。

```sql
-- choices.quiz_id を頻繁に検索するのでインデックスを張る
CREATE INDEX idx_choices_quiz_id ON choices(quiz_id);
```

---

## NULL と NOT NULL

| 制約       | 意味                       |
|------------|----------------------------|
| `NOT NULL` | 必ず値が入る               |
| `NULL`     | 値が未設定でも OK          |

---

## UNIQUE 制約

列の値が重複しないことを保証する。

```sql
-- メールアドレスは重複不可
email TEXT UNIQUE NOT NULL
```

---

## デフォルト値（DEFAULT）

INSERT 時に値を省略した場合に使われる値。

```sql
created_at INTEGER NOT NULL DEFAULT (unixepoch())
-- ← 省略すると現在時刻が入る
```

---

## トランザクション（Transaction）

「全部成功 or 全部失敗」を保証する処理のまとまり。

```sql
BEGIN;
  INSERT INTO quizzes ...;
  INSERT INTO choices ...;  -- ← ここで失敗したら quizzes の INSERT も取り消される
COMMIT;
```

トランザクションが保証する4つの性質 **ACID**（原子性・一貫性・分離性・永続性）や Drizzle ORM でのコード例は [06-transaction-acid.md](./06-transaction-acid.md) で詳しく解説する。

---

## CRUD

データベース操作の4種類。

| 操作   | SQL       | 意味       |
|--------|-----------|------------|
| Create | `INSERT`  | データを追加 |
| Read   | `SELECT`  | データを取得 |
| Update | `UPDATE`  | データを更新 |
| Delete | `DELETE`  | データを削除 |

---

## 正規化（Normalization）

データの重複を排除し、一貫性を保つための設計手法。詳しくは [01-table-design.md](./01-table-design.md) で解説する。

---

## 冗長性（Redundancy）

同じデータが複数箇所に存在する状態。
冗長性が高い → 更新漏れのリスクが高い。
冗長性が低い → 正規化されている。

---

## N+1問題

リストを取得した後、各要素に対して個別にクエリを発行してしまうパフォーマンス問題。
詳しくは [05-drizzle-orm.md](./05-drizzle-orm.md) で解説する。

---

次: [01-table-design.md — テーブル設計と正規化](./01-table-design.md)
