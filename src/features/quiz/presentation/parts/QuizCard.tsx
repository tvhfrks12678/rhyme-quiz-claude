import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { ShimmerButton } from "#/components/magicui/shimmer-button";
import { ShineBorder } from "#/components/magicui/shine-border";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

import type { QuizQuestion } from "../../contracts/quiz";
import { useQuizStore, useSubmitAnswer } from "../hooks/useQuiz";
import { ChoiceList } from "./ChoiceList";

interface QuizCardProps {
	question: QuizQuestion;
}

export function QuizCard({ question }: QuizCardProps) {
	const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds);
	const submitMutation = useSubmitAnswer();
	const [imageError, setImageError] = useState(false);

	const handleSubmit = () => {
		submitMutation.mutate({
			questionId: question.id,
			selectedChoiceIds,
		});
	};

	const showImage = question.imageUrl && !imageError;
	const showPlaceholder = !question.videoUrl && !showImage;

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
					{question.videoUrl ? (
						<div className="flex justify-center">
							<video
								src={question.videoUrl}
								controls
								className="w-full max-w-sm rounded-lg"
								data-testid="video-player"
							/>
						</div>
					) : showImage ? (
						<div className="flex justify-center">
							<img
								src={question.imageUrl}
								alt={question.questionWord}
								className="w-40 h-40 object-cover rounded-lg"
								data-testid="image-display"
								onError={() => setImageError(true)}
							/>
						</div>
					) : showPlaceholder ? (
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
