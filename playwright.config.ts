/**
 * Playwright の設定ファイル
 *
 * Playwright は実際のブラウザ（Chromium/Firefox/Safari）を操作して
 * アプリ全体を E2E（End-to-End）でテストするツール。
 *
 * webServer: テスト実行前に自動で開発サーバーを起動する設定。
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	// テストファイルの場所
	testDir: "./e2e",
	// テスト失敗時のスクリーンショット等を保存するフォルダ
	outputDir: "./e2e/results",
	// テスト結果レポートの形式
	reporter: "html",

	use: {
		// テスト対象の URL
		baseURL: "http://localhost:3000",
		// テスト失敗時に自動でスクリーンショットを取る
		screenshot: "only-on-failure",
		// テスト失敗時に操作履歴（trace）を保存する
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	// テスト実行前に開発サーバーを起動する
	// 既にサーバーが起動している場合は再起動しない
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 30_000,
	},
});
