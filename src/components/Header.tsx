import { Link } from "@tanstack/react-router";
import { Home, Menu, Music, X } from "lucide-react";
import { useState } from "react";

import { AnimatedGradientText } from "#/components/magicui/animated-gradient-text";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="p-4 flex items-center bg-gray-900 text-white shadow-lg border-b border-white/10">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-2xl font-bold">
					<Link to="/">
						<AnimatedGradientText
							colorFrom="#a855f7"
							colorTo="#ec4899"
							speed={1.2}
						>
							Rhyme Quiz
						</AnimatedGradientText>
					</Link>
				</h1>
				<a
					href="https://www.tiktok.com"
					target="_blank"
					rel="noopener noreferrer"
					className="ml-auto p-2 hover:bg-gray-700 rounded-lg transition-colors"
					aria-label="TikTok"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="size-6"
					>
						<title>TikTok</title>
						<path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.12v12.303a2.934 2.934 0 1 1-2.934-2.934c.243 0 .478.034.703.09V8.277a6.055 6.055 0 0 0-.703-.041A6.056 6.056 0 1 0 15.82 14.29V8.003a7.908 7.908 0 0 0 4.47 1.383V6.269a4.816 4.816 0 0 1-.702.417Z" />
					</svg>
				</a>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-purple-700 hover:bg-purple-800 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/quiz"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-purple-700 hover:bg-purple-800 transition-colors mb-2",
						}}
					>
						<Music size={20} />
						<span className="font-medium">韻クイズ</span>
					</Link>
				</nav>
			</aside>
		</>
	);
}
