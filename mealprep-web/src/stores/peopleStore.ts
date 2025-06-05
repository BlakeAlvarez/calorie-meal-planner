// store for people information of meal plan

import {create} from "zustand";
import {persist} from "zustand/middleware";

// each person contains the following information
// id, this is created when a person is entered. used in backend
// name, this is the persons name
// targetCalories, the amount of calories this person wants PER MEAL. also used for calculations
// meals, the amount of meals this person wants to meal prep
export interface Person {
	id: string;
	name: string;
	targetCalories: number;
	meals: number;
}

interface PeopleStore {
	people: Person[];
	addPerson: (person: Person) => void;
	removePerson: (id: string) => void;
	updateCalories: (id: string, calories: number) => void;
	renamePerson: (id: string, newName: string) => void;
	updatePerson: (id: string, updates: Partial<Person>) => void;
	clearPeople: () => void;
	setPeople: (people: Person[]) => void;
}

export const usePeopleStore = create<PeopleStore>()(
	persist(
		(set) => ({
			// array of all people
			people: [],

			// add person and their information. intakes person instance
			addPerson: (person) =>
				set((state) => ({
					people: [...state.people, person],
				})),

			// remove a person from the store. requires their id
			removePerson: (id) =>
				set((state) => ({
					people: state.people.filter((p) => p.id !== id),
				})),

			// update the amount of calories a person wants in their meal. requires their id and calories they input
			updateCalories: (id, calories) =>
				set((state) => ({
					people: state.people.map((p) =>
						p.id === id ? {...p, targetCalories: calories} : p,
					),
				})),

			// rename a person, requires their id and the new name input
			renamePerson: (id, newName) =>
				set((state) => ({
					people: state.people.map((p) =>
						p.id === id ? {...p, name: newName} : p,
					),
				})),

			// update a person's data entirely. their calories and name and meal count
			updatePerson: (id, updates) =>
				set((state) => ({
					people: state.people.map((p) =>
						p.id === id ? {...p, ...updates} : p,
					),
				})),

			// this clears all people from the meal.
			clearPeople: () => set({people: []}),

			// this sets all people from the mealsetup page
			setPeople: (people) => set({people}),
		}),
		{
			name: "people-store",
		},
	),
);
