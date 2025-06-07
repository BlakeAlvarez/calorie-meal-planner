import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {IngredientInputPlan} from "@/types/plan";
import type {IngredientPlanMode} from "@/stores/ingredientPlanStore";

interface IngredientInputState {
	plans: IngredientInputPlan[];
	setPlan: (
		foodId: number,
		mode: IngredientPlanMode,
		value: number,
		grams: number,
		kcal: number,
		percent: number,
		personId?: string,
	) => void;
	clearPlans: () => void;
}

export const useIngredientInputState = create<IngredientInputState>()(
	persist(
		(set, get) => ({
			plans: [],
			setPlan: (foodId, mode, value, grams, kcal, percent, personId) => {
				const updated = [...get().plans];
				const index = updated.findIndex(
					(p) => p.foodId === foodId && p.personId === personId,
				);

				const newPlan: IngredientInputPlan = {
					foodId,
					mode,
					value,
					grams,
					kcal,
					percent,
					personId,
				};

				if (index !== -1) {
					updated[index] = newPlan;
				} else {
					updated.push(newPlan);
				}

				set({plans: updated});
			},
			clearPlans: () => set({plans: []}),
		}),
		{
			name: "ingredient-input-state",
		},
	),
);
