# TypeScript ジェネリクス（Generics）解説

## ジェネリクスとは

型を「引数」として受け取り、再利用可能かつ型安全なコードを書くための仕組み。
関数、クラス、インターフェース、型エイリアスなどで使える。

「どんな型にも対応できるが、型の整合性はちゃんとチェックする」というのがジェネリクスの目的。

---

## このプロジェクトでの使用箇所

| ファイル | ジェネリクスの使い方 |
|----------|---------------------|
| `src/features/quiz/contracts/quiz.ts` | `z.infer<typeof Schema>` で Zod スキーマから型を生成 |
| `src/features/quiz/presentation/hooks/useQuiz.ts` | `useQuery<型>()`, `useMutation<型>()` |
| `src/features/quiz/domain/ports/quizRepository.ts` | `Promise<QuizFull[]>`, `Promise<QuizFull \| null>` |

---

## contracts/quiz.ts でのジェネリクス

```typescript
// contracts/quiz.ts（このプロジェクトの実際のコード）
import { z } from "zod";

// Zod スキーマの定義
export const QuizQuestionSchema = z.object({
  id: z.string(),
  questionWord: z.string(),
  // ...
});

// z.infer<typeof QuizQuestionSchema> がジェネリクスの使用例
// typeof QuizQuestionSchema は「このスキーマオブジェクトの型」
// z.infer<T> は「T というスキーマから TypeScript の型を生成する」ジェネリクス
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
// → { id: string; questionWord: string; ... } という型が自動生成される
```

---

## useQuiz.ts でのジェネリクス

```typescript
// useQuiz.ts（このプロジェクトの実際のコード）
export function useCurrentQuestion() {
  return useQuery({
    queryKey: ["quiz", "next", currentQuestionIndex],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
      if (!res.ok) throw new Error("Failed to fetch question");
      return QuizQuestionSchema.parse(await res.json());
      // ↑ Zod の parse が QuizQuestion 型を返す → TypeScript が型推論する
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
  // useQuery の戻り値は { data: QuizQuestion | undefined, isLoading: boolean, ... }
  // TanStack Query が内部でジェネリクスを使って型を伝播させている
}
```

---

## ジェネリクスの基本

### 基本的なジェネリック関数

```typescript
// <T> は型パラメータ。呼び出し時に具体的な型が入る
const getFirst = <T,>(arr: T[]): T | undefined => {
  return arr[0]; // T 型の配列から T 型の値を返す
};

const num = getFirst<number>([1, 2, 3]);    // T = number → 戻り値は number | undefined
const str = getFirst<string>(["a", "b"]);   // T = string → 戻り値は string | undefined
const inferred = getFirst([true, false]);    // 型推論で T = boolean と自動判定される
```

### 複数の型パラメータ

```typescript
// K と V という2つの型パラメータを使う
const pair = <K, V>(key: K, value: V): { key: K; value: V } => {
  return { key, value }; // K 型のキーと V 型の値のペアを返す
};

const result = pair<string, number>("age", 25); // { key: string; value: number }
```

### 制約付きジェネリクス（extends）

```typescript
// T は { length: number } を持つ型に限定される
const getLength = <T extends { length: number }>(item: T): number => {
  return item.length; // length プロパティが存在することが保証される
};

getLength("hello");     // OK: string は length を持つ
getLength([1, 2, 3]);   // OK: 配列は length を持つ
// getLength(123);      // ✕ コンパイルエラー: number に length はない
```

---

## React コンポーネントでのジェネリクス

```typescript
type ListProps<T> = {
  items: T[];                            // T 型の配列
  renderItem: (item: T) => JSX.Element;  // 各アイテムの描画関数
};

// ジェネリックコンポーネント
const GenericList = <T,>({ items, renderItem }: ListProps<T>) => {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
};

// 使用例：型安全にどんな型のリストでも描画できる
const App = () => (
  <GenericList<string>
    items={["React", "TypeScript", "Vite"]}
    renderItem={(item) => <span>{item}</span>}  // item は string 型と推論される
  />
);
```

---

## Promise とジェネリクス

```typescript
// quizRepository.ts（このプロジェクトの実際のコード）
export interface QuizRepository {
  findAllQuestions(): Promise<QuizFull[]>;          // QuizFull の配列を非同期で返す
  findFullById(id: string): Promise<QuizFull | null>; // QuizFull か null を非同期で返す
}
// Promise<T> は「いつか T 型の値が得られる」という約束を表すジェネリック型
```

```typescript
// 一般的な Promise の使い方
async function fetchData(): Promise<string> {
  const response = await fetch("https://api.example.com/data");
  return response.text(); // string を返す Promise
}

// Promise.all でも使える
const results = await Promise.all([
  fetch("/api/users"),   // Promise<Response>
  fetch("/api/posts"),   // Promise<Response>
]);
// results は [Response, Response] 型
```

---

## 配列のジェネリクス

```typescript
// Array<T> と T[] は同じ意味
const numbers: Array<number> = [1, 2, 3];   // Array<number>
const strings: string[] = ["a", "b", "c"];  // string[]（省略記法）

// このプロジェクトでも両方の書き方が使われている
results: Array<{ isCorrect: boolean }>;  // useQuiz.ts
choices: z.array(ChoiceSchema)           // contracts/quiz.ts の Zod スキーマ
```

---

## ジェネリクスまとめ

| 記法 | 意味 | 例 |
|------|------|----|
| `<T>` | 型パラメータ（任意の型を受け取る） | `useState<number>()` |
| `<T extends U>` | T は U のサブタイプに限定する | `<T extends { length: number }>` |
| `<T, U>` | 複数の型パラメータ | `Promise<QuizFull \| null>` |
| `Array<T>` / `T[]` | T 型の配列 | `Promise<QuizFull[]>` |
| `z.infer<typeof Schema>` | Zod スキーマから型を生成する | `type QuizQuestion = z.infer<typeof QuizQuestionSchema>` |
