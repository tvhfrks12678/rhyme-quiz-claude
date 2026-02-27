import { ArrowDown, ImageIcon, MonitorPlay, Type } from "lucide-react";
import { useState } from "react";

import { ShimmerButton } from "#/components/magicui/shimmer-button";
import { ShineBorder } from "#/components/magicui/shine-border";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import type { QuizQuestion } from "../../contracts/quiz";
import { useQuizStore, useSubmitAnswer } from "../hooks/useQuiz";
import { ChoiceList } from "./ChoiceList";
import { RomajiMarquee } from "./RomajiMarquee";
import { RomajiVerticalMarquee } from "./RomajiVerticalMarquee";

interface QuizCardProps {
	question: QuizQuestion;
}

type DisplayMode = "vertical-marquee" | "marquee" | "image" | "video";

export function QuizCard({ question }: QuizCardProps) {
	const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds);
	const submitMutation = useSubmitAnswer();
	const [imageError, setImageError] = useState(false);

	const initialMode: DisplayMode = question.verticalMarqueeMode
		? "vertical-marquee"
		: question.marqueeMode
			? "marquee"
			: question.videoUrl
				? "video"
				: "image";
	const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);

	const handleSubmit = () => {
		submitMutation.mutate({
			questionId: question.id,
			selectedChoiceIds,
		});
	};

	const hasImage = Boolean(question.imageUrl) && !imageError;
	const hasVideo = Boolean(question.videoUrl);
	const hasMarquee = Boolean(question.marqueeMode);
	const hasVerticalMarquee = Boolean(question.verticalMarqueeMode);

	const availableModes = [
		hasVerticalMarquee && "vertical-marquee",
		hasMarquee && "marquee",
		hasVideo && "video",
		hasImage && "image",
	].filter(Boolean) as DisplayMode[];
	const showToggle = availableModes.length > 1;

	return (
		<div className="relative">
			<ShineBorder
				borderWidth={2}
				duration={10}
				shineColor={["#a855f7", "#ec4899", "#6366f1"]}
			/>
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-center text-xl">
						「{question.questionWord}」で踏める韻は？
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{showToggle && (
						<div className="flex justify-end gap-2">
							{hasVerticalMarquee && (
								<button
									type="button"
									onClick={() => setDisplayMode("vertical-marquee")}
									className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
										displayMode === "vertical-marquee"
											? "bg-green-600 text-white"
											: "bg-gray-200 text-gray-600 hover:bg-gray-300"
									}`}
									aria-label="ローマ字縦スクロール表示"
								>
									<ArrowDown className="w-3 h-3" />
									縦ローマ字
								</button>
							)}
							{hasMarquee && (
								<button
									type="button"
									onClick={() => setDisplayMode("marquee")}
									className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
										displayMode === "marquee"
											? "bg-green-600 text-white"
											: "bg-gray-200 text-gray-600 hover:bg-gray-300"
									}`}
									aria-label="ローマ字横スクロール表示"
								>
									<Type className="w-3 h-3" />
									横ローマ字
								</button>
							)}
							{hasVideo && (
								<button
									type="button"
									onClick={() => setDisplayMode("video")}
									className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
										displayMode === "video"
											? "bg-purple-600 text-white"
											: "bg-gray-200 text-gray-600 hover:bg-gray-300"
									}`}
									aria-label="動画表示"
								>
									<MonitorPlay className="w-3 h-3" />
									動画
								</button>
							)}
							{hasImage && (
								<button
									type="button"
									onClick={() => setDisplayMode("image")}
									className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
										displayMode === "image"
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-600 hover:bg-gray-300"
									}`}
									aria-label="画像表示"
								>
									<ImageIcon className="w-3 h-3" />
									画像
								</button>
							)}
						</div>
					)}

					{displayMode === "vertical-marquee" && hasVerticalMarquee ? (
						<RomajiVerticalMarquee
							questionWord={question.questionWord}
							choices={question.choices}
						/>
					) : displayMode === "marquee" && hasMarquee ? (
						<RomajiMarquee
							questionWord={question.questionWord}
							choices={question.choices}
						/>
					) : displayMode === "video" && hasVideo ? (
						<div className="flex justify-center">
							<video
								src={question.videoUrl}
								controls
								className="w-full max-w-sm rounded-lg"
								data-testid="video-player"
							/>
						</div>
					) : displayMode === "image" && hasImage ? (
						<div className="flex justify-center">
							<img
								src={question.imageUrl}
								alt={question.questionWord}
								className="w-40 h-40 object-cover rounded-lg"
								data-testid="image-display"
								onError={() => setImageError(true)}
							/>
						</div>
					) : !hasVerticalMarquee && !hasMarquee && !hasVideo && !hasImage ? (
						<div className="flex justify-center">
							<div
								className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
								data-testid="image-placeholder"
							>
								<ImageIcon className="w-12 h-12 text-gray-400" />
							</div>
						</div>
					) : null}

					<ChoiceList choices={question.choices} />

					<ShimmerButton
						type="button"
						className="w-full h-12 text-base font-bold"
						background="linear-gradient(135deg, #7c3aed, #db2777)"
						borderRadius="0.5rem"
						shimmerColor="#ffffff"
						shimmerDuration="2.5s"
						onClick={handleSubmit}
						disabled={
							selectedChoiceIds.length === 0 || submitMutation.isPending
						}
					>
						{submitMutation.isPending ? "判定中..." : "解答する"}
					</ShimmerButton>
				</CardContent>
			</Card>
		</div>
	);
}
