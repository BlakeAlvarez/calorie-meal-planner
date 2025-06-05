// component to display the help content for a page

import {useState} from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {HelpCircle} from "lucide-react";

interface HelpButtonProps {
	title: string;
	content: React.ReactNode;
}

export const HelpButton = ({title, content}: HelpButtonProps) => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setOpen(true)}
				className="ml-2"
			>
				<HelpCircle className="w-5 h-5" />
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<div className="text-sm text-muted-foreground space-y-2">
						{content}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
