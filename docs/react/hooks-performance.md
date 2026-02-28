# React パフォーマンス最適化 — useCallback / useMemo / React.memo

## なぜパフォーマンス最適化が必要か

React のコンポーネントは、以下のいずれかが起きると**再レンダリング**される：

1. 自身の state が更新された
2. 親コンポーネントが再レンダリングされた
3. Context の値が更新された

再レンダリングのたびに、コンポーネント内で定義された**関数や計算が毎回再生成・再実行**される。
これが頻繁に起きると、パフォーマンスが低下する場合がある。

---

## useCallback とは

関数をメモ化（キャッシュ）して、依存配列の値が変わらない限り同じ関数参照を返すフック。
子コンポーネントへの不要な再レンダリングを防ぐために使う。

### 基本構文

```typescript
const メモ化された関数 = useCallback(() => {
  // 処理
}, [依存する値]);
```

### このプロジェクトでの使用箇所

このプロジェクトでは直接 `useCallback` を使っていないが、
イベントハンドラを子コンポーネントに渡す場面で活用できる。

---

## useCallback のコード例

```typescript
import { useCallback, useState, memo } from "react";

// Props の型定義
type ButtonProps = {
  onClick: () => void;  // クリック時のコールバック
  label: string;        // ボタンのラベル
};

// memo で囲む → props が変わらない限り再レンダリングをスキップする
const ExpensiveButton = memo(({ onClick, label }: ButtonProps) => {
  console.log(`${label} ボタンがレンダリングされました`);  // 再レンダリング確認用
  return <button onClick={onClick}>{label}</button>;
});

const Parent = () => {
  const [count, setCount] = useState<number>(0);
  const [text, setText] = useState<string>("");

  // ✕ useCallback なし → Parent が再レンダリングされるたびに新しい関数が生成される
  //   → memo した子コンポーネントも再レンダリングされてしまう
  // const handleClick = () => { setCount((prev) => prev + 1); };

  // ◯ useCallback で関数参照をメモ化する
  const handleClick = useCallback(() => {
    setCount((prev) => prev + 1);  // count を +1 する
  }, []);
  // ↑ 依存配列が空 → 初回作成された関数参照がずっと使い回される
  //   setText を呼んで text が変わっても handleClick の参照は変わらない
  //   → ExpensiveButton は再レンダリングされない

  return (
    <div>
      <p>カウント: {count}</p>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <ExpensiveButton onClick={handleClick} label="カウントアップ" />
    </div>
  );
};
```

---

## useMemo とは

計算コストの高い値をメモ化し、依存配列が変わらない限り再計算をスキップするフック。

| フック | メモ化する対象 |
|--------|---------------|
| `useCallback` | **関数** |
| `useMemo` | **値**（計算結果） |

### 基本構文

```typescript
const メモ化された値 = useMemo(() => {
  return 重い計算結果;
}, [依存する値]);
```

### このプロジェクトでの使用箇所

このプロジェクトでは直接 `useMemo` を使っていないが、
フィルタリングやソートのような重い計算が増えた際に導入できる。

---

## useMemo のコード例

```typescript
import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;    // 価格
  category: string; // カテゴリ
};

const ProductList = ({ products }: { products: Product[] }) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // useMemo で重い計算結果をキャッシュする
  const filteredAndSorted = useMemo(() => {
    console.log("フィルタ＆ソート処理を実行");  // 不要な再計算がないか確認用

    // Step1: カテゴリでフィルタリングする
    const filtered =
      filterCategory === "all"
        ? products                                            // "all" なら全件
        : products.filter((p) => p.category === filterCategory); // カテゴリ一致のみ

    // Step2: 価格でソートする
    return [...filtered].sort((a, b) =>                       // 元配列を破壊しないようスプレッド
      sortOrder === "asc" ? a.price - b.price : b.price - a.price
    );
  }, [products, filterCategory, sortOrder]);
  // ↑ この3つのどれかが変わったときだけ再計算する
  //   他の state が変わっただけなら前回の結果をそのまま返す

  return (
    <div>
      <select onChange={(e) => setFilterCategory(e.target.value)}>
        <option value="all">すべて</option>
        <option value="electronics">電子機器</option>
        <option value="clothing">衣類</option>
      </select>

      <button onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}>
        {sortOrder === "asc" ? "↑ 安い順" : "↓ 高い順"}
      </button>

      <ul>
        {filteredAndSorted.map((product) => (
          <li key={product.id}>
            {product.name} - ¥{product.price.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## React.memo とは

高階コンポーネント（HOC）で、渡された props が前回と同じなら再レンダリングをスキップする。
パフォーマンス最適化のために使う。

### このプロジェクトでの使用箇所

このプロジェクトでは直接 `memo` を使っていないが、
`ChoiceList` や `ScoreDisplay` など、親が再レンダリングされても props が変わらないコンポーネントに使える。

---

## React.memo のコード例

```typescript
import { memo, useState } from "react";

type ItemProps = {
  name: string;
  price: number;
};

// memo で囲む → name と price が前回と同じなら再レンダリングしない
const Item = memo(({ name, price }: ItemProps) => {
  console.log(`Item "${name}" がレンダリングされました`); // 再レンダリング確認用
  return (
    <li>
      {name}: ¥{price.toLocaleString()}
    </li>
  );
});

// 第2引数にカスタム比較関数も渡せる（デフォルトは浅い比較）
const ItemWithCustomCompare = memo(
  ({ name, price }: ItemProps) => (
    <li>{name}: ¥{price.toLocaleString()}</li>
  ),
  (prevProps, nextProps) => {
    // true を返すと「同じ」と判定して再レンダリングをスキップする
    // ここでは name だけ比較し、price の変化は無視する例
    return prevProps.name === nextProps.name;
  }
);
```

---

## 3つの最適化手法まとめ

| 手法 | 目的 | 使いどき |
|------|------|---------|
| `React.memo` | コンポーネントの再レンダリングをスキップ | props が変わらないのに親の再レンダリングで更新される子コンポーネント |
| `useCallback` | 関数参照をメモ化 | `memo` した子に関数を props として渡すとき |
| `useMemo` | 計算結果をメモ化 | フィルタリング・ソートなど重い計算を繰り返すとき |

> **注意**: 最適化は必要になってから導入する。最初から全部に適用すると、コードが複雑になるだけで逆効果になる場合がある。
