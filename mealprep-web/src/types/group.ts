import type {GroupIngredient} from "@/types/groupIngredient";

export interface Group {
	id: string;
	name: string;
	color: string;
	ingredients: GroupIngredient[];
	cookedWeightGrams?: number;
}
