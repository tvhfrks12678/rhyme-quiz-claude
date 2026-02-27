export type ImageProvider = "local" | "cloudflare-r2";

function getImageProvider(): ImageProvider {
	return (process.env.IMAGE_PROVIDER as ImageProvider) ?? "local";
}

export function resolveImageUrl(key: string): string {
	const provider = getImageProvider();
	switch (provider) {
		case "cloudflare-r2":
			return `https://${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}.jpg`;
		case "local":
		default:
			return `/images/${key}.jpg`;
	}
}
