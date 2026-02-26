/**
 * クイズ動画表示の E2E テスト（Playwright）
 *
 * E2E（End-to-End）テスト: 実際のブラウザを操作して、
 * ユーザーの操作から画面の変化まで「端から端まで」テストする。
 *
 * このテストでは:
 * 1. Q1（とら）に動画がないことを確認する
 * 2. Q1 を回答して Q2 へ進む
 * 3. Q2（あたま）に動画が表示されることを確認する
 */
import { expect, test } from "@playwright/test";

test.describe("クイズ動画表示", () => {
	test("Q1 では動画が表示されず、画像プレースホルダーが表示される", async ({
		page,
	}) => {
		await page.goto("/");

		// Q1 の問題文が表示されていることを確認
		await expect(page.getByText(/とら/)).toBeVisible();

		// video 要素は存在しない
		await expect(page.getByTestId("video-player")).not.toBeVisible();

		// 画像プレースホルダーは表示されている
		await expect(page.getByTestId("image-placeholder")).toBeVisible();
	});

	test("Q1 を回答して Q2 に進むと動画が表示される", async ({ page }) => {
		await page.goto("/");

		// --- Q1 を回答する ---
		// 選択肢「おか」を選ぶ（shuffleされているのでテキストで検索）
		await page.getByText("おか").click();

		// 「解答する」ボタンをクリック
		await page.getByRole("button", { name: "解答する" }).click();

		// 結果表示を待つ（正解/不正解の表示）
		await expect(
			page.getByText(/正解|不正解/).first(),
		).toBeVisible({ timeout: 5000 });

		// 「次の問題へ」ボタンをクリック
		await page.getByRole("button", { name: "次の問題へ" }).click();

		// --- Q2 を確認する ---
		// Q2 の問題文「あたま」が表示されていることを確認
		await expect(page.getByText(/あたま/)).toBeVisible({ timeout: 5000 });

		// <video> 要素が表示されている
		const video = page.getByTestId("video-player");
		await expect(video).toBeVisible();

		// src 属性が動画ファイルを指していることを確認
		const src = await video.getAttribute("src");
		expect(src).toContain(".mp4");

		// 画像プレースホルダーは表示されていない
		await expect(page.getByTestId("image-placeholder")).not.toBeVisible();
	});
});
