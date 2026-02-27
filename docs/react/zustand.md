# Zustand 解説 — rhyme-quiz での使い方

## Zustand とは

Zustand（ドイツ語で「状態」）は、React のためのシンプルな**グローバル状態管理ライブラリ**。

### なぜグローバル状態管理が必要か

React では、コンポーネント間でデータを共有したいとき「props のバケツリレー」が必要になる。

```
QuizPage
  ↓ props で渡す
  QuizCard
    ↓ props で渡す
    ChoiceList   ← ここで selectedChoiceIds が必要
```

コンポーネントの階層が深くなると、途中のコンポーネントが使わないデータまで props で受け取って次に渡す必要が出てくる（「props drilling」と呼ぶ）。

Zustand を使うと、**どのコンポーネントからでも直接** ストア（グローバルな状態置き場）にアクセスできる。

```
         Zustand Store
        /      |      \
  QuizPage  QuizCard  ChoiceList  ← どこからでも直接アクセス
```

### Redux との違い

Redux も同じグローバル状態管理だが、ボイラープレートが多い（action, reducer, dispatch...）。
Zustand はシンプルで、`create` 関数一つで状態と更新関数をまとめて定義できる。

---

## このプロジェクトでの使用箇所

| ファイル | 役割 |
|----------|------|
| `src/features/quiz/presentation/hooks/useQuiz.ts` | ストアの**定義** |
| `src/features/quiz/presentation/QuizPage.tsx` | ストアの**読み取り** |
| `src/features/quiz/presentation/parts/ChoiceList.tsx` | ストアの**読み取り＋更新** |
| `src/features/quiz/presentation/parts/QuizCard.tsx` | ストアの**読み取り** |

---

## ストアの定義（`useQuiz.ts`）

```typescript
import { create } from "zustand";
```

`create` は Zustand が提供する唯一のメイン関数。これでストアを作る。

---

### 型定義

```typescript
interface QuizStoreState {
  currentQuestionIndex: number;          // 今何問目か（0始まり）
  selectedChoiceIds: string[];           // 選択中の選択肢IDの配列
  results: Array<{ isCorrect: boolean }>; // 各問の正誤履歴
  phase: "answering" | "result" | "finished"; // クイズの現在フェーズ
  submitResult: SubmitResponse | null;   // 直前の回答結果
  toggleChoice: (id: string) => void;   // 選択肢の選択/解除
  setSubmitResult: (result: SubmitResponse) => void; // 回答結果をセット
  nextQuestion: (total: number) => void; // 次の問題へ進む
  reset: () => void;                    // 最初からやり直す
}
```

**ポイント**: Zustand のストアは「状態（データ）」と「アクション（状態を更新する関数）」を**同じオブジェクトにまとめて**定義する。Redux のように別々に定義しない。

---

### ストアの作成

```typescript
export const useQuizStore = create<QuizStoreState>((set) => ({
```

- `create<QuizStoreState>` — 型引数にインターフェースを渡して型安全にする
- `(set) => ({...})` — `set` は**状態を更新するための関数**。Zustand が自動で渡してくれる
- 返り値は React の **カスタムフック**（`use` で始まる名前）になる

---

### 初期状態

```typescript
  currentQuestionIndex: 0,      // 最初は0問目
  selectedChoiceIds: [],         // 何も選んでいない
  results: [],                   // 正誤履歴は空
  phase: "answering",            // 回答フェーズから始まる
  submitResult: null,            // まだ回答していない
```

---

### アクション: `toggleChoice`

```typescript
  toggleChoice: (id) =>
    set((state) => ({
      selectedChoiceIds: state.selectedChoiceIds.includes(id)
        ? state.selectedChoiceIds.filter((x) => x !== id)
        : [...state.selectedChoiceIds, id],
    })),
```

- `set((state) => ({...}))` — **現在の state を受け取って**、新しい値を返す形式
- この書き方は「関数形式の set」と呼ぶ。直前の state を参照したいときに使う
- 条件分岐：
  - すでに `id` が含まれていれば → `filter` で取り除く（チェックを外す）
  - 含まれていなければ → スプレッド演算子で末尾に追加する（チェックを入れる）
