export type ImageProvider = "local" | "cloudflare-r2";

// Strategy インターフェース
interface ImageStrategy {
	resolve(key: string): string;
}

// 具体的なストラテジー: ローカル
class LocalImageStrategy implements ImageStrategy {
	resolve(key: string): string {
		return `/images/${key}.jpg`;
	}
}

// 具体的なストラテジー: Cloudflare R2
class CloudflareR2ImageStrategy implements ImageStrategy {
	resolve(key: string): string {
		return `https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}.jpg`;
	}
}

// ストラテジーの登録テーブル（新しいプロバイダーはここに追加するだけ）
const imageStrategies: Record<ImageProvider, ImageStrategy> = {
	local: new LocalImageStrategy(),
	"cloudflare-r2": new CloudflareR2ImageStrategy(),
};

function getImageProvider(): ImageProvider {
	const env = process.env.IMAGE_PROVIDER;
	if (env && env in imageStrategies) {
		return env as ImageProvider;
	}
	return "local";
}

export function resolveImageUrl(key: string): string {
	const provider = getImageProvider();
	return imageStrategies[provider].resolve(key);
}
