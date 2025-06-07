// page to view all saved meals from the db

import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {getAllMeals} from "@/lib/useMealApi";
import type {Meal} from "@/types/meal";
import {Link} from "react-router-dom";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import MDEditor from "@uiw/react-md-editor";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function SavedMealsPage() {
	const [meals, setMeals] = useState<Meal[]>([]);
	const [search, setSearch] = useState("");
	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const [openNotesMealId, setOpenNotesMealId] = useState<number | null>(null);

	// load all meals from the db on page load
	useEffect(() => {
		getAllMeals().then(setMeals);
	}, []);

	// filters meals based on search input (case insensitive match on meal name)
	const filtered = meals.filter((meal) =>
		meal.name.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="saved-meals-step p-6 space-y-4 overflow-y-auto">
			<h1 className="text-xl font-bold">Saved Meals</h1>

			{/* search bar for meal name filtering */}
			<Input
				placeholder="Search meals..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			{/* render each saved meal as a card */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
				{filtered.map((meal) => {
					// safely parses JSON or returns fallback
					function safeJsonParse<T>(data: unknown, fallback: T): T {
						if (typeof data === "string") {
							try {
								return JSON.parse(data);
							} catch {
								return fallback;
							}
						}
						return data as T;
					}

					const groups = safeJsonParse(meal.groupsJson, []);
					const foods = safeJsonParse(meal.foodsJson, []);

					return (
						<div
							key={meal.id}
							className="border p-4 rounded space-y-2 shadow-sm"
						>
							<div>
								<h2 className="font-semibold text-lg">
									{meal.name}
								</h2>
								<p className="text-sm text-muted-foreground">
									Created by {meal.createdBy} on{" "}
									{new Date(meal.createdAt).toLocaleString(
										"en-US",
										{
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "numeric",
											minute: "2-digit",
											hour12: true,
											timeZone: userTimeZone,
										},
									)}
								</p>
							</div>

							{/* calorie + person summary */}
							{meal.peopleCount != null && (
								<p className="text-sm text-muted-foreground">
									{meal.peopleCount}{" "}
									{meal.peopleCount === 1
										? "person"
										: "people"}
									, {meal.totalMeals} total meals,{" "}
									{meal.totalCalories?.toFixed(0)} kcal total
								</p>
							)}

							{/* collapsible ingredient group table */}
							<Accordion
								type="single"
								collapsible
								className="w-full"
							>
								<AccordionItem value={`item-${meal.id}`}>
									<AccordionTrigger className="text-sm">
										View Ingredients
									</AccordionTrigger>
									<AccordionContent className="overflow-y-auto">
										<ScrollArea className="max-h-60">
											{groups.map((group: any) => (
												<div
													key={group.id}
													className="mb-4"
												>
													<h3 className="text-sm font-semibold mb-1">
														{group.name ||
															`Group ${group.displayId}`}
													</h3>
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>
																	Name
																</TableHead>
																<TableHead>
																	Grams
																</TableHead>
																<TableHead>
																	Kcal
																</TableHead>
																<TableHead>
																	% of Meal
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{group.ingredients.map(
																(ing: any) => {
																	const food =
																		foods.find(
																			(
																				f: any,
																			) =>
																				f.fdcId ===
																				ing.foodId,
																		) as any;
																	const name =
																		food?.description ||
																		ing.description ||
																		ing.name ||
																		"Unnamed";

																	return (
																		<TableRow
																			key={
																				ing.foodId
																			}
																		>
																			<TableCell>
																				{
																					name
																				}
																			</TableCell>
																			<TableCell>
																				{ing.grams?.toFixed(
																					1,
																				) ??
																					"-"}
																			</TableCell>
																			<TableCell>
																				{ing.kcal?.toFixed(
																					1,
																				) ??
																					"-"}
																			</TableCell>
																			<TableCell>
																				{ing.percent?.toFixed(
																					1,
																				) ??
																					"-"}
																			</TableCell>
																		</TableRow>
																	);
																},
															)}
														</TableBody>
													</Table>
												</div>
											))}
										</ScrollArea>
									</AccordionContent>
								</AccordionItem>
							</Accordion>

							{/* full markdown notes preview in modal */}
							{meal.notes && (
								<div className="mt-2 space-y-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setOpenNotesMealId(meal.id)
										}
									>
										View Full Notes
									</Button>

									<Dialog
										open={openNotesMealId === meal.id}
										onOpenChange={(open) => {
											if (!open) setOpenNotesMealId(null);
										}}
									>
										<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle>
													Meal Notes
												</DialogTitle>
											</DialogHeader>
											<ScrollArea className="prose dark:prose-invert max-h-[70vh] mt-2 px-2 py-1 text-sm">
												<MDEditor.Markdown
													source={meal.notes}
													style={{
														backgroundColor:
															"transparent",
														color: "inherit",
													}}
												/>
											</ScrollArea>
										</DialogContent>
									</Dialog>
								</div>
							)}

							{/* load saved meal into editor */}
							<Link to={`/shared/meal/${meal.id}`}>
								<Button size="sm">Load</Button>
							</Link>
						</div>
					);
				})}
			</div>
		</div>
	);
}
