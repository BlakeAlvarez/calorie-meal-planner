import {NavLink, useLocation} from "react-router-dom";
import {ModeToggle} from "@/components/mode-toggle";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Button} from "@/components/ui/button";
import {Menu} from "lucide-react";

export function NavBar() {
	const location = useLocation();
	const isMealBuilderRoute = [
		"/build-meal",
		"/plan",
		"/cook-distribute",
	].includes(location.pathname);

	return (
		<nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3">
			{/* left (logo / mobile menu) */}
			<div className="flex items-center gap-2">
				{/* hamburger (mobile only) */}
				<Sheet>
					<SheetTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="md:hidden"
						>
							<Menu className="w-5 h-5" />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-64">
						<nav className="flex flex-col gap-4 mt-4 text-lg font-medium">
							<NavLink to="/" className="hover:underline">
								Home
							</NavLink>
							<NavLink
								to="/build-meal"
								className="hover:underline"
							>
								Meal Builder
							</NavLink>
							<NavLink
								to="/saved-meals"
								className="hover:underline"
							>
								Saved Meals
							</NavLink>
						</nav>
					</SheetContent>
				</Sheet>

				{/* logo (always shown) */}
				<NavLink to="/" className="text-xl font-bold hover:underline">
					🍽️ Calorie Prep
				</NavLink>
			</div>

			{/* center (desktop only) */}
			<div className="hidden md:flex space-x-4">
				<NavLink
					to="/"
					className={({isActive}) =>
						isActive ? "font-semibold underline" : "hover:underline"
					}
				>
					Home
				</NavLink>
				<NavLink
					to="/build-meal"
					className={({isActive}) =>
						isActive ? "font-semibold underline" : "hover:underline"
					}
				>
					Meal Builder
				</NavLink>
				<NavLink
					to="/saved-meals"
					className={({isActive}) =>
						isActive ? "font-semibold underline" : "hover:underline"
					}
				>
					Saved Meals
				</NavLink>
			</div>

			{/* right (always visible) */}
			<div className="flex items-center space-x-3">
				<ModeToggle />
			</div>
		</nav>
	);
}
