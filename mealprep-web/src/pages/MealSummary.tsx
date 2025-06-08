import {useLocation, useNavigate} from "react-router-dom";
import {usePeopleStore} from "@/stores/peopleStore";
import {useGroupStore} from "@/stores/groupStore";
import {useMealStore} from "@/stores/mealStore";
import {formatKcal, formatGrams} from "@/utils/format";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import {useState} from "react";
import {Input} from "@/components/ui/input";
import type {Group} from "@/types/group";

export default function MealSummary() {
	const location = useLocation();
	const fromCook = location.state?.fromCook ?? false;
	const navigate = useNavigate();

	const people = usePeopleStore((s) => s.people);
	const groups = useGroupStore((s) => s.groups);
	const foods = useMealStore((s) => s.foods);

	// total meals and calories
	const totalMeals = people.reduce((sum, p) => sum + (p.totalMeals ?? 1), 0);
	const totalRequestedKcal = people.reduce(
		(sum, p) => sum + (p.caloriesPerMeal ?? 0) * (p.totalMeals ?? 1),
		0,
	);

	// ingredients list (flattened, all foods actually used in any group)
	const ingredientList = groups
		.flatMap((group) =>
			group.ingredients.map((ing) => {
				const food = foods.find((f) => f.id === ing.foodId);
				if (!food) return null;
				return {
					group: group.name,
					name: food.description,
					amount: ing.amount,
					unit: ing.unit,
				};
			}),
		)
		.filter(Boolean);

	// per-person totals and actuals (could expand later)
	const personActuals = people.map((p) => {
		const fallbackKcal = (p.caloriesPerMeal ?? 0) * (p.totalMeals ?? 1);
		return {
			...p,
			actualKcal: fallbackKcal,
			actualKcalPerMeal: fallbackKcal / (p.totalMeals ?? 1),
		};
	});

	// cooked weight inputs (for display purposes, not interactive here)
	const getCookedWeight = (group: Group) => group.cookedWeightGrams ?? 0;

	// group kcal calculation
	function getGroupTotalKcal(group: Group) {
		return group.ingredients.reduce((sum, ing) => {
			const food = foods.find((f) => f.id === ing.foodId);
			const kcalPer100g = getEnergyKcal(food?.foodNutrients ?? []);
			return (
				sum +
				(ing.unit === "g"
					? Math.round((ing.amount * kcalPer100g) / 100)
					: 0)
			);
		}, 0);
	}

	// per-person gram/kcal distribution by group (if fromCook)
	function getMealDistribution(group: Group) {
		// total group kcal
		const groupKcal = getGroupTotalKcal(group);
		const cookedGrams = getCookedWeight(group);

		// only show table if cookedGrams > 0 and groupKcal > 0
		if (cookedGrams <= 0 || groupKcal <= 0) return null;

		// calculate each person's share of grams/kcal
		const totalRequestedGroupKcal = people.reduce(
			(sum, p) => sum + (p.caloriesPerMeal ?? 0) * (p.totalMeals ?? 1),
			0,
		);
		return people.map((person) => {
			// proportional allocation
			const personTotalKcal =
				(person.caloriesPerMeal ?? 0) * (person.totalMeals ?? 1);
			// for now, just even split by personTotalKcal ratio to total
			const personShare =
				totalRequestedGroupKcal > 0
					? personTotalKcal / totalRequestedGroupKcal
					: 1 / people.length;
			const gramsTotal = cookedGrams * personShare;
			const gramsPerMeal = gramsTotal / (person.totalMeals ?? 1);
			const kcalPerMeal =
				(groupKcal * personShare) / (person.totalMeals ?? 1);

			return {
				person,
				gramsPerMeal,
				gramsTotal,
				kcalPerMeal,
				kcalTotal: groupKcal * personShare,
			};
		});
	}

	return (
		<div className="meal-summary-step p-6 max-w-3xl mx-auto space-y-8">
			<h1 className="text-2xl font-bold mb-6">Meal Summary</h1>

			{/* Overview */}
			<section className="space-y-1">
				<h2 className="text-xl font-semibold">Overview</h2>
				<p>👥 {people.length} people</p>
				<p>🍽️ {totalMeals} meals</p>
				<p>🔥 {formatKcal(totalRequestedKcal)} total target calories</p>
			</section>

			{/* ingredient list */}
			<section className="mt-4">
				<h2 className="text-xl font-semibold mb-2">🧾 Ingredients</h2>
				<ul className="space-y-1">
					{ingredientList.map((item, idx) => (
						<li key={idx} className="border p-2 rounded-md">
							<span className="font-medium">{item.name}</span>
							{item.group && (
								<span className="ml-2 text-xs text-muted-foreground">
									({item.group})
								</span>
							)}
							: <strong>{formatGrams(item.amount)}</strong>
						</li>
					))}
				</ul>
			</section>

			{/* person actuals */}
			<section>
				<h2 className="text-xl font-semibold mb-2">
					📊 Per-Person Breakdown
				</h2>
				<div className="overflow-x-auto">
					<table className="min-w-full text-xs border mb-4">
						<thead>
							<tr>
								<th className="p-2">Person</th>
								<th className="p-2">Total Meals</th>
								<th className="p-2">Calories/Meal</th>
								<th className="p-2">Total Calories</th>
							</tr>
						</thead>
						<tbody>
							{personActuals.map((p) => (
								<tr key={p.id}>
									<td className="p-2">{p.name}</td>
									<td className="p-2">{p.totalMeals ?? 1}</td>
									<td className="p-2">
										{formatKcal(p.caloriesPerMeal ?? 0)}
									</td>
									<td className="p-2">
										{formatKcal(
											(p.caloriesPerMeal ?? 0) *
												(p.totalMeals ?? 1),
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* per-group ingredient and per-person meal distribution (only if fromCook) */}
			{fromCook && (
				<section className="space-y-8">
					{groups.map((group) => (
						<div key={group.id} className="mb-6">
							<div className="flex items-center gap-2 mb-2">
								<span className="font-bold text-lg">
									{group.name}
								</span>
								<span className="text-xs text-muted-foreground">
									(Cooked Weight:{" "}
									{formatGrams(group.cookedWeightGrams ?? 0)})
								</span>
							</div>
							{/* table for per-person distribution */}
							{getMealDistribution(group) && (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Person</TableHead>
											<TableHead>
												Grams / Meal × Meals
											</TableHead>
											<TableHead>
												Calories / Meal
											</TableHead>
											<TableHead>Total Grams</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{getMealDistribution(group)?.map(
											(row) => (
												<TableRow key={row.person.id}>
													<TableCell>
														{row.person.name}
													</TableCell>
													<TableCell>
														{formatGrams(
															row.gramsPerMeal,
														)}{" "}
														×{" "}
														{row.person.totalMeals}
													</TableCell>
													<TableCell>
														{formatKcal(
															row.kcalPerMeal,
														)}
													</TableCell>
													<TableCell>
														{formatGrams(
															row.gramsTotal,
														)}
													</TableCell>
												</TableRow>
											),
										)}
									</TableBody>
								</Table>
							)}
						</div>
					))}
				</section>
			)}

			<div className="flex gap-2 mt-6 print:hidden">
				<Button
					variant="secondary"
					onClick={() =>
						navigate(fromCook ? "/cook-distribute" : "/plan")
					}
				>
					← Back
				</Button>
				<Button onClick={() => window.print()}>🖨️ Print</Button>
				<Button variant="outline" onClick={() => navigate("/")}>
					Return to Main Menu
				</Button>
			</div>
		</div>
	);
}
