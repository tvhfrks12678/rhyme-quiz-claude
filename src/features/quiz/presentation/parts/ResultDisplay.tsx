import { CheckCircle, XCircle } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";

import type { SubmitResponse } from "../../contracts/quiz";

interface ResultDisplayProps {
	result: SubmitResponse;
	questionWord: string;
	onNext: () => void;
}

export function ResultDisplay({
	result,
	questionWord,
	onNext,
}: ResultDisplayProps) {
	return (
		<div className="space-y-4">
			<div
				className={`p-4 rounded-lg text-center ${
					result.isCorrect
						? "bg-green-50 text-green-700 border border-green-200"
						: "bg-red-50 text-red-700 border border-red-200"
				}`}
			>
				{result.isCorrect ? (
					<div className="flex items-center justify-center gap-2 text-xl font-bold">
						<CheckCircle className="w-6 h-6" />
						正解！
					</div>
				) : (
					<div className="flex items-center justify-center gap-2 text-xl font-bold">
						<XCircle className="w-6 h-6" />
						不正解...
					</div>
				)}
			</div>

			<div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
				問題「{questionWord}」→ 母音:{" "}
				<span className="font-bold text-purple-600">
					{result.questionVowels}
				</span>
			</div>

			<div className="space-y-2">
				{result.choiceDetails.map((choice) => (
					<div
						key={choice.id}
						className={`flex items-center gap-2 p-2 rounded-lg ${
							choice.isCorrect ? "bg-green-50" : "bg-red-50"
						}`}
					>
						{choice.isCorrect ? (
							<CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
						) : (
							<XCircle className="w-4 h-4 text-red-500 shrink-0" />
						)}
						<span className="text-sm flex-1">
							{choice.text} → 母音:{" "}
							<span
								className={`font-bold ${
									choice.isCorrect ? "text-green-600" : "text-red-500"
								}`}
							>
								{choice.vowels}
							</span>
						</span>
						{choice.isCorrect && (
							<Badge variant="default" className="ml-auto text-xs shrink-0">
								正解
							</Badge>
						)}
					</div>
				))}
			</div>

			<p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
				{result.explanation}
			</p>

			<Button className="w-full" onClick={onNext}>
				次の問題へ
			</Button>
		</div>
	);
}
