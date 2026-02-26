import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		// デフォルトは node 環境
		// コンポーネントテスト（.tsx）は各ファイル先頭の @vitest-environment jsdom コメントで個別指定する
		environment: "node",
		// jest-dom のカスタムマッチャーをすべてのテストで使えるようにする
		setupFiles: ["./src/test/setup.ts"],
		// Playwright テストファイル（e2e/）は vitest の対象外にする
		exclude: ["node_modules", "e2e/**"],
	},
})
