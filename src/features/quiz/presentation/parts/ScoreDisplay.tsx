import { Progress } from "#/components/ui/progress"

import { calculateScore } from "../../domain/logic/scoring"

interface ScoreDisplayProps {
	results: Array<{ isCorrect: boolean }>
	currentIndex: number
	total: number
}

export function ScoreDisplay({
	results,
	currentIndex,
	total,
}: ScoreDisplayProps) {
	const score = calculateScore(results)
	const progress = Math.round((results.length / total) * 100)

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm text-gray-600">
				<span>
					問題 {currentIndex + 1} / {total}
				</span>
				<span>
					正解数: {score.correct} / {results.length}
				</span>
			</div>
			<Progress value={progress} className="h-2 transition-all duration-500" />
		</div>
	)
}
