export interface ChoiceFull {
	id: string;
	text: string;
	vowels: string;
	isCorrect: boolean;
}

export interface QuizFull {
	id: string;
	questionWord: string;
	questionVowels: string;
	imageKey: string;
	videoKey?: string;
	marqueeMode?: boolean;
	explanation: string;
	choices: ChoiceFull[];
}

export interface ChoiceResult {
	id: string;
	text: string;
	vowels: string;
	isCorrect: boolean;
}

export interface QuizResult {
	isCorrect: boolean;
	questionVowels: string;
	correctChoiceIds: string[];
	explanation: string;
	choiceDetails: ChoiceResult[];
}
