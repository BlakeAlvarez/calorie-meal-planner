import type {Nutrient} from "@/types/food";

// gets best available kcal value from USDA nutrient list
export function getEnergyKcal(nutrients: Nutrient[]): number {
	if (!nutrients || !Array.isArray(nutrients)) return 0;

	const energy = nutrients.find(
		(n) =>
			n.nutrientNumber === "208" || // standard kcal
			n.nutrientNumber === "999" || // fallback/custom kcal
			n.nutrientName.toLowerCase().includes("atwater general") ||
			(n.nutrientName.toLowerCase().includes("energy") &&
				n.unitName === "kcal"),
	);

	return energy?.value ?? 0;
}

// gets protein value in grams from USDA nutrient list
export function getProtein(nutrients: Nutrient[]): number {
	return nutrients.find((n) => n.nutrientName === "Protein")?.value ?? 0;
}

// gets fat value in grams from USDA nutrient list
export function getFats(nutrients: Nutrient[]): number {
	return nutrients.find((n) => n.nutrientName === "Fats")?.value ?? 0;
}

// gets carbohydrate value in grams from USDA nutrient list
export function getCarbs(nutrients: Nutrient[]): number {
	return nutrients.find((n) => n.nutrientName === "Carbs")?.value ?? 0;
}
