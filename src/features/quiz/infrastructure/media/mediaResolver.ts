export type VideoProvider = "local" | "cloudinary" | "bunny";
export type ImageProvider = "local" | "cloudinary";

function getVideoProvider(): VideoProvider {
	return (process.env.VIDEO_PROVIDER as VideoProvider) ?? "local";
}

function getImageProvider(): ImageProvider {
	return (process.env.IMAGE_PROVIDER as ImageProvider) ?? "local";
}

export function resolveVideoUrl(key: string): string {
	const provider = getVideoProvider();
	switch (provider) {
		case "cloudinary":
			return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${key}.mp4`;
		case "bunny":
			return `https://${process.env.BUNNY_HOSTNAME}/${key}.mp4`;
		case "local":
		default:
			return `/video/${key}.mp4`;
	}
}

export function resolveImageUrl(key: string): string {
	if (!key) return "";
	const provider = getImageProvider();
	switch (provider) {
		case "cloudinary":
			return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${key}.jpg`;
		case "local":
		default:
			return `/image/${key}.jpg`;
	}
}
