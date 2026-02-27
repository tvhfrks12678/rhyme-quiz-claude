// @vitest-environment jsdom
/**
 * QuizCard コンポーネントテスト（React Testing Library）
 *
 * テスト対象: QuizCard コンポーネントの描画ロジック
 * - question.videoUrl がある              → <video> を表示する
 * - question.imageUrl がある（動画なし）  → <img> を表示する
 * - imageUrl も videoUrl もない           → 画像プレースホルダーを表示する
 *
 * React Testing Library（RTL）は「ユーザーが見る画面」に近い形でテストする。
 * 実際の DOM に描画して、要素の存在を確認する。
 *
 * // @vitest-environment jsdom
 * このコメントにより、このファイルだけ jsdom（ブラウザ環境エミュレーション）で実行される。
 * jsdom がないと document や window が存在せず React のレンダリングが動かない。
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { QuizQuestion } from "../../../contracts/quiz";
import { useQuizStore } from "../../hooks/useQuiz";
import { QuizCard } from "../QuizCard";

// 各テスト後に DOM をリセットする（テスト間の状態汚染を防ぐ）
afterEach(cleanup);

// TanStack Query の Provider でラップする（useSubmitAnswer が内部で useMutation を使うため）
function renderWithProviders(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
}

// テスト用の問題データ（videoUrl あり）
const questionWithVideo: QuizQuestion = {
	id: "q2",
	questionWord: "あたま",
	imageKey: "",
	videoUrl: "/video/test-video.mp4",
	choices: [
		{ id: "c1", text: "からだ" },
		{ id: "c2", text: "ながら" },
	],
	total: 5,
	index: 1,
};

// テスト用の問題データ（imageUrl あり・videoUrl なし）
const questionWithImage: QuizQuestion = {
	id: "q1",
	questionWord: "とら",
	imageKey: "tora",
	imageUrl: "/images/tora.jpg",
	choices: [
		{ id: "c1", text: "おか" },
		{ id: "c2", text: "ぶた" },
	],
	total: 5,
	index: 0,
};

// テスト用の問題データ（videoUrl も imageUrl もなし）
const questionWithNoMedia: QuizQuestion = {
	id: "q1",
	questionWord: "とら",
	imageKey: "",
	choices: [
		{ id: "c1", text: "おか" },
		{ id: "c2", text: "ぶた" },
	],
	total: 5,
	index: 0,
};

describe("QuizCard", () => {
	// 各テスト前に Zustand ストアをリセットする
	// （テスト間で selectedChoiceIds などの状態が残らないようにする）
	beforeEach(() => {
		useQuizStore.getState().reset();
	});

	describe("動画表示", () => {
		it("videoUrl があるとき <video> 要素を表示する", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			const video = screen.getByTestId("video-player");
			expect(video).toBeInTheDocument();
			expect(video.tagName).toBe("VIDEO");
		});

		it("videoUrl があるとき src 属性が正しく設定される", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			const video = screen.getByTestId("video-player");
			expect(video).toHaveAttribute("src", "/video/test-video.mp4");
		});

		it("videoUrl があるとき画像プレースホルダーは表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			expect(screen.queryByTestId("image-placeholder")).not.toBeInTheDocument();
		});
	});

	describe("画像表示", () => {
		it("imageUrl があり videoUrl がないとき <img> を表示する", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("question-image");
			expect(img).toBeInTheDocument();
			expect(img.tagName).toBe("IMG");
		});

		it("imageUrl の <img> は正しい src 属性を持つ", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("question-image");
			expect(img).toHaveAttribute("src", "/images/tora.jpg");
		});

		it("imageUrl の <img> は alt 属性に questionWord を持つ", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("question-image");
			expect(img).toHaveAttribute("alt", "とら");
		});

		it("imageUrl があるとき <video> は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
		});

		it("imageUrl があるとき画像プレースホルダーは表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			expect(screen.queryByTestId("image-placeholder")).not.toBeInTheDocument();
		});
	});

	describe("画像プレースホルダー表示", () => {
		it("videoUrl も imageUrl もないとき画像プレースホルダーを表示する", () => {
			renderWithProviders(<QuizCard question={questionWithNoMedia} />);

			expect(screen.getByTestId("image-placeholder")).toBeInTheDocument();
		});

		it("videoUrl も imageUrl もないとき <video> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithNoMedia} />);

			expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
		});

		it("videoUrl も imageUrl もないとき <img> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithNoMedia} />);

			expect(screen.queryByTestId("question-image")).not.toBeInTheDocument();
		});
	});

	describe("問題文表示", () => {
		it("questionWord がカードタイトルに表示される", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			expect(screen.getByText(/あたま/)).toBeInTheDocument();
		});

		it("すべての選択肢テキストが表示される", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			// getAllByText で複数マッチを許容しつつ存在確認
			expect(screen.getAllByText("からだ").length).toBeGreaterThan(0);
			expect(screen.getAllByText("ながら").length).toBeGreaterThan(0);
		});
	});

	describe("解答ボタン", () => {
		it("初期状態では「解答する」ボタンが無効化されている", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			// 選択肢を何も選んでいないのでボタンは disabled
			const button = screen.getByRole("button", { name: "解答する" });
			expect(button).toBeDisabled();
		});
	});
});
