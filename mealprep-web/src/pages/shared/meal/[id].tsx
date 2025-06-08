import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {getMeal} from "@/lib/useMealApi";
import {Button} from "@/components/ui/button";
import {usePeopleStore} from "@/stores/peopleStore";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
import type {PersonGroupPlan} from "@/types/personGroupPlan";

export default function SharedMealPage() {
	const {id} = useParams(); // get meal id from URL
	const {goToStep} = useStepNavigator();
	const [loading, setLoading] = useState(true);
	const [mealName, setMealName] = useState("");

	// get people from people store to possibly skip people setup if already exist
	const people = usePeopleStore((s) => s.people);

	// load shared meal from db and store it in meal + group stores
	useEffect(() => {
		async function loadMeal() {
			try {
				const data = await getMeal(Number(id));
				const foods = JSON.parse(data.foodsJson);
				const groups = JSON.parse(data.groupsJson);
				const people = data.peopleJson
					? JSON.parse(data.peopleJson)
					: [];
				const personGroupPlans: PersonGroupPlan[] =
					data.personGroupPlansJson
						? JSON.parse(data.personGroupPlansJson)
						: [];

				useMealStore.getState().setFoods(foods); // load foods
				useGroupStore.getState().setGroups(groups); // load groups
				usePeopleStore.getState().setPeople(people); // load people
				setMealName(data.name); // set meal name

				// Clear and load person-group plans
				const {setPlans, clearAllocations} =
					usePersonGroupPlanStore.getState();
				if (setPlans) {
					setPlans(personGroupPlans);
				} else {
					clearAllocations();
					personGroupPlans.forEach((plan) => {
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
			} catch (err) {
				console.error("Error loading meal:", err);
			} finally {
				setLoading(false);
			}
		}

		if (id) loadMeal();
	}, [id]);

	// show loading message while meal is being fetched
	if (loading) return <p className="p-4">Loading meal...</p>;

	return (
		<div className="p-6 text-center space-y-4">
			<h1 className="text-2xl font-bold">Shared Meal: {mealName}</h1>
			<p>
				This meal has been preloaded. You can adjust people, weights, or
				ingredients now.
			</p>

			{/* button to continue to BuildMeal page */}
			<Button
				onClick={() => {
					if (people.length > 0) {
						goToStep("meal");
					} else {
						goToStep("setup");
					}
				}}
			>
				Start Planning
			</Button>
		</div>
	);
}
