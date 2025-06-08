import React, {
	createContext,
	useContext,
	useMemo,
	useState,
	useCallback,
	useRef,
} from "react";
import Joyride from "react-joyride";
import type {CallBackProps, Step as JoyrideStep} from "react-joyride";
import {useNavigate} from "react-router-dom";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {useStepStore} from "@/stores/stepStore";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
import {getMeal} from "@/lib/useMealApi";
import type {PersonGroupPlan} from "@/types/personGroupPlan";

type TourContextType = {
	startTour: () => void;
};

const TourContext = createContext<TourContextType>({startTour: () => {}});
export const useTour = () => useContext(TourContext);

const steps: (JoyrideStep & {
	stepKey: "setup" | "meal" | "plan" | "cookdistribute";
})[] = [
	{
		stepKey: "setup",
		target: ".people-plan-question",
		content: `Start by selecting the amount of people you are planning for.`,
	},
	{
		stepKey: "meal",
		target: ".build-meal-buttons",
		content: `Add food to your meal and create ingredient groups.`,
	},
	{
		stepKey: "plan",
		target: ".plan-step",
		content: `Assign calories, grams, or percentages for each food.`,
	},
	{
		stepKey: "cookdistribute",
		target: ".cook-distribute-step",
		content: `Input cooked weights and see how portions are distributed.`,
	},
];

