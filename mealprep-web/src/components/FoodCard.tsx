import {useEffect, useRef, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {formatKcal, formatGrams} from "@/utils/format";
import {getKcalPer100g, getKcalPerUnit} from "@/lib/mealUtils";
import {useMealStore} from "@/stores/mealStore";
import {useIngredientInputState} from "@/stores/ingredientInputState";
import {usePeopleStore} from "@/stores/peopleStore";
import type {IngredientPlanMode} from "@/stores/ingredientPlanStore";
import type {Food} from "@/types/food";
import {usePlanDerivedState} from "@/stores/planDerivedState";
import {useGroupStore} from "@/stores/groupStore";
import {usePlanViewOptions} from "@/stores/planViewOptions";

interface FoodCardProps {
	food: Food;
	personId?: string;
}

export const FoodCard: React.FC<FoodCardProps> = ({food, personId}) => {
	const people = usePeopleStore((s) => s.people);
	const person = usePeopleStore
		.getState()
		.people.find((p) => p.id === personId);

	const totalCalories =
		person?.meals && person?.targetCalories
			? person.meals * person.targetCalories
			: usePeopleStore
					.getState()
					.people.reduce(
						(sum, p) => sum + p.meals * p.targetCalories,
						0,
					);

	const {plans, setPlan} = useIngredientInputState();

	const groups = useGroupStore((s) => s.groups);
	const foodIdToGroupId = new Map<number, string>();
	groups.forEach((group) => {
		group.ingredients.forEach((ing) => {
			foodIdToGroupId.set(ing.foodId, group.id);
		});
	});

	const perPersonMode = usePlanViewOptions((s) => s.perPersonMode);

	const existing = plans.find(
		(p) => p.foodId === food.fdcId && p.personId === personId,
	);
	const kcalPer100g = getKcalPer100g(food.fdcId);
	const kcalPerUnit = getKcalPerUnit(food.fdcId);
	const isUnitBased = !!food.unitLabel;

	const [mode, setMode] = useState<IngredientPlanMode>(
		existing?.mode ?? "grams",
	);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [inputValue, setInputValue] = useState("");

	useEffect(() => {
		if (existing?.value != null) {
			setInputValue(existing.value.toString());
		}
	}, [food.fdcId, existing?.value]);

	const debouncedValue = useDebouncedValue(inputValue, 500);
	const userTypedInput = parseFloat(inputValue) || 0;

	const rawKcal = isUnitBased
		? userTypedInput * kcalPerUnit
		: mode === "calories"
			? userTypedInput
			: mode === "grams"
				? (userTypedInput / 100) * kcalPer100g
				: (userTypedInput / 100) * totalCalories;

	const kcal = Math.round(rawKcal * 10) / 10;
	const grams =
		!isUnitBased && kcalPer100g > 0
			? Math.round((rawKcal / kcalPer100g) * 1000) / 10
			: 0;

	// save to store after debounce
	useEffect(() => {
		if (debouncedValue === "") return;

		//  only save plans that match current planning mode
		if (perPersonMode && !personId) return;
		if (!perPersonMode && personId) return;

		const parsed = parseFloat(debouncedValue) || 0;
		const rawKcal = isUnitBased
			? parsed * kcalPerUnit
			: mode === "calories"
				? parsed
				: mode === "grams"
					? (parsed / 100) * kcalPer100g
					: (parsed / 100) * totalCalories;

		const kcal = Math.round(rawKcal * 10) / 10;
		const grams =
			!isUnitBased && kcalPer100g > 0
				? Math.round((rawKcal / kcalPer100g) * 1000) / 10
				: 0;

		const percent =
			mode === "percent"
				? userTypedInput
				: totalCalories > 0
					? Math.round((kcal / totalCalories) * 1000) / 10
					: 0;

		if (!foodIdToGroupId.has(food.fdcId)) {
			useMealStore.getState().updateFood(food.fdcId, {
				rawWeightGrams: grams,
				cookedWeightGrams:
					useMealStore
						.getState()
						.foods.find((f) => f.fdcId === food.fdcId)
						?.cookedWeightGrams ?? undefined,
			});
		}

		console.log("Saving plan:", {
			foodId: food.fdcId,
			mode,
			value: parsed,
			grams,
			kcal,
			percent,
			personId,
		});

		setPlan(
			food.fdcId,
			isUnitBased ? "calories" : mode,
			parsed,
			grams,
			kcal,
			percent,
			personId,
		);
	}, [debouncedValue, mode, kcalPer100g, totalCalories]);

	const handleModeSwitch = (newMode: IngredientPlanMode) => {
		const baseValue = parseFloat(inputValue) || 0;
		const rawKcal = isUnitBased
			? baseValue * kcalPerUnit
			: mode === "calories"
				? baseValue
				: mode === "grams"
					? (baseValue / 100) * kcalPer100g
					: (baseValue / 100) * totalCalories;

		const kcal = Math.round(rawKcal * 10) / 10;
		const grams =
			!isUnitBased && kcalPer100g > 0
				? Math.round((kcal / kcalPer100g) * 1000) / 10
				: 0;

		const percent =
			mode === "percent"
				? baseValue
				: Math.round((kcal / totalCalories) * 1000) / 10;

		let newValue = "";
		if (newMode === "grams") newValue = grams.toFixed(1);
		else if (newMode === "calories") newValue = kcal.toFixed(1);
		else if (newMode === "percent") newValue = percent.toFixed(1);

		setMode(newMode);
		setInputValue(newValue);
		inputRef.current?.focus();
	};

	const displayPercent =
		mode === "percent"
			? Number(inputValue || "0").toFixed(1)
			: (Math.round((kcal / totalCalories) * 1000) / 10).toFixed(1);

	return (
		<Card key={food.fdcId}>
			<CardHeader>
				<CardTitle className="text-base">{food.description}</CardTitle>
				<p className="text-sm text-muted-foreground">
					{isUnitBased
						? `${formatKcal(kcalPerUnit)} / ${food.unitLabel}`
						: `${formatKcal(kcalPer100g)} / 100g`}
				</p>
				{personId && (
					<p className="text-xs text-muted-foreground italic">
						Planning for:{" "}
						{people.find((p) => p.id === personId)?.name}
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex items-center gap-2">
					<Input
						ref={inputRef}
						type="number"
						className="w-28"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder={isUnitBased ? "e.g. 2" : ""}
					/>
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
								variant={
									mode === "calories" ? "default" : "ghost"
								}
								size="sm"
								onClick={() => handleModeSwitch("calories")}
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
					→{" "}
					{isUnitBased
						? `${formatKcal(kcal)} (${displayPercent}%)`
						: `${formatGrams(grams)} (${(grams / 453.592).toFixed(2)} lb), ${kcal.toFixed(1)} kcal (${displayPercent}%)`}
				</p>
			</CardContent>
		</Card>
	);
};
