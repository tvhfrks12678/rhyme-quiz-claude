# Claude Code / Codex 用 実装指示書

## 前提
- このファイルと rhyme-quiz-spec.md を両方読んでから作業を開始すること
- rhyme-quiz-spec.md にディレクトリ構造、API仕様、データ、UI仕様が記載されている
- フェーズごとに検証を行い、全ステップ成功するまで次に進まないこと

---

## 技術スタック
- TanStack Start（フルスタック）
- React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4
- zustand（クライアント状態管理）
- @tanstack/react-query（サーバーデータ取得）
- zod（バリデーション）

---

## 重要な設計ルール（必ず守ること）

1. **UIは createServerFn を直接呼ばない。TanStack Query で `/api/quiz/*` を fetch するだけ**
2. **domain/ と application/ はフレームワーク非依存**（React, TanStack Start のインポート禁止）
3. **contracts/quiz.ts が API の型の唯一の真実**（zod schema から型を導出）
4. **クイズ表示時に母音・正解フラグをフロントに送らない**（DevToolsで答えが見える）
5. **正誤判定はサーバーサイドで行う**（POST /api/quiz/:id/submit）

---

## フェーズ1: プロジェクト初期化 + 最小構成で動かす

### やること
1. TanStack Start プロジェクトを作成
2. shadcn/ui をセットアップ（button, card, checkbox, badge, progress を追加）
3. 以下のファイルを作成:
   - `src/features/quiz/contracts/quiz.ts`（zod schema + 型定義）
   - `src/features/quiz/domain/entities/quiz.ts`（内部データ型）
   - `src/features/quiz/domain/ports/quizRepository.ts`（interface）
   - `src/features/quiz/infrastructure/data/quizData.ts`（ベタ書きデータ 5問）
   - `src/features/quiz/infrastructure/repositories/jsonQuizRepository.ts`
   - `src/features/quiz/infrastructure/getRepository.ts`
   - `src/features/quiz/application/services/quizService.ts`（フレームワーク非依存）
4. Server Routes を作成:
   - `app/routes/api/quiz/next.ts`（GET: 問題取得）
   - `app/routes/api/quiz/$id.submit.ts`（POST: 回答判定）
5. 最低限の QuizPage.tsx を作成（問題文と選択肢がテキストで表示されるだけでOK）
6. `app/routes/quiz.tsx` から QuizPage をインポート

### フェーズ1 の検証（必ず全て実行すること）
```bash
pnpm install
npx tsc --noEmit          # 型エラー 0件
pnpm build                # ビルド成功
pnpm dev &                # バックグラウンドで起動
sleep 5                   # サーバー起動を待つ
curl -s http://localhost:3000/ | head -20           # HTMLが返る
curl -s http://localhost:3000/api/quiz/next          # JSON（問題+選択肢）が返る
curl -s -X POST http://localhost:3000/api/quiz/q1/submit \
  -H "Content-Type: application/json" \
  -d '{"selectedChoiceIds":["q1-c1"]}' # JSON（判定結果）が返る
kill %1                   # devサーバー停止
```

**検証結果を報告すること。エラーがあれば修正して再検証。全て成功するまで完了としない。**

---

## フェーズ2: ドメインロジック + テスト

### やること
1. `src/features/quiz/domain/logic/rhyme.ts` を実装
   - `judgeAnswer(quiz: QuizFull, selectedIds: string[]): QuizResult`
   - `extractVowels(text: string): string`（日本語ひらがなの母音抽出）
2. `src/features/quiz/domain/logic/scoring.ts` を実装
   - `calculateScore(results: { isCorrect: boolean }[]): { correct, total, percentage }`
3. テストを書く（vitest を導入）
   - `judgeAnswer` のテスト: 正解パターン、不正解パターン、複数正解パターン
   - `extractVowels` のテスト: 「とら」→「おあ」、「くるま」→「ううあ」
   - `calculateScore` のテスト

### フェーズ2 の検証
```bash
pnpm add -D vitest
# package.json の scripts に "test": "vitest run" を追加
pnpm test                 # 全テスト通る
npx tsc --noEmit          # 型エラー 0件
```

---

## フェーズ3: UI 作り込み

