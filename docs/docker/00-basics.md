# Docker 基礎知識

## なぜ Docker が必要か

### 「自分のマシンでは動くのに」問題

アプリを開発していると、こんな状況が起きやすい。

```
開発者A（Mac）: 動いた！
開発者B（Windows）: 動かない…
本番サーバー（Linux）: 謎のエラー
```

原因は**実行環境の差異**にある。

- Node.js のバージョンが違う（16 vs 20 vs 22）
- パッケージマネージャーが違う（npm vs pnpm vs bun）
- OS が違う（Mac / Windows / Linux）
- インストール済みのライブラリが違う
- 環境変数の設定が違う

Docker を使うと、アプリと動作に必要なすべての環境（OS・ランタイム・ライブラリ）を**コンテナ**という箱に丸ごと入れて持ち運べる。どのマシンでも同じ箱を実行するので、環境差異の問題がなくなる。

---

## Docker の構成要素

### イメージ（Image）

コンテナを作るための**設計図（テンプレート）**。

- `node:22-slim`（Node.js 22 が入った軽量な Linux 環境）
- `oven/bun:latest`（Bun が入った Linux 環境）
- 自分で作ったアプリイメージ

イメージ自体は読み取り専用で、変更できない。

### コンテナ（Container）

イメージから作られた**実際に動くプロセス**。

- イメージをもとに何個でも起動できる
- 起動・停止・削除が簡単
- コンテナを削除しても、イメージは残る

### Dockerfile

イメージを作るための**手順書**（設定ファイル）。

```
Dockerfile → ビルド → イメージ → 起動 → コンテナ
```

---

## 基本コマンド

### イメージのビルド

```bash
# Dockerfile があるディレクトリで実行
docker build -t my-app .

# -t: イメージに名前をつける（タグ）
# .: Dockerfile の場所（カレントディレクトリ）
```

### コンテナの起動

```bash
docker run -p 8080:8080 my-app

# -p: ポートの転送（ホスト側:コンテナ側）
# 例: ブラウザで localhost:8080 にアクセスすると
#     コンテナ内の 8080 ポートに繋がる
```

```bash
# バックグラウンドで起動する場合
docker run -d -p 8080:8080 my-app

# -d: デタッチモード（バックグラウンド実行）
```

### 実行中コンテナの確認

```bash
docker ps

# CONTAINER ID  IMAGE    STATUS         PORTS
# a1b2c3d4e5f6  my-app   Up 2 minutes   0.0.0.0:8080->8080/tcp
```

### コンテナの停止・削除

```bash
docker stop a1b2c3d4e5f6   # コンテナを停止
docker rm a1b2c3d4e5f6     # コンテナを削除
```

### イメージの確認・削除

```bash
docker images              # ローカルのイメージ一覧
docker rmi my-app          # イメージを削除
```

### コンテナの中に入る

```bash
docker exec -it a1b2c3d4e5f6 sh

# -it: 対話モード（キーボード入力を受け付ける）
# sh: シェルを起動
# ※ bash が使えない軽量イメージでは sh を使う
```

### ログを確認する

```bash
docker logs a1b2c3d4e5f6          # ログを表示
docker logs -f a1b2c3d4e5f6       # リアルタイムでログを追う（-f: follow）
```

---

## このプロジェクトで Docker が必要になる場面

現在は Cloudflare Workers / Pages（エッジ環境）にデプロイしているため、Docker は不要。
ただし、以下の理由で **Cloud Run（コンテナ環境）への移行**が必要になった場合、Docker 化が必須となる。

| 移行が必要になるケース | 理由 |
|---|---|
| CPU 時間制限に引っかかる | Workers の無料枠は 10ms、有料でも 30s まで |
| `fs`・`net` など Node.js API が必要 | Workers では使えない（一部制限あり） |
| 長時間のバックグラウンド処理が必要 | Workers はリクエスト処理専用 |

Cloud Run はコンテナ実行基盤なので、アプリを Docker イメージとして用意する必要がある。

---

## 次のステップ

具体的な Dockerfile の書き方（Node.js + pnpm 版）については、
[01-dockerfile.md](./01-dockerfile.md) で解説する。
