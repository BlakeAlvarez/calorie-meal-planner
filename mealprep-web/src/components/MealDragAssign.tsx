// main drag and drop interface for assigning foods to ingredient groups
// ungrouped foods are shown at the top, followed by group drop zones
// uses @dnd-kit to handle the dragging logic

import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	MouseSensor,
	TouchSensor,
	type DragEndEvent,
} from "@dnd-kit/core";

import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {MealItemCard} from "@/components/MealItemCard";
import {IngredientGroup} from "@/components/IngredientGroup";
import {
	getEnergyKcal,
	getCarbs,
	getFats,
	getProtein,
} from "@/utils/nutrientUtils";

export function MealDragAssign() {
	const {foods} = useMealStore();
	const {groups, addIngredientToGroup} = useGroupStore();

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 10, // user must move 10px before drag starts. used to aid in button clicks
			},
		}),
		useSensor(TouchSensor),
	);

	const groupedFoodIds = groups.flatMap((group) =>
		group.ingredients.map((ing) => ing.foodId),
	);

	const ungroupedFoods = foods.filter(
		(food) => !groupedFoodIds.includes(food.id),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const {active, over} = event;
		if (!over) return;

		const foodId = String(active.id);
		const groupId = String(over.id);

		// Find the food by ID
		const food = foods.find((f) => f.id === foodId);
		if (!food) return;

		// Construct the GroupIngredient for this drag/drop (unit/amount defaults for now)
		const newIngredient = {
			foodId: food.id,
			amount: 100, // default, or use last used
			unit: "g", // default
			kcal: getEnergyKcal(food.foodNutrients),
			protein: getProtein(food.foodNutrients),
			fat: getFats(food.foodNutrients),
			carbs: getCarbs(food.foodNutrients),
		};

		addIngredientToGroup(groupId, newIngredient);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			{/* ungrouped foods */}
			{ungroupedFoods.length > 0 && (
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-2">
						Ungrouped Foods
					</h2>
					<div className="flex flex-wrap gap-4">
						{ungroupedFoods.map((food) => (
							<MealItemCard key={food.id} food={food} />
						))}
					</div>
				</div>
			)}

			{/* ingredient groups */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{groups.map((group) => (
					<IngredientGroup key={group.id} group={group} />
				))}
			</div>
		</DndContext>
	);
}
