// visual container for each ingredient group
// allows renaming and deletion, and shows foods assigned to the group
// used inside the MealDragAssign component

import React, {useState} from "react";
import {useDroppable} from "@dnd-kit/core";
import {useMealStore} from "@/stores/mealStore";
import type {IngredientGroup as IngredientGroupType} from "@/stores/groupStore";
import {useGroupStore} from "@/stores/groupStore";
import {MealItemCard} from "./MealItemCard";
import {Pencil, Save, UtensilsCrossed} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

interface IngredientGroupProps {
	group: IngredientGroupType;
}

export const IngredientGroup: React.FC<IngredientGroupProps> = ({group}) => {
	// dnd-kit droppable hook to allow dragging foods into group
	const {setNodeRef, isOver} = useDroppable({
		id: group.id,
	});

	const {foods} = useMealStore();

	// get only the foods currently assigned to this group
	const groupFoods = foods.filter((food) =>
		group.ingredients.some((ing) => ing.foodId === food.fdcId),
	);

	const renameGroup = useGroupStore((s) => s.renameGroup);
	const deleteGroup = useGroupStore((s) => s.deleteGroup);

	const [isEditing, setIsEditing] = useState(false);
	const [newName, setNewName] = useState(group.name);

	// rename group and exit edit mode
	const handleSave = () => {
		renameGroup(group.id, newName.trim() || group.name);
		setIsEditing(false);
	};

	// delete the group
	const handleDelete = () => {
		deleteGroup(group.id);
		setIsEditing(false);
	};

	return (
		<div
			ref={setNodeRef}
			className={`border rounded p-2 mb-2 transition ${
				isOver ? "bg-blue-100 dark:bg-blue-950" : "bg-muted"
			}`}
		>
			<div className="flex items-center justify-between mb-2">
				{isEditing ? (
					<>
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="mr-2"
						/>
						<div className="flex gap-1">
							<Button size="icon" onClick={handleSave}>
								<Save className="w-4 h-4" />
							</Button>
							<Button
								size="icon"
								onClick={handleDelete}
								variant="destructive"
							>
								<UtensilsCrossed className="w-4 h-4" />
							</Button>
						</div>
					</>
				) : (
					<>
						<span className="font-medium text-sm">
							Group {group.displayId}: {group.name}
						</span>
						<Button
							size="icon"
							variant="ghost"
							onClick={() => setIsEditing(true)}
						>
							<Pencil className="w-4 h-4" />
						</Button>
					</>
				)}
			</div>

			{/* show all foods in this group */}
			<div className="flex flex-wrap gap-2">
				{groupFoods.map((food) => (
					<MealItemCard key={food.fdcId} food={food} />
				))}
			</div>
		</div>
	);
};