- **イミュータブル（不変）**: 既存の配列を変更せず、常に新しい配列を返す

---

### アクション: `setSubmitResult`

```typescript
  setSubmitResult: (result) =>
    set((state) => ({
      submitResult: result,
      phase: "result",
      results: [...state.results, { isCorrect: result.isCorrect }],
    })),
```

- 回答を送信したあとに呼ばれる
- **一度に複数の状態を更新できる**のが Zustand の便利な点
- `phase: "result"` で回答フェーズから結果表示フェーズに遷移
- `results` に今回の正誤（`{ isCorrect: true/false }`）を追加

---

### アクション: `nextQuestion`

```typescript
  nextQuestion: (total) =>
    set((state) => {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= total) {
        return {
          phase: "finished",
          currentQuestionIndex: nextIndex,
          selectedChoiceIds: [],
          submitResult: null,
        };
      }
      return {
        currentQuestionIndex: nextIndex,
        selectedChoiceIds: [],
        phase: "answering",
        submitResult: null,
      };
    }),
```

- `set` に関数を渡しているが、今回はオブジェクトではなく**ブロック形式**（`{ ... }` ではなく `{ ... return ... }`）
- `nextIndex >= total` — 最後の問題を超えたら `"finished"` フェーズへ
- それ以外は次の問題へ。`selectedChoiceIds` と `submitResult` をリセットする

---

### アクション: `reset`

```typescript
  reset: () =>
    set({
      currentQuestionIndex: 0,
      selectedChoiceIds: [],
      results: [],
      phase: "answering",
      submitResult: null,
    }),
```

- `set` に**オブジェクトを直接渡す**形式（「オブジェクト形式の set」）
- 前の state を参照しない場合はこの書き方でよい
- Zustand は渡したキーだけを更新し、他のキーは**マージして保持**する（上書きではない）

---

## ストアの読み取り — セレクター

コンポーネント側でストアを使うときは、カスタムフック `useQuizStore` を呼び出す。

### `QuizPage.tsx` での例

```typescript
const phase = useQuizStore((s) => s.phase);
const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
const results = useQuizStore((s) => s.results);
const submitResult = useQuizStore((s) => s.submitResult);
const nextQuestion = useQuizStore((s) => s.nextQuestion);
const reset = useQuizStore((s) => s.reset);
```

- `useQuizStore((s) => s.phase)` の `(s) => s.phase` を**セレクター**と呼ぶ
- セレクターで「ストア全体の中から何を取り出すか」を指定する
- **パフォーマンス最適化**: セレクターで指定した値が変わったときだけコンポーネントが再レンダリングされる

#### 一行ずつ読む

```typescript
const phase = useQuizStore((s) => s.phase);
// s = ストアの全状態
// s.phase = "answering" | "result" | "finished" の現在値を取得
// phase が変わるたびにこのコンポーネントが再描画される

const nextQuestion = useQuizStore((s) => s.nextQuestion);
// アクション関数もセレクターで取り出せる
// 関数は参照が変わらないので、これだけで再レンダリングは起きない
```

---

### `ChoiceList.tsx` での例

```typescript
const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds);
const toggleChoice = useQuizStore((s) => s.toggleChoice);
```

```typescript
<Checkbox
  checked={selectedChoiceIds.includes(choice.id)}
  onCheckedChange={() => toggleChoice(choice.id)}
/>
```

- `selectedChoiceIds.includes(choice.id)` — この選択肢が選ばれているか確認
- `toggleChoice(choice.id)` — チェックボックスを変更したら、ストアの状態を更新

ユーザーがチェックボックスをクリック → `toggleChoice` 呼び出し → ストアの `selectedChoiceIds` が更新 → `useQuizStore((s) => s.selectedChoiceIds)` を使っているコンポーネント全体が再レンダリング → チェックボックスの見た目が変わる

---

### `QuizCard.tsx` での例

```typescript
const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds);

<ShimmerButton
  disabled={selectedChoiceIds.length === 0 || submitMutation.isPending}
>
```

