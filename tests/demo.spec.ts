import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173"
  });
  await page.goto("/");
});

test("SDK button copies exact enhanced explain text", async ({ page }) => {
  await page.locator(".enhanced-copy-button", { hasText: "Explain" }).first().click();
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("I copied this from Enhanced Copy Demo at http://127.0.0.1:4173/.");
  expect(text).toContain("Task: Explain this clearly and help me use it.");
  expect(text).toContain("Enhanced Copy adds source, intent, and selected content");
});

test("shortcut copies enhanced text when enabled", async ({ page }) => {
  await page.getByText("Enhanced Copy adds source").selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+Shift+C" : "Control+Shift+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("Task: Explain this clearly and help me use it.");
  expect(text).toContain("Enhanced Copy adds source");
});

test("override mode visibly marks normal copy as enhanced in demo", async ({ page }) => {
  await expect(page.locator("[data-enhanced-copy-override='enabled']")).toHaveCount(1);
  await page.getByText("Bug: Cmd+Shift+C works").selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("Task: Summarize the key points");
});
