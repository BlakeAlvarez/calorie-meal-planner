import {usePeopleStore} from "@/stores/peopleStore";
import {useMealStore} from "@/stores/mealStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {useGroupStore} from "@/stores/groupStore";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import type {IngredientGroup} from "@/stores/groupStore";
import type {IngredientPlan} from "@/stores/ingredientPlanStore";

// returns the total planned calories for a specific person
export function getPlannedCaloriesForPerson(personId: string): number {
	const people = usePeopleStore.getState().people;
	const plans = useIngredientPlanStore.getState().plans;

	const person = people.find((p) => p.id === personId);
	if (!person) return 0;

	const personalPlans = plans.filter(
		(p) => p.personId === personId || p.personId === undefined,
	);

	const total = personalPlans.reduce(
		(sum, plan) => sum + (plan.kcal ?? 0),
		0,
	);
	return total;
}

// returns a list of ingredients for a person with per-meal kcal and gram allocations
export function getPerMealIngredientBreakdown(personId: string) {
	const people = usePeopleStore.getState().people;
	const foods = useMealStore.getState().foods;
	const plans = useIngredientPlanStore.getState().plans;

	const person = people.find((p) => p.id === personId);
	if (!person) return [];

	const personalPlans = plans.filter(
		(p) => p.personId === personId || p.personId === undefined,
	);

	return personalPlans.map((plan) => {
		const food = foods.find((f) => f.fdcId === plan.foodId);
		const kcalPerMeal = plan.kcal / person.meals;
		const gramsPerMeal = plan.grams / person.meals;

		return {
			foodId: plan.foodId,
			name: food?.description ?? "Unknown",
			kcalPerMeal,
			gramsPerMeal,
		};
	});
}

// returns per-person cooked grams and kcal distributions for a group
export function getCookedDistribution(groupId: string) {
	const people = usePeopleStore.getState().people;
	const groups = useGroupStore.getState().groups;
	const foods = useMealStore.getState().foods;

	const group = groups.find((g) => g.id === groupId);
	if (!group || !group.cookedWeightGrams) return [];

	const totalAllocated = Object.values(group.personAllocations).reduce(
		(sum, grams) => sum + grams,
		0,
	);
	const totalGroupKcal = group.ingredients.reduce((sum, ing) => {
		const food = foods.find((f) => f.fdcId === ing.foodId);
		const kcalPer100g = food ? getEnergyKcal(food.foodNutrients) : 0;
		return sum + (ing.grams / 100) * kcalPer100g;
	}, 0);

	return people.map((p) => {
		const personGrams = group.personAllocations[p.id] ?? 0;
		const kcalShare =
			totalAllocated > 0
				? (personGrams / totalAllocated) * totalGroupKcal
				: 0;

		return {
			personId: p.id,
			name: p.name,
			grams: personGrams,
			kcal: kcalShare,
		};
	});
}

// adjusts cooked kcal/grams based on each person's target share
// used when cooked weight is fixed and we want to divide fairly by planned kcal
export function calculateAdjustedMealDistribution({
	people,
	totalAvailableKcal,
	totalCookedGrams,
}: {
	people: {
		id: string;
		name: string;
		meals: number;
		targetCaloriesPerMeal: number;
	}[];
	totalAvailableKcal: number;
	totalCookedGrams: number;
}) {
	const totalRequestedKcal = people.reduce(
		(sum, p) => sum + p.targetCaloriesPerMeal * p.meals,
		0,
	);

	const kcalPerGram = totalAvailableKcal / totalCookedGrams;

	return people.map((p) => {
		const plannedTotalKcal = p.targetCaloriesPerMeal * p.meals;
		const share = plannedTotalKcal / totalRequestedKcal;

		const adjustedTotalKcal = share * totalAvailableKcal;
		const adjustedKcalPerMeal = adjustedTotalKcal / p.meals;

		const adjustedGramsTotal = adjustedTotalKcal / kcalPerGram;
		const adjustedGramsPerMeal = adjustedGramsTotal / p.meals;

		return {
			personId: p.id,
			name: p.name,
			adjustedTotalKcal,
			adjustedKcalPerMeal,
			adjustedGramsTotal,
			adjustedGramsPerMeal,
		};
	});
}

// calculates the group distribution per person
export function calculateGroupDistributionByPlans({
	group,
	people,
	plans,
	cookedWeightGrams,
}: {
	group: IngredientGroup;
	people: {id: string; name: string; meals: number; targetCalories: number}[];
	plans: IngredientPlan[];
	cookedWeightGrams: number;
}) {
	const foodIdsInGroup = new Set(group.ingredients.map((i) => i.foodId));
	const relevantPlans = plans.filter((p) => foodIdsInGroup.has(p.foodId));

	// group total kcal from shared plans
	const sharedGroupKcal = relevantPlans
		.filter((p) => !p.personId)
		.reduce((sum, p) => sum + (p.kcal ?? 0), 0);

	const hasPerPersonPlans = relevantPlans.some((p) => !!p.personId);

	if (!hasPerPersonPlans && sharedGroupKcal > 0 && cookedWeightGrams > 0) {
		// shared mode logic: distribute group by person share of full meal
		const totalMealKcal = people.reduce(
			(sum, p) => sum + p.meals * p.targetCalories,
			0,
		);

		return people.map((p) => {
			const personMealKcal = p.meals * p.targetCalories;
			const share = personMealKcal / totalMealKcal;

			const totalGrams = share * cookedWeightGrams;
			const gramsPerMeal = totalGrams / p.meals;
			const kcalTotal = share * sharedGroupKcal;
			const kcalPerMeal = kcalTotal / p.meals;

			return {
				personId: p.id,
				name: p.name,
				adjustedTotalKcal: kcalTotal,
				adjustedKcalPerMeal: kcalPerMeal,
				adjustedGramsTotal: totalGrams,
				adjustedGramsPerMeal: gramsPerMeal,
			};
		});
	}

	// if in per-person planning mode, fall back to person-based kcal summing
	const personTotals: Record<string, number> = {};
	for (const plan of relevantPlans) {
		if (plan.personId) {
			personTotals[plan.personId] =
				(personTotals[plan.personId] || 0) + (plan.kcal ?? 0);
		}
	}

	const totalKcal = Object.values(personTotals).reduce(
		(sum, v) => sum + v,
		0,
	);
	if (totalKcal === 0 || cookedWeightGrams === 0) return [];

	return people.map((person) => {
		const personKcal = personTotals[person.id] || 0;
		const share = personKcal / totalKcal;
		const totalGrams = share * cookedWeightGrams;
		const gramsPerMeal = totalGrams / person.meals;
		const kcalPerMeal = personKcal / person.meals;

		return {
			personId: person.id,
			name: person.name,
			adjustedTotalKcal: personKcal,
			adjustedKcalPerMeal: kcalPerMeal,
			adjustedGramsTotal: totalGrams,
			adjustedGramsPerMeal: gramsPerMeal,
		};
	});
}
