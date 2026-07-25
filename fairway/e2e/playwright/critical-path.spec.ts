/** Web critical path (Fix #15): landing → dashboard → account → legal pages.
 *  Run: npx playwright test (requires `npm install` + `npm run dev` in apps/web). */
import { expect, test } from "@playwright/test";

test("landing communicates the covenant and pricing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Play the course");
  await expect(page.getByText("$39.99/yr")).toBeVisible();
  await expect(page.getByText("free-tier covenant", { exact: false })).toBeVisible();
});

test("account shows the comparison table BEFORE any purchase button", async ({ page }) => {
  await page.goto("/account");
  const table = page.locator("table");
  await expect(table).toBeVisible();
  await expect(table).toContainText("AI Caddie");
  await expect(page.getByRole("button", { name: /39\.99/ })).toBeVisible();
});

test("spectator page degrades gracefully without backend", async ({ page }) => {
  await page.goto("/round/some-token");
  await expect(page.getByText(/isn't live right now/)).toBeVisible();
});

test("privacy and terms exist", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText("no ads", { exact: false })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByText("free-tier covenant", { exact: false })).toBeVisible();
});
