# ラップ韻クイズサイト — 実装仕様書

## 概要
音楽のラップの韻に関するクイズサイト。
問題文（例:「とら」で踏める韻は？）に対して、母音パターンが一致する選択肢を選ぶ。

## 技術スタック
- **フレームワーク**: TanStack Start（フルスタック）
- **UI**: React + TypeScript + shadcn/ui + Tailwind CSS
- **クライアント状態**: zustand（スコア、問題番号、選択状態）
- **サーバーデータ取得**: TanStack Query（/api を fetch）
- **バリデーション**: zod（API契約の型とバリデーションを兼ねる）
- **デプロイ**: Cloudflare Pages
- **将来のDB**: Turso (libSQL) + Drizzle ORM

## 設計方針

### ヘキサゴナルアーキテクチャ（features 内）
- domain/ はフレームワーク完全非依存（純粋な型と関数のみ）
- application/ もフレームワーク非依存（ビジネスフロー制御のみ）
- infrastructure/ が外部依存（JSON読み込み、将来のDB接続）を担当
- presentation/ がReact UI

### HTTP API 中心設計（将来の分離に備える）
- **UIは createServerFn を直接呼ばない**
- UIは TanStack Query で `/api/quiz/*` を叩くだけにする
- TanStack Start の Server Routes で `/api/quiz/*` を提供
- 将来 Hono に移すとき、クライアント側は baseUrl を変えるだけで済む

### データ分離（答えの漏洩防止）
- クイズ表示時: 問題文 + 選択肢テキストだけ返す（母音・正解フラグは返さない）
- 回答送信時: サーバーで母音データ取得 → 正誤判定 → 結果を返す

---

## クイズの動作フロー

```
1. ユーザーが /quiz にアクセス
2. GET /api/quiz/next → 問題文 + 選択肢（正解情報なし）を返す
3. ユーザーがチェックボックスで選択肢を選ぶ
4. 「解答する」ボタンを押す
5. POST /api/quiz/:id/submit → サーバーで正誤判定
6. 結果を表示: 正解/不正解、解説、全選択肢の母音、問題文の母音
7. 「次の問題へ」で次に進む
```

---

## API 仕様（2本）

### GET /api/quiz/next
レスポンス:
```json
{
  "id": "q1",
  "questionWord": "とら",
  "imageKey": "tora",
  "choices": [
    { "id": "q1-c1", "text": "おか" },
    { "id": "q1-c2", "text": "ぶた" },
    { "id": "q1-c3", "text": "ふぐ" },
    { "id": "q1-c4", "text": "さる" }
  ]
}
```
※ 母音・正解フラグは含まない

### POST /api/quiz/:id/submit
リクエスト:
```json
{
  "selectedChoiceIds": ["q1-c1"]
}
```
レスポンス:
```json
{
  "isCorrect": true,
  "questionVowels": "おあ",
  "correctChoiceIds": ["q1-c1"],
  "explanation": "「とら」の母音は「おあ」。同じ母音パターンの「おか」が正解。",
  "choiceDetails": [
    { "id": "q1-c1", "text": "おか", "vowels": "おあ", "isCorrect": true },
    { "id": "q1-c2", "text": "ぶた", "vowels": "うあ", "isCorrect": false },
    { "id": "q1-c3", "text": "ふぐ", "vowels": "うう", "isCorrect": false },
    { "id": "q1-c4", "text": "さる", "vowels": "あう", "isCorrect": false }
  ]
}
```

---

## ディレクトリ構造

