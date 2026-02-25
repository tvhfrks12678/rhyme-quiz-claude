import { createFileRoute } from "@tanstack/react-router";

import { getQuestionByIndex } from "@/features/quiz/application/services/quizService";

export const Route = createFileRoute("/api/quiz/next")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const indexParam = url.searchParams.get("index");
				const index = indexParam !== null ? parseInt(indexParam, 10) : 0;

				const question = await getQuestionByIndex(index);
				if (!question) {
					return Response.json(
						{ error: "Question not found" },
						{ status: 404 },
					);
				}

				return Response.json(question);
			},
		},
	},
});
