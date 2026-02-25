import { createFileRoute } from "@tanstack/react-router";

import { QuizPage } from "@/features/quiz";

export const Route = createFileRoute("/")({
	component: QuizPage,
});