export const TourProvider = ({children}: {children: React.ReactNode}) => {
	const [run, setRun] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const {goToStep} = useStepNavigator();
	const navigate = useNavigate();

	// backup of user state before tour
	const backupRef = useRef<null | {
		people: ReturnType<typeof usePeopleStore.getState>["people"];
		foods: ReturnType<typeof useMealStore.getState>["foods"];
		groups: ReturnType<typeof useGroupStore.getState>["groups"];
		plans: ReturnType<typeof usePersonGroupPlanStore.getState>["plans"];
	}>(null);

	// clears all relevant stores for a fresh tour/demo
	const clearMealData = () => {
		usePeopleStore.getState().clearPeople();
		useMealStore.getState().clearMeal();
		useGroupStore.getState().clearGroups();
		usePersonGroupPlanStore.getState().clearAllocations();
	};

	// handles tour step events and completion
	const handleCallback = (data: CallBackProps) => {
		if (["finished", "skipped"].includes(data.status!)) {
			setRun(false);
			setStepIndex(0);

			if (backupRef.current) {
				console.log("♻️ Restoring user data after tour...");
				usePeopleStore.getState().setPeople(backupRef.current.people);
				useMealStore.getState().setFoods(backupRef.current.foods);
				useGroupStore.getState().setGroups(backupRef.current.groups);
				if (usePersonGroupPlanStore.getState().setPlans) {
					usePersonGroupPlanStore
						.getState()
						.setPlans(backupRef.current.plans);
				} else {
					// fallback to clearing allocations if batch set is missing
					usePersonGroupPlanStore.getState().clearAllocations();
				}
				backupRef.current = null;
			} else {
				clearMealData();
			}

			navigate("/");
			return;
		}

		if (data.type === "step:after" && data.action === "next") {
			const nextIndex = (data.index ?? stepIndex) + 1;
			if (nextIndex >= steps.length) {
				setRun(false);
				setStepIndex(0);
				if (backupRef.current) {
					usePeopleStore
						.getState()
						.setPeople(backupRef.current.people);
					useMealStore.getState().setFoods(backupRef.current.foods);
					useGroupStore
						.getState()
						.setGroups(backupRef.current.groups);
					if (usePersonGroupPlanStore.getState().setPlans) {
						usePersonGroupPlanStore
							.getState()
							.setPlans(backupRef.current.plans);
					} else {
						usePersonGroupPlanStore.getState().clearAllocations();
					}
					backupRef.current = null;
				} else {
					clearMealData();
				}
				navigate("/");
				return;
			}

			const nextStep = steps[nextIndex];
			const currentStep = useStepStore.getState().currentStep;

			if (nextStep.stepKey !== currentStep) {
				goToStep(nextStep.stepKey);
				const waitForDom = () => {
					const el = document.querySelector(
						nextStep.target as string,
					);
					const ready =
						useStepStore.getState().currentStep ===
							nextStep.stepKey && el;
					if (ready) {
						setStepIndex(nextIndex);
					} else {
						setTimeout(waitForDom, 100);
					}
				};
				waitForDom();
			} else {
				setStepIndex(nextIndex);
			}
			return;
		}
	};

	// starts app tour and loads the demo meal data
	const startTour = useCallback(async () => {
		const mealStore = useMealStore.getState();
		const groupStore = useGroupStore.getState();
		const peopleStore = usePeopleStore.getState();
		const planStore = usePersonGroupPlanStore.getState();

		const hasData =
			mealStore.foods.length > 0 ||
			groupStore.groups.length > 0 ||
			peopleStore.people.length > 0 ||
			planStore.plans.length > 0;

		if (hasData) {
			backupRef.current = {
				people: [...peopleStore.people],
				foods: [...mealStore.foods],
				groups: [...groupStore.groups],
				plans: [...planStore.plans],
			};
		}

		try {
			const tourMeal = await getMeal(20);

			peopleStore.setPeople([
				{
					id: "a622d358-093e-4fc7-92ef-e3c01cd54b1a",
					name: "Joz",
					totalMeals: 6,
					caloriesPerMeal: 350,
				},
				{
					id: "5ef0a973-a6ea-4c41-85e5-1d5e1c36640b",
					name: "Blake",
					totalMeals: 6,
					caloriesPerMeal: 450,
				},
			]);

			const parsedFoods = JSON.parse(tourMeal.foodsJson || "[]");
			const parsedGroups = JSON.parse(tourMeal.groupsJson || "[]");

			// if demo meal includes person-group plans, use them; otherwise, create empty.
			const extractedPlans: PersonGroupPlan[] =
				tourMeal.personGroupPlansJson
					? JSON.parse(tourMeal.personGroupPlansJson)
					: [];

			// if batch setter exists, use it; otherwise fallback to setAllocation loop.
			if (usePersonGroupPlanStore.getState().setPlans) {
				usePersonGroupPlanStore.getState().setPlans(extractedPlans);
			} else {
				usePersonGroupPlanStore.getState().clearAllocations();
				extractedPlans.forEach((plan) => {
					usePersonGroupPlanStore
						.getState()
						.setAllocation(
							plan.personId,
							plan.groupId,
							plan.mode,
							plan.value,
						);
				});
			}

			mealStore.setFoods(parsedFoods);
			groupStore.setGroups(parsedGroups);
		} catch (err) {
			console.error("Failed to load tour meal:", err);
			return;
		}

		// wait briefly to ensure Plan page re-renders after loading stores
		await new Promise((resolve) => setTimeout(resolve, 50));

		const firstStep = steps[0];
		goToStep(firstStep.stepKey);

		const waitForStepAndDOM = () => {
			const el = document.querySelector(firstStep.target as string);
			const isReady =
				useStepStore.getState().currentStep === firstStep.stepKey && el;
			if (isReady) {
				setRun(true);
				setStepIndex(0);
			} else {
				setTimeout(waitForStepAndDOM, 100);
			}
		};

		waitForStepAndDOM();
	}, [goToStep]);

	const contextValue = useMemo(() => ({startTour}), [startTour]);

	return (
		<TourContext.Provider value={contextValue}>
			{children}
			<Joyride
				key={run ? "run" : "stop"}
				steps={steps}
				run={run}
				stepIndex={stepIndex}
				continuous
				scrollToFirstStep
				showSkipButton
				showProgress
				hideBackButton={false}
				disableOverlayClose
				disableCloseOnEsc
				callback={handleCallback}
				styles={{
					options: {
						arrowColor: "#fff",
						backgroundColor: "white",
						overlayColor: "rgba(0, 0, 0, 0.5)",
						primaryColor: "#4f46e5",
						textColor: "#111827",
						zIndex: 9999,
					},
				}}
			/>
		</TourContext.Provider>
	);
};
