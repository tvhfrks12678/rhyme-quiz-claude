# React 基本フック解説 — useState / useEffect

## useState とは

関数コンポーネントに「状態（state）」を持たせるためのフック。
state が更新されると、そのコンポーネントが**再レンダリング**される。

### 基本構文

```typescript
const [値, 更新関数] = useState<型>(初期値);
```

### このプロジェクトでの使用箇所

| ファイル | 用途 |
|----------|------|
| `src/features/quiz/presentation/parts/QuizCard.tsx` | 画像エラー状態・表示モードの管理 |

---

## QuizCard.tsx での useState

```typescript
// QuizCard.tsx（抜粋）
import { useState } from "react";

export function QuizCard({ question }: QuizCardProps) {
  // boolean 型の state。画像の読み込み失敗を管理する
  // false: エラーなし（初期状態）、true: 読み込みエラーあり
  const [imageError, setImageError] = useState(false);
  // ↑ 初期値が false なので TypeScript が自動で boolean 型と推論する

  // DisplayMode 型（Union 型）の state。表示モードを管理する
  // ジェネリクス <DisplayMode> で型を明示的に指定
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  // ↑ initialMode は question の各フラグから計算した初期値

  // ...

  return (
    <img
      src={question.imageUrl}
      alt={question.questionWord}
      onError={() => setImageError(true)}   // 読み込み失敗時に imageError を true にする
    />
  );
}
```

---

## useState の基本パターン

```typescript
import { useState } from "react";

const Counter = () => {
  // useState<number>(0) で number 型の state を初期値 0 で作成
  // count: 現在の値、setCount: 更新関数
  const [count, setCount] = useState<number>(0);

  // オブジェクト型の state も可能
  const [form, setForm] = useState<{ name: string; age: number }>({
    name: "",   // 名前の初期値
    age: 0,     // 年齢の初期値
  });

  const increment = () => {
    // ✕ setCount(count + 1) → 連続呼び出しで古い値を参照するリスクがある
    // ◯ 関数型更新：前回の state を引数に受け取って確実にインクリメントする
    setCount((prev) => prev + 1);
  };

  const updateName = (newName: string) => {
    // スプレッド構文で既存プロパティを維持しつつ name だけ更新する
    setForm((prev) => ({ ...prev, name: newName }));
  };

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={increment}>+1</button>
      <input
        value={form.name}
        onChange={(e) => updateName(e.target.value)}  // 入力値で name を更新
      />
    </div>
  );
};
```

### なぜ関数型更新を使うのか

`setCount(count + 1)` は呼び出した時点の `count` の値を参照する。
短時間に複数回呼び出された場合、全て同じ古い値を元に計算してしまう。

`setCount((prev) => prev + 1)` は React が管理する最新の state を `prev` として渡すため、
連続呼び出しでも正しくインクリメントされる。

---

## useEffect とは

関数コンポーネントで API データの取得、DOM 操作、タイマー設定などの「副作用（Side Effects）」を、
レンダリング後（画面表示後）に実行・制御するフック。

第 2 引数の「依存配列」で実行タイミングを制御でき、クリーンアップ関数で後処理も可能。

### 基本構文

```typescript
useEffect(() => {
  // 副作用の処理
  return () => {
    // クリーンアップ関数（省略可）
  };
}, [依存する値]);  // 依存配列
```

### このプロジェクトでの使用箇所

このプロジェクトでは `useEffect` を直接使っていない。
データ取得は TanStack Query の `useQuery`、副作用は Zustand のアクションで管理している。
ただし TanStack Query の内部では `useEffect` が使われている。

---

## useEffect のコード例：API データ取得

```typescript
import { useEffect, useState } from "react";

// ユーザー情報の型を定義
type User = {
  id: number;       // ユーザーID
  name: string;     // ユーザー名
  email: string;    // メールアドレス
};

const UserProfile = ({ userId }: { userId: number }) => {
  // ユーザーデータを保持する state（初期値は null）
  const [user, setUser] = useState<User | null>(null);

  // ローディング状態を管理する state
  const [loading, setLoading] = useState<boolean>(true);

  // エラー状態を管理する state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // useEffect 内で async 関数を定義する
    // ※ useEffect のコールバック自体は async にできない
    const fetchUser = async () => {
      try {
        setLoading(true);                          // 通信開始前にローディングを true にする
        setError(null);                            // 以前のエラーをリセットする

        const response = await fetch(              // API にリクエストを送信する
          `https://api.example.com/users/${userId}` // userId をパスパラメータに埋め込む
        );

        if (!response.ok) {                        // ステータスコードが 200 番台以外ならエラー
          throw new Error("ユーザー情報の取得に失敗しました");
        }

        const data: User = await response.json();  // レスポンスを JSON としてパースして型付け
        setUser(data);                             // 取得したデータを state にセット
      } catch (err) {
        setError(                                  // エラー発生時にメッセージを state にセット
          err instanceof Error ? err.message : "不明なエラー"
        );
      } finally {
        setLoading(false);                         // 成功・失敗どちらでもローディングを解除
      }
    };

    fetchUser();                                   // 定義した関数を即時実行する
  }, [userId]);
  // ↑ 依存配列に userId を指定 → userId が変わるたびに再実行される
  // 空配列 [] なら初回マウント時のみ実行
  // 配列自体を省略するとレンダリングごとに毎回実行（通常は非推奨）

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;
  if (!user) return <p>ユーザーが見つかりません</p>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

---

## useEffect のコード例：クリーンアップ関数（タイマー）

```typescript
import { useEffect, useState } from "react";

const Timer = () => {
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    // 1秒ごとに seconds を +1 するインターバルを設定する
    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);  // 前回の値を元にインクリメント（関数型更新）
    }, 1000);                          // 1000ms = 1秒ごとに実行

    // クリーンアップ関数：コンポーネントのアンマウント時 or 再実行前に呼ばれる
    return () => {
      clearInterval(intervalId);       // インターバルを解除してメモリリークを防止する
    };
  }, []);
  // ↑ 空配列 → マウント時に1回だけ実行、アンマウント時にクリーンアップ

  return <p>経過時間: {seconds}秒</p>;
};
```

---

## 依存配列まとめ

| 依存配列 | 実行タイミング | 用途例 |
|----------|---------------|--------|
| `[]`（空配列） | マウント時に1回だけ | 初回データ取得、イベントリスナー登録 |
| `[value]` | value が変化するたび | 特定の state/props 変更時のデータ再取得 |
| 省略 | 毎レンダリング後 | 通常は非推奨（無限ループの原因になる） |

---

## なぜ TanStack Query を使うのか

`useEffect` で手書きするデータ取得には課題がある：

- ローディング・エラー状態を自前で管理する必要がある
- キャッシュがないので、同じデータを何度もフェッチしてしまう
- 複数のコンポーネントで同じデータが必要なとき、バラバラにフェッチされる
- リトライ、ウィンドウフォーカス時の再取得など高度な機能が必要

TanStack Query（`useQuery`）はこれらを自動で解決する。
このプロジェクトでは `useEffect` で手書きせず、TanStack Query を使っている。

```typescript
// useQuiz.ts（このプロジェクトの実際のコード）
export function useCurrentQuestion() {
  return useQuery({
    queryKey: ["quiz", "next", currentQuestionIndex], // キャッシュのキー
    queryFn: async () => {                            // データ取得関数
      const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      return QuizQuestionSchema.parse(await res.json());
    },
    staleTime: Number.POSITIVE_INFINITY,              // キャッシュを無期限に有効化
  });
}
// isLoading, error, data を自動で管理してくれる
```
