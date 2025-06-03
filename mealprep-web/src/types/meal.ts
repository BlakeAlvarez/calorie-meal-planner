// interface for a saved meal object from the database
export interface Meal {
  id: number;           // unique meal ID (autoincrement from backend)
  name: string;         // user-given name for the meal
  createdAt: string;    // timestamp of when the meal was saved
  createdBy?: string;   // optional user or device ID that saved the meal
  foodsJson: string;    // stringified array of food objects in the meal
  groupsJson: string;   // stringified array of ingredient groups
  isShared: boolean;    // whether the meal was shared (via link or code)
  notes?: string;       // optional notes for a meal
  peopleJson?: string;  // people information for calories per meal
  peopleCount?: number; // amount of people the meal prep was for
  totalMeals?: number;  // total meals the meal prep made
  totalCalories?: number; // total calories for entire meal prep
}