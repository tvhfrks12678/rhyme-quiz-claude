/**
 * getImageUrl ユニットテスト
 *
 * テスト対象: src/features/quiz/infrastructure/imageUrl.ts
 *
 * getImageUrl は imageKey を受け取って画像 URL を返す純粋関数。
 * - 現在はローカルの /image ディレクトリから配信
 * - VITE_IMAGE_BASE_URL を設定すると Cloudflare R2 など外部ストレージへ切り替え可能
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getImageUrl } from "../imageUrl";

describe("getImageUrl", () => {
	describe("デフォルト（VITE_IMAGE_BASE_URL 未設定）", () => {
		it("imageKey を渡すと /image/{imageKey}.jpg を返す", () => {
			expect(getImageUrl("tora")).toBe("/image/tora.jpg");
		});

		it("別の imageKey でも正しい URL を返す", () => {
			expect(getImageUrl("umikaze")).toBe("/image/umikaze.jpg");
		});

		it("imageKey が空文字のとき空文字を返す", () => {
			expect(getImageUrl("")).toBe("");
		});
	});

	describe("VITE_IMAGE_BASE_URL が設定されている場合（Cloudflare R2 など）", () => {
		const originalEnv = import.meta.env.VITE_IMAGE_BASE_URL;

		beforeEach(() => {
			import.meta.env.VITE_IMAGE_BASE_URL = "https://pub-example.r2.dev";
		});

		afterEach(() => {
			import.meta.env.VITE_IMAGE_BASE_URL = originalEnv;
		});

		it("VITE_IMAGE_BASE_URL を base として URL を構築する", () => {
			expect(getImageUrl("tora")).toBe(
				"https://pub-example.r2.dev/tora.jpg",
			);
		});

		it("imageKey が空文字のときは空文字を返す", () => {
			expect(getImageUrl("")).toBe("");
		});
	});
});
