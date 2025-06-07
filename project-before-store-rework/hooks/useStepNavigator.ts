import {useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {useStepStore, stepOrder} from "@/stores/stepStore";
import type {Step} from "@/stores/stepStore";

// maps each step to its corresponding route
export const stepRoutes: Record<Step, string> = {
	setup: "/meal-setup",
	meal: "/build-meal",
	plan: "/plan",
	cookdistribute: "/cook-distribute",
};

// inverse mapping: route -> step
const routeToStep = Object.entries(stepRoutes).reduce<Record<string, Step>>(
	(acc, [step, route]) => {
		acc[route.toLowerCase()] = step as Step;
		return acc;
	},
	{},
);

// hook to manage step based navigation throughout the meal flow
export const useStepNavigator = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentStep = useStepStore((s) => s.currentStep);
	const setStep = useStepStore((s) => s.setStep);

	const currentIndex = stepOrder.indexOf(currentStep);

	// sync zustand step store from the current url on mount or route change
	useEffect(() => {
		const path = location.pathname.toLowerCase();
		const matchedStep = routeToStep[path];
		if (matchedStep && matchedStep !== currentStep) {
			setStep(matchedStep);
		}
	}, [location.pathname, currentStep, setStep]);

	const goToStep = (step: Step) => {
		setStep(step);
		navigate(stepRoutes[step]);
	};

	const nextStep = () => {
		if (currentIndex < stepOrder.length - 1) {
			goToStep(stepOrder[currentIndex + 1]);
			window.scrollTo({top: 0, behavior: "smooth"});
		}
	};

	const prevStep = () => {
		if (currentIndex > 0) {
			goToStep(stepOrder[currentIndex - 1]);
		}
	};

	return {currentStep, goToStep, nextStep, prevStep, currentIndex, stepOrder};
};
