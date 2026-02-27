// @vitest-environment jsdom
/**
 * QuizCard コンポーネントテスト（React Testing Library）
 *
 * テスト対象: QuizCard コンポーネントの描画ロジック
 * - question.videoUrl がある → <video> を表示する
 * - question.imageUrl がある（videoUrl なし） → <img> を表示する
 * - question.imageUrl の読み込みに失敗する → 画像プレースホルダーを表示する
 * - question.videoUrl も imageUrl もない → 画像プレースホルダーを表示する
 *
 * React Testing Library（RTL）は「ユーザーが見る画面」に近い形でテストする。
 * 実際の DOM に描画して、要素の存在を確認する。
 *
 * // @vitest-environment jsdom
 * このコメントにより、このファイルだけ jsdom（ブラウザ環境エミュレーション）で実行される。
 * jsdom がないと document や window が存在せず React のレンダリングが動かない。
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

// テスト用の問題データ（imageUrl あり、videoUrl なし）
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

// テスト用の問題データ（imageUrl なし、videoUrl なし）
const questionWithoutMedia: QuizQuestion = {
	id: "q3",
	questionWord: "うみかぜ",
	imageKey: "",
	choices: [
		{ id: "c1", text: "つきかげ" },
		{ id: "c2", text: "くびかけ" },
	],
	total: 5,
	index: 2,
};

// テスト用の問題データ（verticalMarqueeMode あり）
const questionWithVerticalMarquee: QuizQuestion = {
	id: "q4",
	questionWord: "むかしばなし",
	imageKey: "mukashibanashi",
	verticalMarqueeMode: true,
	marqueeMode: true,
	choices: [
		{ id: "q4-c1", text: "つかいはたし" },
		{ id: "q4-c2", text: "ふかいはなし" },
	],
	total: 5,
	index: 3,
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

		it("videoUrl があるとき <img> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithVideo} />);

			expect(screen.queryByTestId("image-display")).not.toBeInTheDocument();
		});
	});

	describe("画像表示", () => {
		it("imageUrl があるとき <img> 要素を表示する", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("image-display");
			expect(img).toBeInTheDocument();
			expect(img.tagName).toBe("IMG");
		});

		it("imageUrl があるとき src 属性が正しく設定される", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("image-display");
			expect(img).toHaveAttribute("src", "/images/tora.jpg");
		});

		it("imageUrl があるとき alt 属性が questionWord に設定される", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("image-display");
			expect(img).toHaveAttribute("alt", "とら");
		});

		it("imageUrl があるとき画像プレースホルダーは表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			expect(screen.queryByTestId("image-placeholder")).not.toBeInTheDocument();
		});

		it("imageUrl があるとき <video> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
		});

		it("画像読み込みエラー時にプレースホルダーを表示する", () => {
			renderWithProviders(<QuizCard question={questionWithImage} />);

			const img = screen.getByTestId("image-display");
			// onError イベントを発火させて画像読み込み失敗をシミュレートする
			fireEvent.error(img);

			expect(screen.queryByTestId("image-display")).not.toBeInTheDocument();
			expect(screen.getByTestId("image-placeholder")).toBeInTheDocument();
		});
	});

	describe("画像プレースホルダー表示", () => {
		it("videoUrl も imageUrl もないとき画像プレースホルダーを表示する", () => {
			renderWithProviders(<QuizCard question={questionWithoutMedia} />);

			expect(screen.getByTestId("image-placeholder")).toBeInTheDocument();
		});

		it("videoUrl も imageUrl もないとき <video> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithoutMedia} />);

			expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
		});

		it("videoUrl も imageUrl もないとき <img> 要素は表示しない", () => {
			renderWithProviders(<QuizCard question={questionWithoutMedia} />);

			expect(screen.queryByTestId("image-display")).not.toBeInTheDocument();
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

	describe("縦スクロールローマ字表示（verticalMarqueeMode）", () => {
		it("verticalMarqueeMode があるとき縦ローマ字マーキーを表示する", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			expect(
				screen.getByTestId("romaji-vertical-marquee"),
			).toBeInTheDocument();
		});

		it("verticalMarqueeMode があるとき初期状態では横マーキーを表示しない", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			expect(
				screen.queryByTestId("romaji-marquee"),
			).not.toBeInTheDocument();
		});

		it("verticalMarqueeMode があるとき画像プレースホルダーを表示しない", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			expect(
				screen.queryByTestId("image-placeholder"),
			).not.toBeInTheDocument();
		});

		it("verticalMarqueeMode と marqueeMode 両方あるとき切り替えボタンが表示される", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			expect(
				screen.getByRole("button", { name: "ローマ字縦スクロール表示" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "ローマ字横スクロール表示" }),
			).toBeInTheDocument();
		});

		it("横ローマ字ボタンをクリックすると横マーキーに切り替わる", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			const horizontalButton = screen.getByRole("button", {
				name: "ローマ字横スクロール表示",
			});
			fireEvent.click(horizontalButton);

			expect(screen.getByTestId("romaji-marquee")).toBeInTheDocument();
			expect(
				screen.queryByTestId("romaji-vertical-marquee"),
			).not.toBeInTheDocument();
		});

		it("縦ローマ字ボタンをクリックすると縦マーキーに戻る", () => {
			renderWithProviders(
				<QuizCard question={questionWithVerticalMarquee} />,
			);

			fireEvent.click(
				screen.getByRole("button", { name: "ローマ字横スクロール表示" }),
			);
			fireEvent.click(
				screen.getByRole("button", { name: "ローマ字縦スクロール表示" }),
			);

			expect(
				screen.getByTestId("romaji-vertical-marquee"),
			).toBeInTheDocument();
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
