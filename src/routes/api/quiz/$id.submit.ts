import { createFileRoute } from "@tanstack/react-router"

import { submitAnswer } from "@/features/quiz/application/services/quizService"
import { SubmitRequestSchema } from "@/features/quiz/contracts/quiz"

export const Route = createFileRoute("/api/quiz/$id/submit")({
	server: {
		handlers: {
			POST: async ({ request, params }) => {
				let body: unknown
				try {
					body = await request.json()
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 })
				}

				const parsed = SubmitRequestSchema.safeParse(body)
				if (!parsed.success) {
					return Response.json({ error: "Invalid request" }, { status: 400 })
				}

				const result = await submitAnswer(
					params.id,
					parsed.data.selectedChoiceIds,
				)
				if (!result) {
					return Response.json(
						{ error: "Question not found" },
						{ status: 404 },
					)
				}

				return Response.json(result)
			},
		},
	},
})
