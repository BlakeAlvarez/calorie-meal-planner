// displays a printable summary of the meal plan
// shows overview, ingredient breakdown, and per-person calorie totals

import {useMealStore} from "@/stores/mealStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {Button} from "@/components/ui/button";
import {formatKcal, formatGrams} from "@/utils/format";
import {useNavigate} from "react-router-dom";
import {useLocation} from "react-router-dom";
import {useGroupStore} from "@/stores/groupStore";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {calculateAdjustedMealDistribution} from "@/lib/calculations";
import type {IngredientGroup} from "@/stores/groupStore";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import {useState, useEffect} from "react";
import {toast} from "sonner";
import {getResolvedPlans} from "@/lib/getResolvedPlans";
import {SaveMealModal} from "@/components/SaveMealModal";
import {SaveMealButton} from "@/components/SaveMealButton";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function MealSummaryPage() {
	const foods = useMealStore((s) => s.foods);
	const plans = useIngredientPlanStore((s) => s.plans);
	const people = usePeopleStore((s) => s.people);
	const location = useLocation();
	const fromCook = location.state?.fromCook ?? false;
	const groups = useGroupStore((s) => s.groups);
	const setCookedWeight = useGroupStore((s) => s.setCookedWeight);
	const navigate = useNavigate();
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [hasSaved, setHasSaved] = useState(false);

	// useEffect(() => {
	// 	if (fromCook) {
	// 		toast("Would you like to save this meal?", {
	// 			id: "save-toast",
	// 			action: {
	// 				label: "Save",
	// 				onClick: () => setShowSaveModal(true),
	// 			},
	// 			duration: Infinity,
	// 		});
	// 	}
	// }, [fromCook]);

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

	// sync plans into groups just-in-time
	const resolvedGroups = groups.map((group) => ({
		...group,
		ingredients: group.ingredients.map((ing) => {
			const plan = plans.find((p) => p.foodId === ing.foodId);
			return {
				...ing,
				grams: plan?.grams ?? 0,
				kcal: plan?.kcal ?? 0,
				percent: plan?.percent ?? 0,
				mode: plan?.mode ?? "grams",
				value: plan?.value ?? 0,
			};
		}),
	}));

	// sum raw weights for a group by adding each ingredient's grams
	function getRawWeight(group: IngredientGroup): number {
		return group.ingredients.reduce((sum, ing) => sum + ing.grams, 0);
	}

	// determine ungrouped foods (not assigned to any group)
	const groupedFoodIds = groups.flatMap((g) =>
		g.ingredients.map((i) => i.foodId),
	);
	const ungroupedFoods = foods.filter(
		(f) => !groupedFoodIds.includes(f.fdcId),
	);
	const [ungroupedCookedWeights, setUngroupedCookedWeights] = useState<
		Record<number, number>
	>({});

	// helpers to get kcal per 100g or per unit from USDA data
	const getKcalPer100g = (fdcId: number): number => {
		const food = foods.find((f) => f.fdcId === fdcId);
		return food ? getEnergyKcal(food.foodNutrients) : 0;
	};

	const getKcalPerUnit = (fdcId: number): number => {
		const food = foods.find((f) => f.fdcId === fdcId);
		if (!food || !food.isUnitBased) return 0;
		const kcalPer100g = getEnergyKcal(food.foodNutrients);
		const gramsPerUnit = food.gramsPerUnit ?? 100;
		return Math.round((gramsPerUnit / 100) * kcalPer100g * 10) / 10;
	};

	// calculates the total meal calories based on all food plan entries
	const TOTAL_TARGET_CALORIES = plans.reduce(
		(sum, plan) => sum + (plan.kcal ?? 0),
		0,
	);

	const handleSave = async (
		name: string,
		createdBy: string,
		notes: string,
	) => {
		const plans = useIngredientPlanStore.getState().plans;

		// recalculate kcal per food
		const resolvedPlans = getResolvedPlans(plans, foods, people);

		const totalCalories = resolvedPlans.reduce(
			(sum, p) => sum + (p.kcal ?? 0),
			0,
		);

		const mergedGroups = groups.map((group) => {
			const enrichedIngredients = group.ingredients.map((ingredient) => {
				const plan = resolvedPlans.find(
					(p) => p.foodId === ingredient.foodId,
				);
				return {
					...ingredient,
					mode: plan?.mode ?? "grams",
					value: plan?.value ?? 0,
					grams: plan?.grams ?? 0,
					kcal: plan?.kcal ?? 0,
					percent:
						plan?.mode === "percent"
							? plan.value
							: plan?.kcal && totalCalories > 0
								? Math.round(
										(plan.kcal / totalCalories) * 1000,
									) / 10
								: 0,
				};
			});

			return {
				...group,
				ingredients: enrichedIngredients,
				totalCalories: enrichedIngredients.reduce(
					(sum, ing) => sum + (ing.kcal ?? 0),
					0,
				),
			};
		});

		const peopleSummary = people.map((p) => ({
			meals: p.meals,
			targetCalories: p.targetCalories,
		}));

		const totalMeals = people.reduce((sum, p) => sum + p.meals, 0);

		const payload = {
			Name: name,
			FoodsJson: JSON.stringify(foods, null, 2),
			GroupsJson: JSON.stringify(mergedGroups, null, 2),
			CreatedBy: createdBy,
			CreatedAt: new Date().toISOString(),
			IsShared: true,
			Notes: notes,
			PeopleJson: JSON.stringify(peopleSummary, null, 2),
			PeopleCount: people.length,
			TotalMeals: totalMeals,
			TotalCalories: totalCalories,
		};

		const res = await fetch(`${API_BASE}/meals`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(payload),
		});

		const text = await res.text();
		try {
			const data = JSON.parse(text);
			toast.success("Meal saved!", {
				description: `Share link: /shared/meal/${data.id}`,
				action: {
					label: "Copy Link",
					onClick: () => {
						navigator.clipboard.writeText(
							`/shared/meal/${data.id}`,
						);
					},
				},
			});
		} catch (e) {
			console.error("Failed to parse JSON:", e);
			toast.error("Something went wrong saving the meal.");
		}
	};

	const handleReturn = () => {
		if (fromCook && !hasSaved) {
			const confirmed = window.confirm(
				"You haven't saved this meal. Are you sure you want to return to the main menu?",
			);
			if (!confirmed) return;
		}

		toast.dismiss("save-toast");
		navigate("/");
	};

	console.log(plans)

	// const plannedPerPerson = people.map((person) => {
	// 	const ingredientsForPerson = plans
	// 		.filter((plan) => plan.personId === person.id)
	// 		.map((plan) => {
	// 			const food = foods.find((f) => f.fdcId === plan.foodId);
	// 			const kcal = plan.kcal ?? 0;
	// 			const grams = plan.grams ?? 0;
	// 			return {
	// 				name: food?.description ?? "Unknown",
	// 				kcalPerMeal: kcal / person.meals,
	// 				gramsPerMeal: grams / person.meals,
	// 			};
	// 		});

	// 	return {
	// 		...person,
	// 		ingredients: ingredientsForPerson,
	// 	};
	// });


	return (
		<div className="max-w-4xl mx-auto p-6 print:p-4 print:bg-white print:text-black space-y-8">
			<header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
				<h1 className="text-3xl font-bold text-center md:text-left">
					📄 Meal Plan Summary
				</h1>

				<div className="flex flex-wrap justify-center md:justify-end gap-2">
					<Button
						variant="secondary"
						onClick={() =>
							navigate(fromCook ? "/cook-distribute" : "/plan")
						}
					>
						← Back
					</Button>

					<Button onClick={() => window.print()}>🖨️ Print</Button>

					{fromCook && (
						<SaveMealButton onSaved={() => setHasSaved(true)} />
					)}

					<Button variant="outline" onClick={handleReturn}>
						Return to Main Menu
					</Button>
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

			{/* group handling */}
			{fromCook &&
				resolvedGroups.map((group) => {
					if (!group.ingredients.length) return null;
					const cookedGrams = group.cookedWeightGrams ?? 0;

					// total kcal in group from resolved plans
					const groupKcal = group.ingredients.reduce(
						(sum, ing) => sum + (ing.kcal ?? 0),
						0,
					);
					if (groupKcal === 0) return null;
					// compute per-person kcal and gram portions for this group
					const results = calculateAdjustedMealDistribution({
						people: people.map((p) => ({
							id: p.id,
							name: p.name,
							meals: p.meals,
							targetCaloriesPerMeal: p.targetCalories,
						})),
						totalAvailableKcal: groupKcal,
						totalCookedGrams: cookedGrams,
					});

					return (
						<div className="flex justify-center" key={group.id}>
							<div className="w-full max-w-2xl border p-4 rounded space-y-2">
								<h2 className="font-semibold text-lg">
									{group.name} (Group {group.displayId})
								</h2>
								<p className="text-sm text-muted-foreground">
									Total Calories: {groupKcal.toFixed(1)} kcal
								</p>
								<p className="text-sm text-muted-foreground">
									Initial Weight:{" "}
									{getRawWeight(group).toFixed(1)} g
								</p>
								<div className="flex items-center gap-4">
									<Label htmlFor={`cooked-${group.id}`}>
										Cooked Weight (g)
									</Label>
									<Input
										id={`cooked-${group.id}`}
										type="number"
										className="cursor-default w-32"
										value={group.cookedWeightGrams ?? ""}
										disabled
										readOnly
										onChange={(e) =>
											setCookedWeight(
												group.id,
												parseFloat(e.target.value) || 0,
											)
										}
									/>
								</div>

								{/* table of kcal/grams per person */}
								{cookedGrams > 0 && (
									<Table className="mt-2">
										<TableHeader>
											<TableRow>
												<TableHead className="w-1/3">
													Person
												</TableHead>
												<TableHead className="w-1/3">
													Grams / Meal × Meals
												</TableHead>
												<TableHead className="w-1/3 text-right">
													Calories / Meal
												</TableHead>
												<TableHead className="w-1/3 text-right">
													Total Grams
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{results.map((res) => {
												const person = people.find(
													(p) =>
														p.id === res.personId,
												);
												return (
													<TableRow
														key={res.personId}
													>
														<TableCell>
															{res.name}
														</TableCell>
														<TableCell>
															{res.adjustedGramsPerMeal.toFixed(
																1,
															)}{" "}
															g / meal ×{" "}
															{person?.meals}{" "}
															meals
														</TableCell>
														<TableCell className="text-right text-muted-foreground">
															{res.adjustedKcalPerMeal.toFixed(
																1,
															)}{" "}
															kcal / meal
														</TableCell>
														<TableCell className="text-right text-muted-foreground">
															{res.adjustedGramsTotal.toFixed(
																1,
															)}{" "}
															g total
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								)}
							</div>
						</div>
					);
				})}

			{/* ungrouped foods */}
			{fromCook && ungroupedFoods.length > 0 && (
				<div className="space-y-6 pt-2">
					<h2 className="text-lg font-semibold text-center">
						Ungrouped Foods
					</h2>

					{ungroupedFoods.map((food) => {
						const plan = plans.find((p) => p.foodId === food.fdcId);
						if (!plan) return null;

						const kcalPer100g = getKcalPer100g(food.fdcId);
						const kcalPerUnit = getKcalPerUnit(food.fdcId);
						const isUnit = !!food.unitLabel;

						const rawKcal =
							plan.kcal ??
							(isUnit
								? plan.value * kcalPerUnit
								: plan.mode === "calories"
									? plan.value
									: plan.mode === "grams"
										? (plan.value / 100) * kcalPer100g
										: (plan.value / 100) *
											TOTAL_TARGET_CALORIES);

						const kcal = Math.round(rawKcal * 10) / 10;
						const cookedGrams = food.cookedWeightGrams ?? 0;
						const rawGrams = food.rawWeightGrams ?? 0;

						if (kcal === 0) return null;

						const adjusted = calculateAdjustedMealDistribution({
							people: people.map((p) => ({
								id: p.id,
								name: p.name,
								meals: p.meals,
								targetCaloriesPerMeal: p.targetCalories,
							})),
							totalAvailableKcal: kcal,
							totalCookedGrams: cookedGrams,
						});

						return (
							<div
								className="flex justify-center"
								key={food.fdcId}
							>
								<div className="w-full max-w-2xl border p-4 rounded space-y-2">
									<h3 className="font-semibold text-base">
										{food.description}
									</h3>

									{!food.unitLabel && (
										<p className="text-sm text-muted-foreground">
											Initial Weight:{" "}
											{rawGrams.toFixed(1)} g (
											{(rawGrams / 453.592).toFixed(2)}{" "}
											lb)
										</p>
									)}
									<div className="flex items-center gap-4">
										<Label
											htmlFor={`ungrouped-${food.fdcId}`}
										>
											Cooked Weight (g)
										</Label>
										<Input
											id={`ungrouped-${food.fdcId}`}
											type="number"
											className="cursor-default w-32"
											value={
												ungroupedCookedWeights[
													food.fdcId
												] ??
												food.cookedWeightGrams ??
												""
											}
											disabled
											readOnly
											onChange={(e) => {
												const value =
													parseFloat(
														e.target.value,
													) || 0;
												setUngroupedCookedWeights(
													(prev) => ({
														...prev,
														[food.fdcId]: value,
													}),
												);
												useMealStore
													.getState()
													.updateFood(food.fdcId, {
														cookedWeightGrams:
															value,
													});
											}}
										/>
									</div>

									{/* table for ungrouped food distribution */}
									{cookedGrams > 0 && (
										<>
											<p className="text-sm text-muted-foreground">
												Total Calories:{" "}
												{kcal.toFixed(1)} kcal
											</p>

											<Table className="mt-2">
												<TableHeader>
													<TableRow>
														<TableHead className="w-1/3">
															Person
														</TableHead>
														<TableHead className="w-1/3">
															Grams / Meal × Meals
														</TableHead>
														<TableHead className="w-1/3 text-right">
															Calories / Meal
														</TableHead>
														<TableHead className="w-1/3 text-right">
															Total Grams
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{adjusted.map((res) => {
														const person =
															people.find(
																(p) =>
																	p.id ===
																	res.personId,
															);
														return (
															<TableRow
																key={
																	res.personId
																}
															>
																<TableCell>
																	{res.name}
																</TableCell>
																<TableCell>
																	{res.adjustedGramsPerMeal.toFixed(
																		1,
																	)}{" "}
																	g / meal ×{" "}
																	{
																		person?.meals
																	}{" "}
																	meals
																</TableCell>
																<TableCell className="text-right text-muted-foreground">
																	{res.adjustedKcalPerMeal.toFixed(
																		1,
																	)}{" "}
																	kcal / meal
																</TableCell>
																<TableCell className="text-right text-muted-foreground">
																	{res.adjustedGramsTotal.toFixed(
																		1,
																	)}{" "}
																	g total
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<SaveMealModal
				open={showSaveModal}
				onClose={() => setShowSaveModal(false)}
				onSave={(name, createdBy, notes) =>
					handleSave(name, createdBy, notes)
				}
			/>
		</div>
	);
}
