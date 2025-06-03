// store calories for each person

import { create } from "zustand";
import { persist } from "zustand/middleware";

// store contains the calorie allocations per group for each person
// structure is: personId -> groupId -> allocated calories
interface PersonGroupCaloriesState {
  allocations: Record<string, Record<string, number>>;
  setAllocation: (personId: string, groupId: string, kcal: number) => void;
  clearAllocations: () => void;
}

export const usePersonGroupCaloriesStore = create<PersonGroupCaloriesState>()(
  persist(
    (set) => ({
      // object to holding all person -> group calorie allocations
      allocations: {},

      // sets the amount of calories a person is allocated in a specific group
      // intakes personId, groupId and kcal value to store
      setAllocation: (personId, groupId, kcal) =>
        set((state) => {
          const personAlloc = state.allocations[personId] ?? {};
          return {
            allocations: {
              ...state.allocations,
              [personId]: {
                ...personAlloc,
                [groupId]: kcal,
              },
            },
          };
        }),
      
      // clears all calories allocations for all people
      clearAllocations: () => set({ allocations: {} }),
    }),
    {
      name: "person-group-kcal-store",
    }
  )
);
