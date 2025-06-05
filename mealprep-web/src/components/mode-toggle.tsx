// used to toggle light and dark modes using shadcn

import {Toggle} from "@/components/ui/toggle";
import {Sun, Moon} from "lucide-react";
import {useTheme} from "@/components/theme-provider";
import {useEffect, useState} from "react";

export function ModeToggle() {
	const {theme, setTheme} = useTheme();
	const [isDark, setIsDark] = useState(theme === "dark");

	useEffect(() => {
		setIsDark(theme === "dark");
	}, [theme]);

	const toggleTheme = () => {
		const newTheme = isDark ? "light" : "dark";
		setTheme(newTheme);
		setIsDark(!isDark);
	};

	return (
		<Toggle
			pressed={isDark}
			onPressedChange={toggleTheme}
			aria-label="Toggle dark mode"
			className="rounded-full"
		>
			{isDark ? (
				<Moon className="w-5 h-5" />
			) : (
				<Sun className="w-5 h-5" />
			)}
		</Toggle>
	);
}
