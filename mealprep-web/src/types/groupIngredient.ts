export type IngredientMode = "grams" | "kcal" | "percent";

export interface GroupIngredient {
	foodId: string;
	amount: number; // how much of the item in the set unit (e.g. 148)
	unit: string; // "g", "ml", "unit", "cup", etc.

	// (Optional) Reference to the serving definition used, for traceability/UI
	servingDefinition?: {
		unit: string;
		gramsPerUnit?: number;
		kcalPerUnit: number;
		proteinPerUnit?: number;
		fatPerUnit?: number;
		carbsPerUnit?: number;
	};
}
