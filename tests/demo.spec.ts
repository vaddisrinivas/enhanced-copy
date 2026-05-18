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
  expect(text).toContain("github.com/vaddisrinivas/enhanced-copy");
});

test("normal copy remains normal and not enhanced", async ({ page }) => {
  await page.getByText("Enhanced Copy is a drop-in SDK").first().selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("Enhanced Copy is a drop-in SDK");
  expect(text).not.toContain("## Task");
});

test("demo renders SDK-first positioning", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Let your site provide the prompt." })).toBeVisible();
  await expect(page.getByText("Not a bubble. Not a prompt library. Not a clipboard vacuum.")).toBeVisible();
  await expect(page.locator("[data-enhanced-copy]")).toHaveCount(4);
});

test("GitHub-style fixture behaves like an arbitrary website for selection", async ({ page }) => {
  await page.goto("/sites/github.html");
  await expect(page.getByText("GitHub fixture")).toBeVisible();
  await page.locator("[data-copy-target]").selectText();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+C" : "Control+C");
  const text = await page.evaluate(() => navigator.clipboard.readText());

  expect(text).toContain("GitHub fixture");
  expect(text).not.toContain("## Task");
});
