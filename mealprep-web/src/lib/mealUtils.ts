// helper to clear all meal-related stores and start fresh

import {usePeopleStore} from "@/stores/peopleStore";
import {useMealStore} from "@/stores/mealStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {useGroupStore} from "@/stores/groupStore";
import {useStepStore} from "@/stores/stepStore";
import {getEnergyKcal} from "@/utils/nutrientUtils";

export function resetMeal() {
	usePeopleStore.getState().clearPeople();
	useMealStore.getState().clearMeal();
	useIngredientPlanStore.getState().clearPlans();
	useGroupStore.getState().clearGroups();
	useStepStore.getState().setStep("setup"); // optional: reset to beginning
}

export const getKcalPer100g = (fdcId: number): number => {
	const foods = useMealStore.getState().foods;
	const food = foods.find((f) => f.fdcId === fdcId);
	return food ? getEnergyKcal(food.foodNutrients) : 0;
};

export const getKcalPerUnit = (fdcId: number): number => {
	const foods = useMealStore.getState().foods;
	const food = foods.find((f) => f.fdcId === fdcId);
	if (!food || !food.isUnitBased) return 0;
	const kcalPer100g = getEnergyKcal(food.foodNutrients);
	const gramsPerUnit = food.gramsPerUnit ?? 100;
	return Math.round((gramsPerUnit / 100) * kcalPer100g * 10) / 10;
};
