import {ResponsiveRadialBar} from "@nivo/radial-bar";
import {formatKcal} from "@/utils/format";

interface CalorieGaugeProps {
	totalCalories: number;
	actualCalories: number;
	width?: number;
	height?: number;
}

export function CalorieGauge({
	totalCalories,
	actualCalories,
	width = 200,
	height = 200,
}: CalorieGaugeProps) {
	if (totalCalories <= 0) return null;

	const fillRatio = actualCalories / totalCalories;
	const overRatio = Math.max(fillRatio - 1, 0);
	const cappedRatio = Math.min(fillRatio, 1);
	const dataColors = ["#22c55e", "#ef4444"];

	const data = [
		{
			id: "Planned",
			data: [{x: "Calories", y: cappedRatio * 100}],
		},
		{
			id: "Overage",
			data: [{x: "Overage", y: overRatio * 100}],
		},
	];

	const diff = Math.round(totalCalories - actualCalories);
	const label =
		diff >= 0 ? `${diff} kcal left` : `${Math.abs(diff)} kcal over`;

	return (
		<div style={{width, height, position: "relative"}}>
			<ResponsiveRadialBar
				data={data}
				colors={dataColors}
				maxValue={100}
				startAngle={-90}
				endAngle={90}
				padAngle={0.4}
				radialAxisStart={null}
				circularAxisOuter={null}
				margin={{top: 0, right: 0, bottom: 0, left: 0}}
				innerRadius={0.6}
				borderWidth={0}
				enableTracks={false}
				isInteractive={false}
				enableRadialGrid={false}
				enableCircularGrid={false}
				cornerRadius={2}
			/>

			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					fontWeight: "bold",
					color: diff >= 0 ? "#22c55e" : "#ef4444",
					fontSize: 14,
				}}
			>
				{label}
			</div>
		</div>
	);
}
