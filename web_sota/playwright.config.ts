import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 60000,
	retries: 1,
	use: {
		baseURL: "http://127.0.0.1:10784",
		headless: true,
		screenshot: "only-on-failure",
	},
	webServer: [
		{
			command: "uv run python -m notebooklm_fleet_mcp --serve",
			port: 10783,
			cwd: "..",
			timeout: 60000,
			reuseExistingServer: true,
		},
		{
			command: "npm run dev",
			port: 10784,
			cwd: ".",
			timeout: 60000,
			reuseExistingServer: true,
		},
	],
});
