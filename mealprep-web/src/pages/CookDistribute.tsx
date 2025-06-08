import {useState} from "react";
import {usePeopleStore} from "@/stores/peopleStore";
import {useGroupStore} from "@/stores/groupStore";
import {useMealStore} from "@/stores/mealStore";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
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
import type {Group} from "@/types/group";
import type {Food} from "@/types/food";

function isUnitBased(food: Food): boolean {
	// ff any serving size is not grams or ml, we consider it unit-based
	return (
		food.servingSizes?.some((s) => s.unit !== "g" && s.unit !== "ml") ??
		false
	);
}

// sum raw weights for a group by adding each ingredient's grams
function getRawWeight(group: Group): number {
	return group.ingredients.reduce((sum, ing) => {
		if (ing.unit === "g") return sum + ing.amount;
		return sum;
	}, 0);
}

export default function CookDistribute() {
	const {prevStep} = useStepNavigator();
	const groups = useGroupStore((s) => s.groups);
	const setCookedWeight = useGroupStore((s) => s.setCookedWeight);
	const foods = useMealStore((s) => s.foods);
	const people = usePeopleStore((s) => s.people);
	const plans = usePersonGroupPlanStore((s) => s.plans); // <-- get the plans
	const navigate = useNavigate();
	const [ungroupedCookedWeights, setUngroupedCookedWeights] = useState<
		Record<string, number>
	>({});

	// helper to get kcal per 100g from food nutrients
	const getKcalPer100g = (id: string): number => {
		const food = foods.find((f) => f.id === id);
		return food ? getEnergyKcal(food.foodNutrients) : 0;
	};

	// helper to get kcal per unit if applicable
	const getKcalPerUnit = (id: string): number => {
		const food = foods.find((f) => f.id === id);
		if (!food || !isUnitBased(food)) return 0;
		const unitServing = food.servingSizes?.find(
			(s) => s.unit !== "g" && s.unit !== "ml",
		);
		const gramsPerUnit = unitServing?.gramsPerUnit ?? 100;
		const kcalPer100g = getEnergyKcal(food.foodNutrients);
		return Math.round((gramsPerUnit / 100) * kcalPer100g * 10) / 10;
	};

	// determine ungrouped foods (not assigned to any group)
	const groupedFoodIds = groups.flatMap((g) =>
		g.ingredients.map((i) => i.foodId),
	);
	const ungroupedFoods = foods.filter((f) => !groupedFoodIds.includes(f.id));

	const handleFinish = () => {
		toast.success("Meal finalized!");
		navigate("/meal-summary", {state: {fromCook: true}});
	};

	// helper for percent from plans store (plan mode must be "percent")
	const getPercent = (personId: string, groupId: string) => {
		const plan = plans.find(
			(p) => p.personId === personId && p.groupId === groupId,
		);
		return plan?.mode === "percent" ? (plan.value ?? 0) : 0;
	};

	return (
		<div className="cook-step space-y-6 p-6">
			{/* shows user progress bar for meal setup flow */}
			<StepProgressBar />

			<div className="space-y-3 mb-4">
				<div className="flex justify-between items-center">
					<Button variant="secondary" onClick={prevStep}>
						Back
					</Button>
					<Button onClick={handleFinish}>Meal Summary</Button>
				</div>
				<h1 className="text-xl md:text-2xl font-bold text-center">
					Cook & Distribute
				</h1>
			</div>

			{/* group handling */}
			{groups.map((group) => {
				if (!group.ingredients.length) return null;
				const cookedGrams = group.cookedWeightGrams ?? 0;

				// total kcal in group
				const groupKcal = group.ingredients.reduce((sum, ing) => {
					const food = foods.find((f) => f.id === ing.foodId);
					const kcalPer100g = getEnergyKcal(
						food?.foodNutrients ?? [],
					);
					const kcal =
						ing.unit === "g"
							? Math.round((ing.amount * kcalPer100g) / 100)
							: 0;
					return sum + kcal;
				}, 0);
				if (groupKcal === 0) return null;

				// calculate plannedGroupKcal for each person (per group)
				const peopleForDist = people.map((p) => ({
					id: p.id,
					name: p.name,
					totalMeals: p.totalMeals ?? 1,
					plannedGroupKcal:
						p.caloriesPerMeal *
						p.totalMeals *
						(getPercent(p.id, group.id) / 100),
				}));

				// actual per-person meal distribution for this group
				const results = calculateAdjustedMealDistribution({
					people: peopleForDist,
					totalAvailableKcal: groupKcal,
					totalCookedGrams: cookedGrams,
				});

				return (
					<div className="flex justify-center" key={group.id}>
						<div className="w-full max-w-2xl border p-4 rounded space-y-2">
							<h2 className="font-semibold text-lg">
								{group.name}
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
														{person?.totalMeals ??
															1}{" "}
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
			{ungroupedFoods.length > 0 && (
				<div className="space-y-6 pt-2">
					<h2 className="text-lg font-semibold text-center">
						Ungrouped Foods
					</h2>
					{ungroupedFoods.map((food) => {
						const kcalPer100g = getKcalPer100g(food.id);
						const kcalPerUnit = getKcalPerUnit(food.id);
						const isUnit = isUnitBased(food);

						const grams =
							food.servingSizes?.find((s) => s.unit === "g")
								?.gramsPerUnit ??
							food.servingSizes?.[0]?.gramsPerUnit ??
							100;
						const kcal = isUnit
							? kcalPerUnit
							: Math.round((grams * kcalPer100g) / 100);
						const cookedGrams =
							ungroupedCookedWeights[food.id] ??
							food.cookedWeightGrams ??
							0;
						const rawGrams = food.rawWeightGrams ?? grams;

						if (kcal === 0) return null;

						// for ungrouped, distribute by total calories
						const adjusted = calculateAdjustedMealDistribution({
							people: people.map((p) => ({
								id: p.id,
								name: p.name,
								totalMeals: p.totalMeals ?? 1,
								plannedGroupKcal:
									p.caloriesPerMeal * p.totalMeals, // entire calories, as no group percent
							})),
							totalAvailableKcal: kcal,
							totalCookedGrams: cookedGrams,
						});

						return (
							<div className="flex justify-center" key={food.id}>
								<div className="w-full max-w-2xl border p-4 rounded space-y-2">
									<h3 className="font-semibold text-base">
										{food.description}
									</h3>
									{!isUnit && (
										<p className="text-sm text-muted-foreground">
											Initial Weight:{" "}
											{rawGrams.toFixed(1)} g (
											{(rawGrams / 453.592).toFixed(2)}{" "}
											lb)
										</p>
									)}
									<div className="flex items-center gap-4">
										<Label htmlFor={`ungrouped-${food.id}`}>
											Cooked Weight (g)
										</Label>
										<Input
											id={`ungrouped-${food.id}`}
											type="number"
											className="w-32"
											value={
												ungroupedCookedWeights[
													food.id
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
														[food.id]: value,
													}),
												);
												useMealStore
													.getState()
													.updateFood(food.id, {
														cookedWeightGrams:
															value,
													});
											}}
										/>
									</div>
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
																	{person?.totalMeals ??
																		1}{" "}
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
