import type { QuizFull } from "../../domain/entities/quiz"

export const quizzes: QuizFull[] = [
	// Q1: 2文字・2択（初級）
	{
		id: "q1",
		questionWord: "とら",
		questionVowels: "おあ",
		imageKey: "tora",
		explanation: "「とら」の母音は「おあ」。同じ母音パターンの「おか」が正解。",
		choices: [
			{ id: "q1-c1", text: "おか", vowels: "おあ", isCorrect: true },
			{ id: "q1-c2", text: "ぶた", vowels: "うあ", isCorrect: false },
		],
	},
	// Q2: 3文字・3択
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
		],
	},
	// Q3: 4文字・4択
	{
		id: "q3",
		questionWord: "うみかぜ",
		questionVowels: "ういあえ",
		imageKey: "umikaze",
		explanation:
			"「うみかぜ」の母音は「ういあえ」。同じ母音パターンの「つきかげ」が正解。",
		choices: [
			{ id: "q3-c1", text: "つきかげ", vowels: "ういあえ", isCorrect: true },
			{ id: "q3-c2", text: "はなびら", vowels: "ああいあ", isCorrect: false },
			{ id: "q3-c3", text: "ひまわり", vowels: "いああい", isCorrect: false },
			{ id: "q3-c4", text: "すずらん", vowels: "ううあん", isCorrect: false },
		],
	},
	// Q4: 6文字・8択
	{
		id: "q4",
		questionWord: "むかしばなし",
		questionVowels: "うあいああい",
		imageKey: "mukashibanashi",
		explanation:
			"「むかしばなし」の母音は「うあいああい」。同じ母音パターンの「つかいはたし」が正解。",
		choices: [
			{ id: "q4-c1", text: "つかいはたし", vowels: "うあいああい", isCorrect: true },
			{ id: "q4-c2", text: "まつりばやし", vowels: "あういああい", isCorrect: false },
			{ id: "q4-c3", text: "なつのおもい", vowels: "あうおおおい", isCorrect: false },
			{ id: "q4-c4", text: "そらとぶかぜ", vowels: "おあおうあえ", isCorrect: false },
			{ id: "q4-c5", text: "ゆうひのかぜ", vowels: "うういおあえ", isCorrect: false },
			{ id: "q4-c6", text: "きのこのかさ", vowels: "いおおおああ", isCorrect: false },
			{ id: "q4-c7", text: "おにのぱんつ", vowels: "おいおあんう", isCorrect: false },
			{ id: "q4-c8", text: "たのしいうた", vowels: "あおいいうあ", isCorrect: false },
		],
	},
	// Q5: 10文字・15択（上級）
	{
		id: "q5",
		questionWord: "むかしむかしのはなし",
		questionVowels: "うあいうあいおああい",
		imageKey: "mukashimukashinohanashi",
		explanation:
			"「むかしむかしのはなし」の母音は「うあいうあいおああい」。同じ母音パターンの「ふかいふかいのはなし」が正解。",
		choices: [
			{ id: "q5-c1", text: "ふかいふかいのはなし", vowels: "うあいうあいおああい", isCorrect: true },
			{ id: "q5-c2", text: "いつもそばにいるよね", vowels: "いうおおあいいうおえ", isCorrect: false },
			{ id: "q5-c3", text: "このよるをこえていけ", vowels: "おおおうおおええいえ", isCorrect: false },
			{ id: "q5-c4", text: "あかいめがさすほどに", vowels: "ああいえああうおおい", isCorrect: false },
			{ id: "q5-c5", text: "さいごまでそこにいろ", vowels: "あいおあえおおいいお", isCorrect: false },
			{ id: "q5-c6", text: "はなれてもそばにいる", vowels: "ああええおおあいいう", isCorrect: false },
			{ id: "q5-c7", text: "うたのそらをとびかけ", vowels: "うあおおあおおいあえ", isCorrect: false },
			{ id: "q5-c8", text: "きみのこえがきこえる", vowels: "いいおおえあいおえう", isCorrect: false },
			{ id: "q5-c9", text: "なつのひかりをあびて", vowels: "あうおいあいおあいえ", isCorrect: false },
			{ id: "q5-c10", text: "ゆめのなかでふわふわ", vowels: "うえおああえうあうあ", isCorrect: false },
			{ id: "q5-c11", text: "そらのかなたのほしよ", vowels: "おあおあああおおいお", isCorrect: false },
			{ id: "q5-c12", text: "まいにちがんばるきみ", vowels: "あいいいあんあういい", isCorrect: false },
			{ id: "q5-c13", text: "ぼくらのそらをとべよ", vowels: "おうあおおあおおえお", isCorrect: false },
			{ id: "q5-c14", text: "うみへとびこんだなつ", vowels: "ういえおいおんああう", isCorrect: false },
			{ id: "q5-c15", text: "おれたちはとんでいく", vowels: "おえあいあおんえいう", isCorrect: false },
		],
	},
]
