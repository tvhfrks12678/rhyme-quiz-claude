import { Checkbox } from "#/components/ui/checkbox";

import type { Choice } from "../../contracts/quiz";
import { useQuizStore } from "../hooks/useQuiz";

interface ChoiceListProps {
	choices: Choice[];
}

export function ChoiceList({ choices }: ChoiceListProps) {
	const selectedChoiceIds = useQuizStore((s) => s.selectedChoiceIds);
	const toggleChoice = useQuizStore((s) => s.toggleChoice);

	return (
		<div className="space-y-3">
			{choices.map((choice) => (
				<div
					key={choice.id}
					className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
				>
					<Checkbox
						id={choice.id}
						checked={selectedChoiceIds.includes(choice.id)}
						onCheckedChange={() => toggleChoice(choice.id)}
						onClick={(e) => e.stopPropagation()}
					/>
					<label
						htmlFor={choice.id}
						className="text-lg cursor-pointer select-none flex-1"
					>
						{choice.text}
					</label>
				</div>
			))}
		</div>
	);
}
