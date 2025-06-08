// store for entire meal and all foods within

import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {Food} from "@/types/food";

// mealstate represents the food items within the meal planning stage of a meal
interface MealState {
	foods: Food[];
	addFood: (food: Food) => void;
	removeFood: (id: string) => void;
	clearMeal: () => void;
	updateFood: (id: string, updated: Partial<Food>) => void;
	setFoods: (foods: Food[]) => void;
}

export const useMealStore = create<MealState>()(
	persist(
		(set, _get) => ({
			// all food items in the meal
			foods: [],

			// method to add a food to the meal. intakes food item
			addFood: (food) =>
				set((state) => ({
					foods: state.foods.some((f) => f.id === food.id)
						? state.foods
						: [...state.foods, food],
				})),

			// method to remove a food from the meal. intakes the food ID
			removeFood: (id) =>
				set((state) => ({
					foods: state.foods.filter((f) => f.id !== id),
				})),

			// removes all food items from the meal entirely
			clearMeal: () => set({foods: []}),

			// updates a food items information. intakes food ID and the updated food item
			updateFood: (id, updated) =>
				set((state) => ({
					foods: state.foods.map((f) =>
						f.id === id ? {...f, ...updated} : f,
					),
				})),

			// loads/stores food array from previous session/saved meals
			setFoods: (foods) => set({foods}),
		}),
		{
			name: "meal-storage",
		},
	),
);
