# TypeScript 型システム基礎解説

## TypeScript を使う理由

JavaScript は動的型付け言語のため、変数に何の型の値でも入れられる。
TypeScript は静的型付けを追加することで、バグをコンパイル時（実行前）に検出できる。

```typescript
// JavaScript（型なし）
function add(a, b) {
  return a + b;
}
add(1, "2"); // 実行して初めて "12"（文字列結合）になると気づく

// TypeScript（型あり）
function add(a: number, b: number): number {
  return a + b;
}
add(1, "2"); // ✕ コンパイルエラー：引数の型が合わない（実行前に気づける）
```

---

## interface とは

オブジェクトの形（プロパティとその型）を定義する。
「このオブジェクトはこういう形でなければならない」というルールを作る。

### このプロジェクトでの使用箇所

| ファイル | interface の例 |
|----------|---------------|
| `src/features/quiz/domain/entities/quiz.ts` | `QuizFull`, `ChoiceFull`, `QuizResult` |
| `src/features/quiz/domain/ports/quizRepository.ts` | `QuizRepository` |
| `src/features/quiz/presentation/parts/QuizCard.tsx` | `QuizCardProps` |

---

## interface のコード例

```typescript
// entities/quiz.ts（このプロジェクトの実際のコード）

// ChoiceFull: 選択肢の内部データ型
export interface ChoiceFull {
  id: string;          // 選択肢の一意な識別子（例: "q1-c1"）
  text: string;        // 表示テキスト（例: "おか"）
  vowels: string;      // 母音（例: "おあ"）
  isCorrect: boolean;  // 正解かどうか
}

// QuizFull: クイズ問題の内部データ型
export interface QuizFull {
  id: string;                      // 問題の一意な識別子
  questionWord: string;            // 問題の単語（例: "とら"）
  questionVowels: string;          // 問題の母音（例: "おあ"）
  imageKey: string;                // 画像ファイルのキー
  videoKey?: string;               // 動画ファイルのキー（省略可能）
  marqueeMode?: boolean;           // 横スクロールモードか（省略可能）
  verticalMarqueeMode?: boolean;   // 縦スクロールモードか（省略可能）
  explanation: string;             // 解説文
  choices: ChoiceFull[];           // 選択肢の配列
}
// ↑ ? が付いているプロパティはオプション（省略可能）
```

```typescript
// quizRepository.ts（このプロジェクトの実際のコード）

// QuizRepository: リポジトリの interface（実装クラスが従うべき規約）
export interface QuizRepository {
  findAllQuestions(): Promise<QuizFull[]>;           // 全問題を取得する
  findFullById(id: string): Promise<QuizFull | null>; // ID で1問取得する（なければ null）
}
// ↑ interface は「何ができるか」だけを定義する。実装は別クラスで書く
```

```typescript
// QuizCard.tsx（このプロジェクトの実際のコード）

// Props の型を interface で定義する
interface QuizCardProps {
  question: QuizQuestion; // 親から受け取るデータの型を明示する
}

export function QuizCard({ question }: QuizCardProps) {
  // question は必ず QuizQuestion 型の値が来ることが保証される
}
```

---

## type（型エイリアス）とは

型に名前を付けて再利用できるようにする。`interface` と似ているが、より広い用途で使える。

### interface と type の違い

| 特徴 | interface | type |
|------|-----------|------|
| オブジェクト型の定義 | ◯ | ◯ |
| Union 型（A か B か） | ✕ | ◯ |
| Intersection 型（A かつ B） | ◯（extends） | ◯（&） |
| プリミティブ型への別名 | ✕ | ◯ |
| 宣言のマージ（同名で追加定義） | ◯ | ✕ |

一般的には：
- **オブジェクトの形を定義するとき** → `interface`
- **Union 型や複雑な型を作るとき** → `type`

---

## type のコード例

```typescript
// QuizCard.tsx（このプロジェクトの実際のコード）

// Union 型：4つの文字列リテラル型のどれかを取る
type DisplayMode = "vertical-marquee" | "marquee" | "image" | "video";
// ↑ 決まった文字列しか入れられないので、タイポをコンパイル時に検出できる

const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
// displayMode には上の4つのいずれかしか代入できない
```

