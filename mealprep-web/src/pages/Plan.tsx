// page to plan out calories in meal items based on kcal, weight in grams, or percentage of total calories

import { useEffect, useRef, useState } from "react";
import { useMealStore } from "@/stores/mealStore";
import { useIngredientPlanStore } from "@/stores/ingredientPlanStore";
import { useGroupStore } from "@/stores/groupStore";
import { usePeopleStore } from "@/stores/peopleStore";
import type { IngredientPlanMode } from "@/stores/ingredientPlanStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useStepNavigator } from "@/hooks/useStepNavigator";
import { StepProgressBar } from "@/components/StepProgressBar";
import { getEnergyKcal } from "@/utils/nutrientUtils";
import { recalculatePlans } from "@/lib/recalculatePlan";
import { syncGroupIngredientGramsFromPlans } from "@/lib/syncPlan";
import { Link } from "react-router-dom";
import { formatKcal, formatGrams } from "@/utils/format";

export default function Plan() {
  const { nextStep, prevStep } = useStepNavigator();
  const people = usePeopleStore((s) => s.people);
  const foods = useMealStore((s) => s.foods);
  const groups = useGroupStore((s) => s.groups);
  const plans = useIngredientPlanStore((s) => s.plans);
  const setPlan = useIngredientPlanStore((s) => s.setPlan);

  // calculates the total calories in a meal plan by adding all calories for all meals in the plan
  const totalCalories = people.reduce((sum, p) => sum + (p.targetCalories * p.meals), 0);

  // removes plans for any food that no longer exists in the meal MAY BE UNECESSARY GIVEN THE FLOW LIMITS NOW
  useEffect(() => {
    const currentFoodIds = new Set(foods.map((f) => f.fdcId));
    const { plans, removePlan } = useIngredientPlanStore.getState();
    plans.forEach((plan) => {
      if (!currentFoodIds.has(plan.foodId)) {
        removePlan(plan.foodId);
      }
    });
  }, [foods]);

  // calculates values based on the saved plans
  useEffect(() => {
    if (people.length > 0 && plans.length > 0) {
      recalculatePlans({ plans, people, foods, setPlan });
    }
  }, [people.length]);

  // calculates the calories per 100 grams of a food item
  const getKcalPer100g = (fdcId: number): number => {
    const food = foods.find((f) => f.fdcId === fdcId);
    return food ? getEnergyKcal(food.foodNutrients) : 0;
  };

  // gets kcal per unit for a unit based item
  const getKcalPerUnit = (fdcId: number): number => {
    const food = foods.find((f) => f.fdcId === fdcId);
    if (!food || !food.isUnitBased) return 0;
    const kcalPer100g = getEnergyKcal(food.foodNutrients);
    const gramsPerUnit = food.gramsPerUnit ?? 100;
    if (!kcalPer100g || gramsPerUnit <= 0) return 0;
    return Math.round(((gramsPerUnit / 100) * kcalPer100g) * 10) / 10;
  };

  const actualCalories = plans.reduce((sum, p) => sum + (p.kcal ?? 0), 0);
  const kcalRemaining = totalCalories - actualCalories;
  const percentRemaining = Math.round((kcalRemaining / totalCalories) * 1000) / 10;
  
  // map each foodId to the group it belongs to
  const foodIdToGroupId = new Map<number, string>();
  groups.forEach((group) => {
    group.ingredients.forEach((ing) => {
      foodIdToGroupId.set(ing.foodId, group.id);
    });
  });

  const groupedFoods: Record<string, typeof foods> = {};
  const ungroupedFoods: typeof foods = [];

  for (const food of foods) {
    const groupId = foodIdToGroupId.get(food.fdcId);
    if (groupId) {
      if (!groupedFoods[groupId]) groupedFoods[groupId] = [];
      groupedFoods[groupId].push(food);
    } else {
      ungroupedFoods.push(food);
    }
  }

  const groupWeights: Record<string, number> = {};
  groups.forEach((group) => {
    const total = group.ingredients.reduce((sum, ing) => {
      const plan = plans.find((p) => p.foodId === ing.foodId);
      return sum + (plan?.grams ?? 0);
    }, 0);
    groupWeights[group.id] = total;
  });

  // live update plan state based on user input
  const renderFoodCard = (food: typeof foods[number]) => {
    const existing = plans.find((p) => p.foodId === food.fdcId);
    const kcalPer100g = getKcalPer100g(food.fdcId);
    const kcalPerUnit = getKcalPerUnit(food.fdcId);
    const isUnitBased = !!food.unitLabel;

    const [mode, setMode] = useState<IngredientPlanMode>(existing?.mode ?? "grams");
    const inputRef = useRef<HTMLInputElement | null>(null);

    // only initialize input once on mount
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
      if (existing?.value != null) {
        setInputValue(existing.value.toString());
      }
    }, [food.fdcId, existing?.value]);

    const numericInput = parseFloat(inputValue) || 0;

    const rawKcal = isUnitBased
      ? numericInput * kcalPerUnit
      : mode === "calories"
      ? numericInput
      : mode === "grams"
      ? (numericInput / 100) * kcalPer100g
      : (numericInput / 100) * totalCalories;

    const kcal = Math.round(rawKcal * 10) / 10;
    const grams = !isUnitBased && kcalPer100g > 0 ? Math.round((rawKcal / kcalPer100g) * 1000) / 10 : 0;

    const handleModeSwitch = (newMode: IngredientPlanMode) => {
      const baseValue = parseFloat(inputValue) || 0;

      // Recalculate kcal based ONLY on the current input and mode
      const rawKcal = isUnitBased
        ? baseValue * kcalPerUnit
        : mode === "calories"
        ? baseValue
        : mode === "grams"
        ? (baseValue / 100) * kcalPer100g
        : (baseValue / 100) * actualCalories;

      const kcal = Math.round(rawKcal * 10) / 10;
      const grams = !isUnitBased && kcalPer100g > 0
        ? Math.round((kcal / kcalPer100g) * 1000) / 10
        : 0;

      const percent = mode === "percent"
        ? baseValue // trust user input if they were already in percent mode
        : Math.round((kcal / actualCalories) * 1000) / 10;

      // Now determine the correct value for the new mode
      let newValue = "";
      if (newMode === "grams") {
        newValue = grams.toFixed(1);
      } else if (newMode === "calories") {
        newValue = kcal.toFixed(1);
      } else if (newMode === "percent") {
        newValue = percent.toFixed(1);
      }

      setMode(newMode);
      setInputValue(newValue);
      setPlan(food.fdcId, newMode, parseFloat(newValue), grams, kcal, percent);
      inputRef.current?.focus();
    };

    // the percent value to display
    const displayPercent = mode === "percent"
      ? Number(inputValue || "0").toFixed(1)
      : (Math.round((kcal / actualCalories) * 1000) / 10).toFixed(1);

      
    return (
      <Card key={food.fdcId}>
        <CardHeader>
          <CardTitle className="text-base">{food.description}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isUnitBased
              ? `${formatKcal(kcalPerUnit)} / ${food.unitLabel}`
              : `${formatKcal(kcalPer100g)} / 100g`}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="number"
              className="w-28"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                const parsed = parseFloat(val) || 0;
                const gramsVal = isUnitBased ? 0 : (parsed / 100) * kcalPer100g;
                const kcalVal = isUnitBased ? parsed * kcalPerUnit : (parsed / 100) * kcalPer100g;
                const percentVal = mode === "percent"
                  ? parsed
                  : Math.round((kcalVal / actualCalories) * 1000) / 10;

                setPlan(food.fdcId, isUnitBased ? "calories" : mode, parsed, gramsVal, kcalVal, percentVal);
              }}
              placeholder={isUnitBased ? `e.g. 2` : ""}
            />
            {!isUnitBased && (
              <>
                <Button
                  variant={mode === "grams" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleModeSwitch("grams")}
                >
                  g
                </Button>
                <Button
                  variant={mode === "calories" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleModeSwitch("calories")}
                >
                  kcal
                </Button>
                <Button
                  variant={mode === "percent" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleModeSwitch("percent")}
                >
                  %
                </Button>
              </>
            )}
          </div>
          <p className="text-s text-muted-foreground">
            →
            {isUnitBased
              ? `${formatKcal(kcal)} (${displayPercent}%)`
              : `${formatGrams(grams)} (${(grams / 453.592).toFixed(2)} lb), ${kcal.toFixed(1)} kcal (${displayPercent}%)`}
          </p>

        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-6 p-6">
      {/* shows user progress bar for meal setup flow */}
      <StepProgressBar />

      {/* header and next/back navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={prevStep}>Back</Button>
        <h1 className="text-2xl font-bold text-center flex-1">Planning: Ingredients & Calories</h1>

        <Button asChild>
          <Link to="/meal-summary">📄 Print Plan</Link>
        </Button>

        <Button
          onClick={() => {

            recalculatePlans({
              plans: useIngredientPlanStore.getState().plans,
              setPlan: useIngredientPlanStore.getState().setPlan,
              foods: useMealStore.getState().foods,
              people: usePeopleStore.getState().people,
            });

          const plans = useIngredientPlanStore.getState().plans;
          const groups = useGroupStore.getState().groups;

          const syncedGroups = syncGroupIngredientGramsFromPlans(groups, plans);
          useGroupStore.getState().setGroups(syncedGroups);
            
            nextStep();
          }}
        >
          Save & Continue
        </Button>

      </div>

      {/* display total target calories left in meal plan, and total calories planned given user inputs */}
      <p className="text-sm text-muted-foreground">
        Total Target Calories: {formatKcal(totalCalories)}
      </p>
      <p className="text-sm text-muted-foreground">
        Total Actual Calories: {formatKcal(actualCalories)}
      </p>
      <p className={`text-sm font-semibold ${kcalRemaining < 0 ? "text-red-500" : "text-green-600"}`}>
        {formatKcal(kcalRemaining)} ({Math.abs(percentRemaining).toFixed(1)}%)
        {kcalRemaining < 0 ? " over" : " remaining"}
      </p>

      {/* display each group's total raw weight */}
      <div className="space-y-1">
        {Object.entries(groupWeights).map(([id, grams]) => {
          const group = groups.find((g) => g.id === id);
          return (
            <p key={id} className="text-sm text-muted-foreground">
              {group?.name || `Group ${group?.displayId || "?"}`} Weight: {formatGrams(grams)} ({(grams / 453.592).toFixed(2)} lb)
            </p>
          );
        })}
      </div>

      {people.length > 0 && actualCalories > 0 && (
        <div className="space-y-2">
          <h2 className="text-md font-semibold mt-4">Per-Person Planned Calories</h2>
          {people.map((person) => {
            const totalRequested = person.targetCalories * person.meals;
            const totalPlanned = people.reduce((sum, p) => sum + p.targetCalories * p.meals, 0);
            const share = totalRequested / totalPlanned;
            const adjustedTotalKcal = share * actualCalories;
            const perMeal = adjustedTotalKcal / person.meals;

            return (
              <div key={person.id} className="flex justify-between border-b pb-1 text-sm">
                <span>{person.name} ({person.meals} meals)</span>
                <span className="text-muted-foreground">
                  {formatKcal(adjustedTotalKcal)} total, {formatKcal(perMeal)} / meal
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* render grouped foods */}
      {Object.entries(groupedFoods).map(([groupId, foods]) => {
        const group = groups.find((g) => g.id === groupId);
        return (
          <div key={groupId} className="space-y-2">
            <h2 className="font-semibold text-lg">{group?.name || "Unnamed Group"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foods.map(renderFoodCard)}
            </div>
          </div>
        );
      })}

      {/* render ungrouped foods */}
      {ungroupedFoods.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-lg text-yellow-600">Ungrouped Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ungroupedFoods.map(renderFoodCard)}
          </div>
        </div>
      )}
    </div>
  );
}
