// component to show per person calorie and gram totals for foods

import { usePeopleStore } from "@/stores/peopleStore";
import { usePersonGroupStore } from "@/stores/personGroupStore";
import { useGroupStore } from "@/stores/groupStore";
import { useMealStore } from "@/stores/mealStore";
import { useSelectPersonRawCalories } from "@/lib/calculations";
import type { IngredientGroup } from "@/stores/groupStore";
import type { Food } from "@/types/food";

function PersonCard({
  personId,
  name,
  groupAlloc,
  groups,
  foods
}: {
  personId: string;
  name: string;
  groupAlloc: Record<string, number>;
  groups: IngredientGroup[];
  foods: Food[];
}) {
  const rawCalories = useSelectPersonRawCalories(personId);

  return (
    <div className="border p-4 rounded">
      <h3 className="font-medium text-lg mb-2">{name}</h3>

      <div className="space-y-1 text-sm">
        {Object.entries(groupAlloc).map(([groupId, grams]) => {
          const group = groups.find((group) => group.id === groupId);
          if (!group) return null;

    const groupFoods = foods.filter((food) =>
      group.ingredients.some((ing) => ing.foodId === food.fdcId)
    );

    const avgKcalPer100g =
      groupFoods.length > 0
        ? groupFoods.reduce((sum: number, food: Food) => {
            const kcal = food.foodNutrients.find((n) => n.nutrientName === "Energy")?.value ?? 0;
            return sum + kcal;
          }, 0) / groupFoods.length
        : 0;

      const safeGrams = typeof grams === "number" && !isNaN(grams) ? grams : 0;
      const calories = (safeGrams / 100) * avgKcalPer100g;


          return (
            <div key={groupId} className="flex justify-between border-b pb-1">
              <span>
                {group.name}: {safeGrams.toFixed(0)}g
              </span>
              <span className="text-muted-foreground">
                {calories.toFixed(1)} kcal
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 font-semibold flex justify-between">
        <span>Total:</span>
        <span>{rawCalories.toFixed(1)} kcal</span>
      </div>
    </div>
  );
}

export function PersonTotals() {
  const people = usePeopleStore((s) => s.people);
  const allocations = usePersonGroupStore((s) => s.allocations);
  const groups = useGroupStore((s) => s.groups);
  const foods = useMealStore((s) => s.foods);

  if (people.length === 0 || groups.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Per-Person Totals</h2>
      {people.map((person) => {
        const groupAlloc = allocations[person.id] ?? {};
        return (
          <PersonCard
            key={person.id}
            personId={person.id}
            name={person.name}
            groupAlloc={groupAlloc}
            groups={groups}
            foods={foods}
          />
        );
      })}
    </div>
  );
}
