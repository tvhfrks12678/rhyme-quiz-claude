import { useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import {
	QuizQuestionSchema,
	type SubmitResponse,
	SubmitResponseSchema,
} from "../../contracts/quiz";

interface QuizStoreState {
	currentQuestionIndex: number;
	selectedChoiceIds: string[];
	results: Array<{ isCorrect: boolean }>;
	phase: "answering" | "result" | "finished";
	submitResult: SubmitResponse | null;
	toggleChoice: (id: string) => void;
	setSubmitResult: (result: SubmitResponse) => void;
	nextQuestion: (total: number) => void;
	reset: () => void;
}

export const useQuizStore = create<QuizStoreState>((set) => ({
	currentQuestionIndex: 0,
	selectedChoiceIds: [],
	results: [],
	phase: "answering",
	submitResult: null,

	toggleChoice: (id) =>
		set((state) => ({
			selectedChoiceIds: state.selectedChoiceIds.includes(id)
				? state.selectedChoiceIds.filter((x) => x !== id)
				: [...state.selectedChoiceIds, id],
		})),

	setSubmitResult: (result) =>
		set((state) => ({
			submitResult: result,
			phase: "result",
			results: [...state.results, { isCorrect: result.isCorrect }],
		})),

	nextQuestion: (total) =>
		set((state) => {
			const nextIndex = state.currentQuestionIndex + 1;
			if (nextIndex >= total) {
				return {
					phase: "finished",
					currentQuestionIndex: nextIndex,
					selectedChoiceIds: [],
					submitResult: null,
				};
			}
			return {
				currentQuestionIndex: nextIndex,
				selectedChoiceIds: [],
				phase: "answering",
				submitResult: null,
			};
		}),

	reset: () =>
		set({
			currentQuestionIndex: 0,
			selectedChoiceIds: [],
			results: [],
			phase: "answering",
			submitResult: null,
		}),
}));

export function useCurrentQuestion() {
	const currentQuestionIndex = useQuizStore((s) => s.currentQuestionIndex);

	return useQuery({
		queryKey: ["quiz", "next", currentQuestionIndex],
		queryFn: async () => {
			const res = await fetch(`/api/quiz/next?index=${currentQuestionIndex}`);
			if (!res.ok) throw new Error("Failed to fetch question");
			return QuizQuestionSchema.parse(await res.json());
		},
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useSubmitAnswer() {
	const setSubmitResult = useQuizStore((s) => s.setSubmitResult);

	return useMutation({
		mutationFn: async ({
			questionId,
			selectedChoiceIds,
		}: {
			questionId: string;
			selectedChoiceIds: string[];
		}) => {
			const res = await fetch(`/api/quiz/${questionId}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selectedChoiceIds }),
			});
			if (!res.ok) throw new Error("Failed to submit answer");
			return SubmitResponseSchema.parse(await res.json());
		},
		onSuccess: (data) => {
			setSubmitResult(data);
		},
	});
}
