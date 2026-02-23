export interface ScoreResult {
	correct: number
	total: number
	percentage: number
}

export function calculateScore(
	results: { isCorrect: boolean }[],
): ScoreResult {
	const correct = results.filter((r) => r.isCorrect).length
	const total = results.length
	const percentage = total === 0 ? 0 : Math.round((correct / total) * 100)
	return { correct, total, percentage }
}
