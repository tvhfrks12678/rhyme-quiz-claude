import type { QuizFull } from "../../domain/entities/quiz"
import type { QuizRepository } from "../../domain/ports/quizRepository"
import { quizzes } from "../data/quizData"

export class JsonQuizRepository implements QuizRepository {
	async findAllQuestions(): Promise<QuizFull[]> {
		return quizzes
	}

	async findFullById(id: string): Promise<QuizFull | null> {
		return quizzes.find((q) => q.id === id) ?? null
	}
}
