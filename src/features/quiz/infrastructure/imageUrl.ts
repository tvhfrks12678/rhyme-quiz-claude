/**
 * クイズ画像の URL を解決するユーティリティ
 *
 * 現在: public/image/{imageKey}.jpg をローカルから配信
 * 将来: VITE_IMAGE_BASE_URL に Cloudflare R2 のエンドポイントを設定するだけで切り替え可能
 *
 * 例:
 *   VITE_IMAGE_BASE_URL=https://pub-xxxxx.r2.dev → R2 から配信
 *   未設定（開発時）                              → /image から配信
 */
export function getImageUrl(imageKey: string): string {
	if (!imageKey) return "";

	const baseUrl =
		typeof import.meta !== "undefined" &&
		typeof import.meta.env !== "undefined"
			? (import.meta.env.VITE_IMAGE_BASE_URL ?? "/image")
			: "/image";

	return `${baseUrl}/${imageKey}.jpg`;
}
