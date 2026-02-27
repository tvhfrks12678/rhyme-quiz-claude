/**
 * mediaResolver のユニットテスト
 *
 * テスト対象: resolveVideoUrl(key) 関数
 * - VIDEO_PROVIDER 環境変数に応じて異なる URL を返すことを検証する
 * - vi.stubEnv() で環境変数を一時的に書き換えて各プロバイダーの挙動を確認する
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveImageUrl, resolveVideoUrl } from "../mediaResolver";

describe("resolveVideoUrl", () => {
	// 各テスト後に環境変数の書き換えをリセットする
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("VIDEO_PROVIDER 未設定のとき /video/${key}.mp4 を返す", () => {
		// デフォルト（local）: public/video/ ディレクトリのファイルを参照する
		expect(resolveVideoUrl("abc123")).toBe("/video/abc123.mp4");
	});

	it("VIDEO_PROVIDER=local のとき /video/${key}.mp4 を返す", () => {
		vi.stubEnv("VIDEO_PROVIDER", "local");
		expect(resolveVideoUrl("abc123")).toBe("/video/abc123.mp4");
	});

	it("VIDEO_PROVIDER=cloudinary のとき Cloudinary 動画 URL を返す", () => {
		vi.stubEnv("VIDEO_PROVIDER", "cloudinary");
		vi.stubEnv("CLOUDINARY_CLOUD_NAME", "mycloud");
		expect(resolveVideoUrl("abc123")).toBe(
			"https://res.cloudinary.com/mycloud/video/upload/abc123.mp4",
		);
	});

	it("VIDEO_PROVIDER=bunny のとき Bunny Stream URL を返す", () => {
		vi.stubEnv("VIDEO_PROVIDER", "bunny");
		vi.stubEnv("BUNNY_HOSTNAME", "myzone.b-cdn.net");
		expect(resolveVideoUrl("abc123")).toBe(
			"https://myzone.b-cdn.net/abc123.mp4",
		);
	});

	it("key が長い文字列でも URL に正しく含まれる", () => {
		const key = "20260226_1254_01kjb86c8mf86rdf15zcrvc52b";
		expect(resolveVideoUrl(key)).toBe(`/video/${key}.mp4`);
	});
});

describe("resolveImageUrl", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("IMAGE_PROVIDER 未設定のとき /images/${key}.jpg を返す", () => {
		expect(resolveImageUrl("tora")).toBe("/images/tora.jpg");
	});

	it("IMAGE_PROVIDER=local のとき /images/${key}.jpg を返す", () => {
		vi.stubEnv("IMAGE_PROVIDER", "local");
		expect(resolveImageUrl("tora")).toBe("/images/tora.jpg");
	});

	it("IMAGE_PROVIDER=cloudinary のとき Cloudinary 画像 URL を返す", () => {
		vi.stubEnv("IMAGE_PROVIDER", "cloudinary");
		vi.stubEnv("CLOUDINARY_CLOUD_NAME", "mycloud");
		expect(resolveImageUrl("tora")).toBe(
			"https://res.cloudinary.com/mycloud/image/upload/tora.jpg",
		);
	});

	it("key が空文字のとき空文字を返す", () => {
		expect(resolveImageUrl("")).toBe("");
	});
});
