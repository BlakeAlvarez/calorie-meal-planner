// stores/planViewOptions.ts
import {create} from "zustand";

interface PlanViewOptions {
	perPersonMode: boolean;
	setPerPersonMode: (value: boolean) => void;
}

export const usePlanViewOptions = create<PlanViewOptions>((set) => ({
	perPersonMode: false,
	setPerPersonMode: (value) => set({perPersonMode: value}),
}));
