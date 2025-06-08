import type {Nutrition} from "@/types/nutrition";

// gets best available kcal value from a nutrition list
export function getEnergyKcal(nutrients: Nutrition[]): number {
	if (!nutrients || !Array.isArray(nutrients)) return 0;
	// find "Energy" nutrient whose unit is "kcal" (case-insensitive)
	const kcalNutrient = nutrients.find(
		(n) =>
			n.name?.toLowerCase() === "energy" &&
			n.unit?.toLowerCase() === "kcal",
	);
	return kcalNutrient?.value ?? 0;
}

// gets protein value in grams from a nutrition list
export function getProtein(nutrients: Nutrition[]): number {
	return (
		nutrients.find(
			(n) =>
				n.name.toLowerCase() === "protein" ||
				n.name.toLowerCase().includes("protein"),
		)?.value ?? 0
	);
}

// gets fat value in grams from a nutrition list
export function getFats(nutrients: Nutrition[]): number {
	return (
		nutrients.find(
			(n) =>
				n.name.toLowerCase() === "total lipid (fat)" ||
				n.name.toLowerCase().includes("fat"),
		)?.value ?? 0
	);
}

// gets carbohydrate value in grams from a nutrition list
export function getCarbs(nutrients: Nutrition[]): number {
	return (
		nutrients.find(
			(n) =>
				n.name.toLowerCase() === "carbohydrate, by difference" ||
				n.name.toLowerCase().includes("carb"),
		)?.value ?? 0
	);
}
