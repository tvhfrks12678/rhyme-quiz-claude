import { describe, expect, it } from "vitest";

import { calculateScore, getRhymeRank } from "../scoring";

describe("calculateScore", () => {
	it("全問正解のとき correct=5, percentage=100 を返す", () => {
		const results = Array.from({ length: 5 }, () => ({ isCorrect: true }));
		const score = calculateScore(results);
		expect(score.correct).toBe(5);
		expect(score.total).toBe(5);
		expect(score.percentage).toBe(100);
	});

	it("全問不正解のとき correct=0, percentage=0 を返す", () => {
		const results = Array.from({ length: 5 }, () => ({ isCorrect: false }));
		const score = calculateScore(results);
		expect(score.correct).toBe(0);
		expect(score.total).toBe(5);
		expect(score.percentage).toBe(0);
	});

	it("3/5正解のとき correct=3, percentage=60 を返す", () => {
		const results = [
			{ isCorrect: true },
			{ isCorrect: true },
			{ isCorrect: true },
			{ isCorrect: false },
			{ isCorrect: false },
		];
		const score = calculateScore(results);
		expect(score.correct).toBe(3);
		expect(score.total).toBe(5);
		expect(score.percentage).toBe(60);
	});

	it("結果が空のとき total=0, percentage=0 を返す", () => {
		const score = calculateScore([]);
		expect(score.correct).toBe(0);
		expect(score.total).toBe(0);
		expect(score.percentage).toBe(0);
	});
});

describe("getRhymeRank", () => {
	it("0〜5問正解に対応した称号を返す", () => {
		expect(getRhymeRank(0)).toBe("韻の素人");
		expect(getRhymeRank(1)).toBe("韻の見習い");
		expect(getRhymeRank(2)).toBe("韻の黒帯");
		expect(getRhymeRank(3)).toBe("韻のプロ");
		expect(getRhymeRank(4)).toBe("韻の皇帝");
		expect(getRhymeRank(5)).toBe("韻の神");
	});

	it("範囲外の正解数は0〜5に丸める", () => {
		expect(getRhymeRank(-1)).toBe("韻の素人");
		expect(getRhymeRank(10)).toBe("韻の神");
	});
});
