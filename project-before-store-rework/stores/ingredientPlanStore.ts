// store for ingredient weight/calories/percentage of entire meal calories

import {create} from "zustand";
import {persist} from "zustand/middleware";

// 3 possible types of store.
// grams for a set amount of grams for a food item
// calories for a specific amount of calories for a food item
// percentage: is the percentage of total allowed calories of the meal
export type IngredientPlanMode = "grams" | "calories" | "percent";

// IngredientPlan contains the foodId, the mode of calorie count, and the value for the mode
export interface IngredientPlan {
	foodId: number;
	mode: IngredientPlanMode;
	value: number;
	grams: number;
	kcal: number;
	percent: number;
}

// Ingredient plan store tracks how much of each food the user wants to include in a meal
// and in what unit: fixed grams, target calories, or % of total calories.
// each plan is mapped to a specific food via its foodId.
interface IngredientPlanState {
	plans: IngredientPlan[];
	setPlan: (
		foodId: number,
		mode: IngredientPlanMode,
		value: number,
		grams: number,
		kcal: number,
		percent: number,
	) => void;
	removePlan: (foodId: number) => void;
	clearPlans: () => void;
	loadPlans: (plans: IngredientPlan[]) => void;
}

export const useIngredientPlanStore = create<IngredientPlanState>()(
	persist(
		(set) => ({
			// array of plans for the meal
			plans: [],

			// sets a plan for the plan store
			// intakes foodId, mode of calorie count, input value (useful for when unit based),
			// grams, kcal, and percent (useful when loading a meal but with different people/calorie targets)
			setPlan: (foodId, mode, value, grams, kcal, percent) =>
				set((state) => {
					const existing = state.plans.find(
						(p) => p.foodId === foodId,
					);
					const updated = {foodId, mode, value, grams, kcal, percent};
					return {
						plans: existing
							? state.plans.map((p) =>
									p.foodId === foodId ? updated : p,
								)
							: [...state.plans, updated],
					};
				}),

			// removes an ingredient from the plan store
			removePlan: (foodId) =>
				set((state) => ({
					plans: state.plans.filter((p) => p.foodId !== foodId),
				})),

			// removes all plans from the ingredient plan store
			clearPlans: () => set({plans: []}),

			loadPlans: (plans: IngredientPlan[]) => set({plans}),
		}),
		{
			name: "ingredient-plan-store",
		},
	),
);
