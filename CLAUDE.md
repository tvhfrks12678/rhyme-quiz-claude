# CLAUDE.md

## 必ず参照するドキュメント

Every task must begin by reading and following these documents:

- `docs/prompts/rhyme-quiz-instructions.md` — 実装指示書
- `docs/prompts/rhyme-quiz-spec.md` — 実装仕様書

Do NOT start coding until you have read both files completely.

## Git ワークフロー（必須）

Every task MUST follow this workflow:

> **作業完了の定義**: 実装が終わっても作業完了ではない。`gh pr create` で Pull Request を送信して初めて作業完了とする。PR なしで作業を終了してはならない。`main` への直接コミットも禁止。

> **破壊的な git コマンドは毎回ユーザーに確認を取ること（settings.json に追加しない）**:
> `git reset`, `git checkout .`, `git restore .`, `git clean`, `git push --force` 等。
> これらは作業中のコードやコミット履歴を失う可能性があるため、"Yes, and don't ask again" を選択してはならない。

### 0. 作業前の準備（必須）

作業を開始する前に、必ず最新の `main` ブランチに切り替えて最新化する:

```bash
git switch main
git pull origin main
```

### 1. Issue の確認

- GitHub Issue に基づくタスクの場合、`gh issue view <issue番号>` で内容を確認する
- Issue の要件を理解してから作業を開始する

### 2. ブランチ作成

- `main` から必ず新しいブランチを切る
- Issue がある場合: `feature/<issue番号>-<簡潔な機能名>` (例: `feature/42-add-break-time`)
- Issue がない場合: `feature/<簡潔な機能名>` (例: `feature/add-break-time`)
- 既存ブランチで直接作業しない

### 3. 実装

- `.claude/attendance-instructions.md` と `attendance-spec.md` に従って実装
- こまめにコミット（意味のある単位で）

### 4. Pull Request 作成

- 実装完了後、必ず `gh pr create` で PR を作成する
- PRタイトル: 変更内容を簡潔に記述
- PR本文: 変更概要、変更点リスト、テスト内容を含める
- Issue がある場合、PR本文に `Closes #<issue番号>` を含める（マージ時に自動クローズされる）

### 5. セルフレビュー

PR作成後、自分自身でレビューを行う:

1. `gh pr diff <PR番号>` で差分を確認
2. 以下の観点でレビュー:
   - attendance-spec.md の仕様を満たしているか
   - attendance-instructions.md のルールに違反していないか
   - バグ、タイポ、不要なコードがないか
   - エッジケースの考慮漏れがないか
3. 問題があれば修正コミットを追加
4. レビュー結果を `gh pr review <PR番号> --body "レビュー内容"` でコメント
5. 問題なければ `gh pr review <PR番号> --approve --body "LGTM: レビュー観点と確認結果"` で承認

## コミットメッセージ規約

Follow Conventional Commits format:

```
<type>(<scope>): [HH:MM:SS] {↓X.Xk tok} <description> #<issue番号>
```

### Type（必須）

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツール設定の変更
- `ci`: CI/CD設定の変更

### Scope（任意だが推奨）

変更対象を示す（例: `attendance`, `break`, `claude`, `api`）

### 作業時間・トークン使用量（必須）

1行目に AI作業時間とトークン使用量の両方を記載する。

- **`[HH:MM:SS]`**: AI作業時間。AIがプロンプトを受け取ってから処理を完了するまでの純粋な累積時間（リサーチ、コード修正、ツール実行など）。
- **`{↓X.Xk tok}`**: トークン使用量。セッション全体で消費したトークン数を千単位（k）で記載する。Claude Code のステータスバーに表示される値を参照する。

形式: `[HH:MM:SS] {↓X.Xk tok}`（例: `[00:05:30] {↓12.3k tok}`）

> **注意**: Claude は実際の経過時間を計測する手段を持たないため、`[HH:MM:SS]` の値は作業規模から推定した目安であり、正確な計測値ではない。正確な時間を記録したい場合は、ユーザーが計測した値をコミット時に伝えること。

### 例

- `feat(break): [00:45:12] {↓45.2k tok} add break time input feature #42`
- `fix(attendance): [00:12:30] {↓12.3k tok} correct total hours calculation #15`
- `test(break): [00:30:00] {↓28.7k tok} add unit tests for break time validation #42`
- `chore(claude): [00:05:00] {↓5.1k tok} update claude code settings`

### ルール

- description は英語で、小文字始まり、末尾にピリオドをつけない
- 1行目は50文字以内を目安にする（作業時間を含めて調整）
- 必要に応じて空行の後に本文を追加する
- GitHub Issue に基づくタスクの場合、description の末尾に `#<issue番号>` を付ける
- Issue がないタスク（設定変更等）では issue 番号は不要

## 権限の永続化ルール

When the user selects "Yes, allow all during this session" for any permission prompt,
add that permission rule to `.claude/settings.json` under `permissions.allow` so it
persists across sessions.

Example: if "Yes, allow all during this session" is selected for `Bash(cat:*)`,
update `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(cat:*)"
    ]
  }
}
```

Always commit this change: `chore(claude): add <permission> to settings.json`


## Rate Limit に達した場合

rate limit に達したときは **「Stop and wait for limit to reset（リセットを待つ）」** を選択する。

- 追加購入や課金は行わない
- limit がリセットされるまで待機してから作業を再開する

## 作業の進め方

「実装進めますか？」「続けますか？」などの確認質問は **不要**。
ユーザーから依頼を受けたらそのまま作業を進める。
