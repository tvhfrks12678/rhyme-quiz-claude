/**
 * クイズ画像表示の E2E テスト（Playwright）
 */
import { expect, test } from "@playwright/test";

test.describe("クイズ画像表示", () => {
	test("Q1 で画像が表示される", async ({ page }) => {
		await page.goto("/");

		// Q1 の問題文が表示されていることを確認
		await expect(page.getByText(/とら/)).toBeVisible();

		// img 要素が表示されている
		const img = page.getByTestId("question-image");
		await expect(img).toBeVisible();

		// src 属性が画像ファイルを指していることを確認
		const src = await img.getAttribute("src");
		expect(src).toBe("/images/tora.jpg");
	});

	test("Q2 では動画が優先され、画像は表示されない", async ({ page }) => {
		await page.goto("/");

		// Q1 を回答して Q2 へ進む
		await page.getByText("おか").click();
		await page.getByRole("button", { name: "解答する" }).click();
		await expect(page.getByText(/正解|不正解/).first()).toBeVisible({ timeout: 5000 });
		await page.getByRole("button", { name: "次の問題へ" }).click();

		// Q2 の問題文「あたま」が表示されていることを確認
		await expect(page.getByText(/あたま/)).toBeVisible({ timeout: 5000 });

		// 動画が表示されている
		await expect(page.getByTestId("video-player")).toBeVisible();

		// 画像は表示されていない
		await expect(page.getByTestId("question-image")).not.toBeVisible();
	});
});
