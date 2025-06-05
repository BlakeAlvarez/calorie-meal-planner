// form to add a custom food item to the meal manually
// supports 2 modes: kcal per 100g OR kcal per unit (unit mode now stores only kcal + label)
// calculates kcal/100g and adds to mealStore as a custom food

import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {useMealStore} from "@/stores/mealStore";
import type {Food} from "@/types/food";
import {toast} from "sonner";
import {Checkbox} from "@/components/ui/checkbox";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";

export function CustomFoodForm({
	multiAdd,
	onClose,
}: {
	multiAdd: boolean;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [mode, setMode] = useState<"per100g" | "perUnit">("per100g");

	// per unit
	const [unitKcal, setUnitKcal] = useState("");
	const [unitLabel, setUnitLabel] = useState("");
	const [gramsPerUnit, setGramsPerUnit] = useState("");

	// per 100g
	const [totalGrams, setTotalGrams] = useState("");
	const [totalCalories, setTotalCalories] = useState("");

	// advanced for entering protein, carbs, fats
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [protein, setProtein] = useState("");
	const [fat, setFat] = useState("");
	const [carbs, setCarbs] = useState("");

	const addFood = useMealStore((s) => s.addFood);

	// handles the adding of food to the meal store given user inputs
	const handleAdd = () => {
		if (!name.trim()) {
			alert("Please enter a food name.");
			return;
		}

		let kcalPer100g = 0;
		let isUnitBased = false;
		let gramsPerUnitValue: number | undefined = undefined;

		if (mode === "perUnit") {
			const kcal = parseFloat(unitKcal.trim());
			const label = unitLabel.trim() || "Unit";
			const grams = parseFloat(gramsPerUnit.trim());

			if (isNaN(kcal) || kcal <= 0) {
				alert("Please enter valid calories per unit.");
				return;
			}

			if (!label) {
				alert("Please enter a valid unit label.");
				return;
			}

			// fallback to 100g if user doesn't specify gramsPerUnit
			const gramsValue = !isNaN(grams) && grams > 0 ? grams : 100;
			kcalPer100g = (kcal / gramsValue) * 100;
			isUnitBased = true;
			gramsPerUnitValue = gramsValue;
		} else {
			const grams = parseFloat(totalGrams.trim());
			const kcal = parseFloat(totalCalories.trim());

			if (isNaN(grams) || isNaN(kcal) || grams <= 0 || kcal <= 0) {
				alert("Please enter valid grams and total calories.");
				return;
			}

			kcalPer100g = (kcal / grams) * 100;
		}

		const food: Food = {
			fdcId: Date.now(),
			description: name.trim(),
			dataType: "Custom",
			foodNutrients: [
				{
					nutrientName: "Energy",
					nutrientNumber: "-1",
					unitName: "kcal",
					value: Math.round(kcalPer100g * 10) / 10,
					nutrientId: -1,
				},
				{
					nutrientName: "Protein",
					nutrientNumber: "-101",
					unitName: "g",
					value: parseFloat(protein) || 0,
					nutrientId: -101,
				},
				{
					nutrientName: "Total lipid (fat)",
					nutrientNumber: "-102",
					unitName: "g",
					value: parseFloat(fat) || 0,
					nutrientId: -102,
				},
				{
					nutrientName: "Carbohydrate, by difference",
					nutrientNumber: "-103",
					unitName: "g",
					value: parseFloat(carbs) || 0,
					nutrientId: -103,
				},
			],
			unitLabel: isUnitBased ? unitLabel.trim() || "Unit" : undefined,
			gramsPerUnit: isUnitBased ? gramsPerUnitValue : undefined,
			isUnitBased,
		};

		addFood(food);
		toast.success("Custom food added to meal.");

		// reset form after gathering all data
		setName("");
		setUnitKcal("");
		setUnitLabel("");
		setGramsPerUnit("");
		setTotalGrams("");
		setTotalCalories("");
		setProtein("");
		setFat("");
		setCarbs("");
		setShowAdvanced(false);
		setMode("per100g");

		if (!multiAdd) {
			onClose();
		}
	};

	return (
		<div className="space-y-4 p-4">
			<h2 className="text-xl font-semibold">Add Custom Food</h2>

			<div className="space-y-2">
				<Label>Food Name</Label>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Egg, Tbsp Oil"
				/>
			</div>

			<Tabs
				value={mode}
				onValueChange={(val) => setMode(val as "per100g" | "perUnit")}
			>
				<TabsList className="my-2">
					<TabsTrigger value="per100g">kcal / 100g</TabsTrigger>
					<TabsTrigger value="perUnit">kcal per Unit</TabsTrigger>
				</TabsList>

				<TabsContent value="per100g">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Total Calories</Label>
							<Input
								type="number"
								value={totalCalories}
								onChange={(e) =>
									setTotalCalories(e.target.value)
								}
								placeholder="e.g. 435"
							/>
						</div>
						<div className="space-y-2">
							<Label>Total Grams</Label>
							<Input
								type="number"
								value={totalGrams}
								onChange={(e) => setTotalGrams(e.target.value)}
								placeholder="e.g. 150"
							/>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="perUnit">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Calories per Unit</Label>
							<Input
								type="number"
								value={unitKcal}
								onChange={(e) => setUnitKcal(e.target.value)}
								placeholder="e.g. 78"
							/>
						</div>
						<div className="space-y-2">
							<Label>Unit Label</Label>
							<Input
								value={unitLabel}
								onChange={(e) => setUnitLabel(e.target.value)}
								placeholder="e.g. egg, slice, tbsp"
							/>
						</div>
					</div>

					<div className="space-y-2 mt-2">
						<Label>Grams per Unit (optional)</Label>
						<Input
							type="number"
							value={gramsPerUnit}
							onChange={(e) => setGramsPerUnit(e.target.value)}
							placeholder="e.g. 50"
						/>
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex items-center space-x-2 mt-2">
				<Checkbox
					id="show-advanced"
					checked={showAdvanced}
					onCheckedChange={(checked) => setShowAdvanced(!!checked)}
				/>
				<Label htmlFor="show-advanced">Add nutritional details</Label>
			</div>

			{showAdvanced && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Protein (g)</Label>
						<Input
							type="number"
							value={protein}
							onChange={(e) => setProtein(e.target.value)}
							placeholder="e.g. 6.3"
						/>
					</div>
					<div className="space-y-2">
						<Label>Fat (g)</Label>
						<Input
							type="number"
							value={fat}
							onChange={(e) => setFat(e.target.value)}
							placeholder="e.g. 5"
						/>
					</div>
					<div className="space-y-2">
						<Label>Carbs (g)</Label>
						<Input
							type="number"
							value={carbs}
							onChange={(e) => setCarbs(e.target.value)}
							placeholder="e.g. 0.6"
						/>
					</div>
				</div>
			)}

			<Button onClick={handleAdd}>Add to Meal</Button>
		</div>
	);
}