### やること
1. zustand store を作成: `src/features/quiz/presentation/hooks/useQuiz.ts`
   - 状態: currentQuestionIndex, selectedChoiceIds, results[], score, phase('answering'|'result')
   - アクション: toggleChoice, submitAnswer, nextQuestion, reset
2. TanStack Query で /api を叩く hooks を useQuiz.ts 内に実装
3. UIコンポーネントを実装（shadcn/ui を使用）:
   - `QuizCard.tsx`: 問題文 + 画像スペース（プレースホルダー） + 選択肢 + 解答ボタン
   - `ChoiceList.tsx`: shadcn の Checkbox を使ったチェックボックス選択肢
   - `ResultDisplay.tsx`: 正解/不正解 + 全選択肢の母音表示 + 解説
   - `ScoreDisplay.tsx`: 現在のスコア + プログレスバー
4. `QuizPage.tsx` で全コンポーネントを組み立て

### UIの注意点
- 画像スペースは 160x160px のプレースホルダー（グレー背景 + アイコン）を用意
  - 将来 `/images/{imageKey}.png` で画像を表示する想定
- 選択肢はチェックボックス形式（複数選択可能）
- 解答前: 問題文 + 選択肢 + 解答ボタン
- 解答後: 結果 + 解説 + 母音表示 + 次の問題ボタン
- 全問終了後: 最終スコア表示 + もう一度ボタン

### フェーズ3 の検証
```bash
npx tsc --noEmit          # 型エラー 0件
pnpm build                # ビルド成功
pnpm dev &
sleep 5
curl -s http://localhost:3000/quiz | head -50   # クイズページのHTMLが返る
kill %1
```

**加えて、以下の手動確認ポイントを報告すること:**
- /quiz にアクセスして問題文と選択肢が表示されるか
- チェックボックスで選択肢を選べるか
- 解答ボタンを押して結果が表示されるか（正解/不正解、解説、母音）
- 次の問題に進めるか
- 全5問終了後にスコアが表示されるか

---

## フェーズ4: スタイリング仕上げ

### やること
1. レスポンシブ対応（モバイルファースト）
2. 正解時/不正解時のビジュアルフィードバック
   - 正解: 緑色の背景 + チェックアイコン
   - 不正解: 赤色の背景 + バツアイコン
3. 母音表示を見やすくする（色分け: 一致する母音をハイライト）
4. プログレスバーのアニメーション
5. 全体的な見た目の調整（余白、フォントサイズ、カード影）

### フェーズ4 の検証
```bash
npx tsc --noEmit
pnpm build
pnpm test
```

---

## 全フェーズ共通のルール

### エラー対応
- エラーが出たら原因を特定して修正し、そのフェーズの検証を最初からやり直すこと
- 「動きました」ではなく、各コマンドの実行結果（成功/失敗 + エラー内容）を報告すること
- 全ステップが通るまで完了とみなさないこと

### コード品質
- any の使用禁止（型を明示すること）
- console.log でのデバッグを残さないこと
- 未使用の import を残さないこと

### ファイルの命名規則
- コンポーネント: PascalCase（QuizCard.tsx）
- hooks/関数: camelCase（useQuiz.ts, quizService.ts）
- 型/interface: PascalCase（QuizFull, QuizRepository）
- ディレクトリ: kebab-case（server-fns/ は使わない場合は除外）

---

## 最終確認チェックリスト

完了時に以下の全てが満たされていることを確認して報告すること:

- [ ] `pnpm install` がエラーなく完了する
- [ ] `npx tsc --noEmit` が型エラー 0件
- [ ] `pnpm build` が成功する
- [ ] `pnpm test` が全テスト通る
- [ ] `pnpm dev` で開発サーバーが起動する
- [ ] GET /api/quiz/next が問題データ（正解情報なし）を返す
- [ ] POST /api/quiz/:id/submit が正誤判定結果を返す
- [ ] /quiz ページで問題が表示される
- [ ] チェックボックスで選択 → 解答 → 結果表示 が動く
- [ ] 全5問完了後にスコアが表示される
- [ ] domain/ と application/ に React や TanStack Start のインポートがない
- [ ] contracts/quiz.ts に zod schema が定義されている
