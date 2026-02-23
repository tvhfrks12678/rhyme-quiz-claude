import { describe, expect, it } from "vitest"

import { calculateScore } from "../scoring"

describe("calculateScore", () => {
	it("全問正解のとき correct=5, percentage=100 を返す", () => {
		const results = Array.from({ length: 5 }, () => ({ isCorrect: true }))
		const score = calculateScore(results)
		expect(score.correct).toBe(5)
		expect(score.total).toBe(5)
		expect(score.percentage).toBe(100)
	})

	it("全問不正解のとき correct=0, percentage=0 を返す", () => {
		const results = Array.from({ length: 5 }, () => ({ isCorrect: false }))
		const score = calculateScore(results)
		expect(score.correct).toBe(0)
		expect(score.total).toBe(5)
		expect(score.percentage).toBe(0)
	})

	it("3/5正解のとき correct=3, percentage=60 を返す", () => {
		const results = [
			{ isCorrect: true },
			{ isCorrect: true },
			{ isCorrect: true },
			{ isCorrect: false },
			{ isCorrect: false },
		]
		const score = calculateScore(results)
		expect(score.correct).toBe(3)
		expect(score.total).toBe(5)
		expect(score.percentage).toBe(60)
	})

	it("結果が空のとき total=0, percentage=0 を返す", () => {
		const score = calculateScore([])
		expect(score.correct).toBe(0)
		expect(score.total).toBe(0)
		expect(score.percentage).toBe(0)
	})
})
