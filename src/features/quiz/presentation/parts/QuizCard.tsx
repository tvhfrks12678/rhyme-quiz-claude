import { ImageIcon } from "lucide-react"

import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"

import type { QuizQuestion } from "../../contracts/quiz"
import { useQuizStore, useSubmitAnswer } from "../hooks/useQuiz"
import { ChoiceList } from "./ChoiceList"

interface QuizCardProps {
	question: QuizQuestion
}

export function QuizCard({ question }: QuizCardProps) {
	const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds)
	const submitMutation = useSubmitAnswer()

	const handleSubmit = () => {
		submitMutation.mutate({
			questionId: question.id,
			selectedChoiceIds,
		})
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-center text-xl">
					「{question.questionWord}」で踏める韻は？
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex justify-center">
					<div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
						<ImageIcon className="w-12 h-12 text-gray-400" />
					</div>
				</div>

				<ChoiceList choices={question.choices} />

				<Button
					className="w-full"
					onClick={handleSubmit}
					disabled={
						selectedChoiceIds.length === 0 || submitMutation.isPending
					}
				>
					{submitMutation.isPending ? "判定中..." : "解答する"}
				</Button>
			</CardContent>
		</Card>
	)
}
