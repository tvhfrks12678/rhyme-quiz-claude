/**
 * クイズ動画表示の E2E テスト（Playwright）
 */
import { expect, test } from "@playwright/test";

test.describe("クイズ動画表示", () => {
	test("Q1 では動画が表示されず、画像が表示される", async ({
		page,
	}) => {
		await page.goto("/");

		// Q1 の問題文が表示されていることを確認
		await expect(page.getByText(/とら/)).toBeVisible();

		// video 要素は存在しない
		await expect(page.getByTestId("video-player")).not.toBeVisible();

		// 画像が表示されている
		await expect(page.getByTestId("question-image")).toBeVisible();
	});

	test("Q1 を回答して Q2 に進むと動画が表示される", async ({ page }) => {
		await page.goto("/");

		// --- Q1 を回答する ---
		await page.getByText("おか").click();
		await page.getByRole("button", { name: "解答する" }).click();
		await expect(
			page.getByText(/正解|不正解/).first(),
		).toBeVisible({ timeout: 5000 });
		await page.getByRole("button", { name: "次の問題へ" }).click();

		// --- Q2 を確認する ---
		await expect(page.getByText(/あたま/)).toBeVisible({ timeout: 5000 });

		// <video> 要素が表示されている
		const video = page.getByTestId("video-player");
		await expect(video).toBeVisible();

		// src 属性が動画ファイルを指していることを確認
		const src = await video.getAttribute("src");
		expect(src).toContain(".mp4");
	});
});
