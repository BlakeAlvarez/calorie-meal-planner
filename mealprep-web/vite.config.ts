import path from "path";
import {defineConfig, loadEnv} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({mode}) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		define: {
			__API_BASE__: JSON.stringify(env.VITE_API_BASE),
		},
		server: {
			host: mode === "development" ? true : "0.0.0.0",
			port: 5173,
			allowedHosts:
				mode === "production" ? ["mealprep-server.local"] : undefined,
		},
		base: env.VITE_BASE_PATH || "/",
	};
});
