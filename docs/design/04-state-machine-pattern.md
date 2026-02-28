# ステートマシンパターン（State Machine Pattern）

## どのパターンか？

**ステートマシン（状態機械）**は、オブジェクトが**有限個の状態**を持ち、
定義されたイベントによって状態が遷移する設計パターンです。

GoF パターンの **State パターン**がオブジェクト指向的な実装形式ですが、
本プロジェクトでは Zustand の状態管理として関数型スタイルで実現しています。

---

## 解決する問題

クイズのフローを単純な `if/else` で管理すると、すぐに複雑になります。

```typescript
// ❌ if/else が増え続ける設計
if (hasSubmitted && hasNextQuestion) {
  showNextButton();
} else if (hasSubmitted && !hasNextQuestion) {
  showFinalScore();
} else if (!hasSubmitted && isLoading) {
  showLoading();
} else {
  showQuizCard();
}
```

状態が増えるとすべての `if` を確認・修正する必要があり、バグの温床になります。

---

## 本プロジェクトでの実装

### 状態遷移図

```
        ┌─────────────────────────────────────┐
        │                                     │
        ▼                                     │
 ┌─────────────┐  submitAnswer  ┌──────────┐  │ reset
 │  answering  │ ────────────▶  │  result  │  │
 └─────────────┘                └──────────┘  │
                                    │ nextQuestion (最後の問題でなければ answering へ)
                                    │ nextQuestion (最後の問題なら finished へ)
                                    ▼
                              ┌──────────┐
                              │ finished │ ─────────────────────▶ (reset で answering へ)
                              └──────────┘
```

### 状態定義
`src/features/quiz/presentation/hooks/useQuiz.ts`

```typescript
phase: "answering" | "result" | "finished"
```

3つの状態しか存在しないことを型で表現しています。
`"some-other-state"` のような不正な状態をコンパイル時に防げます。

### 状態遷移アクション

```typescript
// answering → result（回答送信後）
setSubmitResult: (result) =>
  set((state) => ({
    submitResult: result,
    phase: "result",                    // ← 状態遷移
    results: [...state.results, { isCorrect: result.isCorrect }],
  })),

// result → answering または result → finished（次の問題へ）
nextQuestion: (total) =>
  set((state) => {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex >= total) {
      return { phase: "finished", ... }; // ← finished へ遷移
    }
    return { phase: "answering", ... };  // ← answering へ遷移
  }),

// finished → answering（リセット）
reset: () =>
  set({ phase: "answering", ... }),
```

### UI での利用（QuizPage.tsx）

```typescript
// phase に応じてレンダリング内容を切り替える
if (phase === "finished") {
  return <FinalResult ... />;
}

return (
  <>
    {phase === "answering" && <QuizCard ... />}
    {phase === "result" && <ResultDisplay ... />}
  </>
);
```

UI はステートマシンの**現在の状態を観察**するだけで、
どの状態遷移が起きたかを気にする必要がありません。

---

## GoF の State パターンとの比較

### GoF の State パターン（オブジェクト指向）

```typescript
// 状態をクラスで表現
interface QuizState {
  submitAnswer(context: QuizContext): void;
  nextQuestion(context: QuizContext): void;
}

class AnsweringState implements QuizState {
  submitAnswer(context: QuizContext) {
    context.setState(new ResultState());
  }
  nextQuestion() { /* 無効 */ }
}

class ResultState implements QuizState {
  nextQuestion(context: QuizContext) {
    context.setState(new AnsweringState());
  }
  submitAnswer() { /* 無効 */ }
}
```

### 本プロジェクトの実装（関数型）

Zustand を使った本プロジェクトでは、状態をクラスではなく
**型付き文字列リテラル + 純粋関数**で表現しています。

```typescript
// 状態は型で表現
phase: "answering" | "result" | "finished"

// 遷移は純粋関数で表現
nextQuestion: (total) => set((state) => {
  return nextIndex >= total
    ? { phase: "finished" }
    : { phase: "answering" };
})
```

どちらも本質的には同じステートマシンですが、
関数型スタイルの方がシンプルで、React のエコシステムとも相性が良いです。

---

## メリット

| メリット | 説明 |
|---------|------|
| **不正状態の排除** | TypeScript 型が存在しない状態を防ぐ |
| **遷移の明確化** | どのアクションでどの状態に移るかが一目でわかる |
| **UI のシンプル化** | UI は現在の状態を参照するだけでよい |
| **バグの早期発見** | 不正な状態遷移がコンパイルエラーになる |
