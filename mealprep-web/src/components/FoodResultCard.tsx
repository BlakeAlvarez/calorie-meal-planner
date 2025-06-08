import {Button} from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {toast} from "sonner";

import type {Food} from "@/types/food";
import type {Nutrition} from "@/types/nutrition";
import {useMealStore} from "@/stores/mealStore";
import {getEnergyKcal} from "@/utils/nutrientUtils";

// card display for a food result from the USDA API or db
// shows key macros and lets user pick raw/cooked before adding to meal (maybe obsolete)
export function FoodResultCard({
	food,
	multiAdd,
	onClose,
}: {
	readonly food: Food;
	readonly multiAdd: boolean;
	readonly onClose: () => void;
}) {
	// helper function to grab value of specific nutrient by name or number
	function getNutrientValue(nutrients: Nutrition[], key: string): number {
		const match = nutrients.find((n) => n.name === key);
		return match?.value && match.value > 0 ? match.value : 0;
	}

	const energy = getEnergyKcal(food.foodNutrients);
	const protein = getNutrientValue(food.foodNutrients, "Protein");
	const fat = getNutrientValue(food.foodNutrients, "Total lipid (fat)");
	const carbs = getNutrientValue(
		food.foodNutrients,
		"Carbohydrate, by difference",
	);

	const addFoodToMeal = useMealStore((state) => state.addFood);

	// adds food to meal store
	const handleAdd = () => {
		const updatedFood = {...food};
		addFoodToMeal(updatedFood);
		toast("Food added successfully", {
			description: `${food.description} added to your meal.`,
		});

		if (!multiAdd) {
			onClose();
		}
	};

	return (
		<Card className="flex-1 min-w-[300px] max-w-[600px]">
			<CardHeader>
				<CardTitle className="text-lg font-semibold">
					{food.description}
				</CardTitle>
				<CardDescription>
					{food.brandOwner
						? `Brand: ${food.brandOwner}`
						: "Generic Item"}
				</CardDescription>
			</CardHeader>

			<p className="text-sm text-muted-foreground px-6 -mt-2">
				Portion size: 100g
			</p>

			<CardContent className="space-y-2 text-sm">
				<div className="flex justify-between">
					<span>Calories</span>
					<span>{energy != null ? `${energy} kcal` : "N/A"}</span>
				</div>
				<div className="flex justify-between">
					<span>Protein</span>
					<span>{protein != null ? `${protein} g` : "N/A"}</span>
				</div>
				<div className="flex justify-between">
					<span>Fat</span>
					<span>{fat != null ? `${fat} g` : "N/A"}</span>
				</div>
				<div className="flex justify-between">
					<span>Carbs</span>
					<span>{carbs != null ? `${carbs} g` : "N/A"}</span>
				</div>
			</CardContent>

			<CardFooter className="flex justify-end">
				<Button onClick={handleAdd}>Add to Meal</Button>
			</CardFooter>
		</Card>
	);
}
