import type {Nutrition} from "@/types/nutrition";

export interface Food {
	id: string;
	description: string;
	foodNutrients: Nutrition[]; // standard USDA nutrients per 100g
	servingSizes?: FoodServingSize[]; // see below
	cookedWeightGrams?: number;
	rawWeightGrams?: number;
	brandOwner?: string;
}

export interface FoodServingSize {
	unit: string; // e.g. "g", "ml", "cup", "unit", "slice"
	gramsPerUnit?: number; // e.g. 1 "unit" = 50g (for egg)
	kcalPerUnit: number;
	proteinPerUnit?: number;
	fatPerUnit?: number;
	carbsPerUnit?: number;
}
