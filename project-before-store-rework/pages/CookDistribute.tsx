import {useState} from "react";
import {usePeopleStore} from "@/stores/peopleStore";
import {useGroupStore} from "@/stores/groupStore";
import {useMealStore} from "@/stores/mealStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {calculateAdjustedMealDistribution} from "@/lib/calculations";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {StepProgressBar} from "@/components/StepProgressBar";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {useNavigate} from "react-router-dom";
import {toast} from "sonner";
import type {IngredientGroup} from "@/stores/groupStore";

export default function CookDistribute() {
	// sum raw weights for a group by adding each ingredient's grams
	function getRawWeight(group: IngredientGroup): number {
		return group.ingredients.reduce((sum, ing) => sum + ing.grams, 0);
	}

	const {prevStep} = useStepNavigator();
	const groups = useGroupStore((s) => s.groups);
	const setCookedWeight = useGroupStore((s) => s.setCookedWeight);
	const plans = useIngredientPlanStore((s) => s.plans);
	const foods = useMealStore((s) => s.foods);
	const people = usePeopleStore((s) => s.people);
	const navigate = useNavigate();

	// calculates the total meal calories based on all food plan entries
	const TOTAL_TARGET_CALORIES = plans.reduce(
		(sum, plan) => sum + (plan.kcal ?? 0),
		0,
	);

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

	const handleFinish = () => {
		toast.success("Meal finalized!");
		navigate("/meal-summary", {state: {fromCook: true}});
	};

	return (
		<div className="cook-step space-y-6 p-6">
			{/* shows user progress bar for meal setup flow */}
			<StepProgressBar />

			<div className="space-y-3 mb-4">
				{/* Row: Back + Final Action */}
				<div className="flex justify-between items-center">
					<Button variant="secondary" onClick={prevStep}>
						Back
					</Button>
					<Button onClick={handleFinish}>Meal Summary</Button>
				</div>

				{/* Centered Title */}
				<h1 className="text-xl md:text-2xl font-bold text-center">
					Cook & Distribute
				</h1>
			</div>

			{/* group handling */}
			{resolvedGroups.map((group) => {
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
								Initial Weight: {getRawWeight(group).toFixed(1)}{" "}
								g
							</p>
							<div className="flex items-center gap-4">
								<Label htmlFor={`cooked-${group.id}`}>
									Cooked Weight (g)
								</Label>
								<Input
									id={`cooked-${group.id}`}
									type="number"
									className="w-32"
									value={group.cookedWeightGrams ?? ""}
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
												(p) => p.id === res.personId,
											);
											return (
												<TableRow key={res.personId}>
													<TableCell>
														{res.name}
													</TableCell>
													<TableCell>
														{res.adjustedGramsPerMeal.toFixed(
															1,
														)}{" "}
														g / meal ×{" "}
														{person?.meals} meals
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
			{ungroupedFoods.length > 0 && (
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
											className="w-32"
											value={
												ungroupedCookedWeights[
													food.fdcId
												] ??
												food.cookedWeightGrams ??
												""
											}
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
		</div>
	);
}
