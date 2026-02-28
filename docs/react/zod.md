# Zod 解説 — rhyme-quiz での使い方

## Zod とは

Zod は、TypeScript のための**スキーマバリデーションライブラリ**。
「スキーマ」とは「このデータはこういう形であるべき」というルールの定義のこと。

Zod の特徴は、スキーマを定義するだけで**型（TypeScript の型情報）を自動生成**できる点にある。

---

## なぜ Zod が必要か

### TypeScript の型は実行時に消える

TypeScript は「コンパイル時の型チェック」を提供するが、JavaScript に変換された時点で型情報はすべて消える。
つまり、**実行中（ランタイム）には型チェックが機能しない**。

```typescript
// TypeScript では型エラーにならないが、
// 実行時に外部から変なデータが来ても気づけない
function doSomething(data: { id: string }) {
  console.log(data.id.toUpperCase()); // data.id が undefined なら実行時エラー
}
```

### API レスポンスは「信頼できない外部データ」

ブラウザが `/api/quiz/next` を fetch するとき、サーバーが返す JSON を受け取る。
TypeScript の型を書いても、ランタイムで本当にその型どおりかは保証されない。

**Zod なし**:

```typescript
// ❌ ランタイムでは型チェックなし
const res = await fetch("/api/quiz/next");
const data = await res.json() as QuizQuestion; // as でキャストするだけ
// data が本当に QuizQuestion の形かは確認していない
// id が string のはずが undefined だったとしても、ここでは気づけない
```

**Zod あり**:

```typescript
// ✅ ランタイムで実際のデータを検証してから型をつける
const res = await fetch("/api/quiz/next");
const data = QuizQuestionSchema.parse(await res.json());
// 形が違えばここで即エラーになる（どのフィールドが問題かも教えてくれる）
// parse が成功したら、data は確実に QuizQuestion 型
```

### リクエストのバリデーション（サーバーサイド）

POST リクエストで送られてくるボディも「信頼できない外部データ」。
悪意あるリクエストや、クライアントのバグで不正な形のデータが来ることがある。

**Zod なし**:

```typescript
// ❌ 何でも通ってしまう。selectedChoiceIds が存在しなくてもエラーにならない
const body = await request.json();
const selectedChoiceIds = body.selectedChoiceIds; // undefined かもしれない
submitAnswer(params.id, selectedChoiceIds);        // ここで実行時エラーの可能性
```

**Zod あり**:

```typescript
// ✅ 形が不正なら即 400 Bad Request を返せる
const parsed = SubmitRequestSchema.safeParse(body);
if (!parsed.success) {
  return Response.json({ error: "Invalid request" }, { status: 400 });
}
// ここまで来たら parsed.data は確実に { selectedChoiceIds: string[] }
submitAnswer(params.id, parsed.data.selectedChoiceIds);
```

---

## このプロジェクトでの使用箇所

| ファイル | 役割 |
|----------|------|
| `src/features/quiz/contracts/quiz.ts` | スキーマの**定義**と型の**導出** |
| `src/routes/api/quiz/$id.submit.ts` | リクエストボディの**バリデーション**（サーバー側） |
| `src/features/quiz/presentation/hooks/useQuiz.ts` | API レスポンスの**バリデーション**（クライアント側） |

---

## スキーマの定義（`contracts/quiz.ts`）

```typescript
import { z } from "zod";
```

`z` が Zod のすべての機能へのエントリポイント。`z.string()`, `z.number()` などでスキーマを組み立てる。

---

### 基本的なスキーマ

```typescript
export const ChoiceSchema = z.object({
  id: z.string(),   // id は文字列でなければならない
  text: z.string(), // text は文字列でなければならない
});
```

- `z.object({...})` — オブジェクトのスキーマを定義する
- `z.string()` — 文字列であることを要求する
- ここで定義したルールに合わないデータは検証時にエラーになる

---

### 複雑なスキーマ

```typescript
export const QuizQuestionSchema = z.object({
  id: z.string(),
  // ^^^^^^^^^^^
  // id フィールドは string でなければならない

  questionWord: z.string(),
  // ^^^^^^^^^^^^^^^^^^^^^^^^
  // questionWord フィールドも string

  imageKey: z.string(),
  imageUrl: z.string().optional(),
  // ^^^^^^^^^^^^^^^^^^^^^^^^^
  // optional() をつけると「あってもなくてもよい」になる
  // ない場合は undefined として扱われる

  videoUrl: z.string().optional(),
  marqueeMode: z.boolean().optional(),
  // ^^^^^^^^^^^^^^^^^^^^
  // boolean() は true/false を要求する

  verticalMarqueeMode: z.boolean().optional(),

  choices: z.array(ChoiceSchema),
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // array() で「配列」を表す
  // z.array(ChoiceSchema) = 「ChoiceSchema に合うオブジェクトの配列」

  total: z.number(),
  // ^^^^^^^^^^^^^^^
  // number() は数値を要求する

  index: z.number(),
});
```

