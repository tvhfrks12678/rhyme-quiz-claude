export interface ScoreResult {
	correct: number
	total: number
	percentage: number
}

const RHYME_RANKS = [
	"韻の素人",
	"韻の見習い",
	"韻の黒帯",
	"韻のプロ",
	"韻の皇帝",
	"韻の神",
] as const

export function calculateScore(
	results: { isCorrect: boolean }[],
): ScoreResult {
	const correct = results.filter((r) => r.isCorrect).length
	const total = results.length
	const percentage = total === 0 ? 0 : Math.round((correct / total) * 100)
	return { correct, total, percentage }
}

export function getRhymeRank(correctCount: number): string {
	const safeCorrectCount = Math.max(0, Math.min(5, correctCount))
	return RHYME_RANKS[safeCorrectCount]
}
