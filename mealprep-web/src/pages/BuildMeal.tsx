// page to build meal with various ingredients the user searches or manually adds

import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import AddFood from "@/components/AddFood";
import PeoplePanel from "@/components/PeoplePanel";
import {useGroupStore} from "@/stores/groupStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {MealDragAssign} from "@/components/MealDragAssign";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {StepProgressBar} from "@/components/StepProgressBar";
import {HelpButton} from "@/components/HelpButton";
import {useFoodSearchCacheStore} from "@/stores/foodSearchCacheStore";
import {ClearMealButton} from "@/components/ClearMealButton";
import {useMealStore} from "@/stores/mealStore";

const BuildMeal = () => {
	const {nextStep, prevStep} = useStepNavigator();
	const [addFoodOpen, setAddFoodOpen] = useState(false);
	const [peopleOpen, setPeopleOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

	const {addGroup, groups} = useGroupStore();
	const people = usePeopleStore((s) => s.people);
	const foods = useMealStore((s) => s.foods);

	// when user navigates away from build meal page, clear cached search items
	useEffect(() => {
		return () => {
			useFoodSearchCacheStore.getState().clearCache();
		};
	}, []);

	// when user presses back
	const handleBack = () => {
		if (people.length > 0) {
			setConfirmDialogOpen(true); // prompt confirmation if people already set
		} else {
			prevStep();
		}
	};

	// user confirms going back and clearing people
	const handleConfirmBack = () => {
		// clearPeople();
		setConfirmDialogOpen(false);
		prevStep();
	};

	useEffect(() => {
		console.log("Meal page mounted");
	}, []);

	return (
		<div className="p-6 space-y-4">
			{/* shows user progress bar for meal setup flow */}
			<StepProgressBar />

			{/* top section: back + continue aligned */}
			<div className="space-y-3 mb-4">
				<div className="flex justify-between items-center">
					<Button variant="secondary" onClick={handleBack}>
						Back
					</Button>
					<Button onClick={nextStep}>Continue</Button>
				</div>

				{/* center title and help */}
				<div className="flex flex-col items-center gap-1">
					<h1 className="text-2xl font-bold text-center">
						Your Meal
					</h1>
					<HelpButton
						title="Building Your Meal"
						content={
							<>
								<p>
									This page lets you build your meal by adding
									food items and organizing them into groups.
								</p>
								<ul className="list-disc list-inside ml-4">
									<li>
										Click <strong>Add Food</strong> to
										search or enter foods
									</li>
									<li>
										Use <strong>+ Add Group</strong> to
										organize into cooked batches
									</li>
									<li>Drag foods to assign them to groups</li>
									<li>
										Edit calorie targets with{" "}
										<strong>Edit People</strong>
									</li>
								</ul>
							</>
						}
					/>
				</div>
			</div>

			{/* modal to add food from USDA or custom input */}
			<Dialog open={addFoodOpen} onOpenChange={setAddFoodOpen}>
				<DialogContent className="lg:max-w-screen-lg max-h-screen overflow-y-auto">
					<AddFood onClose={() => setAddFoodOpen(false)} />
				</DialogContent>
			</Dialog>

			{/* modal to add person info for meal prep plan */}
			<Dialog open={peopleOpen} onOpenChange={setPeopleOpen}>
				<DialogContent className="lg:max-w-screen-lg max-h-screen overflow-y-auto">
					<PeoplePanel />
				</DialogContent>
			</Dialog>

			{/* confirmation dialog for leaving step if people are already set */}
			<Dialog
				open={confirmDialogOpen}
				onOpenChange={setConfirmDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Leave Meal Setup?</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						You’ve already entered people. Going back will clear
						this setup. Are you sure?
					</p>
					<div className="pt-4 flex justify-end space-x-2">
						<Button
							variant="ghost"
							onClick={() => setConfirmDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmBack}
						>
							Yes, Go Back
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<div className="flex items-start gap-2 bg-muted rounded-md p-3 text-sm text-muted-foreground border">
				<div>
					<strong>What’s a Dish?</strong>
					<br />A <strong>dish</strong> is a collection of ingredients
					you cook or prep together — like chicken and rice, pasta
					with sauce, or a veggie bowl. Grouping ingredients helps you
					portion and plan accurately.
				</div>
			</div>

			<div className="flex flex-wrap gap-2 mt-2">
				<Button onClick={() => setPeopleOpen(true)}>Edit People</Button>
				<Button onClick={() => setAddFoodOpen(true)}>
					Add Ingredient
				</Button>
				<Button onClick={() => addGroup(`Group ${groups.length + 1}`)}>
					Add Dish
				</Button>
			</div>

			{foods.length > 0 && (
				<details className="mt-4">
					<summary className="cursor-pointer text-sm font-medium underline text-muted-foreground">
						More Actions
					</summary>
					<div className="flex flex-wrap gap-2 mt-2">
						<ClearMealButton />
					</div>
				</details>
			)}

			{/* main layout for assigning food items to groups */}
			<MealDragAssign />
		</div>
	);
};

export default BuildMeal;
