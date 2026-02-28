# SQLチューニング

パフォーマンスに影響する設計上の判断と、クエリ最適化の考え方を解説する。

---

## このアプリの主要クエリ

まず「どんなクエリが頻繁に発行されるか」を把握する。

| クエリ                                 | 頻度 |
|----------------------------------------|------|
| ランダムにクイズ1件取得                | 高   |
| クイズの選択肢を一括取得               | 高   |
| 特定クイズの正誤判定用データ取得       | 高   |
| 管理者がクイズを投稿                   | 低   |
| ユーザーのクイズ一覧取得               | 低   |

---

## インデックスの設計

### 基本原則

インデックスは「WHERE句、JOIN条件、ORDER BY で使われるカラム」に張る。
ただし書き込みのたびにインデックスも更新されるため、**不要なインデックスは張らない**。

### このアプリで必要なインデックス

```sql
-- choices の最頻出クエリ: WHERE quiz_id = ?
-- → quiz_id にインデックスが必須
CREATE INDEX idx_choices_quiz_id ON choices(quiz_id);

-- quizzes の作成者別絞り込み: WHERE created_by = ?
-- → created_by にインデックスが有効
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

-- 新着順ページング: ORDER BY created_at DESC
-- → 降順インデックスが有効
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);
```

### インデックスの効果を確認する（EXPLAIN）

```sql
-- インデックスが使われているか確認
EXPLAIN QUERY PLAN
SELECT * FROM choices WHERE quiz_id = 'q1';

-- 結果例（インデックスあり）:
-- SEARCH choices USING INDEX idx_choices_quiz_id (quiz_id=?)

-- 結果例（インデックスなし）:
-- SCAN choices
-- ↑ テーブル全件スキャンが走っている = 遅い
```

---

## N+1問題（最重要）

> N+1問題の詳細と Drizzle ORM での解決策は [05-drizzle-orm.md](./05-drizzle-orm.md) を参照。

ここでは SQL レベルで理解する。

### 悪い例: N+1クエリ

```
1回目のクエリ: quizzes を全件取得（N件取得とする）
  SELECT * FROM quizzes;               -- 1回

2〜N+1回目: 各クイズの選択肢を個別取得
  SELECT * FROM choices WHERE quiz_id = 'q1';  -- 1回
  SELECT * FROM choices WHERE quiz_id = 'q2';  -- 1回
  SELECT * FROM choices WHERE quiz_id = 'q3';  -- 1回
  ...（N件のクイズがあれば N 回のクエリ）

合計: 1 + N 回のクエリ
```

クイズが100件あれば101回のクエリが発行される。

### 良い例: JOINで1回にまとめる

```sql
-- クイズと選択肢を一度に取得
SELECT
  q.id            AS quiz_id,
  q.question_word,
  q.question_vowels,
  q.image_key,
  q.explanation,
  c.id            AS choice_id,
  c.text          AS choice_text,
  c.vowels        AS choice_vowels,
  c.is_correct,
  c.order_index
FROM quizzes q
LEFT JOIN choices c ON c.quiz_id = q.id
ORDER BY q.created_at DESC, c.order_index;
```

合計: **1回**のクエリで全データ取得。

---

## ランダムクイズ取得の実装

```sql
-- SQLite / libSQL でのランダム1件取得
SELECT * FROM quizzes
ORDER BY RANDOM()
LIMIT 1;
```

> `ORDER BY RANDOM()` は全件スキャンが必要なため大量データには不向き。
> 件数が増えたら `OFFSET (RANDOM() % total_count)` 方式か、アプリ側でランダム選択を検討。

---

## 複合インデックス

複数カラムを組み合わせた検索に使う。

```sql
-- 「特定ユーザーの最新クイズ」を取得するクエリ
SELECT * FROM quizzes
WHERE created_by = 'user-1'
ORDER BY created_at DESC
LIMIT 10;

-- 複合インデックスで高速化
CREATE INDEX idx_quizzes_user_time
ON quizzes(created_by, created_at DESC);
--           ↑ WHERE      ↑ ORDER BY
```

**複合インデックスのルール**: 左から順に使われる（「created_by だけで検索」も有効だが「created_at だけで検索」にはこのインデックスは使われない）。

---

## トランザクションによる整合性

クイズと選択肢を同時に追加するとき、どちらかが失敗した場合に中途半端な状態にならないようにする。

```sql
BEGIN;
  INSERT INTO quizzes (id, question_word, question_vowels, image_key, explanation, created_by)
  VALUES ('q6', 'やま', 'ああ', 'yama', '「やま」の母音は「あああ」...', 'user-1');

  INSERT INTO choices (id, quiz_id, text, vowels, is_correct, order_index) VALUES
    ('q6-c1', 'q6', 'かな', 'あああ', 1, 0),
    ('q6-c2', 'q6', 'さく', 'あう', 0, 1),
    ('q6-c3', 'q6', 'ひと', 'いお', 0, 2),
    ('q6-c4', 'q6', 'うえ', 'うえ', 0, 3);
COMMIT;
-- どちらかが失敗すれば ROLLBACK されてどちらも保存されない
```

---

## パフォーマンス観点のまとめ

| 対策                         | 効果                                               |
|------------------------------|----------------------------------------------------|
| `choices.quiz_id` インデックス | 選択肢取得クエリが O(N) → O(log N) 相当に改善      |
| JOIN で1回クエリ              | N+1 問題を回避                                     |
| トランザクション              | データ整合性の保証（パフォーマンスより正確性）      |
| 適切な LIMIT                 | 大量データの誤取得を防ぐ                           |

---

次: [05-drizzle-orm.md — Drizzle ORM実装](./05-drizzle-orm.md)
