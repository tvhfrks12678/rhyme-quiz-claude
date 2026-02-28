# リポジトリパターン（Repository Pattern）

## どのパターンか？

**リポジトリパターン**は、データの保存・取得処理（データアクセスロジック）をビジネスロジックから切り離すための構造パターンです。
GoFの23パターンには直接含まれませんが、ドメイン駆動設計（DDD）で広く知られるパターンです。

---

## 解決する問題

データソース（JSON、DB、外部API など）の詳細をビジネスロジックが知っていると、データソースが変わるたびにロジックも修正する必要が生じます。

```
❌ 問題のある設計
quizService.ts
  └─ quizData（JSON）を直接参照
        ↓
  JSONをDBに変えたい → quizService.ts も修正が必要
```

```
✅ リポジトリパターン
quizService.ts
  └─ QuizRepository（インターフェース）を参照  ← 抽象に依存
        ↓
  JsonQuizRepository が実装           ← 具体は差し替え可能
  DrizzleQuizRepository が実装（将来）
```

---

## 本プロジェクトでの実装

### ポート（インターフェース定義）
`src/features/quiz/domain/ports/quizRepository.ts`

```typescript
import type { QuizFull } from "../entities/quiz";

export interface QuizRepository {
  findAllQuestions(): Promise<QuizFull[]>;
  findFullById(id: string): Promise<QuizFull | null>;
}
```

ドメイン層に **「何ができるか（契約）」だけ** を定義します。
「どうやって実現するか」は一切書きません。

### 具体的な実装（アダプター）
`src/features/quiz/infrastructure/repositories/jsonQuizRepository.ts`

```typescript
import type { QuizFull } from "../../domain/entities/quiz";
import type { QuizRepository } from "../../domain/ports/quizRepository";
import { quizzes } from "../data/quizData";

export class JsonQuizRepository implements QuizRepository {
  async findAllQuestions(): Promise<QuizFull[]> {
    return quizzes;
  }

  async findFullById(id: string): Promise<QuizFull | null> {
    return quizzes.find((q) => q.id === id) ?? null;
  }
}
```

インターフェースを `implements` することで、契約を守っていることをコンパイラが保証します。

---

## クラス図

```
<<interface>>
QuizRepository
  + findAllQuestions(): Promise<QuizFull[]>
  + findFullById(id): Promise<QuizFull | null>
         ↑ implements
JsonQuizRepository            DrizzleQuizRepository（将来）
  - quizData を読み込む        - Turso DB を参照
```

---

## ヘキサゴナルアーキテクチャとの関係

本プロジェクトはヘキサゴナルアーキテクチャ（別名: ポート&アダプターパターン）を採用しています。

```
【ドメイン（中心）】
  QuizRepository インターフェース ← これが「ポート」

【インフラ（外側）】
  JsonQuizRepository              ← これが「アダプター」
  DrizzleQuizRepository（将来）   ← これも「アダプター」
```

ポート（インターフェース）はドメイン層に置き、ドメインはインフラの詳細を知りません。
インフラ層がドメイン層に向かって依存する（**依存性逆転の原則**）ことで、
将来 DB に切り替えてもドメインロジックは変更不要になります。

---

## メリット

| メリット | 説明 |
|---------|------|
| **テストが簡単** | テスト用の `MockQuizRepository` に差し替えられる |
| **技術の切り替えが容易** | JSON → DB への変更がビジネスロジックに影響しない |
| **関心の分離** | ビジネスルールとデータアクセスが混在しない |
