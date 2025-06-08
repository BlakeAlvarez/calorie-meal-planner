import {useState, useEffect} from "react";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {formatKcal, formatGrams} from "@/utils/format";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import type {IngredientMode} from "@/types/groupIngredient";

// card for editing a single ingredient in a group.
// allows entering grams, kcal, or percent-of-group target.

export function IngredientCard({
	group,
	ing,
	food,
	updateIngredient,
	groupTargetKcal,
}: {
	readonly group: any;
	readonly ing: any;
	readonly food: any;
	readonly updateIngredient: (amount: number, mode: IngredientMode) => void;
	readonly groupTargetKcal: number;
}) {
	const [mode, setMode] = useState<IngredientMode>("grams");
	const [inputValue, setInputValue] = useState("0");
	const kcalPer100g = getEnergyKcal(food.foodNutrients);

	const grams =
		mode === "grams"
			? Math.round(Number(inputValue) || 0)
			: mode === "kcal"
				? Math.round(
						((Number(inputValue) || 0) / (kcalPer100g || 1)) * 100,
					)
				: mode === "percent"
					? Math.round(
							(((Number(inputValue) || 0) / 100) *
								groupTargetKcal) /
								(kcalPer100g / 100 || 1),
						)
					: 0;
	const kcal = Math.round((grams * (kcalPer100g || 0)) / 100);
	const displayPercent =
		groupTargetKcal > 0 ? ((kcal / groupTargetKcal) * 100).toFixed(0) : "0";

	// for unit-based foods, change this logic as needed
	const isUnitBased = false;

	// sync UI inputValue to store when group/ingredient changes or when mode changes
	useEffect(() => {
		if (mode === "grams")
			setInputValue(String(Math.round(ing.amount ?? 0)));
		else if (mode === "kcal")
			setInputValue(
				String(
					Math.round(((ing.amount ?? 0) * (kcalPer100g || 0)) / 100),
				),
			);
		else if (mode === "percent")
			setInputValue(
				groupTargetKcal > 0 && kcalPer100g > 0
					? String(
							Math.round(
								(((ing.amount ?? 0) * (kcalPer100g / 100)) /
									groupTargetKcal) *
									100,
							),
						)
					: "0",
			);
	}, [ing.amount, group.id, mode, kcalPer100g, groupTargetKcal]);

	// when input changes, update store and value, always as integer
	function handleChange(val: string) {
		const intVal = Math.round(Number(val) || 0);
		setInputValue(String(intVal));
		let amount = 0;
		if (mode === "grams") amount = intVal;
		else if (mode === "kcal")
			amount = Math.round((intVal / (kcalPer100g || 1)) * 100);
		else if (mode === "percent")
			amount = Math.round(
				((intVal / 100) * groupTargetKcal) / (kcalPer100g / 100 || 1),
			);
		updateIngredient(amount, mode);
	}

	// when user switches mode, recompute input from current grams in store
	function handleModeSwitch(newMode: IngredientMode) {
		setMode(newMode);
		if (newMode === "grams")
			setInputValue(String(Math.round(ing.amount ?? 0)));
		else if (newMode === "kcal")
			setInputValue(
				String(
					Math.round(((ing.amount ?? 0) * (kcalPer100g || 0)) / 100),
				),
			);
		else if (newMode === "percent")
			setInputValue(
				groupTargetKcal > 0 && kcalPer100g > 0
					? String(
							Math.round(
								(((ing.amount ?? 0) * (kcalPer100g / 100)) /
									groupTargetKcal) *
									100,
							),
						)
					: "0",
			);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{food.description}</CardTitle>
				<p className="text-sm text-muted-foreground">
					{isUnitBased
						? `${formatKcal(kcalPer100g)} / unit`
						: `${formatKcal(kcalPer100g)} / 100g`}
				</p>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex items-center gap-2">
					<Input
						type="number"
						className="w-28"
						step={1}
						value={inputValue}
						onChange={(e) => handleChange(e.target.value)}
						placeholder={isUnitBased ? "e.g. 2" : ""}
						min={0}
						pattern="[0-9]*"
						inputMode="numeric"
					/>

					{/* Mode toggles */}
					{!isUnitBased && (
						<>
							<Button
								variant={mode === "grams" ? "default" : "ghost"}
								size="sm"
								onClick={() => handleModeSwitch("grams")}
							>
								g
							</Button>
							<Button
								variant={mode === "kcal" ? "default" : "ghost"}
								size="sm"
								onClick={() => handleModeSwitch("kcal")}
							>
								kcal
							</Button>
							<Button
								variant={
									mode === "percent" ? "default" : "ghost"
								}
								size="sm"
								onClick={() => handleModeSwitch("percent")}
							>
								%
							</Button>
						</>
					)}
				</div>
				<p className="text-s text-muted-foreground">
					→ {formatGrams(grams)} ({(grams / 453.592).toFixed(2)} lb),{" "}
					{kcal} kcal ({displayPercent}%)
				</p>
			</CardContent>
		</Card>
	);
}
