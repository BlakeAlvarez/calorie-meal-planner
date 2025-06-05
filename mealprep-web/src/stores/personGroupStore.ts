// store for people and their allocated food items

import {create} from "zustand";
import {persist, createJSONStorage} from "zustand/middleware";

// stores raw weight allocations for each person
// personId -> groupId -> raw grams
export interface PersonAllocation {
	[personId: string]: {
		[groupId: string]: number;
	};
}

interface PersonGroupState {
	allocations: PersonAllocation;
	setAllocation: (personId: string, groupId: string, grams: number) => void;
	clearAllocations: () => void;
}

export const usePersonGroupStore = create<PersonGroupState>()(
	persist(
		(set, _get) => ({
			// stores all food group allocations per person
			allocations: {},

			// sets the raw grams a person gets from a food group
			// intakes personId, groupId, and gram amount
			setAllocation: (personId, groupId, grams) => {
				set((state) => {
					const personAlloc = state.allocations[personId] ?? {};
					return {
						allocations: {
							...state.allocations,
							[personId]: {
								...personAlloc,
								[groupId]: grams,
							},
						},
					};
				});
			},

			// clears all raw gram allocation from the store
			clearAllocations: () => {
				set({allocations: {}});
			},
		}),
		{
			name: "person-group-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
