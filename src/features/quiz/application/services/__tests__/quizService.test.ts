/**
 * quizService のユニットテスト
 *
 * テスト対象: getQuestionByIndex(index) 関数
 * - videoKey を持つ問題は videoUrl を返すことを検証する
 * - videoKey を持たない問題は videoUrl を返さないことを検証する
 *
 * vi.mock() でリポジトリ（DB/ファイルアクセス）を差し替えることで、
 * 実際のデータファイルを使わずに関数の振る舞いだけをテストする
 */
import { describe, expect, it, vi } from "vitest";

import { getQuestionByIndex } from "../quizService";

// getRepository() が返すリポジトリをモック（偽物）に差し替える
vi.mock("../../../infrastructure/getRepository", () => ({
	getRepository: () => ({
		findAllQuestions: async () => [
			// videoKey なし（画像プレースホルダーを表示する問題）
			{
				id: "q1",
				questionWord: "とら",
				questionVowels: "おあ",
				imageKey: "tora",
				explanation: "テスト用",
				choices: [{ id: "c1", text: "おか", vowels: "おあ", isCorrect: true }],
			},
			// videoKey あり（動画を表示する問題）
			{
				id: "q2",
				questionWord: "あたま",
				questionVowels: "あああ",
				imageKey: "",
				videoKey: "test-video-key",
				explanation: "テスト用",
				choices: [{ id: "c1", text: "からだ", vowels: "あああ", isCorrect: true }],
			},
		],
		findFullById: async () => null,
	}),
}));

describe("getQuestionByIndex", () => {
	it("videoKey がある問題は videoUrl を含む", async () => {
		const question = await getQuestionByIndex(1);
		// VIDEO_PROVIDER 未設定 → local → /video/${key}.mp4 になる
		expect(question?.videoUrl).toBe("/video/test-video-key.mp4");
	});

	it("videoKey がない問題は videoUrl が undefined", async () => {
		const question = await getQuestionByIndex(0);
		expect(question?.videoUrl).toBeUndefined();
	});

	it("存在しないインデックスは null を返す", async () => {
		const question = await getQuestionByIndex(99);
		expect(question).toBeNull();
	});

	it("questionWord を正しく返す", async () => {
		const question = await getQuestionByIndex(0);
		expect(question?.questionWord).toBe("とら");
	});

	it("choices に isCorrect などサーバー情報が含まれない（クライアントへは id と text のみ）", async () => {
		const question = await getQuestionByIndex(0);
		const choice = question?.choices[0];
		// isCorrect はクライアントに渡さない（正解情報の秘匿）
		expect(choice).not.toHaveProperty("isCorrect");
		expect(choice).toHaveProperty("id");
		expect(choice).toHaveProperty("text");
	});
});
