// each person contains the following information
// id, this is created when a person is entered. used in backend
// name, this is the persons name
// targetCalories, the amount of calories this person wants PER MEAL. also used for calculations
// meals, the amount of meals this person wants to meal prep
export interface Person {
	id: string;
	name: string;
	caloriesPerMeal: number;
	totalMeals: number;
}
