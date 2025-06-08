// page to plan out calories in meal items based on kcal, weight in grams, or percentage of total calories
import {useState, useMemo} from "react";
import {useMealStore} from "@/stores/mealStore";
import {useGroupStore} from "@/stores/groupStore";
import {usePeopleStore} from "@/stores/peopleStore";
import {usePersonGroupPlanStore} from "@/stores/personGroupPlanStore";
import {useStepNavigator} from "@/hooks/useStepNavigator";
import {StepProgressBar} from "@/components/StepProgressBar";
import {Printer, ChevronDown} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {formatKcal} from "@/utils/format";
import {getEnergyKcal} from "@/utils/nutrientUtils";
import {IngredientCard} from "@/components/IngredientCard";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// plan page for meal prepping
export default function Plan() {
	const {nextStep, prevStep} = useStepNavigator();
	const foods = useMealStore((s) => s.foods);
	const groups = useGroupStore((s) => s.groups);
	const people = usePeopleStore((s) => s.people);
	const plans = usePersonGroupPlanStore((s) => s.plans);
	const setAllocation = usePersonGroupPlanStore((s) => s.setAllocation);
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);

	// compute ungrouped foods (not assigned to any group)
	const groupedFoodIds = groups.flatMap((g) =>
		g.ingredients.map((i) => i.foodId),
	);
	const ungroupedFoods = foods.filter((f) => !groupedFoodIds.includes(f.id));

	// create "virtual" group for ungrouped foods
	const ungroupedGroup = useMemo(
		() => ({
			id: "ungrouped",
			name: "Ungrouped",
			color: "#bfc6d1",
			displayId: groups.length + 1,
			ingredients: ungroupedFoods.map((f) => ({
				foodId: f.id,
				amount: 0,
				unit: "g",
				kcal: getEnergyKcal(f.foodNutrients),
			})),
		}),
		[ungroupedFoods, groups.length],
	);

	const allGroups = [
		...groups,
		...(ungroupedFoods.length > 0 ? [ungroupedGroup] : []),
	];

	// table: groupId order for columns
	const groupIds = allGroups.map((g) => g.id);

	// for each person and group, get the percent allocation (0 if missing)
	const getPercent = (personId: string, groupId: string) => {
		const plan = plans.find(
			(p) => p.personId === personId && p.groupId === groupId,
		);
		return plan?.mode === "percent" ? (plan.value ?? 0) : 0;
	};

	// for each group, compute the calorie target (from person's percent allocation)
	const groupTargetKcal: Record<string, number> = {};
	groupIds.forEach((groupId) => {
		let total = 0;
		people.forEach((person) => {
			const plan = plans.find(
				(p) => p.personId === person.id && p.groupId === groupId,
			);
			const percent = plan?.mode === "percent" ? (plan.value ?? 0) : 0;
			const personTotal =
				(person.caloriesPerMeal ?? 0) * (person.totalMeals ?? 1);
			total += (percent / 100) * personTotal;
		});
		groupTargetKcal[groupId] = total;
	});

	return (
		<div className="plan-step space-y-6 p-6">
			{/* shows user progress bar for meal setup flow */}
			<StepProgressBar />

			{/* header and next/back navigation */}
			<div className="space-y-3 mb-4">
				<div className="flex justify-between items-center">
					<Button variant="secondary" onClick={prevStep}>
						Back
					</Button>
					<Button onClick={nextStep}>Continue</Button>
				</div>

				<h1 className="text-xl md:text-2xl font-bold text-center">
					Meal Plan: Group & Ingredient Breakdown
				</h1>

				{/* print button */}
				<Button
					variant="ghost"
					size="icon"
					onClick={() =>
						navigate("/meal-summary", {state: {fromCook: false}})
					}
				>
					<Printer className="w-5 h-5" />
					<span className="sr-only">Print</span>
				</Button>
			</div>

			{/* top table for person/group allocation */}
			<div className="w-full overflow-x-auto max-w-full">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="p-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>Person</span>
										</TooltipTrigger>
										<TooltipContent>
											The name or nickname of the person
											for whom you are planning meals.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							<TableHead className="p-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>Meals</span>
										</TooltipTrigger>
										<TooltipContent>
											Number of meals this person will
											receive in this meal plan.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							<TableHead className="p-2 text-center font-bold text-xl text-muted-foreground">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>×</span>
										</TooltipTrigger>
										<TooltipContent>
											Multiplication. <br />
											Calculates the total calories by
											multiplying Meals × Calories/Meal.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							<TableHead className="p-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>Calories/Meal</span>
										</TooltipTrigger>
										<TooltipContent>
											Target calories in each meal for
											this person.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							<TableHead className="p-2 text-center font-bold text-xl text-muted-foreground">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>=</span>
										</TooltipTrigger>
										<TooltipContent>
											Equals sign.
											<br />
											The result of Meals × Calories/Meal.
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							<TableHead className="p-2">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>Total Calories</span>
										</TooltipTrigger>
										<TooltipContent>
											The total planned calories for this
											person (Meals × Calories/Meal).
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TableHead>

							{allGroups.map((g) => (
								<TableHead
									className="p-2 min-w-[100px]"
									key={g.id}
								>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>{g.name}</span>
											</TooltipTrigger>
											<TooltipContent>
												Percent of this person's total
												calories to come from{" "}
												<b>{g.name}</b>.
												<br />
												Example: 30% means this person
												wants 30% of their meal calories
												from {g.name}.
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{people.map((person) => {
							const totalPersonKcal =
								(person.caloriesPerMeal ?? 0) *
								(person.totalMeals ?? 1);
							return (
								<TableRow key={person.id}>
									<TableCell className="p-2">
										{person.name}
									</TableCell>
									<TableCell className="p-2">
										{person.totalMeals ?? 1}
									</TableCell>
									{/* × symbol */}
									<TableCell className="p-2 text-center font-bold text-xl text-muted-foreground">
										×
									</TableCell>
									<TableCell className="p-2">
										{formatKcal(
											person.caloriesPerMeal ?? 0,
										)}
									</TableCell>
									{/* = symbol */}
									<TableCell className="p-2 text-center font-bold text-xl text-muted-foreground">
										=
									</TableCell>
									<TableCell className="p-2">
										{formatKcal(totalPersonKcal)}
									</TableCell>
									{groupIds.map((groupId) => (
										<TableCell
											className="p-2"
											key={groupId}
										>
											<div className="flex items-center">
												<Input
													type="number"
													className="w-16 border-r-0 rounded-r-none"
													value={getPercent(
														person.id,
														groupId,
													)}
													min={0}
													max={100}
													onChange={(e) =>
														setAllocation(
															person.id,
															groupId,
															"percent",
															Math.max(
																0,
																Math.min(
																	100,
																	Number(
																		e.target
																			.value,
																	),
																),
															),
														)
													}
													placeholder="%"
												/>
												<span
													className="inline-flex items-center px-2 border border-l-0 border-input rounded-r-md bg-muted text-muted-foreground font-semibold"
													style={{height: "36px"}}
												>
													%
												</span>
											</div>
										</TableCell>
									))}
								</TableRow>
							);
						})}

						<TableRow>
							<TableCell
								colSpan={5}
								className="p-2 font-semibold text-right"
							>
								Total Calories:
							</TableCell>
							<TableCell className="p-2 font-semibold">
								{formatKcal(
									people.reduce(
										(sum, p) =>
											sum +
											(p.caloriesPerMeal ?? 0) *
												(p.totalMeals ?? 1),
										0,
									),
								)}
							</TableCell>

							{allGroups.map((_, idx) => (
								<TableCell
									className="p-2"
									key={`empty-${idx}`}
								></TableCell>
							))}
						</TableRow>
					</TableBody>
				</Table>
			</div>

			{/* for each group (including ungrouped), show ingredient planning cards */}
			{allGroups.map((group, idx) => {
				// calculate group total kcal on demand from all ingredient amounts and foods
				const plannedKcal = group.ingredients.reduce((sum, ing) => {
					const food = foods.find((f) => f.id === ing.foodId);
					const kcalPer100g = getEnergyKcal(
						food?.foodNutrients ?? [],
					);
					const kcal =
						ing.unit === "g"
							? Math.round((ing.amount * kcalPer100g) / 100)
							: 0;
					return sum + kcal;
				}, 0);

				const kcalTarget = groupTargetKcal[group.id];
				const kcalRemaining = kcalTarget - plannedKcal;
				const percentRemaining =
					kcalTarget > 0 ? (kcalRemaining / kcalTarget) * 100 : 0;
				if (idx === 0) {
					console.log(group);
					console.log(`planned: ${plannedKcal}`);
					console.log(`target: ${kcalTarget}`);
					console.log(`remaining: ${kcalRemaining}`);
				}

				return (
					<div key={group.id} className="mb-6">
						<div className="flex items-center gap-2 mb-2">
							<span className="font-bold text-lg">
								{group.name}
							</span>
							<span className="text-xs font-semibold text-muted-foreground">
								Target: {formatKcal(kcalTarget)}
							</span>

							<span
								className={`text-xs font-semibold ml-2 ${
									kcalRemaining < 0
										? "text-red-500"
										: "text-green-600"
								}`}
							>
								{formatKcal(kcalRemaining)} (
								{Math.abs(percentRemaining).toFixed(1)}%)
								{kcalRemaining < 0 ? " over" : " remaining"}
							</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{group.ingredients.map((ing) => {
								const food = foods.find(
									(f) => f.id === ing.foodId,
								);
								if (!food) return null;

								return (
									<IngredientCard
										key={food.id}
										group={group}
										ing={ing}
										food={food}
										groupTargetKcal={
											groupTargetKcal[group.id] || 0
										}
										updateIngredient={(amount, mode) => {
											useGroupStore
												.getState()
												.setIngredientAmount(
													group.id,
													food.id,
													amount,
													"g",
												);
										}}
									/>
								);
							})}
						</div>
					</div>
				);
			})}

			{/* collapsible for ungrouped foods if not handled above */}
			{ungroupedFoods.length > 0 && (
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger className="flex items-center text-sm font-semibold">
						<ChevronDown
							className={`mr-2 h-4 w-4 transition-transform duration-300 ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
						Show Ungrouped Foods
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-1 mt-1">
						{ungroupedFoods.map((food) => (
							<p
								key={food.id}
								className="text-sm text-muted-foreground"
							>
								{food.description}
							</p>
						))}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}