```
rhyme-quiz/
├── app/
│   ├── routes/
│   │   ├── __root.tsx                        # ルートレイアウト
│   │   ├── index.tsx                         # トップページ（/quiz へ誘導）
│   │   ├── quiz.tsx                          # クイズページ（QuizPage をインポート）
│   │   └── api/
│   │       └── quiz/
│   │           ├── next.ts                   # GET  /api/quiz/next（Server Route）
│   │           └── $id.submit.ts             # POST /api/quiz/:id/submit（Server Route）
│   ├── router.tsx                            # TanStack Router 設定
│   └── client.tsx                            # クライアントエントリ
│
├── src/
│   ├── components/
│   │   └── ui/                               # shadcn/ui 共通部品
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── badge.tsx
│   │       └── progress.tsx
│   │
│   └── features/
│       └── quiz/
│           ├── contracts/                    # ★ API契約（zod schema + 型）
│           │   └── quiz.ts                   #   Web/RN/API で共有できる唯一の真実
│           │
│           ├── domain/                       # ★ フレームワーク完全非依存
│           │   ├── entities/
│           │   │   └── quiz.ts               #   QuizFull, ChoiceFull（内部データ型）
│           │   ├── logic/
│           │   │   ├── rhyme.ts              #   judgeAnswer（純粋関数）
│           │   │   └── scoring.ts            #   calculateScore（クライアントでも使える）
│           │   └── ports/
│           │       └── quizRepository.ts     #   interface QuizRepository
│           │
│           ├── application/                  # ★ フレームワーク非依存
│           │   └── services/
│           │       └── quizService.ts        #   getAllQuizzes, submitAnswer
│           │                                 #   （createServerFn 等は使わない）
│           │
│           ├── infrastructure/               # ★ 外部依存の実装
│           │   ├── repositories/
│           │   │   ├── jsonQuizRepository.ts  #  今: JSONからの読み込み実装
│           │   │   └── drizzleQuizRepository.ts # 後: Turso + Drizzle 実装（空ファイル）
│           │   ├── getRepository.ts          #   実装の切り替えポイント
│           │   ├── data/
│           │   │   └── quizData.ts           #   ベタ書きクイズデータ（TypeScript）
│           │   └── db/
│           │       ├── client.ts             #   後: Turso接続設定
│           │       └── schema.ts             #   後: Drizzle スキーマ定義
│           │
│           ├── presentation/                 # ★ React UI
│           │   ├── hooks/
│           │   │   └── useQuiz.ts            #   zustand store + TanStack Query
│           │   ├── parts/
│           │   │   ├── QuizCard.tsx           #  問題文 + 画像スペース + 選択肢 + 解答ボタン
│           │   │   ├── ChoiceList.tsx         #  チェックボックス形式の選択肢
│           │   │   ├── ResultDisplay.tsx      #  正解/不正解 + 解説 + 母音表示
│           │   │   └── ScoreDisplay.tsx       #  現在のスコア表示
│           │   └── QuizPage.tsx              #   ページ全体の組み立て
│           │
│           └── index.ts                      # feature の公開API
│
├── public/
│   └── images/                               # クイズ画像（tora.png 等）
│       └── placeholder.png                   # プレースホルダー画像
│
├── app.config.ts                             # TanStack Start 設定
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json                           # shadcn/ui 設定
└── wrangler.toml                             # Cloudflare 設定（後で）
```

---

## 各ファイルの責務と依存関係

### contracts/quiz.ts（API契約）
```
依存: zod のみ
役割: リクエスト/レスポンスの schema と型を定義
     Web / React Native / Hono API で共有する唯一の真実
```

### domain/（フレームワーク非依存）
```
依存: 何にも依存しない（純粋TypeScript）
- entities/quiz.ts     → 内部データ型（QuizFull, ChoiceFull）
- logic/rhyme.ts       → judgeAnswer（QuizFull + selectedIds → QuizResult）
- logic/scoring.ts     → calculateScore（結果配列 → スコア）
- ports/quizRepository.ts → interface QuizRepository（findAllQuestions, findFullById）
```

### application/services/quizService.ts（フレームワーク非依存）
```
依存: domain/ports, domain/logic, infrastructure/getRepository
役割: ユースケースの実行（リポジトリ取得 → ロジック適用 → 結果返却）
     TanStack Start にも Hono にも依存しない
```

### app/routes/api/（TanStack Start 専用 — 将来 Hono に置換）
```
依存: application/services, contracts
役割: HTTP リクエスト → quizService 呼び出し → HTTP レスポンス
     薄いラッパー。分離時に Hono routes に差し替える
```

### presentation/（React 専用 — React Native 時は作り直し）
```
依存: contracts（型のみ）, domain/logic/scoring（純粋関数）
     /api/* を TanStack Query で叩く
役割: UI表示と状態管理
```

---

## 将来の分離シナリオ

```
TanStack Start（今）               Hono + React Native（将来）
────────────────────               ──────────────────────────
app/routes/api/*                   → Hono routes に置換
app/routes/quiz.tsx                → 削除
contracts/                         → そのまま共有 ✅（npm パッケージ化）
domain/                            → そのまま共有 ✅
application/                       → そのまま共有 ✅
infrastructure/repositories/       → そのまま共有 ✅（DB接続部分だけ調整）
infrastructure/getRepository.ts    → Hono の env から接続情報を注入する形に調整
presentation/                      → React Native で作り直し
```

---

## クイズデータ（5問分）

