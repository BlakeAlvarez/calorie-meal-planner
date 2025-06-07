// used to recalculate the plans and store the data in the plan store

import {getEnergyKcal} from "@/utils/nutrientUtils";
import type {
	IngredientPlan,
	IngredientPlanMode,
} from "@/stores/ingredientPlanStore";
import type {Person} from "@/stores/peopleStore";
import type {Food} from "@/types/food";

// takes in current plans, foods, and people, and recalculates kcal/grams/percent per food
export function recalculatePlans({
	plans,
	people,
	foods,
	setPlan,
}: {
	plans: IngredientPlan[];
	people: Person[];
	foods: Food[];
	setPlan: (
		foodId: number,
		mode: IngredientPlanMode,
		value: number,
		grams: number,
		kcal: number,
		percent: number,
	) => void;
}) {
	// skip if no values are provided
	if (
		plans.length === 0 ||
		plans.every((p) => p.value === 0 || p.value === undefined)
	) {
		return;
	}

	// total calories across all people based on meals and targets
	const totalCalories = people.reduce(
		(sum, p) => sum + p.targetCalories * p.meals,
		0,
	);

	plans.forEach((plan) => {
		const food = foods.find((f) => f.fdcId === plan.foodId);
		if (!food) return;

		const kcalPer100g = getEnergyKcal(food.foodNutrients);
		const gramsPerUnit = food.gramsPerUnit ?? 100;
		const kcalPerUnit = (gramsPerUnit / 100) * kcalPer100g;

		let kcal = 0;
		let grams = 0;
		let percent = 0;

		if (food.unitLabel) {
			// unit-based food (e.g. eggs, bars)
			kcal = plan.value * kcalPerUnit;
			grams = 0;
		} else if (plan.mode === "grams") {
			// fixed gram input
			grams = plan.value;
			kcal = (plan.value / 100) * kcalPer100g;
		} else if (plan.mode === "calories") {
			// fixed kcal input
			kcal = plan.value;
			grams = kcalPer100g ? (plan.value / kcalPer100g) * 100 : 0;
		} else if (plan.mode === "percent") {
			// percent of total meal calories
			kcal = (plan.value / 100) * totalCalories;
			grams = kcalPer100g ? (kcal / kcalPer100g) * 100 : 0;
		}

		// calculate final percentage based on updated kcal
		percent = (kcal / totalCalories) * 100;

		const isClose = (a: number, b: number) => Math.abs(a - b) < 0.01;

		// skip update if values are already very close
		if (
			isClose(plan.kcal, kcal) &&
			isClose(plan.grams, grams) &&
			isClose(plan.percent, percent)
		) {
			return;
		}

		// push updated values to the plan store
		setPlan(plan.foodId, plan.mode, plan.value, grams, kcal, percent);
	});
}
