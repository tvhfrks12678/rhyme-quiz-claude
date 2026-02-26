export type VideoProvider = "local" | "cloudinary" | "bunny";

function getVideoProvider(): VideoProvider {
	return (process.env.VIDEO_PROVIDER as VideoProvider) ?? "local";
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
