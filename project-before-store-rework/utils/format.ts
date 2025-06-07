// formats a number as kcal string (rounded or rounded up)
export function formatKcal(value: number, roundUp = false): string {
	const rounded = roundUp ? Math.ceil(value) : Math.round(value);
	return `${rounded} kcal`;
}

// formats a number as grams string (rounded or rounded up)
export function formatGrams(value: number, roundUp = false): string {
	const rounded = roundUp ? Math.ceil(value) : Math.round(value);
	return `${rounded} g`;
}
