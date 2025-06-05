// page to collect initial meal planning info before building the meal
// step-by-step wizard to guide through meals, days, kcal, and people setup
// might change to make it more user friendly and quick

import {useState, useEffect} from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {usePeopleStore} from "@/stores/peopleStore";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {StepProgressBar} from "@/components/StepProgressBar";
import {v4 as uuid} from "uuid";
import {useLocation} from "react-router-dom";

export default function MealSetup() {
	// wizard state steps
	const [step, setStep] = useState<
		| "who"
		| "solo_meals"
		| "solo_days"
		| "solo_kcal"
		| "multi_count"
		| "multi_info"
	>("who");

	// solo meal planning states
	const [mealsPerDay, setMealsPerDay] = useState(1);
	const [numDays, setNumDays] = useState(1);
	const [caloriesPerMeal, setCaloriesPerMeal] = useState(500);

	// multi-person setup
	const [numPeople, setNumPeople] = useState(2);
	const [peopleInputs, setPeopleInputs] = useState<
		{
			id: string;
			name: string;
			meals: number;
			targetCalories: number;
		}[]
	>([]);

	const setPeople = usePeopleStore((s) => s.setPeople);
	const {nextStep} = useStepNavigator();
	const location = useLocation();

	// setup for single person
	const handleSoloComplete = () => {
		const totalMeals = mealsPerDay * numDays;
		setPeople([
			{
				id: uuid(),
				name: "Me",
				meals: totalMeals,
				targetCalories: caloriesPerMeal,
			},
		]);
		nextStep();
	};

	// generate blank inputs for multi-person flow
	const handleMultiSetup = () => {
		const newPeople = Array.from({length: numPeople}, (_, i) => ({
			id: uuid(),
			name: `Person ${i + 1}`,
			meals: mealsPerDay * numDays,
			targetCalories: caloriesPerMeal,
		}));
		setPeopleInputs(newPeople);
		setStep("multi_info");
	};

	// finalize multi-person input
	const handleMultiComplete = () => {
		setPeople(peopleInputs);
		nextStep();
	};

	const people = usePeopleStore((s) => s.people);

	// if people already exist, skip setup and go to next step
	useEffect(() => {
		if (people.length > 0 && location.pathname !== "/meal-setup") {
			nextStep();
		}
	}, [people, location.pathname]);

	return (
		<div className="p-6 max-w-xl mx-auto space-y-6">
			<StepProgressBar />
			<h1 className="text-2xl font-bold">Start Your Meal Plan</h1>

			{/* show existing plan if detected */}
			{people.length > 0 && step === "who" && (
				<div className="border p-4 rounded bg-muted text-muted-foreground text-sm mb-4 space-y-2">
					<p className="font-medium text-black">
						Existing Plan Detected:
					</p>
					{people.map((p) => (
						<p key={p.id}>
							{p.name}: {p.meals} meals × {p.targetCalories} kcal
						</p>
					))}
					<div className="flex gap-2 pt-2">
						<Button size="sm" onClick={nextStep}>
							Skip and Continue
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => {
								usePeopleStore.getState().clearPeople();
							}}
						>
							Clear and Start Over
						</Button>
					</div>
				</div>
			)}

			{/* first question: how many people */}
			{step === "who" && (
				<div className="space-y-4">
					<p>How many people are you planning to prep for?</p>
					<div className="flex gap-4">
						<Button onClick={() => setStep("solo_meals")}>
							Just Me
						</Button>
						<Button onClick={() => setStep("multi_count")}>
							More Than Just Myself
						</Button>
					</div>
				</div>
			)}

			{/* single-person setup: meals per day */}
			{step === "solo_meals" && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="block pb-1">
							How many meals per day?
						</Label>
						<Input
							type="number"
							value={mealsPerDay}
							onChange={(e) =>
								setMealsPerDay(parseInt(e.target.value) || 1)
							}
						/>
					</div>
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setStep("who")}
						>
							Back
						</Button>
						<Button onClick={() => setStep("solo_days")}>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* single-person setup: number of days */}
			{step === "solo_days" && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="block pb-1">
							How many days are you planning for?
						</Label>
						<Input
							type="number"
							value={numDays}
							onChange={(e) =>
								setNumDays(parseInt(e.target.value) || 1)
							}
						/>
					</div>
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setStep("solo_meals")}
						>
							Back
						</Button>
						<Button onClick={() => setStep("solo_kcal")}>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* single-person setup: calories per meal */}
			{step === "solo_kcal" && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="block pb-1">
							How many calories per meal?
						</Label>
						<Input
							type="number"
							value={caloriesPerMeal}
							onChange={(e) =>
								setCaloriesPerMeal(
									parseInt(e.target.value) || 0,
								)
							}
						/>
					</div>
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setStep("solo_days")}
						>
							Back
						</Button>
						<Button onClick={handleSoloComplete}>
							Start Building
						</Button>
					</div>
				</div>
			)}

			{/* multi-person setup: how many people */}
			{step === "multi_count" && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="block pb-1">
							How many people are you prepping for?
						</Label>
						<Input
							type="number"
							value={numPeople}
							onChange={(e) =>
								setNumPeople(parseInt(e.target.value) || 1)
							}
						/>
					</div>
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setStep("who")}
						>
							Back
						</Button>
						<Button onClick={handleMultiSetup}>Next</Button>
					</div>
				</div>
			)}

			{/* multi-person setup: details per person */}
			{step === "multi_info" && (
				<div className="space-y-4">
					<p>Enter each person's meal plan:</p>
					{peopleInputs.map((person, index) => (
						<div
							key={person.id}
							className="border p-4 rounded space-y-4"
						>
							<div className="space-y-2">
								<Label className="block pb-1">Name</Label>
								<Input
									value={person.name}
									onChange={(e) => {
										const updated = [...peopleInputs];
										updated[index].name = e.target.value;
										setPeopleInputs(updated);
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label className="block pb-1">Meals</Label>
								<Input
									type="number"
									value={person.meals}
									onChange={(e) => {
										const updated = [...peopleInputs];
										updated[index].meals =
											parseInt(e.target.value) || 1;
										setPeopleInputs(updated);
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label className="block pb-1">
									Calories per meal
								</Label>
								<Input
									type="number"
									value={person.targetCalories}
									onChange={(e) => {
										const updated = [...peopleInputs];
										updated[index].targetCalories =
											parseInt(e.target.value) || 0;
										setPeopleInputs(updated);
									}}
								/>
							</div>
						</div>
					))}
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setStep("multi_count")}
						>
							Back
						</Button>
						<Button onClick={handleMultiComplete}>
							Start Building
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