---

### リクエストのスキーマ

```typescript
export const SubmitRequestSchema = z.object({
  selectedChoiceIds: z.array(z.string()),
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // 「文字列の配列」を要求する
  // 例: ["q1-c1", "q1-c2"] は OK
  // 例: [1, 2, 3] は NG（数値の配列なので）
  // 例: "q1-c1" は NG（配列でないので）
});
```

---

### レスポンスのスキーマ（ネスト）

```typescript
export const ChoiceDetailSchema = z.object({
  id: z.string(),
  text: z.string(),
  vowels: z.string(),
  isCorrect: z.boolean(),
});

export const SubmitResponseSchema = z.object({
  isCorrect: z.boolean(),
  questionVowels: z.string(),
  correctChoiceIds: z.array(z.string()),
  explanation: z.string(),
  choiceDetails: z.array(ChoiceDetailSchema),
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // 別のスキーマ（ChoiceDetailSchema）を配列の要素として使える
  // スキーマは入れ子にできる
});
```

---

### 型の自動生成（`z.infer`）

```typescript
export type Choice = z.infer<typeof ChoiceSchema>;
//         ^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//         型名     「ChoiceSchema から型を取り出す」という意味
```

`z.infer<typeof ChoiceSchema>` は以下と同じ意味になる:

```typescript
type Choice = {
  id: string;
  text: string;
};
```

**ポイント**: スキーマ（バリデーションルール）から型（TypeScript の型情報）を自動生成するので、**スキーマと型が絶対に一致する**。手で型を書くと、スキーマと型がずれてしまう可能性があるが、Zod を使えばそれがない。

```typescript
export type Choice = z.infer<typeof ChoiceSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;
export type ChoiceDetail = z.infer<typeof ChoiceDetailSchema>;
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;
```

---

## サーバーサイドでのバリデーション（`$id.submit.ts`）

```typescript
import { SubmitRequestSchema } from "@/features/quiz/contracts/quiz";
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// contracts/quiz.ts で定義したスキーマをインポート

export const Route = createFileRoute("/api/quiz/$id/submit")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown;
        // ^^^^
        // unknown 型 = 「何が入っているかわからない」という型
        // any とは違い、unknown は使う前に型チェックが必要

        try {
          body = await request.json();
          // ^^^^^^^^^^^^^^^^^^^^^^^^
          // HTTP リクエストのボディを JSON としてパース
          // JSON のパースに失敗した場合は catch に飛ぶ
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
          // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          // JSON として不正なボディが来た場合は 400 Bad Request を返す
        }

        const parsed = SubmitRequestSchema.safeParse(body);
        // ^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // safeParse = エラーが起きても例外を投げない（throws しない）バリデーション
        // parse（後述）はエラー時に例外を投げる
        // safeParse の返り値は { success: true, data: ... } か { success: false, error: ... }

        if (!parsed.success) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
          // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          // バリデーション失敗 = クライアントが変なデータを送ってきた
          // 400 Bad Request を返してここで処理を終了する
        }

        // ここに来たら parsed.data は確実に { selectedChoiceIds: string[] }
        const result = await submitAnswer(
          params.id,
          parsed.data.selectedChoiceIds,
          // ^^^^^^^^^^^^^^^^^^^^^^^^^
          // parsed.data を使うことで、TypeScript が型を把握している
          // .selectedChoiceIds は string[] であることが保証される
        );
```

### `parse` と `safeParse` の違い

| メソッド | 失敗時の挙動 | 使い所 |
|---------|------------|--------|
| `parse` | 例外（Error）を投げる | 必ず成功するはずの場面 |
| `safeParse` | `{ success: false }` を返す | 失敗したときに自分でハンドリングしたい場面（API サーバーなど） |

---

## クライアントサイドでのバリデーション（`useQuiz.ts`）

