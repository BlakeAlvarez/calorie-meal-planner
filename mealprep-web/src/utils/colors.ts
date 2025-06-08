import type {Group} from "@/types/group";

// pastel group colors for group color assignment
export const pastelGroupColors = [
	"#A7C7E7",
	"#FFD1DC",
	"#B2F9FC",
	"#FFFACD",
	"#C3FDB8",
	"#FFB7B2",
	"#E3CFFF",
	"#E0BBE4",
	"#B5EAD7",
	"#FFFFB5",
	"#FFDAC1",
	"#B5D6C3",
	"#F9C6D9",
	"#C8F7C5",
	"#B0E0E6",
	"#FFE5B4",
	"#C6E2FF",
	"#FFFACD",
	"#D5E1DF",
	"#F6DFEB",
];

// assigns colors from pastelGroupColors to any group missing a color
export function assignColorsToGroups(groups: Group[]): Group[] {
	let colorIdx = 0;
	return groups.map((g) => {
		if (!g.color) {
			// assign a color in order, wrap if needed
			const color =
				pastelGroupColors[colorIdx % pastelGroupColors.length];
			colorIdx++;
			return {...g, color};
		}
		return g;
	});
}
