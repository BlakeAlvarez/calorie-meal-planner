import type {IngredientPlan} from "@/stores/ingredientPlanStore";
import type {Food} from "@/types/food";
import type {Person} from "@/stores/peopleStore";
import {getEnergyKcal} from "@/utils/nutrientUtils";

export function getResolvedPlans(
	plans: IngredientPlan[],
	foods: Food[],
	people: Person[],
): IngredientPlan[] {
	const totalTargetCalories = people.reduce(
		(sum, p) => sum + p.targetCalories * p.meals,
		0,
	);

	return plans.map((plan) => {
		const food = foods.find((f) => f.fdcId === plan.foodId);
		if (!food) return {...plan, kcal: 0};

		const kcalPer100g = getEnergyKcal(food.foodNutrients);
		const isUnitBased = !!food.unitLabel;
		const gramsPerUnit = food.gramsPerUnit ?? 0;
		const kcalPerUnit =
			gramsPerUnit > 0 ? (gramsPerUnit / 100) * kcalPer100g : 0;

		let kcal = 0;
		if (isUnitBased) {
			kcal = plan.value * kcalPerUnit;
		} else if (plan.mode === "calories") {
			kcal = plan.value;
		} else if (plan.mode === "grams") {
			kcal = (plan.value / 100) * kcalPer100g;
		} else if (plan.mode === "percent") {
			kcal = (plan.value / 100) * totalTargetCalories;
		}

		return {...plan, kcal};
	});
}
