import type {Nutrition} from "@/types/nutrition";
import type {Food} from "@/types/food";

export function mapUsdaNutrients(apiNutrients: any[]): Nutrition[] {
	return (apiNutrients || []).map((n) => ({
		name: n.nutrientName ?? "",
		value: n.value ?? 0,
		unit: n.unitName ?? "",
	}));
}

export function mapUsdaFood(apiFood: any): Food {
	return {
		id: String(apiFood.fdcId),
		description: apiFood.description,
		foodNutrients: mapUsdaNutrients(apiFood.foodNutrients),
		brandOwner: apiFood.brandOwner,
	};
}
