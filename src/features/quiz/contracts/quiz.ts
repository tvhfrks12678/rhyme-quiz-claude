import { z } from "zod";

export const ChoiceSchema = z.object({
	id: z.string(),
	text: z.string(),
});

export const QuizQuestionSchema = z.object({
	id: z.string(),
	questionWord: z.string(),
	imageKey: z.string(),
	imageUrl: z.string().optional(),
	videoUrl: z.string().optional(),
	choices: z.array(ChoiceSchema),
	total: z.number(),
	index: z.number(),
});

export const SubmitRequestSchema = z.object({
	selectedChoiceIds: z.array(z.string()),
});

export const ChoiceDetailSchema = z.object({
	id: z.string(),
	text: z.string(),
	vowels: z.string(),
	isCorrect: z.boolean(),
});

export const SubmitResponseSchema = z.object({
	isCorrect: z.boolean(),
	questionVowels: z.string(),
	correctChoiceIds: z.array(z.string()),
	explanation: z.string(),
	choiceDetails: z.array(ChoiceDetailSchema),
});

export type Choice = z.infer<typeof ChoiceSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;
export type ChoiceDetail = z.infer<typeof ChoiceDetailSchema>;
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;
