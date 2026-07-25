import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  webServer: {
    command: "npm run dev --workspace @fairway/web",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    cwd: "../..",
  },
});
