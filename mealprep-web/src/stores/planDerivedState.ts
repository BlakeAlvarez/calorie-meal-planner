import {create} from "zustand";
import {useIngredientInputState} from "@/stores/ingredientInputState";

interface PlanDerivedState {
	totalCalories: number;
	totalGrams: number;
	// you can add more derived values here
	recalculate: () => void;
}

export const usePlanDerivedState = create<PlanDerivedState>((set) => ({
	totalCalories: 0,
	totalGrams: 0,

	recalculate: () => {
		const plans = useIngredientInputState.getState().plans;

		let totalCalories = 0;
		let totalGrams = 0;

		for (const plan of plans) {
			totalCalories += plan.kcal ?? 0;
			totalGrams += plan.grams ?? 0;
		}

		set({totalCalories, totalGrams});
	},
}));
