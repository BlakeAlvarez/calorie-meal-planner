// page used to load a saved meal. displays that the user is viewing a saved meal
// then transfers saved meal ingredients to BuildMeal page

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMealStore } from "@/stores/mealStore";
import { useGroupStore } from "@/stores/groupStore";
import { getMeal } from "@/lib/useMealApi";
import { Button } from "@/components/ui/button";
import { usePeopleStore } from "@/stores/peopleStore";
import { useStepNavigator } from "@/hooks/useStepNavigator";
import { useIngredientPlanStore } from "@/stores/ingredientPlanStore";

export default function SharedMealPage() {
  const { id } = useParams(); // get meal id from URL
  const { goToStep } = useStepNavigator();
  const [loading, setLoading] = useState(true);
  const [mealName, setMealName] = useState("");

  // get people from people store to possibly skip people setup if already exist
  const people = usePeopleStore((s) => s.people);

  // load shared meal from db and store it in meal + group stores
useEffect(() => {
  async function loadMeal() {
    try {
      const data = await getMeal(Number(id));
      const foods = JSON.parse(data.foodsJson);
      const groups = JSON.parse(data.groupsJson);

      useMealStore.getState().setFoods(foods);           // load foods
      useGroupStore.getState().setGroups(groups);         // load groups
      setMealName(data.name);                             // set meal name

      // Clear existing plans
      const { clearPlans, setPlan } = useIngredientPlanStore.getState();
      clearPlans();

      // Load plans from each group ingredient
      for (const group of groups) {
        for (const ing of group.ingredients) {
          setPlan(
            ing.foodId,
            ing.mode,
            ing.value,
            ing.grams,
            ing.kcal,
            ing.percent
          );
        }
      }

    } catch (err) {
      console.error("Error loading meal:", err);
    } finally {
      setLoading(false);
    }
  }

  if (id) loadMeal();
}, [id]);


  // show loading message while meal is being fetched
  if (loading) return <p className="p-4">Loading meal...</p>;


  return (
    <div className="p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold">Shared Meal: {mealName}</h1>
      <p>This meal has been preloaded. You can adjust people, weights, or ingredients now.</p>

      {/* button to continue to BuildMeal page */}
      <Button
        onClick={() => {
          if (people.length > 0) {
            goToStep("meal");
          } else {
            goToStep("setup");
          }
        }}
      >
        Start Planning
      </Button>
    </div>
  );
}
