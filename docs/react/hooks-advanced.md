# React 応用フック解説 — useRef / useContext / useReducer / カスタムフック

## useRef とは

レンダリングをまたいで値を保持できるが、値が変わっても**再レンダリングを引き起こさない**フック。
主に2つの用途がある：

1. DOM 要素への参照（入力欄へのフォーカス、スクロール位置の取得など）
2. レンダリングに影響しない値の保持（タイマー ID、前回の値の記録など）

### 基本構文

```typescript
const ref = useRef<型>(初期値);
// ref.current で値にアクセス・更新する
```

### このプロジェクトでの使用箇所

このプロジェクトでは直接 `useRef` を使っていないが、
タイマーや前回の値を保持したい場面で活用できる。

---

## useRef のコード例

```typescript
import { useRef, useEffect, useState } from "react";

const TextInput = () => {
  // HTMLInputElement 型の ref を作成する（初期値は null）
  const inputRef = useRef<HTMLInputElement>(null);

  // レンダリング回数を記録する（state ではないので変更しても再レンダリングされない）
  const renderCount = useRef<number>(0);

  // 前回の値を保持する ref
  const previousValue = useRef<string>("");

  const [value, setValue] = useState<string>("");

  useEffect(() => {
    renderCount.current += 1;            // .current プロパティで値にアクセス・更新する
    console.log(`レンダリング回数: ${renderCount.current}`);
  });

  useEffect(() => {
    previousValue.current = value;       // value が変わるたびに前回値を保存する
  }, [value]);

  const focusInput = () => {
    inputRef.current?.focus();           // DOM 要素のメソッドを直接呼び出す
    // ?. でオプショナルチェーン（null の場合は何もしない）
  };

  return (
    <div>
      {/* ref 属性に渡すと、この input 要素への参照が inputRef.current に格納される */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={focusInput}>入力欄にフォーカス</button>
      <p>前回の入力値: {previousValue.current}</p>
    </div>
  );
};
```

### useState と useRef の違い

| 特徴 | useState | useRef |
|------|----------|--------|
| 値が変わると | 再レンダリングされる | 再レンダリングされない |
| 主な用途 | 画面に表示する値の管理 | DOM参照、タイマーID、前回値の保持 |
| 値へのアクセス | そのまま変数として使う | `.current` プロパティを使う |

---

## useContext とは

コンポーネントツリーの深い階層に props を「バケツリレー」せず、直接データを渡すための仕組み。
グローバルなテーマ、認証情報、言語設定などで使う。

### このプロジェクトでの使用箇所

このプロジェクトではグローバル状態管理に Zustand を使っているため、
`useContext` を直接使っていない。ただし同様の問題（props drilling の解消）を解決する役割は同じ。

---

## useContext のコード例

```typescript
import { createContext, useContext, useState, ReactNode } from "react";

// 認証コンテキストの型を定義
type AuthContextType = {
  user: string | null;             // ログイン中のユーザー名（未ログインは null）
  login: (name: string) => void;   // ログイン関数
  logout: () => void;              // ログアウト関数
};

// Context を作成する（初期値は undefined、Provider 外で使った場合の安全策）
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// カスタムフック：Context の値を安全に取得する
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext); // Context から値を取得する
  if (context === undefined) {
    // Provider の外で使用された場合にエラーを投げる（開発時のバグ検出）
    throw new Error("useAuth は AuthProvider の内部で使用してください");
  }
  return context;
};

// Provider コンポーネント：子コンポーネントに値を提供する
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);

  const login = (name: string) => setUser(name);  // ユーザー名をセットする
  const logout = () => setUser(null);              // null に戻す

  return (
    // value に渡したオブジェクトがツリー全体で共有される
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 子コンポーネント：useAuth で直接アクセスする（props 不要）
const UserStatus = () => {
  const { user, login, logout } = useAuth(); // Context の値を分割代入する

  return (
    <div>
      {user ? (
        <>
          <p>ようこそ、{user}さん</p>
          <button onClick={logout}>ログアウト</button>
        </>
      ) : (
        <button onClick={() => login("田中太郎")}>ログイン</button>
      )}
    </div>
  );
};

// アプリのルート：Provider でラップする
const App = () => (
  <AuthProvider>
    <UserStatus />          {/* 深い階層でも props なしで認証情報にアクセス可能 */}
  </AuthProvider>
);
```

---

## useReducer とは

複雑な状態管理に適したフック。
「アクション → リデューサー → 新しい状態」のパターンで状態遷移のロジックを一箇所にまとめられる。

`useState` が適しているケース：
- 状態が1〜2個でシンプルな場合

`useReducer` が適しているケース：
- 状態が複数の値をまとめて管理する場合
- 状態遷移のパターンが複雑で、条件分岐が多い場合
- 状態のテストを書きたい場合（リデューサーは純粋関数なのでテストしやすい）

### 基本構文

