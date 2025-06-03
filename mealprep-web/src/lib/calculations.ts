// this hook is used for all calculations regarding calorie counts

import { usePersonGroupStore } from "@/stores/personGroupStore";
import { useGroupStore } from "@/stores/groupStore";
import { useMealStore } from "@/stores/mealStore";
import { useMemo } from "react";


// this hook returns the total raw calorie allocation for a given person
// calculation: for each group, (raw grams allocated / 100) * avg kcal/100g of group
export function useSelectPersonRawCalories(personId: string): number {
  const allocations = usePersonGroupStore((s) => s.allocations);
  const groups = useGroupStore((s) => s.groups);
  const foods = useMealStore((s) => s.foods);

  return useMemo(() => {
    const personAlloc = allocations[personId] ?? {};
    let total = 0;

    // loop through each group this person has grams allocated to
    for (const [groupId, rawGrams] of Object.entries(personAlloc)) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) continue;

      // find all foods in this group based on ingredients foodId's
      const groupFoods = foods.filter((food) =>
        group.ingredients.some((ing) => ing.foodId === food.fdcId) &&
        !food.unitLabel // skip unit-based items when computing avg kcal/100g
      );


      if (groupFoods.length === 0) continue;

      // calculate average calories per 100g across the group
      const sumCal = groupFoods.reduce((sum, food) => {
        const nutrient = food.foodNutrients.find(
          (n) =>
            n.nutrientName === "Energy"); 
            return sum + (nutrient?.value ?? 0);
      }, 0);
      const avgCalPer100g = sumCal / groupFoods.length;

      // multiply raw grams by avg kcal/100g to get this group's calories for this person
      total += (rawGrams / 100) * avgCalPer100g;
    }

    return total;
  }, [allocations, groups, foods, personId]);
}

// this function calculates how many calories each person gets based on the actual calories total instead of planned calories
// I opted to proportionally remove/add calories to each person based on their share to keep things as even as possible
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
  // total calories originally requested across all people
  const totalRequestedKcal = people.reduce(
    (sum, p) => sum + p.targetCaloriesPerMeal * p.meals,
    0
  );

  // figure out kcal per gram based on cooked group weight
  const kcalPerGram = totalAvailableKcal / totalCookedGrams;

  // return each person's adjusted kcal and gram values based on their share
  return people.map((p) => {
    const plannedTotalKcal = p.targetCaloriesPerMeal * p.meals;
    const share = plannedTotalKcal / totalRequestedKcal;

    // scale calories basedon on each persons share of the total calories they planned
    const adjustedTotalKcal = share * totalAvailableKcal;
    const adjustedKcalPerMeal = adjustedTotalKcal / p.meals;

    // convert adjusted calories into gram weight
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
