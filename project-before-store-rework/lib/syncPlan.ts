// this hook syncs the food plans to the group plan
// mostly used to keep track of grams for the initial weight shown on C+D page

import type {IngredientGroup} from "@/stores/groupStore";
import type {IngredientPlan} from "@/stores/ingredientPlanStore";

export function syncGroupIngredientGramsFromPlans(
	groups: IngredientGroup[],
	plans: IngredientPlan[],
): IngredientGroup[] {
	return groups.map((group) => ({
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
}
