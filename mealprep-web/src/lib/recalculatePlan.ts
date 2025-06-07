import type {Food} from "@/types/food";
import type {IngredientPlanMode} from "@/types/plan";
import {getKcalPer100g, getKcalPerUnit} from "@/lib/mealUtils";

interface RecalculatePlanOptions {
	plans: {
		foodId: number;
		mode: IngredientPlanMode;
		value: number;
		personId?: string;
	}[];
	setPlan: (
		foodId: number,
		mode: IngredientPlanMode,
		value: number,
		grams: number,
		kcal: number,
		percent: number,
		personId?: string,
	) => void;
	foods: Food[];
	people: {
		id: string;
		meals: number;
		targetCalories: number;
	}[];
}

export function recalculatePlans({
	plans,
	setPlan,
	foods,
	people,
}: RecalculatePlanOptions) {
	// fallback if no people
	const sharedTotalCalories = people.length
		? people.reduce((sum, p) => sum + p.meals * p.targetCalories, 0)
		: 0;

	for (const plan of plans) {
		const food = foods.find((f) => f.fdcId === plan.foodId);
		if (!food) continue;

		const kcalPer100g = getKcalPer100g(food.fdcId);
		const kcalPerUnit = getKcalPerUnit(food.fdcId);
		const isUnitBased = !!food.unitLabel;

		const value = plan.value;
		let kcal = 0;
		let grams = 0;

		// per-person total if personId exists, otherwise use shared
		const person = people.find((p) => p.id === plan.personId);
		const totalCalories = person
			? person.meals * person.targetCalories
			: sharedTotalCalories;

		// calculate kcal
		if (isUnitBased) {
			kcal = value * kcalPerUnit;
		} else if (plan.mode === "calories") {
			kcal = value;
		} else if (plan.mode === "grams") {
			kcal = (value / 100) * kcalPer100g;
		} else if (plan.mode === "percent") {
			kcal = (value / 100) * totalCalories;
		}

		kcal = Math.round(kcal * 10) / 10;

		// calculate grams (if not unit-based)
		if (!isUnitBased && kcalPer100g > 0) {
			grams = Math.round((kcal / kcalPer100g) * 1000) / 10;
		}

		// calculate percent
		const percent =
			plan.mode === "percent"
				? value
				: totalCalories > 0
					? Math.round((kcal / totalCalories) * 1000) / 10
					: 0;

		setPlan(
			plan.foodId,
			plan.mode,
			value,
			grams,
			kcal,
			percent,
			plan.personId,
		);
	}
}