```typescript
// useQuiz.ts（このプロジェクトの実際のコード）

// interface で定義したストアの状態型
interface QuizStoreState {
  currentQuestionIndex: number;                      // 現在の問題番号（0始まり）
  selectedChoiceIds: string[];                       // 選択済みの選択肢 ID の配列
  results: Array<{ isCorrect: boolean }>;            // 各問題の結果
  phase: "answering" | "result" | "finished";        // 現在のフェーズ（Union 型）
  submitResult: SubmitResponse | null;               // 送信結果（null は未送信）
  toggleChoice: (id: string) => void;                // 選択肢のトグル関数
  setSubmitResult: (result: SubmitResponse) => void; // 結果を保存する関数
  nextQuestion: (total: number) => void;             // 次の問題に進む関数
  reset: () => void;                                 // リセット関数
}
```

---

## Union 型（|）とは

「A 型 または B 型」を表す。どちらの型の値も受け入れる。

```typescript
// 基本的な Union 型
type StringOrNumber = string | number;
const value: StringOrNumber = "hello"; // OK
const value2: StringOrNumber = 42;     // OK
// const value3: StringOrNumber = true; // ✕ boolean は含まれない

// null との Union（値がない可能性を表現する）
type User = {
  name: string;
  email: string | null; // メールアドレスは null の場合もある
};

// このプロジェクトでの例
submitResult: SubmitResponse | null;   // 送信前は null、送信後は SubmitResponse
phase: "answering" | "result" | "finished"; // フェーズは3つのうちのどれか
```

---

## オプションプロパティ（?）とは

`?` を付けると省略可能なプロパティになる。値が存在しない場合は `undefined` になる。

```typescript
// QuizFull の例（このプロジェクトの実際のコード）
export interface QuizFull {
  id: string;                    // 必須（省略不可）
  questionWord: string;          // 必須
  questionVowels: string;        // 必須
  imageKey: string;              // 必須
  explanation: string;           // 必須
  choices: ChoiceFull[];         // 必須
  videoKey?: string;             // 任意（省略可能）→ videoKey は string | undefined
  marqueeMode?: boolean;         // 任意
  verticalMarqueeMode?: boolean; // 任意
}

// 使う側では存在チェックが必要
const quiz: QuizFull = {
  id: "q1",
  questionWord: "とら",
  questionVowels: "おあ",
  imageKey: "tora",
  explanation: "「とら」の母音は「おあ」。",
  choices: [],
  // videoKey は省略（undefined になる）
};

if (quiz.videoKey) {
  // videoKey が存在する場合だけ処理する
  console.log(quiz.videoKey); // ここでは string 型として扱える
}

// オプショナルチェーン（?.）でも安全にアクセスできる
const upper = quiz.videoKey?.toUpperCase(); // videoKey が undefined なら undefined を返す
```

---

## Intersection 型（&）とは

「A 型 かつ B 型」を表す。2つの型を組み合わせる。

```typescript
type HasId = { id: string };
type HasName = { name: string };

// HasId と HasName 両方のプロパティを持つ型
type User = HasId & HasName;
// { id: string; name: string } と同じ

const user: User = {
  id: "u1",       // HasId のプロパティ
  name: "田中",   // HasName のプロパティ
};
```

---

## 型推論とは

TypeScript が型を自動で判断してくれる機能。
明示的に型を書かなくても、コードから型が推論される。

```typescript
// 型推論の例
const count = 0;         // number と推論される
const name = "田中";    // string と推論される
const active = true;    // boolean と推論される

// 関数の戻り値も推論される
const add = (a: number, b: number) => a + b;
// 戻り値の型は自動で number と推論される（: number を書かなくてよい）

// このプロジェクトでの例
const [imageError, setImageError] = useState(false);
// ↑ 初期値が false なので boolean 型と推論される（useState<boolean> と書かなくてよい）
```

---

## as const とは

配列やオブジェクトを「変更不可の定数」として扱い、より厳密な型にする。

```typescript
// as const なし → string[] 型（後から変更できる）
const phases = ["answering", "result", "finished"];
// phases の型は string[]

// as const あり → readonly ["answering", "result", "finished"] 型
const phases = ["answering", "result", "finished"] as const;
// phases の型は readonly ["answering", "result", "finished"]

// Union 型に変換するとき便利
type Phase = typeof phases[number]; // "answering" | "result" | "finished"
```

---

## 型システムまとめ

| 機能 | 記法 | 例 |
|------|------|----|
| interface | `interface Foo { ... }` | Props の型定義 |
| type エイリアス | `type Foo = ...` | Union 型、複雑な型 |
| Union 型 | `A \| B` | `string \| null`, `"answering" \| "result"` |
| Intersection 型 | `A & B` | 複数の型を合成する |
| オプションプロパティ | `key?: Type` | 省略可能なフィールド |
| 型推論 | 自動 | `useState(false)` → `boolean` |
| as const | `... as const` | 変更不可の定数、厳密な型 |
