// this is used to calculate resolved kcal and gram values for each food in the plan
// accounts for selected mode (grams, kcal, or % of total target calories)

import { useIngredientPlanStore } from "@/stores/ingredientPlanStore";
import { useMealStore } from "@/stores/mealStore";

export function useResolvedIngredientCalories(totalTargetCalories: number) {
  const plans = useIngredientPlanStore((s) => s.plans);
  const foods = useMealStore((s) => s.foods);

  return plans.map((plan) => {
    const food = foods.find((f) => f.fdcId === plan.foodId);
    const kcalPer100g =
      food?.foodNutrients.find((n) =>
        ["Energy"].includes(n.nutrientName)
      )?.value ?? 0;

    // calculate calories based on selected user input
    const kcal = plan.mode === "calories"
      ? plan.value
      : plan.mode === "grams"
      ? (plan.value / 100) * kcalPer100g
      : (plan.value / 100) * totalTargetCalories;

    const grams = food?.gramsPerUnit && food.unitLabel
      ? plan.value * food.gramsPerUnit
      : (kcal / kcalPer100g) * 100;


    return {
      foodId: plan.foodId,
      kcal,
      grams: isFinite(grams) ? grams : 0,
    };
  });
}
