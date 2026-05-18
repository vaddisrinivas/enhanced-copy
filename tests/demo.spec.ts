import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173"
  });
  await page.goto("/");
});

test("SDK button copies structured enhanced prompt", async ({ page }) => {
  await page.locator(".enhanced-copy-button", { hasText: "Explain" }).first().click();
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("## Source");
  expect(text).toContain("## Task\nExplain this clearly and help me use it.");
  expect(text).toContain("## Copied Content");
  expect(text).toContain("Enhanced Copy is a drop-in SDK");
});

test("normal copy remains normal and not enhanced", async ({ page }) => {
  await page.getByText("Enhanced Copy is a drop-in SDK").selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("Enhanced Copy is a drop-in SDK");
  expect(text).not.toContain("## Task");
});

test("demo renders SDK-first positioning", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Add AI-ready copy buttons in 5 minutes." })).toBeVisible();
  await expect(page.getByText("No background capture")).toBeVisible();
  await expect(page.locator("[data-enhanced-copy]")).toHaveCount(4);
});
