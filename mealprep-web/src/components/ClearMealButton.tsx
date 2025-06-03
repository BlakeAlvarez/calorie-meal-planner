// clears a meal of all ingredients, groups, and plans. could extend to people but commented out

import { useMealStore } from "@/stores/mealStore";
import { useGroupStore } from "@/stores/groupStore";
import { useIngredientPlanStore } from "@/stores/ingredientPlanStore";
import { usePeopleStore } from "@/stores/peopleStore";
import { Button } from "@/components/ui/button";

export function ClearMealButton() {
  const clearFoods = useMealStore((s) => s.clearMeal);
  const clearGroups = useGroupStore((s) => s.clearGroups);
  const clearPlans = useIngredientPlanStore((s) => s.clearPlans);
  const clearPeople = usePeopleStore((s) => s.clearPeople);

  const handleClear = () => {
    const confirm = window.confirm("Are you sure you want to clear the current meal setup?");
    if (!confirm) return;

    clearFoods();
    clearGroups();
    clearPlans();
    // clearPeople();
  };

  return <Button variant="destructive" onClick={handleClear}>Clear Meal</Button>;
}
