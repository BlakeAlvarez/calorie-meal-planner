// main menu when app loads
// shows info about the app and button to start meal prepping

import {Button} from "@/components/ui/button";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {useTour} from "@/components/TourProvider";

export default function Menu() {
	const {goToStep} = useStepNavigator();
	const {startTour} = useTour();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
			<h1 className="text-4xl font-bold mb-4">Calorie Meal Prep</h1>
			<p className="text-muted-foreground max-w-xl mb-6">
				Precision batch cooking. Plan your meals, distribute exact
				calories per person, and portion based on real cooked weights.
				No guesswork. No imbalances.
			</p>

			<Button size="lg" className="text-lg px-6 py-4" onClick={startTour}>
				Help Guide
			</Button>

			<Button
				size="lg"
				className="text-lg px-6 py-4"
				onClick={() => goToStep("setup")}
			>
				Start Meal Prepping
			</Button>
		</div>
	);
}
