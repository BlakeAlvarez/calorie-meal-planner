// zustand stores for various data throughout the application flow

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { usePersonGroupStore } from "@/stores/personGroupStore";

// this stores ingredient groups. each ingredient group
// each ingredient group contains:
// id: the id for the group store in UUID, typically made from date of creation
// name: the given name for the ingredient group, "Fried Rice"
// displayId: the id to display which group number (1, 2, 3, etc.)
// ingredients: this is the ingredients that are in this group. each ingredient has a food id and grams that exist in the meal
export interface IngredientGroup {
  id: string;
  name: string;
  displayId: number; // <== new
  cookedWeightGrams?: number;
  ingredients: {
    foodId: number;
    grams: number;
  }[];
}


// this group state takes care of storing all of the groups
// groups: all ingredient groups in the meal
interface GroupState {
  groups: IngredientGroup[];
  addGroup: (name: string) => void;
  deleteGroup: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  addFoodToGroup: (groupId: string, foodId: number) => void;
  setCookedWeight: (groupId: string, grams: number) => void;
  setIngredientGrams: (groupId: string, foodId: number, grams: number) => void;
  removeIngredientFromGroup: (groupId: string, foodId: number) => void;
  setGroups: (groups: IngredientGroup[]) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, _get) => ({
      groups: [],

    // method to add a new group. intakes string for group name
    addGroup: (name) =>
      set((state) => {
        const nextDisplayId = state.groups.length + 1;
        return {
          groups: [
            ...state.groups,
            {
              id: uuidv4(),
              name,
              displayId: nextDisplayId,
              ingredients: [],
            },
          ],
        };
      }),

      // method to delete a group. intakes the groups UUID as id
      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== groupId)
        })),

        
      // method to rename a groups name. instakes UUID and new name for group
      renameGroup: (groupId, name) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, name } : group
          )
        })),

      // method to add a food to a group. intakes UUID and foodId to store food in group 
      addFoodToGroup: (groupId: string, foodId: number) =>
        set((state) => ({
          groups: state.groups.map((group) => {
            const isTarget = group.id === groupId;

            return {
              ...group,
              ingredients: isTarget
                ? group.ingredients.some((ing) => ing.foodId === foodId)
                  ? group.ingredients
                  : [...group.ingredients, { foodId, grams: 0 }]
                : group.ingredients.filter((ing) => ing.foodId !== foodId),
            };
          }),
        })),


      // method to set the cooked weight of the food group. intakes UUID and cooked weight in grams
      setCookedWeight: (groupId, grams) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, cookedWeightGrams: grams }
              : group
          )
        })),

      // method to add Ingredient to food group. intakes UUID, foodId and weight in food in grams
      addIngredientToGroup: (groupId: string, foodId: number, grams: number) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  ingredients: group.ingredients.some((i) => i.foodId === foodId)
                    ? group.ingredients
                    : [...group.ingredients, { foodId, grams }],
                }
              : group
          ),
        })),

      // method to set weight in grams of an ingredient in a group. intakes UUID, foodId, and weight in food in grams
      setIngredientGrams: (groupId: string, foodId: number, grams: number) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  ingredients: group.ingredients.map((ing) =>
                    ing.foodId === foodId ? { ...ing, grams } : ing
                  ),
                }
              : group
          ),
        })),

      // method to remove an ingredient from a group. intakes UUID and foodId to remove.
      removeIngredientFromGroup: (groupId: string, foodId: number) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  ingredients: group.ingredients.filter((ing) => ing.foodId !== foodId),
                }
              : group
          ),
        })),

      // this replaces the entire groups array with a new one. used on page load of saved meal, reloading data from prev session, etc.
      setGroups: (groups) => set({ groups }),

      // removes all groups from group store
      clearGroups: () => set({ groups: [] }),


    }),    
    {
      name: "group-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// this function calculates the total raw ingredient grams allocated across all people for a specific food group
// instakes group UUID
export const selectTotalRawForGroup = (groupId: string): number => {
  const allocations = usePersonGroupStore.getState().allocations;
  return Object.values(allocations).reduce((sum, personAlloc) => {
    return sum + (personAlloc[groupId] ?? 0);
  }, 0);
};

