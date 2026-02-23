import type { QuizFull } from "../../domain/entities/quiz"

export const quizzes: QuizFull[] = [
	{
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
	},
	{
		id: "q2",
		questionWord: "くるま",
		questionVowels: "ううあ",
		imageKey: "kuruma",
		explanation:
			"「くるま」の母音は「ううあ」。同じ母音パターンの「つくば」が正解。",
		choices: [
			{ id: "q2-c1", text: "つくば", vowels: "ううあ", isCorrect: true },
			{ id: "q2-c2", text: "さくら", vowels: "あうあ", isCorrect: false },
			{ id: "q2-c3", text: "みどり", vowels: "いおい", isCorrect: false },
			{ id: "q2-c4", text: "かばん", vowels: "ああん", isCorrect: false },
		],
	},
	{
		id: "q3",
		questionWord: "ひかり",
		questionVowels: "いあい",
		imageKey: "hikari",
		explanation:
			"「ひかり」の母音は「いあい」。同じ母音パターンの「みなみ」が正解。",
		choices: [
			{ id: "q3-c1", text: "みなみ", vowels: "いあい", isCorrect: true },
			{ id: "q3-c2", text: "あさひ", vowels: "ああい", isCorrect: false },
			{ id: "q3-c3", text: "いのち", vowels: "いおい", isCorrect: false },
			{ id: "q3-c4", text: "きもち", vowels: "いおい", isCorrect: false },
		],
	},
	{
		id: "q4",
		questionWord: "なみだ",
		questionVowels: "あいあ",
		imageKey: "namida",
		explanation:
			"「なみだ」の母音は「あいあ」。同じ母音パターンの「かみな（り）」が正解。",
		choices: [
			{ id: "q4-c1", text: "かみな（り）", vowels: "あいあ", isCorrect: true },
			{ id: "q4-c2", text: "おもて", vowels: "おおえ", isCorrect: false },
			{ id: "q4-c3", text: "ゆめじ", vowels: "うえい", isCorrect: false },
			{ id: "q4-c4", text: "はなび", vowels: "あああ", isCorrect: false },
		],
	},
	{
		id: "q5",
		questionWord: "そら",
		questionVowels: "おあ",
		imageKey: "sora",
		explanation:
			"「そら」の母音は「おあ」。同じ母音パターンの「こま」が正解。",
		choices: [
			{ id: "q5-c1", text: "こま", vowels: "おあ", isCorrect: true },
			{ id: "q5-c2", text: "もり", vowels: "おい", isCorrect: false },
			{ id: "q5-c3", text: "かぜ", vowels: "あえ", isCorrect: false },
			{ id: "q5-c4", text: "つき", vowels: "うい", isCorrect: false },
		],
	},
]