- `ChoiceList` が `toggleChoice` でストアを更新すると、`QuizCard` も自動的に再レンダリングされて `selectedChoiceIds` の最新値を取得できる
- props でのやり取りなしに、兄弟コンポーネント間でデータが同期される

---

## `useCurrentQuestion` と `useSubmitAnswer`

`useQuiz.ts` には Zustand ストアのほかに、TanStack Query と連携した関数も定義されている。

### `useCurrentQuestion`

```typescript
export function useCurrentQuestion() {
  const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   Zustand から現在の問題番号を取得

  return useQuery({
    queryKey: ["quiz", "next", currentQuestionIndex],
    //                         ^^^^^^^^^^^^^^^^^^^
    //   currentQuestionIndex が変わると queryKey が変わり
    //   自動的に新しい問題データをフェッチする
    queryFn: async () => {
      const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
      ...
    },
  });
}
```

- Zustand の状態変化（問題番号）が TanStack Query のキャッシュキーに反映される
- `nextQuestion` を呼んで `currentQuestionIndex` が増える → `useCurrentQuestion` が自動で次の問題をフェッチする

### `useSubmitAnswer`

```typescript
export function useSubmitAnswer() {
  const setSubmitResult = useQuizStore((s) => s.setSubmitResult);
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //   Zustand のアクションを取得

  return useMutation({
    mutationFn: async ({ questionId, selectedChoiceIds }) => {
      // API に POST して回答を送信
      ...
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      // ^^^^^^^^^^^^^^^^
      // 成功したら Zustand のストアを更新
      // → phase が "result" になり、結果が表示される
    },
  });
}
```

---

## データフローの全体像

```
ユーザーがチェックボックスをクリック
  ↓
ChoiceList: toggleChoice(id) を呼ぶ
  ↓
Zustand Store: selectedChoiceIds を更新
  ↓
QuizCard と ChoiceList が再レンダリング
  ↓
ユーザーが「解答する」ボタンをクリック
  ↓
QuizCard: useSubmitAnswer().mutate() を呼ぶ
  ↓
API に POST → 回答結果が返ってくる
  ↓
onSuccess: setSubmitResult(data) を呼ぶ
  ↓
Zustand Store: phase = "result", submitResult = data
  ↓
QuizPage が再レンダリング → ResultDisplay を表示
  ↓
ユーザーが「次の問題へ」をクリック
  ↓
QuizPage: nextQuestion(total) を呼ぶ
  ↓
Zustand Store: currentQuestionIndex++, phase = "answering"
  ↓
useCurrentQuestion の queryKey が変わる → 次の問題をフェッチ
```

---

## まとめ

| Zustand の概念 | このプロジェクトでの例 |
|----------------|----------------------|
| `create` でストア定義 | `useQuizStore = create<QuizStoreState>(...)` |
| 初期状態 | `currentQuestionIndex: 0`, `phase: "answering"` など |
| オブジェクト形式の `set` | `reset` アクション |
| 関数形式の `set(state => ...)` | `toggleChoice`, `setSubmitResult`, `nextQuestion` |
| セレクターで読み取り | `useQuizStore((s) => s.phase)` |
| 複数コンポーネントで共有 | `QuizPage`, `QuizCard`, `ChoiceList` が同じストアにアクセス |

---

## Zustand を使うときの設計指針

### 1. 何をストアに入れるか — 状態の分類

すべての状態を Zustand に入れる必要はない。状態を以下の基準で分類する。

| 状態の種類 | 説明 | 置き場所 |
|-----------|------|---------|
| **ローカル UI 状態** | 一つのコンポーネントだけが使う（モーダルの開閉、入力中の文字列） | `useState` |
| **サーバー状態** | API から取得したデータ、キャッシュが必要なもの | TanStack Query |
| **共有クライアント状態** | 複数コンポーネントをまたいで同期する必要があるもの | **Zustand** |

このプロジェクトでの例：
- `phase` — `QuizPage` と `QuizCard` の両方が参照 → Zustand
- `selectedChoiceIds` — `ChoiceList`（更新）と `QuizCard`（読み取り）で共有 → Zustand
- 現在の問題データ — API から取得、キャッシュしたい → TanStack Query（Zustand ではない）

