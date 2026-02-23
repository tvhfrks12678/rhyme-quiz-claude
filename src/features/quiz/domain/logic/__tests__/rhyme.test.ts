import { describe, expect, it } from "vitest"

import type { QuizFull } from "../../entities/quiz"
import { extractVowels, judgeAnswer } from "../rhyme"

describe("extractVowels", () => {
	it("「とら」→「おあ」を返す", () => {
		expect(extractVowels("とら")).toBe("おあ")
	})

	it("「くるま」→「ううあ」を返す", () => {
		expect(extractVowels("くるま")).toBe("ううあ")
	})

	it("「ひかり」→「いあい」を返す", () => {
		expect(extractVowels("ひかり")).toBe("いあい")
	})

	it("「なみだ」→「あいあ」を返す", () => {
		expect(extractVowels("なみだ")).toBe("あいあ")
	})

	it("「そら」→「おあ」を返す", () => {
		expect(extractVowels("そら")).toBe("おあ")
	})

	it("空文字→空文字を返す", () => {
		expect(extractVowels("")).toBe("")
	})
})

const sampleQuiz: QuizFull = {
	id: "q1",
	questionWord: "とら",
	questionVowels: "おあ",
	imageKey: "tora",
	explanation: "「とら」の母音は「おあ」。同じ母音パターンの「おか」が正解。",
	choices: [
		{ id: "q1-c1", text: "おか", vowels: "おあ", isCorrect: true },
		{ id: "q1-c2", text: "ぶた", vowels: "うあ", isCorrect: false },
		{ id: "q1-c3", text: "ふぐ", vowels: "うう", isCorrect: false },
		{ id: "q1-c4", text: "さる", vowels: "あう", isCorrect: false },
	],
}

describe("judgeAnswer", () => {
	it("正解の選択肢を選んだとき isCorrect=true を返す", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c1"])
		expect(result.isCorrect).toBe(true)
	})

	it("不正解の選択肢を選んだとき isCorrect=false を返す", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c2"])
		expect(result.isCorrect).toBe(false)
	})

	it("空の選択肢のとき isCorrect=false を返す", () => {
		const result = judgeAnswer(sampleQuiz, [])
		expect(result.isCorrect).toBe(false)
	})

	it("questionVowels を正しく返す", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c1"])
		expect(result.questionVowels).toBe("おあ")
	})

	it("correctChoiceIds に正解 ID が含まれる", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c1"])
		expect(result.correctChoiceIds).toContain("q1-c1")
	})

	it("choiceDetails に全選択肢の情報が含まれる", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c1"])
		expect(result.choiceDetails).toHaveLength(4)
	})

	it("choiceDetails で正解の isCorrect=true、不正解の isCorrect=false", () => {
		const result = judgeAnswer(sampleQuiz, ["q1-c1"])
		const correct = result.choiceDetails.find((c) => c.id === "q1-c1")
		const wrong = result.choiceDetails.find((c) => c.id === "q1-c2")
		expect(correct?.isCorrect).toBe(true)
		expect(wrong?.isCorrect).toBe(false)
	})

	it("複数正解クイズで全正解を選んだとき isCorrect=true", () => {
		const multiQuiz: QuizFull = {
			...sampleQuiz,
			choices: [
				{ id: "c1", text: "おか", vowels: "おあ", isCorrect: true },
				{ id: "c2", text: "こま", vowels: "おあ", isCorrect: true },
				{ id: "c3", text: "ぶた", vowels: "うあ", isCorrect: false },
			],
		}
		const result = judgeAnswer(multiQuiz, ["c1", "c2"])
		expect(result.isCorrect).toBe(true)
	})

	it("複数正解クイズで一部しか選ばなかったとき isCorrect=false", () => {
		const multiQuiz: QuizFull = {
			...sampleQuiz,
			choices: [
				{ id: "c1", text: "おか", vowels: "おあ", isCorrect: true },
				{ id: "c2", text: "こま", vowels: "おあ", isCorrect: true },
				{ id: "c3", text: "ぶた", vowels: "うあ", isCorrect: false },
			],
		}
		const result = judgeAnswer(multiQuiz, ["c1"])
		expect(result.isCorrect).toBe(false)
	})
})
