// store to manage the states of the step flow progress bar and step navigation

import {create} from "zustand";
import {persist} from "zustand/middleware";

export type Step = "setup" | "meal" | "plan" | "cookdistribute";
export const stepOrder: Step[] = ["setup", "meal", "plan", "cookdistribute"];

export const stepLabels: Record<Step, string> = {
	setup: "Setup",
	meal: "Build Meal",
	plan: "Plan",
	cookdistribute: "Cook + Distribute",
};

interface StepStore {
	currentStep: Step;
	setStep: (step: Step) => void;
}

export const useStepStore = create<StepStore>()(
	persist(
		(set) => ({
			currentStep: "meal",

			// set the current step
			setStep: (step) => set({currentStep: step}),
		}),
		{
			name: "step-storage", // key in localStorage
		},
	),
);
