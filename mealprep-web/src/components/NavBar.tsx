import { NavLink, useLocation } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";
import { SaveMealButton } from "@/components/SaveMealButton";
import { ClearMealButton } from "@/components/ClearMealButton";
import { HelpGuideModal } from "./HelpGuideModal"; // will eventually replace with page-specific help buttons

export function NavBar() {
  const location = useLocation();
  const isMealBuilderRoute = ["/build-meal", "/plan", "/cook-distribute"].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3">
      {/* left */}
      <NavLink to="/" className="text-xl font-bold hover:underline">
        🍽️ Calorie Prep
      </NavLink>

      {/* center */}
      <div className="hidden md:flex space-x-4">
        <NavLink to="/" className={({ isActive }) => isActive ? "font-semibold underline" : "hover:underline"}>
          Home
        </NavLink>
        <NavLink to="/build-meal" className={({ isActive }) => isActive ? "font-semibold underline" : "hover:underline"}>
          Meal Builder
        </NavLink>
        <NavLink to="/saved-meals" className={({ isActive }) => isActive ? "font-semibold underline" : "hover:underline"}>
          Saved Meals
        </NavLink>
      </div>

      {/* right */}
      <div className="flex items-center space-x-3">
        <HelpGuideModal /> {/* later replace with per-page help buttons */}
        <ModeToggle />

        {location.pathname === "/build-meal" && <ClearMealButton />}
        {isMealBuilderRoute && <SaveMealButton />}
      </div>
    </nav>
  );
}
