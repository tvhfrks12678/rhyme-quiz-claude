import type { Choice } from "../../contracts/quiz";
import { hiraganaToRomaji } from "../utils/hiraganaToRomaji";

interface RomajiMarqueeProps {
	questionWord: string;
	choices: Choice[];
}

export function RomajiMarquee({ questionWord, choices }: RomajiMarqueeProps) {
	const questionRomaji = hiraganaToRomaji(questionWord);
	const choicesRomaji = choices.map((c) => hiraganaToRomaji(c.text));
	const scrollText = [questionRomaji, ...choicesRomaji].join("  ");
	const repeatedText = `${scrollText}  ·  ${scrollText}  ·  ${scrollText}`;

	return (
		<div
			className="w-full h-40 bg-gray-900 rounded-lg flex items-center overflow-hidden relative"
			data-testid="romaji-marquee"
		>
			<div className="absolute inset-0 flex items-center">
				<p
					className="whitespace-nowrap text-green-400 font-mono text-2xl font-bold tracking-widest animate-marquee"
					style={{
						animation: "marquee-ltr 12s linear infinite",
					}}
				>
					{repeatedText}
				</p>
			</div>
			<style>{`
				@keyframes marquee-ltr {
					0% { transform: translateX(-33.33%); }
					100% { transform: translateX(0%); }
				}
			`}</style>
		</div>
	);
}
