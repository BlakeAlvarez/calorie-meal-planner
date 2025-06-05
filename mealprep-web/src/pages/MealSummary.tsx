// displays a printable summary of the meal plan
// shows overview, ingredient breakdown, and per-person calorie totals

import {useMealStore} from "@/stores/mealStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {Button} from "@/components/ui/button";
import {formatKcal, formatGrams} from "@/utils/format";
import {Link} from "react-router-dom";

export default function MealSummaryPage() {
	const foods = useMealStore((s) => s.foods);
	const plans = useIngredientPlanStore((s) => s.plans);
	const people = usePeopleStore((s) => s.people);

	// total number of meals requested across all people
	const totalMeals = people.reduce((sum, p) => sum + p.meals, 0);

	// map of foodId -> plan for quick lookup
	const planMap = Object.fromEntries(plans.map((p) => [p.foodId, p]));

	// resolve plan values into ingredient list with grams or units
	const ingredients = foods.flatMap((food) => {
		const plan = planMap[food.fdcId];
		if (!plan) return [];

		const isUnitBased = food.isUnitBased;
		const approxUnits = isUnitBased ? plan.value : null;

		return [
			{
				name: food.description,
				grams: plan.grams,
				kcal: plan.kcal,
				unitLabel: food.unitLabel,
				approxUnits,
			},
		];
	});

	const totalPlannedKcal = plans.reduce((sum, p) => sum + p.kcal, 0);
	const totalRequestedKcal = people.reduce(
		(sum, p) => sum + p.targetCalories * p.meals,
		0,
	);

	// calculate actual kcal allocation per person based on ratios
	const peopleWithActuals = people.map((p) => {
		const requested = p.targetCalories * p.meals;
		const ratio = requested / totalRequestedKcal;
		const actualTotal = ratio * totalPlannedKcal;
		return {
			...p,
			actualTotalCalories: actualTotal,
			actualKcalPerMeal: actualTotal / p.meals,
		};
	});

	return (
		<div className="max-w-4xl mx-auto p-6 print:p-4 print:bg-white print:text-black space-y-8">
			<header className="flex justify-between items-center print:hidden">
				<h1 className="text-3xl font-bold">📄 Meal Plan Summary</h1>
				<div className="flex gap-2">
					<Link to="/plan">
						<Button variant="outline">← Return to Plan</Button>
					</Link>
					<Button onClick={() => window.print()}>🖨️ Print</Button>
				</div>
			</header>

			{/* general meal plan overview */}
			<section className="space-y-1">
				<h2 className="text-xl font-semibold">Overview</h2>
				<p>👥 {people.length} people</p>
				<p>🍽️ {totalMeals} meals</p>
				<p>🔥 {formatKcal(totalPlannedKcal)} total calories</p>
			</section>

			<hr className="border-t print:hidden" />

			{/* list of ingredients with resolved grams or units */}
			<section className="mt-4">
				<h2 className="text-xl font-semibold mb-2">🧾 Ingredients</h2>
				<ul className="space-y-1">
					{ingredients.map((item, idx) => (
						<li key={idx} className="border p-2 rounded-md">
							{item.name}:{" "}
							<strong>
								{item.approxUnits
									? `~${Math.round(item.approxUnits)} ${item.unitLabel?.toLowerCase()}${Math.round(item.approxUnits) !== 1 ? "s" : ""}`
									: formatGrams(item.grams)}
							</strong>{" "}
							— {formatKcal(item.kcal)}
						</li>
					))}
				</ul>
			</section>

			{/* person-level actual kcal breakdown */}
			<section>
				<h2 className="text-xl font-semibold mb-2">
					📊 Per-Person Breakdown
				</h2>
				<table className="w-full text-left border">
					<thead className="bg-muted">
						<tr className="border-b">
							<th className="p-2">Person</th>
							<th className="p-2">Meals</th>
							<th className="p-2">Kcal/Meal</th>
							<th className="p-2">Total Kcal</th>
						</tr>
					</thead>
					<tbody>
						{peopleWithActuals.map((p) => (
							<tr key={p.id} className="border-b">
								<td className="p-2">{p.name}</td>
								<td className="p-2">{p.meals}</td>
								<td className="p-2">
									{formatKcal(p.actualKcalPerMeal)}
								</td>
								<td className="p-2">
									{formatKcal(p.actualTotalCalories)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	);
}
