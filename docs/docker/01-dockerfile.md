# Dockerfile の書き方

TanStack Start を Cloud Run にデプロイする場合に必要なファイルと、
各行の意味を解説する。

---

## 必要なファイル一覧

```
プロジェクトルート/
├── Dockerfile          ← イメージのビルド手順
├── .dockerignore       ← Docker に含めないファイルの除外リスト
└── (docker-compose.yml) ← ローカルでの動作確認に使う（任意）
```

---

## Dockerfile（pnpm 版）

このプロジェクトは pnpm を使っているため、Node.js イメージ上で pnpm を有効化して使う。

```dockerfile
# ── ビルドステージ ──────────────────────────────────────
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ── 実行ステージ ────────────────────────────────────────
FROM node:22-slim
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
```

---

## 1行ずつ解説

### ビルドステージ

```dockerfile
FROM node:22-slim AS builder
```

- `FROM`: ベースイメージを指定する（このイメージの上に積み上げる）
- `node:22-slim`: Node.js 22 が入った軽量 Linux 環境（`slim` は不要なツールを省いた小さいイメージ）
- `AS builder`: このステージに `builder` という名前をつける（後で参照するため）
- マルチステージビルドの1段目（ビルド専用）

---

```dockerfile
RUN corepack enable && corepack prepare pnpm@latest --activate
```

- `corepack`: Node.js に付属するパッケージマネージャー管理ツール
- `corepack enable`: corepack を有効にする（pnpm などのコマンドが使えるようになる）
- `corepack prepare pnpm@latest --activate`: 最新の pnpm をダウンロードして有効化する
- これにより、次以降の `pnpm` コマンドが使えるようになる

---

```dockerfile
WORKDIR /app
```

- 以降のコマンドを実行するディレクトリを `/app` に設定する
- `cd /app` と似ているが、存在しなければ自動作成される

---

```dockerfile
COPY package.json pnpm-lock.yaml ./
```

- ホストの `package.json` と `pnpm-lock.yaml` をコンテナの `/app/` にコピーする
- **先にこれだけコピーする理由**: Docker はレイヤーをキャッシュする。
  `pnpm install` の後に `COPY . .` するより、依存関係が変わっていなければ
  `pnpm install` を再実行せずキャッシュを使い回せる。ビルドが速くなる。

---

```dockerfile
RUN pnpm install --frozen-lockfile
```

- `RUN`: ビルド時にコマンドを実行する
- `pnpm install`: `package.json` に書かれた依存パッケージをインストールする
- `--frozen-lockfile`: `pnpm-lock.yaml` の内容と一致しない場合はエラーにする
  （本番環境で意図しないバージョン変更を防ぐため）

---

```dockerfile
COPY . .
```

- ホストのプロジェクト全体（`.`）をコンテナの `/app/`（`.`）にコピーする
- `.dockerignore` に書かれたファイルは除外される

---

```dockerfile
RUN pnpm run build
```

- アプリをビルドする（`package.json` の `build` スクリプトを実行）
- Cloud Run 用の設定でビルドすると `.output/server/index.mjs` が生成される
  （Node.js で起動できる形式）

> **注意**: Cloud Run 用にビルドするには、`vite.config.ts` の変更が必要。
> 詳細は後述の「vite.config.ts の変更（Cloud Run 移行時）」を参照。

---

### 実行ステージ

```dockerfile
FROM node:22-slim
```

- 2段目のベースイメージ。1段目と同じイメージを使う。
- **なぜ2段階に分けるのか**: ビルドツール（devDependencies・pnpm など）は
  本番の実行には不要。2段目には実行に必要なファイルだけコピーすることで、
  イメージのサイズを小さく保てる。

---

```dockerfile
WORKDIR /app
```

- 実行ステージでも作業ディレクトリを `/app` に設定する

---

```dockerfile
COPY --from=builder /app/.output ./.output
```

- `--from=builder`: 1段目（`builder`）で作ったファイルをコピーする
- `/app/.output`: ビルド成果物（サーバーコード一式）
- これだけあれば本番サーバーとして動かせる

---

```dockerfile
COPY --from=builder /app/package.json ./
```

- `package.json` もコピーする
- `pnpm run start` のようなスクリプトを実行するために必要な場合がある

---

```dockerfile
EXPOSE 8080
```

- コンテナが 8080 番ポートを使うことを宣言する
- **実際にポートを開放するわけではない**（あくまで「このポートを使う予定」という記録）
- `docker run -p 8080:8080` で外部からアクセスできるようになる
- Cloud Run はデフォルトで 8080 番ポートを期待する

---

```dockerfile
CMD ["node", ".output/server/index.mjs"]
```

- コンテナ起動時に実行するコマンド
- `node .output/server/index.mjs` でサーバーを起動する
- `CMD` は `docker run` 時にコマンドを渡すと上書きできる（`ENTRYPOINT` との違い）

---

## .dockerignore

Docker に含めたくないファイルを除外する。`.gitignore` の Docker 版。

```
node_modules
.output
.git
.env
*.local
```

**各行の意味:**

| 行 | 理由 |
|---|---|
| `node_modules` | コンテナ内で `pnpm install` するので不要。サイズが大きく転送が遅くなる |
| `.output` | ビルドステージで生成するので不要 |
| `.git` | Git の履歴はアプリ実行に不要。漏らしたくない情報も含まれる |
| `.env` | 環境変数ファイルはイメージに含めない（Cloud Run の環境変数機能を使う） |
| `*.local` | ローカル専用の設定ファイルを除外 |

---

## vite.config.ts の変更（Cloud Run 移行時）

Cloudflare から Cloud Run に移行する際、**2つの変更**が必要になる。

### 変更が必要な理由

現在の `vite.config.ts` には `@cloudflare/vite-plugin` が含まれている。
このプラグインが有効なままだと、ビルド出力が Cloudflare Workers 向けの `dist/` 形式になり、
`.output/server/index.mjs`（Cloud Run で必要なファイル）が生成されない。

**変更1: `@cloudflare/vite-plugin` を削除する**

```ts
// 移行前（Cloudflare 用）
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),  // ← 削除
    tanstackStart(),
    viteReact(),
  ],
})
```

```ts
// 移行後（Cloud Run 用）
export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
})
```

**変更2: ビルドプリセットを `node-server` に設定する**

```ts
// 移行後（Cloud Run 用）
export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        preset: 'node-server',  // ← 追加
      },
    }),
    viteReact(),
  ],
})
```

この2つを合わせて行うことで、`pnpm run build` 後に
`.output/server/index.mjs` が生成され、Cloud Run で起動できるようになる。

---

## ローカルで動作確認する

```bash
# イメージをビルド
docker build -t rhyme-quiz .

# コンテナを起動（ポート転送付き）
docker run -p 8080:8080 rhyme-quiz

# ブラウザで http://localhost:8080 にアクセスして確認
```

---

## Cloud Run へのデプロイ（参考）

```bash
gcloud run deploy rhyme-quiz \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080
```

- `--source .`: カレントディレクトリの Dockerfile を使ってビルド・デプロイする
- `--region asia-northeast1`: 東京リージョン
- `--allow-unauthenticated`: 誰でもアクセスできるようにする（公開アプリ用）
- `--port 8080`: アプリが使うポート番号を指定
