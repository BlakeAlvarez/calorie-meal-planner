// button to save a meal in the db

import {useState} from "react";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {Button} from "@/components/ui/button";
import {SaveMealModal} from "@/components/SaveMealModal";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import {toast} from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE;

export function SaveMealButton() {
	const [showModal, setShowModal] = useState(false);
	const foods = useMealStore((s) => s.foods);
	const groups = useGroupStore((s) => s.groups);
	const people = usePeopleStore((s) => s.people);

	const handleSave = async (
		name: string,
		createdBy: string,
		notes: string,
	) => {
		const plans = useIngredientPlanStore.getState().plans;

		// recalculate kcal per food
		const resolvedPlans = plans.map((plan) => {
			const food = foods.find((f) => f.fdcId === plan.foodId);
			if (!food) return {...plan, kcal: 0};

			const kcalPer100g = getEnergyKcal(food.foodNutrients);
			const isUnitBased = !!food.unitLabel;
			const gramsPerUnit = food.gramsPerUnit ?? 0;
			const kcalPerUnit =
				gramsPerUnit > 0 ? (gramsPerUnit / 100) * kcalPer100g : 0;

			const totalTargetCalories = people.reduce(
				(sum, p) => sum + p.targetCalories * p.meals,
				0,
			);

			let kcal = 0;
			if (isUnitBased) {
				kcal = plan.value * kcalPerUnit;
			} else if (plan.mode === "calories") {
				kcal = plan.value;
			} else if (plan.mode === "grams") {
				kcal = (plan.value / 100) * kcalPer100g;
			} else if (plan.mode === "percent") {
				kcal = (plan.value / 100) * totalTargetCalories;
			}

			return {...plan, kcal};
		});

		const totalCalories = resolvedPlans.reduce(
			(sum, p) => sum + (p.kcal ?? 0),
			0,
		);

		const mergedGroups = groups.map((group) => {
			const enrichedIngredients = group.ingredients.map((ingredient) => {
				const plan = resolvedPlans.find(
					(p) => p.foodId === ingredient.foodId,
				);
				return {
					...ingredient,
					mode: plan?.mode ?? "grams",
					value: plan?.value ?? 0,
					grams: plan?.grams ?? 0,
					kcal: plan?.kcal ?? 0,
					percent:
						plan?.mode === "percent"
							? plan.value
							: plan?.kcal && totalCalories > 0
								? Math.round(
										(plan.kcal / totalCalories) * 1000,
									) / 10
								: 0,
				};
			});

			return {
				...group,
				ingredients: enrichedIngredients,
				totalCalories: enrichedIngredients.reduce(
					(sum, ing) => sum + (ing.kcal ?? 0),
					0,
				),
			};
		});

		const peopleSummary = people.map((p) => ({
			meals: p.meals,
			targetCalories: p.targetCalories,
		}));

		const totalMeals = people.reduce((sum, p) => sum + p.meals, 0);

		const payload = {
			Name: name,
			FoodsJson: JSON.stringify(foods, null, 2),
			GroupsJson: JSON.stringify(mergedGroups, null, 2),
			CreatedBy: createdBy,
			CreatedAt: new Date().toISOString(),
			IsShared: true,
			Notes: notes,
			PeopleJson: JSON.stringify(peopleSummary, null, 2),
			PeopleCount: people.length,
			TotalMeals: totalMeals,
			TotalCalories: totalCalories,
		};

		const res = await fetch(`${API_BASE}/api/meals`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(payload),
		});

		const text = await res.text();
		try {
			const data = JSON.parse(text);
			toast.success("Meal saved!", {
				description: `Share link: /shared/meal/${data.id}`,
				action: {
					label: "Copy Link",
					onClick: () => {
						navigator.clipboard.writeText(
							`/shared/meal/${data.id}`,
						);
					},
				},
			});
		} catch (e) {
			console.error("Failed to parse JSON:", e);
			toast.error("Something went wrong saving the meal.");
		}
	};

	return (
		<>
			<Button onClick={() => setShowModal(true)}>Save Meal</Button>
			<SaveMealModal
				open={showModal}
				onClose={() => setShowModal(false)}
				onSave={(name, createdBy, notes) => {
					handleSave(name, createdBy, notes);
				}}
			/>
		</>
	);
}
