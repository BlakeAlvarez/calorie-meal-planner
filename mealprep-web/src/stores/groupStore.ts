import {create} from "zustand";
import {persist, createJSONStorage} from "zustand/middleware";
import {v4 as uuidv4} from "uuid";
import type {Group} from "@/types/group";
import type {GroupIngredient} from "@/types/groupIngredient";
import {pastelGroupColors, assignColorsToGroups} from "@/utils/colors";

// state for all groups
interface GroupState {
	groups: Group[];
	addGroup: (name: string) => void;
	deleteGroup: (groupId: string) => void;
	renameGroup: (groupId: string, name: string) => void;
	addIngredientToGroup: (
		groupId: string,
		ingredient: GroupIngredient,
	) => void;
	setCookedWeight: (groupId: string, grams: number) => void;
	setIngredientAmount: (
		groupId: string,
		foodId: string,
		amount: number,
		unit: string,
	) => void;
	removeIngredientFromGroup: (groupId: string, foodId: string) => void;
	setGroups: (groups: Group[]) => void;
	clearGroups: () => void;
}

export const useGroupStore = create<GroupState>()(
	persist(
		(set, _get) => ({
			groups: [],

			addGroup: (name) =>
				set((state) => {
					const nextDisplayId = state.groups.length + 1;
					const color =
						pastelGroupColors[
							state.groups.length % pastelGroupColors.length
						];
					return {
						groups: [
							...state.groups,
							{
								id: uuidv4(),
								name,
								color,
								displayId: nextDisplayId,
								ingredients: [],
							},
						],
					};
				}),

			deleteGroup: (groupId) =>
				set((state) => ({
					groups: state.groups.filter(
						(group) => group.id !== groupId,
					),
				})),

			renameGroup: (groupId, name) =>
				set((state) => ({
					groups: state.groups.map((group) =>
						group.id === groupId ? {...group, name} : group,
					),
				})),

			// add an ingredient (food) to a group (with all needed info: foodId, amount, unit, kcal, etc.)
			addIngredientToGroup: (groupId, ingredient) =>
				set((state) => ({
					groups: state.groups.map((group) =>
						group.id === groupId
							? group.ingredients.some(
									(i) => i.foodId === ingredient.foodId,
								)
								? group
								: {
										...group,
										ingredients: [
											...group.ingredients,
											ingredient,
										],
									}
							: group,
					),
				})),

			// set the cooked weight of a group in grams
			setCookedWeight: (groupId, grams) =>
				set((state) => ({
					groups: state.groups.map((group) =>
						group.id === groupId
							? {...group, cookedWeightGrams: grams}
							: group,
					),
				})),

			// update amount/unit for a given ingredient in a group
			setIngredientAmount: (groupId, foodId, amount, unit) =>
				set((state) => ({
					groups: state.groups.map((group) =>
						group.id === groupId
							? {
									...group,
									ingredients: group.ingredients.map((ing) =>
										ing.foodId === foodId
											? {...ing, amount, unit}
											: ing,
									),
								}
							: group,
					),
				})),

			removeIngredientFromGroup: (groupId, foodId) =>
				set((state) => ({
					groups: state.groups.map((group) =>
						group.id === groupId
							? {
									...group,
									ingredients: group.ingredients.filter(
										(ing) => ing.foodId !== foodId,
									),
								}
							: group,
					),
				})),

			setGroups: (groups) =>
				set({
					groups: assignColorsToGroups(groups),
				}),

			clearGroups: () => set({groups: []}),
		}),
		{
			name: "group-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
