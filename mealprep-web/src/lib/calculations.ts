// this file is used for all calculations regarding calorie counts, allocations, and meal distribution

import type {Group} from "@/types/group";
import type {Food} from "@/types/food";
import type {Person} from "@/types/person";

// given a group and all foods, calculates average kcal per 100g for the group's foods (ignores unit-based foods)
export function getGroupAvgKcalPer100g(group: Group, foods: Food[]): number {
	function isUnitBased(food: Food): boolean {
		if (!food.servingSizes) return false;
		// if any serving unit is not grams or ml, it's unit-based
		return food.servingSizes.some((s) => s.unit !== "g" && s.unit !== "ml");
	}

	const groupFoods = foods.filter(
		(food) =>
			group.ingredients.some((ing) => ing.foodId === food.id) &&
			!isUnitBased(food),
	);
	if (groupFoods.length === 0) return 0;
	const sumCal = groupFoods.reduce((sum, food) => {
		const nutrient = food.foodNutrients.find(
			(n) =>
				n.name.toLowerCase() === "energy" &&
				n.unit.toLowerCase() === "kcal",
		);
		return sum + (nutrient?.value ?? 0);
	}, 0);
	return sumCal / groupFoods.length;
}

// calculates the total raw calorie allocation for a given person based on their group allocations (if using grams-based planning)
export function getPersonRawCalories({
	personId,
	groups,
	foods,
	personGroupAllocations, // { [personId]: { [groupId]: grams } }
}: {
	personId: string;
	groups: Group[];
	foods: Food[];
	personGroupAllocations: Record<string, Record<string, number>>;
}): number {
	const personAlloc = personGroupAllocations[personId] ?? {};
	let total = 0;

	// loop through each group this person has grams allocated to
	for (const [groupId, rawGrams] of Object.entries(personAlloc)) {
		const group = groups.find((g) => g.id === groupId);
		if (!group) continue;
		const avgKcalPer100g = getGroupAvgKcalPer100g(group, foods);
		total += (rawGrams / 100) * avgKcalPer100g;
	}

	return total;
}

// calculates how many calories each person gets based on the actual calories total instead of planned calories
// each person's share is proportional to their planned total
export interface PersonGroupAllocation {
	id: string;
	name: string;
	totalMeals: number;
	plannedGroupKcal: number;
}

export function calculateAdjustedMealDistribution({
	people,
	totalAvailableKcal,
	totalCookedGrams,
}: {
	people: PersonGroupAllocation[];
	totalAvailableKcal: number;
	totalCookedGrams: number;
}) {
	const sumGroupKcal = people.reduce(
		(sum, p) => sum + (p.plannedGroupKcal ?? 0),
		0,
	);
	return people.map((person) => {
		const share =
			sumGroupKcal > 0
				? (person.plannedGroupKcal ?? 0) / sumGroupKcal
				: 1 / people.length;
		const adjustedGramsTotal = share * totalCookedGrams;
		const adjustedKcalTotal = share * totalAvailableKcal;
		const adjustedGramsPerMeal =
			adjustedGramsTotal / (person.totalMeals ?? 1);
		const adjustedKcalPerMeal =
			adjustedKcalTotal / (person.totalMeals ?? 1);
		return {
			personId: person.id,
			name: person.name,
			adjustedGramsTotal,
			adjustedKcalTotal,
			adjustedGramsPerMeal,
			adjustedKcalPerMeal,
		};
	});
}