```typescript
// infrastructure/data/quizData.ts
export const quizzes = [
  {
    id: "q1",
    questionWord: "とら",
    questionVowels: "おあ",
    imageKey: "tora",
    explanation: "「とら」の母音は「おあ」。同じ母音パターンの「おか」が正解。",
    choices: [
      { id: "q1-c1", text: "おか", vowels: "おあ", isCorrect: true },
      { id: "q1-c2", text: "ぶた", vowels: "うあ", isCorrect: false },
      { id: "q1-c3", text: "ふぐ", vowels: "うう", isCorrect: false },
      { id: "q1-c4", text: "さる", vowels: "あう", isCorrect: false },
    ],
  },
  {
    id: "q2",
    questionWord: "くるま",
    questionVowels: "ううあ",
    imageKey: "kuruma",
    explanation: "「くるま」の母音は「ううあ」。同じ母音パターンの「つくば」が正解。",
    choices: [
      { id: "q2-c1", text: "つくば", vowels: "ううあ", isCorrect: true },
      { id: "q2-c2", text: "さくら", vowels: "あうあ", isCorrect: false },
      { id: "q2-c3", text: "みどり", vowels: "いおい", isCorrect: false },
      { id: "q2-c4", text: "かばん", vowels: "ああん", isCorrect: false },
    ],
  },
  {
    id: "q3",
    questionWord: "ひかり",
    questionVowels: "いあい",
    imageKey: "hikari",
    explanation: "「ひかり」の母音は「いあい」。同じ母音パターンの「みかき」が正解。",
    choices: [
      { id: "q3-c1", text: "みなみ", vowels: "いあい", isCorrect: true },
      { id: "q3-c2", text: "あさひ", vowels: "ああい", isCorrect: false },
      { id: "q3-c3", text: "いのち", vowels: "いおい", isCorrect: false },
      { id: "q3-c4", text: "きもち", vowels: "いおい", isCorrect: false },
    ],
  },
  {
    id: "q4",
    questionWord: "なみだ",
    questionVowels: "あいあ",
    imageKey: "namida",
    explanation: "「なみだ」の母音は「あいあ」。同じ母音パターンの「ありが（た）」が正解。",
    choices: [
      { id: "q4-c1", text: "かみな（り）", vowels: "あいあ", isCorrect: true },
      { id: "q4-c2", text: "おもて", vowels: "おおえ", isCorrect: false },
      { id: "q4-c3", text: "ゆめじ", vowels: "うえい", isCorrect: false },
      { id: "q4-c4", text: "はなび", vowels: "あああ", isCorrect: false },
    ],
  },
  {
    id: "q5",
    questionWord: "そら",
    questionVowels: "おあ",
    imageKey: "sora",
    explanation: "「そら」の母音は「おあ」。同じ母音パターンの「もり」ではなく「こま」が正解。",
    choices: [
      { id: "q5-c1", text: "こま", vowels: "おあ", isCorrect: true },
      { id: "q5-c2", text: "もり", vowels: "おい", isCorrect: false },
      { id: "q5-c3", text: "かぜ", vowels: "あえ", isCorrect: false },
      { id: "q5-c4", text: "つき", vowels: "うい", isCorrect: false },
    ],
  },
]
```

---

## UI イメージ

```
┌─────────────────────────────────────┐
│           韻クイズ  1 / 5           │  ← ScoreDisplay
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  ← ProgressBar
│                                     │
│  ┌─────────────┐                    │
│  │  🐯 (画像)  │  「とら」で        │  ← QuizCard
│  │             │   踏める韻は？     │
│  └─────────────┘                    │
│                                     │
│  ☐ おか                            │  ← ChoiceList（チェックボックス）
│  ☐ ぶた                            │
│  ☐ ふぐ                            │
│  ☐ さる                            │
│                                     │
│         [ 解答する ]                │
│                                     │
│  ── 解答後 ──────────────────────  │  ← ResultDisplay
│  🎉 正解！                          │
│                                     │
│  問題「とら」→ 母音: おあ           │
│                                     │
│  ✅ おか → 母音: おあ               │
│  ❌ ぶた → 母音: うあ               │
│  ❌ ふぐ → 母音: うう               │
│  ❌ さる → 母音: あう               │
│                                     │
│  解説: 「とら」の母音は「おあ」。   │
│  同じ母音パターンの「おか」が正解。 │
│                                     │
│         [ 次の問題へ ]              │
└─────────────────────────────────────┘
```
