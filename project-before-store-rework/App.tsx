import {BrowserRouter, Routes, Route} from "react-router-dom";
import {ThemeProvider} from "@/components/theme-provider";
import {Toaster} from "sonner";
import Menu from "@/pages/Menu";
import Meal from "@/pages/BuildMeal";
import Plan from "@/pages/Plan";
import CookDistribute from "@/pages/CookDistribute";
import {NavBar} from "@/components/NavBar";
import SharedMealPage from "@/pages/shared/meal/[id]";
import MealsPage from "@/pages/SavedMeals";
import MealSetup from "@/pages/MealSetup";
import MealSummaryPage from "./pages/MealSummary";
import {TourProvider} from "./components/TourProvider.tsx";

// --mode production for prod, --mode development for dev
const basename = import.meta.env.VITE_ROUTER_BASE;

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<BrowserRouter basename={basename}>
				<TourProvider>
					<NavBar />
					<Routes>
						<Route path="/" element={<Menu />} />
						<Route path="/meal-setup" element={<MealSetup />} />
						<Route path="/build-meal" element={<Meal />} />
						<Route path="/plan" element={<Plan />} />
						<Route
							path="/cook-distribute"
							element={<CookDistribute />}
						/>
						<Route
							path="/shared/meal/:id"
							element={<SharedMealPage />}
						/>
						<Route path="/saved-meals" element={<MealsPage />} />
						<Route
							path="/meal-summary"
							element={<MealSummaryPage />}
						/>
					</Routes>
				</TourProvider>
			</BrowserRouter>
			<Toaster />
		</ThemeProvider>
	);
}

export default App;
