# React レンダリングの仕組み — Virtual DOM・Reconciliation・key

## React のレンダリングとは

React は実 DOM を直接操作せず、軽量な **Virtual DOM（仮想 DOM）** 上で差分を計算し、
最小限の変更だけを実 DOM に反映する。この差分検出アルゴリズムを **Reconciliation（調停）** と呼ぶ。

```
state/props が変化
     ↓
新しい Virtual DOM ツリーを構築
     ↓
前回の Virtual DOM と差分を比較（Reconciliation）
     ↓
差分がある部分だけ実 DOM に反映
```

---

## Virtual DOM が必要な理由

実 DOM の操作はコストが高い（レイアウトの再計算、描画のやり直しが発生する）。

React が Virtual DOM（JavaScript オブジェクトのツリー）で差分を計算してから、
本当に必要な変更だけを実 DOM に適用することで効率化している。

---

## key プロパティとは

リストをレンダリングするとき、各要素に一意な `key` を渡すことで、
React が「どの要素が変わったか」を正しく識別できるようになる。

### このプロジェクトでの使用箇所

| ファイル | key に使っている値 |
|----------|-------------------|
| `src/features/quiz/presentation/parts/ChoiceList.tsx` | `choice.id` |
| `src/features/quiz/presentation/parts/ResultDisplay.tsx` | `choice.id` |
| `src/features/quiz/presentation/parts/RomajiVerticalMarquee.tsx` | 配列インデックス（連続スクロール用の特殊ケース） |

---

## ChoiceList.tsx での key の使い方

```typescript
// ChoiceList.tsx（このプロジェクトの実際のコード）
export function ChoiceList({ choices }: ChoiceListProps) {
  return (
    <div className="space-y-3">
      {choices.map((choice) => (
        <div
          key={choice.id}   // choice.id（"q1-c1" など）を key に使う
          // ↑ 一意な ID を key にすることで、React が各選択肢を正しく識別できる
          className="..."
        >
          <Checkbox
            id={choice.id}
            checked={selectedChoiceIds.includes(choice.id)}
            onCheckedChange={() => toggleChoice(choice.id)}
          />
          <label htmlFor={choice.id}>{choice.text}</label>
        </div>
      ))}
    </div>
  );
}
```

---

## key の重要性を示すコード例

```typescript
import { useState } from "react";

type Todo = {
  id: string;   // 一意な識別子
  text: string;
};

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "買い物" },
    { id: "2", text: "掃除" },
    { id: "3", text: "勉強" },
  ]);

  const addTodo = () => {
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: `タスク${prev.length + 1}` },
      // ↑ crypto.randomUUID() でユニークな ID を生成する
    ]);
  };

  return (
    <ul>
      {todos.map((todo) => (
        // ◯ key に一意な id を指定 → React が各要素を正しく追跡できる
        // ✕ key={index} → 要素の追加・削除・並び替え時にバグの原因になる
        <li key={todo.id}>{todo.text}</li>
      ))}
      <button onClick={addTodo}>追加</button>
    </ul>
  );
};
```

---

## key の指定方法まとめ

| key の指定方法 | 動作 | 問題 |
|---------------|------|------|
| `key={item.id}`（一意な値） | 各要素を正しく識別して差分更新する | なし（推奨） |
| `key={index}`（配列インデックス） | 並び替え時に要素を取り違える | state のずれ、パフォーマンス低下 |
| key なし | React が警告を出す | 予期しない再レンダリング |

---

## RomajiVerticalMarquee.tsx での特殊ケース

```typescript
// RomajiVerticalMarquee.tsx（このプロジェクトの実際のコード）
export function RomajiVerticalMarquee({ questionWord, choices }: ...) {
  // 3回繰り返して連続スクロールを実現する
  const repeatedItems = [...items, ...items, ...items];

  return (
    <div ...>
      {repeatedItems.map((text, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <p key={i} ...>   // ← インデックスを key に使っている特殊ケース
          {text}
        </p>
        // ↑ 本来は index を key に使うのは非推奨だが、
        //   このコンポーネントは「視覚的なアニメーション専用」で
        //   要素の追加・削除・並び替えは起きないため問題ない
        //   ESLint の警告を抑制するコメントを付けている
      ))}
    </div>
  );
}
```

---

## レンダリングが起きるタイミング

```typescript
// 1. useState の更新
const [count, setCount] = useState(0);
setCount(1);  // → 再レンダリングされる

// 2. 親コンポーネントの再レンダリング
// → 子コンポーネントも再レンダリングされる（memo で防げる）

// 3. Context の値の更新
// → Provider 配下の全コンポーネントが再レンダリングされる

// レンダリングが起きないケース（useRef）
const ref = useRef(0);
ref.current = 1;  // → 再レンダリングされない
```

---

## まとめ

| 概念 | 内容 |
|------|------|
| Virtual DOM | 実 DOM の軽量なコピー。差分計算に使う JavaScript オブジェクト |
| Reconciliation | 前回と今回の Virtual DOM を比較して差分を特定するアルゴリズム |
| key | リストの各要素を識別するための一意な値。ステーブルな ID を使う |
| 再レンダリング | state/props/Context が変わると発生。memo・useCallback・useMemo で抑制できる |
