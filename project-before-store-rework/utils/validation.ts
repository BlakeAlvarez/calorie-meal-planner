export function isPositiveIntegerString(value: string): boolean {
	if (!value) return false;
	const num = Number(value);
	return Number.isInteger(num) && num > 0;
}
