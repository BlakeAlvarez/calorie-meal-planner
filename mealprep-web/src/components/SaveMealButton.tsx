import {useState} from "react";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
import {Button} from "@/components/ui/button";
import {SaveMealModal} from "@/components/SaveMealModal";
import {toast} from "sonner";
import {getEnergyKcal} from "@/utils/nutrientUtils";

const API_BASE = import.meta.env.VITE_API_BASE;

export function SaveMealButton({onSaved}: {onSaved?: () => void}) {
	const [showModal, setShowModal] = useState(false);
	const foods = useMealStore((s) => s.foods);
	const groups = useGroupStore((s) => s.groups);
	const people = usePeopleStore((s) => s.people);
	const personGroupPlans = usePersonGroupPlanStore((s) => s.plans);

	// calculate totalCalories based on current ingredient+food data
	function calcTotalCalories() {
		return groups.reduce((groupSum, group) => {
			return (
				groupSum +
				group.ingredients.reduce((ingSum, ing) => {
					const food = foods.find((f) => f.id === ing.foodId);
					const kcalPer100g = getEnergyKcal(
						food?.foodNutrients ?? [],
					);
					// only "g" supported for now
					const kcal =
						ing.unit === "g"
							? Math.round((ing.amount * kcalPer100g) / 100)
							: 0; // handle other units later
					return ingSum + kcal;
				}, 0)
			);
		}, 0);
	}

	const handleSave = async (
		name: string,
		createdBy: string,
		notes: string,
	) => {
		const totalMeals = people.reduce(
			(sum, p) => sum + (p.totalMeals ?? 1),
			0,
		);

		const totalCalories = calcTotalCalories();

		const payload = {
			Name: name,
			FoodsJson: JSON.stringify(foods, null, 2),
			GroupsJson: JSON.stringify(groups, null, 2),
			PersonGroupPlansJson: JSON.stringify(personGroupPlans, null, 2),
			CreatedBy: createdBy,
			CreatedAt: new Date().toISOString(),
			IsShared: true,
			Notes: notes,
			PeopleJson: JSON.stringify(people, null, 2),
			PeopleCount: people.length,
			TotalMeals: totalMeals,
			TotalCalories: totalCalories,
		};

		const res = await fetch(`${API_BASE}/meals`, {
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
			onSaved?.();
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
				onSave={handleSave}
			/>
		</>
	);
}
