import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"

import { calculateScore, getRhymeRank } from "../domain/logic/scoring"
import { useCurrentQuestion, useQuizStore } from "./hooks/useQuiz"
import { FinalResult } from "./parts/FinalResult"
import { QuizCard } from "./parts/QuizCard"
import { ResultDisplay } from "./parts/ResultDisplay"
import { ScoreDisplay } from "./parts/ScoreDisplay"

export function QuizPage() {
	const phase = useQuizStore((s) => s.phase)
	const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex)
	const results = useQuizStore((s) => s.results)
	const submitResult = useQuizStore((s) => s.submitResult)
	const nextQuestion = useQuizStore((s) => s.nextQuestion)
	const reset = useQuizStore((s) => s.reset)

	const { data: question, isLoading, error } = useCurrentQuestion()

	if (phase === "finished") {
		const score = calculateScore(results)
		const rank = score.total >= 5 ? getRhymeRank(score.correct) : null
		return <FinalResult score={score} rank={rank} onReset={reset} />
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<p className="text-gray-500">問題を読み込み中...</p>
			</div>
		)
	}

	if (error || !question) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<p className="text-red-500">問題の取得に失敗しました。</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-lg mx-auto space-y-4">
				<ScoreDisplay
					results={results}
					currentIndex={currentQuestionIndex}
					total={question.total}
				/>

				{phase === "answering" && <QuizCard question={question} />}

				{phase === "result" && submitResult && (
					<ResultDisplay
						result={submitResult}
						questionWord={question.questionWord}
						onNext={() => nextQuestion(question.total)}
					/>
				)}
			</div>
		</div>
	)
}
