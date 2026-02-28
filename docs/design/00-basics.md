# デザインパターン 基礎知識

## デザインパターンとは？

**デザインパターン**とは、ソフトウェア開発でよく遭遇する問題に対する「再利用可能な解法の設計図」です。

1994年に発表された書籍 *Design Patterns: Elements of Reusable Object-Oriented Software*（通称 **GoF本**）で体系化され、23種類のパターンが定義されています。

---

## なぜ使うのか？

| 目的 | 説明 |
|------|------|
| **コードの意図を伝える** | 「これはStrategyパターンだ」と言えば構造が伝わる |
| **変更しやすくする** | パターンは「変化する部分を分離する」ことが多い |
| **テストしやすくする** | 依存を抽象に向けるため、差し替えが容易になる |
| **再発明を防ぐ** | 先人が解いた問題を一から考えなくてよい |

---

## GoF の 3 分類

### 生成パターン（Creational）
オブジェクトの**生成方法**を扱う。生成ロジックを隠蔽することで、コードの柔軟性を高める。

| パターン | 一言説明 |
|---------|---------|
| Singleton | インスタンスを1つだけに制限する |
| **Factory Method** | サブクラスがどのオブジェクトを生成するか決める |
| Abstract Factory | 関連するオブジェクト群をまとめて生成する |
| Builder | 複雑なオブジェクトを段階的に組み立てる |
| Prototype | 既存オブジェクトをコピーして生成する |

### 構造パターン（Structural）
クラスやオブジェクトの**組み合わせ方**を扱う。

| パターン | 一言説明 |
|---------|---------|
| Adapter | 互換性のないインターフェースを変換する |
| **Facade** | 複雑なサブシステムに簡単な窓口を提供する |
| Decorator | オブジェクトに機能を動的に追加する |
| Composite | ツリー構造でオブジェクトを扱う |
| Proxy | オブジェクトへのアクセスを代理する |

### 振る舞いパターン（Behavioral）
オブジェクト間の**責任の分担と通信**を扱う。

| パターン | 一言説明 |
|---------|---------|
| **Strategy** | アルゴリズムを切り替え可能にする |
| **Observer** | 状態変化を他のオブジェクトに通知する |
| **State** | 状態に応じて振る舞いを変える |
| **Template Method** | 処理の骨格を定め、詳細はサブクラスに委ねる |
| Command | 操作をオブジェクトとしてカプセル化する |
| Iterator | コレクションを順に走査する方法を提供する |

---

## 本プロジェクトで使われているパターン

| パターン | 場所 | 分類 |
|---------|------|------|
| Repository | `domain/ports/` + `infrastructure/repositories/` | 構造 |
| Factory | `infrastructure/getRepository.ts` | 生成 |
| Strategy | `infrastructure/media/imageResolver.ts` | 振る舞い |
| Facade | `application/services/quizService.ts` | 構造 |
| State Machine | `presentation/hooks/useQuiz.ts` | 振る舞い |
| Observer | Zustand の subscription 機構 | 振る舞い |

各パターンの詳細は以下のドキュメントを参照してください。

- [01-repository-pattern.md](./01-repository-pattern.md)
- [02-strategy-pattern.md](./02-strategy-pattern.md)
- [03-facade-pattern.md](./03-facade-pattern.md)
- [04-state-machine-pattern.md](./04-state-machine-pattern.md)

---

## 「パターンは目的ではなく手段」

パターンを使うこと自体が目的になってはいけません。
「この問題を解決するために、このパターンが適切だ」という判断が大切です。
無理にパターンを当てはめると、かえって複雑になることもあります。
