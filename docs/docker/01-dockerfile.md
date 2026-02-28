# Dockerfile の書き方

TanStack Start を Cloud Run にデプロイする場合に必要なファイルと、
各行の意味を解説する。このプロジェクトの標準である **Node.js + pnpm** を基本とする。

---

## 必要なファイル一覧

```
プロジェクトルート/
├── Dockerfile          ← イメージのビルド手順
├── .dockerignore       ← Docker に含めないファイルの除外リスト
└── (docker-compose.yml) ← ローカルでの動作確認に使う（任意）
```

---

## Dockerfile（Node.js + pnpm 版）

```dockerfile
# ── ビルドステージ ──────────────────────────────────────
FROM node:22-slim AS builder

# pnpm を有効化
ENV COREPACK_HOME="/corepack"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 依存関係のコピーとインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 全ファイルのコピーとビルド
COPY . .
RUN pnpm run build

# ── 実行ステージ ────────────────────────────────────────
FROM node:22-slim
WORKDIR /app

# ビルド成果物のみをコピー
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
- `node:22-slim`: Node.js 22 が入った軽量な公式イメージ
- `AS builder`: このステージに `builder` という名前をつける（後で参照するため）

---

```dockerfile
ENV COREPACK_HOME="/corepack"
RUN corepack enable && corepack prepare pnpm@latest --activate
```

- Node.js 標準の **Corepack** を使って `pnpm` を有効化する
- Docker イメージ内で `pnpm` コマンドが使えるようになる

---

```dockerfile
WORKDIR /app
```

- 以降のコマンドを実行するディレクトリを `/app` に設定する
- `cd /app` と似ているが、存在しければ自動作成される

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

- `pnpm install`: 依存パッケージをインストールする
- `--frozen-lockfile`: `pnpm-lock.yaml` の内容と一致しない場合はエラーにする
  （本番環境で意図しないバージョン変更を防ぐため）

---

```dockerfile
COPY . .
```

- ホストのプロジェクト全体（`.`）を コンテナの `/app/`（`.`）にコピーする
- `.dockerignore` に書かれたファイルは除外される

---

```dockerfile
RUN pnpm run build
```

- アプリをビルドする（`package.json` の `build` スクリプトを実行）
- TanStack Start は `preset: 'node-server'` でビルドすると
  `.output/server/index.mjs` が生成される（Node.js で起動できる形式）

> **注意**: Cloud Run 用にビルドするには、`vite.config.ts` で
> `server.preset: 'node-server'` を設定する必要がある（後述）。

---

### 実行ステージ

```dockerfile
FROM node:22-slim
```

- 2段目のベースイメージ。
- **マルチステージビルド**: ビルドツール（開発用 devDependencies など）は
  本番の実行には不要。2段目には実行に必要なファイルだけコピーすることで、
  イメージのサイズを大幅に小さくできる。

---

```dockerfile
COPY --from=builder /app/.output ./.output
```

- `--from=builder`: 1段目（`builder`）で作ったファイルをコピーする
- `.output`: ビルド成果物（サーバーコード一式）。これだけあれば本番サーバーとして動かせる

---

```dockerfile
EXPOSE 8080
```

- コンテナが 8080 番ポートを使うことを宣言する（Cloud Run のデフォルト）
- `docker run -p 8080:8080` で外部からアクセスできるようになる

---

```dockerfile
CMD ["node", ".output/server/index.mjs"]
```

- コンテナ起動時に実行するコマンド。サーバーを起動する。

---

## .dockerignore

```
node_modules
.output
.git
.env
*.local
bun.lock
```

- **`node_modules`**: コンテナ内で `pnpm install` するのでコピー不要
- **`bun.lock`**: このプロジェクトでは `pnpm` を優先するため除外（混入防止）

---

## vite.config.ts の変更（Cloud Run 移行時）

Cloudflare から Cloud Run に移行する際、**ビルドのプリセットを変更**する必要がある。

```ts
// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    // 移行前（Cloudflare 用）
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    
    // 移行後（Cloud Run / Node.js 用）
    // cloudflare プラグインを外し、tanstackStart の設定でプリセットを指定する
    // tanstackStart({ server: { preset: 'node-server' } }),
  ],
})
```

※ TanStack Start のバージョンや構成によって、プリセットの設定箇所は `app.config.ts`（存在する場合）や `vite.config.ts` になります。

---

## (参考) Dockerfile（Bun 版）

もしプロジェクト全体で Bun に移行する場合は、以下のシンプルな構成も可能。

```dockerfile
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:latest
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["bun", "run", ".output/server/index.mjs"]
```
