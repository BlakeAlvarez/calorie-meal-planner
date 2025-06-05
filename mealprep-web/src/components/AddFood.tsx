import {useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {FoodSearch} from "@/components/FoodSearch";
import {CustomFoodForm} from "@/components/CustomFoodForm";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";

export default function AddFood({onClose}: {onClose: () => void}) {
	const [multiAdd, setMultiAdd] = useState(false);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* checkbox for multi-add ingredients */}
			<div className="flex items-center space-x-2 pb-2">
				<Checkbox
					id="multi-add"
					checked={multiAdd}
					onCheckedChange={(val) => setMultiAdd(!!val)}
				/>
				<Label htmlFor="multi-add">Multi-Ingredient Add</Label>
			</div>

			<Tabs
				defaultValue="usda"
				className="flex-1 flex flex-col overflow-hidden"
			>
				<TabsList className="mb-4">
					<TabsTrigger value="usda">USDA Search</TabsTrigger>
					<TabsTrigger value="custom">Add Custom Food</TabsTrigger>
				</TabsList>

				<TabsContent
					value="usda"
					className="flex-1 overflow-y-auto pr-2"
				>
					<FoodSearch multiAdd={multiAdd} onClose={onClose} />
				</TabsContent>

				<TabsContent
					value="custom"
					className="flex-1 overflow-y-auto pr-2"
				>
					<CustomFoodForm multiAdd={multiAdd} onClose={onClose} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
