import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
import {Button} from "@/components/ui/button";

export function ClearMealButton() {
	const clearFoods = useMealStore((s) => s.clearMeal);
	const clearGroups = useGroupStore((s) => s.clearGroups);
	const clearPlans = usePersonGroupPlanStore((s) => s.clearAllocations);
	// maybe add this as well: usePeopleStore((s) => s.clearPeople)();

	const handleClear = () => {
		const confirm = window.confirm(
			"Are you sure you want to clear the current meal setup?",
		);
		if (!confirm) return;

		clearFoods();
		clearGroups();
		clearPlans();
	};

	return (
		<Button variant="destructive" onClick={handleClear}>
			Clear Meal
		</Button>
	);
}
