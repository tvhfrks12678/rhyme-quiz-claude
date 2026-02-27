import type { Choice } from "../../contracts/quiz";
import { hiraganaToRomaji } from "../utils/hiraganaToRomaji";

interface RomajiVerticalMarqueeProps {
	questionWord: string;
	choices: Choice[];
}

export function RomajiVerticalMarquee({
	questionWord,
	choices,
}: RomajiVerticalMarqueeProps) {
	const questionRomaji = hiraganaToRomaji(questionWord);
	const items = [questionRomaji, ...choices.map((c) => hiraganaToRomaji(c.text))];
	// 3回繰り返して連続スクロールを実現
	const repeatedItems = [...items, ...items, ...items];

	return (
		<div
			className="w-full h-40 bg-gray-900 rounded-lg overflow-hidden relative"
			data-testid="romaji-vertical-marquee"
		>
			<div
				className="absolute inset-0 flex flex-col"
				style={{
					animation: "vertical-marquee 10s linear infinite",
				}}
			>
				{repeatedItems.map((text, i) => (
					<p
						// eslint-disable-next-line react/no-array-index-key
						key={i}
						className="text-green-400 font-mono text-lg font-bold tracking-widest whitespace-nowrap px-4 leading-8"
					>
						{text}
					</p>
				))}
			</div>
			<style>{`
				@keyframes vertical-marquee {
					0% { transform: translateY(-33.33%); }
					100% { transform: translateY(0%); }
				}
			`}</style>
		</div>
	);
}
