import {useState} from "react";
import {ChevronDown} from "lucide-react";
import {usePeopleStore} from "@/stores/peopleStore";

export function CalorieBreakdown() {
	const people = usePeopleStore((s) => s.people);
	const [showDetails, setShowDetails] = useState(false);

	const total = people.reduce(
		(sum, p) => sum + p.targetCalories * p.meals,
		0,
	);

	return (
		<div className="text-sm text-muted-foreground">
			<button
				onClick={() => setShowDetails((s) => !s)}
				className="flex items-center gap-1 underline text-sm hover:text-primary"
			>
				<ChevronDown
					className={`h-4 w-4 transition-transform duration-300 ${
						showDetails ? "rotate-180" : ""
					}`}
				/>
				How is this computed?
			</button>

			{showDetails && (
				<div className="mt-2 space-y-1">
					{people.map((p) => (
						<p key={p.id}>
							🧍 {p.name}: {p.targetCalories} × {p.meals} ={" "}
							<strong>{p.targetCalories * p.meals} kcal</strong>
						</p>
					))}
					<hr className="my-1 border-muted" />
					<p>
						<strong>Total Target: {total} kcal</strong>
					</p>
				</div>
			)}
		</div>
	);
}
