# 概要
- 音楽のラップの韻に関するクイズサイトです
- 問題文（例:「とら」）と同じ母音パターンを持つ選択肢を選ぶゲームです
- AIにコードを書かせて実装

<img width="250" alt="スクリーンショット 2026-02-26 0 21 17" src="https://github.com/user-attachments/assets/011fe1bd-92eb-456c-9166-c3f5211a4462" />
<br>
<img width="250" alt="スクリーンショット 2026-02-26 0 46 29" src="https://github.com/user-attachments/assets/00f4b646-ab1c-43ca-bf14-d59c7e93557b" />
<br>
<img width="250" alt="スクリーンショット 2026-02-26 0 48 13" src="https://github.com/user-attachments/assets/2a9b7e8b-2a99-4108-8bcc-ca91e6b8d662" />
<br>


# URL
  - [韻クイズ](https://rhyme-quiz-claude.tvhfrks12678.workers.dev/)

# 技術スタック
- 言語: TypeScript
- フレームワーク: TanStack Start（React 19）
- クライアント状態管理: zustand
- サーバーデータ取得: TanStack Query
- バリデーション: zod
- UI: shadcn/ui + Magic UI + Tailwind CSS v4
- AI: Claude Code
- インフラ: Cloudflare Workers

---

# クイズの動作フロー

```
1. ユーザーが /quiz にアクセス
2. GET /api/quiz/next → 問題文 + 選択肢（正解情報なし）を返す
3. ユーザーがチェックボックスで選択肢を選ぶ
4. 「解答する」ボタンを押す
5. POST /api/quiz/:id/submit → サーバーで正誤判定
6. 結果を表示（正解/不正解・解説・全選択肢の母音・問題文の母音）
7. 「次の問題へ」で次の問題に進む（全5問）
```

> **セキュリティ設計**: クイズ表示時に母音・正解フラグはフロントに送らず、正誤判定はサーバーサイドで行います。DevToolsで答えが見えないよう設計されています。

---

# ディレクトリ構造

```
src/
├── components/
│   └── ui/                        # shadcn/ui 共通UIパーツ（Button, Card など）
│
├── features/
│   └── quiz/
│       ├── contracts/             # API契約（zodスキーマ + 型定義）
│       │   └── quiz.ts
│       │
│       ├── domain/                # フレームワーク完全非依存の純粋ビジネスロジック
│       │   ├── entities/          # 内部データ型（DB/JSONから取得した完全なデータ）
│       │   │   └── quiz.ts
│       │   ├── logic/             # 純粋関数（テスト可能なビジネスルール）
│       │   │   ├── rhyme.ts       # 韻の正誤判定ロジック
│       │   │   └── scoring.ts     # スコア計算ロジック
│       │   └── ports/             # リポジトリのインターフェース定義
│       │       └── quizRepository.ts
│       │
│       ├── application/           # ユースケース層（フレームワーク非依存）
│       │   └── services/
│       │       └── quizService.ts # ユースケースの実行（取得 → ロジック適用 → 返却）
│       │
│       ├── infrastructure/        # 外部依存の実装（DB・JSON読み込みなど）
│       │   ├── data/
│       │   │   └── quizData.ts    # クイズデータ（現在はTypeScriptベタ書き）
│       │   ├── repositories/
│       │   │   └── jsonQuizRepository.ts  # QuizRepositoryのJSON実装
│       │   └── getRepository.ts   # 実装の切り替えポイント（今後DBへの移行に対応）
│       │
│       ├── presentation/          # React UI層
│       │   ├── hooks/
│       │   │   └── useQuiz.ts     # zustand store + TanStack Query
│       │   ├── parts/
│       │   │   ├── QuizCard.tsx   # 問題文・画像・選択肢・解答ボタン
│       │   │   ├── ChoiceList.tsx # チェックボックス形式の選択肢リスト
│       │   │   ├── ResultDisplay.tsx # 正解/不正解・解説・母音表示
│       │   │   └── ScoreDisplay.tsx  # スコアとプログレスバー
│       │   └── QuizPage.tsx       # ページ全体の組み立て
│       │
│       └── index.ts               # featureの公開API（外部への公開エントリポイント）
│
└── routes/
    ├── __root.tsx                 # ルートレイアウト
    ├── index.tsx                  # トップページ
    ├── quiz.tsx                   # クイズページ（QuizPageをインポート）
    └── api/quiz/
        ├── next.ts                # GET  /api/quiz/next
        └── $id.submit.ts          # POST /api/quiz/:id/submit
```

---

# 各ディレクトリの役割と処理の流れ

## アーキテクチャの概要（ヘキサゴナルアーキテクチャ）

```
[ユーザー操作]
     ↓
presentation/       ← React UI。/api/* を TanStack Query で叩く
     ↓  (HTTP)
routes/api/         ← HTTP ルーティング層（薄いラッパー）
     ↓
application/        ← ユースケースの実行（フレームワーク非依存）
     ↓
domain/             ← ビジネスルール（純粋TypeScript。何にも依存しない）
     ↑
infrastructure/     ← 外部依存の実装（domain/ports のインターフェースを満たす）
```

## 各層の説明

### `contracts/` — API契約
- **役割**: クライアントとサーバー間でやり取りするデータの型・バリデーションを一元管理
- **依存**: `zod` のみ
- `QuizQuestionSchema` / `SubmitRequestSchema` / `SubmitResponseSchema` を定義
- **重要**: 母音・正解フラグは含まない（答えの漏洩防止）

### `domain/entities/` — 内部データ型
- **役割**: サーバー内部でのみ扱う完全なクイズデータの型定義
- `QuizFull` — `questionVowels`（母音）や `isCorrect` フラグを含む完全なクイズデータ
- `ChoiceFull` — 各選択肢の母音・正解フラグを含む
- `QuizResult` — 正誤判定の結果型
- **contracts/ との違い**: contracts はクライアントへ公開する型（答え情報なし）、entities はサーバー内部の完全なデータ型

### `domain/logic/` — 純粋なビジネスロジック
- **役割**: フレームワークに依存しない、テスト可能な純粋関数
- `rhyme.ts` — `judgeAnswer(quiz, selectedIds)` 選択された選択肢の母音と問題文の母音を比較して正誤判定
- `scoring.ts` — `calculateScore(results)` 結果配列から正解数・正答率を計算

### `domain/ports/` — リポジトリインターフェース
- **役割**: データ取得方法の抽象化（実装の詳細に依存しない）
- `QuizRepository` インターフェース: `findAllQuestions()` / `findFullById(id)`

### `application/services/` — ユースケース層
- **役割**: 「問題を取得して返す」「回答を受け取って判定する」というユースケースを実行
- `getQuestionByIndex(index)` — リポジトリから問題を取得し、クライアント用に整形（答え情報を除外）
- `submitAnswer(id, selectedIds)` — リポジトリから完全データを取得し、`judgeAnswer` で判定して返す

### `infrastructure/` — 外部依存の実装
- **役割**: データの実際の取得方法を担当（domain/ports のインターフェースを実装）
- `data/quizData.ts` — 現在はTypeScriptで書いたクイズデータ（将来はDB移行予定）
- `repositories/jsonQuizRepository.ts` — `QuizRepository` のJSON実装
- `getRepository.ts` — 実装の切り替えポイント（JSON実装 → DB実装への切り替えをここで行う）

### `presentation/` — React UI層
- **役割**: ユーザーインターフェースと状態管理
- **依存**: `contracts/`（型のみ）、`domain/logic/scoring`（純粋関数）
- `useQuiz.ts` — zustand で状態管理 + TanStack Query で `/api` を叩く
- UIコンポーネント: 問題・選択肢・結果・スコアを表示

---

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Uninstall the packages: `pnpm add @tailwindcss/vite tailwindcss --dev`

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
pnpm lint
pnpm format
pnpm check
```


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