```typescript
const [state, dispatch] = useReducer(reducer関数, 初期状態);
// dispatch({ type: "アクション名" }) で状態を更新する
```

### このプロジェクトでの使用箇所

このプロジェクトでは Zustand でグローバル状態を管理しているため、
`useReducer` を直接使っていない。Zustand の store は `useReducer` と似た考え方で動いている。

---

## useReducer のコード例

```typescript
import { useReducer } from "react";

// 状態の型
type State = {
  count: number;
  history: number[];  // 過去の値を記録する
};

// アクションの型（Union 型で全パターンを列挙する）
type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET"; payload: number };  // 任意の値をセットする

// 初期状態
const initialState: State = {
  count: 0,
  history: [],
};

// リデューサー関数：現在の state と action を受け取り、新しい state を返す
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INCREMENT":
      return {
        count: state.count + 1,                            // +1 する
        history: [...state.history, state.count],           // 変更前の値を履歴に追加する
      };
    case "DECREMENT":
      return {
        count: state.count - 1,                            // -1 する
        history: [...state.history, state.count],
      };
    case "SET":
      return {
        count: action.payload,                             // payload の値をセットする
        history: [...state.history, state.count],
      };
    case "RESET":
      return initialState;                                 // 初期状態に戻す
    default:
      return state;                                        // 未知のアクションは state をそのまま返す
  }
};

const CounterWithHistory = () => {
  // useReducer(リデューサー関数, 初期状態) → [現在の state, dispatch 関数]
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>カウント: {state.count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>
      <button onClick={() => dispatch({ type: "SET", payload: 100 })}>100にセット</button>
      <button onClick={() => dispatch({ type: "RESET" })}>リセット</button>
      <p>履歴: {state.history.join(" → ")}</p>
    </div>
  );
};
```

---

## カスタムフックとは

`use` で始まる関数で、複数のフック（useState, useEffect 等）をまとめてロジックを再利用可能にするパターン。
コンポーネントから状態管理ロジックを分離し、テストしやすくする。

### このプロジェクトでの使用箇所

| ファイル | 役割 |
|----------|------|
| `src/features/quiz/presentation/hooks/useQuiz.ts` | クイズのデータ取得・送信ロジックをまとめたカスタムフック |

---

## このプロジェクトのカスタムフック

```typescript
// useQuiz.ts（このプロジェクトの実際のコード）
import { useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";

// useCurrentQuestion：問題データの取得ロジックをカスタムフックにまとめている
export function useCurrentQuestion() {
  // Zustand から現在の問題インデックスを取得する
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);

  // TanStack Query で API からデータを取得する
  return useQuery({
    queryKey: ["quiz", "next", currentQuestionIndex], // インデックスごとにキャッシュする
    queryFn: async () => {
      const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      return QuizQuestionSchema.parse(await res.json());  // Zod でバリデーション
    },
    staleTime: Number.POSITIVE_INFINITY,  // 一度取得したデータはキャッシュし続ける
  });
}

// useSubmitAnswer：回答送信ロジックをカスタムフックにまとめている
export function useSubmitAnswer() {
  const setSubmitResult = useQuizStore((s) => s.setSubmitResult);

  return useMutation({
    mutationFn: async ({ questionId, selectedChoiceIds }) => {
      const res = await fetch(`/api/quiz/${questionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedChoiceIds }),       // 選択した選択肢IDを送信する
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return SubmitResponseSchema.parse(await res.json()); // Zod でバリデーション
    },
    onSuccess: (data) => {
      setSubmitResult(data);  // 成功時に Zustand に結果を保存する
    },
  });
}
```

## カスタムフックの一般的なコード例

```typescript
import { useState, useEffect } from "react";

// API レスポンスの状態を表す型
type UseFetchResult<T> = {
  data: T | null;       // 取得したデータ
  loading: boolean;     // ローディング中か
  error: string | null; // エラーメッセージ
  refetch: () => void;  // 再取得関数
};

// ジェネリクス <T> で任意の型のデータ取得に対応する
const useFetch = <T,>(url: string): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 取得処理を関数として定義する（refetch でも使うため）
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const json: T = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();             // URL が変わるたびにデータを取得する
  }, [url]);                 // url を依存配列に指定する

  return { data, loading, error, refetch: fetchData }; // state と再取得関数を返す
};

// 使用例
type Post = { id: number; title: string; body: string };

const PostList = () => {
  // カスタムフックを呼ぶだけで API 取得の全ロジックが使える
  const { data: posts, loading, error, refetch } = useFetch<Post[]>(
    "https://api.example.com/posts"
  );

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>エラー: {error}</p>;

  return (
    <div>
      <button onClick={refetch}>再読み込み</button>
      {posts?.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}
    </div>
  );
};
```

### カスタムフックのルール

- 関数名は必ず `use` で始める（React のルールによりフックの検出に使われる）
- フックはコンポーネントのトップレベルか他のカスタムフックの中でのみ呼び出せる
- 条件分岐やループの中で呼び出してはならない
