// page to collect initial meal planning info before building the meal
// streamlined to only ask for meals/week and calories/meal per person

import {useState, useRef} from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {usePeopleStore} from "@/stores/peopleStore";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {StepProgressBar} from "@/components/StepProgressBar";
import {v4 as uuid} from "uuid";

// set to true to allow multi-person planning, false for single person only
const ENABLE_MULTIPLE_PEOPLE = true;

export default function MealSetup() {
	const [numPeople, setNumPeople] = useState("1");
	const [peopleInputs, setPeopleInputs] = useState([
		{id: uuid(), name: "Me", meals: 6, targetCalories: 500},
	]);

	const setPeople = usePeopleStore((s) => s.setPeople);
	const {nextStep} = useStepNavigator();

	// refs for input focus
	const firstNameRef = useRef<HTMLInputElement | null>(null);

	// handle change in number of people (if multi-person enabled)
	const handleNumPeopleChange = (val: string) => {
		setNumPeople(val);
		const n = Math.max(1, parseInt(val) || 1);
		setPeopleInputs((prev) => {
			const arr = prev.slice(0, n);
			while (arr.length < n) {
				arr.push({
					id: uuid(),
					name: `Person ${arr.length + 1}`,
					meals: 6,
					targetCalories: 500,
				});
			}
			return arr;
		});
	};

	// save people and continue
	const handleComplete = () => {
		setPeople(
			peopleInputs.map((p) => ({
				id: p.id,
				name: p.name.trim() || `Person`,
				caloriesPerMeal: p.targetCalories,
				totalMeals: p.meals,
			})),
		);
		nextStep();
	};

	// check if all people are valid
	const allValid = peopleInputs.every(
		(p) =>
			p.name.trim() !== "" &&
			Number.isFinite(p.meals) &&
			p.meals > 0 &&
			Number.isFinite(p.targetCalories) &&
			p.targetCalories > 0,
	);

	return (
		<div className="meal-setup-step p-6 max-w-xl mx-auto space-y-6">
			<StepProgressBar />
			<h1 className="text-2xl font-bold">Start Your Meal Plan</h1>

			{/* multi-person enabled */}
			{ENABLE_MULTIPLE_PEOPLE && (
				<div className="space-y-6">
					<div className="space-y-2">
						<Label>How many people are you prepping for?</Label>
						<Input
							type="number"
							min={1}
							className="w-24"
							value={numPeople}
							onChange={(e) =>
								handleNumPeopleChange(e.target.value)
							}
						/>
					</div>
					{peopleInputs.map((person, i) => (
						<div
							key={person.id}
							className="border p-4 rounded space-y-4 bg-muted/60"
						>
							<div className="space-y-2">
								<Label>Name</Label>
								<Input
									ref={i === 0 ? firstNameRef : undefined}
									className="w-full"
									value={person.name}
									onChange={(e) => {
										const arr = [...peopleInputs];
										arr[i].name = e.target.value;
										setPeopleInputs(arr);
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label>
									How many meals do you want to plan this
									week?
								</Label>
								<Input
									type="number"
									className="w-full"
									min={1}
									value={person.meals}
									onChange={(e) => {
										const arr = [...peopleInputs];
										arr[i].meals = Math.max(
											1,
											parseInt(e.target.value) || 1,
										);
										setPeopleInputs(arr);
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label>How many calories in each meal?</Label>
								<Input
									type="number"
									className="w-full"
									min={1}
									value={person.targetCalories}
									onChange={(e) => {
										const arr = [...peopleInputs];
										arr[i].targetCalories = Math.max(
											1,
											parseInt(e.target.value) || 1,
										);
										setPeopleInputs(arr);
									}}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{/* single-person fallback (never shown if multi enabled) */}
			{!ENABLE_MULTIPLE_PEOPLE && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>
							How many meals do you want to plan this week?
						</Label>
						<Input
							type="number"
							className="w-full"
							min={1}
							value={peopleInputs[0].meals}
							onChange={(e) => {
								const arr = [...peopleInputs];
								arr[0].meals = Math.max(
									1,
									parseInt(e.target.value) || 1,
								);
								setPeopleInputs(arr);
							}}
						/>
					</div>
					<div className="space-y-2">
						<Label>How many calories in each meal?</Label>
						<Input
							type="number"
							className="w-full"
							min={1}
							value={peopleInputs[0].targetCalories}
							onChange={(e) => {
								const arr = [...peopleInputs];
								arr[0].targetCalories = Math.max(
									1,
									parseInt(e.target.value) || 1,
								);
								setPeopleInputs(arr);
							}}
						/>
					</div>
				</div>
			)}

			{/* continue button */}
			<div className="flex justify-end">
				<Button onClick={handleComplete} disabled={!allValid}>
					Start Building
				</Button>
			</div>
		</div>
	);
}