```typescript
import {
  QuizQuestionSchema,
  type SubmitResponse,
  SubmitResponseSchema,
} from "../../contracts/quiz";
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^
// スキーマと型を両方インポート
// type SubmitResponse は型だけ（実行時に消える）
// SubmitResponseSchema はスキーマ（実行時にも存在する）

export function useCurrentQuestion() {
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);

  return useQuery({
    queryKey: ["quiz", "next", currentQuestionIndex],
    queryFn: async () => {
      const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
      if (!res.ok) throw new Error("Failed to fetch question");

      return QuizQuestionSchema.parse(await res.json());
      //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // 1. await res.json() で JSON を取得（型は unknown/any）
      // 2. QuizQuestionSchema.parse() でバリデーション
      // 3. 成功すれば返り値は QuizQuestion 型として扱える
      // 4. 失敗すれば例外が投げられ、useQuery が error 状態になる
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useSubmitAnswer() {
  const setSubmitResult = useQuizStore((s) => s.setSubmitResult);

  return useMutation({
    mutationFn: async ({ questionId, selectedChoiceIds }) => {
      const res = await fetch(`/api/quiz/${questionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedChoiceIds }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");

      return SubmitResponseSchema.parse(await res.json());
      //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      // サーバーから返ってきた回答結果をバリデーション
      // 成功すれば SubmitResponse 型として扱える
      // これにより setSubmitResult(data) に正しい型のデータが渡せる
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      // data は SubmitResponseSchema.parse が成功したので
      // 確実に SubmitResponse 型
    },
  });
}
```

---

## `contracts/quiz.ts` が「唯一の真実」である理由

このプロジェクトでは `contracts/quiz.ts` を**API の型の唯一の真実（Single Source of Truth）**と位置づけている。

```
contracts/quiz.ts
  ├── スキーマ（バリデーションルール）→ サーバーとクライアントで共有
  └── 型（z.infer で導出）          → TypeScript 全体で使い回す
```

**メリット**:
- スキーマを変えると自動的に型も変わる（二重管理が不要）
- サーバーとクライアントが同じスキーマを使うので、仕様のずれが起きない
- 「型は合っているがバリデーションルールが違う」という矛盾が起きない

**もし contracts を使わず、型とバリデーションを別々に書いたら**:

```typescript
// ❌ アンチパターン: 型とバリデーションが別管理
// 型（TypeScript）
type QuizQuestion = {
  id: string;
  questionWord: string;
  choices: Choice[];
  total: number;
  index: number;
};

// バリデーション（別のライブラリや手書き）
function validate(data: unknown): boolean {
  if (typeof data !== "object") return false;
  // ...手書きで全フィールドをチェック...
  // スキーマと型が一致しているか常に人間が確認しなければならない
}
```

---

## データの流れと Zod の位置

```
クライアント（ブラウザ）
  ↓
fetch("/api/quiz/next")
  ↓
サーバーが JSON を返す
  ↓
QuizQuestionSchema.parse(json)  ← Zod がここで検証
  ↓ 成功
QuizQuestion 型として安全に使える
  ↓
React コンポーネントに渡す



ユーザーが回答を選んで「解答する」ボタンをクリック
  ↓
fetch("/api/quiz/:id/submit", { body: JSON.stringify({ selectedChoiceIds }) })
  ↓
サーバーが受け取る
  ↓
SubmitRequestSchema.safeParse(body)  ← Zod がここで検証
  ↓ 成功
安全に submitAnswer() に渡す
  ↓
サーバーが結果 JSON を返す
  ↓
SubmitResponseSchema.parse(json)  ← Zod がここで検証
  ↓ 成功
SubmitResponse 型として安全に Zustand ストアに保存
```

---

## まとめ

| Zod の概念 | このプロジェクトでの例 |
|-----------|----------------------|
| `z.object({...})` | `ChoiceSchema`, `QuizQuestionSchema` など |
| `z.string()` | `id`, `text`, `questionWord` など |
| `z.number()` | `total`, `index` |
| `z.boolean()` | `isCorrect`, `marqueeMode` |
| `z.array(...)` | `choices: z.array(ChoiceSchema)` |
| `.optional()` | `imageUrl`, `videoUrl`, `marqueeMode` |
| `z.infer<typeof Schema>` | `type QuizQuestion = z.infer<typeof QuizQuestionSchema>` |
| `schema.parse(data)` | `QuizQuestionSchema.parse(await res.json())` |
| `schema.safeParse(data)` | `SubmitRequestSchema.safeParse(body)` |

### Zod を使うことで得られるもの

1. **ランタイムの安全性** — 型チェックが実行時にも機能する
2. **型の自動生成** — スキーマから `z.infer` で型を導出、二重管理が不要
3. **分かりやすいエラーメッセージ** — どのフィールドが問題かを教えてくれる
4. **境界での防御** — 外部からのデータ（API, ユーザー入力）をシステムの入口で検証

### Zod を使わないとどうなるか

- API レスポンスの形が変わっても実行時まで気づけない
- 型と実際のデータがずれていてもエラーにならず、深いところで突然クラッシュする
- 不正なリクエストをそのまま処理してしまい、予期しないバグが発生する
- 型定義とバリデーションを別々に管理する必要があり、ずれが生じやすい
