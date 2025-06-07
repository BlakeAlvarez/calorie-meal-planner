// types/plan.ts

export type IngredientPlanMode = "grams" | "calories" | "percent";

// For useIngredientInputState only — raw input data, temporary
export interface IngredientInputPlan {
	foodId: number;
	personId?: string;
	mode: IngredientPlanMode;
	value: number;
	grams: number;
	kcal: number;
	percent: number;
}
