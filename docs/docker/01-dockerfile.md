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

## Dockerfile（Bun 版）

TanStack Start は Bun で動かすため、Bun のイメージを使う。

```dockerfile
# ── ビルドステージ ──────────────────────────────────────
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# ── 実行ステージ ────────────────────────────────────────
FROM oven/bun:latest
WORKDIR /app
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["bun", "run", ".output/server/index.mjs"]
```

---

## 1行ずつ解説

### ビルドステージ

```dockerfile
FROM oven/bun:latest AS builder
```

- `FROM`: ベースイメージを指定する（このイメージの上に積み上げる）
- `oven/bun:latest`: Bun 公式イメージ（`oven` は Bun を作った会社）
- `AS builder`: このステージに `builder` という名前をつける（後で参照するため）
- マルチステージビルドの1段目（ビルド専用）

---

```dockerfile
WORKDIR /app
```

- 以降のコマンドを実行するディレクトリを `/app` に設定する
- `cd /app` と似ているが、存在しければ自動作成される

---

```dockerfile
COPY package.json bun.lock ./
```

- ホストの `package.json` と `bun.lock` をコンテナの `/app/` にコピーする
- **先にこれだけコピーする理由**: Docker はレイヤーをキャッシュする。
  `bun install` の後に `COPY . .` するより、依存関係が変わっていなければ
  `bun install` を再実行せずキャッシュを使い回せる。ビルドが速くなる。

---

```dockerfile
RUN bun install --frozen-lockfile
```

- `RUN`: ビルド時にコマンドを実行する
- `bun install`: `package.json` に書かれた依存パッケージをインストールする
- `--frozen-lockfile`: `bun.lock` の内容と一致しない場合はエラーにする
  （本番環境で意図しないバージョン変更を防ぐため）

---

```dockerfile
COPY . .
```

- ホストのプロジェクト全体（`.`）を コンテナの `/app/`（`.`）にコピーする
- `.dockerignore` に書かれたファイルは除外される

---

```dockerfile
RUN bun run build
```

- アプリをビルドする（`package.json` の `build` スクリプトを実行）
- TanStack Start は `preset: 'node-server'` でビルドすると
  `.output/server/index.mjs` が生成される（Node.js / Bun で起動できる形式）

> **注意**: Cloud Run 用にビルドするには、`app.config.ts` で
> `server.preset: 'node-server'` を設定する必要がある。
> Cloudflare 用の `cloudflare-pages` のままだと動かない。

---

### 実行ステージ

```dockerfile
FROM oven/bun:latest
```

- 2段目のベースイメージ。1段目と同じイメージを使う。
- **なぜ2段階に分けるのか**: ビルドツール（開発用 devDependencies など）は
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
- `bun run start` のようなスクリプトを実行するために必要な場合がある

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
CMD ["bun", "run", ".output/server/index.mjs"]
```

- コンテナ起動時に実行するコマンド
- `bun run .output/server/index.mjs` でサーバーを起動する
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
| `node_modules` | コンテナ内で `bun install` するので不要。サイズが大きく転送が遅くなる |
| `.output` | ビルドステージで生成するので不要 |
| `.git` | Git の履歴はアプリ実行に不要。漏らしたくない情報も含まれる |
| `.env` | 環境変数ファイルはイメージに含めない（Cloud Run の環境変数機能を使う） |
| `*.local` | ローカル専用の設定ファイルを除外 |

---

## app.config.ts の変更（Cloud Run 移行時）

Cloudflare から Cloud Run に移行する際、**ビルドのプリセットを変更**する必要がある。

```ts
// 移行前（Cloudflare 用）
export default defineConfig({
  server: {
    preset: 'cloudflare-pages',
  },
})

// 移行後（Cloud Run / Node.js 用）
export default defineConfig({
  server: {
    preset: 'node-server',
  },
})
```

`preset` はどのランタイム向けにビルドするかを決める設定。
`cloudflare-pages` のままでは Cloud Run では動かない。

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
