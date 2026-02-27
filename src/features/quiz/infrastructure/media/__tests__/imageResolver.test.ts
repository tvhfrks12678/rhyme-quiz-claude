/**
 * imageResolver のユニットテスト
 *
 * テスト対象: resolveImageUrl(key) 関数
 * - IMAGE_PROVIDER 環境変数に応じて異なる URL を返すことを検証する
 * - vi.stubEnv() で環境変数を一時的に書き換えて各プロバイダーの挙動を確認する
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveImageUrl } from "../imageResolver";

describe("resolveImageUrl", () => {
	// 各テスト後に環境変数の書き換えをリセットする
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("IMAGE_PROVIDER 未設定のとき /images/${key}.jpg を返す", () => {
		// デフォルト（local）: public/images/ ディレクトリのファイルを参照する
		expect(resolveImageUrl("tora")).toBe("/images/tora.jpg");
	});

	it("IMAGE_PROVIDER=local のとき /images/${key}.jpg を返す", () => {
		vi.stubEnv("IMAGE_PROVIDER", "local");
		expect(resolveImageUrl("tora")).toBe("/images/tora.jpg");
	});

	it("IMAGE_PROVIDER=cloudflare-r2 のとき Cloudflare R2 画像 URL を返す", () => {
		vi.stubEnv("IMAGE_PROVIDER", "cloudflare-r2");
		vi.stubEnv("CLOUDFLARE_R2_PUBLIC_URL", "pub-abc123.r2.dev");
		expect(resolveImageUrl("tora")).toBe(
			"https://pub-abc123.r2.dev/tora.jpg",
		);
	});

	it("key が異なる画像でも URL に正しく含まれる", () => {
		expect(resolveImageUrl("umikaze")).toBe("/images/umikaze.jpg");
	});

	it("CLOUDFLARE_R2_PUBLIC_URL が別のドメインでも正しく URL を構築する", () => {
		vi.stubEnv("IMAGE_PROVIDER", "cloudflare-r2");
		vi.stubEnv("CLOUDFLARE_R2_PUBLIC_URL", "images.example.com");
		expect(resolveImageUrl("tora")).toBe("https://images.example.com/tora.jpg");
	});
});
