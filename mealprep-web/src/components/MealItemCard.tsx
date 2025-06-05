// individual card for a food item in the meal
// draggable via @dnd-kit and editable for name and kcal/gram info
// syncs with ingredientPlanStore and mealStore when updated
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
import {usePeopleStore} from "@/stores/peopleStore";
import type {Food} from "@/types/food";
import {useIngredientPlanStore} from "@/stores/ingredientPlanStore";
import {getEnergyKcal} from "@/utils/nutrientUtils";

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
	const removePlan = useIngredientPlanStore((s) => s.removePlan);
	const setPlan = useIngredientPlanStore((s) => s.setPlan);
	const plans = useIngredientPlanStore((s) => s.plans);

	const {attributes, listeners, setNodeRef, transform, isDragging} =
		useDraggable({
			id: food.fdcId.toString(),
		});

	const style: React.CSSProperties = {
		transform: transform
			? `translate(${transform.x}px, ${transform.y}px)`
			: undefined,
		opacity: isDragging ? 0.5 : 1,
		cursor: "grab",
		position: "relative",
	};

	const isUnitBased = food.isUnitBased;

	const kcalPer100g = !isUnitBased
		? Math.round((editedCalories / editedGrams) * 1000) / 10
		: null;

	// update food in mealStore and recalculate plan value if it exists
	const handleSave = () => {
		const nutrient: any = {
			nutrientName: "Energy",
			nutrientNumber: "999",
			unitName: "kcal",
			nutrientId: 999,
			value: isUnitBased ? editedCalories : (kcalPer100g ?? 0),
		};

		updateFood(food.fdcId, {
			description: editedName,
			foodNutrients: [nutrient],
		});

		const existing = plans.find((p) => p.foodId === food.fdcId);
		if (existing) {
			const grams = !isUnitBased ? editedGrams : 0;
			const kcal = isUnitBased
				? editedCalories
				: Math.round((editedGrams / 100) * (kcalPer100g ?? 0) * 10) /
					10;
			const percent = usePeopleStore
				.getState()
				.people.reduce((sum, p) => sum + p.meals * p.targetCalories, 0);

			const percentValue = percent > 0 ? (kcal / percent) * 100 : 0;

			setPlan(
				food.fdcId,
				existing.mode,
				existing.value,
				grams,
				kcal,
				percentValue,
			);
		}

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
						removeIngredientFromGroup(groupId, food.fdcId);
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
						{isUnitBased ? (
							<span className="text-sm text-muted-foreground">
								/ {food.unitLabel}
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
							{isUnitBased
								? `${editedCalories} kcal / ${food.unitLabel}`
								: `${kcalPer100g?.toFixed(1)} kcal / 100g`}
						</p>

						{/* optional nutrient breakdown */}
						{(() => {
							const get = (name: string) =>
								food.foodNutrients.find(
									(n) => n.nutrientName === name,
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

			{/* completely removes food from meal and associated plan and all groups */}
			<CardFooter className="flex justify-between items-center">
				<Button
					variant="destructive"
					size="sm"
					onClick={() => {
						const {removeIngredientFromGroup} =
							useGroupStore.getState();
						const groups = useGroupStore.getState().groups;
						const group = groups.find((g) =>
							g.ingredients.some((i) => i.foodId === food.fdcId),
						);

						if (group) {
							removeIngredientFromGroup(group.id, food.fdcId);
						}

						removeFood(food.fdcId);
						removePlan(food.fdcId);
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