### 2. ストアの粒度 — 一つ vs 複数

**小〜中規模のアプリ**: 機能ごとに 1 つのストアを作る（このプロジェクトはこのパターン）

```
useQuizStore   ← クイズ機能のすべての状態をまとめる
```

**大規模アプリ**: ドメイン境界で分割する

```
useUserStore   ← ユーザー認証・プロフィール
useCartStore   ← ショッピングカート
useUIStore     ← UI 状態（サイドバーの開閉など）
```

ストアを分けるメリット：
- 関心の分離ができる
- セレクターのスコープが狭くなり、不要な再レンダリングが減る

### 3. アクションをストア内に定義する（コロケーション）

このプロジェクトの設計の特徴として、アクションをストア内に定義している。

```typescript
// ❌ アンチパターン: アクションをコンポーネント側で書く
const store = useQuizStore();
// コンポーネントの中でロジックを書く
const handleToggle = (id) => {
  if (store.selectedChoiceIds.includes(id)) {
    store.setSelectedChoiceIds(store.selectedChoiceIds.filter(x => x !== id));
  } else {
    store.setSelectedChoiceIds([...store.selectedChoiceIds, id]);
  }
};

// ✅ このプロジェクトのパターン: アクションをストア内に定義する
const toggleChoice = useQuizStore((s) => s.toggleChoice);
// コンポーネントはアクションを呼ぶだけ
toggleChoice(id);
```

メリット：
- ビジネスロジックがストアに集まる（コンポーネントが薄くなる）
- ロジックの重複がない（どのコンポーネントから呼んでも同じ動作）
- テストしやすい（ストア単体でアクションのテストが書ける）

### 4. セレクターで必要な値だけ取り出す

```typescript
// ❌ ストア全体を取得する（アンチパターン）
const store = useQuizStore();
const phase = store.phase; // どの値が変わっても再レンダリングが走る

// ✅ セレクターで必要な値だけ取得する
const phase = useQuizStore((s) => s.phase); // phase が変わったときだけ再レンダリング
```

Zustand はセレクターの返り値を `Object.is` で比較し、変化があったときだけ再レンダリングする。
ストア全体を受け取ると、どこかの値が変わるたびに毎回再レンダリングされてしまう。

### 5. このプロジェクトの設計: `phase` で UI の状態機械を作る

このプロジェクトでは `phase` という状態が UI の遷移を管理している。これは**有限状態機械（FSM）**のパターン。

```
"answering" →（回答送信）→ "result" → （次へボタン）→ "answering"
                                               ↓（最終問題）
                                           "finished"
```

Zustand のストアに `phase` を持たせることで：
- どの UI を表示するかのロジックをコンポーネントから切り離せる
- 不正な状態遷移を防ぎやすい（例: `"finished"` から `"result"` にはならない）
- ストアを見るだけでアプリの状態が把握できる

```typescript
// QuizPage.tsx での使用例
if (phase === "finished") return <FinalResult />;
// phase === "answering" のとき
{phase === "answering" && <QuizCard />}
// phase === "result" のとき
{phase === "result" && submitResult && <ResultDisplay />}
```

### 6. TanStack Query と Zustand の役割分担

このプロジェクトの設計で重要なのは、**何を Zustand に、何を TanStack Query に任せるか**の線引き。

```
Zustand（クライアント状態）
  - phase（現在のフェーズ）
  - selectedChoiceIds（選択中の回答）
  - results（正誤履歴）
  - currentQuestionIndex（何問目か）

TanStack Query（サーバー状態）
  - question（問題データ）← API から取得・キャッシュ
```

`useCurrentQuestion` では Zustand の `currentQuestionIndex` を TanStack Query の `queryKey` に埋め込むことで、状態変化が自動的に次の問題のフェッチを引き起こす。

```typescript
const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);
useQuery({
  queryKey: ["quiz", "next", currentQuestionIndex], // ここで連携
  queryFn: ...
});
```

この設計により、「問題番号を更新する」という一つの操作だけで、フェッチ・キャッシュ・表示の更新がすべて自動で行われる。
