// food object used throughout the meal planning system
export interface Food {
	fdcId: number; // unique food ID from USDA or custom
	dataType: string; // type of food source (Branded, legacy, etc.)
	description: string; // name/label for the food item
	foodNutrients: Nutrient[]; // array of all nutrients for food (kcal, protein, fat, etc.)

	// optional fields
	brandOwner?: string; // brand name if available
	gtinUpc?: string; // UPC code if available
	publicationDate?: string; // date of USDA publish for food item
	ingredients?: string; // raw ingredient list (if branded)
	gramsPerUnit?: number; // grams per unit (not needed for now)
	unitLabel?: string; // unit label for items not weighed in grams
	rawWeightGrams?: number; // raw weight for ungrouped item (optional)
	cookedWeightGrams?: number; // cooked weight for ungrouped item (optional)
	isUnitBased?: boolean; // if the item is unit based or weight based (True for unit based, default to False)
}

// object for all nutrients in food item
export interface Nutrient {
	nutrientId: number; // unique id for the nutrient (from USDA API)
	nutrientName: string; // full name of nutrient (e.g. Protein, Energy)
	nutrientNumber: string; // USDA nutrient number (e.g. 1008)
	unitName: string; // unit of measurement (kcal, g)
	value: number; // numeric amount per 100g of food
}
