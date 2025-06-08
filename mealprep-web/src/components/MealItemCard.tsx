// individual card for a food item in the meal
// draggable via @dnd-kit and editable for name and kcal/gram info
// syncs with mealStore when updated
// can be removed from a group or meal entirely

import React, {useState} from "react";
import {useDraggable} from "@dnd-kit/core";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Pencil, Save, X} from "lucide-react";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import type {Food} from "@/types/food";
import {getEnergyKcal} from "@/utils/nutrientUtils";

function isUnitBased(food: Food): boolean {
	return (
		food.servingSizes?.some((s) => s.unit !== "g" && s.unit !== "ml") ??
		false
	);
}

export function MealItemCard({food, groupId}: {food: Food; groupId?: string}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(food.description);
	const [editedCalories, setEditedCalories] = useState<number>(() =>
		getEnergyKcal(food.foodNutrients),
	);
	const [editedGrams, setEditedGrams] = useState<number>(100);

	const updateFood = useMealStore((s) => s.updateFood);
	const removeFood = useMealStore((s) => s.removeFood);
	const removeIngredientFromGroup = useGroupStore(
		(s) => s.removeIngredientFromGroup,
	);

	const {attributes, listeners, setNodeRef, transform, isDragging} =
		useDraggable({
			id: food.id,
		});

	const style: React.CSSProperties = {
		transform: transform
			? `translate(${transform.x}px, ${transform.y}px)`
			: undefined,
		opacity: isDragging ? 0.5 : 1,
		cursor: "grab",
		position: "relative",
	};

	const unitBased = isUnitBased(food);

	// for display only, calculate kcal per 100g if not unit-based
	const kcalPer100g = !unitBased
		? Math.round((editedCalories / editedGrams) * 1000) / 10
		: null;

	// update food in mealStore
	const handleSave = () => {
		updateFood(food.id, {
			description: editedName,
			foodNutrients: [
				...food.foodNutrients.filter(
					(n) =>
						n?.name &&
						n.name.toLowerCase() !== "energy" &&
						!n.name.toLowerCase().includes("calorie"),
				),
				{
					name: "Energy",
					value: editedCalories,
					unit: "kcal",
				},
			],
		});
		setIsEditing(false);
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="w-full max-w-md mx-auto"
		>
			{/* remove from group button */}
			{groupId && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						removeIngredientFromGroup(groupId, food.id);
					}}
					onTouchStart={(e) => e.stopPropagation()}
					className="absolute top-2 right-2 z-10 p-1 rounded-full bg-red-100 hover:bg-red-200"
					title="Remove from group"
				>
					<X className="w-4 h-4 text-red-600" />
				</button>
			)}

			<CardHeader>
				{isEditing ? (
					<Input
						value={editedName}
						onChange={(e) => setEditedName(e.target.value)}
					/>
				) : (
					<CardTitle className="text-base font-semibold">
						{food.description}
					</CardTitle>
				)}
			</CardHeader>

			<CardContent>
				{isEditing ? (
					<div className="flex gap-4 items-center">
						<Input
							type="number"
							className="w-24"
							value={editedCalories}
							onChange={(e) =>
								setEditedCalories(
									parseFloat(e.target.value) || 0,
								)
							}
							placeholder="kcal"
						/>
						{unitBased ? (
							<span className="text-sm text-muted-foreground">
								/ {food.servingSizes?.[0]?.unit || "unit"}
							</span>
						) : (
							<>
								<span>/</span>
								<Input
									type="number"
									className="w-16"
									value={editedGrams}
									onChange={(e) =>
										setEditedGrams(
											parseFloat(e.target.value) || 1,
										)
									}
									placeholder="g"
								/>
								<span>
									= {kcalPer100g?.toFixed(1)} kcal/100g
								</span>
							</>
						)}
					</div>
				) : (
					<div className="text-sm text-muted-foreground space-y-1">
						<p>
							{unitBased
								? `${editedCalories} kcal / ${food.servingSizes?.[0]?.unit || "unit"}`
								: `${kcalPer100g?.toFixed(1)} kcal / 100g`}
						</p>
						{/* optional nutrient breakdown */}
						{(() => {
							if (!food || !Array.isArray(food.foodNutrients))
								return null;

							const get = (name: string) =>
								food.foodNutrients.find(
									(n) =>
										n?.name &&
										n.name.toLowerCase() ===
											name.toLowerCase(),
								)?.value ?? 0;

							const protein = get("Protein");
							const fat = get("Total lipid (fat)");
							const carbs = get("Carbohydrate, by difference");

							return (
								<>
									{protein > 0 && <p>Protein: {protein}g</p>}
									{fat > 0 && <p>Fat: {fat}g</p>}
									{carbs > 0 && <p>Carbs: {carbs}g</p>}
								</>
							);
						})()}
					</div>
				)}
			</CardContent>

			{/* completely removes food from meal and associated groups */}
			<CardFooter className="flex justify-between items-center">
				<Button
					variant="destructive"
					size="sm"
					onClick={() => {
						const {removeIngredientFromGroup} =
							useGroupStore.getState();
						const groups = useGroupStore.getState().groups;
						const group = groups.find((g) =>
							g.ingredients.some((i) => i.foodId === food.id),
						);
						if (group) {
							removeIngredientFromGroup(group.id, food.id);
						}
						removeFood(food.id);
					}}
				>
					Remove
				</Button>

				{isEditing ? (
					<div className="flex gap-2">
						<Button size="sm" onClick={handleSave}>
							<Save className="w-4 h-4 mr-1" /> Save
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsEditing(false)}
						>
							<X className="w-4 h-4 mr-1" /> Cancel
						</Button>
					</div>
				) : (
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setIsEditing(true)}
					>
						<Pencil className="w-4 h-4 mr-1" /> Edit
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
