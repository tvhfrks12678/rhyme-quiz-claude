import type { QuizFull, QuizResult } from "../entities/quiz"

const VOWEL_MAP: Record<string, string> = {
	// あ段
	あ: "あ",
	か: "あ",
	さ: "あ",
	た: "あ",
	な: "あ",
	は: "あ",
	ま: "あ",
	や: "あ",
	ら: "あ",
	わ: "あ",
	が: "あ",
	ざ: "あ",
	だ: "あ",
	ば: "あ",
	ぱ: "あ",
	// い段
	い: "い",
	き: "い",
	し: "い",
	ち: "い",
	に: "い",
	ひ: "い",
	み: "い",
	り: "い",
	ぎ: "い",
	じ: "い",
	ぢ: "い",
	び: "い",
	ぴ: "い",
	// う段
	う: "う",
	く: "う",
	す: "う",
	つ: "う",
	ぬ: "う",
	ふ: "う",
	む: "う",
	ゆ: "う",
	る: "う",
	ぐ: "う",
	ず: "う",
	づ: "う",
	ぶ: "う",
	ぷ: "う",
	// え段
	え: "え",
	け: "え",
	せ: "え",
	て: "え",
	ね: "え",
	へ: "え",
	め: "え",
	れ: "え",
	げ: "え",
	ぜ: "え",
	で: "え",
	べ: "え",
	ぺ: "え",
	// お段
	お: "お",
	こ: "お",
	そ: "お",
	と: "お",
	の: "お",
	ほ: "お",
	も: "お",
	よ: "お",
	ろ: "お",
	を: "お",
	ご: "お",
	ぞ: "お",
	ど: "お",
	ぼ: "お",
	ぽ: "お",
	// ん
	ん: "ん",
}

export function extractVowels(text: string): string {
	return [...text]
		.map((char) => VOWEL_MAP[char] ?? "")
		.join("")
}

export function judgeAnswer(quiz: QuizFull, selectedIds: string[]): QuizResult {
	const correctChoiceIds = quiz.choices
		.filter((c) => c.isCorrect)
		.map((c) => c.id)

	const correctSet = new Set(correctChoiceIds)

	const isCorrect =
		selectedIds.length === correctChoiceIds.length &&
		selectedIds.every((id) => correctSet.has(id))

	return {
		isCorrect,
		questionVowels: quiz.questionVowels,
		correctChoiceIds,
		explanation: quiz.explanation,
		choiceDetails: quiz.choices.map((c) => ({
			id: c.id,
			text: c.text,
			vowels: c.vowels,
			isCorrect: correctSet.has(c.id),
		})),
	}
}
