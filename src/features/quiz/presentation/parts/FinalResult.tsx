import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import type { ScoreResult } from "../../domain/logic/scoring"

interface FinalResultProps {
	score: ScoreResult
	rank: string | null
	onReset: () => void
}

export function FinalResult({ score, rank, onReset }: FinalResultProps) {
	const getRankColor = (rankName: string) => {
		switch (rankName) {
			case "韻の神":
				return "from-yellow-400 via-amber-200 to-yellow-600 text-yellow-950 shadow-[0_0_20px_rgba(251,191,36,0.5)] border-yellow-300"
			case "韻の皇帝":
				return "from-purple-600 to-indigo-700 text-white shadow-purple-200"
			case "韻のプロ":
				return "from-blue-500 to-blue-700 text-white"
			case "韻の黒帯":
				return "from-gray-700 to-gray-900 text-white"
			case "韻の見習い":
				return "from-green-400 to-green-600 text-white"
			default:
				return "from-gray-300 to-gray-400 text-gray-800"
		}
	}

	return (
		<div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-lg overflow-hidden border-2 border-purple-100 shadow-2xl animate-in fade-in zoom-in duration-500">
				<CardHeader className="bg-gradient-to-r from-purple-100 via-pink-50 to-purple-100 border-b border-purple-100">
					<CardTitle className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
						RESULT
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-8 p-8 text-center relative">
					{rank === "韻の神" && (
						<div className="absolute inset-0 pointer-events-none overflow-hidden">
							<div className="absolute -inset-[100%] animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20" />
						</div>
					)}
					<div className="space-y-2 relative">
						<div className="text-sm font-bold text-purple-400 uppercase tracking-[0.3em]">
							Final Score
						</div>
						<div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-600 to-purple-900 drop-shadow-sm">
							{score.correct} <span className="text-3xl text-gray-300">/ {score.total}</span>
						</div>
					</div>

					<div className="flex flex-col items-center gap-4 py-4 relative">
						<div className="text-sm font-bold text-gray-400 uppercase tracking-widest">称号</div>
						{rank ? (
							<div
								className={`
									relative px-12 py-6 rounded-2xl text-4xl font-black bg-gradient-to-br border-4
									${getRankColor(rank)}
									transform transition-all hover:scale-110 duration-300
									flex items-center justify-center
								`}
							>
								{rank === "韻の神" && (
									<span className="absolute -top-4 -right-4 text-4xl">👑</span>
								)}
								{rank}
								{rank === "韻の神" && (
									<div className="absolute inset-0 overflow-hidden rounded-2xl">
										<div className="absolute inset-0 translate-x-[-100%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
									</div>
								)}
							</div>
						) : (
							<div className="text-gray-400 italic">称号なし</div>
						)}
					</div>

					<div
						className={`text-xl font-bold px-6 py-2 rounded-full inline-block shadow-sm ${
							score.percentage >= 80
								? "bg-green-100 text-green-700 border border-green-200"
								: "bg-orange-100 text-orange-700 border border-orange-200"
						}`}
					>
						{score.percentage === 100
							? "PERFECT!! 伝説のラッパー誕生"
							: score.percentage >= 80
								? "素晴らしい！才能を感じるぜ"
								: score.percentage >= 60
									? "合格点！次はもっと上へ"
									: "リベンジ待ってるぜ！"}
					</div>

					<Button
						size="lg"
						className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-200/50 active:scale-[0.98]"
						onClick={onReset}
					>
						もう一度挑戦する
					</Button>
				</CardContent>
			</Card>
			<style>{`
				@keyframes shimmer {
					100% {
						transform: translateX(100%);
					}
				}
			`}</style>
		</div>
	)
}
