export interface PersonGroupPlan {
	personId: string;
	groupId: string;
	mode: "percent" | "kcal";
	value: number;
}
