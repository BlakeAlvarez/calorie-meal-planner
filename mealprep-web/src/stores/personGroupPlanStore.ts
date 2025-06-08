// stores/personGroupPlanStore.ts

import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {PersonGroupPlan} from "@/types/personGroupPlan";

interface PersonGroupPlanStore {
	plans: PersonGroupPlan[];

	// set or update a persons allocation for a group
	setAllocation: (
		personId: string,
		groupId: string,
		mode: "percent" | "kcal",
		value: number,
	) => void;

	// remove a persons allocation for a specific group
	removeAllocation: (personId: string, groupId: string) => void;

	// get all allocations for a specific person
	getPersonAllocations: (personId: string) => PersonGroupPlan[];

	// get all allocations for a specific group
	getGroupAllocations: (groupId: string) => PersonGroupPlan[];

	// get allocation for a person within a group
	getAllocation: (
		personId: string,
		groupId: string,
	) => PersonGroupPlan | undefined;

	// remove all allocations and reset store
	clearAllocations: () => void;

	// get total allocated calories for a person across all groups
	getPersonTotalKcal: (personId: string) => number;

	// get total allocated calories for a group across all people
	getGroupTotalKcal: (groupId: string) => number;

	setPlans: (plans: PersonGroupPlan[]) => void;
}

export const usePersonGroupPlanStore = create<PersonGroupPlanStore>()(
	persist(
		(set, get) => ({
			plans: [],

			setAllocation: (personId, groupId, mode, value) =>
				set((state) => {
					const plans = state.plans.filter(
						(p) =>
							!(p.personId === personId && p.groupId === groupId),
					);
					return {
						plans: [...plans, {personId, groupId, mode, value}],
					};
				}),

			removeAllocation: (personId, groupId) =>
				set((state) => ({
					plans: state.plans.filter(
						(p) =>
							!(p.personId === personId && p.groupId === groupId),
					),
				})),

			getPersonAllocations: (personId) =>
				get().plans.filter((p) => p.personId === personId),

			getGroupAllocations: (groupId) =>
				get().plans.filter((p) => p.groupId === groupId),

			getAllocation: (personId, groupId) =>
				get().plans.find(
					(p) => p.personId === personId && p.groupId === groupId,
				),

			clearAllocations: () => set({plans: []}),

			getPersonTotalKcal: (personId) => {
				return get()
					.plans.filter(
						(p) => p.personId === personId && p.mode === "kcal",
					)
					.reduce((acc, p) => acc + p.value, 0);
			},

			getGroupTotalKcal: (groupId) => {
				return get()
					.plans.filter(
						(p) => p.groupId === groupId && p.mode === "kcal",
					)
					.reduce((acc, p) => acc + p.value, 0);
			},

			setPlans: (plans: PersonGroupPlan[]) => set({plans}),
		}),
		{
			name: "person-group-plan-store",
		},
	),
);
