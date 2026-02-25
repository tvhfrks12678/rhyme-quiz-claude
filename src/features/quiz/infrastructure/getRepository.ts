import type { QuizRepository } from "../domain/ports/quizRepository";
import { JsonQuizRepository } from "./repositories/jsonQuizRepository";

export function getRepository(): QuizRepository {
	return new JsonQuizRepository();
}
