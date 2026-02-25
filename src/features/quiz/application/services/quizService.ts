import type { QuizResult } from "../../domain/entities/quiz"
import { judgeAnswer } from "../../domain/logic/rhyme"
import { getRepository } from "../../infrastructure/getRepository"

export interface QuestionForClient {
	id: string
	questionWord: string
	imageKey: string
	choices: Array<{ id: string; text: string }>
	total: number
	index: number
}

export async function getQuestionByIndex(
	index: number,
): Promise<QuestionForClient | null> {
	const repo = getRepository()
	const allQuizzes = await repo.findAllQuestions()
	const quiz = allQuizzes[index]
	if (!quiz) return null

	const shuffledChoices = quiz.choices
		.map((c) => ({ id: c.id, text: c.text }))
		.sort(() => Math.random() - 0.5)

	return {
		id: quiz.id,
		questionWord: quiz.questionWord,
		imageKey: quiz.imageKey,
		choices: shuffledChoices,
		total: allQuizzes.length,
		index,
	}
}

export async function submitAnswer(
	questionId: string,
	selectedIds: string[],
): Promise<QuizResult | null> {
	const repo = getRepository()
	const quiz = await repo.findFullById(questionId)
	if (!quiz) return null

	return judgeAnswer(quiz, selectedIds)
}
