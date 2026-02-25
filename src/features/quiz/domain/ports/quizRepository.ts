import type { QuizFull } from "../entities/quiz";

export interface QuizRepository {
	findAllQuestions(): Promise<QuizFull[]>;
	findFullById(id: string): Promise<QuizFull | null>;
}
